import { Router, Request, Response } from "express";
import { prisma } from "../../src/lib/prisma";
import { requireAdmin, AdminRequest } from "../middleware/requireAdmin";
import { verifyCustomerToken } from "../services/adminAuth";
import { isIntegrationActive } from "../services/integrations/store";
import { CheckoutError, quoteCheckout, STORE_CURRENCY } from "../services/payments/pricing";
import {
  publicOrder,
  recordRefundStatus,
  refundOrderPayment,
  settleRazorpayOrder,
  startCheckout
} from "../services/payments/checkout";
import { razorpayConfig, verifyCheckoutSignature, verifyWebhookSignature } from "../services/payments/razorpayClient";

/**
 * /api/payments — checkout and Razorpay.
 *
 * There is no scheduled reconciliation job: the
 * Razorpay webhook settles payments as they happen, and the checkout's status
 * poll asks Razorpay directly, so a missed webhook is recovered the moment the
 * shopper (or an admin) looks at the order.
 */
const router = Router();

function signedInEmail(req: Request): string | null {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  try {
    return verifyCustomerToken(token)?.sub?.toLowerCase() || null;
  } catch {
    return null;
  }
}

function fail(res: Response, err: any) {
  if (err instanceof CheckoutError) return res.status(err.status).json({ error: err.message });
  console.error("[Payments]", err);
  return res.status(500).json({ error: "Something went wrong. You have not been charged twice — please check your email or try again." });
}

function quoteRequest(req: Request) {
  const b = req.body || {};
  return {
    items: Array.isArray(b.items) ? b.items.map((i: any) => ({ productId: String(i?.productId || ""), quantity: Number(i?.quantity) })) : [],
    discountCode: b.discountCode ? String(b.discountCode) : null,
    discountId: b.discountId ? String(b.discountId) : null,
    rewardChoiceId: b.rewardChoiceId ? String(b.rewardChoiceId) : null,
    freeCanSelections: Array.isArray(b.freeCanSelections) ? b.freeCanSelections : [],
    customerEmail: String(b.customerEmail || ""),
    useStoreCredit: Boolean(b.useStoreCredit),
    signedInEmail: signedInEmail(req)
  };
}

/** Which payment methods checkout may offer. Public; contains no secrets. */
router.get("/config", async (_req, res) => {
  try {
    const active = await isIntegrationActive("razorpay");
    const cfg = active ? await razorpayConfig() : null;
    res.json({
      currency: STORE_CURRENCY,
      gateways: cfg ? [{ id: "razorpay", name: "Razorpay", keyId: cfg.keyId, mode: cfg.mode }] : []
    });
  } catch (err) {
    fail(res, err);
  }
});

router.post("/quote", async (req, res) => {
  try {
    res.json(await quoteCheckout(quoteRequest(req)));
  } catch (err) {
    fail(res, err);
  }
});

router.post("/checkout", async (req, res) => {
  try {
    const b = req.body || {};
    const result = await startCheckout({
      ...quoteRequest(req),
      customerName: String(b.customerName || ""),
      shippingAddress: b.shippingAddress,
      idempotencyKey: String(b.idempotencyKey || "")
    });
    res.json(result);
  } catch (err) {
    fail(res, err);
  }
});

/** Called by the browser after Razorpay Checkout's success handler. */
router.post("/razorpay/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    const cfg = await razorpayConfig();
    if (!verifyCheckoutSignature(String(razorpay_order_id || ""), String(razorpay_payment_id || ""), String(razorpay_signature || ""), cfg.keySecret)) {
      return res.status(400).json({ status: "failed", error: "Payment signature could not be verified." });
    }
    // The signature proves Razorpay issued this pair; the order is still only
    // recorded after Razorpay's API confirms the captured amount.
    const result = await settleRazorpayOrder(String(razorpay_order_id), String(razorpay_payment_id));
    res.json({ status: result.status, order: publicOrder((result as any).order), message: (result as any).message || null });
  } catch (err) {
    fail(res, err);
  }
});

/** Polled by the confirmation screen. Reconciles with Razorpay when still pending. */
router.get("/status", async (req, res) => {
  try {
    const orderId = String(req.query.orderId || "").trim();
    if (!orderId) return res.status(400).json({ error: "orderId is required." });
    const tx = await prisma.paymentTransaction.findUnique({ where: { orderId } });
    if (!tx) return res.status(404).json({ status: "unknown" });
    if (!tx.orderRecorded && tx.provider === "razorpay" && tx.providerOrderId && ["created", "paid_unrecorded"].includes(tx.status)) {
      const result = await settleRazorpayOrder(tx.providerOrderId);
      return res.json({ status: result.status, order: publicOrder((result as any).order) });
    }
    const { fetchResource } = await import("../../serverDb");
    const order = tx.orderRecorded ? ((await fetchResource("orders")) || []).find((o: any) => String(o.id) === orderId) : null;
    res.json({ status: tx.orderRecorded ? "paid" : tx.status === "created" ? "pending" : tx.status, order: publicOrder(order) });
  } catch (err) {
    fail(res, err);
  }
});

/**
 * Razorpay webhook. Configure in Razorpay Dashboard → Webhooks with events
 * payment.captured, payment.authorized, payment.failed, order.paid,
 * refund.processed, refund.failed — and the same secret as Settings → Payments.
 */
router.post("/webhook/razorpay", async (req: any, res) => {
  try {
    const cfg = await razorpayConfig();
    if (!cfg.webhookSecret) {
      console.error("[Payments Webhook] Razorpay webhook secret is not configured; refusing unsigned events.");
      return res.status(503).json({ error: "Webhook secret not configured." });
    }
    const raw: Buffer | undefined = req.rawBody;
    const signature = String(req.headers["x-razorpay-signature"] || "");
    if (!raw || !verifyWebhookSignature(raw, signature, cfg.webhookSecret)) {
      return res.status(401).json({ error: "Invalid signature." });
    }

    const event = String(req.body?.event || "");
    const payment = req.body?.payload?.payment?.entity;
    const refund = req.body?.payload?.refund?.entity;

    if ((event === "payment.captured" || event === "payment.authorized" || event === "order.paid") && payment?.order_id) {
      await settleRazorpayOrder(payment.order_id, payment.id);
    } else if (event === "payment.failed" && payment?.order_id) {
      await prisma.paymentTransaction.updateMany({
        where: { providerOrderId: payment.order_id, orderRecorded: false },
        data: { lastError: payment.error_description || "Payment failed" }
      });
    } else if ((event === "refund.processed" || event === "refund.failed") && refund?.payment_id) {
      await recordRefundStatus(refund.payment_id, refund.id, event === "refund.processed" ? "processed" : "failed");
    }
    res.json({ received: true });
  } catch (err: any) {
    // 5xx makes Razorpay retry, which is what we want for a transient failure.
    console.error("[Payments Webhook] Processing failed:", err?.message || err);
    res.status(500).json({ error: "Processing failed; will be retried." });
  }
});

router.post("/refund", requireAdmin, async (req: AdminRequest, res) => {
  try {
    const { orderId, amount, reason } = req.body || {};
    const result = await refundOrderPayment(String(orderId || ""), Number(amount), String(reason || "Refund"), req.admin?.email || "admin");
    res.status(result.ok ? 200 : 409).json(result);
  } catch (err) {
    fail(res, err);
  }
});

/** Admin: the payment record behind an order. */
router.get("/transaction/:orderId", requireAdmin, async (req, res) => {
  const tx = await prisma.paymentTransaction.findUnique({ where: { orderId: req.params.orderId } });
  if (!tx) return res.status(404).json({ error: "No payment transaction for this order." });
  const { checkout, ...rest } = tx as any;
  res.json(rest);
});

export default router;
