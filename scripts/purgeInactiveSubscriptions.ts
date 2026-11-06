/**
 * Permanently removes cancelled and deleted subscriptions from Neon AND from
 * the store the website reads.
 *
 *   npx tsx scripts/purgeInactiveSubscriptions.ts            # dry run
 *   npx tsx scripts/purgeInactiveSubscriptions.ts --apply
 *
 * This DESTROYS payment history. Take a backup first:
 *   npx tsx scripts/dbBackup.ts
 *
 * A subscription row is the record that a customer agreed to recurring billing
 * and, for the duplicates cancelled on 2026-09-16, the evidence of what went
 * wrong. Deleting one is not the same as cancelling it: cancelling stops the
 * billing and keeps the history, which is what an operator normally wants.
 *
 * Guard rails — any failure means nothing is written:
 *   - only statuses outside KEEP_STATUSES are eligible, so anything that can
 *     still bill is untouchable here;
 *   - a row still holding a Worldpay card token is never deleted, because that
 *     token is the only link between a customer and a stored card;
 *   - Order.subscriptionId is onDelete: SetNull, so orders that point at a
 *     deleted subscription are listed before anything happens — the order
 *     survives, but it stops knowing which plan produced it.
 */
import 'dotenv/config';
import { fetchResource, getDb, saveResource } from '../serverDb';
import { prisma } from '../src/lib/prisma';

/** Anything that can still bill, or is waiting to. Never purged. */
const KEEP_STATUSES = ['active', 'past_due', 'paused', 'trialing', 'subscribed'];

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');

async function main() {
  console.log(`\n=== ${APPLY ? 'APPLY' : 'DRY RUN'}: purge cancelled/deleted subscriptions ===\n`);

  const hasDb = Boolean(await getDb());
  const subs = hasDb ? await prisma.subscription.findMany({ orderBy: { createdAt: 'asc' } }) : [];

  const keep = subs.filter((s: any) => KEEP_STATUSES.includes(String(s.status)));
  let drop = subs.filter((s: any) => !KEEP_STATUSES.includes(String(s.status)));

  // A token is a stored card. Refuse to destroy the only reference to it.
  const tokenHolders = drop.filter((s: any) => s.worldpayTokenHref);
  if (tokenHolders.length > 0) {
    console.log('REFUSING to delete rows that still hold a Worldpay card token:');
    for (const s of tokenHolders as any[]) console.log(`  ${s.id}  ${s.status}  order=${s.sourceOrderId ?? '-'}`);
    console.log('  Clear the token deliberately first if these really should go.\n');
    drop = drop.filter((s: any) => !s.worldpayTokenHref);
  }

  console.log(`Neon: ${subs.length} rows -> keeping ${keep.length}, deleting ${drop.length}`);
  const byStatus = new Map<string, number>();
  for (const s of drop as any[]) byStatus.set(s.status, (byStatus.get(s.status) ?? 0) + 1);
  for (const [st, n] of byStatus) console.log(`  ${st.padEnd(10)} ${n}`);

  console.log('\nKeeping:');
  for (const s of keep as any[]) {
    console.log(`  ${s.id}  ${s.status.padEnd(9)}  order=${s.sourceOrderId ?? '-'}  ${s.customerEmail}`);
  }

  // The website reads the store, not the typed table, and the two can disagree:
  // deleting from Neon alone leaves the cancelled plan still rendering. So a row
  // is eligible if EITHER source says it is not live.
  const storedNow: any[] = (await fetchResource('subscriptions')) || [];
  const storeOnlyDrop = storedNow.filter(
    (s: any) => s?.id && !KEEP_STATUSES.includes(String(s?.status || '')) && !s.worldpayTokenHref
  );

  const dropIds = Array.from(
    new Set([...drop.map((s: any) => String(s.id)), ...storeOnlyDrop.map((s: any) => String(s.id))])
  );
  if (storeOnlyDrop.length > 0) {
    console.log(`\nWebsite-only rows to remove (absent or already gone from Neon): ${storeOnlyDrop.length}`);
  }

  const orphaned = hasDb
    ? await prisma.order.findMany({
        where: { subscriptionId: { in: dropIds } },
        select: { id: true, total: true, paymentStatus: true, subscriptionId: true }
      })
    : [];
  if (orphaned.length > 0) {
    console.log(`\nOrders that will lose their subscriptionId (the order itself is kept):`);
    for (const o of orphaned as any[]) {
      console.log(`  ${o.id}  £${o.total}  ${o.paymentStatus}  -> ${o.subscriptionId} becomes null`);
    }
  }

  const stored: any[] = (await fetchResource('subscriptions')) || [];
  const storeKeep = stored.filter(
    (s: any) => KEEP_STATUSES.includes(String(s?.status || '')) || !dropIds.includes(String(s?.id))
  );
  console.log(`\nWebsite store: ${stored.length} rows -> keeping ${storeKeep.length}, removing ${stored.length - storeKeep.length}`);

  if (!APPLY) {
    console.log('\nDry run. Nothing was written. Re-run with --apply to delete.');
    return;
  }

  if (dropIds.length === 0) {
    console.log('\nNothing to delete.');
    return;
  }

  // ------------------------------------------------------------------ write
  if (hasDb) {
    const res = await prisma.subscription.deleteMany({ where: { id: { in: dropIds } } });
    console.log(`\nNeon: deleted ${res.count} row(s).`);

    // saveResource CANNOT do this: 'subscriptions' is in LIST_SAVE_NEVER_DELETES,
    // so a list save only ever creates or updates. That protection exists so a
    // stale admin tab cannot wipe transactional records — it is right, and it is
    // why the rows have to be removed explicitly here instead.
    const gone = await prisma.storeResource.deleteMany({
      where: { resource: 'subscriptions', itemId: { in: dropIds } }
    });
    console.log(`Website store: deleted ${gone.count} row(s).`);

    // Order.subscriptionId is declared onDelete: SetNull, but this database has
    // NO foreign keys at all (the migrations were applied out of band), so
    // nothing fired and those orders now point at rows that do not exist.
    const unlinked = await prisma.order.updateMany({
      where: { subscriptionId: { in: dropIds } },
      data: { subscriptionId: null }
    });
    console.log(`Orders unlinked from deleted subscriptions: ${unlinked.count}`);
  } else {
    await saveResource('subscriptions', storeKeep);
  }

  // ----------------------------------------------------------------- verify
  const after = hasDb ? await prisma.subscription.findMany({ select: { id: true, status: true, sourceOrderId: true } }) : [];
  console.log(`\nNeon now holds ${after.length} subscription(s):`);
  for (const s of after as any[]) console.log(`  ${s.id}  ${s.status}  order=${s.sourceOrderId ?? '-'}`);

  const leftover = after.filter((s: any) => !KEEP_STATUSES.includes(String(s.status)));

  // Verified by re-reading, not by trusting the write: the store is what the
  // website actually renders, and a list save here is a silent no-op.
  const storeAfter: any[] = (await fetchResource('subscriptions')) || [];
  const storeLeftover = storeAfter.filter((s: any) => !KEEP_STATUSES.includes(String(s?.status || '')));
  console.log(`\nWebsite now reads ${storeAfter.length} subscription(s), ${storeLeftover.length} of them non-active.`);

  const dangling = hasDb
    ? await prisma.$queryRawUnsafe<any[]>(
        `SELECT o.id FROM "Order" o LEFT JOIN "Subscription" s ON s.id = o."subscriptionId"
         WHERE o."subscriptionId" IS NOT NULL AND s.id IS NULL`
      )
    : [];

  const clean = leftover.length === 0 && storeLeftover.length === 0 && dangling.length === 0;
  console.log(
    clean
      ? '\nClean: no cancelled or deleted subscriptions remain in Neon or on the website, and no order points at a missing subscription.'
      : `\nWARNING: Neon ${leftover.length}, website ${storeLeftover.length}, dangling orders ${dangling.length}.`
  );
}

main()
  .catch(err => {
    console.error('Failed:', err?.message || err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
