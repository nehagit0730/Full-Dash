import React, { useState } from 'react';
import { Lock, Loader2, AlertTriangle } from 'lucide-react';

interface ComingSoonProps {
  headline: string;
  message: string;
  /** Resolves true when the password was accepted and the pass is stored. */
  onUnlock: (password: string) => Promise<boolean>;
}

/**
 * What the public sees while the shop is password protected.
 *
 * Shown instead of the storefront, not over it, so nothing of the site in
 * progress is on screen behind the box.
 */
export default function ComingSoon({ headline, message, onUnlock }: ComingSoonProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Enter the password.');
      return;
    }
    setError(null);
    setIsChecking(true);
    try {
      if (!(await onUnlock(password.trim()))) setError('That password is not right.');
    } catch {
      setError('Could not check that. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#071d37] text-white flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="space-y-2">
          <div className="text-[11px] font-black uppercase tracking-[0.3em] text-[#dfb55a]">Pouch Supply</div>
          <h1 className="text-3xl font-black leading-tight">{headline || "We'll be back shortly"}</h1>
          {message && <p className="text-sm text-slate-300 leading-relaxed">{message}</p>}
        </div>

        <form onSubmit={submit} className="space-y-3 text-left">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
            Have a password?
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                placeholder="Enter password"
                className="w-full bg-white/5 border border-white/15 rounded-xl py-3 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#dfb55a]/60 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={isChecking}
              className="px-5 bg-[#dfb55a] hover:bg-[#c9a24d] disabled:opacity-60 text-slate-950 text-xs font-black rounded-xl uppercase tracking-widest cursor-pointer transition-all flex items-center gap-2 disabled:cursor-not-allowed"
            >
              {isChecking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isChecking ? 'Checking' : 'Enter'}
            </button>
          </div>

          {error && (
            <p className="text-[11px] text-rose-300 font-bold flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
            </p>
          )}
        </form>

        <p className="text-[10px] text-slate-500">
          Site administrators can still sign in at <span className="font-mono text-slate-400">/admin-dashboard</span>.
        </p>
      </div>
    </div>
  );
}
