import crypto from "crypto";

/**
 * Encryption at rest for integration credentials.
 *
 * AES-256-GCM with a random 96-bit IV per value. The key is a bootstrap secret
 * that lives in the environment (SETTINGS_ENCRYPTION_KEY), never in the
 * database: a key stored next to the ciphertext it protects protects nothing.
 *
 * Stored form:  enc:v1:<iv b64url>:<auth tag b64url>:<ciphertext b64url>
 *
 * Fails closed. With no key configured, encrypt() throws, so a secret can never
 * be silently written in plaintext because someone forgot an env var.
 */

const PREFIX = "enc:v1:";

export class EncryptionNotConfiguredError extends Error {
  constructor() {
    super(
      "SETTINGS_ENCRYPTION_KEY is not set (or is shorter than 32 characters). " +
        "Integration credentials cannot be stored or read until it is configured. Generate one with: " +
        "node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
    );
    this.name = "EncryptionNotConfiguredError";
  }
}

let cachedKey: { raw: string; key: Buffer } | null = null;

function getKey(): Buffer {
  const raw = (process.env.SETTINGS_ENCRYPTION_KEY || "").trim();
  if (!raw || raw.length < 32) throw new EncryptionNotConfiguredError();
  if (cachedKey && cachedKey.raw === raw) return cachedKey.key;

  // Accept a 32-byte key given as base64 or hex; anything else is treated as a
  // passphrase and stretched. Deterministic salt is acceptable here because the
  // input is already a high-entropy secret, not a user password.
  let key: Buffer | null = null;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) key = Buffer.from(raw, "hex");
  if (!key) {
    try {
      const b = Buffer.from(raw, "base64");
      if (b.length === 32) key = b;
    } catch {
      /* not base64 */
    }
  }
  if (!key) key = crypto.scryptSync(raw, "integration-settings-v1", 32);

  cachedKey = { raw, key };
  return key;
}

export function isEncryptionConfigured(): boolean {
  try {
    getKey();
    return true;
  } catch {
    return false;
  }
}

const b64u = (b: Buffer) => b.toString("base64url");
const fromB64u = (s: string) => Buffer.from(s, "base64url");

export function isEncrypted(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(PREFIX);
}

export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${b64u(iv)}:${b64u(tag)}:${b64u(ct)}`;
}

/**
 * Decrypts a stored value. A value without the prefix is a legacy plaintext
 * secret written before encryption existed; it is returned as-is so existing
 * stores keep working, and is re-encrypted the next time it is saved.
 */
export function decryptSecret(stored: string): string {
  if (!isEncrypted(stored)) return stored;
  const key = getKey();
  const parts = stored.slice(PREFIX.length).split(":");
  if (parts.length !== 3) throw new Error("Stored secret is malformed.");
  const [iv, tag, ct] = parts.map(fromB64u);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

/**
 * What the dashboard is allowed to see of a secret: that it exists, and its
 * last four characters so an admin can tell two keys apart. Short secrets show
 * nothing at all, because four characters of an eight-character key is half of it.
 */
export function maskSecret(plaintext: string | null | undefined): string {
  const v = String(plaintext || "");
  if (!v) return "";
  if (v.length < 12) return "••••••••";
  return `••••••••${v.slice(-4)}`;
}

/** True when a value posted back from the dashboard is just the mask it was shown. */
export function isMaskPlaceholder(value: unknown): boolean {
  return typeof value === "string" && value.startsWith("••••");
}
