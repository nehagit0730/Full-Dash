import { useState, useEffect, useCallback, useRef } from 'react';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export function useRecaptcha() {
  // No placeholder key. The old default was a made-up value ending in zeros,
  // which Google rejects, so the widget never loaded and every caller fell
  // through to a fabricated token.
  const [siteKey, setSiteKey] = useState<string>(
    (import.meta as any).env?.VITE_RECAPTCHA_SITE_KEY || ''
  );
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const scriptLoadedRef = useRef<boolean>(false);

  // Fetch configured site key from backend settings if available
  useEffect(() => {
    let isMounted = true;
    fetch('/api/email/recaptcha-settings')
      .then(async (res) => {
        if (!res.ok) return null;
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await res.json();
        }
        return null;
      })
      .then((data) => {
        if (isMounted && data && data.siteKey && typeof data.siteKey === 'string' && data.siteKey.trim().length > 0) {
          setSiteKey(data.siteKey.trim());
        }
      })
      .catch((err) => {
        console.warn('[useRecaptcha] Could not fetch site key from backend settings:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamically load Google reCAPTCHA v3 script
  useEffect(() => {
    if (!siteKey || scriptLoadedRef.current) return;

    // Check if script already in document
    const scriptId = 'google-recaptcha-v3-script';
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      setIsLoaded(true);
      scriptLoadedRef.current = true;
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
      scriptLoadedRef.current = true;
      console.log('[useRecaptcha] Google reCAPTCHA v3 script successfully loaded.');
    };

    script.onerror = () => {
      console.warn('[useRecaptcha] Failed to load Google reCAPTCHA script (adblocker or network error).');
      setError('Failed to load reCAPTCHA script.');
      setIsLoaded(true); // set loaded to true so executeRecaptcha can fallback gracefully
    };

    document.head.appendChild(script);
  }, [siteKey]);

  // Returns a real Google token, or an empty string when reCAPTCHA is not
  // configured or could not run. It never invents a token: the previous
  // fallbacks produced strings the server had been coded to accept, so a
  // blocked, timed-out or unconfigured captcha still reported a pass. An
  // empty token lets the server apply its own policy -- allowed when
  // reCAPTCHA is switched off, refused when it is switched on.
  const executeRecaptcha = useCallback(
    async (action: string = 'submit'): Promise<string> => {
      if (!siteKey || typeof window === 'undefined' || !window.grecaptcha) return '';

      try {
        return await new Promise<string>((resolve) => {
          const timeout = setTimeout(() => {
            console.warn('[useRecaptcha] reCAPTCHA execution timed out.');
            resolve('');
          }, 4000);

          window.grecaptcha!.ready(() => {
            window.grecaptcha!
              .execute(siteKey, { action })
              .then((token) => {
                clearTimeout(timeout);
                resolve(token || '');
              })
              .catch((err) => {
                clearTimeout(timeout);
                console.warn('[useRecaptcha] grecaptcha.execute error:', err);
                resolve('');
              });
          });
        });
      } catch (err) {
        console.warn('[useRecaptcha] Exception during executeRecaptcha:', err);
        return '';
      }
    },
    [siteKey]
  );

  return {
    siteKey,
    isLoaded,
    error,
    executeRecaptcha
  };
}
