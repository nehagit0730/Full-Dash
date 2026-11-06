/**
 * DESTRUCTIVE: drops the Worldpay and Royal Mail columns from Neon.
 *
 *   npx tsx scripts/applyDropLegacyColumns.ts            # dry run: shows what would be lost
 *   npx tsx scripts/applyDropLegacyColumns.ts --confirm  # exports, then drops
 *
 * Before dropping anything it writes every non-empty value in those columns to
 * backups/legacy-columns-<timestamp>.json (backups/ is gitignored because it
 * holds customer data). Take a Neon branch or backup as well: the drop cannot
 * be undone from inside the app.
 *
 * Only these columns are touched. Order rows, Subscription rows and the copies
 * inside the `data` JSON / StoreResource blobs are left as they are.
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";

const TARGETS: Record<string, string[]> = {
  Order: ["worldpayTxId", "worldpayAuthCode", "royalMailOrderId"],
  Subscription: ["worldpayTransactionId", "worldpayTokenHref", "worldpayRecurringHref", "worldpaySchemeReference"]
};

const MIGRATION = path.join(process.cwd(), "prisma", "migrations", "20261107_drop_worldpay_royalmail", "migration.sql");

async function existingColumns(table: string): Promise<string[]> {
  const rows: any[] = await prisma.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
    table
  );
  return rows.map(r => r.column_name);
}

async function main() {
  const confirm = process.argv.includes("--confirm");
  const exportData: Record<string, any[]> = {};
  let totalValues = 0;

  for (const [table, cols] of Object.entries(TARGETS)) {
    const present = (await existingColumns(table)).filter(c => cols.includes(c));
    if (present.length === 0) {
      console.log(`${table}: none of the legacy columns exist (already dropped).`);
      continue;
    }
    const select = ['"id"', ...present.map(c => `"${c}"`)].join(", ");
    const where = present.map(c => `"${c}" IS NOT NULL`).join(" OR ");
    const rows: any[] = await prisma.$queryRawUnsafe(`SELECT ${select} FROM "${table}" WHERE ${where}`);
    exportData[table] = rows;
    totalValues += rows.length;
    console.log(`${table}: columns ${present.join(", ")} — ${rows.length} row(s) hold values.`);
  }

  if (!confirm) {
    console.log("\nDry run only. Re-run with --confirm to export these values and drop the columns.");
    return;
  }

  const dir = path.join(process.cwd(), "backups");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `legacy-columns-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(file, JSON.stringify(exportData, null, 2));
  console.log(`Exported ${totalValues} row(s) to ${file}`);

  const statements = fs
    .readFileSync(MIGRATION, "utf8")
    .split(/;\s*$/m)
    .map(s => s.split("\n").filter(l => !l.trim().startsWith("--")).join("\n").trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
    console.log(`  ✓ ${stmt}`);
  }

  for (const [table, cols] of Object.entries(TARGETS)) {
    const left = (await existingColumns(table)).filter(c => cols.includes(c));
    if (left.length) throw new Error(`${table} still has ${left.join(", ")}`);
  }
  console.log("Legacy Worldpay / Royal Mail columns dropped.");
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
