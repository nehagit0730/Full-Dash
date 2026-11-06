/**
 * Removes every customer except a named keep-list, from Neon AND from the
 * store the admin dashboard and website read.
 *
 *   npx tsx scripts/purgeCustomers.ts --keep=a@x.com,b@y.com            # dry run
 *   npx tsx scripts/purgeCustomers.ts --keep=a@x.com,b@y.com --apply
 *   ... --with-orders     also delete the orders belonging to them
 *
 * This DESTROYS customer records and, with --with-orders, paid order history.
 * Take a backup first:  npx tsx scripts/dbBackup.ts
 *
 * Guard rails — any failure means nothing is written:
 *   - the keep-list must match at least one real customer, so a typo cannot
 *     empty the table;
 *   - a customer with a LIVE subscription is never deleted, whatever the
 *     keep-list says: the renewal cron would go on billing a card for someone
 *     the store no longer knows;
 *   - orders belonging to a KEPT customer are never touched, even when the
 *     same order is reachable from a deleted one;
 *   - without --with-orders, orders are kept and only their customerId is
 *     cleared. Order.customerId is declared onDelete: SetNull, but this
 *     database has no foreign keys at all, so nothing fires on its own.
 */
import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

const LIVE_STATUSES = ['active', 'past_due', 'paused', 'trialing', 'subscribed'];

const args = process.argv.slice(2);
const pick = (flag: string) =>
  (args.find(a => a.startsWith(flag + '=')) || '').split('=').slice(1).join('=') || null;

const KEEP = (pick('--keep') || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);
const APPLY = args.includes('--apply');
const WITH_ORDERS = args.includes('--with-orders');

if (KEEP.length === 0) {
  console.error('Usage: npx tsx scripts/purgeCustomers.ts --keep=<email,...> [--with-orders] [--apply]');
  process.exit(1);
}

const lower = (v: any) => String(v || '').toLowerCase().trim();

async function main() {
  console.log(`\n=== ${APPLY ? 'APPLY' : 'DRY RUN'}: purge customers ===\n`);
  console.log(`Keeping: ${KEEP.join(', ')}`);
  console.log(`Orders belonging to deleted customers: ${WITH_ORDERS ? 'DELETED' : 'kept, customerId cleared'}\n`);

  const customers = await prisma.customer.findMany({ orderBy: { createdAt: 'asc' } });
  const subs = await prisma.subscription.findMany({
    select: { id: true, customerEmail: true, customerId: true, status: true }
  });

  const keep = customers.filter((c: any) => KEEP.includes(lower(c.email)));
  let drop = customers.filter((c: any) => !KEEP.includes(lower(c.email)));

  if (keep.length === 0) {
    console.log('REFUSED: the keep-list matched no customer. Check the addresses — a typo here empties the table.');
    return;
  }

  // A live plan outlives its customer row: the cron bills from the Subscription
  // table and would keep charging a card for someone the store cannot identify.
  const withLivePlans = drop.filter((c: any) =>
    subs.some(
      (s: any) =>
        LIVE_STATUSES.includes(String(s.status)) &&
        (s.customerId === c.id || lower(s.customerEmail) === lower(c.email))
    )
  );
  if (withLivePlans.length > 0) {
    console.log('REFUSING to delete customers who still have a LIVE subscription:');
    for (const c of withLivePlans as any[]) console.log(`  ${c.email}`);
    console.log('  Cancel the plan first, or add them to --keep.\n');
    const blocked = new Set(withLivePlans.map((c: any) => c.id));
    drop = drop.filter((c: any) => !blocked.has(c.id));
  }

  console.log(`Customers: ${customers.length} -> keeping ${keep.length}, deleting ${drop.length}\n`);
  console.log('KEEP:');
  for (const c of keep as any[]) console.log(`  ${c.email}`);
  console.log('\nDELETE:');
  for (const c of drop as any[]) console.log(`  ${c.email}  (${c.name || 'no name'})`);

  const dropIds = drop.map((c: any) => c.id);
  const dropEmails = drop.map((c: any) => lower(c.email));
  const keepEmails = new Set(keep.map((c: any) => lower(c.email)));

  // An order is only in scope if it belongs to a deleted customer AND not to a
  // kept one. The email is the authority: customerId is frequently null.
  const allOrders = await prisma.order.findMany({
    select: { id: true, customerEmail: true, customerId: true, total: true, paymentStatus: true }
  });
  const theirOrders = allOrders.filter(
    (o: any) =>
      !keepEmails.has(lower(o.customerEmail)) &&
      (dropEmails.includes(lower(o.customerEmail)) || (o.customerId && dropIds.includes(o.customerId)))
  );

  console.log(`\nOrders belonging to deleted customers: ${theirOrders.length}`);
  for (const o of theirOrders as any[]) {
    console.log(`  ${o.id}  ${o.customerEmail}  £${o.total}  ${o.paymentStatus}`);
  }
  if (theirOrders.length > 0 && !WITH_ORDERS) {
    console.log('  (kept — only customerId is cleared. Pass --with-orders to delete them.)');
  }

  if (!APPLY) {
    console.log('\nDry run. Nothing was written. Re-run with --apply.');
    return;
  }
  if (dropIds.length === 0) {
    console.log('\nNothing to delete.');
    return;
  }

  // ------------------------------------------------------------------ write
  const orderIds = theirOrders.map((o: any) => o.id);

  if (WITH_ORDERS && orderIds.length > 0) {
    const delOrders = await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    const delOrderStore = await prisma.storeResource.deleteMany({
      where: { resource: 'orders', itemId: { in: orderIds } }
    });
    console.log(`\nOrders deleted: ${delOrders.count} from Neon, ${delOrderStore.count} from the store.`);
  } else if (orderIds.length > 0) {
    const cleared = await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { customerId: null }
    });
    console.log(`\nOrders kept; customerId cleared on ${cleared.count}.`);
  }

  const delCustomers = await prisma.customer.deleteMany({ where: { id: { in: dropIds } } });
  // saveResource cannot do this — 'customers' is in LIST_SAVE_NEVER_DELETES, so
  // a list save only ever creates or updates. Removal has to be explicit.
  const delStore = await prisma.storeResource.deleteMany({
    where: { resource: 'customers', itemId: { in: dropIds } }
  });
  console.log(`Customers deleted: ${delCustomers.count} from Neon, ${delStore.count} from the store.`);

  // ----------------------------------------------------------------- verify
  const after = await prisma.customer.findMany({ select: { id: true, email: true } });
  console.log(`\nNeon now holds ${after.length} customer(s):`);
  for (const c of after as any[]) console.log(`  ${c.email}`);

  const storeAfter = await prisma.storeResource.findMany({
    where: { resource: 'customers' },
    select: { itemId: true }
  });
  console.log(`The admin dashboard now reads ${storeAfter.length} customer(s).`);

  const leftover = after.filter((c: any) => !KEEP.includes(lower(c.email)));
  console.log(
    leftover.length === 0 && storeAfter.length === after.length
      ? '\nClean: only the kept customers remain, in Neon and in the admin dashboard.'
      : `\nWARNING: ${leftover.length} unexpected customer(s) in Neon; store holds ${storeAfter.length}.`
  );
}

main()
  .catch(err => {
    console.error('Failed:', err?.message || err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
