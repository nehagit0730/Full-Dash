import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Heart, Minus, Plus, RefreshCw, ShieldCheck, Truck } from 'lucide-react';
import { Customer, Product, VariantDetail } from '../types';
import { formatPrice, ProductCard, productImages, SectionHeading, visibleProducts } from './storefront/storeKit';

interface ProductDetailViewProps {
  product: Product;
  allProducts?: Product[];
  loggedInCustomer?: Customer | null;
  onAddToCart: (product: Product, qty: number) => void;
  onToggleWishlist: (productId: string) => void;
  onNavigate: (tab: string, arg?: string) => void;
}

function initialVariant(product: Product): VariantDetail | null {
  const variants = product.concreteVariants || [];
  if (!variants.length) return null;
  try {
    const wanted = new URLSearchParams(window.location.search).get('variant');
    return variants.find(v => v.id === wanted) || null;
  } catch {
    return null;
  }
}

export default function ProductDetailView({ product, allProducts = [], loggedInCustomer = null, onAddToCart, onToggleWishlist, onNavigate }: ProductDetailViewProps) {
  const variants = product.concreteVariants || [];
  const [variant, setVariant] = useState<VariantDetail | null>(() => initialVariant(product));
  const [qty, setQty] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [needSize, setNeedSize] = useState(false);
  const [added, setAdded] = useState(false);
  const [openPanel, setOpenPanel] = useState<string | null>('details');

  useEffect(() => {
    setVariant(initialVariant(product));
    setQty(1);
    setImageIndex(0);
    window.scrollTo({ top: 0 });
  }, [product.id]);

  // Keep the selected option in the URL so the page can be shared or reloaded.
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (variant) url.searchParams.set('variant', variant.id);
      else url.searchParams.delete('variant');
      window.history.replaceState({}, '', url.pathname + url.search);
    } catch {
      /* sandboxed frame */
    }
  }, [variant]);

  const images = useMemo(() => {
    const own = variant?.images?.filter(Boolean) || [];
    return Array.from(new Set([...own, ...productImages(product)]));
  }, [product, variant]);

  const price = variant && variant.price > 0 ? variant.price : product.price;
  const onSale = Number(product.compareAtPrice) > price;
  const wished = Boolean(loggedInCustomer?.wishlist?.includes(product.id));
  const optionLabel = /^(xxs|xs|s|m|l|xl|xxl|free size|\d{1,2})\b/i.test(variants[0]?.name || '') ? 'Size' : 'Option';

  const related = useMemo(() => {
    const pool = visibleProducts(allProducts).filter(p => p.id !== product.id);
    const same = pool.filter(p => p.category && p.category === product.category);
    return [...same, ...pool.filter(p => !same.includes(p))].slice(0, 4);
  }, [allProducts, product]);

  const addToBag = () => {
    if (variants.length && !variant) {
      setNeedSize(true);
      return;
    }
    // A variant goes in the cart under its own id; the server prices it from
    // that id, so the cart line and the charge always agree.
    const line: Product = variant
      ? { ...product, id: variant.id, title: `${product.title} - ${variant.name}`, price, image: images[0] || product.image }
      : product;
    onAddToCart(line, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const panel = (id: string, title: string, body: React.ReactNode) => (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={() => setOpenPanel(openPanel === id ? null : id)}
        className="flex w-full items-center justify-between py-4 text-left text-[12px] uppercase tracking-[0.18em] cursor-pointer"
        aria-expanded={openPanel === id}
      >
        {title}
        <ChevronDown className={`h-4 w-4 transition ${openPanel === id ? 'rotate-180' : ''}`} />
      </button>
      {openPanel === id && <div className="pb-5 text-sm leading-relaxed text-stone">{body}</div>}
    </div>
  );

  // Admin-authored HTML from the product editor, rendered as the old page did.
  const description = variant?.description || product.description;

  return (
    <div className="store">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <nav className="mb-6 text-[11px] uppercase tracking-[0.16em] text-stone" aria-label="Breadcrumb">
          <button type="button" onClick={() => onNavigate('frontend-home')} className="hover:text-ink cursor-pointer">Home</button>
          <span className="mx-2">/</span>
          <button type="button" onClick={() => onNavigate('frontend-shop')} className="hover:text-ink cursor-pointer">Shop</button>
          <span className="mx-2">/</span>
          <span className="text-ink">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Gallery */}
          <div className="lg:col-span-7">
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              {images.length > 1 && (
                <div className="store-scrollbar-none flex gap-3 overflow-x-auto sm:w-20 sm:flex-col sm:overflow-visible">
                  {images.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setImageIndex(i)}
                      aria-label={`Show image ${i + 1}`}
                      className={`aspect-[3/4] w-16 shrink-0 overflow-hidden bg-sand sm:w-full cursor-pointer ${imageIndex === i ? 'ring-1 ring-ink' : 'opacity-70 hover:opacity-100'}`}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <div className="relative aspect-[3/4] flex-1 overflow-hidden bg-sand">
                {images[imageIndex] && <img src={images[imageIndex]} alt={product.title} className="h-full w-full object-cover" />}
                {onSale && <span className="absolute left-4 top-4 bg-clay px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-white">Sale</span>}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="lg:sticky lg:top-36 lg:col-span-5 lg:self-start">
            {product.vendor && <p className="text-[11px] uppercase tracking-[0.25em] text-stone">{product.vendor}</p>}
            <h1 className="font-display mt-2 text-4xl leading-tight">{product.title}</h1>
            <p className="mt-4 flex items-baseline gap-3 text-xl">
              <span className={onSale ? 'text-clay' : ''}>{formatPrice(price)}</span>
              {onSale && <span className="text-base text-stone line-through">{formatPrice(product.compareAtPrice)}</span>}
            </p>
            <p className="mt-1 text-xs text-stone">Inclusive of all taxes</p>

            {variants.length > 0 && (
              <div className="mt-8">
                <p className="mb-3 text-[11px] uppercase tracking-[0.2em]">
                  {optionLabel}
                  {variant ? `: ${variant.name}` : ''}
                </p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={optionLabel}>
                  {variants.map(v => {
                    const unavailable = typeof v.inventory === 'number' && v.inventory <= 0;
                    const selected = variant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={unavailable}
                        onClick={() => {
                          setVariant(v);
                          setNeedSize(false);
                          setImageIndex(0);
                        }}
                        className={`min-w-12 border px-4 py-2.5 text-sm transition cursor-pointer disabled:cursor-not-allowed disabled:text-stone/50 disabled:line-through ${
                          selected ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink'
                        }`}
                      >
                        {v.name}
                      </button>
                    );
                  })}
                </div>
                {needSize && <p className="mt-2 text-xs text-clay" role="alert">Please choose a {optionLabel.toLowerCase()}.</p>}
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <div className="flex items-center border border-line">
                <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-3 cursor-pointer" aria-label="Decrease quantity">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm" aria-live="polite">{qty}</span>
                <button type="button" onClick={() => setQty(q => Math.min(10, q + 1))} className="px-3 py-3 cursor-pointer" aria-label="Increase quantity">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button type="button" onClick={addToBag} className="flex-1 bg-ink py-3.5 text-[11px] uppercase tracking-[0.22em] text-white transition hover:bg-clay cursor-pointer">
                {added ? 'Added to bag' : 'Add to bag'}
              </button>
              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                aria-pressed={wished}
                title={loggedInCustomer ? undefined : 'Sign in to save items'}
                className="flex w-12 items-center justify-center border border-line hover:border-ink cursor-pointer"
              >
                <Heart className={`h-5 w-5 ${wished ? 'fill-clay text-clay' : ''}`} />
              </button>
            </div>

            <ul className="mt-8 space-y-3 text-sm text-stone">
              <li className="flex items-center gap-3"><Truck className="h-4 w-4 text-clay" /> Free delivery on orders above ₹1,999</li>
              <li className="flex items-center gap-3"><RefreshCw className="h-4 w-4 text-clay" /> Easy 7-day returns on unworn items</li>
              <li className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-clay" /> Secure checkout — UPI, cards &amp; netbanking</li>
            </ul>

            <div className="mt-8 border-t border-line">
              {panel(
                'details',
                'Description',
                description ? <div className="[&_p]:mb-3" dangerouslySetInnerHTML={{ __html: description }} /> : <p>Details coming soon.</p>
              )}
              {panel('delivery', 'Delivery & returns', (
                <>
                  <p>Orders are dispatched within 1–2 working days and delivered in 3–7 working days across India. A tracking number is emailed when your order ships.</p>
                  <p className="mt-3">Return unworn items with tags attached within 7 days of delivery.</p>
                </>
              ))}
              {panel('care', 'Care', <p>Follow the care label on the garment. A gentle cold wash and drying in shade keeps colours rich.</p>)}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-24">
            <SectionHeading eyebrow="Complete the look" title="You may also like" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
              {related.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  customer={loggedInCustomer}
                  onOpen={rp => onNavigate('product-detail', rp.slug || rp.id)}
                  onAddToCart={onAddToCart}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
