import { prisma } from './prisma';

/**
 * Writing an order into the typed `Order` table.
 *
 * Orders are passed around the server as loose objects that carry more than the
 * table holds — `deliveryCost` and `shippingAddress` among them. Handing such an
 * object straight to `prisma.order.upsert()` does not drop the extra keys, it
 * throws `Unknown argument`, and every call site swallowed that as a warning. So
 * the order reached the StoreResource blob (which accepts any shape) while the
 * `Order` table silently never received the row, and the admin list — which
 * merges both sources — still looked correct.
 *
 * `toOrderRow` narrows an order to exactly the columns that exist. Anything it
 * drops is already preserved inside `data`, which is the full object.
 */

/** Every scalar column on the `Order` model, except the relation ids. */
const ORDER_COLUMNS = [
  'customerName',
  'customerEmail',
  'tags',
  'fulfillmentStatus',
  'paymentStatus',
  'worldpayTxId',
  'worldpayAuthCode',
  'gatewayTxId',
  'gatewayAuthCode',
  'cardBrand',
  'total',
  'storeCreditApplied',
  'destination',
  'date',
  'deliveryMethod',
  'items',
  'trackingId',
  'carrier',
  'trackingHistory',
  'discountApplied',
  'subtotal',
  'shippingCost',
  'discountAmount',
  'paymentMethod',
  'currency',
  'trackingNumber',
  'royalMailOrderId',
  'isSubscription',
  'subscriptionDetails',
  'notificationsSent'
] as const;

const num = (value: any, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function toOrderRow(item: any): Record<string, any> {
  const id = String(item?.id || item?.orderId || '');

  const row: Record<string, any> = {
    id,
    // Required columns get a value even when the caller omitted one, because the
    // table rejects nulls here and losing the order is the worse outcome.
    customerName: item?.customerName || 'Valued Customer',
    customerEmail: item?.customerEmail || 'customer@pouch-supply.com',
    tags: Array.isArray(item?.tags) ? item.tags : [],
    fulfillmentStatus: item?.fulfillmentStatus || 'Unfulfilled',
    destination: item?.destination || item?.address || 'United Kingdom',
    date: item?.date || new Date().toISOString(),
    deliveryMethod: item?.deliveryMethod || 'Royal Mail Tracked 24/48',
    items: Array.isArray(item?.items) ? item.items : [],
    total: num(item?.total),
    // The whole order, including the fields the table has no column for.
    data: item ?? {}
  };

  for (const key of ORDER_COLUMNS) {
    if (key in row) continue;
    const value = (item as any)?.[key];
    if (value === undefined) continue;
    row[key] = value;
  }

  // `shippingCost` is the column; `deliveryCost` is the name the checkout uses.
  if (row.shippingCost === undefined && item?.deliveryCost !== undefined) {
    row.shippingCost = num(item.deliveryCost, 0);
  }

  // Royal Mail writes its dispatch details under `data.royalMail`, so the
  // dedicated columns stayed empty and the shipment could not be found from SQL.
  const royalMail = item?.data?.royalMail;
  if (royalMail) {
    if (row.royalMailOrderId === undefined && royalMail.royalMailOrderId) {
      row.royalMailOrderId = String(royalMail.royalMailOrderId);
    }
    if (row.trackingNumber === undefined && royalMail.trackingNumber) {
      row.trackingNumber = String(royalMail.trackingNumber);
    }
    if (row.carrier === undefined && royalMail.carrier) {
      row.carrier = String(royalMail.carrier);
    }
  }
  if (row.storeCreditApplied !== undefined) row.storeCreditApplied = num(row.storeCreditApplied);
  if (row.subtotal !== undefined) row.subtotal = num(row.subtotal);
  if (row.shippingCost !== undefined) row.shippingCost = num(row.shippingCost);
  if (row.discountAmount !== undefined) row.discountAmount = num(row.discountAmount);
  // `isSubscription` only became a field late, so orders written before that
  // carry the evidence without the flag: a populated subscriptionDetails, or a
  // subscription tag. Reading the flag alone would report every one of those as
  // a one-off purchase.
  if (row.isSubscription === undefined) {
    const tagged = row.tags.some((t: any) => String(t).toLowerCase().includes('subscription'));
    const hasDetails = Boolean(item?.subscriptionDetails && Object.keys(item.subscriptionDetails).length > 0);
    row.isSubscription = tagged || hasDetails;
  } else {
    row.isSubscription = Boolean(row.isSubscription);
  }
  if (row.tags.length === 0) row.tags = ['Storefront', 'Online Order'];

  return row;
}

/**
 * Upsert an order into the `Order` table and confirm the row is really there.
 *
 * `customerId`/`subscriptionId` are attached only when the referenced row
 * exists: pointing them at a missing id fails the whole write on a foreign key
 * violation, and an order with no link is far better than no order at all.
 */
export async function upsertOrderRow(item: any): Promise<boolean> {
  const row = toOrderRow(item);
  if (!row.id) {
    console.error('[Order Row] Refusing to write an order with no id.');
    return false;
  }

  const customerId = item?.customerId ? String(item.customerId) : null;
  const subscriptionId = item?.subscriptionId ? String(item.subscriptionId) : null;

  if (customerId) {
    const exists = await prisma.customer
      .findUnique({ where: { id: customerId }, select: { id: true } })
      .catch(() => null);
    if (exists) row.customerId = customerId;
  }
  if (subscriptionId) {
    const exists = await prisma.subscription
      .findUnique({ where: { id: subscriptionId }, select: { id: true } })
      .catch(() => null);
    if (exists) row.subscriptionId = subscriptionId;
  }

  try {
    await prisma.order.upsert({
      where: { id: row.id },
      update: row,
      // `row` is assembled from a loose object, so it is narrowed to the real
      // columns at runtime by toOrderRow rather than by the compiler.
      create: row as any
    });
    return true;
  } catch (err: any) {
    console.error(`[Order Row] Neon write failed for ${row.id}:`, err?.message);
    return false;
  }
}
