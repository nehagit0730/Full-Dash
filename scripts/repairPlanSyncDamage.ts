/**
 * Repairs orders and plans damaged by the old subscription "plan sync".
 *
 * Until this fix, /api/subscriptions/update-plan overwrote EVERY subscription
 * order a customer had with the plan's current tier and box, and the account
 * page called it silently on unrelated actions (adding a saved card, pausing).
 * On the account that reported it, paid LITE orders ended up recorded as PRO
 * with another order's box contents.
 *
 * Nothing here is invented. Every restored value comes from data already on
 * the same order that the old sync never touched:
 *   - `productTitle`        e.g. "LITE Plan (Recurring Renewal)"
 *   - `subscriptionSummary` e.g. "LITE Plan [Next Day (Test) - 10% OFF] - (77 20 mg Ghost Cola Ice (Qty:4), ...)"
 *
 * Usage (from the project root, against the database in .env):
 *
 *   npm run repair:plan-sync                      # report only — writes nothing
 *   npm run repair:plan-sync -- --email=a@b.com   # report for one customer
 *   npm run repair:plan-sync -- --apply           # repair orders
 *   npm run repair:plan-sync -- --apply --plans   # also repair plan records
 *
 * Before any write, the current orders and subscriptions are saved to
 * backups/plan-sync-repair-<timestamp>.json.
 *
 * Orders are only touched when they carry the old sync's own stamp,
 * `subscriptionDetails.lastSwappedAt` — nothing else ever wrote it — so an
 * order that was never damaged is never changed.
 *
 * Plan records carry no such stamp, so they are only changed with --plans, and
 * only where the plan's tier disagrees with the order that started it. Review
 * the report first: a customer who deliberately switched tier would show up
 * here too, and should be left alone.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fetchResource, saveResource } from '../serverDb';
import {
  findSubscriptionItem,
  getOrderSubscriptionId,
  isSubscriptionOrder,
  parseSubscriptionProducts,
  wasRewrittenByPlanSync
} from '../src/utils/subscriptionParser';
import { detectPlanTier } from '../src/utils/planImages';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const FIX_PLANS = args.includes('--plans');
const EMAIL = (args.find(a => a.startsWith('--email=')) || '').slice('--email='.length).toLowerCase().trim();

const BOX_FIELDS_ON_LINE = ['selectedProducts', 'selectedFlavors', 'subscriptionItems', 'items'];
const BOX_FIELDS_ON_DETAILS = ['items', 'selectedProducts', 'subItems'];

const tierLabel = (tier: string | null) => (tier ? `${tier.toUpperCase()} Plan` : null);
const summaryOf = (order: any) => {
  const line = findSubscriptionItem(order);
  // `productTitle` is the same untouched record when the order predates
  // `subscriptionSummary`: it carries the plan and the box, e.g.
  // "LITE Plan [Next Day (Test) - 10% OFF] - (WHITE FOX 22.5 mg — Full Charge (Qty:6))".
  // Without this fallback those orders reported "no summary" and had their box
  // deleted, throwing away the only remaining record of what to actually ship.
  return String(
    line?.subscriptionSummary || order?.subscriptionSummary || line?.productTitle || ''
  ).trim();
};
const trueTierOf = (order: any) => {
  const line = findSubscriptionItem(order);
  return detectPlanTier(line?.productTitle) || detectPlanTier(line?.subscriptionSummary) || detectPlanTier(order?.subscriptionSummary);
};
const describeBox = (items: any[]) =>
  items.map(i => `${i.name}${i.variant ? ` ${i.variant}` : ''} x${i.quantity}`).join(', ') || '(none)';

/** The order with its damaged fields replaced from its own summary and title. */
function repairOrder(order: any, catalog: any[]): { repaired: any; notes: string[] } | null {
  const line = findSubscriptionItem(order);
  const tier = trueTierOf(order);
  const summary = summaryOf(order);
  if (!line || (!tier && !summary)) return null;

  // With the stamp present, parseSubscriptionProducts reads the untouched summary.
  const box = summary ? parseSubscriptionProducts(order, line, catalog) : [];
  const notes: string[] = [];

  const items = (order.items || []).map((it: any) => {
    if (it !== line) return it;
    const next: any = { ...it };
    const plan = tierLabel(tier);
    if (plan && next.subscriptionPlan !== plan) {
      notes.push(`subscriptionPlan "${it.subscriptionPlan}" -> "${plan}"`);
      next.subscriptionPlan = plan;
    }
    if (box.length > 0) {
      for (const field of BOX_FIELDS_ON_LINE) next[field] = box;
    } else {
      // No summary to rebuild from: the damaged box is removed rather than
      // left describing a box the customer never ordered.
      for (const field of BOX_FIELDS_ON_LINE) delete next[field];
    }
    return next;
  });

  const details: any = { ...(order.subscriptionDetails || {}) };
  const plan = tierLabel(tier);
  if (plan && details.planName !== plan) {
    notes.push(`subscriptionDetails.planName "${details.planName}" -> "${plan}"`);
    details.planName = plan;
  }
  for (const field of BOX_FIELDS_ON_DETAILS) {
    if (box.length > 0) details[field] = box;
    else delete details[field];
  }
  notes.push(box.length > 0 ? `box restored from summary: ${describeBox(box)}` : 'box: no summary on this order, damaged box removed');
  delete details.lastSwappedAt;
  details.restoredFromPlanSyncAt = new Date().toISOString();

  // The old sync also set `total` to the plan's price. Put it back only when
  // the order's own recorded breakdown says what was actually charged.
  const next: any = { ...order, items, subscriptionDetails: details };
  const sub = Number(order?.data?.subtotal);
  const ship = Number(order?.data?.shippingCost ?? order?.data?.deliveryCost ?? 0);
  if (Number.isFinite(sub) && sub > 0) {
    const charged = Number((sub + (Number.isFinite(ship) ? ship : 0)).toFixed(2));
    if (Math.abs(charged - Number(order.total)) > 0.009) {
      notes.push(`total £${Number(order.total).toFixed(2)} -> £${charged.toFixed(2)} (from recorded subtotal + shipping)`);
      next.total = charged;
    }
  }

  return { repaired: next, notes };
}

async function main() {
  const [orders, subscriptions, products] = await Promise.all([
    fetchResource('orders'),
    fetchResource('subscriptions'),
    fetchResource('products')
  ]);
  const inScope = (email: any) => !EMAIL || String(email || '').toLowerCase().trim() === EMAIL;

  console.log(`\n${APPLY ? 'APPLYING' : 'REPORT ONLY (nothing will be written)'}${EMAIL ? ` — ${EMAIL}` : ''}\n`);

  // ---- Orders ----------------------------------------------------------
  const orderFixes = new Map<string, any>();
  for (const order of orders) {
    if (!order || !inScope(order.customerEmail) || !isSubscriptionOrder(order) || !wasRewrittenByPlanSync(order)) continue;
    const result = repairOrder(order, products);
    if (!result) {
      console.log(`ORDER ${order.id} (${order.customerEmail}): damaged, but has no title or summary to restore from — left as is`);
      continue;
    }
    orderFixes.set(String(order.id), result.repaired);
    console.log(`ORDER ${order.id} (${order.customerEmail})`);
    result.notes.forEach(n => console.log(`   ${n}`));
  }
  if (orderFixes.size === 0) console.log('No damaged orders found.');

  // ---- Plan records ----------------------------------------------------
  const planFixes = new Map<string, any>();
  const subOrders = orders.filter((o: any) => o && isSubscriptionOrder(o));
  for (const plan of subscriptions) {
    if (!plan || !inScope(plan.customerEmail) || String(plan.status || '').toLowerCase() === 'deleted') continue;
    const linked = subOrders
      .filter((o: any) => getOrderSubscriptionId(o) === String(plan.id) || String(o.id) === String(plan.sourceOrderId || ''))
      .sort((a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    const source = linked[0];
    if (!source) continue;

    const orderTier = trueTierOf(source);
    const planTier = detectPlanTier(plan.planName);
    if (!orderTier || orderTier === planTier) continue;

    const fixedSource = orderFixes.get(String(source.id)) || source;
    const line = findSubscriptionItem(fixedSource);
    const box = parseSubscriptionProducts(fixedSource, line, products);
    const summary = summaryOf(source);
    const restored = {
      ...plan,
      // The tier label is the plan's name ("LITE Plan"); the summary is the long
      // "PLAN [freq] - (contents)" string and only stands in if no tier was
      // detected. Preferring the summary here put that whole string in the name
      // the customer sees on their account page.
      planName: tierLabel(orderTier) || summary,
      planId: line?.productId || orderTier,
      // `fixedSource`, not `source`: the plan bills what the order was actually
      // charged, and on a damaged order that is the repaired total, not the
      // plan price the old sync stamped over it.
      amount: Number(fixedSource.total) || Number(source.total) || plan.amount,
      ...(box.length > 0 ? { items: box, cansCount: box.reduce((n: number, i: any) => n + (Number(i.quantity) || 0), 0) } : {}),
      updatedAt: new Date().toISOString(),
      restoredFromOrderId: String(source.id)
    };
    planFixes.set(String(plan.id), restored);
    console.log(`PLAN ${plan.id} (${plan.customerEmail}) — started by order ${source.id}`);
    console.log(`   now:      ${plan.planName} · £${Number(plan.amount).toFixed(2)} · ${plan.cansCount ?? '?'} cans · ${plan.status}`);
    console.log(`   restore:  ${restored.planName} · £${Number(restored.amount).toFixed(2)} · ${restored.cansCount ?? '?'} cans`);
  }
  if (planFixes.size === 0) console.log('No plan records disagree with their orders.');

  if (!APPLY) {
    console.log(`\nNothing written. Re-run with --apply to repair ${orderFixes.size} order(s)` +
      (planFixes.size ? `, and add --plans to also restore ${planFixes.size} plan record(s).` : '.'));
    return;
  }

  // ---- Backup, then write ------------------------------------------------
  const backupDir = path.join(process.cwd(), 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, `plan-sync-repair-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backupFile, JSON.stringify({ orders, subscriptions }, null, 2));
  console.log(`\nBackup written: ${backupFile}`);

  if (orderFixes.size > 0) {
    // The full list goes back, so no order is dropped; only the fixed ones differ.
    await saveResource('orders', orders.map((o: any) => orderFixes.get(String(o?.id)) || o));
    console.log(`Repaired ${orderFixes.size} order(s).`);
  }
  if (FIX_PLANS && planFixes.size > 0) {
    await saveResource('subscriptions', subscriptions.map((s: any) => planFixes.get(String(s?.id)) || s));
    console.log(`Restored ${planFixes.size} plan record(s).`);
  } else if (planFixes.size > 0) {
    console.log(`Plan records left unchanged (${planFixes.size} listed above). Add --plans to restore them.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Repair failed:', err);
    process.exit(1);
  });
