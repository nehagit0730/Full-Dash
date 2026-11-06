/**
 * Removes abandoned pending checkouts left over from testing.
 *
 *   npx tsx scripts/purgePendingCheckouts.ts            # dry run
 *   npx tsx scripts/purgePendingCheckouts.ts --apply
 *
 * A pending checkout is the record of what a shopper was buying between
 * starting a payment and the gateway confirming it. No order exists until the
 * payment succeeds, so it is the ONLY record of the basket if a callback has to
 * be replayed — which is exactly why this refuses to touch a recent one.
 *
 * Guard rails, any of which stops the run:
 *   - nothing newer than MIN_AGE_HOURS is deleted, because that could be a
 *     shopper still at the payment page;
 *   - a pending checkout whose orderId matches a real order is never deleted;
 *   - it touches the 'pending_checkouts' resource and nothing else, and the
 *     counts of orders, customers, subscriptions, products, collections, pages
 *     and blogs are compared before and after.
 */
import 'dotenv/config';
import { fetchResource, getDb } from '../serverDb';
import { prisma } from '../src/lib/prisma';

const APPLY = process.argv.includes('--apply');

/** A checkout younger than this may still be in progress. */
const MIN_AGE_HOURS = 48;

const RESOURCE = 'pending_checkouts';

/** Everything that must be identical before and after. */
const UNTOUCHED = ['orders', 'customers', 'subscriptions', 'products', 'collections', 'customPages', 'blogs', 'files', 'discounts'];

const createdAtOf = (p: any): number => Number(p?.createdAt) || Date.parse(p?.createdAt) || 0;

async function snapshot(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const r of UNTOUCHED) counts[r] = ((await fetchResource(r)) || []).length;
  return counts;
}

async function main() {
  console.log(`\n=== ${APPLY ? 'APPLY' : 'DRY RUN'}: purge abandoned pending checkouts ===\n`);

  if (!(await getDb())) {
    console.error('Neon is unreachable. Refusing to run.');
    process.exitCode = 1;
    return;
  }

  const pending: any[] = (await fetchResource(RESOURCE)) || [];
  const orders: any[] = (await fetchResource('orders')) || [];
  const orderIds = new Set(orders.map(o => String(o.id)));

  const before = await snapshot();
  const rowsBefore = await prisma.storeResource.count({ where: { resource: RESOURCE } });

  console.log(`Pending checkouts: ${pending.length} merged records, ${rowsBefore} stored rows.`);
  console.log(`Live data alongside: ${UNTOUCHED.map(r => `${r}=${before[r]}`).join(', ')}\n`);

  const cutoff = Date.now() - MIN_AGE_HOURS * 60 * 60 * 1000;
  const tooNew = pending.filter(p => createdAtOf(p) > cutoff);
  const linked = pending.filter(p => orderIds.has(String(p.orderId)));

  if (tooNew.length > 0) {
    console.error(`REFUSING TO RUN: ${tooNew.length} pending checkout(s) are newer than ${MIN_AGE_HOURS}h.`);
    for (const p of tooNew) {
      console.error(`  ${p.orderId}  ${p.customerEmail}  ${new Date(createdAtOf(p)).toISOString()}`);
    }
    console.error('\nOne of these could be a shopper still on the payment page. Re-run once they have aged out.');
    process.exitCode = 1;
    return;
  }

  if (linked.length > 0) {
    console.error(`REFUSING TO RUN: ${linked.length} pending checkout(s) belong to a real order.`);
    for (const p of linked) console.error(`  ${p.orderId}`);
    process.exitCode = 1;
    return;
  }

  const ages = pending.map(createdAtOf).filter(Boolean);
  console.log('All are abandoned test checkouts:');
  console.log(`  oldest  ${new Date(Math.min(...ages)).toISOString()}`);
  console.log(`  newest  ${new Date(Math.max(...ages)).toISOString()}  (${Math.floor((Date.now() - Math.max(...ages)) / 3600000)}h old)`);
  console.log(`  none matches a real order, none is newer than ${MIN_AGE_HOURS}h`);

  if (!APPLY) {
    console.log(`\nDry run. Nothing was written. Re-run with --apply to delete ${rowsBefore} row(s).\n`);
    return;
  }

  // ------------------------------------------------------------------ write
  // 'pending_checkouts' is in LIST_SAVE_NEVER_DELETES, so a list save cannot
  // remove these. The stored rows are deleted explicitly, scoped to this one
  // resource so nothing else can be caught by it.
  const deleted = await prisma.storeResource.deleteMany({ where: { resource: RESOURCE } });
  console.log(`\nDeleted ${deleted.count} stored row(s) for "${RESOURCE}".`);

  // ----------------------------------------------------------------- verify
  const after = await snapshot();
  const rowsAfter = await prisma.storeResource.count({ where: { resource: RESOURCE } });
  const merged: any[] = (await fetchResource(RESOURCE)) || [];

  console.log('\n--- verifying ---');
  console.log(`  pending checkouts: ${rowsAfter} stored row(s), ${merged.length} merged record(s)`);

  let regressed = false;
  for (const r of UNTOUCHED) {
    const same = before[r] === after[r];
    if (!same) regressed = true;
    console.log(`  ${same ? 'ok  ' : 'LOST'} ${r.padEnd(12)} ${before[r]} -> ${after[r]}`);
  }

  if (rowsAfter !== 0 || merged.length !== 0) {
    console.error('\nINCOMPLETE: pending checkouts are still present.');
    process.exitCode = 1;
    return;
  }
  if (regressed) {
    console.error('\nSOMETHING ELSE CHANGED. Restore from the latest backup and investigate.');
    process.exitCode = 1;
    return;
  }

  console.log('\nAll pending checkouts gone; every other store is untouched.\n');
}

main()
  .catch(err => {
    console.error('[Purge pending checkouts] Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
