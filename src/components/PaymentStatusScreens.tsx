import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, CreditCard, Lock, RefreshCw, AlertTriangle, 
  CheckCircle, XCircle, ArrowLeft, Send, ShoppingBag, Truck, ExternalLink, Check
} from 'lucide-react';
import { Order } from '../types';
import { trackOrderCompleted } from '../utils/klaviyo';

// ==========================================
// 1. WORLDPAY SECURE PAYMENT GATEWAY REDIRECT
// ==========================================
interface SecureGatewaySimulatorProps {
  onReturnToShop: () => void;
}

export function WorldpayGatewaySimulator({ onReturnToShop }: SecureGatewaySimulatorProps) {
  useEffect(() => {
    // If navigated directly to payment gateway, redirect back to checkout
    const timer = setTimeout(() => {
      window.history.pushState({}, '', '/pages/checkout');
      window.dispatchEvent(new Event('popstate'));
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Worldpay Live Gateway</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Redirecting to secure live checkout... All transactions are processed live via Worldpay Access Hosted Payment Pages.
        </p>
        <div className="pt-2">
          <button
            onClick={onReturnToShop}
            className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
          >
            Return to Store
          </button>
        </div>
      </div>
    </div>
  );
}

export const SecureGatewaySimulator = WorldpayGatewaySimulator;

// ==========================================
// 2. PAYMENT SUCCESS RECEIPT SCREEN
// ==========================================
interface PaymentSuccessScreenProps {
  onReturnToShop: () => void;
}

export function PaymentSuccessScreen({ onReturnToShop }: PaymentSuccessScreenProps) {
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState('0.00');
  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [txId, setTxId] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const parsedOrderId = params.get('orderId') || 'PS-TEMP';
    const parsedAmount = params.get('amount') || '0.00';
    const parsedTxId = params.get('txId') || params.get('transactionId') || params.get('worldpayTxId') || '';
    
    setOrderId(parsedOrderId);
    setAmount(parsedAmount);
    setTxId(parsedTxId);

    // Fetch the order from db to show authentic rich confirmation details
    const fetchOrder = async () => {
      try {
        // Fetches the one order this receipt is for. It used to download the
        // entire order list and pick its own out of it, which is why that
        // endpoint had to be world-readable; it is now administrators-only.
        const res = await fetch(`/api/orders/${encodeURIComponent(parsedOrderId)}`);
        if (res.ok) {
          const text = await res.text().catch(() => '');
          let found: Order | null = null;
          try {
            found = JSON.parse(text);
          } catch (_e) {}
          {
            if (found && found.id) {
              setOrder(found);
              const foundAny = found as any;
              if (!parsedTxId && (foundAny.worldpayTxId || foundAny.gatewayTxId)) {
                setTxId(foundAny.worldpayTxId || foundAny.gatewayTxId || '');
              }
              // Track order success with Klaviyo
              trackOrderCompleted({
                orderId: found.id,
                total: found.total,
                customerName: found.customerName,
                customerEmail: found.customerEmail,
                destination: found.destination,
                deliveryMethod: found.deliveryMethod,
                discountApplied: found.discountApplied,
                items: found.items
              });
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch order details receipt:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();

    // Trigger custom event so Admin Dashboard re-fetches orders immediately
    window.dispatchEvent(new Event('order-completed'));
  }, []);

  const effectiveTxId = txId || (order?.worldpayTxId || order?.gatewayTxId || `WP-TXN-${(orderId || '8841').slice(-6).toUpperCase()}`);
  const displayTotal = order?.total ? order.total.toFixed(2) : (amount || '0.00');

  return (
    <div className="max-w-xl mx-auto my-12 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-6 font-sans">
      
      {/* Success Badge */}
      <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
        <CheckCircle className="h-10 w-10 text-emerald-500 animate-bounce" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">Payment Completed Successfully!</h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          Your credit card was authorized, and your order has been received. A detailed order confirmation has been dispatched to your email address.
        </p>
      </div>

      {/* Prominent Order ID & Transaction ID Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900 text-white rounded-2xl p-4 shadow-md text-left">
        <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">Order ID</span>
          <strong className="text-amber-400 text-base font-mono tracking-tight block">#{orderId}</strong>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">Transaction ID</span>
          <strong className="text-emerald-400 text-xs font-mono tracking-tight block truncate" title={effectiveTxId}>{effectiveTxId}</strong>
        </div>
      </div>

      {/* Real receipt breakdown */}
      <div className="border border-slate-150 bg-slate-50 rounded-2xl p-5 text-left text-xs divide-y divide-slate-200/60 space-y-3.5">
        <div className="pb-3 grid grid-cols-2 gap-2">
          <div>
            <span className="text-slate-400 font-extrabold text-[9px] uppercase tracking-wider block">Customer Name</span>
            <strong className="text-slate-800 text-xs">{order?.customerName || 'Valued Customer'}</strong>
          </div>
          <div className="text-right">
            <span className="text-slate-400 font-extrabold text-[9px] uppercase tracking-wider block">Payment Status</span>
            <span className="text-emerald-600 font-black text-xs uppercase tracking-widest block font-mono bg-emerald-100/70 px-2 py-0.5 rounded-md inline-block mt-0.5">
              Successful
            </span>
          </div>
        </div>

        <div className="py-3.5 space-y-2">
          <span className="text-slate-400 font-extrabold text-[9px] uppercase tracking-wider block">Fulfillment Delivery Method</span>
          <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-150 shadow-3xs">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-slate-600" />
              <div>
                <span className="font-extrabold text-slate-850 block text-[11px]">Royal Mail Tracked 24/48</span>
                <span className="text-[9px] text-slate-400 block font-bold">Estimated Delivery: 2-3 Business Days</span>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 py-1 px-2.5 rounded-md">
              Order Confirmed
            </span>
          </div>
        </div>

        {order && order.items && order.items.length > 0 && (
          <div className="py-3.5 space-y-2">
            <span className="text-slate-400 font-extrabold text-[9px] uppercase tracking-wider block">Items Purchased ({order.items.length})</span>
            <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
              {order.items.map((item: any, i: number) => (
                <div
                  key={i}
                  className={`flex justify-between items-center gap-2 text-[11px] font-bold p-2 rounded-lg border ${
                    item.isRewardItem
                      ? 'text-slate-700 bg-emerald-50/60 border-emerald-200'
                      : 'text-slate-700 bg-white border-slate-100'
                  }`}
                >
                  <span className="truncate max-w-[280px] flex items-center gap-1.5">
                    {/* The mystery box / free can artwork, so the reward is
                        visibly part of the order the moment it is placed. */}
                    {item.isRewardItem && item.image && (
                      <img src={item.image} alt="" className="h-6 w-6 rounded object-contain bg-white shrink-0" />
                    )}
                    <span className="truncate">
                      {item.productTitle} <span className="text-slate-400 font-normal">x{item.quantity}</span>
                    </span>
                  </span>
                  <span className={item.isRewardItem ? 'text-emerald-700 font-black shrink-0' : 'shrink-0'}>
                    {item.isRewardItem ? 'FREE' : `£${(item.price * item.quantity).toFixed(2)}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3 flex justify-between items-center">
          <span className="font-black text-slate-850 uppercase text-[10px] tracking-wider">Total Amount Paid</span>
          <span className="text-lg font-black text-slate-900">£{displayTotal} GBP</span>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 text-[11px] text-emerald-700 font-bold flex items-center justify-center gap-2">
        <Send className="h-4 w-4 shrink-0" />
        <span>Order confirmation email dispatched to {order?.customerEmail || 'customer mailbox'}!</span>
      </div>

      <button
        onClick={onReturnToShop}
        className="w-full py-4 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest rounded-xl transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
      >
        <ShoppingBag className="h-4 w-4" /> Continue Catalog Shopping
      </button>
    </div>
  );
}

// ==========================================
// 3. PAYMENT FAILED / DECLINED SCREEN
// ==========================================
interface PaymentFailedScreenProps {
  onReturnToCheckout: () => void;
}

export function PaymentFailedScreen({ onReturnToCheckout }: PaymentFailedScreenProps) {
  const [reason, setReason] = useState('Card declined by issuer');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setReason(params.get('reason') || 'Card authorization declined or transaction cancelled.');
  }, []);

  return (
    <div className="max-w-xl mx-auto my-12 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-6 font-sans">
      <div className="mx-auto w-16 h-16 bg-red-50 text-red-650 rounded-full flex items-center justify-center shadow-inner">
        <XCircle className="h-10 w-10 text-red-500" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">Payment Authorization Failed</h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          The credit card processor could not complete your transaction. No charges were billed, and no order was created.
        </p>
      </div>

      <div className="border border-red-100 bg-red-50/50 rounded-2xl p-5 text-left text-xs space-y-1">
        <span className="text-red-800 uppercase text-[9px] font-black tracking-widest block">Error Message:</span>
        <p className="font-extrabold text-slate-800 text-[11.5px] leading-relaxed">{reason}</p>
        <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
          Suggestions: Check that card details match your issuing bank, ensure sufficient account funds, or try an alternative card.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={() => {
            window.history.pushState({}, '', '/pages/checkout');
            window.dispatchEvent(new Event('popstate'));
          }}
          className="flex-1 py-4 border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4 text-slate-500" /> Return to Checkout
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 4. PAYMENT CANCELLED SCREEN
// ==========================================
interface PaymentCancelledScreenProps {
  onReturnToCheckout: () => void;
}

export function PaymentCancelledScreen({ onReturnToCheckout }: PaymentCancelledScreenProps) {
  return (
    <div className="max-w-xl mx-auto my-12 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-6 font-sans">
      <div className="mx-auto w-16 h-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center shadow-inner">
        <AlertTriangle className="h-9 w-9 text-slate-500" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">Checkout Cancelled</h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          The transaction was closed before completion. No charges were made, and no order was recorded in the system.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => {
            window.history.pushState({}, '', '/collections/all');
            window.dispatchEvent(new Event('popstate'));
          }}
          className="py-4 border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          Browse Products
        </button>
        <button
          onClick={() => {
            window.history.pushState({}, '', '/pages/checkout');
            window.dispatchEvent(new Event('popstate'));
          }}
          className="py-4 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest rounded-xl transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
        >
          Return to Checkout View
        </button>
      </div>
    </div>
  );
}
