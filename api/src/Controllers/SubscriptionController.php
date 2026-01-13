<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\Auth;
use App\Services\InvoiceService;
use App\Services\MailService;

class SubscriptionController
{
    public static function getPlans(): void
    {
        $pdo = Database::getInstance();
        $stmt = $pdo->query("SELECT id, name, price_monthly_zar, price_annual_zar, qr_limit, features FROM plans ORDER BY price_monthly_zar");
        $plans = $stmt->fetchAll();

        foreach ($plans as &$plan) {
            $plan['features'] = json_decode($plan['features'], true);
            $plan['annual_discount'] = 20; // 20% off for annual
        }

        Response::success($plans);
    }

    public static function getCurrentSubscription(): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();

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
                'qr_limit' => $freePlan['qr_limit'],
                'features' => json_decode($freePlan['features'], true),
                'renewal_date' => null
            ]);
            return;
        }

        Response::success([
            'id' => $subscription['id'],
            'plan' => $subscription['plan_name'],
            'status' => $subscription['status'],
            'frequency' => $subscription['frequency'],
            'qr_limit' => $subscription['qr_limit'],
            'features' => json_decode($subscription['features'], true),
            'renewal_date' => $subscription['renewal_date'],
            'price' => $subscription['frequency'] === 'annual' 
                ? $subscription['price_annual_zar'] 
                : $subscription['price_monthly_zar']
        ]);
    }

    /**
     * Get proration preview for plan change
     */
    public static function getProrationPreview(): void
    {
        $user = Auth::check();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $validator = new Validator($data);
        $validator
            ->required('plan', 'Plan is required')
            ->in('plan', ['Free', 'Pro', 'Enterprise'], 'Invalid plan selected')
            ->required('frequency', 'Billing frequency is required')
            ->in('frequency', ['monthly', 'annual'], 'Frequency must be monthly or annual')
            ->validate();

        $pdo = Database::getInstance();
        
        // Get current subscription
        $stmt = $pdo->prepare("
            SELECT s.*, p.name as plan_name, p.price_monthly_zar, p.price_annual_zar
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            WHERE s.user_id = ? AND s.status = 'active'
            LIMIT 1
        ");
        $stmt->execute([$user['id']]);
        $currentSub = $stmt->fetch();
        
        // Get new plan
        $stmt = $pdo->prepare("SELECT * FROM plans WHERE name = ?");
        $stmt->execute([$data['plan']]);
        $newPlan = $stmt->fetch();
        
        if (!$newPlan) {
            Response::error('Plan not found', 404);
        }
        
        $isAnnual = $data['frequency'] === 'annual';
        $newPlanPrice = $isAnnual ? $newPlan['price_annual_zar'] : $newPlan['price_monthly_zar'];
        
        // Calculate proration
        $currentPlanName = $currentSub ? $currentSub['plan_name'] : 'Free';
        $currentPlanPrice = 0;
        $daysRemaining = 0;
        $daysInCycle = 30;
        $creditRemaining = 0;
        
        if ($currentSub && $currentSub['renewal_date']) {
            $currentFrequency = $currentSub['frequency'] ?? 'monthly';
            $currentPlanPrice = $currentFrequency === 'annual' 
                ? $currentSub['price_annual_zar'] 
                : $currentSub['price_monthly_zar'];
            
            $renewalDate = new \DateTime($currentSub['renewal_date']);
            $now = new \DateTime();
            
            // Calculate days in cycle
            $daysInCycle = $currentFrequency === 'annual' ? 365 : 30;
            
            // Calculate remaining days
            if ($renewalDate > $now) {
                $daysRemaining = $now->diff($renewalDate)->days;
            }
            
            // Calculate credit for remaining time (prorated)
            if ($daysRemaining > 0 && $currentPlanPrice > 0) {
                $dailyRate = $currentPlanPrice / $daysInCycle;
                $creditRemaining = round($dailyRate * $daysRemaining, 2);
            }
        }
        
        // Determine if upgrade or downgrade
        $planOrder = ['Free' => 0, 'Pro' => 1, 'Enterprise' => 2];
        $isUpgrade = $planOrder[$data['plan']] > $planOrder[$currentPlanName];
        
        // Calculate amount due
        $amountDue = 0;
        $effectiveDate = date('M j, Y');
        
        if ($isUpgrade) {
            // Upgrade: charge prorated difference
            $amountDue = max(0, $newPlanPrice - $creditRemaining);
            $effectiveDate = date('M j, Y'); // Immediate
        } else {
            // Downgrade: no charge, takes effect at end of cycle
            $amountDue = 0;
            $effectiveDate = $currentSub && $currentSub['renewal_date'] 
                ? date('M j, Y', strtotime($currentSub['renewal_date']))
                : date('M j, Y');
        }
        
        Response::success([
            'current_plan' => $currentPlanName,
            'new_plan' => $data['plan'],
            'current_plan_price' => (float)$currentPlanPrice,
            'new_plan_price' => (float)$newPlanPrice,
            'days_remaining' => $daysRemaining,
            'days_in_cycle' => $daysInCycle,
            'credit_remaining' => $creditRemaining,
            'amount_due' => round($amountDue, 2),
            'effective_date' => $effectiveDate,
            'is_upgrade' => $isUpgrade
        ]);
    }

    /**
     * Change subscription plan with proration
     */
    public static function changePlan(): void
    {
        $user = Auth::check();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $validator = new Validator($data);
        $validator
            ->required('plan', 'Plan is required')
            ->in('plan', ['Free', 'Pro', 'Enterprise'], 'Invalid plan selected')
            ->required('frequency', 'Billing frequency is required')
            ->in('frequency', ['monthly', 'annual'], 'Frequency must be monthly or annual')
            ->validate();

        $pdo = Database::getInstance();
        
        // Get current subscription
        $stmt = $pdo->prepare("
            SELECT s.*, p.name as plan_name, p.price_monthly_zar, p.price_annual_zar
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            WHERE s.user_id = ? AND s.status = 'active'
            LIMIT 1
        ");
        $stmt->execute([$user['id']]);
        $currentSub = $stmt->fetch();
        
        // Get new plan
        $stmt = $pdo->prepare("SELECT * FROM plans WHERE name = ?");
        $stmt->execute([$data['plan']]);
        $newPlan = $stmt->fetch();
        
        if (!$newPlan) {
            Response::error('Plan not found', 404);
        }
        
        $currentPlanName = $currentSub ? $currentSub['plan_name'] : 'Free';
        
        // Same plan check
        if ($currentPlanName === $data['plan']) {
            Response::error('You are already on this plan', 400);
        }
        
        // Determine upgrade/downgrade
        $planOrder = ['Free' => 0, 'Pro' => 1, 'Enterprise' => 2];
        $isUpgrade = $planOrder[$data['plan']] > $planOrder[$currentPlanName];
        
        $isAnnual = $data['frequency'] === 'annual';
        $newPlanPrice = $isAnnual ? $newPlan['price_annual_zar'] : $newPlan['price_monthly_zar'];
        
        // Handle downgrade to Free
        if ($data['plan'] === 'Free') {
            // Schedule downgrade at end of billing cycle
            if ($currentSub) {
                $stmt = $pdo->prepare("
                    UPDATE subscriptions 
                    SET status = 'pending_downgrade',
                        pending_plan_id = (SELECT id FROM plans WHERE name = 'Free'),
                        updated_at = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([$currentSub['id']]);
            }
            
            Response::success([
                'message' => 'Your plan will be downgraded to Free at the end of your billing cycle.',
                'effective_date' => $currentSub && $currentSub['renewal_date'] 
                    ? date('M j, Y', strtotime($currentSub['renewal_date']))
                    : date('M j, Y')
            ]);
            return;
        }
        
        // Calculate proration for upgrades
        if ($isUpgrade && $currentSub && $currentSub['renewal_date']) {
            $currentFrequency = $currentSub['frequency'] ?? 'monthly';
            $currentPlanPrice = $currentFrequency === 'annual' 
                ? $currentSub['price_annual_zar'] 
                : $currentSub['price_monthly_zar'];
            
            $renewalDate = new \DateTime($currentSub['renewal_date']);
            $now = new \DateTime();
            $daysInCycle = $currentFrequency === 'annual' ? 365 : 30;
            $daysRemaining = 0;
            
            if ($renewalDate > $now) {
                $daysRemaining = $now->diff($renewalDate)->days;
            }
            
            $creditRemaining = 0;
            if ($daysRemaining > 0 && $currentPlanPrice > 0) {
                $dailyRate = $currentPlanPrice / $daysInCycle;
                $creditRemaining = round($dailyRate * $daysRemaining, 2);
            }
            
            $amountDue = max(0, $newPlanPrice - $creditRemaining);
            
            // If amount due after credit, redirect to payment
            if ($amountDue > 0) {
                // Use PaymentController to generate checkout URL
                $paymentId = 'CHG-' . strtoupper(bin2hex(random_bytes(8)));
                
                $merchantId = $_ENV['PAYFAST_MERCHANT_ID'] ?? '';
                $merchantKey = $_ENV['PAYFAST_MERCHANT_KEY'] ?? '';
                $passphrase = $_ENV['PAYFAST_PASSPHRASE'] ?? '';
                $isSandbox = filter_var($_ENV['PAYFAST_SANDBOX'] ?? true, FILTER_VALIDATE_BOOLEAN);
                $appUrl = $_ENV['APP_URL'] ?? 'https://qr.ieosuia.com';
                
                $payfastData = [
                    'merchant_id' => $merchantId,
                    'merchant_key' => $merchantKey,
                    'return_url' => "{$appUrl}/settings?tab=billing&success=1&upgrade=1",
                    'cancel_url' => "{$appUrl}/settings?tab=billing&canceled=1",
                    'notify_url' => "{$appUrl}/api/webhooks/payfast",
                    'name_first' => explode(' ', $user['name'])[0],
                    'name_last' => explode(' ', $user['name'])[1] ?? '',
                    'email_address' => $user['email'],
                    'm_payment_id' => $paymentId,
                    'amount' => number_format($amountDue, 2, '.', ''),
                    'item_name' => "Upgrade to {$data['plan']} Plan (Prorated)",
                    'item_description' => "Plan upgrade with R" . number_format($creditRemaining, 2) . " credit applied",
                    'custom_str1' => $data['plan'],
                    'custom_str2' => $data['frequency'],
                    'custom_str3' => 'upgrade',
                    'custom_int1' => $user['id'],
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
                
                // Record pending payment
                try {
                    $stmt = $pdo->prepare("
                        INSERT INTO payments (user_id, payment_id, amount_zar, status, payment_method, description, provider, created_at)
                        VALUES (?, ?, ?, 'pending', 'payfast', ?, 'payfast', NOW())
                    ");
                    $stmt->execute([
                        $user['id'],
                        $paymentId,
                        $amountDue,
                        "Upgrade to {$data['plan']} Plan (Prorated)"
                    ]);
                } catch (\Exception $e) {
                    error_log("Payment record error: " . $e->getMessage());
                }
                
                $paymentUrl = ($isSandbox ? 'https://sandbox.payfast.co.za/eng/process' : 'https://www.payfast.co.za/eng/process');
                $queryString = http_build_query($payfastData);
                
                Response::success([
                    'payment_url' => $paymentUrl . '?' . $queryString,
                    'payment_id' => $paymentId,
                    'amount_due' => $amountDue,
                    'credit_applied' => $creditRemaining
                ]);
                return;
            }
        }
        
        // Immediate upgrade if no payment needed (credit covers full amount)
        try {
            Database::beginTransaction();
            
            // Update or create subscription
            if ($currentSub) {
                $stmt = $pdo->prepare("
                    UPDATE subscriptions 
                    SET plan_id = ?,
                        frequency = ?,
                        status = 'active',
                        renewal_date = DATE_ADD(NOW(), INTERVAL ? DAY),
                        updated_at = NOW()
                    WHERE id = ?
                ");
                $daysToAdd = $isAnnual ? 365 : 30;
                $stmt->execute([$newPlan['id'], $data['frequency'], $daysToAdd, $currentSub['id']]);
            } else {
                $stmt = $pdo->prepare("
                    INSERT INTO subscriptions (user_id, plan_id, status, frequency, renewal_date, created_at)
                    VALUES (?, ?, 'active', ?, DATE_ADD(NOW(), INTERVAL ? DAY), NOW())
                ");
                $daysToAdd = $isAnnual ? 365 : 30;
                $stmt->execute([$user['id'], $newPlan['id'], $data['frequency'], $daysToAdd]);
            }
            
            // Update user plan
            $stmt = $pdo->prepare("UPDATE users SET plan = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$data['plan'], $user['id']]);
            
            Database::commit();
            
            // Send confirmation email
            MailService::sendPaymentSuccessEmail(
                $user['email'],
                $user['name'],
                $data['plan'],
                0,
                'CREDIT-UPGRADE',
                date('M j, Y', strtotime('+' . ($isAnnual ? '365' : '30') . ' days'))
            );
            
            Response::success([
                'message' => "Successfully upgraded to {$data['plan']} plan!",
                'plan' => $data['plan'],
                'frequency' => $data['frequency']
            ]);
            
        } catch (\Exception $e) {
            Database::rollback();
            error_log("Plan change error: " . $e->getMessage());
            Response::error('Failed to change plan. Please try again.', 500);
        }
    }

    public static function cancel(): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();

        $stmt = $pdo->prepare("
            UPDATE subscriptions 
            SET status = 'canceled', updated_at = NOW() 
            WHERE user_id = ? AND status = 'active'
        ");
        $stmt->execute([$user['id']]);

        if ($stmt->rowCount() === 0) {
            Response::error('No active subscription found', 404);
        }

        // Downgrade user to Free
        $stmt = $pdo->prepare("UPDATE users SET plan = 'Free', updated_at = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);

        Response::success(null, 'Subscription canceled. You have been downgraded to the Free plan.');
    }
}
