import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { cleanMediaUrl } from '../../utils/mediaUtils';
import { Btn, Eyebrow, SECTION_Y, SectionProps, imageList, imageOr, placeholderImage, seedOf } from './sectionKit';

// ── Image banner ────────────────────────────────────────────────────────────

export function ImageBannerSection({ sec, ctx }: SectionProps) {
  const s: any = sec.settings;
  const seed = seedOf(sec.id);
  const centered = s.alignment === 'center';
  const clickable = !!s.bannerLink;
  const title = s.title || 'The new season edit';
  const description = s.description ?? 'Effortless silhouettes, considered fabrics and pieces made to be worn on repeat.';

  return (
    <div
      className={`relative w-full overflow-hidden ${s.fullWidth ? 'min-h-[78vh] md:min-h-[88vh]' : 'min-h-[60vh] my-10 md:my-16'} flex ${clickable ? 'cursor-pointer' : ''}`}
      onClick={clickable ? () => ctx.go(s.bannerLink) : undefined}
    >
      <img
        src={imageOr(s.imageUrl, seed, 2000)}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
        referrerPolicy="no-referrer"
      />
      <div className={`absolute inset-0 ${centered ? 'bg-black/35' : 'bg-gradient-to-t from-black/70 via-black/25 to-transparent md:bg-gradient-to-r md:from-black/60 md:via-black/20'}`} />

      <div className={`relative z-10 mx-auto flex w-full max-w-7xl px-6 sm:px-10 lg:px-16 py-16 ${centered ? 'items-center justify-center text-center' : 'items-end md:items-center'}`}>
        <div className={`max-w-xl space-y-6 ${centered ? 'mx-auto' : ''}`}>
          <Eyebrow light>{s.badgeText || 'New collection'}</Eyebrow>
          <h1 className="overlay-heading font-display text-5xl sm:text-6xl lg:text-7xl font-light leading-[0.98] text-white">
            {title}
          </h1>
          {description && <p className="overlay-text max-w-md text-base leading-relaxed text-white/85">{description}</p>}
          {((s.buttonText ?? 'Shop now') || s.buttonText2) && (
            <div className={`flex flex-wrap gap-3 pt-2 ${centered ? 'justify-center' : ''}`}>
              {(s.buttonText ?? 'Shop now') && <Btn variant="light" onClick={() => ctx.go(s.buttonLink || '/shop')}>{s.buttonText ?? 'Shop now'}</Btn>}
              {s.buttonText2 && <Btn variant="ghost-light" onClick={() => ctx.go(s.buttonLink2 || '/shop')}>{s.buttonText2}</Btn>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Slideshow ───────────────────────────────────────────────────────────────

const DEFAULT_SLIDES = [
  { title: 'Summer, simplified', description: 'Light linens and easy shapes for long, warm days.', buttonText: 'Shop the edit', buttonLink: '/shop' },
  { title: 'The knitwear edit', description: 'Soft textures and quiet colours, made to layer.', buttonText: 'Discover knitwear', buttonLink: '/shop' },
  { title: 'Made to last', description: 'Timeless pieces designed for every day — and every year after.', buttonText: 'Shop essentials', buttonLink: '/shop' }
];

export function SlideshowSection({ sec, ctx }: SectionProps) {
  const s: any = sec.settings;
  const seed = seedOf(sec.id);
  const slides: any[] = Array.isArray(s.slides) && s.slides.length ? s.slides : DEFAULT_SLIDES;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    const t = window.setTimeout(() => setIndex(i => (i + 1) % count), 6000);
    return () => window.clearTimeout(t);
  }, [index, count, paused]);

  const goTo = (i: number) => setIndex(((i % count) + count) % count);

  return (
    <div
      className={`relative w-full overflow-hidden bg-ink ${s.fullWidth === false ? 'my-10 md:my-16' : ''} h-[78vh] min-h-[520px] md:h-[88vh]`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => {
        const active = i === index;
        return (
          <div
            key={i}
            aria-hidden={!active}
            className={`absolute inset-0 transition-opacity duration-1000 ${active ? 'opacity-100 z-10' : 'opacity-0 z-0'} ${slide.slideLink ? 'cursor-pointer' : ''}`}
            onClick={slide.slideLink ? () => ctx.go(slide.slideLink) : undefined}
          >
            <img
              src={imageOr(slide.imageUrl, seed + i * 3, 2000)}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[7000ms] ease-out ${active ? 'scale-105' : 'scale-100'}`}
              referrerPolicy="no-referrer"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
            <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-6 pb-24 sm:px-10 md:pb-28 lg:px-16">
              <div className={`max-w-xl space-y-5 transition-all duration-700 delay-200 ${active ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
                <Eyebrow light>{String(i + 1).padStart(2, '0')} — {String(count).padStart(2, '0')}</Eyebrow>
                <h2 className="overlay-heading font-display text-5xl font-light leading-[1] text-white sm:text-6xl lg:text-7xl">{slide.title}</h2>
                {slide.description && <p className="overlay-text max-w-md text-base leading-relaxed text-white/85">{slide.description}</p>}
                <div className="flex flex-wrap gap-3 pt-1">
                  {slide.buttonText && <Btn variant="light" onClick={() => ctx.go(slide.buttonLink || '/shop')}>{slide.buttonText}</Btn>}
                  {slide.buttonText2 && <Btn variant="ghost-light" onClick={() => ctx.go(slide.buttonLink2 || '/shop')}>{slide.buttonText2}</Btn>}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-0 z-20 mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 pb-8 sm:px-10 lg:px-16">
          <div className="flex flex-1 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => goTo(i)}
                className="relative h-[2px] flex-1 max-w-[80px] overflow-hidden bg-white/30"
              >
                <span
                  key={`${i}-${index}`}
                  className={`absolute inset-y-0 left-0 bg-white ${i < index ? 'w-full' : i > index ? 'w-0' : ''}`}
                  style={i === index ? { animation: 'slide-progress 6s linear forwards', animationPlayState: paused ? 'paused' : 'running' } : undefined}
                />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" aria-label="Previous slide" onClick={() => goTo(index - 1)} className="flex h-11 w-11 items-center justify-center border border-white/50 text-white transition hover:bg-white hover:text-ink">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Next slide" onClick={() => goTo(index + 1)} className="flex h-11 w-11 items-center justify-center border border-white/50 text-white transition hover:bg-white hover:text-ink">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Video banner ────────────────────────────────────────────────────────────

function youTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}

const FEATURES = [
  { icon: Truck, title: 'Free shipping', text: 'On orders over ₹1,999' },
  { icon: RotateCcw, title: 'Easy returns', text: '14 days, no questions asked' },
  { icon: ShieldCheck, title: 'Secure checkout', text: 'Cards, UPI & wallets' },
  { icon: Sparkles, title: 'Made to last', text: 'Quality checked by hand' }
];

export function VideoBannerSection({ sec, ctx }: SectionProps) {
  const s: any = sec.settings;
  const seed = seedOf(sec.id);
  const mp4Raw = String(s.videoMp4Url || '').trim();
  const mp4 = mp4Raw ? cleanMediaUrl(mp4Raw) : ''; // cleanMediaUrl('') returns a placeholder image
  const ytId = !mp4 && s.videoUrl ? youTubeId(String(s.videoUrl)) : null;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (v) { v.muted = true; v.play().catch(() => {}); }
  }, [mp4]);

  return (
    <div className="w-full">
      <div className="relative flex min-h-[70vh] md:min-h-[85vh] w-full items-center justify-center overflow-hidden bg-ink">
        <div className="absolute inset-0 pointer-events-none">
          {ytId ? (
            <div className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[100vw] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2">
              <iframe
                className="h-full w-full border-0"
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&rel=0&modestbranding=1&playsinline=1`}
                title="Background video"
                allow="autoplay; encrypted-media"
              />
            </div>
          ) : mp4 ? (
            <video ref={videoRef} key={mp4} className="h-full w-full object-cover" autoPlay muted loop playsInline preload="auto" src={mp4} />
          ) : (
            <img src={placeholderImage(seed + 4, 2000)} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          )}
          <div className="absolute inset-0 bg-black/45" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center space-y-6">
          <Eyebrow light>{s.badgeText || 'The campaign'}</Eyebrow>
          <h2 className="overlay-heading font-display text-5xl font-light leading-[1] text-white sm:text-6xl lg:text-7xl">
            {s.title || 'Designed to move with you'}
          </h2>
          {(s.description ?? 'Discover the new collection — made in small batches from fabrics we love.') && (
            <p className="overlay-text mx-auto max-w-lg text-base leading-relaxed text-white/85">
              {s.description ?? 'Discover the new collection — made in small batches from fabrics we love.'}
            </p>
          )}
          {(s.buttonText ?? 'Shop the collection') && (
            <div className="pt-2">
              <Btn variant="light" onClick={() => ctx.go(s.buttonLink || '/shop')}>{s.buttonText || 'Shop the collection'}</Btn>
            </div>
          )}
        </div>
      </div>

      {s.showFeatureBar !== false && (
        <div className="border-b border-line bg-cream">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-6 px-6 py-8 sm:px-10 lg:grid-cols-4 lg:px-16">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-center gap-4">
                <Icon className="accent-icon h-6 w-6 shrink-0 text-clay" strokeWidth={1.25} />
                <div>
                  <p className="card-title text-[12px] font-medium uppercase tracking-[0.18em] text-ink">{title}</p>
                  <p className="card-desc mt-0.5 text-[13px] text-stone">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Image with text ─────────────────────────────────────────────────────────

export function ImageWithTextSection({ sec, ctx }: SectionProps) {
  const s: any = sec.settings;
  const seed = seedOf(sec.id);
  const imageRight = s.imagePosition === 'right';
  const img = (
    <div className={`relative ${s.imageLink ? 'cursor-pointer' : ''}`} onClick={s.imageLink ? () => ctx.go(s.imageLink) : undefined}>
      <div className="absolute -inset-3 md:-inset-4 border border-line translate-x-3 translate-y-3 md:translate-x-5 md:translate-y-5" aria-hidden />
      <div className="relative aspect-[4/5] overflow-hidden bg-sand">
        <img src={imageOr(s.imageUrl, seed + 1, 1200)} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-[1200ms] hover:scale-[1.03]" />
      </div>
    </div>
  );

  return (
    <div className={`${SECTION_Y} grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-20`}>
      <div className={imageRight ? 'md:order-2' : ''}>{img}</div>
      <div className={`max-w-md space-y-6 ${imageRight ? 'md:order-1 md:ml-auto' : ''}`}>
        <Eyebrow>{s.badgeText || 'Our story'}</Eyebrow>
        <h2 className="section-title font-display text-4xl md:text-5xl font-normal leading-[1.05] text-ink">{s.title || 'Made slowly, worn endlessly'}</h2>
        <p className="section-desc text-[15px] leading-relaxed text-stone">
          {s.description || 'Every piece starts with fabric we would want to wear ourselves. We work with small workshops, in limited runs, so what you buy is made with care — and made to last.'}
        </p>
        {(s.buttonText ?? 'Discover more') && (
          <div className="pt-2">
            <Btn variant="outline" onClick={() => ctx.go(s.buttonLink || '/shop')}>{s.buttonText || 'Discover more'}</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Rich text ───────────────────────────────────────────────────────────────

export function RichTextSection({ sec, ctx }: SectionProps) {
  const s: any = sec.settings;
  return (
    <div className={`${SECTION_Y} mx-auto max-w-3xl text-center`}>
      <Eyebrow>{s.badgeText || 'Our philosophy'}</Eyebrow>
      <h2 className="section-title mt-5 font-display text-4xl md:text-6xl font-light leading-[1.08] text-ink">
        {s.title || 'Fewer, better things'}
      </h2>
      <div className="mx-auto my-8 h-px w-16 bg-clay/60" aria-hidden />
      <p className="section-desc mx-auto max-w-2xl text-base md:text-lg leading-relaxed text-stone">
        {s.description || 'We design wardrobe staples with honest materials and timeless shapes — pieces that feel as good in five years as they do today.'}
      </p>
      {s.buttonText && (
        <div className="mt-10">
          <Btn variant="outline" onClick={() => ctx.go(s.buttonLink || '/shop')}>{s.buttonText}</Btn>
        </div>
      )}
    </div>
  );
}

// ── Scrolling text (marquee) ────────────────────────────────────────────────

export function MarqueeTextSection({ sec }: SectionProps) {
  const s: any = sec.settings;
  const raw = String(s.title || 'Free shipping over ₹1,999 // New arrivals every week // Easy 14-day returns // Secure checkout');
  const items = raw.split(/\s*\/\/\s*/).map(t => t.trim()).filter(Boolean);
  const speed = Math.max(1, Math.min(10, Number(s.marqueeSpeed) || 3));
  const duration = 70 - speed * 6; // 1 → 64s (calm) … 10 → 10s (fast)
  const run = [...items, ...items, ...items];

  return (
    <div className="marquee-container py-5 md:py-6 select-none" aria-label={items.join('. ')}>
      <div className="animate-marquee items-center hover:[animation-play-state:paused]" style={{ animationDuration: `${duration}s` }}>
        {[0, 1].map(copy => (
          <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
            {run.map((item, i) => (
              <span key={`${copy}-${i}`} className="flex items-center">
                <span className="px-8 font-display text-2xl md:text-3xl italic font-light tracking-wide">{item}</span>
                <span className="accent-text text-sm opacity-70">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Image reel (marquee images) ─────────────────────────────────────────────

export function ImageReelSection({ sec, ctx }: SectionProps) {
  const s: any = sec.settings;
  const seed = seedOf(sec.id);
  const own = imageList(s.galleryImages);
  const products = ctx.allProducts.filter(p => p.status === 'Active' && p.image).slice(0, Number(s.itemsCount) || 8);
  const tiles: { src: string; label?: string; onClick?: () => void }[] = own.length
    ? own.map(src => ({ src: imageOr(src, 0, 700) }))
    : products.length
      ? products.map(p => ({ src: imageOr(p.image, 0, 700), label: p.title, onClick: () => ctx.onNavigate('product-detail', p.slug || p.id) }))
      : Array.from({ length: 8 }, (_, i) => ({ src: placeholderImage(seed + i, 700, 900) }));
  const run = [...tiles, ...tiles];

  return (
    <div className={`${SECTION_Y}`}>
      {(s.title ?? 'New in') && (
        <div className="mx-auto mb-10 flex max-w-7xl items-end justify-between gap-6 px-5 sm:px-8 lg:px-10">
          <div className="space-y-3">
            <Eyebrow>{s.badgeText || 'Just landed'}</Eyebrow>
            <h2 className="section-title font-display text-4xl md:text-5xl font-normal leading-none text-ink">{s.title || 'New in'}</h2>
          </div>
          <Btn variant="link" onClick={() => ctx.go(s.buttonLink || '/shop')}>{s.buttonText || 'Shop all'}</Btn>
        </div>
      )}
      <div className="marquee-container">
        <div className="animate-marquee-slow gap-4 hover:[animation-play-state:paused]">
          {run.map((t, i) => (
            <button
              key={i}
              type="button"
              onClick={t.onClick}
              className={`group relative h-80 w-60 shrink-0 overflow-hidden bg-sand md:h-[26rem] md:w-72 ${t.onClick ? 'cursor-pointer' : 'cursor-default'}`}
              aria-hidden={i >= tiles.length}
              tabIndex={i >= tiles.length ? -1 : 0}
            >
              <img src={t.src} alt={t.label || ''} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              {t.label && (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-left text-[12px] uppercase tracking-[0.15em] text-white">
                  {t.label}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
