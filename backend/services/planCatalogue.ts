import { fetchResource } from "../../serverDb";

/**
 * The subscription plans and their prices, as the administrator maintains them.
 *
 * Prices live inside a page: a CustomPage section of type 'Plans', under
 * settings.planItems, edited in Admin → Pages → Plan Cards. That is an odd home
 * for pricing, but it is the one an admin can actually change, so it is the
 * source of truth here. The hard-coded tables in the frontend are fallbacks for
 * rendering, not authority.
 */

export interface PlanDefinition {
  /** 'lite' | 'core' | 'pro' | 'ultimate' */
  slug: string;
  name: string;
  price: number;
  /** Cans included before extras are charged. */
  limit: number;
}

/** Last-resort prices, matching the frontend fallback tables. */
const FALLBACK_PLANS: PlanDefinition[] = [
  { slug: "lite", name: "LITE", price: 27.99, limit: 6 },
  { slug: "core", name: "CORE", price: 35.99, limit: 9 },
  { slug: "pro", name: "PRO", price: 40.99, limit: 12 },
  { slug: "ultimate", name: "ULTIMATE", price: 46.99, limit: 12 }
];

function normalisePlan(raw: any): PlanDefinition | null {
  const slug = String(raw?.slug || "").trim().toLowerCase();
  const price = Number(raw?.price);
  if (!slug || !Number.isFinite(price) || price <= 0) return null;
  return {
    slug,
    name: String(raw?.name || slug).trim(),
    price,
    limit: Number(raw?.limit) || 0
  };
}

/**
 * Reads every plan the admin has defined.
 *
 * Scans all pages because the Plans section can live on any of them, and an
 * admin may have more than one. The first definition of a slug wins, so a
 * duplicated section on a secondary page cannot quietly reprice a plan.
 */
export async function getPlanCatalogue(pages?: any[]): Promise<PlanDefinition[]> {
  let customPages = pages;
  if (!customPages) {
    try {
      customPages = (await fetchResource("customPages")) || [];
    } catch {
      customPages = [];
    }
  }

  const bySlug = new Map<string, PlanDefinition>();

  for (const page of customPages || []) {
    const sections = Array.isArray(page?.sections) ? page.sections : [];
    for (const section of sections) {
      if (String(section?.type || "") !== "Plans") continue;
      const items = section?.settings?.planItems;
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        const plan = normalisePlan(item);
        if (plan && !bySlug.has(plan.slug)) bySlug.set(plan.slug, plan);
      }
    }
  }

  if (bySlug.size === 0) return [...FALLBACK_PLANS];

  // Any plan the admin has not defined keeps its fallback, so a partially
  // filled section cannot leave a live subscriber with no price at all.
  for (const fallback of FALLBACK_PLANS) {
    if (!bySlug.has(fallback.slug)) bySlug.set(fallback.slug, fallback);
  }

  return Array.from(bySlug.values());
}

/**
 * Finds one plan by whatever a subscription happens to hold.
 *
 * Records carry a slug in `planId` and a label in `planName`, and the label has
 * been written as 'PRO', 'Pro Plan' and 'PRO Plan (+2 Extra)' by different code
 * paths over time, so matching has to be forgiving.
 */
export function findPlan(catalogue: PlanDefinition[], planIdOrName: string | undefined | null): PlanDefinition | null {
  const raw = String(planIdOrName || "").trim().toLowerCase();
  if (!raw) return null;

  const exact = catalogue.find(p => p.slug === raw);
  if (exact) return exact;

  const byName = catalogue.find(p => p.name.toLowerCase() === raw);
  if (byName) return byName;

  // 'PRO Plan (+2 Extra)' → first word.
  const firstWord = raw.split(/[\s(]+/)[0];
  return catalogue.find(p => p.slug === firstWord || p.name.toLowerCase() === firstWord) || null;
}

/** Resolves the plan a subscription is on. */
export function planForSubscription(catalogue: PlanDefinition[], sub: any): PlanDefinition | null {
  return findPlan(catalogue, sub?.planId) || findPlan(catalogue, sub?.planName);
}
