import { Router, Request, Response } from 'express';
import {
  getKlaviyoSettings,
  saveKlaviyoSettings,
  getKlaviyoLogs,
  getKlaviyoLists,
  trackKlaviyoEvent,
  trackCustomerSignup,
  trackNewsletterSignup,
  trackEmailVerified,
  trackAddToCart,
  trackCheckoutStarted,
  trackPurchaseCompleted,
  trackOrderRefunded,
  trackWishlistAdded
} from '../services/klaviyoService';
import { saveResource } from '../../serverDb';

import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

// GET /api/klaviyo/lists - Fetch all email lists from Klaviyo account
router.get('/lists', requireAdmin, async (req: Request, res: Response) => {
  try {
    const apiKey = req.query.apiKey as string | undefined;
    const lists = await getKlaviyoLists(apiKey);
    res.json({ success: true, lists });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch Klaviyo lists' });
  }
});

// GET /api/klaviyo/settings
// Returned the Klaviyo private API key to anonymous callers.
router.get('/settings', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const settings = await getKlaviyoSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch Klaviyo settings' });
  }
});

// POST /api/klaviyo/settings
router.post('/settings', requireAdmin, async (req: Request, res: Response) => {
  try {
    const updated = await saveKlaviyoSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save Klaviyo settings' });
  }
});

// GET & POST /api/klaviyo/verify - Verify Klaviyo Private API Key
const handleVerify = async (req: Request, res: Response) => {
  try {
    const apiKey = req.body?.apiKey || req.query?.apiKey as string | undefined;
    const settings = await getKlaviyoSettings();
    let keyToTest = (apiKey || settings.apiKey || process.env.KLAVIYO_API_KEY || '').trim();
    if (keyToTest.toLowerCase().startsWith('klaviyo-api-key ')) {
      keyToTest = keyToTest.substring(16).trim();
    }

    if (!keyToTest) {
      return res.status(400).json({ success: false, error: 'No Klaviyo Private API Key provided or saved in settings.' });
    }

    // First check metrics:read
    const response = await fetch('https://a.klaviyo.com/api/metrics/', {
      method: 'GET',
      headers: {
        'Authorization': `Klaviyo-API-Key ${keyToTest}`,
        'accept': 'application/json',
        'revision': '2024-02-15'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorMsg = `HTTP ${response.status}: ${errText}`;
      try {
        const jsonErr = JSON.parse(errText);
        if (jsonErr.errors && Array.isArray(jsonErr.errors)) {
          errorMsg = jsonErr.errors.map((e: any) => `${e.title || 'Error'}: ${e.detail || e.message || JSON.stringify(e)}`).join(' | ');
        }
      } catch (e) {}
      return res.status(response.status).json({ success: false, error: errorMsg });
    }

    const data: any = await response.json();
    const count = Array.isArray(data?.data) ? data.data.length : 0;

    // Next check events:write permission (required for server-side Analytics > Metrics aggregation)
    const testEventPayload = {
      data: {
        type: 'event',
        attributes: {
          metric: { data: { type: 'metric', attributes: { name: 'Storefront Verification' } } },
          profile: { data: { type: 'profile', attributes: { email: 'verification-check@pouch-supply.com' } } },
          properties: { verified: true },
          time: new Date().toISOString()
        }
      }
    };

    const eventCheckRes = await fetch('https://a.klaviyo.com/api/events/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${keyToTest}`,
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'revision': '2024-02-15'
      },
      body: JSON.stringify(testEventPayload)
    });

    let hasEventsWrite = eventCheckRes.ok || eventCheckRes.status === 202;
    let eventsWriteWarning = '';

    if (!hasEventsWrite) {
      const evErrText = await eventCheckRes.text();
      try {
        const parsed = JSON.parse(evErrText);
        if (parsed.errors?.[0]?.detail) {
          eventsWriteWarning = parsed.errors[0].detail;
        }
      } catch (e) {
        eventsWriteWarning = evErrText;
      }
    }

    return res.json({
      success: true,
      hasEventsWrite,
      eventsWriteWarning: eventsWriteWarning || undefined,
      message: hasEventsWrite
        ? `Klaviyo Private API Key verified with Full Access! Account connected with ${count} metrics.`
        : `API Key connected (${count} metrics), but missing "events:write" scope. Please create a Private Key in Klaviyo with "Full Access" so metrics populate in Analytics.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to verify Klaviyo API key' });
  }
};

router.get('/verify', requireAdmin, handleVerify);
router.post('/verify', requireAdmin, handleVerify);

/**
 * GET /api/klaviyo/health
 *
 * Why an order can reach Klaviyo and still send no email. Sending an event is
 * only half the journey: Klaviyo delivers nothing unless a Flow is LIVE and
 * listening for that metric. A flow left in draft silently swallows every
 * event, which is indistinguishable from a broken integration when all you can
 * see is that the customer got no mail.
 *
 * This reports the half of the pipeline that lives inside Klaviyo, so the
 * cause is visible in the dashboard instead of being guessed at.
 */
router.get('/health', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const settings = await getKlaviyoSettings();
    let apiKey = (settings.apiKey || process.env.KLAVIYO_API_KEY || '').trim();
    if (apiKey.toLowerCase().startsWith('klaviyo-api-key ')) apiKey = apiKey.substring(16).trim();

    if (!apiKey) {
      return res.json({
        connected: false,
        enabled: settings.enabled,
        issues: ['No Klaviyo private API key is configured.'],
        flows: [],
        listConfigured: false
      });
    }

    const headers = {
      'Authorization': `Klaviyo-API-Key ${apiKey}`,
      'accept': 'application/json',
      'revision': '2024-10-15'
    };

    const [flowRes, metricRes] = await Promise.all([
      fetch('https://a.klaviyo.com/api/flows/', { headers }),
      fetch('https://a.klaviyo.com/api/metrics/', { headers })
    ]);

    const issues: string[] = [];

    const flowJson: any = flowRes.ok ? await flowRes.json().catch(() => null) : null;
    const flows = ((flowJson && flowJson.data) || []).map((f: any) => ({
      name: f?.attributes?.name || 'Untitled flow',
      status: f?.attributes?.status || 'unknown'
    }));

    if (!flowRes.ok) {
      issues.push('Could not read flows from Klaviyo (the API key may lack the flows:read scope).');
    } else {
      const drafts = flows.filter((f: any) => f.status !== 'live');
      if (flows.length === 0) {
        issues.push('This Klaviyo account has no flows, so no event can produce an email.');
      } else if (drafts.length > 0) {
        issues.push(
          `${drafts.length} flow(s) are not live and will send nothing: ` +
            drafts.map((f: any) => `"${f.name}" (${f.status})`).join(', ') + '.'
        );
      }
    }

    // A Klaviyo account previously connected to another platform keeps that
    // platform's metrics. A flow built on the old "Placed Order" will never
    // fire for the one this storefront writes to, even once it is live.
    const metricJson: any = metricRes.ok ? await metricRes.json().catch(() => null) : null;
    const metrics = ((metricJson && metricJson.data) || []).map((m: any) => ({
      name: m?.attributes?.name || '',
      integration: (m?.attributes?.integration && m.attributes.integration.name) || 'API'
    }));
    const duplicates = Array.from(
      new Set(
        metrics
          .filter((m: any) => metrics.filter((o: any) => o.name === m.name).length > 1)
          .map((m: any) => m.name)
      )
    );
    if (duplicates.length > 0) {
      issues.push(
        'Duplicate metrics exist from another integration (' + duplicates.join(', ') + '). ' +
          'Check each flow triggers on the API copy, not the old one.'
      );
    }

    if (!settings.listId) {
      issues.push(
        'No list is selected, so email marketing consent is never recorded and marketing ' +
          'flows skip these profiles. Order confirmations are unaffected if their flow is ' +
          'marked transactional.'
      );
    }

    if (!settings.enabled) issues.push('The Klaviyo integration is switched off in settings.');

    res.json({
      connected: flowRes.ok || metricRes.ok,
      enabled: settings.enabled,
      listConfigured: Boolean(settings.listId),
      flows,
      duplicateMetrics: duplicates,
      issues,
      healthy: issues.length === 0
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to read Klaviyo health' });
  }
});

// GET /api/klaviyo/logs
router.get('/logs', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const logs = await getKlaviyoLogs();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch Klaviyo logs' });
  }
});

// POST /api/klaviyo/logs/clear
// Clears the whole log by default, or only part of it:
//   { status: 'failed' }   - drop only entries with that status
//   { before: <ISO date> } - drop only entries older than that instant
// The two combine, so { status: 'failed', before: '...' } removes stale
// failures while leaving the delivery history that still means something.
router.post('/logs/clear', requireAdmin, async (req: Request, res: Response) => {
  try {
    const status = typeof req.body?.status === 'string' ? req.body.status.trim() : '';
    const beforeRaw = req.body?.before;
    const before = beforeRaw ? Date.parse(String(beforeRaw)) : NaN;

    if (beforeRaw && Number.isNaN(before)) {
      return res.status(400).json({ error: `Invalid 'before' date: ${beforeRaw}` });
    }

    if (!status && !beforeRaw) {
      await saveResource('klaviyo_logs', []);
      return res.json({ success: true, removed: 'all', remaining: 0, message: 'Klaviyo logs cleared successfully' });
    }

    const logs = await getKlaviyoLogs();
    // Entry ids carry the creation time as `<prefix>_<epoch ms>_<rand>`, which
    // is the only timestamp older records are guaranteed to have.
    const timeOf = (l: any): number => {
      if (l?.timestamp) {
        const t = Date.parse(l.timestamp);
        if (!Number.isNaN(t)) return t;
      }
      const m = String(l?.id || '').match(/_(d{13})_/);
      return m ? Number(m[1]) : 0;
    };

    const kept = logs.filter((l: any) => {
      const statusMatches = !status || String(l?.status) === status;
      const ageMatches = Number.isNaN(before) || timeOf(l) < before;
      return !(statusMatches && ageMatches);
    });

    await saveResource('klaviyo_logs', kept);
    res.json({
      success: true,
      removed: logs.length - kept.length,
      remaining: kept.length,
      message: `Removed ${logs.length - kept.length} log entr${logs.length - kept.length === 1 ? 'y' : 'ies'}, kept ${kept.length}.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to clear klaviyo logs' });
  }
});

// POST /api/klaviyo/track - Track custom event from client or backend
router.post('/track', async (req: Request, res: Response) => {
  try {
    const { eventName, customerEmail, eventProperties, customerProperties, eventType, data } = req.body;

    if (eventType) {
      switch (eventType) {
        case 'customer_signup':
          await trackCustomerSignup(data || { email: customerEmail });
          break;
        case 'newsletter_signup':
          await trackNewsletterSignup(customerEmail);
          break;
        case 'email_verified':
          await trackEmailVerified(customerEmail);
          break;
        case 'add_to_cart':
          await trackAddToCart(customerEmail, data?.item, data?.quantity || 1);
          break;
        case 'checkout_started':
          await trackCheckoutStarted(customerEmail, data?.items || [], data?.total || 0, {
            checkoutId: data?.checkoutId,
            customerName: data?.customerName,
            recurring: data?.recurring
          });
          break;
        case 'purchase':
          await trackPurchaseCompleted(data || { customerEmail, total: eventProperties?.total });
          break;
        case 'refunded':
          await trackOrderRefunded(data || { customerEmail, id: eventProperties?.orderId }, data?.refundAmount);
          break;
        case 'wishlist':
          await trackWishlistAdded(customerEmail, data?.item);
          break;
        default:
          await trackKlaviyoEvent(eventName || eventType, customerEmail || 'guest@pouch-supply.com', eventProperties, customerProperties);
      }
      return res.json({ success: true, tracked: eventType });
    }

    if (!eventName || !customerEmail) {
      return res.status(400).json({ error: 'eventName and customerEmail are required' });
    }

    const result = await trackKlaviyoEvent(eventName, customerEmail, eventProperties || {}, customerProperties || {});
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to track Klaviyo event' });
  }
});

export default router;
