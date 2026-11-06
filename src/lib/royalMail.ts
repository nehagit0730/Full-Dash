function getRoyalMailApiUrl(): string {
  let base =
    process.env.ROYAL_MAIL_API_URL ||
    process.env.RM_API_BASE_URL ||
    process.env.ROYAL_MAIL_BASE_URL ||
    "https://api.parcel.royalmail.com/api/v1";

  base = base.trim().replace(/\/+$/, "");
  if (!base.includes("/api/v1") && !base.includes("/v1")) {
    base = `${base}/api/v1`;
  }
  return base;
}

export class RoyalMailError extends Error {
  status: number;
  details: unknown;

  constructor(
    message: string,
    status: number,
    details?: unknown
  ) {
    super(message);
    this.name = "RoyalMailError";
    this.status = status;
    this.details = details;
  }
}

function getAuthHeader(apiKey?: string): string {
  const key = apiKey || process.env.ROYAL_MAIL_API_KEY || process.env.RM_API_KEY || "";
  if (!key) return "";
  return key.startsWith("Bearer ") ? key : `Bearer ${key}`;
}

async function royalMailRequest<T>(
  path: string,
  options: RequestInit = {},
  apiKey?: string
): Promise<T> {
  const key = apiKey || process.env.ROYAL_MAIL_API_KEY || process.env.RM_API_KEY;

  if (!key) {
    throw new RoyalMailError("ROYAL_MAIL_API_KEY is not configured", 500);
  }

  const authHeader = getAuthHeader(key);

  const baseUrl = getRoyalMailApiUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const fullUrl = `${baseUrl}${normalizedPath}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";

  let data: unknown;

  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    let errMsg = `Royal Mail API error (${response.status})`;
    if (Array.isArray(data) && data.length > 0) {
      // Click & Drop returns a bare array of error objects on some endpoints.
      errMsg = data
        .map((e: any) => e?.message || e?.code || JSON.stringify(e))
        .join(" | ");
    } else if (typeof data === "object" && data !== null) {
      const obj = data as any;
      if (Array.isArray(obj.errors) && obj.errors.length > 0) {
        errMsg = obj.errors.map((e: any) => e.message || e.code || JSON.stringify(e)).join(' | ');
      } else if (Array.isArray(obj.failedOrders) && obj.failedOrders.length > 0) {
        const failedErrs: string[] = [];
        obj.failedOrders.forEach((f: any) => {
          if (Array.isArray(f.errors)) {
            f.errors.forEach((e: any) => failedErrs.push(e.message || e.code || JSON.stringify(e)));
          } else if (f.errors) {
            failedErrs.push(JSON.stringify(f.errors));
          }
        });
        if (failedErrs.length > 0) errMsg = failedErrs.join(' | ');
      } else if (obj.message) {
        errMsg = obj.message;
      } else {
        errMsg = JSON.stringify(obj);
      }
    } else if (typeof data === "string" && data.length > 0) {
      errMsg = data;
    }
    throw new RoyalMailError(errMsg, response.status, data);
  }

  return data as T;
}

/**
 * Check that the live Click & Drop API credentials work.
 * This does NOT create a shipment.
 */
export async function checkRoyalMailConnection(apiKey?: string) {
  // Check authorization against Click & Drop /orders endpoint
  return royalMailRequest<unknown>(
    "/orders",
    {
      method: "GET",
    },
    apiKey
  );
}

export interface RoyalMailAddress {
  fullName: string;
  companyName?: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  city: string;
  county?: string;
  postcode: string;
  countryCode: string;
}

export interface RoyalMailRecipient {
  address: RoyalMailAddress;
  phoneNumber?: string;
  emailAddress?: string;
  addressBookReference?: string;
}

export interface RoyalMailSender {
  tradingName: string;
  phoneNumber?: string;
  emailAddress?: string;
}

export interface RoyalMailPackageContent {
  name: string;
  SKU?: string;
  ReferenceId?: string;
  ContentsPieceURL?: string;
  quantity: number;
  unitValue: number;
  unitWeightInGrams: number;
  customsDescription?: string;
  extendedCustomsDescription?: string;
  customsCode?: string;
  originCountryCode?: string;
  customsDeclarationCategory?: string;
  requiresExportLicence?: boolean;
  stockLocation?: string;
  useOriginPreference?: boolean;
  supplementaryUnits?: string;
  licenseNumber?: string;
  certificateNumber?: string;
}

export interface RoyalMailPackage {
  weightInGrams: number;
  packageFormatIdentifier: string;

  customPackageFormatIdentifier?: string;

  dimensions?: {
    heightInMms: number;
    widthInMms: number;
    depthInMms: number;
  };

  contents?: RoyalMailPackageContent[];
}

export interface RoyalMailPostageDetails {
  sendNotificationsTo?: "Sender" | "Recipient" | "Billing";

  // Optional. Click & Drop accepts an order with no service, leaving postage to
  // be applied in the portal — the only route for an account whose contract holds
  // none of the codes it would otherwise need.
  serviceCode?: string;
  serviceRegisterCode?: string;

  consequentialLoss?: number;

  receiveEmailNotification?: boolean;
  receiveSmsNotification?: boolean;

  guaranteedSaturdayDelivery?: boolean;
  requestSignatureUponDelivery?: boolean;

  isLocalCollect?: boolean;

  safePlace?: string;

  department?: string;

  AIRNumber?: string;

  IOSSNumber?: string;

  requiresExportLicense?: boolean;

  commercialInvoiceNumber?: string;

  commercialInvoiceDate?: string;

  recipientEoriNumber?: string;
}

export interface CreateRoyalMailOrderRequest {
  orderReference: string;

  isRecipientABusiness?: boolean;

  recipient: RoyalMailRecipient;

  sender: RoyalMailSender;

  billing?: {
    address: RoyalMailAddress;
    phoneNumber?: string;
    emailAddress?: string;
  };

  packages: RoyalMailPackage[];

  orderDate?: string;

  plannedDespatchDate?: string;

  specialInstructions?: string;

  subtotal?: number;

  shippingCostCharged?: number;

  otherCosts?: number;

  customsDutyCosts?: number;

  total?: number;

  currencyCode?: string;

  deliveryTerm?: string;

  postageDetails: RoyalMailPostageDetails;

  tags?: {
    key: string;
    value: string;
  }[];

  label?: {
    includeLabelInResponse?: boolean;
    includeCN?: boolean;
    includeReturnsLabel?: boolean;
  };

  orderTax?: number;

  containsDangerousGoods?: boolean;

  dangerousGoodsUnCode?: string;

  dangerousGoodsDescription?: number;

  dangerousGoodsQuantity?: number;

  importer?: Record<string, unknown>;
}

export interface CreateRoyalMailResponse {
  successCount: number;
  errorsCount: number;

  createdOrders: Array<{
    orderIdentifier: number;
    orderReference: string;
    createdOn: string;
    printedOn?: string;
    manifestedOn?: string;
    shippedOn?: string;
    trackingNumber?: string;

    packages?: Array<{
      packageNumber: number;
      trackingNumber?: string;
    }>;

    label?: string;

    labelErrors?: Array<{
      message: string;
      code: string;
    }>;

    generatedDocuments?: string[];
  }>;

  failedOrders?: Array<{
    order: unknown;
    errors?: Array<{
      code: string;
      message: string;
    }>;
  }>;
}

/**
 * Create one or more Click & Drop orders.
 */
export async function createRoyalMailOrders(
  orders: CreateRoyalMailOrderRequest[],
  apiKey?: string
) {
  return royalMailRequest<CreateRoyalMailResponse>(
    "/orders",
    {
      method: "POST",
      body: JSON.stringify({
        items: orders,
      }),
    },
    apiKey
  );
}

/**
 * Retrieve one order.
 */
/**
 * Click & Drop tells order identifiers and order references apart by quoting:
 * a numeric identifier goes through bare, a reference must be wrapped in
 * double quotes. Quoting a number makes Click & Drop hunt for a REFERENCE of
 * that name and answer "order does not exist".
 *
 * The old check keyed off the JavaScript type rather than the value, so an
 * identifier that had been through String() — which is exactly what the
 * shipment and sync paths pass — was quoted and always rejected. The tracking
 * number is read back through here, so it could never be found and every
 * order stayed Unfulfilled with tracking null. cancelOrder already tested the
 * value; this now matches it.
 */
export async function getRoyalMailOrder(
  identifier: string | number,
  apiKey?: string
) {
  const raw = String(identifier).trim();
  const encoded = /^[0-9]+$/.test(raw) ? raw : `"${encodeURIComponent(raw)}"`;

  return royalMailRequest(
    `/orders/${encoded}`,
    {
      method: "GET",
    },
    apiKey
  );
}

/**
 * Retrieve a label PDF.
 */
export async function getRoyalMailLabel(
  identifier: string | number,
  options?: {
    includeReturnsLabel?: boolean;
    includeCN?: boolean;
  },
  apiKey?: string
) {
  const key = apiKey || process.env.ROYAL_MAIL_API_KEY || process.env.RM_API_KEY;

  if (!key) {
    throw new RoyalMailError("ROYAL_MAIL_API_KEY is not configured", 500);
  }

  const encoded =
    typeof identifier === "number"
      ? String(identifier)
      : `"${encodeURIComponent(identifier)}"`;

  const params = new URLSearchParams();

  params.set("documentType", "postageLabel");

  params.set(
    "includeReturnsLabel",
    String(options?.includeReturnsLabel ?? false)
  );

  if (options?.includeCN !== undefined) {
    params.set("includeCN", String(options.includeCN));
  }

  const authHeader = getAuthHeader(key);
  const baseUrl = getRoyalMailApiUrl();

  const response = await fetch(
    `${baseUrl}/orders/${encoded}/label?${params}`,
    {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/pdf",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const text = await response.text();

    throw new RoyalMailError(
      `Unable to retrieve Royal Mail label: ${response.status}`,
      response.status,
      text
    );
  }

  return response.arrayBuffer();
}

/**
 * Mark an order as dispatched.
 */
export async function markRoyalMailOrderDispatched(
  identifier: string | number,
  apiKey?: string
) {
  const item =
    typeof identifier === "number"
      ? {
          orderIdentifier: identifier,
          status: "despatched",
        }
      : {
          orderReference: identifier,
          status: "despatched",
        };

  return royalMailRequest(
    "/orders/status",
    {
      method: "PUT",
      body: JSON.stringify({
        items: [item],
      }),
    },
    apiKey
  );
}

// Backward compatibility exports
export type RoyalMailOrderPayload = CreateRoyalMailOrderRequest;
export type RoyalMailCreateResponse = CreateRoyalMailResponse;

export async function createOrder(payload: any, apiKey: string) {
  const item = Array.isArray(payload) ? payload : [payload];
  return createRoyalMailOrders(item, apiKey);
}

export async function getOrders(apiKey: string, params: Record<string, string | number> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => query.append(k, String(v)));
  const url = `/orders${query.toString() ? `?${query.toString()}` : ''}`;
  return royalMailRequest(url, { method: "GET" }, apiKey);
}

/**
 * One Click & Drop order, or null.
 *
 * The endpoint always answers with an ARRAY, even for a single identifier.
 * Every caller read `.trackingNumber` straight off the result, which on an
 * array is undefined -- so the tracking number was never found even once the
 * lookup itself started working. Unwrapping here fixes all of them at once.
 *
 * A reference can legitimately match several orders (creating a shipment twice
 * for one order leaves two). Prefer one that actually carries a tracking
 * number, then the newest, so a duplicate cannot mask a real result.
 */
export async function getOrderByReference(reference: string, apiKey: string) {
  const result: any = await getRoyalMailOrder(reference, apiKey);
  if (!Array.isArray(result)) return result;
  if (result.length === 0) return null;

  const tracked = result.find(
    (o: any) => o?.trackingNumber || o?.packages?.[0]?.trackingNumber
  );
  if (tracked) return tracked;

  return result
    .slice()
    .sort((a: any, b: any) => Number(b?.orderIdentifier || 0) - Number(a?.orderIdentifier || 0))[0];
}

/**
 * Deletes one or more Click & Drop orders.
 *
 * The endpoint distinguishes numeric order identifiers from order references:
 * identifiers go through bare, references must be wrapped in double quotes.
 * Multiple values are separated by a SEMICOLON — a comma is rejected. Quoting a
 * numeric identifier makes Click & Drop look for a reference of that name and
 * report the order as non-existent.
 */
export async function cancelOrder(reference: string | string[], apiKey: string) {
  const values = (Array.isArray(reference) ? reference : [reference])
    .map(v => String(v).trim())
    .filter(Boolean)
    .map(v => (/^\d+$/.test(v) ? v : `"${encodeURIComponent(v)}"`));

  return royalMailRequest(`/orders/${values.join(";")}`, { method: "DELETE" }, apiKey);
}

export async function getApiVersion(apiKey: string) {
  return royalMailRequest("/version", { method: "GET" }, apiKey);
}
