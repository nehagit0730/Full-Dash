import { Router } from "express";
import { prisma } from "../../src/lib/prisma";
import { deleteFromCloudinary } from "../services/cloudinary";
import { checkMediaReferences } from "./media";
import { fetchResource, saveResource, getDb } from "../../serverDb";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

// GET all files directly with fallback
router.get("/", async (_req, res) => {
  try {
    const data = await fetchResource("files");
    return res.json(data);
  } catch (err: any) {
    console.error("[Files Router] GET Error:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch files" });
  }
});

// POST update/sync files
router.post("/", requireAdmin, async (req, res) => {
  try {
    const payload = req.body;
    if (!Array.isArray(payload)) {
      return res.status(400).json({ error: "Files API expects an array of documents" });
    }

    const database = await getDb();
    if (!database) {
      res.setHeader("X-Database-Offline", "true");
    } else {
      res.setHeader("X-Database-Offline", "false");
    }

    const saved = await saveResource("files", payload);
    return res.json(saved);
  } catch (err: any) {
    console.error("[Files Router] POST Error:", err);
    return res.status(500).json({ error: err.message || "Failed to persist files" });
  }
});

// DELETE single file by id or url
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const force = req.query.force === 'true';

    try {
      const existing = await prisma.fileEntry.findFirst({
        where: {
          OR: [
            { id },
            { url: id },
            { publicId: id }
          ]
        }
      });

      if (existing) {
        if (!force) {
          const refs = await checkMediaReferences(existing.url);
          if (refs.length > 0) {
            return res.status(409).json({
              error: 'File is currently referenced in your store.',
              references: refs,
              canForce: true
            });
          }
        }

        if (existing.publicId) {
          await deleteFromCloudinary(existing.publicId, existing.resourceType || 'image');
        }

        await prisma.fileEntry.delete({ where: { id: existing.id } });
      }

      const updated = await prisma.fileEntry.findMany({
        orderBy: { createdAt: "desc" }
      });
      return res.json(updated);
    } catch (prismaErr: any) {
      console.warn("[Files Router] Prisma DELETE failed, falling back to StoreResource:", prismaErr?.message || prismaErr);
      const files = await fetchResource("files");
      const filtered = files.filter((f: any) => f.id !== id && f.url !== id && f.publicId !== id);
      const updated = await saveResource("files", filtered);
      return res.json(updated);
    }
  } catch (err: any) {
    console.error("[Files Router] DELETE Error:", err);
    return res.status(500).json({ error: err.message || "Failed to delete file" });
  }
});

export default router;

