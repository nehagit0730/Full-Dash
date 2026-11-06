import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAdmin, AdminRequest } from "../middleware/requireAdmin";
import { verifyAdminCredentials } from "../services/adminAuth";
import { getConnectionStatus } from "../../serverDb";
import { isEncryptionConfigured } from "../services/integrations/crypto";
import { getDefinition } from "../services/integrations/registry";
import {
  getIntegrationView,
  IntegrationValidationError,
  listAudit,
  listIntegrationViews,
  recordTestResult,
  saveIntegration,
  writeAudit
} from "../services/integrations/store";
import { runConnectionTest } from "../services/integrations/connectionTests";

/**
 * Settings → Integrations / Payments / Shipping & Delivery / Age Verification.
 *
 * Every route is admin-only. Responses carry masked secrets only; the store's
 * view function is the single place that masking happens.
 */
const router = Router();
router.use(requireAdmin);

const actorOf = (req: AdminRequest) => req.admin?.email || "unknown-admin";

function fail(res: Response, err: any) {
  if (err instanceof IntegrationValidationError) {
    return res.status(400).json({ error: err.message, fieldErrors: err.fieldErrors });
  }
  console.error("[Integrations API]", err?.message || err);
  return res.status(500).json({ error: err?.message || "Unexpected error." });
}

router.get("/", async (_req, res) => {
  try {
    const integrations = await listIntegrationViews();
    const db = await getConnectionStatus();
    res.json({
      encryptionConfigured: isEncryptionConfigured(),
      siteUrl: process.env.APP_URL && !/MY_APP_URL/.test(process.env.APP_URL) ? process.env.APP_URL.replace(/\/+$/, "") : null,
      database: { status: db.status, host: db.host || null, database: db.database || null, error: db.error || null },
      integrations
    });
  } catch (err) {
    fail(res, err);
  }
});

router.get("/audit/log", async (req, res) => {
  try {
    const id = typeof req.query.integration === "string" ? req.query.integration : undefined;
    res.json(await listAudit(id, Number(req.query.limit) || 100));
  } catch (err) {
    fail(res, err);
  }
});

/**
 * Neon connection: validate a candidate connection string WITHOUT switching to
 * it. The live DATABASE_URL is a bootstrap secret that belongs in the hosting
 * environment, not in a dashboard field — changing it from inside the running
 * app is how a store locks itself out of its own data.
 */
router.post("/database/test-candidate", async (req: AdminRequest, res) => {
  const { uri, confirmPassword } = req.body || {};
  if (!confirmPassword || !verifyAdminCredentials(actorOf(req), String(confirmPassword))) {
    return res.status(403).json({ error: "Re-enter your admin password to test a database connection." });
  }
  const parsed = validatePostgresUrl(uri);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error });

  const client = new PrismaClient({ datasources: { db: { url: parsed.url } } });
  const started = Date.now();
  try {
    await client.$queryRawUnsafe("SELECT 1");
    const tables: any[] = await client.$queryRawUnsafe(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    const names = new Set(tables.map(t => t.table_name));
    const required = ["StoreResource", "StoreSetting", "Order", "Product", "Customer"];
    const missing = required.filter(t => !names.has(t));
    await writeAudit("neon", "test_candidate", actorOf(req), [], { host: parsed.host, ok: true, missingTables: missing });
    res.json({
      ok: true,
      latencyMs: Date.now() - started,
      host: parsed.host,
      isNeon: /neon\.tech$/i.test(parsed.host),
      tableCount: names.size,
      missingTables: missing,
      message: missing.length
        ? `Connected, but this database is missing ${missing.join(", ")}. It is not a copy of the store database — do not switch to it.`
        : "Connected and the store schema is present. To switch, update DATABASE_URL in your hosting environment and redeploy."
    });
  } catch (err: any) {
    await writeAudit("neon", "test_candidate", actorOf(req), [], { host: parsed.host, ok: false });
    res.status(200).json({ ok: false, host: parsed.host, error: String(err?.message || err).split("\n").slice(-2).join(" ").slice(0, 300) });
  } finally {
    await client.$disconnect().catch(() => {});
  }
});

export function validatePostgresUrl(uri: unknown): { ok: boolean; url?: string; host?: string; error?: string } {
  const raw = String(uri || "").trim().replace(/^["']|["']$/g, "");
  if (!raw) return { ok: false, error: "No connection string was provided." };
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false, error: "That is not a valid connection string." };
  }
  if (u.protocol !== "postgres:" && u.protocol !== "postgresql:") {
    return { ok: false, error: "Connection string must start with postgresql://" };
  }
  if (!u.hostname || !u.username || !u.password) return { ok: false, error: "Connection string must include host, user and password." };
  const ssl = u.searchParams.get("sslmode");
  if (!/^(localhost|127\.0\.0\.1)$/.test(u.hostname) && ssl !== "require" && ssl !== "verify-full") {
    return { ok: false, error: "Remote databases must use sslmode=require." };
  }
  return { ok: true, url: raw, host: u.hostname };
}

router.get("/:id", async (req, res) => {
  try {
    const view = await getIntegrationView(req.params.id);
    if (!view) return res.status(404).json({ error: "Unknown integration." });
    res.json(view);
  } catch (err) {
    fail(res, err);
  }
});

router.put("/:id", async (req: AdminRequest, res) => {
  try {
    const { enabled, mode, values, clearSecrets } = req.body || {};
    const view = await saveIntegration(
      req.params.id,
      {
        enabled: typeof enabled === "boolean" ? enabled : undefined,
        mode: mode === "test" || mode === "live" ? mode : undefined,
        values: values && typeof values === "object" ? values : undefined,
        clearSecrets: Array.isArray(clearSecrets) ? clearSecrets.map(String) : undefined
      },
      actorOf(req)
    );
    res.json({ success: true, integration: view });
  } catch (err) {
    fail(res, err);
  }
});

router.post("/:id/test", async (req: AdminRequest, res) => {
  try {
    const def = getDefinition(req.params.id);
    if (!def) return res.status(404).json({ error: "Unknown integration." });
    const view = await getIntegrationView(def.id);
    if (view && view.missingRequired.length) {
      return res.status(400).json({
        ok: false,
        message: `Save these first: ${view.missingRequired
          .map(k => def.fields.find(f => f.key === k)?.label || k)
          .join(", ")}.`
      });
    }
    const result = await runConnectionTest(def.id);
    if (!def.legacyPanel) await recordTestResult(def.id, result, actorOf(req));
    else await writeAudit(def.id, result.ok ? "test_passed" : "test_failed", actorOf(req), [], { message: result.message });
    res.json({ ...result, integration: await getIntegrationView(def.id) });
  } catch (err) {
    fail(res, err);
  }
});

export default router;
