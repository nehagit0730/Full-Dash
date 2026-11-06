import { fetchResource } from "../../../serverDb";
import { prisma } from "../../../src/lib/prisma";
import { calculateDiscountAmount, calculateVolumePrice } from "../../../src/utils";
import {
  applyRewardChoice,
  getOutstandingFreeCanCount,
  resolveDeliveryCost,
  resolveDiscountCode,
  rewardNeedsSelection
} from "../../../src/utils/discountUtils";
import { getRewardLines } from "../../../src/utils/rewardLines";
import type { CartItem, Discount, FreeCanSelection } from "../../../src/types";
import { checkDiscountUsable } from "../discountUsage";
import { autoDiscountFor, isNewCustomerDiscount } from "../newCustomerDiscount";

/**
 * The server-side price of a checkout.
 *
 * Every amount a customer is charged is computed here from the catalogue in
 * the database — never taken from the browser. The browser sends only WHAT it
 * wants (product ids, quantities, a discount code, reward picks); prices,
 * discounts, delivery and store credit are all worked out again here, with the
 * same pure functions the storefront uses to display them, so the two agree.
 */

export const STORE_CURRENCY = "INR";

export class CheckoutError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = "CheckoutError";
  }
}

export interface QuoteRequest {
  items: { productId: string; quantity: number }[];
  discountCode?: string | null;
  discountId?: string | null;
  rewardChoiceId?: string | null;
  freeCanSelections?: { productId: string; variantId?: string }[];
  customerEmail: string;
  useStoreCredit?: boolean;
  /** Email proven by a customer session token, or null for a guest. */
  signedInEmail?: string | null;
}

export interface CheckoutQuote {
  currency: string;
  lines: Array<{ productId: string; productTitle: string; unitPrice: number; quantity: number; lineTotal: number; image: string; vendor: string; sku: string }>;
  orderItems: any[];
  subtotal: number;
  discount: Record<string, any> | null;
  discountAmount: number;
  deliveryCost: number;
  total: number;
  storeCreditApplied: number;
  amountDue: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const isSellable = (p: any) => p && !["Draft", "Archived"].includes(String(p.status || "Active"));

/** A cart id is either a product id or the id of one of its concrete variants. */
function resolveCatalogueItem(products: any[], id: string) {
  const direct = products.find(p => String(p.id) === id);
  if (direct) {
    return {
      product: direct,
      title: String(direct.title || ""),
      price: Number(direct.price) || 0,
      image: String(direct.image || ""),
      sku: String(direct.sku || direct.id)
    };
  }
  for (const p of products) {
    const v = Array.isArray(p?.concreteVariants) ? p.concreteVariants.find((x: any) => String(x?.id) === id) : null;
    if (v) {
      return {
        product: p,
        title: `${p.title} ${v.name}`.trim(),
        price: Number(v.price) > 0 ? Number(v.price) : Number(p.price) || 0,
        image: (Array.isArray(v.images) && v.images[0]) || p.image || "",
        sku: String(v.id)
      };
    }
  }
  return null;
}

export async function quoteCheckout(req: QuoteRequest): Promise<CheckoutQuote> {
  const email = String(req.customerEmail || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new CheckoutError("Enter a valid email address.");
  if (!Array.isArray(req.items) || req.items.length === 0) throw new CheckoutError("Your cart is empty.");
  if (req.items.length > 100) throw new CheckoutError("Too many different items in one order.");

  const [products, collections, discounts, customers] = await Promise.all([
    fetchResource("products"),
    fetchResource("collections"),
    fetchResource("discounts"),
    fetchResource("customers")
  ]);

  // 1. Lines, priced from the catalogue.
  const merged = new Map<string, number>();
  for (const it of req.items) {
    const id = String(it?.productId || "").trim();
    const qty = Math.floor(Number(it?.quantity));
    if (!id || !Number.isFinite(qty) || qty < 1 || qty > 999) throw new CheckoutError("A cart item has an invalid quantity.");
    merged.set(id, (merged.get(id) || 0) + qty);
  }

  const lines: CheckoutQuote["lines"] = [];
  const cartItems: CartItem[] = [];
  for (const [id, quantity] of merged) {
    const found = resolveCatalogueItem(products, id);
    if (!found || !isSellable(found.product)) throw new CheckoutError("An item in your cart is no longer available. Please remove it and try again.");
    if (!(found.price > 0)) throw new CheckoutError(`"${found.title}" has no price set and cannot be bought yet.`);
    const lineTotal = calculateVolumePrice(found.price, quantity);
    lines.push({
      productId: id,
      productTitle: found.title,
      unitPrice: found.price,
      quantity,
      lineTotal,
      image: found.image,
      vendor: String(found.product.vendor || ""),
      sku: found.sku
    });
    cartItems.push({
      productId: id,
      productTitle: found.title,
      price: found.price,
      image: found.image,
      quantity,
      vendor: String(found.product.vendor || ""),
      sku: found.sku
    });
  }
  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));

  // 2. Discount, re-resolved from its code — the browser's copy is never used.
  let discount: Discount | null = null;
  const signedInCustomer = req.signedInEmail
    ? customers.find((c: any) => String(c.email || "").toLowerCase() === req.signedInEmail) || null
    : null;

  if (req.discountId && isNewCustomerDiscount({ id: req.discountId })) {
    discount = (await autoDiscountFor(email)) as Discount | null;
    if (!discount) throw new CheckoutError("The new-customer discount is not available for this email address.");
  } else if (req.discountCode) {
    const result = resolveDiscountCode(String(req.discountCode), discounts, customers, signedInCustomer, cartItems, subtotal);
    if (!result.success || !result.discount) throw new CheckoutError(result.error || "That discount code is not valid.");
    discount = result.discount;
  }

  if (discount) {
    if (discount.rewardKind === "choice") {
      if (!req.rewardChoiceId) throw new CheckoutError("Choose which reward you would like before paying.");
      discount = applyRewardChoice(discount, String(req.rewardChoiceId));
      if (discount.rewardKind === "choice") throw new CheckoutError("That reward option is not available.");
    }
    if (discount.rewardKind === "free-cans") {
      const allowed = discount.freeCanCount || 0;
      const picks = (req.freeCanSelections || []).slice(0, allowed);
      const selections: FreeCanSelection[] = [];
      for (const pick of picks) {
        const id = String(pick?.variantId || pick?.productId || "");
        const found = resolveCatalogueItem(products, id) || resolveCatalogueItem(products, String(pick?.productId || ""));
        if (!found || !isSellable(found.product)) throw new CheckoutError("A free item you picked is no longer available.");
        selections.push({
          productId: String(found.product.id),
          productTitle: String(found.product.title || ""),
          vendor: String(found.product.vendor || ""),
          variantName: found.title.replace(String(found.product.title || ""), "").trim() || "Standard",
          variantId: found.sku,
          image: found.image,
          sku: found.sku,
          originalPrice: found.price
        });
      }
      discount = { ...discount, freeCanSelections: selections };
      if (getOutstandingFreeCanCount(discount) > 0) throw new CheckoutError("Pick all of your free items before paying.");
    }
    if (rewardNeedsSelection(discount)) throw new CheckoutError("Finish choosing your reward before paying.");

    const usable = await checkDiscountUsable(email, discount);
    if (!usable.ok) throw new CheckoutError(usable.message || "That discount has already been used.");
  }

  const discountAmount = round2(Math.min(calculateDiscountAmount(discount, cartItems, subtotal, products, collections), subtotal));
  const subtotalAfterDiscount = round2(Math.max(subtotal - discountAmount, 0));
  const deliveryCost = round2(resolveDeliveryCost(subtotalAfterDiscount, discount));
  const total = round2(subtotalAfterDiscount + deliveryCost);

  // 3. Store credit, read from the database and only for the signed-in owner.
  let storeCreditApplied = 0;
  if (req.useStoreCredit) {
    if (!req.signedInEmail || req.signedInEmail !== email) {
      throw new CheckoutError("Sign in with the account that holds the store credit to use it.");
    }
    const row = await prisma.customer.findUnique({ where: { email }, select: { storeCredit: true } });
    storeCreditApplied = round2(Math.min(Math.max(row?.storeCredit || 0, 0), total));
  }
  const amountDue = round2(Math.max(total - storeCreditApplied, 0));

  const orderItems = [
    ...lines.map(l => ({
      productId: l.productId,
      productTitle: l.productTitle,
      price: l.unitPrice,
      quantity: l.quantity,
      image: l.image,
      variant: "Standard",
      sku: l.sku,
      vendor: l.vendor,
      total: l.lineTotal
    })),
    ...getRewardLines(discount)
  ];

  return {
    currency: STORE_CURRENCY,
    lines,
    orderItems,
    subtotal,
    discount: discount
      ? {
          id: discount.id,
          title: discount.title,
          type: discount.type,
          details: discount.details,
          valueType: discount.valueType,
          valueAmount: discount.valueAmount,
          rewardKind: discount.rewardKind,
          rewardChoiceId: discount.rewardChoiceId,
          freeCanSelections: discount.freeCanSelections,
          limitOnePerCustomer: discount.limitOnePerCustomer,
          loyaltyMilestoneCode: discount.loyaltyMilestoneCode
        }
      : null,
    discountAmount,
    deliveryCost,
    total,
    storeCreditApplied,
    amountDue
  };
}
