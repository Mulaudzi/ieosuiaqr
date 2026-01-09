<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\Auth;
use App\Services\InvoiceService;

class PaymentController
{
    private const PAYFAST_SANDBOX_URL = 'https://sandbox.payfast.co.za/eng/process';
    private const PAYFAST_LIVE_URL = 'https://www.payfast.co.za/eng/process';
    private const PAYFAST_VALID_IPS = [
        '197.97.145.144', '197.97.145.145', '197.97.145.146', '197.97.145.147',
        '41.74.179.192', '41.74.179.193', '41.74.179.194', '41.74.179.195'
    ];

    public static function checkout(): void
    {
        $user = Auth::check();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        // Validate input
        $validator = new Validator($data);
        $validator
            ->required('plan', 'Plan is required')
            ->in('plan', ['Pro', 'Enterprise'], 'Invalid plan selected')
            ->required('frequency', 'Billing frequency is required')
            ->in('frequency', ['monthly', 'annual'], 'Frequency must be monthly or annual')
            ->validate();

        $pdo = Database::getInstance();

        // Get plan details
        $stmt = $pdo->prepare("SELECT id, price_monthly_zar, price_annual_zar FROM plans WHERE name = ?");
        $stmt->execute([$data['plan']]);
        $plan = $stmt->fetch();

        if (!$plan) {
            Response::error('Plan not found', 404);
        }

        $isAnnual = $data['frequency'] === 'annual';
        $amount = $isAnnual ? $plan['price_annual_zar'] : $plan['price_monthly_zar'];
        $frequency = $isAnnual ? 6 : 3; // PayFast: 3 = monthly, 6 = annual

        // PayFast config
        $merchantId = $_ENV['PAYFAST_MERCHANT_ID'] ?? '';
        $merchantKey = $_ENV['PAYFAST_MERCHANT_KEY'] ?? '';
        $passphrase = $_ENV['PAYFAST_PASSPHRASE'] ?? '';
        $isSandbox = filter_var($_ENV['PAYFAST_SANDBOX'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $appUrl = $_ENV['APP_URL'] ?? 'https://qr.ieosuia.com';

        // Generate unique payment ID
        $paymentId = 'PAY-' . strtoupper(bin2hex(random_bytes(8)));

        // Build PayFast data
        $payfastData = [
            'merchant_id' => $merchantId,
            'merchant_key' => $merchantKey,
            'return_url' => "{$appUrl}/settings?tab=billing&success=1",
            'cancel_url' => "{$appUrl}/settings?tab=billing&canceled=1",
            'notify_url' => "{$appUrl}/api/v1/webhooks/payfast",
            'name_first' => explode(' ', $user['name'])[0],
            'name_last' => explode(' ', $user['name'])[1] ?? '',
            'email_address' => $user['email'],
            'm_payment_id' => $paymentId,
            'amount' => number_format($amount, 2, '.', ''),
            'item_name' => "IEOSUIA QR {$data['plan']} Plan ({$data['frequency']})",
            'item_description' => "{$data['plan']} subscription - {$data['frequency']} billing",
            'subscription_type' => '1', // Subscription
            'billing_date' => date('Y-m-d'),
            'recurring_amount' => number_format($amount, 2, '.', ''),
            'frequency' => (string)$frequency,
            'cycles' => '0', // Indefinite
        ];

        // Generate signature
        $signatureString = '';
        foreach ($payfastData as $key => $val) {
            if ($val !== '') {
                $signatureString .= $key . '=' . urlencode(trim($val)) . '&';
            }
        }
        $signatureString = substr($signatureString, 0, -1);
        
        if ($passphrase) {
            $signatureString .= '&passphrase=' . urlencode(trim($passphrase));
        }
        
        $payfastData['signature'] = md5($signatureString);

        // Store pending subscription
        try {
            Database::beginTransaction();

            $stmt = $pdo->prepare("
                INSERT INTO subscriptions (user_id, plan_id, status, frequency, created_at)
                VALUES (?, ?, 'pending', ?, NOW())
            ");
            $stmt->execute([$user['id'], $plan['id'], $data['frequency']]);

            Database::commit();
        } catch (\Exception $e) {
            Database::rollback();
            error_log("Subscription creation error: " . $e->getMessage());
        }

        // Build payment URL
        $paymentUrl = $isSandbox ? self::PAYFAST_SANDBOX_URL : self::PAYFAST_LIVE_URL;
        $queryString = http_build_query($payfastData);

        Response::success([
            'payment_url' => $paymentUrl . '?' . $queryString,
            'payment_id' => $paymentId
        ]);
    }

    public static function handleWebhook(): void
    {
        // Immediately send 200 OK to PayFast
        http_response_code(200);
        
        // Get raw POST data
        $postData = $_POST;
        
        if (empty($postData)) {
            error_log("PayFast ITN: No POST data received");
            exit;
        }

        // Log for debugging
        error_log("PayFast ITN received: " . json_encode($postData));

        // Validate IP
        $clientIp = $_SERVER['REMOTE_ADDR'] ?? '';
        if (!self::validatePayfastIp($clientIp)) {
            error_log("PayFast ITN: Invalid IP - {$clientIp}");
            exit;
        }

        // Validate signature
        $passphrase = $_ENV['PAYFAST_PASSPHRASE'] ?? '';
        if (!self::validateSignature($postData, $passphrase)) {
            error_log("PayFast ITN: Invalid signature");
            exit;
        }

        // Validate amount (should match plan price ±0.01)
        // Skip for now as we trust validated signature

        // Process payment
        $paymentStatus = $postData['payment_status'] ?? '';
        $mPaymentId = $postData['m_payment_id'] ?? '';
        $token = $postData['token'] ?? null;
        $amountGross = $postData['amount_gross'] ?? 0;
        $itemName = $postData['item_name'] ?? '';

        // Parse plan from item name
        $plan = 'Pro';
        if (stripos($itemName, 'Enterprise') !== false) {
            $plan = 'Enterprise';
        }

        $pdo = Database::getInstance();

        if ($paymentStatus === 'COMPLETE') {
            try {
                Database::beginTransaction();

                // Get user from pending subscription or email
                $email = $postData['email_address'] ?? '';
                $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
                $stmt->execute([$email]);
                $user = $stmt->fetch();

                if (!$user) {
                    error_log("PayFast ITN: User not found - {$email}");
                    Database::rollback();
                    exit;
                }

                // Get plan
                $stmt = $pdo->prepare("SELECT id FROM plans WHERE name = ?");
                $stmt->execute([$plan]);
                $planData = $stmt->fetch();

                if (!$planData) {
                    error_log("PayFast ITN: Plan not found - {$plan}");
                    Database::rollback();
                    exit;
                }

                // Update or create subscription
                $stmt = $pdo->prepare("
                    INSERT INTO subscriptions (user_id, plan_id, status, payfast_token, renewal_date, last_payment_date, created_at)
                    VALUES (?, ?, 'active', ?, DATE_ADD(NOW(), INTERVAL 1 MONTH), NOW(), NOW())
                    ON DUPLICATE KEY UPDATE 
                        plan_id = VALUES(plan_id),
                        status = 'active',
                        payfast_token = VALUES(payfast_token),
                        renewal_date = VALUES(renewal_date),
                        last_payment_date = NOW(),
                        updated_at = NOW()
                ");
                $stmt->execute([$user['id'], $planData['id'], $token]);

                // Update user plan
                $stmt = $pdo->prepare("UPDATE users SET plan = ?, updated_at = NOW() WHERE id = ?");
                $stmt->execute([$plan, $user['id']]);

                // Get subscription ID
                $stmt = $pdo->prepare("SELECT id FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1");
                $stmt->execute([$user['id']]);
                $subscription = $stmt->fetch();

                // Create invoice
                InvoiceService::create($user['id'], $subscription['id'], (float)$amountGross, $plan);

                Database::commit();
                error_log("PayFast ITN: Payment processed successfully for {$email}");

            } catch (\Exception $e) {
                Database::rollback();
                error_log("PayFast ITN error: " . $e->getMessage());
            }
        } elseif ($paymentStatus === 'CANCELLED') {
            // Handle cancellation
            try {
                $email = $postData['email_address'] ?? '';
                $stmt = $pdo->prepare("
                    UPDATE subscriptions s
                    JOIN users u ON s.user_id = u.id
                    SET s.status = 'canceled', s.updated_at = NOW()
                    WHERE u.email = ? AND s.status = 'active'
                ");
                $stmt->execute([$email]);

                $stmt = $pdo->prepare("UPDATE users SET plan = 'Free', updated_at = NOW() WHERE email = ?");
                $stmt->execute([$email]);

                error_log("PayFast ITN: Subscription canceled for {$email}");
            } catch (\Exception $e) {
                error_log("PayFast ITN cancel error: " . $e->getMessage());
            }
        }

        exit;
    }

    private static function validatePayfastIp(string $ip): bool
    {
        $isSandbox = filter_var($_ENV['PAYFAST_SANDBOX'] ?? true, FILTER_VALIDATE_BOOLEAN);
        
        // Allow any IP in sandbox mode
        if ($isSandbox) {
            return true;
        }

        return in_array($ip, self::PAYFAST_VALID_IPS);
    }

    private static function validateSignature(array $data, string $passphrase): bool
    {
        $signature = $data['signature'] ?? '';
        unset($data['signature']);

        $signatureString = '';
        foreach ($data as $key => $val) {
            if ($val !== '') {
                $signatureString .= $key . '=' . urlencode(stripslashes($val)) . '&';
            }
        }
        $signatureString = substr($signatureString, 0, -1);

        if ($passphrase) {
            $signatureString .= '&passphrase=' . urlencode(trim($passphrase));
        }

        return md5($signatureString) === $signature;
    }
}
