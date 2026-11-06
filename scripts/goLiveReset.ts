/**
 * Clears the trading history before the site is handed to the client.
 *
 *   npx tsx scripts/goLiveReset.ts            # dry run
 *   npx tsx scripts/goLiveReset.ts --apply
 *
 * THIS DESTROYS ORDERS AND CUSTOMER ACCOUNTS. Take a backup first:
 *   npx tsx scripts/dbBackup.ts
 *
 * Removes every order, customer account and subscription, so the shop opens
 * with no trading history from the build. Deliberately KEEPS the catalogue and
 * the content the client has built: products, collections, pages, blogs,
 * discounts and media are untouched.
 *
 * It also corrects the launch banner. The stored page content still promised
 * "FIRST 50 SUBSCRIBERS - Get 10% OFF FOR LIFE", and the offer is now ten
 * percent off a first order for the first fifty accounts. The stored value
 * overrides the code default, so leaving it would keep a claim on the live site
 * that the shop does not honour.
 *
 * Refuses to run against a database holding a subscription that can still bill:
 * deleting a live plan's record stops its renewals without cancelling the
 * customer's agreement, which is the wrong way round.
 */
import 'dotenv/config';
import { fetchResource, saveSingleItem, getDb } from '../serverDb';
import { prisma } from '../src/lib/prisma';

const APPLY = process.argv.includes('--apply');

/** Anything that can still bill. Its presence stops the run. */
const BILLABLE_STATUSES = ['active', 'past_due', 'paused', 'trialing', 'subscribed'];

const OLD_BANNER = '★ FIRST 50 SUBSCRIBERS - Get 10% OFF FOR LIFE >';
const NEW_BANNER = '★ FIRST 50 CUSTOMERS - Get 10% OFF YOUR FIRST ORDER >';

const money = (n: any) => `£${Number(n || 0).toFixed(2)}`;

/** Deletes rows from a Prisma model, tolerating a table this database lacks. */
async function deleteAll(model: any, label: string): Promise<number | null> {
  try {
    const res = await model.deleteMany({});
    return res.count;
  } catch (err: any) {
    if (err?.code === 'P2021') {
      console.log(`  ${label}: no such table in this database; nothing to delete.`);
      return null;
    }
    throw err;
  }
}

async function main() {
  console.log(`\n=== ${APPLY ? 'APPLY' : 'DRY RUN'}: go-live reset ===\n`);

  if (!(await getDb())) {
    console.error('Neon is unreachable. Refusing to run: a partial delete across two stores is worse than none.');
    process.exitCode = 1;
    return;
  }

  const orders: any[] = (await fetchResource('orders')) || [];
  const customers: any[] = (await fetchResource('customers')) || [];
  const subs: any[] = (await fetchResource('subscriptions')) || [];
  const pages: any[] = (await fetchResource('customPages')) || [];
  const pending: any[] = (await fetchResource('pending_checkouts')) || [];

  console.log(`Orders        ${orders.length}`);
  console.log(`Customers     ${customers.length}`);
  console.log(`Subscriptions ${subs.length}`);

  const billable = subs.filter(s => BILLABLE_STATUSES.includes(String(s?.status || '').toLowerCase()));
  if (billable.length > 0) {
    console.error(`\nREFUSING TO RUN: ${billable.length} subscription(s) can still bill.`);
    for (const s of billable) {
      console.error(`  ${s.id}  ${s.status}  ${money(s.amount)}  next=${s.nextBillingDate}  ${s.customerEmail}`);
    }
    console.error(
      '\nCancel these through the account portal or the admin dashboard first. Deleting the\n' +
        'record would stop the renewals without ending the customer agreement behind them.'
    );
    process.exitCode = 1;
    return;
  }

  console.log('\nTo be deleted:');
  for (const o of orders) {
    console.log(`  ORDER     ${String(o.id).padEnd(20)} ${String(o.fulfillmentStatus).padEnd(12)} ${money(o.total).padStart(9)}  ${o.customerEmail}`);
  }
  for (const c of customers) {
    console.log(`  CUSTOMER  ${String(c.email).padEnd(32)} orders=${c.ordersCount ?? 0} spent=${money(c.amountSpent)}`);
  }
  for (const s of subs) {
    console.log(`  PLAN      ${String(s.id).padEnd(32)} ${s.status}`);
  }

  const bannerPages = pages.filter((p: any) =>
    (p?.sections || []).some((sec: any) => sec?.settings?.promoBannerText === OLD_BANNER)
  );
  console.log(`\nLaunch banner to correct on ${bannerPages.length} page(s): ${bannerPages.map((p: any) => p.slug).join(', ') || 'none'}`);
  if (bannerPages.length) {
    console.log(`  "${OLD_BANNER}"`);
    console.log(`  -> "${NEW_BANNER}"`);
  }

  console.log('\nKept: products, collections, pages, blogs, discounts, media.');
  if (pending.length) {
    console.log(`\nNOTE: ${pending.length} pending checkout(s) remain — half-finished payments from testing.`);
    console.log('      They are not orders and are not deleted here. Say if they should go too.');
  }

  if (!APPLY) {
    console.log('\nDry run. Nothing was written. Re-run with --apply to delete.\n');
    return;
  }

  // ------------------------------------------------------------------ write
  console.log('\n--- deleting ---');

  // Line items first: the schema cascades from Order, but this database carries
  // no foreign keys, so nothing fires on its own.
  const items = await deleteAll(prisma.orderItem, 'OrderItem');
  if (items !== null) console.log(`  OrderItem rows deleted: ${items}`);

  console.log(`  Order rows deleted: ${await deleteAll(prisma.order, 'Order')}`);
  console.log(`  Subscription rows deleted: ${await deleteAll(prisma.subscription, 'Subscription')}`);
  console.log(`  Customer rows deleted: ${await deleteAll(prisma.customer, 'Customer')}`);

  // The website reads the StoreResource copies, and a list save cannot remove
  // these (orders, customers and subscriptions are all in LIST_SAVE_NEVER_DELETES),
  // so they are deleted explicitly.
  for (const resource of ['orders', 'customers', 'subscriptions']) {
    const gone = await prisma.storeResource.deleteMany({ where: { resource } });
    console.log(`  store "${resource}" rows deleted: ${gone.count}`);
  }

  if (bannerPages.length) {
    // One page at a time, through saveSingleItem.
    //
    // This used to rewrite the whole list with saveResource. 'customPages' is
    // not in LIST_SAVE_NEVER_DELETES, so that save is authoritative — and the
    // two stores key pages differently (the JSON store by ids like
    // "page-1784697403555", the typed table by slug), so a merged list written
    // back does not round-trip. A page that was only in one of them was dropped
    // by the write: it took out the "test" page on the first run, which had to
    // be restored from the backup. An upsert per page cannot delete anything.
    for (const page of bannerPages) {
      const updated = {
        ...page,
        sections: (page?.sections || []).map((sec: any) =>
          sec?.settings?.promoBannerText === OLD_BANNER
            ? { ...sec, settings: { ...sec.settings, promoBannerText: NEW_BANNER } }
            : sec
        )
      };
      await saveSingleItem('customPages', updated);
      console.log(`  launch banner corrected on "${page.slug}"`);
    }
  }

  // ----------------------------------------------------------------- verify
  console.log('\n--- verifying ---');
  const after = {
    orders: await prisma.order.count(),
    customers: await prisma.customer.count(),
    subscriptions: await prisma.subscription.count()
  };
  const storeAfter = {
    orders: ((await fetchResource('orders')) || []).length,
    customers: ((await fetchResource('customers')) || []).length,
    subscriptions: ((await fetchResource('subscriptions')) || []).length
  };
  console.log(`  Neon:  orders=${after.orders} customers=${after.customers} subscriptions=${after.subscriptions}`);
  console.log(`  Store: orders=${storeAfter.orders} customers=${storeAfter.customers} subscriptions=${storeAfter.subscriptions}`);

  const leftover = Object.values(after).some(n => n > 0) || Object.values(storeAfter).some(n => n > 0);
  if (leftover) {
    console.error('\nINCOMPLETE: something is still present. Investigate before handover.');
    process.exitCode = 1;
    return;
  }

  const products = ((await fetchResource('products')) || []).length;
  const collections = ((await fetchResource('collections')) || []).length;
  const keptPages = ((await fetchResource('customPages')) || []).length;
  console.log(`\nCatalogue intact: ${products} product(s), ${collections} collection(s), ${keptPages} page(s).`);
  console.log('The shop now has no trading history.\n');
}

main()
  .catch(err => {
    console.error('[Go-live reset] Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
