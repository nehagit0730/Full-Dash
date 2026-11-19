import React, { useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Award, BadgeCheck, Clock, Gem, Globe2, Heart, HelpCircle, Leaf, Minus, Package,
  Plus, RotateCcw, Scissors, ShieldCheck, Sparkles, Star, Tag, Truck, Zap
} from 'lucide-react';
import {
  Btn, EditorHint, Eyebrow, SAMPLE_BRANDS, SECTION_Y, SectionHeader, SectionProps, TextLink, imageList, imageOr, placeholderImage, seedOf
} from './sectionKit';

// ── Multicolumn (Text column with image) ────────────────────────────────────

const DEFAULT_COLUMNS = [
  { title: 'Considered fabrics', description: 'Organic cotton, linen and recycled fibres — chosen for how they feel and how long they last.', badge: 'Materials' },
  { title: 'Made in small batches', description: 'We produce in limited runs with workshops we know by name, so nothing goes to waste.', badge: 'Craft' },
  { title: 'Delivered with care', description: 'Plastic-free packaging, tracked shipping and easy 14-day returns on every order.', badge: 'Service' }
];

export function MulticolumnSection({ sec, ctx }: SectionProps) {
  const s: any = sec.settings;
  const seed = seedOf(sec.id);
  const cols: any[] = Array.isArray(s.columnItems) && s.columnItems.length ? s.columnItems : DEFAULT_COLUMNS;
  const grid = cols.length >= 4 ? 'md:grid-cols-2 lg:grid-cols-4' : cols.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3';

  return (
    <div className={SECTION_Y}>
      <SectionHeader
        eyebrow={s.badgeText || 'Why choose us'}
        title={s.title || 'The details make the difference'}
        description={s.description || undefined}
      />
      <div className={`grid grid-cols-1 gap-10 md:gap-8 ${grid}`}>
        {cols.map((c, i) => (
          <article
            key={i}
            onClick={c.linkUrl ? () => ctx.go(c.linkUrl) : undefined}
            className={`card-bg group ${c.linkUrl ? 'cursor-pointer' : ''}`}
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-sand">
              <img src={imageOr(c.imageUrl, seed + i * 2 + 5, 900, 1125)} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.04]" />
              {c.badge && (
                <span className="badge-bg badge-text absolute left-4 top-4 bg-white/90 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-ink backdrop-blur">
                  {c.badge}
                </span>
              )}
            </div>
            <div className="pt-6 space-y-3">
              <span className="accent-text font-display text-xl italic text-clay">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="card-title font-display text-2xl md:text-[1.7rem] font-normal leading-tight text-ink">{c.title}</h3>
              {c.description && <p className="card-desc text-[14px] leading-relaxed text-stone">{c.description}</p>}
              {c.linkUrl && <TextLink onClick={() => ctx.go(c.linkUrl)}>Discover</TextLink>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

// ── Image gallery ───────────────────────────────────────────────────────────

export function GallerySection({ sec }: SectionProps) {
  const s: any = sec.settings;
  const seed = seedOf(sec.id);
  const own = imageList(s.galleryImages);
  const images = own.length ? own.map(u => imageOr(u, 0, 1200)) : Array.from({ length: 6 }, (_, i) => placeholderImage(seed + i * 2 + 1, 1000));

  // Editorial layout: a tall feature image, then a staggered grid.
  return (
    <div className={SECTION_Y}>
      <SectionHeader
        eyebrow={s.badgeText || 'Lookbook'}
        title={s.title || 'Styled in the everyday'}
        description={s.description || 'Moments from our latest shoot — see how the collection wears.'}
      />
      <div className="columns-2 gap-3 md:columns-3 md:gap-5 [&>*]:mb-3 md:[&>*]:mb-5">
        {images.map((src, i) => (
          <figure key={i} className="group relative break-inside-avoid overflow-hidden bg-sand">
            <img
              src={src}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className={`w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.04] ${
                i % 3 === 0 ? 'aspect-[3/4]' : i % 3 === 1 ? 'aspect-square' : 'aspect-[4/5]'
              }`}
            />
            <div className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/10" />
          </figure>
        ))}
      </div>
    </div>
  );
}

// ── Logo list ───────────────────────────────────────────────────────────────

function Wordmark({ name, style }: { name: string; style: string }) {
  return <span className={`whitespace-nowrap text-ink/70 transition-colors hover:text-ink ${style}`}>{name}</span>;
}

export function LogoListSection({ sec }: SectionProps) {
  const s: any = sec.settings;
  const logos = imageList(s.logoImages);
  return (
    <div className="py-14 md:py-20">
      <div className="mb-10 text-center space-y-3">
        <Eyebrow>{s.badgeText || 'As seen in'}</Eyebrow>
        {(s.title || !logos.length) && (
          <h2 className="section-title font-display text-2xl md:text-3xl font-normal text-ink">{s.title || 'Loved by the press'}</h2>
        )}
        {s.description && <p className="section-desc mx-auto max-w-lg text-sm text-stone">{s.description}</p>}
      </div>
      <div className="custom-border grid grid-cols-2 items-center justify-items-center gap-x-6 gap-y-10 border-y border-line py-10 sm:grid-cols-3 lg:grid-cols-6">
        {logos.length
          ? logos.map((src, i) => (
              <img key={i} src={imageOr(src, 0, 400)} alt="" loading="lazy" referrerPolicy="no-referrer"
                className="h-9 md:h-11 w-auto max-w-[150px] object-contain opacity-60 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0" />
            ))
          : SAMPLE_BRANDS.map(b => <Wordmark key={b.name} name={b.name} style={b.style} />)}
      </div>
    </div>
  );
}

// ── Brand list (grid or masonry) ────────────────────────────────────────────

function brandItemsOf(s: any): { title: string; imageUrl: string; linkUrl: string }[] {
  const items = (Array.isArray(s.brandItems) ? s.brandItems : []).filter((b: any) => b && (b.title || (b.imageUrl && !String(b.imageUrl).startsWith('data:'))));
  // Names left over from older demo content are not shown as real brands.
  const LEGACY = /^(77|clew|cuba|maggie|nordic spirit|xqs|zyn|pablo|killa|fumi|velo|white fox|sn[uü])$/i;
  const clean = items.filter((b: any) => !LEGACY.test(String(b.title || '').trim()));
  return clean.length ? clean : SAMPLE_BRANDS.map(b => ({ title: b.name, imageUrl: '', linkUrl: '/shop' }));
}

export function BrandListSection({ sec, ctx }: SectionProps) {
  const s: any = sec.settings;
  const seed = seedOf(sec.id);
  const items = brandItemsOf(s);
  const masonry = s.layout === 'masonry';

  const card = (b: { title: string; imageUrl: string; linkUrl: string }, i: number, aspect: string) => (
    <button
      key={`${b.title}-${i}`}
      type="button"
      onClick={() => ctx.go(b.linkUrl || '/shop')}
      className={`group relative block w-full overflow-hidden bg-sand text-left ${masonry ? 'mb-3 md:mb-5 break-inside-avoid' : ''}`}
    >
      <div className={`${aspect} w-full overflow-hidden`}>
        <img src={imageOr(b.imageUrl, seed + i * 3 + 2, 900)} alt={b.title} loading="lazy" referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.05]" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 transition-colors duration-500 group-hover:from-black/70" />
      <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
        <h3 className="overlay-heading brand-card-title font-display text-2xl md:text-3xl font-normal text-white">{b.title}</h3>
        <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-white/80 transition-colors group-hover:text-white">
          Shop the brand <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </button>
  );

  return (
    <div className={SECTION_Y}>
      <SectionHeader eyebrow={s.badgeText || 'Our brands'} title={s.title || 'Shop by brand'} description={s.description || undefined} />
      {masonry ? (
        <div className="columns-2 gap-3 md:columns-3 md:gap-5">
          {items.map((b, i) => card(b, i, i % 3 === 0 ? 'aspect-[3/4]' : i % 3 === 1 ? 'aspect-square' : 'aspect-[4/5]'))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3">
          {items.map((b, i) => card(b, i, 'aspect-[4/5]'))}
        </div>
      )}
    </div>
  );
}

// ── Brand carousel (Brands we offer) ────────────────────────────────────────

export function BrandCarouselSection({ sec, ctx }: SectionProps) {
  const s: any = sec.settings;
  const seed = seedOf(sec.id);
  const items = brandItemsOf(s);
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => track.current?.scrollBy({ left: dir * (track.current.clientWidth * 0.8), behavior: 'smooth' });

  return (
    <div className={SECTION_Y}>
      <div className="mb-10 flex items-end justify-between gap-6 md:mb-14">
        <div className="max-w-xl space-y-4">
          <Eyebrow>{s.badgeText || 'The labels we love'}</Eyebrow>
          <h2 className="section-title font-display text-4xl md:text-5xl font-normal leading-[1.05] text-ink">{s.title || 'Brands we carry'}</h2>
          <p className="section-desc text-[15px] leading-relaxed text-stone">
            {s.description || 'Independent labels and modern classics, hand-picked for quality and timeless design.'}
          </p>
        </div>
        <div className="hidden shrink-0 gap-2 sm:flex">
          <button type="button" aria-label="Previous" onClick={() => scroll(-1)} className="flex h-11 w-11 items-center justify-center border border-ink/20 text-ink transition hover:border-ink hover:bg-ink hover:text-white"><ArrowLeft className="h-4 w-4" /></button>
          <button type="button" aria-label="Next" onClick={() => scroll(1)} className="flex h-11 w-11 items-center justify-center border border-ink/20 text-ink transition hover:border-ink hover:bg-ink hover:text-white"><ArrowRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div ref={track} className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 store-scrollbar-none md:gap-6">
        {items.map((b, i) => {
          const hasImage = !!(b.imageUrl && !String(b.imageUrl).startsWith('data:'));
          const mark = SAMPLE_BRANDS[i % SAMPLE_BRANDS.length];
          return (
            <button
              key={`${b.title}-${i}`}
              type="button"
              onClick={() => ctx.go(b.linkUrl || '/shop')}
              className="group w-[62%] shrink-0 snap-start text-left sm:w-[38%] lg:w-[23%]"
            >
              <div className="card-bg relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-cream">
                {hasImage ? (
                  <img src={imageOr(b.imageUrl, seed + i, 800)} alt={b.title} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.05]" />
                ) : (
                  <>
                    <img src={placeholderImage(seed + i * 2 + 3, 800)} alt="" loading="lazy" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-[1200ms] group-hover:scale-[1.05]" />
                    <div className="absolute inset-0 bg-ink/35 transition-colors duration-500 group-hover:bg-ink/45" />
                    <span className={`relative ${mark.style} !text-white`}>{b.title}</span>
                  </>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="card-title text-[12px] uppercase tracking-[0.2em] text-ink">{b.title}</span>
                <ArrowRight className="h-3.5 w-3.5 text-stone transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Our process (formerly "How it works") ───────────────────────────────────

const DEFAULT_STEPS = [
  { title: 'Designed in-house', description: 'Every piece begins as a sketch in our studio, refined through fittings until it feels just right.' },
  { title: 'Crafted with care', description: 'Small, trusted workshops cut and sew each garment in limited runs — never mass-produced.' },
  { title: 'Delivered to you', description: 'Packed by hand in plastic-free packaging and shipped with tracking straight to your door.' }
];

export function ProcessSection({ sec, ctx }: SectionProps) {
  const s: any = sec.settings;
  const seed = seedOf(sec.id);
  const steps: any[] = Array.isArray(s.stepItems) && s.stepItems.length ? s.stepItems : DEFAULT_STEPS;

  return (
    <div className={SECTION_Y}>
      <SectionHeader
        eyebrow={s.badgeText || 'Our process'}
        title={s.title || 'From sketch to your wardrobe'}
        description={s.description || undefined}
      />
      <ol className={`relative grid grid-cols-1 gap-14 md:gap-10 ${steps.length >= 4 ? 'md:grid-cols-4' : steps.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        {steps.map((st, i) => (
          <li
            key={i}
            onClick={st.linkUrl ? () => ctx.go(st.linkUrl) : undefined}
            className={`group relative ${st.linkUrl ? 'cursor-pointer' : ''}`}
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-sand">
              <img src={imageOr(st.imageUrl, seed + i * 3 + 7, 900, 1125)} alt="" loading="lazy" referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.04]" />
              <span className="accent-text absolute left-5 top-4 font-display text-6xl md:text-7xl font-light italic leading-none text-white drop-shadow-sm">
                {String(st.number || i + 1).padStart(2, '0')}
              </span>
            </div>
            <div className="mt-6 flex items-start gap-4">
              <span className="mt-3 h-px w-8 shrink-0 bg-clay" aria-hidden />
              <div className="space-y-2">
                <h3 className="card-title font-display text-2xl font-normal text-ink">{st.title}</h3>
                {st.description && <p className="card-desc text-[14px] leading-relaxed text-stone">{st.description}</p>}
              </div>
            </div>
          </li>
        ))}
      </ol>
      {(s.buttonText ?? 'Discover our story') && (
        <div className="mt-14 text-center">
          <Btn variant="outline" onClick={() => ctx.go(s.buttonLink || '/pages/about')}>{s.buttonText || 'Discover our story'}</Btn>
        </div>
      )}
    </div>
  );
}

// ── Icon with text ──────────────────────────────────────────────────────────

const ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Truck, Zap, Shield: ShieldCheck, Clock, Award, Package, Heart, HelpCircle, Star,
  Leaf, Gem, Scissors, RotateCcw, Sparkles, Tag, Globe: Globe2, Badge: BadgeCheck
};

const DEFAULT_ICON_ITEMS = [
  { iconName: 'Truck', title: 'Free shipping', description: 'Complimentary delivery on orders over ₹1,999.' },
  { iconName: 'RotateCcw', title: 'Easy returns', description: 'Changed your mind? Return within 14 days.' },
  { iconName: 'Shield', title: 'Secure payment', description: 'Cards, UPI and wallets — fully encrypted.' },
  { iconName: 'Leaf', title: 'Responsibly made', description: 'Natural fibres and low-impact packaging.' }
];

export function IconWithTextSection({ sec, ctx }: SectionProps) {
  const s: any = sec.settings;
  const items: any[] = Array.isArray(s.iconItems) && s.iconItems.length ? s.iconItems : DEFAULT_ICON_ITEMS;
  const color = s.iconColor || undefined;
  return (
    <div className="py-14 md:py-20">
      {(s.title || s.description) && (
        <SectionHeader eyebrow={s.badgeText || undefined} title={s.title} description={s.description || undefined} />
      )}
      <div className={`grid grid-cols-2 gap-y-10 ${items.length >= 4 ? 'lg:grid-cols-4' : items.length === 3 ? 'lg:grid-cols-3' : ''} lg:divide-x lg:divide-line`}>
        {items.map((it, i) => {
          const Icon = ICONS[it.iconName] || Sparkles;
          return (
            <div
              key={i}
              onClick={it.linkUrl ? () => ctx.go(it.linkUrl) : undefined}
              className={`group flex flex-col items-center px-3 sm:px-6 text-center lg:py-2 ${it.linkUrl ? 'cursor-pointer' : ''}`}
            >
              <span className="accent-icon flex h-16 w-16 items-center justify-center rounded-full border border-line text-ink transition-colors duration-300 group-hover:border-clay group-hover:text-clay" style={color ? { color } : undefined}>
                <Icon className="h-6 w-6" strokeWidth={1.25} />
              </span>
              <h3 className="card-title mt-6 text-[12px] font-medium uppercase tracking-[0.22em] text-ink">{it.title}</h3>
              {it.description && <p className="card-desc mt-3 max-w-[230px] text-[14px] leading-relaxed text-stone">{it.description}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Trust badges ────────────────────────────────────────────────────────────

const BADGE_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  badge: BadgeCheck, shield: ShieldCheck, globe: Globe2, tag: Tag
};
const DEFAULT_BADGES = [
  { iconType: 'badge', title: 'Quality guaranteed', description: 'Every piece inspected before it ships' },
  { iconType: 'shield', title: 'Secure checkout', description: 'Encrypted payments you can trust' },
  { iconType: 'globe', title: 'Tracked delivery', description: 'Follow your order to the door' },
  { iconType: 'tag', title: 'Fair pricing', description: 'Honest prices, no inflated markups' }
];

export function TrustBadgesSection({ sec, ctx }: SectionProps) {
  const s: any = sec.settings;
  const badges: any[] = Array.isArray(s.trustBadges) && s.trustBadges.length ? s.trustBadges : DEFAULT_BADGES;
  return (
    <div className="py-10 md:py-14">
      <div className="card-bg custom-border grid grid-cols-2 gap-px overflow-hidden border border-line bg-line lg:grid-cols-4">
        {badges.map((b, i) => {
          const Icon = BADGE_ICONS[b.iconType] || BadgeCheck;
          return (
            <div
              key={i}
              onClick={b.linkUrl ? () => ctx.go(b.linkUrl) : undefined}
              className={`flex flex-col items-center gap-3 bg-cream px-5 py-8 text-center md:flex-row md:items-start md:text-left ${b.linkUrl ? 'cursor-pointer hover:bg-sand transition-colors' : ''}`}
            >
              <Icon className="accent-icon h-7 w-7 shrink-0 text-clay" strokeWidth={1.25} />
              <div>
                <p className="card-title text-[12px] font-medium uppercase tracking-[0.18em] text-ink">{b.title}</p>
                {b.description && <p className="card-desc mt-1.5 text-[13px] leading-snug text-stone">{b.description}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── FAQ ─────────────────────────────────────────────────────────────────────

const DEFAULT_FAQS = [
  { question: 'How long does delivery take?', answer: 'Orders are dispatched within 1–2 working days and usually arrive in 3–7 days. You will receive a tracking link by email as soon as your parcel ships.' },
  { question: 'What is your returns policy?', answer: 'You can return unworn items with their tags within 14 days of delivery. Start a return from your account and we will arrange a pickup.' },
  { question: 'How do I find my size?', answer: 'Each product page has a size guide with garment measurements. If you are between sizes, we recommend sizing up for a relaxed fit.' },
  { question: 'How should I care for my pieces?', answer: 'Care instructions are on every label. Most of our garments prefer a cool, gentle wash and drying flat to keep their shape.' }
];

export function FaqSection({ sec, ctx }: SectionProps) {
  const s: any = sec.settings;
  const raw: any[] = (Array.isArray(s.faqItems) && s.faqItems.length ? s.faqItems : Array.isArray(s.faqs) && s.faqs.length ? s.faqs : DEFAULT_FAQS);
  const faqs = raw.map(f => ({ q: f.question || f.q || '', a: f.answer || f.a || '' })).filter(f => f.q);
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className={`${SECTION_Y} grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20`}>
      <div className="space-y-5 lg:sticky lg:top-28 lg:self-start">
        <Eyebrow>{s.badgeText || 'Help & FAQ'}</Eyebrow>
        <h2 className="section-title font-display text-4xl md:text-5xl font-normal leading-[1.05] text-ink">{s.title || 'Questions, answered'}</h2>
        <p className="section-desc max-w-sm text-[15px] leading-relaxed text-stone">
          {s.description || 'Everything you need to know about orders, delivery and returns.'}
        </p>
        <div className="pt-2">
          <TextLink onClick={() => ctx.go(s.buttonLink || '/pages/contact')}>{s.buttonText || 'Still have a question? Contact us'}</TextLink>
        </div>
      </div>

      <div className="custom-border border-t border-line">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="custom-border border-b border-line">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
              >
                <span className="card-title font-display text-xl md:text-2xl font-normal text-ink">{f.q}</span>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${isOpen ? 'border-ink bg-ink text-white' : 'border-line text-ink'}`}>
                  {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </span>
              </button>
              <div className={`grid transition-[grid-template-rows] duration-500 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <p className="card-desc max-w-2xl pb-7 pr-12 text-[15px] leading-relaxed text-stone">{f.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Blog posts ──────────────────────────────────────────────────────────────

const SAMPLE_POSTS = [
  { title: 'How to build a capsule wardrobe', category: 'Style notes', excerpt: 'Ten pieces, endless outfits — our guide to dressing well with less.' },
  { title: 'Caring for linen', category: 'Care guide', excerpt: 'Simple habits that keep natural fabrics soft and beautiful for years.' },
  { title: 'Behind the seams', category: 'Our studio', excerpt: 'Meet the small workshop that hand-finishes our new collection.' }
];

export function BlogPostsSection({ sec, ctx }: SectionProps) {
  const s: any = sec.settings;
  const seed = seedOf(sec.id);
  const posts = ctx.allBlogs.filter(b => b.status === 'Active');
  if (!posts.length && !ctx.editor) return null;
  const cols = Number(s.columnsDesktop) || 3;
  const grid = cols >= 4 ? 'md:grid-cols-2 lg:grid-cols-4' : cols === 2 ? 'md:grid-cols-2' : cols === 1 ? '' : 'md:grid-cols-3';
  const list = posts.length
    ? posts.slice(0, Math.max(cols, 3)).map((b: any, i) => ({
        key: b.id, title: b.title, category: b.category || 'Journal', excerpt: b.excerpt, date: b.date || b.publishedAt || '',
        image: imageOr(b.image || b.imageUrl, seed + i * 2 + 9, 1000, 750), open: () => ctx.go(`/blogs/${b.slug || b.id}`)
      }))
    : SAMPLE_POSTS.map((p, i) => ({ key: p.title, ...p, date: '', image: placeholderImage(seed + i * 2 + 9, 1000, 750), open: () => {} }));

  return (
    <div className={SECTION_Y}>
      <SectionHeader
        align="left"
        eyebrow={s.badgeText || 'The journal'}
        title={s.title || 'Stories & style notes'}
        description={s.description || undefined}
        action={<TextLink onClick={() => ctx.go('/blogs')}>{s.buttonText || 'Read the journal'}</TextLink>}
      />
      <div className={`grid ${Number(s.columnsMobile) === 2 ? 'grid-cols-2 gap-x-4' : 'grid-cols-1'} gap-y-10 md:gap-8 ${grid}`}>
        {list.map(p => (
          <article key={p.key} onClick={p.open} className="card-bg group cursor-pointer">
            <div className="aspect-[4/3] overflow-hidden bg-sand">
              <img src={p.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.04]" />
            </div>
            <div className="pt-6 space-y-3">
              <p className="text-[10px] uppercase tracking-[0.25em] text-clay">
                {p.category}{p.date ? <span className="text-stone"> · {p.date}</span> : null}
              </p>
              <h3 className="card-title font-display text-2xl font-normal leading-snug text-ink transition-colors group-hover:text-clay">{p.title}</h3>
              {p.excerpt && <p className="card-desc line-clamp-2 text-[14px] leading-relaxed text-stone">{p.excerpt}</p>}
              <span className="inline-flex items-center gap-1.5 pt-1 text-[11px] uppercase tracking-[0.22em] text-ink">
                Read more <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </article>
        ))}
      </div>
      {!posts.length && <EditorHint ctx={ctx}>Sample posts — publish posts under Content → Blog posts and they replace these. Hidden on the store until then.</EditorHint>}
    </div>
  );
}
