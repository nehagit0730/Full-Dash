import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Trash2, RotateCcw, RefreshCw, AlertTriangle, CheckSquare, Square, Clock, Loader2, Inbox
} from 'lucide-react';

export interface RecycleBinEntry {
  id: string;
  resource: string;
  resourceLabel: string;
  itemId: string;
  label: string;
  deletedAt: string;
  expiresAt: string;
  daysLeft: number;
  deletedBy: string | null;
}

interface RecycleBinTabProps {
  /** Called after a restore, so the dashboard can reload the section it went back to. */
  onRestored?: () => void;
  /** Keeps the sidebar badge in step. */
  onCountChange?: (total: number) => void;
}

type PendingConfirm =
  | { kind: 'delete-selected'; count: number }
  | { kind: 'clear'; count: number }
  | null;

const RESOURCE_ORDER = ['orders', 'products', 'collections', 'customPages', 'blogs', 'customers', 'files'];

export default function RecycleBinTab({ onRestored, onCountChange }: RecycleBinTabProps) {
  const [items, setItems] = useState<RecycleBinEntry[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [retentionDays, setRetentionDays] = useState(30);
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<PendingConfirm>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/recycle-bin');
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Could not load the recycle bin.');
      }
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      setCounts(data.counts?.byResource || {});
      setRetentionDays(data.retentionDays ?? 30);
      onCountChange?.(data.counts?.total ?? 0);
      // Anything swept or already acted on should not stay ticked.
      setSelected(prev => prev.filter(id => (data.items || []).some((i: RecycleBinEntry) => i.id === id)));
    } catch (err: any) {
      setError(err?.message || 'Could not load the recycle bin.');
    } finally {
      setIsLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter(i => i.resource === filter)),
    [items, filter]
  );

  const allVisibleSelected = visible.length > 0 && visible.every(i => selected.includes(i.id));

  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelected(prev => prev.filter(id => !visible.some(i => i.id === id)));
    } else {
      setSelected(prev => Array.from(new Set([...prev, ...visible.map(i => i.id)])));
    }
  };

  const toggleOne = (id: string) =>
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const post = async (path: string, body: any) => {
    const res = await fetch(`/api/recycle-bin/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.success === false) {
      throw new Error(data?.error || (data?.failed?.[0]?.reason ?? 'That did not work.'));
    }
    return data;
  };

  const handleRestore = async (entry: RecycleBinEntry) => {
    setBusy(entry.id);
    setError(null);
    setNotice(null);
    try {
      await post('restore', { ids: [entry.id] });
      setNotice(`“${entry.label}” was restored to ${entry.resourceLabel}.`);
      await load();
      onRestored?.();
    } catch (err: any) {
      setError(err?.message || 'Could not restore that item.');
    } finally {
      setBusy(null);
    }
  };

  const runConfirmed = async () => {
    if (!confirming) return;
    const action = confirming;
    setConfirming(null);
    setBusy('bulk');
    setError(null);
    setNotice(null);
    try {
      if (action.kind === 'delete-selected') {
        const data = await post('delete', { ids: selected });
        setNotice(`${data.deleted} item(s) permanently deleted.`);
        setSelected([]);
      } else {
        const data = await post('clear', { confirm: true });
        setNotice(`Recycle bin cleared — ${data.deleted} item(s) permanently deleted.`);
        setSelected([]);
      }
      await load();
    } catch (err: any) {
      setError(err?.message || 'Could not complete that.');
    } finally {
      setBusy(null);
    }
  };

  const formatWhen = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const chips = [
    { id: 'all', label: 'All', count: items.length },
    ...RESOURCE_ORDER.filter(r => counts[r]).map(r => ({
      id: r,
      label: items.find(i => i.resource === r)?.resourceLabel || r,
      count: counts[r]
    }))
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[#1a1c1d] flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-slate-500" /> Recycle Bin
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Deleted items are kept here for {retentionDays} days, then permanently deleted automatically.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setIsLoading(true); load(); }}
            disabled={Boolean(busy)}
            className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button
            type="button"
            onClick={() => setConfirming({ kind: 'delete-selected', count: selected.length })}
            disabled={selected.length === 0 || Boolean(busy)}
            className="py-2 px-3 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-black rounded-lg cursor-pointer transition-all flex items-center gap-1.5 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Selected{selected.length > 0 ? ` (${selected.length})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setConfirming({ kind: 'clear', count: items.length })}
            disabled={items.length === 0 || Boolean(busy)}
            className="py-2 px-3 bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-black rounded-lg cursor-pointer transition-all disabled:cursor-not-allowed"
          >
            Clear Recycle Bin
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs font-bold flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-px" /> <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs font-bold">
          {notice}
        </div>
      )}

      {/* Section filter */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map(chip => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                filter === chip.id
                  ? 'bg-[#1a1c1d] text-white border-[#1a1c1d]'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {chip.label} <span className="opacity-60">({chip.count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Listing */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-10 text-center text-slate-400 text-xs font-bold flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading the recycle bin…
          </div>
        ) : visible.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Inbox className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-sm font-black text-slate-700">The recycle bin is empty</p>
            <p className="text-xs text-slate-400">
              Anything you delete from Orders, Products, Collections, Pages, Blogs, Customers or Files appears here.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
              <button type="button" onClick={toggleAll} className="text-slate-500 hover:text-slate-800 cursor-pointer" aria-label="Select all">
                {allVisibleSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              </button>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                {selected.length > 0 ? `${selected.length} selected` : `${visible.length} item(s)`}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {visible.map(entry => {
                const isSelected = selected.includes(entry.id);
                const expiringSoon = entry.daysLeft <= 3;
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${isSelected ? 'bg-indigo-50/40' : 'hover:bg-slate-50/60'}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleOne(entry.id)}
                      className="text-slate-400 hover:text-slate-800 cursor-pointer shrink-0"
                      aria-label={`Select ${entry.label}`}
                    >
                      {isSelected ? <CheckSquare className="h-4 w-4 text-indigo-600" /> : <Square className="h-4 w-4" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-900 truncate">{entry.label}</span>
                        <span className="bg-slate-100 text-slate-600 text-[9px] px-2 py-0.5 rounded-md border border-slate-200 font-black uppercase tracking-wider shrink-0">
                          {entry.resourceLabel}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>Deleted {formatWhen(entry.deletedAt)}</span>
                        {entry.deletedBy && <span>· by {entry.deletedBy}</span>}
                        <span className={`inline-flex items-center gap-1 font-bold ${expiringSoon ? 'text-rose-600' : 'text-slate-500'}`}>
                          <Clock className="h-3 w-3" />
                          {entry.daysLeft === 0 ? 'deletes today' : `${entry.daysLeft} day(s) left`}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRestore(entry)}
                      disabled={Boolean(busy)}
                      className="py-1.5 px-3 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 text-[11px] font-black rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {busy === entry.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                      Restore
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Confirmation. Both actions are irreversible, so each is confirmed on
          its own and the wording names exactly what is about to go. */}
      {confirming && (
        <div className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 border border-rose-200 text-rose-600 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-black text-slate-900 text-sm">
                  {confirming.kind === 'clear' ? 'Clear the recycle bin?' : 'Permanently delete selected items?'}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {confirming.kind === 'clear'
                    ? 'Are you sure you want to permanently delete everything from the Recycle Bin? This action cannot be undone.'
                    : 'Are you sure you want to permanently delete the selected items? This action cannot be undone.'}
                </p>
                <p className="text-[11px] text-slate-400 mt-2 font-bold">
                  {confirming.count} item(s) will be removed from the database.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="py-2 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runConfirmed}
                autoFocus
                className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-lg cursor-pointer uppercase tracking-widest"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
