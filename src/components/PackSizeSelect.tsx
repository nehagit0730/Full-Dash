import React from 'react';
import { PACK_SIZES, calculateVolumePrice } from '../utils';

interface PackSizeSelectProps {
  /** Unit price of the product this card is for — the pack prices scale off it. */
  unitPrice: number;
  /** The quantity currently selected on the card. */
  quantity: number;
  /** Called with the chosen pack size. */
  onChange: (quantity: number) => void;
  /** Disables the control, e.g. for an out-of-stock product. */
  disabled?: boolean;
}

/**
 * Pack size chooser for a product card.
 *
 * Every option carries its own total, so the saving is visible before the pack
 * is chosen rather than only after the price block re-renders. Prices come from
 * `calculateVolumePrice`, the same function the card, the cart and the checkout
 * all price against — there is no separate pack price to keep in step.
 *
 * The card keeps its -/+ stepper, so the quantity can be a number that is not one
 * of the packs. That is shown as its own leading option rather than letting the
 * dropdown sit on a stale pack label.
 */
export const PackSizeSelect: React.FC<PackSizeSelectProps> = ({
  unitPrice,
  quantity,
  onChange,
  disabled = false
}) => {
  const isPackSize = PACK_SIZES.includes(quantity);

  return (
    <select
      value={isPackSize ? String(quantity) : 'custom'}
      disabled={disabled}
      aria-label="Choose pack size"
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        e.stopPropagation();
        const next = Number(e.target.value);
        // The "custom" option is not a quantity — it only reports what the
        // stepper has been set to, so selecting it changes nothing.
        if (Number.isFinite(next) && next > 0) onChange(next);
      }}
      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[11px] font-extrabold rounded-xl h-9 px-2.5 cursor-pointer transition-colors hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {!isPackSize && (
        <option value="custom">
          {quantity} {quantity === 1 ? 'can' : 'cans'} — £{calculateVolumePrice(unitPrice, quantity).toFixed(2)}
        </option>
      )}
      {PACK_SIZES.map((size) => (
        <option key={size} value={size}>
          Pack of {size} — £{calculateVolumePrice(unitPrice, size).toFixed(2)}
        </option>
      ))}
    </select>
  );
};

export default PackSizeSelect;
