/**
 * The one rule for what a subscription costs per delivery.
 *
 * Before this existed the calculation lived in two places that disagreed:
 * checkout applied a frequency discount and added shipping
 * (SubscriptionBuilder + the Worldpay callback), while a plan change from the
 * account portal wrote the raw tier price with neither. A customer who switched
 * plans therefore ended up on an amount they were never quoted, and admin price
 * edits reached neither path.
 *
 * `Subscription.amount` is the gross figure Worldpay is asked for, so it is what
 * this produces: items plus shipping, after the frequency discount.
 */

export type BillingFrequency = string;

/** Charged per can beyond a plan's included allowance. */
export const EXTRA_CAN_PRICE = 3.8;

/**
 * Discount for committing to a delivery rhythm.
 *
 * Withdrawn before go-live: subscription plans are sold at their plan price and
 * the rhythm no longer changes it. Discounting is done through the discount
 * system instead, so there is one place that decides what money comes off an
 * order rather than two that have to agree.
 *
 * Kept as a function rather than deleted because every price in the app —
 * checkout, the account plan editor, the renewal worker and the admin repricing
 * tools — runs through it. Returning 0 turns the rhythm discount off everywhere
 * at once, and is the single line to change if it is ever brought back.
 */
export function frequencyDiscountPercent(_frequency: BillingFrequency | undefined | null): number {
  return 0;
}

export interface RecurringAmountInput {
  /** The plan's headline price, from the admin plan catalogue. */
  planPrice: number;
  /** Cans beyond the plan's allowance. */
  extraCans?: number;
  /** Delivery rhythm, which sets the discount. */
  frequency?: BillingFrequency | null;
  /** Shipping added on top AFTER the discount, exactly as checkout does it. */
  shippingCost?: number;
}

/** Rounds to pennies. Money must never carry floating-point dust into a charge. */
const pennies = (n: number): number => Number((Math.round(n * 100) / 100).toFixed(2));

/**
 * The gross recurring amount.
 *
 * Mirrors checkout step for step: extras are added before the discount, and
 * shipping after it — a discount on postage was never offered and applying one
 * here would quietly undercharge every delivery.
 */
export function computeRecurringAmount({
  planPrice,
  extraCans = 0,
  frequency,
  shippingCost = 0
}: RecurringAmountInput): number {
  const base = Number(planPrice) || 0;
  const extras = Math.max(0, Number(extraCans) || 0) * EXTRA_CAN_PRICE;
  const discounted = (base + extras) * ((100 - frequencyDiscountPercent(frequency)) / 100);
  const shipping = Math.max(0, Number(shippingCost) || 0);
  return pennies(discounted + shipping);
}

/**
 * The shipping a subscription should carry when its own record does not say.
 *
 * Mirrors the renewal split in subscriptionCron: free over the threshold,
 * otherwise the standard fee.
 */
export const FREE_SHIPPING_THRESHOLD = 40;
export const STANDARD_SHIPPING = 2.99;

export function defaultShippingFor(itemsTotal: number): number {
  return Number(itemsTotal) >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
}

/**
 * The shipping already agreed for an existing subscription.
 *
 * Taken from the record wherever the various writers happened to put it, so a
 * repricing keeps the postage the customer agreed to rather than recomputing it
 * and moving them across the free-delivery threshold by accident.
 */
export function existingShippingFor(sub: any): number {
  const candidates = [
    sub?.shippingCost,
    sub?.shippingFee,
    sub?.shippingAmount,
    sub?.deliveryCost
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return defaultShippingFor(Number(sub?.itemPrice) || 0);
}

/**
 * Is this basket line a subscription plan?
 *
 * This decides whether a RECURRING CHARGE gets created, so it is deliberately
 * stricter than the detector in orders.ts that only labels an order. That one
 * also treats any title containing "pack" as a subscription, which is fine for
 * a badge and unacceptable here: it would put a customer who bought a six-pack
 * of tins onto a monthly billing schedule.
 *
 * `vendor === "Subscription Pack"` and a sub-pack sku ARE safe to add, and
 * their absence is what broke PS35806, PS56514 and PS65700: orders.ts tagged
 * them "Subscription Order" and built subscriptionDetails for them, while this
 * side found no matching item and created no subscription at all.
 */
export function isSubscriptionLine(item: any): boolean {
  if (!item) return false;
  if (item.isSubscription) return true;
  if (String(item.vendor || '').trim().toLowerCase() === 'subscription pack') return true;
  const ids = [item.productId, item.sku].map(v => String(v || '').toLowerCase());
  return ids.some(v => v.includes('sub-pack'));
}

/** The undiscounted total of an order's subscription lines. */
export function subscriptionLinesTotal(items: any[]): number {
  return (Array.isArray(items) ? items : [])
    .filter(isSubscriptionLine)
    .reduce((sum, it) => sum + (Number(it?.price || 0) * (Number(it?.quantity) || 1)), 0);
}

export interface NewSubscriptionAmountInput {
  /** Total of the order's subscription lines at their own, undiscounted prices. */
  subItemsTotal: number;
  /** Shipping actually charged on the order that created the subscription. */
  orderShipping: number;
  /** What the shopper actually paid — net of any coupon and store credit. */
  orderTotal: number;
  /** Money a coupon took off that order, where the order recorded it. */
  discountAmount?: number | null;
  /** Store credit spent on that order. */
  storeCreditApplied?: number | null;
  /** True when a REWARD waived delivery, rather than the spend threshold. */
  rewardWaivedDelivery?: boolean;
}

export interface NewSubscriptionAmount {
  /** The gross recurring charge: the plan's own price plus its shipping. */
  amount: number;
  /** The shipping that recurring charge carries. */
  shipping: number;
  /** What applied to the first order only, and was kept out of `amount`. */
  oneOffReduction: number;
}

/**
 * What a subscription should charge every period, given the order that created it.
 *
 * A coupon and store credit buy ONE delivery. The order total is net of both, so
 * storing it as `Subscription.amount` reissued the coupon on every renewal: a
 * £20 plan bought with a £2 coupon was charged £18 for life instead of £18 once
 * and £20 thereafter.
 *
 * The recurring charge is therefore built from the subscription lines' own
 * prices, which no discount ever touches — that also keeps one-off items bought
 * in the same basket out of it. For a subscription-only checkout with no coupon
 * and no credit this returns exactly what the order total gave.
 *
 * Shared by the checkout callback and the backfill script so the two can never
 * disagree about what a plan costs.
 */
export function recurringAmountForNewSubscription(
  input: NewSubscriptionAmountInput
): NewSubscriptionAmount {
  const subItemsTotal = Number(input.subItemsTotal) || 0;
  const orderShipping = Number(input.orderShipping) || 0;

  const coupon = Number(input.discountAmount);
  const credit = Number(input.storeCreditApplied);
  const oneOffReduction = pennies(
    (Number.isFinite(coupon) && coupon > 0 ? coupon : 0) +
      (Number.isFinite(credit) && credit > 0 ? credit : 0)
  );

  // A coupon can drag an order under the free-delivery threshold that the plan's
  // own price clears. Keeping that postage would bill it on every renewal, so
  // the plan is judged on its undiscounted value instead.
  const shippingChargedOnDiscountedValue =
    oneOffReduction > 0 && orderShipping > 0 && subItemsTotal >= FREE_SHIPPING_THRESHOLD;

  // A reward such as "Free Delivery on your next order" waives the charge on
  // THIS order only, so the recurring fee falls back to the normal rule.
  const shipping = input.rewardWaivedDelivery
    ? defaultShippingFor(subItemsTotal)
    : shippingChargedOnDiscountedValue
      ? 0
      : orderShipping;

  const amount =
    subItemsTotal > 0
      ? pennies(subItemsTotal + shipping)
      // No usable line prices to build on. Adding the one-off reductions back to
      // the total recovers the undiscounted order value, which is the closest
      // thing to the plan's real price left in the payload.
      : pennies(Math.max(Number(input.orderTotal) || 0, 0) + oneOffReduction);

  return { amount, shipping, oneOffReduction };
}
