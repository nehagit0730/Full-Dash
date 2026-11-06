import { Router, Response } from "express";
import { requireAdmin, AdminRequest } from "../middleware/requireAdmin";
import {
  RECYCLABLE_RESOURCES,
  RETENTION_DAYS,
  clearRecycleBin,
  isRecyclable,
  listRecycleBin,
  moveToRecycleBin,
  permanentlyDelete,
  purgeExpired,
  recycleBinCounts,
  restoreFromRecycleBin
} from "../services/recycleBin";

const router = Router();

/**
 * The recycle bin.
 *
 * Every route is admin-only: the bin holds complete copies of orders and
 * customer records, so reading it is reading customer data, and restoring or
 * destroying from it changes what the shop is.
 */

/** GET / — what is in the bin, optionally for one section. */
router.get("/", requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const resource = typeof req.query.resource === "string" ? req.query.resource : undefined;
    const items = await listRecycleBin(resource);
    const counts = await recycleBinCounts();
    res.json({ items, counts, retentionDays: RETENTION_DAYS, resources: RECYCLABLE_RESOURCES });
  } catch (err: any) {
    console.error("[Recycle Bin] GET Error:", err);
    res.status(500).json({ error: err?.message || "Could not load the recycle bin" });
  }
});

/**
 * POST /move — delete an item by moving it here.
 *
 * This is what the dashboard's delete buttons call. The record leaves its own
 * store in the same step, so nothing is both live and binned.
 */
router.post("/move", requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const { resource, id } = req.body || {};
    if (!resource || !id) {
      return res.status(400).json({ error: "A resource and an id are required." });
    }
    if (!isRecyclable(String(resource))) {
      return res.status(400).json({
        error: `"${resource}" is not covered by the recycle bin.`,
        recyclable: RECYCLABLE_RESOURCES
      });
    }

    const result = await moveToRecycleBin(String(resource), String(id), req.admin?.email);
    if (!result.ok) return res.status(404).json({ error: result.message });

    res.json({ success: true, entryId: result.entryId, label: result.label, retentionDays: RETENTION_DAYS });
  } catch (err: any) {
    console.error("[Recycle Bin] move Error:", err);
    res.status(500).json({ error: err?.message || "Could not move that item to the recycle bin" });
  }
});

/** POST /restore — put the named entries back where they came from. */
router.post("/restore", requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    if (ids.length === 0) return res.status(400).json({ error: "Select at least one item to restore." });

    const result = await restoreFromRecycleBin(ids);
    res.json({
      success: result.failed.length === 0,
      restored: result.restored.length,
      failed: result.failed
    });
  } catch (err: any) {
    console.error("[Recycle Bin] restore Error:", err);
    res.status(500).json({ error: err?.message || "Could not restore those items" });
  }
});

/**
 * POST /delete — destroy the named entries.
 *
 * Irreversible, and separate from /clear so that confirming one can never take
 * out the other.
 */
router.post("/delete", requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    if (ids.length === 0) return res.status(400).json({ error: "Select at least one item to delete." });

    const deleted = await permanentlyDelete(ids);
    res.json({ success: true, deleted });
  } catch (err: any) {
    console.error("[Recycle Bin] delete Error:", err);
    res.status(500).json({ error: err?.message || "Could not delete those items" });
  }
});

/**
 * POST /clear — destroy everything in the bin.
 *
 * Requires `confirm: true` in the body as well as the dialog in the dashboard,
 * so this cannot be triggered by a stray request to a URL.
 */
router.post("/clear", requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    if (req.body?.confirm !== true) {
      return res.status(400).json({ error: "Clearing the recycle bin must be confirmed." });
    }
    const deleted = await clearRecycleBin();
    res.json({ success: true, deleted });
  } catch (err: any) {
    console.error("[Recycle Bin] clear Error:", err);
    res.status(500).json({ error: err?.message || "Could not clear the recycle bin" });
  }
});

/**
 * GET|POST /purge-expired — the 30-day sweep.
 *
 * Called by the scheduled job in vercel.json. Also runs whenever the bin is
 * listed, so retention holds even if the schedule stops.
 */
const handlePurge = async (_req: AdminRequest, res: Response) => {
  try {
    const deleted = await purgeExpired();
    res.json({ success: true, deleted, retentionDays: RETENTION_DAYS });
  } catch (err: any) {
    console.error("[Recycle Bin] purge Error:", err);
    res.status(500).json({ error: err?.message || "Could not run the expiry sweep" });
  }
};

// The cron secret or an admin token, matching the other scheduled endpoints.
import { requireCronOrAdmin } from "../middleware/requireAdmin";
router.get("/purge-expired", requireCronOrAdmin, handlePurge);
router.post("/purge-expired", requireCronOrAdmin, handlePurge);

export default router;
