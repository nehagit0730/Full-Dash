import { Router, Request, Response } from "express";
import {
  getRoyalMailSettings,
  saveRoyalMailSettings,
  validateAddress,
  getShippingRates,
  testServiceCode,
  createRoyalMailShipment,
  cancelRoyalMailShipment,
  getRoyalMailTracking,
  syncRoyalMailOrderStatus,
  syncPendingRoyalMailTracking,
  createReturnLabel as createRoyalMailReturnLabel,
  getRoyalMailLabelForOrder,
  dispatchRoyalMailShipment,
  requireApiKey
} from "../services/royalMailService";
import {
  createOrder,
  getOrders,
  getOrderByReference,
  cancelOrder,
  getApiVersion,
  checkRoyalMailConnection,
  getRoyalMailLabel,
  markRoyalMailOrderDispatched,
  RoyalMailError,
  RoyalMailOrderPayload
} from "../../src/lib/royalMail";

/**
 * Maps a Royal Mail failure onto an HTTP response. Live-only integration: a
 * failure is reported as a failure, never smoothed over with a local fallback.
 */
function sendRoyalMailError(res: Response, error: any, fallbackMessage: string) {
  console.error(`[Royal Mail] ${fallbackMessage}:`, error);
  if (error instanceof RoyalMailError) {
    return res.status(error.status || 502).json({
      success: false,
      error: error.message,
      message: error.message,
      status: error.status,
      details: error.details
    });
  }
  return res.status(400).json({
    success: false,
    error: error?.message || fallbackMessage,
    message: error?.message || fallbackMessage
  });
}

import { requireAdmin, requireCronOrAdmin } from "../middleware/requireAdmin";

const router = Router();

// GET /api/royalmail/connection - Check live Click & Drop API Connection
router.get("/connection", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const settings = await getRoyalMailSettings();
    const apiKey = (settings.apiKey || process.env.RM_API_KEY || process.env.ROYAL_MAIL_API_KEY || "").trim();
    if (!apiKey) {
      return res.status(200).json({
        success: false,
        connected: false,
        message: "No Click & Drop API Authorization key saved yet. Please paste your key below and click 'Save Settings'.",
        environment: "LIVE"
      });
    }

    await checkRoyalMailConnection(apiKey);

    return res.json({
      success: true,
      connected: true,
      message: "Royal Mail Click & Drop API is connected and authorized.",
      environment: "LIVE",
    });
  } catch (error: any) {
    console.error("[Royal Mail] Connection check error:", error);
    let msg = error?.message || "Unable to connect to Royal Mail.";
    if (error instanceof RoyalMailError) {
      if (error.status === 401) {
        msg = "Invalid or unauthorized API key (401 Unauthorized). Please ensure you generated an API Authorization key in Click & Drop (Settings > Integrations > Click & Drop API).";
      } else if (error.status === 403) {
        msg = "Access Forbidden (403). Please ensure your Click & Drop account has API access enabled.";
      } else if (error.status === 404) {
        msg = "Endpoint not found (404).";
      }
      return res.status(200).json({
        success: false,
        connected: false,
        message: msg,
        status: error.status,
        details: error.details,
      });
    }
    return res.status(200).json({
      success: false,
      connected: false,
      message: msg,
    });
  }
});

// POST /api/royalmail/create-order - Create order direct payload
router.post("/create-order", requireAdmin, async (req: Request, res: Response) => {
  try {
    const orderData = req.body as RoyalMailOrderPayload;
    const settings = await getRoyalMailSettings();
    const apiKey = settings.apiKey || process.env.RM_API_KEY || process.env.ROYAL_MAIL_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "RM_API_KEY is not configured.",
      });
    }

    if (!orderData.orderReference) {
      return res.status(400).json({
        success: false,
        error: "orderReference is required.",
      });
    }

    if (!orderData.recipient) {
      return res.status(400).json({
        success: false,
        error: "recipient information is required.",
      });
    }

    if (!orderData.packages?.length) {
      return res.status(400).json({
        success: false,
        error: "At least one package is required.",
      });
    }

    if (!orderData.postageDetails?.serviceCode) {
      return res.status(400).json({
        success: false,
        error: "Royal Mail serviceCode is required.",
      });
    }

    console.log("[Royal Mail] Creating order:", orderData.orderReference);

    const result = await createOrder(orderData, apiKey);

    console.log("[Royal Mail] Order created successfully:", result);

    const createdOrder = result.createdOrders?.[0];

    return res.json({
      success: true,
      orderReference: createdOrder?.orderReference || orderData.orderReference,
      orderIdentifier: createdOrder?.orderIdentifier || null,
      trackingNumber: createdOrder?.trackingNumber || null,
      royalMailResponse: result,
    });
  } catch (error: unknown) {
    console.error("[Royal Mail] Create order error:", error);
    const message = error instanceof Error ? error.message : "Failed to create Royal Mail order.";
    return res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// GET /api/royalmail/orders - Fetch orders from Royal Mail
router.get("/orders", requireAdmin, async (req: Request, res: Response) => {
  try {
    const apiKey = await requireApiKey();
    const params = req.query as Record<string, string>;
    const data = await getOrders(apiKey, params);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to fetch orders" });
  }
});

// GET /api/royalmail/orders/:reference - Get specific order
router.get("/orders/:reference", requireAdmin, async (req: Request, res: Response) => {
  try {
    const apiKey = await requireApiKey();
    const data = await getOrderByReference(req.params.reference, apiKey);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to fetch order" });
  }
});

// DELETE /api/royalmail/orders/:reference - Delete specific order
router.delete("/orders/:reference", requireAdmin, async (req: Request, res: Response) => {
  try {
    const apiKey = await requireApiKey();
    const data = await cancelOrder(req.params.reference, apiKey);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to cancel order" });
  }
});

// GET /api/royalmail/version - Get API version
router.get("/version", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const apiKey = await requireApiKey();
    const data = await getApiVersion(apiKey);
    res.json({ success: true, version: data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to fetch API version" });
  }
});

// GET /api/royalmail/settings - Get settings
router.get("/settings", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const settings = await getRoyalMailSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch Royal Mail settings" });
  }
});

// POST /api/royalmail/settings - Update settings
router.post("/settings", requireAdmin, async (req: Request, res: Response) => {
  try {
    const updated = await saveRoyalMailSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to save Royal Mail settings" });
  }
});

// POST /api/royalmail/create-shipment - Create shipment for an order
router.post("/create-shipment", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { orderId, serviceCode, packageType, weightGrams } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: "orderId is required" });
    }

    const result = await createRoyalMailShipment(String(orderId), {
      serviceCode,
      packageType,
      weightGrams: weightGrams ? parseInt(weightGrams, 10) : undefined
    });

    res.json(result);
  } catch (err: any) {
    return sendRoyalMailError(res, err, "Failed to create Royal Mail shipment");
  }
});

// POST /api/royalmail/validate-address - Address Validation
router.post("/validate-address", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = validateAddress(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Address validation failed" });
  }
});

// POST /api/royalmail/rates - Calculate rates
// POST /api/royalmail/test-service-code - Ask Royal Mail whether a code is usable
// on this account. Which codes are valid depends on the OBA / Tracked contract and
// no endpoint lists them, so the only real answer comes from offering an order.
// The throwaway order is deleted again as soon as it is accepted.
router.post("/test-service-code", requireAdmin, async (req: Request, res: Response) => {
  try {
    const codes: string[] = Array.isArray(req.body?.serviceCodes)
      ? req.body.serviceCodes
      : [req.body?.serviceCode].filter(Boolean);

    if (codes.length === 0) {
      return res.status(400).json({ success: false, message: "Provide serviceCode or serviceCodes." });
    }

    const results = [];
    for (const code of codes.slice(0, 10)) {
      results.push(await testServiceCode(String(code), req.body?.tradingName));
    }

    return res.json({ success: true, results, accepted: results.filter(r => r.accepted).map(r => r.serviceCode) });
  } catch (error: any) {
    return res.status(200).json({ success: false, message: error?.message || "Service code test failed." });
  }
});

router.post("/rates", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { weightGrams, countryCode } = req.body;
    const rates = getShippingRates(weightGrams || 70, countryCode || 'GB');
    res.json({ success: true, rates });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to calculate rates" });
  }
});

// GET /api/royalmail/label/:orderId/order-pdf - Official postage label for a store order.
// The previous /label/:orderId/html endpoint rendered a hand-drawn HTML label
// with a CSS "barcode". Royal Mail cannot scan that, so it has been removed in
// favour of the genuine PDF issued by Click & Drop.
router.get("/label/:orderId/order-pdf", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const includeReturnsLabel = req.query.includeReturnsLabel === "true";
    const includeCN = req.query.includeCN === "true";

    const { pdf, royalMailOrderId } = await getRoyalMailLabelForOrder(String(orderId), {
      includeReturnsLabel,
      includeCN
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="royal-mail-${royalMailOrderId}.pdf"`);
    res.setHeader("Cache-Control", "no-store");
    return res.send(Buffer.from(pdf));
  } catch (err: any) {
    return sendRoyalMailError(res, err, "Unable to retrieve the Royal Mail label");
  }
});

// PUT /api/royalmail/dispatch-order/:orderId - Mark a store order as despatched
router.put("/dispatch-order/:orderId", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await dispatchRoyalMailShipment(String(req.params.orderId));
    return res.json(result);
  } catch (err: any) {
    return sendRoyalMailError(res, err, "Unable to mark the order as despatched");
  }
});

// GET /api/royalmail/track/:trackingNumber - Track shipment (live Click & Drop)
router.get("/track/:trackingNumber", async (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.params;
    const trackingInfo = await getRoyalMailTracking(trackingNumber);
    res.json(trackingInfo);
  } catch (err: any) {
    return sendRoyalMailError(res, err, "Tracking lookup failed");
  }
});

// POST /api/royalmail/sync-status/:orderId - Sync live status from Royal Mail Click & Drop
router.post("/sync-status/:orderId", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const result = await syncRoyalMailOrderStatus(orderId);
    res.json(result);
  } catch (err: any) {
    return sendRoyalMailError(res, err, "Failed to sync order status");
  }
});

// GET|POST /api/royalmail/sync-pending - Collect tracking numbers for every
// shipment still waiting on one. Driven by the Vercel cron; also safe to hit by
// hand. GET is supported because Vercel crons issue GET.
const handleSyncPending = async (req: Request, res: Response) => {
  try {
    const rawLimit = Number((req.query?.limit ?? (req.body || {}).limit) as any);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : undefined;
    const result = await syncPendingRoyalMailTracking({ limit });
    res.json({
      ...result,
      message: `Checked ${result.checked} shipment(s) awaiting tracking; ${result.updated} tracking number(s) collected.`,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return sendRoyalMailError(res, err, "Failed to sync pending Royal Mail tracking");
  }
};

// vercel.json cron. Was reachable by anyone over GET.
router.get("/sync-pending", requireCronOrAdmin, handleSyncPending);
router.post("/sync-pending", requireCronOrAdmin, handleSyncPending);

// POST /api/royalmail/cancel-shipment - Cancel shipment in Click & Drop
router.post("/cancel-shipment", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { orderId, royalMailOrderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, error: "orderId is required" });
    }
    const result = await cancelRoyalMailShipment(String(orderId), royalMailOrderId);
    res.json(result);
  } catch (err: any) {
    return sendRoyalMailError(res, err, "Failed to cancel shipment");
  }
});

// POST /api/royalmail/create-return-label - Official Royal Mail pre-paid returns label (PDF)
router.post("/create-return-label", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, error: "orderId is required" });
    }
    const result = await createRoyalMailReturnLabel(String(orderId));

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="royal-mail-returns-${result.royalMailOrderId}.pdf"`
    );
    res.setHeader("Cache-Control", "no-store");
    return res.send(Buffer.from(result.pdf));
  } catch (err: any) {
    return sendRoyalMailError(res, err, "Failed to retrieve the returns label");
  }
});

// GET /api/royalmail/label/:identifier/pdf - Retrieve official Royal Mail PDF postage label
router.get("/label/:identifier/pdf", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    const includeReturnsLabel = req.query.includeReturnsLabel === "true";
    const includeCN = req.query.includeCN === "true";

    const settings = await getRoyalMailSettings();
    const apiKey = settings.apiKey || process.env.RM_API_KEY || process.env.ROYAL_MAIL_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ success: false, error: "ROYAL_MAIL_API_KEY is not configured." });
    }

    const pdfBuffer = await getRoyalMailLabel(
      /^\d+$/.test(identifier) ? Number(identifier) : identifier,
      { includeReturnsLabel, includeCN },
      apiKey
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="royal-mail-${identifier}.pdf"`);
    res.setHeader("Cache-Control", "no-store");
    return res.send(Buffer.from(pdfBuffer));
  } catch (error: any) {
    console.error("[Royal Mail] Label PDF error:", error);
    if (error instanceof RoyalMailError) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message,
        status: error.status,
        details: error.details
      });
    }
    return res.status(500).json({ success: false, message: error.message || "Unable to retrieve Royal Mail label." });
  }
});

// PUT /api/royalmail/dispatch - Mark order as dispatched in Royal Mail
router.put("/dispatch", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { orderIdentifier, orderReference } = req.body;
    if (orderIdentifier === undefined && !orderReference) {
      return res.status(400).json({
        success: false,
        message: "orderIdentifier or orderReference is required."
      });
    }

    const settings = await getRoyalMailSettings();
    const apiKey = settings.apiKey || process.env.RM_API_KEY || process.env.ROYAL_MAIL_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ success: false, error: "ROYAL_MAIL_API_KEY is not configured." });
    }

    const identifier = orderIdentifier !== undefined ? Number(orderIdentifier) : String(orderReference);
    const result = await markRoyalMailOrderDispatched(identifier, apiKey);

    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[Royal Mail] Dispatch error:", error);
    if (error instanceof RoyalMailError) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message,
        status: error.status,
        details: error.details
      });
    }
    return res.status(500).json({
      success: false,
      message: "Unable to mark Royal Mail order as dispatched."
    });
  }
});

export default router;
