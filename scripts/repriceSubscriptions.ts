import { fetchResource, saveResource } from "../serverDb";
import { prisma } from "../src/lib/prisma";
import { getPlanCatalogue, planForSubscription } from "../backend/services/planCatalogue";
import {
  repriceForPlan,
  noticeDateFrom,
  PRICE_CHANGE_NOTICE_DAYS
} from "../backend/services/subscriptionPricingService";
import { sendSubscriptionPriceChangeEmail } from "../backend/services/emailService";

/**
 * One-off correction of subscriptions whose stored amount was computed by the
 * old rule.
 *
 * Before the shared pricing rule existed, a plan change from the account portal
 * wrote the raw tier price with no frequency discount and no shipping, from a
 * hard-coded table that ignored the admin's own prices. Anyone who switched
 * plans is therefore on an amount the shop never quoted — usually too low.
 *
 * This recomputes every active subscription from the admin plan catalogue and
 * schedules the corrections with the SAME notice period and the SAME email as
 * an admin price change. Correcting a charge is still a change to what someone
 * pays, and gets the same protection.
 *
 *   npm run reprice:subscriptions            # dry run, reports only
 *   npm run reprice:subscriptions -- --apply # schedules changes and emails
 */

const APPLY = process.argv.includes("--apply");
const SKIP_EMAIL = process.argv.includes("--no-email");

const money = (n: number) => `£${Number(n || 0).toFixed(2)}`;

async function loadActiveSubscriptions(): Promise<any[]> {
  const byId = new Map<string, any>();

  try {
    const rows = await prisma.subscription.findMany({ where: { status: "active" } });
    for (const row of rows || []) byId.set(String(row.id), row);
  } catch (err: any) {
    console.warn("[Reprice] Prisma unavailable:", err?.message || err);
  }

  try {
    const stored: any[] = (await fetchResource("subscriptions")) || [];
    for (const row of stored) {
      if (!row?.id) continue;
      const key = String(row.id);
      // Prisma columns win; JSON-only keys (the pending fields) survive.
      byId.set(key, { ...(row || {}), ...(byId.get(key) || {}) });
    }
  } catch (err: any) {
    console.warn("[Reprice] JSON store unavailable:", err?.message || err);
  }

  return Array.from(byId.values()).filter(
    s => String(s?.status || "").toLowerCase() === "active"
  );
}

async function main() {
  console.log(
    `\n=== Subscription reprice — ${APPLY ? "APPLY" : "DRY RUN (no changes)"} ===\n`
  );

  const catalogue = await getPlanCatalogue();
  console.log("Plan catalogue in force:");
  for (const p of catalogue) console.log(`  ${p.slug.padEnd(10)} ${money(p.price)}  (${p.limit} cans)`);
  console.log();

  const subs = await loadActiveSubscriptions();
  console.log(`${subs.length} active subscription(s) found.\n`);

  const effectiveFrom = noticeDateFrom().toISOString();
  const corrections: any[] = [];
  const unresolved: any[] = [];
  const suspicious: any[] = [];

  for (const sub of subs) {
    const plan = planForSubscription(catalogue, sub);
    if (!plan) {
      unresolved.push(sub);
      continue;
    }

    const current = Number(sub.amount) || 0;
    const correct = repriceForPlan(sub, plan);

    if (!Number.isFinite(correct) || correct <= 0) {
      unresolved.push(sub);
      continue;
    }
    if (Math.abs(correct - current) < 0.01) continue;

    // A subscription is only "wrongly priced" if it was ever priced from the
    // catalogue at all. `planId` holds the cart SKU it was bought as, so the
    // plan is matched by name — and names are shared by things that are not
    // that plan: live data includes 1-can test packs called "LITE Plan"
    // billing £5.70 a day, which this would otherwise "correct" to £28.18.
    //
    // A correction that multiplies or halves someone's bill is not a rounding
    // fix; it means the record does not describe the plan it names. Those are
    // reported for a human to look at, never changed automatically.
    const ratio = current > 0 ? correct / current : Infinity;
    if (ratio > 1.5 || ratio < 0.67) {
      suspicious.push({ sub, plan, current, correct });
      continue;
    }

    // Already scheduled for this exact amount — leave it be rather than
    // restarting its notice period and emailing the customer twice.
    if (Math.abs(Number(sub.pendingAmount) - correct) < 0.01) continue;

    corrections.push({
      subscriptionId: String(sub.id),
      customerEmail: String(sub.customerEmail || ""),
      customerName: sub.customerName || undefined,
      planName: plan.name,
      previousAmount: current,
      newAmount: correct,
      effectiveFrom,
      billingInterval: sub.billingInterval || undefined,
      delta: correct - current
    });
  }

  if (unresolved.length) {
    console.log(`${unresolved.length} subscription(s) could not be priced (unknown plan) — untouched:`);
    for (const s of unresolved) {
      console.log(`  ${String(s.id).padEnd(28)} plan=${s.planId || s.planName || "?"} amount=${money(s.amount)}`);
    }
    console.log();
  }

  if (suspicious.length) {
    console.log(
      `${suspicious.length} subscription(s) NOT changed — the stored amount is too far from the\n` +
        `plan they are named after for this to be a pricing error. Review these by hand:\n`
    );
    for (const s of suspicious) {
      console.log(
        `  ${String(s.sub.id).padEnd(28)} ${String(s.plan.name).padEnd(10)} ` +
          `stored ${money(s.current).padStart(8)}  would become ${money(s.correct).padStart(8)}  ` +
          `(${(s.correct / s.current).toFixed(1)}x)  ${s.sub.customerEmail}`
      );
      console.log(
        `      plan id "${s.sub.planId}" · ${s.sub.cansCount} can(s) · every ${s.sub.billingInterval}`
      );
    }
    console.log();
  }

  if (corrections.length === 0) {
    console.log("No subscription needs a safe correction. Nothing to do.\n");
    return;
  }

  const under = corrections.filter(c => c.delta > 0);
  const over = corrections.filter(c => c.delta < 0);

  console.log(`${corrections.length} subscription(s) differ from the correct amount:\n`);
  console.log(
    "  SUBSCRIPTION                 PLAN        STORED     CORRECT    DIFFERENCE  CUSTOMER"
  );
  for (const c of corrections) {
    const sign = c.delta > 0 ? "+" : "";
    console.log(
      `  ${c.subscriptionId.padEnd(28)} ${c.planName.padEnd(11)} ${money(c.previousAmount).padStart(9)} ` +
        `${money(c.newAmount).padStart(10)} ${(sign + money(c.delta)).padStart(11)}  ${c.customerEmail}`
    );
  }

  const monthlyDelta = corrections.reduce((sum, c) => sum + c.delta, 0);
  console.log(
    `\n  ${under.length} undercharged, ${over.length} overcharged. ` +
      `Net change per billing cycle: ${monthlyDelta >= 0 ? "+" : ""}${money(monthlyDelta)}`
  );
  console.log(`  New prices would take effect ${new Date(effectiveFrom).toDateString()} (${PRICE_CHANGE_NOTICE_DAYS} days' notice).\n`);

  if (!APPLY) {
    console.log("Dry run — nothing was changed. Re-run with --apply to schedule these.\n");
    return;
  }

  // Schedule: pending fields go to the JSON store, which is where they live.
  const stored: any[] = (await fetchResource("subscriptions")) || [];
  const byId = new Map(corrections.map(c => [c.subscriptionId, c]));
  const next = stored.map((s: any) => {
    const c = byId.get(String(s?.id));
    if (!c) return s;
    return {
      ...s,
      pendingAmount: c.newAmount,
      pendingAmountEffectiveFrom: c.effectiveFrom,
      pendingAmountPrevious: c.previousAmount,
      pendingAmountReason: "backfill_correction",
      pendingAmountScheduledAt: new Date().toISOString()
    };
  });
  await saveResource("subscriptions", next);
  console.log(`Scheduled ${corrections.length} correction(s).`);

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
    console.error("[Reprice] Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
