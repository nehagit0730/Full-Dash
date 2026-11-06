import { Router } from "express";
import { fetchResource, saveResource, fetchSingleItem, saveSingleItem, deleteSingleItem, getDb } from "../../serverDb";
import { stripRecycled } from "../services/recycleBin";
import { requireAdmin } from "../middleware/requireAdmin";

/**
 * Generic store resource router (products, collections, pages, contact messages).
 *
 * Reads stay public — the storefront renders from them. Writes are administrative
 * and are now gated: POST with an array REPLACES the entire resource, so an
 * anonymous request could previously empty or rewrite the whole catalogue.
 */
export interface CrudRouterOptions {
  /**
   * Runs after a successful array save, with the resource as it was before and
   * as it now is. Used where a save has consequences beyond the row itself —
   * a subscription plan price change has to reach existing subscribers.
   *
   * Awaited but never allowed to fail the request: the save has already
   * happened, so throwing here would report failure for work that succeeded.
   */
  onAfterReplace?: (before: any[], after: any[]) => Promise<void>;
}

export function createCrudRouter(resourceName: string, options: CrudRouterOptions = {}): Router {
  const router = Router();

  // GET all items
  router.get("/", async (req, res) => {
    try {
      const data = await fetchResource(resourceName);
      res.json(data);
    } catch (err: any) {
      console.error(`[${resourceName} Router] GET Error:`, err);
      res.status(500).json({ error: err.message || `Failed to fetch ${resourceName}` });
    }
  });

  // GET single item by ID
  router.get("/:id", async (req, res) => {
    try {
      const item = await fetchSingleItem(resourceName, req.params.id);
      if (!item) {
        return res.status(404).json({ error: `Item with ID ${req.params.id} not found` });
      }
      res.json(item);
    } catch (err: any) {
      console.error(`[${resourceName} Router] GET /:id Error:`, err);
      res.status(500).json({ error: err.message || `Failed to fetch ${resourceName} item` });
    }
  });

  // POST update/sync items (Supports both array batch sync and single item payload)
  router.post("/", requireAdmin, async (req, res) => {
    try {
      const payload = req.body;

      const database = await getDb();
      if (!database) {
        res.setHeader("X-Database-Offline", "true");
      } else {
        res.setHeader("X-Database-Offline", "false");
      }

      if (Array.isArray(payload)) {
        // A saved list cannot resurrect something in the recycle bin. The
        // dashboard posts whole lists, and a tab opened before a deletion still
        // holds the deleted record — saving from it used to write that record
        // straight back while its bin entry remained.
        const { kept } = await stripRecycled(resourceName, payload);

        // Captured before the write so a hook can see what actually changed.
        const before = options.onAfterReplace ? ((await fetchResource(resourceName)) || []) : [];
        const updated = await saveResource(resourceName, kept);

        if (options.onAfterReplace) {
          try {
            await options.onAfterReplace(before, payload);
          } catch (hookErr: any) {
            console.error(`[${resourceName} Router] after-save hook failed:`, hookErr?.message || hookErr);
          }
        }

        return res.json(updated);
      } else if (payload && typeof payload === "object") {
        const updatedItem = await saveSingleItem(resourceName, payload);
        return res.json(updatedItem);
      } else {
        return res.status(400).json({ error: "Invalid payload for POST operation" });
      }
    } catch (err: any) {
      console.error(`[${resourceName} Router] POST Error:`, err);
      res.status(500).json({ error: err.message || `Failed to persist ${resourceName}` });
    }
  });

  // PUT update single item by ID
  router.put("/:id", requireAdmin, async (req, res) => {
    try {
      const payload = req.body;
      if (!payload || typeof payload !== "object") {
        return res.status(400).json({ error: "Invalid item payload" });
      }
      const itemToSave = { ...payload, id: req.params.id };

      const database = await getDb();
      if (!database) {
        res.setHeader("X-Database-Offline", "true");
      } else {
        res.setHeader("X-Database-Offline", "false");
      }

      const updated = await saveSingleItem(resourceName, itemToSave);
      res.json(updated);
    } catch (err: any) {
      console.error(`[${resourceName} Router] PUT /:id Error:`, err);
      res.status(500).json({ error: err.message || `Failed to update ${resourceName} item` });
    }
  });

  // DELETE single item by ID
  router.delete("/:id", requireAdmin, async (req, res) => {
    try {
      const database = await getDb();
      if (!database) {
        res.setHeader("X-Database-Offline", "true");
      } else {
        res.setHeader("X-Database-Offline", "false");
      }

      const success = await deleteSingleItem(resourceName, req.params.id);
      res.json({ success, id: req.params.id });
    } catch (err: any) {
      console.error(`[${resourceName} Router] DELETE /:id Error:`, err);
      res.status(500).json({ error: err.message || `Failed to delete ${resourceName} item` });
    }
  });

  return router;
}
