import React from 'react';
import { ArrowRight } from 'lucide-react';
import { cleanMediaUrl, PLACEHOLDER_IMAGE } from '../../utils/mediaUtils';
import { PageSection, Product, Collection, Customer, BlogPost } from '../../types';

/**
 * Shared building blocks for the storefront sections: one typographic scale,
 * one button style and one image strategy, so every section reads as part of
 * the same fashion-brand theme.
 *
 *  - headings  : Cormorant Garamond (font-display), large and light
 *  - body      : Jost (font-body)
 *  - palette   : cream / sand / blush / clay / ink / stone (see index.css @theme)
 *
 * Class hooks (section-title, section-desc, subheading, section-btn, card-*,
 * overlay-*) are what the page builder's colour and typography settings target.
 */

export interface SectionContext {
  allProducts: Product[];
  allCollections: Collection[];
  allBlogs: BlogPost[];
  loggedInCustomer: Customer | null;
  onAddToCart: (product: Product, qty: number) => void;
  onToggleWishlist: (productId: string) => void;
  onNavigate: (tab: string, arg?: string) => void;
  /** Follows any link value a merchant can enter (/shop, /collections/x, https://…). */
  go: (link?: string) => void;
  /** True inside the page builder preview. */
  editor: boolean;
}

export interface SectionProps {
  sec: PageSection;
  ctx: SectionContext;
}

// ── Placeholder imagery ─────────────────────────────────────────────────────
// Verified Unsplash fashion photographs, used whenever a section has no image
// of its own (including the old grey placeholder saved in earlier pages).
const FASHION_PHOTOS = [
  '1483985988355-763728e1935b', // shopper with bags
  '1490481651871-ab68de25d43d', // clothing rail
  '1445205170230-053b83016050', // boutique interior
  '1469334031218-e382a71b716b', // street style
  '1595777457583-95e059d581b8', // editorial dress
  '1515886657613-9f3515b0c78f', // co-ord set
  '1434389677669-e08b4cac3105', // knit top
  '1539109136881-3be0616acf4b', // outerwear
  '1496747611176-843222e1e57c', // summer dress
  '1485968579580-b6d095142e6e', // denim jacket
  '1525507119028-ed4c629a60a3', // studio portrait
  '1572804013309-59a88b7e92f1', // dress
  '1594633312681-425c7b97ccd1', // trousers
  '1543163521-1bf539c55dd2', // shoes
  '1585487000160-6ebcfceb0d03', // midi dress
  '1612336307429-8a898d10e223' // accessories
];

export function placeholderImage(index: number, width = 1200, height?: number): string {
  const id = FASHION_PHOTOS[((index % FASHION_PHOTOS.length) + FASHION_PHOTOS.length) % FASHION_PHOTOS.length];
  const h = height ? `&h=${height}` : '';
  return `https://images.unsplash.com/photo-${id}?w=${width}${h}&q=75&auto=format&fit=crop`;
}

/** The merchant's image, or a fashion placeholder when it is empty. */
export function imageOr(url: unknown, index: number, width = 1200, height?: number): string {
  const raw = typeof url === 'string' ? url.trim() : '';
  if (!raw || raw === PLACEHOLDER_IMAGE || raw.startsWith('data:image/svg+xml')) return placeholderImage(index, width, height);
  return cleanMediaUrl(raw) || placeholderImage(index, width, height);
}

/** A stable number per section so neighbouring sections get different placeholders. */
export function seedOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 97;
}

/** Plain list of image URLs from a setting, blanks and the old placeholder dropped. */
export function imageList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === 'string' && v.trim() !== '' && v !== PLACEHOLDER_IMAGE)
    : [];
}

// ── Typography & buttons ────────────────────────────────────────────────────

export function Eyebrow({ children, light, className = '' }: { children: React.ReactNode; light?: boolean; className?: string }) {
  return (
    <span className={`subheading accent-text block text-[11px] font-medium uppercase tracking-[0.3em] ${light ? 'text-white/80' : 'text-clay'} ${className}`}>
      {children}
    </span>
  );
}

export function SectionHeader({
  eyebrow, title, description, align = 'center', action, light
}: {
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  align?: 'center' | 'left';
  action?: React.ReactNode;
  light?: boolean;
}) {
  if (!eyebrow && !title && !description && !action) return null;
  const centered = align === 'center';
  return (
    <div className={`flex flex-col gap-6 ${centered ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between'} mb-12 md:mb-16`}>
      <div className={`${centered ? 'max-w-2xl' : 'max-w-2xl'} space-y-4`}>
        {eyebrow && <Eyebrow light={light}>{eyebrow}</Eyebrow>}
        {title && (
          <h2 className={`section-title font-display text-4xl md:text-5xl lg:text-[3.4rem] font-normal leading-[1.05] ${light ? 'overlay-heading text-white' : 'text-ink'}`}>
            {title}
          </h2>
        )}
        {description && (
          <p className={`section-desc text-[15px] leading-relaxed ${light ? 'overlay-text text-white/85' : 'text-stone'} ${centered ? 'mx-auto' : ''} max-w-xl`}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

type BtnVariant = 'solid' | 'outline' | 'light' | 'ghost-light' | 'link';

export function Btn({ children, onClick, variant = 'solid', className = '' }: {
  children: React.ReactNode; onClick?: () => void; variant?: BtnVariant; className?: string;
}) {
  const base = 'section-btn inline-flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] transition-colors duration-300 cursor-pointer';
  const styles: Record<BtnVariant, string> = {
    solid: 'bg-ink text-white px-8 py-4 hover:bg-clay',
    outline: 'border border-ink text-ink px-8 py-4 hover:bg-ink hover:text-white',
    light: 'bg-white text-ink px-8 py-4 hover:bg-cream',
    'ghost-light': 'border border-white/70 text-white px-8 py-4 hover:bg-white hover:text-ink',
    link: 'text-ink border-b border-ink/40 pb-1 hover:border-ink'
  };
  return (
    <button type="button" onClick={onClick} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function TextLink({ children, onClick, light }: { children: React.ReactNode; onClick?: () => void; light?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] ${light ? 'text-white' : 'text-ink'} cursor-pointer`}
    >
      <span className={`border-b pb-0.5 ${light ? 'border-white/50 group-hover:border-white' : 'border-ink/30 group-hover:border-ink'} transition-colors`}>{children}</span>
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
    </button>
  );
}

/** Vertical rhythm for a standard (non full-bleed) section. */
export const SECTION_Y = 'py-16 md:py-24';

/** Shown only in the page builder when a data-driven section has nothing to show. */
export function EditorHint({ ctx, children }: { ctx: SectionContext; children: React.ReactNode }) {
  if (!ctx.editor) return null;
  return (
    <p className="mt-6 border border-dashed border-line bg-cream/60 px-4 py-3 text-center text-xs text-stone">{children}</p>
  );
}

/** Fictional brand wordmarks for logo/brand sections that have no logos yet. */
export const SAMPLE_BRANDS = [
  { name: 'Maison Lune', style: 'font-display italic text-2xl tracking-wide' },
  { name: 'NORTHWEAR', style: 'font-body text-sm font-semibold tracking-[0.35em]' },
  { name: 'Atelier Noir', style: 'font-display text-2xl tracking-[0.08em] uppercase' },
  { name: 'oak & linen', style: 'font-body text-lg font-light tracking-[0.15em] lowercase' },
  { name: 'SOLSTICE', style: 'font-display text-xl tracking-[0.4em]' },
  { name: 'Verdant Co.', style: 'font-body text-base font-medium tracking-[0.2em] uppercase' }
];
