import { prisma } from '../../src/lib/prisma';
import { fetchResource, saveResource, getDb } from '../../serverDb';
import {
  chargeRecurringSubscription,
  isUsableRecurringHref,
  isUsableTokenHref,
  isPlaceholderCredential
} from './worldpaySubscription';
import { buildRenewalOrderItems, extractBoxItems, planTitleFromSubscription } from './subscriptionBox';
import { resolveEffectiveAmount, clearedPendingFields } from './subscriptionPricingService';

export interface RenewalResult {
  processed: number;
  succeeded: number;
  failed: number;
  skipped?: boolean;
  details: any[];
}

/**
 * The canonical set of billing intervals used across the whole app.
 * Every module must normalise free-text frequencies to one of these before
 * doing date maths — see `normalizeBillingInterval`.
 */
export type BillingInterval = '1day' | 'weekly' | 'bi-weekly' | 'month' | 'year';

/**
 * Normalises any free-text billing frequency to a canonical interval.
 *
 * Storefront values ("Next Day (Test)", "Bi-Weekly", "One Month"), admin values
 * ("14 days", "1 Month"), and stored values ("1day", "month") all funnel through
 * here so that the checkout, the admin plan editor and the renewal worker can
 * never disagree about what a subscription's schedule actually is.
 */
export function normalizeBillingInterval(raw: any): BillingInterval {
  const s = String(raw ?? '').toLowerCase().trim();
  if (!s) return 'month';

  // An explicit day count is the most specific signal, so it wins over loose
  // keyword matching. Without this, "14 days" matches /day/ and is billed daily.
  const dayCount = s.match(/(\d+)\s*(?:d|day|days)\b/);
  if (dayCount) {
    const n = parseInt(dayCount[1], 10);
    if (n <= 1) return '1day';
    if (n <= 7) return 'weekly';
    if (n <= 14) return 'bi-weekly';
    if (n <= 31) return 'month';
    return 'year';
  }

  if (/year|annual|12\s*month/.test(s)) return 'year';
  if (/bi[\s_-]*week|biweek|fortnight/.test(s)) return 'bi-weekly';
  if (/month/.test(s)) return 'month';
  if (/week/.test(s)) return 'weekly';
  if (/next[\s_-]*day|daily|per\s*day|every\s*day|^day$|^1day$/.test(s)) return '1day';

  return 'month';
}

/**
 * Advances a date by one billing period.
 */
export function addBillingInterval(interval: BillingInterval, fromDate: Date): Date {
  const next = new Date(fromDate);
  switch (interval) {
    case '1day':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'bi-weekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'year':
      next.setFullYear(next.getFullYear() + 1);
      break;
    case 'month':
    default:
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}

/**
 * Calculates the next billing date based on the plan's billing interval.
 */
export function calculateNextBillingDate(interval: string, fromDate: Date = new Date()): Date {
  return addBillingInterval(normalizeBillingInterval(interval), fromDate);
}

/**
 * Computes the next billing date after a successful charge.
 *
 * Anchored to the date that was actually due (not to "now") so that a worker
 * that runs a few minutes late does not permanently drift the schedule. If the
 * subscription is far behind (e.g. the server was down for days) we catch the
 * anchor up to the future rather than replaying every missed period.
 */
export function nextBillingDateAfterCharge(
  interval: string,
  scheduledFor: Date | null | undefined,
  now: Date = new Date()
): Date {
  const norm = normalizeBillingInterval(interval);
  const anchor = scheduledFor && !isNaN(new Date(scheduledFor).getTime()) ? new Date(scheduledFor) : new Date(now);

  let next = addBillingInterval(norm, anchor);
  let guard = 0;
  while (next <= now && guard < 400) {
    next = addBillingInterval(norm, next);
    guard++;
  }
  return next;
}

/** The only status a card may be charged under. */
export const CHARGEABLE_STATUS = 'active';

export function isChargeableStatus(status: any): boolean {
  return String(status ?? '').trim().toLowerCase() === CHARGEABLE_STATUS;
}

/**
 * The status to act on when the two stores disagree about one subscription.
 *
 * Cancelling writes to Prisma and to the JSON store in two separate steps, and
 * either can fail, so the two genuinely do disagree in this data. When they do,
 * the one that does NOT permit a charge wins.
 *
 * That asymmetry is deliberate. Failing to take a payment that was owed is
 * recoverable — the period stays due and the next run takes it. Taking one from
 * a customer who cancelled is not: the money has left their account, and no
 * amount of later correction undoes having charged them after they told you to
 * stop. PS65700's plan was cancelled at 04:48 on 21 Sep and charged again at
 * 17:28 the same day precisely because the stale 'active' side was believed.
 */
export function effectiveSubscriptionStatus(a: any, b: any): string {
  const sa = String(a ?? '').trim().toLowerCase();
  const sb = String(b ?? '').trim().toLowerCase();

  if (!sa) return sb;
  if (!sb) return sa;
  if (sa === sb) return sa;

  // They differ: whichever is not chargeable is the answer.
  if (!isChargeableStatus(sa)) return sa;
  if (!isChargeableStatus(sb)) return sb;
  return sa;
}

/**
 * This subscription's status right now, read fresh from both stores.
 *
 * Used as the last check before a charge. Anything unreadable answers with a
 * non-chargeable status: if we cannot confirm the plan is still active, we do
 * not take the money.
 */
export async function currentSubscriptionStatus(subId: string): Promise<string> {
  let fromPrisma: any;
  let fromStore: any;
  let readAnything = false;

  try {
    const row = await prisma.subscription.findUnique({
      where: { id: String(subId) },
      select: { status: true }
    });
    if (row) {
      fromPrisma = row.status;
      readAnything = true;
    }
  } catch (_e) {
    // Prisma unreachable; the store below may still answer.
  }

  try {
    const stored: any[] = (await fetchResource('subscriptions')) || [];
    const row = stored.find((s: any) => String(s?.id) === String(subId));
    if (row) {
      fromStore = row.status;
      readAnything = true;
    }
  } catch (_e) {}

  if (!readAnything) return 'unverifiable';
  return effectiveSubscriptionStatus(fromStore, fromPrisma) || 'unverifiable';
}

/**
 * Reads every subscription from Prisma AND the JSON store and merges them by id.
 *
 * The two stores are kept in sync on write, but a record can exist in only one
 * of them. Reading both and de-duplicating avoids the previous behaviour where
 * an empty Prisma result silently re-scanned the file store and could process
 * the same subscription from two different sources.
 */
async function loadAllSubscriptions(): Promise<any[]> {
  const byId = new Map<string, any>();

  const isConnected = await getDb().catch(() => false);
  if (isConnected) {
    try {
      // Deliberately NOT filtered to status 'active'.
      //
      // It used to be, and that is how a cancelled plan kept being charged.
      // Cancelling writes to Prisma and to the JSON store separately, each in
      // its own swallowed catch, so a failed Prisma write left the plan
      // 'cancelled' in the store and 'active' in Prisma. The merge below lets
      // the Prisma row win, and a filtered query could only ever return the
      // stale 'active' one — the store's cancellation was invisible here.
      // Loading every row is what lets a cancellation in EITHER store veto.
      const rows = await prisma.subscription.findMany();
      for (const row of rows || []) {
        byId.set(String(row.id), row);
      }
    } catch (_e) {
      // Prisma unavailable — the JSON store below is the source of truth.
    }
  }

  try {
    const stored: any[] = (await fetchResource('subscriptions')) || [];
    for (const row of stored) {
      if (!row || !row.id) continue;
      const key = String(row.id);
      const fromPrisma = byId.get(key);
      const merged = { ...(row || {}), ...(fromPrisma || {}) };
      // Prisma wins every other field, but NOT the status — see below.
      merged.status = effectiveSubscriptionStatus(row?.status, fromPrisma?.status);
      byId.set(key, merged);
    }
  } catch (_e) {}

  return Array.from(byId.values());
}

// Columns that exist on the Prisma Subscription model. Passing an unknown key
// makes Prisma reject the whole update, which would silently drop the fields
// that DO exist (notably nextBillingDate) — so the Prisma write is filtered
// while the JSON store keeps the full record.
//
// The second group was declared on the model but missing from the table until
// the 20260908_subscription_missing_columns migration, so those writes were
// being discarded by Postgres. They are persisted now.
const PRISMA_SUBSCRIPTION_FIELDS = new Set([
  'customerId', 'customerEmail', 'customerName', 'planId', 'planName', 'amount', 'currency',
  'status', 'billingInterval', 'nextBillingDate', 'worldpayTransactionId',
  'worldpayTokenHref', 'worldpayRecurringHref', 'worldpaySchemeReference', 'lastPaymentStatus', 'lastPaymentId',
  'lastPaymentAt', 'failedPaymentCount',
  'lastPaymentError', 'items', 'cansCount', 'itemPrice', 'shippingCost', 'shippingAddress',
  'deliveryMethod', 'sourceOrderId', 'cancelledAt', 'cancellationReason'
]);

/**
 * Persists a partial update to a subscription in both stores.
 */
async function persistSubscriptionUpdate(subId: string, updateData: Record<string, any>) {
  const prismaData: Record<string, any> = {};
  for (const [key, value] of Object.entries(updateData)) {
    if (PRISMA_SUBSCRIPTION_FIELDS.has(key)) prismaData[key] = value;
  }

  if (Object.keys(prismaData).length > 0) {
    try {
      await prisma.subscription.update({ where: { id: subId }, data: prismaData });
    } catch (_e) {}
  }

  try {
    const storedSubs: any[] = (await fetchResource('subscriptions')) || [];
    const updatedList = storedSubs.map((s: any) =>
      String(s.id) === String(subId) ? { ...s, ...updateData } : s
    );
    await saveResource('subscriptions', updatedList);
  } catch (_e) {}
}

/**
 * After how many consecutive failures a subscription stops being retried.
 *
 * `nextBillingDate` is deliberately never moved by a failure, so a due payment
 * stays due — which means the only thing that can stop an endlessly declining
 * card from being presented every run is taking the subscription out of
 * 'active'. The debt stays on the record for whoever picks it up.
 */
const MAX_CONSECUTIVE_FAILURES = 3;

/**
 * Stop starting new charges once a run has been going this long.
 *
 * Renewals are processed one after another in a single invocation, and each one
 * makes a gateway call and then saves an order, sends email and pushes Klaviyo
 * events. With enough due subscriptions the invocation is killed part-way
 * through. Subscriptions not yet started have NOT claimed their slot, so leaving
 * them for the next run costs nothing; being killed after claiming one is what
 * loses a payment.
 */
const RUN_TIME_BUDGET_MS = 45 * 1000;

/**
 * The Worldpay transaction reference for a recurring order.
 *
 * The reference is the order id under a fixed `SUB-ORD-` prefix, so a payment
 * in the Worldpay dashboard names the order it paid for — `SUB-ORD-PS65700-R20260918`
 * is the renewal order `PS65700-R20260918`. The prefix is what tells an admin
 * scanning Worldpay that the payment is a recurring charge rather than a
 * checkout, without having to cross-reference anything.
 *
 * Nothing parses this back into an order id: the reference is stored on the
 * order as `gatewayTxId`, and the webhook matches it by exact string equality
 * against `id` / `worldpayTxId` / `gatewayTxId`. It is a label, not a key.
 */
export function renewalTransactionReference(orderId: string): string {
  return `SUB-ORD-${String(orderId).trim()}`;
}

/**
 * The id for the next renewal order on a subscription, and the period it bills.
 *
 * The id carries the order the plan was bought with: "PS65700-R20260918" is the
 * renewal of order PS65700 for the period starting 18 Sep 2026. Worldpay's
 * transaction reference used to be a random `SUB-ORD-48120-3391` generated
 * before the order even existed, so a payment in the Worldpay dashboard could
 * not be matched to the order it paid for; the reference is now
 * `renewalTransactionReference(orderId)` of this id.
 *
 * Deriving the id from the billing period rather than a random number also makes
 * it stable: a period that was interrupted before its order was written produces
 * the same id and reference on the retry, which is what makes the retry safe.
 */
export function buildRenewalOrderRef(sub: any, dueDate: Date): { orderId: string; periodStart: Date } {
  const parentId = String(sub.sourceOrderId || sub.id || '').trim() || String(sub.id);

  // Anchored on the date this attempt is billing FOR — the subscription's own
  // nextBillingDate. That date is not moved by a failure, a timeout or an
  // interrupted run, so every retry of the same period derives the same id and
  // the same gateway reference. That is what makes a retry safe: the duplicate
  // check below recognises it, and Worldpay rejects a repeated reference.
  const periodStart = dueDate && !isNaN(new Date(dueDate).getTime()) ? new Date(dueDate) : new Date();

  const stamp =
    `${periodStart.getUTCFullYear()}` +
    `${String(periodStart.getUTCMonth() + 1).padStart(2, '0')}` +
    `${String(periodStart.getUTCDate()).padStart(2, '0')}`;

  return { orderId: `${parentId}-R${stamp}`, periodStart };
}

/** Whether this renewal order already exists, meaning the period is already billed. */
async function renewalOrderExists(orderId: string): Promise<boolean> {
  try {
    const row = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
    if (row) return true;
  } catch (_e) {}
  try {
    const stored: any[] = (await fetchResource('orders')) || [];
    if (stored.some((o: any) => String(o?.id) === orderId)) return true;
  } catch (_e) {}
  return false;
}

/**
 * Determines whether a subscription is due, backfilling a missing schedule.
 *
 * A subscription with no `nextBillingDate` used to be treated as "due right
 * now", which meant it was re-charged on every single worker tick. Instead we
 * derive the schedule it should have had from its last payment and store it.
 */
async function resolveDueDate(sub: any, now: Date): Promise<{ due: boolean; scheduledFor: Date | null }> {
  const interval = normalizeBillingInterval(sub.billingInterval);

  if (sub.nextBillingDate) {
    const parsed = new Date(sub.nextBillingDate);
    if (!isNaN(parsed.getTime())) {
      return { due: parsed <= now, scheduledFor: parsed };
    }
  }

  const anchorRaw = sub.lastPaymentAt || sub.createdAt || now;
  const anchor = new Date(anchorRaw);
  const backfilled = addBillingInterval(interval, isNaN(anchor.getTime()) ? now : anchor);

  console.warn(
    `[Subscription Worker] Sub ${sub.id} had no nextBillingDate; backfilling to ${backfilled.toISOString()}.`
  );
  await persistSubscriptionUpdate(String(sub.id), { nextBillingDate: backfilled });

  return { due: backfilled <= now, scheduledFor: backfilled };
}

// Guards against overlapping runs. The worker's startup run, its interval tick
// and the /api/subscriptions/cron HTTP endpoint all call into this function, and
// a renewal takes long enough (gateway + emails) to overlap on short intervals.
let isProcessing = false;

/**
 * Runs the subscription renewal engine for all active subscriptions due for billing.
 */
export async function processDueSubscriptions(): Promise<RenewalResult> {
  if (isProcessing) {
    console.log('[Subscription Worker] A renewal run is already in progress; skipping this tick.');
    return { processed: 0, succeeded: 0, failed: 0, skipped: true, details: [] };
  }

  isProcessing = true;
  const now = new Date();

  try {
    console.log(`[Subscription Worker] Scanning for due renewals at ${now.toISOString()}...`);

    const allSubs = await loadAllSubscriptions();
    const active = allSubs.filter((s: any) => String(s.status || '').toLowerCase() === 'active');

    const subscriptions: Array<{ sub: any; scheduledFor: Date | null }> = [];
    for (const sub of active) {
      const { due, scheduledFor } = await resolveDueDate(sub, now);
      if (due) subscriptions.push({ sub, scheduledFor });
    }

    console.log(`[Subscription Worker] Found ${subscriptions.length} subscription(s) due for renewal.`);

    const results: any[] = [];
    let succeeded = 0;
    let failed = 0;

    const runStartedAt = Date.now();

    for (const { sub, scheduledFor } of subscriptions) {
      const subId = String(sub.id);

      // Out of time. Subscriptions below this point have not claimed their slot,
      // so they stay due and the next run bills them. Stopping deliberately is
      // what stops the invocation being killed part-way through a charge.
      if (Date.now() - runStartedAt > RUN_TIME_BUDGET_MS) {
        console.warn(
          `[Subscription Worker] Run time budget reached; deferring ${subId} and any remaining ` +
            `subscriptions to the next run. They are still due and have not been charged.`
        );
        results.push({ id: subId, status: 'deferred', reason: 'Run time budget reached' });
        continue;
      }

      const customerEmail = String(sub.customerEmail || '').toLowerCase().trim();
      const recurringHref = sub.worldpayRecurringHref || sub.recurringHref;
      const schemeReference = sub.worldpaySchemeReference;
      const tokenHref = sub.worldpayTokenHref || sub.tokenHref;
      // The price in force for THIS renewal.
      //
      // A plan price an admin changed is held as a pending amount with an
      // effective date, so a renewal falling inside the notice period is still
      // charged the old price. Once the date has passed the pending amount
      // becomes the charge, and is promoted into `amount` below after the
      // payment succeeds — never before, so a failed charge does not silently
      // move the customer onto a new price.
      const { amount, promote: promotePendingAmount } = resolveEffectiveAmount(sub, now);
      if (!Number.isFinite(amount) || amount <= 0) {
        console.warn(`[Subscription Worker] Sub ${subId} has no usable amount; skipping.`);
        results.push({ subscriptionId: subId, status: 'skipped', reason: 'No chargeable amount' });
        continue;
      }
      const currency = sub.currency || 'GBP';
      const planName = planTitleFromSubscription(sub);
      const interval = normalizeBillingInterval(sub.billingInterval);

      console.log(
        `[Subscription Worker] Processing renewal for sub ${subId} (${customerEmail}) — £${amount.toFixed(2)} every ${interval}`
      );

      // A credential is only real if Worldpay issued it. Subscriptions created
      // by earlier builds carry locally generated placeholders, which look
      // present but cannot authorise anything — treat them as missing rather
      // than burning retry attempts on a charge that can never succeed.
      //
      // A scheme reference is the AGREEMENT, not the card. It cannot be charged
      // on its own: buildInstruction omits `paymentInstrument` entirely when
      // there is no token, and Worldpay rejects a MIT authorization with no
      // payment method. Accepting a bare scheme reference here meant every such
      // plan passed this gate, claimed its billing slot, burned a real gateway
      // call, failed, and advanced nextBillingDate anyway — silently, every
      // period. Only a stored card (token) or an issued recurring href can pay.
      const hasChargeableInstrument =
        isUsableTokenHref(tokenHref) || isUsableRecurringHref(recurringHref);
      const hasAgreementOnly =
        !hasChargeableInstrument &&
        Boolean(schemeReference) &&
        !isPlaceholderCredential(schemeReference);

      if (!hasChargeableInstrument) {
        console.warn(
          `[Subscription Worker] Sub ${subId} skipped: ` +
            (hasAgreementOnly
              ? `Worldpay issued the customer agreement (scheme=${schemeReference}) but never delivered a card token, ` +
                `so there is no payment instrument to present. This plan needs the customer to re-authorise. `
              : `no usable Worldpay stored credential ` +
                `(token=${tokenHref || 'none'}, href=${recurringHref || 'none'}, scheme=${schemeReference || 'none'}). `) +
            `The initial payment must be taken with createToken and a customer agreement so Worldpay ` +
            `stores the card and sends the tokenCreated webhook.`
        );
        failed++;

        // The schedule is NOT pushed forward. This period has not been paid, so
        // it stays due; moving the date used to forgive one period per run and
        // hide the fact that the plan has never been billable at all. A plan with
        // no card can never succeed on its own, so the failure counter is what
        // stops it being retried forever — it lands in 'past_due', which is the
        // signal that the customer has to re-authorise.
        const credentialFailCount = (sub.failedPaymentCount || 0) + 1;
        const credentialPastDue = credentialFailCount >= MAX_CONSECUTIVE_FAILURES;
        await persistSubscriptionUpdate(subId, {
          lastPaymentStatus: hasAgreementOnly ? 'missing_card_token' : 'missing_credential',
          lastPaymentError: hasAgreementOnly
            ? 'Worldpay issued the agreement but never delivered a card token'
            : 'No usable Worldpay stored credential',
          failedPaymentCount: credentialFailCount,
          status: credentialPastDue ? 'past_due' : 'active'
        });
        results.push({
          id: subId,
          status: 'skipped',
          nextBillingDate: 'unchanged (still due)',
          reason:
            (hasAgreementOnly
              ? 'Agreement present but no stored card token — customer must re-authorise'
              : 'Missing Worldpay stored credential') +
            (credentialPastDue ? ` — set to past_due after ${credentialFailCount} attempts` : '')
        });
        continue;
      }

      // The order this renewal will create, decided BEFORE the charge so the
      // gateway reference can name the order it is paying for.
      const { orderId: newOrderId, periodStart } = buildRenewalOrderRef(sub, scheduledFor || now);
      const transactionReference = renewalTransactionReference(newOrderId);

      // This period is already billed. Reached when a previous run charged the
      // card and wrote the order but was killed before it could record the
      // payment against the subscription, so the slot came back up for retry.
      // Charging again here would take the money twice.
      if (await renewalOrderExists(newOrderId)) {
        console.warn(
          `[Subscription Worker] Sub ${subId}: order ${newOrderId} already exists, so this period is ` +
            `already paid. Advancing the schedule without charging again.`
        );
        await persistSubscriptionUpdate(subId, {
          nextBillingDate: nextBillingDateAfterCharge(interval, periodStart, now)
        });
        results.push({ id: subId, status: 'skipped', reason: `Already billed as ${newOrderId}` });
        continue;
      }

      // What the schedule will become — applied ONLY after the money is confirmed
      // taken and the renewal order is confirmed written. Nothing is persisted
      // here.
      //
      // The schedule used to be advanced at this point, before the gateway was
      // called, to stop two workers billing the same period. That trade cost real
      // payments: a run killed mid-charge left the period marked as billed when it
      // never was, with no charge, no order and nothing recorded as failed.
      // Duplicate protection now comes from the reference above instead — it is
      // identical on every retry of this period, this order id is checked for
      // existence first, and Worldpay refuses a reference it has already seen.
      const claimedNextBilling = nextBillingDateAfterCharge(interval, periodStart, now);

      // Last look before the money moves.
      //
      // A run works through the due list one at a time, and each renewal takes a
      // gateway call plus an order write, an email and a Klaviyo push — long
      // enough for a customer to cancel while this loop is still going. The
      // status read at the top of the run would be stale by then, so it is read
      // again here, from both stores, immediately before the card is presented.
      const liveStatus = await currentSubscriptionStatus(subId);
      if (!isChargeableStatus(liveStatus)) {
        console.warn(
          `[Subscription Worker] Sub ${subId} is "${liveStatus}" as of now — NOT charging. ` +
            `A cancellation landed after this run started.`
        );
        results.push({
          id: subId,
          status: 'skipped',
          reason: `Cancelled before the charge was sent (status "${liveStatus}")`
        });
        continue;
      }

      try {
        // 1. Charge Worldpay using the stored MIT credential / scheme reference
        const chargeResult = await chargeRecurringSubscription({
          tokenHref,
          recurringHref,
          transactionReference,
          amount,
          currency,
          schemeReference,
          previousTransactionId: sub.worldpayTransactionId,
          customerEmail
        });

        console.log(`[Subscription Worker] Charge SUCCESS for ${subId}: Tx ${transactionReference}`);

        // 2. Calculate item subtotal & shipping cost for the renewal order
        const shippingAmount = typeof sub.shippingFee === 'number'
          ? sub.shippingFee
          : (typeof sub.shippingCost === 'number'
              ? sub.shippingCost
              : (typeof sub.shippingAmount === 'number'
                  ? sub.shippingAmount
                  : (typeof sub.deliveryCost === 'number'
                      ? sub.deliveryCost
                      : (amount >= 40 ? 0 : 2.99))));

        const itemSubtotal = Number(Math.max(0, amount - shippingAmount).toFixed(2)) || amount;

        // 3. Create the recurring order under the id the reference was built from
        const orderItems = buildRenewalOrderItems(sub, itemSubtotal, planTitleFromSubscription(sub));

        const newOrderData = {
          id: newOrderId,
          orderId: newOrderId,
          customerName: sub.customerName || 'Valued Subscriber',
          customerEmail,
          destination: sub.shippingAddress || sub.destination || 'United Kingdom',
          items: orderItems,
          // The chosen products travel with the renewal so the order detail view
          // shows the real box contents rather than re-parsing the plan title.
          subscriptionItems: extractBoxItems(sub),
          subscriptionPlan: planName,
          total: amount,
          subtotal: itemSubtotal,
          shippingCost: shippingAmount,
          deliveryCost: shippingAmount,
          storeCreditApplied: 0,
          discountApplied: null,
          fulfillmentStatus: 'Unfulfilled',
          paymentStatus: 'Paid',
          paymentMethod: 'Worldpay Recurring Subscription',
          worldpayTxId: chargeResult?.id || transactionReference,
          // Always the gateway REFERENCE, never the payment id. Worldpay's
          // webhooks identify a payment by transactionReference, so this is the
          // field that lets an inbound event find this order. When Worldpay
          // returns a payment id, worldpayTxId holds that instead, and without
          // keeping the reference here the webhook matches nothing.
          gatewayTxId: transactionReference,
          worldpayAuthCode: chargeResult?.authCode || null,
          gatewayAuthCode: chargeResult?.authCode || null,
          cardBrand: 'Worldpay Stored Card',
          deliveryMethod: sub.deliveryMethod || 'Royal Mail Tracked 24/48',
          carrier: 'Royal Mail',
          tags: ['Storefront', 'Subscription Order', 'Worldpay Recurring'],
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
            ' at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          subscriptionId: subId,
          isSubscription: true,
          // The order this plan was originally bought with. Renewals used to
          // carry only the subscription id, so an admin looking at a renewal had
          // no way back to the checkout it came from.
          parentOrderId: sub.sourceOrderId ? String(sub.sourceOrderId) : null,
          isRenewal: true,
          billingPeriodStart: periodStart.toISOString(),
          data: {
            subscriptionId: subId,
            parentOrderId: sub.sourceOrderId ? String(sub.sourceOrderId) : null,
            isRenewal: true,
            billingPeriodStart: periodStart.toISOString(),
            // The reference Worldpay booked this payment under: this order's id
            // under the SUB-ORD- prefix, so a gateway record maps straight onto
            // this order.
            transactionReference,
            schemeReference: chargeResult?.schemeReference || schemeReference,
            paymentMethod: 'Worldpay Access MIT',
            recurringRenewal: true,
            shippingCost: shippingAmount,
            subtotal: itemSubtotal
          },
          createdAt: new Date().toISOString()
        };

        // saveSingleOrder is the single funnel for order persistence AND for the
        // customer/admin notifications and Klaviyo events. Nothing is sent here.
        try {
          const { saveSingleOrder } = await import('../routes/orders');
          await saveSingleOrder(newOrderData);
        } catch (ordErr) {
          console.warn('[Subscription Worker] Order save fallback:', ordErr);
          const storedOrders: any[] = (await fetchResource('orders')) || [];
          storedOrders.unshift(newOrderData);
          await saveResource('orders', storedOrders);
        }

        // Read the order back before the schedule is allowed to move. The money
        // is taken by this point, so an order that did not persist must NOT look
        // like a completed period: leaving the schedule alone keeps it due, and
        // the retry presents the same reference, which Worldpay refuses as a
        // duplicate — at which point the order is written from that path instead
        // of the card being charged a second time.
        const orderPersisted = await renewalOrderExists(newOrderId);
        if (!orderPersisted) {
          console.error(
            `[RENEWAL ORDER NOT PERSISTED] Sub ${subId} was charged ${currency} ${amount.toFixed(2)} under ` +
              `reference ${transactionReference}, but order ${newOrderId} is in neither store. The schedule ` +
              `is deliberately NOT advanced, so the next run retries this same reference rather than ` +
              `billing again. Payload: ${JSON.stringify(newOrderData).slice(0, 1500)}`
          );
          failed++;
          results.push({
            id: subId,
            status: 'charged_order_missing',
            orderId: newOrderId,
            transactionReference,
            nextBillingDate: 'unchanged (still due)'
          });
          continue;
        }

        // Optionally auto-register a Royal Mail shipment. Off by default so the
        // renewal confirmation is not immediately followed by a dispatch email.
        try {
          const { getRoyalMailSettings, createRoyalMailShipment } = await import('./royalMailService');
          const rmSettings = await getRoyalMailSettings();
          const hasKey = Boolean(rmSettings.apiKey || process.env.ROYAL_MAIL_API_KEY || process.env.RM_API_KEY);
          if (rmSettings.enabled && rmSettings.autoCreateShipmentOnPayment && hasKey) {
            createRoyalMailShipment(newOrderId, {
              serviceCode: rmSettings.defaultServiceCode,
              weightGrams: rmSettings.defaultWeightGrams || 350
            }).catch(err => {
              console.warn(
                `[Subscription Worker] Background Royal Mail shipment note for #${newOrderId}:`,
                err?.message
              );
            });
          }
        } catch (_rmErr) {}

        // 4. Record the successful payment against the subscription
        const updateData: Record<string, any> = {
          lastPaymentStatus: 'authorized',
          lastPaymentId: chargeResult?.id || transactionReference,
          lastPaymentAt: new Date(),
          worldpayTransactionId: chargeResult?.id || sub.worldpayTransactionId,
          worldpayTokenHref: chargeResult?.tokenHref || tokenHref || null,
          worldpaySchemeReference: chargeResult?.schemeReference || schemeReference,
          nextBillingDate: claimedNextBilling,
          failedPaymentCount: 0
        };

        // A scheduled price that has now been charged becomes the standing one.
        // Done only on success: promoting it after a declined payment would
        // leave the customer on a new price they were never actually charged.
        if (promotePendingAmount) {
          updateData.amount = amount;
          Object.assign(updateData, clearedPendingFields());
          console.log(
            `[Subscription Worker] Sub ${subId}: scheduled price £${amount.toFixed(2)} is now in force.`
          );
        }
        await persistSubscriptionUpdate(subId, updateData);

        // Update customer stats and next payment date
        try {
          const customers: any[] = (await fetchResource('customers')) || [];
          const foundCust = customers.find(
            (c: any) => String(c.email).toLowerCase().trim() === customerEmail
          );
          if (foundCust) {
            foundCust.ordersCount = (foundCust.ordersCount || 0) + 1;
            foundCust.amountSpent = Number(((foundCust.amountSpent || 0) + amount).toFixed(2));
            foundCust.nextPayment = claimedNextBilling.toISOString().split('T')[0];
            foundCust.subStatus = 'active';
            foundCust.subscriptionStatus = 'Active Subscriber';
            await saveResource('customers', customers);
          }
        } catch (_e) {}

        succeeded++;
        results.push({
          id: subId,
          status: 'succeeded',
          orderId: newOrderId,
          nextBillingDate: claimedNextBilling.toISOString(),
          transactionReference
        });
      } catch (chargeErr: any) {
        console.error(`[Subscription Worker] Charge FAILED for sub ${subId}:`, chargeErr.message);
        failed++;

        const newFailedCount = (sub.failedPaymentCount || 0) + 1;
        const isPastDue = newFailedCount >= MAX_CONSECUTIVE_FAILURES;

        // `nextBillingDate` is left exactly as it was. A failed charge has not
        // billed the period, so the period is still owed: the date stays put and
        // the next run presents the same reference again. It used to be pushed to
        // "tomorrow" (and nulled once past due), which silently forgave the
        // period the card had just declined.
        //
        // Since the date no longer moves, the retry is stopped by taking the
        // subscription out of 'active' after MAX_CONSECUTIVE_FAILURES rather than
        // by moving the goalposts.
        const failUpdate: any = {
          lastPaymentStatus: 'failed',
          lastPaymentError: String(chargeErr.message || chargeErr).slice(0, 500),
          failedPaymentCount: newFailedCount,
          status: isPastDue ? 'past_due' : 'active'
        };
        await persistSubscriptionUpdate(subId, failUpdate);

        results.push({
          id: subId,
          status: 'failed',
          error: chargeErr.message,
          transactionReference,
          nextBillingDate: 'unchanged (still due)',
          retryScheduled: isPastDue
            ? `none — ${newFailedCount} consecutive failures, subscription set to past_due`
            : 'next worker run'
        });
      }
    }

    return {
      processed: subscriptions.length,
      succeeded,
      failed,
      details: results
    };
  } finally {
    isProcessing = false;
  }
}

let cronIntervalHandle: NodeJS.Timeout | null = null;

/**
 * Should this process run its own renewal timer?
 *
 * Not under serverless. `createExpressApp()` runs on every cold start, so an
 * unconditional timer meant each new lambda instance fired a renewal run three
 * seconds after boot and then every five minutes — as many concurrent runs as
 * there were warm instances, each with its own `isProcessing` flag and blind to
 * the others. Ordinary traffic could therefore start a charge run at any hour.
 *
 * In production the schedule is declared once, in vercel.json, as an hourly call
 * to /api/subscriptions/cron. That is the single natural trigger. A long-running
 * server (local `npm run dev`, or a container) has no such scheduler, so it
 * keeps the timer.
 *
 * SUBSCRIPTION_WORKER=1 forces it on, =0 forces it off.
 */
function workerShouldRun(): { run: boolean; reason: string } {
  const explicit = String(process.env.SUBSCRIPTION_WORKER ?? '').trim().toLowerCase();
  if (explicit === '1' || explicit === 'true') {
    return { run: true, reason: 'SUBSCRIPTION_WORKER is set' };
  }
  if (explicit === '0' || explicit === 'false') {
    return { run: false, reason: 'SUBSCRIPTION_WORKER is disabled' };
  }

  const serverless = Boolean(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTIONS_WORKER_RUNTIME
  );
  return serverless
    ? { run: false, reason: 'serverless runtime — the scheduled cron ping is the trigger' }
    : { run: true, reason: 'long-running server' };
}

/**
 * Initializes the background recurring worker timer.
 */
export function startSubscriptionRenewalWorker(intervalMs: number = 5 * 60 * 1000) {
  if (cronIntervalHandle) {
    clearInterval(cronIntervalHandle);
  }

  const { run, reason } = workerShouldRun();
  if (!run) {
    console.log(
      `[Subscription Worker] In-process timer NOT started (${reason}). ` +
        `Renewals run when /api/subscriptions/cron is called.`
    );
    return;
  }

  console.log(`[Subscription Worker] Background worker initialized (interval: ${intervalMs / 1000}s, ${reason}).`);

  // Run shortly after startup
  setTimeout(() => {
    processDueSubscriptions().catch(err => console.error('[Subscription Worker] Startup run error:', err));
  }, 3000);

  // Periodic recurring check
  cronIntervalHandle = setInterval(() => {
    processDueSubscriptions().catch(err => console.error('[Subscription Worker] Periodic run error:', err));
  }, intervalMs);
}
