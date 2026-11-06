import { Router, Request, Response } from "express";
import { fetchResource, saveResource, deleteSingleItem, getDb } from "../../serverDb";
import {
  sendOrderConfirmationEmail,
  sendOrderProcessingEmail,
  sendOrderShippedEmail,
  sendOutForDeliveryEmail,
  sendDeliveredEmail,
  sendOrderCancelledEmail,
  sendOrderRefundedEmail
} from "../services/emailService";
import { trackPurchaseCompleted, trackOrderRefunded, trackOrderShipped } from "../services/klaviyoService";
import { requireAdmin, requireCustomer, mayActOnCustomer, AdminRequest } from "../middleware/requireAdmin";
import { validateIndiaAddress } from "../../src/utils/indiaValidation";
import { checkDiscountUsable } from "../services/discountUsage";

const router = Router();

/**
 * Order lifecycle notifications.
 *
 * `saveSingleOrder` is the ONLY place that sends order emails or fires Klaviyo
 * order events. Callers (checkout, the payment gateway, the admin routes) just persist the order and let the transition decide what to
 * send. Sending from the call sites as well is what previously produced
 * duplicate confirmations and admin notifications.
 *
 * Every dispatch is recorded in `data.notificationsSent` and is only ever sent
 * once per order, so a retried webhook, a callback racing the verify-payment
 * call, or a restarted worker cannot re-notify the customer.
 */
type OrderNotificationKey =
  | 'order_confirmation'
  | 'order_processing'
  | 'order_shipped'
  | 'out_for_delivery'
  | 'order_delivered'
  | 'order_cancelled'
  | 'order_refunded';

const FULFILLMENT_NOTIFICATION: Record<string, OrderNotificationKey> = {
  Processing: 'order_processing',
  Shipped: 'order_shipped',
  'Out for Delivery': 'out_for_delivery',
  Delivered: 'order_delivered',
  Cancelled: 'order_cancelled'
};

function dispatchOrderNotification(key: OrderNotificationKey, order: any, context: any = {}) {
  const label = `[Orders Trigger] ${key} for ${order.id}`;
  const fail = (e: any) => console.warn(`${label} failed:`, e?.message || e);

  switch (key) {
    case 'order_confirmation':
      // sendOrderConfirmationEmail also notifies the admin address internally,
      // so no separate admin call belongs here.
      sendOrderConfirmationEmail(order).catch(fail);
      trackPurchaseCompleted(order).catch(fail);
      break;
    case 'order_processing':
      sendOrderProcessingEmail(order).catch(fail);
      break;
    case 'order_shipped':
      sendOrderShippedEmail(order, order.trackingNumber, order.carrier).catch(fail);
      trackOrderShipped(order, order.trackingNumber, order.carrier).catch(fail);
      break;
    case 'out_for_delivery':
      sendOutForDeliveryEmail(order).catch(fail);
      break;
    case 'order_delivered':
      sendDeliveredEmail(order).catch(fail);
      break;
    case 'order_cancelled':
      sendOrderCancelledEmail(order, context.reason || 'Order cancelled by store administrator').catch(fail);
      break;
    case 'order_refunded':
      sendOrderRefundedEmail(order, context.refundAmount ?? order.total, context.reason).catch(fail);
      trackOrderRefunded(order, context.refundAmount ?? order.total).catch(fail);
      break;
  }
}

export async function saveSingleOrder(orderData: any) {
  const id = String(orderData.id || orderData.orderId || `PS${Math.floor(Math.random() * 90000 + 10000)}`);
  
  // Check existing order status to detect changes
  let existingOrder: any = null;
  try {
    const currentOrders: any[] = (await fetchResource('orders')) || [];
    existingOrder = currentOrders.find((o: any) => String(o.id) === id);
  } catch (_e) {}

  const items = orderData.items || existingOrder?.items || [];

  // Subscriptions have been removed. Orders bought as subscriptions before that
  // keep the flags and details they were saved with; nothing new derives them.
  const isSubscription = Boolean(existingOrder?.isSubscription ?? orderData.isSubscription ?? false);
  const subscriptionDetails = existingOrder?.subscriptionDetails || orderData.subscriptionDetails || null;
  const tags = Array.isArray(orderData.tags) ? orderData.tags : (existingOrder?.tags || ["Storefront", "Online Order"]);

  const formattedOrder = {
    id,
    customerName: orderData.customerName || existingOrder?.customerName || 'Valued Customer',
    customerEmail: orderData.customerEmail || existingOrder?.customerEmail || 'customer@example.com',
    tags,
    isSubscription,
    subscriptionDetails,
    fulfillmentStatus: orderData.fulfillmentStatus || existingOrder?.fulfillmentStatus || 'Unfulfilled',
    paymentStatus: orderData.paymentStatus || existingOrder?.paymentStatus || (orderData.total === 0 ? 'Paid' : 'Pending'),
    gatewayTxId: orderData.gatewayTxId || existingOrder?.gatewayTxId || null,
    gatewayAuthCode: orderData.gatewayAuthCode || existingOrder?.gatewayAuthCode || null,
    cardBrand: orderData.cardBrand || existingOrder?.cardBrand || 'Card',
    total: typeof orderData.total === 'number' ? orderData.total : parseFloat(orderData.total) || existingOrder?.total || 0,
    subtotal: typeof orderData.subtotal === 'number' ? orderData.subtotal : (typeof existingOrder?.subtotal === 'number' ? existingOrder.subtotal : undefined),
    shippingCost: typeof orderData.shippingCost === 'number' ? orderData.shippingCost : (typeof orderData.deliveryCost === 'number' ? orderData.deliveryCost : (typeof existingOrder?.shippingCost === 'number' ? existingOrder.shippingCost : undefined)),
    deliveryCost: typeof orderData.deliveryCost === 'number' ? orderData.deliveryCost : (typeof orderData.shippingCost === 'number' ? orderData.shippingCost : (typeof existingOrder?.deliveryCost === 'number' ? existingOrder.deliveryCost : undefined)),
    storeCreditApplied: typeof orderData.storeCreditApplied === 'number' ? orderData.storeCreditApplied : parseFloat(orderData.storeCreditApplied) || existingOrder?.storeCreditApplied || 0,
    destination: orderData.destination || orderData.address || existingOrder?.destination || 'India',
    // The address as separate fields, kept alongside the joined display string
    // so a shipping label can be produced without parsing it back apart.
    shippingAddress:
      (orderData.shippingAddress && typeof orderData.shippingAddress === 'object' ? orderData.shippingAddress : null) ||
      existingOrder?.shippingAddress ||
      null,
    date: orderData.date || existingOrder?.date || (new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
    deliveryMethod: orderData.deliveryMethod || existingOrder?.deliveryMethod || 'Standard Delivery',
    subscriptionId: orderData.subscriptionId || existingOrder?.subscriptionId || null,
    // On a subscription renewal, the order the plan was first bought with, so the
    // admin can trace a renewal back to its origin. Kept on the order object
    // rather than as a new column, so it needs no migration; toOrderRow preserves
    // it inside `data`.
    parentOrderId: orderData.parentOrderId || existingOrder?.parentOrderId || existingOrder?.data?.parentOrderId || null,
    isRenewal: typeof orderData.isRenewal === 'boolean'
      ? orderData.isRenewal
      : (existingOrder?.isRenewal ?? existingOrder?.data?.isRenewal ?? false),
    items,
    discountApplied: orderData.discountApplied || existingOrder?.discountApplied || null,
    // The money actually taken off. Previously only the discount object was
    // stored, leaving the admin and the emails to guess the amount from the
    // difference between subtotal and total.
    discountAmount: typeof orderData.discountAmount === 'number'
      ? orderData.discountAmount
      : (typeof existingOrder?.discountAmount === 'number' ? existingOrder.discountAmount : undefined),
    trackingNumber: orderData.trackingNumber || existingOrder?.trackingNumber || null,
    // Kept in step with trackingNumber rather than dropped. This field was absent
    // from the formatted order, so every save discarded it — while a good part of
    // the admin UI and the customer account read `trackingId` first and therefore
    // showed "no tracking" for parcels that had it.
    trackingId:
      orderData.trackingId ||
      orderData.trackingNumber ||
      existingOrder?.trackingId ||
      existingOrder?.trackingNumber ||
      null,
    carrier: orderData.carrier || existingOrder?.carrier || null,
    data: {
      ...(existingOrder?.data || {}),
      ...(orderData?.data || {}),
      shippingCost: orderData.shippingCost ?? existingOrder?.data?.shippingCost,
      deliveryCost: orderData.deliveryCost ?? existingOrder?.data?.deliveryCost,
      subtotal: orderData.subtotal ?? existingOrder?.data?.subtotal,
      parentOrderId: orderData.parentOrderId ?? existingOrder?.data?.parentOrderId,
      isRenewal: orderData.isRenewal ?? existingOrder?.data?.isRenewal,
      address: orderData.address || existingOrder?.data?.address,
      shippingAddress:
        (orderData.shippingAddress && typeof orderData.shippingAddress === 'object' ? orderData.shippingAddress : null) ||
        existingOrder?.data?.shippingAddress ||
        undefined,
      paymentMethod: orderData.paymentMethod || existingOrder?.data?.paymentMethod,
      // Merge rather than overwrite: a caller passing its own `data` block must
      // not be able to wipe the record of what has already been emailed.
      notificationsSent: {
        ...(existingOrder?.data?.notificationsSent || {}),
        ...(orderData?.data?.notificationsSent || {})
      }
    }
  };

  // ------------------------------------------------------------------
  // Decide which notifications this save should produce.
  //
  // This runs BEFORE persisting so the "already sent" marks are written in the
  // same save. A concurrent save for the same order then reads those marks and
  // sends nothing, which is what makes the flow safe against the payment
  // webhook and the browser's verify call racing each other.
  // ------------------------------------------------------------------
  const alreadySent: Record<string, string> = formattedOrder.data.notificationsSent || {};
  const pending: Array<{ key: OrderNotificationKey; context: any }> = [];

  const queue = (key: OrderNotificationKey, context: any = {}) => {
    if (alreadySent[key]) {
      console.log(`[Orders Trigger] Skipping ${key} for ${id} — already sent at ${alreadySent[key]}.`);
      return;
    }
    if (pending.some(p => p.key === key)) return;
    pending.push({ key, context });
  };

  try {
    const isNewOrder = !existingOrder;
    const paymentJustPaid = existingOrder?.paymentStatus !== 'Paid' && formattedOrder.paymentStatus === 'Paid';

    // 1. Payment succeeded (on creation or on a later transition to Paid)
    if (formattedOrder.paymentStatus === 'Paid' && (isNewOrder || paymentJustPaid)) {
      queue('order_confirmation');
    }

    // 2. Fulfillment status transition
    const previousFulfillment = existingOrder?.fulfillmentStatus;
    if (existingOrder && previousFulfillment !== formattedOrder.fulfillmentStatus) {
      console.log(
        `[Orders Trigger] Fulfillment status changed for ${id}: ${previousFulfillment} -> ${formattedOrder.fulfillmentStatus}`
      );
      const key = FULFILLMENT_NOTIFICATION[formattedOrder.fulfillmentStatus];
      if (key) {
        queue(key, { reason: orderData.reason || orderData.cancellationReason });
      }
    }

    // 3. Refund transition
    if (existingOrder && existingOrder.paymentStatus !== 'Refunded' && formattedOrder.paymentStatus === 'Refunded') {
      queue('order_refunded', {
        refundAmount: orderData.refundAmount ?? formattedOrder.total,
        reason: orderData.refundReason || orderData.reason
      });
    }
  } catch (triggerErr) {
    console.warn('[Orders Trigger] Error deciding automated notifications:', triggerErr);
  }

  const dispatchedAt = new Date().toISOString();
  for (const item of pending) {
    formattedOrder.data.notificationsSent[item.key] = dispatchedAt;
  }

  // Persist to the Order table, then confirm the row is actually there.
  //
  // This used to swallow the failure as a warning. On a serverless deploy the
  // local JSON snapshot is not writable and the in-memory cache dies with the
  // invocation, so a failed write here meant a customer paid and the order
  // existed nowhere - with nothing in the logs to reconstruct it from. The
  // payload is now logged in full whenever the row cannot be confirmed.
  let persistedToNeon = false;
  try {
    const { upsertOrderRow } = await import('../../src/lib/orderRow');
    persistedToNeon = await upsertOrderRow(formattedOrder);
  } catch (prismaErr: any) {
    console.error('[Orders Router] Neon order write failed for ' + id + ':', prismaErr?.message);
  }

  if (!persistedToNeon) {
    console.error(
      '[ORDER NOT PERSISTED] ' + id + ' is not in the Neon Order table after save. ' +
        'Recover it from the payload below.',
      JSON.stringify(formattedOrder)
    );
  }

  // Sync to StoreResource
  try {
    const currentOrders: any[] = (await fetchResource('orders')) || [];
    const existingIdx = currentOrders.findIndex((o: any) => String(o.id) === id);
    if (existingIdx !== -1) {
      currentOrders[existingIdx] = { ...currentOrders[existingIdx], ...formattedOrder };
    } else {
      currentOrders.unshift(formattedOrder);
    }
    await saveResource('orders', currentOrders);
  } catch (resourceErr) {
    console.error('[Orders Router] StoreResource save error:', resourceErr);
  }

  // Now that the marks are persisted, actually send.
  for (const item of pending) {
    console.log(`[Orders Trigger] Dispatching ${item.key} for ${id}`);
    dispatchOrderNotification(item.key, formattedOrder, item.context);
  }

  return formattedOrder;
}

// GET all orders - return all valid persisted orders
// Returns EVERY order in the store — names, addresses, phone numbers, gateway
// transaction ids. This was open to anonymous callers, which made the whole
// order database downloadable by anyone. Shoppers use GET /mine below instead.
router.get("/", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const data: any[] = (await fetchResource("orders")) || [];
    const validOrders = data.filter((o: any) => o && o.id);
    res.json(validOrders);
  } catch (err: any) {
    console.error("[Orders Router] GET Error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch orders" });
  }
});

/**
 * The signed-in shopper's own orders.
 *
 * The account page used to filter the full store-wide list in the browser,
 * which meant every visitor had to be handed every order for one person to read
 * their own. The filtering now happens here, against the email in the token
 * rather than one supplied by the caller.
 *
 * Registered before "/:id" so the literal path is not swallowed by the
 * parameter route.
 */
router.get("/mine", requireCustomer, async (req: AdminRequest, res: Response) => {
  try {
    const email = req.customer?.email;
    if (!email) {
      // An admin token reached a route that only means something for a shopper.
      return res.status(400).json({
        error: "This endpoint returns the signed-in customer's own orders. Use GET /api/orders as an administrator."
      });
    }

    const data: any[] = (await fetchResource("orders")) || [];
    const mine = data.filter(
      (o: any) => o && o.id && String(o.customerEmail || "").toLowerCase() === email
    );
    res.json(mine);
  } catch (err: any) {
    console.error("[Orders Router] GET /mine Error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch your orders" });
  }
});

// GET single order by ID: the order's own customer, or an admin.
//
// This used to be anonymous (for the old payment return page), which made every order
// (name, address, items) readable by guessing its id. Checkout confirmation now
// uses /api/payments/status, which returns only non-personal fields.
router.get("/:id", requireCustomer, async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orders: any[] = (await fetchResource("orders")) || [];
    const found = orders.find((o: any) => String(o.id) === String(id));
    if (found && mayActOnCustomer(req, found.customerEmail)) {
      return res.json(found);
    }

    res.status(404).json({ error: "Order not found" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch order" });
  }
});

// PUT /:id - Update one existing order.
//
// The admin tracking editors have always PUT here, but no such route existed —
// express fell through to the catch-all 404, so every manual tracking number an
// operator saved was reported as "Failed to update tracking on server" and lost.
// Writes go through saveSingleOrder like every other order write, so a change
// that moves the order to Shipped still sends the dispatch email exactly once.
router.put("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orderData = req.body;

    if (!orderData || typeof orderData !== 'object') {
      return res.status(400).json({ success: false, error: "Order data object is required" });
    }

    const orders: any[] = (await fetchResource("orders")) || [];
    const existing = orders.find((o: any) => String(o.id) === String(id));
    if (!existing) {
      return res.status(404).json({ success: false, error: `Order #${id} not found` });
    }

    // The id in the path wins, so a malformed body cannot rename or clone an order.
    const saved = await saveSingleOrder({ ...existing, ...orderData, id: String(id) });

    return res.json({ success: true, order: saved });
  } catch (err: any) {
    console.error("[Orders Router] PUT Error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to update order" });
  }
});

// POST /create - Create a single order
// Admin-only. Storefront checkout creates orders through /api/payments, which
// prices the basket on the server; accepting a priced order from the browser
// here was a way to buy anything for any amount.
router.post("/create", requireAdmin, async (req: Request, res: Response) => {
  try {
    const orderData = req.body;
    if (!orderData || typeof orderData !== 'object') {
      return res.status(400).json({ error: "Order data object is required" });
    }

    // Creating, never overwriting: editing an existing order goes through PUT /:id.
    const requestedId = String(orderData.id || orderData.orderId || '').trim();
    if (requestedId) {
      const existing = ((await fetchResource('orders')) || []).find((o: any) => String(o.id) === requestedId);
      if (existing) return res.status(409).json({ error: 'An order with this reference already exists.' });
    }

    if (orderData.shippingAddress && typeof orderData.shippingAddress === 'object') {
      const check = validateIndiaAddress({ ...orderData.shippingAddress, phone: orderData.shippingAddress.phone || orderData.customerPhone });
      if (!check.valid) return res.status(400).json({ error: check.errors[0], errors: check.errors });
      orderData.shippingAddress = check.address;
    }

    if (orderData.discountApplied) {
      const usable = await checkDiscountUsable(orderData.customerEmail, orderData.discountApplied, requestedId || undefined);
      if (!usable.ok) return res.status(400).json({ error: usable.message });
    }

    orderData.createdByAdmin = true;
    orderData.currency = orderData.currency || 'INR';
    const savedOrder = await saveSingleOrder(orderData);
    res.json({ success: true, order: savedOrder });
  } catch (err: any) {
    console.error("[Orders Router] POST /create Error:", err);
    res.status(500).json({ error: err.message || "Failed to create order" });
  }
});

// POST / - Create or sync orders (accepts single order or array)
// Bulk order sync (admin dashboard). Checkout does NOT use this: orders are
// written server-side by /api/payments once the payment is verified.
router.post("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    if (Array.isArray(payload)) {
      /*
        Merge, never replace.

        This used to save the posted array AS the order list. Any browser could
        post it — the storefront syncs its in-memory orders here — so a tab
        holding a stale or damaged copy overwrote every order in the store, and
        orders it did not know about were deleted. Each posted order is now
        upserted by id onto the stored list; orders not in the payload are left
        alone. Deleting an order goes through DELETE /api/orders/:id.

        Each order also used to be rebuilt from a fixed whitelist of fields, so
        every sync silently stripped subscriptionId, subscriptionDetails,
        isSubscription, createdAt, returnRequest and trackingHistory from every
        order. The stored order is now the base and the posted one is laid over
        it, so nothing the payload omits is lost.
      */
      const currentOrders: any[] = (await fetchResource('orders')) || [];
      const byId = new Map<string, any>();
      currentOrders.forEach((o: any) => { if (o && o.id) byId.set(String(o.id), o); });

      for (const orderData of payload) {
        if (!orderData || typeof orderData !== 'object') continue;
        const id = String(orderData.id || orderData.orderId || '');
        if (!id) continue; // An order with no id cannot be matched, so it is not invented.
        const existing = byId.get(id);
        const merged: any = { ...(existing || {}), ...orderData, id };
        if (typeof merged.total !== 'number') merged.total = parseFloat(merged.total) || 0;
        if (!Array.isArray(merged.tags)) merged.tags = ['Storefront', 'Online Order'];
        if (!Array.isArray(merged.items)) merged.items = [];
        byId.set(id, merged);
      }

      const savedOrders = await saveResource('orders', Array.from(byId.values()));
      return res.json(savedOrders);
    }
    if (payload && typeof payload === 'object') {
      const savedOrder = await saveSingleOrder(payload);
      return res.json({ success: true, order: savedOrder });
    } else {
      return res.status(400).json({ error: "Invalid order payload" });
    }
  } catch (err: any) {
    console.error("[Orders Router] POST Error:", err);
    res.status(500).json({ error: err.message || "Failed to persist orders" });
  }
});

// POST /:id/cancel - Customer Cancel Order Workflow
router.post("/:id/cancel", requireCustomer, async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, refundMethod = "original", customerEmail } = req.body;

    const currentOrders: any[] = (await fetchResource("orders")) || [];
    const foundIdx = currentOrders.findIndex((o: any) => String(o.id) === String(id));

    if (foundIdx === -1) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = currentOrders[foundIdx];

    // Checked against the order's own email, not the one in the body. The body
    // already carried `customerEmail` but nothing compared it to anything, so
    // any order id could be cancelled and refunded by anyone who knew it.
    if (!mayActOnCustomer(req, order.customerEmail)) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.fulfillmentStatus === "Shipped" || order.fulfillmentStatus === "Delivered") {
      return res.status(400).json({ error: "Order has already shipped and cannot be directly cancelled. Please request a return." });
    }

    if (order.fulfillmentStatus === "Cancelled" || order.paymentStatus === "Refunded") {
      return res.status(400).json({ error: "Order is already cancelled or refunded." });
    }

    // Build a patch instead of mutating `order`. fetchResource hands back the
    // cached object itself, so mutating it in place would make saveSingleOrder
    // see the NEW status as the previous one and skip the transition emails.
    const cancellationReason = reason || "Customer requested cancellation";
    const patch: any = {
      ...order,
      fulfillmentStatus: "Cancelled",
      paymentStatus: "Refunded",
      cancellationReason,
      cancelledAt: new Date().toISOString(),
      reason: cancellationReason,
      refundAmount: order.total,
      refundReason: `Cancellation refund (${refundMethod === "store_credit" ? "Store Credit" : "Original Payment"})`
    };

    if (refundMethod === "store_credit") {
      // Add store credit to customer account
      try {
        const customersList: any[] = (await fetchResource("customers")) || [];
        const cIdx = customersList.findIndex((c: any) => c.email.toLowerCase() === (order.customerEmail || "").toLowerCase());
        if (cIdx !== -1) {
          customersList[cIdx].storeCredit = (customersList[cIdx].storeCredit || 0) + (order.total || 0);
          await saveResource("customers", customersList);
          console.log(`[Cancel Order] Added ₹${order.total} store credit to ${order.customerEmail}`);
        }
      } catch (custErr) {
        console.warn("[Cancel Order] Failed to update customer store credit:", custErr);
      }
    } else {
      // Refund the original payment. Only a refund the gateway accepted marks
      // the order Refunded; anything else is recorded as pending so it is not
      // reported to the customer as money returned when it was not.
      const paidAmount = Math.max((Number(order.total) || 0) - (Number(order.storeCreditApplied) || 0), 0);
      if (paidAmount > 0) {
        try {
          const { refundOrderPayment } = await import("../services/payments/checkout");
          const refund = await refundOrderPayment(String(order.id), paidAmount, `Customer cancellation: ${reason || "Changed mind"}`, "customer");
          patch.refundDetails = { ...refund, refundedAt: new Date().toISOString() };
          if (!refund.ok) {
            patch.paymentStatus = "Refund Pending";
            patch.refundReason = refund.message;
          }
        } catch (refundErr: any) {
          patch.paymentStatus = "Refund Pending";
          patch.refundReason = `Automatic refund failed: ${refundErr?.message || refundErr}`;
          console.error(`[Cancel Order] Refund for ${order.id} failed:`, refundErr?.message || refundErr);
        }
      }
      // Credit that paid for part of the order goes back as credit.
      const creditPart = Number(order.storeCreditApplied) || 0;
      if (creditPart > 0) {
        const { prisma } = await import("../../src/lib/prisma");
        await prisma.customer
          .updateMany({ where: { email: String(order.customerEmail || "").toLowerCase() }, data: { storeCredit: { increment: creditPart } } })
          .catch((e: any) => console.error("[Cancel Order] Store credit return failed:", e?.message || e));
      }
    }

    patch.returnRequest = {
      type: "Cancellation",
      reason: cancellationReason,
      refundMethod,
      status: "Completed",
      requestedAt: new Date().toISOString()
    };

    // saveSingleOrder emits the cancellation and refund notifications from the
    // status transition — sending them here as well is what produced the
    // duplicate cancellation emails.
    const updatedOrder = await saveSingleOrder(patch);

    res.json({ success: true, message: "Order successfully cancelled and refund initiated.", order: updatedOrder });
  } catch (err: any) {
    console.error("[Orders Router] POST /:id/cancel Error:", err);
    res.status(500).json({ error: err.message || "Failed to cancel order" });
  }
});

// POST /:id/return-request - Customer Return / Refund / Exchange Request Workflow
router.post("/:id/return-request", requireCustomer, async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { type, reason, itemsToReturn, exchangeNotes, refundMethod } = req.body;

    if (!type || !reason) {
      return res.status(400).json({ error: "Request type and reason are required." });
    }

    const currentOrders: any[] = (await fetchResource("orders")) || [];
    const foundIdx = currentOrders.findIndex((o: any) => String(o.id) === String(id));

    if (foundIdx === -1) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = currentOrders[foundIdx];

    // Raising a return against someone else's order was possible with nothing
    // but its id.
    if (!mayActOnCustomer(req, order.customerEmail)) {
      return res.status(404).json({ error: "Order not found" });
    }

    const returnRequest = {
      type: type || "Return", // 'Return' | 'Refund' | 'Exchange'
      reason,
      itemsToReturn: itemsToReturn || order.items || [],
      exchangeNotes: exchangeNotes || "",
      refundMethod: refundMethod || "original",
      status: "Pending", // 'Pending' | 'Approved' | 'Declined' | 'Completed'
      requestedAt: new Date().toISOString()
    };

    const existingTags = Array.isArray(order.tags) ? [...order.tags] : [];
    if (!existingTags.includes(`${type} Requested`)) {
      existingTags.push(`${type} Requested`);
    }

    const updatedOrder = await saveSingleOrder({
      ...order,
      returnRequest,
      tags: existingTags
    });

    // A return/exchange request is an acknowledgement rather than a lifecycle
    // status change, so it has no transition to hang off and is sent directly.
    try {
      if (type === "Exchange") {
        const { sendOrderExchangedEmail } = await import("../services/emailService");
        await sendOrderExchangedEmail(updatedOrder, exchangeNotes || "Product exchange requested", reason);
      } else {
        const { sendOrderCancelledEmail } = await import("../services/emailService");
        await sendOrderCancelledEmail(updatedOrder, `Return/Refund request initiated: ${reason}`);
      }
    } catch (e) {
      console.warn("Return request email notification error:", e);
    }

    res.json({ success: true, message: `${type} request submitted successfully. Our team will review your request.`, order: updatedOrder });
  } catch (err: any) {
    console.error("[Orders Router] Return Request Error:", err);
    res.status(500).json({ error: err.message || "Failed to submit return request" });
  }
});

/**
 * Consumer right-of-withdrawal requests, from the public form.
 *
 * Not behind requireCustomer, because withdrawal is a right a buyer has whether
 * or not they ever made an account — and the form is reachable from the footer
 * while signed out. Ownership is proved by knowing the order id AND the email
 * the order was placed with, which is the same pair the confirmation email
 * carries.
 *
 * Both routes answer a wrong id and a wrong email with the SAME message, so the
 * pair cannot be used to discover which order numbers exist.
 *
 * The whole flow used to be a fiction. The modal matched the order against a
 * list the browser had — empty for a signed-out visitor, so nothing ever
 * matched — then waited a second on a setTimeout, marked the order "Refunded"
 * in React state alone and rendered a receipt from a template. Nothing was
 * saved, nobody was told, and no money moved.
 */
const WITHDRAWAL_MISMATCH =
  "We could not find an order with that number and email address. Please check both against your order confirmation email.";

function findOrderForWithdrawal(orders: any[], orderId: string, email: string): any | null {
  const wantedId = String(orderId || "").trim().replace(/^#/, "").toLowerCase();
  const wantedEmail = String(email || "").trim().toLowerCase();
  if (!wantedId || !wantedEmail) return null;

  const order = orders.find((o: any) => String(o?.id || "").trim().toLowerCase() === wantedId);
  if (!order) return null;
  if (String(order.customerEmail || "").trim().toLowerCase() !== wantedEmail) return null;
  return order;
}

// POST /withdrawal/lookup - confirm the order and return what can be withdrawn
router.post("/withdrawal/lookup", async (req: Request, res: Response) => {
  try {
    const { orderId, email } = req.body || {};
    const orders: any[] = (await fetchResource("orders")) || [];
    const order = findOrderForWithdrawal(orders, orderId, email);
    if (!order) return res.status(404).json({ error: WITHDRAWAL_MISMATCH });

    // Only what the form needs to show. The full order record carries the
    // address, the gateway references and the payment detail, none of which
    // belongs in a response this lightly authenticated.
    return res.json({
      order: {
        id: order.id,
        customerName: order.customerName,
        date: order.date,
        total: order.total,
        alreadyRequested: Boolean(order.returnRequest),
        items: (Array.isArray(order.items) ? order.items : []).map((i: any) => ({
          productId: i?.productId,
          productTitle: i?.productTitle,
          price: Number(i?.price) || 0,
          quantity: Number(i?.quantity) || 1,
          image: i?.image || ""
        }))
      }
    });
  } catch (err: any) {
    console.error("[Orders Router] Withdrawal lookup error:", err);
    res.status(500).json({ error: "Could not check that order. Please try again." });
  }
});

// POST /withdrawal - record the request
router.post("/withdrawal", async (req: Request, res: Response) => {
  try {
    const { orderId, email, name, selectedItems, reason } = req.body || {};

    const orders: any[] = (await fetchResource("orders")) || [];
    const order = findOrderForWithdrawal(orders, orderId, email);
    if (!order) return res.status(404).json({ error: WITHDRAWAL_MISMATCH });

    const orderItems: any[] = Array.isArray(order.items) ? order.items : [];
    const wanted = Array.isArray(selectedItems) ? selectedItems.map(String) : [];
    const itemsToReturn = wanted.length
      ? orderItems.filter((i: any) => wanted.includes(String(i?.productId)))
      : orderItems;

    if (itemsToReturn.length === 0) {
      return res.status(400).json({ error: "Select at least one item to withdraw." });
    }

    const refundDue = Number(
      itemsToReturn.reduce((sum: number, i: any) => sum + (Number(i?.price) || 0) * (Number(i?.quantity) || 1), 0).toFixed(2)
    );

    const tags = Array.isArray(order.tags) ? [...order.tags] : [];
    if (!tags.includes("Withdrawal Requested")) tags.push("Withdrawal Requested");

    const updatedOrder = await saveSingleOrder({
      ...order,
      tags,
      // Deliberately NOT paymentStatus: 'Refunded'. This is a request; the money
      // moves when an administrator processes it through /:id/admin-action, and
      // showing an order as refunded before that told the customer and the shop
      // that they had been paid back when nothing had left the account.
      returnRequest: {
        type: "Withdrawal",
        reason: String(reason || "Consumer right of withdrawal").slice(0, 500),
        itemsToReturn,
        refundMethod: "original",
        status: "Pending",
        requestedAt: new Date().toISOString(),
        requestedBy: String(name || order.customerName || "").slice(0, 120),
        refundDue
      }
    });

    // Sent to the address ON THE ORDER, never to whatever was typed into the
    // form: matching one does not make the other a safe place to send details.
    try {
      const { sendOrderCancelledEmail } = await import("../services/emailService");
      await sendOrderCancelledEmail(
        updatedOrder,
        `Withdrawal requested for ${itemsToReturn.length} item(s), ₹${refundDue.toFixed(2)}. ` +
          `Our team will confirm your refund shortly.`
      );
    } catch (mailErr: any) {
      // The request is recorded either way; a failed email must not lose it.
      console.error(`[Orders Router] Withdrawal email failed for ${order.id}:`, mailErr?.message);
    }

    console.log(`[Orders Router] Withdrawal requested for ${order.id}: ${itemsToReturn.length} item(s), ₹${refundDue.toFixed(2)}.`);

    return res.json({
      success: true,
      orderId: order.id,
      itemCount: itemsToReturn.length,
      refundDue,
      message: "Your withdrawal request has been registered. We will email you once it is processed."
    });
  } catch (err: any) {
    console.error("[Orders Router] Withdrawal error:", err);
    res.status(500).json({ error: "Could not register the request. Please try again." });
  }
});

// POST /:id/admin-action - Admin Approve / Decline / Process Return, Refund, or Exchange
router.post("/:id/admin-action", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, refundAmount, reason } = req.body;

    const currentOrders: any[] = (await fetchResource("orders")) || [];
    const foundIdx = currentOrders.findIndex((o: any) => String(o.id) === String(id));

    if (foundIdx === -1) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = currentOrders[foundIdx];
    const amountToRefund = typeof refundAmount === "number" ? refundAmount : (order.total || 0);

    // Patch rather than mutate — see the note in the cancel route.
    const patch: any = { ...order };
    let runExchangeEmail = false;

    if (action === "approve_return" || action === "process_refund") {
      patch.paymentStatus = "Refunded";
      patch.refundAmount = amountToRefund;
      patch.refundReason = reason || "Refund processed by store administrator";
      if (order.returnRequest) {
        patch.returnRequest = {
          ...order.returnRequest,
          status: "Completed",
          processedAt: new Date().toISOString()
        };
      }

      // Execute the actual payment provider refund. If the gateway does not
      // accept it, nothing is saved and the admin sees why.
      if (order.paymentStatus === "Refunded") {
        return res.status(400).json({ error: "This order has already been refunded." });
      }
      if (amountToRefund > 0) {
        const { refundOrderPayment } = await import("../services/payments/checkout");
        let refundResult: any;
        try {
          refundResult = await refundOrderPayment(String(order.id), amountToRefund, reason || "Admin processed refund", (req as AdminRequest).admin?.email || "admin");
        } catch (refundErr: any) {
          return res.status(502).json({ error: refundErr?.message || "The refund could not be processed." });
        }
        if (!refundResult.ok) {
          return res.status(409).json({ error: refundResult.message, manual: true });
        }
        patch.refundDetails = {
          refundRef: refundResult.refundId,
          amount: refundResult.amount,
          reason: reason || "Admin processed refund",
          gatewayContacted: true,
          gatewayMessage: refundResult.message,
          refundedAt: new Date().toISOString()
        };
        if (!refundResult.fullyRefunded) patch.paymentStatus = "Partially Refunded";
      }
      // The refund email is emitted by the Paid -> Refunded transition in
      // saveSingleOrder; sending it here too duplicated it.

    } else if (action === "complete_exchange") {
      patch.fulfillmentStatus = "Exchanged";
      if (order.returnRequest) {
        patch.returnRequest = {
          ...order.returnRequest,
          status: "Completed",
          completedAt: new Date().toISOString()
        };
      }
      runExchangeEmail = true;

    } else if (action === "mark_delivered") {
      // Recorded by hand: no courier integration reports delivery yet, so a
      // human confirming it is the only source of this fact.
      //
      // Refused on a cancelled order — that is a contradiction, not a late
      // update. Already-Delivered is left to fall through: saveSingleOrder only
      // notifies on a real transition, so re-marking is a no-op rather than a
      // duplicate "your order was delivered" email.
      if (order.fulfillmentStatus === "Cancelled") {
        return res.status(409).json({
          error: "This order is cancelled and cannot be marked delivered."
        });
      }
      patch.fulfillmentStatus = "Delivered";
      patch.data = {
        ...(order.data || {}),
        deliveredAt: new Date().toISOString(),
        deliveredBy: "admin"
      };

    } else if (action === "decline_return") {
      if (order.returnRequest) {
        patch.returnRequest = {
          ...order.returnRequest,
          status: "Declined",
          declinedReason: reason || "Request declined by administrator"
        };
      }
    }

    const updatedOrder = await saveSingleOrder(patch);

    // 'Exchanged' is not one of the tracked lifecycle statuses, so this one
    // still has to be sent explicitly.
    if (runExchangeEmail) {
      const { sendOrderExchangedEmail } = await import("../services/emailService");
      sendOrderExchangedEmail(updatedOrder, "Exchange replacement item dispatched", reason || "Exchange approved")
        .catch(e => console.warn("Exchange email fail:", e));
    }
    res.json({ success: true, message: `Admin action '${action}' processed successfully.`, order: updatedOrder });
  } catch (err: any) {
    console.error("[Orders Router] Admin Action Error:", err);
    res.status(500).json({ error: err.message || "Failed to execute admin action" });
  }
});

// DELETE /:id - Permanently delete a single order
router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteSingleItem("orders", id);
    if (deleted) {
      return res.json({ success: true, deletedId: id });
    } else {
      return res.status(404).json({ error: "Order not found or could not be deleted" });
    }
  } catch (err: any) {
    console.error("[Orders Router] DELETE Error:", err);
    res.status(500).json({ error: err.message || "Failed to delete order" });
  }
});

export default router;
