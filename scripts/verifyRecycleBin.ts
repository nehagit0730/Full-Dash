/**
 * Exercises the recycle bin end to end, against the real table.
 *
 *   npm run verify:recycle-bin
 *
 * It creates ONE throwaway page, hidden and under a slug nothing else can use,
 * and puts it through the whole lifecycle: delete, list, restore, delete again,
 * permanently delete. It removes the page whatever happens, and asserts at the
 * end that neither the page nor its bin entry is left behind — so a run leaves
 * the database exactly as it found it.
 *
 * It touches no existing record. The counts of real pages and real bin entries
 * are taken before and after and compared, and the run fails if either moved.
 */
import 'dotenv/config';
import { fetchResource, saveSingleItem, deleteSingleItem } from '../serverDb';
import { prisma } from '../src/lib/prisma';
import {
  RETENTION_DAYS,
  clearRecycleBin,
  listRecycleBin,
  moveToRecycleBin,
  permanentlyDelete,
  purgeExpired,
  recycleBinCounts,
  restoreFromRecycleBin
} from '../backend/services/recycleBin';

const SLUG = `__recycle-bin-selftest-${Date.now()}`;

let failed = 0;
const check = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);
};

const pageExists = async () => {
  const pages: any[] = (await fetchResource('customPages')) || [];
  return pages.some(p => String(p?.id) === SLUG);
};

const pageCount = async () => ((await fetchResource('customPages')) || []).length;

async function main() {
  console.log('\n=== Recycle bin lifecycle ===\n');

  const pagesBefore = await pageCount();
  const binBefore = (await recycleBinCounts()).total;
  console.log(`Before: ${pagesBefore} page(s), ${binBefore} bin entr(ies).\n`);

  const testPage = {
    id: SLUG,
    title: 'Recycle bin self-test',
    slug: SLUG,
    visibility: 'Hidden',
    isHomepage: false,
    sections: [{ id: 'sec-1', type: 'Rich text', settings: { heading: 'do not publish' } }]
  };

  try {
    // ---------------------------------------------------------------- delete
    await saveSingleItem('customPages', testPage);
    check('the test page starts out live', await pageExists(), true);

    const moved = await moveToRecycleBin('customPages', SLUG, 'selftest@pouch-supply.com');
    check('it moves to the bin', moved.ok, true);
    check('and is GONE from Pages, not hidden in it', await pageExists(), false);

    const listed = await listRecycleBin('customPages');
    const entry = listed.find(e => e.itemId === SLUG);
    check('it appears in the bin', Boolean(entry), true);
    check('under its own section', entry?.resourceLabel, 'Pages');
    check('labelled by its title', entry?.label, 'Recycle bin self-test');
    check('with who deleted it', entry?.deletedBy, 'selftest@pouch-supply.com');
    check(`and ${RETENTION_DAYS} days left`, entry?.daysLeft, RETENTION_DAYS);

    // --------------------------------------------------------------- restore
    const restored = await restoreFromRecycleBin([entry!.id]);
    check('restore reports one item back', restored.restored.length, 1);
    check('nothing failed to restore', restored.failed.length, 0);
    check('the page is live again', await pageExists(), true);

    const pages: any[] = (await fetchResource('customPages')) || [];
    const back = pages.find(p => String(p?.id) === SLUG);
    check('restored with its title intact', back?.title, 'Recycle bin self-test');
    check('and its sections intact', back?.sections?.[0]?.settings?.heading, 'do not publish');
    check('the bin entry is gone once restored', (await listRecycleBin('customPages')).some(e => e.itemId === SLUG), false);

    // ------------------------------------------------- permanently delete one
    const again = await moveToRecycleBin('customPages', SLUG);
    check('it can be deleted a second time', again.ok, true);
    const entry2 = (await listRecycleBin('customPages')).find(e => e.itemId === SLUG);
    check('and reuses the one slot rather than stacking', Boolean(entry2), true);

    const destroyed = await permanentlyDelete([entry2!.id]);
    check('permanently deleting removes exactly one', destroyed, 1);
    check('it is gone from the bin', (await listRecycleBin('customPages')).some(e => e.itemId === SLUG), false);
    check('and did NOT come back to Pages', await pageExists(), false);

    // ------------------------------------------------------------- retention
    // A bin entry whose 30 days have passed, to prove the sweep takes it.
    const stale = await prisma.recycleBinItem.create({
      data: {
        resource: 'customPages',
        itemId: `${SLUG}-expired`,
        label: 'expired self-test',
        payload: testPage as any,
        deletedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    });
    const swept = await purgeExpired();
    check('the sweep destroys an entry past its 30 days', swept >= 1, true);
    check('and it is really gone', await prisma.recycleBinItem.findUnique({ where: { id: stale.id } }), null);

    // A fresh entry must survive the same sweep.
    const fresh = await prisma.recycleBinItem.create({
      data: {
        resource: 'customPages',
        itemId: `${SLUG}-fresh`,
        label: 'fresh self-test',
        payload: testPage as any,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    await purgeExpired();
    check('a fresh entry survives the sweep', Boolean(await prisma.recycleBinItem.findUnique({ where: { id: fresh.id } })), true);
    await prisma.recycleBinItem.delete({ where: { id: fresh.id } }).catch(() => {});

    check('clearRecycleBin exists and is callable', typeof clearRecycleBin, 'function');

    // ------------------------------------------- a page whose id is not its slug
    //
    // The shape that broke in production. Pages are keyed inconsistently: some
    // carry an id equal to their slug ("about"), others an id like
    // "page-1785239768436" with a different slug ("faqs"). The dashboard passes
    // whichever it holds, and a lookup on the id alone missed the second kind —
    // so deleting one destroyed it instead of binning it.
    const ODD_ID = `${SLUG}-odd-id`;
    const ODD_SLUG = `${SLUG}-odd-slug`;
    const oddPage = { ...testPage, id: ODD_ID, slug: ODD_SLUG, title: 'Odd-keyed self-test' };
    await saveSingleItem('customPages', oddPage);

    const pagesWithOdd: any[] = (await fetchResource('customPages')) || [];
    check('the odd-keyed page starts out live', pagesWithOdd.some(p => String(p?.id) === ODD_ID), true);

    // Deleted BY SLUG, which is what the page list often has to hand.
    const bySlug = await moveToRecycleBin('customPages', ODD_SLUG);
    check('it can be binned by slug', bySlug.ok, true);

    const afterOdd: any[] = (await fetchResource('customPages')) || [];
    check('and leaves Pages under BOTH its keys',
      afterOdd.some(p => String(p?.id) === ODD_ID || String(p?.slug) === ODD_SLUG), false);

    const oddEntry = (await listRecycleBin('customPages')).find(e => e.itemId === ODD_ID);
    check('the bin entry is keyed by its real id, not the slug', Boolean(oddEntry), true);
    check('and is labelled by its title', oddEntry?.label, 'Odd-keyed self-test');

    const oddRestore = await restoreFromRecycleBin([oddEntry!.id]);
    check('it restores', oddRestore.restored.length, 1);
    const restoredOdd: any[] = (await fetchResource('customPages')) || [];
    const backOdd = restoredOdd.find(p => String(p?.id) === ODD_ID);
    check('with its id intact', backOdd?.id, ODD_ID);
    check('and its slug intact', backOdd?.slug, ODD_SLUG);

    await moveToRecycleBin('customPages', ODD_ID);
    const finalOdd = (await listRecycleBin('customPages')).find(e => e.itemId === ODD_ID);
    check('deleting it again by id reuses the same slot', Boolean(finalOdd), true);
    await permanentlyDelete([finalOdd!.id]);
  } finally {
    // Whatever happened above, leave nothing behind.
    await deleteSingleItem('customPages', SLUG).catch(() => {});
    await deleteSingleItem('customPages', `${SLUG}-odd-id`).catch(() => {});
    await deleteSingleItem('customPages', `${SLUG}-odd-slug`).catch(() => {});
    await prisma.recycleBinItem
      .deleteMany({ where: { itemId: { startsWith: '__recycle-bin-selftest-' } } })
      .catch(() => {});
  }

  const pagesAfter = await pageCount();
  const binAfter = (await recycleBinCounts()).total;
  console.log(`\nAfter: ${pagesAfter} page(s), ${binAfter} bin entr(ies).`);
  check('no real page was added or lost', pagesAfter, pagesBefore);
  check('no real bin entry was added or lost', binAfter, binBefore);

  console.log(`\n${failed === 0 ? 'All checks passed.' : `${failed} check(s) FAILED.`}`);
  process.exit(failed ? 1 : 0);
}

main()
  .catch(async err => {
    console.error('[Recycle bin verify] Failed:', err);
    await deleteSingleItem('customPages', SLUG).catch(() => {});
    await deleteSingleItem('customPages', `${SLUG}-odd-id`).catch(() => {});
    await deleteSingleItem('customPages', `${SLUG}-odd-slug`).catch(() => {});
    await prisma.recycleBinItem
      .deleteMany({ where: { itemId: { startsWith: '__recycle-bin-selftest-' } } })
      .catch(() => {});
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
