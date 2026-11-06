import { fetchResource, saveResource } from "../../serverDb";
import { prisma } from "../../src/lib/prisma";
import {
  computeRecurringAmount,
  existingShippingFor,
  frequencyDiscountPercent
} from "../../src/lib/subscriptionPricing";
import { getPlanCatalogue, planForSubscription, PlanDefinition } from "./planCatalogue";

/**
 * Scheduled subscription price changes.
 *
 * A price an admin changes today must not appear on a customer's card tomorrow:
 * a recurring charge going up needs notice. So a raised or lowered plan price is
 * recorded as a PENDING amount with a date it becomes effective, and the renewal
 * takes it only once that date has passed.
 *
 * The pending fields are deliberately not Prisma columns. The Subscription table
 * is reached through both Prisma and a JSON store, and `loadAllSubscriptions`
 * merges them with the JSON row spread first — so a key that exists only in the
 * JSON store survives, while adding a column would need a migration against a
 * database whose migration history is not tracked. `persistSubscriptionUpdate`
 * already filters Prisma writes to known columns and writes the whole record to
 * the JSON store, which is exactly the behaviour these fields need.
 */

/** How long a customer must be given before a price change can be charged. */
export const PRICE_CHANGE_NOTICE_DAYS = 14;

export interface PendingPriceChange {
  /** The amount that will be charged once effective. */
  pendingAmount: number;
  /** ISO date from which `pendingAmount` may be charged. */
  pendingAmountEffectiveFrom: string;
  /** The amount in force when the change was scheduled, for the email and audit. */
  pendingAmountPrevious: number;
  /** 'admin_plan_price' | 'customer_plan_change' */
  pendingAmountReason: string;
  pendingAmountScheduledAt: string;
}

export function noticeDateFrom(now: Date = new Date(), days: number = PRICE_CHANGE_NOTICE_DAYS): Date {
  const d = new Date(now.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * The amount to charge for a renewal happening now.
 *
 * Returns the pending amount once its effective date has arrived, otherwise the
 * amount currently in force. `promote` says whether the caller should write the
 * pending amount into `amount` and clear the pending fields.
 */
export function resolveEffectiveAmount(
  sub: any,
  now: Date = new Date()
): { amount: number; promote: boolean } {
  const current = Number(sub?.amount);
  const pending = Number(sub?.pendingAmount);
  const effectiveFrom = sub?.pendingAmountEffectiveFrom
    ? new Date(sub.pendingAmountEffectiveFrom)
    : null;

  const hasPending =
    Number.isFinite(pending) &&
    pending > 0 &&
    effectiveFrom instanceof Date &&
    !isNaN(effectiveFrom.getTime());

  if (hasPending && now.getTime() >= effectiveFrom!.getTime()) {
    return { amount: pending, promote: true };
  }

  // No pending change, or the notice period has not elapsed: the customer keeps
  // the price they are on. A renewal inside the notice window is charged at the
  // OLD price, which is the whole point of the notice.
  return { amount: Number.isFinite(current) && current > 0 ? current : 0, promote: false };
}

/** The fields that clear a pending change once it has been applied. */
export function clearedPendingFields(): Record<string, any> {
  return {
    pendingAmount: null,
    pendingAmountEffectiveFrom: null,
    pendingAmountPrevious: null,
    pendingAmountReason: null,
    pendingAmountScheduledAt: null
  };
}

/**
 * Moves an existing amount by a change in its plan's headline price.
 *
 * Used instead of recomputing from the plan, because a subscription does not
 * reliably record which catalogue plan it is on: `planId` holds the cart SKU it
 * was bought as (`sub-pack-1789467933399`), so the only link back to a plan is
 * its name — and names are shared by things that are not that plan at all. Live
 * data includes 1-can test packs called "LITE Plan" billing £5.70 daily;
 * recomputing those from the Lite plan would have raised them to £28.18.
 *
 * Shifting by the delta keeps whatever the customer actually agreed — a custom
 * pack, a legacy price, a test cadence — and applies only the change the admin
 * made. For a subscription that WAS priced from the catalogue, this produces
 * exactly the same figure as a full recompute.
 *
 * The delta is discounted at the subscription's own frequency, because the
 * headline price is discounted before shipping is added.
 */
export function applyPlanPriceDelta(
  sub: any,
  previousPlanPrice: number,
  newPlanPrice: number
): number {
  const current = Number(sub?.amount);
  if (!Number.isFinite(current) || current <= 0) return 0;

  const rawDelta = Number(newPlanPrice) - Number(previousPlanPrice);
  if (!Number.isFinite(rawDelta) || rawDelta === 0) return current;

  const multiplier = (100 - frequencyDiscountPercent(sub?.billingInterval)) / 100;
  const next = current + rawDelta * multiplier;

  // A change can reduce a price but must never make a subscription free or
  // negative; that would be a broken charge, not a discount.
  if (next <= 0) return current;

  return Number((Math.round(next * 100) / 100).toFixed(2));
}

/**
 * What a subscription should cost under a given plan, keeping everything about
 * it except the plan price — its extras, its rhythm and its agreed shipping.
 *
 * Correct only for a subscription genuinely priced from the catalogue. Use
 * `applyPlanPriceDelta` for an admin price change, where that cannot be assumed.
 */
export function repriceForPlan(sub: any, plan: PlanDefinition): number {
  const included = Number(plan.limit) || 0;
  const cans = Number(sub?.cansCount) || 0;
  const extraCans = included > 0 && cans > included ? cans - included : 0;

  return computeRecurringAmount({
    planPrice: plan.price,
    extraCans,
    frequency: sub?.billingInterval,
    shippingCost: existingShippingFor(sub)
  });
}

/** Every subscription that is still being billed. */
async function loadBillableSubscriptions(): Promise<any[]> {
  const byId = new Map<string, any>();

  try {
    const rows = await prisma.subscription.findMany({ where: { status: "active" } });
    for (const row of rows || []) byId.set(String(row.id), row);
  } catch {
    // Prisma unavailable; the JSON store below carries the records.
  }

  try {
    const stored: any[] = (await fetchResource("subscriptions")) || [];
    for (const row of stored) {
      if (!row?.id) continue;
      // Same precedence as the cron loader: Prisma columns win, JSON-only keys
      // (the pending fields) survive.
      const key = String(row.id);
      byId.set(key, { ...(row || {}), ...(byId.get(key) || {}) });
    }
  } catch {
    /* nothing stored */
  }

  return Array.from(byId.values()).filter(
    s => String(s?.status || "").toLowerCase() === "active"
  );
}

/** Writes pending-price fields to the JSON store, which is where they live. */
async function persistPendingFields(updates: Map<string, Record<string, any>>): Promise<void> {
  if (updates.size === 0) return;
  const stored: any[] = (await fetchResource("subscriptions")) || [];
  const next = stored.map((s: any) => {
    const patch = updates.get(String(s?.id));
    return patch ? { ...s, ...patch } : s;
  });
  await saveResource("subscriptions", next);
}

export interface ScheduledChange {
  subscriptionId: string;
  customerEmail: string;
  customerName?: string;
  planName: string;
  previousAmount: number;
  newAmount: number;
  effectiveFrom: string;
  billingInterval?: string;
}

/**
 * Schedules a new price for every active subscriber of the plans whose price
 * just changed, and reports what was scheduled so the caller can notify them.
 *
 * Only subscriptions whose amount actually moves are touched — a plan edit that
 * leaves a particular subscriber's total unchanged (because their extras and
 * shipping absorb it) produces no schedule and no email.
 */
export async function schedulePlanPriceChange(
  changes: Array<{ slug: string; from: number; to: number }>,
  pages?: any[],
  now: Date = new Date()
): Promise<ScheduledChange[]> {
  if (!changes.length) return [];

  const catalogue = await getPlanCatalogue(pages);
  const wanted = new Map(changes.map(c => [c.slug.toLowerCase(), c]));
  const subs = await loadBillableSubscriptions();

  const effectiveFrom = noticeDateFrom(now).toISOString();
  const updates = new Map<string, Record<string, any>>();
  const scheduled: ScheduledChange[] = [];

  for (const sub of subs) {
    const plan = planForSubscription(catalogue, sub);
    if (!plan) continue;
    const change = wanted.get(plan.slug);
    if (!change) continue;

    const currentAmount = Number(sub.amount) || 0;
    // Shifted by the plan's change, not recomputed — see applyPlanPriceDelta.
    const newAmount = applyPlanPriceDelta(sub, change.from, change.to);

    if (!Number.isFinite(newAmount) || newAmount <= 0) continue;
    if (Math.abs(newAmount - currentAmount) < 0.01) continue;

    const pending: PendingPriceChange = {
      pendingAmount: newAmount,
      pendingAmountEffectiveFrom: effectiveFrom,
      pendingAmountPrevious: currentAmount,
      pendingAmountReason: "admin_plan_price",
      pendingAmountScheduledAt: now.toISOString()
    };

    updates.set(String(sub.id), pending as unknown as Record<string, any>);
    scheduled.push({
      subscriptionId: String(sub.id),
      customerEmail: String(sub.customerEmail || ""),
      customerName: sub.customerName || undefined,
      planName: plan.name,
      previousAmount: currentAmount,
      newAmount,
      effectiveFrom,
      billingInterval: sub.billingInterval || undefined
    });
  }

  await persistPendingFields(updates);
  return scheduled;
}

/**
 * Compares two plan catalogues and reports which slugs changed price.
 * Used to turn a page save into "these plans were repriced".
 */
export function diffPlanPrices(
  before: PlanDefinition[],
  after: PlanDefinition[]
): Array<{ slug: string; from: number; to: number }> {
  const beforeBySlug = new Map(before.map(p => [p.slug, p]));
  const changes: Array<{ slug: string; from: number; to: number }> = [];

  for (const plan of after) {
    const old = beforeBySlug.get(plan.slug);
    if (!old) continue; // A newly added plan has no existing subscribers.
    if (Math.abs(Number(old.price) - Number(plan.price)) >= 0.01) {
      changes.push({ slug: plan.slug, from: Number(old.price), to: Number(plan.price) });
    }
  }

  return changes;
}
