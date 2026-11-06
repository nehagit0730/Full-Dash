-- The Subscription model declared these fields, but the live table never had the
-- columns, so every write silently dropped them: renewals lost the customer's box
-- contents, a repeated gateway callback could not be recognised as a duplicate,
-- and cancellations left no record.
--
-- Purely additive. Every column is nullable, no existing column or row is touched,
-- and IF NOT EXISTS makes the migration safe to re-run.

ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "lastPaymentError"   TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "items"              JSONB;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "cansCount"          INTEGER;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "itemPrice"          DOUBLE PRECISION;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "shippingCost"       DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "shippingAddress"    TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "deliveryMethod"     TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "sourceOrderId"      TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "cancelledAt"        TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT;
