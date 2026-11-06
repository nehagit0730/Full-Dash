import { createCrudRouter } from "./crudHelper";
import { getPlanCatalogue } from "../services/planCatalogue";
import { diffPlanPrices, schedulePlanPriceChange } from "../services/subscriptionPricingService";
import { sendSubscriptionPriceChangeEmail } from "../services/emailService";

/**
 * Custom pages, which is also where subscription plan prices live: a section of
 * type 'Plans' holds settings.planItems, edited in Admin → Pages → Plan Cards.
 *
 * Because of that, saving pages can change what existing subscribers pay. The
 * hook below turns a plan price edit into a scheduled price change plus a notice
 * email for everyone already on that plan — without it, editing the price moved
 * only what new signups are quoted, and existing subscriptions billed the old
 * amount forever.
 */
const router = createCrudRouter("customPages", {
  onAfterReplace: async (before, after) => {
    const previousPlans = await getPlanCatalogue(before);
    const currentPlans = await getPlanCatalogue(after);
    const changes = diffPlanPrices(previousPlans, currentPlans);

    if (changes.length === 0) return;

    console.log(
      `[Plan Pricing] Price change detected: ${changes
        .map(c => `${c.slug} £${c.from.toFixed(2)} -> £${c.to.toFixed(2)}`)
        .join(", ")}`
    );

    const scheduled = await schedulePlanPriceChange(changes, after);

    if (scheduled.length === 0) {
      console.log("[Plan Pricing] No active subscribers affected.");
      return;
    }

    // Sent one at a time so a single bad address cannot stop the rest. The
    // schedule is already persisted, so a failed email costs the notice, not
    // the price change — and that is logged loudly because a price change
    // nobody was told about is the thing to avoid.
    let sent = 0;
    for (const change of scheduled) {
      if (!change.customerEmail) {
        console.error(`[Plan Pricing] Subscription ${change.subscriptionId} has no email; cannot send notice.`);
        continue;
      }
      try {
        await sendSubscriptionPriceChangeEmail(change);
        sent++;
      } catch (err: any) {
        console.error(
          `[Plan Pricing] NOTICE NOT SENT for ${change.customerEmail} (sub ${change.subscriptionId}):`,
          err?.message || err
        );
      }
    }

    console.log(
      `[Plan Pricing] Scheduled ${scheduled.length} price change(s); ${sent} notice(s) sent. ` +
        `New prices take effect ${scheduled[0]?.effectiveFrom}.`
    );
  }
});

export default router;
