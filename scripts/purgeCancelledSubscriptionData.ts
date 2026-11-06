/**
 * Permanently removes cancelled/deleted subscriptions AND the orders that
 * belong to them, from Neon and from the store the website reads.
 *
 *   npx tsx scripts/purgeCancelledSubscriptionData.ts            # dry run
 *   npx tsx scripts/purgeCancelledSubscriptionData.ts --apply
 *
 * THIS DESTROYS PAID ORDER HISTORY. Take a backup first:
 *   npx tsx scripts/dbBackup.ts
 *
 * Unlike `purgeInactiveSubscriptions`, which deletes the plan and deliberately
 * KEEPS its orders, this also deletes the orders — including ones already paid,
 * fulfilled and delivered. It exists because an operator asked for the orders of
 * cancelled plans to be cleared out of the admin list and the customer portal.
 * There is no undo: orders have no soft-delete.
 *
 * Guard rails — an order is only eligible if BOTH are true:
 *   - it is flagged as belonging to a cancelled subscription (the same test the
 *     admin "Cancelled Subscription" filter uses); and
 *   - it is not linked to a subscription that can still bill.
 * A plan that can still bill, and every order of it, is untouchable here.
 *
 * Two things the schema promises but this database does not do, because its
 * migrations were applied out of band and it carries no foreign keys at all:
 *   - OrderItem.order is onDelete: Cascade, so the line items would normally go
 *     with the order. Nothing fires, so they are deleted explicitly.
 *   - saveResource cannot remove these rows either: 'orders' and 'subscriptions'
 *     are both in LIST_SAVE_NEVER_DELETES, so a list save only ever creates or
 *     updates. The StoreResource rows are deleted explicitly too.
 */
import 'dotenv/config';
import { fetchResource, getDb, saveResource } from '../serverDb';
import { prisma } from '../src/lib/prisma';

/** Anything that can still bill, or is waiting to. Never purged. */
const KEEP_STATUSES = ['active', 'past_due', 'paused', 'trialing', 'subscribed'];

const APPLY = process.argv.includes('--apply');

const money = (n: any) => `£${Number(n || 0).toFixed(2)}`;

/** The same test the admin "Cancelled Subscription" filter uses. */
function belongsToCancelledSubscription(order: any): boolean {
  if (order?.subscriptionCancelled) return true;
  if (order?.subscriptionDetails?.status === 'Cancelled') return true;
  if (order?.subscriptionDetails?.isCancelled) return true;
  return (
    Array.isArray(order?.tags) &&
    order.tags.some((t: any) => String(t).toLowerCase().includes('subscription cancelled'))
  );
}

/** Line items for these orders, or null when the table does not exist here. */
async function countLineItems(orderIds: string[]): Promise<number | null> {
  try {
    return await prisma.orderItem.count({ where: { orderId: { in: orderIds } } });
  } catch (err: any) {
    if (err?.code === 'P2021') return null;
    throw err;
  }
}

/** Plan fields that make the portal render a subscription that no longer exists. */
const STALE_PLAN_FIELDS = [
  'subPlan',
  'subPrice',
  'subItems',
  'subCansCount',
  'subFrequency',
  'subStatus',
  'subPlanManuallyConfigured',
  'nextPayment',
  'nextDelivery',
  'hasActiveSubscription',
  'hasPurchasedSubscription',
  'isSubscriptionCancelled',
  'subscriptionCancelledAt',
  'subscriptionCancellationReason'
];

/**
 * Brings each customer back in step with the rows that survive.
 *
 * A customer with no subscriptions left loses the plan fields; everyone's order
 * count and lifetime spend are recomputed from the orders that actually remain.
 * Customers who still hold a plan keep it.
 */
async function reconcileCustomers(apply: boolean): Promise<void> {
  const customers: any[] = (await fetchResource('customers')) || [];
  const orders: any[] = (await fetchResource('orders')) || [];
  const subs: any[] = (await fetchResource('subscriptions')) || [];

  const emailOf = (v: any) => String(v || '').toLowerCase().trim();
  const changes: string[] = [];

  const next = customers.map((c: any) => {
    const email = emailOf(c?.email);
    if (!email) return c;

    const theirOrders = orders.filter(o => emailOf(o?.customerEmail) === email);
    const theirSubs = subs.filter(s => emailOf(s?.customerEmail) === email);

    const ordersCount = theirOrders.length;
    const amountSpent = Number(
      theirOrders.reduce((sum, o) => sum + (Number(o?.total) || 0), 0).toFixed(2)
    );

    const updated: any = { ...c };
    const notes: string[] = [];

    if (Number(c?.ordersCount) !== ordersCount) {
      notes.push(`ordersCount ${c?.ordersCount} -> ${ordersCount}`);
      updated.ordersCount = ordersCount;
    }
    if (Number(Number(c?.amountSpent).toFixed(2)) !== amountSpent) {
      notes.push(`amountSpent ${money(c?.amountSpent)} -> ${money(amountSpent)}`);
      updated.amountSpent = amountSpent;
    }

    if (theirSubs.length === 0) {
      const cleared = STALE_PLAN_FIELDS.filter(f => updated[f] !== undefined && updated[f] !== null);
      for (const f of cleared) delete updated[f];
      if (cleared.length) notes.push(`cleared ${cleared.join(', ')}`);

      if (updated.subscriptionStatus && updated.subscriptionStatus !== 'Not subscribed') {
        notes.push(`subscriptionStatus "${updated.subscriptionStatus}" -> "Not subscribed"`);
        updated.subscriptionStatus = 'Not subscribed';
      }
    }

    if (notes.length) changes.push(`  ${c.email}\n      ${notes.join('\n      ')}`);
    return updated;
  });

  if (changes.length === 0) {
    console.log('\nCustomer records already in step; nothing to reconcile.');
    return;
  }

  console.log(
    apply
      ? '\n--- reconciling customer records ---'
      : '\n--- customer records that WOULD be reconciled ---'
  );
  for (const line of changes) console.log(line);

  if (!apply) return;

  // 'customers' is in LIST_SAVE_NEVER_DELETES, so this list save only ever
  // creates or updates — it cannot remove a customer, which is what we want.

  await saveResource('customers', next);
  console.log(`Updated ${changes.length} customer record(s).`);
}

async function main() {
  console.log(`\n=== ${APPLY ? 'APPLY' : 'DRY RUN'}: purge cancelled subscriptions and their orders ===\n`);

  const hasDb = Boolean(await getDb());
  if (!hasDb) {
    console.error('Neon is unreachable. Refusing to run: a partial delete across two stores is worse than none.');
    process.exitCode = 1;
    return;
  }

  const storedSubs: any[] = (await fetchResource('subscriptions')) || [];
  const storedOrders: any[] = (await fetchResource('orders')) || [];

  const isBillable = (s: any) => KEEP_STATUSES.includes(String(s?.status || '').toLowerCase());

  const keepSubs = storedSubs.filter(isBillable);
  const dropSubs = storedSubs.filter(s => s?.id && !isBillable(s));
  const billableSubIds = new Set(keepSubs.map(s => String(s.id)));
  const dropSubIds = dropSubs.map(s => String(s.id));

  console.log(`Subscriptions: ${storedSubs.length} total -> keeping ${keepSubs.length}, deleting ${dropSubs.length}`);
  for (const s of keepSubs) {
    console.log(`  KEEP    ${String(s.id).padEnd(30)} ${String(s.status).padEnd(10)} ${money(s.amount).padStart(8)}  ${s.customerEmail}`);
  }
  for (const s of dropSubs) {
    console.log(`  DELETE  ${String(s.id).padEnd(30)} ${String(s.status).padEnd(10)} ${money(s.amount).padStart(8)}  order=${s.sourceOrderId ?? '-'}  ${s.customerEmail}`);
  }

  // ---------------------------------------------------------------- orders
  const candidates = storedOrders.filter(belongsToCancelledSubscription);

  // An order pointing at a plan that can still bill is not a leftover of a
  // cancelled one, whatever its flags say. Those are reported and skipped.
  const protectedOrders = candidates.filter(o => billableSubIds.has(String(o.subscriptionId || '')));
  const dropOrders = candidates.filter(o => !billableSubIds.has(String(o.subscriptionId || '')));
  const dropOrderIds = dropOrders.map(o => String(o.id));

  console.log(`\nOrders: ${storedOrders.length} total -> ${dropOrders.length} belong to a cancelled plan and will be DELETED`);
  for (const o of dropOrders) {
    console.log(
      `  DELETE  ${String(o.id).padEnd(20)} ${String(o.fulfillmentStatus).padEnd(12)} ` +
        `${String(o.paymentStatus).padEnd(8)} ${money(o.total).padStart(8)}  ` +
        `renewal=${o.isRenewal ? 'Y' : 'n'}  sub=${o.subscriptionId ?? '-'}  ${o.customerEmail}`
    );
  }

  if (protectedOrders.length > 0) {
    console.log(`\nSKIPPED — these are flagged cancelled but belong to a plan that can still bill:`);
    for (const o of protectedOrders) {
      console.log(`  ${String(o.id).padEnd(20)} sub=${o.subscriptionId}  ${money(o.total)}`);
    }
  }

  const paidValue = dropOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const shipped = dropOrders.filter(o => ['Delivered', 'Fulfilled', 'Shipped'].includes(String(o.fulfillmentStatus)));

  console.log(`\nAbout to destroy ${money(paidValue)} of recorded order value.`);
  if (shipped.length > 0) {
    console.log(`${shipped.length} of these were already shipped to the customer:`);
    for (const o of shipped) console.log(`  ${o.id}  ${o.fulfillmentStatus}  ${money(o.total)}`);
  }

  // This database has no OrderItem table — its migrations were applied out of
  // band and several models were never created. Reported rather than swallowed,
  // so a run against a database that DOES have it cannot quietly skip the rows.
  const lineItems = await countLineItems(dropOrderIds);
  console.log(
    lineItems === null
      ? 'Line items: the OrderItem table does not exist in this database; nothing to clean up.'
      : `Line items attached to them: ${lineItems}`
  );

  if (!APPLY) {
    // Reported, not written — the customer clean-up is part of the job and the
    // operator should see it before agreeing to any of it.
    await reconcileCustomers(false);
    console.log('\nDry run. Nothing was written. Re-run with --apply to delete.\n');
    return;
  }

  // ----------------------------------------------------------------- write
  const nothingToDelete = dropOrderIds.length === 0 && dropSubIds.length === 0;
  if (nothingToDelete) {
    // Not a reason to stop: an earlier run may have deleted the rows and left
    // the customer records behind, and reconciling is idempotent.
    console.log('\nNo rows left to delete.');
  } else {
    console.log('\n--- deleting ---');
  }

  if (dropOrderIds.length > 0) {
    // Explicitly, because no foreign key exists to cascade for us — where the
    // table exists at all.
    try {
      const items = await prisma.orderItem.deleteMany({ where: { orderId: { in: dropOrderIds } } });
      console.log(`OrderItem rows deleted: ${items.count}`);
    } catch (err: any) {
      if (err?.code !== 'P2021') throw err;
      console.log('OrderItem table absent in this database; no line items to delete.');
    }

    const orders = await prisma.order.deleteMany({ where: { id: { in: dropOrderIds } } });
    console.log(`Neon Order rows deleted: ${orders.count}`);

    const storeOrders = await prisma.storeResource.deleteMany({
      where: { resource: 'orders', itemId: { in: dropOrderIds } }
    });
    console.log(`Website store order rows deleted: ${storeOrders.count}`);
  }

  if (dropSubIds.length > 0) {
    const subs = await prisma.subscription.deleteMany({ where: { id: { in: dropSubIds } } });
    console.log(`Neon Subscription rows deleted: ${subs.count}`);

    const storeSubs = await prisma.storeResource.deleteMany({
      where: { resource: 'subscriptions', itemId: { in: dropSubIds } }
    });
    console.log(`Website store subscription rows deleted: ${storeSubs.count}`);

    // Any surviving order that still points at a deleted plan is unlinked, so
    // it does not reference a row that no longer exists.
    const unlinked = await prisma.order.updateMany({
      where: { subscriptionId: { in: dropSubIds } },
      data: { subscriptionId: null }
    });
    console.log(`Surviving orders unlinked from deleted plans: ${unlinked.count}`);
  }

  // ------------------------------------------------------- customer record
  // Deleting the rows is not enough to clear the customer portal. The account
  // page treats someone as a subscriber when ANY of hasActiveSubscription,
  // subStatus, subscriptionStatus or simply `subPlan` is set (CustomerAccount
  // line ~981), so a customer whose plans have all gone would still be shown a
  // LITE Plan at the old price. The per-customer counters go stale in the same
  // way: they count orders that no longer exist.
  await reconcileCustomers(true);

  // ---------------------------------------------------------------- verify
  // By re-reading, not by trusting the writes above.
  console.log('\n--- verifying ---');
  const ordersAfter = await prisma.order.findMany({ select: { id: true, fulfillmentStatus: true, total: true } });
  const subsAfter = await prisma.subscription.findMany({ select: { id: true, status: true, sourceOrderId: true } });
  const storeOrdersAfter: any[] = (await fetchResource('orders')) || [];
  const storeSubsAfter: any[] = (await fetchResource('subscriptions')) || [];

  console.log(`Neon: ${ordersAfter.length} order(s), ${subsAfter.length} subscription(s).`);
  console.log(`Store view: ${storeOrdersAfter.length} order(s), ${storeSubsAfter.length} subscription(s).`);

  const leftoverOrders = storeOrdersAfter.filter(o => dropOrderIds.includes(String(o.id)));
  const leftoverSubs = storeSubsAfter.filter(s => dropSubIds.includes(String(s.id)));
  if (leftoverOrders.length || leftoverSubs.length) {
    console.error(
      `\nINCOMPLETE: ${leftoverOrders.length} order(s) and ${leftoverSubs.length} subscription(s) are still visible.`
    );
    for (const o of leftoverOrders) console.error(`  order ${o.id}`);
    for (const s of leftoverSubs) console.error(`  subscription ${s.id}`);
    process.exitCode = 1;
    return;
  }

  console.log('\nEvery targeted row is gone from both stores.');
  for (const s of subsAfter as any[]) console.log(`  remaining subscription ${s.id}  ${s.status}  order=${s.sourceOrderId ?? '-'}`);
  console.log();
}

main()
  .catch(err => {
    console.error('[Purge] Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
