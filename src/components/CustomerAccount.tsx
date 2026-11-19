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
import { printInvoice, downloadInvoiceFile, getInvoiceNumber } from '../utils/invoice';
import {
  AlertTriangle, Award, Check, ChevronDown, Copy, Download, Heart, LifeBuoy, Loader2, LogOut, MapPin, Package,
  Plus, Send, Share2, ShoppingBag, Trash2, Truck, X
} from 'lucide-react';
import { placeholderImage } from './sections/sectionKit';


// Re-exported from the discount helpers so the account page, the cart and the
// checkout cannot drift apart on what delivery costs or what waives it.
export { FREE_SHIPPING_THRESHOLD, STANDARD_DELIVERY_COST };

// ── Shared presentational pieces (match the storefront theme) ───────────────

const inputCls =
  'w-full border-0 border-b border-line bg-transparent px-0 py-3 text-[15px] text-ink placeholder:text-stone/50 focus:border-ink focus:outline-none focus:ring-0 transition-colors';
const labelCls = 'block text-[10px] font-medium uppercase tracking-[0.22em] text-stone';
const btnSolid =
  'inline-flex items-center justify-center gap-2 bg-ink px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.22em] text-white transition-colors hover:bg-clay disabled:opacity-50 cursor-pointer';
const btnOutline =
  'inline-flex items-center justify-center gap-2 border border-ink px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.22em] text-ink transition-colors hover:bg-ink hover:text-white disabled:opacity-50 cursor-pointer';
const btnLink = 'inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-ink border-b border-ink/30 pb-0.5 hover:border-ink cursor-pointer';

const formatINR = (n: number) => `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

function Notice({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <p className={`flex items-start gap-2 border px-4 py-3 text-[13px] leading-relaxed ${ok ? 'border-line bg-cream text-ink' : 'border-clay/30 bg-blush/60 text-clay-dark'}`}>
      {ok ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-clay" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{children}</span>
    </p>
  );
}

function Panel({ title, action, children, className = '' }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`border border-line bg-white ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-5 md:px-8">
          {title && <h2 className="font-display text-2xl font-normal text-ink">{title}</h2>}
          {action}
        </header>
      )}
      <div className="px-6 py-6 md:px-8 md:py-8">{children}</div>
    </section>
  );
}

function EmptyState({ icon: Icon, title, text, action }: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center py-14 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-line text-clay">
        <Icon className="h-6 w-6" strokeWidth={1.25} />
      </span>
      <h3 className="mt-6 font-display text-2xl text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-stone">{text}</p>
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}

function statusTone(order: Order): { label: string; cls: string } {
  const label = dispatchLabel(order.fulfillmentStatus);
  if (order.fulfillmentStatus === 'Cancelled') return { label, cls: 'bg-blush text-clay-dark' };
  if (isDelivered(order.fulfillmentStatus)) return { label, cls: 'bg-ink text-white' };
  if (isDispatched(order.fulfillmentStatus)) return { label, cls: 'bg-sand text-ink' };
  return { label, cls: 'border border-line text-stone' };
}

function StatusPill({ order }: { order: Order }) {
  const t = statusTone(order);
  return <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${t.cls}`}>{t.label}</span>;
}

function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-6" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onMouseDown={e => e.stopPropagation()}
        className={`font-body text-ink max-h-[92vh] w-full overflow-y-auto bg-white shadow-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-white px-6 py-5">
          <h3 className="font-display text-2xl text-ink">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center text-stone hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

/** Four-step order progress, used on the overview, the tracker and order details. */
function OrderTimeline({ steps }: { steps: { key: string; label: string; status: string }[] }) {
  return (
    <ol className="grid grid-cols-4">
      {steps.map((st, i) => {
        const done = st.status === 'completed';
        const current = st.status === 'current';
        return (
          <li key={st.key} className="relative flex flex-col items-center text-center">
            {i > 0 && <span className={`absolute right-1/2 top-[7px] h-px w-full ${done || current ? 'bg-ink' : 'bg-line'}`} aria-hidden />}
            <span className={`relative z-10 h-[15px] w-[15px] rounded-full border ${done ? 'border-ink bg-ink' : current ? 'border-ink bg-white ring-4 ring-sand' : 'border-line bg-white'}`} />
            <span className={`mt-3 text-[10px] uppercase tracking-[0.18em] ${done || current ? 'text-ink' : 'text-stone/60'}`}>{st.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * One milestone reward on the Rewards tab. Rendered from its definition, so the
 * reward text, voucher code and what the cart applies always agree; rewards
 * that need a pick (a free item, or one option from a menu) open their picker.
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
  const outstanding = getOutstandingFreeCanCount(reward);
  const chosen = reward?.freeCanSelections || [];
  const needsPick = isUnlocked && !isUsed && reward ? rewardNeedsSelection(reward) : false;
  const remaining = milestone.order - ordersCount;

  return (
    <div className={`flex flex-col gap-4 border p-5 transition-colors ${isUnlocked && !isUsed ? 'border-ink/20 bg-white' : 'border-line bg-cream/60'}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="font-display text-sm italic text-clay">{milestone.tier === 'platinum' ? 'Orders 31+' : `Order ${milestone.order}`}</span>
        <span className={`px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.18em] ${!isUnlocked ? 'text-stone/70 border border-line' : isUsed ? 'bg-sand text-stone' : 'bg-ink text-white'}`}>
          {!isUnlocked ? 'Locked' : isUsed ? 'Redeemed' : 'Ready'}
        </span>
      </div>
      <p className={`font-display text-xl leading-snug ${isUnlocked ? 'text-ink' : 'text-stone'}`}>{milestone.reward.replace(/\s*[🥫🎁👕💷🚚🎲🏆]+/gu, '')}</p>

      {isUnlocked && (milestone.gifts || []).length > 0 && (
        <div className="flex items-center gap-3 border border-line bg-cream p-3">
          {(milestone.gifts || []).map(gift => (
            <React.Fragment key={gift.id}>
              <img src={gift.image} alt={gift.label} className="h-11 w-11 shrink-0 object-contain" />
              <div className="min-w-0">
                <p className="text-[13px] text-ink">{gift.label}</p>
                {gift.note && <p className="text-[12px] text-stone">{gift.note}</p>}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {isUnlocked && milestone.kind === 'free-shipping' && (
        <p className="text-[13px] leading-relaxed text-stone">Delivery is free on the order you use this code.</p>
      )}

      {isUnlocked && chosen.length > 0 && (
        <ul className="space-y-2">
          {chosen.map((item, index) => (
            <li key={`${item.productId}-${item.variantId || index}`} className="flex items-center gap-3 border border-line bg-cream p-2">
              {item.image ? <img src={item.image} alt="" className="h-10 w-10 shrink-0 object-cover" /> : <Package className="h-5 w-5 shrink-0 text-stone" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-ink">{item.productTitle}</p>
                {item.variantName && item.variantName !== 'Standard' && <p className="truncate text-[12px] text-stone">{item.variantName}</p>}
              </div>
              <span className="text-[10px] uppercase tracking-[0.18em] text-clay">Free</span>
            </li>
          ))}
        </ul>
      )}

      {isUnlocked ? (
        <div className="mt-auto space-y-3">
          {needsPick && reward && (
            <button type="button" onClick={() => onOpenPicker(reward)} className={`${btnSolid} w-full`}>
              {reward.rewardKind === 'choice' ? 'Choose your reward' : `Choose your free item${outstanding !== 1 ? 's' : ''}`}
            </button>
          )}
          {!needsPick && chosen.length > 0 && reward && (
            <button type="button" onClick={() => onOpenPicker(reward)} className={btnLink}>Change selection</button>
          )}
          <div className="flex items-center justify-between gap-3 border border-dashed border-ink/25 px-3 py-2.5">
            <span className="truncate font-mono text-[13px] tracking-wider text-ink">{voucherCode}</span>
            <button type="button" onClick={() => onCopy(voucherCode, 'Voucher code')} className="flex shrink-0 items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-ink hover:text-clay">
              {isCopied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
            </button>
          </div>
          <p className="text-[12px] text-stone">{isUsed ? 'Already redeemed on an earlier order.' : 'Enter this code in your bag or at checkout.'}</p>
        </div>
      ) : (
        <p className="mt-auto text-[12px] text-stone">{remaining} more order{remaining !== 1 ? 's' : ''} to unlock</p>
      )}
    </div>
  );
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
  const [addrCountry, setAddrCountry] = useState('India');
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


  // Track order in customer portal
  const [trackerInput, setTrackerInput] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackerError, setTrackerError] = useState('');

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
          text: 'Thank you — your message is with our team. We will reply by email within one working day.'
        });
        setSupportSubject('');
        setSupportMessage('');
      } else {
        setSupportStatus({
          type: 'error',
          text: data.error || 'We could not send your message. Please try again in a moment.'
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
        description: "Congratulations! You have reached Platinum Member status 💎! Enjoy priority support, surprise rewards and a reward on every odd-numbered order."
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
          ? "Every member starts at Bronze. Place your first order to start unlocking rewards."
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

    const realReferralCode = loggedInCustomer.referralCode || `REF-${loggedInCustomer.name.trim().split(" ")[0].toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
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
            credit: hasOrdered ? '₹5.00' : 'Pending'
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
            credit: '₹5.00'
          });
        } else {
          const existingRef = dynamicReferrals.find(r => r.email === emailLower);
          if (existingRef && existingRef.status !== 'Ordered') {
            existingRef.status = 'Ordered';
            existingRef.credit = '₹5.00';
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

    // Referral and order details only. Subscription plan state was removed.
    state = {
      ...(state || {}),
      referralCode: realReferralCode,
      referredCount,
      referralCredit: realStoreCredit,
      referralsList,
      ordersCount: orders.filter(o => o.customerEmail && o.customerEmail.toLowerCase() === loggedInCustomer.email.toLowerCase()).length
    };
    for (const legacyKey of ['subPlan', 'subStatus', 'subFrequency', 'subCansCount', 'subPrice', 'nextPayment', 'nextDelivery', 'subItems', 'savedCards']) {
      delete state[legacyKey];
    }

    setCustState(state);
    localStorage.setItem(custKey, JSON.stringify(state));
  }, [loggedInCustomer, custKey, customers, orders]);

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
    const { discount } = rewardPicker;
    saveRewardSelection(discount.title, { freeCanSelections: selections });
    setRewardSelectionVersion(v => v + 1);
    setRewardPicker(null);
  };

  const handleConfirmRewardChoice = (choiceId: string) => {
    if (!rewardPicker) return;
    const { discount, context } = rewardPicker;
    const updated = applyRewardChoice(discount, choiceId);
    saveRewardSelection(updated.title, { rewardChoiceId: choiceId, freeCanSelections: [] });
    setRewardSelectionVersion(v => v + 1);
    // Taking the "free cans" option means there is still a can to pick.
    if (updated.rewardKind === 'free-cans') {
      setRewardPicker({ mode: 'cans', context, discount: updated });
    } else {
      setRewardPicker(null);
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
          body: JSON.stringify({ email: emailInput.toLowerCase().trim(), recaptchaToken: await executeRecaptcha('customer_forgot_password') })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Failed to send password reset request.');
        setSuccessMsg('We have emailed you a reset code. Enter it below with your new password.');
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
            newPassword: passwordInput,
            recaptchaToken: await executeRecaptcha('customer_reset_password')
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
          body: JSON.stringify({ name: nameInput.trim(), email, phone: phoneInput.trim(), password: passwordInput, referredByCode: referredByCodeInput.trim(), recaptchaToken: await executeRecaptcha('customer_signup') })
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
          body: JSON.stringify({ email, password: passwordInput, recaptchaToken: await executeRecaptcha('customer_login') })
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
    const checkId = (customTargetId || trackerInput).trim().toUpperCase();
    if (!checkId) {
      setTrackerError('Please enter an Order ID or Tracking reference.');
      return;
    }
    const found = orders.find(o => 
      o.id.toUpperCase() === checkId || 
      (o.trackingId && o.trackingId.toUpperCase() === checkId) ||
      (o.trackingNumber && o.trackingNumber.toUpperCase() === checkId)
    );
    if (found) {
      // No courier tracking API is connected, so the order's own recorded
      // status, tracking number and history are what is shown.
      setTrackedOrder(found);
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

  // ── State for the redesigned portal ──
  const [editPhone, setEditPhone] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [orderActionMsg, setOrderActionMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [orderActionBusy, setOrderActionBusy] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showGuestTracker, setShowGuestTracker] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);

  useEffect(() => {
    setEditPhone(loggedInCustomer?.phone || '');
  }, [loggedInCustomer?.phone]);

  // Logged Out Screen
  if (!loggedInCustomer) {
    const modeTitle: Record<string, string> = {
      login: 'Welcome back',
      signup: 'Create your account',
      forgot: 'Reset your password',
      reset: 'Choose a new password',
      verify: 'Verify your email'
    };
    const modeIntro: Record<string, string> = {
      login: 'Sign in to track orders, save favourites and use your rewards.',
      signup: 'Join to track orders, save your favourites and unlock member rewards.',
      forgot: 'Enter your email and we will send you a reset code.',
      reset: 'Enter the code from your email and a new password.',
      verify: 'Enter the 6-digit code we sent to your email.'
    };
    const switchMode = (m: typeof authMode) => { setAuthMode(m); setErrorMsg(''); setSuccessMsg(''); };

    return (
      <div className="store min-h-screen bg-cream">
        <div className="grid min-h-[calc(100vh-120px)] grid-cols-1 lg:grid-cols-2">
          {/* Editorial image */}
          <div className="relative hidden lg:block">
            <img src={placeholderImage(2, 1400)} alt="" className="absolute inset-0 h-full w-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-12 text-white">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/80">Member benefits</p>
              <h2 className="mt-4 max-w-md font-display text-5xl font-light leading-[1.05]">Your wardrobe, all in one place.</h2>
              <ul className="mt-8 space-y-3 text-[14px] text-white/85">
                <li className="flex items-center gap-3"><Package className="h-4 w-4" strokeWidth={1.5} /> Track every order and download invoices</li>
                <li className="flex items-center gap-3"><Heart className="h-4 w-4" strokeWidth={1.5} /> Save favourites to your wishlist</li>
                <li className="flex items-center gap-3"><Award className="h-4 w-4" strokeWidth={1.5} /> Unlock rewards as you shop</li>
              </ul>
            </div>
          </div>

          {/* Form */}
          <div className="flex items-center justify-center px-6 py-16 sm:px-12">
            <div className="w-full max-w-md">
              <p className="text-[11px] uppercase tracking-[0.3em] text-clay">My account</p>
              <h1 className="mt-4 font-display text-4xl md:text-5xl font-normal leading-[1.05] text-ink">{modeTitle[authMode]}</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-stone">{modeIntro[authMode]}</p>

              {(authMode === 'login' || authMode === 'signup') && (
                <div className="mt-8 flex border-b border-line">
                  {(['login', 'signup'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => switchMode(m)}
                      className={`-mb-px mr-8 pb-3 text-[12px] uppercase tracking-[0.2em] transition-colors ${authMode === m ? 'border-b border-ink text-ink' : 'text-stone hover:text-ink'}`}
                    >
                      {m === 'login' ? 'Sign in' : 'Create account'}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-6 space-y-4">
                {errorMsg && <Notice ok={false}>{errorMsg}</Notice>}
                {successMsg && <Notice ok>{successMsg}</Notice>}
              </div>

              <form onSubmit={handleLoginSubmit} className="mt-6 space-y-6" noValidate>
                {authMode === 'signup' && (
                  <>
                    <Field label="Full name"><input className={inputCls} value={nameInput} onChange={e => setNameInput(e.target.value)} autoComplete="name" /></Field>
                    <Field label="Mobile number"><input type="tel" className={inputCls} value={phoneInput} onChange={e => setPhoneInput(e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" /></Field>
                  </>
                )}
                <Field label="Email"><input type="email" className={inputCls} value={emailInput} onChange={e => setEmailInput(e.target.value)} autoComplete="email" /></Field>
                {authMode === 'reset' && (
                  <Field label="Reset code"><input className={inputCls} value={resetTokenInput} onChange={e => setResetTokenInput(e.target.value)} placeholder="From your email" /></Field>
                )}
                {authMode === 'verify' && (
                  <Field label="Verification code"><input inputMode="numeric" className={`${inputCls} tracking-[0.4em]`} value={verificationCodeInput} onChange={e => setVerificationCodeInput(e.target.value)} placeholder="000000" maxLength={6} /></Field>
                )}
                {(authMode === 'login' || authMode === 'signup' || authMode === 'reset') && (
                  <Field label={authMode === 'reset' ? 'New password' : 'Password'}>
                    <input type="password" className={inputCls} value={passwordInput} onChange={e => setPasswordInput(e.target.value)} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} />
                  </Field>
                )}
                {(authMode === 'signup' || authMode === 'reset') && (
                  <Field label="Confirm password"><input type="password" className={inputCls} value={confirmPasswordInput} onChange={e => setConfirmPasswordInput(e.target.value)} autoComplete="new-password" /></Field>
                )}
                {authMode === 'signup' && (
                  <Field label="Referral code (optional)"><input className={inputCls} value={referredByCodeInput} onChange={e => setReferredByCodeInput(e.target.value)} placeholder="From a friend" /></Field>
                )}

                {authMode === 'login' && (
                  <div className="flex justify-end">
                    <button type="button" onClick={() => switchMode('forgot')} className="text-[12px] text-stone underline underline-offset-4 hover:text-ink">Forgot password?</button>
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className={`${btnSolid} w-full`}>
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {authMode === 'login' ? 'Sign in' : authMode === 'signup' ? 'Create account' : authMode === 'forgot' ? 'Send reset code' : authMode === 'reset' ? 'Update password' : 'Verify email'}
                </button>
              </form>

              {(authMode === 'login' || authMode === 'signup') && (
                <>
                  <div className="my-6 flex items-center gap-4 text-[11px] uppercase tracking-[0.2em] text-stone">
                    <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
                  </div>
                  <button type="button" onClick={handleDirectGoogleSignIn} disabled={isGoogleLoading} className={`${btnOutline} w-full`}>
                    {isGoogleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1S8.7 5.7 12 5.7c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z"/></svg>
                    )}
                    Continue with Google
                  </button>
                </>
              )}

              {(authMode === 'forgot' || authMode === 'reset' || authMode === 'verify') && (
                <button type="button" onClick={() => switchMode('login')} className={`${btnLink} mt-8`}>Back to sign in</button>
              )}

              {/* Guest order tracking */}
              <div className="mt-12 border-t border-line pt-8">
                {!showGuestTracker ? (
                  <button type="button" onClick={() => setShowGuestTracker(true)} className="flex items-center gap-2 text-[13px] text-stone hover:text-ink">
                    <Truck className="h-4 w-4" strokeWidth={1.5} /> Ordered as a guest? <span className="underline underline-offset-4">Track your order</span>
                  </button>
                ) : (
                  <form onSubmit={handleTrackOrder} className="space-y-4">
                    <Field label="Order number or tracking number">
                      <div className="flex items-end gap-3">
                        <input className={inputCls} value={trackerInput} onChange={e => setTrackerInput(e.target.value)} placeholder="e.g. PS48884" />
                        <button type="submit" className={btnOutline}>Track</button>
                      </div>
                    </Field>
                    {trackerError && <Notice ok={false}>{trackerError}</Notice>}
                    {trackedOrder && (
                      <div className="space-y-5 border border-line bg-white p-5">
                        <div className="flex items-center justify-between">
                          <span className="font-display text-xl text-ink">Order {trackedOrder.id}</span>
                          <StatusPill order={trackedOrder} />
                        </div>
                        <OrderTimeline steps={getTimelineSteps(trackedOrder)} />
                        {(trackedOrder.trackingNumber || trackedOrder.trackingId) && (
                          <p className="text-[13px] text-stone">{trackedOrder.carrier || 'Courier'} · <span className="font-mono text-ink">{trackedOrder.trackingNumber || trackedOrder.trackingId}</span></p>
                        )}
                      </div>
                    )}
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!custState) {
    return (
      <div className="store flex min-h-[60vh] items-center justify-center bg-cream">
        <Loader2 className="h-6 w-6 animate-spin text-stone" />
      </div>
    );
  }

  // ── Signed-in portal ──────────────────────────────────────────────────────
  const firstName = (loggedInCustomer.name || '').trim().split(/\s+/)[0] || 'there';
  const wishlistIds: string[] = Array.isArray(loggedInCustomer.wishlist) ? loggedInCustomer.wishlist.map(String) : [];
  const addresses: string[] = Array.isArray(loggedInCustomer.addresses) ? loggedInCustomer.addresses : [];
  const storeCredit = Number(custState.referralCredit || loggedInCustomer.storeCredit || 0);
  const latestOrder = myOrders[0] || null;

  const tabs: { id: string; label: string }[] = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'orders', label: 'Orders' },
    { id: 'wishlist', label: 'Wishlist' },
    { id: 'loyalty', label: 'Rewards' },
    { id: 'referrals', label: 'Refer a friend' },
    { id: 'addresses', label: 'Addresses' },
    { id: 'details', label: 'Account details' },
    { id: 'support', label: 'Help' }
  ];
  const go = (tab: string) => { setActiveTab(tab); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const orderImage = (item: Order['items'][number]) =>
    (item as any).isRewardItem ? (item.image || '') : (allProducts.find(p => p.id === item.productId)?.image || item.image || '');

  const OrderThumbs = ({ order, max = 4 }: { order: Order; max?: number }) => (
    <div className="flex -space-x-2">
      {order.items.slice(0, max).map((it, i) => {
        const src = orderImage(it);
        return src ? (
          <img key={i} src={src} alt="" className="h-14 w-11 border-2 border-white object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span key={i} className="flex h-14 w-11 items-center justify-center border-2 border-white bg-sand"><Package className="h-4 w-4 text-stone" /></span>
        );
      })}
      {order.items.length > max && (
        <span className="flex h-14 w-11 items-center justify-center border-2 border-white bg-sand text-[11px] text-stone">+{order.items.length - max}</span>
      )}
    </div>
  );

  const openOrder = (order: Order) => { setOrderActionMsg(null); setSelectedOrderDetails(order); };
  const trackOrderNow = (target: string) => { setTrackerInput(target); handleTrackOrder(undefined, target); go('orders'); };

  const tierDefs = [
    { id: 'bronze', name: 'Bronze', range: 'Orders 1–5', from: 0, benefits: ['Member rewards from your first order', 'Order history and easy reorders'] },
    { id: 'silver', name: 'Silver', range: 'Orders 6–15', from: 6, benefits: ['Early access to new arrivals', 'Member-only offers'] },
    { id: 'gold', name: 'Gold', range: 'Orders 16–30', from: 16, benefits: ['Priority access to limited editions', 'Birthday reward', 'Exclusive promotions'] },
    { id: 'platinum', name: 'Platinum', range: '31+ orders', from: 31, benefits: ['A reward on every odd-numbered order', 'Quarterly surprise rewards', 'Priority customer support'] }
  ];

  const supportFaqs = [
    { q: 'Where is my order?', a: 'Open Orders to see the latest status of every order. Once it ships, the courier and tracking number appear there too.' },
    { q: 'How do I return or exchange an item?', a: 'Open the order and choose “Return or exchange”. Unworn items with tags can be returned within 14 days of delivery.' },
    { q: 'How do rewards work?', a: 'Every order moves you towards the next milestone. Unlocked rewards appear under Rewards with a code to use at checkout.' },
    { q: 'Can I change my email address?', a: 'Your email is your sign-in, so it cannot be changed here. Send us a message and we will help.' }
  ];

  const submitCancel = async () => {
    if (!selectedOrderDetails) return;
    setOrderActionBusy(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrderDetails.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason, refundMethod: cancelRefundMethod, customerEmail: loggedInCustomer.email })
      });
      const data = await res.json().catch(() => ({}));
      if (data.success && data.order) {
        setSelectedOrderDetails(data.order);
        onUpdateOrder?.(data.order);
        setShowCancelModal(false);
        setOrderActionMsg({ ok: true, text: 'Your order has been cancelled. A confirmation email is on its way.' });
      } else {
        setOrderActionMsg({ ok: false, text: data.error || 'We could not cancel this order. Please contact us.' });
        setShowCancelModal(false);
      }
    } catch (e: any) {
      setOrderActionMsg({ ok: false, text: 'Network error — please try again.' });
      setShowCancelModal(false);
    } finally {
      setOrderActionBusy(false);
    }
  };

  const submitReturn = async () => {
    if (!selectedOrderDetails) return;
    setOrderActionBusy(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrderDetails.id}/return-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: returnType, reason: returnReason, exchangeNotes: returnNotes, refundMethod: returnRefundMethod })
      });
      const data = await res.json().catch(() => ({}));
      if (data.success && data.order) {
        setSelectedOrderDetails(data.order);
        onUpdateOrder?.(data.order);
        setShowReturnModal(false);
        setOrderActionMsg({ ok: true, text: `Your ${returnType.toLowerCase()} request has been sent. We will email you with the next steps.` });
      } else {
        setOrderActionMsg({ ok: false, text: data.error || 'We could not submit this request. Please contact us.' });
        setShowReturnModal(false);
      }
    } catch {
      setOrderActionMsg({ ok: false, text: 'Network error — please try again.' });
      setShowReturnModal(false);
    } finally {
      setOrderActionBusy(false);
    }
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    if (!editName.trim()) {
      setProfileMsg({ ok: false, text: 'Please enter your name.' });
      return;
    }
    onUpdateProfile?.({ ...loggedInCustomer, name: editName.trim(), phone: editPhone.trim() } as Customer);
    setProfileMsg({ ok: true, text: 'Your details have been saved.' });
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwNew.length < 8) return setPwMsg({ ok: false, text: 'Use at least 8 characters for your new password.' });
    if (pwNew !== pwConfirm) return setPwMsg({ ok: false, text: 'The new passwords do not match.' });
    setPwBusy(true);
    try {
      const res = await fetch('/api/customers/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loggedInCustomer.email, currentPassword: pwCurrent, newPassword: pwNew })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setPwMsg({ ok: true, text: 'Your password has been changed.' });
        setPwCurrent(''); setPwNew(''); setPwConfirm('');
      } else {
        setPwMsg({ ok: false, text: data.error || 'We could not change your password.' });
      }
    } catch {
      setPwMsg({ ok: false, text: 'Network error — please try again.' });
    } finally {
      setPwBusy(false);
    }
  };

  const copyReferral = async () => {
    const code = String(custState.referralCode || '');
    const shareText = `Use my code ${code} when you create an account.`;
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title: 'Join me', text: shareText, url: window.location.origin }); return; } catch { /* fall back to copy */ }
    }
    navigator.clipboard?.writeText(code);
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
  };

  const sd: Order | null = selectedOrderDetails;
  const sdShipping = sd ? Number((sd as any).shippingCost ?? (sd as any).deliveryCost ?? (sd as any).data?.shippingCost ?? NaN) : NaN;
  const sdSubtotal = sd ? Number((sd as any).subtotal ?? (sd as any).data?.subtotal ?? NaN) : NaN;
  const canCancel = !!sd && sd.fulfillmentStatus === 'Unfulfilled' && sd.paymentStatus !== 'Refunded';
  const canReturn = !!sd && isDelivered(sd.fulfillmentStatus) && !sd.returnRequest;

  return (
    <div className="store min-h-screen bg-cream">
      {/* Header */}
      <header className="border-b border-line bg-cream">
        <div className="mx-auto max-w-6xl px-5 pt-10 sm:px-8 md:pt-14">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-clay">My account</p>
              <h1 className="mt-3 font-display text-4xl md:text-6xl font-light leading-none text-ink">Hello, {firstName}</h1>
              <p className="mt-3 text-[14px] text-stone">{loggedInCustomer.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => go('loyalty')} className="inline-flex items-center gap-2 border border-line bg-white px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] text-ink hover:border-ink">
                <Award className="h-3.5 w-3.5 text-clay" strokeWidth={1.5} /> {tierInfo.currentTierName}
              </button>
              <button type="button" onClick={onLogout} className="inline-flex items-center gap-2 px-2 py-2.5 text-[11px] uppercase tracking-[0.2em] text-stone hover:text-ink">
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} /> Sign out
              </button>
            </div>
          </div>
          <nav className="mt-10 -mb-px flex gap-8 overflow-x-auto store-scrollbar-none" aria-label="Account">
            {tabs.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => go(t.id)}
                aria-current={activeTab === t.id ? 'page' : undefined}
                className={`whitespace-nowrap border-b pb-4 text-[12px] uppercase tracking-[0.2em] transition-colors ${activeTab === t.id ? 'border-ink text-ink' : 'border-transparent text-stone hover:text-ink'}`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 md:py-14">
        {/* ── Overview ── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-3">
              {[
                { label: 'Orders placed', value: String(ordersCount), action: () => go('orders') },
                { label: 'Rewards unlocked', value: String(tierInfo.unlockedCount), action: () => go('loyalty') },
                { label: 'Store credit', value: formatINR(storeCredit), action: () => go('referrals') }
              ].map(stat => (
                <button key={stat.label} type="button" onClick={stat.action} className="group bg-white px-6 py-7 text-left transition-colors hover:bg-cream">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-stone">{stat.label}</p>
                  <p className="mt-3 font-display text-4xl text-ink">{stat.value}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <Panel title="Latest order" action={myOrders.length > 1 ? <button type="button" onClick={() => go('orders')} className={btnLink}>All orders</button> : undefined}>
                {latestOrder ? (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-display text-2xl text-ink">Order {latestOrder.id}</p>
                        <p className="mt-1 text-[13px] text-stone">{latestOrder.date} · {latestOrder.items.reduce((n, i) => n + (i.quantity || 1), 0)} item(s) · {formatINR(latestOrder.total)}</p>
                      </div>
                      <StatusPill order={latestOrder} />
                    </div>
                    <OrderThumbs order={latestOrder} max={5} />
                    {latestOrder.fulfillmentStatus !== 'Cancelled' && <OrderTimeline steps={getTimelineSteps(latestOrder)} />}
                    <div className="flex flex-wrap gap-3">
                      <button type="button" onClick={() => openOrder(latestOrder)} className={btnSolid}>View order</button>
                      {(latestOrder.trackingNumber || latestOrder.trackingId) && (
                        <button type="button" onClick={() => trackOrderNow(String(latestOrder.trackingNumber || latestOrder.trackingId))} className={btnOutline}>Track parcel</button>
                      )}
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={ShoppingBag} title="No orders yet" text="When you place an order it will appear here with its status and tracking." action={<button type="button" onClick={() => onNavigate?.('frontend-shop')} className={btnSolid}>Start shopping</button>} />
                )}
              </Panel>

              <div className="space-y-8">
                <Panel title="Membership">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-clay">{tierInfo.currentTierName}</p>
                  <div className="mt-4 h-[3px] w-full bg-line"><div className="h-full bg-ink transition-all" style={{ width: `${Math.min(100, Math.max(4, tierInfo.progressPercentage))}%` }} /></div>
                  <p className="mt-4 text-[14px] leading-relaxed text-stone">
                    {tierInfo.nextTierName
                      ? `${tierInfo.ordersNeededForNext} more order${tierInfo.ordersNeededForNext !== 1 ? 's' : ''} to reach ${tierInfo.nextTierName}.`
                      : 'You have reached our highest tier. Thank you for shopping with us.'}
                  </p>
                  <button type="button" onClick={() => go('loyalty')} className={`${btnLink} mt-5`}>View rewards</button>
                </Panel>
                <div className="grid grid-cols-2 gap-px border border-line bg-line">
                  {[
                    { label: 'Wishlist', sub: `${wishlistIds.length} saved`, icon: Heart, tab: 'wishlist' },
                    { label: 'Addresses', sub: `${addresses.length} saved`, icon: MapPin, tab: 'addresses' },
                    { label: 'Refer a friend', sub: 'Share your code', icon: Share2, tab: 'referrals' },
                    { label: 'Help', sub: 'We reply in a day', icon: LifeBuoy, tab: 'support' }
                  ].map(({ label, sub, icon: Icon, tab }) => (
                    <button key={tab} type="button" onClick={() => go(tab)} className="group flex flex-col items-start gap-3 bg-white p-5 text-left transition-colors hover:bg-cream">
                      <Icon className="h-5 w-5 text-clay" strokeWidth={1.25} />
                      <span>
                        <span className="block text-[12px] uppercase tracking-[0.18em] text-ink">{label}</span>
                        <span className="mt-1 block text-[12px] text-stone">{sub}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Orders ── */}
        {activeTab === 'orders' && (
          <div className="space-y-8">
            <Panel title="Track a parcel">
              <form onSubmit={handleTrackOrder} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1"><Field label="Order number or tracking number"><input className={inputCls} value={trackerInput} onChange={e => setTrackerInput(e.target.value)} placeholder="e.g. PS48884" /></Field></div>
                <button type="submit" className={btnSolid}>Track</button>
              </form>
              {trackerError && <div className="mt-5"><Notice ok={false}>{trackerError}</Notice></div>}
              {trackedOrder && (
                <div className="mt-8 space-y-6 border-t border-line pt-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-display text-2xl text-ink">Order {trackedOrder.id}</p>
                    <StatusPill order={trackedOrder} />
                  </div>
                  <OrderTimeline steps={getTimelineSteps(trackedOrder)} />
                  {(trackedOrder.trackingNumber || trackedOrder.trackingId) && (
                    <p className="text-[14px] text-stone">{trackedOrder.carrier || 'Courier'} · tracking number <span className="font-mono text-ink">{trackedOrder.trackingNumber || trackedOrder.trackingId}</span></p>
                  )}
                  {Array.isArray(trackedOrder.trackingHistory) && trackedOrder.trackingHistory.length > 0 && (
                    <ol className="space-y-4 border-l border-line pl-6">
                      {trackedOrder.trackingHistory.map((h, i) => (
                        <li key={i} className="relative">
                          <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-ink" />
                          <p className="text-[14px] text-ink">{h.status}{h.location ? ` · ${h.location}` : ''}</p>
                          <p className="text-[12px] text-stone">{h.date}{h.description ? ` — ${h.description}` : ''}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </Panel>

            <Panel title={`Your orders${myOrders.length ? ` (${myOrders.length})` : ''}`}>
              {myOrders.length === 0 ? (
                <EmptyState icon={Package} title="No orders yet" text="Your orders will appear here with their status, tracking and invoices." action={<button type="button" onClick={() => onNavigate?.('frontend-shop')} className={btnSolid}>Start shopping</button>} />
              ) : (
                <ul className="divide-y divide-line">
                  {myOrders.map(order => {
                    const tracking = order.trackingNumber || order.trackingId;
                    return (
                      <li key={order.id} className="flex flex-col gap-5 py-6 first:pt-0 last:pb-0 md:flex-row md:items-center">
                        <OrderThumbs order={order} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="font-display text-xl text-ink">Order {order.id}</p>
                            <StatusPill order={order} />
                          </div>
                          <p className="mt-1 text-[13px] text-stone">
                            {order.date} · {order.items.reduce((n, i) => n + (i.quantity || 1), 0)} item(s) · <span className="text-ink">{formatINR(order.total)}</span>
                          </p>
                          {order.returnRequest && <p className="mt-1 text-[12px] text-clay">{order.returnRequest.type} request · {order.returnRequest.status}</p>}
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-3">
                          <button type="button" onClick={() => openOrder(order)} className={btnLink}>View details</button>
                          <button type="button" onClick={() => handleDownloadInvoice(order)} disabled={invoiceBusyId === String(order.id)} className={btnLink}>
                            {invoiceBusyId === String(order.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Invoice
                          </button>
                          {tracking && <button type="button" onClick={() => trackOrderNow(String(tracking))} className={btnLink}><Truck className="h-3.5 w-3.5" /> Track</button>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </div>
        )}

        {/* ── Wishlist ── */}
        {activeTab === 'wishlist' && (
          <Panel title={`Wishlist${wishlistIds.length ? ` (${wishlistIds.length})` : ''}`}>
            {wishlistIds.length === 0 ? (
              <EmptyState icon={Heart} title="Your wishlist is empty" text="Tap the heart on any product to save it here for later." action={<button type="button" onClick={() => onNavigate?.('frontend-shop')} className={btnSolid}>Discover the collection</button>} />
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
                {wishlistIds.map(id => {
                  const prod = allProducts.find(p => String(p.id) === id);
                  if (!prod) {
                    return (
                      <div key={id} className="flex flex-col">
                        <div className="flex aspect-[3/4] items-center justify-center bg-sand text-center text-[12px] text-stone px-4">No longer available</div>
                        <p className="mt-3 text-[14px] text-ink line-clamp-2">Saved item</p>
                        <button type="button" onClick={() => onUpdateWishlist(id, 'remove')} className={`${btnLink} mt-2 self-start`}>Remove</button>
                      </div>
                    );
                  }
                  const onSale = Number(prod.compareAtPrice) > Number(prod.price);
                  return (
                    <div key={id} className="group flex flex-col">
                      <div className="relative aspect-[3/4] overflow-hidden bg-sand">
                        <button type="button" onClick={() => onNavigate?.('product-detail', prod.slug || prod.id)} className="absolute inset-0">
                          {prod.image ? <img src={prod.image} alt={prod.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" referrerPolicy="no-referrer" /> : null}
                        </button>
                        <button type="button" onClick={() => onUpdateWishlist(id, 'remove')} aria-label="Remove from wishlist" className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink hover:bg-white">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {prod.vendor && <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-stone">{prod.vendor}</p>}
                      <p className="mt-1 text-[14px] text-ink line-clamp-2">{prod.title}</p>
                      <p className="mt-1.5 flex items-baseline gap-2 text-[14px]">
                        <span className={onSale ? 'text-clay' : 'text-ink'}>{formatINR(prod.price)}</span>
                        {onSale && <span className="text-[12px] text-stone line-through">{formatINR(prod.compareAtPrice)}</span>}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (Array.isArray(prod.concreteVariants) && prod.concreteVariants.length > 0) { onNavigate?.('product-detail', prod.slug || prod.id); return; }
                          onAddToCart?.(prod, 1);
                          onOpenCart?.();
                        }}
                        className={`${btnOutline} mt-4 w-full !px-3 !py-3`}
                      >
                        {Array.isArray(prod.concreteVariants) && prod.concreteVariants.length > 0 ? 'Choose options' : 'Add to bag'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        )}

        {/* ── Rewards ── */}
        {activeTab === 'loyalty' && (
          <div className="space-y-8">
            <section className="relative overflow-hidden bg-ink px-6 py-10 text-white md:px-12 md:py-14">
              <div className="grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-end">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/70">Member rewards</p>
                  <h2 className="mt-4 font-display text-4xl md:text-5xl font-light leading-[1.05]">{tierInfo.currentTierName}</h2>
                  <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/75">
                    No points to count. Every order moves you towards the next reward — vouchers, free delivery, free items and gifts.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] uppercase tracking-[0.22em] text-white/70">{ordersCount} order{ordersCount !== 1 ? 's' : ''}</span>
                    <span className="font-display text-3xl">{tierInfo.unlockedCount} <span className="text-base text-white/70">rewards unlocked</span></span>
                  </div>
                  <div className="h-[3px] w-full bg-white/20"><div className="h-full bg-white" style={{ width: `${Math.min(100, Math.max(4, tierInfo.progressPercentage))}%` }} /></div>
                  <p className="text-[13px] text-white/70">
                    {tierInfo.nextTierName ? `${tierInfo.ordersNeededForNext} more to ${tierInfo.nextTierName}` : 'Highest tier reached'}
                  </p>
                </div>
              </div>
            </section>

            {tierDefs.map(tier => {
              const active = ordersCount >= tier.from;
              return (
                <Panel
                  key={tier.id}
                  title={<span className="flex items-baseline gap-3">{tier.name}<span className="text-[11px] font-body uppercase tracking-[0.2em] text-stone">{tier.range}</span></span>}
                  action={<span className={`px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${active ? 'bg-ink text-white' : 'border border-line text-stone'}`}>{active ? 'Active' : 'Locked'}</span>}
                >
                  <ul className="mb-6 flex flex-wrap gap-2">
                    {tier.benefits.map(b => (
                      <li key={b} className="border border-line bg-cream px-3 py-1.5 text-[12px] text-ink">{b}</li>
                    ))}
                  </ul>
                  {tier.id === 'platinum' && (
                    <p className="mb-6 border-l-2 border-clay pl-4 text-[14px] leading-relaxed text-stone">
                      From order 31, every odd-numbered order earns a reward of your choice: 3 free items, ₹10 store credit, free delivery, exclusive merchandise or a mystery reward.
                    </p>
                  )}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {getMilestonesForTier(tier.id as LoyaltyTierId).map(m => (
                      <LoyaltyMilestoneCard
                        key={m.code}
                        milestone={m}
                        ordersCount={ordersCount}
                        isUsed={usedRewardCodes.has(m.code)}
                        voucherCode={formatLoyaltyCouponCode(m.code, loggedInCustomer)}
                        copiedCouponCode={copiedCouponCode}
                        onCopy={handleCopyCouponCode}
                        reward={resolveRewardForCode(formatLoyaltyCouponCode(m.code, loggedInCustomer))}
                        onOpenPicker={discount => openRewardPickerFor(discount, 'loyalty')}
                      />
                    ))}
                  </div>
                </Panel>
              );
            })}

            {customerLoyaltyRewards.length > 0 && (
              <Panel title="Personal offers">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {customerLoyaltyRewards.map(reward => {
                    const code = formatLoyaltyCouponCode(reward.title, loggedInCustomer);
                    return (
                      <div key={reward.id} className="flex flex-col gap-4 border border-line bg-cream p-5">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-clay">{reward.loyaltyRewardType || 'Member offer'}</p>
                        <p className="font-display text-xl text-ink">{reward.loyaltyRewardValue || reward.title}</p>
                        <div className="mt-auto flex items-center justify-between gap-3 border border-dashed border-ink/25 bg-white px-3 py-2.5">
                          <span className="truncate font-mono text-[13px] tracking-wider text-ink">{code}</span>
                          <button type="button" onClick={() => handleCopyCouponCode(code, 'Offer code')} className="flex shrink-0 items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-ink hover:text-clay">
                            {copiedCouponCode === code ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}
          </div>
        )}

        {/* ── Refer a friend ── */}
        {activeTab === 'referrals' && (
          <div className="space-y-8">
            <section className="grid grid-cols-1 border border-line bg-white md:grid-cols-2">
              <div className="relative hidden min-h-[320px] md:block">
                <img src={placeholderImage(5, 1000)} alt="" className="absolute inset-0 h-full w-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex flex-col justify-center gap-6 px-6 py-10 md:px-12">
                <p className="text-[11px] uppercase tracking-[0.3em] text-clay">Refer a friend</p>
                <h2 className="font-display text-4xl font-light leading-[1.05] text-ink">Share the wardrobe, earn credit</h2>
                <p className="text-[15px] leading-relaxed text-stone">
                  Give friends your code to use when they create an account. When they place their first order, you receive ₹5 store credit.
                </p>
                <div className="flex items-center justify-between gap-4 border border-dashed border-ink/30 px-4 py-3">
                  <span className="font-mono text-lg tracking-[0.15em] text-ink">{custState.referralCode}</span>
                  <button type="button" onClick={copyReferral} className="flex shrink-0 items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-ink hover:text-clay">
                    {referralCopied ? <><Check className="h-4 w-4" /> Copied</> : <><Share2 className="h-4 w-4" /> Share</>}
                  </button>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2">
              <div className="bg-white px-6 py-7"><p className="text-[10px] uppercase tracking-[0.22em] text-stone">Friends referred</p><p className="mt-3 font-display text-4xl text-ink">{custState.referredCount || 0}</p></div>
              <div className="bg-white px-6 py-7"><p className="text-[10px] uppercase tracking-[0.22em] text-stone">Store credit available</p><p className="mt-3 font-display text-4xl text-ink">{formatINR(storeCredit)}</p></div>
            </div>

            <Panel title="Your referrals">
              {(custState.referralsList || []).length === 0 ? (
                <EmptyState icon={Share2} title="No referrals yet" text="When a friend signs up with your code, they will appear here." />
              ) : (
                <ul className="divide-y divide-line">
                  {(custState.referralsList || []).map((r: any, i: number) => (
                    <li key={i} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-[15px] text-ink">{r.name}</p>
                        <p className="text-[12px] text-stone">{r.date}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-[10px] uppercase tracking-[0.18em] ${r.status === 'Ordered' ? 'text-ink' : 'text-stone'}`}>{r.status === 'Ordered' ? 'Ordered' : 'Signed up'}</p>
                        <p className="text-[13px] text-clay">{r.credit === 'Pending' ? 'Credit pending' : `+${r.credit}`}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        )}

        {/* ── Addresses ── */}
        {activeTab === 'addresses' && (
          <Panel title="Saved addresses" action={<button type="button" onClick={() => setShowAddressModal(true)} className={btnLink}><Plus className="h-3.5 w-3.5" /> Add address</button>}>
            {addresses.length === 0 ? (
              <EmptyState icon={MapPin} title="No saved addresses" text="Save an address to check out faster next time." action={<button type="button" onClick={() => setShowAddressModal(true)} className={btnSolid}>Add an address</button>} />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {addresses.map((addr, idx) => (
                  <div key={idx} className="flex flex-col justify-between gap-6 border border-line bg-cream p-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-clay">{idx === 0 ? 'Default address' : `Address ${idx + 1}`}</p>
                      <p className="mt-3 text-[14px] leading-relaxed text-ink">{addr}</p>
                    </div>
                    <button type="button" onClick={() => onRemoveAddress(idx)} className={`${btnLink} self-start`}><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => setShowAddressModal(true)} className="flex min-h-[160px] flex-col items-center justify-center gap-3 border border-dashed border-line text-stone transition-colors hover:border-ink hover:text-ink">
                  <Plus className="h-5 w-5" strokeWidth={1.25} />
                  <span className="text-[11px] uppercase tracking-[0.2em]">Add address</span>
                </button>
              </div>
            )}
          </Panel>
        )}

        {/* ── Account details ── */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Panel title="Personal details">
              <form onSubmit={saveProfile} className="space-y-6">
                <Field label="Full name"><input className={inputCls} value={editName} onChange={e => setEditName(e.target.value)} autoComplete="name" /></Field>
                <Field label="Mobile number"><input type="tel" className={inputCls} value={editPhone} onChange={e => setEditPhone(e.target.value)} autoComplete="tel" /></Field>
                <Field label="Email">
                  <input className={`${inputCls} text-stone`} value={loggedInCustomer.email} readOnly />
                </Field>
                <p className="-mt-3 text-[12px] text-stone">Your email is your sign-in and cannot be changed here.</p>
                {profileMsg && <Notice ok={profileMsg.ok}>{profileMsg.text}</Notice>}
                <button type="submit" className={btnSolid}>Save details</button>
              </form>
            </Panel>
            <Panel title="Change password">
              <form onSubmit={changePassword} className="space-y-6">
                <Field label="Current password"><input type="password" className={inputCls} value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} autoComplete="current-password" /></Field>
                <Field label="New password"><input type="password" className={inputCls} value={pwNew} onChange={e => setPwNew(e.target.value)} autoComplete="new-password" /></Field>
                <Field label="Confirm new password"><input type="password" className={inputCls} value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} autoComplete="new-password" /></Field>
                {pwMsg && <Notice ok={pwMsg.ok}>{pwMsg.text}</Notice>}
                <button type="submit" disabled={pwBusy} className={btnOutline}>{pwBusy && <Loader2 className="h-4 w-4 animate-spin" />} Update password</button>
              </form>
            </Panel>
          </div>
        )}

        {/* ── Help ── */}
        {activeTab === 'support' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Panel title="Send us a message">
              <p className="-mt-2 mb-6 text-[14px] leading-relaxed text-stone">We usually reply within one working day, to {loggedInCustomer.email}.</p>
              <form onSubmit={handleSupportSubmit} className="space-y-6">
                <Field label="Subject"><input className={inputCls} value={supportSubject} onChange={e => setSupportSubject(e.target.value)} placeholder="Order, sizing, returns…" /></Field>
                <Field label="Message"><textarea rows={5} required className={`${inputCls} resize-none`} value={supportMessage} onChange={e => setSupportMessage(e.target.value)} placeholder="How can we help?" /></Field>
                {supportStatus && <Notice ok={supportStatus.type === 'success'}>{supportStatus.text}</Notice>}
                <button type="submit" disabled={supportSubmitting} className={btnSolid}>
                  {supportSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {supportSubmitting ? 'Sending…' : 'Send message'}
                </button>
              </form>
            </Panel>
            <Panel title="Common questions">
              <div className="-mt-2 border-t border-line">
                {supportFaqs.map((f, i) => {
                  const open = openFaq === i;
                  return (
                    <div key={i} className="border-b border-line">
                      <button type="button" onClick={() => setOpenFaq(open ? null : i)} aria-expanded={open} className="flex w-full items-center justify-between gap-4 py-4 text-left">
                        <span className="font-display text-lg text-ink">{f.q}</span>
                        {open ? <ChevronDown className="h-4 w-4 shrink-0 rotate-180 text-ink transition-transform" /> : <ChevronDown className="h-4 w-4 shrink-0 text-stone transition-transform" />}
                      </button>
                      {open && <p className="pb-5 text-[14px] leading-relaxed text-stone">{f.a}</p>}
                    </div>
                  );
                })}
              </div>
              <button type="button" onClick={() => onNavigate?.('pages/contact')} className={`${btnLink} mt-6`}>Contact page</button>
            </Panel>
          </div>
        )}
      </main>

      {/* ── Order details ── */}
      <Modal open={!!sd} onClose={() => setSelectedOrderDetails(null)} title={sd ? `Order ${sd.id}` : ''} wide>
        {sd && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill order={sd} />
                {sd.paymentStatus && <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Payment · {sd.paymentStatus}</span>}
              </div>
              <span className="text-[13px] text-stone">{sd.date}</span>
            </div>

            {orderActionMsg && <Notice ok={orderActionMsg.ok}>{orderActionMsg.text}</Notice>}
            {sd.fulfillmentStatus !== 'Cancelled' && <OrderTimeline steps={getTimelineSteps(sd)} />}

            <ul className="divide-y divide-line border-y border-line">
              {sd.items.map((item, idx) => {
                const isReward = Boolean((item as any).isRewardItem);
                const isSub = !isReward && Boolean((item as any).isSubscription || item.productId?.includes('sub-pack') || (item as any).vendor === 'Subscription Pack');
                const subDetails: any = isSub ? extractSubscriptionDetails(sd, allProducts as any) : null;
                const subProducts: any[] = isSub ? parseSubscriptionProducts(sd, item, allProducts as any) : [];
                const title = subDetails?.planName || item.productTitle;
                const src = isSub ? getPlanImage(subDetails?.planName || item.productTitle, orderImage(item)) : orderImage(item);
                const variant = (item as any).variant || (item as any).variantName;
                return (
                  <li key={idx} className="flex gap-4 py-4">
                    {src ? <img src={src} alt="" className="h-20 w-16 shrink-0 object-cover" referrerPolicy="no-referrer" /> : <span className="flex h-20 w-16 shrink-0 items-center justify-center bg-sand"><Package className="h-5 w-5 text-stone" /></span>}
                    <div className="min-w-0 flex-1">
                      {isReward && <p className="text-[10px] uppercase tracking-[0.2em] text-clay">Reward{(item as any).rewardCode ? ` · ${(item as any).rewardCode}` : ''}</p>}
                      <p className="text-[15px] text-ink">{title}</p>
                      {variant && variant !== 'Standard' && <p className="text-[13px] text-stone">{variant}</p>}
                      <p className="text-[13px] text-stone">Qty {item.quantity}</p>
                      {subProducts.length > 0 && (
                        <ul className="mt-2 space-y-0.5 text-[12px] text-stone">
                          {subProducts.map((p: any, i: number) => (
                            <li key={i}>{p.formattedLabel || formatSubscriptionItemDisplay(p)}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <p className="shrink-0 text-[15px] text-ink">{isReward ? 'Free' : formatINR((item.price || 0) * (item.quantity || 1))}</p>
                  </li>
                );
              })}
            </ul>

            <dl className="space-y-2.5 text-[14px]">
              {Number.isFinite(sdSubtotal) && (
                <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd className="text-ink">{formatINR(sdSubtotal)}</dd></div>
              )}
              {sd.discountApplied?.title && (
                <div className="flex justify-between"><dt className="text-stone">Discount</dt><dd className="text-clay">{sd.discountApplied.title}</dd></div>
              )}
              {Number(sd.storeCreditApplied) > 0 && (
                <div className="flex justify-between"><dt className="text-stone">Store credit</dt><dd className="text-clay">−{formatINR(Number(sd.storeCreditApplied))}</dd></div>
              )}
              <div className="flex justify-between">
                <dt className="text-stone">Delivery{sd.deliveryMethod ? ` · ${sd.deliveryMethod}` : ''}</dt>
                <dd className="text-ink">{Number.isFinite(sdShipping) ? (sdShipping === 0 ? 'Free' : formatINR(sdShipping)) : '—'}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-[16px]"><dt className="text-ink">Total</dt><dd className="font-display text-2xl text-ink">{formatINR(sd.total)}</dd></div>
            </dl>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="bg-cream p-4">
                <p className={labelCls}>Delivering to</p>
                <p className="mt-2 text-[14px] leading-relaxed text-ink">{sd.customerName}</p>
                <p className="text-[14px] leading-relaxed text-stone">{sd.destination}</p>
              </div>
              <div className="bg-cream p-4">
                <p className={labelCls}>Tracking</p>
                {sd.trackingNumber || sd.trackingId ? (
                  <>
                    <p className="mt-2 text-[14px] text-ink">{sd.carrier || 'Courier'}</p>
                    <p className="font-mono text-[13px] text-stone">{sd.trackingNumber || sd.trackingId}</p>
                  </>
                ) : (
                  <p className="mt-2 text-[14px] text-stone">Added when your order ships.</p>
                )}
              </div>
            </div>

            {sd.returnRequest && (
              <div className="border-l-2 border-clay bg-cream p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-clay">{sd.returnRequest.type} request · {sd.returnRequest.status}</p>
                <p className="mt-1 text-[14px] text-stone">Reason: {sd.returnRequest.reason}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 border-t border-line pt-6">
              <button type="button" onClick={() => handleDownloadInvoice(sd)} disabled={invoiceBusyId === String(sd.id)} className={btnSolid}>
                {invoiceBusyId === String(sd.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Invoice
              </button>
              {(sd.trackingNumber || sd.trackingId) && (
                <button type="button" onClick={() => { const t = String(sd.trackingNumber || sd.trackingId); setSelectedOrderDetails(null); trackOrderNow(t); }} className={btnOutline}>Track parcel</button>
              )}
              {canReturn && <button type="button" onClick={() => setShowReturnModal(true)} className={btnOutline}>Return or exchange</button>}
              {canCancel && <button type="button" onClick={() => setShowCancelModal(true)} className="ml-auto text-[11px] uppercase tracking-[0.2em] text-clay underline underline-offset-4">Cancel order</button>}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Cancel order ── */}
      <Modal open={showCancelModal && !!sd} onClose={() => setShowCancelModal(false)} title="Cancel this order?">
        <div className="space-y-6">
          <p className="text-[14px] leading-relaxed text-stone">Orders can be cancelled until they are dispatched. Your refund is processed as soon as you confirm.</p>
          <Field label="Reason">
            <select value={cancelReason} onChange={e => setCancelReason(e.target.value)} className={`${inputCls} cursor-pointer`}>
              {['Changed Mind', 'Ordered by Mistake', 'Delivery Time Too Long', 'Found Better Price', 'Other'].map(r => <option key={r} value={r}>{r === 'Changed Mind' ? 'Changed my mind' : r === 'Other' ? 'Another reason' : r}</option>)}
            </select>
          </Field>
          <div>
            <p className={labelCls}>Refund to</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {([['original', 'Original payment method', '5–7 working days'], ['store_credit', 'Store credit', 'Available immediately']] as const).map(([v, t, d]) => (
                <button key={v} type="button" onClick={() => setCancelRefundMethod(v)} className={`border p-4 text-left transition-colors ${cancelRefundMethod === v ? 'border-ink bg-cream' : 'border-line hover:border-ink/40'}`}>
                  <span className="block text-[14px] text-ink">{t}</span>
                  <span className="mt-1 block text-[12px] text-stone">{d}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCancelModal(false)} className={btnOutline}>Keep order</button>
            <button type="button" onClick={submitCancel} disabled={orderActionBusy} className={btnSolid}>{orderActionBusy && <Loader2 className="h-4 w-4 animate-spin" />} Cancel order</button>
          </div>
        </div>
      </Modal>

      {/* ── Return / exchange ── */}
      <Modal open={showReturnModal && !!sd} onClose={() => setShowReturnModal(false)} title="Return or exchange">
        <div className="space-y-6">
          <div>
            <p className={labelCls}>What would you like?</p>
            <div className="mt-3 flex border-b border-line">
              {(['Return', 'Refund', 'Exchange'] as const).map(t => (
                <button key={t} type="button" onClick={() => setReturnType(t)} className={`-mb-px mr-8 pb-3 text-[12px] uppercase tracking-[0.2em] ${returnType === t ? 'border-b border-ink text-ink' : 'text-stone'}`}>{t}</button>
              ))}
            </div>
          </div>
          <Field label="Reason">
            <select value={returnReason} onChange={e => setReturnReason(e.target.value)} className={`${inputCls} cursor-pointer`}>
              {['Damaged or Defective', 'Wrong Item Delivered', 'Size or fit', 'Not as described', 'Changed my mind'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label={returnType === 'Exchange' ? 'What would you like instead?' : 'Anything we should know? (optional)'}>
            <textarea rows={3} className={`${inputCls} resize-none`} value={returnNotes} onChange={e => setReturnNotes(e.target.value)} placeholder={returnType === 'Exchange' ? 'e.g. The same dress in size M' : ''} />
          </Field>
          {returnType !== 'Exchange' && (
            <div>
              <p className={labelCls}>Refund to</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {([['original', 'Original payment method', '5–7 working days after we receive it'], ['store_credit', 'Store credit', 'As soon as we receive it']] as const).map(([v, t, d]) => (
                  <button key={v} type="button" onClick={() => setReturnRefundMethod(v)} className={`border p-4 text-left transition-colors ${returnRefundMethod === v ? 'border-ink bg-cream' : 'border-line hover:border-ink/40'}`}>
                    <span className="block text-[14px] text-ink">{t}</span>
                    <span className="mt-1 block text-[12px] text-stone">{d}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowReturnModal(false)} className={btnOutline}>Back</button>
            <button type="button" onClick={submitReturn} disabled={orderActionBusy} className={btnSolid}>{orderActionBusy && <Loader2 className="h-4 w-4 animate-spin" />} Send request</button>
          </div>
        </div>
      </Modal>

      {/* ── Add address ── */}
      <Modal open={showAddressModal} onClose={() => setShowAddressModal(false)} title="Add an address">
        <form
          onSubmit={e => {
            e.preventDefault();
            if (!addrStreet.trim() || !addrCity.trim() || !addrZip.trim()) return;
            const combined = [addrStreet.trim(), addrApt.trim() || null, addrCity.trim(), addrState.trim() || null, addrZip.trim(), addrCountry.trim()].filter(Boolean).join(', ');
            onAddAddress(combined);
            setAddrStreet(''); setAddrApt(''); setAddrCity(''); setAddrState(''); setAddrZip(''); setAddrCountry('India');
            setShowAddressModal(false);
          }}
          className="space-y-6"
        >
          <Field label="Address *"><input required className={inputCls} value={addrStreet} onChange={e => setAddrStreet(e.target.value)} placeholder="House number and street" autoComplete="address-line1" /></Field>
          <Field label="Apartment, floor, landmark"><input className={inputCls} value={addrApt} onChange={e => setAddrApt(e.target.value)} autoComplete="address-line2" /></Field>
          <div className="grid grid-cols-2 gap-6">
            <Field label="City *"><input required className={inputCls} value={addrCity} onChange={e => setAddrCity(e.target.value)} autoComplete="address-level2" /></Field>
            <Field label="State"><input className={inputCls} value={addrState} onChange={e => setAddrState(e.target.value)} autoComplete="address-level1" /></Field>
            <Field label="PIN code *"><input required inputMode="numeric" className={inputCls} value={addrZip} onChange={e => setAddrZip(e.target.value)} autoComplete="postal-code" /></Field>
            <Field label="Country"><input className={inputCls} value={addrCountry} onChange={e => setAddrCountry(e.target.value)} autoComplete="country-name" /></Field>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAddressModal(false)} className={btnOutline}>Cancel</button>
            <button type="submit" className={btnSolid}>Save address</button>
          </div>
        </form>
      </Modal>

      {/* Reward pickers */}
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
