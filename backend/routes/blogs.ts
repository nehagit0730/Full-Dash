import { Router } from "express";
import { fetchResource, saveResource, getDb } from "../../serverDb";
import { stripRecycled } from "../services/recycleBin";

import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

// GET all blogs
router.get("/", async (req, res) => {
  try {
    const data = await fetchResource("blogs");
    res.json(data);
  } catch (err: any) {
    console.error("[Blogs Router] GET Error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch blogs" });
  }
});

// POST update/sync blogs
router.post("/", requireAdmin, async (req, res) => {
  try {
    const payload = req.body;
    if (!Array.isArray(payload)) {
      return res.status(400).json({ error: "Blogs API expects an array of documents" });
    }

    const database = await getDb();
    if (!database) {
      res.setHeader("X-Database-Offline", "true");
    } else {
      res.setHeader("X-Database-Offline", "false");
    }

    // A saved list cannot resurrect a blog post that is in the recycle bin.
    const { kept } = await stripRecycled("blogs", payload);
    const updated = await saveResource("blogs", kept);
    res.json(updated);
  } catch (err: any) {
    console.error("[Blogs Router] POST Error:", err);
    res.status(500).json({ error: err.message || "Failed to persist blogs" });
  }
});

export default router;
