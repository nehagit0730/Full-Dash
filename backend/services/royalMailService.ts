import { fetchResource, saveResource, fetchStoreSetting, saveStoreSetting } from '../../serverDb';
import {
  createRoyalMailOrders,
  cancelOrder as cancelRoyalMailOrder,
  getOrderByReference,
  getRoyalMailLabel,
  markRoyalMailOrderDispatched,
  RoyalMailError,
  CreateRoyalMailOrderRequest
} from '../../src/lib/royalMail';

/**
 * Royal Mail Click & Drop integration — LIVE ONLY.
 *
 * There is no simulated mode and no fallback label generation. Every shipment,
 * tracking number and label in this module comes from the Royal Mail API. If
 * the API is unreachable, unauthorised, or rejects the order, the call fails
 * loudly rather than inventing a shipment: a fabricated tracking number sends
 * the customer a dispatch email for a parcel that does not exist, and a
 * hand-drawn label is not scannable by Royal Mail.
 */

export interface RoyalMailSettings {
  apiKey: string;
  integrationName: string;
  enabled: boolean;
  /**
   * When true, a Click & Drop order is created the instant a payment succeeds.
   * Off by default: a shipment should be registered when the order is actually
   * packed, not when it is paid for.
   */
  autoCreateShipmentOnPayment: boolean;
  defaultServiceCode: string; // Royal Mail service code — this account holds OLP1, OLP1SF, OLP2, OLP2SF
  // Two-digit OBA contract identifier ("01", "02", ...). Some accounts hold more
  // than one rate agreement for the same service and Click & Drop needs to know
  // which. Left blank when the account has only one.
  defaultServiceRegisterCode?: string;
  defaultPackageType: string; // Click & Drop packageFormatIdentifier, e.g. 'smallParcel'
  defaultWeightGrams: number;
  senderAddress: {
    companyName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postcode: string;
    countryCode: string;
    contactEmail: string;
    contactPhone: string;
  };
}

/**
 * Defaults deliberately leave the trading identity blank. A placeholder sender
 * address would be printed on real labels and used as the returns address, so
 * it must be filled in from the admin Royal Mail settings before shipping.
 */
export const DEFAULT_ROYAL_MAIL_SETTINGS: RoyalMailSettings = {
  apiKey: process.env.RM_API_KEY || process.env.ROYAL_MAIL_API_KEY || '',
  integrationName: 'Pouch-Supply',
  enabled: true,
  autoCreateShipmentOnPayment:
    String(process.env.ROYAL_MAIL_AUTO_DISPATCH || '').toLowerCase() === 'true',
  // Royal Mail Tracked 24 (Online Postage). Verified accepted on this account.
  // Tracked is the default because it is the only family that issues a tracking
  // number — without one the order can never move to Shipped and no dispatch
  // email is sent. Change it in Admin → Settings → Royal Mail; blanking it is
  // still valid and means "apply postage in Click & Drop".
  defaultServiceCode: 'TOLP24',
  // Click & Drop reads 'parcel' as LARGE Parcel, which Royal Mail refuses to
  // carry on Tracked 24/48 -- the order is created but the label cannot be
  // generated, so no tracking number is ever issued. A small parcel is the
  // format these packs actually are and is valid on every service here.
  defaultPackageType: 'smallParcel',
  defaultWeightGrams: 70,
  senderAddress: {
    companyName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    countryCode: 'GB',
    contactEmail: process.env.ADMIN_NOTIFICATION_EMAIL || '',
    contactPhone: ''
  }
};

export interface AddressPayload {
  fullName: string;
  companyName?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  county?: string;
  postcode: string;
  countryCode?: string;
  email?: string;
  phone?: string;
}

export interface PackageItemPayload {
  name: string;
  quantity: number;
  unitValue: number;
  unitWeightGrams?: number;
  sku?: string;
}

export interface ShippingRateOption {
  serviceCode: string;
  serviceName: string;
  estimatedDelivery: string;
  price: number;
  currency: string;
  tracked: boolean;
  signatureRequired: boolean;
}

// 1. Fetch & Save Royal Mail Settings
export async function getRoyalMailSettings(): Promise<RoyalMailSettings> {
  const envKey = process.env.RM_API_KEY || process.env.ROYAL_MAIL_API_KEY || '';
  try {
    let stored: any = await fetchStoreSetting('royalmail_settings');
    if (!stored || (typeof stored === 'object' && Object.keys(stored).length === 0)) {
      const legacy: any = await fetchResource('royalmail_settings');
      if (legacy && Array.isArray(legacy) && legacy.length > 0) {
        stored = legacy[0];
      }
    }

    if (stored && typeof stored === 'object') {
      const item = Array.isArray(stored) ? stored[0] : stored;
      return {
        ...DEFAULT_ROYAL_MAIL_SETTINGS,
        ...item,
        // A saved code from the old OBA setup is translated here rather than at
        // shipment time only, so the admin screen shows the service that will
        // actually be used. An empty saved value stays empty — "apply postage in
        // Click & Drop" is a deliberate choice, not a missing setting.
        defaultServiceCode:
          item.defaultServiceCode === undefined
            ? DEFAULT_ROYAL_MAIL_SETTINGS.defaultServiceCode
            : resolveServiceCode(item.defaultServiceCode),
        apiKey: item.apiKey && item.apiKey.trim().length > 0 ? item.apiKey : (envKey || DEFAULT_ROYAL_MAIL_SETTINGS.apiKey),
        senderAddress: {
          ...DEFAULT_ROYAL_MAIL_SETTINGS.senderAddress,
          ...(item.senderAddress || {})
        }
      };
    }
  } catch (err) {
    console.warn('[RoyalMailService] Error reading settings, using defaults:', err);
  }
  return {
    ...DEFAULT_ROYAL_MAIL_SETTINGS,
    apiKey: envKey || DEFAULT_ROYAL_MAIL_SETTINGS.apiKey
  };
}

export async function saveRoyalMailSettings(settings: Partial<RoyalMailSettings>): Promise<RoyalMailSettings> {
  const current = await getRoyalMailSettings();
  const apiKeyVal = (settings.apiKey !== undefined ? settings.apiKey : current.apiKey) || '';
  const updated: RoyalMailSettings = {
    ...current,
    ...settings,
    apiKey: apiKeyVal,
    senderAddress: {
      ...current.senderAddress,
      ...(settings.senderAddress || {})
    }
  };

  if (apiKeyVal) {
    process.env.RM_API_KEY = apiKeyVal;
    process.env.ROYAL_MAIL_API_KEY = apiKeyVal;
  }

  await saveStoreSetting('royalmail_settings', updated);
  await saveResource('royalmail_settings', [updated]);
  return updated;
}

/**
 * Resolves the live API key, or throws. Every outbound call goes through this
 * so a missing key can never silently degrade into a simulated shipment.
 */
export async function requireApiKey(settings?: RoyalMailSettings): Promise<string> {
  const s = settings || (await getRoyalMailSettings());
  const apiKey = (s.apiKey || process.env.RM_API_KEY || process.env.ROYAL_MAIL_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error(
      'Royal Mail Click & Drop API key is not configured. Add your API Authorization key in ' +
        'Admin → Settings → Royal Mail (or set ROYAL_MAIL_API_KEY) before creating shipments.'
    );
  }
  return apiKey;
}

/**
 * Validates the sender identity that will be printed on the label and used as
 * the returns address. Click & Drop requires a real trading name.
 */
function requireSender(settings: RoyalMailSettings) {
  const sender = settings.senderAddress || ({} as RoyalMailSettings['senderAddress']);
  const tradingName = (sender.companyName || '').trim();
  if (!tradingName) {
    throw new Error(
      'Royal Mail sender trading name is not configured. Set your company name and address in ' +
        'Admin → Settings → Royal Mail before creating shipments.'
    );
  }
  return sender;
}

// 2. Validate Address
export function validateAddress(address: Partial<AddressPayload>): { valid: boolean; errors: string[]; parsed?: AddressPayload } {
  const errors: string[] = [];
  if (!address.fullName || address.fullName.trim().length < 2) {
    errors.push('Full recipient name is required');
  }
  if (!address.addressLine1 || address.addressLine1.trim().length < 3) {
    errors.push('Address line 1 is required');
  }
  if (!address.city || address.city.trim().length < 2) {
    errors.push('City / Town is required');
  }
  if (!address.postcode || address.postcode.trim().length < 3) {
    errors.push('Postcode / Postal Code is required');
  } else {
    // Basic UK Postcode formatting & check if country is GB
    const country = normalizeCountryCode(address.countryCode);
    if (country === 'GB') {
      const ukPostcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
      if (!ukPostcodeRegex.test(address.postcode.trim())) {
        errors.push('Postcode format does not appear to be a valid UK postcode (e.g. EC1A 1BB or SW1A 1AA)');
      }
    }
  }

  const parsed: AddressPayload = {
    fullName: (address.fullName || '').trim(),
    companyName: (address.companyName || '').trim(),
    addressLine1: (address.addressLine1 || '').trim(),
    addressLine2: (address.addressLine2 || '').trim(),
    city: (address.city || '').trim(),
    county: (address.county || '').trim(),
    postcode: (address.postcode || '').trim().toUpperCase(),
    countryCode: normalizeCountryCode(address.countryCode),
    email: (address.email || '').trim(),
    phone: (address.phone || '').trim()
  };

  return {
    valid: errors.length === 0,
    errors,
    parsed
  };
}

/**
 * Domestic service codes this Click & Drop account actually holds. Anything
 * outside this set is rejected with error 31 before a label is ever produced.
 */
export const UK_SERVICE_CODES = ['TOLP24', 'TOLP48', 'OLP1', 'OLP1SF', 'OLP2', 'OLP2SF'] as const;

/**
 * Codes the store was configured with before the contract was checked. They are
 * OBA services this account does not hold, so a saved setting containing one
 * would fail every domestic shipment. Rather than making the operator notice and
 * re-pick, translate to the nearest service that is actually on the contract.
 */
const LEGACY_SERVICE_CODE_MAP: Record<string, string> = {
  // Tracked equivalents. These used to collapse onto OLP1/OLP2, which quietly
  // turned a tracked service into an untracked one — the parcel shipped, no
  // tracking number was ever issued, and the order stayed Unfulfilled.
  TPNN: 'TOLP24',
  TRNN: 'TOLP24',
  TPN24: 'TOLP24',
  TPSN: 'TOLP48',
  TRSN: 'TOLP48',
  TPS48: 'TOLP48',
  // Untracked 1st Class equivalents
  CRL1: 'OLP1',
  BPL1: 'OLP1',
  // Untracked 2nd Class equivalents
  CRL2: 'OLP2',
  BPL2: 'OLP2',
  // Signature-on-delivery equivalents
  TPNS: 'OLP1SF',
  TPSS: 'OLP2SF',
  BPR1: 'OLP1SF',
  BPR2: 'OLP2SF',
  SD1: 'OLP1SF',
  SD2: 'OLP1SF'
};

/**
 * Click & Drop's own email/SMS despatch notifications are a feature of the
 * Tracked services. The Online Postage (OLP) range this account posts with does
 * not carry them, and sending the flags anyway fails the whole order with
 * "Email notification is not available for the service 'OLP1'" — no label, no
 * shipment.
 *
 * Nothing is lost by leaving them off: the store sends its own dispatch email
 * (emailService) and its own Klaviyo event. This only suppresses the duplicate
 * Royal Mail would have sent.
 */
export function serviceSupportsNotifications(code?: string): boolean {
  const raw = String(code ?? '').trim().toUpperCase();
  // No service code means postage is applied in Click & Drop, where the
  // notification setting belongs to whatever service is picked there.
  if (!raw) return false;
  // The Online Postage family, TOLP24/TOLP48 included. Tracked services can
  // carry Royal Mail's own email and SMS, but the store already sends its own
  // dispatch email with the tracking number, so switching these on would send
  // the customer two notifications for one parcel.
  if (raw.startsWith('OLP') || raw.startsWith('TOLP')) return false;
  return true;
}

/**
 * Royal Mail's wording when a service cannot carry despatch notifications. The
 * error arrives as a normal rejection, so it is matched on text: an account that
 * later adds a service we have not classified should not lose the shipment over
 * an optional flag.
 */
const NOTIFICATION_UNAVAILABLE_RE = /notification is not available|notifications are not available/i;

/**
 * Posts an order to Click & Drop, turning a 5xx into an explanation an operator
 * can act on. Royal Mail answers these with nothing but "Internal server error.
 * CorrelationId:…", which reads like a bug in the store. It is not retried
 * automatically: the API may have created the order before failing, and a blind
 * retry would put two labels on one parcel.
 */
async function postOrder(payload: CreateRoyalMailOrderRequest, apiKey: string, orderId: string) {
  try {
    return await createRoyalMailOrders([payload], apiKey);
  } catch (err: any) {
    if (err instanceof RoyalMailError && err.status >= 500) {
      throw new Error(
        `Royal Mail's API failed while creating the shipment for order #${orderId}: ${err.message} ` +
          'This is an error on Royal Mail\'s side, not a problem with the order. Check Click & Drop ' +
          `for an order with reference ${payload.orderReference} before trying again — if one is ` +
          'there, the shipment was created and only the response was lost. Quote the CorrelationId ' +
          'to Royal Mail support if it keeps happening.'
      );
    }
    throw err;
  }
}

/** Flattens the per-order error arrays of a Click & Drop response into plain strings. */
function collectFailureMessages(result: any): string[] {
  const failed = Array.isArray(result?.failedOrders) ? result.failedOrders : [];
  return failed.flatMap((f: any) => {
    const errors = Array.isArray(f?.errors) ? f.errors : f?.errors ? [f.errors] : [];
    return errors.map((e: any) => String(e?.errorMessage || e?.message || e?.code || ''));
  });
}

/**
 * Maps a service code onto one this account can actually post with. Unknown
 * codes are passed through untouched — an operator may legitimately add a new
 * service in Click & Drop before this list catches up, and Royal Mail is the
 * authority on what it accepts, not us.
 */
/**
 * Click & Drop package formats, and the values people actually have saved.
 *
 * The identifiers are camelCase and 'parcel' means LARGE parcel -- a 70g pack
 * sent as one is refused by Royal Mail on the Tracked services with
 * "not possible to ship to the specified country, package format using this
 * shipping service". The order still saves, so the only visible symptom is a
 * label that never generates and a tracking number that never arrives.
 */
export const PACKAGE_FORMATS = [
  'letter',
  'largeLetter',
  'smallParcel',
  'mediumParcel',
  'parcel',
  'documents',
  'tube'
] as const;

const PACKAGE_FORMAT_ALIASES: Record<string, string> = {
  LETTER: 'letter',
  LARGELETTER: 'largeLetter',
  'LARGE LETTER': 'largeLetter',
  SMALLPARCEL: 'smallParcel',
  'SMALL PARCEL': 'smallParcel',
  MEDIUMPARCEL: 'mediumParcel',
  'MEDIUM PARCEL': 'mediumParcel',
  // 'Parcel' was the old stored default and means LARGE parcel to Click & Drop,
  // which is what broke label generation. Read it as a medium parcel: the
  // largest format the tracked services accept.
  PARCEL: 'mediumParcel',
  'LARGE PARCEL': 'parcel',
  DOCUMENTS: 'documents',
  TUBE: 'tube'
};

export function resolvePackageFormat(value?: string): string {
  const raw = String(value ?? '').trim();
  if (!raw) return 'smallParcel';
  const exact = PACKAGE_FORMATS.find(f => f === raw);
  if (exact) return exact;
  const alias = PACKAGE_FORMAT_ALIASES[raw.toUpperCase()];
  if (alias) {
    if (alias !== raw) {
      console.warn(`[RoyalMailService] Package format "${raw}" read as "${alias}".`);
    }
    return alias;
  }
  console.warn(`[RoyalMailService] Unknown package format "${raw}"; using smallParcel.`);
  return 'smallParcel';
}

export function resolveServiceCode(code?: string): string {
  const raw = String(code ?? '').trim().toUpperCase();
  if (!raw) return '';
  const mapped = LEGACY_SERVICE_CODE_MAP[raw];
  if (mapped) {
    console.warn(
      `[RoyalMailService] Service code ${raw} is not on this Click & Drop contract; using ${mapped} instead.`
    );
    return mapped;
  }
  return raw;
}

/**
 * 3. The store's own delivery price card.
 *
 * These are the prices YOU charge the customer at checkout and the service
 * codes you offer. Click & Drop has no public rating API — what you are billed
 * by Royal Mail comes from your account's contracted rates, not from here.
 *
 * The service codes, however, are not ours to choose. They must be real Royal
 * Mail codes AND present on your OBA / Click & Drop contract, or Click & Drop
 * rejects the shipment with error 31.
 *
 * This account's contracted domestic services (Click & Drop > Settings >
 * Services, https://business.parcel.royalmail.com/settings/services/) are the
 * Online Postage (OLP) range, each one confirmed accepted by Royal Mail:
 *   TOLP24  Royal Mail Tracked 24®          (tracked)
 *   TOLP48  Royal Mail Tracked 48®          (tracked)
 *   OLP1    Royal Mail 1st Class
 *   OLP1SF  Royal Mail Signed For® 1st Class
 *   OLP2    Royal Mail 2nd Class
 *   OLP2SF  Royal Mail Signed For® 2nd Class
 *
 * Only the two TOLP services issue a tracking number. On the others the order
 * cannot reach Shipped, so no dispatch email is sent.
 *
 * The OBA codes this store used previously — TPNN/TPSN, CRL1/CRL2, BPL1/BPL2,
 * SD1 — are NOT on this contract and failed with error 31. They are kept in
 * LEGACY_SERVICE_CODE_MAP so a stale saved setting is translated rather than
 * failing; the tracked ones now translate to TOLP24/TOLP48.
 */
export function getShippingRates(weightGrams: number = 70, countryCode: string = 'GB'): ShippingRateOption[] {
  const isUK = normalizeCountryCode(countryCode) === 'GB';

  if (isUK) {
    return [
      {
        serviceCode: 'TOLP24',
        serviceName: 'Royal Mail Tracked 24®',
        estimatedDelivery: '1-2 Working Days (Tracked)',
        price: 4.75,
        currency: 'GBP',
        tracked: true,
        signatureRequired: false
      },
      {
        serviceCode: 'TOLP48',
        serviceName: 'Royal Mail Tracked 48®',
        estimatedDelivery: '2-3 Working Days (Tracked)',
        price: 3.99,
        currency: 'GBP',
        tracked: true,
        signatureRequired: false
      },
      {
        serviceCode: 'OLP1',
        serviceName: 'Royal Mail 1st Class',
        estimatedDelivery: '1-2 Working Days',
        price: 3.95,
        currency: 'GBP',
        tracked: false,
        signatureRequired: false
      },
      {
        serviceCode: 'OLP1SF',
        serviceName: 'Royal Mail Signed For® 1st Class',
        estimatedDelivery: '1-2 Working Days (Signature on Delivery)',
        price: 5.45,
        currency: 'GBP',
        tracked: false,
        signatureRequired: true
      },
      {
        serviceCode: 'OLP2',
        serviceName: 'Royal Mail 2nd Class',
        estimatedDelivery: '2-3 Working Days',
        price: 3.25,
        currency: 'GBP',
        tracked: false,
        signatureRequired: false
      },
      {
        serviceCode: 'OLP2SF',
        serviceName: 'Royal Mail Signed For® 2nd Class',
        estimatedDelivery: '2-3 Working Days (Signature on Delivery)',
        price: 4.75,
        currency: 'GBP',
        tracked: false,
        signatureRequired: true
      }
    ];
  }

  return [
    {
      serviceCode: 'MP1',
      serviceName: 'Royal Mail International Tracked',
      estimatedDelivery: '3-5 Working Days (Europe) / 5-7 Days (Worldwide)',
      price: 12.50,
      currency: 'GBP',
      tracked: true,
      signatureRequired: false
    },
    {
      serviceCode: 'MP2',
      serviceName: 'Royal Mail International Tracked & Signed',
      estimatedDelivery: '3-5 Working Days (Europe) / 5-7 Days (Worldwide)',
      price: 14.95,
      currency: 'GBP',
      tracked: true,
      signatureRequired: true
    }
  ];
}

/**
 * Royal Mail expects an ISO country code. Checkout stores a display name
 * ("United Kingdom"), which would otherwise reach the API verbatim.
 */
export function normalizeCountryCode(value?: string): string {
  const raw = String(value ?? '').trim();
  if (!raw) return 'GB';
  if (/^[A-Za-z]{2}$/.test(raw)) return raw.toUpperCase() === 'UK' ? 'GB' : raw.toUpperCase();
  const mapped = COUNTRY_TOKENS[raw.toLowerCase()];
  return mapped || raw.toUpperCase();
}

const UK_POSTCODE_RE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i;

const COUNTRY_TOKENS: Record<string, string> = {
  'united kingdom': 'GB',
  'great britain': 'GB',
  uk: 'GB',
  gb: 'GB',
  england: 'GB',
  scotland: 'GB',
  wales: 'GB',
  'northern ireland': 'GB',
  ireland: 'IE',
  'republic of ireland': 'IE'
};

/**
 * Recovers a postable address from the single-line destination string that
 * checkout writes ("39 Tonks Drive, telford, tf4 2tq, United Kingdom").
 *
 * The shopper does enter the town and postcode separately; only the joined
 * string survives on older orders, so the parts are read back out of it rather
 * than reported as missing. Nothing is invented: a segment that cannot be
 * identified is left empty and validation still rejects the order.
 */
export function parseAddressString(raw: string, fallbackName = ''): Partial<AddressPayload> {
  const text = String(raw || '').trim();
  if (!text) return { fullName: fallbackName };

  let segments = text
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // Checkout seeded its address line from a previously saved full address and
  // then appended town/postcode/country again, so the tail can repeat verbatim.
  // Consecutive duplicates are collapsed before anything is read positionally.
  const deduped: string[] = [];
  for (const seg of segments) {
    if (!deduped.some(existing => existing.toLowerCase() === seg.toLowerCase())) {
      deduped.push(seg);
    }
  }
  segments = deduped;

  let countryCode = '';
  let postcode = '';
  let city = '';

  // Country: only ever the trailing segment, and only when it is a country name.
  if (segments.length > 1) {
    const last = segments[segments.length - 1].toLowerCase();
    if (COUNTRY_TOKENS[last]) {
      countryCode = COUNTRY_TOKENS[last];
      segments.pop();
    }
  }

  // Postcode: taken from wherever it appears, since some addresses put it on
  // the same segment as the town ("London EC1A 1BB").
  for (let i = segments.length - 1; i >= 0; i--) {
    const match = segments[i].match(UK_POSTCODE_RE);
    if (!match) continue;
    postcode = `${match[1]} ${match[2]}`.toUpperCase();
    const remainder = segments[i].replace(match[0], '').trim().replace(/^[,\s-]+|[,\s-]+$/g, '');
    if (remainder) {
      segments[i] = remainder;
    } else {
      segments.splice(i, 1);
    }
    break;
  }

  // Town: the last segment left once country and postcode are out of the way.
  // A single remaining segment is the street, not the town.
  if (segments.length > 1) {
    city = segments.pop() as string;
  }

  return {
    fullName: fallbackName,
    addressLine1: segments[0] || '',
    addressLine2: segments.slice(1).join(', '),
    city,
    postcode,
    countryCode: countryCode || 'GB'
  };
}

/**
 * Resolves the recipient address from a stored order.
 *
 * Returns the parsed address plus any validation errors. Nothing is defaulted:
 * a missing city or postcode is reported, never replaced with a placeholder,
 * because a placeholder would ship a real parcel to an address nobody lives at.
 */
function resolveRecipientFromOrder(order: any): { valid: boolean; errors: string[]; recipient: AddressPayload } {
  // A structured address is preferred wherever checkout recorded one; the flat
  // destination string is the fallback for orders placed before it did.
  const structured =
    (order.shippingAddress && typeof order.shippingAddress === 'object' ? order.shippingAddress : null) ||
    (order.data?.shippingAddress && typeof order.data.shippingAddress === 'object' ? order.data.shippingAddress : null) ||
    (order.data?.address && typeof order.data.address === 'object' ? order.data.address : null) ||
    (order.address && typeof order.address === 'object' ? order.address : null);

  const rawAddr = structured || order.data?.address || order.address || order.shippingAddress || order.destination || '';
  let addressObj: Partial<AddressPayload> = {};

  if (rawAddr && typeof rawAddr === 'object') {
    addressObj = {
      fullName: rawAddr.fullName || rawAddr.name || order.customerName,
      companyName: rawAddr.companyName || '',
      addressLine1: rawAddr.addressLine1 || rawAddr.street || rawAddr.line1 || '',
      addressLine2: rawAddr.addressLine2 || rawAddr.line2 || '',
      city: rawAddr.city || rawAddr.town || '',
      county: rawAddr.county || rawAddr.state || '',
      postcode: rawAddr.postcode || rawAddr.zip || '',
      countryCode: rawAddr.countryCode || rawAddr.country || 'GB',
      email: order.customerEmail,
      phone: rawAddr.phone || order.customerPhone || ''
    };
  } else {
    // The town and postcode the shopper typed are still present in the joined
    // destination string, so they are read back out of it instead of being
    // reported as missing. Anything genuinely absent stays empty and is caught
    // by validateAddress below.
    const parsedFromString = parseAddressString(
      typeof rawAddr === 'string' ? rawAddr : '',
      order.customerName || ''
    );
    addressObj = {
      ...parsedFromString,
      email: order.customerEmail,
      phone: order.customerPhone || ''
    };
  }

  const validation = validateAddress(addressObj);
  return {
    valid: validation.valid,
    errors: validation.errors,
    recipient: validation.parsed as AddressPayload
  };
}

/**
 * Tests whether Royal Mail will accept a service code on THIS account.
 *
 * Which codes are valid is not a property of the API — it is a property of the
 * account's OBA / Royal Mail Tracked contract, and there is no endpoint that
 * lists them. The only authoritative check is to offer Click & Drop an order and
 * see whether it takes it, so that is what this does: it submits one throwaway
 * order and immediately deletes it again when it is accepted.
 *
 * Nothing is ever labelled, manifested or dispatched, so no postage is bought.
 * A code that is rejected creates nothing in the first place.
 */
export async function testServiceCode(
  serviceCode: string,
  // Lets the test run before the sender address has been saved — useful when
  // checking codes from a deployment other than the live storefront.
  tradingNameOverride?: string
): Promise<{
  serviceCode: string;
  accepted: boolean;
  message: string;
  cleanedUp: boolean;
}> {
  // Deliberately NOT resolveServiceCode(): this probe exists to find out what
  // the account actually holds. Translating a Tracked code to its Online
  // Postage stand-in first would test the stand-in and report success, hiding
  // the very thing the operator is trying to discover.
  const code = String(serviceCode ?? '').trim().toUpperCase();
  if (!code) {
    return { serviceCode: code, accepted: false, message: 'No service code supplied.', cleanedUp: false };
  }

  const settings = await getRoyalMailSettings();
  const apiKey = await requireApiKey(settings);

  const overrideName = String(tradingNameOverride || '').trim();
  const sender = overrideName
    ? { ...(settings.senderAddress || ({} as any)), companyName: overrideName }
    : requireSender(settings);

  const reference = `SVC-TEST-${Date.now().toString().slice(-8)}`;
  const payload: CreateRoyalMailOrderRequest = {
    orderReference: reference,
    isRecipientABusiness: false,
    recipient: {
      address: {
        fullName: 'Service Code Test',
        addressLine1: sender.addressLine1 || '1 Test Street',
        city: sender.city || 'London',
        postcode: sender.postcode || 'EC1A 1BB',
        countryCode: 'GB'
      }
    },
    sender: { tradingName: sender.companyName.trim() },
    subtotal: 1,
    shippingCostCharged: 0,
    total: 1,
    currencyCode: 'GBP',
    orderDate: new Date().toISOString(),
    packages: [
      {
        weightInGrams: settings.defaultWeightGrams || 70,
        packageFormatIdentifier: resolvePackageFormat(settings.defaultPackageType),
        contents: [{ name: 'Service code test', quantity: 1, unitValue: 1, unitWeightInGrams: 100 }]
      }
    ],
    postageDetails: {
      serviceCode: code,
      // Same rule as a real shipment: a service without despatch notifications
      // rejects the flag, which would make a perfectly valid code look invalid.
      ...(serviceSupportsNotifications(code) ? { sendNotificationsTo: 'Sender' as const } : {})
    }
  };

  let result: any;
  try {
    result = await createRoyalMailOrders([payload], apiKey);
  } catch (err: any) {
    return { serviceCode: code, accepted: false, message: err?.message || String(err), cleanedUp: false };
  }

  const failed = result?.failedOrders?.[0];
  if (failed) {
    const errors = Array.isArray(failed.errors) ? failed.errors : failed.errors ? [failed.errors] : [];
    const message = errors.map((e: any) => e?.errorMessage || e?.message || JSON.stringify(e)).join(' | ');
    return { serviceCode: code, accepted: false, message: message || 'Rejected by Royal Mail.', cleanedUp: false };
  }

  const identifier = result?.createdOrders?.[0]?.orderIdentifier;
  let cleanedUp = false;
  if (identifier) {
    try {
      await cancelRoyalMailOrder(String(identifier), apiKey);
      cleanedUp = true;
    } catch (delErr: any) {
      console.warn(
        `[RoyalMailService] Test order ${identifier} for ${code} could not be removed automatically:`,
        delErr?.message
      );
    }
  }

  return {
    serviceCode: code,
    accepted: true,
    message: cleanedUp
      ? `Royal Mail accepts "${code}" on this account.`
      : `Royal Mail accepts "${code}", but the throwaway test order (${identifier}) is still in Click & Drop and should be deleted manually.`,
    cleanedUp
  };
}

export interface CreateShipmentResult {
  success: boolean;
  trackingNumber: string | null;
  royalMailOrderId: string;
  carrier: string;
  serviceName: string;
  serviceCode: string;
  labelUrl: string;
  /** The code asked for, before any contract translation. */
  requestedServiceCode?: string;
  /** True when the requested service was swapped for one on the contract. */
  serviceDowngraded?: boolean;
  /**
   * Why Royal Mail could not generate the label, when it could not. Empty is
   * meaningful: it separates "the label failed" from "no tracking yet", which
   * call for opposite actions from the operator.
   */
  labelErrors?: string[];
  message: string;
  order: any;
}

/**
 * 4. Create a live Click & Drop shipment for a store order.
 *
 * Throws on any failure — a missing API key, an unpostable address, or a
 * rejection from Royal Mail. The order is only moved to Shipped once Royal Mail
 * has actually issued a tracking number; until then it sits in Processing with
 * the Click & Drop identifier recorded, so the customer never receives a
 * dispatch email containing a tracking number that does not exist.
 */
export async function createRoyalMailShipment(orderId: string, options: {
  serviceCode?: string;
  serviceRegisterCode?: string;
  packageType?: string;
  weightGrams?: number;
} = {}): Promise<CreateShipmentResult> {
  const settings = await getRoyalMailSettings();
  const apiKey = await requireApiKey(settings);
  const sender = requireSender(settings);

  // Fetch order from DB
  const orders: any[] = (await fetchResource('orders')) || [];
  let order = orders.find((o: any) => String(o.id) === String(orderId));

  if (!order) {
    try {
      const { prisma } = await import('../../src/lib/prisma');
      order = await prisma.order.findUnique({ where: { id: orderId } });
    } catch (_e) {}
  }

  if (!order) {
    throw new Error(`Order #${orderId} not found in database.`);
  }

  const { valid, errors, recipient } = resolveRecipientFromOrder(order);
  if (!valid) {
    throw new Error(
      `Order #${orderId} cannot be shipped — the delivery address is incomplete: ${errors.join('; ')}. ` +
        `Edit the order's shipping address before creating a Royal Mail shipment.`
    );
  }

  // Empty means "no service": a deliberate, working choice, not a missing value.
  // resolveServiceCode() translates codes left over from the old OBA setup
  // (TPNN, CRL2, BPL1, …) onto the OLP services this contract actually holds,
  // so a stale saved setting does not fail every domestic shipment.
  const requestedServiceCode = String(options.serviceCode ?? settings.defaultServiceCode ?? '').trim().toUpperCase();
  const serviceCode = resolveServiceCode(requestedServiceCode);
  // Silently swapping the service is how an operator ends up believing they
  // bought tracking and posted without it, so the swap is reported back.
  const serviceDowngraded = Boolean(requestedServiceCode) && serviceCode !== requestedServiceCode;
  const registerCode = String(options.serviceRegisterCode || settings.defaultServiceRegisterCode || '').trim();
  const rates = getShippingRates(options.weightGrams || settings.defaultWeightGrams, recipient.countryCode);
  const selectedRate = rates.find(r => r.serviceCode === serviceCode);
  const serviceName =
    selectedRate?.serviceName ||
    (serviceCode ? `Royal Mail (${serviceCode})` : 'Royal Mail (postage set in Click & Drop)');

  console.log(`[RoyalMailService] Creating live Click & Drop order for #${orderId} via ${serviceCode}`);

  const addressObj: any = {
    fullName: recipient.fullName,
    addressLine1: recipient.addressLine1,
    city: recipient.city,
    postcode: recipient.postcode,
    countryCode: recipient.countryCode || 'GB'
  };
  if (recipient.companyName?.trim()) addressObj.companyName = recipient.companyName.trim();
  if (recipient.addressLine2?.trim()) addressObj.addressLine2 = recipient.addressLine2.trim();
  if (recipient.county?.trim()) addressObj.county = recipient.county.trim();

  const recipientObj: any = { address: addressObj };
  if (recipient.email) recipientObj.emailAddress = recipient.email.trim();
  if (recipient.phone?.trim()) recipientObj.phoneNumber = recipient.phone.trim();

  const senderObj: any = { tradingName: sender.companyName.trim() };
  if (sender.contactPhone?.trim()) senderObj.phoneNumber = sender.contactPhone.trim();
  if (sender.contactEmail?.trim()) senderObj.emailAddress = sender.contactEmail.trim();

  // Click & Drop shows these as the order's own breakdown, so sending zero
  // shipping made every label read "Retail shipping cost 0.00" with the
  // postage folded into the sub-total.
  //
  // Orders do not reliably carry subtotal/shippingCost -- they are optional
  // columns that default to 0, and `Number(undefined ?? 0)` is 0, which read
  // as a genuine free-delivery order rather than a missing figure. The line
  // items are the one part always present, so the split is derived from them
  // when it was not recorded.
  const money = (v: any): number => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : NaN;
  };
  const round2 = (n: number) => Math.round(n * 100) / 100;

  const totalVal = Number(order.total) || 0;

  const itemsTotal = Array.isArray(order.items)
    ? round2(
        order.items.reduce(
          (sum: number, it: any) => sum + (Number(it?.price) || 0) * (Number(it?.quantity) || 1),
          0
        )
      )
    : 0;

  let shippingVal = [
    order.shippingCost,
    order.deliveryCost,
    order.data?.shippingCost,
    order.data?.deliveryCost
  ].map(money).find(n => Number.isFinite(n)) as number;

  if (!Number.isFinite(shippingVal)) {
    // Whatever the customer paid above the line items is the delivery charge.
    shippingVal = itemsTotal > 0 && totalVal > itemsTotal ? round2(totalVal - itemsTotal) : 0;
  }

  let subtotalVal = [order.subtotal, order.data?.subtotal]
    .map(money)
    .find(n => Number.isFinite(n)) as number;

  if (!Number.isFinite(subtotalVal)) {
    subtotalVal = itemsTotal > 0 ? itemsTotal : Math.max(0, round2(totalVal - shippingVal));
  }

  const payload: CreateRoyalMailOrderRequest = {
    orderReference: String(order.id),
    isRecipientABusiness: Boolean(recipient.companyName?.trim()),
    recipient: recipientObj,
    sender: senderObj,
    subtotal: Math.round(subtotalVal * 100) / 100,
    shippingCostCharged: Math.round(shippingVal * 100) / 100,
    total: Math.round(totalVal * 100) / 100,
    currencyCode: 'GBP',
    orderDate: order.createdAt || new Date().toISOString(),
    packages: [
      {
        weightInGrams: options.weightGrams || settings.defaultWeightGrams || 70,
        packageFormatIdentifier: resolvePackageFormat(options.packageType || settings.defaultPackageType),
        contents: Array.isArray(order.items) && order.items.length > 0
          ? order.items.map((it: any) => ({
              name: it.productTitle || it.title || 'Pouch Supply Item',
              SKU: it.sku || undefined,
              quantity: Number(it.quantity) || 1,
              unitValue: Number(it.price) || 0,
              unitWeightInGrams: Number(it.weightGrams) || 100
            }))
          : [
              {
                name: 'Pouch Supply Package',
                quantity: 1,
                unitValue: totalVal,
                unitWeightInGrams: options.weightGrams || settings.defaultWeightGrams || 70
              }
            ]
      }
    ],
    postageDetails: {
      // Sent only when the store has one. Click & Drop accepts an order with no
      // service at all and lets postage be applied in the portal, which is the only
      // way an account with no services on its contract can ship anything: any code
      // it does not hold is rejected outright.
      ...(serviceCode ? { serviceCode } : {}),
      ...(serviceCode && registerCode ? { serviceRegisterCode: registerCode } : {}),
      // Only for services that carry them. The OLP range does not, and the flags
      // fail the whole order rather than being ignored. Royal Mail rejects
      // anything outside Sender/Recipient/Billing for sendNotificationsTo, and it
      // rejects the whole order, not just this field.
      ...(serviceSupportsNotifications(serviceCode)
        ? {
            sendNotificationsTo: recipientObj.emailAddress ? 'Recipient' : 'Sender',
            receiveEmailNotification: Boolean(recipientObj.emailAddress),
            receiveSmsNotification: Boolean(recipientObj.phoneNumber)
          }
        : {})
    },
    // Generating the label is what makes Royal Mail allocate the tracking
    // number -- creating the order alone never does, on any service. Without
    // this the shipment came back with tracking null, the order could not
    // leave Unfulfilled and no dispatch email was ever sent.
    //
    // This BUYS THE POSTAGE, so it happens once, here, on the operator's
    // explicit 'create shipment' action, and never anywhere automatic.
    label: { includeLabelInResponse: true }
  };

  // Any failure here propagates. There is no simulated fallback.
  let result = await postOrder(payload, apiKey, orderId);

  // A service we classified as notification-capable turning out not to be is a
  // recoverable mistake, so strip the flags and post the order again rather than
  // failing a shipment over a duplicate email the store already sends itself.
  if (
    collectFailureMessages(result).some(m => NOTIFICATION_UNAVAILABLE_RE.test(m)) &&
    payload.postageDetails &&
    'receiveEmailNotification' in payload.postageDetails
  ) {
    console.warn(
      `[RoyalMailService] Service ${serviceCode || '(none)'} does not support Click & Drop despatch ` +
        'notifications; retrying without them. The store sends its own dispatch email.'
    );
    delete (payload.postageDetails as any).sendNotificationsTo;
    delete (payload.postageDetails as any).receiveEmailNotification;
    delete (payload.postageDetails as any).receiveSmsNotification;
    result = await postOrder(payload, apiKey, orderId);
  }

  if (result?.failedOrders && result.failedOrders.length > 0) {
    const errMsgs: string[] = [];
    let unknownServiceCode = false;

    result.failedOrders.forEach((f: any) => {
      const errors = Array.isArray(f.errors) ? f.errors : f.errors ? [f.errors] : [];
      errors.forEach((e: any) => {
        // Error 31 is the one operators actually hit: the code is either not a
        // Royal Mail code at all, or not on this account's contract. Saying so
        // beats echoing the raw JSON back into the dashboard.
        if (Number(e?.errorCode) === 31) unknownServiceCode = true;
        errMsgs.push(e?.errorMessage || e?.message || e?.code || JSON.stringify(e));
      });
    });

    let detail = errMsgs.join(' | ') || 'unknown error';
    if (unknownServiceCode) {
      detail +=
        ` — "${serviceCode}" is not a service Royal Mail will accept for this account. ` +
        'The domestic services on this contract are OLP1 (1st Class), OLP1SF ' +
        '(Signed For 1st Class), OLP2 (2nd Class) and OLP2SF (Signed For 2nd ' +
        'Class). Set one of those in Admin > Settings > Royal Mail, or leave the ' +
        'service code blank and apply postage in Click & Drop. If the contract ' +
        'has changed, check business.parcel.royalmail.com/settings/services/ or ' +
        'POST /api/royalmail/test-service-code to have Royal Mail confirm a code ' +
        'directly.';
    }

    throw new Error(`Royal Mail rejected the shipment for order #${orderId}: ${detail}`);
  }

  const createdOrder = result?.createdOrders?.[0];
  if (!createdOrder?.orderIdentifier) {
    throw new Error(
      `Royal Mail did not return a Click & Drop order identifier for #${orderId}. The shipment was not created.`
    );
  }

  const royalMailOrderId = String(createdOrder.orderIdentifier);
  let trackingNumber: string | null =
    createdOrder.trackingNumber || createdOrder.packages?.[0]?.trackingNumber || null;

  // Label generation can fail on its own while the order still succeeds --
  // most often when the Click & Drop account has no postage credit. That
  // leaves an order with no tracking, so the reason is reported rather than
  // being left to look like a missing tracking number.
  const labelErrors: string[] = Array.isArray((createdOrder as any).labelErrors)
    ? (createdOrder as any).labelErrors.map((e: any) => e?.message).filter(Boolean)
    : [];
  if (labelErrors.length > 0) {
    console.error(
      `[RoyalMailService] Royal Mail could not generate the label for #${orderId}: ${labelErrors.join('; ')}`
    );
  }

  // The number is allocated during label generation, which can settle a moment
  // after the create call returns. Re-read the order once.
  if (!trackingNumber) {
    try {
      const detail: any = await getOrderByReference(royalMailOrderId, apiKey);
      trackingNumber = detail?.trackingNumber || detail?.packages?.[0]?.trackingNumber || null;
    } catch (lookupErr: any) {
      console.warn(`[RoyalMailService] Tracking lookup for #${orderId} deferred:`, lookupErr?.message);
    }
  }

  const carrierName = serviceName;
  const labelUrl = `/api/royalmail/label/${encodeURIComponent(royalMailOrderId)}/pdf`;

  // Only claim the parcel is shipped once Royal Mail has issued tracking.
  const nextFulfillment = trackingNumber ? 'Shipped' : 'Unfulfilled';

  const shippedOrder = {
    ...order,
    fulfillmentStatus: nextFulfillment,
    trackingNumber: trackingNumber,
    trackingId: trackingNumber,
    carrier: carrierName,
    data: {
      ...(order.data || {}),
      royalMail: {
        royalMailOrderId,
        trackingNumber,
        serviceCode,
        serviceName,
        carrier: carrierName,
        labelUrl,
        createdAt: new Date().toISOString(),
        shippedAt: trackingNumber ? new Date().toISOString() : null,
        addressValidation: { valid, errors }
      }
    }
  };

  // Persist through saveSingleOrder so the dispatch email and the Klaviyo
  // "shipped" event are emitted by the single order-notification funnel,
  // exactly once, and only on a real Unfulfilled -> Shipped transition.
  let updatedOrder = shippedOrder;
  try {
    const { saveSingleOrder } = await import('../routes/orders');
    updatedOrder = await saveSingleOrder(shippedOrder);
  } catch (saveErr: any) {
    console.error('[RoyalMailService] Order save error, falling back to direct store write:', saveErr?.message);
    try {
      const currentOrders: any[] = (await fetchResource('orders')) || [];
      const idx = currentOrders.findIndex((o: any) => String(o.id) === String(orderId));
      if (idx !== -1) {
        currentOrders[idx] = shippedOrder;
      } else {
        currentOrders.unshift(shippedOrder);
      }
      await saveResource('orders', currentOrders);
    } catch (resourceErr) {
      console.error('[RoyalMailService] StoreResource save error:', resourceErr);
    }
  }

  return {
    success: true,
    trackingNumber,
    royalMailOrderId,
    carrier: carrierName,
    serviceName,
    serviceCode,
    labelUrl,
    requestedServiceCode,
    serviceDowngraded,
    // Exposed as data, not only prose, so the admin UI can tell "the label
    // failed and here is why" apart from "the label has not been made yet".
    // The two need opposite actions: fix the Click & Drop account, versus wait.
    labelErrors,
    message:
      (serviceDowngraded
        ? `Service ${requestedServiceCode} is not on this Click & Drop contract, so ${serviceCode} was used instead — ` +
          `add ${requestedServiceCode} in Click & Drop > Settings > Services if you need it. `
        : '') +
      (trackingNumber
        ? `Royal Mail shipment created. Tracking ${trackingNumber}.`
        : labelErrors.length > 0
          ? `Royal Mail order ${royalMailOrderId} was created on ${serviceName}, but the label could ` +
            `not be generated, so no tracking number was issued: ${labelErrors.join('; ')}. ` +
            `Check the postage balance on the Click & Drop account, then press Sync.`
          : `Royal Mail order ${royalMailOrderId} created on ${serviceName}. ` +
            `No tracking number was issued yet — generate the label in Click & Drop, then press Sync.`),
    order: updatedOrder
  };
}

/**
 * 5. Mark a Click & Drop order as despatched with Royal Mail.
 */
export async function dispatchRoyalMailShipment(orderId: string): Promise<{ success: boolean; message: string; order: any }> {
  const apiKey = await requireApiKey();

  const orders: any[] = (await fetchResource('orders')) || [];
  const order = orders.find((o: any) => String(o.id) === String(orderId));
  if (!order) {
    throw new Error(`Order #${orderId} not found.`);
  }

  const royalMailOrderId = order.data?.royalMail?.royalMailOrderId;
  if (!royalMailOrderId) {
    throw new Error(
      `Order #${orderId} has no Royal Mail Click & Drop shipment. Create the shipment before marking it despatched.`
    );
  }

  await markRoyalMailOrderDispatched(Number(royalMailOrderId) || String(royalMailOrderId), apiKey);

  // Pull the tracking number now that the order is manifested.
  let trackingNumber = order.trackingNumber || order.trackingId || null;
  try {
    const detail: any = await getOrderByReference(String(royalMailOrderId), apiKey);
    trackingNumber = detail?.trackingNumber || detail?.packages?.[0]?.trackingNumber || trackingNumber;
  } catch (_e) {}

  const { saveSingleOrder } = await import('../routes/orders');
  const updatedOrder = await saveSingleOrder({
    ...order,
    fulfillmentStatus: 'Shipped',
    trackingNumber,
    trackingId: trackingNumber,
    data: {
      ...(order.data || {}),
      royalMail: {
        ...(order.data?.royalMail || {}),
        trackingNumber,
        status: 'despatched',
        shippedAt: new Date().toISOString()
      }
    }
  });

  return {
    success: true,
    message: `Order #${orderId} marked as despatched with Royal Mail.`,
    order: updatedOrder
  };
}

/**
 * 6. Retrieve the official Royal Mail postage label PDF for a store order.
 */
export async function getRoyalMailLabelForOrder(
  orderId: string,
  options: { includeReturnsLabel?: boolean; includeCN?: boolean } = {}
): Promise<{ pdf: ArrayBuffer; royalMailOrderId: string }> {
  const apiKey = await requireApiKey();

  const orders: any[] = (await fetchResource('orders')) || [];
  const order = orders.find((o: any) => String(o.id) === String(orderId));
  if (!order) {
    throw new Error(`Order #${orderId} not found.`);
  }

  const royalMailOrderId = order.data?.royalMail?.royalMailOrderId;
  if (!royalMailOrderId) {
    throw new Error(
      `Order #${orderId} has no Royal Mail shipment yet. Create the Click & Drop shipment first, then print the label.`
    );
  }

  const pdf = await getRoyalMailLabel(
    Number(royalMailOrderId) || String(royalMailOrderId),
    options,
    apiKey
  );

  return { pdf, royalMailOrderId: String(royalMailOrderId) };
}

// 7. Cancel Shipment
export async function cancelRoyalMailShipment(orderId: string, royalMailOrderId?: string): Promise<{ success: boolean; message: string }> {
  const apiKey = await requireApiKey();

  const orders: any[] = (await fetchResource('orders')) || [];
  const order = orders.find((o: any) => String(o.id) === String(orderId));
  const ref = royalMailOrderId || order?.data?.royalMail?.royalMailOrderId;

  if (!ref) {
    throw new Error(`Order #${orderId} has no Royal Mail shipment to cancel.`);
  }

  // Propagates on failure: the local record must not say "cancelled" while the
  // shipment is still live in Click & Drop and about to be collected.
  await cancelRoyalMailOrder(String(ref), apiKey);

  if (order) {
    const { saveSingleOrder } = await import('../routes/orders');
    await saveSingleOrder({
      ...order,
      fulfillmentStatus: 'Unfulfilled',
      trackingNumber: null,
      trackingId: null,
      carrier: null,
      data: {
        ...(order.data || {}),
        royalMail: {
          ...(order.data?.royalMail || {}),
          status: 'Cancelled',
          trackingNumber: null,
          cancelledAt: new Date().toISOString()
        }
      }
    });
  }

  return { success: true, message: 'Shipment cancelled in Royal Mail Click & Drop.' };
}

export interface TrackingResult {
  trackingNumber: string | null;
  orderId?: string;
  royalMailOrderId?: string;
  status: string;
  statusDescription: string;
  carrier: string;
  estimatedDelivery: string;
  recipientLocation?: string;
  officialTrackingUrl: string | null;
  isLive: boolean;
  history: Array<{ timestamp: string; location: string; status: string; description: string }>;
}

/**
 * 8. Live tracking lookup against Click & Drop.
 *
 * Reports only what Royal Mail actually says. The previous implementation
 * synthesised a full delivery timeline ("processed through NDC hub",
 * "Delivered & Signed") from the local order status alone, which showed
 * customers scan events that never happened.
 */
export async function getRoyalMailTracking(trackingNumberOrQuery: string): Promise<TrackingResult> {
  const query = (trackingNumberOrQuery || '').trim();
  const apiKey = await requireApiKey();

  // Find the matching store order so we can resolve the Click & Drop identifier.
  let matchedOrder: any = null;
  try {
    const orders: any[] = (await fetchResource('orders')) || [];
    matchedOrder = orders.find((o: any) =>
      String(o.trackingNumber || '').toUpperCase() === query.toUpperCase() ||
      String(o.trackingId || '').toUpperCase() === query.toUpperCase() ||
      String(o.id || '').toUpperCase() === query.toUpperCase() ||
      String(o.data?.royalMail?.trackingNumber || '').toUpperCase() === query.toUpperCase() ||
      String(o.data?.royalMail?.royalMailOrderId || '').toUpperCase() === query.toUpperCase()
    );
  } catch (_e) {}

  const royalMailOrderId = matchedOrder?.data?.royalMail?.royalMailOrderId;
  const lookupRef = royalMailOrderId || (matchedOrder?.id ? String(matchedOrder.id) : query);

  let cdOrder: any = null;
  try {
    cdOrder = await getOrderByReference(String(lookupRef), apiKey);
  } catch (err: any) {
    if (err instanceof RoyalMailError && err.status === 404) {
      throw new Error(
        `Royal Mail has no record of "${query}". Confirm the shipment was created in Click & Drop.`
      );
    }
    throw err;
  }

  const trackingNumber =
    cdOrder?.trackingNumber ||
    cdOrder?.packages?.[0]?.trackingNumber ||
    matchedOrder?.trackingNumber ||
    null;

  // Click & Drop carries no status field on an order — the timestamps ARE the
  // status, which is why `readClickAndDropState` exists. Deriving the headline
  // from `status`/`orderStatus` therefore fell to the 'Awaiting Despatch'
  // default on EVERY order forever, including despatched ones, so this card
  // contradicted the despatch event listed in its own history directly below.
  // The same timestamps now drive both.
  const state = readClickAndDropState(cdOrder);

  // Kept as an override in case Click & Drop ever does return a status: a real
  // one is better than anything inferred, and delivery/cancellation cannot be
  // derived from despatch timestamps at all.
  const rawStatus = String(cdOrder?.status || cdOrder?.orderStatus || '').trim();
  const statusLower = rawStatus.toLowerCase();

  let displayStatus: string;
  let statusDescription: string;
  let estimatedDelivery: string;

  if (statusLower.includes('deliver')) {
    displayStatus = 'Delivered';
    statusDescription = 'Royal Mail has recorded this item as delivered.';
    estimatedDelivery = 'Delivered';
  } else if (statusLower.includes('cancel')) {
    displayStatus = 'Cancelled';
    statusDescription = 'This Click & Drop order has been cancelled.';
    estimatedDelivery = 'Cancelled';
  } else if (state.despatchedOn) {
    // Handed to Royal Mail. Click & Drop tracks despatch, not the network, so
    // this is the furthest it can ever attest to — "In Transit" would be
    // claiming a movement scan we have no source for.
    displayStatus = 'Dispatched';
    statusDescription = 'Item has been despatched to Royal Mail.';
    // Click & Drop supplies no delivery estimate, and inventing one under a
    // heading that reads "Estimated arrival" would be a promise we cannot keep.
    estimatedDelivery = 'See Royal Mail tracking';
  } else if (state.labelGenerated) {
    displayStatus = 'Awaiting Despatch';
    statusDescription =
      'Postage label generated. Royal Mail has not yet confirmed the parcel was handed over.';
    estimatedDelivery = 'Awaiting despatch';
  } else {
    displayStatus = rawStatus || 'Awaiting Despatch';
    statusDescription = 'Royal Mail has the order. No scan events have been recorded yet.';
    estimatedDelivery = 'Awaiting despatch';
  }

  // Only real, dated events from Click & Drop — no synthesised scan history.
  const history: TrackingResult['history'] = [];
  const pushEvent = (iso: any, status: string, description: string) => {
    if (!iso) return;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return;
    history.push({
      timestamp: `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      location: 'Royal Mail Click & Drop',
      status,
      description
    });
  };

  pushEvent(cdOrder?.shippedOn, 'Despatched', 'Item despatched to Royal Mail.');
  pushEvent(cdOrder?.manifestedOn, 'Manifested', 'Order manifested with Royal Mail.');
  pushEvent(cdOrder?.printedOn, 'Label Printed', 'Postage label generated.');
  pushEvent(cdOrder?.createdOn, 'Order Created', 'Shipment registered in Click & Drop.');

  const rawAddr = matchedOrder?.data?.address || matchedOrder?.destination || '';
  const destinationStr = rawAddr && typeof rawAddr === 'object'
    ? [rawAddr.city, rawAddr.postcode].filter(Boolean).join(', ')
    : String(rawAddr || '');

  return {
    trackingNumber,
    orderId: matchedOrder?.id,
    royalMailOrderId: royalMailOrderId ? String(royalMailOrderId) : undefined,
    status: displayStatus,
    statusDescription,
    carrier: matchedOrder?.carrier || 'Royal Mail',
    estimatedDelivery,
    recipientLocation: destinationStr || undefined,
    officialTrackingUrl: trackingNumber
      ? `https://www.royalmail.com/track-your-item#/tracking-details/${encodeURIComponent(trackingNumber)}`
      : null,
    isLive: true,
    history
  };
}

/**
 * 9. Sync live status for an order from Royal Mail Click & Drop.
 */
/** What Click & Drop reports about one order's label and tracking. */
export interface ClickAndDropState {
  trackingNumber: string | null;
  /** When the postage label was generated. Null until it has been. */
  printedOn: string | null;
  /**
   * When Royal Mail confirms the parcel actually left — set once the order is
   * despatched or manifested in Click & Drop. This, and only this, is what lets
   * a sync mark an order Shipped. It is NOT implied by a printed label: a label
   * is routinely generated well before the parcel is handed over.
   */
  despatchedOn: string | null;
  labelGenerated: boolean;
  /** 'awaiting_label' | 'generated' | 'despatched' */
  labelStatus: string;
}

/**
 * Reads the label and tracking state out of a Click & Drop order.
 *
 * Click & Drop returns no status field — an order carries `printedOn` and
 * `trackingNumber` only once its postage label has been generated, and that is
 * the moment the tracking number comes into existence. So the presence of those
 * timestamps IS the status, and reading them is the only way to know whether a
 * label exists without asking an operator.
 *
 * `despatchedOn` appears separately and later, when the order is despatched or
 * manifested. An account that never manifests through Click & Drop will never
 * see it, in which case tracking numbers still sync but no order is ever
 * auto-advanced to Shipped — which is the safe direction to fail in.
 */
export function readClickAndDropState(cdOrder: any): ClickAndDropState {
  const trackingNumber =
    cdOrder?.trackingNumber || cdOrder?.packages?.[0]?.trackingNumber || null;

  const printedOn = cdOrder?.printedOn || null;
  // Click & Drop reports despatch as `shippedOn`; `manifestedOn` only appears on
  // accounts that manifest, which many never do. `despatchedOn` is not a field it
  // returns at all — reading only that left every order on a non-manifesting
  // account permanently short of the despatch confirmation below.
  const despatchedOn = cdOrder?.shippedOn || cdOrder?.despatchedOn || cdOrder?.manifestedOn || null;
  const labelGenerated = Boolean(printedOn || trackingNumber);

  return {
    trackingNumber: trackingNumber ? String(trackingNumber) : null,
    printedOn,
    despatchedOn,
    labelGenerated,
    labelStatus: despatchedOn ? 'despatched' : labelGenerated ? 'generated' : 'awaiting_label'
  };
}

export async function syncRoyalMailOrderStatus(orderId: string): Promise<{
  success: boolean;
  order: any;
  message: string;
  clickAndDropStatus?: string;
}> {
  const apiKey = await requireApiKey();

  const orders: any[] = (await fetchResource('orders')) || [];
  const order = orders.find((o: any) => String(o.id) === String(orderId));

  if (!order) {
    throw new Error(`Order #${orderId} not found.`);
  }

  const royalMailOrderId = order.data?.royalMail?.royalMailOrderId;
  if (!royalMailOrderId) {
    throw new Error(`Order #${orderId} has no Royal Mail shipment to sync.`);
  }

  const cdOrder: any = await getOrderByReference(String(royalMailOrderId), apiKey);
  if (!cdOrder) {
    throw new Error(`Royal Mail returned no record for Click & Drop order ${royalMailOrderId}.`);
  }

  const state = readClickAndDropState(cdOrder);

  const newTrackingNumber =
    state.trackingNumber ||
    order.trackingNumber ||
    order.trackingId ||
    null;

  // --------------------------------------------------------------------------
  // Fulfilment status. Deliberately the most conservative rule in this file.
  //
  // A sync may ONLY ever take an order from Unfulfilled to Shipped. It is not
  // allowed to change any other status, in either direction. Fulfilled,
  // Delivered, Shipped, Cancelled and Exchanged are all at or past dispatch and
  // are set by people, by the warehouse and by delivery events that Click & Drop
  // knows nothing about — so a sync writing 'Shipped' over any of them would be
  // walking the order backwards and undoing someone's work.
  //
  // Advancing additionally requires BOTH:
  //   - a real tracking number, because the dispatch email quotes it, and
  //   - `despatchedOn` from Royal Mail: an explicit confirmation that the parcel
  //     has actually left. A generated label is NOT enough — a label can be
  //     printed days before the parcel is handed over, and telling a customer
  //     their order has shipped when it is still on the packing bench is worse
  //     than telling them nothing.
  //
  // Everything below this line still records the tracking number and label state
  // regardless of status, so a Fulfilled order gains its Royal Mail details
  // without its status being touched.
  const canAdvanceFromCurrentStatus = order.fulfillmentStatus === 'Unfulfilled';
  const despatchConfirmedByRoyalMail = Boolean(state.despatchedOn);

  const updatedFulfillment =
    canAdvanceFromCurrentStatus && Boolean(newTrackingNumber) && despatchConfirmedByRoyalMail
      ? 'Shipped'
      : order.fulfillmentStatus;

  const syncedOrder = {
    ...order,
    fulfillmentStatus: updatedFulfillment,
    trackingNumber: newTrackingNumber,
    trackingId: newTrackingNumber,
    data: {
      ...(order.data || {}),
      royalMail: {
        ...(order.data?.royalMail || {}),
        trackingNumber: newTrackingNumber,
        // The real label state as Royal Mail reports it, so the dashboard shows
        // what Click & Drop actually holds instead of an admin's guess.
        labelStatus: state.labelStatus,
        labelGenerated: state.labelGenerated,
        printedOn: state.printedOn,
        despatchedOn: state.despatchedOn,
        shippedAt:
          order.data?.royalMail?.shippedAt ||
          (updatedFulfillment === 'Shipped' ? new Date().toISOString() : null),
        syncedAt: new Date().toISOString()
      }
    }
  };

  // Route through saveSingleOrder so a status change that moves the order to
  // Shipped or Delivered notifies the customer through the same funnel as every
  // other status change — once, and only on a real change.
  const { saveSingleOrder } = await import('../routes/orders');
  const updatedOrder = await saveSingleOrder(syncedOrder);

  const statusChanged = updatedFulfillment !== order.fulfillmentStatus;

  const message = newTrackingNumber
    ? `Synced with Royal Mail. Tracking ${newTrackingNumber}.` +
      (statusChanged
        ? ' Royal Mail confirmed despatch, so the order is now marked Shipped.'
        : despatchConfirmedByRoyalMail
          ? ''
          : ' Royal Mail has not confirmed despatch yet, so the fulfilment status is unchanged.')
    : `Synced with Royal Mail. Click & Drop order ${royalMailOrderId} exists but its label has not been ` +
      `generated yet, so no tracking number has been allocated.`;

  return {
    success: true,
    order: updatedOrder,
    message,
    clickAndDropStatus: state.labelStatus
  };
}

/**
 * Pulls tracking numbers for every shipment still waiting on one.
 *
 * Royal Mail allocates a tracking number when the postage label is generated,
 * which is usually after the shipment is created here — often days after, when
 * the labels for a batch are actually printed. `createRoyalMailShipment` re-reads
 * the order once and then gives up, so before this existed an order whose label
 * was printed later kept `trackingNumber: null` forever and no dispatch email was
 * ever sent. This is what the cron calls.
 *
 * Only orders that already hold a Click & Drop identifier are touched, and each
 * goes through `syncRoyalMailOrderStatus`, so persistence and the dispatch
 * notification stay on the one funnel. One order's failure does not stop the rest.
 */
export async function syncPendingRoyalMailTracking(options: { limit?: number } = {}): Promise<{
  success: boolean;
  checked: number;
  updated: number;
  results: Array<{ orderId: string; status: string; trackingNumber?: string | null; reason?: string }>;
}> {
  const limit = options.limit ?? 40;
  const orders: any[] = (await fetchResource('orders')) || [];

  // A shipment exists but Royal Mail has not given us a tracking number for it.
  //
  // "Has one already" is judged ONLY on data.royalMail.trackingNumber — the field
  // written from a Royal Mail response — and deliberately not on the order's
  // trackingNumber/trackingId, which an operator can type into. Those carry
  // manual entries and, in practice, typos (one live order holds "hghjh"), and
  // treating those as done would permanently block the real number from ever
  // arriving for exactly the orders someone had to work around.
  //
  // Cancelled orders are skipped.
  //
  // An order stays in the sweep until BOTH facts have arrived: its tracking
  // number and its despatch confirmation. Tracking appears when the label is
  // printed; despatch lands later, when the parcel is actually handed over.
  // Dropping an order as soon as it had tracking therefore retired it during the
  // gap and before the despatch it was waiting for could ever be observed, so
  // nothing was ever auto-advanced to Shipped. Royal Mail never reissues a
  // tracking number, so re-reading a despatched order buys nothing.
  const pending = orders
    .filter((o: any) => {
      const rm = o?.data?.royalMail;
      if (!rm?.royalMailOrderId) return false;
      if (o.fulfillmentStatus === 'Cancelled') return false;
      if (!rm.trackingNumber) return true;
      // Still chasing the despatch confirmation — but only while the order is
      // one a sync could actually advance. `syncRoyalMailOrderStatus` moves only
      // Unfulfilled orders, so re-reading anything a human has already moved on
      // refreshes metadata nobody acts on, and would keep every such order in
      // the sweep forever, crowding freshly-labelled ones out of the limit.
      return !rm.despatchedOn && o.fulfillmentStatus === 'Unfulfilled';
    })
    .slice(0, limit);

  const results: Array<{ orderId: string; status: string; trackingNumber?: string | null; reason?: string }> = [];
  let updated = 0;

  for (const order of pending) {
    const orderId = String(order.id);
    try {
      const hadTracking = Boolean(order?.data?.royalMail?.trackingNumber);
      const res = await syncRoyalMailOrderStatus(orderId);
      const tracking = res.order?.trackingNumber || res.order?.data?.royalMail?.trackingNumber || null;
      const despatched = Boolean(res.order?.data?.royalMail?.despatchedOn);

      // Counted and logged on the transition only. An order kept in the sweep
      // waiting for its despatch confirmation still reports its tracking number
      // every pass, and treating that as news would log the same line every
      // thirty minutes and overstate `updated` for work that did not happen.
      if (tracking && !hadTracking) {
        updated++;
        console.log(`[RoyalMail Sync] Order ${orderId}: tracking ${tracking} collected from Click & Drop.`);
        results.push({ orderId, status: 'tracking_found', trackingNumber: tracking });
      } else if (despatched) {
        if (!hadTracking) updated++;
        console.log(`[RoyalMail Sync] Order ${orderId}: despatch confirmed by Royal Mail.`);
        results.push({ orderId, status: 'despatch_confirmed', trackingNumber: tracking });
      } else if (tracking) {
        results.push({ orderId, status: 'awaiting_despatch', trackingNumber: tracking });
      } else {
        results.push({ orderId, status: 'awaiting_label' });
      }
    } catch (err: any) {
      // A single unreadable order must not stop the sweep — the next one may be
      // the one whose label has just been printed.
      console.warn(`[RoyalMail Sync] Order ${orderId} could not be synced:`, err?.message);
      results.push({ orderId, status: 'error', reason: err?.message || 'Sync failed' });
    }
  }

  return { success: true, checked: pending.length, updated, results };
}

/**
 * 10. Official Royal Mail pre-paid returns label PDF.
 *
 * Requested from Royal Mail with `includeReturnsLabel`, so it carries a real
 * returns barcode. There is no locally generated substitute — a hand-drawn
 * label cannot be scanned and the parcel would be refused.
 */
export async function createRoyalMailReturnLabel(orderId: string): Promise<{
  success: boolean;
  pdf: ArrayBuffer;
  royalMailOrderId: string;
  message: string;
}> {
  const { pdf, royalMailOrderId } = await getRoyalMailLabelForOrder(orderId, {
    includeReturnsLabel: true
  });

  return {
    success: true,
    pdf,
    royalMailOrderId,
    message: `Royal Mail pre-paid returns label retrieved for order #${orderId}.`
  };
}

export { createRoyalMailReturnLabel as createReturnLabel };
