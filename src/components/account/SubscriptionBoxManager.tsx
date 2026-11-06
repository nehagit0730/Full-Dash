import React, { useEffect, useMemo, useState } from 'react';
import { Product } from '../../types';
import { AlertTriangle, Check, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';

/**
 * Box editor for ONE subscription.
 *
 * Everything here is scoped to the subscription passed in, not to the customer:
 * a customer with two plans edits each independently, and saving one never
 * rewrites the other.
 *
 * A line is a product AND a chosen variant. The same product can appear twice
 * under different flavours — that is the point of "6 of Product A, or 4 of A and
 * 2 of B" — so `productId` alone cannot identify a line.
 */

export interface BoxLine {
  /** `${productId}::${variantId || 'main'}` — unique per product+flavour pair. */
  key: string;
  productId: string;
  /** Empty when the product has no variants at all. */
  variantId: string;
  title: string;
  variantName: string;
  brand: string;
  quantity: number;
  price: number;
  image: string;
}

interface SubscriptionBoxManagerProps {
  /** The subscription being edited. Its id scopes every save. */
  subscription: any;
  allProducts: Product[];
  /** How many cans the customer's plan includes. */
  capacity: number;
  /** True for a cancelled plan: contents are shown but not editable. */
  disabled?: boolean;
  /** Ultimate allows more than the headline count; the other tiers are exact. */
  allowOverCapacity?: boolean;
  onSave: (lines: BoxLine[]) => Promise<void> | void;
  saving?: boolean;
}

const lineKey = (productId: string, variantId?: string) => `${productId}::${variantId || 'main'}`;

function variantsOf(product?: Product) {
  return (product?.concreteVariants || []).filter(v => v && (v.id || v.name));
}

function variantImage(product: Product, variantId?: string): string {
  const variant = variantsOf(product).find(v => v.id === variantId);
  if (variant && Array.isArray(variant.images) && variant.images[0]) return variant.images[0];
  return product.image;
}

function variantPrice(product: Product, variantId?: string): number {
  const variant = variantsOf(product).find(v => v.id === variantId);
  return Number(variant?.price ?? product.price ?? 0);
}

/**
 * Turns whatever the subscription recorded into editable lines.
 *
 * Stored items come from several eras of this codebase — some carry a
 * `variantId`, some only a `variant` name, some neither — so each is matched
 * back to the live catalogue rather than trusted verbatim. A product that no
 * longer exists is kept as a line with the details it was saved with, because
 * silently dropping it would change the customer's box behind their back.
 */
export function linesFromSubscription(subscription: any, allProducts: Product[]): BoxLine[] {
  const rawItems: any[] = Array.isArray(subscription?.items)
    ? subscription.items
    : Array.isArray(subscription?.subItems)
    ? subscription.subItems
    : [];

  const lines: BoxLine[] = [];

  for (const raw of rawItems) {
    if (!raw) continue;
    const productId = String(raw.productId || raw.id || '');
    const product = allProducts.find(p => p.id === productId) ||
      allProducts.find(p => (p.title || '').toLowerCase() === String(raw.productTitle || raw.name || raw.title || '').toLowerCase());

    const variants = variantsOf(product);
    const rawVariantName = String(raw.variantName || raw.variant || raw.flavour || '').trim();
    const matchedVariant =
      variants.find(v => v.id === String(raw.variantId || '')) ||
      variants.find(v => (v.name || '').toLowerCase() === rawVariantName.toLowerCase());

    const quantity = Math.max(1, Number(raw.quantity) || 1);
    const resolvedId = product?.id || productId || rawVariantName || `item-${lines.length}`;
    const key = lineKey(resolvedId, matchedVariant?.id);

    const existing = lines.find(l => l.key === key);
    if (existing) {
      existing.quantity += quantity;
      continue;
    }

    lines.push({
      key,
      productId: resolvedId,
      variantId: matchedVariant?.id || '',
      title: product?.title || String(raw.productTitle || raw.name || raw.title || 'Subscription item'),
      variantName: matchedVariant?.name || rawVariantName,
      brand: String(product?.vendor || raw.brand || raw.vendor || ''),
      quantity,
      price: product ? variantPrice(product, matchedVariant?.id) : Number(raw.price) || 0,
      image: product ? variantImage(product, matchedVariant?.id) : String(raw.image || '')
    });
  }

  return lines;
}

export default function SubscriptionBoxManager({
  subscription,
  allProducts,
  capacity,
  disabled = false,
  allowOverCapacity = false,
  onSave,
  saving = false
}: SubscriptionBoxManagerProps) {
  const subscriptionId = String(subscription?.id || '');
  const [lines, setLines] = useState<BoxLine[]>(() => linesFromSubscription(subscription, allProducts));
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState('');
  // Which flavour is chosen in the "add" catalogue, per product.
  const [addVariantByProduct, setAddVariantByProduct] = useState<Record<string, string>>({});
  const [addQtyByProduct, setAddQtyByProduct] = useState<Record<string, number>>({});
  const [notice, setNotice] = useState<string | null>(null);

  // Switching between plans has to reload the box; without keying on the id, the
  // second plan opens showing the first plan's contents.
  useEffect(() => {
    setLines(linesFromSubscription(subscription, allProducts));
    setDirty(false);
    setNotice(null);
    setAddVariantByProduct({});
    setAddQtyByProduct({});
  }, [subscriptionId, allProducts]);

  const totalCans = useMemo(() => lines.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0), [lines]);
  const remaining = Math.max(0, capacity - totalCans);
  const isExact = allowOverCapacity ? totalCans >= capacity : totalCans === capacity;
  const isOver = !allowOverCapacity && totalCans > capacity;

  const applyLines = (next: BoxLine[]) => {
    setLines(next.filter(l => l.quantity > 0));
    setDirty(true);
  };

  const changeQuantity = (key: string, delta: number) => {
    if (disabled) return;
    if (delta > 0 && remaining <= 0 && !allowOverCapacity) {
      setNotice(`Your ${capacity}-can plan is full. Reduce another flavour first, or swap one out.`);
      return;
    }
    setNotice(null);
    applyLines(
      lines.map(l => (l.key === key ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l))
    );
  };

  const removeLine = (key: string) => {
    if (disabled) return;
    setNotice(null);
    applyLines(lines.filter(l => l.key !== key));
  };

  /**
   * Changes the flavour of a line the customer already has, keeping its quantity.
   * If that flavour is already in the box it is merged rather than duplicated.
   */
  const changeVariant = (key: string, variantId: string) => {
    if (disabled) return;
    const line = lines.find(l => l.key === key);
    if (!line) return;
    const product = allProducts.find(p => p.id === line.productId);
    if (!product) return;

    const variant = variantsOf(product).find(v => v.id === variantId);
    const nextKey = lineKey(line.productId, variant?.id);
    if (nextKey === line.key) return;

    const existing = lines.find(l => l.key === nextKey);
    const updated: BoxLine = {
      ...line,
      key: nextKey,
      variantId: variant?.id || '',
      variantName: variant?.name || '',
      price: variantPrice(product, variant?.id),
      image: variantImage(product, variant?.id)
    };

    setNotice(null);
    applyLines(
      existing
        ? lines
            .filter(l => l.key !== line.key)
            .map(l => (l.key === nextKey ? { ...l, quantity: l.quantity + line.quantity } : l))
        : lines.map(l => (l.key === line.key ? updated : l))
    );
  };

  /** Adds a product (at the chosen flavour) as a new line, or tops up an existing one. */
  const addProduct = (product: Product) => {
    if (disabled) return;
    const variants = variantsOf(product);
    const variantId = variants.length > 0 ? (addVariantByProduct[product.id] || variants[0].id) : '';
    const requested = Math.max(1, Number(addQtyByProduct[product.id]) || 1);

    if (!allowOverCapacity && requested > remaining) {
      setNotice(
        remaining === 0
          ? `Your ${capacity}-can plan is full. Reduce a flavour in your box first, then add this one.`
          : `Only ${remaining} can${remaining === 1 ? '' : 's'} left in your ${capacity}-can plan. Reduce another flavour to add more.`
      );
      return;
    }

    const key = lineKey(product.id, variantId);
    const existing = lines.find(l => l.key === key);
    setNotice(null);

    applyLines(
      existing
        ? lines.map(l => (l.key === key ? { ...l, quantity: l.quantity + requested } : l))
        : [
            ...lines,
            {
              key,
              productId: product.id,
              variantId,
              title: product.title,
              variantName: variants.find(v => v.id === variantId)?.name || '',
              brand: String(product.vendor || ''),
              quantity: requested,
              price: variantPrice(product, variantId),
              image: variantImage(product, variantId)
            }
          ]
    );
    setAddQtyByProduct(prev => ({ ...prev, [product.id]: 1 }));
  };

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allProducts;
    return allProducts.filter(
      p =>
        (p.title || '').toLowerCase().includes(term) ||
        (p.vendor || '').toLowerCase().includes(term) ||
        variantsOf(p).some(v => (v.name || '').toLowerCase().includes(term))
    );
  }, [allProducts, search]);

  const handleSave = async () => {
    if (disabled) return;
    if (!isExact) {
      setNotice(
        isOver
          ? `Your box holds ${totalCans} cans but your plan allows ${capacity}. Reduce a quantity before saving.`
          : `Your box has ${totalCans} of ${capacity} cans. Add ${capacity - totalCans} more before saving.`
      );
      return;
    }
    setNotice(null);
    await onSave(lines);
    setDirty(false);
  };

  return (
    <div className="space-y-6">
      {/* ---------- Your Active Box Lineup ---------- */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-[#071d37] uppercase tracking-wider">
              Your Active Box Lineup
            </h3>
            <p className="text-slate-400 text-[11px]">
              {subscription?.planName ? `${subscription.planName} — ` : ''}
              Change quantities, swap a flavour, or replace a product entirely.
            </p>
          </div>
          <span
            className={`shrink-0 inline-block text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
              isExact
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isOver
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            Box Capacity: {totalCans} / {capacity} Cans
          </span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
          <div
            className={`h-full transition-all duration-300 ${
              isExact ? 'bg-emerald-500' : isOver ? 'bg-rose-500' : 'bg-[#dfa047]'
            }`}
            style={{ width: `${Math.min(100, capacity > 0 ? (totalCans / capacity) * 100 : 0)}%` }}
          />
        </div>

        {notice && (
          <div className="flex items-start gap-2 p-3 rounded-2xl text-[11px] leading-relaxed border bg-amber-50 border-amber-200 text-amber-800 font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{notice}</span>
          </div>
        )}

        {lines.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            This box is empty. Choose flavours from the catalogue below to fill your {capacity} cans.
          </div>
        ) : (
          <div className="space-y-3">
            {lines.map(line => {
              const product = allProducts.find(p => p.id === line.productId);
              const variants = variantsOf(product);

              return (
                <div
                  key={line.key}
                  className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl"
                >
                  <div className="flex items-center gap-3 w-full lg:w-auto min-w-0">
                    <img
                      src={line.image}
                      alt={line.title}
                      className="w-12 h-12 object-cover rounded-xl bg-white border border-slate-200 shrink-0 shadow-2xs"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      {line.brand && (
                        <span className="text-[9px] text-[#dfa047] font-bold uppercase tracking-wider">{line.brand}</span>
                      )}
                      <h4 className="text-xs font-black text-[#071d37] truncate">{line.title}</h4>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {line.variantName ? (
                          <span className="text-slate-600">Flavour: {line.variantName}</span>
                        ) : (
                          'No flavour options'
                        )}
                        {' • '}£{Number(line.price || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 lg:gap-3 w-full lg:w-auto border-t lg:border-t-0 pt-2 lg:pt-0">
                    {/* Swap Flavours: the product's own variants, not other products. */}
                    {variants.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                          Swap Flavour
                        </label>
                        <select
                          value={line.variantId || variants[0].id}
                          disabled={disabled}
                          onChange={e => changeVariant(line.key, e.target.value)}
                          className="text-[10.5px] font-bold text-[#071d37] bg-white border border-slate-200 py-1.5 px-2 rounded-xl hover:border-[#dfa047] transition-all cursor-pointer outline-none focus:ring-1 focus:ring-[#071d37] disabled:bg-slate-100 disabled:cursor-not-allowed max-w-[190px]"
                        >
                          {variants.map(v => (
                            <option key={v.id || v.name} value={v.id}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold">Single flavour</span>
                    )}

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                        Quantity
                      </label>
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => changeQuantity(line.key, -1)}
                          className="w-7 h-7 flex items-center justify-center text-xs font-bold text-[#071d37] hover:bg-slate-100 rounded-lg cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label={`Reduce ${line.title}`}
                        >
                          −
                        </button>
                        <span className="text-xs font-black text-[#071d37] min-w-[18px] text-center">{line.quantity}</span>
                        <button
                          type="button"
                          disabled={disabled || (!allowOverCapacity && remaining <= 0)}
                          onClick={() => changeQuantity(line.key, 1)}
                          className="w-7 h-7 flex items-center justify-center text-xs font-bold text-[#071d37] hover:bg-slate-100 rounded-lg cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label={`Add another ${line.title}`}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => removeLine(line.key)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed self-end"
                      title="Remove from box"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500">
            {isExact
              ? `Your box is complete at ${totalCans} of ${capacity} cans.`
              : isOver
              ? `${totalCans - capacity} can(s) over your plan. Reduce a quantity to save.`
              : `${remaining} can${remaining === 1 ? '' : 's'} left to choose.`}
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {dirty && !disabled && (
              <button
                type="button"
                onClick={() => {
                  setLines(linesFromSubscription(subscription, allProducts));
                  setDirty(false);
                  setNotice(null);
                }}
                className="flex-1 sm:flex-initial bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all cursor-pointer"
              >
                Discard changes
              </button>
            )}
            <button
              type="button"
              disabled={disabled || saving || !dirty}
              onClick={handleSave}
              className="flex-1 sm:flex-initial bg-[#071d37] hover:bg-[#0c2e56] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-[11px] uppercase tracking-wider py-2.5 px-5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#dfa047]" /> : <Check className="w-3.5 h-3.5 text-[#dfa047]" />}
              {saving ? 'Saving box...' : dirty ? 'Save box' : 'Box saved'}
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Add / replace products ---------- */}
      {!disabled && (
        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-[#071d37] uppercase tracking-wider">
                Add Premium Flavors to Box
              </h3>
              <p className="text-slate-400 text-[11px]">
                Pick a flavour and a quantity, then add it. To replace a product, reduce its quantity above and add the
                replacement here.
              </p>
            </div>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products or flavours"
                className="w-full text-[11px] font-semibold border border-slate-200 rounded-xl py-2 pl-8 pr-3 outline-none focus:ring-1 focus:ring-[#071d37]"
              />
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">No products match “{search}”.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredProducts.map(prod => {
                const variants = variantsOf(prod);
                const selectedVariantId = variants.length > 0 ? (addVariantByProduct[prod.id] || variants[0].id) : '';
                const qty = Math.max(1, Number(addQtyByProduct[prod.id]) || 1);
                const inBox = lines
                  .filter(l => l.productId === prod.id)
                  .reduce((sum, l) => sum + l.quantity, 0);

                return (
                  <div
                    key={`box-add-${prod.id}`}
                    className="flex flex-col gap-2.5 bg-[#f4f6f9] border border-slate-100 p-3 rounded-2xl"
                  >
                    <div className="flex gap-3">
                      <img
                        src={variantImage(prod, selectedVariantId)}
                        alt={prod.title}
                        className="w-[52px] h-[52px] object-cover rounded-xl bg-white border border-slate-100 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] text-[#dfa047] font-bold uppercase tracking-wider">{prod.vendor}</span>
                        <h4 className="text-xs font-black text-[#071d37] truncate">{prod.title}</h4>
                        <span className="text-[11px] font-extrabold text-slate-800">
                          £{variantPrice(prod, selectedVariantId).toFixed(2)}
                        </span>
                        {inBox > 0 && (
                          <span className="ml-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                            {inBox} in box
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Flavour for the product being added — the same product can
                        be added again under a different flavour. */}
                    {variants.length > 0 && (
                      <select
                        value={selectedVariantId}
                        onChange={e => setAddVariantByProduct(prev => ({ ...prev, [prod.id]: e.target.value }))}
                        className="w-full text-[10.5px] font-bold text-[#071d37] bg-white border border-slate-200 py-1.5 px-2 rounded-xl outline-none focus:ring-1 focus:ring-[#071d37] cursor-pointer"
                      >
                        {variants.map(v => (
                          <option key={v.id || v.name} value={v.id}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => setAddQtyByProduct(prev => ({ ...prev, [prod.id]: Math.max(1, qty - 1) }))}
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold text-[#071d37] hover:bg-slate-100 rounded-lg cursor-pointer"
                          aria-label={`Fewer ${prod.title}`}
                        >
                          −
                        </button>
                        <span className="text-[11px] font-black text-[#071d37] min-w-[16px] text-center">{qty}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setAddQtyByProduct(prev => ({
                              ...prev,
                              [prod.id]: allowOverCapacity ? qty + 1 : Math.min(Math.max(1, remaining), qty + 1)
                            }))
                          }
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold text-[#071d37] hover:bg-slate-100 rounded-lg cursor-pointer"
                          aria-label={`More ${prod.title}`}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => addProduct(prod)}
                        disabled={!allowOverCapacity && remaining <= 0}
                        className="text-[10px] font-black text-[#071d37] bg-white border border-slate-200 py-1.5 px-2.5 rounded-lg hover:border-[#dfa047] hover:bg-[#dfa047] hover:text-white transition-all cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add to Box
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
