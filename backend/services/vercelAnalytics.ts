/**
 * Reads real traffic figures from Vercel Web Analytics.
 *
 * The `<Analytics/>` component in the app only SENDS page views to Vercel; it
 * has no way to read them back. The numbers live behind Vercel's Web Analytics
 * API, which needs an access token — so the call is made here, on the server,
 * and never from the browser where the token would be public.
 *
 * API shape, from https://vercel.com/docs/analytics/web-analytics-api:
 *
 *   GET https://api.vercel.com/v1/query/web-analytics/visits/aggregate
 *     ?projectId=prj_…&teamId=team_…&since=YYYY-MM-DD&until=YYYY-MM-DD
 *     &by=<dimension>&limit=<n>
 *   Authorization: Bearer <token>
 *
 *   -> { version, query, data: [ { <dimension>|timestamp, pageviews, visitors } ] }
 *
 * Nothing here invents a figure. When it cannot reach Vercel, or has not been
 * given a token, it says so and the dashboard shows that instead of a number.
 */

const API_BASE = "https://api.vercel.com/v1/query/web-analytics";

/** Aggregate queries are bounded by the plan's reporting window. */
export const DEFAULT_RANGE_DAYS = 30;

export interface VercelAnalyticsConfig {
  token: string;
  projectId: string;
  /** Only for team-owned projects; omitted for a personal account. */
  teamId?: string;
  teamSlug?: string;
}

/**
 * Reads the configuration from the environment.
 *
 * Only two things are needed, and only one of them by hand.
 *
 * `VERCEL_PROJECT_ID` is a Vercel system environment variable, already present
 * at runtime on a deployment with system variables enabled. `VERCEL_API_TOKEN`
 * has to be created and set by hand: it is a credential, not something the
 * platform hands out.
 *
 * The team is NOT required. There is no system variable for it, so rather than
 * make it a manual step it is discovered from the token — see `resolveScope`.
 * VERCEL_TEAM_ID and VERCEL_TEAM_SLUG remain as optional overrides that skip
 * that lookup.
 */
export function readConfig(): { ok: true; config: VercelAnalyticsConfig } | { ok: false; missing: string[] } {
  const token = (process.env.VERCEL_API_TOKEN || process.env.VERCEL_TOKEN || "").trim();
  const projectId = (process.env.VERCEL_PROJECT_ID || process.env.VERCEL_ANALYTICS_PROJECT_ID || "").trim();

  const missing: string[] = [];
  if (!token) missing.push("VERCEL_API_TOKEN");
  if (!projectId) missing.push("VERCEL_PROJECT_ID");
  if (missing.length) return { ok: false, missing };

  return {
    ok: true,
    config: {
      token,
      projectId,
      teamId: (process.env.VERCEL_TEAM_ID || "").trim() || undefined,
      teamSlug: (process.env.VERCEL_TEAM_SLUG || "").trim() || undefined
    }
  };
}

export function isConfigured(): boolean {
  return readConfig().ok;
}

/** YYYY-MM-DD, which is the format the API's since/until take. */
function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Which account the project sits under.
 *
 * `null` means a personal account, where teamId and slug are omitted entirely.
 */
export type Scope = { teamId: string; label: string } | null;

export interface ResolvedScope {
  scope: Scope;
  /** How it was arrived at, for the dashboard and the logs. */
  detectedFrom: "environment" | "personal-account" | "team-lookup";
}

/** Scope resolution is stable for a deployment, so it is worked out once. */
let scopeCache: { key: string; value: ResolvedScope } | null = null;

function scopeParams(scope: Scope): Record<string, string> {
  return scope ? { teamId: scope.teamId } : {};
}

/** A cheap, real query — the exact permission the dashboard needs. */
async function canQuery(config: VercelAnalyticsConfig, scope: Scope): Promise<boolean> {
  const today = isoDay(new Date());
  const query = new URLSearchParams({
    projectId: config.projectId,
    since: today,
    until: today,
    by: "day",
    limit: "1",
    ...scopeParams(scope)
  });
  try {
    const res = await fetch(`${API_BASE}/visits/aggregate?${query.toString()}`, {
      headers: { Authorization: `Bearer ${config.token}`, Accept: "application/json" }
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Every team this token can see. Empty when the token cannot list them. */
async function listTeams(config: VercelAnalyticsConfig): Promise<Array<{ id: string; slug?: string; name?: string }>> {
  try {
    const res = await fetch("https://api.vercel.com/v2/teams?limit=20", {
      headers: { Authorization: `Bearer ${config.token}`, Accept: "application/json" }
    });
    if (!res.ok) return [];
    const body: any = await res.json().catch(() => null);
    return Array.isArray(body?.teams) ? body.teams : [];
  } catch {
    return [];
  }
}

/**
 * Works out which account owns the project, so nobody has to look up a team id.
 *
 * Vercel's API needs `teamId` for a team-owned project and rejects it for a
 * personal one, and there is no system environment variable that supplies it —
 * unlike VERCEL_PROJECT_ID, which the platform provides. Rather than making
 * that a manual setup step that is easy to get wrong, it is discovered:
 *
 *   1. VERCEL_TEAM_ID / VERCEL_TEAM_SLUG if set — an explicit answer always wins.
 *   2. The personal account, tried first because it needs no extra call.
 *   3. Each team the token can see, until one answers.
 *
 * Every step is a real query for this project, so a scope is only accepted once
 * it has actually returned data. The answer is cached for the process.
 */
export async function resolveScope(config: VercelAnalyticsConfig): Promise<ResolvedScope> {
  const cacheKey = `${config.token.slice(-8)}:${config.projectId}`;
  if (scopeCache && scopeCache.key === cacheKey) return scopeCache.value;

  let resolved: ResolvedScope;

  if (config.teamId) {
    resolved = { scope: { teamId: config.teamId, label: config.teamId }, detectedFrom: "environment" };
  } else if (config.teamSlug) {
    // A slug is accepted by the API in place of an id, under its own parameter,
    // so it is looked up here to keep one code path downstream.
    const team = (await listTeams(config)).find(t => t.slug === config.teamSlug);
    resolved = team
      ? { scope: { teamId: team.id, label: team.slug || team.id }, detectedFrom: "environment" }
      : { scope: null, detectedFrom: "personal-account" };
  } else if (await canQuery(config, null)) {
    resolved = { scope: null, detectedFrom: "personal-account" };
  } else {
    const teams = await listTeams(config);
    let found: Scope = null;
    for (const team of teams) {
      const candidate: Scope = { teamId: team.id, label: team.slug || team.name || team.id };
      if (await canQuery(config, candidate)) {
        found = candidate;
        break;
      }
    }
    resolved = { scope: found, detectedFrom: found ? "team-lookup" : "personal-account" };
    if (found) {
      console.log(
        `[Vercel Analytics] project ${config.projectId} resolved to team "${found.label}" ` +
          `(${found.teamId}). Set VERCEL_TEAM_ID to skip this lookup.`
      );
    }
  }

  scopeCache = { key: cacheKey, value: resolved };
  return resolved;
}

/** Forgets the resolved account, so a changed token is re-resolved. */
export function clearScopeCache(): void {
  scopeCache = null;
}

export interface AggregateRow {
  [dimension: string]: any;
  pageviews?: number;
  visitors?: number;
}

/**
 * One aggregate query.
 *
 * Throws with the API's own message on a non-2xx, so a bad token or a project
 * without Web Analytics enabled reaches the admin as the reason it failed
 * rather than as an empty chart.
 */
async function aggregate(
  config: VercelAnalyticsConfig,
  scope: Scope,
  params: { since: string; until: string; by: string; limit?: number }
): Promise<AggregateRow[]> {
  const query = new URLSearchParams({
    projectId: config.projectId,
    since: params.since,
    until: params.until,
    by: params.by,
    ...scopeParams(scope)
  });
  if (params.limit) query.set("limit", String(params.limit));

  const res = await fetch(`${API_BASE}/visits/aggregate?${query.toString()}`, {
    headers: { Authorization: `Bearer ${config.token}`, Accept: "application/json" }
  });

  const body: any = await res.json().catch(() => null);
  if (!res.ok) {
    const reason = body?.error?.message || body?.message || `HTTP ${res.status}`;
    throw new Error(reason);
  }
  return Array.isArray(body?.data) ? body.data : [];
}

const num = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const sum = (rows: AggregateRow[], key: "pageviews" | "visitors"): number =>
  rows.reduce((total, row) => total + num(row[key]), 0);

/** Rows reshaped for the dashboard, with the dimension under a known key. */
function toNamed(rows: AggregateRow[], dimension: string): Array<{ name: string; pageviews: number; visitors: number }> {
  return rows.map(row => ({
    name: String(row[dimension] ?? row.name ?? "Unknown") || "Unknown",
    pageviews: num(row.pageviews),
    visitors: num(row.visitors)
  }));
}

export interface VercelAnalyticsSummary {
  configured: true;
  since: string;
  until: string;
  rangeDays: number;
  totals: { pageviews: number; visitors: number };
  daily: Array<{ date: string; pageviews: number; visitors: number }>;
  topRoutes: Array<{ name: string; pageviews: number; visitors: number }>;
  topCountries: Array<{ name: string; pageviews: number; visitors: number }>;
  topReferrers: Array<{ name: string; pageviews: number; visitors: number }>;
  devices: Array<{ name: string; pageviews: number; visitors: number }>;
  /** Dimensions Vercel refused or has no data for, so the UI can say so. */
  partial: string[];
  /** Which Vercel account answered, and how that was determined. */
  account: { team: string | null; detectedFrom: string };
  fetchedAt: string;
}

export type VercelAnalyticsResult =
  | VercelAnalyticsSummary
  | { configured: false; missing: string[] }
  | { configured: true; error: string };

/**
 * A short cache.
 *
 * The dashboard re-renders and re-fetches freely, and Vercel's API is rate
 * limited. Serverless instances each keep their own copy, which is fine: the
 * point is to absorb a burst from one open dashboard, not to be a shared cache.
 */
const CACHE_MS = 60_000;
let cache: { key: string; at: number; value: VercelAnalyticsResult } | null = null;

export async function fetchWebAnalytics(rangeDays = DEFAULT_RANGE_DAYS): Promise<VercelAnalyticsResult> {
  const days = Math.max(1, Math.min(365, Math.floor(rangeDays) || DEFAULT_RANGE_DAYS));

  const cfg = readConfig();
  if (cfg.ok === false) return { configured: false, missing: cfg.missing };

  const cacheKey = `${days}:${cfg.config.projectId}`;
  if (cache && cache.key === cacheKey && Date.now() - cache.at < CACHE_MS) return cache.value;

  // Worked out once and cached: a team-owned project needs teamId, a personal
  // one must not have it, and nobody should have to find that out by hand.
  const { scope, detectedFrom } = await resolveScope(cfg.config);

  const until = new Date();
  const since = new Date(until.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  const range = { since: isoDay(since), until: isoDay(until) };

  const partial: string[] = [];

  // Each dimension is asked for separately so one unsupported or empty grouping
  // degrades to a missing panel rather than losing the whole page.
  const ask = async (by: string, limit?: number): Promise<AggregateRow[]> => {
    try {
      return await aggregate(cfg.config, scope, { ...range, by, limit });
    } catch (err: any) {
      console.warn(`[Vercel Analytics] "${by}" unavailable: ${err?.message}`);
      partial.push(by);
      return [];
    }
  };

  let daily: AggregateRow[];
  try {
    daily = await aggregate(cfg.config, scope, { ...range, by: "day" });
  } catch (err: any) {
    // The daily query is the one that must work: it carries the totals, and if
    // it fails the token, project or plan is wrong. Reported as an error rather
    // than as zero visitors, which would read as "nobody came".
    console.error("[Vercel Analytics] request failed:", err?.message);
    const value: VercelAnalyticsResult = { configured: true, error: err?.message || "Vercel did not answer." };
    cache = { key: cacheKey, at: Date.now(), value };
    return value;
  }

  const [routes, countries, referrers, devices] = await Promise.all([
    ask("route", 8),
    ask("country", 6),
    ask("referrerHostname", 6),
    ask("deviceType", 5)
  ]);

  const value: VercelAnalyticsSummary = {
    configured: true,
    since: range.since,
    until: range.until,
    rangeDays: days,
    totals: { pageviews: sum(daily, "pageviews"), visitors: sum(daily, "visitors") },
    daily: daily.map(row => ({
      date: String(row.timestamp ?? row.day ?? "").slice(0, 10),
      pageviews: num(row.pageviews),
      visitors: num(row.visitors)
    })),
    topRoutes: toNamed(routes, "route"),
    topCountries: toNamed(countries, "country"),
    topReferrers: toNamed(referrers, "referrerHostname"),
    devices: toNamed(devices, "deviceType"),
    partial,
    account: { team: scope ? scope.label : null, detectedFrom },
    fetchedAt: new Date().toISOString()
  };

  cache = { key: cacheKey, at: Date.now(), value };
  return value;
}

/** Clears the cache, so a manual refresh in the dashboard really refetches. */
export function clearCache(): void {
  cache = null;
  clearScopeCache();
}
