import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Product, Collection, Order, FileEntry, Customer, Discount, CustomPage, PageSection, BlogPost, LayoutSettings, MenuItem, DevSettings } from '../types';
import { 
  TrendingUp, BarChart3, Package, Users, Tag, FileCode, HardDrive, Percent, 
  Search, Plus, Eye, CheckCircle2, Clipboard, ArrowUpDown, ChevronRight, 
  Trash2, Filter, Save, Sparkles, Building, Settings, Image as ImageIcon, 
  X, MoveUp, MoveDown, Layout, Globe, Mail, DollarSign, ShoppingBag, EyeOff, RefreshCw, AlertTriangle, GripVertical,
  Columns, Grid, Video, HelpCircle, FolderHeart, Layers, Award, PlaySquare, Compass, ShieldCheck, ChevronLeft,
  ChevronDown, ChevronUp, Star, Heart, FileText, BookOpen, LayoutGrid, Database, Server, Lock, Gift, Check, Clock, Truck, ArrowRight, Zap, Shield,
  Pencil, Copy, Bold, Italic, Underline, AlignLeft, Link, Calendar, ArrowLeft, MoreHorizontal, Code, FileEdit, LogOut, Download, Upload, Info, Terminal
} from 'lucide-react';
import ImageUploadInput, { renderMediaThumbnail, isVideoUrl, isPdfOrDocUrl } from './ImageUploadInput';
import { cleanMediaUrl, PLACEHOLDER_IMAGE } from '../utils/mediaUtils';
import { parseOrderTime } from '../utils';
import CollectionEditor from './CollectionEditor';
import ProductEditor from './ProductEditor';
import BlogContentEditor from './BlogContentEditor';
import DiscountEditor from './DiscountEditor';
import { Crown, Flame, Cloud } from 'lucide-react';
import AnalyticsTab from './admin/AnalyticsTab';
import FilesTab from './admin/FilesTab';
import OrdersTab from './admin/OrdersTab';
import CustomersTab from './admin/CustomersTab';
import CollectionsTab from './admin/CollectionsTab';
import ProductsTab from './admin/ProductsTab';
import DiscountsTab from './admin/DiscountsTab';
import BlogsTab from './admin/BlogsTab';
import LayoutTab from './admin/LayoutTab';
import PagesTab from './admin/PagesTab';
import ThemesTab from './admin/ThemesTab';
import AdminSidebar, { AdminSection, SECTION_LABELS } from './admin/AdminSidebar';
import { Menu } from 'lucide-react';
import { readAdminPath, readQueryParam, useUrlParam, writeAdminRecord } from '../lib/adminUrlState';
import { Palette } from 'lucide-react';
import DevelopmentTab from './admin/DevelopmentTab';
import { DiagnosticsTab } from './admin/DiagnosticsTab';
import RecycleBinTab from './admin/RecycleBinTab';
import { EmailSettingsTab } from './admin/EmailSettingsTab';
import IntegrationsSettingsTab from './admin/IntegrationsSettingsTab';
import { Activity } from 'lucide-react';

export const AVAILABLE_SECTION_TEMPLATES = [
  { type: 'Image banner', label: 'Image banner', desc: 'A large hero image with a heading, text and buttons.', icon: 'ImageIcon' },
  { type: 'Slideshow', label: 'Slideshow', desc: 'Rotating full-width slides, each with its own image and call to action.', icon: 'PlaySquare' },
  { type: 'Video banner', label: 'Video banner', desc: 'A muted, looping background video (MP4 or YouTube) with a heading and button.', icon: 'Video' },
  { type: 'Featured collection', label: 'Featured collection', desc: 'A product grid from one collection, with New / Bestsellers / On sale tabs.', icon: 'ShoppingBag' },
  { type: 'Collection list', label: 'Collection list', desc: 'Cards that link to your collections.', icon: 'FolderHeart' },
  { type: 'Clearance Sale', label: 'Sale products', desc: 'Products on sale (or hand-picked), shown at their real prices.', icon: 'Flame' },
  { type: 'Image with text', label: 'Image with text', desc: 'An image beside a heading, text and button.', icon: 'Columns' },
  { type: 'Text column with image', label: 'Multicolumn', desc: 'Three columns of short text, each with an optional image.', icon: 'Grid' },
  { type: 'Rich text', label: 'Rich text', desc: 'A heading, paragraph and optional button.', icon: 'FileText' },
  { type: 'Icon with text', label: 'Icon with text', desc: 'Icons with short headings — delivery, returns, guarantees.', icon: 'Sparkles' },
  { type: 'Trust badges', label: 'Trust badges', desc: 'A row of store guarantees.', icon: 'Award' },
  { type: 'How it works', label: 'Our process', desc: 'Numbered steps with images — how your pieces are designed, made and delivered.', icon: 'Compass' },
  { type: 'Marquee text', label: 'Scrolling text', desc: 'A continuously scrolling strip of short messages.', icon: 'Sparkles' },
  { type: 'Marquee images', label: 'Image reel', desc: 'A horizontal reel of images (or your latest products).', icon: 'Layers' },
  { type: 'Images gallery', label: 'Image gallery', desc: 'A grid of images.', icon: 'Layout' },
  { type: 'Logo list', label: 'Logo list', desc: 'A row of partner or press logos.', icon: 'Award' },
  { type: 'Brand list', label: 'Brand list', desc: 'Image cards for brands, each linking to a collection.', icon: 'LayoutGrid' },
  { type: 'Brands we offer', label: 'Brand carousel', desc: 'A scrolling carousel of brand cards.', icon: 'Layers' },
  { type: 'Blog post', label: 'Blog posts', desc: 'Your latest published blog posts.', icon: 'BookOpen' },
  { type: 'FAQs', label: 'FAQ', desc: 'Expandable questions and answers.', icon: 'HelpCircle' },
  { type: 'Contact Form', label: 'Contact form', desc: 'A contact form; messages arrive in your dashboard and by email.', icon: 'Mail' }
] as const;

/**
 * Starting content for a newly added section: neutral copy any store can
 * keep or overwrite. Image slots start empty (the renderer shows a tidy
 * placeholder) so no stock photo or demo video ends up live by accident.
 */
export function defaultSectionSettings(type: PageSection['type']): PageSection['settings'] {
  // Images start empty: every section shows a matching fashion placeholder
  // until the merchant uploads their own, so nothing looks broken.
  const fullWidth = type === 'Image banner' || type === 'Slideshow' || type === 'Marquee text' || type === 'Video banner';
  const base: PageSection['settings'] = {
    fullWidth,
    backgroundColor: type === 'Marquee text' ? '#1F1A17' : type === 'Trust badges' || type === 'Icon with text' ? '#FAF7F2' : '#FFFFFF',
    headingColor: '#1F1A17',
    textColor: type === 'Marquee text' ? '#FAF7F2' : '#6F6660'
  };
  const brandItems = ['Maison Lune', 'Northwear', 'Atelier Noir', 'Oak & Linen', 'Solstice', 'Verdant Co.'].map(title => ({ imageUrl: '', linkUrl: '/shop', title }));

  switch (type) {
    case 'Image banner':
      return { ...base, badgeText: 'New collection', title: 'The new season edit', description: 'Effortless silhouettes, considered fabrics and pieces made to be worn on repeat.', buttonText: 'Shop women', buttonLink: '/shop', buttonText2: 'Explore the lookbook', buttonLink2: '/shop', imageUrl: '' };
    case 'Slideshow':
      return { ...base, slides: [
        { title: 'Summer, simplified', description: 'Light linens and easy shapes for long, warm days.', imageUrl: '', buttonText: 'Shop the edit', buttonLink: '/shop' },
        { title: 'The knitwear edit', description: 'Soft textures and quiet colours, made to layer.', imageUrl: '', buttonText: 'Discover knitwear', buttonLink: '/shop' },
        { title: 'Made to last', description: 'Timeless pieces designed for every day — and every year after.', imageUrl: '', buttonText: 'Shop essentials', buttonLink: '/shop' }
      ] };
    case 'Video banner':
      return { ...base, badgeText: 'The campaign', title: 'Designed to move with you', description: 'Discover the new collection — made in small batches from fabrics we love.', buttonText: 'Shop the collection', buttonLink: '/shop', videoUrl: '', videoMp4Url: '', showFeatureBar: true };
    case 'Image with text':
      return { ...base, badgeText: 'Our story', title: 'Made slowly, worn endlessly', description: 'Every piece starts with fabric we would want to wear ourselves. We work with small workshops, in limited runs, so what you buy is made with care — and made to last.', buttonText: 'Discover more', buttonLink: '/pages/about', imageUrl: '', imagePosition: 'left' };
    case 'Text column with image':
      return { ...base, badgeText: 'Why choose us', title: 'The details make the difference', description: '', columnItems: [
        { title: 'Considered fabrics', description: 'Organic cotton, linen and recycled fibres — chosen for how they feel and how long they last.', imageUrl: '', badge: 'Materials', linkUrl: '' },
        { title: 'Made in small batches', description: 'We produce in limited runs with workshops we know by name, so nothing goes to waste.', imageUrl: '', badge: 'Craft', linkUrl: '' },
        { title: 'Delivered with care', description: 'Plastic-free packaging, tracked shipping and easy 14-day returns on every order.', imageUrl: '', badge: 'Service', linkUrl: '' }
      ] };
    case 'Rich text':
      return { ...base, badgeText: 'Our philosophy', title: 'Fewer, better things', description: 'We design wardrobe staples with honest materials and timeless shapes — pieces that feel as good in five years as they do today.', buttonText: 'Read our story', buttonLink: '/pages/about' };
    case 'Featured collection':
      return { ...base, badgeText: 'Curated for you', title: 'Featured pieces', description: '', itemsCount: 8, showTabs: true, buttonText: 'View all', buttonLink: '/shop' };
    case 'Collection list':
      return { ...base, badgeText: 'Shop by category', title: 'Find your favourites', description: '', itemsCount: 4 };
    case 'Clearance Sale':
      return { ...base, badgeText: 'Limited time', title: 'The sale', description: 'Selected styles at their lowest prices of the season — while sizes last.', selectedProductIds: [], itemsCount: 8, buttonText: 'Shop the sale', buttonLink: '/shop' };
    case 'Marquee text':
      return { ...base, title: 'Free shipping over ₹1,999 // New arrivals every week // Easy 14-day returns // Secure checkout', marqueeSpeed: 3 };
    case 'Marquee images':
      return { ...base, badgeText: 'Just landed', title: 'New in', itemsCount: 8, buttonText: 'Shop all', buttonLink: '/shop' };
    case 'Images gallery':
      return { ...base, badgeText: 'Lookbook', title: 'Styled in the everyday', description: 'Moments from our latest shoot — see how the collection wears.' };
    case 'Logo list':
      return { ...base, badgeText: 'As seen in', title: 'Loved by the press', description: '' };
    case 'FAQs': {
      const faqs = [
        { q: 'How long does delivery take?', a: 'Orders are dispatched within 1–2 working days and usually arrive in 3–7 days, with tracking.' },
        { q: 'What is your returns policy?', a: 'Return unworn items with their tags within 14 days of delivery — start a return from your account.' },
        { q: 'How do I find my size?', a: 'Every product page has a size guide with garment measurements. Between sizes? Size up for a relaxed fit.' },
        { q: 'How should I care for my pieces?', a: 'Follow the care label — most of our garments prefer a cool, gentle wash and drying flat.' }
      ].map(x => ({ ...x, question: x.q, answer: x.a }));
      return { ...base, badgeText: 'Help & FAQ', title: 'Questions, answered', description: 'Everything you need to know about orders, delivery and returns.', faqItems: faqs, faqs, buttonText: 'Still have a question? Contact us', buttonLink: '/pages/contact' };
    }
    case 'Blog post':
      return { ...base, badgeText: 'The journal', title: 'Stories & style notes', description: '', columnsDesktop: 3, columnsMobile: 1, buttonText: 'Read the journal' };
    case 'Brand list':
      return { ...base, badgeText: 'Our brands', title: 'Shop by brand', description: '', brandItems, layout: 'grid' };
    case 'Brands we offer':
      return { ...base, badgeText: 'The labels we love', title: 'Brands we carry', description: 'Independent labels and modern classics, hand-picked for quality and timeless design.', brandItems };
    case 'Icon with text':
      return { ...base, title: '', description: '', iconItems: [
        { iconName: 'Truck', title: 'Free shipping', description: 'Complimentary delivery on orders over ₹1,999.', linkUrl: '' },
        { iconName: 'RotateCcw', title: 'Easy returns', description: 'Changed your mind? Return within 14 days.', linkUrl: '' },
        { iconName: 'Shield', title: 'Secure payment', description: 'Cards, UPI and wallets — fully encrypted.', linkUrl: '' },
        { iconName: 'Leaf', title: 'Responsibly made', description: 'Natural fibres and low-impact packaging.', linkUrl: '' }
      ] };
    case 'How it works':
      return { ...base, badgeText: 'Our process', title: 'From sketch to your wardrobe', description: '', buttonText: 'Discover our story', buttonLink: '/pages/about', stepItems: [
        { number: '1', title: 'Designed in-house', description: 'Every piece begins as a sketch in our studio, refined through fittings until it feels just right.', imageUrl: '' },
        { number: '2', title: 'Crafted with care', description: 'Small, trusted workshops cut and sew each garment in limited runs — never mass-produced.', imageUrl: '' },
        { number: '3', title: 'Delivered to you', description: 'Packed by hand in plastic-free packaging and shipped with tracking straight to your door.', imageUrl: '' }
      ] };
    case 'Trust badges':
      return { ...base, trustBadges: [
        { iconType: 'badge', title: 'Quality guaranteed', description: 'Every piece inspected before it ships' },
        { iconType: 'shield', title: 'Secure checkout', description: 'Encrypted payments you can trust' },
        { iconType: 'globe', title: 'Tracked delivery', description: 'Follow your order to the door' },
        { iconType: 'tag', title: 'Fair pricing', description: 'Honest prices, no inflated markups' }
      ] };
    case 'Contact Form':
      return { ...base, badgeText: 'Customer care', title: 'We would love to hear from you', description: 'Questions about an order, sizing or a product? Send us a note and our team will get back to you within one working day.', contactEmail: '', contactPhone: '', contactAddress: '', contactHours: '', imageUrl: '' };
    default:
      return { ...base, title: String(type), description: '' };
  }
}

export const getSectionLabel = (type: string): string => {
  const found = AVAILABLE_SECTION_TEMPLATES.find(t => t.type === type);
  return found ? found.label : type;
};

export const getSectionIcon = (type: string) => {
  switch (type) {
    case 'Image banner': return <ImageIcon className="h-4 w-4 text-slate-600" />;
    case 'Image with text': return <Columns className="h-4 w-4 text-slate-600" />;
    case 'Text column with image': return <Grid className="h-4 w-4 text-slate-600" />;
    case 'Featured collection': return <ShoppingBag className="h-4 w-4 text-slate-600" />;
    case 'Collection list': return <FolderHeart className="h-4 w-4 text-slate-600" />;
    case 'Slideshow': return <PlaySquare className="h-4 w-4 text-slate-600" />;
    case 'Video banner': return <Video className="h-4 w-4 text-slate-600" />;
    case 'Rich text': return <FileText className="h-4 w-4 text-slate-600" />;
    case 'Marquee text': return <Sparkles className="h-4 w-4 text-slate-600" />;
    case 'Marquee images': return <Layers className="h-4 w-4 text-slate-600" />;
    case 'Logo list': return <Award className="h-4 w-4 text-slate-600" />;
    case 'Images gallery': return <Layout className="h-4 w-4 text-slate-600" />;
    case 'FAQs': return <HelpCircle className="h-4 w-4 text-slate-600" />;
    case 'Blog post': return <BookOpen className="h-4 w-4 text-slate-600" />;
    case 'Brand list': return <LayoutGrid className="h-4 w-4 text-slate-600" />;
    case 'Icon with text': return <Sparkles className="h-4 w-4 text-slate-600" />;
    case 'Brands we offer': return <Layers className="h-4 w-4 text-slate-600" />;
    case 'How it works': return <Compass className="h-4 w-4 text-slate-600" />;
    case 'Trust badges': return <Award className="h-4 w-4 text-slate-600" />;
    case 'Plans': return <LayoutGrid className="h-4 w-4 text-slate-600" />;
    case 'Clearance Sale': return <Flame className="h-4 w-4 text-slate-600" />;
    case 'Contact Form': return <Mail className="h-4 w-4 text-slate-600" />;
    default: return <FileCode className="h-4 w-4 text-slate-600" />;
  }
};

interface AdminDashboardProps {
  products: Product[];
  onUpdateProducts: (newProds: Product[]) => void;
  collections: Collection[];
  onUpdateCollections: (newColls: Collection[]) => void;
  orders: Order[];
  onUpdateOrders: (newOrders: Order[]) => void;
  files: FileEntry[];
  onUpdateFiles: (newFiles: FileEntry[]) => void;
  customers: Customer[];
  onUpdateCustomers: (newCusts: Customer[]) => void;
  discounts: Discount[];
  onUpdateDiscounts: (newDiscs: Discount[]) => void;
  customPages: CustomPage[];
  onUpdateCustomPages: (newPages: CustomPage[]) => void;
  blogs: BlogPost[];
  onUpdateBlogs: (newBlogs: BlogPost[]) => void;
  layoutSettings?: LayoutSettings;
  onUpdateLayoutSettings?: (newSettings: LayoutSettings | ((prev: LayoutSettings) => LayoutSettings)) => void;
  devSettings?: DevSettings;
  onUpdateDevSettings?: (newSettings: DevSettings) => void;
  onDirtyChange?: (dirty: boolean) => void;
  adminActionTrigger?: { action: 'save' | 'discard'; timestamp: number } | null;
  onAdminActionComplete?: (action: 'save' | 'discard') => void;
  onExitAdmin?: () => void;
  onLogoutAdmin?: () => void;
}


type SidebarTab = 'analytics' | 'orders' | 'collections' | 'products' | 'pages' | 'themes' | 'blogs' | 'files' | 'customers' | 'discounts' | 'email' | 'layout' | 'development' | 'diagnostics' | 'recycle-bin' | 'payments' | 'delivery' | 'age-verification' | 'integrations';

export default function AdminDashboard({
  products: parentProducts,
  onUpdateProducts: parentOnUpdateProducts,
  collections: parentCollections,
  onUpdateCollections: parentOnUpdateCollections,
  orders: parentOrders,
  onUpdateOrders: parentOnUpdateOrders,
  files: parentFiles,
  onUpdateFiles: parentOnUpdateFiles,
  customers: parentCustomers,
  onUpdateCustomers: parentOnUpdateCustomers,
  discounts: parentDiscounts,
  onUpdateDiscounts: parentOnUpdateDiscounts,
  customPages: parentCustomPages,
  onUpdateCustomPages: parentOnUpdateCustomPages,
  blogs: parentBlogs,
  onUpdateBlogs: parentOnUpdateBlogs,
  layoutSettings,
  onUpdateLayoutSettings,
  devSettings,
  onUpdateDevSettings,
  onDirtyChange,
  adminActionTrigger,
  onAdminActionComplete,
  onExitAdmin,
  onLogoutAdmin
}: AdminDashboardProps) {
  const tabToPathMap: Record<SidebarTab, string> = {
    analytics: 'analytics',
    orders: 'orders',
    collections: 'collections',
    products: 'products',
    pages: 'pages',
    themes: 'themes',
    blogs: 'blog-posts',
    files: 'files',
    customers: 'customers',
    discounts: 'discounts',
    email: 'email',
    layout: 'layout',
    development: 'development',
    diagnostics: 'diagnostics',
    'recycle-bin': 'recycle-bin',
    payments: 'payments',
    delivery: 'shipping-delivery',
    'age-verification': 'age-verification',
    integrations: 'integrations'
  };

  const pathToTabMap: Record<string, SidebarTab> = {
    analytics: 'analytics',
    orders: 'orders',
    collections: 'collections',
    products: 'products',
    pages: 'pages',
    themes: 'themes',
    'blog-posts': 'blogs',
    files: 'files',
    'file-manager': 'files',
    'files-manager': 'files',
    media: 'files',
    customers: 'customers',
    discounts: 'discounts',
    shipping: 'delivery',
    email: 'email',
    'email-settings': 'email',
    klaviyo: 'email',
    layout: 'layout',
    development: 'development',
    dev: 'development',
    diagnostics: 'diagnostics',
    'recycle-bin': 'recycle-bin',
    status: 'diagnostics',
    db: 'diagnostics',
    payments: 'payments',
    'shipping-delivery': 'delivery',
    'age-verification': 'age-verification',
    integrations: 'integrations'
  };

  /**
   * Splits /admin-dashboard/<section>/<recordId> into its parts.
   * The record id lets a detail view (e.g. a single order) be deep-linked and
   * survive a reload or a browser Back press.
   */
  const parseAdminPath = (): { section: string; recordId: string | null } => {
    try {
      const path = window.location.pathname;
      if (!path.startsWith('/admin-dashboard')) return { section: '', recordId: null };
      const segments = path.replace('/admin-dashboard', '').split('/').filter(Boolean);
      return {
        section: segments[0] ? decodeURIComponent(segments[0]) : '',
        recordId: segments[1] ? decodeURIComponent(segments[1]) : null
      };
    } catch (e) {
      console.warn('[AdminDashboard] Failed to read path:', e);
      return { section: '', recordId: null };
    }
  };

  const getInitialTab = (): SidebarTab => {
    const { section } = parseAdminPath();
    // Match on the first segment only, so /orders/PS12345 still resolves to the
    // orders tab instead of falling through to analytics.
    if (section && pathToTabMap[section]) {
      return pathToTabMap[section];
    }
    return 'analytics';
  };

  const [activeTab, setActiveTab] = useState<SidebarTab>(getInitialTab);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Sync state to URL
  useEffect(() => {
    try {
      const subPath = tabToPathMap[activeTab];
      const { section } = parseAdminPath();

      // If the URL already points at this section, leave it alone — it may
      // carry a record id such as /admin-dashboard/orders/PS12345 that this
      // effect would otherwise strip on every render.
      if (section && pathToTabMap[section] === activeTab) return;

      const targetUrl = `/admin-dashboard/${subPath}`;
      if (window.location.pathname !== targetUrl) {
        window.history.pushState({}, '', targetUrl);
      }
    } catch (e) {
      console.warn('[AdminDashboard] Failed to pushState:', e);
    }
  }, [activeTab]);

  // Sync URL to state (Popstate for back/forward support)
  useEffect(() => {
    const handlePopState = () => {
      try {
        const path = window.location.pathname;
        const { section } = parseAdminPath();
        if (section && pathToTabMap[section]) {
          if (pathToTabMap[section] !== activeTab) {
            setActiveTab(pathToTabMap[section]);
          }
        } else if (path === '/admin-dashboard') {
          setActiveTab('analytics');
        }
      } catch (e) {
        console.warn('[AdminDashboard] Failed to handle popstate:', e);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);
  
  const [dbStatus, setDbStatus] = useState<{
    status: 'connected' | 'error' | 'not-configured' | 'pending';
    error?: string;
    isSslAlert?: boolean;
    isDnsError?: boolean;
    uriHost?: string;
  } | null>(null);

  // Database details modal state
  const [showDbDetailsModal, setShowDbDetailsModal] = useState(false);
  const [dbDetailsLoading, setDbDetailsLoading] = useState(false);
  const [dbDetailsData, setDbDetailsData] = useState<any | null>(null);
  const [dbDetailsError, setDbDetailsError] = useState<string | null>(null);

  // Custom confirmation dialog state to replace blocked window.confirm in sandboxed iframe
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const triggerConfirm = (message: string, onConfirm: () => void, title = "Confirm Action") => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(null);
      }
    });
  };

  const fetchDbDetails = async () => {
    setDbDetailsLoading(true);
    setDbDetailsError(null);
    try {
      const res = await fetch('/api/db-details');
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      setDbDetailsData(data);
    } catch (err: any) {
      setDbDetailsError(err.message || 'Failed to connect to backend api');
    } finally {
      setDbDetailsLoading(false);
    }
  };

  const [customUriInput, setCustomUriInput] = useState('');
  const [uriUpdating, setUriUpdating] = useState(false);
  const [uriUpdateResult, setUriUpdateResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleUpdateUriSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUriInput.trim()) return;
    setUriUpdating(true);
    setUriUpdateResult(null);
    try {
      const response = await fetch('/api/update-db-uri', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uri: customUriInput.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        setDbStatus(data);
        if (data.status === 'connected') {
          setUriUpdateResult({ success: true, message: 'Successfully connected to Neon PostgreSQL database!' });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else if (data.status === 'error') {
          setUriUpdateResult({ 
            success: false, 
            message: data.isSslAlert 
              ? 'SSL Handshake blocked by Atlas. IP address needs to be whitelisted (Allow all 0.0.0.0/0). IP Whitelist needed.'
              : 'Connection attempt failed: ' + (data.error || 'Check layout format.') 
          });
        } else {
          setUriUpdateResult({ success: false, message: 'Connection string changed, status ' + data.status });
        }
      } else {
        setUriUpdateResult({ success: false, message: data.error || 'Could not map configuration.' });
      }
    } catch (err: any) {
      setUriUpdateResult({ success: false, message: 'Communication fault: ' + err.message });
    } finally {
      setUriUpdating(false);
    }
  };

  useEffect(() => {
    fetch('/api/db-status')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setDbStatus(data);
      })
      .catch(err => console.error("Error asking DB status:", err));
  }, []);

  // --- Draft State Hooks for unified safe saves ---
  const [localProducts, setLocalProducts] = useState<Product[]>(parentProducts);
  const [localCollections, setLocalCollections] = useState<Collection[]>(parentCollections);
  const [localPages, setLocalPages] = useState<CustomPage[]>(parentCustomPages);
  const [localDiscounts, setLocalDiscounts] = useState<Discount[]>(parentDiscounts);
  const [localOrders, setLocalOrders] = useState<Order[]>(parentOrders);
  const [localFiles, setLocalFiles] = useState<FileEntry[]>(parentFiles);
  const [localCustomers, setLocalCustomers] = useState<Customer[]>(parentCustomers);
  const [localBlogs, setLocalBlogs] = useState<BlogPost[]>(parentBlogs);

  /** How many items are in the recycle bin, for the sidebar badge. */
  const [recycleBinCount, setRecycleBinCount] = useState<number>(0);

  /**
   * Moves one record to the recycle bin, server-side.
   *
   * Every delete in the dashboard goes through here. The record is taken out of
   * its own store and written to the bin in one step, so nothing is ever both
   * live and binned — and because the server does it, the deletion survives a
   * refresh whether or not the admin presses Save afterwards.
   *
   * Returns false, with the reason shown, when the server refuses; the caller
   * then leaves its local list alone rather than hiding a record that is still
   * there.
   */
  const recycleItem = useCallback(async (resource: string, id: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/recycle-bin/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource, id })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.success !== true) {
        console.error(`[Recycle Bin] ${resource}/${id} was not deleted:`, data?.error);
        window.alert(data?.error || 'That item could not be deleted. Please try again.');
        return false;
      }
      setRecycleBinCount(n => n + 1);
      return true;
    } catch (err: any) {
      console.error(`[Recycle Bin] ${resource}/${id} delete failed:`, err?.message);
      window.alert('Could not reach the server, so nothing was deleted.');
      return false;
    }
  }, []);

  /** Pulls the sections back from the API after something is restored. */
  const reloadAfterRestore = useCallback(async () => {
    const pull = async (path: string) => {
      try {
        const res = await fetch(path);
        if (!res.ok) return null;
        const data = await res.json();
        return Array.isArray(data) ? data : null;
      } catch {
        return null;
      }
    };

    const [prods, colls, pages, blogsList, filesList, ordersList, customersList] = await Promise.all([
      pull('/api/products'),
      pull('/api/collections'),
      pull('/api/customPages'),
      pull('/api/blogs'),
      pull('/api/files'),
      pull('/api/orders'),
      pull('/api/customers')
    ]);

    if (prods) setLocalProducts(prods as Product[]);
    if (colls) setLocalCollections(colls as Collection[]);
    if (pages) setLocalPages(pages as CustomPage[]);
    if (blogsList) setLocalBlogs(blogsList as BlogPost[]);
    if (filesList) setLocalFiles(filesList as FileEntry[]);
    if (ordersList) setLocalOrders(ordersList as Order[]);
    if (customersList) setLocalCustomers(customersList as Customer[]);
  }, []);

  // Keeps the sidebar badge right from the moment the dashboard opens.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/recycle-bin');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setRecycleBinCount(data?.counts?.total ?? 0);
      } catch {
        /* the badge is a convenience; a failure here changes nothing */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [localLayoutSettings, setLocalLayoutSettings] = useState<LayoutSettings>(() => {
    return layoutSettings || {
      headerLogoText: 'Ecommerce Store',
      headerLogoSubtext: '',
      headerLogoImage: '',
      footerLogoText: 'ECOMMERCE STORE',
      footerLogoDescription: 'Quality products, fair prices and friendly service — delivered to your door.',
      footerLogoImage: '',
      klaviyoPublicKey: '',
      cloudinaryCloudName: '',
      cloudinaryApiKey: '',
      cloudinaryApiSecret: '',
      menuItems: [
        { id: '1', label: 'Home', tab: 'frontend-home', type: 'tab' },
        { id: '3', label: 'Shop Now', tab: 'frontend-shop', type: 'tab' },
        { id: '4', label: 'All Brands', tab: 'frontend-brands', type: 'tab' },
        { id: '5', label: 'About', tab: 'about', type: 'tab' },
      ]
    };
  });

  useEffect(() => {
    if (layoutSettings) {
      setLocalLayoutSettings(layoutSettings);
    }
  }, [layoutSettings]);

  useEffect(() => {
    if (Array.isArray(parentOrders)) {
      setLocalOrders(parentOrders);
    }
  }, [parentOrders]);

  useEffect(() => {
    if (Array.isArray(parentProducts) && parentProducts.length > 0) {
      setLocalProducts(parentProducts);
    }
  }, [parentProducts]);

  useEffect(() => {
    if (Array.isArray(parentCollections) && parentCollections.length > 0) {
      setLocalCollections(parentCollections);
    }
  }, [parentCollections]);

  useEffect(() => {
    if (Array.isArray(parentCustomPages) && parentCustomPages.length > 0) {
      setLocalPages(parentCustomPages);
    }
  }, [parentCustomPages]);

  useEffect(() => {
    if (Array.isArray(parentDiscounts) && parentDiscounts.length > 0) {
      setLocalDiscounts(parentDiscounts);
    }
  }, [parentDiscounts]);

  useEffect(() => {
    if (Array.isArray(parentCustomers) && parentCustomers.length > 0) {
      setLocalCustomers(parentCustomers);
    }
  }, [parentCustomers]);

  useEffect(() => {
    if (Array.isArray(parentBlogs) && parentBlogs.length > 0) {
      setLocalBlogs(parentBlogs);
    }
  }, [parentBlogs]);

  useEffect(() => {
    if (Array.isArray(parentFiles) && parentFiles.length > 0) {
      setLocalFiles(parentFiles);
    }
  }, [parentFiles]);

  const [layoutSavedToast, setLayoutSavedToast] = useState(false);
  const [testingCloudinary, setTestingCloudinary] = useState(false);
  const [cloudinaryTestResult, setCloudinaryTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [videoUploadStatus, setVideoUploadStatus] = useState<string | null>(null);

  const parseCloudinaryInput = (cNameVal?: string, aKeyVal?: string, aSecretVal?: string) => {
    let cName = (cNameVal || '').trim();
    let aKey = (aKeyVal || '').trim();
    let aSecret = (aSecretVal || '').trim();

    const combined = `${cName} ${aKey} ${aSecret}`;
    const match = combined.match(/cloudinary:\/\/([^:]+):([^@]+)@([a-zA-Z0-9_-]+)/i);
    if (match) {
      aKey = match[1].trim();
      aSecret = match[2].trim();
      cName = match[3].trim();
    } else {
      if (cName.startsWith('CLOUDINARY_URL=')) {
        cName = cName.replace('CLOUDINARY_URL=', '').trim();
      }
      if (cName.includes('@')) {
        const parts = cName.split('@');
        cName = parts[1].trim();
        const left = parts[0].replace(/.*cloudinary:\/\//i, '').trim();
        const ks = left.split(':');
        if (ks.length === 2) {
          aKey = ks[0].trim();
          aSecret = ks[1].trim();
        }
      }
    }

    if (cName.toLowerCase() === 'ecommerce store') {
      cName = '';
    }

    return { cName, aKey, aSecret };
  };

  const handleTestCloudinary = async () => {
    setTestingCloudinary(true);
    setCloudinaryTestResult(null);

    const parsed = parseCloudinaryInput(
      localLayoutSettings.cloudinaryCloudName,
      localLayoutSettings.cloudinaryApiKey,
      localLayoutSettings.cloudinaryApiSecret
    );

    const updatedSettings = {
      ...localLayoutSettings,
      cloudinaryCloudName: parsed.cName || localLayoutSettings.cloudinaryCloudName,
      cloudinaryApiKey: parsed.aKey || localLayoutSettings.cloudinaryApiKey,
      cloudinaryApiSecret: parsed.aSecret || localLayoutSettings.cloudinaryApiSecret
    };

    setLocalLayoutSettings(updatedSettings);
    if (onUpdateLayoutSettings) {
      onUpdateLayoutSettings(updatedSettings);
    }

    try {
      const res = await fetch('/api/test-cloudinary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cloudName: updatedSettings.cloudinaryCloudName,
          apiKey: updatedSettings.cloudinaryApiKey,
          apiSecret: updatedSettings.cloudinaryApiSecret
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCloudinaryTestResult({ success: true, message: data.message });
      } else {
        setCloudinaryTestResult({ success: false, message: data.error || 'Failed to connect to Cloudinary.' });
      }
    } catch (err: any) {
      setCloudinaryTestResult({ success: false, message: err.message || 'Server error testing Cloudinary connection.' });
    } finally {
      setTestingCloudinary(false);
    }
  };

  const [isAddingMenuItem, setIsAddingMenuItem] = useState(false);
  const [newMenuItemLabel, setNewMenuItemLabel] = useState('');
  const [newMenuItemTarget, setNewMenuItemTarget] = useState('frontend-home');
  const [newMenuItemType, setNewMenuItemType] = useState<'tab' | 'external'>('tab');
  const [newMenuItemUrl, setNewMenuItemUrl] = useState('');

  const moveMenuItem = (index: number, direction: 'up' | 'down') => {
    const items = [...localLayoutSettings.menuItems];
    if (direction === 'up' && index > 0) {
      const temp = items[index];
      items[index] = items[index - 1];
      items[index - 1] = temp;
    } else if (direction === 'down' && index < items.length - 1) {
      const temp = items[index];
      items[index] = items[index + 1];
      items[index + 1] = temp;
    }
    setLocalLayoutSettings({ ...localLayoutSettings, menuItems: items });
  };

  const addMenuItem = () => {
    if (!newMenuItemLabel.trim()) return;
    const newItem: MenuItem = {
      id: Date.now().toString(),
      label: newMenuItemLabel.trim(),
      tab: newMenuItemType === 'tab' ? newMenuItemTarget : '',
      type: newMenuItemType,
      url: newMenuItemType === 'external' ? newMenuItemUrl : undefined
    };
    setLocalLayoutSettings({
      ...localLayoutSettings,
      menuItems: [...localLayoutSettings.menuItems, newItem]
    });
    setNewMenuItemLabel('');
    setNewMenuItemUrl('');
    setIsAddingMenuItem(false);
  };

  const removeMenuItem = (id: string) => {
    const items = localLayoutSettings.menuItems.filter(item => item.id !== id);
    setLocalLayoutSettings({ ...localLayoutSettings, menuItems: items });
  };

  const editMenuItemLabel = (id: string, newLabel: string) => {
    const items = localLayoutSettings.menuItems.map(item => 
      item.id === id ? { ...item, label: newLabel } : item
    );
    setLocalLayoutSettings({ ...localLayoutSettings, menuItems: items });
  };

  const editMenuItemTarget = (id: string, newTarget: string) => {
    const items = localLayoutSettings.menuItems.map(item => 
      item.id === id ? { ...item, tab: newTarget, url: undefined, type: 'tab' as const } : item
    );
    setLocalLayoutSettings({ ...localLayoutSettings, menuItems: items });
  };

  const editMenuItemUrl = (id: string, newUrl: string) => {
    const items = localLayoutSettings.menuItems.map(item => 
      item.id === id ? { ...item, tab: '', url: newUrl, type: 'external' as const } : item
    );
    setLocalLayoutSettings({ ...localLayoutSettings, menuItems: items });
  };

  const handleLogoUpload = (file: File, target: 'header' | 'footer') => {
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: reader.result })
          });
          if (res.ok) {
            const info = await res.json();
            if (info.url) {
              setLocalLayoutSettings(prev => ({
                ...prev,
                [target === 'header' ? 'headerLogoImage' : 'footerLogoImage']: info.url
              }));
              return;
            }
          }
          setLocalLayoutSettings(prev => ({
            ...prev,
            [target === 'header' ? 'headerLogoImage' : 'footerLogoImage']: reader.result as string
          }));
        } catch (err) {
          console.warn('[LogoUpload] API upload failed, falling back to base64:', err);
          setLocalLayoutSettings(prev => ({
            ...prev,
            [target === 'header' ? 'headerLogoImage' : 'footerLogoImage']: reader.result as string
          }));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Sync edits wrapper overrides so existing handlers automatically write to drafts and sync to the parent App context immediately
  const onUpdateProducts = (updatedProds: Product[]) => {
    setLocalProducts(updatedProds);
    parentOnUpdateProducts(updatedProds);
    setHasUnsavedChanges(false);
    if (onDirtyChange) onDirtyChange(false);
  };

  const onUpdateCollections = (updatedColls: Collection[]) => {
    setLocalCollections(updatedColls);
    parentOnUpdateCollections(updatedColls);
    setHasUnsavedChanges(false);
    if (onDirtyChange) onDirtyChange(false);
  };

  const onUpdateCustomPages = (updatedPages: CustomPage[]) => {
    setLocalPages(updatedPages);
    parentOnUpdateCustomPages(updatedPages);
    setHasUnsavedChanges(false);
    if (onDirtyChange) onDirtyChange(false);
  };

  const onUpdateDiscounts = (updatedDiscs: Discount[]) => {
    setLocalDiscounts(updatedDiscs);
    parentOnUpdateDiscounts(updatedDiscs);
    setHasUnsavedChanges(false);
    if (onDirtyChange) onDirtyChange(false);
  };

  const onUpdateOrders = (updatedOrders: Order[]) => {
    setLocalOrders(updatedOrders);
    parentOnUpdateOrders(updatedOrders);
    setHasUnsavedChanges(false);
    if (onDirtyChange) onDirtyChange(false);
  };

  const onUpdateFiles = (updatedFiles: FileEntry[]) => {
    setLocalFiles(updatedFiles);
    parentOnUpdateFiles(updatedFiles);
    setHasUnsavedChanges(false);
    if (onDirtyChange) onDirtyChange(false);
  };

  const onUpdateCustomers = (updatedCusts: Customer[]) => {
    setLocalCustomers(updatedCusts);
    parentOnUpdateCustomers(updatedCusts);
    setHasUnsavedChanges(false);
    if (onDirtyChange) onDirtyChange(false);
  };

  const handleDeleteCustomer = async (customer: { email: string; id?: string }) => {
    const customerEmail = customer.email.toLowerCase().trim();
    // Customers are in LIST_SAVE_NEVER_DELETES, so filtering the list and saving
    // it never actually removed one — the account came back on the next load.
    // The bin removes it properly, and keeps it recoverable for 30 days.
    const target = customers.find(existing => existing.email.toLowerCase().trim() === customerEmail);
    const id = customer.id || target?.id;
    if (!id) {
      window.alert('That customer record has no id, so it cannot be deleted safely.');
      return;
    }
    if (!(await recycleItem('customers', id))) return;
    onUpdateCustomers(customers.filter(existing => existing.email.toLowerCase().trim() !== customerEmail));
  };

  const onUpdateBlogs = (updatedBlogs: BlogPost[]) => {
    setLocalBlogs(updatedBlogs);
    parentOnUpdateBlogs(updatedBlogs);
    setHasUnsavedChanges(false);
    if (onDirtyChange) onDirtyChange(false);
  };

  // Global Save & Discard triggers
  const handleGlobalSave = () => {
    setIsSaving(true);
    setShowSaveSuccess(false);

    // Guarantee full page section settings payload
    const pagesToSave: CustomPage[] = (localPages as CustomPage[]).map(page => ({
      ...page,
      sections: (page.sections || []).map(section => ({
        ...section,
        settings: {
          ...(section.settings || {})
        } as any
      }))
    }));

    // Merge local files and parent files by URL to ensure no uploaded assets are lost
    const mergedFilesMap = new Map<string, FileEntry>();
    (parentFiles || []).forEach(f => { if (f && f.url) mergedFilesMap.set(f.url, f); });
    (localFiles || []).forEach(f => { if (f && f.url) mergedFilesMap.set(f.url, f); });
    const finalFilesToSave = Array.from(mergedFilesMap.values());

    // Update parent states
    parentOnUpdateProducts(localProducts);
    parentOnUpdateCollections(localCollections);
    parentOnUpdateCustomPages(pagesToSave);
    parentOnUpdateDiscounts(localDiscounts);
    parentOnUpdateOrders(localOrders);
    parentOnUpdateFiles(finalFilesToSave);
    setLocalFiles(finalFilesToSave);
    parentOnUpdateCustomers(localCustomers);
    parentOnUpdateBlogs(localBlogs);

    // Save directly to localStorage as backup
    try {
      localStorage.setItem('ps_custom_pages', JSON.stringify(pagesToSave));
      localStorage.setItem('ps_products', JSON.stringify(localProducts));
      localStorage.setItem('ps_collections', JSON.stringify(localCollections));
      localStorage.setItem('ps_orders', JSON.stringify(localOrders));
      // Save lightweight subset for files to prevent LocalStorage quota overflow
      const filesSubset = (finalFilesToSave || []).slice(0, 25).map((f: any) => ({ id: f.id, url: f.url, fileName: f.fileName, size: f.size }));
      localStorage.setItem('ps_files', JSON.stringify(filesSubset));
      localStorage.setItem('ps_customers', JSON.stringify(localCustomers));
      localStorage.setItem('ps_discounts', JSON.stringify(localDiscounts));
      localStorage.setItem('ps_blogs', JSON.stringify(localBlogs));
    } catch (e) {
      // Ignored for localStorage quota
    }

    // Direct HTTP POST to API endpoints for instant database persistence
    const postOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };

    fetch('/api/products', { ...postOptions, body: JSON.stringify(localProducts) })
      .catch(err => console.error('[Admin Save] Direct POST products failed:', err));

    fetch('/api/collections', { ...postOptions, body: JSON.stringify(localCollections) })
      .catch(err => console.error('[Admin Save] Direct POST collections failed:', err));

    // Orders are deliberately NOT synced here.
    //
    // localOrders is whatever this tab loaded when it opened. Posting it as the
    // order list meant every order placed after that point was absent from the
    // payload - and the server then deleted those rows, so a customer who paid
    // while the admin had the dashboard open lost their order. Orders are
    // changed through their own endpoints instead: /api/orders/:id/admin-action,
    // /api/orders/:id/cancel and DELETE /api/orders/:id.

    fetch('/api/customers', { ...postOptions, body: JSON.stringify(localCustomers) })
      .catch(err => console.error('[Admin Save] Direct POST customers failed:', err));

    fetch('/api/discounts', { ...postOptions, body: JSON.stringify(localDiscounts) })
      .catch(err => console.error('[Admin Save] Direct POST discounts failed:', err));

    fetch('/api/blogs', { ...postOptions, body: JSON.stringify(localBlogs) })
      .catch(err => console.error('[Admin Save] Direct POST blogs failed:', err));

    fetch('/api/custompages', { ...postOptions, body: JSON.stringify(pagesToSave) })
      .catch(err => console.error('[Admin Save] Direct POST custompages failed:', err));

    fetch('/api/files', { ...postOptions, body: JSON.stringify(finalFilesToSave) })
      .catch(err => console.error('[Admin Save] Direct POST files failed:', err));

    fetch('/api/layoutsettings', { ...postOptions, body: JSON.stringify(localLayoutSettings) })
      .catch(err => console.error('[Admin Save] Direct POST layoutsettings failed:', err));

    setTimeout(() => {
      setHasUnsavedChanges(false);
      setIsSaving(false);
      setShowSaveSuccess(true);
      
      if (onDirtyChange) onDirtyChange(false);
      if (onAdminActionComplete) onAdminActionComplete('save');

      setTimeout(() => {
        setShowSaveSuccess(false);
      }, 3500);
    }, 450);
  };

  const handleGlobalDiscard = () => {
    setLocalProducts(parentProducts);
    setLocalCollections(parentCollections);
    setLocalPages(parentCustomPages);
    setLocalDiscounts(parentDiscounts);
    setLocalOrders(parentOrders);
    setLocalFiles(parentFiles);
    setLocalCustomers(parentCustomers);
    setLocalBlogs(parentBlogs);

    setHasUnsavedChanges(false);
    if (onDirtyChange) onDirtyChange(false);
    if (onAdminActionComplete) onAdminActionComplete('discard');
  };

  // Sync files state unconditionally so uploads instantly appear in the File Manager bypassing draft locks
  React.useEffect(() => {
    setLocalFiles(prev => {
      const parentMap = new Map<string, FileEntry>();
      (parentFiles || []).forEach(f => { if (f && f.url) parentMap.set(f.url, f); });
      (prev || []).forEach(f => { if (f && f.url && !parentMap.has(f.url)) parentMap.set(f.url, f); });
      return Array.from(parentMap.values());
    });
  }, [parentFiles]);

  React.useEffect(() => {
    const handleUploadedMedia = (evt: Event) => {
      const detail = (evt as CustomEvent).detail;
      if (!detail || !detail.url) return;
      const isVid = (detail.mimeType && detail.mimeType.startsWith('video/')) || 
                    detail.resourceType === 'video' || 
                    /\.(mp4|webm|mov|m4v|ogg|avi|mkv)$/i.test(detail.fileName || detail.url);

      setLocalFiles(prev => {
        if (prev.some(f => f.url === detail.url)) return prev;
        const cleanName = detail.fileName || detail.url.split('/').pop() || 'Media Asset';
        const newEntry: FileEntry = {
          id: detail.id || `file-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          fileName: cleanName,
          altText: cleanName.split('.')[0] || 'Uploaded Media Asset',
          dateAdded: new Date().toISOString().split('T')[0],
          size: detail.size || 'Media Asset',
          references: 'Direct Upload',
          url: detail.url,
          mimeType: detail.mimeType || (isVid ? 'video/mp4' : 'image/png'),
          resourceType: detail.resourceType || (isVid ? 'video' : 'image')
        };
        const updated = [newEntry, ...prev];

        // 1. Sync to parent App state
        if (onUpdateFiles) {
          onUpdateFiles(updated);
        }

        // 2. Sync to localStorage immediately
        try {
          const filesSubset = updated.slice(0, 25).map((f: any) => ({ id: f.id, url: f.url, fileName: f.fileName, size: f.size }));
          localStorage.setItem('ps_files', JSON.stringify(filesSubset));
        } catch (e) {}

        // 3. Persist to /api/files database endpoint
        fetch('/api/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        }).catch(err => console.error('[Media Upload Sync] Failed to post files:', err));

        return updated;
      });
    };
    window.addEventListener('app-file-uploaded', handleUploadedMedia);
    window.addEventListener('app-image-uploaded', handleUploadedMedia);
    return () => {
      window.removeEventListener('app-file-uploaded', handleUploadedMedia);
      window.removeEventListener('app-image-uploaded', handleUploadedMedia);
    };
  }, [onUpdateFiles]);

  // Sync draft states when external database updates occur (when not dirty)
  React.useEffect(() => {
    if (!hasUnsavedChanges) {
      setLocalProducts(parentProducts);
      setLocalCollections(parentCollections);
      setLocalPages(parentCustomPages);
      setLocalDiscounts(parentDiscounts);
      setLocalOrders(parentOrders);
      setLocalCustomers(parentCustomers);
      setLocalBlogs(parentBlogs);
    }
  }, [parentProducts, parentCollections, parentCustomPages, parentDiscounts, parentOrders, parentCustomers, parentBlogs, hasUnsavedChanges]);

  // Listen to external modal command requests (from App.tsx confirm triggers)
  React.useEffect(() => {
    if (adminActionTrigger) {
      if (adminActionTrigger.action === 'save') {
        handleGlobalSave();
      } else if (adminActionTrigger.action === 'discard') {
        handleGlobalDiscard();
      }
    }
  }, [adminActionTrigger]);

  // Expose standard namespace variables to keep all existing loops intact
  const products = localProducts;
  const collections = localCollections;
  const customPages = localPages;
  const discounts = localDiscounts;
  const orders = localOrders;
  const files = localFiles;
  const customers = localCustomers;
  const blogs = localBlogs;

  // Search, filter, edit states
  const [orderQuery, setOrderQuery] = useUrlParam('q', '', activeTab === 'orders');

  // Blog Post management states
  const [blogQuery, setBlogQuery] = useUrlParam('q', '', activeTab === 'blogs');
  const [blogStatusFilter, setBlogStatusFilter] = useUrlParam<'All' | 'Active' | 'Draft' | 'Archived'>('status', 'All', activeTab === 'blogs');
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);
  const [showAddBlog, setShowAddBlog] = useState(false);
  const [newBlogForm, setNewBlogForm] = useState<Partial<BlogPost>>({
    title: '', excerpt: '', content: '', image: '',
    author: 'Admin', category: 'General', status: 'Active',
    publishedAt: '', readTime: '5 min read', tags: []
  });
  const [blogTagsInput, setBlogTagsInput] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useUrlParam<'All' | 'Unfulfilled' | 'Fulfilled'>('status', 'All', activeTab === 'orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // ---------------------------------------------------------------
  // Deep-linkable order detail: /admin-dashboard/orders/<orderId>
  // ---------------------------------------------------------------

  // Opening or closing an order rewrites the URL, so the detail view can be
  // linked, bookmarked and reloaded rather than living in invisible state.
  const orderUrlSyncMounted = useRef(false);
  useEffect(() => {
    if (activeTab !== 'orders') return;

    // On the first pass the URL is the source of truth, not this state. Writing
    // here on mount would strip the order id out of a deep link before the
    // resolver below has had a chance to select that order.
    if (!orderUrlSyncMounted.current) {
      orderUrlSyncMounted.current = true;
      return;
    }

    try {
      writeAdminRecord('orders', selectedOrder ? String(selectedOrder.id) : null);
    } catch (e) {
      console.warn('[AdminDashboard] Failed to sync order URL:', e);
    }
  }, [selectedOrder, activeTab]);

  // Resolve an order id in the URL to the actual record — on first load and
  // whenever the user navigates with the browser Back/Forward buttons.
  useEffect(() => {
    const applyOrderFromUrl = () => {
      const { section, recordId } = parseAdminPath();
      if (!section || pathToTabMap[section] !== 'orders') return;

      if (!recordId) {
        setSelectedOrder(null);
        return;
      }
      if (selectedOrder && String(selectedOrder.id) === recordId) return;

      const match = orders.find(o => String(o.id) === recordId);
      if (match) setSelectedOrder(match);
    };

    applyOrderFromUrl();
    window.addEventListener('popstate', applyOrderFromUrl);
    return () => window.removeEventListener('popstate', applyOrderFromUrl);
  }, [orders, selectedOrder]);

  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [carrierInput, setCarrierInput] = useState('');
  const [timelineComment, setTimelineComment] = useState('');
  const [timelineComments, setTimelineComments] = useState<Record<string, {text: string, date: string}[]>>({});

  const [productQuery, setProductQuery] = useUrlParam('q', '', activeTab === 'products');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductForm, setNewProductForm] = useState<Partial<Product>>({
    title: '', description: '', price: 4.99, compareAtPrice: 5.99,
    inventory: 50, sku: '', category: 'Vitamins & Supplements',
    vendor: '', status: 'Active', image: '', weight: 12, tags: []
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [showAddCollection, setShowAddCollection] = useState(false);
  const [collectionQuery, setCollectionQuery] = useUrlParam('q', '', activeTab === 'collections');
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [newCollectionForm, setNewCollectionForm] = useState<Partial<Collection>>({
    title: '', description: '', type: 'Manual', image: '', productIds: []
  });

  const [showAddPage, setShowAddPage] = useState(false);
  const [newPageForm, setNewPageForm] = useState({ title: '', slug: '' });
  const [selectedBuilderPageId, setSelectedBuilderPageId] = useState<string | null>(null);
  const [selectedBuilderSectionId, setSelectedBuilderSectionId] = useState<string | null>(null);
  const [activeSlideEditIndex, setActiveSlideEditIndex] = useState<number>(0);
  const [openPreviewFaqIndex, setOpenPreviewFaqIndex] = useState<string | null>(null);
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');

  // Draft page & collection builder custom states
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  // Clean title-to-slug utility
  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-');        // Replace multiple - with single -
  };

  // Pages management handlers
  const handleDuplicatePage = (page: CustomPage) => {
    let count = 1;
    let baseSlug = page.slug || 'slug';
    if (baseSlug.match(/-\d+$/)) {
      baseSlug = baseSlug.replace(/-\d+$/, '');
    }
    let newSlug = `${baseSlug}-${count}`;
    while (localPages.some(p => p.slug === newSlug)) {
      count++;
      newSlug = `${baseSlug}-${count}`;
    }
    const duplicated: CustomPage = {
      ...JSON.parse(JSON.stringify(page)),
      id: `page-${Date.now()}`,
      title: `${page.title} (Copy)`,
      slug: newSlug,
      isHomepage: false,
      updatedAt: 'Just Now'
    };
    const updated = [...localPages, duplicated];
    setLocalPages(updated);
    onUpdateCustomPages(updated);
  };

  const handleSetPageAsHomepage = (id: string) => {
    const updated = localPages.map(p => {
      if (p.id === id) {
        return { ...p, isHomepage: true, slug: '' };
      }
      return { ...p, isHomepage: false };
    });
    setLocalPages(updated);
    onUpdateCustomPages(updated);
  };

  const handlePreviewPage = (page: CustomPage) => {
    const url = page.isHomepage ? '/' : `/pages/${page.slug}`;
    window.open(url, '_blank');
  };

  const [fileQuery, setFileQuery] = useUrlParam('q', '', activeTab === 'files');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [showAddFile, setShowAddFile] = useState(false);
  const [newFileForm, setNewFileForm] = useState({ fileName: '', altText: '', url: '' });
  const fileManagerInputRef = useRef<HTMLInputElement>(null);

  const [customerQuery, setCustomerQuery] = useUrlParam('q', '', activeTab === 'customers');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', email: '', location: '', subscriptionStatus: 'Not subscribed' as any });

  const [discountQuery, setDiscountQuery] = useUrlParam('q', '', activeTab === 'discounts');
  const [showAddDiscount, setShowAddDiscount] = useState(false);
  const [newDiscountForm, setNewDiscountForm] = useState<Partial<Discount>>({
    title: '', type: 'Amount off order', details: '', eligibility: 'All customers', status: 'Active'
  });
  const [showDiscountTypeSelector, setShowDiscountTypeSelector] = useState(false);
  const [selectedDiscountType, setSelectedDiscountType] = useState<'Amount off products' | 'Buy X get Y' | 'Amount off order' | 'Free shipping' | 'Loyalty Reward' | null>(null);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [isDiscountEditorOpen, setIsDiscountEditorOpen] = useState(false);

  // Reloading or closing the tab with unsaved edits asks first (the browser
  // shows its own standard confirmation).
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasUnsavedChanges]);

  // ── Refresh-safe editors ─────────────────────────────────────────────────
  // Whatever is open inside a section is mirrored to /admin-dashboard/<section>/<record>,
  // so a reload reopens it and Back closes it. Orders are handled above.
  const openRecord = useMemo((): string | null => {
    switch (activeTab) {
      case 'products':
        if (editingProduct) return localProducts.some(p => p.id === editingProduct.id) ? editingProduct.id : 'new';
        return showAddProduct ? 'new' : null;
      case 'collections':
        if (!editingCollection) return null;
        return localCollections.some(c => c.id === editingCollection.id) ? editingCollection.id : 'new';
      case 'discounts':
        if (!isDiscountEditorOpen) return null;
        return editingDiscount ? editingDiscount.id : 'new';
      case 'blogs':
        if (selectedBlog) return selectedBlog.id;
        return showAddBlog ? 'new' : null;
      case 'pages':
        return selectedBuilderPageId;
      default:
        return null;
    }
  }, [activeTab, editingProduct, showAddProduct, editingCollection, isDiscountEditorOpen, editingDiscount, selectedBlog, showAddBlog, selectedBuilderPageId, localProducts, localCollections]);

  // URL → state: on first load and on Back/Forward.
  const applyRecordFromUrl = useCallback(() => {
    const { section, recordId } = readAdminPath();
    const tab = pathToTabMap[section];
    if (!tab) return;
    switch (tab) {
      case 'products': {
        if (recordId === 'new') { setEditingProduct(null); setShowAddProduct(true); break; }
        const p = recordId ? localProducts.find(x => x.id === recordId || x.slug === recordId) : null;
        setEditingProduct(p || null);
        setShowAddProduct(false);
        break;
      }
      case 'collections': {
        if (recordId === 'new') {
          setEditingCollection({ id: 'new_temp_draft_col', title: '', description: '', type: 'Manual', image: '', productIds: [] } as any);
          break;
        }
        setEditingCollection(recordId ? localCollections.find(c => c.id === recordId || c.slug === recordId) || null : null);
        break;
      }
      case 'discounts': {
        if (recordId === 'new') {
          setEditingDiscount(null);
          setSelectedDiscountType((readQueryParam('type') as any) || 'Amount off products');
          setIsDiscountEditorOpen(true);
          break;
        }
        const d = recordId ? localDiscounts.find(x => x.id === recordId) : null;
        setEditingDiscount(d || null);
        if (d) setSelectedDiscountType(d.type as any);
        setIsDiscountEditorOpen(Boolean(d));
        break;
      }
      case 'blogs': {
        if (recordId === 'new') { setSelectedBlog(null); setShowAddBlog(true); break; }
        setSelectedBlog(recordId ? localBlogs.find(b => b.id === recordId || b.slug === recordId) || null : null);
        setShowAddBlog(false);
        break;
      }
      case 'pages': {
        const page = recordId ? localPages.find(p => p.id === recordId || p.slug === recordId) : null;
        setSelectedBuilderPageId(page ? page.id : null);
        setSelectedBuilderSectionId(page ? readQueryParam('section') : null);
        break;
      }
    }
  }, [localProducts, localCollections, localDiscounts, localBlogs, localPages]);

  // Restore once on mount (the data is already loaded when the dashboard mounts).
  const recordRestored = useRef(false);
  useEffect(() => {
    if (recordRestored.current) return;
    recordRestored.current = true;
    applyRecordFromUrl();
  }, [applyRecordFromUrl]);

  useEffect(() => {
    window.addEventListener('popstate', applyRecordFromUrl);
    return () => window.removeEventListener('popstate', applyRecordFromUrl);
  }, [applyRecordFromUrl]);

  // State → URL. The first run is skipped: on mount the restored state has not
  // landed yet, and writing now would strip the record out of a deep link.
  // Afterwards, a state that already matches the URL makes this a no-op.
  const recordUrlMounted = useRef(false);
  useEffect(() => {
    if (!recordUrlMounted.current) {
      recordUrlMounted.current = true;
      return;
    }
    if (activeTab === 'orders') return;
    const section = tabToPathMap[activeTab];
    const { section: urlSection } = readAdminPath();
    // A tab switch is pushed by the tab effect; only adjust the record part.
    if (urlSection !== section) return;
    writeAdminRecord(section, openRecord);
  }, [openRecord, activeTab]);

  // Remember which page-builder section is selected (?section=…).
  useEffect(() => {
    if (activeTab !== 'pages' || !selectedBuilderPageId) return;
    const params = new URLSearchParams(window.location.search);
    const current = params.get('section');
    const next = selectedBuilderSectionId || null;
    if (current === next) return;
    if (next) params.set('section', next); else params.delete('section');
    const qs = params.toString();
    window.history.replaceState(window.history.state, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }, [activeTab, selectedBuilderPageId, selectedBuilderSectionId]);

  // A new discount's type lives in ?type=… so a reload reopens the same form.
  useEffect(() => {
    if (activeTab !== 'discounts') return;
    const params = new URLSearchParams(window.location.search);
    const want = isDiscountEditorOpen && !editingDiscount && selectedDiscountType ? String(selectedDiscountType) : null;
    if (params.get('type') === want) return;
    if (want) params.set('type', want); else params.delete('type');
    const qs = params.toString();
    window.history.replaceState(window.history.state, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }, [activeTab, isDiscountEditorOpen, editingDiscount, selectedDiscountType]);

  // Calculate high-fidelity partner portal metrics
  const stats = useMemo(() => {
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const completedOrders = orders.length;
    const avgOrderValue = completedOrders > 0 ? totalSales / completedOrders : 0;
    const productsInDraft = products.filter(p => p.status === 'Draft').length;
    const lowStockCount = products.filter(p => p.status === 'Active' && p.inventory <= 15).length;
    
    // Traffic is NOT computed here any more.
    //
    // It used to be `completedOrders * 12 + 150`, with a conversion rate
    // derived from it — an invented figure that read as real, and that showed
    // "0 orders from 150 store sessions" on a shop with no traffic at all.
    // Visitors, page views and the conversion rate now come from Vercel Web
    // Analytics, read through /api/analytics/traffic, and are shown as unknown
    // when that is unavailable rather than filled in with a guess.

    // Calculate today's sales
    const todaySales = orders.filter(o => o.date && o.date.startsWith('Today')).reduce((sum, o) => sum + o.total, 0);

    // The geographic breakdown has moved to Vercel Web Analytics too.
    //
    // What was here counted order destinations and customer locations, then
    // multiplied by twelve ("sessionCount: count * 12 + 3") to present them as
    // sessions — and when there were none it fell back to a hardcoded list
    // claiming 154 UK sessions, 31 US, 14 German and 8 Polish. On a shop with
    // no orders the dashboard reported traffic from four countries that had
    // never visited. Real per-country visitors now come from the API.

    // 3. Dynamic Revenue Trend Graph
    const sortedOrders = [...orders].reverse();
    let pathD = "M 0 95 Q 20 60 40 40 T 80 15 T 100 2";
    let graphPoints: { x: number; y: number; label: string; value: number }[] = [];
    
    if (sortedOrders.length > 0) {
      let cumulativeRevenue = 0;
      const dataPoints = sortedOrders.map((o, idx) => {
        cumulativeRevenue += o.total;
        return {
          idx,
          cumulativeRevenue,
          dateLabel: o.date.replace('Today at ', '')
        };
      });

      const maxCumulative = cumulativeRevenue || 100;
      const stepX = 100 / Math.max(1, dataPoints.length - 1);
      
      const coordinates = dataPoints.map((dp, i) => {
        const x = Math.round(i * stepX);
        const y = Math.round(95 - (dp.cumulativeRevenue / maxCumulative) * 90);
        return { x, y, label: dp.dateLabel, value: dp.cumulativeRevenue };
      });

      if (coordinates.length === 1) {
        pathD = `M 0 95 L 50 ${coordinates[0].y} L 100 ${coordinates[0].y}`;
      } else {
        pathD = `M 0 95 ` + coordinates.map(c => `L ${c.x} ${c.y}`).join(' ');
      }
      graphPoints = coordinates;
    }

    return {
      totalSales,
      completedOrders,
      avgOrderValue,
      productsInDraft,
      lowStockCount,
      todaySales,
      pathD,
      graphPoints
    };
  }, [orders, products, customers]);

  // Handle Order fulfillment
  const handleFulfillOrder = (orderId: string) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        return { ...o, fulfillmentStatus: 'Fulfilled' as const };
      }
      return o;
    });
    onUpdateOrders(updated);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, fulfillmentStatus: 'Fulfilled' });
    }
  };

  // Add/Edit Product handlers
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.title) return;

    if (editingProduct) {
      const updated = products.map(p => {
        if (p.id === editingProduct.id) {
          return { ...p, ...newProductForm } as Product;
        }
        return p;
      });
      onUpdateProducts(updated);
      setEditingProduct(null);
    } else {
      const item: Product = {
        id: `prod-${Date.now()}`,
        title: newProductForm.title,
        description: newProductForm.description || '',
        price: Number(newProductForm.price) || 0,
        compareAtPrice: Number(newProductForm.compareAtPrice) || 0,
        inventory: Number(newProductForm.inventory) || 0,
        sku: newProductForm.sku || `SKU-${Math.floor(Math.random() * 10000)}`,
        category: newProductForm.category || 'Vitamins & Supplements',
        vendor: newProductForm.vendor || '',
        status: (newProductForm.status as any) || 'Active',
        image: newProductForm.image || '',
        weight: Number(newProductForm.weight) || 12,
        tags: newProductForm.tags || []
      };
      onUpdateProducts([item, ...products]);
    }

    // Reset forms
    setShowAddProduct(false);
    setNewProductForm({
      title: '', description: '', price: 4.99, compareAtPrice: 5.99,
      inventory: 50, sku: '', category: 'Vitamins & Supplements',
      vendor: '', status: 'Active', image: '', weight: 12, tags: []
    });
  };

  const handleEditProductClick = (prod: Product) => {
    setEditingProduct(prod);
    setNewProductForm(prod);
    setShowAddProduct(true);
  };

  const handleDuplicateProduct = (prod: Product) => {
    let count = 1;
    let baseId = prod.id;
    if (baseId.match(/-\d+$/)) {
      baseId = baseId.replace(/-\d+$/, '');
    }
    let newId = `${baseId}-${count}`;
    while (products.some(p => p.id === newId)) {
      count++;
      newId = `${baseId}-${count}`;
    }
    const duplicated: Product = {
      ...JSON.parse(JSON.stringify(prod)),
      id: newId,
      sku: prod.sku ? `${prod.sku}-COPY` : '',
      title: `${prod.title} (Copy)`
    };
    onUpdateProducts([...products, duplicated]);
  };

  const handlePreviewProduct = (prod: Product) => {
    window.open(`/products/${prod.id}`, '_blank');
  };

  const handleDeleteProduct = (pId: string) => {
    triggerConfirm("Delete this product? It will be moved to the Recycle Bin, where you can restore it for 30 days.", async () => {
      // The server moves it to the bin and out of Products. Only if that
      // succeeds does the list on screen change, so a failed delete cannot
      // leave the admin looking at a product that is still live.
      if (!(await recycleItem('products', pId))) return;
      const updated = products.filter(p => p.id !== pId);
      onUpdateProducts(updated);

      // Clean up collection references
      const updatedColls = collections.map(c => ({
        ...c,
        productIds: c.productIds.filter(id => id !== pId)
      }));
      onUpdateCollections(updatedColls);

      // Remove from selected list
      setSelectedProductIds(prev => prev.filter(id => id !== pId));
    }, "Delete Product");
  };

  const handleSelectAllProducts = (checked: boolean) => {
    if (checked) {
      const visibleIds = filteredProductsAdmin.map(p => p.id);
      setSelectedProductIds(visibleIds);
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProductIds(prev => {
        if (prev.includes(productId)) return prev;
        return [...prev, productId];
      });
    } else {
      setSelectedProductIds(prev => prev.filter(id => id !== productId));
    }
  };

  const handleBulkDeleteProducts = () => {
    if (selectedProductIds.length === 0) return;
    triggerConfirm(`Are you sure you want to bulk delete the ${selectedProductIds.length} selected products?`, () => {
      const updated = products.filter(p => !selectedProductIds.includes(p.id));
      onUpdateProducts(updated);

      // Clean up collection references
      const updatedColls = collections.map(c => ({
        ...c,
        productIds: c.productIds.filter(id => !selectedProductIds.includes(id))
      }));
      onUpdateCollections(updatedColls);

      setSelectedProductIds([]);
    }, "Bulk Delete Products");
  };

  const handleBulkStatusProducts = (status: 'Active' | 'Draft') => {
    if (selectedProductIds.length === 0) return;
    const updated = products.map(p => 
      selectedProductIds.includes(p.id) ? { ...p, status } : p
    );
    onUpdateProducts(updated);
    setSelectedProductIds([]);
  };

  const handleExportProducts = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `store_products_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e: any) {
      console.error("Export failed:", e);
      alert("Failed to export products: " + e.message);
    }
  };

  const handleImportProducts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        let importedList: any[] = [];

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          importedList = Array.isArray(parsed) ? parsed : [parsed];
        } else if (file.name.endsWith('.csv')) {
          const lines = text.split(/\r?\n/);
          if (lines.length < 2) throw new Error("CSV file is empty or lacks headers");
          
          const headerLine = lines[0];
          const separator = headerLine.includes(';') ? ';' : ',';
          const headers = headerLine.split(separator).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            let values: string[] = [];
            let currentVal = '';
            let inQuotes = false;
            for (let charIndex = 0; charIndex < line.length; charIndex++) {
              const char = line[charIndex];
              if (char === '"' || char === "'") {
                inQuotes = !inQuotes;
              } else if (char === separator && !inQuotes) {
                values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
                currentVal = '';
              } else {
                currentVal += char;
              }
            }
            values.push(currentVal.trim().replace(/^["']|["']$/g, ''));

            const rowObj: any = {};
            headers.forEach((header, index) => {
              rowObj[header] = values[index] || '';
            });

            if (rowObj.title || rowObj.id) {
              const id = rowObj.id || `prod-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
              const title = rowObj.title || "Untitled Product";
              // Only what the file says: a missing price or stock is never
              // invented, and a product without a price stays a draft.
              const parsedPrice = parseFloat(rowObj.price);
              const price = Number.isFinite(parsedPrice) ? parsedPrice : 0;
              const compareAtPrice = rowObj.compareatprice ? parseFloat(rowObj.compareatprice) : undefined;
              const parsedInventory = parseInt(rowObj.inventory, 10);
              const inventory = Number.isFinite(parsedInventory) ? parsedInventory : 0;
              const sku = rowObj.sku || '';
              const category = rowObj.category || '';
              const vendor = rowObj.vendor || '';
              const requestedStatus = (rowObj.status && ['Active', 'Draft'].includes(rowObj.status)) ? rowObj.status : 'Active';
              const status = price > 0 ? requestedStatus : 'Draft';
              const image = rowObj.image || '';
              const description = rowObj.description || '';
              const weight = parseFloat(rowObj.weight) || 0;
              const weightUnit = rowObj.weightunit || 'g';
              const parseJson = (v: string) => { try { return v ? JSON.parse(v) : undefined; } catch { return undefined; } };

              importedList.push({
                id,
                title,
                description,
                price,
                compareAtPrice,
                inventory,
                sku,
                category,
                vendor,
                status,
                image,
                weight,
                weightUnit,
                tags: rowObj.tags ? rowObj.tags.split('|').map((t: string) => t.trim()).filter(Boolean) : [],
                slug: rowObj.slug || id,
                ...(rowObj.strength ? { strength: rowObj.strength } : {}),
                ...(rowObj.flavour ? { flavour: rowObj.flavour } : {}),
                variants: parseJson(rowObj.variants) || [],
                concreteVariants: parseJson(rowObj.concretevariants) || []
              });
            }
          }
        } else {
          throw new Error("Unsupported file extension. Please select a .json or .csv file.");
        }

        if (importedList.length === 0) {
          throw new Error("No products could be parsed from the file.");
        }

        triggerConfirm(`Do you want to MERGE these ${importedList.length} products with your existing catalog? (Clicking 'OK' merges them. To replace your entire catalog, click cancel first and empty your catalog, or contact support.)`, () => {
          const existingIds = new Set(products.map(p => p.id));
          const merged = [...products];
          importedList.forEach(item => {
            if (existingIds.has(item.id)) {
              const idx = merged.findIndex(p => p.id === item.id);
              if (idx !== -1) merged[idx] = item;
            } else {
              merged.push(item);
            }
          });
          onUpdateProducts(merged);
        }, `Import ${importedList.length} Products`);

      } catch (err: any) {
        console.error("Import failed:", err);
        alert("Failed to import products: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportCollections = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(collections, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `store_collections_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e: any) {
      console.error("Export failed:", e);
      alert("Failed to export collections: " + e.message);
    }
  };

  const handleImportCollections = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const importedList = Array.isArray(parsed) ? parsed : [parsed];

        if (importedList.length === 0) {
          throw new Error("No collections could be parsed from the file.");
        }

        triggerConfirm(`Do you want to MERGE these ${importedList.length} collections with your existing lists?`, () => {
          const existingIds = new Set(collections.map(c => c.id));
          const merged = [...collections];
          importedList.forEach(item => {
            if (item && item.id) {
              if (existingIds.has(item.id)) {
                const idx = merged.findIndex(c => c.id === item.id);
                if (idx !== -1) merged[idx] = item;
              } else {
                merged.push(item);
              }
            }
          });
          onUpdateCollections(merged);
        }, "Import Collections Backup");

      } catch (err: any) {
        console.error("Import failed:", err);
        alert("Failed to import collections: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportPages = () => {
    try {
      // Validate and ensure all nested sections and settings are fully formatted
      const pagesToExport = (localPages || customPages || []).map(page => ({
        ...page,
        sections: (page.sections || []).map(section => ({
          ...section,
          settings: { ...(section.settings || {}) }
        }))
      }));

      // Direct download of backup JSON
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pagesToExport, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `store_pages_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      // Persist to localStorage and Neon PostgreSQL to guarantee safety
      try {
        localStorage.setItem('ps_custom_pages', JSON.stringify(pagesToExport));
      } catch (e) {
        console.warn('LocalStorage backup failed:', e);
      }

      fetch('/api/custompages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pagesToExport)
      }).catch(err => console.error('[Export Safety Sync] POST failed:', err));

    } catch (e: any) {
      console.error("Export failed:", e);
      alert("Failed to export pages: " + e.message);
    }
  };

  const handleImportPages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const importedList = Array.isArray(parsed) ? parsed : [parsed];

        if (importedList.length === 0) {
          throw new Error("No pages could be parsed from the file.");
        }

        triggerConfirm(`Do you want to MERGE these ${importedList.length} custom pages with your existing pages?`, () => {
          const existingIds = new Set(localPages.map(p => p.id));
          const merged = [...localPages];
          importedList.forEach(item => {
            if (item && (item.id || item.slug)) {
              const targetId = item.id || item.slug;
              const idx = merged.findIndex(p => p.id === targetId || p.slug === item.slug);
              if (idx !== -1) {
                // Ensure sections from imported item or existing item are preserved
                const existingSections = merged[idx].sections || [];
                const importedSections = item.sections || [];
                const finalSections = importedSections.length > 0 ? importedSections : existingSections;
                merged[idx] = { ...item, sections: finalSections };
              } else {
                merged.push(item);
              }
            }
          });

          setLocalPages(merged);
          parentOnUpdateCustomPages(merged);

          try {
            localStorage.setItem('ps_custom_pages', JSON.stringify(merged));
          } catch (err) {}

          fetch('/api/custompages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(merged)
          }).catch(err => console.error('[Import Safety Sync] POST failed:', err));

          alert(`Successfully imported and merged ${importedList.length} pages into database and local storage!`);
        }, "Import Pages Backup");

      } catch (err: any) {
        console.error("Import failed:", err);
        alert("Failed to import pages: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportOrders = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(orders, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `store_orders_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e: any) {
      console.error("Export failed:", e);
      alert("Failed to export orders: " + e.message);
    }
  };

  const handleImportOrders = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const importedList = Array.isArray(parsed) ? parsed : [parsed];

        if (importedList.length === 0) {
          throw new Error("No orders could be parsed from the file.");
        }

        triggerConfirm(`Do you want to MERGE these ${importedList.length} orders with your existing orders?`, () => {
          const existingIds = new Set(orders.map(o => o.id));
          const merged = [...orders];
          importedList.forEach(item => {
            if (item && item.id) {
              if (existingIds.has(item.id)) {
                const idx = merged.findIndex(o => o.id === item.id);
                if (idx !== -1) merged[idx] = item;
              } else {
                merged.push(item);
              }
            }
          });
          onUpdateOrders(merged);
        }, "Import Orders Backup");

      } catch (err: any) {
        console.error("Import failed:", err);
        alert("Failed to import orders: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportCustomers = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customers, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `store_customers_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e: any) {
      console.error("Export failed:", e);
      alert("Failed to export customers: " + e.message);
    }
  };

  const handleImportCustomers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const importedList = Array.isArray(parsed) ? parsed : [parsed];

        if (importedList.length === 0) {
          throw new Error("No customers could be parsed from the file.");
        }

        triggerConfirm(`Do you want to MERGE these ${importedList.length} customers with your existing customers list?`, () => {
          const existingIds = new Set(customers.map(c => c.id));
          const merged = [...customers];
          importedList.forEach(item => {
            if (item && item.id) {
              if (existingIds.has(item.id)) {
                const idx = merged.findIndex(c => c.id === item.id);
                if (idx !== -1) merged[idx] = item;
              } else {
                merged.push(item);
              }
            }
          });
          onUpdateCustomers(merged);
        }, "Import Customers Backup");

      } catch (err: any) {
        console.error("Import failed:", err);
        alert("Failed to import customers: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportDiscounts = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(discounts, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `store_discounts_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e: any) {
      console.error("Export failed:", e);
      alert("Failed to export discounts: " + e.message);
    }
  };

  const handleImportDiscounts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const importedList = Array.isArray(parsed) ? parsed : [parsed];

        if (importedList.length === 0) {
          throw new Error("No discounts could be parsed from the file.");
        }

        triggerConfirm(`Do you want to MERGE these ${importedList.length} discounts with your existing discounts list?`, () => {
          const existingIds = new Set(discounts.map(d => d.id));
          const merged = [...discounts];
          importedList.forEach(item => {
            if (item && item.id) {
              if (existingIds.has(item.id)) {
                const idx = merged.findIndex(d => d.id === item.id);
                if (idx !== -1) merged[idx] = item;
              } else {
                merged.push(item);
              }
            }
          });
          onUpdateDiscounts(merged);
        }, "Import Discounts Backup");

      } catch (err: any) {
        console.error("Import failed:", err);
        alert("Failed to import discounts: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportBlogs = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(blogs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `store_blogs_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e: any) {
      console.error("Export failed:", e);
      alert("Failed to export blogs: " + e.message);
    }
  };

  const handleImportBlogs = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const importedList = Array.isArray(parsed) ? parsed : [parsed];

        if (importedList.length === 0) {
          throw new Error("No blog posts could be parsed from the file.");
        }

        triggerConfirm(`Do you want to MERGE these ${importedList.length} blog posts with your existing blog posts list?`, () => {
          const existingIds = new Set(blogs.map(b => b.id));
          const merged = [...blogs];
          importedList.forEach(item => {
            if (item && item.id) {
              if (existingIds.has(item.id)) {
                const idx = merged.findIndex(b => b.id === item.id);
                if (idx !== -1) merged[idx] = item;
              } else {
                merged.push(item);
              }
            }
          });
          onUpdateBlogs(merged);
        }, "Import Blogs Backup");

      } catch (err: any) {
        console.error("Import failed:", err);
        alert("Failed to import blogs: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportFiles = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localFiles, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `store_files_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e: any) {
      console.error("Export failed:", e);
      alert("Failed to export files: " + e.message);
    }
  };

  const handleImportFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const importedList = Array.isArray(parsed) ? parsed : [parsed];

        if (importedList.length === 0) {
          throw new Error("No files could be parsed from the backup file.");
        }

        const isValid = importedList.every(item => item && item.id && item.url && item.fileName);
        if (!isValid) {
          throw new Error("Invalid file backup format. Each item must have an id, url, and fileName.");
        }

        triggerConfirm(`Do you want to MERGE these ${importedList.length} files with your existing files list?`, () => {
          const existingIds = new Set(localFiles.map(f => f.id));
          const merged = [...localFiles];
          importedList.forEach(item => {
            if (item && item.id) {
              if (existingIds.has(item.id)) {
                const idx = merged.findIndex(f => f.id === item.id);
                if (idx !== -1) merged[idx] = item;
              } else {
                merged.push(item);
              }
            }
          });
          onUpdateFiles(merged);
        }, "Import Files Backup");

      } catch (err: any) {
        console.error("Import failed:", err);
        alert("Failed to import files: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Create & Edit Collection
  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionForm.title) return;

    if (editingCollection) {
      const updated = collections.map(c => 
        c.id === editingCollection.id 
          ? { 
              ...c, 
              title: newCollectionForm.title!, 
              description: newCollectionForm.description || '', 
              type: newCollectionForm.type || 'Manual',
              image: newCollectionForm.image || c.image
            } 
          : c
      );
      onUpdateCollections(updated);
      setEditingCollection(null);
    } else {
      const item: Collection = {
        id: slugify(newCollectionForm.title),
        title: newCollectionForm.title,
        description: newCollectionForm.description || '',
        type: (newCollectionForm.type as any) || 'Manual',
        image: newCollectionForm.image || '',
        productIds: []
      };
      onUpdateCollections([...collections, item]);
    }

    setShowAddCollection(false);
    setNewCollectionForm({ title: '', description: '', type: 'Manual', image: '', productIds: [] });
  };

  const handleDuplicateCollection = (col: Collection) => {
    let count = 1;
    let baseId = col.id;
    if (baseId.match(/-\d+$/)) {
      baseId = baseId.replace(/-\d+$/, '');
    }
    let newId = `${baseId}-${count}`;
    while (collections.some(c => c.id === newId)) {
      count++;
      newId = `${baseId}-${count}`;
    }
    const duplicated: Collection = {
      ...JSON.parse(JSON.stringify(col)),
      id: newId,
      title: `${col.title} (Copy)`
    };
    onUpdateCollections([...collections, duplicated]);
  };

  const handlePreviewCollection = (col: Collection) => {
    window.open(`/collections/${col.id}`, '_blank');
  };

  const handleDeleteCollection = (id: string) => {
    triggerConfirm("Delete this collection? It will be moved to the Recycle Bin, where you can restore it for 30 days.", async () => {
      if (!(await recycleItem('collections', id))) return;
      onUpdateCollections(collections.filter(c => c.id !== id));
      setSelectedCollectionIds(prev => prev.filter(item => item !== id));
    }, "Delete Collection");
  };

  const handleSelectAllCollections = (checked: boolean) => {
    if (checked) {
      const visibleIds = filteredCollections.filter(c => c.id !== 'all').map(c => c.id);
      setSelectedCollectionIds(visibleIds);
    } else {
      setSelectedCollectionIds([]);
    }
  };

  const handleSelectCollection = (colId: string, checked: boolean) => {
    if (checked) {
      setSelectedCollectionIds(prev => {
        if (prev.includes(colId)) return prev;
        return [...prev, colId];
      });
    } else {
      setSelectedCollectionIds(prev => prev.filter(id => id !== colId));
    }
  };

  const handleBulkDeleteCollections = () => {
    if (selectedCollectionIds.length === 0) return;
    triggerConfirm(`Are you sure you want to bulk delete the ${selectedCollectionIds.length} selected collections?`, () => {
      onUpdateCollections(collections.filter(c => !selectedCollectionIds.includes(c.id)));
      setSelectedCollectionIds([]);
    }, "Bulk Delete Collections");
  };

  // Pages & Section Builder Handlers
  const handleAddPageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const titleClean = newPageForm.title.trim();
    if (!titleClean) return;

    let baseSlug = newPageForm.slug.trim() ? slugify(newPageForm.slug) : slugify(titleClean);
    if (!baseSlug) baseSlug = 'custom-page';

    // Deduplicate slug to ensure unique routing
    let finalSlug = baseSlug;
    let count = 1;
    while (localPages.some(p => p.slug === finalSlug || p.id === finalSlug)) {
      finalSlug = `${baseSlug}-${count++}`;
    }

    const pageId = `page-${Date.now()}`;
    const newSecId = `sec-${Date.now()}`;

    const page: CustomPage = {
      id: pageId,
      title: titleClean,
      slug: finalSlug,
      visibility: 'Visible',
      updatedAt: 'Just now',
      sections: [
        {
          id: newSecId,
          type: 'Rich text',
          settings: {
            fullWidth: false,
            backgroundColor: '#FFFFFF',
            headingColor: '#1E293B',
            textColor: '#64748B',
            title: titleClean,
            description: 'Custom sections will display below here. You can add and configure sections using the builder.'
          }
        }
      ]
    };

    const updatedPages = [...localPages, page];
    setLocalPages(updatedPages);
    onUpdateCustomPages(updatedPages);

    // Persist immediately to backend
    fetch('/api/custompages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPages)
    }).catch(() => {});

    // Automatically select the newly created page to enter builder immediately
    setSelectedBuilderPageId(pageId);
    setSelectedBuilderSectionId(newSecId);

    setShowAddPage(false);
    setNewPageForm({ title: '', slug: '' });
  };

  // Section builder editing
  const currentlyEditingPage = localPages.find(p => 
    p.id === selectedBuilderPageId || 
    p.slug === selectedBuilderPageId ||
    (selectedBuilderPageId === 'homepage' && (p.isHomepage || p.id === 'page-home' || p.slug === '' || p.slug === 'home')) ||
    (selectedBuilderPageId === 'page-home' && (p.isHomepage || p.id === 'homepage' || p.slug === '' || p.slug === 'home'))
  ) || (selectedBuilderPageId ? localPages.find(p => p.isHomepage) : localPages[0]);
  const currentlyEditingSection = currentlyEditingPage?.sections.find(s => s.id === selectedBuilderSectionId);

  const handleAddSectionToPage = (sectionType: PageSection['type']) => {
    if (!selectedBuilderPageId) return;
    
    // Banner, Slideshow and Marquee text should be full width by default!
    const isFullWidthByDefault = sectionType === 'Image banner' || sectionType === 'Slideshow' || sectionType === 'Marquee text' || sectionType === 'Video banner';
    
    const newSection: PageSection = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: sectionType,
      settings: defaultSectionSettings(sectionType)
    };

    const pageMatchesSelected = (p: CustomPage) => {
      if (!selectedBuilderPageId) return false;
      if (p.id === selectedBuilderPageId || p.slug === selectedBuilderPageId) return true;
      if (currentlyEditingPage && p.id === currentlyEditingPage.id) return true;
      if (selectedBuilderPageId === 'homepage' && (p.isHomepage || p.id === 'page-home' || p.slug === '' || p.slug === 'home')) return true;
      return false;
    };

    const updated = localPages.map(page => {
      if (pageMatchesSelected(page)) {
        return {
          ...page,
          sections: [...page.sections, newSection]
        };
      }
      return page;
    });
    setLocalPages(updated);
    onUpdateCustomPages(updated);
    setHasUnsavedChanges(true);
    setSelectedBuilderSectionId(newSection.id);
  };

  const handleRemoveSectionFromPage = (sectionId: string) => {
    if (!selectedBuilderPageId) return;
    const pageMatchesSelected = (p: CustomPage) => {
      if (!selectedBuilderPageId) return false;
      if (p.id === selectedBuilderPageId || p.slug === selectedBuilderPageId) return true;
      if (currentlyEditingPage && p.id === currentlyEditingPage.id) return true;
      if (selectedBuilderPageId === 'homepage' && (p.isHomepage || p.id === 'page-home' || p.slug === '' || p.slug === 'home')) return true;
      return false;
    };

    const updated = localPages.map(page => {
      if (pageMatchesSelected(page)) {
        return {
          ...page,
          sections: page.sections.filter(s => s.id !== sectionId)
        };
      }
      return page;
    });
    setLocalPages(updated);
    onUpdateCustomPages(updated);
    setHasUnsavedChanges(true);
    if (selectedBuilderSectionId === sectionId) {
      setSelectedBuilderSectionId(null);
    }
  };

  const handleUpdateSectionSettings = (settingsKey: string, val: any) => {
    if (!selectedBuilderPageId || !selectedBuilderSectionId) return;
    const pageMatchesSelected = (p: CustomPage) => {
      if (!selectedBuilderPageId) return false;
      if (p.id === selectedBuilderPageId || p.slug === selectedBuilderPageId) return true;
      if (currentlyEditingPage && p.id === currentlyEditingPage.id) return true;
      if (selectedBuilderPageId === 'homepage' && (p.isHomepage || p.id === 'page-home' || p.slug === '' || p.slug === 'home')) return true;
      return false;
    };

    const updated = localPages.map(page => {
      if (pageMatchesSelected(page)) {
        return {
          ...page,
          sections: page.sections.map(s => {
            if (s.id === selectedBuilderSectionId) {
              return {
                ...s,
                settings: {
                  ...s.settings,
                  [settingsKey]: val
                }
              };
            }
            return s;
          })
        };
      }
      return page;
    });
    setLocalPages(updated);
    onUpdateCustomPages(updated);
    setHasUnsavedChanges(true);
  };

  const handleUpdatePageProperties = (updates: Partial<CustomPage>) => {
    if (!selectedBuilderPageId) return;
    const pageMatchesSelected = (p: CustomPage) => {
      if (!selectedBuilderPageId) return false;
      if (p.id === selectedBuilderPageId || p.slug === selectedBuilderPageId) return true;
      if (currentlyEditingPage && p.id === currentlyEditingPage.id) return true;
      if (selectedBuilderPageId === 'homepage' && (p.isHomepage || p.id === 'page-home' || p.slug === '' || p.slug === 'home')) return true;
      return false;
    };

    const updated = localPages.map(p => {
      if (pageMatchesSelected(p)) {
        return {
          ...p,
          ...updates,
          updatedAt: new Date().toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })
        };
      }
      return p;
    });
    setLocalPages(updated);
    onUpdateCustomPages(updated);
    setHasUnsavedChanges(true);
    if (onDirtyChange) onDirtyChange(true);
  };

  // Move Section Up/Down
  const handleMoveSection = (idx: number, direction: 'up' | 'down') => {
    if (!selectedBuilderPageId) return;
    const page = localPages.find(p => p.id === selectedBuilderPageId);
    if (!page) return;
    const sections = [...page.sections];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    // Swap
    const temp = sections[idx];
    sections[idx] = sections[targetIdx];
    sections[targetIdx] = temp;

    const updated = localPages.map(p => {
      if (p.id === selectedBuilderPageId) {
        return { ...p, sections };
      }
      return p;
    });
    setLocalPages(updated);
    onUpdateCustomPages(updated);
    setHasUnsavedChanges(true);
  };

  // Move Section to index (drag and drop)
  const handleMoveSectionTo = (fromIdx: number, toIdx: number) => {
    if (!selectedBuilderPageId) return;
    const page = localPages.find(p => p.id === selectedBuilderPageId);
    if (!page) return;
    const sections = [...page.sections];
    if (fromIdx < 0 || fromIdx >= sections.length || toIdx < 0 || toIdx >= sections.length || fromIdx === toIdx) return;

    const [movedSection] = sections.splice(fromIdx, 1);
    sections.splice(toIdx, 0, movedSection);

    const updated = localPages.map(p => {
      if (p.id === selectedBuilderPageId) {
        return { ...p, sections };
      }
      return p;
    });
    setLocalPages(updated);
    onUpdateCustomPages(updated);
    setHasUnsavedChanges(true);
    if (onDirtyChange) onDirtyChange(true);
  };

  // Add Custom Media File Upload
  const handleDirectDeviceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newEntries: FileEntry[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      try {
        const isVid = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogg|avi|mkv)$/i.test(file.name);
        let uploadedEntry: any = null;

        // 1. Primary: FormData Upload to /api/media/upload
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', 'storefront_media');

          const res = await fetch('/api/media/upload', {
            method: 'POST',
            body: formData
          });
          if (res.ok) {
            const data = await res.json();
            uploadedEntry = data.file || data;
          }
        } catch (fErr) {
          console.warn('[Direct File Upload] FormData upload error, falling back:', fErr);
        }

        // 2. Secondary Fallback: Base64 Upload to /api/upload
        if (!uploadedEntry || !uploadedEntry.url) {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          try {
            const res = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: dataUrl, filename: file.name })
            });
            if (res.ok) {
              uploadedEntry = await res.json();
            }
          } catch (_) {}
        }

        const calculatedSize = file.size > 1024 * 1024 
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${Math.round(file.size / 1024)} KB`;

        const finalUrl = uploadedEntry?.url || uploadedEntry?.secureUrl;
        if (finalUrl) {
          const entry: FileEntry = {
            id: uploadedEntry?.id || `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            fileName: file.name,
            altText: file.name.split('.')[0] || 'Uploaded Media Asset',
            dateAdded: new Date().toISOString().split('T')[0],
            size: uploadedEntry?.fileSize || uploadedEntry?.size || calculatedSize,
            references: 'Direct Upload',
            url: finalUrl,
            mimeType: file.type || uploadedEntry?.mimeType || (isVid ? 'video/mp4' : 'image/png'),
            resourceType: uploadedEntry?.resourceType || (isVid ? 'video' : 'image'),
            publicId: uploadedEntry?.publicId
          };

          newEntries.push(entry);
        }
      } catch (err) {
        console.error('Failed uploading file:', file.name, err);
      }
    }

    if (newEntries.length > 0) {
      const updated = [...newEntries, ...files.filter(f => !newEntries.some(ne => ne.url === f.url || ne.id === f.id))];
      onUpdateFiles(updated);
      setLocalFiles(updated);
      try {
        const filesSubset = updated.slice(0, 25).map((f: any) => ({ id: f.id, url: f.url, fileName: f.fileName, size: f.size }));
        localStorage.setItem('ps_files', JSON.stringify(filesSubset));
      } catch (e) {}

      fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(() => {});
    }

    if (fileManagerInputRef.current) {
      fileManagerInputRef.current.value = '';
    }
  };

  const handleAddFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileForm.fileName || !newFileForm.url) return;

    const file: FileEntry = {
      id: `file-${Date.now()}`,
      fileName: newFileForm.fileName,
      altText: newFileForm.altText || 'Media File Asset description text',
      dateAdded: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      size: `${(Math.random() * 400 + 40).toFixed(2)} KB`,
      references: 'Unused / Builder',
      url: newFileForm.url
    };

    const updated = [file, ...files];
    onUpdateFiles(updated);
    setLocalFiles(updated);
    fetch('/api/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(() => {});

    setShowAddFile(false);
    setNewFileForm({ fileName: '', altText: '', url: '' });
  };

  const handleDeleteFile = (id: string) => {
    triggerConfirm("Delete this media file? It will be moved to the Recycle Bin, where you can restore it for 30 days.", async () => {
      // Through the bin rather than DELETE /api/files/:id, which destroys the
      // Cloudinary asset immediately. The asset is kept while the entry sits in
      // the bin — a restored image whose file had already been deleted would
      // come back as a broken link — and removed when the entry is destroyed.
      if (!(await recycleItem('files', id))) return;
      const remaining = files.filter(f => f.id !== id && f.url !== id);
      onUpdateFiles(remaining);
      setLocalFiles(remaining);
      setSelectedFileIds(prev => prev.filter(fid => fid !== id));
    }, "Delete Media File");
  };

  const handleSelectAllFiles = (checked: boolean) => {
    if (checked) {
      setSelectedFileIds(filteredFiles.map(f => f.id));
    } else {
      setSelectedFileIds([]);
    }
  };

  const handleSelectFile = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedFileIds(prev => [...prev, id]);
    } else {
      setSelectedFileIds(prev => prev.filter(fid => fid !== id));
    }
  };

  const handleBulkDeleteFiles = () => {
    if (selectedFileIds.length === 0) return;
    triggerConfirm(`Are you sure you want to bulk delete the ${selectedFileIds.length} selected media files?`, () => {
      const remaining = files.filter(f => !selectedFileIds.includes(f.id));
      onUpdateFiles(remaining);
      setLocalFiles(remaining);
      selectedFileIds.forEach(id => {
        fetch(`/api/files/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
      });
      setSelectedFileIds([]);
    }, "Bulk Delete Media Files");
  };

  // Add Customer
  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name || !newCustomerForm.email) return;

    const cust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustomerForm.name,
      email: newCustomerForm.email,
      subscriptionStatus: newCustomerForm.subscriptionStatus,
      location: newCustomerForm.location || 'United Kingdom',
      ordersCount: 0,
      amountSpent: 0.00,
      addresses: newCustomerForm.location ? [newCustomerForm.location] : [],
      wishlist: []
    };

    onUpdateCustomers([cust, ...customers]);
    setShowAddCustomer(false);
    setNewCustomerForm({ name: '', email: '', location: '', subscriptionStatus: 'Not subscribed' });
  };

  // Create discount code
  const handleCreateDiscountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscountForm.title) return;

    const disc: Discount = {
      id: `disc-${Date.now()}`,
      title: newDiscountForm.title.toUpperCase().replace(/\s+/g, ''),
      status: 'Active',
      method: 'Code',
      eligibility: newDiscountForm.eligibility || 'All customers',
      type: (newDiscountForm.type as any) || 'Amount off order',
      used: 0,
      details: newDiscountForm.details || '15% off standard purchases'
    };

    onUpdateDiscounts([...discounts, disc]);
    setShowAddDiscount(false);
    setNewDiscountForm({ title: '', type: 'Amount off order', details: '', eligibility: 'All customers' });
  };

  const handleToggleDiscountStatus = (id: string) => {
    const updated = discounts.map(d => {
      if (d.id === id) {
        return { ...d, status: d.status === 'Active' ? 'Expired' as const : 'Active' as const };
      }
      return d;
    });
    onUpdateDiscounts(updated);
  };

  const handleDeleteDiscount = (id: string) => {
    triggerConfirm("Are you sure you want to delete this promotional code?", () => {
      onUpdateDiscounts(discounts.filter(d => d.id !== id));
    }, "Delete Discount");
  };

  const handleCreateBlog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlogForm.title) return;
    const slug = newBlogForm.slug || slugify(newBlogForm.title);
    
    if (blogs.some(b => b.slug === slug)) {
      alert("A blog post with this slug already exists! Slugs must be unique.");
      return;
    }

    const tags = blogTagsInput.split(',').map(t => t.trim()).filter(Boolean);

    const createdBlog: BlogPost = {
      id: 'blog-' + Date.now(),
      title: newBlogForm.title,
      slug: slug,
      excerpt: newBlogForm.excerpt || '',
      content: newBlogForm.content || '',
      image: newBlogForm.image || '',
      author: newBlogForm.author || 'Store Owner',
      category: newBlogForm.category || 'General',
      status: (newBlogForm.status as 'Active' | 'Draft' | 'Archived') || 'Active',
      publishedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      readTime: newBlogForm.readTime || '5 min read',
      tags: tags.length > 0 ? tags : ['General']
    };

    onUpdateBlogs([createdBlog, ...blogs]);
    setShowAddBlog(false);
    setNewBlogForm({
      title: '', excerpt: '', content: '', image: '',
      author: 'Admin', category: 'General', status: 'Active',
      publishedAt: '', readTime: '5 min read', tags: []
    });
    setBlogTagsInput('');
  };

  const handleUpdateBlog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlog) return;
    const updatedSlug = selectedBlog.slug || slugify(selectedBlog.title);
    
    if (blogs.some(b => b.slug === updatedSlug && b.id !== selectedBlog.id)) {
      alert("A blog post with this slug already exists! Slugs must be unique.");
      return;
    }

    const tags = blogTagsInput.split(',').map(t => t.trim()).filter(Boolean);

    const updatedBlog: BlogPost = {
      ...selectedBlog,
      slug: updatedSlug,
      tags: tags
    };

    onUpdateBlogs(blogs.map(b => b.id === selectedBlog.id ? updatedBlog : b));
    setSelectedBlog(null);
    setBlogTagsInput('');
  };

  const handleDeleteBlog = (blogId: string) => {
    triggerConfirm("Delete this blog post? It will be moved to the Recycle Bin, where you can restore it for 30 days.", async () => {
      if (!(await recycleItem('blogs', blogId))) return;
      onUpdateBlogs(blogs.filter(b => b.id !== blogId));
    }, "Delete Blog Post");
  };


  // Filters listings
  const filteredOrders = useMemo(() => {
    const list = orders.filter(o => {
      const matchQuery = o.id.toLowerCase().includes(orderQuery.toLowerCase()) || 
                         o.customerName.toLowerCase().includes(orderQuery.toLowerCase()) ||
                         o.customerEmail.toLowerCase().includes(orderQuery.toLowerCase());
      
      if (orderStatusFilter === 'All') return matchQuery;
      return matchQuery && o.fulfillmentStatus === orderStatusFilter;
    });

    return list.sort((a, b) => parseOrderTime(b) - parseOrderTime(a));
  }, [orders, orderQuery, orderStatusFilter]);

  const filteredProductsAdmin = useMemo(() => {
    const filtered = products.filter(p => 
      p.title.toLowerCase().includes(productQuery.toLowerCase()) ||
      p.vendor.toLowerCase().includes(productQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(productQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const idA = parseInt(String(a.id).replace(/\D/g, '')) || 0;
      const idB = parseInt(String(b.id).replace(/\D/g, '')) || 0;
      if (idA && idB && idA !== idB) {
        return idB - idA;
      }
      return String(b.id).localeCompare(String(a.id));
    });
  }, [products, productQuery]);

  const filteredCollections = useMemo(() => {
    return collections.filter(c => 
      c.title.toLowerCase().includes(collectionQuery.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(collectionQuery.toLowerCase()) ||
      c.type.toLowerCase().includes(collectionQuery.toLowerCase())
    );
  }, [collections, collectionQuery]);

  const filteredFiles = useMemo(() => {
    return files.filter(f => 
      f.fileName.toLowerCase().includes(fileQuery.toLowerCase()) ||
      f.altText.toLowerCase().includes(fileQuery.toLowerCase())
    );
  }, [files, fileQuery]);

  const filteredCustomers = useMemo(() => {
    return (customers || []).filter(c => 
      c && (
        (c.name || '').toLowerCase().includes((customerQuery || '').toLowerCase()) ||
        (c.email || '').toLowerCase().includes((customerQuery || '').toLowerCase()) ||
        (c.location || '').toLowerCase().includes((customerQuery || '').toLowerCase())
      )
    );
  }, [customers, customerQuery]);

  const filteredDiscounts = useMemo(() => {
    return (discounts || []).filter(d => 
      d && (
        (d.title || '').toLowerCase().includes((discountQuery || '').toLowerCase()) ||
        (d.details || '').toLowerCase().includes((discountQuery || '').toLowerCase())
      )
    );
  }, [discounts, discountQuery]);

  const filteredBlogs = useMemo(() => {
    return blogs.filter(b => {
      const matchesSearch = b.title.toLowerCase().includes(blogQuery.toLowerCase()) || 
                            b.excerpt.toLowerCase().includes(blogQuery.toLowerCase()) ||
                            b.tags.some(t => t.toLowerCase().includes(blogQuery.toLowerCase()));
      const matchesStatus = blogStatusFilter === 'All' || b.status === blogStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [blogs, blogQuery, blogStatusFilter]);

  return (
    <div id="partner-admin-scaffold" className="flex flex-col lg:flex-row min-h-screen bg-[#f6f6f7] text-slate-800 font-sans">
      
      {!selectedBuilderPageId && (
        <AdminSidebar
          active={activeTab as AdminSection}
          onNavigate={(section) => {
            setActiveTab(section as SidebarTab);
            setSelectedBuilderPageId(null);
          }}
          storeName={localLayoutSettings.headerLogoText || ''}
          unfulfilledOrders={orders.filter(o => o.fulfillmentStatus === 'Unfulfilled').length}
          recycleBinCount={recycleBinCount}
          onSignOut={onLogoutAdmin}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col">
      {/* Top bar */}
      {!selectedBuilderPageId && (
        <header className="sticky top-0 z-40 h-14 shrink-0 bg-white/90 backdrop-blur border-b border-slate-200 flex items-center gap-3 px-4 md:px-6">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden -ml-1 h-9 w-9 flex items-center justify-center rounded-lg hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-[15px] font-semibold text-slate-900 truncate">
            {SECTION_LABELS[activeTab as AdminSection] || 'Dashboard'}
          </h1>
          <div className="flex-1" />
          <span className={`hidden sm:inline-flex items-center gap-1.5 text-[12px] ${hasUnsavedChanges ? 'text-amber-700' : 'text-slate-500'}`}>
            <span className={`h-2 w-2 rounded-full ${hasUnsavedChanges ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            {hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}
          </span>
          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Discard all unsaved changes? This cannot be undone.')) handleGlobalDiscard();
              }}
              className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
            >
              Discard
            </button>
          )}
          <button
            type="button"
            onClick={handleGlobalSave}
            disabled={!hasUnsavedChanges || isSaving}
            className={`h-9 rounded-lg px-4 text-[13px] font-semibold flex items-center gap-1.5 transition ${
              hasUnsavedChanges && !isSaving ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </header>
      )}

      {/* Main Panel space */}
      <main className={selectedBuilderPageId ? "w-full p-4 lg:p-6" : "flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6 overflow-x-hidden"}>

        {/* Database status: one line, with the details on the Database page */}
        {!selectedBuilderPageId && dbStatus && (dbStatus.status === 'not-configured' || dbStatus.status === 'error') && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="flex-1">
              {dbStatus.status === 'not-configured'
                ? <>The database is not connected, so changes cannot be stored permanently. Set <code className="font-mono text-[12px]">DATABASE_URL</code> in your hosting environment and redeploy.</>
                : <>The database is unreachable right now; recent changes are held temporarily and synced once it is back.</>}
            </span>
            <button
              type="button"
              onClick={() => { setActiveTab('diagnostics'); setSelectedBuilderPageId(null); }}
              className="self-start sm:self-auto shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-[12px] font-semibold hover:bg-amber-100"
            >
              View details
            </button>
          </div>
        )}

        {/* Tab content conditionals */}
        
        {/* 1. ANALYTICS BLOCK */}
        {activeTab === 'analytics' && (
          <AnalyticsTab stats={stats} />
        )}

        {/* 2. ORDERS BLOCK */}
        {activeTab === 'orders' && (
          <OrdersTab
            orders={orders}
            products={products}
            orderStatusFilter={orderStatusFilter}
            setOrderStatusFilter={setOrderStatusFilter}
            handleExportOrders={handleExportOrders}
            handleImportOrders={handleImportOrders}
            orderQuery={orderQuery}
            setOrderQuery={setOrderQuery}
            filteredOrders={filteredOrders}
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
            parentOrders={orders}
            parentOnUpdateOrders={onUpdateOrders}
            timelineComments={timelineComments}
            setTimelineComments={setTimelineComments}
            showTrackingModal={showTrackingModal}
            setShowTrackingModal={setShowTrackingModal}
            trackingNumberInput={trackingNumberInput}
            setTrackingNumberInput={setTrackingNumberInput}
            carrierInput={carrierInput}
            setCarrierInput={setCarrierInput}
            showConfirmDeleteModal={(title, message, onConfirm) => {
              if (confirm(`${title}\n\n${message}`)) onConfirm();
            }}
            onNavigateToShipping={() => setActiveTab('delivery')}
          />
        )}

        {/* 3. COLLECTIONS BLOCK */}
        {activeTab === 'collections' && (
          <CollectionsTab
            editingCollection={editingCollection}
            setEditingCollection={setEditingCollection}
            products={products}
            collections={collections}
            onUpdateCollections={onUpdateCollections}
            collectionQuery={collectionQuery}
            setCollectionQuery={setCollectionQuery}
            filteredCollections={filteredCollections}
            handleExportCollections={handleExportCollections}
            handleImportCollections={handleImportCollections}
            selectedCollectionIds={selectedCollectionIds}
            handleSelectAllCollections={handleSelectAllCollections}
            handleBulkDeleteCollections={handleBulkDeleteCollections}
            handleSelectCollection={handleSelectCollection}
            setNewCollectionForm={setNewCollectionForm}
            handleDuplicateCollection={handleDuplicateCollection}
            handlePreviewCollection={handlePreviewCollection}
            handleDeleteCollection={handleDeleteCollection}
          />
        )}

        {/* 4. PRODUCTS BLOCK */}
        {activeTab === 'products' && (
          <ProductsTab
            editingProduct={editingProduct}
            showAddProduct={showAddProduct}
            setEditingProduct={setEditingProduct}
            setShowAddProduct={setShowAddProduct}
            collections={collections}
            products={products}
            onUpdateProducts={onUpdateProducts}
            onUpdateCollections={onUpdateCollections}
            productQuery={productQuery}
            setProductQuery={setProductQuery}
            filteredProductsAdmin={filteredProductsAdmin}
            handleExportProducts={handleExportProducts}
            handleImportProducts={handleImportProducts}
            selectedProductIds={selectedProductIds}
            handleSelectAllProducts={handleSelectAllProducts}
            handleBulkStatusProducts={handleBulkStatusProducts}
            handleBulkDeleteProducts={handleBulkDeleteProducts}
            handleSelectProduct={handleSelectProduct}
            handleEditProductClick={handleEditProductClick}
            handleDuplicateProduct={handleDuplicateProduct}
            handlePreviewProduct={handlePreviewProduct}
            handleDeleteProduct={handleDeleteProduct}
          />
        )}

        {/* 5. PAGES & SECTION BUILDER BLOCK */}
        {activeTab === 'pages' && (
          <PagesTab
            onRecyclePage={(id: string) => recycleItem('customPages', id)}
            localPages={localPages}
            setLocalPages={setLocalPages}
            onUpdateCustomPages={onUpdateCustomPages}
            selectedBuilderPageId={selectedBuilderPageId}
            setSelectedBuilderPageId={setSelectedBuilderPageId}
            selectedBuilderSectionId={selectedBuilderSectionId}
            setSelectedBuilderSectionId={setSelectedBuilderSectionId}
            currentlyEditingPage={currentlyEditingPage}
            currentlyEditingSection={currentlyEditingSection}
            showAddPage={showAddPage}
            setShowAddPage={setShowAddPage}
            newPageForm={newPageForm}
            setNewPageForm={setNewPageForm}
            handleAddPageSubmit={handleAddPageSubmit}
            handleExportPages={handleExportPages}
            handleImportPages={handleImportPages}
            handleSetPageAsHomepage={handleSetPageAsHomepage}
            handleDuplicatePage={handleDuplicatePage}
            handlePreviewPage={handlePreviewPage}
            hasUnsavedChanges={hasUnsavedChanges}
            setHasUnsavedChanges={setHasUnsavedChanges}
            isSaving={isSaving}
            handleGlobalSave={handleGlobalSave}
            handleGlobalDiscard={handleGlobalDiscard}
            handleMoveSection={handleMoveSection}
            handleMoveSectionTo={handleMoveSectionTo}
            handleRemoveSectionFromPage={handleRemoveSectionFromPage}
            handleAddSectionToPage={handleAddSectionToPage}
            handleUpdateSectionSettings={handleUpdateSectionSettings}
            moduleSearchQuery={moduleSearchQuery}
            setModuleSearchQuery={setModuleSearchQuery}
            products={products}
            collections={collections}
            blogs={blogs}
            layoutSettings={localLayoutSettings}
            homepageSource={(localLayoutSettings as any).homepageSource}
            onSetHomepageSource={(source) => {
              setLocalLayoutSettings({ ...localLayoutSettings, homepageSource: source });
              setHasUnsavedChanges(true);
            }}
            onOpenLayoutSettings={() => {
              if (hasUnsavedChanges && !confirm('You have unsaved changes in the page editor. Leave and discard them?')) return;
              if (hasUnsavedChanges) handleGlobalDiscard();
              setSelectedBuilderPageId(null);
              setSelectedBuilderSectionId(null);
              setActiveTab('layout' as any);
            }}
          />
        )}

        {/* 5b. THEME LIBRARY */}
        {activeTab === 'themes' && (
          <ThemesTab
            products={products}
            collections={collections}
            blogs={blogs}
            hasUnsavedChanges={hasUnsavedChanges}
            onPublished={(pages, layout) => {
              onUpdateCustomPages(pages);
              setLocalLayoutSettings(layout);
              if (onUpdateLayoutSettings) onUpdateLayoutSettings(layout);
              setSelectedBuilderPageId(null);
              setSelectedBuilderSectionId(null);
            }}
            onCustomize={() => {
              const home = localPages.find(p => p.isHomepage) || localPages[0];
              setSelectedBuilderPageId(home ? home.id : null);
              setSelectedBuilderSectionId(null);
              setActiveTab('pages');
            }}
          />
        )}

        {/* 6. FILES MANAGER BLOCK */}
        {activeTab === 'files' && (
          <FilesTab
            fileQuery={fileQuery}
            setFileQuery={setFileQuery}
            filteredFiles={filteredFiles}
            selectedFileIds={selectedFileIds}
            handleExportFiles={handleExportFiles}
            handleImportFiles={handleImportFiles}
            fileManagerInputRef={fileManagerInputRef}
            handleDirectDeviceFileUpload={handleDirectDeviceFileUpload}
            handleSelectAllFiles={handleSelectAllFiles}
            handleBulkDeleteFiles={handleBulkDeleteFiles}
            handleSelectFile={handleSelectFile}
            handleDeleteFile={handleDeleteFile}
          />
        )}

        {/* 7. CUSTOMERS BLOCK */}
        {activeTab === 'customers' && (
          <CustomersTab
            customerQuery={customerQuery}
            products={products}
            setCustomerQuery={setCustomerQuery}
            handleExportCustomers={handleExportCustomers}
            handleImportCustomers={handleImportCustomers}
            setShowAddCustomer={setShowAddCustomer}
            filteredCustomers={filteredCustomers}
            showAddCustomer={showAddCustomer}
            handleAddCustomerSubmit={handleAddCustomerSubmit}
            newCustomerForm={newCustomerForm}
            setNewCustomerForm={setNewCustomerForm}
            onDeleteCustomer={handleDeleteCustomer}
            orders={orders}
          />
        )}

        {/* 8. DISCOUNTS BLOCK */}
        {activeTab === 'discounts' && (
          <DiscountsTab
            isDiscountEditorOpen={isDiscountEditorOpen}
            setIsDiscountEditorOpen={setIsDiscountEditorOpen}
            editingDiscount={editingDiscount}
            setEditingDiscount={setEditingDiscount}
            selectedDiscountType={selectedDiscountType}
            setSelectedDiscountType={setSelectedDiscountType}
            localProducts={localProducts}
            localCollections={localCollections}
            localCustomers={localCustomers}
            discounts={discounts}
            onUpdateDiscounts={onUpdateDiscounts}
            discountQuery={discountQuery}
            setDiscountQuery={setDiscountQuery}
            handleExportDiscounts={handleExportDiscounts}
            handleImportDiscounts={handleImportDiscounts}
            showDiscountTypeSelector={showDiscountTypeSelector}
            setShowDiscountTypeSelector={setShowDiscountTypeSelector}
            filteredDiscounts={filteredDiscounts}
            handleToggleDiscountStatus={handleToggleDiscountStatus}
            handleDeleteDiscount={handleDeleteDiscount}
          />
        )}

        {/* 9. BLOGS BLOCK */}
        {activeTab === 'blogs' && (
          <BlogsTab
            showAddBlog={showAddBlog}
            setShowAddBlog={setShowAddBlog}
            selectedBlog={selectedBlog}
            setSelectedBlog={setSelectedBlog}
            blogQuery={blogQuery}
            setBlogQuery={setBlogQuery}
            blogStatusFilter={blogStatusFilter}
            setBlogStatusFilter={setBlogStatusFilter}
            handleExportBlogs={handleExportBlogs}
            handleImportBlogs={handleImportBlogs}
            newBlogForm={newBlogForm}
            setNewBlogForm={setNewBlogForm}
            blogTagsInput={blogTagsInput}
            setBlogTagsInput={setBlogTagsInput}
            filteredBlogs={filteredBlogs}
            handleDeleteBlog={handleDeleteBlog}
            handleUpdateBlog={handleUpdateBlog}
            handleCreateBlog={handleCreateBlog}
            cleanMediaUrl={cleanMediaUrl}
            slugify={(text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")}
          />
        )}


        {/* Settings: Payments / Shipping & Delivery / Age Verification / Integrations */}
        {(activeTab === 'payments' || activeTab === 'delivery' || activeTab === 'age-verification' || activeTab === 'integrations') && (
          <IntegrationsSettingsTab
            section={activeTab === 'payments' ? 'payment' : activeTab === 'delivery' ? 'shipping' : activeTab === 'age-verification' ? 'compliance' : 'all'}
            onOpenTab={(tab) => { setActiveTab(tab as SidebarTab); setSelectedBuilderPageId(null); }}
          />
        )}

        {/* 11. EMAIL & MARKETING BLOCK */}
        {activeTab === 'email' && (
          <EmailSettingsTab />
        )}

    {/* 10. LAYOUT / HEADER FOOTER SETTINGS BLOCK */}
    {activeTab === 'layout' && (
      <LayoutTab
        onOpenTab={(tab) => { setActiveTab(tab as SidebarTab); setSelectedBuilderPageId(null); }}
        localLayoutSettings={localLayoutSettings}
        setLocalLayoutSettings={setLocalLayoutSettings}
        onUpdateLayoutSettings={onUpdateLayoutSettings}
        layoutSavedToast={layoutSavedToast}
        setLayoutSavedToast={setLayoutSavedToast}
        parseCloudinaryInput={parseCloudinaryInput}
        handleTestCloudinary={handleTestCloudinary}
        testingCloudinary={testingCloudinary}
        cloudinaryTestResult={cloudinaryTestResult}
        isAddingMenuItem={isAddingMenuItem}
        setIsAddingMenuItem={setIsAddingMenuItem}
        newMenuItemLabel={newMenuItemLabel}
        setNewMenuItemLabel={setNewMenuItemLabel}
        newMenuItemType={newMenuItemType}
        setNewMenuItemType={setNewMenuItemType}
        newMenuItemTarget={newMenuItemTarget}
        setNewMenuItemTarget={setNewMenuItemTarget}
        newMenuItemUrl={newMenuItemUrl}
        setNewMenuItemUrl={setNewMenuItemUrl}
        addMenuItem={addMenuItem}
        editMenuItemLabel={editMenuItemLabel}
        editMenuItemUrl={editMenuItemUrl}
        editMenuItemTarget={editMenuItemTarget}
        moveMenuItem={moveMenuItem}
        removeMenuItem={removeMenuItem}
        localPages={localPages}
      />
    )}

    {/* 11. DEVELOPMENT MODE TAB */}
    {activeTab === 'development' && (
      <DevelopmentTab settings={devSettings} onUpdateSettings={onUpdateDevSettings} />
    )}

    {/* 12. DIAGNOSTICS & STATUS TEST BLOCK */}
    {activeTab === 'diagnostics' && (
      <DiagnosticsTab onRefreshAll={fetchDbDetails} />
    )}

    {activeTab === 'recycle-bin' && (
      <RecycleBinTab
        onCountChange={setRecycleBinCount}
        // A restored record is back in its store but not in this tab's copy of
        // it, so the dashboard reloads rather than showing a stale section.
        onRestored={reloadAfterRestore}
      />
    )}

        {/* DATABASE CONNECTION DETAILS MODAL */}
        {showDbDetailsModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-150 overflow-hidden flex flex-col max-h-[85vh] text-left">
              
              {/* Modal Header */}
              <div className="p-5 border-b flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-teal-50 rounded-lg border border-teal-150">
                    <Database className="h-5 w-5 text-teal-600 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Neon PostgreSQL Connection Inspector</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Real-time audit of Cluster details, state, and collections.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDbDetailsModal(false)} 
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
                {dbDetailsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <RefreshCw className="h-8 w-8 text-teal-500 animate-spin" />
                    <p className="text-slate-500 font-medium">Running diagnostics & querying live counts...</p>
                  </div>
                ) : dbDetailsError ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-red-700 font-bold">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>Diagnostics Query Failed</span>
                    </div>
                    <p className="text-red-600 text-[11px] leading-relaxed font-mono whitespace-pre-wrap">{dbDetailsError}</p>
                  </div>
                ) : dbDetailsData ? (
                  <div className="space-y-4">
                    {/* Status Summary Banner */}
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${
                      dbDetailsData.status === 'connected' 
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                        : 'bg-rose-50/70 border-rose-200 text-rose-950'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className={`h-3 w-3 rounded-full ${
                          dbDetailsData.status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                        }`} />
                        <div>
                          <p className="font-black text-xs uppercase tracking-wider">
                            Connection {dbDetailsData.status === 'connected' ? 'Active' : 'Offline'}
                          </p>
                          <p className="text-[10px] opacity-80 mt-0.5">
                            Provider & ORM: <span className="font-mono font-bold">Neon PostgreSQL (Prisma)</span>
                          </p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full font-black text-[9px] uppercase tracking-wider ${
                        dbDetailsData.status === 'connected' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {dbDetailsData.status}
                      </span>
                    </div>

                    {/* General Metadata */}
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2.5">
                      <h4 className="font-extrabold text-[10px] text-slate-500 uppercase tracking-widest border-b border-slate-200/60 pb-1.5">
                        Cluster & Database Registry
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Cluster Host</span>
                          <span className="text-slate-800 font-mono text-[10px] font-semibold break-all select-all">
                            {dbDetailsData.uriHost}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Active Database</span>
                          <span className="text-slate-800 font-mono text-[11px] font-black tracking-wide select-all">
                            {dbDetailsData.dbName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Collections counts */}
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-[10px] text-slate-500 uppercase tracking-widest">
                        Collections Overview ({dbDetailsData.collections?.length || 0})
                      </h4>
                      {dbDetailsData.collections && dbDetailsData.collections.length > 0 ? (
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-450 border-b border-slate-250 select-none">
                                <th className="p-2.5 pl-4">Collection Name</th>
                                <th className="p-2.5 text-right pr-4">Document Count</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150">
                              {dbDetailsData.collections.map((col: any) => (
                                <tr key={col.name} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-2.5 pl-4 font-mono font-bold text-slate-700">{col.name}</td>
                                  <td className="p-2.5 text-right pr-4 font-semibold font-mono text-indigo-650">
                                    {col.count.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 text-slate-450 italic text-center rounded-lg border border-slate-150">
                          No collections found. The database might be empty or in-memory fallback is active.
                        </div>
                      )}
                    </div>

                    {/* Active Prisma Models */}
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-[10px] text-slate-500 uppercase tracking-widest">
                        Active Prisma Models (12)
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {dbDetailsData.models?.map((modelName: string) => (
                          <span key={modelName} className="bg-slate-100 text-slate-700 font-mono text-[9px] font-bold px-2 py-1 rounded-md border border-slate-200">
                            {modelName}
                          </span>
                        ))}
                      </div>
                    </div>

                    {dbDetailsData.error && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                        <span className="text-amber-800 font-bold block text-[9px] uppercase tracking-wider">Reported Connection Warnings</span>
                        <p className="text-amber-700 text-[10px] font-mono leading-relaxed max-h-24 overflow-y-auto">{dbDetailsData.error}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500 italic">No diagnostic data found.</div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t bg-slate-50 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={fetchDbDetails}
                  disabled={dbDetailsLoading}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${dbDetailsLoading ? 'animate-spin' : ''}`} />
                  <span>Re-run Diagnostics</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDbDetailsModal(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>

            </div>
          </div>
        )}



        {/* CUSTOM CONFIRMATION DIALOG MODAL (Guaranteed to work in sandboxed iframes) */}
        {confirmDialog && confirmDialog.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[10000]">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">{confirmDialog.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Please confirm your dashboard request.</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                {confirmDialog.message}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmDialog.onConfirm();
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-md shadow-rose-200 transition-all cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Save Success Toast Notification */}
        {showSaveSuccess && (
          <div className="fixed bottom-6 right-6 z-[99999] bg-slate-900 text-white border border-slate-800 p-4 rounded-xl shadow-2xl flex items-center gap-3.5 max-w-sm select-none transition-all duration-300 animate-in slide-in-from-bottom-4 zoom-in-95">
            <div className="h-8 w-8 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
              <Check className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-black uppercase tracking-wider text-[9px] text-emerald-400 block mb-0.5">Live Sync Complete</span>
              <span className="font-extrabold block text-xs text-white">All Changes Saved successfully!</span>
              <span className="text-[10px] font-semibold text-slate-400 leading-normal block mt-0.5">Your edits have been synchronized across the database and are now live on the storefront.</span>
            </div>
            <button 
              onClick={() => setShowSaveSuccess(false)} 
              className="text-slate-400 hover:text-white cursor-pointer ml-1 p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

      </main>
      </div>

    </div>
  );
}
