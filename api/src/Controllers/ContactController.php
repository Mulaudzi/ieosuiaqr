<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\RateLimit;
use App\Services\CaptchaService;
use App\Services\MailService;

class ContactController
{
    // Email routing configuration
    private static array $emailRouting = [
        'general' => 'hello@ieosuia.com',
        'support' => 'support@ieosuia.com',
        'sales' => 'sales@ieosuia.com',
    ];
    
    private static string $ccEmail = 'info@ieosuia.com';
    
    // Admin notification email
    private static string $adminNotificationEmail = 'admin@ieosuia.com';

    public static function submit(): void
    {
        // Rate limit: max 5 contact form submissions per 15 minutes per IP
        RateLimit::check('contact_form', 5, 15);
        
        $data = json_decode(file_get_contents('php://input'), true);

        // Verify reCAPTCHA
        CaptchaService::verify($data['captcha_token'] ?? null, 'contact');

        // Validate required fields
        $required = ['name', 'email', 'message'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                Response::error("Field '$field' is required", 422);
            }
        }

        // Validate email
        if (!Validator::email($data['email'])) {
            Response::error('Invalid email address', 422);
        }

        // Sanitize inputs
        $name = htmlspecialchars(strip_tags(trim($data['name'])));
        $email = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
        $company = isset($data['company']) ? htmlspecialchars(strip_tags(trim($data['company']))) : '';
        $message = htmlspecialchars(strip_tags(trim($data['message'])));
        $source = isset($data['source']) ? htmlspecialchars(strip_tags(trim($data['source']))) : 'IEOSUIA QR';
        
        // New fields for routing
        $purpose = isset($data['purpose']) ? htmlspecialchars(strip_tags(trim($data['purpose']))) : 'general';
        $purposeLabel = isset($data['purposeLabel']) ? htmlspecialchars(strip_tags(trim($data['purposeLabel']))) : 'General Inquiry';
        $originUrl = isset($data['originUrl']) ? htmlspecialchars(strip_tags(trim($data['originUrl']))) : '';

        // Validate lengths
        if (strlen($name) > 100) {
            Response::error('Name must be less than 100 characters', 422);
        }
        if (strlen($message) > 2000) {
            Response::error('Message must be less than 2000 characters', 422);
        }

        // Determine target email based on purpose
        $targetEmail = self::$emailRouting[$purpose] ?? self::$emailRouting['general'];
        
        // Build subject line with purpose indicator
        $purposeTag = strtoupper($purpose);
        $subject = "[$source][$purposeTag] Message from $name";
        
        $body = "
        <h2>New Contact Form Submission</h2>
        <table style='border-collapse: collapse; width: 100%;'>
            <tr>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>Source:</strong></td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>$source</td>
            </tr>
            <tr>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>Inquiry Type:</strong></td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>$purposeLabel</td>
            </tr>
            <tr>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>Name:</strong></td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>$name</td>
            </tr>
            <tr>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>Email:</strong></td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'><a href='mailto:$email'>$email</a></td>
            </tr>
            " . ($company ? "
            <tr>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>Company:</strong></td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>$company</td>
            </tr>" : "") . "
            " . ($originUrl ? "
            <tr>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>Origin Page:</strong></td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'><a href='$originUrl'>$originUrl</a></td>
            </tr>" : "") . "
        </table>
        
        <h3 style='margin-top: 20px;'>Message:</h3>
        <div style='background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 10px;'>
            " . nl2br($message) . "
        </div>
        
        <hr style='margin-top: 30px; border: none; border-top: 1px solid #eee;'>
        <p style='color: #888; font-size: 12px;'>
            Sent from $source Contact Form<br>
            Routed to: $targetEmail<br>
            CC'd to: " . self::$ccEmail . "
        </p>
        ";

        // Get client info for logging
        $ipAddress = self::getClientIp();
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';

        try {
            // Log email attempt first
            $logId = self::logEmail([
                'recipient_email' => $targetEmail,
                'cc_email' => self::$ccEmail,
                'reply_to_email' => $email,
                'subject' => $subject,
                'body_preview' => substr(strip_tags($message), 0, 500),
                'email_type' => 'contact',
                'status' => 'pending',
                'sender_name' => $name,
                'sender_email' => $email,
                'sender_company' => $company,
                'inquiry_purpose' => $purposeLabel,
                'origin_url' => $originUrl,
                'ip_address' => $ipAddress,
                'user_agent' => substr($userAgent, 0, 500),
            ]);
            
            // Send to primary recipient with CC
            $sent = MailService::sendWithCC($targetEmail, self::$ccEmail, $subject, $body, $email);
            
        if ($sent) {
                // Update log status
                self::updateEmailLogStatus($logId, 'sent');
                
                // Send auto-reply confirmation to user
                self::sendConfirmationEmail($email, $name, $purposeLabel, $message);
                
                // Send admin notification
                self::sendAdminNotification($name, $email, $company, $purposeLabel, $message, $targetEmail);
                
                // Log the contact submission
                error_log("Contact form submission from: $email - $name - Purpose: $purpose - Routed to: $targetEmail");
                Response::success(['message' => 'Message sent successfully']);
            } else {
                // Update log status
                self::updateEmailLogStatus($logId, 'failed', 'Failed to send via SMTP');
                
                // Still send admin notification for failed emails
                self::sendAdminNotification($name, $email, $company, $purposeLabel, $message, $targetEmail, true);
                
                // Log for manual follow-up even if email fails
                error_log("Contact form (email failed): $name <$email> - Purpose: $purpose - Company: $company - Message: $message");
                Response::success(['message' => 'Message received, we will contact you soon']);
            }
        } catch (\Exception $e) {
            error_log("Contact form error: " . $e->getMessage() . " - From: $email");
            // Still return success to user, log for manual processing
            Response::success(['message' => 'Message received, we will contact you soon']);
        }
    }

    /**
     * Log email to database
     */
    private static function logEmail(array $data): ?int
    {
        try {
            $pdo = Database::getInstance();
            $stmt = $pdo->prepare("
                INSERT INTO email_logs 
                (recipient_email, cc_email, reply_to_email, subject, body_preview, email_type, status, 
                 sender_name, sender_email, sender_company, inquiry_purpose, origin_url, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['recipient_email'],
                $data['cc_email'],
                $data['reply_to_email'],
                $data['subject'],
                $data['body_preview'],
                $data['email_type'],
                $data['status'],
                $data['sender_name'],
                $data['sender_email'],
                $data['sender_company'],
                $data['inquiry_purpose'],
                $data['origin_url'],
                $data['ip_address'],
                $data['user_agent'],
            ]);
            return (int)$pdo->lastInsertId();
        } catch (\Exception $e) {
            error_log("Failed to log email: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Update email log status
     */
    private static function updateEmailLogStatus(?int $logId, string $status, ?string $errorMessage = null): void
    {
        if (!$logId) return;
        
        try {
            $pdo = Database::getInstance();
            $stmt = $pdo->prepare("UPDATE email_logs SET status = ?, error_message = ? WHERE id = ?");
            $stmt->execute([$status, $errorMessage, $logId]);
        } catch (\Exception $e) {
            error_log("Failed to update email log: " . $e->getMessage());
        }
    }

    /**
     * Get client IP address
     */
    private static function getClientIp(): string
    {
        $headers = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
        
        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ips = explode(',', $_SERVER[$header]);
                return trim($ips[0]);
            }
        }
        
        return '127.0.0.1';
    }

    /**
     * Send confirmation email to the user
     */
    private static function sendConfirmationEmail(string $userEmail, string $userName, string $purposeLabel, string $originalMessage): void
    {
        try {
            $subject = "We received your message - IEOSUIA QR";
            
            $confirmationBody = "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            </head>
            <body style='margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif; background-color: #f4f4f5;'>
                <table width='100%' cellpadding='0' cellspacing='0' style='background-color: #f4f4f5; padding: 40px 20px;'>
                    <tr>
                        <td align='center'>
                            <table width='600' cellpadding='0' cellspacing='0' style='background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);'>
                                <!-- Header -->
                                <tr>
                                    <td style='background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 40px 40px 30px; text-align: center;'>
                                        <h1 style='color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;'>Message Received!</h1>
                                        <p style='color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;'>Thank you for contacting IEOSUIA QR</p>
                                    </td>
                                </tr>
                                
                                <!-- Body -->
                                <tr>
                                    <td style='padding: 40px;'>
                                        <p style='color: #18181b; font-size: 18px; margin: 0 0 20px; font-weight: 600;'>
                                            Hi $userName,
                                        </p>
                                        <p style='color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;'>
                                            We've received your message and want to thank you for reaching out to us. 
                                            Our team will review your inquiry and get back to you as soon as possible.
                                        </p>
                                        
                                        <!-- Info Box -->
                                        <div style='background-color: #f4f4f5; border-radius: 12px; padding: 24px; margin: 24px 0;'>
                                            <p style='color: #71717a; font-size: 14px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;'>Inquiry Type</p>
                                            <p style='color: #18181b; font-size: 16px; margin: 0 0 16px; font-weight: 500;'>$purposeLabel</p>
                                            
                                            <p style='color: #71717a; font-size: 14px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;'>Your Message</p>
                                            <p style='color: #52525b; font-size: 14px; margin: 0; line-height: 1.6; white-space: pre-wrap;'>" . nl2br(htmlspecialchars(substr($originalMessage, 0, 500))) . (strlen($originalMessage) > 500 ? '...' : '') . "</p>
                                        </div>
                                        
                                        <!-- Response Time -->
                                        <div style='background: linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(13, 148, 136, 0.1) 100%); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;'>
                                            <p style='color: #0d9488; font-size: 14px; margin: 0; font-weight: 600;'>
                                                ⏱️ Expected Response Time: Within 24 hours
                                            </p>
                                        </div>
                                        
                                        <p style='color: #52525b; font-size: 16px; line-height: 1.6; margin: 20px 0;'>
                                            In the meantime, feel free to explore our platform or reach out via WhatsApp for immediate assistance.
                                        </p>
                                        
                                        <!-- CTA Button -->
                                        <div style='text-align: center; margin: 30px 0;'>
                                            <a href='https://wa.me/27799282775' style='display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;'>
                                                💬 Chat on WhatsApp
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style='background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;'>
                                        <table width='100%'>
                                            <tr>
                                                <td style='text-align: center;'>
                                                    <p style='color: #71717a; font-size: 14px; margin: 0 0 10px;'>
                                                        <strong style='color: #18181b;'>IEOSUIA QR</strong>
                                                    </p>
                                                    <p style='color: #a1a1aa; font-size: 13px; margin: 0 0 5px;'>
                                                        Create, manage, and track QR codes with powerful analytics
                                                    </p>
                                                    <p style='color: #a1a1aa; font-size: 13px; margin: 0;'>
                                                        <a href='https://qr.ieosuia.com' style='color: #0d9488; text-decoration: none;'>qr.ieosuia.com</a> | 
                                                        <a href='mailto:hello@ieosuia.com' style='color: #0d9488; text-decoration: none;'>hello@ieosuia.com</a>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Disclaimer -->
                            <p style='color: #a1a1aa; font-size: 12px; margin: 20px 0 0; text-align: center;'>
                                This is an automated confirmation. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            ";

            // Log auto-reply
            self::logEmail([
                'recipient_email' => $userEmail,
                'cc_email' => null,
                'reply_to_email' => null,
                'subject' => $subject,
                'body_preview' => 'Auto-reply confirmation for contact form submission',
                'email_type' => 'notification',
                'status' => 'sent',
                'sender_name' => null,
                'sender_email' => null,
                'sender_company' => null,
                'inquiry_purpose' => null,
                'origin_url' => null,
                'ip_address' => self::getClientIp(),
                'user_agent' => null,
            ]);

            MailService::send($userEmail, $subject, $confirmationBody);
            error_log("Confirmation email sent to: $userEmail");
            
        } catch (\Exception $e) {
            // Don't fail the main request if confirmation email fails
            error_log("Failed to send confirmation email to $userEmail: " . $e->getMessage());
        }
    }
    
    /**
     * Send admin notification for new contact form submission
     */
    private static function sendAdminNotification(
        string $senderName, 
        string $senderEmail, 
        string $company, 
        string $purposeLabel, 
        string $message, 
        string $routedTo,
        bool $failed = false
    ): void {
        try {
            $statusBadge = $failed 
                ? '<span style="background: #ef4444; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px;">⚠️ EMAIL FAILED</span>'
                : '<span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px;">✓ Delivered</span>';
            
            $subject = ($failed ? "[URGENT] " : "") . "📬 New Contact Form: $purposeLabel from $senderName";
            
            $adminBody = "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            </head>
            <body style='margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif; background-color: #0a0a0a;'>
                <table width='100%' cellpadding='0' cellspacing='0' style='background-color: #0a0a0a; padding: 40px 20px;'>
                    <tr>
                        <td align='center'>
                            <table width='600' cellpadding='0' cellspacing='0' style='background-color: #141414; border-radius: 16px; overflow: hidden; border: 1px solid #262626;'>
                                <!-- Header -->
                                <tr>
                                    <td style='background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px 40px; text-align: center;'>
                                        <h1 style='color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;'>📬 New Contact Form Submission</h1>
                                        <p style='color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 14px;'>" . date('M j, Y \a\t g:i A') . "</p>
                                    </td>
                                </tr>
                                
                                <!-- Status -->
                                <tr>
                                    <td style='padding: 20px 40px 0;'>
                                        $statusBadge
                                    </td>
                                </tr>
                                
                                <!-- Body -->
                                <tr>
                                    <td style='padding: 30px 40px;'>
                                        <!-- Contact Info Card -->
                                        <div style='background-color: #1f1f1f; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #333;'>
                                            <h3 style='color: #ffffff; margin: 0 0 16px; font-size: 16px; font-weight: 600;'>Contact Details</h3>
                                            <table style='width: 100%;'>
                                                <tr>
                                                    <td style='color: #71717a; font-size: 13px; padding: 6px 0;'>Name:</td>
                                                    <td style='color: #ffffff; font-size: 14px; font-weight: 500;'>$senderName</td>
                                                </tr>
                                                <tr>
                                                    <td style='color: #71717a; font-size: 13px; padding: 6px 0;'>Email:</td>
                                                    <td style='color: #3b82f6; font-size: 14px;'><a href='mailto:$senderEmail' style='color: #3b82f6; text-decoration: none;'>$senderEmail</a></td>
                                                </tr>
                                                " . ($company ? "<tr>
                                                    <td style='color: #71717a; font-size: 13px; padding: 6px 0;'>Company:</td>
                                                    <td style='color: #ffffff; font-size: 14px;'>$company</td>
                                                </tr>" : "") . "
                                                <tr>
                                                    <td style='color: #71717a; font-size: 13px; padding: 6px 0;'>Inquiry Type:</td>
                                                    <td><span style='background: #3b82f6; color: white; padding: 3px 10px; border-radius: 4px; font-size: 12px;'>$purposeLabel</span></td>
                                                </tr>
                                                <tr>
                                                    <td style='color: #71717a; font-size: 13px; padding: 6px 0;'>Routed To:</td>
                                                    <td style='color: #a3a3a3; font-size: 14px;'>$routedTo</td>
                                                </tr>
                                            </table>
                                        </div>
                                        
                                        <!-- Message Card -->
                                        <div style='background-color: #1f1f1f; border-radius: 12px; padding: 24px; border: 1px solid #333;'>
                                            <h3 style='color: #ffffff; margin: 0 0 16px; font-size: 16px; font-weight: 600;'>Message</h3>
                                            <p style='color: #d4d4d4; font-size: 14px; line-height: 1.7; margin: 0; white-space: pre-wrap;'>" . nl2br(htmlspecialchars($message)) . "</p>
                                        </div>
                                        
                                        <!-- Quick Actions -->
                                        <div style='margin-top: 24px; text-align: center;'>
                                            <a href='mailto:$senderEmail?subject=Re: $purposeLabel' style='display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-right: 10px;'>Reply to $senderName</a>
                                            <a href='" . ($_ENV['APP_URL'] ?? 'https://qr.ieosuia.com') . "/admin/emails' style='display: inline-block; background: #262626; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #404040;'>View in Admin</a>
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style='background-color: #0a0a0a; padding: 20px 40px; border-top: 1px solid #262626; text-align: center;'>
                                        <p style='color: #525252; font-size: 12px; margin: 0;'>
                                            IEOSUIA QR Admin Notification System
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            ";

            // Get notification emails from settings
            $notificationEmails = self::getNotificationEmails();
            
            foreach ($notificationEmails as $adminEmail) {
                MailService::send($adminEmail, $subject, $adminBody);
            }
            error_log("Admin notification sent to " . count($notificationEmails) . " recipients for contact form from: $senderEmail");
            
        } catch (\Exception $e) {
            // Don't fail if admin notification fails
            error_log("Failed to send admin notification: " . $e->getMessage());
        }
    }
    
    /**
     * Get notification emails from admin settings
     */
    private static function getNotificationEmails(): array
    {
        try {
            $pdo = Database::getInstance();
            $stmt = $pdo->prepare("SELECT setting_value FROM admin_settings WHERE setting_key = 'notification_emails'");
            $stmt->execute();
            $result = $stmt->fetch();
            
            if ($result && $result['setting_value']) {
                $emails = json_decode($result['setting_value'], true);
                return is_array($emails) && count($emails) > 0 ? $emails : [self::$adminNotificationEmail];
            }
        } catch (\Exception $e) {
            error_log("Failed to get notification emails from settings: " . $e->getMessage());
        }
        
        return [self::$adminNotificationEmail];
    }
    
    /**
     * Check if notifications are enabled for a specific type
     */
    private static function isNotificationEnabled(string $type): bool
    {
        try {
            $pdo = Database::getInstance();
            $key = "notify_on_{$type}";
            $stmt = $pdo->prepare("SELECT setting_value FROM admin_settings WHERE setting_key = ?");
            $stmt->execute([$key]);
            $result = $stmt->fetch();
            
            if ($result) {
                return $result['setting_value'] === 'true' || $result['setting_value'] === '1';
            }
        } catch (\Exception $e) {
            error_log("Failed to check notification setting: " . $e->getMessage());
        }
        
        return true; // Default to enabled
    }
}
