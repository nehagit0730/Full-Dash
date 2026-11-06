import { fetchResource, saveSingleItem, deleteSingleItem } from "../../serverDb";
import { prisma } from "../../src/lib/prisma";

/**
 * The recycle bin.
 *
 * Deleting from the admin dashboard moves the whole record here and removes it
 * from its own store, so the active data is exactly what is live — a deleted
 * page is gone from Pages, not hidden inside it. The record is kept verbatim in
 * `payload`, which is what lets a restore put back the thing that was deleted
 * rather than a reconstruction of it.
 *
 * Entries live for 30 days from the moment they were binned, then the sweep
 * destroys them. An admin can destroy them sooner.
 *
 * Nothing here is used by the storefront, the renewal worker or the purge
 * scripts: those delete permanently and deliberately, and routing them through
 * a bin would quietly keep records someone asked to be rid of.
 */

export const RETENTION_DAYS = 30;

/** The stores the bin covers, and how to describe one of their records. */
const RESOURCES: Record<string, { label: string; describe: (item: any) => string }> = {
  orders: { label: "Orders", describe: i => `${i?.id ?? ""} — ${i?.customerName ?? i?.customerEmail ?? ""}` },
  products: { label: "Products", describe: i => i?.title ?? i?.name ?? i?.id ?? "" },
  collections: { label: "Collections", describe: i => i?.title ?? i?.name ?? i?.id ?? "" },
  customPages: { label: "Pages", describe: i => i?.title ?? i?.slug ?? i?.id ?? "" },
  blogs: { label: "Blog Posts", describe: i => i?.title ?? i?.id ?? "" },
  customers: { label: "Customers", describe: i => i?.email ?? i?.name ?? i?.id ?? "" },
  files: { label: "Files", describe: i => i?.fileName ?? i?.originalFilename ?? i?.url ?? i?.id ?? "" }
};

export const RECYCLABLE_RESOURCES = Object.keys(RESOURCES);

export function isRecyclable(resource: string): boolean {
  return Object.prototype.hasOwnProperty.call(RESOURCES, normalizeResource(resource));
}

/** Accepts the spellings the routes use and settles on the store's own name. */
export function normalizeResource(resource: string): string {
  const r = String(resource || "").trim();
  const lower = r.toLowerCase();
  if (lower === "pages" || lower === "custompages") return "customPages";
  if (lower === "fileentries" || lower === "fileentry" || lower === "media") return "files";
  if (lower === "blog" || lower === "blogposts") return "blogs";
  return lower;
}

export function resourceLabel(resource: string): string {
  return RESOURCES[normalizeResource(resource)]?.label ?? resource;
}

function describe(resource: string, item: any): string {
  try {
    return String(RESOURCES[normalizeResource(resource)]?.describe(item) ?? "").trim().slice(0, 200);
  } catch {
    return "";
  }
}

/** The id a record is stored under. Orders use `id`; pages may carry a slug. */
function idOf(item: any): string {
  return String(item?.id ?? item?.slug ?? item?.orderId ?? "").trim();
}

function expiryFrom(deletedAt: Date): Date {
  const d = new Date(deletedAt.getTime());
  d.setDate(d.getDate() + RETENTION_DAYS);
  return d;
}

/**
 * Finds one record in its active store, by id OR slug.
 *
 * Pages are keyed inconsistently in this data — some carry an id equal to their
 * slug ("about"), others an id like "page-1785239768436" with a different slug
 * ("faqs") — and the dashboard passes whichever it has. Matching on the id
 * alone missed the second kind entirely.
 */
async function findActive(resource: string, itemId: string): Promise<any | null> {
  const list: any[] = (await fetchResource(normalizeResource(resource))) || [];
  const wanted = String(itemId).trim();
  if (!wanted) return null;
  return (
    list.find(
      i =>
        idOf(i) === wanted ||
        String(i?.id ?? "") === wanted ||
        String(i?.slug ?? "") === wanted
    ) || null
  );
}

export interface MoveResult {
  ok: boolean;
  message?: string;
  entryId?: string;
  label?: string;
}

/**
 * Moves one record out of its store and into the bin.
 *
 * The snapshot is taken and written FIRST, and the record is only removed once
 * the bin holds it. The other order loses the record entirely if the second
 * step fails, which is the one outcome a recycle bin exists to prevent.
 */
export async function moveToRecycleBin(
  resource: string,
  itemId: string,
  deletedBy?: string
): Promise<MoveResult> {
  const store = normalizeResource(resource);
  if (!isRecyclable(store)) {
    return { ok: false, message: `${resource} is not covered by the recycle bin.` };
  }

  const id = String(itemId || "").trim();
  if (!id) return { ok: false, message: "An item id is required." };

  const item = await findActive(store, id);
  if (!item) return { ok: false, message: "That item no longer exists." };

  // The record's OWN id, not whatever the caller happened to hold. A page can
  // be passed by slug, and the bin entry has to be keyed the same way a restore
  // will write it back.
  const canonicalId = idOf(item) || id;
  const slug = String(item?.slug ?? "").trim();

  const deletedAt = new Date();
  const label = describe(store, item);

  // Upsert, not create: deleting, restoring and deleting again should reuse the
  // one slot rather than stack duplicates for the admin to sift through.
  const entry = await prisma.recycleBinItem.upsert({
    where: { resource_itemId: { resource: store, itemId: canonicalId } },
    update: { payload: item, label, deletedAt, expiresAt: expiryFrom(deletedAt), deletedBy: deletedBy || null },
    create: {
      resource: store,
      itemId: canonicalId,
      label,
      payload: item,
      deletedAt,
      expiresAt: expiryFrom(deletedAt),
      deletedBy: deletedBy || null
    }
  });

  // Only now is it safe to remove the original.
  //
  // Cleared under the slug as well as the id where they differ: the JSON store
  // and the typed table do not agree on which of the two is a page's key, so
  // deleting by one alone can leave the record behind in the other.
  await deleteSingleItem(store, canonicalId);
  if (slug && slug !== canonicalId) await deleteSingleItem(store, slug);

  // Files also hold a typed FileEntry row and a Cloudinary asset. The row goes
  // with the record; the asset is deliberately LEFT on Cloudinary until the bin
  // entry is destroyed, because an image whose file has been deleted cannot be
  // restored into a working page.
  if (store === "files") {
    await prisma.fileEntry.deleteMany({ where: { id: canonicalId } }).catch(() => {});
  }

  console.log(`[Recycle Bin] ${store}/${canonicalId} moved to the bin${deletedBy ? ` by ${deletedBy}` : ""}.`);
  return { ok: true, entryId: entry.id, label };
}

export interface BinEntry {
  id: string;
  resource: string;
  resourceLabel: string;
  itemId: string;
  label: string;
  deletedAt: string;
  expiresAt: string;
  daysLeft: number;
  deletedBy: string | null;
}

function toBinEntry(row: any): BinEntry {
  const expires = new Date(row.expiresAt).getTime();
  return {
    id: row.id,
    resource: row.resource,
    resourceLabel: resourceLabel(row.resource),
    itemId: row.itemId,
    label: row.label || row.itemId,
    deletedAt: new Date(row.deletedAt).toISOString(),
    expiresAt: new Date(row.expiresAt).toISOString(),
    daysLeft: Math.max(0, Math.ceil((expires - Date.now()) / (24 * 60 * 60 * 1000))),
    deletedBy: row.deletedBy ?? null
  };
}

/** Everything in the bin, newest first. Expired entries are swept first. */
export async function listRecycleBin(resource?: string): Promise<BinEntry[]> {
  await purgeExpired();
  const where = resource && resource !== "all" ? { resource: normalizeResource(resource) } : {};
  const rows = await prisma.recycleBinItem.findMany({ where, orderBy: { deletedAt: "desc" } });
  return rows.map(toBinEntry);
}

export interface RestoreResult {
  restored: string[];
  failed: Array<{ id: string; reason: string }>;
}

/**
 * Puts entries back where they came from.
 *
 * The bin entry is removed only after the record is back in its store, so a
 * failure half way leaves the item in the bin to try again rather than losing
 * it between the two.
 */
export async function restoreFromRecycleBin(entryIds: string[]): Promise<RestoreResult> {
  const result: RestoreResult = { restored: [], failed: [] };

  for (const entryId of entryIds) {
    const row = await prisma.recycleBinItem.findUnique({ where: { id: entryId } }).catch(() => null);
    if (!row) {
      result.failed.push({ id: entryId, reason: "No longer in the recycle bin" });
      continue;
    }

    try {
      // saveSingleItem writes the JSON store AND syncs the typed table, which is
      // the same path the original write took.
      await saveSingleItem(row.resource, row.payload as any);

      if (row.resource === "files") {
        const f: any = row.payload;
        await prisma.fileEntry
          .upsert({
            where: { id: row.itemId },
            update: {
              fileName: f?.fileName ?? "restored",
              url: f?.url ?? "",
              altText: f?.altText ?? null,
              mimeType: f?.mimeType ?? null,
              publicId: f?.publicId ?? null,
              resourceType: f?.resourceType ?? null
            },
            create: {
              id: row.itemId,
              fileName: f?.fileName ?? "restored",
              url: f?.url ?? "",
              altText: f?.altText ?? null,
              mimeType: f?.mimeType ?? null,
              publicId: f?.publicId ?? null,
              resourceType: f?.resourceType ?? null,
              dateAdded: f?.dateAdded ?? new Date().toISOString(),
              size: f?.size ?? "",
              references: f?.references ?? ""
            } as any
          })
          .catch((e: any) => console.warn(`[Recycle Bin] FileEntry row not restored for ${row.itemId}: ${e?.message}`));
      }

      await prisma.recycleBinItem.delete({ where: { id: entryId } });
      result.restored.push(entryId);
      console.log(`[Recycle Bin] ${row.resource}/${row.itemId} restored.`);
    } catch (err: any) {
      result.failed.push({ id: entryId, reason: err?.message || "Could not restore" });
      console.error(`[Recycle Bin] Restore failed for ${row.resource}/${row.itemId}:`, err?.message);
    }
  }

  return result;
}

/** Destroys the Cloudinary asset behind a binned file, if there is one. */
async function destroyFileAsset(row: any): Promise<void> {
  const publicId = (row?.payload as any)?.publicId;
  if (!publicId) return;
  try {
    const { deleteFromCloudinary } = await import("./cloudinary");
    await deleteFromCloudinary(publicId, (row.payload as any)?.resourceType || "image");
  } catch (err: any) {
    // The bin entry still goes; an orphaned asset costs storage, a blocked
    // delete costs the admin the thing they asked for.
    console.warn(`[Recycle Bin] Cloudinary asset ${publicId} not removed: ${err?.message}`);
  }
}

/** Permanently destroys the named entries. */
export async function permanentlyDelete(entryIds: string[]): Promise<number> {
  if (!entryIds.length) return 0;

  const rows = await prisma.recycleBinItem.findMany({ where: { id: { in: entryIds } } });
  for (const row of rows.filter(r => r.resource === "files")) await destroyFileAsset(row);

  const res = await prisma.recycleBinItem.deleteMany({ where: { id: { in: entryIds } } });
  console.log(`[Recycle Bin] ${res.count} entr(ies) permanently deleted.`);
  return res.count;
}

/** Permanently destroys everything in the bin. */
export async function clearRecycleBin(): Promise<number> {
  const rows = await prisma.recycleBinItem.findMany({ where: { resource: "files" } });
  for (const row of rows) await destroyFileAsset(row);

  const res = await prisma.recycleBinItem.deleteMany({});
  console.log(`[Recycle Bin] cleared — ${res.count} entr(ies) permanently deleted.`);
  return res.count;
}

/**
 * Destroys everything past its 30 days.
 *
 * Called whenever the bin is listed, and on the scheduled sweep, so retention
 * holds whether or not anyone opens the page.
 */
export async function purgeExpired(now: Date = new Date()): Promise<number> {
  try {
    const due = await prisma.recycleBinItem.findMany({ where: { expiresAt: { lte: now } } });
    if (due.length === 0) return 0;

    for (const row of due.filter(r => r.resource === "files")) await destroyFileAsset(row);

    const res = await prisma.recycleBinItem.deleteMany({ where: { expiresAt: { lte: now } } });
    console.log(`[Recycle Bin] ${res.count} entr(ies) passed ${RETENTION_DAYS} days and were destroyed.`);
    return res.count;
  } catch (err: any) {
    // Never let a failed sweep take down the listing that called it.
    console.error("[Recycle Bin] Expiry sweep failed:", err?.message);
    return 0;
  }
}

/**
 * Removes anything currently in the recycle bin from a list about to be saved.
 *
 * The dashboard's Save posts whole lists — products, collections, pages, blogs
 * — and a tab opened before a deletion still holds the deleted record in its
 * copy. Saving from that tab wrote the record straight back, so an item ended
 * up live AND in the bin at once. That is how the "test" page came back after
 * being deleted, while its bin entry sat there.
 *
 * The bin is the authority: if something is in it, it is deleted, and a stale
 * list cannot undo that. Restoring goes through `restoreFromRecycleBin`, which
 * removes the bin entry first, so this never blocks a real restore.
 */
export async function stripRecycled<T extends Record<string, any>>(
  resource: string,
  items: T[]
): Promise<{ kept: T[]; removed: string[] }> {
  const store = normalizeResource(resource);
  if (!isRecyclable(store) || !Array.isArray(items) || items.length === 0) {
    return { kept: items || [], removed: [] };
  }

  let binned: Array<{ itemId: string }>;
  try {
    binned = await prisma.recycleBinItem.findMany({ where: { resource: store }, select: { itemId: true } });
  } catch {
    // Cannot read the bin: let the save through rather than silently dropping
    // records the admin is trying to keep.
    return { kept: items, removed: [] };
  }
  if (binned.length === 0) return { kept: items, removed: [] };

  const blocked = new Set(binned.map(b => String(b.itemId)));
  const removed: string[] = [];
  const kept = items.filter(item => {
    // Matched on id AND slug, because pages are keyed by either.
    const id = String(item?.id ?? "");
    const slug = String(item?.slug ?? "");
    const hit = (id && blocked.has(id)) || (slug && blocked.has(slug));
    if (hit) removed.push(id || slug);
    return !hit;
  });

  if (removed.length) {
    console.warn(
      `[Recycle Bin] Ignored ${removed.length} ${store} record(s) in a saved list that are in the ` +
        `recycle bin: ${removed.join(", ")}. Restore them from the bin to bring them back.`
    );
  }
  return { kept, removed };
}

/** Counts per resource, for the sidebar badge and the filter chips. */
export async function recycleBinCounts(): Promise<{ total: number; byResource: Record<string, number> }> {
  const rows = await prisma.recycleBinItem.groupBy({ by: ["resource"], _count: { _all: true } }).catch(() => []);
  const byResource: Record<string, number> = {};
  let total = 0;
  for (const r of rows as any[]) {
    byResource[r.resource] = r._count._all;
    total += r._count._all;
  }
  return { total, byResource };
}
