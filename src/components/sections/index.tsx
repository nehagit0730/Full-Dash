import React from 'react';
import { SectionProps } from './sectionKit';
import {
  ImageBannerSection, ImageReelSection, ImageWithTextSection, MarqueeTextSection, RichTextSection, SlideshowSection, VideoBannerSection
} from './heroSections';
import { CollectionListSection, FeaturedCollectionSection, SaleSection } from './productSections';
import {
  BlogPostsSection, BrandCarouselSection, BrandListSection, FaqSection, GallerySection, IconWithTextSection,
  LogoListSection, MulticolumnSection, ProcessSection, TrustBadgesSection
} from './contentSections';
import { ContactSection } from './ContactSection';

export type { SectionContext } from './sectionKit';

/**
 * Section type (as stored in page data — never renamed, so existing pages and
 * theme files keep working) → component.
 */
const SECTIONS: Record<string, React.ComponentType<SectionProps>> = {
  'Image banner': ImageBannerSection,
  'Slideshow': SlideshowSection,
  'Video banner': VideoBannerSection,
  'Image with text': ImageWithTextSection,
  'Rich text': RichTextSection,
  'Marquee text': MarqueeTextSection,
  'Marquee images': ImageReelSection,
  'Featured collection': FeaturedCollectionSection,
  'Collection list': CollectionListSection,
  'Clearance Sale': SaleSection,
  'Text column with image': MulticolumnSection,
  'Images gallery': GallerySection,
  'Logo list': LogoListSection,
  'Brand list': BrandListSection,
  'Brands we offer': BrandCarouselSection,
  'How it works': ProcessSection,
  'Icon with text': IconWithTextSection,
  'Trust badges': TrustBadgesSection,
  'FAQs': FaqSection,
  'Blog post': BlogPostsSection,
  'Contact Form': ContactSection
};

/** Sections that run edge to edge and set their own height (no vertical padding wrapper). */
export const FULL_BLEED_TYPES = new Set(['Image banner', 'Slideshow', 'Video banner', 'Marquee text', 'Marquee images']);

export function StoreSection(props: SectionProps) {
  const Component = SECTIONS[props.sec.type];
  return Component ? <Component {...props} /> : null;
}
