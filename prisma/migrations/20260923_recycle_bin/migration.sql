-- The recycle bin: deleted records are held here for 30 days.
--
-- Purely additive. It creates one new table and touches nothing that exists,
-- and every statement carries IF NOT EXISTS so the migration is safe to re-run
-- against a database whose migration history is not tracked.

CREATE TABLE IF NOT EXISTS "RecycleBinItem" (
    "id"        TEXT NOT NULL,
    "resource"  TEXT NOT NULL,
    "itemId"    TEXT NOT NULL,
    "label"     TEXT,
    "payload"   JSONB NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,

    CONSTRAINT "RecycleBinItem_pkey" PRIMARY KEY ("id")
);

-- One bin entry per record. Deleting, restoring and deleting again reuses the
-- same slot instead of stacking duplicates the admin would have to sift.
CREATE UNIQUE INDEX IF NOT EXISTS "RecycleBinItem_resource_itemId_key"
    ON "RecycleBinItem" ("resource", "itemId");

CREATE INDEX IF NOT EXISTS "RecycleBinItem_resource_idx"  ON "RecycleBinItem" ("resource");
CREATE INDEX IF NOT EXISTS "RecycleBinItem_expiresAt_idx" ON "RecycleBinItem" ("expiresAt");
CREATE INDEX IF NOT EXISTS "RecycleBinItem_deletedAt_idx" ON "RecycleBinItem" ("deletedAt");
