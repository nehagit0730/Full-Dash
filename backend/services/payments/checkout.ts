import crypto from "crypto";
import { prisma } from "../../../src/lib/prisma";
import { fetchResource, saveResource } from "../../../serverDb";
import { formatIndiaAddress, validateIndiaAddress, ValidatedIndiaAddress } from "../../../src/utils/indiaValidation";
import { CheckoutError, CheckoutQuote, quoteCheckout, QuoteRequest } from "./pricing";
import * as rzp from "./razorpayClient";

/**
 * Checkout → payment → order.
 *
 * Rules this module exists to enforce:
 *  - The amount charged is the server's quote (pricing.ts), never the browser's.
 *  - No Order row exists until the gateway confirms the money (server-to-server).
 *  - A PaymentTransaction moves to "paid" exactly once, by a conditional UPDATE,
 *    so the browser callback, the status poll and the webhook can all race and
 *    only one of them creates the order.
 *  - Store credit is spent atomically and only once.
 */

const toPaise = (rupees: number) => Math.round(rupees * 100);

export interface CheckoutRequest extends QuoteRequest {
  customerName: string;
  shippingAddress: any;
  /** Client-generated per-attempt key; a repeated submit returns the same checkout. */
  idempotencyKey: string;
}

function newOrderId() {
  // Unambiguous, URL-safe, not guessable from the previous one.
  return `ORD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function validateRequest(req: CheckoutRequest): { address: ValidatedIndiaAddress; name: string; key: string } {
  const key = String(req.idempotencyKey || "").trim();
  if (!/^[A-Za-z0-9_-]{16,80}$/.test(key)) throw new CheckoutError("Missing or invalid checkout key. Refresh the page and try again.");
  const name = String(req.customerName || "").trim();
  if (name.length < 2) throw new CheckoutError("Enter your full name.");
  const check = validateIndiaAddress({ ...(req.shippingAddress || {}), fullName: name });
  if (!check.valid || !check.address) throw new CheckoutError(check.errors[0]);
  return { address: check.address, name, key };
}

/** What the browser needs to open Razorpay Checkout, or the finished order when nothing is owed. */
export async function startCheckout(req: CheckoutRequest) {
  const { address, name, key } = validateRequest(req);
  const txId = `pt_${key}`;

  // Same key again (double click, retry after a network error): same answer.
  const existing = await prisma.paymentTransaction.findUnique({ where: { id: txId } });
  if (existing) return describeExisting(existing);

  const quote = await quoteCheckout(req);
  const orderId = newOrderId();
  const email = String(req.customerEmail).trim().toLowerCase();
  const snapshot = {
    quote,
    customerName: name,
    customerEmail: email,
    shippingAddress: address,
    destination: formatIndiaAddress(address)
  };

  if (quote.amountDue === 0) {
    // Fully covered by store credit or a discount: no gateway involved.
    await prisma.paymentTransaction.create({
      data: {
        id: txId,
        provider: quote.storeCreditApplied > 0 ? "store_credit" : "none",
        orderId,
        amount: 0,
        currency: quote.currency,
        status: "created",
        mode: "live",
        customerEmail: email,
        checkout: snapshot as any
      }
    });
    const order = await completeTransaction(txId, {
      paymentId: null,
      method: quote.storeCreditApplied > 0 ? "Store Credit" : "Discount",
      brand: quote.storeCreditApplied > 0 ? "Store Credit" : "No payment due"
    });
    return { requiresPayment: false, orderId, order: publicOrder(order), quote };
  }

  const cfg = await rzp.razorpayConfig();
  if (!cfg.enabled || !cfg.keyId || !cfg.keySecret) {
    throw new CheckoutError("Online payment is not available right now. Please try again later.");
  }

  const amount = toPaise(quote.amountDue);
  await prisma.paymentTransaction.create({
    data: {
      id: txId,
      provider: "razorpay",
      orderId,
      amount,
      currency: quote.currency,
      status: "created",
      mode: cfg.mode,
      customerEmail: email,
      checkout: snapshot as any
    }
  });

  let rzOrder: rzp.RazorpayOrder;
  try {
    rzOrder = await rzp.createOrder({ amount, currency: quote.currency, receipt: orderId, notes: { orderId, email } });
  } catch (err: any) {
    await prisma.paymentTransaction.update({ where: { id: txId }, data: { status: "gateway_error", lastError: String(err?.message || err) } });
    throw new CheckoutError(`Could not start the payment: ${err?.message || "gateway error"}. You have not been charged.`);
  }
  if (rzOrder.amount !== amount || rzOrder.currency !== quote.currency) {
    await prisma.paymentTransaction.update({ where: { id: txId }, data: { status: "gateway_error", lastError: "Razorpay order amount mismatch" } });
    throw new CheckoutError("The payment could not be set up correctly. You have not been charged.");
  }
  await prisma.paymentTransaction.update({ where: { id: txId }, data: { providerOrderId: rzOrder.id } });

  return {
    requiresPayment: true,
    provider: "razorpay",
    orderId,
    keyId: cfg.keyId,
    razorpayOrderId: rzOrder.id,
    amount,
    currency: quote.currency,
    prefill: { name, email, contact: address.phone },
    quote
  };
}

async function describeExisting(tx: any) {
  const quote = (tx.checkout as any)?.quote as CheckoutQuote;
  if (tx.orderRecorded) {
    const order = await findOrder(tx.orderId);
    return { requiresPayment: false, orderId: tx.orderId, order: publicOrder(order), quote };
  }
  if (tx.provider === "razorpay" && tx.providerOrderId && tx.status === "created") {
    const cfg = await rzp.razorpayConfig();
    const snap = tx.checkout as any;
    return {
      requiresPayment: true,
      provider: "razorpay",
      orderId: tx.orderId,
      keyId: cfg.keyId,
      razorpayOrderId: tx.providerOrderId,
      amount: tx.amount,
      currency: tx.currency,
      prefill: { name: snap.customerName, email: snap.customerEmail, contact: snap.shippingAddress?.phone },
      quote
    };
  }
  throw new CheckoutError("This checkout can no longer be used. Refresh the page and try again.");
}

async function findOrder(orderId: string) {
  const orders: any[] = (await fetchResource("orders")) || [];
  return orders.find(o => String(o.id) === String(orderId)) || null;
}

/** The only order fields a status/confirmation response may carry. */
export function publicOrder(order: any) {
  if (!order) return null;
  return {
    id: order.id,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    total: order.total,
    currency: order.currency || "INR",
    paymentMethod: order.data?.paymentMethod || order.paymentMethod || null,
    items: (order.items || []).map((i: any) => ({ productTitle: i.productTitle, quantity: i.quantity, price: i.price, image: i.image }))
  };
}

/**
 * Asks Razorpay what happened to a payment and, if it was captured for the
 * right amount, records the order. Safe to call any number of times, from any
 * source (browser verify, status poll, webhook).
 */
export async function settleRazorpayOrder(providerOrderId: string, paymentId?: string | null) {
  const tx = await prisma.paymentTransaction.findUnique({ where: { providerOrderId } });
  if (!tx) return { status: "unknown" as const };
  if (tx.orderRecorded) return { status: "paid" as const, order: await findOrder(tx.orderId), tx };

  let payment: rzp.RazorpayPayment | null = null;
  if (paymentId) {
    payment = await rzp.fetchPayment(paymentId);
    if (payment.order_id !== providerOrderId) throw new CheckoutError("That payment does not belong to this order.");
  } else {
    const list = await rzp.fetchOrderPayments(providerOrderId);
    payment =
      list.items.find(p => p.status === "captured") ||
      list.items.find(p => p.status === "authorized") ||
      list.items[0] ||
      null;
  }
  if (!payment) return { status: "pending" as const, tx };

  if (payment.amount !== tx.amount || payment.currency !== tx.currency) {
    await prisma.paymentTransaction.update({
      where: { id: tx.id },
      data: { status: "amount_mismatch", providerPaymentId: payment.id, lastError: `Paid ${payment.amount} ${payment.currency}, expected ${tx.amount} ${tx.currency}` }
    });
    console.error(`[Payments] AMOUNT MISMATCH on ${tx.orderId}: paid ${payment.amount} ${payment.currency}, expected ${tx.amount} ${tx.currency}. No order created.`);
    return { status: "failed" as const, tx, message: "The payment amount did not match the order. Contact support; you will be refunded." };
  }

  if (payment.status === "authorized") {
    payment = await rzp.capturePayment(payment.id, tx.amount, tx.currency);
  }
  if (payment.status === "failed") {
    await prisma.paymentTransaction.update({ where: { id: tx.id }, data: { lastError: payment.error_description || "Payment failed" } });
    return { status: "failed" as const, tx, message: payment.error_description || "The payment failed. You have not been charged." };
  }
  if (payment.status !== "captured") return { status: "pending" as const, tx };

  const method = payment.method === "upi" ? "UPI" : payment.method === "card" ? "Card" : payment.method === "netbanking" ? "Netbanking" : payment.method === "wallet" ? "Wallet" : payment.method;
  const brand =
    payment.method === "card" ? `${payment.card?.network || "Card"}${payment.card?.last4 ? ` •••• ${payment.card.last4}` : ""}` :
    payment.method === "upi" ? `UPI${payment.vpa ? ` (${payment.vpa})` : ""}` :
    payment.bank || payment.wallet || method;

  const order = await completeTransaction(tx.id, { paymentId: payment.id, method: `Razorpay ${method}`, brand });
  return { status: "paid" as const, order, tx };
}

/**
 * Claims the transaction (created → paid, once) and writes the order.
 * Returns the order, or null when another caller holds the claim right now.
 */
async function completeTransaction(txId: string, payment: { paymentId: string | null; method: string; brand: string }) {
  const claim = await prisma.paymentTransaction.updateMany({
    where: { id: txId, status: { in: ["created", "paid_unrecorded"] } },
    data: { status: "paid", providerPaymentId: payment.paymentId, paidAt: new Date() }
  });
  const tx = await prisma.paymentTransaction.findUnique({ where: { id: txId } });
  if (!tx) throw new Error(`Payment transaction ${txId} vanished.`);
  if (claim.count !== 1) {
    // Someone else won the claim. If they already finished, hand back their order.
    return tx.orderRecorded ? findOrder(tx.orderId) : null;
  }

  const snap = tx.checkout as any;
  const quote: CheckoutQuote = snap.quote;
  const tags = ["Storefront", tx.provider === "razorpay" ? (tx.mode === "test" ? "Razorpay Test Order" : "Razorpay Order") : "No Payment Due"];

  let storeCreditDeducted = (snap.storeCreditDeducted as boolean) || false;
  if (quote.storeCreditApplied > 0 && !storeCreditDeducted) {
    const spent = await prisma.customer.updateMany({
      where: { email: tx.customerEmail || "", storeCredit: { gte: quote.storeCreditApplied } },
      data: { storeCredit: { decrement: quote.storeCreditApplied } }
    });
    storeCreditDeducted = spent.count === 1;
    if (!storeCreditDeducted) {
      if (tx.provider !== "razorpay") {
        // Nothing was paid and the credit is gone: there is nothing to record.
        await prisma.paymentTransaction.update({ where: { id: txId }, data: { status: "failed", lastError: "Store credit balance no longer covers this order" } });
        throw new CheckoutError("Your store credit balance no longer covers this order.");
      }
      tags.push("Review: store credit shortfall");
      console.error(`[Payments] ${tx.orderId}: card paid but ${tx.customerEmail} no longer had ${quote.storeCreditApplied} store credit.`);
    } else {
      await mirrorCustomerCredit(tx.customerEmail || "");
    }
    await prisma.paymentTransaction.update({ where: { id: txId }, data: { checkout: { ...snap, storeCreditDeducted } as any } });
  }

  const now = new Date();
  const orderData = {
    id: tx.orderId,
    customerName: snap.customerName,
    customerEmail: snap.customerEmail,
    customerPhone: snap.shippingAddress?.phone,
    destination: snap.destination,
    address: snap.destination,
    shippingAddress: snap.shippingAddress,
    items: quote.orderItems,
    subtotal: quote.subtotal,
    discountApplied: quote.discount,
    discountAmount: quote.discountAmount,
    shippingCost: quote.deliveryCost,
    deliveryCost: quote.deliveryCost,
    total: quote.total,
    storeCreditApplied: quote.storeCreditApplied,
    currency: quote.currency,
    paymentStatus: "Paid",
    fulfillmentStatus: "Unfulfilled",
    paymentMethod: payment.method,
    gatewayTxId: payment.paymentId || `${tx.provider.toUpperCase()}-${tx.id}`,
    gatewayAuthCode: payment.paymentId || "NO-PAYMENT-DUE",
    cardBrand: payment.brand,
    deliveryMethod: "Standard Delivery",
    tags,
    date: now.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) + " at " + now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    createdAt: now.toISOString(),
    data: {
      paymentProvider: tx.provider,
      paymentTransactionId: tx.id,
      razorpayOrderId: tx.providerOrderId,
      razorpayPaymentId: payment.paymentId,
      paymentMethod: payment.method,
      isTestMode: tx.mode === "test",
      storeCreditDeducted
    }
  };

  try {
    const { saveSingleOrder } = await import("../../routes/orders");
    const saved = await saveSingleOrder(orderData);
    await prisma.paymentTransaction.update({ where: { id: txId }, data: { orderRecorded: true, lastError: null } });
    return saved;
  } catch (err: any) {
    // The money is taken; the order write failed. Leave it claimable so the
    // next poll/webhook retries the write instead of the payment.
    await prisma.paymentTransaction.update({
      where: { id: txId },
      data: { status: "paid_unrecorded", lastError: `Order write failed: ${String(err?.message || err).slice(0, 300)}` }
    });
    console.error(`[Payments] PAID BUT ORDER NOT RECORDED: ${tx.orderId} (${txId}). Will retry on next status check/webhook.`, err);
    throw err;
  }
}

async function mirrorCustomerCredit(email: string) {
  try {
    const row = await prisma.customer.findUnique({ where: { email } });
    const list: any[] = (await fetchResource("customers")) || [];
    const cust = list.find(c => String(c.email || "").toLowerCase() === email);
    if (cust && row) {
      cust.storeCredit = row.storeCredit ?? 0;
      await saveResource("customers", [cust]);
    }
  } catch (e: any) {
    console.warn("[Payments] Store credit mirror update failed:", e?.message || e);
  }
}

/**
 * Refunds (part of) an order's Razorpay payment. The refundable balance is
 * reserved with a conditional increment BEFORE Razorpay is called, so two
 * refund clicks cannot together refund more than was paid.
 */
export async function refundOrderPayment(orderId: string, amountRupees: number, reason: string, actor: string) {
  const tx = await prisma.paymentTransaction.findUnique({ where: { orderId } });
  if (!tx || tx.provider !== "razorpay" || !tx.providerPaymentId) {
    return {
      ok: false,
      manual: true,
      message: "This order was not paid through Razorpay, so it cannot be refunded automatically. Refund it in the original payment provider's dashboard."
    };
  }
  const paise = toPaise(amountRupees);
  if (!(paise > 0)) throw new CheckoutError("Refund amount must be greater than zero.");
  if (paise > tx.amount - tx.refundedAmount) {
    throw new CheckoutError(`Only ₹${((tx.amount - tx.refundedAmount) / 100).toFixed(2)} of this payment is left to refund.`);
  }

  const reserve = await prisma.paymentTransaction.updateMany({
    where: { id: tx.id, refundedAmount: { lte: tx.amount - paise } },
    data: { refundedAmount: { increment: paise } }
  });
  if (reserve.count !== 1) throw new CheckoutError("Another refund changed the balance. Reload and try again.");

  const n = (Array.isArray(tx.refunds) ? (tx.refunds as any[]).length : 0) + 1;
  try {
    const refund = await rzp.refundPayment(tx.providerPaymentId, {
      amount: paise,
      receipt: `${orderId}-R${n}`,
      notes: { orderId, reason: reason.slice(0, 250), by: actor }
    });
    const fresh = await prisma.paymentTransaction.findUnique({ where: { id: tx.id } });
    const refunds = [...((fresh?.refunds as any[]) || []), { id: refund.id, amount: paise, status: refund.status, reason, by: actor, at: new Date().toISOString() }];
    const fully = (fresh?.refundedAmount || 0) >= tx.amount;
    await prisma.paymentTransaction.update({ where: { id: tx.id }, data: { refunds: refunds as any, status: fully ? "refunded" : "partially_refunded" } });
    return { ok: true, manual: false, refundId: refund.id, amount: paise / 100, status: refund.status, fullyRefunded: fully, message: `Refund ${refund.id} (${refund.status}) for ₹${(paise / 100).toFixed(2)} submitted to Razorpay.` };
  } catch (err: any) {
    await prisma.paymentTransaction.update({ where: { id: tx.id }, data: { refundedAmount: { decrement: paise }, lastError: `Refund failed: ${err?.message || err}` } });
    throw new CheckoutError(`Razorpay refused the refund: ${err?.message || err}`);
  }
}

/** Updates a refund's status from a webhook. */
export async function recordRefundStatus(paymentId: string, refundId: string, status: string) {
  const tx = await prisma.paymentTransaction.findFirst({ where: { providerPaymentId: paymentId } });
  if (!tx) return;
  const list = (tx.refunds as any[]) || [];
  const entry = list.find(r => r.id === refundId);
  if (!entry || entry.status === status) return;
  const refunds = list.map(r => (r.id === refundId ? { ...r, status } : r));
  // A refund Razorpay later reports as failed gives its amount back to the refundable balance.
  const release = status === "failed" && entry.status !== "failed" ? Number(entry.amount) || 0 : 0;
  await prisma.paymentTransaction.update({
    where: { id: tx.id },
    data: { refunds: refunds as any, ...(release ? { refundedAmount: { decrement: release } } : {}) }
  });
}
