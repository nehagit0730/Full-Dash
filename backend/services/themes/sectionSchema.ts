/**
 * The settings each section type understands, as shipped inside every theme
 * package (schema/…) so a theme can be written by hand. Keep this in step with
 * PageRenderer: a key listed here must be one the renderer actually reads.
 */

export type SettingType = 'text' | 'textarea' | 'richtext' | 'image' | 'video' | 'url' | 'link' | 'color' | 'number' | 'boolean' | 'select' | 'collection' | 'collections' | 'products' | 'font' | 'css';

export interface SettingDef {
  key: string;
  type: SettingType;
  label: string;
  info?: string;
  default?: any;
  options?: string[];
  min?: number;
  max?: number;
  unit?: string;
}

export interface ListDef {
  key: string;
  label: string;
  info?: string;
  item: SettingDef[];
  /** Plain list of image URLs rather than objects. */
  ofImages?: boolean;
}

export interface SectionSchema {
  type: string;
  file: string;
  description: string;
  settings: SettingDef[];
  lists?: ListDef[];
  example: Record<string, any>;
}

const title = (d: string): SettingDef => ({ key: 'title', type: 'text', label: 'Heading', default: d });
const description: SettingDef = { key: 'description', type: 'textarea', label: 'Text' };
const button = (): SettingDef[] => [
  { key: 'buttonText', type: 'text', label: 'Button label', info: 'Leave empty to hide the button.' },
  { key: 'buttonLink', type: 'link', label: 'Button link' }
];
const fullWidth: SettingDef = { key: 'fullWidth', type: 'boolean', label: 'Full browser width', default: false };
const IMG = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';

export const SECTION_SCHEMAS: SectionSchema[] = [
  {
    type: 'Image banner',
    file: 'image-banner',
    description: 'Large hero image with heading, text and up to two buttons.',
    settings: [title('Welcome to our store'), description, { key: 'imageUrl', type: 'image', label: 'Image' }, ...button(), fullWidth],
    example: { title: 'New season, new favourites', description: 'Discover the latest arrivals.', imageUrl: IMG, buttonText: 'Shop now', buttonLink: '/shop', fullWidth: true }
  },
  {
    type: 'Video banner',
    file: 'video-banner',
    description: 'Autoplaying, muted background video (MP4 file or YouTube) with heading and button.',
    settings: [title('Watch the story'), description,
      { key: 'videoMp4Url', type: 'video', label: 'MP4 video URL', info: 'Used first when set.' },
      { key: 'videoUrl', type: 'url', label: 'YouTube URL', info: 'e.g. https://www.youtube.com/watch?v=…' }, ...button(), fullWidth],
    example: { title: 'Made with care', description: 'See how every piece is finished by hand.', videoMp4Url: '', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', buttonText: 'Shop now', buttonLink: '/shop', fullWidth: true }
  },
  {
    type: 'Image with text',
    file: 'image-with-text',
    description: 'An image beside a heading, text and button.',
    settings: [title('Image with text'), description, { key: 'imageUrl', type: 'image', label: 'Image' }, ...button()],
    example: { title: 'Designed to last', description: 'Pair text with an image to focus on your chosen product, collection or story.', imageUrl: IMG, buttonText: 'Learn more', buttonLink: '/pages/about' }
  },
  {
    type: 'Text column with image',
    file: 'text-columns',
    description: 'Heading and text above a row of feature columns.',
    settings: [title('Why customers love us'), description],
    example: { title: 'Why customers love us', description: 'Quality you can feel, service you can count on.' }
  },
  {
    type: 'Rich text',
    file: 'rich-text',
    description: 'A heading, paragraph and optional button. Good for intros and announcements.',
    settings: [title('Talk about your brand'), description, ...button()],
    example: { title: 'Talk about your brand', description: 'Share information about your brand with your customers.', buttonText: 'Read our story', buttonLink: '/pages/about' }
  },
  {
    type: 'Marquee text',
    file: 'marquee-text',
    description: 'A continuously scrolling strip of text, e.g. shipping and offer messages.',
    settings: [{ key: 'title', type: 'text', label: 'Scrolling text', info: 'Separate messages with "//".' }, fullWidth],
    example: { title: 'FREE SHIPPING OVER ₹999 // EASY RETURNS // SECURE CHECKOUT', fullWidth: true, backgroundColor: '#111111', textColor: '#FFFFFF' }
  },
  {
    type: 'Marquee images',
    file: 'marquee-images',
    description: 'A horizontal reel of images. Shows your products when no images are set.',
    settings: [title('')],
    lists: [{ key: 'galleryImages', label: 'Images', ofImages: true, item: [{ key: '', type: 'image', label: 'Image URL' }] }],
    example: { title: 'As seen on you', galleryImages: [IMG, IMG, IMG, IMG] }
  },
  {
    type: 'Logo list',
    file: 'logo-list',
    description: 'A row of partner or brand logos.',
    settings: [title('Brands we work with'), description],
    lists: [{ key: 'logoImages', label: 'Logo images', ofImages: true, item: [{ key: '', type: 'image', label: 'Logo URL' }] }],
    example: { title: 'As featured in', logoImages: [IMG, IMG, IMG] }
  },
  {
    type: 'Collection list',
    file: 'collection-list',
    description: 'Cards linking to your collections.',
    settings: [title('Shop by category'), description,
      { key: 'selectedCollectionIds', type: 'collections', label: 'Collections', info: 'Collection ids from this store. Empty shows all collections.' },
      { key: 'itemsCount', type: 'number', label: 'Maximum to show', min: 1, max: 24, default: 4 }],
    example: { title: 'Shop by category', selectedCollectionIds: [], itemsCount: 4 }
  },
  {
    type: 'Featured collection',
    file: 'featured-collection',
    description: 'A grid of products from one collection.',
    settings: [title('Featured collection'), description,
      { key: 'selectedCollectionId', type: 'collection', label: 'Collection', info: 'A collection id from this store. Empty shows all products.' },
      { key: 'itemsCount', type: 'number', label: 'Products to show', min: 1, max: 24, default: 4 }],
    example: { title: 'Bestsellers', selectedCollectionId: '', itemsCount: 8 }
  },
  {
    type: 'Clearance Sale',
    file: 'clearance-sale',
    description: 'Hand-picked sale products.',
    settings: [title('Clearance sale'), description,
      { key: 'selectedProductIds', type: 'products', label: 'Products', info: 'Product ids from this store.' }],
    example: { title: 'Final clearance', description: 'While stocks last.', selectedProductIds: [] }
  },
  {
    type: 'Images gallery',
    file: 'images-gallery',
    description: 'A grid of images.',
    settings: [title('Gallery'), description],
    lists: [{ key: 'galleryImages', label: 'Images', ofImages: true, item: [{ key: '', type: 'image', label: 'Image URL' }] }],
    example: { title: 'Gallery', description: 'Moments from our studio.', galleryImages: [IMG, IMG, IMG, IMG] }
  },
  {
    type: 'FAQs',
    file: 'faqs',
    description: 'Expandable questions and answers.',
    settings: [title('Frequently asked questions'), description],
    lists: [{ key: 'faqItems', label: 'Questions', item: [
      { key: 'question', type: 'text', label: 'Question' },
      { key: 'answer', type: 'textarea', label: 'Answer' }
    ] }],
    example: { title: 'Frequently asked questions', faqItems: [{ question: 'How long does delivery take?', answer: '3–5 working days.' }] }
  },
  {
    type: 'Slideshow',
    file: 'slideshow',
    description: 'Rotating full-width slides, each with an image, heading, text and buttons.',
    settings: [fullWidth],
    lists: [{ key: 'slides', label: 'Slides', item: [
      { key: 'title', type: 'text', label: 'Heading' },
      { key: 'description', type: 'textarea', label: 'Text' },
      { key: 'imageUrl', type: 'image', label: 'Image' },
      { key: 'buttonText', type: 'text', label: 'Button label' },
      { key: 'buttonLink', type: 'link', label: 'Button link' },
      { key: 'buttonText2', type: 'text', label: 'Second button label' },
      { key: 'buttonLink2', type: 'link', label: 'Second button link' },
      { key: 'slideLink', type: 'link', label: 'Whole-slide link' }
    ] }],
    example: { fullWidth: true, slides: [{ title: 'Summer edit', description: 'Light layers for warm days.', imageUrl: IMG, buttonText: 'Shop now', buttonLink: '/shop' }] }
  },
  {
    type: 'Blog post',
    file: 'blog-posts',
    description: 'Your latest blog posts.',
    settings: [title('From the journal'), description,
      { key: 'columnsDesktop', type: 'number', label: 'Columns on desktop', min: 1, max: 4, default: 3 },
      { key: 'columnsMobile', type: 'number', label: 'Columns on mobile', min: 1, max: 2, default: 1 }],
    example: { title: 'From the journal', columnsDesktop: 3, columnsMobile: 1 }
  },
  {
    type: 'Brand list',
    file: 'brand-list',
    description: 'Image cards for brands, each with a link.',
    settings: [title('Shop by brand'), description],
    lists: [{ key: 'brandItems', label: 'Brands', item: [
      { key: 'title', type: 'text', label: 'Name' },
      { key: 'imageUrl', type: 'image', label: 'Image' },
      { key: 'linkUrl', type: 'link', label: 'Link' }
    ] }],
    example: { title: 'Shop by brand', brandItems: [{ title: 'Brand A', imageUrl: IMG, linkUrl: '/collections/brand-a' }] }
  },
  {
    type: 'Brands we offer',
    file: 'brands-we-offer',
    description: 'A scrolling carousel of brand cards.',
    settings: [title('Brands we offer'), description],
    lists: [{ key: 'brandItems', label: 'Brands', item: [
      { key: 'title', type: 'text', label: 'Name' },
      { key: 'imageUrl', type: 'image', label: 'Image' },
      { key: 'linkUrl', type: 'link', label: 'Link' }
    ] }],
    example: { title: 'Brands we offer', brandItems: [{ title: 'Brand A', imageUrl: IMG, linkUrl: '/collections/brand-a' }] }
  },
  {
    type: 'How it works',
    file: 'how-it-works',
    description: 'Numbered steps with images.',
    settings: [title('How it works'), description],
    lists: [{ key: 'stepItems', label: 'Steps', item: [
      { key: 'number', type: 'text', label: 'Step number' },
      { key: 'title', type: 'text', label: 'Heading' },
      { key: 'description', type: 'textarea', label: 'Text' },
      { key: 'imageUrl', type: 'image', label: 'Image' },
      { key: 'linkUrl', type: 'link', label: 'Link' }
    ] }],
    example: { title: 'How it works', stepItems: [{ number: '1', title: 'Pick your style', description: 'Browse the collection.', imageUrl: IMG }] }
  },
  {
    type: 'Icon with text',
    file: 'icon-with-text',
    description: 'Icons with short headings — delivery, returns, guarantees.',
    settings: [title('Why shop with us'), description],
    lists: [{ key: 'iconItems', label: 'Items', item: [
      { key: 'iconName', type: 'select', label: 'Icon', options: ['Truck', 'Zap', 'Shield', 'Clock', 'Award', 'Package', 'Heart', 'HelpCircle', 'Star'] },
      { key: 'title', type: 'text', label: 'Heading' },
      { key: 'description', type: 'textarea', label: 'Text' },
      { key: 'linkUrl', type: 'link', label: 'Link' }
    ] }],
    example: { title: 'Why shop with us', iconItems: [{ iconName: 'Truck', title: 'Free delivery', description: 'On orders over ₹999.' }] }
  },
  {
    type: 'Trust badges',
    file: 'trust-badges',
    description: 'A row of trust badges.',
    settings: [],
    lists: [{ key: 'trustBadges', label: 'Badges', item: [
      { key: 'iconType', type: 'select', label: 'Icon', options: ['badge', 'shield', 'globe', 'tag'] },
      { key: 'title', type: 'text', label: 'Heading' },
      { key: 'description', type: 'text', label: 'Text' },
      { key: 'linkUrl', type: 'link', label: 'Link' }
    ] }],
    example: { trustBadges: [{ iconType: 'shield', title: 'SECURE CHECKOUT', description: 'Encrypted payments.' }] }
  },
  {
    type: 'Contact Form',
    file: 'contact-form',
    description: 'A contact form; messages arrive in the dashboard.',
    settings: [title('Get in touch'), description],
    example: { title: 'Get in touch', description: 'We reply within one working day.' }
  }
];

/** Settings every section accepts (rendered by PageRenderer's shared style layer). */
export const STYLE_SETTINGS: { group: string; settings: SettingDef[] }[] = [
  { group: 'Colors', settings: [
    { key: 'backgroundColor', type: 'color', label: 'Background', default: '#FFFFFF' },
    { key: 'headingColor', type: 'color', label: 'Heading' },
    { key: 'textColor', type: 'color', label: 'Text' },
    { key: 'subheadingColor', type: 'color', label: 'Subheading' },
    { key: 'cardTitleColor', type: 'color', label: 'Card title' },
    { key: 'cardTextColor', type: 'color', label: 'Card text' },
    { key: 'cardBgColor', type: 'color', label: 'Card background' },
    { key: 'badgeTextColor', type: 'color', label: 'Accent / badge text' },
    { key: 'badgeBgColor', type: 'color', label: 'Badge background' },
    { key: 'accentColor', type: 'color', label: 'Accent' },
    { key: 'borderColor', type: 'color', label: 'Borders' },
    { key: 'backgroundImageUrl', type: 'image', label: 'Background image' },
    { key: 'backgroundOverlay', type: 'number', label: 'Background image darkening', min: 0, max: 90, unit: '%' }
  ] },
  { group: 'Layout', settings: [
    { key: 'contentWidth', type: 'select', label: 'Content width', options: ['narrow', 'medium', 'wide', 'xl'], info: 'narrow 760px · medium 1040px · wide 1280px · xl 1440px. Ignored when fullWidth is true.' },
    { key: 'alignment', type: 'select', label: 'Text alignment', options: ['left', 'center', 'right'] },
    { key: 'mobileAlignment', type: 'select', label: 'Text alignment on mobile', options: ['left', 'center', 'right'] },
    { key: 'paddingTop', type: 'number', label: 'Top padding', min: 0, max: 160, unit: 'px' },
    { key: 'paddingBottom', type: 'number', label: 'Bottom padding', min: 0, max: 160, unit: 'px' },
    { key: 'paddingSide', type: 'number', label: 'Side padding', min: 0, max: 120, unit: 'px' },
    { key: 'paddingTopMobile', type: 'number', label: 'Top padding on mobile', min: 0, max: 120, unit: 'px' },
    { key: 'paddingBottomMobile', type: 'number', label: 'Bottom padding on mobile', min: 0, max: 120, unit: 'px' },
    { key: 'sectionRadius', type: 'number', label: 'Corner radius', min: 0, max: 48, unit: 'px' }
  ] },
  { group: 'Typography', settings: [
    { key: 'headingFont', type: 'font', label: 'Heading font', info: 'A key from schema/fonts.json; empty uses the page default.' },
    { key: 'titleFontSize', type: 'number', label: 'Heading size', min: 12, max: 96, unit: 'px' },
    { key: 'titleFontSizeMobile', type: 'number', label: 'Heading size on mobile', min: 12, max: 64, unit: 'px' },
    { key: 'headingWeight', type: 'select', label: 'Heading weight', options: ['300', '400', '500', '600', '700', '800', '900'] },
    { key: 'headingTransform', type: 'select', label: 'Heading letter case', options: ['none', 'uppercase', 'capitalize'] },
    { key: 'headingLetterSpacing', type: 'number', label: 'Heading letter spacing', min: -0.05, max: 0.3, unit: 'em' },
    { key: 'headingLineHeight', type: 'number', label: 'Heading line height', min: 0.8, max: 2 },
    { key: 'headingItalic', type: 'boolean', label: 'Italic headings' },
    { key: 'bodyFont', type: 'font', label: 'Body font' },
    { key: 'bodyFontSize', type: 'number', label: 'Body size', min: 10, max: 28, unit: 'px' },
    { key: 'bodyWeight', type: 'select', label: 'Body weight', options: ['300', '400', '500', '600'] },
    { key: 'bodyLineHeight', type: 'number', label: 'Body line height', min: 1, max: 2.4 },
    { key: 'bodyLetterSpacing', type: 'number', label: 'Body letter spacing', min: -0.02, max: 0.2, unit: 'em' }
  ] },
  { group: 'Buttons', settings: [
    { key: 'buttonStyle', type: 'select', label: 'Style', options: ['solid', 'outline', 'link'] },
    { key: 'buttonBgColor', type: 'color', label: 'Background' },
    { key: 'buttonTextColor', type: 'color', label: 'Label color' },
    { key: 'buttonRoundness', type: 'select', label: 'Corners', options: ['rounded-none', 'rounded', 'rounded-lg', 'rounded-xl', 'rounded-full'] },
    { key: 'buttonFontSize', type: 'number', label: 'Text size', min: 10, max: 22, unit: 'px' },
    { key: 'buttonUppercase', type: 'boolean', label: 'Uppercase labels' }
  ] },
  { group: 'Visibility & animation', settings: [
    { key: 'hidden', type: 'boolean', label: 'Hidden', info: 'Kept in the theme but not shown on the store.' },
    { key: 'hideOnDesktop', type: 'boolean', label: 'Hide on desktop' },
    { key: 'hideOnMobile', type: 'boolean', label: 'Hide on mobile' },
    { key: 'animation', type: 'select', label: 'Entrance animation', options: ['none', 'fade', 'slide-up', 'zoom'] }
  ] },
  { group: 'Advanced', settings: [
    { key: 'customCss', type: 'css', label: 'Custom CSS', info: 'Scoped to this section, e.g. "h2 { letter-spacing: 2px; }".' }
  ] }
];

export const PAGE_SETTINGS: SettingDef[] = [
  { key: 'headingFont', type: 'font', label: 'Default heading font' },
  { key: 'bodyFont', type: 'font', label: 'Default body font' },
  { key: 'backgroundColor', type: 'color', label: 'Page background' }
];

export const LINK_FORMATS: Record<string, string> = {
  '/': 'Home page',
  '/shop': 'All products',
  '/collections/<handle>': 'A collection',
  '/products/<handle>': 'A product',
  '/pages/<handle>': 'A page in this theme',
  '/blogs': 'Blog index',
  '/blogs/<handle>': 'A blog post',
  '/brands': 'Brands page',
  '/account': 'Customer account',
  'https://…': 'External site (opens in a new tab)'
};

export const SCHEMA_BY_TYPE = new Map(SECTION_SCHEMAS.map(s => [s.type, s]));
export const SCHEMA_BY_FILE = new Map(SECTION_SCHEMAS.map(s => [s.file, s]));
