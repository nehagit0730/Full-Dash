import React, { useState, useEffect } from 'react';
import { Product, CartItem, Collection, PageSection } from '../types';
import { 
  Check, Info, RefreshCw, ShoppingCart, HelpCircle, Package, Sparkles, ArrowRight,
  Crown, Tag, Flame, ShieldCheck, Lock, Truck, Gift, Clock
} from 'lucide-react';
import PlansCanOverlay from './PlansCanOverlay';
import { frequencyDiscountPercent } from '../lib/subscriptionPricing';

/**
 * One product the customer put in their box, with the identity needed to show
 * its exact name again later: the real product id, the concrete variant id and
 * the untouched catalogue title.
 */
export interface SubscriptionSelection {
  product: Product;
  quantity: number;
  brand: string;
  vendor: string;
  productId: string;
  variantId?: string;
  productTitle: string;
  variantName: string;
  variant: string;
  price: number;
  image?: string;
}

interface SubscriptionBuilderProps {
  allProducts: Product[];
  collections: Collection[];
  onAddSubToCart: (
    packName: string,
    items: SubscriptionSelection[],
    frequency: string,
    flatPrice: number
  ) => void;
  plansSection?: PageSection;
}

interface PlanConfig {
  slug: 'lite' | 'core' | 'pro' | 'ultimate';
  name: string;
  limit: number;
  price: number;
  perCan: string;
  extraLabel?: string;
  popular?: boolean;
}

const PLANS: PlanConfig[] = [
  {
    slug: 'lite',
    name: 'LITE',
    limit: 6,
    price: 27.99,
    perCan: '£4.67',
  },
  {
    slug: 'core',
    name: 'CORE',
    limit: 8,
    price: 35.99,
    perCan: '£4.50',
  },
  {
    slug: 'pro',
    name: 'PRO',
    limit: 10,
    price: 40.99,
    perCan: '£4.10',
    popular: true,
  },
  {
    slug: 'ultimate',
    name: 'ULTIMATE',
    limit: 12,
    price: 46.99,
    perCan: '£3.92',
    extraLabel: '£3.80 for any additional can',
  },
];

// Helper components for the high-fidelity pouch illustrations
const CanSVG = ({ brand, color }: { brand: string, color: string }) => {
  return (
    <div 
      className="w-10 h-10 rounded-full shrink-0 shadow-lg border border-white/40 flex items-center justify-center font-sans font-black text-[9px] text-white tracking-tighter select-none" 
      style={{ background: `radial-gradient(circle at 35% 35%, ${color} 0%, #0f172a 100%)` }}
    >
      {brand}
    </div>
  );
};

export default function SubscriptionBuilder({ allProducts, collections, onAddSubToCart, plansSection }: SubscriptionBuilderProps) {
  const userCollections = collections.filter(c => c.id !== 'all');

  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(() => {
    return userCollections.length > 0 ? userCollections[0].id : '';
  });

  // State to track selected variant ID per product ID
  const [selectedVariantIdForProduct, setSelectedVariantIdForProduct] = useState<{ [productId: string]: string }>({});

  // key format is "productId::variantId" (or "productId::main" if no variant)
  const [allocatedItems, setAllocatedItems] = useState<{ [key: string]: number }>({});
  const [frequency, setFrequency] = useState('Bi-Weekly');
  const [successAnimation, setSuccessAnimation] = useState(false);

  // Parse path to set active plan state (supports both routes /subscribe/lite and query params ?plan=lite)
  const [activePlanSlug, setActivePlanSlug] = useState<'lite' | 'core' | 'pro' | 'ultimate' | null>(() => {
    let p = '';
    let search = '';
    try {
      p = window.location.pathname;
      search = window.location.search;
    } catch (e) {}

    if (search.includes('plan=lite')) return 'lite';
    if (search.includes('plan=core')) return 'core';
    if (search.includes('plan=pro')) return 'pro';
    if (search.includes('plan=ultimate')) return 'ultimate';

    if (p.includes('/subscribe/lite')) return 'lite';
    if (p.includes('/subscribe/core')) return 'core';
    if (p.includes('/subscribe/pro')) return 'pro';
    if (p.includes('/subscribe/ultimate')) return 'ultimate';
    return null;
  });

  // URL Change synchronizer
  useEffect(() => {
    const handlePopState = () => {
      let p = '';
      let search = '';
      try {
        p = window.location.pathname;
        search = window.location.search;
      } catch (e) {}

      if (search.includes('plan=lite') || p.includes('/subscribe/lite') || p.endsWith('/lite')) {
        setActivePlanSlug('lite');
      } else if (search.includes('plan=core') || p.includes('/subscribe/core') || p.endsWith('/core')) {
        setActivePlanSlug('core');
      } else if (search.includes('plan=pro') || p.includes('/subscribe/pro') || p.endsWith('/pro')) {
        setActivePlanSlug('pro');
      } else if (search.includes('plan=ultimate') || p.includes('/subscribe/ultimate') || p.endsWith('/ultimate')) {
        setActivePlanSlug('ultimate');
      } else if (p.includes('/subscribe')) {
        setActivePlanSlug(null);
      }
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const selectPlan = (slug: 'lite' | 'core' | 'pro' | 'ultimate' | null) => {
    setActivePlanSlug(slug);
    const newUrl = slug ? `/pages/subscribe/${slug}` : '/pages/subscribe';
    try {
      window.history.pushState({}, '', newUrl);
    } catch (e) {
      console.warn('[Subscription] pushState failed:', e);
    }
    // Reset selections when switching to avoid carry over
    setAllocatedItems({});
  };

  // Dynamic Plans resolution from Admin Settings
  interface ActivePlanItem {
    slug: 'lite' | 'core' | 'pro' | 'ultimate';
    name: string;
    limit: number;
    price: number;
    perCan: string;
    extraLabel?: string;
    popular?: boolean;
    subtitle?: string;
    imageUrl?: string;
    features?: string[];
    saveAmountText?: string;
  }

  const plansSectionItems = plansSection?.settings?.planItems;
  const activePlans: ActivePlanItem[] = plansSectionItems && plansSectionItems.length > 0
    ? plansSectionItems.map(p => ({
        slug: p.slug,
        name: p.name,
        limit: p.limit,
        price: p.price,
        perCan: `£${(p.price / p.limit).toFixed(2)}`,
        extraLabel: p.extraText,
        popular: p.isPopular,
        subtitle: p.subtitle,
        imageUrl: p.imageUrl,
        features: p.features,
        saveAmountText: p.saveAmountText,
      }))
    : PLANS.map(p => ({
        ...p,
        subtitle: p.slug === 'lite' ? 'Best for getting started' : p.slug === 'core' ? 'Most flexible' : p.slug === 'pro' ? 'Best value' : 'Maximum savings',
        features: p.slug === 'lite' 
          ? ['6 premium cans', 'Flexible delivery', 'Change flavours anytime', 'Skip or pause anytime']
          : p.slug === 'core'
          ? ['8 premium cans', 'Lower price per can', 'Change or swap brands', 'Skip or pause anytime']
          : p.slug === 'pro'
          ? ['10 premium cans', 'FREE delivery 📦', 'Best price per can', 'Loyalty rewards boost', 'Skip or pause anytime']
          : ['12 premium cans', 'FREE delivery 📦', 'Lowest price per can', '£3.80 for any extra can', 'Skip or pause anytime'],
        saveAmountText: p.slug === 'lite' ? 'Save £5.00/month' : p.slug === 'core' ? 'Save £10.00/month' : p.slug === 'pro' ? 'Save £14.00/month' : 'Save £19.00/month',
      }));

  const activePlan = activePlans.find(p => p.slug === activePlanSlug);
  const activeLimit = activePlan ? activePlan.limit : 6;
  const activePrice = activePlan ? activePlan.price : 27.99;

  // Automatically select a default collection if selectedCollectionId is empty
  const activeCollection = userCollections.find(c => c.id === selectedCollectionId) || userCollections[0];

  const filteredProducts = activeCollection 
    ? allProducts.filter(p => activeCollection.productIds.includes(p.id) && p.status === 'Active')
    : [];

  const totalSelectedCount = (Object.values(allocatedItems) as number[]).reduce((sum, count) => sum + count, 0);

  const getSelectedVariantId = (prod: Product) => {
    if (!prod.concreteVariants || prod.concreteVariants.length === 0) {
      return 'main';
    }
    return selectedVariantIdForProduct[prod.id] || prod.concreteVariants[0].id;
  };

  const handleAddProduct = (product: Product, forcedVariantId?: string) => {
    if (totalSelectedCount >= activeLimit) {
      if (activePlanSlug === 'ultimate') {
        // Ultimate plan allows adding more than 12 cans at £3.80 each!
      } else {
        alert(`You have already selected ${activeLimit} items. Please remove some items if you'd like to choose different ones.`);
        return;
      }
    }
    const vid = forcedVariantId || getSelectedVariantId(product);
    const key = `${product.id}::${vid}`;
    setAllocatedItems(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + 1
    }));
  };

  const handleRemoveProductKey = (key: string) => {
    setAllocatedItems(prev => {
      const current = prev[key] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      return {
        ...prev,
        [key]: current - 1
      };
    });
  };

  const handleClearAllocation = () => {
    setAllocatedItems({});
  };

  const handleAddToCartClick = () => {
    const isUltimate = activePlanSlug === 'ultimate';
    const isValidCount = isUltimate ? totalSelectedCount >= activeLimit : totalSelectedCount === activeLimit;
    
    if (!isValidCount) {
      alert(`Please select ${isUltimate ? 'at least' : 'exactly'} ${activeLimit} products to complete your ${activePlan?.name || 'custom'} pack subscription!`);
      return;
    }

    const compiledItems = (Object.entries(allocatedItems) as [string, number][]).map(([key, quantity]) => {
      const [prodId, variantId] = key.split('::');
      const prod = allProducts.find(p => p.id === prodId)!;

      const variant = variantId !== 'main' 
        ? prod.concreteVariants?.find(v => v.id === variantId) 
        : null;

      const variantName = variant ? variant.name : (prod.flavour || prod.variant || 'Standard');
      const brandName = (prod.vendor || (prod as any).brand || '').trim();

      const finalProduct: Product = {
        ...prod,
        id: variant ? variant.id : prod.id,
        title: prod.title,
        vendor: brandName,
        concreteVariantName: variantName,
        variant: variantName,
        price: variant ? variant.price : prod.price,
        image: (variant && variant.images && variant.images.length > 0 && variant.images[0])
          ? variant.images[0]
          : prod.image
      };

      // `finalProduct.id` is the concrete variant id when one was picked, so the
      // real product id and the variant id are carried separately. Without both,
      // the order can only be described by a display string later on.
      return {
        product: finalProduct,
        quantity,
        brand: brandName,
        vendor: brandName,
        productId: prod.id,
        variantId: variant ? variant.id : undefined,
        productTitle: prod.title,
        variantName: variantName,
        variant: variantName,
        price: finalProduct.price,
        image: finalProduct.image
      };
    });

    const extraCans = isUltimate && totalSelectedCount > 12 ? totalSelectedCount - 12 : 0;
    const baseSubPrice = activePrice + (extraCans * 3.80);
    // Priced from the shared rule, which no longer discounts by rhythm. This
    // used to carry its own 5/10/12 ladder, so a change here and a change there
    // could disagree about what the same plan costs.
    const finalPrice = Number(
      (baseSubPrice * ((100 - frequencyDiscountPercent(frequency)) / 100)).toFixed(2)
    );

    const planUpper = (activePlan?.name || activePlanSlug || 'PRO').toUpperCase();
    const displayName = isUltimate && extraCans > 0 
      ? `${planUpper} Plan (+${extraCans} Extra)` 
      : `${planUpper} Plan`;

    onAddSubToCart(displayName, compiledItems, frequency, finalPrice);
    
    setSuccessAnimation(true);
    setTimeout(() => {
      setSuccessAnimation(false);
      setAllocatedItems({});
    }, 2500);
  };

  // --- RENDERING PLAN CHOICE SCREEN (plan.jpg equivalent) ---
  if (!activePlanSlug) {
    const settings = plansSection?.settings || ({} as any);
    const bgColor = settings.backgroundColor || '#061229';
    const title = settings.title || 'CHOOSE YOUR PLAN';
    const description = settings.description || 'Flexible subscriptions. Premium brands. Serious savings.';
    const alertBadgeText = settings.alertBadgeText || 'Most customers save up to £55/month';
    const promoText = settings.promoBannerText || '★ FIRST 50 CUSTOMERS - Get 10% OFF YOUR FIRST ORDER >';

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
            <h1 className="text-4.5xl md:text-5xl font-black tracking-tight uppercase leading-none font-sans">
              {title.includes('PLAN') ? (
                <>
                  {title.substring(0, title.lastIndexOf('PLAN'))}
                  <span className="text-[#dfb55a]">{title.substring(title.lastIndexOf('PLAN'))}</span>
                </>
              ) : (
                title
              )}
            </h1>
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

          {/* Switcher Option Buttons */}
          <div className="flex justify-center">
            <div className="bg-slate-950 p-1.5 rounded-full border border-slate-800 flex items-center gap-1">
              <button 
                onClick={() => setFrequency('Weekly')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  frequency === 'Weekly' 
                    ? 'bg-[#dfb55a] text-slate-950 font-black' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Weekly
              </button>
              <button 
                onClick={() => setFrequency('Bi-Weekly')}
                className={`px-5 py-2 rounded-full text-xs transition-all ${
                  frequency === 'Bi-Weekly' 
                    ? 'bg-[#dfb55a] text-slate-950 font-black' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bi-Weekly
              </button>
              <button 
                onClick={() => setFrequency('One Month')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  frequency === 'One Month' 
                    ? 'bg-[#dfb55a] text-slate-950 font-black' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                One Month
              </button>
            </div>
          </div>

          {/* 4-Tier Plan Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            {activePlans.map((plan) => {
              const isPopular = plan.popular;
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
                    <div className="relative h-44 w-full bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden flex items-center justify-center p-2 shadow-inner">
                      {plan.imageUrl ? (
                        <img 
                          src={plan.imageUrl} 
                          alt={plan.name} 
                          className="w-full h-full object-contain pointer-events-none rounded-xl"
                          referrerPolicy="no-referrer"
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
                      {plan.features && plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-600">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Section */}
                  <div className="mt-6 space-y-3">
                    {plan.extraLabel ? (
                      <div className="text-center py-1.5 bg-rose-50 text-rose-600 font-extrabold text-[9px] tracking-widest uppercase rounded-full border border-rose-100">
                        {plan.extraLabel}
                      </div>
                    ) : (
                      <div className="h-6" />
                    )}

                    <button
                      onClick={() => selectPlan(plan.slug)}
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

          {/* Dynamic footer trust badges */}
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

  // --- RENDERING BUILDER VIEW (topbar.jpg equivalent) ---
  return (
    <div id="subscription-pack-builder" className="max-w-7xl mx-auto px-4 py-8">
      
      {/* 1. TOPBAR SECTION (topbar.jpg equivalent) */}
      <div className="flex flex-col items-center mb-10 space-y-6">
        
        {/* Rounded Pill Container Topbar */}
        <div className="bg-slate-100 p-1.5 rounded-full flex flex-wrap justify-center items-center gap-1.5 shadow-md border border-slate-200/80 max-w-2xl">
          {activePlans.map((plan) => {
            const isSelected = plan.slug === activePlanSlug;
            return (
              <div key={plan.slug} className="relative">
                {/* Float tag for popular badge */}
                {plan.popular && (
                  <span className="absolute -top-3.5 right-2 bg-[#dfb55a] text-slate-950 text-[7.5px] font-black uppercase px-2 py-0.5 rounded-md shadow-xs border border-white/60">
                    Most Popular
                  </span>
                )}
                <button
                  onClick={() => selectPlan(plan.slug as any)}
                  className={`py-2 px-5 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-full transition-all duration-300 cursor-pointer ${
                    isSelected 
                      ? 'bg-slate-900 text-white shadow-lg' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {plan.name} ({plan.limit} Tubs)
                </button>
              </div>
            );
          })}
          {/* Back Button to Choose Plan view */}
          <button
            onClick={() => selectPlan(null)}
            className="py-2 px-4 text-[10px] md:text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-full transition-all cursor-pointer border-l border-slate-200 pl-3.5 ml-1"
          >
            ← View Plans
          </button>
        </div>

        {/* Big centered title of active plan */}
        <div className="text-center">
          <h2 className="text-4xl font-black text-slate-900 tracking-widest uppercase mb-1">
            {activePlan.name}
          </h2>
          <p className="text-indigo-600 font-extrabold text-sm tracking-wide">
            Choose {activeLimit}
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left main: Brand Tabs & Collection Display */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 shadow-xs">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Choose Products: Brand Collections</h3>
            
            {/* Brands/Collections selector buttons */}
            {userCollections.length > 0 ? (
              <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100 mb-6">
                {userCollections.map(col => (
                  <button
                    key={col.id}
                    onClick={() => setSelectedCollectionId(col.id)}
                    className={`py-2 px-5 text-sm rounded-lg font-bold transition-all cursor-pointer ${
                      selectedCollectionId === col.id 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {col.title}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 border border-slate-150 rounded-xl mb-6">
                <p className="text-xs text-slate-500 font-medium">No collections found. Create collections in your Admin Dashboard first.</p>
              </div>
            )}

            {/* Display list of products belonging to selected brand/collection */}
            {/* Two per row from the smallest screen up: one column made this
                list several screens long before anything could be chosen. */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((prod, pIdx) => {
                  const hasVariants = prod.concreteVariants && prod.concreteVariants.length > 0;
                  const currentVariantId = hasVariants 
                    ? (selectedVariantIdForProduct[prod.id] || prod.concreteVariants![0].id) 
                    : 'main';
                  
                  const currentVariant = hasVariants 
                    ? prod.concreteVariants!.find(v => v.id === currentVariantId) 
                    : null;

                  const currentPrice = currentVariant ? currentVariant.price : prod.price;
                  const key = `${prod.id}::${currentVariantId}`;
                  const countAllocated = allocatedItems[key] || 0;

                  return (
                    <div 
                      key={`sb-prod-${prod.id}-${pIdx}`} 
                      className={`border rounded-xl p-2.5 sm:p-4 flex flex-col justify-between transition-all ${
                        countAllocated > 0 
                          ? 'border-indigo-500 bg-indigo-50/20 shadow-xs' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {/* object-CONTAIN below, not cover. A pouch can is portrait
                          and this box is 176px of landscape, so cover cropped the
                          top and bottom off every product image on desktop as
                          well as mobile. Contain fits the whole can inside. */}
                      <div className="relative mb-3">
                        <img
                          src={(currentVariant && currentVariant.images && currentVariant.images.length > 0) ? currentVariant.images[0] : prod.image}
                          alt={prod.title}
                          className="w-full h-36 sm:h-44 object-contain p-2 rounded-lg bg-slate-50 border border-slate-100"
                          referrerPolicy="no-referrer"
                        />
                        {countAllocated > 0 && (
                          <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs font-black h-7 w-7 rounded-full flex items-center justify-center shadow-md animate-scale">
                            {countAllocated}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block">{prod.vendor}</span>
                          <h4 className="text-xs font-extrabold text-slate-800 leading-snug line-clamp-2">
                            {prod.title}
                            {currentVariant && (
                              <span className="text-indigo-600 font-extrabold ml-1">
                                ({currentVariant.name})
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                            {currentVariant && currentVariant.description 
                              ? currentVariant.description.replace(/<[^>]*>/g, '') 
                              : (prod.description || '').replace(/<[^>]*>/g, '')}
                          </p>
                           {/* Variant Selector Dropdown if variants exist */}
                          {hasVariants && (
                            <div className="mt-2 text-left">
                              <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                                Select Variant / Option
                              </label>
                              <select
                                value={currentVariantId}
                                onChange={(e) => setSelectedVariantIdForProduct(prev => ({ ...prev, [prod.id]: e.target.value }))}
                                className="w-full text-xs font-bold border border-slate-200 bg-slate-50/50 p-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                              >
                                {prod.concreteVariants!.map(v => (
                                  <option key={v.id || v.name} value={v.id}>
                                    {v.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Beautiful allocated variants breakdown list for this product */}
                          {(() => {
                            const allocatedForThisProduct = Object.entries(allocatedItems)
                              .filter(([allocKey]) => allocKey.split('::')[0] === prod.id)
                              .map(([allocKey, qty]) => {
                                const vid = allocKey.split('::')[1];
                                const v = vid !== 'main' ? prod.concreteVariants?.find(x => x.id === vid) : null;
                                return { vid, qty, name: v ? v.name : 'Standard' };
                              });

                            if (allocatedForThisProduct.length === 0) return null;

                            return (
                              <div className="mt-3 p-2.5 bg-indigo-50/20 rounded-lg border border-indigo-100/50 text-[10px] space-y-1">
                                <span className="font-extrabold text-indigo-700 uppercase tracking-wider block text-[8px]">In Your Pack Box:</span>
                                {allocatedForThisProduct.map(item => (
                                  <div key={`${item.vid}-${item.name}`} className="flex justify-between items-center text-slate-700 font-semibold">
                                    <span>• {item.name}</span>
                                    <span className="bg-indigo-600 text-white font-extrabold px-2 py-0.5 rounded-full text-[9px] min-w-4 text-center">{item.qty}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">Included in plan</span>
                          
                          <div className="flex items-center gap-1">
                            {countAllocated > 0 && (
                              <button
                                onClick={() => handleRemoveProductKey(key)}
                                className="h-7 w-7 text-xs bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-md font-bold flex items-center justify-center cursor-pointer transition-colors"
                              >
                                -
                              </button>
                            )}
                            <button
                              onClick={() => handleAddProduct(prod, currentVariantId)}
                              className={`h-7 px-3 text-xs rounded-md font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                countAllocated > 0 
                                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                              }`}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12 text-slate-400">
                  <p className="text-sm font-medium">No active products inside this collection.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Box Summary Panel (Floating Box state) */}
        <div className="lg:col-span-1">
          {/* Sticky from lg up only. On a phone this is one column, so sticking
              achieved nothing and the panel simply sat below every product —
              which is where Add to Cart lives. The bar further down carries it
              on small screens instead. */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm lg:sticky lg:top-6 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm tracking-wide flex items-center gap-1.5">
                <Package className="h-4.5 w-4.5 text-indigo-600" /> Subscription Box
              </h3>
              {totalSelectedCount > 0 && (
                <button
                  onClick={handleClearAllocation}
                  className="text-[10px] text-slate-400 font-semibold hover:text-slate-600 cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Custom choice slots counter (Choose 6 items etc) */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-1.5">
                {activePlanSlug === 'ultimate' && totalSelectedCount >= 12 ? (
                  <>
                    <span>Allocated: {totalSelectedCount} / 12 products</span>
                    {totalSelectedCount > 12 ? (
                      <span className="text-emerald-600 font-extrabold">
                        +{totalSelectedCount - 12} Extra Can{totalSelectedCount - 12 > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[#dfb55a] font-extrabold">Complete!</span>
                    )}
                  </>
                ) : (
                  <>
                    <span>Allocated: {totalSelectedCount} / {activeLimit} products</span>
                    <span>{totalSelectedCount === activeLimit ? 'Complete!' : `${activeLimit - totalSelectedCount} left`}</span>
                  </>
                )}
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    activePlanSlug === 'ultimate' && totalSelectedCount > 12 ? 'bg-emerald-500' : 'bg-indigo-600'
                  }`} 
                  style={{ width: `${Math.min((totalSelectedCount / activeLimit) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Allocated products checklist */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {totalSelectedCount === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <span className="text-2xl block">📦</span>
                  <p className="text-[11px]">Your premium pack box is currently empty.</p>
                  <p className="text-[10px] text-slate-400">Select any {activeLimit} items from the brand collections on the left.</p>
                </div>
              ) : (
                (Object.entries(allocatedItems) as [string, number][]).map(([key, quantity]) => {
                  const [prodId, variantId] = key.split('::');
                  const prod = allProducts.find(p => p.id === prodId);
                  if (!prod) return null;

                  const variant = variantId !== 'main' 
                    ? prod.concreteVariants?.find(v => v.id === variantId) 
                    : null;

                  const displayName = variant 
                    ? `${prod.title} (${variant.name})` 
                    : prod.title;

                  const displayImg = (variant && variant.images && variant.images.length > 0)
                    ? variant.images[0]
                    : prod.image;

                  return (
                    <div key={key} className="flex gap-2 justify-between items-center bg-slate-50 border border-slate-200/50 p-2 rounded-lg text-xs">
                      <div className="flex items-center gap-2 flex-1">
                        <img src={displayImg} className="w-8 h-8 rounded bg-white border shrink-0" alt="" referrerPolicy="no-referrer" />
                        <span className="font-semibold text-slate-700" title={displayName}>{displayName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleRemoveProductKey(key)}
                          className="h-5 w-5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 rounded flex items-center justify-center font-bold text-[10px] cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-extrabold text-slate-800 text-xs w-4 text-center">{quantity}</span>
                        <button
                          onClick={() => handleAddProduct(prod, variantId)}
                          className="h-5 w-5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 rounded flex items-center justify-center font-bold text-[10px] cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Frequency Selection */}
            <div className="border-t border-slate-100 pt-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Delivery Frequency</label>
              <select
                id="sub-frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                {/* Frequency names only, and no test cadence: "Next Day (Test)"
                    was a one-day billing option for testing and must not be
                    sellable. Values are the stored billing interval and are
                    matched by string elsewhere, so they are left as they are. */}
                <option value="Weekly">Weekly</option>
                <option value="Bi-Weekly">Bi-Weekly</option>
                <option value="One Month">One Month</option>
              </select>
            </div>

            {/* Total Subscription Box pricing */}
            {(() => {
              const extraCans = activePlanSlug === 'ultimate' && totalSelectedCount > 12 ? totalSelectedCount - 12 : 0;
              const rawSubTotal = activePrice + (extraCans * 3.80);
              const calculatedRate = rawSubTotal * ((100 - frequencyDiscountPercent(frequency)) / 100);

              return (
                <div className="border-t border-slate-100 pt-4 space-y-3 bg-slate-50 p-4 rounded-xl">
                  {/* The "Frequency Discount" row is gone with the discount itself.
                      The struck-through price beside the flat rate went with it:
                      it was rawSubTotal * 1.15, a number nothing was ever sold
                      at, and showing it against an undiscounted price would
                      claim a saving that is not being given. */}
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>{activeLimit} pouches flat rate</span>
                    <span className="font-bold text-slate-700">£{rawSubTotal.toFixed(2)}</span>
                  </div>

                  {activePlanSlug === 'ultimate' && totalSelectedCount > 12 && (
                    <div className="flex justify-between items-center text-xs text-slate-600 animate-fade-in">
                      <span>Additional cans ({totalSelectedCount - 12} × £3.80)</span>
                      <span className="text-slate-800 font-extrabold">£{((totalSelectedCount - 12) * 3.80).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center font-extrabold text-slate-800 pt-1">
                    <span className="text-xs">Subscription rate</span>
                    <span className="text-lg text-emerald-600 font-black">
                      £{calculatedRate.toFixed(2)}{' '}
                      <span className="text-[10px] text-slate-400 font-medium font-sans">/ cycle</span>
                    </span>
                  </div>

                  {activePlan.slug === 'ultimate' && (
                    <div className="text-[10px] text-rose-600 font-extrabold uppercase text-center py-1.5 bg-rose-50 border border-rose-100 rounded-lg">
                      {totalSelectedCount >= 12 ? (
                        <span>★ Add additional cans below for £3.80 each!</span>
                      ) : (
                        <span>£3.80 for any additional can</span>
                      )}
                    </div>
                  )}

                  <button
                    id="add-sub-box-btn"
                    disabled={activePlanSlug === 'ultimate' ? totalSelectedCount < 12 : totalSelectedCount !== activeLimit}
                    onClick={handleAddToCartClick}
                    className={`w-full py-3.5 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                      (activePlanSlug === 'ultimate' ? totalSelectedCount >= 12 : totalSelectedCount === activeLimit)
                        ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-md animate-pulse'
                        : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4" /> 
                    {successAnimation ? 'Box added successfully!' : `Add ${activePlan.name} Box To Cart`}
                  </button>

                  <div className="flex items-start gap-1.5 text-[10px] text-slate-400 leading-normal pt-1">
                    <Info className="h-3 w-3 shrink-0 text-slate-400 mt-0.5" />
                    <span>You will be billed £{calculatedRate.toFixed(2)} on your {frequency} schedule. Swap, skip or cancel anytime from your customer portal.</span>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>

      </div>

      {/* Progress and Add to Cart, pinned for small screens.

          On a phone the summary panel is the last thing on the page, below every
          product, so the count and the Add button could only be reached by
          scrolling to the very end. This carries both while picking, and clears
          the iOS home bar. Hidden from lg up, where the sidebar does the job. */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_-4px_rgba(15,23,42,0.12)]">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-800">
              <Package className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">
                {totalSelectedCount} of {activeLimit} can{activeLimit === 1 ? "" : "s"}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, activeLimit > 0 ? (totalSelectedCount / activeLimit) * 100 : 0)}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            disabled={activePlanSlug === "ultimate" ? totalSelectedCount < 12 : totalSelectedCount !== activeLimit}
            onClick={handleAddToCartClick}
            className={`shrink-0 py-3 px-4 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
              (activePlanSlug === "ultimate" ? totalSelectedCount >= 12 : totalSelectedCount === activeLimit)
                ? "bg-emerald-600 text-white border-emerald-600 active:bg-emerald-700"
                : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {successAnimation ? "Added" : "Add to cart"}
          </button>
        </div>
      </div>

      {/* Room for the bar above, so it never covers the last product. */}
      <div className="lg:hidden h-24" aria-hidden="true" />
    </div>
  );
}
