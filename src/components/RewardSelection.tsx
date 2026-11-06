import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, Package, Pencil, Sparkles } from 'lucide-react';
import { Discount } from '../types';
import { LoyaltyRewardChoice } from '../utils/discountUtils';
import { getRewardLines } from '../utils/rewardLines';

interface RewardChoicePickerProps {
  isOpen: boolean;
  choices: LoyaltyRewardChoice[];
  rewardLabel?: string;
  onChoose: (choiceId: string) => void;
  onCancel: () => void;
}

/**
 * The reward menu on a multi-option milestone — the Platinum odd-order reward,
 * where the customer takes one of free cans, store credit, free delivery,
 * merchandise or a mystery reward.
 */
export function RewardChoicePicker({
  isOpen,
  choices,
  rewardLabel,
  onChoose,
  onCancel
}: RewardChoicePickerProps) {
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
            className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          >
            <div className="px-5 sm:px-6 py-4 bg-[#071d37] text-white flex items-start justify-between gap-3 shrink-0">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#dfa047] shrink-0" />
                  <h2 className="text-sm font-black uppercase tracking-widest">Choose your reward</h2>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {rewardLabel || 'Platinum odd-order reward'} — pick one.
                </p>
              </div>
              <button
                onClick={onCancel}
                aria-label="Close reward chooser"
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-2 overflow-y-auto">
              {choices.map(choice => (
                <button
                  key={choice.id}
                  onClick={() => onChoose(choice.id)}
                  className="w-full text-left border border-slate-200 hover:border-[#dfa047] hover:bg-amber-50/40 rounded-2xl p-3.5 cursor-pointer transition-all group"
                >
                  <p className="text-[12px] font-black text-[#071d37] group-hover:text-[#071d37]">{choice.label}</p>
                  <p className="text-[10.5px] font-semibold text-slate-500 pt-0.5">{choice.details}</p>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface AppliedRewardLinesProps {
  discount?: Discount | null;
  /** Shown when the reward's cans can still be changed. */
  onEditSelection?: () => void;
  compact?: boolean;
}

/**
 * The £0 lines a reward adds to the order — chosen free cans with their brand
 * and flavour, and gift artwork such as the mystery box. Rendered in the cart,
 * at checkout and on the confirmed order so the customer can always see the
 * reward is actually included.
 */
export function AppliedRewardLines({ discount, onEditSelection, compact = false }: AppliedRewardLinesProps) {
  const lines = getRewardLines(discount);
  if (lines.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9.5px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-1.5">
          <Gift className="h-3 w-3" />
          Included free with this order
        </span>
        {onEditSelection && (
          <button
            onClick={onEditSelection}
            className="text-[9px] font-black uppercase tracking-wider text-[#071d37] hover:text-[#dfa047] cursor-pointer flex items-center gap-1"
          >
            <Pencil className="h-2.5 w-2.5" />
            Change
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        {lines.map((line, index) => (
          <div
            key={`${line.productId}-${line.sku}-${index}`}
            className="flex items-center gap-2.5 bg-emerald-50/60 border border-emerald-200 rounded-xl p-2"
          >
            <div className={`${compact ? 'h-9 w-9' : 'h-11 w-11'} shrink-0 rounded-lg bg-white border border-emerald-100 overflow-hidden flex items-center justify-center`}>
              {line.image ? (
                <img
                  src={line.image}
                  alt={line.productTitle}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Package className="h-4 w-4 text-slate-300" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              {line.rewardKind === 'free-cans' ? (
                <>
                  <span className="text-[8.5px] font-black uppercase tracking-widest text-[#dfa047] block truncate">
                    {line.vendor || 'Pouch Supply'}
                  </span>
                  <p className="text-[11px] font-black text-[#071d37] leading-tight truncate">{line.productTitle}</p>
                  <p className="text-[10px] font-bold text-slate-500 truncate">{line.variant}</p>
                </>
              ) : (
                <>
                  <span className="text-[8.5px] font-black uppercase tracking-widest text-violet-600 block">
                    Reward gift
                  </span>
                  <p className="text-[11px] font-black text-[#071d37] leading-tight">{line.productTitle}</p>
                </>
              )}
            </div>

            <span className="text-[10px] font-black uppercase text-emerald-700 shrink-0">£0.00</span>
          </div>
        ))}
      </div>
    </div>
  );
}
