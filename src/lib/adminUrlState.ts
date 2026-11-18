import { useEffect, useRef, useState } from 'react';

/**
 * Dashboard state that survives a refresh and works with back/forward:
 *
 *   /admin-dashboard/<section>/<record>?q=…&status=…
 *
 *  - <section> is the sidebar page (handled by AdminDashboard),
 *  - <record>  is what is open inside it — a product id, "new", a page id…
 *  - query parameters hold searches and filters.
 *
 * Opening or closing a record pushes a history entry (so Back closes it);
 * typing in a search box replaces the current entry (so Back is not flooded).
 */

const BASE = '/admin-dashboard';

export function readAdminPath(): { section: string; recordId: string | null } {
  if (typeof window === 'undefined') return { section: '', recordId: null };
  const path = window.location.pathname;
  if (!path.startsWith(BASE)) return { section: '', recordId: null };
  const segments = path.slice(BASE.length).split('/').filter(Boolean).map(s => {
    try { return decodeURIComponent(s); } catch { return s; }
  });
  return { section: segments[0] || '', recordId: segments[1] || null };
}

export function readQueryParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(key);
}

/** Sets the record segment for `section`, keeping the query string. */
export function writeAdminRecord(section: string, recordId: string | null, mode: 'push' | 'replace' = 'push'): void {
  const target = `${BASE}/${section}${recordId ? `/${encodeURIComponent(recordId)}` : ''}`;
  if (window.location.pathname === target) return;
  const url = target + window.location.search;
  if (mode === 'push') window.history.pushState({}, '', url);
  else window.history.replaceState({}, '', url);
}

/** Sets or clears one query parameter on the current entry. */
export function writeQueryParam(key: string, value: string | null): void {
  const params = new URLSearchParams(window.location.search);
  if (value === null || value === '') params.delete(key);
  else params.set(key, value);
  const qs = params.toString();
  const url = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash;
  if (url !== window.location.pathname + window.location.search + window.location.hash) {
    window.history.replaceState(window.history.state, '', url);
  }
}

/**
 * useState backed by a query parameter while `active` (i.e. while its page is
 * the one shown). The initial value is read from the URL, the URL is updated
 * as the value changes, and returning to the page restores the parameter.
 */
export function useUrlParam<T extends string>(key: string, defaultValue: T, active: boolean): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (!active) return defaultValue;
    const fromUrl = readQueryParam(key);
    return (fromUrl as T) ?? defaultValue;
  });

  // Mirror the value into the URL whenever this page is showing.
  useEffect(() => {
    if (!active) return;
    writeQueryParam(key, value === defaultValue ? null : value);
  }, [key, value, active, defaultValue]);

  // Back/forward: adopt whatever the URL now says.
  const activeRef = useRef(active);
  activeRef.current = active;
  useEffect(() => {
    const onPop = () => {
      if (!activeRef.current) return;
      const fromUrl = readQueryParam(key);
      setValue(((fromUrl as T) ?? defaultValue) as T);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [key, defaultValue]);

  return [value, setValue];
}
