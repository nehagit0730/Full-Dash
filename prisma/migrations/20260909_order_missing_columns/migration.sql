-- The Order table was missing every column added to schema.prisma after it was
-- first created, so `prisma.order.upsert` failed with
-- "The column `Order.subtotal` does not exist in the current database" on every
-- single save. The error was swallowed by a try/catch, orders survived only in
-- the StoreResource JSON blob, and the Order table sat empty while the shop ran.
--
-- Additive only: no column is dropped, altered or renamed, so this cannot lose
-- data and is safe to run against the live database.

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingCost" DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discountAmount" DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'GBP';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "royalMailOrderId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "notificationsSent" JSONB;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "subscriptionDetails" JSONB;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "isSubscription" BOOLEAN NOT NULL DEFAULT false;

-- Same story for the file table: `FileEntry.productId` does not exist, so every
-- files read logged a Prisma error and fell back to the JSON blob.
ALTER TABLE "FileEntry" ADD COLUMN IF NOT EXISTS "productId" TEXT;
ALTER TABLE "FileEntry" ADD COLUMN IF NOT EXISTS "collectionId" TEXT;
ALTER TABLE "FileEntry" ADD COLUMN IF NOT EXISTS "blogPostId" TEXT;

CREATE INDEX IF NOT EXISTS "Order_subscriptionId_idx" ON "Order"("subscriptionId");
