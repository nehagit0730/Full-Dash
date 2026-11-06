import React, { useState, useEffect } from 'react';
import { 
  Mail, Send, CheckCircle2, AlertCircle, Eye, Settings, RefreshCw, 
  Trash2, ShieldCheck, Zap, Lock, Filter, Smartphone, Monitor, Code, 
  ExternalLink, Layers, Sparkles, Check, Play, User, ShoppingBag, DollarSign, RotateCcw,
  HelpCircle, Globe, Server, CheckCheck, Info, Activity, AlertTriangle
} from 'lucide-react';

export type EmailProvider = 'gmail' | 'smtp' | 'resend' | 'auto';

export interface EmailSettings {
  enabled: boolean;
  provider: EmailProvider;
  gmailUser: string;
  gmailAppPassword?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  resendApiKey?: string;
  fromName: string;
  fromEmail: string;
  adminNotificationEmail: string;
  templates: Record<string, {
    enabled: boolean;
    subject: string;
  }>;
}

export interface KlaviyoSettings {
  enabled: boolean;
  apiKey: string;
  siteId?: string;
  publicKey?: string;
  listId?: string;
  trackEvents: Record<string, boolean>;
}

export interface EmailLogEntry {
  id: string;
  type: string;
  recipient: string;
  subject: string;
  status: 'sent' | 'failed' | 'disabled';
  provider?: string;
  messageId?: string;
  resendId?: string;
  error?: string;
  timestamp: string;
  metadata?: any;
}

export interface KlaviyoLogEntry {
  id: string;
  eventName: string;
  customerEmail: string;
  status: 'sent' | 'failed' | 'disabled';
  error?: string;
  timestamp: string;
  payload?: any;
}

const TEMPLATE_OPTIONS = [
  { id: 'order_confirmation', label: 'Order Confirmation', category: 'Transactional' },
  { id: 'order_processing', label: 'Order Processing', category: 'Fulfillment' },
  { id: 'order_shipped', label: 'Order Shipped / Dispatched', category: 'Fulfillment' },
  { id: 'out_for_delivery', label: 'Out for Delivery', category: 'Fulfillment' },
  { id: 'order_delivered', label: 'Order Delivered', category: 'Fulfillment' },
  { id: 'order_cancelled', label: 'Order Cancelled', category: 'Transactional' },
  { id: 'order_refunded', label: 'Order Refunded', category: 'Transactional' },
  { id: 'order_exchanged', label: 'Product Exchange', category: 'Transactional' },
  { id: 'subscription_price_change', label: 'Subscription Price Change', category: 'Transactional' },
  { id: 'password_reset', label: 'Password Reset', category: 'Account' },
  { id: 'email_verification', label: 'Email Verification', category: 'Account' },
  { id: 'welcome_email', label: 'Welcome Email', category: 'Marketing' },
  { id: 'admin_new_order', label: 'Admin New Order Alert', category: 'Admin' },
];

export function EmailSettingsTab() {
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'templates' | 'preview' | 'test' | 'klaviyo' | 'logs'>('config');
  
  // Settings state
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const [klaviyoSettings, setKlaviyoSettings] = useState<KlaviyoSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Connection Verification State
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailVerifyResult, setEmailVerifyResult] = useState<{ success: boolean; message: string; provider?: string } | null>(null);

  // Logs & Inquiries state
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);
  const [klaviyoLogs, setKlaviyoLogs] = useState<KlaviyoLogEntry[]>([]);
  const [logFilter, setLogFilter] = useState('all');

  // Preview state
  const [selectedPreviewTemplate, setSelectedPreviewTemplate] = useState('order_confirmation');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Test email state
  const [testRecipient, setTestRecipient] = useState('scottkivlinpouch@gmail.com');
  const [testTemplate, setTestTemplate] = useState('order_confirmation');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Test Klaviyo state
  const [testKlaviyoEmail, setTestKlaviyoEmail] = useState('scottkivlinpouch@gmail.com');
  const [sendingKlaviyoTest, setSendingKlaviyoTest] = useState(false);
  const [testKlaviyoResult, setTestKlaviyoResult] = useState<any>(null);
  const [verifyingKlaviyoKey, setVerifyingKlaviyoKey] = useState(false);
  const [klaviyoVerifyResult, setKlaviyoVerifyResult] = useState<{ success: boolean; message?: string; error?: string; hasEventsWrite?: boolean } | null>(null);
  // Whether Klaviyo will actually deliver. A valid key only proves events are
  // accepted; a flow left in draft swallows every one of them silently.
  const [klaviyoHealth, setKlaviyoHealth] = useState<{
    healthy?: boolean;
    connected?: boolean;
    listConfigured?: boolean;
    flows?: { name: string; status: string }[];
    issues?: string[];
    error?: string;
  } | null>(null);
  const [checkingKlaviyoHealth, setCheckingKlaviyoHealth] = useState(false);
  const [klaviyoLists, setKlaviyoLists] = useState<{ id: string; name: string }[]>([]);
  const [fetchingLists, setFetchingLists] = useState(false);
  const [showAppPasswordGuide, setShowAppPasswordGuide] = useState(false);

  // Fetch all configuration and logs on load
  const loadData = async () => {
    setLoading(true);
    try {
      const [emailRes, klaviyoRes, emailLogsRes, klaviyoLogsRes] = await Promise.all([
        fetch('/api/email/settings'),
        fetch('/api/klaviyo/settings'),
        fetch('/api/email/logs'),
        fetch('/api/klaviyo/logs')
      ]);

      if (emailRes.ok) setEmailSettings(await emailRes.json());
      if (klaviyoRes.ok) setKlaviyoSettings(await klaviyoRes.json());
      if (emailLogsRes.ok) {
        const rawLogs = await emailLogsRes.json();
        if (Array.isArray(rawLogs)) {
          setEmailLogs(rawLogs.filter(l => l.status !== 'simulated'));
        }
      }
      if (klaviyoLogsRes.ok) {
        const rawKlav = await klaviyoLogsRes.json();
        if (Array.isArray(rawKlav)) {
          setKlaviyoLogs(rawKlav.filter(l => l.status !== 'simulated'));
        }
      }
    } catch (err: any) {
      console.error('Failed to load email settings data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch preview HTML when selected template changes or when preview tab opens
  useEffect(() => {
    if (activeSubTab === 'preview') {
      fetchPreview(selectedPreviewTemplate);
    }
  }, [selectedPreviewTemplate, activeSubTab]);

  const fetchPreview = async (templateId: string) => {
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/email/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: templateId })
      });
      const html = await res.text();
      setPreviewHtml(html);
    } catch (err: any) {
      setPreviewHtml(`<div style="padding:20px; color:red;">Failed to load template preview</div>`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSaveEmailSettings = async () => {
    if (!emailSettings) return;
    setSaving(true);
    setMessage(null);
    setEmailVerifyResult(null);
    try {
      const res = await fetch('/api/email/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setEmailSettings(data.settings);
        setMessage({ type: 'success', text: 'Email delivery settings saved successfully!' });
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Failed to save settings' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error saving settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyEmailConnection = async () => {
    if (!emailSettings) return;
    setVerifyingEmail(true);
    setEmailVerifyResult(null);
    try {
      const res = await fetch('/api/email/verify-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings)
      });
      const data = await res.json();
      setEmailVerifyResult(data);
    } catch (err: any) {
      setEmailVerifyResult({ success: false, message: err.message || 'Verification failed' });
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleFetchKlaviyoLists = async () => {
    if (!klaviyoSettings?.apiKey) return;
    setFetchingLists(true);
    try {
      const res = await fetch(`/api/klaviyo/lists?apiKey=${encodeURIComponent(klaviyoSettings.apiKey)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.lists)) {
        setKlaviyoLists(data.lists);
      }
    } catch (e) {
      console.warn('Failed to fetch lists:', e);
    } finally {
      setFetchingLists(false);
    }
  };

  const handleCheckKlaviyoHealth = async () => {
    setCheckingKlaviyoHealth(true);
    try {
      const res = await fetch('/api/klaviyo/health');
      setKlaviyoHealth(await res.json());
    } catch (err: any) {
      setKlaviyoHealth({ error: err.message || 'Failed to read Klaviyo delivery status' });
    } finally {
      setCheckingKlaviyoHealth(false);
    }
  };

  const handleVerifyKlaviyoKey = async () => {
    if (!klaviyoSettings?.apiKey) return;
    setVerifyingKlaviyoKey(true);
    setKlaviyoVerifyResult(null);
    try {
      const res = await fetch('/api/klaviyo/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: klaviyoSettings.apiKey })
      });
      const data = await res.json();
      setKlaviyoVerifyResult(data);
      if (data.success) {
        handleFetchKlaviyoLists();
        handleCheckKlaviyoHealth();
      }
    } catch (err: any) {
      setKlaviyoVerifyResult({ success: false, error: err.message || 'Failed to verify Klaviyo API key' });
    } finally {
      setVerifyingKlaviyoKey(false);
    }
  };

  const handleSaveKlaviyoSettings = async () => {
    if (!klaviyoSettings) return;
    setSaving(true);
    setMessage(null);
    setKlaviyoVerifyResult(null);
    try {
      const res = await fetch('/api/klaviyo/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(klaviyoSettings)
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.settings) {
          setKlaviyoSettings(data.settings);
        }
        setMessage({ type: 'success', text: 'Klaviyo settings saved successfully!' });
        if (klaviyoSettings.apiKey) {
          handleVerifyKlaviyoKey();
        }
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Failed to save Klaviyo settings' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error saving Klaviyo settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testRecipient || !testRecipient.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid recipient email address' });
      return;
    }

    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: testRecipient,
          type: testTemplate
        })
      });
      const result = await res.json();
      setTestResult(result);
      if (result.success) {
        setMessage({ type: 'success', text: `Test email sent to ${testRecipient}!` });
        loadData();
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to send test email' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Failed to dispatch test email' });
      setMessage({ type: 'error', text: err.message || 'Error sending test email' });
    } finally {
      setTestSending(false);
    }
  };

  const handleSendKlaviyoTest = async () => {
    if (!testKlaviyoEmail || !testKlaviyoEmail.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email for Klaviyo testing' });
      return;
    }

    setSendingKlaviyoTest(true);
    setTestKlaviyoResult(null);
    try {
      const res = await fetch('/api/klaviyo/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'purchase',
          data: {
            id: `PS-TEST-${Date.now().toString().slice(-5)}`,
            customerName: 'Scott Kivlin (Test User)',
            customerEmail: testKlaviyoEmail,
            total: 39.99,
            destination: 'London, United Kingdom',
            deliveryMethod: 'Royal Mail Tracked 24',
            items: [
              {
                id: 'p1',
                productId: 'p1',
                productTitle: 'VELO Freeze Max Strong 17mg Canister',
                price: 5.99,
                quantity: 4
              },
              {
                id: 'p2',
                productId: 'p2',
                productTitle: 'KILLA Cold Mint Extra Strong 16mg Canister',
                price: 5.49,
                quantity: 2
              }
            ]
          }
        })
      });

      const result = await res.json();
      setTestKlaviyoResult(result);
      if (result.success) {
        setMessage({ type: 'success', text: `Test 'Placed Order' event sent to Klaviyo for ${testKlaviyoEmail}!` });
        loadData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send event to Klaviyo' });
      }
    } catch (err: any) {
      setTestKlaviyoResult({ success: false, error: err.message || 'Error triggering Klaviyo test' });
      setMessage({ type: 'error', text: err.message || 'Error triggering Klaviyo event' });
    } finally {
      setSendingKlaviyoTest(false);
    }
  };

  const handleClearEmailLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all email delivery logs?')) return;
    try {
      const res = await fetch('/api/email/logs/clear', { method: 'POST' });
      if (res.ok) {
        setEmailLogs([]);
        setMessage({ type: 'success', text: 'Email logs cleared successfully' });
      }
    } catch (e) {}
  };

  const handleClearKlaviyoLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all Klaviyo activity logs?')) return;
    try {
      const res = await fetch('/api/klaviyo/logs/clear', { method: 'POST' });
      if (res.ok) {
        setKlaviyoLogs([]);
        setMessage({ type: 'success', text: 'Klaviyo logs cleared successfully' });
      }
    } catch (e) {}
  };

  if (loading) {
    return (
      <div id="email-settings-loading" className="flex items-center justify-center p-12 space-x-3 text-neutral-500">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
        <span className="font-medium text-sm">Loading email & telemetry systems...</span>
      </div>
    );
  }

  return (
    <div id="email-settings-container" className="space-y-6">
      {/* Sub-Navigation Tabs */}
      <div id="email-subnav" className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div className="flex flex-wrap items-center gap-1.5 bg-neutral-100 p-1 rounded-xl">
          <button
            id="subtab-config"
            onClick={() => setActiveSubTab('config')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'config'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-emerald-600" />
            Email Transport (Resend / Gmail / SMTP)
          </button>

          <button
            id="subtab-templates"
            onClick={() => setActiveSubTab('templates')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'templates'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            Templates & Triggers
          </button>

          <button
            id="subtab-preview"
            onClick={() => setActiveSubTab('preview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'preview'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-purple-600" />
            Live Preview
          </button>

          <button
            id="subtab-test"
            onClick={() => setActiveSubTab('test')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'test'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-amber-600" />
            Send Test Email
          </button>

          <button
            id="subtab-klaviyo"
            onClick={() => setActiveSubTab('klaviyo')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'klaviyo'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            Klaviyo Marketing Flows
          </button>

          <button
            id="subtab-logs"
            onClick={() => setActiveSubTab('logs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'logs'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            Activity Logs
            {emailLogs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-neutral-200 text-neutral-700 rounded-full">
                {emailLogs.length}
              </span>
            )}
          </button>
        </div>

        <button
          id="btn-refresh-email-data"
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Global Status Banner */}
      {message && (
        <div
          id="email-feedback-banner"
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-neutral-400 hover:text-neutral-600 ml-4 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* SUB-TAB 1: CONFIGURATION (GMAIL / SMTP / RESEND) */}
      {activeSubTab === 'config' && emailSettings && (
        <div id="email-config-panel" className="space-y-6">
          {/* Main Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Email Delivery Engine</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Configure direct Gmail delivery or custom SMTP so order confirmations are sent straight from your inbox to customers without third-party email issues.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="email-master-toggle"
                    checked={emailSettings.enabled}
                    onChange={(e) => setEmailSettings({ ...emailSettings, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
                <span className="text-xs font-semibold text-neutral-700">
                  {emailSettings.enabled ? 'Email System Active' : 'System Disabled'}
                </span>
              </div>
            </div>

            {/* Provider Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Select Outgoing Email Provider
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Resend Option */}
                <button
                  type="button"
                  id="provider-resend-btn"
                  onClick={() => setEmailSettings({ ...emailSettings, provider: 'resend' })}
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                    emailSettings.provider === 'resend'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-bold text-xs">
                        R
                      </div>
                      <span className="font-bold text-sm text-neutral-900">Resend API</span>
                    </div>
                    {emailSettings.provider === 'resend' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-2">
                    Direct transactional API with high deliverability via your Resend API Key and custom domain.
                  </p>
                </button>

                {/* Gmail Option */}
                <button
                  type="button"
                  id="provider-gmail-btn"
                  onClick={() => setEmailSettings({ ...emailSettings, provider: 'gmail' })}
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                    emailSettings.provider === 'gmail'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-xs">
                        G
                      </div>
                      <span className="font-bold text-sm text-neutral-900">Gmail / Workspace</span>
                    </div>
                    {emailSettings.provider === 'gmail' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-2">
                    Send real order emails directly through your Gmail account with 100% inbox delivery.
                  </p>
                </button>

                {/* Custom SMTP Option */}
                <button
                  type="button"
                  id="provider-smtp-btn"
                  onClick={() => setEmailSettings({ ...emailSettings, provider: 'smtp' })}
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                    emailSettings.provider === 'smtp'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                        <Server className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-neutral-900">Custom SMTP</span>
                    </div>
                    {emailSettings.provider === 'smtp' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-2">
                    Connect any custom mail server or corporate SMTP host (Outlook, SendGrid, Amazon SES SMTP).
                  </p>
                </button>
              </div>
            </div>

            {/* PROVIDER SPECIFIC SETTINGS */}

            {/* 1. Gmail Settings */}
            {emailSettings.provider === 'gmail' && (
              <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                      Gmail SMTP Configuration
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAppPasswordGuide(!showAppPasswordGuide)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    How to get a Google App Password
                  </button>
                </div>

                {showAppPasswordGuide && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-2">
                    <p className="font-bold">🔑 How to create a Google 16-character App Password:</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-800 pl-1">
                      <li>Go to your Google Account Security: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="font-bold underline text-blue-700">myaccount.google.com/apppasswords</a></li>
                      <li>Ensure <strong>2-Step Verification</strong> is enabled on your Google account.</li>
                      <li>Type App Name: <strong>Pouch Supply Co.</strong> and click <strong>Create</strong>.</li>
                      <li>Copy the generated <strong>16-character code</strong> (e.g. <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono">abcd efgh ijkl mnop</code>) and paste it below!</li>
                    </ol>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      Gmail Email Address
                    </label>
                    <input
                      type="email"
                      id="gmail-user-input"
                      value={emailSettings.gmailUser || ''}
                      onChange={(e) => setEmailSettings({ ...emailSettings, gmailUser: e.target.value })}
                      placeholder="e.g. scottkivlinpouch@gmail.com"
                      className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium bg-white"
                    />
                    <p className="text-[11px] text-neutral-500 mt-1">
                      The Gmail account used to dispatch order confirmations.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      Google App Password (16 characters)
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        id="gmail-password-input"
                        value={emailSettings.gmailAppPassword || ''}
                        onChange={(e) => setEmailSettings({ ...emailSettings, gmailAppPassword: e.target.value })}
                        placeholder="•••• •••• •••• ••••"
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono bg-white pr-10"
                      />
                      <Lock className="w-4 h-4 text-neutral-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Generated from Google Security &gt; App Passwords.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Custom SMTP Settings */}
            {emailSettings.provider === 'smtp' && (
              <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200 space-y-4">
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Custom SMTP Server Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      id="smtp-host-input"
                      value={emailSettings.smtpHost || ''}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                      placeholder="e.g. smtp.gmail.com or mail.pouch-supply.com"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      SMTP Port
                    </label>
                    <input
                      type="number"
                      id="smtp-port-input"
                      value={emailSettings.smtpPort || 465}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) || 465 })}
                      placeholder="465 or 587"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      SMTP Username
                    </label>
                    <input
                      type="text"
                      id="smtp-user-input"
                      value={emailSettings.smtpUser || ''}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                      placeholder="user@example.com"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      SMTP Password
                    </label>
                    <input
                      type="password"
                      id="smtp-password-input"
                      value={emailSettings.smtpPassword || ''}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. Resend Settings */}
            {emailSettings.provider === 'resend' && (
              <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200 space-y-4">
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Resend API Configuration
                </h4>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Resend API Key (re_...)
                  </label>
                  <input
                    type="password"
                    id="resend-api-key-input"
                    value={emailSettings.resendApiKey || ''}
                    onChange={(e) => setEmailSettings({ ...emailSettings, resendApiKey: e.target.value })}
                    placeholder="re_123456789abcdef"
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono bg-white"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Get an API key from <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="text-blue-600 underline">resend.com/api-keys</a>. Note: requires domain DNS verification for custom from domains.
                  </p>
                </div>
              </div>
            )}

            {/* Sender & Notification Details */}
            <div className="space-y-4 pt-2 border-t border-neutral-100">
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Store Sender Identity & Admin Notifications
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Sender Name
                  </label>
                  <input
                    type="text"
                    id="sender-name-input"
                    value={emailSettings.fromName || 'Pouch Supply Co.'}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                    placeholder="Pouch Supply Co."
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">Shown in customer inbox</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Sender / Reply-To Email
                  </label>
                  <input
                    type="email"
                    id="sender-email-input"
                    value={emailSettings.fromEmail || emailSettings.gmailUser || 'scottkivlinpouch@gmail.com'}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                    placeholder="orders@pouch-supply.com"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">Customer replies go here</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Admin Notification Email
                  </label>
                  <input
                    type="email"
                    id="admin-email-input"
                    value={emailSettings.adminNotificationEmail || 'scottkivlinpouch@gmail.com'}
                    onChange={(e) => setEmailSettings({ ...emailSettings, adminNotificationEmail: e.target.value })}
                    placeholder="scottkivlinpouch@gmail.com"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">Receives instant alerts on new orders</p>
                </div>
              </div>
            </div>

            {/* Connection Verification Result Banner */}
            {emailVerifyResult && (
              <div
                className={`p-4 rounded-xl border text-xs ${
                  emailVerifyResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {emailVerifyResult.success ? (
                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>
                    {emailVerifyResult.success
                      ? `Transporter Connection Successful (${emailVerifyResult.provider || emailSettings.provider})`
                      : 'Transporter Connection Failed'}
                  </span>
                </div>
                <p>{emailVerifyResult.message}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-neutral-100">
              <button
                type="button"
                id="btn-verify-connection"
                onClick={handleVerifyEmailConnection}
                disabled={verifyingEmail}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors border border-neutral-200 disabled:opacity-50"
              >
                {verifyingEmail ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    Testing Transporter Connection...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Test Transporter Connection
                  </>
                )}
              </button>

              <button
                type="button"
                id="btn-save-email-settings"
                onClick={handleSaveEmailSettings}
                disabled={saving}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Save Email Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TEMPLATES & TRIGGERS */}
      {activeSubTab === 'templates' && emailSettings && (
        <div id="email-templates-panel" className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Email Notification Triggers</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Enable or disable individual transactional email flows and customize their subject lines.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveEmailSettings}
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors"
            >
              {saving ? 'Saving...' : 'Save Subject Changes'}
            </button>
          </div>

          <div className="space-y-3">
            {TEMPLATE_OPTIONS.map((tmpl) => {
              const currentTmpl = emailSettings.templates[tmpl.id] || { enabled: true, subject: tmpl.label };
              return (
                <div
                  key={tmpl.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-white transition-colors"
                >
                  <div className="flex items-start gap-3 sm:w-1/3">
                    <label className="relative inline-flex items-center cursor-pointer mt-0.5">
                      <input
                        type="checkbox"
                        checked={currentTmpl.enabled}
                        onChange={(e) => {
                          const updated = {
                            ...emailSettings.templates,
                            [tmpl.id]: {
                              ...currentTmpl,
                              enabled: e.target.checked
                            }
                          };
                          setEmailSettings({ ...emailSettings, templates: updated });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900">{tmpl.label}</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-neutral-200 text-neutral-700 rounded-md">
                          {tmpl.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 font-mono mt-0.5">{tmpl.id}</p>
                    </div>
                  </div>

                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xs text-neutral-400 font-medium">Subject:</span>
                    <input
                      type="text"
                      value={currentTmpl.subject || ''}
                      onChange={(e) => {
                        const updated = {
                          ...emailSettings.templates,
                          [tmpl.id]: {
                            ...currentTmpl,
                            subject: e.target.value
                          }
                        };
                        setEmailSettings({ ...emailSettings, templates: updated });
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPreviewTemplate(tmpl.id);
                      setActiveSubTab('preview');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-200/60 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: LIVE PREVIEW */}
      {activeSubTab === 'preview' && (
        <div id="email-preview-panel" className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-neutral-700">Template:</label>
              <select
                value={selectedPreviewTemplate}
                onChange={(e) => setSelectedPreviewTemplate(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {TEMPLATE_OPTIONS.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.label} ({tmpl.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
                  previewDevice === 'desktop'
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                Desktop
              </button>

              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
                  previewDevice === 'mobile'
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Mobile
              </button>

              <button
                type="button"
                onClick={() => {
                  setTestTemplate(selectedPreviewTemplate);
                  setActiveSubTab('test');
                }}
                className="ml-2 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Send as Test Email
              </button>
            </div>
          </div>

          <div className="flex justify-center bg-neutral-100 p-6 rounded-xl overflow-hidden min-h-[500px]">
            {previewLoading ? (
              <div className="flex items-center justify-center space-x-2 text-neutral-400">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="text-xs">Rendering responsive HTML preview...</span>
              </div>
            ) : (
              <div
                className={`bg-white rounded-xl shadow-lg border border-neutral-300 transition-all duration-300 overflow-hidden ${
                  previewDevice === 'mobile' ? 'w-[375px] h-[650px]' : 'w-full max-w-[650px] h-[650px]'
                }`}
              >
                <iframe
                  srcDoc={previewHtml}
                  title="Email Template Live Preview"
                  className="w-full h-full border-0"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SEND TEST EMAIL */}
      {activeSubTab === 'test' && (
        <div id="email-test-panel" className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-6 max-w-2xl mx-auto">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">Dispatch Live Test Email</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Send a real sample email through your configured transport ({emailSettings?.provider?.toUpperCase() || 'GMAIL'}) to Scott Kivlin or any customer inbox to confirm instantaneous delivery.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Recipient Email Address
              </label>
              <input
                type="email"
                id="test-recipient-input"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="scottkivlinpouch@gmail.com"
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Select Template to Test
              </label>
              <select
                value={testTemplate}
                onChange={(e) => setTestTemplate(e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold bg-white"
              >
                {TEMPLATE_OPTIONS.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.label} ({tmpl.category})
                  </option>
                ))}
              </select>
            </div>

            {testResult && (
              <div
                className={`p-4 rounded-xl border text-xs ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{testResult.success ? 'Email Dispatched Successfully!' : 'Email Dispatch Failed'}</span>
                </div>
                <p>{testResult.message || (testResult.error && String(testResult.error)) || JSON.stringify(testResult)}</p>
                {testResult.log?.resendId && (
                  <p className="mt-1 font-mono text-[10px] text-emerald-700 bg-emerald-100/60 px-2 py-1 rounded inline-block">
                    Resend Email ID: {testResult.log.resendId}
                  </p>
                )}
                {testResult.log?.messageId && (
                  <p className="mt-1 font-mono text-[10px] text-neutral-600">Message ID: {testResult.log.messageId}</p>
                )}
              </div>
            )}

            <button
              type="button"
              id="btn-send-test-email"
              onClick={handleSendTestEmail}
              disabled={testSending}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 transition-all shadow-sm disabled:opacity-50"
            >
              {testSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Dispatching to {testRecipient}...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Test Email Now
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: KLAVIYO MARKETING FLOWS */}
      {activeSubTab === 'klaviyo' && klaviyoSettings && (
        <div id="klaviyo-panel" className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-neutral-900">Klaviyo E-Commerce Integration</h3>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Automatically synchronizes subscriber consent and dispatches rich e-commerce events (Placed Order, Ordered Product, Checkout Started) to trigger your Klaviyo flows.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="klaviyo-master-toggle"
                  checked={klaviyoSettings.enabled}
                  onChange={(e) => setKlaviyoSettings({ ...klaviyoSettings, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
              <span className="text-xs font-semibold text-neutral-700">
                {klaviyoSettings.enabled ? 'Klaviyo Active' : 'Klaviyo Disabled'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Klaviyo Private API Key (pk_...)
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="klaviyo-api-key-input"
                  value={klaviyoSettings.apiKey || ''}
                  onChange={(e) => setKlaviyoSettings({ ...klaviyoSettings, apiKey: e.target.value })}
                  placeholder="pk_123456789abcdef..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono bg-white pr-10"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Found in Klaviyo Settings &gt; API Keys &gt; Create Private API Key (choose Full Access).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Public API Key / Site ID (6 characters)
              </label>
              <input
                type="text"
                id="klaviyo-site-id-input"
                value={klaviyoSettings.siteId || klaviyoSettings.publicKey || 'VPbY66'}
                onChange={(e) => setKlaviyoSettings({ ...klaviyoSettings, siteId: e.target.value, publicKey: e.target.value })}
                placeholder="e.g. VPbY66"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono bg-white"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Your 6-character Klaviyo Account / Company ID for client tracking.
              </p>
            </div>
          </div>

          {/* List Subscription Settings */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Default Klaviyo Subscriber List (Auto-Consent)
              </h4>
              <button
                type="button"
                onClick={handleFetchKlaviyoLists}
                disabled={fetchingLists || !klaviyoSettings.apiKey}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fetchingLists ? 'animate-spin' : ''}`} />
                {fetchingLists ? 'Fetching Lists...' : 'Fetch Lists from Klaviyo'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Select List
                </label>
                {klaviyoLists.length > 0 ? (
                  <select
                    value={klaviyoSettings.listId || ''}
                    onChange={(e) => setKlaviyoSettings({ ...klaviyoSettings, listId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- No specific list (General consent only) --</option>
                    {klaviyoLists.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={klaviyoSettings.listId || ''}
                    onChange={(e) => setKlaviyoSettings({ ...klaviyoSettings, listId: e.target.value })}
                    placeholder="e.g. Yg4xJk or Newsletter"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 bg-white font-mono"
                  />
                )}
              </div>

              <div className="flex items-center pt-4">
                <p className="text-[11px] text-neutral-500">
                  Customers who purchase are automatically granted email marketing consent (<code className="bg-neutral-200 px-1 rounded font-mono">SUBSCRIBED</code>) so your automated Klaviyo flows trigger immediately.
                </p>
              </div>
            </div>
          </div>

          {/* Verification Status */}
          {klaviyoHealth && (
            <div className="rounded-xl border p-4 text-xs space-y-3 border-neutral-200 bg-neutral-50">
              <div className="flex items-center gap-2 font-bold text-neutral-900">
                {klaviyoHealth.healthy ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>
                  {klaviyoHealth.error
                    ? 'Could not read Klaviyo delivery status'
                    : klaviyoHealth.healthy
                      ? 'Klaviyo is set up to send'
                      : 'Klaviyo accepts events but will not send email'}
                </span>
              </div>

              {klaviyoHealth.error && <p className="text-neutral-600">{klaviyoHealth.error}</p>}

              {Array.isArray(klaviyoHealth.flows) && klaviyoHealth.flows.length > 0 && (
                <div className="space-y-1">
                  <p className="font-bold text-neutral-500 uppercase tracking-wider text-[10px]">Flows in your Klaviyo account</p>
                  {klaviyoHealth.flows.map((f, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-0.5">
                      <span className="text-neutral-700 truncate">{f.name}</span>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          f.status === 'live'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {f.status}
                      </span>
                    </div>
                  ))}
                  <p className="text-[11px] text-neutral-500 pt-1">
                    A flow that is not live receives the event and sends nothing. Set it live in
                    Klaviyo &gt; Flows to start delivering.
                  </p>
                </div>
              )}

              {Array.isArray(klaviyoHealth.issues) && klaviyoHealth.issues.length > 0 && (
                <ul className="list-disc pl-4 space-y-1 text-neutral-700">
                  {klaviyoHealth.issues.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {klaviyoVerifyResult && (
            <div
              className={`p-4 rounded-xl border text-xs ${
                klaviyoVerifyResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2 font-bold mb-1">
                {klaviyoVerifyResult.success ? (
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>{klaviyoVerifyResult.success ? 'Klaviyo API Key Valid' : 'Klaviyo API Verification Failed'}</span>
              </div>
              <p>{klaviyoVerifyResult.message || klaviyoVerifyResult.error}</p>
            </div>
          )}

          {/* Actions & Live Event Tester */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              id="btn-verify-klaviyo-key"
              onClick={handleVerifyKlaviyoKey}
              disabled={verifyingKlaviyoKey || !klaviyoSettings.apiKey}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors border border-neutral-200 disabled:opacity-50"
            >
              {verifyingKlaviyoKey ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  Verifying API Key...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verify Klaviyo Key
                </>
              )}
            </button>

            <button
              type="button"
              id="btn-check-klaviyo-health"
              onClick={handleCheckKlaviyoHealth}
              disabled={checkingKlaviyoHealth}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors border border-neutral-200 disabled:opacity-50"
            >
              {checkingKlaviyoHealth ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  Checking flows...
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5 text-indigo-600" />
                  Check Email Delivery
                </>
              )}
            </button>

            <button
              type="button"
              id="btn-save-klaviyo-settings"
              onClick={handleSaveKlaviyoSettings}
              disabled={saving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Save Klaviyo Settings
                </>
              )}
            </button>
          </div>

          {/* Klaviyo Test Event Trigger Box */}
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">
              🧪 Trigger Real Klaviyo "Placed Order" Event
            </h4>
            <p className="text-xs text-neutral-500 mb-4">
              Dispatches a test e-commerce order payload to your Klaviyo account to verify your flows and metric aggregations.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={testKlaviyoEmail}
                onChange={(e) => setTestKlaviyoEmail(e.target.value)}
                placeholder="scottkivlinpouch@gmail.com"
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-neutral-300 focus:ring-2 focus:ring-emerald-500 bg-white"
              />
              <button
                type="button"
                id="btn-send-klaviyo-test"
                onClick={handleSendKlaviyoTest}
                disabled={sendingKlaviyoTest}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {sendingKlaviyoTest ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Triggering Event...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Trigger Placed Order Event
                  </>
                )}
              </button>
            </div>

            {testKlaviyoResult && (
              <div
                className={`mt-3 p-3.5 rounded-xl border text-xs ${
                  testKlaviyoResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <p className="font-bold">
                  {testKlaviyoResult.success
                    ? 'Event successfully received by Klaviyo!'
                    : `Klaviyo Error: ${testKlaviyoResult.error || 'Failed'}`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 6: ACTIVITY LOGS */}
      {activeSubTab === 'logs' && (
        <div id="email-logs-panel" className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Email & Telemetry Activity Logs</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Audit history of transactional emails and Klaviyo events dispatched by the application.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearEmailLogs}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Email Logs
              </button>

              <button
                type="button"
                onClick={handleClearKlaviyoLogs}
                className="px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Klaviyo Logs
              </button>
            </div>
          </div>

          {/* Log List */}
          <div className="space-y-3">
            {emailLogs.length === 0 ? (
              <div className="text-center py-12 text-neutral-400">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">No email activity logs recorded yet.</p>
                <p className="text-[11px] text-neutral-400 mt-1">Send a test email or place an order to see real-time delivery logs.</p>
              </div>
            ) : (
              emailLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/60 hover:bg-white transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                          log.status === 'sent'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'disabled'
                            ? 'bg-neutral-200 text-neutral-700'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.status}
                      </span>
                      <span className="text-xs font-bold text-neutral-900">{log.subject}</span>
                      {log.provider && (
                        <span className="px-1.5 py-0.2 text-[10px] font-mono bg-blue-50 text-blue-700 rounded border border-blue-200">
                          {log.provider.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                      <span>To: <strong>{log.recipient}</strong></span>
                      <span>&bull;</span>
                      <span>Type: <code className="font-mono">{log.type}</code></span>
                      {log.error && (
                        <>
                          <span>&bull;</span>
                          <span className="text-rose-600 font-medium">Error: {log.error}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-neutral-400 font-mono flex-shrink-0">
                    {new Date(log.timestamp).toLocaleString('en-GB')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
