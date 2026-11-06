import React, { useState } from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product, Customer, LayoutSettings } from '../../types';

/**
 * Shared pieces of the storefront theme: the store name, image helpers, price
 * formatting and the product card used by every product list.
 */

export const STORE_DEFAULT_NAME = 'Ecommerce Store';

/** The store name an admin set in Header & Footer settings, or the generic default. */
export function storeName(layout?: Partial<LayoutSettings> | null): string {
  const raw = String(layout?.headerLogoText || '').trim();
  return raw && !/pouch\s*supply/i.test(raw) ? raw : STORE_DEFAULT_NAME;
}

/**
 * A free Unsplash photo (Unsplash License: free for commercial use, no
 * attribution required). Used for theme imagery and demo products until the
 * store uploads its own.
 */
export function unsplash(id: string, width = 900, height?: number): string {
  const h = height ? `&h=${height}` : '';
  return `https://images.unsplash.com/photo-${id}?w=${width}${h}&q=75&auto=format&fit=crop`;
}

/** Theme imagery, all verified Unsplash photos. */
export const THEME_IMAGES = {
  hero: '1483985988355-763728e1935b',
  heroAlt: '1469334031218-e382a71b716b',
  boutique: '1445205170230-053b83016050',
  rack: '1490481651871-ab68de25d43d',
  editorial: '1595777457583-95e059d581b8',
  ethnic: '1610030469983-98e550d6193c',
  dresses: '1572804013309-59a88b7e92f1',
  tops: '1434389677669-e08b4cac3105',
  bottoms: '1594633312681-425c7b97ccd1',
  outerwear: '1539109136881-3be0616acf4b',
  accessories: '1584917865442-de89df76afd3',
  footwear: '1543163521-1bf539c55dd2',
  coords: '1515886657613-9f3515b0c78f'
} as const;

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2, minimumFractionDigits: 0 });
export const formatPrice = (n: number) => inr.format(Number(n) || 0);

export function productImages(p: Product): string[] {
  const list = [p.image, ...(Array.isArray(p.media) ? p.media : [])].filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
  return Array.from(new Set(list));
}

/** Sellable products only: not draft/archived/unlisted, and not individual variant cards. */
export function visibleProducts(products: Product[]): Product[] {
  return (products || []).filter(p => p && (!p.status || p.status === 'Active') && !p.isVariantCard);
}

/** Products that need a size/option picked before they can go in the cart. */
export const needsOptionChoice = (p: Product) => Array.isArray(p.concreteVariants) && p.concreteVariants.length > 0;

export function ProductCard({
  product,
  customer,
  onOpen,
  onAddToCart,
  onToggleWishlist,
  priority = false
}: {
  product: Product;
  customer: Customer | null;
  onOpen: (p: Product) => void;
  onAddToCart: (p: Product, qty: number) => void;
  onToggleWishlist: (id: string) => void;
  priority?: boolean;
}) {
  const images = productImages(product);
  const [hover, setHover] = useState(false);
  const [added, setAdded] = useState(false);
  const wished = Boolean(customer?.wishlist?.includes(product.id));
  const onSale = Number(product.compareAtPrice) > Number(product.price);

  return (
    <article
      className="group relative flex flex-col"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-sand">
        <button
          type="button"
          onClick={() => onOpen(product)}
          className="absolute inset-0 block cursor-pointer"
          aria-label={`View ${product.title}`}
        >
          {images[0] ? (
            <>
              <img
                src={images[0]}
                alt={product.title}
                loading={priority ? 'eager' : 'lazy'}
                className={`h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.03] ${images[1] && hover ? 'opacity-0' : 'opacity-100'}`}
              />
              {images[1] && (
                <img
                  src={images[1]}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${hover ? 'opacity-100' : 'opacity-0'}`}
                />
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-stone text-sm">No image</div>
          )}
        </button>

        {onSale && (
          <span className="absolute left-3 top-3 bg-clay px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-white">
            Sale
          </span>
        )}

        <button
          type="button"
          onClick={() => onToggleWishlist(product.id)}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wished}
          title={customer ? undefined : 'Sign in to save items'}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition hover:bg-white cursor-pointer"
        >
          <Heart className={`h-4 w-4 ${wished ? 'fill-clay text-clay' : ''}`} />
        </button>

        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100">
          <button
            type="button"
            onClick={() => {
              if (needsOptionChoice(product)) {
                onOpen(product);
                return;
              }
              onAddToCart(product, 1);
              setAdded(true);
              setTimeout(() => setAdded(false), 1400);
            }}
            className="flex w-full items-center justify-center gap-2 bg-white/95 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink shadow-sm transition hover:bg-ink hover:text-white cursor-pointer disabled:opacity-50"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {needsOptionChoice(product) ? 'Choose size' : added ? 'Added' : 'Add to bag'}
          </button>
        </div>
      </div>

      <button type="button" onClick={() => onOpen(product)} className="mt-3 text-left cursor-pointer">
        {product.vendor && <p className="text-[10px] uppercase tracking-[0.2em] text-stone">{product.vendor}</p>}
        <h3 className="mt-1 text-sm leading-snug text-ink line-clamp-2">{product.title}</h3>
        <p className="mt-1.5 flex items-baseline gap-2 text-sm">
          <span className={onSale ? 'text-clay font-medium' : 'text-ink'}>{formatPrice(product.price)}</span>
          {onSale && <span className="text-xs text-stone line-through">{formatPrice(product.compareAtPrice)}</span>}
        </p>
      </button>
    </article>
  );
}

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-[11px] uppercase tracking-[0.25em] text-clay">{eyebrow}</p>}
        <h2 className="font-display mt-2 text-3xl leading-tight text-ink sm:text-4xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}
