/**
 * Session token handling for both admins and shoppers.
 *
 * The admin dashboard and the storefront are the same React app (src/App.tsx),
 * and API calls are spread across dozens of components that all use bare
 * `fetch`. Rather than hunt down every call site — where a single miss is a
 * feature that silently 401s — the token is attached by a one-time wrapper
 * around `window.fetch`.
 *
 * The wrapper only adds the header when:
 *   - a token is actually stored (so signed-out visitors send nothing), and
 *   - the request is same-origin and under /api/ (so the token is never sent to
 *     a third party), and
 *   - the caller has not already set its own Authorization header (so the
 *     Google sign-in flow, which sends a Google token, is left alone).
 *
 * An admin token wins when both are present: someone working in the dashboard
 * while signed in as a shopper should act as the administrator.
 */

const TOKEN_KEY = 'ps_admin_token';

/**
 * Customer tokens live in localStorage, not sessionStorage: a shopper expects to
 * stay signed in across tabs and restarts, and the token's own 30-day expiry is
 * what ends the session. `ps_logged_in_customer` is stored the same way.
 */
const CUSTOMER_TOKEN_KEY = 'ps_customer_token';

export function getCustomerToken(): string | null {
  try {
    return localStorage.getItem(CUSTOMER_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setCustomerToken(token: string): void {
  try {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  } catch {
    console.warn('[Auth] Could not persist the customer token; storage is unavailable.');
  }
}

export function clearCustomerToken(): void {
  try {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  } catch {
    /* nothing to clear */
  }
}

export function getAdminToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    // Private mode or blocked storage. Treated as "not signed in".
    return null;
  }
}

export function setAdminToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    console.warn('[Admin Auth] Could not persist the admin token; storage is unavailable.');
  }
}

export function clearAdminToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* nothing to clear */
  }
}

/** Fired when an admin session is found to be over. Carries a `reason`. */
export const ADMIN_SESSION_EXPIRED_EVENT = 'ps:admin-session-expired';

/** The flag App.tsx reads to decide whether to render the dashboard. */
const ADMIN_FLAG_KEY = 'ps_admin_authenticated';

/**
 * When the stored admin token stops being accepted, in epoch milliseconds.
 *
 * The token is `v1.<base64url payload>.<signature>` and the payload is plain
 * JSON carrying `exp` — it is signed, not encrypted, so reading it here is
 * expected. This is only used to decide what to SHOW; the server re-verifies
 * the signature on every request and is the thing that actually says no.
 *
 * Returns null when there is no token or it cannot be read, which callers treat
 * as "no usable session".
 */
export function adminTokenExpiresAt(): number | null {
  const token = getAdminToken();
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const exp = JSON.parse(json)?.exp;
    return typeof exp === 'number' && Number.isFinite(exp) ? exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Is there an admin session that the API would still accept?
 *
 * The dashboard used to ask only whether a token STRING existed. An admin who
 * left the tab open overnight came back to a full dashboard built on an
 * eight-hour token that had died in the small hours: the shell rendered, every
 * /api/ call 401'd, and the result was a dashboard with panels that looked
 * broken rather than a prompt to sign in again.
 */
export function hasValidAdminSession(): boolean {
  const expiresAt = adminTokenExpiresAt();
  return expiresAt !== null && expiresAt > Date.now();
}

/** Milliseconds until the session ends, or 0 if it already has. */
export function adminSessionTimeRemaining(): number {
  const expiresAt = adminTokenExpiresAt();
  if (expiresAt === null) return 0;
  return Math.max(0, expiresAt - Date.now());
}

/** Ends the admin session locally: the token and the view flag go together. */
export function clearAdminSession(): void {
  clearAdminToken();
  try {
    sessionStorage.removeItem(ADMIN_FLAG_KEY);
  } catch {
    /* nothing to clear */
  }
}

/**
 * Announces that the admin session is over, at most once.
 *
 * A dashboard load fires a dozen parallel API calls, so an expired session
 * produces a burst of 401s. Without this latch each one would raise its own
 * event and the modal would be told to open a dozen times. The latch lifts on
 * the next successful sign-in.
 */
let expiryAnnounced = false;

export function notifyAdminSessionExpired(reason: 'expired' | 'rejected'): void {
  if (expiryAnnounced || typeof window === 'undefined') return;
  expiryAnnounced = true;
  window.dispatchEvent(new CustomEvent(ADMIN_SESSION_EXPIRED_EVENT, { detail: { reason } }));
}

export function resetAdminSessionExpiryNotice(): void {
  expiryAnnounced = false;
}

/** Resolves a request input to a URL string without throwing on odd inputs. */
function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return (input as Request)?.url || '';
}

function isSameOriginApiCall(rawUrl: string): boolean {
  if (!rawUrl) return false;
  try {
    const url = new URL(rawUrl, window.location.origin);
    if (url.origin !== window.location.origin) return false;
    return url.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

let installed = false;

/**
 * Installs the wrapper. Safe to call more than once — a second call is ignored,
 * which matters because React 18 StrictMode mounts effects twice in development
 * and double-wrapping would nest the patches.
 */
export function installAdminFetch(): void {
  if (installed || typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const adminToken = getAdminToken();
    const token = adminToken || getCustomerToken();
    if (!token || !isSameOriginApiCall(urlOf(input))) {
      return originalFetch(input, init);
    }

    // An admin token that has already run out is not worth sending, and the
    // person needs telling now rather than after a screen of empty panels.
    if (adminToken && !hasValidAdminSession()) {
      notifyAdminSessionExpired('expired');
    }

    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    // Never overwrite an Authorization the caller set deliberately — the
    // customer Google sign-in sends its own bearer token to /api/auth.
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await originalFetch(input, { ...init, headers });

    // The server is the authority on whether the token is still good — a clock
    // difference, a redeploy with a new AUTH_SECRET or a revoked account all
    // produce a rejection the expiry check above cannot predict. Caught here,
    // at the one place every /api/ call passes through, rather than in each of
    // the dozens of call sites that would otherwise have to handle it.
    if (adminToken && (response.status === 401 || response.status === 403)) {
      notifyAdminSessionExpired('rejected');
    }

    return response;
  };
}

/**
 * Endpoints that mint a customer session. Their responses carry `token`.
 *
 * The token is captured here rather than at each call site because the app
 * decides "this is the current customer" in more than twenty places across
 * App.tsx, CustomerAccount, CustomerDrawer and lib/auth. Patching each one
 * invites the failure this is meant to prevent: a login path that quietly
 * stores no token, leaving the shopper signed in to the UI but unable to load
 * their own orders.
 */
const CUSTOMER_SESSION_ENDPOINTS = [
  '/api/customers/login',
  '/api/customers/signup',
  '/api/customers/google-login',
  '/api/customers/verify-email',
  '/api/auth/google/verify'
];

function mintsCustomerSession(rawUrl: string): boolean {
  try {
    const { pathname } = new URL(rawUrl, window.location.origin);
    return CUSTOMER_SESSION_ENDPOINTS.includes(pathname);
  } catch {
    return false;
  }
}

/**
 * Captures the customer token from sign-in responses.
 *
 * Installed alongside the header wrapper. Reads a CLONE of the response so the
 * caller still gets an unread body to parse itself.
 */
export function installCustomerSessionCapture(): void {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;

  const previousFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await previousFetch(input, init);

    if (!response.ok || !mintsCustomerSession(urlOf(input))) return response;

    try {
      const body = await response.clone().json();
      if (body?.token) setCustomerToken(body.token);
    } catch {
      // Not JSON, or no token in it. The caller's own handling is unaffected.
    }

    return response;
  };
}

export interface AdminLoginResult {
  ok: boolean;
  /** Message suitable for showing to the person trying to sign in. */
  message?: string;
}

/**
 * Exchanges credentials for a signed token.
 *
 * The dashboard previously compared `admin`/`admin` in the browser and told
 * itself it was authenticated, which no server endpoint ever checked. The check
 * now happens server-side and yields a token the API will actually accept.
 */
export async function adminLogin(email: string, password: string): Promise<AdminLoginResult> {
  let response: Response;
  try {
    response = await fetch('/api/customers/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
  } catch {
    return { ok: false, message: 'Could not reach the server. Check your connection and try again.' };
  }

  const data = await response.json().catch(() => null);

  if (response.ok && data?.token) {
    setAdminToken(data.token);
    return { ok: true };
  }

  if (data?.code === 'ADMIN_AUTH_NOT_CONFIGURED') {
    return {
      ok: false,
      message:
        'Admin sign-in is not configured on the server. Set AUTH_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD, then redeploy.'
    };
  }

  return { ok: false, message: data?.error || 'Invalid admin credentials.' };
}
