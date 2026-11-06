/**
 * Backfill orders that exist as StoreResource blobs but never reached the typed
 * `Order` table.
 *
 * Two bugs put orders in that state:
 *   1. saveSingleOrder handed the whole order object to prisma.order.upsert().
 *      The object carries `deliveryCost` and `shippingAddress`, which are not
 *      columns, so Prisma threw `Unknown argument` and the failure was logged as
 *      a warning and ignored.
 *   2. saveResource did not await syncToPrismaModel(), so on a serverless deploy
 *      the invocation ended before the write reached Neon.
 *
 * The admin order list merges StoreResource and the Order table, so such an
 * order still appeared in the dashboard while being absent from the database.
 * Both bugs are fixed; this repairs the rows they already left behind.
 *
 * Usage:
 *   npx tsx scripts/repairMissingOrderRows.ts            # dry run, reports only
 *   npx tsx scripts/repairMissingOrderRows.ts --apply    # writes the rows
 *
 * Run it against production by pointing DATABASE_URL at that branch:
 *   DATABASE_URL="postgres://...prod..." npx tsx scripts/repairMissingOrderRows.ts --apply
 */
import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { upsertOrderRow } from '../src/lib/orderRow';

const APPLY = process.argv.includes('--apply');
const tag = APPLY ? '[APPLY]' : '[DRY-RUN]';

async function main() {
  const url = process.env.DATABASE_URL || '';
  console.log(`${tag} target: ${url.replace(/:\/\/[^@]*@/, '://***@') || '(DATABASE_URL not set)'}`);
  if (!url) process.exit(1);

  const blobs = await prisma.storeResource.findMany({ where: { resource: 'orders' } });
  const rows = await prisma.order.findMany({ select: { id: true } });
  const present = new Set(rows.map(r => String(r.id)));

  console.log(`${tag} StoreResource orders: ${blobs.length} | Order table rows: ${rows.length}`);

  const missing = blobs
    .map(b => b.data as any)
    .filter(o => o && o.id && !present.has(String(o.id)));

  if (missing.length === 0) {
    console.log(`${tag} Nothing to repair — every stored order has a row in the Order table.`);
    await prisma.$disconnect();
    return;
  }

  console.log(`${tag} ${missing.length} order(s) missing from the Order table:`);
  for (const o of missing) {
    console.log(`  ${o.id} | ${o.date} | ${o.customerEmail} | £${o.total} | ${o.fulfillmentStatus}`);
  }

  if (!APPLY) {
    console.log(`\n${tag} Re-run with --apply to write these rows.`);
    await prisma.$disconnect();
    return;
  }

  let ok = 0;
  for (const o of missing) {
    if (await upsertOrderRow(o)) ok++;
    else console.error(`  FAILED: ${o.id}`);
  }

  const after = await prisma.order.count();
  console.log(`\n${tag} Repaired ${ok}/${missing.length}. Order table now holds ${after} row(s).`);
  await prisma.$disconnect();
}

main().catch(async err => {
  console.error('[repairMissingOrderRows] Failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
