/**
 * Checks the coupon carry-over repair's decision rules against made-up records.
 *
 *   npm run verify:coupon-carryover
 *
 * Read-only and offline: it imports `assessSubscription` alone, so no store is
 * opened and no customer is touched. That function decides whether to put a
 * live subscriber's price UP, so its guards — never cut a charge, never raise
 * by more than the coupon, never email twice — are worth exercising rather
 * than trusting, especially while no production row exercises them.
 */
import { assessSubscription } from './couponCarryover';

const plan = (price: number) => ({
  productId: 'sub-pack-core',
  price,
  quantity: 1,
  isSubscription: true
});

/** An order as checkout writes it: total is net of coupon and credit. */
const order = (o: {
  sub: number;
  shipping: number;
  coupon?: number;
  credit?: number;
  discountApplied?: any;
  extra?: any[];
}) => ({
  orderId: 'PS10001',
  items: [plan(o.sub), ...(o.extra || [])],
  shippingCost: o.shipping,
  total: Number((o.sub - (o.coupon || 0) + o.shipping - (o.credit || 0)).toFixed(2)),
  discountAmount: o.coupon || 0,
  storeCreditApplied: o.credit || 0,
  discountApplied: o.discountApplied ?? null
});

type Case = [name: string, sub: any, order: any, expect: string, amount?: number];

const cases: Case[] = [
  [
    'the reported bug: £20 plan, £2 coupon, stored at £20.99',
    { amount: 20.99 },
    order({ sub: 20, shipping: 2.99, coupon: 2 }),
    'correct',
    22.99
  ],
  [
    'store credit carried over: stored at £12.99',
    { amount: 12.99 },
    order({ sub: 20, shipping: 2.99, credit: 10 }),
    'correct',
    22.99
  ],
  [
    'coupon crossed the free-delivery threshold',
    { amount: 39.99 },
    order({ sub: 42, shipping: 2.99, coupon: 5 }),
    'correct',
    42
  ],
  [
    'no coupon at all — not this bug, left alone',
    { amount: 22.99 },
    order({ sub: 20, shipping: 2.99 }),
    'unaffected'
  ],
  [
    'already repaired by the fixed checkout',
    { amount: 22.99 },
    order({ sub: 20, shipping: 2.99, coupon: 2 }),
    'unaffected'
  ],
  [
    'already scheduled for the same amount — no second email',
    { amount: 20.99, pendingAmount: 22.99 },
    order({ sub: 20, shipping: 2.99, coupon: 2 }),
    'unaffected'
  ],
  [
    'stored amount is HIGHER than the recompute — never cut a charge',
    { amount: 30 },
    order({ sub: 20, shipping: 2.99, coupon: 2 }),
    'suspicious'
  ],
  [
    'rise would exceed the coupon (record does not match its order)',
    { amount: 5.7 },
    order({ sub: 20, shipping: 2.99, coupon: 2 }),
    'suspicious'
  ],
  [
    'one-off tin in the same basket is not billed again',
    { amount: 25.99 },
    order({ sub: 20, shipping: 2.99, coupon: 2, extra: [{ productId: 'tin-1', price: 5, quantity: 1 }] }),
    'suspicious' // recompute (£22.99) is LOWER than stored (£25.99): flagged, not cut
  ],
  [
    'free-delivery reward: recurring postage comes back',
    { amount: 20 },
    order({ sub: 20, shipping: 0, coupon: 0, credit: 3, discountApplied: { type: 'Free shipping' } }),
    'correct',
    22.99
  ]
];

let failed = 0;
for (const [name, sub, ord, expected, amount] of cases) {
  const v = assessSubscription(sub, ord);
  let ok = v.kind === expected;
  if (ok && amount !== undefined && v.kind === 'correct') {
    ok = Math.abs(v.newAmount - amount) < 0.005;
  }
  if (!ok) failed++;
  const got =
    v.kind === 'correct'
      ? `correct -> £${v.newAmount.toFixed(2)}`
      : v.kind === 'suspicious'
        ? `suspicious (${v.reason})`
        : 'unaffected';
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  console.log(`        stored £${Number(sub.amount).toFixed(2)} -> ${got}`);
}

console.log(`\n${cases.length - failed}/${cases.length} passed.`);
process.exit(failed ? 1 : 0);
