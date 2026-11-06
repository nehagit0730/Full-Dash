import crypto from "crypto";
import { getIntegrationCredentials } from "../integrations/store";

/**
 * Thin, server-only Razorpay REST client.
 *
 * Credentials come from the encrypted integration store (Settings → Payments)
 * and never leave this module. Every call has a timeout and surfaces
 * Razorpay's own error description; nothing here ever returns a success the
 * API did not report.
 */

const API = "https://api.razorpay.com/v1";
const TIMEOUT_MS = 15_000;

export class RazorpayError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = "RazorpayError";
  }
}

export async function razorpayConfig() {
  const { values, mode, enabled } = await getIntegrationCredentials("razorpay");
  return {
    enabled,
    mode,
    keyId: String(values.keyId || ""),
    keySecret: String(values.keySecret || ""),
    webhookSecret: String(values.webhookSecret || "")
  };
}

async function call<T = any>(method: "GET" | "POST", path: string, body?: any): Promise<T> {
  const cfg = await razorpayConfig();
  if (!cfg.enabled) throw new RazorpayError("Razorpay is disabled.", 503);
  if (!cfg.keyId || !cfg.keySecret) throw new RazorpayError("Razorpay is not configured.", 503);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        Authorization: `Basic ${Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!res.ok) {
      const desc = data?.error?.description || `Razorpay returned HTTP ${res.status}`;
      throw new RazorpayError(desc, res.status, data?.error?.code);
    }
    return data as T;
  } catch (err: any) {
    if (err instanceof RazorpayError) throw err;
    if (err?.name === "AbortError") throw new RazorpayError("Razorpay did not respond in time.", 504);
    throw new RazorpayError(`Could not reach Razorpay: ${err?.message || err}`, 502);
  } finally {
    clearTimeout(timer);
  }
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method: string;
  captured: boolean;
  email?: string;
  contact?: string;
  error_description?: string | null;
  card?: { network?: string; last4?: string } | null;
  vpa?: string | null;
  bank?: string | null;
  wallet?: string | null;
  acquirer_data?: Record<string, any>;
}

export const createOrder = (p: { amount: number; currency: string; receipt: string; notes?: Record<string, string> }) =>
  call<RazorpayOrder>("POST", "/orders", {
    amount: p.amount,
    currency: p.currency,
    receipt: p.receipt.slice(0, 40),
    notes: p.notes || {}
  });

export const fetchPayment = (paymentId: string) =>
  call<RazorpayPayment>("GET", `/payments/${encodeURIComponent(paymentId)}`);

export const fetchOrderPayments = (orderId: string) =>
  call<{ items: RazorpayPayment[] }>("GET", `/orders/${encodeURIComponent(orderId)}/payments`);

export const capturePayment = (paymentId: string, amount: number, currency: string) =>
  call<RazorpayPayment>("POST", `/payments/${encodeURIComponent(paymentId)}/capture`, { amount, currency });

export const refundPayment = (paymentId: string, p: { amount: number; receipt: string; notes?: Record<string, string> }) =>
  call<{ id: string; amount: number; status: string; speed_processed?: string }>(
    "POST",
    `/payments/${encodeURIComponent(paymentId)}/refund`,
    { amount: p.amount, speed: "normal", receipt: p.receipt.slice(0, 40), notes: p.notes || {} }
  );

function safeEqualHex(expectedHex: string, received: string): boolean {
  const a = Buffer.from(expectedHex, "utf8");
  const b = Buffer.from(String(received || ""), "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Checkout handler signature: HMAC-SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string, keySecret: string): boolean {
  if (!orderId || !paymentId || !signature || !keySecret) return false;
  const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook signature: HMAC-SHA256(raw request body, webhook secret). */
export function verifyWebhookSignature(rawBody: Buffer | string, signature: string, webhookSecret: string): boolean {
  if (!rawBody || !signature || !webhookSecret) return false;
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
