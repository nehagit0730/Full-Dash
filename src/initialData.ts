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
          title: 'New season, new favourites',
          description: 'Discover our latest arrivals and everyday essentials.',
          buttonText: 'Shop now',
          buttonLink: '/shop',
          imageUrl: ''
        }
      },
      {
        id: 'h-s2',
        type: 'Featured collection',
        settings: {
          fullWidth: false,
          backgroundColor: '#FFFFFF',
          headingColor: '#111827',
          textColor: '#4B5563',
          title: 'Featured products',
          description: '',
          itemsCount: 8
        }
      },
      {
        id: 'h-s3',
        type: 'Collection list',
        settings: {
          fullWidth: false,
          backgroundColor: '#F9FAFB',
          headingColor: '#111827',
          textColor: '#4B5563',
          title: 'Shop by category',
          description: '',
          itemsCount: 4,
          selectedCollectionIds: []
        }
      },
      {
        id: 'h-s4',
        type: 'Icon with text',
        settings: {
          fullWidth: false,
          backgroundColor: '#FFFFFF',
          headingColor: '#111827',
          textColor: '#4B5563',
          title: 'Why shop with us',
          iconColor: '#111827',
          iconItems: [
            { iconName: 'Truck', title: 'Free delivery', description: 'On qualifying orders, tracked to your door.', linkUrl: '' },
            { iconName: 'Shield', title: 'Secure checkout', description: 'Cards, UPI and wallets, fully encrypted.', linkUrl: '' },
            { iconName: 'Package', title: 'Easy returns', description: 'Changed your mind? Returns are simple.', linkUrl: '' },
            { iconName: 'Heart', title: 'Here to help', description: 'Friendly support before and after you buy.', linkUrl: '' }
          ]
        }
      }
    ]
  },
  {
    id: 'brands',
    title: 'Collections',
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
          title: 'Shop by collection',
          description: 'Browse everything we offer, organised by collection.',
        }
      },
      {
        id: 's3',
        type: 'Collection list',
        settings: {
          fullWidth: false,
          backgroundColor: '#FFFFFF',
          headingColor: '#0C1017',
          textColor: '#64748B',
          title: 'All collections',
          description: '',
          itemsCount: 24,
          selectedCollectionIds: []
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
          title: 'About us',
          description: 'We are an independent online store bringing you carefully chosen products, fair prices and friendly service — delivered to your door.'
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
          title: 'Get in touch',
          description: 'Have a question about an order, delivery or a product? Send us a message and our team will get back to you within one working day.'
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

