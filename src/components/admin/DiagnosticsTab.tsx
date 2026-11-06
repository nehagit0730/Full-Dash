import React, { useState, useEffect } from 'react';
import { 
  Database, RefreshCw, AlertCircle, CheckCircle2, Server, Key, 
  ShieldCheck, Terminal, Copy, Check, Lock, Cloud, ExternalLink, Zap
} from 'lucide-react';

interface DiagnosticsTabProps {
  onRefreshAll?: () => void;
}

export const DiagnosticsTab: React.FC<DiagnosticsTabProps> = ({ onRefreshAll }) => {
  const [loading, setLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<{
    statusCode: number;
    status: string;
    databaseUrlConfigured: boolean;
    provider: string;
    host: string;
    database: string;
    error: string | null;
    timestamp: string;
  } | null>(null);

  const [cloudinaryResult, setCloudinaryResult] = useState<{
    success: boolean;
    configured: boolean;
    hasCloudName: boolean;
    hasApiKey: boolean;
    hasApiSecret: boolean;
    cloudName?: string | null;
    apiKeyMasked?: string | null;
    message?: string;
  } | null>(null);

  const [customUriInput, setCustomUriInput] = useState('');
  const [uriUpdating, setUriUpdating] = useState(false);
  const [uriUpdateResult, setUriUpdateResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedError, setCopiedError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const verifyStatus = async () => {
    setLoading(true);
    setUriUpdateResult(null);
    try {
      // Fetch /api/status endpoint
      const res = await fetch(`/api/status?t=${Date.now()}`);
      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch (jsonErr) {
        data = { 
          statusCode: res.status, 
          status: 'error', 
          error: `Non-JSON Server Response (HTTP ${res.status}): ${rawText}` 
        };
      }

      const statusCode = data.statusCode || res.status;
      const isOk = statusCode === 200 && data.status === 'connected';

      setStatusResult({
        statusCode,
        status: data.status || (isOk ? 'connected' : 'error'),
        databaseUrlConfigured: data.databaseUrlConfigured ?? true,
        provider: data.provider || 'Neon PostgreSQL',
        host: data.host || 'N/A',
        database: data.database || 'N/A',
        error: data.error || (isOk ? null : `Error status code ${statusCode}`),
        timestamp: data.timestamp || new Date().toISOString()
      });
    } catch (err: any) {
      setStatusResult({
        statusCode: 500,
        status: 'error',
        databaseUrlConfigured: false,
        provider: 'Neon PostgreSQL',
        host: 'N/A',
        database: 'N/A',
        error: err.message || 'Network communication error connecting to /api/status',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyCloudinary = async () => {
    try {
      const res = await fetch(`/api/test-cloudinary?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setCloudinaryResult(data);
        console.log('[Cloudinary Diagnostic Log]', data);
      }
    } catch (err) {
      console.error('[Cloudinary Diagnostic Error]', err);
    }
  };

  useEffect(() => {
    verifyStatus();
    verifyCloudinary();
  }, []);

  const handleUpdateUri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUriInput.trim()) return;
    setUriUpdating(true);
    setUriUpdateResult(null);
    try {
      const res = await fetch('/api/update-db-uri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: customUriInput.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setUriUpdateResult({
          success: data.status === 'connected',
          message: data.status === 'connected' 
            ? 'DATABASE_URL updated successfully and verified connected!' 
            : `DATABASE_URL updated, but connection returned: ${data.error || data.status}`
        });
        setCustomUriInput('');
        verifyStatus();
        if (onRefreshAll) onRefreshAll();
      } else {
        setUriUpdateResult({ success: false, message: data.error || 'Failed to update DATABASE_URL' });
      }
    } catch (err: any) {
      setUriUpdateResult({ success: false, message: err.message || 'Error updating connection string' });
    } finally {
      setUriUpdating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedError(true);
    setTimeout(() => setCopiedError(false), 2000);
  };

  const isConnected = statusResult?.statusCode === 200 && statusResult?.status === 'connected';

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Database & Backend Diagnostics</h2>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
              Live Test
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Real-time connection verification for Neon PostgreSQL database, <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-xs">DATABASE_URL</code> configuration, and Cloudinary media services.
          </p>
        </div>

        <button
          onClick={verifyStatus}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-verify DATABASE_URL Status</span>
        </button>
      </div>

      {/* Main Status Overview Banner */}
      <div className={`p-6 rounded-2xl border shadow-xs transition-all ${
        isConnected 
          ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950' 
          : 'bg-rose-50/70 border-rose-200/80 text-rose-950'
      }`}>
        <div className="flex items-start gap-4">
          {isConnected ? (
            <CheckCircle2 className="h-7 w-7 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-7 w-7 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold">
                {isConnected 
                  ? 'Neon PostgreSQL Database Connected & Healthy' 
                  : 'Database Connection Error Detected'}
              </h3>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                isConnected 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}>
                HTTP Status Code: {statusResult?.statusCode ?? 'Testing...'}
              </span>
            </div>
            <p className="text-xs sm:text-sm opacity-90 leading-relaxed">
              {isConnected
                ? 'Your Neon PostgreSQL database is fully reachable via /api/status. All products, collections, orders, files, and customer records are persistently synchronized.'
                : 'The server encountered an error verifying the connection to Neon PostgreSQL via /api/status. Below are the raw diagnostic details and raw error payload.'}
            </p>
            {statusResult?.timestamp && (
              <p className="text-[11px] opacity-75 font-mono pt-1">
                Last checked: {new Date(statusResult.timestamp).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: HTTP Status Code */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">HTTP Status</span>
            <Server className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${
              statusResult?.statusCode === 200 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {statusResult?.statusCode ? `${statusResult.statusCode}` : '---'}
            </span>
            <span className="text-xs font-medium text-slate-500">
              {statusResult?.statusCode === 200 ? 'OK' : 'Error'}
            </span>
          </div>
          <p className="text-xs text-slate-500">Response code from /api/status endpoint</p>
        </div>

        {/* Metric 2: Connection Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Connection State</span>
            <Zap className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-2.5 py-1 rounded-md capitalize ${
              statusResult?.status === 'connected'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}>
              {statusResult?.status || 'Unknown'}
            </span>
          </div>
          <p className="text-xs text-slate-500">Provider: {statusResult?.provider || 'Neon PostgreSQL'}</p>
        </div>

        {/* Metric 3: Host Endpoint */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Database Host</span>
            <Database className="h-4 w-4 text-slate-400" />
          </div>
          <div className="font-mono text-xs font-semibold text-slate-800 truncate" title={statusResult?.host || 'N/A'}>
            {statusResult?.host || 'N/A'}
          </div>
          <p className="text-xs text-slate-500">DB Name: {statusResult?.database || 'neondb'}</p>
        </div>

        {/* Metric 4: DATABASE_URL Configured */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">DATABASE_URL</span>
            <Key className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
              statusResult?.databaseUrlConfigured
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {statusResult?.databaseUrlConfigured ? 'Configured' : 'Missing / Unset'}
            </span>
          </div>
          <p className="text-xs text-slate-500">Environment variable presence check</p>
        </div>
      </div>

      {/* Raw Connection Error Display */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
              Raw Connection Diagnostic Output & Error Message
            </h3>
          </div>
          {statusResult?.error && (
            <button
              onClick={() => copyToClipboard(statusResult.error || '')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              {copiedError ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedError ? 'Copied!' : 'Copy Raw Error'}</span>
            </button>
          )}
        </div>

        <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto border border-slate-800 leading-relaxed">
          {statusResult?.error ? (
            <div className="text-rose-400 whitespace-pre-wrap break-all">
              <span className="text-rose-500 font-bold">[PostgreSQL Driver Error]:</span> {statusResult.error}
            </div>
          ) : (
            <div className="text-emerald-400">
              [Neon PostgreSQL Driver]: Connection successful (200 OK). No connection errors returned by /api/status.
            </div>
          )}
        </div>
      </div>

      {/* Cloudinary Environment Variables Check Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cloud className="h-5 w-5 text-sky-600" />
            <h3 className="text-base font-bold text-slate-900">Cloudinary Media Credentials Check</h3>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            cloudinaryResult?.configured 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            {cloudinaryResult?.configured ? 'Cloudinary Configured' : 'Local Disk Fallback Active'}
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Validates presence of server environment variables <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded">CLOUDINARY_CLOUD_NAME</code>, <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded">CLOUDINARY_API_KEY</code>, and <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded">CLOUDINARY_API_SECRET</code>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">CLOUDINARY_CLOUD_NAME</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-800">{cloudinaryResult?.cloudName || 'Not Set'}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                cloudinaryResult?.hasCloudName ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {cloudinaryResult?.hasCloudName ? 'Present' : 'Missing'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">CLOUDINARY_API_KEY</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-800">{cloudinaryResult?.apiKeyMasked || 'Not Set'}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                cloudinaryResult?.hasApiKey ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {cloudinaryResult?.hasApiKey ? 'Present' : 'Missing'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">CLOUDINARY_API_SECRET</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-800">
                {cloudinaryResult?.hasApiSecret ? '••••••••' : 'Not Set'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                cloudinaryResult?.hasApiSecret ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {cloudinaryResult?.hasApiSecret ? 'Present' : 'Missing'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Neon PostgreSQL Data Persistence & Automated Snapshots */}
      <DatabaseBackupSection onRefreshAll={onRefreshAll} />

      {/* Re-configure DATABASE_URL Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">Re-configure DATABASE_URL Connection String</h3>
        </div>

        <p className="text-xs text-slate-500">
          Paste a fresh Neon PostgreSQL pooled connection string (e.g. <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded">postgresql://user:pass@ep-host.neon.tech/neondb?sslmode=require</code>) to update the backend connection instantly.
        </p>

        <form onSubmit={handleUpdateUri} className="space-y-3">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={customUriInput}
              onChange={(e) => setCustomUriInput(e.target.value)}
              placeholder="postgresql://user:password@ep-xxxx-xxxx.neon.tech/neondb?sslmode=require"
              className="w-full pl-3 pr-24 py-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg bg-slate-200/60 hover:bg-slate-200 transition-all cursor-pointer"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="submit"
              disabled={uriUpdating || !customUriInput.trim()}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            >
              {uriUpdating && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>Update & Test Connection</span>
            </button>

            {uriUpdateResult && (
              <span className={`text-xs font-medium ${
                uriUpdateResult.success ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {uriUpdateResult.message}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

interface BackupItem {
  id: string;
  name: string;
  timestamp: string;
  resourceCount: number;
}

const DatabaseBackupSection: React.FC<{ onRefreshAll?: () => void }> = ({ onRefreshAll }) => {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [backupName, setBackupName] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [diagRes, backupRes] = await Promise.all([
        fetch('/api/db-diagnostics').then(r => r.json()).catch(() => ({})),
        fetch('/api/backup').then(r => r.json()).catch(() => [])
      ]);
      if (diagRes && diagRes.counts) {
        setCounts(diagRes.counts);
      }
      if (Array.isArray(backupRes)) {
        setBackups(backupRes);
      }
    } catch (err) {
      console.warn('Error loading backup diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: backupName.trim() || `Manual Snapshot ${new Date().toLocaleTimeString()}` })
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', message: 'Database snapshot successfully created and stored in Neon PostgreSQL!' });
        setBackupName('');
        await loadData();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to create backup' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Error communicating with server' });
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to restore the snapshot "${name}"? This will safely reload all store pages, products, collections, and settings from this snapshot.`)) {
      return;
    }
    setRestoringId(id);
    setFeedback(null);
    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: `Successfully restored snapshot "${name}"! Reloading data...` });
        if (onRefreshAll) onRefreshAll();
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to restore snapshot' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Error restoring snapshot' });
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-teal-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Neon PostgreSQL Real-Time Data Persistence</h3>
            <p className="text-xs text-slate-500 mt-0.5">Live table synchronization status and automated snapshot recovery.</p>
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Refresh counts"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Live Table Records Counter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-teal-50/60 border border-teal-150 rounded-xl">
          <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">Custom Pages</span>
          <span className="text-lg font-extrabold text-teal-950">{counts.customPages ?? '—'}</span>
        </div>
        <div className="p-3 bg-indigo-50/60 border border-indigo-150 rounded-xl">
          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">Products</span>
          <span className="text-lg font-extrabold text-indigo-950">{counts.products ?? '—'}</span>
        </div>
        <div className="p-3 bg-sky-50/60 border border-sky-150 rounded-xl">
          <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider block">Collections</span>
          <span className="text-lg font-extrabold text-sky-950">{counts.collections ?? '—'}</span>
        </div>
        <div className="p-3 bg-purple-50/60 border border-purple-150 rounded-xl">
          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">Media Files</span>
          <span className="text-lg font-extrabold text-purple-950">{counts.files ?? '—'}</span>
        </div>
      </div>

      {feedback && (
        <div className={`p-3.5 rounded-xl text-xs font-medium ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Create Instant Backup Snapshot Form */}
      <form onSubmit={handleCreateBackup} className="flex flex-col sm:flex-row gap-2 pt-2">
        <input
          type="text"
          value={backupName}
          onChange={(e) => setBackupName(e.target.value)}
          placeholder="Snapshot label (e.g., Pre-deployment Page Builder State)"
          className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer shrink-0"
        >
          {creating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          <span>Create Neon DB Snapshot</span>
        </button>
      </form>

      {/* Backups List */}
      <div className="space-y-2 pt-1">
        <span className="text-xs font-bold text-slate-700 block">Saved Snapshots ({backups.length})</span>
        {backups.length === 0 ? (
          <div className="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-xl border border-slate-200">
            No manual snapshots created yet. Create one above to preserve your exact page state.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
            {backups.map((b) => (
              <div key={b.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{b.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(b.timestamp).toLocaleString()} • {b.resourceCount} items
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRestore(b.id, b.name)}
                  disabled={restoringId === b.id}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 font-semibold text-xs rounded-lg border border-slate-200 hover:border-teal-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  {restoringId === b.id ? 'Restoring...' : 'Restore'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
