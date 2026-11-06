import { Router, Request, Response } from "express";
import crypto from "crypto";

import { prisma } from "../../src/lib/prisma";
import { upsertSubscriptionRow } from "../../src/lib/subscriptionRow";
import { requireAdmin, requireCronOrAdmin, requireCustomer, mayActOnCustomer, AdminRequest } from "../middleware/requireAdmin";
import { getPlanCatalogue, findPlan } from "../services/planCatalogue";
import { repriceForPlan, clearedPendingFields } from "../services/subscriptionPricingService";
import { trackSubscriptionStarted } from "../services/klaviyoService";
import { fetchResource, saveResource } from "../../serverDb";
import {
  extractRecurringAuthorizationHref,
  extractSchemeReference,
  extractTokenHref,
  isUsableRecurringHref,
  isUsableTokenHref,
} from "../services/worldpaySubscription";
import {
  processDueSubscriptions,
  calculateNextBillingDate,
  normalizeBillingInterval
} from "../services/subscriptionCron";

const router = Router();

/**
 * Manual / Browser / Cron trigger to process all due renewals.
 * Supports both GET (for browser URL visits / cron pings) and POST.
 */
const handleProcessRenewals = async (_req: Request, res: Response) => {
  try {
    const result = await processDueSubscriptions();
    return res.json({
      success: true,
      message: `Processed ${result.processed} subscription(s): ${result.succeeded} succeeded, ${result.failed} failed.`,
      timestamp: new Date().toISOString(),
      ...result
    });
  } catch (error: any) {
    console.error("[Process Renewals Error]", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to process due subscriptions"
    });
  }
};

// These charge customer cards. All four were open to the internet, and the two
// /cron entries are what vercel.json calls hourly.
router.get("/process-renewals", requireCronOrAdmin, handleProcessRenewals);
router.post("/process-renewals", requireCronOrAdmin, handleProcessRenewals);
router.get("/cron", requireCronOrAdmin, handleProcessRenewals);
router.post("/cron", requireCronOrAdmin, handleProcessRenewals);

/**
 * Diagnostic endpoint: Returns all subscriptions, due renewals count, and worker status.
 */
/**
 * Whether Worldpay could actually be asked to charge this subscription again.
 *
 * Presence of a reference is not enough: subscriptions created before the
 * checkout requested a customer agreement carry manufactured values such as
 * "SCHEME-WP-CB-213847" and a /payments/recurring/wp-<id> URL that resolves to
 * nothing. Those are reported as unchargeable so they are not mistaken for live
 * recurring plans.
 */
function canChargeRecurring(sub: any): boolean {
  if (!sub) return false;
  const href = sub.worldpayRecurringHref || sub.recurringHref;
  // The token is the card. A plan can hold a scheme reference and still be
  // unchargeable without it, which is the state every subscription created
  // before the tokenCreated webhook was handled is in.
  //
  // A scheme reference alone is therefore NOT accepted here: it is the
  // agreement, not a payment instrument. The MIT authorization built from one
  // carries no paymentInstrument and Worldpay refuses it, so reporting such a
  // plan as chargeable only ever produced a failed charge.
  const token = sub.worldpayTokenHref || sub.tokenHref;
  return isUsableTokenHref(token) || isUsableRecurringHref(href);
}

/** Statuses that mean "this plan is still running and can bill". */
const LIVE_SUB_STATUSES = ["active", "subscribed", "paused", "trialing"];

/** A subscription the customer has removed from their account. Kept for admin history. */
const DELETED_SUB_STATUS = "deleted";

function isLiveStatus(status?: string): boolean {
  return LIVE_SUB_STATUSES.includes(String(status || "").toLowerCase());
}

function isDeletedStatus(status?: string): boolean {
  return String(status || "").toLowerCase() === DELETED_SUB_STATUS;
}

/**
 * Is this order part of the given subscription?
 *
 * When a specific subscription is being cancelled or resumed, only its own
 * orders should change. The customer-wide match is the fallback for records
 * written before orders carried a subscriptionId, and for the account-level
 * buttons that act on every plan at once.
 */
function orderBelongsToSubscription(order: any, subscription: any, allowUnlinked: boolean): boolean {
  if (!subscription) return false;
  const subId = String(subscription.id || "");
  if (!subId) return false;

  const orderSubId = String(
    order?.subscriptionId || order?.subscriptionDetails?.subscriptionId || order?.data?.subscriptionId || ""
  );
  if (orderSubId) return orderSubId === subId;
  if (String(subscription.sourceOrderId || "") === String(order?.id || "")) return true;

  // Orders written before checkout recorded a subscriptionId cannot be
  // attributed to one plan. They are still updated when the customer has only
  // one plan — there is nothing else they could belong to — and left alone
  // otherwise rather than guessing and clearing the wrong plan's cancellation.
  return allowUnlinked;
}

function isSubscriptionOrder(order: any): boolean {
  return Boolean(
    order?.isSubscription ||
      (Array.isArray(order?.tags) && order.tags.some((t: string) => t && t.toLowerCase().includes("subscription"))) ||
      (Array.isArray(order?.items) &&
        order.items.some((i: any) => i?.isSubscription || (i?.productTitle && i.productTitle.toLowerCase().includes("subscription"))))
  );
}

/**
 * Every subscription for one customer, merged from Prisma and the JSON store.
 *
 * Either store can be missing a record — Prisma writes are best-effort behind
 * try/catch throughout this file — so a decision like "does this customer still
 * have a live plan?" has to consider both.
 */
async function loadCustomerSubscriptions(email: string): Promise<any[]> {
  const clean = String(email || "").toLowerCase().trim();
  if (!clean) return [];
  const byId = new Map<string, any>();

  try {
    const rows = await prisma.subscription.findMany({ where: { customerEmail: clean } });
    for (const row of rows || []) byId.set(String(row.id), row);
  } catch (_e) {}

  try {
    const stored: any[] = (await fetchResource("subscriptions")) || [];
    for (const s of stored) {
      if (String(s?.customerEmail || "").toLowerCase().trim() !== clean) continue;
      const id = String(s.id || "");
      byId.set(id, { ...(byId.get(id) || {}), ...s });
    }
  } catch (_e) {}

  return Array.from(byId.values());
}

/**
 * One subscription by id, from both stores.
 *
 * The JSON row is spread first so Prisma's columns win, while keys that live
 * only in the JSON store — the pending-price fields — survive. Same precedence
 * as the renewal worker's loader, so both see the same record.
 */
async function loadSubscriptionById(id: string): Promise<any | null> {
  const clean = String(id || "").trim();
  if (!clean) return null;

  let prismaRow: any = null;
  try {
    prismaRow = await prisma.subscription.findUnique({ where: { id: clean } });
  } catch (_e) {}

  let storedRow: any = null;
  try {
    const stored: any[] = (await fetchResource("subscriptions")) || [];
    storedRow = stored.find((s: any) => String(s?.id) === clean) || null;
  } catch (_e) {}

  if (!prismaRow && !storedRow) return null;
  return { ...(storedRow || {}), ...(prismaRow || {}) };
}

/**
 * Does the customer still have a plan that bills, ignoring the one being changed?
 *
 * The account-level "Cancelled" flag drives the storefront banner and the admin
 * customer record, so cancelling one of three plans must not mark the whole
 * account cancelled.
 */
async function customerHasOtherLiveSubscription(email: string, excludeId?: string | null): Promise<boolean> {
  const subs = await loadCustomerSubscriptions(email);
  return subs.some(s => (excludeId ? String(s.id) !== String(excludeId) : true) && isLiveStatus(s.status));
}

/**
 * The customer-facing shape of a subscription. Deliberately omits the Worldpay
 * mandate references — the account page only needs to know whether a recurring
 * charge is possible, not the credential that authorises it.
 */
function toCustomerSubscription(s: any, now: Date = new Date()) {
  return {
    id: s.id,
    // The order the plan was bought on. The account page shows it so a customer
    // can quote one reference to support for both the plan and its first
    // payment. Records written before checkout recorded it have none, and the
    // account page falls back to the customer's own order history there.
    sourceOrderId: s.sourceOrderId || null,
    planId: s.planId,
    planName: s.planName,
    customerEmail: s.customerEmail,
    customerName: s.customerName,
    amount: s.amount,
    currency: s.currency || "GBP",
    status: s.status,
    billingInterval: s.billingInterval,
    nextBillingDate: s.nextBillingDate,
    isDue: Boolean(s.nextBillingDate && new Date(s.nextBillingDate) <= now),
    cansCount: s.cansCount,
    items: s.items,
    itemPrice: s.itemPrice,
    shippingCost: s.shippingCost,
    deliveryMethod: s.deliveryMethod,
    lastPaymentStatus: s.lastPaymentStatus,
    lastPaymentAt: s.lastPaymentAt,
    cancelledAt: s.cancelledAt,
    cancellationReason: s.cancellationReason,
    reactivatedAt: s.reactivatedAt,
    createdAt: s.createdAt,
    canChargeRecurring: canChargeRecurring(s),
    // Resuming a plan whose mandate was never issued would look successful and
    // then fail silently at the next renewal, so the account page says so up front.
    credentialIssue: canChargeRecurring(s)
      ? null
      : "This plan has no stored-card mandate with Worldpay, so it cannot take a recurring payment. Subscribe again to set one up."
  };
}

router.get("/status", requireAdmin, async (_req: Request, res: Response) => {
  try {
    let subscriptions: any[] = [];
    try {
      subscriptions = await prisma.subscription.findMany({
        orderBy: { createdAt: "desc" }
      });
    } catch (_e) {}

    if (!subscriptions || subscriptions.length === 0) {
      try {
        subscriptions = (await fetchResource("subscriptions")) || [];
      } catch (_e) {}
    }

    const now = new Date();
    const active = subscriptions.filter((s: any) => s.status === "active");
    const due = active.filter((s: any) => !s.nextBillingDate || new Date(s.nextBillingDate) <= now);

    return res.json({
      success: true,
      workerStatus: "running",
      interval: "5 minutes",
      totalCount: subscriptions.length,
      activeCount: active.length,
      dueNowCount: due.length,
      timestamp: now.toISOString(),
      subscriptions: subscriptions.map((s: any) => ({
        id: s.id,
        customerName: s.customerName,
        customerEmail: s.customerEmail,
        planName: s.planName,
        amount: s.amount,
        currency: s.currency || "GBP",
        status: s.status,
        billingInterval: s.billingInterval,
        nextBillingDate: s.nextBillingDate,
        isDue: !s.nextBillingDate || new Date(s.nextBillingDate) <= now,
        lastPaymentStatus: s.lastPaymentStatus,
        lastPaymentAt: s.lastPaymentAt,
        worldpayTransactionId: s.worldpayTransactionId,
        // A stored value is not the same as a usable mandate. Earlier builds wrote
        // locally manufactured references that look present but authorise nothing,
        // so reporting mere presence here showed dead subscriptions as healthy.
        hasRecurringToken: canChargeRecurring(s),
        canChargeRecurring: canChargeRecurring(s),
        credentialIssue: canChargeRecurring(s)
          ? null
          : "No Worldpay stored-card mandate. This subscription cannot take a recurring payment; the customer must subscribe again so Worldpay issues one."
      }))
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch subscription status"
    });
  }
});

/**
 * Update billing interval or next billing date for a subscription.
 */
// `chargeImmediately` backdates the next billing date so the worker charges on
// its next pass, so this endpoint can take money. It was unauthenticated.
router.post("/update-schedule", requireCustomer, async (req: AdminRequest, res: Response) => {
  try {
    const { subscriptionId, customerEmail, billingInterval, nextBillingDate, chargeImmediately } = req.body;

    if (!subscriptionId && !customerEmail) {
      return res.status(400).json({ success: false, message: "subscriptionId or customerEmail is required" });
    }

    // Checked against the subscription's own owner, not the email in the body.
    if (subscriptionId) {
      const owner = await loadSubscriptionById(String(subscriptionId));
      if (!owner || !mayActOnCustomer(req, owner.customerEmail)) {
        return res.status(404).json({ success: false, message: "Subscription not found" });
      }
    } else if (!mayActOnCustomer(req, customerEmail)) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    const emailClean = customerEmail ? String(customerEmail).toLowerCase().trim() : null;
    let targetNextDate: Date | null = null;
    if (chargeImmediately) {
      targetNextDate = new Date(Date.now() - 1000); // 1 sec in the past to trigger immediately
    } else if (nextBillingDate) {
      targetNextDate = new Date(nextBillingDate);
    }

    const updateFields: any = {};
    if (billingInterval) updateFields.billingInterval = normalizeBillingInterval(billingInterval);
    if (targetNextDate) updateFields.nextBillingDate = targetNextDate;

    if (subscriptionId) {
      try {
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: updateFields
        });
      } catch (_e) {}
    }

    try {
      const stored: any[] = (await fetchResource("subscriptions")) || [];
      const updatedList = stored.map((s: any) => {
        const match = (subscriptionId && String(s.id) === String(subscriptionId)) ||
          (emailClean && String(s.customerEmail || "").toLowerCase().trim() === emailClean);
        if (match) {
          return { ...s, ...updateFields };
        }
        return s;
      });
      await saveResource("subscriptions", updatedList);
    } catch (_e) {}

    return res.json({
      success: true,
      message: "Subscription schedule updated successfully",
      updatedFields: updateFields
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update schedule"
    });
  }
});

/**
 * Update one subscription plan — its tier, price, frequency, box contents or
 * status — at the customer's request.
 *
 * Three rules this endpoint used to break, each of which rewrote real data:
 *
 * - It never touches orders. An order is the record of what the customer
 *   bought and paid for. This endpoint used to rewrite the plan name, box
 *   contents, line price and total of EVERY subscription order the customer had
 *   ever placed, so switching tier (or anything that triggered this call)
 *   turned a paid LITE order into a PRO one in the admin. A plan change affects
 *   future renewals only; the renewal worker builds those from the plan.
 *
 * - It only writes the fields the caller sent. Missing fields used to be filled
 *   with defaults — "Custom Box", £0, an empty box, "active" — so a request that
 *   only meant to change the status wiped the rest of the plan.
 *
 * - It never creates a plan. An id that matches nothing used to be inserted as
 *   a brand-new subscription, which is how stray plans appeared on accounts.
 */
// Changes a plan and, with it, what the customer's card is charged from their
// next renewal. It was reachable by anyone: a subscription id was enough to move
// somebody else onto a different plan and price.
router.post("/update-plan", requireCustomer, async (req: AdminRequest, res: Response) => {
  try {
    const {
      subscriptionId,
      customerEmail,
      planId,
      planName,
      subPlan,
      amount,
      subPrice,
      billingInterval,
      subFrequency,
      subCansCount,
      cansCount,
      items,
      subItems,
      status,
      subStatus,
      nextPayment,
      nextDelivery,
      nextBillingDate
    } = req.body;

    if (!customerEmail && !subscriptionId) {
      return res.status(400).json({ success: false, message: "customerEmail or subscriptionId is required" });
    }

    const emailClean = customerEmail ? String(customerEmail).toLowerCase().trim() : null;
    const given = (v: any) => v !== undefined && v !== null && String(v).trim() !== "";

    // Which plan is being changed. Named by id, or — only when the customer
    // holds exactly one plan — by email. With several plans an unnamed request
    // is refused: there is no telling which plan the customer meant, and
    // guessing is how one plan's settings ended up on another.
    const ownPlans = emailClean
      ? (await loadCustomerSubscriptions(emailClean)).filter(s => !isDeletedStatus(s.status))
      : [];
    let targetId = subscriptionId ? String(subscriptionId) : null;
    if (!targetId) {
      if (ownPlans.length !== 1) {
        return res.status(400).json({
          success: false,
          message: ownPlans.length === 0
            ? "No subscription found for this customer."
            : "subscriptionId is required: this customer has more than one plan."
        });
      }
      targetId = String(ownPlans[0].id);
    }

    // Fields the caller actually sent, and nothing else. `planName` is the
    // plan's real name; `subPlan` is only a tier slug ("pro"), so it is used for
    // the name only as a last resort.
    const itemsIn = Array.isArray(subItems) ? subItems : Array.isArray(items) ? items : undefined;
    const amountIn = given(subPrice) ? Number(subPrice) : given(amount) ? Number(amount) : undefined;
    const cansIn = given(subCansCount)
      ? Number(subCansCount)
      : given(cansCount)
        ? Number(cansCount)
        : itemsIn
          ? itemsIn.reduce((sum: number, it: any) => sum + (Number(it?.quantity) || 1), 0)
          : undefined;

    // The record as it stands, needed to reprice against the customer's own
    // extras, rhythm and agreed shipping rather than a bare plan price.
    const existing: any =
      ownPlans.find((s: any) => String(s.id) === String(targetId)) ||
      (await loadSubscriptionById(String(targetId)));

    // Ownership is judged on the record, never on the email in the body.
    if (!existing || !mayActOnCustomer(req, existing.customerEmail)) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    const patch: Record<string, any> = {};
    if (given(planName)) patch.planName = String(planName);
    else if (given(subPlan)) patch.planName = String(subPlan);
    if (given(planId)) patch.planId = String(planId);
    else if (given(subPlan)) patch.planId = String(subPlan).toLowerCase().split(" ")[0];

    // Stored in canonical form so the renewal worker schedules what was picked.
    // Resolved BEFORE the amount, because the rhythm sets the discount.
    if (given(subFrequency) || given(billingInterval)) {
      patch.billingInterval = normalizeBillingInterval(subFrequency || billingInterval);
    }
    if (itemsIn) patch.items = itemsIn;
    if (cansIn !== undefined && Number.isFinite(cansIn)) patch.cansCount = cansIn;

    // The recurring amount is computed HERE, from the admin plan catalogue —
    // never taken from the request.
    //
    // The account portal sends a price out of a hard-coded table, with no
    // frequency discount and no shipping, so a customer who switched plans was
    // put on an amount the shop never quoted and which ignored whatever the
    // admin had set in Pages. The client's `amount`/`subPrice` is now only a
    // fallback for a subscription whose plan cannot be resolved at all.
    const targetPlanRef = given(planId)
      ? String(planId)
      : given(subPlan)
        ? String(subPlan)
        : given(planName)
          ? String(planName)
          : "";

    let resolvedPlan: ReturnType<typeof findPlan> = null;
    if (targetPlanRef && existing) {
      resolvedPlan = findPlan(await getPlanCatalogue(), targetPlanRef);
    }

    if (resolvedPlan && existing) {
      // Priced against the subscription as it will be AFTER this change: a new
      // can count or rhythm in the same request has to count, or the amount
      // would describe the plan they just left.
      const projected = {
        ...existing,
        cansCount: patch.cansCount !== undefined ? patch.cansCount : existing.cansCount,
        billingInterval: patch.billingInterval || existing.billingInterval
      };
      patch.amount = repriceForPlan(projected, resolvedPlan);
      patch.planName = resolvedPlan.name;
      patch.planId = resolvedPlan.slug;

      // The customer chose this, so it applies from their next renewal with no
      // notice period, and any price change an admin had scheduled for their
      // old plan is now moot.
      Object.assign(patch, clearedPendingFields());
    } else if (amountIn !== undefined && Number.isFinite(amountIn) && amountIn > 0) {
      // A price of zero is never a real plan price; it is what a missing field
      // used to turn into, and writing it would make the next renewal free.
      patch.amount = amountIn;
    }
    if (given(subStatus) || given(status)) patch.status = String(subStatus || status).toLowerCase();
    if (given(nextBillingDate)) patch.nextBillingDate = new Date(nextBillingDate);

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ success: false, message: "Nothing to update." });
    }

    // 1. The file store — the source the account page reads.
    let updatedPlan: any = null;
    try {
      const storedSubs: any[] = (await fetchResource("subscriptions")) || [];
      const updatedSubs = storedSubs.map((s: any) => {
        if (String(s.id) !== targetId) return s;
        // A customer may only change their own plan.
        if (emailClean && String(s.customerEmail || "").toLowerCase().trim() !== emailClean) return s;
        updatedPlan = {
          ...s,
          ...patch,
          ...(patch.nextBillingDate ? { nextBillingDate: patch.nextBillingDate.toISOString() } : {}),
          updatedAt: new Date().toISOString()
        };
        return updatedPlan;
      });
      if (updatedPlan) await saveResource("subscriptions", updatedSubs);
    } catch (_e) {}

    // 2. Postgres, when the plan lives there.
    try {
      const existing = await prisma.subscription.findUnique({ where: { id: targetId } });
      if (existing && (!emailClean || String(existing.customerEmail || "").toLowerCase().trim() === emailClean)) {
        const row = await prisma.subscription.update({ where: { id: targetId }, data: patch });
        updatedPlan = updatedPlan || row;
      }
    } catch (_e) {}

    if (!updatedPlan) {
      return res.status(404).json({ success: false, message: "Subscription plan not found for this customer." });
    }

    // 3. The customer profile mirrors a plan's settings for the storefront. Only
    //    what changed is copied across, and the account-level status says
    //    "cancelled" only when no plan at all is left running.
    if (emailClean) {
      const liveStatuses = ["active", "subscribed", "paused"];
      const planStatus = String(updatedPlan.status || "").toLowerCase();
      const anotherLive = await customerHasOtherLiveSubscription(emailClean, targetId);
      const profileStatus = patch.status === undefined
        ? undefined
        : liveStatuses.includes(planStatus)
          ? (planStatus === "paused" && !anotherLive ? "Paused" : "Active")
          : (anotherLive ? "Active" : "Cancelled");

      const profilePatch: Record<string, any> = {
        ...(patch.planName !== undefined ? { subPlan: patch.planName } : {}),
        ...(patch.amount !== undefined ? { subPrice: patch.amount } : {}),
        ...(patch.billingInterval !== undefined ? { subFrequency: patch.billingInterval } : {}),
        ...(patch.cansCount !== undefined ? { subCansCount: patch.cansCount } : {}),
        ...(profileStatus
          ? {
              subStatus: profileStatus,
              subscriptionStatus: profileStatus === "Active" ? "Subscribed" : profileStatus === "Paused" ? "Paused" : "Not subscribed"
            }
          : {}),
        ...(given(nextPayment) ? { nextPayment } : {}),
        ...(given(nextDelivery) ? { nextDelivery } : {})
      };

      if (Object.keys(profilePatch).length > 0 || patch.items) {
        try {
          const storedCustomers: any[] = (await fetchResource("customers")) || [];
          let changed = false;
          const updatedCustList = storedCustomers.map((c: any) => {
            if (String(c.email || "").toLowerCase().trim() !== emailClean) return c;
            changed = true;
            return {
              ...c,
              ...profilePatch,
              ...(patch.items ? { subItems: patch.items } : {}),
              data: { ...(c.data || {}), ...profilePatch, ...(patch.items ? { subItems: patch.items } : {}) }
            };
          });
          if (changed) await saveResource("customers", updatedCustList);
        } catch (_e) {}

        try {
          if (Object.keys(profilePatch).length > 0) {
            await prisma.customer.updateMany({ where: { email: emailClean }, data: profilePatch });
          }
        } catch (_prErr) {}
      }
    }

    console.log(
      `[Subscription Plan Update] ${targetId} updated for ${emailClean || "unknown"}: ${Object.keys(patch).join(", ")}`
    );

    return res.json({
      success: true,
      message: "Subscription plan updated.",
      plan: toCustomerSubscription(updatedPlan)
    });
  } catch (error: any) {
    console.error("[Subscription Plan Update] Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update subscription plan"
    });
  }
});

/**
 * Create subscription record after the FIRST successful payment.
 */
router.post(
  "/create",
  async (req: Request, res: Response) => {
    try {
      const {
        customerId,
        customerName,
        customerEmail,
        planId,
        planName,
        amount,
        shippingCost,
        shippingFee,
        shippingAddress,
        deliveryMethod,
        items,
        currency = "GBP",
        billingInterval = "month",
        worldpayResponse,
        sourceOrderId,
      } = req.body;

      if (!customerEmail) {
        return res.status(400).json({
          success: false,
          message: "customerEmail is required",
        });
      }

      if (!planId) {
        return res.status(400).json({
          success: false,
          message: "planId is required",
        });
      }

      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid subscription amount is required",
        });
      }

      // Only Worldpay can issue a stored-credential reference. Substituting a
      // locally generated "mock-" URL made the subscription look chargeable
      // while every renewal actually hit a non-existent endpoint.
      const recurringHref = extractRecurringAuthorizationHref(worldpayResponse);
      const schemeReference = extractSchemeReference(worldpayResponse);
      // Usually absent here: Worldpay delivers the stored-card token on its own
      // tokenCreated webhook, which the webhook route attaches when it lands.
      const tokenHref = extractTokenHref(worldpayResponse);

      const transactionId =
        worldpayResponse?.id || worldpayResponse?.transactionReference || null;

      if (!recurringHref && !schemeReference) {
        console.warn(
          `[Subscription Create] No Worldpay stored credential in the supplied gateway response for ${customerEmail}. ` +
            `Renewals for this subscription will fail until a scheme transaction reference is recorded.`
        );
      }

      // Shared normaliser — the previous exact-string comparisons silently fell
      // through to monthly for any casing or wording they did not list.
      const normalizedInterval = normalizeBillingInterval(billingInterval);
      const nextBillingDate = calculateNextBillingDate(normalizedInterval, new Date());

      const emailClean = String(customerEmail).toLowerCase().trim();
      const subId = `sub_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

      const effectiveShipping = typeof shippingFee === 'number'
        ? shippingFee
        : (typeof shippingCost === 'number' ? shippingCost : (Number(amount) >= 40 ? 0 : 2.99));

      const subData = {
        id: subId,
        customerId: customerId || null,
        customerEmail: emailClean,
        customerName: customerName || "Valued Customer",
        planId,
        planName: planName || "Nicotine Pouch Subscription Plan",
        amount: Number(amount),
        shippingFee: effectiveShipping,
        shippingCost: effectiveShipping,
        shippingAmount: effectiveShipping,
        shippingAddress: shippingAddress || 'United Kingdom',
        deliveryMethod: deliveryMethod || 'Royal Mail Tracked 24/48',
        items: Array.isArray(items) ? items : undefined,
        currency,
        status: "active",
        billingInterval: normalizedInterval,
        nextBillingDate,
        worldpayTransactionId: transactionId,
        worldpayTokenHref: tokenHref || null,
        worldpayRecurringHref: recurringHref,
        worldpaySchemeReference: schemeReference,
        lastPaymentStatus: "authorized",
        lastPaymentId: transactionId,
        lastPaymentAt: new Date(),
        // The order this plan was bought with. Every lookup that ties a
        // subscription to its order matches on this — including the repair
        // sweep's duplicate guard — so a row without it is invisible to that
        // guard, and the sweep creates another subscription for the same order
        // on every run. That is how one order ended up with five active plans.
        sourceOrderId: sourceOrderId ? String(sourceOrderId) : null,
      };

      let subscription: any = null;

      // Written through the shared row builder rather than prisma.create: this
      // payload carries shippingFee/shippingAmount, which are not columns, so a
      // direct create threw `Unknown argument` and the catch below swallowed it
      // — leaving the plan in the JSON blob and never in the table the renewal
      // cron actually bills from.
      const written = await upsertSubscriptionRow(subData);
      if (written) {
        subscription = await prisma.subscription
          .findUnique({ where: { id: subId } })
          .catch(() => null);
      }
      if (!subscription) {
        console.warn(`[Subscription Create] Neon write unavailable for ${subId}; serving the store copy.`);
        subscription = subData;
      }

      // Sync to StoreResource for persistence redundancy
      try {
        const existing: any[] = (await fetchResource("subscriptions")) || [];
        existing.unshift(subscription);
        await saveResource("subscriptions", existing.slice(0, 500));
      } catch (_e) {}

      // Update customer subscription status
      try {
        const customers: any[] = (await fetchResource("customers")) || [];
        const foundCust = customers.find((c: any) => c.email.toLowerCase() === emailClean);
        if (foundCust) {
          foundCust.subscriptionStatus = "Active Subscriber";
          foundCust.subStatus = "active";
          foundCust.subPlan = planName || planId;
          foundCust.subPrice = Number(amount);
          foundCust.nextPayment = nextBillingDate.toISOString().split("T")[0];
          await saveResource("customers", customers);
        }
      } catch (_e) {}

      // Trigger for the "Subscription confirmation" flow. Not awaited: the
      // subscription is already saved and the client should not wait on Klaviyo.
      trackSubscriptionStarted(subData, sourceOrderId ? { id: String(sourceOrderId), customerEmail: emailClean, customerName } : undefined)
        .catch((e: any) => console.warn(`[Klaviyo] Started Subscription failed for ${subId}:`, e?.message || e));

      return res.status(201).json({
        success: true,
        subscription,
      });
    } catch (error: any) {
      console.error("[Subscription Create]", error);

      return res.status(500).json({
        success: false,
        message: error.message || "Failed to create subscription",
      });
    }
  }
);

/**
 * There is deliberately NO endpoint for charging a subscription on demand.
 *
 * `POST /api/subscriptions/charge` used to take the stored card immediately for
 * any subscription id, whether or not anything was due. It was the one charge
 * path with none of the protections the renewal worker has:
 *
 *   - it minted a RANDOM order id, so the charge was anchored to no billing
 *     period and `renewalOrderExists` could never recognise it as a repeat;
 *   - it ran no duplicate check at all, so calling it twice took the money
 *     twice, and calling it on the day a renewal ran took it a second time;
 *   - it advanced `nextBillingDate` before writing the order, and the order
 *     write was wrapped in an empty catch — so a failure there left the card
 *     charged, the schedule moved on and NO order to show for the money.
 *
 * Recurring money is now only ever taken by the renewal worker, from the
 * subscription's own due date: see `processDueSubscriptions`. Its order id is
 * derived from the billing period, so every retry of a period produces the same
 * id and the same Worldpay reference, the order is checked for existence before
 * the gateway is called, and Worldpay refuses a reference it has already seen.
 *
 * To bill a plan early, move its `nextBillingDate` and let the worker take it.
 */

/**
 * Cancel subscription.
 */
router.post(
  "/cancel",
  async (req: Request, res: Response) => {
    try {
      const { subscriptionId, customerEmail, reason } = req.body;

      if (!subscriptionId && !customerEmail) {
        return res.status(400).json({
          success: false,
          message: "subscriptionId or customerEmail is required",
        });
      }

      const emailClean = customerEmail ? String(customerEmail).toLowerCase().trim() : null;
      const cancellationTime = new Date().toISOString();
      const cancelReason = reason || "Customer cancelled subscription plan via Account portal";

      let subscription: any = null;

      // Whether the cancellation actually reached each store. Both writes used
      // to be swallowed, so a cancellation that saved nowhere still answered
      // "success" to the customer — and a cancellation that saved to only one
      // store left the renewal worker reading the other one's stale "active"
      // and charging the card again. Tracked so neither can pass silently.
      let prismaCancelled = false;
      let storeCancelled = false;

      // 1. Update in Prisma if subscriptionId is provided
      if (subscriptionId) {
        try {
          subscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
              status: "cancelled",
              // Written here too, not just to the JSON store: these are real
              // columns, and leaving them null made the typed row look like a
              // plan that had never been cancelled at all.
              cancelledAt: new Date(cancellationTime),
              cancellationReason: cancelReason
            },
          });
          prismaCancelled = true;
        } catch (err: any) {
          console.error(
            `[Subscription Cancel] Neon write FAILED for ${subscriptionId}: ${err?.message}. ` +
              `The JSON store write below is now the only record of this cancellation.`
          );
        }
      }

      // 2. Update in StoreResource('subscriptions')
      try {
        const stored: any[] = (await fetchResource("subscriptions")) || [];
        let modified = false;
        const updatedList = stored.map((s: any) => {
          // A named plan is the only one cancelled. Falling through to the email
          // as well cancelled every plan the customer held, so cancelling one of
          // three stopped all three. The email is the match only when no plan is
          // named — that is what the account-level button means.
          const match = subscriptionId
            ? String(s.id) === String(subscriptionId)
            : Boolean(emailClean && String(s.customerEmail || "").toLowerCase().trim() === emailClean);
          if (match) {
            modified = true;
            return {
              ...s,
              status: "cancelled",
              cancelledAt: cancellationTime,
              cancellationReason: cancelReason
            };
          }
          return s;
        });

        if (modified) {
          await saveResource("subscriptions", updatedList);
          storeCancelled = true;
          // Reports back the plan that was actually changed, using the same
          // rule the update above applied.
          subscription = updatedList.find((s: any) =>
            subscriptionId
              ? String(s.id) === String(subscriptionId)
              : Boolean(emailClean && String(s.customerEmail || "").toLowerCase().trim() === emailClean)
          ) || subscription;
        }
      } catch (err: any) {
        console.error(
          `[Subscription Cancel] Store write FAILED for ${subscriptionId || emailClean}: ${err?.message}`
        );
      }

      // Nothing recorded it anywhere. Telling a customer their plan is cancelled
      // while the card is still on a billing schedule is the one outcome this
      // route must never produce.
      if (!prismaCancelled && !storeCancelled) {
        console.error(
          `[Subscription Cancel] NOTHING was cancelled for ${subscriptionId || emailClean}. ` +
            `The plan is still live and will be charged again.`
        );
        return res.status(500).json({
          success: false,
          message:
            "The cancellation could not be saved, so the plan is still active. " +
            "Please try again — if it keeps failing, contact support before your next billing date."
        });
      }

      if (!prismaCancelled || !storeCancelled) {
        // One store has it, the other does not. The renewal worker now treats the
        // non-chargeable status as the winner (see effectiveSubscriptionStatus),
        // so the customer is safe — but the records disagree and want repairing.
        console.warn(
          `[Subscription Cancel] Partial write for ${subscriptionId || emailClean}: ` +
            `Neon=${prismaCancelled ? "cancelled" : "NOT updated"}, ` +
            `store=${storeCancelled ? "cancelled" : "NOT updated"}. ` +
            `No further charge will be taken, but the two stores disagree.`
        );
      }

      // 3. Update Customer Record in StoreResource('customers')
      let matchedEmail = emailClean || (subscription?.customerEmail ? String(subscription.customerEmail).toLowerCase().trim() : null);

      // Cancelling one of several plans must not mark the whole account
      // cancelled — the storefront banner and the admin customer record both
      // read this flag.
      const stillSubscribed = matchedEmail
        ? await customerHasOtherLiveSubscription(matchedEmail, subscriptionId || subscription?.id)
        : false;

      if (matchedEmail && !stillSubscribed) {
        try {
          const customers: any[] = (await fetchResource("customers")) || [];
          let custModified = false;
          const updatedCustomers = customers.map((c: any) => {
            if (String(c.email || "").toLowerCase().trim() === matchedEmail) {
              custModified = true;
              return {
                ...c,
                subscriptionStatus: "Cancelled",
                subStatus: "Cancelled",
                isSubscriptionCancelled: true,
                subscriptionCancelledAt: cancellationTime,
                subscriptionCancellationReason: cancelReason
              };
            }
            return c;
          });

          if (custModified) {
            await saveResource("customers", updatedCustomers);
          }
        } catch (custErr) {
          console.warn("[Subscription Cancel] Failed to update customer:", custErr);
        }
      }

      if (matchedEmail) {
        // Orders written before checkout recorded a subscriptionId can only be
        // attributed to a plan when the customer holds a single one.
        const singlePlanCustomer = (await loadCustomerSubscriptions(matchedEmail)).length <= 1;

        // 4. Update Matching Orders in StoreResource('orders') so Admin Dashboard Orders Tab immediately highlights the cancellation!
        try {
          const orders: any[] = (await fetchResource("orders")) || [];
          let ordersModified = false;
          const updatedOrders = orders.map((o: any) => {
            const isCustOrder = String(o.customerEmail || "").toLowerCase().trim() === matchedEmail;
            const isSub = isSubscriptionOrder(o);
            // With a specific plan named, only its own orders are marked. Without
            // one the customer cancelled everything, so every subscription order
            // is fair game — that is what the account-level button means.
            const inScope = subscriptionId
              ? orderBelongsToSubscription(o, subscription || { id: subscriptionId }, singlePlanCustomer)
              : true;

            if (isCustOrder && isSub && inScope) {
              ordersModified = true;
              const tags = Array.isArray(o.tags) ? [...o.tags] : ["Storefront", "Online Order"];
              if (!tags.includes("Subscription Cancelled")) {
                tags.push("Subscription Cancelled");
              }

              const subDetails = o.subscriptionDetails ? { ...o.subscriptionDetails } : {};
              subDetails.status = "Cancelled";
              subDetails.isCancelled = true;
              subDetails.cancelledAt = cancellationTime;
              subDetails.cancellationReason = cancelReason;

              return {
                ...o,
                tags,
                subscriptionCancelled: true,
                subscriptionCancelledAt: cancellationTime,
                subscriptionCancellationReason: cancelReason,
                subscriptionDetails: subDetails
              };
            }
            return o;
          });

          if (ordersModified) {
            await saveResource("orders", updatedOrders);
            console.log(`[Subscription Cancel] Updated matching orders for customer: ${matchedEmail}`);
          }
        } catch (orderErr) {
          console.warn("[Subscription Cancel] Failed to update orders:", orderErr);
        }
      }

      return res.json({
        success: true,
        message: "Subscription successfully cancelled.",
        accountStillSubscribed: stillSubscribed,
        subscription: subscription || { status: "cancelled", cancelledAt: cancellationTime, cancellationReason: cancelReason }
      });
    } catch (error: any) {
      console.error("[Subscription Cancel Error]", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to cancel subscription",
      });
    }
  }
);

/**
 * Reactivate subscription.
 */
router.post(
  "/reactivate",
  async (req: Request, res: Response) => {
    try {
      const { subscriptionId, customerEmail } = req.body;

      if (!subscriptionId && !customerEmail) {
        return res.status(400).json({
          success: false,
          message: "subscriptionId or customerEmail is required",
        });
      }

      const emailClean = customerEmail ? String(customerEmail).toLowerCase().trim() : null;
      const now = new Date();
      let subscription: any = null;

      /**
       * A plan cancelled in March and resumed in September still carries March's
       * nextBillingDate. The renewal worker treats any date in the past as due,
       * so resuming would charge the customer within minutes — for a delivery
       * period they spent unsubscribed. Resuming therefore restarts the clock
       * from today; a date still in the future is left alone so a resume during
       * the paid period does not push the next box back.
       */
      const resumeBillingDate = (sub: any): Date => {
        const raw = sub?.nextBillingDate ? new Date(sub.nextBillingDate) : null;
        if (raw && !isNaN(raw.getTime()) && raw > now) return raw;
        return calculateNextBillingDate(normalizeBillingInterval(sub?.billingInterval), now);
      };

      // A subscription the customer deleted from their account is not resumable
      // by the account-wide button — it is only brought back by name.
      const resumableFromStore = async (): Promise<any[]> => {
        try {
          const stored: any[] = (await fetchResource("subscriptions")) || [];
          return stored.filter((s: any) => {
            const matchId = subscriptionId && String(s.id) === String(subscriptionId);
            const matchEmail = emailClean && String(s.customerEmail || "").toLowerCase().trim() === emailClean;
            if (!matchId && !matchEmail) return false;
            return matchId ? true : !isDeletedStatus(s.status);
          });
        } catch (_e) {
          return [];
        }
      };

      if (subscriptionId) {
        try {
          const existing = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
          subscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
              status: "active",
              nextBillingDate: resumeBillingDate(existing || (await resumableFromStore())[0]),
              cancelledAt: null,
              cancellationReason: null,
            },
          });
        } catch (_e) {}
      } else if (emailClean) {
        try {
          const existing = await prisma.subscription.findMany({
            where: { customerEmail: emailClean, status: { not: DELETED_SUB_STATUS } },
          });
          // Each plan keeps its own schedule, so they are re-anchored one by one
          // rather than with a single updateMany.
          for (const row of existing || []) {
            await prisma.subscription.update({
              where: { id: row.id },
              data: {
                status: "active",
                nextBillingDate: resumeBillingDate(row),
                cancelledAt: null,
                cancellationReason: null,
              },
            });
          }
          subscription = await prisma.subscription.findFirst({
            where: { customerEmail: emailClean, status: { not: DELETED_SUB_STATUS } },
            orderBy: { createdAt: "desc" },
          });
        } catch (_e) {}
      }

      try {
        const stored: any[] = (await fetchResource("subscriptions")) || [];
        let modified = false;
        const updatedList = stored.map((s: any) => {
          // A named plan is the only one resumed; without one, every plan the
          // customer holds is. Matching the email as well as the id meant
          // resuming one of three plans quietly restarted all three.
          // Without an explicit id, a deleted plan stays deleted.
          const match = subscriptionId
            ? String(s.id) === String(subscriptionId)
            : Boolean(emailClean && String(s.customerEmail || "").toLowerCase().trim() === emailClean && !isDeletedStatus(s.status));
          if (match) {
            modified = true;
            const { cancelledAt, cancellationReason, deletedAt, ...rest } = s;
            return {
              ...rest,
              status: "active",
              nextBillingDate: resumeBillingDate(s).toISOString(),
              reactivatedAt: now.toISOString()
            };
          }
          return s;
        });

        if (modified) {
          await saveResource("subscriptions", updatedList);
          // Reports back the plan that was actually changed, using the same
          // rule the update above applied.
          subscription = updatedList.find((s: any) =>
            subscriptionId
              ? String(s.id) === String(subscriptionId)
              : Boolean(emailClean && String(s.customerEmail || "").toLowerCase().trim() === emailClean)
          ) || subscription;
        }
      } catch (_e) {}

      let matchedEmail = emailClean || (subscription?.customerEmail ? String(subscription.customerEmail).toLowerCase().trim() : null);
      // Same rule as cancellation: an order with no subscriptionId is only
      // attributable when the customer holds a single plan.
      const singlePlanCustomer = matchedEmail ? (await loadCustomerSubscriptions(matchedEmail)).length <= 1 : false;
      if (matchedEmail) {
        try {
          const customers: any[] = (await fetchResource("customers")) || [];
          const updatedCustomers = customers.map((c: any) => {
            if (String(c.email || "").toLowerCase().trim() === matchedEmail) {
              return {
                ...c,
                subscriptionStatus: "Subscribed",
                subStatus: "Active",
                isSubscriptionCancelled: false,
              };
            }
            return c;
          });
          await saveResource("customers", updatedCustomers);
        } catch (_e) {}

        // Reverse the cancellation markers used by the Admin Dashboard. The
        // subscription record alone is not enough because customer status is
        // also derived from historical subscription orders.
        try {
          const orders: any[] = (await fetchResource("orders")) || [];
          let ordersModified = false;
          const updatedOrders = orders.map((o: any) => {
            const isCustOrder = String(o.customerEmail || "").toLowerCase().trim() === matchedEmail;
            const isSub = isSubscriptionOrder(o);
            // Resuming one plan must not clear the cancelled marker from another
            // plan's orders, or the admin dashboard would show a cancelled
            // subscription as running again.
            const inScope = subscriptionId
              ? orderBelongsToSubscription(o, subscription || { id: subscriptionId }, singlePlanCustomer)
              : true;

            if (!isCustOrder || !isSub || !inScope) return o;

            ordersModified = true;
            const tags = (Array.isArray(o.tags) ? o.tags : [])
              .filter((tag: string) => tag.toLowerCase() !== "subscription cancelled");
            const subDetails = o.subscriptionDetails ? { ...o.subscriptionDetails } : {};
            subDetails.status = "Active";
            subDetails.isCancelled = false;
            subDetails.resumedAt = now.toISOString();
            delete subDetails.cancelledAt;
            delete subDetails.cancellationReason;

            return {
              ...o,
              tags,
              subscriptionCancelled: false,
              subscriptionCancelledAt: null,
              subscriptionCancellationReason: null,
              // Recorded so the admin dashboard can say the plan was resumed
              // instead of the cancellation simply vanishing from the order.
              subscriptionResumedAt: now.toISOString(),
              subscriptionDetails: subDetails
            };
          });

          if (ordersModified) {
            await saveResource("orders", updatedOrders);
            console.log(`[Subscription Reactivate] Updated matching orders for customer: ${matchedEmail}`);
          }
        } catch (orderErr) {
          console.warn("[Subscription Reactivate] Failed to update orders:", orderErr);
        }
      }

      const resumedSubscription = subscription || { status: "active" };
      return res.json({
        success: true,
        message: "Subscription plan reactivated successfully.",
        // The account page shows this so the customer can see when the next box
        // is coming, rather than wondering whether resuming charged them today.
        nextBillingDate: (resumedSubscription as any).nextBillingDate || null,
        subscription: resumedSubscription
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to reactivate subscription",
      });
    }
  }
);

/**
 * Remove a finished subscription from the customer's account.
 *
 * This is a soft delete. The record keeps its payment history, renewal orders
 * and Worldpay references — a store cannot answer a chargeback or a refund
 * request about a plan it has erased — but it stops appearing in the customer's
 * list and is never picked up by the renewal worker or the account-wide resume.
 *
 * A live plan is refused: deleting one would stop billing without going through
 * cancellation, leaving the customer's card mandate and the admin record saying
 * different things.
 */
router.post(
  "/delete",
  async (req: Request, res: Response) => {
    try {
      const { subscriptionId, customerEmail } = req.body;

      if (!subscriptionId) {
        return res.status(400).json({ success: false, message: "subscriptionId is required" });
      }

      const emailClean = customerEmail ? String(customerEmail).toLowerCase().trim() : null;
      const deletedAt = new Date().toISOString();

      let stored: any[] = [];
      try {
        stored = (await fetchResource("subscriptions")) || [];
      } catch (_e) {}

      let existing: any = stored.find((s: any) => String(s.id) === String(subscriptionId)) || null;
      if (!existing) {
        try {
          existing = await prisma.subscription.findUnique({ where: { id: String(subscriptionId) } });
        } catch (_e) {}
      }

      if (!existing) {
        return res.status(404).json({ success: false, message: "Subscription not found." });
      }

      // The account portal identifies its customer by email only, so a request
      // that names an email must match the subscription it is trying to remove.
      // Without this, any signed-in customer could delete anyone's plan by id.
      if (emailClean && String(existing.customerEmail || "").toLowerCase().trim() !== emailClean) {
        return res.status(403).json({
          success: false,
          message: "This subscription belongs to a different account."
        });
      }

      if (isLiveStatus(existing.status)) {
        return res.status(409).json({
          success: false,
          message:
            "This subscription is still active. Cancel it first — that stops the recurring payment — and then it can be removed."
        });
      }

      if (isDeletedStatus(existing.status)) {
        return res.json({ success: true, message: "Subscription already removed.", subscriptionId });
      }

      try {
        await prisma.subscription.update({
          where: { id: String(subscriptionId) },
          data: { status: DELETED_SUB_STATUS },
        });
      } catch (_e) {}

      try {
        const updatedList = stored.map((s: any) =>
          String(s.id) === String(subscriptionId)
            ? { ...s, status: DELETED_SUB_STATUS, deletedAt, previousStatus: s.status }
            : s
        );
        await saveResource("subscriptions", updatedList);
      } catch (storeErr) {
        console.warn("[Subscription Delete] Failed to update store:", storeErr);
      }

      return res.json({
        success: true,
        message: "Subscription removed from your account.",
        subscriptionId,
        deletedAt
      });
    } catch (error: any) {
      console.error("[Subscription Delete Error]", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to remove subscription",
      });
    }
  }
);

/**
 * Get customer subscriptions.
 */
router.get(
  "/customer/:email",
  async (req: Request, res: Response) => {
    try {
      const email = String(req.params.email).toLowerCase().trim();
      const now = new Date();

      // Merged from both stores rather than "Prisma, else the file store": a
      // plan that exists in only one of them used to be invisible whenever the
      // other returned anything at all.
      const all = await loadCustomerSubscriptions(email);
      const subscriptions = all
        .filter(s => !isDeletedStatus(s.status))
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      return res.json({
        success: true,
        subscriptions: subscriptions.map(s => toCustomerSubscription(s, now)),
        // Ids and removal times, no plan detail. The account page rebuilds a
        // plan card from a subscription order when this endpoint has no record
        // for it, so it needs to tell "never stored" apart from "the customer
        // removed it" — otherwise removing a plan would resurrect it from its
        // own orders. The timestamp matters too: an order placed after the
        // removal is new activity the removal cannot account for, and hiding it
        // would lose a paid order from the customer's view.
        deletedSubscriptions: all
          .filter(s => isDeletedStatus(s.status))
          .map(s => ({
            id: String(s.id),
            deletedAt: s.deletedAt || s.updatedAt || null,
            // Lets the account page recognise an order that belonged to this
            // plan back when orders did not record which plan billed them.
            planName: s.planName || null,
          })),
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch subscriptions",
      });
    }
  }
);

export default router;
