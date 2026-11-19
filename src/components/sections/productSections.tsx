import React, { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Product } from '../../types';
import { ProductCard } from '../storefront/storeKit';
import { Btn, EditorHint, Eyebrow, SECTION_Y, SectionHeader, SectionProps, TextLink, imageOr, placeholderImage, seedOf } from './sectionKit';

function ProductGrid({ products, ctx }: { products: Product[]; ctx: SectionProps['ctx'] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-6">
      {products.map((p, i) => (
        <ProductCard
          key={p.id}
          product={p}
          customer={ctx.loggedInCustomer}
          onOpen={x => ctx.onNavigate('product-detail', x.slug || x.id)}
          onAddToCart={ctx.onAddToCart}
          onToggleWishlist={ctx.onToggleWishlist}
          priority={i < 4}
        />
      ))}
    </div>
  );
}

/** Builder-only stand-ins so an empty catalogue still previews the layout. */
function PlaceholderGrid({ seed, count = 4 }: { seed: number; count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-6 opacity-80">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="aspect-[3/4] overflow-hidden bg-sand">
            <img src={placeholderImage(seed + i, 700, 930)} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-stone">Brand</p>
          <p className="mt-1 text-sm text-ink">Product name</p>
          <p className="mt-1.5 text-sm text-ink">₹2,499</p>
        </div>
      ))}
    </div>
  );
}

// ── Featured collection ─────────────────────────────────────────────────────

type Tab = 'all' | 'new' | 'bestsellers' | 'sale';
const hasTag = (p: Product, re: RegExp) => (p.tags || []).some(t => re.test(String(t)));
const NEW_TAG = /^new$|new\s*arrival|latest/i;

export function FeaturedCollectionSection({ sec, ctx }: SectionProps) {
  const s: any = sec.settings;
  const [tab, setTab] = useState<Tab>('all');
  const coll = useMemo(
    () => (s.selectedCollectionId ? ctx.allCollections.find(c => c.id === s.selectedCollectionId || c.slug === s.selectedCollectionId) || null : null),
    [s.selectedCollectionId, ctx.allCollections]
  );
  const base = useMemo(() => {
    const active = ctx.allProducts.filter(p => p.status === 'Active');
    return coll ? active.filter(p => (coll.productIds || []).includes(p.id)) : active;
  }, [ctx.allProducts, coll]);

  const tabs = useMemo(() => {
    const newest = [...base].sort((a, b) => (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0));
    const list: { id: Tab; label: string; items: Product[] }[] = [
      { id: 'all', label: 'All', items: base },
      { id: 'new', label: 'New arrivals', items: base.some(p => hasTag(p, NEW_TAG)) ? base.filter(p => hasTag(p, NEW_TAG)) : newest },
      { id: 'bestsellers', label: 'Bestsellers', items: base.filter(p => hasTag(p, /best\s*-?seller|popular|featured/i)) },
      { id: 'sale', label: 'Sale', items: base.filter(p => Number(p.compareAtPrice) > Number(p.price)) }
    ];
    return list.filter(t => t.id === 'all' || t.items.length > 0);
  }, [base]);

  const current = tabs.find(t => t.id === tab) || tabs[0];
  const items = (current?.items || []).slice(0, Number(s.itemsCount) || 8);
  const showTabs = s.showTabs !== false && tabs.length > 1;
  if (!ctx.editor && base.length === 0) return null;

  return (
    <div className={SECTION_Y}>
      <SectionHeader
        align="left"
        eyebrow={s.badgeText || (coll ? 'The collection' : 'Curated for you')}
        title={s.title || coll?.title || 'Featured pieces'}
        description={s.description || coll?.description || undefined}
        action={<TextLink onClick={() => ctx.go(s.buttonLink || (coll ? `/collections/${coll.slug || coll.id}` : '/shop'))}>{s.buttonText || 'View all'}</TextLink>}
      />

      {showTabs && (
        <div className="mb-10 flex gap-8 overflow-x-auto border-b border-line store-scrollbar-none">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative -mb-px whitespace-nowrap pb-3 text-[12px] uppercase tracking-[0.2em] transition-colors ${
                current?.id === t.id ? 'border-b border-ink text-ink' : 'text-stone hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {items.length > 0 ? <ProductGrid products={items} ctx={ctx} /> : ctx.editor ? <PlaceholderGrid seed={seedOf(sec.id)} /> : null}
      {items.length === 0 && <EditorHint ctx={ctx}>Sample cards — add active products{coll ? ' to this collection' : ''} and they replace these.</EditorHint>}
    </div>
  );
}

// ── Collection list ─────────────────────────────────────────────────────────

const SAMPLE_COLLECTIONS = ['New arrivals', 'Dresses', 'Knitwear', 'Accessories'];

export function CollectionListSection({ sec, ctx }: SectionProps) {
  const s: any = sec.settings;
  const seed = seedOf(sec.id);
  const picked: string[] = Array.isArray(s.selectedCollectionIds) ? s.selectedCollectionIds : [];
  const real = (picked.length
    ? ctx.allCollections.filter(c => picked.includes(c.id))
    : ctx.allCollections.filter(c => c && c.title && c.id !== 'all')
  ).slice(0, Number(s.itemsCount) || 4);

  const cards = real.length
    ? real.map((c, i) => ({ key: c.id, title: c.title, count: (c.productIds || []).length, image: imageOr(c.image, seed + i, 900, 1200), open: () => ctx.go(`/collections/${c.slug || c.id}`) }))
    : SAMPLE_COLLECTIONS.map((t, i) => ({ key: t, title: t, count: null as number | null, image: placeholderImage(seed + i, 900, 1200), open: () => ctx.go('/shop') }));

  const cols = cards.length >= 4 ? 'lg:grid-cols-4' : cards.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2';

  return (
    <div className={SECTION_Y}>
      <SectionHeader
        eyebrow={s.badgeText || 'Shop by category'}
        title={s.title || 'Find your favourites'}
        description={s.description || undefined}
      />
      <div className={`grid grid-cols-2 gap-3 md:gap-5 ${cols}`}>
        {cards.map(c => (
          <button key={c.key} type="button" onClick={c.open} className="group relative block overflow-hidden bg-sand text-left">
            {/* Fixed 3:4 frame with object-cover: every card is the same shape, nothing is squashed. */}
            <div className="aspect-[3/4] w-full overflow-hidden">
              <img src={c.image} alt={c.title} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 md:p-6">
              <div>
                <h3 className="overlay-heading card-title font-display text-2xl md:text-3xl font-normal leading-none text-white">{c.title}</h3>
                {c.count !== null && <p className="overlay-text mt-1.5 text-[11px] uppercase tracking-[0.2em] text-white/80">{c.count} {c.count === 1 ? 'piece' : 'pieces'}</p>}
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 text-ink transition-transform duration-300 group-hover:rotate-45">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </button>
        ))}
      </div>
      {real.length === 0 && <EditorHint ctx={ctx}>Sample categories — create collections and they appear here with their own images.</EditorHint>}
    </div>
  );
}

// ── Sale products ───────────────────────────────────────────────────────────

export function SaleSection({ sec, ctx }: SectionProps) {
  const s: any = sec.settings;
  const picked: string[] = Array.isArray(s.selectedProductIds) ? s.selectedProductIds : [];
  const products = useMemo(() => {
    const active = ctx.allProducts.filter(p => p.status === 'Active');
    const list = picked.length ? active.filter(p => picked.includes(p.id)) : active.filter(p => Number(p.compareAtPrice) > Number(p.price));
    return list.slice(0, Number(s.itemsCount) || 8);
  }, [ctx.allProducts, picked.join(','), s.itemsCount]);

  // Only a real discount is advertised: the largest one among these products.
  const maxOff = products.reduce((m, p) => {
    const cmp = Number(p.compareAtPrice), price = Number(p.price);
    return cmp > price && cmp > 0 ? Math.max(m, Math.round((1 - price / cmp) * 100)) : m;
  }, 0);

  if (!ctx.editor && products.length === 0) return null;

  return (
    <div className={SECTION_Y}>
      <div className="mb-12 grid gap-8 border-b border-line pb-10 md:grid-cols-[1fr_auto] md:items-end md:mb-16">
        <div className="space-y-4">
          <Eyebrow>{s.badgeText || 'Limited time'}</Eyebrow>
          <h2 className="section-title font-display text-5xl md:text-7xl font-light leading-[0.95] text-ink">
            {s.title || 'The sale'}
          </h2>
          <p className="section-desc max-w-lg text-[15px] leading-relaxed text-stone">
            {s.description || 'Selected styles at their lowest prices of the season — while sizes last.'}
          </p>
        </div>
        <div className="flex flex-col items-start gap-4 md:items-end">
          {maxOff > 0 && (
            <span className="badge-bg badge-text bg-clay px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white">Up to {maxOff}% off</span>
          )}
          <Btn variant="outline" onClick={() => ctx.go(s.buttonLink || '/shop')}>{s.buttonText || 'Shop the sale'}</Btn>
        </div>
      </div>
      {products.length > 0 ? <ProductGrid products={products} ctx={ctx} /> : ctx.editor ? <PlaceholderGrid seed={seedOf(sec.id) + 6} /> : null}
      {products.length === 0 && (
        <EditorHint ctx={ctx}>Sample cards — give products a compare-at price above their price (or pick products in this section) to fill the sale.</EditorHint>
      )}
    </div>
  );
}
