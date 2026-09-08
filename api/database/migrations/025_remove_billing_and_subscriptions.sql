-- Remove the retired payment and subscription data model.
-- Back up financial records separately if retention is legally required.

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `payment_retries`;
DROP TABLE IF EXISTS `invoices`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `subscriptions`;
DROP TABLE IF EXISTS `plans`;

SET FOREIGN_KEY_CHECKS = 1;
