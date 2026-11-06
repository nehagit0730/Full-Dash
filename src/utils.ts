import { Discount, CartItem } from './types';

/** The unit price every tier below is quoted against. A product priced differently
 *  gets the same discount curve, scaled by its own price / this one. */
const VOLUME_BASE_UNIT_PRICE = 4.99;

/**
 * Volume pricing tiers, in pence, for a product at the base unit price.
 *
 * Held in pence because the cost table below adds these together repeatedly and
 * pounds as floats do not survive that (0.1 + 0.2 territory) — a penny of drift
 * is a penny wrong on a real basket total.
 *
 * Per can these run 4.99 → 4.85 → 4.70 → 4.40 → 4.20 → 4.10 → 3.85, so a bigger
 * bundle is always better value than a smaller one.
 */
const VOLUME_TIERS: ReadonlyArray<{ size: number; pence: number }> = [
  { size: 1, pence: 499 },
  { size: 3, pence: 1455 },
  { size: 5, pence: 2350 },
  { size: 8, pence: 3520 },
  { size: 10, pence: 4200 },
  { size: 12, pence: 4920 },
  { size: 20, pence: 7700 }
];

/** The pack sizes offered as a ready-made choice in the storefront dropdowns. */
export const PACK_SIZES: ReadonlyArray<number> = [3, 5, 8, 10, 12];

/** Cheapest cost in pence for each quantity, grown on demand and memoised. */
const volumeCostPence: number[] = [0];

/**
 * The cheapest way to buy at least `qty` units, in pence, at the base unit price.
 *
 * "At least" rather than "exactly" is deliberate, and it is what stops the curve
 * from ever punishing a larger basket. Tiers do not divide into each other, so an
 * exact-fit rule made some quantities cost more than a bigger one — under the old
 * greedy split 19 cans came to £85.46 while 20 came to £77.00. Allowing a
 * quantity to be covered by the next bundle up means the price can only ever go
 * down as the tier is approached.
 */
function volumeCostAtBasePrice(qty: number): number {
  for (let n = volumeCostPence.length; n <= qty; n++) {
    let best = Infinity;
    for (const tier of VOLUME_TIERS) {
      // max(0, …) is the "covered by a bigger bundle" case: a tier larger than
      // what is left still satisfies the remainder, at its own price.
      const candidate = volumeCostPence[Math.max(0, n - tier.size)] + tier.pence;
      if (candidate < best) best = candidate;
    }
    volumeCostPence[n] = best;
  }
  return volumeCostPence[qty];
}

/**
 * Total price for `quantity` units of a product, under the volume tiers above.
 *
 * Pack sizes land exactly on their tier — at the £4.99 base, 3 = £14.55,
 * 5 = £23.50, 8 = £35.20, 10 = £42.00, 12 = £49.20, 20 = £77.00 — and every
 * quantity in between is priced at the cheapest combination of tiers that covers
 * it.
 */
export function calculateVolumePrice(basePrice: number, quantity: number): number {
  const qty = Math.floor(quantity);
  if (qty <= 0) return 0;

  // Scale ratio if base price is custom (default base is £4.99)
  const ratio = basePrice > 0 ? basePrice / VOLUME_BASE_UNIT_PRICE : 1;

  return Number(((volumeCostAtBasePrice(qty) / 100) * ratio).toFixed(2));
}

export function calculateDiscountAmount(
  discount: Discount | null,
  cartItems: CartItem[],
  subtotal: number,
  products: any[] = [],
  collections: any[] = []
): number {
  if (!discount || discount.status !== 'Active') return 0;

  switch (discount.type) {
    case 'Amount off order': {
      // Check minimum purchase requirements first
      if (discount.minRequirementsType === 'Minimum purchase amount ($)') {
        if (subtotal < (discount.minRequirementsValue || 0)) return 0;
      }
      if (discount.minRequirementsType === 'Minimum quantity of items') {
        const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        if (totalQty < (discount.minRequirementsValue || 0)) return 0;
      }

      // Calculate discount value
      const amount = discount.valueAmount || 0;
      if (discount.valueType === 'Percentage') {
        return subtotal * (amount / 100);
      } else {
        return Math.min(amount, subtotal);
      }
    }

    case 'Amount off products': {
      // Check minimum purchase requirements
      if (discount.minRequirementsType === 'Minimum purchase amount ($)') {
        if (subtotal < (discount.minRequirementsValue || 0)) return 0;
      }
      if (discount.minRequirementsType === 'Minimum quantity of items') {
        const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        if (totalQty < (discount.minRequirementsValue || 0)) return 0;
      }

      const appliesToIds = discount.appliesToIds || [];
      const appliesToType = discount.appliesToType || 'Specific products';

      let discountSum = 0;
      const amount = discount.valueAmount || 0;

      for (const item of cartItems) {
        let matches = false;
        if (appliesToIds.length === 0) {
          matches = true;
        } else if (appliesToType === 'Specific products') {
          matches = appliesToIds.includes(item.productId);
        } else if (appliesToType === 'Specific collections') {
          const colls = collections.filter(c => appliesToIds.includes(c.id));
          matches = colls.some(c => c.productIds && c.productIds.includes(item.productId));
        }

        if (matches) {
          if (discount.valueType === 'Percentage') {
            discountSum += (item.price * item.quantity) * (amount / 100);
          } else {
            discountSum += Math.min(amount, item.price) * item.quantity;
          }
        }
      }
      return Math.min(discountSum, subtotal);
    }

    case 'Buy X get Y': {
      const buyQty = discount.customerBuysValue || 1;
      const buyType = discount.customerBuysType || 'Minimum quantity of items';
      const buyAppliesType = discount.customerBuysAppliesToType || 'Specific products';
      const buyIds = discount.customerBuysAppliesToIds || [];

      const buyMatchingItems = cartItems.filter(item => {
        if (buyIds.length === 0) return true;
        if (buyAppliesType === 'Specific products') {
          return buyIds.includes(item.productId);
        } else {
          const colls = collections.filter(c => buyIds.includes(c.id));
          return colls.some(c => c.productIds && c.productIds.includes(item.productId));
        }
      });

      const totalBuyQtyInCart = buyMatchingItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalBuyValueInCart = buyMatchingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      if (buyType === 'Minimum quantity of items' && totalBuyQtyInCart < buyQty) return 0;
      if (buyType === 'Minimum purchase amount' && totalBuyValueInCart < buyQty) return 0;

      let triggers = 1;
      if (buyType === 'Minimum quantity of items') {
        triggers = Math.floor(totalBuyQtyInCart / buyQty);
      } else {
        triggers = Math.floor(totalBuyValueInCart / buyQty);
      }
      if (triggers < 1) triggers = 1;

      const getQtyRequired = (discount.customerGetsValue || 1) * triggers;
      const getAppliesType = discount.customerGetsAppliesToType || 'Specific products';
      const getIds = discount.customerGetsAppliesToIds || [];

      const getMatchingItems = cartItems.filter(item => {
        if (getIds.length === 0) return true;
        if (getAppliesType === 'Specific products') {
          return getIds.includes(item.productId);
        } else {
          const colls = collections.filter(c => getIds.includes(c.id));
          return colls.some(c => c.productIds && c.productIds.includes(item.productId));
        }
      });

      if (getMatchingItems.length === 0) return 0;

      const flatGetItems: { price: number; productId: string }[] = [];
      for (const item of getMatchingItems) {
        for (let i = 0; i < item.quantity; i++) {
          flatGetItems.push({ price: item.price, productId: item.productId });
        }
      }

      flatGetItems.sort((a, b) => a.price - b.price);

      let itemsToDiscountCount = getQtyRequired;
      if (discount.maxUsesPerOrder) {
        itemsToDiscountCount = Math.min(itemsToDiscountCount, discount.maxUsesPerOrder);
      }
      itemsToDiscountCount = Math.min(itemsToDiscountCount, flatGetItems.length);

      let discountSum = 0;
      const getDiscountType = discount.customerGetsDiscountType || 'Percentage';
      const getDiscountVal = discount.customerGetsDiscountValue || 0;

      for (let i = 0; i < itemsToDiscountCount; i++) {
        const item = flatGetItems[i];
        if (getDiscountType === 'Free') {
          discountSum += item.price;
        } else if (getDiscountType === 'Percentage') {
          discountSum += item.price * (getDiscountVal / 100);
        } else if (getDiscountType === 'Amount off each') {
          discountSum += Math.min(getDiscountVal, item.price);
        }
      }

      return Math.min(discountSum, subtotal);
    }

    case 'Free shipping': {
      return 0;
    }

    case 'Loyalty Reward': {
      if (discount.valueType === 'Percentage' && discount.valueAmount) {
        return subtotal * (discount.valueAmount / 100);
      }
      if (discount.valueType === 'Fixed amount' && discount.valueAmount) {
        return Math.min(discount.valueAmount, subtotal);
      }
      if (discount.loyaltyRewardType === 'Percentage Off') {
        const pct = typeof discount.loyaltyRewardValue === 'number' ? discount.loyaltyRewardValue : parseFloat(String(discount.loyaltyRewardValue || '10')) || 10;
        return subtotal * (pct / 100);
      }
      if (discount.loyaltyRewardType === 'B1G1') {
        const cheapestItem = cartItems.length > 0 ? Math.min(...cartItems.map(i => i.price)) : 4.99;
        return Math.min(cheapestItem, subtotal);
      }
      if (discount.valueAmount) {
        return Math.min(discount.valueAmount, subtotal);
      }
      return Math.min(5.00, subtotal);
    }

    default:
      if (discount.valueType === 'Percentage' && discount.valueAmount) {
        return subtotal * (discount.valueAmount / 100);
      }
      if (discount.valueType === 'Fixed amount' && discount.valueAmount) {
        return Math.min(discount.valueAmount, subtotal);
      }
      if (discount.title.includes('15') || discount.details.includes('15')) {
        return subtotal * 0.15;
      }
      if (discount.title.includes('10') || discount.details.includes('10')) {
        return subtotal * 0.10;
      }
      if (discount.title.includes('20') || discount.details.includes('20')) {
        return subtotal * 0.20;
      }
      if (discount.title.includes('25') || discount.details.includes('25')) {
        return subtotal * 0.25;
      }
      return Math.min(5.00, subtotal);
  }
}

export function parseOrderTime(o: any): number {
  if (!o) return 0;
  if (o.createdAt) {
    const t = new Date(o.createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (o.timestamp && typeof o.timestamp === 'number') {
    return o.timestamp;
  }
  if (o.date) {
    let t = new Date(o.date).getTime();
    if (!isNaN(t) && t > 0) return t;

    // Clean up " at " e.g. "Aug 8, 2026 at 12:04 AM" or "8 Aug 2026 at 12:04"
    const cleaned = String(o.date).replace(/ at /i, ' ');
    t = new Date(cleaned).getTime();
    if (!isNaN(t) && t > 0) return t;

    if (String(o.date).toLowerCase().includes('today')) {
      return Date.now();
    }
  }
  const numericId = parseInt(String(o.id || '').replace(/\D/g, '')) || 0;
  return numericId;
}
