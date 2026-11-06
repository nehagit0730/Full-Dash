/**
 * End-to-end check of checkout → Razorpay → order, against a real database.
 *
 *   DATABASE_URL=<scratch db> SETTINGS_ENCRYPTION_KEY=<32+ chars> npx tsx scripts/verifyPayments.ts
 *
 * Use a SCRATCH database: it creates products, customers, discounts and orders.
 *
 * Razorpay's HTTP API is simulated inside this process (global fetch is wrapped
 * for api.razorpay.com only), because real test keys are not available here.
 * Everything else — pricing, signatures, idempotency, the database writes,
 * store credit, refunds — is the production code path.
 */
import "dotenv/config";
import assert from "assert";
import crypto from "crypto";
import { prisma } from "../src/lib/prisma";
import { ensureNeonTablesExist, saveResource, fetchResource } from "../serverDb";
import { saveIntegration } from "../backend/services/integrations/store";
import { quoteCheckout, CheckoutError } from "../backend/services/payments/pricing";
import { startCheckout, settleRazorpayOrder, refundOrderPayment } from "../backend/services/payments/checkout";
import { verifyCheckoutSignature, verifyWebhookSignature } from "../backend/services/payments/razorpayClient";
import { calculateVolumePrice } from "../src/utils";

// ───────────────────────── simulated Razorpay ─────────────────────────
const rz = {
  orders: new Map<string, any>(),
  payments: new Map<string, any>(),
  calls: [] as string[],
  failNextRefund: false
};
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: any, init: any = {}) => {
  const url = String(input?.url || input);
  if (!url.startsWith("https://api.razorpay.com/v1/")) {
    // Email / Klaviyo side effects of saving an order are not under test here.
    if (/^https?:\/\/(localhost|127\.0\.0\.1)/.test(url)) return realFetch(input, init);
    return new Response(JSON.stringify({ error: "external call disabled in test" }), { status: 503 });
  }
  const path = url.replace("https://api.razorpay.com/v1", "");
  const method = (init.method || "GET").toUpperCase();
  rz.calls.push(`${method} ${path}`);
  const body = init.body ? JSON.parse(String(init.body)) : {};
  const json = (status: number, data: any) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

  if (method === "POST" && path === "/orders") {
    const id = `order_${crypto.randomBytes(6).toString("hex")}`;
    const o = { id, amount: body.amount, currency: body.currency, receipt: body.receipt, status: "created" };
    rz.orders.set(id, o);
    return json(200, o);
  }
  let m = path.match(/^\/payments\/([^/]+)$/);
  if (method === "GET" && m) return rz.payments.has(m[1]) ? json(200, rz.payments.get(m[1])) : json(400, { error: { description: "The id provided does not exist" } });
  m = path.match(/^\/orders\/([^/]+)\/payments$/);
  if (method === "GET" && m) return json(200, { items: [...rz.payments.values()].filter(p => p.order_id === m![1]) });
  m = path.match(/^\/payments\/([^/]+)\/capture$/);
  if (method === "POST" && m) {
    const p = rz.payments.get(m[1]);
    p.status = "captured";
    p.captured = true;
    return json(200, p);
  }
  m = path.match(/^\/payments\/([^/]+)\/refund$/);
  if (method === "POST" && m) {
    if (rz.failNextRefund) {
      rz.failNextRefund = false;
      return json(400, { error: { description: "The amount is invalid" } });
    }
    return json(200, { id: `rfnd_${crypto.randomBytes(5).toString("hex")}`, amount: body.amount, status: "processed" });
  }
  return json(404, { error: { description: `unhandled ${method} ${path}` } });
}) as any;

function pay(orderId: string, amount: number, status: "captured" | "authorized" | "failed" = "captured") {
  const id = `pay_${crypto.randomBytes(6).toString("hex")}`;
  rz.payments.set(id, { id, order_id: orderId, amount, currency: "INR", status, method: "upi", vpa: "test@upi", captured: status === "captured" });
  return id;
}

// ───────────────────────── harness ─────────────────────────
let passed = 0;
async function check(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    console.error(`  ✗ ${name}\n    ${err?.stack || err}`);
    process.exitCode = 1;
  }
}
async function rejects(p: Promise<any>, pattern: RegExp) {
  try {
    await p;
  } catch (err: any) {
    assert.match(String(err?.message), pattern);
    return;
  }
  throw new Error(`expected rejection matching ${pattern}`);
}
const key = () => crypto.randomBytes(16).toString("hex");
const ADDRESS = { address1: "12 MG Road", city: "Pune", state: "Maharashtra", pincode: "411001", phone: "+91 98765 43210", country: "India" };
const SECRET = "rzp_test_secret_value_0123456789";

async function main() {
  if (!process.env.SETTINGS_ENCRYPTION_KEY) process.env.SETTINGS_ENCRYPTION_KEY = "x".repeat(40);
  await ensureNeonTablesExist();

  await saveResource("products", [
    { id: "p-shirt", title: "Cotton Shirt", price: 100, status: "Active", vendor: "Acme", image: "", concreteVariants: [{ id: "v-shirt-xl", name: "XL", price: 150, inventory: 5, description: "", images: [] }] },
    { id: "p-draft", title: "Draft Item", price: 50, status: "Draft", vendor: "Acme", image: "" }
  ]);
  await saveResource("discounts", [{ id: "d-save10", title: "SAVE10", status: "Active", method: "Code", type: "Amount off order", valueType: "Percentage", valueAmount: 10, used: 0 }]);
  await prisma.customer.upsert({
    where: { email: "buyer@example.test" },
    create: { id: "c-buyer", name: "Buyer", email: "buyer@example.test", storeCredit: 50 },
    update: { storeCredit: 50 }
  });
  await saveResource("customers", [{ id: "c-buyer", name: "Buyer", email: "buyer@example.test", storeCredit: 50 }]);

  console.log("pricing (server-side)");
  await check("price comes from the catalogue, not the request", async () => {
    const q = await quoteCheckout({ items: [{ productId: "p-shirt", quantity: 2, price: 1 } as any], customerEmail: "a@b.co" });
    assert.equal(q.lines[0].unitPrice, 100);
    assert.equal(q.subtotal, calculateVolumePrice(100, 2));
  });
  await check("variant ids are priced at the variant price", async () => {
    const q = await quoteCheckout({ items: [{ productId: "v-shirt-xl", quantity: 1 }], customerEmail: "a@b.co" });
    assert.equal(q.lines[0].unitPrice, 150);
  });
  await check("unknown and draft products are refused", async () => {
    await rejects(quoteCheckout({ items: [{ productId: "nope", quantity: 1 }], customerEmail: "a@b.co" }), /no longer available/);
    await rejects(quoteCheckout({ items: [{ productId: "p-draft", quantity: 1 }], customerEmail: "a@b.co" }), /no longer available/);
  });
  await check("discount is resolved from its code on the server", async () => {
    const q = await quoteCheckout({ items: [{ productId: "p-shirt", quantity: 1 }], discountCode: "save10", customerEmail: "a@b.co" });
    assert.equal(q.discountAmount, 10);
    await rejects(quoteCheckout({ items: [{ productId: "p-shirt", quantity: 1 }], discountCode: "FAKE90", customerEmail: "a@b.co" }), /Invalid|not valid/);
  });
  await check("store credit needs the signed-in owner", async () => {
    await rejects(quoteCheckout({ items: [{ productId: "p-shirt", quantity: 1 }], customerEmail: "buyer@example.test", useStoreCredit: true }), /Sign in/);
    await rejects(quoteCheckout({ items: [{ productId: "p-shirt", quantity: 1 }], customerEmail: "buyer@example.test", useStoreCredit: true, signedInEmail: "other@example.test" }), /Sign in/);
  });

  console.log("checkout");
  await check("refuses to start when Razorpay is disabled", async () => {
    await prisma.integrationSetting.deleteMany({ where: { id: "razorpay" } });
    await rejects(startCheckout({ items: [{ productId: "p-shirt", quantity: 1 }], customerEmail: "a@b.co", customerName: "A B", shippingAddress: ADDRESS, idempotencyKey: key() }), /not available/);
  });
  await saveIntegration("razorpay", { enabled: true, mode: "test", values: { keyId: "rzp_test_abc", keySecret: SECRET, webhookSecret: "whsec_test_0123456789" } }, "verify");

  await check("rejects an invalid Indian address", async () => {
    await rejects(startCheckout({ items: [{ productId: "p-shirt", quantity: 1 }], customerEmail: "a@b.co", customerName: "A B", shippingAddress: { ...ADDRESS, pincode: "SW1A1AA" }, idempotencyKey: key() }), /PIN code/);
  });

  let first: any;
  const k1 = key();
  await check("creates a Razorpay order for the server amount, in paise", async () => {
    first = await startCheckout({ items: [{ productId: "p-shirt", quantity: 1 }], customerEmail: "a@b.co", customerName: "A B", shippingAddress: ADDRESS, idempotencyKey: k1 });
    assert.equal(first.requiresPayment, true);
    assert.equal(first.amount, Math.round(first.quote.amountDue * 100));
    assert.equal(rz.orders.get(first.razorpayOrderId).amount, first.amount);
    assert.equal(first.keyId, "rzp_test_abc");
    assert.ok(!JSON.stringify(first).includes(SECRET), "secret leaked to the browser payload");
  });
  await check("the same checkout key returns the same payment (no second Razorpay order)", async () => {
    const before = rz.calls.filter(c => c === "POST /orders").length;
    const again = await startCheckout({ items: [{ productId: "p-shirt", quantity: 1 }], customerEmail: "a@b.co", customerName: "A B", shippingAddress: ADDRESS, idempotencyKey: k1 });
    assert.equal(again.razorpayOrderId, first.razorpayOrderId);
    assert.equal(rz.calls.filter(c => c === "POST /orders").length, before);
  });
  await check("checkout signature: valid accepted, tampered refused", async () => {
    const pid = "pay_sigtest";
    const sig = crypto.createHmac("sha256", SECRET).update(`${first.razorpayOrderId}|${pid}`).digest("hex");
    assert.equal(verifyCheckoutSignature(first.razorpayOrderId, pid, sig, SECRET), true);
    assert.equal(verifyCheckoutSignature(first.razorpayOrderId, "pay_other", sig, SECRET), false);
    assert.equal(verifyCheckoutSignature(first.razorpayOrderId, pid, sig.replace(/.$/, c => (c === "a" ? "b" : "a")), SECRET), false);
  });
  await check("webhook signature over the raw body", async () => {
    const raw = Buffer.from('{"event":"payment.captured"}');
    const sig = crypto.createHmac("sha256", "whsec_test_0123456789").update(raw).digest("hex");
    assert.equal(verifyWebhookSignature(raw, sig, "whsec_test_0123456789"), true);
    assert.equal(verifyWebhookSignature(Buffer.from('{"event":"payment.captured","x":1}'), sig, "whsec_test_0123456789"), false);
  });

  console.log("settlement");
  await check("an underpaid payment creates no order", async () => {
    const pid = pay(first.razorpayOrderId, first.amount - 100);
    const r: any = await settleRazorpayOrder(first.razorpayOrderId, pid);
    assert.equal(r.status, "failed");
    const orders = (await fetchResource("orders")).filter((o: any) => o.id === first.orderId);
    assert.equal(orders.length, 0);
    const tx = await prisma.paymentTransaction.findUnique({ where: { orderId: first.orderId } });
    assert.equal(tx!.status, "amount_mismatch");
  });

  let second: any;
  await check("a captured payment for the right amount records exactly one Paid order, even when settled 3x at once", async () => {
    second = await startCheckout({ items: [{ productId: "p-shirt", quantity: 3 }], discountCode: "SAVE10", customerEmail: "c@d.co", customerName: "C D", shippingAddress: ADDRESS, idempotencyKey: key() });
    const pid = pay(second.razorpayOrderId, second.amount);
    const results = await Promise.all([
      settleRazorpayOrder(second.razorpayOrderId, pid),
      settleRazorpayOrder(second.razorpayOrderId, pid),
      settleRazorpayOrder(second.razorpayOrderId)
    ]);
    assert.ok(results.some((r: any) => r.status === "paid"));
    const orders = (await fetchResource("orders")).filter((o: any) => o.id === second.orderId);
    assert.equal(orders.length, 1);
    assert.equal(orders[0].paymentStatus, "Paid");
    assert.equal(orders[0].total, second.quote.total);
    assert.equal(orders[0].discountAmount, second.quote.discountAmount);
    assert.equal(orders[0].gatewayTxId, pid);
    const tx = await prisma.paymentTransaction.findUnique({ where: { orderId: second.orderId } });
    assert.equal(tx!.status, "paid");
    assert.equal(tx!.orderRecorded, true);
  });
  await check("an authorized payment is captured before the order is recorded", async () => {
    const c = await startCheckout({ items: [{ productId: "p-shirt", quantity: 1 }], customerEmail: "e@f.co", customerName: "E F", shippingAddress: ADDRESS, idempotencyKey: key() });
    const pid = pay(c.razorpayOrderId, c.amount, "authorized");
    const r: any = await settleRazorpayOrder(c.razorpayOrderId, pid);
    assert.equal(r.status, "paid");
    assert.ok(rz.calls.includes(`POST /payments/${pid}/capture`));
  });
  await check("a failed payment records no order", async () => {
    const c = await startCheckout({ items: [{ productId: "p-shirt", quantity: 1 }], customerEmail: "g@h.co", customerName: "G H", shippingAddress: ADDRESS, idempotencyKey: key() });
    const pid = pay(c.razorpayOrderId, c.amount, "failed");
    const r: any = await settleRazorpayOrder(c.razorpayOrderId, pid);
    assert.equal(r.status, "failed");
    assert.equal((await fetchResource("orders")).filter((o: any) => o.id === c.orderId).length, 0);
  });
  await check("a payment id from another order is refused", async () => {
    const c = await startCheckout({ items: [{ productId: "p-shirt", quantity: 1 }], customerEmail: "i@j.co", customerName: "I J", shippingAddress: ADDRESS, idempotencyKey: key() });
    const otherPid = pay("order_someone_else", c.amount);
    await rejects(settleRazorpayOrder(c.razorpayOrderId, otherPid), /does not belong/);
  });

  console.log("store credit");
  await check("credit covering the whole order records it without Razorpay, once", async () => {
    await prisma.customer.update({ where: { email: "buyer@example.test" }, data: { storeCredit: 500 } });
    const k = key();
    const req = { items: [{ productId: "p-shirt", quantity: 1 }], customerEmail: "buyer@example.test", customerName: "Buyer", shippingAddress: ADDRESS, idempotencyKey: k, useStoreCredit: true, signedInEmail: "buyer@example.test" };
    const r1: any = await startCheckout(req);
    const r2: any = await startCheckout(req);
    assert.equal(r1.requiresPayment, false);
    assert.equal(r2.orderId, r1.orderId);
    const row = await prisma.customer.findUnique({ where: { email: "buyer@example.test" } });
    assert.equal(row!.storeCredit, 500 - r1.quote.total);
  });
  await check("partial credit: card pays the rest; credit is spent only when the payment is confirmed", async () => {
    await prisma.customer.update({ where: { email: "buyer@example.test" }, data: { storeCredit: 20 } });
    const c: any = await startCheckout({ items: [{ productId: "p-shirt", quantity: 1 }], customerEmail: "buyer@example.test", customerName: "Buyer", shippingAddress: ADDRESS, idempotencyKey: key(), useStoreCredit: true, signedInEmail: "buyer@example.test" });
    assert.equal(c.quote.storeCreditApplied, 20);
    assert.equal(c.amount, Math.round((c.quote.total - 20) * 100));
    assert.equal((await prisma.customer.findUnique({ where: { email: "buyer@example.test" } }))!.storeCredit, 20);
    await settleRazorpayOrder(c.razorpayOrderId, pay(c.razorpayOrderId, c.amount));
    assert.equal((await prisma.customer.findUnique({ where: { email: "buyer@example.test" } }))!.storeCredit, 0);
  });

  console.log("refunds");
  await check("partial refund, then over-refund refused, then the rest", async () => {
    const tx0 = await prisma.paymentTransaction.findUnique({ where: { orderId: second.orderId } });
    const half = Math.floor(tx0!.amount / 2) / 100;
    const r1 = await refundOrderPayment(second.orderId, half, "test", "verify");
    assert.equal(r1.ok, true);
    assert.equal(r1.fullyRefunded, false);
    await rejects(refundOrderPayment(second.orderId, tx0!.amount / 100, "too much", "verify"), /left to refund/);
    const rest = (tx0!.amount - Math.round(half * 100)) / 100;
    const r2 = await refundOrderPayment(second.orderId, rest, "rest", "verify");
    assert.equal(r2.fullyRefunded, true);
    const tx = await prisma.paymentTransaction.findUnique({ where: { orderId: second.orderId } });
    assert.equal(tx!.refundedAmount, tx!.amount);
    assert.equal(tx!.status, "refunded");
  });
  await check("a refund Razorpay rejects does not count as refunded", async () => {
    const c: any = await startCheckout({ items: [{ productId: "p-shirt", quantity: 1 }], customerEmail: "k@l.co", customerName: "K L", shippingAddress: ADDRESS, idempotencyKey: key() });
    await settleRazorpayOrder(c.razorpayOrderId, pay(c.razorpayOrderId, c.amount));
    rz.failNextRefund = true;
    await rejects(refundOrderPayment(c.orderId, 10, "x", "verify"), /refused the refund/);
    const tx = await prisma.paymentTransaction.findUnique({ where: { orderId: c.orderId } });
    assert.equal(tx!.refundedAmount, 0);
  });
  await check("orders not paid through Razorpay are reported as manual refunds", async () => {
    const r = await refundOrderPayment("PS-LEGACY-1", 10, "x", "verify");
    assert.equal(r.ok, false);
    assert.equal(r.manual, true);
  });

  console.log(`\n${passed} checks passed${process.exitCode ? ", some FAILED" : ""}.`);
  await prisma.$disconnect();
}

main().catch(async err => {
  console.error(err);
  process.exitCode = 1;
  await prisma.$disconnect();
});
