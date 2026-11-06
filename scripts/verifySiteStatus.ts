/**
 * Checks the live / password-protected site switch.
 *
 *   npm run verify:site-status
 *
 * Runs against the real service and the real StoreSetting row, then puts the
 * setting back exactly as it found it — including when a check fails.
 *
 * The one outcome that must never happen is an admin locking themselves out of
 * the control that unlocks the site, so the rules around that are pinned down
 * here rather than trusted.
 */
import 'dotenv/config';
import { fetchStoreSetting, saveStoreSetting } from '../serverDb';
import {
  checkPassword,
  getPublicSiteStatus,
  getSiteStatus,
  issuePass,
  saveSiteStatus,
  verifyPass
} from '../backend/services/siteStatus';

let failed = 0;
const check = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);
};

async function main() {
  console.log('\n=== Website status ===\n');

  // Deep-cloned, not held by reference. fetchStoreSetting can hand back an
  // object the in-memory settings cache also holds, and the writes below then
  // mutate the very snapshot meant to restore it — which is how a test password
  // hash survived a run and sat in the stored setting afterwards.
  const raw = await fetchStoreSetting('site_status', null);
  const original = raw ? JSON.parse(JSON.stringify(raw)) : null;
  console.log(`Current mode: ${(original as any)?.mode ?? 'live (unset)'} — will be restored at the end.\n`);

  try {
    console.log('-- a password is required before locking --');
    await saveStoreSetting('site_status', { mode: 'live', passwordHash: null, salt: null });
    const refused = await saveSiteStatus({ mode: 'password' });
    check('switching to password with none set is refused', refused.ok, false);
    check('and the site stays live', (await getSiteStatus()).mode, 'live');

    console.log('\n-- setting a password and locking --');
    const locked = await saveSiteStatus({ mode: 'password', password: 'launch-2026', headline: 'Back soon', message: 'Doing some work.' });
    check('it saves', locked.ok, true);
    check('the mode is password', (await getSiteStatus()).mode, 'password');

    console.log('\n-- what the public is told --');
    const pub: any = await getPublicSiteStatus();
    check('the mode is public', pub.mode, 'password');
    check('the heading is public', pub.headline, 'Back soon');
    check('the hash is NOT public', 'passwordHash' in pub, false);
    check('the salt is NOT public', 'salt' in pub, false);

    console.log('\n-- the password --');
    check('the right password is accepted', await checkPassword('launch-2026'), true);
    check('a wrong one is refused', await checkPassword('launch-2025'), false);
    check('an empty one is refused', await checkPassword(''), false);
    check('near-miss casing is refused', await checkPassword('Launch-2026'), false);

    console.log('\n-- passes --');
    const pass = await issuePass();
    check('a pass issued now is valid', await verifyPass(pass), true);
    check('a made-up pass is not', await verifyPass('123456789.deadbeef'), false);
    check('an empty pass is not', await verifyPass(''), false);
    check('a tampered signature is not', await verifyPass(`${pass.split('.')[0]}.0000`), false);

    console.log('\n-- changing the password turns everyone out --');
    await saveSiteStatus({ mode: 'password', password: 'a-new-word' });
    check('the old pass stops working', await verifyPass(pass), false);
    check('the old password stops working', await checkPassword('launch-2026'), false);
    check('the new password works', await checkPassword('a-new-word'), true);

    console.log('\n-- going live again --');
    const live = await saveSiteStatus({ mode: 'live' });
    check('it saves', live.ok, true);
    check('the mode is live', (await getSiteStatus()).mode, 'live');
    check('and no password is needed while live', (await getPublicSiteStatus()).mode, 'live');

    console.log('\n-- wording is kept and bounded --');
    await saveSiteStatus({ mode: 'live', headline: 'x'.repeat(400), message: 'y'.repeat(900) });
    const bounded = await getSiteStatus();
    check('the heading is capped at 120', bounded.headline.length, 120);
    check('the message is capped at 500', bounded.message.length, 500);

    console.log('\n-- a short password is refused --');
    const short = await saveSiteStatus({ mode: 'password', password: 'ab' });
    check('under four characters is refused', short.ok, false);
  } finally {
    // Whatever happened, leave the site exactly as it was found.
    if (original) await saveStoreSetting('site_status', original);
    else await saveStoreSetting('site_status', { mode: 'live', headline: '', message: '', passwordHash: null, salt: null, updatedAt: null, updatedBy: null });
    const restored = await getSiteStatus();
    console.log(`\nRestored mode: ${restored.mode}`);
    if (restored.mode !== ((original as any)?.mode ?? 'live')) {
      console.error('WARNING: the original setting was not restored cleanly.');
      failed++;
    }
  }

  console.log(`\n${failed === 0 ? 'All checks passed.' : `${failed} check(s) FAILED.`}`);
  process.exit(failed ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
