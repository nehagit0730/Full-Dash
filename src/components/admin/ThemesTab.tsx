import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle, CheckCircle2, ChevronDown, Copy, Download, Eye, Loader2, Monitor, MoreHorizontal,
  Paintbrush, Pencil, Plus, RotateCcw, Smartphone, Tablet, Trash2, Upload, X
} from 'lucide-react';
import { Collection, CustomPage, LayoutSettings, Product, BlogPost } from '../../types';
import PageRenderer from '../PageRenderer';
import Header from '../Header';
import Footer from '../Footer';
import PreviewFrame, { PreviewDevice } from './builder/PreviewFrame';

export interface ThemeSummary {
  id: string;
  name: string;
  role: 'live' | 'draft';
  source: 'current' | 'imported' | 'duplicate' | 'default';
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  previousThemeId: string | null;
  pageCount: number;
  sectionCount: number;
  thumbnail: { page: CustomPage; layout: Partial<LayoutSettings> } | null;
}

interface FullTheme extends Omit<ThemeSummary, 'thumbnail' | 'pageCount' | 'sectionCount'> {
  data: { pages: CustomPage[]; layout: Partial<LayoutSettings> };
}

interface ThemesTabProps {
  products: Product[];
  collections: Collection[];
  blogs: BlogPost[];
  /** True while the dashboard holds unsaved edits that publishing would overwrite. */
  hasUnsavedChanges: boolean;
  /** Called after a publish with the store's new pages and layout. */
  onPublished: (pages: CustomPage[], layout: LayoutSettings) => void;
  /** Opens the Page Builder on the live theme's homepage. */
  onCustomize: () => void;
}

const fmtDate = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
        ' at ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

async function api<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `Request failed (${res.status})`);
  return body as T;
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error(`Could not read ${file.name}`));
    r.readAsDataURL(file);
  });
}

// ─────────────────────────── small UI pieces ───────────────────────────

function Menu({ children, dark }: { children: (close: () => void) => React.ReactNode; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="More actions"
        onClick={() => setOpen(o => !o)}
        className={`h-8 w-8 flex items-center justify-center rounded-lg ${dark ? 'text-white hover:bg-white/15' : 'text-slate-600 hover:bg-slate-100'}`}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-30 w-56 rounded-xl bg-white py-1.5 shadow-xl ring-1 ring-black/10 text-[13px] text-slate-800">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent ${danger ? 'text-red-600' : ''}`}
    >
      <span className="[&_svg]:h-4 [&_svg]:w-4 shrink-0">{icon}</span>
      {label}
    </button>
  );
}

function NameDialog({
  title, initial, confirmLabel, onCancel, onConfirm
}: { title: string; initial: string; confirmLabel: string; onCancel: () => void; onConfirm: (name: string) => void }) {
  const [name, setName] = useState(initial);
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 p-4" onMouseDown={onCancel}>
      <form
        onMouseDown={e => e.stopPropagation()}
        onSubmit={e => { e.preventDefault(); if (name.trim()) onConfirm(name.trim()); }}
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4"
      >
        <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
        <input
          autoFocus
          value={name}
          maxLength={80}
          onChange={e => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-3.5 py-2 text-[13px] font-medium hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={!name.trim()} className="rounded-lg bg-slate-900 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-slate-800 disabled:opacity-40">{confirmLabel}</button>
        </div>
      </form>
    </div>
  );
}

/** Store chrome + a page, as shoppers see it. Used for thumbnails and preview. */
function StorePage({
  page, layout, products, collections, blogs, chrome = true
}: {
  page: CustomPage; layout: Partial<LayoutSettings>; products: Product[]; collections: Collection[]; blogs: BlogPost[]; chrome?: boolean;
}) {
  const noop = () => {};
  return (
    <div className="min-h-screen bg-[#f6f6f7] text-slate-800 flex flex-col font-sans">
      {chrome && (
        <div className="pointer-events-none">
          <Header
            currentTab={page.isHomepage ? 'frontend-home' : page.slug}
            onTabChange={noop} loggedInCustomer={null} cartItems={[]} onOpenCart={noop}
            onOpenCustomer={noop} onOpenWishlist={noop} onOpenAdmin={noop} isAdminActive={false}
            allProducts={products} allCollections={collections} layoutSettings={layout as LayoutSettings}
          />
        </div>
      )}
      <main className="flex-1">
        <PageRenderer
          page={page} allProducts={products} allCollections={collections} allBlogs={blogs}
          loggedInCustomer={null} onAddToCart={noop} onToggleWishlist={noop} onNavigate={noop}
        />
      </main>
      {chrome && (
        <div className="pointer-events-none">
          <Footer layoutSettings={layout as LayoutSettings} />
        </div>
      )}
    </div>
  );
}

function Thumbnail({ theme, products, collections, blogs, className }: {
  theme: ThemeSummary; products: Product[]; collections: Collection[]; blogs: BlogPost[]; className: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-slate-100 pointer-events-none select-none ${className}`} aria-hidden>
      {theme.thumbnail ? (
        <PreviewFrame device="desktop">
          <StorePage page={theme.thumbnail.page} layout={theme.thumbnail.layout} products={products} collections={collections} blogs={blogs} />
        </PreviewFrame>
      ) : (
        <div className="h-full w-full flex items-center justify-center text-slate-400"><Paintbrush className="h-6 w-6" /></div>
      )}
    </div>
  );
}

// ─────────────────────────────── preview ───────────────────────────────

function ThemePreview({
  themeId, onClose, onPublish, products, collections, blogs
}: {
  themeId: string; onClose: () => void; onPublish: (t: { id: string; name: string }) => void;
  products: Product[]; collections: Collection[]; blogs: BlogPost[];
}) {
  const [theme, setTheme] = useState<FullTheme | null>(null);
  const [error, setError] = useState('');
  const [pageId, setPageId] = useState<string>('');
  const [device, setDevice] = useState<PreviewDevice>('desktop');

  useEffect(() => {
    let alive = true;
    api<{ theme: FullTheme }>(`/api/themes/${encodeURIComponent(themeId)}`)
      .then(({ theme }) => {
        if (!alive) return;
        setTheme(theme);
        const home = theme.data.pages.find(p => p.isHomepage) || theme.data.pages[0];
        setPageId(home?.id || '');
      })
      .catch(e => alive && setError(e.message));
    return () => { alive = false; };
  }, [themeId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const page = theme?.data.pages.find(p => p.id === pageId);

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-[#f1f1f1] font-sans">
      <div className="h-14 shrink-0 flex items-center gap-3 border-b border-slate-200 bg-white px-3">
        <button type="button" onClick={onClose} title="Close preview" className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-slate-100">
          <X className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-slate-900">{theme?.name || 'Loading…'}</p>
          <p className="text-[11px] text-slate-500">{theme?.role === 'live' ? 'Live theme' : 'Preview — not visible to customers'}</p>
        </div>
        {theme && (
          <select
            value={pageId}
            onChange={e => setPageId(e.target.value)}
            className="ml-2 max-w-[220px] rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] cursor-pointer"
          >
            {theme.data.pages.map(p => (
              <option key={p.id} value={p.id}>{p.isHomepage ? `🏠 ${p.title}` : p.title}</option>
            ))}
          </select>
        )}
        <div className="flex-1" />
        <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200">
          {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([d, Icon]) => (
            <button key={d} type="button" title={d} onClick={() => setDevice(d)}
              className={`h-8 w-9 flex items-center justify-center rounded-md ${device === d ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'}`}>
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        {theme && theme.role !== 'live' && (
          <button type="button" onClick={() => onPublish(theme)}
            className="h-9 rounded-lg bg-slate-900 px-4 text-[13px] font-semibold text-white hover:bg-slate-800">
            Publish
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0 p-3">
        <div className="h-full overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
          {error ? (
            <div className="h-full flex items-center justify-center text-[13px] text-red-600">{error}</div>
          ) : !theme ? (
            <div className="h-full flex items-center justify-center text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : page ? (
            <PreviewFrame device={device}>
              <StorePage page={page} layout={theme.data.layout} products={products} collections={collections} blogs={blogs} />
            </PreviewFrame>
          ) : (
            <div className="h-full flex items-center justify-center text-[13px] text-slate-500">This theme has no pages.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────── main tab ───────────────────────────────

type Notice = { kind: 'success' | 'error' | 'warning'; text: string; details?: string[] };

export default function ThemesTab({ products, collections, blogs, hasUnsavedChanges, onPublished, onCustomize }: ThemesTabProps) {
  const [themes, setThemes] = useState<ThemeSummary[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<null | { kind: 'rename' | 'duplicate' | 'new'; theme?: ThemeSummary }>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const { themes } = await api<{ themes: ThemeSummary[] }>('/api/themes');
      setThemes(themes);
      setLoadError('');
    } catch (e: any) {
      setLoadError(e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const notify = (n: Notice) => setNotices(prev => [n, ...prev].slice(0, 6));
  const live = themes?.find(t => t.role === 'live') || null;
  const drafts = useMemo(() => (themes || []).filter(t => t.role !== 'live'), [themes]);
  const previous = live?.previousThemeId ? drafts.find(t => t.id === live.previousThemeId) : undefined;

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try { await fn(); } catch (e: any) { notify({ kind: 'error', text: e.message }); } finally { setBusy(null); }
  };

  const publish = (t: { id: string; name: string }) => {
    if (hasUnsavedChanges) {
      notify({ kind: 'error', text: 'You have unsaved changes in the dashboard. Save or discard them before publishing a theme.' });
      return;
    }
    if (!confirm(`Publish "${t.name}"?\n\nIt replaces your store's pages and header & footer design right away. The current live theme is kept in your library, so you can switch back at any time.`)) return;
    run(`publish:${t.id}`, async () => {
      const res = await api<{ pages: CustomPage[]; layoutSettings: LayoutSettings }>(`/api/themes/${encodeURIComponent(t.id)}/publish`, { method: 'POST' });
      onPublished(res.pages, res.layoutSettings);
      setPreviewId(null);
      notify({ kind: 'success', text: `"${t.name}" is now live.` });
      await load();
    });
  };

  const download = (t: ThemeSummary) =>
    run(`download:${t.id}`, async () => {
      const res = await fetch(`/api/themes/${encodeURIComponent(t.id)}/download`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || 'Download failed.');
      const blob = await res.blob();
      const name = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '')?.[1] || 'theme.zip';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    });

  const remove = (t: ThemeSummary) => {
    if (!confirm(`Delete "${t.name}"? This cannot be undone. Download it first if you may need it again.`)) return;
    run(`delete:${t.id}`, async () => {
      await api(`/api/themes/${encodeURIComponent(t.id)}`, { method: 'DELETE' });
      notify({ kind: 'success', text: `Deleted "${t.name}".` });
      await load();
    });
  };

  const submitDialog = (name: string) => {
    const d = dialog!;
    setDialog(null);
    run(`${d.kind}:${d.theme?.id || 'new'}`, async () => {
      if (d.kind === 'rename') {
        await api(`/api/themes/${encodeURIComponent(d.theme!.id)}`, { method: 'PATCH', body: JSON.stringify({ name }) });
      } else {
        await api('/api/themes', { method: 'POST', body: JSON.stringify({ name, from: d.kind === 'new' ? 'default' : d.theme!.id }) });
        notify({ kind: 'success', text: `Added "${name}" to your theme library.` });
      }
      await load();
    });
  };

  const importFiles = async (files: FileList | null) => {
    const list = Array.from(files || []);
    if (fileRef.current) fileRef.current.value = '';
    if (!list.length) return;
    setBusy('import');
    let added = 0;
    for (const file of list) {
      try {
        if (!/\.(zip|json)$/i.test(file.name)) throw new Error('Only .zip theme packages and theme .json files can be imported.');
        if (file.size > 25 * 1024 * 1024) throw new Error('Theme files can be at most 25 MB.');
        const data = await readAsBase64(file);
        const res = await api<{ theme: ThemeSummary; warnings: string[] }>('/api/themes/import', {
          method: 'POST',
          body: JSON.stringify({ fileName: file.name, data })
        });
        added++;
        notify(res.warnings?.length
          ? { kind: 'warning', text: `Imported "${res.theme.name}" with notes:`, details: res.warnings.slice(0, 8) }
          : { kind: 'success', text: `Imported "${res.theme.name}".` });
      } catch (e: any) {
        notify({ kind: 'error', text: `${file.name}: ${e.message}` });
      }
    }
    setBusy(null);
    if (added) await load();
  };

  const isBusy = (key: string) => busy === key;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-slate-900">Themes</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            A theme is your store's full design: every Page Builder page with its sections and styles, plus the header and footer.
          </p>
        </div>
      </div>

      {notices.length > 0 && (
        <div className="space-y-2">
          {notices.map((n, i) => (
            <div key={i} className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13px] ${
              n.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : n.kind === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-red-200 bg-red-50 text-red-800'}`}>
              {n.kind === 'success' ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p>{n.text}</p>
                {n.details && <ul className="mt-1 list-disc pl-4 text-[12px] opacity-90">{n.details.map((d, j) => <li key={j}>{d}</li>)}</ul>}
              </div>
              <button type="button" aria-label="Dismiss" onClick={() => setNotices(prev => prev.filter((_, j) => j !== i))} className="opacity-60 hover:opacity-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800 flex items-center justify-between gap-3">
          <span>Couldn't load themes: {loadError}</span>
          <button type="button" onClick={load} className="font-semibold underline">Retry</button>
        </div>
      )}

      {!themes && !loadError && (
        <div className="flex items-center justify-center py-24 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
      )}

      {/* Live theme */}
      {live && (
        <section className="overflow-hidden rounded-2xl bg-slate-900 shadow-sm">
          <div className="relative">
            <Thumbnail theme={live} products={products} collections={collections} blogs={blogs} className="h-64 sm:h-80 w-full" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-5 pt-16 pb-4 flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[11px] font-semibold text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" /> Live
                </span>
                <h2 className="mt-1.5 truncate text-[20px] font-bold text-white">{live.name}</h2>
                <p className="text-[12px] text-white/75">
                  {live.publishedAt ? `Published ${fmtDate(live.publishedAt)}` : 'Your store'} · {live.pageCount} pages · {live.sectionCount} sections
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPreviewId(live.id)}
                  className="h-9 rounded-lg bg-white/15 px-3.5 text-[13px] font-semibold text-white hover:bg-white/25 backdrop-blur">
                  Preview
                </button>
                <button type="button" onClick={onCustomize}
                  className="h-9 rounded-lg bg-white px-3.5 text-[13px] font-semibold text-slate-900 hover:bg-slate-100">
                  Customize
                </button>
                <Menu dark>
                  {close => (
                    <>
                      <MenuItem icon={<Eye />} label="Preview" onClick={() => { close(); setPreviewId(live.id); }} />
                      <MenuItem icon={<Pencil />} label="Rename" onClick={() => { close(); setDialog({ kind: 'rename', theme: live }); }} />
                      <MenuItem icon={<Copy />} label="Duplicate" onClick={() => { close(); setDialog({ kind: 'duplicate', theme: live }); }} />
                      <MenuItem icon={<Download />} label="Download theme file" onClick={() => { close(); download(live); }} />
                      <div className="my-1 border-t border-slate-100" />
                      <MenuItem
                        icon={<RotateCcw />}
                        label={previous ? `Revert to "${previous.name}"` : 'Revert to previous theme'}
                        disabled={!previous}
                        onClick={() => { close(); previous && publish(previous); }}
                      />
                    </>
                  )}
                </Menu>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Theme library */}
      {themes && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Theme library</h2>
              <p className="text-[12.5px] text-slate-500">Drafts aren't visible to customers until you publish them.</p>
            </div>
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" multiple accept=".zip,.json,application/zip,application/json" className="hidden" onChange={e => importFiles(e.target.files)} />
              <button type="button" disabled={isBusy('import')} onClick={() => fileRef.current?.click()}
                className="h-9 flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60">
                {isBusy('import') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {isBusy('import') ? 'Importing…' : 'Import'}
              </button>
              <div className="relative">
                <button type="button" onClick={() => setShowAddMenu(v => !v)}
                  className="h-9 flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-[13px] font-semibold text-white hover:bg-slate-800">
                  <Plus className="h-4 w-4" /> Add theme <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {showAddMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowAddMenu(false)} />
                    <div className="absolute right-0 top-10 z-30 w-64 rounded-xl bg-white py-1.5 shadow-xl ring-1 ring-black/10 text-[13px]">
                      <MenuItem icon={<Upload />} label="Upload theme file(s)…" onClick={() => { setShowAddMenu(false); fileRef.current?.click(); }} />
                      {live && <MenuItem icon={<Copy />} label={`Duplicate "${live.name}"`} onClick={() => { setShowAddMenu(false); setDialog({ kind: 'duplicate', theme: live }); }} />}
                      <MenuItem icon={<Paintbrush />} label="Start from the default theme" onClick={() => { setShowAddMenu(false); setDialog({ kind: 'new' }); }} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
            {drafts.length === 0 && (
              <div className="px-6 py-12 text-center">
                <Paintbrush className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-[14px] font-medium text-slate-800">No other themes yet</p>
                <p className="mt-1 text-[13px] text-slate-500">Import a theme file, duplicate your live theme, or start from the default theme.</p>
              </div>
            )}
            {drafts.map(t => (
              <div key={t.id} className="flex flex-wrap items-center gap-4 p-4">
                <button type="button" onClick={() => setPreviewId(t.id)} className="shrink-0 overflow-hidden rounded-lg ring-1 ring-slate-200 hover:ring-slate-400" title="Preview">
                  <Thumbnail theme={t} products={products} collections={collections} blogs={blogs} className="h-[84px] w-[140px]" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[14px] font-semibold text-slate-900">{t.name}</p>
                    {t.source === 'imported' && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-600">Imported</span>}
                    {live?.previousThemeId === t.id && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10.5px] font-medium text-blue-700">Previously live</span>}
                  </div>
                  <p className="text-[12.5px] text-slate-500">
                    {t.source === 'current' || t.publishedAt ? 'Last saved' : 'Added'} {fmtDate(t.updatedAt)} · {t.pageCount} pages · {t.sectionCount} sections
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setPreviewId(t.id)}
                    className="h-8 rounded-lg border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-800 hover:bg-slate-50">
                    Preview
                  </button>
                  <button type="button" disabled={isBusy(`publish:${t.id}`)} onClick={() => publish(t)}
                    className="h-8 flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-[12.5px] font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                    {isBusy(`publish:${t.id}`) && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Publish
                  </button>
                  <Menu>
                    {close => (
                      <>
                        <MenuItem icon={<Eye />} label="Preview" onClick={() => { close(); setPreviewId(t.id); }} />
                        <MenuItem icon={<Pencil />} label="Rename" onClick={() => { close(); setDialog({ kind: 'rename', theme: t }); }} />
                        <MenuItem icon={<Copy />} label="Duplicate" onClick={() => { close(); setDialog({ kind: 'duplicate', theme: t }); }} />
                        <MenuItem icon={<Download />} label="Download theme file" onClick={() => { close(); download(t); }} />
                        <div className="my-1 border-t border-slate-100" />
                        <MenuItem icon={<Trash2 />} label="Delete" danger onClick={() => { close(); remove(t); }} />
                      </>
                    )}
                  </Menu>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[12px] leading-relaxed text-slate-500">
            Theme files are .zip packages (or theme.json) downloaded from this dashboard. Shopify Liquid themes run only on Shopify and can't be imported.
            Images are referenced by URL and aren't packed into the file; credentials and store settings are never included.
          </p>
        </section>
      )}

      {previewId && (
        <ThemePreview
          themeId={previewId}
          onClose={() => setPreviewId(null)}
          onPublish={publish}
          products={products}
          collections={collections}
          blogs={blogs}
        />
      )}

      {dialog && (
        <NameDialog
          title={dialog.kind === 'rename' ? 'Rename theme' : dialog.kind === 'duplicate' ? 'Duplicate theme' : 'Add the default theme'}
          initial={dialog.kind === 'rename' ? dialog.theme!.name : dialog.kind === 'duplicate' ? `Copy of ${dialog.theme!.name}` : 'Default theme'}
          confirmLabel={dialog.kind === 'rename' ? 'Save' : 'Add theme'}
          onCancel={() => setDialog(null)}
          onConfirm={submitDialog}
        />
      )}
    </div>
  );
}
