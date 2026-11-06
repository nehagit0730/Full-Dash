import { fetchResource, saveResource } from "../serverDb";
import { prisma } from "../src/lib/prisma";
import { upsertSubscriptionRow } from "../src/lib/subscriptionRow";
import { assessSubscription, money, num } from "./couponCarryover";
import {
  noticeDateFrom,
  PRICE_CHANGE_NOTICE_DAYS
} from "../backend/services/subscriptionPricingService";
import { sendSubscriptionPriceChangeEmail } from "../backend/services/emailService";

/**
 * One-off correction of subscriptions whose coupon never stopped being applied.
 *
 * The checkout callback used to store the ORDER TOTAL as `Subscription.amount`.
 * That total is net of the coupon and of any store credit, so the discount was
 * reissued on every renewal: a £20 plan bought with a £2 coupon was charged £18
 * for life instead of £18 once and £20 thereafter.
 *
 * The callback now builds the recurring amount from the plan's own line prices.
 * This repairs the rows written before that, recomputing each one with the SAME
 * shared rule (`recurringAmountForNewSubscription`) so the repair and the live
 * checkout can never disagree, and scheduling the correction with the SAME
 * notice period and the SAME email as an admin price change — putting someone's
 * price up is a change to what they pay, whatever the reason, and gets the same
 * protection.
 *
 * It also drops reward lines (a free can, a gift box) from the stored box:
 * `buildRenewalOrderItems` replays whatever is stored there on every renewal, so
 * a one-off reward was being shipped free forever.
 *
 *   npm run repair:coupon-pricing            # dry run, reports only
 *   npm run repair:coupon-pricing -- --apply # schedules changes and emails
 *   npm run repair:coupon-pricing -- --apply --no-email
 */

const APPLY = process.argv.includes("--apply");
const SKIP_EMAIL = process.argv.includes("--no-email");

/**
 * Active subscriptions from both stores.
 *
 * Same precedence as the renewal worker: Prisma columns win, JSON-only keys
 * (the pending-price fields) survive. Repairing anything else would be judging
 * a record the biller does not actually see.
 */
async function loadActiveSubscriptions(): Promise<any[]> {
  const byId = new Map<string, any>();

  try {
    const rows = await prisma.subscription.findMany({ where: { status: "active" } });
    for (const row of rows || []) byId.set(String(row.id), row);
  } catch (err: any) {
    console.warn("[Repair] Prisma unavailable:", err?.message || err);
  }

  try {
    const stored: any[] = (await fetchResource("subscriptions")) || [];
    for (const row of stored) {
      if (!row?.id) continue;
      const key = String(row.id);
      byId.set(key, { ...(row || {}), ...(byId.get(key) || {}) });
    }
  } catch (err: any) {
    console.warn("[Repair] JSON store unavailable:", err?.message || err);
  }

  return Array.from(byId.values()).filter(
    s => String(s?.status || "").toLowerCase() === "active"
  );
}

async function loadOrdersById(): Promise<Map<string, any>> {
  const byId = new Map<string, any>();
  const orders: any[] = (await fetchResource("orders")) || [];
  for (const o of orders) {
    for (const key of [o?.orderId, o?.id]) {
      if (key) byId.set(String(key), o);
    }
  }
  return byId;
}

interface Correction {
  subscriptionId: string;
  customerEmail: string;
  customerName?: string;
  planName: string;
  previousAmount: number;
  newAmount: number;
  effectiveFrom: string;
  billingInterval?: string;
  delta: number;
  coupon: number;
  credit: number;
  orderId: string;
}

async function main() {
  console.log(
    `\n=== Coupon carry-over repair — ${APPLY ? "APPLY" : "DRY RUN (no changes)"} ===\n`
  );

  const subs = await loadActiveSubscriptions();
  const ordersById = await loadOrdersById();
  console.log(`${subs.length} active subscription(s), ${ordersById.size} order key(s) loaded.\n`);

  const effectiveFrom = noticeDateFrom().toISOString();
  const corrections: Correction[] = [];
  const rewardBoxes: Array<{ sub: any; dropped: any[] }> = [];
  const noOrder: any[] = [];
  const suspicious: any[] = [];
  let unaffected = 0;

  for (const sub of subs) {
    const orderId = sub?.sourceOrderId ? String(sub.sourceOrderId) : "";
    const order = orderId ? ordersById.get(orderId) : undefined;

    // A reward line stored on the plan ships free on every renewal. This is
    // judged on the subscription alone, so it is checked before the order
    // lookup that the price correction needs.
    const storedItems: any[] = Array.isArray(sub?.items) ? sub.items : [];
    const rewardLines = storedItems.filter((it: any) => it?.isRewardItem);
    if (rewardLines.length > 0) rewardBoxes.push({ sub, dropped: rewardLines });

    if (!order) {
      // Only worth reporting if it claims an order that should have been found;
      // a plan with no source order at all predates that field.
      if (orderId) noOrder.push(sub);
      continue;
    }

    const verdict = assessSubscription(sub, order);
    if (verdict.kind === "unaffected") {
      unaffected++;
      continue;
    }
    if (verdict.kind === "suspicious") {
      suspicious.push({ sub, current: num(sub.amount), correct: verdict.correct, reason: verdict.reason });
      continue;
    }

    corrections.push({
      subscriptionId: String(sub.id),
      customerEmail: String(sub.customerEmail || ""),
      customerName: sub.customerName || undefined,
      planName: String(sub.planName || sub.planId || "Pouch Supply Subscription"),
      previousAmount: num(sub.amount),
      newAmount: verdict.newAmount,
      effectiveFrom,
      billingInterval: sub.billingInterval || undefined,
      delta: verdict.newAmount - num(sub.amount),
      coupon: verdict.coupon,
      credit: verdict.credit,
      orderId
    });
  }

  console.log(`${unaffected} subscription(s) already correct — untouched.\n`);

  if (noOrder.length) {
    console.log(
      `${noOrder.length} subscription(s) name a source order that is not in the store, so their\n` +
        `price cannot be checked. Review by hand:\n`
    );
    for (const s of noOrder) {
      console.log(
        `  ${String(s.id).padEnd(28)} order=${s.sourceOrderId} amount=${money(s.amount)} ${s.customerEmail}`
      );
    }
    console.log();
  }

  if (suspicious.length) {
    console.log(
      `${suspicious.length} subscription(s) NOT changed — the recomputed amount does not look like a\n` +
        `plain coupon carry-over. Review these by hand:\n`
    );
    for (const s of suspicious) {
      console.log(
        `  ${String(s.sub.id).padEnd(28)} stored ${money(s.current).padStart(8)} ` +
          `would become ${money(s.correct).padStart(8)}  ${s.sub.customerEmail}`
      );
      console.log(`      ${s.reason}`);
    }
    console.log();
  }

  if (rewardBoxes.length) {
    console.log(`${rewardBoxes.length} subscription(s) still carry a one-off reward in the renewal box:\n`);
    for (const r of rewardBoxes) {
      const names = r.dropped.map((d: any) => d.productTitle || d.productId).join(", ");
      console.log(`  ${String(r.sub.id).padEnd(28)} drop: ${names}  (${r.sub.customerEmail})`);
    }
    console.log();
  }

  if (corrections.length) {
    console.log(`${corrections.length} subscription(s) are still being charged with the coupon applied:\n`);
    console.log(
      "  SUBSCRIPTION                 ORDER       CHARGED    SHOULD BE   RISE     LET OFF   CUSTOMER"
    );
    for (const c of corrections) {
      console.log(
        `  ${c.subscriptionId.padEnd(28)} ${c.orderId.padEnd(11)} ${money(c.previousAmount).padStart(9)} ` +
          `${money(c.newAmount).padStart(11)} ${("+" + money(c.delta)).padStart(8)} ` +
          `${money(c.coupon + c.credit).padStart(9)}  ${c.customerEmail}`
      );
    }
    const totalDelta = corrections.reduce((sum, c) => sum + c.delta, 0);
    console.log(
      `\n  Recovered per billing cycle: +${money(totalDelta)}.` +
        `\n  New prices would take effect ${new Date(effectiveFrom).toDateString()} ` +
        `(${PRICE_CHANGE_NOTICE_DAYS} days notice).\n`
    );
  } else {
    console.log("No subscription is carrying a coupon into its renewals.\n");
  }

  if (corrections.length === 0 && rewardBoxes.length === 0) {
    console.log("Nothing to repair.\n");
    return;
  }

  if (!APPLY) {
    console.log("Dry run — nothing was changed. Re-run with --apply to schedule these.\n");
    return;
  }

  // The pending-price fields are JSON-store only (see subscriptionPricingService),
  // so the schedule is written there. The de-rewarded box IS a Prisma column and
  // has to go to both, or the merged read the biller does would keep the old one.
  const scheduleById = new Map(corrections.map(c => [c.subscriptionId, c]));
  const rewardById = new Map(rewardBoxes.map(r => [String(r.sub.id), r]));
  const now = new Date().toISOString();

  const stored: any[] = (await fetchResource("subscriptions")) || [];
  const next = stored.map((s: any) => {
    const id = String(s?.id);
    let out = s;

    const c = scheduleById.get(id);
    if (c) {
      out = {
        ...out,
        pendingAmount: c.newAmount,
        pendingAmountEffectiveFrom: c.effectiveFrom,
        pendingAmountPrevious: c.previousAmount,
        pendingAmountReason: "coupon_carryover_correction",
        pendingAmountScheduledAt: now
      };
    }

    if (rewardById.has(id) && Array.isArray(out.items)) {
      out = { ...out, items: out.items.filter((it: any) => !it?.isRewardItem) };
    }

    return out;
  });
  await saveResource("subscriptions", next);
  console.log(`Scheduled ${corrections.length} correction(s).`);

  let boxesFixed = 0;
  for (const r of rewardBoxes) {
    const cleaned = {
      ...r.sub,
      items: (Array.isArray(r.sub.items) ? r.sub.items : []).filter((it: any) => !it?.isRewardItem)
    };
    if (await upsertSubscriptionRow(cleaned)) boxesFixed++;
    else console.error(`  BOX NOT UPDATED for ${r.sub.id} — the reward may still ship on renewal.`);
  }
  if (rewardBoxes.length) {
    console.log(`Cleared one-off rewards from ${boxesFixed}/${rewardBoxes.length} renewal box(es).`);
  }

  if (corrections.length === 0) {
    console.log();
    return;
  }

  if (SKIP_EMAIL) {
    console.log("--no-email given: notices NOT sent. The customers have not been told.\n");
    return;
  }

  let sent = 0;
  for (const c of corrections) {
    if (!c.customerEmail) {
      console.error(`  NO EMAIL ADDRESS for ${c.subscriptionId} — customer cannot be notified.`);
      continue;
    }
    try {
      await sendSubscriptionPriceChangeEmail(c);
      sent++;
    } catch (err: any) {
      console.error(`  NOTICE FAILED for ${c.customerEmail}:`, err?.message || err);
    }
  }
  console.log(`Sent ${sent}/${corrections.length} notice(s).\n`);
}

main()
  .catch(err => {
    console.error("[Repair] Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
