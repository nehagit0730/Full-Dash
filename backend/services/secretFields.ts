import {
  decryptSecret,
  encryptSecret,
  isEncrypted,
  isEncryptionConfigured,
  isMaskPlaceholder,
  maskSecret
} from './integrations/crypto';

/**
 * Secret handling for settings records that predate the Integrations hub
 * (email, Klaviyo, reCAPTCHA). Same rules as the hub:
 *
 *  - at rest: encrypted with SETTINGS_ENCRYPTION_KEY when it is configured
 *    (values saved before that stay readable — decryptSecret passes plain
 *    text through);
 *  - to the browser: masked, never the real value;
 *  - on save: a masked or omitted value means "keep the current one", so
 *    re-saving a form never wipes a secret the admin did not retype.
 */

export function openSecrets<T extends Record<string, any>>(record: T, keys: string[]): T {
  const out: Record<string, any> = { ...record };
  for (const k of keys) {
    const v = out[k];
    if (typeof v === 'string' && isEncrypted(v)) {
      try {
        out[k] = decryptSecret(v);
      } catch {
        out[k] = ''; // key changed: treat as not configured rather than leak ciphertext
      }
    }
  }
  return out as T;
}

export function sealSecrets<T extends Record<string, any>>(record: T, keys: string[]): T {
  if (!isEncryptionConfigured()) return record;
  const out: Record<string, any> = { ...record };
  for (const k of keys) {
    const v = out[k];
    if (typeof v === 'string' && v && !isEncrypted(v)) out[k] = encryptSecret(v);
  }
  return out as T;
}

export function maskSecrets<T extends Record<string, any>>(record: T, keys: string[]): T & { secretsSet: Record<string, boolean> } {
  const out: Record<string, any> = { ...record };
  const secretsSet: Record<string, boolean> = {};
  for (const k of keys) {
    const v = out[k];
    secretsSet[k] = typeof v === 'string' && v.trim() !== '';
    out[k] = secretsSet[k] ? maskSecret(v) : '';
  }
  return { ...(out as T), secretsSet };
}

/** Drops masked / omitted secrets from an incoming update so the current value is kept. */
export function keepUnchangedSecrets<T extends Record<string, any>>(incoming: T, keys: string[]): T {
  const out: Record<string, any> = { ...incoming };
  for (const k of keys) {
    if (out[k] === undefined || isMaskPlaceholder(out[k])) delete out[k];
  }
  delete out.secretsSet;
  return out as T;
}
