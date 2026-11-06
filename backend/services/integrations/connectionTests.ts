import crypto from "crypto";
import { getIntegrationCredentials } from "./store";

/**
 * Connection tests: one real, read-only API call per provider that proves the
 * saved credentials are accepted. Nothing here creates an order, a payment or a
 * shipment, and no test ever reports success without the provider having said so.
 *
 * Results never contain credentials. Provider error bodies are trimmed and
 * passed through `redact` before they are returned or stored.
 */

export interface TestResult {
  ok: boolean;
  message: string;
  details?: Record<string, any>;
}

const TIMEOUT_MS = 12_000;

async function http(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<{ status: number; body: any; text: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), init.timeoutMs ?? TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    const text = await res.text();
    let body: any = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    return { status: res.status, body, text };
  } catch (err: any) {
    if (err?.name === "AbortError") throw new Error(`No response from ${new URL(url).host} within ${(init.timeoutMs ?? TIMEOUT_MS) / 1000}s.`);
    throw new Error(`Could not reach ${new URL(url).host}: ${err?.message || err}`);
  } finally {
    clearTimeout(timer);
  }
}

function redact(text: string, secrets: string[]): string {
  let out = String(text || "").slice(0, 300);
  for (const s of secrets) if (s && s.length >= 4) out = out.split(s).join("[redacted]");
  return out;
}

const tests: Record<string, () => Promise<TestResult>> = {
  async razorpay() {
    const { values } = await getIntegrationCredentials("razorpay");
    const auth = Buffer.from(`${values.keyId}:${values.keySecret}`).toString("base64");
    const r = await http("https://api.razorpay.com/v1/orders?count=1", { headers: { Authorization: `Basic ${auth}` } });
    if (r.status === 200) return { ok: true, message: "Razorpay accepted the Key ID and Secret." };
    if (r.status === 401) return { ok: false, message: "Razorpay rejected the Key ID / Key Secret (401)." };
    return { ok: false, message: `Razorpay returned HTTP ${r.status}: ${redact(r.body?.error?.description || r.text, [values.keySecret])}` };
  },

  async cashfree() {
    const { values, mode } = await getIntegrationCredentials("cashfree");
    const base = mode === "live" ? "https://api.cashfree.com" : "https://sandbox.cashfree.com";
    // Fetching an order id that cannot exist: 404 proves authentication passed.
    const r = await http(`${base}/pg/orders/conn_test_${Date.now()}`, {
      headers: {
        "x-client-id": values.appId,
        "x-client-secret": values.secretKey,
        "x-api-version": values.apiVersion || "2023-08-01",
        Accept: "application/json"
      }
    });
    if (r.status === 404) return { ok: true, message: `Cashfree (${mode}) accepted the credentials.` };
    if (r.status === 401 || r.status === 403) return { ok: false, message: `Cashfree (${mode}) rejected the App ID / Secret Key (${r.status}).` };
    return { ok: false, message: `Cashfree returned HTTP ${r.status}: ${redact(r.body?.message || r.text, [values.secretKey])}` };
  },

  async phonepe() {
    const { values, mode } = await getIntegrationCredentials("phonepe");
    const url =
      mode === "live"
        ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
        : "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";
    const form = new URLSearchParams({
      client_id: values.clientId,
      client_version: String(values.clientVersion || "1"),
      client_secret: values.clientSecret,
      grant_type: "client_credentials"
    });
    const r = await http(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString()
    });
    if (r.status === 200 && r.body?.access_token) return { ok: true, message: `PhonePe (${mode}) issued an access token.` };
    return { ok: false, message: `PhonePe (${mode}) refused the credentials (HTTP ${r.status}): ${redact(r.body?.message || r.body?.code || r.text, [values.clientSecret])}` };
  },

  async payu() {
    const { values, mode } = await getIntegrationCredentials("payu");
    const url =
      mode === "live"
        ? "https://info.payu.in/merchant/postservice.php?form=2"
        : "https://test.payu.in/merchant/postservice.php?form=2";
    const command = "verify_payment";
    const var1 = `conn_test_${Date.now()}`;
    const hash = crypto
      .createHash("sha512")
      .update(`${values.merchantKey}|${command}|${var1}|${values.merchantSalt}`)
      .digest("hex");
    const r = await http(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ key: values.merchantKey, command, var1, hash }).toString()
    });
    const msg = String(r.body?.msg || r.text || "");
    // An unknown transaction looked up with a valid key+salt comes back as a
    // normal "not found" answer; a bad key or salt is reported as invalid.
    if (r.status === 200 && /invalid|not authori[sz]ed|unauthori[sz]ed/i.test(msg)) {
      return { ok: false, message: `PayU (${mode}) rejected the merchant key or salt: ${redact(msg, [values.merchantSalt])}` };
    }
    if (r.status === 200 && r.body && (r.body.status === 0 || r.body.status === 1 || r.body.transaction_details)) {
      return { ok: true, message: `PayU (${mode}) accepted the signed request.`, details: { providerMessage: redact(msg, [values.merchantSalt]) } };
    }
    return { ok: false, message: `PayU returned HTTP ${r.status}: ${redact(msg, [values.merchantSalt])}` };
  },

  async upi() {
    const { values } = await getIntegrationCredentials("upi");
    const provider = String(values.provider || "");
    if (!provider) return { ok: false, message: "Choose which gateway processes UPI." };
    const sub = await runConnectionTest(provider);
    return { ok: sub.ok, message: `UPI is routed through ${provider}: ${sub.message}` };
  },

  async shiprocket() {
    const { values } = await getIntegrationCredentials("shiprocket");
    const r = await http("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: values.email, password: values.password })
    });
    if (r.status === 200 && r.body?.token) return { ok: true, message: "Shiprocket login succeeded." };
    return { ok: false, message: `Shiprocket login failed (HTTP ${r.status}): ${redact(r.body?.message || r.text, [values.password])}` };
  },

  async delhivery() {
    const { values, mode } = await getIntegrationCredentials("delhivery");
    const base = mode === "live" ? "https://track.delhivery.com" : "https://staging-express.delhivery.com";
    const pin = String(values.testPincode || "110001");
    const r = await http(`${base}/c/api/pin-codes/json/?filter_codes=${encodeURIComponent(pin)}`, {
      headers: { Authorization: `Token ${values.apiToken}`, Accept: "application/json" }
    });
    if (r.status === 200 && r.body && Array.isArray(r.body.delivery_codes)) {
      return {
        ok: true,
        message: `Delhivery (${mode}) accepted the token.`,
        details: { pincode: pin, serviceable: r.body.delivery_codes.length > 0 }
      };
    }
    if (r.status === 401 || r.status === 403) return { ok: false, message: `Delhivery (${mode}) rejected the API token (${r.status}).` };
    return { ok: false, message: `Delhivery returned HTTP ${r.status}: ${redact(r.text, [values.apiToken])}` };
  },

  async ithink() {
    const { values, mode } = await getIntegrationCredentials("ithink");
    const base = mode === "live" ? "https://my.ithinklogistics.com" : "https://pre-alpha.ithinklogistics.com";
    const pin = String(values.testPincode || "400067");
    const r = await http(`${base}/api_v3/pincode/check.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: { pincode: pin, access_token: values.accessToken, secret_key: values.secretKey } })
    });
    const status = String(r.body?.status || "").toLowerCase();
    if (r.status === 200 && status === "success") return { ok: true, message: `iThink Logistics (${mode}) accepted the credentials.` };
    return {
      ok: false,
      message: `iThink Logistics (${mode}) refused the request (HTTP ${r.status}): ${redact(r.body?.html_message || r.body?.message || r.text, [values.accessToken, values.secretKey])}`
    };
  },

  async cloudinary() {
    const { values } = await getIntegrationCredentials("cloudinary");
    const auth = Buffer.from(`${values.apiKey}:${values.apiSecret}`).toString("base64");
    const r = await http(`https://api.cloudinary.com/v1_1/${encodeURIComponent(values.cloudName)}/ping`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    if (r.status === 200 && r.body?.status === "ok") return { ok: true, message: "Cloudinary Admin API responded ok." };
    return { ok: false, message: `Cloudinary returned HTTP ${r.status}: ${redact(r.body?.error?.message || r.text, [values.apiSecret])}` };
  },

  async agechecked() {
    // AgeChecked's AC0130 API has no credential-only endpoint: the only way to
    // prove the key works is a real verification. Say so instead of pretending.
    const { values } = await getIntegrationCredentials("agechecked");
    if (!values.secretKey) return { ok: false, message: "No AgeChecked secret key is configured." };
    try {
      const u = new URL(String(values.baseUrl));
      const r = await http(u.origin, { method: "GET" });
      return {
        ok: false,
        message:
          `AgeChecked host ${u.host} is reachable (HTTP ${r.status}), but AgeChecked offers no credential-check API. ` +
          "Run one real verification from the storefront to confirm the key."
      };
    } catch (err: any) {
      return { ok: false, message: err?.message || "AgeChecked base URL is invalid." };
    }
  },

  async klaviyo() {
    const { getKlaviyoLists } = await import("../klaviyoService");
    const lists = await getKlaviyoLists();
    return { ok: true, message: `Klaviyo private key accepted (${lists.length} list(s) visible).` };
  },

  async email() {
    const { verifyEmailConnection } = await import("../emailService");
    const r: any = await verifyEmailConnection();
    return { ok: Boolean(r?.success), message: String(r?.message || (r?.success ? "Email provider connected." : "Email provider check failed.")) };
  }
};

export async function runConnectionTest(id: string): Promise<TestResult> {
  const fn = tests[id];
  if (!fn) return { ok: false, message: `No connection test exists for "${id}".` };
  try {
    return await fn();
  } catch (err: any) {
    return { ok: false, message: String(err?.message || err).slice(0, 400) };
  }
}
