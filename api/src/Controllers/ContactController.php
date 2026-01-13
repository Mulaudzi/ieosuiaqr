<?php

namespace App\Controllers;

use App\Helpers\Response;
use App\Helpers\Validator;
use App\Services\MailService;

class ContactController
{
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

        // Validate lengths
        if (strlen($name) > 100) {
            Response::error('Name must be less than 100 characters', 422);
        }
        if (strlen($message) > 2000) {
            Response::error('Message must be less than 2000 characters', 422);
        }

        // Try to send email
        $adminEmail = $_ENV['ADMIN_EMAIL'] ?? 'hello@ieosuia.com';
        $subject = "[$source] Contact Form: Message from $name";
        
        $body = "
        <h2>New Contact Form Submission</h2>
        <p><strong>Source:</strong> $source</p>
        <p><strong>Name:</strong> $name</p>
        <p><strong>Email:</strong> $email</p>
        " . ($company ? "<p><strong>Company:</strong> $company</p>" : "") . "
        <p><strong>Message:</strong></p>
        <p>" . nl2br($message) . "</p>
        <hr>
        <p><small>Sent from $source Contact Form</small></p>
        ";

        try {
            $sent = MailService::send($adminEmail, $subject, $body);
            
            if ($sent) {
                // Log the contact submission
                error_log("Contact form submission from: $email - $name");
                Response::success(['message' => 'Message sent successfully']);
            } else {
                // Log for manual follow-up even if email fails
                error_log("Contact form (email failed): $name <$email> - Company: $company - Message: $message");
                Response::success(['message' => 'Message received, we will contact you soon']);
            }
        } catch (\Exception $e) {
            error_log("Contact form error: " . $e->getMessage() . " - From: $email");
            // Still return success to user, log for manual processing
            Response::success(['message' => 'Message received, we will contact you soon']);
        }
    }
}
