-- DESTRUCTIVE. Permanently removes the Worldpay and Royal Mail columns.
--
-- NOT run at boot. Apply only with:
--   npx tsx scripts/applyDropLegacyColumns.ts --confirm
-- which first exports every non-empty value in these columns to backups/.
-- Take a Neon branch/backup before running it. There is no undo.

ALTER TABLE "Order" DROP COLUMN IF EXISTS "worldpayTxId";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "worldpayAuthCode";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "royalMailOrderId";

ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "worldpayTransactionId";
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "worldpayTokenHref";
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "worldpayRecurringHref";
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "worldpaySchemeReference";
