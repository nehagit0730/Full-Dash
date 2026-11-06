import crypto from "crypto";

type WorldpayConfig = {
  baseUrl: string;
  entity: string;
  authHeader: string;
  isTestMode: boolean;
};

/**
 * Placeholder credential values that earlier builds of this app manufactured
 * locally instead of reading them from a Worldpay response. They are not real
 * credentials and must never be sent to the gateway.
 */
const PLACEHOLDER_PATTERNS = [
  /^SCHEME-MOCK/i,
  /^SCHEME-SIM-/i,
  /^SCHEME-REF-\d+$/i,
  /^SCHEME-WP-/i,
  /^WP-MOCK/i,
  /^WP-SUB-AUTH-/i,
  /^WP-SUB-RECURRING-/i,
  /^WP-SUB-INIT-/i,
  /^WP-TEST-TXN-/i,
  /mock/i,
  /test-simulation/i
];

export function isPlaceholderCredential(value?: string | null): boolean {
  if (!value || typeof value !== "string") return true;
  return PLACEHOLDER_PATTERNS.some(rx => rx.test(value));
}

/**
 * A recurring href is only usable if Worldpay itself returned it. A URL we
 * built from an order id points at nothing and will always 404.
 */
export function isUsableRecurringHref(href?: string | null): boolean {
  if (!href || typeof href !== "string") return false;
  if (!href.startsWith("http")) return false;
  if (isPlaceholderCredential(href)) return false;
  // Locally fabricated links all had this shape: /payments/recurring/wp-<orderId>
  if (/\/payments\/recurring\/(wp-|mock-)/i.test(href)) return false;
  return true;
}

/**
 * A Worldpay card token href, e.g. https://access.worldpay.com/tokens/<id>
 *
 * This is the credential Worldpay integration support identified as the one
 * that must be present on every subsequent recurring payment:
 *
 *   "you would need to send a payment request each time with the token href,
 *    as we do not have functionality for automatically renewing subscriptions"
 *
 * A scheme transaction reference identifies the AGREEMENT; it does not identify
 * the card. Only the token does — which is why MIT charges that carried a
 * scheme reference and no payment instrument had nothing to bill.
 */
export function isUsableTokenHref(href?: string | null): boolean {
  if (!href || typeof href !== "string") return false;
  const trimmed = href.trim();
  if (!trimmed.startsWith("http")) return false;
  if (isPlaceholderCredential(trimmed)) return false;
  return /\/tokens?\//i.test(trimmed);
}

/**
 * How the shopper consents to the card being stored.
 *
 * `Silent` stores it without Worldpay asking, on the basis that consent was
 * taken in our own checkout terms — but it has to be enabled on the account. If
 * it is not, Worldpay rejects the whole payment page request and the checkout
 * falls back to an untokenised one-off sale, which cannot renew. Worldpay's own
 * example uses `ASK`, so this is switchable without a code change.
 */
export function tokenOptIn(): string {
  const configured = String(process.env.WORLDPAY_TOKEN_OPT_IN || "Silent").trim();
  return /^(ask|silent)$/i.test(configured)
    ? configured.toUpperCase() === "ASK"
      ? "ASK"
      : "Silent"
    : "Silent";
}

/** Keys that have carried a token href in one Worldpay payload shape or another. */
const TOKEN_HREF_KEYS = new Set([
  "href",
  "tokenhref",
  "tokenpaymentinstrument",
  "token",
  "tokens:token",
  "payments:token"
]);

/**
 * Last-resort search for a token href anywhere in a payload.
 *
 * Worldpay's exact tokenCreated webhook body is not something this side can pin
 * down with certainty, and committing to one path means silently discarding the
 * credential whenever the guess is wrong — which is the exact failure this
 * change exists to repair. So the documented paths are tried first, and
 * anything that still looks unmistakably like a Worldpay token URL is accepted
 * from wherever it sits.
 */
function findTokenHrefDeep(node: any, depth: number, seen: Set<any>): string | null {
  if (depth > 6 || node === null || node === undefined) return null;
  if (typeof node === "string") return isUsableTokenHref(node) ? node.trim() : null;
  if (typeof node !== "object") return null;
  if (seen.has(node)) return null;
  seen.add(node);

  if (Array.isArray(node)) {
    for (const entry of node) {
      const found = findTokenHrefDeep(entry, depth + 1, seen);
      if (found) return found;
    }
    return null;
  }

  // Prefer values sitting under a key that names a token.
  for (const [key, value] of Object.entries(node)) {
    if (!TOKEN_HREF_KEYS.has(key.toLowerCase())) continue;
    const found = findTokenHrefDeep(value, depth + 1, seen);
    if (found) return found;
  }

  for (const value of Object.values(node)) {
    const found = findTokenHrefDeep(value, depth + 1, seen);
    if (found) return found;
  }

  return null;
}

/**
 * Extracts the stored-card token href from a Worldpay payload — a tokenCreated
 * webhook, a payment authorization response, or a payment query result.
 */
export function extractTokenHref(payload: any): string | null {
  if (!payload) return null;
  if (typeof payload === "string") return isUsableTokenHref(payload) ? payload.trim() : null;
  if (typeof payload !== "object") return null;

  const preferred = [
    // Access webhook: { eventDetails: { type: "tokenCreated", ... } }
    payload?.eventDetails?.tokenHref,
    payload?.eventDetails?.token?.href,
    payload?.eventDetails?.tokenPaymentInstrument?.href,
    payload?.eventDetails?._links?.["tokens:token"]?.href,
    // Flattened webhook bodies.
    payload?.tokenHref,
    payload?.token?.href,
    payload?.attributes?.tokenHref,
    payload?.data?.attributes?.tokenHref,
    // Payment authorization / payment query responses.
    payload?._links?.["tokens:token"]?.href,
    payload?._links?.token?.href,
    payload?.paymentInstrument?.href,
    payload?.paymentInstrument?.token?.href,
    payload?.instruction?.paymentInstrument?.href,
    payload?._embedded?.payments?.[0]?._links?.["tokens:token"]?.href,
    payload?._embedded?.payments?.[0]?.paymentInstrument?.href
  ];

  for (const value of preferred) {
    if (isUsableTokenHref(value)) return String(value).trim();
  }

  return findTokenHrefDeep(payload, 0, new Set());
}

/**
 * True when this event describes a card token being stored.
 *
 * Worldpay delivers these as a separate event from the payment ones, so a
 * handler that only inspects payment status drops them on the floor.
 */
export function isTokenEvent(payload: any): boolean {
  const type = String(
    payload?.eventDetails?.type ||
      payload?.eventType ||
      payload?.type ||
      payload?.data?.type ||
      ""
  ).toLowerCase();
  if (type.includes("token")) return true;
  return Boolean(extractTokenHref(payload));
}


/**
 * True when this process is pointed at a real, money-moving Worldpay account.
 * Both the declared environment and the base URL are checked, so a stale
 * WORLDPAY_ENVIRONMENT value cannot re-enable simulation against production.
 */
export function isLiveWorldpayEnvironment(): boolean {
  const declared = String(process.env.WORLDPAY_ENVIRONMENT || "live").toLowerCase();
  const baseUrl = String(process.env.WORLDPAY_BASE_URL || "https://access.worldpay.com").toLowerCase();
  const looksSandboxed = /try\.|sandbox|test\.access\.worldpay/.test(baseUrl);
  if (looksSandboxed) return false;
  return declared === "live" || declared === "production" || baseUrl.includes("access.worldpay.com");
}

function getWorldpayConfig(): WorldpayConfig {
  const username = process.env.WORLDPAY_API_USERNAME;
  const password = process.env.WORLDPAY_API_PASSWORD;
  const entity = process.env.WORLDPAY_ENTITY || process.env.WORLDPAY_ENTITY_ID;
  const baseUrl = (process.env.WORLDPAY_BASE_URL || "https://access.worldpay.com").replace(/\/+$/, "");
  const environment = String(process.env.WORLDPAY_ENVIRONMENT || "live").toLowerCase();

  if (!username || !password || !entity) {
    throw new Error("Worldpay subscription credentials are not configured.");
  }

  return {
    baseUrl,
    entity,
    isTestMode: environment === "test" || environment === "sandbox",
    authHeader: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`
  };
}

/**
 * The payments media type this account accepts.
 *
 * Verified against the live entity: `application/json` and the v7 media type are
 * both rejected with HTTP 415 headerHasInvalidValue; v6 reaches schema
 * validation. The previous plain `application/json` header meant no recurring
 * charge could ever be submitted, however correct its credential was.
 */
const PAYMENTS_MEDIA_TYPE = "application/vnd.worldpay.payments-v6+json";

/**
 * The authorizations endpoint, as advertised by Worldpay's own service
 * discovery (GET / -> _links["payments:authorize"]).
 *
 * This used to be `/api/payments/authorizations`. That extra `/api` segment
 * never reaches the payments service — it answers 400 headerIsMissing no matter
 * how correct the body is — so every MIT charge failed before Worldpay looked
 * at it.
 */
function authorizationsUrl(config: WorldpayConfig): string {
  return `${config.baseUrl}/payments/authorizations`;
}

/**
 * Auto-settlement on the recurring charge.
 *
 * Worldpay integration support supplied this object for the subsequent payment:
 *
 *   "settlement": { "auto": true,
 *                   "cancelOn": { "cvcNotMatched": "disabled",
 *                                 "avsNotMatched": "disabled" } }
 *
 * An authorisation that is never settled reserves the money and then releases
 * it, so a renewal can look successful while nothing is ever collected.
 *
 * The v6 payments schema this account accepts spells the same directive
 * `requestAutoSettlement`. Rather than bet the renewal on one of the two, the
 * charge is attempted with the object support gave, and a schema rejection —
 * which Worldpay returns BEFORE authorising anything, so no money has moved —
 * falls through to the other spelling and then to no directive at all. The
 * shape that worked is logged so it can be pinned with WORLDPAY_SETTLEMENT_SHAPE.
 */
type SettlementShape = "settlement" | "requestAutoSettlement" | "none";

const SETTLEMENT_FALLBACK_ORDER: SettlementShape[] = [
  "settlement",
  "requestAutoSettlement",
  "none"
];

function settlementShapesToTry(): SettlementShape[] {
  const configured = String(process.env.WORLDPAY_SETTLEMENT_SHAPE || "auto").trim();
  if (configured && configured !== "auto") {
    if (SETTLEMENT_FALLBACK_ORDER.includes(configured as SettlementShape)) {
      return [configured as SettlementShape];
    }
    console.warn(
      `[Worldpay Subscription] Ignoring unknown WORLDPAY_SETTLEMENT_SHAPE "${configured}". ` +
        `Expected one of: ${SETTLEMENT_FALLBACK_ORDER.join(", ")}, auto.`
    );
  }
  if (String(process.env.WORLDPAY_AUTO_SETTLE || "true").toLowerCase() === "false") {
    return ["none"];
  }
  return [...SETTLEMENT_FALLBACK_ORDER];
}

function applySettlement(instruction: Record<string, any>, shape: SettlementShape) {
  delete instruction.settlement;
  delete instruction.requestAutoSettlement;

  if (shape === "settlement") {
    instruction.settlement = {
      auto: true,
      cancelOn: {
        // A stored-card MIT presents neither a CVC nor an address, so cancelling
        // the payment because they did not match would decline every renewal.
        cvcNotMatched: "disabled",
        avsNotMatched: "disabled"
      }
    };
  } else if (shape === "requestAutoSettlement") {
    instruction.requestAutoSettlement = { enabled: true };
  }
}

/**
 * Did Worldpay reject the request on its schema rather than on the payment?
 *
 * Only these are safe to retry: the gateway validates the body before it looks
 * at the card, so nothing was authorised and no duplicate charge is possible.
 */
function isSchemaRejection(status: number, data: any): boolean {
  if (status !== 400 && status !== 415 && status !== 422) return false;
  const text = JSON.stringify(data || {}).toLowerCase();
  return (
    text.includes("settlement") ||
    text.includes("schema") ||
    text.includes("unrecognised") ||
    text.includes("unrecognized") ||
    text.includes("unexpected") ||
    text.includes("notsupported") ||
    text.includes("invalidvalue") ||
    text.includes("bodydoesnotmatch")
  );
}

function getHeaders(config: WorldpayConfig) {
  const correlationId = crypto.randomUUID
    ? crypto.randomUUID()
    : `sub-${Math.random().toString(36).substring(2, 10)}`;
  return {
    Authorization: config.authHeader,
    "Content-Type": PAYMENTS_MEDIA_TYPE,
    Accept: PAYMENTS_MEDIA_TYPE,
    "WP-CorrelationId": correlationId
  };
}

/**
 * Creates the first payment for a subscription and asks Worldpay to store the
 * credential so that later merchant-initiated charges are possible.
 *
 * The `customerAgreement` block is what makes the card reusable. Without it
 * Worldpay authorises a one-off payment and returns no scheme reference, so
 * every subsequent recurring charge has nothing to present.
 */
export async function createInitialSubscriptionPayment({
  orderReference,
  amount,
  currency = "GBP",
  paymentInstrument,
  customerEmail
}: {
  orderReference: string;
  amount: number;
  currency?: string;
  paymentInstrument?: any;
  customerEmail?: string | null;
}) {
  const config = getWorldpayConfig();

  const body: any = {
    transactionReference: orderReference,
    merchant: { entity: config.entity },
    instruction: {
      narrative: { line1: "Pouch Supply Sub" },
      value: {
        currency,
        amount: Math.round(amount * 100)
      },
      customerAgreement: {
        type: "subscription",
        storedCardUsage: "first"
      }
    },
    // Without createToken Worldpay establishes the agreement but stores no card,
    // so no tokenCreated webhook arrives and no subsequent payment can name a
    // payment instrument.
    createToken: {
      type: "worldpay",
      namespace: String(customerEmail || orderReference).toLowerCase().slice(0, 64),
      description: "Pouch Supply subscription",
      optIn: tokenOptIn()
    }
  };

  if (paymentInstrument) {
    body.instruction.paymentInstrument = paymentInstrument;
  }
  if (customerEmail) {
    body.customer = { email: customerEmail };
  }

  const response = await fetch(authorizationsUrl(config), {
    method: "POST",
    headers: getHeaders(config),
    body: JSON.stringify(body)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.description ||
        data?.message ||
        `Worldpay initial subscription payment failed (${response.status})`
    );
  }

  return data;
}

/**
 * Extracts the scheme transaction reference Worldpay issues for a stored
 * credential. This is the value that must be presented on every subsequent
 * merchant-initiated charge.
 */
export function extractSchemeReference(response: any): string | null {
  if (!response || typeof response !== "object") return null;

  const candidates = [
    // Where Worldpay ACTUALLY returns it, on both the authorization response and
    // the payment query:
    //
    //   "transactionType": "cardOnFile",
    //   "scheme": { "reference": "MRLZRGKT60908  " }
    //
    // This path was missing, so every subscription looked like it had no stored
    // credential and reported "no stored-card mandate" — while Worldpay had
    // issued a perfectly good reference on the very first payment. The value is
    // space-padded to a fixed width by the scheme, hence the trim below.
    response?.scheme?.reference,
    response?.payment?.scheme?.reference,
    response?._embedded?.payments?.[0]?.scheme?.reference,
    // Shapes other Worldpay endpoints/versions use.
    response?.schemeReference,
    response?.schemeTransactionReference,
    response?.paymentInstrument?.schemeReference,
    response?.paymentInstrument?.schemeTransactionReference,
    response?.instruction?.paymentInstrument?.schemeReference,
    response?.customerAgreement?.schemeReference,
    response?.paymentInstrument?.card?.schemeReference
  ];

  for (const value of candidates) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed && !isPlaceholderCredential(trimmed)) {
      return trimmed;
    }
  }

  return null;
}

/**
 * Extract the recurring action href returned by Worldpay.
 *
 * We inspect multiple HAL structures because Worldpay exposes action links
 * through `_links`. Anything that is not a genuine Worldpay-issued link is
 * rejected — a manufactured URL is worse than no URL, because it sends the
 * recurring charge to an endpoint that does not exist.
 */
export function extractRecurringAuthorizationHref(response: any): string | null {
  if (!response) return null;

  if (typeof response === "string") {
    return isUsableRecurringHref(response) ? response : null;
  }

  const links = response?._links;

  if (links && typeof links === "object") {
    const possibleKeys = [
      "payments:recurringAuthorize",
      "recurringAuthorize",
      "payments:recurring",
      "recurring"
    ];

    for (const key of possibleKeys) {
      const item = links[key];
      const href = typeof item === "string" ? item : item?.href;
      if (isUsableRecurringHref(href)) {
        return href as string;
      }
    }
  }

  const direct =
    response?.recurringHref || response?.worldpayRecurringHref || response?.worldpayRecurringUrl;

  return isUsableRecurringHref(direct) ? direct : null;
}

export interface RecurringChargeResult {
  id: string;
  status: string;
  outcome?: string;
  transactionReference: string;
  amount: number;
  currency: string;
  authCode?: string | null;
  schemeReference?: string | null;
  /** Present when Worldpay issued or rotated the stored-card token on this charge. */
  tokenHref?: string | null;
  paymentMethod?: string;
  rawResponse?: any;
  timestamp: string;
}

/**
 * Perform a merchant initiated (MIT) recurring subscription payment.
 *
 * Worldpay has no automatically renewing subscription product. Every month is a
 * fresh Payments API request that presents the card Worldpay stored during the
 * first payment, as its own integration support spelled out:
 *
 *   "To manage your agreement and take subsequent payments, you must use a
 *    direct integration through our Subsequent recurring payment | Payments API"
 *
 * The card is presented as the token href from the tokenCreated webhook. The
 * scheme transaction reference travels alongside it on the customerAgreement,
 * but on its own it is not a card and cannot be charged — which is why every
 * renewal built from a scheme reference and no payment instrument failed.
 *
 * Nothing here can be invented locally: both credentials come from Worldpay.
 */
export async function chargeRecurringSubscription({
  tokenHref,
  recurringHref,
  transactionReference,
  amount,
  currency = "GBP",
  schemeReference,
  previousTransactionId,
  customerEmail
}: {
  tokenHref?: string | null;
  recurringHref?: string | null;
  transactionReference: string;
  amount: number;
  currency?: string;
  schemeReference?: string | null;
  previousTransactionId?: string | null;
  customerEmail?: string | null;
}): Promise<RecurringChargeResult> {
  let config: WorldpayConfig | null = null;
  let configError: string | null = null;

  try {
    config = getWorldpayConfig();
  } catch (cfgErr: any) {
    configError = cfgErr.message;
    console.warn("[Worldpay Subscription] Credentials note:", cfgErr.message);
  }

  const usableToken = isUsableTokenHref(tokenHref);
  const usableHref = isUsableRecurringHref(recurringHref);
  const usableScheme = Boolean(schemeReference) && !isPlaceholderCredential(schemeReference);
  const usablePreviousTx =
    Boolean(previousTransactionId) && !isPlaceholderCredential(previousTransactionId);

  if (!config) {
    throw new Error(
      configError ||
        "Worldpay credentials are not configured, so no recurring payment can be taken."
    );
  }

  if (!usableToken && !usableHref && !usableScheme && !usablePreviousTx) {
    throw new Error(
      "No Worldpay stored credential is available for this subscription. " +
        "The initial payment must be taken with createToken and a customer agreement so " +
        "Worldpay stores the card and sends a tokenCreated webhook carrying the token href."
    );
  }

  if (!usableToken) {
    // Worth saying out loud on every charge: without the token this request has
    // no card on it, and Worldpay is being asked to bill an agreement rather
    // than a payment method.
    console.warn(
      `[Worldpay Subscription] ${transactionReference} has no stored card token. ` +
        `Falling back to the scheme reference alone, which Worldpay may refuse — ` +
        `the tokenCreated webhook for this subscription was never received or never stored.`
    );
  }

  // With a token in hand this is an ordinary Payments API authorization, not a
  // call to a recurring action link. The token is the card.
  const targetUrl =
    usableToken || !usableHref ? authorizationsUrl(config) : (recurringHref as string);

  console.log(
    `[Worldpay Subscription] Initiating MIT recurring charge via ${targetUrl} for ` +
      `${transactionReference} (£${amount})${usableToken ? " using the stored card token" : ""}`
  );

  const buildInstruction = (): any => {
    const instruction: any = {
      narrative: { line1: "Pouch Supply Sub" },
      value: {
        currency,
        amount: Math.round(amount * 100)
      },
      debtRepayment: false,
      customerAgreement: {
        type: "subscription",
        storedCardUsage: "subsequent"
      }
    };

    if (usableToken) {
      instruction.paymentInstrument = {
        type: "card/token",
        href: String(tokenHref).trim()
      };
    }

    if (usableScheme) {
      instruction.customerAgreement.schemeReference = schemeReference;
    } else if (usablePreviousTx) {
      instruction.customerAgreement.schemeReference = previousTransactionId;
    }

    return instruction;
  };

  const shapes = settlementShapesToTry();
  let response!: Response;
  let data: any = {};

  for (let attempt = 0; attempt < shapes.length; attempt++) {
    const shape = shapes[attempt];
    const instruction = buildInstruction();
    applySettlement(instruction, shape);

    const mitPayload: any = {
      transactionReference,
      merchant: { entity: config.entity },
      instruction
    };

    if (customerEmail) {
      mitPayload.customer = { email: customerEmail };
    }

    response = await fetch(targetUrl, {
      method: "POST",
      headers: getHeaders(config),
      body: JSON.stringify(mitPayload)
    });

    data = await response.json().catch(() => ({}));

    if (response.ok) {
      if (attempt > 0) {
        console.warn(
          `[Worldpay Subscription] Settlement directive "${shapes[attempt - 1]}" was rejected by ` +
            `this account; "${shape}" was accepted. Set WORLDPAY_SETTLEMENT_SHAPE=${shape} to ` +
            `skip the rejected attempt on every future renewal.`
        );
      }
      if (shape === "none") {
        console.warn(
          `[Worldpay Subscription] ${transactionReference} was authorised WITHOUT an ` +
            `auto-settlement directive. Confirm the account settles automatically, or the ` +
            `money will be reserved and released rather than collected.`
        );
      }
      break;
    }

    // Only a schema rejection is retried, and only because Worldpay validates
    // the body before it touches the card: nothing was authorised, so there is
    // no risk of charging the customer twice.
    const retryable = attempt < shapes.length - 1 && isSchemaRejection(response.status, data);
    if (!retryable) break;

    console.warn(
      `[Worldpay Subscription] Settlement shape "${shape}" rejected for ${transactionReference} ` +
        `(${response.status}: ${data?.description || data?.message || data?.errorName || "schema error"}). ` +
        `Retrying as "${shapes[attempt + 1]}".`
    );
  }

  if (!response.ok) {
    const errMsg =
      data?.description || data?.message || `Worldpay returned HTTP ${response.status}`;
    console.error(
      `[Worldpay Subscription] Recurring charge REJECTED for ${transactionReference}: ${response.status} — ${errMsg}`
    );

    // A rejection is a real failure. The renewal is recorded as failed rather
    // than being reported as a paid order nobody was charged for.
    throw new Error(errMsg);
  }

  const outcome = String(data?.outcome || data?.lastEvent || "").toLowerCase();
  const declined =
    outcome.includes("refus") || outcome.includes("declin") || outcome.includes("fail");

  if (declined) {
    throw new Error(
      `Worldpay declined the recurring payment for ${transactionReference} (outcome: ${data?.outcome || "refused"}).`
    );
  }

  console.log(
    `[Worldpay Subscription] Live recurring payment SUCCESS for ${transactionReference}:`,
    data?.id || data?.outcome || "authorized"
  );

  return {
    id: data?.id || data?.transactionReference || transactionReference,
    status: "authorized",
    outcome: data?.outcome || "authorized",
    transactionReference,
    amount,
    currency,
    authCode: data?.authorizationCode || data?.authCode || null,
    schemeReference: extractSchemeReference(data) || (usableScheme ? schemeReference : null),
    // Worldpay can return a rotated token href on the charge. Keeping it means
    // the next renewal presents the current card rather than a retired one.
    tokenHref: extractTokenHref(data) || (usableToken ? String(tokenHref).trim() : null),
    rawResponse: data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Reading stored cards back out of Worldpay.
 *
 * Worldpay stores the card on the first payment and announces it on a
 * tokenCreated webhook. A webhook is a push: if it is not subscribed on the
 * account, or the endpoint is wrong, or the delivery fails, the href is gone and
 * the subscription can never charge. That is not hypothetical — it is what
 * happened here, twice, while Worldpay held a perfectly good token all along.
 *
 * The tokens service turns that into a pull we control. Confirmed against
 * entity PO4094415264:
 *
 *   GET /tokens?namespace=<shopper email>   ->   200, with the stored card
 *
 * so the webhook becomes an optimisation rather than the only route.
 */
const TOKENS_MEDIA_TYPE = 'application/vnd.worldpay.tokens-v3.hal+json';

export interface WorldpayToken {
  /** The value a recurring payment presents as its paymentInstrument. */
  href: string;
  tokenId: string | null;
  namespace: string | null;
  /**
   * The agreement this token was created under. This is what ties a card to a
   * particular subscription — a namespace holds every card one shopper ever
   * stored, so the email alone does not identify which.
   */
  schemeTransactionReference: string | null;
  expiryDateTime: string | null;
  raw: any;
}

/** Pulls token objects out of whichever envelope Worldpay wraps them in. */
function collectTokenObjects(payload: any): any[] {
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload)) return payload;

  const candidates = [
    payload?._embedded?.tokens,
    payload?._embedded?.token,
    payload?.tokens,
    payload?.items,
    payload?.results
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === 'object') return [candidate];
  }

  // A single token returned bare.
  if (payload.tokenId || payload.tokenPaymentInstrument || payload.schemeTransactionReference) {
    return [payload];
  }
  return [];
}

function toWorldpayToken(raw: any): WorldpayToken | null {
  if (!raw || typeof raw !== 'object') return null;

  const href =
    raw?.tokenPaymentInstrument?.href ||
    raw?._links?.['tokens:token']?.href ||
    raw?._links?.self?.href ||
    raw?.href ||
    null;

  if (!isUsableTokenHref(href)) return null;

  const scheme =
    raw?.schemeTransactionReference ||
    raw?.paymentInstrument?.schemeTransactionReference ||
    raw?.tokenPaymentInstrument?.schemeTransactionReference ||
    null;

  return {
    href: String(href).trim(),
    tokenId: raw?.tokenId ? String(raw.tokenId) : null,
    namespace: raw?.namespace ? String(raw.namespace) : null,
    schemeTransactionReference: typeof scheme === 'string' && scheme.trim() ? scheme.trim() : null,
    expiryDateTime: raw?.tokenExpiryDateTime ? String(raw.tokenExpiryDateTime) : null,
    raw
  };
}

/**
 * Every card Worldpay is holding for one shopper.
 *
 * Returns an empty list rather than throwing when the lookup cannot be made, so
 * a recovery sweep degrades to "found nothing" instead of failing outright.
 */
export async function fetchTokensForNamespace(namespace: string): Promise<WorldpayToken[]> {
  const cleaned = String(namespace || '').trim().toLowerCase();
  if (!cleaned) return [];

  let config: WorldpayConfig;
  try {
    config = getWorldpayConfig();
  } catch (err: any) {
    console.warn('[Worldpay Tokens] Cannot look up stored cards:', err?.message);
    return [];
  }

  const url =
    `${config.baseUrl}/tokens?namespace=${encodeURIComponent(cleaned)}` +
    `&entityReference=${encodeURIComponent(config.entity)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: config.authHeader,
        Accept: TOKENS_MEDIA_TYPE,
        'WP-CorrelationId': crypto.randomUUID ? crypto.randomUUID() : `tok-${Date.now()}`
      }
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.warn(
        `[Worldpay Tokens] Lookup for "${cleaned}" returned HTTP ${response.status}. ${detail.slice(0, 300)}`
      );
      return [];
    }

    const data = await response.json().catch(() => null);
    const tokens = collectTokenObjects(data)
      .map(toWorldpayToken)
      .filter((t): t is WorldpayToken => Boolean(t));

    console.log(
      `[Worldpay Tokens] ${tokens.length} stored card(s) for "${cleaned}": ` +
        tokens.map(t => `${t.tokenId || 'no-id'}/${t.schemeTransactionReference || 'no-scheme'}`).join(', ')
    );

    return tokens;
  } catch (err: any) {
    console.warn(`[Worldpay Tokens] Lookup for "${cleaned}" failed:`, err?.message);
    return [];
  }
}

export interface TokenSelection {
  token: WorldpayToken | null;
  /** Why this token was chosen, or why none was — written for a log a human reads. */
  reason: string;
  /** True when a human should decide rather than the code guessing. */
  ambiguous: boolean;
}

/**
 * Picks the stored card that belongs to ONE subscription.
 *
 * This is deliberately hard to satisfy. A namespace is keyed on the shopper's
 * email, so it accumulates every card that shopper has ever stored — across
 * different plans, different cards, and re-subscriptions. Taking "the token for
 * this email" would therefore mean charging a card the shopper never attached to
 * this plan, and with enough tokens in one namespace, eventually the wrong card
 * for the wrong subscription.
 *
 * The scheme transaction reference is the identifier that actually ties a card
 * to an agreement, so it decides. Everything else is refused and reported rather
 * than guessed: a subscription that does not renew is a support ticket, but a
 * subscription that charges the wrong card is a chargeback.
 */
export function selectTokenForSubscription(
  tokens: WorldpayToken[],
  criteria: { namespace: string; schemeReference?: string | null }
): TokenSelection {
  const wantedNamespace = String(criteria.namespace || '').trim().toLowerCase();
  if (!wantedNamespace) {
    return { token: null, reason: 'the subscription has no customer email to look up', ambiguous: false };
  }

  // Never accept a card Worldpay filed under a different shopper, whatever the
  // query returned. A token reporting no namespace is trusted only because the
  // query itself was scoped to one.
  const mine = tokens.filter(t => {
    if (!isUsableTokenHref(t.href)) return false;
    if (!t.namespace) return true;
    return t.namespace.trim().toLowerCase() === wantedNamespace;
  });

  const foreign = tokens.length - mine.length;
  if (foreign > 0) {
    console.warn(
      `[Worldpay Tokens] Discarded ${foreign} token(s) filed under a namespace other than "${wantedNamespace}".`
    );
  }

  if (mine.length === 0) {
    return { token: null, reason: `Worldpay holds no stored card for "${wantedNamespace}"`, ambiguous: false };
  }

  const wantedScheme = String(criteria.schemeReference || '').trim();

  if (wantedScheme) {
    const exact = mine.filter(t => (t.schemeTransactionReference || '').trim() === wantedScheme);
    if (exact.length === 1) {
      return {
        token: exact[0],
        reason: `matched on scheme transaction reference ${wantedScheme}`,
        ambiguous: false
      };
    }
    if (exact.length > 1) {
      return {
        token: null,
        reason: `${exact.length} stored cards share scheme reference ${wantedScheme} — cannot tell them apart`,
        ambiguous: true
      };
    }

    // The decisive case, and the one that caught PS65700: Worldpay holds a card
    // for this shopper, but it was stored under a different agreement. It may
    // well be the same plastic; it is not the same mandate, and assigning it
    // here would be a guess dressed up as a recovery.
    return {
      token: null,
      reason:
        `Worldpay holds ${mine.length} stored card(s) for "${wantedNamespace}", but none was created under ` +
        `this subscription's agreement (${wantedScheme}). Found: ` +
        mine.map(t => t.schemeTransactionReference || 'no scheme reference').join(', ') +
        '. Not assigned — a human has to confirm which card this plan should charge.',
      ambiguous: true
    };
  }

  // No agreement reference to match against. One card is unambiguous; more than
  // one is not, and picking the newest would be arbitrary.
  if (mine.length === 1) {
    return {
      token: mine[0],
      reason: `the only stored card for "${wantedNamespace}" and the subscription has no scheme reference to match`,
      ambiguous: false
    };
  }

  return {
    token: null,
    reason:
      `Worldpay holds ${mine.length} stored cards for "${wantedNamespace}" and this subscription has no scheme ` +
      `reference to identify which one belongs to it. Not assigned.`,
    ambiguous: true
  };
}
