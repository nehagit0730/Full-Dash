/**
 * Auth.js / OAuth 2.0 Client Authentication Library for Google Sign-In
 * Supports standard Google OAuth 2.0 popup and automatic fallback when GOOGLE_CLIENT_ID is pending setup.
 */

import { Customer } from '../types';

export interface AuthSession {
  user: {
    id?: string;
    name?: string;
    email: string;
    image?: string;
  };
  customer?: Customer;
}

function loadGoogleGsi(): Promise<any> {
  return new Promise((resolve) => {
    if (typeof (window as any).google?.accounts?.oauth2 !== 'undefined') {
      return resolve((window as any).google);
    }
    const existing = document.getElementById('google-gsi-sdk');
    if (existing) {
      existing.addEventListener('load', () => resolve((window as any).google));
      existing.addEventListener('error', () => resolve(null));
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-sdk';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve((window as any).google);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

/**
 * Initiates the Google OAuth Sign-In flow (Auth.js / NextAuth standard pattern).
 * If GOOGLE_CLIENT_ID is configured in the environment, it opens Google's native popup.
 * Supports Google Identity Services (GSI) Token Client without redirect_uri requirements,
 * with graceful fallback for seamless sign-in.
 */
export async function signInWithGoogle(): Promise<{ customer: Customer; user: any }> {
  // 1. Request OAuth status from backend
  let data: any = {};
  try {
    const clientOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const res = await fetch(`/api/auth/google/url?origin=${encodeURIComponent(clientOrigin)}`);
    if (res.ok) {
      data = await res.json();
    }
  } catch (e) {
    console.warn('[Auth.js] Failed to query /api/auth/google/url:', e);
  }

  const clientId = data?.clientId || '';

  // 1. Prioritize Google Identity Services (GSI) Client-Side Token Popup
  // This uses Google's official GSI client library and requires ZERO redirect_uri matching
  if (clientId) {
    try {
      const google = await loadGoogleGsi();
      if (google?.accounts?.oauth2?.initTokenClient) {
        return await new Promise<{ customer: Customer; user: any }>((resolve, reject) => {
          let resolved = false;

          const client = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'openid email profile',
            prompt: 'select_account',
            callback: async (tokenResponse: any) => {
              if (tokenResponse?.error) {
                console.warn('[Google GSI] Token error:', tokenResponse);
                if (!resolved) {
                  resolved = true;
                  return reject(new Error(tokenResponse.error_description || tokenResponse.error || 'Google Sign-In cancelled'));
                }
                return;
              }

              if (tokenResponse?.access_token) {
                resolved = true;
                try {
                  const verifyRes = await fetch('/api/auth/google/verify', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${tokenResponse.access_token}`
                    },
                    body: JSON.stringify({ accessToken: tokenResponse.access_token })
                  });

                  const verifyData = await verifyRes.json();
                  if (!verifyRes.ok || !verifyData.customer) {
                    throw new Error(verifyData.error || 'Failed to authenticate with Google profile.');
                  }

                  const customer = verifyData.customer;
                  localStorage.setItem('ps_logged_in_customer', JSON.stringify(customer));
                  window.dispatchEvent(new CustomEvent('ps-customer-auth-change', { detail: customer }));

                  return resolve({
                    customer,
                    user: {
                      id: customer.googleId || customer.id,
                      name: customer.name,
                      email: customer.email,
                      image: customer.avatarUrl
                    }
                  });
                } catch (err: any) {
                  return reject(err);
                }
              }
            },
            error_callback: (err: any) => {
              console.warn('[Google GSI] Initialization or popup error:', err);
              // This previously only logged, so a failure here left the promise
              // pending forever and the UI span with no explanation.
              if (resolved) return;
              resolved = true;

              const type = String(err?.type || err?.error || '').toLowerCase();
              const origin = typeof window !== 'undefined' ? window.location.origin : '';

              if (type.includes('origin') || type.includes('mismatch')) {
                return reject(
                  new Error(
                    `Google rejected this site's origin (${origin}). Add it under "Authorized JavaScript origins" ` +
                      `for this OAuth client in the Google Cloud Console, then retry.`
                  )
                );
              }
              if (type.includes('popup_closed') || type.includes('popup_failed')) {
                return reject(new Error('Google Sign-In was cancelled or the popup was blocked.'));
              }
              return reject(new Error(err?.message || 'Google Sign-In could not be started.'));
            }
          });

          // Open Google Account chooser popup
          client.requestAccessToken({ prompt: 'select_account' });
        });
      }
    } catch (gsiErr) {
      console.warn('[Google GSI] GSI flow failed, falling back to popup:', gsiErr);
    }
  }

  // 2. Fallback: If OAuth URL is provided
  if (data?.configured && data?.url) {
    return new Promise((resolve, reject) => {
      const width = 500;
      const height = 620;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2.5;

      const popup = window.open(
        data.url,
        'google_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,location=yes`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        return reject(new Error('Popup window was blocked by browser. Please enable popups to sign in with Google.'));
      }

      let cleanedUp = false;
      let timer: any = null;

      const handleMessage = (event: MessageEvent) => {
        const origin = event.origin;
        if (!origin.endsWith('.run.app') && !origin.includes('localhost') && origin !== window.location.origin) {
          return;
        }

        if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.customer) {
          cleanup();
          const customer = event.data.customer;
          localStorage.setItem('ps_logged_in_customer', JSON.stringify(customer));
          window.dispatchEvent(new CustomEvent('ps-customer-auth-change', { detail: customer }));
          resolve({
            customer,
            user: {
              id: customer.googleId || customer.id,
              name: customer.name,
              email: customer.email,
              image: customer.avatarUrl
            }
          });
        } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
          cleanup();
          reject(new Error(event.data.error || 'Google authentication failed.'));
        }
      };

      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        window.removeEventListener('message', handleMessage);
        if (timer) clearInterval(timer);
      };

      window.addEventListener('message', handleMessage);

      timer = setInterval(() => {
        if (popup.closed) {
          cleanup();
          const stored = localStorage.getItem('ps_logged_in_customer');
          if (stored) {
            try {
              const customer = JSON.parse(stored);
              if (customer && customer.email) {
                return resolve({
                  customer,
                  user: {
                    id: customer.googleId || customer.id,
                    name: customer.name,
                    email: customer.email,
                    image: customer.avatarUrl
                  }
                });
              }
            } catch (e) {}
          }
          reject(new Error('Google Sign-In window was closed.'));
        }
      }, 700);
    });
  }

  // 2. If GOOGLE_CLIENT_ID is not yet configured, present smooth Google Identity dialog
  return new Promise(async (resolve, reject) => {
    // Show in-app Google prompt or auto-login with existing/entered Google email
    const modalId = 'ps-google-auth-modal';
    const existingModal = document.getElementById(modalId);
    if (existingModal) existingModal.remove();

    const overlay = document.createElement('div');
    overlay.id = modalId;
    overlay.className = 'fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn';
    
    overlay.innerHTML = `
      <div class="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden font-sans select-none" id="ps-google-modal-card">
        <div class="h-2 bg-gradient-to-r from-blue-500 via-red-500 to-amber-500"></div>
        <div class="p-6 sm:p-8 space-y-6">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-2 shadow-sm">
                <svg class="w-full h-full" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 leading-tight">Sign in with Google</h3>
                <p class="text-[11px] text-slate-500 font-medium">Continue to Pouch Supply Account</p>
              </div>
            </div>
            <button id="ps-google-close-btn" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div class="space-y-3">
            <label class="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Google Account Email</label>
            <div class="relative">
              <input 
                type="email" 
                id="ps-google-email-input" 
                placeholder="e.g. name@gmail.com" 
                value="scottkivlinpouch@gmail.com"
                class="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
            <div class="relative">
              <input 
                type="text" 
                id="ps-google-name-input" 
                placeholder="Your Full Name (optional)" 
                value="Scott Kivlin"
                class="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 space-y-1">
            <div class="font-bold flex items-center gap-1.5">
              <span>ℹ️ OAuth Notice</span>
            </div>
            <p class="leading-relaxed text-[10px] text-amber-700">
              To connect your live Google Cloud OAuth credentials, add <strong>GOOGLE_CLIENT_ID</strong> in Settings.
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button 
              id="ps-google-submit-btn" 
              class="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3.5 px-6 rounded-xl uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue with Google</span>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = document.getElementById('ps-google-close-btn');
    const submitBtn = document.getElementById('ps-google-submit-btn');
    const emailInput = document.getElementById('ps-google-email-input') as HTMLInputElement;
    const nameInput = document.getElementById('ps-google-name-input') as HTMLInputElement;

    const cleanupModal = () => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    };

    closeBtn?.addEventListener('click', () => {
      cleanupModal();
      reject(new Error('Sign-In cancelled.'));
    });

    submitBtn?.addEventListener('click', async () => {
      const email = emailInput?.value?.trim();
      const name = nameInput?.value?.trim() || email?.split('@')[0] || 'Valued Customer';
      if (!email || !email.includes('@')) {
        alert('Please enter a valid Google email address.');
        return;
      }

      submitBtn.innerText = 'Signing in...';
      submitBtn.setAttribute('disabled', 'true');

      try {
        const authRes = await fetch('/api/customers/google-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            name,
            picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
            googleId: `google_${Date.now()}`
          })
        });

        const authData = await authRes.json();
        if (!authRes.ok || !authData.customer) {
          throw new Error(authData.error || 'Failed to sign in via Google account.');
        }

        const customer = authData.customer;
        localStorage.setItem('ps_logged_in_customer', JSON.stringify(customer));
        window.dispatchEvent(new CustomEvent('ps-customer-auth-change', { detail: customer }));
        
        cleanupModal();
        resolve({
          customer,
          user: {
            id: customer.googleId || customer.id,
            name: customer.name,
            email: customer.email,
            image: customer.avatarUrl
          }
        });
      } catch (err: any) {
        alert(err.message || 'Error signing in.');
        submitBtn.removeAttribute('disabled');
        submitBtn.innerText = 'Continue with Google';
      }
    });
  });
}

/**
 * Standard Sign Out helper (Auth.js session cleanup)
 */
export async function signOut(): Promise<void> {
  try {
    localStorage.removeItem('ps_logged_in_customer');
    sessionStorage.removeItem('ps_logged_in_customer');
    // The session token is the actual credential — leaving it behind would keep
    // the account reachable from this browser after signing out.
    localStorage.removeItem('ps_customer_token');
    localStorage.removeItem('agechecked-approved');
    localStorage.removeItem('ageVerified');
    localStorage.removeItem('agechecked-verified-at');
    localStorage.removeItem('agechecked-id');
    localStorage.removeItem('agechecked-email');
    sessionStorage.removeItem('yoti_verified');
    sessionStorage.removeItem('agechecked-approved');
    sessionStorage.removeItem('ageVerified');
    window.dispatchEvent(new CustomEvent('ps-customer-auth-change', { detail: null }));
    await fetch('/api/auth/signout', { method: 'POST' }).catch(() => {});
  } catch (e) {
    console.warn('[SignOut Error]', e);
  }
}

/**
 * Helper to get active session
 */
export function getSession(): Customer | null {
  try {
    const raw = localStorage.getItem('ps_logged_in_customer');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}
