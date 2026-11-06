/**
 * Full read-only export of every Neon table to a timestamped JSON file.
 *
 * Run before any schema migration or backfill:
 *   npx tsx scripts/dbBackup.ts
 *
 * Target a specific database (e.g. a Neon branch) with:
 *   DATABASE_URL="postgres://..." npx tsx scripts/dbBackup.ts
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';

const TABLES: Array<[string, () => Promise<any[]>]> = [
  ['products', () => prisma.product.findMany()],
  ['collections', () => prisma.collection.findMany()],
  ['files', () => prisma.fileEntry.findMany()],
  ['orders', () => prisma.order.findMany()],
  ['customPages', () => prisma.customPage.findMany()],
  ['customers', () => prisma.customer.findMany()],
  ['blogs', () => prisma.blogPost.findMany()],
  ['discounts', () => prisma.discount.findMany()],
  ['subscriptions', () => prisma.subscription.findMany()],
  ['layoutSettings', () => prisma.layoutSetting.findMany()],
  ['analyticsRecords', () => prisma.analyticsRecord.findMany()],
  ['systemStatus', () => prisma.systemStatus.findMany()],
  ['storeSettings', () => prisma.storeSetting.findMany()],
  ['storeResources', () => prisma.storeResource.findMany()]
];

export async function runBackup(outDir = path.join(process.cwd(), 'backups')): Promise<string> {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const payload: Record<string, any> = {
    exportedAt: new Date().toISOString(),
    databaseHost: (process.env.DATABASE_URL || '').replace(/:\/\/[^@]*@/, '://***@'),
    tables: {}
  };

  for (const [name, query] of TABLES) {
    try {
      const rows = await query();
      payload.tables[name] = rows;
      console.log(`  ${name.padEnd(18)} ${rows.length} rows`);
    } catch (err: any) {
      payload.tables[name] = { error: err.message };
      console.warn(`  ${name.padEnd(18)} FAILED: ${err.message.split('\n')[0]}`);
    }
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(outDir, `neon-backup-${stamp}.json`);
  // Decimal/BigInt are not JSON-serialisable by default.
  fs.writeFileSync(
    file,
    JSON.stringify(payload, (_k, v) => (typeof v === 'bigint' ? v.toString() : v), 2),
    'utf8'
  );
  return file;
}

if (process.argv[1] && process.argv[1].includes('dbBackup')) {
  (async () => {
    console.log('[Backup] Exporting Neon database...');
    const file = await runBackup();
    const size = (fs.statSync(file).size / 1024 / 1024).toFixed(2);
    console.log(`\n[Backup] Written: ${file} (${size} MB)`);
    process.exit(0);
  })();
}
