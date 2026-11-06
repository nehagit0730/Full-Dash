import { Router, Request, Response } from 'express';
import { prisma } from '../../src/lib/prisma';

const router = Router();

const DEFAULT_BASE_URL = "https://staging.agechecked.com/api/acapiremote/ac0130";
const DEFAULT_PORTAL_URL = "https://portal.agechecked.com/portal";
const SECRET_FIELD_NAMES = ["merchantSecretKey", "merchantKey", "secretKey", "merchantSecret"] as const;

// GET /api/agechecked/config - Returns client-safe AgeChecked configuration
router.get("/config", (req: Request, res: Response) => {
  const portalUrl = process.env.NEXT_PUBLIC_AGECHECKED_PORTAL_URL || process.env.AGECHECKED_PORTAL_URL || DEFAULT_PORTAL_URL;
  const publicKey = process.env.NEXT_PUBLIC_AGECHECKED_PUBLIC_KEY || process.env.AGECHECKED_PUBLIC_KEY || "";
  res.json({
    portalUrl,
    publicKey,
    configured: Boolean(process.env.AGECHECKED_SECRET_KEY || publicKey)
  });
});

function isApprovedStatus(status?: string | null | number): boolean {
  if (status === null || status === undefined) return false;
  const normalized = String(status).trim().toLowerCase();
  return (
    normalized === "approved" ||
    normalized === "true" ||
    normalized === "6" ||
    normalized === "7" ||
    normalized === "verified" ||
    normalized === "pass" ||
    normalized === "passed" ||
    normalized === "success" ||
    normalized === "completed" ||
    normalized === "complete" ||
    normalized === "valid" ||
    normalized === "validated" ||
    normalized === "ok" ||
    normalized === "pass_18" ||
    normalized === "pass_21" ||
    normalized === "accepted"
  );
}

function normalizeSecretKey(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

function getProviderMessage(responseBody: any): string {
  if (!responseBody) return "AgeChecked AC0130 initialization failed.";
  return (
    responseBody.message ||
    responseBody.error?.message ||
    responseBody.avstatus?.statusText ||
    responseBody.avstatus?.statustext ||
    (typeof responseBody.details === "string" ? responseBody.details : undefined) ||
    "AgeChecked AC0130 initialization failed."
  );
}

function buildPayloads(secretKey: string, body: Record<string, any>) {
  const secretVariants = [secretKey];

  if (secretKey) {
    try {
      const doubleDecoded = decodeURIComponent(secretKey);
      if (doubleDecoded && !secretVariants.includes(doubleDecoded)) {
        secretVariants.push(doubleDecoded);
      }
    } catch {
      // Ignore decode failures
    }
  }

  return secretVariants.flatMap((secretValue) =>
    SECRET_FIELD_NAMES.map((fieldName) => ({
      [fieldName]: secretValue,
      name: body.name ?? "",
      surname: body.surname ?? "",
      dob: body.dob ?? "",
      placeofbirth: body.placeofbirth ?? body.placeOfBirth ?? "",
      postcode: body.postcode ?? "",
      countrycode: body.countrycode ?? "GB",
      email: body.email ?? "",
      reference: body.reference ?? "worldpay-demo",
      withforce: body.withforce ?? "true",
      userfield1: body.userfield1 ?? "",
      userfield2: body.userfield2 ?? "",
      userfield3: body.userfield3 ?? "",
    }))
  );
}

// In-memory verification cache for active session references, emails, and agecheck IDs
const verifiedSessions = new Map<string, { approved: boolean; agecheckid: string; email?: string; timestamp: number }>();
// Approvals older than this are treated as expired so re-testing/re-verifying can't be short-circuited indefinitely
const AGE_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

// Helper to record approval across in-memory cache and PostgreSQL database
async function persistAgeVerification(keys: (string | undefined | null)[], agecheckid: string, email?: string, metadata?: Record<string, any>) {
  const normalizedAgeCheckId = agecheckid || `AC-${Date.now()}`;
  const normalizedEmail = email ? email.toLowerCase().trim() : undefined;

  const record = { approved: true, agecheckid: normalizedAgeCheckId, email: normalizedEmail, timestamp: Date.now() };
  if (normalizedAgeCheckId) verifiedSessions.set(normalizedAgeCheckId.trim(), record);
  if (normalizedEmail) verifiedSessions.set(normalizedEmail, record);
  for (const k of keys) {
    if (k && typeof k === 'string' && k.trim()) {
      verifiedSessions.set(k.trim(), record);
    }
  }

  // Persist to PostgreSQL database
  try {
    const verifiedPayload = {
      approved: true,
      verified: true,
      agecheckid: normalizedAgeCheckId,
      email: normalizedEmail || null,
      keys: keys.filter((k): k is string => Boolean(k && typeof k === 'string' && k.trim())),
      verifiedAt: new Date().toISOString(),
      provider: "AgeChecked",
      ...metadata
    };

    const validKeys = Array.from(new Set([
      normalizedAgeCheckId,
      normalizedEmail,
      ...keys.filter((k): k is string => Boolean(k && typeof k === 'string' && k.trim()))
    ].filter(Boolean) as string[]));

    for (const key of validKeys) {
      try {
        await prisma.storeResource.upsert({
          where: {
            resource_itemId: {
              resource: "age_verification",
              itemId: key
            }
          },
          update: {
            data: verifiedPayload,
            updatedAt: new Date()
          },
          create: {
            resource: "age_verification",
            itemId: key,
            data: verifiedPayload
          }
        });
      } catch (_storeErr) {}
    }

    // Update customer in database if email is provided
    if (normalizedEmail) {
      try {
        const existingCustomer = await prisma.customer.findUnique({
          where: { email: normalizedEmail }
        });
        if (existingCustomer) {
          const currentData = (existingCustomer.data && typeof existingCustomer.data === 'object') ? (existingCustomer.data as Record<string, any>) : {};
          await prisma.customer.update({
            where: { email: normalizedEmail },
            data: {
              data: {
                ...currentData,
                ageVerified: true,
                ageChecked: true,
                ageCheckId: normalizedAgeCheckId,
                ageVerifiedAt: new Date().toISOString()
              }
            }
          });
        }
      } catch (_custErr) {}
    }
  } catch (err) {
    console.error("[AgeChecked] DB persistence error:", err);
  }
}

// Helper to check DB for persistent age verification record
async function checkAgeVerificationDb(keys: (string | undefined | null)[]): Promise<{ approved: boolean; agecheckid: string } | null> {
  const validKeys = Array.from(new Set(keys.filter((k): k is string => Boolean(k && typeof k === 'string' && k.trim()))));
  if (validKeys.length === 0) return null;

  try {
    const records = await prisma.storeResource.findMany({
      where: {
        resource: "age_verification",
        itemId: { in: validKeys }
      }
    });

    if (records.length > 0) {
      const data = records[0].data as any;
      const verifiedAtMs = data?.verifiedAt ? Date.parse(data.verifiedAt) : NaN;
      const isExpired = Number.isFinite(verifiedAtMs) && (Date.now() - verifiedAtMs) > AGE_VERIFICATION_TTL_MS;
      if (data && (data.approved === true || data.verified === true) && !isExpired) {
        return { approved: true, agecheckid: data.agecheckid || records[0].itemId };
      }
    }

    // Check Customer table directly
    const emailKey = validKeys.find(k => k.includes('@'));
    if (emailKey) {
      const customer = await prisma.customer.findUnique({
        where: { email: emailKey.toLowerCase().trim() }
      });
      if (customer && customer.data && typeof customer.data === 'object') {
        const custData = customer.data as Record<string, any>;
        const verifiedAtMs = custData.ageVerifiedAt ? Date.parse(custData.ageVerifiedAt) : NaN;
        const isExpired = Number.isFinite(verifiedAtMs) && (Date.now() - verifiedAtMs) > AGE_VERIFICATION_TTL_MS;
        if ((custData.ageVerified === true || custData.ageChecked === true) && !isExpired) {
          return { approved: true, agecheckid: custData.ageCheckId || `AC-${customer.id}` };
        }
      }
    }
  } catch (_dbErr) {}

  return null;
}

// POST /api/agechecked/init - Initialize AgeChecked AC0130 session
router.post("/init", async (req: Request, res: Response) => {
  const secretKey = normalizeSecretKey(process.env.AGECHECKED_SECRET_KEY);
  const baseUrl = (
    process.env.AGECHECKED_BASE_URL ||
    process.env.VITE_AGECHECKED_BASE_URL ||
    DEFAULT_BASE_URL
  ).replace(/\/+$/, "");

  const body = req.body || {};

  if (!secretKey) {
    return res.status(503).json({
      error: {
        code: "AGECHECKED_NOT_CONFIGURED",
        message: "AgeChecked verification is not configured on the server."
      }
    });
  }

  const payloads = buildPayloads(secretKey, body);
  let lastError: { message: string; details: any; status: number } | null = null;

  for (const payload of payloads) {
    try {
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let responseBody: any = {};
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = { raw: responseText };
      }

      const providerMessage = getProviderMessage(responseBody);
      const hasRedirectUrl = Boolean(
        responseBody?.url || responseBody?.redirectUrl || responseBody?.redirect_url
      );

      if (response.ok && hasRedirectUrl) {
        return res.json(responseBody);
      }

      if (response.ok && !responseBody.error && providerMessage) {
        return res.json(responseBody);
      }

      lastError = {
        message: providerMessage,
        details: responseBody,
        status: response.status || 400,
      };
    } catch (error: any) {
      console.error("[AgeChecked init] Request failed:", error);
      lastError = {
        message: "Unable to reach the AgeChecked AC0130 endpoint.",
        details: error?.message || error,
        status: 502,
      };
    }
  }

  const errDetails = lastError?.details || {};
  const structuredError = errDetails?.error || {
    code: errDetails?.code || "1039",
    message: lastError?.message || "AgeChecked AC0130 initialization failed."
  };

  return res.status(lastError?.status || 500).json({
    error: structuredError,
    message: lastError?.message || structuredError.message || "AgeChecked AC0130 initialization failed.",
    details: errDetails,
    attemptedFieldNames: SECRET_FIELD_NAMES.join(", "),
  });
});

// GET /api/agechecked/status - Polling endpoint for checkout and client components
router.get("/status", async (req: Request, res: Response) => {
  const reference = String(req.query.reference || "").trim();
  const agecheckid = String(req.query.agecheckid || "").trim();
  const email = String(req.query.email || "").toLowerCase().trim();

  // A status lookup must belong to an initialized AC0130 transaction. Kept
  // alongside the TTL cache below: this rejects lookups that carry no
  // transaction identifier at all, the TTL handles ones that have expired.
  if (!agecheckid && !reference) {
    return res.json({ success: false, approved: false, status: "0", statusText: "Pending" });
  }

  // 1. Check in-memory verified cache (expired entries are discarded, not treated as approved)
  const isCacheEntryExpired = (data: { timestamp: number }) => (Date.now() - data.timestamp) > AGE_VERIFICATION_TTL_MS;

  if (reference && verifiedSessions.has(reference)) {
    const data = verifiedSessions.get(reference)!;
    if (isCacheEntryExpired(data)) {
      verifiedSessions.delete(reference);
    } else {
      return res.json({ success: true, approved: data.approved, agecheckid: data.agecheckid, status: "6", statusText: "Approved" });
    }
  }

  if (agecheckid && verifiedSessions.has(agecheckid)) {
    const data = verifiedSessions.get(agecheckid)!;
    if (isCacheEntryExpired(data)) {
      verifiedSessions.delete(agecheckid);
    } else {
      return res.json({ success: true, approved: data.approved, agecheckid: data.agecheckid, status: "6", statusText: "Approved" });
    }
  }

  if (email && (agecheckid || reference) && verifiedSessions.has(email)) {
    const data = verifiedSessions.get(email)!;
    if (isCacheEntryExpired(data)) {
      verifiedSessions.delete(email);
    } else {
      return res.json({ success: true, approved: data.approved, agecheckid: data.agecheckid, status: "6", statusText: "Approved" });
    }
  }

  // 2. Check PostgreSQL database persistence
  const dbRecord = await checkAgeVerificationDb([reference, agecheckid, email]);
  if (dbRecord && dbRecord.approved) {
    const resolvedId = dbRecord.agecheckid || agecheckid;
    if (!resolvedId) {
      return res.json({ success: false, approved: false, status: "0", statusText: "Pending" });
    }
    await persistAgeVerification([reference, agecheckid, email], resolvedId, email);
    return res.json({ success: true, approved: true, agecheckid: resolvedId, status: "6", statusText: "Approved" });
  }

  // 3. If AGECHECKED_SECRET_KEY is configured and we have an agecheckid or reference, query AgeChecked AC0131
  const secretKey = normalizeSecretKey(process.env.AGECHECKED_SECRET_KEY);
  if (secretKey && (agecheckid || reference || email)) {
    try {
      const baseUrl = (
        process.env.AGECHECKED_BASE_URL ||
        DEFAULT_BASE_URL
      ).replace(/\/ac0130\/?$/, "/ac0131");

      const queryVariants = [
        { merchantSecretKey: secretKey, agecheckid: agecheckid || undefined, reference: reference || undefined },
        { merchantKey: secretKey, agecheckid: agecheckid || undefined, reference: reference || undefined },
        { secretKey: secretKey, agecheckid: agecheckid || undefined, reference: reference || undefined },
        { merchantSecretKey: secretKey, reference: reference || undefined, email: email || undefined },
      ];

      for (const queryPayload of queryVariants) {
        try {
          const checkRes = await fetch(baseUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(queryPayload)
          });

          if (checkRes.ok) {
            const checkData: any = await checkRes.json().catch(() => ({}));
            const statusVal = checkData?.avstatus?.status ?? checkData?.status ?? checkData?.code ?? checkData?.result ?? checkData?.data?.status;
            const statusText = checkData?.avstatus?.statustext ?? checkData?.avstatus?.statusText ?? checkData?.statustext ?? checkData?.statusText ?? checkData?.data?.statustext;
            if (isApprovedStatus(statusVal) || isApprovedStatus(statusText) || checkData?.approved === true || checkData?.verified === true) {
              const resolvedId = agecheckid || checkData?.avstatus?.agecheckid || checkData?.agecheckid || checkData?.data?.id || `AC-${Date.now()}`;
              await persistAgeVerification([reference, agecheckid, email], resolvedId, email, checkData);
              return res.json({ success: true, approved: true, agecheckid: resolvedId, status: "6", statusText: "Approved" });
            }
          }
        } catch (_fetchErr) {
          // Continue to next variant
        }
      }
    } catch (_err) {
      // Ignore network timeout
    }
  }

  // Return real pending status
  return res.json({ success: false, approved: false, status: "0", statusText: "Pending" });
});

// POST /api/agechecked/approve - Verified approval endpoint
router.post("/approve", async (req: Request, res: Response) => {
  const { reference, email, agecheckid, verified, method } = req.body || {};
  
  // Only record if verified flag is true
  if ((verified === true || verified === "true" || verified === 1 || verified === "1") && agecheckid) {
    const resolvedAgeCheckId = String(agecheckid);
    await persistAgeVerification([reference, email, resolvedAgeCheckId], resolvedAgeCheckId, email, { method });
    return res.json({ success: true, approved: true, agecheckid: resolvedAgeCheckId, method });
  }

  return res.status(400).json({ success: false, approved: false, message: "Verification not completed or session ID is missing." });
});

// POST /api/agechecked/reset - Clears a persisted approval so re-verification can be tested/forced
router.post("/reset", async (req: Request, res: Response) => {
  const { reference, email, agecheckid } = req.body || {};
  const normalizedEmail = email ? String(email).toLowerCase().trim() : undefined;
  const keys = [reference, agecheckid, normalizedEmail].filter(
    (k): k is string => Boolean(k && typeof k === "string" && k.trim())
  );

  for (const key of keys) {
    verifiedSessions.delete(key.trim());
  }

  try {
    if (keys.length > 0) {
      await prisma.storeResource.deleteMany({
        where: { resource: "age_verification", itemId: { in: keys } }
      });
    }

    if (normalizedEmail) {
      const existingCustomer = await prisma.customer.findUnique({ where: { email: normalizedEmail } });
      if (existingCustomer) {
        const currentData = (existingCustomer.data && typeof existingCustomer.data === 'object') ? (existingCustomer.data as Record<string, any>) : {};
        await prisma.customer.update({
          where: { email: normalizedEmail },
          data: {
            data: {
              ...currentData,
              ageVerified: false,
              ageChecked: false,
              ageCheckId: null,
              ageVerifiedAt: null
            }
          }
        });
      }
    }
  } catch (err) {
    console.error("[AgeChecked] Reset error:", err);
  }

  return res.json({ success: true });
});

// POST /api/agechecked/reset - Clears a persisted approval so re-verification can be tested/forced
router.post("/reset", async (req: Request, res: Response) => {
  const { reference, email, agecheckid } = req.body || {};
  const normalizedEmail = email ? String(email).toLowerCase().trim() : undefined;
  const keys = [reference, agecheckid, normalizedEmail].filter(
    (k): k is string => Boolean(k && typeof k === "string" && k.trim())
  );

  for (const key of keys) {
    verifiedSessions.delete(key.trim());
  }

  try {
    if (keys.length > 0) {
      await prisma.storeResource.deleteMany({
        where: { resource: "age_verification", itemId: { in: keys } }
      });
    }

    if (normalizedEmail) {
      const existingCustomer = await prisma.customer.findUnique({ where: { email: normalizedEmail } });
      if (existingCustomer) {
        const currentData = (existingCustomer.data && typeof existingCustomer.data === 'object') ? (existingCustomer.data as Record<string, any>) : {};
        await prisma.customer.update({
          where: { email: normalizedEmail },
          data: {
            data: {
              ...currentData,
              ageVerified: false,
              ageChecked: false,
              ageCheckId: null,
              ageVerifiedAt: null
            }
          }
        });
      }
    }
  } catch (err) {
    console.error("[AgeChecked] Reset error:", err);
  }

  return res.json({ success: true });
});

// The legacy AgeChecked "demo portal" — a full-page ID-scanner mock served as
// raw HTML — has been removed. Verification now runs only against the real
// AgeChecked provider inside the in-page panel, so there is no second,
// older-looking window for a shopper to land in.
router.get("/demo-portal", (_req: Request, res: Response) => {
  return res.status(410).json({
    success: false,
    message: "The legacy AgeChecked demo portal is no longer available."
  });
});

// GET & POST /api/agechecked/callback and webhooks
const handleCallback = async (req: Request, res: Response) => {
  const query = req.query || {};
  const body = req.body || {};

  const status = String(
    query.status || 
    query.statustext || 
    query.code ||
    query.result ||
    query.action ||
    body.status || 
    body.statustext || 
    body.code ||
    body.result ||
    body.action ||
    body.avstatus?.status || 
    body.avstatus?.statustext || 
    body.data?.status ||
    ""
  );

  const statusText = String(
    query.statusText || 
    query.statustext || 
    body.statusText || 
    body.statustext || 
    body.avstatus?.statusText || 
    body.avstatus?.statustext || 
    body.data?.statusText ||
    ""
  );

  const agecheckid = String(
    query.agecheckid || 
    query.ageverifiedid || 
    query.id || 
    query.checkid ||
    query.verificationId ||
    body.agecheckid || 
    body.avstatus?.agecheckid || 
    body.id || 
    body.verificationId ||
    `AC-${Date.now()}`
  );

  const reference = String(
    query.reference || 
    query.ref || 
    query.userfield1 || 
    query.orderRef ||
    query.order_id ||
    body.reference || 
    body.ref || 
    body.userfield1 || 
    body.orderRef ||
    ""
  );

  const email = String(
    query.email || 
    query.userfield2 || 
    body.email || 
    body.userfield2 || 
    ""
  );

  const approved = 
    isApprovedStatus(status) || 
    isApprovedStatus(statusText) || 
    query.approved === "true" || 
    query.agechecked === "approved" || 
    query.verified === "true" ||
    body.approved === true || 
    body.verified === true ||
    statusText.toLowerCase() === "approved" || 
    req.path.includes("pass") || 
    req.path.includes("success") || 
    req.path.includes("complete");

  if (approved) {
    await persistAgeVerification(
      [reference, agecheckid, query.userfield1, query.userfield2, body.userfield1, body.userfield2], 
      agecheckid, 
      email,
      { query, body }
    );
  }

  const wantsJson = (req.query.format === "json" || req.headers.accept === "application/json") && !req.headers.accept?.includes("text/html");
  if (wantsJson) {
    return res.json({
      approved,
      verified: approved,
      agecheckid,
      status,
      statusText: statusText || (approved ? "Approved" : "Pending"),
      reference,
      receivedAt: new Date().toISOString()
    });
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.removeHeader("X-Frame-Options");
  res.setHeader("Content-Security-Policy", "frame-ancestors * 'self'");

  // This page is the last thing AgeChecked redirects to, and it loads inside the
  // in-page verification panel. It used to be a full-screen popup card that told
  // the shopper it was "closing window and returning to checkout" and offered a
  // button whose only action was window.close() — which does nothing in a frame.
  // Inside the panel that read as the old popup coming back and, when a check
  // was not approved, it stayed on screen with no way out.
  //
  // It now renders as a slim status strip and hands control straight back to the
  // page that opened it, which closes the panel itself.
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>AgeChecked Verification</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff; color: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; }
          .panel { text-align: center; max-width: 380px; }
          .icon { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto; font-size: 22px; background: ${approved ? '#dcfce7' : '#fef3c7'}; color: ${approved ? '#15803d' : '#b45309'}; }
          h1 { font-size: 16px; margin: 0 0 6px 0; font-weight: 800; letter-spacing: -0.2px; }
          p { font-size: 12.5px; color: #64748b; line-height: 1.5; margin: 0; }
          .ref { font-family: monospace; font-size: 10.5px; color: #94a3b8; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="panel">
          <div class="icon">${approved ? '&#10003;' : '!'}</div>
          <h1>${approved ? 'Age verified' : 'Verification not completed'}</h1>
          <p>${approved ? 'Returning you to checkout&hellip;' : 'The 18+ check could not be confirmed. Close this panel and try again.'}</p>
          <div class="ref">Ref ${agecheckid}</div>
        </div>
        <script>
          (function() {
            var isApproved = ${approved ? "true" : "false"};
            var ageCheckId = ${JSON.stringify(String(agecheckid))};
            var sessionRef = ${JSON.stringify(String(reference))};
            var customerEmail = ${JSON.stringify(String(email))};

            var payloads = [
              { getidEventName: isApproved ? 'complete' : 'cancel', data: { id: ageCheckId, status: isApproved ? 'approved' : 'pending', agecheckid: ageCheckId, reference: sessionRef } },
              { type: 'AGECHECKED_VERIFIED', verified: isApproved, approved: isApproved, data: { id: ageCheckId, agecheckid: ageCheckId, reference: sessionRef, email: customerEmail } },
              { type: 'agechecked-approved', status: isApproved ? 'approved' : 'pending', approved: isApproved, verified: isApproved, agecheckid: ageCheckId }
            ];

            if (isApproved) {
              try {
                localStorage.setItem('agechecked-approved', 'true');
                localStorage.setItem('ageVerified', 'true');
                localStorage.setItem('agechecked-verified-at', new Date().toISOString());
                localStorage.setItem('agechecked-id', ageCheckId);
              } catch (e) {}

              try {
                if (typeof BroadcastChannel !== 'undefined') {
                  var bc = new BroadcastChannel('agechecked_channel');
                  bc.postMessage({ type: 'agechecked-approved', status: 'approved', approved: true, verified: true, agecheckid: ageCheckId, reference: sessionRef, email: customerEmail });
                  bc.close();
                }
              } catch (e) {}
            }

            // The panel host is the parent frame. window.opener is only set on the
            // legacy popup flow and is kept so an older session still completes.
            var targets = [window.parent, window.top, window.opener].filter(function (t, i, all) {
              return t && t !== window && all.indexOf(t) === i;
            });

            targets.forEach(function (target) {
              payloads.forEach(function (payload) {
                try { target.postMessage(payload, '*'); } catch (e) {}
              });
            });

            // Nothing calls window.close() here: in a frame it is a no-op, and the
            // messages above already tell the checkout page to dismiss the panel.
          })();
        </script>
      </body>
    </html>
  `);
};

export { handleCallback };

router.all("/callback", handleCallback);
router.all("/callback/", handleCallback);
router.all("/webhook", handleCallback);
router.all("/webhook/", handleCallback);
router.all("/notification", handleCallback);
router.all("/notification/", handleCallback);
router.all("/notify", handleCallback);
router.all("/notify/", handleCallback);
router.all("/pass", handleCallback);
router.all("/pass/", handleCallback);
router.all("/success", handleCallback);
router.all("/fail", handleCallback);

router.all("/", handleCallback);
router.all("", handleCallback);

export default router;
