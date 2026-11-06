import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { Collection, Customer, Product } from '../../types';
import { ProductCard, SectionHeading, THEME_IMAGES, unsplash, visibleProducts } from './storeKit';

interface FashionHomeProps {
  products: Product[];
  collections: Collection[];
  customer: Customer | null;
  onAddToCart: (p: Product, qty: number) => void;
  onToggleWishlist: (id: string) => void;
  navigate: (tab: string, productId?: string, collectionId?: string) => void;
}

/** A fitting theme photo for a collection that has no image of its own. */
export function fallbackCollectionImage(title: string): string {
  const t = title.toLowerCase();
  const pick =
    /saree|sari|kurta|lehenga|ethnic|festive|anarkali/.test(t) ? THEME_IMAGES.ethnic :
    /dress|gown/.test(t) ? THEME_IMAGES.dresses :
    /top|shirt|blouse|tee/.test(t) ? THEME_IMAGES.tops :
    /bottom|jean|trouser|pant|skirt/.test(t) ? THEME_IMAGES.bottoms :
    /jacket|coat|outer|blazer/.test(t) ? THEME_IMAGES.outerwear :
    /bag|access|jewel/.test(t) ? THEME_IMAGES.accessories :
    /shoe|heel|foot|sandal/.test(t) ? THEME_IMAGES.footwear :
    /co-?ord|set|lounge|active/.test(t) ? THEME_IMAGES.coords :
    THEME_IMAGES.rack;
  return unsplash(pick, 700, 900);
}

const STATIC_CATEGORIES = [
  { title: 'Dresses', image: THEME_IMAGES.dresses },
  { title: 'Ethnic Wear', image: THEME_IMAGES.ethnic },
  { title: 'Tops', image: THEME_IMAGES.tops },
  { title: 'Bottoms', image: THEME_IMAGES.bottoms },
  { title: 'Outerwear', image: THEME_IMAGES.outerwear },
  { title: 'Accessories', image: THEME_IMAGES.accessories }
];

export default function FashionHome({ products, collections, customer, onAddToCart, onToggleWishlist, navigate }: FashionHomeProps) {
  const catalogue = useMemo(() => visibleProducts(products), [products]);

  const newArrivals = useMemo(
    () =>
      [...catalogue]
        .sort((a, b) => Date.parse(b.createdAt || '') - Date.parse(a.createdAt || '') || 0)
        .slice(0, 8),
    [catalogue]
  );

  const bestSellers = useMemo(() => {
    const tagged = catalogue.filter(p => (p.tags || []).some(t => /best\s*seller/i.test(t)));
    const rest = catalogue.filter(p => !tagged.includes(p) && !newArrivals.slice(0, 4).includes(p));
    return [...tagged, ...rest].slice(0, 4);
  }, [catalogue, newArrivals]);

  const categoryTiles = useMemo(() => {
    const real = (collections || []).filter(c => c && c.title).slice(0, 6);
    return real.length >= 3
      ? real.map(c => ({ key: c.id, title: c.title, image: c.image || fallbackCollectionImage(c.title), open: () => navigate('collection-detail', undefined, c.slug || c.id) }))
      : STATIC_CATEGORIES.map(c => ({ key: c.title, title: c.title, image: unsplash(c.image, 700, 900), open: () => navigate('frontend-shop') }));
  }, [collections, navigate]);

  const ethnic = (collections || []).find(c => /ethnic|saree|kurta|festive/i.test(c.title));
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
    <button type="button" onClick={() => navigate('frontend-shop')} className="group inline-flex items-center gap-2 border-b border-ink pb-1 text-[11px] uppercase tracking-[0.2em] cursor-pointer">
      View all <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
    </button>
  );

  return (
    <div className="store">
      {/* Hero */}
      <section className="relative">
        <div className="grid min-h-[78vh] grid-cols-1 md:grid-cols-2">
          <div className="relative order-2 flex items-center bg-blush px-6 py-16 sm:px-12 md:order-1 lg:px-20">
            <div className="store-fade-up max-w-lg">
              <p className="text-[11px] uppercase tracking-[0.3em] text-clay">New season edit</p>
              <h1 className="font-display mt-5 text-5xl leading-[1.02] text-ink sm:text-6xl lg:text-7xl">
                Effortless pieces,<br /><em className="font-normal">beautifully made.</em>
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-stone">
                Flowing dresses, festive ethnic wear and everyday essentials — thoughtfully designed for the way you live.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <button type="button" onClick={() => navigate('frontend-shop')} className="bg-ink px-8 py-4 text-[11px] uppercase tracking-[0.22em] text-white transition hover:bg-clay cursor-pointer">
                  Shop new in
                </button>
                <button
                  type="button"
                  onClick={() => (ethnic ? navigate('collection-detail', undefined, ethnic.slug || ethnic.id) : navigate('frontend-shop'))}
                  className="border border-ink px-8 py-4 text-[11px] uppercase tracking-[0.22em] text-ink transition hover:bg-ink hover:text-white cursor-pointer"
                >
                  The festive edit
                </button>
              </div>
            </div>
          </div>
          <div className="relative order-1 min-h-[52vh] md:order-2">
            <img src={unsplash(THEME_IMAGES.hero, 1400)} alt="Woman in a burgundy coat carrying shopping bags" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
          </div>
        </div>
      </section>

      {/* Shop by category */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Shop by category" title="Find your favourites" />
        <div className="store-scrollbar-none -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
          {categoryTiles.map(c => (
            <button key={c.key} type="button" onClick={c.open} className="group w-40 shrink-0 snap-start text-left sm:w-auto cursor-pointer">
              <div className="aspect-[3/4] overflow-hidden bg-sand">
                <img src={c.image} alt={c.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              </div>
              <p className="mt-3 text-center text-[12px] uppercase tracking-[0.18em]">{c.title}</p>
            </button>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Just landed" title="New arrivals" action={shopAllLink} />
        {newArrivals.length > 0 ? grid(newArrivals, true) : (
          <p className="border border-dashed border-line py-16 text-center text-sm text-stone">
            Products added in Admin → Products appear here.
          </p>
        )}
      </section>

      {/* Editorial */}
      <section className="bg-sand">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 lg:px-8">
          <div className="grid grid-cols-2 gap-4">
            <img src={unsplash('1585487000160-6ebcfceb0d03', 700, 950)} alt="Model in a burgundy midi dress" loading="lazy" className="aspect-[3/4] w-full object-cover" />
            <img src={unsplash('1610030469983-98e550d6193c', 700, 950)} alt="Model in a navy and gold saree" loading="lazy" className="mt-12 aspect-[3/4] w-full object-cover" />
          </div>
          <div className="max-w-md md:pl-8">
            <p className="text-[11px] uppercase tracking-[0.3em] text-clay">The festive edit</p>
            <h2 className="font-display mt-4 text-4xl leading-tight sm:text-5xl">Celebrate in colour</h2>
            <p className="mt-5 leading-relaxed text-stone">
              Rich jewel tones, hand-finished details and silhouettes made for every celebration — from intimate dinners to the big day.
            </p>
            <button
              type="button"
              onClick={() => (ethnic ? navigate('collection-detail', undefined, ethnic.slug || ethnic.id) : navigate('frontend-shop'))}
              className="mt-8 bg-ink px-8 py-4 text-[11px] uppercase tracking-[0.22em] text-white transition hover:bg-clay cursor-pointer"
            >
              Discover the edit
            </button>
          </div>
        </div>
      </section>

      {/* Best sellers */}
      {bestSellers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Most loved" title="Best sellers" action={shopAllLink} />
          {grid(bestSellers)}
        </section>
      )}

      {/* Lookbook strip */}
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Lookbook" title="Styled for every day" />
        </div>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-6">
          {['1496747611176-843222e1e57c', '1515886657613-9f3515b0c78f', '1485968579580-b6d095142e6e', '1525507119028-ed4c629a60a3', '1551803091-e20673f15770', '1612336307429-8a898d10e223'].map(id => (
            <div key={id} className="aspect-square overflow-hidden bg-sand">
              <img src={unsplash(id, 500, 500)} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 hover:scale-105" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
