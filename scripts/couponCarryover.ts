import {
  recurringAmountForNewSubscription,
  subscriptionLinesTotal
} from "../src/lib/subscriptionPricing";
import { isFreeShippingReward } from "../src/utils/discountUtils";

/**
 * Deciding whether one subscription is still carrying its coupon.
 *
 * Kept apart from `repairCouponPricedSubscriptions` — which loads stores, writes
 * schedules and emails customers — so the guards that decide to put someone's
 * price UP can be exercised on their own, with no database behind them.
 */

export const money = (n: number) => `£${Number(n || 0).toFixed(2)}`;

export const num = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** What the order that created this subscription let the shopper off. */
export function oneOffReductionOn(order: any): { coupon: number; credit: number } {
  return {
    coupon: Math.max(0, num(order?.discountAmount)),
    credit: Math.max(0, num(order?.storeCreditApplied))
  };
}

export type Verdict =
  | { kind: "unaffected" }
  | { kind: "suspicious"; reason: string; correct: number }
  | { kind: "correct"; newAmount: number; coupon: number; credit: number };

/**
 * What should happen to one subscription, given the order that created it.
 *
 * Recomputes with the SAME rule the live checkout now uses, so a repair can
 * never land on a figure the checkout would not have produced itself.
 */
export function assessSubscription(sub: any, order: any): Verdict {
  const { coupon, credit } = oneOffReductionOn(order);
  if (coupon <= 0 && credit <= 0) return { kind: "unaffected" };

  const orderItems: any[] = Array.isArray(order?.items) ? order.items : [];
  const subItemsTotal = subscriptionLinesTotal(orderItems);
  const orderShipping = num(order?.shippingCost ?? order?.deliveryCost);

  const { amount: correct } = recurringAmountForNewSubscription({
    subItemsTotal,
    orderShipping,
    orderTotal: num(order?.total),
    discountAmount: coupon,
    storeCreditApplied: credit,
    rewardWaivedDelivery: orderShipping === 0 && isFreeShippingReward(order?.discountApplied)
  });

  const current = num(sub?.amount);
  if (!Number.isFinite(correct) || correct <= 0) {
    return { kind: "suspicious", reason: "recomputed to nothing chargeable", correct };
  }

  // Only ever raises. The coupon made the stored amount too LOW; a recompute
  // that comes out lower means the record is not describing the order it points
  // at, and cutting someone's charge on that basis would be guessing.
  if (correct <= current + 0.009) {
    if (correct < current - 0.009) {
      return { kind: "suspicious", reason: "recomputes LOWER than the stored amount", correct };
    }
    return { kind: "unaffected" };
  }

  // A correction larger than the coupon itself is not this bug. The stored
  // amount would have to be wrong for some other reason too, and that needs a
  // human, not an automatic rise in someone's bill.
  if (correct - current > coupon + credit + 0.01) {
    return {
      kind: "suspicious",
      reason:
        `rise ${money(correct - current)} exceeds the ${money(coupon + credit)} ` +
        `let off on ${order?.orderId ?? order?.id}`,
      correct
    };
  }

  // Already scheduled for this exact amount — leave it rather than restarting
  // the notice period and emailing the customer twice.
  if (Math.abs(num(sub?.pendingAmount) - correct) < 0.01) return { kind: "unaffected" };

  return { kind: "correct", newAmount: correct, coupon, credit };
}
