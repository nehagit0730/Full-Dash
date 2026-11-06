import { prisma } from './prisma';

/**
 * Writing a subscription into the typed `Subscription` table.
 *
 * The same failure the `Order` table had. Subscriptions are built as loose
 * objects carrying `shippingFee`, `shippingAmount` and `deliveryCost` — none of
 * which are columns — and `customerId` was being set to the customer's EMAIL
 * rather than a Customer id. `prisma.subscription.create()` rejected the whole
 * payload with `Unknown argument`, and the call site swallowed it in an empty
 * catch, so a subscription existed in the JSON blob and never in the table.
 *
 * The other writer, `syncToPrismaModel`, listed columns by hand and omitted
 * `items`, `cansCount`, `itemPrice`, `shippingCost`, `shippingAddress`,
 * `deliveryMethod` and `sourceOrderId`, so the rows it did write could not
 * reproduce the customer's box or shipping charge. Both now go through here.
 */

/** Optional scalar columns copied straight through when present. */
const OPTIONAL_COLUMNS = [
  'customerName',
  'currency',
  'billingInterval',
  'worldpayTransactionId',
  'worldpayTokenHref',
  'worldpayRecurringHref',
  'worldpaySchemeReference',
  'lastPaymentStatus',
  'lastPaymentId',
  'lastPaymentError',
  'items',
  'shippingAddress',
  'deliveryMethod',
  'sourceOrderId',
  'cancellationReason'
] as const;

const num = (value: any): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const date = (value: any): Date | undefined => {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

export function toSubscriptionRow(item: any): Record<string, any> {
  const row: Record<string, any> = {
    id: String(item?.id || ''),
    // Required columns. A subscription with no email or plan is still worth
    // storing — losing it entirely is the worse outcome.
    customerEmail: String(item?.customerEmail || item?.email || '').toLowerCase().trim(),
    planId: String(item?.planId || 'sub-pack'),
    planName: String(item?.planName || 'Pouch Supply Subscription'),
    amount: num(item?.amount) ?? num(item?.subPrice) ?? 0,
    status: String(item?.status || 'active')
  };

  for (const key of OPTIONAL_COLUMNS) {
    const value = (item as any)?.[key];
    if (value !== undefined && value !== null) row[key] = value;
  }

  // `shippingCost` is the column; the checkout also calls it shippingFee,
  // shippingAmount and deliveryCost. Whichever arrived, one column is written.
  const shipping =
    num(item?.shippingCost) ?? num(item?.shippingFee) ?? num(item?.shippingAmount) ?? num(item?.deliveryCost);
  if (shipping !== undefined) row.shippingCost = shipping;

  const itemPrice = num(item?.itemPrice);
  if (itemPrice !== undefined) row.itemPrice = itemPrice;

  // Cans come from the box when the caller did not count them. The checkout
  // passes `items` but no cansCount, so the column stayed null and a renewal
  // could not tell how big the box was without re-parsing the order.
  let cans = num(item?.cansCount ?? item?.subCansCount);
  if (cans === undefined) {
    const box = Array.isArray(item?.items) ? item.items : [];
    const counted = box.reduce((sum: number, it: any) => sum + (num(it?.quantity) ?? 0), 0);
    if (counted > 0) cans = counted;
  }
  if (cans !== undefined) row.cansCount = Math.round(cans);

  const failed = num(item?.failedPaymentCount);
  row.failedPaymentCount = failed !== undefined ? Math.round(failed) : 0;

  const next = date(item?.nextBillingDate ?? item?.nextPayment);
  if (next) row.nextBillingDate = next;
  const last = date(item?.lastPaymentAt);
  if (last) row.lastPaymentAt = last;
  const cancelled = date(item?.cancelledAt);
  if (cancelled) row.cancelledAt = cancelled;

  return row;
}

/**
 * Upsert a subscription into the `Subscription` table.
 *
 * `customerId` is attached only when it names a Customer that exists. The
 * checkout passes the customer's email here, which is not an id and would fail
 * the foreign key, taking the whole subscription down with it.
 */
export async function upsertSubscriptionRow(item: any): Promise<boolean> {
  const row = toSubscriptionRow(item);
  if (!row.id) {
    console.error('[Subscription Row] Refusing to write a subscription with no id.');
    return false;
  }

  const candidateId = item?.customerId ? String(item.customerId) : null;
  if (candidateId) {
    const exists = await prisma.customer
      .findUnique({ where: { id: candidateId }, select: { id: true } })
      .catch(() => null);
    if (exists) row.customerId = candidateId;
  }
  // Fall back to matching the customer by email, which is what the caller
  // actually had, so the relation is still populated where it can be.
  if (!row.customerId && row.customerEmail) {
    const byEmail = await prisma.customer
      .findUnique({ where: { email: row.customerEmail }, select: { id: true } })
      .catch(() => null);
    if (byEmail) row.customerId = byEmail.id;
  }

  try {
    await prisma.subscription.upsert({ where: { id: row.id }, update: row, create: row as any });
    return true;
  } catch (err: any) {
    console.error(`[Subscription Row] Neon write failed for ${row.id}:`, err?.message);
    return false;
  }
}
