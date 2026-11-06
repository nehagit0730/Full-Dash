import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Copy, Database, ExternalLink,
  History, Loader2, Plug, RefreshCw, ShieldAlert, XCircle
} from 'lucide-react';

/**
 * Settings → Payments / Shipping & Delivery / Age Verification / Integrations.
 *
 * Renders whatever /api/integrations describes, so every integration gets the
 * same panel. Secrets arrive masked and are never pre-filled: a secret input
 * starts empty, and leaving it empty means "keep the saved value".
 */

type Section = 'payment' | 'shipping' | 'compliance' | 'all';

interface FieldSchema {
  key: string;
  label: string;
  type: 'text' | 'secret' | 'select' | 'boolean' | 'number' | 'url' | 'email';
  secret: boolean;
  required: boolean;
  help: string | null;
  placeholder: string | null;
  options: { value: string; label: string }[] | null;
  hasEnvFallback: boolean;
}

interface IntegrationView {
  id: string;
  name: string;
  category: string;
  description: string;
  supportsTestMode: boolean;
  webhookPath: string | null;
  docsUrl: string | null;
  legacyPanel: { tab: string; label: string } | null;
  capabilities: string[];
  schema: FieldSchema[];
  enabled: boolean;
  mode: 'test' | 'live';
  fields: Record<string, { value: any; set: boolean; source: string }>;
  missingRequired: string[];
  status: string;
  lastError: string | null;
  lastTestedAt: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

interface HubResponse {
  encryptionConfigured: boolean;
  siteUrl: string | null;
  database: { status: string; host: string | null; database: string | null; error: string | null };
  integrations: IntegrationView[];
}

const SECTION_TITLES: Record<Section, { title: string; blurb: string; categories: string[] }> = {
  payment: {
    title: 'Payments',
    blurb: 'Only gateways that are enabled and fully configured can be offered at checkout.',
    categories: ['payment']
  },
  shipping: {
    title: 'Shipping & Delivery',
    blurb: 'Delivery partners, credentials and connection health.',
    categories: ['shipping']
  },
  compliance: {
    title: 'Age Verification',
    blurb: 'AgeChecked credentials and verification behaviour.',
    categories: ['compliance']
  },
  all: {
    title: 'Integrations',
    blurb: 'Every external service the store connects to, in one place.',
    categories: ['payment', 'shipping', 'marketing', 'compliance', 'infrastructure']
  }
};

const CATEGORY_LABEL: Record<string, string> = {
  payment: 'Payments',
  shipping: 'Shipping & Delivery',
  marketing: 'Marketing & Email',
  compliance: 'Compliance',
  infrastructure: 'Infrastructure'
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    connected: { label: 'Connected', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    untested: { label: 'Not tested', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    error: { label: 'Error', cls: 'bg-red-50 text-red-700 border-red-200' },
    misconfigured: { label: 'Misconfigured', cls: 'bg-red-50 text-red-700 border-red-200' },
    disabled: { label: 'Disabled', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
    not_configured: { label: 'Not configured', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
    managed_externally: { label: 'Own settings panel', cls: 'bg-sky-50 text-sky-700 border-sky-200' }
  };
  const s = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>;
}

function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-[#1a1c1d]' : 'bg-slate-300'
      }`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

function IntegrationCard({
  view, siteUrl, encryptionConfigured, onChanged, onOpenTab
}: {
  view: IntegrationView;
  siteUrl: string | null;
  encryptionConfigured: boolean;
  onChanged: (v: IntegrationView) => void;
  onOpenTab?: (tab: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [clear, setClear] = useState<string[]>([]);
  const [busy, setBusy] = useState<'save' | 'test' | 'toggle' | 'mode' | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const dirty = Object.keys(draft).length > 0 || clear.length > 0;
  const webhookUrl = view.webhookPath ? `${siteUrl || window.location.origin}${view.webhookPath}` : null;

  const put = async (body: any, kind: 'save' | 'toggle' | 'mode') => {
    setBusy(kind);
    setMessage(null);
    setFieldErrors({});
    try {
      const res = await fetch(`/api/integrations/${view.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFieldErrors(data.fieldErrors || {});
        throw new Error(data.error || `Save failed (${res.status}).`);
      }
      onChanged(data.integration);
      if (kind === 'save') {
        setDraft({});
        setClear([]);
      }
      setMessage({ kind: 'ok', text: kind === 'save' ? 'Settings saved.' : kind === 'toggle' ? (body.enabled ? 'Enabled.' : 'Disabled.') : 'Mode updated.' });
    } catch (err: any) {
      setMessage({ kind: 'error', text: err.message });
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy('test');
    setMessage(null);
    try {
      const res = await fetch(`/api/integrations/${view.id}/test`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (data.integration) onChanged(data.integration);
      setMessage({ kind: data.ok ? 'ok' : 'error', text: data.message || data.error || 'Test failed.' });
    } catch (err: any) {
      setMessage({ kind: 'error', text: err.message });
    } finally {
      setBusy(null);
    }
  };

  const setValue = (key: string, value: any) => {
    setDraft(d => ({ ...d, [key]: value }));
    setClear(c => c.filter(k => k !== key));
  };

  const currentValue = (f: FieldSchema) => (f.key in draft ? draft[f.key] : f.secret ? '' : view.fields[f.key]?.value ?? '');

  return (
    <div className="bg-white border border-[#e1e3e5] rounded-xl shadow-xs overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex-1 min-w-0 text-left flex items-start gap-3 cursor-pointer"
          aria-expanded={open}
        >
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <Plug className="w-4 h-4 text-slate-600" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[14px] text-[#1a1c1d]">{view.name}</span>
              <StatusBadge status={view.status} />
              {!view.legacyPanel && view.supportsTestMode && (
                <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${view.mode === 'live' ? 'bg-[#1a1c1d] text-white' : 'bg-amber-100 text-amber-800'}`}>
                  {view.mode}
                </span>
              )}
            </div>
            <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-2">{view.description}</p>
          </div>
        </button>
        <div className="flex items-center gap-3 sm:pl-2">
          {!view.legacyPanel && (
            <Toggle
              label={`Enable ${view.name}`}
              checked={view.enabled}
              disabled={busy !== null}
              onChange={v => put({ enabled: v }, 'toggle')}
            />
          )}
          <button type="button" onClick={() => setOpen(o => !o)} className="p-1.5 rounded hover:bg-slate-100 cursor-pointer" aria-label={open ? 'Collapse' : 'Expand'}>
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {message && !open && (
        <div className={`mx-4 mb-3 text-[12px] rounded-md px-3 py-2 ${message.kind === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>{message.text}</div>
      )}

      {open && (
        <div className="border-t border-[#e1e3e5] p-4 space-y-4 bg-[#fafafa]">
          {view.capabilities.length > 0 && (
            <div className="text-[12px] text-slate-600">
              <span className="font-semibold text-slate-700">Implemented: </span>
              {view.capabilities.join(' · ')}
            </div>
          )}

          {view.legacyPanel ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onOpenTab?.(view.legacyPanel!.tab)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#1a1c1d] text-white text-[13px] font-semibold cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" /> {view.legacyPanel.label}
              </button>
              <button type="button" onClick={test} disabled={busy !== null} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#c9cccf] bg-white text-[13px] font-semibold cursor-pointer disabled:opacity-50">
                {busy === 'test' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Test connection
              </button>
            </div>
          ) : (
            <>
              {view.supportsTestMode && (
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="font-medium text-slate-700">Mode</span>
                  <div className="inline-flex rounded-md border border-[#c9cccf] overflow-hidden">
                    {(['test', 'live'] as const).map(m => (
                      <button
                        key={m}
                        type="button"
                        disabled={busy !== null}
                        onClick={() => m !== view.mode && put({ mode: m }, 'mode')}
                        className={`px-3 py-1.5 text-[12px] font-semibold capitalize cursor-pointer ${view.mode === m ? 'bg-[#1a1c1d] text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!encryptionConfigured && view.schema.some(f => f.secret) && (
                <div className="text-[12px] rounded-md px-3 py-2 bg-amber-50 text-amber-900 border border-amber-200">
                  Secrets cannot be saved until SETTINGS_ENCRYPTION_KEY is set on the server.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {view.schema.map(f => {
                  const state = view.fields[f.key];
                  const err = fieldErrors[f.key];
                  const id = `int-${view.id}-${f.key}`;
                  return (
                    <div key={f.key} className={f.type === 'boolean' ? 'md:col-span-2' : ''}>
                      {f.type === 'boolean' ? (
                        <label htmlFor={id} className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                          <input
                            id={id}
                            type="checkbox"
                            checked={Boolean(currentValue(f))}
                            onChange={e => setValue(f.key, e.target.checked)}
                            className="h-4 w-4"
                          />
                          {f.label}
                        </label>
                      ) : (
                        <>
                          <label htmlFor={id} className="block text-[12px] font-semibold text-slate-700 mb-1">
                            {f.label} {f.required && <span className="text-red-600">*</span>}
                          </label>
                          {f.type === 'select' ? (
                            <select
                              id={id}
                              value={String(currentValue(f) ?? '')}
                              onChange={e => setValue(f.key, e.target.value)}
                              className="w-full rounded-md border border-[#c9cccf] bg-white px-2.5 py-2 text-[13px]"
                            >
                              <option value="">Select…</option>
                              {(f.options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          ) : (
                            <div className="flex gap-2">
                              <input
                                id={id}
                                type={f.secret ? 'password' : f.type === 'number' ? 'number' : f.type === 'email' ? 'email' : 'text'}
                                autoComplete={f.secret ? 'new-password' : 'off'}
                                value={String(currentValue(f) ?? '')}
                                placeholder={
                                  f.secret
                                    ? clear.includes(f.key)
                                      ? 'Will be removed on save'
                                      : state?.set
                                        ? `Saved ${state.value} — leave blank to keep`
                                        : f.placeholder || 'Not set'
                                    : f.placeholder || ''
                                }
                                onChange={e => setValue(f.key, e.target.value)}
                                className={`w-full min-w-0 rounded-md border bg-white px-2.5 py-2 text-[13px] ${err ? 'border-red-400' : 'border-[#c9cccf]'}`}
                              />
                              {f.secret && state?.set && state.source === 'stored' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setClear(c => (c.includes(f.key) ? c : [...c, f.key]));
                                    setDraft(d => {
                                      const n = { ...d };
                                      delete n[f.key];
                                      return n;
                                    });
                                  }}
                                  className="px-2 text-[12px] text-red-700 border border-[#c9cccf] rounded-md bg-white hover:bg-red-50 cursor-pointer"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          )}
                          {state?.source === 'env' && !(f.key in draft) && (
                            <p className="text-[11px] text-sky-700 mt-1">Currently read from the server environment. Saving a value here overrides it.</p>
                          )}
                          {err && <p className="text-[11px] text-red-700 mt-1">{err}</p>}
                          {f.help && <p className="text-[11px] text-slate-500 mt-1">{f.help}</p>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {webhookUrl && (
                <div>
                  <span className="block text-[12px] font-semibold text-slate-700 mb-1">Webhook URL</span>
                  <div className="flex gap-2">
                    <code className="flex-1 min-w-0 truncate rounded-md border border-[#e1e3e5] bg-white px-2.5 py-2 text-[12px]">{webhookUrl}</code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(webhookUrl).catch(() => {})}
                      className="px-2.5 rounded-md border border-[#c9cccf] bg-white hover:bg-slate-50 cursor-pointer"
                      aria-label="Copy webhook URL"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Register this in the provider dashboard. Webhook processing for this provider is enabled in a later phase.</p>
                </div>
              )}

              {view.missingRequired.length > 0 && (
                <p className="text-[12px] text-amber-800">
                  Required before enabling: {view.missingRequired.map(k => view.schema.find(f => f.key === k)?.label || k).join(', ')}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => put({ values: draft, clearSecrets: clear }, 'save')}
                  disabled={!dirty || busy !== null}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#1a1c1d] text-white text-[13px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {busy === 'save' && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save settings
                </button>
                <button
                  type="button"
                  onClick={test}
                  disabled={busy !== null || dirty}
                  title={dirty ? 'Save your changes first' : undefined}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-[#c9cccf] bg-white text-[13px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {busy === 'test' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Test connection
                </button>
                {dirty && (
                  <button type="button" onClick={() => { setDraft({}); setClear([]); setFieldErrors({}); }} className="text-[13px] text-slate-600 underline cursor-pointer">
                    Discard changes
                  </button>
                )}
                {view.docsUrl && (
                  <a href={view.docsUrl} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-[12px] text-slate-600 hover:underline">
                    API docs <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </>
          )}

          {message && (
            <div className={`flex items-start gap-2 text-[12px] rounded-md px-3 py-2 ${message.kind === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
              {message.kind === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
              <span className="break-words min-w-0">{message.text}</span>
            </div>
          )}

          <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
            {view.lastTestedAt && <span>Last tested {new Date(view.lastTestedAt).toLocaleString()}</span>}
            {view.updatedAt && <span>Updated {new Date(view.updatedAt).toLocaleString()}{view.updatedBy ? ` by ${view.updatedBy}` : ''}</span>}
            {view.lastError && view.status === 'error' && <span className="text-red-700">Last error: {view.lastError}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function DatabaseCard({ db }: { db: HubResponse['database'] }) {
  const [uri, setUri] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch('/api/integrations/database/test-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri, confirmPassword: password })
      });
      const data = await res.json().catch(() => ({}));
      setResult({ ok: Boolean(data.ok), text: data.message || data.error || `Failed (${res.status}).` });
    } catch (err: any) {
      setResult({ ok: false, text: err.message });
    } finally {
      setBusy(false);
      setPassword('');
    }
  };

  return (
    <div className="bg-white border border-[#e1e3e5] rounded-xl shadow-xs p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Database className="w-4 h-4 text-slate-600" />
        <span className="font-semibold text-[14px]">Neon PostgreSQL</span>
        <StatusBadge status={db.status === 'connected' ? 'connected' : 'error'} />
        <span className="text-[12px] text-slate-500">Primary database</span>
      </div>
      <div className="text-[12px] text-slate-600">
        Host <code className="bg-slate-100 px-1 rounded">{db.host || 'n/a'}</code> · database <code className="bg-slate-100 px-1 rounded">{db.database || 'n/a'}</code>
        {db.error && <div className="text-red-700 mt-1">{db.error}</div>}
      </div>
      <p className="text-[12px] text-slate-600">
        The connection string is a bootstrap secret held in the hosting environment (<code>DATABASE_URL</code>), so a mistake here cannot lock the store out of its data. You can validate a new connection string below; switching is done by updating the environment and redeploying.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_auto] gap-2">
        <input type="password" autoComplete="off" value={uri} onChange={e => setUri(e.target.value)} placeholder="postgresql://user:pass@ep-….neon.tech/neondb?sslmode=require" className="rounded-md border border-[#c9cccf] px-2.5 py-2 text-[13px] min-w-0" aria-label="Candidate connection string" />
        <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your admin password" className="rounded-md border border-[#c9cccf] px-2.5 py-2 text-[13px]" aria-label="Admin password" />
        <button type="button" onClick={run} disabled={busy || !uri || !password} className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md border border-[#c9cccf] bg-white text-[13px] font-semibold cursor-pointer disabled:opacity-40">
          {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Validate
        </button>
      </div>
      {result && <div className={`text-[12px] rounded-md px-3 py-2 ${result.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>{result.text}</div>}
    </div>
  );
}

function AuditLog() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/integrations/audit/log?limit=50')
      .then(r => (r.ok ? r.json() : r.json().then(d => Promise.reject(new Error(d.error || r.statusText)))))
      .then(setRows)
      .catch(e => setError(e.message));
  }, []);
  return (
    <div className="bg-white border border-[#e1e3e5] rounded-xl shadow-xs p-4">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-slate-600" />
        <span className="font-semibold text-[14px]">Configuration audit log</span>
      </div>
      {error && <p className="text-[12px] text-red-700">{error}</p>}
      {!rows && !error && <p className="text-[12px] text-slate-500">Loading…</p>}
      {rows && rows.length === 0 && <p className="text-[12px] text-slate-500">No changes recorded yet.</p>}
      {rows && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-[#e1e3e5]">
                <th className="py-1.5 pr-3 font-medium">When</th>
                <th className="py-1.5 pr-3 font-medium">Integration</th>
                <th className="py-1.5 pr-3 font-medium">Action</th>
                <th className="py-1.5 pr-3 font-medium">Fields</th>
                <th className="py-1.5 font-medium">By</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-slate-100 align-top">
                  <td className="py-1.5 pr-3 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="py-1.5 pr-3">{r.integrationId}</td>
                  <td className="py-1.5 pr-3">{r.action}</td>
                  <td className="py-1.5 pr-3">{(r.changedFields || []).join(', ') || r.details?.message || '—'}</td>
                  <td className="py-1.5">{r.actor || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function IntegrationsSettingsTab({ section, onOpenTab }: { section: Section; onOpenTab?: (tab: string) => void }) {
  const [hub, setHub] = useState<HubResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/integrations');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Could not load integrations (${res.status}).`);
      setHub(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const meta = SECTION_TITLES[section];
  const grouped = useMemo(() => {
    const list = (hub?.integrations || []).filter(i => meta.categories.includes(i.category));
    const out: Record<string, IntegrationView[]> = {};
    for (const i of list) (out[i.category] ||= []).push(i);
    return out;
  }, [hub, meta]);

  const replace = (v: IntegrationView) =>
    setHub(h => (h ? { ...h, integrations: h.integrations.map(i => (i.id === v.id ? v : i)) } : h));

  return (
    <div className="max-w-5xl mx-auto w-full space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1a1c1d]">{meta.title}</h1>
          <p className="text-[13px] text-slate-500">{meta.blurb}</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#c9cccf] bg-white text-[13px] font-semibold cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] text-red-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {hub && !hub.encryptionConfigured && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[13px] text-amber-900">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong>Encryption key missing.</strong> Set <code>SETTINGS_ENCRYPTION_KEY</code> (32+ characters) in the server environment before saving any credentials. Without it, secrets are refused rather than stored in plain text.
          </div>
        </div>
      )}

      {loading && !hub && (
        <div className="flex items-center gap-2 text-[13px] text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading integrations…</div>
      )}

      {hub && section === 'all' && <DatabaseCard db={hub.database} />}

      {hub &&
        Object.entries(grouped).map(([cat, items]) => (
          <section key={cat} className="space-y-2.5">
            {section === 'all' && <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-500">{CATEGORY_LABEL[cat] || cat}</h2>}
            {items.map(v => (
              <IntegrationCard
                key={v.id}
                view={v}
                siteUrl={hub.siteUrl}
                encryptionConfigured={hub.encryptionConfigured}
                onChanged={replace}
                onOpenTab={onOpenTab}
              />
            ))}
          </section>
        ))}

      {hub && section === 'all' && <AuditLog />}
    </div>
  );
}
