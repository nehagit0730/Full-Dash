export interface ProductVariant {
  id: string;
  name: string; // e.g. "Size", "Strength"
  values: string[]; // e.g. ["Medium", "Large"]
}

export interface VariantDetail {
  id: string; // Every product variant should have its own unique Product ID
  name: string; // Combination name, e.g. "Tropical Punch"
  price: number;
  inventory: number;
  description: string;
  images: string[]; // Upload different images for each variant
  flavour?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice: number;
  inventory: number;
  sku: string;
  category: string;
  vendor: string; // Brand name (e.g. 77, CUBA, CLEW, etc.)
  status: 'Active' | 'Draft' | 'Archived' | 'Unlisted';
  image: string;
  weight: number;
  tags: string[];
  media?: string[]; // Multiple media URLs
  variants?: ProductVariant[]; // Option list matching Shopify-style variants
  concreteVariants?: VariantDetail[]; // Custom physical variant details
  barcode?: string;
  weightUnit?: string; // 'g' | 'kg' | 'oz' | 'lb'
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string;
  updatedAt?: string;
  strength?: string;
  flavour?: string;
  variant?: string;
  concreteVariantName?: string;
  isVariantCard?: boolean;
  concreteVariantId?: string;
  parentSlug?: string;
  parentId?: string;
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  type: 'Manual' | 'Smart';
  image: string;
  productIds: string[];
  productConditions?: string; // string explaining the conditions
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: string; // e.g. CT48884
  customerName: string;
  customerEmail: string;
  tags: string[];
  isSubscription?: boolean;
  subscriptionCancelled?: boolean;
  subscriptionCancelledAt?: string;
  subscriptionCancellationReason?: string;
  // Set when a customer resumes a cancelled plan, so the admin dashboard shows
  // that the subscription is running again rather than only losing its
  // cancellation banner.
  subscriptionResumedAt?: string;
  // Which subscription this order belongs to. Lets one plan be cancelled or
  // resumed without touching another plan's orders.
  subscriptionId?: string;
  subscriptionDetails?: {
    planName: string;
    frequency: string;
    frequencyDiscount: string;
    paymentStatus: string;
    lastPaymentDate?: string;
    nextPaymentDate?: string;
    [key: string]: any;
  };
  fulfillmentStatus: 'Unfulfilled' | 'Shipped' | 'Fulfilled' | 'Delivered' | 'Cancelled' | 'Exchanged';
  paymentStatus?: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  returnRequest?: {
    type: string;
    reason: string;
    itemsToReturn?: any[];
    exchangeNotes?: string;
    refundMethod?: string;
    status: string;
    requestedAt?: string;
    processedAt?: string;
    completedAt?: string;
    declinedReason?: string;
  };
  /**
   * The payment gateway's reference for this order's payment (for Razorpay,
   * the payment id), shown against the order in the admin dashboard.
   */
  gatewayTxId?: string;
  gatewayAuthCode?: string;
  cardBrand?: string;
  total: number;
  storeCreditApplied?: number;
  destination: string;
  date: string; // e.g. Today at 10:28 pm
  deliveryMethod: string;
  items: {
    productId: string;
    productTitle: string;
    price: number;
    quantity: number;
    image?: string;
  }[];
  trackingId?: string;
  trackingNumber?: string;
  carrier?: string;
  trackingHistory?: {
    status: string;
    date: string;
    location: string;
    description: string;
  }[];
  discountApplied?: Discount | null;
  createdAt?: string;
  data?: any;
}

export interface FileEntry {
  id: string;
  fileName: string;
  altText: string;
  dateAdded: string;
  size: string;
  references: string;
  url: string;
  mimeType?: string;
  publicId?: string;
  resourceType?: string;
  secureUrl?: string;
  originalFilename?: string;
  fileSize?: number;
  folder?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subscriptionStatus: 'Subscribed' | 'Not subscribed' | 'Unsubscribed';
  location: string;
  ordersCount: number;
  amountSpent: number;
  addresses: string[];
  wishlist: string[]; // Product IDs
  referralCode?: string;
  storeCredit?: number;
  referredByCode?: string | null;
  subStatus?: string;
  subPlan?: string;
  subFrequency?: string;
  subCansCount?: number;
  subPrice?: number;
  nextPayment?: string;
  nextDelivery?: string;
}

/**
 * One can the customer picked for a "FREE can of your choice" reward. Cans are
 * not pushed into the cart — a ₹0 line would distort the volume-price tiers and
 * the minimum-quantity checks on other discounts — so the selection rides along
 * on the discount and is materialised as a ₹0 order line at submission.
 */
export interface FreeCanSelection {
  productId: string;
  productTitle: string;
  vendor: string; // Brand, e.g. "velo"
  variantName: string; // Flavour/variant, e.g. "Watermelon ice"
  variantId?: string;
  image: string;
  sku?: string;
  strength?: string;
  originalPrice: number; // What the can would have cost, for "was ₹4.99" display
}

/** A non-product gift (mystery box, merchandise) included with the order at ₹0. */
export interface RewardGift {
  id: string;
  label: string;
  image: string;
  note?: string;
}

export interface Discount {
  id: string;
  title: string; // Code name, e.g. CRUSHCLUB15
  status: 'Active' | 'Expired';
  method: string; // e.g. "Code", "1 code"
  eligibility: string; // e.g. "All customers", email
  type: 'Amount off products' | 'Buy X get Y' | 'Amount off order' | 'Free shipping' | 'Loyalty Reward';
  used: number;
  details: string; // e.g. "15% off one-time purchase products"

  // Loyalty milestone reward mechanics. Set by resolveDiscountCode when a
  // loyalty voucher code is applied; drives the free-can picker, the shipping
  // waiver and the gift lines shown with the order.
  loyaltyMilestoneCode?: string; // Base code, e.g. "BRONZE3"
  rewardKind?: 'discount' | 'free-cans' | 'free-shipping' | 'gift' | 'choice';
  freeCanCount?: number; // How many cans the customer gets to choose
  freeCanSelections?: FreeCanSelection[]; // What they chose
  rewardGifts?: RewardGift[]; // Mystery box / merchandise included at ₹0
  rewardChoiceId?: string; // Which option was taken on a multi-option reward

  // Loyalty Reward custom properties
  loyaltyRewardType?: 'B1G1' | 'Percentage Off' | 'Reward Points' | 'Custom';
  loyaltyRewardValue?: string | number;
  loyaltyCustomerSelection?: 'All customers' | 'Specific customers';
  loyaltyCustomerEmails?: string[];
  loyaltyProductSelection?: 'All products' | 'Specific products';
  loyaltyProductIds?: string[];
  loyaltyCollectionSelection?: 'All collections' | 'Specific collections';
  loyaltyCollectionIds?: string[];
  
  // Custom Shopify-like properties
  valueType?: 'Percentage' | 'Fixed amount';
  valueAmount?: number;
  
  // Applies to (for Amount off products)
  appliesToType?: 'Specific products' | 'Specific collections';
  appliesToIds?: string[]; // IDs of products or collections
  
  // Buy X get Y
  customerBuysType?: 'Minimum quantity of items' | 'Minimum purchase amount';
  customerBuysValue?: number;
  customerBuysAppliesToType?: 'Specific products' | 'Specific collections';
  customerBuysAppliesToIds?: string[];
  
  customerGetsValue?: number;
  customerGetsAppliesToType?: 'Specific products' | 'Specific collections';
  customerGetsAppliesToIds?: string[];
  customerGetsDiscountType?: 'Percentage' | 'Amount off each' | 'Free';
  customerGetsDiscountValue?: number;
  maxUsesPerOrder?: number;
  
  // Minimum purchase requirements
  minRequirementsType?: 'No minimum requirements' | 'Minimum purchase amount ($)' | 'Minimum quantity of items';
  minRequirementsValue?: number;
  
  // Maximum discount uses
  limitTotalUses?: boolean;
  limitTotalUsesCount?: number;
  limitOnePerCustomer?: boolean;
  
  // Combinations
  combineWithProductDiscounts?: boolean;
  combineWithOrderDiscounts?: boolean;
  combineWithShippingDiscounts?: boolean;
  
  // Active dates
  startDate?: string;
  startTime?: string;
  hasEndDate?: boolean;
  endDate?: string;
  endTime?: string;
  
  // Countries (for Free shipping)
  countriesType?: 'All countries' | 'Selected countries';
  selectedCountries?: string[];
  excludeShippingRatesOverAmount?: boolean;
  excludeShippingRatesAmount?: number;
  
  // Sales channel access
  allowOnSelectedChannels?: boolean;
  
  // Tags
  tags?: string[];
}

export type DiscountCode = Discount;
export type DiscountType = 'Amount off products' | 'Buy X get Y' | 'Amount off order' | 'Free shipping' | 'Loyalty Reward';

export interface PageSection {
  id: string;
  type: 'Image banner' | 'Video banner' | 'Image with text' | 'Text column with image' | 'Rich text' | 'Marquee text' | 'Marquee images' | 'Logo list' | 'Collection list' | 'Featured collection' | 'Images gallery' | 'FAQs' | 'Slideshow' | 'Blog post' | 'Brand list' | 'Icon with text' | 'Brands we offer' | 'How it works' | 'Trust badges' | 'Plans' | 'Clearance Sale' | 'Contact Form';
  settings: {
    [key: string]: any;
    fullWidth: boolean;
    backgroundColor: string; // hex
    headingColor: string; // hex
    textColor: string; // hex
    subheadingColor?: string;
    cardTitleColor?: string;
    cardTextColor?: string;
    itemTitleColor?: string;
    itemTextColor?: string;
    questionTextColor?: string;
    answerTextColor?: string;
    badgeTextColor?: string;
    badgeBgColor?: string;
    buttonTextColor?: string;
    buttonBgColor?: string;
    buttonText2?: string;
    buttonLink2?: string;
    buttonText2Color?: string;
    buttonBg2Color?: string;
    imageLink?: string;
    bannerLink?: string;
    promoLink?: string;
    iconColor?: string; // hex
    alertBadgeText?: string;
    promoBannerText?: string;
    trustBadges?: {
      iconType: 'badge' | 'shield' | 'globe' | 'tag';
      title: string;
      description: string;
      linkUrl?: string;
    }[];
    iconItems?: {
      iconName: 'Truck' | 'Zap' | 'Shield' | 'Clock' | 'Award' | 'Package' | 'Heart' | 'HelpCircle' | 'Star';
      title: string;
      description: string;
      linkUrl?: string;
    }[];
    title?: string;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
    imageUrl?: string;
    videoUrl?: string;
    videoEmbed?: string;
    videoMp4Url?: string;
    marqueeSpeed?: number;
    itemsCount?: number;
    selectedCollectionId?: string;
    selectedCollectionIds?: string[];
    columnsDesktop?: number;
    columnsMobile?: number;
    brandItems?: {
      imageUrl: string;
      linkUrl: string;
      title?: string;
    }[];
    stepItems?: {
      number: string;
      title: string;
      description: string;
      imageUrl: string;
      linkUrl?: string;
    }[];
    galleryItems?: {
      imageUrl: string;
      title?: string;
      linkUrl?: string;
    }[];
    logoItems?: {
      imageUrl: string;
      title?: string;
      linkUrl?: string;
    }[];
    slides?: {
      title: string;
      description: string;
      imageUrl: string;
      buttonText: string;
      buttonLink: string;
      buttonText2?: string;
      buttonLink2?: string;
      slideLink?: string;
    }[];
    planItems?: {
      slug: 'lite' | 'core' | 'pro' | 'ultimate';
      name: string;
      price: number;
      limit: number;
      saveAmountText?: string;
      imageUrl?: string;
      features?: string[];
      extraText?: string;
      subtitle?: string;
      isPopular?: boolean;
      buttonText?: string;
      buttonLink?: string;
    }[];
  };
  blocks?: any[]; // for columns, items, faqs etc.
}

export interface CustomPage {
  id: string;
  title: string;
  slug: string;
  visibility: 'Visible' | 'Hidden';
  updatedAt: string;
  sections: PageSection[];
  isHomepage?: boolean;
}

export interface CartItem {
  productId: string;
  productTitle: string;
  price: number;
  image: string;
  quantity: number;
  vendor: string;
  isSubscription?: boolean;
  subscriptionPlan?: string;
  subscriptionFrequency?: string;
  frequencyDiscount?: string;
  subscriptionItems?: any[];
  variant?: string;
  sku?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  category: string;
  status: 'Active' | 'Draft' | 'Archived';
  publishedAt: string;
  readTime: string;
  tags: string[];
}

export interface MenuItem {
  id: string;
  label: string;
  tab: string; // tab name e.g. 'frontend-home', 'frontend-subscribe', 'frontend-shop', etc., or custom page tab
  type: 'tab' | 'external';
  url?: string;
}

export interface LayoutSettings {
  headerLogoText: string;
  headerLogoSubtext: string;
  headerLogoImage: string; // Base64 or URL
  footerLogoText: string;
  footerLogoDescription: string;
  footerLogoImage: string; // Base64 or URL
  menuItems: MenuItem[];
  /** 'theme' (default) shows the built-in storefront home page; 'page-builder' shows the page marked as homepage. */
  homepageSource?: 'theme' | 'page-builder';
  klaviyoPublicKey?: string;
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
}

export interface CustomHtmlSnippet {
  id: string;
  name: string;
  key: string;
  description?: string;
  code: string;
  enabled: boolean;
  createdAt?: string;
}

export interface ThirdPartyIntegrations {
  googleAnalyticsId: string;
  googleAnalyticsEnabled: boolean;
  googleTagManagerId: string;
  googleTagManagerEnabled: boolean;
  metaPixelId: string;
  metaPixelEnabled: boolean;
  tikTokPixelId: string;
  tikTokPixelEnabled: boolean;
  microsoftClarityId: string;
  microsoftClarityEnabled: boolean;
  hotjarSiteId: string;
  hotjarEnabled: boolean;
  customWebhookUrl: string;
  customWebhookEnabled: boolean;
}

export interface DevSettings {
  customCss: string;
  customCssEnabled: boolean;
  customJs: string;
  customJsEnabled: boolean;
  customHeadCode: string;
  customHeadEnabled: boolean;
  customBodyCode: string;
  customBodyEnabled: boolean;
  snippets: CustomHtmlSnippet[];
  integrations: ThirdPartyIntegrations;
  updatedAt?: string;
}


