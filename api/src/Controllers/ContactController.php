<?php

namespace App\Controllers;

use App\Helpers\Response;
use App\Helpers\Validator;
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

    public static function submit(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

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

        try {
            // Send to primary recipient with CC
            $sent = MailService::sendWithCC($targetEmail, self::$ccEmail, $subject, $body, $email);
            
            if ($sent) {
                // Log the contact submission
                error_log("Contact form submission from: $email - $name - Purpose: $purpose - Routed to: $targetEmail");
                Response::success(['message' => 'Message sent successfully']);
            } else {
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
}
