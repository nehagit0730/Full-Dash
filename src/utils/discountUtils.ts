import { Discount, Customer, CartItem, RewardGift } from '../types';

/**
 * Bundled artwork for gift rewards that are not catalogue products. Served from
 * public/reward-assets, kept out of /assets so it cannot collide with Vite's
 * hashed build output.
 */
export const MYSTERY_BOX_IMAGE = '/reward-assets/mystery-box.svg';
export const MERCH_GIFT_IMAGE = '/reward-assets/merch-gift.svg';

/** Standard UK delivery charge and the spend that waives it. */
export const STANDARD_DELIVERY_COST = 2.99;
export const FREE_SHIPPING_THRESHOLD = 40;

export interface ResolveDiscountResult {
  success: boolean;
  discount?: Discount;
  error?: string;
  message?: string;
}

/**
 * Extracts the first 3 letters of a customer's name or email to serve as their unique loyalty coupon prefix.
 * e.g. "NEHA" -> "NEH", "Scott Kivlin" -> "SCO", "Bob" -> "BOB", "Jo" -> "JON"
 */
export function getCustomerPrefix(customer?: { name?: string; email?: string } | null): string {
  if (!customer) return 'PS';
  const nameCandidate = (customer.name || customer.email || 'POUCH').trim();
  // Strip non-letter characters
  const lettersOnly = nameCandidate.replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (lettersOnly.length >= 3) {
    return lettersOnly.substring(0, 3);
  }
  return (lettersOnly + 'POUCH').substring(0, 3);
}

/**
 * Formats a loyalty milestone code with customer's 3-letter prefix (e.g. NEH-BRONZE1).
 */
export function formatLoyaltyCouponCode(baseCode: string, customer?: { name?: string; email?: string } | null): string {
  const prefix = getCustomerPrefix(customer);
  // If baseCode already contains a matching prefix, don't duplicate
  if (baseCode.toUpperCase().startsWith(`${prefix}-`)) {
    return baseCode.toUpperCase();
  }
  return `${prefix}-${baseCode.toUpperCase()}`;
}

export type LoyaltyTierId = 'bronze' | 'silver' | 'gold' | 'platinum';

/**
 * How a milestone reward actually pays out:
 * - 'discount'      money off the order
 * - 'free-cans'     the customer picks N cans, each added to the order at £0
 * - 'free-shipping' the delivery charge is zeroed whatever option is chosen
 * - 'gift'          a non-catalogue item (mystery box, merch) ships at £0
 * - 'choice'        the customer picks one of several rewards above
 */
export type LoyaltyRewardKind = 'discount' | 'free-cans' | 'free-shipping' | 'gift' | 'choice';

export interface LoyaltyRewardChoice {
  id: string;
  label: string;
  kind: Exclude<LoyaltyRewardKind, 'choice'>;
  details: string;
  type: Discount['type'];
  valueType?: 'Percentage' | 'Fixed amount';
  valueAmount?: number;
  freeCanCount?: number;
  gifts?: RewardGift[];
}

export interface LoyaltyMilestoneDef {
  code: string;
  order: number;
  tier: LoyaltyTierId;
  reward: string;
  type: Discount['type'];
  valueType?: 'Percentage' | 'Fixed amount';
  /**
   * Money taken off the subtotal. Deliberately 0 for 'free-cans' and 'gift'
   * rewards: the can or gift is added as its own £0 line, so also discounting
   * the subtotal would pay the reward out twice.
   */
  valueAmount?: number;
  details: string;
  kind: LoyaltyRewardKind;
  freeCanCount?: number;
  gifts?: RewardGift[];
  choices?: LoyaltyRewardChoice[];
}

const MYSTERY_GIFT: RewardGift = {
  id: 'gift-mystery-box',
  label: 'Mystery Reward 🎁',
  image: MYSTERY_BOX_IMAGE,
  note: 'A surprise chosen for you by Pouch Supply — revealed when your parcel arrives.'
};

const MERCH_GIFT: RewardGift = {
  id: 'gift-merch',
  label: 'Exclusive Pouch Supply merchandise 🎁',
  image: MERCH_GIFT_IMAGE,
  note: 'Stickers, keyring, bottle opener and other Pouch Supply extras.'
};

const PREMIUM_MERCH_GIFT: RewardGift = {
  id: 'gift-merch-premium',
  label: 'Premium Pouch Supply merchandise 👕',
  image: MERCH_GIFT_IMAGE,
  note: 'Premium branded apparel, packed with your order.'
};

/** A free-can or gift reward takes nothing off the subtotal — see valueAmount. */
const NO_MONEY_OFF = { type: 'Amount off order' as const, valueType: 'Fixed amount' as const, valueAmount: 0 };

export const LOYALTY_MILESTONE_DEFINITIONS: Record<string, LoyaltyMilestoneDef> = {
  BRONZE1: {
    code: 'BRONZE1',
    order: 1,
    tier: 'bronze',
    reward: 'Members receive 10% OFF',
    type: 'Amount off order',
    valueType: 'Percentage',
    valueAmount: 10,
    details: '10% Bronze Member Welcome Discount',
    kind: 'discount'
  },
  BRONZE3: {
    code: 'BRONZE3',
    order: 3,
    tier: 'bronze',
    reward: 'FREE can of your choice',
    ...NO_MONEY_OFF,
    details: '1 FREE can of your choice',
    kind: 'free-cans',
    freeCanCount: 1
  },
  BRONZE5: {
    code: 'BRONZE5',
    order: 5,
    tier: 'bronze',
    reward: 'Free Delivery on your next order',
    type: 'Free shipping',
    valueType: 'Fixed amount',
    valueAmount: 0,
    details: 'Free Delivery on this order',
    kind: 'free-shipping'
  },
  SILVER7: {
    code: 'SILVER7',
    order: 7,
    tier: 'silver',
    reward: 'FREE can of your choice 🥫',
    ...NO_MONEY_OFF,
    details: '1 FREE can of your choice',
    kind: 'free-cans',
    freeCanCount: 1
  },
  SILVER9: {
    code: 'SILVER9',
    order: 9,
    tier: 'silver',
    reward: '£5 Store Credit 🎁',
    type: 'Amount off order',
    valueType: 'Fixed amount',
    valueAmount: 5.00,
    details: '£5.00 Store Credit',
    kind: 'discount'
  },
  SILVER11: {
    code: 'SILVER11',
    order: 11,
    tier: 'silver',
    reward: 'FREE can of your choice 🥫',
    ...NO_MONEY_OFF,
    details: '1 FREE can of your choice',
    kind: 'free-cans',
    freeCanCount: 1
  },
  SILVER13: {
    code: 'SILVER13',
    order: 13,
    tier: 'silver',
    reward: 'Exclusive Pouch Supply merchandise (stickers, keyring, bottle opener, etc.) 🎁',
    ...NO_MONEY_OFF,
    details: 'Exclusive Pouch Supply merchandise included free',
    kind: 'gift',
    gifts: [MERCH_GIFT]
  },
  SILVER15: {
    code: 'SILVER15',
    order: 15,
    tier: 'silver',
    reward: '2 FREE cans of your choice 🥫',
    ...NO_MONEY_OFF,
    details: '2 FREE cans of your choice',
    kind: 'free-cans',
    freeCanCount: 2
  },
  GOLD17: {
    code: 'GOLD17',
    order: 17,
    tier: 'gold',
    reward: '20% off your purchase 🎁',
    type: 'Amount off order',
    valueType: 'Percentage',
    valueAmount: 20,
    details: '20% Gold Member Discount',
    kind: 'discount'
  },
  GOLD19: {
    code: 'GOLD19',
    order: 19,
    tier: 'gold',
    reward: '2 FREE cans of your choice 🥫',
    ...NO_MONEY_OFF,
    details: '2 FREE cans of your choice',
    kind: 'free-cans',
    freeCanCount: 2
  },
  GOLD21: {
    code: 'GOLD21',
    order: 21,
    tier: 'gold',
    reward: 'Mystery Reward (chosen by Pouch Supply) 🎁',
    ...NO_MONEY_OFF,
    details: 'Mystery Reward included free with this order',
    kind: 'gift',
    gifts: [MYSTERY_GIFT]
  },
  GOLD23: {
    code: 'GOLD23',
    order: 23,
    tier: 'gold',
    reward: '2 FREE cans of your choice 🥫',
    ...NO_MONEY_OFF,
    details: '2 FREE cans of your choice',
    kind: 'free-cans',
    freeCanCount: 2
  },
  GOLD25: {
    code: 'GOLD25',
    order: 25,
    tier: 'gold',
    reward: 'Premium Pouch Supply merchandise 👕',
    ...NO_MONEY_OFF,
    details: 'Premium Pouch Supply merchandise included free',
    kind: 'gift',
    gifts: [PREMIUM_MERCH_GIFT]
  },
  GOLD27: {
    code: 'GOLD27',
    order: 27,
    tier: 'gold',
    reward: '20% off your purchase 🎁',
    type: 'Amount off order',
    valueType: 'Percentage',
    valueAmount: 20,
    details: '20% Gold Member Discount',
    kind: 'discount'
  },
  GOLD29: {
    code: 'GOLD29',
    order: 29,
    tier: 'gold',
    reward: '2 FREE cans of your choice 🥫',
    ...NO_MONEY_OFF,
    details: '2 FREE cans of your choice',
    kind: 'free-cans',
    freeCanCount: 2
  },
  GOLD30: {
    code: 'GOLD30',
    order: 30,
    tier: 'gold',
    reward: 'Unlock Platinum Member 🏆',
    type: 'Amount off order',
    valueType: 'Percentage',
    valueAmount: 25,
    details: '25% Platinum Unlock Welcome Discount',
    kind: 'discount'
  },
  PLATINUM_ODD: {
    code: 'PLATINUM_ODD',
    order: 31,
    tier: 'platinum',
    reward: 'Odd order reward: choose 3 FREE cans, £10 Store Credit, Free Delivery, exclusive merchandise, or a Mystery Reward',
    ...NO_MONEY_OFF,
    details: 'Platinum VIP odd-order reward',
    kind: 'choice',
    choices: [
      {
        id: 'cans',
        label: '3 FREE cans of your choice 🥫',
        kind: 'free-cans',
        details: '3 FREE cans of your choice',
        ...NO_MONEY_OFF,
        freeCanCount: 3
      },
      {
        id: 'credit',
        label: '£10.00 Store Credit 💷',
        kind: 'discount',
        details: '£10.00 Store Credit',
        type: 'Amount off order',
        valueType: 'Fixed amount',
        valueAmount: 10.00
      },
      {
        id: 'delivery',
        label: 'Free Priority Delivery 🚚',
        kind: 'free-shipping',
        details: 'Free Delivery on this order',
        type: 'Free shipping',
        valueType: 'Fixed amount',
        valueAmount: 0
      },
      {
        id: 'merch',
        label: 'Exclusive Pouch Supply merchandise 🎁',
        kind: 'gift',
        details: 'Exclusive Pouch Supply merchandise included free',
        ...NO_MONEY_OFF,
        gifts: [MERCH_GIFT]
      },
      {
        id: 'mystery',
        label: 'Mystery Reward 🎲',
        kind: 'gift',
        details: 'Mystery Reward included free with this order',
        ...NO_MONEY_OFF,
        gifts: [MYSTERY_GIFT]
      }
    ]
  }
};

/** Milestones belonging to one tier, in order. Drives the loyalty rewards page. */
export function getMilestonesForTier(tier: LoyaltyTierId): LoyaltyMilestoneDef[] {
  return Object.values(LOYALTY_MILESTONE_DEFINITIONS)
    .filter(def => def.tier === tier)
    .sort((a, b) => a.order - b.order);
}

/**
 * Extracts base code from input code which may contain customer prefixes or hyphens.
 * e.g. "NEH-BRONZE1" -> "BRONZE1", "NEHBRONZE1" -> "BRONZE1", "BRONZE1" -> "BRONZE1"
 */
export function extractBaseMilestoneCode(inputCode: string): string | null {
  const clean = inputCode.trim().toUpperCase().replace(/[\s_]+/g, '-');
  
  // 1. Direct match with definitions
  if (LOYALTY_MILESTONE_DEFINITIONS[clean]) {
    return clean;
  }

  // 2. Handle with hyphen: e.g. "NEH-BRONZE1" -> "BRONZE1", "SCO-PLATINUM_ODD" -> "PLATINUM_ODD"
  if (clean.includes('-')) {
    const parts = clean.split('-');
    const withoutPrefix = parts.slice(1).join('-');
    if (LOYALTY_MILESTONE_DEFINITIONS[withoutPrefix]) {
      return withoutPrefix;
    }
    const lastPart = parts[parts.length - 1];
    if (LOYALTY_MILESTONE_DEFINITIONS[lastPart]) {
      return lastPart;
    }
  }

  // 3. Handle without hyphen: e.g. "NEHBRONZE1" or "SCOGOLD17" (strip 2-4 letter prefix)
  const noHyphen = clean.replace(/[^A-Z0-9]/g, '');
  for (const baseKey of Object.keys(LOYALTY_MILESTONE_DEFINITIONS)) {
    if (noHyphen.endsWith(baseKey)) {
      return baseKey;
    }
  }

  // 4. Dynamic Platinum patterns like PLATINUM31, PLATINUM33, PLATINUM
  if (noHyphen.includes('PLATINUM')) {
    return 'PLATINUM_ODD';
  }

  return null;
}

/**
 * Resolves any promo code (DB discounts, loyalty rewards with customer prefixes, referrals, subscriber perks).
 */
export function resolveDiscountCode(
  rawInputCode: string,
  activeDiscounts: Discount[] = [],
  customers: Customer[] = [],
  loggedInCustomer: Customer | null = null,
  cartItems: CartItem[] = [],
  subtotal: number = 0
): ResolveDiscountResult {
  const code = rawInputCode.trim().toUpperCase();
  if (!code) {
    return { success: false, error: 'Please enter a discount code.' };
  }

  // 1. Check exact match in active database discounts
  const dbMatch = activeDiscounts.find(
    d => d.status === 'Active' && (d.title.toUpperCase() === code || d.id.toUpperCase() === code)
  );
  if (dbMatch) {
    return {
      success: true,
      discount: dbMatch,
      message: `Discount code "${code}" applied: ${dbMatch.details || dbMatch.title}!`
    };
  }

  // 2. Check if DB discount matches after stripping 3-letter customer prefix (e.g. "NEH-SUMMER20" -> "SUMMER20")
  if (code.includes('-') || code.length > 4) {
    const parts = code.split('-');
    const strippedHyphen = parts.length > 1 ? parts.slice(1).join('-') : code.substring(3);
    const dbPrefixMatch = activeDiscounts.find(
      d => d.status === 'Active' && d.title.toUpperCase() === strippedHyphen
    );
    if (dbPrefixMatch) {
      return {
        success: true,
        discount: {
          ...dbPrefixMatch,
          title: code // keep entered code for display
        },
        message: `Discount code "${code}" applied: ${dbPrefixMatch.details || dbPrefixMatch.title}!`
      };
    }
  }

  // 3. Check Loyalty Tier Milestone Coupons (with or without customer prefix like NEH-BRONZE1 or NEHBRONZE1)
  const baseMilestoneKey = extractBaseMilestoneCode(code);
  if (baseMilestoneKey && LOYALTY_MILESTONE_DEFINITIONS[baseMilestoneKey]) {
    const def = LOYALTY_MILESTONE_DEFINITIONS[baseMilestoneKey];
    const virtualLoyaltyDiscount: Discount = {
      id: `disc-loyalty-${def.code.toLowerCase()}`,
      title: code,
      status: 'Active',
      method: 'Code',
      eligibility: 'All customers',
      type: def.type,
      valueType: def.valueType,
      valueAmount: def.valueAmount,
      details: def.details,
      used: 0,
      limitOnePerCustomer: false,
      loyaltyMilestoneCode: def.code,
      rewardKind: def.kind,
      freeCanCount: def.freeCanCount,
      freeCanSelections: def.kind === 'free-cans' ? [] : undefined,
      rewardGifts: def.gifts
    };

    return {
      success: true,
      discount: virtualLoyaltyDiscount,
      message: `Loyalty Coupon "${code}" applied: ${def.details}!`
    };
  }

  // 4. The first-50 offer is no longer a code.
  //
  // SUB10 / SUBSCRIBER10 / FIRST50 used to resolve here to a permanent 10% for
  // ANYONE who typed one — no limit of fifty, no check that the person was new,
  // and no limit to one order. The offer is now applied automatically by the
  // server to the first fifty accounts on their first order
  // (backend/services/newCustomerDiscount.ts), so there is no code to share and
  // nothing for the browser to claim.

  // 5. Customer Referral Codes
  const matchingCustomer = customers.find(c => c.referralCode && c.referralCode.toUpperCase() === code);
  if (matchingCustomer) {
    if (loggedInCustomer && loggedInCustomer.id === matchingCustomer.id) {
      return {
        success: false,
        error: 'You cannot use your own referral code.'
      };
    }

    const virtualRefDiscount: Discount = {
      id: `disc-ref-virtual-${matchingCustomer.id}`,
      title: code,
      status: 'Active',
      method: 'Code',
      eligibility: 'All customers',
      type: 'Amount off order',
      valueType: 'Percentage',
      valueAmount: 10,
      details: `10% referral discount courtesy of ${(matchingCustomer.name || 'a friend').split(' ')[0]}`,
      used: 0,
      limitOnePerCustomer: true
    };

    return {
      success: true,
      discount: virtualRefDiscount,
      message: 'Referral code applied! You receive a 10% discount on your order.'
    };
  }

  return {
    success: false,
    error: 'Invalid or expired discount code.'
  };
}

/**
 * The reward options on a multi-option milestone (Platinum odd orders), or []
 * for every other reward.
 */
export function getRewardChoices(discount?: Discount | null): LoyaltyRewardChoice[] {
  if (!discount?.loyaltyMilestoneCode) return [];
  return LOYALTY_MILESTONE_DEFINITIONS[discount.loyaltyMilestoneCode]?.choices || [];
}

/**
 * Applies the customer's pick on a multi-option reward, collapsing the 'choice'
 * discount into the concrete reward they took.
 */
export function applyRewardChoice(discount: Discount, choiceId: string): Discount {
  const choice = getRewardChoices(discount).find(c => c.id === choiceId);
  if (!choice) return discount;
  return {
    ...discount,
    type: choice.type,
    valueType: choice.valueType,
    valueAmount: choice.valueAmount,
    details: choice.details,
    rewardKind: choice.kind,
    rewardChoiceId: choice.id,
    freeCanCount: choice.freeCanCount,
    freeCanSelections: choice.kind === 'free-cans' ? [] : undefined,
    rewardGifts: choice.gifts
  };
}

/** How many cans still need picking before this reward is ready to check out. */
export function getOutstandingFreeCanCount(discount?: Discount | null): number {
  if (!discount || discount.rewardKind !== 'free-cans') return 0;
  const required = discount.freeCanCount || 0;
  const chosen = (discount.freeCanSelections || []).length;
  return Math.max(required - chosen, 0);
}

/**
 * True while an applied reward still needs input from the customer — an
 * unpicked free can, or an unchosen option on a multi-option reward. Checkout
 * is blocked until this is false so a reward can never be silently dropped.
 */
export function rewardNeedsSelection(discount?: Discount | null): boolean {
  if (!discount) return false;
  if (discount.rewardKind === 'choice') return !discount.rewardChoiceId;
  return getOutstandingFreeCanCount(discount) > 0;
}

/**
 * Whether the applied discount waives delivery. Recognises the reward metadata
 * first, then falls back to the discount type and wording so admin-created
 * "Free shipping" codes and older saved orders still qualify.
 */
export function isFreeShippingReward(discount?: Discount | null): boolean {
  if (!discount) return false;
  if (discount.rewardKind === 'free-shipping') return true;
  if (discount.type === 'Free shipping') return true;
  const details = (discount.details || '').toLowerCase();
  const title = (discount.title || '').toUpperCase();
  return (
    title.includes('BRONZE5') ||
    details.includes('free shipping') ||
    details.includes('free delivery') ||
    details.includes('free royal mail')
  );
}

/**
 * The delivery charge for an order: zero when a free-delivery reward applies —
 * whatever delivery option was chosen — or when the spend threshold is met.
 */
export function resolveDeliveryCost(
  subtotalAfterDiscount: number,
  discount?: Discount | null,
  baseCost: number = STANDARD_DELIVERY_COST
): number {
  if (isFreeShippingReward(discount)) return 0;
  if (subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD) return 0;
  return baseCost;
}
