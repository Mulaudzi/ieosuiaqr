<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\Auth;
use App\Services\InvoiceService;
use App\Services\MailService;

class PaymentController
{
    private const PAYFAST_SANDBOX_URL = 'https://sandbox.payfast.co.za/eng/process';
    private const PAYFAST_LIVE_URL = 'https://www.payfast.co.za/eng/process';
    private const PAYFAST_VALID_IPS = [
        '197.97.145.144', '197.97.145.145', '197.97.145.146', '197.97.145.147',
        '41.74.179.192', '41.74.179.193', '41.74.179.194', '41.74.179.195'
    ];

    // Paystack valid IPs (for webhook validation)
    private const PAYSTACK_VALID_IPS = [
        '52.31.139.75', '52.49.173.169', '52.214.14.220'
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
            'notify_url' => "{$appUrl}/api/webhooks/payfast",
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

        // Store pending subscription and payment record
        try {
            Database::beginTransaction();

            $stmt = $pdo->prepare("
                INSERT INTO subscriptions (user_id, plan_id, status, frequency, created_at)
                VALUES (?, ?, 'pending', ?, NOW())
            ");
            $stmt->execute([$user['id'], $plan['id'], $data['frequency']]);

            // Record payment attempt
            self::recordPayment($pdo, $user['id'], $paymentId, (float)$amount, 'pending', 'payfast', "IEOSUIA QR {$data['plan']} Plan ({$data['frequency']})");

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

    /**
     * Handle PayFast webhook (ITN - Instant Transaction Notification)
     */
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
                    // Update payment to failed
                    self::updatePaymentStatus($pdo, $mPaymentId, 'failed');
                    Database::rollback();
                    exit;
                }

                // Get plan
                $stmt = $pdo->prepare("SELECT id FROM plans WHERE name = ?");
                $stmt->execute([$plan]);
                $planData = $stmt->fetch();

                if (!$planData) {
                    error_log("PayFast ITN: Plan not found - {$plan}");
                    self::updatePaymentStatus($pdo, $mPaymentId, 'failed');
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

                // Update payment status to succeeded
                self::updatePaymentStatus($pdo, $mPaymentId, 'succeeded');

                // Get user details for email
                $stmt = $pdo->prepare("SELECT name, email FROM users WHERE id = ?");
                $stmt->execute([$user['id']]);
                $userData = $stmt->fetch();

                // Send payment success email
                $renewalDate = date('M j, Y', strtotime('+1 month'));
                MailService::sendPaymentSuccessEmail(
                    $userData['email'],
                    $userData['name'],
                    $plan,
                    (float)$amountGross,
                    $mPaymentId,
                    $renewalDate
                );

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
                
                // Get user name for email
                $stmt = $pdo->prepare("SELECT name FROM users WHERE email = ?");
                $stmt->execute([$email]);
                $userData = $stmt->fetch();
                $userName = $userData['name'] ?? 'Customer';
                
                // Get current plan before canceling
                $stmt = $pdo->prepare("
                    SELECT p.name as plan_name 
                    FROM subscriptions s
                    JOIN plans p ON s.plan_id = p.id
                    JOIN users u ON s.user_id = u.id
                    WHERE u.email = ? AND s.status = 'active'
                ");
                $stmt->execute([$email]);
                $subData = $stmt->fetch();
                $planName = $subData['plan_name'] ?? 'Pro';
                
                $stmt = $pdo->prepare("
                    UPDATE subscriptions s
                    JOIN users u ON s.user_id = u.id
                    SET s.status = 'canceled', s.updated_at = NOW()
                    WHERE u.email = ? AND s.status = 'active'
                ");
                $stmt->execute([$email]);

                $stmt = $pdo->prepare("UPDATE users SET plan = 'Free', updated_at = NOW() WHERE email = ?");
                $stmt->execute([$email]);

                // Update payment status to failed
                self::updatePaymentStatus($pdo, $mPaymentId, 'failed');

                // Send cancellation email
                MailService::sendSubscriptionCanceledEmail($email, $userName, $planName);

                error_log("PayFast ITN: Subscription canceled for {$email}");
            } catch (\Exception $e) {
                error_log("PayFast ITN cancel error: " . $e->getMessage());
            }
        } elseif ($paymentStatus === 'FAILED') {
            // Handle failed recurring payment
            try {
                $email = $postData['email_address'] ?? '';
                
                // Get user
                $stmt = $pdo->prepare("SELECT id, name FROM users WHERE email = ?");
                $stmt->execute([$email]);
                $user = $stmt->fetch();
                
                if ($user) {
                    // Get user's active subscription
                    $stmt = $pdo->prepare("
                        SELECT s.id, s.plan_id, p.name as plan_name, p.price_monthly_zar
                        FROM subscriptions s
                        JOIN plans p ON s.plan_id = p.id
                        WHERE s.user_id = ? AND s.status = 'active'
                        ORDER BY s.created_at DESC LIMIT 1
                    ");
                    $stmt->execute([$user['id']]);
                    $subscription = $stmt->fetch();
                    
                    if ($subscription) {
                        $amount = (float)($amountGross ?: $subscription['price_monthly_zar']);
                        $failureReason = $postData['payment_status_reason'] ?? 'Payment could not be processed';
                        
                        // Record the failed payment
                        self::recordPayment($pdo, $user['id'], $mPaymentId, $amount, 'failed', 'payfast', 'Recurring payment failed');
                        
                        // Create payment retry
                        \App\Services\PaymentRetryService::createRetry(
                            $user['id'],
                            $subscription['id'],
                            $amount,
                            $mPaymentId,
                            $failureReason
                        );
                        
                        error_log("PayFast ITN: Created payment retry for failed recurring payment - subscription #{$subscription['id']}");
                    }
                }
                
                error_log("PayFast ITN: Payment failed for {$email}");
            } catch (\Exception $e) {
                error_log("PayFast ITN failed payment error: " . $e->getMessage());
            }
        }

        exit;
    }

    /**
     * Handle Paystack webhook
     */
    public static function handlePaystackWebhook(): void
    {
        // Immediately send 200 OK
        http_response_code(200);

        // Get raw POST data
        $input = file_get_contents('php://input');
        
        if (empty($input)) {
            error_log("Paystack Webhook: No data received");
            exit;
        }

        // Validate signature
        $paystackSignature = $_SERVER['HTTP_X_PAYSTACK_SIGNATURE'] ?? '';
        $secretKey = $_ENV['PAYSTACK_SECRET_KEY'] ?? '';
        
        if (!self::validatePaystackSignature($input, $paystackSignature, $secretKey)) {
            error_log("Paystack Webhook: Invalid signature");
            exit;
        }

        $event = json_decode($input, true);
        
        if (!$event || !isset($event['event'])) {
            error_log("Paystack Webhook: Invalid JSON");
            exit;
        }

        error_log("Paystack Webhook received: " . $event['event']);

        $pdo = Database::getInstance();

        switch ($event['event']) {
            case 'charge.success':
                self::handlePaystackChargeSuccess($pdo, $event['data']);
                break;
                
            case 'subscription.create':
                self::handlePaystackSubscriptionCreate($pdo, $event['data']);
                break;
                
            case 'subscription.disable':
            case 'subscription.not_renew':
                self::handlePaystackSubscriptionCancel($pdo, $event['data']);
                break;
                
            case 'charge.failed':
                self::handlePaystackChargeFailed($pdo, $event['data']);
                break;
                
            case 'refund.processed':
                self::handlePaystackRefund($pdo, $event['data']);
                break;
                
            default:
                error_log("Paystack Webhook: Unhandled event - " . $event['event']);
        }

        exit;
    }

    /**
     * Handle Paystack successful charge
     */
    private static function handlePaystackChargeSuccess(\PDO $pdo, array $data): void
    {
        try {
            Database::beginTransaction();

            $email = $data['customer']['email'] ?? '';
            $amountKobo = $data['amount'] ?? 0;
            $amountZar = $amountKobo / 100;
            $reference = $data['reference'] ?? '';
            $metadata = $data['metadata'] ?? [];
            $plan = $metadata['plan'] ?? 'Pro';

            // Get user
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if (!$user) {
                error_log("Paystack: User not found - {$email}");
                Database::rollback();
                return;
            }

            // Get plan
            $stmt = $pdo->prepare("SELECT id FROM plans WHERE name = ?");
            $stmt->execute([$plan]);
            $planData = $stmt->fetch();

            if (!$planData) {
                error_log("Paystack: Plan not found - {$plan}");
                Database::rollback();
                return;
            }

            // Update or create subscription
            $stmt = $pdo->prepare("
                INSERT INTO subscriptions (user_id, plan_id, status, paystack_subscription_code, renewal_date, last_payment_date, created_at)
                VALUES (?, ?, 'active', ?, DATE_ADD(NOW(), INTERVAL 1 MONTH), NOW(), NOW())
                ON DUPLICATE KEY UPDATE 
                    plan_id = VALUES(plan_id),
                    status = 'active',
                    renewal_date = VALUES(renewal_date),
                    last_payment_date = NOW(),
                    updated_at = NOW()
            ");
            $stmt->execute([$user['id'], $planData['id'], $data['subscription_code'] ?? null]);

            // Update user plan
            $stmt = $pdo->prepare("UPDATE users SET plan = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$plan, $user['id']]);

            // Get subscription ID
            $stmt = $pdo->prepare("SELECT id FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1");
            $stmt->execute([$user['id']]);
            $subscription = $stmt->fetch();

            // Create invoice
            InvoiceService::create($user['id'], $subscription['id'], $amountZar, $plan);

            // Record payment
            self::recordPayment($pdo, $user['id'], $reference, $amountZar, 'succeeded', 'paystack', "IEOSUIA QR {$plan} Plan");

            // Get user details for email
            $stmt = $pdo->prepare("SELECT name, email FROM users WHERE id = ?");
            $stmt->execute([$user['id']]);
            $userData = $stmt->fetch();

            // Send payment success email
            $renewalDate = date('M j, Y', strtotime('+1 month'));
            MailService::sendPaymentSuccessEmail(
                $userData['email'],
                $userData['name'],
                $plan,
                $amountZar,
                $reference,
                $renewalDate
            );

            Database::commit();
            error_log("Paystack: Payment processed successfully for {$email}");

        } catch (\Exception $e) {
            Database::rollback();
            error_log("Paystack charge.success error: " . $e->getMessage());
        }
    }

    /**
     * Handle Paystack subscription creation
     */
    private static function handlePaystackSubscriptionCreate(\PDO $pdo, array $data): void
    {
        try {
            $email = $data['customer']['email'] ?? '';
            $subscriptionCode = $data['subscription_code'] ?? '';
            
            $stmt = $pdo->prepare("
                UPDATE subscriptions s
                JOIN users u ON s.user_id = u.id
                SET s.paystack_subscription_code = ?, s.updated_at = NOW()
                WHERE u.email = ? AND s.status = 'active'
            ");
            $stmt->execute([$subscriptionCode, $email]);
            
            error_log("Paystack: Subscription created for {$email}");
        } catch (\Exception $e) {
            error_log("Paystack subscription.create error: " . $e->getMessage());
        }
    }

    /**
     * Handle Paystack subscription cancellation
     */
    private static function handlePaystackSubscriptionCancel(\PDO $pdo, array $data): void
    {
        try {
            $email = $data['customer']['email'] ?? '';
            
            // Get user name and current plan for email
            $stmt = $pdo->prepare("
                SELECT u.name, p.name as plan_name 
                FROM users u
                LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
                LEFT JOIN plans p ON s.plan_id = p.id
                WHERE u.email = ?
            ");
            $stmt->execute([$email]);
            $userData = $stmt->fetch();
            $userName = $userData['name'] ?? 'Customer';
            $planName = $userData['plan_name'] ?? 'Pro';
            
            $stmt = $pdo->prepare("
                UPDATE subscriptions s
                JOIN users u ON s.user_id = u.id
                SET s.status = 'canceled', s.updated_at = NOW()
                WHERE u.email = ? AND s.status = 'active'
            ");
            $stmt->execute([$email]);

            $stmt = $pdo->prepare("UPDATE users SET plan = 'Free', updated_at = NOW() WHERE email = ?");
            $stmt->execute([$email]);
            
            // Send cancellation email
            MailService::sendSubscriptionCanceledEmail($email, $userName, $planName);
            
            error_log("Paystack: Subscription canceled for {$email}");
        } catch (\Exception $e) {
            error_log("Paystack subscription cancel error: " . $e->getMessage());
        }
    }

    /**
     * Handle Paystack failed charge
     */
    private static function handlePaystackChargeFailed(\PDO $pdo, array $data): void
    {
        try {
            $email = $data['customer']['email'] ?? '';
            $reference = $data['reference'] ?? '';
            $amountKobo = $data['amount'] ?? 0;
            $amountZar = $amountKobo / 100;
            $failureMessage = $data['gateway_response'] ?? 'Payment could not be processed';

            // Get user
            $stmt = $pdo->prepare("SELECT id, name FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if ($user) {
                self::recordPayment($pdo, $user['id'], $reference, $amountZar, 'failed', 'paystack', 'Payment failed');
                
                // Check if this is a recurring subscription payment
                $stmt = $pdo->prepare("
                    SELECT s.id, s.plan_id, p.name as plan_name
                    FROM subscriptions s
                    JOIN plans p ON s.plan_id = p.id
                    WHERE s.user_id = ? AND s.status = 'active'
                    ORDER BY s.created_at DESC LIMIT 1
                ");
                $stmt->execute([$user['id']]);
                $subscription = $stmt->fetch();
                
                if ($subscription) {
                    // Create payment retry for subscription payment failure
                    \App\Services\PaymentRetryService::createRetry(
                        $user['id'],
                        $subscription['id'],
                        $amountZar,
                        $reference,
                        $failureMessage
                    );
                    error_log("Paystack: Created payment retry for subscription #{$subscription['id']}");
                } else {
                    // Send simple payment failed email for non-subscription payments
                    MailService::sendPaymentFailedEmail(
                        $email,
                        $user['name'],
                        $amountZar,
                        $failureMessage
                    );
                }
            }
            
            error_log("Paystack: Charge failed for {$email}");
        } catch (\Exception $e) {
            error_log("Paystack charge.failed error: " . $e->getMessage());
        }
    }

    /**
     * Handle Paystack refund
     */
    private static function handlePaystackRefund(\PDO $pdo, array $data): void
    {
        try {
            $email = $data['customer']['email'] ?? '';
            $reference = $data['transaction']['reference'] ?? '';
            $amountKobo = $data['amount'] ?? 0;
            $amountZar = $amountKobo / 100;

            // Get user
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if ($user) {
                self::recordPayment($pdo, $user['id'], 'REF-' . $reference, $amountZar, 'refunded', 'paystack', 'Refund processed');
            }
            
            error_log("Paystack: Refund processed for {$email}");
        } catch (\Exception $e) {
            error_log("Paystack refund error: " . $e->getMessage());
        }
    }

    /**
     * Record payment in payments table
     */
    private static function recordPayment(\PDO $pdo, int $userId, string $paymentId, float $amount, string $status, string $method, string $description): void
    {
        try {
            // Check if payments table exists
            $stmt = $pdo->query("SHOW TABLES LIKE 'payments'");
            if ($stmt->rowCount() === 0) {
                return;
            }

            $stmt = $pdo->prepare("
                INSERT INTO payments (user_id, payment_id, amount_zar, status, payment_method, description, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                    status = VALUES(status),
                    updated_at = NOW()
            ");
            $stmt->execute([$userId, $paymentId, $amount, $status, $method, $description]);
        } catch (\Exception $e) {
            error_log("Failed to record payment: " . $e->getMessage());
        }
    }

    /**
     * Update payment status
     */
    private static function updatePaymentStatus(\PDO $pdo, string $paymentId, string $status): void
    {
        try {
            $stmt = $pdo->query("SHOW TABLES LIKE 'payments'");
            if ($stmt->rowCount() === 0) {
                return;
            }

            $stmt = $pdo->prepare("UPDATE payments SET status = ?, updated_at = NOW() WHERE payment_id = ?");
            $stmt->execute([$status, $paymentId]);
        } catch (\Exception $e) {
            error_log("Failed to update payment status: " . $e->getMessage());
        }
    }

    /**
     * Validate PayFast IP
     */
    private static function validatePayfastIp(string $ip): bool
    {
        $isSandbox = filter_var($_ENV['PAYFAST_SANDBOX'] ?? true, FILTER_VALIDATE_BOOLEAN);
        
        // Allow any IP in sandbox mode
        if ($isSandbox) {
            return true;
        }

        return in_array($ip, self::PAYFAST_VALID_IPS);
    }

    /**
     * Validate PayFast signature
     */
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

    /**
     * Validate Paystack signature
     */
    private static function validatePaystackSignature(string $input, string $signature, string $secretKey): bool
    {
        if (empty($secretKey) || empty($signature)) {
            // In dev mode, allow without signature validation
            $isDev = filter_var($_ENV['PAYSTACK_TEST_MODE'] ?? true, FILTER_VALIDATE_BOOLEAN);
            return $isDev;
        }

        $computedSignature = hash_hmac('sha512', $input, $secretKey);
        return hash_equals($computedSignature, $signature);
    }

    /**
     * Get real-time subscription status
     */
    public static function getSubscriptionStatus(): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();

        // Get current subscription
        $stmt = $pdo->prepare("
            SELECT s.*, p.name as plan_name, p.price_monthly_zar, p.price_annual_zar, p.qr_limit, p.features
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            WHERE s.user_id = ? AND s.status = 'active'
            ORDER BY s.created_at DESC
            LIMIT 1
        ");
        $stmt->execute([$user['id']]);
        $subscription = $stmt->fetch();

        if (!$subscription) {
            // Return free plan info
            $stmt = $pdo->prepare("SELECT * FROM plans WHERE name = 'Free'");
            $stmt->execute();
            $freePlan = $stmt->fetch();
            
            Response::success([
                'plan' => 'Free',
                'status' => 'active',
                'qr_limit' => $freePlan['qr_limit'] ?? 5,
                'features' => json_decode($freePlan['features'] ?? '[]', true),
                'renewal_date' => null,
                'is_synced' => true
            ]);
            return;
        }

        Response::success([
            'id' => $subscription['id'],
            'plan' => $subscription['plan_name'],
            'status' => $subscription['status'],
            'frequency' => $subscription['frequency'],
            'qr_limit' => $subscription['qr_limit'],
            'features' => json_decode($subscription['features'] ?? '[]', true),
            'renewal_date' => $subscription['renewal_date'],
            'last_payment_date' => $subscription['last_payment_date'],
            'price' => $subscription['frequency'] === 'annual' 
                ? $subscription['price_annual_zar'] 
                : $subscription['price_monthly_zar'],
            'is_synced' => true
        ]);
    }

    /**
     * Sync subscription from payment provider
     */
    public static function syncSubscription(): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();

        // Get current subscription
        $stmt = $pdo->prepare("
            SELECT s.*, p.name as plan_name
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            WHERE s.user_id = ? AND s.status = 'active'
            ORDER BY s.created_at DESC
            LIMIT 1
        ");
        $stmt->execute([$user['id']]);
        $subscription = $stmt->fetch();

        if (!$subscription) {
            Response::success(['synced' => true, 'plan' => 'Free']);
            return;
        }

        // Update user plan to match subscription
        $stmt = $pdo->prepare("UPDATE users SET plan = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$subscription['plan_name'], $user['id']]);

        Response::success([
            'synced' => true,
            'plan' => $subscription['plan_name'],
            'status' => $subscription['status'],
            'renewal_date' => $subscription['renewal_date']
        ]);
    }

    /**
     * Send renewal reminder emails for subscriptions expiring within specified days
     * This should be called via cron job daily
     */
    public static function sendRenewalReminders(): void
    {
        // Verify admin API key for cron jobs
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
        $expectedKey = $_ENV['CRON_API_KEY'] ?? '';
        
        if (empty($expectedKey) || $apiKey !== $expectedKey) {
            Response::error('Unauthorized', 401);
            return;
        }

        $pdo = Database::getInstance();
        $sentCount = 0;
        $errors = [];

        // Get subscriptions expiring in 7 days, 3 days, and 1 day
        $reminderDays = [7, 3, 1];

        foreach ($reminderDays as $days) {
            try {
                $stmt = $pdo->prepare("
                    SELECT 
                        s.id,
                        s.renewal_date,
                        s.frequency,
                        u.id as user_id,
                        u.email,
                        u.name,
                        p.name as plan_name,
                        p.price_monthly_zar,
                        p.price_annual_zar
                    FROM subscriptions s
                    JOIN users u ON s.user_id = u.id
                    JOIN plans p ON s.plan_id = p.id
                    WHERE s.status = 'active'
                    AND s.renewal_date = DATE_ADD(CURDATE(), INTERVAL ? DAY)
                ");
                $stmt->execute([$days]);
                $subscriptions = $stmt->fetchAll();

                foreach ($subscriptions as $sub) {
                    $amount = $sub['frequency'] === 'annual' 
                        ? (float)$sub['price_annual_zar'] 
                        : (float)$sub['price_monthly_zar'];
                    
                    $renewalDate = date('M j, Y', strtotime($sub['renewal_date']));
                    
                    $sent = MailService::sendRenewalReminderEmail(
                        $sub['email'],
                        $sub['name'],
                        $sub['plan_name'],
                        $amount,
                        $renewalDate,
                        $days
                    );

                    if ($sent) {
                        $sentCount++;
                        error_log("Renewal reminder sent to {$sub['email']} ({$days} days)");
                    } else {
                        $errors[] = "Failed to send to {$sub['email']}";
                    }
                }
            } catch (\Exception $e) {
                $errors[] = "Error processing {$days}-day reminders: " . $e->getMessage();
                error_log("Renewal reminder error: " . $e->getMessage());
            }
        }

        Response::success([
            'sent' => $sentCount,
            'errors' => $errors
        ]);
    }

    /**
     * Download payment receipt PDF
     */
    public static function downloadReceipt(int $paymentId): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();
        
        // Get payment details
        $stmt = $pdo->prepare("
            SELECT p.*, u.name as user_name, u.email as user_email
            FROM payments p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ? AND p.user_id = ? AND p.status = 'succeeded'
        ");
        $stmt->execute([$paymentId, $user['id']]);
        $payment = $stmt->fetch();
        
        if (!$payment) {
            Response::error('Payment not found', 404);
        }
        
        // Generate receipt HTML
        $html = self::generateReceiptHtml($payment);
        
        // Generate PDF
        $receiptPath = $_ENV['RECEIPTS_PATH'] ?? __DIR__ . '/../../receipts';
        if (!is_dir($receiptPath)) {
            mkdir($receiptPath, 0755, true);
        }
        
        $filename = "receipt_{$payment['payment_id']}.pdf";
        $filepath = "{$receiptPath}/{$filename}";
        
        // Check if PDF already exists
        if (!file_exists($filepath)) {
            try {
                // Use simple HTML to PDF generation (jsPDF compatible HTML)
                file_put_contents("{$receiptPath}/{$payment['payment_id']}.html", $html);
                
                // Store the HTML for now, frontend can convert to PDF
                Response::success([
                    'payment_id' => $payment['payment_id'],
                    'receipt_html' => $html,
                    'amount' => (float)$payment['amount_zar'],
                    'date' => $payment['created_at'],
                    'description' => $payment['description'],
                    'user_name' => $payment['user_name'],
                    'user_email' => $payment['user_email'],
                    'status' => $payment['status']
                ]);
                return;
            } catch (\Exception $e) {
                error_log("Receipt generation error: " . $e->getMessage());
                Response::error('Failed to generate receipt', 500);
            }
        }
        
        Response::success([
            'download_url' => "/receipts/{$filename}",
            'filename' => $filename
        ]);
    }

    /**
     * Generate receipt HTML
     */
    private static function generateReceiptHtml(array $payment): string
    {
        $appUrl = $_ENV['APP_URL'] ?? 'https://qr.ieosuia.com';
        $date = date('F j, Y', strtotime($payment['created_at']));
        $time = date('H:i', strtotime($payment['created_at']));
        $amount = number_format($payment['amount_zar'], 2);
        $paymentMethod = ucfirst($payment['payment_method'] ?? 'Card');
        
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Receipt - {$payment['payment_id']}</title>
    <style>
        body {
            font-family: Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 40px;
            max-width: 600px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #14b8a6;
            padding-bottom: 20px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #14b8a6;
        }
        .logo span {
            color: #0d9488;
        }
        .receipt-title {
            color: #666;
            font-size: 14px;
            margin-top: 10px;
        }
        .status-badge {
            display: inline-block;
            background-color: #dcfce7;
            color: #166534;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            margin-top: 15px;
        }
        .details {
            margin-bottom: 30px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #eee;
        }
        .detail-label {
            color: #666;
        }
        .detail-value {
            font-weight: 600;
        }
        .amount-section {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 30px 0;
            text-align: center;
        }
        .amount-label {
            color: #666;
            font-size: 14px;
        }
        .amount-value {
            font-size: 36px;
            font-weight: bold;
            color: #14b8a6;
            margin: 10px 0;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        .footer a {
            color: #14b8a6;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">IEOSUIA <span>QR</span></div>
        <div class="receipt-title">Payment Receipt</div>
        <div class="status-badge">✓ PAYMENT SUCCESSFUL</div>
    </div>

    <div class="amount-section">
        <div class="amount-label">Amount Paid</div>
        <div class="amount-value">R {$amount}</div>
        <div style="color: #666; font-size: 14px;">South African Rand</div>
    </div>

    <div class="details">
        <div class="detail-row">
            <span class="detail-label">Receipt Number</span>
            <span class="detail-value">{$payment['payment_id']}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Date</span>
            <span class="detail-value">{$date} at {$time}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Customer</span>
            <span class="detail-value">{$payment['user_name']}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Email</span>
            <span class="detail-value">{$payment['user_email']}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Description</span>
            <span class="detail-value">{$payment['description']}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Payment Method</span>
            <span class="detail-value">{$paymentMethod}</span>
        </div>
    </div>

    <div class="footer">
        <p>Thank you for your purchase!</p>
        <p>
            IEOSUIA QR &bull; <a href="{$appUrl}">{$appUrl}</a><br>
            Questions? Contact <a href="mailto:support@ieosuia.com">support@ieosuia.com</a>
        </p>
        <p style="margin-top: 20px; font-size: 11px; color: #999;">
            This is an electronic receipt. No signature required.
        </p>
    </div>
</body>
</html>
HTML;
    }

    /**
     * Process pending payment retries (cron endpoint)
     */
    public static function processPaymentRetries(): void
    {
        // Validate cron API key
        $cronKey = $_ENV['CRON_API_KEY'] ?? '';
        $providedKey = $_GET['key'] ?? $_SERVER['HTTP_X_CRON_KEY'] ?? '';
        
        if (empty($cronKey) || $providedKey !== $cronKey) {
            Response::error('Unauthorized', 401);
        }
        
        try {
            $results = \App\Services\PaymentRetryService::processPendingRetries();
            
            Response::success([
                'message' => 'Payment retries processed',
                'results' => $results
            ]);
        } catch (\Exception $e) {
            error_log("Process retries error: " . $e->getMessage());
            Response::error('Failed to process retries', 500);
        }
    }

    /**
     * Process expired grace periods (cron endpoint)
     */
    public static function processExpiredGracePeriods(): void
    {
        // Validate cron API key
        $cronKey = $_ENV['CRON_API_KEY'] ?? '';
        $providedKey = $_GET['key'] ?? $_SERVER['HTTP_X_CRON_KEY'] ?? '';
        
        if (empty($cronKey) || $providedKey !== $cronKey) {
            Response::error('Unauthorized', 401);
        }
        
        try {
            $results = \App\Services\PaymentRetryService::processExpiredGracePeriods();
            
            Response::success([
                'message' => 'Grace periods processed',
                'results' => $results
            ]);
        } catch (\Exception $e) {
            error_log("Process grace periods error: " . $e->getMessage());
            Response::error('Failed to process grace periods', 500);
        }
    }

    /**
     * Get current retry status for user's subscription
     */
    public static function getRetryStatus(): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();
        
        try {
            // Get user's active subscription
            $stmt = $pdo->prepare("
                SELECT s.id, s.status, s.grace_period_ends_at, s.failed_payment_count,
                       p.name as plan_name
                FROM subscriptions s
                JOIN plans p ON s.plan_id = p.id
                WHERE s.user_id = ? AND s.status IN ('active', 'past_due')
                ORDER BY s.created_at DESC
                LIMIT 1
            ");
            $stmt->execute([$user['id']]);
            $subscription = $stmt->fetch();
            
            if (!$subscription) {
                Response::success([
                    'has_retry' => false,
                    'message' => 'No active subscription'
                ]);
                return;
            }
            
            // Check for active retries
            $retryStatus = \App\Services\PaymentRetryService::getRetryStatus($subscription['id']);
            
            if (!$retryStatus) {
                Response::success([
                    'has_retry' => false,
                    'subscription_status' => $subscription['status'],
                    'plan' => $subscription['plan_name']
                ]);
                return;
            }
            
            // Calculate days remaining in grace period
            $daysRemaining = null;
            if ($retryStatus['grace_period_ends_at']) {
                $gracePeriodEnds = strtotime($retryStatus['grace_period_ends_at']);
                $daysRemaining = max(0, ceil(($gracePeriodEnds - time()) / 86400));
            }
            
            Response::success([
                'has_retry' => true,
                'subscription_status' => $subscription['status'],
                'plan' => $subscription['plan_name'],
                'retry' => [
                    'status' => $retryStatus['status'],
                    'retry_count' => (int)$retryStatus['retry_count'],
                    'max_retries' => (int)$retryStatus['max_retries'],
                    'next_retry_at' => $retryStatus['next_retry_at'],
                    'grace_period_ends_at' => $retryStatus['grace_period_ends_at'],
                    'days_remaining' => $daysRemaining,
                    'failure_reason' => $retryStatus['failure_reason'],
                    'amount' => (float)$retryStatus['amount_zar']
                ]
            ]);
            
        } catch (\Exception $e) {
            error_log("Get retry status error: " . $e->getMessage());
            Response::error('Failed to get retry status', 500);
        }
    }

    /**
     * Handle failed payment and create retry
     */
    public static function handleFailedPayment(int $userId, int $subscriptionId, float $amount, string $paymentId, string $reason): void
    {
        try {
            \App\Services\PaymentRetryService::createRetry($userId, $subscriptionId, $amount, $paymentId, $reason);
        } catch (\Exception $e) {
            error_log("Handle failed payment error: " . $e->getMessage());
        }
    }
}
