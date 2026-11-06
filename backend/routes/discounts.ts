import { Router } from "express";
import { fetchResource, saveResource, getDb } from "../../serverDb";

import { requireAdmin } from "../middleware/requireAdmin";
import { checkDiscountUsable } from "../services/discountUsage";

const router = Router();

/**
 * Can this shopper still use this code?
 *
 * Advisory only, so the storefront can refuse a spent one-per-customer code as
 * it is typed rather than at the payment step. The binding checks are on the
 * payment session and on order creation — this endpoint is a courtesy, and
 * nothing relies on the client having called it.
 */
/**
 * The discount that applies to this shopper without them typing anything.
 *
 * Currently the launch offer: the first 50 accounts get 10% off their first
 * order. The storefront asks as the customer is identified and applies whatever
 * comes back; it never decides eligibility itself, and the payment session
 * re-checks before taking money.
 */
router.get("/auto", async (req, res) => {
  try {
    const email = String(req.query.email || "").trim();
    if (!email) return res.json({ discount: null });

    const { autoDiscountFor, newCustomerPlacesRemaining } = await import(
      "../services/newCustomerDiscount"
    );
    const discount = await autoDiscountFor(email);
    res.json({ discount, placesRemaining: await newCustomerPlacesRemaining() });
  } catch (err: any) {
    console.error("[Discounts Router] GET /auto Error:", err);
    // No automatic discount beats a failed checkout: the shopper simply pays
    // the normal price rather than seeing an error.
    res.json({ discount: null });
  }
});

router.post("/validate", async (req, res) => {
  try {
    const { customerEmail, discount } = req.body || {};
    if (!discount) {
      return res.status(400).json({ ok: false, message: "A discount is required." });
    }
    // No email yet (the shopper has not filled the form in): nothing to check
    // against, and the payment step will catch it.
    if (!customerEmail) return res.json({ ok: true });

    const verdict = await checkDiscountUsable(customerEmail, discount);
    res.json({ ok: verdict.ok, message: verdict.message });
  } catch (err: any) {
    console.error("[Discounts Router] POST /validate Error:", err);
    // A failed check must not block a legitimate sale; the payment step still
    // applies the limit.
    res.json({ ok: true });
  }
});

// GET all discounts
router.get("/", async (req, res) => {
  try {
    const data = await fetchResource("discounts");
    res.json(data);
  } catch (err: any) {
    console.error("[Discounts Router] GET Error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch discounts" });
  }
});

// POST update/sync discounts
router.post("/", requireAdmin, async (req, res) => {
  try {
    const payload = req.body;
    if (!Array.isArray(payload)) {
      return res.status(400).json({ error: "Discounts API expects an array of documents" });
    }

    const database = await getDb();
    if (!database) {
      res.setHeader("X-Database-Offline", "true");
    } else {
      res.setHeader("X-Database-Offline", "false");
    }

    const updated = await saveResource("discounts", payload);
    res.json(updated);
  } catch (err: any) {
    console.error("[Discounts Router] POST Error:", err);
    res.status(500).json({ error: err.message || "Failed to persist discounts" });
  }
});

export default router;
