import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { Collection, Customer, Product } from '../../types';
import { ProductCard, SectionHeading, visibleProducts } from './storeKit';
import { cleanMediaUrl } from '../../utils/mediaUtils';

interface FashionHomeProps {
  products: Product[];
  collections: Collection[];
  customer: Customer | null;
  onAddToCart: (p: Product, qty: number) => void;
  onToggleWishlist: (id: string) => void;
  navigate: (tab: string, productId?: string, collectionId?: string) => void;
}

/**
 * The built-in theme home page (used only when Header & Footer → Home page is
 * set to "Built-in theme"). Everything on it comes from the store's own
 * catalogue — no stock photography or industry-specific copy.
 */
export default function FashionHome({ products, collections, customer, onAddToCart, onToggleWishlist, navigate }: FashionHomeProps) {
  const catalogue = useMemo(() => visibleProducts(products), [products]);

  const newArrivals = useMemo(
    () => [...catalogue].sort((a, b) => (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0)).slice(0, 8),
    [catalogue]
  );

  const bestSellers = useMemo(() => {
    const tagged = catalogue.filter(p => (p.tags || []).some(t => /best\s*-?seller|popular/i.test(t)));
    return tagged.slice(0, 4);
  }, [catalogue]);

  const categories = useMemo(() => (collections || []).filter(c => c && c.title && c.id !== 'all').slice(0, 6), [collections]);
  const heroSource = newArrivals.find(p => p.image)?.image;
  const heroImage = heroSource ? cleanMediaUrl(heroSource) : '';
  const openProduct = (p: Product) => navigate('product-detail', p.slug || p.id);

  const grid = (items: Product[], priority = false) => (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
      {items.map((p, i) => (
        <ProductCard
          key={p.id}
          product={p}
          customer={customer}
          onOpen={openProduct}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
          priority={priority && i < 4}
        />
      ))}
    </div>
  );

  const shopAllLink = (
    <button type="button" onClick={() => navigate('frontend-shop')} className="group inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.18em] text-ink cursor-pointer">
      View all <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
    </button>
  );

  return (
    <div className="store">
      {/* Hero */}
      <section className="relative">
        <div className="grid min-h-[70vh] grid-cols-1 md:grid-cols-2">
          <div className="relative order-2 flex items-center bg-blush px-6 py-16 sm:px-12 md:order-1 lg:px-20">
            <div className="store-fade-up max-w-lg">
              <p className="text-[11px] uppercase tracking-[0.3em] text-clay">New arrivals</p>
              <h1 className="font-display mt-5 text-5xl leading-[1.02] text-ink sm:text-6xl">
                Thoughtfully chosen,<br /><em className="font-normal">delivered to you.</em>
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-stone">
                Discover our latest products and everyday favourites.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <button type="button" onClick={() => navigate('frontend-shop')} className="bg-ink px-8 py-4 text-[11px] uppercase tracking-[0.22em] text-white transition hover:bg-clay cursor-pointer">
                  Shop now
                </button>
              </div>
            </div>
          </div>
          <div className="relative order-1 min-h-[44vh] bg-sand md:order-2">
            {heroImage && (
              <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
            )}
          </div>
        </div>
      </section>

      {/* Shop by category — the store's own collections */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Shop by category" title="Find your favourites" />
          <div className="store-scrollbar-none -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
            {categories.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => navigate('collection-detail', undefined, c.slug || c.id)}
                className="group w-40 shrink-0 snap-start text-left sm:w-auto cursor-pointer"
              >
                <div className="aspect-[3/4] overflow-hidden bg-sand flex items-center justify-center">
                  {c.image ? (
                    <img src={cleanMediaUrl(c.image)} alt={c.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  ) : (
                    <span className="font-display text-4xl text-stone">{c.title.charAt(0)}</span>
                  )}
                </div>
                <p className="mt-3 text-center text-[12px] uppercase tracking-[0.18em]">{c.title}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* New arrivals */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Just landed" title="New arrivals" action={shopAllLink} />
        {newArrivals.length > 0 ? grid(newArrivals, true) : (
          <p className="border border-dashed border-line py-16 text-center text-sm text-stone">
            Products added in Admin → Products appear here.
          </p>
        )}
      </section>

      {/* Best sellers (products tagged "bestseller") */}
      {bestSellers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Most loved" title="Best sellers" action={shopAllLink} />
          {grid(bestSellers)}
        </section>
      )}
    </div>
  );
}
