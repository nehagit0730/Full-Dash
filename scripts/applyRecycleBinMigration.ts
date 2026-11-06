/**
 * Creates the RecycleBinItem table in Neon.
 *
 *   npx tsx scripts/applyRecycleBinMigration.ts
 *
 * This database's migrations were applied out of band — there is no
 * _prisma_migrations table, `prisma migrate status` reports things that are not
 * true, and several models declared in schema.prisma have no table at all
 * (OrderItem is one). So a new model needs its SQL running explicitly rather
 * than trusting a migrate command.
 *
 * Idempotent: every statement in the migration carries IF NOT EXISTS, and the
 * script verifies the table answers a query before reporting success.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';

const MIGRATION = path.join(
  process.cwd(),
  'prisma',
  'migrations',
  '20260923_recycle_bin',
  'migration.sql'
);

/** Splits on semicolons that end a statement, ignoring comment lines. */
function statementsOf(sql: string): string[] {
  return sql
    .split(/;\s*$/m)
    .map(s =>
      s
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim()
    )
    .filter(Boolean);
}

async function main() {
  console.log('\n=== Recycle bin table ===\n');

  const sql = fs.readFileSync(MIGRATION, 'utf8');
  const statements = statementsOf(sql);
  console.log(`${statements.length} statement(s) from ${path.relative(process.cwd(), MIGRATION)}\n`);

  for (const statement of statements) {
    const summary = statement.replace(/\s+/g, ' ').slice(0, 78);
    try {
      await prisma.$executeRawUnsafe(statement);
      console.log(`  ok    ${summary}`);
    } catch (err: any) {
      console.error(`  FAIL  ${summary}`);
      console.error(`        ${err?.message}`);
      throw err;
    }
  }

  // Proven by using it, not by assuming the DDL worked.
  const count = await prisma.recycleBinItem.count();
  console.log(`\nTable verified: RecycleBinItem holds ${count} row(s).`);

  const columns = await prisma.$queryRawUnsafe<Array<{ column_name: string; data_type: string }>>(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_name = 'RecycleBinItem' ORDER BY ordinal_position`
  );
  console.log('Columns:');
  for (const c of columns) console.log(`  ${c.column_name.padEnd(12)} ${c.data_type}`);
  console.log();
}

main()
  .catch(err => {
    console.error('[Recycle bin migration] Failed:', err?.message || err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
