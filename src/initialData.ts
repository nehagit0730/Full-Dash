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
        id: 'h-hero',
        type: 'Image banner',
        settings: {
          fullWidth: true, backgroundColor: '#1F1A17', headingColor: '#FFFFFF', textColor: '#FAF7F2',
          badgeText: 'New collection', title: 'The new season edit',
          description: 'Effortless silhouettes, considered fabrics and pieces made to be worn on repeat.',
          buttonText: 'Shop now', buttonLink: '/shop', buttonText2: 'Explore the lookbook', buttonLink2: '/shop', imageUrl: ''
        }
      },
      {
        id: 'h-marquee',
        type: 'Marquee text',
        settings: {
          fullWidth: true, backgroundColor: '#1F1A17', headingColor: '#FAF7F2', textColor: '#FAF7F2',
          title: 'Free shipping over ₹1,999 // New arrivals every week // Easy 14-day returns // Secure checkout', marqueeSpeed: 3
        }
      },
      {
        id: 'h-categories',
        type: 'Collection list',
        settings: {
          fullWidth: false, backgroundColor: '#FFFFFF', headingColor: '#1F1A17', textColor: '#6F6660',
          badgeText: 'Shop by category', title: 'Find your favourites', description: '', itemsCount: 4, selectedCollectionIds: []
        }
      },
      {
        id: 'h-featured',
        type: 'Featured collection',
        settings: {
          fullWidth: false, backgroundColor: '#FAF7F2', headingColor: '#1F1A17', textColor: '#6F6660',
          badgeText: 'Curated for you', title: 'Featured pieces', description: '', itemsCount: 8, showTabs: true, buttonText: 'View all', buttonLink: '/shop'
        }
      },
      {
        id: 'h-story',
        type: 'Image with text',
        settings: {
          fullWidth: false, backgroundColor: '#FFFFFF', headingColor: '#1F1A17', textColor: '#6F6660',
          badgeText: 'Our story', title: 'Made slowly, worn endlessly',
          description: 'Every piece starts with fabric we would want to wear ourselves. We work with small workshops, in limited runs, so what you buy is made with care — and made to last.',
          buttonText: 'Discover more', buttonLink: '/pages/about', imageUrl: '', imagePosition: 'left'
        }
      },
      {
        id: 'h-columns',
        type: 'Text column with image',
        settings: {
          fullWidth: false, backgroundColor: '#FFFFFF', headingColor: '#1F1A17', textColor: '#6F6660',
          badgeText: 'Why choose us', title: 'The details make the difference', description: ''
        }
      },
      {
        id: 'h-lookbook',
        type: 'Images gallery',
        settings: {
          fullWidth: false, backgroundColor: '#FAF7F2', headingColor: '#1F1A17', textColor: '#6F6660',
          badgeText: 'Lookbook', title: 'Styled in the everyday', description: 'Moments from our latest shoot — see how the collection wears.'
        }
      },
      {
        id: 'h-service',
        type: 'Icon with text',
        settings: {
          fullWidth: false, backgroundColor: '#FFFFFF', headingColor: '#1F1A17', textColor: '#6F6660', title: '', description: ''
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

