/**
 * Checks that the dashboard recognises a dead admin session.
 *
 *   npm run verify:admin-session
 *
 * Offline, and it touches no real credentials: it mints its own tokens with a
 * throwaway AUTH_SECRET and reads them back with the browser-side helpers, so
 * the client's view of a token is tested against a token the SERVER actually
 * signed rather than a handmade string.
 *
 * The bug this guards: the dashboard asked only whether a token STRING existed.
 * An admin who left the tab open overnight came back to an eight-hour token that
 * had died in the small hours — the shell rendered, every /api/ call 401'd, and
 * the panels looked broken rather than saying "sign in again".
 */

// A secret of our own, set before anything reads it. Never the real one.
process.env.AUTH_SECRET = 'verify-admin-session-throwaway-secret';

// The client helpers read sessionStorage; Node has none, so give them one.
const store = new Map<string, string>();
(globalThis as any).sessionStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k)
};
(globalThis as any).localStorage = (globalThis as any).sessionStorage;

async function main() {
  const { signAdminToken, verifyAdminToken } = await import('../backend/services/adminAuth');
  const {
    setAdminToken,
    clearAdminToken,
    hasValidAdminSession,
    adminTokenExpiresAt,
    adminSessionTimeRemaining,
    clearAdminSession
  } = await import('../src/lib/adminApi');

  let failed = 0;
  const check = (name: string, got: unknown, want: unknown) => {
    const ok = got === want;
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);
  };

  console.log('-- no token at all --');
  clearAdminToken();
  check('no session', hasValidAdminSession(), false);
  check('no expiry to read', adminTokenExpiresAt(), null);
  check('no time remaining', adminSessionTimeRemaining(), 0);

  console.log('\n-- a freshly minted 8-hour token --');
  const fresh = signAdminToken('admin@pouch-supply.com');
  setAdminToken(fresh);
  check('the server accepts it', Boolean(verifyAdminToken(fresh)), true);
  check('the dashboard sees a live session', hasValidAdminSession(), true);
  const remaining = adminSessionTimeRemaining();
  const eightHours = 8 * 60 * 60 * 1000;
  check('roughly eight hours left', remaining > eightHours - 60_000 && remaining <= eightHours, true);

  console.log('\n-- the overnight case: the same token, expired --');
  // Exactly the shape of a token minted yesterday morning.
  const stale = signAdminToken('admin@pouch-supply.com', -60);
  setAdminToken(stale);
  check('the server now rejects it', verifyAdminToken(stale), null);
  check('and so does the dashboard', hasValidAdminSession(), false);
  check('no time remaining', adminSessionTimeRemaining(), 0);
  check('its expiry is still readable, and in the past', (adminTokenExpiresAt() ?? Infinity) < Date.now(), true);

  console.log('\n-- a token on the edge --');
  setAdminToken(signAdminToken('admin@pouch-supply.com', 5));
  check('five seconds left still counts as live', hasValidAdminSession(), true);

  console.log('\n-- rubbish in storage is not a session --');
  for (const junk of ['', 'not-a-token', 'v1.@@@.sig', 'v1..sig']) {
    setAdminToken(junk);
    check(`${JSON.stringify(junk)} gives no session`, hasValidAdminSession(), false);
  }

  console.log('\n-- signing out clears both the token and the view flag --');
  setAdminToken(signAdminToken('admin@pouch-supply.com'));
  (globalThis as any).sessionStorage.setItem('ps_admin_authenticated', 'true');
  clearAdminSession();
  check('token gone', hasValidAdminSession(), false);
  check('view flag gone', (globalThis as any).sessionStorage.getItem('ps_admin_authenticated'), null);

  // ---------------------------------------------------------------------
  // The other half: every /api/ call runs through one fetch wrapper, and that
  // is where a rejection has to be noticed. Driven here with a stub so the
  // wrapper's real code decides, not a re-implementation of it.
  // ---------------------------------------------------------------------
  console.log('\n-- the fetch wrapper notices a dead session --');

  const target = new EventTarget();
  let lastStatus = 200;
  (globalThis as any).window = {
    location: { origin: 'https://shop.example' },
    fetch: async () => new Response('{}', { status: lastStatus }),
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target)
  };

  let events: string[] = [];
  target.addEventListener('ps:admin-session-expired', (e: any) => events.push(e?.detail?.reason));

  const { installAdminFetch, resetAdminSessionExpiryNotice } = await import('../src/lib/adminApi');
  installAdminFetch();
  const call = () => (globalThis as any).window.fetch('https://shop.example/api/orders');

  const attempt = async (label: string, token: string, status: number, want: string[]) => {
    resetAdminSessionExpiryNotice();
    events = [];
    lastStatus = status;
    setAdminToken(token);
    await call();
    check(label, JSON.stringify(events), JSON.stringify(want));
  };

  const live = signAdminToken('admin@pouch-supply.com');
  const dead = signAdminToken('admin@pouch-supply.com', -60);

  await attempt('a live token on a 200 raises nothing', live, 200, []);
  await attempt('an expired token is caught before the call', dead, 200, ['expired']);
  await attempt('a live token rejected with 401 is caught', live, 401, ['rejected']);
  await attempt('a live token rejected with 403 is caught', live, 403, ['rejected']);

  // The burst case: a dashboard load fires many calls at once, and the admin
  // should be told once, not once per panel.
  resetAdminSessionExpiryNotice();
  events = [];
  lastStatus = 401;
  setAdminToken(live);
  await Promise.all([call(), call(), call(), call(), call()]);
  check('five simultaneous 401s announce once', events.length, 1);

  console.log(`\n${failed === 0 ? 'All checks passed.' : `${failed} check(s) FAILED.`}`);
  process.exit(failed ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
