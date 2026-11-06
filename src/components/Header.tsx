import React, { useState } from 'react';
import { Customer, CartItem, Product, Collection, LayoutSettings } from '../types';
import { ShoppingCart, Heart, User, Sparkles, LayoutDashboard, Menu, Store, Phone, HelpCircle, Search, X, ChevronRight, Home, ShoppingBag, Award, Info } from 'lucide-react';
import { cleanMediaUrl } from '../utils/mediaUtils';

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

export default function Header({
  currentTab,
  onTabChange,
  loggedInCustomer,
  cartItems,
  onOpenCart,
  onOpenCustomer,
  onOpenWishlist,
  onOpenAdmin,
  isAdminActive,
  allProducts = [],
  allCollections = [],
  onNavigateDetail,
  layoutSettings
}: HeaderProps) {
  const cartCount = (cartItems || []).reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = Array.isArray(loggedInCustomer?.wishlist) ? loggedInCustomer.wishlist.length : 0;

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getMenuItemTab = (item: any): string => {
    if (item.tab) return item.tab;
    if (item.path) {
      if (item.path === 'collection-all') return 'frontend-shop';
      if (item.path === 'brands') return 'frontend-brands';
      if (item.path === 'blog-all') return 'blogs';
      return item.path;
    }
    return 'frontend-home';
  };

  const filteredProducts = searchQuery.trim() === '' ? [] : allProducts.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 5);

  const filteredCollections = searchQuery.trim() === '' ? [] : allCollections.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 3);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03),0_4px_6px_-2px_rgba(0,0,0,0.01)] transition-all duration-300">
      
      {/* Top micro promo bar */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white text-[10px] text-center py-2 px-4 uppercase tracking-widest font-extrabold flex items-center justify-center gap-1.5 shadow-inner">
        <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
        <span className="tracking-widest">Free Shipping on all orders over £40! Standard Delivery £2.99 for orders under £40</span>
      </div>

      {/* Slide-down Search Overlay */}
      {isSearchOpen && (
        <div className="absolute inset-x-0 top-full bg-white border-b border-slate-200 z-50 shadow-xl animate-fade-in font-sans">
          <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search canisters, series types, strength grades, brand manufacturers..."
                value={searchQuery}
                autoFocus
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm font-semibold bg-transparent focus:outline-none placeholder-slate-405 text-slate-800"
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Close Search"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Results pane */}
            {searchQuery.trim() !== '' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                
                {/* Product results */}
                <div className="md:col-span-2 space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-indigo-650 tracking-wider">Matching Products ({filteredProducts.length})</h4>
                  <div className="space-y-2">
                    {filteredProducts.map((p, pIdx) => (
                      <div
                        key={`hdr-p-${p.id}-${pIdx}`}
                        onClick={() => {
                          onNavigateDetail?.('product-detail', p.slug || p.id);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="flex items-center gap-3 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer border border-transparent hover:border-slate-200 transition-all"
                      >
                        {p.image ? (
                          <img src={p.image} className="w-10 h-10 rounded-lg object-cover border shrink-0" alt="" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center shrink-0 text-slate-400 font-bold text-xs font-mono">P</div>
                        )}
                        <div className="truncate flex-1">
                          <span className="block text-[10px] font-extrabold uppercase text-slate-400 leading-none mb-0.5">{p.vendor}</span>
                          <span className="block text-xs font-black text-slate-800 truncate">{p.title}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-extrabold text-indigo-750 bg-indigo-50 px-2 py-0.5 rounded-md">£{p.price.toFixed(2)}</span>
                          <span className="block text-[8px] font-semibold text-slate-400 mt-0.5">{p.category}</span>
                        </div>
                      </div>
                    ))}
                    {filteredProducts.length === 0 && (
                      <p className="text-xs text-slate-400 italic py-2">No products match your search query.</p>
                    )}
                  </div>
                </div>

                {/* Collection results */}
                <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  <h4 className="text-[10px] font-black uppercase text-indigo-650 tracking-wider">Collections ({filteredCollections.length})</h4>
                  <div className="space-y-2">
                    {filteredCollections.map((c, cIdx) => (
                      <div
                        key={`hdr-c-${c.id}-${cIdx}`}
                        onClick={() => {
                          onNavigateDetail?.('collection-detail', undefined, c.slug || c.id);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="p-2.5 bg-slate-50 hover:bg-indigo-50/50 rounded-xl cursor-pointer border border-transparent hover:border-indigo-100 transition-all font-sans"
                      >
                        <span className="block text-xs font-black text-slate-800 truncate">{c.title}</span>
                        <span className="block text-[9px] text-slate-400 line-clamp-1 mt-0.5">{c.description || 'Explore curated series canisters.'}</span>
                      </div>
                    ))}
                    {filteredCollections.length === 0 && (
                      <p className="text-xs text-slate-400 italic py-2">No categories found.</p>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* Main navigation menu */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        
        {/* Left: Brand logo */}
        <div 
          onClick={() => {
            onTabChange('frontend-home');
          }}
          className="flex items-center gap-3 cursor-pointer group shrink-0 animate-fade-in"
        >
          {layoutSettings?.headerLogoImage ? (
            <img 
              src={cleanMediaUrl(layoutSettings.headerLogoImage)} 
              className="max-h-13 sm:max-h-14 max-w-[200px] sm:max-w-[240px] object-contain rounded-md transition-transform group-hover:scale-102" 
              alt={layoutSettings?.headerLogoText || 'Pouch Supply'} 
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <>
              <div className="w-11 h-11 bg-gradient-to-tr from-[#008060] to-[#00a880] rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
                <div className="w-5 h-5 border-2 border-white rounded-md"></div>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-[#1a1c1d] tracking-tight text-lg sm:text-xl leading-none transition-colors group-hover:text-[#008060]">
                  {layoutSettings?.headerLogoText || 'Pouch Supply'}
                </span>
                <span className="text-[9px] sm:text-[10px] text-[#707579] font-black uppercase tracking-widest mt-1">
                  {layoutSettings?.headerLogoSubtext || 'Premium Nicotine'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Center: Navigation options (Desktop/Large screens only) */}
        <nav className="hidden lg:flex items-center gap-2">
          {(layoutSettings?.menuItems || [
            { id: '1', label: 'Home', tab: 'frontend-home', type: 'tab' },
            { id: '2', label: 'Subscribe', tab: 'frontend-subscribe', type: 'tab' },
            { id: '3', label: 'Shop Now', tab: 'frontend-shop', type: 'tab' },
            { id: '4', label: 'All Brands', tab: 'frontend-brands', type: 'tab' },
            { id: '5', label: 'About', tab: 'about', type: 'tab' }
          ]).map((item, iIdx) => {
            const itemTab = getMenuItemTab(item);
            return (
              <button
                key={`hdr-nav-${item.id}-${iIdx}`}
                onClick={() => {
                  if (item.type === 'external' && item.url) {
                    window.open(item.url, '_blank');
                  } else {
                    onTabChange(itemTab);
                  }
                }}
                className={`text-[11px] font-extrabold uppercase tracking-widest py-2 px-4 rounded-xl transition-all duration-250 cursor-pointer ${
                  currentTab === itemTab && !isAdminActive 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions block (Dashboard controller, customer logins, basket drawers) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

          {/* Search Trigger Button */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
              isSearchOpen 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-650 shadow-inner' 
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-550 hover:bg-slate-50 shadow-2xs'
            }`}
            title="Search Website"
          >
            <Search className="h-4.5 w-4.5" />
          </button>

          {/* Wishlist Link bubble - Desktop/Tablet only */}
          <button
            onClick={onOpenWishlist}
            className="relative p-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer transition-all duration-200 shadow-2xs hidden md:block"
            title="View Wishlist"
          >
            <Heart className={`h-4.5 w-4.5 transition-colors ${wishlistCount > 0 ? 'text-rose-500 fill-rose-500' : 'text-slate-500'}`} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4.5 min-w-4.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-md">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Customer accounts entry - PLACED DIRECTLY NEXT TO THE CART ICON - Desktop/Tablet only */}
          <button
            onClick={onOpenCustomer}
            className="hidden md:flex items-center gap-2 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-2xs cursor-pointer max-w-[130px] sm:max-w-[150px]"
            title="Customer Account Dashboard"
          >
            <User className="h-4 w-4 text-slate-500 shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-700 truncate uppercase tracking-wider">
              {loggedInCustomer && loggedInCustomer.name ? loggedInCustomer.name.split(' ')[0] : 'Log In'}
            </span>
          </button>

          {/* AgeChecked global status badge in header */}
          {(sessionStorage.getItem('yoti_verified') === 'true' || localStorage.getItem('agechecked-approved') === 'true') && (
            <div className="hidden lg:flex items-center gap-1.5 py-2 px-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>AgeChecked 18+ Verified</span>
            </div>
          )}

          {/* Cart Drawer triggers */}
          <button
            onClick={onOpenCart}
            className="relative p-2 sm:p-2.5 rounded-xl bg-slate-900 border border-slate-950 text-white hover:bg-slate-800 hover:scale-105 transition-all duration-250 cursor-pointer shadow-md flex items-center justify-center"
            title="Shopping Cart Drawer"
          >
            <ShoppingCart className="h-4.5 w-4.5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-lg border border-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* Hamburger Menu Icon for Mobile & Tablet (visible below lg) */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer transition-all duration-200 shadow-2xs lg:hidden"
            title="Open Mobile Navigation"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>

        </div>

      </div>

      {/* Slide-out Mobile Menu Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden font-sans">
          {/* Backdrop with blurring effect */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Slide-out Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl flex flex-col z-10 animate-slide-in-right">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                {layoutSettings?.headerLogoImage ? (
                  <img 
                    src={cleanMediaUrl(layoutSettings.headerLogoImage)} 
                    className="max-h-8 max-w-[100px] object-contain rounded" 
                    alt="Logo" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <>
                    <div className="w-7 h-7 bg-[#008060] rounded flex items-center justify-center">
                      <div className="w-3.5 h-3.5 border-2 border-white rounded-xs"></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-xs leading-none">
                        {layoutSettings?.headerLogoText || 'Pouch Supply'}
                      </span>
                      <span className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        {layoutSettings?.headerLogoSubtext || 'Premium Nicotine'}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Menu Links & Accounts (Ultra compact, unified, scroll-free layout) */}
            <div className="flex-1 flex flex-col justify-between bg-white px-4 py-4 space-y-4">
              
              {/* Main Quick Navigation Grid (2 Columns to fit easily in view) */}
              <div className="space-y-2">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">Quick Navigation</span>
                <div className="grid grid-cols-2 gap-2">
                  {(layoutSettings?.menuItems || [
                    { id: '1', label: 'Home', tab: 'frontend-home', type: 'tab' },
                    { id: '2', label: 'Subscribe', tab: 'frontend-subscribe', type: 'tab' },
                    { id: '3', label: 'Shop Now', tab: 'frontend-shop', type: 'tab' },
                    { id: '4', label: 'All Brands', tab: 'frontend-brands', type: 'tab' },
                    { id: '5', label: 'About', tab: 'about', type: 'tab' }
                  ]).map((item, iIdx) => {
                    const itemTab = getMenuItemTab(item);
                    const isActive = currentTab === itemTab && !isAdminActive;
                    
                    // Inline helper to map icons
                    const labelLower = item.label.toLowerCase();
                    let iconEl = <Info className="h-4 w-4 shrink-0" />;
                    if (labelLower.includes('home')) iconEl = <Home className="h-4 w-4 shrink-0" />;
                    else if (labelLower.includes('subscribe') || labelLower.includes('plan')) iconEl = <Sparkles className="h-4 w-4 shrink-0 text-amber-500 fill-amber-400/20" />;
                    else if (labelLower.includes('shop') || labelLower.includes('now') || labelLower.includes('pouches')) iconEl = <ShoppingBag className="h-4 w-4 shrink-0" />;
                    else if (labelLower.includes('brand')) iconEl = <Award className="h-4 w-4 shrink-0 text-indigo-600" />;

                    return (
                      <button
                        key={`hdr-mnav-${item.id}-${iIdx}`}
                        onClick={() => {
                          if (item.type === 'external' && item.url) {
                            window.open(item.url, '_blank');
                          } else {
                            onTabChange(itemTab);
                          }
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                          isActive
                            ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                            : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50 hover:border-slate-200'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/10 text-white' : 'bg-white border border-slate-100 text-slate-500 shadow-3xs'}`}>
                          {iconEl}
                        </div>
                        <span className="font-extrabold uppercase tracking-wider text-[9.5px] leading-tight truncate">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accounts & My Wishlist Mini Rows */}
              <div className="space-y-2">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">My Personal Hub</span>
                <div className="space-y-1.5">
                  {/* Customer login trigger */}
                  <button
                    onClick={() => {
                      onOpenCustomer();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2 px-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer text-left text-slate-700"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-white border border-slate-100 text-slate-500 shadow-3xs">
                        <User className="h-4 w-4 shrink-0" />
                      </div>
                      <span className="font-extrabold uppercase tracking-wider text-[9.5px]">
                        {loggedInCustomer && loggedInCustomer.name ? `Account: ${loggedInCustomer.name.split(' ')[0]}` : 'Log In / Register'}
                      </span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>

                  {/* Wishlist trigger */}
                  <button
                    onClick={() => {
                      onOpenWishlist();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2 px-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer text-left text-slate-700"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-white border border-slate-100 text-slate-500 shadow-3xs">
                        <Heart className={`h-4 w-4 shrink-0 ${wishlistCount > 0 ? 'text-rose-500 fill-rose-500' : 'text-slate-500'}`} />
                      </div>
                      <span className="font-extrabold uppercase tracking-wider text-[9.5px]">My Wishlist</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {wishlistCount > 0 && (
                        <span className="bg-rose-500 text-white text-[8px] font-black rounded-full h-4.5 min-w-4.5 flex items-center justify-center px-1.5 shadow-3xs">
                          {wishlistCount}
                        </span>
                      )}
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Store perks & Guarantees */}
              <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-1.5">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 block">Our Guarantee</span>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8.5px] font-extrabold text-slate-500 uppercase tracking-wide">
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-500">✔</span> Official Supplier
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-500">✔</span> Royal Mail Tracked
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-500">✔</span> Age Verified
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-500">✔</span> Tax Compliant
                  </div>
                </div>
              </div>

            </div>

            {/* Micro details Footer (Compact fixed footer) */}
            <div className="p-4 bg-slate-50/90 border-t border-slate-100 flex flex-col gap-1.5 shrink-0">
              <div className="flex items-center justify-between text-[9px] text-slate-500 font-extrabold tracking-wider">
                <div className="flex items-center gap-1">
                  <Store className="h-3 w-3 text-emerald-600" />
                  <span>POUCH SUPPLY EU</span>
                </div>
                <span>• UK Tracked •</span>
              </div>
              <div className="text-[9.5px] text-slate-500 font-semibold truncate flex items-center gap-1">
                <span>✉️ Support:</span>
                <a href="mailto:Support@pouch-supply.com" className="font-bold text-slate-700 hover:text-indigo-600 select-all underline">
                  Support@pouch-supply.com
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info bar (Sub menu micro links for customer convenience - Desktop & Tablet only) */}
      <div className="hidden sm:flex bg-slate-50/70 border-t border-slate-100/90 h-11 text-[10px] text-slate-500 font-extrabold px-4 tracking-wider shadow-2xs items-center">
        <div className="max-w-[1440px] mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-slate-600 flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-emerald-600" /> 
              <span>EU Official Supplier</span>
            </span>
            <span className="h-3 w-px bg-slate-200 hidden md:block" />
            <span className="hidden md:inline-flex items-center gap-1.5 text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>UK Tracked Courier Shipping</span>
            </span>
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => onTabChange('contact')}
              className="hover:text-slate-800 transition-colors cursor-pointer flex items-center gap-1 bg-transparent border-0 p-0 text-[10px] text-slate-500 font-extrabold"
            >
              <HelpCircle className="h-3.5 w-3.5 text-indigo-500" /> 
              <span>Quick Help & FAQs</span>
            </button>
            <span className="h-3 w-px bg-slate-200" />
            <span className="text-slate-600 flex items-center gap-1 select-all">
              <span>✉️</span> 
              <span>Support Desk: <strong className="text-slate-700">Support@pouch-supply.com</strong></span>
            </span>
          </div>
        </div>
      </div>

    </header>
  );
}
