/**
 * Reports whether a subscription order ended up with a stored Worldpay card.
 *
 *   npx tsx scripts/inspectSubscriptionToken.ts PS65700 --worldpay
 *   npx tsx scripts/inspectSubscriptionToken.ts PS65700 --assign-token=<href> --subscription=<id>
 *
 * Read-only: it queries the database and, with --worldpay, asks Worldpay about
 * the payment itself. It writes nothing and takes no payment.
 *
 * The three things that decide whether a plan can renew are printed together,
 * because only their combination is meaningful:
 *
 *   worldpayTokenHref       the CARD. Required. Without it a renewal has no
 *                           payment instrument to present.
 *   worldpaySchemeReference the AGREEMENT. Necessary but not sufficient — this
 *                           is what PS25640 had on its own, and it could not
 *                           renew.
 *   transactionType         cardOnFile means the mandate was taken; oneTime
 *                           means the checkout fell back to an untokenised sale
 *                           and no token will ever exist for it.
 */
import 'dotenv/config';
import { fetchResource, saveResource } from '../serverDb';
import { prisma } from '../src/lib/prisma';
import {
  extractSchemeReference,
  extractTokenHref,
  fetchTokensForNamespace,
  isUsableTokenHref,
  selectTokenForSubscription
} from '../backend/services/worldpaySubscription';

const args = process.argv.slice(2);
const ORDER_ID = args.find(a => !a.startsWith('--'));
const ASK_WORLDPAY = args.includes('--worldpay');
const pick = (flag: string) => (args.find((a) => a.startsWith(flag + '=')) || '').split('=').slice(1).join('=') || null;
const ASSIGN_TOKEN = pick('--assign-token');
const ASSIGN_SUB = pick('--subscription');

if (!ORDER_ID) {
  console.error('Usage: npx tsx scripts/inspectSubscriptionToken.ts <ORDER_ID> [--worldpay]');
  console.error('       ... --assign-token=<href> --subscription=<id>   attach a card by hand');
  process.exit(1);
}

const BASE = process.env.WORLDPAY_BASE_URL || 'https://access.worldpay.com';
const ENTITY = process.env.WORLDPAY_ENTITY || process.env.WORLDPAY_ENTITY_ID || '';
const QUERY_ACCEPT = 'application/vnd.worldpay.payment-queries-v1.hal+json';

function authHeader(): string | null {
  const u = process.env.WORLDPAY_API_USERNAME;
  const p = process.env.WORLDPAY_API_PASSWORD;
  if (!u || !p) return null;
  return 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');
}

async function lookupPayment(reference: string): Promise<any | null> {
  const auth = authHeader();
  if (!auth) {
    console.log('  (no Worldpay credentials in this environment — skipping the gateway query)');
    return null;
  }
  const url =
    `${BASE}/paymentQueries/payments?transactionReference=${encodeURIComponent(reference)}` +
    `&entityReference=${encodeURIComponent(ENTITY)}`;
  try {
    const res = await fetch(url, { method: 'GET', headers: { Authorization: auth, Accept: QUERY_ACCEPT } });
    if (!res.ok) {
      console.log(`  Worldpay query returned HTTP ${res.status}`);
      return null;
    }
    const data: any = await res.json().catch(() => null);
    return data?._embedded?.payments?.[0] || data?.payments?.[0] || null;
  } catch (err: any) {
    console.log('  Worldpay query failed:', err?.message);
    return null;
  }
}

async function main() {
  console.log(`\n=== ${ORDER_ID} ===\n`);

  const subs: any[] = (await fetchResource('subscriptions')) || [];
  const matches = subs.filter(
    (s: any) =>
      String(s?.sourceOrderId || '') === ORDER_ID ||
      String(s?.worldpayTransactionId || '') === ORDER_ID ||
      String(s?.lastPaymentId || '') === ORDER_ID
  );

  if (!matches.length) {
    console.log('No subscription is linked to this order.');
    console.log('Either the order was not a subscription, or the payment was never verified.');
  }

  for (const s of matches) {
    const hasCard = isUsableTokenHref(s.worldpayTokenHref);
    console.log(`subscription        : ${s.id}`);
    console.log(`status              : ${s.status}`);
    console.log(`customer            : ${s.customerEmail}`);
    console.log(`amount              : ${s.amount} ${s.currency || 'GBP'} every ${s.billingInterval}`);
    console.log(`nextBillingDate     : ${s.nextBillingDate}`);
    console.log('');
    console.log(`STORED CARD (token) : ${s.worldpayTokenHref || 'MISSING'}`);
    console.log(`agreement (scheme)  : ${s.worldpaySchemeReference || 'none'}`);
    console.log(`recurring href      : ${s.worldpayRecurringHref || 'none'}`);
    if (s.tokenisationDowngraded) {
      console.log('tokenisation        : REFUSED at checkout — this plan can never renew');
    }
    if (s.tokenLookupExhaustedAt) {
      console.log(`lookup exhausted    : ${s.tokenLookupExhaustedAt} (Worldpay holds no token for it)`);
    }
    console.log('');
    console.log(hasCard ? 'VERDICT: recurring payments ARE set up.' : 'VERDICT: recurring payments are NOT set up — no card is stored.');
    console.log('');

    // The typed Neon row is what the renewal worker reads, so confirm it agrees
    // with the blob rather than assuming the sync ran.
    const row = await prisma.subscription
      .findUnique({ where: { id: String(s.id) }, select: { worldpayTokenHref: true, worldpaySchemeReference: true } })
      .catch(() => null);
    if (!row) {
      console.log('Neon Subscription row: NOT FOUND (the typed table is out of sync with the store)');
    } else {
      const agrees = String(row.worldpayTokenHref || '') === String(s.worldpayTokenHref || '');
      console.log(`Neon Subscription row: token=${row.worldpayTokenHref || 'NULL'} ${agrees ? '(agrees)' : '(DISAGREES with the store copy)'}`);
    }
  }

  const parked: any[] = (await fetchResource('worldpayPendingTokens')) || [];
  const live = parked.filter((t: any) => isUsableTokenHref(t?.tokenHref));
  console.log(`\nParked tokens awaiting a subscription: ${live.length}`);
  for (const t of live) {
    console.log(`  ref=${t.reference || 'n/a'} namespace=${t.namespace || 'n/a'} receivedAt=${t.receivedAt}`);
  }

  if (ASK_WORLDPAY) {
    console.log('\n=== What Worldpay holds for this payment ===');
    const payment = await lookupPayment(ORDER_ID);
    if (!payment) {
      console.log('  no payment published for this reference');
    } else {
      const token = extractTokenHref(payment);
      console.log(`  lastEvent        : ${payment.lastEvent || payment.outcome}`);
      console.log(`  transactionType  : ${payment.transactionType || 'unknown'}`);
      console.log(`  scheme.reference : ${extractSchemeReference(payment) || 'none'}`);
      console.log(`  token on payment : ${token || 'NONE'}`);
      if (!token) {
        // Established on entity PO4094415264: a payment query does NOT expose a
        // token link even when Worldpay is holding a card. This used to tell
        // people the card was gone and the customer had to re-subscribe, which
        // was wrong and would have cost a sale. The tokens service is the
        // authority, so ask it instead of concluding anything here.
        console.log("  -> A payment query does not expose token links on this account, so this");
        console.log("     proves nothing either way. The tokens service below is the authority.");
      }
    }
  }


  // What Worldpay is actually holding for this shopper, and whether any of it
  // can be proven to belong to this subscription.
  for (const s of matches) {
    const email = String(s.customerEmail || '').trim().toLowerCase();
    if (!email) continue;
    console.log(`\n=== Stored cards Worldpay holds for ${email} ===`);
    const tokens = await fetchTokensForNamespace(email);
    if (!tokens.length) {
      console.log('  none');
      continue;
    }
    for (const t of tokens) {
      console.log(
        `  tokenId=${t.tokenId || '?'}  scheme=${t.schemeTransactionReference || 'none'}  expires=${t.expiryDateTime || '?'}`
      );
      console.log(`    ${t.href}`);
    }
    const selection = selectTokenForSubscription(tokens, {
      namespace: email,
      schemeReference: s.worldpaySchemeReference
    });
    console.log(`  MATCH: ${selection.token ? selection.token.href : 'none'}`);
    console.log(`  WHY  : ${selection.reason}`);
  }

  // ------------------------------------------------------- deliberate assignment
  //
  // The automatic matcher refuses anything it cannot prove, which is correct for
  // an unattended sweep but leaves no route for a case a human HAS established —
  // for example a card whose agreement predates the subscription it belongs to.
  // This is that route, and it is deliberately awkward: both the subscription and
  // the exact token href must be named, so nothing can be assigned by accident.
  if (ASSIGN_TOKEN) {
    if (!ASSIGN_SUB) {
      console.log('\n--assign-token also needs --subscription=<id>. Nothing was written.');
      await prisma.$disconnect().catch(() => {});
      return;
    }
    if (!isUsableTokenHref(ASSIGN_TOKEN)) {
      console.log(`\n"${ASSIGN_TOKEN}" is not a Worldpay token href. Nothing was written.`);
      await prisma.$disconnect().catch(() => {});
      return;
    }

    const target = subs.find((s: any) => String(s?.id) === ASSIGN_SUB);
    if (!target) {
      console.log(`\nNo subscription ${ASSIGN_SUB} is linked to ${ORDER_ID}. Nothing was written.`);
      await prisma.$disconnect().catch(() => {});
      return;
    }

    console.log('\n=== Assigning a stored card by hand ===');
    console.log(`  subscription : ${target.id} (${target.customerEmail})`);
    console.log(`  was          : ${target.worldpayTokenHref || 'no card'}`);
    console.log(`  now          : ${ASSIGN_TOKEN}`);

    const next = ((await fetchResource('subscriptions')) || []).map((s: any) =>
      String(s?.id) === ASSIGN_SUB
        ? { ...s, worldpayTokenHref: ASSIGN_TOKEN, tokenAssignedByHandAt: new Date().toISOString() }
        : s
    );
    await saveResource('subscriptions', next);
    await prisma.subscription
      .update({ where: { id: ASSIGN_SUB }, data: { worldpayTokenHref: ASSIGN_TOKEN } })
      .catch((e: any) => console.log('  (typed Neon row not updated:', e?.message, ')'));

    const check = await prisma.subscription
      .findUnique({ where: { id: ASSIGN_SUB }, select: { worldpayTokenHref: true } })
      .catch(() => null);
    console.log(`  Neon now reports: ${check?.worldpayTokenHref || 'NULL'}`);
    // There is no on-demand charge endpoint any more — see the note where
    // /api/subscriptions/charge used to be. To bill early, move the due date and
    // let the renewal worker take it.
    console.log('  To confirm it before the renewal date, bring nextBillingDate forward and run');
    console.log('  the renewal worker (GET /api/subscriptions/cron).');
  }

  await prisma.$disconnect().catch(() => {});
}

main();
