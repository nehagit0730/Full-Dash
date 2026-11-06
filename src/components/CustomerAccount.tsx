import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Customer, Product, Order, Discount } from '../types';
import { getWishlistProductTitle } from '../utils/mediaUtils';
import { parseOrderTime, calculateDiscountAmount } from '../utils';
import {
  formatLoyaltyCouponCode,
  getCustomerPrefix,
  resolveDiscountCode,
  resolveDeliveryCost,
  rewardNeedsSelection,
  getRewardChoices,
  applyRewardChoice,
  getOutstandingFreeCanCount,
  getMilestonesForTier,
  extractBaseMilestoneCode,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_DELIVERY_COST,
  type LoyaltyMilestoneDef,
  type LoyaltyTierId
} from '../utils/discountUtils';
import { buildOrderItems, hydrateRewardSelection } from '../utils/rewardLines';
import { saveRewardSelection } from '../utils/rewardSelectionStore';
import FreeCanPicker from './FreeCanPicker';
import { RewardChoicePicker, AppliedRewardLines } from './RewardSelection';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithGoogle } from '../lib/auth';
import { isDelivered, isDispatched, isProcessing, dispatchStage, dispatchLabel } from '../lib/orderStatus';
import SubscriptionIcon from './SubscriptionIcon';
import { useRecaptcha } from '../hooks/useRecaptcha';
import { getPlanImage, getPlanSlug, detectPlanTier } from '../utils/planImages';
import {
  parseSubscriptionProducts,
  formatSubscriptionItemDisplay,
  isSubscriptionOrder,
  getOrderSubscriptionId,
  extractSubscriptionDetails
} from '../utils/subscriptionParser';
import SubscriptionBoxManager, { BoxLine } from './account/SubscriptionBoxManager';
import { printInvoice, downloadInvoiceFile, getInvoiceNumber } from '../utils/invoice';
import {
  User, LogIn, Heart, PlusCircle, Trash2, MapPin, Package, ShoppingBag,
  Eye, X, Search, Truck, Check, Clock, Calendar, RefreshCw, Award,
  Copy, Share2, HelpCircle, ShieldAlert, CreditCard, Star, ChevronRight,
  CheckCircle2, AlertTriangle, Play, Pause, ChevronDown, CheckCircle, Tag, LifeBuoy,
  Layout, LogOut, Plus, RotateCcw, Send, Mail, Loader2, ExternalLink, Download
} from 'lucide-react';

/**
 * Subscription plan tiers offered on the Account page.
 *
 * Single source of truth for the tier cards, the order summary and the
 * checkout payload — the prices used to be written inline in the JSX only,
 * so nothing else could compute a total from them.
 */
export const ACCOUNT_SUB_PLANS = [
  { id: 'lite', name: 'LITE', cans: 6, price: 27.99, discount: '5% OFF', badge: 'Starter', popular: false },
  { id: 'core', name: 'CORE', cans: 8, price: 35.99, discount: '10% OFF', badge: 'Most Popular', popular: true },
  { id: 'pro', name: 'PRO', cans: 10, price: 40.99, discount: '12% OFF', badge: 'Extra Value', popular: false },
  { id: 'ultimate', name: 'ULTIMATE', cans: 12, price: 46.99, discount: '15% OFF', badge: 'Best Value', popular: false }
] as const;

// Re-exported from the discount helpers so the account page, the cart and the
// checkout cannot drift apart on what delivery costs or what waives it.
export { FREE_SHIPPING_THRESHOLD, STANDARD_DELIVERY_COST };

/**
 * One milestone reward on the loyalty rewards page.
 *
 * Every reward is rendered from its definition rather than from copy written
 * into the page, so the reward text, the voucher code and the mechanic the cart
 * will apply can never disagree. Rewards that need the customer to pick
 * something — a free can, or one option from the Platinum menu — open their
 * picker straight from here, and the pick is remembered for the cart.
 */
function LoyaltyMilestoneCard({
  milestone,
  ordersCount,
  isUsed,
  voucherCode,
  copiedCouponCode,
  onCopy,
  reward,
  onOpenPicker
}: {
  milestone: LoyaltyMilestoneDef;
  ordersCount: number;
  isUsed: boolean;
  voucherCode: string;
  copiedCouponCode: string | null;
  onCopy: (code: string, label: string) => void;
  reward: Discount | null;
  onOpenPicker: (discount: Discount) => void;
}) {
  const isUnlocked = ordersCount >= milestone.order;
  const isCopied = copiedCouponCode === voucherCode;
  const outstandingCans = getOutstandingFreeCanCount(reward);
  const chosenCans = reward?.freeCanSelections || [];
  const needsPick = isUnlocked && !isUsed && reward ? rewardNeedsSelection(reward) : false;

  const statusLabel = !isUnlocked ? 'Locked' : isUsed ? 'Used' : 'Unlocked';
  const statusClass = !isUnlocked
    ? 'bg-slate-200 text-slate-500'
    : isUsed
      ? 'bg-slate-300 text-slate-700'
      : 'bg-emerald-100 text-emerald-800';

  return (
    <div
      className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition-all ${
        !isUnlocked
          ? 'bg-slate-100/50 border-slate-200/50'
          : isUsed
            ? 'bg-slate-50 border-slate-250'
            : 'bg-emerald-50/35 border-emerald-200/60'
      }`}
    >
      <div className="space-y-1">
        <div className="flex justify-between items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
            {milestone.tier === 'platinum' ? 'Orders 31+' : `Order ${milestone.order}`}
          </span>
          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${statusClass}`}>
            {statusLabel}
          </span>
        </div>
        <p className="text-[10.5px] font-bold text-slate-800">{milestone.reward}</p>
      </div>

      {/* Gift artwork — the mystery box, or the merchandise bundle */}
      {isUnlocked && (milestone.gifts || []).length > 0 && (
        <div className="flex items-center gap-2 bg-white border border-violet-150 rounded-lg p-2">
          {(milestone.gifts || []).map(gift => (
            <React.Fragment key={gift.id}>
              <img
                src={gift.image}
                alt={gift.label}
                className="h-11 w-11 rounded-lg object-contain bg-slate-50 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-black text-[#071d37] leading-tight">{gift.label}</p>
                {gift.note && <p className="text-[9px] text-slate-500 font-semibold leading-snug">{gift.note}</p>}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Free delivery needs no pick — say plainly what it does */}
      {isUnlocked && milestone.kind === 'free-shipping' && (
        <p className="text-[9.5px] font-bold text-emerald-700 bg-white border border-emerald-100 rounded-lg p-2">
          🚚 Delivery drops to £0.00 on the order you use this code, whichever delivery option you pick.
        </p>
      )}

      {/* The cans already chosen for this reward */}
      {isUnlocked && chosenCans.length > 0 && (
        <div className="space-y-1">
          {chosenCans.map((can, index) => (
            <div key={`${can.productId}-${can.variantId || index}`} className="flex items-center gap-2 bg-white border border-emerald-100 rounded-lg p-1.5">
              {can.image ? (
                <img src={can.image} alt={can.variantName} className="h-8 w-8 rounded object-cover shrink-0" />
              ) : (
                <Package className="h-4 w-4 text-slate-300 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-[#dfa047] block truncate">{can.vendor}</span>
                <p className="text-[9.5px] font-black text-[#071d37] leading-tight truncate">{can.productTitle}</p>
                <p className="text-[9px] font-bold text-slate-500 truncate">{can.variantName}</p>
              </div>
              <span className="text-[9px] font-black text-emerald-700 shrink-0">FREE</span>
            </div>
          ))}
        </div>
      )}

      {isUnlocked ? (
        <div className="space-y-1.5">
          {/* The pick this reward is waiting on */}
          {needsPick && reward && (
            <button
              onClick={() => onOpenPicker(reward)}
              className="w-full text-[9px] font-black uppercase tracking-wider bg-[#dfa047] hover:bg-[#cf9038] text-[#071d37] py-2 px-2 rounded-lg cursor-pointer"
            >
              {reward.rewardKind === 'choice'
                ? 'Choose your reward'
                : `Choose your free can${outstandingCans !== 1 ? 's' : ''}`}
            </button>
          )}

          {/* Change a pick already made */}
          {!needsPick && chosenCans.length > 0 && reward && (
            <button
              onClick={() => onOpenPicker(reward)}
              className="w-full text-[9px] font-black uppercase tracking-wider bg-white hover:bg-slate-50 text-[#071d37] border border-slate-250 py-1.5 px-2 rounded-lg cursor-pointer"
            >
              Change selection
            </button>
          )}

          <div className="flex items-center justify-between gap-1 bg-white p-1.5 border border-emerald-100 rounded-lg">
            <div className="min-w-0">
              <span className="text-[7px] text-slate-400 font-bold uppercase block">Voucher Code</span>
              <span className="font-mono font-black text-[10px] text-[#071d37] tracking-wider block truncate">{voucherCode}</span>
            </div>
            <button
              onClick={() => onCopy(voucherCode, 'Voucher code')}
              className="text-[8px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-1 px-2 rounded cursor-pointer shrink-0 uppercase flex items-center gap-1"
            >
              {isCopied ? (
                <>
                  <Check className="h-2.5 w-2.5 text-emerald-700" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-2.5 w-2.5 text-emerald-700" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[8.5px] text-slate-500 font-semibold leading-snug">
            {isUsed
              ? 'Already redeemed on a previous order.'
              : 'Paste this code in your cart or at checkout to claim it.'}
          </p>
        </div>
      ) : (
        <span className="text-[9px] text-slate-400 font-bold block pt-1">
          Needs {milestone.order - ordersCount} more order{milestone.order - ordersCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

export function getAccountPlanLabel(planId?: string): string {
  const tier = ACCOUNT_SUB_PLANS.find(p => p.id === planId);
  return tier ? `${tier.name} (${tier.cans} Canisters)` : 'CORE (8 Canisters)';
}

/**
 * The frequency option the plan console shows for a stored billing interval.
 *
 * Plans store a canonical interval ("bi-weekly", "month", "1day"); the console
 * offers "Weekly" / "Bi-Weekly" / "One Month". Anything else ("1day" for the
 * Next Day test plans) is returned unchanged and shown as its own option, so
 * opening a plan never quietly swaps its schedule for the first option.
 */
export function billingIntervalToFrequencyOption(interval?: string | null): string {
  const s = String(interval || '').toLowerCase().trim();
  if (!s) return '';
  if (/bi[\s_-]*week|fortnight|14/.test(s)) return 'Bi-Weekly';
  if (/month|30/.test(s)) return 'One Month';
  if (/week|\b7\b/.test(s)) return 'Weekly';
  return String(interval);
}

/** A plan the customer removed. The API reports these separately from live plans. */
interface DeletedSubscription {
  id: string;
  deletedAt: string | null;
  planName: string | null;
}

interface CustomerAccountProps {
  customers: Customer[];
  loggedInCustomer: Customer | null;
  onLogin: (customer: Customer) => void;
  onLogout: () => void;
  onUpdateWishlist: (productId: string, action: 'add' | 'remove') => void;
  allProducts: Product[];
  orders: Order[];
  onAddAddress: (address: string) => void;
  onRemoveAddress: (index: number) => void;
  onUpdateProfile?: (customer: Customer) => void;
  onUpdateOrder?: (order: Order) => void;
  discounts?: Discount[];
  onAddToCart?: (product: Product, qty: number) => void;
  onOpenCart?: () => void;
  onNavigate?: (tab: string, arg?: string) => void;
}

export default function CustomerAccount({
  customers,
  loggedInCustomer,
  onLogin,
  onLogout,
  onUpdateWishlist,
  allProducts,
  orders,
  onAddAddress,
  onRemoveAddress,
  onUpdateProfile,
  onUpdateOrder,
  discounts = [],
  onAddToCart,
  onOpenCart,
  onNavigate
}: CustomerAccountProps) {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | 'reset' | 'verify'>('login');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [referredByCodeInput, setReferredByCodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleDirectGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await signInWithGoogle();
      if (res && res.customer) {
        localStorage.setItem('ps_logged_in_customer', JSON.stringify(res.customer));
        onLogin(res.customer);
        setSuccessMsg(`Signed in as ${res.customer.name || res.customer.email}!`);
      }
    } catch (err: any) {
      console.warn('[Google Auth Error]', err);
      if (err?.message?.includes('closed') || err?.message?.includes('cancelled')) {
        setErrorMsg('Google Sign-In was closed or cancelled. Please try again.');
      } else if (err?.message?.includes('blocked')) {
        setErrorMsg('Sign-In popup was blocked by browser. Please allow popups for this site.');
      } else {
        setErrorMsg(err?.message || 'Google Sign-In could not be completed.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };
  const [newAddress, setNewAddress] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrApt, setAddrApt] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrZip, setAddrZip] = useState('');
  const [addrCountry, setAddrCountry] = useState('United Kingdom');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);
  // Which order's invoice is being handed to the browser, so the button that
  // was clicked can show its own progress without freezing the whole list.
  const [invoiceBusyId, setInvoiceBusyId] = useState<string | null>(null);

  /**
   * Opens the print dialog for one order's invoice, where the customer chooses
   * "Save as PDF". If the browser refuses to print (blocked popup, print
   * unavailable) the invoice is saved as a self-contained HTML file instead so
   * the customer is never left without a copy.
   */
  const handleDownloadInvoice = (order: Order) => {
    if (!order) return;
    setInvoiceBusyId(String(order.id));
    try {
      const printed = printInvoice(order, { products: allProducts });
      if (!printed) downloadInvoiceFile(order, { products: allProducts });
    } catch {
      downloadInvoiceFile(order, { products: allProducts });
    } finally {
      setTimeout(() => setInvoiceBusyId(prev => (prev === String(order.id) ? null : prev)), 1200);
    }
  };

  const handleCopyCouponCode = (code: string, label = 'Voucher code') => {
    navigator.clipboard.writeText(code);
    setCopiedCouponCode(code);
    setTimeout(() => {
      setCopiedCouponCode(prev => (prev === code ? null : prev));
    }, 2500);
  };

  // Cancel & Return/Exchange Modal States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Changed Mind');
  const [cancelRefundMethod, setCancelRefundMethod] = useState<'original' | 'store_credit'>('original');

  // Subscription Plan Cancellation Modal States
  const [showSubCancelModal, setShowSubCancelModal] = useState(false);
  // The plan the cancel dialog is acting on. A customer can hold several plans,
  // so cancellation has to name the one they picked.
  const [cancellingSubscriptionId, setCancellingSubscriptionId] = useState<string | null>(null);
  const [subCancelReason, setSubCancelReason] = useState('Taking a break');
  const [subCancelOtherNotes, setSubCancelOtherNotes] = useState('');
  const [isCancellingSub, setIsCancellingSub] = useState(false);
  const [isReactivatingSub, setIsReactivatingSub] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [planSaveFeedback, setPlanSaveFeedback] = useState<string | null>(null);
  const [subActionToast, setSubActionToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Promo / referral code for the Account-page subscription purchase. Resolved
  // with the same resolveDiscountCode helper the checkout uses, so DB codes,
  // loyalty milestone coupons and customer referral codes all behave
  // identically in both places.
  const [subPromoInput, setSubPromoInput] = useState('');
  const [subPromoDiscount, setSubPromoDiscount] = useState<Discount | null>(null);
  const [subPromoError, setSubPromoError] = useState('');
  const [subPromoSuccess, setSubPromoSuccess] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subCheckoutError, setSubCheckoutError] = useState<string | null>(null);

  // Reward picker shared by the loyalty rewards page and the plan checkout. The
  // context records which of the two opened it, so confirming a selection
  // updates the right place.
  const [rewardPicker, setRewardPicker] = useState<{
    mode: 'cans' | 'choice';
    context: 'loyalty' | 'sub';
    discount: Discount;
  } | null>(null);
  // Selections are persisted rather than held in state so they survive to the
  // cart; this counter re-reads them after a save so the page reflects the pick.
  const [rewardSelectionVersion, setRewardSelectionVersion] = useState(0);

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnType, setReturnType] = useState<'Return' | 'Refund' | 'Exchange'>('Return');
  const [returnReason, setReturnReason] = useState('Damaged or Defective');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnRefundMethod, setReturnRefundMethod] = useState<'original' | 'store_credit'>('original');

  // Active view tab state (mimicking the sidebar items)
  const accountTabPaths: Record<string, string> = {
    dashboard: '/pages/account',
    orders: '/pages/account/orders',
    subscriptions: '/pages/account/subscriptions',
    wishlist: '/pages/account/wishlist',
    loyalty: '/pages/account/loyalty-rewards',
    referrals: '/pages/account/referrals',
    details: '/pages/account/account-details',
    addresses: '/pages/account/delivery-addresses',
    support: '/pages/account/help-and-support'
  };
  const accountPathTabs = Object.fromEntries(Object.entries(accountTabPaths).map(([tab, path]) => [path, tab]));
  const initialAccountPath = window.location.pathname.replace(/\/$/, '') || '/pages/account';
  const [activeTab, setActiveTabState] = useState<string>(accountPathTabs[initialAccountPath] || 'dashboard');
  const setActiveTab = (tab: string, subscriptionId?: string | null) => {
    setActiveTabState(tab);
    const nextPath = accountTabPaths[tab] || accountTabPaths.dashboard;
    // The managed plan travels in the URL, so "Manage Plan" opens that plan and
    // a reload or a shared link opens the same one.
    const query = tab === 'subscriptions' && subscriptionId ? `?sub=${encodeURIComponent(subscriptionId)}` : '';
    const nextUrl = `${nextPath}${query}`;
    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history.pushState({ accountTab: tab, subscriptionId: subscriptionId || null }, '', nextUrl);
    }
  };

  /** Opens the management screen for one specific subscription. */
  const openSubscriptionManager = (subscriptionId?: string | null) => {
    setActiveSubscriptionId(subscriptionId ? String(subscriptionId) : null);
    setActiveTab('subscriptions', subscriptionId ? String(subscriptionId) : null);
  };
  const [accountSubscriptions, setAccountSubscriptions] = useState<any[]>([]);
  /**
   * Whether the stored plans have been fetched yet.
   *
   * The plan list is stored plans plus a card rebuilt from any subscription
   * order no stored plan claims. Before the fetch resolves there are no stored
   * plans, so every order rebuilt a card and the customer saw a complete,
   * order-derived list for a moment — then it was replaced as the real plans
   * arrived and suppressed those rebuilt cards. Rendering nothing until the
   * fetch settles means the list is painted once, from both sources.
   */
  const [accountSubscriptionsLoaded, setAccountSubscriptionsLoaded] = useState(false);
  // Plans the customer removed, with when they were removed. The API strips
  // them from `subscriptions` entirely, so without this a removed plan would be
  // rebuilt from its own orders and reappear — and without the timestamp, an
  // order placed after the removal would be hidden along with it.
  const [deletedSubscriptions, setDeletedSubscriptions] = useState<DeletedSubscription[]>([]);
  // Which single subscription a per-plan Resume / Remove button is working on,
  // so one card's spinner does not disable every other card's buttons.
  const [subActionBusyId, setSubActionBusyId] = useState<string | null>(null);
  /**
   * Which subscription the management screen is editing.
   *
   * A customer can hold several plans, and "Manage Plan" has to open the one
   * they clicked. It lives in the URL so the link can be shared, bookmarked and
   * survives a reload.
   */
  const [activeSubscriptionId, setActiveSubscriptionId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('sub');
  });
  const [isSavingBox, setIsSavingBox] = useState(false);
  const [pendingDeleteSubId, setPendingDeleteSubId] = useState<string | null>(null);

  // Track order in customer portal
  const [trackerInput, setTrackerInput] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackerError, setTrackerError] = useState('');
  const [liveTrackingInfo, setLiveTrackingInfo] = useState<any>(null);
  const [liveTrackingLoading, setLiveTrackingLoading] = useState(false);

  // Profile editing local states
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // Support Form state
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportStatus, setSupportStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { executeRecaptcha } = useRecaptcha();

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInCustomer) return;
    if (!supportMessage.trim()) return;

    setSupportSubmitting(true);
    setSupportStatus(null);
    try {
      const recaptchaToken = await executeRecaptcha('contact_form_submit');
      const res = await fetch('/api/email/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: loggedInCustomer.name || 'Account Member',
          email: loggedInCustomer.email,
          phone: loggedInCustomer.phone || '',
          subject: supportSubject.trim() || 'Help & Support Request from Customer Portal',
          message: supportMessage.trim(),
          recaptchaToken
        })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setSupportStatus({
          type: 'success',
          text: 'Your support request has been submitted successfully to our team! A confirmation email was dispatched to your address.'
        });
        setSupportSubject('');
        setSupportMessage('');
      } else {
        setSupportStatus({
          type: 'error',
          text: data.error || 'Failed to submit support request. Please try again or reach out to support@pouch-supply.com directly.'
        });
      }
    } catch (err: any) {
      setSupportStatus({
        type: 'error',
        text: err.message || 'Failed to connect to support service. Please try again.'
      });
    } finally {
      setSupportSubmitting(false);
    }
  };

  // Star Progress System definition and calculations
  const TIERS = [
    { level: 1, name: "Bronze Member", required: 5 },
    { level: 2, name: "Silver Member", required: 15 },
    { level: 3, name: "Gold Member", required: 30 },
    { level: 4, name: "Platinum Member", required: 31 }
  ];

  const myOrders = (loggedInCustomer && loggedInCustomer.email) 
    ? orders
        .filter(o => o && o.customerEmail && o.customerEmail.toLowerCase() === (loggedInCustomer.email || '').toLowerCase())
        .sort((a, b) => parseOrderTime(b) - parseOrderTime(a))
    : [];
  const ordersCount = myOrders.length;

  /**
   * Loyalty voucher codes this customer has already spent, so a reward that has
   * been used reads as used instead of still looking available. Matched on the
   * milestone code rather than the prefixed voucher so a customer who changed
   * their name still sees their history.
   */
  const usedRewardCodes = useMemo(() => {
    const used = new Set<string>();
    for (const order of myOrders) {
      const applied = (order as any)?.discountApplied;
      if (!applied) continue;
      const milestone = applied.loyaltyMilestoneCode
        || extractBaseMilestoneCode(String(applied.title || ''));
      if (milestone) used.add(milestone);
    }
    return used;
  }, [myOrders]);

  const mySubOrders = myOrders.filter(isSubscriptionOrder);

  /**
   * Reads the removed-plan list off the subscriptions response.
   *
   * Tolerates the older `deletedSubscriptionIds: string[]` shape so a browser
   * holding a cached bundle against a newer server, or the reverse, still
   * honours removals instead of resurrecting every removed plan.
   */
  const parseDeletedSubscriptions = (data: any): DeletedSubscription[] => {
    if (Array.isArray(data?.deletedSubscriptions)) {
      return data.deletedSubscriptions
        .filter((entry: any) => entry && entry.id)
        .map((entry: any) => ({
          id: String(entry.id),
          deletedAt: entry.deletedAt || null,
          planName: entry.planName || null
        }));
    }
    if (Array.isArray(data?.deletedSubscriptionIds)) {
      return data.deletedSubscriptionIds.map((id: any) => ({ id: String(id), deletedAt: null, planName: null }));
    }
    return [];
  };

  /**
   * Loads this customer's own subscriptions.
   *
   * Deliberately the per-customer endpoint, not /status: that one returns every
   * subscription in the store — names, emails and amounts — and left the
   * filtering to the browser, so any signed-in customer could read the whole
   * subscriber list.
   */
  const loadAccountSubscriptions = useCallback(async (): Promise<any[]> => {
    const email = loggedInCustomer?.email?.trim();
    if (!email) {
      setAccountSubscriptions([]);
      setAccountSubscriptionsLoaded(true);
      return [];
    }
    try {
      const res = await fetch(`/api/subscriptions/customer/${encodeURIComponent(email.toLowerCase())}`);
      if (!res.ok) return [];
      const data = await res.json();
      const subs = Array.isArray(data?.subscriptions) ? data.subscriptions : [];
      setAccountSubscriptions(subs);
      setDeletedSubscriptions(parseDeletedSubscriptions(data));
      setAccountSubscriptionsLoaded(true);
      return subs;
    } catch {
      setAccountSubscriptionsLoaded(true);
      return [];
    }
  }, [loggedInCustomer?.email]);

  useEffect(() => {
    let cancelled = false;
    const email = loggedInCustomer?.email?.trim();
    if (!email) {
      setAccountSubscriptions([]);
      setDeletedSubscriptions([]);
      setAccountSubscriptionsLoaded(true);
      return () => { cancelled = true; };
    }

    setAccountSubscriptionsLoaded(false);
    fetch(`/api/subscriptions/customer/${encodeURIComponent(email.toLowerCase())}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (cancelled) return;
        setAccountSubscriptions(Array.isArray(data?.subscriptions) ? data.subscriptions : []);
        setDeletedSubscriptions(parseDeletedSubscriptions(data));
        setAccountSubscriptionsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setAccountSubscriptions([]);
          setDeletedSubscriptions([]);
          setAccountSubscriptionsLoaded(true);
        }
      });

    return () => { cancelled = true; };
  }, [loggedInCustomer?.email]);

  // Plans the customer removed from their account are kept server-side for
  // order history but must not appear in their list.
  const storedAccountSubscriptions = accountSubscriptions.filter((subscription: any) =>
    String(subscription.status || '').toLowerCase() !== 'deleted'
  );

  /**
   * Plans rebuilt from the customer's own subscription orders.
   *
   * Checkout writes the subscription record and the order separately, and both
   * writes are best-effort (Prisma and the JSON store are each wrapped in their
   * own try/catch). When the record write is the one that fails, the plan is
   * invisible on this page even though its order is sitting in the customer's
   * history — which is exactly what a customer who subscribed yesterday sees.
   * Rebuilding a card from the order keeps the plan on screen.
   */
  const { plans: orderDerivedSubscriptions, attributedOrderIdsByPlan } = useMemo(() => {
    const storedIds = new Set(storedAccountSubscriptions.map((s: any) => String(s.id)));
    const removedAt = new Map(deletedSubscriptions.map(entry => [entry.id, entry.deletedAt]));
    const derived = new Map<string, any>();
    // Orders that do not name a plan, attached to the plan on screen they most
    // plausibly belong to. They are shown on that plan's card, so they need no
    // card of their own and are not reported as unattached.
    const attributed = new Map<string, string[]>();

    /**
     * When an order was actually placed, or null if that cannot be established.
     *
     * Deliberately NOT parseOrderTime: that falls back to the digits of the
     * order id so a list can always be sorted, which turns order PS35806 into
     * 35806ms — 1970. Compared against a removal date every such order looks
     * older than the removal and gets hidden. A date good enough to sort by is
     * not good enough to hide a paid order on.
     */
    const placedAt = (order: Order): number | null => {
      for (const raw of [(order as any).createdAt, order.date]) {
        if (!raw) continue;
        const direct = new Date(raw).getTime();
        if (!isNaN(direct) && direct > 0) return direct;
        // "Aug 8, 2026 at 12:04 AM" — the separator Date cannot read.
        const cleaned = new Date(String(raw).replace(/ at /i, ' ')).getTime();
        if (!isNaN(cleaned) && cleaned > 0) return cleaned;
      }
      return null;
    };

    /**
     * Does removing this plan account for this order?
     *
     * Only if the order came first. An order placed after the plan was removed
     * is activity the removal cannot explain — a paid order the customer needs
     * to see — so it is shown rather than swallowed by a stale removal. An
     * order that cannot be dated is shown for the same reason: a removal may
     * not hide an order we are unable to place before it.
     */
    const removalCovers = (planId: string, order: Order): boolean => {
      if (!removedAt.has(planId)) return false;
      const deletedAt = removedAt.get(planId);
      if (!deletedAt) return true; // No timestamp recorded: honour the removal.
      const removedTime = new Date(deletedAt).getTime();
      if (isNaN(removedTime)) return true;
      const orderTime = placedAt(order);
      if (orderTime === null) return false;
      return orderTime <= removedTime;
    };

    /**
     * Plans on screen that no order claims yet, by tier.
     *
     * This is what makes an order with no recorded plan attributable. Orders
     * written before checkout stamped a subscription id cannot name their plan,
     * so the only evidence they belong to an existing plan is that the plan has
     * no other order claiming it. A plan whose own order is already in the
     * history explains nothing about a further, unattributed order — that order
     * is something else the customer bought, and it gets its own card.
     *
     * Only plans actually shown count. Removed plans used to count too, so an
     * order was "attributed" to a plan the customer could not see and vanished
     * from the page entirely.
     */
    const claimedPlanIds = new Set(
      mySubOrders.map(order => getOrderSubscriptionId(order)).filter(Boolean)
    );
    const unclaimedPlansByTier = new Map<string, string[]>();
    for (const plan of storedAccountSubscriptions as any[]) {
      if (claimedPlanIds.has(String(plan.id))) continue;
      const tier = detectPlanTier(plan.planName);
      if (!tier) continue;
      unclaimedPlansByTier.set(tier, [...(unclaimedPlansByTier.get(tier) || []), String(plan.id)]);
    }

    // mySubOrders is newest-first, so the first order seen for a plan is the
    // one whose price, frequency and box contents are current.
    for (const order of mySubOrders) {
      const linkedId = getOrderSubscriptionId(order);

      // Already covered by a stored plan — nothing to rebuild.
      if (linkedId && storedIds.has(linkedId)) continue;
      // Removing a plan is meant to take it off this list for good. Its orders
      // stay in the history, so rebuilding from them would undo the removal.
      if (linkedId && removalCovers(linkedId, order)) continue;

      const details = extractSubscriptionDetails(order, allProducts as any);
      const planName = details.planName || 'Subscription Box';

      // An order naming no plan is assumed to belong to a plan of its own tier
      // that has no order claiming it yet — that is the pre-subscriptionId data
      // this guard exists for. Once every plan of that tier already has its own
      // order, an extra unattributed order is a separate purchase and gets its
      // own card rather than being swallowed.
      const orderTier = detectPlanTier(planName);
      const ownerCandidates = !linkedId && orderTier ? unclaimedPlansByTier.get(orderTier) : undefined;
      if (ownerCandidates && ownerCandidates.length > 0) {
        // One order per unclaimed plan. This is meant to reunite a plan with the
        // single order that created it, but the candidate was never consumed, so
        // EVERY unlinked order of that tier piled onto the same plan — three
        // separate LITE purchases showed as one card with three order badges.
        const ownerId = ownerCandidates.shift() as string;
        if (ownerCandidates.length === 0) unclaimedPlansByTier.delete(orderTier as string);
        attributed.set(ownerId, [...(attributed.get(ownerId) || []), String(order.id)]);
        continue;
      }
      // Renewals of one plan collapse onto a single card rather than showing one
      // card per delivery. A renewal always carries its plan id, and the worker
      // also tags it "Worldpay Recurring"; anything else is a separate purchase
      // and gets its own card.
      //
      // Keying every unlinked order by plan NAME collapsed distinct purchases
      // too: three separate "LITE Plan" subscriptions bought on different days
      // shared one card, because they share a name.
      const isRenewalOrder = Array.isArray(order.tags)
        && order.tags.some((t: any) => String(t).toLowerCase().includes('recurring'));
      const key = linkedId || (isRenewalOrder ? `plan:${planName.toLowerCase()}` : `order:${order.id}`);
      if (derived.has(key)) continue;

      const cancelled = Boolean(
        details.isCancelled ||
        order.subscriptionCancelled ||
        String(details.status || '').toLowerCase() === 'cancelled' ||
        (Array.isArray(order.tags) && order.tags.some(t => String(t).toLowerCase() === 'subscription cancelled'))
      );
      const boxItems = details.selectedProducts || [];
      const planTier = ACCOUNT_SUB_PLANS.find(t => t.id === details.planSlug);

      derived.set(key, {
        id: linkedId || `order-${order.id}`,
        planName,
        planId: details.planSlug,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        amount: Number(order.total) || planTier?.price || 0,
        currency: 'GBP',
        status: cancelled ? 'cancelled' : 'active',
        billingInterval: details.frequency,
        nextBillingDate: details.nextPaymentDate,
        cansCount:
          boxItems.reduce((sum: number, p: any) => sum + (Number(p.quantity) || 0), 0) || planTier?.cans || 0,
        items: boxItems,
        deliveryMethod: order.deliveryMethod,
        createdAt: order.createdAt || order.date,
        sourceOrderId: order.id,
        cancellationReason: details.cancellationReason,
        cancelledAt: details.cancelledAt,
        // Flags a plan that exists only as an order: the subscriptions store has
        // no record to update, so the UI must not offer actions the server
        // cannot carry out against it.
        isDerivedFromOrder: true
      });
    }

    return { plans: Array.from(derived.values()), attributedOrderIdsByPlan: attributed };
  }, [mySubOrders, storedAccountSubscriptions, deletedSubscriptions, allProducts]);

  const visibleAccountSubscriptions = useMemo(
    () => [...storedAccountSubscriptions, ...orderDerivedSubscriptions],
    [storedAccountSubscriptions, orderDerivedSubscriptions]
  );

  /**
   * Every order booked against a plan, newest first.
   *
   * One plan bills repeatedly, so the customer can hold three subscription
   * orders across two plans: the renewal shares its plan with the order that
   * started it. Showing only one order per card made that third order look
   * missing, so all of them are listed and every order number the customer has
   * is accounted for on this page.
   *
   * `sourceOrderId` — the order the checkout recorded against the plan — is
   * included even when that order is not in the loaded history.
   */
  const subscriptionOrderIds = useCallback((subscription: any): string[] => {
    const planId = String(subscription?.id || '');
    const ids: string[] = [];

    // mySubOrders is newest-first, so this list is too.
    for (const order of mySubOrders) {
      if (planId && getOrderSubscriptionId(order) === planId) ids.push(String(order.id));
    }

    // Orders that name no plan but were attached to this one.
    for (const id of attributedOrderIdsByPlan.get(planId) || []) {
      if (!ids.includes(id)) ids.push(id);
    }

    const stamped = String(subscription?.sourceOrderId || '').trim();
    if (stamped && !ids.includes(stamped)) ids.push(stamped);

    return ids;
  }, [mySubOrders, attributedOrderIdsByPlan]);

  /**
   * Subscription orders that no plan card accounts for.
   *
   * A plan can legitimately disappear from the list — the customer removed it
   * after cancelling — but the orders it billed were still paid, and removal is
   * explicitly promised not to affect them. Dropping them off this page with
   * the plan loses a paid order from the customer's view of their
   * subscriptions, so whatever the plan list cannot show is listed here instead
   * of vanishing.
   */
  const unlistedSubscriptionOrders = useMemo(() => {
    // Only what is actually on a card counts as accounted for — so every
    // subscription order appears on this page exactly once, either on its
    // plan's card or in this list, and none can disappear.
    const accounted = new Set<string>();
    for (const subscription of visibleAccountSubscriptions) {
      for (const id of subscriptionOrderIds(subscription)) accounted.add(id);
    }
    return mySubOrders.filter(order => !accounted.has(String(order.id)));
  }, [mySubOrders, visibleAccountSubscriptions, subscriptionOrderIds]);

  /**
   * The plan the management screen is editing.
   *
   * Falls back to the first live plan so the screen is never empty, but an
   * explicit id from "Manage Plan" always wins — that is the whole point of the
   * button: it must open the plan the customer clicked, not whichever plan
   * happens to be first.
   */
  const activeSubscription =
    visibleAccountSubscriptions.find((s: any) => String(s.id) === String(activeSubscriptionId)) ||
    visibleAccountSubscriptions.find((s: any) =>
      ['active', 'subscribed', 'paused'].includes(String(s.status || '').toLowerCase())
    ) ||
    visibleAccountSubscriptions[0] ||
    null;

  /**
   * The plan the customer explicitly asked to manage, or null on the plan list.
   *
   * `activeSubscription` cannot answer this: it falls back to the first plan so
   * the editor is never empty, which is why the management console and the box
   * editor used to be open the moment the page loaded. Managing is a deliberate
   * act — "Manage This Plan" — and it is recorded in the URL as ?sub=<id>.
   */
  const managedSubscription = activeSubscriptionId
    ? visibleAccountSubscriptions.find((s: any) => String(s.id) === String(activeSubscriptionId)) || null
    : null;
  const isManagingSubscription = Boolean(managedSubscription);

  /** Closes the management console and returns to the plan list. */
  const closeSubscriptionManager = () => {
    setActiveSubscriptionId(null);
    setActiveTab('subscriptions', null);
  };

  // A plan named in the URL that this customer does not hold is ignored rather
  // than shown: it is either stale or someone else's.
  useEffect(() => {
    if (!activeSubscriptionId) return;
    if (accountSubscriptions.length === 0) return;
    const exists = visibleAccountSubscriptions.some((s: any) => String(s.id) === String(activeSubscriptionId));
    if (!exists) setActiveSubscriptionId(null);
  }, [activeSubscriptionId, accountSubscriptions]);
  // Counted over the visible list, not the raw API response, so a plan rebuilt
  // from a brand-new order flips the page out of its "not subscribed" state
  // instead of being shown while the page still claims there is nothing there.
  const activeAccountSubscriptions = visibleAccountSubscriptions.filter((subscription: any) =>
    ['active', 'subscribed', 'paused'].includes(String(subscription.status || '').toLowerCase())
  );
  const cancelledAccountSubscriptions = visibleAccountSubscriptions.filter((subscription: any) =>
    ['cancelled', 'canceled', 'inactive', 'cancelled_at'].includes(String(subscription.status || '').toLowerCase())
  );
  /**
   * Does the customer actually have a cancelled plan?
   *
   * The plans decide it. The account-level `subStatus` flag is only consulted
   * when there are no plans to read, because it goes stale: it stays
   * "cancelled" after the customer subscribes again, which put a red
   * "Subscription Plan Cancelled — Billing Halted" banner above three live
   * plans.
   */
  // A cancelled plan alongside a live one does not mean billing has stopped.
  // Testing 'any plan cancelled' put a red "Billing Halted" banner above two
  // ACTIVE plans with deliveries scheduled, which reads as the account being
  // dead. Billing is only halted when nothing is still running.
  const hasCancelledSubscription = visibleAccountSubscriptions.length > 0
    ? activeAccountSubscriptions.length === 0 && cancelledAccountSubscriptions.length > 0
    : String((loggedInCustomer as any)?.subStatus || '').toLowerCase() === 'cancelled';
  const hasRealSubscription = activeAccountSubscriptions.length > 0 || Boolean(
    loggedInCustomer &&
    visibleAccountSubscriptions.length === 0 &&
    !hasCancelledSubscription &&
    ((loggedInCustomer as any).hasPurchasedSubscription || (loggedInCustomer as any).subscriptionStatus === 'Subscribed' || (loggedInCustomer as any).hasActiveSubscription || (loggedInCustomer as any).subStatus === 'Active' || (loggedInCustomer as any).subStatus === 'Paused' || (loggedInCustomer as any).subPlan)
  );
  const latestSubOrder = mySubOrders[0] || null;

  const getUnlockedRewardsCount = (count: number): number => {
    const staticMilestones = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29];
    let unlocked = staticMilestones.filter(m => count >= m).length;
    if (count >= 31) {
      for (let i = 31; i <= count; i++) {
        if (i % 2 !== 0) {
          unlocked++;
        }
      }
    }
    return unlocked;
  };

  const getTierInfo = (count: number) => {
    const unlockedCount = getUnlockedRewardsCount(count);
    if (count >= 31) {
      return {
        level: 4,
        currentTierName: "Platinum Member",
        badgeName: "Platinum Member",
        nextTierName: "",
        ordersNeededForNext: 0,
        progressPercentage: 100,
        unlockedCount,
        description: "Congratulations! You have reached Platinum Member status 💎! Enjoy the highest loyalty multiplier, quarterly surprise rewards, priority customer support, and direct rewards for every odd-numbered order."
      };
    } else if (count >= 16) {
      return {
        level: 3,
        currentTierName: "Gold Member",
        badgeName: "Gold Member",
        nextTierName: "Platinum Member",
        ordersNeededForNext: 31 - count,
        progressPercentage: Math.round(((count - 15) / (31 - 15)) * 100),
        unlockedCount,
        description: `You are currently a Gold Member 🥇. Complete ${31 - count} more order${31 - count > 1 ? 's' : ''} to unlock Platinum Member status.`
      };
    } else if (count >= 6) {
      return {
        level: 2,
        currentTierName: "Silver Member",
        badgeName: "Silver Member",
        nextTierName: "Gold Member",
        ordersNeededForNext: 16 - count,
        progressPercentage: Math.round(((count - 5) / (16 - 5)) * 100),
        unlockedCount,
        description: `You are currently a Silver Member 🥈. Complete ${16 - count} more order${16 - count > 1 ? 's' : ''} to unlock Gold Member status.`
      };
    } else {
      return {
        level: 1,
        currentTierName: "Bronze Member",
        badgeName: "Bronze Member",
        nextTierName: "Silver Member",
        ordersNeededForNext: 6 - count,
        progressPercentage: Math.round((count / 5) * 100),
        unlockedCount,
        description: count === 0
          ? "You are currently a Bronze Member 🥉. Every new subscriber starts here! Place your first order to start unlocking rewards."
          : `You are currently a Bronze Member 🥉. Complete ${6 - count} more order${6 - count > 1 ? 's' : ''} to unlock Silver Member status.`
      };
    }
  };

  const tierInfo = getTierInfo(ordersCount);

  const customerLoyaltyRewards = (discounts || []).filter(d => {
    if (d.type !== 'Loyalty Reward' || d.status !== 'Active') return false;
    
    // Check eligibility
    if (!d.loyaltyCustomerSelection || d.loyaltyCustomerSelection === 'All customers') {
      return true;
    }
    
    if (d.loyaltyCustomerSelection === 'Specific customers' && loggedInCustomer) {
      return (d.loyaltyCustomerEmails || [])
        .map(e => e.toLowerCase())
        .includes(loggedInCustomer.email.toLowerCase());
    }
    
    return false;
  });

  useEffect(() => {
    if (loggedInCustomer) {
      setEditName(loggedInCustomer.name);
      setEditEmail(loggedInCustomer.email);
      setEditPassword('');
    }
  }, [loggedInCustomer]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get('track');
    const tabParam = params.get('tab');
    const syncAccountPath = () => {
      const path = window.location.pathname.replace(/\/$/, '') || '/pages/account';
      const pathTab = accountPathTabs[path];
      setActiveTabState(pathTab || tabParam || 'dashboard');
    };
    syncAccountPath();
    window.addEventListener('popstate', syncAccountPath);
    if (trackId) {
      setTrackerInput(trackId);
      const found = orders.find(o => 
        o.id.toUpperCase() === trackId.toUpperCase() || 
        (o.trackingId && o.trackingId.toUpperCase() === trackId.toUpperCase())
      );
      if (found) {
        setTrackedOrder(found);
      }
    }
    return () => window.removeEventListener('popstate', syncAccountPath);
  }, [orders]);

  // Local storage state helper for customer properties
  const custKey = loggedInCustomer ? `cust_db_${loggedInCustomer.email}` : '';
  const [custState, setCustState] = useState<any>(null);

  useEffect(() => {
    if (!loggedInCustomer) {
      setCustState(null);
      return;
    }
    const saved = localStorage.getItem(custKey);
    let state: any = null;
    if (saved) {
      try {
        state = JSON.parse(saved);
      } catch (e) {}
    }

    const realReferralCode = loggedInCustomer.referralCode || `REF-PS-${loggedInCustomer.name.trim().split(" ")[0].toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const realStoreCredit = loggedInCustomer.storeCredit !== undefined ? loggedInCustomer.storeCredit : 0;

    // Gather all referred friends from both:
    // 1. Registered customers who used the referral code on signup
    // 2. Orders that were placed using the referrer's referral code/coupon
    const referredEmails = new Set<string>();
    const dynamicReferrals: Array<{
      name: string;
      email: string;
      date: string;
      status: 'Registered' | 'Ordered';
      credit: string;
    }> = [];

    // 1. Scan registered customers
    customers.forEach(c => {
      if (c && c.email && c.referredByCode && c.referredByCode.toUpperCase() === realReferralCode.toUpperCase()) {
        const cEmail = c.email.toLowerCase();
        const myEmail = (loggedInCustomer?.email || '').toLowerCase();
        if (cEmail !== myEmail) {
          referredEmails.add(cEmail);
          const hasOrdered = orders.some(o => o && o.customerEmail && o.customerEmail.toLowerCase() === cEmail);
          dynamicReferrals.push({
            name: c.name || 'Friend',
            email: cEmail,
            date: "Recently Registered",
            status: hasOrdered ? 'Ordered' : 'Registered',
            credit: hasOrdered ? '£5.00' : 'Pending'
          });
        }
      }
    });

    // 2. Scan orders for guest or other users who applied this referrer's code at checkout
    orders.forEach(o => {
      if (!o || !o.customerEmail) return;
      const disc = o.discountApplied;
      const isMyReferralCode = disc && (
        disc.id === `disc-ref-virtual-${loggedInCustomer.id}` ||
        disc.id === `disc-ref-${loggedInCustomer.id}` ||
        (disc.title && disc.title.toUpperCase() === realReferralCode.toUpperCase())
      );
      const emailLower = o.customerEmail.toLowerCase();
      const myEmail = (loggedInCustomer?.email || '').toLowerCase();
      if (isMyReferralCode && emailLower !== myEmail) {
        if (!referredEmails.has(emailLower)) {
          referredEmails.add(emailLower);
          const matchCust = customers.find(c => c && c.email && c.email.toLowerCase() === emailLower);
          const displayName = matchCust ? matchCust.name : (o.customerName || "Friend");
          dynamicReferrals.push({
            name: displayName,
            email: emailLower,
            date: o.createdAt ? new Date(o.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : "Recently Ordered",
            status: 'Ordered',
            credit: '£5.00'
          });
        } else {
          const existingRef = dynamicReferrals.find(r => r.email === emailLower);
          if (existingRef && existingRef.status !== 'Ordered') {
            existingRef.status = 'Ordered';
            existingRef.credit = '£5.00';
          }
        }
      }
    });

    const referredCount = dynamicReferrals.length;
    const referralsList = dynamicReferrals.map(r => ({
      name: r.name.split(" ")[0] + " " + (r.name.split(" ")[1] ? r.name.split(" ")[1].substring(0, 1) + "." : ""),
      date: r.date,
      status: r.status,
      credit: r.credit
    }));

    // Extract real subscription plan from latest real subscription order if present
    const latestSubOrder = mySubOrders[0] || null;
    let realPlanName = 'lite';
    let realCansCount = 6;
    let realPriceVal = 27.99;
    let realFreqVal = 'Bi-Weekly';
    let realNextPayment = '';
    let realNextDelivery = '';
    // The customer's real box contents, read back from their own subscription order.
    let realBoxItems: any[] = [];

    if (latestSubOrder) {
      const subItem = (latestSubOrder.items || []).find((i: any) => 
        i.isSubscription || 
        i.vendor === 'Subscription Pack' || 
        i.subscriptionPlan ||
        (i.productTitle && (i.productTitle.toLowerCase().includes('plan') || i.productTitle.toLowerCase().includes('subscription') || i.productTitle.toLowerCase().includes('pack')))
      ) || latestSubOrder.items[0];

      realBoxItems = parseSubscriptionProducts(latestSubOrder, subItem, allProducts as any);

      const titleLower = ((subItem as any)?.subscriptionSummary || subItem?.productTitle || '').toLowerCase();
      // The tier is read from the title the order was bought under, and only
      // from its heading. This used to test `includes('pro')` on the whole
      // plan string — which lists the box's products — before testing 'lite',
      // so a LITE plan could come out as PRO and then be saved back as PRO.
      const tier =
        detectPlanTier(subItem?.productTitle) ||
        detectPlanTier((subItem as any)?.subscriptionSummary) ||
        detectPlanTier((subItem as any)?.subscriptionPlan) ||
        'lite';
      const tierInfo = ACCOUNT_SUB_PLANS.find(t => t.id === tier);
      realPlanName = tier;
      realCansCount = tierInfo?.cans ?? 6;
      realPriceVal = tierInfo?.price ?? 27.99;

      if (subItem?.price) {
        realPriceVal = subItem.price;
      } else if (latestSubOrder.total) {
        realPriceVal = latestSubOrder.total;
      }

      if ((subItem as any)?.subscriptionFrequency) {
        realFreqVal = (subItem as any).subscriptionFrequency;
      } else if (titleLower.includes('next day')) {
        realFreqVal = 'Next Day (Test)';
      } else if (titleLower.includes('weekly') && !titleLower.includes('bi')) {
        realFreqVal = 'Weekly';
      } else if (titleLower.includes('month')) {
        realFreqVal = 'One Month';
      } else {
        realFreqVal = 'Bi-Weekly';
      }

      const orderDate = latestSubOrder.createdAt ? new Date(latestSubOrder.createdAt) : new Date();
      if ((subItem as any)?.nextPaymentDate) {
        realNextPayment = (subItem as any).nextPaymentDate;
      } else {
        const nextDate = new Date(orderDate);
        if (realFreqVal.includes('Next Day')) nextDate.setDate(orderDate.getDate() + 1);
        else if (realFreqVal === 'Weekly') nextDate.setDate(orderDate.getDate() + 7);
        else if (realFreqVal === 'One Month') nextDate.setDate(orderDate.getDate() + 30);
        else nextDate.setDate(orderDate.getDate() + 14);
        realNextPayment = nextDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }

      const delivDate = new Date(orderDate);
      if (realFreqVal.includes('Next Day')) delivDate.setDate(delivDate.getDate() + 2);
      else if (realFreqVal === 'Weekly') delivDate.setDate(delivDate.getDate() + 9);
      else if (realFreqVal === 'One Month') delivDate.setDate(delivDate.getDate() + 32);
      else delivDate.setDate(delivDate.getDate() + 16);
      realNextDelivery = delivDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    if (!state) {
      // Set default state, preferring values from actual subscription order or saved customer profile
      const chosenPlan = (loggedInCustomer as any).subPlan || (latestSubOrder ? realPlanName : 'lite');
      const chosenCans = (loggedInCustomer as any).subCansCount || (latestSubOrder ? realCansCount : (chosenPlan === 'lite' ? 6 : chosenPlan === 'pro' ? 10 : chosenPlan === 'ultimate' ? 12 : 8));
      const chosenPrice = (loggedInCustomer as any).subPrice || (latestSubOrder ? realPriceVal : (chosenPlan === 'lite' ? 27.99 : chosenPlan === 'pro' ? 40.99 : chosenPlan === 'ultimate' ? 46.99 : 35.99));
      const chosenFreq = (loggedInCustomer as any).subFrequency || (latestSubOrder ? realFreqVal : 'Bi-Weekly');

      state = {
        subPlan: chosenPlan,
        subStatus: (loggedInCustomer as any).subStatus || (hasRealSubscription ? 'Active' : 'Inactive'),
        subFrequency: chosenFreq,
        subCansCount: chosenCans,
        subPrice: chosenPrice,
        nextPayment: (loggedInCustomer as any).nextPayment || realNextPayment,
        nextDelivery: (loggedInCustomer as any).nextDelivery || realNextDelivery,
        unlockedRewards: (loggedInCustomer as any).unlockedRewards || [
          { id: 'reward_1', title: 'Free Royal Mail Tracked Delivery', desc: 'Complimentary Royal Mail shipping upgrade', redeemed: false, code: 'FREESHIP' },
          { id: 'reward_2', title: '£5.00 Off Order', desc: 'Direct cash discount voucher', redeemed: false, code: 'POUCH5OFF' },
          { id: 'reward_3', title: 'Free Extra Can', desc: 'Unlock a free sample in next box', redeemed: false, code: 'FREECAN' }
        ],
        referralCode: realReferralCode,
        referredCount: referredCount,
        referralCredit: realStoreCredit,
        referralsList: referralsList,
        savedCards: ((loggedInCustomer as any).savedCards || []).filter((c: any) => c.id !== 'card_1'),
        ordersCount: orders.filter(o => o.customerEmail && o.customerEmail.toLowerCase() === loggedInCustomer.email.toLowerCase()).length,
        // The box is described by the customer's own order. Seeding it with the
        // first two catalogue products used to invent a selection that the plan
        // editor then saved back onto the order as if the customer had chosen it.
        subItems: (loggedInCustomer as any).subItems || realBoxItems
      };
    } else {
      // Ensure sync with loggedInCustomer's real storeCredit, referralCode, and real subscription orders
      state.referralCode = realReferralCode;
      state.referralCredit = realStoreCredit;
      state.referredCount = referredCount;
      state.referralsList = referralsList;

      // If user hasn't explicitly customized plan in profile, sync with latest real subscription order
      if (latestSubOrder && !(loggedInCustomer as any).subPlanManuallyConfigured) {
        // Only fill an empty box; a selection the customer has edited is kept.
        if (!Array.isArray(state.subItems) || state.subItems.length === 0) {
          state.subItems = realBoxItems;
        }
        state.subPlan = realPlanName;
        state.subCansCount = realCansCount;
        state.subPrice = realPriceVal;
        state.subFrequency = realFreqVal;
        state.nextPayment = realNextPayment;
        state.nextDelivery = realNextDelivery;
      } else {
        if ((loggedInCustomer as any).subStatus !== undefined) state.subStatus = (loggedInCustomer as any).subStatus;
        if ((loggedInCustomer as any).subPlan !== undefined) state.subPlan = (loggedInCustomer as any).subPlan;
        if ((loggedInCustomer as any).subFrequency !== undefined) state.subFrequency = (loggedInCustomer as any).subFrequency;
        if ((loggedInCustomer as any).subCansCount !== undefined) state.subCansCount = (loggedInCustomer as any).subCansCount;
        if ((loggedInCustomer as any).subPrice !== undefined) state.subPrice = (loggedInCustomer as any).subPrice;
        if ((loggedInCustomer as any).nextPayment !== undefined) state.nextPayment = (loggedInCustomer as any).nextPayment;
        if ((loggedInCustomer as any).nextDelivery !== undefined) state.nextDelivery = (loggedInCustomer as any).nextDelivery;
      }

      if ((loggedInCustomer as any).unlockedRewards !== undefined) state.unlockedRewards = (loggedInCustomer as any).unlockedRewards;
      if ((loggedInCustomer as any).savedCards !== undefined) {
        state.savedCards = ((loggedInCustomer as any).savedCards || []).filter((c: any) => c.id !== 'card_1');
      } else if (Array.isArray(state.savedCards)) {
        state.savedCards = state.savedCards.filter((c: any) => c.id !== 'card_1');
      }

      if ((loggedInCustomer as any).subItems !== undefined) {
        state.subItems = (loggedInCustomer as any).subItems;
      } else if (latestSubOrder && (!state.subItems || state.subItems.length === 0)) {
        const cansCount = state.subCansCount || 6;
        state.subItems = allProducts.length >= 2 ? [
          { productId: allProducts[0].id, title: allProducts[0].title, quantity: Math.floor(cansCount / 2) || 3, image: allProducts[0].image, price: allProducts[0].price },
          { productId: allProducts[1].id, title: allProducts[1].title, quantity: Math.ceil(cansCount / 2) || 3, image: allProducts[1].image, price: allProducts[1].price }
        ] : [];
      }
    }

    setCustState(state);
    localStorage.setItem(custKey, JSON.stringify(state));
  }, [loggedInCustomer, custKey, customers, orders]);

  /**
   * The status of the plan currently open in the management console.
   *
   * The console used to read `custState.subStatus` — a single flag covering the
   * whole account — so opening a live plan showed "Cancelled", "None
   * (Cancelled)" and "Paused" whenever any other plan, or a stale profile
   * field, was cancelled. Status belongs to the plan, so it is read from the
   * plan; the account flag is only a fallback when no plan is open.
   */
  const managedPlanStatus: 'Active' | 'Paused' | 'Cancelled' = (() => {
    const raw = String(managedSubscription?.status || '').toLowerCase();
    if (!raw) return (custState?.subStatus as any) || 'Active';
    if (raw === 'paused') return 'Paused';
    if (['cancelled', 'canceled', 'inactive'].includes(raw)) return 'Cancelled';
    return 'Active';
  })();
  const isManagedPlanCancelled = managedPlanStatus === 'Cancelled';

  /** The managed plan's own next billing date, formatted, or null. */
  const managedPlanNextBilling: string | null = (() => {
    const raw = managedSubscription?.nextBillingDate;
    if (!raw) return null;
    const date = new Date(raw);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  })();

  /**
   * What Royal Mail actually says about this plan's most recent dispatch.
   *
   * The console used to print `custState.nextDelivery`, which is the order date
   * plus a fixed offset (App.tsx adds 32 days outright). That is a guess, it is
   * account-wide rather than per-plan, and once it is persisted on the customer
   * profile it never moves again — which is how a live plan came to advertise a
   * delivery date in the PAST while its next payment was still weeks away.
   *
   * Royal Mail is the only source that knows. It publishes a dispatch STATE
   * rather than a future date, so that is what is shown; when it has no record
   * of the parcel yet, this returns null and the console says so instead of
   * inventing a date.
   */
  const managedPlanDelivery: { label: string; detail: string | null } | null = (() => {
    const planId = String(managedSubscription?.id || '');
    if (!planId) return null;

    const planOrders = (myOrders || [])
      .filter((o: any) => String(o?.subscriptionId || '') === planId)
      .sort((a: any, b: any) => {
        const at = new Date(a?.createdAt || a?.date || 0).getTime();
        const bt = new Date(b?.createdAt || b?.date || 0).getTime();
        return bt - at;
      });

    const latest: any = planOrders[0];
    if (!latest) return null;

    const rm = latest?.data?.royalMail;
    const tracking = latest?.trackingNumber || latest?.trackingId || rm?.trackingNumber || null;
    const fulfilment = String(latest?.fulfillmentStatus || '');

    if (/deliver/i.test(fulfilment)) {
      // A real, dated event if Royal Mail recorded one; never a computed date.
      const events: any[] = Array.isArray(latest?.trackingHistory) ? latest.trackingHistory : [];
      const delivered = events.find((e: any) => /deliver/i.test(String(e?.status || '')));
      return { label: 'Delivered', detail: delivered?.timestamp || null };
    }

    // A tracking number is allocated when the label is generated, which happens
    // days before the parcel is handed over. Only Royal Mail's own despatch
    // confirmation — or an admin moving the order — means it has actually left.
    if (isDispatched(fulfilment) || rm?.despatchedOn) {
      return { label: 'Dispatched with Royal Mail', detail: tracking ? `Tracking ${tracking}` : null };
    }

    if (tracking) {
      return { label: 'Label printed, awaiting despatch', detail: `Tracking ${tracking}` };
    }

    if (rm?.royalMailOrderId) {
      // Royal Mail has the order but has not allocated tracking, which it only
      // does when the label is generated.
      return { label: 'Awaiting despatch', detail: rm?.serviceName || null };
    }

    return null;
  })();

  /**
   * The tier and frequency the opened plan actually has, captured when the
   * console opens. Save compares against this so it sends only what the
   * customer changed — nothing they did not touch is ever written back.
   */
  const [planDraftSeed, setPlanDraftSeed] = useState<{ planId: string; tier: string; frequency: string } | null>(null);

  /**
   * Seeds the console's editable fields from the plan being opened.
   *
   * The console edits `custState`, which is account-wide. It used to show
   * whatever that held — PRO, on this account — while a LITE plan was open,
   * and Save then wrote PRO over the LITE plan. It now starts from the plan
   * itself. Local state only: opening a plan writes nothing anywhere.
   */
  useEffect(() => {
    if (!managedSubscription) {
      setPlanDraftSeed(null);
      return;
    }
    // Strict: a plan whose name names no tier leaves the tier cards alone
    // rather than being taken for PRO, which is what getPlanSlug falls back to.
    const tierId = detectPlanTier(managedSubscription.planName) || detectPlanTier(managedSubscription.planId);
    const tier = tierId ? ACCOUNT_SUB_PLANS.find(t => t.id === tierId) : undefined;
    const frequency = billingIntervalToFrequencyOption(managedSubscription.billingInterval);
    const planItems = Array.isArray(managedSubscription.items) ? managedSubscription.items : null;

    // With no recognisable tier the baseline is whatever the cards already
    // show, so Save sends a tier only if the customer actually picks one.
    setPlanDraftSeed({ planId: String(managedSubscription.id), tier: tier?.id || custState?.subPlan || '', frequency });
    setCustState((prev: any) => prev ? {
      ...prev,
      ...(tier ? { subPlan: tier.id } : {}),
      subPrice: Number(managedSubscription.amount) || tier?.price || prev.subPrice,
      subCansCount: Number(managedSubscription.cansCount) || tier?.cans || prev.subCansCount,
      subFrequency: frequency || prev.subFrequency,
      ...(planItems && planItems.length > 0 ? { subItems: planItems } : {})
    } : prev);
    // Re-seed only when a different plan is opened, so edits in progress are
    // not reset by an unrelated re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managedSubscription?.id]);

  const updateCustState = (newVal: any) => {
    const enrichedVal = {
      ...newVal,
      subPlanManuallyConfigured: true
    };
    setCustState(enrichedVal);
    localStorage.setItem(custKey, JSON.stringify(enrichedVal));
    if (onUpdateProfile && loggedInCustomer) {
      onUpdateProfile({
        ...loggedInCustomer,
        ...enrichedVal
      });
    }

    // Deliberately no server write here. This used to POST the whole account
    // state to /api/subscriptions/update-plan on EVERY call — adding a saved
    // card, pausing, changing frequency — aimed at whichever plan happened to
    // be first, so an unrelated click rewrote a LITE plan (and, server-side,
    // every one of the customer's past orders) to the account's default tier.
    // Plan changes are written only by the explicit Save / Pause / Cancel
    // actions, each of which names the plan it changes.
  };

  const handlePlanTierChange = (plan: string) => {
    let cans = 8, price = 35.99;
    if (plan === 'lite') { cans = 6; price = 27.99; }
    else if (plan === 'pro') { cans = 10; price = 40.99; }
    else if (plan === 'ultimate') { cans = 12; price = 46.99; }
    else { cans = 8; price = 35.99; }

    let currentSubItems = [...(custState.subItems || [])];
    if (currentSubItems.length === 0) {
      currentSubItems = allProducts.length >= 2 ? [
        { productId: allProducts[0].id, title: allProducts[0].title, quantity: Math.floor(cans / 2) || 3, image: allProducts[0].image, price: allProducts[0].price },
        { productId: allProducts[1].id, title: allProducts[1].title, quantity: Math.ceil(cans / 2) || 3, image: allProducts[1].image, price: allProducts[1].price }
      ] : [
        { productId: 'prod-1', title: 'VELO Freeze Max', quantity: Math.floor(cans / 2) || 3, image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=120&q=80', price: 4.50 },
        { productId: 'prod-2', title: 'ZYN Cool Mint', quantity: Math.ceil(cans / 2) || 3, image: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=120&q=80', price: 4.50 }
      ];
    } else {
      const totalCurrent = currentSubItems.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
      if (totalCurrent !== cans) {
        if (cans > totalCurrent) {
          currentSubItems[0].quantity = (currentSubItems[0].quantity || 1) + (cans - totalCurrent);
        } else {
          let diff = totalCurrent - cans;
          for (let i = currentSubItems.length - 1; i >= 0; i--) {
            if ((currentSubItems[i].quantity || 1) > diff) {
              currentSubItems[i].quantity -= diff;
              break;
            } else {
              diff -= ((currentSubItems[i].quantity || 1) - 1);
              currentSubItems[i].quantity = 1;
            }
          }
        }
      }
    }

    const updated = {
      ...custState,
      subPlan: plan,
      subCansCount: cans,
      subPrice: price,
      subItems: currentSubItems,
      subPlanManuallyConfigured: true
    };
    // A draft only. Picking a tier card used to save it on the spot — to the
    // customer profile and, through the old background sync, onto the plan and
    // every past order. Nothing is written until the customer presses Save Plan.
    setCustState(updated);
    setSubActionToast({
      type: 'info',
      message: `${plan.toUpperCase()} selected (${cans} canisters, £${price.toFixed(2)} per delivery). Press Save Plan to apply it from your next delivery.`
    });
  };

  // ---------------------------------------------------------------------
  // Account-page subscription checkout
  //
  // Mirrors CheckoutView: resolve a promo/referral code, apply it to the plan
  // price, add delivery, then hand off to the same Worldpay Hosted Payment
  // Page session endpoint. The item is flagged isSubscription so the backend
  // creates the recurring agreement with a stored credential.
  // ---------------------------------------------------------------------
  const selectedPlanTier =
    ACCOUNT_SUB_PLANS.find(p => p.id === custState?.subPlan) ||
    ACCOUNT_SUB_PLANS.find(p => p.id === 'core')!;

  const subPlanPrice = Number(custState?.subPrice ?? selectedPlanTier.price) || selectedPlanTier.price;
  // calculateDiscountAmount expects cart items; the plan is a single line item.
  const subPseudoCart = [
    {
      productId: `sub-pack-${selectedPlanTier.id}`,
      productTitle: `${selectedPlanTier.name} Subscription Box`,
      price: subPlanPrice,
      quantity: 1,
      isSubscription: true
    } as any
  ];

  const subDiscountValue = calculateDiscountAmount(subPromoDiscount, subPseudoCart, subPlanPrice);
  const subAfterDiscount = Math.max(subPlanPrice - subDiscountValue, 0);
  /**
   * Opens whichever picker an applied reward is waiting on. `context` says who
   * asked: the loyalty rewards page (where the pick is only remembered) or the
   * plan checkout (where it also has to update the live discount).
   */
  const openRewardPickerFor = (discount: Discount, context: 'loyalty' | 'sub') => {
    if (discount.rewardKind === 'choice') {
      setRewardPicker({ mode: 'choice', context, discount });
    } else if (discount.rewardKind === 'free-cans') {
      setRewardPicker({ mode: 'cans', context, discount });
    }
  };

  /**
   * Turns a loyalty voucher code into the reward it stands for, with any pick
   * the customer has already made restored. Used by the rewards page so a
   * milestone card knows whether it needs a can chosen and which cans are on it.
   */
  const resolveRewardForCode = useCallback((code: string): Discount | null => {
    const res = resolveDiscountCode(code, [], [], loggedInCustomer);
    if (!res.success || !res.discount) return null;
    return hydrateRewardSelection(res.discount);
    // rewardSelectionVersion is the dependency that re-reads a just-saved pick.
  }, [loggedInCustomer, rewardSelectionVersion]);

  const handleConfirmRewardCans = (selections: Discount['freeCanSelections']) => {
    if (!rewardPicker) return;
    const { discount, context } = rewardPicker;
    saveRewardSelection(discount.title, { freeCanSelections: selections });
    if (context === 'sub') {
      setSubPromoDiscount({ ...discount, freeCanSelections: selections });
    }
    setRewardSelectionVersion(v => v + 1);
    setRewardPicker(null);
  };

  const handleConfirmRewardChoice = (choiceId: string) => {
    if (!rewardPicker) return;
    const { discount, context } = rewardPicker;
    const updated = applyRewardChoice(discount, choiceId);
    saveRewardSelection(updated.title, { rewardChoiceId: choiceId, freeCanSelections: [] });
    if (context === 'sub') setSubPromoDiscount(updated);
    setRewardSelectionVersion(v => v + 1);
    // Taking the "free cans" option means there is still a can to pick.
    if (updated.rewardKind === 'free-cans') {
      setRewardPicker({ mode: 'cans', context, discount: updated });
    } else {
      setRewardPicker(null);
    }
  };

  const subDeliveryCost = resolveDeliveryCost(subAfterDiscount, subPromoDiscount, STANDARD_DELIVERY_COST);
  const subQualifiesFreeShipping = subDeliveryCost === 0;
  const subFinalTotal = Number((subAfterDiscount + subDeliveryCost).toFixed(2));
  const subRewardNeedsSelection = rewardNeedsSelection(subPromoDiscount);

  const handleApplySubPromo = () => {
    setSubPromoError('');
    setSubPromoSuccess('');

    const res = resolveDiscountCode(
      subPromoInput,
      discounts || [],
      customers || [],
      loggedInCustomer,
      subPseudoCart,
      subPlanPrice
    );

    if (res.success && res.discount) {
      const discount = hydrateRewardSelection(res.discount);
      setSubPromoDiscount(discount);
      setSubPromoSuccess(res.message || `Discount code "${discount.title}" applied!`);
      if (rewardNeedsSelection(discount)) openRewardPickerFor(discount, 'sub');
    } else {
      setSubPromoDiscount(null);
      setSubPromoError(res.error || 'Invalid or expired discount code.');
    }
  };

  const handleRemoveSubPromo = () => {
    setSubPromoDiscount(null);
    setSubPromoInput('');
    setSubPromoError('');
    setSubPromoSuccess('');
  };

  const handleSubscribeAndPay = async () => {
    if (!loggedInCustomer?.email || !custState) return;

    // An unfinished reward pick would be paid for and then lost.
    if (subRewardNeedsSelection && subPromoDiscount) {
      setSubCheckoutError(
        subPromoDiscount.rewardKind === 'choice'
          ? 'Please choose which reward you would like before paying.'
          : 'Please choose your free can before paying.'
      );
      openRewardPickerFor(subPromoDiscount, 'sub');
      return;
    }

    setIsSubscribing(true);
    setSubCheckoutError(null);

    try {
      const generatedOrderId = `PS${Math.floor(Math.random() * 90000 + 10000)}`;
      const planLabel = getAccountPlanLabel(selectedPlanTier.id);
      const frequency = custState.subFrequency || 'Bi-Weekly';

      const destination =
        (Array.isArray(loggedInCustomer.addresses) && loggedInCustomer.addresses[0]) ||
        custState.address ||
        '';

      if (!destination) {
        setSubCheckoutError(
          'Please add a delivery address in the Delivery Addresses tab before subscribing.'
        );
        setIsSubscribing(false);
        return;
      }

      const selectedItems = Array.isArray(custState.subItems) ? custState.subItems : [];

      const lineItem = {
        productId: `sub-pack-${selectedPlanTier.id}`,
        productTitle: `${planLabel} [${frequency} - ${selectedPlanTier.discount}]`,
        price: subPlanPrice,
        quantity: 1,
        image: getPlanImage(selectedPlanTier.name),
        variant: `${selectedPlanTier.cans} Canisters`,
        sku: `SUB-${selectedPlanTier.id.toUpperCase()}`,
        vendor: 'Subscription Pack',
        isSubscription: true,
        subscriptionPlan: `${selectedPlanTier.name} Plan`,
        subscriptionFrequency: frequency,
        // Rhythm discounts are withdrawn; nothing to show against the line.
        frequencyDiscount: undefined,
        subscriptionItems: selectedItems,
        total: subPlanPrice
      };

      const sessionPayload = {
        orderId: generatedOrderId,
        amount: subFinalTotal.toFixed(2),
        total: subFinalTotal,
        subtotal: Number(subAfterDiscount.toFixed(2)),
        shippingCost: Number(subDeliveryCost.toFixed(2)),
        deliveryCost: Number(subDeliveryCost.toFixed(2)),
        deliveryMethod: 'Royal Mail Tracked 24/48',
        customerName: loggedInCustomer.name || 'Valued Customer',
        customerEmail: loggedInCustomer.email,
        destination,
        // The plan line plus any £0 reward lines (chosen free cans, gift box).
        items: buildOrderItems([lineItem as any], subPromoDiscount),
        discountApplied: subPromoDiscount,
        discountAmount: Number(subDiscountValue.toFixed(2)),
        storeCreditApplied: 0
      };

      // Mirrors checkout so the success screen can recover the order details.
      localStorage.setItem(
        `ps_pending_order_${generatedOrderId}`,
        JSON.stringify(sessionPayload)
      );

      const sessionRes = await fetch('/api/worldpay/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionPayload)
      });

      const sessionData = await sessionRes.json().catch(() => ({} as any));

      if (sessionRes.ok && sessionData.redirectUrl) {
        const url = sessionData.redirectUrl as string;
        if (window.self !== window.top) {
          try {
            window.open(url, '_blank', 'noopener,noreferrer');
          } catch (_e) {
            window.location.href = url;
          }
        } else {
          window.location.href = url;
        }
        return;
      }

      throw new Error(
        sessionData.message ||
          sessionData.error ||
          'The payment gateway is currently unavailable. Please try again shortly.'
      );
    } catch (err: any) {
      setSubCheckoutError(err?.message || 'Unable to start the subscription payment.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSaveSubscriptionPlan = async () => {
    if (!loggedInCustomer?.email || !custState || !managedSubscription) return;

    // Only what the customer changed in this console. Every other field — the
    // plan's full name, its box, its status — is left exactly as it is; the box
    // has its own Save, and status changes go through Pause / Cancel.
    const changes: Record<string, any> = {};
    if (custState.subPlan && custState.subPlan !== planDraftSeed?.tier) {
      const tier = ACCOUNT_SUB_PLANS.find(t => t.id === custState.subPlan);
      changes.planName = getAccountPlanLabel(custState.subPlan);
      changes.planId = custState.subPlan;
      changes.amount = tier?.price ?? custState.subPrice;
      changes.cansCount = tier?.cans ?? custState.subCansCount;
    }
    if (custState.subFrequency && custState.subFrequency !== planDraftSeed?.frequency) {
      changes.billingInterval = custState.subFrequency;
    }

    if (Object.keys(changes).length === 0) {
      setSubActionToast({ type: 'info', message: 'Nothing has changed on this plan, so there was nothing to save.' });
      return;
    }

    setIsSavingPlan(true);
    setPlanSaveFeedback(null);
    try {
      const payload = {
        subscriptionId: String(managedSubscription.id),
        customerEmail: loggedInCustomer.email,
        ...changes
      };

      const res = await fetch('/api/subscriptions/update-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({} as any));

      // The response used to be ignored entirely, and the catch block reported
      // success — so a failed save still told the customer it had worked.
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || `Save failed (${res.status})`);
      }

      // Reflect the saved plan straight away, and treat it as the new baseline
      // so a second Save with no further edits sends nothing.
      if (data?.plan) {
        setAccountSubscriptions(previous => previous.map((s: any) =>
          String(s.id) === String(managedSubscription.id) ? { ...s, ...data.plan } : s
        ));
      }
      setPlanDraftSeed(prev => prev ? {
        ...prev,
        tier: custState.subPlan || prev.tier,
        frequency: custState.subFrequency || prev.frequency
      } : prev);

      setPlanSaveFeedback('Subscription plan updated. Your past orders are unchanged.');
      setSubActionToast({
        type: 'success',
        message: 'Plan saved. The change applies from your next delivery — past orders are not affected.'
      });
      setTimeout(() => setPlanSaveFeedback(null), 4000);
    } catch (err: any) {
      console.warn('Save subscription error:', err);
      setSubActionToast({
        type: 'error',
        message: err?.message
          ? `Could not save your subscription plan: ${err.message}`
          : 'Could not save your subscription plan. Please try again.'
      });
    } finally {
      setIsSavingPlan(false);
    }
  };

  /**
   * Pauses or resumes the opened plan. Sends the status and nothing else, to
   * that plan only — the plan's tier, price and box are left untouched.
   */
  const handleTogglePausePlan = async () => {
    if (!loggedInCustomer?.email || !managedSubscription?.id) return;
    const nextStatus = managedPlanStatus === 'Active' ? 'paused' : 'active';
    setIsSavingPlan(true);
    setSubActionToast(null);
    try {
      const res = await fetch('/api/subscriptions/update-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: String(managedSubscription.id),
          customerEmail: loggedInCustomer.email,
          status: nextStatus
        })
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || `Request failed (${res.status})`);
      }
      setAccountSubscriptions(previous => previous.map((s: any) =>
        String(s.id) === String(managedSubscription.id) ? { ...s, status: nextStatus } : s
      ));
      setSubActionToast({
        type: 'success',
        message: nextStatus === 'paused'
          ? 'Deliveries for this plan are paused. You can resume anytime.'
          : 'Deliveries for this plan have resumed.'
      });
    } catch (err: any) {
      setSubActionToast({
        type: 'error',
        message: err?.message ? `Could not update this plan: ${err.message}` : 'Could not update this plan. Please try again.'
      });
    } finally {
      setIsSavingPlan(false);
    }
  };

  /** Opens the cancel dialog for one specific plan. */
  const openCancelSubscriptionModal = (subscriptionId?: string | null) => {
    setCancellingSubscriptionId(subscriptionId ? String(subscriptionId) : null);
    setSubCancelReason('Taking a break');
    setSubCancelOtherNotes('');
    setShowSubCancelModal(true);
  };

  const closeCancelSubscriptionModal = () => {
    setShowSubCancelModal(false);
    setCancellingSubscriptionId(null);
  };

  const handleConfirmCancelSubscription = async () => {
    if (!loggedInCustomer?.email) return;
    setIsCancellingSub(true);
    setSubActionToast(null);

    const finalReason = subCancelReason === 'Other' && subCancelOtherNotes.trim()
      ? `Other: ${subCancelOtherNotes.trim()}`
      : subCancelReason;

    const cancellationTime = new Date().toISOString();
    // Which plan the customer opened the cancel dialog on. Cancelling used to
    // name no plan at all, so the server matched on the email and stopped every
    // plan the customer held — cancelling one of three cancelled all three.
    const targetId = cancellingSubscriptionId ? String(cancellingSubscriptionId) : null;
    const targetPlan = targetId
      ? visibleAccountSubscriptions.find((s: any) => String(s.id) === targetId)
      : null;

    try {
      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(targetId ? { subscriptionId: targetId } : {}),
          customerEmail: loggedInCustomer.email,
          reason: finalReason
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || `Cancellation failed (${res.status})`);
      }

      // Only the cancelled plan changes. Whether the account as a whole counts
      // as cancelled depends on what is left running.
      const nextSubscriptions = accountSubscriptions.map((subscription: any) =>
        !targetId || String(subscription.id) === targetId
          ? { ...subscription, status: 'cancelled', cancelledAt: cancellationTime, cancellationReason: finalReason }
          : subscription
      );
      setAccountSubscriptions(nextSubscriptions);

      const stillLive = nextSubscriptions.some((s: any) =>
        ['active', 'subscribed', 'paused'].includes(String(s.status || '').toLowerCase())
      );

      const updatedState = {
        ...custState,
        ...(stillLive ? {} : {
          subStatus: 'Cancelled',
          isSubscriptionCancelled: true,
          subscriptionCancelledAt: cancellationTime,
          subscriptionCancellationReason: finalReason
        })
      };
      updateCustState(updatedState);

      if (onUpdateProfile && !stillLive) {
        onUpdateProfile({
          ...loggedInCustomer,
          subStatus: 'Cancelled',
          subscriptionStatus: 'Cancelled' as any,
          isSubscriptionCancelled: true,
          subscriptionCancelledAt: cancellationTime,
          subscriptionCancellationReason: finalReason
        } as any);
      }

      // If there are subscription orders, update them in memory
      if (onUpdateOrder && Array.isArray(orders)) {
        const emailLower = loggedInCustomer.email.toLowerCase().trim();
        orders.forEach(o => {
          const isMatch = (o.customerEmail && o.customerEmail.toLowerCase().trim() === emailLower);
          const isSub = isSubscriptionOrder(o);
          // With a plan named, only that plan's own orders are marked
          // cancelled. Orders that name no plan are only in scope when the
          // customer holds a single plan — otherwise there is no telling which
          // plan they belonged to, and guessing would flag the wrong ones.
          const orderPlanId = getOrderSubscriptionId(o);
          const inScope = !targetId
            ? true
            : orderPlanId
              ? orderPlanId === targetId
              : visibleAccountSubscriptions.length <= 1;
          if (isMatch && isSub && inScope) {
            const tags = Array.isArray(o.tags) ? [...o.tags] : [];
            if (!tags.includes('Subscription Cancelled')) tags.push('Subscription Cancelled');
            const currentDetails = o.subscriptionDetails || {
              planName: custState.subPlan?.toUpperCase() || 'Subscription Box',
              frequency: custState.subFrequency || 'Bi-Weekly',
              paymentStatus: 'Cancelled'
            };
            const subDetails: any = {
              ...currentDetails,
              status: 'Cancelled',
              isCancelled: true,
              cancelledAt: cancellationTime,
              cancellationReason: finalReason
            };
            onUpdateOrder({
              ...o,
              tags,
              subscriptionCancelled: true,
              subscriptionCancelledAt: cancellationTime,
              subscriptionCancellationReason: finalReason,
              subscriptionDetails: subDetails
            });
          }
        });
      }

      closeCancelSubscriptionModal();
      setSubActionToast({
        type: 'success',
        message: targetPlan?.planName
          ? `${targetPlan.planName} cancelled. Its recurring renewals have been halted.`
          : 'Subscription plan successfully cancelled. Recurring renewals have been halted.'
      });
    } catch (err: any) {
      // Previously this reported success and marked the plan cancelled on
      // screen even though the request had failed, so a customer could believe
      // billing had stopped while the plan carried on charging them.
      console.warn('[Cancel Subscription Error]', err);
      setSubActionToast({
        type: 'error',
        message: err?.message
          ? `Could not cancel this plan: ${err.message}`
          : 'Could not cancel this plan. Please try again, or contact support.'
      });
    } finally {
      setIsCancellingSub(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!loggedInCustomer?.email) return;
    setIsReactivatingSub(true);
    setSubActionToast(null);

    try {
      const res = await fetch('/api/subscriptions/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: loggedInCustomer.email
        })
      });

      const data = await res.json().catch(() => ({}));
      const updatedState = {
        ...custState,
        subStatus: 'Active',
        isSubscriptionCancelled: false
      };
      setAccountSubscriptions(previous => previous.map(subscription => ({
        ...subscription,
        status: 'active'
      })));
      updateCustState(updatedState);

      if (onUpdateProfile) {
        onUpdateProfile({
          ...loggedInCustomer,
          subStatus: 'Active',
          subscriptionStatus: 'Subscribed' as any,
          isSubscriptionCancelled: false
        } as any);
      }

      if (onUpdateOrder) {
        const emailLower = loggedInCustomer.email.toLowerCase().trim();
        orders.forEach(order => {
          const isCustomerOrder = order.customerEmail?.toLowerCase().trim() === emailLower;
          const isSubscriptionOrder = Boolean(
            order.isSubscription ||
            order.tags?.some(tag => tag.toLowerCase().includes('subscription')) ||
            order.items?.some((item: any) => item.isSubscription || item.productTitle?.toLowerCase().includes('subscription'))
          );
          if (!isCustomerOrder || !isSubscriptionOrder) return;

          const resumedAt = new Date().toISOString();
          const tags = (order.tags || []).filter(tag => tag.toLowerCase() !== 'subscription cancelled');
          const subscriptionDetails: any = order.subscriptionDetails
            ? { ...order.subscriptionDetails, status: 'Active', isCancelled: false, resumedAt }
            : undefined;
          if (subscriptionDetails) {
            delete subscriptionDetails.cancelledAt;
            delete subscriptionDetails.cancellationReason;
          }
          onUpdateOrder({
            ...order,
            tags,
            subscriptionCancelled: false,
            subscriptionCancelledAt: undefined,
            subscriptionCancellationReason: undefined,
            subscriptionResumedAt: resumedAt,
            subscriptionDetails
          });
        });
      }

      // The optimistic update above marks everything active; re-reading gives
      // the real schedule the server just re-anchored, so the cards show the
      // actual next delivery date rather than the stale cancelled one.
      loadAccountSubscriptions();

      const resumedDate = data?.nextBillingDate ? new Date(data.nextBillingDate) : null;
      setSubActionToast({
        type: 'success',
        message: resumedDate && !isNaN(resumedDate.getTime())
          ? `Subscription reactivated! Your next delivery is scheduled for ${resumedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} — you have not been charged today.`
          : 'Subscription plan reactivated! Your automatic deliveries and benefits are resumed.'
      });
    } catch (err: any) {
      updateCustState({
        ...custState,
        subStatus: 'Active',
        isSubscriptionCancelled: false
      });
      setSubActionToast({
        type: 'success',
        message: 'Subscription plan reactivated.'
      });
    } finally {
      setIsReactivatingSub(false);
    }
  };

  /**
   * Marks this customer's orders for one subscription as running again, so the
   * admin dashboard stops showing "Subscription Cancelled" the moment the
   * customer resumes. The server does the same to the stored orders; this keeps
   * the copy already in memory in step.
   */
  const clearCancellationOnOrders = (subscriptionId: string) => {
    if (!onUpdateOrder || !Array.isArray(orders) || !loggedInCustomer?.email) return;
    const emailLower = loggedInCustomer.email.toLowerCase().trim();

    orders.forEach(order => {
      const isCustomerOrder = order.customerEmail?.toLowerCase().trim() === emailLower;
      const belongsToPlan =
        String((order as any).subscriptionId || '') === String(subscriptionId) ||
        String((order as any).subscriptionDetails?.subscriptionId || '') === String(subscriptionId);
      if (!isCustomerOrder || !belongsToPlan) return;

      const resumedAt = new Date().toISOString();
      const tags = (order.tags || []).filter(tag => tag.toLowerCase() !== 'subscription cancelled');
      const subscriptionDetails: any = order.subscriptionDetails
        ? { ...order.subscriptionDetails, status: 'Active', isCancelled: false, resumedAt }
        : undefined;
      if (subscriptionDetails) {
        delete subscriptionDetails.cancelledAt;
        delete subscriptionDetails.cancellationReason;
      }
      onUpdateOrder({
        ...order,
        tags,
        subscriptionCancelled: false,
        subscriptionCancelledAt: undefined,
        subscriptionCancellationReason: undefined,
        subscriptionResumedAt: resumedAt,
        subscriptionDetails
      });
    });
  };

  /**
   * Resumes one cancelled plan by id.
   *
   * The banner button above resumes everything at once, which is wrong as soon
   * as a customer holds more than one plan — resuming last year's Core box
   * should not restart a Pro box they cancelled yesterday.
   */
  const handleResumeSubscription = async (subscriptionId: string) => {
    if (!subscriptionId || !loggedInCustomer?.email) return;
    setSubActionBusyId(subscriptionId);
    setSubActionToast(null);

    try {
      const res = await fetch('/api/subscriptions/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, customerEmail: loggedInCustomer.email })
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || 'Could not resume this subscription.');
      }

      const refreshed = await loadAccountSubscriptions();
      const stillCancelled = refreshed.some((s: any) =>
        ['cancelled', 'canceled', 'inactive'].includes(String(s.status || '').toLowerCase())
      );
      const hasLive = refreshed.some((s: any) =>
        ['active', 'subscribed', 'paused'].includes(String(s.status || '').toLowerCase())
      );

      if (hasLive) {
        updateCustState({ ...custState, subStatus: 'Active', isSubscriptionCancelled: false });
        if (onUpdateProfile) {
          onUpdateProfile({
            ...loggedInCustomer,
            subStatus: 'Active',
            subscriptionStatus: 'Subscribed' as any,
            isSubscriptionCancelled: false
          } as any);
        }
      }

      clearCancellationOnOrders(subscriptionId);

      const nextDate = data?.nextBillingDate ? new Date(data.nextBillingDate) : null;
      setSubActionToast({
        type: 'success',
        message: nextDate && !isNaN(nextDate.getTime())
          ? `Subscription resumed. Your next delivery is scheduled for ${nextDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} — you have not been charged today.`
          : 'Subscription resumed. Your automatic deliveries are running again.'
      });

      if (stillCancelled && !hasLive) {
        setSubActionToast({
          type: 'info',
          message: 'Subscription resumed, but the plan could not be confirmed as active. Please refresh the page.'
        });
      }
    } catch (err: any) {
      setSubActionToast({
        type: 'error',
        message: err?.message || 'Could not resume this subscription. Please try again.'
      });
    } finally {
      setSubActionBusyId(null);
    }
  };

  /**
   * Removes a finished plan from the account list.
   *
   * The server keeps the record for order history and refunds — this only takes
   * it off the customer's list — and refuses outright if the plan is still
   * live, so a customer cannot sidestep cancellation and leave a card mandate
   * running.
   */
  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (!subscriptionId || !loggedInCustomer?.email) return;
    setSubActionBusyId(subscriptionId);
    setSubActionToast(null);

    try {
      const res = await fetch('/api/subscriptions/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, customerEmail: loggedInCustomer.email })
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || 'Could not remove this subscription.');
      }

      setPendingDeleteSubId(null);
      await loadAccountSubscriptions();
      setSubActionToast({
        type: 'success',
        message: 'Subscription removed from your account. Your past orders and invoices are unaffected.'
      });
    } catch (err: any) {
      setSubActionToast({
        type: 'error',
        message: err?.message || 'Could not remove this subscription. Please try again.'
      });
    } finally {
      setSubActionBusyId(null);
    }
  };

  /**
   * Saves the box for ONE subscription.
   *
   * The subscription id is always sent, so editing one plan cannot rewrite
   * another. Items are written in the shape the rest of the system reads
   * (subscriptionParser, the renewal worker and the admin order view all expect
   * productId / variantId / variant / quantity), rather than a shape local to
   * this screen.
   */
  const handleSaveSubscriptionBox = async (lines: BoxLine[]) => {
    // Scoped to the plan the editor was opened for, which is the same plan the
    // editor below is mounted with — never activeSubscription's first-plan
    // fallback, or saving would write the box onto a plan nobody opened.
    if (!managedSubscription || !loggedInCustomer?.email) return;
    setIsSavingBox(true);
    setSubActionToast(null);

    const items = lines.map(line => ({
      productId: line.productId,
      variantId: line.variantId || undefined,
      name: line.title,
      productTitle: line.title,
      title: line.title,
      brand: line.brand,
      vendor: line.brand,
      variant: line.variantName,
      variantName: line.variantName,
      quantity: line.quantity,
      price: line.price,
      image: line.image,
      formattedLabel: formatSubscriptionItemDisplay({
        brand: line.brand,
        name: line.title,
        variant: line.variantName,
        quantity: line.quantity
      })
    }));
    const totalCans = lines.reduce((sum, line) => sum + line.quantity, 0);

    try {
      const res = await fetch('/api/subscriptions/update-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // The box and its can count only. The plan's name, price, schedule
          // and status are not this editor's to change, so they are not sent.
          subscriptionId: managedSubscription.id,
          customerEmail: loggedInCustomer.email,
          items,
          cansCount: totalCans
        })
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || `Save failed (${res.status})`);
      }

      // Reflect the saved box immediately; the list is the source the manager
      // reloads from when the customer switches between plans.
      setAccountSubscriptions(previous =>
        previous.map((s: any) =>
          String(s.id) === String(managedSubscription.id) ? { ...s, items, cansCount: totalCans } : s
        )
      );

      setSubActionToast({
        type: 'success',
        message: `Box updated for ${managedSubscription.planName || 'your plan'}: ${totalCans} can${totalCans === 1 ? '' : 's'} saved.`
      });
    } catch (err: any) {
      setSubActionToast({
        type: 'error',
        message: err?.message ? `Could not save your box: ${err.message}` : 'Could not save your box. Please try again.'
      });
    } finally {
      setIsSavingBox(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (authMode === 'forgot') {
      if (!emailInput.trim()) {
        setErrorMsg('Please enter your email address.');
        return;
      }
      setIsSubmitting(true);
      try {
        const response = await fetch('/api/customers/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailInput.toLowerCase().trim() })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Failed to send password reset request.');
        setSuccessMsg('Password reset link and code dispatched to your email address via Resend!');
        setAuthMode('reset');
      } catch (err: any) {
        setErrorMsg(err.message || 'Server connection error.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (authMode === 'reset') {
      if (!emailInput.trim() || !resetTokenInput.trim() || !passwordInput) {
        setErrorMsg('Please fill in your email, reset code, and new password.');
        return;
      }
      if (passwordInput !== confirmPasswordInput) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      setIsSubmitting(true);
      try {
        const response = await fetch('/api/customers/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: resetTokenInput.trim(),
            email: emailInput.toLowerCase().trim(),
            newPassword: passwordInput
          })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Password reset failed.');
        setSuccessMsg('Password successfully updated! You can now log in.');
        setAuthMode('login');
        setPasswordInput('');
        setConfirmPasswordInput('');
        setResetTokenInput('');
      } catch (err: any) {
        setErrorMsg(err.message || 'Server connection error.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (authMode === 'verify') {
      if (!emailInput.trim() || !verificationCodeInput.trim()) {
        setErrorMsg('Please enter your email and 6-digit code.');
        return;
      }
      setIsSubmitting(true);
      try {
        const response = await fetch('/api/customers/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailInput.toLowerCase().trim(),
            code: verificationCodeInput.trim()
          })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Verification failed.');

        if (data.customer) {
          onLogin(data.customer);
          setSuccessMsg('Email verified successfully!');
        } else {
          setSuccessMsg('Email verified successfully! Please log in.');
          setAuthMode('login');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Server connection error.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (authMode === 'signup') {
      if (!nameInput.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (!phoneInput.trim()) {
        setErrorMsg('Mobile phone number is required.');
        return;
      }
    }
    if (!emailInput.trim() || !passwordInput) {
      setErrorMsg('Please fill in all credentials.');
      return;
    }
    if (authMode === 'signup' && passwordInput !== confirmPasswordInput) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const email = emailInput.toLowerCase().trim();
      if (authMode === 'signup') {
        const response = await fetch('/api/customers/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: nameInput.trim(), email, phone: phoneInput.trim(), password: passwordInput, referredByCode: referredByCodeInput.trim() })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Registration failed.');

        // Request 6-digit email verification code via Resend
        await fetch('/api/customers/request-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name: nameInput.trim() })
        }).catch(e => console.warn('Verification send error:', e));

        setSuccessMsg(`Account created! A 6-digit verification code was sent to ${email}.`);
        setAuthMode('verify');
      } else {
        const response = await fetch('/api/customers/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: passwordInput })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Authentication failed.');

        onLogin(data.customer);
        setNameInput('');
        setPasswordInput('');
        setConfirmPasswordInput('');
        setReferredByCodeInput('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleTrackOrder = async (e?: React.FormEvent, customTargetId?: string) => {
    if (e) e.preventDefault();
    setTrackerError('');
    setTrackedOrder(null);
    setLiveTrackingInfo(null);
    const checkId = (customTargetId || trackerInput).trim().toUpperCase();
    if (!checkId) {
      setTrackerError('Please enter an Order ID or Tracking reference.');
      return;
    }
    const found = orders.find(o => 
      o.id.toUpperCase() === checkId || 
      (o.trackingId && o.trackingId.toUpperCase() === checkId) ||
      (o.trackingNumber && o.trackingNumber.toUpperCase() === checkId) ||
      (o.data?.royalMail?.trackingNumber && o.data.royalMail.trackingNumber.toUpperCase() === checkId)
    );
    if (found) {
      setTrackedOrder(found);
      const trackingNo = found.trackingNumber || found.trackingId || found.data?.royalMail?.trackingNumber;
      if (trackingNo) {
        setLiveTrackingLoading(true);
        try {
          // Sync with Royal Mail Click & Drop backend to get latest status
          fetch(`/api/royalmail/sync-status/${found.id}`, { method: 'POST' }).catch(() => {});
          const res = await fetch(`/api/royalmail/track/${encodeURIComponent(trackingNo)}`);
          if (res.ok) {
            const data = await res.json();
            setLiveTrackingInfo(data);
          }
        } catch (err) {
          console.warn('Live tracking fetch error:', err);
        } finally {
          setLiveTrackingLoading(false);
        }
      }
    } else {
      setTrackerError(`No order found matching "${checkId}".`);
    }
  };

  const getTimelineSteps = (order: Order) => {
    const stage = dispatchStage(order.fulfillmentStatus);
    const isProcessingStage = stage === 'processing';
    const isDispatchedStage = stage === 'dispatched';
    const isDeliveredStage = stage === 'delivered';
    return [
      { key: 'placed', label: 'Placed', description: 'Order received and payment confirmed.', status: 'completed', date: order.date },
      { key: 'processing', label: 'Processing', description: 'Active assembly & quality inspection.', status: isProcessingStage ? 'current' : 'completed', date: isProcessingStage ? 'Current step' : `${order.date} (Success)` },
      { key: 'dispatched', label: 'Dispatched', description: 'Departed sorting facility.', status: isProcessingStage ? 'pending' : (isDispatchedStage ? 'current' : 'completed'), date: isProcessingStage ? 'Pending shipment' : (isDispatchedStage ? 'Dispatched' : 'Departed hub') },
      { key: 'delivered', label: 'Delivered', description: 'Arrived at your doorstep successfully.', status: isDeliveredStage ? 'completed' : 'pending', date: isDeliveredStage ? 'Handed to customer' : 'Awaiting delivery estimates' }
    ];
  };

  // Logged Out Screen
  if (!loggedInCustomer) {
    return (
      <div className="max-w-5xl mx-auto my-12 bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden font-sans">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Sign In / Sign Up form */}
          <div className="p-8 lg:p-12 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-[#071d37] tracking-wider uppercase">Pouch Supply</span>
                <span className="w-1.5 h-1.5 bg-[#dfa047] rounded-full self-end mb-1"></span>
              </div>
              {(authMode === 'login' || authMode === 'signup') ? (
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${authMode === 'login' ? 'bg-white text-[#071d37] shadow-sm' : 'text-slate-500'}`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setAuthMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${authMode === 'signup' ? 'bg-white text-[#071d37] shadow-sm' : 'text-slate-500'}`}
                  >
                    Sign Up
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-xs font-bold uppercase text-indigo-600 hover:text-indigo-800"
                >
                  ← Back to Sign In
                </button>
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-[#071d37]">
                {authMode === 'login' ? 'Welcome Back' : authMode === 'signup' ? 'Create an Account' : authMode === 'forgot' ? 'Forgot Password' : authMode === 'reset' ? 'Reset Password' : 'Verify Email Address'}
              </h2>
              <p className="text-slate-500 text-xs">
                {authMode === 'login' 
                  ? 'Access your personalized subscription portal, track order progress, and unlock free premium rewards.'
                  : authMode === 'signup'
                  ? 'Join Pouch Supply today to get 15% off subscription boxes and start unlocking direct premium gifts.'
                  : authMode === 'forgot'
                  ? 'Enter your registered email address and we will send a password reset code & link directly to your inbox via Resend.'
                  : authMode === 'reset'
                  ? 'Enter the reset code/token sent to your email along with your new password.'
                  : 'Enter the 6-digit confirmation code sent to your email address.'}
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {(authMode === 'login' || authMode === 'signup') && (
                <div className="space-y-3 pb-2">
                  <button
                    type="button"
                    onClick={handleDirectGoogleSignIn}
                    disabled={isGoogleLoading || isSubmitting}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-slate-250 text-slate-800 font-bold text-xs py-3 px-4 rounded-xl shadow-2xs transition-all cursor-pointer hover:border-slate-350 disabled:opacity-50"
                  >
                    {isGoogleLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-slate-600" />
                    ) : (
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    )}
                    <span>{isGoogleLoading ? 'Connecting to Google...' : 'Sign in with Google'}</span>
                  </button>

                  <div className="relative flex items-center justify-center my-2">
                    <div className="border-t border-slate-200 w-full"></div>
                    <span className="bg-white px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 shrink-0">OR EMAIL</span>
                    <div className="border-t border-slate-200 w-full"></div>
                  </div>
                </div>
              )}

              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Valentina Gomez"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-[#071d37] focus:outline-none bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mobile / Phone Number <span className="text-rose-500">*</span></label>
                    <input
                      type="tel"
                      required
                      placeholder="+44 7700 900077"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-[#071d37] focus:outline-none bg-slate-50/50"
                    />
                  </div>
                </>
              )}

              {(authMode === 'login' || authMode === 'signup' || authMode === 'forgot' || authMode === 'reset' || authMode === 'verify') && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="valentina@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-[#071d37] focus:outline-none bg-slate-50/50"
                  />
                </div>
              )}

              {authMode === 'verify' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">6-Digit Verification Code</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter 6-digit code"
                    value={verificationCodeInput}
                    onChange={(e) => setVerificationCodeInput(e.target.value)}
                    className="w-full text-sm font-mono font-bold tracking-widest border border-indigo-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-indigo-50/50 text-center text-slate-900"
                  />
                </div>
              )}

              {authMode === 'reset' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reset Code / Token</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A3F8B2C1"
                    value={resetTokenInput}
                    onChange={(e) => setResetTokenInput(e.target.value)}
                    className="w-full text-xs font-mono font-bold border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-[#071d37] focus:outline-none bg-slate-50/50"
                  />
                </div>
              )}

              {(authMode === 'login' || authMode === 'signup' || authMode === 'reset') && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {authMode === 'reset' ? 'New Password' : 'Password'}
                    </label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => { setAuthMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-[#071d37] focus:outline-none bg-slate-50/50"
                  />
                </div>
              )}

              {(authMode === 'signup' || authMode === 'reset') && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Confirm {authMode === 'reset' ? 'New Password' : 'Password'}
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-[#071d37] focus:outline-none bg-slate-50/50"
                  />
                </div>
              )}

              {authMode === 'signup' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Referral Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. REF-SCOTT-F4X8"
                    value={referredByCodeInput}
                    onChange={(e) => setReferredByCodeInput(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-[#071d37] focus:outline-none bg-slate-50/50"
                  />
                </div>
              )}

              {successMsg && (
                <p className="text-xs text-emerald-600 font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-200">{successMsg}</p>
              )}

              {errorMsg && <p className="text-xs text-rose-500 font-bold">{errorMsg}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#071d37] hover:bg-[#0c2e56] disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-widest py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                {authMode === 'login' 
                  ? 'Sign In To Account' 
                  : authMode === 'signup' 
                  ? 'Register Now' 
                  : authMode === 'forgot' 
                  ? 'Send Password Reset Email' 
                  : authMode === 'reset' 
                  ? 'Update Password' 
                  : 'Verify Email Address'}
              </button>

              {authMode === 'forgot' && (
                <p className="text-center text-xs text-slate-400">
                  Already have a reset code?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('reset'); setErrorMsg(''); }}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Enter reset code
                  </button>
                </p>
              )}
            </form>
          </div>

          {/* Quick Tracking Panel */}
          <div className="p-8 lg:p-12 bg-slate-50/80 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100">
            <div className="space-y-6">
              <div className="p-3 bg-blue-50 text-[#071d37] rounded-full w-12 h-12 flex items-center justify-center shadow-xs">
                <Truck className="h-6 w-6 animate-pulse" />
              </div>
              <h2 className="text-xl font-extrabold text-[#071d37]">Guest Order Tracking</h2>
              <p className="text-slate-500 text-xs">
                You do not need to sign in to check your order shipment status. Enter your Order ID reference below to visualize real-time progress.
              </p>
              <form onSubmit={handleTrackOrder} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. PS48884"
                    value={trackerInput}
                    onChange={(e) => setTrackerInput(e.target.value)}
                    className="w-full text-xs font-mono font-bold border border-slate-200 p-3 pr-10 rounded-xl focus:ring-2 focus:ring-[#071d37] focus:outline-none uppercase bg-white"
                  />
                  <Search className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                </div>
                {trackerError && <p className="text-xs text-rose-500 font-bold">{trackerError}</p>}
                <button
                  type="submit"
                  className="w-full bg-[#dfa047] hover:bg-[#c98e3b] text-white font-bold text-xs uppercase tracking-widest py-3 px-4 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Track Shipment Status
                </button>
              </form>

              {trackedOrder && (
                trackedOrder.carrier === 'Royal Mail' || trackedOrder.carrier === 'Express Courier' || trackedOrder.trackingId ? (
                  <div className="bg-[#f8fafc] border border-slate-200 p-4 rounded-2xl shadow-xs space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-serif font-black text-xs text-slate-800">Royal Mail</span>
                        <span className="text-[8px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold uppercase">Tracked</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-slate-500">{trackedOrder.trackingId}</span>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-[8.5px] text-slate-400 uppercase font-extrabold block">Current Location / Status</span>
                      <strong className="text-slate-800 font-black uppercase text-[11px] block">
                        {isDelivered(trackedOrder.fulfillmentStatus) ? 'DELIVERED & SIGNED' :
                         isDispatched(trackedOrder.fulfillmentStatus) ? 'DISPATCHED' : 'AWAITING COLLECTION'}
                      </strong>
                    </div>

                    <div className="space-y-4 pl-4 border-l border-red-200 relative">
                      {trackedOrder.trackingHistory && trackedOrder.trackingHistory.map((hist, idx) => (
                        <div key={idx} className="text-xs relative">
                          <p className="font-bold text-slate-800">{hist.status}</p>
                          <p className="text-[9px] text-slate-400 font-mono font-bold">{hist.date} • {hist.location}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{hist.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="font-mono text-xs font-bold text-[#071d37]">{trackedOrder.id}</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{trackedOrder.fulfillmentStatus}</span>
                    </div>
                    <div className="space-y-3 pl-4 border-l border-slate-200 relative">
                      {getTimelineSteps(trackedOrder).map((step) => (
                        <div key={step.key} className="text-xs">
                          <p className={`font-bold ${step.status === 'completed' ? 'text-[#071d37]' : step.status === 'current' ? 'text-[#dfa047]' : 'text-slate-400'}`}>{step.label}</p>
                          <p className="text-[10px] text-slate-500">{step.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loaded state helper to verify layout safety
  if (!custState) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-[#071d37] animate-spin" />
      </div>
    );
  }

  // Sidebar items configuration
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layout },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'subscriptions', label: 'Subscriptions', icon: RefreshCw },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'loyalty', label: 'Loyalty Rewards', icon: Award },
    { id: 'referrals', label: 'Referrals', icon: Share2 },
    { id: 'details', label: 'Account Details', icon: User },
    { id: 'addresses', label: 'Delivery Addresses', icon: MapPin },
    { id: 'support', label: 'Help & Support', icon: LifeBuoy }
  ];


  return (
    <div className="min-h-screen bg-[#f4f6f9] py-4 sm:py-6 px-3 sm:px-6 md:px-8 font-sans">
      {/* Mobile Top Navigation Pills Header */}
      <div className="lg:hidden w-full bg-[#071d37] text-white p-3.5 rounded-2xl shadow-md mb-4">
        <div className="flex items-center justify-between px-1 pb-2.5 mb-2.5 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black uppercase tracking-wider text-white">Customer Portal</span>
            <span className="w-1.5 h-1.5 bg-[#dfa047] rounded-full"></span>
          </div>
          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#dfa047] bg-white/10 px-2.5 py-0.5 rounded-full">
            {sidebarItems.find(i => i.id === activeTab)?.label || 'Overview'}
          </span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={`mob-nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-[10.5px] font-bold uppercase tracking-wider whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  isActive 
                    ? 'bg-[#dfa047] text-white shadow-xs font-black' 
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 md:gap-8">
        
        {/* Left Side Navigation Sidebar - Desktop Only */}
        <aside className="hidden lg:flex w-64 bg-[#071d37] text-white rounded-3xl p-6 flex-col justify-between shrink-0 shadow-lg">
          <div className="space-y-8">
            {/* Store Brand / Logo */}
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-black text-white tracking-widest uppercase">Pouch Supply</span>
                <span className="w-2 h-2 bg-[#dfa047] rounded-full self-end mb-1"></span>
              </div>
              {/* Golden dots under name matching the mockup */}
              <div className="flex gap-1.5 pl-1.5">
                {[1, 2, 3, 4, 5].map(d => (
                  <span key={d} className="w-1.5 h-1.5 bg-[#dfa047] rounded-full opacity-80"></span>
                ))}
              </div>
            </div>

            {/* Sidebar Navigation Items */}
            <nav className="space-y-1">
              {sidebarItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-[11px] font-bold uppercase tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-[#dfa047] text-white shadow-md' 
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Need Help Box & Footer */}
          <div className="mt-12 space-y-6">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3">
              <h4 className="text-xs font-black uppercase text-[#dfa047] tracking-wider">Need help?</h4>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                We're here for you. Get in touch with our specialist support team.
              </p>
              <button 
                type="button"
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('pages/contact');
                  } else {
                    window.history.pushState({}, '', '/pages/contact');
                    window.dispatchEvent(new Event('popstate'));
                  }
                }}
                className="w-full bg-white hover:bg-slate-100 text-[#071d37] font-bold text-[10px] uppercase tracking-wider py-2 rounded-xl transition-colors cursor-pointer"
              >
                Contact Support
              </button>
            </div>

            <div className="text-center pt-2 border-t border-white/10">
              <span className="inline-block bg-white/10 text-[9px] border border-white/20 py-0.5 px-2 rounded-full text-slate-200 font-bold mb-1.5">18+ Only</span>
              <p className="text-[9px] text-slate-400 leading-snug">
                Nicotine pouches are for adult consumers only. Please consume responsibly.
              </p>
            </div>
          </div>
        </aside>

        {/* Right Side Main Content Panel */}
        <main className="flex-1 space-y-6">
          
          {/* Top Welcome Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-[#071d37]">Welcome back, {loggedInCustomer.name} 👋</h1>
                {ordersCount >= 50 && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-[#dfa047] text-[#071d37] px-2.5 py-0.5 rounded-full shadow-sm animate-pulse shrink-0">
                    <Award className="h-3 w-3 fill-current" /> VIP Customer
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-xs mt-0.5">Here's what's happening with your Pouch Supply account today.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                onClick={() => { setActiveTab('orders'); setTrackerInput(myOrders[0]?.id || ''); setTrackedOrder(myOrders[0] || null); }}
                className="flex items-center gap-1.5 text-xs font-bold text-[#071d37] bg-slate-100 hover:bg-slate-200 py-2 px-3.5 rounded-xl transition-all cursor-pointer"
              >
                <Truck className="h-4 w-4" /> Track order
              </button>
              <button 
                onClick={() => setActiveTab('details')}
                className="flex items-center gap-1.5 text-xs font-bold text-[#071d37] bg-slate-100 hover:bg-slate-200 py-2 px-3.5 rounded-xl transition-all cursor-pointer"
              >
                <User className="h-4 w-4" /> Account
              </button>
              <button 
                onClick={onLogout}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 py-2 px-3.5 rounded-xl transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              
              {/* TAB 1: DASHBOARD (Rich Bento Grid Layout similar to the mockup) */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  
                  {/* Referral Welcome Coupon Banner */}
                  {(() => {
                    const myWelcomeCoupon = discounts.find(d => d.id === `disc-ref-${loggedInCustomer?.id}` && d.status === 'Active');
                    if (myWelcomeCoupon) {
                      return (
                        <div className="bg-amber-50 border border-amber-200 text-amber-950 p-4 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl">
                              <Tag className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-black uppercase tracking-wider">Welcome Referral Reward Active</p>
                              <p className="text-[10.5px] text-amber-800 font-medium leading-relaxed">
                                You received a <strong>10% discount coupon</strong> for your first purchase. Copy and enter the code at checkout!
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-white px-4 py-2 border border-amber-100 rounded-2xl shrink-0">
                            <span className="font-mono font-black text-xs text-[#071d37] select-all tracking-wider">{myWelcomeCoupon.title}</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(myWelcomeCoupon.title);
                                alert('Welcome coupon code copied! Apply it in your cart/checkout.');
                              }}
                              className="p-1 hover:bg-slate-100 text-[#071d37] rounded-lg transition-colors cursor-pointer"
                              title="Copy Coupon Code"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Top Row: Loyalty Scheme Header & Rewards Quick Look */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* VIP Progress Tracker (2/3 width) */}
                    <div className="lg:col-span-2 bg-[#071d37] text-white rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-md">
                      {/* Ambient circle background overlay */}
                      <div className="absolute right-[-40px] top-[-40px] w-48 h-48 rounded-full bg-white/5 border border-white/5" />
                      
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1.5">
                          <h2 className="text-xl font-black uppercase tracking-wider text-white">
                            {ordersCount >= 31 ? "★ PLATINUM MEMBER STATUS" : "STAR PROGRESS SYSTEM"}
                          </h2>
                          <p className="text-slate-300 text-xs leading-relaxed max-w-md">
                            {tierInfo.description}
                          </p>
                        </div>
                        {/* Interactive circle dial */}
                        <div className="relative shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 border-[#dfa047] bg-black/20 text-center shadow-lg transition-all duration-300 hover:scale-105">
                          <Star className="h-4 w-4 text-[#dfa047] fill-[#dfa047]" />
                          <span className="text-lg font-black text-white mt-0.5">
                            {tierInfo.progressPercentage}%
                          </span>
                          <span className="text-[7px] text-slate-300 uppercase tracking-widest font-extrabold max-w-[80px] truncate">
                            {ordersCount >= 31 ? "Platinum Member" : tierInfo.currentTierName}
                          </span>
                        </div>
                      </div>

                      {/* Stars Milestone Timeline */}
                      <div className="mt-10 mb-8 relative px-6">
                        {/* Overall progress background track */}
                        <div className="relative h-1 bg-white/20 rounded-full">
                          <div 
                            className="absolute left-0 top-0 h-full bg-[#dfa047] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(223,160,71,0.5)]" 
                            style={{ width: `${Math.min(100, (ordersCount / 31) * 100)}%` }} 
                          />
                          
                          {/* Milestone Nodes */}
                          {TIERS.map((t) => {
                            const isUnlocked = ordersCount >= t.required;
                            const pct = (t.required / 31) * 100;
                            return (
                              <div 
                                key={t.level}
                                style={{ left: `${pct}%` }}
                                className="absolute -translate-x-1/2 -translate-y-1/2 top-1/2 z-10 flex flex-col items-center"
                              >
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                  isUnlocked 
                                    ? 'bg-[#dfa047] border-[#dfa047] text-[#071d37] scale-110 shadow-lg' 
                                    : 'bg-[#071d37] border-slate-500 text-slate-400 hover:border-slate-300'
                                }`}>
                                  {t.level === 4 ? (
                                    <Award className={`h-4 w-4 ${isUnlocked ? 'fill-current text-[#071d37]' : 'text-slate-400'}`} />
                                  ) : (
                                    <Star className={`h-3.5 w-3.5 ${isUnlocked ? 'fill-current text-[#071d37]' : 'text-slate-400'}`} />
                                  )}
                                </div>
                                <span className={`text-[8px] font-extrabold mt-1.5 uppercase tracking-wider whitespace-nowrap ${isUnlocked ? 'text-[#dfa047]' : 'text-slate-400'}`}>
                                  {t.name}
                                </span>
                                <span className="text-[7px] text-slate-400 font-bold tracking-tighter">
                                  {t.required} order{t.required > 1 ? 's' : ''}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-300 font-bold uppercase tracking-wider mt-4 px-1">
                        <span>{ordersCount} Completed Order{ordersCount !== 1 ? 's' : ''}</span>
                        <span className="text-[#dfa047] font-black">
                          {ordersCount >= 31 
                            ? "★ PLATINUM MEMBER LEVEL UNLOCKED" 
                            : `${tierInfo.ordersNeededForNext} order${tierInfo.ordersNeededForNext > 1 ? 's' : ''} to reach ${tierInfo.nextTierName}`}
                        </span>
                      </div>

                      <div className="mt-6 flex justify-start">
                        <button 
                          onClick={() => setActiveTab('loyalty')}
                          className="bg-[#dfa047] hover:bg-[#c98e3b] text-[#071d37] font-black text-[10px] uppercase tracking-widest py-2 px-5 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
                        >
                          Ways to earn rewards
                        </button>
                      </div>
                    </div>

                    {/* VIP Loyalty Card Stats Panel (1/3 width) */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                          <h3 className="font-extrabold text-sm text-[#071d37] uppercase tracking-wider">Loyalty Rewards</h3>
                          <button onClick={() => setActiveTab('loyalty')} className="text-[10px] font-bold text-[#dfa047] uppercase hover:underline">View all rewards</button>
                        </div>
                        
                        <div className="flex gap-3 items-center bg-[#f4f6f9] p-3 rounded-2xl border border-slate-100">
                          <div className="p-2 bg-[#071d37]/5 text-[#071d37] rounded-xl">
                            <Award className="h-6 w-6 text-[#dfa047]" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-[#071d37] uppercase">{tierInfo.badgeName}</p>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              {ordersCount >= 31 
                                ? "Platinum status active! Highest loyalty multiplier and priority support." 
                                : "Complete purchases to unlock tiers and trigger premium coupons."}
                            </p>
                          </div>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-4 gap-2 text-center pt-2">
                          <div className="bg-slate-50 border border-slate-100 p-2 rounded-2xl flex flex-col justify-center min-w-0">
                            <p className="text-xs font-black text-[#071d37] truncate">{tierInfo.currentTierName}</p>
                            <p className="text-[8px] text-slate-400 uppercase font-bold tracking-tight mt-0.5">Status Level</p>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 p-2 rounded-2xl flex flex-col justify-center min-w-0">
                            <p className="text-base font-black text-[#071d37]">{tierInfo.unlockedCount}</p>
                            <p className="text-[8px] text-slate-400 uppercase font-bold tracking-tight mt-0.5">Unlocked Perks</p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setActiveTab('wishlist')}
                            className="bg-rose-50 hover:bg-rose-100 border border-rose-100 p-2 rounded-2xl flex flex-col justify-center items-center min-w-0 cursor-pointer transition-colors"
                          >
                            <p className="text-base font-black text-rose-600 flex items-center gap-1">
                              <Heart className="h-3.5 w-3.5 fill-rose-500" />
                              {Array.isArray(loggedInCustomer.wishlist) ? loggedInCustomer.wishlist.length : 0}
                            </p>
                            <p className="text-[8px] text-rose-500 uppercase font-bold tracking-tight mt-0.5">Wishlist</p>
                          </button>
                          <div className="bg-slate-50 border border-slate-100 p-2 rounded-2xl flex flex-col justify-center min-w-0">
                            <p className="text-base font-black text-[#071d37]">£{(tierInfo.unlockedCount * 12).toFixed(0)}</p>
                            <p className="text-[8px] text-slate-400 uppercase font-bold tracking-tight mt-0.5">Saved Total</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Row: Next Order & Subscription Visualizers */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Next Order / Latest Order visualizer */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Subscription Scheduled Box or Latest Order Card */}
                      {hasRealSubscription ? (
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative">
                          <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                            <h3 className="font-extrabold text-sm text-[#071d37] uppercase tracking-wider flex items-center gap-1.5">
                              <Truck className="h-4.5 w-4.5 text-[#dfa047]" />
                              Next Subscription Delivery
                            </h3>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 py-1 px-3 rounded-full">
                              Scheduled
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-xs font-semibold py-2">
                            <div>
                              {/* Royal Mail's dispatch state, not a computed date. */}
                              <p className="text-[9px] text-slate-400 uppercase font-bold">Delivery</p>
                              <p className="text-xs font-extrabold text-[#071d37] mt-0.5">
                                {managedPlanDelivery?.label || 'Not dispatched yet'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-400 uppercase font-bold">Box Items</p>
                              <p className="text-xs font-extrabold text-[#071d37] mt-0.5">{custState.subCansCount || 6} canisters</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-400 uppercase font-bold">Total Price</p>
                              <p className="text-xs font-extrabold text-slate-900 mt-0.5">£{(Number(custState.subPrice || 0)).toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100 mt-4">
                            {myOrders.length > 0 && (
                              <button
                                onClick={() => setActiveTab('orders')}
                                className="flex-1 bg-[#071d37] hover:bg-[#0c2e56] text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-colors cursor-pointer text-center"
                              >
                                View Order
                              </button>
                            )}
                            <button 
                              onClick={() => setActiveTab('subscriptions')}
                              className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-[#071d37] font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-colors cursor-pointer text-center"
                            >
                              Manage Subscription
                            </button>
                          </div>
                        </div>
                      ) : myOrders.length > 0 ? (
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative">
                          <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                            <h3 className="font-extrabold text-sm text-[#071d37] uppercase tracking-wider flex items-center gap-1.5">
                              <Package className="h-4.5 w-4.5 text-[#dfa047]" />
                              Your Latest Order (#{myOrders[0].id})
                            </h3>
                            <span className={`text-[10px] font-bold py-1 px-3 rounded-full border ${
                              isDelivered(myOrders[0].fulfillmentStatus) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              isDispatched(myOrders[0].fulfillmentStatus) ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {dispatchLabel(myOrders[0].fulfillmentStatus)}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-xs font-semibold py-2">
                            <div>
                              <p className="text-[9px] text-slate-400 uppercase font-bold">Ordered On</p>
                              <p className="text-xs font-extrabold text-[#071d37] mt-0.5">
                                {myOrders[0].createdAt ? new Date(myOrders[0].createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-400 uppercase font-bold">Items</p>
                              <p className="text-xs font-extrabold text-[#071d37] mt-0.5">
                                {myOrders[0].items?.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) || myOrders[0].items?.length || 1} items
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-400 uppercase font-bold">Total Paid</p>
                              <p className="text-xs font-extrabold text-slate-900 mt-0.5">£{(Number(myOrders[0].total || 0)).toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100 mt-4">
                            <button
                              onClick={() => setActiveTab('orders')}
                              className="flex-1 bg-[#071d37] hover:bg-[#0c2e56] text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-colors cursor-pointer text-center"
                            >
                              View Order
                            </button>
                            <button 
                              onClick={() => {
                                const target = myOrders[0].trackingNumber || myOrders[0].trackingId || myOrders[0].id;
                                setTrackerInput(target);
                                handleTrackOrder(undefined, target);
                                setActiveTab('orders');
                              }}
                              className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-[#071d37] font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-colors cursor-pointer text-center"
                            >
                              Track Delivery
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative text-center py-8 space-y-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500">
                            <Package className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-sm text-[#071d37] uppercase tracking-wider">No Orders Placed Yet</h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                              Your customer account is active! Browse our premium nicotine pouches or set up a recurring subscription box for automatic delivery savings.
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 max-w-sm mx-auto">
                            <button 
                              onClick={() => { window.location.href = '/'; }}
                              className="flex-1 bg-[#071d37] hover:bg-[#0c2e56] text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition-colors cursor-pointer text-center"
                            >
                              Shop Pouches
                            </button>
                            <button 
                              onClick={() => { window.location.href = '/subscribe'; }}
                              className="flex-1 bg-[#dfa047] hover:bg-[#c98e3b] text-[#071d37] font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition-colors cursor-pointer text-center"
                            >
                              Subscribe & Save
                            </button>
                          </div>
                        </div>
                      )}

                      {/*
                        The plan summary that used to sit here now lives only on
                        /pages/account/subscriptions, which is the page that can
                        actually act on it. "Next Subscription Delivery" above
                        already tells the dashboard reader where their plan
                        stands, and links across to manage it.
                      */}

                    </div>

                    {/* Right Side Column: Free Rewards Redemptions list & Friends Invites */}
                    <div className="space-y-6">
                      
                      {/* Invite Friends Referral Card */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-sm text-[#071d37] uppercase tracking-wider">Invite your friends</h3>
                          <p className="text-slate-500 text-[10.5px] leading-relaxed">
                            Give your friends <strong className="text-[#071d37]">10% off</strong> their first order and get <strong className="text-emerald-700">£5.00 credit</strong> when they subscribe.
                          </p>
                        </div>

                        {/* Copyable referral input */}
                        <div className="flex items-center gap-2 bg-[#f4f6f9] p-2.5 rounded-2xl border border-slate-100">
                          <input 
                            type="text" 
                            readOnly 
                            value={custState.referralCode} 
                            className="bg-transparent text-slate-600 text-[10px] font-semibold flex-1 outline-none select-all" 
                          />
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(custState.referralCode);
                              alert('Referral link copied to clipboard!');
                            }}
                            className="p-1.5 hover:bg-slate-200 text-[#071d37] rounded-lg transition-colors cursor-pointer"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>

                        <button 
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: 'Join Pouch Supply',
                                text: 'Join me on Pouch Supply for the ultimate subscription box experience!',
                                url: custState.referralCode
                              }).catch(() => {});
                            } else {
                              navigator.clipboard.writeText(custState.referralCode);
                              alert('Referral link copied! Share it with your friends.');
                            }
                          }}
                          className="w-full bg-[#071d37] hover:bg-[#0c2e56] text-white font-bold text-xs uppercase py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                        >
                          <Share2 className="h-4 w-4" />
                          Share your link
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Bottom Row: Recent Order Log */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                      <h3 className="font-extrabold text-sm text-[#071d37] uppercase tracking-wider">Recent Order Log</h3>
                      <button onClick={() => setActiveTab('orders')} className="text-[10px] font-bold text-[#dfa047] uppercase hover:underline">View all orders</button>
                    </div>

                    {myOrders.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-xs text-slate-400">No purchase records registered yet.</p>
                      </div>
                    ) : (
                      <div 
                        onClick={() => setSelectedOrderDetails(myOrders[0])}
                        className="flex justify-between items-center bg-[#f4f6f9] hover:bg-slate-100 p-4 rounded-2xl border border-slate-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-500 font-mono font-bold text-xs">
                            #PS
                          </div>
                          <div>
                            <p className="text-xs font-black text-[#071d37]">Order {myOrders[0].id}</p>
                            <p className="text-[10px] text-slate-500">{myOrders[0].date} • {myOrders[0].items.reduce((sum, item) => sum + item.quantity, 0)} canisters</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase">{myOrders[0].fulfillmentStatus}</span>
                          <span className="text-xs font-black text-[#071d37]">£{(Number(myOrders[0].total || 0)).toFixed(2)}</span>
                          <ChevronRight className="h-4.5 w-4.5 text-slate-400" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Horizontal Trust Badges row matching mockup */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="bg-white border border-slate-200 py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-xs">
                      <Tag className="h-4.5 w-4.5 text-[#dfa047]" />
                      <span className="text-xs font-black text-[#071d37] uppercase tracking-wider">Save up to £55/mo</span>
                    </div>
                    <div className="bg-white border border-slate-200 py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-xs">
                      <Package className="h-4.5 w-4.5 text-[#dfa047]" />
                      <span className="text-xs font-black text-[#071d37] uppercase tracking-wider">Discreet delivery</span>
                    </div>
                    <div className="bg-white border border-slate-200 py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-xs">
                      <Clock className="h-4.5 w-4.5 text-[#dfa047]" />
                      <span className="text-xs font-black text-[#071d37] uppercase tracking-wider">Cancel anytime</span>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: ORDERS (Order history list and detailed shipment timeline) */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  
                  {/* Shipment visualizer widget */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="border-b border-slate-100 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                      <div>
                        <h3 className="font-extrabold text-sm text-[#071d37] uppercase tracking-wider">Real-Time Order Tracker</h3>
                        <p className="text-slate-400 text-[10.5px]">Provide your Order ID code to visualize shipping history logs.</p>
                      </div>
                      <form onSubmit={handleTrackOrder} className="flex gap-2 w-full md:w-auto">
                        <input
                          type="text"
                          placeholder="e.g. PS48884"
                          value={trackerInput}
                          onChange={(e) => setTrackerInput(e.target.value)}
                          className="text-xs font-mono font-bold border border-slate-200 px-3 py-2 rounded-xl focus:ring-2 focus:ring-[#071d37] focus:outline-none uppercase bg-slate-50/50"
                        />
                        <button type="submit" className="bg-[#dfa047] text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer">Track</button>
                      </form>
                    </div>

                    {trackerError && <p className="text-xs text-rose-500 font-bold">{trackerError}</p>}

                    {trackedOrder ? (
                      (() => {
                        const currentTrackingNumber = trackedOrder.trackingNumber || trackedOrder.trackingId || trackedOrder.data?.royalMail?.trackingNumber;
                        const isRoyalMail = trackedOrder.carrier === 'Royal Mail' || 
                                            trackedOrder.carrier?.toLowerCase().includes('royal mail') || 
                                            trackedOrder.carrier === 'Express Courier' || 
                                            Boolean(currentTrackingNumber);
                        
                        if (!isRoyalMail) {
                          return (
                            <div className="space-y-6">
                              <div className="bg-[#f4f6f9] border border-slate-100 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                                <div>
                                  <span className="text-[9px] text-slate-400 uppercase font-bold">Currently Tracking</span>
                                  <p className="font-bold text-[#071d37] mt-0.5">{trackedOrder.id}</p>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-400 uppercase font-bold">Recipient Address</span>
                                  <p className="font-bold text-slate-600 mt-0.5">{trackedOrder.destination}</p>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-400 uppercase font-bold">Courier Status</span>
                                  <p className="text-emerald-700 font-black mt-0.5">{trackedOrder.fulfillmentStatus.toUpperCase()}</p>
                                </div>
                              </div>

                              {/* Interactive Timeline layout */}
                              <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-2 pb-4">
                                <div className="absolute hidden md:block left-6 right-6 top-[2rem] h-0.5 bg-slate-200" />
                                {getTimelineSteps(trackedOrder).map((step) => {
                                  const isCompleted = step.status === 'completed';
                                  const isCurrent = step.status === 'current';
                                  return (
                                    <div key={step.key} className="flex md:flex-col items-center gap-3 flex-1 text-left md:text-center z-10 w-full">
                                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                        isCompleted ? 'bg-[#071d37] border-[#071d37] text-white' : isCurrent ? 'bg-white border-[#dfa047] text-[#dfa047] animate-pulse' : 'bg-white border-slate-200 text-slate-400'
                                      }`}>
                                        {isCompleted ? <Check className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                      </div>
                                      <div>
                                        <h4 className="text-[11px] font-black uppercase tracking-wider text-[#071d37]">{step.label}</h4>
                                        <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{step.description}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }

                        // Royal Mail Live Tracking Card
                        // `history` and `recipientLocation` are what the tracking
                        // endpoint returns (TrackingResult). Reading `events` and
                        // `lastLocation` here meant the live scan list and depot
                        // silently fell back to the stored copy on every lookup.
                        const events = (liveTrackingInfo?.history && liveTrackingInfo.history.length > 0)
                          ? liveTrackingInfo.history
                          : (trackedOrder.trackingHistory || []);

                        // Only a live Royal Mail scan may claim the parcel is moving;
                        // without one we can say it left us, and no more than that.
                        const displayStatus = liveTrackingInfo?.status ||
                          (isDelivered(trackedOrder.fulfillmentStatus) ? 'Delivered & Signed' :
                           isDispatched(trackedOrder.fulfillmentStatus) ? 'Dispatched via Royal Mail' : 'Awaiting Collection');

                        const estimatedArrival = liveTrackingInfo?.estimatedDelivery ||
                          (isDelivered(trackedOrder.fulfillmentStatus) ? 'Delivered successfully' : 'Within 24-48 Hours');

                        // The newest real scan, and nothing else. `recipientLocation`
                        // is the DESTINATION address, not a scan — putting it here
                        // showed the customer their own doorstep captioned as a
                        // Royal Mail depot.
                        const lastDepot = events.length > 0
                          ? events[0].location
                          : 'Awaiting first scan';

                        return (
                          <div className="bg-[#f8fafc] border-2 border-slate-800 rounded-3xl overflow-hidden shadow-xs">
                            {/* Royal Mail Brand Header */}
                            <div className="bg-slate-900 p-4 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className="font-serif font-black tracking-widest text-lg">Royal Mail</span>
                                <span className="text-[9px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                                  Click & Drop® Live
                                </span>
                              </div>
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                {currentTrackingNumber && (
                                  <div className="text-left sm:text-right">
                                    <span className="text-[8px] text-slate-300 block uppercase font-extrabold">TRACKING NUMBER</span>
                                    <span className="font-mono font-black text-sm tracking-wider text-white select-all">{currentTrackingNumber}</span>
                                  </div>
                                )}
                                {currentTrackingNumber && (
                                  <a
                                    href={`https://www.royalmail.com/track-your-item#/tracking-results/${encodeURIComponent(currentTrackingNumber)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                                  >
                                    <span>Track on RoyalMail.com</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Courier Content Area */}
                            <div className="p-5 sm:p-6 space-y-6">
                              {liveTrackingLoading && (
                                <div className="flex items-center justify-center gap-2 py-2 text-xs text-rose-700 font-bold bg-rose-50 rounded-xl">
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  <span>Syncing latest scan events with Royal Mail Network...</span>
                                </div>
                              )}

                              {/* Status Quick Look */}
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200">
                                <div>
                                  <span className="text-[9px] text-slate-400 uppercase font-extrabold block">Current Status</span>
                                  <span className={`text-sm font-black uppercase tracking-wide flex items-center gap-1.5 mt-0.5 ${
                                    trackedOrder.fulfillmentStatus === 'Delivered' ? 'text-emerald-600' :
                                    isDispatched(trackedOrder.fulfillmentStatus) ? 'text-rose-600 animate-pulse' : 'text-[#dfa047]'
                                  }`}>
                                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-current" />
                                    {displayStatus}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-400 uppercase font-extrabold block">Last Scanned Depot</span>
                                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                                    {lastDepot}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-400 uppercase font-extrabold block">Estimated Arrival</span>
                                  <span className="text-xs font-black text-slate-900 mt-0.5 block">
                                    {estimatedArrival}
                                  </span>
                                </div>
                              </div>

                              {/* Courier Progress Timeline */}
                              <div className="relative pt-2 pb-4">
                                <div className="absolute top-[2.1rem] left-8 right-8 h-1 bg-slate-200" />
                                <div className="absolute top-[2.1rem] left-8 h-1 bg-[#e1192e] transition-all duration-500" style={{
                                  width: isDelivered(trackedOrder.fulfillmentStatus) ? 'calc(100% - 64px)' :
                                         isDispatched(trackedOrder.fulfillmentStatus) ? '50%' : '0%'
                                }} />

                                <div className="flex justify-between items-start text-center relative z-10">
                                  {[
                                    { id: 'placed', label: 'Accepted', desc: 'Package registered', status: 'completed' },
                                    { id: 'transit', label: 'Dispatched', desc: 'Outward MC hub', status: isProcessing(trackedOrder.fulfillmentStatus) ? 'pending' : 'completed' },
                                    { id: 'delivered', label: 'Delivered', desc: 'At destination', status: isDelivered(trackedOrder.fulfillmentStatus) ? 'completed' : 'pending' }
                                  ].map((pt, idx) => (
                                    <div key={idx} className="flex flex-col items-center flex-1">
                                      <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center transition-all ${
                                        pt.status === 'completed' 
                                          ? 'bg-[#e1192e] border-[#ffd6d9] text-white shadow-xs' 
                                          : 'bg-white border-slate-200 text-slate-400'
                                      }`}>
                                        {pt.status === 'completed' ? <Check className="h-4.5 w-4.5 font-bold" /> : <Clock className="h-4.5 w-4.5" />}
                                      </div>
                                      <div className="mt-2.5">
                                        <span className={`text-[10.5px] font-black uppercase block tracking-wider ${pt.status === 'completed' ? 'text-[#e1192e]' : 'text-slate-400'}`}>{pt.label}</span>
                                        <span className="text-[8.5px] text-slate-400 block mt-0.5">{pt.desc}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Detailed Checkpoints */}
                              <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-red-50 text-xs">
                                <div className="flex justify-between items-center border-b border-red-100 pb-2">
                                  <span className="font-extrabold text-slate-800 uppercase text-[10px] tracking-wider">Courier Routing History</span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase">Live Updates via Royal Mail API</span>
                                </div>
                                
                                <div className="space-y-4 pt-1">
                                  {events && events.length > 0 ? (
                                    events.map((hist: any, idx: number) => (
                                      <div key={idx} className="flex gap-4 items-start relative">
                                        {idx < events.length - 1 && (
                                          <div className="absolute left-2.5 top-6 bottom-[-16px] w-0.5 bg-red-100" />
                                        )}
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 ${
                                          idx === 0 ? 'bg-[#e1192e] text-white ring-4 ring-red-100 animate-pulse' : 'bg-red-50 text-[#e1192e]'
                                        }`}>
                                          <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                        </div>
                                        <div className="space-y-0.5 flex-1">
                                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                                            <span className="font-black text-slate-800 text-[11px] uppercase tracking-wide">{hist.status}</span>
                                            <span className="text-[9px] font-mono text-slate-400 font-bold">{hist.date}</span>
                                          </div>
                                          <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                                            <MapPin className="h-3.5 w-3.5 text-red-400" /> {hist.location}
                                          </p>
                                          <p className="text-[10.5px] text-slate-600 leading-normal mt-1">{hist.description}</p>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center py-4 text-slate-400 text-xs font-semibold">
                                      Royal Mail shipment registered. Awaiting initial sorting depot scan.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-4">Search for an order ID above to preview your custom shipping timelines.</p>
                    )}
                  </div>

                  {/* Full Order history table */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                    <h3 className="font-extrabold text-sm text-[#071d37] uppercase tracking-wider">Purchase History List</h3>
                    
                    {myOrders.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">You haven't placed any order transactions yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {myOrders.map(order => {
                          const isSubOrder = Boolean(
                            order.isSubscription || 
                            (Array.isArray(order.tags) && order.tags.some(t => t && t.toLowerCase().includes('subscription'))) ||
                            (Array.isArray(order.items) && order.items.some((i: any) => 
                              i && (
                                i.isSubscription || 
                                i.vendor === 'Subscription Pack' || 
                                (i.productTitle && (i.productTitle.toLowerCase().includes('subscription') || i.productTitle.toLowerCase().includes('plan') || i.productTitle.toLowerCase().includes('pack')))
                              )
                            ))
                          );

                          return (
                            <div 
                              key={order.id} 
                              className={`p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all border ${
                                isSubOrder
                                  ? 'bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/50 border-indigo-200/90 hover:border-indigo-300 shadow-xs ring-1 ring-indigo-500/10'
                                  : 'bg-[#f4f6f9] border-slate-100 hover:border-slate-300'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-black text-xs text-[#071d37] font-mono">{order.id}</span>
                                  <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100 uppercase">{order.fulfillmentStatus}</span>
                                  {isSubOrder && (
                                    <span className="text-[9px] font-black uppercase py-0.5 px-2.5 rounded-full leading-none shrink-0 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-2xs flex items-center gap-1">
                                      <RefreshCw className="h-2.5 w-2.5 text-amber-300 animate-spin-slow" />
                                      Subscription Order
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500">{order.date} • {order.items.length} unique lines • {order.deliveryMethod}</p>
                              </div>
                            <div className="flex sm:flex-col items-end gap-2 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                              <span className="text-xs font-black text-slate-900">£{(Number(order.total || 0)).toFixed(2)}</span>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => setSelectedOrderDetails(order)}
                                  className="text-[10px] font-bold text-white bg-slate-800 hover:bg-slate-700 py-1 px-2.5 rounded-lg cursor-pointer flex items-center gap-1 transition-all"
                                >
                                  <Eye className="h-3 w-3" /> View Order
                                </button>
                                <button
                                  onClick={() => handleDownloadInvoice(order)}
                                  disabled={invoiceBusyId === String(order.id)}
                                  title={`Download invoice ${getInvoiceNumber(order)} (PDF)`}
                                  className="text-[10px] font-bold text-[#071d37] bg-white border border-slate-200 py-1 px-2.5 rounded-lg cursor-pointer hover:bg-slate-50 hover:border-[#dfa047] transition-all flex items-center gap-1 disabled:opacity-60 disabled:cursor-wait"
                                >
                                  {invoiceBusyId === String(order.id)
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <Download className="h-3 w-3" />}
                                  Invoice
                                </button>
                                <button 
                                  onClick={() => {
                                    const target = order.trackingNumber || order.trackingId || order.id;
                                    setTrackerInput(target);
                                    handleTrackOrder(undefined, target);
                                    setActiveTab('orders');
                                  }}
                                  className="text-[10px] font-bold text-white bg-[#071d37] py-1 px-2.5 rounded-lg cursor-pointer hover:bg-[#dfa047] transition-all"
                                >
                                  Track
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 4: WISHLIST (rendered after Subscriptions in the sidebar order) */}
              {activeTab === 'wishlist' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-extrabold text-base text-[#071d37] uppercase tracking-wider flex items-center gap-2">
                        <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
                        My Saved Wishlist
                      </h3>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {Array.isArray(loggedInCustomer.wishlist) ? loggedInCustomer.wishlist.length : 0} item(s) saved in your personal collection.
                      </p>
                    </div>
                  </div>

                  {(!loggedInCustomer.wishlist || loggedInCustomer.wishlist.length === 0) ? (
                    <div className="text-center py-16 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-3">
                      <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-400">
                        <Heart className="h-6 w-6" />
                      </div>
                      <p className="text-sm text-slate-800 font-extrabold uppercase tracking-wide">Your Wishlist is Empty</p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Explore our catalog and click the heart icon on any product to save your favorite nicotine pouch cans here!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {(loggedInCustomer.wishlist || []).map((productId, pidIdx) => {
                        const pidStr = String(productId).trim().toLowerCase();
                        const prod = allProducts.find(p => 
                          String(p.id).toLowerCase() === pidStr || 
                          (p.slug && String(p.slug).toLowerCase() === pidStr) || 
                          (p.title && String(p.title).toLowerCase() === pidStr) ||
                          (p.concreteVariantId && String(p.concreteVariantId).toLowerCase() === pidStr) ||
                          (p.concreteVariants && p.concreteVariants.some(v => String(v.id).toLowerCase() === pidStr || String(v.name).toLowerCase() === pidStr))
                        );
                        if (!prod) return null;
                        const displayTitle = getWishlistProductTitle(prod, String(productId));

                        return (
                          <div 
                            key={`ca-wish-${prod.id}-${pidIdx}`} 
                            className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all hover:shadow-sm"
                          >
                            <div className="space-y-3">
                              <div className="h-36 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center relative p-2 border border-slate-100">
                                <img 
                                  src={prod.image} 
                                  className="w-full h-full object-contain" 
                                  alt={displayTitle} 
                                  referrerPolicy="no-referrer"
                                />
                                <span className="absolute top-2 left-2 text-[9px] font-black uppercase tracking-wider bg-[#071d37] text-white px-2 py-0.5 rounded-full">
                                  {prod.vendor}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateWishlist(String(productId), 'remove')}
                                  className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-rose-50 text-rose-500 rounded-full shadow-xs transition-colors cursor-pointer"
                                  title="Remove from Wishlist"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              <div>
                                <p className="text-[9.5px] text-slate-400 uppercase font-black tracking-wider">{prod.category || 'Pouches'}</p>
                                <h4 className="font-extrabold text-slate-900 text-xs truncate mt-0.5" title={displayTitle}>{displayTitle}</h4>
                                <p className="text-sm text-indigo-700 font-black mt-1">£{(Number(prod.price || 0)).toFixed(2)}</p>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onAddToCart) onAddToCart(prod, 1);
                                  if (onOpenCart) onOpenCart();
                                }}
                                className="flex-1 bg-[#071d37] hover:bg-[#0c2e56] text-white font-bold text-xs uppercase tracking-wider py-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Plus className="h-3.5 w-3.5" /> Add to Bag
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateWishlist(String(productId), 'remove')}
                                className="px-2.5 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer text-xs font-bold"
                                title="Remove"
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
              )}

              {/* TAB 3: SUBSCRIPTIONS (Interactive controls for active sub, swaps, pause/resume) */}
              {activeTab === 'subscriptions' && (
                <div className="space-y-6">
                  {accountSubscriptionsLoaded && !hasRealSubscription && !hasCancelledSubscription ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-xs text-center space-y-6 max-w-2xl mx-auto my-4">
                      <div className="w-16 h-16 bg-amber-50 border border-amber-200/80 rounded-full flex items-center justify-center mx-auto text-[#dfa047] shadow-2xs">
                        <RefreshCw className="w-8 h-8" />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#dfa047] bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200/60">
                          No Active Subscription
                        </span>
                        <h3 className="text-xl font-black text-[#071d37] tracking-tight">You are not subscribed yet</h3>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                          You haven't purchased a subscription product yet. Choose a plan to unlock automated deliveries, custom canister selection, and up to 12% off on every box!
                        </p>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={() => {
                            window.location.href = '/subscribe';
                          }}
                          className="bg-[#071d37] hover:bg-[#0c2e56] text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-8 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4 text-[#dfa047]" />
                          Build Your Subscription Box
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Subscription Feedback Toast */}
                      {subActionToast && (
                        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold ${
                          subActionToast.type === 'success'
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                            : subActionToast.type === 'info'
                            ? 'bg-slate-50 text-slate-900 border border-slate-200'
                            : 'bg-rose-50 text-rose-900 border border-rose-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            {subActionToast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className={`w-4 h-4 shrink-0 ${subActionToast.type === 'info' ? 'text-slate-500' : 'text-rose-600'}`} />}
                            <span>{subActionToast.message}</span>
                          </div>
                          <button onClick={() => setSubActionToast(null)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/*
                        Cancelled banner. Driven by the plans alone —
                        hasCancelledSubscription already falls back to the
                        profile flag when there are no plans — so it no longer
                        appears above plans that are all live.
                      */}
                      {accountSubscriptionsLoaded && hasCancelledSubscription && (
                        <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div className="p-2.5 bg-rose-100 border border-rose-300 rounded-2xl text-rose-700 shrink-0 mt-0.5">
                              <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-black uppercase tracking-wider text-rose-900">Subscription Plan Cancelled</h4>
                                <span className="text-[9px] bg-rose-600 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Billing Halted
                                </span>
                              </div>
                              <p className="text-xs text-rose-700 font-medium leading-relaxed">
                                Your recurring delivery subscription has been cancelled. Automatic renewals and card charges are stopped.
                              </p>
                              {custState.subscriptionCancellationReason && (
                                <p className="text-[11px] text-rose-850 font-semibold">
                                  Reason: {custState.subscriptionCancellationReason}
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isReactivatingSub}
                            onClick={handleReactivateSubscription}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider py-3 px-5 rounded-2xl shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2"
                          >
                            {isReactivatingSub ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Reactivating...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reactivate Subscription
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/*
                        Every plan this customer has ever held, each managed on
                        its own. A cancelled plan can be resumed or removed from
                        the list here; the buttons above act on the whole
                        account, which is wrong once there is more than one plan.
                      */}
                      {!accountSubscriptionsLoaded && (
                        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
                          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div>
                              <h3 className="font-extrabold text-sm sm:text-base text-[#071d37] uppercase tracking-wider">Your Subscription Plans</h3>
                              <p className="text-slate-400 text-[11px] mt-0.5">Loading your plans…</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {[0, 1].map(i => (
                              <div key={i} className="border border-slate-200 rounded-2xl p-4 animate-pulse">
                                <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
                                <div className="h-4 w-40 bg-slate-200 rounded mb-2" />
                                <div className="h-3 w-32 bg-slate-100 rounded" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {accountSubscriptionsLoaded && visibleAccountSubscriptions.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
                          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div>
                              <h3 className="font-extrabold text-sm sm:text-base text-[#071d37] uppercase tracking-wider">Your Subscription Plans</h3>
                              <p className="text-slate-400 text-[11px] mt-0.5">Resume a cancelled plan, or remove one you no longer need from this list.</p>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">
                              {visibleAccountSubscriptions.length} {visibleAccountSubscriptions.length === 1 ? 'Plan' : 'Plans'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {visibleAccountSubscriptions.map((subscription: any) => {
                              const planName = subscription.planName || subscription.name || 'Subscription Box';
                              // Some plans were stored with the entire checkout line as their
                              // name — "LITE Plan [Next Day (Test) - 10% OFF] - (WHITE FOX …)" —
                              // which the card then truncated mid-word. The tier is the name;
                              // the frequency and box are already shown on their own rows.
                              const planTierName = detectPlanTier(planName);
                              const planLabel = planTierName ? `${planTierName.toUpperCase()} Plan` : planName;
                              const planSlug = getPlanSlug(planName);
                              const planTier = ACCOUNT_SUB_PLANS.find(tier => tier.id === planSlug);
                              const amount = Number(subscription.amount ?? subscription.subPrice ?? planTier?.price ?? 0);
                              const status = String(subscription.status || '').toLowerCase();
                              const isCancelledPlan = ['cancelled', 'canceled', 'inactive'].includes(status);
                              const isPausedPlan = status === 'paused';
                              const busy = subActionBusyId === String(subscription.id);
                              const confirmingDelete = pendingDeleteSubId === String(subscription.id);
                              // Only the plan actually opened for management, not
                              // activeSubscription's first-plan fallback — otherwise
                              // the top card claims to be managed with no console below it.
                              const isManaged = String(managedSubscription?.id || '') === String(subscription.id);
                              const planOrderIds = subscriptionOrderIds(subscription);
                              const nextDate = subscription.nextBillingDate ? new Date(subscription.nextBillingDate) : null;
                              const cancelledDate = subscription.cancelledAt ? new Date(subscription.cancelledAt) : null;
                              const formatDate = (d: Date | null) =>
                                d && !isNaN(d.getTime())
                                  ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                  : null;

                              return (
                                <div
                                  key={subscription.id || planName}
                                  className={`border rounded-2xl p-4 space-y-3 transition-all ${
                                    isCancelledPlan
                                      ? 'bg-slate-50/70 border-slate-200'
                                      : isManaged
                                      ? 'bg-white border-[#071d37] ring-1 ring-[#071d37]/20 shadow-xs'
                                      : 'bg-white border-slate-200 shadow-xs'
                                  }`}
                                >
                                  <div className="flex items-start gap-4">
                                    <img
                                      src={getPlanImage(planName)}
                                      className={`w-16 h-16 object-contain rounded-xl bg-slate-50 shrink-0 ${isCancelledPlan ? 'opacity-60 grayscale' : ''}`}
                                      alt={`${planName} subscription plan`}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                                          isCancelledPlan
                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                            : isPausedPlan
                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        }`}>
                                          {isCancelledPlan ? 'Cancelled' : isPausedPlan ? 'Paused' : 'Active'}
                                        </span>
                                        {/*
                                          Every order this plan has billed, newest
                                          first. One plan bills repeatedly, so the
                                          customer's order numbers outnumber their
                                          plans — listing them all is what makes a
                                          renewal traceable to its plan.
                                        */}
                                        {planOrderIds.map((planOrderId, orderIdx) => (
                                          <button
                                            key={planOrderId}
                                            type="button"
                                            onClick={() => {
                                              const match = myOrders.find(o => String(o.id) === planOrderId);
                                              if (match) setSelectedOrderDetails(match);
                                            }}
                                            title={
                                              orderIdx === planOrderIds.length - 1
                                                ? `Order ${planOrderId} started this plan`
                                                : `Renewal order ${planOrderId}`
                                            }
                                            className="text-[9px] font-black uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 hover:border-[#dfa047] hover:text-[#071d37] px-2 py-0.5 rounded-full font-mono cursor-pointer transition-colors"
                                          >
                                            {planOrderId}
                                          </button>
                                        ))}
                                        {subscription.billingInterval && !isCancelledPlan && (
                                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                            Every {subscription.billingInterval}
                                          </span>
                                        )}
                                      </div>
                                      <h4 className="text-sm font-black text-[#071d37] uppercase truncate mt-1" title={planName}>{planLabel}</h4>
                                      <p className="text-xs text-slate-500 font-medium">
                                        {planTier?.cans || subscription.cansCount || 6} items • £{amount.toFixed(2)} per delivery
                                      </p>
                                      {!isCancelledPlan && formatDate(nextDate) && (
                                        <p className="text-[11px] text-slate-500 font-semibold mt-1 flex items-center gap-1.5">
                                          <Calendar className="w-3 h-3 text-[#dfa047]" />
                                          Next delivery {formatDate(nextDate)}
                                        </p>
                                      )}
                                      {isCancelledPlan && formatDate(cancelledDate) && (
                                        <p className="text-[11px] text-slate-500 font-semibold mt-1">
                                          Cancelled {formatDate(cancelledDate)}
                                          {subscription.cancellationReason ? ` • ${subscription.cancellationReason}` : ''}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/*
                                    A plan with no stored-card mandate cannot take a
                                    recurring payment, so resuming it would look fine
                                    and then quietly never deliver.
                                  */}
                                  {subscription.canChargeRecurring === false && (
                                    <p className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
                                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-px" />
                                      <span>{subscription.credentialIssue || 'This plan has no saved card mandate and cannot renew automatically.'}</span>
                                    </p>
                                  )}

                                  {/*
                                    Rebuilt from the customer's order because the
                                    subscriptions store returned no record for it.
                                    Said plainly rather than passed off as a fully
                                    loaded plan: its details come from the order.
                                  */}
                                  {subscription.isDerivedFromOrder && (
                                    <p className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
                                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px text-slate-400" />
                                      <span>
                                        This order has no subscription record behind it, so it will not renew and there
                                        is nothing to change or cancel here. The details shown come from the order
                                        above. Contact support if you expected this plan to keep delivering.
                                      </span>
                                    </p>
                                  )}

                                  {isCancelledPlan && !subscription.isDerivedFromOrder && (
                                    confirmingDelete ? (
                                      <div className="bg-white border border-rose-200 rounded-xl p-3 space-y-2">
                                        <p className="text-[11px] font-bold text-rose-900">
                                          Remove this plan from your account? Your past orders and invoices are not affected.
                                        </p>
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() => handleDeleteSubscription(String(subscription.id))}
                                            className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                          >
                                            {busy ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                            {busy ? 'Removing...' : 'Yes, remove'}
                                          </button>
                                          <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() => setPendingDeleteSubId(null)}
                                            className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-[10px] font-black uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all cursor-pointer"
                                          >
                                            Keep it
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 pt-1">
                                        <button
                                          type="button"
                                          disabled={busy}
                                          onClick={() => handleResumeSubscription(String(subscription.id))}
                                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-3 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                        >
                                          <RefreshCw className={`w-3 h-3 ${busy ? 'animate-spin' : ''}`} />
                                          {busy ? 'Resuming...' : 'Resume Plan'}
                                        </button>
                                        <button
                                          type="button"
                                          disabled={busy}
                                          onClick={() => setPendingDeleteSubId(String(subscription.id))}
                                          className="bg-white border border-slate-200 hover:border-rose-300 hover:text-rose-700 disabled:opacity-50 text-slate-600 text-[10px] font-black uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          Remove
                                        </button>
                                      </div>
                                    )
                                  )}

                                  {/*
                                    Picks which plan the editor below is working
                                    on. Without it a customer with two plans has
                                    no way to reach the second one's box.
                                  */}
                                  {/*
                                    A card rebuilt from an order has no plan record
                                    for Manage or Cancel to act on — the server
                                    refuses both — so it offers neither.
                                  */}
                                  {!isCancelledPlan && !subscription.isDerivedFromOrder && (
                                    <div className="flex items-center gap-2">
                                      {isManaged ? (
                                        <p className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl py-2.5">
                                          <CheckCircle2 className="w-3 h-3" />
                                          Managing this plan below
                                        </p>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => openSubscriptionManager(String(subscription.id))}
                                          className="flex-1 bg-[#071d37] hover:bg-[#0c2e56] text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all cursor-pointer"
                                        >
                                          Manage This Plan
                                        </button>
                                      )}
                                      {/*
                                        Cancels this plan alone. Named explicitly
                                        so a customer holding several plans stops
                                        the one they picked and no other.
                                      */}
                                      <button
                                        type="button"
                                        onClick={() => openCancelSubscriptionModal(String(subscription.id))}
                                        title={`Cancel ${planName}`}
                                        className="bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-[10px] font-black uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                                      >
                                        Cancel Plan
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/*
                        Subscription orders no plan card accounts for — most
                        often orders billed by a plan the customer has since
                        removed. Removal is promised not to affect past orders,
                        so they are listed here rather than disappearing with
                        the plan.
                      */}
                      {unlistedSubscriptionOrders.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs space-y-3">
                          <div className="pb-3 border-b border-slate-100">
                            <h3 className="font-extrabold text-sm sm:text-base text-[#071d37] uppercase tracking-wider">Other Subscription Orders</h3>
                            <p className="text-slate-400 text-[11px] mt-0.5">
                              Paid subscription orders that are not attached to any plan above — usually because the
                              plan that billed them has been removed.
                            </p>
                          </div>

                          <div className="space-y-2">
                            {unlistedSubscriptionOrders.map(order => (
                              <div
                                key={order.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f4f6f9] border border-slate-100 rounded-2xl p-3"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-black text-xs text-[#071d37] font-mono">{order.id}</span>
                                    <span className="text-[9px] font-bold bg-white text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full uppercase">
                                      {order.fulfillmentStatus}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 mt-0.5">
                                    {order.date} • £{(Number(order.total) || 0).toFixed(2)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderDetails(order)}
                                    className="text-[10px] font-bold text-white bg-slate-800 hover:bg-slate-700 py-1.5 px-2.5 rounded-lg cursor-pointer flex items-center gap-1 transition-all"
                                  >
                                    <Eye className="h-3 w-3" /> View Order
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadInvoice(order)}
                                    disabled={invoiceBusyId === String(order.id)}
                                    className="text-[10px] font-bold text-[#071d37] bg-white border border-slate-200 py-1.5 px-2.5 rounded-lg cursor-pointer hover:bg-slate-50 hover:border-[#dfa047] transition-all flex items-center gap-1 disabled:opacity-60 disabled:cursor-wait"
                                  >
                                    {invoiceBusyId === String(order.id)
                                      ? <Loader2 className="h-3 w-3 animate-spin" />
                                      : <Download className="h-3 w-3" />}
                                    Invoice
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/*
                        No plan to list and none to manage. The account is
                        flagged as subscribed somewhere — a profile field, most
                        likely — but nothing on the server backs it, so say so
                        rather than showing an editor with nothing behind it.
                      */}
                      {accountSubscriptionsLoaded && visibleAccountSubscriptions.length === 0 && (
                        deletedSubscriptions.length > 0 ? (
                          /*
                            The plans are not lost — they were removed from this
                            list, which is why nothing shows. Saying so, and
                            offering them back, beats a blank list the customer
                            has to guess at.
                          */
                          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
                            <div className="pb-3 border-b border-slate-100">
                              <h3 className="font-extrabold text-sm sm:text-base text-[#071d37] uppercase tracking-wider">
                                No Plans On Your List
                              </h3>
                              <p className="text-slate-400 text-[11px] mt-0.5">
                                {deletedSubscriptions.length === 1
                                  ? 'One plan was removed from this list.'
                                  : `${deletedSubscriptions.length} plans were removed from this list.`}{' '}
                                Your orders and invoices are unaffected. You can put a removed plan back below.
                              </p>
                            </div>

                            <div className="space-y-2">
                              {deletedSubscriptions.map(removed => {
                                const busy = subActionBusyId === String(removed.id);
                                const when = removed.deletedAt ? new Date(removed.deletedAt) : null;
                                const whenLabel = when && !isNaN(when.getTime())
                                  ? when.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                  : null;
                                return (
                                  <div
                                    key={removed.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f4f6f9] border border-slate-100 rounded-2xl p-3"
                                  >
                                    <div className="min-w-0">
                                      <p className="font-black text-xs text-[#071d37] truncate">
                                        {removed.planName || 'Subscription Plan'}
                                      </p>
                                      <p className="text-[10px] text-slate-500 mt-0.5">
                                        Removed{whenLabel ? ` ${whenLabel}` : ''}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() => handleResumeSubscription(String(removed.id))}
                                      className="shrink-0 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-wider py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                      <RefreshCw className={`w-3 h-3 ${busy ? 'animate-spin' : ''}`} />
                                      {busy ? 'Restoring...' : 'Restore Plan'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs text-center space-y-2">
                            <h3 className="font-extrabold text-sm text-[#071d37] uppercase tracking-wider">No Plan Records Found</h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                              Your account is marked as subscribed but we could not load a plan for it. If you have just
                              subscribed, refresh in a moment — otherwise contact support and we will restore it.
                            </p>
                          </div>
                        )
                      )}

                      {/*
                        Subscription management console — the "Manage This Plan"
                        screen. It stays closed on the plan list: this is where a
                        plan is edited, and editing one is something the customer
                        opts into, not the page's default state.
                      */}
                      {isManagingSubscription && (
                      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
                          <div>
                            <button
                              type="button"
                              onClick={closeSubscriptionManager}
                              className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-[#071d37] flex items-center gap-1 mb-2 cursor-pointer transition-colors"
                            >
                              <ChevronRight className="w-3 h-3 rotate-180" />
                              All Plans
                            </button>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-sm sm:text-base text-[#071d37] uppercase tracking-wider">Subscription Plan & Deliveries</h3>
                              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                                managedPlanStatus === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : managedPlanStatus === 'Paused'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                              }`}>
                                {managedPlanStatus}
                              </span>
                            </div>
                            <p className="text-slate-400 text-[11px] mt-0.5">Switch your plan tier, swap canister flavors, or update delivery frequency anytime.</p>
                            {/*
                              Names the plan being edited. With more than one
                              plan on the account, an unlabelled editor gives no
                              clue which box the changes will land in.
                            */}
                            {activeSubscription && visibleAccountSubscriptions.length > 1 && (
                              <p className="text-[11px] font-bold text-[#071d37] mt-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 inline-block">
                                Managing: <span className="text-[#dfa047]">{activeSubscription.planName || 'Subscription Box'}</span>
                                <span className="text-slate-400 font-semibold"> — pick another plan above to switch.</span>
                              </p>
                            )}
                          </div>

                          {/* Quick action buttons */}
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={handleSaveSubscriptionPlan}
                              disabled={isSavingPlan || isManagedPlanCancelled}
                              className="flex-1 sm:flex-initial bg-[#071d37] hover:bg-[#0c2e56] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                            >
                              {isSavingPlan ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#dfa047]" /> : <CheckCircle2 className="w-3.5 h-3.5 text-[#dfa047]" />}
                              <span>{isSavingPlan ? 'Saving...' : 'Save Plan'}</span>
                            </button>

                            {!isManagedPlanCancelled && (
                              <button
                                type="button"
                                disabled={isSavingPlan}
                                onClick={() => handleTogglePausePlan()}
                                className={`font-bold text-xs uppercase py-2.5 px-3 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                                  managedPlanStatus === 'Active'
                                    ? 'bg-slate-50 border-slate-200 text-[#071d37] hover:bg-slate-100'
                                    : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                                }`}
                              >
                                {managedPlanStatus === 'Active' ? 'Pause' : 'Resume'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Plan Save Feedback Banner */}
                        {planSaveFeedback && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{planSaveFeedback}</span>
                          </div>
                        )}

                        {/* Plan Tier Selector Cards */}
                        <div className="space-y-2.5">
                          <label className="block text-[11px] font-black text-[#071d37] uppercase tracking-wider">
                            Choose Subscription Plan Tier
                          </label>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                            {ACCOUNT_SUB_PLANS.map(tier => {
                              const isSelected = custState.subPlan === tier.id || (!custState.subPlan && tier.id === 'core');
                              return (
                                <div
                                  key={tier.id}
                                  onClick={() => {
                                    if (!isManagedPlanCancelled) {
                                      handlePlanTierChange(tier.id);
                                    }
                                  }}
                                  className={`relative p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                                    isSelected
                                      ? 'bg-amber-50/40 border-[#dfa047] shadow-sm ring-1 ring-[#dfa047]'
                                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                                  } ${isManagedPlanCancelled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  {tier.badge && (
                                    <span className={`absolute -top-2.5 right-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-2xs ${
                                      tier.popular 
                                        ? 'bg-[#dfa047] text-white border-[#dfa047]' 
                                        : 'bg-slate-800 text-white border-slate-700'
                                    }`}>
                                      {tier.badge}
                                    </span>
                                  )}

                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-black text-sm text-[#071d37]">{tier.name}</h4>
                                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#dfa047] fill-amber-100 shrink-0" />}
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-500">{tier.cans} Canisters / box</p>
                                  </div>

                                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-baseline justify-between">
                                    <div>
                                      <span className="text-base sm:text-lg font-black text-[#071d37]">£{tier.price.toFixed(2)}</span>
                                      <span className="text-[10px] text-slate-400 font-bold block">/ delivery</span>
                                    </div>
                                    <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                      {tier.discount}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Promo / Referral Code + Subscribe & Pay */}
                        {!isManagedPlanCancelled && (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
                            <div className="space-y-2">
                              <label className="block text-[11px] font-black text-[#071d37] uppercase tracking-wider">
                                Promo or Referral Code
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={subPromoInput}
                                  onChange={(e) => setSubPromoInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleApplySubPromo();
                                    }
                                  }}
                                  placeholder="Enter code"
                                  disabled={Boolean(subPromoDiscount)}
                                  className="flex-1 text-xs font-semibold border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-[#071d37] bg-white outline-none uppercase disabled:bg-slate-100 disabled:text-slate-500"
                                />
                                {subPromoDiscount ? (
                                  <button
                                    type="button"
                                    onClick={handleRemoveSubPromo}
                                    className="px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
                                  >
                                    Remove
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={handleApplySubPromo}
                                    className="px-4 bg-[#071d37] hover:bg-[#0c2e56] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
                                  >
                                    Apply
                                  </button>
                                )}
                              </div>
                              {subPromoError && (
                                <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  {subPromoError}
                                </p>
                              )}
                              {subPromoSuccess && (
                                <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  {subPromoSuccess}
                                </p>
                              )}

                              {/* Reward still waiting on the customer's pick */}
                              {subRewardNeedsSelection && subPromoDiscount && (
                                <button
                                  onClick={() => openRewardPickerFor(subPromoDiscount, 'sub')}
                                  className="w-full bg-[#dfa047] hover:bg-[#cf9038] text-[#071d37] text-[10.5px] font-black uppercase tracking-wider py-2.5 px-3 rounded-xl cursor-pointer"
                                >
                                  {subPromoDiscount.rewardKind === 'choice'
                                    ? 'Choose your reward'
                                    : `Choose your free can${getOutstandingFreeCanCount(subPromoDiscount) !== 1 ? 's' : ''}`}
                                </button>
                              )}

                              {/* Free cans and gifts this reward includes */}
                              <AppliedRewardLines
                                discount={subPromoDiscount}
                                compact
                                onEditSelection={
                                  subPromoDiscount?.rewardKind === 'free-cans'
                                    ? () => openRewardPickerFor(subPromoDiscount, 'sub')
                                    : undefined
                                }
                              />
                            </div>

                            {/* Order summary */}
                            <div className="space-y-1.5 pt-3 border-t border-slate-200">
                              <div className="flex justify-between text-xs font-semibold text-slate-600">
                                <span>{getAccountPlanLabel(selectedPlanTier.id)}</span>
                                <span className="text-[#071d37] font-bold">£{subPlanPrice.toFixed(2)}</span>
                              </div>

                              {subDiscountValue > 0 && (
                                <div className="flex justify-between text-xs font-semibold text-emerald-700">
                                  <span>Discount ({subPromoDiscount?.title})</span>
                                  <span>-£{subDiscountValue.toFixed(2)}</span>
                                </div>
                              )}

                              <div className="flex justify-between text-xs font-semibold text-slate-600">
                                <span>Delivery</span>
                                <span className={subDeliveryCost === 0 ? 'text-emerald-600 font-black' : 'text-[#071d37] font-bold'}>
                                  {subDeliveryCost === 0 ? 'FREE' : `£${subDeliveryCost.toFixed(2)}`}
                                </span>
                              </div>

                              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                                <span className="text-xs font-black text-[#071d37] uppercase tracking-wider">
                                  Total due today
                                </span>
                                <span className="text-lg font-black text-[#071d37]">£{subFinalTotal.toFixed(2)}</span>
                              </div>

                              <p className="text-[10px] text-slate-400 font-semibold pt-0.5">
                                Renews {(custState.subFrequency || 'Bi-Weekly').toLowerCase()}. Cancel anytime from this page.
                              </p>
                            </div>

                            {subCheckoutError && (
                              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] font-bold text-rose-700 flex items-start gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                                <span>{subCheckoutError}</span>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={handleSubscribeAndPay}
                              disabled={isSubscribing}
                              className="w-full bg-[#dfa047] hover:bg-[#c98d38] disabled:opacity-60 text-white font-black text-xs uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
                            >
                              {isSubscribing ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Redirecting to secure payment…</span>
                                </>
                              ) : (
                                <>
                                  <CreditCard className="w-4 h-4" />
                                  <span>Subscribe &amp; Pay £{subFinalTotal.toFixed(2)}</span>
                                </>
                              )}
                            </button>

                            <p className="text-[10px] text-slate-400 text-center font-semibold">
                              Secure payment via Worldpay. Your card is stored for automatic renewals.
                            </p>
                          </div>
                        )}

                        {/* Frequency & Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Delivery Frequency</label>
                            <select 
                              value={custState.subFrequency || 'Bi-Weekly'}
                              disabled={isManagedPlanCancelled}
                              onChange={(e) => {
                                // A draft until Save Plan, like the tier cards.
                                const newFreq = e.target.value;
                                setCustState((prev: any) => ({ ...prev, subFrequency: newFreq }));
                                setSubActionToast({
                                  type: 'info',
                                  message: `${newFreq} selected. Press Save Plan to apply it.`
                                });
                              }}
                              className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-[#071d37] bg-white outline-none disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer"
                            >
                              {/*
                                A schedule outside the three standard options
                                (the Next Day test plans) is listed as itself, so
                                the dropdown shows the plan's real schedule
                                instead of silently displaying "Weekly".
                              */}
                              {custState.subFrequency && !['Weekly', 'Bi-Weekly', 'One Month'].includes(custState.subFrequency) && (
                                <option value={custState.subFrequency}>Current: {custState.subFrequency}</option>
                              )}
                              <option value="Weekly">Weekly (Every 7 Days)</option>
                              <option value="Bi-Weekly">Bi-Weekly (Every 14 Days - Recommended)</option>
                              <option value="One Month">Every Month (Every 30 Days)</option>
                            </select>
                          </div>

                          <div>
                            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Next Payment</span>
                            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                              <p className="font-extrabold text-xs text-[#071d37]">
                                {isManagedPlanCancelled
                                  ? <span className="text-rose-600">None (Cancelled)</span>
                                  : (managedPlanNextBilling || custState.nextPayment || 'Upcoming renewal')}
                              </p>
                            </div>
                          </div>

                          <div>
                            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Delivery</span>
                            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                              {/*
                                Royal Mail's own state, or nothing. The previous
                                value was the order date plus a fixed offset,
                                which is why a live plan could advertise a
                                delivery date that had already passed.
                              */}
                              <p className="font-extrabold text-xs text-[#071d37]">
                                {isManagedPlanCancelled
                                  ? <span className="text-rose-600">Paused</span>
                                  : (managedPlanDelivery?.label || 'Not dispatched yet')}
                              </p>
                              {!isManagedPlanCancelled && managedPlanDelivery?.detail && (
                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                  {managedPlanDelivery.detail}
                                </p>
                              )}
                              {!isManagedPlanCancelled && !managedPlanDelivery && (
                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                  Tracking appears here once Royal Mail despatches your box.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {!isManagedPlanCancelled && (
                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => openCancelSubscriptionModal(managedSubscription?.id ? String(managedSubscription.id) : null)}
                              className="text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-[11px] uppercase tracking-wider px-3.5 py-2 rounded-xl cursor-pointer text-center transition-colors"
                            >
                              Cancel Subscription Plan
                            </button>
                          </div>
                        )}
                      </div>
                      )}

                      {/*
                        "Your Active Box Lineup" — the editor for the ONE plan
                        being managed. Like the console above it belongs to the
                        manage screen, so it stays closed on the plan list.
                        Everything it writes is scoped to the managed plan's id,
                        so a customer with two plans edits them independently.
                      */}
                      {isManagingSubscription && managedSubscription && (
                        <SubscriptionBoxManager
                          key={String(managedSubscription.id)}
                          subscription={managedSubscription}
                          allProducts={allProducts}
                          capacity={
                            Number(managedSubscription.cansCount) ||
                            ACCOUNT_SUB_PLANS.find(t => t.id === getPlanSlug(managedSubscription.planName))?.cans ||
                            Number(custState.subCansCount) ||
                            6
                          }
                          allowOverCapacity={getPlanSlug(managedSubscription.planName) === 'ultimate'}
                          disabled={['cancelled', 'canceled', 'inactive'].includes(
                            String(managedSubscription.status || '').toLowerCase()
                          )}
                          saving={isSavingBox}
                          onSave={handleSaveSubscriptionBox}
                        />
                      )}
                    </>
                  )}
                </div>
              )}

              {/* TAB 4: LOYALTY REWARDS (Complete rewards list, vouchers, status info) */}
              {activeTab === 'loyalty' && (
                <div className="space-y-6">
                  
                  {/* Loyalty header stats */}
                  <div className="bg-[#071d37] text-white rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg">
                    <div className="absolute left-[-20px] top-[-20px] w-40 h-40 rounded-full bg-white/5 border border-white/5" />
                    
                    <div className="space-y-2 text-center md:text-left">
                      <span className="text-[10px] font-bold bg-[#dfa047] text-[#071d37] py-1 px-3 rounded-full uppercase tracking-wider inline-block">Loyalty Club</span>
                      <h2 className="text-2xl font-black uppercase text-white tracking-wide">Pouch Supply VIP Scheme</h2>
                      <p className="text-slate-300 text-xs max-w-lg leading-relaxed">
                        No complex formulas, math points, or expiration clocks. Simply complete shop orders to trigger direct premium gifts, complimentary deliveries, and discount credit codes.
                      </p>
                    </div>

                    <div className="bg-white/10 border border-white/20 p-5 rounded-3xl text-center min-w-[160px]">
                      <p className="text-[10px] text-slate-300 uppercase font-black tracking-widest">Rewards Unlocked</p>
                      <p className="text-3xl font-black text-[#dfa047] mt-1">{tierInfo.unlockedCount} Gift{tierInfo.unlockedCount !== 1 ? 's' : ''}</p>
                      <span className="text-[9px] text-slate-400 block pt-1">{tierInfo.currentTierName} Status</span>
                    </div>
                  </div>

                  {/* Complete rewards list based on new Tier System */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
                    <div>
                      <h3 className="font-extrabold text-sm text-[#071d37] uppercase tracking-wider">Your Tier Milestone Rewards</h3>
                      <p className="text-slate-500 text-xs mt-0.5">Place orders to progress through tiers and unlock instant vouchers, free cans, free shipping, and merchandise.</p>
                    </div>

                    <div className="space-y-8">
                      {[
                        {
                          id: "bronze",
                          badge: "🥉",
                          name: "Bronze Member",
                          range: "Orders 1–5",
                          intro: "Every new subscriber starts here.",
                          unlockMsg: "Unlock: Silver Member",
                          benefits: [
                            "Bronze Member Badge 🥉",
                            "Automatic Loyalty Tracking 📊"
                          ],
                        },
                        {
                          id: "silver",
                          badge: "🥈",
                          name: "Silver Member",
                          range: "Orders 6–15",
                          intro: "Benefits unlocked upon reaching Order 6.",
                          unlockMsg: "Unlock: Gold Member",
                          benefits: [
                            "Silver Account Badge 🥈",
                            "Early Access to New Flavours 🎁",
                            "Exclusive Subscriber-Only Offers 💰"
                          ],
                        },
                        {
                          id: "gold",
                          badge: "🥇",
                          name: "Gold Member",
                          range: "Orders 16–30",
                          intro: "Elite member status with priority benefits and multiple rewards.",
                          unlockMsg: "Unlock: Platinum Member",
                          benefits: [
                            "Gold Badge 🥇",
                            "Priority Access to Limited Editions ⭐",
                            "Birthday Reward 🎉",
                            "Exclusive Promotions 💰"
                          ],
                        },
                        {
                          id: "platinum",
                          badge: "💎",
                          name: "Platinum Member",
                          range: "31+ Orders",
                          intro: "Unlocks at 31 completed subscription orders.",
                          unlockMsg: "Ultimate Status reached!",
                          benefits: [
                            "Platinum Badge 💎",
                            "Highest Loyalty Multiplier 👑",
                            "First Access to All New Launches 🚀",
                            "Quarterly Surprise Rewards 🎁",
                            "Priority Customer Support ⭐"
                          ],
                        }
                      ].map((tier) => {
                        const isTierActive = (tier.id === "bronze") ||
                          (tier.id === "silver" && ordersCount >= 6) ||
                          (tier.id === "gold" && ordersCount >= 16) ||
                          (tier.id === "platinum" && ordersCount >= 31);

                        return (
                          <div 
                            key={tier.id}
                            className={`border rounded-2xl p-5 space-y-4 transition-all ${
                              isTierActive ? 'bg-slate-50/80 shadow-xs border-slate-200' : 'opacity-70 bg-slate-50/30 border-slate-200/50'
                            }`}
                          >
                            {/* Tier Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{tier.badge}</span>
                                <div>
                                  <h4 className="font-extrabold text-sm text-[#071d37]">{tier.name}</h4>
                                  <span className="text-[10px] text-slate-500 font-bold">{tier.range} — {tier.intro}</span>
                                </div>
                              </div>
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                isTierActive 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                  : 'bg-slate-200 text-slate-600 border border-slate-300'
                              }`}>
                                {isTierActive ? 'Active Tier' : 'Locked'}
                              </span>
                            </div>

                            {/* Benefits row */}
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-black uppercase tracking-wider text-[#071d37]/70">Permanent Tier Benefits Unlocked:</p>
                              <div className="flex flex-wrap gap-2">
                                {tier.benefits.map((b, i) => (
                                  <span key={i} className="text-[10px] font-semibold bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 shadow-3xs">
                                    {b}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Milestones inside Tier */}
                            <div className="space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-wider text-[#071d37]/70">Order Milestones & Gifts:</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {tier.id === "platinum" ? (
                                  <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-200 p-4 rounded-xl space-y-3">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="text-xs font-black text-[#071d37] uppercase tracking-wide">💎 Dynamic Odd-Numbered Rewards Active</p>
                                        <p className="text-[10.5px] text-slate-600 leading-relaxed pt-0.5">Every odd-numbered subscription shipment earns you a reward!</p>
                                      </div>
                                      <span className="text-[9px] bg-violet-100 text-violet-800 border border-violet-200 px-2.5 py-0.5 rounded-full font-bold">Orders 31+ Onwards</span>
                                    </div>

                                    {/* Choice box */}
                                    <div className="bg-white/80 p-3 rounded-lg border border-violet-100 space-y-2">
                                      <p className="text-[10px] font-bold text-slate-700">Odd Order Rewards (Choose ONE at checkout/delivery):</p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-medium text-slate-600">
                                        <span className="flex items-center gap-1 bg-slate-50 p-1.5 rounded border border-slate-100">🥫 3 FREE Cans of choice</span>
                                        <span className="flex items-center gap-1 bg-slate-50 p-1.5 rounded border border-slate-100">💷 £10.00 Store Credit</span>
                                        <span className="flex items-center gap-1 bg-slate-50 p-1.5 rounded border border-slate-100">🚚 Free Priority Fast Delivery</span>
                                        <span className="flex items-center gap-1 bg-slate-50 p-1.5 rounded border border-slate-100">🎁 Exclusive Pouch Supply Merch</span>
                                        <span className="flex items-center gap-1 bg-slate-50 p-1.5 rounded border border-slate-100">🎲 Mystery Custom Reward</span>
                                      </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-1 border-t border-violet-100">
                                      <span className="text-[10px] text-slate-500 font-bold">Your completed orders: <strong>{ordersCount}</strong></span>
                                      {ordersCount < 31 && (
                                        <span className="text-[10px] text-slate-400 font-bold">Complete {31 - ordersCount} more orders to activate</span>
                                      )}
                                    </div>
                                  </div>
                                ) : null}

                                {getMilestonesForTier(tier.id as LoyaltyTierId).map((m) => (
                                  <LoyaltyMilestoneCard
                                    key={m.code}
                                    milestone={m}
                                    ordersCount={ordersCount}
                                    isUsed={usedRewardCodes.has(m.code)}
                                    voucherCode={formatLoyaltyCouponCode(m.code, loggedInCustomer)}
                                    copiedCouponCode={copiedCouponCode}
                                    onCopy={handleCopyCouponCode}
                                    reward={resolveRewardForCode(formatLoyaltyCouponCode(m.code, loggedInCustomer))}
                                    onOpenPicker={(discount) => openRewardPickerFor(discount, 'loyalty')}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Unlock Message Footer */}
                            <div className="text-right">
                              <span className="text-[9px] font-black bg-slate-200/50 text-[#071d37]/80 px-2.5 py-1 rounded-md border border-slate-300/30">
                                {tier.unlockMsg}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Special Personalized VIP Loyalty Discounts */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h3 className="font-extrabold text-sm text-[#071d37] uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="h-4 w-4 text-[#dfa047]" />
                          Personalized VIP Loyalty Perks
                        </h3>
                        <p className="text-slate-500 text-xs mt-0.5">Special loyalty coupons created specifically for your account tier by the administration team.</p>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
                        {customerLoyaltyRewards.length} Perks Active
                      </span>
                    </div>

                    {customerLoyaltyRewards.length === 0 ? (
                      <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 text-center space-y-2">
                        <Award className="h-8 w-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold text-slate-600">No custom administration loyalty perks currently pending.</p>
                        <p className="text-[10px] text-slate-400 max-w-sm mx-auto">Our support team frequently reviews active members and issues secret discount coupons. Keep ordering to trigger custom perks!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {customerLoyaltyRewards.map((reward) => {
                          const formattedPerkCode = formatLoyaltyCouponCode(reward.title, loggedInCustomer);
                          const isCopied = copiedCouponCode === formattedPerkCode;
                          return (
                          <div key={reward.id} className="bg-amber-50/25 border border-amber-200/50 p-4 rounded-2xl flex flex-col justify-between gap-3 relative overflow-hidden transition-all hover:border-amber-300/80">
                            {/* Accent gold corner flare */}
                            <div className="absolute right-[-15px] top-[-15px] w-12 h-12 rounded-full bg-amber-100/50" />
                            
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="p-1 bg-amber-100 text-amber-700 rounded-md">
                                  <Award className="h-3.5 w-3.5" />
                                </span>
                                <h4 className="text-xs font-black uppercase tracking-wider text-[#071d37]">{reward.loyaltyRewardType || 'Custom Loyalty Reward'}</h4>
                              </div>
                              <p className="text-xs font-extrabold text-slate-900 pt-1.5">{reward.title}</p>
                              <p className="text-[10.5px] text-slate-600 leading-relaxed font-semibold">Reward: {reward.loyaltyRewardValue || 'Secret perk active'}</p>
                              
                              {/* Show product or collection constraints if any */}
                              {reward.loyaltyProductSelection === 'Specific products' && (reward.loyaltyProductIds || []).length > 0 && (
                                <p className="text-[9px] bg-white border border-amber-100 text-amber-800 px-2 py-0.5 rounded-md mt-1 inline-block font-bold">
                                  Applies to {(reward.loyaltyProductIds || []).length} select product(s)
                                </p>
                              )}
                              {reward.loyaltyCollectionSelection === 'Specific collections' && (reward.loyaltyCollectionIds || []).length > 0 && (
                                <p className="text-[9px] bg-white border border-amber-100 text-amber-800 px-2 py-0.5 rounded-md mt-1 inline-block font-bold">
                                  Applies to {(reward.loyaltyCollectionIds || []).length} select collection(s)
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-2 bg-white p-2 border border-amber-100 rounded-xl mt-1 z-10 shadow-xs">
                              <div className="min-w-0">
                                <span className="text-[8px] text-slate-400 font-bold uppercase block">Voucher Code</span>
                                <span className="font-mono font-black text-[11px] text-[#071d37] tracking-wider select-all">{formattedPerkCode}</span>
                              </div>
                              <button 
                                onClick={() => handleCopyCouponCode(formattedPerkCode, 'Loyalty perk code')}
                                className="text-[9px] font-black text-amber-800 bg-amber-50 hover:bg-amber-100 py-1.5 px-3 rounded-lg transition-colors cursor-pointer shrink-0 uppercase flex items-center gap-1"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="h-3 w-3 text-amber-800" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3 text-amber-800" />
                                    <span>Copy Code</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 5: REFERRALS (Invite page, stats, pending rewards list) */}
              {activeTab === 'referrals' && (
                <div className="space-y-6">
                  
                  {/* Referral Header */}
                  <div className="bg-[#071d37] text-white rounded-3xl p-8 relative overflow-hidden shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="absolute right-[-10px] top-[-10px] w-36 h-36 rounded-full bg-white/5 border border-white/5" />
                    <div className="space-y-2 text-center md:text-left">
                      <span className="text-[10px] font-bold bg-[#dfa047] text-[#071d37] py-1 px-3 rounded-full uppercase tracking-wider inline-block">Referrals Hub</span>
                      <h2 className="text-2xl font-black uppercase tracking-wide">Invite Friends, Earn Wallet Credit</h2>
                      <p className="text-slate-300 text-xs max-w-lg leading-relaxed">
                        Earn cash credit directly into your Pouch Supply wallet! For every friend who registers and triggers a box subscription, we reward you with £5.00 in direct credits.
                      </p>
                    </div>

                    <div className="bg-white/10 border border-white/20 p-5 rounded-3xl text-center min-w-[160px] shrink-0">
                      <p className="text-[10px] text-slate-300 uppercase font-black tracking-widest">Available Credit</p>
                      <p className="text-3xl font-black text-emerald-400 mt-1">£{(Number(custState.referralCredit || 0)).toFixed(2)}</p>
                      <span className="text-[9px] text-slate-400 block pt-1">{custState.referredCount} Friends Invited</span>
                    </div>
                  </div>

                  {/* Stats & Invite Action Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Link Generator */}
                    <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                      <h3 className="font-extrabold text-sm text-[#071d37] uppercase tracking-wider">Your Referral Credentials</h3>
                      <p className="text-slate-500 text-xs">
                        Copy and distribute this personalized link to family or colleagues.
                      </p>
                      
                      <div className="flex items-center gap-2 bg-[#f4f6f9] p-3 rounded-2xl border border-slate-100">
                        <input 
                          type="text" 
                          readOnly 
                          value={custState.referralCode} 
                          className="bg-transparent text-slate-600 text-xs font-semibold flex-1 outline-none" 
                        />
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(custState.referralCode);
                            alert('Referral link copied to clipboard!');
                          }}
                          className="p-1.5 hover:bg-slate-200 text-[#071d37] rounded-lg transition-colors cursor-pointer"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(custState.referralCode);
                            alert('Copied link!');
                          }}
                          className="flex-1 bg-[#071d37] hover:bg-[#0c2e56] text-white font-bold text-xs uppercase py-2.5 rounded-xl transition-all cursor-pointer text-center"
                        >
                          Copy Invite Code
                        </button>
                      </div>
                    </div>

                    {/* Referrals summary block */}
                    {(() => {
                      const orderedCount = custState.referralsList.filter((r: any) => r.status === 'Ordered').length;
                      const pendingCount = custState.referralsList.filter((r: any) => r.status === 'Registered').length;
                      const earnedCredit = orderedCount * 5;
                      const pendingCredit = pendingCount * 5;
                      return (
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                          <div className="space-y-4">
                            <h3 className="font-extrabold text-sm text-[#071d37] uppercase tracking-wider">Referral Stats</h3>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium">Referred Friends</span>
                                <span className="font-black text-[#071d37]">{custState.referredCount}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium">Credits Earned</span>
                                <span className="font-black text-emerald-700">£{(Number(earnedCredit || 0)).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-medium">Pending Credits</span>
                                <span className="font-black text-amber-600">£{(Number(pendingCredit || 0)).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Referrals table list */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                    <h3 className="font-extrabold text-sm text-[#071d37] uppercase tracking-wider">Invited Friends Log</h3>
                    
                    <div className="space-y-3">
                      {custState.referralsList.map((ref: any, idx: number) => (
                        <div key={idx} className="bg-[#f4f6f9] border border-slate-100 p-4 rounded-2xl flex justify-between items-center text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#071d37]/5 text-[#dfa047] flex items-center justify-center font-bold font-sans text-xs uppercase">
                              {ref.name.substring(0, 2)}
                            </div>
                            <div>
                              <p className="font-black text-[#071d37]">{ref.name}</p>
                              <p className="text-[10px] text-slate-400">Registered on {ref.date}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ref.status === 'Subscribed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                              {ref.status}
                            </span>
                            <span className="font-black text-slate-800">{ref.credit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 6: PAYMENT METHODS */}
              {activeTab === 'payments' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-sm text-[#071d37] uppercase tracking-wider">Saved Payment Cards</h3>
                      <p className="text-slate-400 text-[10.5px]">Manage your saved billing methods for seamless automatic box charges.</p>
                    </div>
                    <button 
                      onClick={() => {
                        const last4 = window.prompt("Enter 4-digit card number (e.g. 4242):", "");
                        if (last4 && last4.trim().length === 4) {
                          const newCard = {
                            id: 'card_' + Date.now(),
                            brand: 'VISA',
                            last4: last4.trim(),
                            exp: '12/28',
                            default: (custState?.savedCards || []).length === 0
                          };
                          const updatedCards = [...(custState?.savedCards || []), newCard];
                          updateCustState({
                            ...custState,
                            savedCards: updatedCards
                          });
                        }
                      }}
                      className="text-xs font-black text-[#dfa047] uppercase tracking-wider flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <PlusCircle className="h-4 w-4" /> Add Card
                    </button>
                  </div>

                  {(!custState?.savedCards || custState.savedCards.length === 0) ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
                      <CreditCard className="h-8 w-8 mx-auto text-slate-300 stroke-1" />
                      <p className="text-xs font-bold text-slate-600">No payment methods saved</p>
                      <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                        Payment cards used during checkout or added here will appear in your wallet for recurring subscriptions and quick refills.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {custState.savedCards.map((card: any) => (
                        <div key={card.id} className="bg-gradient-to-br from-[#071d37] to-[#123157] text-white p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-36 shadow-md">
                          <div className="absolute right-[-10px] bottom-[-10px] w-24 h-24 rounded-full bg-white/5 border border-white/5" />
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold uppercase tracking-widest text-[#dfa047]">{card.brand} CARD</span>
                            <div className="flex items-center gap-2">
                              {card.default && <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold">DEFAULT</span>}
                              <button
                                onClick={() => {
                                  const updatedCards = (custState.savedCards || []).filter((c: any) => c.id !== card.id);
                                  updateCustState({
                                    ...custState,
                                    savedCards: updatedCards
                                  });
                                }}
                                className="text-slate-400 hover:text-red-400 p-1 transition-colors cursor-pointer"
                                title="Remove card"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="font-mono text-base font-bold tracking-widest mt-4">•••• •••• •••• {card.last4}</p>
                          <div className="flex justify-between text-[10px] text-slate-300 font-semibold mt-2">
                            <span>EXPIRY: {card.exp}</span>
                            <span>POUCH SUPPLY CUSTOMER</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: ADDRESSES (Integrated seamlessly with onAddAddress/onRemoveAddress callbacks) */}
              {activeTab === 'addresses' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-sm text-[#071d37] uppercase tracking-wider">Delivery Addresses</h3>
                      <p className="text-slate-400 text-[10.5px]">Configure your shipping points for regular deliveries.</p>
                    </div>
                    <button 
                      onClick={() => setShowAddressModal(true)}
                      className="text-xs font-black text-[#dfa047] uppercase tracking-wider flex items-center gap-1 hover:underline"
                    >
                      <PlusCircle className="h-4 w-4" /> Add Address
                    </button>
                  </div>

                  {loggedInCustomer.addresses.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No addresses saved yet. Click add address above.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {loggedInCustomer.addresses.map((addr, idx) => (
                        <div key={idx} className="bg-[#f4f6f9] border border-slate-150 p-4 rounded-2xl flex flex-col justify-between relative group">
                          <span className="absolute top-3 right-3 bg-white border border-slate-200 text-slate-500 text-[9px] font-black uppercase py-0.5 px-2 rounded-md">
                            {idx === 0 ? 'Primary' : 'Secondary'}
                          </span>
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-[#071d37] uppercase tracking-wide">Destination #{idx + 1}</h4>
                            <p className="text-xs text-slate-600 leading-relaxed font-semibold pr-12">{addr}</p>
                          </div>
                          {idx > 0 && (
                            <button
                              onClick={() => onRemoveAddress(idx)}
                              className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5 mt-4 self-start cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Remove Shipping Address
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7.5: ACCOUNT DETAILS */}
              {activeTab === 'details' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
                  <div className="pb-3 border-b border-slate-100">
                    <h3 className="font-extrabold text-sm text-[#071d37] uppercase tracking-wider">Account Settings</h3>
                    <p className="text-slate-400 text-[10.5px] mt-0.5">Configure your customer profile name, email, and secure access credentials.</p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!editName.trim() || !editEmail.trim()) {
                        alert('Name and Email are required.');
                        return;
                      }
                      if (onUpdateProfile && loggedInCustomer) {
                        const updated: Customer = {
                          ...loggedInCustomer,
                          name: editName.trim(),
                          email: editEmail.trim(),
                        };
                        if (editPassword) {
                          alert('Profile and Password updated successfully!');
                        } else {
                          alert('Profile details updated successfully!');
                        }
                        onUpdateProfile(updated);
                      } else {
                        alert('Profile details updated successfully! (Local state synced)');
                      }
                    }}
                    className="space-y-4 text-xs"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                        <input 
                          type="text" 
                          required 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-[#071d37] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                        <input 
                          type="email" 
                          required 
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-[#071d37] bg-slate-50 text-slate-500 outline-none"
                          disabled 
                        />
                        <span className="text-[9px] text-slate-400 mt-1 block">Contact support if you need to modify your registration email.</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">New Password (leave blank to keep current)</label>
                      <input 
                        type="password" 
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-[#071d37] outline-none"
                      />
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-end">
                      <button 
                        type="submit" 
                        className="bg-[#071d37] hover:bg-[#0c2e56] text-white font-bold text-xs uppercase py-2.5 px-6 rounded-xl cursor-pointer transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 8: HELP & SUPPORT (Interactive Support ticketing form & beautiful FAQ visualizer) */}
              {activeTab === 'support' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Support form */}
                  <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-extrabold text-sm text-[#071d37] uppercase tracking-wider">Contact Specialist Support</h3>
                        <p className="text-slate-400 text-[10.5px]">Send a direct message below. Submissions are delivered straight to our support dispatch inbox.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onNavigate) {
                            onNavigate('pages/contact');
                          } else {
                            window.history.pushState({}, '', '/pages/contact');
                            window.dispatchEvent(new Event('popstate'));
                          }
                        }}
                        className="text-[10px] font-bold text-[#071d37] bg-slate-100 hover:bg-slate-200 py-1.5 px-3 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Mail className="h-3 w-3 text-slate-600" />
                        Main Contact Page
                      </button>
                    </div>

                    {supportStatus && (
                      <div className={`p-4 rounded-2xl text-xs flex items-start gap-2.5 ${
                        supportStatus.type === 'success' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {supportStatus.type === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <p className="leading-relaxed font-medium">{supportStatus.text}</p>
                      </div>
                    )}
                    
                    <form 
                      onSubmit={handleSupportSubmit} 
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Your Name</label>
                          <input type="text" readOnly value={loggedInCustomer.name} className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-xl bg-slate-50 text-slate-600" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                          <input type="email" readOnly value={loggedInCustomer.email} className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-xl bg-slate-50 text-slate-600" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subject Topic</label>
                        <input 
                          type="text" 
                          required 
                          value={supportSubject}
                          onChange={(e) => setSupportSubject(e.target.value)}
                          placeholder="e.g., Subscription flavour swapping / Delivery question" 
                          className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-[#071d37] outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Detailed Message</label>
                        <textarea 
                          required 
                          rows={4} 
                          value={supportMessage}
                          onChange={(e) => setSupportMessage(e.target.value)}
                          placeholder="Tell us how we can help you today..." 
                          className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-[#071d37] outline-none"
                        ></textarea>
                      </div>
                      <button 
                        type="submit" 
                        disabled={supportSubmitting}
                        className="bg-[#071d37] hover:bg-[#0c2e56] disabled:opacity-50 text-white font-bold text-xs uppercase py-2.5 px-6 rounded-xl cursor-pointer flex items-center gap-2 transition-all shadow-xs"
                      >
                        {supportSubmitting ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Sending to Admin...
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            Submit Request
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Compact FAQs */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                    <h3 className="font-extrabold text-sm text-[#071d37] uppercase tracking-wider">Quick FAQs</h3>
                    
                    <div className="space-y-3 text-xs">
                      {[
                        { q: 'Can I swap can flavors?', a: 'Yes! Simply use the Swapper in your Subscriptions tab before shipment day.' },
                        { q: 'How do loyalty gifts work?', a: 'Place regular orders to unlock free delivery coupons or premium extra pouch cans.' },
                        { q: 'How do referrals trigger?', a: 'When friends join using your unique code, a £5.00 wallet discount applies automatically.' }
                      ].map((faq, idx) => (
                        <div key={idx} className="space-y-1 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                          <p className="font-black text-[#071d37]">{faq.q}</p>
                          <p className="text-[10px] text-slate-500 leading-relaxed">{faq.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </motion.div>
          </AnimatePresence>

        </main>
      </div>

      {/* Invoice Detail Modal overlay */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-[#071d37]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-[#f4f6f9] rounded-t-3xl">
              <div>
                <h3 className="font-black text-[#071d37] text-base">Invoice Ref: {selectedOrderDetails.id}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{selectedOrderDetails.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadInvoice(selectedOrderDetails)}
                  disabled={invoiceBusyId === String(selectedOrderDetails.id)}
                  className="text-[10px] font-bold text-white bg-[#071d37] hover:bg-[#dfa047] py-1.5 px-3 rounded-lg cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-60 disabled:cursor-wait"
                >
                  {invoiceBusyId === String(selectedOrderDetails.id)
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Download className="h-3.5 w-3.5" />}
                  Download Invoice
                </button>
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[8px] block mb-1">Customer Details</span>
                  <p className="font-black text-[#071d37]">{selectedOrderDetails.customerName}</p>
                  <p className="text-slate-500">{selectedOrderDetails.customerEmail}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[8px] block mb-1">Delivery Destination</span>
                  <p className="font-semibold text-slate-600 leading-relaxed">{selectedOrderDetails.destination}</p>
                </div>
              </div>

              <div>
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Itemized list</h4>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white">
                  {selectedOrderDetails.items.map((item, idx) => {
                    // A loyalty reward line: a chosen free can, or a gift such as
                    // the mystery box. Its own image is authoritative — a gift has
                    // no catalogue product to look up.
                    const isRewardItem = Boolean((item as any).isRewardItem);
                    const prodImage = isRewardItem
                      ? (item.image || '')
                      : (allProducts.find(p => p.id === item.productId)?.image || item.image || '');
                    const isSubscriptionItem = !isRewardItem && Boolean(
                      (item as any).isSubscription ||
                      item.productId?.startsWith('sub-pack') ||
                      item.productId?.includes('sub-pack') ||
                      item.productTitle?.toLowerCase().includes('subscription') ||
                      item.productTitle?.toLowerCase().includes('plan') ||
                      (item as any).vendor === 'Subscription Pack'
                    );

                    // Resolved the same way as the admin's order view, so both show
                    // the plan the order was bought as. The raw stored planName can
                    // name a different tier on orders the old plan sync rewrote.
                    const subDetails: any = isSubscriptionItem
                      ? extractSubscriptionDetails(selectedOrderDetails, allProducts as any)
                      : (selectedOrderDetails as any).subscriptionDetails;
                    const planSlug = subDetails?.planSlug || getPlanSlug(item.productTitle);
                    const planImg = getPlanImage(subDetails?.planName || item.productTitle, prodImage);
                    const displayTitle = subDetails?.planName || item.productTitle;
                    // Resolved against the live catalogue so each line shows the
                    // exact product and variant the customer selected. The order
                    // itself is passed in, not just its subscription block, so
                    // selections stored on the cart line are found too.
                    const subProducts = isSubscriptionItem
                      ? parseSubscriptionProducts(selectedOrderDetails, item, allProducts as any)
                      : [];

                    if (isRewardItem) {
                      const isGift = (item as any).rewardKind === 'gift';
                      return (
                        <div key={idx} className="p-3.5 bg-emerald-50/40">
                          <div className="flex gap-3 items-start justify-between">
                            <div className="flex gap-2.5 items-start min-w-0">
                              {prodImage ? (
                                <img
                                  src={prodImage}
                                  alt={item.productTitle}
                                  className={`w-12 h-12 rounded-xl bg-white border border-emerald-150 shrink-0 ${isGift ? 'object-contain' : 'object-cover'}`}
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-white border border-emerald-150 shrink-0 flex items-center justify-center">
                                  <Package className="w-5 h-5 text-slate-300" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="text-[8.5px] font-black uppercase tracking-widest text-emerald-700 block">
                                  Loyalty reward{(item as any).rewardCode ? ` · ${(item as any).rewardCode}` : ''}
                                </span>
                                {!isGift && (item as any).vendor && (
                                  <span className="text-[8.5px] font-black uppercase tracking-widest text-[#dfa047] block truncate">
                                    {(item as any).vendor}
                                  </span>
                                )}
                                <p className="font-extrabold text-[#071d37] text-xs leading-tight">{item.productTitle}</p>
                                {!isGift && (item as any).variant && (item as any).variant !== 'Standard' && (
                                  <p className="text-slate-500 text-[10px] mt-0.5 font-bold">{(item as any).variant}</p>
                                )}
                                <p className="text-slate-400 text-[10px] mt-0.5 font-bold">Qty: {item.quantity}</p>
                              </div>
                            </div>
                            <p className="font-extrabold text-emerald-700 text-xs shrink-0">FREE</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={idx} className="p-3.5 space-y-2">
                        <div className="flex gap-3 items-start justify-between">
                          <div className="flex gap-2.5 items-start min-w-0">
                            {isSubscriptionItem ? (
                              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-50 relative shadow-2xs">
                                <img
                                  src={planImg}
                                  alt={displayTitle}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute top-0.5 left-0.5 bg-slate-900/90 text-white text-[7px] font-black px-1 rounded uppercase">
                                  {planSlug}
                                </div>
                              </div>
                            ) : prodImage ? (
                              <img src={prodImage} className="w-12 h-12 object-cover rounded-xl bg-slate-50 border border-slate-100 shrink-0" alt="" referrerPolicy="no-referrer" />
                            ) : null}
                            <div className="min-w-0">
                              <p className="font-extrabold text-[#071d37] text-xs leading-tight">{displayTitle}</p>
                              {isSubscriptionItem && (
                                <span className="inline-block mt-0.5 text-[9px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-150 px-1.5 py-0.5 rounded">
                                  {subDetails?.frequency || (item as any).subscriptionFrequency || 'Bi-Weekly'} ({subDetails?.frequencyDiscount || (item as any).frequencyDiscount || '10%'} OFF)
                                </span>
                              )}
                              <p className="text-slate-400 text-[10px] mt-0.5 font-bold">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="font-extrabold text-slate-850 text-xs">£{(Number((item.price || 0) * (item.quantity || 1))).toFixed(2)}</p>
                        </div>

                        {/* Itemized selection for subscription boxes */}
                        {isSubscriptionItem && subProducts && subProducts.length > 0 && (
                          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-1">
                            <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                              <Package className="w-3 h-3 text-indigo-600" />
                              Selected Box Items ({subProducts.reduce((sum: number, p: any) => sum + (p.quantity || 1), 0)} Cans):
                            </p>
                            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                              {subProducts.map((p: any, pIdx: number) => {
                                const brand = p.brand || p.vendor || '';
                                const name = p.name || p.productTitle || '';
                                const variant = p.variant || p.variantName || '';
                                // The vendor is only prefixed when the exact product
                                // title does not already start with it.
                                const showBrand = Boolean(brand) && !name.toLowerCase().startsWith(brand.toLowerCase());
                                const qty = p.quantity || 1;
                                const formatted = p.formattedLabel || formatSubscriptionItemDisplay(p);
                                return (
                                  <div key={pIdx} className="text-[10px] bg-white border border-slate-200/60 px-2 py-1 rounded flex justify-between items-center text-slate-700 font-medium">
                                    <span className="truncate pr-1">
                                      {showBrand && <strong className="text-slate-900 font-bold">{brand} — </strong>}
                                      <span>{name}</span>
                                      {variant && <span className="text-indigo-600 font-semibold"> — {variant}</span>}
                                    </span>
                                    <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-150 px-1 rounded shrink-0">
                                      Qty:{qty}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-150 pt-4 space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Fulfillment Status</span>
                  <span className={`font-black uppercase text-[10px] px-2.5 py-0.5 rounded-md ${
                    selectedOrderDetails.fulfillmentStatus === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                    selectedOrderDetails.fulfillmentStatus === 'Exchanged' ? 'bg-indigo-100 text-indigo-800' :
                    !isProcessing(selectedOrderDetails.fulfillmentStatus) ? 'bg-emerald-100 text-emerald-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {dispatchLabel(selectedOrderDetails.fulfillmentStatus)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-500">
                  <span>Payment Status</span>
                  <span className={`font-black uppercase text-[10px] px-2.5 py-0.5 rounded-md ${
                    selectedOrderDetails.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                    selectedOrderDetails.paymentStatus === 'Refunded' ? 'bg-purple-100 text-purple-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedOrderDetails.paymentStatus}
                  </span>
                </div>

                {selectedOrderDetails.returnRequest && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-indigo-900 space-y-1">
                    <div className="flex justify-between items-center font-bold text-[11px]">
                      <span>{selectedOrderDetails.returnRequest.type} Request Status</span>
                      <span className="uppercase text-[9px] bg-indigo-600 text-white font-black px-2 py-0.5 rounded">
                        {selectedOrderDetails.returnRequest.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-indigo-700">Reason: {selectedOrderDetails.returnRequest.reason}</p>
                  </div>
                )}

                {(() => {
                  const modalTracking = selectedOrderDetails.trackingNumber || selectedOrderDetails.trackingId || selectedOrderDetails.data?.royalMail?.trackingNumber;
                  if (!modalTracking) return null;
                  return (
                    <div className="bg-rose-50/80 border border-rose-200/90 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded">Royal Mail</span>
                          <span className="text-[10px] font-bold text-rose-900">Tracked Delivery</span>
                        </div>
                        <span className="font-mono text-xs font-black text-rose-950 select-all">{modalTracking}</span>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <a
                          href={`https://www.royalmail.com/track-your-item#/tracking-results/${encodeURIComponent(modalTracking)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center py-1.5 px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs"
                        >
                          <span>Track on RoyalMail.com</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderDetails(null);
                            setTrackerInput(modalTracking);
                            handleTrackOrder(undefined, modalTracking);
                            setActiveTab('orders');
                          }}
                          className="flex-1 text-center py-1.5 px-2.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-900 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                        >
                          <span>View Live Portal Scan</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex justify-between text-slate-500 pt-2">
                  <span>Shipping Delivery ({selectedOrderDetails.deliveryMethod})</span>
                  <span className="font-bold text-emerald-700">Free</span>
                </div>

                <div className="flex justify-between text-slate-800 text-sm font-extrabold pt-2 border-t border-slate-100">
                  <span>Total Amount</span>
                  <span>£{selectedOrderDetails.total.toFixed(2)}</span>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Workflow Modal */}
      {showCancelModal && selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-[#071d37]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp text-left space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-[#071d37] text-sm uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>Cancel Order #{selectedOrderDetails.id}</span>
              </h3>
              <button onClick={() => setShowCancelModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              We can process an immediate cancellation and refund for unfulfilled orders before dispatch.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Reason for Cancellation</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium focus:ring-1 focus:ring-slate-900"
                >
                  <option value="Changed Mind">Changed Mind</option>
                  <option value="Ordered by Mistake">Ordered by Mistake</option>
                  <option value="Delivery Time Too Long">Delivery Time Too Long</option>
                  <option value="Found Better Price">Found Better Price</option>
                  <option value="Other">Other Reason</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Refund Preference</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCancelRefundMethod('original')}
                    className={`p-3 rounded-xl border text-left font-bold transition cursor-pointer ${
                      cancelRefundMethod === 'original'
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-[11px]">Original Payment Card</div>
                    <div className="text-[9.5px] font-normal text-slate-500 mt-0.5">2-3 banking days via Worldpay</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCancelRefundMethod('store_credit')}
                    className={`p-3 rounded-xl border text-left font-bold transition cursor-pointer ${
                      cancelRefundMethod === 'store_credit'
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-[11px]">Instant Store Credit</div>
                    <div className="text-[9.5px] font-normal text-slate-500 mt-0.5">Available for immediate use</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/orders/${selectedOrderDetails.id}/cancel`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        reason: cancelReason,
                        refundMethod: cancelRefundMethod,
                        customerEmail: loggedInCustomer?.email
                      })
                    });
                    const data = await res.json();
                    if (data.success && data.order) {
                      setSelectedOrderDetails(data.order);
                      setShowCancelModal(false);
                      // Update parent state
                      if (onUpdateOrder) {
                        onUpdateOrder(data.order);
                      }
                      alert("Order cancellation processed successfully! Confirmation email sent via Resend.");
                    } else {
                      alert(data.error || "Failed to cancel order.");
                    }
                  } catch (e: any) {
                    alert("Network error processing cancellation: " + e.message);
                  }
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs transition cursor-pointer shadow-sm"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return / Refund / Exchange Request Modal */}
      {showReturnModal && selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-[#071d37]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp text-left space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-[#071d37] text-sm uppercase tracking-wide flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-indigo-600" />
                <span>Return / Exchange Order #{selectedOrderDetails.id}</span>
              </h3>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Request Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Return', 'Refund', 'Exchange'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setReturnType(t)}
                      className={`py-2 px-2 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                        returnType === t
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600 font-black'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Primary Reason</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium focus:ring-1 focus:ring-slate-900"
                >
                  <option value="Damaged or Defective">Damaged or Defective Canister</option>
                  <option value="Wrong Flavor / Strength Delivered">Wrong Flavor or Strength Delivered</option>
                  <option value="Changed Mind / Unwanted Item">Changed Mind / Unwanted Item</option>
                  <option value="Expired Product">Expired Product</option>
                  <option value="Other">Other Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Details & Exchange Notes</label>
                <textarea
                  rows={3}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Describe your issue or specify the replacement flavor/brand for exchange..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium focus:ring-1 focus:ring-slate-900 text-xs"
                />
              </div>

              {returnType !== 'Exchange' && (
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Preferred Refund Method</label>
                  <select
                    value={returnRefundMethod}
                    onChange={(e: any) => setReturnRefundMethod(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="original">Original Payment Card (Worldpay)</option>
                    <option value="store_credit">Instant Store Credit</option>
                  </select>
                </div>
              )}
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/orders/${selectedOrderDetails.id}/return-request`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: returnType,
                        reason: returnReason,
                        exchangeNotes: returnNotes,
                        refundMethod: returnRefundMethod
                      })
                    });
                    const data = await res.json();
                    if (data.success && data.order) {
                      setSelectedOrderDetails(data.order);
                      setShowReturnModal(false);
                      if (onUpdateOrder) {
                        onUpdateOrder(data.order);
                      }
                      alert(`${returnType} request submitted! Notification email dispatched via Resend.`);
                    } else {
                      alert(data.error || "Failed to submit request.");
                    }
                  } catch (e: any) {
                    alert("Network error: " + e.message);
                  }
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs transition cursor-pointer shadow-sm"
              >
                Submit {returnType} Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-[#071d37]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp text-left">
            <h3 className="font-black text-[#071d37] text-sm mb-4 uppercase tracking-wide flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#071d37]" />
              <span>Add Custom Shipping Address</span>
            </h3>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!addrStreet.trim() || !addrCity.trim() || !addrZip.trim()) {
                  return;
                }
                const combined = [
                  addrStreet.trim(),
                  addrApt.trim() ? addrApt.trim() : null,
                  addrCity.trim(),
                  addrState.trim() ? addrState.trim() : null,
                  addrZip.trim(),
                  addrCountry.trim()
                ].filter(Boolean).join(', ');
                
                onAddAddress(combined);
                
                // Reset fields
                setAddrStreet('');
                setAddrApt('');
                setAddrCity('');
                setAddrState('');
                setAddrZip('');
                setAddrCountry('United Kingdom');
                setShowAddressModal(false);
              }} 
              className="space-y-4"
            >
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-500 mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 24 London Road"
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#071d37]"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase text-slate-500 mb-1">Apartment, suite, unit, etc. (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Flat 3B"
                  value={addrApt}
                  onChange={(e) => setAddrApt(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#071d37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-500 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. London"
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#071d37]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-500 mb-1">State / Province</label>
                  <input
                    type="text"
                    placeholder="e.g. Greater London"
                    value={addrState}
                    onChange={(e) => setAddrState(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#071d37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-500 mb-1">ZIP / Postal Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EC1A 1BB"
                    value={addrZip}
                    onChange={(e) => setAddrZip(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#071d37]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-500 mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. United Kingdom"
                    value={addrCountry}
                    onChange={(e) => setAddrCountry(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#071d37]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="bg-slate-100 hover:bg-slate-205 text-slate-600 py-2 px-4 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#071d37] hover:bg-[#0c2e56] text-white py-2 px-4 rounded-xl font-bold cursor-pointer transition-colors shadow-sm"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription Plan Cancellation Modal */}
      {showSubCancelModal && (
        <div className="fixed inset-0 z-50 bg-[#071d37]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp text-left space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-[#071d37] text-sm uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>Cancel Subscription Plan</span>
              </h3>
              <button 
                onClick={closeCancelSubscriptionModal} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/*
              Names the plan being cancelled. With several plans on the account
              an unlabelled dialog gives no clue which one is about to stop.
            */}
            {(() => {
              const target = cancellingSubscriptionId
                ? visibleAccountSubscriptions.find((s: any) => String(s.id) === String(cancellingSubscriptionId))
                : null;
              const others = visibleAccountSubscriptions.filter((s: any) =>
                String(s.id) !== String(cancellingSubscriptionId) &&
                ['active', 'subscribed', 'paused'].includes(String(s.status || '').toLowerCase())
              ).length;
              return (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-1 text-xs text-rose-900">
                  <p className="font-bold">
                    {target
                      ? `Cancel ${target.planName || 'this plan'}?`
                      : 'Are you sure you want to cancel your recurring subscription?'}
                  </p>
                  <p className="text-rose-700 text-[11px]">
                    Its recurring boxes and member discounts will be halted immediately. You can reactivate anytime
                    from your account dashboard.
                  </p>
                  {target && others > 0 && (
                    <p className="text-rose-700 text-[11px] font-semibold">
                      Your other {others === 1 ? 'plan keeps' : `${others} plans keep`} running as normal.
                    </p>
                  )}
                </div>
              );
            })()}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Please let us know why you're cancelling:</label>
                <select
                  value={subCancelReason}
                  onChange={(e) => setSubCancelReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium focus:ring-2 focus:ring-[#071d37] text-xs outline-none"
                >
                  <option value="Taking a break">Taking a temporary break</option>
                  <option value="Too many cans remaining">Too many pouches/cans remaining</option>
                  <option value="Switching flavor/brand preference">Switching flavor or nicotine strength</option>
                  <option value="Financial or budget reasons">Financial / Budget reasons</option>
                  <option value="Found alternative supplier">Found alternative supplier</option>
                  <option value="Other">Other reason</option>
                </select>
              </div>

              {subCancelReason === 'Other' && (
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Additional details (optional):</label>
                  <textarea
                    rows={2}
                    value={subCancelOtherNotes}
                    onChange={(e) => setSubCancelOtherNotes(e.target.value)}
                    placeholder="Tell us what we could do better..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium focus:ring-2 focus:ring-[#071d37] text-xs outline-none"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={closeCancelSubscriptionModal}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Keep Subscription
              </button>
              <button
                type="button"
                disabled={isCancellingSub}
                onClick={handleConfirmCancelSubscription}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-black text-xs transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                {isCancellingSub ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Confirm Cancellation</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reward pickers, shared by the loyalty rewards page and the plan checkout */}
      <RewardChoicePicker
        isOpen={rewardPicker?.mode === 'choice'}
        choices={getRewardChoices(rewardPicker?.discount)}
        rewardLabel={rewardPicker?.discount?.title}
        onChoose={handleConfirmRewardChoice}
        onCancel={() => setRewardPicker(null)}
      />

      <FreeCanPicker
        isOpen={rewardPicker?.mode === 'cans'}
        count={rewardPicker?.discount?.freeCanCount || 1}
        products={allProducts}
        initialSelections={rewardPicker?.discount?.freeCanSelections || []}
        rewardLabel={rewardPicker?.discount?.details}
        onConfirm={handleConfirmRewardCans}
        onCancel={() => setRewardPicker(null)}
      />
    </div>
  );
}
