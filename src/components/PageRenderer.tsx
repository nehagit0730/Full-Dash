import React, { useState, useRef } from 'react';
import { CustomPage, PageSection, Product, Collection, Customer, BlogPost } from '../types';
import { cleanMediaUrl, PLACEHOLDER_IMAGE } from '../utils/mediaUtils';
import { 
  ArrowRight, ShoppingCart, Star, Heart, FileText, Check, 
  ChevronDown, ChevronUp, Play, Sparkles, TrendingUp, Plus, Minus, ShieldCheck, Award, Eye, Flame, ArrowUpRight, BookOpen, Layers, ExternalLink,
  Truck, Zap, Shield, Clock, Package, HelpCircle, Globe, Tag, ChevronLeft, ChevronRight, Lock, Gift, RefreshCw, Snowflake, Crown, Percent, Calendar, Send, Mail, Phone, MapPin, AlertCircle, Loader2
} from 'lucide-react';
import PremiumSlideshow from './PremiumSlideshow';
import { useRecaptcha } from '../hooks/useRecaptcha';
import { fontStack, googleFontHrefs } from '../utils/sectionFonts';
import { ProductCard } from './storefront/storeKit';

interface BrandsWeOfferSectionProps {
  sec: PageSection;
  handleLinkClick: (link?: string) => void;
}

function BrandsWeOfferSection({ sec, handleLinkClick }: BrandsWeOfferSectionProps) {
  const items = (sec.settings.brandItems || []).filter(b => (b.imageUrl && b.imageUrl.trim() !== '') || (b.title && b.title.trim() !== '') || (b.linkUrl && b.linkUrl.trim() !== ''));
  const [activeDot, setActiveDot] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, clientWidth, scrollWidth } = sliderRef.current;
    const totalWidth = scrollWidth - clientWidth;
    if (totalWidth <= 0) return;
    const percentage = Math.max(0, Math.min(1, scrollLeft / totalWidth));
    const dotCount = Math.min(items.length, 6);
    const idx = Math.min(Math.floor(percentage * dotCount), dotCount - 1);
    setActiveDot(idx);
  };

  const scrollToDot = (idx: number) => {
    if (!sliderRef.current) return;
    const { scrollWidth, clientWidth } = sliderRef.current;
    const totalWidth = scrollWidth - clientWidth;
    if (totalWidth <= 0) return;
    const dotCount = Math.min(items.length, 6);
    const targetScrollLeft = (idx / (dotCount - 1)) * totalWidth;
    sliderRef.current.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
    setActiveDot(idx);
  };

  const scrollLeft = () => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({ left: -260, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({ left: 260, behavior: 'smooth' });
  };

  return (
    <div className="py-6 bg-white w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-3 mb-6 animate-fade-in">
        <div className="flex items-center justify-center gap-4">
          <div className="w-10 h-[1px] bg-[#D4AF37]" />
          <span className="block text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
            {sec.settings.badgeText || 'Our brands'}
          </span>
          <div className="w-10 h-[1px] bg-[#D4AF37]" />
        </div>
        {sec.settings.title && (
          <h2 
            className="text-3xl md:text-[42px] font-black uppercase tracking-tight text-slate-900 leading-none"
            style={{ color: sec.settings.headingColor || '#0C1017' }}
          >
            {sec.settings.title}
          </h2>
        )}
        {sec.settings.description && (
          <p 
            className="max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed text-slate-500 font-medium opacity-85"
            style={{ color: sec.settings.textColor || '#64748B' }}
          >
            {sec.settings.description}
          </p>
        )}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-12">
        {/* Left Arrow Button */}
        {items.length > 0 && (
          <button 
            type="button"
            onClick={scrollLeft} 
            className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full border border-[#D4AF37] bg-white flex items-center justify-center text-[#D4AF37] hover:bg-amber-50/55 shadow-md transition-all duration-300 transform active:scale-95 cursor-pointer"
            aria-label="Previous Brand"
          >
            <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
          </button>
        )}

        {/* Brand Slider Container */}
        <div 
          ref={sliderRef}
          onScroll={handleScroll}
          className="flex gap-6 overflow-x-auto scrollbar-none py-6 px-4 scroll-smooth"
        >
          {items.map((b, idx) => (
            <div 
              key={idx} 
              onClick={() => b.linkUrl && handleLinkClick(b.linkUrl)}
              className="group flex flex-col items-center justify-center shrink-0 w-[160px] sm:w-[190px] aspect-square bg-white rounded-[24px] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_24px_50px_rgba(0,0,0,0.12)] border border-slate-50/50 transition-all duration-300 transform hover:-translate-y-1.5 select-none cursor-pointer"
            >
              {b.imageUrl ? (
                <img 
                  src={cleanMediaUrl(b.imageUrl)} 
                  className="max-h-24 max-w-[140px] object-contain transition-transform duration-300 group-hover:scale-105" 
                  alt={b.title || 'Brand'} 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-sm font-black text-slate-800 uppercase tracking-tight truncate max-w-full group-hover:scale-105 transition-transform duration-300">
                  {b.title || 'Brand'}
                </span>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-slate-400 italic text-center py-8 w-full text-xs">
              No brands found. Go to Admin Dashboard to upload brands!
            </div>
          )}
        </div>

        {/* Right Arrow Button */}
        {items.length > 0 && (
          <button 
            type="button"
            onClick={scrollRight} 
            className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full border border-[#D4AF37] bg-white flex items-center justify-center text-[#D4AF37] hover:bg-amber-50/55 shadow-md transition-all duration-300 transform active:scale-95 cursor-pointer"
            aria-label="Next Brand"
          >
            <ChevronRight className="h-5 w-5 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Dot Indicators */}
      {items.length > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          {Array.from({ length: Math.min(items.length, 6) }).map((_, dIdx) => (
            <button
              key={dIdx}
              type="button"
              onClick={() => scrollToDot(dIdx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                dIdx === activeDot ? 'bg-[#D4AF37] w-5' : 'bg-slate-200 hover:bg-slate-300'
              }`}
              aria-label={`Go to slide ${dIdx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface HowItWorksSectionProps {
  sec: PageSection;
  handleLinkClick: (link?: string) => void;
}

function HowItWorksSection({ sec, handleLinkClick }: HowItWorksSectionProps) {
  const steps = (sec.settings.stepItems && sec.settings.stepItems.length > 0)
    ? sec.settings.stepItems
    : [
        { number: '1', title: 'Browse the collection', description: 'Find what you love across our curated range.', imageUrl: '' },
        { number: '2', title: 'Check out securely', description: 'Pay with cards, UPI or wallets in a few taps.', imageUrl: '' },
        { number: '3', title: 'Delivered to your door', description: 'Tracked shipping with updates every step of the way.', imageUrl: '' }
      ];
  const accent = sec.settings.accentColor || sec.settings.buttonBgColor || '#111827';

  return (
    <div className="py-10 w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="subheading block text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>
            How it works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: sec.settings.headingColor || '#0F172A' }}>
            {sec.settings.title || 'Shopping made simple'}
          </h2>
          {sec.settings.description && (
            <p className="text-sm leading-relaxed" style={{ color: sec.settings.textColor || '#64748B' }}>
              {sec.settings.description}
            </p>
          )}
        </div>

        <div className={`grid grid-cols-1 gap-6 ${steps.length >= 4 ? 'md:grid-cols-2 lg:grid-cols-4' : steps.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
          {steps.map((step: any, sidx: number) => {
            const clickable = !!step.linkUrl;
            return (
              <div
                key={sidx}
                onClick={clickable ? () => handleLinkClick(step.linkUrl) : undefined}
                className={`card-bg card-box relative flex flex-col items-center text-center rounded-2xl border border-slate-200/70 bg-white p-7 ${clickable ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all' : ''}`}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: accent }}
                >
                  {step.number || sidx + 1}
                </span>
                {step.imageUrl && String(step.imageUrl).trim() !== '' && (
                  <img
                    src={cleanMediaUrl(step.imageUrl)}
                    alt={step.title || ''}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="mt-5 h-40 w-full rounded-xl object-cover"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }}
                  />
                )}
                <h3 className="card-title mt-5 text-lg font-semibold text-slate-900">{step.title}</h3>
                {step.description && <p className="card-desc mt-2 text-sm leading-relaxed text-slate-500">{step.description}</p>}
              </div>
            );
          })}
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => handleLinkClick(sec.settings.buttonLink || '/shop')}
            className="section-btn inline-flex items-center gap-2 rounded-lg px-7 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            {sec.settings.buttonText || 'Start shopping'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ClearanceSaleSectionProps {
  sec: PageSection;
  allProducts: Product[];
  loggedInCustomer: Customer | null;
  onAddToCart: (product: Product, quantity: number) => void;
  onToggleWishlist: (productId: string) => void;
  onNavigate: (tab: string, arg?: string) => void;
}

function ProductGridHeader({
  eyebrow, title, description, headingColor, actionLabel, onAction
}: {
  eyebrow?: string; title: string; description?: string; headingColor?: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div className="space-y-2 max-w-2xl">
        {eyebrow && <span className="subheading block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{eyebrow}</span>}
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900" style={{ color: headingColor || undefined }}>
          {title}
        </h2>
        {description && <p className="section-desc text-sm leading-relaxed text-slate-500">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="section-btn inline-flex items-center gap-1.5 self-start md:self-auto rounded-lg border border-slate-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-900 transition hover:bg-slate-900 hover:text-white"
        >
          {actionLabel} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function ClearanceSaleSection({
  sec,
  allProducts,
  loggedInCustomer,
  onAddToCart,
  onToggleWishlist,
  onNavigate
}: ClearanceSaleSectionProps) {
  const selectedIds = sec.settings.selectedProductIds || [];

  // Hand-picked products; without a selection, every product that is on sale.
  // Prices are always the product's real price — a section never invents a
  // discount the cart would not honour.
  const displayedProducts = React.useMemo(() => {
    const active = allProducts.filter(p => p.status === 'Active');
    const picked = selectedIds.length
      ? active.filter(p => selectedIds.includes(p.id))
      : active.filter(p => Number(p.compareAtPrice) > Number(p.price));
    return picked.slice(0, sec.settings.itemsCount || 8);
  }, [allProducts, selectedIds, sec.settings.itemsCount]);

  return (
    <div className="space-y-8 px-4 sm:px-6 py-10 max-w-7xl mx-auto">
      <ProductGridHeader
        eyebrow="Sale"
        title={sec.settings.title || 'On sale now'}
        description={sec.settings.description || 'Limited-time prices on selected pieces, while stocks last.'}
        headingColor={sec.settings.headingColor}
        actionLabel={sec.settings.buttonText || 'Shop all'}
        onAction={() => onNavigate(sec.settings.buttonLink || 'frontend-shop')}
      />

      {displayedProducts.length === 0 ? (
        <div className="py-14 text-center text-slate-400 bg-slate-50 border border-dashed rounded-2xl">
          <p className="text-sm font-semibold">No sale products to show yet.</p>
          <p className="text-xs mt-1">Set a compare-at price on a product, or pick products for this section in the page builder.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {displayedProducts.map(prod => (
            <ProductCard
              key={prod.id}
              product={prod}
              customer={loggedInCustomer}
              onOpen={p => onNavigate(`/products/${p.slug || p.id}`)}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FeaturedCollectionSectionProps {
  sec: PageSection;
  allProducts: Product[];
  allCollections: Collection[];
  loggedInCustomer: Customer | null;
  onAddToCart: (product: Product, quantity: number) => void;
  onToggleWishlist: (productId: string) => void;
  onNavigate: (tab: string, arg?: string) => void;
}

type FeaturedTab = 'all' | 'new' | 'bestsellers' | 'sale';

const hasTag = (p: Product, re: RegExp) => (p.tags || []).some(t => re.test(String(t)));
const NEW_TAG = /^new$|new\s*arrival|latest/i;

function FeaturedCollectionSection({
  sec,
  allProducts,
  allCollections,
  loggedInCustomer,
  onAddToCart,
  onToggleWishlist,
  onNavigate
}: FeaturedCollectionSectionProps) {
  const [activeTab, setActiveTab] = useState<FeaturedTab>('all');

  const targetCollectionId = sec.settings.selectedCollectionId;
  const selectedColl = React.useMemo(
    () => (targetCollectionId ? allCollections.find(c => c.id === targetCollectionId || c.slug === targetCollectionId) || null : null),
    [targetCollectionId, allCollections]
  );

  const base = React.useMemo(() => {
    let list = allProducts.filter(p => p.status === 'Active');
    if (selectedColl) list = list.filter(p => (selectedColl.productIds || []).includes(p.id));
    return list;
  }, [allProducts, selectedColl]);

  // Tabs are derived from product data (tags, dates, compare-at prices), so
  // they work for any catalogue; empty tabs are hidden.
  const tabs = React.useMemo(() => {
    const newest = [...base].sort((a, b) => (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0));
    const all: { id: FeaturedTab; label: string; items: Product[] }[] = [
      { id: 'all', label: 'All', items: base },
      { id: 'new', label: 'New arrivals', items: base.some(p => hasTag(p, NEW_TAG)) ? base.filter(p => hasTag(p, NEW_TAG)) : newest },
      { id: 'bestsellers', label: 'Bestsellers', items: base.filter(p => hasTag(p, /best\s*-?seller|popular|featured/i)) },
      { id: 'sale', label: 'On sale', items: base.filter(p => Number(p.compareAtPrice) > Number(p.price)) }
    ];
    return all.filter(t => t.id === 'all' || t.items.length > 0);
  }, [base]);

  const showTabs = sec.settings.showTabs !== false && tabs.length > 1;
  const current = tabs.find(t => t.id === activeTab) || tabs[0];
  const displayedProducts = (current?.items || []).slice(0, sec.settings.itemsCount || 8);

  return (
    <div className="space-y-8 px-4 sm:px-6 py-10 max-w-7xl mx-auto">
      <ProductGridHeader
        eyebrow={selectedColl ? 'Collection' : 'Featured'}
        title={sec.settings.title || selectedColl?.title || 'Featured products'}
        description={sec.settings.description || selectedColl?.description || undefined}
        headingColor={sec.settings.headingColor}
        actionLabel={sec.settings.buttonText || 'View all'}
        onAction={() => onNavigate(sec.settings.buttonLink || (selectedColl ? `/collections/${selectedColl.slug || selectedColl.id}` : 'frontend-shop'))}
      />

      {showTabs && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none border-b border-slate-200 pb-3">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition ${
                current?.id === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {displayedProducts.length === 0 ? (
        <div className="py-14 text-center text-slate-400 bg-slate-50 border border-dashed rounded-2xl">
          <p className="text-sm font-semibold">No products to show yet.</p>
          <p className="text-xs mt-1">Add active products{selectedColl ? ' to this collection' : ''} in the dashboard and they will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {displayedProducts.map(prod => (
            <ProductCard
              key={prod.id}
              product={prod}
              customer={loggedInCustomer}
              onOpen={p => onNavigate(`/products/${p.slug || p.id}`)}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface PageRendererProps {
  page: CustomPage;
  allProducts: Product[];
  allCollections: Collection[];
  loggedInCustomer: Customer | null;
  onAddToCart: (product: Product, qty: number) => void;
  onToggleWishlist: (productId: string) => void;
  onNavigate: (tab: string, arg?: string) => void; // for shop, subscribe etc.
  allBlogs?: BlogPost[];
  /** Set only by the page builder preview: makes sections selectable. */
  editor?: {
    selectedSectionId: string | null;
    onSelectSection: (id: string) => void;
    /** Floating tools drawn on the selected section. */
    renderSectionTools?: (sec: PageSection, index: number) => React.ReactNode;
  };
}

const HEADING_SEL = (id: string) =>
  ['h1', 'h2', 'h3', 'h4', '.section-title'].map(h => `#sec-${id} ${h}, #sec-${id} ${h} *`).join(', ');
const BODY_SEL = (id: string) =>
  ['', ' p', ' li', ' span', ' a', ' button', ' input', ' textarea', ' label', ' div'].map(s => `#sec-${id}${s}`).join(', ');

const CONTENT_WIDTHS: Record<string, string> = {
  narrow: '760px',
  medium: '1040px',
  wide: '1280px',
  xl: '1440px'
};

/**
 * CSS for the shared style settings every section supports (fonts, type scale,
 * layout width, background image, device visibility, mobile overrides,
 * animation, custom CSS). Kept separate from the per-type colour rules so the
 * builder and the live store run the exact same code.
 */
function buildSectionStyleCss(sec: PageSection, page: CustomPage): string {
  const s: any = sec.settings || {};
  const id = sec.id;
  const rules: string[] = [];

  const headingStack = fontStack(s.headingFont) || fontStack(page.settings?.headingFont);
  const bodyStack = fontStack(s.bodyFont) || fontStack(page.settings?.bodyFont);

  if (bodyStack) rules.push(`${BODY_SEL(id)} { font-family: ${bodyStack} !important; }`);

  const head: string[] = [];
  if (headingStack) head.push(`font-family: ${headingStack} !important;`);
  if (s.headingWeight) head.push(`font-weight: ${Number(s.headingWeight)} !important;`);
  if (s.headingLetterSpacing !== undefined && s.headingLetterSpacing !== '') head.push(`letter-spacing: ${Number(s.headingLetterSpacing)}em !important;`);
  if (s.headingTransform) head.push(`text-transform: ${s.headingTransform} !important;`);
  if (s.headingLineHeight) head.push(`line-height: ${Number(s.headingLineHeight)} !important;`);
  if (s.headingItalic) head.push('font-style: italic !important;');
  if (head.length) rules.push(`${HEADING_SEL(id)} { ${head.join(' ')} }`);

  const body: string[] = [];
  if (s.bodyWeight) body.push(`font-weight: ${Number(s.bodyWeight)} !important;`);
  if (s.bodyLineHeight) body.push(`line-height: ${Number(s.bodyLineHeight)} !important;`);
  if (s.bodyLetterSpacing !== undefined && s.bodyLetterSpacing !== '') body.push(`letter-spacing: ${Number(s.bodyLetterSpacing)}em !important;`);
  if (body.length) rules.push(`#sec-${id} p, #sec-${id} li, #sec-${id} .section-desc { ${body.join(' ')} }`);

  const btn: string[] = [];
  if (s.buttonStyle === 'outline') btn.push(`background-color: transparent !important; border: 1.5px solid ${s.buttonBgColor || 'currentColor'} !important; color: ${s.buttonBgColor || 'inherit'} !important;`);
  if (s.buttonStyle === 'link') btn.push('background-color: transparent !important; border: 0 !important; padding-left: 0 !important; padding-right: 0 !important; text-decoration: underline !important; text-underline-offset: 4px;');
  if (s.buttonUppercase === true) btn.push('text-transform: uppercase !important;');
  if (s.buttonUppercase === false) btn.push('text-transform: none !important;');
  if (s.buttonFontSize) btn.push(`font-size: ${Number(s.buttonFontSize)}px !important;`);
  if (btn.length) rules.push(`#sec-${id} button, #sec-${id} .section-btn { ${btn.join(' ')} }`);

  if (!s.fullWidth && s.contentWidth && CONTENT_WIDTHS[s.contentWidth]) {
    rules.push(`#sec-${id} > .sec-container { max-width: ${CONTENT_WIDTHS[s.contentWidth]} !important; }`);
  }

  if (s.backgroundImageUrl) {
    const o = Math.max(0, Math.min(90, Number(s.backgroundOverlay ?? 0))) / 100;
    const url = String(s.backgroundImageUrl).replace(/["\\\n<>]/g, '');
    rules.push(`#sec-${id} { background-image: linear-gradient(rgba(0,0,0,${o}), rgba(0,0,0,${o})), url("${url}") !important; background-size: cover !important; background-position: center !important; }`);
  }

  if (s.sectionRadius) rules.push(`#sec-${id} { border-radius: ${Number(s.sectionRadius)}px; }`);

  // Mobile overrides (≤ 767px). In the builder these respond to the preview
  // frame's width, so "Mobile" preview shows exactly what phones get.
  const mob: string[] = [];
  if (s.paddingTopMobile !== undefined && s.paddingTopMobile !== '') mob.push(`#sec-${id} { padding-top: ${Number(s.paddingTopMobile)}px !important; }`);
  if (s.paddingBottomMobile !== undefined && s.paddingBottomMobile !== '') mob.push(`#sec-${id} { padding-bottom: ${Number(s.paddingBottomMobile)}px !important; }`);
  if (s.mobileAlignment) mob.push(`#sec-${id}, #sec-${id} h1, #sec-${id} h2, #sec-${id} h3, #sec-${id} p { text-align: ${s.mobileAlignment} !important; }`);
  if (s.titleFontSizeMobile) mob.push(`${HEADING_SEL(id)} { font-size: ${Number(s.titleFontSizeMobile)}px !important; }`);
  if (s.hideOnMobile) mob.push(`#sec-${id} { display: none !important; }`);
  if (mob.length) rules.push(`@media (max-width: 767px) { ${mob.join(' ')} }`);
  if (s.hideOnDesktop) rules.push(`@media (min-width: 768px) { #sec-${id} { display: none !important; } }`);

  if (s.animation && s.animation !== 'none') {
    rules.push(`#sec-${id} > .sec-container { animation: pr-${s.animation} 0.8s cubic-bezier(.2,.7,.2,1) both; }`);
  }

  if (s.customCss) {
    // Nested under the section id so it cannot restyle the rest of the store.
    const css = String(s.customCss).replace(/<\/?style/gi, '').replace(/</g, '');
    rules.push(`#sec-${id} { ${css} }`);
  }

  return rules.join('\n');
}

/** A section's image-list setting (plain URLs), with blanks dropped. */
function imageList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v.trim() !== '') : [];
}

/**
 * Setting values (colours, sizes, custom CSS) are interpolated into <style>
 * text. A value containing "</style>" would end the element and let markup
 * after it run — and themes can now be imported from files written by anyone.
 * "<" never belongs in these rules, so it is escaped to its CSS form.
 */
function cssSafe(css: string): string {
  return css.replace(/</g, '\\3C ');
}

const ANIMATION_KEYFRAMES = `
@keyframes pr-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes pr-slide-up { from { opacity: 0; transform: translateY(28px) } to { opacity: 1; transform: none } }
@keyframes pr-zoom { from { opacity: 0; transform: scale(.96) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { [id^="sec-"] > .sec-container { animation: none !important; } }
`;

interface ContactFormSectionProps {
  sec: PageSection;
}

function ContactFormSection({ sec }: ContactFormSectionProps) {
  const { executeRecaptcha } = useRecaptcha();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successNote, setSuccessNote] = useState('');

  const title = sec.settings?.title || 'Get in Touch with Our Team';
  const description = sec.settings?.description || 'Have a question about an order, delivery or a product? Send us a message and our team will get back to you within one working day.';
  const headingColor = sec.settings?.headingColor || '#0F172A';
  const textColor = sec.settings?.textColor || '#475569';
  const backgroundColor = sec.settings?.backgroundColor || '#FFFFFF';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus('error');
      setErrorMessage('Please fill in all required fields (Name, Email, Message).');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');
    setSuccessNote('');

    try {
      const recaptchaToken = await executeRecaptcha('contact_form_submit');
      const res = await fetch('/api/email/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, recaptchaToken })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setSuccessNote(data.message || 'Thank you for reaching out! A confirmation email has been logged and our customer care team will get back to you shortly.');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to submit form. Please try again.');
      }
    } catch (err: any) {
      console.error('[ContactForm] Error submitting:', err);
      setStatus('error');
      setErrorMessage('Network error while sending message. Please check your connection.');
    }
  };

  return (
    <div className="py-12 md:py-16 w-full" style={{ backgroundColor }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column - Contact Information */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Mail className="h-3 w-3" /> Customer Support
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight" style={{ color: headingColor }}>
                {title}
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: textColor }}>
                {description}
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="p-2.5 rounded-xl bg-white text-indigo-600 shadow-xs border border-slate-100">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Direct Email Desk</p>
                  <a href="mailto:support@example.com" className="text-xs sm:text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                    support@example.com
                  </a>
                  <p className="text-[10px] text-slate-400 mt-0.5">Average response time: &lt; 2 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="p-2.5 rounded-xl bg-white text-emerald-600 shadow-xs border border-slate-100">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Phone & WhatsApp Hotline</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900">+44 20 7946 0912</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Mon - Fri: 9:00 AM - 6:00 PM GMT</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="p-2.5 rounded-xl bg-white text-amber-600 shadow-xs border border-slate-100">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Dispatch Depot & HQ</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900">42 Baker Street, Marylebone</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">London, NW1 6XE, United Kingdom</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            {status === 'success' ? (
              <div className="py-12 text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                  <Check className="h-8 w-8 stroke-[3]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Message Received!</h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    {successNote || 'Thank you for reaching out. A confirmation email has been logged and our customer care team will get back to you shortly.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-6 rounded-xl transition cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3">
                  Send Us a Direct Inquiry
                </h3>

                {status === 'error' && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 font-medium">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{errorMessage || 'Failed to submit form.'}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Mercer"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. alex@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +44 7700 900077"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                      Inquiry Subject
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition cursor-pointer"
                    >
                      <option value="">Select Inquiry Topic...</option>
                      <option value="Order Tracking & Shipping">Order Tracking & Shipping</option>
                      <option value="Product & Brand Advice">Product & Brand Advice</option>
                      <option value="Age Verification Query">Age Verification Query</option>
                      <option value="Wholesale & Bulk Orders">Wholesale & Bulk Orders</option>
                      <option value="General Support">General Support</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                    Your Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us how we can help you with your order, product questions, or account..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full bg-[#0F172A] hover:bg-slate-800 disabled:bg-slate-400 text-white font-black text-xs uppercase tracking-widest py-3.5 px-6 rounded-xl transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  {status === 'submitting' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Inquiry</span>
                    </>
                  )}
                </button>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[10px] text-slate-400 font-medium border-t border-slate-100">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    Protected by Google reCAPTCHA v3
                  </span>
                  <div className="flex gap-2 text-slate-400">
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Privacy
                    </a>
                    <span>•</span>
                    <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Terms
                    </a>
                  </div>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function PageRenderer({
  page,
  allProducts,
  allCollections,
  loggedInCustomer,
  onAddToCart,
  onToggleWishlist,
  onNavigate,
  allBlogs = [],
  editor
}: PageRendererProps) {
  // Safe state for keeping track of active FAQs
  const [openFaqIdx, setOpenFaqIdx] = useState<string | null>(null);

  if (!page) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <p className="text-slate-400 text-sm italic">Page content unavailable.</p>
      </div>
    );
  }

  // Safe parsing of custom links or routes
  const handleLinkClick = (link?: string) => {
    if (!link) return;
    const trimmed = link.trim();
    if (!trimmed) return;

    // External URL handling
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      window.open(trimmed, '_blank', 'noopener,noreferrer');
      return;
    }

    // Direct tab / route matches
    if (trimmed === 'frontend-home' || trimmed === '/' || trimmed === '/home' || trimmed === 'home') {
      onNavigate('frontend-home');
      return;
    }
    if (trimmed === 'frontend-shop' || trimmed === '/shop' || trimmed === '/collections/all') {
      onNavigate('frontend-shop');
      return;
    }
    if (trimmed.includes('subscribe')) {
      // Subscriptions were removed; any saved link to them goes to the shop.
      onNavigate('frontend-shop');
      return;
    }
    if (trimmed === 'frontend-brands' || trimmed === '/brands' || trimmed === '/pages/brands') {
      onNavigate('frontend-brands');
      return;
    }
    if (trimmed === 'frontend-account' || trimmed === '/account' || trimmed === '/pages/account') {
      onNavigate('frontend-account');
      return;
    }
    if (trimmed === 'frontend-checkout' || trimmed === '/checkout' || trimmed === '/pages/checkout') {
      onNavigate('frontend-checkout');
      return;
    }
    if (trimmed === 'blogs' || trimmed === '/blogs') {
      onNavigate('blogs');
      return;
    }

    // Product routes
    if (trimmed.startsWith('/products/') || trimmed.startsWith('product-')) {
      const prodIdOrSlug = trimmed.replace('/products/', '').replace('product-', '');
      onNavigate('product-detail', prodIdOrSlug);
      return;
    }

    // Collection routes
    if (trimmed.startsWith('/collections/') || trimmed.startsWith('collection-')) {
      const colIdOrSlug = trimmed.replace('/collections/', '').replace('collection-', '');
      onNavigate('collection-detail', colIdOrSlug);
      return;
    }

    // Blog routes
    if (trimmed.startsWith('/blogs/')) {
      const blogSlug = trimmed.replace('/blogs/', '');
      onNavigate('blog-detail', blogSlug);
      return;
    }

    // Page routes
    if (trimmed.startsWith('/pages/') || trimmed.startsWith('page-')) {
      const slug = trimmed.replace('/pages/', '').replace('page-', '');
      onNavigate(slug);
      return;
    }

    // Custom slug or tab fallback
    onNavigate(trimmed);
  };

  const toggleFaq = (secId: string, idx: number) => {
    const key = `${secId}-${idx}`;
    setOpenFaqIdx(openFaqIdx === key ? null : key);
  };

  // Sections switched off in the builder stay in the page data but are not
  // published; the builder still shows them (dimmed) so they can be re-enabled.
  const renderedSections = (page.sections || []).filter(s => s && (editor || !s.settings?.hidden));
  const fontHrefs = googleFontHrefs([
    page.settings?.headingFont,
    page.settings?.bodyFont,
    ...renderedSections.flatMap(s => [s.settings?.headingFont, s.settings?.bodyFont])
  ]);
  const pageBodyStack = fontStack(page.settings?.bodyFont);

  return (
    <div
      className="space-y-0 pb-24 font-sans"
      style={{
        ...(page.settings?.backgroundColor ? { backgroundColor: page.settings.backgroundColor } : {}),
        ...(pageBodyStack ? { fontFamily: pageBodyStack } : {})
      }}
    >
      {fontHrefs.map(href => <link key={href} rel="stylesheet" href={href} />)}
      <style dangerouslySetInnerHTML={{ __html: ANIMATION_KEYFRAMES }} />
      {renderedSections.length > 0 ? (
        renderedSections.map((sec, idx) => {
          const sectionClassName = (sec.type || (sec as any).name || 'section')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

          const sStyle = {
            backgroundColor: sec.settings.backgroundColor || '#FFFFFF',
            color: sec.settings.textColor || '#475569'
          };
          
          const isFullBleed = (sec.type === 'Slideshow' || sec.type === 'Image banner' || sec.type === 'Marquee text' || sec.type === 'Video banner') && sec.settings.fullWidth;
          
          const hasCustomPadding = sec.settings.paddingTop !== undefined || sec.settings.paddingBottom !== undefined;
          const paddingClass = isFullBleed ? 'py-0' : (hasCustomPadding ? '' : 'py-3 sm:py-4 md:py-5');
          const containerClass = `sec-container ${sec.settings.fullWidth ? 'w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`;
          const isSelected = !!editor && editor.selectedSectionId === sec.id;
          const isDisabled = !!sec.settings?.hidden;

          const customStyles = `
            #sec-${sec.id} {
              ${sec.settings.paddingTop !== undefined ? `padding-top: ${sec.settings.paddingTop}px !important;` : ''}
              ${sec.settings.paddingBottom !== undefined ? `padding-bottom: ${sec.settings.paddingBottom}px !important;` : ''}
              ${sec.settings.paddingSide !== undefined ? `padding-left: ${sec.settings.paddingSide}px !important; padding-right: ${sec.settings.paddingSide}px !important;` : ''}
              ${sec.settings.alignment ? `text-align: ${sec.settings.alignment} !important;` : ''}
            }
            #sec-${sec.id} h1, #sec-${sec.id} h2, #sec-${sec.id} .section-title, #sec-${sec.id} h3:not(.brand-card-title):not(.card-title):not(.overlay-heading), #sec-${sec.id} h4:not(.brand-card-title):not(.card-title):not(.overlay-heading) {
              ${sec.settings.titleFontSize ? `font-size: ${sec.settings.titleFontSize}px !important;` : ''}
              ${sec.settings.headingColor ? `color: ${sec.settings.headingColor} !important;` : ''}
              ${sec.settings.alignment ? `text-align: ${sec.settings.alignment} !important;` : ''}
            }
            #sec-${sec.id} p, #sec-${sec.id} .section-desc, #sec-${sec.id} li {
              ${sec.settings.bodyFontSize ? `font-size: ${sec.settings.bodyFontSize}px !important;` : ''}
              ${sec.settings.textColor ? `color: ${sec.settings.textColor} !important;` : ''}
              ${sec.settings.alignment ? `text-align: ${sec.settings.alignment} !important;` : ''}
            }
            #sec-${sec.id} button, #sec-${sec.id} .section-btn {
              ${sec.settings.buttonBgColor ? `background-color: ${sec.settings.buttonBgColor} !important;` : ''}
              ${sec.settings.buttonTextColor ? `color: ${sec.settings.buttonTextColor} !important;` : ''}
            }
            #sec-${sec.id} .subheading, #sec-${sec.id} .section-subheading, #sec-${sec.id} .subtitle {
              ${sec.settings.subheadingColor ? `color: ${sec.settings.subheadingColor} !important;` : ''}
            }
            #sec-${sec.id} .card-title, #sec-${sec.id} .card-heading, #sec-${sec.id} .brand-card-title, #sec-${sec.id} .overlay-heading {
              ${(sec.settings.overlayHeadingColor || sec.settings.cardTitleColor) ? `color: ${sec.settings.overlayHeadingColor || sec.settings.cardTitleColor} !important;` : (sec.type === 'Brand list' ? 'color: #FFFFFF !important;' : '')}
            }
            #sec-${sec.id} .card-desc, #sec-${sec.id} .card-text {
              ${sec.settings.cardTextColor ? `color: ${sec.settings.cardTextColor} !important;` : ''}
            }
            #sec-${sec.id} .card-bg, #sec-${sec.id} .card-box {
              ${sec.settings.cardBgColor ? `background-color: ${sec.settings.cardBgColor} !important;` : ''}
            }
            #sec-${sec.id} .badge-text, #sec-${sec.id} .badge-tag {
              ${sec.settings.badgeTextColor ? `color: ${sec.settings.badgeTextColor} !important;` : ''}
            }
            #sec-${sec.id} .badge-bg {
              ${sec.settings.badgeBgColor ? `background-color: ${sec.settings.badgeBgColor} !important;` : ''}
            }
            #sec-${sec.id} .accent-text, #sec-${sec.id} .accent-icon {
              ${sec.settings.accentColor ? `color: ${sec.settings.accentColor} !important;` : ''}
            }
            #sec-${sec.id} .custom-border {
              ${sec.settings.borderColor ? `border-color: ${sec.settings.borderColor} !important;` : ''}
            }
            #sec-${sec.id} button {
              ${sec.settings.buttonRoundness === 'rounded-none' ? 'border-radius: 0px !important;' : ''}
              ${sec.settings.buttonRoundness === 'rounded' ? 'border-radius: 4px !important;' : ''}
              ${sec.settings.buttonRoundness === 'rounded-lg' ? 'border-radius: 8px !important;' : ''}
              ${sec.settings.buttonRoundness === 'rounded-xl' ? 'border-radius: 12px !important;' : ''}
              ${sec.settings.buttonRoundness === 'rounded-full' ? 'border-radius: 9999px !important;' : ''}
            }
          `;

          return (
            <section
              id={`sec-${sec.id}`}
              key={sec.id || idx}
              style={sStyle}
              data-section-id={sec.id}
              onClickCapture={editor ? (e) => {
                // In the builder a click selects the section; links must not
                // navigate the preview away from the page being edited.
                if ((e.target as HTMLElement).closest?.('a')) e.preventDefault();
                editor.onSelectSection(sec.id);
              } : undefined}
              onSubmitCapture={editor ? (e) => e.preventDefault() : undefined}
              className={`${sectionClassName} ${paddingClass} relative transition-all duration-300 w-full overflow-hidden ${
                editor ? 'cursor-pointer group/sec' : ''
              } ${isDisabled ? 'opacity-40' : ''}`}
            >
              <style dangerouslySetInnerHTML={{ __html: cssSafe(customStyles + '\n' + buildSectionStyleCss(sec, page)) }} />
              {editor && (
                <>
                  <div
                    className={`pointer-events-none absolute inset-0 z-40 transition-shadow ${
                      isSelected ? 'shadow-[inset_0_0_0_2px_#2563eb]' : 'group-hover/sec:shadow-[inset_0_0_0_2px_#93c5fd]'
                    }`}
                  />
                  {isSelected && (
                    <span className="pointer-events-none absolute left-0 top-0 z-50 bg-blue-600 text-white text-[11px] font-medium px-2 py-0.5 rounded-br-md font-sans">
                      {sec.type}{isDisabled ? ' · Hidden' : ''}
                    </span>
                  )}
                  {isSelected && editor.renderSectionTools && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 font-sans">
                      {editor.renderSectionTools(sec, idx)}
                    </div>
                  )}
                </>
              )}
              <div className={containerClass}>
                
                {/* 1. IMAGE BANNER */}
                {sec.type === 'Image banner' && (
                  sec.settings.fullWidth ? (
                    /* High-fidelity full-width image banner (Hero style with real-time text overlay protection) */
                    <div className="relative w-full min-h-[380px] sm:min-h-[480px] md:min-h-[560px] flex items-center overflow-hidden">
                      {/* Background Image & Overlay */}
                      <div className="absolute inset-0 z-0">
                        <img
                          src={cleanMediaUrl(sec.settings.imageUrl) || PLACEHOLDER_IMAGE}
                          alt={sec.settings.title || 'Brand Banner'}
                          className="w-full h-full object-cover origin-center scale-100 hover:scale-102 transition-transform duration-10000"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        {/* Dual protectant layer */}
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-transparent sm:block hidden" />
                        <div className="absolute inset-0 bg-slate-950/80 sm:hidden" />
                      </div>

                      {/* Content block aligned */}
                      <div className="max-w-7xl mx-auto w-full px-6 sm:px-12 md:px-16 relative z-10 text-white">
                        <div className="max-w-2xl space-y-4 sm:space-y-6">
                          <div className="inline-flex items-center gap-1.5 bg-indigo-600/90 text-white font-extrabold uppercase tracking-widest text-[8px] sm:text-[9px] py-1 px-3 rounded-full border border-indigo-400/30">
                            <Sparkles className="h-3 w-3 text-amber-300 animate-spin" />
                            <span>{sec.settings.badgeText || 'New collection'}</span>
                          </div>

                          {sec.settings.title && (
                            <h1 
                              className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight leading-none text-white drop-shadow-md"
                            >
                              {sec.settings.title}
                            </h1>
                          )}

                          {sec.settings.description && (
                            <p 
                              className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg drop-shadow-xs"
                            >
                              {sec.settings.description}
                            </p>
                          )}

                          {sec.settings.buttonText && (
                            <div className="pt-2">
                              <button
                                onClick={() => handleLinkClick(sec.settings.buttonLink)}
                                className="bg-white hover:bg-slate-100 text-slate-950 font-black text-[10px] sm:text-xs py-3.5 px-8 rounded-xl shadow-lg transition-all duration-300 cursor-pointer flex items-center gap-2 uppercase tracking-widest group"
                              >
                                <span>{sec.settings.buttonText}</span>
                                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* High-fidelity boxed image banner (Side-by-side luxurious design with crisp margins) */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center p-6 sm:p-10 md:p-16">
                      <div className="space-y-6">
                        <div className="inline-flex items-center gap-1.5 text-indigo-600 font-extrabold uppercase tracking-widest text-[9px] bg-indigo-50 py-1 px-3 rounded-full">
                          <Award className="h-3 w-3" />
                          <span>Guaranteed Freshness</span>
                        </div>

                        {sec.settings.title && (
                          <h1 
                            className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-tight"
                            style={{ color: sec.settings.headingColor || '#0F172A' }}
                          >
                            {sec.settings.title}
                          </h1>
                        )}

                        {sec.settings.description && (
                          <p className="text-sm leading-relaxed opacity-90 text-slate-600">
                            {sec.settings.description}
                          </p>
                        )}

                        {sec.settings.buttonText && (
                          <div className="pt-2">
                            <button
                              onClick={() => handleLinkClick(sec.settings.buttonLink)}
                              className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs py-3.5 px-8 rounded-xl transition-all shadow-md inline-flex items-center gap-2 cursor-pointer uppercase tracking-widest group"
                            >
                              <span>{sec.settings.buttonText}</span>
                              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="relative group overflow-hidden rounded-2xl border border-slate-200/80 shadow-lg aspect-4/3 md:aspect-square">
                        <img
                          src={cleanMediaUrl(sec.settings.imageUrl) || PLACEHOLDER_IMAGE}
                          alt={sec.settings.title || 'Banner Media'}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                      </div>
                    </div>
                  )
                )}

                {/* 2. VIDEO BANNER */}
                {sec.type === 'Video banner' && (() => {
                  const extractYouTubeId = (str: string) => {
                    if (!str) return '';
                    const trimmed = str.trim();
                    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed) && !trimmed.toLowerCase().endsWith('.mp4') && !trimmed.toLowerCase().endsWith('.webm')) {
                      return trimmed;
                    }
                    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
                    const match = trimmed.match(regExp);
                    return (match && match[1]) ? match[1] : '';
                  };

                  const rawYouTube = (sec.settings.videoUrl || '').trim();
                  const rawMp4 = (sec.settings.videoMp4Url || '').trim();

                  let ytId = '';
                  let isYouTube = false;
                  let videoSource = '';

                  // Prioritize rawMp4 when provided unless rawMp4 itself is a YouTube link
                  if (rawMp4) {
                    const ytFromMp4 = extractYouTubeId(rawMp4);
                    if (ytFromMp4) {
                      ytId = ytFromMp4;
                      isYouTube = true;
                    } else {
                      videoSource = rawMp4;
                      isYouTube = false;
                    }
                  } else if (rawYouTube) {
                    const ytFromUrl = extractYouTubeId(rawYouTube);
                    if (ytFromUrl) {
                      ytId = ytFromUrl;
                      isYouTube = true;
                    } else {
                      videoSource = rawYouTube;
                      isYouTube = false;
                    }
                  }

                  if (!isYouTube && !videoSource) {
                    videoSource = '';
                  }

                  const cleanedVideoUrl = cleanMediaUrl(videoSource);
                  const titleInput = sec.settings.title || 'Discover the new collection';
                  const descInput = sec.settings.description || 'Thoughtfully made pieces, delivered to your door.';

                  return (
                    <div className="relative w-full overflow-hidden bg-slate-950 text-white flex flex-col justify-between min-h-[520px] md:min-h-[620px]">
                      
                      {/* Background Auto-Play Video Layer */}
                      <div className="absolute inset-0 z-0 w-full h-full pointer-events-none overflow-hidden">
                        {isYouTube && ytId ? (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] pointer-events-none scale-105">
                            <iframe
                              className="w-full h-full object-cover border-0"
                              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&playlist=${ytId}&loop=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1`}
                              title="Video Banner Background"
                              allow="autoplay; encrypted-media"
                              allowFullScreen
                            />
                          </div>
                        ) : !cleanedVideoUrl ? (
                          <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-black" />
                        ) : (
                          <video
                            key={cleanedVideoUrl}
                            ref={(vEl) => {
                              if (vEl) {
                                vEl.muted = true;
                                vEl.defaultMuted = true;
                                vEl.play().catch(() => {});
                              }
                            }}
                            className="w-full h-full object-cover opacity-90 scale-105"
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="auto"
                            src={cleanedVideoUrl}
                          />
                        )}
                        
                        {/* High-Contrast Gradient Backdrop Overlay for Readable Text */}
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/65 to-slate-950/30 z-10 pointer-events-none" />
                      </div>

                      {/* Content Overlay */}
                      <div className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center my-auto">
                        
                        {/* Left column text controls & overlay */}
                        <div className="lg:col-span-8 space-y-6 text-left">
                          
                          <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 backdrop-blur-md text-amber-300 text-xs font-bold uppercase tracking-widest">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                              <span>Featured Collection Showcase</span>
                            </div>

                            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-[1.08] text-white drop-shadow-lg">
                              {titleInput}
                            </h2>

                            <p className="text-slate-200 text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl font-medium tracking-wide drop-shadow-md">
                              {descInput}
                            </p>
                          </div>

                          {/* Interactive Action Buttons Overlay */}
                          <div className="flex flex-col sm:flex-row gap-4 pt-2 items-stretch sm:items-center">
                            
                            {/* Primary Button */}
                            <button
                              type="button"
                              onClick={() => handleLinkClick(sec.settings.buttonLink || 'frontend-shop')}
                              className="bg-[#dfa047] hover:bg-[#c98e3b] text-white font-extrabold py-4 px-8 rounded-xl transition-all duration-300 flex flex-col items-center justify-center cursor-pointer shadow-xl active:scale-95 group shrink-0"
                            >
                              <span className="text-[13px] font-black tracking-widest uppercase">
                                {sec.settings.buttonText || 'SHOP NOW'}
                              </span>
                              <span className="text-[10px] text-white/90 font-semibold mt-0.5">Automated hassle-free delivery</span>
                            </button>

                            {/* Secondary Button */}
                            <button
                              type="button"
                              onClick={() => handleLinkClick('frontend-shop')}
                              className="border border-white/40 hover:border-white hover:bg-white/10 text-white font-black tracking-widest text-xs uppercase py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center cursor-pointer active:scale-95 shrink-0 backdrop-blur-xs"
                            >
                              BROWSE ALL PRODUCTS
                            </button>

                          </div>

                          {/* Feature Badges Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-white/15 max-w-2xl">
                            
                            <div className="flex items-center gap-2.5">
                              <span className="p-2 bg-white/10 text-[#dfa047] border border-white/10 rounded-lg shrink-0 backdrop-blur-xs">
                                <Award className="h-4 w-4" />
                              </span>
                              <div>
                                <p className="text-[11px] font-black tracking-wider text-white uppercase">NEVER RUN OUT</p>
                                <p className="text-[10px] text-slate-300 font-medium">Delivered on schedule</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <span className="p-2 bg-white/10 text-[#dfa047] border border-white/10 rounded-lg shrink-0 backdrop-blur-xs">
                                <Package className="h-4 w-4" />
                              </span>
                              <div>
                                <p className="text-[11px] font-black tracking-wider text-white uppercase">DISCREET PACKS</p>
                                <p className="text-[10px] text-slate-300 font-medium">Plain packaging</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
                              <span className="p-2 bg-white/10 text-[#dfa047] border border-white/10 rounded-lg shrink-0 backdrop-blur-xs">
                                <Tag className="h-4 w-4" />
                              </span>
                              <div>
                                <p className="text-[11px] font-black tracking-wider text-white uppercase">BEST PRICES</p>
                                <p className="text-[10px] text-slate-300 font-medium">Up to 30% savings</p>
                              </div>
                            </div>

                          </div>

                        </div>

                        {/* Right column empty spacing */}
                        <div className="hidden lg:block lg:col-span-4 h-full min-h-[200px]" />

                      </div>

                      {/* Feature bar at the bottom of the section */}
                      {sec.settings.showFeatureBar !== false && (
                      <div className="w-full bg-slate-900 py-4.5 px-4 sm:px-6 z-20 relative border-t border-white/5 shadow-md mt-auto">
                        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 text-white text-center sm:text-left divide-y lg:divide-y-0 lg:divide-x divide-white/15">
                          
                          {/* Item 1 */}
                          <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-center lg:justify-start px-2 py-2 sm:py-0">
                            <Truck className="h-5.5 w-5.5 text-white shrink-0" />
                            <div>
                              <p className="text-[10.5px] sm:text-[11px] font-black tracking-widest uppercase leading-tight">FREE DELIVERY</p>
                              <p className="text-[9.5px] sm:text-[10px] text-white/90 font-bold mt-0.5">On qualifying orders</p>
                            </div>
                          </div>

                          {/* Item 2 */}
                          <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-center lg:justify-start px-4 py-2 sm:py-0 border-white/15">
                            <Calendar className="h-5.5 w-5.5 text-white shrink-0" />
                            <div>
                              <p className="text-[10.5px] sm:text-[11px] font-black tracking-widest uppercase leading-tight">EASY RETURNS</p>
                              <p className="text-[9.5px] sm:text-[10px] text-white/90 font-bold mt-0.5">Hassle-free returns & exchanges</p>
                            </div>
                          </div>

                          {/* Item 3 */}
                          <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-center lg:justify-start px-4 py-2 sm:py-0 border-white/15">
                            <Award className="h-5.5 w-5.5 text-white shrink-0" />
                            <div>
                              <p className="text-[10.5px] sm:text-[11px] font-black tracking-widest uppercase leading-tight">QUALITY GUARANTEED</p>
                              <p className="text-[9.5px] sm:text-[10px] text-white/90 font-bold mt-0.5">Carefully checked before dispatch</p>
                            </div>
                          </div>

                          {/* Item 4 */}
                          <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-center lg:justify-start px-4 py-2 sm:py-0 border-white/15">
                            <Lock className="h-5.5 w-5.5 text-white shrink-0" />
                            <div>
                              <p className="text-[10.5px] sm:text-[11px] font-black tracking-widest uppercase leading-tight">SECURE CHECKOUT</p>
                              <p className="text-[9.5px] sm:text-[10px] text-white/90 font-bold mt-0.5">Your data is protected</p>
                            </div>
                          </div>

                        </div>
                      </div>
                      )}

                    </div>
                  );
                })()}

                {/* 3. IMAGE WITH TEXT */}
                {sec.type === 'Image with text' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center px-4 sm:px-6">
                    <div className="order-2 md:order-1 relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-indigo-500 rounded-3xl blur opacity-15 group-hover:opacity-20 transition duration-500" />
                      <div className="relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-50">
                        <img
                          src={cleanMediaUrl(sec.settings.imageUrl) || PLACEHOLDER_IMAGE}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
                          alt=""
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-6 order-1 md:order-2">
                      <div className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 font-extrabold uppercase tracking-widest text-[9px] py-1 px-3 rounded-full">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Premium Standard Guaranteed</span>
                      </div>
                      
                      <h2 
                        className="text-3xl font-black uppercase tracking-tight leading-tight"
                        style={{ color: sec.settings.headingColor || '#000000' }}
                      >
                        {sec.settings.title || 'Image with text'}
                      </h2>
                      
                      <p className="text-sm opacity-90 leading-relaxed text-slate-600">
                        {sec.settings.description || 'Pair text with an image to tell your story.'}
                      </p>

                      {sec.settings.buttonText && (
                        <div className="pt-2">
                          <button
                            onClick={() => handleLinkClick(sec.settings.buttonLink)}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 px-6 rounded-xl transition-all shadow-md inline-flex items-center gap-2 cursor-pointer uppercase tracking-widest group"
                          >
                            <span>{sec.settings.buttonText}</span>
                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. TEXT COLUMN WITH IMAGE */}
                {sec.type === 'Text column with image' && (
                  <div className="space-y-12 px-4 sm:px-6">
                    <div className="text-center max-w-2xl mx-auto space-y-3">
                      <span className="text-[10px] tracking-widest font-black uppercase text-indigo-600 bg-indigo-50/90 py-1 px-3.5 rounded-full inline-block">{sec.settings.badgeText || 'Why choose us'}</span>
                      <h2 
                        className="text-3xl font-black uppercase tracking-tight"
                        style={{ color: sec.settings.headingColor || '#000000' }}
                      >
                        {sec.settings.title || 'Made to make a difference'}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500">{sec.settings.description || 'Quality, care and service in everything we do.'}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                      {(Array.isArray(sec.settings.columnItems) && sec.settings.columnItems.length
                        ? sec.settings.columnItems.map((c: any) => ({ title: c.title || '', desc: c.description || '', img: c.imageUrl || '', badge: c.badge || '', linkUrl: c.linkUrl || '' }))
                        : [
                            { title: 'Quality materials', desc: 'Every product is chosen for how well it is made and how long it lasts.', img: '', badge: '', linkUrl: '' },
                            { title: 'Fast, tracked delivery', desc: 'Orders are packed with care and shipped with tracking to your door.', img: '', badge: '', linkUrl: '' },
                            { title: 'Friendly support', desc: 'Questions before or after you buy? Our team is happy to help.', img: '', badge: '', linkUrl: '' }
                          ]
                      ).map((col: any, cIdx: number) => (
                        <div key={cIdx} className="bg-white border border-slate-100 rounded-2xl overflow-hidden p-4 space-y-4 shadow-sm hover:shadow-xl hover:border-slate-300/60 transition-all group flex flex-col justify-between">
                          <div className="space-y-3">
                            {col.img && (<div className="relative h-44 w-full rounded-xl overflow-hidden bg-slate-50">
                              <img 
                                src={cleanMediaUrl(col.img)} 
                                className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-300" 
                                alt="" 
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              {col.badge && <span className="badge-bg badge-text absolute bottom-2 left-2 bg-slate-900/90 text-white text-[8px] font-bold py-0.5 px-2 rounded tracking-widest">{col.badge}</span>}
                            </div>)}
                            <h4 className="card-title font-extrabold text-slate-800 text-sm">{col.title}</h4>
                            <p className="card-desc text-[12px] text-slate-500 leading-relaxed">{col.desc}</p>
                          </div>
                          {col.linkUrl && (
                            <button type="button" onClick={() => handleLinkClick(col.linkUrl)} className="self-start text-xs font-semibold underline underline-offset-4">Learn more</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. RICH TEXT */}
                {sec.type === 'Rich text' && (
                  <div className="text-center max-w-3xl mx-auto space-y-4 py-4 px-4 sm:px-6">
                    <div className="inline-flex items-center gap-1.5 justify-center py-1 px-3 bg-teal-50 border border-teal-100 text-teal-800 rounded-full text-[9px] tracking-widest uppercase font-extrabold">
                      <TrendingUp className="h-3 w-3" />
                      <span>Certified Quality Standard</span>
                    </div>

                    <h2
                      className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-tight"
                      style={{ color: sec.settings.headingColor || '#000000' }}
                    >
                      {sec.settings.title || 'Tell your story'}
                    </h2>
                    
                    <p className="text-xs sm:text-sm leading-relaxed text-slate-500 max-w-2xl mx-auto">
                      {sec.settings.description || 'Craft premium experiences under your own terms.'}
                    </p>

                    {sec.settings.buttonText && (
                      <div className="pt-4">
                        <button
                          onClick={() => handleLinkClick(sec.settings.buttonLink)}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black py-3.5 px-8 rounded-xl transition-all shadow-md cursor-pointer uppercase tracking-widest"
                        >
                          {sec.settings.buttonText}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. MARQUEE TEXT */}
                {sec.type === 'Marquee text' && (() => {
                  const rawText = sec.settings.title || 'FREE DELIVERY ON QUALIFYING ORDERS // EASY RETURNS // SECURE CHECKOUT // UPI & CARDS ACCEPTED';
                  const items = rawText.includes('//') 
                    ? rawText.split('//').map(item => item.trim()).filter(Boolean)
                    : rawText.includes('•')
                    ? rawText.split('•').map(item => item.trim()).filter(Boolean)
                    : [rawText];
                  
                  // Duplicate items multiple times to create an absolute seamless continuous scroll loop
                  const doubledItems = items.length > 0 ? [...items, ...items, ...items, ...items] : [];
                  return (
                    <div 
                      className={`overflow-hidden py-3.5 border-y border-amber-500/10 relative w-full ${sec.settings.fullWidth ? '' : 'rounded-2xl'}`}
                      style={{ backgroundColor: sec.settings.backgroundColor || '#E8BE74' }}
                    >
                      <div className="marquee-container">
                        <div 
                          className="animate-marquee whitespace-nowrap flex gap-8 items-center font-sans font-black uppercase text-[11px] sm:text-xs tracking-wider leading-none"
                          style={{ color: sec.settings.textColor || '#1A1C1D' }}
                        >
                          {doubledItems.map((item, idx) => (
                            <React.Fragment key={idx}>
                              <span className="shrink-0">{item}</span>
                              <span className="text-[13px] opacity-80 shrink-0 select-none">•</span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 7. MARQUEE IMAGES */}
                {sec.type === 'Marquee images' && (
                  <div className="space-y-6 px-4">
                    <div className="flex items-center gap-1.5 justify-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                      <h4 className="text-[10px] font-extrabold text-center uppercase tracking-widest text-slate-400">{sec.settings.title || 'New in'}</h4>
                    </div>

                    {imageList(sec.settings.galleryImages).length > 0 ? (
                      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none justify-start sm:justify-center">
                        {imageList(sec.settings.galleryImages).map((url, i) => (
                          <div key={`reel-img-${i}`} className="h-40 w-32 sm:h-56 sm:w-44 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                            <img src={cleanMediaUrl(url)} className="h-full w-full object-cover" alt="" referrerPolicy="no-referrer" loading="lazy" />
                          </div>
                        ))}
                      </div>
                    ) : (
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none justify-start sm:justify-center">
                      {allProducts.slice(0, 6).map((prod, pIdx) => (
                        <div key={`reel-${prod.id}-${pIdx}`} className="w-28 shrink-0 bg-white border border-slate-100 p-2 rounded-xl text-center shadow-xs hover:shadow-md transition-shadow group">
                          <div className="h-20 w-20 bg-slate-50 hover:bg-slate-100 rounded-lg overflow-hidden mx-auto flex items-center justify-center transition-all">
                            <img 
                              src={cleanMediaUrl(prod.image) || PLACEHOLDER_IMAGE} 
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform" 
                              alt="" 
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                          <p className="text-[9.5px] font-black truncate text-slate-800 mt-2.5">{prod.title.split(' ')[0]}</p>
                          <p className="text-[8px] font-bold text-slate-400">{prod.vendor}</p>
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
                )}

                {/* 8. LOGO LIST */}
                {sec.type === 'Logo list' && (
                  <div className="text-center space-y-8 px-4">
                    <div className="space-y-1">
                      <h3 
                        className="text-xs font-black uppercase tracking-widest text-slate-400 block"
                        style={{ color: sec.settings.headingColor || '#94A3B8' }}
                      >
                        {sec.settings.title || 'Brands we work with'}
                      </h3>
                      {sec.settings.description && (
                        <p className="text-[10px] text-slate-400">{sec.settings.description}</p>
                      )}
                    </div>

                    {imageList(sec.settings.logoImages).length > 0 ? (
                      <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12">
                        {imageList(sec.settings.logoImages).map((url, i) => (
                          <img key={`logo-${i}`} src={cleanMediaUrl(url)} alt="" referrerPolicy="no-referrer" loading="lazy"
                            className="h-10 sm:h-12 w-auto max-w-[160px] object-contain opacity-80 hover:opacity-100 transition-opacity" />
                        ))}
                      </div>
                    ) : (
                    editor ? (
                      <p className="text-xs text-slate-400 border border-dashed rounded-xl py-6">Add logo images to this section in the page builder. Without logos it shows only its heading on the store.</p>
                    ) : null
                    )}
                  </div>
                )}

                 {/* 9. COLLECTION LIST */}
                 {sec.type === 'Collection list' && (() => {
                   const filteredCollections = sec.settings.selectedCollectionIds && sec.settings.selectedCollectionIds.length > 0
                     ? allCollections.filter(col => sec.settings.selectedCollectionIds!.includes(col.id))
                     : allCollections.slice(0, Math.min(sec.settings.itemsCount || 4, allCollections.length));
 
                   return (
                     <div className="space-y-8 px-4 sm:px-6">
                       <div className="text-center space-y-2">
                         <h3 
                           className="text-xs font-black uppercase tracking-widest text-[#0F172A]"
                           style={{ color: sec.settings.headingColor || '#0F172A' }}
                         >
                           {sec.settings.title || 'Shop by category'}
                         </h3>
                         {sec.settings.description && (
                           <p className="text-xs text-slate-500 max-w-md mx-auto">{sec.settings.description}</p>
                         )}
                       </div>
 
                       {/* Highly responsive 2-col to 4-col display */}
                       <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                         {filteredCollections.map(col => (
                           <div
                             key={col.id}
                             onClick={() => onNavigate('frontend-shop', col.id)}
                             className="bg-white border border-slate-150 hover:border-slate-400 rounded-2xl p-5 text-center cursor-pointer transition-all hover:shadow-lg group flex flex-col justify-between overflow-hidden"
                           >
                             <div className="h-24 bg-slate-50 group-hover:bg-slate-100 rounded-xl flex items-center justify-center mb-4 transition-colors overflow-hidden relative">
                               {col.image ? (
                                 <img 
                                   src={cleanMediaUrl(col.image)} 
                                   className="h-full w-full object-cover transform group-hover:scale-105 transition-transform" 
                                   alt={col.title}
                                   referrerPolicy="no-referrer"
                                   onError={(e) => {
                                     e.currentTarget.onerror = null;
                                     e.currentTarget.style.display = 'none';
                                   }}
                                 />
                               ) : (
                                 <span className="text-3xl font-semibold text-slate-400">{(col.title || '?').charAt(0).toUpperCase()}</span>
                               )}
                             </div>
                             <div>
                               <h4 className="font-extrabold text-xs text-slate-800 group-hover:text-indigo-650 transition-colors uppercase tracking-wide truncate">{col.title}</h4>
                               <p className="text-[10px] text-slate-400 mt-1 font-mono">{(col.productIds || []).length} {(col.productIds || []).length === 1 ? 'product' : 'products'}</p>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   );
                 })()}

                {/* 10. FEATURED COLLECTION (Fully Interactive Masterclass Grid) */}
                {sec.type === 'Featured collection' && (
                  <FeaturedCollectionSection 
                    sec={sec}
                    allProducts={allProducts}
                    allCollections={allCollections}
                    loggedInCustomer={loggedInCustomer}
                    onAddToCart={onAddToCart}
                    onToggleWishlist={onToggleWishlist}
                    onNavigate={onNavigate}
                  />
                )}

                {/* 10.5. CLEARANCE SALE (Interactive multi-product grid) */}
                {sec.type === 'Clearance Sale' && (
                  <ClearanceSaleSection 
                    sec={sec}
                    allProducts={allProducts}
                    loggedInCustomer={loggedInCustomer}
                    onAddToCart={onAddToCart}
                    onToggleWishlist={onToggleWishlist}
                    onNavigate={onNavigate}
                  />
                )}


                {/* 11. IMAGES GALLERY */}
                {sec.type === 'Images gallery' && (
                  <div className="space-y-8 px-4 sm:px-6">
                    <div className="text-center space-y-2">
                      <span className="text-[10px] tracking-widest font-black uppercase text-indigo-600 bg-indigo-50/90 py-1 px-3.5 rounded-full inline-block">{sec.settings.badgeText || 'Gallery'}</span>
                      <h3 
                        className="text-center text-2xl font-black uppercase tracking-tight text-[#0F172A]"
                        style={{ color: sec.settings.headingColor || '#0F172A' }}
                      >
                        {sec.settings.title || 'Gallery'}
                      </h3>
                      {sec.settings.description && (
                        <p className="text-xs text-slate-500 max-w-md mx-auto">{sec.settings.description}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                      {(imageList(sec.settings.galleryImages).length
                        ? imageList(sec.settings.galleryImages)
                        : [PLACEHOLDER_IMAGE, PLACEHOLDER_IMAGE, PLACEHOLDER_IMAGE, PLACEHOLDER_IMAGE]
                      ).map((imgUrl, galIdx) => (
                        <div key={galIdx} className="h-44 rounded-2xl overflow-hidden border border-slate-150 shadow-sm relative group bg-slate-50">
                          <img 
                            src={cleanMediaUrl(imgUrl)} 
                            className="h-full w-full object-cover hover:scale-103 transition-transform duration-500" 
                            alt="" 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-white/90 backdrop-blur-xs text-[9px] font-black uppercase tracking-widest py-1 px-3.5 text-slate-900 rounded-lg shadow-sm">View Facility</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 12. FAQS (Interactive premium Toggles) */}
                {sec.type === 'FAQs' && (() => {
                  const rawList = (sec.settings.faqs && sec.settings.faqs.length > 0) ? sec.settings.faqs
                                : (sec.settings.faqItems && sec.settings.faqItems.length > 0) ? sec.settings.faqItems
                                : null;
                  const faqsToRender = rawList || [
                    { q: 'How long does delivery take?', a: 'Most orders arrive within 3–7 working days. You will receive a tracking link by email as soon as your order ships.' },
                    { q: 'Can I return an item?', a: 'Yes. Contact us within the return window in our refund policy and we will arrange it.' },
                    { q: 'Which payment methods do you accept?', a: 'We accept major cards, UPI, net banking and popular wallets through our secure checkout.' },
                    { q: 'How can I contact you?', a: 'Use the contact form on our Contact page and our team will get back to you within one working day.' }
                  ];

                  const secKey = sec.id ? `faq-${sec.id}` : `faq-sec-${idx}`;

                  return (
                    <div className="max-w-3xl mx-auto space-y-8 px-4 sm:px-6">
                      <div className="text-center space-y-2">
                        <span className="text-[10px] tracking-widest font-black uppercase text-indigo-600 bg-indigo-50/90 py-1 px-3.5 rounded-full inline-block">Answered Live</span>
                        <h2 
                          className="text-3xl font-black uppercase tracking-tight text-[#0F172A]"
                          style={{ color: sec.settings.headingColor || '#0F172A' }}
                        >
                          {sec.settings.title || 'Frequently Asked Questions'}
                        </h2>
                        {sec.settings.description && (
                          <p className="text-xs text-slate-500">{sec.settings.description}</p>
                        )}
                      </div>

                      <div className="space-y-4">
                        {faqsToRender.map((faq: any, fIdx: number) => {
                          const qText = faq.question || faq.q || '';
                          const aText = faq.answer || faq.a || '';
                          const isChosen = openFaqIdx === `${secKey}-${fIdx}`;
                          return (
                            <div 
                              key={fIdx} 
                              className="bg-white border border-slate-150 rounded-2xl p-4.5 sm:p-5 transition-all shadow-xs cursor-pointer hover:border-slate-300"
                              onClick={() => toggleFaq(secKey, fIdx)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-xs sm:text-xs text-slate-800 flex items-center gap-2 pr-4 text-left">
                                  <span className={isChosen ? 'text-indigo-600 font-black' : 'text-slate-400 font-bold'}>Q:</span> 
                                  <span>{qText}</span>
                                </span>
                                <div className="shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-extrabold text-sm select-none transition-colors">
                                  {isChosen ? '-' : '+'}
                                </div>
                              </div>
                              
                              {/* Smooth accordion expanded logic */}
                              <div className={`transition-all duration-300 overflow-hidden ${isChosen ? 'max-h-96 mt-3 opacity-100 border-t border-slate-50 pt-3' : 'max-h-0 opacity-0'}`}>
                                <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed pl-2 text-left">
                                  {aText}
                                </p>
                                {faq.linkUrl && (
                                  <div className="mt-2.5 pl-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleLinkClick(faq.linkUrl);
                                      }}
                                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
                                    >
                                      <span>More Information</span>
                                      <ExternalLink className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* 13. SLIDESHOW */}
                {sec.type === 'Slideshow' && (
                  <PremiumSlideshow
                    slides={sec.settings.slides}
                    fullWidth={sec.settings.fullWidth}
                    backgroundColor={sec.settings.backgroundColor}
                    headingColor={sec.settings.headingColor}
                    textColor={sec.settings.textColor}
                    onLinkClick={handleLinkClick}
                  />
                )}

                {/* 14. BLOG POST */}
                {sec.type === 'Blog post' && (() => {
                  const desktopCols = sec.settings.columnsDesktop || 3;
                  const mobileCols = sec.settings.columnsMobile || 1;
                  const desktopColsClass = desktopCols === 1 ? 'lg:grid-cols-1' : desktopCols === 2 ? 'lg:grid-cols-2' : desktopCols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4';
                  const mobileColsClass = mobileCols === 1 ? 'grid-cols-1' : 'grid-cols-2';

                  // retrieve active articles or fallbacks
                  const activeBlogs = allBlogs && allBlogs.length > 0
                    ? allBlogs.filter(b => b.status === 'Active')
                    : [];

                  const displayBlogs: any[] = activeBlogs;

                  // No invented articles: without published posts the section is
                  // hidden on the store and explains itself in the builder.
                  if (displayBlogs.length === 0) {
                    return editor ? (
                      <div className="max-w-3xl mx-auto px-4 py-10 text-center text-slate-400 border border-dashed rounded-2xl my-4">
                        <p className="text-sm font-semibold">No published blog posts yet</p>
                        <p className="text-xs mt-1">Publish a post under Content → Blog posts and it will appear here. This section is hidden on the store until then.</p>
                      </div>
                    ) : null;
                  }

                  return (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 py-4">
                      <div className="text-center space-y-2">
                        <span className="text-[10px] tracking-widest font-black uppercase text-white bg-indigo-600/90 py-1 px-3.5 rounded-full inline-block">{sec.settings.badgeText || 'Journal'}</span>
                        <h2 
                          className="text-3xl font-black uppercase tracking-tight text-slate-900"
                          style={{ color: sec.settings.headingColor || '#0F172A' }}
                        >
                          {sec.settings.title || 'From the journal'}
                        </h2>
                        {sec.settings.description && (
                          <p className="text-xs text-slate-500 max-w-2xl mx-auto leading-relaxed">{sec.settings.description}</p>
                        )}
                      </div>

                      <div className={`grid ${mobileColsClass} sm:grid-cols-2 ${desktopColsClass} gap-6`}>
                        {displayBlogs.map((b, idx) => (
                          <article 
                            key={b.id || idx}
                            onClick={() => b.slug ? onNavigate('blog-detail', b.slug) : onNavigate('blogs')}
                            className="group bg-white rounded-2xl overflow-hidden border border-slate-150 p-2 hover:border-slate-350 cursor-pointer transition-all flex flex-col h-full"
                          >
                            <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-50 relative">
                              <img 
                                src={cleanMediaUrl(b.image) || PLACEHOLDER_IMAGE} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                alt=""
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs text-[9px] font-black uppercase px-2.5 py-1 rounded-md text-indigo-650 border border-slate-100 shadow-sm">
                                {b.category || 'Article'}
                              </div>
                            </div>
                            <div className="p-3.5 flex flex-col justify-between flex-1 space-y-3">
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-400">{b.date}</span>
                                <h3 className="font-extrabold text-base text-slate-850 group-hover:text-indigo-650 transition-colors line-clamp-2 leading-tight">
                                  {b.title}
                                </h3>
                                {b.excerpt && (
                                  <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                                    {b.excerpt}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-850 group-hover:translate-x-1 transition-transform">
                                <span>Read Article</span>
                                <ArrowRight className="h-4 w-4" />
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* 15. BRAND LIST */}
                {sec.type === 'Brand list' && (
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 py-4">
                    <div className="text-center space-y-3">
                      <span className="text-[10px] tracking-widest font-black uppercase text-indigo-650 bg-indigo-50 px-3 py-1 rounded-full inline-block font-sans">
                        {sec.settings.badgeText || 'Our brands'}
                      </span>
                      <h2 
                        className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-slate-900"
                        style={{ color: sec.settings.headingColor || '#0C1017' }}
                      >
                        {sec.settings.title || 'Shop by brand'}
                      </h2>
                      {sec.settings.description && (
                        <p className="text-slate-500 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed">{sec.settings.description}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
                      {(sec.settings.brandItems || []).map((b, bidx) => (
                        <div 
                          key={bidx} 
                          onClick={() => handleLinkClick(b.linkUrl)}
                          className="aspect-square relative rounded-2xl md:rounded-[24px] overflow-hidden group cursor-pointer border border-slate-100 bg-[#FAF9F5] shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all duration-500 hover:shadow-[0_20px_48px_rgba(0,0,0,0.10)] hover:-translate-y-1.5 flex flex-col justify-end"
                        >
                          {/* Image Layer */}
                          {b.imageUrl ? (
                            <img 
                              src={cleanMediaUrl(b.imageUrl)} 
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out" 
                              alt={b.title} 
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center">
                              <Layers className="h-8 w-8 text-slate-300" />
                            </div>
                          )}

                          {/* Gradient Overlay Layer */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent opacity-90 group-hover:opacity-95 transition-opacity duration-300" />

                          {/* Top Tag or Badge */}
                          <div className="absolute top-4 left-4 bg-black/30 backdrop-blur-md border border-white/10 text-[8px] font-black tracking-widest text-white px-2.5 py-1 rounded-lg uppercase leading-none shadow-sm">
                            {(bidx % 3 === 0) ? 'SWEDISH LABS' : (bidx % 3 === 1) ? 'AWARD NOMINEE' : 'EXCLUSIVE DEPOT'}
                          </div>

                          {/* Active Hover Arrow Accent */}
                          <div className="absolute top-4 right-4 bg-white text-slate-900 rounded-full p-1.5 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 shadow-md">
                            <ArrowRight className="h-3 w-3" />
                          </div>

                          {/* Text Content Block */}
                          <div className="p-5 sm:p-6 relative z-10 translate-y-1 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                            <span className="block text-[9px] font-bold text-indigo-400 uppercase tracking-widest font-mono mb-1">
                              Collection #{bidx + 1}
                            </span>
                            <h3 
                              className="brand-card-title overlay-heading text-lg sm:text-xl md:text-2xl font-black leading-tight uppercase font-sans tracking-tight"
                              style={{ color: sec.settings.overlayHeadingColor || sec.settings.cardTitleColor || '#FFFFFF' }}
                            >
                              {b.title || 'Brand'}
                            </h3>
                            
                            <div className="h-0 group-hover:h-5 opacity-0 group-hover:opacity-100 overflow-hidden transition-all duration-500 ease-out mt-1">
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                Explore collection 
                                <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
                              </span>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 17. BRANDS WE OFFER */}
                {sec.type === 'Brands we offer' && (
                  <BrandsWeOfferSection sec={sec} handleLinkClick={handleLinkClick} />
                )}

                {/* 18. HOW IT WORKS */}
                {sec.type === 'How it works' && (
                  <HowItWorksSection sec={sec} handleLinkClick={handleLinkClick} />
                )}


                {/* 16. ICON WITH TEXT */}
                {sec.type === 'Icon with text' && (() => {
                  const items = (sec.settings.iconItems && sec.settings.iconItems.length ? sec.settings.iconItems : null) || [
                    { iconName: 'Truck', title: 'Free delivery', description: 'On qualifying orders, tracked to your door.', linkUrl: '' },
                    { iconName: 'Shield', title: 'Secure checkout', description: 'Cards, UPI and wallets, fully encrypted.', linkUrl: '' },
                    { iconName: 'Package', title: 'Easy returns', description: 'Changed your mind? Returns are simple.', linkUrl: '' },
                    { iconName: 'Heart', title: 'Here to help', description: 'Friendly support before and after you buy.', linkUrl: '' }
                  ];

                  // Always the merchant's own words — never substituted copy.
                  const getPremiumCardDetails = (iconName: string, title: string, description: string) => ({
                    title: title || '',
                    desc: description || '',
                    benefits: [] as string[],
                    iconName
                  });

                  return (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 py-8">
                      <div className="text-center space-y-3">
                        {sec.settings.title && (
                          <h2 
                            className="text-3xl md:text-4xl font-black uppercase tracking-tight text-[#071529]"
                          >
                            {sec.settings.title}
                          </h2>
                        )}
                        {sec.settings.description && (
                          <p 
                            className="max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed text-slate-500 font-semibold"
                          >
                            {sec.settings.description}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                        {items.map((item, iIdx) => {
                          const details = getPremiumCardDetails(item.iconName, item.title, item.description);
                          
                          const IconComp = (() => {
                            const iconClass = "h-8 w-8 transition-transform duration-300 group-hover:scale-115";
                            switch (details.iconName) {
                              case 'Truck': return <Truck className={iconClass} />;
                              case 'Zap': return <Zap className={iconClass} />;
                              case 'Shield': return <ShieldCheck className={iconClass} />;
                              case 'Clock': return <Clock className={iconClass} />;
                              case 'Award': return <Award className={iconClass} />;
                              case 'Package': return <Package className={iconClass} />;
                              case 'Heart': return <Heart className={iconClass} />;
                              case 'HelpCircle': return <HelpCircle className={iconClass} />;
                              case 'Star': return <Star className={iconClass} />;
                              default: return <Sparkles className={iconClass} />;
                            }
                          })();

                          return (
                            <div 
                              key={iIdx} 
                              onClick={() => {
                                if (item.linkUrl) handleLinkClick(item.linkUrl);
                              }}
                              className={`bg-white border border-slate-100 rounded-2xl p-6 md:p-7 flex flex-col justify-between card-bg hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group shadow-xs select-none ${item.linkUrl ? 'cursor-pointer' : ''}`}
                            >
                              <div className="space-y-5">
                                {/* Top row with icon, title/desc, and action arrow */}
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-4">
                                    {/* Icon with soft gold circle background */}
                                    <div className="accent-icon w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-slate-100 flex items-center justify-center shrink-0 transition-all duration-300" style={{ color: (sec.settings as any).iconColor || '#0F172A' }}>
                                      {IconComp}
                                    </div>
                                    
                                    {/* Text info */}
                                    <div className="text-left">
                                      <h3 
                                        className="card-title text-sm sm:text-base font-bold tracking-wide text-[#071529]"
                                      >
                                        {details.title}
                                      </h3>
                                      <p 
                                        className="text-[11px] sm:text-xs text-slate-500 font-bold leading-relaxed mt-1"
                                      >
                                        {details.desc}
                                      </p>
                                    </div>
                                  </div>

                                  {item.linkUrl && (
                                  <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 transition-all duration-300 group-hover:border-slate-900 group-hover:text-slate-900 shrink-0">
                                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                                  </div>
                                  )}
                                </div>

                                {details.benefits.length > 0 && (
                                <div className="pt-4 border-t border-slate-50 flex flex-wrap gap-x-5 gap-y-2 text-left">
                                  {details.benefits.map((benefit, bIdx) => (
                                    <div key={bIdx} className="flex items-center gap-1.5">
                                      <Check className="h-3.5 w-3.5 text-[#dfa047] stroke-[3.5px] shrink-0" />
                                      <span className="text-[10.5px] font-extrabold text-slate-600 uppercase tracking-wide">
                                        {benefit}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* 18. TRUST BADGES */}
                {sec.type === 'Trust badges' && (() => {
                  const badges = sec.settings.trustBadges || [
                    { iconType: 'badge', title: '100% AUTHENTIC', description: 'Direct from official suppliers.' },
                    { iconType: 'shield', title: 'PREMIUM QUALITY', description: 'Only trusted, proven brands.' },
                    { iconType: 'globe', title: 'GLOBAL SELECTION', description: 'The best from around the world.' },
                    { iconType: 'tag', title: 'MEMBER PRICING', description: 'Better prices, always.' }
                  ];

                  return (
                    <div className="py-8 bg-white w-full">
                      <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-4 md:py-6 border-y border-slate-100 divide-y md:divide-y-0 md:divide-x divide-slate-150">
                          {badges.map((b, bIdx) => (
                            <div 
                              key={bIdx} 
                              className="flex items-center gap-4 py-4 md:py-2 md:px-6 first:pl-0 last:pr-0 justify-center md:justify-start first:pt-0 md:first:pt-2 last:pb-0 md:last:pb-2"
                            >
                              <div className="shrink-0 p-2 rounded-xl bg-slate-50 flex items-center justify-center shadow-2xs">
                                {b.iconType === 'badge' ? (
                                  <Award className="h-7 w-7 text-[#D4AF37]" />
                                ) : b.iconType === 'shield' ? (
                                  <ShieldCheck className="h-7 w-7 text-slate-800" />
                                ) : b.iconType === 'globe' ? (
                                  <Globe className="h-7 w-7 text-slate-800" />
                                ) : (
                                  <Tag className="h-7 w-7 text-slate-800" />
                                )}
                              </div>
                              <div className="text-left space-y-0.5">
                                <h4 className="text-xs font-black tracking-wide text-slate-900 uppercase">
                                  {b.title}
                                </h4>
                                <p className="text-[11px] text-slate-400 leading-normal font-medium">
                                  {b.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 19. CONTACT FORM SECTION */}
                {sec.type === 'Contact Form' && (() => {
                  return <ContactFormSection sec={sec} />;
                })()}

              </div>
            </section>
          );
        })
      ) : (
        <div className="text-center py-24 bg-white border border-slate-150 rounded-3xl max-w-md mx-auto shadow-sm p-6 space-y-4">
          <div className="h-14 w-14 rounded-full bg-slate-50 border text-slate-300 flex items-center justify-center mx-auto">
            <FileText className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xs font-black uppercase text-slate-700 tracking-wider">No Active Page Sections</h2>
            <p className="text-[10px] text-slate-400 leading-relaxed">This custom canvas currently contains no sections. Create or drag new sections inside the admin editor.</p>
          </div>
        </div>
      )}
    </div>
  );
}
