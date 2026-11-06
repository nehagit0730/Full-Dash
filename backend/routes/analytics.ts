import { Router, Response } from "express";
import { requireAdmin, AdminRequest } from "../middleware/requireAdmin";
import { fetchWebAnalytics, clearCache, DEFAULT_RANGE_DAYS } from "../services/vercelAnalytics";

const router = Router();

/**
 * Traffic figures for the admin dashboard, read from Vercel Web Analytics.
 *
 * Admin-only, and proxied rather than called from the browser: the Vercel
 * access token would otherwise be shipped to every visitor.
 *
 * GET /api/analytics/traffic?days=30&refresh=1
 */
router.get("/traffic", requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const days = Number(req.query.days) || DEFAULT_RANGE_DAYS;
    if (req.query.refresh === "1" || req.query.refresh === "true") clearCache();

    const data = await fetchWebAnalytics(days);
    res.json(data);
  } catch (err: any) {
    console.error("[Analytics Router] traffic Error:", err);
    // Reported as an error, never as zeroes: "we could not ask" and "nobody
    // visited" must not look the same in the dashboard.
    res.status(500).json({ configured: true, error: err?.message || "Could not read Vercel Analytics" });
  }
});

export default router;
