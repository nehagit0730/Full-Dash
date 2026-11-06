import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { CartItem, Collection, Customer, LayoutSettings, MenuItem, Product } from '../types';
import { formatPrice, productImages, storeName, visibleProducts } from './storefront/storeKit';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  loggedInCustomer: Customer | null;
  cartItems: CartItem[];
  onOpenCart: () => void;
  onOpenCustomer: () => void;
  onOpenWishlist: () => void;
  onOpenAdmin: () => void;
  isAdminActive: boolean;
  allProducts?: Product[];
  allCollections?: Collection[];
  onNavigateDetail?: (tab: string, productId?: string, collectionId?: string) => void;
  layoutSettings?: LayoutSettings;
}

const DEFAULT_MENU: MenuItem[] = [
  { id: 'm-new', label: 'New In', tab: 'frontend-shop', type: 'tab' },
  { id: 'm-shop', label: 'Shop All', tab: 'frontend-shop', type: 'tab' },
  { id: 'm-about', label: 'Our Story', tab: 'about', type: 'tab' },
  { id: 'm-contact', label: 'Contact', tab: 'contact', type: 'tab' }
];

/** Menu entries that pointed at features this store no longer has. */
const RETIRED_TABS = /subscribe|frontend-brands/;

export default function Header({
  currentTab,
  onTabChange,
  loggedInCustomer,
  cartItems,
  onOpenCart,
  onOpenCustomer,
  onOpenWishlist,
  allProducts = [],
  allCollections = [],
  onNavigateDetail,
  layoutSettings
}: HeaderProps) {
  const cartCount = (cartItems || []).reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = Array.isArray(loggedInCustomer?.wishlist) ? loggedInCustomer!.wishlist.length : 0;
  const name = storeName(layoutSettings);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInput.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  const menu = useMemo(() => {
    const saved = Array.isArray(layoutSettings?.menuItems) && layoutSettings!.menuItems.length ? layoutSettings!.menuItems : DEFAULT_MENU;
    return saved.filter(item => !RETIRED_TABS.test(String(item.tab || '')));
  }, [layoutSettings]);

  // Collections become shop-by-category links in the menu and mobile drawer.
  const categories = useMemo(() => (allCollections || []).filter(c => c && c.title).slice(0, 6), [allCollections]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return visibleProducts(allProducts)
      .filter(p => `${p.title} ${p.vendor || ''} ${p.category || ''} ${(p.tags || []).join(' ')}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, allProducts]);

  const go = (item: MenuItem) => {
    setMobileOpen(false);
    if (item.type === 'external' && item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
      return;
    }
    onTabChange(item.tab);
  };

  const openCollection = (c: Collection) => {
    setMobileOpen(false);
    onNavigateDetail?.('collection-detail', undefined, c.slug || c.id);
  };

  const openProduct = (p: Product) => {
    setSearchOpen(false);
    setQuery('');
    onNavigateDetail?.('product-detail', p.slug || p.id);
  };

  const iconBtn = 'relative flex h-10 w-10 items-center justify-center text-ink transition hover:text-clay cursor-pointer';

  return (
    <div className="store sticky top-0 z-40">
      <div className="bg-ink px-4 py-2 text-center text-[11px] tracking-[0.18em] text-white/90 uppercase">
        Free delivery on orders above ₹1,999 · Easy 7-day returns
      </div>

      <header className={`border-b border-line bg-cream/95 backdrop-blur transition-shadow ${scrolled ? 'shadow-[0_6px_20px_-12px_rgba(31,26,23,0.25)]' : ''}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center gap-1 lg:hidden">
            <button type="button" className={iconBtn} onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <button type="button" className={iconBtn} onClick={() => setSearchOpen(true)} aria-label="Search">
              <Search className="h-5 w-5" />
            </button>
          </div>

          <nav className="hidden flex-1 items-center gap-7 lg:flex" aria-label="Main">
            {menu.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item)}
                className={`text-[12px] uppercase tracking-[0.18em] transition hover:text-clay cursor-pointer ${currentTab === item.tab ? 'text-clay' : 'text-ink'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button type="button" onClick={() => onTabChange('frontend-home')} className="flex shrink-0 flex-col items-center cursor-pointer" aria-label={`${name} home`}>
            {layoutSettings?.headerLogoImage ? (
              <img src={layoutSettings.headerLogoImage} alt={name} className="h-9 w-auto max-w-[180px] object-contain sm:h-11" />
            ) : (
              <span className="font-display text-2xl leading-none tracking-[0.08em] text-ink sm:text-3xl">{name}</span>
            )}
          </button>

          <div className="flex flex-1 items-center justify-end gap-0.5">
            <button type="button" className={`${iconBtn} hidden lg:flex`} onClick={() => setSearchOpen(true)} aria-label="Search">
              <Search className="h-5 w-5" />
            </button>
            <button type="button" className={`${iconBtn} hidden sm:flex`} onClick={onOpenCustomer} aria-label={loggedInCustomer ? 'My account' : 'Sign in'}>
              <User className="h-5 w-5" />
            </button>
            <button type="button" className={`${iconBtn} hidden sm:flex`} onClick={onOpenWishlist} aria-label="Wishlist">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[9px] text-white">{wishlistCount}</span>}
            </button>
            <button type="button" className={iconBtn} onClick={onOpenCart} aria-label={`Shopping bag, ${cartCount} items`}>
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[9px] text-white">{cartCount}</span>}
            </button>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="hidden border-t border-line lg:block">
            <div className="mx-auto flex max-w-7xl items-center justify-center gap-8 px-8 py-2.5">
              {categories.map(c => (
                <button key={c.id} type="button" onClick={() => openCollection(c)} className="text-[11px] uppercase tracking-[0.16em] text-stone transition hover:text-ink cursor-pointer">
                  {c.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="absolute inset-0 bg-ink/40 cursor-default" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <div className="store absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-cream shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="font-display text-2xl">{name}</span>
              <button type="button" className={iconBtn} onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-5 py-4" aria-label="Mobile">
              {menu.map(item => (
                <button key={item.id} type="button" onClick={() => go(item)} className="block w-full border-b border-line py-3.5 text-left text-sm uppercase tracking-[0.16em] cursor-pointer">
                  {item.label}
                </button>
              ))}
              {categories.length > 0 && (
                <>
                  <p className="mt-6 text-[10px] uppercase tracking-[0.25em] text-clay">Shop by category</p>
                  {categories.map(c => (
                    <button key={c.id} type="button" onClick={() => openCollection(c)} className="block w-full py-2.5 text-left text-sm text-stone cursor-pointer">
                      {c.title}
                    </button>
                  ))}
                </>
              )}
            </nav>
            <div className="grid grid-cols-2 gap-2 border-t border-line p-5">
              <button type="button" onClick={() => { setMobileOpen(false); onOpenCustomer(); }} className="border border-ink py-2.5 text-[11px] uppercase tracking-[0.16em] cursor-pointer">
                {loggedInCustomer ? 'My account' : 'Sign in'}
              </button>
              <button type="button" onClick={() => { setMobileOpen(false); onOpenWishlist(); }} className="border border-ink py-2.5 text-[11px] uppercase tracking-[0.16em] cursor-pointer">
                Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Search">
          <button type="button" className="absolute inset-0 bg-ink/40 cursor-default" aria-label="Close search" onClick={() => setSearchOpen(false)} />
          <div className="store relative mx-auto mt-0 max-w-3xl bg-cream p-5 shadow-xl sm:mt-16 sm:p-8">
            <div className="flex items-center gap-3 border-b border-ink pb-3">
              <Search className="h-5 w-5 text-stone" />
              <input
                ref={searchInput}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search dresses, tops, sarees…"
                className="flex-1 bg-transparent text-lg outline-none placeholder:text-stone/70"
                aria-label="Search products"
              />
              <button type="button" className={iconBtn} onClick={() => setSearchOpen(false)} aria-label="Close search">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 max-h-[60vh] overflow-y-auto">
              {query.trim().length >= 2 && results.length === 0 && <p className="py-6 text-center text-sm text-stone">No products match “{query}”.</p>}
              <ul className="divide-y divide-line">
                {results.map(p => (
                  <li key={p.id}>
                    <button type="button" onClick={() => openProduct(p)} className="flex w-full items-center gap-4 py-3 text-left cursor-pointer hover:bg-sand/60">
                      <img src={productImages(p)[0]} alt="" className="h-16 w-12 object-cover bg-sand" />
                      <span className="flex-1 text-sm">{p.title}</span>
                      <span className="text-sm">{formatPrice(p.price)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
