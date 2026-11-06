/**
 * Recovers the Worldpay stored-credential reference for subscriptions that
 * appear to have none.
 *
 * Worldpay has been issuing a usable reference on every subscription payment all
 * along. It arrives on the payment query as:
 *
 *   "transactionType": "cardOnFile",
 *   "scheme": { "reference": "MRLZRGKT60908  " }
 *
 * `extractSchemeReference` did not look at `scheme.reference`, so nothing was
 * ever saved and every plan reported "no stored-card mandate". The extractor is
 * fixed; this re-reads the reference for subscriptions already created, so they
 * can renew without asking the customer to subscribe again.
 *
 * Nothing is invented: every value is read back from Worldpay for that
 * subscription's own initial payment.
 *
 * `transactionType` is reported alongside, because it is the difference between
 * a real card-on-file mandate and a one-off payment that merely happens to have
 * a scheme reference:
 *   - cardOnFile -> the customer agreement was established; safe to charge MIT
 *   - oneTime    -> no agreement was taken; the reference alone may be refused
 *
 * Usage:
 *   npx tsx scripts/backfillWorldpayMandates.ts             # report only
 *   npx tsx scripts/backfillWorldpayMandates.ts --apply     # save references
 *   npx tsx scripts/backfillWorldpayMandates.ts --apply --include-onetime
 */
import 'dotenv/config';
import { fetchResource, saveResource } from '../serverDb';
import {
  extractSchemeReference,
  extractTokenHref,
  isPlaceholderCredential,
  isUsableRecurringHref,
  isUsableTokenHref
} from '../backend/services/worldpaySubscription';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const INCLUDE_ONETIME = args.includes('--include-onetime');
const tag = APPLY ? '[APPLY]' : '[DRY-RUN]';

const BASE = process.env.WORLDPAY_BASE_URL || 'https://access.worldpay.com';
const ENTITY = process.env.WORLDPAY_ENTITY || process.env.WORLDPAY_ENTITY_ID || '';
const QUERY_ACCEPT = 'application/vnd.worldpay.payment-queries-v1.hal+json';

function authHeader(): string | null {
  const u = process.env.WORLDPAY_API_USERNAME;
  const p = process.env.WORLDPAY_API_PASSWORD;
  if (!u || !p) return null;
  return 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');
}

async function lookupPayment(reference: string, auth: string): Promise<any | null> {
  const url =
    `${BASE}/paymentQueries/payments?transactionReference=${encodeURIComponent(reference)}` +
    `&entityReference=${encodeURIComponent(ENTITY)}`;
  try {
    const res = await fetch(url, { headers: { Authorization: auth, Accept: QUERY_ACCEPT } });
    if (!res.ok) return null;
    const data: any = await res.json().catch(() => null);
    return data?._embedded?.payments?.[0] || null;
  } catch {
    return null;
  }
}

/** Every transaction reference that might have created this subscription. */
function candidateReferences(sub: any, orders: any[]): string[] {
  const refs = new Set<string>();
  const add = (v: any) => {
    const s = String(v || '').trim();
    if (s && !isPlaceholderCredential(s)) refs.add(s);
  };
  add(sub.sourceOrderId);
  add(sub.worldpayTransactionId);
  add(sub.lastPaymentId);
  // Orders that name this plan.
  for (const o of orders) {
    if (String(o?.subscriptionId || '') === String(sub.id)) add(o.id);
    if (String(o?.data?.subscriptionId || '') === String(sub.id)) add(o.id);
  }
  return [...refs];
}

async function main() {
  const auth = authHeader();
  if (!auth || !ENTITY) {
    console.error('Worldpay credentials or entity are not configured.');
    process.exit(1);
  }
  console.log(`${tag} entity ${ENTITY} @ ${BASE}\n`);

  const [subs, orders] = await Promise.all([
    fetchResource('subscriptions') as Promise<any[]>,
    fetchResource('orders') as Promise<any[]>
  ]);

  // A subscription needs this script if it is missing EITHER credential.
  // Worldpay's integration support confirmed the subsequent payment must carry
  // the card token href, so a plan holding only a scheme reference is still
  // unchargeable and still belongs in this list.
  const needing = (subs || []).filter(s => {
    const scheme = s?.worldpaySchemeReference;
    const href = s?.worldpayRecurringHref || s?.recurringHref;
    const hasScheme = Boolean(scheme) && !isPlaceholderCredential(scheme);
    const hasToken = isUsableTokenHref(s?.worldpayTokenHref);
    return !hasToken || (!hasScheme && !isUsableRecurringHref(href));
  });

  console.log(`${subs?.length || 0} subscription(s); ${needing.length} without a complete credential.\n`);
  if (needing.length === 0) return;

  const updates = new Map<string, any>();
  let tokensFound = 0;

  for (const sub of needing) {
    const refs = candidateReferences(sub, orders || []);
    if (refs.length === 0) {
      console.log(`${sub.id} (${sub.customerEmail}) — no transaction reference to look up, skipped.`);
      continue;
    }

    let found:
      | { reference: string; scheme: string | null; tokenHref: string | null; txType: string; paymentId: string }
      | null = null;
    for (const reference of refs) {
      const payment = await lookupPayment(reference, auth);
      if (!payment) continue;
      const scheme = extractSchemeReference(payment);
      const tokenHref = extractTokenHref(payment);
      if (!scheme && !tokenHref) continue;
      found = {
        reference,
        scheme,
        tokenHref,
        txType: String(payment.transactionType || 'unknown'),
        paymentId: String(payment.paymentId || '')
      };
      break;
    }

    if (!found) {
      console.log(
        `${sub.id} (${sub.customerEmail}) — Worldpay returned neither a scheme reference nor a ` +
          `token for ${refs.join(', ')}.`
      );
      continue;
    }

    const mandateOk = found.txType === 'cardOnFile';
    const willWrite = mandateOk || INCLUDE_ONETIME;
    if (found.tokenHref) tokensFound++;
    console.log(
      `${sub.id} (${sub.customerEmail}) — from ${found.reference}: ` +
        `scheme=${found.scheme || 'none'} token=${found.tokenHref ? 'yes' : 'NONE'} txType=${found.txType}` +
        (mandateOk ? '' : `  << not a card-on-file mandate${willWrite ? ', writing anyway' : ', skipped'}`)
    );

    if (!willWrite) continue;
    updates.set(String(sub.id), {
      ...sub,
      worldpaySchemeReference: found.scheme || sub.worldpaySchemeReference || null,
      worldpayTokenHref: found.tokenHref || sub.worldpayTokenHref || null,
      worldpayTransactionId: sub.worldpayTransactionId || found.paymentId || found.reference,
      // Recorded so the difference between a true mandate and a bare reference
      // stays visible after the fact.
      worldpayTransactionType: found.txType,
      mandateRecoveredAt: new Date().toISOString(),
      mandateRecoveredFromOrderId: found.reference
    });
  }

  if (needing.length > 0 && tokensFound === 0) {
    console.log(
      `\nNo card token was recoverable for any subscription. Worldpay only stores a card when the ` +
        `payment page was created with createToken, and only publishes the token href on the ` +
        `tokenCreated webhook — so subscriptions taken before that was in place have to re-authorise ` +
        `rather than be backfilled.`
    );
  }

  if (updates.size === 0) {
    console.log(`\n${tag} Nothing to write.`);
    return;
  }

  if (!APPLY) {
    console.log(`\n${tag} Re-run with --apply to save ${updates.size} reference(s).`);
    return;
  }

  const merged = (subs || []).map(s => updates.get(String(s.id)) || s);
  await saveResource('subscriptions', merged);
  console.log(`\n${tag} Saved ${updates.size} reference(s) to Neon.`);
}

main().catch(err => {
  console.error('[backfillWorldpayMandates] Failed:', err);
  process.exit(1);
});
