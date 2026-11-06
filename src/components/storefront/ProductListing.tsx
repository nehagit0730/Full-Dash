import React, { useMemo, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Collection, Customer, Product } from '../../types';
import { formatPrice, ProductCard, visibleProducts } from './storeKit';

/**
 * The product list with filters and sorting, shared by the Shop page and the
 * collection pages. Navigation uses the same URL + popstate convention as the
 * rest of the storefront, so it needs no navigation callback.
 */

export function openProductPage(p: Product) {
  try {
    window.history.pushState({}, '', `/products/${p.slug || p.id}`);
  } catch {
    /* sandboxed frame */
  }
  window.dispatchEvent(new Event('popstate'));
  window.scrollTo({ top: 0 });
}

type Sort = 'featured' | 'newest' | 'price-asc' | 'price-desc';

const PRICE_BANDS = [
  { id: 'all', label: 'All prices', min: 0, max: Infinity },
  { id: 'u999', label: 'Under ₹999', min: 0, max: 999 },
  { id: '1k-2k', label: '₹1,000 – ₹1,999', min: 1000, max: 1999.99 },
  { id: '2k-4k', label: '₹2,000 – ₹3,999', min: 2000, max: 3999.99 },
  { id: '4k+', label: '₹4,000 & above', min: 4000, max: Infinity }
];

export default function ProductListing({
  products,
  collections = [],
  activeCollectionId,
  onActiveCollectionChange,
  customer,
  onAddToCart,
  onToggleWishlist,
  onNeedLogin,
  title,
  description,
  showCategoryFilter = true
}: {
  products: Product[];
  collections?: Collection[];
  activeCollectionId?: string;
  onActiveCollectionChange?: (id: string) => void;
  customer: Customer | null;
  onAddToCart: (p: Product, qty: number) => void;
  onToggleWishlist: (id: string) => void;
  onNeedLogin?: () => void;
  title: string;
  description?: string;
  showCategoryFilter?: boolean;
}) {
  const [sort, setSort] = useState<Sort>('featured');
  const [band, setBand] = useState('all');
  const [saleOnly, setSaleOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeCollection = collections.find(c => c.id === activeCollectionId || c.slug === activeCollectionId) || null;

  const list = useMemo(() => {
    let items = visibleProducts(products);
    if (showCategoryFilter && activeCollection) {
      const ids = new Set(activeCollection.productIds || []);
      items = items.filter(p => ids.has(p.id));
    }
    const priceBand = PRICE_BANDS.find(b => b.id === band) || PRICE_BANDS[0];
    items = items.filter(p => p.price >= priceBand.min && p.price <= priceBand.max);
    if (saleOnly) items = items.filter(p => Number(p.compareAtPrice) > Number(p.price));
    const sorted = [...items];
    if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    if (sort === 'newest') sorted.sort((a, b) => (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0));
    return sorted;
  }, [products, activeCollection, band, saleOnly, sort, showCategoryFilter]);

  const toggleWish = (id: string) => {
    if (!customer && onNeedLogin) {
      onNeedLogin();
      return;
    }
    onToggleWishlist(id);
  };

  const filterPanel = (
    <div className="space-y-8">
      {showCategoryFilter && collections.length > 0 && (
        <div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-stone">Category</p>
          <ul className="space-y-2">
            <li>
              <button type="button" onClick={() => onActiveCollectionChange?.('')} className={`text-sm cursor-pointer ${!activeCollection ? 'text-clay' : 'text-ink hover:text-clay'}`}>
                All
              </button>
            </li>
            {collections.map(c => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onActiveCollectionChange?.(c.id)}
                  className={`text-left text-sm cursor-pointer ${activeCollection?.id === c.id ? 'text-clay' : 'text-ink hover:text-clay'}`}
                >
                  {c.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-stone">Price</p>
        <ul className="space-y-2">
          {PRICE_BANDS.map(b => (
            <li key={b.id}>
              <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                <input type="radio" name="price-band" checked={band === b.id} onChange={() => setBand(b.id)} className="accent-[#a65f4b]" />
                {b.label}
              </label>
            </li>
          ))}
        </ul>
      </div>
      <label className="flex items-center gap-2.5 text-sm cursor-pointer">
        <input type="checkbox" checked={saleOnly} onChange={e => setSaleOnly(e.target.checked)} className="accent-[#a65f4b]" />
        On sale only
      </label>
    </div>
  );

  return (
    <div className="store">
      <div className="border-b border-line bg-sand">
        <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl sm:text-5xl">{activeCollection && showCategoryFilter ? activeCollection.title : title}</h1>
          {(description || activeCollection?.description) && (
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-stone">{(activeCollection && showCategoryFilter ? activeCollection.description : description) || description}</p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4 border-b border-line pb-4">
          <button type="button" onClick={() => setFiltersOpen(true)} className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] lg:hidden cursor-pointer">
            <SlidersHorizontal className="h-4 w-4" /> Filter
          </button>
          <p className="hidden text-sm text-stone lg:block">{list.length} {list.length === 1 ? 'product' : 'products'}</p>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-stone">Sort</span>
            <select value={sort} onChange={e => setSort(e.target.value as Sort)} className="border-0 bg-transparent text-sm outline-none cursor-pointer">
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[200px_1fr]">
          <aside className="hidden lg:block">{filterPanel}</aside>
          <div>
            {list.length === 0 ? (
              <div className="border border-dashed border-line py-20 text-center">
                <p className="font-display text-2xl">Nothing here yet</p>
                <p className="mt-2 text-sm text-stone">Try another category or price range.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6">
                {list.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    customer={customer}
                    onOpen={openProductPage}
                    onAddToCart={onAddToCart}
                    onToggleWishlist={toggleWish}
                    priority={i < 6}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" className="absolute inset-0 bg-ink/40 cursor-default" aria-label="Close filters" onClick={() => setFiltersOpen(false)} />
          <div className="store absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-cream">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="text-[11px] uppercase tracking-[0.22em]">Filters</span>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{filterPanel}</div>
            <div className="border-t border-line p-5">
              <button type="button" onClick={() => setFiltersOpen(false)} className="w-full bg-ink py-3.5 text-[11px] uppercase tracking-[0.22em] text-white cursor-pointer">
                Show {list.length} {list.length === 1 ? 'product' : 'products'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

