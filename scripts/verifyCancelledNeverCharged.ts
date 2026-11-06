/**
 * Checks that a cancelled subscription can never be seen as chargeable.
 *
 *   npm run verify:cancelled-never-charged
 *
 * Offline: it exercises the two pure status rules only, and opens no store.
 *
 * These rules exist because of a real charge. PS65700's plan was cancelled at
 * 2026-09-21T04:48:30 and its card was charged again at 17:28 the same day,
 * under SUB-ORD-PS65700-R20260920. Cancelling writes to Neon and to the JSON
 * store in two separate steps; the Neon write failed silently, the renewal
 * worker's loader asked Neon only for status='active', and the stale row won
 * the merge. The store's cancellation was invisible to the thing taking money.
 *
 * So the asymmetry below is the whole point: when the two stores disagree, the
 * status that does NOT permit a charge wins. Missing a payment that was owed is
 * recoverable on the next run; charging someone who cancelled is not.
 */
import {
  effectiveSubscriptionStatus,
  isChargeableStatus
} from '../backend/services/subscriptionCron';

let failed = 0;
const check = (name: string, got: unknown, want: unknown) => {
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);
};

console.log('-- when the two stores disagree, the non-chargeable status wins --');
// Argument order is (storeStatus, prismaStatus), as the loader passes them.
check('the exact PS65700 case: store cancelled, Neon stale active',
  effectiveSubscriptionStatus('cancelled', 'active'), 'cancelled');
check('the mirror: Neon cancelled, store stale active',
  effectiveSubscriptionStatus('active', 'cancelled'), 'cancelled');
check('deleted beats active', effectiveSubscriptionStatus('deleted', 'active'), 'deleted');
check('past_due beats active', effectiveSubscriptionStatus('past_due', 'active'), 'past_due');
check('paused beats active', effectiveSubscriptionStatus('paused', 'active'), 'paused');
check('both active stays active', effectiveSubscriptionStatus('active', 'active'), 'active');

console.log('\n-- one side missing --');
check('only the store knows it', effectiveSubscriptionStatus('cancelled', undefined), 'cancelled');
check('only Neon knows it', effectiveSubscriptionStatus(undefined, 'cancelled'), 'cancelled');
check('only the store, still active', effectiveSubscriptionStatus('active', undefined), 'active');
check('only Neon, still active', effectiveSubscriptionStatus(undefined, 'active'), 'active');
check('neither knows anything', effectiveSubscriptionStatus(undefined, undefined), '');
check('empty strings are not a status', effectiveSubscriptionStatus('', 'cancelled'), 'cancelled');

console.log('\n-- casing and padding cannot smuggle a status past the check --');
check('padded and capitalised active', effectiveSubscriptionStatus('  Active ', 'ACTIVE'), 'active');
check('capitalised cancellation still wins', effectiveSubscriptionStatus('Cancelled', 'active'), 'cancelled');

console.log('\n-- only "active" may be charged --');
check('active is chargeable', isChargeableStatus('active'), true);
check('ACTIVE is chargeable', isChargeableStatus(' ACTIVE '), true);
for (const s of ['cancelled', 'deleted', 'paused', 'past_due', 'trialing', 'subscribed', 'unverifiable', '', null, undefined]) {
  check(`${JSON.stringify(s)} is NOT chargeable`, isChargeableStatus(s), false);
}

console.log(`\n${failed === 0 ? 'All checks passed.' : `${failed} check(s) FAILED.`}`);
process.exit(failed ? 1 : 0);
