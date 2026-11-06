// CheckoutView.tsx
import React, { useState, useEffect } from 'react';
import { CartItem, Discount, Customer, Order, Product } from '../types';
import { 
  ShieldCheck, ArrowLeft, CreditCard, Lock, Terminal, 
  CheckCircle, AlertTriangle, AlertCircle, RefreshCw, 
  Truck, ShoppingCart, UserCheck, Check, X, Loader2,
  Clock, ExternalLink, Repeat, User
} from 'lucide-react';
import AgeGate, { AgeGateHandle } from './AgeGate';
import { calculateDiscountAmount, calculateVolumePrice } from '../utils';
import {
  resolveDiscountCode,
  resolveDeliveryCost,
  rewardNeedsSelection,
  getRewardChoices,
  applyRewardChoice,
  getOutstandingFreeCanCount,
  isFreeShippingReward,
  STANDARD_DELIVERY_COST
} from '../utils/discountUtils';
import { buildOrderItems, getRewardLines, hydrateRewardSelection } from '../utils/rewardLines';
import { saveRewardSelection } from '../utils/rewardSelectionStore';
import FreeCanPicker from './FreeCanPicker';
import { RewardChoicePicker, AppliedRewardLines } from './RewardSelection';
import { trackStartedCheckout, trackOrderCompleted, trackCheckoutFailed } from '../utils/klaviyo';
import {
  INDIA_COUNTRY_NAME,
  INDIA_STATES,
  normalizeIndianPhone,
  normalizePincode,
  validateIndiaAddress
} from '../utils/indiaValidation';

/** Razorpay Checkout is loaded on demand from Razorpay's own CDN (Razorpay requires this; it cannot be bundled). */
function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);
  return new Promise(resolve => {
    const existing = document.querySelector('script[data-razorpay-checkout]') as HTMLScriptElement | null;
    const script = existing || document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.setAttribute('data-razorpay-checkout', 'true');
    script.onload = () => resolve(Boolean((window as any).Razorpay));
    script.onerror = () => resolve(false);
    if (!existing) document.body.appendChild(script);
  });
}

function newCheckoutKey(): string {
  try {
    return crypto.randomUUID().replace(/-/g, '');
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  }
}

function hasCurrentAgeApproval(): boolean {
  if (typeof window === 'undefined') return false;
  const approved = window.localStorage.getItem('agechecked-approved') === 'true' ||
    window.localStorage.getItem('ageVerified') === 'true';
  const agecheckId = window.localStorage.getItem('agechecked-id');
  const verifiedAt = Date.parse(window.localStorage.getItem('agechecked-verified-at') || '');
  return approved && Boolean(agecheckId) && Number.isFinite(verifiedAt) && Date.now() - verifiedAt <= 24 * 60 * 60 * 1000;
}

interface CheckoutViewProps {
  cartItems: CartItem[];
  discountApplied: Discount | null;
  totalAmount: number;
  loggedInCustomer: Customer | null;
  onNavigate: (tab: string) => void;
  onCompleteCheckout: (paymentDetails: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    address: string;
    total: number;
    discountApplied: Discount | null;
    items: { productId: string; productTitle: string; price: number; quantity: number; image?: string; }[];
    gatewayTxId: string;
    gatewayAuthCode: string;
    cardBrand: string;
    storeCreditApplied?: number;
    paymentMethod?: string;
  }) => void;
  activeDiscounts?: Discount[];
  customers?: Customer[];
  /** Catalogue the free-can reward picker chooses from. */
  products?: Product[];
  /**
   * Needed to price product- and collection-scoped discounts. Without them this
   * page valued such a code at ₹0 while the cart drawer valued it correctly, so
   * the discount shrank when the shopper moved to checkout.
   */
  collections?: any[];
  onApplyDiscount?: (discount: Discount | null) => void;
}

export default function CheckoutView({
  cartItems,
  discountApplied,
  totalAmount,
  loggedInCustomer,
  onNavigate,
  onCompleteCheckout,
  activeDiscounts = [],
  customers = [],
  products = [],
  collections = [],
  onApplyDiscount
}: CheckoutViewProps) {
  const [applyStoreCredit, setApplyStoreCredit] = useState(false);
  const [currentDiscount, setCurrentDiscount] = useState<Discount | null>(discountApplied);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [isCanPickerOpen, setIsCanPickerOpen] = useState(false);
  const [isChoicePickerOpen, setIsChoicePickerOpen] = useState(false);

  // Shipping info state
  const [fullName, setFullName] = useState(loggedInCustomer?.name || '');
  const [email, setEmail] = useState(loggedInCustomer?.email || '');
  const [addressLine, setAddressLine] = useState(
    loggedInCustomer?.addresses && loggedInCustomer.addresses[0] ? loggedInCustomer.addresses[0] : ''
  );
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postcode, setPostcode] = useState('');
  // The store delivers within India; the country is fixed.
  const country = INDIA_COUNTRY_NAME;
  // Required: the courier uses it for delivery updates.
  const [phone, setPhone] = useState(loggedInCustomer?.phone || '');
  // One key per checkout attempt, so a double click or a retry after a network
  // error returns the same payment instead of starting a second one.
  const [checkoutKey, setCheckoutKey] = useState<string>(() => newCheckoutKey());

  // Payment state
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Polling for payment status
  const [orderId, setOrderId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // AgeChecked Gate State & Ref
  const ageGateRef = React.useRef<AgeGateHandle>(null);
  // null = still asking the server. Age verification is only applied when the
  // store has it switched on in Settings → Age Verification.
  const [ageCheckEnabled, setAgeCheckEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/agechecked/config')
      .then(r => (r.ok ? r.json() : null))
      .then(cfg => { if (!cancelled) setAgeCheckEnabled(cfg ? Boolean(cfg.enabled) : true); })
      // If the setting cannot be read, fail closed: ask for verification.
      .catch(() => { if (!cancelled) setAgeCheckEnabled(true); });
    return () => { cancelled = true; };
  }, []);
  const [isAgeApproved, setIsAgeApproved] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = window.localStorage.getItem('agechecked-approved');
    const storedVerified = window.localStorage.getItem('ageVerified');
    const params = new URLSearchParams(window.location.search);
    const statusParam = (params.get('status') || '').toLowerCase();
    return hasCurrentAgeApproval() && (
      params.get('agechecked') === 'approved' ||
      params.get('approved') === 'true' ||
      statusParam === '6' ||
      statusParam === '7' ||
      statusParam === 'approved' ||
      statusParam === 'verified' ||
      statusParam === 'pass' ||
      Boolean(window.localStorage.getItem('agechecked-id'))
    );
  });

  // AgeChecked can send the shopper back to the registered checkout URL, which
  // loads this page inside the verification panel. When that happens the panel
  // host is notified so it can dismiss itself.
  //
  // The panel is an iframe, so the host is window.parent. window.opener is only
  // set by the old popup flow and is still handled so a session that started
  // before this change can finish.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const host = (window.parent && window.parent !== window ? window.parent : null) || window.opener;
    if (!host || host === window) return;

    const agecheckId = new URLSearchParams(window.location.search).get('agecheckid');
    if (!agecheckId) return;

    const messages = [
      {
        type: 'AGECHECKED_VERIFIED',
        verified: true,
        approved: true,
        data: { id: agecheckId, agecheckid: agecheckId, status: 'approved' }
      },
      {
        type: 'agechecked-approved',
        status: 'approved',
        approved: true,
        verified: true,
        agecheckid: agecheckId
      }
    ];

    for (const message of messages) {
      try {
        host.postMessage(message, '*');
      } catch (_e) {}
    }

    // Only a real popup can be closed. Calling close() from inside the panel
    // is a no-op, and the messages above already dismiss it.
    if (window.opener && window.opener !== window && host === window.opener) {
      try {
        window.open('', '_self');
        window.close();
      } catch (_e) {}
    }
  }, []);

  // Keep isAgeApproved synchronized with localStorage, message events, storage events & server DB
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkAgeApprovedStorage = async () => {
      if (hasCurrentAgeApproval()) {
        setIsAgeApproved(true);
        setPaymentError(null);
        return;
      }

      const agecheckId = window.localStorage.getItem('agechecked-id');
      if (agecheckId) {
        try {
          const res = await fetch(`/api/agechecked/status?agecheckid=${encodeURIComponent(agecheckId)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.approved === true && data.agecheckid) {
              window.localStorage.setItem('agechecked-approved', 'true');
              window.localStorage.setItem('ageVerified', 'true');
              setIsAgeApproved(true);
              setPaymentError(null);
            }
          }
        } catch (_err) {}
      }
    };

    checkAgeApprovedStorage();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'agechecked-approved' || e.key === 'ageVerified') {
        const approved = e.newValue === 'true';
        setIsAgeApproved(approved);
        if (approved) {
          setPaymentError(null);
        }
      }
    };

    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;
      let data = event.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (_e) {
          if (data === 'agechecked-approved' || data === 'AGECHECKED_VERIFIED' || data === 'approved') {
            setIsAgeApproved(true);
            setPaymentError(null);
            return;
          }
        }
      }

      const messageAgeCheckId = data?.data?.agecheckid || data?.agecheckid;
      if (
        messageAgeCheckId && messageAgeCheckId === window.localStorage.getItem('agechecked-id') &&
        (
          data?.type === 'AGECHECKED_VERIFIED' ||
          data?.type === 'agechecked-approved' ||
          data?.getidEventName === 'complete' ||
          data?.approved === true ||
          data?.verified === true ||
          data?.status === 'approved' ||
          data?.status === '6' ||
          data?.status === '7'
        )
      ) {
        setIsAgeApproved(true);
        setPaymentError(null);
      }
    };

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('agechecked_channel');
        bc.onmessage = (ev) => {
          if (ev.data && ev.data.agecheckid && ev.data.agecheckid === window.localStorage.getItem('agechecked-id') && (ev.data.type === 'agechecked-approved' || ev.data.approved === true || ev.data.status === 'approved' || ev.data.verified === true)) {
            setIsAgeApproved(true);
            setPaymentError(null);
          }
        };
      }
    } catch (_bcErr) {}

    window.addEventListener('storage', handleStorage);
    window.addEventListener('message', handleMessage);
    window.addEventListener('focus', checkAgeApprovedStorage);
    window.addEventListener('pageshow', checkAgeApprovedStorage);
    document.addEventListener('visibilitychange', checkAgeApprovedStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('focus', checkAgeApprovedStorage);
      window.removeEventListener('pageshow', checkAgeApprovedStorage);
      document.removeEventListener('visibilitychange', checkAgeApprovedStorage);
      if (bc) {
        bc.close();
      }
    };
  }, [email]);

  // Logging for development
  const [showLogs, setShowLogs] = useState(false);
  const [apiLogs, setApiLogs] = useState<{ timestamp: string; type: 'REQUEST' | 'RESPONSE' | 'ERROR'; payload: any }[]>([]);

  useEffect(() => {
    setCurrentDiscount(discountApplied);
  }, [discountApplied]);

  // Auto-fill customer details
  useEffect(() => {
    if (loggedInCustomer) {
      setFullName(loggedInCustomer.name);
      setEmail(loggedInCustomer.email);
      if (loggedInCustomer.addresses && loggedInCustomer.addresses[0]) {
        setAddressLine(loggedInCustomer.addresses[0]);
      }
    }
  }, [loggedInCustomer]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const addLog = (type: 'REQUEST' | 'RESPONSE' | 'ERROR', payload: any) => {
    setApiLogs(prev => [
      {
        timestamp: new Date().toLocaleTimeString(),
        type,
        payload
      },
      ...prev
    ]);
  };

  const handleApplyPromoInCheckout = async (e: React.MouseEvent) => {
    e.preventDefault();
    setPromoError('');
    setPromoSuccess('');

    const res = resolveDiscountCode(
      promoCodeInput,
      activeDiscounts || [],
      customers || [],
      loggedInCustomer,
      cartItems,
      rawSubtotal
    );

    if (res.success && res.discount) {
      // A can already chosen on the loyalty rewards page or in the cart carries
      // over, so the picker only opens for what is still outstanding.
      const discount = hydrateRewardSelection(res.discount);

      // Whether the code is VALID is decided in the browser; whether this
      // shopper has already spent a one-per-customer code is decided by the
      // server, against the orders they have actually placed. Asked here so
      // they are told now rather than after filling the form. The payment
      // session applies the same rule and is the one that binds.
      const usable = await checkDiscountStillUsable(discount);
      if (!usable.ok) {
        setPromoError(usable.message || 'This discount code has already been used.');
        return;
      }

      setCurrentDiscount(discount);
      if (onApplyDiscount) {
        onApplyDiscount(discount);
      }
      setPromoSuccess(res.message || `Discount Code "${discount.title}" applied!`);
      if (rewardNeedsSelection(discount)) openPickerFor(discount);
    } else {
      setPromoError(res.error || 'Invalid or expired discount code.');
    }
  };

  /**
   * Applies the automatic launch offer when the shopper qualifies.
   *
   * The first fifty accounts get 10% off their first order with no code to
   * type. Whether they qualify is decided entirely by the server — from the
   * accounts and orders that exist — and re-checked before the payment session
   * is created, so nothing here can award it.
   *
   * It never overwrites a discount the shopper has already applied: a code they
   * chose to enter beats one we applied for them.
   */
  useEffect(() => {
    const customerEmail = (email || loggedInCustomer?.email || '').trim();
    if (!customerEmail || currentDiscount) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/discounts/auto?email=${encodeURIComponent(customerEmail)}`);
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const auto = data?.discount;
        if (cancelled || !auto) return;
        setCurrentDiscount(auto);
        if (onApplyDiscount) onApplyDiscount(auto);
        setPromoSuccess(`${auto.details} applied automatically.`);
      } catch {
        // No automatic discount is better than a broken checkout.
      }
    })();

    return () => {
      cancelled = true;
    };
    // Deliberately not depending on currentDiscount: re-running when it changes
    // would re-apply the offer the moment a shopper removed it.
  }, [email, loggedInCustomer?.email]);

  /**
   * Asks the server whether a one-per-customer code is still available to this
   * shopper. Any failure answers "yes": a network problem must not block a sale
   * the payment step would have accepted.
   */
  const checkDiscountStillUsable = async (
    discount: Discount
  ): Promise<{ ok: boolean; message?: string }> => {
    const customerEmail = (email || loggedInCustomer?.email || '').trim();
    if (!customerEmail) return { ok: true };
    try {
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail, discount })
      });
      if (!res.ok) return { ok: true };
      const data = await res.json().catch(() => ({ ok: true }));
      return { ok: data?.ok !== false, message: data?.message };
    } catch (_e) {
      return { ok: true };
    }
  };

  /** Opens the picker a reward needs before it can be honoured. */
  const openPickerFor = (discount: Discount) => {
    if (discount.rewardKind === 'choice') {
      setIsChoicePickerOpen(true);
    } else if (discount.rewardKind === 'free-cans') {
      setIsCanPickerOpen(true);
    }
  };

  /** Keeps the reward selection on both this page's copy and App's copy. */
  const updateDiscount = (next: Discount | null) => {
    setCurrentDiscount(next);
    if (onApplyDiscount) onApplyDiscount(next);
  };

  const handleChooseReward = (choiceId: string) => {
    if (!currentDiscount) return;
    const updated = applyRewardChoice(currentDiscount, choiceId);
    updateDiscount(updated);
    saveRewardSelection(updated.title, { rewardChoiceId: choiceId });
    setIsChoicePickerOpen(false);
    setPromoSuccess(`Reward applied: ${updated.details}`);
    if (updated.rewardKind === 'free-cans') setIsCanPickerOpen(true);
  };

  const safeParseJson = async (res: Response) => {
    const text = await res.text().catch(() => '');
    try {
      return JSON.parse(text);
    } catch (_e) {
      return {
        success: false,
        error: text.startsWith('<') ? 'Server returned HTML response' : text || `HTTP ${res.status}`,
        message: text.startsWith('<') ? `Server returned an invalid response (${res.status} ${res.statusText})` : text
      };
    }
  };

  /** Shows the confirmation for an order the server has recorded. */
  const showConfirmedOrder = (confirmedOrderId: string, order: any, quote: any) => {
    const paid = {
      orderId: confirmedOrderId,
      customerName: fullName.trim(),
      customerEmail: email.trim(),
      address: buildDestinationString(),
      total: Number(order?.total ?? quote?.total ?? 0),
      discountApplied: currentDiscount,
      items: (order?.items || quote?.orderItems || []).map((i: any) => ({ productId: i.productId || '', productTitle: i.productTitle, price: i.price, quantity: i.quantity, image: i.image })),
      gatewayTxId: '',
      gatewayAuthCode: '',
      cardBrand: order?.paymentMethod || 'Online payment',
      storeCreditApplied: Number(quote?.storeCreditApplied || 0),
      paymentMethod: order?.paymentMethod || (quote?.amountDue === 0 ? 'Store Credit' : 'Online payment')
    };
    trackOrderCompleted({
      orderId: confirmedOrderId,
      customerName: paid.customerName,
      customerEmail: paid.customerEmail,
      destination: paid.address,
      total: paid.total,
      items: paid.items
    });
    onCompleteCheckout(paid);
    setPaymentSuccessData(paid);
    setIsProcessingPayment(false);
    setCheckoutKey(newCheckoutKey());
  };

  /**
   * Asks the server whether the payment has been confirmed. The server checks
   * with Razorpay itself, so this also recovers a payment whose browser
   * callback was lost (closed tab, dropped connection).
   */
  const pollPaymentStatus = (pollOrderId: string, quote: any) => {
    let attempts = 0;
    const maxAttempts = 40; // about two minutes
    if (pollingInterval) clearInterval(pollingInterval);

    const interval = setInterval(async () => {
      attempts++;
      try {
        const response = await fetch(`/api/payments/status?orderId=${encodeURIComponent(pollOrderId)}`);
        const data = await safeParseJson(response);
        if (data.status === 'paid' && data.order) {
          clearInterval(interval);
          setPollingInterval(null);
          showConfirmedOrder(pollOrderId, data.order, quote);
          return;
        }
        if (data.status === 'failed' || data.status === 'amount_mismatch') {
          clearInterval(interval);
          setPollingInterval(null);
          setIsProcessingPayment(false);
          setPaymentError(data.message || 'The payment was not completed. You have not been charged.');
          return;
        }
      } catch (error) {
        console.error('[Checkout] Status check failed:', error);
      }
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setPollingInterval(null);
        setIsProcessingPayment(false);
        setPaymentError(`We have not received confirmation for order ${pollOrderId} yet. If you were charged, your order will be confirmed by email automatically. Please do not pay again.`);
      }
    }, 3000);
    setPollingInterval(interval);
  };

  const getItemTotal = (item: CartItem) => {
    return calculateVolumePrice(item.price, item.quantity);
  };

  // Calculate totals
  const rawSubtotal = cartItems.reduce((acc, item) => acc + getItemTotal(item), 0);
  const discountValue = calculateDiscountAmount(currentDiscount, cartItems, rawSubtotal, products, collections);
  const subtotalAfterDiscount = Math.max(rawSubtotal - discountValue, 0);
  const deliveryCost = resolveDeliveryCost(subtotalAfterDiscount, currentDiscount, STANDARD_DELIVERY_COST);
  const isFreeShipping = deliveryCost === 0;
  /** True when delivery is free because of the reward, not the spend threshold. */
  const isRewardFreeDelivery = isFreeShippingReward(currentDiscount);
  const outstandingCans = getOutstandingFreeCanCount(currentDiscount);
  const needsRewardSelection = rewardNeedsSelection(currentDiscount);
  const rewardLineCount = getRewardLines(currentDiscount).length;
  const finalTotal = subtotalAfterDiscount + deliveryCost;
  const storeCreditAvailable = loggedInCustomer?.storeCredit || 0;
  const storeCreditApplied = applyStoreCredit ? Math.min(storeCreditAvailable, finalTotal) : 0;
  const finalTotalToPay = Math.max(0, finalTotal - storeCreditApplied);

  const buildShippingAddress = () => ({
    fullName: fullName.trim(),
    address1: addressLine.trim(),
    address2: addressLine2.trim(),
    city: city.trim(),
    state: stateName,
    pincode: normalizePincode(postcode) || postcode.trim(),
    country: INDIA_COUNTRY_NAME,
    phone: normalizeIndianPhone(phone) || phone.trim()
  });

  const buildDestinationString = () => {
    const a = buildShippingAddress();
    return [a.address1, a.address2, a.city, [a.state, a.pincode].filter(Boolean).join(' '), a.country].filter(Boolean).join(', ');
  };

  const addressCheck = validateIndiaAddress(buildShippingAddress());
  const isPhoneValid = normalizeIndianPhone(phone).length > 0;
  const isPostcodeValid = normalizePincode(postcode).length > 0;

  const executePaymentProcess = async () => {
    if (!fullName.trim() || !email.trim()) {
      setPaymentError('Please enter your name and email address.');
      return;
    }
    if (!addressCheck.valid) {
      setPaymentError(addressCheck.errors[0]);
      return;
    }

    // A reward whose selection is unfinished would be paid for and then lost, so
    // stop here and reopen the picker rather than take the money.
    if (needsRewardSelection && currentDiscount) {
      setPaymentError(
        currentDiscount.rewardKind === 'choice'
          ? 'Please choose which reward you would like before paying.'
          : `Please choose your free item${outstandingCans !== 1 ? 's' : ''} before paying.`
      );
      openPickerFor(currentDiscount);
      return;
    }

    // Age verification, when enabled. The gate component only exists when
    // AgeChecked is switched on in Settings → Age Verification.
    if (ageCheckEnabled === null) {
      setPaymentError('Checkout is still loading. Please try again in a moment.');
      return;
    }
    let currentAgeVerified = !ageCheckEnabled || isAgeApproved || hasCurrentAgeApproval();
    if (!currentAgeVerified && !ageGateRef.current) {
      setPaymentError('Age verification is loading. Please try again in a moment.');
      return;
    }
    if (!currentAgeVerified && ageGateRef.current) {
      setPaymentError(null);
      const approved = await ageGateRef.current.openPortal();
      if (!approved) {
        setPaymentError('Age verification is required to complete this purchase.');
        return;
      }
      currentAgeVerified = true;
      setIsAgeApproved(true);
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      trackStartedCheckout({
        items: cartItems,
        total: finalTotalToPay,
        customerEmail: email.trim(),
        customerName: fullName.trim(),
        checkoutId: checkoutKey,
        recurring: false
      });
    } catch (_e) {}

    try {
      // The browser says only WHAT is being bought. Prices, discount, delivery
      // and store credit are all calculated again on the server.
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: checkoutKey,
          customerName: fullName.trim(),
          customerEmail: email.trim(),
          shippingAddress: buildShippingAddress(),
          items: cartItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
          discountCode: currentDiscount?.title || null,
          discountId: currentDiscount?.id || null,
          rewardChoiceId: currentDiscount?.rewardChoiceId || null,
          freeCanSelections: (currentDiscount?.freeCanSelections || []).map(sel => ({ productId: sel.productId, variantId: sel.variantId })),
          useStoreCredit: storeCreditApplied > 0
        })
      });
      const data = await safeParseJson(res);
      addLog(res.ok ? 'RESPONSE' : 'ERROR', { status: res.status, requiresPayment: data.requiresPayment, orderId: data.orderId, error: data.error });
      if (!res.ok) throw new Error(data.error || 'Could not start checkout.');

      setOrderId(data.orderId);

      if (!data.requiresPayment) {
        // Fully covered by store credit or a discount; the server has recorded the order.
        showConfirmedOrder(data.orderId, data.order, data.quote);
        return;
      }

      if (Math.abs(Number(data.quote?.amountDue || 0) - finalTotalToPay) > 0.009) {
        setPaymentError(`Your total has been updated to ₹${Number(data.quote.amountDue).toFixed(2)} after our server checked current prices. Press Pay again to continue.`);
        setIsProcessing(false);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('The payment window could not be loaded. Check your connection and try again.');

      const quote = data.quote;
      const rzp = new (window as any).Razorpay({
        key: data.keyId,
        order_id: data.razorpayOrderId,
        amount: data.amount,
        currency: data.currency,
        name: 'Ecommerce Store',
        description: `Order ${data.orderId}`,
        prefill: data.prefill,
        notes: { orderId: data.orderId },
        handler: async (response: any) => {
          // Razorpay reports success; the server confirms it before anything is recorded.
          setIsProcessingPayment(true);
          try {
            const verify = await fetch('/api/payments/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response)
            });
            const v = await safeParseJson(verify);
            if (v.status === 'paid' && v.order) {
              showConfirmedOrder(data.orderId, v.order, quote);
              return;
            }
            if (v.status === 'failed') {
              setIsProcessingPayment(false);
              setPaymentError(v.message || v.error || 'The payment could not be verified.');
              return;
            }
          } catch (verifyErr) {
            console.warn('[Checkout] Verification call failed; falling back to status checks.', verifyErr);
          }
          pollPaymentStatus(data.orderId, quote);
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            // The shopper may have approved a UPI payment on their phone before closing.
            setIsProcessingPayment(true);
            pollPaymentStatus(data.orderId, quote);
          }
        },
        theme: { color: '#0f172a' }
      });
      rzp.on('payment.failed', (resp: any) => {
        setPaymentError(resp?.error?.description || 'The payment failed. You can try again.');
      });
      setIsProcessing(false);
      rzp.open();
    } catch (error: any) {
      console.error('[Checkout] Error:', error);
      setIsProcessing(false);
      setIsProcessingPayment(false);
      const errMsg = error.message || 'Failed to start payment';
      setPaymentError(errMsg);
      try {
        const firstItem = cartItems[0];
        if (firstItem) {
          trackCheckoutFailed({ id: firstItem.productId, name: firstItem.productTitle, price: finalTotalToPay, currency: 'INR', recurring: false }, errMsg);
        }
      } catch (_e) {}
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    await executePaymentProcess();
  };

  // Processing screen
  if (isProcessingPayment) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 border border-blue-100 text-blue-600 mx-auto">
            <Clock className="h-10 w-10 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-950">Confirming your payment</h2>
            <p className="text-slate-500 text-sm">
              We are confirming your payment with the payment provider. Please do not pay again.
            </p>
            <p className="text-slate-400 text-xs">
              Order #{orderId} • This page will update automatically once payment is confirmed.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Waiting for payment confirmation...</span>
          </div>

          <div className="flex items-center justify-center gap-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => {
                if (orderId) {
                  pollPaymentStatus(orderId, null);
                }
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
            >
              Check status now
            </button>
            <button
              onClick={() => {
                setIsProcessingPayment(false);
              }}
              className="text-xs text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
            >
              Back to Checkout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success screen
  if (paymentSuccessData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-50 rounded-full blur-3xl opacity-60 -z-10" />
          
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 mx-auto">
            <CheckCircle className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold py-1 px-3.5 rounded-full uppercase tracking-wider inline-block">
              Payment Confirmed
            </span>
            <h1 className="text-3xl font-black text-slate-950 uppercase tracking-tight">Order Placed Successfully!</h1>
            <p className="text-slate-500 max-w-lg mx-auto text-xs leading-relaxed">
              Thank you for your order! You will receive a confirmation email shortly.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-150/70 rounded-2xl p-6 text-left max-w-lg mx-auto space-y-4">
            <div className="flex justify-between border-b border-slate-200 pb-3 text-xs">
              <span className="text-slate-400 font-bold">Order Reference:</span>
              <span className="font-mono font-bold text-slate-800 uppercase">{paymentSuccessData.orderId}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-3 text-xs">
              <span className="text-slate-400 font-bold">Payment Method:</span>
              <span className="font-semibold text-slate-800">{paymentSuccessData.paymentMethod || paymentSuccessData.cardBrand}</span>
            </div>
            <div className="flex justify-between pt-1 text-sm font-black">
              <span className="text-slate-800 uppercase">Total Paid:</span>
              <span className="text-slate-950">₹{Number(paymentSuccessData.total || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 max-w-md mx-auto">
            <button
              onClick={() => onNavigate('frontend-home')}
              className="w-full bg-slate-900 border-slate-900 text-white hover:bg-slate-800 py-3.5 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-colors cursor-pointer shadow-md"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => onNavigate('frontend-account')}
              className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3.5 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-colors cursor-pointer"
            >
              View Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header back navigation */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => onNavigate('frontend-shop')}
          className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-850 transition-colors uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Shop
        </button>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
          <ShieldCheck className="h-4 w-4 text-emerald-500" /> 256-Bit SSL Encrypted Checkout
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Order forms */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Shipping Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Truck className="h-4 w-4 text-indigo-600" /> 1. Shipping Address
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-250 bg-slate-50/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-250 bg-slate-50/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Phone Number <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                required
                inputMode="tel"
                autoComplete="tel"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full text-xs p-3 border bg-slate-50/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 font-semibold ${
                  phone.trim() && !isPhoneValid ? 'border-red-300' : 'border-slate-250'
                }`}
              />
              <p className={`text-[10px] font-semibold ${phone.trim() && !isPhoneValid ? 'text-red-600' : 'text-slate-400'}`}>
                {phone.trim() && !isPhoneValid
                  ? 'Enter a valid 10-digit Indian mobile number.'
                  : 'Required. Used by the courier for delivery updates.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Street Address</label>
              <input
                type="text"
                required
                placeholder="House / flat number, street"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                className="w-full text-xs p-3 border border-slate-250 bg-slate-50/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 font-semibold"
              />
              <input
                type="text"
                placeholder="Area / landmark (optional)"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                aria-label="Address line 2"
                className="w-full text-xs p-3 border border-slate-250 bg-slate-50/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-250 bg-slate-50/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">State</label>
                <select
                  required
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-250 bg-slate-50/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 font-semibold"
                >
                  <option value="">Select state</option>
                  {INDIA_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">PIN code</label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="110001"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value.replace(/\D/g, ''))}
                  className={`w-full text-xs p-3 border bg-slate-50/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 font-semibold ${
                    postcode.trim() && !isPostcodeValid ? 'border-red-300' : 'border-slate-250'
                  }`}
                />
              </div>
            </div>

            {postcode.trim() && !isPostcodeValid && (
              <p className="text-[10px] font-bold text-red-600">Please enter a valid 6-digit PIN code.</p>
            )}

            <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <Truck className="h-4 w-4 text-slate-500 shrink-0 mt-px" />
              <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed">
                <span className="font-black text-slate-700">We deliver across India.</span> International orders are not accepted.
              </p>
            </div>

            {/* Delivery Info */}
            <div className="pt-2">
              <div className="border border-slate-800 bg-slate-50 ring-1 ring-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                <div className="text-left">
                  <span className="font-extrabold text-xs block text-slate-800 flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-red-600" /> Standard Delivery
                  </span>
                  <span className="text-[10px] text-slate-500">Tracking number sent by email on dispatch</span>
                  {isRewardFreeDelivery && (
                    <span className="text-[10px] text-emerald-700 font-black block pt-0.5">
                      Waived by your Free Delivery reward
                    </span>
                  )}
                </div>
                <span className={isFreeShipping ? "font-black text-xs text-emerald-600" : "font-black text-xs text-slate-800"}>
                  {isFreeShipping ? 'FREE' : `₹${deliveryCost.toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>

            {/* Payment Section */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-indigo-600" /> 2. Select Payment Method
                </h3>
              </div>

              {/* Payment Info */}
              <div className="border border-indigo-150 bg-indigo-50/50 rounded-2xl p-5 text-center space-y-3">
                <div className="mx-auto w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shadow-inner">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-850">Secure payment by Razorpay</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-md mx-auto">
                    Pay with UPI, cards, netbanking or wallets in Razorpay's secure window. Your card details never touch this website.
                  </p>
                </div>
                <div className="flex justify-center gap-6 text-[10px] text-slate-400 font-extrabold uppercase">
                  <span>✓ 256-bit SSL</span>
                  <span>✓ UPI</span>
                  <span>✓ Cards &amp; Netbanking</span>
                </div>
              </div>

              {/* Payment Buttons */}
              <div className="space-y-4">
                {/* AgeChecked Gate Integration */}
                {ageCheckEnabled && (
                <div className="mb-4">
                  <AgeGate
                    ref={ageGateRef}
                    onApprovedChange={(approved) => {
                      setIsAgeApproved(approved);
                      if (approved) {
                        setPaymentError(null);
                      }
                    }}
                    customerData={{
                      name: fullName,
                      email: email,
                      postcode: postcode,
                      countrycode: 'IN',
                      reference: orderId || `order-${Date.now()}`
                    }}
                  />
                </div>
                )}

                {paymentError && (
                  <div className="flex gap-2 items-center bg-red-50 border border-red-150 p-3.5 rounded-xl text-xs font-bold text-red-650">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                {finalTotalToPay === 0 ? (
                  <button
                    type="button"
                    onClick={() => executePaymentProcess()}
                    disabled={isProcessing}
                    className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-bold py-4 px-6 rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                        <span>Processing Order...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 text-emerald-400" />
                        <span>Complete Order with Store Credit (₹0.00)</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-3.5">
                    {/* Razorpay payment action */}
                    <div className="p-5 border-2 border-slate-900 bg-white rounded-2xl space-y-4 shadow-sm">
                      <div className="flex justify-between items-center text-xs font-black text-slate-900 uppercase">
                        <span className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-emerald-600" /> Pay online
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-emerald-100 text-emerald-800 text-[9.5px] px-2.5 py-0.5 rounded-full font-mono font-extrabold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span> LIVE
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Razorpay's secure payment window opens on this page. Pay by UPI (app or QR), card, netbanking or wallet.
                      </p>
                      <button
                        type="button"
                        onClick={() => executePaymentProcess()}
                        disabled={isProcessing}
                        className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-black py-4 px-6 rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin text-white" />
                            <span>Starting secure payment...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 text-emerald-400" />
                            <span>Pay ₹{finalTotalToPay.toFixed(2)}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* Right Side: Order summary */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 sticky top-6">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-indigo-600" /> Order Summary
            </h3>

            {/* Product items */}
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-2">
              {cartItems.map((item, idx) => (
                <div key={idx} className="py-3 flex items-start gap-3.5 text-xs">
                  <img
                    src={item.image}
                    alt={item.productTitle}
                    className="w-12 h-12 object-cover rounded-lg bg-slate-50 border border-slate-100 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-slate-800 text-[11px] leading-tight">{item.productTitle}</h4>
                    <p className="text-slate-400 text-[10px] font-bold mt-1">Qty: {item.quantity} × ₹{item.price.toFixed(2)}</p>
                  </div>
                  <span className="font-black text-slate-800 text-[11px] shrink-0">₹{getItemTotal(item).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Store Credit */}
            {loggedInCustomer && loggedInCustomer.storeCredit !== undefined && loggedInCustomer.storeCredit > 0 && (
              <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-2xl text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="apply-store-credit-checkout"
                      checked={applyStoreCredit}
                      onChange={(e) => setApplyStoreCredit(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5 cursor-pointer"
                    />
                    <label htmlFor="apply-store-credit-checkout" className="font-extrabold text-[#071d37] cursor-pointer select-none">
                      Apply Store Credit (₹{loggedInCustomer.storeCredit.toFixed(2)} Available)
                    </label>
                  </div>
                </div>
                {applyStoreCredit && (
                  <p className="text-[10.5px] text-emerald-700 mt-2 font-medium leading-relaxed">
                    Applying ₹{Math.min(loggedInCustomer.storeCredit, finalTotal).toFixed(2)} Store Credit deduction.
                  </p>
                )}
              </div>
            )}

            {/* Promo Code */}
            <div className="bg-slate-50/70 border border-slate-200 p-4 rounded-2xl text-xs space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Promo or Referral Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 p-2 text-xs rounded-xl uppercase placeholder:normal-case font-bold tracking-wider focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
                <button
                  type="button"
                  onClick={handleApplyPromoInCheckout}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-extrabold px-3.5 py-2 rounded-xl cursor-pointer transition-colors shrink-0 uppercase tracking-wider"
                >
                  Apply
                </button>
              </div>
              {promoError && <p className="text-[10px] text-red-500 font-bold">{promoError}</p>}
              {promoSuccess && (
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 p-1.5 rounded-lg font-black">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span>{promoSuccess}</span>
                </div>
              )}

              {/* Reward still waiting on the customer's pick */}
              {needsRewardSelection && currentDiscount && (
                <button
                  onClick={() => openPickerFor(currentDiscount)}
                  className="mt-2 w-full bg-[#dfa047] hover:bg-[#cf9038] text-[#071d37] text-[11px] font-black uppercase tracking-wider py-2.5 px-3 rounded-xl cursor-pointer"
                >
                  {currentDiscount.rewardKind === 'choice'
                    ? 'Choose your reward'
                    : `Choose your free item${outstandingCans !== 1 ? 's' : ''} (${outstandingCans} to pick)`}
                </button>
              )}
            </div>

            {/* Free cans and gifts included by the applied reward */}
            {rewardLineCount > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <AppliedRewardLines
                  discount={currentDiscount}
                  compact
                  onEditSelection={
                    currentDiscount?.rewardKind === 'free-cans'
                      ? () => setIsCanPickerOpen(true)
                      : undefined
                  }
                />
              </div>
            )}

            {/* Totals */}
            <div className="space-y-2 border-t border-slate-100 pt-3 text-xs leading-normal font-semibold">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="text-slate-800">₹{rawSubtotal.toFixed(2)}</span>
              </div>

              {currentDiscount && discountValue > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3" /> Discount
                  </span>
                  <span className="font-extrabold">-₹{discountValue.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500">
                <span>Delivery</span>
                <span>{deliveryCost === 0 ? 'FREE' : `₹${deliveryCost.toFixed(2)}`}</span>
              </div>

              {applyStoreCredit && storeCreditApplied > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Store Credit</span>
                  <span>-₹{storeCreditApplied.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-150">
                <span>Total</span>
                <span className="text-base text-indigo-700 font-black">₹{finalTotalToPay.toFixed(2)}</span>
              </div>
            </div>

            {/* Security badge */}
            <div className="border-t border-slate-100 pt-3.5 flex justify-center gap-4 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
              <span className="flex items-center gap-1"><Lock className="h-3 w-3 text-emerald-500" /> SSL Encrypted</span>
              <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-indigo-500" /> Secure</span>
            </div>
          </div>

        </div>

      </div>

      <RewardChoicePicker
        isOpen={isChoicePickerOpen}
        choices={getRewardChoices(currentDiscount)}
        rewardLabel={currentDiscount?.title}
        onChoose={handleChooseReward}
        onCancel={() => setIsChoicePickerOpen(false)}
      />

      <FreeCanPicker
        isOpen={isCanPickerOpen}
        count={currentDiscount?.freeCanCount || 1}
        products={products}
        initialSelections={currentDiscount?.freeCanSelections || []}
        rewardLabel={currentDiscount?.details}
        onConfirm={(selections) => {
          if (currentDiscount) {
            saveRewardSelection(currentDiscount.title, { freeCanSelections: selections });
            updateDiscount({ ...currentDiscount, freeCanSelections: selections });
          }
          setIsCanPickerOpen(false);
          setPaymentError(null);
        }}
        onCancel={() => setIsCanPickerOpen(false)}
      />

    </div>
  );
}