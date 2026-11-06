import { Product, Collection, Order, FileEntry, Customer, Discount, CustomPage, BlogPost } from './types';

export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_COLLECTIONS: Collection[] = [];
export const INITIAL_ORDERS: Order[] = [];
export const INITIAL_FILES: FileEntry[] = [];
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_DISCOUNTS: Discount[] = [];
export const INITIAL_BLOGS: BlogPost[] = [];

export const DEFAULT_PAGES: CustomPage[] = [
  {
    id: 'homepage',
    title: 'Home Page',
    slug: '',
    visibility: 'Visible',
    updatedAt: 'Jun 23, 2026',
    isHomepage: true,
    sections: [
      {
        id: 'h-s1',
        type: 'Image banner',
        settings: {
          fullWidth: true,
          backgroundColor: '#111827',
          headingColor: '#FFFFFF',
          textColor: '#E5E7EB',
          title: 'Pouch Supply Storefront',
          description: 'Start managing your products, collections, and page sections inside the Admin Dashboard.',
          buttonText: 'View Store Catalog',
          buttonLink: 'frontend-shop',
          imageUrl: ''
        }
      }
    ]
  },
  {
    id: 'brands',
    title: 'Brands Directory',
    slug: 'brands',
    visibility: 'Visible',
    updatedAt: 'Jun 23, 2026',
    sections: [
      {
        id: 's2',
        type: 'Rich text',
        settings: {
          fullWidth: false,
          backgroundColor: '#FFFFFF',
          headingColor: '#1E293B',
          textColor: '#64748B',
          title: 'Official Brands Matrix',
          description: 'Explore our catalog of certified compounding premium brands retrieved directly from our synchronized database.',
        }
      },
      {
        id: 's3',
        type: 'Brand list',
        settings: {
          fullWidth: false,
          backgroundColor: '#FFFFFF',
          headingColor: '#0C1017',
          textColor: '#64748B',
          title: 'Official Brands Directory',
          description: 'Explore our catalog of certified compounding premium brands.',
          brandItems: [
            { title: '77', linkUrl: '/collections/77', imageUrl: '' },
            { title: 'Cuba', linkUrl: '/collections/cuba', imageUrl: '' },
            { title: 'Killa', linkUrl: '/collections/killa', imageUrl: '' },
            { title: 'Pablo', linkUrl: '/collections/pablo', imageUrl: '' },
            { title: 'Velo', linkUrl: '/collections/velo', imageUrl: '' },
            { title: 'White Fox', linkUrl: '/collections/white-fox', imageUrl: '' },
            { title: 'Zyn', linkUrl: '/collections/zyn', imageUrl: '' },
            { title: 'XQS', linkUrl: '/collections/xqs', imageUrl: '' },
            { title: 'Nordic Spirit', linkUrl: '/collections/nordic-spirit', imageUrl: '' },
            { title: 'Clew', linkUrl: '/collections/clew', imageUrl: '' },
            { title: 'Fumi', linkUrl: '/collections/fumi', imageUrl: '' },
            { title: 'Snu', linkUrl: '/collections/snu', imageUrl: '' }
          ]
        }
      }
    ]
  },
  {
    id: 'about',
    title: 'About Us',
    slug: 'about',
    visibility: 'Visible',
    updatedAt: 'Jul 20, 2026',
    sections: [
      {
        id: 'about-sec-1',
        type: 'Rich text',
        settings: {
          fullWidth: false,
          backgroundColor: '#FFFFFF',
          headingColor: '#0F172A',
          textColor: '#475569',
          title: 'About Pouch Supply',
          description: 'Pouch Supply is Europe’s premier directory and depot for tobacco-free nicotine slim white canisters. We source directly from certified manufacturing laboratories across Sweden, Poland, Germany, and Europe, ensuring 100% genuine products, freshness guarantees, and rapid worldwide dispatch.'
        }
      },
      {
        id: 'about-sec-2',
        type: 'Trust badges',
        settings: {
          fullWidth: false,
          backgroundColor: '#F8FAFC',
          headingColor: '#0F172A',
          textColor: '#64748B'
        }
      }
    ]
  },
  {
    id: 'contact',
    title: 'Contact Us',
    slug: 'contact',
    visibility: 'Visible',
    updatedAt: 'Aug 04, 2026',
    sections: [
      {
        id: 'contact-sec-1',
        type: 'Contact Form',
        settings: {
          fullWidth: false,
          backgroundColor: '#FFFFFF',
          headingColor: '#0F172A',
          textColor: '#475569',
          title: 'Get in Touch with Our Team',
          description: 'Have questions about your order, shipping, or nicotine pouch brands? Fill out the form below or reach us directly. Our customer support team responds within 24 hours.'
        }
      },
      {
        id: 'contact-sec-2',
        type: 'Trust badges',
        settings: {
          fullWidth: false,
          backgroundColor: '#F8FAFC',
          headingColor: '#0F172A',
          textColor: '#64748B'
        }
      }
    ]
  }
];

