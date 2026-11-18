import React, { useEffect, useState } from 'react';
import {
  ChevronDown, ExternalLink, FileText, Home, LogOut, Package,
  Percent, Settings, ShoppingBag, Store, Trash2, Users, X
} from 'lucide-react';

/** A dashboard section. The ids are the URL paths' section names, so they never change. */
export type AdminSection =
  | 'analytics' | 'orders' | 'products' | 'collections' | 'customers' | 'discounts'
  | 'blogs' | 'files' | 'themes' | 'pages' | 'layout'
  | 'payments' | 'delivery' | 'integrations' | 'email' | 'age-verification' | 'development' | 'diagnostics'
  | 'recycle-bin';

interface NavLeaf { id: AdminSection; label: string }
interface NavItem { key: string; label: string; icon: React.ComponentType<{ className?: string }>; id?: AdminSection; children?: NavLeaf[]; badge?: number }

/** One place that names every section; used by the sidebar and the page title. */
export const SECTION_LABELS: Record<AdminSection, string> = {
  analytics: 'Home',
  orders: 'Orders',
  products: 'Products',
  collections: 'Collections',
  customers: 'Customers',
  discounts: 'Discounts',
  blogs: 'Blog posts',
  files: 'Files',
  themes: 'Themes',
  pages: 'Pages',
  layout: 'Header & footer',
  payments: 'Payments',
  delivery: 'Shipping & delivery',
  integrations: 'API & integrations',
  email: 'Email & marketing',
  'age-verification': 'Age verification',
  development: 'Developer tools',
  diagnostics: 'Database',
  'recycle-bin': 'Recycle bin'
};

interface AdminSidebarProps {
  active: AdminSection;
  onNavigate: (section: AdminSection) => void;
  storeName: string;
  unfulfilledOrders: number;
  recycleBinCount: number;
  onSignOut?: () => void;
  /** Mobile drawer state (the sidebar is always visible on large screens). */
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function AdminSidebar({
  active, onNavigate, storeName, unfulfilledOrders, recycleBinCount, onSignOut, mobileOpen, onCloseMobile
}: AdminSidebarProps) {
  const items: NavItem[] = [
    { key: 'home', label: 'Home', icon: Home, id: 'analytics' },
    { key: 'orders', label: 'Orders', icon: Package, id: 'orders', badge: unfulfilledOrders },
    { key: 'products', label: 'Products', icon: ShoppingBag, children: [
      { id: 'products', label: 'All products' },
      { id: 'collections', label: 'Collections' }
    ] },
    { key: 'customers', label: 'Customers', icon: Users, id: 'customers' },
    { key: 'discounts', label: 'Discounts', icon: Percent, id: 'discounts' },
    { key: 'content', label: 'Content', icon: FileText, children: [
      { id: 'blogs', label: 'Blog posts' },
      { id: 'files', label: 'Files' }
    ] },
    { key: 'store', label: 'Online store', icon: Store, children: [
      { id: 'themes', label: 'Themes' },
      { id: 'pages', label: 'Pages' },
      { id: 'layout', label: 'Header & footer' }
    ] },
    { key: 'settings', label: 'Settings', icon: Settings, children: [
      { id: 'payments', label: 'Payments' },
      { id: 'delivery', label: 'Shipping & delivery' },
      { id: 'integrations', label: 'API & integrations' },
      { id: 'email', label: 'Email & marketing' },
      { id: 'age-verification', label: 'Age verification' },
      { id: 'development', label: 'Developer tools' },
      { id: 'diagnostics', label: 'Database' }
    ] }
  ];

  const groupOf = (id: AdminSection) => items.find(i => i.children?.some(c => c.id === id))?.key;
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const g = groupOf(active);
    return g ? { [g]: true } : {};
  });

  // Keep the active section's group expanded (e.g. after back/forward).
  useEffect(() => {
    const g = groupOf(active);
    if (g) setOpen(o => (o[g] ? o : { ...o, [g]: true }));
  }, [active]);

  const go = (id: AdminSection) => {
    onNavigate(id);
    onCloseMobile();
  };

  const rowBase = 'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors';

  const nav = (
    <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5" aria-label="Dashboard">
      {items.map(item => {
        const Icon = item.icon;
        if (!item.children) {
          const isActive = active === item.id;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => go(item.id!)}
              aria-current={isActive ? 'page' : undefined}
              className={`${rowBase} ${isActive ? 'bg-white text-slate-900 font-semibold shadow-sm ring-1 ring-black/5' : 'text-slate-700 hover:bg-white/70'}`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-slate-900' : 'text-slate-500'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {!!item.badge && item.badge > 0 && (
                <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">{item.badge}</span>
              )}
            </button>
          );
        }

        const containsActive = item.children.some(c => c.id === active);
        const isOpen = !!open[item.key];
        return (
          <div key={item.key}>
            <button
              type="button"
              onClick={() => {
                // Opening a group goes to its first page, like Shopify.
                setOpen(o => ({ ...o, [item.key]: !isOpen || !containsActive }));
                if (!containsActive) go(item.children![0].id);
              }}
              aria-expanded={isOpen}
              className={`${rowBase} ${containsActive ? 'text-slate-900 font-semibold' : 'text-slate-700 hover:bg-white/70'}`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${containsActive ? 'text-slate-900' : 'text-slate-500'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
            </button>
            {isOpen && (
              <div className="mt-0.5 mb-1 ml-[18px] border-l border-slate-300/70 pl-2 space-y-0.5">
                {item.children.map(c => {
                  const isActive = active === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => go(c.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full text-left rounded-md px-2.5 py-[6px] text-[13px] transition-colors ${
                        isActive ? 'bg-white text-slate-900 font-semibold shadow-sm ring-1 ring-black/5' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  const panel = (
    <div className="flex h-full flex-col bg-[#ebebeb]">
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-black/5 shrink-0">
        <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {(storeName || 'S').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-slate-900">{storeName || 'My store'}</p>
          <p className="text-[11px] text-slate-500 leading-none mt-0.5">Admin</p>
        </div>
        <button type="button" onClick={onCloseMobile} className="lg:hidden h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/70" aria-label="Close menu">
          <X className="h-4 w-4" />
        </button>
      </div>

      {nav}

      <div className="shrink-0 border-t border-black/5 px-3 py-3 space-y-0.5">
        <button
          type="button"
          onClick={() => go('recycle-bin')}
          className={`${rowBase} ${active === 'recycle-bin' ? 'bg-white text-slate-900 font-semibold shadow-sm ring-1 ring-black/5' : 'text-slate-700 hover:bg-white/70'}`}
        >
          <Trash2 className="h-4 w-4 shrink-0 text-slate-500" />
          <span className="flex-1 text-left">Recycle bin</span>
          {recycleBinCount > 0 && <span className="text-[11px] text-slate-500">{recycleBinCount}</span>}
        </button>
        <a href="/" target="_blank" rel="noopener noreferrer" className={`${rowBase} text-slate-700 hover:bg-white/70`}>
          <ExternalLink className="h-4 w-4 shrink-0 text-slate-500" />
          <span className="flex-1 text-left">View store</span>
        </a>
        {onSignOut && (
          <button type="button" onClick={onSignOut} className={`${rowBase} text-slate-700 hover:bg-white/70`}>
            <LogOut className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="flex-1 text-left">Sign out</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: fixed column */}
      <aside className="hidden lg:block w-60 shrink-0 border-r border-black/5 sticky top-0 h-screen">{panel}</aside>

      {/* Mobile / tablet: off-canvas drawer */}
      <div className={`lg:hidden fixed inset-0 z-[60] ${mobileOpen ? '' : 'pointer-events-none'}`} aria-hidden={!mobileOpen}>
        <div
          className={`absolute inset-0 bg-slate-900/40 transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={onCloseMobile}
        />
        <aside className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {panel}
        </aside>
      </div>
    </>
  );
}

