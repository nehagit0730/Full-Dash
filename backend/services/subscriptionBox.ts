/**
 * Shared helpers for describing what is actually inside a subscription box.
 *
 * Renewal orders used to be built from `planName`, which is a display string
 * such as:
 *
 *   "LITE Plan [Next Day (Test) - 10% OFF] - (5.2 mg Watermelon ice (Qty:3), …)"
 *
 * Appending " (Recurring Renewal)" to that and re-parsing it downstream is what
 * produced order lines named "20 mg Ghost Cola Ice ) (Recurring Renewal". The
 * renewal now carries the structured selection stored on the subscription, so
 * every renewal order lists the products the customer actually chose.
 */

export interface StoredBoxItem {
  productId?: string;
  variantId?: string;
  brand?: string;
  vendor?: string;
  name?: string;
  productTitle?: string;
  title?: string;
  variant?: string;
  variantName?: string;
  quantity?: number;
  image?: string;
  price?: number;
  [key: string]: any;
}

const PLACEHOLDER_NAMES = ['product', 'products', 'item', 'unknown', 'n/a', 'sku-001', 'subscription pack'];

function isPlaceholderName(value: any): boolean {
  const v = String(value ?? '').trim().toLowerCase();
  return !v || PLACEHOLDER_NAMES.includes(v);
}

function isSubscriptionPackLine(item: any): boolean {
  if (!item) return false;
  return Boolean(
    item.vendor === 'Subscription Pack' ||
    (typeof item.productId === 'string' && item.productId.includes('sub-pack')) ||
    Array.isArray(item.subscriptionItems) ||
    Array.isArray(item.selectedProducts)
  );
}

/**
 * Returns the customer's box contents from a stored subscription.
 *
 * Two shapes exist in the data. Checkout stores the whole cart, where a single
 * "sub-pack" line holds the selection under `subscriptionItems`. The account
 * area's plan editor stores the chosen products directly in `items`. Both are
 * real product rows; neither is reconstructed from text.
 */
export function extractBoxItems(subscription: any): StoredBoxItem[] {
  if (!subscription) return [];

  const direct =
    subscription.subscriptionItems ||
    subscription.selectedProducts ||
    subscription.subItems;
  if (Array.isArray(direct) && direct.length > 0) return direct;

  const items = Array.isArray(subscription.items) ? subscription.items : [];
  if (items.length === 0) return [];

  const packLine = items.find(isSubscriptionPackLine);
  if (packLine) {
    const nested = packLine.subscriptionItems || packLine.selectedProducts || packLine.items;
    if (Array.isArray(nested) && nested.length > 0) return nested;
    return [];
  }

  // No pack wrapper: `items` is already the list of chosen products.
  return items.filter((it: any) => {
    const name = it?.productTitle || it?.title || it?.name;
    return Boolean(it?.productId) || !isPlaceholderName(name);
  });
}

/**
 * Builds the order lines for a renewal charge.
 *
 * The stored cart shape is reused as-is when present. Otherwise a single
 * subscription line is created carrying the plan tier as its title and the box
 * contents as structured data — never the plan's display string, which already
 * contains a rendered product list.
 */
export function buildRenewalOrderItems(
  subscription: any,
  itemSubtotal: number,
  planTitle: string
): any[] {
  const boxItems = extractBoxItems(subscription);
  const storedItems = Array.isArray(subscription?.items) ? subscription.items : [];

  if (storedItems.length > 0) {
    return storedItems.map((it: any) => ({
      ...it,
      isSubscription: true,
      // Attach the selection to the pack line so the order detail view can list
      // the box contents without re-parsing the plan title.
      ...(isSubscriptionPackLine(it) && boxItems.length > 0
        ? { subscriptionItems: boxItems, selectedProducts: boxItems }
        : {})
    }));
  }

  return [
    {
      productId: subscription?.planId || 'sub-pack',
      productTitle: `${planTitle} (Recurring Renewal)`,
      price: itemSubtotal,
      quantity: 1,
      isSubscription: true,
      subscriptionPlan: planTitle,
      subscriptionItems: boxItems,
      selectedProducts: boxItems,
      // Subscriptions taken before the selection was stored describe the box only
      // in `planName`. It is carried here, unmodified and separate from the
      // title, so the order view can still recover the real products from it —
      // concatenating it into the title is what corrupted those names before.
      subscriptionSummary: String(subscription?.planName || ''),
      total: itemSubtotal
    }
  ];
}

/**
 * Reduces a stored `planName` to its tier heading.
 *
 * `planName` is frequently the full storefront label, so everything from the
 * frequency bracket or the product list onward is dropped.
 */
export function planTitleFromSubscription(subscription: any): string {
  const raw = String(subscription?.planName || subscription?.planId || '').trim();
  if (!raw) return 'Pouch Supply Subscription';

  const heading = raw.split(/\s*\[|\s+-\s+\(/)[0].trim();
  const lower = heading.toLowerCase();

  if (lower.includes('ultimate')) return 'ULTIMATE Plan';
  if (lower.includes('pro')) return 'PRO Plan';
  if (lower.includes('core')) return 'CORE Plan';
  if (lower.includes('lite')) return 'LITE Plan';

  return heading || 'Pouch Supply Subscription';
}
