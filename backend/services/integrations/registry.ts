/**
 * The catalogue of every external integration the store can talk to.
 *
 * One definition per integration, all in the same shape, so the settings API,
 * the dashboard and the adapters never need integration-specific plumbing.
 * Adding an integration is: describe it here, write its adapter.
 *
 * `secret: true` fields are encrypted at rest and never leave the server.
 * `required: true` fields must be present before the integration may be enabled.
 * `env` lists environment variables honoured as a fallback, so integrations that
 * were configured through the environment before this existed keep working.
 */

export type IntegrationCategory = "payment" | "shipping" | "marketing" | "compliance" | "infrastructure";
export type FieldType = "text" | "secret" | "select" | "boolean" | "number" | "url" | "email";

export interface IntegrationField {
  key: string;
  label: string;
  type: FieldType;
  secret?: boolean;
  required?: boolean;
  /** Required only in this mode (e.g. a sandbox-only key). */
  requiredInMode?: "test" | "live";
  help?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: string | number | boolean;
  env?: string[];
}

export interface IntegrationDefinition {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  supportsTestMode: boolean;
  /** Path (relative to the site URL) the provider should post webhooks to. */
  webhookPath?: string;
  docsUrl?: string;
  /**
   * Set for integrations that already had a dedicated, working settings panel
   * before this registry existed. Their credentials stay in that panel's store;
   * the hub reports their status and links to the panel rather than running a
   * second, competing copy of the same settings.
   */
  legacyPanel?: { tab: string; label: string };
  /** Honest statement of what the adapter can do today. Shown in the dashboard. */
  capabilities: string[];
  fields: IntegrationField[];
}

const MODE_NOTE = "Test credentials and live credentials are different keys — save the ones that match the selected mode.";

export const INTEGRATIONS: IntegrationDefinition[] = [
  // ───────────────────────────── Payments ─────────────────────────────
  {
    id: "razorpay",
    name: "Razorpay",
    category: "payment",
    description: "Cards, UPI, netbanking and wallets (INR). " + MODE_NOTE,
    supportsTestMode: true,
    webhookPath: "/api/payments/webhook/razorpay",
    docsUrl: "https://razorpay.com/docs/api/",
    capabilities: ["Checkout (cards, UPI, netbanking, wallets)", "Server-side amount verification", "Signed webhooks", "Refunds", "Credential test"],
    fields: [
      { key: "keyId", label: "Key ID", type: "text", required: true, placeholder: "rzp_test_… or rzp_live_…", help: "Publishable. Sent to the browser for Razorpay Checkout." },
      { key: "keySecret", label: "Key Secret", type: "secret", secret: true, required: true },
      { key: "webhookSecret", label: "Webhook Secret", type: "secret", secret: true, help: "Set the same value in Razorpay Dashboard → Webhooks." }
    ]
  },
  {
    id: "cashfree",
    name: "Cashfree Payments",
    category: "payment",
    description: "Cashfree PG (INR): cards, UPI, netbanking. " + MODE_NOTE,
    supportsTestMode: true,
    webhookPath: "/api/payments/webhook/cashfree",
    docsUrl: "https://www.cashfree.com/docs/api-reference/payments/latest/overview",
    capabilities: ["Credential test"],
    fields: [
      { key: "appId", label: "App ID (Client ID)", type: "text", required: true },
      { key: "secretKey", label: "Secret Key (Client Secret)", type: "secret", secret: true, required: true, help: "Also used to verify webhook signatures." },
      { key: "apiVersion", label: "API version", type: "text", defaultValue: "2023-08-01" }
    ]
  },
  {
    id: "phonepe",
    name: "PhonePe Payment Gateway",
    category: "payment",
    description: "PhonePe PG (standard checkout v2, INR) with UPI intent / QR. " + MODE_NOTE,
    supportsTestMode: true,
    webhookPath: "/api/payments/webhook/phonepe",
    docsUrl: "https://developer.phonepe.com/v1/reference/",
    capabilities: ["Credential test (OAuth token)"],
    fields: [
      { key: "clientId", label: "Client ID", type: "text", required: true },
      { key: "clientSecret", label: "Client Secret", type: "secret", secret: true, required: true },
      { key: "clientVersion", label: "Client Version", type: "text", required: true, defaultValue: "1" },
      { key: "merchantId", label: "Merchant ID", type: "text" },
      { key: "webhookUsername", label: "Webhook username", type: "text", help: "Configured in the PhonePe dashboard; used to authenticate callbacks." },
      { key: "webhookPassword", label: "Webhook password", type: "secret", secret: true }
    ]
  },
  {
    id: "payu",
    name: "PayU India",
    category: "payment",
    description: "PayU hosted checkout (INR). " + MODE_NOTE,
    supportsTestMode: true,
    webhookPath: "/api/payments/webhook/payu",
    docsUrl: "https://docs.payu.in/",
    capabilities: ["Credential test (verify_payment API)"],
    fields: [
      { key: "merchantKey", label: "Merchant Key", type: "text", required: true },
      { key: "merchantSalt", label: "Merchant Salt (v1)", type: "secret", secret: true, required: true },
      { key: "merchantSaltV2", label: "Merchant Salt (v2)", type: "secret", secret: true, help: "Optional; only if your account signs with Salt v2." }
    ]
  },
  {
    id: "upi",
    name: "UPI Payments",
    category: "payment",
    description:
      "UPI is a payment method, not a gateway: it must be processed by one of the gateways above so the payment can be verified on the server. Pick which one handles UPI and which flows to offer.",
    supportsTestMode: false,
    capabilities: ["Routing configuration (uses the selected gateway's credentials)"],
    fields: [
      {
        key: "provider",
        label: "Processed by",
        type: "select",
        required: true,
        options: [
          { value: "razorpay", label: "Razorpay" },
          { value: "cashfree", label: "Cashfree" },
          { value: "phonepe", label: "PhonePe" },
          { value: "payu", label: "PayU" }
        ]
      },
      { key: "intentFlow", label: "UPI intent (open UPI app on mobile)", type: "boolean", defaultValue: true },
      { key: "qrFlow", label: "UPI QR code (desktop)", type: "boolean", defaultValue: true },
      { key: "collectFlow", label: "UPI collect (enter VPA)", type: "boolean", defaultValue: false, help: "NPCI has restricted collect requests; many providers no longer support it." }
    ]
  },

  // ───────────────────────────── Shipping ─────────────────────────────
  {
    id: "shiprocket",
    name: "Shiprocket",
    category: "shipping",
    description: "Multi-courier aggregator (India). Shiprocket has no sandbox — every call is live.",
    supportsTestMode: false,
    webhookPath: "/api/shipping/webhook/shiprocket",
    docsUrl: "https://apidocs.shiprocket.in/",
    capabilities: ["Credential test (API login)"],
    fields: [
      { key: "email", label: "API user email", type: "email", required: true, help: "Create a dedicated API user under Settings → API in Shiprocket." },
      { key: "password", label: "API user password", type: "secret", secret: true, required: true },
      { key: "pickupLocation", label: "Pickup location name", type: "text", help: "Exactly as named in Shiprocket → Pickup Addresses." },
      { key: "webhookToken", label: "Webhook security token", type: "secret", secret: true, help: "Sent by Shiprocket in the x-api-key header of tracking webhooks." }
    ]
  },
  {
    id: "delhivery",
    name: "Delhivery",
    category: "shipping",
    description: "Delhivery B2C express (India).",
    supportsTestMode: true,
    webhookPath: "/api/shipping/webhook/delhivery",
    docsUrl: "https://one.delhivery.com/developer-portal",
    capabilities: ["Credential test (pincode serviceability)"],
    fields: [
      { key: "apiToken", label: "API token", type: "secret", secret: true, required: true },
      { key: "clientName", label: "Client name", type: "text", help: "Your registered Delhivery client name." },
      { key: "pickupLocation", label: "Pickup location (warehouse) name", type: "text" },
      { key: "testPincode", label: "Pincode used for connection tests", type: "text", defaultValue: "110001" }
    ]
  },
  {
    id: "ithink",
    name: "iThink Logistics",
    category: "shipping",
    description: "Multi-courier aggregator (India).",
    supportsTestMode: true,
    webhookPath: "/api/shipping/webhook/ithink",
    docsUrl: "https://docs.ithinklogistics.com/",
    capabilities: ["Credential test (pincode check)"],
    fields: [
      { key: "accessToken", label: "Access token", type: "secret", secret: true, required: true },
      { key: "secretKey", label: "Secret key", type: "secret", secret: true, required: true },
      { key: "pickupAddressId", label: "Pickup address ID", type: "text" },
      { key: "returnAddressId", label: "Return address ID", type: "text" },
      { key: "testPincode", label: "Pincode used for connection tests", type: "text", defaultValue: "400067" }
    ]
  },

  // ─────────────────────────── Marketing & ops ───────────────────────────
  {
    id: "klaviyo",
    name: "Klaviyo",
    category: "marketing",
    description: "Email marketing events and lists. Managed in its existing settings panel.",
    supportsTestMode: false,
    legacyPanel: { tab: "email", label: "Open Email & Marketing" },
    capabilities: ["Event tracking, profiles, lists (existing)"],
    fields: []
  },
  {
    id: "email",
    name: "Transactional email",
    category: "marketing",
    description: "Order and account emails via Gmail SMTP, SMTP or Resend. Managed in its existing settings panel.",
    supportsTestMode: false,
    legacyPanel: { tab: "email", label: "Open Email & Marketing" },
    capabilities: ["Order, shipping, account emails (existing)"],
    fields: []
  },
  {
    id: "cloudinary",
    name: "Cloudinary",
    category: "infrastructure",
    description: "Image and video hosting for the media library.",
    supportsTestMode: false,
    docsUrl: "https://cloudinary.com/documentation/admin_api",
    capabilities: ["Credential test (Admin API ping)"],
    fields: [
      { key: "cloudName", label: "Cloud name", type: "text", required: true, env: ["CLOUDINARY_CLOUD_NAME"] },
      { key: "apiKey", label: "API key", type: "text", required: true, env: ["CLOUDINARY_API_KEY"] },
      { key: "apiSecret", label: "API secret", type: "secret", secret: true, required: true, env: ["CLOUDINARY_API_SECRET"] }
    ]
  },

  // ───────────────────────────── Compliance ─────────────────────────────
  {
    id: "agechecked",
    name: "AgeChecked",
    category: "compliance",
    description: "Age verification (AC0130). Settings → Age Verification.",
    supportsTestMode: true,
    capabilities: ["Existing verification flow", "Configuration check"],
    fields: [
      { key: "secretKey", label: "Merchant secret key", type: "secret", secret: true, required: true, env: ["AGECHECKED_SECRET_KEY"] },
      { key: "publicKey", label: "Public key", type: "text", env: ["NEXT_PUBLIC_AGECHECKED_PUBLIC_KEY", "AGECHECKED_PUBLIC_KEY"] },
      { key: "baseUrl", label: "API base URL", type: "url", env: ["AGECHECKED_BASE_URL"], defaultValue: "https://staging.agechecked.com/api/acapiremote/ac0130" },
      { key: "portalUrl", label: "Portal URL", type: "url", env: ["NEXT_PUBLIC_AGECHECKED_PORTAL_URL", "AGECHECKED_PORTAL_URL"], defaultValue: "https://portal.agechecked.com/portal" },
      { key: "minimumAge", label: "Minimum age", type: "number", defaultValue: 18 },
      { key: "verificationTtlHours", label: "Verification valid for (hours)", type: "number", defaultValue: 24 },
      {
        key: "enforcement",
        label: "When to verify",
        type: "select",
        defaultValue: "checkout",
        options: [
          { value: "checkout", label: "At checkout" },
          { value: "restricted_only", label: "Only for orders containing age-restricted products" }
        ]
      }
    ]
  }
];

export function getDefinition(id: string): IntegrationDefinition | undefined {
  return INTEGRATIONS.find(d => d.id === id);
}
