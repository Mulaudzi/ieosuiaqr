<?php

namespace App\Services;

use App\Config\Database;
use App\Services\MailService;

class PaymentRetryService
{
    // Grace period in days before subscription is canceled
    private const GRACE_PERIOD_DAYS = 7;
    
    // Retry schedule (in hours after failure)
    private const RETRY_SCHEDULE = [
        1 => 24,   // 1st retry: 24 hours after failure
        2 => 72,   // 2nd retry: 3 days after failure
        3 => 144,  // 3rd retry: 6 days after failure (just before grace period ends)
    ];

    /**
     * Create a payment retry record when a payment fails
     */
    public static function createRetry(int $userId, int $subscriptionId, float $amount, string $paymentId, string $reason): int
    {
        $pdo = Database::getInstance();
        
        // Check if retry table exists
        if (!self::tableExists($pdo, 'payment_retries')) {
            error_log("PaymentRetryService: payment_retries table doesn't exist");
            return 0;
        }
        
        // Check for existing active retry for this subscription
        $stmt = $pdo->prepare("
            SELECT id FROM payment_retries 
            WHERE subscription_id = ? AND status IN ('pending', 'retrying')
            LIMIT 1
        ");
        $stmt->execute([$subscriptionId]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            // Update existing retry instead of creating new one
            return self::incrementRetry($existing['id'], $reason);
        }
        
        // Calculate next retry time (24 hours from now)
        $nextRetryAt = date('Y-m-d H:i:s', strtotime('+' . self::RETRY_SCHEDULE[1] . ' hours'));
        $gracePeriodEnds = date('Y-m-d H:i:s', strtotime('+' . self::GRACE_PERIOD_DAYS . ' days'));
        
        try {
            $stmt = $pdo->prepare("
                INSERT INTO payment_retries 
                (user_id, subscription_id, original_payment_id, amount_zar, retry_count, 
                 next_retry_at, grace_period_ends_at, failure_reason, status, created_at)
                VALUES (?, ?, ?, ?, 0, ?, ?, ?, 'pending', NOW())
            ");
            $stmt->execute([
                $userId, 
                $subscriptionId, 
                $paymentId, 
                $amount, 
                $nextRetryAt, 
                $gracePeriodEnds, 
                $reason
            ]);
            
            $retryId = (int)$pdo->lastInsertId();
            
            // Update subscription to past_due status
            self::updateSubscriptionStatus($subscriptionId, 'past_due', $gracePeriodEnds);
            
            // Send initial failure notification
            self::sendRetryNotification($userId, $amount, 1, $gracePeriodEnds, $reason);
            
            error_log("PaymentRetryService: Created retry #{$retryId} for subscription #{$subscriptionId}");
            
            return $retryId;
            
        } catch (\Exception $e) {
            error_log("PaymentRetryService error: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Increment retry count and schedule next retry
     */
    public static function incrementRetry(int $retryId, string $reason = null): int
    {
        $pdo = Database::getInstance();
        
        try {
            // Get current retry info
            $stmt = $pdo->prepare("SELECT * FROM payment_retries WHERE id = ?");
            $stmt->execute([$retryId]);
            $retry = $stmt->fetch();
            
            if (!$retry) {
                return 0;
            }
            
            $newRetryCount = $retry['retry_count'] + 1;
            $maxRetries = $retry['max_retries'];
            
            if ($newRetryCount >= $maxRetries) {
                // Max retries exhausted
                $stmt = $pdo->prepare("
                    UPDATE payment_retries 
                    SET retry_count = ?, status = 'exhausted', 
                        last_retry_at = NOW(), failure_reason = ?, updated_at = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([$newRetryCount, $reason ?? $retry['failure_reason'], $retryId]);
                
                error_log("PaymentRetryService: Retry #{$retryId} exhausted all attempts");
                
                return $retryId;
            }
            
            // Calculate next retry time
            $nextRetryHours = self::RETRY_SCHEDULE[$newRetryCount + 1] ?? 168; // Default to 7 days
            $nextRetryAt = date('Y-m-d H:i:s', strtotime('+' . $nextRetryHours . ' hours'));
            
            $stmt = $pdo->prepare("
                UPDATE payment_retries 
                SET retry_count = ?, next_retry_at = ?, last_retry_at = NOW(),
                    failure_reason = ?, status = 'pending', updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([
                $newRetryCount, 
                $nextRetryAt, 
                $reason ?? $retry['failure_reason'],
                $retryId
            ]);
            
            // Send retry notification
            self::sendRetryNotification(
                $retry['user_id'], 
                (float)$retry['amount_zar'], 
                $newRetryCount + 1,
                $retry['grace_period_ends_at'],
                $reason ?? $retry['failure_reason']
            );
            
            return $retryId;
            
        } catch (\Exception $e) {
            error_log("PaymentRetryService increment error: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Process pending retries (called by cron job)
     */
    public static function processPendingRetries(): array
    {
        $pdo = Database::getInstance();
        $results = ['processed' => 0, 'succeeded' => 0, 'failed' => 0, 'exhausted' => 0];
        
        if (!self::tableExists($pdo, 'payment_retries')) {
            return $results;
        }
        
        try {
            // Get pending retries that are due
            $stmt = $pdo->prepare("
                SELECT pr.*, s.payfast_token, s.paystack_subscription_code, s.provider,
                       u.email, u.name, p.name as plan_name
                FROM payment_retries pr
                JOIN subscriptions s ON pr.subscription_id = s.id
                JOIN users u ON pr.user_id = u.id
                JOIN plans p ON s.plan_id = p.id
                WHERE pr.status = 'pending' 
                  AND pr.next_retry_at <= NOW()
                  AND pr.retry_count < pr.max_retries
                ORDER BY pr.next_retry_at ASC
                LIMIT 50
            ");
            $stmt->execute();
            $retries = $stmt->fetchAll();
            
            foreach ($retries as $retry) {
                $results['processed']++;
                
                // Mark as retrying
                $stmt = $pdo->prepare("UPDATE payment_retries SET status = 'retrying' WHERE id = ?");
                $stmt->execute([$retry['id']]);
                
                // Attempt payment based on provider
                $success = false;
                $provider = $retry['provider'] ?? 'payfast';
                
                if ($provider === 'paystack' && !empty($retry['paystack_subscription_code'])) {
                    $success = self::retryPaystackPayment($retry);
                } elseif (!empty($retry['payfast_token'])) {
                    $success = self::retryPayfastPayment($retry);
                } else {
                    error_log("PaymentRetryService: No valid token for retry #{$retry['id']}");
                    self::incrementRetry($retry['id'], 'No valid payment token found');
                    $results['failed']++;
                    continue;
                }
                
                if ($success) {
                    // Mark retry as succeeded
                    $stmt = $pdo->prepare("
                        UPDATE payment_retries 
                        SET status = 'succeeded', last_retry_at = NOW(), updated_at = NOW()
                        WHERE id = ?
                    ");
                    $stmt->execute([$retry['id']]);
                    
                    // Restore subscription status
                    self::updateSubscriptionStatus($retry['subscription_id'], 'active', null);
                    
                    // Send success notification
                    MailService::sendPaymentRetrySuccessEmail(
                        $retry['email'],
                        $retry['name'],
                        $retry['plan_name'],
                        (float)$retry['amount_zar']
                    );
                    
                    $results['succeeded']++;
                    error_log("PaymentRetryService: Retry #{$retry['id']} succeeded");
                } else {
                    $newCount = $retry['retry_count'] + 1;
                    
                    if ($newCount >= $retry['max_retries']) {
                        // Max retries exhausted - cancel subscription
                        $stmt = $pdo->prepare("
                            UPDATE payment_retries 
                            SET status = 'exhausted', retry_count = ?, 
                                last_retry_at = NOW(), updated_at = NOW()
                            WHERE id = ?
                        ");
                        $stmt->execute([$newCount, $retry['id']]);
                        
                        // Cancel subscription
                        self::cancelSubscriptionAfterRetryExhaustion($retry);
                        
                        $results['exhausted']++;
                        error_log("PaymentRetryService: Retry #{$retry['id']} exhausted, canceling subscription");
                    } else {
                        // Schedule next retry
                        self::incrementRetry($retry['id'], 'Payment retry failed');
                        $results['failed']++;
                    }
                }
            }
            
            return $results;
            
        } catch (\Exception $e) {
            error_log("PaymentRetryService process error: " . $e->getMessage());
            return $results;
        }
    }
    
    /**
     * Process expired grace periods (called by cron job)
     */
    public static function processExpiredGracePeriods(): array
    {
        $pdo = Database::getInstance();
        $results = ['processed' => 0, 'canceled' => 0];
        
        try {
            // Find subscriptions where grace period has expired
            $stmt = $pdo->prepare("
                SELECT s.*, u.email, u.name, p.name as plan_name
                FROM subscriptions s
                JOIN users u ON s.user_id = u.id
                JOIN plans p ON s.plan_id = p.id
                WHERE s.status = 'past_due'
                  AND s.grace_period_ends_at IS NOT NULL
                  AND s.grace_period_ends_at <= NOW()
            ");
            $stmt->execute();
            $subscriptions = $stmt->fetchAll();
            
            foreach ($subscriptions as $sub) {
                $results['processed']++;
                
                // Cancel subscription
                $stmt = $pdo->prepare("
                    UPDATE subscriptions 
                    SET status = 'canceled', updated_at = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([$sub['id']]);
                
                // Downgrade user to Free
                $stmt = $pdo->prepare("UPDATE users SET plan = 'Free', updated_at = NOW() WHERE id = ?");
                $stmt->execute([$sub['user_id']]);
                
                // Mark any pending retries as canceled
                $stmt = $pdo->prepare("
                    UPDATE payment_retries 
                    SET status = 'canceled', updated_at = NOW()
                    WHERE subscription_id = ? AND status IN ('pending', 'retrying')
                ");
                $stmt->execute([$sub['id']]);
                
                // Send cancellation email
                MailService::sendGracePeriodExpiredEmail(
                    $sub['email'],
                    $sub['name'],
                    $sub['plan_name']
                );
                
                $results['canceled']++;
                error_log("PaymentRetryService: Grace period expired for subscription #{$sub['id']}");
            }
            
            return $results;
            
        } catch (\Exception $e) {
            error_log("PaymentRetryService grace period error: " . $e->getMessage());
            return $results;
        }
    }
    
    /**
     * Get retry status for a subscription
     */
    public static function getRetryStatus(int $subscriptionId): ?array
    {
        $pdo = Database::getInstance();
        
        if (!self::tableExists($pdo, 'payment_retries')) {
            return null;
        }
        
        try {
            $stmt = $pdo->prepare("
                SELECT * FROM payment_retries 
                WHERE subscription_id = ? 
                ORDER BY created_at DESC 
                LIMIT 1
            ");
            $stmt->execute([$subscriptionId]);
            return $stmt->fetch() ?: null;
            
        } catch (\Exception $e) {
            error_log("PaymentRetryService get status error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Cancel active retry (user manually updated payment method)
     */
    public static function cancelRetry(int $subscriptionId): bool
    {
        $pdo = Database::getInstance();
        
        try {
            $stmt = $pdo->prepare("
                UPDATE payment_retries 
                SET status = 'canceled', updated_at = NOW()
                WHERE subscription_id = ? AND status IN ('pending', 'retrying')
            ");
            $stmt->execute([$subscriptionId]);
            
            // Restore subscription status
            self::updateSubscriptionStatus($subscriptionId, 'active', null);
            
            return true;
            
        } catch (\Exception $e) {
            error_log("PaymentRetryService cancel error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Retry PayFast payment using token
     */
    private static function retryPayfastPayment(array $retry): bool
    {
        // PayFast ad-hoc payment via API
        $token = $retry['payfast_token'];
        if (empty($token)) {
            return false;
        }
        
        $merchantId = $_ENV['PAYFAST_MERCHANT_ID'] ?? '';
        $passphrase = $_ENV['PAYFAST_PASSPHRASE'] ?? '';
        $isSandbox = filter_var($_ENV['PAYFAST_SANDBOX'] ?? true, FILTER_VALIDATE_BOOLEAN);
        
        $amount = number_format($retry['amount_zar'], 2, '.', '');
        $paymentId = 'RETRY-' . strtoupper(bin2hex(random_bytes(6)));
        
        $data = [
            'amount' => $amount,
            'item_name' => 'Subscription Renewal Retry',
            'm_payment_id' => $paymentId,
        ];
        
        // Generate signature
        ksort($data);
        $signatureString = '';
        foreach ($data as $key => $val) {
            $signatureString .= $key . '=' . urlencode(trim($val)) . '&';
        }
        $signatureString = rtrim($signatureString, '&');
        
        if ($passphrase) {
            $signatureString .= '&passphrase=' . urlencode(trim($passphrase));
        }
        
        $signature = md5($signatureString);
        
        $baseUrl = $isSandbox 
            ? 'https://sandbox.payfast.co.za/subscriptions/' 
            : 'https://api.payfast.co.za/subscriptions/';
        
        $url = $baseUrl . $token . '/adhoc';
        
        $headers = [
            'merchant-id: ' . $merchantId,
            'version: v1',
            'timestamp: ' . date('Y-m-d\TH:i:sO'),
            'signature: ' . $signature,
            'Content-Type: application/json',
        ];
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        error_log("PayFast retry response: HTTP {$httpCode} - {$response}");
        
        if ($httpCode >= 200 && $httpCode < 300) {
            $result = json_decode($response, true);
            return !empty($result['response']['run_date']);
        }
        
        return false;
    }
    
    /**
     * Retry Paystack payment
     */
    private static function retryPaystackPayment(array $retry): bool
    {
        $secretKey = $_ENV['PAYSTACK_SECRET_KEY'] ?? '';
        if (empty($secretKey)) {
            return false;
        }
        
        // For Paystack, we need to charge the authorization
        // This requires the user's authorization code from a previous successful charge
        $pdo = Database::getInstance();
        
        // Get the last successful payment authorization
        $stmt = $pdo->prepare("
            SELECT provider_data FROM payments 
            WHERE user_id = ? AND status = 'succeeded' AND payment_method = 'paystack'
            ORDER BY created_at DESC LIMIT 1
        ");
        $stmt->execute([$retry['user_id']]);
        $payment = $stmt->fetch();
        
        if (!$payment || empty($payment['provider_data'])) {
            error_log("Paystack retry: No authorization found for user #{$retry['user_id']}");
            return false;
        }
        
        $providerData = json_decode($payment['provider_data'], true);
        $authorizationCode = $providerData['authorization']['authorization_code'] ?? null;
        
        if (!$authorizationCode) {
            return false;
        }
        
        $email = $retry['email'];
        $amountKobo = (int)($retry['amount_zar'] * 100);
        $reference = 'RETRY-' . strtoupper(bin2hex(random_bytes(8)));
        
        $data = [
            'authorization_code' => $authorizationCode,
            'email' => $email,
            'amount' => $amountKobo,
            'reference' => $reference,
        ];
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => 'https://api.paystack.co/transaction/charge_authorization',
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $secretKey,
                'Content-Type: application/json',
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        error_log("Paystack retry response: HTTP {$httpCode} - {$response}");
        
        if ($httpCode >= 200 && $httpCode < 300) {
            $result = json_decode($response, true);
            return $result['status'] === true && 
                   isset($result['data']['status']) && 
                   $result['data']['status'] === 'success';
        }
        
        return false;
    }
    
    /**
     * Update subscription status
     */
    private static function updateSubscriptionStatus(int $subscriptionId, string $status, ?string $gracePeriodEnds): void
    {
        $pdo = Database::getInstance();
        
        try {
            if ($gracePeriodEnds) {
                $stmt = $pdo->prepare("
                    UPDATE subscriptions 
                    SET status = ?, grace_period_ends_at = ?, 
                        failed_payment_count = failed_payment_count + 1, updated_at = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([$status, $gracePeriodEnds, $subscriptionId]);
            } else {
                $stmt = $pdo->prepare("
                    UPDATE subscriptions 
                    SET status = ?, grace_period_ends_at = NULL, 
                        failed_payment_count = 0, updated_at = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([$status, $subscriptionId]);
            }
        } catch (\Exception $e) {
            error_log("PaymentRetryService update subscription error: " . $e->getMessage());
        }
    }
    
    /**
     * Cancel subscription after retry exhaustion
     */
    private static function cancelSubscriptionAfterRetryExhaustion(array $retry): void
    {
        $pdo = Database::getInstance();
        
        try {
            // Cancel subscription
            $stmt = $pdo->prepare("
                UPDATE subscriptions 
                SET status = 'canceled', updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$retry['subscription_id']]);
            
            // Downgrade user to Free
            $stmt = $pdo->prepare("UPDATE users SET plan = 'Free', updated_at = NOW() WHERE id = ?");
            $stmt->execute([$retry['user_id']]);
            
            // Send cancellation email
            MailService::sendSubscriptionCanceledDueToPaymentEmail(
                $retry['email'],
                $retry['name'],
                $retry['plan_name']
            );
            
        } catch (\Exception $e) {
            error_log("PaymentRetryService cancel subscription error: " . $e->getMessage());
        }
    }
    
    /**
     * Send retry notification email
     */
    private static function sendRetryNotification(int $userId, float $amount, int $attemptNumber, string $gracePeriodEnds, string $reason): void
    {
        $pdo = Database::getInstance();
        
        try {
            $stmt = $pdo->prepare("SELECT email, name FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            
            if ($user) {
                MailService::sendPaymentRetryNotificationEmail(
                    $user['email'],
                    $user['name'],
                    $amount,
                    $attemptNumber,
                    $gracePeriodEnds,
                    $reason
                );
                
                // Update notification count
                $stmt = $pdo->prepare("
                    UPDATE payment_retries 
                    SET notification_sent_count = notification_sent_count + 1, 
                        last_notification_at = NOW()
                    WHERE user_id = ? AND status IN ('pending', 'retrying')
                    ORDER BY created_at DESC LIMIT 1
                ");
                $stmt->execute([$userId]);
            }
        } catch (\Exception $e) {
            error_log("PaymentRetryService notification error: " . $e->getMessage());
        }
    }
    
    /**
     * Check if table exists
     */
    private static function tableExists(\PDO $pdo, string $table): bool
    {
        try {
            $stmt = $pdo->query("SHOW TABLES LIKE '{$table}'");
            return $stmt->rowCount() > 0;
        } catch (\Exception $e) {
            return false;
        }
    }
}
