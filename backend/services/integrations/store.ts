import crypto from "crypto";
import { prisma } from "../../../src/lib/prisma";
import { getDb } from "../../../serverDb";
import {
  decryptSecret,
  encryptSecret,
  isEncryptionConfigured,
  isMaskPlaceholder,
  maskSecret
} from "./crypto";
import { getDefinition, INTEGRATIONS, IntegrationDefinition, IntegrationField } from "./registry";

/**
 * The one place integration settings are read and written.
 *
 * Neon is the source of truth. There is deliberately no local-file fallback for
 * writes (unlike older settings in this codebase): a credential written to a
 * JSON file on disk is a plaintext credential, and on Vercel the file vanishes
 * on the next invocation anyway. If the database is unreachable, a save fails
 * loudly instead.
 */

export type IntegrationMode = "test" | "live";
export type IntegrationStatus =
  | "not_configured" // required credentials missing
  | "disabled" // configured but switched off
  | "untested" // enabled and configured, never successfully tested
  | "connected" // last connection test passed
  | "error" // last connection test failed
  | "misconfigured"; // stored data cannot be used (e.g. cannot be decrypted)

export class IntegrationValidationError extends Error {
  status = 400;
  constructor(message: string, public fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "IntegrationValidationError";
  }
}

interface StoredRow {
  id: string;
  enabled: boolean;
  mode: string;
  config: Record<string, any>;
  secrets: Record<string, string>;
  status: string;
  lastError: string | null;
  lastTestedAt: Date | null;
  lastTestResult: any;
  updatedBy: string | null;
  updatedAt: Date | null;
}

const asObject = (v: unknown): Record<string, any> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, any>) : {};

async function loadRow(id: string): Promise<StoredRow | null> {
  if (!(await getDb())) return null;
  try {
    const row = await prisma.integrationSetting.findUnique({ where: { id } });
    if (!row) return null;
    return {
      ...row,
      config: asObject(row.config),
      secrets: asObject(row.secrets) as Record<string, string>
    };
  } catch (err: any) {
    console.error(`[Integrations] Could not read settings for ${id}:`, err?.message || err);
    return null;
  }
}

function envValue(field: IntegrationField): string {
  for (const name of field.env || []) {
    const v = process.env[name];
    if (v && v.trim()) return v.trim();
  }
  return "";
}

/**
 * Resolves every field to its effective value: stored value, then environment
 * fallback, then the field default. Secrets are decrypted. SERVER-SIDE ONLY —
 * nothing returned from here may be sent to a client.
 */
function resolveValues(def: IntegrationDefinition, row: StoredRow | null) {
  const values: Record<string, any> = {};
  const sources: Record<string, "stored" | "env" | "default" | "none"> = {};
  const decryptErrors: string[] = [];

  for (const f of def.fields) {
    let v: any = undefined;
    let source: "stored" | "env" | "default" | "none" = "none";
    if (f.secret) {
      const stored = row?.secrets?.[f.key];
      if (stored) {
        try {
          v = decryptSecret(stored);
          source = "stored";
        } catch {
          decryptErrors.push(f.key);
        }
      }
    } else if (row?.config && row.config[f.key] !== undefined && row.config[f.key] !== "") {
      v = row.config[f.key];
      source = "stored";
    }
    if ((v === undefined || v === "") && envValue(f)) {
      v = envValue(f);
      source = "env";
    }
    if ((v === undefined || v === "") && f.defaultValue !== undefined) {
      v = f.defaultValue;
      source = "default";
    }
    values[f.key] = v;
    sources[f.key] = source;
  }
  return { values, sources, decryptErrors };
}

function missingRequired(def: IntegrationDefinition, values: Record<string, any>, mode: IntegrationMode): string[] {
  return def.fields
    .filter(f => f.required || (f.requiredInMode && f.requiredInMode === mode))
    .filter(f => {
      const v = values[f.key];
      return v === undefined || v === null || String(v).trim() === "";
    })
    .map(f => f.key);
}

function deriveStatus(
  row: StoredRow | null,
  enabled: boolean,
  missing: string[],
  decryptErrors: string[]
): IntegrationStatus {
  if (decryptErrors.length) return "misconfigured";
  if (missing.length) return "not_configured";
  if (!enabled) return "disabled";
  if (row?.status === "connected" || row?.status === "error") return row.status as IntegrationStatus;
  return "untested";
}

/** Server-side credentials for an adapter. Throws if the integration is unusable. */
export async function getIntegrationCredentials(id: string, opts: { requireEnabled?: boolean } = {}) {
  const def = getDefinition(id);
  if (!def) throw new Error(`Unknown integration "${id}".`);
  const row = await loadRow(id);
  const { values, decryptErrors } = resolveValues(def, row);
  const mode: IntegrationMode = row?.mode === "live" ? "live" : def.supportsTestMode ? "test" : "live";
  const enabled = Boolean(row?.enabled);
  if (decryptErrors.length) {
    throw new Error(
      `${def.name}: stored credentials (${decryptErrors.join(", ")}) cannot be decrypted. ` +
        "Check SETTINGS_ENCRYPTION_KEY has not changed, then re-enter them."
    );
  }
  if (opts.requireEnabled && !enabled) throw new Error(`${def.name} is disabled.`);
  return { definition: def, values, mode, enabled };
}

/** True when the integration is switched on and has every required credential. */
export async function isIntegrationActive(id: string): Promise<boolean> {
  try {
    const { values, mode, enabled, definition } = await getIntegrationCredentials(id);
    return enabled && missingRequired(definition, values, mode).length === 0;
  } catch {
    return false;
  }
}

/** The client-safe view of one integration. This is all the dashboard ever sees. */
export async function getIntegrationView(id: string) {
  const def = getDefinition(id);
  if (!def) return null;
  const row = await loadRow(id);
  const { values, sources, decryptErrors } = resolveValues(def, row);
  const mode: IntegrationMode = row?.mode === "live" ? "live" : def.supportsTestMode ? "test" : "live";
  const enabled = Boolean(row?.enabled);
  const missing = def.legacyPanel ? [] : missingRequired(def, values, mode);

  const fields: Record<string, { value: any; set: boolean; source: string }> = {};
  for (const f of def.fields) {
    const v = values[f.key];
    const set = v !== undefined && v !== null && String(v) !== "";
    fields[f.key] = {
      // Secrets are reduced to a mask here and nowhere else, so no other code
      // path has to remember to do it.
      value: f.secret ? (set ? maskSecret(String(v)) : "") : v ?? "",
      set,
      source: sources[f.key]
    };
  }

  return {
    id: def.id,
    name: def.name,
    category: def.category,
    description: def.description,
    supportsTestMode: def.supportsTestMode,
    webhookPath: def.webhookPath || null,
    docsUrl: def.docsUrl || null,
    legacyPanel: def.legacyPanel || null,
    capabilities: def.capabilities,
    schema: def.fields.map(f => ({
      key: f.key,
      label: f.label,
      type: f.type,
      secret: Boolean(f.secret),
      required: Boolean(f.required),
      help: f.help || null,
      placeholder: f.placeholder || null,
      options: f.options || null,
      hasEnvFallback: Boolean(f.env?.length)
    })),
    enabled,
    mode,
    fields,
    missingRequired: missing,
    status: def.legacyPanel ? "managed_externally" : deriveStatus(row, enabled, missing, decryptErrors),
    lastError: row?.lastError || (decryptErrors.length ? `Cannot decrypt: ${decryptErrors.join(", ")}` : null),
    lastTestedAt: row?.lastTestedAt || null,
    updatedAt: row?.updatedAt || null,
    updatedBy: row?.updatedBy || null,
    persisted: Boolean(row)
  };
}

export async function listIntegrationViews() {
  return Promise.all(INTEGRATIONS.map(d => getIntegrationView(d.id)));
}

function coerce(field: IntegrationField, raw: any): { ok: boolean; value?: any; error?: string } {
  if (raw === null || raw === undefined) return { ok: true, value: "" };
  switch (field.type) {
    case "boolean":
      return { ok: true, value: raw === true || raw === "true" || raw === 1 };
    case "number": {
      if (raw === "") return { ok: true, value: "" };
      const n = Number(raw);
      return Number.isFinite(n) ? { ok: true, value: n } : { ok: false, error: "Must be a number." };
    }
    case "select": {
      const v = String(raw);
      if (v === "") return { ok: true, value: "" };
      return field.options?.some(o => o.value === v)
        ? { ok: true, value: v }
        : { ok: false, error: "Not one of the allowed options." };
    }
    case "url": {
      const v = String(raw).trim();
      if (!v) return { ok: true, value: "" };
      try {
        const u = new URL(v);
        if (u.protocol !== "https:") return { ok: false, error: "Must be an https:// URL." };
        return { ok: true, value: v };
      } catch {
        return { ok: false, error: "Not a valid URL." };
      }
    }
    case "email": {
      const v = String(raw).trim();
      if (!v) return { ok: true, value: "" };
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? { ok: true, value: v } : { ok: false, error: "Not a valid email." };
    }
    default: {
      const v = String(raw).trim();
      if (v.length > 4096) return { ok: false, error: "Value is too long." };
      return { ok: true, value: v };
    }
  }
}

export interface IntegrationPatch {
  enabled?: boolean;
  mode?: IntegrationMode;
  /** Non-secret and secret field values together; the definition decides which is which. */
  values?: Record<string, any>;
  /** Secret fields to delete. Blank values never delete — they mean "unchanged". */
  clearSecrets?: string[];
}

/**
 * Applies a partial update. Only fields present in the patch change, so a save
 * from a stale dashboard tab can never wipe a credential it did not touch.
 */
export async function saveIntegration(id: string, patch: IntegrationPatch, actor: string) {
  const def = getDefinition(id);
  if (!def) throw new IntegrationValidationError(`Unknown integration "${id}".`);
  if (def.legacyPanel) {
    throw new IntegrationValidationError(`${def.name} is managed in its own settings panel.`);
  }
  if (!(await getDb())) {
    throw new Error("The database is not reachable, so settings cannot be saved. Nothing was changed.");
  }

  const row = await loadRow(id);
  const config = { ...(row?.config || {}) };
  const secrets = { ...(row?.secrets || {}) };
  const changed: string[] = [];
  const fieldErrors: Record<string, string> = {};

  const values = asObject(patch.values);
  for (const f of def.fields) {
    if (!(f.key in values)) continue;
    const raw = values[f.key];

    if (f.secret) {
      // Blank or the mask the dashboard was shown = leave the stored secret alone.
      if (raw === undefined || raw === null || String(raw).trim() === "" || isMaskPlaceholder(raw)) continue;
      const c = coerce(f, raw);
      if (!c.ok) {
        fieldErrors[f.key] = c.error;
        continue;
      }
      if (!isEncryptionConfigured()) {
        throw new IntegrationValidationError(
          "SETTINGS_ENCRYPTION_KEY is not configured on the server, so credentials cannot be stored securely. Nothing was saved."
        );
      }
      secrets[f.key] = encryptSecret(String(c.value));
      changed.push(f.key);
    } else {
      const c = coerce(f, raw);
      if (!c.ok) {
        fieldErrors[f.key] = c.error;
        continue;
      }
      if (config[f.key] !== c.value) {
        config[f.key] = c.value;
        changed.push(f.key);
      }
    }
  }

  for (const key of patch.clearSecrets || []) {
    const f = def.fields.find(x => x.key === key && x.secret);
    if (f && secrets[key]) {
      delete secrets[key];
      changed.push(`${key} (cleared)`);
    }
  }

  if (Object.keys(fieldErrors).length) {
    throw new IntegrationValidationError("Some fields are invalid.", fieldErrors);
  }

  let mode: IntegrationMode = row?.mode === "live" ? "live" : "test";
  if (patch.mode !== undefined) {
    if (patch.mode !== "test" && patch.mode !== "live") throw new IntegrationValidationError("Mode must be test or live.");
    if (!def.supportsTestMode && patch.mode === "test") {
      throw new IntegrationValidationError(`${def.name} has no test mode.`);
    }
    if (patch.mode !== mode) changed.push("mode");
    mode = patch.mode;
  }
  if (!def.supportsTestMode) mode = "live";

  let enabled = Boolean(row?.enabled);
  if (patch.enabled !== undefined && Boolean(patch.enabled) !== enabled) {
    enabled = Boolean(patch.enabled);
    changed.push(enabled ? "enabled" : "disabled");
  }

  // Validate the configuration as it WILL be, before anything is written.
  const candidate: StoredRow = {
    ...(row || ({} as StoredRow)),
    id,
    enabled,
    mode,
    config,
    secrets
  } as StoredRow;
  const { values: effective, decryptErrors } = resolveValues(def, candidate);
  if (enabled) {
    const missing = missingRequired(def, effective, mode);
    if (missing.length || decryptErrors.length) {
      const labels = missing.map(k => def.fields.find(f => f.key === k)?.label || k);
      throw new IntegrationValidationError(
        `${def.name} cannot be enabled until these are set: ${labels.join(", ") || decryptErrors.join(", ")}.`,
        Object.fromEntries(missing.map(k => [k, "Required to enable."]))
      );
    }
    const providerError = validateProviderSpecific(id, effective, mode);
    if (providerError) throw new IntegrationValidationError(providerError);
  }

  // Credentials changed → the last test no longer describes them.
  const credentialsChanged = changed.some(c => c !== "enabled" && c !== "disabled");
  const status = credentialsChanged ? "untested" : row?.status || "untested";

  await prisma.integrationSetting.upsert({
    where: { id },
    create: { id, enabled, mode, config, secrets, status, updatedBy: actor },
    update: {
      enabled,
      mode,
      config,
      secrets,
      status,
      updatedBy: actor,
      ...(credentialsChanged ? { lastError: null } : {})
    }
  });

  if (changed.length) {
    await writeAudit(id, "update", actor, changed);
  }
  return getIntegrationView(id);
}

/** Cross-field rules a generic schema cannot express. */
function validateProviderSpecific(id: string, v: Record<string, any>, mode: IntegrationMode): string | null {
  if (id === "razorpay" && v.keyId) {
    const key = String(v.keyId);
    if (mode === "live" && key.startsWith("rzp_test_")) return "Live mode is selected but the Razorpay Key ID is a test key (rzp_test_…).";
    if (mode === "test" && key.startsWith("rzp_live_")) return "Test mode is selected but the Razorpay Key ID is a live key (rzp_live_…).";
  }
  return null;
}

export async function recordTestResult(
  id: string,
  result: { ok: boolean; message: string; details?: any },
  actor: string
) {
  if (!(await getDb())) return;
  const now = new Date();
  const safeResult = { ok: result.ok, message: result.message, details: result.details ?? null, at: now.toISOString() };
  await prisma.integrationSetting.upsert({
    where: { id },
    create: {
      id,
      status: result.ok ? "connected" : "error",
      lastError: result.ok ? null : result.message,
      lastTestedAt: now,
      lastTestResult: safeResult,
      updatedBy: actor
    },
    update: {
      status: result.ok ? "connected" : "error",
      lastError: result.ok ? null : result.message,
      lastTestedAt: now,
      lastTestResult: safeResult
    }
  });
  await writeAudit(id, result.ok ? "test_passed" : "test_failed", actor, [], { message: result.message });
}

export async function writeAudit(
  integrationId: string,
  action: string,
  actor: string | null,
  changedFields: string[],
  details?: Record<string, any>
) {
  try {
    await prisma.integrationAuditLog.create({
      data: {
        id: crypto.randomUUID(),
        integrationId,
        action,
        actor: actor || null,
        changedFields,
        details: details ?? undefined
      }
    });
  } catch (err: any) {
    // The audit write failing must not undo a save that succeeded, but it must be visible.
    console.error(`[Integrations] AUDIT LOG WRITE FAILED for ${integrationId}/${action}:`, err?.message || err);
  }
}

export async function listAudit(integrationId?: string, limit = 100) {
  if (!(await getDb())) return [];
  return prisma.integrationAuditLog.findMany({
    where: integrationId ? { integrationId } : undefined,
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 500)
  });
}
