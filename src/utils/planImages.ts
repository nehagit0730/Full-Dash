import litePlanImg from '../assets/images/plan_lite_box_1788334553835.jpg';
import proPlanImg from '../assets/images/plan_pro_box_1788334576855.jpg';
import corePlanImg from '../assets/images/plan_core_box_1788334595895.jpg';
import ultimatePlanImg from '../assets/images/plan_ultimate_box_1788334618338.jpg';

export const PLAN_IMAGES: Record<string, string> = {
  lite: litePlanImg,
  core: corePlanImg,
  pro: proPlanImg,
  ultimate: ultimatePlanImg,
};

export type PlanTier = 'lite' | 'core' | 'pro' | 'ultimate';

/**
 * The tier a plan name or title names, or null when it names none.
 *
 * Reads only the heading — the part before " - ", "[" or "(" — because
 * everything after it is the box's product list, and product names can contain
 * "pro" or "core". Matching the whole string with `includes('pro')`, checked
 * before 'lite', is how a LITE plan got read as PRO.
 *
 * Unlike getPlanSlug this never guesses. getPlanSlug falls back to 'pro' so a
 * picture can always be chosen; a fallback is fine for a picture but not for
 * deciding what a customer bought or what to write back to their plan.
 */
export function detectPlanTier(text?: string | null): PlanTier | null {
  if (!text) return null;
  const heading = String(text).toLowerCase().split(/\s+-\s+|\[|\(/)[0];
  const match = heading.match(/\b(ultimate|core|lite|pro)\b/);
  return match ? (match[1] as PlanTier) : null;
}

export function getPlanSlug(planNameOrTitle?: string): 'lite' | 'core' | 'pro' | 'ultimate' {
  if (!planNameOrTitle) return 'pro';
  const str = String(planNameOrTitle).trim();
  const lower = str.toLowerCase();

  // 1. Isolate the plan heading/prefix before any dash or product list
  const planPrefix = lower.split(' - ')[0] || lower;

  // 2. Check explicit plan keywords / tier tokens in prefix
  if (/\b(ultimate|12\s*pack|12\s*can|12\+)\b/i.test(planPrefix)) return 'ultimate';
  if (/\b(pro|10\s*pack|10\s*can)\b/i.test(planPrefix)) return 'pro';
  if (/\b(core|8\s*pack|8\s*can)\b/i.test(planPrefix)) return 'core';
  if (/\b(lite|6\s*pack|6\s*can)\b/i.test(planPrefix)) return 'lite';

  // 3. Fallback check on entire string looking for whole plan words
  if (/\bultimate\s*plan\b/i.test(lower) || /\bultimate\b/i.test(lower)) return 'ultimate';
  if (/\bpro\s*plan\b/i.test(lower) || /\bpro\b/i.test(lower)) return 'pro';
  if (/\bcore\s*plan\b/i.test(lower) || /\bcore\b/i.test(lower)) return 'core';
  if (/\blite\s*plan\b/i.test(lower) || /\blite\b/i.test(lower)) return 'lite';

  return 'pro';
}

export function getPlanImage(planNameOrTitle?: string, fallbackUrl?: string): string {
  const slug = getPlanSlug(planNameOrTitle);
  const planDefaultImg = PLAN_IMAGES[slug] || proPlanImg;

  // If a valid custom image URL is provided and it's NOT a generic placeholder or mismatched asset
  if (fallbackUrl && typeof fallbackUrl === 'string' && fallbackUrl.trim() !== '' && !fallbackUrl.includes('placeholder') && !fallbackUrl.startsWith('data:image/svg')) {
    // If fallbackUrl is one of our built-in plan box images, always ensure it matches the actual plan tier slug!
    const builtInImages = Object.values(PLAN_IMAGES);
    if (builtInImages.includes(fallbackUrl)) {
      return planDefaultImg;
    }
    return fallbackUrl;
  }

  return planDefaultImg;
}

