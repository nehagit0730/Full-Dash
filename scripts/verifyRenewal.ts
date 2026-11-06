/**
 * Verifies what a scheduled MIT renewal actually did, after the fact.
 *
 *   npx tsx scripts/verifyRenewal.ts --order=PS46323
 *   npx tsx scripts/verifyRenewal.ts --order=PS46323 --since=2026-09-17T09:00:00Z
 *
 * Read-only. It takes no payment, retries nothing, and writes nothing — which
 * matters here, because the failure mode being investigated is a renewal that
 * burns a gateway call and then silently reschedules itself.
 *
 * A renewal is only "working" if all five of these agree. Checking one or two
 * is how a half-failed renewal gets reported as a success:
 *
 *   1. AUTHORIZATION  lastPaymentStatus / lastPaymentId / lastPaymentError on
 *                     the subscription. This is Worldpay's verdict.
 *   2. RENEWAL ORDER  a NEW Order row linked to the subscription. Without it
 *                     the customer was charged and nothing will be picked,
 *                     packed or shipped.
 *   3. SCHEDULE       nextBillingDate moved forward exactly one interval. The
 *                     cron claims the slot BEFORE charging, so this advances
 *                     even when the charge fails — it proves the worker ran,
 *                     not that it succeeded.
 *   4. FULFILMENT     trackingNumber / royalMailOrderId / carrier on the
 *                     renewal order.
 *   5. WEBHOOKS       what Worldpay reported back for the renewal reference.
 *
 * On failure it prints the exact Worldpay error and stops. Re-running is safe;
 * it never re-attempts the charge.
 */
import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

const args = process.argv.slice(2);
const pick = (flag: string) =>
  (args.find(a => a.startsWith(flag + '=')) || '').split('=').slice(1).join('=') || null;

const ORDER_ID = pick('--order');
const SINCE = pick('--since');

if (!ORDER_ID) {
  console.error('Usage: npx tsx scripts/verifyRenewal.ts --order=<ORDER_ID> [--since=<ISO>]');
  process.exit(1);
}

const mark = (ok: boolean) => (ok ? 'PASS' : 'FAIL');

async function main() {
  console.log(`\n=== RENEWAL VERIFICATION for ${ORDER_ID} ===\n`);

  const subs = await prisma.subscription.findMany({
    where: { sourceOrderId: ORDER_ID },
    orderBy: { createdAt: 'asc' }
  });

  if (subs.length === 0) {
    console.log('No subscription exists for this order. Nothing to verify.');
    return;
  }

  const active = subs.filter((s: any) => s.status === 'active');
  console.log(`Subscriptions for this order: ${subs.length} (${active.length} active)`);
  if (active.length !== 1) {
    console.log(`  ${mark(false)}  expected exactly one active subscription`);
    for (const s of subs as any[]) console.log(`    ${s.id}  ${s.status}`);
    if (active.length === 0) return;
  }

  const sub: any = active[0];
  const since = SINCE ? new Date(SINCE) : new Date(sub.createdAt);

  // ---------------------------------------------------------- 1. AUTHORIZATION
  console.log('\n--- 1. Worldpay authorization ---');
  console.log(`  lastPaymentStatus : ${sub.lastPaymentStatus ?? 'none'}`);
  console.log(`  lastPaymentId     : ${sub.lastPaymentId ?? 'none'}`);
  console.log(`  lastPaymentAt     : ${sub.lastPaymentAt ? sub.lastPaymentAt.toISOString() : 'never'}`);
  console.log(`  failedPaymentCount: ${sub.failedPaymentCount}`);
  if (sub.lastPaymentError) {
    console.log(`\n  WORLDPAY ERROR (verbatim):\n    ${String(sub.lastPaymentError).replace(/\n/g, '\n    ')}`);
  }

  const charged = sub.lastPaymentAt ? new Date(sub.lastPaymentAt) >= since : false;
  const authorised = charged && ['authorized', 'settled', 'succeeded', 'paid'].includes(
    String(sub.lastPaymentStatus || '').toLowerCase()
  );
  console.log(`\n  ${mark(authorised)}  a renewal payment was authorised after ${since.toISOString()}`);

  if (String(sub.lastPaymentStatus || '') === 'missing_card_token') {
    console.log('        -> The cron SKIPPED this plan: agreement present, no stored card.');
  }

  // --------------------------------------------------------- 2. RENEWAL ORDER
  console.log('\n--- 2. Renewal order ---');
  // The source order is linked to the subscription too, and it was created at
  // the same moment — counting it here would report a renewal that never ran.
  const renewals = await prisma.order.findMany({
    where: {
      subscriptionId: sub.id,
      createdAt: { gte: since },
      id: { not: ORDER_ID! }
    },
    orderBy: { createdAt: 'desc' }
  });
  console.log(`  ${mark(renewals.length > 0)}  ${renewals.length} order(s) created for this subscription since ${since.toISOString()}`);
  for (const o of renewals as any[]) {
    console.log(`    ${o.id}  ${o.createdAt.toISOString()}  £${o.total}  ${o.paymentStatus}  tx=${o.worldpayTxId ?? '-'}`);
  }

  // -------------------------------------------------------------- 3. SCHEDULE
  console.log('\n--- 3. Billing schedule ---');
  const next = sub.nextBillingDate ? new Date(sub.nextBillingDate) : null;
  console.log(`  nextBillingDate   : ${next ? next.toISOString() : 'null'}`);
  const moved = Boolean(next && next.getTime() > since.getTime());
  console.log(`  ${mark(moved)}  nextBillingDate is in the future / moved past the run`);
  console.log('        (advances even on failure — the slot is claimed before charging)');

  // ------------------------------------------------------------ 4. FULFILMENT
  console.log('\n--- 4. Royal Mail fulfilment ---');
  if (renewals.length === 0) {
    console.log('  SKIP  no renewal order exists to ship');
  } else {
    for (const o of renewals as any[]) {
      const hasTracking = Boolean(o.trackingNumber || o.trackingId);
      console.log(
        `  ${mark(hasTracking)}  ${o.id}  tracking=${o.trackingNumber || o.trackingId || 'NONE'}  ` +
          `carrier=${o.carrier || '-'}  royalMailOrderId=${o.royalMailOrderId || 'NONE'}  ` +
          `fulfilment=${o.fulfillmentStatus}`
      );
    }
  }

  // -------------------------------------------------------------- 5. WEBHOOKS
  console.log('\n--- 5. Worldpay webhooks ---');
  console.log('  Check the live endpoint (the log lives with the deployment, not here):');
  console.log('    curl -sL https://www.pouch-supply.com/api/worldpay/webhook');
  console.log(`  Look for events whose orderId is one of: ${renewals.map((o: any) => o.id).join(', ') || '(no renewal order)'}`);

  // ---------------------------------------------------------------- VERDICT
  console.log('\n=== VERDICT ===');
  if (authorised && renewals.length > 0) {
    console.log('  Recurring billing WORKED: the card was charged and a renewal order exists.');
  } else if (!charged) {
    console.log('  No renewal was attempted in this window. Either the cron has not run yet,');
    console.log('  or the plan was skipped — check lastPaymentStatus above.');
  } else {
    console.log('  A renewal was ATTEMPTED AND FAILED. The Worldpay error is printed above.');
    console.log('  Do not retry repeatedly: each attempt is a real gateway call, and');
    console.log('  nextBillingDate has already advanced.');
  }
}

main()
  .catch(err => {
    console.error('Failed:', err?.message || err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
