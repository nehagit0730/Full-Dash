import { fetchResource, saveResource, fetchStoreSetting, saveStoreSetting, fetchLayoutSettings } from '../../serverDb';

export interface KlaviyoSettings {
  enabled: boolean;
  apiKey: string;
  siteId: string;
  publicKey?: string;
  listId?: string;
  trackEvents: {
    customerSignup: boolean;
    newsletterSignup: boolean;
    emailVerified: boolean;
    addToCart: boolean;
    checkoutStarted: boolean;
    purchase: boolean;
    refunded: boolean;
    wishlist: boolean;
  };
}

export interface KlaviyoEventLog {
  id: string;
  eventName: string;
  customerEmail: string;
  status: 'sent' | 'failed' | 'disabled';
  error?: string;
  timestamp: string;
  payload?: any;
}

const DEFAULT_KLAVIYO_SETTINGS: KlaviyoSettings = {
  enabled: true,
  apiKey: process.env.KLAVIYO_API_KEY || '',
  siteId: process.env.KLAVIYO_SITE_ID || process.env.KLAVIYO_PUBLIC_KEY || process.env.NEXT_PUBLIC_KLAVIYO_COMPANY_ID || 'VPbY66',
  publicKey: process.env.KLAVIYO_SITE_ID || process.env.KLAVIYO_PUBLIC_KEY || process.env.NEXT_PUBLIC_KLAVIYO_COMPANY_ID || 'VPbY66',
  listId: '',
  trackEvents: {
    customerSignup: true,
    newsletterSignup: true,
    emailVerified: true,
    addToCart: true,
    checkoutStarted: true,
    purchase: true,
    refunded: true,
    wishlist: true
  }
};

export async function getKlaviyoSettings(): Promise<KlaviyoSettings> {
  try {
    let stored: any = await fetchStoreSetting('klaviyo_settings');
    if (!stored || (typeof stored === 'object' && Object.keys(stored).length === 0)) {
      const legacy = await fetchResource('klaviyo_settings');
      if (legacy && Array.isArray(legacy) && legacy.length > 0) {
        stored = legacy[0];
      }
    }

    const layoutStored: any = await fetchLayoutSettings().catch(() => null);

    const siteIdVal = stored?.siteId || stored?.publicKey || layoutStored?.klaviyoPublicKey || process.env.NEXT_PUBLIC_KLAVIYO_COMPANY_ID || process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY || process.env.KLAVIYO_SITE_ID || 'VPbY66';
    const apiKeyVal = stored?.apiKey || layoutStored?.klaviyoApiKey || process.env.KLAVIYO_API_KEY || '';

    if (stored && typeof stored === 'object') {
      const item = Array.isArray(stored) ? stored[0] : stored;
      return {
        ...DEFAULT_SETTINGS_MERGED(item, apiKeyVal, siteIdVal)
      };
    } else if (layoutStored) {
      return {
        ...DEFAULT_KLAVIYO_SETTINGS,
        apiKey: apiKeyVal,
        siteId: siteIdVal,
        publicKey: siteIdVal
      };
    }
  } catch (err) {}
  return DEFAULT_KLAVIYO_SETTINGS;
}

function DEFAULT_SETTINGS_MERGED(item: any, apiKeyVal: string, siteIdVal: string): KlaviyoSettings {
  return {
    ...DEFAULT_KLAVIYO_SETTINGS,
    ...item,
    apiKey: item.apiKey || apiKeyVal,
    siteId: siteIdVal,
    publicKey: siteIdVal,
    listId: item.listId || '',
    trackEvents: {
      ...DEFAULT_KLAVIYO_SETTINGS.trackEvents,
      ...(item.trackEvents || {})
    }
  };
}

export async function saveKlaviyoSettings(settings: Partial<KlaviyoSettings>): Promise<KlaviyoSettings> {
  const current = await getKlaviyoSettings();
  const siteIdVal = settings.siteId || settings.publicKey || current.siteId || 'VPbY66';
  const apiKeyVal = (settings.apiKey !== undefined ? settings.apiKey : current.apiKey) || '';

  const updated: KlaviyoSettings = {
    ...current,
    ...settings,
    apiKey: apiKeyVal,
    siteId: siteIdVal,
    publicKey: siteIdVal,
    trackEvents: {
      ...current.trackEvents,
      ...(settings.trackEvents || {})
    }
  };

  if (apiKeyVal) {
    process.env.KLAVIYO_API_KEY = apiKeyVal;
  }
  if (siteIdVal) {
    process.env.KLAVIYO_SITE_ID = siteIdVal;
    process.env.KLAVIYO_PUBLIC_KEY = siteIdVal;
    process.env.NEXT_PUBLIC_KLAVIYO_COMPANY_ID = siteIdVal;
  }

  await saveStoreSetting('klaviyo_settings', updated);
  await saveResource('klaviyo_settings', [updated]);
  return updated;
}

export async function getKlaviyoLogs(): Promise<KlaviyoEventLog[]> {
  try {
    const logs = await fetchResource('klaviyo_logs');
    if (Array.isArray(logs)) {
      return logs.filter((l: any) => l.status !== 'simulated');
    }
    return [];
  } catch (err) {
    return [];
  }
}

async function logKlaviyoEvent(entry: Omit<KlaviyoEventLog, 'id' | 'timestamp'>): Promise<KlaviyoEventLog> {
  const newLog: KlaviyoEventLog = {
    ...entry,
    id: `klaviyo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString()
  };

  try {
    const currentLogs = await getKlaviyoLogs();
    const updated = [newLog, ...currentLogs].slice(0, 500);
    await saveResource('klaviyo_logs', updated);
  } catch (err) {}

  return newLog;
}

// Fetch all lists from Klaviyo API v3
export async function getKlaviyoLists(apiKeyOverride?: string): Promise<{ id: string; name: string }[]> {
  const settings = await getKlaviyoSettings();
  let apiKey = (apiKeyOverride || settings.apiKey || process.env.KLAVIYO_API_KEY || '').trim();
  if (apiKey.toLowerCase().startsWith('klaviyo-api-key ')) {
    apiKey = apiKey.substring(16).trim();
  }

  if (!apiKey) return [];

  try {
    const response = await fetch('https://a.klaviyo.com/api/lists/', {
      method: 'GET',
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'accept': 'application/json',
        'revision': '2024-02-15'
      }
    });

    if (!response.ok) return [];
    const json = await response.json();
    if (json.data && Array.isArray(json.data)) {
      return json.data.map((l: any) => ({
        id: l.id,
        name: l.attributes?.name || l.id
      }));
    }
  } catch (err) {
    console.warn('[Klaviyo Lists Error]:', err);
  }
  return [];
}

/**
 * Creates or updates the Klaviyo profile for a shopper and, when a list is
 * configured, records their email marketing consent.
 *
 * Two things used to stop this working, and both were silent:
 *
 *  1. POST /api/profiles/ answers 409 when the profile already exists. The old
 *     code counted that as success, so a returning customer's profile was never
 *     actually updated. The duplicate id comes back in the error body, so the
 *     conflict is now resolved with a PATCH.
 *
 *  2. Klaviyo does not accept marketing consent through the profile endpoint.
 *     Consent is only set by a subscription job, and that job needs a list id.
 *     With no list configured the whole step was skipped, which is why every
 *     profile on this account reports no consent and marketing-type flows skip
 *     them. That case is now reported instead of passing quietly.
 *
 * Order confirmations do not depend on consent: a Klaviyo flow marked
 * transactional sends regardless. Consent governs marketing sends.
 */
export async function syncKlaviyoProfileWithConsent(
  email: string,
  firstName?: string,
  lastName?: string,
  listIdOverride?: string
): Promise<boolean> {
  const settings = await getKlaviyoSettings();
  let apiKey = (settings.apiKey || process.env.KLAVIYO_API_KEY || '').trim();
  if (apiKey.toLowerCase().startsWith('klaviyo-api-key ')) {
    apiKey = apiKey.substring(16).trim();
  }
  const cleanEmail = email.toLowerCase().trim();
  const listId = listIdOverride || settings.listId;

  if (!apiKey || !cleanEmail) return false;

  const headers = {
    'Authorization': `Klaviyo-API-Key ${apiKey}`,
    'Content-Type': 'application/json',
    'accept': 'application/json',
    'revision': '2024-10-15'
  };

  try {
    // 1. Create the profile, or patch it when Klaviyo reports a duplicate.
    const profileAttributes: Record<string, unknown> = { email: cleanEmail };
    if (firstName) profileAttributes.first_name = firstName;
    if (lastName) profileAttributes.last_name = lastName;

    const profRes = await fetch('https://a.klaviyo.com/api/profiles/', {
      method: 'POST',
      headers,
      body: JSON.stringify({ data: { type: 'profile', attributes: profileAttributes } })
    });

    let profileOk = profRes.ok;

    if (profRes.status === 409) {
      const conflict: any = await profRes.json().catch(() => null);
      const existingId = conflict?.errors?.[0]?.meta?.duplicate_profile_id;
      if (existingId) {
        const patchRes = await fetch(`https://a.klaviyo.com/api/profiles/${existingId}/`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            data: { type: 'profile', id: existingId, attributes: profileAttributes }
          })
        });
        profileOk = patchRes.ok;
        if (!patchRes.ok) {
          const detail = await patchRes.text().catch(() => '');
          console.warn(
            `[Klaviyo Profile Sync] Could not update existing profile for ${cleanEmail}: HTTP ${patchRes.status} ${detail.slice(0, 200)}`
          );
        }
      } else {
        console.warn(
          `[Klaviyo Profile Sync] Profile for ${cleanEmail} already exists but Klaviyo did not return its id; profile left unchanged.`
        );
      }
    } else if (!profRes.ok) {
      const detail = await profRes.text().catch(() => '');
      console.warn(
        `[Klaviyo Profile Sync] Could not create profile for ${cleanEmail}: HTTP ${profRes.status} ${detail.slice(0, 200)}`
      );
    }

    // 2. Consent. Only a subscription job can grant it, and it needs a list.
    if (!listId) {
      console.warn(
        '[Klaviyo Profile Sync] No Klaviyo list is configured, so email marketing consent ' +
          'cannot be recorded. Marketing flows will skip these profiles. Choose a list in ' +
          'Admin -> Email & Marketing -> Klaviyo. (Flows marked transactional, such as order ' +
          'confirmations, still send without consent.)'
      );
      return profileOk;
    }

    const subRes = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            custom_source: 'Storefront Purchase / Checkout',
            profiles: {
              data: [
                {
                  type: 'profile',
                  attributes: {
                    email: cleanEmail,
                    subscriptions: {
                      email: { marketing: { consent: 'SUBSCRIBED' } }
                    }
                  }
                }
              ]
            }
          },
          relationships: { list: { data: { type: 'list', id: listId } } }
        }
      })
    });

    if (!subRes.ok) {
      const detail = await subRes.text().catch(() => '');
      console.warn(
        `[Klaviyo Profile Sync] Consent job rejected for ${cleanEmail}: HTTP ${subRes.status} ${detail.slice(0, 300)}`
      );
      return profileOk;
    }

    return true;
  } catch (err) {
    console.warn('[Klaviyo Profile Sync Error]:', err);
    return false;
  }
}


// Master Track Klaviyo Event Function
export async function trackKlaviyoEvent(
  eventName: string,
  customerEmail: string,
  eventProperties: Record<string, any> = {},
  customerProperties: Record<string, any> = {}
): Promise<{ success: boolean; log: KlaviyoEventLog }> {
  const settings = await getKlaviyoSettings();

  if (!settings.enabled) {
    const log = await logKlaviyoEvent({
      eventName,
      customerEmail,
      status: 'disabled',
      error: 'Klaviyo integration is disabled in settings'
    });
    return { success: false, log };
  }

  let apiKey = (settings.apiKey || process.env.KLAVIYO_API_KEY || '').trim();
  if (apiKey.toLowerCase().startsWith('klaviyo-api-key ')) {
    apiKey = apiKey.substring(16).trim();
  }

  const siteId = (settings.siteId || settings.publicKey || process.env.NEXT_PUBLIC_KLAVIYO_COMPANY_ID || process.env.KLAVIYO_SITE_ID || 'VPbY66').trim();

  // 1. Sanitize Profile Attributes for Klaviyo API v3
  const cleanEmail = (customerEmail || 'customer@pouch-supply.com').trim().toLowerCase();
  const profileAttributes: Record<string, any> = {
    email: cleanEmail
  };
  const customProfileProps: Record<string, any> = {};

  if (customerProperties && typeof customerProperties === 'object') {
    for (const [rawKey, val] of Object.entries(customerProperties)) {
      if (val === undefined || val === null) continue;
      const key = rawKey.replace(/^\$/, ''); // Remove leading $ if present
      if (key === 'email') {
        profileAttributes.email = String(val).trim().toLowerCase();
      } else if (key === 'first_name' || key === 'firstName') {
        profileAttributes.first_name = String(val).trim();
      } else if (key === 'last_name' || key === 'lastName') {
        profileAttributes.last_name = String(val).trim();
      } else if (key === 'phone_number' || key === 'phone') {
        profileAttributes.phone_number = String(val).trim();
      } else if (key === 'external_id') {
        profileAttributes.external_id = String(val).trim();
      } else if (key === 'organization' || key === 'title' || key === 'image' || key === 'location') {
        profileAttributes[key] = val;
      } else {
        customProfileProps[key] = val;
      }
    }
  }

  if (Object.keys(customProfileProps).length > 0) {
    profileAttributes.properties = customProfileProps;
  }

  // Ensure consent is synced in background so Klaviyo flows allow sending
  syncKlaviyoProfileWithConsent(cleanEmail, profileAttributes.first_name, profileAttributes.last_name).catch(() => {});

  // 2. Extract numeric value
  let numValue: number | undefined = undefined;
  if (typeof eventProperties.$value === 'number') numValue = eventProperties.$value;
  else if (typeof eventProperties.value === 'number') numValue = eventProperties.value;
  else if (typeof eventProperties.total === 'number') numValue = eventProperties.total;
  else if (typeof eventProperties.Value === 'number') numValue = eventProperties.Value;
  else if (typeof eventProperties.$value === 'string') {
    const parsed = parseFloat(eventProperties.$value);
    if (!isNaN(parsed)) numValue = parsed;
  } else if (typeof eventProperties.total === 'string') {
    const parsed = parseFloat(eventProperties.total);
    if (!isNaN(parsed)) numValue = parsed;
  }

  // 3. Extract unique_id for deduplication
  const uniqueId = eventProperties.$event_id || eventProperties.OrderId || eventProperties.order_id || eventProperties.id || undefined;

  // 4. Clean custom event properties
  const cleanProps = { ...eventProperties };
  delete cleanProps.$value;
  delete cleanProps.$event_id;

  // 5. Construct Klaviyo API v3 Event Object
  const attributes: Record<string, any> = {
    metric: {
      data: {
        type: 'metric',
        attributes: {
          name: eventName
        }
      }
    },
    profile: {
      data: {
        type: 'profile',
        attributes: profileAttributes
      }
    },
    properties: cleanProps,
    time: new Date().toISOString()
  };

  if (numValue !== undefined && !isNaN(numValue)) {
    attributes.value = numValue;
  }

  if (uniqueId) {
    attributes.unique_id = String(uniqueId);
  }

  const requestBody = {
    data: {
      type: 'event',
      attributes
    }
  };

  try {
    let sentSuccessfully = false;
    let transportMethod = 'private_api';
    let lastErrorDetails = '';

    // Primary Channel: Private API v3 if API key is provided
    if (apiKey) {
      try {
        console.log(`[Klaviyo] Sending event '${eventName}' via Private API for ${profileAttributes.email}...`);
        const response = await fetch('https://a.klaviyo.com/api/events/', {
          method: 'POST',
          headers: {
            'Authorization': `Klaviyo-API-Key ${apiKey}`,
            'Content-Type': 'application/json',
            'accept': 'application/json',
            'revision': '2024-02-15'
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok || response.status === 202) {
          sentSuccessfully = true;
          transportMethod = 'private_api';
        } else {
          const errorText = await response.text();
          let errorDetails = `HTTP ${response.status}: ${errorText}`;
          try {
            const jsonErr = JSON.parse(errorText);
            if (jsonErr.errors && Array.isArray(jsonErr.errors)) {
              errorDetails = jsonErr.errors.map((e: any) => `${e.title || 'Error'}: ${e.detail || e.message || JSON.stringify(e)}`).join(' | ');
            }
          } catch (e) {}
          lastErrorDetails = errorDetails;
          console.warn(`[Klaviyo Private API Warning] '${eventName}' (${response.status}): ${errorDetails}`);
        }
      } catch (privErr: any) {
        lastErrorDetails = privErr.message || String(privErr);
      }
    }

    // Secondary Channel: Client Events API v3
    if (!sentSuccessfully && siteId) {
      try {
        console.log(`[Klaviyo] Dispatching event '${eventName}' via Client Events API (Company ID: ${siteId}) for ${profileAttributes.email}...`);
        const clientRes = await fetch(`https://a.klaviyo.com/client/events/?company_id=${encodeURIComponent(siteId)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json',
            'revision': '2024-02-15'
          },
          body: JSON.stringify(requestBody)
        });

        if (clientRes.ok || clientRes.status === 202) {
          sentSuccessfully = true;
          transportMethod = 'client_events_api';
        } else {
          const clientErrText = await clientRes.text();
          console.warn(`[Klaviyo Client Events API Warning] (${clientRes.status}):`, clientErrText);
          if (!lastErrorDetails) lastErrorDetails = `Client Events API HTTP ${clientRes.status}: ${clientErrText}`;
        }
      } catch (clientErr: any) {
        if (!lastErrorDetails) lastErrorDetails = clientErr.message || String(clientErr);
      }
    }

    if (sentSuccessfully) {
      console.log(`[Klaviyo] Event '${eventName}' successfully tracked for ${profileAttributes.email} via ${transportMethod}!`);
      const log = await logKlaviyoEvent({
        eventName,
        customerEmail: profileAttributes.email,
        status: 'sent',
        payload: { eventProperties: cleanProps, transport: transportMethod }
      });
      return { success: true, log };
    }

    // If both failed
    const finalError = lastErrorDetails || 'Failed to dispatch event via Private or Client API';
    console.error(`[Klaviyo Error] '${eventName}' tracking failed for ${profileAttributes.email}:`, finalError);
    const log = await logKlaviyoEvent({
      eventName,
      customerEmail: profileAttributes.email,
      status: 'failed',
      error: finalError,
      payload: { eventProperties: cleanProps }
    });
    return { success: false, log };

  } catch (err: any) {
    console.error(`[Klaviyo Network Error] Failed tracking '${eventName}':`, err);
    const log = await logKlaviyoEvent({
      eventName,
      customerEmail: profileAttributes.email,
      status: 'failed',
      error: err.message || String(err),
      payload: { eventProperties }
    });
    return { success: false, log };
  }
}

// ----------------------------------------------------
// Standard E-Commerce Flows & Event Dispatches
// ----------------------------------------------------

export async function trackCustomerSignup(customer: { email: string; name?: string }) {
  const settings = await getKlaviyoSettings();
  if (!settings.trackEvents.customerSignup) return;
  return trackKlaviyoEvent('Customer Registered', customer.email, {
    signupDate: new Date().toISOString()
  }, {
    first_name: customer.name?.split(' ')[0],
    last_name: customer.name?.split(' ').slice(1).join(' ')
  });
}

export async function trackNewsletterSignup(email: string) {
  const settings = await getKlaviyoSettings();
  if (!settings.trackEvents.newsletterSignup) return;
  return trackKlaviyoEvent('Newsletter Subscribed', email, {
    source: 'Storefront Footer / Popup'
  });
}

export async function trackEmailVerified(email: string, _name?: string) {
  const settings = await getKlaviyoSettings();
  if (!settings.trackEvents.emailVerified) return;
  return trackKlaviyoEvent('Email Verified', email, {
    verifiedAt: new Date().toISOString()
  });
}

export async function trackAddToCart(email: string, item: any, quantity: number = 1) {
  const settings = await getKlaviyoSettings();
  if (!settings.trackEvents.addToCart) return;
  return trackKlaviyoEvent('Added to Cart', email, {
    ProductName: item.title || item.productTitle,
    ProductID: item.id || item.productId,
    Price: item.price,
    Quantity: quantity,
    Value: (item.price || 0) * quantity
  });
}

/**
 * Whether one order/cart line is a subscription plan rather than a one-off can.
 * Recognises the flag, the synthetic `sub-pack-` id the checkout builds, and the
 * vendor the account-page plan checkout uses.
 */
function isSubscriptionLineItem(item: any): boolean {
  if (!item) return false;
  const productId = String(item.productId || item.id || '');
  return Boolean(
    item.isSubscription ||
    productId.includes('sub-pack') ||
    item.vendor === 'Subscription Pack' ||
    item.subscriptionPlan
  );
}

/**
 * Klaviyo's abandoned-cart flow triggers on the metric named "Started Checkout".
 * This used to send "Checkout Started", which created a separate metric that no
 * flow was listening to, so abandoned carts never fired.
 */
export async function trackCheckoutStarted(
  email: string,
  cartItems: any[],
  totalValue: number,
  options: { checkoutId?: string; customerName?: string; recurring?: boolean } = {}
) {
  const settings = await getKlaviyoSettings();
  if (!settings.trackEvents.checkoutStarted) return;

  const formattedItems = (Array.isArray(cartItems) ? cartItems : []).map((i: any) => {
    const priceNum = typeof i.price === 'number' ? i.price : parseFloat(i.price) || 0;
    const qtyNum = typeof i.quantity === 'number' ? i.quantity : parseInt(i.quantity) || 1;
    return {
      ProductID: String(i.productId || i.id || 'prod-generic'),
      SKU: String(i.sku || i.productId || i.id || 'SKU-001'),
      ProductName: String(i.productTitle || i.title || i.name || 'Nicotine Pouch Pack'),
      Quantity: qtyNum,
      ItemPrice: priceNum,
      RowTotal: parseFloat((priceNum * qtyNum).toFixed(2)),
      ImageURL: i.image || i.imageUrl || '',
      IsSubscription: isSubscriptionLineItem(i)
    };
  });

  const nameParts = String(options.customerName || '').trim().split(/\s+/);

  return trackKlaviyoEvent('Started Checkout', email, {
    // Ties the event to one checkout attempt so a retry is not counted twice.
    ...(options.checkoutId ? { $event_id: options.checkoutId, CheckoutId: options.checkoutId } : {}),
    $value: totalValue,
    ItemNames: formattedItems.map(i => i.ProductName),
    Items: formattedItems,
    Categories: ['Nicotine Pouches', 'Storefront'],
    IsSubscription: options.recurring ?? formattedItems.some(i => i.IsSubscription)
  }, {
    first_name: nameParts[0] || undefined,
    last_name: nameParts.slice(1).join(' ') || undefined
  });
}

export async function trackPurchaseCompleted(order: any) {
  const settings = await getKlaviyoSettings();
  if (settings.trackEvents && settings.trackEvents.purchase === false) return;
  const email = (order.customerEmail || 'customer@pouch-supply.com').toLowerCase().trim();

  const nameParts = (order.customerName || '').trim().split(/\s+/);
  const firstName = nameParts[0] || 'Valued';
  const lastName = nameParts.slice(1).join(' ') || 'Customer';

  const rawItems = Array.isArray(order.items) ? order.items : [];
  const formattedItems = rawItems.map((i: any) => {
    const priceNum = typeof i.price === 'number' ? i.price : parseFloat(i.price) || 0;
    const qtyNum = typeof i.quantity === 'number' ? i.quantity : parseInt(i.quantity) || 1;
    return {
      ProductID: String(i.productId || i.id || 'prod-generic'),
      SKU: String(i.sku || i.productId || i.id || 'SKU-001'),
      ProductName: String(i.productTitle || i.title || i.name || 'Nicotine Pouch Pack'),
      Quantity: qtyNum,
      ItemPrice: priceNum,
      Price: priceNum,
      RowTotal: parseFloat((priceNum * qtyNum).toFixed(2)),
      ImageURL: i.image || i.imageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
      Vendor: i.vendor || 'Pouch Supply Co.',
      IsSubscription: isSubscriptionLineItem(i),
      IsRewardItem: Boolean(i.isRewardItem)
    };
  });

  const itemNames = formattedItems.map((i: any) => i.ProductName);
  const totalVal = typeof order.total === 'number' ? order.total : parseFloat(order.total) || 0;
  const orderIdStr = String(order.id || order.orderId || `PS${Math.floor(Math.random() * 90000 + 10000)}`);

  // Lets a flow separate plan orders from one-off purchases. Previously the
  // event carried no such marker, so an "order confirmation (non-subscribers)"
  // flow had nothing to filter on but product-name guesswork.
  const isSubscriptionOrder = Boolean(
    order.isSubscription ||
    order.subscriptionId ||
    formattedItems.some((i: any) => i.IsSubscription) ||
    (Array.isArray(order.tags) && order.tags.some((t: any) => String(t).toLowerCase().includes('subscription')))
  );
  // A renewal is charged automatically; the first order is the one the customer
  // just checked out. Welcome/confirmation copy usually differs between them.
  const isRenewal = Boolean(
    order.isRenewal ||
    (Array.isArray(order.tags) && order.tags.some((t: any) => String(t).toLowerCase().includes('renewal'))) ||
    formattedItems.some((i: any) => /recurring renewal/i.test(String(i.ProductName)))
  );

  // Ensure consent is granted so Klaviyo flows dispatch emails immediately
  await syncKlaviyoProfileWithConsent(email, firstName, lastName);

  // 1. Send standard Klaviyo "Placed Order" event
  const placedOrderRes = await trackKlaviyoEvent('Placed Order', email, {
    $event_id: orderIdStr,
    $value: totalVal,
    OrderId: orderIdStr,
    order_id: orderIdStr,
    ItemNames: itemNames,
    Items: formattedItems,
    Categories: ['Nicotine Pouches', 'Storefront'],
    IsSubscription: isSubscriptionOrder,
    IsRenewal: isRenewal,
    OrderType: isSubscriptionOrder ? (isRenewal ? 'Subscription Renewal' : 'Subscription') : 'One-off',
    Destination: order.destination || order.address || 'United Kingdom',
    DeliveryMethod: order.deliveryMethod || 'Royal Mail Tracked 24/48',
    DiscountApplied: order.discountApplied || null,
    StoreCreditApplied: order.storeCreditApplied || 0,
    ShippingAddress: {
      first_name: firstName,
      last_name: lastName,
      address1: order.destination || order.address || 'United Kingdom'
    },
    extra: {
      order_id: orderIdStr,
      items: formattedItems,
      total: totalVal,
      date: order.date || new Date().toISOString()
    }
  }, {
    $email: email,
    $first_name: firstName,
    $last_name: lastName,
    first_name: firstName,
    last_name: lastName
  });

  // 2. Track "Ordered Product" for each line item (standard Klaviyo metric)
  for (const item of formattedItems) {
    try {
      await trackKlaviyoEvent('Ordered Product', email, {
        $event_id: `${orderIdStr}_${item.ProductID}`,
        $value: item.RowTotal,
        OrderId: orderIdStr,
        ProductID: item.ProductID,
        SKU: item.SKU,
        ProductName: item.ProductName,
        Quantity: item.Quantity,
        ItemPrice: item.ItemPrice,
        RowTotal: item.RowTotal,
        ImageURL: item.ImageURL
      }, {
        $email: email,
        $first_name: firstName,
        $last_name: lastName
      });
    } catch (e) {}
  }

  return placedOrderRes;
}

/**
 * Fires when a subscription is created, so a "Subscription confirmation" flow has
 * something to trigger on. Nothing used to be sent here at all: the client had a
 * trackSubscriptionStarted helper that was never called from anywhere, so the
 * metric did not exist in Klaviyo.
 *
 * Point the flow at the "Started Subscription" metric.
 */
export async function trackSubscriptionStarted(subscription: any, order?: any) {
  const settings = await getKlaviyoSettings();
  if (settings.trackEvents && settings.trackEvents.purchase === false) return;

  const email = String(
    subscription?.customerEmail || order?.customerEmail || 'customer@pouch-supply.com'
  ).toLowerCase().trim();

  const nameParts = String(subscription?.customerName || order?.customerName || '').trim().split(/\s+/);
  const firstName = nameParts[0] || 'Valued';
  const lastName = nameParts.slice(1).join(' ') || 'Customer';

  const subId = String(subscription?.id || subscription?.subscriptionId || '');
  const amount = typeof subscription?.amount === 'number'
    ? subscription.amount
    : parseFloat(subscription?.amount) || 0;

  // Consent so the flow is allowed to send. Harmless when no list is configured;
  // it simply logs that consent could not be recorded.
  await syncKlaviyoProfileWithConsent(email, firstName, lastName);

  return trackKlaviyoEvent('Started Subscription', email, {
    // One event per subscription, so a retried webhook cannot duplicate it.
    ...(subId ? { $event_id: `sub_started_${subId}` } : {}),
    $value: amount,
    SubscriptionID: subId,
    PlanName: subscription?.planName || subscription?.planId || 'Subscription Plan',
    PlanId: subscription?.planId || null,
    BillingInterval: subscription?.billingInterval || 'bi-weekly',
    NextBillingDate: subscription?.nextBillingDate || null,
    ItemPrice: subscription?.itemPrice ?? null,
    ShippingCost: subscription?.shippingCost ?? null,
    Currency: subscription?.currency || 'GBP',
    FirstOrderId: order?.id || order?.orderId || null,
    IsSubscription: true,
    Categories: ['Nicotine Pouches', 'Subscription']
  }, {
    first_name: firstName,
    last_name: lastName
  });
}

export async function trackOrderRefunded(order: any, refundAmount?: number) {
  const settings = await getKlaviyoSettings();
  if (!settings.trackEvents.refunded) return;
  const email = order.customerEmail || 'customer@pouch-supply.com';
  return trackKlaviyoEvent('Refunded Order', email, {
    $event_id: String(order.id || order.orderId),
    $value: refundAmount !== undefined ? refundAmount : order.total,
    OrderId: String(order.id || order.orderId)
  });
}

export async function trackWishlistAdded(email: string, item: any) {
  const settings = await getKlaviyoSettings();
  if (!settings.trackEvents.wishlist) return;
  return trackKlaviyoEvent('Added to Wishlist', email, {
    ProductName: item.title,
    ProductID: item.id,
    Price: item.price
  });
}

export async function trackOrderShipped(order: any, trackingNumber?: string, carrier?: string) {
  const email = order.customerEmail || 'customer@pouch-supply.com';
  return trackKlaviyoEvent('Order Shipped', email, {
    $event_id: String(order.id || order.orderId),
    OrderId: String(order.id || order.orderId),
    Carrier: carrier || order.carrier || 'Royal Mail',
    TrackingNumber: trackingNumber || order.trackingNumber || order.trackingId,
    TrackingUrl: `https://www.royalmail.com/track-your-item#/tracking-results/${trackingNumber || order.trackingNumber || order.trackingId}`,
    Destination: order.destination || order.address
  });
}
