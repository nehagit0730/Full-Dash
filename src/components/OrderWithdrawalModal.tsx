import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, FileText, CheckCircle2, AlertCircle, ShoppingBag, Package, RefreshCw, Undo } from 'lucide-react';
import { Order } from '../types';

/** What the withdrawal lookup returns — only what the form needs to show. */
interface WithdrawalOrder {
  id: string;
  customerName: string;
  date?: string;
  total: number;
  alreadyRequested?: boolean;
  items: Array<{ productId: string; productTitle: string; price: number; quantity: number; image?: string }>;
}

interface OrderWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onConfirmWithdrawal: (orderId: string, email: string, name: string, selectedItems: string[]) => void;
}

export default function OrderWithdrawalModal({
  isOpen,
  onClose,
  orders,
  onConfirmWithdrawal,
}: OrderWithdrawalModalProps) {
  const [name, setName] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * The order, as the SERVER confirms it.
   *
   * This used to be looked up in the `orders` prop. That list is whatever the
   * app happens to hold — for a signed-out visitor it is empty, and the
   * withdrawal form is reachable from the footer while signed out, so no order
   * ever matched and the form could not be used at all. The server checks the
   * order number and the email together and returns only the lines that can be
   * withdrawn.
   */
  const [matchedOrder, setMatchedOrder] = useState<WithdrawalOrder | null>(null);
  const [isLooking, setIsLooking] = useState(false);

  useEffect(() => {
    const id = orderNumber.trim().replace(/^#/, '');
    const mail = email.trim();
    if (!id || !mail.includes('@')) {
      setMatchedOrder(null);
      return;
    }

    let cancelled = false;
    setIsLooking(true);
    // Debounced: the pair is checked as it is typed, and a keystroke should not
    // fire a request.
    const handle = setTimeout(async () => {
      try {
        const res = await fetch('/api/orders/withdrawal/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: id, email: mail })
        });
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        setMatchedOrder(res.ok && data?.order ? data.order : null);
      } catch {
        if (!cancelled) setMatchedOrder(null);
      } finally {
        if (!cancelled) setIsLooking(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(handle);
      clearTimeout(handle);
    };
  }, [orderNumber, email]);

  // Set all items selected by default when order is matched
  React.useEffect(() => {
    if (matchedOrder) {
      setSelectedItems(matchedOrder.items.map((i) => i.productId));
    } else {
      setSelectedItems([]);
    }
    setError(null);
  }, [matchedOrder]);

  const handleToggleItem = (productId: string) => {
    setSelectedItems((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!orderNumber.trim()) {
      setError('Order number is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!matchedOrder) {
      setError(
        'We could not find an order with that number and email address. Please check both against your order confirmation email.'
      );
      return;
    }
    if (selectedItems.length === 0) {
      setError('Please select at least one item to withdraw.');
      return;
    }

    setIsSubmitting(true);
    try {
      // The request is RECORDED here. It used to be a one-second setTimeout
      // followed by a receipt screen, with nothing saved and nobody told.
      const res = await fetch('/api/orders/withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: matchedOrder.id,
          email: email.trim(),
          name: name.trim() || matchedOrder.customerName,
          selectedItems
        })
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || data?.success !== true) {
        setError(data?.error || 'We could not register the request. Please try again.');
        return;
      }

      onConfirmWithdrawal(matchedOrder.id, email.trim(), name.trim() || matchedOrder.customerName, selectedItems);
      setIsSubmitted(true);
    } catch {
      setError('We could not reach the server. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setOrderNumber('');
    setEmail('');
    setSelectedItems([]);
    setError(null);
    setIsSubmitted(false);
    setMatchedOrder(null);
  };

  const handleCloseAndReset = () => {
    onClose();
    // Delay resetting state slightly so user doesn't see modal content change while it fades out
    setTimeout(() => {
      handleReset();
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop mask */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseAndReset}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-150 overflow-hidden z-10 my-8"
          >
            {/* Elegant header bar */}
            <div className="flex items-center justify-between border-b border-slate-150 bg-slate-50/50 p-5 px-6">
              <div className="flex items-center gap-2.5 text-[#008060]">
                <div className="p-1.5 bg-[#e3f5e9] rounded-lg border border-[#c8ebd3]">
                  <Undo className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                  Order Withdrawal Form
                </h2>
              </div>
              <button
                onClick={handleCloseAndReset}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable contents */}
            <div className="max-h-[75vh] overflow-y-auto p-6 md:p-8">
              {!isSubmitted ? (
                <form onSubmit={handleConfirmSubmit} className="space-y-6">
                  {/* Explanatory introduction */}
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">Your details</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Please enter your email and order number. The merchant uses this data for manual matching.
                    </p>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-4">
                    {/* Name field (Optional) */}
                    <div>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                          Name
                        </label>
                        <span className="text-[9px] font-medium text-slate-400">Optional: your name</span>
                      </div>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-xs p-3 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] bg-slate-50/50 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                      />
                    </div>

                    {/* Order number * (Required) */}
                    <div>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                          Order number *
                        </label>
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-wide">Required</span>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="#1001"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        className={`w-full text-xs p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] bg-slate-50/50 transition-all font-mono font-bold text-slate-800 placeholder:text-slate-400 ${
                          matchedOrder
                            ? 'border-[#c8ebd3] bg-[#f4faf6] text-emerald-800'
                            : 'border-slate-250'
                        }`}
                      />
                      <p className="text-[10px] text-slate-450 mt-1.5 font-medium">
                        Required field. Please enter the order number as shown in your confirmation.
                      </p>
                    </div>

                    {/* DYNAMIC LIST OF ORDER ITEMS FOR WITHDRAWAL */}
                    {orderNumber.trim() && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
                          Withdrawal Items Matcher
                        </span>

                        {matchedOrder ? (
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-[11px] font-bold text-[#008060] bg-[#e3f5e9] p-2 rounded-lg border border-[#c8ebd3]">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#008060]" />
                                <span>Verified Order: #{matchedOrder.id}</span>
                              </div>
                              <span className="text-slate-600">Total: ${matchedOrder.total.toFixed(2)}</span>
                            </div>

                            <p className="text-[11px] text-slate-500">
                              Choose which products you want to include in this withdrawal contract:
                            </p>

                            <div className="divide-y divide-slate-150 max-h-48 overflow-y-auto pr-1 bg-white border border-slate-200 rounded-lg">
                              {matchedOrder.items.map((item) => {
                                const isSelected = selectedItems.includes(item.productId);
                                return (
                                  <div
                                    key={item.productId}
                                    onClick={() => handleToggleItem(item.productId)}
                                    className={`p-3 flex items-center gap-3 cursor-pointer select-none transition-all hover:bg-slate-50 ${
                                      isSelected ? 'bg-emerald-50/30' : ''
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      className="rounded border-slate-300 text-[#008060] focus:ring-[#008060] h-3.5 w-3.5 cursor-pointer"
                                      checked={isSelected}
                                      onChange={() => {}} // Handled by onClick of container
                                    />
                                    {item.image && (
                                      <img
                                        src={item.image}
                                        alt={item.productTitle}
                                        className="h-8 w-8 object-cover rounded-md border border-slate-200 shrink-0 bg-slate-50"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-slate-800 truncate">
                                        {item.productTitle}
                                      </p>
                                      <p className="text-[10px] text-slate-450 font-medium">
                                        {item.quantity} unit{item.quantity > 1 ? 's' : ''} • ${(item.price).toFixed(2)} each
                                      </p>
                                    </div>
                                    <span className="text-xs font-bold text-slate-800 pr-1 font-mono">
                                      ${(item.price * item.quantity).toFixed(2)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="py-4 text-center text-slate-400 text-xs">
                            <ShoppingBag className="h-5 w-5 mx-auto mb-1.5 text-slate-300 animate-pulse" />
                            <span>Type a valid order number above to preview item list...</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Email * (Required) */}
                    <div>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                          Email *
                        </label>
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-wide">Required</span>
                      </div>
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-xs p-3 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] bg-slate-50/50 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                      />
                      <p className="text-[10px] text-slate-450 mt-1.5 font-medium">
                        Your confirmation will be sent to this address.
                      </p>
                    </div>
                  </div>

                  {/* Error display */}
                  {error && (
                    <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2.5 text-xs animate-shake">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Actions buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-150">
                    <button
                      type="button"
                      onClick={handleCloseAndReset}
                      className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-2 py-3 bg-[#008060] hover:bg-[#006e52] text-white rounded-xl text-xs font-black uppercase tracking-widest transition shadow-md hover:shadow-lg disabled:opacity-65 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <span>Confirm Withdrawal</span>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* SUCCESSFUL STATE */
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-6 text-center space-y-6"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-[#e3f5e9] text-[#008060] rounded-full border-4 border-[#bfe7cb] shadow-xs">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Withdrawal Request Submitted!
                    </h3>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      Thank you, <strong className="text-slate-800">{name || (matchedOrder ? matchedOrder.customerName : 'Customer')}</strong>. 
                      Your withdrawal declaration has been successfully recorded for Order <strong className="text-slate-800">#{orderNumber}</strong>.
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      A confirmation email containing the withdrawal summary documents has been dispatched to <strong className="font-semibold text-slate-700">{email}</strong>.
                    </p>
                  </div>

                  {/* Withdrawn Items summary list */}
                  {matchedOrder && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left max-w-md mx-auto">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-450 block mb-2">
                        Summary of Withdrawn Items
                      </span>
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {matchedOrder.items
                          .filter((i) => selectedItems.includes(i.productId))
                          .map((item) => (
                            <div key={item.productId} className="flex items-center justify-between text-xs py-1">
                              <span className="text-slate-700 font-medium truncate max-w-[250px]">
                                {item.productTitle}
                              </span>
                              <span className="text-slate-400 text-[10px] whitespace-nowrap">
                                {item.quantity} x ${(item.price).toFixed(2)}
                              </span>
                            </div>
                          ))}
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-slate-200 flex justify-between text-xs font-bold text-slate-800">
                        <span>Fulfillment Action:</span>
                        <span className="text-amber-600">Pending Manual Match</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 max-w-xs mx-auto">
                    <button
                      type="button"
                      onClick={handleCloseAndReset}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
                    >
                      Close Confirmation
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
