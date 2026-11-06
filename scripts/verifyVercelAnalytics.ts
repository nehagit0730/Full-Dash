/**
 * Checks how the Vercel Analytics bridge behaves in each state.
 *
 *   npm run verify:vercel-analytics
 *
 * The point of these checks is that "we could not ask" and "nobody visited"
 * must never look the same. The dashboard used to invent a traffic figure
 * (completedOrders * 12 + 150); the replacement has to report ignorance
 * honestly instead, or it is no better.
 *
 * It sends one request to api.vercel.com with a deliberately invalid token to
 * prove a rejection surfaces as an error. That call carries no real credential
 * and changes nothing.
 */
import { clearCache, fetchWebAnalytics, readConfig, resolveScope } from '../backend/services/vercelAnalytics';

let failed = 0;
const check = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);
};

const withEnv = async (env: Record<string, string | undefined>, fn: () => Promise<void>) => {
  const saved: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(env)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  clearCache();
  try {
    await fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    clearCache();
  }
};

const NONE = { VERCEL_API_TOKEN: undefined, VERCEL_TOKEN: undefined, VERCEL_PROJECT_ID: undefined, VERCEL_ANALYTICS_PROJECT_ID: undefined, VERCEL_TEAM_ID: undefined, VERCEL_TEAM_SLUG: undefined };

async function main() {
  console.log('\n=== Vercel Analytics bridge ===\n');

  console.log('-- nothing configured --');
  await withEnv(NONE, async () => {
    const cfg = readConfig();
    check('readConfig reports it is not usable', cfg.ok, false);
    check('and names BOTH missing variables', cfg.ok === false ? cfg.missing : null, ['VERCEL_API_TOKEN', 'VERCEL_PROJECT_ID']);

    const result: any = await fetchWebAnalytics(30);
    check('fetch reports not configured', result.configured, false);
    check('with the list to set', result.missing, ['VERCEL_API_TOKEN', 'VERCEL_PROJECT_ID']);
    check('and NO totals — an unknown is not zero', 'totals' in result, false);
  });

  console.log('\n-- token set, project missing --');
  await withEnv({ ...NONE, VERCEL_API_TOKEN: 'tok_placeholder' }, async () => {
    const cfg = readConfig();
    check('only the project is reported missing', cfg.ok === false ? cfg.missing : null, ['VERCEL_PROJECT_ID']);
  });

  console.log('\n-- project supplied by Vercel, token missing --');
  await withEnv({ ...NONE, VERCEL_PROJECT_ID: 'prj_from_system_env' }, async () => {
    const cfg = readConfig();
    check('only the token is reported missing', cfg.ok === false ? cfg.missing : null, ['VERCEL_API_TOKEN']);
  });

  console.log('\n-- team settings are optional --');
  await withEnv({ ...NONE, VERCEL_API_TOKEN: 'tok', VERCEL_PROJECT_ID: 'prj' }, async () => {
    const cfg = readConfig();
    check('a personal project is fully configured', cfg.ok, true);
    check('with no team id', cfg.ok === true ? cfg.config.teamId : 'x', undefined);
  });
  await withEnv({ ...NONE, VERCEL_API_TOKEN: 'tok', VERCEL_PROJECT_ID: 'prj', VERCEL_TEAM_ID: 'team_123' }, async () => {
    const cfg = readConfig();
    check('a team id is carried when given', cfg.ok === true ? cfg.config.teamId : null, 'team_123');
  });

  console.log('\n-- a rejected token surfaces as an error, not as zero traffic --');
  await withEnv({ ...NONE, VERCEL_API_TOKEN: 'invalid-token-for-verification', VERCEL_PROJECT_ID: 'prj_does_not_exist' }, async () => {
    const result: any = await fetchWebAnalytics(7);
    check('it is treated as configured', result.configured, true);
    check('an error is reported', typeof result.error === 'string' && result.error.length > 0, true);
    check('and NO totals are invented', 'totals' in result, false);
    console.log(`        Vercel said: ${String(result.error).slice(0, 110)}`);
  });

  // ---------------------------------------------------------------- scoping
  //
  // Vercel needs `teamId` for a team-owned project and rejects it for a
  // personal one, and provides no system variable for it. Rather than make
  // that a manual step, it is discovered from the token — so the rules for
  // that discovery are worth pinning down.
  console.log('\n-- account scope --');

  await withEnv({ ...NONE, VERCEL_API_TOKEN: 'tok', VERCEL_PROJECT_ID: 'prj', VERCEL_TEAM_ID: 'team_explicit' }, async () => {
    const cfg = readConfig();
    const resolved = await resolveScope((cfg as any).config);
    check('an explicit VERCEL_TEAM_ID is used as given', resolved.scope?.teamId, 'team_explicit');
    check('and no discovery is attempted', resolved.detectedFrom, 'environment');
  });

  await withEnv({ ...NONE, VERCEL_API_TOKEN: 'invalid-token-for-verification', VERCEL_PROJECT_ID: 'prj_does_not_exist' }, async () => {
    const resolved = await resolveScope((readConfig() as any).config);
    // A token that can reach nothing resolves to the personal account and the
    // query then fails loudly — which is right: guessing a team here would
    // turn a credentials problem into a silently empty dashboard.
    check('an unusable token falls back to the personal account', resolved.scope, null);
    check('and reports it did not find a team', resolved.detectedFrom, 'personal-account');
  });

  console.log('\n-- scope is cached, and a refresh clears it --');
  await withEnv({ ...NONE, VERCEL_API_TOKEN: 'tok', VERCEL_PROJECT_ID: 'prj', VERCEL_TEAM_ID: 'team_a' }, async () => {
    const first = await resolveScope((readConfig() as any).config);
    check('resolved once', first.scope?.teamId, 'team_a');
    process.env.VERCEL_TEAM_ID = 'team_b';
    const cached = await resolveScope((readConfig() as any).config);
    check('the cached answer is reused', cached.scope?.teamId, 'team_a');
    clearCache();
    const after = await resolveScope((readConfig() as any).config);
    check('clearing re-resolves it', after.scope?.teamId, 'team_b');
  });

  console.log(`\n${failed === 0 ? 'All checks passed.' : `${failed} check(s) FAILED.`}`);
  process.exit(failed ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
