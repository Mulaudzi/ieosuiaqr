<?php

namespace App\Services;

class MailService
{
    private static string $host;
    private static int $port;
    private static string $username;
    private static string $password;
    private static string $fromEmail;
    private static string $fromName;

    public static function init(): void
    {
        self::$host = $_ENV['SMTP_HOST'] ?? 'qr.ieosuia.com';
        self::$port = (int)($_ENV['SMTP_PORT'] ?? 465);
        self::$username = $_ENV['SMTP_USER'] ?? 'noreply@qr.ieosuia.com';
        self::$password = $_ENV['SMTP_PASS'] ?? 'I Am Ieosuia';
        self::$fromEmail = $_ENV['SMTP_FROM_EMAIL'] ?? 'noreply@qr.ieosuia.com';
        self::$fromName = $_ENV['SMTP_FROM_NAME'] ?? 'IEOSUIA QR';
    }

    /**
     * Send email using SMTP with SSL
     */
    public static function send(string $to, string $subject, string $htmlBody, ?string $textBody = null): bool
    {
        self::init();

        try {
            // Create socket connection with SSL
            $socket = @fsockopen('ssl://' . self::$host, self::$port, $errno, $errstr, 30);
            
            if (!$socket) {
                error_log("SMTP Connection failed: $errstr ($errno)");
                return false;
            }

            // Set timeout
            stream_set_timeout($socket, 30);

            // Read greeting
            self::readResponse($socket);

            // Send EHLO
            self::sendCommand($socket, 'EHLO ' . self::$host);

            // Authenticate
            self::sendCommand($socket, 'AUTH LOGIN');
            self::sendCommand($socket, base64_encode(self::$username));
            self::sendCommand($socket, base64_encode(self::$password));

            // Set sender
            self::sendCommand($socket, 'MAIL FROM:<' . self::$fromEmail . '>');

            // Set recipient
            self::sendCommand($socket, 'RCPT TO:<' . $to . '>');

            // Start data
            self::sendCommand($socket, 'DATA');

            // Generate boundary for multipart
            $boundary = md5(uniqid(time()));

            // Build headers
            $headers = "From: " . self::$fromName . " <" . self::$fromEmail . ">\r\n";
            $headers .= "To: <$to>\r\n";
            $headers .= "Subject: $subject\r\n";
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n";
            $headers .= "Date: " . date('r') . "\r\n";
            $headers .= "\r\n";

            // Build body
            $body = "--$boundary\r\n";
            $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
            $body .= ($textBody ?? strip_tags($htmlBody)) . "\r\n\r\n";
            
            $body .= "--$boundary\r\n";
            $body .= "Content-Type: text/html; charset=UTF-8\r\n";
            $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
            $body .= $htmlBody . "\r\n\r\n";
            
            $body .= "--$boundary--\r\n";

            // Send message
            fwrite($socket, $headers . $body . "\r\n.\r\n");
            self::readResponse($socket);

            // Quit
            self::sendCommand($socket, 'QUIT');

            fclose($socket);
            return true;

        } catch (\Exception $e) {
            error_log("SMTP Error: " . $e->getMessage());
            return false;
        }
    }

    private static function sendCommand($socket, string $command): string
    {
        fwrite($socket, $command . "\r\n");
        return self::readResponse($socket);
    }

    private static function readResponse($socket): string
    {
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) === ' ') {
                break;
            }
        }
        return $response;
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
