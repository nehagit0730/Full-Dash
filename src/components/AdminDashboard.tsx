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
import DevelopmentTab from './admin/DevelopmentTab';
import { DiagnosticsTab } from './admin/DiagnosticsTab';
import RecycleBinTab from './admin/RecycleBinTab';
import { EmailSettingsTab } from './admin/EmailSettingsTab';
import IntegrationsSettingsTab from './admin/IntegrationsSettingsTab';
import { Activity } from 'lucide-react';

export const AVAILABLE_SECTION_TEMPLATES = [
  { type: 'Image banner', label: 'Image Banner', desc: 'Hero banner with centered headline overlay & CTA buttons', icon: 'ImageIcon' },
  { type: 'Image with text', label: 'Image with Text', desc: 'Beautifully-aligned structural image with side description', icon: 'Columns' },
  { type: 'Text column with image', label: 'Text Column with Image', desc: 'Three-column display grid showing core brand standards', icon: 'Grid' },
  { type: 'Featured collection', label: 'Featured Collection', desc: 'Interactive storefront product card grid with live data', icon: 'ShoppingBag' },
  { type: 'Collection list', label: 'Collection List', desc: 'Display all available categorized nicotine canister series', icon: 'FolderHeart' },
  { type: 'Slideshow', label: 'Slideshow', desc: 'Smooth horizontal multi-slide sliding carousel banner', icon: 'PlaySquare' },
  { type: 'Video banner', label: 'Video Banner', desc: 'Cinematic YouTube player showcasing laboratory workflows', icon: 'Video' },
  { type: 'Rich text', label: 'Rich Text', desc: 'Focussed header with spacious text for brand newsletters', icon: 'FileText' },
  { type: 'Marquee text', label: 'Marquee Text', desc: 'Fast, animated horizontal news marquee with key notices', icon: 'Sparkles' },
  { type: 'Marquee images', label: 'Marquee Images', desc: 'Dynamic ticker reel demonstrating recently stocked canisters', icon: 'Layers' },
  { type: 'Logo list', label: 'Logo List', desc: 'Official partnered distributors and reseller banners', icon: 'Award' },
  { type: 'Images gallery', label: 'Images Gallery', desc: 'Scenic four-column gallery of clean compounding rooms', icon: 'Layout' },
  { type: 'FAQs', label: 'FAQs', desc: 'Collapsible answered support questions', icon: 'HelpCircle' },
  { type: 'Blog post', label: 'Blog Post', desc: 'Display a beautiful list/grid of live Pouch Journal articles with columns control', icon: 'BookOpen' },
  { type: 'Brand list', label: 'Brand List', desc: 'Scenic brand logo matrix with interactive links to collections', icon: 'LayoutGrid' },
  { type: 'Icon with text', label: 'Icon with Text', desc: 'Six-item feature display grid with customizable icons and colors', icon: 'Sparkles' },
  { type: 'Brands we offer', label: 'Brands we offer', desc: 'Infinite running marquee of brand logo images with live upload option', icon: 'Layers' },
  { type: 'How it works', label: 'How it works', desc: 'Dynamic timeline workflow steps with custom images & layouts', icon: 'Compass' },
  { type: 'Trust badges', label: 'Trust Badges', desc: 'Elegant horizontal grid displaying core store guarantees like authenticity and premium quality', icon: 'Award' },
  { type: 'Clearance Sale', label: 'Clearance Sale', desc: 'Display selected clearance products with layouts like shop now grid', icon: 'Flame' },
  { type: 'Contact Form', label: 'Contact Form', desc: 'Interactive customer inquiry form with name, email, subject, message, and Resend email connection', icon: 'Mail' }
] as const;

export const getSectionLabel = (type: string): string => {
  const found = AVAILABLE_SECTION_TEMPLATES.find(t => t.type === type);
  return found ? found.label : type;
};

export const getSectionIcon = (type: string) => {
  switch (type) {
    case 'Image banner': return <ImageIcon className="h-4 w-4 text-teal-600" />;
    case 'Image with text': return <Columns className="h-4 w-4 text-emerald-500" />;
    case 'Text column with image': return <Grid className="h-4 w-4 text-sky-500" />;
    case 'Featured collection': return <ShoppingBag className="h-4 w-4 text-indigo-650" />;
    case 'Collection list': return <FolderHeart className="h-4 w-4 text-purple-600" />;
    case 'Slideshow': return <PlaySquare className="h-4 w-4 text-blue-500" />;
    case 'Video banner': return <Video className="h-4 w-4 text-rose-500" />;
    case 'Rich text': return <FileText className="h-4 w-4 text-slate-500" />;
    case 'Marquee text': return <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />;
    case 'Marquee images': return <Layers className="h-4 w-4 text-indigo-500" />;
    case 'Logo list': return <Award className="h-4 w-4 text-cyan-500" />;
    case 'Images gallery': return <Layout className="h-4 w-4 text-sky-600" />;
    case 'FAQs': return <HelpCircle className="h-4 w-4 text-violet-500" />;
    case 'Blog post': return <BookOpen className="h-4 w-4 text-orange-600" />;
    case 'Brand list': return <LayoutGrid className="h-4 w-4 text-pink-500" />;
    case 'Icon with text': return <Sparkles className="h-4 w-4 text-indigo-650 animate-pulse" />;
    case 'Brands we offer': return <Layers className="h-4 w-4 text-amber-600 animate-bounce" />;
    case 'How it works': return <Compass className="h-4 w-4 text-blue-600 animate-spin" style={{ animationDuration: '6s' }} />;
    case 'Trust badges': return <Award className="h-4 w-4 text-yellow-600 animate-pulse" />;
    case 'Plans': return <LayoutGrid className="h-4 w-4 text-amber-500 animate-pulse" />;
    case 'Clearance Sale': return <Flame className="h-4 w-4 text-red-500 animate-pulse" />;
    case 'Contact Form': return <Mail className="h-4 w-4 text-emerald-600" />;
    default: return <FileCode className="h-4 w-4 text-slate-400" />;
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

interface BrandsWeOfferSectionAdminProps {
  sec: PageSection;
}

function BrandsWeOfferSectionAdmin({ sec }: BrandsWeOfferSectionAdminProps) {
  const items = (sec.settings.brandItems || []).filter(b => b.imageUrl && b.imageUrl.trim() !== '');
  const [activeDot, setActiveDot] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, clientWidth, scrollWidth } = sliderRef.current;
    const totalWidth = scrollWidth - clientWidth;
    if (totalWidth <= 0) return;
    const percentage = Math.max(0, Math.min(1, scrollLeft / totalWidth));
    const dotCount = Math.min(items.length, 6);
    const idx = Math.min(Math.floor(percentage * dotCount), dotCount - 1);
    setActiveDot(idx);
  };

  const scrollToDot = (idx: number) => {
    if (!sliderRef.current) return;
    const { scrollWidth, clientWidth } = sliderRef.current;
    const totalWidth = scrollWidth - clientWidth;
    if (totalWidth <= 0) return;
    const dotCount = Math.min(items.length, 6);
    const targetScrollLeft = (idx / (dotCount - 1)) * totalWidth;
    sliderRef.current.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
    setActiveDot(idx);
  };

  const scrollLeft = () => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({ left: 200, behavior: 'smooth' });
  };

  return (
    <div className="py-4 bg-white w-full overflow-hidden border border-slate-100 rounded-2xl shadow-xs my-2 text-center animate-fade-in">
      <div className="max-w-2xl mx-auto px-4 text-center space-y-1.5 mb-6">
        <div className="flex items-center justify-center gap-3">
          <div className="w-8 h-[1px] bg-[#D4AF37]" />
          <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            THE BRANDS YOU LOVE
          </span>
          <div className="w-8 h-[1px] bg-[#D4AF37]" />
        </div>
        <h3 
          className="text-lg font-black uppercase tracking-tight text-slate-900 leading-none animate-fade-in"
          style={{ color: sec.settings.headingColor || '#0C1017' }}
        >
          {sec.settings.title || 'Brands we offer'}
        </h3>
        {sec.settings.description && (
          <p 
            className="text-[10px] max-w-md mx-auto leading-relaxed text-slate-400 font-medium opacity-85"
            style={{ color: sec.settings.textColor || '#64748B' }}
          >
            {sec.settings.description}
          </p>
        )}
      </div>

      <div className="relative px-8">
        {/* Left Arrow Button */}
        {items.length > 0 && (
          <button 
            type="button"
            onClick={scrollLeft} 
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border border-[#D4AF37] bg-white flex items-center justify-center text-[#D4AF37] hover:bg-amber-50/50 shadow-xs transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
          </button>
        )}

        {/* Brand Slider Container */}
        <div 
          ref={sliderRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto scrollbar-none py-4 px-2 scroll-smooth"
        >
          {items.map((b, idx) => (
            <div 
              key={idx} 
              className="group flex flex-col items-center justify-center shrink-0 w-32 aspect-square bg-white rounded-2xl p-4 shadow-[0_6px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_25px_rgba(0,0,0,0.08)] border border-slate-50/50 transition-all duration-300 transform hover:-translate-y-1 select-none cursor-pointer"
            >
              {b.imageUrl ? (
                <img 
                  src={b.imageUrl} 
                  className="max-h-16 max-w-[90px] object-contain transition-transform duration-300 group-hover:scale-105" 
                  alt={b.title || 'Brand'} 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-xs font-black text-slate-800 uppercase tracking-tight truncate max-w-full group-hover:scale-105 transition-transform duration-300">
                  {b.title || 'Brand'}
                </span>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-slate-400 italic text-center py-4 w-full text-[10px]">
              No brands found. Go to sidebar settings to upload brands!
            </div>
          )}
        </div>

        {/* Right Arrow Button */}
        {items.length > 0 && (
          <button 
            type="button"
            onClick={scrollRight} 
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border border-[#D4AF37] bg-white flex items-center justify-center text-[#D4AF37] hover:bg-amber-50/50 shadow-xs transition-all cursor-pointer"
          >
            <ChevronRight className="h-4 w-4 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Dot Indicators */}
      {items.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-4">
          {Array.from({ length: Math.min(items.length, 6) }).map((_, dIdx) => (
            <button
              key={dIdx}
              type="button"
              onClick={() => scrollToDot(dIdx)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                dIdx === activeDot ? 'bg-[#D4AF37] w-3' : 'bg-slate-200 hover:bg-slate-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface HowItWorksSectionAdminProps {
  sec: PageSection;
}

function HowItWorksSectionAdmin({ sec }: HowItWorksSectionAdminProps) {
  const steps = (sec.settings.stepItems && sec.settings.stepItems.length > 0) 
    ? sec.settings.stepItems 
    : [
        { number: 1, title: 'Choose Your Plan', description: 'Pick the plan that suits you best. Flexible. Simple. No commitment.' },
        { number: 2, title: 'Pick Your Favourite Brands', description: 'Mix and match from 20+ premium brands, flavours and strengths.' },
        { number: 3, title: 'Relax, We Handle The Rest', description: 'We pack and deliver to your door, automatically. You focus on life.' }
      ];

  const renderStepVisualMockup = (sidx: number, step: any) => {
    if (step.imageUrl && step.imageUrl.trim() !== '') {
      return (
        <div className="w-full my-4 flex items-center justify-center overflow-hidden rounded-xl">
          <img 
            src={step.imageUrl} 
            className="w-full max-h-48 object-contain filter drop-shadow-md" 
            alt={step.title} 
            referrerPolicy="no-referrer"
          />
        </div>
      );
    }

    if (sidx === 0) {
      return (
        <div className="w-full bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center my-4">
          <div className="grid grid-cols-4 gap-1 w-full">
            {/* LITE */}
            <div className="bg-white rounded-lg border border-slate-200/60 p-1 flex flex-col items-center justify-between text-center shadow-2xs h-24">
              <span className="text-[6px] font-black tracking-wider text-slate-400">LITE</span>
              <div className="my-0.5 text-center">
                <span className="block text-[8px] font-black text-slate-800 leading-tight">5 Cans</span>
                <span className="block text-[7px] font-bold text-[#D4AF37] leading-tight">₹27.99</span>
                <span className="text-[5px] text-slate-400 block -mt-0.5">per month</span>
              </div>
            </div>
            
            {/* CORE */}
            <div className="bg-white rounded-lg border border-slate-200/60 p-1 flex flex-col items-center justify-between text-center shadow-2xs h-24">
              <span className="text-[6px] font-black tracking-wider text-slate-450">CORE</span>
              <div className="my-0.5 text-center">
                <span className="block text-[8px] font-black text-slate-800 leading-tight">8 Cans</span>
                <span className="block text-[7px] font-bold text-[#D4AF37] leading-tight">₹35.99</span>
                <span className="text-[5px] text-slate-400 block -mt-0.5">per month</span>
              </div>
            </div>

            {/* PRO */}
            <div className="bg-[#0C1017] rounded-lg border border-[#D4AF37] p-1 flex flex-col items-center justify-between text-center shadow-sm h-24 relative overflow-hidden transform scale-105 z-10">
              <div className="absolute top-0 left-0 right-0 bg-[#D4AF37] text-[4px] font-black text-slate-950 py-0.5 uppercase tracking-wider text-center">
                MOST POPULAR
              </div>
              <span className="text-[6px] font-black tracking-wider text-white mt-1">PRO</span>
              <div className="my-0.5 text-center">
                <span className="block text-[8px] font-black text-white leading-tight">10 Cans</span>
                <span className="block text-[7px] font-bold text-[#D4AF37] leading-tight">₹40.99</span>
                <span className="text-[5px] text-slate-350 block -mt-0.5">per month</span>
              </div>
            </div>

            {/* ULTIMATE */}
            <div className="bg-white rounded-lg border border-[#D4AF37]/50 p-1 flex flex-col items-center justify-between text-center shadow-2xs h-24">
              <span className="text-[6px] font-black tracking-wider text-slate-450">ULTIMATE</span>
              <div className="my-0.5 text-center">
                <span className="block text-[8px] font-black text-slate-800 leading-tight">12 Cans</span>
                <span className="block text-[7px] font-bold text-[#D4AF37] leading-tight">₹46.99</span>
                <span className="text-[5px] text-slate-400 block -mt-0.5">per month</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (sidx === 1) {
      return (
        <div className="w-full h-32 relative my-4 flex items-center justify-center overflow-hidden">
          <div className="relative w-full max-w-[200px] h-full flex items-center justify-center">
            {/* CAN 1: ZYN */}
            <div className="absolute left-1 top-2 w-[48px] h-[48px] rounded-full bg-white border border-slate-200 shadow-md flex flex-col items-center justify-center p-0.5 transform -rotate-12 z-10">
              <div className="w-[42px] h-[42px] rounded-full border border-sky-400/30 flex flex-col items-center justify-center bg-sky-50/20">
                <span className="text-[7px] font-extrabold text-sky-600 tracking-tight leading-none">ZYN</span>
              </div>
            </div>

            {/* CAN 2: VELO */}
            <div className="absolute right-1 top-2 w-[48px] h-[48px] rounded-full bg-white border border-slate-200 shadow-md flex flex-col items-center justify-center p-0.5 transform rotate-12 z-10">
              <div className="w-[42px] h-[42px] rounded-full border border-blue-500/30 flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
                <span className="text-[7px] font-extrabold text-white tracking-tight leading-none">VELO</span>
              </div>
            </div>

            {/* CAN 5: 77 */}
            <div className="absolute left-[50%] top-1 w-[52px] h-[52px] rounded-full bg-white border border-slate-200 shadow-lg flex flex-col items-center justify-center p-0.5 transform -translate-x-1/2 -rotate-3 z-30">
              <div className="w-[46px] h-[46px] rounded-full border border-slate-900 flex flex-col items-center justify-center bg-[#0C1017]">
                <span className="text-[10px] font-black text-white tracking-tighter leading-none">77</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (sidx === 2) {
      return (
        <div className="w-full h-32 relative my-4 flex items-center justify-center">
          <div className="w-36 h-20 bg-[#0C1017] rounded-xl border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between p-2 select-none">
            <div className="mt-1 space-y-0.5 text-left">
              <span className="block text-[8px] font-black tracking-[0.12em] text-[#D4AF37] leading-none">POUCH</span>
              <span className="block text-[8px] font-black tracking-[0.12em] text-[#D4AF37] leading-none">SUPPLY</span>
            </div>
            <div className="border-t border-slate-800/65 pt-1 flex items-center justify-between">
              <span className="text-[3px] font-bold text-slate-450 uppercase tracking-[0.18em]">NICOTINE ON AUTOPILOT</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-4 w-24 h-24 flex items-center justify-center bg-slate-50 rounded-xl p-2 shrink-0 border border-slate-100">
        {step.imageUrl ? (
          <img 
            src={step.imageUrl} 
            className="max-h-20 max-w-full object-contain" 
            alt={step.title} 
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-[10px] font-bold text-slate-450">No Image</span>
        )}
      </div>
    );
  };

  const renderStepCheckmarks = (sidx: number) => {
    const checkmarks = sidx === 0 
      ? ["Weekly, Fortnightly or Monthly", "Change anytime"]
      : sidx === 1 
      ? ["Change brands or flavours anytime"]
      : ["Automatic deliveries", "Skip or pause anytime"];

    return (
      <div className="mt-2 space-y-1 w-full text-left">
        {checkmarks.map((text, cidx) => (
          <div key={cidx} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-850 justify-center">
            <div className="w-3 h-3 rounded-full bg-amber-50 border border-amber-250 text-[#D4AF37] flex items-center justify-center shrink-0">
              <Check className="h-2 w-2 stroke-[3]" />
            </div>
            <span className="text-[10px] text-slate-650 font-extrabold">{text}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div 
      className="py-8 w-full font-sans transition-all duration-300 overflow-hidden"
      style={{ backgroundColor: sec.settings.backgroundColor || '#F8FAFC' }}
    >
      <div className="max-w-7xl mx-auto px-4 space-y-10 relative">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto flex flex-col items-center">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-[1px] bg-[#D4AF37]" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#D4AF37]">
              HOW IT WORKS
            </span>
            <div className="w-8 h-[1px] bg-[#D4AF37]" />
          </div>
          
          <h2 
            className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[#0C1017] leading-none"
            style={{ color: sec.settings.headingColor || '#0C1017' }}
          >
            {sec.settings.title || 'Get Started In Under 60 Seconds'}
          </h2>
          
          {sec.settings.description && (
            <p className="text-[10px] leading-relaxed text-slate-500 font-semibold opacity-90">
              {sec.settings.description}
            </p>
          )}

          {/* Reassuring timing badge */}
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50/75 border border-amber-100 text-[#D4AF37] text-[10px] font-black">
            <Clock className="h-3 w-3 stroke-[2.5]" />
            <span>Takes less than 60 seconds</span>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="relative max-w-6xl mx-auto pt-4">
          {/* Gold Connecting Dotted Line */}
          <div className="absolute top-[140px] left-[15%] right-[15%] h-[2px] border-t-2 border-dashed border-[#D4AF37]/45 hidden md:block z-0" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {steps.map((step, sidx) => (
              <div 
                key={sidx}
                className="bg-white rounded-[20px] border border-slate-100 p-6 flex flex-col items-center justify-between text-center shadow-[0_10px_30px_rgba(147,197,253,0.08)] min-h-[360px] group relative"
              >
                {/* Gold step circle overlapping border */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#D4AF37] text-white font-black text-xs flex items-center justify-center shadow-md border-2 border-white">
                  {step.number || (sidx + 1)}
                </div>

                <div className="space-y-3 flex-1 flex flex-col items-center pt-2 w-full">
                  <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                    {step.title || 'Step Title'}
                  </h3>
                  
                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-[200px] font-semibold">
                    {step.description || 'Step description details.'}
                  </p>

                  {/* Render High-Fidelity Custom Visual Mockups */}
                  {renderStepVisualMockup(sidx, step)}
                </div>

                {/* Render corresponding green checkmarks */}
                {renderStepCheckmarks(sidx)}
              </div>
            ))}
          </div>
        </div>

        {/* Reassurance Objections Grid */}
        <div className="max-w-6xl mx-auto pt-2">
          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-[0_10px_30px_rgba(147,197,253,0.03)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 lg:divide-y-0 lg:divide-x divide-slate-100">
            {/* EASY RETURNS */}
            <div className="flex items-center gap-3 py-2 justify-center lg:justify-start">
              <div className="shrink-0 p-2 rounded-lg bg-slate-50 flex items-center justify-center text-slate-800">
                <ShieldCheck className="h-5 w-5 text-slate-800" />
              </div>
              <div className="text-left">
                <h4 className="text-[9px] font-black tracking-wider text-slate-900 uppercase">
                  EASY RETURNS
                </h4>
                <p className="text-[9px] text-slate-400 font-bold leading-none">
                  No ties, no fuss.
                </p>
              </div>
            </div>

            {/* CHANGE ANYTIME */}
            <div className="flex items-center gap-3 py-2 justify-center lg:justify-start">
              <div className="shrink-0 p-2 rounded-lg bg-slate-50 flex items-center justify-center text-slate-850">
                <RefreshCw className="h-5 w-5 text-slate-850 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              <div className="text-left">
                <h4 className="text-[9px] font-black tracking-wider text-slate-900 uppercase">
                  CHANGE ANYTIME
                </h4>
                <p className="text-[9px] text-slate-400 font-bold leading-none">
                  Swap plans or brands.
                </p>
              </div>
            </div>

            {/* SKIP DELIVERIES */}
            <div className="flex items-center gap-3 py-2 justify-center lg:justify-start">
              <div className="shrink-0 p-2 rounded-lg bg-slate-50 flex items-center justify-center text-slate-800">
                <Truck className="h-5 w-5 text-slate-800" />
              </div>
              <div className="text-left">
                <h4 className="text-[9px] font-black tracking-wider text-slate-900 uppercase">
                  SKIP DELIVERIES
                </h4>
                <p className="text-[9px] text-slate-400 font-bold leading-none">
                  Skip or delay anytime.
                </p>
              </div>
            </div>

            {/* NO CONTRACTS */}
            <div className="flex items-center gap-3 py-2 justify-center lg:justify-start">
              <div className="shrink-0 p-2 rounded-lg bg-slate-50 flex items-center justify-center text-slate-800">
                <Lock className="h-5 w-5 text-slate-800" />
              </div>
              <div className="text-left">
                <h4 className="text-[9px] font-black tracking-wider text-slate-900 uppercase">
                  NO CONTRACTS
                </h4>
                <p className="text-[9px] text-slate-400 font-bold leading-none">
                  No commitments, 1-click.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Conversion Area */}
        <div className="mt-8 flex flex-col items-center justify-center space-y-3 text-center pb-4">
          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Ready to get started?</h4>
          <button
            type="button"
            className="px-6 py-3 bg-[#D4AF37] text-white font-extrabold uppercase tracking-[0.2em] text-[10px] rounded-lg shadow-md cursor-pointer flex items-center gap-1.5"
          >
            Shop now
            <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}

type SidebarTab = 'analytics' | 'orders' | 'collections' | 'products' | 'pages' | 'blogs' | 'files' | 'customers' | 'discounts' | 'email' | 'layout' | 'development' | 'diagnostics' | 'recycle-bin' | 'payments' | 'delivery' | 'age-verification' | 'integrations';

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
      headerLogoText: 'Pouch Supply',
      headerLogoSubtext: 'Premium Nicotine',
      headerLogoImage: '',
      footerLogoText: 'POUCH SUPPLY',
      footerLogoDescription: 'Leading premium directory for tobacco-free nicotine slim white canisters. Sourced directly from partners across Sweden, Poland, and Germany.',
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

    if (cName.toLowerCase() === 'pouch' || cName.toLowerCase() === 'pouch supply') {
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
  const [orderQuery, setOrderQuery] = useState('');

  // Blog Post management states
  const [blogQuery, setBlogQuery] = useState('');
  const [blogStatusFilter, setBlogStatusFilter] = useState<'All' | 'Active' | 'Draft' | 'Archived'>('All');
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);
  const [showAddBlog, setShowAddBlog] = useState(false);
  const [newBlogForm, setNewBlogForm] = useState<Partial<BlogPost>>({
    title: '', excerpt: '', content: '', image: '',
    author: 'Admin', category: 'General', status: 'Active',
    publishedAt: '', readTime: '5 min read', tags: []
  });
  const [blogTagsInput, setBlogTagsInput] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'All' | 'Unfulfilled' | 'Fulfilled'>('All');
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
      const targetUrl = selectedOrder
        ? `/admin-dashboard/orders/${encodeURIComponent(String(selectedOrder.id))}`
        : '/admin-dashboard/orders';
      if (window.location.pathname !== targetUrl) {
        window.history.pushState({}, '', targetUrl);
      }
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

  const [productQuery, setProductQuery] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductForm, setNewProductForm] = useState<Partial<Product>>({
    title: '', description: '', price: 4.99, compareAtPrice: 5.99,
    inventory: 50, sku: '', category: 'Vitamins & Supplements',
    vendor: '77', status: 'Active', image: '', weight: 12, tags: []
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [showAddCollection, setShowAddCollection] = useState(false);
  const [collectionQuery, setCollectionQuery] = useState('');
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

  const [fileQuery, setFileQuery] = useState('');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [showAddFile, setShowAddFile] = useState(false);
  const [newFileForm, setNewFileForm] = useState({ fileName: '', altText: '', url: '' });
  const fileManagerInputRef = useRef<HTMLInputElement>(null);

  const [customerQuery, setCustomerQuery] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', email: '', location: '', subscriptionStatus: 'Not subscribed' as any });

  const [discountQuery, setDiscountQuery] = useState('');
  const [showAddDiscount, setShowAddDiscount] = useState(false);
  const [newDiscountForm, setNewDiscountForm] = useState<Partial<Discount>>({
    title: '', type: 'Amount off order', details: '', eligibility: 'All customers', status: 'Active'
  });
  const [showDiscountTypeSelector, setShowDiscountTypeSelector] = useState(false);
  const [selectedDiscountType, setSelectedDiscountType] = useState<'Amount off products' | 'Buy X get Y' | 'Amount off order' | 'Free shipping' | 'Loyalty Reward' | null>(null);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [isDiscountEditorOpen, setIsDiscountEditorOpen] = useState(false);

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
        vendor: newProductForm.vendor || '77',
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
      vendor: '77', status: 'Active', image: '', weight: 12, tags: []
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
      downloadAnchor.setAttribute("download", `pouch_supply_products_backup_${Date.now()}.json`);
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
              const price = parseFloat(rowObj.price) || 4.99;
              const compareAtPrice = rowObj.compareatprice ? parseFloat(rowObj.compareatprice) : undefined;
              const inventory = parseInt(rowObj.inventory, 10) || 100;
              const sku = rowObj.sku || `SKU-${id.toUpperCase()}`;
              const category = rowObj.category || "Nicotine Pouches";
              const vendor = rowObj.vendor || "Premium Brand";
              const status = (rowObj.status && ['Active', 'Draft'].includes(rowObj.status)) ? rowObj.status : 'Active';
              const image = rowObj.image || "";
              const description = rowObj.description || `Premium compounding high-grade portion from ${vendor}.`;
              const weight = parseFloat(rowObj.weight) || 15;
              const weightUnit = rowObj.weightunit || "g";
              const strength = rowObj.strength || "10 mg";
              const flavour = rowObj.flavour || "Original";
              
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
                tags: rowObj.tags ? rowObj.tags.split('|').map((t: string) => t.trim()) : [vendor, flavour],
                slug: rowObj.slug || id,
                strength,
                flavour,
                variants: rowObj.variants ? JSON.parse(rowObj.variants) : [{ id: `var-opt-${id}`, name: "Strength", values: [strength] }],
                concreteVariants: rowObj.concretevariants ? JSON.parse(rowObj.concretevariants) : [{ id: `var-det-${id}`, name: `${flavour} (${strength})`, price, inventory, description, images: [image], flavour }]
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
      downloadAnchor.setAttribute("download", `pouch_supply_collections_backup_${Date.now()}.json`);
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
      downloadAnchor.setAttribute("download", `pouch_supply_pages_backup_${Date.now()}.json`);
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
      downloadAnchor.setAttribute("download", `pouch_supply_orders_backup_${Date.now()}.json`);
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
      downloadAnchor.setAttribute("download", `pouch_supply_customers_backup_${Date.now()}.json`);
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
      downloadAnchor.setAttribute("download", `pouch_supply_discounts_backup_${Date.now()}.json`);
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
      downloadAnchor.setAttribute("download", `pouch_supply_blogs_backup_${Date.now()}.json`);
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
      downloadAnchor.setAttribute("download", `pouch_supply_files_backup_${Date.now()}.json`);
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
      settings: {
        fullWidth: isFullWidthByDefault,
        backgroundColor: sectionType === 'Marquee text' ? '#E8BE74' : '#FFFFFF',
        headingColor: '#1E293B',
        textColor: sectionType === 'Marquee text' ? '#1A1C1D' : '#64748B',
        title: sectionType === 'Image banner' ? 'Exclusive Pouch Launch' 
             : sectionType === 'Image with text' ? 'Curate Your Premium Package'
             : sectionType === 'Text column with image' ? 'Our Laboratory Certified Foundations'
             : sectionType === 'Featured collection' ? 'Featured Collection Highlights'
             : sectionType === 'Collection list' ? 'Explore Brand Collections'
             : sectionType === 'Images gallery' ? 'Laboratory & Dispatch Facility Gallery'
             : sectionType === 'Marquee text' ? 'FAST DELIVERY // EASY RETURNS // LOYALTY REWARDS // SECURE CHECKOUT // UPI & CARDS ACCEPTED'
             : sectionType === 'Marquee images' ? 'Fresh Stock Dispatch Reel'
             : sectionType === 'Logo list' ? 'Official Lab Partner Register'
             : sectionType === 'FAQs' ? 'Frequently Answered Questions'
             : sectionType === 'Blog post' ? 'Latest From Our Journal'
             : sectionType === 'Brand list' ? 'Shop Premium Brands'
             : sectionType === 'Brands we offer' ? 'Brands we offer'
             : sectionType === 'Icon with text' ? 'Why shop with us?'
             : sectionType === 'Video banner' ? 'Watch Our Laboratory Showcase'
             : sectionType === 'Clearance Sale' ? 'Clearance Sale Event'
             : `Custom ${sectionType}`,
        description: sectionType === 'Image with text' ? 'Our plant-fiber formulations are packed under sterile medical conditions for persistent, smooth boosts.'
                 : sectionType === 'Text column with image' ? 'Every single canister batch is vacuum-sealed inside high-density polymer tubes guaranteeing pristine flavor locks.'
                 : sectionType === 'Featured collection' ? 'Sourced cleanly from European chemical compounding centers with direct-to-door courier dispatch.'
                 : sectionType === 'Collection list' ? 'Select from your favorite pouch strengths, cooling impacts, or specific lab series.'
                 : sectionType === 'FAQs' ? 'Quick answers about delivery, returns and payments.'
                 : sectionType === 'Blog post' ? 'Scientific reports, dosage guides, and news bulletins straight from Scandinavia.'
                 : sectionType === 'Brand list' ? 'Check our collection of premium, laboratory-certified brand canisters.'
                 : sectionType === 'Brands we offer' ? 'Explore our curated roster of premium nicotine pouches and global compounding series.'
                 : sectionType === 'Icon with text' ? 'Explore exclusive rewards and reliable logistics built directly into our ecosystem.'
                  : sectionType === 'Video banner' ? 'Witness the clinical sterile compounding process behind our sub-zero cooling pouches.'
                  : sectionType === 'Clearance Sale' ? 'Save big on our premium selected stock items. Final clearance, while stocks last!'
                 : 'Edit option elements inside options sidebar',
        columnsDesktop: sectionType === 'Blog post' ? 3 : undefined,
        columnsMobile: sectionType === 'Blog post' ? 1 : undefined,
        brandItems: (sectionType === 'Brand list' || sectionType === 'Brands we offer') ? [
          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: '77' },
          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'Clew' },
          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'Cuba' },
          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'Maggie' },
          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'Nordic Spirit' },
          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'XQS' },
          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'ZYN' },
          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'Pablo' },
          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'Killa' },
          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'Fumi' },
          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'Velo' },
          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'White Fox' },
          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'Snü' }
        ] : undefined,
        buttonText: (sectionType === 'Image banner' || sectionType === 'Image with text' || sectionType === 'Rich text' || sectionType === 'Video banner') ? 'Purchase Packs' : undefined,
        buttonLink: (sectionType === 'Image banner' || sectionType === 'Image with text' || sectionType === 'Rich text' || sectionType === 'Video banner') ? 'frontend-shop' : undefined,
        marqueeSpeed: 3,
        itemsCount: (sectionType === 'Featured collection' || sectionType === 'Marquee images' || sectionType === 'Collection list') ? 4 : undefined,
        selectedProductIds: sectionType === 'Clearance Sale' ? localProducts.filter(p => p.status === 'Active').slice(0, 4).map(p => p.id) : undefined,
        videoUrl: sectionType === 'Video banner' ? '' : undefined,
        videoMp4Url: sectionType === 'Video banner' ? 'https://assets.mixkit.co/videos/preview/mixkit-laboratory-test-tubes-40436-large.mp4' : undefined,
        imageUrl: (sectionType === 'Image banner' || sectionType === 'Image with text') ? PLACEHOLDER_IMAGE : undefined,
        slides: sectionType === 'Slideshow' ? [
          {
            title: 'Precision-Engineered Pouch Purity',
            description: 'Sourced directly from certified laboratories utilizing medical-grade plant fiber and vacuum-fresh locks.',
            imageUrl: PLACEHOLDER_IMAGE,
            buttonText: 'View Laboratory Journal',
            buttonLink: 'blogs'
          },
          {
            title: 'Extreme Mint Cryo Freeze',
            description: 'Sub-zero locking technology delivering an immediate, absolute sensory refreshing experience.',
            imageUrl: PLACEHOLDER_IMAGE,
            buttonText: 'Explore Sub-Zero Bundles',
            buttonLink: 'frontend-shop'
          }
        ] : undefined,
        iconColor: sectionType === 'Icon with text' ? '#4F46E5' : undefined,
        iconItems: sectionType === 'Icon with text' ? [
          { iconName: 'Truck', title: 'Delivered on your schedule', description: 'Flexible delivery, when you need it.', linkUrl: 'frontend-shop' },
          { iconName: 'Zap', title: 'Save vs. shop prices', description: 'Better prices than retail stores.', linkUrl: 'frontend-shop' },
          { iconName: 'Shield', title: 'Discreet delivery', description: 'Plain, private, and secure packaging.', linkUrl: 'frontend-shop' },
          { iconName: 'Clock', title: 'Cancel anytime', description: 'No commitments, full control.', linkUrl: 'frontend-shop' },
          { iconName: 'Award', title: 'Loyalty scheme', description: 'Earn rewards on every order.', linkUrl: 'frontend-shop' },
          { iconName: 'Package', title: 'Never run out', description: 'Auto-refill and easy reordering.', linkUrl: 'frontend-shop' }
        ] : undefined,
        stepItems: sectionType === 'How it works' ? [
          { number: '1', title: 'Choose your products', description: 'Browse the catalogue and add what you like to your cart', imageUrl: PLACEHOLDER_IMAGE },
          { number: '2', title: 'Choose your pouches', description: 'Mix and match your favourite brands, flavours and strengths. (these can be changed at anytime)', imageUrl: PLACEHOLDER_IMAGE },
          { number: '3', title: 'We handle the rest', description: 'Delivered automatically to your door hassle free weekly, Bi-weekly or monthly', imageUrl: PLACEHOLDER_IMAGE }
        ] : undefined,
        trustBadges: sectionType === 'Trust badges' ? [
          { iconType: 'badge', title: '100% AUTHENTIC', description: 'Direct from official suppliers.' },
          { iconType: 'shield', title: 'PREMIUM QUALITY', description: 'Only trusted, proven brands.' },
          { iconType: 'globe', title: 'GLOBAL SELECTION', description: 'The best from around the world.' },
          { iconType: 'tag', title: 'MEMBER PRICING', description: 'Better prices, always.' }
        ] : undefined,
        faqItems: sectionType === 'FAQs' ? [
          { q: 'Is delivery fully tracked?', a: 'Yes, all orders over shipping thresholds generate functional, real-time courier tracking codes emailed instantly upon dispatch.', question: 'Is delivery fully tracked?', answer: 'Yes, all orders over shipping thresholds generate functional, real-time courier tracking codes emailed instantly upon dispatch.' },
          { q: 'Are these pouches tobacco-free?', a: 'Formulated completely on plant fiber with medical pure crystalline extract.', question: 'Are these pouches tobacco-free?', answer: 'Formulated completely on plant fiber with medical pure crystalline extract.' },
          { q: 'Can I return an item?', a: 'Yes. Contact us within the return window shown in our refund policy and we will arrange it.', question: 'Can I return an item?', answer: 'Yes. Contact us within the return window shown in our refund policy and we will arrange it.' }
        ] : undefined,
        faqs: sectionType === 'FAQs' ? [
          { q: 'Is delivery fully tracked?', a: 'Yes, all orders over shipping thresholds generate functional, real-time courier tracking codes emailed instantly upon dispatch.', question: 'Is delivery fully tracked?', answer: 'Yes, all orders over shipping thresholds generate functional, real-time courier tracking codes emailed instantly upon dispatch.' },
          { q: 'Are these pouches tobacco-free?', a: 'Formulated completely on plant fiber with medical pure crystalline extract.', question: 'Are these pouches tobacco-free?', answer: 'Formulated completely on plant fiber with medical pure crystalline extract.' },
          { q: 'Can I return an item?', a: 'Yes. Contact us within the return window shown in our refund policy and we will arrange it.', question: 'Can I return an item?', answer: 'Yes. Contact us within the return window shown in our refund policy and we will arrange it.' }
        ] : undefined,

      }
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
      addresses: [newCustomerForm.location || 'United Kingdom'],
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
      
      {/* Left sidebar Navigation */}
      {!selectedBuilderPageId && (
        <aside className="w-full lg:w-60 bg-[#ebebeb] text-[#4a4d50] shrink-0 border-r border-[#e1e3e5] p-3.5 flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* Dashboard Head */}
            <div className="flex items-center gap-3 pb-4 border-b border-[#e1e3e5]">
              <div className="w-8 h-8 bg-[#1c2d50] rounded flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1a1c1d]">Pouch Supply</h2>
                <span className="bg-gray-100 text-[9px] px-1.5 py-0.5 rounded border border-gray-200 text-gray-500 uppercase font-bold tracking-tighter">Admin</span>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="space-y-1 block">
              {[
                { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                { id: 'orders', label: 'Orders', icon: Package, badge: orders.filter(o => o.fulfillmentStatus === 'Unfulfilled').length },
                { id: 'collections', label: 'Collections', icon: Building },
                { id: 'products', label: 'Products', icon: ShoppingBag },
                { id: 'pages', label: 'Page Builder', icon: FileCode },
                { id: 'blogs', label: 'Blog Posts', icon: Layout },
                { id: 'files', label: 'Files Manager', icon: HardDrive },
                { id: 'customers', label: 'Customers', icon: Users },
                { id: 'discounts', label: 'Discounts', icon: Percent },
                { id: 'payments', label: 'Payments', icon: Percent },
                { id: 'delivery', label: 'Shipping & Delivery', icon: Truck },
                { id: 'age-verification', label: 'Age Verification', icon: Activity },
                { id: 'integrations', label: 'Integrations', icon: Settings },
                { id: 'email', label: 'Email & Marketing', icon: Mail },
                { id: 'layout', label: 'Header & Footer', icon: Settings },
                { id: 'development', label: 'Development Mode', icon: Terminal },
                { id: 'diagnostics', label: 'DB Diagnostics', icon: Activity },
                { id: 'recycle-bin', label: 'Recycle Bin', icon: Trash2, badge: recycleBinCount },
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as SidebarTab);
                      setSelectedBuilderPageId(null);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-md text-[13px] font-medium transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-[#edeeef] text-[#1a1c1d] font-semibold shadow-xs' 
                        : 'hover:bg-[#edeeef] text-[#4a4d50]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 rounded select-none">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-[#1a1c1d]' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-[#e8ecf4] text-[#1c2d50] font-bold text-[10px] py-0.5 px-2 rounded-full border border-slate-200">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Neon PostgreSQL Connection Button */}
            <div className="pt-2 border-t border-[#e1e3e5]/65 mt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDbDetailsModal(true);
                  fetchDbDetails();
                }}
                className="w-full flex items-center justify-between p-2 rounded-md text-[12px] font-bold text-slate-800 hover:bg-slate-100 transition-all cursor-pointer bg-white border border-slate-200 shadow-xs"
              >
                <div className="flex items-center gap-2 rounded select-none text-left">
                  <Database className="h-3.5 w-3.5 text-[#1c2d50] shrink-0 animate-pulse" />
                  <span>Neon PostgreSQL</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#1c2d50] block shrink-0 animate-pulse ml-1" />
              </button>
            </div>

            {/* View Online Store main button */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full flex items-center justify-center gap-2 bg-[#1c2d50] hover:bg-[#152340] px-3.5 py-2.5 rounded-xl text-white font-black text-[11px] uppercase tracking-wider shadow-sm transition-colors cursor-pointer select-none text-center"
            >
              <Globe className="h-4 w-4 shrink-0" />
              <span>View Online Store</span>
            </a>

            {onLogoutAdmin && (
              <button
                type="button"
                onClick={onLogoutAdmin}
                className="mt-2 w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-2 rounded-xl text-rose-700 font-bold text-[11px] uppercase tracking-wider shadow-2xs transition-colors cursor-pointer select-none text-center"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Sign Out Admin</span>
              </button>
            )}
          </div>

          {/* Foot of sidebar */}
          <div className="pt-4 border-t border-[#e1e3e5] text-[10px] text-[#707579]">
            <p>Running: Merchant v4.12</p>
            <p className="mt-1">Cloud Engine Active</p>
          </div>
        </aside>
      )}

      {/* Main Panel space */}
      <main className={selectedBuilderPageId ? "w-full p-4 lg:p-6" : "flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6 overflow-x-hidden"}>
        
        {/* Global panel header with stats glance info */}
        {!selectedBuilderPageId && (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-250">
            <div>
              <span className="text-[10px] text-indigo-600 bg-indigo-50 font-black uppercase py-1 px-3 rounded-full border border-indigo-100">Pouch Supply Partner Portal</span>
              <h1 className="text-2xl font-black text-slate-900 mt-2 capitalize flex items-center gap-2">
                {activeTab} Management Panel
              </h1>
            </div>
            
            {/* Quick Metrics display */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Draft Status Indicator */}
              <div className="flex items-center gap-2 bg-white border border-slate-250 px-4 py-2.5 rounded-xl shadow-xs">
                <span className={`h-2.5 w-2.5 rounded-full ${hasUnsavedChanges ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="font-extrabold text-[10px] text-slate-700 uppercase tracking-widest whitespace-nowrap">
                  {hasUnsavedChanges ? 'Unsaved Edits Present' : 'All Changes Saved'}
                </span>
              </div>

              {/* Save changes button */}
              <button
                onClick={handleGlobalSave}
                disabled={!hasUnsavedChanges || isSaving}
                className={`py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-xs border ${
                  isSaving
                    ? 'bg-slate-700 text-white border-slate-700 cursor-wait'
                    : hasUnsavedChanges
                    ? 'bg-[#1c2d50] hover:bg-[#152340] text-white border-[#1c2d50] cursor-pointer ring-4 ring-slate-400/30 animate-pulse font-extrabold shadow-md'
                    : 'bg-slate-100 text-slate-350 border-slate-200 cursor-not-allowed select-none'
                }`}
              >
                {isSaving ? (
                  <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 shrink-0" />
                )}
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>

              {/* Discard button */}
              {hasUnsavedChanges && (
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to discard all unsaved edits made during this session? This action cannot be undone.")) {
                      handleGlobalDiscard();
                    }
                  }}
                  className="py-2.5 px-3.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-150 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all cursor-pointer"
                  title="Discard All Draft Changes"
                >
                  Discard
                </button>
              )}

              {/* View Online Store Button */}
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 bg-white hover:bg-slate-150 text-[#1c2d50] border border-slate-250 hover:border-slate-350 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-xs cursor-pointer select-none"
                title="Open Customer Online Store in new tab"
              >
                <Globe className="h-4 w-4 shrink-0 text-[#1c2d50]" />
                <span>View Online Store</span>
              </a>

              <div className="bg-white border border-slate-250 px-4 py-2.5 rounded-xl shadow-xs">
                <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Gross Sales</span>
                <span className="font-extrabold text-slate-950 text-sm">₹{stats.totalSales.toFixed(2)}</span>
              </div>
              <div className="bg-white border border-slate-250 px-4 py-2.5 rounded-xl shadow-xs">
                <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Unfulfilled</span>
                <span className="font-extrabold text-amber-500 text-sm">{orders.filter(o => o.fulfillmentStatus === 'Unfulfilled').length} Orders</span>
              </div>
            </div>
          </div>
        )}

        {/* Database Integration & IP Whitelisting Diagnosis Banner */}
        {dbStatus && (
          <div className="w-full space-y-4">
            {dbStatus.status === 'not-configured' && (
              <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-amber-100/30">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-amber-600 animate-pulse" />
                      Offline-Safe Mode Enabled (Memory Cache & LocalStorage)
                    </p>
                    <p className="text-[10px] text-amber-800 leading-relaxed max-w-3xl">
                      Configure a <code className="font-mono bg-amber-100/60 px-1 py-0.5 rounded font-bold text-amber-950">DATABASE_URL</code> below to persist layout, images, categories, and inventory securely in your own Neon PostgreSQL database.
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className="text-[9px] font-mono font-black border border-amber-200 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                      Fallback Cache Online
                    </span>
                  </div>
                </div>

                {/* Secure Configuration Input Form */}
                <div className="bg-white/80 border border-amber-200 rounded-xl p-4 space-y-3 shadow-3xs">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1">Enter your Neon PostgreSQL Connection String (DATABASE_URL):</span>
                    <form onSubmit={handleUpdateUriSubmit} className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1 flex items-center">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require"
                          value={customUriInput}
                          onChange={(e) => setCustomUriInput(e.target.value)}
                          className="w-full text-xs font-mono border border-slate-200 p-2.5 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-505 bg-white font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                          title={showPassword ? "Hide Connection String" : "Show Connection String"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={uriUpdating}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg cursor-pointer transition-colors shrink-0 flex items-center justify-center gap-1"
                      >
                        {uriUpdating ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          "Save & Connect"
                        )}
                      </button>
                    </form>
                    {uriUpdateResult && (
                      <p className={`text-[11px] font-bold mt-2 ${uriUpdateResult.success ? 'text-emerald-600' : 'text-pink-600'}`}>
                        {uriUpdateResult.message}
                      </p>
                    )}

                    {/* Environment Variable Guide Callout */}
                    <div className="mt-3 p-3 bg-indigo-50 border border-indigo-150 rounded-lg text-[10.5px] leading-relaxed text-indigo-950 font-semibold flex items-start gap-2.5">
                      <div className="mt-0.5 text-xs text-indigo-600 font-bold select-none">💡</div>
                      <div>
                        <span className="font-extrabold text-indigo-905 block uppercase tracking-wider text-[9px] mb-0.5">Production Deployments note:</span>
                        To persist your database permanently, set the environment variable <code className="font-mono bg-indigo-100/80 text-indigo-900 px-1 py-0.5 rounded text-[9.5px]">DATABASE_URL</code> to your Neon PostgreSQL connection string.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {dbStatus.status === 'error' && (
              <div className="space-y-4">
                {/* Clean, compact, non-intrusive status alert */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-650" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-800">
                        Neon PostgreSQL Connection Inactive (Local fallback cache active)
                      </p>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                        Your database is offline or unable to resolve. Data will be saved locally so you don't lose anything: <code className="font-mono text-slate-600 bg-slate-100/80 px-1 py-0.5 rounded text-[9.5px] select-all">{dbStatus.error ? dbStatus.error.slice(0, 150) + '...' : 'Connection Error'}</code>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Are you sure you want to clear the custom Database URI?")) {
                        setCustomUriInput('');
                        fetch('/api/update-db-uri', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ uri: '' })
                        }).then(() => {
                          setDbStatus({ status: 'not-configured' });
                        });
                      }
                    }}
                    className="text-[9px] hover:bg-rose-50 text-rose-600 border border-rose-200 px-2 py-1 rounded font-bold uppercase tracking-wider transition-colors whitespace-nowrap self-start sm:self-center cursor-pointer"
                  >
                    Clear URI
                  </button>
                </div>

                {/* Neon PostgreSQL Connection Information */}
                <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border border-indigo-150 rounded-xl p-5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center select-none shrink-0 text-white font-bold text-xs ring-4 ring-indigo-100">
                      ?
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wide">Neon PostgreSQL Database Configuration</h4>
                      <p className="text-[10px] text-indigo-700 font-semibold">Server-side connection managed via Prisma ORM.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="bg-white/90 border border-slate-150 p-3.5 rounded-lg space-y-2">
                      <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Database</span>
                      <p className="text-[10.5px] text-slate-700 leading-relaxed font-medium">
                        Operates on serverless Neon PostgreSQL with auto-scaling and pooled connections.
                      </p>
                    </div>
                    <div className="bg-white/90 border border-slate-150 p-3.5 rounded-lg space-y-2">
                      <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">ORM</span>
                      <p className="text-[10.5px] text-slate-700 leading-relaxed font-medium">
                        Prisma Client handles strongly typed schema definitions, indexing, and migration pipelines.
                      </p>
                    </div>
                    <div className="bg-white/90 border border-slate-150 p-3.5 rounded-lg space-y-2">
                      <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Storage</span>
                      <p className="text-[10.5px] text-slate-700 leading-relaxed font-semibold">
                        All products, orders, collections, customers, discounts, and page layouts are synced.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Secure Configuration Input Form */}
                <div className="bg-white/80 border border-slate-205 rounded-xl p-4 space-y-3 shadow-3xs">
                  <span className="text-[10px] font-extrabold text-slate-605 uppercase tracking-wider block">Update Neon DATABASE_URL Connection String:</span>
                  <form onSubmit={handleUpdateUriSubmit} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1 flex items-center">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require"
                        value={customUriInput}
                        onChange={(e) => setCustomUriInput(e.target.value)}
                        className="w-full text-xs font-mono border border-slate-202 p-2.5 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-505 bg-white font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-slate-400 hover:text-slate-650 p-1"
                        title={showPassword ? "Hide Connection String" : "Show Connection String"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={uriUpdating}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg cursor-pointer transition-colors shrink-0 flex items-center justify-center gap-1"
                    >
                      {uriUpdating ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Testing Connection...
                        </>
                      ) : (
                        "Save & Retry"
                      )}
                    </button>
                  </form>
                  {uriUpdateResult && (
                    <p className={`text-[11px] font-bold mt-2 ${uriUpdateResult.success ? 'text-emerald-600' : 'text-pink-600'}`}>
                      {uriUpdateResult.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      window.location.reload();
                    }}
                    className="flex items-center gap-2 bg-indigo-650 hover:bg-indigo-750 transition-colors text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-xs cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Retry Sync Connection</span>
                  </button>
                  <span className="text-[10px] text-slate-500 font-semibold italic">
                    (Currently operating safely on full-fidelity backup Server Mode memory cache)
                  </span>
                </div>
              </div>
            )}
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
  );
}
