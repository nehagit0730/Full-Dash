import type { Request } from 'express';
import { getActiveIntegrationValues } from './integrations/store';

function clean(url: unknown): string | null {
  const s = String(url || '').trim().replace(/\/+$/, '');
  if (!s || /MY_APP_URL/i.test(s)) return null;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' || u.protocol === 'http:' ? s : null;
  } catch {
    return null;
  }
}

/**
 * The store's public URL: Settings → API & integrations → Store URL, falling
 * back to APP_URL / NEXTAUTH_URL (the hub already applies that fallback).
 *
 * The request's own host is used only when nothing is configured, and only
 * where the caller passes `req` — password-reset links built from an
 * attacker-supplied Host header would point customers at the attacker.
 */
export async function getSiteUrl(req?: Request): Promise<string | null> {
  const values = await getActiveIntegrationValues('site');
  const configured = clean(values?.appUrl) || clean(process.env.APP_URL) || clean(process.env.NEXTAUTH_URL);
  if (configured) return configured;
  if (req) return clean(`${req.protocol}://${req.get('host')}`);
  return null;
}
