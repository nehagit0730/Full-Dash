import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Check, Plus, Minus, Gift, Package, AlertCircle } from 'lucide-react';
import { FreeCanSelection, Product } from '../types';
import { SelectableCan, buildCanCatalogue, canToSelection, selectionKey } from '../utils/rewardLines';

interface FreeCanPickerProps {
  isOpen: boolean;
  /** How many cans this reward grants. */
  count: number;
  products: Product[];
  /** Cans already chosen, so reopening the picker resumes the selection. */
  initialSelections?: FreeCanSelection[];
  rewardLabel?: string;
  onConfirm: (selections: FreeCanSelection[]) => void;
  onCancel: () => void;
}

export default function FreeCanPicker({
  isOpen,
  count,
  products,
  initialSelections = [],
  rewardLabel,
  onConfirm,
  onCancel
}: FreeCanPickerProps) {
  const catalogue = useMemo(() => buildCanCatalogue(products), [products]);

  // Selections are keys into the catalogue, repeated when the customer wants
  // more than one of the same flavour.
  const [chosenKeys, setChosenKeys] = useState<string[]>(() =>
    initialSelections.map(selectionKey)
  );
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('all');

  const brands = useMemo(() => {
    const set = new Set<string>();
    catalogue.forEach(can => { if (can.vendor) set.add(can.vendor); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [catalogue]);

  const visibleCans = useMemo(() => {
    const term = search.trim().toLowerCase();
    return catalogue.filter(can => {
      if (brandFilter !== 'all' && can.vendor !== brandFilter) return false;
      if (!term) return true;
      return (
        can.productTitle.toLowerCase().includes(term) ||
        can.vendor.toLowerCase().includes(term) ||
        can.variantName.toLowerCase().includes(term) ||
        (can.strength || '').toLowerCase().includes(term)
      );
    });
  }, [catalogue, search, brandFilter]);

  const chosenCount = chosenKeys.length;
  const remaining = Math.max(count - chosenCount, 0);
  const isComplete = chosenCount === count;

  const countFor = (key: string) => chosenKeys.filter(k => k === key).length;

  const addCan = (can: SelectableCan) => {
    if (remaining <= 0) return;
    if (can.inventory <= 0) return;
    // Never promise more of a flavour than is in stock.
    if (countFor(can.key) >= can.inventory) return;
    setChosenKeys(prev => [...prev, can.key]);
  };

  const removeCan = (key: string) => {
    setChosenKeys(prev => {
      const index = prev.lastIndexOf(key);
      if (index === -1) return prev;
      return [...prev.slice(0, index), ...prev.slice(index + 1)];
    });
  };

  const handleConfirm = () => {
    if (!isComplete) return;
    const byKey = new Map(catalogue.map(can => [can.key, can]));
    const selections: FreeCanSelection[] = [];
    for (const key of chosenKeys) {
      const can = byKey.get(key);
      if (can) selections.push(canToSelection(can));
    }
    onConfirm(selections);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs"
            onClick={onCancel}
          />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="relative z-10 w-full sm:max-w-3xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 bg-[#071d37] text-white flex items-start justify-between gap-3 shrink-0">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-[#dfa047] shrink-0" />
                  <h2 className="text-sm font-black uppercase tracking-widest truncate">
                    Choose your free {count === 1 ? 'can' : `${count} cans`}
                  </h2>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {rewardLabel ? `${rewardLabel} — ` : ''}
                  Pick any {count === 1 ? 'can' : `${count} cans`} from the range. Added to your order at £0.00.
                </p>
              </div>
              <button
                onClick={onCancel}
                aria-label="Close free can picker"
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Progress + filters */}
            <div className="px-5 sm:px-6 py-3 border-b border-slate-150 bg-slate-50 space-y-3 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                  {chosenCount} of {count} selected
                </span>
                <div className="flex gap-1.5">
                  {Array.from({ length: count }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-2 w-6 rounded-full transition-colors ${
                        i < chosenCount ? 'bg-emerald-500' : 'bg-slate-250 border border-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search brand, product or flavour…"
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-250 bg-white focus:outline-hidden focus:border-[#dfa047] font-semibold text-slate-700"
                  />
                </div>
                <select
                  value={brandFilter}
                  onChange={e => setBrandFilter(e.target.value)}
                  aria-label="Filter by brand"
                  className="text-xs px-3 py-2 rounded-lg border border-slate-250 bg-white font-bold text-slate-700 uppercase tracking-wider cursor-pointer focus:outline-hidden focus:border-[#dfa047]"
                >
                  <option value="all">All brands</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Can grid */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4">
              {visibleCans.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Package className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">No cans match that search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visibleCans.map(can => {
                    const qty = countFor(can.key);
                    const outOfStock = can.inventory <= 0;
                    const canAddMore = !outOfStock && remaining > 0 && qty < can.inventory;

                    return (
                      <div
                        key={can.key}
                        className={`border rounded-2xl p-3 flex gap-3 transition-all ${
                          qty > 0
                            ? 'border-emerald-300 bg-emerald-50/50 shadow-xs'
                            : outOfStock
                              ? 'border-slate-200 bg-slate-50 opacity-60'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="h-16 w-16 shrink-0 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                          {can.image ? (
                            <img
                              src={can.image}
                              alt={`${can.vendor} ${can.variantName}`}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-slate-300" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-[#dfa047] block truncate">
                            {can.vendor || 'Pouch Supply'}
                          </span>
                          <p className="text-[11.5px] font-black text-[#071d37] leading-tight truncate">
                            {can.productTitle}
                          </p>
                          <p className="text-[10.5px] font-bold text-slate-600 truncate">
                            {can.variantName}
                            {can.strength ? ` · ${can.strength}` : ''}
                          </p>

                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <span className="text-[10px] font-bold text-slate-400">
                              <s>£{can.price.toFixed(2)}</s>{' '}
                              <span className="text-emerald-700 font-black">FREE</span>
                            </span>

                            {outOfStock ? (
                              <span className="text-[9px] font-black uppercase text-rose-600 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Out of stock
                              </span>
                            ) : qty > 0 ? (
                              <div className="flex items-center gap-1.5 bg-white border border-emerald-200 rounded-lg px-1 py-0.5">
                                <button
                                  onClick={() => removeCan(can.key)}
                                  aria-label={`Remove ${can.variantName}`}
                                  className="p-1 rounded hover:bg-emerald-50 text-emerald-700 cursor-pointer"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="text-[11px] font-black text-[#071d37] w-4 text-center">{qty}</span>
                                <button
                                  onClick={() => addCan(can)}
                                  disabled={!canAddMore}
                                  aria-label={`Add another ${can.variantName}`}
                                  className="p-1 rounded hover:bg-emerald-50 text-emerald-700 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addCan(can)}
                                disabled={remaining <= 0}
                                className="text-[9.5px] font-black uppercase tracking-wider bg-[#071d37] text-white px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-[#0a2a4f] disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                Choose
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-6 py-4 border-t border-slate-150 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <p className="text-[11px] font-bold text-slate-500 text-center sm:text-left">
                {isComplete
                  ? 'All set — your free cans are ready.'
                  : `Choose ${remaining} more can${remaining !== 1 ? 's' : ''} to continue.`}
              </p>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={onCancel}
                  className="flex-1 sm:flex-none text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl border border-slate-250 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!isComplete}
                  className="flex-1 sm:flex-none text-[11px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  Confirm selection
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
