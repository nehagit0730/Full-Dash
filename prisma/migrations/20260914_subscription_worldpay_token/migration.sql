-- The stored-card token Worldpay issues when a subscription's first payment is
-- taken with `createToken`.
--
-- Worldpay integration support confirmed there is no automatically renewing
-- subscription product: every month is a fresh Payments API request, and that
-- request must carry the token href for the card. A scheme transaction
-- reference identifies the agreement, not the card, so renewals built from one
-- alone had no payment instrument to charge.
--
-- Purely additive. The column is nullable, no existing column or row is
-- touched, and IF NOT EXISTS makes the migration safe to re-run.

ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "worldpayTokenHref" TEXT;
