<?php

namespace App\Services;

use App\Config\Database;

class EmailValidationService
{
    /**
     * Validate an email address for signup
     * Returns array with 'valid' boolean and 'message' string
     */
    public static function validate(string $email): array
    {
        $email = strtolower(trim($email));
        
        // Step 1: Basic format validation
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                'valid' => false,
                'message' => 'Please provide a valid email address.'
            ];
        }

        // Extract domain and local part
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return [
                'valid' => false,
                'message' => 'Please provide a valid email address.'
            ];
        }

        $localPart = $parts[0];
        $domain = $parts[1];

        // Step 2: Check for disposable email domain
        $disposableCheck = self::isDisposableDomain($domain);
        if ($disposableCheck) {
            error_log("Blocked disposable email attempt: {$email}");
            return [
                'valid' => false,
                'message' => 'Temporary or disposable email addresses are not allowed. Please use a permanent email address.'
            ];
        }

        // Step 3: Check for role-based email
        $roleCheck = self::isRoleBasedEmail($localPart);
        if ($roleCheck) {
            error_log("Blocked role-based email attempt: {$email}");
            return [
                'valid' => false,
                'message' => 'Generic role-based email addresses (e.g., admin@, info@) are not allowed. Please use a personal email address.'
            ];
        }

        // Step 4: Verify MX records exist for the domain
        $mxCheck = self::hasMXRecords($domain);
        if (!$mxCheck) {
            error_log("No MX records for domain: {$domain} (email: {$email})");
            return [
                'valid' => false,
                'message' => 'The email domain does not appear to accept emails. Please check your email address.'
            ];
        }

        return [
            'valid' => true,
            'message' => 'Email is valid.'
        ];
    }

    /**
     * Check if domain is in the disposable domains list
     */
    private static function isDisposableDomain(string $domain): bool
    {
        try {
            $pdo = Database::getInstance();
            
            // Check if table exists first
            $tableCheck = $pdo->query("SHOW TABLES LIKE 'blocked_email_domains'");
            if ($tableCheck->rowCount() === 0) {
                // Table doesn't exist, skip this check
                return false;
            }
            
            $stmt = $pdo->prepare("
                SELECT 1 FROM blocked_email_domains 
                WHERE domain = ? AND type = 'disposable' 
                LIMIT 1
            ");
            $stmt->execute([$domain]);
            return (bool) $stmt->fetch();
        } catch (\Exception $e) {
            error_log("Error checking disposable domain: " . $e->getMessage());
            // Fail open - allow the email if we can't check
            return false;
        }
    }

    /**
     * Check if the local part (before @) is a role-based pattern
     */
    private static function isRoleBasedEmail(string $localPart): bool
    {
        try {
            $pdo = Database::getInstance();
            
            // Check if table exists first
            $tableCheck = $pdo->query("SHOW TABLES LIKE 'blocked_email_domains'");
            if ($tableCheck->rowCount() === 0) {
                // Table doesn't exist, skip this check
                return false;
            }
            
            $stmt = $pdo->prepare("
                SELECT 1 FROM blocked_email_domains 
                WHERE domain = ? AND type = 'role' 
                LIMIT 1
            ");
            $stmt->execute([$localPart]);
            return (bool) $stmt->fetch();
        } catch (\Exception $e) {
            error_log("Error checking role-based email: " . $e->getMessage());
            // Fail open - allow the email if we can't check
            return false;
        }
    }

    /**
     * Verify that the domain has valid MX records
     */
    private static function hasMXRecords(string $domain): bool
    {
        // Check for MX records
        if (checkdnsrr($domain, 'MX')) {
            return true;
        }
        
        // Fallback: Check for A record (some domains accept mail without MX)
        if (checkdnsrr($domain, 'A')) {
            return true;
        }

        return false;
    }

    /**
     * Add a domain to the blocked list
     */
    public static function addBlockedDomain(string $domain, string $type = 'disposable'): bool
    {
        try {
            $pdo = Database::getInstance();
            $stmt = $pdo->prepare("
                INSERT IGNORE INTO blocked_email_domains (domain, type) 
                VALUES (?, ?)
            ");
            return $stmt->execute([strtolower(trim($domain)), $type]);
        } catch (\Exception $e) {
            error_log("Error adding blocked domain: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Remove a domain from the blocked list
     */
    public static function removeBlockedDomain(string $domain, string $type = 'disposable'): bool
    {
        try {
            $pdo = Database::getInstance();
            $stmt = $pdo->prepare("
                DELETE FROM blocked_email_domains 
                WHERE domain = ? AND type = ?
            ");
            return $stmt->execute([strtolower(trim($domain)), $type]);
        } catch (\Exception $e) {
            error_log("Error removing blocked domain: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get all blocked domains of a specific type
     */
    public static function getBlockedDomains(string $type = 'disposable'): array
    {
        try {
            $pdo = Database::getInstance();
            $stmt = $pdo->prepare("
                SELECT domain FROM blocked_email_domains 
                WHERE type = ? 
                ORDER BY domain
            ");
            $stmt->execute([$type]);
            return $stmt->fetchAll(\PDO::FETCH_COLUMN);
        } catch (\Exception $e) {
            error_log("Error fetching blocked domains: " . $e->getMessage());
            return [];
        }
    }
}
