import React, { useState, useMemo } from 'react';
import { Product, Collection, Customer } from '../types';
import { cleanMediaUrl } from '../utils/mediaUtils';
import { calculateVolumePrice } from '../utils';
import { PackSizeSelect } from './PackSizeSelect';
import { 
  Search, Heart, ArrowUpDown, Tag, ShoppingCart, Info, Sparkles, 
  Grid, List, Check, CheckCircle2, ChevronRight, HelpCircle, 
  X, Award, ShieldCheck, Zap, Flame, RefreshCw, Compass, Filter
} from 'lucide-react';

interface ProductsGridProps {
  products: Product[];
  collections: Collection[];
  activeCollectionId: string;
  onActiveCollectionChange: (id: string) => void;
  loggedInCustomer: Customer | null;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenLoginModal?: () => void;
}

export default function ProductsGrid({
  products,
  collections,
  activeCollectionId,
  onActiveCollectionChange,
  loggedInCustomer,
  onToggleWishlist,
  onAddToCart,
  onOpenLoginModal
}: ProductsGridProps) {
  // Dynamic max price calculation based on catalog items
  const maxCatalogPrice = useMemo(() => {
    if (!products || products.length === 0) return 100;
    const maxVal = Math.max(...products.map(p => p.price || 0));
    return Math.max(20, Math.ceil(maxVal));
  }, [products]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);
  const [selectedFlavours, setSelectedFlavours] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number>(100);
  
  // Custom Toggles
  const [inStockOnly, setInStockOnly] = useState(false);
  const [subscriptionEligible, setSubscriptionEligible] = useState(true);
  const [bestSellersOnly, setBestSellersOnly] = useState(false);
  const [newArrivalsOnly, setNewArrivalsOnly] = useState(false);

  // Layout & Sorting
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('featured');

  // Sidebar expanders
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showAllFlavours, setShowAllFlavours] = useState(false);

  // Local product quantities
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Quiz Modal State
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(1);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<Product | null>(null);

  // Dynamic Brands & Counts from raw products list
  const allBrandsInStore = useMemo(() => {
    return Array.from(new Set(products.map(p => p.vendor))).filter(Boolean);
  }, [products]);

  // Handle wishlist clicks safely
  const handleHeartClick = (pId: string) => {
    if (!loggedInCustomer) {
      if (onOpenLoginModal) {
        onOpenLoginModal();
      } else {
        alert("Wishlist feature is only accessible when logged in. Please sign in or register through the Account page first.");
      }
      return;
    }
    onToggleWishlist(pId);
  };

  const isProductInWishlist = (pId: string) => {
    if (!loggedInCustomer) return false;
    return Boolean(loggedInCustomer.wishlist && Array.isArray(loggedInCustomer.wishlist) && loggedInCustomer.wishlist.includes(pId));
  };

  // Checkbox helpers
  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const toggleStrength = (strength: string) => {
    setSelectedStrengths(prev => 
      prev.includes(strength) ? prev.filter(s => s !== strength) : [...prev, strength]
    );
  };

  const toggleFlavour = (flavour: string) => {
    setSelectedFlavours(prev => 
      prev.includes(flavour) ? prev.filter(f => f !== flavour) : [...prev, flavour]
    );
  };

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedBrands([]);
    setSelectedStrengths([]);
    setSelectedFlavours([]);
    setPriceRange(maxCatalogPrice);
    setInStockOnly(false);
    setSubscriptionEligible(false);
    setBestSellersOnly(false);
    setNewArrivalsOnly(false);
  };

  // Helper to map products to generic strengths
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

  // Helper to map products to generic flavours
  const getProductFlavours = (p: Product): string[] => {
    const result: string[] = [];
    
    if (p.flavour) {
      result.push(p.flavour.toLowerCase());
    } else {
      const titleL = p.title.toLowerCase();
      const tagString = (p.tags || []).join(' ').toLowerCase();
      
      if (titleL.includes('mint') || titleL.includes('menthol') || titleL.includes('ice') || tagString.includes('mint') || tagString.includes('fresh')) {
        result.push('mint');
      }
      if (titleL.includes('berry') || titleL.includes('cherry') || titleL.includes('strawberry') || titleL.includes('raspberry') || tagString.includes('berry')) {
        result.push('berry');
      }
      if (titleL.includes('citrus') || titleL.includes('lemon') || titleL.includes('lime') || titleL.includes('orange') || tagString.includes('citrus')) {
        result.push('citrus');
      }
      if (titleL.includes('fruit') || titleL.includes('grape') || titleL.includes('mango') || titleL.includes('apple') || titleL.includes('peach') || tagString.includes('fruit')) {
        result.push('fruit');
      }
      if (titleL.includes('cola') || titleL.includes('soda') || tagString.includes('cola')) {
        result.push('cola');
      }
      if (titleL.includes('coffee') || titleL.includes('latte') || titleL.includes('mocha') || tagString.includes('coffee')) {
        result.push('coffee');
      }
      if (titleL.includes('sweet') || titleL.includes('candy') || tagString.includes('sweet')) {
        result.push('sweet');
      }
      if (titleL.includes('tea') || titleL.includes('chai') || titleL.includes('matcha') || tagString.includes('tea')) {
        result.push('tea');
      }
      if (titleL.includes('other') || tagString.includes('other')) {
        result.push('other');
      }
    }
    
    if (result.length === 0) {
      result.push('mint');
    }
    return result;
  };

  // Expand product variants into individual virtual products
  const expandedProducts = useMemo(() => {
    const list: Product[] = [];
    products.forEach(p => {
      if (p.status !== 'Active') return;
      if (p.concreteVariants && p.concreteVariants.length > 0) {
        p.concreteVariants.forEach(variant => {
          list.push({
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
        list.push(p);
      }
    });

    const seen = new Set<string>();
    return list.filter(p => {
      if (!p.id) return false;
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [products]);

  // Filtered list implementation
  const filteredProducts = useMemo(() => {
    let list = expandedProducts;

    // Filter by Active Collection selector (if not 'all')
    const currentCollection = collections.find(c => c.id === activeCollectionId) || collections[0];
    if (currentCollection && currentCollection.id !== 'all') {
      list = list.filter(p => {
        const checkId = p.parentId || p.id;
        return currentCollection.productIds.includes(checkId);
      });
    }

    // Search query filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.vendor.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q)
      );
    }

    // Brand checkbox filter
    if (selectedBrands.length > 0) {
      list = list.filter(p => selectedBrands.includes(p.vendor));
    }

    // Strength checkbox filter
    if (selectedStrengths.length > 0) {
      list = list.filter(p => {
        const strInfo = getProductStrength(p);
        return selectedStrengths.includes(strInfo.id);
      });
    }

    // Flavour checkbox filter
    if (selectedFlavours.length > 0) {
      list = list.filter(p => {
        const pFlavours = getProductFlavours(p);
        return pFlavours.some(f => selectedFlavours.includes(f));
      });
    }

    // Max Price slider filter
    list = list.filter(p => priceRange >= maxCatalogPrice || p.price <= priceRange);

    // Stock availability toggle
    if (inStockOnly) {
      list = list.filter(p => p.inventory === undefined || p.inventory > 0);
    }

    // Best Sellers / Featured toggle
    if (bestSellersOnly) {
      list = list.filter(p => p.tags.includes('best-seller') || p.tags.includes('featured') || p.compareAtPrice > p.price);
    }

    // New arrivals toggle
    if (newArrivalsOnly) {
      list = list.filter(p => p.tags.includes('new') || p.tags.includes('latest'));
    }

    // Sorting implementations
    if (sortBy === 'featured') {
      // Default / Featured sequence
    } else if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'title-asc') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'title-desc') {
      list = [...list].sort((a, b) => b.title.localeCompare(a.title));
    }

    return list;
  }, [
    expandedProducts, collections, activeCollectionId, searchTerm, 
    selectedBrands, selectedStrengths, selectedFlavours, 
    priceRange, inStockOnly, bestSellersOnly, newArrivalsOnly, sortBy
  ]);

  // Dynamic filter lists counting stats
  const filterCounts = useMemo(() => {
    const brandCounts: Record<string, number> = {};
    const strengthCounts: Record<string, number> = { mild: 0, regular: 0, strong: 0, xstrong: 0 };
    const flavourCounts: Record<string, number> = { mint: 0, berry: 0, citrus: 0, fruit: 0, cola: 0, coffee: 0 };

    expandedProducts.forEach(p => {
      // Brand count
      if (p.vendor) {
        brandCounts[p.vendor] = (brandCounts[p.vendor] || 0) + 1;
      }

      // Strength count
      const strInfo = getProductStrength(p);
      if (strengthCounts[strInfo.id] !== undefined) {
        strengthCounts[strInfo.id]++;
      }

      // Flavour count
      const flavs = getProductFlavours(p);
      flavs.forEach(f => {
        if (f in flavourCounts) flavourCounts[f]++;
      });
    });

    return { brandCounts, strengthCounts, flavourCounts };
  }, [expandedProducts]);

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

  // Quiz controller
  const handleStartQuiz = () => {
    setIsQuizOpen(true);
    setQuizStep(1);
    setQuizAnswers({});
    setQuizResult(null);
  };

  const handleSelectQuizAnswer = (question: string, answer: string) => {
    const nextAnswers = { ...quizAnswers, [question]: answer };
    setQuizAnswers(nextAnswers);

    if (quizStep < 3) {
      setQuizStep(prev => prev + 1);
    } else {
      // Calculate recommended product based on quiz answers
      const level = nextAnswers['strength'] === 'gentle' ? 'mild' :
                    nextAnswers['strength'] === 'standard' ? 'regular' :
                    nextAnswers['strength'] === 'energetic' ? 'strong' : 'xstrong';
      
      const flavorMatch = nextAnswers['flavor']; // mint, berry, citrus, fruit, cola, coffee
      
      // Search candidate
      let match = products.find(p => {
        if (p.status !== 'Active') return false;
        const sInfo = getProductStrength(p);
        const fInfo = getProductFlavours(p);
        return sInfo.id === level && fInfo.includes(flavorMatch);
      });

      // Broaden search if exact match doesn't exist
      if (!match) {
        match = products.find(p => p.status === 'Active' && getProductStrength(p).id === level);
      }
      if (!match) {
        match = products.find(p => p.status === 'Active');
      }

      setQuizResult(match || null);
      setQuizStep(4);
    }
  };

  const handleAddQuizRecommendedToCart = () => {
    if (quizResult) {
      onAddToCart(quizResult, 1);
      setIsQuizOpen(false);
    }
  };

  return (
    <div id="shop-grids-page" className="w-full bg-[#f8fafc]/40 pb-12 animate-fade-in">
      
      {/* Dynamic top safety/certification bar */}
      <div className="bg-white border-b border-slate-100 py-2.5 px-4 text-[10px] sm:text-[11px] text-slate-500 font-bold tracking-wide">
        <div className="max-w-[1440px] mx-auto w-full flex flex-wrap justify-between items-center gap-y-2 gap-x-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mx-auto sm:mx-0">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="text-sm">🇪🇺</span> EU Official Supplier
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="text-sm">🚚</span> Royal Mail Tracked Delivery
            </span>
          </div>
          <div className="flex items-center gap-6 mx-auto sm:mx-0">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="text-sm">🔒</span> Secure Checkout
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="text-sm">🛡️</span> AgeChecked Age Verified
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        
        {/* White Header Banner Block */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col lg:flex-row justify-between items-stretch gap-6 shadow-xs relative overflow-hidden">
          
          {/* Left Column (Brand title and Trustpilot details) */}
          <div className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                Shop Pouches
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Over 150+ premium flavours from the world's leading brands.
              </p>
              
              {/* Pills row */}
              <div className="flex flex-wrap gap-2 pt-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-50/80 border border-slate-150 py-1.5 px-3 rounded-full">
                  🚚 Tracked UK Delivery
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-50/80 border border-slate-150 py-1.5 px-3 rounded-full">
                  🇸🇪 Fresh Stock
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-50/80 border border-slate-150 py-1.5 px-3 rounded-full">
                  🛡️ Official Brands
                </span>
              </div>
            </div>

            {/* Trustpilot Score */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium">
              <span className="text-slate-800 font-bold">Excellent</span>
              <div className="flex items-center gap-0.5 text-emerald-500">
                <span className="h-4 w-4 bg-emerald-550 text-white rounded-xs flex items-center justify-center font-bold text-[9px]">★</span>
                <span className="h-4 w-4 bg-emerald-550 text-white rounded-xs flex items-center justify-center font-bold text-[9px]">★</span>
                <span className="h-4 w-4 bg-emerald-550 text-white rounded-xs flex items-center justify-center font-bold text-[9px]">★</span>
                <span className="h-4 w-4 bg-emerald-550 text-white rounded-xs flex items-center justify-center font-bold text-[9px]">★</span>
                <span className="h-4 w-4 bg-emerald-550 text-white rounded-xs flex items-center justify-center font-bold text-[9px]">★</span>
              </div>
              <span>4.9/5 from 500+ reviews</span>
              <span className="text-slate-400">|</span>
              <span className="flex items-center gap-1 text-slate-800 font-extrabold tracking-tight">
                <span className="text-emerald-500">★</span> Trustpilot
              </span>
            </div>
          </div>

          {/* Right Column (SAVE MORE WITH SUBSCRIPTION Box) */}
          <div className="lg:w-[380px] bg-slate-50 border border-slate-150 rounded-xl p-4.5 flex items-center justify-between gap-4 relative overflow-hidden group">
            <div className="space-y-2.5 z-10 max-w-[210px]">
              <span className="inline-flex items-center gap-1 text-[8.5px] font-extrabold tracking-widest text-amber-600 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full uppercase">
                ⭐ SAVE MORE WITH SUBSCRIPTION
              </span>
              <h3 className="text-sm font-black text-slate-800 leading-tight">
                Save up to 20% on every order
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                Choose any flavours • Change anytime
              </p>
              
              <button 
                onClick={() => {
                  try {
                    window.history.pushState({}, '', '/subscribe');
                  } catch (e) {}
                  window.dispatchEvent(new Event('popstate'));
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10.5px] py-2 px-4 rounded-lg flex items-center gap-1 shadow-sm transition-all cursor-pointer"
              >
                <span>Compare Plans</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {/* Custom high-fidelity CSS 3D Box Illustration */}
            <div className="relative w-28 h-24 flex items-center justify-center shrink-0">
              {/* Outer perspective wrapper */}
              <div className="w-24 h-16 bg-slate-900 border border-slate-800 rounded-lg shadow-md flex flex-col justify-end p-2 relative overflow-hidden transform group-hover:scale-103 transition-transform">
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 to-slate-850 opacity-95" />
                
                {/* Simulated box depth line */}
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-750" />
                
                <div className="relative z-10 text-[7px] font-extrabold text-amber-500 tracking-widest">POUCH</div>
                <div className="relative z-10 text-[9px] font-black text-white tracking-widest leading-none">SUPPLY</div>
                
                {/* Canisters popping out dynamically */}
                <div className="absolute -top-5 -left-1 w-9 h-9 rounded-full bg-indigo-650 border border-indigo-400 shadow-lg flex items-center justify-center text-[7px] font-black text-white transform -rotate-12 animate-bounce duration-2000">
                  ZYN
                </div>
                <div className="absolute -top-7 right-4 w-10 h-10 rounded-full bg-emerald-650 border border-emerald-400 shadow-xl flex items-center justify-center text-[7.5px] font-black text-white transform rotate-12">
                  77
                </div>
                <div className="absolute -top-4 -right-2 w-9 h-9 rounded-full bg-rose-600 border border-rose-450 shadow-lg flex items-center justify-center text-[7px] font-black text-white transform -rotate-6">
                  VELO
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Catalog Main Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* LEFT SIDEBAR - FILTER PRODUCTS PANEL */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-6 shadow-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-slate-400" /> FILTER PRODUCTS
              </h2>
              {(selectedBrands.length > 0 || selectedStrengths.length > 0 || selectedFlavours.length > 0 || priceRange < 6.00 || !inStockOnly || bestSellersOnly || newArrivalsOnly) && (
                <button
                  onClick={resetAllFilters}
                  className="text-[10px] text-indigo-650 hover:text-indigo-800 font-black cursor-pointer transition-colors"
                >
                  Reset all filters
                </button>
              )}
            </div>

            {/* Keyword search inside sidebar */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Search Products</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs p-2.5 pb-2.5 pl-8 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 bg-slate-50/50"
                />
                <Search className="absolute left-2.5 top-3 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            {/* 1. BRAND CHECKBOX LIST */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Brand</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <label className="flex items-center justify-between text-xs text-slate-700 font-semibold hover:text-slate-900 cursor-pointer py-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedBrands.length === 0}
                      onChange={() => setSelectedBrands([])}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 h-3.5 w-3.5"
                    />
                    <span>All Brands</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded">
                    {products.length}
                  </span>
                </label>

                {allBrandsInStore.slice(0, showAllBrands ? undefined : 6).map(brand => {
                  const count = filterCounts.brandCounts[brand] || 0;
                  const isChecked = selectedBrands.includes(brand);
                  return (
                    <label key={brand} className="flex items-center justify-between text-xs text-slate-700 font-semibold hover:text-slate-900 cursor-pointer py-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleBrand(brand)}
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

              {allBrandsInStore.length > 6 && (
                <button
                  onClick={() => setShowAllBrands(!showAllBrands)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1 focus:outline-none"
                >
                  <span>{showAllBrands ? 'Show less' : 'Show more'}</span>
                  <span className="text-[8px]">{showAllBrands ? '▲' : '▼'}</span>
                </button>
              )}
            </div>

            {/* 2. STRENGTH CHECKBOX LIST */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                <span>Strength</span>
                <span title="Strength mapped dynamically from standard nicotine weight levels"><HelpCircle className="h-3 w-3 text-slate-300 cursor-help" /></span>
              </div>
              <div className="space-y-1.5">
                {[
                  { id: 'mild', label: 'Mild (1-5mg)' },
                  { id: 'regular', label: 'Regular (6-10mg)' },
                  { id: 'strong', label: 'Strong (11-16mg)' },
                  { id: 'xstrong', label: 'X-Strong (17mg+)' }
                ].map(str => {
                  const isChecked = selectedStrengths.includes(str.id);
                  const count = filterCounts.strengthCounts[str.id] || 0;
                  return (
                    <label key={str.id} className="flex items-center justify-between text-xs text-slate-700 font-semibold hover:text-slate-900 cursor-pointer py-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStrength(str.id)}
                          className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-3.5 w-3.5"
                        />
                        <span>{str.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded">
                        {count}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 3. FLAVOUR CHECKBOX LIST WITH DECORATIVE DOTS */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Flavour</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {[
                  { id: 'mint', label: 'Mint', dotColor: 'bg-emerald-400' },
                  { id: 'berry', label: 'Berry', dotColor: 'bg-rose-400' },
                  { id: 'citrus', label: 'Citrus', dotColor: 'bg-amber-400' },
                  { id: 'fruit', label: 'Fruit', dotColor: 'bg-orange-400' },
                  { id: 'cola', label: 'Cola', dotColor: 'bg-amber-800' },
                  { id: 'coffee', label: 'Coffee', dotColor: 'bg-yellow-800' },
                  { id: 'sweet', label: 'Sweet', dotColor: 'bg-pink-400' },
                  { id: 'tea', label: 'Tea', dotColor: 'bg-teal-600' },
                  { id: 'other', label: 'Other', dotColor: 'bg-slate-400' }
                ].slice(0, showAllFlavours ? undefined : 6).map(flav => {
                  const isChecked = selectedFlavours.includes(flav.id);
                  const count = filterCounts.flavourCounts[flav.id] || 0;
                  return (
                    <label key={flav.id} className="flex items-center justify-between text-xs text-slate-700 font-semibold hover:text-slate-900 cursor-pointer py-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFlavour(flav.id)}
                          className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-3.5 w-3.5"
                        />
                        <span className={`h-2 w-2 rounded-full ${flav.dotColor} inline-block shrink-0`} />
                        <span>{flav.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded">
                        {count}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Show more flavours toggle if list expands */}
              <button
                onClick={() => setShowAllFlavours(!showAllFlavours)}
                className="text-[10px] text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1 focus:outline-none pt-1"
              >
                <span>{showAllFlavours ? 'Show less' : 'Show more'}</span>
                <span className="text-[8px]">{showAllFlavours ? '▲' : '▼'}</span>
              </button>
            </div>

            {/* 4. PRICE RANGE SLIDER */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                <span>Price Range</span>
                <span className="text-slate-800 font-black text-xs">
                  {priceRange >= maxCatalogPrice ? `All Prices (£${maxCatalogPrice.toFixed(2)}+)` : `Max £${priceRange.toFixed(2)}`}
                </span>
              </div>
              <input
                type="range"
                min="1.00"
                max={maxCatalogPrice}
                step="0.50"
                value={Math.min(priceRange, maxCatalogPrice)}
                onChange={(e) => setPriceRange(parseFloat(e.target.value))}
                className="w-full accent-slate-950 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                <span>£1.00</span>
                <span>£{maxCatalogPrice}.00+</span>
              </div>
            </div>

            {/* 5. AVAILABILITY CHECKBOX MATRIX */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100">
              <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold hover:text-slate-900 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-3.5 w-3.5"
                />
                <span>In Stock Only</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold hover:text-slate-900 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={subscriptionEligible}
                  onChange={(e) => setSubscriptionEligible(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-3.5 w-3.5"
                />
                <span>Subscription Eligible</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold hover:text-slate-900 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={bestSellersOnly}
                  onChange={(e) => setBestSellersOnly(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-3.5 w-3.5"
                />
                <span>Best Sellers</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold hover:text-slate-900 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={newArrivalsOnly}
                  onChange={(e) => setNewArrivalsOnly(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-3.5 w-3.5"
                />
                <span>New Arrivals</span>
              </label>
            </div>

          </div>

          {/* RIGHT CONTAINER - CATALOG PRODUCTS GRID */}
          <div className="lg:col-span-3 space-y-5">
            
            {/* Toolbar section */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold pl-2">
                Showing <strong className="text-slate-800">{filteredProducts.length}</strong> of {products.length} products
              </span>
              
              <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                
                {/* Sort dropdown */}
                <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Sort by:</span>
                  <select
                    id="shop-sort-by"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs border border-slate-200 p-2 py-1.5 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 w-full sm:w-auto font-semibold text-slate-700"
                  >
                    <option value="featured">Best Sellers</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="title-asc">Alphabetically: A-Z</option>
                    <option value="title-desc">Alphabetically: Z-A</option>
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

            {/* Empty filter state */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl p-8 space-y-4 shadow-xs">
                <span className="text-4xl block">🔍</span>
                <h3 className="font-extrabold text-slate-800 text-sm">No Products Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  None of our active products match your combination of filters. Try clearing some selections or search for another keyword.
                </p>
                <button
                  onClick={resetAllFilters}
                  className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl cursor-pointer transition-colors"
                >
                  Reset Search Filters
                </button>
              </div>
            ) : (
              /* PRODUCTS LIST (GRID OR LIST VIEW MODE) */
              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5" 
                  : "space-y-4"
              }>
                {filteredProducts.map((prod, pIdx) => {
                  const inWishlist = isProductInWishlist(prod.id);
                  const strengthInfo = getProductStrength(prod);
                  
                  // Generate custom tag pairings dynamically to mimic exact photo aesthetics
                  const subTags = prod.tags.slice(0, 2).map(t => t.charAt(0).toUpperCase() + t.slice(1));
                  if (subTags.length === 0) {
                    subTags.push(prod.category || 'Pouch');
                    subTags.push('Official');
                  } else if (subTags.length === 1) {
                    subTags.push('Premium Blend');
                  }

                  // Local quantity for this product
                  const localQty = getProductQuantity(prod.id);

                  return (
                    <div 
                      key={`pg-prod-${prod.id}-${pIdx}`} 
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
                        onClick={() => handleHeartClick(prod.id)}
                        className={`absolute top-4 right-4 z-20 p-1.5 rounded-full border shadow-xs transition-transform hover:scale-110 cursor-pointer bg-white ${
                          inWishlist 
                            ? 'border-red-100 text-red-500 bg-red-50/20' 
                            : 'border-slate-150 text-slate-400 hover:text-slate-600'
                        }`}
                        title={inWishlist ? "Saved in your Wishlist" : "Save to Wishlist"}
                      >
                        <Heart className={`h-4 w-4 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>

                      {/* CANISTER IMAGE SECTION (With radial background for maximum pop) */}
                      <div 
                        onClick={() => {
                          try {
                            const navArg = prod.isVariantCard
                              ? `${prod.parentSlug || prod.parentId}?variant=${prod.concreteVariantId}`
                              : (prod.slug || prod.id);
                            window.history.pushState({}, '', `/products/${navArg}`);
                          } catch (e) {}
                          window.dispatchEvent(new Event('popstate'));
                        }}
                        className={`relative cursor-pointer flex items-center justify-center shrink-0 ${
                          viewMode === 'grid' 
                            ? 'w-full aspect-square mb-4.5 rounded-xl bg-transparent overflow-hidden' 
                            : 'w-32 h-32 rounded-xl bg-transparent overflow-hidden'
                        }`}
                      >
                        <img
                          src={prod.image}
                          alt={prod.title}
                          className="w-full h-full object-contain p-1 transition-transform duration-300 group-hover:scale-105 relative z-10"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* PRODUCT METADATA INFO */}
                      <div className={`flex-1 flex flex-col justify-between ${viewMode === 'grid' ? 'space-y-4' : 'px-2'}`}>
                        <div className="space-y-2">
                          
                          {/* Colored category tags */}
                          <div className="flex flex-wrap gap-1">
                            {subTags.map((st, sIdx) => (
                              <span 
                                key={sIdx} 
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
                                window.dispatchEvent(new Event('popstate'));
                              }}
                              className="text-xs sm:text-sm font-black text-slate-800 tracking-tight leading-snug hover:text-indigo-650 transition-colors cursor-pointer"
                            >
                              {prod.title}
                            </h3>
                          </div>

                          {/* Nicotine Strength indicators (Filled/Unfilled dots based on strength level) */}
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

                          

                        </div>

                        

                        {/* Pack size chooser. Sits above the basket CTA so the
                            pack — and its price — is picked before adding. The
                            stepper below still works for quantities that are not
                            one of the packs. */}
                        <div className="pt-2">
                          <PackSizeSelect
                            unitPrice={prod.price}
                            quantity={localQty}
                            onChange={(qty) => setQuantities(prev => ({ ...prev, [prod.id]: qty }))}
                          />
                        </div>

                        {/* Quantity selection & Action CTA Row */}
                        <div className="flex items-center justify-between gap-2.5 pt-2">

                          {/* Basket trigger CTA */}
                          <button
                            onClick={() => {
                              onAddToCart(prod, localQty);
                              // reset local quantity to 1 after successful add
                              setQuantities(prev => ({ ...prev, [prod.id]: 1 }));
                            }}
                            className="flex-1 bg-slate-950 hover:bg-slate-850 text-white font-extrabold py-2 px-3 text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
                          >
                            <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
                            <span>Add to Basket</span>
                          </button>

                          {/* Local Quantity selector */}
                          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl h-9 shrink-0 px-1 overflow-hidden">
                            <button
                              onClick={() => handleQuantityChange(prod.id, -1)}
                              className="w-7 h-7 text-slate-500 hover:text-slate-850 font-extrabold flex items-center justify-center text-xs transition-colors"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-xs font-black text-slate-800 font-mono">
                              {localQty}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(prod.id, 1)}
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
            )}

            {/* Banner: Build Your Box & Save */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden shadow-xs">
              <div className="absolute right-0 top-0 opacity-15 pointer-events-none blur-2xl bg-amber-500 h-64 w-64 rounded-full" />
              
              <div className="space-y-3 z-10 text-center md:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-amber-550 text-slate-950 font-black text-[9px] uppercase tracking-wider leading-none">
                    ⭐ EXCLUSIVE PACKS
                  </span>
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-none">
                    Build Your Box & Save
                  </h3>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Add any 8 cans to your subscription box and save up to 20%
                </p>
                
                {/* Tickmarks checklist */}
                <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1.5 pt-1 text-[10px] text-slate-300 font-bold">
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-amber-500 shrink-0" /> Mix any brands</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-amber-500 shrink-0" /> Change anytime</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-amber-500 shrink-0" /> Skip or pause</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-amber-500 shrink-0" /> Free delivery on Pro & Ultimate</span>
                </div>
              </div>

              {/* Graphic + Build Button */}
              <div className="flex items-center gap-4 z-10">
                <div className="hidden sm:flex items-center -space-x-4">
                  <div className="w-10 h-10 rounded-full bg-slate-850 border border-slate-700 shadow-lg flex items-center justify-center text-[8px] font-black transform -rotate-12">ZYN</div>
                  <div className="w-10 h-10 rounded-full bg-indigo-950 border border-indigo-700 shadow-xl flex items-center justify-center text-[8px] font-black transform rotate-12">VELO</div>
                  <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-700 shadow-lg flex items-center justify-center text-[8px] font-black transform -rotate-6">77</div>
                </div>
                
                <button
                  onClick={() => {
                    try {
                      window.history.pushState({}, '', '/subscribe');
                    } catch (e) {}
                    window.dispatchEvent(new Event('popstate'));
                  }}
                  className="bg-amber-550 hover:bg-amber-600 text-slate-950 font-black text-xs py-2.5 px-6 rounded-xl flex items-center gap-1 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>Build Your Box</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Bottom Section: Recently Viewed & Matchmaker Strength Quiz */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
              
              {/* Recently Viewed block (2 cols) */}
              <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-4.5 space-y-4 shadow-xs">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Recently Viewed
                  </h3>
                  <button 
                    onClick={() => {
                      setSelectedBrands([]);
                      setSelectedStrengths([]);
                    }}
                    className="text-[10px] font-bold text-slate-400 hover:text-indigo-650"
                  >
                    View all
                  </button>
                </div>

                {/* Horizontal canisters row */}
                <div className="flex items-center gap-4 overflow-x-auto py-1.5 scrollbar-thin">
                  {products.slice(0, 5).map((p, idx) => (
                    <div 
                      key={`pg-rv-${p.id || idx}-${idx}`}
                      onClick={() => {
                        try {
                          window.history.pushState({}, '', `/products/${p.slug || p.id}`);
                        } catch (e) {}
                        window.dispatchEvent(new Event('popstate'));
                      }}
                      className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                    >
                      <div className="w-11 h-11 rounded-full bg-slate-50 border border-slate-150/80 p-1.5 relative flex items-center justify-center group-hover:border-slate-350 transition-colors shadow-xs">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(226,232,240,0.7)_0%,transparent_70%)]" />
                        <img 
                          src={cleanMediaUrl(p.image)} 
                          alt={p.title} 
                          className="w-8 h-8 object-contain relative z-10 group-hover:scale-108 transition-transform" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="text-[9px] font-black text-slate-700 uppercase tracking-tighter">
                        {p.vendor || 'VELO'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Take strength quiz Matchmaker Block (1 col) */}
              <div className="bg-emerald-50/50 border border-emerald-150/60 rounded-2xl p-4.5 flex flex-col justify-between space-y-3 shadow-xs">
                <div className="space-y-1.5">
                  <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                    🎯
                  </div>
                  <h4 className="text-xs font-black text-slate-800 leading-tight">
                    Not sure what strength?
                  </h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-normal">
                    Find your perfect compounding pouch match in 3 clicks.
                  </p>
                </div>

                <button
                  onClick={handleStartQuiz}
                  className="w-full text-center bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-250 font-black text-[10px] py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                >
                  <span>Take Strength Quiz</span>
                  <ChevronRight className="h-3 w-3 text-emerald-700" />
                </button>
              </div>

            </div>

            {/* Quick delivery disclaimer banner */}
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 text-amber-800 shadow-xs">
              <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold block text-amber-900 leading-snug">Age Restricted Nicotine Pouches Policy</span>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  By purchasing these items you strictly affirm you meet the full age criteria (18+/21+ depending on country regulations). Full verification triggers prior to any shipping handovers.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* QUIZ DIALOG OVERLAY */}
      {isQuizOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-6">
            
            {/* Close */}
            <button 
              onClick={() => setIsQuizOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Quiz Heading */}
            <div className="text-center space-y-1.5">
              <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-55/90 border border-emerald-200/50 px-2.5 py-1 rounded-full">
                🎯 Pouch Matchmaker
              </span>
              <h3 className="text-base font-black text-slate-900">
                Pouch Strength & Flavour Quiz
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Answer these simple questions to find your optimal formula
              </p>
            </div>

            {/* STEP 1: Nicotine Experience */}
            {quizStep === 1 && (
              <div className="space-y-3 animate-fade-in">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider text-center">
                  Question 1 of 3
                </span>
                <p className="text-xs font-bold text-slate-700 text-center pb-1">
                  Have you used nicotine pouches or vaping before?
                </p>
                <div className="space-y-2">
                  {[
                    { id: 'none', title: 'No, I am completely new', desc: 'Recommends mild & gentle pouch lines' },
                    { id: 'occasional', title: 'Yes, occasionally / social user', desc: 'Recommends regular or intermediate strengths' },
                    { id: 'regular', title: 'Yes, regular user / smoker fallback', desc: 'Recommends strong or intense formulas' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectQuizAnswer('experience', opt.id)}
                      className="w-full text-left p-3 border border-slate-200 hover:border-indigo-500 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer space-y-0.5"
                    >
                      <span className="text-xs font-black text-slate-800 block">{opt.title}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Flavor preferences */}
            {quizStep === 2 && (
              <div className="space-y-3 animate-fade-in">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider text-center">
                  Question 2 of 3
                </span>
                <p className="text-xs font-bold text-slate-700 text-center pb-1">
                  What kind of flavour palette appeals to you the most?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'mint', label: 'Minty & Frosty ❄️' },
                    { id: 'berry', label: 'Berry & Sour 🍒' },
                    { id: 'citrus', label: 'Zesty Citrus 🍋' },
                    { id: 'fruit', label: 'Sweet Fruit 🥭' },
                    { id: 'cola', label: 'Classic Cola 🥤' },
                    { id: 'coffee', label: 'Warm Coffee ☕' },
                    { id: 'sweet', label: 'Sugary Sweet 🍭' },
                    { id: 'tea', label: 'Soothing Tea 🍵' },
                    { id: 'other', label: 'Other Blends 🧪' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectQuizAnswer('flavor', opt.id)}
                      className="p-3 text-center border border-slate-200 hover:border-indigo-500 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer text-xs font-black text-slate-800"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: Nicotine Kick intensity */}
            {quizStep === 3 && (
              <div className="space-y-3 animate-fade-in">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider text-center">
                  Question 3 of 3
                </span>
                <p className="text-xs font-bold text-slate-700 text-center pb-1">
                  What level of kick intensity or feeling do you prefer?
                </p>
                <div className="space-y-2">
                  {[
                    { id: 'gentle', label: 'Gentle (1-5mg/g) - Smooth and lightweight' },
                    { id: 'standard', label: 'Standard (6-10mg/g) - Steady balanced absorption' },
                    { id: 'energetic', label: 'Energetic (11-16mg/g) - Highly intense release' },
                    { id: 'intense', label: 'Ultra-Kick (17mg/g+) - Extreme immediate buzz' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectQuizAnswer('strength', opt.id)}
                      className="w-full text-left p-3 border border-slate-200 hover:border-indigo-500 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer text-xs font-bold text-slate-800"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: Results */}
            {quizStep === 4 && (
              <div className="space-y-4 text-center animate-fade-in">
                <span className="text-3xl block">🏆 MATCH FOUND</span>
                
                {quizResult ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 flex flex-col items-center">
                    <img 
                      src={cleanMediaUrl(quizResult.image)} 
                      alt={quizResult.title} 
                      className="w-20 h-20 object-contain" 
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 block uppercase">
                        {quizResult.vendor} Official
                      </span>
                      <h4 className="text-xs font-black text-slate-800">
                        {quizResult.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Price: £{quizResult.price.toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={handleAddQuizRecommendedToCart}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>Add Match to Basket</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    We couldn't locate a precise model match. Browse our standard list for best offers!
                  </p>
                )}

                <button
                  onClick={() => setQuizStep(1)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer"
                >
                  Restart Quiz
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
