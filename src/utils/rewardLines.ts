import { CartItem, Discount, FreeCanSelection, Product } from '../types';
import { applyRewardChoice } from './discountUtils';
import { loadRewardSelection } from './rewardSelectionStore';

/**
 * Restores a selection the customer already made for this reward code — on the
 * loyalty rewards page, or on an earlier visit — so applying the voucher again
 * does not throw the picker at them a second time.
 *
 * A remembered multi-option choice is collapsed through applyRewardChoice, so
 * the reward is left fully resolved rather than merely tagged with a choice id.
 */
export function hydrateRewardSelection(discount: Discount): Discount {
  if (!discount.loyaltyMilestoneCode) return discount;
  const stored = loadRewardSelection(discount.title);
  if (!stored) return discount;

  let next = discount;

  if (next.rewardKind === 'choice' && stored.rewardChoiceId) {
    next = applyRewardChoice(next, stored.rewardChoiceId);
  }

  // Only meaningful once the reward is known to grant cans — a remembered
  // can list must not resurrect on a choice the customer has since changed.
  if (next.rewardKind === 'free-cans' && stored.freeCanSelections?.length) {
    next = { ...next, freeCanSelections: stored.freeCanSelections.slice(0, next.freeCanCount || 0) };
  }

  return next;
}

/**
 * One can a customer can pick for a free-can reward. Products are expanded to
 * their concrete variants so the picker shows a real, orderable flavour rather
 * than a parent product the warehouse cannot pack.
 */
export interface SelectableCan {
  key: string; // Stable identity for selection state
  productId: string;
  productTitle: string;
  vendor: string; // Brand
  variantName: string; // Flavour / variant
  variantId?: string;
  image: string;
  sku?: string;
  strength?: string;
  price: number;
  inventory: number;
}

/**
 * Every in-stock can the customer may choose from, one entry per purchasable
 * variant. Products without concrete variants contribute a single entry.
 */
export function buildCanCatalogue(products: Product[] = []): SelectableCan[] {
  const cans: SelectableCan[] = [];

  for (const product of products) {
    if (!product || product.status !== 'Active') continue;
    // Variant cards are duplicates of a parent's concrete variant; including
    // them would list the same flavour twice.
    if (product.isVariantCard) continue;

    const variants = product.concreteVariants || [];

    if (variants.length === 0) {
      cans.push({
        key: product.id,
        productId: product.id,
        productTitle: product.title,
        vendor: product.vendor || '',
        variantName: product.flavour || product.variant || 'Standard',
        image: product.image || (product.media || [])[0] || '',
        sku: product.sku,
        strength: product.strength,
        price: product.price,
        inventory: product.inventory ?? 0
      });
      continue;
    }

    for (const variant of variants) {
      cans.push({
        key: `${product.id}::${variant.id}`,
        productId: product.id,
        productTitle: product.title,
        vendor: product.vendor || '',
        variantName: variant.name,
        variantId: variant.id,
        image: (variant.images || [])[0] || product.image || '',
        sku: variant.id || product.sku,
        strength: product.strength,
        price: variant.price ?? product.price,
        inventory: variant.inventory ?? 0
      });
    }
  }

  return cans;
}

export function canToSelection(can: SelectableCan): FreeCanSelection {
  return {
    productId: can.productId,
    productTitle: can.productTitle,
    vendor: can.vendor,
    variantName: can.variantName,
    variantId: can.variantId,
    image: can.image,
    sku: can.sku,
    strength: can.strength,
    originalPrice: can.price
  };
}

/** Identity used to match a selection back to a catalogue entry. */
export function selectionKey(selection: FreeCanSelection): string {
  return selection.variantId ? `${selection.productId}::${selection.variantId}` : selection.productId;
}

/**
 * The £0 lines a reward adds to the order: the chosen cans, plus any gift
 * (mystery box, merchandise). These are kept out of `cartItems` on purpose —
 * a £0 cart line would be counted by the volume-price tiers and by the
 * minimum-quantity rules on other discounts — and are appended only when the
 * order payload is built.
 */
export interface RewardLine {
  productId: string;
  productTitle: string;
  price: 0;
  quantity: number;
  image: string;
  variant: string;
  sku: string;
  vendor: string;
  total: 0;
  isRewardItem: true;
  rewardCode: string;
  rewardKind: 'free-cans' | 'gift';
  isSubscription: false;
}

export function getRewardLines(discount?: Discount | null): RewardLine[] {
  if (!discount) return [];
  const rewardCode = discount.title || discount.loyaltyMilestoneCode || 'REWARD';
  const lines: RewardLine[] = [];

  for (const selection of discount.freeCanSelections || []) {
    lines.push({
      productId: selection.productId,
      productTitle: selection.productTitle,
      price: 0,
      quantity: 1,
      image: selection.image || '',
      variant: selection.variantName || 'Standard',
      sku: selection.sku || selection.variantId || selection.productId,
      vendor: selection.vendor || '',
      total: 0,
      isRewardItem: true,
      rewardCode,
      rewardKind: 'free-cans',
      isSubscription: false
    });
  }

  for (const gift of discount.rewardGifts || []) {
    lines.push({
      productId: gift.id,
      productTitle: gift.label,
      price: 0,
      quantity: 1,
      image: gift.image || '',
      variant: 'Reward gift',
      sku: gift.id,
      vendor: 'Pouch Supply',
      total: 0,
      isRewardItem: true,
      rewardCode,
      rewardKind: 'gift',
      isSubscription: false
    });
  }

  return lines;
}

/**
 * The order `items[]` payload: the paid cart lines followed by the reward's £0
 * lines. Both checkout paths (card and store-credit) build items through here so
 * a reward cannot reach one and be missing from the other.
 */
export function buildOrderItems(cartItems: CartItem[], discount?: Discount | null): any[] {
  const paidLines = cartItems.map(item => {
    let planName = (item as any).subscriptionPlan || '';
    const titleLower = (item.productTitle || '').toLowerCase();
    if (!planName) {
      if (titleLower.includes('ultimate')) planName = 'ULTIMATE Plan';
      else if (titleLower.includes('pro')) planName = 'PRO Plan';
      else if (titleLower.includes('core')) planName = 'CORE Plan';
      else if (titleLower.includes('lite')) planName = 'LITE Plan';
      else if (item.isSubscription) planName = 'PRO Plan';
    }
    return {
      productId: item.productId,
      productTitle: item.productTitle,
      price: item.price,
      quantity: item.quantity,
      image: item.image || '',
      variant: (item as any).variant || (item as any).concreteVariantName || (item as any).strength || (item as any).flavour || 'Standard',
      sku: (item as any).sku || (item as any).concreteVariantId || item.productId || 'SKU-001',
      vendor: item.vendor || '',
      isSubscription: Boolean(item.isSubscription || (item.productId && (item.productId.startsWith('sub-pack') || item.productId.includes('sub-pack')))),
      subscriptionPlan: planName || (item as any).subscriptionPlan || 'PRO Plan',
      subscriptionFrequency: (item as any).subscriptionFrequency || 'Bi-Weekly',
      frequencyDiscount: (item as any).frequencyDiscount || '10%',
      subscriptionItems: (item as any).subscriptionItems || [],
      total: Number((item.price * item.quantity).toFixed(2))
    };
  });

  return [...paidLines, ...getRewardLines(discount)];
}
