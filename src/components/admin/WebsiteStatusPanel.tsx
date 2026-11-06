import React, { useCallback, useEffect, useState } from 'react';
import { Globe, Lock, Loader2, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

type Mode = 'live' | 'password';

interface Status {
  mode: Mode;
  headline: string;
  message: string;
  hasPassword: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
}

/**
 * Live / password-protected switch for the public site.
 *
 * Password mode shows visitors a coming-soon page with a password box. It is
 * for keeping work-in-progress away from customers, not for protecting
 * anything secret — which the panel says plainly, because an admin who thinks
 * this seals the site would be wrong in a way that matters.
 */
export default function WebsiteStatusPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [mode, setMode] = useState<Mode>('live');
  const [password, setPassword] = useState('');
  const [headline, setHeadline] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/site-status/admin');
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Could not load the site status.');
      const data: Status = await res.json();
      setStatus(data);
      setMode(data.mode);
      setHeadline(data.headline || '');
      setMessage(data.message || '');
    } catch (err: any) {
      setError(err?.message || 'Could not load the site status.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setError(null);
    setSaved(null);

    if (mode === 'password' && !status?.hasPassword && !password.trim()) {
      setError('Set a password before switching to password protected, or nobody could get in — including you, on the storefront.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/site-status/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, password: password.trim() || undefined, headline, message })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.success !== true) throw new Error(data?.error || 'Could not save.');

      setPassword('');
      setSaved(mode === 'live' ? 'The website is now live to everyone.' : 'The website is now password protected.');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Could not save.');
    } finally {
      setIsSaving(false);
    }
  };

  const dirty =
    status !== null &&
    (mode !== status.mode || headline !== (status.headline || '') || message !== (status.message || '') || password.trim() !== '');

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-500" /> Website Status
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Choose whether the public site is open, or behind a password while you work on it.
          </p>
        </div>
        {status && (
          <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
            status.mode === 'live'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {status.mode === 'live' ? 'Live' : 'Password protected'}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          {/* The two modes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('live')}
              className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                mode === 'live' ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <Globe className="h-4 w-4 text-emerald-600" /> Live
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                Anyone can visit and buy. This is the normal setting.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode('password')}
              className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                mode === 'password' ? 'border-amber-500 bg-amber-50/40' : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <Lock className="h-4 w-4 text-amber-600" /> Password protected
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                Visitors see a coming-soon page with a password box. Use while developing.
              </p>
            </button>
          </div>

          {/* Password + wording, only when it is relevant */}
          {mode === 'password' && (
            <div className="space-y-4 border-t border-slate-100 pt-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  {status?.hasPassword ? 'Change password' : 'Set password'}
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={status?.hasPassword ? 'Leave blank to keep the current one' : 'At least 4 characters'}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Shown in plain text so you can copy it to whoever needs it. Changing it locks out everyone
                  who used the old one.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Coming-soon heading</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="We'll be back shortly"
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    placeholder="Our store is getting a little work done. Please check back soon."
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-500 resize-none"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10.5px] text-slate-600 flex items-start gap-2">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-px text-slate-400" />
                <span>
                  This hides the shop from visitors — it is not a security lock. The pages and the public API
                  are still served to anyone who requests them directly. For a site that must be genuinely
                  sealed, use Vercel’s Deployment Protection instead.
                  <br />
                  The admin dashboard is never gated, so you cannot lock yourself out.
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-[11px] font-bold flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" /> <span>{error}</span>
            </div>
          )}
          {saved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-[11px] font-bold flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" /> {saved}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <span className="text-[10px] text-slate-400">
              {status?.updatedAt
                ? `Last changed ${new Date(status.updatedAt).toLocaleString('en-GB')}${status.updatedBy ? ` by ${status.updatedBy}` : ''}`
                : 'Never changed'}
            </span>
            <button
              type="button"
              onClick={save}
              disabled={isSaving || !dirty}
              className="py-2.5 px-5 bg-[#0F172A] hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-black rounded-lg cursor-pointer transition-all uppercase tracking-widest flex items-center gap-2 disabled:cursor-not-allowed"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isSaving ? 'Saving' : 'Save status'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
