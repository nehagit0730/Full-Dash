import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../../src/lib/prisma';
import { fetchResource, getDb, saveResource } from '../../serverDb';
import { requireAdmin, requireCronOrAdmin } from '../middleware/requireAdmin';
import {
  extractRecurringAuthorizationHref,
  extractSchemeReference,
  extractTokenHref,
  isPlaceholderCredential,
  isTokenEvent,
  isUsableRecurringHref,
  isUsableTokenHref,
  tokenOptIn,
  fetchTokensForNamespace,
  selectTokenForSubscription
} from '../services/worldpaySubscription';
import { calculateNextBillingDate, normalizeBillingInterval } from '../services/subscriptionCron';
import {
  UK_COUNTRY_CODE,
  UK_COUNTRY_NAME,
  normalizeUkPhone,
  normalizeUkPostcode,
  validateUkDelivery
} from '../../src/utils/ukValidation';
import { isFreeShippingReward, resolveDeliveryCost } from '../../src/utils/discountUtils';
import {
  isSubscriptionLine,
  recurringAmountForNewSubscription,
  subscriptionLinesTotal
} from '../../src/lib/subscriptionPricing';
import { trackSubscriptionStarted } from '../services/klaviyoService';
import { checkDiscountUsable } from '../services/discountUsage';

const router = Router();

/**
 * The store delivers within the UK only, and Royal Mail needs a contact number
 * on the label. The checkout form enforces both, but the form is not the gate:
 * anything can POST to this endpoint, and an order taken here is an order the
 * shop is committed to. Refusing before the payment session is created is the
 * only point at which no money has moved yet.
 */
function assertDeliverable(body: any): { ok: boolean; phone: string; postcode: string; message: string } {
  const address = (body?.shippingAddress && typeof body.shippingAddress === 'object' ? body.shippingAddress : {}) as Record<string, string>;
  const destination = String(body?.destination || body?.address || '');

  // The country may arrive as a field or only inside the joined destination
  // string, which is what older storefront builds sent.
  const country =
    address.country ||
    address.countryCode ||
    (destination ? destination.split(',').map(p => p.trim()).filter(Boolean).pop() || '' : '');

  const phone = body?.customerPhone || address.phone || '';
  const postcode = address.postcode || '';

  const check = validateUkDelivery({
    phone,
    postcode,
    // An order with no country recorded at all predates the UK-only rule rather
    // than being an overseas order; the postcode check still has to pass.
    country: country || UK_COUNTRY_NAME
  });

  if (!check.valid) {
    return { ok: false, phone: '', postcode: '', message: check.errors[0] };
  }

  return { ok: true, phone: normalizeUkPhone(phone), postcode: normalizeUkPostcode(postcode), message: '' };
}

// In-memory store for pending checkout payloads before payment confirmation.
// Crucial: An order is NEVER created in the database prior to verified payment success!
interface PendingCheckout {
  orderId: string;
  customerName: string;
  customerEmail: string;
  destination: string;
  // The address as separate fields. The destination string is the joined display
  // form; Royal Mail needs the town and postcode on their own.
  shippingAddress?: Record<string, string>;
  // Required for dispatch: Royal Mail prints it on the label.
  customerPhone?: string;
  items: any[];
  total: number;
  subtotal?: number;
  shippingCost?: number;
  deliveryCost?: number;
  deliveryMethod?: string;
  discountApplied: any;
  /** Money the discount took off, so the order does not have to reverse it out. */
  discountAmount?: number;
  storeCreditApplied: number;
  isTestMode: boolean;
  createdAt: number;
  /**
   * Set when Worldpay refused to store the card at checkout and the sale was
   * taken as a one-off. The subscription built from this order has no card and
   * cannot renew, so it is marked rather than left looking healthy.
   */
  tokenisationDowngraded?: boolean;
}

const pendingCheckoutsMap = new Map<string, PendingCheckout>();

// Helper to determine Worldpay Environment and Credentials
function getEnvironmentConfig() {
  const entity = process.env.WORLDPAY_ENTITY || process.env.WORLDPAY_ENTITY_ID || '';
  const username = process.env.WORLDPAY_API_USERNAME || '';
  const password = process.env.WORLDPAY_API_PASSWORD || '';
  const baseUrl = (process.env.WORLDPAY_BASE_URL || 'https://access.worldpay.com').replace(/\/+$/, '');

  let authHeader: string | null = null;
  if (username && password) {
    authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  }

  // Honour WORLDPAY_ENVIRONMENT instead of always claiming "live" — the admin
  // config panel reports this, and it previously showed a sandbox setup as live.
  const environment = String(process.env.WORLDPAY_ENVIRONMENT || 'live').toLowerCase();
  const isTestMode = environment === 'test' || environment === 'sandbox';

  return {
    isTestMode,
    environment,
    entity,
    username,
    password,
    baseUrl,
    authHeader,
    checkoutId: process.env.WORLDPAY_CHECKOUT_ID || process.env.NEXT_PUBLIC_WORLDPAY_CHECKOUT_ID || ''
  };
}

// Helper to extract shopper redirect URL from Worldpay HAL JSON response
function extractWorldpayRedirectUrl(responseBody: any): string | null {
  if (!responseBody) return null;

  for (const prop of ['hostedPaymentPageUrl', 'redirectUrl', 'checkoutUrl', 'url']) {
    const val = responseBody[prop];
    if (val && typeof val === 'string' && !val.includes('/paymentQueries') && !val.includes('/payments?')) {
      return val;
    }
  }

  const links = responseBody._links;
  if (!links || typeof links !== 'object') return null;

  const priorityRels = [
    'hostedPaymentPage',
    'payments:hostedPaymentPage',
    'hpp:hostedPaymentPage',
    'hostedPaymentPage:page',
    'hostedPaymentPage:redirect',
    'paymentPage',
    'redirect',
    'checkout',
    'shopper'
  ];

  for (const rel of priorityRels) {
    const item = links[rel];
    const href = typeof item === 'string' ? item : item?.href;
    if (href && typeof href === 'string' && !href.includes('/paymentQueries') && !href.includes('/payments?')) {
      return href;
    }
  }

  for (const [relKey, item] of Object.entries(links)) {
    if (relKey === 'self') continue;
    const href = typeof item === 'string' ? item : (item as any)?.href;
    if (href && typeof href === 'string' && !href.includes('/paymentQueries') && !href.includes('/payments?')) {
      return href;
    }
  }

  const selfHref = typeof links.self === 'string' ? links.self : links.self?.href;
  if (selfHref && typeof selfHref === 'string' && (selfHref.includes('/paymentPages/') || selfHref.includes('/checkout/'))) {
    return selfHref;
  }

  return null;
}

/**
 * Looks a payment up with Worldpay after the shopper returns from the Hosted
 * Payment Page.
 *
 * The browser redirect carries no payment detail, so for a subscription order
 * this query is the only opportunity to capture the scheme transaction
 * reference Worldpay issued for the stored card. Without it there is nothing to
 * present on the recurring charges, which is why renewals never took money.
 */
/**
 * Records a Worldpay stored-credential against a subscription that was created
 * without one.
 *
 * The redirect back from the Hosted Payment Page carries no payment detail, so a
 * subscription is often created before Worldpay has told us anything about the
 * stored card. The reference then arrives on a later webhook or payment query.
 * Existing credentials are never overwritten, and a value that is not a genuine
 * Worldpay one is ignored rather than stored.
 */
async function backfillSubscriptionCredential(orderId: string, gatewayResponse: any): Promise<boolean> {
  const href = extractRecurringAuthorizationHref(gatewayResponse);
  const scheme = extractSchemeReference(gatewayResponse);
  const tokenHref = extractTokenHref(gatewayResponse);
  if (!href && !scheme && !tokenHref) return false;

  let updated = false;

  try {
    const storedSubs: any[] = (await fetchResource('subscriptions')) || [];
    const next = storedSubs.map((sub: any) => {
      if (String(sub?.sourceOrderId || sub?.worldpayTransactionId || "") !== String(orderId)) return sub;

      // The token is the card, and a subscription that already has a scheme
      // reference can still be missing it — that is precisely the state every
      // existing subscription is in. So a token is recorded even when the
      // subscription looks "complete" by the old standard.
      const needsToken = Boolean(tokenHref) && !isUsableTokenHref(sub.worldpayTokenHref);
      const hasUsable =
        isUsableRecurringHref(sub.worldpayRecurringHref) ||
        (Boolean(sub.worldpaySchemeReference) && !isPlaceholderCredential(sub.worldpaySchemeReference));
      if (hasUsable && !needsToken) return sub;

      updated = true;
      console.log(
        `[Worldpay Order] Recording Worldpay stored credential for subscription ${sub.id} ` +
          `from a later gateway response for order ${orderId}` +
          (needsToken ? ' (including the stored card token).' : '.')
      );
      return {
        ...sub,
        worldpayTokenHref: tokenHref || sub.worldpayTokenHref || null,
        worldpayRecurringHref: href || sub.worldpayRecurringHref || null,
        worldpaySchemeReference: scheme || sub.worldpaySchemeReference || null
      };
    });

    if (updated) {
      await saveResource('subscriptions', next);
      const target = next.find(
        (sub: any) => String(sub?.sourceOrderId || sub?.worldpayTransactionId || "") === String(orderId)
      );
      if (target?.id) {
        try {
          await prisma.subscription.update({
            where: { id: String(target.id) },
            data: {
              worldpayTokenHref: target.worldpayTokenHref,
              worldpayRecurringHref: target.worldpayRecurringHref,
              worldpaySchemeReference: target.worldpaySchemeReference
            }
          });
        } catch (_e) {}
      }
    }
  } catch (_e) {}

  return updated;
}

/**
 * Tokens that arrived before the subscription they belong to existed.
 *
 * Worldpay delivers the payment event and the tokenCreated event separately and
 * in no guaranteed order, so the token can land while the order is still being
 * written — or while Neon is unreachable, which the production log shows does
 * happen. Either way the href is the only copy of that credential in existence:
 * Worldpay does not resend it on request, and without it the subscription
 * cannot renew. So an unmatched token is parked rather than discarded.
 */
const PENDING_TOKENS_RESOURCE = 'worldpayPendingTokens';

/** How long a parked token is worth keeping before it is almost certainly orphaned. */
const PENDING_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

async function holdUnmatchedToken(
  tokenHref: string,
  hints: { reference?: string | null; namespace?: string | null }
): Promise<void> {
  try {
    const held: any[] = (await fetchResource(PENDING_TOKENS_RESOURCE)) || [];
    const cutoff = Date.now() - PENDING_TOKEN_TTL_MS;

    const kept = held.filter(
      (entry: any) =>
        entry &&
        entry.tokenHref !== tokenHref &&
        new Date(entry.receivedAt || 0).getTime() > cutoff
    );

    kept.push({
      id: `tok_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      tokenHref,
      reference: hints.reference || null,
      namespace: hints.namespace || null,
      receivedAt: new Date().toISOString()
    });

    await saveResource(PENDING_TOKENS_RESOURCE, kept.slice(-200));

    console.warn(
      `[Worldpay Webhook] tokenCreated arrived for reference "${hints.reference || 'n/a'}" / ` +
        `namespace "${hints.namespace || 'n/a'}" before its subscription existed. Held for the ` +
        `subscription to claim. Token: ${tokenHref}`
    );
  } catch (err: any) {
    // Losing the token here is the worst outcome in this file, so it is logged
    // at full volume with the href, which is recoverable from the log by hand.
    console.error(
      `[Worldpay Webhook] COULD NOT PARK an unmatched card token — it is lost unless recovered ` +
        `from this line. reference="${hints.reference || 'n/a'}" namespace="${hints.namespace || 'n/a'}" ` +
        `token=${tokenHref} error=${err?.message}`
    );
  }
}

/**
 * Takes a held token belonging to this order or shopper, if one is waiting.
 * A claimed token is retired so a later subscription cannot pick up a card that
 * is already spoken for.
 */
async function claimPendingToken(orderId: string, customerEmail?: string | null): Promise<string | null> {
  const reference = String(orderId || '').trim();
  const email = String(customerEmail || '').trim().toLowerCase();
  if (!reference && !email) return null;

  try {
    const held: any[] = (await fetchResource(PENDING_TOKENS_RESOURCE)) || [];
    if (held.length === 0) return null;

    const match = held.find(
      (entry: any) =>
        entry &&
        isUsableTokenHref(entry.tokenHref) &&
        ((reference && String(entry.reference || '').trim() === reference) ||
          (email && String(entry.namespace || '').trim().toLowerCase() === email))
    );
    if (!match) return null;

    // The claimed entry is blanked in place rather than dropped from the list.
    // saveResource only deletes rows absent from a NON-EMPTY list, so removing
    // the last held token would leave its row in Neon for the next request to
    // read back — and a later subscription for the same shopper would claim a
    // card that is already spoken for. Overwriting the row cannot be skipped.
    // The matcher above requires a usable href, so a blanked entry is inert,
    // and holdUnmatchedToken's TTL sweep clears it once it ages out.
    const consumed = held.map((entry: any) =>
      entry?.id === match.id
        ? {
            id: entry.id,
            tokenHref: null,
            reference: entry.reference || null,
            namespace: entry.namespace || null,
            receivedAt: entry.receivedAt || new Date().toISOString(),
            claimedAt: new Date().toISOString()
          }
        : entry
    );

    await saveResource(PENDING_TOKENS_RESOURCE, consumed);

    console.log(
      `[Worldpay Order] Claimed a held card token for order ${reference || email}: ${match.tokenHref}`
    );
    return match.tokenHref;
  } catch (err: any) {
    console.warn('[Worldpay Order] Could not read held card tokens:', err?.message);
    return null;
  }
}

/**
 * Records a stored-card token against the subscription it belongs to.
 *
 * The tokenCreated webhook is a separate event from the payment one and carries
 * no order object — it identifies itself by the transaction reference of the
 * payment that stored the card, and by the namespace the checkout set (the
 * shopper's email). Both are tried, because a subscription may have been
 * created under either.
 */
async function recordTokenForSubscription(
  tokenHref: string,
  hints: { transactionReference?: string | null; namespace?: string | null }
): Promise<boolean> {
  const reference = String(hints.transactionReference || '').trim();
  const namespace = String(hints.namespace || '').trim().toLowerCase();
  if (!isUsableTokenHref(tokenHref)) return false;

  const matches = (sub: any): boolean => {
    if (!sub) return false;
    if (reference) {
      const refs = [sub.sourceOrderId, sub.worldpayTransactionId, sub.lastPaymentId]
        .map((v: any) => String(v || '').trim())
        .filter(Boolean);
      if (refs.some(r => r === reference)) return true;
    }
    if (namespace) {
      const email = String(sub.customerEmail || '').trim().toLowerCase();
      if (email && email === namespace) return true;
    }
    return false;
  };

  let updatedId: string | null = null;

  try {
    const storedSubs: any[] = (await fetchResource('subscriptions')) || [];
    const candidates = storedSubs.filter(matches);

    if (candidates.length === 0) {
      // Expected on a fast gateway: the token event can overtake the payment
      // event, so the subscription this token belongs to does not exist yet.
      // Dropping it here would cost that customer their renewal, so it is held
      // and claimed when the subscription is created.
      await holdUnmatchedToken(tokenHref, { reference, namespace });
      return false;
    }

    // Newest first: a shopper who has resubscribed should have the token
    // attached to the plan the payment just created, not to an old one.
    const target = candidates.sort((a: any, b: any) => {
      const at = new Date(a?.createdAt || 0).getTime();
      const bt = new Date(b?.createdAt || 0).getTime();
      return bt - at;
    })[0];

    if (String(target.worldpayTokenHref || '') === tokenHref) return false;

    updatedId = String(target.id);
    const next = storedSubs.map((sub: any) =>
      String(sub.id) === updatedId
        ? { ...sub, worldpayTokenHref: tokenHref, tokenRecordedAt: new Date().toISOString() }
        : sub
    );
    await saveResource('subscriptions', next);

    console.log(
      `[Worldpay Webhook] Stored card token recorded for subscription ${updatedId} ` +
        `(${target.customerEmail}). Renewals can now present the card.`
    );
  } catch (err: any) {
    console.error('[Worldpay Webhook] Failed to record token against a subscription:', err?.message);
    return false;
  }

  if (updatedId) {
    try {
      await prisma.subscription.update({
        where: { id: updatedId },
        data: { worldpayTokenHref: tokenHref }
      });
    } catch (_e) {}
  }

  return Boolean(updatedId);
}

/**
 * The Payment Queries API: a GET with the reference in the query string, and a
 * versioned HAL media type in Accept.
 *
 * Both details matter, and both were wrong. The call used to be a POST to a bare
 * `/paymentQueries/payments` with a JSON body, which Worldpay answers with an
 * HTML 404 — that route does not exist — and it asked for `application/json`,
 * which the endpoint rejects with 406. So this lookup returned null on every
 * single order since it was written.
 *
 * That is not a cosmetic failure. This is the only place a subscription's scheme
 * transaction reference is read back after the shopper returns from the Hosted
 * Payment Page, so no subscription could ever record a stored-card mandate, and
 * every plan reported "no stored-card mandate with Worldpay".
 *
 * The correct URL is the one Worldpay itself hands back as `_links.self.href`
 * when the payment page is created.
 */
const PAYMENT_QUERY_ACCEPT = 'application/vnd.worldpay.payment-queries-v1.hal+json';

/** How long to keep asking when Worldpay has not published the payment yet. */
const PAYMENT_QUERY_ATTEMPTS = 3;
const PAYMENT_QUERY_RETRY_MS = 1200;

/** Worldpay events that mean the money is committed. */
const AUTHORISED_PAYMENT_EVENTS = [
  'authorized',
  'authorised',
  'sentforsettlement',
  // What this account actually reports for a captured payment. Every live
  // Worldpay payment queried on this entity comes back
  // `"lastEvent": "settlementRequestSubmitted"` — the money is authorised AND
  // the settlement request is in. It was missing from this list, so every real
  // payment normalised to "unknown", the order was recorded as Pending, and the
  // subscription that depends on a confirmed payment was never created.
  'settlementrequestsubmitted',
  'settlementsubmitted',
  'settled',
  'charged',
  'captured'
];

/** Worldpay events that mean the payment definitively did not happen. */
const FAILED_PAYMENT_EVENTS = ['refused', 'declined', 'failed', 'cancelled', 'canceled', 'expired', 'error'];

/**
 * Did Worldpay actually take the money?
 *
 * The shopper's return URL carries `status=SUCCESS` as a plain query parameter,
 * which is a claim by the browser, not by Worldpay — anyone can request that URL
 * and it used to be enough to record an order as Paid. The payment query is the
 * only trustworthy answer, and it only became usable once the call above was
 * fixed.
 */
function paymentOutcome(payment: any): 'authorised' | 'failed' | 'unknown' {
  if (!payment) return 'unknown';
  const raw = String(payment.lastEvent || payment.outcome || payment.status || '')
    .toLowerCase()
    .replace(/[\s_-]/g, '');
  if (!raw) return 'unknown';
  if (AUTHORISED_PAYMENT_EVENTS.includes(raw)) return 'authorised';
  if (FAILED_PAYMENT_EVENTS.includes(raw)) return 'failed';
  return 'unknown';
}

async function fetchWorldpayPaymentDetails(transactionReference: string): Promise<any | null> {
  const cfg = getEnvironmentConfig();
  if (!cfg.authHeader || !cfg.entity) return null;

  const url = `${cfg.baseUrl}/paymentQueries/payments?transactionReference=${encodeURIComponent(transactionReference)}`;

  for (let attempt = 1; attempt <= PAYMENT_QUERY_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: cfg.authHeader,
          Accept: PAYMENT_QUERY_ACCEPT,
          'WP-CorrelationId': crypto.randomUUID ? crypto.randomUUID() : `q-${Date.now()}`
        }
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        console.warn(
          `[Worldpay Query] Payment lookup for ${transactionReference} returned HTTP ${response.status}. ` +
            `A subscription created from this payment will have no stored-card mandate. ${detail.slice(0, 300)}`
        );
        return null;
      }

      const data: any = await response.json().catch(() => null);
      const payment = data?._embedded?.payments?.[0] || data?.payments?.[0] || null;
      if (payment) return payment;

      // HTTP 200 with an empty collection means Worldpay has not published the
      // payment yet — it lags the shopper's redirect by a moment. Giving up on
      // the first empty answer loses the mandate permanently, so ask again.
      if (attempt < PAYMENT_QUERY_ATTEMPTS) {
        console.log(
          `[Worldpay Query] No payment published yet for ${transactionReference} (attempt ${attempt}/${PAYMENT_QUERY_ATTEMPTS}); retrying.`
        );
        await new Promise(resolve => setTimeout(resolve, PAYMENT_QUERY_RETRY_MS));
        continue;
      }

      console.warn(
        `[Worldpay Query] Worldpay reports no payment for ${transactionReference}. ` +
          `The shopper did not complete the payment, or it was declined.`
      );
      return null;
    } catch (err: any) {
      console.warn(`[Worldpay Query] Payment lookup failed for ${transactionReference}:`, err?.message);
      return null;
    }
  }

  return null;
}

// Helper to save and load pending checkouts persistently
async function savePendingCheckout(orderId: string, payload: PendingCheckout) {
  pendingCheckoutsMap.set(orderId, payload);
  try {
    const existing: any[] = (await fetchResource('pending_checkouts')) || [];
    const idx = existing.findIndex((p: any) => String(p.orderId) === String(orderId));
    if (idx !== -1) {
      existing[idx] = payload;
    } else {
      existing.unshift(payload);
    }
    await saveResource('pending_checkouts', existing.slice(0, 200));
  } catch (err) {
    console.warn('[Worldpay] Failed to persist pending checkout:', err);
  }
}

async function getPendingCheckout(orderId: string): Promise<PendingCheckout | undefined> {
  let pending = pendingCheckoutsMap.get(orderId);
  if (pending) return pending;
  try {
    const existing: any[] = (await fetchResource('pending_checkouts')) || [];
    const found = existing.find((p: any) => String(p.orderId) === String(orderId));
    if (found) {
      pendingCheckoutsMap.set(orderId, found);
      return found;
    }
  } catch (err) {
    console.warn('[Worldpay] Failed to load pending checkout from resource:', err);
  }
  return undefined;
}

// Helper to save a verified successful order directly into Prisma and StoreResource
async function saveVerifiedOrder(
  orderId: string,
  details: {
    transactionId: string;
    authCode?: string;
    cardBrand?: string;
    cardLast4?: string;
    paymentMethod?: string;
    webhookEventId?: string;
    /** Raw Worldpay response, used to recover the stored-credential references. */
    gatewayResponse?: any;
    schemeReference?: string | null;
    pendingData?: PendingCheckout;
    customerName?: string;
    customerEmail?: string;
    destination?: string;
    items?: any[];
    total?: number;
    subtotal?: number;
    shippingCost?: number;
    deliveryCost?: number;
    deliveryMethod?: string;
    discountApplied?: any;
    discountAmount?: number;
    storeCreditApplied?: number;
    /**
     * Whether Worldpay confirmed the money was taken. False when the shopper
     * returned but the gateway has not published an authorised payment yet:
     * the order is then recorded as Pending rather than invented as Paid.
     */
    paymentConfirmed?: boolean;
    /**
     * Whether this caller is allowed to CREATE an order that does not exist.
     *
     * False for webhooks. A webhook identifies a payment by Worldpay's
     * transactionReference, and for a recurring charge that reference is a
     * gateway reference (SUB-ORD-…), not a storefront order id. Treating it as
     * one fabricated a £0 order under "customer@pouch-supply.com", emailed the
     * customer and the admin, and fired a Klaviyo purchase event — while the
     * real renewal order sat alongside it carrying that reference in its
     * worldpayTxId. Orders are created by checkout and by the renewal cron,
     * which know the customer and the basket; a webhook only ever updates one.
     */
    allowCreate?: boolean;
  }
) {
  const pending = details.pendingData || await getPendingCheckout(orderId);
  const { saveSingleOrder } = await import('./orders');

  /**
   * Repairing an order that was recorded as Paid without the subscription it
   * was supposed to create. The order itself is left alone; only the missing
   * subscription is built.
   */
  let repairMissingSubscription = false;
  let existingPaidOrder: any = null;
  /** The order this payment belongs to, however it was identified. */
  let matchedOrder: any = null;

  /**
   * An order is the same payment if its id matches, OR if it already records
   * this reference as its gateway transaction.
   *
   * Matching on id alone is what let the phantom order through: a renewal
   * stores its reference in worldpayTxId and gets a fresh PS id, so the
   * webhook's reference matched nothing and a new order was invented.
   */
  const matchesPayment = (order: any, reference: string): boolean => {
    if (!order) return false;
    const ref = String(reference || '').trim();
    if (!ref) return false;
    return (
      String(order.id) === ref ||
      String(order.worldpayTxId || '').trim() === ref ||
      String(order.gatewayTxId || '').trim() === ref
    );
  };

  const looksLikeSubscriptionOrder = (order: any, candidateItems: any[]): boolean => {
    if (!order && !candidateItems?.length) return false;
    if (order?.isSubscription) return true;
    if (Array.isArray(order?.tags) && order.tags.some((t: any) => /subscription/i.test(String(t)))) return true;
    if (order?.subscriptionDetails) return true;
    const all = [...(Array.isArray(order?.items) ? order.items : []), ...(candidateItems || [])];
    return all.some(
      (it: any) =>
        it?.isSubscription ||
        (typeof it?.productId === 'string' && it.productId.includes('sub-pack'))
    );
  };

  // The shopper's browser return (/callback) and the client-side
  // /verify-payment call both land here for the same payment. Without this
  // guard the second one creates a SECOND subscription for the same order —
  // with its own id and schedule — so the customer gets billed twice per cycle.
  try {
    const existingOrders: any[] = (await fetchResource('orders')) || [];
    const already = existingOrders.find((o: any) => matchesPayment(o, orderId));
    matchedOrder = already || null;

    if (already && already.paymentStatus === 'Paid') {
      // Everything below keys off the order that was actually matched, not off
      // the incoming reference: when a renewal webhook matches by worldpayTxId,
      // the reference is a gateway reference and belongs to no order at all.
      const matchedId = String(already.id);
      const existingSubs: any[] = (await fetchResource('subscriptions')) || [];
      // The link must resolve to a subscription that EXISTS. An order can carry
      // a subscriptionId pointing at a deleted row — this database has no
      // foreign keys, so nothing cleans those up — and trusting the id alone
      // would report the plan as present and skip the repair that creates it.
      const hasSubscription = existingSubs.some(
        (s: any) =>
          String(s?.sourceOrderId || '') === matchedId ||
          (already.subscriptionId && String(s?.id) === String(already.subscriptionId))
      );
      // A RENEWAL order is a charge against a plan that already exists, not a
      // plan being bought. It is tagged "Worldpay Recurring" by both renewal
      // paths, and it is also the case where the reference is a gateway
      // reference rather than the order's own id. Repairing one would create a
      // SECOND subscription for a customer who already has theirs — the exact
      // duplicate-billing shape this guard exists to prevent.
      const isRenewalOrder =
        (Array.isArray(already.tags) && already.tags.some((t: any) => /worldpay recurring/i.test(String(t)))) ||
        matchedId !== String(orderId);

      const wantsSubscription =
        !isRenewalOrder && looksLikeSubscriptionOrder(already, details.items || pending?.items || []);

      if (hasSubscription || !wantsSubscription) {
        console.log(
          `[Worldpay Order] ${matchedId} is already recorded as Paid` +
            (matchedId === String(orderId) ? '' : ` (matched from gateway reference ${orderId})`) +
            ' — skipping duplicate creation.'
        );
        // The order is done, but this callback may be the one carrying the stored
        // credential the subscription still needs.
        await backfillSubscriptionCredential(matchedId, details.gatewayResponse);
        return already;
      }

      // A paid subscription order with no subscription. This used to return
      // here like any other duplicate, which permanently locked in the broken
      // state: every later callback, webhook and reconcile hit the same guard,
      // and backfillSubscriptionCredential only UPDATES a subscription, so
      // nothing could ever create the missing one. The money was taken, the
      // plan was sold, and nothing was ever going to charge it again.
      console.error(
        `[Worldpay Order] REPAIRING ${orderId}: it is recorded as Paid and is a subscription order, ` +
          `but no subscription exists for it. Creating the missing subscription now; the order itself ` +
          `is left untouched.`
      );
      repairMissingSubscription = true;
      existingPaidOrder = already;
    }
  } catch (_e) {}

  try {
    const existingSubs: any[] = (await fetchResource('subscriptions')) || [];
    const dupeSub = existingSubs.find((s: any) => String(s.sourceOrderId || '') === String(orderId));
    if (dupeSub) {
      console.log(
        `[Worldpay Order] A subscription (${dupeSub.id}) already exists for order ${orderId} — not creating another.`
      );
      await backfillSubscriptionCredential(String(orderId), details.gatewayResponse);
      return (await fetchResource('orders')).find((o: any) => String(o.id) === String(orderId)) || null;
    }
  } catch (_e) {}

  // A caller that may not create has nothing left to do: the payment belongs to
  // an order this system does not have, so the only honest outcome is to record
  // that and stop. Falling through would invent one from the defaults below.
  if (details.allowCreate === false && !matchedOrder) {
    console.warn(
      `[Worldpay Order] No order matches gateway reference "${orderId}" (checked id, worldpayTxId and ` +
        `gatewayTxId). Not creating one — a webhook never authors an order. If a payment was taken for ` +
        `an order this store does not have, that is a reconciliation problem, not a missing row.`
    );
    return null;
  }

  const customerName = pending?.customerName || details.customerName || 'Valued Customer';
  const rawEmail = pending?.customerEmail || details.customerEmail || 'customer@pouch-supply.com';
  const customerEmail = String(rawEmail).toLowerCase().trim();
  const destination = pending?.destination || details.destination || 'United Kingdom';
  // The order row carries the basket even when the pending checkout is long
  // gone, which is what makes a repair possible at all: a webhook arriving
  // after the pending record expired has no items of its own, and that is how
  // an order gets written with no subscription in the first place.
  const items =
    pending?.items && pending.items.length > 0
      ? pending.items
      : details.items && details.items.length > 0
        ? details.items
        : Array.isArray(existingPaidOrder?.items)
          ? existingPaidOrder.items
          : [];
  const total = typeof pending?.total === 'number' ? pending.total : (typeof details.total === 'number' ? details.total : (parseFloat(pending?.total as any) || parseFloat(details.total as any) || 0));
  const storeCreditApplied = pending?.storeCreditApplied || details.storeCreditApplied || 0;
  const discountApplied = pending?.discountApplied || details.discountApplied || null;

  // Calculate items subtotal
  const subItemsList = items.filter(isSubscriptionLine);
  const subItem = subItemsList[0];
  const subItemsTotal = subscriptionLinesTotal(items);

  // Extract shipping charges from the first order to ensure it remains in all auto recurring subscription payments
  const effectiveShipping = typeof pending?.shippingCost === 'number'
    ? pending.shippingCost
    : (typeof pending?.deliveryCost === 'number'
        ? pending.deliveryCost
        : (typeof details.shippingCost === 'number'
            ? details.shippingCost
            : (typeof details.deliveryCost === 'number'
                ? details.deliveryCost
                : (total > subItemsTotal && subItemsTotal > 0
                    ? Number((total - subItemsTotal).toFixed(2))
                    // A free-delivery reward waives the charge whatever the
                    // order value, so the guess has to look at the discount too.
                    : resolveDeliveryCost(total, discountApplied)))));

  const deliveryMethod = pending?.deliveryMethod || details.deliveryMethod || 'Royal Mail Tracked 24/48';

  // Defaults to true so the webhook and the explicit verify-payment call — both
  // of which only run on a payment Worldpay has already confirmed — behave as
  // before. Only the shopper-return callback passes false.
  const paymentConfirmed = details.paymentConfirmed !== false;
  let createdSubscriptionId: string | undefined;

  // A subscription is a promise to charge this card again. Creating one from a
  // payment Worldpay has not confirmed would schedule renewals for money that
  // was never taken, so it waits for the confirmation instead.
  if (subItem && paymentConfirmed) {
    try {
      // The plan's NAME, not the whole checkout line. `productTitle` reads
      // "LITE Plan [Next Day (Test) - 10% OFF] - (77 10.4 mg — Watermelon Ice
      // (Qty:6))", and storing that as the name put the entire string wherever a
      // plan name was shown. The frequency and box are held separately, so the
      // tier is all that belongs here; the full line stays on the order item.
      const rawPlanTitle = subItem.subscriptionPlan || subItem.productTitle || subItem.title || '';
      const planTier = String(rawPlanTitle).toLowerCase().split(/\s+-\s+|\[|\(/)[0]
        .match(/\b(ultimate|core|lite|pro)\b/)?.[1];
      const planName = planTier
        ? `${planTier.toUpperCase()} Plan`
        : (rawPlanTitle || 'Pouch Supply Subscription');
      const planId = subItem.productId || 'sub-pack-core';
      const rawFrequency = (
        subItem.subscriptionFrequency ||
        subItem.frequency ||
        subItem.billingInterval ||
        pending?.items?.find((i: any) => i.isSubscription)?.subscriptionFrequency ||
        'month'
      ).toString();

      // Single shared normaliser. The old inline ladder matched `includes('day')`
      // first, so "14 days"/"7 days"/"30 days" all became daily billing, and
      // `includes('1')` turned "1 Month" into a daily plan too.
      const billingInterval = normalizeBillingInterval(rawFrequency);
      const nextBillingDate = calculateNextBillingDate(billingInterval, new Date());

      // Stored-credential references may ONLY come from Worldpay. Earlier builds
      // manufactured them from the order id, which produced a URL that resolves
      // to nothing — every recurring charge then failed and was masked by a
      // simulated "authorized" response, so subscriptions silently took no money.
      const recurringHref = extractRecurringAuthorizationHref(details.gatewayResponse) || null;
      const schemeReference =
        extractSchemeReference(details.gatewayResponse) ||
        (details.schemeReference && !isPlaceholderCredential(details.schemeReference)
          ? details.schemeReference
          : null);

      let tokenHref =
        extractTokenHref(details.gatewayResponse) ||
        // The tokenCreated webhook can arrive before this order is written. If
        // it did, its token is waiting to be claimed rather than lost.
        (await claimPendingToken(String(orderId), customerEmail)) ||
        null;

      // Neither of those produced a card, so ask Worldpay directly rather than
      // waiting for a webhook that may never come. The payment has completed by
      // the time this runs, so the card is already stored on their side — and
      // the scheme reference from THIS payment is what proves the card we get
      // back belongs to this subscription and not to an earlier one the same
      // shopper made.
      if (!tokenHref && customerEmail) {
        const tokens = await fetchTokensForNamespace(customerEmail);
        const selection = selectTokenForSubscription(tokens, {
          namespace: customerEmail,
          schemeReference
        });
        if (selection.token) {
          tokenHref = selection.token.href;
          console.log(
            `[Worldpay Order] Stored card for order ${orderId} retrieved from the tokens service ` +
              `(${selection.reason}).`
          );
        } else if (selection.ambiguous) {
          console.warn(`[Worldpay Order] No card assigned to order ${orderId}: ${selection.reason}`);
        }
      }

      // Worldpay refused to store the card when this checkout was created, so
      // there is no webhook coming and no token to wait for.
      const tokenisationDowngraded = Boolean((pending as any)?.tokenisationDowngraded);

      if (!tokenHref && tokenisationDowngraded) {
        console.error(
          `[Worldpay Order] Subscription for order ${orderId} was taken as a ONE-OFF payment because ` +
            `Worldpay refused to store the card. No tokenCreated webhook will arrive and this plan ` +
            `cannot renew. Enable customer agreements / tokenisation on the account, then ask this ` +
            `customer to re-subscribe.`
        );
      } else if (!tokenHref) {
        // Expected, and not an error: Worldpay delivers the token on its own
        // tokenCreated webhook, which usually lands after this order is written.
        // recordTokenForSubscription attaches it when it arrives, and the sweep
        // in recoverMissingSubscriptionTokens catches it if that never happens.
        console.log(
          `[Worldpay Order] Subscription for order ${orderId} has no stored card token yet — ` +
            `awaiting the tokenCreated webhook at /api/worldpay/webhook.`
        );
      }

      if (!recurringHref && !schemeReference) {
        console.warn(
          `[Worldpay Order] Subscription for order ${orderId} has no Worldpay stored-credential reference. ` +
            `Recurring renewals cannot be charged until the initial payment returns a scheme transaction reference ` +
            `(the Hosted Payment Page must be created with a customer agreement).`
        );
      }

      // A reward such as "Free Delivery on your next order" waives the charge on
      // THIS order only, so the order keeps the waiver and the plan does not.
      const rewardWaivedDelivery = effectiveShipping === 0 && isFreeShippingReward(discountApplied);

      // The recurring charge is the plan's own price plus its shipping, never
      // the order total — see recurringAmountForNewSubscription, which the
      // backfill script shares so the two cannot drift apart.
      const { amount: subAmount, shipping: recurringShipping } = recurringAmountForNewSubscription({
        subItemsTotal,
        orderShipping: effectiveShipping,
        orderTotal: total,
        discountAmount: pending?.discountAmount ?? details.discountAmount,
        storeCreditApplied,
        rewardWaivedDelivery
      });

      // The lines the plan renews with. A reward's £0 lines — the free can the
      // customer picked, a gift box — are part of the coupon, not of the plan,
      // and `buildRenewalOrderItems` replays whatever is stored here on every
      // renewal. Leaving them in shipped the reward free, forever.
      const recurringItems = items.filter((it: any) => !it?.isRewardItem);

      const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      createdSubscriptionId = subId;

      const subData = {
        id: subId,
        // Links the subscription back to the order that created it so a repeated
        // callback for the same payment can be recognised as a duplicate.
        sourceOrderId: String(orderId),
        customerId: customerEmail,
        customerEmail,
        customerName,
        planId,
        planName,
        amount: subAmount, // Total recurring charge (includes shipping fee)
        itemPrice: subItemsTotal || Number(subItem.price) || subAmount,
        shippingCost: recurringShipping,
        shippingFee: recurringShipping,
        shippingAmount: recurringShipping,
        deliveryCost: recurringShipping,
        shippingAddress: destination,
        deliveryMethod,
        currency: 'GBP',
        status: 'active',
        billingInterval,
        nextBillingDate,
        worldpayTransactionId: details.transactionId || orderId,
        worldpayTokenHref: tokenHref,
        // Truthful state for a plan that can never charge again, so it is not
        // left indistinguishable from one that is simply waiting for its webhook.
        tokenisationDowngraded: tokenisationDowngraded && !tokenHref,
        worldpayRecurringHref: recurringHref,
        worldpaySchemeReference: schemeReference,
        lastPaymentStatus: 'authorized',
        lastPaymentId: details.transactionId || orderId,
        lastPaymentAt: new Date(),
        items: recurringItems
      };

      // Schema-checked write - see src/lib/subscriptionRow.ts. This used to be
      // prisma.subscription.create(subData) inside an empty catch: subData carries
      // shippingFee/shippingAmount/deliveryCost, which are not columns, and a
      // customerId holding an email, so every create threw and was discarded in
      // silence. The subscription then existed only as a JSON blob.
      {
        const { upsertSubscriptionRow } = await import('../../src/lib/subscriptionRow');
        const stored = await upsertSubscriptionRow(subData);
        if (!stored) {
          console.error(
            `[SUBSCRIPTION NOT PERSISTED] ${subId} for order ${orderId} is not in the Neon ` +
              'Subscription table. Recover it from the payload below.',
            JSON.stringify(subData)
          );
        }
      }

      try {
        const storedSubs: any[] = (await fetchResource('subscriptions')) || [];
        // The typed row was written a moment ago, so this read already contains
        // the new subscription — as a copy mapped from the typed table, which
        // is missing fields the full subData carries. Adding subData on top used
        // to put the same id in the list TWICE, and saveResource wrote both in
        // one parallel batch onto the same StoreResource row. Whichever write
        // landed last won; when it was the stripped copy, the subscription lost
        // its sourceOrderId and no lookup by order could ever find it again.
        const withoutThis = storedSubs.filter((existing: any) => String(existing?.id) !== String(subId));
        withoutThis.unshift(subData);
        await saveResource('subscriptions', withoutThis.slice(0, 500));
      } catch (storeErr: any) {
        // This was an empty catch. If it fails, the subscription exists in no
        // store at all while the order is recorded as Paid — the customer has
        // bought a plan that nothing will ever charge. Silence here is how that
        // state gets created without anybody noticing.
        console.error(
          `[SUBSCRIPTION NOT SAVED] ${subId} for order ${orderId} could not be written to the ` +
            `subscriptions store: ${storeErr?.message}. The repair sweep will rebuild it from the ` +
            `order. Payload: ${JSON.stringify(subData)}`
        );
      }

      // Update customer subscription status in database
      try {
        const customers: any[] = (await fetchResource('customers')) || [];
        const foundCust = customers.find((c: any) => String(c.email).toLowerCase().trim() === customerEmail);
        if (foundCust) {
          foundCust.subscriptionStatus = 'Active Subscriber';
          foundCust.subStatus = 'active';
          foundCust.subPlan = planName;
          foundCust.subPrice = subAmount;
          foundCust.nextPayment = nextBillingDate.toISOString().split('T')[0];
          await saveResource('customers', customers);
        }
      } catch (_e) {}

      // Give the "Subscription confirmation" flow its trigger. Fired after the
      // plan is persisted so the flow never confirms a subscription that failed
      // to save, and not awaited so Klaviyo cannot delay the order.
      trackSubscriptionStarted(subData, { id: orderId, customerEmail, customerName })
        .catch((e: any) => console.warn(`[Klaviyo] Started Subscription failed for ${subId}:`, e?.message || e));
    } catch (subErr: any) {
      // Logged as an error, with the order it belongs to. This is the exact
      // failure that leaves a paid order without its plan, so it has to be
      // findable by order id rather than being one anonymous warning among
      // thousands. The order still saves below; the repair sweep picks it up.
      console.error(
        `[SUBSCRIPTION CREATION FAILED] Order ${orderId} is paid but its subscription could not ` +
          `be created: ${subErr?.message || subErr}`,
        subErr?.stack || ""
      );
    }
  }

  const tags = ['Storefront', pending?.isTestMode ? 'Worldpay Test Order' : 'Worldpay Live Order'];
  if (subItem) {
    tags.push('Subscription Order');
  }

  const calculatedSubtotal = typeof pending?.subtotal === 'number'
    ? pending.subtotal
    : (total > effectiveShipping ? Number((total - effectiveShipping).toFixed(2)) : total);

  const formattedOrder = {
    id: orderId,
    orderId: orderId,
    customerName,
    customerEmail,
    destination,
    // The separate address fields ride along with the order so Royal Mail can
    // read the town and postcode directly.
    shippingAddress: pending?.shippingAddress || (details as any).shippingAddress || null,
    // Kept at the top level too: createRoyalMailShipment reads either
    // shippingAddress.phone or customerPhone when building the label.
    customerPhone: pending?.customerPhone || (details as any).customerPhone || pending?.shippingAddress?.phone || null,
    items,
    total,
    subtotal: calculatedSubtotal,
    shippingCost: effectiveShipping,
    deliveryCost: effectiveShipping,
    storeCreditApplied,
    discountApplied,
    discountAmount: typeof pending?.discountAmount === 'number'
      ? pending.discountAmount
      : (typeof (details as any).discountAmount === 'number' ? (details as any).discountAmount : undefined),
    // Never invented. "status=SUCCESS" in the return URL is the browser's claim;
    // only a payment Worldpay reports as authorised makes this Paid. An
    // unconfirmed order stays Pending and is completed by the webhook, or by the
    // status poll the checkout page is already running.
    paymentStatus: paymentConfirmed ? 'Paid' : 'Pending',
    fulfillmentStatus: 'Unfulfilled',
    worldpayTxId: details.transactionId,
    worldpayAuthCode: details.authCode || 'AUTH-OK',
    gatewayTxId: details.transactionId,
    gatewayAuthCode: details.authCode || 'AUTH-OK',
    cardBrand: details.cardBrand || 'Worldpay Card',
    deliveryMethod,
    carrier: 'Royal Mail',
    tags,
    subscriptionId: createdSubscriptionId,
    isSubscription: Boolean(subItem),
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: new Date().toISOString(),
    data: {
      cardLast4: details.cardLast4,
      paymentMethod: details.paymentMethod || 'Worldpay Access',
      webhookEventId: details.webhookEventId,
      isTestMode: pending?.isTestMode ?? false,
      subscriptionId: createdSubscriptionId,
      shippingCost: effectiveShipping,
      deliveryCost: effectiveShipping,
      subtotal: calculatedSubtotal
    }
  };

  // Store credit used on this order is spent here, on the server, once the
  // payment for the remainder is confirmed. It used to be deducted by the
  // browser rewriting the customer record, which a shopper could skip (or
  // reverse). The decrement is conditional and atomic, and the order records
  // that it happened so a repeated callback cannot spend the credit twice.
  const creditToSpend = Math.round((Number(storeCreditApplied) || 0) * 100) / 100;
  if (
    !repairMissingSubscription &&
    paymentConfirmed &&
    creditToSpend > 0 &&
    !(matchedOrder?.data?.storeCreditDeducted)
  ) {
    try {
      const spent = await prisma.customer.updateMany({
        where: { email: customerEmail, storeCredit: { gte: creditToSpend } },
        data: { storeCredit: { decrement: creditToSpend } }
      });
      (formattedOrder.data as any).storeCreditDeducted = spent.count === 1;
      if (spent.count !== 1) {
        formattedOrder.tags.push('Review: store credit shortfall');
        console.error(
          `[Worldpay Order] ${orderId}: £${creditToSpend} store credit was applied at checkout but ${customerEmail} ` +
            `no longer has that balance. The card payment was taken for the remainder only — review this order.`
        );
      }
    } catch (creditErr: any) {
      formattedOrder.tags.push('Review: store credit not deducted');
      console.error(`[Worldpay Order] ${orderId}: store credit deduction failed:`, creditErr?.message || creditErr);
    }
  }

  // In repair mode the order is already correct and already Paid; rewriting it
  // would re-run its side effects (confirmation email, fulfilment hooks) for a
  // sale the customer completed long ago. The subscription created above points
  // back with sourceOrderId, which is the link every lookup actually uses.
  const savedOrder = repairMissingSubscription
    ? existingPaidOrder
    : await saveSingleOrder(formattedOrder);

  // Clear pending memory store
  pendingCheckoutsMap.delete(orderId);

  // Auto-create a Royal Mail Click & Drop shipment only when the store has
  // explicitly opted in. Registering a shipment here marks the order Shipped
  // immediately, so the dispatch email went out seconds after the order
  // confirmation for an order nobody had packed yet.
  try {
    const { getRoyalMailSettings, createRoyalMailShipment } = await import('../services/royalMailService');
    const rmSettings = await getRoyalMailSettings();
    const hasKey = Boolean(rmSettings.apiKey || process.env.ROYAL_MAIL_API_KEY || process.env.RM_API_KEY);
    if (rmSettings.enabled && rmSettings.autoCreateShipmentOnPayment && hasKey) {
      console.log(`[Worldpay Order] Auto-registering Click & Drop shipment with Royal Mail for order #${orderId}`);
      createRoyalMailShipment(orderId, {
        serviceCode: rmSettings.defaultServiceCode,
        weightGrams: rmSettings.defaultWeightGrams || 70
      }).catch(err => {
        console.warn(`[Worldpay Order] Background Royal Mail shipment creation note for #${orderId}:`, err?.message);
      });
    }
  } catch (_rmErr) {}

  return savedOrder;
}

// GET /api/worldpay/config - Returns mode and configuration status
/**
 * Reconcile orders that Worldpay confirmed after we stopped listening.
 *
 * Worldpay publishes a payment a moment after the shopper's browser returns. If
 * the callback ran before that, `paymentOutcome` answered "unknown", the order
 * was recorded as Pending, and — because a subscription is only created from a
 * CONFIRMED payment — no subscription was created either. Nothing re-checked
 * afterwards, so the order stayed Pending for good while the money had in fact
 * been taken.
 *
 * This re-asks Worldpay about every Pending order and, where the payment is
 * authorised, runs it back through `saveVerifiedOrder` — the same funnel the
 * callback uses. That path already refuses to act twice: an order that is
 * already Paid, or that already has a subscription, is skipped rather than
 * duplicated, so this is safe to run on a schedule and safe to run twice.
 */
export async function reconcilePendingWorldpayOrders(limit = 50) {
  const orders: any[] = (await fetchResource('orders')) || [];
  const pendingOrders = orders
    .filter((o: any) => o && String(o.paymentStatus || '').toLowerCase() === 'pending')
    .slice(0, limit);

  const results: Array<{ orderId: string; status: string; detail?: string }> = [];

  for (const order of pendingOrders) {
    const orderId = String(order.id);
    try {
      const payment = await fetchWorldpayPaymentDetails(orderId);
      const outcome = paymentOutcome(payment);

      if (outcome === 'failed') {
        results.push({ orderId, status: 'failed', detail: String(payment?.lastEvent || 'refused') });
        continue;
      }
      if (outcome !== 'authorised') {
        results.push({ orderId, status: 'still-unconfirmed', detail: String(payment?.lastEvent || 'no payment published') });
        continue;
      }

      const card = payment?.paymentInstrument?.card;
      await saveVerifiedOrder(orderId, {
        transactionId: String(payment?.paymentId || order.worldpayTxId || orderId),
        authCode: payment?.issuer?.authorizationCode || undefined,
        cardBrand: card?.brand || undefined,
        cardLast4: card?.number?.last4Digits || undefined,
        // The payment query response is what carries scheme.reference, which is
        // the stored credential the renewal needs.
        gatewayResponse: payment,
        paymentConfirmed: true,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        destination: order.destination,
        items: order.items,
        total: typeof order.total === 'number' ? order.total : undefined,
        deliveryMethod: order.deliveryMethod
      });

      results.push({ orderId, status: 'reconciled', detail: String(payment?.transactionType || '') });
    } catch (err: any) {
      results.push({ orderId, status: 'error', detail: err?.message });
    }
  }

  return results;
}

const handleReconcilePending = async (_req: Request, res: Response) => {
  try {
    const results = await reconcilePendingWorldpayOrders();
    const reconciled = results.filter(r => r.status === 'reconciled').length;

    // Same 15-minute cron, because the two failures travel together: an order
    // that needed reconciling is an order whose webhooks did not land, and the
    // token rides on the same webhook delivery. A subscription left without a
    // card is repaired here rather than at its first failed renewal.
    // Order first, token second: a subscription that does not exist yet cannot
    // be given a card, so repairing it before the token sweep means both can
    // complete in the same pass instead of needing two.
    const repairResults = await repairOrdersMissingSubscriptions().catch((err: any) => {
      console.error('[Worldpay Subscription Repair] Failed during reconcile:', err?.message);
      return [] as Awaited<ReturnType<typeof repairOrdersMissingSubscriptions>>;
    });
    const subsRepaired = repairResults.filter(r => r.status === 'repaired').length;

    const tokenResults = await recoverMissingSubscriptionTokens().catch((err: any) => {
      console.error('[Worldpay Token Sweep] Sweep failed during reconcile:', err?.message);
      return [] as Awaited<ReturnType<typeof recoverMissingSubscriptionTokens>>;
    });
    const tokensRecovered = tokenResults.filter(r => r.status === 'recovered').length;

    return res.json({
      success: true,
      message:
        `Checked ${results.length} pending order(s); ${reconciled} reconciled. ` +
        `Repaired ${subsRepaired} paid order(s) that had no subscription. ` +
        `Checked ${tokenResults.length} subscription(s) with no stored card; ${tokensRecovered} recovered.`,
      results,
      subscriptionRepair: repairResults,
      tokenRecovery: tokenResults
    });
  } catch (err: any) {
    console.error('[Worldpay Reconcile] Failed:', err);
    return res.status(500).json({ success: false, error: err?.message });
  }
};

/**
 * Fills in stored-card tokens for subscriptions that never received one.
 *
 * The tokenCreated webhook is a single point of failure: it is a separate
 * delivery from the payment, it has to be subscribed on the Worldpay account,
 * and it has to reach an endpoint that understands it. Until now, if any of
 * that failed the token was simply never captured and the subscription was
 * broken permanently and silently — which is what happened to PS25640, whose
 * webhook was rejected by an older handler and never retried.
 *
 * Worldpay also publishes the token link on the payment itself, so the webhook
 * is not the only source. This re-reads the original payment for any live
 * subscription still missing a card and captures the token from there. It runs
 * on the existing 15-minute reconcile cron, so a webhook that is missed, late,
 * or never subscribed costs a delay rather than the subscription.
 *
 * Read-only against Worldpay: it queries a payment that already happened and
 * takes no new one.
 */
const TOKEN_SWEEP_LIMIT = 25;

/**
 * How many times one subscription is asked about before the sweep leaves it
 * alone. At the 15-minute reconcile cadence this spans a little over an hour,
 * which is far longer than a webhook that is merely late.
 */
const TOKEN_SWEEP_MAX_ATTEMPTS = 5;

/** Statuses that still bill, so a missing card is worth chasing. */
const LIVE_SUB_STATUSES_FOR_SWEEP = ['active', 'subscribed', 'paused', 'trialing'];

export async function recoverMissingSubscriptionTokens(limit = TOKEN_SWEEP_LIMIT) {
  const results: Array<{ id: string; reference: string; status: string; detail?: string }> = [];

  let subs: any[] = [];
  try {
    subs = (await fetchResource('subscriptions')) || [];
  } catch (err: any) {
    console.warn('[Worldpay Token Sweep] Could not read subscriptions:', err?.message);
    return results;
  }

  const needsToken = subs.filter((sub: any) => {
    if (!sub) return false;
    if (!LIVE_SUB_STATUSES_FOR_SWEEP.includes(String(sub.status || '').toLowerCase())) return false;
    if (isUsableTokenHref(sub.worldpayTokenHref)) return false;
    // Worldpay refused to store this card at checkout. There is no token to find.
    if (sub.tokenisationDowngraded) return false;
    // Asked enough times already. This is deliberately a budget of attempts
    // rather than a single "the payment had no token, so give up": it is not
    // established that a payment query exposes a token link at all on this
    // account, so one empty answer is not proof that no token exists. Spreading
    // the attempts means a token that only becomes visible later is still
    // caught, while a genuinely dead subscription stops being asked about.
    if (Number(sub.tokenLookupAttempts || 0) >= TOKEN_SWEEP_MAX_ATTEMPTS) return false;
    return true;
  });

  if (needsToken.length === 0) return results;

  console.log(
    `[Worldpay Token Sweep] ${needsToken.length} live subscription(s) have no stored card. ` +
      `Re-reading their original payments for a token.`
  );

  let changed = false;
  const patched = new Map<string, { tokenHref: string; schemeReference?: string | null }>();
  const attempted = new Map<string, number>();

  for (const sub of needsToken.slice(0, limit)) {
    const reference = String(sub.sourceOrderId || sub.worldpayTransactionId || sub.lastPaymentId || '').trim();
    const id = String(sub.id);
    const email = String(sub.customerEmail || '').trim().toLowerCase();

    // The tokens service first. It is the authoritative record of what Worldpay
    // is holding, it does not depend on a webhook having been delivered, and it
    // carries the scheme transaction reference needed to prove the card belongs
    // to THIS subscription. The payment query below is kept as a fallback
    // because it is the only route when a subscription has no email on it.
    if (email) {
      const tokens = await fetchTokensForNamespace(email);
      const selection = selectTokenForSubscription(tokens, {
        namespace: email,
        schemeReference: sub.worldpaySchemeReference
      });

      if (selection.token) {
        patched.set(id, {
          tokenHref: selection.token.href,
          schemeReference: sub.worldpaySchemeReference || selection.token.schemeTransactionReference
        });
        changed = true;
        results.push({ id, reference, status: 'recovered', detail: `tokens service — ${selection.reason}` });
        console.log(
          `[Worldpay Token Sweep] Recovered the stored card for subscription ${id} from the tokens ` +
            `service (${selection.reason}).`
        );
        continue;
      }

      if (selection.ambiguous) {
        // Worldpay has a card for this shopper but it cannot be tied to this
        // plan. Assigning it would be a guess, and the wrong guess charges a
        // card the customer never attached to this subscription. Counted as an
        // attempt so it stops re-asking, and reported loudly enough to act on.
        const attempts = Number(sub.tokenLookupAttempts || 0) + 1;
        attempted.set(id, attempts);
        changed = true;
        results.push({ id, reference, status: 'ambiguous', detail: selection.reason });
        console.warn(`[Worldpay Token Sweep] Subscription ${id} NOT assigned a card: ${selection.reason}`);
        continue;
      }
    }

    if (!reference) {
      results.push({ id, reference: '', status: 'skipped', detail: 'no payment reference to query' });
      continue;
    }

    const payment = await fetchWorldpayPaymentDetails(reference);
    if (!payment) {
      results.push({ id, reference, status: 'not-found' });
      continue;
    }

    const tokenHref = extractTokenHref(payment);
    if (!tokenHref) {
      // Neither the tokens service nor the payment itself has a card for this
      // subscription. Counted rather than treated as final, because one empty
      // answer is not proof; the budget stops it re-asking forever.
      const attempts = Number(sub.tokenLookupAttempts || 0) + 1;
      attempted.set(id, attempts);
      changed = true;
      results.push({
        id,
        reference,
        status: 'no-token',
        detail: `no stored card found by namespace or payment (attempt ${attempts}/${TOKEN_SWEEP_MAX_ATTEMPTS})`
      });
      if (attempts >= TOKEN_SWEEP_MAX_ATTEMPTS) {
        console.warn(
          `[Worldpay Token Sweep] Subscription ${id} (payment ${reference}) still has no stored card ` +
            `after ${attempts} lookups, by namespace and by payment. It cannot renew — the customer ` +
            `has to subscribe again.`
        );
      }
      continue;
    }

    patched.set(id, { tokenHref, schemeReference: extractSchemeReference(payment) });
    changed = true;
    results.push({ id, reference, status: 'recovered', detail: 'payment query' });
    console.log(`[Worldpay Token Sweep] Recovered the stored card for subscription ${id} from payment ${reference}.`);
  }

  if (!changed) return results;

  try {
    const next = subs.map((sub: any) => {
      const id = String(sub?.id);
      const attempts = attempted.get(id);
      if (attempts !== undefined) {
        return {
          ...sub,
          tokenLookupAttempts: attempts,
          tokenLookupLastAt: new Date().toISOString(),
          ...(attempts >= TOKEN_SWEEP_MAX_ATTEMPTS ? { tokenLookupExhaustedAt: new Date().toISOString() } : {})
        };
      }
      const found = patched.get(id);
      if (!found) return sub;
      return {
        ...sub,
        worldpayTokenHref: found.tokenHref,
        worldpaySchemeReference: sub.worldpaySchemeReference || found.schemeReference || null,
        tokenRecordedAt: new Date().toISOString()
      };
    });
    await saveResource('subscriptions', next);
  } catch (err: any) {
    console.error('[Worldpay Token Sweep] Failed to save recovered tokens:', err?.message);
    return results;
  }

  // The typed Neon row is written by saveResource above through
  // upsertSubscriptionRow; this makes the column write explicit and survives a
  // partial sync.
  for (const [id, found] of patched) {
    await prisma.subscription
      .update({ where: { id }, data: { worldpayTokenHref: found.tokenHref } })
      .catch(() => {});
  }

  return results;
}


// Scheduled reconciliation (vercel.json cron). Was reachable by anyone over GET.
router.get('/reconcile-pending', requireCronOrAdmin, handleReconcilePending);
router.post('/reconcile-pending', requireCronOrAdmin, handleReconcilePending);

const SUBSCRIPTION_REPAIR_LIMIT = 10;

type RepairResult = {
  orderId: string;
  status: string;
  detail?: string;
  /** What the typed Subscription table — the one the renewal cron bills from — holds for this order. */
  billableRows?: Array<{
    id: string;
    status: string;
    createdAt: string;
    billingInterval: string | null;
    nextBillingDate: string | null;
    scheme: string | null;
    hasCard: boolean;
  }>;
};

/**
 * What the renewal cron would actually bill for one order.
 *
 * Deliberately read from the typed table and not through fetchResource: the
 * cron reads this table directly, and fetchResource used to drop sourceOrderId
 * from these rows, so a subscription could be billable and still invisible to
 * every lookup by order — including this sweep's own duplicate guard.
 */
async function billableSubscriptionsFor(orderId: string) {
  // With no database there is no second table to disagree with the store: the
  // store IS what the renewal cron falls back to, so it is the authority.
  if (!(await getDb())) {
    const stored: any[] = (await fetchResource('subscriptions')) || [];
    return stored
      .filter((s: any) => String(s?.sourceOrderId || '') === orderId)
      .map((s: any) => ({
        id: String(s.id),
        status: String(s.status || ''),
        createdAt: String(s.createdAt || ''),
        billingInterval: s.billingInterval || null,
        nextBillingDate: s.nextBillingDate ? new Date(s.nextBillingDate).toISOString() : null,
        scheme: s.worldpaySchemeReference || null,
        hasCard: isUsableTokenHref(s.worldpayTokenHref)
      }));
  }

  const rows = await prisma.subscription.findMany({
    where: { sourceOrderId: orderId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      billingInterval: true,
      nextBillingDate: true,
      worldpaySchemeReference: true,
      worldpayTokenHref: true
    },
    orderBy: { createdAt: 'asc' }
  });
  return rows.map(r => ({
    id: r.id,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    billingInterval: r.billingInterval || null,
    nextBillingDate: r.nextBillingDate ? r.nextBillingDate.toISOString() : null,
    scheme: r.worldpaySchemeReference || null,
    hasCard: isUsableTokenHref(r.worldpayTokenHref)
  }));
}

/**
 * Creates the subscriptions that paid subscription orders should have had.
 *
 * A paid order with no subscription is the worst state this system can reach:
 * the customer has been charged for a plan, believes they are subscribed, and
 * nothing exists that will ever bill or fulfil it again. It is also invisible —
 * the order looks perfectly normal.
 *
 * The typed Subscription table is checked FIRST and is the only thing trusted to
 * say whether a subscription exists. An earlier version trusted fetchResource,
 * which could not see a subscription whose StoreResource copy had lost its
 * sourceOrderId; it then reported "created no subscription" while having
 * created one, and a second run would create another. Against a table the
 * renewal cron bills from, that is how a customer gets charged twice.
 *
 * So this never creates a subscription for an order that already has one, never
 * touches duplicates it finds (a human decides which to keep), and in dry-run
 * mode writes nothing at all. No token is attached here — that stays
 * selectTokenForSubscription's job, and it requires the agreement to match.
 */
export async function repairOrdersMissingSubscriptions(
  limit = SUBSCRIPTION_REPAIR_LIMIT,
  options: { dryRun?: boolean; orderIds?: string[] } = {}
) {
  const dryRun = Boolean(options.dryRun);
  const requested = (options.orderIds || []).map(id => String(id).trim()).filter(Boolean);
  const results: RepairResult[] = [];

  let orders: any[] = [];
  let subs: any[] = [];
  try {
    orders = (await fetchResource('orders')) || [];
    subs = (await fetchResource('subscriptions')) || [];
  } catch (err: any) {
    console.warn('[Worldpay Subscription Repair] Could not read orders/subscriptions:', err?.message);
    return results;
  }

  const visibleByOrder = new Set(subs.map((s: any) => String(s?.sourceOrderId || '')).filter(Boolean));

  const isSubscriptionOrder = (order: any): boolean => {
    if (order?.isSubscription) return true;
    if (Array.isArray(order?.tags) && order.tags.some((t: any) => /subscription/i.test(String(t)))) return true;
    if (order?.subscriptionDetails) return true;
    return (Array.isArray(order?.items) ? order.items : []).some(isSubscriptionLine);
  };

  const isRenewalOrder = (order: any): boolean =>
    Array.isArray(order?.tags) && order.tags.some((t: any) => /recurring/i.test(String(t)));

  /**
   * The customer ended this plan. "No subscription" is the CORRECT state for it,
   * not damage to repair — recreating one resurrects a cancelled agreement as an
   * active plan and bills someone who deliberately stopped.
   *
   * This is reachable whenever the cancelled subscription row is gone while the
   * order remains: the cancelled row is what records the intent, so deleting it
   * makes a deliberately-ended plan look like a broken one.
   */
  const isCancelledSubscriptionOrder = (order: any): boolean => {
    if (Array.isArray(order?.tags) && order.tags.some((t: any) => /cancel/i.test(String(t)))) return true;
    const status = String(order?.subscriptionDetails?.paymentStatus || order?.subscriptionDetails?.status || '');
    return /cancel/i.test(status);
  };

  // Explicitly named orders are always examined, even when they look healthy,
  // so their real state can be reported rather than inferred from a list.
  const candidates = requested.length
    ? requested.map(id => orders.find((o: any) => String(o?.id) === id) || { id, __missing: true })
    : orders.filter(
        (o: any) =>
          o &&
          String(o.paymentStatus || '') === 'Paid' &&
          isSubscriptionOrder(o) &&
          !isRenewalOrder(o) &&
          !isCancelledSubscriptionOrder(o) &&
          !visibleByOrder.has(String(o.id))
      );

  if (candidates.length === 0) return results;

  console.log(
    `[Worldpay Subscription Repair] ${dryRun ? 'DRY RUN — ' : ''}examining ${Math.min(candidates.length, limit)} ` +
      `order(s): ${candidates.slice(0, limit).map((o: any) => o.id).join(', ')}`
  );

  for (const order of candidates.slice(0, limit)) {
    const orderId = String(order.id);

    if (order.__missing) {
      results.push({ orderId, status: 'order-not-found' });
      continue;
    }

    // Also enforced here, because an explicitly requested order bypasses the
    // filter above. Recreating a plan the customer ended is worse than leaving
    // the order without one.
    if (isCancelledSubscriptionOrder(order)) {
      results.push({
        orderId,
        status: 'skipped-cancelled',
        detail:
          'This order\'s subscription was cancelled. Having no subscription is the correct state for it, ' +
          'so nothing was created — recreating one would resurrect a cancelled plan and bill the customer.'
      });
      continue;
    }

    let billable: RepairResult['billableRows'] = [];
    try {
      billable = await billableSubscriptionsFor(orderId);
    } catch (err: any) {
      // Without the authoritative answer, creating anything risks a duplicate.
      results.push({ orderId, status: 'error', detail: `could not read the Subscription table: ${err?.message}` });
      continue;
    }

    if (billable.length > 1) {
      // The dangerous case. Every one of these is billable. Nothing is changed:
      // which plan to keep is a decision about a customer's money.
      results.push({
        orderId,
        status: 'DUPLICATES',
        detail:
          `${billable.length} subscriptions exist for this one order, and the renewal cron bills every ` +
          `active one. Cancel all but one before the earliest nextBillingDate. Nothing was changed.`,
        billableRows: billable
      });
      console.error(
        `[Worldpay Subscription Repair] ${orderId} has ${billable.length} subscriptions: ` +
          billable.map(b => `${b.id} (${b.status}, next ${b.nextBillingDate})`).join(', ')
      );
      continue;
    }

    if (billable.length === 1) {
      // It exists; it simply could not be found by order. Heal that instead of
      // creating a second one.
      const detail = visibleByOrder.has(orderId)
        ? 'subscription exists and is visible'
        : 'subscription EXISTS but was invisible to lookups by order (its StoreResource copy had lost sourceOrderId)';

      if (!dryRun && !visibleByOrder.has(orderId)) {
        try {
          // fetchResource now carries sourceOrderId through from the typed row, so
          // re-saving the list writes it back onto the StoreResource copy.
          const fresh: any[] = (await fetchResource('subscriptions')) || [];
          await saveResource('subscriptions', fresh);
        } catch (err: any) {
          results.push({ orderId, status: 'error', detail: `found but could not heal: ${err?.message}`, billableRows: billable });
          continue;
        }
      }

      results.push({
        orderId,
        status: visibleByOrder.has(orderId) ? 'ok' : dryRun ? 'exists-invisible' : 'healed',
        detail,
        billableRows: billable
      });
      continue;
    }

    // No subscription anywhere. This is the only case that creates one.
    const orderItems: any[] = Array.isArray(order.items) ? order.items : [];
    let rebuildItems = orderItems;

    if (!orderItems.some(isSubscriptionLine)) {
      const d: any = order.subscriptionDetails;
      if (!d?.planName) {
        results.push({
          orderId,
          status: 'failed',
          detail:
            'no subscription line and no plan details to rebuild from. items=' +
            JSON.stringify(
              orderItems.map((i: any) => ({ productId: i?.productId, vendor: i?.vendor, isSubscription: i?.isSubscription }))
            ).slice(0, 600)
        });
        continue;
      }

      const shipping = Number(order.shippingCost ?? order.deliveryCost ?? 0) || 0;
      rebuildItems = [
        {
          productId: `sub-pack-recovered-${orderId}`,
          sku: `sub-pack-recovered-${orderId}`,
          productTitle: d.planName,
          subscriptionPlan: d.planName,
          subscriptionFrequency: d.frequency || 'month',
          frequencyDiscount: d.frequencyDiscount || undefined,
          subscriptionItems: Array.isArray(d.items) && d.items.length ? d.items : d.selectedProducts || [],
          vendor: 'Subscription Pack',
          isSubscription: true,
          price: Math.max(Number(order.total || 0) - shipping, 0),
          quantity: 1
        },
        ...orderItems
      ];
    }

    if (dryRun) {
      results.push({
        orderId,
        status: 'would-create',
        detail: `no subscription exists in any store; a repair would create one from ${
          rebuildItems === orderItems ? 'the order items' : 'subscriptionDetails'
        }`,
        billableRows: []
      });
      continue;
    }

    try {
      const payment = await fetchWorldpayPaymentDetails(orderId);

      await saveVerifiedOrder(orderId, {
        transactionId: String(order.worldpayTxId || order.gatewayTxId || orderId),
        authCode: order.worldpayAuthCode || order.gatewayAuthCode || undefined,
        cardBrand: order.cardBrand || undefined,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        destination: order.destination,
        items: rebuildItems,
        total: typeof order.total === 'number' ? order.total : undefined,
        shippingCost: typeof order.shippingCost === 'number' ? order.shippingCost : undefined,
        deliveryCost: typeof order.deliveryCost === 'number' ? order.deliveryCost : undefined,
        deliveryMethod: order.deliveryMethod,
        discountApplied: order.discountApplied,
        gatewayResponse: payment,
        paymentConfirmed: true
      });

      // Judged by the table that gets billed, not by a merged read.
      const after = await billableSubscriptionsFor(orderId);
      if (after.length === 1) {
        results.push({ orderId, status: 'repaired', detail: `subscription ${after[0].id}`, billableRows: after });
      } else if (after.length > 1) {
        results.push({ orderId, status: 'DUPLICATES', detail: 'repair produced more than one subscription', billableRows: after });
      } else {
        results.push({
          orderId,
          status: 'failed',
          detail: 'saveVerifiedOrder ran but no Subscription row exists — see [SUBSCRIPTION CREATION FAILED] / [SUBSCRIPTION NOT PERSISTED] in the logs for this invocation'
        });
      }
    } catch (err: any) {
      results.push({ orderId, status: 'error', detail: err?.message });
    }
  }

  return results;
}

const handleRepairSubscriptions = async (req: Request, res: Response) => {
  try {
    const flag = (v: any) => ['1', 'true', 'yes'].includes(String(v ?? '').toLowerCase());
    const dryRun = flag(req.query?.dryRun) || flag((req.body as any)?.dryRun);
    const rawOrders = String(req.query?.orders ?? (req.body as any)?.orders ?? '');
    const orderIds = rawOrders.split(',').map(s => s.trim()).filter(Boolean);

    const results = await repairOrdersMissingSubscriptions(SUBSCRIPTION_REPAIR_LIMIT, { dryRun, orderIds });
    const count = (status: string) => results.filter(r => r.status === status).length;

    return res.json({
      success: true,
      dryRun,
      message:
        `${dryRun ? 'DRY RUN, nothing written. ' : ''}Examined ${results.length} order(s): ` +
        `${count('repaired')} repaired, ${count('healed')} healed, ${count('exists-invisible')} exist but invisible, ` +
        `${count('would-create')} would be created, ${count('DUPLICATES')} with DUPLICATES, ${count('failed') + count('error')} failed.`,
      results
    });
  } catch (err: any) {
    console.error('[Worldpay Subscription Repair] Failed:', err);
    return res.status(500).json({ success: false, error: err?.message });
  }
};

// POST only. This endpoint can create subscriptions, and a GET is the kind of
// request a crawler, a link preview or a browser prefetch sends unprompted.
router.post('/repair-subscriptions', requireAdmin, handleRepairSubscriptions);

const handleRecoverTokens = async (_req: Request, res: Response) => {
  try {
    const results = await recoverMissingSubscriptionTokens();
    const recovered = results.filter(r => r.status === 'recovered').length;
    return res.json({
      success: true,
      message: `Checked ${results.length} subscription(s) with no stored card; ${recovered} recovered.`,
      results
    });
  } catch (err: any) {
    console.error('[Worldpay Token Sweep] Failed:', err);
    return res.status(500).json({ success: false, error: err?.message });
  }
};

router.get('/recover-tokens', requireAdmin, handleRecoverTokens);
router.post('/recover-tokens', requireAdmin, handleRecoverTokens);

router.get('/config', (_req: Request, res: Response) => {
  const cfg = getEnvironmentConfig();

  res.json({
    active: true,
    isConfigured: Boolean(cfg.entity && cfg.authHeader),
    platform: 'Worldpay Access API',
    environment: cfg.environment,
    isTestMode: cfg.isTestMode,
    baseUrl: cfg.baseUrl,
    entityMasked: cfg.entity ? `${cfg.entity.substring(0, 4)}***` : 'Not Configured',
    checkoutIdMasked: cfg.checkoutId ? `${cfg.checkoutId.substring(0, 6)}***` : 'Not Configured',
    hasBasicAuth: Boolean(cfg.username && cfg.password),
    provider: `Worldpay Access (${cfg.environment.toUpperCase()})`
  });
});

// POST /api/worldpay/session - Initiate Hosted Payment Session
async function handleCreateHostedPaymentPage(req: Request, res: Response) {
  try {
    const {
      orderId,
      amount,
      total: reqTotal,
      subtotal: reqSubtotal,
      shippingCost: reqShippingCost,
      deliveryCost: reqDeliveryCost,
      deliveryMethod: reqDeliveryMethod,
      customerName,
      customerEmail,
      destination,
      shippingAddress,
      address,
      items,
      recurring,
      discountApplied,
      discountAmount: reqDiscountAmount,
      storeCreditApplied,
      origin: bodyOrigin
    } = req.body;

    // UK-only delivery and a usable contact number, checked before a payment
    // session exists. Once Worldpay has taken the money, refusing the order
    // means a refund instead of a message.
    const deliverable = assertDeliverable(req.body);
    if (!deliverable.ok) {
      return res.status(400).json({ success: false, message: deliverable.message });
    }

    // A one-per-customer code this shopper has already spent. Refused before the
    // payment session exists: once Worldpay holds the money, taking the discount
    // back means refunding the order rather than showing a message.
    if (discountApplied) {
      const usable = await checkDiscountUsable(customerEmail, discountApplied, orderId);
      if (!usable.ok) {
        console.warn(
          `[Worldpay Session] Refused order ${orderId} for ${customerEmail}: ` +
            `discount already used on ${usable.priorOrderId}.`
        );
        return res.status(400).json({ success: false, message: usable.message });
      }
    }

    const cfg = getEnvironmentConfig();

    const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'localhost:3000';
    const origin = bodyOrigin || `${protocol}://${host}`;

    const rawRef = orderId || `PS${Math.floor(Math.random() * 90000 + 10000)}`;
    const transactionReference = String(rawRef);

    let priceNum = 2500;
    if (typeof amount === 'number') {
      priceNum = Math.round(amount * 100);
    } else if (typeof amount === 'string' && !isNaN(parseFloat(amount))) {
      priceNum = Math.round(parseFloat(amount) * 100);
    } else if (typeof reqTotal === 'number') {
      priceNum = Math.round(reqTotal * 100);
    }

    const effectiveTotal = typeof amount === 'number' ? amount : (typeof reqTotal === 'number' ? reqTotal : parseFloat(amount) || 0);
    const effectiveShippingCost = typeof reqShippingCost === 'number'
      ? reqShippingCost
      // A free-delivery reward waives the charge whatever the order value.
      : (typeof reqDeliveryCost === 'number' ? reqDeliveryCost : resolveDeliveryCost(effectiveTotal, discountApplied));

    // Store pending order details in memory and persistent storage — DO NOT CREATE ORDER IN DATABASE BEFORE PAYMENT
    const pendingPayload: PendingCheckout = {
      orderId: transactionReference,
      customerName: customerName || 'Valued Customer',
      customerEmail: (customerEmail || 'customer@pouch-supply.com').toLowerCase().trim(),
      destination: destination || address || 'United Kingdom',
      // Kept as separate fields so the shipping label can be produced without
      // having to take the joined string apart again.
      shippingAddress: shippingAddress && typeof shippingAddress === 'object'
        ? { ...shippingAddress, phone: deliverable.phone, postcode: deliverable.postcode, country: UK_COUNTRY_NAME, countryCode: UK_COUNTRY_CODE }
        : undefined,
      customerPhone: deliverable.phone,
      items: Array.isArray(items) ? items.map((it: any) => {
        let planName = it.subscriptionPlan || '';
        const rawPlan = (it.subscriptionPlan || '').toLowerCase();
        const title = (it.productTitle || it.title || '').toLowerCase();
        const prodId = (it.productId || it.id || '').toLowerCase();
        if (!planName) {
          if (rawPlan.includes('ultimate') || title.startsWith('ultimate') || title.includes('ultimate plan') || prodId.includes('ultimate')) {
            planName = 'ULTIMATE Plan';
          } else if (rawPlan.includes('pro') || title.startsWith('pro') || title.includes('pro plan') || prodId.includes('pro')) {
            planName = 'PRO Plan';
          } else if (rawPlan.includes('core') || title.startsWith('core') || title.includes('core plan') || prodId.includes('core')) {
            planName = 'CORE Plan';
          } else if (rawPlan.includes('lite') || title.startsWith('lite') || title.includes('lite plan') || prodId.includes('lite')) {
            planName = 'LITE Plan';
          }
        }
        return {
          productId: it.productId || it.id || 'prod',
          // The title the storefront sent is kept verbatim. A stand-in name here
          // would follow the item all the way into the order detail view.
          productTitle: it.productTitle || it.title || '',
          price: typeof it.price === 'number' ? it.price : parseFloat(it.price) || 0,
          quantity: typeof it.quantity === 'number' ? it.quantity : parseInt(it.quantity) || 1,
          image: it.image || '',
          variant: it.variant || it.concreteVariantName || it.strength || it.flavour || '',
          sku: it.sku || it.concreteVariantId || it.productId || '',
          vendor: it.vendor || '',
          isSubscription: Boolean(it.isSubscription || (it.productId && (it.productId.startsWith('sub-pack') || it.productId.includes('sub-pack')))),
          subscriptionPlan: planName || it.subscriptionPlan || 'PRO Plan',
          subscriptionFrequency: it.subscriptionFrequency || 'Bi-Weekly',
          frequencyDiscount: it.frequencyDiscount || '10%',
          subscriptionItems: it.subscriptionItems || it.selectedProducts || it.items || []
        };
      }) : [],
      total: effectiveTotal,
      subtotal: typeof reqSubtotal === 'number' ? reqSubtotal : (effectiveTotal > effectiveShippingCost ? Number((effectiveTotal - effectiveShippingCost).toFixed(2)) : effectiveTotal),
      shippingCost: effectiveShippingCost,
      deliveryCost: effectiveShippingCost,
      deliveryMethod: reqDeliveryMethod || 'Royal Mail Tracked 24/48',
      discountApplied: discountApplied || null,
      discountAmount: typeof reqDiscountAmount === 'number' ? reqDiscountAmount : undefined,
      storeCreditApplied: storeCreditApplied || 0,
      isTestMode: false,
      createdAt: Date.now()
    };

    await savePendingCheckout(transactionReference, pendingPayload);

    if (!cfg.authHeader || !cfg.entity) {
      return res.status(400).json({
        success: false,
        message: 'Worldpay Access API credentials are not configured in environment variables (WORLDPAY_ENTITY, WORLDPAY_API_USERNAME, WORLDPAY_API_PASSWORD).',
        error: 'Worldpay credentials missing.'
      });
    }

    // Worldpay HPP Request (Live Hosted Payment Pages)
    const successReturnUrl = `${origin}/api/worldpay/callback?orderId=${encodeURIComponent(transactionReference)}&status=SUCCESS`;
    const pendingReturnUrl = `${origin}/api/worldpay/callback?orderId=${encodeURIComponent(transactionReference)}&status=PENDING`;
    const failureReturnUrl = `${origin}/api/worldpay/callback?orderId=${encodeURIComponent(transactionReference)}&status=FAILED`;
    const cancelReturnUrl = `${origin}/payment/cancelled?orderId=${encodeURIComponent(transactionReference)}`;
    const expiryReturnUrl = `${origin}/payment/failed?orderId=${encodeURIComponent(transactionReference)}&reason=expired`;

    const rawLabel = (items && items[0]?.productTitle) || 'Pouch Supply Order';
    // Worldpay narrative schema: merchant.narrative.line1 (Max 24 alphanumeric chars)
    let cleanNarrative = String(rawLabel)
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 24);
    if (!cleanNarrative || cleanNarrative.length === 0) {
      cleanNarrative = 'Pouch Supply Order';
    }

    // Clean simple description
    const cleanDescription = String(rawLabel || 'Pouch Supply')
      .replace(/[^a-zA-Z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 40) || 'Pouch Supply Order';

    const cleanBillingName = String(customerName || 'Scott Kivlin')
      .replace(/[^a-zA-Z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 40) || 'Scott Kivlin';

    const body: Record<string, unknown> = {
      transactionReference,
      merchant: {
        entity: cfg.entity
      },
      narrative: { line1: cleanNarrative },
      value: { currency: 'GBP', amount: priceNum },
      description: cleanDescription,
      billingAddressName: cleanBillingName,
      resultURLs: {
        successURL: successReturnUrl,
        pendingURL: pendingReturnUrl,
        failureURL: failureReturnUrl,
        errorURL: failureReturnUrl,
        cancelURL: cancelReturnUrl,
        expiryURL: expiryReturnUrl
      }
    };

    // A subscription basket needs Worldpay to STORE the card, not just charge it.
    //
    // Without a customerAgreement on this first payment Worldpay treats it as a
    // one-off: it issues no scheme transaction reference and no recurring
    // authorization link, so there is nothing to charge on the renewal date and
    // every recurring payment fails. `createToken` is required alongside the
    // agreement by the Hosted Payment Pages API.
    const isSubscriptionCheckout = Boolean(
      recurring ||
      (Array.isArray(items) &&
        items.some(
          (it: any) =>
            it?.isSubscription ||
            (typeof it?.productId === 'string' && it.productId.includes('sub-pack'))
        ))
    );

    if (isSubscriptionCheckout) {
      body.customerAgreement = {
        type: 'subscription',
        storedCardUsage: 'first'
      };
      body.createToken = {
        type: 'worldpay',
        // Groups the shopper's stored cards. Their email keeps renewals for one
        // person together without exposing anything Worldpay does not already hold.
        namespace: String(customerEmail || transactionReference).toLowerCase().slice(0, 64),
        description: 'Pouch Supply subscription',
        // Consent for the stored card is taken in our own checkout terms, so the
        // shopper is not asked a second time on Worldpay's page. `Silent` has to
        // be enabled on the account — set WORLDPAY_TOKEN_OPT_IN=ASK if Worldpay
        // rejects it, rather than losing the token and the renewal with it.
        optIn: tokenOptIn()
      };
    }

    const correlationId = crypto.randomUUID ? crypto.randomUUID() : `hpp-${Math.random().toString(36).slice(2, 12)}`;
    const userAgent = req.headers['user-agent'] || 'worldpay-hpp/1.0';

    const worldpayUrl = `${cfg.baseUrl}/payment_pages`;

    console.log(`[Worldpay HPP ${cfg.environment.toUpperCase()}] POST ${worldpayUrl} for Order: ${transactionReference}`);

    // The credentials guard above proves `cfg.authHeader` is set, but that
    // narrowing does not survive into the closure below, so hold it as a const.
    const authHeader = cfg.authHeader;

    // Which body Worldpay actually accepted. The ladder below can send up to
    // three different ones, and the logging afterwards is only meaningful if it
    // reports the one that won rather than the one we started with.
    let lastAttemptedBody: Record<string, unknown> | null = null;

    const postPaymentPage = async (payload: Record<string, unknown>) => {
      lastAttemptedBody = payload;
      const res = await fetch(worldpayUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/vnd.worldpay.payment_pages-v1.hal+json',
          'Accept': 'application/vnd.worldpay.payment_pages-v1.hal+json',
          'WP-CorrelationId': correlationId,
          'User-Agent': userAgent
        },
        body: JSON.stringify(payload)
      });
      const parsed: any = await res.json().catch(() => ({ message: 'Invalid response from Worldpay.' }));
      return { res, parsed };
    };

    let { res: response, parsed: responseBody } = await postPaymentPage(body);

    // Losing tokenisation is what breaks a subscription forever, so the retry
    // ladder gives it up one rung at a time instead of all at once.
    //
    // The previous version went straight from "full mandate with a Silent token"
    // to "no mandate and no token". `optIn: "Silent"` has to be enabled on the
    // account; when it is not, Worldpay rejects the request — and that single
    // rejection used to discard tokenisation entirely, even though the same
    // request with `optIn: "ASK"` (Worldpay's own documented default) would have
    // been accepted and would have stored the card. An order taken that way can
    // never renew, and nothing about it looks wrong until the first renewal
    // fails, which is exactly how PS25640 ended up with a scheme reference and
    // no card.
    //
    // Nothing here moves money: creating a payment page is a pre-authorisation
    // call, so an extra attempt costs a round trip and nothing else.
    if (!response.ok && isSubscriptionCheckout) {
      const describe = (parsedBody: any) =>
        String(parsedBody?.description || parsedBody?.message || parsedBody?.errorName || '');

      const askBody = {
        ...body,
        createToken: { ...(body.createToken as Record<string, unknown>), optIn: 'ASK' }
      };

      // Rung 2: keep the mandate and the token, but let Worldpay ask the shopper
      // for consent itself. Only worth trying if we were not already asking.
      if (tokenOptIn() !== 'ASK') {
        console.warn(
          `[Worldpay HPP] Mandate request rejected for ${transactionReference} ` +
            `(${response.status}): ${describe(responseBody)}. Retrying with optIn "ASK" before ` +
            `giving up the stored card.`
        );
        ({ res: response, parsed: responseBody } = await postPaymentPage(askBody));

        if (response.ok) {
          console.warn(
            `[Worldpay HPP] ${transactionReference} was accepted with optIn "ASK". "Silent" is not ` +
              `enabled on entity ${cfg.entity} — set WORLDPAY_TOKEN_OPT_IN=ASK so every future ` +
              `subscription is tokenised on the first attempt.`
          );
        }
      }

      // Rung 3: the mandate itself is not available on this account. Take the
      // sale rather than losing it, but record that the subscription it creates
      // cannot renew, so it is not left looking healthy.
      if (!response.ok) {
        console.error(
          `[Worldpay HPP] Subscription mandate rejected for ${transactionReference} ` +
            `(${response.status}): ${describe(responseBody)}. Retrying as a one-off payment — this ` +
            `subscription will NOT be able to take recurring payments until ` +
            `customer agreements / tokenisation are enabled on entity ${cfg.entity}.`
        );

        const fallbackBody = { ...body };
        delete (fallbackBody as any).customerAgreement;
        delete (fallbackBody as any).createToken;
        ({ res: response, parsed: responseBody } = await postPaymentPage(fallbackBody));

        if (response.ok) {
          // Carried through to the subscription so the renewal failure has a
          // stated cause instead of looking like a gateway refusal.
          await savePendingCheckout(transactionReference, {
            ...pendingPayload,
            tokenisationDowngraded: true
          });
        }
      }
    }

    // What Worldpay was asked for, and what it said back.
    //
    // A payment page that is created successfully tells you nothing about
    // whether the card will be stored: Worldpay returns the same 201 and the
    // same redirect link either way, and the tokenisation request is either
    // honoured or quietly dropped with no mention in the response. PS65700 was
    // accepted with customerAgreement AND createToken, came back cardOnFile, and
    // produced no token — so the response is the only place left to look.
    if (isSubscriptionCheckout) {
      const acceptedBody = response.ok ? (lastAttemptedBody as any) : null;
      console.log(
        `[Worldpay HPP] TOKENISATION REQUEST for ${transactionReference}: ` +
          (acceptedBody?.createToken
            ? JSON.stringify(acceptedBody.createToken)
            : 'NONE — the accepted request carried no createToken')
      );
      console.log(
        `[Worldpay HPP] TOKENISATION AGREEMENT for ${transactionReference}: ` +
          (acceptedBody?.customerAgreement
            ? JSON.stringify(acceptedBody.customerAgreement)
            : 'NONE — the accepted request carried no customerAgreement')
      );
      console.log(
        `[Worldpay HPP] WORLDPAY RESPONSE for ${transactionReference} (HTTP ${response.status}): ` +
          JSON.stringify(responseBody).slice(0, 4000)
      );

      // Worldpay does not acknowledge tokenisation on this response today. If it
      // ever starts to, this is the line that will show it — and if it never
      // does, the silence is itself the finding to take to Worldpay support.
      const echo = JSON.stringify(responseBody || {});
      console.log(
        `[Worldpay HPP] Does the response mention a token at all? ` +
          (/token/i.test(echo) ? 'YES — see the body above' : 'NO')
      );
    }

    if (!response.ok) {
      const errMsg = responseBody?.description || responseBody?.message || 'Hosted Payment Pages creation failed.';
      return res.status(response.status).json({
        success: false,
        message: errMsg,
        error: `Worldpay Error (${response.status}): ${errMsg}`,
        details: responseBody
      });
    }

    const redirectUrl = extractWorldpayRedirectUrl(responseBody);
    if (!redirectUrl) {
      return res.status(400).json({
        success: false,
        message: 'Worldpay response did not include a valid Hosted Payment Page redirect URL.',
        details: responseBody
      });
    }

    return res.status(200).json({
      success: true,
      sessionId: transactionReference,
      transactionReference,
      redirectUrl,
      checkoutId: cfg.entity,
      provider: `Worldpay Access HPP (${cfg.environment})`,
      environment: cfg.environment,
      isTestMode: cfg.isTestMode
    });

  } catch (error: any) {
    console.error('[Worldpay HPP] Request failed:', error);
    return res.status(502).json({
      success: false,
      message: 'Unable to reach Worldpay Hosted Payment Pages service.',
      error: error.message
    });
  }
}

router.post('/session', handleCreateHostedPaymentPage);
router.post('/payment_pages', handleCreateHostedPaymentPage);

// POST /api/worldpay/verify-payment - Server-side Payment Verification & Order Creation
router.post('/verify-payment', async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      status,
      transactionId,
      txId,
      authCode,
      cardBrand,
      customerName,
      customerEmail,
      destination,
      items,
      total
    } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const statusUpper = String(status || 'SUCCESS').toUpperCase();

    if (statusUpper !== 'SUCCESS' && statusUpper !== 'AUTHORIZED' && statusUpper !== 'PAID') {
      // Payment was declined or cancelled. DO NOT SAVE ANY ORDER!
      pendingCheckoutsMap.delete(orderId);
      return res.status(400).json({
        success: false,
        message: 'Payment was not successful. No order was created in the database.'
      });
    }

    // Retrieve pending order data or construct from request body if missing
    let pending = await getPendingCheckout(orderId);
    if (!pending) {
      pending = {
        orderId,
        customerName: customerName || 'Valued Customer',
        customerEmail: (customerEmail || 'customer@pouch-supply.com').toLowerCase().trim(),
        destination: destination || 'United Kingdom',
        items: Array.isArray(items) ? items : [],
        total: typeof total === 'number' ? total : parseFloat(total) || 0,
        discountApplied: req.body.discountApplied || null,
        storeCreditApplied: req.body.storeCreditApplied || 0,
        // From the server's own Worldpay environment, never the request body
        // and never a default of `true`. This is a rebuilt pending record for a
        // payment that has already happened, and the flag decides whether the
        // order is tagged "Worldpay Test Order" — so on a live account a real
        // sale was being labelled as a test whenever the original pending
        // record had been lost.
        isTestMode: getEnvironmentConfig().isTestMode,
        createdAt: Date.now()
      };
    }

    // Confirm with Worldpay directly instead of trusting the client-reported
    // status, and pick up the stored-credential reference while we are there.
    const gatewayResponse = req.body.worldpayResponse || (await fetchWorldpayPaymentDetails(orderId));

    const effectiveTxId =
      transactionId || txId || gatewayResponse?.id || `WP-${Date.now().toString().slice(-6)}`;
    const effectiveAuthCode = authCode || gatewayResponse?.authorizationCode || 'AUTH-SUCCESS-OK';

    // Persist verified order into Prisma DB and StoreResource
    const savedOrder = await saveVerifiedOrder(orderId, {
      transactionId: effectiveTxId,
      authCode: effectiveAuthCode,
      cardBrand: cardBrand || gatewayResponse?.paymentInstrument?.card?.brand || 'Worldpay Card',
      gatewayResponse,
      customerName,
      customerEmail,
      destination,
      items,
      total,
      discountApplied: req.body.discountApplied,
      storeCreditApplied: req.body.storeCreditApplied,
      pendingData: pending
    });

    console.log(`[Worldpay Payment Verified] Order #${orderId} saved as Paid with Tx ID: ${effectiveTxId}`);

    return res.json({
      success: true,
      orderId,
      transactionId: effectiveTxId,
      authCode: effectiveAuthCode,
      paymentStatus: 'Paid',
      order: savedOrder,
      redirectUrl: `/payment/success?orderId=${encodeURIComponent(orderId)}&txId=${encodeURIComponent(effectiveTxId)}`
    });

  } catch (error: any) {
    console.error('[Worldpay Verify Payment Error]:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server-side payment verification failed' });
  }
});

// GET & POST /api/worldpay/callback - Shopper Return Callback Handler
const handleWorldpayCallback = async (req: Request, res: Response) => {
  const params = req.method === 'POST' ? req.body : req.query;
  const orderId = (params.orderId || params.transactionReference) as string;
  const status = (params.status || '').toUpperCase();

  console.log(`[Worldpay Callback] Order: ${orderId}, Status: ${status}`);

  if (!orderId) {
    return res.redirect('/payment/failed?reason=missing_order');
  }

  if (status === 'FAILED' || status === 'CANCELLED' || status === 'ERROR') {
    pendingCheckoutsMap.delete(orderId);
    return res.redirect(`/payment/failed?orderId=${encodeURIComponent(orderId)}&reason=payment_declined`);
  }

  if (status === 'SUCCESS' || status === 'PENDING' || status === 'AUTHORIZED') {
    // Ask Worldpay what actually happened rather than trusting the redirect's
    // query string — this is also where the stored-credential reference for a
    // subscription comes from.
    const gatewayResponse = await fetchWorldpayPaymentDetails(orderId);

    const outcome = paymentOutcome(gatewayResponse);

    // Worldpay says the payment did not happen. Recording an order here would
    // create a paid order for money nobody took — and this URL is a plain GET
    // that anything can request.
    if (outcome === 'failed') {
      console.warn(
        `[Worldpay Callback] Worldpay reports the payment for ${orderId} as ` +
          `${gatewayResponse?.lastEvent || gatewayResponse?.outcome}. No order created.`
      );
      pendingCheckoutsMap.delete(orderId);
      return res.redirect(`/payment/failed?orderId=${encodeURIComponent(orderId)}&reason=payment_declined`);
    }

    const txId = (params.txId ||
      params.transactionId ||
      gatewayResponse?.id ||
      `WP-CB-${Date.now().toString().slice(-6)}`) as string;
    const authCode = (params.authCode ||
      gatewayResponse?.authorizationCode ||
      'CALLBACK-OK') as string;

    try {
      await saveVerifiedOrder(orderId, {
        transactionId: txId,
        authCode,
        cardBrand: gatewayResponse?.paymentInstrument?.card?.brand || 'Worldpay Card',
        gatewayResponse,
        // Only Worldpay's own answer marks an order Paid. When it has not
        // published the payment yet the order is saved as Pending, and the
        // webhook — or the status poll the checkout page runs for 90 seconds —
        // completes it once the authorisation appears.
        paymentConfirmed: outcome === 'authorised'
      });
      console.log(
        outcome === 'authorised'
          ? `[Worldpay Callback] Order ${orderId} confirmed by Worldpay and saved as Paid.`
          : `[Worldpay Callback] Order ${orderId} saved as Pending — Worldpay has not published an authorised payment yet.`
      );
    } catch (error) {
      console.error('[Worldpay Callback] Error saving order on callback:', error);
    }

    return res.redirect(`/payment/success?orderId=${encodeURIComponent(orderId)}&txId=${encodeURIComponent(txId)}`);
  }

  return res.redirect(`/payment/failed?orderId=${encodeURIComponent(orderId)}&reason=unknown_status`);
};

router.get('/callback', handleWorldpayCallback);
router.post('/callback', handleWorldpayCallback);

/** Worldpay event names that mean the money is committed. */
const WEBHOOK_PAID_EVENTS = new Set([
  'authorized',
  'authorised',
  'captured',
  'settled',
  'charged',
  'sentforsettlement',
  'settlementrequestsubmitted',
  'settlementsubmitted'
]);

const WEBHOOK_FAILED_EVENTS = new Set([
  'failed',
  'refused',
  'declined',
  'error',
  'expired',
  'cancelled',
  'canceled',
  'sentforrefund'
]);

/**
 * Reads one Worldpay webhook, whichever body shape it arrives in.
 *
 * Worldpay Access delivers `{ eventId, eventTimestamp, eventDetails: { type,
 * transactionReference, ... } }`. This handler only ever understood a
 * `{ type, data: { attributes: { status, metadata } } }` body, so it answered
 * `{ ignored: true }` to everything Worldpay actually sent — including every
 * tokenCreated event. Both are read now, and anything unrecognised is logged in
 * full rather than discarded, because a dropped token is a subscription that
 * cannot renew.
 */
function normalizeWorldpayWebhook(event: any) {
  const details = event?.eventDetails || {};
  const attributes = event?.data?.attributes || {};

  const eventType = String(details.type || event?.eventType || event?.type || '').trim();
  const status = String(attributes.status || details.lastEvent || eventType || '')
    .toLowerCase()
    .replace(/[\s_-]/g, '');

  const orderId =
    attributes?.metadata?.orderId ||
    attributes?.reference ||
    details.transactionReference ||
    event?.transactionReference ||
    null;

  return {
    eventType,
    status,
    orderId: orderId ? String(orderId) : null,
    transactionId:
      attributes.transactionId ||
      details.paymentId ||
      details.transactionId ||
      event?.data?.id ||
      event?.eventId ||
      null,
    authCode: attributes.authCode || details.authorizationCode || null,
    cardBrand: attributes?.paymentMethod?.card?.brand || details?.paymentInstrument?.card?.brand || null,
    namespace: details.namespace || details.tokenNamespace || attributes?.namespace || null,
    eventId: event?.eventId || event?.data?.id || null,
    // The raw half of the payload that carries the stored-credential references.
    payload: Object.keys(details).length > 0 ? details : attributes
  };
}

/**
 * GET /api/worldpay/webhook — liveness only.
 *
 * The route is POST-only, so a GET answered 404, and a 404 is indistinguishable
 * from "this URL does not exist" when checking a webhook registration by hand or
 * with an uptime probe. Worth having: the URL registered in the Worldpay
 * dashboard was the site root for months, and the only way to notice was that
 * nothing ever arrived.
 *
 * This confirms the endpoint is reachable and nothing else. Events are accepted
 * on POST alone.
 */
/**
 * A durable record of what Worldpay has actually POSTed to us.
 *
 * On a serverless deploy the logs are spread across invocations and expire, so
 * "I do not see a tokenCreated event" cannot distinguish Worldpay never sending
 * one from us receiving it and saying nothing useful. Every inbound webhook is
 * recorded here, whatever its shape and whether or not we act on it, and
 * GET /api/worldpay/webhook reads it back. That turns the question into one
 * anybody can answer from a browser.
 *
 * Webhook bodies carry no card number — the token href is a reference, not a
 * PAN — so keeping the raw body is what makes an unrecognised payload shape
 * fixable instead of merely reportable.
 */
const WEBHOOK_LOG_RESOURCE = 'worldpayWebhookLog';
const WEBHOOK_LOG_KEEP = 50;
const WEBHOOK_LOG_BODY_LIMIT = 4000;

async function recordWebhookReceipt(entry: {
  eventType: string | null;
  status: string | null;
  orderId: string | null;
  namespace: string | null;
  tokenFound: boolean;
  action: string;
  rawBody: string;
  /** What Worldpay actually sent it as — the field that identified the parser gap. */
  contentType?: string | null;
}) {
  try {
    const existing: any[] = (await fetchResource(WEBHOOK_LOG_RESOURCE)) || [];
    existing.push({
      id: `hook_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      receivedAt: new Date().toISOString(),
      ...entry,
      rawBody: entry.rawBody.slice(0, WEBHOOK_LOG_BODY_LIMIT)
    });
    await saveResource(WEBHOOK_LOG_RESOURCE, existing.slice(-WEBHOOK_LOG_KEEP));
    lastReceiptWriteError = null;
  } catch (err: any) {
    // Recorded rather than only warned: a failed write here is indistinguishable
    // from "Worldpay never called" in the GET below — both report 0 — and that
    // ambiguity is exactly what made the last diagnosis take days.
    lastReceiptWriteError = `${new Date().toISOString()}: ${err?.message || String(err)}`;
    console.warn('[Worldpay Webhook] Could not record the receipt:', err?.message);
  }
}

/**
 * Proof of what this instance actually saw, independent of the persisted log.
 *
 * The persisted counters answer "did a webhook arrive and get stored". These
 * answer "did the handler run at all", which is the only way to tell a Worldpay
 * delivery problem apart from a storage problem. Module state on a serverless
 * platform is per-instance and resets on a cold start, so a zero here proves
 * nothing — a NON-zero is the signal.
 */
let handlerInvocations = 0;
let lastHandlerRanAt: string | null = null;
let lastReceiptWriteError: string | null = null;
let lastContentType: string | null = null;

/**
 * Bumped by hand whenever this handler changes. The deployed bundle is a build
 * artifact, so without this there is no way to tell from the outside whether a
 * test exercised the code being reasoned about or a stale deploy.
 */
const WEBHOOK_BUILD_MARKER = 'webhook-vendor-json-parse-2026-09-16';

router.get('/webhook', async (_req: Request, res: Response) => {
  let heldTokens = 0;
  try {
    heldTokens = ((await fetchResource(PENDING_TOKENS_RESOURCE)) || []).length;
  } catch (_e) {}

  let received: any[] = [];
  try {
    received = ((await fetchResource(WEBHOOK_LOG_RESOURCE)) || []).slice().reverse();
  } catch (_e) {}

  const tokenEvents = received.filter((r: any) => r?.tokenFound || /token/i.test(String(r?.eventType || '')));

  return res.status(200).json({
    ok: true,
    endpoint: '/api/worldpay/webhook',
    method: 'POST',
    message:
      'Worldpay webhook endpoint is live. The URL being registered and Active is not sufficient — ' +
      'tokenCreated must also be among the SUBSCRIBED EVENTS for that registration, which the ' +
      'webhook list does not show. Open the registration itself to confirm the event selection.',
    heldTokensAwaitingSubscription: heldTokens,

    // Which build is answering. Compare against the deployed commit before
    // trusting anything below: a test run against a stale bundle proves nothing.
    build: WEBHOOK_BUILD_MARKER,

    // Handler-ran evidence, independent of the persisted log above. Non-zero
    // with webhooksReceivedTotal 0 means Worldpay IS calling and the receipt
    // write is failing — a storage bug, not a delivery problem. Zero proves
    // nothing on its own: this GET may hit a different serverless instance.
    handlerInvocationsThisInstance: handlerInvocations,
    lastHandlerRanAtThisInstance: lastHandlerRanAt,
    lastReceiptWriteError,
    lastContentTypeThisInstance: lastContentType,

    // The answer to "is Worldpay actually calling us?". A total of 0 means no
    // webhook of ANY kind has reached this endpoint, which is a Worldpay-side
    // registration problem and not something this code can fix.
    webhooksReceivedTotal: received.length,
    tokenEventsReceived: tokenEvents.length,
    lastReceivedAt: received[0]?.receivedAt || null,
    recentEvents: received.slice(0, 20).map((r: any) => ({
      receivedAt: r.receivedAt,
      eventType: r.eventType,
      status: r.status,
      orderId: r.orderId,
      tokenFound: r.tokenFound,
      action: r.action,
      contentType: r.contentType || null
    })),
    // Kept in full so an unrecognised payload shape can be matched against
    // extractTokenHref rather than guessed at.
    lastRawBodies: received.slice(0, 3).map((r: any) => r.rawBody)
  });
});

// POST /api/worldpay/webhook - Official Worldpay Webhook Handler
router.post('/webhook', async (req: Request, res: Response) => {
  // Logged before anything is decided, so the log proves receipt even for a
  // payload this code does not understand. Every earlier exit from this handler
  // was silent for at least one shape of event, which made "no tokenCreated in
  // the logs" impossible to tell apart from "Worldpay never sent one".
  const contentType = String(req.headers['content-type'] || 'none');

  // Last-resort parse. If the body parser did not recognise the media type,
  // req.body is {} and the event is invisible; the raw bytes are still the
  // truth. Recovering them here means an unrecognised content type degrades
  // to "parsed anyway" rather than "silently discarded".
  if (
    (!req.body || (typeof req.body === 'object' && Object.keys(req.body).length === 0)) &&
    (req as any).rawBody
  ) {
    try {
      const recovered = JSON.parse(Buffer.from((req as any).rawBody).toString('utf8'));
      if (recovered && typeof recovered === 'object') {
        req.body = recovered;
        console.warn(
          `[Worldpay Webhook] Body was not parsed by the media type "${contentType}" — recovered from raw bytes.`
        );
      }
    } catch (_e) {}
  }

  const rawBody = (() => {
    try {
      return JSON.stringify(req.body);
    } catch {
      return String(req.body);
    }
  })();

  handlerInvocations += 1;
  lastHandlerRanAt = new Date().toISOString();
  lastContentType = contentType;

  console.log(
    `[Worldpay Webhook] <<< POST RECEIVED (${rawBody.length} bytes) >>> ` + rawBody.slice(0, 4000)
  );

  /** Records the receipt, then answers. One exit point so nothing goes unlogged. */
  const finish = async (
    httpStatus: number,
    payload: Record<string, unknown>,
    summary: {
      action: string;
      evt?: ReturnType<typeof normalizeWorldpayWebhook> | null;
      tokenFound?: boolean;
    }
  ) => {
    console.log(
      `[Worldpay Webhook] --> ${summary.action} ` +
        `(type=${summary.evt?.eventType || 'unknown'} status=${summary.evt?.status || 'n/a'} ` +
        `order=${summary.evt?.orderId || 'n/a'} token=${summary.tokenFound ? 'YES' : 'no'})`
    );
    await recordWebhookReceipt({
      eventType: summary.evt?.eventType || null,
      status: summary.evt?.status || null,
      orderId: summary.evt?.orderId || null,
      namespace: summary.evt?.namespace || null,
      tokenFound: Boolean(summary.tokenFound),
      action: summary.action,
      rawBody,
      contentType
    });
    return res.status(httpStatus).json(payload);
  };

  try {
    const event = req.body;
    if (!event || typeof event !== 'object') {
      return finish(400, { error: 'Invalid webhook payload' }, { action: 'rejected: body is not an object' });
    }

    const evt = normalizeWorldpayWebhook(event);

    const tokenHref = extractTokenHref(event);

    // Stated explicitly for every event, because a token arriving in a shape
    // extractTokenHref does not recognise looks identical in the logs to no
    // token being sent at all.
    console.log(
      `[Worldpay Webhook] Tokenisation read: tokenHref=${tokenHref || 'NOT FOUND IN PAYLOAD'} ` +
        `(eventType=${evt.eventType || 'unknown'}, namespace=${evt.namespace || 'none'})`
    );
    const isPaymentEvent =
      WEBHOOK_PAID_EVENTS.has(evt.status) || WEBHOOK_FAILED_EVENTS.has(evt.status);

    // A tokenCreated event is how Worldpay hands over the stored card. It is a
    // separate delivery from the payment event, names no order, and is the only
    // place the token href appears — so it is handled here rather than falling
    // through to the "no transaction reference" exit below, which is where every
    // one of them used to be discarded.
    if (tokenHref && !isPaymentEvent) {
      const recorded = await recordTokenForSubscription(tokenHref, {
        transactionReference: evt.orderId,
        namespace: evt.namespace
      });
      return finish(
        200,
        { received: true, processed: recorded, event: evt.eventType || 'tokenCreated', orderId: evt.orderId },
        {
          action: recorded
            ? 'token recorded against a subscription'
            : 'token parked for a subscription that does not exist yet',
          evt,
          tokenFound: true
        }
      );
    }

    if (!tokenHref && isTokenEvent(event)) {
      console.error(
        `[Worldpay Webhook] A token event (${evt.eventType || 'unknown type'}) arrived with no ` +
          `readable token href. Renewals depend on this value — raw body follows so the shape ` +
          `can be matched: ${JSON.stringify(event).slice(0, 4000)}`
      );
      return finish(
        200,
        { received: true, processed: false, reason: 'no token href' },
        { action: 'TOKEN EVENT WITH AN UNREADABLE HREF - payload shape needs matching', evt }
      );
    }

    if (!evt.orderId) {
      console.warn(
        `[Worldpay Webhook] Ignoring an event with no transaction reference ` +
          `(type: ${evt.eventType || 'unknown'}).`
      );
      return finish(200, { received: true, ignored: true }, { action: 'ignored: no transaction reference', evt });
    }

    if (WEBHOOK_PAID_EVENTS.has(evt.status)) {
      // The order and its subscription are written first: saveVerifiedOrder
      // reads the same payload for stored credentials, so a payment event that
      // does carry a token stores it on creation rather than being chased by a
      // second write against a subscription that does not exist yet.
      await saveVerifiedOrder(evt.orderId, {
        transactionId: String(evt.transactionId || evt.orderId),
        authCode: evt.authCode || undefined,
        cardBrand: evt.cardBrand || undefined,
        // Carries any stored-credential reference Worldpay included in the event.
        gatewayResponse: evt.payload,
        webhookEventId: evt.eventId || undefined,
        // evt.orderId is Worldpay's transactionReference, which is a storefront
        // order id only for a checkout payment. A renewal's reference is a
        // gateway reference, and taking it for an order id is what fabricated
        // the £0 "SUB-ORD-…" order. A webhook updates orders; it never authors.
        allowCreate: false
      });
      if (tokenHref) {
        await recordTokenForSubscription(tokenHref, {
          transactionReference: evt.orderId,
          namespace: evt.namespace
        });
      }
    } else if (WEBHOOK_FAILED_EVENTS.has(evt.status)) {
      pendingCheckoutsMap.delete(evt.orderId);
    } else {
      console.log(
        `[Worldpay Webhook] No action for event "${evt.eventType || evt.status}" on ${evt.orderId}.`
      );
    }

    return finish(
      200,
      { received: true, processed: true, orderId: evt.orderId },
      { action: 'payment event processed', evt, tokenFound: Boolean(tokenHref) }
    );
  } catch (error: any) {
    console.error('[Worldpay Webhook] Processing error:', error);

    // A 2xx tells Worldpay the event was handled and it is never sent again.
    // That is wrong for an internal failure — the production log shows Neon
    // going unreachable mid-request, and answering 200 through that window
    // would discard a card token permanently. A 5xx asks Worldpay to retry.
    return res.status(500).json({ received: true, processed: false, error: error.message });
  }
});

// GET /api/worldpay/status - Check order payment status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const orderId = req.query.orderId as string;
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    let foundOrder: any = null;
    try {
      foundOrder = await prisma.order.findUnique({ where: { id: orderId } });
    } catch (_e) {}

    if (!foundOrder) {
      try {
        const orders: any[] = (await fetchResource('orders')) || [];
        foundOrder = orders.find((o: any) => String(o.id) === String(orderId));
      } catch (_e) {}
    }

    // The checkout page polls this for 90 seconds after the shopper returns.
    // That is the natural moment to re-ask Worldpay about an order the callback
    // could not confirm: the authorisation usually appears within seconds, and
    // completing it here means the order does not depend on a webhook being
    // configured. It also captures the stored-card mandate the subscription
    // needs, which is only readable from this query.
    if (foundOrder && foundOrder.paymentStatus === 'Pending') {
      const gatewayResponse = await fetchWorldpayPaymentDetails(orderId);
      const outcome = paymentOutcome(gatewayResponse);

      if (outcome === 'authorised') {
        console.log(`[Worldpay Status] Worldpay now confirms ${orderId}; completing the order.`);
        try {
          foundOrder = await saveVerifiedOrder(orderId, {
            transactionId: gatewayResponse?.id || foundOrder.worldpayTxId || orderId,
            authCode: gatewayResponse?.authorizationCode || foundOrder.worldpayAuthCode || 'AUTH-OK',
            cardBrand: gatewayResponse?.paymentInstrument?.card?.brand || foundOrder.cardBrand,
            gatewayResponse,
            paymentConfirmed: true
          }) || foundOrder;
        } catch (completionErr: any) {
          console.error(`[Worldpay Status] Failed to complete ${orderId}:`, completionErr?.message);
        }
      } else if (outcome === 'failed') {
        console.warn(`[Worldpay Status] Worldpay reports ${orderId} as not paid; leaving it Pending.`);
      }
    }

    if (!foundOrder || foundOrder.paymentStatus !== 'Paid') {
      return res.json({
        orderId,
        paid: false,
        status: foundOrder ? foundOrder.paymentStatus : 'Unpaid'
      });
    }

    return res.json({
      orderId: foundOrder.id,
      paid: true,
      status: 'Paid',
      transactionId: foundOrder.worldpayTxId || foundOrder.gatewayTxId || null,
      authCode: foundOrder.worldpayAuthCode || foundOrder.gatewayAuthCode || null,
      cardBrand: foundOrder.cardBrand || null,
      updatedAt: foundOrder.updatedAt || null
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to check payment status' });
  }
});

// GET /api/worldpay/order/:id - Get order details
router.get('/order/:id', async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    let foundOrder: any = null;

    try {
      foundOrder = await prisma.order.findUnique({ where: { id: orderId } });
    } catch (_e) {}

    if (!foundOrder) {
      try {
        const orders: any[] = (await fetchResource('orders')) || [];
        foundOrder = orders.find((o: any) => String(o.id) === String(orderId));
      } catch (_e) {}
    }

    if (!foundOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json(foundOrder);

  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch order' });
  }
});

// POST /api/worldpay/refund - Process Worldpay Payment Provider Refund
// Issues a real Worldpay refund from {orderId, amount}. Was unauthenticated.
router.post('/refund', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { orderId, amount, reason, transactionId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    let foundOrder: any = null;
    try {
      foundOrder = await prisma.order.findUnique({ where: { id: orderId } });
    } catch (_e) {}

    if (!foundOrder) {
      try {
        const orders: any[] = (await fetchResource('orders')) || [];
        foundOrder = orders.find((o: any) => String(o.id) === String(orderId));
      } catch (_e) {}
    }

    if (!foundOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const refundAmount = typeof amount === 'number' ? amount : (foundOrder.total || 0);

    const { refundWorldpayPayment } = await import('../services/worldpayRefund');
    const refundResult = await refundWorldpayPayment({
      order: foundOrder,
      amount: refundAmount,
      reason: reason || 'Customer requested refund',
      transactionId: transactionId || foundOrder.worldpayTxId || foundOrder.gatewayTxId
    });

    // Persist through saveSingleOrder. The Paid -> Refunded transition sends the
    // refund email exactly once; this route used to send it directly as well,
    // which is why a cancellation produced two refund emails.
    const { saveSingleOrder } = await import('./orders');
    const updatedOrder = await saveSingleOrder({
      ...foundOrder,
      paymentStatus: 'Refunded',
      fulfillmentStatus: foundOrder.fulfillmentStatus === 'Fulfilled' ? 'Fulfilled' : 'Cancelled',
      refundAmount,
      refundReason: reason || 'Refund issued to payment card',
      refundDetails: {
        refundRef: refundResult.refundRef,
        amount: refundResult.amount,
        reason: reason || 'Refund processed via Worldpay Gateway',
        gatewayContacted: refundResult.gatewayContacted,
        gatewayMessage: refundResult.message,
        refundedAt: new Date().toISOString()
      }
    });

    return res.json({
      success: refundResult.success,
      refundRef: refundResult.refundRef,
      transactionId: refundResult.transactionId,
      amount: refundResult.amount,
      gatewayContacted: refundResult.gatewayContacted,
      message: refundResult.message,
      order: updatedOrder
    });

  } catch (error: any) {
    console.error('[Worldpay Refund] Internal Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process Worldpay refund' });
  }
});

export default router;
