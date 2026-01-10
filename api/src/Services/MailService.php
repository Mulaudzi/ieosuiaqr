<?php

namespace App\Services;

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
     * Get styled email template
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
