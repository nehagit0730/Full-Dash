import React, { useState, useRef } from 'react';
import { CustomPage, PageSection, Product, Collection, Customer, BlogPost } from '../types';
import { cleanMediaUrl, PLACEHOLDER_IMAGE } from '../utils/mediaUtils';
import { 
  ArrowRight, ShoppingCart, Star, Heart, FileText, Check, 
  ChevronDown, ChevronUp, Play, Sparkles, TrendingUp, Plus, Minus, ShieldCheck, Award, Eye, Flame, ArrowUpRight, BookOpen, Layers, ExternalLink,
  Truck, Zap, Shield, Clock, Package, HelpCircle, Globe, Tag, ChevronLeft, ChevronRight, Lock, Gift, RefreshCw, Snowflake, Crown, Percent, Calendar, Send, Mail, Phone, MapPin, AlertCircle, Loader2
} from 'lucide-react';
import PremiumSlideshow from './PremiumSlideshow';
import PlansCanOverlay from './PlansCanOverlay';
import { useRecaptcha } from '../hooks/useRecaptcha';

interface BrandsWeOfferSectionProps {
  sec: PageSection;
  handleLinkClick: (link?: string) => void;
}

function BrandsWeOfferSection({ sec, handleLinkClick }: BrandsWeOfferSectionProps) {
  const items = (sec.settings.brandItems || []).filter(b => (b.imageUrl && b.imageUrl.trim() !== '') || (b.title && b.title.trim() !== '') || (b.linkUrl && b.linkUrl.trim() !== ''));
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
    sliderRef.current.scrollBy({ left: -260, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({ left: 260, behavior: 'smooth' });
  };

  return (
    <div className="py-6 bg-white w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-3 mb-6 animate-fade-in">
        <div className="flex items-center justify-center gap-4">
          <div className="w-10 h-[1px] bg-[#D4AF37]" />
          <span className="block text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
            THE BRANDS YOU LOVE
          </span>
          <div className="w-10 h-[1px] bg-[#D4AF37]" />
        </div>
        {sec.settings.title && (
          <h2 
            className="text-3xl md:text-[42px] font-black uppercase tracking-tight text-slate-900 leading-none"
            style={{ color: sec.settings.headingColor || '#0C1017' }}
          >
            {sec.settings.title}
          </h2>
        )}
        {sec.settings.description && (
          <p 
            className="max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed text-slate-500 font-medium opacity-85"
            style={{ color: sec.settings.textColor || '#64748B' }}
          >
            {sec.settings.description}
          </p>
        )}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-12">
        {/* Left Arrow Button */}
        {items.length > 0 && (
          <button 
            type="button"
            onClick={scrollLeft} 
            className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full border border-[#D4AF37] bg-white flex items-center justify-center text-[#D4AF37] hover:bg-amber-50/55 shadow-md transition-all duration-300 transform active:scale-95 cursor-pointer"
            aria-label="Previous Brand"
          >
            <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
          </button>
        )}

        {/* Brand Slider Container */}
        <div 
          ref={sliderRef}
          onScroll={handleScroll}
          className="flex gap-6 overflow-x-auto scrollbar-none py-6 px-4 scroll-smooth"
        >
          {items.map((b, idx) => (
            <div 
              key={idx} 
              onClick={() => b.linkUrl && handleLinkClick(b.linkUrl)}
              className="group flex flex-col items-center justify-center shrink-0 w-[160px] sm:w-[190px] aspect-square bg-white rounded-[24px] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_24px_50px_rgba(0,0,0,0.12)] border border-slate-50/50 transition-all duration-300 transform hover:-translate-y-1.5 select-none cursor-pointer"
            >
              {b.imageUrl ? (
                <img 
                  src={cleanMediaUrl(b.imageUrl)} 
                  className="max-h-24 max-w-[140px] object-contain transition-transform duration-300 group-hover:scale-105" 
                  alt={b.title || 'Brand'} 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-sm font-black text-slate-800 uppercase tracking-tight truncate max-w-full group-hover:scale-105 transition-transform duration-300">
                  {b.title || 'Brand'}
                </span>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-slate-400 italic text-center py-8 w-full text-xs">
              No brands found. Go to Admin Dashboard to upload brands!
            </div>
          )}
        </div>

        {/* Right Arrow Button */}
        {items.length > 0 && (
          <button 
            type="button"
            onClick={scrollRight} 
            className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full border border-[#D4AF37] bg-white flex items-center justify-center text-[#D4AF37] hover:bg-amber-50/55 shadow-md transition-all duration-300 transform active:scale-95 cursor-pointer"
            aria-label="Next Brand"
          >
            <ChevronRight className="h-5 w-5 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Dot Indicators */}
      {items.length > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          {Array.from({ length: Math.min(items.length, 6) }).map((_, dIdx) => (
            <button
              key={dIdx}
              type="button"
              onClick={() => scrollToDot(dIdx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                dIdx === activeDot ? 'bg-[#D4AF37] w-5' : 'bg-slate-200 hover:bg-slate-300'
              }`}
              aria-label={`Go to slide ${dIdx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface PlansSectionProps {
  sec: PageSection;
  handleLinkClick: (link?: string) => void;
}

function PlansSection({ sec, handleLinkClick }: PlansSectionProps) {
  const settings = sec.settings;
  const bgColor = settings.backgroundColor || '#061229';
  const title = settings.title || 'CHOOSE YOUR PLAN';
  const description = settings.description || 'Flexible subscriptions. Premium brands. Serious savings.';
  const alertBadgeText = settings.alertBadgeText || 'Most customers save up to £55/month';
  const promoText = settings.promoBannerText || '★ FIRST 50 CUSTOMERS - Get 10% OFF YOUR FIRST ORDER >';

  // Default plans fallback
  const plans = settings.planItems || [
    {
      slug: 'lite',
      name: 'LITE',
      subtitle: 'Best for getting started',
      price: 27.99,
      limit: 6,
      saveAmountText: 'Save £5.00/month',
      imageUrl: '',
      features: ['6 premium cans', 'Flexible delivery', 'Change flavours anytime', 'Skip or pause anytime'],
      isPopular: false
    },
    {
      slug: 'core',
      name: 'CORE',
      subtitle: 'Most flexible',
      price: 35.99,
      limit: 8,
      saveAmountText: 'Save £10.00/month',
      imageUrl: '',
      features: ['8 premium cans', 'Lower price per can', 'Change or swap brands', 'Skip or pause anytime'],
      isPopular: false
    },
    {
      slug: 'pro',
      name: 'PRO',
      subtitle: 'Best value',
      price: 40.99,
      limit: 10,
      saveAmountText: 'Save £14.00/month',
      imageUrl: '',
      features: ['10 premium cans', 'FREE delivery 📦', 'Best price per can', 'Loyalty rewards boost', 'Skip or pause anytime'],
      isPopular: true
    },
    {
      slug: 'ultimate',
      name: 'ULTIMATE',
      subtitle: 'Maximum savings',
      price: 46.99,
      limit: 12,
      saveAmountText: 'Save £19.00/month',
      imageUrl: '',
      features: ['12 premium cans', 'FREE delivery 📦', 'Lowest price per can', '£3.80 for any extra can', 'Skip or pause anytime'],
      extraText: '£3.80 FOR ANY ADDITIONAL CAN',
      isPopular: false
    }
  ];

  // Map click of Choose Plan to navigate straight to the subscribe wizard with that plan
  const handleSelectPlan = (plan: any) => {
    const targetLink = plan.buttonLink && plan.buttonLink.trim() !== ''
      ? plan.buttonLink
      : `/pages/subscribe/${plan.slug}`;
    handleLinkClick(targetLink);
  };

  return (
    <div className="w-full text-white py-8 px-4" style={{ backgroundColor: bgColor }}>
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Top Promo Banner Pill */}
        {promoText && (
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 bg-[#dfb55a]/10 border border-[#dfb55a]/30 text-[#dfb55a] px-5 py-2 rounded-full text-xs font-black tracking-widest uppercase shadow-md animate-pulse">
              <Crown className="w-3.5 h-3.5" />
              <span>{promoText}</span>
            </div>
          </div>
        )}

        {/* Section Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4.5xl md:text-5xl font-black tracking-tight uppercase leading-none font-sans">
            {title.includes('PLAN') ? (
              <>
                {title.substring(0, title.lastIndexOf('PLAN'))}
                <span className="text-[#dfb55a]">{title.substring(title.lastIndexOf('PLAN'))}</span>
              </>
            ) : (
              title
            )}
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-medium max-w-lg mx-auto">
            {description}
          </p>

          {/* Savings Alert Badge */}
          {alertBadgeText && (
            <div className="inline-flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-4 py-1.5 rounded-full text-[11px] font-bold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{alertBadgeText}</span>
            </div>
          )}
        </div>

        {/* Cycle Switcher Placeholder for Design Aesthetic */}
        <div className="flex justify-center">
          <div className="bg-slate-950 p-1.5 rounded-full border border-slate-800 flex items-center gap-1">
            <button className="px-5 py-2 rounded-full text-xs font-bold text-slate-400 hover:text-white transition-colors">
              Weekly
            </button>
            <button className="px-5 py-2 rounded-full text-xs font-black bg-[#dfb55a] text-slate-950 shadow-md">
              Every 2 Weeks <span className="text-[9px] opacity-75 font-bold ml-1">(POPULAR)</span>
            </button>
            <button className="px-5 py-2 rounded-full text-xs font-bold text-slate-400 hover:text-white transition-colors">
              Monthly
            </button>
          </div>
        </div>

        {/* 4-Tier Plan Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          {plans.map((plan: any) => {
            const isPopular = plan.isPopular;
            return (
              <div 
                key={plan.slug}
                className={`bg-white text-slate-900 rounded-3xl p-6 flex flex-col justify-between relative shadow-2xl transition-all duration-300 hover:scale-[1.03] ${
                  isPopular ? 'ring-4 ring-[#dfb55a]' : 'border border-slate-150'
                }`}
              >
                {/* Floating Ribbon for highlighted / popular tier */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#dfb55a] text-slate-950 font-black text-[10px] tracking-widest uppercase px-5 py-1.5 rounded-full shadow-lg flex items-center gap-1 z-20">
                    <Flame className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Best Seller</span>
                  </div>
                )}

                <div className="space-y-5">
                  {/* Card Title Header */}
                  <div className="text-center">
                    <h3 className="text-2xl font-black tracking-widest uppercase text-slate-950 leading-none">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">
                      {plan.subtitle}
                    </p>
                  </div>

                  {/* Plan image wrapper - uses dynamic custom image if uploaded, or high-fidelity canister overlap */}
                  <div className="relative h-44 w-full bg-transparent overflow-hidden flex items-center justify-center p-2">
                    {plan.imageUrl ? (
                      <img 
                        src={cleanMediaUrl(plan.imageUrl)} 
                        alt={plan.name} 
                        className="w-full h-full object-contain pointer-events-none rounded-xl"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <PlansCanOverlay type={plan.slug} className="w-full h-full bg-transparent border-0 shadow-none p-0" />
                    )}
                  </div>

                  {/* Pricing Details */}
                  <div className="text-center pt-2 border-t border-slate-100 space-y-1">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                      Includes {plan.limit} Cans
                    </div>
                    <div className="text-3xl font-black text-slate-950 tracking-tight leading-none">
                      £{plan.price.toFixed(2)}
                      <span className="text-xs text-slate-450 font-bold tracking-normal block mt-1 uppercase">
                        per delivery
                      </span>
                    </div>

                    {plan.saveAmountText && (
                      <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-black tracking-wide uppercase px-3 py-1 rounded-full border border-emerald-100 mt-2">
                        <Tag className="w-3 h-3 fill-emerald-100" />
                        <span>{plan.saveAmountText}</span>
                      </div>
                    )}
                  </div>

                  {/* Bullets feature list */}
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    {plan.features && plan.features.map((feat: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-600">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ultimate plan extra ribbon indicator */}
                <div className="mt-6 space-y-3">
                  {plan.extraText ? (
                    <div className="text-center py-1.5 bg-rose-50 text-rose-600 font-extrabold text-[9px] tracking-widest uppercase rounded-full border border-rose-100">
                      {plan.extraText}
                    </div>
                  ) : (
                    <div className="h-6" />
                  )}

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-3.5 px-6 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 group ${
                      isPopular 
                        ? 'bg-[#dfb55a] text-slate-950 hover:bg-[#cf9e42] shadow-amber-500/10' 
                        : 'bg-slate-950 text-white hover:bg-slate-850'
                    }`}
                  >
                    <span>Choose Plan</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic footer trust badges or steps bar for thePlans page */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-12 border-t border-slate-800 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
          <div className="flex flex-col items-center gap-1.5">
            <Lock className="w-5 h-5 text-[#dfb55a]" />
            <span>SECURE CHECKOUT</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Truck className="w-5 h-5 text-[#dfb55a]" />
            <span>ROYAL MAIL TRACKED</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Gift className="w-5 h-5 text-[#dfb55a]" />
            <span>LOYALTY REWARDS</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <RefreshCw className="w-5 h-5 text-[#dfb55a]" />
            <span>SKIP ANYTIME</span>
          </div>
          <div className="col-span-2 md:col-span-1 flex flex-col items-center gap-1.5">
            <Clock className="w-5 h-5 text-[#dfb55a]" />
            <span>CANCEL ANYTIME</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface HowItWorksSectionProps {
  sec: PageSection;
  handleLinkClick: (link?: string) => void;
}

function HowItWorksSection({ sec, handleLinkClick }: HowItWorksSectionProps) {
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
            src={cleanMediaUrl(step.imageUrl)} 
            className="w-full max-h-60 object-contain filter drop-shadow-md group-hover:scale-[1.03] transition-transform duration-500" 
            alt={step.title} 
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      );
    }

    if (sidx === 0) {
      return (
        <div className="w-full bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center my-4">
          <div className="grid grid-cols-4 gap-1 w-full">
            {/* LITE */}
            <div className="bg-white rounded-lg border border-slate-200/60 p-1.5 flex flex-col items-center justify-between text-center shadow-2xs h-32">
              <span className="text-[8px] font-black tracking-wider text-slate-400">LITE</span>
              <div className="my-1 text-center">
                <span className="block text-[11px] font-black text-slate-800 leading-tight">5 Cans</span>
                <span className="block text-[10px] font-bold text-[#D4AF37] leading-tight">£27.99</span>
                <span className="text-[7px] text-slate-400 block -mt-0.5">per month</span>
              </div>
            </div>
            
            {/* CORE */}
            <div className="bg-white rounded-lg border border-slate-200/60 p-1.5 flex flex-col items-center justify-between text-center shadow-2xs h-32">
              <span className="text-[8px] font-black tracking-wider text-slate-450">CORE</span>
              <div className="my-1 text-center">
                <span className="block text-[11px] font-black text-slate-800 leading-tight">8 Cans</span>
                <span className="block text-[10px] font-bold text-[#D4AF37] leading-tight">£35.99</span>
                <span className="text-[7px] text-slate-400 block -mt-0.5">per month</span>
              </div>
            </div>

            {/* PRO */}
            <div className="bg-[#0C1017] rounded-lg border border-[#D4AF37] p-1.5 flex flex-col items-center justify-between text-center shadow-sm h-32 relative overflow-hidden transform scale-105 z-10">
              <div className="absolute top-0 left-0 right-0 bg-[#D4AF37] text-[5px] font-black text-slate-950 py-0.5 uppercase tracking-wider text-center">
                MOST POPULAR
              </div>
              <span className="text-[8px] font-black tracking-wider text-white mt-1.5">PRO</span>
              <div className="my-1 text-center">
                <span className="block text-[11px] font-black text-white leading-tight">10 Cans</span>
                <span className="block text-[10px] font-bold text-[#D4AF37] leading-tight">£40.99</span>
                <span className="text-[7px] text-slate-350 block -mt-0.5">per month</span>
              </div>
              <span className="text-[4px] font-bold text-emerald-400 tracking-wider uppercase">FREE DEV</span>
            </div>

            {/* ULTIMATE */}
            <div className="bg-white rounded-lg border border-[#D4AF37]/50 p-1.5 flex flex-col items-center justify-between text-center shadow-2xs h-32">
              <span className="text-[8px] font-black tracking-wider text-slate-450">ULTIMATE</span>
              <div className="my-1 text-center">
                <span className="block text-[11px] font-black text-slate-800 leading-tight">12 Cans</span>
                <span className="block text-[10px] font-bold text-[#D4AF37] leading-tight">£46.99</span>
                <span className="text-[7px] text-slate-400 block -mt-0.5">per month</span>
              </div>
              <span className="text-[4px] font-bold text-[#D4AF37] tracking-wider uppercase">FREE DEV</span>
            </div>
          </div>
        </div>
      );
    }

    if (sidx === 1) {
      return (
        <div className="w-full h-40 relative my-4 flex items-center justify-center overflow-hidden">
          <div className="relative w-full max-w-[260px] h-full flex items-center justify-center">
            {/* CAN 1: ZYN */}
            <div className="absolute left-1 top-4 w-[64px] h-[64px] rounded-full bg-white border border-slate-200 shadow-md flex flex-col items-center justify-center p-0.5 transform -rotate-12 z-10 transition-transform duration-300 hover:scale-105">
              <div className="w-[56px] h-[56px] rounded-full border border-sky-400/30 flex flex-col items-center justify-center bg-sky-50/20">
                <span className="text-[9px] font-extrabold text-sky-600 tracking-tight leading-none">ZYN</span>
                <span className="text-[4px] font-bold text-sky-400 uppercase tracking-widest mt-0.5">COOL MINT</span>
              </div>
            </div>

            {/* CAN 2: VELO */}
            <div className="absolute right-1 top-4 w-[64px] h-[64px] rounded-full bg-white border border-slate-200 shadow-md flex flex-col items-center justify-center p-0.5 transform rotate-12 z-10 transition-transform duration-300 hover:scale-105">
              <div className="w-[56px] h-[56px] rounded-full border border-blue-500/30 flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
                <span className="text-[9px] font-extrabold text-white tracking-tight leading-none">VELO</span>
                <span className="text-[3px] font-bold text-sky-200 uppercase tracking-widest mt-0.5">FREEZE</span>
              </div>
            </div>

            {/* CAN 3: FUMI */}
            <div className="absolute left-9 bottom-2 w-[60px] h-[60px] rounded-full bg-white border border-slate-200 shadow-md flex flex-col items-center justify-center p-0.5 transform rotate-6 z-20 transition-transform duration-300 hover:scale-105">
              <div className="w-[52px] h-[52px] rounded-full border border-purple-500/20 flex flex-col items-center justify-center bg-gradient-to-br from-purple-500 to-purple-700">
                <span className="text-[8px] font-extrabold text-white tracking-tight leading-none">FUMI</span>
                <span className="text-[3px] font-bold text-purple-200 uppercase tracking-widest mt-0.5">BERRY</span>
              </div>
            </div>

            {/* CAN 4: PABLO */}
            <div className="absolute right-9 bottom-2 w-[60px] h-[60px] rounded-full bg-white border border-slate-200 shadow-md flex flex-col items-center justify-center p-0.5 transform -rotate-6 z-20 transition-transform duration-300 hover:scale-105">
              <div className="w-[52px] h-[52px] rounded-full border border-red-650/30 flex flex-col items-center justify-center bg-slate-50">
                <span className="text-[8px] font-black text-red-650 tracking-tighter leading-none italic">PABLO</span>
                <span className="text-[3px] font-black text-slate-800 uppercase tracking-widest mt-0.5">EXCLUSIVE</span>
              </div>
            </div>

            {/* CAN 5: 77 */}
            <div className="absolute left-[38%] top-2 w-[70px] h-[70px] rounded-full bg-white border border-slate-200 shadow-lg flex flex-col items-center justify-center p-0.5 transform -translate-x-1/2 -rotate-3 z-30 transition-transform duration-300 hover:scale-105">
              <div className="w-[62px] h-[62px] rounded-full border border-slate-900 flex flex-col items-center justify-center bg-[#0C1017]">
                <span className="text-[14px] font-black text-white tracking-tighter leading-none">77</span>
                <span className="text-[3.5px] font-bold text-[#D4AF37] uppercase tracking-widest -mt-0.5">NICOTINE</span>
              </div>
            </div>

            {/* CAN 6: CUBA */}
            <div className="absolute right-[38%] top-2 w-[70px] h-[70px] rounded-full bg-white border border-slate-200 shadow-lg flex flex-col items-center justify-center p-0.5 transform translate-x-1/2 rotate-3 z-30 transition-transform duration-300 hover:scale-105">
              <div className="w-[62px] h-[62px] rounded-full border border-amber-500 flex flex-col items-center justify-center bg-slate-900">
                <span className="text-[11px] font-black text-amber-400 tracking-wider leading-none">CUBA</span>
                <span className="text-[3.5px] font-bold text-white uppercase tracking-widest mt-0.5">BLACK</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (sidx === 2) {
      return (
        <div className="w-full h-40 relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
            <div className="w-40 h-20 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 blur-xl rounded-full" />
            <span className="text-emerald-500 text-sm absolute left-12 top-6 animate-pulse">🌿</span>
            <span className="text-emerald-500 text-xs absolute right-12 bottom-6 animate-pulse" style={{ animationDelay: '1s' }}>🌿</span>
          </div>

          <div className="w-48 h-28 bg-[#0C1017] rounded-xl border border-slate-800 shadow-[0_12px_24px_rgba(0,0,0,0.25)] relative overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500 flex flex-col justify-between p-2.5 select-none">
            <div className="absolute top-2 right-3 w-12 h-10 bg-white/95 rounded-sm p-0.5 shadow-2xs flex flex-col justify-between border-l border-b border-slate-200 text-slate-800">
              <div className="w-full h-0.5 bg-slate-400 rounded-2xs" />
              <div className="space-y-[1.5px]">
                <div className="w-6 h-[1.5px] bg-slate-300" />
                <div className="w-8 h-[1.5px] bg-slate-300" />
              </div>
              <div className="flex gap-[0.5px] h-2 items-end">
                <div className="w-[1px] h-full bg-slate-800" />
                <div className="w-[1.5px] h-full bg-slate-800" />
                <div className="w-[1px] h-[70%] bg-slate-800" />
                <div className="w-[1px] h-full bg-slate-800" />
              </div>
            </div>

            <div className="mt-1 space-y-0.5 text-left">
              <span className="block text-[11px] font-black tracking-[0.12em] text-[#D4AF37] leading-none">POUCH</span>
              <span className="block text-[11px] font-black tracking-[0.12em] text-[#D4AF37] leading-none">SUPPLY</span>
            </div>

            <div className="border-t border-slate-800/65 pt-1.5 flex items-center justify-between">
              <span className="text-[4.5px] font-bold text-slate-450 uppercase tracking-[0.18em]">NICOTINE ON AUTOPILOT</span>
              <div className="flex gap-0.5">
                <div className="w-0.5 h-0.5 rounded-full bg-slate-800" />
                <div className="w-0.5 h-0.5 rounded-full bg-slate-800" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-8 w-36 h-36 flex items-center justify-center bg-slate-50/50 rounded-2xl p-4 shrink-0 border border-slate-100/50 group-hover:border-slate-200 group-hover:bg-white transition-all duration-300">
        {step.imageUrl ? (
          <img 
            src={cleanMediaUrl(step.imageUrl)} 
            className="max-h-28 max-w-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-300" 
            alt={step.title} 
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">No Image Asset</span>
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
      <div className="mt-4 space-y-2 w-full text-left">
        {checkmarks.map((text, cidx) => (
          <div key={cidx} className="flex items-center gap-2 text-xs font-bold text-slate-850 justify-center">
            <div className="w-4 h-4 rounded-full bg-amber-50 border border-amber-250 text-[#D4AF37] flex items-center justify-center shrink-0">
              <Check className="h-2.5 w-2.5 stroke-[3]" />
            </div>
            <span className="text-[11.5px] text-slate-650 font-extrabold">{text}</span>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto flex flex-col items-center">
          <div className="flex items-center justify-center gap-4 animate-fade-in">
            <div className="w-10 h-[1px] bg-[#D4AF37]" />
            <span className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">
              HOW IT WORKS
            </span>
            <div className="w-10 h-[1px] bg-[#D4AF37]" />
          </div>
          
          <h2 
            className="text-3xl md:text-[42px] font-black uppercase tracking-tight text-[#0C1017] leading-none"
            style={{ color: sec.settings.headingColor || '#0C1017' }}
          >
            {sec.settings.title || 'Get Started In Under 60 Seconds'}
          </h2>
          
          {sec.settings.description && (
            <p 
              className="text-xs sm:text-sm leading-relaxed text-slate-550 font-semibold opacity-90"
              style={{ color: sec.settings.textColor || '#64748B' }}
            >
              {sec.settings.description}
            </p>
          )}

          {/* Reassuring timing badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50/75 border border-amber-100 text-[#D4AF37] text-xs font-black animate-fade-in">
            <Clock className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Takes less than 60 seconds</span>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="relative max-w-6xl mx-auto pt-6">
          {/* Gold Connecting Dotted Line */}
          <div className="absolute top-[180px] left-[15%] right-[15%] h-[2px] border-t-2 border-dashed border-[#D4AF37]/45 hidden md:block z-0" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 relative z-10">
            {steps.map((step, sidx) => (
              <div 
                key={sidx}
                className="bg-white rounded-[24px] border border-slate-100 p-8 flex flex-col items-center justify-between text-center shadow-[0_15px_40px_rgba(147,197,253,0.1)] hover:shadow-[0_24px_50px_rgba(147,197,253,0.16)] hover:-translate-y-1.5 transition-all duration-500 min-h-[440px] group relative"
              >
                {/* Gold step circle overlapping border */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#D4AF37] text-white font-black text-base flex items-center justify-center shadow-md border-4 border-white transition-all duration-300 group-hover:scale-110">
                  {step.number || (sidx + 1)}
                </div>

                <div className="space-y-4 flex-1 flex flex-col items-center pt-3 w-full">
                  <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-snug">
                    {step.title || 'Step Title'}
                  </h3>
                  
                  <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed max-w-[250px] font-semibold">
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
        <div className="max-w-6xl mx-auto pt-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_12px_40px_rgba(147,197,253,0.04)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 lg:divide-y-0 lg:divide-x divide-slate-100">
            {/* CANCEL ANYTIME */}
            <div className="flex items-center gap-4 py-4 sm:py-2 md:px-4 first:pt-0 sm:first:pt-2 justify-center lg:justify-start">
              <div className="shrink-0 p-3 rounded-xl bg-slate-50 flex items-center justify-center text-slate-800 shadow-2xs">
                <ShieldCheck className="h-6 w-6 text-slate-800" />
              </div>
              <div className="text-left">
                <h4 className="text-[11px] font-black tracking-wider text-slate-900 uppercase">
                  CANCEL ANYTIME
                </h4>
                <p className="text-[11px] text-slate-400 font-bold leading-normal">
                  No ties, no fuss. You're in control.
                </p>
              </div>
            </div>

            {/* CHANGE ANYTIME */}
            <div className="flex items-center gap-4 py-4 sm:py-2 md:px-4 lg:pl-6 justify-center lg:justify-start">
              <div className="shrink-0 p-3 rounded-xl bg-slate-50 flex items-center justify-center text-slate-850 shadow-2xs">
                <RefreshCw className="h-6 w-6 text-slate-850 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              <div className="text-left">
                <h4 className="text-[11px] font-black tracking-wider text-slate-900 uppercase">
                  CHANGE ANYTIME
                </h4>
                <p className="text-[11px] text-slate-400 font-bold leading-normal">
                  Swap plans, brands or flavours.
                </p>
              </div>
            </div>

            {/* SKIP DELIVERIES */}
            <div className="flex items-center gap-4 py-4 sm:py-2 md:px-4 lg:pl-6 justify-center lg:justify-start">
              <div className="shrink-0 p-3 rounded-xl bg-slate-50 flex items-center justify-center text-slate-800 shadow-2xs">
                <Truck className="h-6 w-6 text-slate-800" />
              </div>
              <div className="text-left">
                <h4 className="text-[11px] font-black tracking-wider text-slate-900 uppercase">
                  SKIP DELIVERIES
                </h4>
                <p className="text-[11px] text-slate-400 font-bold leading-normal">
                  Skip, pause or delay anytime.
                </p>
              </div>
            </div>

            {/* NO CONTRACTS */}
            <div className="flex items-center gap-4 py-4 sm:py-2 md:px-4 lg:pl-6 last:pb-0 justify-center lg:justify-start">
              <div className="shrink-0 p-3 rounded-xl bg-slate-50 flex items-center justify-center text-slate-800 shadow-2xs">
                <Lock className="h-6 w-6 text-slate-800" />
              </div>
              <div className="text-left">
                <h4 className="text-[11px] font-black tracking-wider text-slate-900 uppercase">
                  NO CONTRACTS
                </h4>
                <p className="text-[11px] text-slate-400 font-bold leading-normal">
                  No commitments, cancel 1-click.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Conversion Area */}
        <div className="mt-12 flex flex-col items-center justify-center space-y-4 text-center pb-6">
          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Ready to get started?</h4>
          <button
            type="button"
            onClick={() => handleLinkClick('/pages/subscribe')}
            className="px-8 py-4 bg-[#D4AF37] hover:bg-[#bfa032] active:scale-98 transition-all duration-300 text-white font-extrabold uppercase tracking-[0.2em] text-xs rounded-xl shadow-lg shadow-amber-500/10 cursor-pointer flex items-center gap-2"
          >
            Start your subscription
            <ArrowRight className="h-4 w-4 stroke-[2.5]" />
          </button>
          
          {/* Small secure badges */}
          <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400 font-semibold">
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-slate-400" />
              Secure checkout
            </span>
            <span>•</span>
            <span>18+ Age Verified</span>
            <span>•</span>
            <span>Your data is protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ClearanceSaleSectionProps {
  sec: PageSection;
  allProducts: Product[];
  loggedInCustomer: Customer | null;
  onAddToCart: (product: Product, quantity: number) => void;
  onToggleWishlist: (productId: string) => void;
  onNavigate: (tab: string, arg?: string) => void;
}

function ClearanceSaleSection({
  sec,
  allProducts,
  loggedInCustomer,
  onAddToCart,
  onToggleWishlist,
  onNavigate
}: ClearanceSaleSectionProps) {
  const selectedIds = sec.settings.selectedProductIds || [];
  
  const displayedProducts = React.useMemo(() => {
    return allProducts.filter(p => p.status === 'Active' && selectedIds.includes(p.id));
  }, [allProducts, selectedIds]);

  return (
    <div className="space-y-8 px-4 sm:px-6 py-12 max-w-7xl mx-auto">
      {/* Top Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-rose-100 gap-6 animate-fadeIn">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-duration-1000"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">
              Clearance & Final Stock Event
            </span>
          </div>
          <h2 
            className="text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-900"
            style={{ color: sec.settings.headingColor || '#0f172a' }}
          >
            {sec.settings.title || 'Clearance Sale'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl font-medium">
            {sec.settings.description || 'Save big on our premium selected stock items. Final clearance, while stocks last!'}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-bold pt-1">
            <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-150">UP TO 20% OFF</span>
            <span>•</span>
            <span>Pris-match garanti</span>
            <span>•</span>
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Fast UK Shipping</span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-4 w-full md:w-auto shrink-0">
          <button
            onClick={() => onNavigate('frontend-shop')}
            className="bg-red-650 hover:bg-red-700 text-white text-xs font-black py-3 px-6 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-95 text-center w-full sm:w-auto"
          >
            <span className="uppercase tracking-widest text-[10px]">Shop All Collections</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {displayedProducts.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-50 border border-dashed rounded-2xl">
          <p className="text-sm font-bold">No active clearance products found.</p>
          <p className="text-xs mt-1">Configure selected clearance items in the admin page-builder section settings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedProducts.map((prod, pIdx) => {
            const isWishlisted = Boolean(loggedInCustomer?.wishlist && Array.isArray(loggedInCustomer.wishlist) && loggedInCustomer.wishlist.includes(prod.id));
            const clearancePrice = prod.price * 0.8; // 20% clearance discount

            return (
              <div 
                key={`clearance-${prod.id}-${pIdx}`} 
                onClick={() => onNavigate(`/products/${prod.id}`)}
                className="bg-white border-2 border-red-50 hover:border-red-400/80 rounded-2xl overflow-hidden p-4 space-y-4 group transition-all duration-300 relative flex flex-col justify-between cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-100/20"
              >
                {/* Clearance Badge */}
                <span className="absolute top-3.5 left-3.5 text-[8.5px] font-black tracking-wider uppercase py-1 px-2.5 rounded shadow-3xs z-10 bg-red-650 text-white">
                  CLEARANCE DEALS
                </span>

                {/* Wishlist triggers */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWishlist(prod.id);
                  }}
                  className="absolute top-3.5 right-3.5 p-2 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-3xs text-slate-400 hover:text-red-500 hover:scale-105 active:scale-95 transition-all z-10 cursor-pointer"
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? 'text-red-500 fill-red-500' : ''}`} />
                </button>

                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  {/* Image */}
                  <div className="w-full h-56 bg-transparent overflow-hidden relative flex items-center justify-center p-1">
                    <img
                      src={cleanMediaUrl(prod.image) || PLACEHOLDER_IMAGE}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      alt={prod.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    
                    <span className="absolute bottom-2.5 left-2.5 bg-rose-600 text-white text-[8px] font-black tracking-widest uppercase py-0.5 px-2 rounded">
                      20% EXTRA OFF
                    </span>
                  </div>

                  {/* Brand & title */}
                  <div className="text-center space-y-1.5 px-1">
                    <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-red-600 transition-colors uppercase tracking-tight line-clamp-1">
                      {prod.title.toLowerCase().startsWith(prod.vendor.toLowerCase()) ? prod.title : `${prod.vendor} ${prod.title}`}
                    </h4>
                    
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                      <span className="text-red-600 font-extrabold">{prod.strength || '6mg'}</span>
                      <span className="text-slate-300 font-normal">•</span>
                      <span>{prod.tags?.[0] || 'Mint'}</span>
                    </div>
                  </div>
                </div>

                {/* Pricing & Subscription Savings */}
                <div className="space-y-3 pt-3 border-t border-red-50">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-base font-black text-red-650 font-mono">£{clearancePrice.toFixed(2)}</span>
                      <span className="text-xs line-through text-slate-400 font-mono">£{prod.price.toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-emerald-600 font-extrabold mt-0.5">
                      Immediate Stock Dispatch
                    </p>
                  </div>

                  {/* Limited Stock message */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('frontend-shop');
                    }}
                    className="w-full bg-[#FAFAFA] hover:bg-red-50 hover:border-red-200 transition-all border border-slate-100 py-2 px-2.5 rounded-xl flex items-center justify-between text-[9px] text-slate-500 font-bold cursor-pointer font-sans"
                  >
                    <span className="text-emerald-700 font-bold">In Stock</span>
                    <span className="text-slate-700 underline flex items-center gap-0.5 hover:text-red-600 font-extrabold">Final Sale →</span>
                  </div>

                  {/* Buy Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(prod, 1);
                    }}
                    className="w-full bg-red-650 hover:bg-red-700 text-white text-[11px] font-black py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-300 uppercase tracking-widest shadow-sm active:scale-97"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>CLAIM DEAL</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface FeaturedCollectionSectionProps {
  sec: PageSection;
  allProducts: Product[];
  allCollections: Collection[];
  loggedInCustomer: Customer | null;
  onAddToCart: (product: Product, quantity: number) => void;
  onToggleWishlist: (productId: string) => void;
  onNavigate: (tab: string, arg?: string) => void;
}

function FeaturedCollectionSection({
  sec,
  allProducts,
  allCollections,
  loggedInCustomer,
  onAddToCart,
  onToggleWishlist,
  onNavigate
}: FeaturedCollectionSectionProps) {
  const [activeTab, setActiveTab] = useState<'All' | 'Mint' | 'Berry' | 'Citrus' | 'Strong' | 'New Arrivals' | 'Bestsellers'>('All');

  const targetCollectionId = sec.settings.selectedCollectionId;
  const selectedColl = React.useMemo(() => {
    return targetCollectionId ? allCollections.find(c => c.id === targetCollectionId) : null;
  }, [targetCollectionId, allCollections]);

  // Filter products by collection and active tab
  const filteredProducts = React.useMemo(() => {
    // First, filter by collection
    let list = allProducts.filter(p => p.status === 'Active');
    if (targetCollectionId && selectedColl) {
      list = list.filter(p => (selectedColl.productIds || []).includes(p.id));
    }

    // Now, filter by active tab
    if (activeTab === 'Mint') {
      list = list.filter(p => {
        const titleL = p.title.toLowerCase();
        const descL = (p.description || '').toLowerCase();
        const tags = (p.tags || []).map(t => t.toLowerCase());
        return titleL.includes('mint') || titleL.includes('cool') || titleL.includes('ice') || titleL.includes('peppermint') || titleL.includes('freeze') || descL.includes('mint') || tags.includes('mint') || tags.includes('ice');
      });
    } else if (activeTab === 'Berry') {
      list = list.filter(p => {
        const titleL = p.title.toLowerCase();
        const descL = (p.description || '').toLowerCase();
        const tags = (p.tags || []).map(t => t.toLowerCase());
        return titleL.includes('berry') || titleL.includes('cola') || titleL.includes('strawberry') || titleL.includes('fumi') || titleL.includes('pablo') || titleL.includes('cherry') || titleL.includes('grape') || descL.includes('berry') || tags.includes('berry');
      });
    } else if (activeTab === 'Citrus') {
      list = list.filter(p => {
        const titleL = p.title.toLowerCase();
        const descL = (p.description || '').toLowerCase();
        const tags = (p.tags || []).map(t => t.toLowerCase());
        return titleL.includes('citrus') || titleL.includes('lime') || titleL.includes('lemon') || titleL.includes('orange') || titleL.includes('tangerine') || titleL.includes('grapefruit') || descL.includes('citrus') || tags.includes('citrus');
      });
    } else if (activeTab === 'Strong') {
      list = list.filter(p => {
        const strengthVal = parseFloat(p.strength || '0');
        const isStrongTag = (p.tags || []).some(t => t.toLowerCase().includes('strong'));
        const titleL = p.title.toLowerCase();
        return strengthVal >= 10 || isStrongTag || titleL.includes('strong') || titleL.includes('extra strong') || titleL.includes('pablo');
      });
    } else if (activeTab === 'New Arrivals') {
      list = list.filter(p => {
        const tags = (p.tags || []).map(t => t.toLowerCase());
        return tags.includes('new') || tags.includes('latest') || p.vendor === 'VELO' || p.vendor === 'FUMI';
      });
    } else if (activeTab === 'Bestsellers') {
      list = list.filter(p => {
        const tags = (p.tags || []).map(t => t.toLowerCase());
        return tags.includes('bestseller') || tags.includes('best') || p.vendor === 'ZYN' || p.vendor === 'VELO' || p.title.toLowerCase().includes('peppermint') || p.title.toLowerCase().includes('cool mint');
      });
    }

    return list;
  }, [activeTab, allProducts, allCollections, sec.settings.selectedCollectionId]);

  // Limit items as specified in section settings, default to 4 (as in screenshot)
  const itemsCount = sec.settings.itemsCount || 4;
  const displayedProducts = filteredProducts.slice(0, itemsCount);

  // Helper to determine the badge for a product card to match the high-fidelity screenshot
  const getProductBadge = (p: Product) => {
    const titleL = p.title.toLowerCase();
    const vendorL = p.vendor.toLowerCase();
    if (titleL.includes('peppermint') || vendorL.includes('velo')) {
      return { text: 'BESTSELLER', bg: 'bg-amber-400 text-slate-950 font-black' };
    }
    if (titleL.includes('berry') || vendorL.includes('fumi')) {
      return { text: 'NEW', bg: 'bg-emerald-500 text-white font-black' };
    }
    if (vendorL.includes('zyn')) {
      return { text: 'OFFICIAL', bg: 'bg-slate-900 text-white font-black' };
    }
    if (vendorL.includes('pablo') || titleL.includes('cola')) {
      return { text: 'TRENDING ↗', bg: 'bg-amber-500 text-white font-black' };
    }
    return null;
  };

  return (
    <div className="space-y-8 px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      {/* Top Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-150 gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b]">
              NOT READY TO SUBSCRIBE?
            </span>
          </div>
          <h2 
            className="text-3xl md:text-4xl font-black uppercase tracking-tight text-[#0F172A]"
            style={{ color: sec.settings.headingColor || '#0f172a' }}
          >
            {sec.settings.title || (selectedColl ? selectedColl.title : 'Try Before You Subscribe')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl font-medium">
            {sec.settings.description || (selectedColl && selectedColl.description ? selectedColl.description : 'Find your favourite flavours before committing to a plan.')}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-bold pt-1">
            <span>Fast UK delivery</span>
            <span>•</span>
            <span>No commitment</span>
            <span>•</span>
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">18+ only</span>
          </div>
        </div>
        
        {/* Trust Badges and Browse All Brands button */}
        <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-4 w-full md:w-auto shrink-0">
          <button
            onClick={() => onNavigate('/pages/brands')}
            className="bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-black py-3 px-6 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-95 text-center w-full sm:w-auto"
          >
            <span className="uppercase tracking-widest text-[10px]">Browse All Brands</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          {/* Mini Trust indicators row */}
          <div className="flex flex-wrap items-center gap-4 text-[9.5px] text-slate-500 font-bold">
            <div className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-405" />
              <span>100% Authentic <span className="text-slate-400 font-medium">Official suppliers</span></span>
            </div>
            <div className="flex items-center gap-1">
              <Truck className="h-3.5 w-3.5 text-slate-405" />
              <span>UK Tracked Delivery <span className="text-slate-400 font-medium">1-2 working days</span></span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>Trusted <span className="text-slate-400 font-medium">by 1,000+ UK customers</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Tabs row matching the screenshot */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none py-2 px-1 border-b border-slate-100">
        {[
          { id: 'All', label: 'All Products', icon: null },
          { id: 'Mint', label: 'Mint', icon: Snowflake },
          { id: 'Berry', label: 'Berry', icon: Heart },
          { id: 'Citrus', label: 'Citrus', icon: Sparkles },
          { id: 'Strong', label: 'Strong', icon: Zap },
          { id: 'New Arrivals', label: 'New Arrivals', icon: Sparkles },
          { id: 'Bestsellers', label: 'Bestsellers', icon: Crown }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 py-2 px-4 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none ${
                isActive 
                  ? 'bg-[#0F172A] text-white shadow-sm' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {Icon && <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Products Grid with Hover Animations and Larger Images */}
      {displayedProducts.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-50 border border-dashed rounded-2xl">
          <p className="text-sm font-bold">No active products found matching the filter.</p>
          <p className="text-xs mt-1">Please try choosing another category tab above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedProducts.map((prod, pIdx) => {
            const isWishlisted = Boolean(loggedInCustomer?.wishlist && Array.isArray(loggedInCustomer.wishlist) && loggedInCustomer.wishlist.includes(prod.id));
            const badge = getProductBadge(prod);

            return (
              <div 
                key={`feat-${prod.id}-${pIdx}`} 
                onClick={() => onNavigate(`/products/${prod.id}`)}
                className="bg-white border border-slate-200/85 rounded-2xl overflow-hidden p-4 space-y-4 group transition-all duration-300 relative flex flex-col justify-between cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:border-amber-400 hover:shadow-amber-100/10"
              >
                {/* Badge (Best Seller, New, etc.) */}
                {badge && (
                  <span className={`absolute top-3.5 left-3.5 text-[8.5px] font-black tracking-wider uppercase py-1 px-2.5 rounded shadow-3xs z-10 ${badge.bg}`}>
                    {badge.text}
                  </span>
                )}

                {/* Wishlist triggers */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWishlist(prod.id);
                  }}
                  className="absolute top-3.5 right-3.5 p-2 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-3xs text-slate-400 hover:text-red-500 hover:scale-105 active:scale-95 transition-all z-10 cursor-pointer"
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? 'text-red-500 fill-red-500' : ''}`} />
                </button>

                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  {/* Image takes 55%+ of height, dominates card */}
                  <div className="w-full h-56 bg-transparent overflow-hidden relative flex items-center justify-center p-1">
                    <img
                      src={cleanMediaUrl(prod.image) || PLACEHOLDER_IMAGE}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      alt={prod.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    
                    {prod.compareAtPrice > prod.price && (
                      <span className="absolute bottom-2.5 left-2.5 bg-rose-600 text-white text-[8px] font-black tracking-widest uppercase py-0.5 px-2 rounded">
                        SALE DISCOUNT
                      </span>
                    )}
                  </div>

                  {/* Reduced Visual Clutter (Flavour & Strength tags only) */}
                  <div className="text-center space-y-1.5 px-1">
                    <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight line-clamp-1">
                      {prod.title.toLowerCase().startsWith(prod.vendor.toLowerCase()) ? prod.title : `${prod.vendor} ${prod.title}`}
                    </h4>
                    
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                      <span className="text-indigo-600 font-extrabold">{prod.strength || '6mg'}</span>
                      <span className="text-slate-300 font-normal">•</span>
                      <span>{prod.tags?.[0] || 'Mint'}</span>
                    </div>
                  </div>
                </div>

                {/* Pricing & Subscription Savings */}
                <div className="space-y-3 pt-3 border-t border-slate-55">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-base font-black text-slate-900 font-mono">£{prod.price.toFixed(2)}</span>
                      <span className="text-[9.5px] text-slate-400 font-semibold uppercase">each</span>
                    </div>
                    {/* Subscription nudge right under price */}
                    <p className="text-[10px] text-[#D4AF37] font-extrabold mt-0.5">
                      Subscribers from <span className="font-mono">£3.80</span>
                    </p>
                  </div>

                  {/* Save more with Subscription gentle badge and link */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('frontend-subscribe');
                    }}
                    className="w-full bg-[#FAFAFA] hover:bg-amber-50 hover:border-amber-200 transition-all border border-slate-100 py-2 px-2.5 rounded-xl flex items-center justify-between text-[9px] text-slate-500 font-bold cursor-pointer font-sans"
                  >
                    <span className="text-[#B45309]">Save up to 20% with Sub</span>
                    <span className="text-slate-700 underline flex items-center gap-0.5 hover:text-indigo-600 font-extrabold">Compare Plans →</span>
                  </div>

                  {/* Dynamic checkout/basket button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(prod, 1);
                    }}
                    className="w-full bg-[#0F172A] hover:bg-indigo-600 text-white text-[11px] font-black py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-300 uppercase tracking-widest shadow-sm active:scale-97"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>Add to Basket</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Want the best value transition row bar */}
      <div className="w-full bg-slate-50/80 rounded-2xl p-6 border border-slate-150 flex flex-col md:flex-row items-center justify-between gap-6 mt-8 shadow-3xs">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          {/* Overlapping circular tins for high fidelity design */}
          <div className="relative w-24 h-16 shrink-0 flex items-center justify-center select-none">
            <div className="absolute left-0 w-11 h-11 rounded-full bg-indigo-50 border border-indigo-200 shadow-md flex items-center justify-center overflow-hidden transform rotate-[-12deg]">
              <img src={PLACEHOLDER_IMAGE} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
            </div>
            <div className="absolute left-6 w-11 h-11 rounded-full bg-emerald-50 border border-emerald-200 shadow-md flex items-center justify-center overflow-hidden transform rotate-[8deg] z-10">
              <img src={PLACEHOLDER_IMAGE} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
            </div>
            {/* Save 20% golden badge */}
            <div className="absolute -right-2 -top-1 w-10 h-10 rounded-full bg-amber-400 border border-white text-slate-950 font-black text-[7.5px] leading-tight flex flex-col items-center justify-center shadow-md transform rotate-[15deg] z-20">
              <span>Save</span>
              <span>20%</span>
            </div>
          </div>
          
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Want the best value?</h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-medium">
              Subscribe and save up to <span className="font-bold text-slate-800">£55/month</span>. Never run out. Cancel anytime.
            </p>
          </div>
        </div>
        
        {/* Value badges and View Plans Action Button */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-slate-500 text-[10px] font-extrabold">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Free Delivery</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Change Anytime</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Loyalty Rewards</span>
          </div>
          
          <button
            onClick={() => onNavigate('frontend-subscribe')}
            className="bg-amber-500 hover:bg-amber-600 hover:scale-[1.01] active:scale-95 text-white font-black text-xs py-2.5 px-5 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1 ml-2 uppercase tracking-wider"
          >
            <span>View Plans</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface PageRendererProps {
  page: CustomPage;
  allProducts: Product[];
  allCollections: Collection[];
  loggedInCustomer: Customer | null;
  onAddToCart: (product: Product, qty: number) => void;
  onToggleWishlist: (productId: string) => void;
  onNavigate: (tab: string, arg?: string) => void; // for shop, subscribe etc.
  allBlogs?: BlogPost[];
}

interface ContactFormSectionProps {
  sec: PageSection;
}

function ContactFormSection({ sec }: ContactFormSectionProps) {
  const { executeRecaptcha } = useRecaptcha();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successNote, setSuccessNote] = useState('');

  const title = sec.settings?.title || 'Get in Touch with Our Team';
  const description = sec.settings?.description || 'Have questions about your order, shipping, or nicotine pouch brands? Fill out the form below or reach us directly. Our customer support team responds within 24 hours.';
  const headingColor = sec.settings?.headingColor || '#0F172A';
  const textColor = sec.settings?.textColor || '#475569';
  const backgroundColor = sec.settings?.backgroundColor || '#FFFFFF';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus('error');
      setErrorMessage('Please fill in all required fields (Name, Email, Message).');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');
    setSuccessNote('');

    try {
      const recaptchaToken = await executeRecaptcha('contact_form_submit');
      const res = await fetch('/api/email/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, recaptchaToken })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setSuccessNote(data.message || 'Thank you for reaching out! A confirmation email has been logged and our customer care team will get back to you shortly.');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to submit form. Please try again.');
      }
    } catch (err: any) {
      console.error('[ContactForm] Error submitting:', err);
      setStatus('error');
      setErrorMessage('Network error while sending message. Please check your connection.');
    }
  };

  return (
    <div className="py-12 md:py-16 w-full" style={{ backgroundColor }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column - Contact Information */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Mail className="h-3 w-3" /> Customer Support
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight" style={{ color: headingColor }}>
                {title}
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: textColor }}>
                {description}
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="p-2.5 rounded-xl bg-white text-indigo-600 shadow-xs border border-slate-100">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Direct Email Desk</p>
                  <a href="mailto:support@pouch-supply.com" className="text-xs sm:text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                    support@pouch-supply.com
                  </a>
                  <p className="text-[10px] text-slate-400 mt-0.5">Average response time: &lt; 2 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="p-2.5 rounded-xl bg-white text-emerald-600 shadow-xs border border-slate-100">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Phone & WhatsApp Hotline</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900">+44 20 7946 0912</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Mon - Fri: 9:00 AM - 6:00 PM GMT</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="p-2.5 rounded-xl bg-white text-amber-600 shadow-xs border border-slate-100">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Dispatch Depot & HQ</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900">42 Baker Street, Marylebone</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">London, NW1 6XE, United Kingdom</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            {status === 'success' ? (
              <div className="py-12 text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                  <Check className="h-8 w-8 stroke-[3]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Message Received!</h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    {successNote || 'Thank you for reaching out. A confirmation email has been logged and our customer care team will get back to you shortly.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-6 rounded-xl transition cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3">
                  Send Us a Direct Inquiry
                </h3>

                {status === 'error' && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 font-medium">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{errorMessage || 'Failed to submit form.'}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Mercer"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. alex@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +44 7700 900077"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                      Inquiry Subject
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition cursor-pointer"
                    >
                      <option value="">Select Inquiry Topic...</option>
                      <option value="Order Tracking & Shipping">Order Tracking & Shipping</option>
                      <option value="Product & Brand Advice">Product & Brand Advice</option>
                      <option value="Subscription & Recurring Delivery">Subscription & Recurring Delivery</option>
                      <option value="Age Verification Query">Age Verification Query</option>
                      <option value="Wholesale & Bulk Orders">Wholesale & Bulk Orders</option>
                      <option value="General Support">General Support</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                    Your Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us how we can help you with your order, product questions, or account..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full bg-[#0F172A] hover:bg-slate-800 disabled:bg-slate-400 text-white font-black text-xs uppercase tracking-widest py-3.5 px-6 rounded-xl transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  {status === 'submitting' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Inquiry</span>
                    </>
                  )}
                </button>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[10px] text-slate-400 font-medium border-t border-slate-100">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    Protected by Google reCAPTCHA v3
                  </span>
                  <div className="flex gap-2 text-slate-400">
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Privacy
                    </a>
                    <span>•</span>
                    <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Terms
                    </a>
                  </div>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function PageRenderer({
  page,
  allProducts,
  allCollections,
  loggedInCustomer,
  onAddToCart,
  onToggleWishlist,
  onNavigate,
  allBlogs = []
}: PageRendererProps) {
  // Safe state for keeping track of active FAQs
  const [openFaqIdx, setOpenFaqIdx] = useState<string | null>(null);

  if (!page) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <p className="text-slate-400 text-sm italic">Page content unavailable.</p>
      </div>
    );
  }

  // Safe parsing of custom links or routes
  const handleLinkClick = (link?: string) => {
    if (!link) return;
    const trimmed = link.trim();
    if (!trimmed) return;

    // External URL handling
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      window.open(trimmed, '_blank', 'noopener,noreferrer');
      return;
    }

    // Direct tab / route matches
    if (trimmed === 'frontend-home' || trimmed === '/' || trimmed === '/home' || trimmed === 'home') {
      onNavigate('frontend-home');
      return;
    }
    if (trimmed === 'frontend-shop' || trimmed === '/shop' || trimmed === '/collections/all') {
      onNavigate('frontend-shop');
      return;
    }
    if (trimmed.includes('subscribe')) {
      const targetSub = trimmed.startsWith('/') ? trimmed : (trimmed.startsWith('pages/') ? `/${trimmed}` : `/pages/${trimmed}`);
      onNavigate('frontend-subscribe', targetSub);
      return;
    }
    if (trimmed === 'frontend-brands' || trimmed === '/brands' || trimmed === '/pages/brands') {
      onNavigate('frontend-brands');
      return;
    }
    if (trimmed === 'frontend-account' || trimmed === '/account' || trimmed === '/pages/account') {
      onNavigate('frontend-account');
      return;
    }
    if (trimmed === 'frontend-checkout' || trimmed === '/checkout' || trimmed === '/pages/checkout') {
      onNavigate('frontend-checkout');
      return;
    }
    if (trimmed === 'blogs' || trimmed === '/blogs') {
      onNavigate('blogs');
      return;
    }

    // Product routes
    if (trimmed.startsWith('/products/') || trimmed.startsWith('product-')) {
      const prodIdOrSlug = trimmed.replace('/products/', '').replace('product-', '');
      onNavigate('product-detail', prodIdOrSlug);
      return;
    }

    // Collection routes
    if (trimmed.startsWith('/collections/') || trimmed.startsWith('collection-')) {
      const colIdOrSlug = trimmed.replace('/collections/', '').replace('collection-', '');
      onNavigate('collection-detail', colIdOrSlug);
      return;
    }

    // Blog routes
    if (trimmed.startsWith('/blogs/')) {
      const blogSlug = trimmed.replace('/blogs/', '');
      onNavigate('blog-detail', blogSlug);
      return;
    }

    // Page routes
    if (trimmed.startsWith('/pages/') || trimmed.startsWith('page-')) {
      const slug = trimmed.replace('/pages/', '').replace('page-', '');
      onNavigate(slug);
      return;
    }

    // Custom slug or tab fallback
    onNavigate(trimmed);
  };

  const toggleFaq = (secId: string, idx: number) => {
    const key = `${secId}-${idx}`;
    setOpenFaqIdx(openFaqIdx === key ? null : key);
  };

  return (
    <div className="space-y-0 pb-24 font-sans">
      {page.sections && page.sections.length > 0 ? (
        page.sections.map((sec, idx) => {
          const sectionClassName = (sec.type || (sec as any).name || 'section')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

          const sStyle = {
            backgroundColor: sec.settings.backgroundColor || '#FFFFFF',
            color: sec.settings.textColor || '#475569'
          };
          
          const isFullBleed = (sec.type === 'Slideshow' || sec.type === 'Image banner' || sec.type === 'Marquee text' || sec.type === 'Video banner') && sec.settings.fullWidth;
          
          const hasCustomPadding = sec.settings.paddingTop !== undefined || sec.settings.paddingBottom !== undefined;
          const paddingClass = isFullBleed ? 'py-0' : (hasCustomPadding ? '' : 'py-3 sm:py-4 md:py-5');
          const containerClass = sec.settings.fullWidth ? 'w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

          const customStyles = `
            #sec-${sec.id} {
              ${sec.settings.paddingTop !== undefined ? `padding-top: ${sec.settings.paddingTop}px !important;` : ''}
              ${sec.settings.paddingBottom !== undefined ? `padding-bottom: ${sec.settings.paddingBottom}px !important;` : ''}
              ${sec.settings.paddingSide !== undefined ? `padding-left: ${sec.settings.paddingSide}px !important; padding-right: ${sec.settings.paddingSide}px !important;` : ''}
              ${sec.settings.alignment ? `text-align: ${sec.settings.alignment} !important;` : ''}
            }
            #sec-${sec.id} h1, #sec-${sec.id} h2, #sec-${sec.id} .section-title, #sec-${sec.id} h3:not(.brand-card-title):not(.card-title):not(.overlay-heading), #sec-${sec.id} h4:not(.brand-card-title):not(.card-title):not(.overlay-heading) {
              ${sec.settings.titleFontSize ? `font-size: ${sec.settings.titleFontSize}px !important;` : ''}
              ${sec.settings.headingColor ? `color: ${sec.settings.headingColor} !important;` : ''}
              ${sec.settings.alignment ? `text-align: ${sec.settings.alignment} !important;` : ''}
            }
            #sec-${sec.id} p, #sec-${sec.id} .section-desc, #sec-${sec.id} li {
              ${sec.settings.bodyFontSize ? `font-size: ${sec.settings.bodyFontSize}px !important;` : ''}
              ${sec.settings.textColor ? `color: ${sec.settings.textColor} !important;` : ''}
              ${sec.settings.alignment ? `text-align: ${sec.settings.alignment} !important;` : ''}
            }
            #sec-${sec.id} button, #sec-${sec.id} .section-btn {
              ${sec.settings.buttonBgColor ? `background-color: ${sec.settings.buttonBgColor} !important;` : ''}
              ${sec.settings.buttonTextColor ? `color: ${sec.settings.buttonTextColor} !important;` : ''}
            }
            #sec-${sec.id} .subheading, #sec-${sec.id} .section-subheading, #sec-${sec.id} .subtitle {
              ${sec.settings.subheadingColor ? `color: ${sec.settings.subheadingColor} !important;` : ''}
            }
            #sec-${sec.id} .card-title, #sec-${sec.id} .card-heading, #sec-${sec.id} .brand-card-title, #sec-${sec.id} .overlay-heading {
              ${(sec.settings.overlayHeadingColor || sec.settings.cardTitleColor) ? `color: ${sec.settings.overlayHeadingColor || sec.settings.cardTitleColor} !important;` : (sec.type === 'Brand list' ? 'color: #FFFFFF !important;' : '')}
            }
            #sec-${sec.id} .card-desc, #sec-${sec.id} .card-text {
              ${sec.settings.cardTextColor ? `color: ${sec.settings.cardTextColor} !important;` : ''}
            }
            #sec-${sec.id} .card-bg, #sec-${sec.id} .card-box {
              ${sec.settings.cardBgColor ? `background-color: ${sec.settings.cardBgColor} !important;` : ''}
            }
            #sec-${sec.id} .badge-text, #sec-${sec.id} .badge-tag {
              ${sec.settings.badgeTextColor ? `color: ${sec.settings.badgeTextColor} !important;` : ''}
            }
            #sec-${sec.id} .badge-bg {
              ${sec.settings.badgeBgColor ? `background-color: ${sec.settings.badgeBgColor} !important;` : ''}
            }
            #sec-${sec.id} .accent-text, #sec-${sec.id} .accent-icon {
              ${sec.settings.accentColor ? `color: ${sec.settings.accentColor} !important;` : ''}
            }
            #sec-${sec.id} .custom-border {
              ${sec.settings.borderColor ? `border-color: ${sec.settings.borderColor} !important;` : ''}
            }
            #sec-${sec.id} button {
              ${sec.settings.buttonRoundness === 'rounded-none' ? 'border-radius: 0px !important;' : ''}
              ${sec.settings.buttonRoundness === 'rounded' ? 'border-radius: 4px !important;' : ''}
              ${sec.settings.buttonRoundness === 'rounded-lg' ? 'border-radius: 8px !important;' : ''}
              ${sec.settings.buttonRoundness === 'rounded-xl' ? 'border-radius: 12px !important;' : ''}
              ${sec.settings.buttonRoundness === 'rounded-full' ? 'border-radius: 9999px !important;' : ''}
            }
          `;

          return (
            <section
              id={`sec-${sec.id}`}
              key={sec.id || idx}
              style={sStyle}
              className={`${sectionClassName} ${paddingClass} relative transition-all duration-300 w-full overflow-hidden`}
            >
              <style dangerouslySetInnerHTML={{ __html: customStyles }} />
              <div className={containerClass}>
                
                {/* 1. IMAGE BANNER */}
                {sec.type === 'Image banner' && (
                  sec.settings.fullWidth ? (
                    /* High-fidelity full-width image banner (Hero style with real-time text overlay protection) */
                    <div className="relative w-full min-h-[380px] sm:min-h-[480px] md:min-h-[560px] flex items-center overflow-hidden">
                      {/* Background Image & Overlay */}
                      <div className="absolute inset-0 z-0">
                        <img
                          src={cleanMediaUrl(sec.settings.imageUrl) || PLACEHOLDER_IMAGE}
                          alt={sec.settings.title || 'Brand Banner'}
                          className="w-full h-full object-cover origin-center scale-100 hover:scale-102 transition-transform duration-10000"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        {/* Dual protectant layer */}
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-transparent sm:block hidden" />
                        <div className="absolute inset-0 bg-slate-950/80 sm:hidden" />
                      </div>

                      {/* Content block aligned */}
                      <div className="max-w-7xl mx-auto w-full px-6 sm:px-12 md:px-16 relative z-10 text-white">
                        <div className="max-w-2xl space-y-4 sm:space-y-6">
                          <div className="inline-flex items-center gap-1.5 bg-indigo-600/90 text-white font-extrabold uppercase tracking-widest text-[8px] sm:text-[9px] py-1 px-3 rounded-full border border-indigo-400/30">
                            <Sparkles className="h-3 w-3 text-amber-300 animate-spin" />
                            <span>Exclusive Pouch Launch</span>
                          </div>

                          {sec.settings.title && (
                            <h1 
                              className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight leading-none text-white drop-shadow-md"
                            >
                              {sec.settings.title}
                            </h1>
                          )}

                          {sec.settings.description && (
                            <p 
                              className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg drop-shadow-xs"
                            >
                              {sec.settings.description}
                            </p>
                          )}

                          {sec.settings.buttonText && (
                            <div className="pt-2">
                              <button
                                onClick={() => handleLinkClick(sec.settings.buttonLink)}
                                className="bg-white hover:bg-slate-100 text-slate-950 font-black text-[10px] sm:text-xs py-3.5 px-8 rounded-xl shadow-lg transition-all duration-300 cursor-pointer flex items-center gap-2 uppercase tracking-widest group"
                              >
                                <span>{sec.settings.buttonText}</span>
                                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* High-fidelity boxed image banner (Side-by-side luxurious design with crisp margins) */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center p-6 sm:p-10 md:p-16">
                      <div className="space-y-6">
                        <div className="inline-flex items-center gap-1.5 text-indigo-600 font-extrabold uppercase tracking-widest text-[9px] bg-indigo-50 py-1 px-3 rounded-full">
                          <Award className="h-3 w-3" />
                          <span>Guaranteed Freshness</span>
                        </div>

                        {sec.settings.title && (
                          <h1 
                            className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-tight"
                            style={{ color: sec.settings.headingColor || '#0F172A' }}
                          >
                            {sec.settings.title}
                          </h1>
                        )}

                        {sec.settings.description && (
                          <p className="text-sm leading-relaxed opacity-90 text-slate-600">
                            {sec.settings.description}
                          </p>
                        )}

                        {sec.settings.buttonText && (
                          <div className="pt-2">
                            <button
                              onClick={() => handleLinkClick(sec.settings.buttonLink)}
                              className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs py-3.5 px-8 rounded-xl transition-all shadow-md inline-flex items-center gap-2 cursor-pointer uppercase tracking-widest group"
                            >
                              <span>{sec.settings.buttonText}</span>
                              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="relative group overflow-hidden rounded-2xl border border-slate-200/80 shadow-lg aspect-4/3 md:aspect-square">
                        <img
                          src={cleanMediaUrl(sec.settings.imageUrl) || PLACEHOLDER_IMAGE}
                          alt={sec.settings.title || 'Banner Media'}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                      </div>
                    </div>
                  )
                )}

                {/* 2. VIDEO BANNER */}
                {sec.type === 'Video banner' && (() => {
                  const extractYouTubeId = (str: string) => {
                    if (!str) return '';
                    const trimmed = str.trim();
                    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed) && !trimmed.toLowerCase().endsWith('.mp4') && !trimmed.toLowerCase().endsWith('.webm')) {
                      return trimmed;
                    }
                    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
                    const match = trimmed.match(regExp);
                    return (match && match[1]) ? match[1] : '';
                  };

                  const rawYouTube = (sec.settings.videoUrl || '').trim();
                  const rawMp4 = (sec.settings.videoMp4Url || '').trim();

                  let ytId = '';
                  let isYouTube = false;
                  let videoSource = '';

                  // Prioritize rawMp4 when provided unless rawMp4 itself is a YouTube link
                  if (rawMp4) {
                    const ytFromMp4 = extractYouTubeId(rawMp4);
                    if (ytFromMp4) {
                      ytId = ytFromMp4;
                      isYouTube = true;
                    } else {
                      videoSource = rawMp4;
                      isYouTube = false;
                    }
                  } else if (rawYouTube) {
                    const ytFromUrl = extractYouTubeId(rawYouTube);
                    if (ytFromUrl) {
                      ytId = ytFromUrl;
                      isYouTube = true;
                    } else {
                      videoSource = rawYouTube;
                      isYouTube = false;
                    }
                  }

                  if (!isYouTube && !videoSource) {
                    videoSource = 'https://assets.mixkit.co/videos/preview/mixkit-laboratory-test-tubes-40436-large.mp4';
                  }

                  const cleanedVideoUrl = cleanMediaUrl(videoSource);
                  const titleInput = sec.settings.title || 'YOUR NICOTINE, ON AUTOPILOT.';
                  const descInput = sec.settings.description || 'Premium nicotine pouch subscriptions. Your favourite brands. Delivered your way.';

                  return (
                    <div className="relative w-full overflow-hidden bg-slate-950 text-white flex flex-col justify-between min-h-[520px] md:min-h-[620px]">
                      
                      {/* Background Auto-Play Video Layer */}
                      <div className="absolute inset-0 z-0 w-full h-full pointer-events-none overflow-hidden">
                        {isYouTube && ytId ? (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] pointer-events-none scale-105">
                            <iframe
                              className="w-full h-full object-cover border-0"
                              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&playlist=${ytId}&loop=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1`}
                              title="Video Banner Background"
                              allow="autoplay; encrypted-media"
                              allowFullScreen
                            />
                          </div>
                        ) : (
                          <video
                            key={cleanedVideoUrl}
                            ref={(vEl) => {
                              if (vEl) {
                                vEl.muted = true;
                                vEl.defaultMuted = true;
                                vEl.play().catch(() => {});
                              }
                            }}
                            className="w-full h-full object-cover opacity-90 scale-105"
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="auto"
                            src={cleanedVideoUrl}
                          />
                        )}
                        
                        {/* High-Contrast Gradient Backdrop Overlay for Readable Text */}
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/65 to-slate-950/30 z-10 pointer-events-none" />
                      </div>

                      {/* Content Overlay */}
                      <div className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center my-auto">
                        
                        {/* Left column text controls & overlay */}
                        <div className="lg:col-span-8 space-y-6 text-left">
                          
                          <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 backdrop-blur-md text-amber-300 text-xs font-bold uppercase tracking-widest">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                              <span>Featured Collection Showcase</span>
                            </div>

                            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-[1.08] text-white drop-shadow-lg">
                              {titleInput}
                            </h2>

                            <p className="text-slate-200 text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl font-medium tracking-wide drop-shadow-md">
                              {descInput}
                            </p>
                          </div>

                          {/* Interactive Action Buttons Overlay */}
                          <div className="flex flex-col sm:flex-row gap-4 pt-2 items-stretch sm:items-center">
                            
                            {/* Primary Button */}
                            <button
                              type="button"
                              onClick={() => handleLinkClick(sec.settings.buttonLink || 'frontend-subscribe')}
                              className="bg-[#dfa047] hover:bg-[#c98e3b] text-white font-extrabold py-4 px-8 rounded-xl transition-all duration-300 flex flex-col items-center justify-center cursor-pointer shadow-xl active:scale-95 group shrink-0"
                            >
                              <span className="text-[13px] font-black tracking-widest uppercase">
                                {sec.settings.buttonText || 'SUBSCRIBE & SAVE'}
                              </span>
                              <span className="text-[10px] text-white/90 font-semibold mt-0.5">Automated hassle-free delivery</span>
                            </button>

                            {/* Secondary Button */}
                            <button
                              type="button"
                              onClick={() => handleLinkClick('frontend-shop')}
                              className="border border-white/40 hover:border-white hover:bg-white/10 text-white font-black tracking-widest text-xs uppercase py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center cursor-pointer active:scale-95 shrink-0 backdrop-blur-xs"
                            >
                              BROWSE ALL PRODUCTS
                            </button>

                          </div>

                          {/* Feature Badges Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-white/15 max-w-2xl">
                            
                            <div className="flex items-center gap-2.5">
                              <span className="p-2 bg-white/10 text-[#dfa047] border border-white/10 rounded-lg shrink-0 backdrop-blur-xs">
                                <Award className="h-4 w-4" />
                              </span>
                              <div>
                                <p className="text-[11px] font-black tracking-wider text-white uppercase">NEVER RUN OUT</p>
                                <p className="text-[10px] text-slate-300 font-medium">Delivered on schedule</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <span className="p-2 bg-white/10 text-[#dfa047] border border-white/10 rounded-lg shrink-0 backdrop-blur-xs">
                                <Package className="h-4 w-4" />
                              </span>
                              <div>
                                <p className="text-[11px] font-black tracking-wider text-white uppercase">DISCREET PACKS</p>
                                <p className="text-[10px] text-slate-300 font-medium">Plain packaging</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
                              <span className="p-2 bg-white/10 text-[#dfa047] border border-white/10 rounded-lg shrink-0 backdrop-blur-xs">
                                <Tag className="h-4 w-4" />
                              </span>
                              <div>
                                <p className="text-[11px] font-black tracking-wider text-white uppercase">BEST PRICES</p>
                                <p className="text-[10px] text-slate-300 font-medium">Up to 30% savings</p>
                              </div>
                            </div>

                          </div>

                        </div>

                        {/* Right column empty spacing */}
                        <div className="hidden lg:block lg:col-span-4 h-full min-h-[200px]" />

                      </div>

                      {/* Gold full-width bar at the bottom of the section */}
                      <div className="w-full bg-[#dfa047] py-4.5 px-4 sm:px-6 z-20 relative border-t border-white/5 shadow-md mt-auto">
                        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 text-white text-center sm:text-left divide-y lg:divide-y-0 lg:divide-x divide-white/15">
                          
                          {/* Item 1 */}
                          <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-center lg:justify-start px-2 py-2 sm:py-0">
                            <Truck className="h-5.5 w-5.5 text-white shrink-0" />
                            <div>
                              <p className="text-[10.5px] sm:text-[11px] font-black tracking-widest uppercase leading-tight">FREE UK DELIVERY</p>
                              <p className="text-[9.5px] sm:text-[10px] text-white/90 font-bold mt-0.5">On orders £40+</p>
                            </div>
                          </div>

                          {/* Item 2 */}
                          <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-center lg:justify-start px-4 py-2 sm:py-0 border-white/15">
                            <Calendar className="h-5.5 w-5.5 text-white shrink-0" />
                            <div>
                              <p className="text-[10.5px] sm:text-[11px] font-black tracking-widest uppercase leading-tight">DELIVERED ON YOUR SCHEDULE</p>
                              <p className="text-[9.5px] sm:text-[10px] text-white/90 font-bold mt-0.5">Weekly, Fortnightly or Monthly</p>
                            </div>
                          </div>

                          {/* Item 3 */}
                          <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-center lg:justify-start px-4 py-2 sm:py-0 border-white/15">
                            <Award className="h-5.5 w-5.5 text-white shrink-0" />
                            <div>
                              <p className="text-[10.5px] sm:text-[11px] font-black tracking-widest uppercase leading-tight">LOYALTY REWARDS</p>
                              <p className="text-[9.5px] sm:text-[10px] text-white/90 font-bold mt-0.5">Earn points & exclusive perks</p>
                            </div>
                          </div>

                          {/* Item 4 */}
                          <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-center lg:justify-start px-4 py-2 sm:py-0 border-white/15">
                            <Lock className="h-5.5 w-5.5 text-white shrink-0" />
                            <div>
                              <p className="text-[10.5px] sm:text-[11px] font-black tracking-widest uppercase leading-tight">100% SECURE CHECKOUT</p>
                              <p className="text-[9.5px] sm:text-[10px] text-white/90 font-bold mt-0.5">Your data is protected</p>
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>
                  );
                })()}

                {/* 3. IMAGE WITH TEXT */}
                {sec.type === 'Image with text' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center px-4 sm:px-6">
                    <div className="order-2 md:order-1 relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-indigo-500 rounded-3xl blur opacity-15 group-hover:opacity-20 transition duration-500" />
                      <div className="relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-50">
                        <img
                          src={cleanMediaUrl(sec.settings.imageUrl) || PLACEHOLDER_IMAGE}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
                          alt=""
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-6 order-1 md:order-2">
                      <div className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 font-extrabold uppercase tracking-widest text-[9px] py-1 px-3 rounded-full">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Premium Standard Guaranteed</span>
                      </div>
                      
                      <h2 
                        className="text-3xl font-black uppercase tracking-tight leading-tight"
                        style={{ color: sec.settings.headingColor || '#000000' }}
                      >
                        {sec.settings.title || 'Curate your package'}
                      </h2>
                      
                      <p className="text-sm opacity-90 leading-relaxed text-slate-600">
                        {sec.settings.description || 'Flexible deliveries straight to your shop or door.'}
                      </p>

                      {sec.settings.buttonText && (
                        <div className="pt-2">
                          <button
                            onClick={() => handleLinkClick(sec.settings.buttonLink)}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 px-6 rounded-xl transition-all shadow-md inline-flex items-center gap-2 cursor-pointer uppercase tracking-widest group"
                          >
                            <span>{sec.settings.buttonText}</span>
                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. TEXT COLUMN WITH IMAGE */}
                {sec.type === 'Text column with image' && (
                  <div className="space-y-12 px-4 sm:px-6">
                    <div className="text-center max-w-2xl mx-auto space-y-3">
                      <span className="text-[10px] tracking-widest font-black uppercase text-indigo-600 bg-indigo-50/90 py-1 px-3.5 rounded-full inline-block">Our Foundations</span>
                      <h2 
                        className="text-3xl font-black uppercase tracking-tight"
                        style={{ color: sec.settings.headingColor || '#000000' }}
                      >
                        {sec.settings.title || 'Laboratory Certified Excellence'}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500">{sec.settings.description || 'Scientifically balanced plant extracts providing rich, uniform strength.'}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                      {[
                        { title: 'Global Certified Lab Testing', desc: 'Every batch is sourced strictly from laboratory test lines adhering to absolute security and clean protocols.', img: PLACEHOLDER_IMAGE, badge: 'LAB VERIFIED' },
                        { title: 'Preservative Free Aroma Boost', desc: 'Crafted using pure food-grade crystalline ingredients, delivering rich natural aromas and smooth fresh locks.', img: PLACEHOLDER_IMAGE, badge: '100% TOBACCO-FREE' },
                        { title: 'Vacuum Sealed Freeze Guard', desc: 'Sealed instantly into high-density polymer canisters ensuring 100% cooling impact remains intact during shipping.', img: PLACEHOLDER_IMAGE, badge: 'FRESHNESS LOCK' }
                      ].map((col, cIdx) => (
                        <div key={cIdx} className="bg-white border border-slate-100 rounded-2xl overflow-hidden p-4 space-y-4 shadow-sm hover:shadow-xl hover:border-slate-300/60 transition-all group flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="relative h-44 w-full rounded-xl overflow-hidden bg-slate-50">
                              <img 
                                src={cleanMediaUrl(col.img)} 
                                className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-300" 
                                alt="" 
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <span className="absolute bottom-2 left-2 bg-slate-900/90 text-white text-[8px] font-bold py-0.5 px-2 rounded tracking-widest">{col.badge}</span>
                            </div>
                            <h4 className="font-extrabold text-slate-800 text-sm">{col.title}</h4>
                            <p className="text-[11px] text-slate-500 leading-relaxed">{col.desc}</p>
                          </div>
                          
                          <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[9px] text-slate-450 font-mono">
                            <span>ISO STANDARDS COMPLIANT</span>
                            <span className="text-emerald-600 font-bold">✓ RECONSTRUCTED</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. RICH TEXT */}
                {sec.type === 'Rich text' && (
                  <div className="text-center max-w-3xl mx-auto space-y-4 py-4 px-4 sm:px-6">
                    <div className="inline-flex items-center gap-1.5 justify-center py-1 px-3 bg-teal-50 border border-teal-100 text-teal-800 rounded-full text-[9px] tracking-widest uppercase font-extrabold">
                      <TrendingUp className="h-3 w-3" />
                      <span>Certified Quality Standard</span>
                    </div>

                    <h2
                      className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-tight"
                      style={{ color: sec.settings.headingColor || '#000000' }}
                    >
                      {sec.settings.title || 'Rich editorial showcase'}
                    </h2>
                    
                    <p className="text-xs sm:text-sm leading-relaxed text-slate-500 max-w-2xl mx-auto">
                      {sec.settings.description || 'Craft premium experiences under your own terms.'}
                    </p>

                    {sec.settings.buttonText && (
                      <div className="pt-4">
                        <button
                          onClick={() => handleLinkClick(sec.settings.buttonLink)}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black py-3.5 px-8 rounded-xl transition-all shadow-md cursor-pointer uppercase tracking-widest"
                        >
                          {sec.settings.buttonText}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. MARQUEE TEXT */}
                {sec.type === 'Marquee text' && (() => {
                  const rawText = sec.settings.title || 'DELIVERY // CANCEL ANYTIME // LOYALTY SCHEME // NEVER RUN OUT // DELIVERED ON YOUR SCHEDULE // SAVE VS. SHOP PRICES // DISCREET DELIVERY';
                  const items = rawText.includes('//') 
                    ? rawText.split('//').map(item => item.trim()).filter(Boolean)
                    : rawText.includes('•')
                    ? rawText.split('•').map(item => item.trim()).filter(Boolean)
                    : [rawText];
                  
                  // Duplicate items multiple times to create an absolute seamless continuous scroll loop
                  const doubledItems = items.length > 0 ? [...items, ...items, ...items, ...items] : [];
                  return (
                    <div 
                      className={`overflow-hidden py-3.5 border-y border-amber-500/10 relative w-full ${sec.settings.fullWidth ? '' : 'rounded-2xl'}`}
                      style={{ backgroundColor: sec.settings.backgroundColor || '#E8BE74' }}
                    >
                      <div className="marquee-container">
                        <div 
                          className="animate-marquee whitespace-nowrap flex gap-8 items-center font-sans font-black uppercase text-[11px] sm:text-xs tracking-wider leading-none"
                          style={{ color: sec.settings.textColor || '#1A1C1D' }}
                        >
                          {doubledItems.map((item, idx) => (
                            <React.Fragment key={idx}>
                              <span className="shrink-0">{item}</span>
                              <span className="text-[13px] opacity-80 shrink-0 select-none">•</span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 7. MARQUEE IMAGES */}
                {sec.type === 'Marquee images' && (
                  <div className="space-y-6 px-4">
                    <div className="flex items-center gap-1.5 justify-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                      <h4 className="text-[10px] font-extrabold text-center uppercase tracking-widest text-slate-400">Fresh Stock Dispatch Reel</h4>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none justify-start sm:justify-center">
                      {allProducts.slice(0, 6).map((prod, pIdx) => (
                        <div key={`reel-${prod.id}-${pIdx}`} className="w-28 shrink-0 bg-white border border-slate-100 p-2 rounded-xl text-center shadow-xs hover:shadow-md transition-shadow group">
                          <div className="h-20 w-20 bg-slate-50 hover:bg-slate-100 rounded-lg overflow-hidden mx-auto flex items-center justify-center transition-all">
                            <img 
                              src={cleanMediaUrl(prod.image) || PLACEHOLDER_IMAGE} 
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform" 
                              alt="" 
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                          <p className="text-[9.5px] font-black truncate text-slate-800 mt-2.5">{prod.title.split(' ')[0]}</p>
                          <p className="text-[8px] font-bold text-slate-400">{prod.vendor}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 8. LOGO LIST */}
                {sec.type === 'Logo list' && (
                  <div className="text-center space-y-8 px-4">
                    <div className="space-y-1">
                      <h3 
                        className="text-xs font-black uppercase tracking-widest text-slate-400 block"
                        style={{ color: sec.settings.headingColor || '#94A3B8' }}
                      >
                        {sec.settings.title || 'OFFICIAL LAB PARTNER REGISTER'}
                      </h3>
                      <p className="text-[10px] text-slate-400">Clinically formulated nicotine lines distributed under licensing agreements</p>
                    </div>

                    <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
                      {['77', 'clew', 'cuba', 'maggie', 'nordic spirit', 'xqs', 'zyn', 'pablo', 'killa', 'fumi', 'velo', 'white fox', 'snu'].map((logo, lIdx) => (
                        <div 
                          key={lIdx} 
                          onClick={() => onNavigate('frontend-brands')}
                          className="bg-white border border-slate-150 rounded-xl px-5 py-3 shadow-xs hover:border-slate-400 hover:shadow-md transition-all cursor-pointer text-xs font-extrabold tracking-wider text-slate-700 flex items-center gap-1.5"
                        >
                          <span className="text-indigo-600">●</span>
                          <span>{logo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                 {/* 9. COLLECTION LIST */}
                 {sec.type === 'Collection list' && (() => {
                   const filteredCollections = sec.settings.selectedCollectionIds && sec.settings.selectedCollectionIds.length > 0
                     ? allCollections.filter(col => sec.settings.selectedCollectionIds!.includes(col.id))
                     : allCollections.slice(0, Math.min(sec.settings.itemsCount || 4, allCollections.length));
 
                   return (
                     <div className="space-y-8 px-4 sm:px-6">
                       <div className="text-center space-y-2">
                         <h3 
                           className="text-xs font-black uppercase tracking-widest text-[#0F172A]"
                           style={{ color: sec.settings.headingColor || '#0F172A' }}
                         >
                           {sec.settings.title || 'EXPLORE BRAND COLLECTIONS'}
                         </h3>
                         {sec.settings.description && (
                           <p className="text-xs text-slate-500 max-w-md mx-auto">{sec.settings.description}</p>
                         )}
                       </div>
 
                       {/* Highly responsive 2-col to 4-col display */}
                       <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                         {filteredCollections.map(col => (
                           <div
                             key={col.id}
                             onClick={() => onNavigate('frontend-shop', col.id)}
                             className="bg-white border border-slate-150 hover:border-slate-400 rounded-2xl p-5 text-center cursor-pointer transition-all hover:shadow-lg group flex flex-col justify-between overflow-hidden"
                           >
                             <div className="h-24 bg-slate-50 group-hover:bg-slate-100 rounded-xl flex items-center justify-center mb-4 transition-colors overflow-hidden relative">
                               {col.image ? (
                                 <img 
                                   src={cleanMediaUrl(col.image)} 
                                   className="h-full w-full object-cover transform group-hover:scale-105 transition-transform" 
                                   alt={col.title}
                                   referrerPolicy="no-referrer"
                                   onError={(e) => {
                                     e.currentTarget.onerror = null;
                                     e.currentTarget.style.display = 'none';
                                   }}
                                 />
                               ) : (
                                 <span className="text-4xl transform group-hover:scale-108 transition-transform">🥫</span>
                               )}
                             </div>
                             <div>
                               <h4 className="font-extrabold text-xs text-slate-800 group-hover:text-indigo-650 transition-colors uppercase tracking-wide truncate">{col.title}</h4>
                               <p className="text-[10px] text-slate-400 mt-1 font-mono">{col.productIds.length} FLAVORS</p>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   );
                 })()}

                {/* 10. FEATURED COLLECTION (Fully Interactive Masterclass Grid) */}
                {sec.type === 'Featured collection' && (
                  <FeaturedCollectionSection 
                    sec={sec}
                    allProducts={allProducts}
                    allCollections={allCollections}
                    loggedInCustomer={loggedInCustomer}
                    onAddToCart={onAddToCart}
                    onToggleWishlist={onToggleWishlist}
                    onNavigate={onNavigate}
                  />
                )}

                {/* 10.5. CLEARANCE SALE (Interactive multi-product grid) */}
                {sec.type === 'Clearance Sale' && (
                  <ClearanceSaleSection 
                    sec={sec}
                    allProducts={allProducts}
                    loggedInCustomer={loggedInCustomer}
                    onAddToCart={onAddToCart}
                    onToggleWishlist={onToggleWishlist}
                    onNavigate={onNavigate}
                  />
                )}

                {false && sec.type === 'Featured collection' && (
                  <div className="space-y-8 px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pb-4 border-b border-slate-200">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Direct From Laboratories</span>
                        </div>
                        <h2 
                          className="text-2xl font-black uppercase tracking-tight text-[#0F172A]"
                          style={{ color: sec.settings.headingColor || '#0f172a' }}
                        >
                          {sec.settings.title || 'FEATURED COLLECTION'}
                        </h2>
                        {sec.settings.description && (
                          <p className="text-xs text-slate-500 max-w-xl">
                            {sec.settings.description}
                          </p>
                        )}
                      </div>
                      
                      <button
                        onClick={() => onNavigate('frontend-shop')}
                        className="text-xs font-black text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer pt-3 sm:pt-0 uppercase tracking-widest flex items-center gap-1.5"
                      >
                        <span>All Categories</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {(() => {
                        const targetCollectionId = sec.settings.selectedCollectionId;
                        const selectedColl = targetCollectionId ? allCollections.find(c => c.id === targetCollectionId) : null;
                        const filtered = allProducts
                          .filter(p => p.status === 'Active')
                          .filter(p => !targetCollectionId || (selectedColl?.productIds && selectedColl.productIds.includes(p.id)));
                        
                        return filtered.slice(0, sec.settings.itemsCount || 4).map((prod, pIdx) => {
                          const isWishlisted = Boolean(loggedInCustomer?.wishlist && Array.isArray(loggedInCustomer.wishlist) && loggedInCustomer.wishlist.includes(prod.id));
                          return (
                            <div 
                              key={`coll-grid-${prod.id}-${pIdx}`} 
                              onClick={() => onNavigate(`/products/${prod.id}`)}
                              className="bg-white border border-slate-150 rounded-2xl overflow-hidden p-4 space-y-4 group hover:shadow-xl hover:border-slate-300 transition-all relative flex flex-col justify-between cursor-pointer"
                            >
                              {/* Wishlist triggers */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleWishlist(prod.id);
                                }}
                                className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm text-slate-400 hover:text-red-500 transition-colors z-10 cursor-pointer"
                              >
                                <Heart className={`h-4 w-4 ${isWishlisted ? 'text-red-500 fill-red-500' : ''}`} />
                              </button>

                              <div className="space-y-3">
                                <div className="h-48 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 relative shadow-inner">
                                  <img
                                    src={prod.image}
                                    className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-500"
                                    alt=""
                                    referrerPolicy="no-referrer"
                                  />
                                  <span className="absolute top-2.5 left-2.5 bg-slate-900 text-white text-[8px] font-black tracking-widest uppercase py-0.5 px-2 rounded-md">
                                    {prod.vendor}
                                  </span>
                                  
                                  {prod.compareAtPrice > prod.price && (
                                    <span className="absolute bottom-2.5 left-2.5 bg-rose-650 text-white text-[8px] font-black tracking-widest uppercase py-0.5 px-2 rounded">
                                      SALE DISCOUNT
                                    </span>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span>Suppled Lab Grade</span>
                                    <span>•</span>
                                    <span>Fresh Locks</span>
                                  </div>
                                  <h4 className="font-extrabold text-xs text-slate-800 truncate uppercase tracking-tight">{prod.title}</h4>
                                  
                                  <div className="flex items-center gap-1 text-amber-500 pb-1">
                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                    <span className="text-[9px] text-slate-400 font-mono ml-1 font-bold">5.0 (48)</span>
                                  </div>

                                  {/* Beautiful medical specification specs list */}
                                  <div className="bg-slate-50/70 py-1.5 px-2 rounded-lg border border-slate-100 space-y-1">
                                    <div className="flex justify-between text-[8px] text-slate-450 font-bold uppercase font-mono">
                                      <span>Strength Aroma</span>
                                      <span className="text-slate-800 font-black">X-Strong Freeze</span>
                                    </div>
                                    <div className="flex justify-between text-[8px] text-slate-450 font-bold uppercase font-mono">
                                      <span>Dispatch Type</span>
                                      <span className="text-indigo-650 font-black">Laboratory Fresh</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2 pt-2 border-t border-slate-50">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wide">Single Tin</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-black text-slate-900 font-mono">£{prod.price.toFixed(2)}</span>
                                    {prod.compareAtPrice > prod.price && (
                                      <span className="text-[9.5px] text-slate-405 line-through font-mono">£{prod.compareAtPrice.toFixed(2)}</span>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={() => onAddToCart(prod, 1)}
                                  className="w-full bg-slate-900 hover:bg-indigo-600 text-white text-[10px] font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors uppercase tracking-widest shadow-xs"
                                >
                                  <ShoppingCart className="h-3.5 w-3.5" />
                                  <span>Add to Cart</span>
                                </button>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* 11. IMAGES GALLERY */}
                {sec.type === 'Images gallery' && (
                  <div className="space-y-8 px-4 sm:px-6">
                    <div className="text-center space-y-2">
                      <span className="text-[10px] tracking-widest font-black uppercase text-indigo-600 bg-indigo-50/90 py-1 px-3.5 rounded-full inline-block">Visual Verification</span>
                      <h3 
                        className="text-center text-2xl font-black uppercase tracking-tight text-[#0F172A]"
                        style={{ color: sec.settings.headingColor || '#0F172A' }}
                      >
                        {sec.settings.title || 'Laboratory & Dispatch Facility Gallery'}
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">Inspected clean-room assembly lines yielding high-density plant-fiber purity.</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                      {[
                        PLACEHOLDER_IMAGE,
                        PLACEHOLDER_IMAGE,
                        PLACEHOLDER_IMAGE,
                        PLACEHOLDER_IMAGE
                      ].map((imgUrl, galIdx) => (
                        <div key={galIdx} className="h-44 rounded-2xl overflow-hidden border border-slate-150 shadow-sm relative group bg-slate-50">
                          <img 
                            src={cleanMediaUrl(imgUrl)} 
                            className="h-full w-full object-cover hover:scale-103 transition-transform duration-500" 
                            alt="" 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-white/90 backdrop-blur-xs text-[9px] font-black uppercase tracking-widest py-1 px-3.5 text-slate-900 rounded-lg shadow-sm">View Facility</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 12. FAQS (Interactive premium Toggles) */}
                {sec.type === 'FAQs' && (() => {
                  const rawList = (sec.settings.faqs && sec.settings.faqs.length > 0) ? sec.settings.faqs
                                : (sec.settings.faqItems && sec.settings.faqItems.length > 0) ? sec.settings.faqItems
                                : null;
                  const faqsToRender = rawList || [
                    { q: 'Is delivery fully tracked?', a: 'Yes, all orders over shipping thresholds generate functional, real-time Royal Mail tracking codes emailed instantly upon fulfillment lines dispatch.' },
                    { q: 'Are these pouches 100% tobacco-free?', a: 'Under all current EU & UK reseller regulations, our catalog consists strictly of plant-fiber pouch variants utilizing medical crystalline formats.' },
                    { q: 'How long do subscriptions repeat?', a: 'Your tailored canister bundles renew automatically at your specific week layouts. Pause, skip custom flavors, or cancel anytime for free in the account dashboard.' },
                    { q: 'Where are the canisters formulated?', a: 'Formulated in certified European laboratories under strict vacuum sterile protocols, ensuring consistent aroma and maximum flavor lock.' }
                  ];

                  const secKey = sec.id ? `faq-${sec.id}` : `faq-sec-${idx}`;

                  return (
                    <div className="max-w-3xl mx-auto space-y-8 px-4 sm:px-6">
                      <div className="text-center space-y-2">
                        <span className="text-[10px] tracking-widest font-black uppercase text-indigo-600 bg-indigo-50/90 py-1 px-3.5 rounded-full inline-block">Answered Live</span>
                        <h2 
                          className="text-3xl font-black uppercase tracking-tight text-[#0F172A]"
                          style={{ color: sec.settings.headingColor || '#0F172A' }}
                        >
                          {sec.settings.title || 'Frequently Asked Questions'}
                        </h2>
                        {sec.settings.description && (
                          <p className="text-xs text-slate-500">{sec.settings.description}</p>
                        )}
                      </div>

                      <div className="space-y-4">
                        {faqsToRender.map((faq: any, fIdx: number) => {
                          const qText = faq.question || faq.q || '';
                          const aText = faq.answer || faq.a || '';
                          const isChosen = openFaqIdx === `${secKey}-${fIdx}`;
                          return (
                            <div 
                              key={fIdx} 
                              className="bg-white border border-slate-150 rounded-2xl p-4.5 sm:p-5 transition-all shadow-xs cursor-pointer hover:border-slate-300"
                              onClick={() => toggleFaq(secKey, fIdx)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-xs sm:text-xs text-slate-800 flex items-center gap-2 pr-4 text-left">
                                  <span className={isChosen ? 'text-indigo-600 font-black' : 'text-slate-400 font-bold'}>Q:</span> 
                                  <span>{qText}</span>
                                </span>
                                <div className="shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-extrabold text-sm select-none transition-colors">
                                  {isChosen ? '-' : '+'}
                                </div>
                              </div>
                              
                              {/* Smooth accordion expanded logic */}
                              <div className={`transition-all duration-300 overflow-hidden ${isChosen ? 'max-h-96 mt-3 opacity-100 border-t border-slate-50 pt-3' : 'max-h-0 opacity-0'}`}>
                                <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed pl-2 text-left">
                                  {aText}
                                </p>
                                {faq.linkUrl && (
                                  <div className="mt-2.5 pl-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleLinkClick(faq.linkUrl);
                                      }}
                                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
                                    >
                                      <span>More Information</span>
                                      <ExternalLink className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* 13. SLIDESHOW */}
                {sec.type === 'Slideshow' && (
                  <PremiumSlideshow
                    slides={sec.settings.slides}
                    fullWidth={sec.settings.fullWidth}
                    backgroundColor={sec.settings.backgroundColor}
                    headingColor={sec.settings.headingColor}
                    textColor={sec.settings.textColor}
                    onLinkClick={handleLinkClick}
                  />
                )}

                {/* 14. BLOG POST */}
                {sec.type === 'Blog post' && (() => {
                  const desktopCols = sec.settings.columnsDesktop || 3;
                  const mobileCols = sec.settings.columnsMobile || 1;
                  const desktopColsClass = desktopCols === 1 ? 'lg:grid-cols-1' : desktopCols === 2 ? 'lg:grid-cols-2' : desktopCols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4';
                  const mobileColsClass = mobileCols === 1 ? 'grid-cols-1' : 'grid-cols-2';

                  // retrieve active articles or fallbacks
                  const activeBlogs = allBlogs && allBlogs.length > 0
                    ? allBlogs.filter(b => b.status === 'Active')
                    : [];

                  const displayBlogs = activeBlogs.length > 0 
                    ? activeBlogs 
                    : [
                        { id: '1', title: 'Swedish Pouch Manufacturing Regulations', category: 'Standards', date: 'June 19, 2026', image: PLACEHOLDER_IMAGE, excerpt: 'Behind the clinical clean rooms compounding sterile medical fiber pouches under modern Scandinavian compliance.', author: 'Dr. Anders' },
                        { id: '2', title: 'Why Sterile Medical Fiber is Better', category: 'Science', date: 'June 18, 2026', image: PLACEHOLDER_IMAGE, excerpt: 'Traditional pouches use coarse paper. Our laboratory leverages vacuum plant cellulose fibers for smooth flavor dispersion.', author: 'Sara Storm' },
                        { id: '3', title: 'Understanding Nicotine Salt Deliveries', category: 'Formulas', date: 'June 17, 2026', image: PLACEHOLDER_IMAGE, excerpt: 'An in-depth breakdown of molecular compounding and how sub-zero cooling agents trigger persistent fresh releases.', author: 'Nils Vance' }
                      ];

                  return (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 py-4">
                      <div className="text-center space-y-2">
                        <span className="text-[10px] tracking-widest font-black uppercase text-white bg-indigo-600/90 py-1 px-3.5 rounded-full inline-block">Pouch Journal</span>
                        <h2 
                          className="text-3xl font-black uppercase tracking-tight text-slate-900"
                          style={{ color: sec.settings.headingColor || '#0F172A' }}
                        >
                          {sec.settings.title || 'Latest From Our Journal'}
                        </h2>
                        {sec.settings.description && (
                          <p className="text-xs text-slate-500 max-w-2xl mx-auto leading-relaxed">{sec.settings.description}</p>
                        )}
                      </div>

                      <div className={`grid ${mobileColsClass} sm:grid-cols-2 ${desktopColsClass} gap-6`}>
                        {displayBlogs.map((b, idx) => (
                          <article 
                            key={b.id || idx}
                            onClick={() => b.slug ? onNavigate('blog-detail', b.slug) : onNavigate('blogs')}
                            className="group bg-white rounded-2xl overflow-hidden border border-slate-150 p-2 hover:border-slate-350 cursor-pointer transition-all flex flex-col h-full"
                          >
                            <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-50 relative">
                              <img 
                                src={cleanMediaUrl(b.image) || PLACEHOLDER_IMAGE} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                alt=""
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs text-[9px] font-black uppercase px-2.5 py-1 rounded-md text-indigo-650 border border-slate-100 shadow-sm">
                                {b.category || 'Article'}
                              </div>
                            </div>
                            <div className="p-3.5 flex flex-col justify-between flex-1 space-y-3">
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-400">{b.date}</span>
                                <h3 className="font-extrabold text-base text-slate-850 group-hover:text-indigo-650 transition-colors line-clamp-2 leading-tight">
                                  {b.title}
                                </h3>
                                {b.excerpt && (
                                  <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                                    {b.excerpt}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-850 group-hover:translate-x-1 transition-transform">
                                <span>Read Article</span>
                                <ArrowRight className="h-4 w-4" />
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* 15. BRAND LIST */}
                {sec.type === 'Brand list' && (
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 py-4">
                    <div className="text-center space-y-3">
                      <span className="text-[10px] tracking-widest font-black uppercase text-indigo-650 bg-indigo-50 px-3 py-1 rounded-full inline-block font-sans">
                        Compounding Series Catalog
                      </span>
                      <h2 
                        className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-slate-900"
                        style={{ color: sec.settings.headingColor || '#0C1017' }}
                      >
                        {sec.settings.title || 'Official Brands Directory'}
                      </h2>
                      {sec.settings.description && (
                        <p className="text-slate-500 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed">{sec.settings.description}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
                      {(sec.settings.brandItems || []).map((b, bidx) => (
                        <div 
                          key={bidx} 
                          onClick={() => handleLinkClick(b.linkUrl)}
                          className="aspect-square relative rounded-2xl md:rounded-[24px] overflow-hidden group cursor-pointer border border-slate-100 bg-[#FAF9F5] shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all duration-500 hover:shadow-[0_20px_48px_rgba(0,0,0,0.10)] hover:-translate-y-1.5 flex flex-col justify-end"
                        >
                          {/* Image Layer */}
                          {b.imageUrl ? (
                            <img 
                              src={cleanMediaUrl(b.imageUrl)} 
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out" 
                              alt={b.title} 
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center">
                              <Layers className="h-8 w-8 text-slate-300" />
                            </div>
                          )}

                          {/* Gradient Overlay Layer */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent opacity-90 group-hover:opacity-95 transition-opacity duration-300" />

                          {/* Top Tag or Badge */}
                          <div className="absolute top-4 left-4 bg-black/30 backdrop-blur-md border border-white/10 text-[8px] font-black tracking-widest text-white px-2.5 py-1 rounded-lg uppercase leading-none shadow-sm">
                            {(bidx % 3 === 0) ? 'SWEDISH LABS' : (bidx % 3 === 1) ? 'AWARD NOMINEE' : 'EXCLUSIVE DEPOT'}
                          </div>

                          {/* Active Hover Arrow Accent */}
                          <div className="absolute top-4 right-4 bg-white text-slate-900 rounded-full p-1.5 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 shadow-md">
                            <ArrowRight className="h-3 w-3" />
                          </div>

                          {/* Text Content Block */}
                          <div className="p-5 sm:p-6 relative z-10 translate-y-1 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                            <span className="block text-[9px] font-bold text-indigo-400 uppercase tracking-widest font-mono mb-1">
                              Collection #{bidx + 1}
                            </span>
                            <h3 
                              className="brand-card-title overlay-heading text-lg sm:text-xl md:text-2xl font-black leading-tight uppercase font-sans tracking-tight"
                              style={{ color: sec.settings.overlayHeadingColor || sec.settings.cardTitleColor || '#FFFFFF' }}
                            >
                              {b.title || 'Brand'}
                            </h3>
                            
                            <div className="h-0 group-hover:h-5 opacity-0 group-hover:opacity-100 overflow-hidden transition-all duration-500 ease-out mt-1">
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                Explore collection 
                                <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
                              </span>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 17. BRANDS WE OFFER */}
                {sec.type === 'Brands we offer' && (
                  <BrandsWeOfferSection sec={sec} handleLinkClick={handleLinkClick} />
                )}

                {/* 18. HOW IT WORKS */}
                {sec.type === 'How it works' && (
                  <HowItWorksSection sec={sec} handleLinkClick={handleLinkClick} />
                )}

                {/* 19. SUBSCRIPTION PLANS */}
                {sec.type === 'Plans' && (
                  <PlansSection sec={sec} handleLinkClick={handleLinkClick} />
                )}

                {/* 16. ICON WITH TEXT */}
                {sec.type === 'Icon with text' && (() => {
                  const items = sec.settings.iconItems || [
                    { iconName: 'Truck', title: 'Delivered on your schedule', description: 'Flexible delivery, when you need it.', linkUrl: 'frontend-shop' },
                    { iconName: 'Zap', title: 'Save vs. shop prices', description: 'Better prices than retail stores.', linkUrl: 'frontend-shop' },
                    { iconName: 'Shield', title: 'Discreet delivery', description: 'Plain, private, and secure packaging.', linkUrl: 'frontend-shop' },
                    { iconName: 'Clock', title: 'Cancel anytime', description: 'No commitments, full control.', linkUrl: 'frontend-shop' },
                    { iconName: 'Award', title: 'Loyalty scheme', description: 'Earn rewards on every order.', linkUrl: 'frontend-shop' },
                    { iconName: 'Package', title: 'Never run out', description: 'Auto-refill and easy reordering.', linkUrl: 'frontend-shop' }
                  ];

                  const getPremiumCardDetails = (iconName: string, title: string, description: string) => {
                    const normIcon = (iconName || '').toLowerCase();
                    const normTitle = (title || '').toLowerCase();

                    if (normIcon.includes('truck') || normTitle.includes('delivery') || normTitle.includes('schedule')) {
                      return {
                        title: 'FLEXIBLE DELIVERY',
                        desc: 'Delivered on your schedule. Weekly, fortnightly or monthly.',
                        benefits: ['Change anytime', 'Skip or delay', 'Full control'],
                        iconName: 'Truck'
                      };
                    }
                    if (normIcon.includes('zap') || normTitle.includes('save') || normTitle.includes('price') || normTitle.includes('month')) {
                      return {
                        title: 'SAVE EVERY MONTH',
                        desc: 'Save up to £55/month compared to buying in-store.',
                        benefits: ['Better prices', 'Big savings', 'More value'],
                        iconName: 'Zap'
                      };
                    }
                    if (normIcon.includes('shield') || normTitle.includes('discreet') || normTitle.includes('packaging') || normTitle.includes('private')) {
                      return {
                        title: 'DISCREET PACKAGING',
                        desc: 'Plain and private secure packaging for ultimate peace of mind.',
                        benefits: ['No outer branding', 'Secure seal', 'Private delivery'],
                        iconName: 'Shield'
                      };
                    }
                    if (normIcon.includes('clock') || normTitle.includes('cancel') || normTitle.includes('commitment') || normTitle.includes('anytime')) {
                      return {
                        title: 'CANCEL ANYTIME',
                        desc: 'Pause, speed up, slow down, or end your plan anytime in one click.',
                        benefits: ['Zero commitment', 'No hidden fees', 'Instant update'],
                        iconName: 'Clock'
                      };
                    }
                    if (normIcon.includes('award') || normTitle.includes('loyalty') || normTitle.includes('reward') || normTitle.includes('scheme')) {
                      return {
                        title: 'LOYALTY REWARDS',
                        desc: 'Earn loyalty points on every cycle to redeem exclusive store benefits.',
                        benefits: ['Free accessories', 'Double points', 'Exclusive status'],
                        iconName: 'Award'
                      };
                    }
                    if (normIcon.includes('package') || normTitle.includes('never run out') || normTitle.includes('auto')) {
                      return {
                        title: 'NEVER RUN OUT',
                        desc: 'Auto-refill systems lock in your favorite pouches at sub-retail price thresholds.',
                        benefits: ['Auto-refill', 'Priority stock', 'Price lock-in'],
                        iconName: 'Package'
                      };
                    }
                    return {
                      title: title.toUpperCase(),
                      desc: description,
                      benefits: ['Premium quality', 'Reliable service', 'Best selection'],
                      iconName: iconName
                    };
                  };

                  return (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 py-8">
                      <div className="text-center space-y-3">
                        {sec.settings.title && (
                          <h2 
                            className="text-3xl md:text-4xl font-black uppercase tracking-tight text-[#071529]"
                          >
                            {sec.settings.title}
                          </h2>
                        )}
                        {sec.settings.description && (
                          <p 
                            className="max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed text-slate-500 font-semibold"
                          >
                            {sec.settings.description}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                        {items.map((item, iIdx) => {
                          const details = getPremiumCardDetails(item.iconName, item.title, item.description);
                          
                          const IconComp = (() => {
                            const iconClass = "h-8 w-8 text-[#071529] transition-transform duration-300 group-hover:scale-115";
                            switch (details.iconName) {
                              case 'Truck': return <Truck className={iconClass} />;
                              case 'Zap': return <Zap className={iconClass} />;
                              case 'Shield': return <ShieldCheck className={iconClass} />;
                              case 'Clock': return <Clock className={iconClass} />;
                              case 'Award': return <Award className={iconClass} />;
                              case 'Package': return <Package className={iconClass} />;
                              case 'Heart': return <Heart className={iconClass} />;
                              case 'HelpCircle': return <HelpCircle className={iconClass} />;
                              case 'Star': return <Star className={iconClass} />;
                              default: return <Sparkles className={iconClass} />;
                            }
                          })();

                          return (
                            <div 
                              key={iIdx} 
                              onClick={() => {
                                if (item.linkUrl) handleLinkClick(item.linkUrl);
                              }}
                              className="bg-white border border-slate-100 rounded-2xl p-6 md:p-7 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg hover:border-[#dfa047]/45 transition-all duration-300 group cursor-pointer shadow-xs select-none"
                            >
                              <div className="space-y-5">
                                {/* Top row with icon, title/desc, and action arrow */}
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-4">
                                    {/* Icon with soft gold circle background */}
                                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#faf0e1] flex items-center justify-center shrink-0 shadow-inner border border-[#dfa047]/10 transition-all duration-300 group-hover:bg-[#f9ebd4]">
                                      {IconComp}
                                    </div>
                                    
                                    {/* Text info */}
                                    <div className="text-left">
                                      <h3 
                                        className="text-sm sm:text-base font-black uppercase tracking-wider text-[#071529] group-hover:text-[#dfa047] transition-colors duration-250"
                                      >
                                        {details.title}
                                      </h3>
                                      <p 
                                        className="text-[11px] sm:text-xs text-slate-500 font-bold leading-relaxed mt-1"
                                      >
                                        {details.desc}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Right side gold circular arrow */}
                                  <div className="w-8 h-8 rounded-full border border-[#dfa047]/30 flex items-center justify-center text-[#dfa047] transition-all duration-300 group-hover:border-[#dfa047] group-hover:bg-[#dfa047]/15 shrink-0">
                                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                                  </div>
                                </div>

                                {/* Bottom row: divider and benefit bullet checks */}
                                <div className="pt-4 border-t border-slate-50 flex flex-wrap gap-x-5 gap-y-2 text-left">
                                  {details.benefits.map((benefit, bIdx) => (
                                    <div key={bIdx} className="flex items-center gap-1.5">
                                      <Check className="h-3.5 w-3.5 text-[#dfa047] stroke-[3.5px] shrink-0" />
                                      <span className="text-[10.5px] font-extrabold text-slate-600 uppercase tracking-wide">
                                        {benefit}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* 18. TRUST BADGES */}
                {sec.type === 'Trust badges' && (() => {
                  const badges = sec.settings.trustBadges || [
                    { iconType: 'badge', title: '100% AUTHENTIC', description: 'Direct from official suppliers.' },
                    { iconType: 'shield', title: 'PREMIUM QUALITY', description: 'Only trusted, proven brands.' },
                    { iconType: 'globe', title: 'GLOBAL SELECTION', description: 'The best from around the world.' },
                    { iconType: 'tag', title: 'MEMBER PRICING', description: 'Better prices, always.' }
                  ];

                  return (
                    <div className="py-8 bg-white w-full">
                      <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-4 md:py-6 border-y border-slate-100 divide-y md:divide-y-0 md:divide-x divide-slate-150">
                          {badges.map((b, bIdx) => (
                            <div 
                              key={bIdx} 
                              className="flex items-center gap-4 py-4 md:py-2 md:px-6 first:pl-0 last:pr-0 justify-center md:justify-start first:pt-0 md:first:pt-2 last:pb-0 md:last:pb-2"
                            >
                              <div className="shrink-0 p-2 rounded-xl bg-slate-50 flex items-center justify-center shadow-2xs">
                                {b.iconType === 'badge' ? (
                                  <Award className="h-7 w-7 text-[#D4AF37]" />
                                ) : b.iconType === 'shield' ? (
                                  <ShieldCheck className="h-7 w-7 text-slate-800" />
                                ) : b.iconType === 'globe' ? (
                                  <Globe className="h-7 w-7 text-slate-800" />
                                ) : (
                                  <Tag className="h-7 w-7 text-slate-800" />
                                )}
                              </div>
                              <div className="text-left space-y-0.5">
                                <h4 className="text-xs font-black tracking-wide text-slate-900 uppercase">
                                  {b.title}
                                </h4>
                                <p className="text-[11px] text-slate-400 leading-normal font-medium">
                                  {b.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 19. CONTACT FORM SECTION */}
                {sec.type === 'Contact Form' && (() => {
                  return <ContactFormSection sec={sec} />;
                })()}

              </div>
            </section>
          );
        })
      ) : (
        <div className="text-center py-24 bg-white border border-slate-150 rounded-3xl max-w-md mx-auto shadow-sm p-6 space-y-4">
          <div className="h-14 w-14 rounded-full bg-slate-50 border text-slate-300 flex items-center justify-center mx-auto">
            <FileText className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xs font-black uppercase text-slate-700 tracking-wider">No Active Page Sections</h2>
            <p className="text-[10px] text-slate-400 leading-relaxed">This custom canvas currently contains no sections. Create or drag new sections inside the admin editor.</p>
          </div>
        </div>
      )}
    </div>
  );
}
