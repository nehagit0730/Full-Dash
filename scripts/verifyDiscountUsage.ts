/**
 * Checks the one-use-per-customer matching rules against made-up records.
 *
 *   npm run verify:discount-usage
 *
 * Read-only and offline: it imports `discountUsageRules` alone, so no store is
 * opened and no customer is touched. These rules decide whether a shopper's
 * coupon is accepted at checkout, so both directions matter — a wrong refusal
 * turns away a legitimate sale, a wrong acceptance gives the discount away
 * again.
 */
import {
  findPriorUseIn,
  isSameDiscount,
  resolveOnePerCustomer
} from '../backend/services/discountUsageRules';

const SUMMER = { id: 'disc-summer20', title: 'SUMMER20', limitOnePerCustomer: true };

const order = (o: {
  id: string;
  email: string;
  discount: any;
  fulfillmentStatus?: string;
}) => ({
  id: o.id,
  customerEmail: o.email,
  discountApplied: o.discount,
  fulfillmentStatus: o.fulfillmentStatus || 'Unfulfilled'
});

let failed = 0;
const check = (name: string, got: boolean, want: boolean) => {
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
};

console.log('-- identity --');
check('same id, different typed title', isSameDiscount(SUMMER, { id: 'disc-summer20', title: 'NEH-SUMMER20' }), true);
check('different id', isSameDiscount(SUMMER, { id: 'disc-winter10', title: 'WINTER10' }), false);
check('no ids: title match ignores prefix punctuation', isSameDiscount({ title: 'SUMMER20' }, { title: 'summer 20' }), true);
check('no ids: different titles', isSameDiscount({ title: 'SUMMER20' }, { title: 'WINTER10' }), false);
check('id wins over a title that happens to match', isSameDiscount({ id: 'a', title: 'X' }, { id: 'b', title: 'X' }), false);

console.log('\n-- which codes are limited --');
check('stored discount says limited', resolveOnePerCustomer(SUMMER, { ...SUMMER, limitOnePerCustomer: false }), true);
check('stored discount says unlimited, payload lies', resolveOnePerCustomer({ ...SUMMER, limitOnePerCustomer: false }, { ...SUMMER, limitOnePerCustomer: true }), false);
check('referral code is always limited', resolveOnePerCustomer(null, { id: 'disc-ref-virtual-c1', title: 'FRIEND', limitOnePerCustomer: false }), true);
check('loyalty reward is not limited', resolveOnePerCustomer(null, { id: 'disc-loyalty-bronze1', title: 'NEH-BRONZE1', limitOnePerCustomer: false }), false);

console.log('\n-- prior use --');
const history = [
  order({ id: 'PS100', email: 'sam@example.com', discount: { id: 'disc-summer20', title: 'SAM-SUMMER20' } }),
  order({ id: 'PS101', email: 'other@example.com', discount: SUMMER }),
  order({ id: 'PS102', email: 'sam@example.com', discount: { id: 'disc-winter10', title: 'WINTER10' } }),
  order({ id: 'PS103', email: 'cancel@example.com', discount: SUMMER, fulfillmentStatus: 'Cancelled' }),
  order({ id: 'PS104', email: 'renew@example.com', discount: null })
];
const used = (email: string, exclude?: string) =>
  Boolean(findPriorUseIn(history, email, SUMMER, exclude));

check('same customer, prefixed code on the old order', used('sam@example.com'), true);
check('email case and spacing ignored', used('  SAM@Example.com '), true);
check('a different customer does not block', used('nobody@example.com'), false);
check('another code by the same customer does not block', Boolean(findPriorUseIn(history, 'sam@example.com', { id: 'disc-autumn', title: 'AUTUMN' })), false);
check('a cancelled order releases the code', used('cancel@example.com'), false);
check('a renewal order carries no discount', used('renew@example.com'), false);
check('an order does not block itself on retry', used('sam@example.com', 'PS100'), false);
check('excluding a different order still blocks', used('sam@example.com', 'PS999'), true);
check('no email, nothing to match', used(''), false);

console.log(`\n${failed === 0 ? 'All checks passed.' : `${failed} check(s) FAILED.`}`);
process.exit(failed ? 1 : 0);
