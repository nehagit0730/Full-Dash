import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { adminLogin } from '../lib/adminApi';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

export default function AdminLogin({ onLoginSuccess, onCancel }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all credential fields.');
      return;
    }

    setIsLoading(true);

    // Verified by the server, which returns a signed token that every admin
    // endpoint checks. This used to compare 'admin'/'admin' here in the browser
    // and call it authentication — nothing on the server ever checked it, so
    // the entire admin API was open to anyone who knew a URL.
    const result = await adminLogin(username.trim(), password);
    setIsLoading(false);

    if (result.ok) {
      onLoginSuccess();
    } else {
      setError(result.message || 'Invalid admin credentials.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-slate-50/50 p-4 font-sans select-none animate-fadeIn">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden">
        
        {/* Top Banner Accent */}
        <div className="h-2 bg-[#008060]" />

        <div className="p-8">
          {/* Header branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[#e3f5e9] text-[#008060] rounded-xl border border-[#c8ebd3] mb-3">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Admin Portal Access</h1>
            <p className="text-xs text-slate-500 mt-1">Authenticate secure merchant control privileges</p>
          </div>

          {/* Alert Notification for Errors */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2.5 text-xs animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Secure Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="you@pouch-supply.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="w-full text-xs p-3 pl-10 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] bg-slate-50/50 disabled:opacity-50 transition-all text-slate-800 font-medium"
                />
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Secure Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full text-xs p-3 pl-10 pr-10 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] bg-slate-50/50 disabled:opacity-50 transition-all text-slate-800 font-medium"
                />
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Login Submission button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#008060] hover:bg-[#006e52] text-white rounded-xl text-xs font-black uppercase tracking-widest transition shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer mt-6"
            >
              {isLoading ? (
                <>
                  <div className="h-4.5 w-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Session...</span>
                </>
              ) : (
                <span>Access Dashboard</span>
              )}
            </button>
          </form>

          {/* Cancel button to go back */}
          <div className="mt-6 pt-5 border-t border-slate-150 text-center">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer group"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Cancel & Return to Store</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
