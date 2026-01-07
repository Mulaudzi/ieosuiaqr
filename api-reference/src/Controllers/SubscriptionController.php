<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;
use App\Middleware\Auth;

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
