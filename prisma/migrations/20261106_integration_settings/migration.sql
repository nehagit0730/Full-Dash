-- Centralised integration settings and their audit trail.
--
-- Purely additive and idempotent (IF NOT EXISTS throughout), like the other
-- migrations here, because this database's migration history is not tracked.
-- serverDb.ensureNeonTablesExist() runs the same statements at boot.

CREATE TABLE IF NOT EXISTS "IntegrationSetting" (
    "id"             TEXT NOT NULL,
    "enabled"        BOOLEAN NOT NULL DEFAULT false,
    "mode"           TEXT NOT NULL DEFAULT 'test',
    "config"         JSONB NOT NULL DEFAULT '{}',
    "secrets"        JSONB NOT NULL DEFAULT '{}',
    "status"         TEXT NOT NULL DEFAULT 'not_configured',
    "lastError"      TEXT,
    "lastTestedAt"   TIMESTAMP(3),
    "lastTestResult" JSONB,
    "updatedBy"      TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IntegrationSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "IntegrationAuditLog" (
    "id"            TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "action"        TEXT NOT NULL,
    "actor"         TEXT,
    "changedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "details"       JSONB,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IntegrationAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IntegrationAuditLog_integrationId_idx" ON "IntegrationAuditLog" ("integrationId");
CREATE INDEX IF NOT EXISTS "IntegrationAuditLog_createdAt_idx" ON "IntegrationAuditLog" ("createdAt");
