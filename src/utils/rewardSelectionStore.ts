import { FreeCanSelection } from '../types';

/**
 * Remembers which cans a customer picked for a loyalty reward, so a selection
 * made on the loyalty rewards page is still theirs when they apply the same
 * voucher code in the cart or at checkout.
 *
 * Deliberately kept out of discountUtils: that module is imported by the server,
 * which has no localStorage.
 */

const STORAGE_KEY = 'ps_reward_selections_v1';

export interface StoredSelection {
  freeCanSelections?: FreeCanSelection[];
  rewardChoiceId?: string;
}

type SelectionMap = Record<string, StoredSelection>;

/** Reward codes are entered in any case; the store is keyed on one form. */
function normalizeCode(code: string): string {
  return String(code || '').trim().toUpperCase();
}

function readAll(): SelectionMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed as SelectionMap : {};
  } catch (_e) {
    // Private windows and cleared site data both throw here; a forgotten
    // selection is recoverable, a crashed cart is not.
    return {};
  }
}

function writeAll(map: SelectionMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (_e) {
    /* Storage unavailable — the selection simply is not remembered. */
  }
}

export function saveRewardSelection(code: string, selection: StoredSelection): void {
  const key = normalizeCode(code);
  if (!key) return;
  const map = readAll();
  map[key] = { ...map[key], ...selection };
  writeAll(map);
}

export function loadRewardSelection(code: string): StoredSelection | null {
  const key = normalizeCode(code);
  if (!key) return null;
  return readAll()[key] || null;
}

export function clearRewardSelection(code: string): void {
  const key = normalizeCode(code);
  if (!key) return;
  const map = readAll();
  if (!(key in map)) return;
  delete map[key];
  writeAll(map);
}
