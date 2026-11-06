import { fetchResource } from "../../serverDb";
import {
  DiscountUsageVerdict,
  findPriorUseIn,
  isSameDiscount,
  refusal,
  resolveOnePerCustomer
} from "./discountUsageRules";

/**
 * Enforcement of a discount's "one use per customer" limit.
 *
 * The limit was configurable in the admin discount editor and stored on the
 * discount, but nothing ever read it: the storefront resolves a promo code
 * entirely in the browser (`resolveDiscountCode`) and posts the resulting
 * discount object with the order, so a customer could re-enter the same code on
 * every order they ever placed and the server would take it each time.
 *
 * Checked here, against the orders that customer has actually placed — never
 * against a flag the client sent, which a crafted request controls. The rules
 * themselves live in `discountUsageRules`; this file is the store access.
 */

export type { DiscountUsageVerdict };

/** The discount as the store has it, or null when it is not a stored discount. */
async function storedDiscountFor(applied: any): Promise<any | null> {
  try {
    const discounts: any[] = (await fetchResource("discounts")) || [];
    return discounts.find(d => isSameDiscount(d, applied)) || null;
  } catch {
    return null;
  }
}

/** Whether this offer may only be used once by any one customer. */
export async function isOnePerCustomer(applied: any): Promise<boolean> {
  if (!applied) return false;
  return resolveOnePerCustomer(await storedDiscountFor(applied), applied);
}

/** The customer's earlier order that already spent this discount, if there is one. */
export async function findPriorUse(
  customerEmail: string,
  applied: any,
  excludeOrderId?: string
): Promise<any | null> {
  if (!customerEmail || !applied) return null;

  let orders: any[] = [];
  try {
    orders = (await fetchResource("orders")) || [];
  } catch {
    // The orders store is unreachable. Returning null lets the sale proceed:
    // refusing every coupon because a read failed would be a worse failure than
    // honouring one twice.
    return null;
  }

  return findPriorUseIn(orders, customerEmail, applied, excludeOrderId);
}

/**
 * May this customer use this discount on a new order?
 *
 * Allows anything that is not limited, and anything limited that they have not
 * spent yet. Call before taking money — after the gateway has the payment,
 * refusing the order means issuing a refund instead of showing a message.
 */
export async function checkDiscountUsable(
  customerEmail: string,
  applied: any,
  excludeOrderId?: string
): Promise<DiscountUsageVerdict> {
  if (!applied) return { ok: true };

  // The automatic new-customer offer is never taken on trust. It is not a
  // stored discount, so its own limitOnePerCustomer flag arrives from the
  // browser; eligibility is recomputed here from the accounts and orders that
  // exist, which is what actually stops it being replayed or hand-crafted.
  const { isNewCustomerDiscount, checkNewCustomerEligibility } = await import(
    "./newCustomerDiscount"
  );
  if (isNewCustomerDiscount(applied)) {
    const verdict = await checkNewCustomerEligibility(customerEmail);
    if (verdict.eligible) return { ok: true };
    return {
      ok: false,
      message: "The New Customer Discount does not apply to this order.",
      priorOrderId: verdict.reason
    };
  }

  if (!(await isOnePerCustomer(applied))) return { ok: true };

  const prior = await findPriorUse(customerEmail, applied, excludeOrderId);
  if (!prior) return { ok: true };

  return refusal(applied, prior);
}
