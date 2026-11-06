import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, AlertCircle, AlertTriangle, Save, RefreshCw, ShieldCheck, MapPin, Package, Calculator, ExternalLink } from 'lucide-react';

export interface RoyalMailSettingsData {
  apiKey: string;
  integrationName: string;
  enabled: boolean;
  autoCreateShipmentOnPayment: boolean;
  defaultServiceCode: string;
  defaultPackageType: string;
  defaultWeightGrams: number;
  senderAddress: {
    companyName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postcode: string;
    countryCode: string;
    contactEmail: string;
    contactPhone: string;
  };
}

export const RoyalMailSettingsCard: React.FC = () => {
  // The sender identity starts empty on purpose. These values are printed on
  // real Royal Mail labels and used as the returns address, so a placeholder
  // saved by accident would send undeliverable parcels to a fictional address.
  const [settings, setSettings] = useState<RoyalMailSettingsData>({
    apiKey: '',
    integrationName: 'Pouch-Supply',
    enabled: true,
    autoCreateShipmentOnPayment: false,
    defaultServiceCode: '',
    defaultPackageType: 'smallParcel',
    defaultWeightGrams: 70,
    senderAddress: {
      companyName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      postcode: '',
      countryCode: 'GB',
      contactEmail: '',
      contactPhone: ''
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Live Connection Status
  const [connStatus, setConnStatus] = useState<{
    checking: boolean;
    connected?: boolean;
    message?: string;
    status?: number;
    environment?: string;
    checkedAt?: string;
  }>({ checking: false });

  // Address validation & rates calculator state
  const [testPostcode, setTestPostcode] = useState('EC1A 1BB');
  const [testWeight, setTestWeight] = useState(70);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcResults, setCalcResults] = useState<any>(null);

  const checkLiveConnection = async () => {
    setConnStatus({ checking: true });
    try {
      const res = await fetch('/api/royalmail/connection');
      const data = await res.json();
      setConnStatus({
        checking: false,
        connected: Boolean(data.success && data.connected),
        message: data.message || (data.connected ? 'Royal Mail Click & Drop API is connected.' : 'Connection failed'),
        status: data.status,
        environment: data.environment || 'LIVE',
        checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    } catch (err: any) {
      setConnStatus({
        checking: false,
        connected: false,
        message: err?.message || 'Failed to connect to backend service',
        checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    }
  };

  useEffect(() => {
    fetch('/api/royalmail/settings')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setSettings(prev => ({
            ...prev,
            ...data,
            senderAddress: {
              ...prev.senderAddress,
              ...(data.senderAddress || {})
            }
          }));
        }
      })
      .catch(err => console.error('Failed to load Royal Mail settings:', err))
      .finally(() => setLoading(false));

    checkLiveConnection();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      const res = await fetch('/api/royalmail/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      // A rejected save used to fall through this branch in silence, so the
      // screen looked exactly as it does on success and the settings were
      // quietly left unsaved. Read the value back instead of trusting the
      // status code: this form is the only thing standing between an operator
      // and a shipment that cannot be created.
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        setSaveError(detail?.error || `Save failed (HTTP ${res.status}). Settings were not stored.`);
        return;
      }

      const confirmRes = await fetch('/api/royalmail/settings');
      const stored = confirmRes.ok ? await confirmRes.json().catch(() => null) : null;
      const senderMissing =
        !stored?.senderAddress?.companyName?.trim() ||
        !stored?.senderAddress?.addressLine1?.trim() ||
        !stored?.senderAddress?.city?.trim() ||
        !stored?.senderAddress?.postcode?.trim();

      if (senderMissing) {
        setSaveError(
          'Saved, but the sender address did not store. Royal Mail needs a company name, ' +
            'address line 1, town and postcode before any shipment can be created.'
        );
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }

      if (stored) setSettings(prev => ({ ...prev, ...stored, senderAddress: { ...prev.senderAddress, ...(stored.senderAddress || {}) } }));
      // Re-check the live Royal Mail connection with the newly saved key
      checkLiveConnection();
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save Royal Mail settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleCalculateRates = async () => {
    setCalcLoading(true);
    try {
      const [valRes, rateRes] = await Promise.all([
        fetch('/api/royalmail/validate-address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName: 'Test Recipient', addressLine1: '123 High Street', city: 'London', postcode: testPostcode, countryCode: 'GB' })
        }),
        fetch('/api/royalmail/rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weightGrams: testWeight, countryCode: 'GB' })
        })
      ]);

      const valData = await valRes.json();
      const rateData = await rateRes.json();
      setCalcResults({ validation: valData, rates: rateData.rates });
    } catch (err: any) {
      alert('Rate lookup error: ' + err.message);
    } finally {
      setCalcLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500">
        <RefreshCw className="h-5 w-5 animate-spin mr-2 text-rose-600" />
        <span>Loading Royal Mail Click & Drop Configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
              <Truck className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Royal Mail Click & Drop® API</h3>
                <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Integration: Pouch-Supply
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated shipping labels, Royal Mail tracking numbers, address validation, and direct dispatch emails.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Royal Mail Click &amp; Drop settings saved and verified.</span>
          </div>
        )}

        {saveError && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-lg flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{saveError}</span>
          </div>
        )}
      </div>

      {/* Live API Connection Status Banner */}
      <div className={`border rounded-xl p-5 shadow-xs transition-all ${
        connStatus.checking
          ? 'bg-amber-50/50 border-amber-200'
          : connStatus.connected
          ? 'bg-emerald-50/70 border-emerald-200'
          : 'bg-rose-50/70 border-rose-200'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
              connStatus.checking
                ? 'bg-amber-100 text-amber-700'
                : connStatus.connected
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700'
            }`}>
              {connStatus.checking ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : connStatus.connected ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                  Royal Mail Click & Drop Integration Status
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  connStatus.checking
                    ? 'bg-amber-100 text-amber-800'
                    : connStatus.connected
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {connStatus.checking ? 'Testing...' : connStatus.connected ? 'LIVE & WORKING' : 'DISCONNECTED / API ERROR'}
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-700 mt-1">
                {connStatus.checking
                  ? 'Verifying API key connection directly with Royal Mail Click & Drop API...'
                  : connStatus.message}
              </p>

              {connStatus.checkedAt && (
                <p className="text-[10px] text-slate-400 mt-1">
                  Last checked at {connStatus.checkedAt} • Royal Mail Live API Connected
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={checkLiveConnection}
            disabled={connStatus.checking}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${connStatus.checking ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Card: API Key & Defaults */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-rose-600" /> API Authorization & Defaults
          </h4>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Integration Name
              </label>
              <input
                type="text"
                value={settings.integrationName}
                onChange={(e) => setSettings({ ...settings, integrationName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Pouch-Supply"
              />
              <p className="text-[11px] text-slate-500 mt-1">Identifies your store integration on Royal Mail Click & Drop.</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Click & Drop API Authorization Key
                </label>
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  {showApiKey ? 'Hide Key' : 'Show Key'}
                </button>
              </div>
              <input
                type={showApiKey ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder="e.g. rm_live_sec_9a8b7c6d5e4f3a..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Obtain your API Key from your Royal Mail Click & Drop Account &gt; Settings &gt; Integrations &gt; Click & Drop API.
                {settings.apiKey ? (
                  <span className="text-emerald-700 font-bold ml-1">✓ API Key Configured</span>
                ) : (
                  <span className="text-amber-700 font-bold ml-1"> (Click & Drop API Key pending configuration)</span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Default Postage Service
                </label>
                <input
                  list="royalmail-service-codes"
                  value={settings.defaultServiceCode}
                  onChange={(e) => setSettings({ ...settings, defaultServiceCode: e.target.value.trim().toUpperCase() })}
                  placeholder="Leave blank to set postage in Click &amp; Drop"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <datalist id="royalmail-service-codes">
                  <option value="TOLP24">Royal Mail Tracked 24® — tracking number issued</option>
                  <option value="TOLP48">Royal Mail Tracked 48® — tracking number issued</option>
                  <option value="OLP1">Royal Mail 1st Class (no tracking)</option>
                  <option value="OLP1SF">Royal Mail Signed For® 1st Class (no tracking)</option>
                  <option value="OLP2">Royal Mail 2nd Class (no tracking)</option>
                  <option value="OLP2SF">Royal Mail Signed For® 2nd Class (no tracking)</option>
                </datalist>
                <p className="text-[10px] text-slate-500 font-medium mt-1 leading-snug">
                  This account&apos;s domestic services are TOLP24, TOLP48, OLP1, OLP1SF, OLP2
                  and OLP2SF. Only the two Tracked services issue a tracking number; on the
                  others an order cannot be marked Shipped and no dispatch email is sent.
                  A code your account does not hold makes every shipment fail with
                  &quot;service code could not be found&quot;; leaving this blank is also
                  valid and lets you apply postage in Click &amp; Drop instead.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Default Weight (Grams)
                </label>
                <input
                  type="number"
                  value={settings.defaultWeightGrams}
                  onChange={(e) => setSettings({ ...settings, defaultWeightGrams: parseInt(e.target.value, 10) || 70 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoCreateShipmentOnPayment}
                onChange={(e) => setSettings({ ...settings, autoCreateShipmentOnPayment: e.target.checked })}
                className="mt-0.5 h-4 w-4 accent-rose-600 cursor-pointer"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold block text-slate-900">Create shipment automatically on payment</span>
                Registers a Click &amp; Drop order the moment an order is paid. Leave off to
                create shipments when orders are actually packed &mdash; otherwise the
                dispatch email goes out alongside the order confirmation.
              </span>
            </label>
          </div>
        </div>

        {/* Right Card: Warehouse Sender Address */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <MapPin className="h-4 w-4 text-rose-600" /> Sender / Warehouse Address
          </h4>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Company Name</label>
              <input
                type="text"
                value={settings.senderAddress.companyName}
                onChange={(e) => setSettings({
                  ...settings,
                  senderAddress: { ...settings.senderAddress, companyName: e.target.value }
                })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Address Line 1</label>
                <input
                  type="text"
                  value={settings.senderAddress.addressLine1}
                  onChange={(e) => setSettings({
                    ...settings,
                    senderAddress: { ...settings.senderAddress, addressLine1: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  value={settings.senderAddress.addressLine2 || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    senderAddress: { ...settings.senderAddress, addressLine2: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">City</label>
                <input
                  type="text"
                  value={settings.senderAddress.city}
                  onChange={(e) => setSettings({
                    ...settings,
                    senderAddress: { ...settings.senderAddress, city: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Postcode</label>
                <input
                  type="text"
                  value={settings.senderAddress.postcode}
                  onChange={(e) => setSettings({
                    ...settings,
                    senderAddress: { ...settings.senderAddress, postcode: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Country Code</label>
                <input
                  type="text"
                  value={settings.senderAddress.countryCode}
                  onChange={(e) => setSettings({
                    ...settings,
                    senderAddress: { ...settings.senderAddress, countryCode: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Validation & Rate Calculator Diagnostic */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
        <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <Calculator className="h-4 w-4 text-rose-600" /> Royal Mail Address Validation & Rate Calculator Test
        </h4>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={testPostcode}
            onChange={(e) => setTestPostcode(e.target.value)}
            placeholder="UK Postcode (e.g. EC1A 1BB)"
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />

          <input
            type="number"
            value={testWeight}
            onChange={(e) => setTestWeight(parseInt(e.target.value, 10) || 70)}
            placeholder="Weight in Grams"
            className="w-32 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />

          <button
            onClick={handleCalculateRates}
            disabled={calcLoading}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
          >
            {calcLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Calculator className="h-3.5 w-3.5" />}
            <span>Calculate Royal Mail Rates</span>
          </button>
        </div>

        {calcResults && (
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold">
              {calcResults.validation?.valid ? (
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Address Format Valid ({testPostcode.toUpperCase()})
                </span>
              ) : (
                <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-600" /> Invalid Postcode Format
                </span>
              )}
            </div>

            {calcResults.rates && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                {calcResults.rates.map((rate: any) => (
                  <div key={rate.serviceCode} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-xs text-slate-900">{rate.serviceCode}</span>
                      <span className="font-black text-sm text-slate-900">£{rate.price.toFixed(2)}</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-700">{rate.serviceName}</p>
                    <p className="text-[10px] text-slate-500">{rate.estimatedDelivery}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
