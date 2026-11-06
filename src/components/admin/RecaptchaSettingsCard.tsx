import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, RefreshCw, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

export interface RecaptchaSettingsData {
  enabled: boolean;
  siteKey: string;
  secretKey?: string;
  minScore: number;
  hasSecretKey?: boolean;
}

export function RecaptchaSettingsCard() {
  const [settings, setSettings] = useState<RecaptchaSettingsData>({
    enabled: false,
    siteKey: '',
    secretKey: '',
    minScore: 0.5
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message?: string }>(
    { status: 'idle' }
  );

  useEffect(() => {
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
        if (data) {
          setSettings({
            enabled: typeof data.enabled === 'boolean' ? data.enabled : false,
            siteKey: data.siteKey || '',
            secretKey: data.secretKey || '',
            minScore: typeof data.minScore === 'number' ? data.minScore : 0.5,
            hasSecretKey: data.hasSecretKey
          });
        }
      })
      .catch((err) => console.error('[RecaptchaSettings] Failed to fetch settings:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/email/recaptcha-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('[RecaptchaSettings] Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  // Reports whether reCAPTCHA is actually configured. It used to submit a
  // fabricated contact form to the live endpoint, which sent a real email and
  // filed a real contact message on every press, and it passed only because
  // the server accepted a hardcoded fake token.
  const handleTestVerification = async () => {
    setTestResult({ status: 'testing' });
    try {
      const res = await fetch('/api/email/recaptcha-settings');
      const data = await res.json();
      if (!res.ok) {
        setTestResult({ status: 'error', message: 'Could not read reCAPTCHA settings from the server.' });
      } else if (!data.enabled) {
        setTestResult({
          status: 'error',
          message: 'reCAPTCHA is switched off. Forms are accepted without a bot check.'
        });
      } else if (!data.siteKey || !data.hasSecretKey) {
        setTestResult({
          status: 'error',
          message: !data.siteKey
            ? 'reCAPTCHA is on but no site key is saved, so the widget cannot load. Submissions will be refused.'
            : 'reCAPTCHA is on but no secret key is saved, so the server cannot verify tokens. Submissions will be refused.'
        });
      } else {
        setTestResult({
          status: 'success',
          message: `reCAPTCHA is active. Site key and secret key are saved; submissions scoring below ${data.minScore} are refused.`
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: err?.message || 'Network error testing reCAPTCHA verification.'
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center justify-center gap-3">
        <RefreshCw className="h-5 w-5 text-indigo-600 animate-spin" />
        <span className="text-xs font-bold text-slate-600">Loading Google reCAPTCHA Settings...</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                Google reCAPTCHA v3 Protection
              </h3>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                ACTIVE
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Protect site-wide contact forms and newsletter signups from automated bots without user friction.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer shrink-0"
        >
          {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          <span>{saveSuccess ? 'Saved!' : 'Save reCAPTCHA Keys'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            reCAPTCHA Site Key (Public)
          </label>
          <input
            type="text"
            value={settings.siteKey}
            onChange={(e) => setSettings({ ...settings, siteKey: e.target.value })}
            placeholder="6LefWfspAAAAADsJ-..."
            className="w-full text-xs font-mono p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Google reCAPTCHA v3 HTML Site Key used on frontend forms to request execution tokens.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            reCAPTCHA Secret Key (Private)
          </label>
          <div className="relative">
            <input
              type={showSecretKey ? 'text' : 'password'}
              value={settings.secretKey || ''}
              onChange={(e) => setSettings({ ...settings, secretKey: e.target.value })}
              placeholder="6LefWfspAAAAASecretKey..."
              className="w-full text-xs font-mono p-3 pr-10 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowSecretKey(!showSecretKey)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
            >
              {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Used strictly on backend server to query Google siteverify API.
          </p>
        </div>
      </div>

      <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
            Minimum Bot Score Threshold: <span className="text-indigo-600 font-black">{settings.minScore}</span>
          </label>
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            0.0 (Bot) ➔ 1.0 (Human)
          </span>
        </div>
        <input
          type="range"
          min="0.1"
          max="0.9"
          step="0.05"
          value={settings.minScore}
          onChange={(e) => setSettings({ ...settings, minScore: parseFloat(e.target.value) })}
          className="w-full accent-indigo-600 cursor-pointer"
        />
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Submissions with a Google confidence score lower than <strong>{settings.minScore}</strong> will be automatically blocked to prevent spam in your customer inquiry database. Standard recommendation is <strong>0.5</strong>.
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
          <span>Active in Contact Form and Footer Newsletter Subscription.</span>
        </div>

        <button
          type="button"
          onClick={handleTestVerification}
          disabled={testResult.status === 'testing'}
          className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
        >
          {testResult.status === 'testing' ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
          )}
          <span>Test Protection Layer</span>
        </button>
      </div>

      {testResult.status !== 'idle' && (
        <div className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 ${
          testResult.status === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : testResult.status === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-indigo-50 border-indigo-200 text-indigo-800'
        }`}>
          {testResult.status === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : testResult.status === 'error' ? (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          ) : (
            <RefreshCw className="h-4 w-4 text-indigo-600 animate-spin shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}
    </div>
  );
}
