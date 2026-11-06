// CheckoutView.tsx
import React, { useState, useEffect } from 'react';
import { CartItem, Discount, Customer, Order, Product } from '../types';
import { 
  ShieldCheck, ArrowLeft, CreditCard, Lock, Terminal, 
  CheckCircle, AlertTriangle, AlertCircle, RefreshCw, 
  Truck, ShoppingCart, UserCheck, Check, X, Loader2,
  Clock, ExternalLink, Repeat, User
} from 'lucide-react';
import SubscriptionIcon from './SubscriptionIcon';
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
import { getPlanImage, getPlanSlug } from '../utils/planImages';
import { parseSubscriptionProducts, formatSubscriptionItemDisplay } from '../utils/subscriptionParser';
import {
  UK_COUNTRY_CODE,
  UK_COUNTRY_NAME,
  isValidUkPostcode,
  normalizeUkPhone,
  normalizeUkPostcode,
  validateUkDelivery
} from '../utils/ukValidation';

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
   * page valued such a code at £0 while the cart drawer valued it correctly, so
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
  const [city, setCity] = useState('London');
  const [postcode, setPostcode] = useState('EC1A 1BB');
  // The store ships within the UK only, so the country is fixed rather than
  // chosen: an address anywhere else cannot be posted on this Royal Mail
  // contract, and taking the order would only mean cancelling it later.
  const country = UK_COUNTRY_NAME;
  // Required. Royal Mail puts it on the label and the courier uses it for
  // delivery problems, so an order without one cannot be dispatched cleanly.
  const [phone, setPhone] = useState(loggedInCustomer?.phone || '');

  // Payment state
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [worldpayRedirectUrl, setWorldpayRedirectUrl] = useState<string | null>(null);

  // Polling for payment status
  const [orderId, setOrderId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // AgeChecked Gate State & Ref
  const ageGateRef = React.useRef<AgeGateHandle>(null);
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

  // Poll for payment status after redirect
  const pollPaymentStatus = (orderId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts * 3 seconds = 90 seconds max

    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const response = await fetch(`/api/worldpay/status?orderId=${orderId}`);
        const data = await safeParseJson(response);

        if (data.paid === true) {
          // Payment confirmed!
          clearInterval(interval);
          setPollingInterval(null);
          
          // Fetch full order details
          const orderResponse = await fetch(`/api/worldpay/order/${orderId}`);
          const orderData = await safeParseJson(orderResponse);
          
          trackOrderCompleted({
            orderId: orderId,
            customerName: orderData.customerName || fullName,
            customerEmail: orderData.customerEmail || email,
            destination: orderData.destination || buildDestinationString(),
            total: orderData.total || finalTotalToPay,
            items: orderData.items || cartItems
          });

          setPaymentSuccessData({
            orderId: orderId,
            total: orderData.total || 0,
            gatewayTxId: orderData.worldpayTxId || orderData.gatewayTxId,
            gatewayAuthCode: orderData.worldpayAuthCode || orderData.gatewayAuthCode,
            cardBrand: orderData.cardBrand || 'Card',
            paymentMethod: orderData.paymentMethod || 'Card'
          });
          
          setIsProcessingPayment(false);
          return;
        }

        if (data.status === 'Failed') {
          clearInterval(interval);
          setPollingInterval(null);
          setIsProcessingPayment(false);
          setPaymentError('Payment was declined. Please try again.');
          return;
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPollingInterval(null);
          setIsProcessingPayment(false);
          setPaymentError('Payment is taking longer than expected. Please check your email for confirmation.');
        }
      } catch (error) {
        console.error('[Checkout] Polling error:', error);
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPollingInterval(null);
          setIsProcessingPayment(false);
        }
      }
    }, 3000); // Poll every 3 seconds

    setPollingInterval(interval);
  };

  const getItemTotal = (item: CartItem) => {
    if (item.productId && (item.productId.startsWith('sub-pack-') || item.productId.includes('sub-pack') || item.isSubscription)) {
      return item.price * item.quantity;
    }
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

  // The saved address a returning shopper is prefilled with is itself a joined
  // "line, town, postcode, country" string. Appending the town, postcode and
  // country to it again produced destinations such as
  // "Daari, London, EC1A 1BB, United Kingdom, London, EC1A 1BB, United Kingdom",
  // so each part is only added when the line does not already carry it.
  const buildDestinationString = () => {
    const line = addressLine.trim();
    const lineLower = line.toLowerCase();
    const parts = [line];
    for (const part of [city, postcode, country]) {
      const value = String(part || '').trim();
      if (!value) continue;
      if (lineLower.includes(value.toLowerCase())) continue;
      parts.push(value);
    }
    return parts.filter(Boolean).join(', ');
  };

  // The address as separate fields. Royal Mail needs the town and postcode on
  // their own, and reading them back out of a joined string is guesswork.
  const buildShippingAddress = () => ({
    fullName: fullName.trim(),
    addressLine1: addressLine.trim(),
    city: city.trim(),
    postcode: normalizeUkPostcode(postcode),
    countryCode: UK_COUNTRY_CODE,
    country: UK_COUNTRY_NAME,
    email: email.trim(),
    // Royal Mail prints this on the label and uses it for delivery problems.
    phone: normalizeUkPhone(phone) || phone.trim()
  });

  const ukDeliveryCheck = validateUkDelivery({ phone, postcode, country });
  const isPhoneValid = normalizeUkPhone(phone).length > 0;
  const isPostcodeValid = isValidUkPostcode(postcode);

  // Process live payment with Worldpay HPP
  const executePaymentProcess = async () => {
    // Validate shipping info
    if (!fullName || !email || !addressLine || !city.trim()) {
      setPaymentError('Please fill in your shipping and contact information.');
      return;
    }

    // A reward whose selection is unfinished would be paid for and then lost, so
    // stop here and reopen the picker rather than take the money.
    if (needsRewardSelection && currentDiscount) {
      setPaymentError(
        currentDiscount.rewardKind === 'choice'
          ? 'Please choose which reward you would like before paying.'
          : `Please choose your free can${outstandingCans !== 1 ? 's' : ''} before paying.`
      );
      openPickerFor(currentDiscount);
      return;
    }

    // UK-only delivery, and a phone number Royal Mail can use. Checked here as
    // well as on the server so the shopper is told before payment starts rather
    // than after the gateway has taken the money.
    if (!ukDeliveryCheck.valid) {
      setPaymentError(ukDeliveryCheck.errors[0]);
      return;
    }

    // Check if age is verified
    let currentAgeVerified = isAgeApproved;
    if (typeof window !== 'undefined') {
      if (hasCurrentAgeApproval()) {
        currentAgeVerified = true;
        setIsAgeApproved(true);
      }
    }

    // Enforce the AgeChecked gate for live payments. There is no bypass: the
    // "pay without AgeChecked" button that used to sit beside the pay button
    // took real money for age-restricted goods with no 18+ check at all.
    if (!currentAgeVerified) {
      setPaymentError(null);
      if (ageGateRef.current) {
        const approved = await ageGateRef.current.openPortal();
        if (!approved) {
          setPaymentError('Age verification (18+) is required to complete payment.');
          return;
        }
        currentAgeVerified = true;
        setIsAgeApproved(true);
      } else {
        setPaymentError('Age verification system is initializing. Please try again.');
        return;
      }
    }

    // Handle zero-cost orders (store credit covers everything)
    if (finalTotalToPay === 0) {
      setIsProcessing(true);
      setPaymentError(null);
      
      try {
        const generatedOrderId = `PS${Math.floor(Math.random() * 90000 + 10000)}`;
        
        // Create order with store credit
        const orderData = {
          orderId: generatedOrderId,
          customerName: fullName,
          customerEmail: email,
          customerPhone: normalizeUkPhone(phone) || phone.trim(),
          address: buildDestinationString(),
          shippingAddress: buildShippingAddress(),
          total: 0,
          subtotal: Number(subtotalAfterDiscount.toFixed(2)),
          shippingCost: Number(deliveryCost.toFixed(2)),
          deliveryCost: Number(deliveryCost.toFixed(2)),
          deliveryMethod: 'Royal Mail Tracked 24/48',
          discountApplied: currentDiscount,
          discountAmount: Number(discountValue.toFixed(2)),
          items: buildOrderItems(cartItems, currentDiscount),
          gatewayTxId: `CREDIT-${Date.now()}`,
          gatewayAuthCode: 'CREDIT-AUTH',
          cardBrand: 'Store Credit',
          storeCreditApplied: storeCreditApplied,
          paymentMethod: 'Store Credit'
        };

        // Call API to create order
        const response = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });

        if (response.ok) {
          trackOrderCompleted({
            orderId: orderData.orderId,
            customerName: orderData.customerName,
            customerEmail: orderData.customerEmail,
            destination: orderData.address,
            total: orderData.total,
            items: orderData.items
          });
          onCompleteCheckout(orderData);
          setPaymentSuccessData(orderData);
        } else {
          const failure = await response.json().catch(() => ({} as any));
          throw new Error(failure?.error || 'Failed to create order');
        }
      } catch (error: any) {
        setPaymentError(error.message || 'Failed to process order');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    const generatedOrderId = `PS${Math.floor(Math.random() * 90000 + 10000)}`;
    setOrderId(generatedOrderId);

    // Track Started Checkout in Klaviyo. The full cart is passed — not just the
    // first line — so the abandoned-cart email can show what was left behind,
    // and the email is passed so Klaviyo identifies the profile. Without the
    // identify a guest's checkout attaches to no profile and the flow has
    // nobody to email.
    try {
      if (cartItems.length > 0) {
        trackStartedCheckout({
          items: cartItems,
          total: finalTotalToPay,
          customerEmail: email.trim(),
          customerName: fullName.trim(),
          checkoutId: generatedOrderId,
          recurring: hasSubscription
        });
      }
    } catch (_e) {}

    try {
      addLog('REQUEST', {
        endpoint: '/api/worldpay/session',
        method: 'POST',
        orderId: generatedOrderId,
        amount: finalTotalToPay.toFixed(2),
        mode: 'live'
      });

      const pendingOrderObj = {
        orderId: generatedOrderId,
        amount: finalTotalToPay.toFixed(2),
        total: finalTotalToPay,
        subtotal: Number(subtotalAfterDiscount.toFixed(2)),
        shippingCost: Number(deliveryCost.toFixed(2)),
        deliveryCost: Number(deliveryCost.toFixed(2)),
        deliveryMethod: 'Royal Mail Tracked 24/48',
        customerName: fullName,
        customerEmail: email,
        customerPhone: normalizeUkPhone(phone) || phone.trim(),
        destination: buildDestinationString(),
        shippingAddress: buildShippingAddress(),
        items: buildOrderItems(cartItems, currentDiscount),
        discountApplied: currentDiscount,
        discountAmount: Number(discountValue.toFixed(2)),
        storeCreditApplied: storeCreditApplied
      };
      localStorage.setItem(`ps_pending_order_${generatedOrderId}`, JSON.stringify(pendingOrderObj));

      // Initialize Worldpay HPP session for live payment
      const sessionRes = await fetch('/api/worldpay/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: generatedOrderId,
          amount: finalTotalToPay.toFixed(2),
          total: finalTotalToPay,
          subtotal: Number(subtotalAfterDiscount.toFixed(2)),
          shippingCost: Number(deliveryCost.toFixed(2)),
          deliveryCost: Number(deliveryCost.toFixed(2)),
          deliveryMethod: 'Royal Mail Tracked 24/48',
          customerName: fullName,
          customerEmail: email,
          customerPhone: normalizeUkPhone(phone) || phone.trim(),
          destination: buildDestinationString(),
          shippingAddress: buildShippingAddress(),
          items: pendingOrderObj.items,
          discountApplied: currentDiscount,
          discountAmount: Number(discountValue.toFixed(2)),
          storeCreditApplied: storeCreditApplied
        })
      });

      const sessionData = await safeParseJson(sessionRes);
      addLog('RESPONSE', sessionData);

      setIsProcessing(false);

      if (sessionRes.ok && sessionData.redirectUrl) {
        // Redirect to Worldpay Live HPP
        const url = sessionData.redirectUrl;
        setWorldpayRedirectUrl(url);
        setIsProcessingPayment(false);
        
        if (url.startsWith('http://') || url.startsWith('https://')) {
          const isIframe = window.self !== window.top;
          if (isIframe) {
            try {
              window.open(url, '_blank', 'noopener,noreferrer');
            } catch (_e) {
              window.location.href = url;
            }
          } else {
            window.location.href = url;
          }
          return;
        } else {
          window.location.href = url;
          return;
        }
      }

      // Handle error if payment gateway is not configured or session fails
      const errMsg = sessionData.message || sessionData.error || 'Worldpay Live Payment Gateway is currently unavailable. Please verify API credentials.';
      setPaymentError(errMsg);
      setIsProcessingPayment(false);

      try {
        const firstItem = cartItems[0];
        if (firstItem) {
          trackCheckoutFailed({
            id: firstItem.productId,
            name: firstItem.productTitle,
            price: finalTotalToPay,
            currency: 'GBP',
            recurring: Boolean(cartItems.some(i => i.isSubscription || i.productId?.startsWith('sub-pack-'))),
          }, errMsg);
        }
      } catch (_e) {}
      
    } catch (error: any) {
      console.error('[Checkout] Error:', error);
      addLog('ERROR', { message: error.message });
      setIsProcessing(false);
      setIsProcessingPayment(false);
      const errMsg = error.message || 'Failed to process payment';
      setPaymentError(errMsg);

      try {
        const firstItem = cartItems[0];
        if (firstItem) {
          trackCheckoutFailed({
            id: firstItem.productId,
            name: firstItem.productTitle,
            price: finalTotalToPay,
            currency: 'GBP',
            recurring: Boolean(cartItems.some(i => i.isSubscription || i.productId?.startsWith('sub-pack-'))),
          }, errMsg);
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
            <h2 className="text-2xl font-black text-slate-950">Processing Worldpay Payment</h2>
            <p className="text-slate-500 text-sm">
              Please complete your payment on the Worldpay secure portal.
            </p>
            <p className="text-slate-400 text-xs">
              Order #{orderId} • This page will update automatically once payment is confirmed.
            </p>
          </div>

          {worldpayRedirectUrl && (
            <div className="py-2">
              <a
                href={worldpayRedirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3.5 rounded-xl uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                <span>Open Worldpay Payment Page</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Waiting for payment confirmation...</span>
          </div>

          <div className="flex items-center justify-center gap-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => {
                if (orderId) {
                  pollPaymentStatus(orderId);
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
              <span className="text-slate-400 font-bold">Transaction ID:</span>
              <span className="font-mono font-bold text-slate-800">{paymentSuccessData.gatewayTxId}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-3 text-xs">
              <span className="text-slate-400 font-bold">Payment Method:</span>
              <span className="font-semibold text-slate-800">{paymentSuccessData.paymentMethod || paymentSuccessData.cardBrand}</span>
            </div>
            <div className="flex justify-between pt-1 text-sm font-black">
              <span className="text-slate-800 uppercase">Total Paid:</span>
              <span className="text-slate-950">£{paymentSuccessData.total?.toFixed(2) || '0.00'} GBP</span>
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

  // Subscription account check
  const hasSubscription = cartItems.some(item => 
    item.productId && (item.productId.startsWith('sub-pack') || item.productId.includes('sub-pack'))
  );

  if (hasSubscription && !loggedInCustomer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm space-y-6 flex flex-col items-center">
          <div className="p-4 bg-red-50 text-red-600 rounded-full w-16 h-16 flex items-center justify-center">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-3">
            <h2 className="text-xl font-black text-[#071d37] uppercase tracking-wider">Account Required</h2>
            <p className="text-slate-500 text-xs leading-relaxed max-w-md mx-auto">
              Your cart contains a subscription item. Please create an account or sign in to complete your purchase.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-2">
            <button
              onClick={() => onNavigate('frontend-account')}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest py-3.5 px-6 rounded-xl transition-all cursor-pointer"
            >
              Sign In / Create Account
            </button>
            <button
              onClick={() => onNavigate('frontend-shop')}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest py-3.5 px-6 rounded-xl transition-all cursor-pointer border border-slate-200"
            >
              Continue Shopping
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
                placeholder="07700 900123"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full text-xs p-3 border bg-slate-50/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 font-semibold ${
                  phone.trim() && !isPhoneValid ? 'border-red-300' : 'border-slate-250'
                }`}
              />
              <p className={`text-[10px] font-semibold ${phone.trim() && !isPhoneValid ? 'text-red-600' : 'text-slate-400'}`}>
                {phone.trim() && !isPhoneValid
                  ? 'Enter a valid UK phone number, for example 07700 900123.'
                  : 'Required. Used by Royal Mail for delivery updates and any problem with your parcel.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Street Address</label>
              <input
                type="text"
                required
                placeholder="Street address"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
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
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Postcode</label>
                <input
                  type="text"
                  required
                  placeholder="SW1A 1AA"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className={`w-full text-xs p-3 border bg-slate-50/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 font-semibold uppercase ${
                    postcode.trim() && !isPostcodeValid ? 'border-red-300' : 'border-slate-250'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Country</label>
                {/*
                  Fixed, not selectable. The store's Royal Mail contract only
                  carries UK services, so an overseas address cannot be shipped
                  at all — offering the choice would only produce orders that
                  have to be refunded.
                */}
                <div className="w-full text-xs p-3 border border-slate-250 bg-slate-100 rounded-xl font-bold text-slate-700 flex items-center justify-between">
                  <span>{UK_COUNTRY_NAME}</span>
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>
            </div>

            {postcode.trim() && !isPostcodeValid && (
              <p className="text-[10px] font-bold text-red-600">
                Please enter a valid UK postcode (for example SW1A 1AA). We deliver to UK addresses only.
              </p>
            )}

            <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <Truck className="h-4 w-4 text-slate-500 shrink-0 mt-px" />
              <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed">
                <span className="font-black text-slate-700">UK delivery only.</span> We ship to United Kingdom
                addresses exclusively and cannot accept international orders.
              </p>
            </div>

            {/* Delivery Info */}
            <div className="pt-2">
              <div className="border border-slate-800 bg-slate-50 ring-1 ring-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                <div className="text-left">
                  <span className="font-extrabold text-xs block text-slate-800 flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-red-600" /> Royal Mail Tracked
                  </span>
                  <span className="text-[10px] text-slate-500">Royal Mail 24/48 Tracked Delivery</span>
                  {isRewardFreeDelivery && (
                    <span className="text-[10px] text-emerald-700 font-black block pt-0.5">
                      Waived by your Free Delivery reward
                    </span>
                  )}
                </div>
                <span className={isFreeShipping ? "font-black text-xs text-emerald-600" : "font-black text-xs text-slate-800"}>
                  {isFreeShipping ? 'FREE' : `£${deliveryCost.toFixed(2)}`}
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
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-850">Worldpay Secure Live Payment</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-md mx-auto">
                    All transactions are securely routed through the official Worldpay Access Hosted Payment Gateway with 256-bit bank-grade encryption.
                  </p>
                </div>
                <div className="flex justify-center gap-6 text-[10px] text-slate-400 font-extrabold uppercase">
                  <span>✓ 256-bit SSL</span>
                  <span>✓ 3D Secure 2.0</span>
                  <span>✓ PCI-DSS Level 1</span>
                </div>
              </div>

              {/* Payment Buttons */}
              <div className="space-y-4">
                {/* AgeChecked Gate Integration */}
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
                      countrycode: country === 'United Kingdom' ? 'GB' : 'GB',
                      reference: orderId || `order-${Date.now()}`
                    }}
                  />
                </div>

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
                        <span>Complete Order with Store Credit (£0.00)</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-3.5">
                    {/* Worldpay Live Payment Action */}
                    <div className="p-5 border-2 border-slate-900 bg-white rounded-2xl space-y-4 shadow-sm">
                      <div className="flex justify-between items-center text-xs font-black text-slate-900 uppercase">
                        <span className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-emerald-600" /> Pay with Worldpay
                        </span>
                        <div className="flex items-center gap-1.5">
                          {hasSubscription && (
                            <span className="bg-indigo-100 text-indigo-900 text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">SUBSCRIPTION</span>
                          )}
                          <span className="bg-emerald-100 text-emerald-800 text-[9.5px] px-2.5 py-0.5 rounded-full font-mono font-extrabold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span> LIVE
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        You will be securely redirected to the official Worldpay Access Hosted Payment Page to authorize your payment.
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
                            <span>Connecting to Worldpay Live...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 text-emerald-400" />
                            {hasSubscription ? (
                              <span className="flex items-center gap-2 font-black text-amber-300">
                                <Repeat className="h-4 w-4 text-amber-400 shrink-0" />
                                Pay & Start Recurring Subscription (£{finalTotalToPay.toFixed(2)})
                              </span>
                            ) : (
                              <span>Pay with Worldpay (£{finalTotalToPay.toFixed(2)})</span>
                            )}
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
              {cartItems.map((item, idx) => {
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
                  <div key={idx} className="py-3 flex items-start gap-3.5 text-xs">
                    {isSubPack ? (
                      <div className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shadow-2xs">
                        <img
                          src={planImg}
                          alt={displayPlanName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-0.5 left-0.5 bg-slate-900/90 text-white text-[7.5px] font-black px-1 rounded uppercase">
                          {planSlug}
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.image}
                        alt={item.productTitle}
                        className="w-12 h-12 object-cover rounded-lg bg-slate-50 border border-slate-100 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-slate-800 text-[11px] leading-tight">
                        {isSubPack ? displayPlanName : item.productTitle}
                      </h4>
                      {isSubPack && item.subscriptionFrequency && (
                        <p className="text-[9.5px] font-bold text-indigo-600 mt-0.5">
                          {item.subscriptionFrequency} {item.frequencyDiscount ? `[${item.frequencyDiscount} OFF]` : ''}
                        </p>
                      )}
                      {isSubPack && subProducts.length > 0 && (
                        <div className="mt-1.5 space-y-0.5">
                          {subProducts.map((p, pIdx) => (
                            <p key={pIdx} className="text-[10px] text-slate-600 leading-tight">
                              • {p.brand ? <span className="font-bold text-slate-900">{p.brand} — </span> : null}
                              <span className="font-medium text-slate-800">{p.name}</span>
                              {p.variant && p.variant !== 'Standard' ? <span className="text-indigo-600"> — {p.variant}</span> : null}
                              <span className="text-slate-400 font-bold"> (Qty:{p.quantity || 1})</span>
                            </p>
                          ))}
                        </div>
                      )}
                      <p className="text-slate-400 text-[10px] font-bold mt-1">Qty: {item.quantity} × £{item.price.toFixed(2)}</p>
                    </div>
                    <span className="font-black text-slate-800 text-[11px] shrink-0">£{getItemTotal(item).toFixed(2)}</span>
                  </div>
                );
              })}
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
                      Apply Store Credit (£{loggedInCustomer.storeCredit.toFixed(2)} Available)
                    </label>
                  </div>
                </div>
                {applyStoreCredit && (
                  <p className="text-[10.5px] text-emerald-700 mt-2 font-medium leading-relaxed">
                    Applying £{Math.min(loggedInCustomer.storeCredit, finalTotal).toFixed(2)} Store Credit deduction.
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
                    : `Choose your free can${outstandingCans !== 1 ? 's' : ''} (${outstandingCans} to pick)`}
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
                <span className="text-slate-800">£{rawSubtotal.toFixed(2)}</span>
              </div>

              {currentDiscount && discountValue > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3" /> Discount
                  </span>
                  <span className="font-extrabold">-£{discountValue.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500">
                <span>Delivery</span>
                <span>{deliveryCost === 0 ? 'FREE' : `£${deliveryCost.toFixed(2)}`}</span>
              </div>

              {applyStoreCredit && storeCreditApplied > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Store Credit</span>
                  <span>-£{storeCreditApplied.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-150">
                <span>Total</span>
                <span className="text-base text-indigo-700 font-black">£{finalTotalToPay.toFixed(2)}</span>
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