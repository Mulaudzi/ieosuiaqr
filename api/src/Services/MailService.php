<?php

namespace App\Services;

// Include local PHPMailer files
require_once __DIR__ . '/../Libraries/PHPMailer/Exception.php';
require_once __DIR__ . '/../Libraries/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/../Libraries/PHPMailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class MailService
{
    private static ?PHPMailer $mailer = null;

    private static function getMailer(): PHPMailer
    {
        if (self::$mailer === null) {
            self::$mailer = new PHPMailer(true);

            // Server settings
            self::$mailer->isSMTP();
            self::$mailer->Host = $_ENV['SMTP_HOST'] ?? 'qr.ieosuia.com';
            self::$mailer->SMTPAuth = true;
            self::$mailer->Username = $_ENV['SMTP_USER'] ?? 'noreply@qr.ieosuia.com';
            self::$mailer->Password = $_ENV['SMTP_PASS'] ?? '';
            self::$mailer->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            self::$mailer->Port = (int)($_ENV['SMTP_PORT'] ?? 465);

            // Default sender
            self::$mailer->setFrom(
                $_ENV['SMTP_FROM_EMAIL'] ?? 'noreply@qr.ieosuia.com',
                $_ENV['SMTP_FROM_NAME'] ?? 'IEOSUIA QR'
            );

            // Encoding
            self::$mailer->CharSet = 'UTF-8';
            self::$mailer->Encoding = 'base64';

            // Debug (set to 0 for production)
            self::$mailer->SMTPDebug = ($_ENV['APP_DEBUG'] ?? 'false') === 'true' ? SMTP::DEBUG_SERVER : SMTP::DEBUG_OFF;
        }

        return self::$mailer;
    }

    /**
     * Send email using PHPMailer
     */
    public static function send(string $to, string $subject, string $htmlBody, ?string $textBody = null): bool
    {
        try {
            $mail = self::getMailer();

            // Clear previous recipients
            $mail->clearAddresses();
            $mail->clearReplyTos();

            // Recipient
            $mail->addAddress($to);

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $htmlBody;
            $mail->AltBody = $textBody ?? strip_tags($htmlBody);

            $mail->send();

            error_log("Email sent successfully to: $to");
            return true;

        } catch (Exception $e) {
            error_log("PHPMailer Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send email with CC recipient
     */
    public static function sendWithCC(string $to, string $cc, string $subject, string $htmlBody, ?string $replyTo = null, ?string $textBody = null): bool
    {
        try {
            $mail = self::getMailer();

            // Clear previous recipients
            $mail->clearAddresses();
            $mail->clearCCs();
            $mail->clearReplyTos();

            // Primary recipient
            $mail->addAddress($to);
            
            // CC recipient
            if (!empty($cc)) {
                $mail->addCC($cc);
            }
            
            // Reply-To (user's email for contact forms)
            if (!empty($replyTo)) {
                $mail->addReplyTo($replyTo);
            }

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $htmlBody;
            $mail->AltBody = $textBody ?? strip_tags($htmlBody);

            $mail->send();

            error_log("Email sent successfully to: $to (CC: $cc)");
            return true;

        } catch (Exception $e) {
            error_log("PHPMailer Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send verification email
     */
    public static function sendVerificationEmail(string $email, string $name, string $token): bool
    {
        $appUrl = $_ENV['APP_URL'] ?? 'https://qr.ieosuia.com';
        $verifyUrl = $appUrl . '/verify-email?token=' . $token;

        $subject = 'Verify your email address - IEOSUIA QR';

        $html = self::getEmailTemplate(
            'Verify Your Email',
            "Hello $name,",
            'Thank you for signing up for IEOSUIA QR! Please click the button below to verify your email address and activate your account.',
            $verifyUrl,
            'Verify Email Address',
            'If you didn\'t create an account with us, you can safely ignore this email.'
        );

        return self::send($email, $subject, $html);
    }

    /**
     * Send password reset email
     */
    public static function sendPasswordResetEmail(string $email, string $name, string $token): bool
    {
        $appUrl = $_ENV['APP_URL'] ?? 'https://qr.ieosuia.com';
        $resetUrl = $appUrl . '/reset-password?token=' . $token;

        $subject = 'Reset your password - IEOSUIA QR';

        $html = self::getEmailTemplate(
            'Reset Your Password',
            "Hello $name,",
            'We received a request to reset your password. Click the button below to create a new password. This link will expire in 1 hour.',
            $resetUrl,
            'Reset Password',
            'If you didn\'t request a password reset, you can safely ignore this email. Your password will remain unchanged.'
        );

        return self::send($email, $subject, $html);
    }

    /**
     * Send welcome email after verification
     */
    public static function sendWelcomeEmail(string $email, string $name): bool
    {
        $appUrl = $_ENV['APP_URL'] ?? 'https://qr.ieosuia.com';
        $dashboardUrl = $appUrl . '/dashboard';

        $subject = 'Welcome to IEOSUIA QR! 🎉';

        $html = self::getEmailTemplate(
            'Welcome Aboard!',
            "Hello $name,",
            'Your email has been verified and your account is now fully activated! You\'re all set to start creating powerful, trackable QR codes for your business.',
            $dashboardUrl,
            'Go to Dashboard',
            'Start creating QR codes today and unlock the power of smart engagement.'
        );

        return self::send($email, $subject, $html);
    }

    /**
     * Send status change notification email
     */
    public static function sendStatusChangeEmail(
        string $email, 
        string $name, 
        string $itemName, 
        string $oldStatus, 
        string $newStatus, 
        ?string $location = null
    ): bool {
        $appUrl = $_ENV['APP_URL'] ?? 'https://qr.ieosuia.com';
        $dashboardUrl = $appUrl . '/dashboard/inventory';

        $statusLabels = [
            'in_stock' => 'In Stock',
            'out' => 'Out',
            'maintenance' => 'Maintenance',
            'checked_out' => 'Checked Out',
        ];

        $oldLabel = $statusLabels[$oldStatus] ?? $oldStatus;
        $newLabel = $statusLabels[$newStatus] ?? $newStatus;

        $subject = "Inventory Alert: {$itemName} status changed to {$newLabel}";

        $locationText = $location ? "<br><br><strong>Current Location:</strong> {$location}" : '';

        $html = self::getStatusChangeTemplate(
            $itemName,
            $name,
            $oldLabel,
            $newLabel,
            $dashboardUrl,
            $locationText
        );

        return self::send($email, $subject, $html);
    }

    /**
     * Get status change email template
     */
    private static function getStatusChangeTemplate(
        string $itemName,
        string $userName,
        string $oldStatus,
        string $newStatus,
        string $dashboardUrl,
        string $locationText
    ): string {
        $statusColors = [
            'In Stock' => '#10b981',
            'Out' => '#ef4444',
            'Maintenance' => '#f59e0b',
            'Checked Out' => '#3b82f6',
        ];

        $newColor = $statusColors[$newStatus] ?? '#10b981';
        $timestamp = date('M j, Y \a\t g:i A');

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Status Change Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #141414; border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">📦 Inventory Alert</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #e5e5e5; line-height: 1.5;">Hello {$userName},</p>
                            
                            <p style="margin: 0 0 25px 0; font-size: 16px; color: #a3a3a3; line-height: 1.6;">
                                The status of your inventory item has been updated:
                            </p>
                            
                            <!-- Item Card -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #1f1f1f; border-radius: 12px; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: #ffffff;">{$itemName}</h3>
                                        
                                        <table role="presentation" style="border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="display: inline-block; padding: 6px 14px; font-size: 13px; font-weight: 500; color: #a3a3a3; background-color: #262626; border-radius: 6px;">{$oldStatus}</span>
                                                </td>
                                                <td style="padding: 8px 15px; color: #525252;">→</td>
                                                <td style="padding: 8px 0;">
                                                    <span style="display: inline-block; padding: 6px 14px; font-size: 13px; font-weight: 600; color: #ffffff; background-color: {$newColor}; border-radius: 6px;">{$newStatus}</span>
                                                </td>
                                            </tr>
                                        </table>
                                        {$locationText}
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 25px 0; font-size: 14px; color: #737373;">
                                Changed at: {$timestamp}
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center">
                                        <a href="{$dashboardUrl}" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #10b981 0%, #059669 100%); text-decoration: none; border-radius: 8px;">View Inventory</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 25px 0 0 0; font-size: 12px; color: #525252; line-height: 1.5;">
                                You're receiving this because status change notifications are enabled for your account. 
                                <a href="{$dashboardUrl}" style="color: #10b981;">Manage notification preferences</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #0a0a0a; border-top: 1px solid #262626;">
                            <p style="margin: 0; font-size: 12px; color: #525252;">
                                &copy; 2025 IEOSUIA QR. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }

    /**
     * Send alert notification email
     */
    public static function sendAlertEmail(
        string $email, 
        string $name, 
        string $alertTitle, 
        string $alertMessage,
        string $priority = 'medium'
    ): bool {
        $appUrl = $_ENV['APP_URL'] ?? 'https://qr.ieosuia.com';
        $dashboardUrl = $appUrl . '/dashboard/inventory';

        $priorityColors = [
            'low' => '#3b82f6',
            'medium' => '#f59e0b',
            'high' => '#ef4444',
        ];

        $priorityLabels = [
            'low' => 'Low Priority',
            'medium' => 'Action Needed',
            'high' => 'Urgent',
        ];

        $color = $priorityColors[$priority] ?? $priorityColors['medium'];
        $label = $priorityLabels[$priority] ?? $priorityLabels['medium'];

        $subject = "[{$label}] {$alertTitle}";

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventory Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #141414; border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, {$color} 0%, {$color}99 100%);">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">🔔 {$label}</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #e5e5e5; line-height: 1.5;">Hello {$name},</p>
                            
                            <h2 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 600; color: #ffffff;">{$alertTitle}</h2>
                            
                            <p style="margin: 0 0 30px 0; font-size: 16px; color: #a3a3a3; line-height: 1.6;">{$alertMessage}</p>
                            
                            <!-- Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center">
                                        <a href="{$dashboardUrl}" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background: {$color}; text-decoration: none; border-radius: 8px;">View Inventory</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 25px 0 0 0; font-size: 12px; color: #525252; line-height: 1.5;">
                                You're receiving this because alerts are enabled for your account. 
                                <a href="{$dashboardUrl}" style="color: #10b981;">Manage alert preferences</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #0a0a0a; border-top: 1px solid #262626;">
                            <p style="margin: 0; font-size: 12px; color: #525252;">
                                &copy; 2025 IEOSUIA QR. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;

        return self::send($email, $subject, $html);
    }

    /**
     * Send payment success notification
     */
    public static function sendPaymentSuccessEmail(
        string $email,
        string $name,
        string $planName,
        float $amount,
        string $paymentId,
        string $renewalDate
    ): bool {
        $appUrl = $_ENV['APP_URL'] ?? 'https://qr.ieosuia.com';
        $billingUrl = $appUrl . '/dashboard/settings?tab=billing';

        $subject = "Payment Successful - {$planName} Plan Activated 🎉";
        $formattedAmount = 'R' . number_format($amount, 2);
        $timestamp = date('M j, Y \a\t g:i A');

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Successful</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #141414; border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">✅ Payment Successful</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #e5e5e5; line-height: 1.5;">Hello {$name},</p>
                            
                            <p style="margin: 0 0 25px 0; font-size: 16px; color: #a3a3a3; line-height: 1.6;">
                                Your payment has been processed successfully. Your {$planName} plan is now active!
                            </p>
                            
                            <!-- Payment Details Card -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #1f1f1f; border-radius: 12px; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #ffffff;">Payment Details</h3>
                                        
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0; color: #a3a3a3; font-size: 14px;">Plan</td>
                                                <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">{$planName}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #a3a3a3; font-size: 14px;">Amount Paid</td>
                                                <td style="padding: 8px 0; color: #10b981; font-size: 14px; font-weight: 600; text-align: right;">{$formattedAmount}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #a3a3a3; font-size: 14px;">Transaction ID</td>
                                                <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">{$paymentId}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #a3a3a3; font-size: 14px;">Payment Date</td>
                                                <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">{$timestamp}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #a3a3a3; font-size: 14px;">Next Renewal</td>
                                                <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">{$renewalDate}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center">
                                        <a href="{$billingUrl}" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #10b981 0%, #059669 100%); text-decoration: none; border-radius: 8px;">View Billing</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 25px 0 0 0; font-size: 12px; color: #525252; line-height: 1.5;">
                                Thank you for your subscription! If you have any questions, please contact our support team.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #0a0a0a; border-top: 1px solid #262626;">
                            <p style="margin: 0; font-size: 12px; color: #525252;">
                                &copy; 2025 IEOSUIA QR. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;

        return self::send($email, $subject, $html);
    }

    /**
     * Send payment failure notification
     */
    public static function sendPaymentFailedEmail(
        string $email,
        string $name,
        float $amount,
        string $reason = 'Payment could not be processed'
    ): bool {
        $appUrl = $_ENV['APP_URL'] ?? 'https://qr.ieosuia.com';
        $billingUrl = $appUrl . '/dashboard/settings?tab=billing';

        $subject = "Payment Failed - Action Required ⚠️";
        $formattedAmount = 'R' . number_format($amount, 2);
        $timestamp = date('M j, Y \a\t g:i A');

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Failed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #141414; border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">❌ Payment Failed</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #e5e5e5; line-height: 1.5;">Hello {$name},</p>
                            
                            <p style="margin: 0 0 25px 0; font-size: 16px; color: #a3a3a3; line-height: 1.6;">
                                Unfortunately, we were unable to process your payment of <strong style="color: #ef4444;">{$formattedAmount}</strong>.
                            </p>
                            
                            <!-- Error Card -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #1f1f1f; border-radius: 12px; margin-bottom: 25px; border: 1px solid #ef444433;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: 600; color: #ef4444;">Reason</h3>
                                        <p style="margin: 0; font-size: 14px; color: #a3a3a3;">{$reason}</p>
                                        <p style="margin: 15px 0 0 0; font-size: 12px; color: #737373;">Attempted: {$timestamp}</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 25px 0; font-size: 14px; color: #a3a3a3; line-height: 1.6;">
                                <strong>What you can do:</strong><br>
                                • Check that your card details are correct<br>
                                • Ensure sufficient funds are available<br>
                                • Try a different payment method<br>
                                • Contact your bank if the issue persists
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center">
                                        <a href="{$billingUrl}" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #10b981 0%, #059669 100%); text-decoration: none; border-radius: 8px;">Update Payment Method</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 25px 0 0 0; font-size: 12px; color: #525252; line-height: 1.5;">
                                If you continue to experience issues, please contact our support team for assistance.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #0a0a0a; border-top: 1px solid #262626;">
                            <p style="margin: 0; font-size: 12px; color: #525252;">
                                &copy; 2025 IEOSUIA QR. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;

        return self::send($email, $subject, $html);
    }

    /**
     * Send subscription renewal reminder
     */
    public static function sendRenewalReminderEmail(
        string $email,
        string $name,
        string $planName,
        float $amount,
        string $renewalDate,
        int $daysRemaining
    ): bool {
        $appUrl = $_ENV['APP_URL'] ?? 'https://qr.ieosuia.com';
        $billingUrl = $appUrl . '/dashboard/settings?tab=billing';

        $urgency = $daysRemaining <= 1 ? 'Tomorrow' : "in {$daysRemaining} days";
        $subject = "Subscription Renewal {$urgency} - {$planName} Plan 📅";
        $formattedAmount = 'R' . number_format($amount, 2);
        
        $urgencyColor = $daysRemaining <= 1 ? '#ef4444' : ($daysRemaining <= 3 ? '#f59e0b' : '#3b82f6');

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Renewal Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #141414; border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, {$urgencyColor} 0%, {$urgencyColor}cc 100%);">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">📅 Renewal Reminder</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #e5e5e5; line-height: 1.5;">Hello {$name},</p>
                            
                            <p style="margin: 0 0 25px 0; font-size: 16px; color: #a3a3a3; line-height: 1.6;">
                                Your <strong style="color: #ffffff;">{$planName}</strong> subscription will automatically renew <strong style="color: {$urgencyColor};">{$urgency}</strong>.
                            </p>
                            
                            <!-- Renewal Details Card -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #1f1f1f; border-radius: 12px; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #ffffff;">Renewal Details</h3>
                                        
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0; color: #a3a3a3; font-size: 14px;">Plan</td>
                                                <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">{$planName}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #a3a3a3; font-size: 14px;">Renewal Amount</td>
                                                <td style="padding: 8px 0; color: #10b981; font-size: 14px; font-weight: 600; text-align: right;">{$formattedAmount}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #a3a3a3; font-size: 14px;">Renewal Date</td>
                                                <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">{$renewalDate}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 25px 0; font-size: 14px; color: #a3a3a3; line-height: 1.6;">
                                No action is required if you wish to continue your subscription. Your card will be charged automatically on the renewal date.
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center">
                                        <a href="{$billingUrl}" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #10b981 0%, #059669 100%); text-decoration: none; border-radius: 8px;">Manage Subscription</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 25px 0 0 0; font-size: 12px; color: #525252; line-height: 1.5;">
                                If you wish to cancel or change your plan, please do so before the renewal date.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #0a0a0a; border-top: 1px solid #262626;">
                            <p style="margin: 0; font-size: 12px; color: #525252;">
                                &copy; 2025 IEOSUIA QR. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;

        return self::send($email, $subject, $html);
    }

    /**
     * Send subscription canceled notification
     */
    public static function sendSubscriptionCanceledEmail(
        string $email,
        string $name,
        string $planName
    ): bool {
        $appUrl = $_ENV['APP_URL'] ?? 'https://qr.ieosuia.com';
        $pricingUrl = $appUrl . '/#pricing';

        $subject = "Your {$planName} Subscription Has Been Canceled";

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Canceled</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #141414; border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, #737373 0%, #525252 100%);">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">Subscription Canceled</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #e5e5e5; line-height: 1.5;">Hello {$name},</p>
                            
                            <p style="margin: 0 0 25px 0; font-size: 16px; color: #a3a3a3; line-height: 1.6;">
                                Your <strong style="color: #ffffff;">{$planName}</strong> subscription has been canceled. You have been downgraded to the Free plan.
                            </p>
                            
                            <p style="margin: 0 0 25px 0; font-size: 14px; color: #a3a3a3; line-height: 1.6;">
                                We're sorry to see you go! If you change your mind, you can resubscribe at any time to regain access to premium features.
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center">
                                        <a href="{$pricingUrl}" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #10b981 0%, #059669 100%); text-decoration: none; border-radius: 8px;">View Plans</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 25px 0 0 0; font-size: 12px; color: #525252; line-height: 1.5;">
                                If you have any feedback or questions, please don't hesitate to contact us.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #0a0a0a; border-top: 1px solid #262626;">
                            <p style="margin: 0; font-size: 12px; color: #525252;">
                                &copy; 2025 IEOSUIA QR. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;

        return self::send($email, $subject, $html);
    }

    /**
     * Send payment retry notification email
     */
    public static function sendPaymentRetryNotificationEmail(
        string $email,
        string $name,
        float $amount,
        int $attemptNumber,
        string $gracePeriodEnds,
        string $reason
    ): bool {
        $appUrl = $_ENV['APP_URL'] ?? 'https://qr.ieosuia.com';
        $billingUrl = $appUrl . '/dashboard/settings?tab=billing';

        $formattedAmount = 'R' . number_format($amount, 2);
        $formattedDate = date('M j, Y', strtotime($gracePeriodEnds));
        $daysRemaining = max(0, (int)ceil((strtotime($gracePeriodEnds) - time()) / 86400));
        
        $urgencyLevel = $daysRemaining <= 2 ? 'high' : ($daysRemaining <= 4 ? 'medium' : 'low');
        $urgencyColor = $urgencyLevel === 'high' ? '#ef4444' : ($urgencyLevel === 'medium' ? '#f59e0b' : '#3b82f6');
        
        $subject = $attemptNumber === 1 
            ? "⚠️ Payment Failed - Action Required" 
            : "⚠️ Payment Retry #{$attemptNumber} Failed - {$daysRemaining} Days Left";

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Retry Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #141414; border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, {$urgencyColor} 0%, {$urgencyColor}cc 100%);">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">⚠️ Payment Failed</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #e5e5e5; line-height: 1.5;">Hello {$name},</p>
                            
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #a3a3a3; line-height: 1.6;">
                                We were unable to process your subscription payment of <strong style="color: #ef4444;">{$formattedAmount}</strong>.
                            </p>
                            
                            <!-- Warning Box -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: {$urgencyColor}22; border: 1px solid {$urgencyColor}44; border-radius: 12px; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0; font-size: 14px; color: {$urgencyColor}; font-weight: 600;">
                                            ⏰ Grace Period: {$daysRemaining} days remaining
                                        </p>
                                        <p style="margin: 10px 0 0 0; font-size: 13px; color: #a3a3a3;">
                                            Your subscription will be canceled on <strong>{$formattedDate}</strong> if payment is not received.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Error Details -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #1f1f1f; border-radius: 12px; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: 600; color: #ffffff;">Payment Details</h3>
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 6px 0; color: #a3a3a3; font-size: 14px;">Amount</td>
                                                <td style="padding: 6px 0; color: #ffffff; font-size: 14px; text-align: right;">{$formattedAmount}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; color: #a3a3a3; font-size: 14px;">Attempt</td>
                                                <td style="padding: 6px 0; color: #ffffff; font-size: 14px; text-align: right;">#{$attemptNumber} of 3</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; color: #a3a3a3; font-size: 14px;">Reason</td>
                                                <td style="padding: 6px 0; color: #ef4444; font-size: 14px; text-align: right;">{$reason}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 25px 0; font-size: 14px; color: #a3a3a3; line-height: 1.6;">
                                <strong>What you can do:</strong><br>
                                • Update your payment method<br>
                                • Ensure your card has sufficient funds<br>
                                • Contact your bank if there's a block
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center">
                                        <a href="{$billingUrl}" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #10b981 0%, #059669 100%); text-decoration: none; border-radius: 8px;">Update Payment Method</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #0a0a0a; border-top: 1px solid #262626;">
                            <p style="margin: 0; font-size: 12px; color: #525252;">
                                &copy; 2025 IEOSUIA QR. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;

        return self::send($email, $subject, $html);
    }

    /**
     * Send payment retry success email
     */
    public static function sendPaymentRetrySuccessEmail(
        string $email,
        string $name,
        string $planName,
        float $amount
    ): bool {
        $appUrl = $_ENV['APP_URL'] ?? 'https://qr.ieosuia.com';
        $billingUrl = $appUrl . '/dashboard/settings?tab=billing';

        $formattedAmount = 'R' . number_format($amount, 2);
        $subject = "✅ Payment Successful - Subscription Restored";

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Successful</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #141414; border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">✅ Payment Successful</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #e5e5e5; line-height: 1.5;">Hello {$name},</p>
                            
                            <p style="margin: 0 0 25px 0; font-size: 16px; color: #a3a3a3; line-height: 1.6;">
                                Great news! Your payment of <strong style="color: #10b981;">{$formattedAmount}</strong> has been successfully processed.
                            </p>
                            
                            <!-- Success Box -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #10b98122; border: 1px solid #10b98144; border-radius: 12px; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0; font-size: 14px; color: #10b981; font-weight: 600;">
                                            ✓ Your {$planName} subscription has been restored
                                        </p>
                                        <p style="margin: 10px 0 0 0; font-size: 13px; color: #a3a3a3;">
                                            All premium features are now active again.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center">
                                        <a href="{$billingUrl}" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #10b981 0%, #059669 100%); text-decoration: none; border-radius: 8px;">View Billing</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #0a0a0a; border-top: 1px solid #262626;">
                            <p style="margin: 0; font-size: 12px; color: #525252;">
                                &copy; 2025 IEOSUIA QR. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;

        return self::send($email, $subject, $html);
    }

    /**
     * Send subscription canceled due to payment failure email
     */
    public static function sendSubscriptionCanceledDueToPaymentEmail(
        string $email,
        string $name,
        string $planName
    ): bool {
        $appUrl = $_ENV['APP_URL'] ?? 'https://qr.ieosuia.com';
        $pricingUrl = $appUrl . '/#pricing';

        $subject = "❌ Subscription Canceled - Payment Failed";

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Canceled</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #141414; border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">Subscription Canceled</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #e5e5e5; line-height: 1.5;">Hello {$name},</p>
                            
                            <p style="margin: 0 0 25px 0; font-size: 16px; color: #a3a3a3; line-height: 1.6;">
                                Unfortunately, we were unable to process your payment after multiple attempts. Your <strong style="color: #ffffff;">{$planName}</strong> subscription has been canceled and you've been downgraded to the Free plan.
                            </p>
                            
                            <!-- Info Box -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #1f1f1f; border-radius: 12px; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0; font-size: 14px; color: #a3a3a3;">
                                            You can resubscribe at any time to restore access to premium features. We've saved your QR codes and data.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center">
                                        <a href="{$pricingUrl}" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #10b981 0%, #059669 100%); text-decoration: none; border-radius: 8px;">Resubscribe Now</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #0a0a0a; border-top: 1px solid #262626;">
                            <p style="margin: 0; font-size: 12px; color: #525252;">
                                &copy; 2025 IEOSUIA QR. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;

        return self::send($email, $subject, $html);
    }

    /**
     * Send grace period expired email
     */
    public static function sendGracePeriodExpiredEmail(
        string $email,
        string $name,
        string $planName
    ): bool {
        return self::sendSubscriptionCanceledDueToPaymentEmail($email, $name, $planName);
    }

    /**
     */
    private static function getEmailTemplate(
        string $title,
        string $greeting,
        string $message,
        string $buttonUrl,
        string $buttonText,
        string $footer
    ): string {
        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #141414; border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">IEOSUIA QR</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #ffffff;">{$title}</h2>
                            <p style="margin: 0 0 10px 0; font-size: 16px; color: #e5e5e5; line-height: 1.5;">{$greeting}</p>
                            <p style="margin: 0 0 30px 0; font-size: 16px; color: #a3a3a3; line-height: 1.6;">{$message}</p>
                            
                            <!-- Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center">
                                        <a href="{$buttonUrl}" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #10b981 0%, #059669 100%); text-decoration: none; border-radius: 8px;">{$buttonText}</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 30px 0 0 0; font-size: 14px; color: #737373; line-height: 1.5;">{$footer}</p>
                            
                            <!-- Link fallback -->
                            <p style="margin: 20px 0 0 0; font-size: 12px; color: #525252; line-height: 1.5;">
                                If the button doesn't work, copy and paste this link into your browser:<br>
                                <a href="{$buttonUrl}" style="color: #10b981; word-break: break-all;">{$buttonUrl}</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #0a0a0a; border-top: 1px solid #262626;">
                            <p style="margin: 0; font-size: 12px; color: #525252;">
                                &copy; 2025 IEOSUIA QR. All rights reserved.<br>
                                This email was sent to you because you registered at IEOSUIA QR.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }
}
