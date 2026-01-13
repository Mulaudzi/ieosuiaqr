-- Migration: Add failed_payment_count column to subscriptions table
-- This column tracks consecutive payment failures for the retry system

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS failed_payment_count INT DEFAULT 0 AFTER grace_period_ends_at;

-- Add index for efficient queries on failed payments
CREATE INDEX IF NOT EXISTS idx_subscriptions_failed_payments 
ON subscriptions(failed_payment_count);
