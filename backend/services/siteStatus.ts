import crypto from "crypto";
import { fetchStoreSetting, saveStoreSetting } from "../../serverDb";

/**
 * Whether the shop is open to the public, or behind a password while work is
 * being done on it.
 *
 * "password" shows every visitor a coming-soon page with a password box, and
 * lets through anyone who knows the word. It is for keeping a half-finished
 * change away from customers — NOT for protecting anything secret. The gate is
 * applied by the app, so the pages and the public API are still reachable by
 * anyone who goes looking. For real protection use Vercel's own Deployment
 * Protection, which stops the request before it ever reaches this code.
 *
 * The admin dashboard is never gated. Locking yourself out of the control that
 * turns the lock off would be the one unrecoverable outcome here.
 */

const SETTING_ID = "site_status";

export type SiteMode = "live" | "password";

export interface SiteStatus {
  mode: SiteMode;
  /** Shown above the password box. */
  headline: string;
  message: string;
  /** sha256 of password + salt. The password itself is never stored. */
  passwordHash: string | null;
  salt: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

const DEFAULTS: SiteStatus = {
  mode: "live",
  headline: "We'll be back shortly",
  message: "Our store is getting a little work done. Please check back soon.",
  passwordHash: null,
  salt: null,
  updatedAt: null,
  updatedBy: null
};

function hash(password: string, salt: string): string {
  return crypto.createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

/** The stored status, with defaults filled in. */
export async function getSiteStatus(): Promise<SiteStatus> {
  try {
    const stored = await fetchStoreSetting(SETTING_ID, null);
    if (!stored || typeof stored !== "object") return { ...DEFAULTS };
    return { ...DEFAULTS, ...stored, mode: stored.mode === "password" ? "password" : "live" };
  } catch (err: any) {
    // Unreadable setting must not take the shop offline. A shop nobody can
    // reach is worse than one that is briefly public.
    console.error("[Site Status] Could not read the setting; treating the site as live:", err?.message);
    return { ...DEFAULTS };
  }
}

/** What a visitor is allowed to know: the mode, and nothing else. */
export async function getPublicSiteStatus(): Promise<{ mode: SiteMode; headline: string; message: string }> {
  const status = await getSiteStatus();
  return { mode: status.mode, headline: status.headline, message: status.message };
}

export interface SaveResult {
  ok: boolean;
  message?: string;
  status?: { mode: SiteMode; headline: string; message: string; hasPassword: boolean };
}

/**
 * Changes the mode, and optionally the password.
 *
 * Going to "password" with no password ever set is refused: it would show every
 * visitor a box that nothing opens, and the only way back would be the database.
 */
export async function saveSiteStatus(input: {
  mode?: SiteMode;
  password?: string;
  headline?: string;
  message?: string;
  updatedBy?: string;
}): Promise<SaveResult> {
  const current = await getSiteStatus();
  const next: SiteStatus = { ...current };

  if (input.mode === "live" || input.mode === "password") next.mode = input.mode;
  if (typeof input.headline === "string" && input.headline.trim()) next.headline = input.headline.trim().slice(0, 120);
  if (typeof input.message === "string") next.message = input.message.trim().slice(0, 500);

  const password = typeof input.password === "string" ? input.password.trim() : "";
  if (password) {
    if (password.length < 4) return { ok: false, message: "Use a password of at least 4 characters." };
    next.salt = crypto.randomBytes(16).toString("hex");
    next.passwordHash = hash(password, next.salt);
  }

  if (next.mode === "password" && !next.passwordHash) {
    return {
      ok: false,
      message: "Set a password before switching the site to password protected, or nobody could get in."
    };
  }

  next.updatedAt = new Date().toISOString();
  next.updatedBy = input.updatedBy || null;

  await saveStoreSetting(SETTING_ID, next);
  console.log(`[Site Status] set to "${next.mode}"${input.updatedBy ? ` by ${input.updatedBy}` : ""}.`);

  return {
    ok: true,
    status: { mode: next.mode, headline: next.headline, message: next.message, hasPassword: Boolean(next.passwordHash) }
  };
}

/** Is this the password? Always false while the site is live. */
export async function checkPassword(password: string): Promise<boolean> {
  const status = await getSiteStatus();
  if (!status.passwordHash || !status.salt) return false;

  const given = Buffer.from(hash(String(password || ""), status.salt));
  const known = Buffer.from(status.passwordHash);
  // Constant time, and length-checked first because timingSafeEqual throws on
  // a mismatch rather than returning false.
  return given.length === known.length && crypto.timingSafeEqual(given, known);
}

/**
 * A pass for a visitor who got the password right.
 *
 * Signed with the stored hash, so changing the password invalidates every pass
 * that was handed out under the old one.
 */
export async function issuePass(): Promise<string> {
  const status = await getSiteStatus();
  const issuedAt = Date.now();
  const signature = crypto
    .createHmac("sha256", String(status.passwordHash || "no-password"))
    .update(String(issuedAt))
    .digest("hex");
  return `${issuedAt}.${signature}`;
}

/** Is this pass still good? Passes last 30 days. */
export async function verifyPass(pass: string): Promise<boolean> {
  const [issuedAt, signature] = String(pass || "").split(".");
  if (!issuedAt || !signature) return false;

  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age < 0 || age > 30 * 24 * 60 * 60 * 1000) return false;

  const status = await getSiteStatus();
  const expected = crypto
    .createHmac("sha256", String(status.passwordHash || "no-password"))
    .update(String(issuedAt))
    .digest("hex");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
