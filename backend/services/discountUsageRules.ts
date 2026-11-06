/**
 * The rules behind a discount's "one use per customer" limit.
 *
 * Pure: no store, no network. `discountUsage` does the reading and hands the
 * records here, so the matching — which decides whether a shopper's coupon is
 * accepted or refused — can be exercised on its own.
 */

/** An order whose discount no longer counts as spent. */
export function releasesDiscount(order: any): boolean {
  return String(order?.fulfillmentStatus || "") === "Cancelled";
}

/** Uppercased letters and digits only, so "NEH-SUMMER20" and "neh summer20" match. */
export function normalizeCode(value: any): string {
  return String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Do these two discounts refer to the same offer?
 *
 * Matched on id first: `resolveDiscountCode` keeps the stored discount's id but
 * rewrites `title` to whatever the shopper typed, so "SUMMER20" and the
 * prefixed "NEH-SUMMER20" arrive as the same discount under different titles.
 * The title is only a fallback, for orders saved before ids were carried.
 */
export function isSameDiscount(a: any, b: any): boolean {
  if (!a || !b) return false;

  const aId = String(a?.id ?? "").trim().toLowerCase();
  const bId = String(b?.id ?? "").trim().toLowerCase();
  if (aId && bId) return aId === bId;

  const aCode = normalizeCode(a?.title);
  const bCode = normalizeCode(b?.title);
  return Boolean(aCode) && aCode === bCode;
}

/**
 * Whether this offer may only be used once by any one customer.
 *
 * `stored` is the discount as the STORE has it, or null when the code is not a
 * stored discount at all (a loyalty reward, a referral code). The stored record
 * wins wherever there is one: the posted discount carries its own
 * `limitOnePerCustomer`, and that is exactly the field someone bypassing the
 * limit would edit.
 *
 * Referral codes count whether or not the payload says so — the point of one is
 * to reward introducing a customer, and a code spendable on every order is a
 * permanent personal discount instead.
 */
export function resolveOnePerCustomer(stored: any | null, applied: any): boolean {
  if (!applied) return false;
  if (stored) return Boolean(stored.limitOnePerCustomer);
  if (String(applied.id || "").startsWith("disc-ref-virtual-")) return true;
  return Boolean(applied.limitOnePerCustomer);
}

/**
 * The customer's earlier order that already spent this discount, if any.
 *
 * `excludeOrderId` keeps an order from blocking itself when this runs on a retry
 * or a replayed callback for a checkout that is already recorded.
 */
export function findPriorUseIn(
  orders: any[],
  customerEmail: string,
  applied: any,
  excludeOrderId?: string
): any | null {
  const email = String(customerEmail || "").toLowerCase().trim();
  if (!email || !applied) return null;

  const exclude = excludeOrderId ? String(excludeOrderId) : null;

  return (
    (orders || []).find((o: any) => {
      if (!o) return false;
      const id = String(o.id ?? o.orderId ?? "");
      if (exclude && id === exclude) return false;
      if (String(o.customerEmail || "").toLowerCase().trim() !== email) return false;
      if (releasesDiscount(o)) return false;
      return isSameDiscount(o.discountApplied, applied);
    }) || null
  );
}

export interface DiscountUsageVerdict {
  ok: boolean;
  /** Shown to the shopper when ok is false. */
  message?: string;
  /** The order that already spent it, for logs. */
  priorOrderId?: string;
}

/** The verdict for a discount already found to be spent. */
export function refusal(applied: any, prior: any): DiscountUsageVerdict {
  const code = String(applied?.title || applied?.id || "This discount code");
  return {
    ok: false,
    // Deliberately no order id: checkout is open to guests, so this message can
    // be produced for any email someone cares to type, and it should not report
    // back what that person has ordered. The id goes to the log instead.
    message: `Discount code "${code}" can only be used once per customer, and you have already used it.`,
    priorOrderId: String(prior?.id ?? prior?.orderId ?? "")
  };
}
