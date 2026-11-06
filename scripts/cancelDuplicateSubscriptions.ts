/**
 * Cancels subscriptions that were created in error for an order that already
 * had one — and nothing else.
 *
 *   npx tsx scripts/cancelDuplicateSubscriptions.ts --order=PS65700 --cancel=sub_a,sub_b          # dry run
 *   npx tsx scripts/cancelDuplicateSubscriptions.ts --order=PS65700 --cancel=sub_a,sub_b --apply
 *
 * Why this exists instead of POST /api/subscriptions/cancel
 * ---------------------------------------------------------
 * That route cancels a customer's plan. It tags the plan's ORDERS "Subscription
 * Cancelled", sets their subscriptionDetails to Cancelled, and updates the
 * customer record. A duplicate shares its order with the real subscription, so
 * cancelling a duplicate through it would mark the customer's genuine, still
 * active plan as cancelled everywhere an admin looks.
 *
 * This changes only the named subscription rows: status, cancelledAt and a
 * cancellationReason saying what happened. No order, no customer record, no
 * email, no Klaviyo event.
 *
 * Guard rails — every id must pass all of them or nothing is written:
 *   - it exists and belongs to the named order (sourceOrderId);
 *   - it is currently active, so an already-cancelled plan is not rewritten;
 *   - it is NOT the oldest subscription for that order. The oldest is the one
 *     the checkout created; the rest came later. Pass --allow-oldest only when
 *     you have established the original is itself wrong;
 *   - the order must be left with at most one active subscription afterwards.
 *
 * Without --apply it prints what it would do and writes nothing.
 */
import 'dotenv/config';
import { fetchResource, getDb, saveResource } from '../serverDb';
import { prisma } from '../src/lib/prisma';

const args = process.argv.slice(2);
const pick = (flag: string) =>
  (args.find(a => a.startsWith(flag + '=')) || '').split('=').slice(1).join('=') || null;

const ORDER_ID = pick('--order');
const CANCEL_IDS = (pick('--cancel') || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const APPLY = args.includes('--apply');
const ALLOW_OLDEST = args.includes('--allow-oldest');

if (!ORDER_ID || CANCEL_IDS.length === 0) {
  console.error('Usage: npx tsx scripts/cancelDuplicateSubscriptions.ts --order=<ORDER_ID> --cancel=<sub_id,...> [--apply]');
  process.exit(1);
}

const REASON = `Duplicate subscription for order ${ORDER_ID}, created in error by the subscription repair sweep. The customer's original subscription is unaffected.`;

type Row = { id: string; status: string; createdAt: string; nextBillingDate: string | null };

async function subscriptionsForOrder(orderId: string): Promise<Row[]> {
  if (await getDb()) {
    const rows = await prisma.subscription.findMany({
      where: { sourceOrderId: orderId },
      select: { id: true, status: true, createdAt: true, nextBillingDate: true },
      orderBy: { createdAt: 'asc' }
    });
    return rows.map(r => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      nextBillingDate: r.nextBillingDate ? r.nextBillingDate.toISOString() : null
    }));
  }
  // No database: the store is the only record.
  const stored: any[] = (await fetchResource('subscriptions')) || [];
  return stored
    .filter((s: any) => String(s?.sourceOrderId || '') === orderId)
    .map((s: any) => ({
      id: String(s.id),
      status: String(s.status || ''),
      createdAt: new Date(s.createdAt || 0).toISOString(),
      nextBillingDate: s.nextBillingDate ? new Date(s.nextBillingDate).toISOString() : null
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function main() {
  console.log(`\n=== ${APPLY ? 'APPLY' : 'DRY RUN'}: cancel duplicates for ${ORDER_ID} ===\n`);

  const rows = await subscriptionsForOrder(ORDER_ID!);
  if (rows.length === 0) {
    console.log('No subscriptions exist for this order. Nothing to do.');
    return finish(0);
  }

  const oldest = rows[0];
  console.log('Subscriptions for this order, oldest first:');
  for (const r of rows) {
    const marks = [
      r.id === oldest.id ? 'ORIGINAL' : '',
      CANCEL_IDS.includes(r.id) ? 'to cancel' : 'kept'
    ].filter(Boolean).join(', ');
    console.log(`  ${r.id}  ${r.status.padEnd(9)}  created ${r.createdAt}  next ${r.nextBillingDate || '-'}  [${marks}]`);
  }

  // ------------------------------------------------------------ guard rails
  const problems: string[] = [];
  for (const id of CANCEL_IDS) {
    const row = rows.find(r => r.id === id);
    if (!row) {
      problems.push(`${id} does not belong to order ${ORDER_ID}`);
      continue;
    }
    if (row.status !== 'active') {
      problems.push(`${id} is "${row.status}", not active — leaving it alone`);
    }
    if (row.id === oldest.id && !ALLOW_OLDEST) {
      problems.push(`${id} is the ORIGINAL subscription for this order; refusing without --allow-oldest`);
    }
  }

  const activeAfter = rows.filter(r => r.status === 'active' && !CANCEL_IDS.includes(r.id));
  if (activeAfter.length > 1) {
    problems.push(
      `${activeAfter.length} active subscriptions would remain (${activeAfter.map(r => r.id).join(', ')}); ` +
        'the order would still be billed more than once'
    );
  }

  if (problems.length) {
    console.log('\nREFUSED. Nothing was written:');
    for (const p of problems) console.log(`  - ${p}`);
    return finish(1);
  }

  console.log(
    `\nAfter this, ${ORDER_ID} has ${activeAfter.length} active subscription(s)` +
      (activeAfter.length ? `: ${activeAfter.map(r => r.id).join(', ')}` : '') +
      '.'
  );

  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to cancel the rows marked "to cancel".');
    return finish(0);
  }

  // ----------------------------------------------------------------- write
  const now = new Date();

  if (await getDb()) {
    for (const id of CANCEL_IDS) {
      // The renewal cron reads this table, so this is the write that stops billing.
      await prisma.subscription.update({
        where: { id },
        data: { status: 'cancelled', cancelledAt: now, cancellationReason: REASON }
      });
    }
  }

  const stored: any[] = (await fetchResource('subscriptions')) || [];
  const next = stored.map((s: any) =>
    CANCEL_IDS.includes(String(s?.id))
      ? { ...s, status: 'cancelled', cancelledAt: now.toISOString(), cancellationReason: REASON, duplicateOfOrder: ORDER_ID }
      : s
  );
  await saveResource('subscriptions', next);

  const verify = await subscriptionsForOrder(ORDER_ID!);
  console.log('\nNow:');
  for (const r of verify) {
    console.log(`  ${r.id}  ${r.status.padEnd(9)}  next ${r.nextBillingDate || '-'}`);
  }
  const stillActive = verify.filter(r => r.status === 'active').length;
  console.log(`\n${ORDER_ID} now has ${stillActive} active subscription(s).`);
  return finish(stillActive > 1 ? 1 : 0);
}

async function finish(code: number) {
  await prisma.$disconnect().catch(() => {});
  process.exit(code);
}

main().catch(async err => {
  console.error('Failed:', err?.message || err);
  await finish(1);
});
