import crypto from "crypto";

/**
 * Admin session tokens.
 *
 * Stateless and HMAC-signed, because this app runs as serverless functions on
 * Vercel: any in-memory session store would be empty on the next invocation, and
 * there is no session table to fall back on. A signed token needs no storage —
 * the signature is the proof.
 *
 * The token is NOT encrypted. It carries no secret, only a subject and an expiry,
 * and the signature is what makes it unforgeable. Never put anything in the
 * payload that the holder should not read.
 */

const TOKEN_VERSION = "v1";

/** Eight hours: long enough for a working day, short enough that a leaked token dies. */
const ADMIN_TTL_SECONDS = 8 * 60 * 60;

/**
 * Thirty days for shoppers. A customer session protects their own order history
 * rather than the whole store, and being signed out of a shop every eight hours
 * is the kind of friction that pushes people to stop using an account at all.
 */
const CUSTOMER_TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * Who a token speaks for. Carried in the payload and checked on verification so
 * a customer token can never be replayed against an admin endpoint: without
 * this, any signed token would satisfy any gate.
 */
export type TokenScope = "admin" | "customer";

export interface SessionTokenPayload {
  /** Who the token was issued to — the account email. */
  sub: string;
  /** What the token authorises. */
  scope: TokenScope;
  /** Issued-at, epoch seconds. */
  iat: number;
  /** Expiry, epoch seconds. */
  exp: number;
}

/** Retained under the old name; admin code reads this shape. */
export type AdminTokenPayload = SessionTokenPayload;

export class AdminAuthNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminAuthNotConfiguredError";
  }
}

/**
 * The signing secret.
 *
 * Throws when absent rather than falling back to a default. A default secret is
 * a publicly known secret: anyone reading this file could mint themselves an
 * admin token. Refusing to start the auth flow is the safe failure — it locks
 * administrators out of the dashboard, where a default would let everyone in.
 */
function getSigningSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.ADMIN_TOKEN_SECRET || "";
  if (!secret || secret.trim().length < 16) {
    throw new AdminAuthNotConfiguredError(
      "AUTH_SECRET is not set (or is shorter than 16 characters). Admin authentication is disabled until it is configured."
    );
  }
  return secret;
}

const b64url = (input: Buffer | string): string =>
  Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const b64urlDecode = (input: string): Buffer =>
  Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64");

function sign(data: string, secret: string): string {
  return b64url(crypto.createHmac("sha256", secret).update(data).digest());
}

function signToken(subject: string, scope: TokenScope, ttlSeconds: number): string {
  const secret = getSigningSecret();
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionTokenPayload = { sub: subject, scope, iat: now, exp: now + ttlSeconds };
  const body = `${TOKEN_VERSION}.${b64url(JSON.stringify(payload))}`;
  return `${body}.${sign(body, secret)}`;
}

/** Mints a signed admin token. Throws if AUTH_SECRET is unconfigured. */
export function signAdminToken(subject: string, ttlSeconds: number = ADMIN_TTL_SECONDS): string {
  return signToken(subject, "admin", ttlSeconds);
}

/** Mints a signed customer token, scoped to that shopper's own data. */
export function signCustomerToken(email: string, ttlSeconds: number = CUSTOMER_TTL_SECONDS): string {
  return signToken(String(email).trim().toLowerCase(), "customer", ttlSeconds);
}

/**
 * Verifies a token and returns its payload, or null if it is in any way
 * unacceptable — wrong shape, wrong version, bad signature, or expired.
 *
 * Returns null rather than throwing for every rejection EXCEPT missing
 * configuration, which is a deployment fault the caller must not mistake for
 * "this visitor is not an admin".
 */
export function verifyToken(
  token: string | undefined | null,
  expectedScope: TokenScope
): SessionTokenPayload | null {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [version, payloadPart, signaturePart] = parts;
  if (version !== TOKEN_VERSION) return null;

  const secret = getSigningSecret();
  const expected = sign(`${version}.${payloadPart}`, secret);

  // Constant-time compare so a caller cannot discover a valid signature by
  // measuring how long each guess takes to be rejected.
  const givenBuf = Buffer.from(signaturePart);
  const expectedBuf = Buffer.from(expected);
  if (givenBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(givenBuf, expectedBuf)) return null;

  let payload: SessionTokenPayload;
  try {
    payload = JSON.parse(b64urlDecode(payloadPart).toString("utf8"));
  } catch {
    return null;
  }

  if (!payload || typeof payload.exp !== "number" || typeof payload.sub !== "string") return null;
  if (Math.floor(Date.now() / 1000) >= payload.exp) return null;

  // A valid signature only proves we issued the token, not that it may be used
  // here. Without this a shopper's own token would open every admin endpoint.
  if (payload.scope !== expectedScope) return null;

  return payload;
}

export function verifyAdminToken(token: string | undefined | null): SessionTokenPayload | null {
  return verifyToken(token, "admin");
}

export function verifyCustomerToken(token: string | undefined | null): SessionTokenPayload | null {
  return verifyToken(token, "customer");
}

/**
 * Checks a submitted admin password against the configured one.
 *
 * Both credentials must come from the environment. The previous implementation
 * fell back to an email and password written into the source, which meant the
 * live credential was published in version control and could not be changed
 * without a deploy.
 */
export function verifyAdminCredentials(email: string, password: string): boolean {
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "";

  if (!adminEmail || !adminPassword) {
    throw new AdminAuthNotConfiguredError(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set for admin login to work."
    );
  }

  const emailOk = String(email || "").trim().toLowerCase() === adminEmail.toLowerCase();

  // Compare over a digest so the buffers are always the same length — comparing
  // the raw passwords would leak their length through the length check.
  const given = crypto.createHash("sha256").update(String(password || "")).digest();
  const expectedHash = crypto.createHash("sha256").update(adminPassword).digest();
  const passwordOk = crypto.timingSafeEqual(given, expectedHash);

  return emailOk && passwordOk;
}

/** True when admin auth can actually run. Used by diagnostics, never to bypass. */
export function isAdminAuthConfigured(): boolean {
  try {
    getSigningSecret();
    return Boolean((process.env.ADMIN_EMAIL || "").trim() && process.env.ADMIN_PASSWORD);
  } catch {
    return false;
  }
}
