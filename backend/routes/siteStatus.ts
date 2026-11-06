import { Router, Request, Response } from "express";
import { requireAdmin, AdminRequest } from "../middleware/requireAdmin";
import {
  checkPassword,
  getPublicSiteStatus,
  getSiteStatus,
  issuePass,
  saveSiteStatus,
  verifyPass
} from "../services/siteStatus";

const router = Router();

/**
 * GET / — what the storefront needs to know.
 *
 * Public, and deliberately thin: the mode and the words to show. Never the
 * password or its hash, which the whole internet would otherwise be able to
 * read and attack offline.
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    res.json(await getPublicSiteStatus());
  } catch (err: any) {
    console.error("[Site Status] GET Error:", err);
    // A failure here must not black out the shop.
    res.json({ mode: "live", headline: "", message: "" });
  }
});

/** POST /unlock — exchange the password for a pass. */
router.post("/unlock", async (req: Request, res: Response) => {
  try {
    const password = String(req.body?.password ?? "");
    if (!password) return res.status(400).json({ ok: false, message: "Enter the password." });

    if (!(await checkPassword(password))) {
      return res.status(401).json({ ok: false, message: "That password is not right." });
    }
    res.json({ ok: true, pass: await issuePass() });
  } catch (err: any) {
    console.error("[Site Status] unlock Error:", err);
    res.status(500).json({ ok: false, message: "Could not check that right now." });
  }
});

/** POST /verify — is a stored pass still valid? */
router.post("/verify", async (req: Request, res: Response) => {
  try {
    res.json({ ok: await verifyPass(String(req.body?.pass ?? "")) });
  } catch {
    res.json({ ok: false });
  }
});

/** GET /admin — the full status for the dashboard, minus the hash. */
router.get("/admin", requireAdmin, async (_req: AdminRequest, res: Response) => {
  try {
    const s = await getSiteStatus();
    res.json({
      mode: s.mode,
      headline: s.headline,
      message: s.message,
      hasPassword: Boolean(s.passwordHash),
      updatedAt: s.updatedAt,
      updatedBy: s.updatedBy
    });
  } catch (err: any) {
    console.error("[Site Status] GET /admin Error:", err);
    res.status(500).json({ error: err?.message || "Could not read the site status" });
  }
});

/** POST /admin — change the mode, the password or the wording. */
router.post("/admin", requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const result = await saveSiteStatus({
      mode: req.body?.mode,
      password: req.body?.password,
      headline: req.body?.headline,
      message: req.body?.message,
      updatedBy: req.admin?.email
    });
    if (!result.ok) return res.status(400).json({ error: result.message });
    res.json({ success: true, ...result.status });
  } catch (err: any) {
    console.error("[Site Status] POST /admin Error:", err);
    res.status(500).json({ error: err?.message || "Could not save the site status" });
  }
});

export default router;
