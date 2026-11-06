import React, { useState, useMemo } from 'react';
import { Collection, Product, Customer } from '../types';
import { cleanMediaUrl, PLACEHOLDER_IMAGE } from '../utils/mediaUtils';
import { calculateVolumePrice } from '../utils';
import { PackSizeSelect } from './PackSizeSelect';
import { 
  ArrowLeft, 
  SlidersHorizontal, 
  Eye, 
  ShoppingCart, 
  Filter, 
  X, 
  HelpCircle, 
  Heart, 
  Grid, 
  List, 
  ShieldCheck, 
  Zap, 
  Award 
} from 'lucide-react';

interface CollectionDetailViewProps {
  collection: Collection;
  allProducts: Product[];
  loggedInCustomer: Customer | null;
  onAddToCart: (product: Product, qty: number) => void;
  onToggleWishlist: (productId: string) => void;
  onNavigate: (tab: string, arg?: string) => void;
}

export default function CollectionDetailView({
  collection,
  allProducts,
  loggedInCustomer,
  onAddToCart,
  onToggleWishlist,
  onNavigate
}: CollectionDetailViewProps) {
  const [sortOrder, setSortOrder] = useState<string>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Local product quantities
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Sidebar Filter States
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedFlavours, setSelectedFlavours] = useState<string[]>([]);
  const [selectedNicotines, setSelectedNicotines] = useState<string[]>([]);
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);

  // Quantity controllers per product card
  const handleQuantityChange = (productId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const getProductQuantity = (productId: string) => {
    return quantities[productId] || 1;
  };

  // Wishlist handlers
  const handleHeartClick = (pId: string) => {
    if (!loggedInCustomer) {
      alert("Wishlist feature is only accessible when logged in. Please sign in or register through the Account page first.");
      onNavigate('frontend-account');
      return;
    }
    onToggleWishlist(pId);
  };

  const isProductInWishlist = (pId: string) => {
    if (!loggedInCustomer) return false;
    return Boolean(loggedInCustomer.wishlist && Array.isArray(loggedInCustomer.wishlist) && loggedInCustomer.wishlist.includes(pId));
  };

  // Helper to map products to generic strengths (same as ProductsGrid)
  const getProductStrength = (p: Product): { id: string; label: string; score: number } => {
    let mgVal: number | null = null;
    
    if (p.strength) {
      const match = p.strength.match(/(\d+(?:\.\d+)?)/);
      if (match) {
        mgVal = parseFloat(match[1]);
      }
    }
    
    if (mgVal === null) {
      const titleMatch = p.title.match(/(\d+(?:\.\d+)?)\s*mg/i);
      if (titleMatch) {
        mgVal = parseFloat(titleMatch[1]);
      }
    }
    
    if (mgVal !== null) {
      if (mgVal <= 5) {
        return { id: 'mild', label: `Mild (${mgVal}mg)`, score: 1 };
      } else if (mgVal <= 10) {
        return { id: 'regular', label: `Regular (${mgVal}mg)`, score: 3 };
      } else if (mgVal <= 16) {
        return { id: 'strong', label: `Strong (${mgVal}mg)`, score: 4 };
      } else {
        return { id: 'xstrong', label: `X-Strong (${mgVal}mg)`, score: 5 };
      }
    }

    const titleL = p.title.toLowerCase();
    const tagString = (p.tags || []).join(' ').toLowerCase();
    
    if (titleL.includes('1mg') || titleL.includes('2mg') || titleL.includes('3mg') || titleL.includes('4mg') || titleL.includes('5mg') || tagString.includes('mild')) {
      return { id: 'mild', label: 'Mild (1-5mg)', score: 1 };
    }
    if (titleL.includes('6mg') || titleL.includes('7mg') || titleL.includes('8mg') || titleL.includes('9mg') || titleL.includes('10mg') || tagString.includes('standard') || tagString.includes('regular')) {
      return { id: 'regular', label: 'Regular (6-10mg)', score: 3 };
    }
    if (titleL.includes('11mg') || titleL.includes('12mg') || titleL.includes('13mg') || titleL.includes('14mg') || titleL.includes('15mg') || titleL.includes('16mg') || tagString.includes('strong')) {
      return { id: 'strong', label: 'Strong (11-16mg)', score: 4 };
    }
    return { id: 'xstrong', label: 'X-Strong (17mg+)', score: 5 };
  };

  // Helpers for categorization
  const getFlavourCategory = (p: Product): string => {
    const flavourStr = (p.flavour || '').toLowerCase();
    const titleL = p.title.toLowerCase();
    const tagString = (p.tags || []).join(' ').toLowerCase();
    
    if (
      flavourStr.includes('mint') || flavourStr.includes('ice') || flavourStr.includes('menthol') || 
      flavourStr.includes('freeze') || flavourStr.includes('spearmint') || flavourStr.includes('wintergreen') || 
      titleL.includes('mint') || titleL.includes('menthol') || titleL.includes('ice') || titleL.includes('freeze') || 
      tagString.includes('mint')
    ) {
      return 'Mint';
    }
    if (
      flavourStr.includes('berry') || flavourStr.includes('cherry') || flavourStr.includes('strawberry') || 
      flavourStr.includes('raspberry') || flavourStr.includes('blueberry') || flavourStr.includes('grape') || 
      titleL.includes('berry') || titleL.includes('cherry') || titleL.includes('strawberry') || 
      titleL.includes('raspberry') || titleL.includes('blueberry') || titleL.includes('grape') || 
      tagString.includes('berry')
    ) {
      return 'Berry';
    }
    if (flavourStr.includes('cola') || flavourStr.includes('soda') || titleL.includes('cola') || titleL.includes('soda') || tagString.includes('cola')) {
      return 'Cola';
    }
    if (
      flavourStr.includes('fruit') || flavourStr.includes('citrus') || flavourStr.includes('lemon') || 
      flavourStr.includes('lime') || flavourStr.includes('orange') || flavourStr.includes('mango') || 
      flavourStr.includes('apple') || flavourStr.includes('peach') || flavourStr.includes('passion') || 
      flavourStr.includes('tropical') || flavourStr.includes('pineapple') || flavourStr.includes('melon') || 
      flavourStr.includes('watermelon') || titleL.includes('fruit') || titleL.includes('citrus') || 
      titleL.includes('lemon') || titleL.includes('lime') || titleL.includes('orange') || titleL.includes('mango') || 
      titleL.includes('apple') || titleL.includes('peach') || titleL.includes('watermelon') || titleL.includes('tropical') || 
      tagString.includes('fruit') || tagString.includes('citrus')
    ) {
      return 'Fruit';
    }
    return 'Other';
  };

  const getNicotineContent = (p: Product): string => {
    if (p.strength) {
      const strengthMatch = p.strength.match(/(\d+(?:\.\d+)?)\s*mg/i);
      if (strengthMatch) {
        return `${parseFloat(strengthMatch[1])} mg`;
      }
    }
    const titleMatch = p.title.match(/(\d+(?:\.\d+)?)\s*mg/i);
    if (titleMatch) {
      return `${parseFloat(titleMatch[1])} mg`;
    }
    for (const tag of p.tags || []) {
      const tagMatch = tag.match(/(\d+(?:\.\d+)?)\s*mg/i);
      if (tagMatch) {
        return `${parseFloat(tagMatch[1])} mg`;
      }
    }
    return 'Other';
  };

  const getStrengthCategory = (p: Product): string => {
    const strengthStr = (p.strength || '').toLowerCase();
    const titleL = p.title.toLowerCase();
    const tagString = (p.tags || []).join(' ').toLowerCase();

    if (strengthStr.includes('extreme') || titleL.includes('extreme') || tagString.includes('extreme')) {
      return 'Extreme';
    }
    if (
      strengthStr.includes('extra strong') || strengthStr.includes('x-strong') || 
      titleL.includes('extra strong') || titleL.includes('xstrong') || titleL.includes('x-strong') || 
      tagString.includes('extra strong') || tagString.includes('x-strong') || tagString.includes('xstrong')
    ) {
      return 'Extra Strong';
    }
    if (strengthStr.includes('strong') || titleL.includes('strong') || tagString.includes('strong')) {
      return 'Strong';
    }
    
    let mgVal: number | null = null;
    const match = (p.strength || p.title).match(/(\d+(?:\.\d+)?)\s*mg/i);
    if (match) {
      mgVal = parseFloat(match[1]);
    }
    if (mgVal !== null) {
      if (mgVal >= 25) return 'Extreme';
      if (mgVal >= 16) return 'Extra Strong';
      if (mgVal >= 10) return 'Strong';
      return 'Normal';
    }

    return 'Normal';
  };

  // 1. Base active products in this collection
  const baseCollectionProducts = useMemo(() => {
    const expandedList: Product[] = [];
    allProducts.forEach(p => {
      if (p.status !== 'Active') return;
      if (p.concreteVariants && p.concreteVariants.length > 0) {
        p.concreteVariants.forEach(variant => {
          expandedList.push({
            ...p,
            id: variant.id,
            title: `${p.title} - ${variant.name}`,
            price: variant.price !== undefined ? variant.price : p.price,
            description: variant.description || p.description,
            image: (variant.images && variant.images.length > 0) ? variant.images[0] : p.image,
            inventory: variant.inventory !== undefined ? variant.inventory : p.inventory,
            flavour: variant.flavour || p.flavour,
            isVariantCard: true,
            concreteVariantId: variant.id,
            parentSlug: p.slug || p.id,
            parentId: p.id
          });
        });
      } else {
        expandedList.push(p);
      }
    });

    let list = expandedList;
    if (collection.id !== 'all') {
      list = expandedList.filter(p => {
        const checkId = p.parentId || p.id;
        return collection.productIds.includes(checkId);
      });
    }

    const seen = new Set<string>();
    return list.filter(p => {
      if (!p.id) return false;
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [collection, allProducts]);

  // Extract dynamic filters and their counts based on baseCollectionProducts
  const filterOptionsAndCounts = useMemo(() => {
    const brandCounts: Record<string, number> = {};
    const flavourCounts: Record<string, number> = {
      'Berry': 0,
      'Cola': 0,
      'Fruit': 0,
      'Mint': 0,
      'Other': 0
    };
    const nicotineCounts: Record<string, number> = {};
    const strengthCounts: Record<string, number> = {
      'Normal': 0,
      'Strong': 0,
      'Extra Strong': 0,
      'Extreme': 0
    };

    baseCollectionProducts.forEach(p => {
      // Brand
      const brand = p.vendor || 'Unknown';
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;

      // Flavour
      const flav = getFlavourCategory(p);
      flavourCounts[flav] = (flavourCounts[flav] || 0) + 1;

      // Nicotine
      const nic = getNicotineContent(p);
      nicotineCounts[nic] = (nicotineCounts[nic] || 0) + 1;

      // Strength
      const str = getStrengthCategory(p);
      strengthCounts[str] = (strengthCounts[str] || 0) + 1;
    });

    // Sort nicotine contents numerically
    const sortedNicotines = Object.keys(nicotineCounts).sort((a, b) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      const valA = parseFloat(a);
      const valB = parseFloat(b);
      return valA - valB;
    });

    return {
      brands: Object.keys(brandCounts).sort(),
      brandCounts,
      flavours: ['Berry', 'Cola', 'Fruit', 'Mint', 'Other'],
      flavourCounts,
      nicotines: sortedNicotines,
      nicotineCounts,
      strengths: ['Normal', 'Strong', 'Extra Strong', 'Extreme'],
      strengthCounts
    };
  }, [baseCollectionProducts]);

  // Apply all selected filters to the product list
  const collectionProducts = useMemo(() => {
    let list = baseCollectionProducts;

    // Brand filter
    if (selectedBrands.length > 0) {
      list = list.filter(p => selectedBrands.includes(p.vendor || 'Unknown'));
    }

    // Flavour filter
    if (selectedFlavours.length > 0) {
      list = list.filter(p => selectedFlavours.includes(getFlavourCategory(p)));
    }

    // Nicotine filter
    if (selectedNicotines.length > 0) {
      list = list.filter(p => selectedNicotines.includes(getNicotineContent(p)));
    }

    // Strength filter
    if (selectedStrengths.length > 0) {
      list = list.filter(p => selectedStrengths.includes(getStrengthCategory(p)));
    }

    // Apply sorting
    if (sortOrder === 'price-low-high') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-high-low') {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortOrder === 'title-asc') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [baseCollectionProducts, selectedBrands, selectedFlavours, selectedNicotines, selectedStrengths, sortOrder]);

  const toggleBrandFilter = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const toggleFlavourFilter = (flav: string) => {
    setSelectedFlavours(prev =>
      prev.includes(flav) ? prev.filter(f => f !== flav) : [...prev, flav]
    );
  };

  const toggleNicotineFilter = (nic: string) => {
    setSelectedNicotines(prev =>
      prev.includes(nic) ? prev.filter(n => n !== nic) : [...prev, nic]
    );
  };

  const toggleStrengthFilter = (str: string) => {
    setSelectedStrengths(prev =>
      prev.includes(str) ? prev.filter(s => s !== str) : [...prev, str]
    );
  };

  /** Ticked filters, shown on the mobile Filters button so its state is visible
   *  while the panel is closed. */
  const activeFilterCount =
    selectedBrands.length + selectedFlavours.length + selectedNicotines.length + selectedStrengths.length;

  /** Open state of the mobile filter drawer. */
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const resetAllFilters = () => {
    setSelectedBrands([]);
    setSelectedFlavours([]);
    setSelectedNicotines([]);
    setSelectedStrengths([]);
    setSortOrder('featured');
  };

  const isAnyFilterActive = 
    selectedBrands.length > 0 || 
    selectedFlavours.length > 0 || 
    selectedNicotines.length > 0 || 
    selectedStrengths.length > 0;

  /**
   * The filter controls themselves, declared once and rendered twice: in the
   * desktop sidebar and in the mobile drawer. Duplicating this markup would
   * mean every future filter had to be added in two places.
   */
  const filterPanelBody = (
    <>

        {/* 1. FLAVOUR CHECKBOX LIST */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Flavour</label>
          <div className="space-y-1.5">
            {filterOptionsAndCounts.flavours.map(flav => {
              const isChecked = selectedFlavours.includes(flav);
              const count = filterOptionsAndCounts.flavourCounts[flav] || 0;
              return (
                <label key={flav} className="flex items-center justify-between text-xs text-slate-700 font-semibold hover:text-slate-900 cursor-pointer py-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleFlavourFilter(flav)}
                      className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span>{flav}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 2. NICOTINE CONTENT CHECKBOX LIST */}
        <div className="space-y-2.5 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            <span>Nicotine content</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {filterOptionsAndCounts.nicotines.map(nic => {
              const isChecked = selectedNicotines.includes(nic);
              const count = filterOptionsAndCounts.nicotineCounts[nic] || 0;
              return (
                <label key={nic} className="flex items-center justify-between text-xs text-slate-700 font-semibold hover:text-slate-900 cursor-pointer py-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleNicotineFilter(nic)}
                      className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span>{nic}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 3. STRENGTH CHECKBOX LIST */}
        <div className="space-y-2.5 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            <span>Strength</span>
            <span title="Strength categorized by standard ranges"><HelpCircle className="h-3 w-3 text-slate-300 cursor-help" /></span>
          </div>
          <div className="space-y-1.5">
            {filterOptionsAndCounts.strengths.map(str => {
              const isChecked = selectedStrengths.includes(str);
              const count = filterOptionsAndCounts.strengthCounts[str] || 0;
              return (
                <label key={str} className="flex items-center justify-between text-xs text-slate-700 font-semibold hover:text-slate-900 cursor-pointer py-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleStrengthFilter(str)}
                      className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span>{str}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 4. BRAND CHECKBOX LIST */}
        <div className="space-y-2.5 pt-4 border-t border-slate-100">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Brand</label>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {filterOptionsAndCounts.brands.map(brand => {
              const isChecked = selectedBrands.includes(brand);
              const count = filterOptionsAndCounts.brandCounts[brand] || 0;
              return (
                <label key={brand} className="flex items-center justify-between text-xs text-slate-700 font-semibold hover:text-slate-900 cursor-pointer py-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleBrandFilter(brand)}
                      className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span>{brand}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
    </>
  );

  return (
    <div id="collection-detail-layout" className="bg-[#f6f6f7] min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-[1440px] mx-auto space-y-8">
        
        {/* Navigation back link */}
        <button
          onClick={() => {
            try {
              window.history.pushState({}, '', '/collections/all');
            } catch (e) {
              console.warn('[History] Failed to pushState:', e);
            }
            onNavigate('frontend-shop');
          }}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Collections</span>
        </button>

        {/* Curated Collection Header card */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs bg-slate-900 text-white min-h-[200px] flex items-center p-6 sm:p-10 lg:p-12">
          {collection.image && (
            <div className="absolute inset-0 z-0">
              <img 
                src={collection.image} 
                alt="" 
                className="w-full h-full object-cover opacity-25 filter blur-xs"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent" />
            </div>
          )}
          
          <div className="relative z-10 space-y-3 max-w-xl">
            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest bg-indigo-500/10 border border-indigo-400/20 py-1 px-3.5 rounded-full inline-block">
              Curated Selection
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              {collection.title}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-sans">
              {collection.description || 'Discover our hand-picked portfolio of the finest crystal-freeze cans and refreshing pouch formulas available.'}
            </p>
            <div className="text-[10px] text-slate-400 font-extrabold uppercase bg-white/5 py-1 px-3 rounded-md w-fit">
              {collectionProducts.length} matching item{collectionProducts.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Two-Column split layout for Filters Sidebar + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* FILTERS
              On a phone the panel used to be the FIRST thing in a single-column
              grid, so every visitor scrolled past the whole of it before seeing
              a product. It is a drawer there now, opened from the toolbar, and
              still a sidebar from lg up where there is room for it. */}
          <aside className="hidden lg:block bg-white border border-slate-200 rounded-2xl p-5 space-y-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-slate-400" /> FILTER PRODUCTS
              </h2>
              {isAnyFilterActive && (
                <button
                  onClick={resetAllFilters}
                  className="text-[10px] text-indigo-650 hover:text-indigo-800 font-black cursor-pointer transition-colors"
                >
                  Reset All
                </button>
              )}
            </div>
            {filterPanelBody}
          </aside>

          {/* The same filters as a slide-over, for phones and tablets. */}
          {isFilterDrawerOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
                onClick={() => setIsFilterDrawerOpen(false)}
              />
              <div className="absolute inset-y-0 left-0 flex w-full max-w-xs">
                <div className="w-full bg-white flex flex-col h-full shadow-2xl relative z-10 overflow-x-hidden animate-slide-in-left">
                  <div className="sticky top-0 z-20 bg-slate-50 border-b border-slate-150 px-4 py-4 flex items-center justify-between gap-2">
                    <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 min-w-0">
                      <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Filter Products</span>
                    </h2>
                    <button
                      onClick={() => setIsFilterDrawerOpen(false)}
                      aria-label="Close filters"
                      className="shrink-0 p-2 -mr-1 rounded-full hover:bg-slate-200 active:bg-slate-300 text-slate-600 cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                    {filterPanelBody}
                  </div>

                  <div className="border-t border-slate-200 bg-slate-50 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex gap-2 shrink-0">
                    {isAnyFilterActive && (
                      <button
                        onClick={resetAllFilters}
                        className="flex-1 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-black uppercase tracking-wider cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      onClick={() => setIsFilterDrawerOpen(false)}
                      className="flex-[2] py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      Show {collectionProducts.length} product{collectionProducts.length === 1 ? '' : 's'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RIGHT COLUMN - LISTINGS GRID & CONTROLS */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Sorting and View Mode Toolbar */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Only where the sidebar is hidden — from lg up the filters are
                    already on screen and a button would just be noise. */}
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className="lg:hidden shrink-0 flex items-center gap-1.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider px-3 py-2 rounded-lg cursor-pointer active:bg-slate-700"
                >
                  <Filter className="h-3.5 w-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-white text-slate-900 rounded-full min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center text-[10px] font-black">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                <span className="text-xs text-slate-500 font-semibold sm:pl-2 truncate">
                  Showing <strong className="text-slate-800">{collectionProducts.length}</strong> of {baseCollectionProducts.length} products
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                
                {/* Sort dropdown */}
                <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Sort by:</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="text-xs border border-slate-200 p-2 py-1.5 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 w-full sm:w-auto font-semibold text-slate-700"
                  >
                    <option value="featured">Best Sellers</option>
                    <option value="price-low-high">Price: Low to High</option>
                    <option value="price-high-low">Price: High to Low</option>
                    <option value="title-asc">Alphabetically: A-Z</option>
                  </select>
                </div>

                {/* Grid / List View Toggle */}
                <div className="bg-slate-100 rounded-lg p-0.5 flex items-center shrink-0">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-all ${
                      viewMode === 'grid' 
                        ? 'bg-slate-800 text-white shadow-xs' 
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title="Grid view"
                  >
                    <Grid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-all ${
                      viewMode === 'list' 
                        ? 'bg-slate-800 text-white shadow-xs' 
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title="List view"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>

              </div>
            </div>

            {/* Curated Product Listing Grid or List */}
            {collectionProducts.length > 0 ? (
              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5" 
                  : "space-y-4"
              }>
                {collectionProducts.map((prod, pIdx) => {
                  const inWishlist = isProductInWishlist(prod.id);
                  const strengthInfo = getProductStrength(prod);
                  
                  // Generate custom tags dynamic pairings to match exact design language
                  const subTags = (prod.tags || []).slice(0, 2).map(t => t.charAt(0).toUpperCase() + t.slice(1));
                  if (subTags.length === 0) {
                    subTags.push(prod.category || 'Pouch');
                    subTags.push('Official');
                  } else if (subTags.length === 1) {
                    subTags.push('Premium Blend');
                  }

                  const localQty = getProductQuantity(prod.id);

                  return (
                    <div 
                      key={`cdv-prod-${prod.id}-${pIdx}`} 
                      className={`bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4.5 flex transition-all group hover:shadow-sm relative ${
                        viewMode === 'grid' ? 'flex-col justify-between' : 'flex-row items-center gap-6 justify-between'
                      }`}
                    >
                      {/* Badge Tag indicator top-left (Best Seller / New / Brand) */}
                      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5">
                        {prod.tags.includes('best-seller') || prod.price < 4.50 ? (
                          <span className="bg-amber-500 text-white font-black text-[8px] uppercase tracking-widest py-1 px-2 rounded-md shadow-xs leading-none">
                            BEST SELLER
                          </span>
                        ) : prod.tags.includes('new') ? (
                          <span className="bg-emerald-600 text-white font-black text-[8px] uppercase tracking-widest py-1 px-2 rounded-md shadow-xs leading-none">
                            NEW
                          </span>
                        ) : (
                          <span className="bg-slate-800 text-slate-100 font-black text-[8px] uppercase tracking-widest py-1 px-2 rounded-md shadow-xs leading-none">
                            {prod.vendor || 'VELO'}
                          </span>
                        )}
                      </div>

                      {/* Wishlist Heart Top Right */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHeartClick(prod.id);
                        }}
                        className={`absolute top-4 right-4 z-20 p-1.5 rounded-full border shadow-xs transition-transform hover:scale-110 cursor-pointer bg-white ${
                          inWishlist 
                            ? 'border-red-100 text-red-500 bg-red-50/20' 
                            : 'border-slate-150 text-slate-400 hover:text-slate-600'
                        }`}
                        title={inWishlist ? "Saved in your Wishlist" : "Save to Wishlist"}
                      >
                        <Heart className={`h-4 w-4 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>

                      {/* CANISTER IMAGE SECTION */}
                      <div 
                        onClick={() => {
                          try {
                            const navArg = prod.isVariantCard
                              ? `${prod.parentSlug || prod.parentId}?variant=${prod.concreteVariantId}`
                              : (prod.slug || prod.id);
                            window.history.pushState({}, '', `/products/${navArg}`);
                          } catch (e) {}
                          onNavigate('product-detail', prod.isVariantCard
                            ? `${prod.parentSlug || prod.parentId}?variant=${prod.concreteVariantId}`
                            : (prod.slug || prod.id)
                          );
                        }}
                        className={`relative cursor-pointer flex items-center justify-center shrink-0 ${
                          viewMode === 'grid' 
                            ? 'w-full aspect-square mb-4.5 rounded-xl bg-transparent overflow-hidden' 
                            : 'w-32 h-32 rounded-xl bg-transparent overflow-hidden'
                        }`}
                      >
                        <img
                          src={cleanMediaUrl(prod.image) || PLACEHOLDER_IMAGE}
                          alt={prod.title}
                          className="w-full h-full object-contain p-1 transition-transform duration-300 group-hover:scale-105 relative z-10"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>

                      {/* PRODUCT METADATA INFO */}
                      <div className={`flex-1 flex flex-col justify-between ${viewMode === 'grid' ? 'space-y-4' : 'px-2'}`}>
                        <div className="space-y-2">
                          
                          {/* Colored category tags */}
                          <div className="flex flex-wrap gap-1">
                            {subTags.map((st, sIdx) => (
                              <span 
                                key={st + '-' + sIdx} 
                                className={`text-[8.5px] font-bold py-0.5 px-2 rounded-full ${
                                  sIdx === 0 
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200/50' 
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-150/40'
                                }`}
                              >
                                {st}
                              </span>
                            ))}
                          </div>

                          {/* Brand & Title */}
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                              {prod.vendor || 'Pouch'} Official
                            </span>
                            <h3 
                              onClick={() => {
                                try {
                                  const navArg = prod.isVariantCard
                                    ? `${prod.parentSlug || prod.parentId}?variant=${prod.concreteVariantId}`
                                    : (prod.slug || prod.id);
                                  window.history.pushState({}, '', `/products/${navArg}`);
                                } catch (e) {}
                                onNavigate('product-detail', prod.isVariantCard
                                  ? `${prod.parentSlug || prod.parentId}?variant=${prod.concreteVariantId}`
                                  : (prod.slug || prod.id)
                                );
                              }}
                              className="text-xs sm:text-sm font-black text-slate-800 tracking-tight leading-snug hover:text-indigo-650 transition-colors cursor-pointer"
                            >
                              {prod.title}
                            </h3>
                          </div>

                          {/* Nicotine Strength indicators */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map(dot => (
                                <span 
                                  key={dot}
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    dot <= strengthInfo.score 
                                      ? 'bg-amber-500 border border-amber-500' 
                                      : 'bg-slate-100 border border-slate-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-[9.5px] text-slate-400 font-bold">
                              Strength: <strong className="text-slate-600">{strengthInfo.label.split(' ')[0]}</strong>
                            </span>
                          </div>

                          {/* Pricing block with Volume Tier Calculations */}
                          {(() => {
                            const volumeTotal = calculateVolumePrice(prod.price, localQty);
                            const standardTotal = Number((prod.price * localQty).toFixed(2));
                            const hasVolumeDiscount = volumeTotal < standardTotal;
                            const effectiveUnitPrice = (volumeTotal / localQty).toFixed(2);

                            return (
                              <div className="space-y-1">
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                  <span className="text-sm sm:text-base font-black text-slate-900">
                                    £{volumeTotal.toFixed(2)}
                                  </span>
                                  {hasVolumeDiscount && (
                                    <span className="text-[10.5px] font-bold text-slate-400 line-through">
                                      £{standardTotal.toFixed(2)}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {localQty > 1 ? `(£${effectiveUnitPrice} each)` : 'each'}
                                  </span>
                                </div>

                                {hasVolumeDiscount && (
                                  <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-900 font-extrabold text-[9px] py-0.5 px-2 rounded-md">
                                    <span>Volume Savings Applied! (Saved £{(standardTotal - volumeTotal).toFixed(2)})</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Volume Tiers Quick Indicator */}
                          <div className="flex items-center gap-1 text-[8.5px] font-bold text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-150">
                            <span className="text-slate-700 font-extrabold shrink-0">Bundles:</span>
                            <span className={`px-1 rounded ${localQty === 5 ? 'bg-indigo-600 text-white font-extrabold' : 'text-slate-600'}`}>5=£23.50</span>
                            <span>•</span>
                            <span className={`px-1 rounded ${localQty === 10 ? 'bg-indigo-600 text-white font-extrabold' : 'text-slate-600'}`}>10=£42.00</span>
                            <span>•</span>
                            <span className={`px-1 rounded ${localQty === 20 ? 'bg-indigo-600 text-white font-extrabold' : 'text-slate-600'}`}>20=£77.00</span>
                          </div>

                        </div>

                        {/* Delivery quality badges list */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 py-1.5 border-t border-b border-slate-100 text-[8.5px] text-slate-400 font-bold">
                          <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-slate-350" /> Official Stock</span>
                          <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-slate-350" /> Ships Today</span>
                          <span className="flex items-center gap-1"><Award className="h-3 w-3 text-slate-350" /> Lab Tested</span>
                        </div>

                        {/* Pack size chooser. Sits above the basket CTA so the
                            pack — and its price — is picked before adding. The
                            stepper below still works for quantities that are not
                            one of the packs. */}
                        <div className="pt-2">
                          <PackSizeSelect
                            unitPrice={prod.price}
                            quantity={localQty}
                            disabled={prod.inventory === 0}
                            onChange={(qty) => setQuantities(prev => ({ ...prev, [prod.id]: qty }))}
                          />
                        </div>

                        {/* Quantity selection & Action CTA Row */}
                        <div className="flex items-center justify-between gap-2.5 pt-2">

                          {/* Basket trigger CTA */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(prod, localQty);
                              // Reset local quantity to 1 after successful add
                              setQuantities(prev => ({ ...prev, [prod.id]: 1 }));
                            }}
                            disabled={prod.inventory === 0}
                            className={`flex-1 font-extrabold py-2 px-3 text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer ${
                              prod.inventory > 0
                                ? 'bg-slate-950 hover:bg-slate-850 text-white'
                                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            }`}
                          >
                            <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
                            <span>{prod.inventory > 0 ? 'Add to Basket' : 'Out of Stock'}</span>
                          </button>

                          {/* Local Quantity selector */}
                          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl h-9 shrink-0 px-1 overflow-hidden">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(prod.id, -1);
                              }}
                              className="w-7 h-7 text-slate-500 hover:text-slate-850 font-extrabold flex items-center justify-center text-xs transition-colors"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-xs font-black text-slate-800 font-mono">
                              {localQty}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(prod.id, 1);
                              }}
                              className="w-7 h-7 text-slate-500 hover:text-slate-850 font-extrabold flex items-center justify-center text-xs transition-colors"
                            >
                              +
                            </button>
                          </div>

                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border rounded-2xl p-16 text-center space-y-4 max-w-md mx-auto">
                <span className="text-5xl block">🥫</span>
                <h3 className="font-black text-slate-800 text-sm">No Matching Cans Found</h3>
                <p className="text-slate-450 text-xs leading-normal">
                  There currently aren't any products loaded matching your selected filters under this collection catalog.
                </p>
                <button
                  onClick={resetAllFilters}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
