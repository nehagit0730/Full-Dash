-- Gateway payment attempts (Razorpay). Additive and idempotent; also run at
-- boot by serverDb.ensureNeonTablesExist().

CREATE TABLE IF NOT EXISTS "PaymentTransaction" (
    "id"                TEXT NOT NULL,
    "provider"          TEXT NOT NULL,
    "orderId"           TEXT NOT NULL,
    "providerOrderId"   TEXT,
    "providerPaymentId" TEXT,
    "amount"            INTEGER NOT NULL,
    "currency"          TEXT NOT NULL DEFAULT 'INR',
    "status"            TEXT NOT NULL DEFAULT 'created',
    "mode"              TEXT NOT NULL DEFAULT 'test',
    "customerEmail"     TEXT,
    "checkout"          JSONB NOT NULL,
    "refunds"           JSONB NOT NULL DEFAULT '[]',
    "refundedAmount"    INTEGER NOT NULL DEFAULT 0,
    "lastError"         TEXT,
    "orderRecorded"     BOOLEAN NOT NULL DEFAULT false,
    "paidAt"            TIMESTAMP(3),
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentTransaction_orderId_key" ON "PaymentTransaction" ("orderId");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentTransaction_providerOrderId_key" ON "PaymentTransaction" ("providerOrderId");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_status_idx" ON "PaymentTransaction" ("status");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_customerEmail_idx" ON "PaymentTransaction" ("customerEmail");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_createdAt_idx" ON "PaymentTransaction" ("createdAt");

ALTER TABLE "Order" ALTER COLUMN "currency" SET DEFAULT 'INR';
