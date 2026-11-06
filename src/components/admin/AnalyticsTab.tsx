import React, { useCallback, useEffect, useState } from 'react';
import {
  TrendingUp, Users, HardDrive, Eye, Globe, MousePointerClick, Monitor,
  RefreshCw, AlertTriangle, Loader2, ExternalLink
} from 'lucide-react';

interface StatsProps {
  totalSales: number;
  todaySales: number;
  completedOrders: number;
  avgOrderValue: number;
  pathD: string;
  graphPoints: { label: string }[];
}

interface AnalyticsTabProps {
  stats: StatsProps;
}

interface NamedRow {
  name: string;
  pageviews: number;
  visitors: number;
}

type Traffic =
  | { configured: true; since: string; until: string; rangeDays: number;
      totals: { pageviews: number; visitors: number };
      daily: Array<{ date: string; pageviews: number; visitors: number }>;
      topRoutes: NamedRow[]; topCountries: NamedRow[]; topReferrers: NamedRow[]; devices: NamedRow[];
      partial: string[]; account: { team: string | null; detectedFrom: string }; fetchedAt: string }
  | { configured: false; missing: string[] }
  | { configured: true; error: string };

const RANGES = [7, 30, 90];

/** Turns a daily series into an SVG polyline path, scaled to the box. */
function sparkPath(values: number[], width = 560, height = 120): string {
  if (values.length === 0) return '';
  if (values.length === 1) return `M0,${height / 2} L${width},${height / 2}`;
  const max = Math.max(...values, 1);
  const step = width / (values.length - 1);
  return values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(height - (v / max) * height * 0.9 - 6).toFixed(1)}`)
    .join(' ');
}

/** A labelled bar list — used for pages, countries, referrers and devices. */
const BarList: React.FC<{ title: string; icon: React.ReactNode; rows: NamedRow[]; empty: string; metric?: 'visitors' | 'pageviews' }> =
  ({ title, icon, rows, empty, metric = 'visitors' }) => {
    const top = Math.max(...rows.map(r => r[metric]), 1);
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h4 className="font-extrabold text-slate-800 text-sm mb-4 flex items-center gap-2">{icon} {title}</h4>
        {rows.length === 0 ? (
          <p className="text-[11px] text-slate-400 py-6 text-center">{empty}</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row, idx) => (
              <div key={`${row.name}-${idx}`} className="space-y-1">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 gap-3">
                  <span className="truncate" title={row.name}>{row.name}</span>
                  <span className="shrink-0 text-slate-500 tabular-nums">
                    {row[metric].toLocaleString()} {metric === 'visitors' ? 'visitors' : 'views'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-900 h-full rounded-full transition-all duration-500"
                       style={{ width: `${Math.max(2, (row[metric] / top) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ stats }) => {
  const [traffic, setTraffic] = useState<Traffic | null>(null);
  const [days, setDays] = useState(30);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (rangeDays: number, refresh = false) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/analytics/traffic?days=${rangeDays}${refresh ? '&refresh=1' : ''}`);
      const data = await res.json().catch(() => null);
      setTraffic(data ?? { configured: true, error: 'The server did not answer.' });
    } catch (err: any) {
      setTraffic({ configured: true, error: err?.message || 'Could not reach the server.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(days); }, [days, load]);

  const live = traffic && traffic.configured === true && !('error' in traffic) ? traffic : null;
  const visitors = live?.totals.visitors ?? 0;
  const pageviews = live?.totals.pageviews ?? 0;

  // Real orders over real visitors. Nothing is estimated: with no traffic data
  // this stays null and the card says so rather than showing a percentage.
  const conversionRate = live && visitors > 0 ? (stats.completedOrders / visitors) * 100 : null;

  return (
    <div className="space-y-6">
      {/* Range control */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-black text-[#1a1c1d]">Analytics</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Revenue and orders from your store. Traffic from Vercel Web Analytics
            {live ? ` · ${live.since} to ${live.until}` : ''}.
            {live && (
              <span className="text-slate-400">
                {' '}Account: {live.account.team ? live.account.team : 'personal'}
                {live.account.detectedFrom === 'team-lookup' ? ' (detected)' : ''}.
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {RANGES.map(r => (
            <button key={r} type="button" onClick={() => setDays(r)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                days === r ? 'bg-[#1a1c1d] text-white border-[#1a1c1d]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}>
              {r} days
            </button>
          ))}
          <button type="button" onClick={() => load(days, true)} disabled={isLoading}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Refresh
          </button>
        </div>
      </div>

      {/* Traffic unavailable — say why, never substitute a number */}
      {traffic && traffic.configured === false && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-black"><AlertTriangle className="h-4 w-4" /> Vercel Analytics is not connected</div>
          <p className="leading-relaxed">
            Page views are being collected, but this dashboard cannot read them back until these
            environment variables are set on the Vercel project:
          </p>
          <ul className="list-disc list-inside font-mono text-[11px]">
            {traffic.missing.map(m => <li key={m}>{m}</li>)}
          </ul>
          <p className="leading-relaxed">
            <code className="font-mono">VERCEL_API_TOKEN</code> is an access token you create under
            Account Settings → Tokens. <code className="font-mono">VERCEL_PROJECT_ID</code> is supplied
            automatically when “Enable access to System Environment Variables” is on.
          </p>
          <p className="leading-relaxed">
            No team id is needed — if the project belongs to a team, it is found from the token.
          </p>
        </div>
      )}
      {traffic && traffic.configured === true && 'error' in traffic && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800">
          <div className="flex items-center gap-2 font-black mb-1"><AlertTriangle className="h-4 w-4" /> Vercel Analytics could not be read</div>
          <p className="font-mono text-[11px]">{traffic.error}</p>
          <p className="mt-1.5">Traffic figures are hidden rather than estimated. Revenue and order figures below are unaffected.</p>
        </div>
      )}

      {/* Headline metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative">
          <TrendingUp className="absolute top-5 right-5 text-indigo-600 h-5 w-5" />
          <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Total Revenue</span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">£{(Number(stats?.totalSales) || 0).toFixed(2)}</h3>
          <div className="text-[11px] text-emerald-600 font-bold mt-2">
            £{(Number(stats?.todaySales) || 0).toFixed(2)} <span className="text-slate-400 font-medium">today</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative">
          <Users className="absolute top-5 right-5 text-indigo-600 h-5 w-5" />
          <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Visitors</span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            {isLoading && !live ? '—' : live ? visitors.toLocaleString() : '—'}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">{live ? `Unique, last ${live.rangeDays} days` : 'Traffic data unavailable'}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative">
          <Eye className="absolute top-5 right-5 text-indigo-600 h-5 w-5" />
          <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Page Views</span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            {isLoading && !live ? '—' : live ? pageviews.toLocaleString() : '—'}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            {live && visitors > 0 ? `${(pageviews / visitors).toFixed(1)} pages per visitor` : 'Traffic data unavailable'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative">
          <MousePointerClick className="absolute top-5 right-5 text-indigo-600 h-5 w-5" />
          <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Conversion rate</span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            {conversionRate === null ? '—' : `${conversionRate.toFixed(2)}%`}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            {conversionRate === null
              ? 'Needs visitor data to calculate'
              : `${stats.completedOrders} order(s) from ${visitors.toLocaleString()} visitors`}
          </p>
          {conversionRate !== null && (
            <div className="w-full bg-slate-100 h-1.5 mt-3 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${Math.min(100, conversionRate)}%` }} />
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative">
          <HardDrive className="absolute top-5 right-5 text-indigo-600 h-5 w-5" />
          <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Average Order Value</span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">£{(Number(stats?.avgOrderValue) || 0).toFixed(2)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Across {stats.completedOrders} paid order(s)</p>
        </div>
      </div>

      {/* Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h4 className="font-extrabold text-slate-800 text-sm mb-4">Revenue Trend</h4>
          <svg viewBox="0 0 560 120" className="w-full h-[120px]" preserveAspectRatio="none">
            <path d={stats.pathD} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <div className="flex justify-between text-[10px] text-slate-400 mt-2">
            {stats.graphPoints?.map((p, i) => <span key={i}>{p.label}</span>)}
          </div>
          <div className="mt-3 text-[10px] text-slate-500">Source: your own paid orders</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h4 className="font-extrabold text-slate-800 text-sm mb-4">Traffic Trend</h4>
          {live && live.daily.length > 0 ? (
            <>
              <svg viewBox="0 0 560 120" className="w-full h-[120px]" preserveAspectRatio="none">
                <path d={sparkPath(live.daily.map(d => d.pageviews))} fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                <path d={sparkPath(live.daily.map(d => d.visitors))} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
              </svg>
              <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                <span>{live.daily[0]?.date}</span>
                <span>{live.daily[live.daily.length - 1]?.date}</span>
              </div>
              <div className="mt-3 text-[10px] text-slate-500 flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-slate-900" /> page views</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-emerald-500" /> visitors</span>
                <span className="ml-auto">Source: Vercel Web Analytics</span>
              </div>
            </>
          ) : (
            <div className="h-[120px] flex items-center justify-center text-[11px] text-slate-400">
              {isLoading ? 'Loading traffic…' : 'No traffic data for this period'}
            </div>
          )}
        </div>
      </div>

      {/* Breakdowns, all from Vercel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarList title="Top Pages" icon={<Eye className="h-4 w-4 text-slate-500" />}
                 rows={live?.topRoutes ?? []} metric="pageviews"
                 empty={live ? 'No page data for this period' : 'Traffic data unavailable'} />
        <BarList title="Top Countries" icon={<Globe className="h-4 w-4 text-slate-500" />}
                 rows={live?.topCountries ?? []}
                 empty={live ? 'No country data for this period' : 'Traffic data unavailable'} />
        <BarList title="Top Referrers" icon={<ExternalLink className="h-4 w-4 text-slate-500" />}
                 rows={live?.topReferrers ?? []}
                 empty={live ? 'No referrer data — most visits were direct' : 'Traffic data unavailable'} />
        <BarList title="Devices" icon={<Monitor className="h-4 w-4 text-slate-500" />}
                 rows={live?.devices ?? []}
                 empty={live ? 'No device data for this period' : 'Traffic data unavailable'} />
      </div>

      {live && live.partial.length > 0 && (
        <p className="text-[10.5px] text-slate-400">
          Vercel returned no data for: {live.partial.join(', ')}. Those panels are empty rather than estimated.
        </p>
      )}
    </div>
  );
};

export default AnalyticsTab;
