import React, { useState, useEffect } from 'react';
import { Product, Customer } from '../types';
import { ArrowLeft, ShoppingCart, Heart, Shield, RotateCcw, Truck, Check, Sparkles } from 'lucide-react';
import { cleanMediaUrl, PLACEHOLDER_IMAGE } from '../utils/mediaUtils';
import { calculateVolumePrice } from '../utils';
import { PackSizeSelect } from './PackSizeSelect';

interface ProductDetailViewProps {
  product: Product;
  allProducts?: Product[];
  loggedInCustomer?: Customer | null;
  onAddToCart: (product: Product, qty: number) => void;
  onToggleWishlist: (productId: string) => void;
  onNavigate: (tab: string, arg?: string) => void;
}

export default function ProductDetailView({
  product,
  allProducts = [],
  loggedInCustomer,
  onAddToCart,
  onToggleWishlist,
  onNavigate
}: ProductDetailViewProps) {
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (loggedInCustomer && Array.isArray(loggedInCustomer.wishlist)) {
      setIsFavorite(
        loggedInCustomer.wishlist.includes(product.id) ||
        loggedInCustomer.wishlist.includes(product.slug || '') ||
        loggedInCustomer.wishlist.includes(product.title)
      );
    } else {
      setIsFavorite(false);
    }
  }, [loggedInCustomer, product]);

  // Helper to extract numeric strength and flavour
  const getProductStrengthLabel = (p: Product): string => {
    if (selectedVariants) {
      const keys = Object.keys(selectedVariants);
      const strengthKey = keys.find(k => k.toLowerCase().includes('strength') || k.toLowerCase().includes('nicotine'));
      if (strengthKey && selectedVariants[strengthKey]) {
        return selectedVariants[strengthKey];
      }
    }
    
    if (activeVariant) {
      const nameMatch = activeVariant.name.match(/(\d+(?:\.\d+)?)\s*mg/i);
      if (nameMatch) return nameMatch[0];
    }

    if (p.strength) return p.strength;
    const titleMatch = p.title.match(/(\d+(?:\.\d+)?)\s*mg/i);
    if (titleMatch) return titleMatch[1] + 'mg';
    
    // Check tags or title fallback
    const titleL = p.title.toLowerCase();
    if (titleL.includes('1mg') || titleL.includes('2mg') || titleL.includes('3mg') || titleL.includes('4mg') || titleL.includes('5mg')) {
      const match = titleL.match(/(\d+mg)/);
      if (match) return match[1];
    }
    if (titleL.includes('6mg') || titleL.includes('7mg') || titleL.includes('8mg') || titleL.includes('9mg') || titleL.includes('10mg')) {
      const match = titleL.match(/(\d+mg)/);
      if (match) return match[1];
    }
    if (titleL.includes('11mg') || titleL.includes('12mg') || titleL.includes('13mg') || titleL.includes('14mg') || titleL.includes('15mg') || titleL.includes('16mg')) {
      const match = titleL.match(/(\d+mg)/);
      if (match) return match[1];
    }
    const fallbackMatch = p.title.match(/(\d+mg)/i);
    if (fallbackMatch) return fallbackMatch[1];

    return 'Regular';
  };

  const getProductFlavourLabel = (p: Product): string => {
    if (selectedVariants) {
      const keys = Object.keys(selectedVariants);
      const flavorKey = keys.find(k => k.toLowerCase().includes('flavour') || k.toLowerCase().includes('flavor') || k.toLowerCase().includes('taste'));
      if (flavorKey && selectedVariants[flavorKey]) {
        return selectedVariants[flavorKey];
      }
    }

    if (activeVariant && activeVariant.flavour) {
      return activeVariant.flavour;
    }

    if (p.flavour) return p.flavour;
    
    const titleL = p.title.toLowerCase();
    const tagString = (p.tags || []).join(' ').toLowerCase();
    
    if (titleL.includes('mint') || titleL.includes('menthol') || titleL.includes('ice') || tagString.includes('mint')) {
      return 'Mint';
    }
    if (titleL.includes('berry') || titleL.includes('cherry') || titleL.includes('strawberry') || titleL.includes('raspberry') || tagString.includes('berry')) {
      return 'Berry';
    }
    if (titleL.includes('citrus') || titleL.includes('lemon') || titleL.includes('lime') || titleL.includes('orange') || tagString.includes('citrus')) {
      return 'Citrus';
    }
    if (titleL.includes('fruit') || titleL.includes('grape') || titleL.includes('mango') || titleL.includes('apple') || titleL.includes('peach') || tagString.includes('fruit')) {
      return 'Fruit';
    }
    if (titleL.includes('cola') || titleL.includes('soda') || tagString.includes('cola')) {
      return 'Cola';
    }
    if (titleL.includes('coffee') || titleL.includes('latte') || titleL.includes('mocha') || tagString.includes('coffee')) {
      return 'Coffee';
    }
    if (titleL.includes('sweet') || titleL.includes('candy') || tagString.includes('sweet')) {
      return 'Sweet';
    }
    if (titleL.includes('tea') || titleL.includes('chai') || titleL.includes('matcha') || tagString.includes('tea')) {
      return 'Tea';
    }
    if (titleL.includes('other') || tagString.includes('other')) {
      return 'Other';
    }
    return 'Mint'; // Fallback
  };

  // State to hold selected variant options, e.g. { "Strength": "Strong", "Size": "Large" }
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // Sync active images list and selected image state
  const mediaImages = product.media && product.media.length > 0 ? product.media : [product.image];
  const [selectedImage, setSelectedImage] = useState(product.image);

  // Active combo name is option values joined by " / "
  const activeComboName = product.variants && product.variants.length > 0
    ? product.variants.map(v => selectedVariants[v.name]).filter(Boolean).join(' / ')
    : '';

  // Get active physical variant from concreteVariants list
  const activeVariant = product.concreteVariants?.find(v => v.name === activeComboName);

  // Choose first option value as selected default for each variant option OR match variant query parameter
  useEffect(() => {
    let variantId: string | null = null;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      variantId = urlParams.get('variant');
    } catch (e) {
      console.warn('[History] Failed to read URL search parameters:', e);
    }
    
    let matched = false;
    if (variantId && product.concreteVariants) {
      const matchedVariant = product.concreteVariants.find(v => v.id === variantId);
      if (matchedVariant) {
        const parts = matchedVariant.name.split(' / ');
        if (product.variants && parts.length === product.variants.length) {
          const initial: Record<string, string> = {};
          product.variants.forEach((v, idx) => {
            initial[v.name] = parts[idx];
          });
          setSelectedVariants(initial);
          matched = true;
        } else if (product.variants && product.variants.length === 1) {
          setSelectedVariants({ [product.variants[0].name]: matchedVariant.name });
          matched = true;
        }
      }
    }

    if (!matched) {
      if (product.variants && product.variants.length > 0) {
        const initial: Record<string, string> = {};
        product.variants.forEach(v => {
          if (v.values && v.values.length > 0) {
            initial[v.name] = v.values[0];
          }
        });
        setSelectedVariants(initial);
      } else {
        setSelectedVariants({});
      }
    }
  }, [product]);

  // Sync selected variant image to display
  useEffect(() => {
    if (activeVariant && activeVariant.images && activeVariant.images.length > 0 && activeVariant.images[0]) {
      setSelectedImage(activeVariant.images[0]);
    } else {
      setSelectedImage(product.image);
    }
  }, [activeVariant, product]);

  // Update URL to match current active variant ID
  useEffect(() => {
    try {
      if (activeVariant) {
        const url = new URL(window.location.href);
        url.searchParams.set('variant', activeVariant.id);
        window.history.replaceState({}, '', url.pathname + url.search);
      } else {
        const url = new URL(window.location.href);
        if (url.searchParams.has('variant')) {
          url.searchParams.delete('variant');
          window.history.replaceState({}, '', url.pathname + url.search);
        }
      }
    } catch (e) {
      console.warn('[History] Failed to replaceState (sandboxed iframe constraint):', e);
    }
  }, [activeVariant]);

  const handleAddToCartClick = () => {
    const cartProduct = {
      ...product,
      id: activeVariant ? activeVariant.id : product.id,
      title: activeVariant ? `${product.title} ${activeVariant.name}` : product.title,
      price: activeVariant ? activeVariant.price : product.price,
      image: (activeVariant && activeVariant.images && activeVariant.images.length > 0 && activeVariant.images[0])
        ? activeVariant.images[0]
        : product.image
    };

    onAddToCart(cartProduct, quantity);
    setAddedMessage(true);
    setTimeout(() => {
      setAddedMessage(false);
    }, 2500);
  };

  const handleToggleFavorite = () => {
    if (!loggedInCustomer) {
      alert("Wishlist feature is only accessible when logged in. Please log in or register your account first.");
      onNavigate('frontend-account');
      return;
    }
    setIsFavorite(!isFavorite);
    onToggleWishlist(product.id);
  };

  // Find related products (from same vendor/brand, excluding current product)
  const relatedProducts = allProducts
    .filter(p => p.vendor === product.vendor && p.id !== product.id)
    .slice(0, 4);

  return (
    <div id="product-detail-layout" className="bg-[#f6f6f7] min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb & Back action */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => {
              try {
                window.history.pushState({}, '', '/collections/all');
              } catch (e) {
                console.warn('[History] Failed to pushState (sandboxed iframe constraint):', e);
              }
              onNavigate('frontend-shop');
            }}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to All Products</span>
          </button>
          
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
            <span className="hover:text-slate-600 cursor-pointer" onClick={() => onNavigate('frontend-home')}>Home</span>
            <span>/</span>
            <span className="hover:text-slate-600 cursor-pointer" onClick={() => onNavigate('frontend-shop')}>Shop</span>
            <span>/</span>
            <span className="text-slate-600 truncate max-w-[150px]">{product.title}</span>
          </div>
        </div>

        {/* Core Product Sandbox */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 p-6 sm:p-8 lg:p-10">
          
          {/* Left Column: Premium Canvas Image Box with Thumbnail Grid */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden aspect-square flex items-center justify-center p-2 relative group">
              <img
                src={cleanMediaUrl(selectedImage) || PLACEHOLDER_IMAGE}
                alt={activeVariant ? `${product.title} ${activeVariant.name}` : product.title}
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="absolute top-4 left-4 bg-indigo-600 text-white text-[9px] font-black uppercase py-1 px-3 rounded-full border border-indigo-500 tracking-wider">
                {product.vendor}
              </span>
              {(activeVariant ? activeVariant.inventory : product.inventory) > 0 ? (
                <span className="absolute top-4 right-4 bg-emerald-600 text-white text-[9px] font-black uppercase py-1 px-3 rounded-full shadow-sm">
                  In Stock
                </span>
              ) : (
                <span className="absolute top-4 right-4 bg-rose-600 text-white text-[9px] font-black uppercase py-1 px-3 rounded-full shadow-sm">
                  Sold Out
                </span>
              )}
            </div>

            {/* Media Image Thumbnails Gallery */}
            {mediaImages.length > 1 && (
              <div id="product-media-gallery" className="grid grid-cols-5 gap-2.5">
                {mediaImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`aspect-square rounded-xl border overflow-hidden p-1 bg-slate-50 relative transition-all ${
                      selectedImage === imgUrl 
                        ? 'border-indigo-600 ring-2 ring-indigo-500/10' 
                        : 'border-slate-200 hover:border-slate-350'
                    }`}
                  >
                    <img src={imgUrl} className="w-full h-full object-cover rounded-lg" alt="" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 text-center space-y-1">
                <span className="text-slate-400 block text-[8px] font-black uppercase tracking-wider">SKU Code</span>
                <span className="font-mono font-extrabold text-[#1a1c1d] text-[10px] block truncate" title={activeVariant ? activeVariant.id : (product.sku || 'N/A')}>
                  {activeVariant ? activeVariant.id : (product.sku || 'N/A')}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 text-center space-y-1">
                <span className="text-slate-400 block text-[8px] font-black uppercase tracking-wider">Weight</span>
                <span className="font-extrabold text-[#1a1c1d] text-xs block">{product.weight || 12}g</span>
              </div>
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 text-center space-y-1">
                <span className="text-slate-400 block text-[8px] font-black uppercase tracking-wider">Category</span>
                <span className="font-extrabold text-[#1a1c1d] text-xs truncate block">{product.category || 'Supplements'}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 text-center space-y-1">
                <span className="text-slate-400 block text-[8px] font-black uppercase tracking-wider">Strength</span>
                <span className="font-extrabold text-indigo-650 text-xs truncate block">{getProductStrengthLabel(product)}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 text-center space-y-1">
                <span className="text-slate-400 block text-[8px] font-black uppercase tracking-wider">Flavour</span>
                <span className="font-extrabold text-emerald-650 text-xs truncate block">{getProductFlavourLabel(product)}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Product Detail and Operations */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] text-indigo-650 font-black uppercase tracking-widest block">{product.vendor} Pouches</span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {activeVariant ? `${product.title} ${activeVariant.name}` : product.title}
                </h1>
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-amber-400">
                    {'★★★★★'.split('').map((char, i) => (
                      <span key={i} className="text-xs">★</span>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase">(5.0 Rating • Verified Merchant)</span>
                </div>
              </div>

              {/* Price Row with Volume Tier Pricing */}
              {(() => {
                const baseUnitPrice = activeVariant ? activeVariant.price : product.price;
                const volumeTotal = calculateVolumePrice(baseUnitPrice, quantity);
                const standardTotal = Number((baseUnitPrice * quantity).toFixed(2));
                const hasVolumeDiscount = volumeTotal < standardTotal;
                const effectiveUnitPrice = (volumeTotal / quantity).toFixed(2);

                return (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150/80 space-y-2">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-2xl font-black text-slate-900">
                        ₹{volumeTotal.toFixed(2)}
                      </span>
                      {hasVolumeDiscount && (
                        <span className="text-sm font-bold text-slate-400 line-through">
                          ₹{standardTotal.toFixed(2)}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 font-bold">
                        {quantity > 1 ? `(₹${effectiveUnitPrice} each)` : 'each'}
                      </span>
                      {hasVolumeDiscount && (
                        <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 uppercase tracking-wide">
                          Volume Savings Applied! (Saved ₹{(standardTotal - volumeTotal).toFixed(2)})
                        </span>
                      )}
                    </div>

                    {/* Volume Tiers Quick Indicator */}
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 pt-1 border-t border-slate-200/60 flex-wrap">
                      <span className="text-slate-800 font-extrabold">Volume Pricing:</span>
                      <span className={`px-1.5 py-0.5 rounded ${quantity === 5 ? 'bg-indigo-600 text-white font-extrabold' : 'bg-slate-100 text-slate-700'}`}>5 = ₹23.50</span>
                      <span>•</span>
                      <span className={`px-1.5 py-0.5 rounded ${quantity === 10 ? 'bg-indigo-600 text-white font-extrabold' : 'bg-slate-100 text-slate-700'}`}>10 = ₹42.00</span>
                      <span>•</span>
                      <span className={`px-1.5 py-0.5 rounded ${quantity === 20 ? 'bg-indigo-600 text-white font-extrabold' : 'bg-slate-100 text-slate-700'}`}>20 = ₹77.00</span>
                    </div>
                  </div>
                );
              })()}

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Description</h3>
                {(activeVariant && activeVariant.description) ? (
                  <div 
                    className="text-slate-600 text-xs leading-relaxed font-sans font-medium space-y-2 prose prose-slate max-w-none break-words"
                    dangerouslySetInnerHTML={{ __html: activeVariant.description }}
                  />
                ) : product.description ? (
                  <div 
                    className="text-slate-600 text-xs leading-relaxed font-sans font-medium space-y-2 prose prose-slate max-w-none break-words"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-slate-400 text-xs leading-relaxed font-sans font-medium italic">
                    No description provided for this premium item canister. Formulated in high precision labs for crystal freeze mouth refreshes.
                  </p>
                )}
              </div>

              {/* Variants Selector Panel */}
              {product.variants && product.variants.length > 0 && (
                <div id="product-variants-section" className="space-y-3.5 pt-3 border-t border-slate-100">
                  {product.variants.map((v) => (
                    <div key={v.id || v.name} className="space-y-1.5 text-left">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                        Select {v.name}: <span className="text-indigo-600 font-extrabold">{selectedVariants[v.name]}</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {v.values.map((val) => {
                          const isSelected = selectedVariants[v.name] === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setSelectedVariants(prev => ({ ...prev, [v.name]: val }))}
                              className={`py-2 px-3.5 rounded-xl font-bold text-xs uppercase tracking-tight transition-all border cursor-pointer ${
                                isSelected
                                  ? 'bg-slate-900 border-slate-950 text-white shadow-xs'
                                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-205'
                              }`}
                            >
                                {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Addition panel actions */}
            <div className="space-y-4 pt-4 border-t border-slate-150">
              
              {/* Quantity selector */}
              {(activeVariant ? activeVariant.inventory : product.inventory) > 0 && (
                <div className="space-y-3">
                  <PackSizeSelect
                    unitPrice={activeVariant ? activeVariant.price : product.price}
                    quantity={quantity}
                    onChange={setQuantity}
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Quantity:</span>
                    <div className="flex items-center border border-slate-205 rounded-xl bg-slate-50 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3.5 py-2 hover:bg-slate-200 text-slate-600 font-bold transition-colors cursor-pointer select-none"
                      >
                        -
                      </button>
                      <span className="px-5 font-extrabold text-xs text-[#1a1c1d] min-w-[40px] text-center">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(100, quantity + 1))}
                        className="px-3.5 py-2 hover:bg-slate-200 text-slate-600 font-bold transition-colors cursor-pointer select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons row */}
              <div className="flex gap-3">
                {(activeVariant ? activeVariant.inventory : product.inventory) > 0 ? (
                  <button
                    type="button"
                    onClick={handleAddToCartClick}
                    className="flex-1 bg-[#1a1c1d] hover:bg-black text-white py-3.5 px-6 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Add to Cart</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex-1 bg-slate-100 text-slate-400 border border-slate-200 py-3.5 px-6 rounded-xl font-black text-xs uppercase tracking-widest cursor-not-allowed text-center"
                  >
                    Sold Out canister
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                    isFavorite 
                      ? 'bg-red-50 text-red-600 border-red-200 shadow-xs' 
                      : 'bg-white hover:bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
                  }`}
                  title="Add to Wishlist"
                >
                  <Heart className={`h-4.5 w-4.5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Toast response message feedback */}
              {addedMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center gap-2 animate-fade-in">
                  <div className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold leading-none">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-xs font-black tracking-wide">Successfully added {quantity} item(s) to your drawer cart!</span>
                </div>
              )}

              {/* Shipping and Trust badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[10px] text-slate-500">
                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <Truck className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="font-medium">Free UK dispatch over ₹15</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <Shield className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="font-medium">100% Certified Lab Pure</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <RotateCcw className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="font-medium">Easy 30-Day Returns</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Related Products Panel Section */}
        {relatedProducts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-indigo-600" />
              <span>More cans from {product.vendor}</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map(rel => (
                <div
                  key={rel.id}
                  onClick={() => {
                    setQuantity(1);
                    try {
                      window.history.pushState({}, '', `/products/${rel.slug || rel.id}`);
                    } catch (e) {
                      console.warn('[History] Failed to pushState (sandboxed iframe constraint):', e);
                    }
                    onNavigate('product-detail', rel.slug || rel.id);
                  }}
                  className="bg-white border border-slate-200 hover:border-slate-350 p-4 rounded-xl space-y-3 cursor-pointer group hover:shadow-md transition-all text-center flex flex-col justify-between"
                >
                  <div className="h-36 rounded-lg bg-white overflow-hidden relative flex items-center justify-center p-1">
                    <img src={rel.image} className="w-full h-full object-contain transition-transform group-hover:scale-105" alt="" referrerPolicy="no-referrer" />
                  </div>
                  <div className="space-y-1 mt-2">
                    <h4 className="text-[11px] font-black text-slate-800 truncate">{rel.title}</h4>
                    <p className="text-slate-900 font-extrabold text-[11px]">₹{rel.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
