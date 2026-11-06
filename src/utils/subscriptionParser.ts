import { getPlanSlug, getPlanImage, detectPlanTier } from './planImages';
import { parseOrderTime } from '../utils';

export interface SubscriptionProductItem {
  productId?: string;
  variantId?: string;
  brand?: string;
  vendor?: string;
  /** Exact product title as it exists in the catalogue (e.g. "77 5.2 mg"). Never invented. */
  name: string;
  productTitle?: string;
  /** Exact variant name the customer picked (e.g. "Watermelon ice"). Empty when the product has none. */
  variant: string;
  variantName?: string;
  quantity: number;
  image?: string;
  price?: number;
  /** Display-only label built from the exact fields above. */
  formattedLabel?: string;
  /** True when the item was matched against the live product catalogue. */
  isResolved?: boolean;
  /** True when the item had to be recovered from a legacy order summary string. */
  isReconstructed?: boolean;
}

export interface ExtractedSubscriptionDetails {
  planName: string;
  planSlug: 'lite' | 'core' | 'pro' | 'ultimate';
  planImage: string;
  frequency: string;
  frequencyDiscount: string;
  paymentStatus: string;
  lastPaymentDate: string;
  nextPaymentDate: string;
  status?: string;
  isCancelled?: boolean;
  cancelledAt?: string;
  cancellationReason?: string;
  selectedProducts: SubscriptionProductItem[];
}

/** Minimal shape of a catalogue product needed to resolve an ordered item. */
export interface CatalogProductLike {
  id: string;
  title: string;
  vendor?: string;
  image?: string;
  price?: number;
  variant?: string;
  flavour?: string;
  concreteVariantName?: string;
  concreteVariants?: Array<{
    id: string;
    name: string;
    price?: number;
    images?: string[];
  }>;
}

const norm = (s: any) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Names earlier builds emitted when they could not work out what the customer
 * actually bought. They are never displayed — an item carrying one of these is
 * treated as having no name at all.
 */
const PLACEHOLDER_NAMES = new Set([
  'product',
  'products',
  'item',
  'unknown',
  'n a',
  'na',
  'sku 001',
  'subscription pack'
]);

function isPlaceholderName(value?: string): boolean {
  const n = norm(value);
  return !n || PLACEHOLDER_NAMES.has(n);
}

/** "Standard" was a synthetic default, not a variant a customer could pick. */
function cleanVariant(value?: string): string {
  const v = String(value ?? '').trim();
  if (!v || norm(v) === 'standard') return '';
  return v;
}

/**
 * Removes wreckage left on names that older builds derived by slicing a display
 * string — an unbalanced bracket, or the " (Recurring Renewal)" the renewal
 * worker appended after the product list had already been closed. Stripping it
 * lets the name match the catalogue again, which is what restores the real title.
 */
function repairStoredName(value: string): string {
  return value
    .replace(/\)?\s*\(\s*(?:recurring renewal|renewal)\s*\)?\s*$/i, '')
    .replace(/^[\s)]+/, '')
    .replace(/[\s(]+$/, '')
    .trim();
}

/**
 * Catalogue lookup tables, built once per resolution pass.
 *
 * Three keys are indexed because orders written by different code paths stored
 * different identifiers: the product id, the concrete variant id (older carts
 * put the variant id in `productId`), and the normalised "title + variant" text
 * that legacy summary strings were flattened into.
 */
interface CatalogIndex {
  byProductId: Map<string, CatalogProductLike>;
  byVariantId: Map<string, { product: CatalogProductLike; variant: { id: string; name: string; price?: number; images?: string[] } }>;
  byText: Map<string, { product: CatalogProductLike; variantName: string }>;
}

function buildCatalogIndex(catalog: CatalogProductLike[]): CatalogIndex {
  const byProductId = new Map<string, CatalogProductLike>();
  const byVariantId = new Map<string, any>();
  const byText = new Map<string, any>();

  const addText = (key: string, value: any) => {
    const k = norm(key);
    // First writer wins so an ambiguous phrase never silently flips to a
    // different product between renders.
    if (k && !byText.has(k)) byText.set(k, value);
  };

  catalog.forEach(product => {
    if (!product || !product.id) return;
    byProductId.set(String(product.id), product);

    const vendor = String(product.vendor || '').trim();
    const titleNoVendor = vendor && norm(product.title).startsWith(norm(vendor))
      ? product.title.slice(vendor.length).replace(/^[\s—–-]+/, '').trim()
      : product.title;

    const variants = Array.isArray(product.concreteVariants) ? product.concreteVariants : [];
    if (variants.length > 0) {
      variants.forEach(variant => {
        if (!variant || !variant.id) return;
        byVariantId.set(String(variant.id), { product, variant });
        addText(`${product.title} ${variant.name}`, { product, variantName: variant.name });
        addText(`${titleNoVendor} ${variant.name}`, { product, variantName: variant.name });
      });
    } else {
      addText(product.title, { product, variantName: '' });
      addText(titleNoVendor, { product, variantName: '' });
    }
  });

  return { byProductId, byVariantId, byText };
}

/**
 * Replaces a stored item's name and variant with the exact catalogue entry the
 * customer selected. Matching is by identifier first; the text index is only
 * consulted for legacy rows that carry no ids, and only on an exact normalised
 * match, so a near-miss is left untouched rather than renamed to another product.
 */
function resolveFromCatalog(item: SubscriptionProductItem, index: CatalogIndex | null): SubscriptionProductItem {
  if (!index) return item;

  let product: CatalogProductLike | undefined;
  let variantName = item.variant;
  let variantId = item.variantId;
  let image = item.image;
  let price = item.price;

  const variantHit =
    (item.variantId ? index.byVariantId.get(String(item.variantId)) : undefined) ||
    (item.productId ? index.byVariantId.get(String(item.productId)) : undefined);

  if (variantHit) {
    product = variantHit.product;
    variantName = variantHit.variant.name;
    variantId = variantHit.variant.id;
    if (!image && variantHit.variant.images && variantHit.variant.images[0]) image = variantHit.variant.images[0];
    if (!price && typeof variantHit.variant.price === 'number') price = variantHit.variant.price;
  } else if (item.productId && index.byProductId.has(String(item.productId))) {
    product = index.byProductId.get(String(item.productId));
  } else {
    const combined = [item.name, item.variant].filter(Boolean).join(' ');
    const textHit = index.byText.get(norm(combined)) || (item.name ? index.byText.get(norm(item.name)) : undefined);
    if (textHit) {
      product = textHit.product;
      if (!variantName) variantName = textHit.variantName;
    }
  }

  if (!product) return item;

  if (!image) image = product.image;
  if (!price && typeof product.price === 'number') price = product.price;

  const resolvedVariant = cleanVariant(variantName);

  return {
    ...item,
    productId: product.id,
    variantId,
    brand: product.vendor || item.brand,
    vendor: product.vendor || item.vendor,
    name: product.title,
    productTitle: product.title,
    variant: resolvedVariant,
    variantName: resolvedVariant,
    image,
    price,
    isResolved: true,
    formattedLabel: formatSubscriptionItemDisplay({
      brand: product.vendor,
      name: product.title,
      variant: resolvedVariant,
      quantity: item.quantity
    })
  };
}

/**
 * Formats a single subscription product for display.
 *
 * The label is built strictly from the values passed in: no brand guessing, no
 * "Product" stand-in and no "Standard" variant. A brand is only prefixed when
 * the title does not already start with it, so "77 5.2 mg" never renders as
 * "77 — 77 5.2 mg".
 */
export function formatSubscriptionItemDisplay(item: {
  brand?: string;
  vendor?: string;
  name?: string;
  productTitle?: string;
  variant?: string;
  variantName?: string;
  quantity?: number;
}): string {
  const brand = (item.brand || item.vendor || '').trim();
  const rawName = (item.name || item.productTitle || '').trim();
  const name = isPlaceholderName(rawName) ? '' : rawName;
  const variant = cleanVariant(item.variant || item.variantName);
  const qty = Number(item.quantity || 1);

  const parts: string[] = [];
  if (brand && (!name || !norm(name).startsWith(norm(brand)))) parts.push(brand);
  if (name) parts.push(name);
  if (variant) parts.push(variant);

  if (parts.length === 0) return `(Qty:${qty})`;
  return `${parts.join(' — ')} (Qty:${qty})`;
}

/** Reads the structured selection an order stored, in order of preference. */
function findStoredItems(order: any, subItem?: any): any[] | null {
  const candidates = [
    subItem?.selectedProducts,
    subItem?.subscriptionItems,
    subItem?.selectedFlavors,
    subItem?.subItems,
    subItem?.items,
    order?.subscriptionDetails?.selectedProducts,
    order?.subscriptionDetails?.items,
    order?.subscriptionDetails?.subItems,
    order?.selectedProducts,
    order?.subscriptionItems,
    order?.customer?.subItems,
    order?.customer?.data?.subItems
  ];

  for (const c of candidates) {
    if (Array.isArray(c) && c.length > 0) return c;
  }

  if (Array.isArray(order?.items)) {
    for (const it of order.items) {
      for (const key of ['selectedProducts', 'subscriptionItems', 'selectedFlavors', 'items']) {
        if (Array.isArray(it?.[key]) && it[key].length > 0) return it[key];
      }
    }
  }

  return null;
}

/** Normalises one stored row without inventing anything that is not already in it. */
function normalizeStoredItem(raw: any): SubscriptionProductItem | null {
  const p = (raw && raw.product) || raw;

  const name = [raw?.productTitle, raw?.name, raw?.title, p?.title, p?.productTitle, p?.name]
    .map((v: any) => repairStoredName(String(v ?? '')))
    .find((v: string) => v && !isPlaceholderName(v)) || '';

  const variant = cleanVariant(
    raw?.variantName || raw?.variant || raw?.concreteVariantName ||
    p?.concreteVariantName || p?.variantName || p?.variant ||
    raw?.strength || raw?.flavour || p?.strength || p?.flavour
  );

  const productId = String(raw?.productId || p?.productId || p?.id || '').trim();
  const variantId = String(raw?.variantId || raw?.concreteVariantId || p?.variantId || '').trim();

  // A row with neither a name nor an identifier carries no product information
  // at all. Dropping it is honest; showing "Product" is not.
  if (!name && !productId && !variantId) return null;

  const brand = String(raw?.brand || raw?.vendor || p?.vendor || p?.brand || '').trim();
  const quantity = Number(raw?.quantity || p?.quantity || 1) || 1;

  return {
    productId: productId || undefined,
    variantId: variantId || undefined,
    brand: brand || undefined,
    vendor: brand || undefined,
    name,
    productTitle: name,
    variant,
    variantName: variant,
    quantity,
    image: raw?.image || p?.image || '',
    price: Number(raw?.price || p?.price || 0) || undefined,
    formattedLabel: formatSubscriptionItemDisplay({ brand, name, variant, quantity })
  };
}

/**
 * Splits the "( … , … )" product summary that older subscription orders stored
 * in place of a structured item list.
 *
 * Everything recovered here is flagged `isReconstructed` and is re-matched
 * against the catalogue by the caller, because the summary is a display string:
 * it has already lost the brand and the product/variant boundary, and the
 * renewal worker appended " (Recurring Renewal)" to it — which is what produced
 * names such as "20 mg Ghost Cola Ice ) (Recurring Renewal".
 */
function reconstructFromSummary(rawTitle: string): SubscriptionProductItem[] {
  const results: SubscriptionProductItem[] = [];
  if (!rawTitle) return results;

  // Drop the suffix the renewal worker appends after the product list closes.
  const title = rawTitle.replace(/\)\s*\((?:recurring renewal|renewal)\)\s*$/i, ')').trim();

  let itemsSummary = '';
  const open = title.indexOf(' - (');
  if (open > -1) {
    const start = open + 4;
    const end = title.lastIndexOf(')');
    itemsSummary = end > start ? title.substring(start, end) : title.substring(start);
  } else if (title.startsWith('(') && title.endsWith(')')) {
    itemsSummary = title.slice(1, -1);
  }
  if (!itemsSummary.trim()) return results;

  // Split on commas outside parentheses so "Cola & Cherry (Qty:2)" stays whole.
  const parts: string[] = [];
  let cur = '';
  let depth = 0;
  for (const c of itemsSummary) {
    if (c === '(') depth++;
    else if (c === ')') depth--;
    if (c === ',' && depth === 0) {
      if (cur.trim()) parts.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur.trim()) parts.push(cur.trim());

  parts.forEach(part => {
    let cleanPart = part.trim();
    if (!cleanPart) return;

    let qty = 1;
    const qtyMatch = cleanPart.match(/\(\s*Qty\s*:\s*(\d+)\s*\)/i) || cleanPart.match(/\bx\s*(\d+)\b/i);
    if (qtyMatch) {
      qty = parseInt(qtyMatch[1], 10) || 1;
      cleanPart = cleanPart
        .replace(/\(\s*Qty\s*:\s*(\d+)\s*\)/i, '')
        .replace(/\bx\s*(\d+)\b/i, '')
        .trim();
    }

    // Strip unbalanced brackets left behind by the old renewal suffix.
    cleanPart = cleanPart.replace(/^[\s)]+/, '').replace(/[\s(]+$/, '').trim();
    if (!cleanPart || isPlaceholderName(cleanPart)) return;

    // The summary joined its pieces with an em dash. A plain hyphen belongs to a
    // real product name far more often than it separates fields, so it is not split on.
    let name = cleanPart;
    let variant = '';
    let brand = '';

    if (/\s[—–]\s/.test(cleanPart)) {
      const segments = cleanPart.split(/\s*[—–]\s*/).map(s => s.trim()).filter(Boolean);
      if (segments.length >= 3) {
        brand = segments[0];
        name = segments[1];
        variant = segments.slice(2).join(' — ');
      } else if (segments.length === 2) {
        name = segments[0];
        variant = segments[1];
      }
    } else {
      const varMatch = cleanPart.match(/^(.*?)\s*\(([^)]+)\)$/);
      if (varMatch && varMatch[1] && varMatch[2]) {
        name = varMatch[1].trim();
        variant = varMatch[2].trim();
      }
    }

    variant = cleanVariant(variant);
    if (!name) return;

    results.push({
      brand: brand || undefined,
      vendor: brand || undefined,
      name,
      productTitle: name,
      variant,
      variantName: variant,
      quantity: qty,
      isReconstructed: true,
      formattedLabel: formatSubscriptionItemDisplay({ brand, name, variant, quantity: qty })
    });
  });

  return results;
}

/**
 * Returns the products the customer actually put in their subscription box.
 *
 * Structured selections stored on the order win outright. The summary string is
 * only parsed for orders that predate structured storage, and whatever it yields
 * is matched back against `catalog` so the customer and the admin see the real
 * catalogue title and variant rather than a fragment of a display string.
 */
/**
 * Was this order rewritten by the old plan sync?
 *
 * `/api/subscriptions/update-plan` used to overwrite every subscription order a
 * customer had with the plan's current tier and box, stamping
 * `subscriptionDetails.lastSwappedAt` as it did. That stamp is the only thing
 * that ever wrote it, so its presence means the order's `subscriptionPlan`,
 * `subscriptionDetails.planName` and box fields no longer describe what was
 * bought. `productTitle` and `subscriptionSummary` were never touched and still do.
 */
export function wasRewrittenByPlanSync(order: any): boolean {
  return Boolean(order?.subscriptionDetails?.lastSwappedAt);
}

export function parseSubscriptionProducts(
  order: any,
  subItem?: any,
  catalog?: CatalogProductLike[]
): SubscriptionProductItem[] {
  const index = Array.isArray(catalog) && catalog.length > 0 ? buildCatalogIndex(catalog) : null;

  // An order the old plan sync rewrote carries some other plan's box in its
  // structured fields. Its untouched summary is what was actually bought, so
  // the structured fields are skipped for it.
  //
  // `productTitle` counts as that untouched record too. The sync rewrote the
  // structured box but never the title, and orders written before
  // `subscriptionSummary` existed carry the box only in the title — for those,
  // requiring a summary here meant falling back to the damaged box and
  // reporting another customer's flavours as what was ordered.
  const summaryIsTruth =
    wasRewrittenByPlanSync(order) &&
    Boolean(subItem?.subscriptionSummary || order?.subscriptionSummary || subItem?.productTitle);
  const stored = summaryIsTruth ? null : findStoredItems(order, subItem);
  if (stored) {
    const normalized = stored
      .map(normalizeStoredItem)
      .filter((i): i is SubscriptionProductItem => i !== null)
      .map(i => resolveFromCatalog(i, index))
      .filter(i => Boolean(i.name));
    if (normalized.length > 0) return normalized;
  }

  // `subscriptionSummary` holds the untouched plan string for subscriptions that
  // predate structured storage; it is preferred because, unlike the title, it has
  // never had a renewal suffix concatenated onto it.
  const rawTitle: string = String(
    subItem?.subscriptionSummary ||
    order?.subscriptionSummary ||
    subItem?.productTitle ||
    subItem?.title ||
    order?.items?.[0]?.productTitle ||
    order?.items?.[0]?.title ||
    ''
  ).trim();

  const fromSummary = reconstructFromSummary(rawTitle)
    .map(i => resolveFromCatalog(i, index))
    .filter(i => Boolean(i.name));
  if (fromSummary.length > 0) return fromSummary;

  // Some subscription orders have no wrapper line at all: the renewal worker
  // wrote the chosen products straight into `items`. Those lines are the box.
  const lines = Array.isArray(order?.items) ? order.items.filter((it: any) => !isPackWrapperLine(it)) : [];
  return lines
    .map(normalizeStoredItem)
    .filter((i: SubscriptionProductItem | null): i is SubscriptionProductItem => i !== null)
    .map((i: SubscriptionProductItem) => resolveFromCatalog(i, index))
    .filter((i: SubscriptionProductItem) => Boolean(i.name));
}

/** True for the wrapper line that stands in for the box, rather than a product in it. */
function isPackWrapperLine(item: any): boolean {
  if (!item) return false;
  const title = String(item.productTitle || item.title || '');
  return Boolean(
    item.vendor === 'Subscription Pack' ||
    (typeof item.productId === 'string' && item.productId.includes('sub-pack')) ||
    / - \(/.test(title) ||
    /\b(plan|subscription|pack)\b/i.test(title)
  );
}

/**
 * Is this order line a subscription plan rather than a one-off product?
 *
 * The single definition used everywhere. The account page, the order history
 * badge and the invoice each carried their own slightly different copy of this
 * test, so a plan line such as "CORE Plan (Recurring Renewal)" counted as a
 * subscription in one place and not in another.
 */
export function isSubscriptionLineItem(item: any): boolean {
  if (!item) return false;
  return Boolean(
    item.isSubscription ||
    item.vendor === 'Subscription Pack' ||
    (typeof item.productId === 'string' && item.productId.includes('sub-pack')) ||
    (item.productTitle && /subscription|plan|pack/i.test(item.productTitle))
  );
}

/** Is this order a subscription purchase or one of its recurring renewals? */
export function isSubscriptionOrder(order: any): boolean {
  if (!order) return false;
  return Boolean(
    order.isSubscription ||
    // Both the checkout and the renewal cron stamp this onto the order, so it
    // is the most reliable signal available.
    order.subscriptionId ||
    order.subscriptionDetails?.subscriptionId ||
    order.data?.subscriptionId ||
    (Array.isArray(order.tags) && order.tags.some((t: any) => typeof t === 'string' && t.toLowerCase().includes('subscription'))) ||
    (Array.isArray(order.items) && order.items.some(isSubscriptionLineItem))
  );
}

/** The subscription id an order was booked against, or '' when it names none. */
export function getOrderSubscriptionId(order: any): string {
  return String(
    order?.subscriptionId || order?.subscriptionDetails?.subscriptionId || order?.data?.subscriptionId || ''
  ).trim();
}

/** Finds the cart line that represents the subscription box itself. */
export function findSubscriptionItem(order: any): any {
  return order?.items?.find(isSubscriptionLineItem);
}

/**
 * Whether this order is an automatic subscription renewal rather than the
 * checkout that started the plan.
 */
export function isRenewalOrder(order: any): boolean {
  if (!order) return false;
  if (typeof order.isRenewal === 'boolean') return order.isRenewal;
  if (typeof order.data?.isRenewal === 'boolean') return order.data.isRenewal;
  return Boolean(
    order.data?.recurringRenewal ||
    (Array.isArray(order.tags) && order.tags.some((t: any) =>
      typeof t === 'string' && /recurring|renewal/i.test(t)
    )) ||
    String(order.paymentMethod || '').toLowerCase().includes('recurring')
  );
}

/** The parent order id explicitly recorded on an order, or '' when absent. */
export function getStoredParentOrderId(order: any): string {
  return String(order?.parentOrderId || order?.data?.parentOrderId || '').trim();
}

/**
 * The order that started this subscription, for a renewal.
 *
 * Renewals created from now on carry `parentOrderId` outright. Orders written
 * before that do not, so the parent is recovered from the order list instead:
 * every order on one plan shares a subscription id, and the oldest of those is
 * the checkout the plan began with. Returns '' for a non-renewal, or when the
 * parent is not among the orders given.
 */
export function resolveParentOrderId(order: any, allOrders: any[] = []): string {
  if (!order) return '';

  const stored = getStoredParentOrderId(order);
  if (stored && stored !== String(order.id)) return stored;

  if (!isRenewalOrder(order)) return '';

  const subId = getOrderSubscriptionId(order);
  if (!subId) return '';

  const siblings = allOrders.filter(o =>
    o &&
    String(o.id) !== String(order.id) &&
    getOrderSubscriptionId(o) === subId
  );
  if (siblings.length === 0) return '';

  // The plan's first order is the one that is not itself a renewal; if every
  // sibling looks like a renewal, fall back to the oldest.
  const originals = siblings.filter(o => !isRenewalOrder(o));
  const pool = originals.length > 0 ? originals : siblings;

  const oldest = pool.reduce((earliest, candidate) =>
    parseOrderTime(candidate) < parseOrderTime(earliest) ? candidate : earliest
  );

  return oldest ? String(oldest.id) : '';
}

/**
 * Extracts complete, normalized subscription metadata for any order.
 *
 * Pass `catalog` (the live product list) wherever it is available so the box
 * contents are reported with their exact catalogue names.
 */
export function extractSubscriptionDetails(order: any, catalog?: CatalogProductLike[]): ExtractedSubscriptionDetails {
  const details: any = order.subscriptionDetails ? { ...order.subscriptionDetails } : {};

  const subItem = findSubscriptionItem(order);

  // 1. Resolve the plan the order was actually for.
  //
  // `productTitle` and `subscriptionSummary` are written once at purchase and
  // never changed, so they are read first. `subscriptionDetails.planName` and
  // `subscriptionPlan` come after: the old plan sync overwrote both on every
  // past order (with "pro", on the account that reported it), which is why the
  // admin showed PRO for orders that were bought as LITE. On an order that sync
  // rewrote they are not consulted at all.
  const rewritten = wasRewrittenByPlanSync(order);
  const rawPlanString = details.planName || subItem?.subscriptionPlan || subItem?.productTitle || order.subPlan || order.subscriptionPlan || '';
  const planSlug =
    detectPlanTier(subItem?.productTitle) ||
    detectPlanTier(subItem?.subscriptionSummary) ||
    detectPlanTier(order.subscriptionSummary) ||
    (rewritten ? null : detectPlanTier(details.planName) || detectPlanTier(subItem?.subscriptionPlan) || detectPlanTier(order.subscriptionPlan)) ||
    getPlanSlug(rawPlanString);

  let planName = 'PRO Plan';
  if (planSlug === 'ultimate') planName = 'ULTIMATE Plan';
  else if (planSlug === 'pro') planName = 'PRO Plan';
  else if (planSlug === 'core') planName = 'CORE Plan';
  else if (planSlug === 'lite') planName = 'LITE Plan';

  const planImage = getPlanImage(planName, details.planImage || subItem?.image || (order.items && order.items[0]?.image));

  // 2. Resolve frequency and discount
  const title = (subItem?.productTitle || '').toLowerCase();
  let frequency = details.frequency || subItem?.subscriptionFrequency || order.subscriptionFrequency || '';
  let frequencyDiscount = details.frequencyDiscount || subItem?.frequencyDiscount || order.frequencyDiscount || '';

  if (!frequency) {
    if (title.includes('next day') || title.includes('1 day')) {
      frequency = 'Next Day (Test)';
    } else if (title.includes('weekly') && !title.includes('bi')) {
      frequency = 'Weekly';
    } else if (title.includes('bi-weekly') || title.includes('by weekly') || title.includes('2 week')) {
      frequency = 'Bi-Weekly';
    } else if (title.includes('month') || title.includes('one month')) {
      frequency = 'One Month';
    } else {
      frequency = 'Bi-Weekly';
    }
  }

  if (!frequencyDiscount) {
    if (frequency.includes('Next Day')) frequencyDiscount = '10%';
    else if (frequency === 'Weekly') frequencyDiscount = '5%';
    else if (frequency === 'One Month') frequencyDiscount = '12%';
    else frequencyDiscount = '10%';
  }

  const baseDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const nextDate = new Date(baseDate);
  if (frequency.includes('Next Day')) {
    nextDate.setDate(baseDate.getDate() + 1);
  } else if (frequency === 'Weekly') {
    nextDate.setDate(baseDate.getDate() + 7);
  } else if (frequency === 'Bi-Weekly') {
    nextDate.setDate(baseDate.getDate() + 14);
  } else {
    nextDate.setDate(baseDate.getDate() + 30);
  }

  // 3. Extract selected products with their exact catalogue names and variants
  const selectedProducts = parseSubscriptionProducts(order, subItem, catalog);

  const isCancelled =
    Boolean(order.subscriptionCancelled) ||
    details.status === 'Cancelled' ||
    Boolean(details.isCancelled) ||
    (Array.isArray(order.tags) && order.tags.some((t: any) => typeof t === 'string' && t.toLowerCase().includes('subscription cancelled')));

  return {
    ...details,
    planName,
    planSlug,
    planImage,
    frequency,
    frequencyDiscount,
    paymentStatus: order.paymentStatus || details.paymentStatus || 'Paid',
    lastPaymentDate: details.lastPaymentDate || baseDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    nextPaymentDate: details.nextPaymentDate || nextDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    selectedProducts,
    status: isCancelled ? 'Cancelled' : (details.status || 'Active'),
    isCancelled,
    cancelledAt: order.subscriptionCancelledAt || details.cancelledAt,
    cancellationReason: order.subscriptionCancellationReason || details.cancellationReason || (isCancelled ? 'Customer requested cancellation' : undefined)
  };
}
