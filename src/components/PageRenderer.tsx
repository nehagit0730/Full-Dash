import React from 'react';
import { CustomPage, PageSection, Product, Collection, Customer, BlogPost } from '../types';
import { FileText } from 'lucide-react';
import { fontStack, googleFontHrefs } from '../utils/sectionFonts';
import { StoreSection, FULL_BLEED_TYPES, SectionContext } from './sections';

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
  if (btn.length) rules.push(`#sec-${id} .section-btn { ${btn.join(' ')} }`);

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
  if (s.paddingTopMobile !== undefined && s.paddingTopMobile !== '') mob.push(`#sec-${id} > .sec-container > * { padding-top: ${Number(s.paddingTopMobile)}px !important; }`);
  if (s.paddingBottomMobile !== undefined && s.paddingBottomMobile !== '') mob.push(`#sec-${id} > .sec-container > * { padding-bottom: ${Number(s.paddingBottomMobile)}px !important; }`);
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


/** Where vertical padding settings apply: the section component's own root. */
const PAD = (id: string) => `#sec-${id} > .sec-container > *`;

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
  if (!page) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <p className="text-slate-400 text-sm italic">Page content unavailable.</p>
      </div>
    );
  }

  // Follows any link value a merchant can enter in a section.
  const handleLinkClick = (link?: string) => {
    if (!link) return;
    const trimmed = link.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      window.open(trimmed, '_blank', 'noopener,noreferrer');
      return;
    }
    if (trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
      window.location.href = trimmed;
      return;
    }
    if (trimmed === 'frontend-home' || trimmed === '/' || trimmed === '/home' || trimmed === 'home') return onNavigate('frontend-home');
    if (trimmed === 'frontend-shop' || trimmed === '/shop' || trimmed === '/collections/all') return onNavigate('frontend-shop');
    if (trimmed.includes('subscribe')) return onNavigate('frontend-shop');
    if (trimmed === 'frontend-brands' || trimmed === '/brands' || trimmed === '/pages/brands') return onNavigate('frontend-brands');
    if (trimmed === 'frontend-account' || trimmed === '/account' || trimmed === '/pages/account') return onNavigate('frontend-account');
    if (trimmed === 'frontend-checkout' || trimmed === '/checkout' || trimmed === '/pages/checkout') return onNavigate('frontend-checkout');
    if (trimmed === 'blogs' || trimmed === '/blogs') return onNavigate('blogs');
    if (trimmed.startsWith('/products/') || trimmed.startsWith('product-')) {
      return onNavigate('product-detail', trimmed.replace('/products/', '').replace('product-', ''));
    }
    if (trimmed.startsWith('/collections/') || trimmed.startsWith('collection-')) {
      return onNavigate('collection-detail', trimmed.replace('/collections/', '').replace('collection-', ''));
    }
    if (trimmed.startsWith('/blogs/')) return onNavigate('blog-detail', trimmed.replace('/blogs/', ''));
    if (trimmed.startsWith('/pages/') || trimmed.startsWith('page-')) {
      return onNavigate(trimmed.replace('/pages/', '').replace('page-', ''));
    }
    onNavigate(trimmed);
  };

  const ctx: SectionContext = {
    allProducts,
    allCollections,
    allBlogs,
    loggedInCustomer,
    onAddToCart,
    onToggleWishlist,
    onNavigate,
    go: handleLinkClick,
    editor: !!editor
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
      className="space-y-0 pb-16 font-body"
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

          const s: any = sec.settings || {};
          const sStyle = {
            backgroundColor: s.backgroundColor || '#FFFFFF',
            color: s.textColor || '#1f1a17'
          };
          const fullBleed = sec.type === 'Marquee images' || (FULL_BLEED_TYPES.has(sec.type) && s.fullWidth !== false);
          const containerClass = `sec-container ${fullBleed || s.fullWidth ? 'w-full' : 'max-w-7xl mx-auto px-5 sm:px-8 lg:px-10'}`;
          const isSelected = !!editor && editor.selectedSectionId === sec.id;
          const isDisabled = !!s.hidden;
          const id = sec.id;

          // Colour and type settings. Text that sits on an image (.overlay-*)
          // keeps its own light colour; button colours apply to buttons only,
          // never to whole clickable cards.
          const customStyles = `
            ${PAD(id)} {
              ${s.paddingTop !== undefined ? `padding-top: ${s.paddingTop}px !important;` : ''}
              ${s.paddingBottom !== undefined ? `padding-bottom: ${s.paddingBottom}px !important;` : ''}
            }
            #sec-${id} {
              ${s.paddingSide !== undefined ? `padding-left: ${s.paddingSide}px !important; padding-right: ${s.paddingSide}px !important;` : ''}
              ${s.alignment ? `text-align: ${s.alignment} !important;` : ''}
            }
            #sec-${id} h1:not(.overlay-heading), #sec-${id} h2:not(.overlay-heading), #sec-${id} .section-title {
              ${s.titleFontSize ? `font-size: ${s.titleFontSize}px !important;` : ''}
              ${s.headingColor ? `color: ${s.headingColor} !important;` : ''}
              ${s.alignment ? `text-align: ${s.alignment} !important;` : ''}
            }
            #sec-${id} h1.overlay-heading, #sec-${id} h2.overlay-heading {
              ${s.titleFontSize ? `font-size: ${s.titleFontSize}px !important;` : ''}
            }
            #sec-${id} p:not(.overlay-text), #sec-${id} .section-desc, #sec-${id} li {
              ${s.bodyFontSize ? `font-size: ${s.bodyFontSize}px !important;` : ''}
              ${s.textColor ? `color: ${s.textColor} !important;` : ''}
            }
            #sec-${id} .section-btn {
              ${s.buttonBgColor ? `background-color: ${s.buttonBgColor} !important; border-color: ${s.buttonBgColor} !important;` : ''}
              ${s.buttonTextColor ? `color: ${s.buttonTextColor} !important;` : ''}
              ${s.buttonRoundness === 'rounded-none' ? 'border-radius: 0px !important;' : ''}
              ${s.buttonRoundness === 'rounded' ? 'border-radius: 4px !important;' : ''}
              ${s.buttonRoundness === 'rounded-lg' ? 'border-radius: 8px !important;' : ''}
              ${s.buttonRoundness === 'rounded-xl' ? 'border-radius: 12px !important;' : ''}
              ${s.buttonRoundness === 'rounded-full' ? 'border-radius: 9999px !important;' : ''}
            }
            #sec-${id} .subheading, #sec-${id} .section-subheading {
              ${s.subheadingColor ? `color: ${s.subheadingColor} !important;` : ''}
            }
            #sec-${id} .card-title, #sec-${id} .overlay-heading {
              ${s.cardTitleColor || s.overlayHeadingColor ? `color: ${s.cardTitleColor || s.overlayHeadingColor} !important;` : ''}
            }
            #sec-${id} .card-desc {
              ${s.cardTextColor ? `color: ${s.cardTextColor} !important;` : ''}
            }
            #sec-${id} .card-bg {
              ${s.cardBgColor ? `background-color: ${s.cardBgColor} !important;` : ''}
            }
            #sec-${id} .badge-text {
              ${s.badgeTextColor ? `color: ${s.badgeTextColor} !important;` : ''}
            }
            #sec-${id} .badge-bg {
              ${s.badgeBgColor ? `background-color: ${s.badgeBgColor} !important;` : ''}
            }
            #sec-${id} .accent-text, #sec-${id} .accent-icon {
              ${s.accentColor ? `color: ${s.accentColor} !important;` : ''}
            }
            #sec-${id} .custom-border {
              ${s.borderColor ? `border-color: ${s.borderColor} !important;` : ''}
            }
          `;

          return (
            <section
              id={`sec-${id}`}
              key={id || idx}
              style={sStyle}
              data-section-id={id}
              onClickCapture={editor ? (e) => {
                // In the builder a click selects the section; links must not
                // navigate the preview away from the page being edited.
                if ((e.target as HTMLElement).closest?.('a')) e.preventDefault();
                editor.onSelectSection(id);
              } : undefined}
              onSubmitCapture={editor ? (e) => e.preventDefault() : undefined}
              className={`${sectionClassName} relative w-full overflow-hidden font-body ${editor ? 'cursor-pointer group/sec' : ''} ${isDisabled ? 'opacity-40' : ''}`}
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
                      {sec.type === 'How it works' ? 'Our process' : sec.type === 'Clearance Sale' ? 'Sale products' : sec.type === 'Text column with image' ? 'Multicolumn' : sec.type}{isDisabled ? ' · Hidden' : ''}
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
                <StoreSection sec={sec} ctx={ctx} />
              </div>
            </section>
          );
        })
      ) : (
        <div className="text-center py-24 max-w-md mx-auto p-6 space-y-4">
          <div className="h-14 w-14 rounded-full bg-slate-50 border text-slate-300 flex items-center justify-center mx-auto">
            <FileText className="h-6 w-6" />
          </div>
          <p className="text-sm text-slate-500">This page has no sections yet.</p>
        </div>
      )}
    </div>
  );
}
