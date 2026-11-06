import React, { useState } from 'react';
import { CartItem, Discount, Customer } from '../types';
import { X, Trash2, Plus, Minus, Ticket, Check, ShieldCheck, ShoppingBag, Sparkles, Package, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SubscriptionIcon from './SubscriptionIcon';
import { calculateDiscountAmount, calculateVolumePrice } from '../utils';
import {
  resolveDiscountCode,
  resolveDeliveryCost,
  rewardNeedsSelection,
  getRewardChoices,
  applyRewardChoice,
  getOutstandingFreeCanCount,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_DELIVERY_COST
} from '../utils/discountUtils';
import { hydrateRewardSelection } from '../utils/rewardLines';
import { saveRewardSelection } from '../utils/rewardSelectionStore';
import FreeCanPicker from './FreeCanPicker';
import { RewardChoicePicker, AppliedRewardLines } from './RewardSelection';
import { getPlanImage, getPlanSlug } from '../utils/planImages';
import { parseSubscriptionProducts, formatSubscriptionItemDisplay } from '../utils/subscriptionParser';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQty: (productId: string, action: 'inc' | 'dec') => void;
  onRemoveItem: (productId: string) => void;
  activeDiscounts: Discount[];
  onTriggerCheckout: (discountApplied: Discount | null, finalTotal: number) => void;
  products?: any[];
  collections?: any[];
  customers?: Customer[];
  loggedInCustomer?: Customer | null;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  activeDiscounts,
  onTriggerCheckout,
  products = [],
  collections = [],
  customers = [],
  loggedInCustomer = null
}: CartDrawerProps) {
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [isCanPickerOpen, setIsCanPickerOpen] = useState(false);
  const [isChoicePickerOpen, setIsChoicePickerOpen] = useState(false);

  const getItemTotal = (item: CartItem) => {
    if (item.productId && (item.productId.startsWith('sub-pack-') || item.productId.includes('sub-pack') || item.isSubscription)) {
      return item.price * item.quantity;
    }
    return calculateVolumePrice(item.price, item.quantity);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + getItemTotal(item), 0);

  const discountValue = calculateDiscountAmount(
    appliedDiscount,
    cartItems,
    subtotal,
    products,
    collections
  );

  const totalBeforeShipping = Math.max(subtotal - discountValue, 0);
  const shippingFee = resolveDeliveryCost(totalBeforeShipping, appliedDiscount, STANDARD_DELIVERY_COST);
  const total = totalBeforeShipping + shippingFee;

  const outstandingCans = getOutstandingFreeCanCount(appliedDiscount);
  const needsRewardSelection = rewardNeedsSelection(appliedDiscount);

  /** Opens the picker a freshly applied reward needs before it can be honoured. */
  const openPickerFor = (discount: Discount) => {
    if (discount.rewardKind === 'choice') {
      setIsChoicePickerOpen(true);
    } else if (discount.rewardKind === 'free-cans') {
      setIsCanPickerOpen(true);
    }
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;

    setPromoError('');
    setPromoSuccess('');

    const res = resolveDiscountCode(
      promoCodeInput,
      activeDiscounts,
      customers,
      loggedInCustomer,
      cartItems,
      subtotal
    );

    if (res.success && res.discount) {
      // A can already chosen on the loyalty rewards page carries over, so the
      // picker only opens when something is still outstanding.
      const discount = hydrateRewardSelection(res.discount);
      setAppliedDiscount(discount);
      setPromoSuccess(res.message || `Discount code "${discount.title}" applied!`);
      if (rewardNeedsSelection(discount)) openPickerFor(discount);
    } else {
      setPromoError(res.error || 'Invalid or expired promo code.');
    }
  };

  const handleChooseReward = (choiceId: string) => {
    if (!appliedDiscount) return;
    const updated = applyRewardChoice(appliedDiscount, choiceId);
    setAppliedDiscount(updated);
    saveRewardSelection(updated.title, { rewardChoiceId: choiceId });
    setIsChoicePickerOpen(false);
    setPromoSuccess(`Reward applied: ${updated.details}`);
    if (updated.rewardKind === 'free-cans') setIsCanPickerOpen(true);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    // A reward with an unfinished selection would be silently dropped at
    // checkout, so send the customer back to the picker instead.
    if (needsRewardSelection && appliedDiscount) {
      openPickerFor(appliedDiscount);
      return;
    }
    onTriggerCheckout(appliedDiscount, total);
    setAppliedDiscount(null);
    setPromoCodeInput('');
    setPromoSuccess('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Dark backdrop blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
            onClick={onClose}
          />

          {/*
            The panel's own box, sized here rather than on the panel.

            This was `max-w-full flex pl-10` around a `w-screen` panel. On a
            phone that is a 100vw panel inside a box 40px narrower than the
            viewport, so its right-hand edge — the close button and every price
            in the column — was pushed out of view. Hence "there is no cross
            button": it was there, just off-screen.
          */}
          <div className="absolute inset-y-0 right-0 flex w-full max-w-md">
            {/* Slide-in cart panel */}
            <motion.div
              id="cart-drawer-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="w-full bg-white flex flex-col h-full shadow-2xl border-l border-slate-200 relative z-10 overflow-x-hidden"
            >
              {/* Header — sticky so the close button stays reachable on a phone,
                  where the list is long and the header would scroll away. */}
              <div className="sticky top-0 z-20 px-4 sm:px-5 py-4 sm:py-5 border-b border-slate-150 flex items-center justify-between gap-2 bg-slate-50">
                <div className="flex items-center gap-2 min-w-0">
                  <ShoppingBag className="h-5 w-5 text-indigo-600 shrink-0" />
                  <h2 className="text-[11px] sm:text-sm font-black text-slate-800 uppercase tracking-wider sm:tracking-widest truncate">
                    My Cart ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})
                  </h2>
                </div>

                <button
                  onClick={onClose}
                  aria-label="Close cart"
                  className="shrink-0 p-2 -mr-1 rounded-full hover:bg-slate-200 active:bg-slate-300 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Cart items list */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-24 space-y-3">
                    <span className="text-3xl block">🛒</span>
                    <p className="font-bold text-slate-750 text-sm">Your cart drawer is empty</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">Explore our nicotine pouches, configure custom collection subscribers or custom packs.</p>
                    <button
                      onClick={onClose}
                      className="inline-block text-xs bg-slate-900 border-slate-900 hover:bg-slate-850 text-white font-bold py-2.5 px-6 rounded-lg shadow-xs cursor-pointer transition-colors mt-2"
                    >
                      Continue Shopping Now
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {cartItems.map((item, index) => {
                      const isSubPack = Boolean(
                        item.isSubscription ||
                        (item.productId && (item.productId.startsWith('sub-pack-') || item.productId.includes('sub-pack'))) ||
                        item.vendor === 'Subscription Pack' ||
                        (item.productTitle && item.productTitle.toLowerCase().includes('subscription') && item.productTitle.toLowerCase().includes('plan'))
                      );

                      const subProducts = isSubPack ? parseSubscriptionProducts(null, item) : [];
                      const planSlug = getPlanSlug(item.subscriptionPlan || item.productTitle);
                      const planImg = getPlanImage(item.subscriptionPlan || item.productTitle, item.image);
                      const displayPlanName = item.subscriptionPlan || (
                        planSlug === 'ultimate' ? 'ULTIMATE Plan' :
                        planSlug === 'pro' ? 'PRO Plan' :
                        planSlug === 'core' ? 'CORE Plan' : 'LITE Plan'
                      );

                      return (
                        <div key={`${item.productId}-${index}`} className="py-4 flex gap-3 text-xs items-start justify-between">
                          {isSubPack ? (
                            <div className="relative shrink-0 w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-2xs">
                              <img
                                src={planImg}
                                alt={displayPlanName}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute top-1 left-1 bg-slate-900/90 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                {planSlug}
                              </div>
                            </div>
                          ) : (
                            <img
                              src={item.image}
                              alt={item.productTitle}
                              className="w-16 h-16 object-cover rounded-xl bg-slate-50 border border-slate-150 shrink-0 shadow-2xs"
                              referrerPolicy="no-referrer"
                            />
                          )}

                          <div className="flex-1 min-w-0 pr-2">
                            <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider block">
                              {isSubPack ? 'Subscription Pack' : item.vendor}
                            </span>
                            
                            <h4 className="font-extrabold text-slate-900 leading-tight text-xs mt-0.5">
                              {isSubPack ? displayPlanName : item.productTitle}
                            </h4>

                            {isSubPack && item.subscriptionFrequency && (
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className="text-[9.5px] font-extrabold bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-md break-words">
                                  {item.subscriptionFrequency} {item.frequencyDiscount ? `[${item.frequencyDiscount} OFF]` : ''}
                                </span>
                              </div>
                            )}

                            {/* Detailed selected products list for subscription packs */}
                            {isSubPack && subProducts.length > 0 && (
                              <div className="mt-2.5 bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 space-y-1.5 text-left">
                                <div className="flex items-center justify-between text-[9.5px] font-black text-slate-700 uppercase tracking-wide">
                                  <span className="flex items-center gap-1">
                                    <Package className="w-3 h-3 text-indigo-600" />
                                    Selected Pack Items ({subProducts.reduce((sum, p) => sum + (p.quantity || 1), 0)} Cans):
                                  </span>
                                </div>
                                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                                  {subProducts.map((p, pIdx) => (
                                    <div key={pIdx} className="text-[10.5px] text-slate-800 font-semibold bg-white border border-slate-200/70 px-2 py-1 rounded-md flex justify-between items-center shadow-3xs">
                                      <span className="truncate pr-1 text-slate-700">
                                        {p.brand && <strong className="text-slate-950 font-extrabold">{p.brand} — </strong>}
                                        <span className="font-bold text-slate-800">{p.name}</span>
                                        {p.variant && p.variant !== 'Standard' && (
                                          <span className="text-indigo-600 font-semibold"> — {p.variant}</span>
                                        )}
                                      </span>
                                      <span className="text-[9px] font-black text-indigo-800 bg-indigo-50 border border-indigo-150 px-1.5 py-0.5 rounded-sm shrink-0">
                                        Qty:{p.quantity || 1}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <p className="text-slate-600 font-bold mt-1.5 text-xs">£{item.price.toFixed(2)} each</p>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center border border-slate-200 rounded-lg bg-white shadow-3xs">
                                <button
                                  onClick={() => onUpdateQty(item.productId, 'dec')}
                                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer rounded-l-lg transition-colors"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="px-2 text-xs font-black text-slate-800 w-6 text-center bg-slate-50/50">{item.quantity}</span>
                                <button
                                  onClick={() => onUpdateQty(item.productId, 'inc')}
                                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer rounded-r-lg transition-colors"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-3 shrink-0">
                            <span className="font-black text-slate-900 text-xs">£{getItemTotal(item).toFixed(2)}</span>
                            <button
                              onClick={() => onRemoveItem(item.productId)}
                              className="text-red-500 hover:text-red-700 p-1.5 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Panel. The bottom padding clears the iOS home bar, so the
                  checkout button is not sitting underneath it on a phone. */}
              {cartItems.length > 0 && (
                <div className="border-t border-slate-200 bg-slate-50 px-4 sm:px-5 pt-4 sm:pt-5 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-5 space-y-4 shrink-0">
                  {/* Promo code block */}
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo (CRUSHCLUB15)"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 p-2 text-xs rounded-lg uppercase placeholder:normal-case font-bold tracking-wider focus:outline-none focus:ring-1 focus:ring-slate-500"
                    />
                    <button
                      type="submit"
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-lg cursor-pointer transition-colors shrink-0"
                    >
                      Apply Code
                    </button>
                  </form>

                  {/* Promo status messages */}
                  {promoError && <p className="text-[10px] text-red-500 font-bold">{promoError}</p>}
                  {promoSuccess && (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 p-1.5 rounded font-black">
                      <Check className="h-3.5 w-3.5 shrink-0" />
                      <span>{promoSuccess}</span>
                    </div>
                  )}

                  {/* Reward still waiting on the customer's pick */}
                  {needsRewardSelection && appliedDiscount && (
                    <button
                      onClick={() => openPickerFor(appliedDiscount)}
                      className="w-full bg-[#dfa047] hover:bg-[#cf9038] text-[#071d37] text-[11px] font-black uppercase tracking-wider py-2.5 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {appliedDiscount.rewardKind === 'choice'
                        ? 'Choose your reward'
                        : `Choose your free can${outstandingCans !== 1 ? 's' : ''} (${outstandingCans} to pick)`}
                    </button>
                  )}

                  {/* Free cans and gifts included by the applied reward */}
                  <AppliedRewardLines
                    discount={appliedDiscount}
                    compact
                    onEditSelection={
                      appliedDiscount?.rewardKind === 'free-cans'
                        ? () => setIsCanPickerOpen(true)
                        : undefined
                    }
                  />

                  {/* Total calculations */}
                  <div className="space-y-2 border-t border-slate-200 pt-3 text-xs leading-normal">
                    <div className="flex justify-between gap-2 text-slate-500">
                      <span className="truncate">Subtotal items</span>
                      <span className="font-bold text-slate-800 shrink-0">£{subtotal.toFixed(2)}</span>
                    </div>

                    {appliedDiscount && discountValue > 0 && (
                      <div className="flex justify-between gap-2 text-emerald-600">
                        {/* min-w-0 + truncate: a prefixed loyalty code such as
                            "NEH-PLATINUM_ODD" is long enough to push the amount
                            off the edge of a phone screen without it. */}
                        <span className="flex items-center gap-1 font-semibold min-w-0">
                          <Ticket className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">Discount ({appliedDiscount.title})</span>
                        </span>
                        <span className="font-extrabold shrink-0">-£{discountValue.toFixed(2)}</span>
                      </div>
                    )}

                    {totalBeforeShipping < FREE_SHIPPING_THRESHOLD && shippingFee > 0 && (
                      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2 text-[11px] text-indigo-700 text-center font-bold">
                        🚚 Add <span className="font-extrabold">£{(FREE_SHIPPING_THRESHOLD - totalBeforeShipping).toFixed(2)}</span> more to qualify for <span className="underline">FREE Delivery</span>!
                      </div>
                    )}

                    <div className="flex justify-between gap-2 text-slate-500">
                      <span className="truncate">Delivery fee</span>
                      <span className={shippingFee === 0 ? "text-emerald-600 font-extrabold shrink-0" : "font-extrabold text-slate-800 shrink-0"}>
                        {shippingFee === 0 ? 'FREE' : `£${shippingFee.toFixed(2)}`}
                      </span>
                    </div>

                    <div className="flex justify-between gap-2 text-slate-800 text-sm font-extrabold pt-2 border-t border-slate-200">
                      <span className="flex items-center gap-1 min-w-0">
                        <span className="truncate">Total amount</span>
                        <Sparkles className="h-3 w-3 text-indigo-500 shrink-0" />
                      </span>
                      <span className="text-base text-slate-950 shrink-0">£{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Checkout actions */}
                  <button
                    id="cart-checkout-btn"
                    onClick={handleCheckout}
                    disabled={needsRewardSelection}
                    className="w-full bg-slate-900 border-slate-900 text-white hover:bg-slate-800 py-3.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShieldCheck className="h-4.5 w-4.5" /> PROCEED TO CHECKOUT SCREEN
                  </button>

                  <div className="flex justify-center items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <span>🔒 Secured, encrypted checkout sequence setup</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          <RewardChoicePicker
            isOpen={isChoicePickerOpen}
            choices={getRewardChoices(appliedDiscount)}
            rewardLabel={appliedDiscount?.title}
            onChoose={handleChooseReward}
            onCancel={() => setIsChoicePickerOpen(false)}
          />

          <FreeCanPicker
            isOpen={isCanPickerOpen}
            count={appliedDiscount?.freeCanCount || 1}
            products={products}
            initialSelections={appliedDiscount?.freeCanSelections || []}
            rewardLabel={appliedDiscount?.details}
            onConfirm={(selections) => {
              setAppliedDiscount(prev => {
                if (!prev) return prev;
                saveRewardSelection(prev.title, { freeCanSelections: selections });
                return { ...prev, freeCanSelections: selections };
              });
              setIsCanPickerOpen(false);
            }}
            onCancel={() => setIsCanPickerOpen(false)}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
