import { fetchResource } from "../../serverDb";
import { prisma } from "../../src/lib/prisma";

/**
 * The launch offer: the first 50 accounts get 10% off their first order.
 *
 * Applied automatically, with no code to type — so it cannot be shared, posted
 * on a voucher site, or used by someone it was not meant for. Nothing the
 * browser sends decides whether it applies; eligibility is worked out here,
 * from the accounts and orders that actually exist, and is re-checked on the
 * server before a payment session is created.
 *
 * It replaces the old FIRST50 / SUB10 / SUBSCRIBER10 codes, which granted the
 * same 10% to anyone who typed them, for ever, with no limit of 50 and no check
 * that the person was new.
 */

/** How many accounts the offer covers, counted by registration date. */
export const NEW_CUSTOMER_LIMIT = 50;

/** What comes off their first order. */
export const NEW_CUSTOMER_PERCENT = 10;

/** Stable id, so an order placed under this offer can be recognised later. */
export const NEW_CUSTOMER_DISCOUNT_ID = "disc-new-customer-10";

/** The offer as a discount the storefront can price and display. */
export function buildNewCustomerDiscount(): Record<string, any> {
  return {
    id: NEW_CUSTOMER_DISCOUNT_ID,
    title: "New Customer Discount",
    status: "Active",
    method: "Automatic",
    eligibility: "First 50 customers",
    type: "Amount off order",
    valueType: "Percentage",
    valueAmount: NEW_CUSTOMER_PERCENT,
    details: `${NEW_CUSTOMER_PERCENT}% New Customer Discount`,
    used: 0,
    // First order only. The usage check enforces this server-side as well.
    limitOnePerCustomer: true,
    isAutomatic: true
  };
}

const clean = (v: any) => String(v || "").toLowerCase().trim();

/** Every customer account, from both stores, oldest registration first. */
async function loadCustomersByJoinDate(): Promise<any[]> {
  const byEmail = new Map<string, any>();

  try {
    const rows = await prisma.customer.findMany({ orderBy: { createdAt: "asc" } });
    for (const row of rows || []) byEmail.set(clean(row.email), row);
  } catch {
    // Prisma unavailable; the store below carries the accounts.
  }

  try {
    const stored: any[] = (await fetchResource("customers")) || [];
    for (const row of stored) {
      const email = clean(row?.email);
      if (!email) continue;
      byEmail.set(email, { ...(row || {}), ...(byEmail.get(email) || {}) });
    }
  } catch {
    /* nothing stored */
  }

  // Oldest first. An account with no createdAt sorts last rather than first:
  // guessing it is old would hand the offer to someone outside the 50.
  return Array.from(byEmail.values()).sort((a, b) => {
    const ta = Date.parse(a?.createdAt ?? "") || Number.MAX_SAFE_INTEGER;
    const tb = Date.parse(b?.createdAt ?? "") || Number.MAX_SAFE_INTEGER;
    return ta - tb;
  });
}

/** Has this email ever placed an order? */
async function hasOrdered(email: string): Promise<boolean> {
  const wanted = clean(email);
  if (!wanted) return true; // Unknown shopper: treat as not new.
  try {
    const orders: any[] = (await fetchResource("orders")) || [];
    return orders.some(o => clean(o?.customerEmail) === wanted);
  } catch {
    // Cannot tell. Withhold the discount rather than hand it out twice — the
    // shopper still checks out, just at full price.
    return true;
  }
}

export interface NewCustomerEligibility {
  eligible: boolean;
  /** 1-based position in the registration order, when known. */
  position?: number;
  reason?: string;
}

/**
 * Is this shopper one of the first 50 accounts, still on their first order?
 *
 * Both halves matter. Position alone would keep discounting customer #7 on
 * every order they ever place; "no orders yet" alone would discount the
 * thousandth signup.
 */
export async function checkNewCustomerEligibility(
  customerEmail: string
): Promise<NewCustomerEligibility> {
  const email = clean(customerEmail);
  if (!email) return { eligible: false, reason: "No customer email" };

  const customers = await loadCustomersByJoinDate();
  const index = customers.findIndex(c => clean(c?.email) === email);
  if (index === -1) {
    return { eligible: false, reason: "No account for this email" };
  }

  const position = index + 1;
  if (position > NEW_CUSTOMER_LIMIT) {
    return { eligible: false, position, reason: `Account #${position} is outside the first ${NEW_CUSTOMER_LIMIT}` };
  }

  if (await hasOrdered(email)) {
    return { eligible: false, position, reason: "The offer applies to a first order only" };
  }

  return { eligible: true, position };
}

/** The discount to apply automatically for this shopper, or null. */
export async function autoDiscountFor(customerEmail: string): Promise<Record<string, any> | null> {
  const verdict = await checkNewCustomerEligibility(customerEmail);
  return verdict.eligible ? buildNewCustomerDiscount() : null;
}

/** Is this applied discount the automatic new-customer offer? */
export function isNewCustomerDiscount(applied: any): boolean {
  return String(applied?.id || "") === NEW_CUSTOMER_DISCOUNT_ID;
}

/** How many of the 50 places are left, for the storefront banner. */
export async function newCustomerPlacesRemaining(): Promise<number> {
  const customers = await loadCustomersByJoinDate();
  return Math.max(0, NEW_CUSTOMER_LIMIT - customers.length);
}
