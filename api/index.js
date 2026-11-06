var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/lib/prisma.ts
var prisma_exports = {};
__export(prisma_exports, {
  default: () => prisma_default,
  prisma: () => prisma
});
import { PrismaClient } from "@prisma/client";
var prisma, prisma_default;
var init_prisma = __esm({
  "src/lib/prisma.ts"() {
    prisma = globalThis.prismaGlobal ?? new PrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalThis.prismaGlobal = prisma;
    }
    prisma_default = prisma;
  }
});

// src/initialData.ts
var INITIAL_PRODUCTS, INITIAL_COLLECTIONS, INITIAL_ORDERS, INITIAL_FILES, INITIAL_CUSTOMERS, INITIAL_DISCOUNTS, INITIAL_BLOGS, DEFAULT_PAGES;
var init_initialData = __esm({
  "src/initialData.ts"() {
    INITIAL_PRODUCTS = [];
    INITIAL_COLLECTIONS = [];
    INITIAL_ORDERS = [];
    INITIAL_FILES = [];
    INITIAL_CUSTOMERS = [];
    INITIAL_DISCOUNTS = [];
    INITIAL_BLOGS = [];
    DEFAULT_PAGES = [
      {
        id: "homepage",
        title: "Home Page",
        slug: "",
        visibility: "Visible",
        updatedAt: "Jun 23, 2026",
        isHomepage: true,
        sections: [
          {
            id: "h-s1",
            type: "Image banner",
            settings: {
              fullWidth: true,
              backgroundColor: "#111827",
              headingColor: "#FFFFFF",
              textColor: "#E5E7EB",
              title: "Pouch Supply Storefront",
              description: "Start managing your products, collections, and page sections inside the Admin Dashboard.",
              buttonText: "View Store Catalog",
              buttonLink: "frontend-shop",
              imageUrl: ""
            }
          }
        ]
      },
      {
        id: "brands",
        title: "Brands Directory",
        slug: "brands",
        visibility: "Visible",
        updatedAt: "Jun 23, 2026",
        sections: [
          {
            id: "s2",
            type: "Rich text",
            settings: {
              fullWidth: false,
              backgroundColor: "#FFFFFF",
              headingColor: "#1E293B",
              textColor: "#64748B",
              title: "Official Brands Matrix",
              description: "Explore our catalog of certified compounding premium brands retrieved directly from our synchronized database."
            }
          },
          {
            id: "s3",
            type: "Brand list",
            settings: {
              fullWidth: false,
              backgroundColor: "#FFFFFF",
              headingColor: "#0C1017",
              textColor: "#64748B",
              title: "Official Brands Directory",
              description: "Explore our catalog of certified compounding premium brands.",
              brandItems: [
                { title: "77", linkUrl: "/collections/77", imageUrl: "" },
                { title: "Cuba", linkUrl: "/collections/cuba", imageUrl: "" },
                { title: "Killa", linkUrl: "/collections/killa", imageUrl: "" },
                { title: "Pablo", linkUrl: "/collections/pablo", imageUrl: "" },
                { title: "Velo", linkUrl: "/collections/velo", imageUrl: "" },
                { title: "White Fox", linkUrl: "/collections/white-fox", imageUrl: "" },
                { title: "Zyn", linkUrl: "/collections/zyn", imageUrl: "" },
                { title: "XQS", linkUrl: "/collections/xqs", imageUrl: "" },
                { title: "Nordic Spirit", linkUrl: "/collections/nordic-spirit", imageUrl: "" },
                { title: "Clew", linkUrl: "/collections/clew", imageUrl: "" },
                { title: "Fumi", linkUrl: "/collections/fumi", imageUrl: "" },
                { title: "Snu", linkUrl: "/collections/snu", imageUrl: "" }
              ]
            }
          }
        ]
      },
      {
        id: "subscribe",
        title: "Subscribe Plans",
        slug: "subscribe",
        visibility: "Visible",
        updatedAt: "Jul 10, 2026",
        sections: [
          {
            id: "subs-sec-1",
            type: "Plans",
            settings: {
              fullWidth: false,
              backgroundColor: "#061229",
              headingColor: "#FFFFFF",
              textColor: "#E2E8F0",
              title: "CHOOSE YOUR PLAN",
              description: "Flexible subscriptions. Premium brands. Serious savings.",
              alertBadgeText: "Most customers save up to \xA355/month",
              promoBannerText: "\u2605 FIRST 50 CUSTOMERS - Get 10% OFF YOUR FIRST ORDER >",
              planItems: [
                {
                  slug: "lite",
                  name: "LITE",
                  subtitle: "Best for getting started",
                  price: 27.99,
                  limit: 6,
                  saveAmountText: "Save \xA35.00/month",
                  imageUrl: "",
                  features: [
                    "6 premium cans",
                    "Flexible delivery",
                    "Change flavours anytime",
                    "Skip or pause anytime"
                  ],
                  isPopular: false
                },
                {
                  slug: "core",
                  name: "CORE",
                  subtitle: "Most flexible",
                  price: 35.99,
                  limit: 8,
                  saveAmountText: "Save \xA310.00/month",
                  imageUrl: "",
                  features: [
                    "8 premium cans",
                    "Lower price per can",
                    "Change or swap brands",
                    "Skip or pause anytime"
                  ],
                  isPopular: false
                },
                {
                  slug: "pro",
                  name: "PRO",
                  subtitle: "Best value",
                  price: 40.99,
                  limit: 10,
                  saveAmountText: "Save \xA314.00/month",
                  imageUrl: "",
                  features: [
                    "10 premium cans",
                    "FREE delivery \u{1F4E6}",
                    "Best price per can",
                    "Loyalty rewards boost",
                    "Skip or pause anytime"
                  ],
                  isPopular: true
                },
                {
                  slug: "ultimate",
                  name: "ULTIMATE",
                  subtitle: "Maximum savings",
                  price: 46.99,
                  limit: 12,
                  saveAmountText: "Save \xA319.00/month",
                  imageUrl: "",
                  features: [
                    "12 premium cans",
                    "FREE delivery \u{1F4E6}",
                    "Lowest price per can",
                    "\xA33.80 for any extra can",
                    "Skip or pause anytime"
                  ],
                  extraText: "\xA33.80 FOR ANY ADDITIONAL CAN",
                  isPopular: false
                }
              ]
            }
          }
        ]
      },
      {
        id: "about",
        title: "About Us",
        slug: "about",
        visibility: "Visible",
        updatedAt: "Jul 20, 2026",
        sections: [
          {
            id: "about-sec-1",
            type: "Rich text",
            settings: {
              fullWidth: false,
              backgroundColor: "#FFFFFF",
              headingColor: "#0F172A",
              textColor: "#475569",
              title: "About Pouch Supply",
              description: "Pouch Supply is Europe\u2019s premier directory and depot for tobacco-free nicotine slim white canisters. We source directly from certified manufacturing laboratories across Sweden, Poland, Germany, and Europe, ensuring 100% genuine products, freshness guarantees, and rapid worldwide dispatch."
            }
          },
          {
            id: "about-sec-2",
            type: "Trust badges",
            settings: {
              fullWidth: false,
              backgroundColor: "#F8FAFC",
              headingColor: "#0F172A",
              textColor: "#64748B"
            }
          }
        ]
      },
      {
        id: "contact",
        title: "Contact Us",
        slug: "contact",
        visibility: "Visible",
        updatedAt: "Aug 04, 2026",
        sections: [
          {
            id: "contact-sec-1",
            type: "Contact Form",
            settings: {
              fullWidth: false,
              backgroundColor: "#FFFFFF",
              headingColor: "#0F172A",
              textColor: "#475569",
              title: "Get in Touch with Our Team",
              description: "Have questions about your order, shipping, or nicotine pouch brands? Fill out the form below or reach us directly. Our customer support team responds within 24 hours."
            }
          },
          {
            id: "contact-sec-2",
            type: "Trust badges",
            settings: {
              fullWidth: false,
              backgroundColor: "#F8FAFC",
              headingColor: "#0F172A",
              textColor: "#64748B"
            }
          }
        ]
      }
    ];
  }
});

// src/data/initialDevSettings.ts
var DEFAULT_DEV_SETTINGS;
var init_initialDevSettings = __esm({
  "src/data/initialDevSettings.ts"() {
    DEFAULT_DEV_SETTINGS = {
      customCss: `/* =========================================================
   Pouch Supply Global Custom CSS Overrides
   ========================================================= */

/* Custom scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #f1f5f9;
}
::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

/* Custom Highlight utility class */
.ps-custom-glow {
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.25);
  transition: all 0.3s ease;
}

/* Age verification badge pulse */
.ps-age-verified-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background-color: #0f172a;
  color: #f8fafc;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}`,
      customCssEnabled: true,
      customJs: `// =========================================================
// Pouch Supply Global Custom JavaScript Handler
// =========================================================

(function() {
  console.log('[Dev Mode] Custom global JavaScript initialized successfully.');

  // Custom event listener example for tracking shop interactions
  window.addEventListener('load', function() {
    const ageBadge = document.querySelector('.ps-age-verified-badge');
    if (ageBadge) {
      ageBadge.title = 'Verified 18+ Customer Environment';
    }
  });
})();`,
      customJsEnabled: true,
      customHeadCode: `<!-- Custom Head Meta Tags & Resource Hints -->
<meta name="pouch-supply-environment" content="production-uk-eu">
<meta name="pouch-supply-dev-build" content="v2.8.4">
<link rel="dns-prefetch" href="https://cdn.pouchsupply.co.uk">`,
      customHeadEnabled: true,
      customBodyCode: `<!-- Custom Body Footer Injection Hook -->
<div id="pouch-supply-body-injected-widget" data-dev-active="true" style="display:none;"></div>`,
      customBodyEnabled: true,
      snippets: [
        {
          id: "snip-1",
          name: "Express 24H Shipping Banner",
          key: "shipping_banner_html",
          description: "Top notification strip advertising UK 24H tracked delivery",
          code: `<div class="bg-slate-900 text-amber-400 text-[11px] font-extrabold py-1.5 px-4 text-center tracking-wider uppercase flex items-center justify-center gap-2">
  <span>\u26A1 FREE UK TRACKED 24 SHIPPING ON ORDERS OVER \xA330</span>
  <span class="text-slate-400">\u2022 DISPATCHED SAME DAY BEFORE 3PM</span>
</div>`,
          enabled: true,
          createdAt: "2026-07-28"
        },
        {
          id: "snip-2",
          name: "18+ Age Guarantee Disclaimer",
          key: "age_disclaimer_modal",
          description: "Regulatory compliance notice for nicotine pouch sales",
          code: `<div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-600 font-medium leading-relaxed">
  <strong class="text-slate-900 font-bold">18+ Nicotine Notice:</strong> This website contains nicotine-containing white pouch canisters intended strictly for adult consumers (18+).
</div>`,
          enabled: true,
          createdAt: "2026-07-29"
        }
      ],
      integrations: {
        googleAnalyticsId: "G-POUCH2026",
        googleAnalyticsEnabled: false,
        googleTagManagerId: "GTM-PS9981",
        googleTagManagerEnabled: false,
        metaPixelId: "109283746501928",
        metaPixelEnabled: false,
        microsoftClarityId: "cl_pouch_2026",
        microsoftClarityEnabled: false,
        hotjarSiteId: "5098231",
        hotjarEnabled: false,
        customWebhookUrl: "https://api.pouchsupply.co.uk/webhooks/orders",
        customWebhookEnabled: false
      },
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
});

// src/lib/orderRow.ts
var orderRow_exports = {};
__export(orderRow_exports, {
  toOrderRow: () => toOrderRow,
  upsertOrderRow: () => upsertOrderRow
});
function toOrderRow(item) {
  const id = String(item?.id || item?.orderId || "");
  const row = {
    id,
    // Required columns get a value even when the caller omitted one, because the
    // table rejects nulls here and losing the order is the worse outcome.
    customerName: item?.customerName || "Valued Customer",
    customerEmail: item?.customerEmail || "customer@pouch-supply.com",
    tags: Array.isArray(item?.tags) ? item.tags : [],
    fulfillmentStatus: item?.fulfillmentStatus || "Unfulfilled",
    destination: item?.destination || item?.address || "United Kingdom",
    date: item?.date || (/* @__PURE__ */ new Date()).toISOString(),
    deliveryMethod: item?.deliveryMethod || "Royal Mail Tracked 24/48",
    items: Array.isArray(item?.items) ? item.items : [],
    total: num(item?.total),
    // The whole order, including the fields the table has no column for.
    data: item ?? {}
  };
  for (const key of ORDER_COLUMNS) {
    if (key in row) continue;
    const value = item?.[key];
    if (value === void 0) continue;
    row[key] = value;
  }
  if (row.shippingCost === void 0 && item?.deliveryCost !== void 0) {
    row.shippingCost = num(item.deliveryCost, 0);
  }
  const royalMail = item?.data?.royalMail;
  if (royalMail) {
    if (row.royalMailOrderId === void 0 && royalMail.royalMailOrderId) {
      row.royalMailOrderId = String(royalMail.royalMailOrderId);
    }
    if (row.trackingNumber === void 0 && royalMail.trackingNumber) {
      row.trackingNumber = String(royalMail.trackingNumber);
    }
    if (row.carrier === void 0 && royalMail.carrier) {
      row.carrier = String(royalMail.carrier);
    }
  }
  if (row.storeCreditApplied !== void 0) row.storeCreditApplied = num(row.storeCreditApplied);
  if (row.subtotal !== void 0) row.subtotal = num(row.subtotal);
  if (row.shippingCost !== void 0) row.shippingCost = num(row.shippingCost);
  if (row.discountAmount !== void 0) row.discountAmount = num(row.discountAmount);
  if (row.isSubscription === void 0) {
    const tagged = row.tags.some((t) => String(t).toLowerCase().includes("subscription"));
    const hasDetails = Boolean(item?.subscriptionDetails && Object.keys(item.subscriptionDetails).length > 0);
    row.isSubscription = tagged || hasDetails;
  } else {
    row.isSubscription = Boolean(row.isSubscription);
  }
  if (row.tags.length === 0) row.tags = ["Storefront", "Online Order"];
  return row;
}
async function upsertOrderRow(item) {
  const row = toOrderRow(item);
  if (!row.id) {
    console.error("[Order Row] Refusing to write an order with no id.");
    return false;
  }
  const customerId = item?.customerId ? String(item.customerId) : null;
  const subscriptionId = item?.subscriptionId ? String(item.subscriptionId) : null;
  if (customerId) {
    const exists = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } }).catch(() => null);
    if (exists) row.customerId = customerId;
  }
  if (subscriptionId) {
    const exists = await prisma.subscription.findUnique({ where: { id: subscriptionId }, select: { id: true } }).catch(() => null);
    if (exists) row.subscriptionId = subscriptionId;
  }
  try {
    await prisma.order.upsert({
      where: { id: row.id },
      update: row,
      // `row` is assembled from a loose object, so it is narrowed to the real
      // columns at runtime by toOrderRow rather than by the compiler.
      create: row
    });
    return true;
  } catch (err) {
    console.error(`[Order Row] Neon write failed for ${row.id}:`, err?.message);
    return false;
  }
}
var ORDER_COLUMNS, num;
var init_orderRow = __esm({
  "src/lib/orderRow.ts"() {
    init_prisma();
    ORDER_COLUMNS = [
      "customerName",
      "customerEmail",
      "tags",
      "fulfillmentStatus",
      "paymentStatus",
      "worldpayTxId",
      "worldpayAuthCode",
      "gatewayTxId",
      "gatewayAuthCode",
      "cardBrand",
      "total",
      "storeCreditApplied",
      "destination",
      "date",
      "deliveryMethod",
      "items",
      "trackingId",
      "carrier",
      "trackingHistory",
      "discountApplied",
      "subtotal",
      "shippingCost",
      "discountAmount",
      "paymentMethod",
      "currency",
      "trackingNumber",
      "royalMailOrderId",
      "isSubscription",
      "subscriptionDetails",
      "notificationsSent"
    ];
    num = (value, fallback = 0) => {
      if (typeof value === "number" && Number.isFinite(value)) return value;
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
  }
});

// src/lib/subscriptionRow.ts
var subscriptionRow_exports = {};
__export(subscriptionRow_exports, {
  toSubscriptionRow: () => toSubscriptionRow,
  upsertSubscriptionRow: () => upsertSubscriptionRow
});
function toSubscriptionRow(item) {
  const row = {
    id: String(item?.id || ""),
    // Required columns. A subscription with no email or plan is still worth
    // storing — losing it entirely is the worse outcome.
    customerEmail: String(item?.customerEmail || item?.email || "").toLowerCase().trim(),
    planId: String(item?.planId || "sub-pack"),
    planName: String(item?.planName || "Pouch Supply Subscription"),
    amount: num2(item?.amount) ?? num2(item?.subPrice) ?? 0,
    status: String(item?.status || "active")
  };
  for (const key of OPTIONAL_COLUMNS) {
    const value = item?.[key];
    if (value !== void 0 && value !== null) row[key] = value;
  }
  const shipping = num2(item?.shippingCost) ?? num2(item?.shippingFee) ?? num2(item?.shippingAmount) ?? num2(item?.deliveryCost);
  if (shipping !== void 0) row.shippingCost = shipping;
  const itemPrice = num2(item?.itemPrice);
  if (itemPrice !== void 0) row.itemPrice = itemPrice;
  let cans = num2(item?.cansCount ?? item?.subCansCount);
  if (cans === void 0) {
    const box = Array.isArray(item?.items) ? item.items : [];
    const counted = box.reduce((sum2, it) => sum2 + (num2(it?.quantity) ?? 0), 0);
    if (counted > 0) cans = counted;
  }
  if (cans !== void 0) row.cansCount = Math.round(cans);
  const failed = num2(item?.failedPaymentCount);
  row.failedPaymentCount = failed !== void 0 ? Math.round(failed) : 0;
  const next = date(item?.nextBillingDate ?? item?.nextPayment);
  if (next) row.nextBillingDate = next;
  const last = date(item?.lastPaymentAt);
  if (last) row.lastPaymentAt = last;
  const cancelled = date(item?.cancelledAt);
  if (cancelled) row.cancelledAt = cancelled;
  return row;
}
async function upsertSubscriptionRow(item) {
  const row = toSubscriptionRow(item);
  if (!row.id) {
    console.error("[Subscription Row] Refusing to write a subscription with no id.");
    return false;
  }
  const candidateId = item?.customerId ? String(item.customerId) : null;
  if (candidateId) {
    const exists = await prisma.customer.findUnique({ where: { id: candidateId }, select: { id: true } }).catch(() => null);
    if (exists) row.customerId = candidateId;
  }
  if (!row.customerId && row.customerEmail) {
    const byEmail = await prisma.customer.findUnique({ where: { email: row.customerEmail }, select: { id: true } }).catch(() => null);
    if (byEmail) row.customerId = byEmail.id;
  }
  try {
    await prisma.subscription.upsert({ where: { id: row.id }, update: row, create: row });
    return true;
  } catch (err) {
    console.error(`[Subscription Row] Neon write failed for ${row.id}:`, err?.message);
    return false;
  }
}
var OPTIONAL_COLUMNS, num2, date;
var init_subscriptionRow = __esm({
  "src/lib/subscriptionRow.ts"() {
    init_prisma();
    OPTIONAL_COLUMNS = [
      "customerName",
      "currency",
      "billingInterval",
      "worldpayTransactionId",
      "worldpayTokenHref",
      "worldpayRecurringHref",
      "worldpaySchemeReference",
      "lastPaymentStatus",
      "lastPaymentId",
      "lastPaymentError",
      "items",
      "shippingAddress",
      "deliveryMethod",
      "sourceOrderId",
      "cancellationReason"
    ];
    num2 = (value) => {
      if (value === void 0 || value === null || value === "") return void 0;
      const parsed = typeof value === "number" ? value : parseFloat(value);
      return Number.isFinite(parsed) ? parsed : void 0;
    };
    date = (value) => {
      if (!value) return void 0;
      const d = value instanceof Date ? value : new Date(value);
      return Number.isNaN(d.getTime()) ? void 0 : d;
    };
  }
});

// serverDb.ts
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
function loadMemoryCacheFromBackup() {
  try {
    if (fs.existsSync(BACKUP_FILE_PATH)) {
      const raw = fs.readFileSync(BACKUP_FILE_PATH, "utf8");
      const data = JSON.parse(raw);
      if (data && typeof data === "object") {
        for (const key of Object.keys(data)) {
          if (Array.isArray(data[key]) && data[key].length > 0) {
            memoryCache[key] = data[key];
          }
        }
      }
    }
  } catch (err) {
    console.warn("[Local Backup] Could not load local_store_data.json backup:", err);
  }
}
function persistMemoryCacheToBackup() {
  try {
    const populatedKeys = Object.keys(memoryCache).filter(
      (k) => Array.isArray(memoryCache[k]) && memoryCache[k].length > 0
    );
    if (populatedKeys.length === 0) {
      return;
    }
    const payload = JSON.stringify(memoryCache, null, 2);
    if (fs.existsSync(BACKUP_FILE_PATH)) {
      const existing = fs.readFileSync(BACKUP_FILE_PATH, "utf8");
      if (existing === payload) {
        return;
      }
    }
    fs.writeFileSync(BACKUP_FILE_PATH, payload, "utf8");
  } catch (err) {
    console.warn("[Local Backup] Could not write to local_store_data.json backup:", err);
  }
}
async function ensureNeonTablesExist() {
  if (isTablesInitialized) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "StoreResource" (
        "id" TEXT PRIMARY KEY,
        "resource" TEXT NOT NULL,
        "itemId" TEXT NOT NULL,
        "data" JSONB NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "StoreResource_resource_itemId_key" UNIQUE ("resource", "itemId")
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "StoreSetting" (
        "id" TEXT PRIMARY KEY,
        "data" JSONB NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemStatus" (
        "id" TEXT PRIMARY KEY,
        "key" TEXT UNIQUE NOT NULL,
        "value" TEXT NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "NeonBackup" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "resourceCount" INTEGER NOT NULL DEFAULT 0,
        "data" JSONB NOT NULL
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CustomPage" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "slug" TEXT UNIQUE NOT NULL,
        "visibility" TEXT NOT NULL DEFAULT 'Visible',
        "isHomepage" BOOLEAN NOT NULL DEFAULT FALSE,
        "sections" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "data" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Product" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "price" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        "compareAtPrice" DOUBLE PRECISION DEFAULT 0.0,
        "inventory" INTEGER NOT NULL DEFAULT 0,
        "sku" TEXT,
        "category" TEXT,
        "vendor" TEXT,
        "status" TEXT NOT NULL DEFAULT 'Active',
        "image" TEXT,
        "weight" DOUBLE PRECISION,
        "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "media" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "variants" JSONB,
        "concreteVariants" JSONB,
        "barcode" TEXT,
        "weightUnit" TEXT,
        "slug" TEXT UNIQUE,
        "seoTitle" TEXT,
        "seoDescription" TEXT,
        "strength" TEXT,
        "flavour" TEXT,
        "isVariantCard" BOOLEAN DEFAULT FALSE,
        "concreteVariantId" TEXT,
        "parentSlug" TEXT,
        "parentId" TEXT,
        "data" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Collection" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "type" TEXT NOT NULL DEFAULT 'Manual',
        "image" TEXT,
        "productIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "productConditions" TEXT,
        "slug" TEXT UNIQUE,
        "seoTitle" TEXT,
        "seoDescription" TEXT,
        "ogImage" TEXT,
        "data" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FileEntry" (
        "id" TEXT PRIMARY KEY,
        "publicId" TEXT UNIQUE,
        "url" TEXT NOT NULL,
        "secureUrl" TEXT,
        "resourceType" TEXT DEFAULT 'image',
        "format" TEXT,
        "width" INTEGER,
        "height" INTEGER,
        "fileSize" TEXT,
        "folder" TEXT DEFAULT 'storefront_media',
        "originalFilename" TEXT,
        "fileName" TEXT,
        "altText" TEXT,
        "dateAdded" TEXT,
        "size" TEXT,
        "references" TEXT,
        "mimeType" TEXT,
        "data" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Order" (
        "id" TEXT PRIMARY KEY,
        "customerName" TEXT NOT NULL,
        "customerEmail" TEXT NOT NULL,
        "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "fulfillmentStatus" TEXT NOT NULL DEFAULT 'Unfulfilled',
        "paymentStatus" TEXT DEFAULT 'Paid',
        "worldpayTxId" TEXT,
        "worldpayAuthCode" TEXT,
        "gatewayTxId" TEXT,
        "gatewayAuthCode" TEXT,
        "cardBrand" TEXT,
        "total" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        "storeCreditApplied" DOUBLE PRECISION DEFAULT 0.0,
        "destination" TEXT NOT NULL,
        "date" TEXT NOT NULL,
        "deliveryMethod" TEXT NOT NULL,
        "items" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "trackingId" TEXT,
        "carrier" TEXT,
        "trackingHistory" JSONB,
        "discountApplied" JSONB,
        "data" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Customer" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT UNIQUE NOT NULL,
        "subscriptionStatus" TEXT NOT NULL DEFAULT 'Not subscribed',
        "location" TEXT,
        "ordersCount" INTEGER NOT NULL DEFAULT 0,
        "amountSpent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        "addresses" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "wishlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "referralCode" TEXT,
        "storeCredit" DOUBLE PRECISION DEFAULT 0.0,
        "referredByCode" TEXT,
        "subStatus" TEXT,
        "subPlan" TEXT,
        "subFrequency" TEXT,
        "subCansCount" INTEGER,
        "subPrice" DOUBLE PRECISION,
        "nextPayment" TEXT,
        "nextDelivery" TEXT,
        "data" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Subscription" (
        "id" TEXT PRIMARY KEY,
        "customerId" TEXT,
        "customerEmail" TEXT NOT NULL,
        "customerName" TEXT,
        "planId" TEXT NOT NULL,
        "planName" TEXT NOT NULL,
        "amount" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        "currency" TEXT NOT NULL DEFAULT 'GBP',
        "status" TEXT NOT NULL DEFAULT 'active',
        "billingInterval" TEXT NOT NULL DEFAULT 'month',
        "nextBillingDate" TIMESTAMP(3),
        "worldpayTransactionId" TEXT,
        "worldpayTokenHref" TEXT,
        "worldpayRecurringHref" TEXT,
        "worldpaySchemeReference" TEXT,
        "lastPaymentStatus" TEXT,
        "lastPaymentId" TEXT,
        "lastPaymentAt" TIMESTAMP(3),
        "failedPaymentCount" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "worldpayTokenHref" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "BlogPost" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "slug" TEXT UNIQUE NOT NULL,
        "excerpt" TEXT,
        "content" TEXT NOT NULL,
        "image" TEXT,
        "author" TEXT,
        "category" TEXT,
        "status" TEXT NOT NULL DEFAULT 'Active',
        "publishedAt" TEXT,
        "readTime" TEXT,
        "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "data" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Discount" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'Active',
        "method" TEXT,
        "eligibility" TEXT,
        "type" TEXT NOT NULL,
        "used" INTEGER NOT NULL DEFAULT 0,
        "details" TEXT,
        "data" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LayoutSetting" (
        "id" TEXT PRIMARY KEY DEFAULT 'layout_settings',
        "headerLogoText" TEXT,
        "headerLogoSubtext" TEXT,
        "headerLogoImage" TEXT,
        "footerLogoText" TEXT,
        "footerLogoDescription" TEXT,
        "footerLogoImage" TEXT,
        "menuItems" JSONB,
        "data" JSONB,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AnalyticsRecord" (
        "id" TEXT PRIMARY KEY,
        "metric" TEXT NOT NULL,
        "value" DOUBLE PRECISION NOT NULL,
        "period" TEXT,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    isTablesInitialized = true;
  } catch (err) {
    console.warn("[Neon Table Setup] Warning: Table initialization check encountered error:", err);
  }
}
async function hydrateMemoryCacheFromDatabase() {
  const isConnected = await getDb();
  if (!isConnected) {
    console.log("[Database Hydration] Database is offline or not configured. Using local backup state.");
    return;
  }
  try {
    await ensureNeonTablesExist();
    console.log("[Database Hydration] Syncing memory cache with Neon PostgreSQL database...");
    const resources = ["customPages", "products", "collections", "orders", "files", "customers", "discounts", "blogs"];
    for (const resName of resources) {
      const records = await prisma.storeResource.findMany({
        where: { resource: resName },
        orderBy: { createdAt: "asc" }
      });
      const directList = await fetchFromPrismaModel(resName);
      const mergedMap = /* @__PURE__ */ new Map();
      for (const r of records || []) {
        if (r && r.data) {
          const item = r.data;
          const key = String(item.id || item.slug || item.orderId || "");
          if (key) mergedMap.set(key, item);
        }
      }
      for (const item of directList) {
        if (!item) continue;
        const key = String(item.id || item.slug || item.orderId || "");
        if (key) {
          if (!mergedMap.has(key)) {
            mergedMap.set(key, item);
          } else {
            const existing = mergedMap.get(key);
            let merged = { ...existing, ...item };
            if (resName === "customPages" || resName === "custompages") {
              const itemSecs = Array.isArray(item?.sections) ? item.sections : [];
              const existSecs = Array.isArray(existing?.sections) ? existing.sections : [];
              if (itemSecs.length > 0) merged.sections = itemSecs;
              else if (existSecs.length > 0) merged.sections = existSecs;
            }
            mergedMap.set(key, merged);
          }
        }
      }
      if (mergedMap.size > 0) {
        const list = Array.from(mergedMap.values());
        memoryCache[resName] = list;
      } else {
        memoryCache[resName] = [];
      }
    }
    persistMemoryCacheToBackup();
    console.log("[Database Hydration] Successfully hydrated memory cache from Neon PostgreSQL.");
  } catch (err) {
    console.error("[Database Hydration] Error during startup hydration from Neon DB:", err?.message || err);
  }
}
function getHostFromDatabaseUrl(urlStr) {
  if (!urlStr) return { host: "N/A", database: "N/A" };
  try {
    const cleaned = urlStr.trim().replace(/^["']|["']$/g, "");
    const parsed = new URL(cleaned);
    return {
      host: parsed.hostname || "N/A",
      database: parsed.pathname.replace(/^\//, "") || "N/A"
    };
  } catch (e) {
    return { host: "N/A", database: "N/A" };
  }
}
async function testNeonConnection() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return {
      status: "not-configured",
      provider: "Neon PostgreSQL",
      error: "DATABASE_URL environment variable is not configured."
    };
  }
  const { host, database } = getHostFromDatabaseUrl(dbUrl);
  try {
    await prisma.$queryRaw`SELECT 1`;
    await ensureNeonTablesExist();
    return {
      status: "connected",
      provider: "Neon PostgreSQL",
      host,
      database
    };
  } catch (err) {
    return {
      status: "error",
      provider: "Neon PostgreSQL",
      host,
      database,
      error: err?.message || String(err)
    };
  }
}
async function getConnectionStatus() {
  return await testNeonConnection();
}
async function getDatabaseDetails() {
  const dbUrl = process.env.DATABASE_URL;
  const { host, database } = getHostFromDatabaseUrl(dbUrl);
  try {
    if (!dbUrl) {
      return {
        provider: "Neon PostgreSQL",
        status: "not-configured",
        host: "N/A",
        database: "N/A",
        uriHost: "N/A",
        dbName: "N/A",
        collections: [],
        models: [],
        error: "DATABASE_URL is missing"
      };
    }
    const versionResult = await prisma.$queryRaw`SELECT version()`;
    const version = versionResult[0]?.version || "PostgreSQL (Neon)";
    let collectionsList = [];
    try {
      await ensureNeonTablesExist();
      const grouped = await prisma.storeResource.groupBy({
        by: ["resource"],
        _count: { _all: true }
      });
      collectionsList = grouped.map((g) => ({
        name: g.resource,
        count: g._count._all
      }));
    } catch (gErr) {
      console.warn("[getDatabaseDetails] Failed grouping resources:", gErr);
    }
    const modelsList = [
      "SystemStatus",
      "StoreResource",
      "StoreSetting",
      "Product",
      "Collection",
      "FileEntry",
      "Order",
      "CustomPage",
      "Customer",
      "BlogPost",
      "Discount",
      "LayoutSetting"
    ];
    return {
      provider: "Neon PostgreSQL",
      status: "connected",
      host,
      database,
      uriHost: host,
      dbName: database,
      version,
      orm: "Prisma",
      collections: collectionsList,
      models: modelsList
    };
  } catch (err) {
    return {
      provider: "Neon PostgreSQL",
      status: "error",
      host,
      database,
      uriHost: host,
      dbName: database,
      collections: [],
      models: [],
      error: err?.message || String(err),
      orm: "Prisma"
    };
  }
}
async function updateDatabaseUrl(newUrl) {
  const trimmed = newUrl.trim();
  process.env.DATABASE_URL = trimmed;
  isTablesInitialized = false;
  try {
    const envPath = path.join(process.cwd(), ".env");
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }
    const regex = /^DATABASE_URL\s*=\s*.*$/m;
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `DATABASE_URL="${trimmed}"`);
    } else {
      envContent = `${envContent.trim()}
DATABASE_URL="${trimmed}"
`;
    }
    fs.writeFileSync(envPath, envContent.trim() + "\n", "utf8");
  } catch (err) {
    console.warn("[Database Config] Failed to persist DATABASE_URL to .env:", err);
  }
  return await testNeonConnection();
}
async function getDb() {
  const status = await testNeonConnection();
  return status.status === "connected";
}
function isDeleteProtected(resource) {
  return LIST_SAVE_NEVER_DELETES.has(String(resource || "").toLowerCase());
}
function normalizeResourceName(resource) {
  if (!resource) return resource;
  const lower = resource.toLowerCase();
  if (lower === "custompages") return "customPages";
  return resource;
}
async function syncToPrismaModel(resource, item) {
  if (!item) return;
  const id = String(item.id || item.slug || `item-${Date.now()}-${Math.random()}`);
  const norm = resource.toLowerCase();
  try {
    if (norm === "products") {
      await prisma.product.upsert({
        where: { id },
        update: {
          title: item.title || "Untitled Product",
          description: item.description || null,
          price: typeof item.price === "number" ? item.price : parseFloat(item.price) || 0,
          compareAtPrice: typeof item.compareAtPrice === "number" ? item.compareAtPrice : parseFloat(item.compareAtPrice) || 0,
          inventory: typeof item.inventory === "number" ? item.inventory : parseInt(item.inventory) || 0,
          sku: item.sku || null,
          category: item.category || null,
          vendor: item.vendor || null,
          status: item.status || "Active",
          image: item.image || null,
          weight: typeof item.weight === "number" ? item.weight : parseFloat(item.weight) || 0,
          tags: Array.isArray(item.tags) ? item.tags : [],
          media: Array.isArray(item.media) ? item.media : [],
          variants: item.variants || null,
          concreteVariants: item.concreteVariants || null,
          barcode: item.barcode || null,
          slug: item.slug || id,
          seoTitle: item.seoTitle || null,
          seoDescription: item.seoDescription || null,
          strength: item.strength || null,
          flavour: item.flavour || null,
          data: item
        },
        create: {
          id,
          title: item.title || "Untitled Product",
          description: item.description || null,
          price: typeof item.price === "number" ? item.price : parseFloat(item.price) || 0,
          compareAtPrice: typeof item.compareAtPrice === "number" ? item.compareAtPrice : parseFloat(item.compareAtPrice) || 0,
          inventory: typeof item.inventory === "number" ? item.inventory : parseInt(item.inventory) || 0,
          sku: item.sku || null,
          category: item.category || null,
          vendor: item.vendor || null,
          status: item.status || "Active",
          image: item.image || null,
          weight: typeof item.weight === "number" ? item.weight : parseFloat(item.weight) || 0,
          tags: Array.isArray(item.tags) ? item.tags : [],
          media: Array.isArray(item.media) ? item.media : [],
          variants: item.variants || null,
          concreteVariants: item.concreteVariants || null,
          barcode: item.barcode || null,
          slug: item.slug || id,
          seoTitle: item.seoTitle || null,
          seoDescription: item.seoDescription || null,
          strength: item.strength || null,
          flavour: item.flavour || null,
          data: item
        }
      });
    } else if (norm === "collections") {
      const colSlug = item.slug || id;
      try {
        await prisma.collection.upsert({
          where: { id },
          update: {
            title: item.title || "Untitled Collection",
            description: item.description || null,
            type: item.type || "Manual",
            image: item.image || null,
            productIds: Array.isArray(item.productIds) ? item.productIds : [],
            slug: colSlug,
            seoTitle: item.seoTitle || null,
            seoDescription: item.seoDescription || null,
            data: item
          },
          create: {
            id,
            title: item.title || "Untitled Collection",
            description: item.description || null,
            type: item.type || "Manual",
            image: item.image || null,
            productIds: Array.isArray(item.productIds) ? item.productIds : [],
            slug: colSlug,
            seoTitle: item.seoTitle || null,
            seoDescription: item.seoDescription || null,
            data: item
          }
        });
      } catch (colErr) {
        if (colErr?.code === "P2002") {
          await prisma.collection.upsert({
            where: { id },
            update: { slug: `${colSlug}-${id}`, data: item },
            create: { id, title: item.title || "Untitled Collection", slug: `${colSlug}-${id}`, data: item }
          }).catch(() => {
          });
        }
      }
    } else if (norm === "blogs") {
      const blogSlug = item.slug ? String(item.slug).trim() : id;
      const cleanContent = typeof item.content === "string" ? item.content : typeof item.body === "string" ? item.body : item.content ? String(item.content) : "";
      const blogData = {
        title: item.title || "Untitled Blog",
        slug: blogSlug,
        excerpt: item.excerpt || null,
        content: cleanContent,
        image: item.image || null,
        author: item.author || null,
        category: item.category || null,
        status: item.status || "Active",
        publishedAt: item.publishedAt || null,
        readTime: item.readTime || null,
        tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
        data: item
      };
      try {
        await prisma.blogPost.upsert({
          where: { id },
          update: blogData,
          create: {
            id,
            ...blogData
          }
        });
      } catch (bErr) {
        if (bErr?.code === "P2002") {
          const fallbackSlug = `${blogSlug}-${String(id).slice(-6)}`;
          await prisma.blogPost.upsert({
            where: { id },
            update: { ...blogData, slug: fallbackSlug },
            create: { id, ...blogData, slug: fallbackSlug }
          }).catch((e) => console.warn(`[BlogPost Fallback Upsert] warning:`, e?.message));
        } else {
          console.warn(`[BlogPost Sync] warning:`, bErr?.message);
        }
      }
    } else if (norm === "discounts") {
      await prisma.discount.upsert({
        where: { id },
        update: {
          title: item.title || item.code || "Discount",
          status: item.status || "Active",
          method: item.method || "Code",
          eligibility: item.eligibility || "All",
          type: item.type || "Percentage",
          used: typeof item.used === "number" ? item.used : 0,
          details: item.details || null,
          data: item
        },
        create: {
          id,
          title: item.title || item.code || "Discount",
          status: item.status || "Active",
          method: item.method || "Code",
          eligibility: item.eligibility || "All",
          type: item.type || "Percentage",
          used: typeof item.used === "number" ? item.used : 0,
          details: item.details || null,
          data: item
        }
      });
    } else if (norm === "customers") {
      const emailVal = item.email && item.email.trim() ? item.email.trim().toLowerCase() : `cust-${id}@pouch-supply.com`;
      try {
        await prisma.customer.upsert({
          where: { email: emailVal },
          update: {
            name: item.name || "Customer",
            subscriptionStatus: item.subscriptionStatus || "Not subscribed",
            location: item.location || null,
            ordersCount: typeof item.ordersCount === "number" ? item.ordersCount : 0,
            amountSpent: typeof item.amountSpent === "number" ? item.amountSpent : 0,
            addresses: Array.isArray(item.addresses) ? item.addresses : [],
            wishlist: Array.isArray(item.wishlist) ? item.wishlist : [],
            referralCode: item.referralCode || null,
            storeCredit: typeof item.storeCredit === "number" ? item.storeCredit : 0,
            data: item
          },
          create: {
            id,
            name: item.name || "Customer",
            email: emailVal,
            subscriptionStatus: item.subscriptionStatus || "Not subscribed",
            location: item.location || null,
            ordersCount: typeof item.ordersCount === "number" ? item.ordersCount : 0,
            amountSpent: typeof item.amountSpent === "number" ? item.amountSpent : 0,
            addresses: Array.isArray(item.addresses) ? item.addresses : [],
            wishlist: Array.isArray(item.wishlist) ? item.wishlist : [],
            referralCode: item.referralCode || null,
            storeCredit: typeof item.storeCredit === "number" ? item.storeCredit : 0,
            data: item
          }
        });
      } catch (cErr) {
        if (cErr?.code === "P2002") {
          const safeEmail = `cust-${id}@pouch-supply.com`;
          await prisma.customer.upsert({
            where: { id },
            update: {
              name: item.name || "Customer",
              email: safeEmail,
              subscriptionStatus: item.subscriptionStatus || "Not subscribed",
              location: item.location || null,
              ordersCount: typeof item.ordersCount === "number" ? item.ordersCount : 0,
              amountSpent: typeof item.amountSpent === "number" ? item.amountSpent : 0,
              addresses: Array.isArray(item.addresses) ? item.addresses : [],
              wishlist: Array.isArray(item.wishlist) ? item.wishlist : [],
              referralCode: item.referralCode || null,
              storeCredit: typeof item.storeCredit === "number" ? item.storeCredit : 0,
              data: item
            },
            create: {
              id,
              name: item.name || "Customer",
              email: safeEmail,
              subscriptionStatus: item.subscriptionStatus || "Not subscribed",
              location: item.location || null,
              ordersCount: typeof item.ordersCount === "number" ? item.ordersCount : 0,
              amountSpent: typeof item.amountSpent === "number" ? item.amountSpent : 0,
              addresses: Array.isArray(item.addresses) ? item.addresses : [],
              wishlist: Array.isArray(item.wishlist) ? item.wishlist : [],
              referralCode: item.referralCode || null,
              storeCredit: typeof item.storeCredit === "number" ? item.storeCredit : 0,
              data: item
            }
          }).catch((e) => console.warn("[Prisma Customer Sync] Fallback error:", e?.message));
        } else {
          console.warn("[Prisma Customer Sync] Warning:", cErr?.message);
        }
      }
    } else if (norm === "orders") {
      const { upsertOrderRow: upsertOrderRow2 } = await Promise.resolve().then(() => (init_orderRow(), orderRow_exports));
      await upsertOrderRow2(item);
    } else if (norm === "custompages" || norm === "pages") {
      const pageSlug = item.slug || id;
      const pageSections = Array.isArray(item.sections) ? item.sections : [];
      try {
        await prisma.customPage.upsert({
          where: { id },
          update: {
            title: item.title || "Untitled Page",
            slug: pageSlug,
            visibility: item.visibility || "Visible",
            isHomepage: Boolean(item.isHomepage),
            sections: pageSections,
            data: { ...item, sections: pageSections }
          },
          create: {
            id,
            title: item.title || "Untitled Page",
            slug: pageSlug,
            visibility: item.visibility || "Visible",
            isHomepage: Boolean(item.isHomepage),
            sections: pageSections,
            data: { ...item, sections: pageSections }
          }
        });
      } catch (pErr) {
        if (pErr?.code === "P2002") {
          await prisma.customPage.upsert({
            where: { id },
            update: { slug: `${pageSlug}-${id}`, sections: pageSections, data: { ...item, sections: pageSections } },
            create: { id, title: item.title || "Untitled Page", slug: `${pageSlug}-${id}`, sections: pageSections, data: { ...item, sections: pageSections } }
          }).catch(() => {
          });
        }
      }
    } else if (norm === "analytics" || norm === "analyticsrecords" || norm === "analyticsrecord") {
      await prisma.analyticsRecord.upsert({
        where: { id },
        update: {
          metric: item.metric || "page_view",
          value: typeof item.value === "number" ? item.value : parseFloat(item.value) || 1,
          period: item.period || null,
          metadata: item.metadata || item
        },
        create: {
          id,
          metric: item.metric || "page_view",
          value: typeof item.value === "number" ? item.value : parseFloat(item.value) || 1,
          period: item.period || null,
          metadata: item.metadata || item
        }
      });
    } else if (norm === "files" || norm === "fileentry" || norm === "fileentries") {
      if (item.url) {
        const sizeVal = item.size ?? item.fileSize;
        const sizeStr = typeof sizeVal === "number" ? sizeVal > 1024 * 1024 ? `${(sizeVal / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(sizeVal / 1024)} KB` : sizeVal ? String(sizeVal) : null;
        const rawPublicId = item.publicId;
        const publicIdStr = rawPublicId && typeof rawPublicId === "string" && rawPublicId.trim() !== "" ? rawPublicId.trim() : null;
        const fileData = {
          fileName: item.fileName || item.originalFilename || "Media Asset",
          altText: item.altText ? String(item.altText) : "Media Asset",
          size: sizeStr,
          fileSize: sizeStr,
          references: item.references ? String(item.references) : "Direct Upload",
          url: String(item.url),
          secureUrl: item.secureUrl ? String(item.secureUrl) : String(item.url),
          mimeType: item.mimeType ? String(item.mimeType) : null,
          publicId: publicIdStr,
          resourceType: item.resourceType ? String(item.resourceType) : "image",
          format: item.format ? String(item.format) : null,
          folder: item.folder ? String(item.folder) : "storefront_media",
          width: typeof item.width === "number" ? item.width : parseInt(String(item.width), 10) || null,
          height: typeof item.height === "number" ? item.height : parseInt(String(item.height), 10) || null,
          data: item
        };
        try {
          await prisma.fileEntry.upsert({
            where: { id },
            update: fileData,
            create: {
              id,
              ...fileData
            }
          });
        } catch (upsertErr) {
          if (upsertErr?.code === "P2002") {
            await prisma.fileEntry.upsert({
              where: { id },
              update: { ...fileData, publicId: null },
              create: {
                id,
                ...fileData,
                publicId: null
              }
            }).catch(() => {
            });
          }
        }
      }
    } else if (norm === "subscriptions" || norm === "subscription") {
      const { upsertSubscriptionRow: upsertSubscriptionRow2 } = await Promise.resolve().then(() => (init_subscriptionRow(), subscriptionRow_exports));
      await upsertSubscriptionRow2(item);
    }
  } catch (mErr) {
    console.warn(`[Prisma Model Sync] ${norm} sync warning:`, mErr?.message);
  }
}
async function fetchFromPrismaModel(resource) {
  const norm = resource.toLowerCase();
  try {
    if (norm === "orders") {
      const dbOrders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
      return dbOrders.map((o) => {
        const itemData = o.data && typeof o.data === "object" && !Array.isArray(o.data) ? o.data : {};
        return {
          id: o.id,
          customerName: o.customerName,
          customerEmail: o.customerEmail,
          tags: o.tags,
          fulfillmentStatus: o.fulfillmentStatus,
          paymentStatus: o.paymentStatus,
          worldpayTxId: o.worldpayTxId,
          worldpayAuthCode: o.worldpayAuthCode,
          gatewayTxId: o.gatewayTxId,
          gatewayAuthCode: o.gatewayAuthCode,
          cardBrand: o.cardBrand,
          total: o.total,
          storeCreditApplied: o.storeCreditApplied,
          destination: o.destination,
          date: o.date,
          deliveryMethod: o.deliveryMethod,
          items: o.items,
          trackingId: o.trackingId,
          carrier: o.carrier,
          trackingHistory: o.trackingHistory,
          discountApplied: o.discountApplied,
          ...itemData,
          createdAt: o.createdAt ? o.createdAt.toISOString() : void 0
        };
      });
    } else if (norm === "subscriptions" || norm === "subscription") {
      const items = await prisma.subscription.findMany({ orderBy: { createdAt: "desc" } });
      return items.map((s) => ({
        id: s.id,
        customerId: s.customerId,
        customerEmail: s.customerEmail,
        customerName: s.customerName,
        planId: s.planId,
        planName: s.planName,
        amount: Number(s.amount),
        currency: s.currency,
        status: s.status,
        billingInterval: s.billingInterval,
        nextBillingDate: s.nextBillingDate ? s.nextBillingDate.toISOString() : null,
        worldpayTransactionId: s.worldpayTransactionId,
        worldpayTokenHref: s.worldpayTokenHref,
        worldpayRecurringHref: s.worldpayRecurringHref,
        worldpaySchemeReference: s.worldpaySchemeReference,
        lastPaymentStatus: s.lastPaymentStatus,
        lastPaymentId: s.lastPaymentId,
        lastPaymentAt: s.lastPaymentAt ? s.lastPaymentAt.toISOString() : null,
        failedPaymentCount: s.failedPaymentCount,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        // Every lookup that ties a subscription to its order matches on
        // sourceOrderId: the duplicate guard, the repair sweep, token matching
        // and the inspection script. This mapping used to omit it, so a
        // subscription whose StoreResource copy was missing or overwritten came
        // back from here with no order at all — invisible to all of them, while
        // the renewal cron, which reads this table directly, still billed it.
        //
        // Spread only when present: this object is merged OVER the StoreResource
        // copy, so emitting a null would erase a value the other copy holds.
        ...s.sourceOrderId ? { sourceOrderId: s.sourceOrderId } : {},
        ...s.items ? { items: s.items } : {},
        ...s.itemPrice !== null && s.itemPrice !== void 0 ? { itemPrice: Number(s.itemPrice) } : {},
        ...s.shippingCost !== null && s.shippingCost !== void 0 ? { shippingCost: Number(s.shippingCost) } : {},
        ...s.shippingAddress ? { shippingAddress: s.shippingAddress } : {},
        ...s.deliveryMethod ? { deliveryMethod: s.deliveryMethod } : {},
        ...s.cansCount !== null && s.cansCount !== void 0 ? { cansCount: s.cansCount } : {}
      }));
    } else if (norm === "products") {
      const items = await prisma.product.findMany();
      return items.map((p) => p.data && typeof p.data === "object" ? { ...p.data, id: p.id } : p);
    } else if (norm === "collections") {
      const items = await prisma.collection.findMany();
      return items.map((c) => c.data && typeof c.data === "object" ? { ...c.data, id: c.id } : c);
    } else if (norm === "blogs") {
      const items = await prisma.blogPost.findMany();
      return items.map((b) => b.data && typeof b.data === "object" ? { ...b.data, id: b.id } : b);
    } else if (norm === "discounts") {
      const items = await prisma.discount.findMany();
      return items.map((d) => d.data && typeof d.data === "object" ? { ...d.data, id: d.id } : d);
    } else if (norm === "customers") {
      const items = await prisma.customer.findMany();
      return items.map((c) => c.data && typeof c.data === "object" ? { ...c.data, id: c.id } : c);
    } else if (norm === "files" || norm === "fileentry" || norm === "fileentries") {
      const items = await prisma.fileEntry.findMany({ orderBy: { createdAt: "desc" } });
      return items.map((f) => f.data && typeof f.data === "object" ? { ...f.data, id: f.id, url: f.url } : f);
    } else if (norm === "custompages" || norm === "pages") {
      const items = await prisma.customPage.findMany();
      return items.map((cp) => {
        let pageObj = cp.data && typeof cp.data === "object" ? { ...cp.data } : {};
        pageObj.id = cp.id || pageObj.id;
        pageObj.title = cp.title || pageObj.title;
        pageObj.slug = cp.slug ?? pageObj.slug;
        pageObj.visibility = cp.visibility || pageObj.visibility;
        pageObj.isHomepage = cp.isHomepage !== void 0 ? cp.isHomepage : pageObj.isHomepage;
        const colSections = Array.isArray(cp.sections) ? cp.sections : [];
        const dataSections = Array.isArray(pageObj.sections) ? pageObj.sections : [];
        if (colSections.length > 0) {
          pageObj.sections = colSections;
        } else if (dataSections.length > 0) {
          pageObj.sections = dataSections;
        } else {
          pageObj.sections = [];
        }
        return pageObj;
      });
    } else if (norm === "analytics" || norm === "analyticsrecords" || norm === "analyticsrecord") {
      const items = await prisma.analyticsRecord.findMany();
      return items.map((a) => a.metadata && typeof a.metadata === "object" ? { ...a.metadata, id: a.id } : a);
    }
  } catch (err) {
    console.warn(`[fetchFromPrismaModel] ${norm} query warning:`, err?.message);
  }
  return [];
}
async function fetchResource(resource) {
  const normResource = normalizeResourceName(resource);
  const isConnected = await getDb();
  if (isConnected) {
    try {
      const records = await prisma.storeResource.findMany({
        where: { resource: normResource },
        orderBy: { createdAt: "asc" }
      });
      const storeResourceList = (records || []).map((r) => r.data);
      const directModelList = await fetchFromPrismaModel(normResource);
      const mergedMap = /* @__PURE__ */ new Map();
      for (const item of storeResourceList) {
        if (!item) continue;
        const key = String(item.id || item.slug || item.orderId || "");
        if (key) mergedMap.set(key, item);
      }
      for (const item of directModelList) {
        if (!item) continue;
        const key = String(item.id || item.slug || item.orderId || "");
        if (key) {
          if (!mergedMap.has(key)) {
            mergedMap.set(key, item);
            prisma.storeResource.upsert({
              where: { resource_itemId: { resource: normResource, itemId: key } },
              update: { data: item },
              create: { resource: normResource, itemId: key, data: item }
            }).catch(() => {
            });
          } else {
            const existing = mergedMap.get(key);
            let mergedItem = { ...existing, ...item };
            if (normResource === "customPages" || normResource === "custompages" || normResource === "pages") {
              const itemSecs = Array.isArray(item?.sections) ? item.sections : [];
              const existingSecs = Array.isArray(existing?.sections) ? existing.sections : [];
              if (itemSecs.length > 0) {
                mergedItem.sections = itemSecs;
              } else if (existingSecs.length > 0) {
                mergedItem.sections = existingSecs;
              } else {
                mergedItem.sections = [];
              }
            }
            if (normResource === "blogs" && !mergedItem.image && existing?.image) {
              mergedItem.image = existing.image;
            }
            mergedMap.set(key, mergedItem);
          }
        }
      }
      if (mergedMap.size > 0) {
        const list = Array.from(mergedMap.values());
        memoryCache[normResource] = list;
        persistMemoryCacheToBackup();
        return list;
      }
      memoryCache[normResource] = [];
      return [];
    } catch (err) {
      console.error(`[Neon DB] Error fetching resource ${normResource}:`, err);
    }
  }
  return memoryCache[normResource] || memoryCache[resource] || [];
}
async function saveResource(resource, list) {
  const normResource = normalizeResourceName(resource);
  const normalizedList = Array.isArray(list) ? list : list ? [list] : [];
  if (!Array.isArray(normalizedList)) return memoryCache[normResource] || [];
  if (normResource === "customPages" || normResource === "custompages" || normResource === "pages") {
    const existingPages = memoryCache["customPages"] || [];
    for (let i = 0; i < normalizedList.length; i++) {
      const p = normalizedList[i];
      if (p && (!p.sections || !Array.isArray(p.sections) || p.sections.length === 0)) {
        const existing = existingPages.find((ep) => ep && (ep.id === p.id || ep.slug === p.slug));
        if (existing && Array.isArray(existing.sections) && existing.sections.length > 0) {
          normalizedList[i] = { ...p, sections: existing.sections };
        }
      }
    }
  }
  memoryCache[normResource] = [...normalizedList];
  if (normResource !== resource) memoryCache[resource] = memoryCache[normResource];
  persistMemoryCacheToBackup();
  const isConnected = await getDb();
  if (isConnected) {
    try {
      const validItemIds = [];
      const BATCH_SIZE = 25;
      for (let i = 0; i < normalizedList.length; i += BATCH_SIZE) {
        const batch = normalizedList.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (item) => {
          if (!item) return;
          const itemId = String(item.id || item.slug || item.orderId || `item-${Date.now()}-${Math.random()}`);
          validItemIds.push(itemId);
          await prisma.storeResource.upsert({
            where: {
              resource_itemId: {
                resource: normResource,
                itemId
              }
            },
            update: { data: item },
            create: {
              resource: normResource,
              itemId,
              data: item
            }
          }).catch((e) => console.warn(`[StoreResource Sync] ${normResource} ${itemId} warning:`, e?.message));
          await syncToPrismaModel(normResource, item).catch(
            (e) => console.error(
              `[Model Sync FAILED] ${normResource}/${itemId} \u2014 typed table is now stale:`,
              e?.message
            )
          );
        }));
      }
      if (validItemIds.length > 0 && !isDeleteProtected(normResource)) {
        await prisma.storeResource.deleteMany({
          where: {
            resource: normResource,
            itemId: {
              notIn: validItemIds
            }
          }
        }).catch((e) => console.warn(`[StoreResource deleteMany] ${normResource} warning:`, e?.message));
      }
      const norm = normResource.toLowerCase();
      if (validItemIds.length > 0 && !isDeleteProtected(normResource)) {
        if (norm === "products") {
          await prisma.product.deleteMany({ where: { id: { notIn: validItemIds } } }).catch(() => {
          });
        } else if (norm === "collections") {
          await prisma.collection.deleteMany({ where: { id: { notIn: validItemIds } } }).catch(() => {
          });
        } else if (norm === "customers") {
          await prisma.customer.deleteMany({ where: { id: { notIn: validItemIds } } }).catch(() => {
          });
        } else if (norm === "blogs") {
          await prisma.blogPost.deleteMany({ where: { id: { notIn: validItemIds } } }).catch(() => {
          });
        } else if (norm === "discounts") {
          await prisma.discount.deleteMany({ where: { id: { notIn: validItemIds } } }).catch(() => {
          });
        } else if (norm === "custompages" || norm === "pages") {
          await prisma.customPage.deleteMany({ where: { id: { notIn: validItemIds } } }).catch(() => {
          });
        } else if (norm === "files" || norm === "fileentry" || norm === "fileentries") {
          await prisma.fileEntry.deleteMany({ where: { id: { notIn: validItemIds } } }).catch(() => {
          });
        }
      }
    } catch (err) {
      console.error(`[Neon DB] Error saving resource ${normResource}:`, err);
    }
  }
  return normalizedList;
}
async function createDatabaseBackup(name = "Auto Snapshot") {
  const isConnected = await getDb();
  const backupData = {};
  const resources = ["customPages", "products", "collections", "orders", "files", "customers", "discounts", "blogs"];
  for (const r of resources) {
    backupData[r] = await fetchResource(r);
  }
  const backupId = `backup_${Date.now()}`;
  const totalCount = Object.values(backupData).reduce((sum2, arr) => sum2 + (Array.isArray(arr) ? arr.length : 0), 0);
  if (isConnected) {
    try {
      await ensureNeonTablesExist();
      await prisma.$executeRawUnsafe(
        `INSERT INTO "NeonBackup" ("id", "name", "timestamp", "resourceCount", "data") VALUES ($1, $2, NOW(), $3, $4::jsonb) ON CONFLICT ("id") DO UPDATE SET "data" = $4::jsonb`,
        backupId,
        name,
        totalCount,
        JSON.stringify(backupData)
      );
    } catch (err) {
      console.warn("[Neon Backup] Error storing backup in Neon PostgreSQL:", err);
    }
  }
  persistMemoryCacheToBackup();
  return { id: backupId, name, timestamp: (/* @__PURE__ */ new Date()).toISOString(), resourceCount: totalCount };
}
async function listDatabaseBackups() {
  const isConnected = await getDb();
  if (isConnected) {
    try {
      await ensureNeonTablesExist();
      const rows = await prisma.$queryRawUnsafe(`
        SELECT "id", "name", "timestamp", "resourceCount" FROM "NeonBackup" ORDER BY "timestamp" DESC LIMIT 20
      `);
      return rows || [];
    } catch (err) {
      console.warn("[Neon Backup] Error listing backups from Neon PostgreSQL:", err);
    }
  }
  return [];
}
async function restoreDatabaseBackup(backupId) {
  const isConnected = await getDb();
  if (!isConnected) return false;
  try {
    const rows = await prisma.$queryRawUnsafe(`
      SELECT "data" FROM "NeonBackup" WHERE "id" = $1 LIMIT 1
    `, backupId);
    if (rows && rows.length > 0 && rows[0].data) {
      const data = typeof rows[0].data === "string" ? JSON.parse(rows[0].data) : rows[0].data;
      for (const [resKey, items] of Object.entries(data)) {
        if (Array.isArray(items)) {
          await saveResource(resKey, items);
        }
      }
      return true;
    }
  } catch (err) {
    console.error("[Neon Backup] Error restoring backup from Neon PostgreSQL:", err);
  }
  return false;
}
async function fetchStoreSetting(id, defaultVal = null) {
  let settingsData = null;
  const isConnected = await getDb();
  if (isConnected) {
    try {
      const setting = await prisma.storeSetting.findUnique({
        where: { id }
      });
      if (setting && setting.data) {
        settingsData = setting.data;
      }
    } catch (err) {
      console.error(`[Neon DB] Error fetching store setting ${id}:`, err);
    }
  }
  if (!settingsData) {
    const filePath = path.join(process.cwd(), `${id}.json`);
    if (fs.existsSync(filePath)) {
      try {
        settingsData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch (e) {
      }
    }
  }
  return settingsData || defaultVal;
}
async function saveStoreSetting(id, data) {
  const filePath = path.join(process.cwd(), `${id}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
  }
  const isConnected = await getDb();
  if (isConnected) {
    try {
      await prisma.storeSetting.upsert({
        where: { id },
        update: { data },
        create: { id, data }
      });
    } catch (err) {
      console.error(`[Neon DB] Error saving store setting ${id}:`, err);
    }
  }
  return data;
}
async function fetchSingleItem(resource, id) {
  const normResource = normalizeResourceName(resource);
  const isConnected = await getDb();
  if (isConnected) {
    try {
      const record = await prisma.storeResource.findFirst({
        where: {
          resource: normResource,
          itemId: id
        }
      });
      if (record) return record.data;
    } catch (err) {
      console.error(`[Neon DB] Error fetching single item ${normResource}/${id}:`, err);
    }
  }
  const items = memoryCache[normResource] || memoryCache[resource] || [];
  return items.find((i) => i.id === id || i.slug === id) || null;
}
async function saveSingleItem(resource, item) {
  if (!item) return item;
  const normResource = normalizeResourceName(resource);
  const itemId = String(item.id || item.slug || item.orderId || `item-${Date.now()}-${Math.random()}`);
  const items = memoryCache[normResource] || memoryCache[resource] || [];
  if (normResource === "customPages" || normResource === "custompages" || normResource === "pages") {
    if (!item.sections || !Array.isArray(item.sections) || item.sections.length === 0) {
      const existing = items.find((i) => i.id === itemId || i.slug === itemId);
      if (existing && Array.isArray(existing.sections) && existing.sections.length > 0) {
        item = { ...item, sections: existing.sections };
      }
    }
  }
  const idx = items.findIndex((i) => i.id === itemId || i.slug === itemId);
  if (idx !== -1) {
    items[idx] = { ...item };
  } else {
    items.push({ ...item });
  }
  memoryCache[normResource] = items;
  persistMemoryCacheToBackup();
  const isConnected = await getDb();
  if (isConnected) {
    try {
      await prisma.storeResource.upsert({
        where: {
          resource_itemId: {
            resource: normResource,
            itemId
          }
        },
        update: { data: item },
        create: {
          resource: normResource,
          itemId,
          data: item
        }
      });
      await syncToPrismaModel(normResource, item).catch(
        (e) => console.error(
          `[Model Sync FAILED] ${normResource}/${itemId} \u2014 typed table is now stale:`,
          e?.message
        )
      );
    } catch (err) {
      console.error(`[Neon DB] Error saving single item ${normResource}/${itemId}:`, err);
    }
  }
  return item;
}
async function deleteSingleItem(resource, id) {
  if (!id) return false;
  const normResource = normalizeResourceName(resource);
  if (memoryCache[normResource]) {
    memoryCache[normResource] = memoryCache[normResource].filter((i) => String(i.id) !== String(id) && String(i.slug || "") !== String(id));
  }
  persistMemoryCacheToBackup();
  const isConnected = await getDb();
  if (isConnected) {
    try {
      await prisma.storeResource.deleteMany({
        where: {
          resource: normResource,
          itemId: id
        }
      });
      const norm = normResource.toLowerCase();
      if (norm === "orders") {
        await prisma.order.deleteMany({ where: { id } }).catch(() => {
        });
      } else if (norm === "products") {
        await prisma.product.deleteMany({ where: { id } }).catch(() => {
        });
      } else if (norm === "collections") {
        await prisma.collection.deleteMany({ where: { id } }).catch(() => {
        });
      } else if (norm === "customers") {
        await prisma.customer.deleteMany({ where: { id } }).catch(() => {
        });
      } else if (norm === "blogs") {
        await prisma.blogPost.deleteMany({ where: { id } }).catch(() => {
        });
      } else if (norm === "discounts") {
        await prisma.discount.deleteMany({ where: { id } }).catch(() => {
        });
      } else if (norm === "custompages" || norm === "pages") {
        await prisma.customPage.deleteMany({ where: { id } }).catch(() => {
        });
      }
    } catch (err) {
      console.error(`[Neon DB] Error deleting single item ${normResource}/${id}:`, err);
    }
  }
  return true;
}
async function saveUploadedImage(id, base64Data, mimeType) {
  memoryImages[id] = { base64Data, mimeType };
  const isConnected = await getDb();
  if (isConnected) {
    try {
      await prisma.storeResource.upsert({
        where: {
          resource_itemId: {
            resource: "uploaded_images",
            itemId: id
          }
        },
        update: { data: { id, base64Data, mimeType } },
        create: {
          resource: "uploaded_images",
          itemId: id,
          data: { id, base64Data, mimeType }
        }
      });
    } catch (e) {
      console.warn("[Neon DB] Failed to persist uploaded image:", e);
    }
  }
  return `/uploads/${id}`;
}
async function getUploadedImage(idOrFilename) {
  if (memoryImages[idOrFilename]) return memoryImages[idOrFilename];
  const dotIndex = idOrFilename.lastIndexOf(".");
  const idNoExt = dotIndex !== -1 ? idOrFilename.substring(0, dotIndex) : idOrFilename;
  if (memoryImages[idNoExt]) return memoryImages[idNoExt];
  const isConnected = await getDb();
  if (isConnected) {
    try {
      const record = await prisma.storeResource.findFirst({
        where: {
          resource: "uploaded_images",
          OR: [
            { itemId: idOrFilename },
            { itemId: idNoExt }
          ]
        }
      });
      if (record && record.data) {
        const data = record.data;
        const result = { base64Data: data.base64Data, mimeType: data.mimeType };
        memoryImages[idOrFilename] = result;
        memoryImages[idNoExt] = result;
        return result;
      }
    } catch (e) {
      console.warn("[Neon DB] Failed to retrieve uploaded image:", e);
    }
  }
  return null;
}
async function fetchLayoutSettings() {
  let settingsData = null;
  const isConnected = await getDb();
  if (isConnected) {
    try {
      const setting = await prisma.storeSetting.findUnique({
        where: { id: "layout_settings" }
      });
      if (setting && setting.data) {
        settingsData = setting.data;
      }
    } catch (err) {
      console.error("[Neon DB] Error fetching layout settings:", err);
    }
  }
  if (!settingsData) {
    const filePath = path.join(process.cwd(), "layout_settings.json");
    if (fs.existsSync(filePath)) {
      try {
        settingsData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch (e) {
      }
    }
  }
  if (!settingsData) {
    settingsData = {
      id: "layout_settings",
      headerLogoText: "POUCH SUPPLY",
      headerLogoSubtext: "Premium Nicotine",
      headerLogoImage: "",
      footerLogoText: "POUCH SUPPLY",
      footerLogoDescription: "Leading premium directory for tobacco-free nicotine slim white canisters.",
      footerLogoImage: "",
      menuItems: [
        { id: "1", label: "Home", tab: "frontend-home", type: "tab" },
        { id: "2", label: "Subscribe", tab: "frontend-subscribe", type: "tab" },
        { id: "3", label: "Shop Now", tab: "frontend-shop", type: "tab" },
        { id: "4", label: "All Brands", tab: "frontend-brands", type: "tab" },
        { id: "5", label: "About", tab: "about", type: "tab" }
      ]
    };
  }
  if (settingsData.cloudinaryCloudName && !process.env.CLOUDINARY_CLOUD_NAME) {
    process.env.CLOUDINARY_CLOUD_NAME = settingsData.cloudinaryCloudName;
  }
  if (settingsData.cloudinaryApiKey && !process.env.CLOUDINARY_API_KEY) {
    process.env.CLOUDINARY_API_KEY = settingsData.cloudinaryApiKey;
  }
  if (settingsData.cloudinaryApiSecret && !process.env.CLOUDINARY_API_SECRET) {
    process.env.CLOUDINARY_API_SECRET = settingsData.cloudinaryApiSecret;
  }
  return settingsData;
}
async function saveLayoutSettings(settings) {
  if (settings.cloudinaryCloudName !== void 0) {
    process.env.CLOUDINARY_CLOUD_NAME = settings.cloudinaryCloudName || "";
  }
  if (settings.cloudinaryApiKey !== void 0) {
    process.env.CLOUDINARY_API_KEY = settings.cloudinaryApiKey || "";
  }
  if (settings.cloudinaryApiSecret !== void 0) {
    process.env.CLOUDINARY_API_SECRET = settings.cloudinaryApiSecret || "";
  }
  const filePath = path.join(process.cwd(), "layout_settings.json");
  try {
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), "utf-8");
  } catch (e) {
  }
  const isConnected = await getDb();
  if (isConnected) {
    try {
      await prisma.storeSetting.upsert({
        where: { id: "layout_settings" },
        update: { data: settings },
        create: { id: "layout_settings", data: settings }
      });
    } catch (err) {
      console.error("[Neon DB] Error saving layout settings:", err);
    }
  }
  return settings;
}
async function fetchDevSettings() {
  let settingsData = null;
  const isConnected = await getDb();
  if (isConnected) {
    try {
      const setting = await prisma.storeSetting.findUnique({
        where: { id: "dev_settings" }
      });
      if (setting && setting.data) {
        settingsData = setting.data;
      }
    } catch (err) {
      console.error("[Neon DB] Error fetching dev settings:", err);
    }
  }
  if (!settingsData) {
    const filePath = path.join(process.cwd(), "dev_settings.json");
    if (fs.existsSync(filePath)) {
      try {
        settingsData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch (e) {
      }
    }
  }
  if (!settingsData) {
    settingsData = DEFAULT_DEV_SETTINGS;
  }
  return settingsData;
}
async function saveDevSettings(settings) {
  const filePath = path.join(process.cwd(), "dev_settings.json");
  try {
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), "utf-8");
  } catch (e) {
  }
  const isConnected = await getDb();
  if (isConnected) {
    try {
      await prisma.storeSetting.upsert({
        where: { id: "dev_settings" },
        update: { data: settings },
        create: { id: "dev_settings", data: settings }
      });
    } catch (err) {
      console.error("[Neon DB] Error saving dev settings:", err);
    }
  }
  return settings;
}
var memoryCache, BACKUP_FILE_PATH, isTablesInitialized, LIST_SAVE_NEVER_DELETES, memoryImages;
var init_serverDb = __esm({
  "serverDb.ts"() {
    init_prisma();
    init_initialData();
    init_initialDevSettings();
    dotenv.config();
    memoryCache = {
      products: [...INITIAL_PRODUCTS],
      collections: [...INITIAL_COLLECTIONS],
      orders: [...INITIAL_ORDERS],
      files: [...INITIAL_FILES],
      customers: [...INITIAL_CUSTOMERS],
      discounts: [...INITIAL_DISCOUNTS],
      customPages: [...DEFAULT_PAGES],
      blogs: [...INITIAL_BLOGS]
    };
    BACKUP_FILE_PATH = process.env.LOCAL_STORE_PATH ? path.resolve(process.env.LOCAL_STORE_PATH) : path.join(process.cwd(), "local_store_data.json");
    loadMemoryCacheFromBackup();
    isTablesInitialized = false;
    ensureNeonTablesExist().then(() => {
      hydrateMemoryCacheFromDatabase().catch(() => {
      });
    }).catch(() => {
    });
    LIST_SAVE_NEVER_DELETES = /* @__PURE__ */ new Set(["orders", "customers", "subscriptions", "pending_checkouts", "email_logs", "klaviyo_logs"]);
    memoryImages = {};
  }
});

// backend/services/cloudinary.ts
var cloudinary_exports = {};
__export(cloudinary_exports, {
  buildOptimizedCloudinaryUrl: () => buildOptimizedCloudinaryUrl,
  deleteFromCloudinary: () => deleteFromCloudinary,
  getCloudinaryClient: () => getCloudinaryClient,
  isCloudinaryConfigured: () => isCloudinaryConfigured,
  uploadToCloudinary: () => uploadToCloudinary
});
import { v2 as cloudinary } from "cloudinary";
function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
  );
}
function getCloudinaryClient() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });
  }
  return cloudinary;
}
async function uploadToCloudinary(fileBufferOrDataUri, options = {}) {
  const client = getCloudinaryClient();
  const folder = options.folder || "storefront_media";
  const resourceType = options.resourceType || "auto";
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing.");
  }
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true
    };
    if (options.publicId) {
      uploadOptions.public_id = options.publicId;
    }
    if (options.originalFilename) {
      uploadOptions.context = { original_filename: options.originalFilename };
    }
    if (Buffer.isBuffer(fileBufferOrDataUri)) {
      const uploadStream = client.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error("Upload to Cloudinary failed without error result."));
          }
          resolve({
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            resourceType: result.resource_type,
            format: result.format || "bin",
            width: result.width,
            height: result.height,
            fileSize: result.bytes,
            folder: result.folder || folder,
            originalFilename: options.originalFilename || result.original_filename || result.public_id,
            createdAt: result.created_at || (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      );
      uploadStream.end(fileBufferOrDataUri);
    } else {
      client.uploader.upload(fileBufferOrDataUri, uploadOptions, (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Upload to Cloudinary failed without error result."));
        }
        resolve({
          publicId: result.public_id,
          url: result.url,
          secureUrl: result.secure_url,
          resourceType: result.resource_type,
          format: result.format || "bin",
          width: result.width,
          height: result.height,
          fileSize: result.bytes,
          folder: result.folder || folder,
          originalFilename: options.originalFilename || result.original_filename || result.public_id,
          createdAt: result.created_at || (/* @__PURE__ */ new Date()).toISOString()
        });
      });
    }
  });
}
async function deleteFromCloudinary(publicId, resourceType = "image") {
  if (!isCloudinaryConfigured()) return false;
  try {
    const client = getCloudinaryClient();
    const result = await client.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true
    });
    return result.result === "ok" || result.result === "not found";
  } catch (err) {
    console.error(`[Cloudinary] Delete error for publicId ${publicId}:`, err);
    return false;
  }
}
function buildOptimizedCloudinaryUrl(publicIdOrUrl, transformations = {}) {
  if (!publicIdOrUrl) return "";
  if (!publicIdOrUrl.includes("res.cloudinary.com")) {
    return publicIdOrUrl;
  }
  const { width, height, crop = "limit", quality = "auto", format = "auto", gravity } = transformations;
  const parts = [];
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if (crop) parts.push(`c_${crop}`);
  if (gravity) parts.push(`g_${gravity}`);
  if (quality) parts.push(`q_${quality}`);
  if (format) parts.push(`f_${format}`);
  const transformString = parts.join(",");
  if (publicIdOrUrl.includes("/upload/")) {
    const [base, rest] = publicIdOrUrl.split("/upload/");
    if (rest.startsWith("w_") || rest.startsWith("c_") || rest.startsWith("q_") || rest.startsWith("f_")) {
      return publicIdOrUrl;
    }
    return `${base}/upload/${transformString}/${rest}`;
  }
  return publicIdOrUrl;
}
var init_cloudinary = __esm({
  "backend/services/cloudinary.ts"() {
  }
});

// backend/services/adminAuth.ts
import crypto from "crypto";
function getSigningSecret() {
  const secret = process.env.AUTH_SECRET || process.env.ADMIN_TOKEN_SECRET || "";
  if (!secret || secret.trim().length < 16) {
    throw new AdminAuthNotConfiguredError(
      "AUTH_SECRET is not set (or is shorter than 16 characters). Admin authentication is disabled until it is configured."
    );
  }
  return secret;
}
function sign(data, secret) {
  return b64url(crypto.createHmac("sha256", secret).update(data).digest());
}
function signToken(subject, scope, ttlSeconds) {
  const secret = getSigningSecret();
  const now = Math.floor(Date.now() / 1e3);
  const payload = { sub: subject, scope, iat: now, exp: now + ttlSeconds };
  const body = `${TOKEN_VERSION}.${b64url(JSON.stringify(payload))}`;
  return `${body}.${sign(body, secret)}`;
}
function signAdminToken(subject, ttlSeconds = ADMIN_TTL_SECONDS) {
  return signToken(subject, "admin", ttlSeconds);
}
function signCustomerToken(email, ttlSeconds = CUSTOMER_TTL_SECONDS) {
  return signToken(String(email).trim().toLowerCase(), "customer", ttlSeconds);
}
function verifyToken(token, expectedScope) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [version, payloadPart, signaturePart] = parts;
  if (version !== TOKEN_VERSION) return null;
  const secret = getSigningSecret();
  const expected = sign(`${version}.${payloadPart}`, secret);
  const givenBuf = Buffer.from(signaturePart);
  const expectedBuf = Buffer.from(expected);
  if (givenBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(givenBuf, expectedBuf)) return null;
  let payload;
  try {
    payload = JSON.parse(b64urlDecode(payloadPart).toString("utf8"));
  } catch {
    return null;
  }
  if (!payload || typeof payload.exp !== "number" || typeof payload.sub !== "string") return null;
  if (Math.floor(Date.now() / 1e3) >= payload.exp) return null;
  if (payload.scope !== expectedScope) return null;
  return payload;
}
function verifyAdminToken(token) {
  return verifyToken(token, "admin");
}
function verifyCustomerToken(token) {
  return verifyToken(token, "customer");
}
function verifyAdminCredentials(email, password) {
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  if (!adminEmail || !adminPassword) {
    throw new AdminAuthNotConfiguredError(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set for admin login to work."
    );
  }
  const emailOk = String(email || "").trim().toLowerCase() === adminEmail.toLowerCase();
  const given = crypto.createHash("sha256").update(String(password || "")).digest();
  const expectedHash = crypto.createHash("sha256").update(adminPassword).digest();
  const passwordOk = crypto.timingSafeEqual(given, expectedHash);
  return emailOk && passwordOk;
}
var TOKEN_VERSION, ADMIN_TTL_SECONDS, CUSTOMER_TTL_SECONDS, AdminAuthNotConfiguredError, b64url, b64urlDecode;
var init_adminAuth = __esm({
  "backend/services/adminAuth.ts"() {
    TOKEN_VERSION = "v1";
    ADMIN_TTL_SECONDS = 8 * 60 * 60;
    CUSTOMER_TTL_SECONDS = 30 * 24 * 60 * 60;
    AdminAuthNotConfiguredError = class extends Error {
      constructor(message) {
        super(message);
        this.name = "AdminAuthNotConfiguredError";
      }
    };
    b64url = (input) => Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    b64urlDecode = (input) => Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  }
});

// backend/middleware/requireAdmin.ts
import crypto2 from "crypto";
function bearer(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}
function requireCustomer(req, res, next) {
  const token = bearer(req);
  let customer;
  let admin;
  try {
    customer = verifyCustomerToken(token);
    admin = customer ? null : verifyAdminToken(token);
  } catch (err) {
    if (err instanceof AdminAuthNotConfiguredError) {
      console.error("[Customer Auth] Refusing request:", err.message);
      return res.status(503).json({
        error: "Authentication is not configured on this server.",
        code: "AUTH_NOT_CONFIGURED"
      });
    }
    throw err;
  }
  if (customer) {
    req.customer = { email: customer.sub };
    return next();
  }
  if (admin) {
    req.admin = { email: admin.sub };
    return next();
  }
  return res.status(401).json({
    error: "You must be signed in to do this.",
    code: "CUSTOMER_AUTH_REQUIRED"
  });
}
function mayActOnCustomer(req, email) {
  if (req.admin) return true;
  const target = String(email || "").trim().toLowerCase();
  if (!target) return false;
  return req.customer?.email === target;
}
function requireAdmin(req, res, next) {
  const token = bearer(req);
  let payload;
  try {
    payload = verifyAdminToken(token);
  } catch (err) {
    if (err instanceof AdminAuthNotConfiguredError) {
      console.error("[Admin Auth] Refusing admin request:", err.message);
      return res.status(503).json({
        error: "Admin authentication is not configured on this server.",
        code: "ADMIN_AUTH_NOT_CONFIGURED"
      });
    }
    throw err;
  }
  if (!payload) {
    return res.status(401).json({
      error: "Administrator authentication required.",
      code: "ADMIN_AUTH_REQUIRED"
    });
  }
  req.admin = { email: payload.sub };
  next();
}
function requireCronOrAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const presented = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const cronSecret = process.env.CRON_SECRET || "";
  if (cronSecret && presented) {
    const a = Buffer.from(presented);
    const b = Buffer.from(cronSecret);
    if (a.length === b.length && crypto2.timingSafeEqual(a, b)) return next();
  }
  try {
    if (verifyAdminToken(presented)) return next();
  } catch (err) {
    if (!(err instanceof AdminAuthNotConfiguredError)) throw err;
  }
  if (!cronSecret) {
    console.error("[Cron Auth] CRON_SECRET is not set \u2014 refusing scheduled job request.");
    return res.status(503).json({
      error: "Scheduled job authentication is not configured on this server.",
      code: "CRON_SECRET_NOT_CONFIGURED"
    });
  }
  return res.status(401).json({
    error: "Scheduled job authentication required.",
    code: "CRON_AUTH_REQUIRED"
  });
}
var init_requireAdmin = __esm({
  "backend/middleware/requireAdmin.ts"() {
    init_adminAuth();
  }
});

// backend/services/emailTemplates.ts
function resolveEmailLogoSrc(raw) {
  const url = (raw || "").trim();
  if (!url) return "";
  if (/^data:/i.test(url)) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${EMAIL_ASSET_BASE_URL}/${url.replace(/^\/+/, "")}`;
}
function renderBaseHeader(title, subtitle, data) {
  const logoUrl = resolveEmailLogoSrc(data?.headerLogoImage || data?.logoUrl);
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${BRAND_BG}; color: #334155; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 24px; margin-bottom: 24px; border: 1px solid #e2e8f0; }
      .header { background-color: ${BRAND_HEADER_BG}; padding: 24px 20px; text-align: center; color: #071d37; border-bottom: 1px solid #e2e8f0; }
      .title-box { padding: 24px 24px 12px 24px; text-align: center; }
      .heading { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; }
      .subheading { font-size: 14px; color: #64748b; margin: 0; leading: 1.5; }
      .body-content { padding: 0 24px 24px 24px; }
      .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
      .btn { display: inline-block; background-color: ${BRAND_PRIMARY}; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px; margin-top: 12px; margin-bottom: 12px; }
      .footer { background-color: #0f172a; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; }
      .footer a { color: #00e599; text-decoration: none; }
      .item-table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 16px; }
      .item-table th { text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b; border-b: 1px solid #e2e8f0; padding-bottom: 8px; }
      .item-table td { padding: 12px 0; border-b: 1px solid #f1f5f9; font-size: 13px; }
      .total-row { font-weight: 700; font-size: 15px; color: #0f172a; }
      .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
      .badge-success { background-color: #dcfce7; color: #166534; }
      .badge-info { background-color: #e0f2fe; color: #0369a1; }
      .badge-warning { background-color: #fef3c7; color: #92400e; }
      .badge-danger { background-color: #fee2e2; color: #991b1b; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        ${logoUrl ? `
          <img src="${logoUrl}" alt="${BRAND_NAME}" style="max-height: 52px; max-width: 240px; object-fit: contain; margin: 0 auto; display: block;" />
        ` : `
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
            <tr>
              <td style="vertical-align: middle; padding-right: 10px;">
                <div style="width: 38px; height: 38px; background: #008060; border-radius: 10px; text-align: center; line-height: 38px;">
                  <span style="color: #ffffff; font-weight: 900; font-size: 18px; font-family: sans-serif;">P</span>
                </div>
              </td>
              <td style="vertical-align: middle; text-align: left;">
                <div style="font-size: 20px; font-weight: 900; letter-spacing: 1px; color: #071d37; text-transform: uppercase; line-height: 1.1;">POUCH SUPPLY</div>
                <div style="font-size: 10px; font-weight: 700; color: #008060; letter-spacing: 2px; text-transform: uppercase;">PREMIUM CANISTERS</div>
              </td>
            </tr>
          </table>
        `}
      </div>
      <div class="title-box">
        <h1 class="heading">${title}</h1>
        ${subtitle ? `<p class="subheading">${subtitle}</p>` : ""}
      </div>
      <div class="body-content">
  `;
}
function renderBaseFooter() {
  return `
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px 0; font-weight: 700; color: #ffffff;">${BRAND_NAME}</p>
        <p style="margin: 0 0 12px 0;">UK-Licensed Laboratory Pouch Compounding Facility</p>
        <p style="margin: 0;">Need support? Email us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
        <p style="margin-top: 16px; font-size: 10px; color: #64748b;">\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}
function renderOrderItemsTable(data) {
  if (!data.items || data.items.length === 0) {
    return `<p style="font-size: 13px; color: #64748b;">No items detailed.</p>`;
  }
  const itemsHtml = data.items.map((item) => {
    const lineTotal = (item.price || 0) * (item.quantity || 1);
    const isReward = Boolean(item.isRewardItem);
    const detailBits = [`Qty: ${item.quantity || 1}`];
    if (item.variant && item.variant !== "Standard") detailBits.push(String(item.variant));
    if (item.vendor) detailBits.unshift(String(item.vendor));
    return `
    <tr>
      <td style="width: 60%; font-weight: 600; color: #1e293b;">
        ${item.productTitle || "Nicotine Canister Pack"}
        ${isReward ? `<div style="font-size: 10px; color: #166534; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;">Loyalty reward \u2014 included free</div>` : ""}
        <div style="font-size: 11px; color: #64748b; font-weight: normal;">${detailBits.join(" \xB7 ")}</div>
      </td>
      <td style="width: 40%; text-align: right; font-weight: 700; color: ${isReward ? "#166534" : "#0f172a"};">
        ${isReward || lineTotal === 0 ? "FREE" : `\xA3${lineTotal.toFixed(2)}`}
      </td>
    </tr>
  `;
  }).join("");
  const total = data.total !== void 0 ? data.total : 0;
  const delivery = data.deliveryCost !== void 0 ? data.deliveryCost : total >= 40 ? 0 : 2.99;
  const subtotal = data.subtotal !== void 0 ? data.subtotal : Math.max(0, total - delivery);
  return `
    <table class="item-table">
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div style="background-color: #f8fafc; border-radius: 8px; padding: 12px 16px; margin-top: 12px;">
      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #64748b;">
        <span>Subtotal</span>
        <span style="font-weight: 600; color: #334155;">\xA3${subtotal.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #64748b;">
        <span>Royal Mail Delivery</span>
        <span style="font-weight: 600; color: #334155;">${delivery === 0 ? "FREE" : `\xA3${delivery.toFixed(2)}`}</span>
      </div>
      ${data.discountAmount ? `
      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #166534;">
        <span>Discount</span>
        <span style="font-weight: 700;">-\xA3${data.discountAmount.toFixed(2)}</span>
      </div>
      ` : ""}
      <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; color: #0f172a; border-top: 1px solid #e2e8f0; pt: 8px; margin-top: 8px;">
        <span>Total Paid</span>
        <span style="color: ${BRAND_PRIMARY};">\xA3${total.toFixed(2)} GBP</span>
      </div>
    </div>
  `;
}
function renderOrderConfirmationTemplate(data) {
  const name = data.customerName || "Valued Customer";
  const orderId = data.orderId || "PS10001";
  return renderBaseHeader(`Order Confirmation #${orderId}`, `Thank you for your order, ${name}!`, data) + `
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <span style="font-size: 12px; color: #64748b; font-weight: 700;">ORDER REFERENCE</span>
          <div style="font-size: 16px; font-weight: 900; color: #0f172a;">${orderId}</div>
        </div>
        <div>
          <span class="badge badge-success">Payment Confirmed</span>
        </div>
      </div>
      <p style="font-size: 13px; color: #475569; margin: 0;">
        Your nicotine pouch order has been received and sent to our compounding lab for priority dispatch.
      </p>
    </div>

    <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 20px; margin-bottom: 8px;">Order Summary</h3>
    ${renderOrderItemsTable(data)}

    <div class="card" style="margin-top: 20px;">
      <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; color: #475569;">Delivery Address</h4>
      <p style="margin: 0; font-size: 13px; color: #1e293b; font-weight: 600;">
        ${data.destination || "United Kingdom"}
      </p>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">
        Method: ${data.deliveryMethod || "Royal Mail Tracked 24/48"}
      </p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${data.siteUrl || "#"}" class="btn">View Order Status</a>
    </div>
  ` + renderBaseFooter();
}
function renderOrderProcessingTemplate(data) {
  const name = data.customerName || "Valued Customer";
  const orderId = data.orderId || "PS10001";
  return renderBaseHeader(`Order Processing #${orderId}`, `We are packing your canisters, ${name}!`, data) + `
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <span style="font-size: 12px; color: #64748b; font-weight: 700;">ORDER REFERENCE</span>
          <div style="font-size: 16px; font-weight: 900; color: #0f172a;">${orderId}</div>
        </div>
        <div>
          <span class="badge badge-info">Processing</span>
        </div>
      </div>
      <p style="font-size: 13px; color: #475569; margin: 0;">
        Great news! Your canisters are being verified, sealed, and prepared for carrier pickup.
      </p>
    </div>

    ${renderOrderItemsTable(data)}

    <div style="text-align: center; margin-top: 24px;">
      <a href="${data.siteUrl || "#"}" class="btn">Track Order</a>
    </div>
  ` + renderBaseFooter();
}
function renderOrderShippedTemplate(data) {
  const name = data.customerName || "Valued Customer";
  const orderId = data.orderId || "PS10001";
  const tracking = data.trackingNumber || "";
  const carrier = data.carrier || "Royal Mail";
  const trackingBlock = tracking ? `
    <div class="card" style="background-color: #f0fdf4; border-color: #bbf7d0;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <span style="font-size: 12px; color: #166534; font-weight: 700;">TRACKING NUMBER</span>
          <div style="font-size: 18px; font-weight: 900; color: #14532d; font-family: monospace;">${tracking}</div>
        </div>
        <div>
          <span class="badge badge-success">Shipped</span>
        </div>
      </div>
      <p style="font-size: 13px; color: #15803d; margin: 0;">
        Carrier: <strong>${carrier}</strong>
      </p>
    </div>` : `
    <div class="card" style="background-color: #f0fdf4; border-color: #bbf7d0;">
      <span class="badge badge-success" style="margin-bottom: 8px;">Shipped</span>
      <p style="font-size: 13px; color: #15803d; margin: 0;">
        Sent by <strong>${carrier}</strong>. This service does not include parcel tracking.
      </p>
    </div>`;
  const trackButton = tracking ? `
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://www.royalmail.com/track-your-item#/${tracking}" class="btn">Track Package</a>
    </div>` : "";
  return renderBaseHeader(`Order Dispatched #${orderId}`, `Your package is on its way, ${name}!`, data) + `
    ${trackingBlock}

    ${renderOrderItemsTable(data)}

    ${trackButton}
  ` + renderBaseFooter();
}
function renderOutForDeliveryTemplate(data) {
  const name = data.customerName || "Valued Customer";
  const orderId = data.orderId || "PS10001";
  return renderBaseHeader(`Out for Delivery #${orderId}`, `Arriving today, ${name}!`, data) + `
    <div class="card" style="background-color: #f0f9ff; border-color: #bae6fd;">
      <span class="badge badge-info" style="margin-bottom: 8px;">Out for Delivery</span>
      <p style="font-size: 14px; color: #0369a1; font-weight: 700; margin: 0 0 6px 0;">
        Your courier has your package on the delivery vehicle today!
      </p>
      ${data.trackingNumber ? `<p style="font-size: 12px; color: #0284c7; margin: 0;">
        Tracking Ref: <strong>${data.trackingNumber}</strong>
      </p>` : ""}
    </div>

    ${renderOrderItemsTable(data)}
  ` + renderBaseFooter();
}
function renderDeliveredTemplate(data) {
  const name = data.customerName || "Valued Customer";
  const orderId = data.orderId || "PS10001";
  return renderBaseHeader(`Order Delivered #${orderId}`, `Enjoy your pouch supply, ${name}!`, data) + `
    <div class="card" style="background-color: #f0fdf4; border-color: #bbf7d0; text-align: center;">
      <span class="badge badge-success" style="margin-bottom: 8px;">Delivered</span>
      <p style="font-size: 15px; color: #166534; font-weight: 800; margin: 0 0 6px 0;">
        Your order has been safely delivered!
      </p>
      <p style="font-size: 12px; color: #15803d; margin: 0;">
        Delivered to address: ${data.destination || "United Kingdom"}
      </p>
    </div>

    <p style="font-size: 13px; color: #475569; text-align: center;">
      We hope you enjoy your nicotine canisters. Have feedback or need help? Reply to this email!
    </p>

    <div style="text-align: center; margin-top: 20px;">
      <a href="${data.siteUrl || "#"}" class="btn">Shop Again</a>
    </div>
  ` + renderBaseFooter();
}
function renderSubscriptionPriceChangeTemplate(data) {
  const name = data.customerName || "Valued Customer";
  const plan = data.planName || "your plan";
  const previous = Number(data.previousAmount) || 0;
  const next = Number(data.newAmount) || 0;
  const isIncrease = next > previous;
  const every = data.billingInterval ? ` (${data.billingInterval})` : "";
  const effective = (() => {
    const d = data.effectiveFrom ? new Date(data.effectiveFrom) : null;
    if (!d || isNaN(d.getTime())) return "your next renewal";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  })();
  const headline = isIncrease ? `The price of ${plan} is going up` : `Good news \u2014 ${plan} is getting cheaper`;
  return renderBaseHeader("Your subscription price is changing", headline, data) + `
    <div class="card">
      <p style="font-size: 14px; color: #0f172a; font-weight: 700; margin: 0 0 12px 0;">
        Hi ${name},
      </p>
      <p style="font-size: 13px; color: #475569; margin: 0 0 16px 0;">
        We're letting you know that the price of your subscription is changing.
        You don't need to do anything \u2014 your deliveries continue as normal.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0 0 16px 0;">
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: #64748b;">Your plan</td>
          <td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 800; text-align: right;">${plan}${every}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0;">Current price</td>
          <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 700; text-align: right; border-top: 1px solid #e2e8f0; text-decoration: line-through;">\xA3${previous.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 800; border-top: 1px solid #e2e8f0;">New price</td>
          <td style="padding: 8px 0; font-size: 16px; color: ${isIncrease ? "#b91c1c" : "#15803d"}; font-weight: 900; text-align: right; border-top: 1px solid #e2e8f0;">\xA3${next.toFixed(2)}</td>
        </tr>
      </table>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
        <p style="font-size: 13px; color: #0f172a; margin: 0; font-weight: 700;">
          From ${effective}, your next recurring payment will be \xA3${next.toFixed(2)}.
        </p>
        <p style="font-size: 12px; color: #64748b; margin: 6px 0 0 0;">
          Any delivery before that date is charged at your current price of \xA3${previous.toFixed(2)}.
        </p>
      </div>
    </div>

    <p style="font-size: 13px; color: #475569; text-align: center;">
      Happy with the change? There's nothing to do. If you'd rather adjust or cancel your plan,
      you can do that any time from your account before ${effective}.
    </p>

    <div style="text-align: center; margin-top: 20px;">
      <a href="${data.siteUrl || "#"}/pages/account/subscriptions" class="btn">Manage My Subscription</a>
    </div>
  ` + renderBaseFooter();
}
function renderOrderCancelledTemplate(data) {
  const name = data.customerName || "Valued Customer";
  const orderId = data.orderId || "PS10001";
  return renderBaseHeader(`Order Cancelled #${orderId}`, `Notice regarding your order`, data) + `
    <div class="card" style="background-color: #fef2f2; border-color: #fecaca;">
      <span class="badge badge-danger" style="margin-bottom: 8px;">Cancelled</span>
      <p style="font-size: 13px; color: #991b1b; font-weight: 600; margin: 0 0 4px 0;">
        Your order #${orderId} has been cancelled.
      </p>
      ${data.cancellationReason ? `<p style="font-size: 12px; color: #b91c1c; margin: 0;">Reason: ${data.cancellationReason}</p>` : ""}
    </div>

    <p style="font-size: 13px; color: #475569;">
      If any payment was processed, a full refund has been initiated back to your original payment method.
    </p>
  ` + renderBaseFooter();
}
function renderOrderRefundedTemplate(data) {
  const name = data.customerName || "Valued Customer";
  const orderId = data.orderId || "PS10001";
  const refundAmount = data.refundAmount !== void 0 ? data.refundAmount : data.total || 0;
  return renderBaseHeader(`Refund Processed #${orderId}`, `Refund confirmation for ${name}`, data) + `
    <div class="card" style="background-color: #f0fdf4; border-color: #bbf7d0;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 12px; color: #166534; font-weight: 700;">REFUND AMOUNT</span>
          <div style="font-size: 20px; font-weight: 900; color: #14532d;">\xA3${refundAmount.toFixed(2)} GBP</div>
        </div>
        <div>
          <span class="badge badge-success">Refunded</span>
        </div>
      </div>
      ${data.refundReason ? `<p style="font-size: 12px; color: #15803d; margin-top: 8px;">Reason: ${data.refundReason}</p>` : ""}
    </div>

    <p style="font-size: 13px; color: #475569;">
      The refund has been issued to your payment card. It typically takes 2\u20135 business days to appear on your bank statement.
    </p>
  ` + renderBaseFooter();
}
function renderOrderExchangedTemplate(data) {
  const name = data.customerName || "Valued Customer";
  const orderId = data.orderId || "PS10001";
  return renderBaseHeader(`Order Exchange Processed #${orderId}`, `Exchange confirmation for ${name}`, data) + `
    <div class="card" style="background-color: #f0f9ff; border-color: #bae6fd;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 12px; color: #0369a1; font-weight: 700;">EXCHANGE CONFIRMED</span>
          <div style="font-size: 16px; font-weight: 900; color: #0c4a6e;">Order #${orderId} Exchanged</div>
        </div>
        <div>
          <span class="badge badge-info">Exchanged</span>
        </div>
      </div>
      ${data.refundReason ? `<p style="font-size: 12px; color: #0284c7; margin-top: 8px;">Exchange Details: ${data.refundReason}</p>` : ""}
    </div>

    <h3 style="font-size: 13px; text-transform: uppercase; color: #64748b; margin-top: 16px;">Exchanged Items</h3>
    ${renderOrderItemsTable(data)}

    <p style="font-size: 13px; color: #475569; margin-top: 16px;">
      Your exchange request has been processed and your replacement items are being prepared for dispatch with priority courier delivery.
    </p>
  ` + renderBaseFooter();
}
function renderPasswordResetTemplate(data) {
  const name = data.customerName || "Customer";
  const resetLink = data.resetLink || `${data.siteUrl || "#"}`;
  const token = data.resetToken || "";
  return renderBaseHeader(`Reset Your Password`, `Security request for ${name}`, data) + `
    <div class="card" style="text-align: center;">
      <p style="font-size: 13px; color: #334155; margin: 0 0 12px 0;">
        We received a request to reset the password for your account associated with <strong>${data.customerEmail || ""}</strong>.
      </p>

      ${token ? `
      <div style="background-color: #0f172a; color: ${BRAND_ACCENT}; font-size: 22px; font-weight: 900; letter-spacing: 4px; padding: 14px; border-radius: 8px; font-family: monospace; display: inline-block; margin: 12px 0;">
        ${token}
      </div>
      <p style="font-size: 12px; color: #64748b; margin: 0 0 12px 0;">Your Reset Code / Token</p>
      ` : ""}

      <p style="font-size: 12px; color: #64748b; margin: 0;">
        You can also click the button below to reset your password directly on our storefront.
      </p>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${resetLink}" class="btn">Reset Password Now</a>
    </div>

    <p style="font-size: 11px; color: #94a3b8; text-align: center;">
      This link/code will expire in 1 hour for your security.
    </p>
  ` + renderBaseFooter();
}
function renderEmailVerificationTemplate(data) {
  const name = data.customerName || "Customer";
  const code = data.verificationCode || "849201";
  return renderBaseHeader(`Verify Your Email`, `Welcome to ${BRAND_NAME}, ${name}!`, data) + `
    <div class="card" style="text-align: center;">
      <p style="font-size: 13px; color: #475569; margin: 0 0 16px 0;">
        Please verify your email address to complete your account setup and access member-only canister pricing.
      </p>
      
      <div style="background-color: #0f172a; color: ${BRAND_ACCENT}; font-size: 28px; font-weight: 900; letter-spacing: 6px; padding: 16px; border-radius: 8px; font-family: monospace; display: inline-block;">
        ${code}
      </div>

      <p style="font-size: 12px; color: #64748b; margin-top: 16px;">
        Enter this 6-digit verification code on the account verification page.
      </p>
    </div>
  ` + renderBaseFooter();
}
function renderWelcomeTemplate(data) {
  const name = data.customerName || "Friend";
  const code = data.discountCode || "WELCOME10";
  return renderBaseHeader(`Welcome to ${BRAND_NAME}!`, `Your laboratory pouch subscription begins here`, data) + `
    <div class="card" style="background-color: #f8fafc; text-align: center; padding: 24px;">
      <p style="font-size: 14px; color: #1e293b; font-weight: 600; margin: 0 0 12px 0;">
        Welcome to the UK's premier nicotine canister compounding standard.
      </p>
      <p style="font-size: 13px; color: #64748b; margin: 0 0 20px 0;">
        As a welcome gift, take <strong>10% OFF</strong> your first order with your personal code:
      </p>

      <div style="border: 2px dashed ${BRAND_PRIMARY}; background-color: #ffffff; padding: 12px; border-radius: 8px; font-size: 20px; font-weight: 900; color: ${BRAND_PRIMARY}; letter-spacing: 2px; font-family: monospace; display: inline-block;">
        ${code}
      </div>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${data.siteUrl || "#"}" class="btn">Explore Canisters</a>
    </div>
  ` + renderBaseFooter();
}
function renderAdminNewOrderTemplate(data) {
  const orderId = data.orderId || "PS10001";
  const name = data.customerName || "Customer";
  const total = data.total !== void 0 ? data.total : 0;
  return renderBaseHeader(`\u{1F6A8} New Order #${orderId}`, `Storefront Sale Alert: \xA3${total.toFixed(2)} GBP`, data) + `
    <div class="card" style="background-color: #f0fdf4; border-color: #bbf7d0;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 11px; color: #166534; font-weight: 800; text-transform: uppercase;">CUSTOMER</span>
          <div style="font-size: 15px; font-weight: 800; color: #14532d;">${name}</div>
          <div style="font-size: 12px; color: #15803d;">${data.customerEmail || "No email"}</div>
        </div>
        <div>
          <span class="badge badge-success">\xA3${total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <h3 style="font-size: 13px; text-transform: uppercase; color: #64748b; margin-top: 16px;">Order Items</h3>
    ${renderOrderItemsTable(data)}

    <div class="card" style="margin-top: 16px;">
      <h4 style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; color: #475569;">Destination Address</h4>
      <p style="margin: 0; font-size: 12px; color: #1e293b; font-weight: 600;">
        ${data.destination || "United Kingdom"}
      </p>
    </div>
  ` + renderBaseFooter();
}
var BRAND_NAME, BRAND_HEADER_BG, BRAND_PRIMARY, BRAND_ACCENT, BRAND_BG, SUPPORT_EMAIL, EMAIL_ASSET_BASE_URL;
var init_emailTemplates = __esm({
  "backend/services/emailTemplates.ts"() {
    BRAND_NAME = "Pouch Supply Co.";
    BRAND_HEADER_BG = "#e7e7e7";
    BRAND_PRIMARY = "#071d37";
    BRAND_ACCENT = "#008060";
    BRAND_BG = "#f8fafc";
    SUPPORT_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "support@pouch-supply.com";
    EMAIL_ASSET_BASE_URL = (process.env.EMAIL_ASSET_BASE_URL || process.env.APP_URL || "https://www.pouch-supply.com").trim().replace(/\/+$/, "");
  }
});

// backend/services/emailService.ts
var emailService_exports = {};
__export(emailService_exports, {
  formatFromHeader: () => formatFromHeader,
  formatResendFromEmail: () => formatResendFromEmail,
  getEmailLogs: () => getEmailLogs,
  getEmailSettings: () => getEmailSettings,
  logEmail: () => logEmail,
  saveEmailSettings: () => saveEmailSettings,
  sendAdminNewOrderNotification: () => sendAdminNewOrderNotification,
  sendDeliveredEmail: () => sendDeliveredEmail,
  sendEmail: () => sendEmail,
  sendEmailVerificationEmail: () => sendEmailVerificationEmail,
  sendLoginNotificationEmail: () => sendLoginNotificationEmail,
  sendOrderCancelledEmail: () => sendOrderCancelledEmail,
  sendOrderConfirmationEmail: () => sendOrderConfirmationEmail,
  sendOrderExchangedEmail: () => sendOrderExchangedEmail,
  sendOrderProcessingEmail: () => sendOrderProcessingEmail,
  sendOrderRefundedEmail: () => sendOrderRefundedEmail,
  sendOrderShippedEmail: () => sendOrderShippedEmail,
  sendOutForDeliveryEmail: () => sendOutForDeliveryEmail,
  sendPasswordResetEmail: () => sendPasswordResetEmail,
  sendSubscriptionPriceChangeEmail: () => sendSubscriptionPriceChangeEmail,
  sendWelcomeEmail: () => sendWelcomeEmail,
  verifyEmailConnection: () => verifyEmailConnection
});
import nodemailer from "nodemailer";
import { Resend } from "resend";
function formatFromHeader(fromName, fromEmail) {
  const cleanName = (fromName || "Pouch Supply Co.").replace(/["'<>]/g, "").trim();
  const cleanEmail = (fromEmail || "scottkivlinpouch@gmail.com").replace(/[<>]/g, "").trim();
  return `"${cleanName}" <${cleanEmail}>`;
}
function formatResendFromEmail(rawFrom) {
  if (!rawFrom || typeof rawFrom !== "string" || !rawFrom.trim()) {
    return "Pouch Supply Co. <onboarding@resend.dev>";
  }
  const cleaned = rawFrom.trim().replace(/^["']|["']$/g, "");
  const angleMatch = cleaned.match(/^([^<]+)<([^>]+)>$/);
  if (angleMatch) {
    const name = angleMatch[1].trim().replace(/[<>"]/g, "");
    const email = angleMatch[2].trim().replace(/[<>"]/g, "");
    if (email.includes("@")) {
      return name ? `${name} <${email}>` : email;
    }
  }
  if (cleaned.includes("@") && !cleaned.includes(" ") && !cleaned.includes("<") && !cleaned.includes(">")) {
    return `Pouch Supply Co. <${cleaned}>`;
  }
  const parts = cleaned.split(/\s+/);
  const emailCandidate = parts.find((p) => p.includes("@"));
  if (emailCandidate) {
    const email = emailCandidate.replace(/[<>,;"']/g, "").trim();
    const name = parts.filter((p) => !p.includes("@")).join(" ").replace(/[<>,;"']/g, "").trim();
    return name ? `${name} <${email}>` : email;
  }
  return "Pouch Supply Co. <onboarding@resend.dev>";
}
async function getEmailSettings() {
  try {
    let stored = await fetchStoreSetting("email_settings");
    if (!stored || typeof stored === "object" && Object.keys(stored).length === 0) {
      const legacy = await fetchResource("email_settings");
      if (legacy && Array.isArray(legacy) && legacy.length > 0) {
        stored = legacy[0];
      }
    }
    if (stored && typeof stored === "object") {
      const item = Array.isArray(stored) ? stored[0] : stored;
      return {
        ...DEFAULT_SETTINGS,
        ...item,
        provider: item.provider || DEFAULT_SETTINGS.provider,
        gmailUser: item.gmailUser || process.env.GMAIL_USER || DEFAULT_SETTINGS.gmailUser,
        gmailAppPassword: item.gmailAppPassword !== void 0 ? item.gmailAppPassword : process.env.GMAIL_APP_PASSWORD || "",
        smtpHost: item.smtpHost || process.env.SMTP_HOST || DEFAULT_SETTINGS.smtpHost,
        smtpPort: item.smtpPort || Number(process.env.SMTP_PORT) || DEFAULT_SETTINGS.smtpPort,
        smtpSecure: item.smtpSecure !== void 0 ? item.smtpSecure : process.env.SMTP_SECURE !== "false",
        smtpUser: item.smtpUser || process.env.SMTP_USER || item.gmailUser || DEFAULT_SETTINGS.smtpUser,
        smtpPassword: item.smtpPassword !== void 0 ? item.smtpPassword : process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || "",
        resendApiKey: item.resendApiKey !== void 0 ? item.resendApiKey : process.env.RESEND_API_KEY || "",
        fromName: item.fromName || DEFAULT_SETTINGS.fromName,
        fromEmail: item.fromEmail || item.gmailUser || process.env.RESEND_FROM_EMAIL || DEFAULT_SETTINGS.fromEmail,
        adminNotificationEmail: item.adminNotificationEmail || process.env.ADMIN_NOTIFICATION_EMAIL || DEFAULT_SETTINGS.adminNotificationEmail,
        templates: {
          ...DEFAULT_SETTINGS.templates,
          ...item.templates || {}
        }
      };
    }
  } catch (err) {
  }
  return DEFAULT_SETTINGS;
}
async function saveEmailSettings(settings) {
  const current = await getEmailSettings();
  const updated = {
    ...current,
    ...settings,
    templates: {
      ...current.templates,
      ...settings.templates || {}
    }
  };
  if (settings.gmailUser) process.env.GMAIL_USER = settings.gmailUser;
  if (settings.gmailAppPassword) process.env.GMAIL_APP_PASSWORD = settings.gmailAppPassword;
  if (settings.resendApiKey) process.env.RESEND_API_KEY = settings.resendApiKey;
  if (settings.adminNotificationEmail) process.env.ADMIN_NOTIFICATION_EMAIL = settings.adminNotificationEmail;
  await saveStoreSetting("email_settings", updated);
  await saveResource("email_settings", [updated]);
  return updated;
}
async function getEmailLogs() {
  try {
    const logs = await fetchResource("email_logs");
    if (Array.isArray(logs)) {
      return logs.filter((l) => l.status !== "simulated");
    }
    return [];
  } catch (err) {
    return [];
  }
}
async function logEmail(entry) {
  const newLog = {
    ...entry,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  try {
    const currentLogs = await getEmailLogs();
    const updated = [newLog, ...currentLogs].slice(0, 500);
    await saveResource("email_logs", updated);
  } catch (err) {
  }
  return newLog;
}
async function verifyEmailConnection(config) {
  const settings = await getEmailSettings();
  const merged = { ...settings, ...config || {} };
  const provider = merged.provider || "gmail";
  if (provider === "gmail") {
    const user = (merged.gmailUser || "").trim();
    const pass = (merged.gmailAppPassword || "").trim().replace(/\s+/g, "");
    if (!user) {
      return { success: false, provider: "gmail", message: "Gmail address is missing." };
    }
    if (!pass) {
      return {
        success: false,
        provider: "gmail",
        message: "Gmail App Password is required. Generate a 16-character App Password from Google Account Security (https://myaccount.google.com/apppasswords)."
      };
    }
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass }
      });
      await transporter.verify();
      return {
        success: true,
        provider: "gmail",
        message: `Successfully connected and authenticated with Gmail (${user})!`
      };
    } catch (err) {
      return {
        success: false,
        provider: "gmail",
        message: `Gmail Authentication Failed: ${err.message}. Check your Gmail address and 16-character App Password.`
      };
    }
  }
  if (provider === "smtp") {
    const host = (merged.smtpHost || "smtp.gmail.com").trim();
    const port = merged.smtpPort || 465;
    const user = (merged.smtpUser || "").trim();
    const pass = (merged.smtpPassword || "").trim();
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: merged.smtpSecure !== false && port === 465,
        auth: user && pass ? { user, pass } : void 0
      });
      await transporter.verify();
      return {
        success: true,
        provider: "smtp",
        message: `Successfully connected to SMTP server (${host}:${port})!`
      };
    } catch (err) {
      return {
        success: false,
        provider: "smtp",
        message: `SMTP Connection Failed: ${err.message}`
      };
    }
  }
  if (provider === "resend") {
    const key = (merged.resendApiKey || process.env.RESEND_API_KEY || "").trim();
    if (!key) {
      return { success: false, provider: "resend", message: "Resend API Key is missing. Please enter your Resend API Key (re_...)." };
    }
    try {
      const resend = new Resend(key);
      const test = await resend.apiKeys.list().catch((err) => ({ error: err }));
      if (test && !test.error) {
        return { success: true, provider: "resend", message: "Resend API key is valid and connected successfully!" };
      }
      if (test && test.error) {
        return { success: false, provider: "resend", message: `Resend validation failed: ${test.error.message || test.error}` };
      }
      return { success: true, provider: "resend", message: "Resend API connection initialized." };
    } catch (err) {
      return { success: false, provider: "resend", message: `Resend error: ${err.message || String(err)}` };
    }
  }
  return { success: true, provider: "auto", message: "Email configuration checked." };
}
async function sendEmail(type, recipient, data, customSubject, apiKeyOverride, fromEmailOverride) {
  const settings = await getEmailSettings();
  if (!settings.enabled) {
    console.log(`[EmailService] Global email sending is disabled. Skipping ${type} to ${recipient}.`);
    const log = await logEmail({
      type,
      recipient,
      subject: customSubject || settings.templates[type]?.subject || type,
      status: "disabled",
      error: "Global email system disabled in settings"
    });
    return { success: false, log, message: "Global email sending is disabled in settings." };
  }
  const templateConfig = settings.templates[type];
  if (templateConfig && !templateConfig.enabled) {
    console.log(`[EmailService] Template '${type}' is disabled. Skipping sending to ${recipient}.`);
    const log = await logEmail({
      type,
      recipient,
      subject: customSubject || templateConfig.subject || type,
      status: "disabled",
      error: `Template '${type}' is disabled in settings`
    });
    return { success: false, log, message: `Template '${type}' is currently disabled in settings.` };
  }
  const subject = customSubject || templateConfig?.subject || `Notification from Pouch Supply Co.`;
  if (!data.headerLogoImage && !data.logoUrl) {
    try {
      const layout = await fetchLayoutSettings();
      if (layout?.headerLogoImage) {
        data.headerLogoImage = layout.headerLogoImage;
      }
    } catch (e) {
    }
  }
  let html = "";
  switch (type) {
    case "order_confirmation":
      html = renderOrderConfirmationTemplate(data);
      break;
    case "order_processing":
      html = renderOrderProcessingTemplate(data);
      break;
    case "order_shipped":
      html = renderOrderShippedTemplate(data);
      break;
    case "out_for_delivery":
      html = renderOutForDeliveryTemplate(data);
      break;
    case "order_delivered":
      html = renderDeliveredTemplate(data);
      break;
    case "subscription_price_change":
      html = renderSubscriptionPriceChangeTemplate(data);
      break;
    case "order_cancelled":
      html = renderOrderCancelledTemplate(data);
      break;
    case "order_refunded":
      html = renderOrderRefundedTemplate(data);
      break;
    case "order_exchanged":
      html = renderOrderExchangedTemplate(data);
      break;
    case "password_reset":
      html = renderPasswordResetTemplate(data);
      break;
    case "email_verification":
      html = renderEmailVerificationTemplate(data);
      break;
    case "welcome_email":
      html = renderWelcomeTemplate(data);
      break;
    case "admin_new_order":
      html = renderAdminNewOrderTemplate(data);
      break;
    default:
      html = `<p>Notification from Pouch Supply Co.</p>`;
  }
  const effectiveProvider = settings.provider || "gmail";
  const gmailUser = (settings.gmailUser || process.env.GMAIL_USER || "scottkivlinpouch@gmail.com").trim();
  const gmailPass = (settings.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || "").trim().replace(/\s+/g, "");
  const resendKey = (apiKeyOverride || settings.resendApiKey || process.env.RESEND_API_KEY || "").trim();
  const fromName = settings.fromName || "Pouch Supply Co.";
  const senderEmail = fromEmailOverride || settings.fromEmail || gmailUser || "scottkivlinpouch@gmail.com";
  const fromFormatted = formatFromHeader(fromName, senderEmail);
  if (effectiveProvider === "gmail" || effectiveProvider === "auto" && gmailUser && gmailPass) {
    if (!gmailPass) {
      const errMsg = "Gmail App Password is not configured in Email Settings. Add your 16-character Google App Password to enable live Gmail sending.";
      console.warn(`[EmailService Gmail] ${errMsg}`);
      const log = await logEmail({
        type,
        recipient,
        subject,
        status: "failed",
        provider: "gmail",
        error: errMsg,
        metadata: { data, html }
      });
      return { success: false, mode: "live", provider: "gmail", message: errMsg, log };
    }
    try {
      console.log(`[EmailService] Sending '${type}' to '${recipient}' via Gmail SMTP (${gmailUser})...`);
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailPass
        }
      });
      const info = await transporter.sendMail({
        from: `"${fromName}" <${gmailUser}>`,
        to: recipient,
        replyTo: gmailUser,
        subject,
        html
      });
      console.log(`[EmailService Gmail] Email successfully sent to ${recipient}! Message ID: ${info.messageId}`);
      const log = await logEmail({
        type,
        recipient,
        subject,
        status: "sent",
        provider: "gmail",
        messageId: info.messageId,
        metadata: { data }
      });
      return {
        success: true,
        mode: "live",
        provider: "gmail",
        message: `Email successfully sent to ${recipient} via Gmail (${gmailUser})!`,
        log
      };
    } catch (gmailErr) {
      const errMsg = gmailErr.message || String(gmailErr);
      console.error(`[EmailService Gmail Error]:`, gmailErr);
      const log = await logEmail({
        type,
        recipient,
        subject,
        status: "failed",
        provider: "gmail",
        error: errMsg,
        metadata: { data }
      });
      return { success: false, mode: "live", provider: "gmail", message: `Gmail Send Failed: ${errMsg}`, log };
    }
  }
  if (effectiveProvider === "smtp") {
    const smtpHost = settings.smtpHost || "smtp.gmail.com";
    const smtpPort = settings.smtpPort || 465;
    const smtpUser = settings.smtpUser || gmailUser;
    const smtpPass = (settings.smtpPassword || gmailPass).replace(/\s+/g, "");
    try {
      console.log(`[EmailService] Sending '${type}' to '${recipient}' via custom SMTP (${smtpHost}:${smtpPort})...`);
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: settings.smtpSecure !== false && smtpPort === 465,
        auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : void 0
      });
      const info = await transporter.sendMail({
        from: `"${fromName}" <${smtpUser || senderEmail}>`,
        to: recipient,
        replyTo: smtpUser || senderEmail,
        subject,
        html
      });
      console.log(`[EmailService SMTP] Email successfully sent! Message ID: ${info.messageId}`);
      const log = await logEmail({
        type,
        recipient,
        subject,
        status: "sent",
        provider: "smtp",
        messageId: info.messageId,
        metadata: { data }
      });
      return {
        success: true,
        mode: "live",
        provider: "smtp",
        message: `Email successfully sent to ${recipient} via SMTP (${smtpHost})!`,
        log
      };
    } catch (smtpErr) {
      const errMsg = smtpErr.message || String(smtpErr);
      console.error(`[EmailService SMTP Error]:`, smtpErr);
      const log = await logEmail({
        type,
        recipient,
        subject,
        status: "failed",
        provider: "smtp",
        error: errMsg,
        metadata: { data }
      });
      return { success: false, mode: "live", provider: "smtp", message: `SMTP Send Failed: ${errMsg}`, log };
    }
  }
  if (effectiveProvider === "resend" || effectiveProvider === "auto" && resendKey) {
    if (!resendKey) {
      console.warn(`[EmailService] No RESEND_API_KEY configured for recipient ${recipient}.`);
      const log = await logEmail({
        type,
        recipient,
        subject,
        status: "failed",
        provider: "resend",
        error: "Resend API key is not configured. Enter an API key in Email Settings.",
        metadata: { data, html }
      });
      return {
        success: false,
        mode: "live",
        provider: "resend",
        message: "Resend API key is not configured.",
        log
      };
    }
    try {
      const resend = new Resend(resendKey);
      let fromEmail = formatResendFromEmail(fromFormatted);
      console.log(`[EmailService] Sending '${type}' via Resend to '${recipient}' (From: ${fromEmail})...`);
      let resendResponse = await resend.emails.send({
        from: fromEmail,
        to: recipient,
        subject,
        html
      });
      if (resendResponse.error) {
        const errMsg = resendResponse.error.message || String(resendResponse.error);
        if ((errMsg.includes("domain") || errMsg.includes("not verified") || errMsg.includes("from")) && !fromEmail.includes("onboarding@resend.dev")) {
          fromEmail = "Pouch Supply Co. <onboarding@resend.dev>";
          resendResponse = await resend.emails.send({
            from: fromEmail,
            to: recipient,
            subject,
            html
          });
        }
      }
      if (resendResponse.error) {
        const errMsg = resendResponse.error.message || String(resendResponse.error);
        const log2 = await logEmail({
          type,
          recipient,
          subject,
          status: "failed",
          provider: "resend",
          error: errMsg,
          metadata: { data, html }
        });
        return { success: false, mode: "live", provider: "resend", message: `Resend Error: ${errMsg}`, log: log2 };
      }
      const resendId = resendResponse.data?.id;
      const log = await logEmail({
        type,
        recipient,
        subject,
        status: "sent",
        provider: "resend",
        resendId,
        metadata: { data }
      });
      return {
        success: true,
        mode: "live",
        provider: "resend",
        message: `Email successfully sent to ${recipient} via Resend! (ID: ${resendId})`,
        log
      };
    } catch (resendErr) {
      const errMsg = resendErr.message || String(resendErr);
      const log = await logEmail({
        type,
        recipient,
        subject,
        status: "failed",
        provider: "resend",
        error: errMsg,
        metadata: { data }
      });
      return { success: false, mode: "live", provider: "resend", message: `Resend Exception: ${errMsg}`, log };
    }
  }
  const errLog = await logEmail({
    type,
    recipient,
    subject,
    status: "failed",
    error: "No email transport configured. Please configure Gmail, SMTP, or Resend in Email Settings."
  });
  return {
    success: false,
    mode: "live",
    message: "No email transport configured. Configure Gmail or SMTP in Admin Email Settings.",
    log: errLog
  };
}
async function sendOrderConfirmationEmail(orderData) {
  const recipient = (orderData.customerEmail || "customer@pouch-supply.com").trim();
  const data = {
    customerName: orderData.customerName || "Valued Customer",
    customerEmail: recipient,
    orderId: orderData.id || orderData.orderId,
    orderDate: orderData.date || (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    items: orderData.items || [],
    total: typeof orderData.total === "number" ? orderData.total : parseFloat(orderData.total) || 0,
    destination: orderData.destination || orderData.address || "United Kingdom",
    deliveryMethod: orderData.deliveryMethod || "Royal Mail Tracked 24/48",
    // Passed through rather than guessed from the total: a Free Delivery reward
    // waives the charge on an order of any size, and the template's fallback
    // ("under £40 means £2.99") would bill the customer for it in the email.
    subtotal: typeof orderData.subtotal === "number" ? orderData.subtotal : orderData.data?.subtotal,
    deliveryCost: typeof orderData.shippingCost === "number" ? orderData.shippingCost : typeof orderData.deliveryCost === "number" ? orderData.deliveryCost : orderData.data?.shippingCost,
    // `discountApplied` is the discount object; it has no `amount` field, so the
    // discount row never rendered. The money off is carried separately.
    discountAmount: typeof orderData.discountAmount === "number" ? orderData.discountAmount : void 0
  };
  console.log(`[EmailService] Triggering Order Confirmation for Order #${data.orderId} to ${recipient}`);
  const customerResult = await sendEmail("order_confirmation", recipient, data);
  const settings = await getEmailSettings();
  const adminEmail = (settings.adminNotificationEmail || settings.gmailUser || "admin@pouch-supply.com").trim();
  if (adminEmail && adminEmail !== recipient) {
    sendEmail("admin_new_order", adminEmail, data).catch((err) => {
      console.warn("[EmailService] Admin order notification warning:", err);
    });
  }
  return customerResult;
}
async function sendOrderProcessingEmail(orderData) {
  const recipient = (orderData.customerEmail || "customer@pouch-supply.com").trim();
  const data = {
    customerName: orderData.customerName,
    customerEmail: recipient,
    orderId: orderData.id || orderData.orderId,
    items: orderData.items || [],
    total: orderData.total,
    destination: orderData.destination || orderData.address
  };
  return sendEmail("order_processing", recipient, data);
}
async function sendOrderShippedEmail(orderData, trackingNumber, carrier) {
  const recipient = (orderData.customerEmail || "customer@pouch-supply.com").trim();
  const data = {
    customerName: orderData.customerName,
    customerEmail: recipient,
    orderId: orderData.id || orderData.orderId,
    items: orderData.items || [],
    total: orderData.total,
    destination: orderData.destination || orderData.address,
    // No stand-in tracking number. This used to fall back to a made-up
    // 'RM892341234GB', so an order dispatched on a non-tracked service emailed
    // the customer a number that tracks nothing and a Track Package link that
    // leads nowhere. Left empty, the template omits the tracking block.
    trackingNumber: trackingNumber || orderData.trackingNumber || orderData.trackingId || "",
    carrier: carrier || orderData.carrier || "Royal Mail"
  };
  return sendEmail("order_shipped", recipient, data);
}
async function sendOutForDeliveryEmail(orderData) {
  const recipient = (orderData.customerEmail || "customer@pouch-supply.com").trim();
  const data = {
    customerName: orderData.customerName,
    customerEmail: recipient,
    orderId: orderData.id || orderData.orderId,
    items: orderData.items || [],
    trackingNumber: orderData.trackingNumber || orderData.trackingId || ""
  };
  return sendEmail("out_for_delivery", recipient, data);
}
async function sendDeliveredEmail(orderData) {
  const recipient = (orderData.customerEmail || "customer@pouch-supply.com").trim();
  const data = {
    customerName: orderData.customerName,
    customerEmail: recipient,
    orderId: orderData.id || orderData.orderId,
    items: orderData.items || [],
    destination: orderData.destination || orderData.address
  };
  return sendEmail("order_delivered", recipient, data);
}
async function sendSubscriptionPriceChangeEmail(change) {
  const recipient = String(change.customerEmail || "").trim();
  if (!recipient) throw new Error("A price-change notice needs a recipient.");
  const data = {
    customerName: change.customerName,
    customerEmail: recipient,
    planName: change.planName,
    previousAmount: change.previousAmount,
    newAmount: change.newAmount,
    effectiveFrom: change.effectiveFrom,
    billingInterval: change.billingInterval
  };
  return sendEmail("subscription_price_change", recipient, data);
}
async function sendOrderCancelledEmail(orderData, reason) {
  const recipient = (orderData.customerEmail || "customer@pouch-supply.com").trim();
  const data = {
    customerName: orderData.customerName,
    customerEmail: recipient,
    orderId: orderData.id || orderData.orderId,
    cancellationReason: reason
  };
  return sendEmail("order_cancelled", recipient, data);
}
async function sendOrderRefundedEmail(orderData, refundAmount, reason) {
  const recipient = (orderData.customerEmail || "customer@pouch-supply.com").trim();
  const data = {
    customerName: orderData.customerName,
    customerEmail: recipient,
    orderId: orderData.id || orderData.orderId,
    total: orderData.total,
    refundAmount: refundAmount !== void 0 ? refundAmount : orderData.total,
    refundReason: reason
  };
  return sendEmail("order_refunded", recipient, data);
}
async function sendOrderExchangedEmail(orderData, exchangeDetails, reason) {
  const recipient = (orderData.customerEmail || "customer@pouch-supply.com").trim();
  const data = {
    customerName: orderData.customerName,
    customerEmail: recipient,
    orderId: orderData.id || orderData.orderId,
    items: orderData.items || [],
    total: orderData.total,
    refundReason: exchangeDetails || reason || "Product exchange initiated"
  };
  return sendEmail("order_exchanged", recipient, data);
}
async function sendPasswordResetEmail(email, name, resetToken, resetLink) {
  const data = {
    customerName: name || "Customer",
    customerEmail: email,
    resetToken: resetToken || "token_xyz",
    resetLink: resetLink || "#"
  };
  return sendEmail("password_reset", email, data);
}
async function sendEmailVerificationEmail(email, name, code) {
  const data = {
    customerName: name || "Customer",
    customerEmail: email,
    verificationCode: code || Math.floor(1e5 + Math.random() * 9e5).toString()
  };
  return sendEmail("email_verification", email, data);
}
async function sendWelcomeEmail(email, name, discountCode) {
  const data = {
    customerName: name || "Friend",
    customerEmail: email,
    discountCode: discountCode || "WELCOME10"
  };
  return sendEmail("welcome_email", email, data);
}
async function sendLoginNotificationEmail(email, name) {
  const data = {
    customerName: name || "Valued Customer",
    customerEmail: email
  };
  return sendEmail("email_verification", email, data, "Security Alert: New Account Login - Pouch Supply Co.");
}
async function sendAdminNewOrderNotification(orderData) {
  const settings = await getEmailSettings();
  const adminEmail = (settings.adminNotificationEmail || settings.gmailUser || "admin@pouch-supply.com").trim();
  const data = {
    customerName: orderData.customerName,
    customerEmail: orderData.customerEmail,
    orderId: orderData.id || orderData.orderId,
    items: orderData.items || [],
    total: orderData.total,
    destination: orderData.destination || orderData.address
  };
  return sendEmail("admin_new_order", adminEmail, data);
}
var DEFAULT_SETTINGS;
var init_emailService = __esm({
  "backend/services/emailService.ts"() {
    init_serverDb();
    init_emailTemplates();
    DEFAULT_SETTINGS = {
      enabled: true,
      provider: process.env.EMAIL_PROVIDER || (process.env.RESEND_API_KEY ? "resend" : "resend"),
      gmailUser: process.env.GMAIL_USER || "scottkivlinpouch@gmail.com",
      gmailAppPassword: process.env.GMAIL_APP_PASSWORD || "",
      smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
      smtpPort: Number(process.env.SMTP_PORT) || 465,
      smtpSecure: process.env.SMTP_SECURE !== "false",
      smtpUser: process.env.SMTP_USER || process.env.GMAIL_USER || "scottkivlinpouch@gmail.com",
      smtpPassword: process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || "",
      resendApiKey: process.env.RESEND_API_KEY || "",
      fromName: "Pouch Supply Co.",
      fromEmail: process.env.RESEND_FROM_EMAIL || "orders@pouch-supply.com",
      adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL || process.env.GMAIL_USER || "scottkivlinpouch@gmail.com",
      templates: {
        order_confirmation: { enabled: true, subject: "Order Confirmation - Pouch Supply Co." },
        order_processing: { enabled: true, subject: "Order Processing - Pouch Supply Co." },
        order_shipped: { enabled: true, subject: "Order Dispatched & Tracking Info - Pouch Supply Co." },
        out_for_delivery: { enabled: true, subject: "Out for Delivery Today - Pouch Supply Co." },
        order_delivered: { enabled: true, subject: "Order Delivered - Pouch Supply Co." },
        order_cancelled: { enabled: true, subject: "Order Cancellation Notice - Pouch Supply Co." },
        order_refunded: { enabled: true, subject: "Refund Confirmation - Pouch Supply Co." },
        order_exchanged: { enabled: true, subject: "Product Exchange Confirmation - Pouch Supply Co." },
        subscription_price_change: { enabled: true, subject: "Your subscription price is changing - Pouch Supply Co." },
        password_reset: { enabled: true, subject: "Reset Your Password - Pouch Supply Co." },
        email_verification: { enabled: true, subject: "Verify Your Email Address - Pouch Supply Co." },
        welcome_email: { enabled: true, subject: "Welcome to Pouch Supply Co. - 10% Off Inside!" },
        admin_new_order: { enabled: true, subject: "\u{1F6A8} [NEW ORDER] Order Received - Pouch Supply Co." }
      }
    };
  }
});

// backend/services/klaviyoService.ts
async function getKlaviyoSettings() {
  try {
    let stored = await fetchStoreSetting("klaviyo_settings");
    if (!stored || typeof stored === "object" && Object.keys(stored).length === 0) {
      const legacy = await fetchResource("klaviyo_settings");
      if (legacy && Array.isArray(legacy) && legacy.length > 0) {
        stored = legacy[0];
      }
    }
    const layoutStored = await fetchLayoutSettings().catch(() => null);
    const siteIdVal = stored?.siteId || stored?.publicKey || layoutStored?.klaviyoPublicKey || process.env.NEXT_PUBLIC_KLAVIYO_COMPANY_ID || process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY || process.env.KLAVIYO_SITE_ID || "VPbY66";
    const apiKeyVal = stored?.apiKey || layoutStored?.klaviyoApiKey || process.env.KLAVIYO_API_KEY || "";
    if (stored && typeof stored === "object") {
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
  } catch (err) {
  }
  return DEFAULT_KLAVIYO_SETTINGS;
}
function DEFAULT_SETTINGS_MERGED(item, apiKeyVal, siteIdVal) {
  return {
    ...DEFAULT_KLAVIYO_SETTINGS,
    ...item,
    apiKey: item.apiKey || apiKeyVal,
    siteId: siteIdVal,
    publicKey: siteIdVal,
    listId: item.listId || "",
    trackEvents: {
      ...DEFAULT_KLAVIYO_SETTINGS.trackEvents,
      ...item.trackEvents || {}
    }
  };
}
async function saveKlaviyoSettings(settings) {
  const current = await getKlaviyoSettings();
  const siteIdVal = settings.siteId || settings.publicKey || current.siteId || "VPbY66";
  const apiKeyVal = (settings.apiKey !== void 0 ? settings.apiKey : current.apiKey) || "";
  const updated = {
    ...current,
    ...settings,
    apiKey: apiKeyVal,
    siteId: siteIdVal,
    publicKey: siteIdVal,
    trackEvents: {
      ...current.trackEvents,
      ...settings.trackEvents || {}
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
  await saveStoreSetting("klaviyo_settings", updated);
  await saveResource("klaviyo_settings", [updated]);
  return updated;
}
async function getKlaviyoLogs() {
  try {
    const logs = await fetchResource("klaviyo_logs");
    if (Array.isArray(logs)) {
      return logs.filter((l) => l.status !== "simulated");
    }
    return [];
  } catch (err) {
    return [];
  }
}
async function logKlaviyoEvent(entry) {
  const newLog = {
    ...entry,
    id: `klaviyo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  try {
    const currentLogs = await getKlaviyoLogs();
    const updated = [newLog, ...currentLogs].slice(0, 500);
    await saveResource("klaviyo_logs", updated);
  } catch (err) {
  }
  return newLog;
}
async function getKlaviyoLists(apiKeyOverride) {
  const settings = await getKlaviyoSettings();
  let apiKey = (apiKeyOverride || settings.apiKey || process.env.KLAVIYO_API_KEY || "").trim();
  if (apiKey.toLowerCase().startsWith("klaviyo-api-key ")) {
    apiKey = apiKey.substring(16).trim();
  }
  if (!apiKey) return [];
  try {
    const response = await fetch("https://a.klaviyo.com/api/lists/", {
      method: "GET",
      headers: {
        "Authorization": `Klaviyo-API-Key ${apiKey}`,
        "accept": "application/json",
        "revision": "2024-02-15"
      }
    });
    if (!response.ok) return [];
    const json = await response.json();
    if (json.data && Array.isArray(json.data)) {
      return json.data.map((l) => ({
        id: l.id,
        name: l.attributes?.name || l.id
      }));
    }
  } catch (err) {
    console.warn("[Klaviyo Lists Error]:", err);
  }
  return [];
}
async function syncKlaviyoProfileWithConsent(email, firstName, lastName, listIdOverride) {
  const settings = await getKlaviyoSettings();
  let apiKey = (settings.apiKey || process.env.KLAVIYO_API_KEY || "").trim();
  if (apiKey.toLowerCase().startsWith("klaviyo-api-key ")) {
    apiKey = apiKey.substring(16).trim();
  }
  const cleanEmail = email.toLowerCase().trim();
  const listId = listIdOverride || settings.listId;
  if (!apiKey || !cleanEmail) return false;
  const headers = {
    "Authorization": `Klaviyo-API-Key ${apiKey}`,
    "Content-Type": "application/json",
    "accept": "application/json",
    "revision": "2024-10-15"
  };
  try {
    const profileAttributes = { email: cleanEmail };
    if (firstName) profileAttributes.first_name = firstName;
    if (lastName) profileAttributes.last_name = lastName;
    const profRes = await fetch("https://a.klaviyo.com/api/profiles/", {
      method: "POST",
      headers,
      body: JSON.stringify({ data: { type: "profile", attributes: profileAttributes } })
    });
    let profileOk = profRes.ok;
    if (profRes.status === 409) {
      const conflict = await profRes.json().catch(() => null);
      const existingId = conflict?.errors?.[0]?.meta?.duplicate_profile_id;
      if (existingId) {
        const patchRes = await fetch(`https://a.klaviyo.com/api/profiles/${existingId}/`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            data: { type: "profile", id: existingId, attributes: profileAttributes }
          })
        });
        profileOk = patchRes.ok;
        if (!patchRes.ok) {
          const detail = await patchRes.text().catch(() => "");
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
      const detail = await profRes.text().catch(() => "");
      console.warn(
        `[Klaviyo Profile Sync] Could not create profile for ${cleanEmail}: HTTP ${profRes.status} ${detail.slice(0, 200)}`
      );
    }
    if (!listId) {
      console.warn(
        "[Klaviyo Profile Sync] No Klaviyo list is configured, so email marketing consent cannot be recorded. Marketing flows will skip these profiles. Choose a list in Admin -> Email & Marketing -> Klaviyo. (Flows marked transactional, such as order confirmations, still send without consent.)"
      );
      return profileOk;
    }
    const subRes = await fetch("https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/", {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: {
          type: "profile-subscription-bulk-create-job",
          attributes: {
            custom_source: "Storefront Purchase / Checkout",
            profiles: {
              data: [
                {
                  type: "profile",
                  attributes: {
                    email: cleanEmail,
                    subscriptions: {
                      email: { marketing: { consent: "SUBSCRIBED" } }
                    }
                  }
                }
              ]
            }
          },
          relationships: { list: { data: { type: "list", id: listId } } }
        }
      })
    });
    if (!subRes.ok) {
      const detail = await subRes.text().catch(() => "");
      console.warn(
        `[Klaviyo Profile Sync] Consent job rejected for ${cleanEmail}: HTTP ${subRes.status} ${detail.slice(0, 300)}`
      );
      return profileOk;
    }
    return true;
  } catch (err) {
    console.warn("[Klaviyo Profile Sync Error]:", err);
    return false;
  }
}
async function trackKlaviyoEvent(eventName, customerEmail, eventProperties = {}, customerProperties = {}) {
  const settings = await getKlaviyoSettings();
  if (!settings.enabled) {
    const log = await logKlaviyoEvent({
      eventName,
      customerEmail,
      status: "disabled",
      error: "Klaviyo integration is disabled in settings"
    });
    return { success: false, log };
  }
  let apiKey = (settings.apiKey || process.env.KLAVIYO_API_KEY || "").trim();
  if (apiKey.toLowerCase().startsWith("klaviyo-api-key ")) {
    apiKey = apiKey.substring(16).trim();
  }
  const siteId = (settings.siteId || settings.publicKey || process.env.NEXT_PUBLIC_KLAVIYO_COMPANY_ID || process.env.KLAVIYO_SITE_ID || "VPbY66").trim();
  const cleanEmail = (customerEmail || "customer@pouch-supply.com").trim().toLowerCase();
  const profileAttributes = {
    email: cleanEmail
  };
  const customProfileProps = {};
  if (customerProperties && typeof customerProperties === "object") {
    for (const [rawKey, val] of Object.entries(customerProperties)) {
      if (val === void 0 || val === null) continue;
      const key = rawKey.replace(/^\$/, "");
      if (key === "email") {
        profileAttributes.email = String(val).trim().toLowerCase();
      } else if (key === "first_name" || key === "firstName") {
        profileAttributes.first_name = String(val).trim();
      } else if (key === "last_name" || key === "lastName") {
        profileAttributes.last_name = String(val).trim();
      } else if (key === "phone_number" || key === "phone") {
        profileAttributes.phone_number = String(val).trim();
      } else if (key === "external_id") {
        profileAttributes.external_id = String(val).trim();
      } else if (key === "organization" || key === "title" || key === "image" || key === "location") {
        profileAttributes[key] = val;
      } else {
        customProfileProps[key] = val;
      }
    }
  }
  if (Object.keys(customProfileProps).length > 0) {
    profileAttributes.properties = customProfileProps;
  }
  syncKlaviyoProfileWithConsent(cleanEmail, profileAttributes.first_name, profileAttributes.last_name).catch(() => {
  });
  let numValue = void 0;
  if (typeof eventProperties.$value === "number") numValue = eventProperties.$value;
  else if (typeof eventProperties.value === "number") numValue = eventProperties.value;
  else if (typeof eventProperties.total === "number") numValue = eventProperties.total;
  else if (typeof eventProperties.Value === "number") numValue = eventProperties.Value;
  else if (typeof eventProperties.$value === "string") {
    const parsed = parseFloat(eventProperties.$value);
    if (!isNaN(parsed)) numValue = parsed;
  } else if (typeof eventProperties.total === "string") {
    const parsed = parseFloat(eventProperties.total);
    if (!isNaN(parsed)) numValue = parsed;
  }
  const uniqueId = eventProperties.$event_id || eventProperties.OrderId || eventProperties.order_id || eventProperties.id || void 0;
  const cleanProps = { ...eventProperties };
  delete cleanProps.$value;
  delete cleanProps.$event_id;
  const attributes = {
    metric: {
      data: {
        type: "metric",
        attributes: {
          name: eventName
        }
      }
    },
    profile: {
      data: {
        type: "profile",
        attributes: profileAttributes
      }
    },
    properties: cleanProps,
    time: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (numValue !== void 0 && !isNaN(numValue)) {
    attributes.value = numValue;
  }
  if (uniqueId) {
    attributes.unique_id = String(uniqueId);
  }
  const requestBody = {
    data: {
      type: "event",
      attributes
    }
  };
  try {
    let sentSuccessfully = false;
    let transportMethod = "private_api";
    let lastErrorDetails = "";
    if (apiKey) {
      try {
        console.log(`[Klaviyo] Sending event '${eventName}' via Private API for ${profileAttributes.email}...`);
        const response = await fetch("https://a.klaviyo.com/api/events/", {
          method: "POST",
          headers: {
            "Authorization": `Klaviyo-API-Key ${apiKey}`,
            "Content-Type": "application/json",
            "accept": "application/json",
            "revision": "2024-02-15"
          },
          body: JSON.stringify(requestBody)
        });
        if (response.ok || response.status === 202) {
          sentSuccessfully = true;
          transportMethod = "private_api";
        } else {
          const errorText = await response.text();
          let errorDetails = `HTTP ${response.status}: ${errorText}`;
          try {
            const jsonErr = JSON.parse(errorText);
            if (jsonErr.errors && Array.isArray(jsonErr.errors)) {
              errorDetails = jsonErr.errors.map((e) => `${e.title || "Error"}: ${e.detail || e.message || JSON.stringify(e)}`).join(" | ");
            }
          } catch (e) {
          }
          lastErrorDetails = errorDetails;
          console.warn(`[Klaviyo Private API Warning] '${eventName}' (${response.status}): ${errorDetails}`);
        }
      } catch (privErr) {
        lastErrorDetails = privErr.message || String(privErr);
      }
    }
    if (!sentSuccessfully && siteId) {
      try {
        console.log(`[Klaviyo] Dispatching event '${eventName}' via Client Events API (Company ID: ${siteId}) for ${profileAttributes.email}...`);
        const clientRes = await fetch(`https://a.klaviyo.com/client/events/?company_id=${encodeURIComponent(siteId)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "accept": "application/json",
            "revision": "2024-02-15"
          },
          body: JSON.stringify(requestBody)
        });
        if (clientRes.ok || clientRes.status === 202) {
          sentSuccessfully = true;
          transportMethod = "client_events_api";
        } else {
          const clientErrText = await clientRes.text();
          console.warn(`[Klaviyo Client Events API Warning] (${clientRes.status}):`, clientErrText);
          if (!lastErrorDetails) lastErrorDetails = `Client Events API HTTP ${clientRes.status}: ${clientErrText}`;
        }
      } catch (clientErr) {
        if (!lastErrorDetails) lastErrorDetails = clientErr.message || String(clientErr);
      }
    }
    if (sentSuccessfully) {
      console.log(`[Klaviyo] Event '${eventName}' successfully tracked for ${profileAttributes.email} via ${transportMethod}!`);
      const log2 = await logKlaviyoEvent({
        eventName,
        customerEmail: profileAttributes.email,
        status: "sent",
        payload: { eventProperties: cleanProps, transport: transportMethod }
      });
      return { success: true, log: log2 };
    }
    const finalError = lastErrorDetails || "Failed to dispatch event via Private or Client API";
    console.error(`[Klaviyo Error] '${eventName}' tracking failed for ${profileAttributes.email}:`, finalError);
    const log = await logKlaviyoEvent({
      eventName,
      customerEmail: profileAttributes.email,
      status: "failed",
      error: finalError,
      payload: { eventProperties: cleanProps }
    });
    return { success: false, log };
  } catch (err) {
    console.error(`[Klaviyo Network Error] Failed tracking '${eventName}':`, err);
    const log = await logKlaviyoEvent({
      eventName,
      customerEmail: profileAttributes.email,
      status: "failed",
      error: err.message || String(err),
      payload: { eventProperties }
    });
    return { success: false, log };
  }
}
async function trackCustomerSignup(customer) {
  const settings = await getKlaviyoSettings();
  if (!settings.trackEvents.customerSignup) return;
  return trackKlaviyoEvent("Customer Registered", customer.email, {
    signupDate: (/* @__PURE__ */ new Date()).toISOString()
  }, {
    first_name: customer.name?.split(" ")[0],
    last_name: customer.name?.split(" ").slice(1).join(" ")
  });
}
async function trackNewsletterSignup(email) {
  const settings = await getKlaviyoSettings();
  if (!settings.trackEvents.newsletterSignup) return;
  return trackKlaviyoEvent("Newsletter Subscribed", email, {
    source: "Storefront Footer / Popup"
  });
}
async function trackEmailVerified(email, _name) {
  const settings = await getKlaviyoSettings();
  if (!settings.trackEvents.emailVerified) return;
  return trackKlaviyoEvent("Email Verified", email, {
    verifiedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
async function trackAddToCart(email, item, quantity = 1) {
  const settings = await getKlaviyoSettings();
  if (!settings.trackEvents.addToCart) return;
  return trackKlaviyoEvent("Added to Cart", email, {
    ProductName: item.title || item.productTitle,
    ProductID: item.id || item.productId,
    Price: item.price,
    Quantity: quantity,
    Value: (item.price || 0) * quantity
  });
}
function isSubscriptionLineItem(item) {
  if (!item) return false;
  const productId = String(item.productId || item.id || "");
  return Boolean(
    item.isSubscription || productId.includes("sub-pack") || item.vendor === "Subscription Pack" || item.subscriptionPlan
  );
}
async function trackCheckoutStarted(email, cartItems, totalValue, options = {}) {
  const settings = await getKlaviyoSettings();
  if (!settings.trackEvents.checkoutStarted) return;
  const formattedItems = (Array.isArray(cartItems) ? cartItems : []).map((i) => {
    const priceNum = typeof i.price === "number" ? i.price : parseFloat(i.price) || 0;
    const qtyNum = typeof i.quantity === "number" ? i.quantity : parseInt(i.quantity) || 1;
    return {
      ProductID: String(i.productId || i.id || "prod-generic"),
      SKU: String(i.sku || i.productId || i.id || "SKU-001"),
      ProductName: String(i.productTitle || i.title || i.name || "Nicotine Pouch Pack"),
      Quantity: qtyNum,
      ItemPrice: priceNum,
      RowTotal: parseFloat((priceNum * qtyNum).toFixed(2)),
      ImageURL: i.image || i.imageUrl || "",
      IsSubscription: isSubscriptionLineItem(i)
    };
  });
  const nameParts = String(options.customerName || "").trim().split(/\s+/);
  return trackKlaviyoEvent("Started Checkout", email, {
    // Ties the event to one checkout attempt so a retry is not counted twice.
    ...options.checkoutId ? { $event_id: options.checkoutId, CheckoutId: options.checkoutId } : {},
    $value: totalValue,
    ItemNames: formattedItems.map((i) => i.ProductName),
    Items: formattedItems,
    Categories: ["Nicotine Pouches", "Storefront"],
    IsSubscription: options.recurring ?? formattedItems.some((i) => i.IsSubscription)
  }, {
    first_name: nameParts[0] || void 0,
    last_name: nameParts.slice(1).join(" ") || void 0
  });
}
async function trackPurchaseCompleted(order) {
  const settings = await getKlaviyoSettings();
  if (settings.trackEvents && settings.trackEvents.purchase === false) return;
  const email = (order.customerEmail || "customer@pouch-supply.com").toLowerCase().trim();
  const nameParts = (order.customerName || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "Valued";
  const lastName = nameParts.slice(1).join(" ") || "Customer";
  const rawItems = Array.isArray(order.items) ? order.items : [];
  const formattedItems = rawItems.map((i) => {
    const priceNum = typeof i.price === "number" ? i.price : parseFloat(i.price) || 0;
    const qtyNum = typeof i.quantity === "number" ? i.quantity : parseInt(i.quantity) || 1;
    return {
      ProductID: String(i.productId || i.id || "prod-generic"),
      SKU: String(i.sku || i.productId || i.id || "SKU-001"),
      ProductName: String(i.productTitle || i.title || i.name || "Nicotine Pouch Pack"),
      Quantity: qtyNum,
      ItemPrice: priceNum,
      Price: priceNum,
      RowTotal: parseFloat((priceNum * qtyNum).toFixed(2)),
      ImageURL: i.image || i.imageUrl || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300",
      Vendor: i.vendor || "Pouch Supply Co.",
      IsSubscription: isSubscriptionLineItem(i),
      IsRewardItem: Boolean(i.isRewardItem)
    };
  });
  const itemNames = formattedItems.map((i) => i.ProductName);
  const totalVal = typeof order.total === "number" ? order.total : parseFloat(order.total) || 0;
  const orderIdStr = String(order.id || order.orderId || `PS${Math.floor(Math.random() * 9e4 + 1e4)}`);
  const isSubscriptionOrder2 = Boolean(
    order.isSubscription || order.subscriptionId || formattedItems.some((i) => i.IsSubscription) || Array.isArray(order.tags) && order.tags.some((t) => String(t).toLowerCase().includes("subscription"))
  );
  const isRenewal = Boolean(
    order.isRenewal || Array.isArray(order.tags) && order.tags.some((t) => String(t).toLowerCase().includes("renewal")) || formattedItems.some((i) => /recurring renewal/i.test(String(i.ProductName)))
  );
  await syncKlaviyoProfileWithConsent(email, firstName, lastName);
  const placedOrderRes = await trackKlaviyoEvent("Placed Order", email, {
    $event_id: orderIdStr,
    $value: totalVal,
    OrderId: orderIdStr,
    order_id: orderIdStr,
    ItemNames: itemNames,
    Items: formattedItems,
    Categories: ["Nicotine Pouches", "Storefront"],
    IsSubscription: isSubscriptionOrder2,
    IsRenewal: isRenewal,
    OrderType: isSubscriptionOrder2 ? isRenewal ? "Subscription Renewal" : "Subscription" : "One-off",
    Destination: order.destination || order.address || "United Kingdom",
    DeliveryMethod: order.deliveryMethod || "Royal Mail Tracked 24/48",
    DiscountApplied: order.discountApplied || null,
    StoreCreditApplied: order.storeCreditApplied || 0,
    ShippingAddress: {
      first_name: firstName,
      last_name: lastName,
      address1: order.destination || order.address || "United Kingdom"
    },
    extra: {
      order_id: orderIdStr,
      items: formattedItems,
      total: totalVal,
      date: order.date || (/* @__PURE__ */ new Date()).toISOString()
    }
  }, {
    $email: email,
    $first_name: firstName,
    $last_name: lastName,
    first_name: firstName,
    last_name: lastName
  });
  for (const item of formattedItems) {
    try {
      await trackKlaviyoEvent("Ordered Product", email, {
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
    } catch (e) {
    }
  }
  return placedOrderRes;
}
async function trackSubscriptionStarted(subscription, order) {
  const settings = await getKlaviyoSettings();
  if (settings.trackEvents && settings.trackEvents.purchase === false) return;
  const email = String(
    subscription?.customerEmail || order?.customerEmail || "customer@pouch-supply.com"
  ).toLowerCase().trim();
  const nameParts = String(subscription?.customerName || order?.customerName || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "Valued";
  const lastName = nameParts.slice(1).join(" ") || "Customer";
  const subId = String(subscription?.id || subscription?.subscriptionId || "");
  const amount = typeof subscription?.amount === "number" ? subscription.amount : parseFloat(subscription?.amount) || 0;
  await syncKlaviyoProfileWithConsent(email, firstName, lastName);
  return trackKlaviyoEvent("Started Subscription", email, {
    // One event per subscription, so a retried webhook cannot duplicate it.
    ...subId ? { $event_id: `sub_started_${subId}` } : {},
    $value: amount,
    SubscriptionID: subId,
    PlanName: subscription?.planName || subscription?.planId || "Subscription Plan",
    PlanId: subscription?.planId || null,
    BillingInterval: subscription?.billingInterval || "bi-weekly",
    NextBillingDate: subscription?.nextBillingDate || null,
    ItemPrice: subscription?.itemPrice ?? null,
    ShippingCost: subscription?.shippingCost ?? null,
    Currency: subscription?.currency || "GBP",
    FirstOrderId: order?.id || order?.orderId || null,
    IsSubscription: true,
    Categories: ["Nicotine Pouches", "Subscription"]
  }, {
    first_name: firstName,
    last_name: lastName
  });
}
async function trackOrderRefunded(order, refundAmount) {
  const settings = await getKlaviyoSettings();
  if (!settings.trackEvents.refunded) return;
  const email = order.customerEmail || "customer@pouch-supply.com";
  return trackKlaviyoEvent("Refunded Order", email, {
    $event_id: String(order.id || order.orderId),
    $value: refundAmount !== void 0 ? refundAmount : order.total,
    OrderId: String(order.id || order.orderId)
  });
}
async function trackWishlistAdded(email, item) {
  const settings = await getKlaviyoSettings();
  if (!settings.trackEvents.wishlist) return;
  return trackKlaviyoEvent("Added to Wishlist", email, {
    ProductName: item.title,
    ProductID: item.id,
    Price: item.price
  });
}
async function trackOrderShipped(order, trackingNumber, carrier) {
  const email = order.customerEmail || "customer@pouch-supply.com";
  return trackKlaviyoEvent("Order Shipped", email, {
    $event_id: String(order.id || order.orderId),
    OrderId: String(order.id || order.orderId),
    Carrier: carrier || order.carrier || "Royal Mail",
    TrackingNumber: trackingNumber || order.trackingNumber || order.trackingId,
    TrackingUrl: `https://www.royalmail.com/track-your-item#/tracking-results/${trackingNumber || order.trackingNumber || order.trackingId}`,
    Destination: order.destination || order.address
  });
}
var DEFAULT_KLAVIYO_SETTINGS;
var init_klaviyoService = __esm({
  "backend/services/klaviyoService.ts"() {
    init_serverDb();
    DEFAULT_KLAVIYO_SETTINGS = {
      enabled: true,
      apiKey: process.env.KLAVIYO_API_KEY || "",
      siteId: process.env.KLAVIYO_SITE_ID || process.env.KLAVIYO_PUBLIC_KEY || process.env.NEXT_PUBLIC_KLAVIYO_COMPANY_ID || "VPbY66",
      publicKey: process.env.KLAVIYO_SITE_ID || process.env.KLAVIYO_PUBLIC_KEY || process.env.NEXT_PUBLIC_KLAVIYO_COMPANY_ID || "VPbY66",
      listId: "",
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
  }
});

// src/utils/ukValidation.ts
function isUkCountry(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return false;
  return UK_COUNTRY_TOKENS.has(raw);
}
function normalizeUkPostcode(value) {
  const compact = String(value ?? "").toUpperCase().replace(/\s+/g, "");
  if (compact.length < 5) return compact;
  return `${compact.slice(0, compact.length - 3)} ${compact.slice(-3)}`;
}
function isValidUkPostcode(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return false;
  return UK_POSTCODE_RE.test(raw.replace(/\s+/g, " "));
}
function normalizeUkPhone(value) {
  let digits = String(value ?? "").replace(/[\s().-]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+44")) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith("0044")) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith("44") && digits.length >= 11) digits = `0${digits.slice(2)}`;
  if (!/^0\d+$/.test(digits)) return "";
  if (digits.length < 10 || digits.length > 11) return "";
  return digits;
}
function isValidUkPhone(value) {
  return normalizeUkPhone(value).length > 0;
}
function validateUkDelivery(input) {
  const errors = [];
  const country = input.country || input.countryCode || "";
  if (!isUkCountry(country)) {
    errors.push(
      "We currently deliver to United Kingdom addresses only. Please use a UK delivery address to place your order."
    );
  }
  if (!String(input.postcode ?? "").trim()) {
    errors.push("A UK postcode is required.");
  } else if (!isValidUkPostcode(input.postcode)) {
    errors.push("Please enter a valid UK postcode (for example SW1A 1AA).");
  }
  if (!String(input.phone ?? "").trim()) {
    errors.push("A contact phone number is required so we can reach you about your delivery.");
  } else if (!isValidUkPhone(input.phone)) {
    errors.push("Please enter a valid UK phone number (for example 07700 900123).");
  }
  return { valid: errors.length === 0, errors };
}
var UK_COUNTRY_TOKENS, UK_POSTCODE_RE, UK_COUNTRY_CODE, UK_COUNTRY_NAME;
var init_ukValidation = __esm({
  "src/utils/ukValidation.ts"() {
    UK_COUNTRY_TOKENS = /* @__PURE__ */ new Set([
      "gb",
      "uk",
      "gbr",
      "united kingdom",
      "united kingdom of great britain and northern ireland",
      "great britain",
      "britain",
      "england",
      "scotland",
      "wales",
      "northern ireland"
    ]);
    UK_POSTCODE_RE = /^(GIR ?0AA|[A-PR-UWYZ][A-HK-Y]?[0-9][0-9A-HJKPS-UW]? ?[0-9][ABD-HJLNP-UW-Z]{2})$/i;
    UK_COUNTRY_CODE = "GB";
    UK_COUNTRY_NAME = "United Kingdom";
  }
});

// backend/services/discountUsageRules.ts
function releasesDiscount(order) {
  return String(order?.fulfillmentStatus || "") === "Cancelled";
}
function normalizeCode(value) {
  return String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}
function isSameDiscount(a, b) {
  if (!a || !b) return false;
  const aId = String(a?.id ?? "").trim().toLowerCase();
  const bId = String(b?.id ?? "").trim().toLowerCase();
  if (aId && bId) return aId === bId;
  const aCode = normalizeCode(a?.title);
  const bCode = normalizeCode(b?.title);
  return Boolean(aCode) && aCode === bCode;
}
function resolveOnePerCustomer(stored, applied) {
  if (!applied) return false;
  if (stored) return Boolean(stored.limitOnePerCustomer);
  if (String(applied.id || "").startsWith("disc-ref-virtual-")) return true;
  return Boolean(applied.limitOnePerCustomer);
}
function findPriorUseIn(orders, customerEmail, applied, excludeOrderId) {
  const email = String(customerEmail || "").toLowerCase().trim();
  if (!email || !applied) return null;
  const exclude = excludeOrderId ? String(excludeOrderId) : null;
  return (orders || []).find((o) => {
    if (!o) return false;
    const id = String(o.id ?? o.orderId ?? "");
    if (exclude && id === exclude) return false;
    if (String(o.customerEmail || "").toLowerCase().trim() !== email) return false;
    if (releasesDiscount(o)) return false;
    return isSameDiscount(o.discountApplied, applied);
  }) || null;
}
function refusal(applied, prior) {
  const code = String(applied?.title || applied?.id || "This discount code");
  return {
    ok: false,
    // Deliberately no order id: checkout is open to guests, so this message can
    // be produced for any email someone cares to type, and it should not report
    // back what that person has ordered. The id goes to the log instead.
    message: `Discount code "${code}" can only be used once per customer, and you have already used it.`,
    priorOrderId: String(prior?.id ?? prior?.orderId ?? "")
  };
}
var init_discountUsageRules = __esm({
  "backend/services/discountUsageRules.ts"() {
  }
});

// backend/services/newCustomerDiscount.ts
var newCustomerDiscount_exports = {};
__export(newCustomerDiscount_exports, {
  NEW_CUSTOMER_DISCOUNT_ID: () => NEW_CUSTOMER_DISCOUNT_ID,
  NEW_CUSTOMER_LIMIT: () => NEW_CUSTOMER_LIMIT,
  NEW_CUSTOMER_PERCENT: () => NEW_CUSTOMER_PERCENT,
  autoDiscountFor: () => autoDiscountFor,
  buildNewCustomerDiscount: () => buildNewCustomerDiscount,
  checkNewCustomerEligibility: () => checkNewCustomerEligibility,
  isNewCustomerDiscount: () => isNewCustomerDiscount,
  newCustomerPlacesRemaining: () => newCustomerPlacesRemaining
});
function buildNewCustomerDiscount() {
  return {
    id: NEW_CUSTOMER_DISCOUNT_ID,
    title: "New Customer Discount",
    status: "Active",
    method: "Automatic",
    eligibility: "First 50 customers",
    type: "Amount off order",
    valueType: "Percentage",
    valueAmount: NEW_CUSTOMER_PERCENT,
    details: `${NEW_CUSTOMER_PERCENT}% New Customer Discount`,
    used: 0,
    // First order only. The usage check enforces this server-side as well.
    limitOnePerCustomer: true,
    isAutomatic: true
  };
}
async function loadCustomersByJoinDate() {
  const byEmail = /* @__PURE__ */ new Map();
  try {
    const rows = await prisma.customer.findMany({ orderBy: { createdAt: "asc" } });
    for (const row of rows || []) byEmail.set(clean(row.email), row);
  } catch {
  }
  try {
    const stored = await fetchResource("customers") || [];
    for (const row of stored) {
      const email = clean(row?.email);
      if (!email) continue;
      byEmail.set(email, { ...row || {}, ...byEmail.get(email) || {} });
    }
  } catch {
  }
  return Array.from(byEmail.values()).sort((a, b) => {
    const ta = Date.parse(a?.createdAt ?? "") || Number.MAX_SAFE_INTEGER;
    const tb = Date.parse(b?.createdAt ?? "") || Number.MAX_SAFE_INTEGER;
    return ta - tb;
  });
}
async function hasOrdered(email) {
  const wanted = clean(email);
  if (!wanted) return true;
  try {
    const orders = await fetchResource("orders") || [];
    return orders.some((o) => clean(o?.customerEmail) === wanted);
  } catch {
    return true;
  }
}
async function checkNewCustomerEligibility(customerEmail) {
  const email = clean(customerEmail);
  if (!email) return { eligible: false, reason: "No customer email" };
  const customers = await loadCustomersByJoinDate();
  const index = customers.findIndex((c) => clean(c?.email) === email);
  if (index === -1) {
    return { eligible: false, reason: "No account for this email" };
  }
  const position = index + 1;
  if (position > NEW_CUSTOMER_LIMIT) {
    return { eligible: false, position, reason: `Account #${position} is outside the first ${NEW_CUSTOMER_LIMIT}` };
  }
  if (await hasOrdered(email)) {
    return { eligible: false, position, reason: "The offer applies to a first order only" };
  }
  return { eligible: true, position };
}
async function autoDiscountFor(customerEmail) {
  const verdict = await checkNewCustomerEligibility(customerEmail);
  return verdict.eligible ? buildNewCustomerDiscount() : null;
}
function isNewCustomerDiscount(applied) {
  return String(applied?.id || "") === NEW_CUSTOMER_DISCOUNT_ID;
}
async function newCustomerPlacesRemaining() {
  const customers = await loadCustomersByJoinDate();
  return Math.max(0, NEW_CUSTOMER_LIMIT - customers.length);
}
var NEW_CUSTOMER_LIMIT, NEW_CUSTOMER_PERCENT, NEW_CUSTOMER_DISCOUNT_ID, clean;
var init_newCustomerDiscount = __esm({
  "backend/services/newCustomerDiscount.ts"() {
    init_serverDb();
    init_prisma();
    NEW_CUSTOMER_LIMIT = 50;
    NEW_CUSTOMER_PERCENT = 10;
    NEW_CUSTOMER_DISCOUNT_ID = "disc-new-customer-10";
    clean = (v) => String(v || "").toLowerCase().trim();
  }
});

// backend/services/discountUsage.ts
async function storedDiscountFor(applied) {
  try {
    const discounts = await fetchResource("discounts") || [];
    return discounts.find((d) => isSameDiscount(d, applied)) || null;
  } catch {
    return null;
  }
}
async function isOnePerCustomer(applied) {
  if (!applied) return false;
  return resolveOnePerCustomer(await storedDiscountFor(applied), applied);
}
async function findPriorUse(customerEmail, applied, excludeOrderId) {
  if (!customerEmail || !applied) return null;
  let orders = [];
  try {
    orders = await fetchResource("orders") || [];
  } catch {
    return null;
  }
  return findPriorUseIn(orders, customerEmail, applied, excludeOrderId);
}
async function checkDiscountUsable(customerEmail, applied, excludeOrderId) {
  if (!applied) return { ok: true };
  const { isNewCustomerDiscount: isNewCustomerDiscount2, checkNewCustomerEligibility: checkNewCustomerEligibility2 } = await Promise.resolve().then(() => (init_newCustomerDiscount(), newCustomerDiscount_exports));
  if (isNewCustomerDiscount2(applied)) {
    const verdict = await checkNewCustomerEligibility2(customerEmail);
    if (verdict.eligible) return { ok: true };
    return {
      ok: false,
      message: "The New Customer Discount does not apply to this order.",
      priorOrderId: verdict.reason
    };
  }
  if (!await isOnePerCustomer(applied)) return { ok: true };
  const prior = await findPriorUse(customerEmail, applied, excludeOrderId);
  if (!prior) return { ok: true };
  return refusal(applied, prior);
}
var init_discountUsage = __esm({
  "backend/services/discountUsage.ts"() {
    init_serverDb();
    init_discountUsageRules();
  }
});

// backend/services/worldpayRefund.ts
var worldpayRefund_exports = {};
__export(worldpayRefund_exports, {
  refundWorldpayPayment: () => refundWorldpayPayment
});
async function refundWorldpayPayment({
  order,
  amount,
  reason,
  transactionId
}) {
  const username = process.env.WORLDPAY_API_USERNAME || "";
  const password = process.env.WORLDPAY_API_PASSWORD || "";
  const baseUrl = (process.env.WORLDPAY_BASE_URL || "https://access.worldpay.com").replace(/\/+$/, "");
  const txId = transactionId || order?.worldpayTxId || order?.gatewayTxId || "";
  const refundAmount = typeof amount === "number" ? amount : Number(order?.total || 0);
  const refundRef = `WP-REFUND-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  if (!username || !password) {
    return {
      success: false,
      refundRef,
      transactionId: txId,
      amount: refundAmount,
      gatewayContacted: false,
      message: "Worldpay credentials are not configured; the refund was recorded in the store only."
    };
  }
  if (!txId) {
    return {
      success: false,
      refundRef,
      transactionId: "",
      amount: refundAmount,
      gatewayContacted: false,
      message: "No Worldpay transaction id on this order; the refund was recorded in the store only."
    };
  }
  const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  try {
    const response = await fetch(`${baseUrl}/api/payments/${encodeURIComponent(txId)}/refunds`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        value: {
          currency: order?.currency || "GBP",
          amount: Math.round(refundAmount * 100)
        },
        reference: refundRef,
        description: reason || "Customer requested refund"
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errMsg = data?.description || data?.message || `Worldpay API returned status ${response.status}`;
      console.warn("[Worldpay Refund] Gateway rejected the refund:", response.status, errMsg);
      return {
        success: false,
        refundRef,
        transactionId: txId,
        amount: refundAmount,
        gatewayContacted: true,
        message: errMsg
      };
    }
    return {
      success: true,
      refundRef: data?.reference || refundRef,
      transactionId: txId,
      amount: refundAmount,
      gatewayContacted: true,
      message: `Worldpay refund of \xA3${refundAmount.toFixed(2)} accepted by the gateway.`
    };
  } catch (err) {
    console.error("[Worldpay Refund] API call failed:", err);
    return {
      success: false,
      refundRef,
      transactionId: txId,
      amount: refundAmount,
      gatewayContacted: false,
      message: err?.message || "Unable to reach the Worldpay refund endpoint."
    };
  }
}
var init_worldpayRefund = __esm({
  "backend/services/worldpayRefund.ts"() {
  }
});

// backend/routes/orders.ts
var orders_exports = {};
__export(orders_exports, {
  default: () => orders_default,
  saveSingleOrder: () => saveSingleOrder
});
import { Router as Router2 } from "express";
function dispatchOrderNotification(key, order, context = {}) {
  const label = `[Orders Trigger] ${key} for ${order.id}`;
  const fail = (e) => console.warn(`${label} failed:`, e?.message || e);
  switch (key) {
    case "order_confirmation":
      sendOrderConfirmationEmail(order).catch(fail);
      trackPurchaseCompleted(order).catch(fail);
      break;
    case "order_processing":
      sendOrderProcessingEmail(order).catch(fail);
      break;
    case "order_shipped":
      sendOrderShippedEmail(order, order.trackingNumber, order.carrier).catch(fail);
      trackOrderShipped(order, order.trackingNumber, order.carrier).catch(fail);
      break;
    case "out_for_delivery":
      sendOutForDeliveryEmail(order).catch(fail);
      break;
    case "order_delivered":
      sendDeliveredEmail(order).catch(fail);
      break;
    case "order_cancelled":
      sendOrderCancelledEmail(order, context.reason || "Order cancelled by store administrator").catch(fail);
      break;
    case "order_refunded":
      sendOrderRefundedEmail(order, context.refundAmount ?? order.total, context.reason).catch(fail);
      trackOrderRefunded(order, context.refundAmount ?? order.total).catch(fail);
      break;
  }
}
async function saveSingleOrder(orderData) {
  const id = String(orderData.id || orderData.orderId || `PS${Math.floor(Math.random() * 9e4 + 1e4)}`);
  let existingOrder = null;
  try {
    const currentOrders = await fetchResource("orders") || [];
    existingOrder = currentOrders.find((o) => String(o.id) === id);
  } catch (_e) {
  }
  const items = orderData.items || existingOrder?.items || [];
  const subItem = items.find(
    (i) => i.isSubscription || i.vendor === "Subscription Pack" || i.productTitle && (i.productTitle.toLowerCase().includes("subscription") || i.productTitle.toLowerCase().includes("pack"))
  );
  const isSubscription = Boolean(orderData.isSubscription ?? existingOrder?.isSubscription ?? subItem);
  let subscriptionDetails = orderData.subscriptionDetails || existingOrder?.subscriptionDetails || null;
  if (isSubscription && !subscriptionDetails) {
    let planName = subItem?.subscriptionPlan || orderData.subPlan || orderData.subscriptionPlan || "";
    const rawPlan = (subItem?.subscriptionPlan || orderData.subPlan || orderData.subscriptionPlan || "").toLowerCase();
    const title = (subItem?.productTitle || "").toLowerCase();
    const prodId = (subItem?.productId || "").toLowerCase();
    const tierIn = (text) => {
      const heading = String(text || "").toLowerCase().split(/\s+-\s+|\[|\(/)[0];
      const m = heading.match(/\b(ultimate|core|lite|pro)\b/);
      return m ? m[1] : null;
    };
    const tier = tierIn(subItem?.productTitle) || tierIn(subItem?.subscriptionSummary) || tierIn(rawPlan) || tierIn(prodId);
    if (tier) {
      planName = `${tier.toUpperCase()} Plan`;
    } else if (subItem?.subscriptionPlan) {
      planName = subItem.subscriptionPlan;
    } else {
      planName = subItem?.productTitle || "Subscription Plan";
    }
    let frequency = subItem?.subscriptionFrequency || orderData.subscriptionFrequency || "";
    let frequencyDiscount = subItem?.frequencyDiscount || orderData.frequencyDiscount || "";
    if (!frequency) {
      if (title.includes("next day") || title.includes("1 day")) {
        frequency = "Next Day (Test)";
      } else if (title.includes("weekly") && !title.includes("bi")) {
        frequency = "Weekly";
      } else if (title.includes("bi-weekly") || title.includes("by weekly") || title.includes("2 week")) {
        frequency = "Bi-Weekly";
      } else if (title.includes("month") || title.includes("one month")) {
        frequency = "One Month";
      } else {
        frequency = "Bi-Weekly";
      }
    }
    if (!frequencyDiscount) {
      if (frequency.includes("Next Day")) frequencyDiscount = "10%";
      else if (frequency === "Weekly") frequencyDiscount = "5%";
      else if (frequency === "One Month") frequencyDiscount = "12%";
      else frequencyDiscount = "10%";
    }
    const baseDate = /* @__PURE__ */ new Date();
    const nextDate = new Date(baseDate);
    if (frequency.includes("Next Day")) {
      nextDate.setDate(baseDate.getDate() + 1);
    } else if (frequency === "Weekly") {
      nextDate.setDate(baseDate.getDate() + 7);
    } else if (frequency === "Bi-Weekly") {
      nextDate.setDate(baseDate.getDate() + 14);
    } else {
      nextDate.setDate(baseDate.getDate() + 30);
    }
    const rawSubItems = subItem?.subscriptionItems || subItem?.selectedProducts || subItem?.items || orderData.subscriptionItems || [];
    const PLACEHOLDER_NAMES2 = ["product", "products", "item", "unknown", "n/a", "sku-001", "subscription pack"];
    const isPlaceholderName2 = (value) => {
      const v = String(value ?? "").trim().toLowerCase();
      return !v || PLACEHOLDER_NAMES2.includes(v);
    };
    const cleanVariant = (value) => {
      const v = String(value ?? "").trim();
      return v.toLowerCase() === "standard" ? "" : v;
    };
    const buildLabel = (brand, name, variant, qty) => {
      const parts = [];
      if (brand && !name.toLowerCase().startsWith(brand.toLowerCase())) parts.push(brand);
      if (name) parts.push(name);
      if (variant) parts.push(variant);
      return parts.length > 0 ? `${parts.join(" \u2014 ")} (Qty:${qty})` : `(Qty:${qty})`;
    };
    let subItems = [];
    if (Array.isArray(rawSubItems) && rawSubItems.length > 0) {
      subItems = rawSubItems.map((it) => {
        const p = it && it.product || it || {};
        const name = [it?.productTitle, it?.name, it?.title, p?.title, p?.productTitle, p?.name].map((v) => String(v ?? "").trim()).find((v) => v && !isPlaceholderName2(v)) || "";
        const productId = String(it?.productId || p?.productId || p?.id || "").trim();
        const variantId = String(it?.variantId || it?.concreteVariantId || p?.variantId || "").trim();
        if (!name && !productId && !variantId) return null;
        const brand = String(it?.brand || it?.vendor || p?.vendor || p?.brand || "").trim();
        const variant = cleanVariant(
          it?.variantName || it?.variant || it?.concreteVariantName || p?.concreteVariantName || p?.variantName || p?.variant
        );
        const qty = Number(it?.quantity || p?.quantity || 1) || 1;
        return {
          productId: productId || void 0,
          variantId: variantId || void 0,
          brand: brand || void 0,
          vendor: brand || void 0,
          name,
          productTitle: name,
          variant,
          variantName: variant,
          quantity: qty,
          image: it?.image || p?.image || "",
          price: Number(it?.price || p?.price || 0) || void 0,
          formattedLabel: buildLabel(brand, name, variant, qty)
        };
      }).filter((it) => it && it.name);
    }
    if (subItems.length === 0 && (subItem?.subscriptionSummary || subItem?.productTitle)) {
      const rawTitle = String(subItem.subscriptionSummary || subItem.productTitle).replace(/\)\s*\((?:recurring renewal|renewal)\)\s*$/i, ")").trim();
      let itemsSummary = "";
      const open = rawTitle.indexOf(" - (");
      if (open > -1) {
        const start = open + 4;
        const end = rawTitle.lastIndexOf(")");
        itemsSummary = end > start ? rawTitle.substring(start, end) : rawTitle.substring(start);
      } else if (rawTitle.startsWith("(") && rawTitle.endsWith(")")) {
        itemsSummary = rawTitle.slice(1, -1);
      }
      if (itemsSummary.trim()) {
        const parts = [];
        let cur = "";
        let depth = 0;
        for (const c of itemsSummary) {
          if (c === "(") depth++;
          else if (c === ")") depth--;
          if (c === "," && depth === 0) {
            if (cur.trim()) parts.push(cur.trim());
            cur = "";
          } else {
            cur += c;
          }
        }
        if (cur.trim()) parts.push(cur.trim());
        const parsedProducts = [];
        parts.forEach((part) => {
          let cleanPart = part.trim();
          if (!cleanPart) return;
          let qty = 1;
          const qtyMatch = cleanPart.match(/\(\s*Qty\s*:\s*(\d+)\s*\)/i) || cleanPart.match(/\bx\s*(\d+)\b/i);
          if (qtyMatch) {
            qty = parseInt(qtyMatch[1], 10) || 1;
            cleanPart = cleanPart.replace(/\(\s*Qty\s*:\s*(\d+)\s*\)/i, "").replace(/\bx\s*(\d+)\b/i, "").trim();
          }
          cleanPart = cleanPart.replace(/^[\s)]+/, "").replace(/[\s(]+$/, "").trim();
          if (!cleanPart || isPlaceholderName2(cleanPart)) return;
          let brand = "";
          let name = cleanPart;
          let variant = "";
          if (/\s[—–]\s/.test(cleanPart)) {
            const segments = cleanPart.split(/\s*[—–]\s*/).map((s) => s.trim()).filter(Boolean);
            if (segments.length >= 3) {
              brand = segments[0];
              name = segments[1];
              variant = segments.slice(2).join(" \u2014 ");
            } else if (segments.length === 2) {
              name = segments[0];
              variant = segments[1];
            }
          } else {
            const varMatch = cleanPart.match(/^(.*?)\s*\(([^)]+)\)$/);
            if (varMatch && varMatch[1] && varMatch[2]) {
              name = varMatch[1].trim();
              variant = varMatch[2].trim();
            }
          }
          variant = cleanVariant(variant);
          if (!name) return;
          parsedProducts.push({
            brand: brand || void 0,
            vendor: brand || void 0,
            name,
            productTitle: name,
            variant,
            variantName: variant,
            quantity: qty,
            isReconstructed: true,
            formattedLabel: buildLabel(brand, name, variant, qty)
          });
        });
        subItems = parsedProducts;
      }
    }
    subscriptionDetails = {
      planName,
      frequency,
      frequencyDiscount,
      paymentStatus: "Paid",
      items: subItems,
      selectedProducts: subItems,
      lastPaymentDate: baseDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      nextPaymentDate: nextDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    };
  }
  let tags = Array.isArray(orderData.tags) ? orderData.tags : existingOrder?.tags || ["Storefront", "Online Order"];
  if (isSubscription && !tags.some((t) => t.toLowerCase().includes("subscription"))) {
    tags = [...tags, "Subscription Order"];
  }
  const formattedOrder = {
    id,
    customerName: orderData.customerName || existingOrder?.customerName || "Valued Customer",
    customerEmail: orderData.customerEmail || existingOrder?.customerEmail || "customer@pouch-supply.com",
    tags,
    isSubscription,
    subscriptionDetails,
    fulfillmentStatus: orderData.fulfillmentStatus || existingOrder?.fulfillmentStatus || "Unfulfilled",
    paymentStatus: orderData.paymentStatus || existingOrder?.paymentStatus || (orderData.total === 0 ? "Paid" : "Pending"),
    worldpayTxId: orderData.worldpayTxId || orderData.gatewayTxId || existingOrder?.worldpayTxId || null,
    worldpayAuthCode: orderData.worldpayAuthCode || orderData.gatewayAuthCode || existingOrder?.worldpayAuthCode || null,
    gatewayTxId: orderData.gatewayTxId || orderData.worldpayTxId || existingOrder?.gatewayTxId || null,
    gatewayAuthCode: orderData.gatewayAuthCode || orderData.worldpayAuthCode || existingOrder?.gatewayAuthCode || null,
    cardBrand: orderData.cardBrand || existingOrder?.cardBrand || "Card",
    total: typeof orderData.total === "number" ? orderData.total : parseFloat(orderData.total) || existingOrder?.total || 0,
    subtotal: typeof orderData.subtotal === "number" ? orderData.subtotal : typeof existingOrder?.subtotal === "number" ? existingOrder.subtotal : void 0,
    shippingCost: typeof orderData.shippingCost === "number" ? orderData.shippingCost : typeof orderData.deliveryCost === "number" ? orderData.deliveryCost : typeof existingOrder?.shippingCost === "number" ? existingOrder.shippingCost : void 0,
    deliveryCost: typeof orderData.deliveryCost === "number" ? orderData.deliveryCost : typeof orderData.shippingCost === "number" ? orderData.shippingCost : typeof existingOrder?.deliveryCost === "number" ? existingOrder.deliveryCost : void 0,
    storeCreditApplied: typeof orderData.storeCreditApplied === "number" ? orderData.storeCreditApplied : parseFloat(orderData.storeCreditApplied) || existingOrder?.storeCreditApplied || 0,
    destination: orderData.destination || orderData.address || existingOrder?.destination || "United Kingdom",
    // The address as separate fields, kept alongside the joined display string
    // so a shipping label can be produced without parsing it back apart.
    shippingAddress: (orderData.shippingAddress && typeof orderData.shippingAddress === "object" ? orderData.shippingAddress : null) || existingOrder?.shippingAddress || null,
    date: orderData.date || existingOrder?.date || (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " at " + (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    deliveryMethod: orderData.deliveryMethod || existingOrder?.deliveryMethod || "Royal Mail Tracked 24/48",
    subscriptionId: orderData.subscriptionId || existingOrder?.subscriptionId || null,
    // On a subscription renewal, the order the plan was first bought with, so the
    // admin can trace a renewal back to its origin. Kept on the order object
    // rather than as a new column, so it needs no migration; toOrderRow preserves
    // it inside `data`.
    parentOrderId: orderData.parentOrderId || existingOrder?.parentOrderId || existingOrder?.data?.parentOrderId || null,
    isRenewal: typeof orderData.isRenewal === "boolean" ? orderData.isRenewal : existingOrder?.isRenewal ?? existingOrder?.data?.isRenewal ?? false,
    items,
    discountApplied: orderData.discountApplied || existingOrder?.discountApplied || null,
    // The money actually taken off. Previously only the discount object was
    // stored, leaving the admin and the emails to guess the amount from the
    // difference between subtotal and total.
    discountAmount: typeof orderData.discountAmount === "number" ? orderData.discountAmount : typeof existingOrder?.discountAmount === "number" ? existingOrder.discountAmount : void 0,
    trackingNumber: orderData.trackingNumber || existingOrder?.trackingNumber || null,
    // Kept in step with trackingNumber rather than dropped. This field was absent
    // from the formatted order, so every save discarded it — while a good part of
    // the admin UI and the customer account read `trackingId` first and therefore
    // showed "no tracking" for parcels that had it.
    trackingId: orderData.trackingId || orderData.trackingNumber || existingOrder?.trackingId || existingOrder?.trackingNumber || null,
    carrier: orderData.carrier || existingOrder?.carrier || null,
    data: {
      ...existingOrder?.data || {},
      ...orderData?.data || {},
      shippingCost: orderData.shippingCost ?? existingOrder?.data?.shippingCost,
      deliveryCost: orderData.deliveryCost ?? existingOrder?.data?.deliveryCost,
      subtotal: orderData.subtotal ?? existingOrder?.data?.subtotal,
      parentOrderId: orderData.parentOrderId ?? existingOrder?.data?.parentOrderId,
      isRenewal: orderData.isRenewal ?? existingOrder?.data?.isRenewal,
      address: orderData.address || existingOrder?.data?.address,
      shippingAddress: (orderData.shippingAddress && typeof orderData.shippingAddress === "object" ? orderData.shippingAddress : null) || existingOrder?.data?.shippingAddress || void 0,
      paymentMethod: orderData.paymentMethod || existingOrder?.data?.paymentMethod,
      // Merge rather than overwrite: a caller passing its own `data` block must
      // not be able to wipe the record of what has already been emailed.
      notificationsSent: {
        ...existingOrder?.data?.notificationsSent || {},
        ...orderData?.data?.notificationsSent || {}
      }
    }
  };
  const alreadySent = formattedOrder.data.notificationsSent || {};
  const pending = [];
  const queue = (key, context = {}) => {
    if (alreadySent[key]) {
      console.log(`[Orders Trigger] Skipping ${key} for ${id} \u2014 already sent at ${alreadySent[key]}.`);
      return;
    }
    if (pending.some((p) => p.key === key)) return;
    pending.push({ key, context });
  };
  try {
    const isNewOrder = !existingOrder;
    const paymentJustPaid = existingOrder?.paymentStatus !== "Paid" && formattedOrder.paymentStatus === "Paid";
    if (formattedOrder.paymentStatus === "Paid" && (isNewOrder || paymentJustPaid)) {
      queue("order_confirmation");
    }
    const previousFulfillment = existingOrder?.fulfillmentStatus;
    if (existingOrder && previousFulfillment !== formattedOrder.fulfillmentStatus) {
      console.log(
        `[Orders Trigger] Fulfillment status changed for ${id}: ${previousFulfillment} -> ${formattedOrder.fulfillmentStatus}`
      );
      const key = FULFILLMENT_NOTIFICATION[formattedOrder.fulfillmentStatus];
      if (key) {
        queue(key, { reason: orderData.reason || orderData.cancellationReason });
      }
    }
    if (existingOrder && existingOrder.paymentStatus !== "Refunded" && formattedOrder.paymentStatus === "Refunded") {
      queue("order_refunded", {
        refundAmount: orderData.refundAmount ?? formattedOrder.total,
        reason: orderData.refundReason || orderData.reason
      });
    }
  } catch (triggerErr) {
    console.warn("[Orders Trigger] Error deciding automated notifications:", triggerErr);
  }
  const dispatchedAt = (/* @__PURE__ */ new Date()).toISOString();
  for (const item of pending) {
    formattedOrder.data.notificationsSent[item.key] = dispatchedAt;
  }
  let persistedToNeon = false;
  try {
    const { upsertOrderRow: upsertOrderRow2 } = await Promise.resolve().then(() => (init_orderRow(), orderRow_exports));
    persistedToNeon = await upsertOrderRow2(formattedOrder);
  } catch (prismaErr) {
    console.error("[Orders Router] Neon order write failed for " + id + ":", prismaErr?.message);
  }
  if (!persistedToNeon) {
    console.error(
      "[ORDER NOT PERSISTED] " + id + " is not in the Neon Order table after save. Recover it from the payload below.",
      JSON.stringify(formattedOrder)
    );
  }
  try {
    const currentOrders = await fetchResource("orders") || [];
    const existingIdx = currentOrders.findIndex((o) => String(o.id) === id);
    if (existingIdx !== -1) {
      currentOrders[existingIdx] = { ...currentOrders[existingIdx], ...formattedOrder };
    } else {
      currentOrders.unshift(formattedOrder);
    }
    await saveResource("orders", currentOrders);
  } catch (resourceErr) {
    console.error("[Orders Router] StoreResource save error:", resourceErr);
  }
  for (const item of pending) {
    console.log(`[Orders Trigger] Dispatching ${item.key} for ${id}`);
    dispatchOrderNotification(item.key, formattedOrder, item.context);
  }
  return formattedOrder;
}
function findOrderForWithdrawal(orders, orderId, email) {
  const wantedId = String(orderId || "").trim().replace(/^#/, "").toLowerCase();
  const wantedEmail = String(email || "").trim().toLowerCase();
  if (!wantedId || !wantedEmail) return null;
  const order = orders.find((o) => String(o?.id || "").trim().toLowerCase() === wantedId);
  if (!order) return null;
  if (String(order.customerEmail || "").trim().toLowerCase() !== wantedEmail) return null;
  return order;
}
var router3, FULFILLMENT_NOTIFICATION, WITHDRAWAL_MISMATCH, orders_default;
var init_orders = __esm({
  "backend/routes/orders.ts"() {
    init_serverDb();
    init_emailService();
    init_klaviyoService();
    init_requireAdmin();
    init_ukValidation();
    init_discountUsage();
    router3 = Router2();
    FULFILLMENT_NOTIFICATION = {
      Processing: "order_processing",
      Shipped: "order_shipped",
      "Out for Delivery": "out_for_delivery",
      Delivered: "order_delivered",
      Cancelled: "order_cancelled"
    };
    router3.get("/", requireAdmin, async (_req, res) => {
      try {
        const data = await fetchResource("orders") || [];
        const validOrders = data.filter((o) => o && o.id);
        res.json(validOrders);
      } catch (err) {
        console.error("[Orders Router] GET Error:", err);
        res.status(500).json({ error: err.message || "Failed to fetch orders" });
      }
    });
    router3.get("/mine", requireCustomer, async (req, res) => {
      try {
        const email = req.customer?.email;
        if (!email) {
          return res.status(400).json({
            error: "This endpoint returns the signed-in customer's own orders. Use GET /api/orders as an administrator."
          });
        }
        const data = await fetchResource("orders") || [];
        const mine = data.filter(
          (o) => o && o.id && String(o.customerEmail || "").toLowerCase() === email
        );
        res.json(mine);
      } catch (err) {
        console.error("[Orders Router] GET /mine Error:", err);
        res.status(500).json({ error: err.message || "Failed to fetch your orders" });
      }
    });
    router3.get("/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const orders = await fetchResource("orders") || [];
        const found = orders.find((o) => String(o.id) === String(id));
        if (found) {
          return res.json(found);
        }
        try {
          const { prisma: prisma2 } = await Promise.resolve().then(() => (init_prisma(), prisma_exports));
          const prismaOrder = await prisma2.order.findUnique({ where: { id } });
          if (prismaOrder) {
            return res.json(prismaOrder);
          }
        } catch (_e) {
        }
        res.status(404).json({ error: "Order not found" });
      } catch (err) {
        res.status(500).json({ error: err.message || "Failed to fetch order" });
      }
    });
    router3.put("/:id", requireAdmin, async (req, res) => {
      try {
        const { id } = req.params;
        const orderData = req.body;
        if (!orderData || typeof orderData !== "object") {
          return res.status(400).json({ success: false, error: "Order data object is required" });
        }
        const orders = await fetchResource("orders") || [];
        const existing = orders.find((o) => String(o.id) === String(id));
        if (!existing) {
          return res.status(404).json({ success: false, error: `Order #${id} not found` });
        }
        const saved = await saveSingleOrder({ ...existing, ...orderData, id: String(id) });
        return res.json({ success: true, order: saved });
      } catch (err) {
        console.error("[Orders Router] PUT Error:", err);
        return res.status(500).json({ success: false, error: err.message || "Failed to update order" });
      }
    });
    router3.post("/create", async (req, res) => {
      try {
        const orderData = req.body;
        if (!orderData || typeof orderData !== "object") {
          return res.status(400).json({ error: "Order data object is required" });
        }
        const isCustomerCheckout = !orderData.isRenewal && !orderData.createdByAdmin;
        if (isCustomerCheckout) {
          const address = orderData.shippingAddress && typeof orderData.shippingAddress === "object" ? orderData.shippingAddress : {};
          const check = validateUkDelivery({
            phone: orderData.customerPhone || address.phone,
            postcode: address.postcode,
            country: address.country || address.countryCode || UK_COUNTRY_NAME
          });
          if (!check.valid) {
            return res.status(400).json({ error: check.errors[0], errors: check.errors });
          }
          if (orderData.discountApplied) {
            const usable = await checkDiscountUsable(
              orderData.customerEmail,
              orderData.discountApplied,
              orderData.id || orderData.orderId
            );
            if (!usable.ok) {
              console.warn(
                `[Orders] Refused order ${orderData.id || orderData.orderId} for ${orderData.customerEmail}: discount already used on ${usable.priorOrderId}.`
              );
              return res.status(400).json({ error: usable.message });
            }
          }
        }
        const savedOrder = await saveSingleOrder(orderData);
        res.json({ success: true, order: savedOrder });
      } catch (err) {
        console.error("[Orders Router] POST /create Error:", err);
        res.status(500).json({ error: err.message || "Failed to create order" });
      }
    });
    router3.post("/", requireAdmin, async (req, res) => {
      try {
        const payload = req.body;
        if (Array.isArray(payload)) {
          const currentOrders = await fetchResource("orders") || [];
          const byId = /* @__PURE__ */ new Map();
          currentOrders.forEach((o) => {
            if (o && o.id) byId.set(String(o.id), o);
          });
          for (const orderData of payload) {
            if (!orderData || typeof orderData !== "object") continue;
            const id = String(orderData.id || orderData.orderId || "");
            if (!id) continue;
            const existing = byId.get(id);
            const merged = { ...existing || {}, ...orderData, id };
            if (typeof merged.total !== "number") merged.total = parseFloat(merged.total) || 0;
            if (!Array.isArray(merged.tags)) merged.tags = ["Storefront", "Online Order"];
            if (!Array.isArray(merged.items)) merged.items = [];
            byId.set(id, merged);
          }
          const savedOrders = await saveResource("orders", Array.from(byId.values()));
          return res.json(savedOrders);
        }
        if (payload && typeof payload === "object") {
          const savedOrder = await saveSingleOrder(payload);
          return res.json({ success: true, order: savedOrder });
        } else {
          return res.status(400).json({ error: "Invalid order payload" });
        }
      } catch (err) {
        console.error("[Orders Router] POST Error:", err);
        res.status(500).json({ error: err.message || "Failed to persist orders" });
      }
    });
    router3.post("/:id/cancel", requireCustomer, async (req, res) => {
      try {
        const { id } = req.params;
        const { reason, refundMethod = "original", customerEmail } = req.body;
        const currentOrders = await fetchResource("orders") || [];
        const foundIdx = currentOrders.findIndex((o) => String(o.id) === String(id));
        if (foundIdx === -1) {
          return res.status(404).json({ error: "Order not found" });
        }
        const order = currentOrders[foundIdx];
        if (!mayActOnCustomer(req, order.customerEmail)) {
          return res.status(404).json({ error: "Order not found" });
        }
        if (order.fulfillmentStatus === "Shipped" || order.fulfillmentStatus === "Delivered") {
          return res.status(400).json({ error: "Order has already shipped and cannot be directly cancelled. Please request a return." });
        }
        if (order.fulfillmentStatus === "Cancelled" || order.paymentStatus === "Refunded") {
          return res.status(400).json({ error: "Order is already cancelled or refunded." });
        }
        const cancellationReason = reason || "Customer requested cancellation";
        const patch = {
          ...order,
          fulfillmentStatus: "Cancelled",
          paymentStatus: "Refunded",
          cancellationReason,
          cancelledAt: (/* @__PURE__ */ new Date()).toISOString(),
          reason: cancellationReason,
          refundAmount: order.total,
          refundReason: `Cancellation refund (${refundMethod === "store_credit" ? "Store Credit" : "Original Payment"})`
        };
        if (refundMethod === "store_credit") {
          try {
            const customersList = await fetchResource("customers") || [];
            const cIdx = customersList.findIndex((c) => c.email.toLowerCase() === (order.customerEmail || "").toLowerCase());
            if (cIdx !== -1) {
              customersList[cIdx].storeCredit = (customersList[cIdx].storeCredit || 0) + (order.total || 0);
              await saveResource("customers", customersList);
              console.log(`[Cancel Order] Added \xA3${order.total} store credit to ${order.customerEmail}`);
            }
          } catch (custErr) {
            console.warn("[Cancel Order] Failed to update customer store credit:", custErr);
          }
        } else {
          if (order.worldpayTxId || order.gatewayTxId) {
            try {
              const { refundWorldpayPayment: refundWorldpayPayment2 } = await Promise.resolve().then(() => (init_worldpayRefund(), worldpayRefund_exports));
              await refundWorldpayPayment2({
                order,
                amount: order.total,
                reason: `Customer cancellation: ${reason || "Changed mind"}`,
                transactionId: order.worldpayTxId || order.gatewayTxId
              });
            } catch (wpErr) {
              console.warn("[Cancel Order] Worldpay refund trigger notice:", wpErr);
            }
          }
        }
        patch.returnRequest = {
          type: "Cancellation",
          reason: cancellationReason,
          refundMethod,
          status: "Completed",
          requestedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        const updatedOrder = await saveSingleOrder(patch);
        res.json({ success: true, message: "Order successfully cancelled and refund initiated.", order: updatedOrder });
      } catch (err) {
        console.error("[Orders Router] POST /:id/cancel Error:", err);
        res.status(500).json({ error: err.message || "Failed to cancel order" });
      }
    });
    router3.post("/:id/return-request", requireCustomer, async (req, res) => {
      try {
        const { id } = req.params;
        const { type, reason, itemsToReturn, exchangeNotes, refundMethod } = req.body;
        if (!type || !reason) {
          return res.status(400).json({ error: "Request type and reason are required." });
        }
        const currentOrders = await fetchResource("orders") || [];
        const foundIdx = currentOrders.findIndex((o) => String(o.id) === String(id));
        if (foundIdx === -1) {
          return res.status(404).json({ error: "Order not found" });
        }
        const order = currentOrders[foundIdx];
        if (!mayActOnCustomer(req, order.customerEmail)) {
          return res.status(404).json({ error: "Order not found" });
        }
        const returnRequest = {
          type: type || "Return",
          // 'Return' | 'Refund' | 'Exchange'
          reason,
          itemsToReturn: itemsToReturn || order.items || [],
          exchangeNotes: exchangeNotes || "",
          refundMethod: refundMethod || "original",
          status: "Pending",
          // 'Pending' | 'Approved' | 'Declined' | 'Completed'
          requestedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        const existingTags = Array.isArray(order.tags) ? [...order.tags] : [];
        if (!existingTags.includes(`${type} Requested`)) {
          existingTags.push(`${type} Requested`);
        }
        const updatedOrder = await saveSingleOrder({
          ...order,
          returnRequest,
          tags: existingTags
        });
        try {
          if (type === "Exchange") {
            const { sendOrderExchangedEmail: sendOrderExchangedEmail2 } = await Promise.resolve().then(() => (init_emailService(), emailService_exports));
            await sendOrderExchangedEmail2(updatedOrder, exchangeNotes || "Product exchange requested", reason);
          } else {
            const { sendOrderCancelledEmail: sendOrderCancelledEmail2 } = await Promise.resolve().then(() => (init_emailService(), emailService_exports));
            await sendOrderCancelledEmail2(updatedOrder, `Return/Refund request initiated: ${reason}`);
          }
        } catch (e) {
          console.warn("Return request email notification error:", e);
        }
        res.json({ success: true, message: `${type} request submitted successfully. Our team will review your request.`, order: updatedOrder });
      } catch (err) {
        console.error("[Orders Router] Return Request Error:", err);
        res.status(500).json({ error: err.message || "Failed to submit return request" });
      }
    });
    WITHDRAWAL_MISMATCH = "We could not find an order with that number and email address. Please check both against your order confirmation email.";
    router3.post("/withdrawal/lookup", async (req, res) => {
      try {
        const { orderId, email } = req.body || {};
        const orders = await fetchResource("orders") || [];
        const order = findOrderForWithdrawal(orders, orderId, email);
        if (!order) return res.status(404).json({ error: WITHDRAWAL_MISMATCH });
        return res.json({
          order: {
            id: order.id,
            customerName: order.customerName,
            date: order.date,
            total: order.total,
            alreadyRequested: Boolean(order.returnRequest),
            items: (Array.isArray(order.items) ? order.items : []).map((i) => ({
              productId: i?.productId,
              productTitle: i?.productTitle,
              price: Number(i?.price) || 0,
              quantity: Number(i?.quantity) || 1,
              image: i?.image || ""
            }))
          }
        });
      } catch (err) {
        console.error("[Orders Router] Withdrawal lookup error:", err);
        res.status(500).json({ error: "Could not check that order. Please try again." });
      }
    });
    router3.post("/withdrawal", async (req, res) => {
      try {
        const { orderId, email, name, selectedItems, reason } = req.body || {};
        const orders = await fetchResource("orders") || [];
        const order = findOrderForWithdrawal(orders, orderId, email);
        if (!order) return res.status(404).json({ error: WITHDRAWAL_MISMATCH });
        const orderItems = Array.isArray(order.items) ? order.items : [];
        const wanted = Array.isArray(selectedItems) ? selectedItems.map(String) : [];
        const itemsToReturn = wanted.length ? orderItems.filter((i) => wanted.includes(String(i?.productId))) : orderItems;
        if (itemsToReturn.length === 0) {
          return res.status(400).json({ error: "Select at least one item to withdraw." });
        }
        const refundDue = Number(
          itemsToReturn.reduce((sum2, i) => sum2 + (Number(i?.price) || 0) * (Number(i?.quantity) || 1), 0).toFixed(2)
        );
        const tags = Array.isArray(order.tags) ? [...order.tags] : [];
        if (!tags.includes("Withdrawal Requested")) tags.push("Withdrawal Requested");
        const updatedOrder = await saveSingleOrder({
          ...order,
          tags,
          // Deliberately NOT paymentStatus: 'Refunded'. This is a request; the money
          // moves when an administrator processes it through /:id/admin-action, and
          // showing an order as refunded before that told the customer and the shop
          // that they had been paid back when nothing had left the account.
          returnRequest: {
            type: "Withdrawal",
            reason: String(reason || "Consumer right of withdrawal").slice(0, 500),
            itemsToReturn,
            refundMethod: "original",
            status: "Pending",
            requestedAt: (/* @__PURE__ */ new Date()).toISOString(),
            requestedBy: String(name || order.customerName || "").slice(0, 120),
            refundDue
          }
        });
        try {
          const { sendOrderCancelledEmail: sendOrderCancelledEmail2 } = await Promise.resolve().then(() => (init_emailService(), emailService_exports));
          await sendOrderCancelledEmail2(
            updatedOrder,
            `Withdrawal requested for ${itemsToReturn.length} item(s), \xA3${refundDue.toFixed(2)}. Our team will confirm your refund shortly.`
          );
        } catch (mailErr) {
          console.error(`[Orders Router] Withdrawal email failed for ${order.id}:`, mailErr?.message);
        }
        console.log(`[Orders Router] Withdrawal requested for ${order.id}: ${itemsToReturn.length} item(s), \xA3${refundDue.toFixed(2)}.`);
        return res.json({
          success: true,
          orderId: order.id,
          itemCount: itemsToReturn.length,
          refundDue,
          message: "Your withdrawal request has been registered. We will email you once it is processed."
        });
      } catch (err) {
        console.error("[Orders Router] Withdrawal error:", err);
        res.status(500).json({ error: "Could not register the request. Please try again." });
      }
    });
    router3.post("/:id/admin-action", requireAdmin, async (req, res) => {
      try {
        const { id } = req.params;
        const { action, refundAmount, reason } = req.body;
        const currentOrders = await fetchResource("orders") || [];
        const foundIdx = currentOrders.findIndex((o) => String(o.id) === String(id));
        if (foundIdx === -1) {
          return res.status(404).json({ error: "Order not found" });
        }
        const order = currentOrders[foundIdx];
        const amountToRefund = typeof refundAmount === "number" ? refundAmount : order.total || 0;
        const patch = { ...order };
        let runExchangeEmail = false;
        if (action === "approve_return" || action === "process_refund") {
          patch.paymentStatus = "Refunded";
          patch.refundAmount = amountToRefund;
          patch.refundReason = reason || "Refund processed by store administrator";
          if (order.returnRequest) {
            patch.returnRequest = {
              ...order.returnRequest,
              status: "Completed",
              processedAt: (/* @__PURE__ */ new Date()).toISOString()
            };
          }
          if (order.worldpayTxId || order.gatewayTxId) {
            try {
              const { refundWorldpayPayment: refundWorldpayPayment2 } = await Promise.resolve().then(() => (init_worldpayRefund(), worldpayRefund_exports));
              const refundResult = await refundWorldpayPayment2({
                order,
                amount: amountToRefund,
                reason: reason || "Admin processed refund",
                transactionId: order.worldpayTxId || order.gatewayTxId
              });
              patch.refundDetails = {
                refundRef: refundResult.refundRef,
                amount: refundResult.amount,
                reason: reason || "Admin processed refund",
                gatewayContacted: refundResult.gatewayContacted,
                gatewayMessage: refundResult.message,
                refundedAt: (/* @__PURE__ */ new Date()).toISOString()
              };
            } catch (wpErr) {
              console.warn("[Admin Action] Worldpay refund trigger notice:", wpErr);
            }
          }
        } else if (action === "complete_exchange") {
          patch.fulfillmentStatus = "Exchanged";
          if (order.returnRequest) {
            patch.returnRequest = {
              ...order.returnRequest,
              status: "Completed",
              completedAt: (/* @__PURE__ */ new Date()).toISOString()
            };
          }
          runExchangeEmail = true;
        } else if (action === "mark_delivered") {
          if (order.fulfillmentStatus === "Cancelled") {
            return res.status(409).json({
              error: "This order is cancelled and cannot be marked delivered."
            });
          }
          patch.fulfillmentStatus = "Delivered";
          patch.data = {
            ...order.data || {},
            deliveredAt: (/* @__PURE__ */ new Date()).toISOString(),
            deliveredBy: "admin"
          };
        } else if (action === "decline_return") {
          if (order.returnRequest) {
            patch.returnRequest = {
              ...order.returnRequest,
              status: "Declined",
              declinedReason: reason || "Request declined by administrator"
            };
          }
        }
        const updatedOrder = await saveSingleOrder(patch);
        if (runExchangeEmail) {
          const { sendOrderExchangedEmail: sendOrderExchangedEmail2 } = await Promise.resolve().then(() => (init_emailService(), emailService_exports));
          sendOrderExchangedEmail2(updatedOrder, "Exchange replacement item dispatched", reason || "Exchange approved").catch((e) => console.warn("Exchange email fail:", e));
        }
        res.json({ success: true, message: `Admin action '${action}' processed successfully.`, order: updatedOrder });
      } catch (err) {
        console.error("[Orders Router] Admin Action Error:", err);
        res.status(500).json({ error: err.message || "Failed to execute admin action" });
      }
    });
    router3.delete("/:id", requireAdmin, async (req, res) => {
      try {
        const { id } = req.params;
        const deleted = await deleteSingleItem("orders", id);
        if (deleted) {
          return res.json({ success: true, deletedId: id });
        } else {
          return res.status(404).json({ error: "Order not found or could not be deleted" });
        }
      } catch (err) {
        console.error("[Orders Router] DELETE Error:", err);
        res.status(500).json({ error: err.message || "Failed to delete order" });
      }
    });
    orders_default = router3;
  }
});

// backend/services/planCatalogue.ts
function normalisePlan(raw) {
  const slug = String(raw?.slug || "").trim().toLowerCase();
  const price = Number(raw?.price);
  if (!slug || !Number.isFinite(price) || price <= 0) return null;
  return {
    slug,
    name: String(raw?.name || slug).trim(),
    price,
    limit: Number(raw?.limit) || 0
  };
}
async function getPlanCatalogue(pages) {
  let customPages = pages;
  if (!customPages) {
    try {
      customPages = await fetchResource("customPages") || [];
    } catch {
      customPages = [];
    }
  }
  const bySlug = /* @__PURE__ */ new Map();
  for (const page of customPages || []) {
    const sections = Array.isArray(page?.sections) ? page.sections : [];
    for (const section of sections) {
      if (String(section?.type || "") !== "Plans") continue;
      const items = section?.settings?.planItems;
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        const plan = normalisePlan(item);
        if (plan && !bySlug.has(plan.slug)) bySlug.set(plan.slug, plan);
      }
    }
  }
  if (bySlug.size === 0) return [...FALLBACK_PLANS];
  for (const fallback of FALLBACK_PLANS) {
    if (!bySlug.has(fallback.slug)) bySlug.set(fallback.slug, fallback);
  }
  return Array.from(bySlug.values());
}
function findPlan(catalogue, planIdOrName) {
  const raw = String(planIdOrName || "").trim().toLowerCase();
  if (!raw) return null;
  const exact = catalogue.find((p) => p.slug === raw);
  if (exact) return exact;
  const byName = catalogue.find((p) => p.name.toLowerCase() === raw);
  if (byName) return byName;
  const firstWord = raw.split(/[\s(]+/)[0];
  return catalogue.find((p) => p.slug === firstWord || p.name.toLowerCase() === firstWord) || null;
}
function planForSubscription(catalogue, sub) {
  return findPlan(catalogue, sub?.planId) || findPlan(catalogue, sub?.planName);
}
var FALLBACK_PLANS;
var init_planCatalogue = __esm({
  "backend/services/planCatalogue.ts"() {
    init_serverDb();
    FALLBACK_PLANS = [
      { slug: "lite", name: "LITE", price: 27.99, limit: 6 },
      { slug: "core", name: "CORE", price: 35.99, limit: 9 },
      { slug: "pro", name: "PRO", price: 40.99, limit: 12 },
      { slug: "ultimate", name: "ULTIMATE", price: 46.99, limit: 12 }
    ];
  }
});

// src/lib/subscriptionPricing.ts
function frequencyDiscountPercent(_frequency) {
  return 0;
}
function computeRecurringAmount({
  planPrice,
  extraCans = 0,
  frequency,
  shippingCost = 0
}) {
  const base = Number(planPrice) || 0;
  const extras = Math.max(0, Number(extraCans) || 0) * EXTRA_CAN_PRICE;
  const discounted = (base + extras) * ((100 - frequencyDiscountPercent(frequency)) / 100);
  const shipping = Math.max(0, Number(shippingCost) || 0);
  return pennies(discounted + shipping);
}
function defaultShippingFor(itemsTotal) {
  return Number(itemsTotal) >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
}
function existingShippingFor(sub) {
  const candidates = [
    sub?.shippingCost,
    sub?.shippingFee,
    sub?.shippingAmount,
    sub?.deliveryCost
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return defaultShippingFor(Number(sub?.itemPrice) || 0);
}
function isSubscriptionLine(item) {
  if (!item) return false;
  if (item.isSubscription) return true;
  if (String(item.vendor || "").trim().toLowerCase() === "subscription pack") return true;
  const ids = [item.productId, item.sku].map((v) => String(v || "").toLowerCase());
  return ids.some((v) => v.includes("sub-pack"));
}
function subscriptionLinesTotal(items) {
  return (Array.isArray(items) ? items : []).filter(isSubscriptionLine).reduce((sum2, it) => sum2 + Number(it?.price || 0) * (Number(it?.quantity) || 1), 0);
}
function recurringAmountForNewSubscription(input) {
  const subItemsTotal = Number(input.subItemsTotal) || 0;
  const orderShipping = Number(input.orderShipping) || 0;
  const coupon = Number(input.discountAmount);
  const credit = Number(input.storeCreditApplied);
  const oneOffReduction = pennies(
    (Number.isFinite(coupon) && coupon > 0 ? coupon : 0) + (Number.isFinite(credit) && credit > 0 ? credit : 0)
  );
  const shippingChargedOnDiscountedValue = oneOffReduction > 0 && orderShipping > 0 && subItemsTotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = input.rewardWaivedDelivery ? defaultShippingFor(subItemsTotal) : shippingChargedOnDiscountedValue ? 0 : orderShipping;
  const amount = subItemsTotal > 0 ? pennies(subItemsTotal + shipping) : pennies(Math.max(Number(input.orderTotal) || 0, 0) + oneOffReduction);
  return { amount, shipping, oneOffReduction };
}
var EXTRA_CAN_PRICE, pennies, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING;
var init_subscriptionPricing = __esm({
  "src/lib/subscriptionPricing.ts"() {
    EXTRA_CAN_PRICE = 3.8;
    pennies = (n) => Number((Math.round(n * 100) / 100).toFixed(2));
    FREE_SHIPPING_THRESHOLD = 40;
    STANDARD_SHIPPING = 2.99;
  }
});

// backend/services/subscriptionPricingService.ts
function noticeDateFrom(now = /* @__PURE__ */ new Date(), days = PRICE_CHANGE_NOTICE_DAYS) {
  const d = new Date(now.getTime());
  d.setDate(d.getDate() + days);
  return d;
}
function resolveEffectiveAmount(sub, now = /* @__PURE__ */ new Date()) {
  const current = Number(sub?.amount);
  const pending = Number(sub?.pendingAmount);
  const effectiveFrom = sub?.pendingAmountEffectiveFrom ? new Date(sub.pendingAmountEffectiveFrom) : null;
  const hasPending = Number.isFinite(pending) && pending > 0 && effectiveFrom instanceof Date && !isNaN(effectiveFrom.getTime());
  if (hasPending && now.getTime() >= effectiveFrom.getTime()) {
    return { amount: pending, promote: true };
  }
  return { amount: Number.isFinite(current) && current > 0 ? current : 0, promote: false };
}
function clearedPendingFields() {
  return {
    pendingAmount: null,
    pendingAmountEffectiveFrom: null,
    pendingAmountPrevious: null,
    pendingAmountReason: null,
    pendingAmountScheduledAt: null
  };
}
function applyPlanPriceDelta(sub, previousPlanPrice, newPlanPrice) {
  const current = Number(sub?.amount);
  if (!Number.isFinite(current) || current <= 0) return 0;
  const rawDelta = Number(newPlanPrice) - Number(previousPlanPrice);
  if (!Number.isFinite(rawDelta) || rawDelta === 0) return current;
  const multiplier = (100 - frequencyDiscountPercent(sub?.billingInterval)) / 100;
  const next = current + rawDelta * multiplier;
  if (next <= 0) return current;
  return Number((Math.round(next * 100) / 100).toFixed(2));
}
function repriceForPlan(sub, plan) {
  const included = Number(plan.limit) || 0;
  const cans = Number(sub?.cansCount) || 0;
  const extraCans = included > 0 && cans > included ? cans - included : 0;
  return computeRecurringAmount({
    planPrice: plan.price,
    extraCans,
    frequency: sub?.billingInterval,
    shippingCost: existingShippingFor(sub)
  });
}
async function loadBillableSubscriptions() {
  const byId = /* @__PURE__ */ new Map();
  try {
    const rows = await prisma.subscription.findMany({ where: { status: "active" } });
    for (const row of rows || []) byId.set(String(row.id), row);
  } catch {
  }
  try {
    const stored = await fetchResource("subscriptions") || [];
    for (const row of stored) {
      if (!row?.id) continue;
      const key = String(row.id);
      byId.set(key, { ...row || {}, ...byId.get(key) || {} });
    }
  } catch {
  }
  return Array.from(byId.values()).filter(
    (s) => String(s?.status || "").toLowerCase() === "active"
  );
}
async function persistPendingFields(updates) {
  if (updates.size === 0) return;
  const stored = await fetchResource("subscriptions") || [];
  const next = stored.map((s) => {
    const patch = updates.get(String(s?.id));
    return patch ? { ...s, ...patch } : s;
  });
  await saveResource("subscriptions", next);
}
async function schedulePlanPriceChange(changes, pages, now = /* @__PURE__ */ new Date()) {
  if (!changes.length) return [];
  const catalogue = await getPlanCatalogue(pages);
  const wanted = new Map(changes.map((c) => [c.slug.toLowerCase(), c]));
  const subs = await loadBillableSubscriptions();
  const effectiveFrom = noticeDateFrom(now).toISOString();
  const updates = /* @__PURE__ */ new Map();
  const scheduled = [];
  for (const sub of subs) {
    const plan = planForSubscription(catalogue, sub);
    if (!plan) continue;
    const change = wanted.get(plan.slug);
    if (!change) continue;
    const currentAmount = Number(sub.amount) || 0;
    const newAmount = applyPlanPriceDelta(sub, change.from, change.to);
    if (!Number.isFinite(newAmount) || newAmount <= 0) continue;
    if (Math.abs(newAmount - currentAmount) < 0.01) continue;
    const pending = {
      pendingAmount: newAmount,
      pendingAmountEffectiveFrom: effectiveFrom,
      pendingAmountPrevious: currentAmount,
      pendingAmountReason: "admin_plan_price",
      pendingAmountScheduledAt: now.toISOString()
    };
    updates.set(String(sub.id), pending);
    scheduled.push({
      subscriptionId: String(sub.id),
      customerEmail: String(sub.customerEmail || ""),
      customerName: sub.customerName || void 0,
      planName: plan.name,
      previousAmount: currentAmount,
      newAmount,
      effectiveFrom,
      billingInterval: sub.billingInterval || void 0
    });
  }
  await persistPendingFields(updates);
  return scheduled;
}
function diffPlanPrices(before, after) {
  const beforeBySlug = new Map(before.map((p) => [p.slug, p]));
  const changes = [];
  for (const plan of after) {
    const old = beforeBySlug.get(plan.slug);
    if (!old) continue;
    if (Math.abs(Number(old.price) - Number(plan.price)) >= 0.01) {
      changes.push({ slug: plan.slug, from: Number(old.price), to: Number(plan.price) });
    }
  }
  return changes;
}
var PRICE_CHANGE_NOTICE_DAYS;
var init_subscriptionPricingService = __esm({
  "backend/services/subscriptionPricingService.ts"() {
    init_serverDb();
    init_prisma();
    init_subscriptionPricing();
    init_planCatalogue();
    PRICE_CHANGE_NOTICE_DAYS = 14;
  }
});

// backend/services/worldpaySubscription.ts
import crypto5 from "crypto";
function isPlaceholderCredential(value) {
  if (!value || typeof value !== "string") return true;
  return PLACEHOLDER_PATTERNS.some((rx) => rx.test(value));
}
function isUsableRecurringHref(href) {
  if (!href || typeof href !== "string") return false;
  if (!href.startsWith("http")) return false;
  if (isPlaceholderCredential(href)) return false;
  if (/\/payments\/recurring\/(wp-|mock-)/i.test(href)) return false;
  return true;
}
function isUsableTokenHref(href) {
  if (!href || typeof href !== "string") return false;
  const trimmed = href.trim();
  if (!trimmed.startsWith("http")) return false;
  if (isPlaceholderCredential(trimmed)) return false;
  return /\/tokens?\//i.test(trimmed);
}
function tokenOptIn() {
  const configured = String(process.env.WORLDPAY_TOKEN_OPT_IN || "Silent").trim();
  return /^(ask|silent)$/i.test(configured) ? configured.toUpperCase() === "ASK" ? "ASK" : "Silent" : "Silent";
}
function findTokenHrefDeep(node, depth, seen) {
  if (depth > 6 || node === null || node === void 0) return null;
  if (typeof node === "string") return isUsableTokenHref(node) ? node.trim() : null;
  if (typeof node !== "object") return null;
  if (seen.has(node)) return null;
  seen.add(node);
  if (Array.isArray(node)) {
    for (const entry of node) {
      const found = findTokenHrefDeep(entry, depth + 1, seen);
      if (found) return found;
    }
    return null;
  }
  for (const [key, value] of Object.entries(node)) {
    if (!TOKEN_HREF_KEYS.has(key.toLowerCase())) continue;
    const found = findTokenHrefDeep(value, depth + 1, seen);
    if (found) return found;
  }
  for (const value of Object.values(node)) {
    const found = findTokenHrefDeep(value, depth + 1, seen);
    if (found) return found;
  }
  return null;
}
function extractTokenHref(payload) {
  if (!payload) return null;
  if (typeof payload === "string") return isUsableTokenHref(payload) ? payload.trim() : null;
  if (typeof payload !== "object") return null;
  const preferred = [
    // Access webhook: { eventDetails: { type: "tokenCreated", ... } }
    payload?.eventDetails?.tokenHref,
    payload?.eventDetails?.token?.href,
    payload?.eventDetails?.tokenPaymentInstrument?.href,
    payload?.eventDetails?._links?.["tokens:token"]?.href,
    // Flattened webhook bodies.
    payload?.tokenHref,
    payload?.token?.href,
    payload?.attributes?.tokenHref,
    payload?.data?.attributes?.tokenHref,
    // Payment authorization / payment query responses.
    payload?._links?.["tokens:token"]?.href,
    payload?._links?.token?.href,
    payload?.paymentInstrument?.href,
    payload?.paymentInstrument?.token?.href,
    payload?.instruction?.paymentInstrument?.href,
    payload?._embedded?.payments?.[0]?._links?.["tokens:token"]?.href,
    payload?._embedded?.payments?.[0]?.paymentInstrument?.href
  ];
  for (const value of preferred) {
    if (isUsableTokenHref(value)) return String(value).trim();
  }
  return findTokenHrefDeep(payload, 0, /* @__PURE__ */ new Set());
}
function isTokenEvent(payload) {
  const type = String(
    payload?.eventDetails?.type || payload?.eventType || payload?.type || payload?.data?.type || ""
  ).toLowerCase();
  if (type.includes("token")) return true;
  return Boolean(extractTokenHref(payload));
}
function getWorldpayConfig() {
  const username = process.env.WORLDPAY_API_USERNAME;
  const password = process.env.WORLDPAY_API_PASSWORD;
  const entity = process.env.WORLDPAY_ENTITY || process.env.WORLDPAY_ENTITY_ID;
  const baseUrl = (process.env.WORLDPAY_BASE_URL || "https://access.worldpay.com").replace(/\/+$/, "");
  const environment = String(process.env.WORLDPAY_ENVIRONMENT || "live").toLowerCase();
  if (!username || !password || !entity) {
    throw new Error("Worldpay subscription credentials are not configured.");
  }
  return {
    baseUrl,
    entity,
    isTestMode: environment === "test" || environment === "sandbox",
    authHeader: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`
  };
}
function authorizationsUrl(config) {
  return `${config.baseUrl}/payments/authorizations`;
}
function settlementShapesToTry() {
  const configured = String(process.env.WORLDPAY_SETTLEMENT_SHAPE || "auto").trim();
  if (configured && configured !== "auto") {
    if (SETTLEMENT_FALLBACK_ORDER.includes(configured)) {
      return [configured];
    }
    console.warn(
      `[Worldpay Subscription] Ignoring unknown WORLDPAY_SETTLEMENT_SHAPE "${configured}". Expected one of: ${SETTLEMENT_FALLBACK_ORDER.join(", ")}, auto.`
    );
  }
  if (String(process.env.WORLDPAY_AUTO_SETTLE || "true").toLowerCase() === "false") {
    return ["none"];
  }
  return [...SETTLEMENT_FALLBACK_ORDER];
}
function applySettlement(instruction, shape) {
  delete instruction.settlement;
  delete instruction.requestAutoSettlement;
  if (shape === "settlement") {
    instruction.settlement = {
      auto: true,
      cancelOn: {
        // A stored-card MIT presents neither a CVC nor an address, so cancelling
        // the payment because they did not match would decline every renewal.
        cvcNotMatched: "disabled",
        avsNotMatched: "disabled"
      }
    };
  } else if (shape === "requestAutoSettlement") {
    instruction.requestAutoSettlement = { enabled: true };
  }
}
function isSchemaRejection(status, data) {
  if (status !== 400 && status !== 415 && status !== 422) return false;
  const text = JSON.stringify(data || {}).toLowerCase();
  return text.includes("settlement") || text.includes("schema") || text.includes("unrecognised") || text.includes("unrecognized") || text.includes("unexpected") || text.includes("notsupported") || text.includes("invalidvalue") || text.includes("bodydoesnotmatch");
}
function getHeaders(config) {
  const correlationId = crypto5.randomUUID ? crypto5.randomUUID() : `sub-${Math.random().toString(36).substring(2, 10)}`;
  return {
    Authorization: config.authHeader,
    "Content-Type": PAYMENTS_MEDIA_TYPE,
    Accept: PAYMENTS_MEDIA_TYPE,
    "WP-CorrelationId": correlationId
  };
}
function extractSchemeReference(response) {
  if (!response || typeof response !== "object") return null;
  const candidates = [
    // Where Worldpay ACTUALLY returns it, on both the authorization response and
    // the payment query:
    //
    //   "transactionType": "cardOnFile",
    //   "scheme": { "reference": "MRLZRGKT60908  " }
    //
    // This path was missing, so every subscription looked like it had no stored
    // credential and reported "no stored-card mandate" — while Worldpay had
    // issued a perfectly good reference on the very first payment. The value is
    // space-padded to a fixed width by the scheme, hence the trim below.
    response?.scheme?.reference,
    response?.payment?.scheme?.reference,
    response?._embedded?.payments?.[0]?.scheme?.reference,
    // Shapes other Worldpay endpoints/versions use.
    response?.schemeReference,
    response?.schemeTransactionReference,
    response?.paymentInstrument?.schemeReference,
    response?.paymentInstrument?.schemeTransactionReference,
    response?.instruction?.paymentInstrument?.schemeReference,
    response?.customerAgreement?.schemeReference,
    response?.paymentInstrument?.card?.schemeReference
  ];
  for (const value of candidates) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed && !isPlaceholderCredential(trimmed)) {
      return trimmed;
    }
  }
  return null;
}
function extractRecurringAuthorizationHref(response) {
  if (!response) return null;
  if (typeof response === "string") {
    return isUsableRecurringHref(response) ? response : null;
  }
  const links = response?._links;
  if (links && typeof links === "object") {
    const possibleKeys = [
      "payments:recurringAuthorize",
      "recurringAuthorize",
      "payments:recurring",
      "recurring"
    ];
    for (const key of possibleKeys) {
      const item = links[key];
      const href = typeof item === "string" ? item : item?.href;
      if (isUsableRecurringHref(href)) {
        return href;
      }
    }
  }
  const direct = response?.recurringHref || response?.worldpayRecurringHref || response?.worldpayRecurringUrl;
  return isUsableRecurringHref(direct) ? direct : null;
}
async function chargeRecurringSubscription({
  tokenHref,
  recurringHref,
  transactionReference,
  amount,
  currency = "GBP",
  schemeReference,
  previousTransactionId,
  customerEmail
}) {
  let config = null;
  let configError = null;
  try {
    config = getWorldpayConfig();
  } catch (cfgErr) {
    configError = cfgErr.message;
    console.warn("[Worldpay Subscription] Credentials note:", cfgErr.message);
  }
  const usableToken = isUsableTokenHref(tokenHref);
  const usableHref = isUsableRecurringHref(recurringHref);
  const usableScheme = Boolean(schemeReference) && !isPlaceholderCredential(schemeReference);
  const usablePreviousTx = Boolean(previousTransactionId) && !isPlaceholderCredential(previousTransactionId);
  if (!config) {
    throw new Error(
      configError || "Worldpay credentials are not configured, so no recurring payment can be taken."
    );
  }
  if (!usableToken && !usableHref && !usableScheme && !usablePreviousTx) {
    throw new Error(
      "No Worldpay stored credential is available for this subscription. The initial payment must be taken with createToken and a customer agreement so Worldpay stores the card and sends a tokenCreated webhook carrying the token href."
    );
  }
  if (!usableToken) {
    console.warn(
      `[Worldpay Subscription] ${transactionReference} has no stored card token. Falling back to the scheme reference alone, which Worldpay may refuse \u2014 the tokenCreated webhook for this subscription was never received or never stored.`
    );
  }
  const targetUrl = usableToken || !usableHref ? authorizationsUrl(config) : recurringHref;
  console.log(
    `[Worldpay Subscription] Initiating MIT recurring charge via ${targetUrl} for ${transactionReference} (\xA3${amount})${usableToken ? " using the stored card token" : ""}`
  );
  const buildInstruction = () => {
    const instruction = {
      narrative: { line1: "Pouch Supply Sub" },
      value: {
        currency,
        amount: Math.round(amount * 100)
      },
      debtRepayment: false,
      customerAgreement: {
        type: "subscription",
        storedCardUsage: "subsequent"
      }
    };
    if (usableToken) {
      instruction.paymentInstrument = {
        type: "card/token",
        href: String(tokenHref).trim()
      };
    }
    if (usableScheme) {
      instruction.customerAgreement.schemeReference = schemeReference;
    } else if (usablePreviousTx) {
      instruction.customerAgreement.schemeReference = previousTransactionId;
    }
    return instruction;
  };
  const shapes = settlementShapesToTry();
  let response;
  let data = {};
  for (let attempt = 0; attempt < shapes.length; attempt++) {
    const shape = shapes[attempt];
    const instruction = buildInstruction();
    applySettlement(instruction, shape);
    const mitPayload = {
      transactionReference,
      merchant: { entity: config.entity },
      instruction
    };
    if (customerEmail) {
      mitPayload.customer = { email: customerEmail };
    }
    response = await fetch(targetUrl, {
      method: "POST",
      headers: getHeaders(config),
      body: JSON.stringify(mitPayload)
    });
    data = await response.json().catch(() => ({}));
    if (response.ok) {
      if (attempt > 0) {
        console.warn(
          `[Worldpay Subscription] Settlement directive "${shapes[attempt - 1]}" was rejected by this account; "${shape}" was accepted. Set WORLDPAY_SETTLEMENT_SHAPE=${shape} to skip the rejected attempt on every future renewal.`
        );
      }
      if (shape === "none") {
        console.warn(
          `[Worldpay Subscription] ${transactionReference} was authorised WITHOUT an auto-settlement directive. Confirm the account settles automatically, or the money will be reserved and released rather than collected.`
        );
      }
      break;
    }
    const retryable = attempt < shapes.length - 1 && isSchemaRejection(response.status, data);
    if (!retryable) break;
    console.warn(
      `[Worldpay Subscription] Settlement shape "${shape}" rejected for ${transactionReference} (${response.status}: ${data?.description || data?.message || data?.errorName || "schema error"}). Retrying as "${shapes[attempt + 1]}".`
    );
  }
  if (!response.ok) {
    const errMsg = data?.description || data?.message || `Worldpay returned HTTP ${response.status}`;
    console.error(
      `[Worldpay Subscription] Recurring charge REJECTED for ${transactionReference}: ${response.status} \u2014 ${errMsg}`
    );
    throw new Error(errMsg);
  }
  const outcome = String(data?.outcome || data?.lastEvent || "").toLowerCase();
  const declined = outcome.includes("refus") || outcome.includes("declin") || outcome.includes("fail");
  if (declined) {
    throw new Error(
      `Worldpay declined the recurring payment for ${transactionReference} (outcome: ${data?.outcome || "refused"}).`
    );
  }
  console.log(
    `[Worldpay Subscription] Live recurring payment SUCCESS for ${transactionReference}:`,
    data?.id || data?.outcome || "authorized"
  );
  return {
    id: data?.id || data?.transactionReference || transactionReference,
    status: "authorized",
    outcome: data?.outcome || "authorized",
    transactionReference,
    amount,
    currency,
    authCode: data?.authorizationCode || data?.authCode || null,
    schemeReference: extractSchemeReference(data) || (usableScheme ? schemeReference : null),
    // Worldpay can return a rotated token href on the charge. Keeping it means
    // the next renewal presents the current card rather than a retired one.
    tokenHref: extractTokenHref(data) || (usableToken ? String(tokenHref).trim() : null),
    rawResponse: data,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function collectTokenObjects(payload) {
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload)) return payload;
  const candidates = [
    payload?._embedded?.tokens,
    payload?._embedded?.token,
    payload?.tokens,
    payload?.items,
    payload?.results
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object") return [candidate];
  }
  if (payload.tokenId || payload.tokenPaymentInstrument || payload.schemeTransactionReference) {
    return [payload];
  }
  return [];
}
function toWorldpayToken(raw) {
  if (!raw || typeof raw !== "object") return null;
  const href = raw?.tokenPaymentInstrument?.href || raw?._links?.["tokens:token"]?.href || raw?._links?.self?.href || raw?.href || null;
  if (!isUsableTokenHref(href)) return null;
  const scheme = raw?.schemeTransactionReference || raw?.paymentInstrument?.schemeTransactionReference || raw?.tokenPaymentInstrument?.schemeTransactionReference || null;
  return {
    href: String(href).trim(),
    tokenId: raw?.tokenId ? String(raw.tokenId) : null,
    namespace: raw?.namespace ? String(raw.namespace) : null,
    schemeTransactionReference: typeof scheme === "string" && scheme.trim() ? scheme.trim() : null,
    expiryDateTime: raw?.tokenExpiryDateTime ? String(raw.tokenExpiryDateTime) : null,
    raw
  };
}
async function fetchTokensForNamespace(namespace) {
  const cleaned = String(namespace || "").trim().toLowerCase();
  if (!cleaned) return [];
  let config;
  try {
    config = getWorldpayConfig();
  } catch (err) {
    console.warn("[Worldpay Tokens] Cannot look up stored cards:", err?.message);
    return [];
  }
  const url = `${config.baseUrl}/tokens?namespace=${encodeURIComponent(cleaned)}&entityReference=${encodeURIComponent(config.entity)}`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: config.authHeader,
        Accept: TOKENS_MEDIA_TYPE,
        "WP-CorrelationId": crypto5.randomUUID ? crypto5.randomUUID() : `tok-${Date.now()}`
      }
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Worldpay Tokens] Lookup for "${cleaned}" returned HTTP ${response.status}. ${detail.slice(0, 300)}`
      );
      return [];
    }
    const data = await response.json().catch(() => null);
    const tokens = collectTokenObjects(data).map(toWorldpayToken).filter((t) => Boolean(t));
    console.log(
      `[Worldpay Tokens] ${tokens.length} stored card(s) for "${cleaned}": ` + tokens.map((t) => `${t.tokenId || "no-id"}/${t.schemeTransactionReference || "no-scheme"}`).join(", ")
    );
    return tokens;
  } catch (err) {
    console.warn(`[Worldpay Tokens] Lookup for "${cleaned}" failed:`, err?.message);
    return [];
  }
}
function selectTokenForSubscription(tokens, criteria) {
  const wantedNamespace = String(criteria.namespace || "").trim().toLowerCase();
  if (!wantedNamespace) {
    return { token: null, reason: "the subscription has no customer email to look up", ambiguous: false };
  }
  const mine = tokens.filter((t) => {
    if (!isUsableTokenHref(t.href)) return false;
    if (!t.namespace) return true;
    return t.namespace.trim().toLowerCase() === wantedNamespace;
  });
  const foreign = tokens.length - mine.length;
  if (foreign > 0) {
    console.warn(
      `[Worldpay Tokens] Discarded ${foreign} token(s) filed under a namespace other than "${wantedNamespace}".`
    );
  }
  if (mine.length === 0) {
    return { token: null, reason: `Worldpay holds no stored card for "${wantedNamespace}"`, ambiguous: false };
  }
  const wantedScheme = String(criteria.schemeReference || "").trim();
  if (wantedScheme) {
    const exact = mine.filter((t) => (t.schemeTransactionReference || "").trim() === wantedScheme);
    if (exact.length === 1) {
      return {
        token: exact[0],
        reason: `matched on scheme transaction reference ${wantedScheme}`,
        ambiguous: false
      };
    }
    if (exact.length > 1) {
      return {
        token: null,
        reason: `${exact.length} stored cards share scheme reference ${wantedScheme} \u2014 cannot tell them apart`,
        ambiguous: true
      };
    }
    return {
      token: null,
      reason: `Worldpay holds ${mine.length} stored card(s) for "${wantedNamespace}", but none was created under this subscription's agreement (${wantedScheme}). Found: ` + mine.map((t) => t.schemeTransactionReference || "no scheme reference").join(", ") + ". Not assigned \u2014 a human has to confirm which card this plan should charge.",
      ambiguous: true
    };
  }
  if (mine.length === 1) {
    return {
      token: mine[0],
      reason: `the only stored card for "${wantedNamespace}" and the subscription has no scheme reference to match`,
      ambiguous: false
    };
  }
  return {
    token: null,
    reason: `Worldpay holds ${mine.length} stored cards for "${wantedNamespace}" and this subscription has no scheme reference to identify which one belongs to it. Not assigned.`,
    ambiguous: true
  };
}
var PLACEHOLDER_PATTERNS, TOKEN_HREF_KEYS, PAYMENTS_MEDIA_TYPE, SETTLEMENT_FALLBACK_ORDER, TOKENS_MEDIA_TYPE;
var init_worldpaySubscription = __esm({
  "backend/services/worldpaySubscription.ts"() {
    PLACEHOLDER_PATTERNS = [
      /^SCHEME-MOCK/i,
      /^SCHEME-SIM-/i,
      /^SCHEME-REF-\d+$/i,
      /^SCHEME-WP-/i,
      /^WP-MOCK/i,
      /^WP-SUB-AUTH-/i,
      /^WP-SUB-RECURRING-/i,
      /^WP-SUB-INIT-/i,
      /^WP-TEST-TXN-/i,
      /mock/i,
      /test-simulation/i
    ];
    TOKEN_HREF_KEYS = /* @__PURE__ */ new Set([
      "href",
      "tokenhref",
      "tokenpaymentinstrument",
      "token",
      "tokens:token",
      "payments:token"
    ]);
    PAYMENTS_MEDIA_TYPE = "application/vnd.worldpay.payments-v6+json";
    SETTLEMENT_FALLBACK_ORDER = [
      "settlement",
      "requestAutoSettlement",
      "none"
    ];
    TOKENS_MEDIA_TYPE = "application/vnd.worldpay.tokens-v3.hal+json";
  }
});

// backend/services/subscriptionBox.ts
function isPlaceholderName(value) {
  const v = String(value ?? "").trim().toLowerCase();
  return !v || PLACEHOLDER_NAMES.includes(v);
}
function isSubscriptionPackLine(item) {
  if (!item) return false;
  return Boolean(
    item.vendor === "Subscription Pack" || typeof item.productId === "string" && item.productId.includes("sub-pack") || Array.isArray(item.subscriptionItems) || Array.isArray(item.selectedProducts)
  );
}
function extractBoxItems(subscription) {
  if (!subscription) return [];
  const direct = subscription.subscriptionItems || subscription.selectedProducts || subscription.subItems;
  if (Array.isArray(direct) && direct.length > 0) return direct;
  const items = Array.isArray(subscription.items) ? subscription.items : [];
  if (items.length === 0) return [];
  const packLine = items.find(isSubscriptionPackLine);
  if (packLine) {
    const nested = packLine.subscriptionItems || packLine.selectedProducts || packLine.items;
    if (Array.isArray(nested) && nested.length > 0) return nested;
    return [];
  }
  return items.filter((it) => {
    const name = it?.productTitle || it?.title || it?.name;
    return Boolean(it?.productId) || !isPlaceholderName(name);
  });
}
function buildRenewalOrderItems(subscription, itemSubtotal, planTitle) {
  const boxItems = extractBoxItems(subscription);
  const storedItems = Array.isArray(subscription?.items) ? subscription.items : [];
  if (storedItems.length > 0) {
    return storedItems.map((it) => ({
      ...it,
      isSubscription: true,
      // Attach the selection to the pack line so the order detail view can list
      // the box contents without re-parsing the plan title.
      ...isSubscriptionPackLine(it) && boxItems.length > 0 ? { subscriptionItems: boxItems, selectedProducts: boxItems } : {}
    }));
  }
  return [
    {
      productId: subscription?.planId || "sub-pack",
      productTitle: `${planTitle} (Recurring Renewal)`,
      price: itemSubtotal,
      quantity: 1,
      isSubscription: true,
      subscriptionPlan: planTitle,
      subscriptionItems: boxItems,
      selectedProducts: boxItems,
      // Subscriptions taken before the selection was stored describe the box only
      // in `planName`. It is carried here, unmodified and separate from the
      // title, so the order view can still recover the real products from it —
      // concatenating it into the title is what corrupted those names before.
      subscriptionSummary: String(subscription?.planName || ""),
      total: itemSubtotal
    }
  ];
}
function planTitleFromSubscription(subscription) {
  const raw = String(subscription?.planName || subscription?.planId || "").trim();
  if (!raw) return "Pouch Supply Subscription";
  const heading = raw.split(/\s*\[|\s+-\s+\(/)[0].trim();
  const lower = heading.toLowerCase();
  if (lower.includes("ultimate")) return "ULTIMATE Plan";
  if (lower.includes("pro")) return "PRO Plan";
  if (lower.includes("core")) return "CORE Plan";
  if (lower.includes("lite")) return "LITE Plan";
  return heading || "Pouch Supply Subscription";
}
var PLACEHOLDER_NAMES;
var init_subscriptionBox = __esm({
  "backend/services/subscriptionBox.ts"() {
    PLACEHOLDER_NAMES = ["product", "products", "item", "unknown", "n/a", "sku-001", "subscription pack"];
  }
});

// src/lib/royalMail.ts
function getRoyalMailApiUrl() {
  let base = process.env.ROYAL_MAIL_API_URL || process.env.RM_API_BASE_URL || process.env.ROYAL_MAIL_BASE_URL || "https://api.parcel.royalmail.com/api/v1";
  base = base.trim().replace(/\/+$/, "");
  if (!base.includes("/api/v1") && !base.includes("/v1")) {
    base = `${base}/api/v1`;
  }
  return base;
}
function getAuthHeader(apiKey) {
  const key = apiKey || process.env.ROYAL_MAIL_API_KEY || process.env.RM_API_KEY || "";
  if (!key) return "";
  return key.startsWith("Bearer ") ? key : `Bearer ${key}`;
}
async function royalMailRequest(path5, options = {}, apiKey) {
  const key = apiKey || process.env.ROYAL_MAIL_API_KEY || process.env.RM_API_KEY;
  if (!key) {
    throw new RoyalMailError("ROYAL_MAIL_API_KEY is not configured", 500);
  }
  const authHeader = getAuthHeader(key);
  const baseUrl = getRoyalMailApiUrl();
  const normalizedPath = path5.startsWith("/") ? path5 : `/${path5}`;
  const fullUrl = `${baseUrl}${normalizedPath}`;
  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers || {}
    },
    cache: "no-store"
  });
  const contentType = response.headers.get("content-type") || "";
  let data;
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
      errMsg = data.map((e) => e?.message || e?.code || JSON.stringify(e)).join(" | ");
    } else if (typeof data === "object" && data !== null) {
      const obj = data;
      if (Array.isArray(obj.errors) && obj.errors.length > 0) {
        errMsg = obj.errors.map((e) => e.message || e.code || JSON.stringify(e)).join(" | ");
      } else if (Array.isArray(obj.failedOrders) && obj.failedOrders.length > 0) {
        const failedErrs = [];
        obj.failedOrders.forEach((f) => {
          if (Array.isArray(f.errors)) {
            f.errors.forEach((e) => failedErrs.push(e.message || e.code || JSON.stringify(e)));
          } else if (f.errors) {
            failedErrs.push(JSON.stringify(f.errors));
          }
        });
        if (failedErrs.length > 0) errMsg = failedErrs.join(" | ");
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
  return data;
}
async function checkRoyalMailConnection(apiKey) {
  return royalMailRequest(
    "/orders",
    {
      method: "GET"
    },
    apiKey
  );
}
async function createRoyalMailOrders(orders, apiKey) {
  return royalMailRequest(
    "/orders",
    {
      method: "POST",
      body: JSON.stringify({
        items: orders
      })
    },
    apiKey
  );
}
async function getRoyalMailOrder(identifier, apiKey) {
  const raw = String(identifier).trim();
  const encoded = /^[0-9]+$/.test(raw) ? raw : `"${encodeURIComponent(raw)}"`;
  return royalMailRequest(
    `/orders/${encoded}`,
    {
      method: "GET"
    },
    apiKey
  );
}
async function getRoyalMailLabel(identifier, options, apiKey) {
  const key = apiKey || process.env.ROYAL_MAIL_API_KEY || process.env.RM_API_KEY;
  if (!key) {
    throw new RoyalMailError("ROYAL_MAIL_API_KEY is not configured", 500);
  }
  const encoded = typeof identifier === "number" ? String(identifier) : `"${encodeURIComponent(identifier)}"`;
  const params = new URLSearchParams();
  params.set("documentType", "postageLabel");
  params.set(
    "includeReturnsLabel",
    String(options?.includeReturnsLabel ?? false)
  );
  if (options?.includeCN !== void 0) {
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
        Accept: "application/pdf"
      },
      cache: "no-store"
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
async function markRoyalMailOrderDispatched(identifier, apiKey) {
  const item = typeof identifier === "number" ? {
    orderIdentifier: identifier,
    status: "despatched"
  } : {
    orderReference: identifier,
    status: "despatched"
  };
  return royalMailRequest(
    "/orders/status",
    {
      method: "PUT",
      body: JSON.stringify({
        items: [item]
      })
    },
    apiKey
  );
}
async function createOrder(payload, apiKey) {
  const item = Array.isArray(payload) ? payload : [payload];
  return createRoyalMailOrders(item, apiKey);
}
async function getOrders(apiKey, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => query.append(k, String(v)));
  const url = `/orders${query.toString() ? `?${query.toString()}` : ""}`;
  return royalMailRequest(url, { method: "GET" }, apiKey);
}
async function getOrderByReference(reference, apiKey) {
  const result = await getRoyalMailOrder(reference, apiKey);
  if (!Array.isArray(result)) return result;
  if (result.length === 0) return null;
  const tracked = result.find(
    (o) => o?.trackingNumber || o?.packages?.[0]?.trackingNumber
  );
  if (tracked) return tracked;
  return result.slice().sort((a, b) => Number(b?.orderIdentifier || 0) - Number(a?.orderIdentifier || 0))[0];
}
async function cancelOrder(reference, apiKey) {
  const values = (Array.isArray(reference) ? reference : [reference]).map((v) => String(v).trim()).filter(Boolean).map((v) => /^\d+$/.test(v) ? v : `"${encodeURIComponent(v)}"`);
  return royalMailRequest(`/orders/${values.join(";")}`, { method: "DELETE" }, apiKey);
}
async function getApiVersion(apiKey) {
  return royalMailRequest("/version", { method: "GET" }, apiKey);
}
var RoyalMailError;
var init_royalMail = __esm({
  "src/lib/royalMail.ts"() {
    RoyalMailError = class extends Error {
      constructor(message, status, details) {
        super(message);
        this.name = "RoyalMailError";
        this.status = status;
        this.details = details;
      }
    };
  }
});

// backend/services/royalMailService.ts
var royalMailService_exports = {};
__export(royalMailService_exports, {
  DEFAULT_ROYAL_MAIL_SETTINGS: () => DEFAULT_ROYAL_MAIL_SETTINGS,
  PACKAGE_FORMATS: () => PACKAGE_FORMATS,
  UK_SERVICE_CODES: () => UK_SERVICE_CODES,
  cancelRoyalMailShipment: () => cancelRoyalMailShipment,
  createReturnLabel: () => createRoyalMailReturnLabel,
  createRoyalMailReturnLabel: () => createRoyalMailReturnLabel,
  createRoyalMailShipment: () => createRoyalMailShipment,
  dispatchRoyalMailShipment: () => dispatchRoyalMailShipment,
  getRoyalMailLabelForOrder: () => getRoyalMailLabelForOrder,
  getRoyalMailSettings: () => getRoyalMailSettings,
  getRoyalMailTracking: () => getRoyalMailTracking,
  getShippingRates: () => getShippingRates,
  normalizeCountryCode: () => normalizeCountryCode,
  parseAddressString: () => parseAddressString,
  readClickAndDropState: () => readClickAndDropState,
  requireApiKey: () => requireApiKey,
  resolvePackageFormat: () => resolvePackageFormat,
  resolveServiceCode: () => resolveServiceCode,
  saveRoyalMailSettings: () => saveRoyalMailSettings,
  serviceSupportsNotifications: () => serviceSupportsNotifications,
  syncPendingRoyalMailTracking: () => syncPendingRoyalMailTracking,
  syncRoyalMailOrderStatus: () => syncRoyalMailOrderStatus,
  testServiceCode: () => testServiceCode,
  validateAddress: () => validateAddress
});
async function getRoyalMailSettings() {
  const envKey = process.env.RM_API_KEY || process.env.ROYAL_MAIL_API_KEY || "";
  try {
    let stored = await fetchStoreSetting("royalmail_settings");
    if (!stored || typeof stored === "object" && Object.keys(stored).length === 0) {
      const legacy = await fetchResource("royalmail_settings");
      if (legacy && Array.isArray(legacy) && legacy.length > 0) {
        stored = legacy[0];
      }
    }
    if (stored && typeof stored === "object") {
      const item = Array.isArray(stored) ? stored[0] : stored;
      return {
        ...DEFAULT_ROYAL_MAIL_SETTINGS,
        ...item,
        // A saved code from the old OBA setup is translated here rather than at
        // shipment time only, so the admin screen shows the service that will
        // actually be used. An empty saved value stays empty — "apply postage in
        // Click & Drop" is a deliberate choice, not a missing setting.
        defaultServiceCode: item.defaultServiceCode === void 0 ? DEFAULT_ROYAL_MAIL_SETTINGS.defaultServiceCode : resolveServiceCode(item.defaultServiceCode),
        apiKey: item.apiKey && item.apiKey.trim().length > 0 ? item.apiKey : envKey || DEFAULT_ROYAL_MAIL_SETTINGS.apiKey,
        senderAddress: {
          ...DEFAULT_ROYAL_MAIL_SETTINGS.senderAddress,
          ...item.senderAddress || {}
        }
      };
    }
  } catch (err) {
    console.warn("[RoyalMailService] Error reading settings, using defaults:", err);
  }
  return {
    ...DEFAULT_ROYAL_MAIL_SETTINGS,
    apiKey: envKey || DEFAULT_ROYAL_MAIL_SETTINGS.apiKey
  };
}
async function saveRoyalMailSettings(settings) {
  const current = await getRoyalMailSettings();
  const apiKeyVal = (settings.apiKey !== void 0 ? settings.apiKey : current.apiKey) || "";
  const updated = {
    ...current,
    ...settings,
    apiKey: apiKeyVal,
    senderAddress: {
      ...current.senderAddress,
      ...settings.senderAddress || {}
    }
  };
  if (apiKeyVal) {
    process.env.RM_API_KEY = apiKeyVal;
    process.env.ROYAL_MAIL_API_KEY = apiKeyVal;
  }
  await saveStoreSetting("royalmail_settings", updated);
  await saveResource("royalmail_settings", [updated]);
  return updated;
}
async function requireApiKey(settings) {
  const s = settings || await getRoyalMailSettings();
  const apiKey = (s.apiKey || process.env.RM_API_KEY || process.env.ROYAL_MAIL_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error(
      "Royal Mail Click & Drop API key is not configured. Add your API Authorization key in Admin \u2192 Settings \u2192 Royal Mail (or set ROYAL_MAIL_API_KEY) before creating shipments."
    );
  }
  return apiKey;
}
function requireSender(settings) {
  const sender = settings.senderAddress || {};
  const tradingName = (sender.companyName || "").trim();
  if (!tradingName) {
    throw new Error(
      "Royal Mail sender trading name is not configured. Set your company name and address in Admin \u2192 Settings \u2192 Royal Mail before creating shipments."
    );
  }
  return sender;
}
function validateAddress(address) {
  const errors = [];
  if (!address.fullName || address.fullName.trim().length < 2) {
    errors.push("Full recipient name is required");
  }
  if (!address.addressLine1 || address.addressLine1.trim().length < 3) {
    errors.push("Address line 1 is required");
  }
  if (!address.city || address.city.trim().length < 2) {
    errors.push("City / Town is required");
  }
  if (!address.postcode || address.postcode.trim().length < 3) {
    errors.push("Postcode / Postal Code is required");
  } else {
    const country = normalizeCountryCode(address.countryCode);
    if (country === "GB") {
      const ukPostcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
      if (!ukPostcodeRegex.test(address.postcode.trim())) {
        errors.push("Postcode format does not appear to be a valid UK postcode (e.g. EC1A 1BB or SW1A 1AA)");
      }
    }
  }
  const parsed = {
    fullName: (address.fullName || "").trim(),
    companyName: (address.companyName || "").trim(),
    addressLine1: (address.addressLine1 || "").trim(),
    addressLine2: (address.addressLine2 || "").trim(),
    city: (address.city || "").trim(),
    county: (address.county || "").trim(),
    postcode: (address.postcode || "").trim().toUpperCase(),
    countryCode: normalizeCountryCode(address.countryCode),
    email: (address.email || "").trim(),
    phone: (address.phone || "").trim()
  };
  return {
    valid: errors.length === 0,
    errors,
    parsed
  };
}
function serviceSupportsNotifications(code) {
  const raw = String(code ?? "").trim().toUpperCase();
  if (!raw) return false;
  if (raw.startsWith("OLP") || raw.startsWith("TOLP")) return false;
  return true;
}
async function postOrder(payload, apiKey, orderId) {
  try {
    return await createRoyalMailOrders([payload], apiKey);
  } catch (err) {
    if (err instanceof RoyalMailError && err.status >= 500) {
      throw new Error(
        `Royal Mail's API failed while creating the shipment for order #${orderId}: ${err.message} This is an error on Royal Mail's side, not a problem with the order. Check Click & Drop for an order with reference ${payload.orderReference} before trying again \u2014 if one is there, the shipment was created and only the response was lost. Quote the CorrelationId to Royal Mail support if it keeps happening.`
      );
    }
    throw err;
  }
}
function collectFailureMessages(result) {
  const failed = Array.isArray(result?.failedOrders) ? result.failedOrders : [];
  return failed.flatMap((f) => {
    const errors = Array.isArray(f?.errors) ? f.errors : f?.errors ? [f.errors] : [];
    return errors.map((e) => String(e?.errorMessage || e?.message || e?.code || ""));
  });
}
function resolvePackageFormat(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "smallParcel";
  const exact = PACKAGE_FORMATS.find((f) => f === raw);
  if (exact) return exact;
  const alias = PACKAGE_FORMAT_ALIASES[raw.toUpperCase()];
  if (alias) {
    if (alias !== raw) {
      console.warn(`[RoyalMailService] Package format "${raw}" read as "${alias}".`);
    }
    return alias;
  }
  console.warn(`[RoyalMailService] Unknown package format "${raw}"; using smallParcel.`);
  return "smallParcel";
}
function resolveServiceCode(code) {
  const raw = String(code ?? "").trim().toUpperCase();
  if (!raw) return "";
  const mapped = LEGACY_SERVICE_CODE_MAP[raw];
  if (mapped) {
    console.warn(
      `[RoyalMailService] Service code ${raw} is not on this Click & Drop contract; using ${mapped} instead.`
    );
    return mapped;
  }
  return raw;
}
function getShippingRates(weightGrams = 70, countryCode = "GB") {
  const isUK = normalizeCountryCode(countryCode) === "GB";
  if (isUK) {
    return [
      {
        serviceCode: "TOLP24",
        serviceName: "Royal Mail Tracked 24\xAE",
        estimatedDelivery: "1-2 Working Days (Tracked)",
        price: 4.75,
        currency: "GBP",
        tracked: true,
        signatureRequired: false
      },
      {
        serviceCode: "TOLP48",
        serviceName: "Royal Mail Tracked 48\xAE",
        estimatedDelivery: "2-3 Working Days (Tracked)",
        price: 3.99,
        currency: "GBP",
        tracked: true,
        signatureRequired: false
      },
      {
        serviceCode: "OLP1",
        serviceName: "Royal Mail 1st Class",
        estimatedDelivery: "1-2 Working Days",
        price: 3.95,
        currency: "GBP",
        tracked: false,
        signatureRequired: false
      },
      {
        serviceCode: "OLP1SF",
        serviceName: "Royal Mail Signed For\xAE 1st Class",
        estimatedDelivery: "1-2 Working Days (Signature on Delivery)",
        price: 5.45,
        currency: "GBP",
        tracked: false,
        signatureRequired: true
      },
      {
        serviceCode: "OLP2",
        serviceName: "Royal Mail 2nd Class",
        estimatedDelivery: "2-3 Working Days",
        price: 3.25,
        currency: "GBP",
        tracked: false,
        signatureRequired: false
      },
      {
        serviceCode: "OLP2SF",
        serviceName: "Royal Mail Signed For\xAE 2nd Class",
        estimatedDelivery: "2-3 Working Days (Signature on Delivery)",
        price: 4.75,
        currency: "GBP",
        tracked: false,
        signatureRequired: true
      }
    ];
  }
  return [
    {
      serviceCode: "MP1",
      serviceName: "Royal Mail International Tracked",
      estimatedDelivery: "3-5 Working Days (Europe) / 5-7 Days (Worldwide)",
      price: 12.5,
      currency: "GBP",
      tracked: true,
      signatureRequired: false
    },
    {
      serviceCode: "MP2",
      serviceName: "Royal Mail International Tracked & Signed",
      estimatedDelivery: "3-5 Working Days (Europe) / 5-7 Days (Worldwide)",
      price: 14.95,
      currency: "GBP",
      tracked: true,
      signatureRequired: true
    }
  ];
}
function normalizeCountryCode(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "GB";
  if (/^[A-Za-z]{2}$/.test(raw)) return raw.toUpperCase() === "UK" ? "GB" : raw.toUpperCase();
  const mapped = COUNTRY_TOKENS[raw.toLowerCase()];
  return mapped || raw.toUpperCase();
}
function parseAddressString(raw, fallbackName = "") {
  const text = String(raw || "").trim();
  if (!text) return { fullName: fallbackName };
  let segments = text.split(",").map((s) => s.trim()).filter(Boolean);
  const deduped = [];
  for (const seg of segments) {
    if (!deduped.some((existing) => existing.toLowerCase() === seg.toLowerCase())) {
      deduped.push(seg);
    }
  }
  segments = deduped;
  let countryCode = "";
  let postcode = "";
  let city = "";
  if (segments.length > 1) {
    const last = segments[segments.length - 1].toLowerCase();
    if (COUNTRY_TOKENS[last]) {
      countryCode = COUNTRY_TOKENS[last];
      segments.pop();
    }
  }
  for (let i = segments.length - 1; i >= 0; i--) {
    const match = segments[i].match(UK_POSTCODE_RE2);
    if (!match) continue;
    postcode = `${match[1]} ${match[2]}`.toUpperCase();
    const remainder = segments[i].replace(match[0], "").trim().replace(/^[,\s-]+|[,\s-]+$/g, "");
    if (remainder) {
      segments[i] = remainder;
    } else {
      segments.splice(i, 1);
    }
    break;
  }
  if (segments.length > 1) {
    city = segments.pop();
  }
  return {
    fullName: fallbackName,
    addressLine1: segments[0] || "",
    addressLine2: segments.slice(1).join(", "),
    city,
    postcode,
    countryCode: countryCode || "GB"
  };
}
function resolveRecipientFromOrder(order) {
  const structured = (order.shippingAddress && typeof order.shippingAddress === "object" ? order.shippingAddress : null) || (order.data?.shippingAddress && typeof order.data.shippingAddress === "object" ? order.data.shippingAddress : null) || (order.data?.address && typeof order.data.address === "object" ? order.data.address : null) || (order.address && typeof order.address === "object" ? order.address : null);
  const rawAddr = structured || order.data?.address || order.address || order.shippingAddress || order.destination || "";
  let addressObj = {};
  if (rawAddr && typeof rawAddr === "object") {
    addressObj = {
      fullName: rawAddr.fullName || rawAddr.name || order.customerName,
      companyName: rawAddr.companyName || "",
      addressLine1: rawAddr.addressLine1 || rawAddr.street || rawAddr.line1 || "",
      addressLine2: rawAddr.addressLine2 || rawAddr.line2 || "",
      city: rawAddr.city || rawAddr.town || "",
      county: rawAddr.county || rawAddr.state || "",
      postcode: rawAddr.postcode || rawAddr.zip || "",
      countryCode: rawAddr.countryCode || rawAddr.country || "GB",
      email: order.customerEmail,
      phone: rawAddr.phone || order.customerPhone || ""
    };
  } else {
    const parsedFromString = parseAddressString(
      typeof rawAddr === "string" ? rawAddr : "",
      order.customerName || ""
    );
    addressObj = {
      ...parsedFromString,
      email: order.customerEmail,
      phone: order.customerPhone || ""
    };
  }
  const validation = validateAddress(addressObj);
  return {
    valid: validation.valid,
    errors: validation.errors,
    recipient: validation.parsed
  };
}
async function testServiceCode(serviceCode, tradingNameOverride) {
  const code = String(serviceCode ?? "").trim().toUpperCase();
  if (!code) {
    return { serviceCode: code, accepted: false, message: "No service code supplied.", cleanedUp: false };
  }
  const settings = await getRoyalMailSettings();
  const apiKey = await requireApiKey(settings);
  const overrideName = String(tradingNameOverride || "").trim();
  const sender = overrideName ? { ...settings.senderAddress || {}, companyName: overrideName } : requireSender(settings);
  const reference = `SVC-TEST-${Date.now().toString().slice(-8)}`;
  const payload = {
    orderReference: reference,
    isRecipientABusiness: false,
    recipient: {
      address: {
        fullName: "Service Code Test",
        addressLine1: sender.addressLine1 || "1 Test Street",
        city: sender.city || "London",
        postcode: sender.postcode || "EC1A 1BB",
        countryCode: "GB"
      }
    },
    sender: { tradingName: sender.companyName.trim() },
    subtotal: 1,
    shippingCostCharged: 0,
    total: 1,
    currencyCode: "GBP",
    orderDate: (/* @__PURE__ */ new Date()).toISOString(),
    packages: [
      {
        weightInGrams: settings.defaultWeightGrams || 70,
        packageFormatIdentifier: resolvePackageFormat(settings.defaultPackageType),
        contents: [{ name: "Service code test", quantity: 1, unitValue: 1, unitWeightInGrams: 100 }]
      }
    ],
    postageDetails: {
      serviceCode: code,
      // Same rule as a real shipment: a service without despatch notifications
      // rejects the flag, which would make a perfectly valid code look invalid.
      ...serviceSupportsNotifications(code) ? { sendNotificationsTo: "Sender" } : {}
    }
  };
  let result;
  try {
    result = await createRoyalMailOrders([payload], apiKey);
  } catch (err) {
    return { serviceCode: code, accepted: false, message: err?.message || String(err), cleanedUp: false };
  }
  const failed = result?.failedOrders?.[0];
  if (failed) {
    const errors = Array.isArray(failed.errors) ? failed.errors : failed.errors ? [failed.errors] : [];
    const message = errors.map((e) => e?.errorMessage || e?.message || JSON.stringify(e)).join(" | ");
    return { serviceCode: code, accepted: false, message: message || "Rejected by Royal Mail.", cleanedUp: false };
  }
  const identifier = result?.createdOrders?.[0]?.orderIdentifier;
  let cleanedUp = false;
  if (identifier) {
    try {
      await cancelOrder(String(identifier), apiKey);
      cleanedUp = true;
    } catch (delErr) {
      console.warn(
        `[RoyalMailService] Test order ${identifier} for ${code} could not be removed automatically:`,
        delErr?.message
      );
    }
  }
  return {
    serviceCode: code,
    accepted: true,
    message: cleanedUp ? `Royal Mail accepts "${code}" on this account.` : `Royal Mail accepts "${code}", but the throwaway test order (${identifier}) is still in Click & Drop and should be deleted manually.`,
    cleanedUp
  };
}
async function createRoyalMailShipment(orderId, options = {}) {
  const settings = await getRoyalMailSettings();
  const apiKey = await requireApiKey(settings);
  const sender = requireSender(settings);
  const orders = await fetchResource("orders") || [];
  let order = orders.find((o) => String(o.id) === String(orderId));
  if (!order) {
    try {
      const { prisma: prisma2 } = await Promise.resolve().then(() => (init_prisma(), prisma_exports));
      order = await prisma2.order.findUnique({ where: { id: orderId } });
    } catch (_e) {
    }
  }
  if (!order) {
    throw new Error(`Order #${orderId} not found in database.`);
  }
  const { valid, errors, recipient } = resolveRecipientFromOrder(order);
  if (!valid) {
    throw new Error(
      `Order #${orderId} cannot be shipped \u2014 the delivery address is incomplete: ${errors.join("; ")}. Edit the order's shipping address before creating a Royal Mail shipment.`
    );
  }
  const requestedServiceCode = String(options.serviceCode ?? settings.defaultServiceCode ?? "").trim().toUpperCase();
  const serviceCode = resolveServiceCode(requestedServiceCode);
  const serviceDowngraded = Boolean(requestedServiceCode) && serviceCode !== requestedServiceCode;
  const registerCode = String(options.serviceRegisterCode || settings.defaultServiceRegisterCode || "").trim();
  const rates = getShippingRates(options.weightGrams || settings.defaultWeightGrams, recipient.countryCode);
  const selectedRate = rates.find((r) => r.serviceCode === serviceCode);
  const serviceName = selectedRate?.serviceName || (serviceCode ? `Royal Mail (${serviceCode})` : "Royal Mail (postage set in Click & Drop)");
  console.log(`[RoyalMailService] Creating live Click & Drop order for #${orderId} via ${serviceCode}`);
  const addressObj = {
    fullName: recipient.fullName,
    addressLine1: recipient.addressLine1,
    city: recipient.city,
    postcode: recipient.postcode,
    countryCode: recipient.countryCode || "GB"
  };
  if (recipient.companyName?.trim()) addressObj.companyName = recipient.companyName.trim();
  if (recipient.addressLine2?.trim()) addressObj.addressLine2 = recipient.addressLine2.trim();
  if (recipient.county?.trim()) addressObj.county = recipient.county.trim();
  const recipientObj = { address: addressObj };
  if (recipient.email) recipientObj.emailAddress = recipient.email.trim();
  if (recipient.phone?.trim()) recipientObj.phoneNumber = recipient.phone.trim();
  const senderObj = { tradingName: sender.companyName.trim() };
  if (sender.contactPhone?.trim()) senderObj.phoneNumber = sender.contactPhone.trim();
  if (sender.contactEmail?.trim()) senderObj.emailAddress = sender.contactEmail.trim();
  const money = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : NaN;
  };
  const round2 = (n) => Math.round(n * 100) / 100;
  const totalVal = Number(order.total) || 0;
  const itemsTotal = Array.isArray(order.items) ? round2(
    order.items.reduce(
      (sum2, it) => sum2 + (Number(it?.price) || 0) * (Number(it?.quantity) || 1),
      0
    )
  ) : 0;
  let shippingVal = [
    order.shippingCost,
    order.deliveryCost,
    order.data?.shippingCost,
    order.data?.deliveryCost
  ].map(money).find((n) => Number.isFinite(n));
  if (!Number.isFinite(shippingVal)) {
    shippingVal = itemsTotal > 0 && totalVal > itemsTotal ? round2(totalVal - itemsTotal) : 0;
  }
  let subtotalVal = [order.subtotal, order.data?.subtotal].map(money).find((n) => Number.isFinite(n));
  if (!Number.isFinite(subtotalVal)) {
    subtotalVal = itemsTotal > 0 ? itemsTotal : Math.max(0, round2(totalVal - shippingVal));
  }
  const payload = {
    orderReference: String(order.id),
    isRecipientABusiness: Boolean(recipient.companyName?.trim()),
    recipient: recipientObj,
    sender: senderObj,
    subtotal: Math.round(subtotalVal * 100) / 100,
    shippingCostCharged: Math.round(shippingVal * 100) / 100,
    total: Math.round(totalVal * 100) / 100,
    currencyCode: "GBP",
    orderDate: order.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
    packages: [
      {
        weightInGrams: options.weightGrams || settings.defaultWeightGrams || 70,
        packageFormatIdentifier: resolvePackageFormat(options.packageType || settings.defaultPackageType),
        contents: Array.isArray(order.items) && order.items.length > 0 ? order.items.map((it) => ({
          name: it.productTitle || it.title || "Pouch Supply Item",
          SKU: it.sku || void 0,
          quantity: Number(it.quantity) || 1,
          unitValue: Number(it.price) || 0,
          unitWeightInGrams: Number(it.weightGrams) || 100
        })) : [
          {
            name: "Pouch Supply Package",
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
      ...serviceCode ? { serviceCode } : {},
      ...serviceCode && registerCode ? { serviceRegisterCode: registerCode } : {},
      // Only for services that carry them. The OLP range does not, and the flags
      // fail the whole order rather than being ignored. Royal Mail rejects
      // anything outside Sender/Recipient/Billing for sendNotificationsTo, and it
      // rejects the whole order, not just this field.
      ...serviceSupportsNotifications(serviceCode) ? {
        sendNotificationsTo: recipientObj.emailAddress ? "Recipient" : "Sender",
        receiveEmailNotification: Boolean(recipientObj.emailAddress),
        receiveSmsNotification: Boolean(recipientObj.phoneNumber)
      } : {}
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
  let result = await postOrder(payload, apiKey, orderId);
  if (collectFailureMessages(result).some((m) => NOTIFICATION_UNAVAILABLE_RE.test(m)) && payload.postageDetails && "receiveEmailNotification" in payload.postageDetails) {
    console.warn(
      `[RoyalMailService] Service ${serviceCode || "(none)"} does not support Click & Drop despatch notifications; retrying without them. The store sends its own dispatch email.`
    );
    delete payload.postageDetails.sendNotificationsTo;
    delete payload.postageDetails.receiveEmailNotification;
    delete payload.postageDetails.receiveSmsNotification;
    result = await postOrder(payload, apiKey, orderId);
  }
  if (result?.failedOrders && result.failedOrders.length > 0) {
    const errMsgs = [];
    let unknownServiceCode = false;
    result.failedOrders.forEach((f) => {
      const errors2 = Array.isArray(f.errors) ? f.errors : f.errors ? [f.errors] : [];
      errors2.forEach((e) => {
        if (Number(e?.errorCode) === 31) unknownServiceCode = true;
        errMsgs.push(e?.errorMessage || e?.message || e?.code || JSON.stringify(e));
      });
    });
    let detail = errMsgs.join(" | ") || "unknown error";
    if (unknownServiceCode) {
      detail += ` \u2014 "${serviceCode}" is not a service Royal Mail will accept for this account. The domestic services on this contract are OLP1 (1st Class), OLP1SF (Signed For 1st Class), OLP2 (2nd Class) and OLP2SF (Signed For 2nd Class). Set one of those in Admin > Settings > Royal Mail, or leave the service code blank and apply postage in Click & Drop. If the contract has changed, check business.parcel.royalmail.com/settings/services/ or POST /api/royalmail/test-service-code to have Royal Mail confirm a code directly.`;
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
  let trackingNumber = createdOrder.trackingNumber || createdOrder.packages?.[0]?.trackingNumber || null;
  const labelErrors = Array.isArray(createdOrder.labelErrors) ? createdOrder.labelErrors.map((e) => e?.message).filter(Boolean) : [];
  if (labelErrors.length > 0) {
    console.error(
      `[RoyalMailService] Royal Mail could not generate the label for #${orderId}: ${labelErrors.join("; ")}`
    );
  }
  if (!trackingNumber) {
    try {
      const detail = await getOrderByReference(royalMailOrderId, apiKey);
      trackingNumber = detail?.trackingNumber || detail?.packages?.[0]?.trackingNumber || null;
    } catch (lookupErr) {
      console.warn(`[RoyalMailService] Tracking lookup for #${orderId} deferred:`, lookupErr?.message);
    }
  }
  const carrierName = serviceName;
  const labelUrl = `/api/royalmail/label/${encodeURIComponent(royalMailOrderId)}/pdf`;
  const nextFulfillment = trackingNumber ? "Shipped" : "Unfulfilled";
  const shippedOrder = {
    ...order,
    fulfillmentStatus: nextFulfillment,
    trackingNumber,
    trackingId: trackingNumber,
    carrier: carrierName,
    data: {
      ...order.data || {},
      royalMail: {
        royalMailOrderId,
        trackingNumber,
        serviceCode,
        serviceName,
        carrier: carrierName,
        labelUrl,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        shippedAt: trackingNumber ? (/* @__PURE__ */ new Date()).toISOString() : null,
        addressValidation: { valid, errors }
      }
    }
  };
  let updatedOrder = shippedOrder;
  try {
    const { saveSingleOrder: saveSingleOrder2 } = await Promise.resolve().then(() => (init_orders(), orders_exports));
    updatedOrder = await saveSingleOrder2(shippedOrder);
  } catch (saveErr) {
    console.error("[RoyalMailService] Order save error, falling back to direct store write:", saveErr?.message);
    try {
      const currentOrders = await fetchResource("orders") || [];
      const idx = currentOrders.findIndex((o) => String(o.id) === String(orderId));
      if (idx !== -1) {
        currentOrders[idx] = shippedOrder;
      } else {
        currentOrders.unshift(shippedOrder);
      }
      await saveResource("orders", currentOrders);
    } catch (resourceErr) {
      console.error("[RoyalMailService] StoreResource save error:", resourceErr);
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
    message: (serviceDowngraded ? `Service ${requestedServiceCode} is not on this Click & Drop contract, so ${serviceCode} was used instead \u2014 add ${requestedServiceCode} in Click & Drop > Settings > Services if you need it. ` : "") + (trackingNumber ? `Royal Mail shipment created. Tracking ${trackingNumber}.` : labelErrors.length > 0 ? `Royal Mail order ${royalMailOrderId} was created on ${serviceName}, but the label could not be generated, so no tracking number was issued: ${labelErrors.join("; ")}. Check the postage balance on the Click & Drop account, then press Sync.` : `Royal Mail order ${royalMailOrderId} created on ${serviceName}. No tracking number was issued yet \u2014 generate the label in Click & Drop, then press Sync.`),
    order: updatedOrder
  };
}
async function dispatchRoyalMailShipment(orderId) {
  const apiKey = await requireApiKey();
  const orders = await fetchResource("orders") || [];
  const order = orders.find((o) => String(o.id) === String(orderId));
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
  let trackingNumber = order.trackingNumber || order.trackingId || null;
  try {
    const detail = await getOrderByReference(String(royalMailOrderId), apiKey);
    trackingNumber = detail?.trackingNumber || detail?.packages?.[0]?.trackingNumber || trackingNumber;
  } catch (_e) {
  }
  const { saveSingleOrder: saveSingleOrder2 } = await Promise.resolve().then(() => (init_orders(), orders_exports));
  const updatedOrder = await saveSingleOrder2({
    ...order,
    fulfillmentStatus: "Shipped",
    trackingNumber,
    trackingId: trackingNumber,
    data: {
      ...order.data || {},
      royalMail: {
        ...order.data?.royalMail || {},
        trackingNumber,
        status: "despatched",
        shippedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    }
  });
  return {
    success: true,
    message: `Order #${orderId} marked as despatched with Royal Mail.`,
    order: updatedOrder
  };
}
async function getRoyalMailLabelForOrder(orderId, options = {}) {
  const apiKey = await requireApiKey();
  const orders = await fetchResource("orders") || [];
  const order = orders.find((o) => String(o.id) === String(orderId));
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
async function cancelRoyalMailShipment(orderId, royalMailOrderId) {
  const apiKey = await requireApiKey();
  const orders = await fetchResource("orders") || [];
  const order = orders.find((o) => String(o.id) === String(orderId));
  const ref = royalMailOrderId || order?.data?.royalMail?.royalMailOrderId;
  if (!ref) {
    throw new Error(`Order #${orderId} has no Royal Mail shipment to cancel.`);
  }
  await cancelOrder(String(ref), apiKey);
  if (order) {
    const { saveSingleOrder: saveSingleOrder2 } = await Promise.resolve().then(() => (init_orders(), orders_exports));
    await saveSingleOrder2({
      ...order,
      fulfillmentStatus: "Unfulfilled",
      trackingNumber: null,
      trackingId: null,
      carrier: null,
      data: {
        ...order.data || {},
        royalMail: {
          ...order.data?.royalMail || {},
          status: "Cancelled",
          trackingNumber: null,
          cancelledAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      }
    });
  }
  return { success: true, message: "Shipment cancelled in Royal Mail Click & Drop." };
}
async function getRoyalMailTracking(trackingNumberOrQuery) {
  const query = (trackingNumberOrQuery || "").trim();
  const apiKey = await requireApiKey();
  let matchedOrder = null;
  try {
    const orders = await fetchResource("orders") || [];
    matchedOrder = orders.find(
      (o) => String(o.trackingNumber || "").toUpperCase() === query.toUpperCase() || String(o.trackingId || "").toUpperCase() === query.toUpperCase() || String(o.id || "").toUpperCase() === query.toUpperCase() || String(o.data?.royalMail?.trackingNumber || "").toUpperCase() === query.toUpperCase() || String(o.data?.royalMail?.royalMailOrderId || "").toUpperCase() === query.toUpperCase()
    );
  } catch (_e) {
  }
  const royalMailOrderId = matchedOrder?.data?.royalMail?.royalMailOrderId;
  const lookupRef = royalMailOrderId || (matchedOrder?.id ? String(matchedOrder.id) : query);
  let cdOrder = null;
  try {
    cdOrder = await getOrderByReference(String(lookupRef), apiKey);
  } catch (err) {
    if (err instanceof RoyalMailError && err.status === 404) {
      throw new Error(
        `Royal Mail has no record of "${query}". Confirm the shipment was created in Click & Drop.`
      );
    }
    throw err;
  }
  const trackingNumber = cdOrder?.trackingNumber || cdOrder?.packages?.[0]?.trackingNumber || matchedOrder?.trackingNumber || null;
  const state = readClickAndDropState(cdOrder);
  const rawStatus = String(cdOrder?.status || cdOrder?.orderStatus || "").trim();
  const statusLower = rawStatus.toLowerCase();
  let displayStatus;
  let statusDescription;
  let estimatedDelivery;
  if (statusLower.includes("deliver")) {
    displayStatus = "Delivered";
    statusDescription = "Royal Mail has recorded this item as delivered.";
    estimatedDelivery = "Delivered";
  } else if (statusLower.includes("cancel")) {
    displayStatus = "Cancelled";
    statusDescription = "This Click & Drop order has been cancelled.";
    estimatedDelivery = "Cancelled";
  } else if (state.despatchedOn) {
    displayStatus = "Dispatched";
    statusDescription = "Item has been despatched to Royal Mail.";
    estimatedDelivery = "See Royal Mail tracking";
  } else if (state.labelGenerated) {
    displayStatus = "Awaiting Despatch";
    statusDescription = "Postage label generated. Royal Mail has not yet confirmed the parcel was handed over.";
    estimatedDelivery = "Awaiting despatch";
  } else {
    displayStatus = rawStatus || "Awaiting Despatch";
    statusDescription = "Royal Mail has the order. No scan events have been recorded yet.";
    estimatedDelivery = "Awaiting despatch";
  }
  const history = [];
  const pushEvent = (iso, status, description) => {
    if (!iso) return;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return;
    history.push({
      timestamp: `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      location: "Royal Mail Click & Drop",
      status,
      description
    });
  };
  pushEvent(cdOrder?.shippedOn, "Despatched", "Item despatched to Royal Mail.");
  pushEvent(cdOrder?.manifestedOn, "Manifested", "Order manifested with Royal Mail.");
  pushEvent(cdOrder?.printedOn, "Label Printed", "Postage label generated.");
  pushEvent(cdOrder?.createdOn, "Order Created", "Shipment registered in Click & Drop.");
  const rawAddr = matchedOrder?.data?.address || matchedOrder?.destination || "";
  const destinationStr = rawAddr && typeof rawAddr === "object" ? [rawAddr.city, rawAddr.postcode].filter(Boolean).join(", ") : String(rawAddr || "");
  return {
    trackingNumber,
    orderId: matchedOrder?.id,
    royalMailOrderId: royalMailOrderId ? String(royalMailOrderId) : void 0,
    status: displayStatus,
    statusDescription,
    carrier: matchedOrder?.carrier || "Royal Mail",
    estimatedDelivery,
    recipientLocation: destinationStr || void 0,
    officialTrackingUrl: trackingNumber ? `https://www.royalmail.com/track-your-item#/tracking-details/${encodeURIComponent(trackingNumber)}` : null,
    isLive: true,
    history
  };
}
function readClickAndDropState(cdOrder) {
  const trackingNumber = cdOrder?.trackingNumber || cdOrder?.packages?.[0]?.trackingNumber || null;
  const printedOn = cdOrder?.printedOn || null;
  const despatchedOn = cdOrder?.shippedOn || cdOrder?.despatchedOn || cdOrder?.manifestedOn || null;
  const labelGenerated = Boolean(printedOn || trackingNumber);
  return {
    trackingNumber: trackingNumber ? String(trackingNumber) : null,
    printedOn,
    despatchedOn,
    labelGenerated,
    labelStatus: despatchedOn ? "despatched" : labelGenerated ? "generated" : "awaiting_label"
  };
}
async function syncRoyalMailOrderStatus(orderId) {
  const apiKey = await requireApiKey();
  const orders = await fetchResource("orders") || [];
  const order = orders.find((o) => String(o.id) === String(orderId));
  if (!order) {
    throw new Error(`Order #${orderId} not found.`);
  }
  const royalMailOrderId = order.data?.royalMail?.royalMailOrderId;
  if (!royalMailOrderId) {
    throw new Error(`Order #${orderId} has no Royal Mail shipment to sync.`);
  }
  const cdOrder = await getOrderByReference(String(royalMailOrderId), apiKey);
  if (!cdOrder) {
    throw new Error(`Royal Mail returned no record for Click & Drop order ${royalMailOrderId}.`);
  }
  const state = readClickAndDropState(cdOrder);
  const newTrackingNumber = state.trackingNumber || order.trackingNumber || order.trackingId || null;
  const canAdvanceFromCurrentStatus = order.fulfillmentStatus === "Unfulfilled";
  const despatchConfirmedByRoyalMail = Boolean(state.despatchedOn);
  const updatedFulfillment = canAdvanceFromCurrentStatus && Boolean(newTrackingNumber) && despatchConfirmedByRoyalMail ? "Shipped" : order.fulfillmentStatus;
  const syncedOrder = {
    ...order,
    fulfillmentStatus: updatedFulfillment,
    trackingNumber: newTrackingNumber,
    trackingId: newTrackingNumber,
    data: {
      ...order.data || {},
      royalMail: {
        ...order.data?.royalMail || {},
        trackingNumber: newTrackingNumber,
        // The real label state as Royal Mail reports it, so the dashboard shows
        // what Click & Drop actually holds instead of an admin's guess.
        labelStatus: state.labelStatus,
        labelGenerated: state.labelGenerated,
        printedOn: state.printedOn,
        despatchedOn: state.despatchedOn,
        shippedAt: order.data?.royalMail?.shippedAt || (updatedFulfillment === "Shipped" ? (/* @__PURE__ */ new Date()).toISOString() : null),
        syncedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    }
  };
  const { saveSingleOrder: saveSingleOrder2 } = await Promise.resolve().then(() => (init_orders(), orders_exports));
  const updatedOrder = await saveSingleOrder2(syncedOrder);
  const statusChanged = updatedFulfillment !== order.fulfillmentStatus;
  const message = newTrackingNumber ? `Synced with Royal Mail. Tracking ${newTrackingNumber}.` + (statusChanged ? " Royal Mail confirmed despatch, so the order is now marked Shipped." : despatchConfirmedByRoyalMail ? "" : " Royal Mail has not confirmed despatch yet, so the fulfilment status is unchanged.") : `Synced with Royal Mail. Click & Drop order ${royalMailOrderId} exists but its label has not been generated yet, so no tracking number has been allocated.`;
  return {
    success: true,
    order: updatedOrder,
    message,
    clickAndDropStatus: state.labelStatus
  };
}
async function syncPendingRoyalMailTracking(options = {}) {
  const limit = options.limit ?? 40;
  const orders = await fetchResource("orders") || [];
  const pending = orders.filter((o) => {
    const rm = o?.data?.royalMail;
    if (!rm?.royalMailOrderId) return false;
    if (o.fulfillmentStatus === "Cancelled") return false;
    if (!rm.trackingNumber) return true;
    return !rm.despatchedOn && o.fulfillmentStatus === "Unfulfilled";
  }).slice(0, limit);
  const results = [];
  let updated = 0;
  for (const order of pending) {
    const orderId = String(order.id);
    try {
      const hadTracking = Boolean(order?.data?.royalMail?.trackingNumber);
      const res = await syncRoyalMailOrderStatus(orderId);
      const tracking = res.order?.trackingNumber || res.order?.data?.royalMail?.trackingNumber || null;
      const despatched = Boolean(res.order?.data?.royalMail?.despatchedOn);
      if (tracking && !hadTracking) {
        updated++;
        console.log(`[RoyalMail Sync] Order ${orderId}: tracking ${tracking} collected from Click & Drop.`);
        results.push({ orderId, status: "tracking_found", trackingNumber: tracking });
      } else if (despatched) {
        if (!hadTracking) updated++;
        console.log(`[RoyalMail Sync] Order ${orderId}: despatch confirmed by Royal Mail.`);
        results.push({ orderId, status: "despatch_confirmed", trackingNumber: tracking });
      } else if (tracking) {
        results.push({ orderId, status: "awaiting_despatch", trackingNumber: tracking });
      } else {
        results.push({ orderId, status: "awaiting_label" });
      }
    } catch (err) {
      console.warn(`[RoyalMail Sync] Order ${orderId} could not be synced:`, err?.message);
      results.push({ orderId, status: "error", reason: err?.message || "Sync failed" });
    }
  }
  return { success: true, checked: pending.length, updated, results };
}
async function createRoyalMailReturnLabel(orderId) {
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
var DEFAULT_ROYAL_MAIL_SETTINGS, UK_SERVICE_CODES, LEGACY_SERVICE_CODE_MAP, NOTIFICATION_UNAVAILABLE_RE, PACKAGE_FORMATS, PACKAGE_FORMAT_ALIASES, UK_POSTCODE_RE2, COUNTRY_TOKENS;
var init_royalMailService = __esm({
  "backend/services/royalMailService.ts"() {
    init_serverDb();
    init_royalMail();
    DEFAULT_ROYAL_MAIL_SETTINGS = {
      apiKey: process.env.RM_API_KEY || process.env.ROYAL_MAIL_API_KEY || "",
      integrationName: "Pouch-Supply",
      enabled: true,
      autoCreateShipmentOnPayment: String(process.env.ROYAL_MAIL_AUTO_DISPATCH || "").toLowerCase() === "true",
      // Royal Mail Tracked 24 (Online Postage). Verified accepted on this account.
      // Tracked is the default because it is the only family that issues a tracking
      // number — without one the order can never move to Shipped and no dispatch
      // email is sent. Change it in Admin → Settings → Royal Mail; blanking it is
      // still valid and means "apply postage in Click & Drop".
      defaultServiceCode: "TOLP24",
      // Click & Drop reads 'parcel' as LARGE Parcel, which Royal Mail refuses to
      // carry on Tracked 24/48 -- the order is created but the label cannot be
      // generated, so no tracking number is ever issued. A small parcel is the
      // format these packs actually are and is valid on every service here.
      defaultPackageType: "smallParcel",
      defaultWeightGrams: 70,
      senderAddress: {
        companyName: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        postcode: "",
        countryCode: "GB",
        contactEmail: process.env.ADMIN_NOTIFICATION_EMAIL || "",
        contactPhone: ""
      }
    };
    UK_SERVICE_CODES = ["TOLP24", "TOLP48", "OLP1", "OLP1SF", "OLP2", "OLP2SF"];
    LEGACY_SERVICE_CODE_MAP = {
      // Tracked equivalents. These used to collapse onto OLP1/OLP2, which quietly
      // turned a tracked service into an untracked one — the parcel shipped, no
      // tracking number was ever issued, and the order stayed Unfulfilled.
      TPNN: "TOLP24",
      TRNN: "TOLP24",
      TPN24: "TOLP24",
      TPSN: "TOLP48",
      TRSN: "TOLP48",
      TPS48: "TOLP48",
      // Untracked 1st Class equivalents
      CRL1: "OLP1",
      BPL1: "OLP1",
      // Untracked 2nd Class equivalents
      CRL2: "OLP2",
      BPL2: "OLP2",
      // Signature-on-delivery equivalents
      TPNS: "OLP1SF",
      TPSS: "OLP2SF",
      BPR1: "OLP1SF",
      BPR2: "OLP2SF",
      SD1: "OLP1SF",
      SD2: "OLP1SF"
    };
    NOTIFICATION_UNAVAILABLE_RE = /notification is not available|notifications are not available/i;
    PACKAGE_FORMATS = [
      "letter",
      "largeLetter",
      "smallParcel",
      "mediumParcel",
      "parcel",
      "documents",
      "tube"
    ];
    PACKAGE_FORMAT_ALIASES = {
      LETTER: "letter",
      LARGELETTER: "largeLetter",
      "LARGE LETTER": "largeLetter",
      SMALLPARCEL: "smallParcel",
      "SMALL PARCEL": "smallParcel",
      MEDIUMPARCEL: "mediumParcel",
      "MEDIUM PARCEL": "mediumParcel",
      // 'Parcel' was the old stored default and means LARGE parcel to Click & Drop,
      // which is what broke label generation. Read it as a medium parcel: the
      // largest format the tracked services accept.
      PARCEL: "mediumParcel",
      "LARGE PARCEL": "parcel",
      DOCUMENTS: "documents",
      TUBE: "tube"
    };
    UK_POSTCODE_RE2 = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i;
    COUNTRY_TOKENS = {
      "united kingdom": "GB",
      "great britain": "GB",
      uk: "GB",
      gb: "GB",
      england: "GB",
      scotland: "GB",
      wales: "GB",
      "northern ireland": "GB",
      ireland: "IE",
      "republic of ireland": "IE"
    };
  }
});

// backend/services/subscriptionCron.ts
var subscriptionCron_exports = {};
__export(subscriptionCron_exports, {
  CHARGEABLE_STATUS: () => CHARGEABLE_STATUS,
  addBillingInterval: () => addBillingInterval,
  buildRenewalOrderRef: () => buildRenewalOrderRef,
  calculateNextBillingDate: () => calculateNextBillingDate,
  currentSubscriptionStatus: () => currentSubscriptionStatus,
  effectiveSubscriptionStatus: () => effectiveSubscriptionStatus,
  isChargeableStatus: () => isChargeableStatus,
  nextBillingDateAfterCharge: () => nextBillingDateAfterCharge,
  normalizeBillingInterval: () => normalizeBillingInterval,
  processDueSubscriptions: () => processDueSubscriptions,
  renewalTransactionReference: () => renewalTransactionReference,
  startSubscriptionRenewalWorker: () => startSubscriptionRenewalWorker
});
function normalizeBillingInterval(raw) {
  const s = String(raw ?? "").toLowerCase().trim();
  if (!s) return "month";
  const dayCount = s.match(/(\d+)\s*(?:d|day|days)\b/);
  if (dayCount) {
    const n = parseInt(dayCount[1], 10);
    if (n <= 1) return "1day";
    if (n <= 7) return "weekly";
    if (n <= 14) return "bi-weekly";
    if (n <= 31) return "month";
    return "year";
  }
  if (/year|annual|12\s*month/.test(s)) return "year";
  if (/bi[\s_-]*week|biweek|fortnight/.test(s)) return "bi-weekly";
  if (/month/.test(s)) return "month";
  if (/week/.test(s)) return "weekly";
  if (/next[\s_-]*day|daily|per\s*day|every\s*day|^day$|^1day$/.test(s)) return "1day";
  return "month";
}
function addBillingInterval(interval, fromDate) {
  const next = new Date(fromDate);
  switch (interval) {
    case "1day":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "bi-weekly":
      next.setDate(next.getDate() + 14);
      break;
    case "year":
      next.setFullYear(next.getFullYear() + 1);
      break;
    case "month":
    default:
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}
function calculateNextBillingDate(interval, fromDate = /* @__PURE__ */ new Date()) {
  return addBillingInterval(normalizeBillingInterval(interval), fromDate);
}
function nextBillingDateAfterCharge(interval, scheduledFor, now = /* @__PURE__ */ new Date()) {
  const norm = normalizeBillingInterval(interval);
  const anchor = scheduledFor && !isNaN(new Date(scheduledFor).getTime()) ? new Date(scheduledFor) : new Date(now);
  let next = addBillingInterval(norm, anchor);
  let guard = 0;
  while (next <= now && guard < 400) {
    next = addBillingInterval(norm, next);
    guard++;
  }
  return next;
}
function isChargeableStatus(status) {
  return String(status ?? "").trim().toLowerCase() === CHARGEABLE_STATUS;
}
function effectiveSubscriptionStatus(a, b) {
  const sa = String(a ?? "").trim().toLowerCase();
  const sb = String(b ?? "").trim().toLowerCase();
  if (!sa) return sb;
  if (!sb) return sa;
  if (sa === sb) return sa;
  if (!isChargeableStatus(sa)) return sa;
  if (!isChargeableStatus(sb)) return sb;
  return sa;
}
async function currentSubscriptionStatus(subId) {
  let fromPrisma;
  let fromStore;
  let readAnything = false;
  try {
    const row = await prisma.subscription.findUnique({
      where: { id: String(subId) },
      select: { status: true }
    });
    if (row) {
      fromPrisma = row.status;
      readAnything = true;
    }
  } catch (_e) {
  }
  try {
    const stored = await fetchResource("subscriptions") || [];
    const row = stored.find((s) => String(s?.id) === String(subId));
    if (row) {
      fromStore = row.status;
      readAnything = true;
    }
  } catch (_e) {
  }
  if (!readAnything) return "unverifiable";
  return effectiveSubscriptionStatus(fromStore, fromPrisma) || "unverifiable";
}
async function loadAllSubscriptions() {
  const byId = /* @__PURE__ */ new Map();
  const isConnected = await getDb().catch(() => false);
  if (isConnected) {
    try {
      const rows = await prisma.subscription.findMany();
      for (const row of rows || []) {
        byId.set(String(row.id), row);
      }
    } catch (_e) {
    }
  }
  try {
    const stored = await fetchResource("subscriptions") || [];
    for (const row of stored) {
      if (!row || !row.id) continue;
      const key = String(row.id);
      const fromPrisma = byId.get(key);
      const merged = { ...row || {}, ...fromPrisma || {} };
      merged.status = effectiveSubscriptionStatus(row?.status, fromPrisma?.status);
      byId.set(key, merged);
    }
  } catch (_e) {
  }
  return Array.from(byId.values());
}
async function persistSubscriptionUpdate(subId, updateData) {
  const prismaData = {};
  for (const [key, value] of Object.entries(updateData)) {
    if (PRISMA_SUBSCRIPTION_FIELDS.has(key)) prismaData[key] = value;
  }
  if (Object.keys(prismaData).length > 0) {
    try {
      await prisma.subscription.update({ where: { id: subId }, data: prismaData });
    } catch (_e) {
    }
  }
  try {
    const storedSubs = await fetchResource("subscriptions") || [];
    const updatedList = storedSubs.map(
      (s) => String(s.id) === String(subId) ? { ...s, ...updateData } : s
    );
    await saveResource("subscriptions", updatedList);
  } catch (_e) {
  }
}
function renewalTransactionReference(orderId) {
  return `SUB-ORD-${String(orderId).trim()}`;
}
function buildRenewalOrderRef(sub, dueDate) {
  const parentId = String(sub.sourceOrderId || sub.id || "").trim() || String(sub.id);
  const periodStart = dueDate && !isNaN(new Date(dueDate).getTime()) ? new Date(dueDate) : /* @__PURE__ */ new Date();
  const stamp = `${periodStart.getUTCFullYear()}${String(periodStart.getUTCMonth() + 1).padStart(2, "0")}${String(periodStart.getUTCDate()).padStart(2, "0")}`;
  return { orderId: `${parentId}-R${stamp}`, periodStart };
}
async function renewalOrderExists(orderId) {
  try {
    const row = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
    if (row) return true;
  } catch (_e) {
  }
  try {
    const stored = await fetchResource("orders") || [];
    if (stored.some((o) => String(o?.id) === orderId)) return true;
  } catch (_e) {
  }
  return false;
}
async function resolveDueDate(sub, now) {
  const interval = normalizeBillingInterval(sub.billingInterval);
  if (sub.nextBillingDate) {
    const parsed = new Date(sub.nextBillingDate);
    if (!isNaN(parsed.getTime())) {
      return { due: parsed <= now, scheduledFor: parsed };
    }
  }
  const anchorRaw = sub.lastPaymentAt || sub.createdAt || now;
  const anchor = new Date(anchorRaw);
  const backfilled = addBillingInterval(interval, isNaN(anchor.getTime()) ? now : anchor);
  console.warn(
    `[Subscription Worker] Sub ${sub.id} had no nextBillingDate; backfilling to ${backfilled.toISOString()}.`
  );
  await persistSubscriptionUpdate(String(sub.id), { nextBillingDate: backfilled });
  return { due: backfilled <= now, scheduledFor: backfilled };
}
async function processDueSubscriptions() {
  if (isProcessing) {
    console.log("[Subscription Worker] A renewal run is already in progress; skipping this tick.");
    return { processed: 0, succeeded: 0, failed: 0, skipped: true, details: [] };
  }
  isProcessing = true;
  const now = /* @__PURE__ */ new Date();
  try {
    console.log(`[Subscription Worker] Scanning for due renewals at ${now.toISOString()}...`);
    const allSubs = await loadAllSubscriptions();
    const active = allSubs.filter((s) => String(s.status || "").toLowerCase() === "active");
    const subscriptions = [];
    for (const sub of active) {
      const { due, scheduledFor } = await resolveDueDate(sub, now);
      if (due) subscriptions.push({ sub, scheduledFor });
    }
    console.log(`[Subscription Worker] Found ${subscriptions.length} subscription(s) due for renewal.`);
    const results = [];
    let succeeded = 0;
    let failed = 0;
    const runStartedAt = Date.now();
    for (const { sub, scheduledFor } of subscriptions) {
      const subId = String(sub.id);
      if (Date.now() - runStartedAt > RUN_TIME_BUDGET_MS) {
        console.warn(
          `[Subscription Worker] Run time budget reached; deferring ${subId} and any remaining subscriptions to the next run. They are still due and have not been charged.`
        );
        results.push({ id: subId, status: "deferred", reason: "Run time budget reached" });
        continue;
      }
      const customerEmail = String(sub.customerEmail || "").toLowerCase().trim();
      const recurringHref = sub.worldpayRecurringHref || sub.recurringHref;
      const schemeReference = sub.worldpaySchemeReference;
      const tokenHref = sub.worldpayTokenHref || sub.tokenHref;
      const { amount, promote: promotePendingAmount } = resolveEffectiveAmount(sub, now);
      if (!Number.isFinite(amount) || amount <= 0) {
        console.warn(`[Subscription Worker] Sub ${subId} has no usable amount; skipping.`);
        results.push({ subscriptionId: subId, status: "skipped", reason: "No chargeable amount" });
        continue;
      }
      const currency = sub.currency || "GBP";
      const planName = planTitleFromSubscription(sub);
      const interval = normalizeBillingInterval(sub.billingInterval);
      console.log(
        `[Subscription Worker] Processing renewal for sub ${subId} (${customerEmail}) \u2014 \xA3${amount.toFixed(2)} every ${interval}`
      );
      const hasChargeableInstrument = isUsableTokenHref(tokenHref) || isUsableRecurringHref(recurringHref);
      const hasAgreementOnly = !hasChargeableInstrument && Boolean(schemeReference) && !isPlaceholderCredential(schemeReference);
      if (!hasChargeableInstrument) {
        console.warn(
          `[Subscription Worker] Sub ${subId} skipped: ` + (hasAgreementOnly ? `Worldpay issued the customer agreement (scheme=${schemeReference}) but never delivered a card token, so there is no payment instrument to present. This plan needs the customer to re-authorise. ` : `no usable Worldpay stored credential (token=${tokenHref || "none"}, href=${recurringHref || "none"}, scheme=${schemeReference || "none"}). `) + `The initial payment must be taken with createToken and a customer agreement so Worldpay stores the card and sends the tokenCreated webhook.`
        );
        failed++;
        const credentialFailCount = (sub.failedPaymentCount || 0) + 1;
        const credentialPastDue = credentialFailCount >= MAX_CONSECUTIVE_FAILURES;
        await persistSubscriptionUpdate(subId, {
          lastPaymentStatus: hasAgreementOnly ? "missing_card_token" : "missing_credential",
          lastPaymentError: hasAgreementOnly ? "Worldpay issued the agreement but never delivered a card token" : "No usable Worldpay stored credential",
          failedPaymentCount: credentialFailCount,
          status: credentialPastDue ? "past_due" : "active"
        });
        results.push({
          id: subId,
          status: "skipped",
          nextBillingDate: "unchanged (still due)",
          reason: (hasAgreementOnly ? "Agreement present but no stored card token \u2014 customer must re-authorise" : "Missing Worldpay stored credential") + (credentialPastDue ? ` \u2014 set to past_due after ${credentialFailCount} attempts` : "")
        });
        continue;
      }
      const { orderId: newOrderId, periodStart } = buildRenewalOrderRef(sub, scheduledFor || now);
      const transactionReference = renewalTransactionReference(newOrderId);
      if (await renewalOrderExists(newOrderId)) {
        console.warn(
          `[Subscription Worker] Sub ${subId}: order ${newOrderId} already exists, so this period is already paid. Advancing the schedule without charging again.`
        );
        await persistSubscriptionUpdate(subId, {
          nextBillingDate: nextBillingDateAfterCharge(interval, periodStart, now)
        });
        results.push({ id: subId, status: "skipped", reason: `Already billed as ${newOrderId}` });
        continue;
      }
      const claimedNextBilling = nextBillingDateAfterCharge(interval, periodStart, now);
      const liveStatus = await currentSubscriptionStatus(subId);
      if (!isChargeableStatus(liveStatus)) {
        console.warn(
          `[Subscription Worker] Sub ${subId} is "${liveStatus}" as of now \u2014 NOT charging. A cancellation landed after this run started.`
        );
        results.push({
          id: subId,
          status: "skipped",
          reason: `Cancelled before the charge was sent (status "${liveStatus}")`
        });
        continue;
      }
      try {
        const chargeResult = await chargeRecurringSubscription({
          tokenHref,
          recurringHref,
          transactionReference,
          amount,
          currency,
          schemeReference,
          previousTransactionId: sub.worldpayTransactionId,
          customerEmail
        });
        console.log(`[Subscription Worker] Charge SUCCESS for ${subId}: Tx ${transactionReference}`);
        const shippingAmount = typeof sub.shippingFee === "number" ? sub.shippingFee : typeof sub.shippingCost === "number" ? sub.shippingCost : typeof sub.shippingAmount === "number" ? sub.shippingAmount : typeof sub.deliveryCost === "number" ? sub.deliveryCost : amount >= 40 ? 0 : 2.99;
        const itemSubtotal = Number(Math.max(0, amount - shippingAmount).toFixed(2)) || amount;
        const orderItems = buildRenewalOrderItems(sub, itemSubtotal, planTitleFromSubscription(sub));
        const newOrderData = {
          id: newOrderId,
          orderId: newOrderId,
          customerName: sub.customerName || "Valued Subscriber",
          customerEmail,
          destination: sub.shippingAddress || sub.destination || "United Kingdom",
          items: orderItems,
          // The chosen products travel with the renewal so the order detail view
          // shows the real box contents rather than re-parsing the plan title.
          subscriptionItems: extractBoxItems(sub),
          subscriptionPlan: planName,
          total: amount,
          subtotal: itemSubtotal,
          shippingCost: shippingAmount,
          deliveryCost: shippingAmount,
          storeCreditApplied: 0,
          discountApplied: null,
          fulfillmentStatus: "Unfulfilled",
          paymentStatus: "Paid",
          paymentMethod: "Worldpay Recurring Subscription",
          worldpayTxId: chargeResult?.id || transactionReference,
          // Always the gateway REFERENCE, never the payment id. Worldpay's
          // webhooks identify a payment by transactionReference, so this is the
          // field that lets an inbound event find this order. When Worldpay
          // returns a payment id, worldpayTxId holds that instead, and without
          // keeping the reference here the webhook matches nothing.
          gatewayTxId: transactionReference,
          worldpayAuthCode: chargeResult?.authCode || null,
          gatewayAuthCode: chargeResult?.authCode || null,
          cardBrand: "Worldpay Stored Card",
          deliveryMethod: sub.deliveryMethod || "Royal Mail Tracked 24/48",
          carrier: "Royal Mail",
          tags: ["Storefront", "Subscription Order", "Worldpay Recurring"],
          date: (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " at " + (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          subscriptionId: subId,
          isSubscription: true,
          // The order this plan was originally bought with. Renewals used to
          // carry only the subscription id, so an admin looking at a renewal had
          // no way back to the checkout it came from.
          parentOrderId: sub.sourceOrderId ? String(sub.sourceOrderId) : null,
          isRenewal: true,
          billingPeriodStart: periodStart.toISOString(),
          data: {
            subscriptionId: subId,
            parentOrderId: sub.sourceOrderId ? String(sub.sourceOrderId) : null,
            isRenewal: true,
            billingPeriodStart: periodStart.toISOString(),
            // The reference Worldpay booked this payment under: this order's id
            // under the SUB-ORD- prefix, so a gateway record maps straight onto
            // this order.
            transactionReference,
            schemeReference: chargeResult?.schemeReference || schemeReference,
            paymentMethod: "Worldpay Access MIT",
            recurringRenewal: true,
            shippingCost: shippingAmount,
            subtotal: itemSubtotal
          },
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        try {
          const { saveSingleOrder: saveSingleOrder2 } = await Promise.resolve().then(() => (init_orders(), orders_exports));
          await saveSingleOrder2(newOrderData);
        } catch (ordErr) {
          console.warn("[Subscription Worker] Order save fallback:", ordErr);
          const storedOrders = await fetchResource("orders") || [];
          storedOrders.unshift(newOrderData);
          await saveResource("orders", storedOrders);
        }
        const orderPersisted = await renewalOrderExists(newOrderId);
        if (!orderPersisted) {
          console.error(
            `[RENEWAL ORDER NOT PERSISTED] Sub ${subId} was charged ${currency} ${amount.toFixed(2)} under reference ${transactionReference}, but order ${newOrderId} is in neither store. The schedule is deliberately NOT advanced, so the next run retries this same reference rather than billing again. Payload: ${JSON.stringify(newOrderData).slice(0, 1500)}`
          );
          failed++;
          results.push({
            id: subId,
            status: "charged_order_missing",
            orderId: newOrderId,
            transactionReference,
            nextBillingDate: "unchanged (still due)"
          });
          continue;
        }
        try {
          const { getRoyalMailSettings: getRoyalMailSettings2, createRoyalMailShipment: createRoyalMailShipment2 } = await Promise.resolve().then(() => (init_royalMailService(), royalMailService_exports));
          const rmSettings = await getRoyalMailSettings2();
          const hasKey = Boolean(rmSettings.apiKey || process.env.ROYAL_MAIL_API_KEY || process.env.RM_API_KEY);
          if (rmSettings.enabled && rmSettings.autoCreateShipmentOnPayment && hasKey) {
            createRoyalMailShipment2(newOrderId, {
              serviceCode: rmSettings.defaultServiceCode,
              weightGrams: rmSettings.defaultWeightGrams || 350
            }).catch((err) => {
              console.warn(
                `[Subscription Worker] Background Royal Mail shipment note for #${newOrderId}:`,
                err?.message
              );
            });
          }
        } catch (_rmErr) {
        }
        const updateData = {
          lastPaymentStatus: "authorized",
          lastPaymentId: chargeResult?.id || transactionReference,
          lastPaymentAt: /* @__PURE__ */ new Date(),
          worldpayTransactionId: chargeResult?.id || sub.worldpayTransactionId,
          worldpayTokenHref: chargeResult?.tokenHref || tokenHref || null,
          worldpaySchemeReference: chargeResult?.schemeReference || schemeReference,
          nextBillingDate: claimedNextBilling,
          failedPaymentCount: 0
        };
        if (promotePendingAmount) {
          updateData.amount = amount;
          Object.assign(updateData, clearedPendingFields());
          console.log(
            `[Subscription Worker] Sub ${subId}: scheduled price \xA3${amount.toFixed(2)} is now in force.`
          );
        }
        await persistSubscriptionUpdate(subId, updateData);
        try {
          const customers = await fetchResource("customers") || [];
          const foundCust = customers.find(
            (c) => String(c.email).toLowerCase().trim() === customerEmail
          );
          if (foundCust) {
            foundCust.ordersCount = (foundCust.ordersCount || 0) + 1;
            foundCust.amountSpent = Number(((foundCust.amountSpent || 0) + amount).toFixed(2));
            foundCust.nextPayment = claimedNextBilling.toISOString().split("T")[0];
            foundCust.subStatus = "active";
            foundCust.subscriptionStatus = "Active Subscriber";
            await saveResource("customers", customers);
          }
        } catch (_e) {
        }
        succeeded++;
        results.push({
          id: subId,
          status: "succeeded",
          orderId: newOrderId,
          nextBillingDate: claimedNextBilling.toISOString(),
          transactionReference
        });
      } catch (chargeErr) {
        console.error(`[Subscription Worker] Charge FAILED for sub ${subId}:`, chargeErr.message);
        failed++;
        const newFailedCount = (sub.failedPaymentCount || 0) + 1;
        const isPastDue = newFailedCount >= MAX_CONSECUTIVE_FAILURES;
        const failUpdate = {
          lastPaymentStatus: "failed",
          lastPaymentError: String(chargeErr.message || chargeErr).slice(0, 500),
          failedPaymentCount: newFailedCount,
          status: isPastDue ? "past_due" : "active"
        };
        await persistSubscriptionUpdate(subId, failUpdate);
        results.push({
          id: subId,
          status: "failed",
          error: chargeErr.message,
          transactionReference,
          nextBillingDate: "unchanged (still due)",
          retryScheduled: isPastDue ? `none \u2014 ${newFailedCount} consecutive failures, subscription set to past_due` : "next worker run"
        });
      }
    }
    return {
      processed: subscriptions.length,
      succeeded,
      failed,
      details: results
    };
  } finally {
    isProcessing = false;
  }
}
function workerShouldRun() {
  const explicit = String(process.env.SUBSCRIPTION_WORKER ?? "").trim().toLowerCase();
  if (explicit === "1" || explicit === "true") {
    return { run: true, reason: "SUBSCRIPTION_WORKER is set" };
  }
  if (explicit === "0" || explicit === "false") {
    return { run: false, reason: "SUBSCRIPTION_WORKER is disabled" };
  }
  const serverless = Boolean(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTIONS_WORKER_RUNTIME
  );
  return serverless ? { run: false, reason: "serverless runtime \u2014 the scheduled cron ping is the trigger" } : { run: true, reason: "long-running server" };
}
function startSubscriptionRenewalWorker(intervalMs = 5 * 60 * 1e3) {
  if (cronIntervalHandle) {
    clearInterval(cronIntervalHandle);
  }
  const { run, reason } = workerShouldRun();
  if (!run) {
    console.log(
      `[Subscription Worker] In-process timer NOT started (${reason}). Renewals run when /api/subscriptions/cron is called.`
    );
    return;
  }
  console.log(`[Subscription Worker] Background worker initialized (interval: ${intervalMs / 1e3}s, ${reason}).`);
  setTimeout(() => {
    processDueSubscriptions().catch((err) => console.error("[Subscription Worker] Startup run error:", err));
  }, 3e3);
  cronIntervalHandle = setInterval(() => {
    processDueSubscriptions().catch((err) => console.error("[Subscription Worker] Periodic run error:", err));
  }, intervalMs);
}
var CHARGEABLE_STATUS, PRISMA_SUBSCRIPTION_FIELDS, MAX_CONSECUTIVE_FAILURES, RUN_TIME_BUDGET_MS, isProcessing, cronIntervalHandle;
var init_subscriptionCron = __esm({
  "backend/services/subscriptionCron.ts"() {
    init_prisma();
    init_serverDb();
    init_worldpaySubscription();
    init_subscriptionBox();
    init_subscriptionPricingService();
    CHARGEABLE_STATUS = "active";
    PRISMA_SUBSCRIPTION_FIELDS = /* @__PURE__ */ new Set([
      "customerId",
      "customerEmail",
      "customerName",
      "planId",
      "planName",
      "amount",
      "currency",
      "status",
      "billingInterval",
      "nextBillingDate",
      "worldpayTransactionId",
      "worldpayTokenHref",
      "worldpayRecurringHref",
      "worldpaySchemeReference",
      "lastPaymentStatus",
      "lastPaymentId",
      "lastPaymentAt",
      "failedPaymentCount",
      "lastPaymentError",
      "items",
      "cansCount",
      "itemPrice",
      "shippingCost",
      "shippingAddress",
      "deliveryMethod",
      "sourceOrderId",
      "cancelledAt",
      "cancellationReason"
    ]);
    MAX_CONSECUTIVE_FAILURES = 3;
    RUN_TIME_BUDGET_MS = 45 * 1e3;
    isProcessing = false;
    cronIntervalHandle = null;
  }
});

// serverApp.ts
init_serverDb();
import express from "express";
import path4 from "path";
import fs4 from "fs";

// backend/routes/crudHelper.ts
init_serverDb();
import { Router } from "express";

// backend/services/recycleBin.ts
init_serverDb();
init_prisma();
var RETENTION_DAYS = 30;
var RESOURCES = {
  orders: { label: "Orders", describe: (i) => `${i?.id ?? ""} \u2014 ${i?.customerName ?? i?.customerEmail ?? ""}` },
  products: { label: "Products", describe: (i) => i?.title ?? i?.name ?? i?.id ?? "" },
  collections: { label: "Collections", describe: (i) => i?.title ?? i?.name ?? i?.id ?? "" },
  customPages: { label: "Pages", describe: (i) => i?.title ?? i?.slug ?? i?.id ?? "" },
  blogs: { label: "Blog Posts", describe: (i) => i?.title ?? i?.id ?? "" },
  customers: { label: "Customers", describe: (i) => i?.email ?? i?.name ?? i?.id ?? "" },
  files: { label: "Files", describe: (i) => i?.fileName ?? i?.originalFilename ?? i?.url ?? i?.id ?? "" }
};
var RECYCLABLE_RESOURCES = Object.keys(RESOURCES);
function isRecyclable(resource) {
  return Object.prototype.hasOwnProperty.call(RESOURCES, normalizeResource(resource));
}
function normalizeResource(resource) {
  const r = String(resource || "").trim();
  const lower = r.toLowerCase();
  if (lower === "pages" || lower === "custompages") return "customPages";
  if (lower === "fileentries" || lower === "fileentry" || lower === "media") return "files";
  if (lower === "blog" || lower === "blogposts") return "blogs";
  return lower;
}
function resourceLabel(resource) {
  return RESOURCES[normalizeResource(resource)]?.label ?? resource;
}
function describe(resource, item) {
  try {
    return String(RESOURCES[normalizeResource(resource)]?.describe(item) ?? "").trim().slice(0, 200);
  } catch {
    return "";
  }
}
function idOf(item) {
  return String(item?.id ?? item?.slug ?? item?.orderId ?? "").trim();
}
function expiryFrom(deletedAt) {
  const d = new Date(deletedAt.getTime());
  d.setDate(d.getDate() + RETENTION_DAYS);
  return d;
}
async function findActive(resource, itemId) {
  const list = await fetchResource(normalizeResource(resource)) || [];
  const wanted = String(itemId).trim();
  if (!wanted) return null;
  return list.find(
    (i) => idOf(i) === wanted || String(i?.id ?? "") === wanted || String(i?.slug ?? "") === wanted
  ) || null;
}
async function moveToRecycleBin(resource, itemId, deletedBy) {
  const store = normalizeResource(resource);
  if (!isRecyclable(store)) {
    return { ok: false, message: `${resource} is not covered by the recycle bin.` };
  }
  const id = String(itemId || "").trim();
  if (!id) return { ok: false, message: "An item id is required." };
  const item = await findActive(store, id);
  if (!item) return { ok: false, message: "That item no longer exists." };
  const canonicalId = idOf(item) || id;
  const slug = String(item?.slug ?? "").trim();
  const deletedAt = /* @__PURE__ */ new Date();
  const label = describe(store, item);
  const entry = await prisma.recycleBinItem.upsert({
    where: { resource_itemId: { resource: store, itemId: canonicalId } },
    update: { payload: item, label, deletedAt, expiresAt: expiryFrom(deletedAt), deletedBy: deletedBy || null },
    create: {
      resource: store,
      itemId: canonicalId,
      label,
      payload: item,
      deletedAt,
      expiresAt: expiryFrom(deletedAt),
      deletedBy: deletedBy || null
    }
  });
  await deleteSingleItem(store, canonicalId);
  if (slug && slug !== canonicalId) await deleteSingleItem(store, slug);
  if (store === "files") {
    await prisma.fileEntry.deleteMany({ where: { id: canonicalId } }).catch(() => {
    });
  }
  console.log(`[Recycle Bin] ${store}/${canonicalId} moved to the bin${deletedBy ? ` by ${deletedBy}` : ""}.`);
  return { ok: true, entryId: entry.id, label };
}
function toBinEntry(row) {
  const expires = new Date(row.expiresAt).getTime();
  return {
    id: row.id,
    resource: row.resource,
    resourceLabel: resourceLabel(row.resource),
    itemId: row.itemId,
    label: row.label || row.itemId,
    deletedAt: new Date(row.deletedAt).toISOString(),
    expiresAt: new Date(row.expiresAt).toISOString(),
    daysLeft: Math.max(0, Math.ceil((expires - Date.now()) / (24 * 60 * 60 * 1e3))),
    deletedBy: row.deletedBy ?? null
  };
}
async function listRecycleBin(resource) {
  await purgeExpired();
  const where = resource && resource !== "all" ? { resource: normalizeResource(resource) } : {};
  const rows = await prisma.recycleBinItem.findMany({ where, orderBy: { deletedAt: "desc" } });
  return rows.map(toBinEntry);
}
async function restoreFromRecycleBin(entryIds) {
  const result = { restored: [], failed: [] };
  for (const entryId of entryIds) {
    const row = await prisma.recycleBinItem.findUnique({ where: { id: entryId } }).catch(() => null);
    if (!row) {
      result.failed.push({ id: entryId, reason: "No longer in the recycle bin" });
      continue;
    }
    try {
      await saveSingleItem(row.resource, row.payload);
      if (row.resource === "files") {
        const f = row.payload;
        await prisma.fileEntry.upsert({
          where: { id: row.itemId },
          update: {
            fileName: f?.fileName ?? "restored",
            url: f?.url ?? "",
            altText: f?.altText ?? null,
            mimeType: f?.mimeType ?? null,
            publicId: f?.publicId ?? null,
            resourceType: f?.resourceType ?? null
          },
          create: {
            id: row.itemId,
            fileName: f?.fileName ?? "restored",
            url: f?.url ?? "",
            altText: f?.altText ?? null,
            mimeType: f?.mimeType ?? null,
            publicId: f?.publicId ?? null,
            resourceType: f?.resourceType ?? null,
            dateAdded: f?.dateAdded ?? (/* @__PURE__ */ new Date()).toISOString(),
            size: f?.size ?? "",
            references: f?.references ?? ""
          }
        }).catch((e) => console.warn(`[Recycle Bin] FileEntry row not restored for ${row.itemId}: ${e?.message}`));
      }
      await prisma.recycleBinItem.delete({ where: { id: entryId } });
      result.restored.push(entryId);
      console.log(`[Recycle Bin] ${row.resource}/${row.itemId} restored.`);
    } catch (err) {
      result.failed.push({ id: entryId, reason: err?.message || "Could not restore" });
      console.error(`[Recycle Bin] Restore failed for ${row.resource}/${row.itemId}:`, err?.message);
    }
  }
  return result;
}
async function destroyFileAsset(row) {
  const publicId = row?.payload?.publicId;
  if (!publicId) return;
  try {
    const { deleteFromCloudinary: deleteFromCloudinary2 } = await Promise.resolve().then(() => (init_cloudinary(), cloudinary_exports));
    await deleteFromCloudinary2(publicId, row.payload?.resourceType || "image");
  } catch (err) {
    console.warn(`[Recycle Bin] Cloudinary asset ${publicId} not removed: ${err?.message}`);
  }
}
async function permanentlyDelete(entryIds) {
  if (!entryIds.length) return 0;
  const rows = await prisma.recycleBinItem.findMany({ where: { id: { in: entryIds } } });
  for (const row of rows.filter((r) => r.resource === "files")) await destroyFileAsset(row);
  const res = await prisma.recycleBinItem.deleteMany({ where: { id: { in: entryIds } } });
  console.log(`[Recycle Bin] ${res.count} entr(ies) permanently deleted.`);
  return res.count;
}
async function clearRecycleBin() {
  const rows = await prisma.recycleBinItem.findMany({ where: { resource: "files" } });
  for (const row of rows) await destroyFileAsset(row);
  const res = await prisma.recycleBinItem.deleteMany({});
  console.log(`[Recycle Bin] cleared \u2014 ${res.count} entr(ies) permanently deleted.`);
  return res.count;
}
async function purgeExpired(now = /* @__PURE__ */ new Date()) {
  try {
    const due = await prisma.recycleBinItem.findMany({ where: { expiresAt: { lte: now } } });
    if (due.length === 0) return 0;
    for (const row of due.filter((r) => r.resource === "files")) await destroyFileAsset(row);
    const res = await prisma.recycleBinItem.deleteMany({ where: { expiresAt: { lte: now } } });
    console.log(`[Recycle Bin] ${res.count} entr(ies) passed ${RETENTION_DAYS} days and were destroyed.`);
    return res.count;
  } catch (err) {
    console.error("[Recycle Bin] Expiry sweep failed:", err?.message);
    return 0;
  }
}
async function stripRecycled(resource, items) {
  const store = normalizeResource(resource);
  if (!isRecyclable(store) || !Array.isArray(items) || items.length === 0) {
    return { kept: items || [], removed: [] };
  }
  let binned;
  try {
    binned = await prisma.recycleBinItem.findMany({ where: { resource: store }, select: { itemId: true } });
  } catch {
    return { kept: items, removed: [] };
  }
  if (binned.length === 0) return { kept: items, removed: [] };
  const blocked = new Set(binned.map((b) => String(b.itemId)));
  const removed = [];
  const kept = items.filter((item) => {
    const id = String(item?.id ?? "");
    const slug = String(item?.slug ?? "");
    const hit = id && blocked.has(id) || slug && blocked.has(slug);
    if (hit) removed.push(id || slug);
    return !hit;
  });
  if (removed.length) {
    console.warn(
      `[Recycle Bin] Ignored ${removed.length} ${store} record(s) in a saved list that are in the recycle bin: ${removed.join(", ")}. Restore them from the bin to bring them back.`
    );
  }
  return { kept, removed };
}
async function recycleBinCounts() {
  const rows = await prisma.recycleBinItem.groupBy({ by: ["resource"], _count: { _all: true } }).catch(() => []);
  const byResource = {};
  let total = 0;
  for (const r of rows) {
    byResource[r.resource] = r._count._all;
    total += r._count._all;
  }
  return { total, byResource };
}

// backend/routes/crudHelper.ts
init_requireAdmin();
function createCrudRouter(resourceName, options = {}) {
  const router22 = Router();
  router22.get("/", async (req, res) => {
    try {
      const data = await fetchResource(resourceName);
      res.json(data);
    } catch (err) {
      console.error(`[${resourceName} Router] GET Error:`, err);
      res.status(500).json({ error: err.message || `Failed to fetch ${resourceName}` });
    }
  });
  router22.get("/:id", async (req, res) => {
    try {
      const item = await fetchSingleItem(resourceName, req.params.id);
      if (!item) {
        return res.status(404).json({ error: `Item with ID ${req.params.id} not found` });
      }
      res.json(item);
    } catch (err) {
      console.error(`[${resourceName} Router] GET /:id Error:`, err);
      res.status(500).json({ error: err.message || `Failed to fetch ${resourceName} item` });
    }
  });
  router22.post("/", requireAdmin, async (req, res) => {
    try {
      const payload = req.body;
      const database = await getDb();
      if (!database) {
        res.setHeader("X-Database-Offline", "true");
      } else {
        res.setHeader("X-Database-Offline", "false");
      }
      if (Array.isArray(payload)) {
        const { kept } = await stripRecycled(resourceName, payload);
        const before = options.onAfterReplace ? await fetchResource(resourceName) || [] : [];
        const updated = await saveResource(resourceName, kept);
        if (options.onAfterReplace) {
          try {
            await options.onAfterReplace(before, payload);
          } catch (hookErr) {
            console.error(`[${resourceName} Router] after-save hook failed:`, hookErr?.message || hookErr);
          }
        }
        return res.json(updated);
      } else if (payload && typeof payload === "object") {
        const updatedItem = await saveSingleItem(resourceName, payload);
        return res.json(updatedItem);
      } else {
        return res.status(400).json({ error: "Invalid payload for POST operation" });
      }
    } catch (err) {
      console.error(`[${resourceName} Router] POST Error:`, err);
      res.status(500).json({ error: err.message || `Failed to persist ${resourceName}` });
    }
  });
  router22.put("/:id", requireAdmin, async (req, res) => {
    try {
      const payload = req.body;
      if (!payload || typeof payload !== "object") {
        return res.status(400).json({ error: "Invalid item payload" });
      }
      const itemToSave = { ...payload, id: req.params.id };
      const database = await getDb();
      if (!database) {
        res.setHeader("X-Database-Offline", "true");
      } else {
        res.setHeader("X-Database-Offline", "false");
      }
      const updated = await saveSingleItem(resourceName, itemToSave);
      res.json(updated);
    } catch (err) {
      console.error(`[${resourceName} Router] PUT /:id Error:`, err);
      res.status(500).json({ error: err.message || `Failed to update ${resourceName} item` });
    }
  });
  router22.delete("/:id", requireAdmin, async (req, res) => {
    try {
      const database = await getDb();
      if (!database) {
        res.setHeader("X-Database-Offline", "true");
      } else {
        res.setHeader("X-Database-Offline", "false");
      }
      const success = await deleteSingleItem(resourceName, req.params.id);
      res.json({ success, id: req.params.id });
    } catch (err) {
      console.error(`[${resourceName} Router] DELETE /:id Error:`, err);
      res.status(500).json({ error: err.message || `Failed to delete ${resourceName} item` });
    }
  });
  return router22;
}

// backend/routes/products.ts
var router = createCrudRouter("products");
var products_default = router;

// backend/routes/collections.ts
var router2 = createCrudRouter("collections");
var collections_default = router2;

// serverApp.ts
init_orders();

// backend/routes/recycleBin.ts
init_requireAdmin();
import { Router as Router3 } from "express";
init_requireAdmin();
var router4 = Router3();
router4.get("/", requireAdmin, async (req, res) => {
  try {
    const resource = typeof req.query.resource === "string" ? req.query.resource : void 0;
    const items = await listRecycleBin(resource);
    const counts = await recycleBinCounts();
    res.json({ items, counts, retentionDays: RETENTION_DAYS, resources: RECYCLABLE_RESOURCES });
  } catch (err) {
    console.error("[Recycle Bin] GET Error:", err);
    res.status(500).json({ error: err?.message || "Could not load the recycle bin" });
  }
});
router4.post("/move", requireAdmin, async (req, res) => {
  try {
    const { resource, id } = req.body || {};
    if (!resource || !id) {
      return res.status(400).json({ error: "A resource and an id are required." });
    }
    if (!isRecyclable(String(resource))) {
      return res.status(400).json({
        error: `"${resource}" is not covered by the recycle bin.`,
        recyclable: RECYCLABLE_RESOURCES
      });
    }
    const result = await moveToRecycleBin(String(resource), String(id), req.admin?.email);
    if (!result.ok) return res.status(404).json({ error: result.message });
    res.json({ success: true, entryId: result.entryId, label: result.label, retentionDays: RETENTION_DAYS });
  } catch (err) {
    console.error("[Recycle Bin] move Error:", err);
    res.status(500).json({ error: err?.message || "Could not move that item to the recycle bin" });
  }
});
router4.post("/restore", requireAdmin, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    if (ids.length === 0) return res.status(400).json({ error: "Select at least one item to restore." });
    const result = await restoreFromRecycleBin(ids);
    res.json({
      success: result.failed.length === 0,
      restored: result.restored.length,
      failed: result.failed
    });
  } catch (err) {
    console.error("[Recycle Bin] restore Error:", err);
    res.status(500).json({ error: err?.message || "Could not restore those items" });
  }
});
router4.post("/delete", requireAdmin, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    if (ids.length === 0) return res.status(400).json({ error: "Select at least one item to delete." });
    const deleted = await permanentlyDelete(ids);
    res.json({ success: true, deleted });
  } catch (err) {
    console.error("[Recycle Bin] delete Error:", err);
    res.status(500).json({ error: err?.message || "Could not delete those items" });
  }
});
router4.post("/clear", requireAdmin, async (req, res) => {
  try {
    if (req.body?.confirm !== true) {
      return res.status(400).json({ error: "Clearing the recycle bin must be confirmed." });
    }
    const deleted = await clearRecycleBin();
    res.json({ success: true, deleted });
  } catch (err) {
    console.error("[Recycle Bin] clear Error:", err);
    res.status(500).json({ error: err?.message || "Could not clear the recycle bin" });
  }
});
var handlePurge = async (_req, res) => {
  try {
    const deleted = await purgeExpired();
    res.json({ success: true, deleted, retentionDays: RETENTION_DAYS });
  } catch (err) {
    console.error("[Recycle Bin] purge Error:", err);
    res.status(500).json({ error: err?.message || "Could not run the expiry sweep" });
  }
};
router4.get("/purge-expired", requireCronOrAdmin, handlePurge);
router4.post("/purge-expired", requireCronOrAdmin, handlePurge);
var recycleBin_default = router4;

// backend/routes/analytics.ts
init_requireAdmin();
import { Router as Router4 } from "express";

// backend/services/vercelAnalytics.ts
var API_BASE = "https://api.vercel.com/v1/query/web-analytics";
var DEFAULT_RANGE_DAYS = 30;
function readConfig() {
  const token = (process.env.VERCEL_API_TOKEN || process.env.VERCEL_TOKEN || "").trim();
  const projectId = (process.env.VERCEL_PROJECT_ID || process.env.VERCEL_ANALYTICS_PROJECT_ID || "").trim();
  const missing = [];
  if (!token) missing.push("VERCEL_API_TOKEN");
  if (!projectId) missing.push("VERCEL_PROJECT_ID");
  if (missing.length) return { ok: false, missing };
  return {
    ok: true,
    config: {
      token,
      projectId,
      teamId: (process.env.VERCEL_TEAM_ID || "").trim() || void 0,
      teamSlug: (process.env.VERCEL_TEAM_SLUG || "").trim() || void 0
    }
  };
}
function isoDay(d) {
  return d.toISOString().slice(0, 10);
}
var scopeCache = null;
function scopeParams(scope) {
  return scope ? { teamId: scope.teamId } : {};
}
async function canQuery(config, scope) {
  const today = isoDay(/* @__PURE__ */ new Date());
  const query = new URLSearchParams({
    projectId: config.projectId,
    since: today,
    until: today,
    by: "day",
    limit: "1",
    ...scopeParams(scope)
  });
  try {
    const res = await fetch(`${API_BASE}/visits/aggregate?${query.toString()}`, {
      headers: { Authorization: `Bearer ${config.token}`, Accept: "application/json" }
    });
    return res.ok;
  } catch {
    return false;
  }
}
async function listTeams(config) {
  try {
    const res = await fetch("https://api.vercel.com/v2/teams?limit=20", {
      headers: { Authorization: `Bearer ${config.token}`, Accept: "application/json" }
    });
    if (!res.ok) return [];
    const body = await res.json().catch(() => null);
    return Array.isArray(body?.teams) ? body.teams : [];
  } catch {
    return [];
  }
}
async function resolveScope(config) {
  const cacheKey = `${config.token.slice(-8)}:${config.projectId}`;
  if (scopeCache && scopeCache.key === cacheKey) return scopeCache.value;
  let resolved;
  if (config.teamId) {
    resolved = { scope: { teamId: config.teamId, label: config.teamId }, detectedFrom: "environment" };
  } else if (config.teamSlug) {
    const team = (await listTeams(config)).find((t) => t.slug === config.teamSlug);
    resolved = team ? { scope: { teamId: team.id, label: team.slug || team.id }, detectedFrom: "environment" } : { scope: null, detectedFrom: "personal-account" };
  } else if (await canQuery(config, null)) {
    resolved = { scope: null, detectedFrom: "personal-account" };
  } else {
    const teams = await listTeams(config);
    let found = null;
    for (const team of teams) {
      const candidate = { teamId: team.id, label: team.slug || team.name || team.id };
      if (await canQuery(config, candidate)) {
        found = candidate;
        break;
      }
    }
    resolved = { scope: found, detectedFrom: found ? "team-lookup" : "personal-account" };
    if (found) {
      console.log(
        `[Vercel Analytics] project ${config.projectId} resolved to team "${found.label}" (${found.teamId}). Set VERCEL_TEAM_ID to skip this lookup.`
      );
    }
  }
  scopeCache = { key: cacheKey, value: resolved };
  return resolved;
}
function clearScopeCache() {
  scopeCache = null;
}
async function aggregate(config, scope, params) {
  const query = new URLSearchParams({
    projectId: config.projectId,
    since: params.since,
    until: params.until,
    by: params.by,
    ...scopeParams(scope)
  });
  if (params.limit) query.set("limit", String(params.limit));
  const res = await fetch(`${API_BASE}/visits/aggregate?${query.toString()}`, {
    headers: { Authorization: `Bearer ${config.token}`, Accept: "application/json" }
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const reason = body?.error?.message || body?.message || `HTTP ${res.status}`;
    throw new Error(reason);
  }
  return Array.isArray(body?.data) ? body.data : [];
}
var num3 = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
var sum = (rows, key) => rows.reduce((total, row) => total + num3(row[key]), 0);
function toNamed(rows, dimension) {
  return rows.map((row) => ({
    name: String(row[dimension] ?? row.name ?? "Unknown") || "Unknown",
    pageviews: num3(row.pageviews),
    visitors: num3(row.visitors)
  }));
}
var CACHE_MS = 6e4;
var cache = null;
async function fetchWebAnalytics(rangeDays = DEFAULT_RANGE_DAYS) {
  const days = Math.max(1, Math.min(365, Math.floor(rangeDays) || DEFAULT_RANGE_DAYS));
  const cfg = readConfig();
  if (cfg.ok === false) return { configured: false, missing: cfg.missing };
  const cacheKey = `${days}:${cfg.config.projectId}`;
  if (cache && cache.key === cacheKey && Date.now() - cache.at < CACHE_MS) return cache.value;
  const { scope, detectedFrom } = await resolveScope(cfg.config);
  const until = /* @__PURE__ */ new Date();
  const since = new Date(until.getTime() - (days - 1) * 24 * 60 * 60 * 1e3);
  const range = { since: isoDay(since), until: isoDay(until) };
  const partial = [];
  const ask = async (by, limit) => {
    try {
      return await aggregate(cfg.config, scope, { ...range, by, limit });
    } catch (err) {
      console.warn(`[Vercel Analytics] "${by}" unavailable: ${err?.message}`);
      partial.push(by);
      return [];
    }
  };
  let daily;
  try {
    daily = await aggregate(cfg.config, scope, { ...range, by: "day" });
  } catch (err) {
    console.error("[Vercel Analytics] request failed:", err?.message);
    const value2 = { configured: true, error: err?.message || "Vercel did not answer." };
    cache = { key: cacheKey, at: Date.now(), value: value2 };
    return value2;
  }
  const [routes, countries, referrers, devices] = await Promise.all([
    ask("route", 8),
    ask("country", 6),
    ask("referrerHostname", 6),
    ask("deviceType", 5)
  ]);
  const value = {
    configured: true,
    since: range.since,
    until: range.until,
    rangeDays: days,
    totals: { pageviews: sum(daily, "pageviews"), visitors: sum(daily, "visitors") },
    daily: daily.map((row) => ({
      date: String(row.timestamp ?? row.day ?? "").slice(0, 10),
      pageviews: num3(row.pageviews),
      visitors: num3(row.visitors)
    })),
    topRoutes: toNamed(routes, "route"),
    topCountries: toNamed(countries, "country"),
    topReferrers: toNamed(referrers, "referrerHostname"),
    devices: toNamed(devices, "deviceType"),
    partial,
    account: { team: scope ? scope.label : null, detectedFrom },
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  cache = { key: cacheKey, at: Date.now(), value };
  return value;
}
function clearCache() {
  cache = null;
  clearScopeCache();
}

// backend/routes/analytics.ts
var router5 = Router4();
router5.get("/traffic", requireAdmin, async (req, res) => {
  try {
    const days = Number(req.query.days) || DEFAULT_RANGE_DAYS;
    if (req.query.refresh === "1" || req.query.refresh === "true") clearCache();
    const data = await fetchWebAnalytics(days);
    res.json(data);
  } catch (err) {
    console.error("[Analytics Router] traffic Error:", err);
    res.status(500).json({ configured: true, error: err?.message || "Could not read Vercel Analytics" });
  }
});
var analytics_default = router5;

// backend/routes/siteStatus.ts
init_requireAdmin();
import { Router as Router5 } from "express";

// backend/services/siteStatus.ts
init_serverDb();
import crypto3 from "crypto";
var SETTING_ID = "site_status";
var DEFAULTS = {
  mode: "live",
  headline: "We'll be back shortly",
  message: "Our store is getting a little work done. Please check back soon.",
  passwordHash: null,
  salt: null,
  updatedAt: null,
  updatedBy: null
};
function hash(password, salt) {
  return crypto3.createHash("sha256").update(`${salt}:${password}`).digest("hex");
}
async function getSiteStatus() {
  try {
    const stored = await fetchStoreSetting(SETTING_ID, null);
    if (!stored || typeof stored !== "object") return { ...DEFAULTS };
    return { ...DEFAULTS, ...stored, mode: stored.mode === "password" ? "password" : "live" };
  } catch (err) {
    console.error("[Site Status] Could not read the setting; treating the site as live:", err?.message);
    return { ...DEFAULTS };
  }
}
async function getPublicSiteStatus() {
  const status = await getSiteStatus();
  return { mode: status.mode, headline: status.headline, message: status.message };
}
async function saveSiteStatus(input) {
  const current = await getSiteStatus();
  const next = { ...current };
  if (input.mode === "live" || input.mode === "password") next.mode = input.mode;
  if (typeof input.headline === "string" && input.headline.trim()) next.headline = input.headline.trim().slice(0, 120);
  if (typeof input.message === "string") next.message = input.message.trim().slice(0, 500);
  const password = typeof input.password === "string" ? input.password.trim() : "";
  if (password) {
    if (password.length < 4) return { ok: false, message: "Use a password of at least 4 characters." };
    next.salt = crypto3.randomBytes(16).toString("hex");
    next.passwordHash = hash(password, next.salt);
  }
  if (next.mode === "password" && !next.passwordHash) {
    return {
      ok: false,
      message: "Set a password before switching the site to password protected, or nobody could get in."
    };
  }
  next.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  next.updatedBy = input.updatedBy || null;
  await saveStoreSetting(SETTING_ID, next);
  console.log(`[Site Status] set to "${next.mode}"${input.updatedBy ? ` by ${input.updatedBy}` : ""}.`);
  return {
    ok: true,
    status: { mode: next.mode, headline: next.headline, message: next.message, hasPassword: Boolean(next.passwordHash) }
  };
}
async function checkPassword(password) {
  const status = await getSiteStatus();
  if (!status.passwordHash || !status.salt) return false;
  const given = Buffer.from(hash(String(password || ""), status.salt));
  const known = Buffer.from(status.passwordHash);
  return given.length === known.length && crypto3.timingSafeEqual(given, known);
}
async function issuePass() {
  const status = await getSiteStatus();
  const issuedAt = Date.now();
  const signature = crypto3.createHmac("sha256", String(status.passwordHash || "no-password")).update(String(issuedAt)).digest("hex");
  return `${issuedAt}.${signature}`;
}
async function verifyPass(pass) {
  const [issuedAt, signature] = String(pass || "").split(".");
  if (!issuedAt || !signature) return false;
  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age < 0 || age > 30 * 24 * 60 * 60 * 1e3) return false;
  const status = await getSiteStatus();
  const expected = crypto3.createHmac("sha256", String(status.passwordHash || "no-password")).update(String(issuedAt)).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto3.timingSafeEqual(a, b);
}

// backend/routes/siteStatus.ts
var router6 = Router5();
router6.get("/", async (_req, res) => {
  try {
    res.json(await getPublicSiteStatus());
  } catch (err) {
    console.error("[Site Status] GET Error:", err);
    res.json({ mode: "live", headline: "", message: "" });
  }
});
router6.post("/unlock", async (req, res) => {
  try {
    const password = String(req.body?.password ?? "");
    if (!password) return res.status(400).json({ ok: false, message: "Enter the password." });
    if (!await checkPassword(password)) {
      return res.status(401).json({ ok: false, message: "That password is not right." });
    }
    res.json({ ok: true, pass: await issuePass() });
  } catch (err) {
    console.error("[Site Status] unlock Error:", err);
    res.status(500).json({ ok: false, message: "Could not check that right now." });
  }
});
router6.post("/verify", async (req, res) => {
  try {
    res.json({ ok: await verifyPass(String(req.body?.pass ?? "")) });
  } catch {
    res.json({ ok: false });
  }
});
router6.get("/admin", requireAdmin, async (_req, res) => {
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
  } catch (err) {
    console.error("[Site Status] GET /admin Error:", err);
    res.status(500).json({ error: err?.message || "Could not read the site status" });
  }
});
router6.post("/admin", requireAdmin, async (req, res) => {
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
  } catch (err) {
    console.error("[Site Status] POST /admin Error:", err);
    res.status(500).json({ error: err?.message || "Could not save the site status" });
  }
});
var siteStatus_default = router6;

// backend/routes/files.ts
init_prisma();
init_cloudinary();
import { Router as Router7 } from "express";

// backend/routes/media.ts
init_prisma();
init_serverDb();
init_cloudinary();
import { Router as Router6 } from "express";
import multer from "multer";
import fs2 from "fs";
import path2 from "path";
var router7 = Router6();
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }
  // 100MB
});
async function checkMediaReferences(fileUrl) {
  const references = [];
  if (!fileUrl) return references;
  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { image: { equals: fileUrl } },
          { media: { has: fileUrl } }
        ]
      },
      select: { title: true }
    });
    products.forEach((p) => references.push(`Product: ${p.title}`));
    const collections = await prisma.collection.findMany({
      where: {
        OR: [
          { image: { equals: fileUrl } },
          { ogImage: { equals: fileUrl } }
        ]
      },
      select: { title: true }
    });
    collections.forEach((c) => references.push(`Collection: ${c.title}`));
    const pages = await prisma.customPage.findMany({
      select: { title: true, sections: true }
    });
    pages.forEach((p) => {
      const secStr = JSON.stringify(p.sections || "");
      if (secStr.includes(fileUrl)) {
        references.push(`Page: ${p.title}`);
      }
    });
    const blogs = await prisma.blogPost.findMany({
      where: { image: { equals: fileUrl } },
      select: { title: true }
    });
    blogs.forEach((b) => references.push(`Blog: ${b.title}`));
    const layout = await prisma.layoutSetting.findFirst({
      where: { id: "layout_settings" }
    });
    if (layout) {
      if (layout.headerLogoImage === fileUrl || layout.footerLogoImage === fileUrl) {
        references.push(`Header/Footer Settings`);
      }
      const menuStr = JSON.stringify(layout.menuItems || "");
      if (menuStr.includes(fileUrl)) {
        references.push(`Navigation Settings`);
      }
    }
  } catch (err) {
    console.error("[ReferenceCheck] Error checking references:", err);
  }
  return references;
}
router7.get("/", async (req, res) => {
  try {
    const files = await prisma.fileEntry.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.json(files);
  } catch (err) {
    console.warn("[Media API] GET error, falling back to StoreResource:", err?.message || err);
    try {
      const fallbackFiles = await fetchResource("files");
      res.json(fallbackFiles);
    } catch (fErr) {
      res.status(500).json({ error: fErr.message || "Failed to list media files" });
    }
  }
});
router7.post("/check-references", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    const references = await checkMediaReferences(url);
    res.json({ inUse: references.length > 0, references });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error checking media references" });
  }
});
router7.post("/upload", upload.single("file"), async (req, res) => {
  try {
    let fileBuffer = null;
    let fileName = "Uploaded Asset";
    let mimeType = "image/png";
    let folder = req.body.folder || "storefront_media";
    if (req.file) {
      fileBuffer = req.file.buffer;
      fileName = req.file.originalname || "Uploaded Asset";
      mimeType = req.file.mimetype || "image/png";
    } else if (req.body.data) {
      const dataStr = req.body.data;
      fileName = req.body.filename || req.body.fileName || "Uploaded Asset";
      if (dataStr.startsWith("data:")) {
        const matches = dataStr.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          fileBuffer = Buffer.from(matches[2], "base64");
        }
      } else {
        fileBuffer = Buffer.from(dataStr.replace(/^data:[^;]+;base64,/, ""), "base64");
      }
    }
    if (!fileBuffer) {
      return res.status(400).json({ error: "No file data or buffer was provided" });
    }
    const passedCloudName = req.body?.cloudName || req.body?.cloudinaryCloudName || req.body?.CLOUDINARY_CLOUD_NAME;
    const passedApiKey = req.body?.apiKey || req.body?.cloudinaryApiKey || req.body?.CLOUDINARY_API_KEY;
    const passedApiSecret = req.body?.apiSecret || req.body?.cloudinaryApiSecret || req.body?.CLOUDINARY_API_SECRET;
    if (passedCloudName) process.env.CLOUDINARY_CLOUD_NAME = String(passedCloudName).trim();
    if (passedApiKey) process.env.CLOUDINARY_API_KEY = String(passedApiKey).trim();
    if (passedApiSecret) process.env.CLOUDINARY_API_SECRET = String(passedApiSecret).trim();
    if (!isCloudinaryConfigured()) {
      try {
        await fetchLayoutSettings();
      } catch (e) {
      }
    }
    const isVideo = mimeType.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogg|avi|mkv)$/i.test(fileName);
    const resourceType = isVideo ? "video" : "auto";
    if (isCloudinaryConfigured()) {
      try {
        const uploadResult = await uploadToCloudinary(fileBuffer, {
          folder,
          originalFilename: fileName,
          resourceType
        });
        const fileId2 = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const displaySize = uploadResult.fileSize > 1024 * 1024 ? `${(uploadResult.fileSize / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(uploadResult.fileSize / 1024)} KB`;
        let savedEntry = null;
        const entryResourceType = uploadResult.resourceType || (isVideo ? "video" : "image");
        const entryMimeType = mimeType || (isVideo ? "video/mp4" : "image/png");
        try {
          savedEntry = await prisma.fileEntry.create({
            data: {
              id: fileId2,
              publicId: uploadResult.publicId,
              url: uploadResult.secureUrl || uploadResult.url,
              secureUrl: uploadResult.secureUrl,
              resourceType: entryResourceType,
              format: uploadResult.format,
              width: uploadResult.width || null,
              height: uploadResult.height || null,
              fileSize: displaySize,
              size: displaySize,
              folder: uploadResult.folder,
              originalFilename: fileName,
              fileName,
              altText: fileName.split(".")[0] || "Uploaded Media Asset",
              dateAdded: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
              references: "Direct Upload",
              mimeType: entryMimeType
            }
          });
        } catch (dbErr) {
          savedEntry = {
            id: fileId2,
            publicId: uploadResult.publicId,
            url: uploadResult.secureUrl || uploadResult.url,
            secureUrl: uploadResult.secureUrl,
            fileName,
            altText: fileName.split(".")[0] || "Uploaded Media Asset",
            dateAdded: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            mimeType: entryMimeType,
            resourceType: entryResourceType,
            size: displaySize,
            fileSize: displaySize,
            references: "Direct Upload"
          };
        }
        try {
          const currentFiles = await fetchResource("files");
          const currentArr = Array.isArray(currentFiles) ? currentFiles : [];
          const updatedFiles = [savedEntry, ...currentArr.filter((f) => f && f.url !== savedEntry.url)];
          await saveResource("files", updatedFiles);
        } catch (sErr) {
          console.warn("[Media API] Fallback store sync error:", sErr);
        }
        return res.json({
          success: true,
          file: savedEntry,
          url: savedEntry.url,
          publicId: savedEntry.publicId,
          id: savedEntry.id
        });
      } catch (cErr) {
        console.warn("[Media API] Cloudinary upload failed, falling back to local disk:", cErr?.message || cErr);
      }
    }
    const fileId = `file-${Date.now()}-${Math.floor(Math.random() * 1e5)}`;
    const base64Str = fileBuffer.toString("base64");
    let ext = "png";
    if (fileName && fileName.includes(".")) {
      ext = fileName.split(".").pop()?.toLowerCase() || "png";
    } else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
      ext = "jpg";
    } else if (mimeType.includes("mp4")) {
      ext = "mp4";
    }
    const filenameOnDisk = `${fileId}.${ext}`;
    const uploadsDir = path2.join(process.cwd(), "uploads");
    if (!fs2.existsSync(uploadsDir)) {
      try {
        fs2.mkdirSync(uploadsDir, { recursive: true });
      } catch (mErr) {
      }
    }
    const diskPath = path2.join(uploadsDir, filenameOnDisk);
    try {
      fs2.writeFileSync(diskPath, fileBuffer);
    } catch (fsErr) {
    }
    await saveUploadedImage(fileId, base64Str, mimeType);
    const fileUrl = `/api/uploads/${filenameOnDisk}`;
    const calculatedSize = fileBuffer.length > 1024 * 1024 ? `${(fileBuffer.length / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(fileBuffer.length / 1024)} KB`;
    let fileRecord = {
      id: fileId,
      fileName,
      url: fileUrl,
      altText: fileName.split(".")[0] || "Uploaded Media Asset",
      mimeType: mimeType || (isVideo ? "video/mp4" : "image/png"),
      resourceType: isVideo ? "video" : "image",
      size: calculatedSize,
      fileSize: calculatedSize,
      references: "Direct Upload",
      dateAdded: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    };
    try {
      fileRecord = await prisma.fileEntry.create({
        data: fileRecord
      });
    } catch (fErr) {
    }
    try {
      const currentFiles = await fetchResource("files");
      const currentArr = Array.isArray(currentFiles) ? currentFiles : [];
      const updatedFiles = [fileRecord, ...currentArr.filter((f) => f && f.url !== fileRecord.url)];
      await saveResource("files", updatedFiles);
    } catch (sErr) {
    }
    res.json({
      success: true,
      file: fileRecord,
      url: fileUrl,
      id: fileId,
      fileName,
      mimeType: fileRecord.mimeType
    });
  } catch (err) {
    console.error("[Media API] Upload error:", err);
    res.status(500).json({ error: err.message || "Failed to upload media asset" });
  }
});
router7.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { fileName, altText, folder } = req.body;
    const existing = await prisma.fileEntry.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Media file not found" });
    }
    const updated = await prisma.fileEntry.update({
      where: { id },
      data: {
        fileName: fileName ?? existing.fileName,
        altText: altText ?? existing.altText,
        folder: folder ?? existing.folder
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update media file metadata" });
  }
});
router7.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const force = req.query.force === "true";
    const existing = await prisma.fileEntry.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Media file not found" });
    }
    if (!force) {
      const refs = await checkMediaReferences(existing.url);
      if (refs.length > 0) {
        return res.status(409).json({
          error: "File is currently referenced in your store.",
          references: refs,
          canForce: true
        });
      }
    }
    if (existing.publicId) {
      const resType = existing.resourceType || "image";
      await deleteFromCloudinary(existing.publicId, resType);
    }
    await prisma.fileEntry.delete({ where: { id } });
    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error("[Media API] Delete error:", err);
    res.status(500).json({ error: err.message || "Failed to delete media asset" });
  }
});
var media_default = router7;

// backend/routes/files.ts
init_serverDb();
init_requireAdmin();
var router8 = Router7();
router8.get("/", async (_req, res) => {
  try {
    const data = await fetchResource("files");
    return res.json(data);
  } catch (err) {
    console.error("[Files Router] GET Error:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch files" });
  }
});
router8.post("/", requireAdmin, async (req, res) => {
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
  } catch (err) {
    console.error("[Files Router] POST Error:", err);
    return res.status(500).json({ error: err.message || "Failed to persist files" });
  }
});
router8.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const force = req.query.force === "true";
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
              error: "File is currently referenced in your store.",
              references: refs,
              canForce: true
            });
          }
        }
        if (existing.publicId) {
          await deleteFromCloudinary(existing.publicId, existing.resourceType || "image");
        }
        await prisma.fileEntry.delete({ where: { id: existing.id } });
      }
      const updated = await prisma.fileEntry.findMany({
        orderBy: { createdAt: "desc" }
      });
      return res.json(updated);
    } catch (prismaErr) {
      console.warn("[Files Router] Prisma DELETE failed, falling back to StoreResource:", prismaErr?.message || prismaErr);
      const files = await fetchResource("files");
      const filtered = files.filter((f) => f.id !== id && f.url !== id && f.publicId !== id);
      const updated = await saveResource("files", filtered);
      return res.json(updated);
    }
  } catch (err) {
    console.error("[Files Router] DELETE Error:", err);
    return res.status(500).json({ error: err.message || "Failed to delete file" });
  }
});
var files_default = router8;

// backend/routes/customers.ts
init_serverDb();
init_prisma();
init_emailService();
init_klaviyoService();
import { Router as Router8 } from "express";
import crypto4 from "crypto";

// backend/services/recaptchaService.ts
init_serverDb();
import fetch2 from "node-fetch";
var DEFAULT_RECAPTCHA_SETTINGS = {
  enabled: Boolean(process.env.RECAPTCHA_SECRET_KEY),
  siteKey: process.env.VITE_RECAPTCHA_SITE_KEY || process.env.RECAPTCHA_SITE_KEY || "",
  secretKey: process.env.RECAPTCHA_SECRET_KEY || "",
  minScore: 0.5
};
async function getRecaptchaSettings() {
  try {
    const list = await fetchResource("recaptcha_settings");
    if (Array.isArray(list) && list.length > 0 && list[0]) {
      return {
        ...DEFAULT_RECAPTCHA_SETTINGS,
        ...list[0],
        siteKey: list[0].siteKey || DEFAULT_RECAPTCHA_SETTINGS.siteKey,
        secretKey: list[0].secretKey || DEFAULT_RECAPTCHA_SETTINGS.secretKey
      };
    }
  } catch (err) {
    console.warn("[RecaptchaService] Error reading settings from DB, using defaults:", err);
  }
  return DEFAULT_RECAPTCHA_SETTINGS;
}
async function saveRecaptchaSettings(settings) {
  const current = await getRecaptchaSettings();
  const updated = {
    ...current,
    ...settings,
    minScore: typeof settings.minScore === "number" ? settings.minScore : current.minScore
  };
  await saveSingleItem("recaptcha_settings", updated);
  return updated;
}
async function verifyRecaptchaToken(token, expectedAction) {
  const settings = await getRecaptchaSettings();
  if (!settings.enabled) {
    console.log("[RecaptchaService] reCAPTCHA is disabled in settings, skipping score check.");
    return { success: true, score: 1, action: expectedAction };
  }
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return {
      success: false,
      score: 0,
      error: "reCAPTCHA verification token missing. Please complete the reCAPTCHA security check."
    };
  }
  const secretKey = settings.secretKey || process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey || secretKey.trim().length === 0) {
    console.error(
      "[RecaptchaService] reCAPTCHA is ENABLED but no secret key is configured. Set RECAPTCHA_SECRET_KEY, or add the secret key in the admin reCAPTCHA settings, or turn reCAPTCHA off. Refusing to verify."
    );
    return {
      success: false,
      score: 0,
      error: "reCAPTCHA is enabled but not configured on the server. Please contact support."
    };
  }
  try {
    const params = new URLSearchParams();
    params.append("secret", secretKey.trim());
    params.append("response", token.trim());
    const response = await fetch2("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });
    const data = await response.json();
    console.log("[RecaptchaService] Google siteverify response:", data);
    if (!data.success) {
      const errorCodes = Array.isArray(data["error-codes"]) ? data["error-codes"].join(", ") : "Verification failed";
      return {
        success: false,
        score: 0,
        error: `reCAPTCHA validation failed: ${errorCodes}`
      };
    }
    const score = typeof data.score === "number" ? data.score : 1;
    const action = data.action;
    if (score < settings.minScore) {
      return {
        success: false,
        score,
        action,
        error: `Security score (${score.toFixed(2)}) is lower than required confidence threshold (${settings.minScore}). Automated submission detected.`
      };
    }
    if (expectedAction && action && action !== expectedAction) {
      console.warn(`[RecaptchaService] Action mismatch: expected '${expectedAction}', got '${action}'`);
    }
    return {
      success: true,
      score,
      action
    };
  } catch (err) {
    console.error("[RecaptchaService] Error verifying reCAPTCHA token:", err);
    return {
      success: true,
      score: 0.8,
      error: "Warning: Failed to reach Google reCAPTCHA server, fallback approval granted."
    };
  }
}

// backend/routes/customers.ts
init_adminAuth();
init_requireAdmin();
var router9 = Router8();
function hashPassword(password) {
  return crypto4.createHash("sha256").update(password + "pouch_supply_salt_123!").digest("hex");
}
async function enrichCustomerAgeStatus(customer) {
  if (!customer || !customer.email) return customer;
  const emailTrim = customer.email.trim().toLowerCase();
  try {
    const ageResource = await prisma.storeResource.findUnique({
      where: {
        resource_itemId: {
          resource: "age_verification",
          itemId: emailTrim
        }
      }
    });
    if (ageResource && ageResource.data) {
      const data = ageResource.data;
      if (data.approved === true || data.verified === true) {
        return {
          ...customer,
          ageVerified: true,
          ageChecked: true,
          ageCheckId: data.agecheckid || customer.ageCheckId,
          ageVerifiedAt: data.verifiedAt || customer.ageVerifiedAt
        };
      }
    }
  } catch (_e) {
  }
  return customer;
}
router9.get("/", requireAdmin, async (req, res) => {
  try {
    const data = await fetchResource("customers");
    const sanitized = data.map(({ passwordHash, ...rest }) => rest);
    res.json(sanitized);
  } catch (err) {
    console.error("[Customers Router] GET Error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch customers" });
  }
});
router9.get("/by-email", requireCustomer, async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ error: "Email query parameter is required." });
    }
    if (!mayActOnCustomer(req, email)) {
      return res.status(404).json({ error: "Customer not found." });
    }
    const customersList = await fetchResource("customers");
    const found = customersList.find((c) => c.email.toLowerCase() === email);
    if (!found) {
      return res.status(404).json({ error: "Customer not found." });
    }
    const { passwordHash, ...safeCustomer } = found;
    const enriched = await enrichCustomerAgeStatus(safeCustomer);
    res.json({ customer: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch customer" });
  }
});
router9.post("/", requireAdmin, async (req, res) => {
  try {
    const payload = req.body;
    if (!Array.isArray(payload)) {
      return res.status(400).json({ error: "Customers API expects an array of documents" });
    }
    const database = await getDb();
    if (!database) {
      res.setHeader("X-Database-Offline", "true");
    } else {
      res.setHeader("X-Database-Offline", "false");
    }
    const updated = await saveResource("customers", payload);
    res.json(updated);
  } catch (err) {
    console.error("[Customers Router] POST Error:", err);
    res.status(500).json({ error: err.message || "Failed to persist customers" });
  }
});
router9.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone, location = "United Kingdom", referredByCode = null, recaptchaToken, token } = req.body;
    const captchaCheck = await verifyRecaptchaToken(recaptchaToken || token, "customer_signup");
    if (!captchaCheck.success) {
      return res.status(403).json({ error: captchaCheck.error || "reCAPTCHA verification failed. Please try again." });
    }
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: "Name, email, mobile phone number, and password are required for registration." });
    }
    const emailTrim = email.trim().toLowerCase();
    const customersList = await fetchResource("customers");
    const existing = customersList.find((c) => c.email.toLowerCase() === emailTrim);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    const codeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const cleanFirstName = name.trim().split(" ")[0].replace(/[^a-zA-Z]/g, "").toUpperCase() || "USER";
    const referralCode = `REF-PS-${cleanFirstName}-${codeSuffix}`;
    let validReferredByCode = null;
    if (referredByCode) {
      const trimmedCode = referredByCode.trim().toUpperCase();
      const referrer = customersList.find((c) => c.referralCode && c.referralCode.toUpperCase() === trimmedCode);
      if (referrer) {
        validReferredByCode = referrer.referralCode;
      }
    }
    const newCustomer = {
      id: `cust-${Date.now()}`,
      name: name.trim(),
      email: emailTrim,
      phone: phone.trim(),
      subscriptionStatus: "Not subscribed",
      location: location.trim(),
      ordersCount: 0,
      amountSpent: 0,
      addresses: [],
      // Start with empty addresses array, no mock placeholder
      wishlist: [],
      referralCode,
      storeCredit: 0,
      referredByCode: validReferredByCode,
      passwordHash: hashPassword(password)
    };
    const updatedList = [...customersList, newCustomer];
    await saveResource("customers", updatedList);
    if (validReferredByCode) {
      try {
        const discountCode = `REF10-${codeSuffix}`;
        const discountsList = await fetchResource("discounts") || [];
        const newDiscount = {
          id: `disc-ref-${newCustomer.id}`,
          title: discountCode,
          status: "Active",
          method: "Code",
          eligibility: "All customers",
          type: "Amount off order",
          used: 0,
          details: `10% discount welcome coupon for referred customer`,
          valueType: "Percentage",
          valueAmount: 10,
          limitOnePerCustomer: true
        };
        await saveResource("discounts", [...discountsList, newDiscount]);
        console.log(`[Referral System] Generated 10% discount coupon ${discountCode} for referred customer: ${emailTrim}`);
      } catch (err) {
        console.error("Failed to generate referral discount:", err);
      }
    }
    console.log(`[Customer Auth] New registration successful for: ${emailTrim}`);
    sendWelcomeEmail(emailTrim, name.trim(), validReferredByCode ? `REF10-${codeSuffix}` : "WELCOME10").catch((e) => console.warn("Welcome email fail:", e));
    trackCustomerSignup({ email: emailTrim, name: name.trim() }).catch((e) => console.warn("Klaviyo signup track fail:", e));
    const { passwordHash, ...safeCustomer } = newCustomer;
    res.status(201).json({
      message: "Registration successful!",
      customer: safeCustomer,
      // Signs the new account in. Without a token the client would hold a
      // customer object it cannot prove belongs to it.
      token: signCustomerToken(emailTrim)
    });
  } catch (err) {
    console.error("[Customer Auth] Signup Error:", err);
    res.status(500).json({ error: err.message || "Failed to complete customer registration" });
  }
});
router9.post("/forgot-password", async (req, res) => {
  try {
    const { email, recaptchaToken, token } = req.body;
    const captchaCheck = await verifyRecaptchaToken(recaptchaToken || token, "customer_forgot_password");
    if (!captchaCheck.success) {
      return res.status(403).json({ error: captchaCheck.error || "reCAPTCHA verification failed. Please try again." });
    }
    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }
    const emailTrim = email.trim().toLowerCase();
    const customersList = await fetchResource("customers");
    const found = customersList.find((c) => c.email.toLowerCase() === emailTrim);
    const resetCode = Math.floor(1e5 + Math.random() * 9e5).toString();
    const resetToken = crypto4.randomBytes(24).toString("hex");
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const resetLink = `${appUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(emailTrim)}`;
    if (found) {
      found.resetCode = resetCode;
      found.resetToken = resetToken;
      found.resetTokenExpires = Date.now() + 36e5;
      const updatedList = customersList.map((c) => c.id === found.id ? found : c);
      await saveResource("customers", updatedList);
      await sendPasswordResetEmail(emailTrim, found.name, resetCode, resetLink);
    } else {
      await sendPasswordResetEmail(emailTrim, "Valued Customer", resetCode, resetLink);
    }
    res.json({
      success: true,
      message: "Password reset code dispatched to your email address."
    });
  } catch (err) {
    console.error("[Customer Auth] Forgot Password Error:", err);
    res.status(500).json({ error: err.message || "Failed to process password reset request" });
  }
});
router9.post("/reset-password", async (req, res) => {
  try {
    const { token, code, email, newPassword, recaptchaToken } = req.body;
    const suppliedCodeOrToken = (code || token || "").toString().trim();
    const captchaCheck = await verifyRecaptchaToken(recaptchaToken, "customer_reset_password");
    if (!captchaCheck.success) {
      return res.status(403).json({ error: captchaCheck.error || "reCAPTCHA verification failed. Please try again." });
    }
    if (!email || !newPassword || !suppliedCodeOrToken) {
      return res.status(400).json({ error: "Email, new password, and reset code or token are required." });
    }
    const emailTrim = email.trim().toLowerCase();
    const customersList = await fetchResource("customers");
    const found = customersList.find((c) => c.email.toLowerCase() === emailTrim);
    if (!found) {
      return res.status(404).json({ error: "Customer account not found." });
    }
    const matchesToken = found.resetToken && found.resetToken === suppliedCodeOrToken;
    const matchesCode = found.resetCode && found.resetCode === suppliedCodeOrToken;
    if (!matchesToken && !matchesCode) {
      return res.status(400).json({ error: "Invalid password reset code or token. Please check your email." });
    }
    if (found.resetTokenExpires && found.resetTokenExpires < Date.now()) {
      return res.status(400).json({ error: "Password reset code has expired. Please request a new code." });
    }
    found.passwordHash = hashPassword(newPassword);
    delete found.resetCode;
    delete found.resetToken;
    delete found.resetTokenExpires;
    const updatedList = customersList.map((c) => c.id === found.id ? found : c);
    await saveResource("customers", updatedList);
    console.log(`[Customer Auth] Password successfully reset for: ${emailTrim}`);
    const { passwordHash, ...safeCustomer } = found;
    res.json({
      success: true,
      message: "Password successfully updated. You can now log in.",
      customer: safeCustomer
    });
  } catch (err) {
    console.error("[Customer Auth] Reset Password Error:", err);
    res.status(500).json({ error: err.message || "Failed to reset password" });
  }
});
router9.post("/request-verification", async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }
    const emailTrim = email.trim().toLowerCase();
    const code = Math.floor(1e5 + Math.random() * 9e5).toString();
    const customersList = await fetchResource("customers");
    const found = customersList.find((c) => c.email.toLowerCase() === emailTrim);
    if (found) {
      found.verificationCode = code;
      found.verificationExpires = Date.now() + 15 * 6e4;
      await saveResource("customers", customersList);
    }
    const emailResult = await sendEmailVerificationEmail(emailTrim, name || found?.name || "Valued Customer", code);
    res.json({
      success: true,
      message: emailResult.success ? "Verification code sent to your email address." : "Verification code generated.",
      devNotice: !emailResult.success ? emailResult.message : void 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to send verification code" });
  }
});
router9.post("/verify-email", async (req, res) => {
  try {
    const { email, code, name } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email address and 6-digit verification code are required." });
    }
    const emailTrim = email.trim().toLowerCase();
    const codeTrim = code.toString().trim();
    const customersList = await fetchResource("customers");
    const found = customersList.find((c) => c.email.toLowerCase() === emailTrim);
    if (!found) {
      return res.status(404).json({ error: "No customer account found for this email address." });
    }
    if (found.verificationCode && found.verificationCode !== codeTrim) {
      return res.status(400).json({ error: "Invalid verification code. Please check your email and try again." });
    }
    if (found.verificationExpires && found.verificationExpires < Date.now()) {
      return res.status(400).json({ error: "Verification code has expired. Please request a new code." });
    }
    found.emailVerified = true;
    found.emailVerifiedAt = (/* @__PURE__ */ new Date()).toISOString();
    delete found.verificationCode;
    delete found.verificationExpires;
    await saveResource("customers", customersList);
    await trackEmailVerified(emailTrim, name || found?.name);
    const { passwordHash, ...safeCustomer } = found;
    res.json({
      success: true,
      message: "Email address verified successfully!",
      customer: safeCustomer
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to verify email address" });
  }
});
router9.post("/login", async (req, res) => {
  try {
    const { email, password, recaptchaToken } = req.body;
    const captchaCheck = await verifyRecaptchaToken(recaptchaToken, "customer_login");
    if (!captchaCheck.success) {
      return res.status(403).json({ error: captchaCheck.error || "reCAPTCHA verification failed. Please try again." });
    }
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const emailTrim = email.trim().toLowerCase();
    const customersList = await fetchResource("customers");
    const found = customersList.find((c) => c.email.toLowerCase() === emailTrim);
    if (!found) {
      return res.status(401).json({ error: "No account found matching this email." });
    }
    let needsUpdate = false;
    const hasOldFormat = found.referralCode && !found.referralCode.startsWith("REF-PS-");
    if (!found.referralCode || hasOldFormat) {
      const codeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const cleanFirstName = found.name.trim().split(" ")[0].replace(/[^a-zA-Z]/g, "").toUpperCase() || "USER";
      found.referralCode = `REF-PS-${cleanFirstName}-${codeSuffix}`;
      needsUpdate = true;
    }
    if (found.storeCredit === void 0) {
      found.storeCredit = 0;
      needsUpdate = true;
    }
    if (found.referredByCode === void 0) {
      found.referredByCode = null;
      needsUpdate = true;
    }
    if (found.passwordHash) {
      if (found.passwordHash !== hashPassword(password)) {
        return res.status(401).json({ error: "Incorrect password. Please try again." });
      }
    } else {
      found.passwordHash = hashPassword(password);
      needsUpdate = true;
    }
    if (needsUpdate) {
      const updatedList = customersList.map((c) => c.id === found.id ? found : c);
      await saveResource("customers", updatedList);
      console.log(`[Customer Auth] Initialized referral credentials or password for: ${emailTrim}`);
    }
    console.log(`[Customer Auth] Login successful: ${emailTrim}`);
    sendLoginNotificationEmail(emailTrim, found.name).catch((e) => console.warn("Login notification email error:", e));
    const { passwordHash, ...safeCustomer } = found;
    const enrichedCustomer = await enrichCustomerAgeStatus(safeCustomer);
    res.json({
      message: "Login successful!",
      customer: enrichedCustomer,
      token: signCustomerToken(emailTrim)
    });
  } catch (err) {
    console.error("[Customer Auth] Login Error:", err);
    res.status(500).json({ error: err.message || "Failed to complete customer login" });
  }
});
router9.post("/google-login", async (req, res) => {
  try {
    const { email, name, googleId, picture } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required for Google login." });
    }
    const emailTrim = email.trim().toLowerCase();
    const customerName = name || emailTrim.split("@")[0] || "Valued Customer";
    const customersList = await fetchResource("customers");
    let found = customersList.find((c) => c.email.toLowerCase() === emailTrim);
    if (found) {
      found.emailVerified = true;
      found.emailVerifiedAt = found.emailVerifiedAt || (/* @__PURE__ */ new Date()).toISOString();
      if (picture && !found.avatarUrl) {
        found.avatarUrl = picture;
      }
      if (googleId) {
        found.googleId = googleId;
      }
      if (!found.referralCode) {
        const codeSuffix2 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const cleanFirstName2 = customerName.trim().split(" ")[0].replace(/[^a-zA-Z]/g, "").toUpperCase() || "USER";
        found.referralCode = `REF-PS-${cleanFirstName2}-${codeSuffix2}`;
      }
      await saveResource("customers", customersList);
      sendLoginNotificationEmail(emailTrim, found.name).catch((e) => console.warn("Login notification email error:", e));
      const { passwordHash: passwordHash2, ...safeCustomer2 } = found;
      const enrichedCustomer2 = await enrichCustomerAgeStatus(safeCustomer2);
      return res.json({
        message: "Logged in via Google successfully!",
        customer: enrichedCustomer2,
        token: signCustomerToken(emailTrim)
      });
    }
    const newId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const codeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const cleanFirstName = customerName.trim().split(" ")[0].replace(/[^a-zA-Z]/g, "").toUpperCase() || "USER";
    const newReferralCode = `REF-PS-${cleanFirstName}-${codeSuffix}`;
    const newCustomer = {
      id: newId,
      name: customerName,
      email: emailTrim,
      googleId: googleId || `google_${Date.now()}`,
      avatarUrl: picture || null,
      emailVerified: true,
      emailVerifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
      signupDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      ordersCount: 0,
      totalSpent: 0,
      rewardPoints: 50,
      // 50 points welcome bonus!
      storeCredit: 0,
      referredByCode: null,
      referralCode: newReferralCode,
      passwordHash: hashPassword(crypto4.randomBytes(16).toString("hex")),
      addresses: []
    };
    customersList.unshift(newCustomer);
    await saveResource("customers", customersList);
    trackCustomerSignup(newCustomer).catch((e) => console.warn("Klaviyo error:", e));
    sendWelcomeEmail(emailTrim, customerName, newReferralCode).catch((e) => console.warn("Welcome email error:", e));
    const { passwordHash, ...safeCustomer } = newCustomer;
    const enrichedCustomer = await enrichCustomerAgeStatus(safeCustomer);
    return res.json({
      message: "Account created with Google!",
      customer: enrichedCustomer,
      token: signCustomerToken(emailTrim)
    });
  } catch (err) {
    console.error("[Customer Auth] Google Login Error:", err);
    res.status(500).json({ error: err.message || "Failed to authenticate with Google" });
  }
});
router9.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Admin email and password are required." });
    }
    if (!verifyAdminCredentials(email, password)) {
      console.warn(`[Admin Auth] Unauthorized admin login attempt with email: ${email}`);
      return res.status(401).json({ error: "Invalid admin login credentials." });
    }
    const token = signAdminToken(String(email).trim().toLowerCase());
    console.log(`[Admin Auth] Admin login succeeded for ${email}`);
    res.json({
      success: true,
      message: "Admin access granted.",
      token,
      adminUser: {
        email: String(email).trim().toLowerCase(),
        name: "Pouch Supply Administrator"
      }
    });
  } catch (err) {
    if (err instanceof AdminAuthNotConfiguredError) {
      console.error("[Admin Auth] Login refused \u2014", err.message);
      return res.status(503).json({
        error: "Admin authentication is not configured on this server. Set AUTH_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD.",
        code: "ADMIN_AUTH_NOT_CONFIGURED"
      });
    }
    console.error("[Admin Auth] Login Error:", err);
    res.status(500).json({ error: err.message || "Internal server error during admin validation" });
  }
});
router9.post("/update-profile", requireCustomer, async (req, res) => {
  try {
    const customerData = req.body.customer || req.body;
    if (!customerData || !customerData.email && !customerData.id) {
      return res.status(400).json({ error: "Customer email or id is required to update profile." });
    }
    const emailTrim = customerData.email ? customerData.email.trim().toLowerCase() : "";
    const customersList = await fetchResource("customers") || [];
    let foundIndex = -1;
    if (customerData.id) {
      foundIndex = customersList.findIndex((c) => c.id === customerData.id);
    }
    if (foundIndex === -1 && emailTrim) {
      foundIndex = customersList.findIndex((c) => c.email && c.email.toLowerCase() === emailTrim);
    }
    if (foundIndex === -1) {
      return res.status(404).json({ error: "Customer account not found." });
    }
    const existing = customersList[foundIndex];
    if (!mayActOnCustomer(req, existing.email)) {
      return res.status(403).json({ error: "You can only update your own profile." });
    }
    const updated = {
      ...existing,
      ...customerData,
      id: existing.id,
      // Preserve ID
      email: existing.email,
      // Preserve email
      data: {
        ...existing.data || {},
        ...customerData.data || {},
        ...customerData.subItems ? { subItems: customerData.subItems } : {},
        ...customerData.subPlan ? { subPlan: customerData.subPlan } : {},
        ...customerData.subPrice ? { subPrice: customerData.subPrice } : {},
        ...customerData.subFrequency ? { subFrequency: customerData.subFrequency } : {},
        ...customerData.subCansCount ? { subCansCount: customerData.subCansCount } : {},
        ...customerData.subPlanManuallyConfigured ? { subPlanManuallyConfigured: true } : {}
      }
    };
    customersList[foundIndex] = updated;
    await saveResource("customers", customersList);
    try {
      await getDb();
      const { PrismaClient: PrismaClient2 } = await import("@prisma/client");
      const prisma2 = new PrismaClient2();
      await prisma2.customer.updateMany({
        where: { email: existing.email },
        data: {
          name: updated.name,
          subscriptionStatus: updated.subscriptionStatus || "Not subscribed",
          subStatus: updated.subStatus || null,
          subPlan: updated.subPlan || null,
          subFrequency: updated.subFrequency || null,
          subCansCount: updated.subCansCount ? Number(updated.subCansCount) : null,
          subPrice: updated.subPrice ? Number(updated.subPrice) : null,
          nextPayment: updated.nextPayment || null,
          nextDelivery: updated.nextDelivery || null,
          data: updated
        }
      });
    } catch (_dbPrismaErr) {
    }
    const { passwordHash, ...safeCustomer } = updated;
    return res.json({
      success: true,
      message: "Customer profile updated successfully.",
      customer: safeCustomer
    });
  } catch (err) {
    console.error("[Customer Profile Update] Error:", err);
    return res.status(500).json({ error: err.message || "Failed to update profile." });
  }
});
var customers_default = router9;

// backend/routes/discounts.ts
init_serverDb();
init_requireAdmin();
init_discountUsage();
import { Router as Router9 } from "express";
var router10 = Router9();
router10.get("/auto", async (req, res) => {
  try {
    const email = String(req.query.email || "").trim();
    if (!email) return res.json({ discount: null });
    const { autoDiscountFor: autoDiscountFor2, newCustomerPlacesRemaining: newCustomerPlacesRemaining2 } = await Promise.resolve().then(() => (init_newCustomerDiscount(), newCustomerDiscount_exports));
    const discount = await autoDiscountFor2(email);
    res.json({ discount, placesRemaining: await newCustomerPlacesRemaining2() });
  } catch (err) {
    console.error("[Discounts Router] GET /auto Error:", err);
    res.json({ discount: null });
  }
});
router10.post("/validate", async (req, res) => {
  try {
    const { customerEmail, discount } = req.body || {};
    if (!discount) {
      return res.status(400).json({ ok: false, message: "A discount is required." });
    }
    if (!customerEmail) return res.json({ ok: true });
    const verdict = await checkDiscountUsable(customerEmail, discount);
    res.json({ ok: verdict.ok, message: verdict.message });
  } catch (err) {
    console.error("[Discounts Router] POST /validate Error:", err);
    res.json({ ok: true });
  }
});
router10.get("/", async (req, res) => {
  try {
    const data = await fetchResource("discounts");
    res.json(data);
  } catch (err) {
    console.error("[Discounts Router] GET Error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch discounts" });
  }
});
router10.post("/", requireAdmin, async (req, res) => {
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
  } catch (err) {
    console.error("[Discounts Router] POST Error:", err);
    res.status(500).json({ error: err.message || "Failed to persist discounts" });
  }
});
var discounts_default = router10;

// backend/routes/customPages.ts
init_planCatalogue();
init_subscriptionPricingService();
init_emailService();
var router11 = createCrudRouter("customPages", {
  onAfterReplace: async (before, after) => {
    const previousPlans = await getPlanCatalogue(before);
    const currentPlans = await getPlanCatalogue(after);
    const changes = diffPlanPrices(previousPlans, currentPlans);
    if (changes.length === 0) return;
    console.log(
      `[Plan Pricing] Price change detected: ${changes.map((c) => `${c.slug} \xA3${c.from.toFixed(2)} -> \xA3${c.to.toFixed(2)}`).join(", ")}`
    );
    const scheduled = await schedulePlanPriceChange(changes, after);
    if (scheduled.length === 0) {
      console.log("[Plan Pricing] No active subscribers affected.");
      return;
    }
    let sent = 0;
    for (const change of scheduled) {
      if (!change.customerEmail) {
        console.error(`[Plan Pricing] Subscription ${change.subscriptionId} has no email; cannot send notice.`);
        continue;
      }
      try {
        await sendSubscriptionPriceChangeEmail(change);
        sent++;
      } catch (err) {
        console.error(
          `[Plan Pricing] NOTICE NOT SENT for ${change.customerEmail} (sub ${change.subscriptionId}):`,
          err?.message || err
        );
      }
    }
    console.log(
      `[Plan Pricing] Scheduled ${scheduled.length} price change(s); ${sent} notice(s) sent. New prices take effect ${scheduled[0]?.effectiveFrom}.`
    );
  }
});
var customPages_default = router11;

// backend/routes/blogs.ts
init_serverDb();
import { Router as Router10 } from "express";
init_requireAdmin();
var router12 = Router10();
router12.get("/", async (req, res) => {
  try {
    const data = await fetchResource("blogs");
    res.json(data);
  } catch (err) {
    console.error("[Blogs Router] GET Error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch blogs" });
  }
});
router12.post("/", requireAdmin, async (req, res) => {
  try {
    const payload = req.body;
    if (!Array.isArray(payload)) {
      return res.status(400).json({ error: "Blogs API expects an array of documents" });
    }
    const database = await getDb();
    if (!database) {
      res.setHeader("X-Database-Offline", "true");
    } else {
      res.setHeader("X-Database-Offline", "false");
    }
    const { kept } = await stripRecycled("blogs", payload);
    const updated = await saveResource("blogs", kept);
    res.json(updated);
  } catch (err) {
    console.error("[Blogs Router] POST Error:", err);
    res.status(500).json({ error: err.message || "Failed to persist blogs" });
  }
});
var blogs_default = router12;

// backend/routes/worldpay.ts
init_prisma();
init_serverDb();
init_requireAdmin();
init_worldpaySubscription();
init_subscriptionCron();
init_ukValidation();
import { Router as Router11 } from "express";
import crypto6 from "crypto";

// src/utils/discountUtils.ts
var MYSTERY_BOX_IMAGE = "/reward-assets/mystery-box.svg";
var MERCH_GIFT_IMAGE = "/reward-assets/merch-gift.svg";
var STANDARD_DELIVERY_COST = 2.99;
var FREE_SHIPPING_THRESHOLD2 = 40;
var MYSTERY_GIFT = {
  id: "gift-mystery-box",
  label: "Mystery Reward \u{1F381}",
  image: MYSTERY_BOX_IMAGE,
  note: "A surprise chosen for you by Pouch Supply \u2014 revealed when your parcel arrives."
};
var MERCH_GIFT = {
  id: "gift-merch",
  label: "Exclusive Pouch Supply merchandise \u{1F381}",
  image: MERCH_GIFT_IMAGE,
  note: "Stickers, keyring, bottle opener and other Pouch Supply extras."
};
var PREMIUM_MERCH_GIFT = {
  id: "gift-merch-premium",
  label: "Premium Pouch Supply merchandise \u{1F455}",
  image: MERCH_GIFT_IMAGE,
  note: "Premium branded apparel, packed with your order."
};
var NO_MONEY_OFF = { type: "Amount off order", valueType: "Fixed amount", valueAmount: 0 };
var LOYALTY_MILESTONE_DEFINITIONS = {
  BRONZE1: {
    code: "BRONZE1",
    order: 1,
    tier: "bronze",
    reward: "Members receive 10% OFF",
    type: "Amount off order",
    valueType: "Percentage",
    valueAmount: 10,
    details: "10% Bronze Member Welcome Discount",
    kind: "discount"
  },
  BRONZE3: {
    code: "BRONZE3",
    order: 3,
    tier: "bronze",
    reward: "FREE can of your choice",
    ...NO_MONEY_OFF,
    details: "1 FREE can of your choice",
    kind: "free-cans",
    freeCanCount: 1
  },
  BRONZE5: {
    code: "BRONZE5",
    order: 5,
    tier: "bronze",
    reward: "Free Delivery on your next order",
    type: "Free shipping",
    valueType: "Fixed amount",
    valueAmount: 0,
    details: "Free Delivery on this order",
    kind: "free-shipping"
  },
  SILVER7: {
    code: "SILVER7",
    order: 7,
    tier: "silver",
    reward: "FREE can of your choice \u{1F96B}",
    ...NO_MONEY_OFF,
    details: "1 FREE can of your choice",
    kind: "free-cans",
    freeCanCount: 1
  },
  SILVER9: {
    code: "SILVER9",
    order: 9,
    tier: "silver",
    reward: "\xA35 Store Credit \u{1F381}",
    type: "Amount off order",
    valueType: "Fixed amount",
    valueAmount: 5,
    details: "\xA35.00 Store Credit",
    kind: "discount"
  },
  SILVER11: {
    code: "SILVER11",
    order: 11,
    tier: "silver",
    reward: "FREE can of your choice \u{1F96B}",
    ...NO_MONEY_OFF,
    details: "1 FREE can of your choice",
    kind: "free-cans",
    freeCanCount: 1
  },
  SILVER13: {
    code: "SILVER13",
    order: 13,
    tier: "silver",
    reward: "Exclusive Pouch Supply merchandise (stickers, keyring, bottle opener, etc.) \u{1F381}",
    ...NO_MONEY_OFF,
    details: "Exclusive Pouch Supply merchandise included free",
    kind: "gift",
    gifts: [MERCH_GIFT]
  },
  SILVER15: {
    code: "SILVER15",
    order: 15,
    tier: "silver",
    reward: "2 FREE cans of your choice \u{1F96B}",
    ...NO_MONEY_OFF,
    details: "2 FREE cans of your choice",
    kind: "free-cans",
    freeCanCount: 2
  },
  GOLD17: {
    code: "GOLD17",
    order: 17,
    tier: "gold",
    reward: "20% off your purchase \u{1F381}",
    type: "Amount off order",
    valueType: "Percentage",
    valueAmount: 20,
    details: "20% Gold Member Discount",
    kind: "discount"
  },
  GOLD19: {
    code: "GOLD19",
    order: 19,
    tier: "gold",
    reward: "2 FREE cans of your choice \u{1F96B}",
    ...NO_MONEY_OFF,
    details: "2 FREE cans of your choice",
    kind: "free-cans",
    freeCanCount: 2
  },
  GOLD21: {
    code: "GOLD21",
    order: 21,
    tier: "gold",
    reward: "Mystery Reward (chosen by Pouch Supply) \u{1F381}",
    ...NO_MONEY_OFF,
    details: "Mystery Reward included free with this order",
    kind: "gift",
    gifts: [MYSTERY_GIFT]
  },
  GOLD23: {
    code: "GOLD23",
    order: 23,
    tier: "gold",
    reward: "2 FREE cans of your choice \u{1F96B}",
    ...NO_MONEY_OFF,
    details: "2 FREE cans of your choice",
    kind: "free-cans",
    freeCanCount: 2
  },
  GOLD25: {
    code: "GOLD25",
    order: 25,
    tier: "gold",
    reward: "Premium Pouch Supply merchandise \u{1F455}",
    ...NO_MONEY_OFF,
    details: "Premium Pouch Supply merchandise included free",
    kind: "gift",
    gifts: [PREMIUM_MERCH_GIFT]
  },
  GOLD27: {
    code: "GOLD27",
    order: 27,
    tier: "gold",
    reward: "20% off your purchase \u{1F381}",
    type: "Amount off order",
    valueType: "Percentage",
    valueAmount: 20,
    details: "20% Gold Member Discount",
    kind: "discount"
  },
  GOLD29: {
    code: "GOLD29",
    order: 29,
    tier: "gold",
    reward: "2 FREE cans of your choice \u{1F96B}",
    ...NO_MONEY_OFF,
    details: "2 FREE cans of your choice",
    kind: "free-cans",
    freeCanCount: 2
  },
  GOLD30: {
    code: "GOLD30",
    order: 30,
    tier: "gold",
    reward: "Unlock Platinum Member \u{1F3C6}",
    type: "Amount off order",
    valueType: "Percentage",
    valueAmount: 25,
    details: "25% Platinum Unlock Welcome Discount",
    kind: "discount"
  },
  PLATINUM_ODD: {
    code: "PLATINUM_ODD",
    order: 31,
    tier: "platinum",
    reward: "Odd order reward: choose 3 FREE cans, \xA310 Store Credit, Free Delivery, exclusive merchandise, or a Mystery Reward",
    ...NO_MONEY_OFF,
    details: "Platinum VIP odd-order reward",
    kind: "choice",
    choices: [
      {
        id: "cans",
        label: "3 FREE cans of your choice \u{1F96B}",
        kind: "free-cans",
        details: "3 FREE cans of your choice",
        ...NO_MONEY_OFF,
        freeCanCount: 3
      },
      {
        id: "credit",
        label: "\xA310.00 Store Credit \u{1F4B7}",
        kind: "discount",
        details: "\xA310.00 Store Credit",
        type: "Amount off order",
        valueType: "Fixed amount",
        valueAmount: 10
      },
      {
        id: "delivery",
        label: "Free Priority Delivery \u{1F69A}",
        kind: "free-shipping",
        details: "Free Delivery on this order",
        type: "Free shipping",
        valueType: "Fixed amount",
        valueAmount: 0
      },
      {
        id: "merch",
        label: "Exclusive Pouch Supply merchandise \u{1F381}",
        kind: "gift",
        details: "Exclusive Pouch Supply merchandise included free",
        ...NO_MONEY_OFF,
        gifts: [MERCH_GIFT]
      },
      {
        id: "mystery",
        label: "Mystery Reward \u{1F3B2}",
        kind: "gift",
        details: "Mystery Reward included free with this order",
        ...NO_MONEY_OFF,
        gifts: [MYSTERY_GIFT]
      }
    ]
  }
};
function isFreeShippingReward(discount) {
  if (!discount) return false;
  if (discount.rewardKind === "free-shipping") return true;
  if (discount.type === "Free shipping") return true;
  const details = (discount.details || "").toLowerCase();
  const title = (discount.title || "").toUpperCase();
  return title.includes("BRONZE5") || details.includes("free shipping") || details.includes("free delivery") || details.includes("free royal mail");
}
function resolveDeliveryCost(subtotalAfterDiscount, discount, baseCost = STANDARD_DELIVERY_COST) {
  if (isFreeShippingReward(discount)) return 0;
  if (subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD2) return 0;
  return baseCost;
}

// backend/routes/worldpay.ts
init_subscriptionPricing();
init_klaviyoService();
init_discountUsage();
var router13 = Router11();
function assertDeliverable(body) {
  const address = body?.shippingAddress && typeof body.shippingAddress === "object" ? body.shippingAddress : {};
  const destination = String(body?.destination || body?.address || "");
  const country = address.country || address.countryCode || (destination ? destination.split(",").map((p) => p.trim()).filter(Boolean).pop() || "" : "");
  const phone = body?.customerPhone || address.phone || "";
  const postcode = address.postcode || "";
  const check = validateUkDelivery({
    phone,
    postcode,
    // An order with no country recorded at all predates the UK-only rule rather
    // than being an overseas order; the postcode check still has to pass.
    country: country || UK_COUNTRY_NAME
  });
  if (!check.valid) {
    return { ok: false, phone: "", postcode: "", message: check.errors[0] };
  }
  return { ok: true, phone: normalizeUkPhone(phone), postcode: normalizeUkPostcode(postcode), message: "" };
}
var pendingCheckoutsMap = /* @__PURE__ */ new Map();
function getEnvironmentConfig() {
  const entity = process.env.WORLDPAY_ENTITY || process.env.WORLDPAY_ENTITY_ID || "";
  const username = process.env.WORLDPAY_API_USERNAME || "";
  const password = process.env.WORLDPAY_API_PASSWORD || "";
  const baseUrl = (process.env.WORLDPAY_BASE_URL || "https://access.worldpay.com").replace(/\/+$/, "");
  let authHeader = null;
  if (username && password) {
    authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  }
  const environment = String(process.env.WORLDPAY_ENVIRONMENT || "live").toLowerCase();
  const isTestMode = environment === "test" || environment === "sandbox";
  return {
    isTestMode,
    environment,
    entity,
    username,
    password,
    baseUrl,
    authHeader,
    checkoutId: process.env.WORLDPAY_CHECKOUT_ID || process.env.NEXT_PUBLIC_WORLDPAY_CHECKOUT_ID || ""
  };
}
function extractWorldpayRedirectUrl(responseBody) {
  if (!responseBody) return null;
  for (const prop of ["hostedPaymentPageUrl", "redirectUrl", "checkoutUrl", "url"]) {
    const val = responseBody[prop];
    if (val && typeof val === "string" && !val.includes("/paymentQueries") && !val.includes("/payments?")) {
      return val;
    }
  }
  const links = responseBody._links;
  if (!links || typeof links !== "object") return null;
  const priorityRels = [
    "hostedPaymentPage",
    "payments:hostedPaymentPage",
    "hpp:hostedPaymentPage",
    "hostedPaymentPage:page",
    "hostedPaymentPage:redirect",
    "paymentPage",
    "redirect",
    "checkout",
    "shopper"
  ];
  for (const rel of priorityRels) {
    const item = links[rel];
    const href = typeof item === "string" ? item : item?.href;
    if (href && typeof href === "string" && !href.includes("/paymentQueries") && !href.includes("/payments?")) {
      return href;
    }
  }
  for (const [relKey, item] of Object.entries(links)) {
    if (relKey === "self") continue;
    const href = typeof item === "string" ? item : item?.href;
    if (href && typeof href === "string" && !href.includes("/paymentQueries") && !href.includes("/payments?")) {
      return href;
    }
  }
  const selfHref = typeof links.self === "string" ? links.self : links.self?.href;
  if (selfHref && typeof selfHref === "string" && (selfHref.includes("/paymentPages/") || selfHref.includes("/checkout/"))) {
    return selfHref;
  }
  return null;
}
async function backfillSubscriptionCredential(orderId, gatewayResponse) {
  const href = extractRecurringAuthorizationHref(gatewayResponse);
  const scheme = extractSchemeReference(gatewayResponse);
  const tokenHref = extractTokenHref(gatewayResponse);
  if (!href && !scheme && !tokenHref) return false;
  let updated = false;
  try {
    const storedSubs = await fetchResource("subscriptions") || [];
    const next = storedSubs.map((sub) => {
      if (String(sub?.sourceOrderId || sub?.worldpayTransactionId || "") !== String(orderId)) return sub;
      const needsToken = Boolean(tokenHref) && !isUsableTokenHref(sub.worldpayTokenHref);
      const hasUsable = isUsableRecurringHref(sub.worldpayRecurringHref) || Boolean(sub.worldpaySchemeReference) && !isPlaceholderCredential(sub.worldpaySchemeReference);
      if (hasUsable && !needsToken) return sub;
      updated = true;
      console.log(
        `[Worldpay Order] Recording Worldpay stored credential for subscription ${sub.id} from a later gateway response for order ${orderId}` + (needsToken ? " (including the stored card token)." : ".")
      );
      return {
        ...sub,
        worldpayTokenHref: tokenHref || sub.worldpayTokenHref || null,
        worldpayRecurringHref: href || sub.worldpayRecurringHref || null,
        worldpaySchemeReference: scheme || sub.worldpaySchemeReference || null
      };
    });
    if (updated) {
      await saveResource("subscriptions", next);
      const target = next.find(
        (sub) => String(sub?.sourceOrderId || sub?.worldpayTransactionId || "") === String(orderId)
      );
      if (target?.id) {
        try {
          await prisma.subscription.update({
            where: { id: String(target.id) },
            data: {
              worldpayTokenHref: target.worldpayTokenHref,
              worldpayRecurringHref: target.worldpayRecurringHref,
              worldpaySchemeReference: target.worldpaySchemeReference
            }
          });
        } catch (_e) {
        }
      }
    }
  } catch (_e) {
  }
  return updated;
}
var PENDING_TOKENS_RESOURCE = "worldpayPendingTokens";
var PENDING_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1e3;
async function holdUnmatchedToken(tokenHref, hints) {
  try {
    const held = await fetchResource(PENDING_TOKENS_RESOURCE) || [];
    const cutoff = Date.now() - PENDING_TOKEN_TTL_MS;
    const kept = held.filter(
      (entry) => entry && entry.tokenHref !== tokenHref && new Date(entry.receivedAt || 0).getTime() > cutoff
    );
    kept.push({
      id: `tok_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      tokenHref,
      reference: hints.reference || null,
      namespace: hints.namespace || null,
      receivedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    await saveResource(PENDING_TOKENS_RESOURCE, kept.slice(-200));
    console.warn(
      `[Worldpay Webhook] tokenCreated arrived for reference "${hints.reference || "n/a"}" / namespace "${hints.namespace || "n/a"}" before its subscription existed. Held for the subscription to claim. Token: ${tokenHref}`
    );
  } catch (err) {
    console.error(
      `[Worldpay Webhook] COULD NOT PARK an unmatched card token \u2014 it is lost unless recovered from this line. reference="${hints.reference || "n/a"}" namespace="${hints.namespace || "n/a"}" token=${tokenHref} error=${err?.message}`
    );
  }
}
async function claimPendingToken(orderId, customerEmail) {
  const reference = String(orderId || "").trim();
  const email = String(customerEmail || "").trim().toLowerCase();
  if (!reference && !email) return null;
  try {
    const held = await fetchResource(PENDING_TOKENS_RESOURCE) || [];
    if (held.length === 0) return null;
    const match = held.find(
      (entry) => entry && isUsableTokenHref(entry.tokenHref) && (reference && String(entry.reference || "").trim() === reference || email && String(entry.namespace || "").trim().toLowerCase() === email)
    );
    if (!match) return null;
    const consumed = held.map(
      (entry) => entry?.id === match.id ? {
        id: entry.id,
        tokenHref: null,
        reference: entry.reference || null,
        namespace: entry.namespace || null,
        receivedAt: entry.receivedAt || (/* @__PURE__ */ new Date()).toISOString(),
        claimedAt: (/* @__PURE__ */ new Date()).toISOString()
      } : entry
    );
    await saveResource(PENDING_TOKENS_RESOURCE, consumed);
    console.log(
      `[Worldpay Order] Claimed a held card token for order ${reference || email}: ${match.tokenHref}`
    );
    return match.tokenHref;
  } catch (err) {
    console.warn("[Worldpay Order] Could not read held card tokens:", err?.message);
    return null;
  }
}
async function recordTokenForSubscription(tokenHref, hints) {
  const reference = String(hints.transactionReference || "").trim();
  const namespace = String(hints.namespace || "").trim().toLowerCase();
  if (!isUsableTokenHref(tokenHref)) return false;
  const matches = (sub) => {
    if (!sub) return false;
    if (reference) {
      const refs = [sub.sourceOrderId, sub.worldpayTransactionId, sub.lastPaymentId].map((v) => String(v || "").trim()).filter(Boolean);
      if (refs.some((r) => r === reference)) return true;
    }
    if (namespace) {
      const email = String(sub.customerEmail || "").trim().toLowerCase();
      if (email && email === namespace) return true;
    }
    return false;
  };
  let updatedId = null;
  try {
    const storedSubs = await fetchResource("subscriptions") || [];
    const candidates = storedSubs.filter(matches);
    if (candidates.length === 0) {
      await holdUnmatchedToken(tokenHref, { reference, namespace });
      return false;
    }
    const target = candidates.sort((a, b) => {
      const at = new Date(a?.createdAt || 0).getTime();
      const bt = new Date(b?.createdAt || 0).getTime();
      return bt - at;
    })[0];
    if (String(target.worldpayTokenHref || "") === tokenHref) return false;
    updatedId = String(target.id);
    const next = storedSubs.map(
      (sub) => String(sub.id) === updatedId ? { ...sub, worldpayTokenHref: tokenHref, tokenRecordedAt: (/* @__PURE__ */ new Date()).toISOString() } : sub
    );
    await saveResource("subscriptions", next);
    console.log(
      `[Worldpay Webhook] Stored card token recorded for subscription ${updatedId} (${target.customerEmail}). Renewals can now present the card.`
    );
  } catch (err) {
    console.error("[Worldpay Webhook] Failed to record token against a subscription:", err?.message);
    return false;
  }
  if (updatedId) {
    try {
      await prisma.subscription.update({
        where: { id: updatedId },
        data: { worldpayTokenHref: tokenHref }
      });
    } catch (_e) {
    }
  }
  return Boolean(updatedId);
}
var PAYMENT_QUERY_ACCEPT = "application/vnd.worldpay.payment-queries-v1.hal+json";
var PAYMENT_QUERY_ATTEMPTS = 3;
var PAYMENT_QUERY_RETRY_MS = 1200;
var AUTHORISED_PAYMENT_EVENTS = [
  "authorized",
  "authorised",
  "sentforsettlement",
  // What this account actually reports for a captured payment. Every live
  // Worldpay payment queried on this entity comes back
  // `"lastEvent": "settlementRequestSubmitted"` — the money is authorised AND
  // the settlement request is in. It was missing from this list, so every real
  // payment normalised to "unknown", the order was recorded as Pending, and the
  // subscription that depends on a confirmed payment was never created.
  "settlementrequestsubmitted",
  "settlementsubmitted",
  "settled",
  "charged",
  "captured"
];
var FAILED_PAYMENT_EVENTS = ["refused", "declined", "failed", "cancelled", "canceled", "expired", "error"];
function paymentOutcome(payment) {
  if (!payment) return "unknown";
  const raw = String(payment.lastEvent || payment.outcome || payment.status || "").toLowerCase().replace(/[\s_-]/g, "");
  if (!raw) return "unknown";
  if (AUTHORISED_PAYMENT_EVENTS.includes(raw)) return "authorised";
  if (FAILED_PAYMENT_EVENTS.includes(raw)) return "failed";
  return "unknown";
}
async function fetchWorldpayPaymentDetails(transactionReference) {
  const cfg = getEnvironmentConfig();
  if (!cfg.authHeader || !cfg.entity) return null;
  const url = `${cfg.baseUrl}/paymentQueries/payments?transactionReference=${encodeURIComponent(transactionReference)}`;
  for (let attempt = 1; attempt <= PAYMENT_QUERY_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: cfg.authHeader,
          Accept: PAYMENT_QUERY_ACCEPT,
          "WP-CorrelationId": crypto6.randomUUID ? crypto6.randomUUID() : `q-${Date.now()}`
        }
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        console.warn(
          `[Worldpay Query] Payment lookup for ${transactionReference} returned HTTP ${response.status}. A subscription created from this payment will have no stored-card mandate. ${detail.slice(0, 300)}`
        );
        return null;
      }
      const data = await response.json().catch(() => null);
      const payment = data?._embedded?.payments?.[0] || data?.payments?.[0] || null;
      if (payment) return payment;
      if (attempt < PAYMENT_QUERY_ATTEMPTS) {
        console.log(
          `[Worldpay Query] No payment published yet for ${transactionReference} (attempt ${attempt}/${PAYMENT_QUERY_ATTEMPTS}); retrying.`
        );
        await new Promise((resolve) => setTimeout(resolve, PAYMENT_QUERY_RETRY_MS));
        continue;
      }
      console.warn(
        `[Worldpay Query] Worldpay reports no payment for ${transactionReference}. The shopper did not complete the payment, or it was declined.`
      );
      return null;
    } catch (err) {
      console.warn(`[Worldpay Query] Payment lookup failed for ${transactionReference}:`, err?.message);
      return null;
    }
  }
  return null;
}
async function savePendingCheckout(orderId, payload) {
  pendingCheckoutsMap.set(orderId, payload);
  try {
    const existing = await fetchResource("pending_checkouts") || [];
    const idx = existing.findIndex((p) => String(p.orderId) === String(orderId));
    if (idx !== -1) {
      existing[idx] = payload;
    } else {
      existing.unshift(payload);
    }
    await saveResource("pending_checkouts", existing.slice(0, 200));
  } catch (err) {
    console.warn("[Worldpay] Failed to persist pending checkout:", err);
  }
}
async function getPendingCheckout(orderId) {
  let pending = pendingCheckoutsMap.get(orderId);
  if (pending) return pending;
  try {
    const existing = await fetchResource("pending_checkouts") || [];
    const found = existing.find((p) => String(p.orderId) === String(orderId));
    if (found) {
      pendingCheckoutsMap.set(orderId, found);
      return found;
    }
  } catch (err) {
    console.warn("[Worldpay] Failed to load pending checkout from resource:", err);
  }
  return void 0;
}
async function saveVerifiedOrder(orderId, details) {
  const pending = details.pendingData || await getPendingCheckout(orderId);
  const { saveSingleOrder: saveSingleOrder2 } = await Promise.resolve().then(() => (init_orders(), orders_exports));
  let repairMissingSubscription = false;
  let existingPaidOrder = null;
  let matchedOrder = null;
  const matchesPayment = (order, reference) => {
    if (!order) return false;
    const ref = String(reference || "").trim();
    if (!ref) return false;
    return String(order.id) === ref || String(order.worldpayTxId || "").trim() === ref || String(order.gatewayTxId || "").trim() === ref;
  };
  const looksLikeSubscriptionOrder = (order, candidateItems) => {
    if (!order && !candidateItems?.length) return false;
    if (order?.isSubscription) return true;
    if (Array.isArray(order?.tags) && order.tags.some((t) => /subscription/i.test(String(t)))) return true;
    if (order?.subscriptionDetails) return true;
    const all = [...Array.isArray(order?.items) ? order.items : [], ...candidateItems || []];
    return all.some(
      (it) => it?.isSubscription || typeof it?.productId === "string" && it.productId.includes("sub-pack")
    );
  };
  try {
    const existingOrders = await fetchResource("orders") || [];
    const already = existingOrders.find((o) => matchesPayment(o, orderId));
    matchedOrder = already || null;
    if (already && already.paymentStatus === "Paid") {
      const matchedId = String(already.id);
      const existingSubs = await fetchResource("subscriptions") || [];
      const hasSubscription = existingSubs.some(
        (s) => String(s?.sourceOrderId || "") === matchedId || already.subscriptionId && String(s?.id) === String(already.subscriptionId)
      );
      const isRenewalOrder = Array.isArray(already.tags) && already.tags.some((t) => /worldpay recurring/i.test(String(t))) || matchedId !== String(orderId);
      const wantsSubscription = !isRenewalOrder && looksLikeSubscriptionOrder(already, details.items || pending?.items || []);
      if (hasSubscription || !wantsSubscription) {
        console.log(
          `[Worldpay Order] ${matchedId} is already recorded as Paid` + (matchedId === String(orderId) ? "" : ` (matched from gateway reference ${orderId})`) + " \u2014 skipping duplicate creation."
        );
        await backfillSubscriptionCredential(matchedId, details.gatewayResponse);
        return already;
      }
      console.error(
        `[Worldpay Order] REPAIRING ${orderId}: it is recorded as Paid and is a subscription order, but no subscription exists for it. Creating the missing subscription now; the order itself is left untouched.`
      );
      repairMissingSubscription = true;
      existingPaidOrder = already;
    }
  } catch (_e) {
  }
  try {
    const existingSubs = await fetchResource("subscriptions") || [];
    const dupeSub = existingSubs.find((s) => String(s.sourceOrderId || "") === String(orderId));
    if (dupeSub) {
      console.log(
        `[Worldpay Order] A subscription (${dupeSub.id}) already exists for order ${orderId} \u2014 not creating another.`
      );
      await backfillSubscriptionCredential(String(orderId), details.gatewayResponse);
      return (await fetchResource("orders")).find((o) => String(o.id) === String(orderId)) || null;
    }
  } catch (_e) {
  }
  if (details.allowCreate === false && !matchedOrder) {
    console.warn(
      `[Worldpay Order] No order matches gateway reference "${orderId}" (checked id, worldpayTxId and gatewayTxId). Not creating one \u2014 a webhook never authors an order. If a payment was taken for an order this store does not have, that is a reconciliation problem, not a missing row.`
    );
    return null;
  }
  const customerName = pending?.customerName || details.customerName || "Valued Customer";
  const rawEmail = pending?.customerEmail || details.customerEmail || "customer@pouch-supply.com";
  const customerEmail = String(rawEmail).toLowerCase().trim();
  const destination = pending?.destination || details.destination || "United Kingdom";
  const items = pending?.items && pending.items.length > 0 ? pending.items : details.items && details.items.length > 0 ? details.items : Array.isArray(existingPaidOrder?.items) ? existingPaidOrder.items : [];
  const total = typeof pending?.total === "number" ? pending.total : typeof details.total === "number" ? details.total : parseFloat(pending?.total) || parseFloat(details.total) || 0;
  const storeCreditApplied = pending?.storeCreditApplied || details.storeCreditApplied || 0;
  const discountApplied = pending?.discountApplied || details.discountApplied || null;
  const subItemsList = items.filter(isSubscriptionLine);
  const subItem = subItemsList[0];
  const subItemsTotal = subscriptionLinesTotal(items);
  const effectiveShipping = typeof pending?.shippingCost === "number" ? pending.shippingCost : typeof pending?.deliveryCost === "number" ? pending.deliveryCost : typeof details.shippingCost === "number" ? details.shippingCost : typeof details.deliveryCost === "number" ? details.deliveryCost : total > subItemsTotal && subItemsTotal > 0 ? Number((total - subItemsTotal).toFixed(2)) : resolveDeliveryCost(total, discountApplied);
  const deliveryMethod = pending?.deliveryMethod || details.deliveryMethod || "Royal Mail Tracked 24/48";
  const paymentConfirmed = details.paymentConfirmed !== false;
  let createdSubscriptionId;
  if (subItem && paymentConfirmed) {
    try {
      const rawPlanTitle = subItem.subscriptionPlan || subItem.productTitle || subItem.title || "";
      const planTier = String(rawPlanTitle).toLowerCase().split(/\s+-\s+|\[|\(/)[0].match(/\b(ultimate|core|lite|pro)\b/)?.[1];
      const planName = planTier ? `${planTier.toUpperCase()} Plan` : rawPlanTitle || "Pouch Supply Subscription";
      const planId = subItem.productId || "sub-pack-core";
      const rawFrequency = (subItem.subscriptionFrequency || subItem.frequency || subItem.billingInterval || pending?.items?.find((i) => i.isSubscription)?.subscriptionFrequency || "month").toString();
      const billingInterval = normalizeBillingInterval(rawFrequency);
      const nextBillingDate = calculateNextBillingDate(billingInterval, /* @__PURE__ */ new Date());
      const recurringHref = extractRecurringAuthorizationHref(details.gatewayResponse) || null;
      const schemeReference = extractSchemeReference(details.gatewayResponse) || (details.schemeReference && !isPlaceholderCredential(details.schemeReference) ? details.schemeReference : null);
      let tokenHref = extractTokenHref(details.gatewayResponse) || // The tokenCreated webhook can arrive before this order is written. If
      // it did, its token is waiting to be claimed rather than lost.
      await claimPendingToken(String(orderId), customerEmail) || null;
      if (!tokenHref && customerEmail) {
        const tokens = await fetchTokensForNamespace(customerEmail);
        const selection = selectTokenForSubscription(tokens, {
          namespace: customerEmail,
          schemeReference
        });
        if (selection.token) {
          tokenHref = selection.token.href;
          console.log(
            `[Worldpay Order] Stored card for order ${orderId} retrieved from the tokens service (${selection.reason}).`
          );
        } else if (selection.ambiguous) {
          console.warn(`[Worldpay Order] No card assigned to order ${orderId}: ${selection.reason}`);
        }
      }
      const tokenisationDowngraded = Boolean(pending?.tokenisationDowngraded);
      if (!tokenHref && tokenisationDowngraded) {
        console.error(
          `[Worldpay Order] Subscription for order ${orderId} was taken as a ONE-OFF payment because Worldpay refused to store the card. No tokenCreated webhook will arrive and this plan cannot renew. Enable customer agreements / tokenisation on the account, then ask this customer to re-subscribe.`
        );
      } else if (!tokenHref) {
        console.log(
          `[Worldpay Order] Subscription for order ${orderId} has no stored card token yet \u2014 awaiting the tokenCreated webhook at /api/worldpay/webhook.`
        );
      }
      if (!recurringHref && !schemeReference) {
        console.warn(
          `[Worldpay Order] Subscription for order ${orderId} has no Worldpay stored-credential reference. Recurring renewals cannot be charged until the initial payment returns a scheme transaction reference (the Hosted Payment Page must be created with a customer agreement).`
        );
      }
      const rewardWaivedDelivery = effectiveShipping === 0 && isFreeShippingReward(discountApplied);
      const { amount: subAmount, shipping: recurringShipping } = recurringAmountForNewSubscription({
        subItemsTotal,
        orderShipping: effectiveShipping,
        orderTotal: total,
        discountAmount: pending?.discountAmount ?? details.discountAmount,
        storeCreditApplied,
        rewardWaivedDelivery
      });
      const recurringItems = items.filter((it) => !it?.isRewardItem);
      const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      createdSubscriptionId = subId;
      const subData = {
        id: subId,
        // Links the subscription back to the order that created it so a repeated
        // callback for the same payment can be recognised as a duplicate.
        sourceOrderId: String(orderId),
        customerId: customerEmail,
        customerEmail,
        customerName,
        planId,
        planName,
        amount: subAmount,
        // Total recurring charge (includes shipping fee)
        itemPrice: subItemsTotal || Number(subItem.price) || subAmount,
        shippingCost: recurringShipping,
        shippingFee: recurringShipping,
        shippingAmount: recurringShipping,
        deliveryCost: recurringShipping,
        shippingAddress: destination,
        deliveryMethod,
        currency: "GBP",
        status: "active",
        billingInterval,
        nextBillingDate,
        worldpayTransactionId: details.transactionId || orderId,
        worldpayTokenHref: tokenHref,
        // Truthful state for a plan that can never charge again, so it is not
        // left indistinguishable from one that is simply waiting for its webhook.
        tokenisationDowngraded: tokenisationDowngraded && !tokenHref,
        worldpayRecurringHref: recurringHref,
        worldpaySchemeReference: schemeReference,
        lastPaymentStatus: "authorized",
        lastPaymentId: details.transactionId || orderId,
        lastPaymentAt: /* @__PURE__ */ new Date(),
        items: recurringItems
      };
      {
        const { upsertSubscriptionRow: upsertSubscriptionRow2 } = await Promise.resolve().then(() => (init_subscriptionRow(), subscriptionRow_exports));
        const stored = await upsertSubscriptionRow2(subData);
        if (!stored) {
          console.error(
            `[SUBSCRIPTION NOT PERSISTED] ${subId} for order ${orderId} is not in the Neon Subscription table. Recover it from the payload below.`,
            JSON.stringify(subData)
          );
        }
      }
      try {
        const storedSubs = await fetchResource("subscriptions") || [];
        const withoutThis = storedSubs.filter((existing) => String(existing?.id) !== String(subId));
        withoutThis.unshift(subData);
        await saveResource("subscriptions", withoutThis.slice(0, 500));
      } catch (storeErr) {
        console.error(
          `[SUBSCRIPTION NOT SAVED] ${subId} for order ${orderId} could not be written to the subscriptions store: ${storeErr?.message}. The repair sweep will rebuild it from the order. Payload: ${JSON.stringify(subData)}`
        );
      }
      try {
        const customers = await fetchResource("customers") || [];
        const foundCust = customers.find((c) => String(c.email).toLowerCase().trim() === customerEmail);
        if (foundCust) {
          foundCust.subscriptionStatus = "Active Subscriber";
          foundCust.subStatus = "active";
          foundCust.subPlan = planName;
          foundCust.subPrice = subAmount;
          foundCust.nextPayment = nextBillingDate.toISOString().split("T")[0];
          await saveResource("customers", customers);
        }
      } catch (_e) {
      }
      trackSubscriptionStarted(subData, { id: orderId, customerEmail, customerName }).catch((e) => console.warn(`[Klaviyo] Started Subscription failed for ${subId}:`, e?.message || e));
    } catch (subErr) {
      console.error(
        `[SUBSCRIPTION CREATION FAILED] Order ${orderId} is paid but its subscription could not be created: ${subErr?.message || subErr}`,
        subErr?.stack || ""
      );
    }
  }
  const tags = ["Storefront", pending?.isTestMode ? "Worldpay Test Order" : "Worldpay Live Order"];
  if (subItem) {
    tags.push("Subscription Order");
  }
  const calculatedSubtotal = typeof pending?.subtotal === "number" ? pending.subtotal : total > effectiveShipping ? Number((total - effectiveShipping).toFixed(2)) : total;
  const formattedOrder = {
    id: orderId,
    orderId,
    customerName,
    customerEmail,
    destination,
    // The separate address fields ride along with the order so Royal Mail can
    // read the town and postcode directly.
    shippingAddress: pending?.shippingAddress || details.shippingAddress || null,
    // Kept at the top level too: createRoyalMailShipment reads either
    // shippingAddress.phone or customerPhone when building the label.
    customerPhone: pending?.customerPhone || details.customerPhone || pending?.shippingAddress?.phone || null,
    items,
    total,
    subtotal: calculatedSubtotal,
    shippingCost: effectiveShipping,
    deliveryCost: effectiveShipping,
    storeCreditApplied,
    discountApplied,
    discountAmount: typeof pending?.discountAmount === "number" ? pending.discountAmount : typeof details.discountAmount === "number" ? details.discountAmount : void 0,
    // Never invented. "status=SUCCESS" in the return URL is the browser's claim;
    // only a payment Worldpay reports as authorised makes this Paid. An
    // unconfirmed order stays Pending and is completed by the webhook, or by the
    // status poll the checkout page is already running.
    paymentStatus: paymentConfirmed ? "Paid" : "Pending",
    fulfillmentStatus: "Unfulfilled",
    worldpayTxId: details.transactionId,
    worldpayAuthCode: details.authCode || "AUTH-OK",
    gatewayTxId: details.transactionId,
    gatewayAuthCode: details.authCode || "AUTH-OK",
    cardBrand: details.cardBrand || "Worldpay Card",
    deliveryMethod,
    carrier: "Royal Mail",
    tags,
    subscriptionId: createdSubscriptionId,
    isSubscription: Boolean(subItem),
    date: (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " at " + (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    data: {
      cardLast4: details.cardLast4,
      paymentMethod: details.paymentMethod || "Worldpay Access",
      webhookEventId: details.webhookEventId,
      isTestMode: pending?.isTestMode ?? false,
      subscriptionId: createdSubscriptionId,
      shippingCost: effectiveShipping,
      deliveryCost: effectiveShipping,
      subtotal: calculatedSubtotal
    }
  };
  const savedOrder = repairMissingSubscription ? existingPaidOrder : await saveSingleOrder2(formattedOrder);
  pendingCheckoutsMap.delete(orderId);
  try {
    const { getRoyalMailSettings: getRoyalMailSettings2, createRoyalMailShipment: createRoyalMailShipment2 } = await Promise.resolve().then(() => (init_royalMailService(), royalMailService_exports));
    const rmSettings = await getRoyalMailSettings2();
    const hasKey = Boolean(rmSettings.apiKey || process.env.ROYAL_MAIL_API_KEY || process.env.RM_API_KEY);
    if (rmSettings.enabled && rmSettings.autoCreateShipmentOnPayment && hasKey) {
      console.log(`[Worldpay Order] Auto-registering Click & Drop shipment with Royal Mail for order #${orderId}`);
      createRoyalMailShipment2(orderId, {
        serviceCode: rmSettings.defaultServiceCode,
        weightGrams: rmSettings.defaultWeightGrams || 70
      }).catch((err) => {
        console.warn(`[Worldpay Order] Background Royal Mail shipment creation note for #${orderId}:`, err?.message);
      });
    }
  } catch (_rmErr) {
  }
  return savedOrder;
}
async function reconcilePendingWorldpayOrders(limit = 50) {
  const orders = await fetchResource("orders") || [];
  const pendingOrders = orders.filter((o) => o && String(o.paymentStatus || "").toLowerCase() === "pending").slice(0, limit);
  const results = [];
  for (const order of pendingOrders) {
    const orderId = String(order.id);
    try {
      const payment = await fetchWorldpayPaymentDetails(orderId);
      const outcome = paymentOutcome(payment);
      if (outcome === "failed") {
        results.push({ orderId, status: "failed", detail: String(payment?.lastEvent || "refused") });
        continue;
      }
      if (outcome !== "authorised") {
        results.push({ orderId, status: "still-unconfirmed", detail: String(payment?.lastEvent || "no payment published") });
        continue;
      }
      const card = payment?.paymentInstrument?.card;
      await saveVerifiedOrder(orderId, {
        transactionId: String(payment?.paymentId || order.worldpayTxId || orderId),
        authCode: payment?.issuer?.authorizationCode || void 0,
        cardBrand: card?.brand || void 0,
        cardLast4: card?.number?.last4Digits || void 0,
        // The payment query response is what carries scheme.reference, which is
        // the stored credential the renewal needs.
        gatewayResponse: payment,
        paymentConfirmed: true,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        destination: order.destination,
        items: order.items,
        total: typeof order.total === "number" ? order.total : void 0,
        deliveryMethod: order.deliveryMethod
      });
      results.push({ orderId, status: "reconciled", detail: String(payment?.transactionType || "") });
    } catch (err) {
      results.push({ orderId, status: "error", detail: err?.message });
    }
  }
  return results;
}
var handleReconcilePending = async (_req, res) => {
  try {
    const results = await reconcilePendingWorldpayOrders();
    const reconciled = results.filter((r) => r.status === "reconciled").length;
    const repairResults = await repairOrdersMissingSubscriptions().catch((err) => {
      console.error("[Worldpay Subscription Repair] Failed during reconcile:", err?.message);
      return [];
    });
    const subsRepaired = repairResults.filter((r) => r.status === "repaired").length;
    const tokenResults = await recoverMissingSubscriptionTokens().catch((err) => {
      console.error("[Worldpay Token Sweep] Sweep failed during reconcile:", err?.message);
      return [];
    });
    const tokensRecovered = tokenResults.filter((r) => r.status === "recovered").length;
    return res.json({
      success: true,
      message: `Checked ${results.length} pending order(s); ${reconciled} reconciled. Repaired ${subsRepaired} paid order(s) that had no subscription. Checked ${tokenResults.length} subscription(s) with no stored card; ${tokensRecovered} recovered.`,
      results,
      subscriptionRepair: repairResults,
      tokenRecovery: tokenResults
    });
  } catch (err) {
    console.error("[Worldpay Reconcile] Failed:", err);
    return res.status(500).json({ success: false, error: err?.message });
  }
};
var TOKEN_SWEEP_LIMIT = 25;
var TOKEN_SWEEP_MAX_ATTEMPTS = 5;
var LIVE_SUB_STATUSES_FOR_SWEEP = ["active", "subscribed", "paused", "trialing"];
async function recoverMissingSubscriptionTokens(limit = TOKEN_SWEEP_LIMIT) {
  const results = [];
  let subs = [];
  try {
    subs = await fetchResource("subscriptions") || [];
  } catch (err) {
    console.warn("[Worldpay Token Sweep] Could not read subscriptions:", err?.message);
    return results;
  }
  const needsToken = subs.filter((sub) => {
    if (!sub) return false;
    if (!LIVE_SUB_STATUSES_FOR_SWEEP.includes(String(sub.status || "").toLowerCase())) return false;
    if (isUsableTokenHref(sub.worldpayTokenHref)) return false;
    if (sub.tokenisationDowngraded) return false;
    if (Number(sub.tokenLookupAttempts || 0) >= TOKEN_SWEEP_MAX_ATTEMPTS) return false;
    return true;
  });
  if (needsToken.length === 0) return results;
  console.log(
    `[Worldpay Token Sweep] ${needsToken.length} live subscription(s) have no stored card. Re-reading their original payments for a token.`
  );
  let changed = false;
  const patched = /* @__PURE__ */ new Map();
  const attempted = /* @__PURE__ */ new Map();
  for (const sub of needsToken.slice(0, limit)) {
    const reference = String(sub.sourceOrderId || sub.worldpayTransactionId || sub.lastPaymentId || "").trim();
    const id = String(sub.id);
    const email = String(sub.customerEmail || "").trim().toLowerCase();
    if (email) {
      const tokens = await fetchTokensForNamespace(email);
      const selection = selectTokenForSubscription(tokens, {
        namespace: email,
        schemeReference: sub.worldpaySchemeReference
      });
      if (selection.token) {
        patched.set(id, {
          tokenHref: selection.token.href,
          schemeReference: sub.worldpaySchemeReference || selection.token.schemeTransactionReference
        });
        changed = true;
        results.push({ id, reference, status: "recovered", detail: `tokens service \u2014 ${selection.reason}` });
        console.log(
          `[Worldpay Token Sweep] Recovered the stored card for subscription ${id} from the tokens service (${selection.reason}).`
        );
        continue;
      }
      if (selection.ambiguous) {
        const attempts = Number(sub.tokenLookupAttempts || 0) + 1;
        attempted.set(id, attempts);
        changed = true;
        results.push({ id, reference, status: "ambiguous", detail: selection.reason });
        console.warn(`[Worldpay Token Sweep] Subscription ${id} NOT assigned a card: ${selection.reason}`);
        continue;
      }
    }
    if (!reference) {
      results.push({ id, reference: "", status: "skipped", detail: "no payment reference to query" });
      continue;
    }
    const payment = await fetchWorldpayPaymentDetails(reference);
    if (!payment) {
      results.push({ id, reference, status: "not-found" });
      continue;
    }
    const tokenHref = extractTokenHref(payment);
    if (!tokenHref) {
      const attempts = Number(sub.tokenLookupAttempts || 0) + 1;
      attempted.set(id, attempts);
      changed = true;
      results.push({
        id,
        reference,
        status: "no-token",
        detail: `no stored card found by namespace or payment (attempt ${attempts}/${TOKEN_SWEEP_MAX_ATTEMPTS})`
      });
      if (attempts >= TOKEN_SWEEP_MAX_ATTEMPTS) {
        console.warn(
          `[Worldpay Token Sweep] Subscription ${id} (payment ${reference}) still has no stored card after ${attempts} lookups, by namespace and by payment. It cannot renew \u2014 the customer has to subscribe again.`
        );
      }
      continue;
    }
    patched.set(id, { tokenHref, schemeReference: extractSchemeReference(payment) });
    changed = true;
    results.push({ id, reference, status: "recovered", detail: "payment query" });
    console.log(`[Worldpay Token Sweep] Recovered the stored card for subscription ${id} from payment ${reference}.`);
  }
  if (!changed) return results;
  try {
    const next = subs.map((sub) => {
      const id = String(sub?.id);
      const attempts = attempted.get(id);
      if (attempts !== void 0) {
        return {
          ...sub,
          tokenLookupAttempts: attempts,
          tokenLookupLastAt: (/* @__PURE__ */ new Date()).toISOString(),
          ...attempts >= TOKEN_SWEEP_MAX_ATTEMPTS ? { tokenLookupExhaustedAt: (/* @__PURE__ */ new Date()).toISOString() } : {}
        };
      }
      const found = patched.get(id);
      if (!found) return sub;
      return {
        ...sub,
        worldpayTokenHref: found.tokenHref,
        worldpaySchemeReference: sub.worldpaySchemeReference || found.schemeReference || null,
        tokenRecordedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    });
    await saveResource("subscriptions", next);
  } catch (err) {
    console.error("[Worldpay Token Sweep] Failed to save recovered tokens:", err?.message);
    return results;
  }
  for (const [id, found] of patched) {
    await prisma.subscription.update({ where: { id }, data: { worldpayTokenHref: found.tokenHref } }).catch(() => {
    });
  }
  return results;
}
router13.get("/reconcile-pending", requireCronOrAdmin, handleReconcilePending);
router13.post("/reconcile-pending", requireCronOrAdmin, handleReconcilePending);
var SUBSCRIPTION_REPAIR_LIMIT = 10;
async function billableSubscriptionsFor(orderId) {
  if (!await getDb()) {
    const stored = await fetchResource("subscriptions") || [];
    return stored.filter((s) => String(s?.sourceOrderId || "") === orderId).map((s) => ({
      id: String(s.id),
      status: String(s.status || ""),
      createdAt: String(s.createdAt || ""),
      billingInterval: s.billingInterval || null,
      nextBillingDate: s.nextBillingDate ? new Date(s.nextBillingDate).toISOString() : null,
      scheme: s.worldpaySchemeReference || null,
      hasCard: isUsableTokenHref(s.worldpayTokenHref)
    }));
  }
  const rows = await prisma.subscription.findMany({
    where: { sourceOrderId: orderId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      billingInterval: true,
      nextBillingDate: true,
      worldpaySchemeReference: true,
      worldpayTokenHref: true
    },
    orderBy: { createdAt: "asc" }
  });
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    billingInterval: r.billingInterval || null,
    nextBillingDate: r.nextBillingDate ? r.nextBillingDate.toISOString() : null,
    scheme: r.worldpaySchemeReference || null,
    hasCard: isUsableTokenHref(r.worldpayTokenHref)
  }));
}
async function repairOrdersMissingSubscriptions(limit = SUBSCRIPTION_REPAIR_LIMIT, options = {}) {
  const dryRun = Boolean(options.dryRun);
  const requested = (options.orderIds || []).map((id) => String(id).trim()).filter(Boolean);
  const results = [];
  let orders = [];
  let subs = [];
  try {
    orders = await fetchResource("orders") || [];
    subs = await fetchResource("subscriptions") || [];
  } catch (err) {
    console.warn("[Worldpay Subscription Repair] Could not read orders/subscriptions:", err?.message);
    return results;
  }
  const visibleByOrder = new Set(subs.map((s) => String(s?.sourceOrderId || "")).filter(Boolean));
  const isSubscriptionOrder2 = (order) => {
    if (order?.isSubscription) return true;
    if (Array.isArray(order?.tags) && order.tags.some((t) => /subscription/i.test(String(t)))) return true;
    if (order?.subscriptionDetails) return true;
    return (Array.isArray(order?.items) ? order.items : []).some(isSubscriptionLine);
  };
  const isRenewalOrder = (order) => Array.isArray(order?.tags) && order.tags.some((t) => /recurring/i.test(String(t)));
  const isCancelledSubscriptionOrder = (order) => {
    if (Array.isArray(order?.tags) && order.tags.some((t) => /cancel/i.test(String(t)))) return true;
    const status = String(order?.subscriptionDetails?.paymentStatus || order?.subscriptionDetails?.status || "");
    return /cancel/i.test(status);
  };
  const candidates = requested.length ? requested.map((id) => orders.find((o) => String(o?.id) === id) || { id, __missing: true }) : orders.filter(
    (o) => o && String(o.paymentStatus || "") === "Paid" && isSubscriptionOrder2(o) && !isRenewalOrder(o) && !isCancelledSubscriptionOrder(o) && !visibleByOrder.has(String(o.id))
  );
  if (candidates.length === 0) return results;
  console.log(
    `[Worldpay Subscription Repair] ${dryRun ? "DRY RUN \u2014 " : ""}examining ${Math.min(candidates.length, limit)} order(s): ${candidates.slice(0, limit).map((o) => o.id).join(", ")}`
  );
  for (const order of candidates.slice(0, limit)) {
    const orderId = String(order.id);
    if (order.__missing) {
      results.push({ orderId, status: "order-not-found" });
      continue;
    }
    if (isCancelledSubscriptionOrder(order)) {
      results.push({
        orderId,
        status: "skipped-cancelled",
        detail: "This order's subscription was cancelled. Having no subscription is the correct state for it, so nothing was created \u2014 recreating one would resurrect a cancelled plan and bill the customer."
      });
      continue;
    }
    let billable = [];
    try {
      billable = await billableSubscriptionsFor(orderId);
    } catch (err) {
      results.push({ orderId, status: "error", detail: `could not read the Subscription table: ${err?.message}` });
      continue;
    }
    if (billable.length > 1) {
      results.push({
        orderId,
        status: "DUPLICATES",
        detail: `${billable.length} subscriptions exist for this one order, and the renewal cron bills every active one. Cancel all but one before the earliest nextBillingDate. Nothing was changed.`,
        billableRows: billable
      });
      console.error(
        `[Worldpay Subscription Repair] ${orderId} has ${billable.length} subscriptions: ` + billable.map((b) => `${b.id} (${b.status}, next ${b.nextBillingDate})`).join(", ")
      );
      continue;
    }
    if (billable.length === 1) {
      const detail = visibleByOrder.has(orderId) ? "subscription exists and is visible" : "subscription EXISTS but was invisible to lookups by order (its StoreResource copy had lost sourceOrderId)";
      if (!dryRun && !visibleByOrder.has(orderId)) {
        try {
          const fresh = await fetchResource("subscriptions") || [];
          await saveResource("subscriptions", fresh);
        } catch (err) {
          results.push({ orderId, status: "error", detail: `found but could not heal: ${err?.message}`, billableRows: billable });
          continue;
        }
      }
      results.push({
        orderId,
        status: visibleByOrder.has(orderId) ? "ok" : dryRun ? "exists-invisible" : "healed",
        detail,
        billableRows: billable
      });
      continue;
    }
    const orderItems = Array.isArray(order.items) ? order.items : [];
    let rebuildItems = orderItems;
    if (!orderItems.some(isSubscriptionLine)) {
      const d = order.subscriptionDetails;
      if (!d?.planName) {
        results.push({
          orderId,
          status: "failed",
          detail: "no subscription line and no plan details to rebuild from. items=" + JSON.stringify(
            orderItems.map((i) => ({ productId: i?.productId, vendor: i?.vendor, isSubscription: i?.isSubscription }))
          ).slice(0, 600)
        });
        continue;
      }
      const shipping = Number(order.shippingCost ?? order.deliveryCost ?? 0) || 0;
      rebuildItems = [
        {
          productId: `sub-pack-recovered-${orderId}`,
          sku: `sub-pack-recovered-${orderId}`,
          productTitle: d.planName,
          subscriptionPlan: d.planName,
          subscriptionFrequency: d.frequency || "month",
          frequencyDiscount: d.frequencyDiscount || void 0,
          subscriptionItems: Array.isArray(d.items) && d.items.length ? d.items : d.selectedProducts || [],
          vendor: "Subscription Pack",
          isSubscription: true,
          price: Math.max(Number(order.total || 0) - shipping, 0),
          quantity: 1
        },
        ...orderItems
      ];
    }
    if (dryRun) {
      results.push({
        orderId,
        status: "would-create",
        detail: `no subscription exists in any store; a repair would create one from ${rebuildItems === orderItems ? "the order items" : "subscriptionDetails"}`,
        billableRows: []
      });
      continue;
    }
    try {
      const payment = await fetchWorldpayPaymentDetails(orderId);
      await saveVerifiedOrder(orderId, {
        transactionId: String(order.worldpayTxId || order.gatewayTxId || orderId),
        authCode: order.worldpayAuthCode || order.gatewayAuthCode || void 0,
        cardBrand: order.cardBrand || void 0,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        destination: order.destination,
        items: rebuildItems,
        total: typeof order.total === "number" ? order.total : void 0,
        shippingCost: typeof order.shippingCost === "number" ? order.shippingCost : void 0,
        deliveryCost: typeof order.deliveryCost === "number" ? order.deliveryCost : void 0,
        deliveryMethod: order.deliveryMethod,
        discountApplied: order.discountApplied,
        gatewayResponse: payment,
        paymentConfirmed: true
      });
      const after = await billableSubscriptionsFor(orderId);
      if (after.length === 1) {
        results.push({ orderId, status: "repaired", detail: `subscription ${after[0].id}`, billableRows: after });
      } else if (after.length > 1) {
        results.push({ orderId, status: "DUPLICATES", detail: "repair produced more than one subscription", billableRows: after });
      } else {
        results.push({
          orderId,
          status: "failed",
          detail: "saveVerifiedOrder ran but no Subscription row exists \u2014 see [SUBSCRIPTION CREATION FAILED] / [SUBSCRIPTION NOT PERSISTED] in the logs for this invocation"
        });
      }
    } catch (err) {
      results.push({ orderId, status: "error", detail: err?.message });
    }
  }
  return results;
}
var handleRepairSubscriptions = async (req, res) => {
  try {
    const flag = (v) => ["1", "true", "yes"].includes(String(v ?? "").toLowerCase());
    const dryRun = flag(req.query?.dryRun) || flag(req.body?.dryRun);
    const rawOrders = String(req.query?.orders ?? req.body?.orders ?? "");
    const orderIds = rawOrders.split(",").map((s) => s.trim()).filter(Boolean);
    const results = await repairOrdersMissingSubscriptions(SUBSCRIPTION_REPAIR_LIMIT, { dryRun, orderIds });
    const count = (status) => results.filter((r) => r.status === status).length;
    return res.json({
      success: true,
      dryRun,
      message: `${dryRun ? "DRY RUN, nothing written. " : ""}Examined ${results.length} order(s): ${count("repaired")} repaired, ${count("healed")} healed, ${count("exists-invisible")} exist but invisible, ${count("would-create")} would be created, ${count("DUPLICATES")} with DUPLICATES, ${count("failed") + count("error")} failed.`,
      results
    });
  } catch (err) {
    console.error("[Worldpay Subscription Repair] Failed:", err);
    return res.status(500).json({ success: false, error: err?.message });
  }
};
router13.post("/repair-subscriptions", requireAdmin, handleRepairSubscriptions);
var handleRecoverTokens = async (_req, res) => {
  try {
    const results = await recoverMissingSubscriptionTokens();
    const recovered = results.filter((r) => r.status === "recovered").length;
    return res.json({
      success: true,
      message: `Checked ${results.length} subscription(s) with no stored card; ${recovered} recovered.`,
      results
    });
  } catch (err) {
    console.error("[Worldpay Token Sweep] Failed:", err);
    return res.status(500).json({ success: false, error: err?.message });
  }
};
router13.get("/recover-tokens", requireAdmin, handleRecoverTokens);
router13.post("/recover-tokens", requireAdmin, handleRecoverTokens);
router13.get("/config", (_req, res) => {
  const cfg = getEnvironmentConfig();
  res.json({
    active: true,
    isConfigured: Boolean(cfg.entity && cfg.authHeader),
    platform: "Worldpay Access API",
    environment: cfg.environment,
    isTestMode: cfg.isTestMode,
    baseUrl: cfg.baseUrl,
    entityMasked: cfg.entity ? `${cfg.entity.substring(0, 4)}***` : "Not Configured",
    checkoutIdMasked: cfg.checkoutId ? `${cfg.checkoutId.substring(0, 6)}***` : "Not Configured",
    hasBasicAuth: Boolean(cfg.username && cfg.password),
    provider: `Worldpay Access (${cfg.environment.toUpperCase()})`
  });
});
async function handleCreateHostedPaymentPage(req, res) {
  try {
    const {
      orderId,
      amount,
      total: reqTotal,
      subtotal: reqSubtotal,
      shippingCost: reqShippingCost,
      deliveryCost: reqDeliveryCost,
      deliveryMethod: reqDeliveryMethod,
      customerName,
      customerEmail,
      destination,
      shippingAddress,
      address,
      items,
      recurring,
      discountApplied,
      discountAmount: reqDiscountAmount,
      storeCreditApplied,
      origin: bodyOrigin
    } = req.body;
    const deliverable = assertDeliverable(req.body);
    if (!deliverable.ok) {
      return res.status(400).json({ success: false, message: deliverable.message });
    }
    if (discountApplied) {
      const usable = await checkDiscountUsable(customerEmail, discountApplied, orderId);
      if (!usable.ok) {
        console.warn(
          `[Worldpay Session] Refused order ${orderId} for ${customerEmail}: discount already used on ${usable.priorOrderId}.`
        );
        return res.status(400).json({ success: false, message: usable.message });
      }
    }
    const cfg = getEnvironmentConfig();
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost:3000";
    const origin = bodyOrigin || `${protocol}://${host}`;
    const rawRef = orderId || `PS${Math.floor(Math.random() * 9e4 + 1e4)}`;
    const transactionReference = String(rawRef);
    let priceNum = 2500;
    if (typeof amount === "number") {
      priceNum = Math.round(amount * 100);
    } else if (typeof amount === "string" && !isNaN(parseFloat(amount))) {
      priceNum = Math.round(parseFloat(amount) * 100);
    } else if (typeof reqTotal === "number") {
      priceNum = Math.round(reqTotal * 100);
    }
    const effectiveTotal = typeof amount === "number" ? amount : typeof reqTotal === "number" ? reqTotal : parseFloat(amount) || 0;
    const effectiveShippingCost = typeof reqShippingCost === "number" ? reqShippingCost : typeof reqDeliveryCost === "number" ? reqDeliveryCost : resolveDeliveryCost(effectiveTotal, discountApplied);
    const pendingPayload = {
      orderId: transactionReference,
      customerName: customerName || "Valued Customer",
      customerEmail: (customerEmail || "customer@pouch-supply.com").toLowerCase().trim(),
      destination: destination || address || "United Kingdom",
      // Kept as separate fields so the shipping label can be produced without
      // having to take the joined string apart again.
      shippingAddress: shippingAddress && typeof shippingAddress === "object" ? { ...shippingAddress, phone: deliverable.phone, postcode: deliverable.postcode, country: UK_COUNTRY_NAME, countryCode: UK_COUNTRY_CODE } : void 0,
      customerPhone: deliverable.phone,
      items: Array.isArray(items) ? items.map((it) => {
        let planName = it.subscriptionPlan || "";
        const rawPlan = (it.subscriptionPlan || "").toLowerCase();
        const title = (it.productTitle || it.title || "").toLowerCase();
        const prodId = (it.productId || it.id || "").toLowerCase();
        if (!planName) {
          if (rawPlan.includes("ultimate") || title.startsWith("ultimate") || title.includes("ultimate plan") || prodId.includes("ultimate")) {
            planName = "ULTIMATE Plan";
          } else if (rawPlan.includes("pro") || title.startsWith("pro") || title.includes("pro plan") || prodId.includes("pro")) {
            planName = "PRO Plan";
          } else if (rawPlan.includes("core") || title.startsWith("core") || title.includes("core plan") || prodId.includes("core")) {
            planName = "CORE Plan";
          } else if (rawPlan.includes("lite") || title.startsWith("lite") || title.includes("lite plan") || prodId.includes("lite")) {
            planName = "LITE Plan";
          }
        }
        return {
          productId: it.productId || it.id || "prod",
          // The title the storefront sent is kept verbatim. A stand-in name here
          // would follow the item all the way into the order detail view.
          productTitle: it.productTitle || it.title || "",
          price: typeof it.price === "number" ? it.price : parseFloat(it.price) || 0,
          quantity: typeof it.quantity === "number" ? it.quantity : parseInt(it.quantity) || 1,
          image: it.image || "",
          variant: it.variant || it.concreteVariantName || it.strength || it.flavour || "",
          sku: it.sku || it.concreteVariantId || it.productId || "",
          vendor: it.vendor || "",
          isSubscription: Boolean(it.isSubscription || it.productId && (it.productId.startsWith("sub-pack") || it.productId.includes("sub-pack"))),
          subscriptionPlan: planName || it.subscriptionPlan || "PRO Plan",
          subscriptionFrequency: it.subscriptionFrequency || "Bi-Weekly",
          frequencyDiscount: it.frequencyDiscount || "10%",
          subscriptionItems: it.subscriptionItems || it.selectedProducts || it.items || []
        };
      }) : [],
      total: effectiveTotal,
      subtotal: typeof reqSubtotal === "number" ? reqSubtotal : effectiveTotal > effectiveShippingCost ? Number((effectiveTotal - effectiveShippingCost).toFixed(2)) : effectiveTotal,
      shippingCost: effectiveShippingCost,
      deliveryCost: effectiveShippingCost,
      deliveryMethod: reqDeliveryMethod || "Royal Mail Tracked 24/48",
      discountApplied: discountApplied || null,
      discountAmount: typeof reqDiscountAmount === "number" ? reqDiscountAmount : void 0,
      storeCreditApplied: storeCreditApplied || 0,
      isTestMode: false,
      createdAt: Date.now()
    };
    await savePendingCheckout(transactionReference, pendingPayload);
    if (!cfg.authHeader || !cfg.entity) {
      return res.status(400).json({
        success: false,
        message: "Worldpay Access API credentials are not configured in environment variables (WORLDPAY_ENTITY, WORLDPAY_API_USERNAME, WORLDPAY_API_PASSWORD).",
        error: "Worldpay credentials missing."
      });
    }
    const successReturnUrl = `${origin}/api/worldpay/callback?orderId=${encodeURIComponent(transactionReference)}&status=SUCCESS`;
    const pendingReturnUrl = `${origin}/api/worldpay/callback?orderId=${encodeURIComponent(transactionReference)}&status=PENDING`;
    const failureReturnUrl = `${origin}/api/worldpay/callback?orderId=${encodeURIComponent(transactionReference)}&status=FAILED`;
    const cancelReturnUrl = `${origin}/payment/cancelled?orderId=${encodeURIComponent(transactionReference)}`;
    const expiryReturnUrl = `${origin}/payment/failed?orderId=${encodeURIComponent(transactionReference)}&reason=expired`;
    const rawLabel = items && items[0]?.productTitle || "Pouch Supply Order";
    let cleanNarrative = String(rawLabel).replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
    if (!cleanNarrative || cleanNarrative.length === 0) {
      cleanNarrative = "Pouch Supply Order";
    }
    const cleanDescription = String(rawLabel || "Pouch Supply").replace(/[^a-zA-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40) || "Pouch Supply Order";
    const cleanBillingName = String(customerName || "Scott Kivlin").replace(/[^a-zA-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40) || "Scott Kivlin";
    const body = {
      transactionReference,
      merchant: {
        entity: cfg.entity
      },
      narrative: { line1: cleanNarrative },
      value: { currency: "GBP", amount: priceNum },
      description: cleanDescription,
      billingAddressName: cleanBillingName,
      resultURLs: {
        successURL: successReturnUrl,
        pendingURL: pendingReturnUrl,
        failureURL: failureReturnUrl,
        errorURL: failureReturnUrl,
        cancelURL: cancelReturnUrl,
        expiryURL: expiryReturnUrl
      }
    };
    const isSubscriptionCheckout = Boolean(
      recurring || Array.isArray(items) && items.some(
        (it) => it?.isSubscription || typeof it?.productId === "string" && it.productId.includes("sub-pack")
      )
    );
    if (isSubscriptionCheckout) {
      body.customerAgreement = {
        type: "subscription",
        storedCardUsage: "first"
      };
      body.createToken = {
        type: "worldpay",
        // Groups the shopper's stored cards. Their email keeps renewals for one
        // person together without exposing anything Worldpay does not already hold.
        namespace: String(customerEmail || transactionReference).toLowerCase().slice(0, 64),
        description: "Pouch Supply subscription",
        // Consent for the stored card is taken in our own checkout terms, so the
        // shopper is not asked a second time on Worldpay's page. `Silent` has to
        // be enabled on the account — set WORLDPAY_TOKEN_OPT_IN=ASK if Worldpay
        // rejects it, rather than losing the token and the renewal with it.
        optIn: tokenOptIn()
      };
    }
    const correlationId = crypto6.randomUUID ? crypto6.randomUUID() : `hpp-${Math.random().toString(36).slice(2, 12)}`;
    const userAgent = req.headers["user-agent"] || "worldpay-hpp/1.0";
    const worldpayUrl = `${cfg.baseUrl}/payment_pages`;
    console.log(`[Worldpay HPP ${cfg.environment.toUpperCase()}] POST ${worldpayUrl} for Order: ${transactionReference}`);
    const authHeader = cfg.authHeader;
    let lastAttemptedBody = null;
    const postPaymentPage = async (payload) => {
      lastAttemptedBody = payload;
      const res2 = await fetch(worldpayUrl, {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/vnd.worldpay.payment_pages-v1.hal+json",
          "Accept": "application/vnd.worldpay.payment_pages-v1.hal+json",
          "WP-CorrelationId": correlationId,
          "User-Agent": userAgent
        },
        body: JSON.stringify(payload)
      });
      const parsed = await res2.json().catch(() => ({ message: "Invalid response from Worldpay." }));
      return { res: res2, parsed };
    };
    let { res: response, parsed: responseBody } = await postPaymentPage(body);
    if (!response.ok && isSubscriptionCheckout) {
      const describe2 = (parsedBody) => String(parsedBody?.description || parsedBody?.message || parsedBody?.errorName || "");
      const askBody = {
        ...body,
        createToken: { ...body.createToken, optIn: "ASK" }
      };
      if (tokenOptIn() !== "ASK") {
        console.warn(
          `[Worldpay HPP] Mandate request rejected for ${transactionReference} (${response.status}): ${describe2(responseBody)}. Retrying with optIn "ASK" before giving up the stored card.`
        );
        ({ res: response, parsed: responseBody } = await postPaymentPage(askBody));
        if (response.ok) {
          console.warn(
            `[Worldpay HPP] ${transactionReference} was accepted with optIn "ASK". "Silent" is not enabled on entity ${cfg.entity} \u2014 set WORLDPAY_TOKEN_OPT_IN=ASK so every future subscription is tokenised on the first attempt.`
          );
        }
      }
      if (!response.ok) {
        console.error(
          `[Worldpay HPP] Subscription mandate rejected for ${transactionReference} (${response.status}): ${describe2(responseBody)}. Retrying as a one-off payment \u2014 this subscription will NOT be able to take recurring payments until customer agreements / tokenisation are enabled on entity ${cfg.entity}.`
        );
        const fallbackBody = { ...body };
        delete fallbackBody.customerAgreement;
        delete fallbackBody.createToken;
        ({ res: response, parsed: responseBody } = await postPaymentPage(fallbackBody));
        if (response.ok) {
          await savePendingCheckout(transactionReference, {
            ...pendingPayload,
            tokenisationDowngraded: true
          });
        }
      }
    }
    if (isSubscriptionCheckout) {
      const acceptedBody = response.ok ? lastAttemptedBody : null;
      console.log(
        `[Worldpay HPP] TOKENISATION REQUEST for ${transactionReference}: ` + (acceptedBody?.createToken ? JSON.stringify(acceptedBody.createToken) : "NONE \u2014 the accepted request carried no createToken")
      );
      console.log(
        `[Worldpay HPP] TOKENISATION AGREEMENT for ${transactionReference}: ` + (acceptedBody?.customerAgreement ? JSON.stringify(acceptedBody.customerAgreement) : "NONE \u2014 the accepted request carried no customerAgreement")
      );
      console.log(
        `[Worldpay HPP] WORLDPAY RESPONSE for ${transactionReference} (HTTP ${response.status}): ` + JSON.stringify(responseBody).slice(0, 4e3)
      );
      const echo = JSON.stringify(responseBody || {});
      console.log(
        `[Worldpay HPP] Does the response mention a token at all? ` + (/token/i.test(echo) ? "YES \u2014 see the body above" : "NO")
      );
    }
    if (!response.ok) {
      const errMsg = responseBody?.description || responseBody?.message || "Hosted Payment Pages creation failed.";
      return res.status(response.status).json({
        success: false,
        message: errMsg,
        error: `Worldpay Error (${response.status}): ${errMsg}`,
        details: responseBody
      });
    }
    const redirectUrl = extractWorldpayRedirectUrl(responseBody);
    if (!redirectUrl) {
      return res.status(400).json({
        success: false,
        message: "Worldpay response did not include a valid Hosted Payment Page redirect URL.",
        details: responseBody
      });
    }
    return res.status(200).json({
      success: true,
      sessionId: transactionReference,
      transactionReference,
      redirectUrl,
      checkoutId: cfg.entity,
      provider: `Worldpay Access HPP (${cfg.environment})`,
      environment: cfg.environment,
      isTestMode: cfg.isTestMode
    });
  } catch (error) {
    console.error("[Worldpay HPP] Request failed:", error);
    return res.status(502).json({
      success: false,
      message: "Unable to reach Worldpay Hosted Payment Pages service.",
      error: error.message
    });
  }
}
router13.post("/session", handleCreateHostedPaymentPage);
router13.post("/payment_pages", handleCreateHostedPaymentPage);
router13.post("/verify-payment", async (req, res) => {
  try {
    const {
      orderId,
      status,
      transactionId,
      txId,
      authCode,
      cardBrand,
      customerName,
      customerEmail,
      destination,
      items,
      total
    } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }
    const statusUpper = String(status || "SUCCESS").toUpperCase();
    if (statusUpper !== "SUCCESS" && statusUpper !== "AUTHORIZED" && statusUpper !== "PAID") {
      pendingCheckoutsMap.delete(orderId);
      return res.status(400).json({
        success: false,
        message: "Payment was not successful. No order was created in the database."
      });
    }
    let pending = await getPendingCheckout(orderId);
    if (!pending) {
      pending = {
        orderId,
        customerName: customerName || "Valued Customer",
        customerEmail: (customerEmail || "customer@pouch-supply.com").toLowerCase().trim(),
        destination: destination || "United Kingdom",
        items: Array.isArray(items) ? items : [],
        total: typeof total === "number" ? total : parseFloat(total) || 0,
        discountApplied: req.body.discountApplied || null,
        storeCreditApplied: req.body.storeCreditApplied || 0,
        // From the server's own Worldpay environment, never the request body
        // and never a default of `true`. This is a rebuilt pending record for a
        // payment that has already happened, and the flag decides whether the
        // order is tagged "Worldpay Test Order" — so on a live account a real
        // sale was being labelled as a test whenever the original pending
        // record had been lost.
        isTestMode: getEnvironmentConfig().isTestMode,
        createdAt: Date.now()
      };
    }
    const gatewayResponse = req.body.worldpayResponse || await fetchWorldpayPaymentDetails(orderId);
    const effectiveTxId = transactionId || txId || gatewayResponse?.id || `WP-${Date.now().toString().slice(-6)}`;
    const effectiveAuthCode = authCode || gatewayResponse?.authorizationCode || "AUTH-SUCCESS-OK";
    const savedOrder = await saveVerifiedOrder(orderId, {
      transactionId: effectiveTxId,
      authCode: effectiveAuthCode,
      cardBrand: cardBrand || gatewayResponse?.paymentInstrument?.card?.brand || "Worldpay Card",
      gatewayResponse,
      customerName,
      customerEmail,
      destination,
      items,
      total,
      discountApplied: req.body.discountApplied,
      storeCreditApplied: req.body.storeCreditApplied,
      pendingData: pending
    });
    console.log(`[Worldpay Payment Verified] Order #${orderId} saved as Paid with Tx ID: ${effectiveTxId}`);
    return res.json({
      success: true,
      orderId,
      transactionId: effectiveTxId,
      authCode: effectiveAuthCode,
      paymentStatus: "Paid",
      order: savedOrder,
      redirectUrl: `/payment/success?orderId=${encodeURIComponent(orderId)}&txId=${encodeURIComponent(effectiveTxId)}`
    });
  } catch (error) {
    console.error("[Worldpay Verify Payment Error]:", error);
    return res.status(500).json({ success: false, message: error.message || "Server-side payment verification failed" });
  }
});
var handleWorldpayCallback = async (req, res) => {
  const params = req.method === "POST" ? req.body : req.query;
  const orderId = params.orderId || params.transactionReference;
  const status = (params.status || "").toUpperCase();
  console.log(`[Worldpay Callback] Order: ${orderId}, Status: ${status}`);
  if (!orderId) {
    return res.redirect("/payment/failed?reason=missing_order");
  }
  if (status === "FAILED" || status === "CANCELLED" || status === "ERROR") {
    pendingCheckoutsMap.delete(orderId);
    return res.redirect(`/payment/failed?orderId=${encodeURIComponent(orderId)}&reason=payment_declined`);
  }
  if (status === "SUCCESS" || status === "PENDING" || status === "AUTHORIZED") {
    const gatewayResponse = await fetchWorldpayPaymentDetails(orderId);
    const outcome = paymentOutcome(gatewayResponse);
    if (outcome === "failed") {
      console.warn(
        `[Worldpay Callback] Worldpay reports the payment for ${orderId} as ${gatewayResponse?.lastEvent || gatewayResponse?.outcome}. No order created.`
      );
      pendingCheckoutsMap.delete(orderId);
      return res.redirect(`/payment/failed?orderId=${encodeURIComponent(orderId)}&reason=payment_declined`);
    }
    const txId = params.txId || params.transactionId || gatewayResponse?.id || `WP-CB-${Date.now().toString().slice(-6)}`;
    const authCode = params.authCode || gatewayResponse?.authorizationCode || "CALLBACK-OK";
    try {
      await saveVerifiedOrder(orderId, {
        transactionId: txId,
        authCode,
        cardBrand: gatewayResponse?.paymentInstrument?.card?.brand || "Worldpay Card",
        gatewayResponse,
        // Only Worldpay's own answer marks an order Paid. When it has not
        // published the payment yet the order is saved as Pending, and the
        // webhook — or the status poll the checkout page runs for 90 seconds —
        // completes it once the authorisation appears.
        paymentConfirmed: outcome === "authorised"
      });
      console.log(
        outcome === "authorised" ? `[Worldpay Callback] Order ${orderId} confirmed by Worldpay and saved as Paid.` : `[Worldpay Callback] Order ${orderId} saved as Pending \u2014 Worldpay has not published an authorised payment yet.`
      );
    } catch (error) {
      console.error("[Worldpay Callback] Error saving order on callback:", error);
    }
    return res.redirect(`/payment/success?orderId=${encodeURIComponent(orderId)}&txId=${encodeURIComponent(txId)}`);
  }
  return res.redirect(`/payment/failed?orderId=${encodeURIComponent(orderId)}&reason=unknown_status`);
};
router13.get("/callback", handleWorldpayCallback);
router13.post("/callback", handleWorldpayCallback);
var WEBHOOK_PAID_EVENTS = /* @__PURE__ */ new Set([
  "authorized",
  "authorised",
  "captured",
  "settled",
  "charged",
  "sentforsettlement",
  "settlementrequestsubmitted",
  "settlementsubmitted"
]);
var WEBHOOK_FAILED_EVENTS = /* @__PURE__ */ new Set([
  "failed",
  "refused",
  "declined",
  "error",
  "expired",
  "cancelled",
  "canceled",
  "sentforrefund"
]);
function normalizeWorldpayWebhook(event) {
  const details = event?.eventDetails || {};
  const attributes = event?.data?.attributes || {};
  const eventType = String(details.type || event?.eventType || event?.type || "").trim();
  const status = String(attributes.status || details.lastEvent || eventType || "").toLowerCase().replace(/[\s_-]/g, "");
  const orderId = attributes?.metadata?.orderId || attributes?.reference || details.transactionReference || event?.transactionReference || null;
  return {
    eventType,
    status,
    orderId: orderId ? String(orderId) : null,
    transactionId: attributes.transactionId || details.paymentId || details.transactionId || event?.data?.id || event?.eventId || null,
    authCode: attributes.authCode || details.authorizationCode || null,
    cardBrand: attributes?.paymentMethod?.card?.brand || details?.paymentInstrument?.card?.brand || null,
    namespace: details.namespace || details.tokenNamespace || attributes?.namespace || null,
    eventId: event?.eventId || event?.data?.id || null,
    // The raw half of the payload that carries the stored-credential references.
    payload: Object.keys(details).length > 0 ? details : attributes
  };
}
var WEBHOOK_LOG_RESOURCE = "worldpayWebhookLog";
var WEBHOOK_LOG_KEEP = 50;
var WEBHOOK_LOG_BODY_LIMIT = 4e3;
async function recordWebhookReceipt(entry) {
  try {
    const existing = await fetchResource(WEBHOOK_LOG_RESOURCE) || [];
    existing.push({
      id: `hook_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
      ...entry,
      rawBody: entry.rawBody.slice(0, WEBHOOK_LOG_BODY_LIMIT)
    });
    await saveResource(WEBHOOK_LOG_RESOURCE, existing.slice(-WEBHOOK_LOG_KEEP));
    lastReceiptWriteError = null;
  } catch (err) {
    lastReceiptWriteError = `${(/* @__PURE__ */ new Date()).toISOString()}: ${err?.message || String(err)}`;
    console.warn("[Worldpay Webhook] Could not record the receipt:", err?.message);
  }
}
var handlerInvocations = 0;
var lastHandlerRanAt = null;
var lastReceiptWriteError = null;
var lastContentType = null;
var WEBHOOK_BUILD_MARKER = "webhook-vendor-json-parse-2026-09-16";
router13.get("/webhook", async (_req, res) => {
  let heldTokens = 0;
  try {
    heldTokens = (await fetchResource(PENDING_TOKENS_RESOURCE) || []).length;
  } catch (_e) {
  }
  let received = [];
  try {
    received = (await fetchResource(WEBHOOK_LOG_RESOURCE) || []).slice().reverse();
  } catch (_e) {
  }
  const tokenEvents = received.filter((r) => r?.tokenFound || /token/i.test(String(r?.eventType || "")));
  return res.status(200).json({
    ok: true,
    endpoint: "/api/worldpay/webhook",
    method: "POST",
    message: "Worldpay webhook endpoint is live. The URL being registered and Active is not sufficient \u2014 tokenCreated must also be among the SUBSCRIBED EVENTS for that registration, which the webhook list does not show. Open the registration itself to confirm the event selection.",
    heldTokensAwaitingSubscription: heldTokens,
    // Which build is answering. Compare against the deployed commit before
    // trusting anything below: a test run against a stale bundle proves nothing.
    build: WEBHOOK_BUILD_MARKER,
    // Handler-ran evidence, independent of the persisted log above. Non-zero
    // with webhooksReceivedTotal 0 means Worldpay IS calling and the receipt
    // write is failing — a storage bug, not a delivery problem. Zero proves
    // nothing on its own: this GET may hit a different serverless instance.
    handlerInvocationsThisInstance: handlerInvocations,
    lastHandlerRanAtThisInstance: lastHandlerRanAt,
    lastReceiptWriteError,
    lastContentTypeThisInstance: lastContentType,
    // The answer to "is Worldpay actually calling us?". A total of 0 means no
    // webhook of ANY kind has reached this endpoint, which is a Worldpay-side
    // registration problem and not something this code can fix.
    webhooksReceivedTotal: received.length,
    tokenEventsReceived: tokenEvents.length,
    lastReceivedAt: received[0]?.receivedAt || null,
    recentEvents: received.slice(0, 20).map((r) => ({
      receivedAt: r.receivedAt,
      eventType: r.eventType,
      status: r.status,
      orderId: r.orderId,
      tokenFound: r.tokenFound,
      action: r.action,
      contentType: r.contentType || null
    })),
    // Kept in full so an unrecognised payload shape can be matched against
    // extractTokenHref rather than guessed at.
    lastRawBodies: received.slice(0, 3).map((r) => r.rawBody)
  });
});
router13.post("/webhook", async (req, res) => {
  const contentType = String(req.headers["content-type"] || "none");
  if ((!req.body || typeof req.body === "object" && Object.keys(req.body).length === 0) && req.rawBody) {
    try {
      const recovered = JSON.parse(Buffer.from(req.rawBody).toString("utf8"));
      if (recovered && typeof recovered === "object") {
        req.body = recovered;
        console.warn(
          `[Worldpay Webhook] Body was not parsed by the media type "${contentType}" \u2014 recovered from raw bytes.`
        );
      }
    } catch (_e) {
    }
  }
  const rawBody = (() => {
    try {
      return JSON.stringify(req.body);
    } catch {
      return String(req.body);
    }
  })();
  handlerInvocations += 1;
  lastHandlerRanAt = (/* @__PURE__ */ new Date()).toISOString();
  lastContentType = contentType;
  console.log(
    `[Worldpay Webhook] <<< POST RECEIVED (${rawBody.length} bytes) >>> ` + rawBody.slice(0, 4e3)
  );
  const finish = async (httpStatus, payload, summary) => {
    console.log(
      `[Worldpay Webhook] --> ${summary.action} (type=${summary.evt?.eventType || "unknown"} status=${summary.evt?.status || "n/a"} order=${summary.evt?.orderId || "n/a"} token=${summary.tokenFound ? "YES" : "no"})`
    );
    await recordWebhookReceipt({
      eventType: summary.evt?.eventType || null,
      status: summary.evt?.status || null,
      orderId: summary.evt?.orderId || null,
      namespace: summary.evt?.namespace || null,
      tokenFound: Boolean(summary.tokenFound),
      action: summary.action,
      rawBody,
      contentType
    });
    return res.status(httpStatus).json(payload);
  };
  try {
    const event = req.body;
    if (!event || typeof event !== "object") {
      return finish(400, { error: "Invalid webhook payload" }, { action: "rejected: body is not an object" });
    }
    const evt = normalizeWorldpayWebhook(event);
    const tokenHref = extractTokenHref(event);
    console.log(
      `[Worldpay Webhook] Tokenisation read: tokenHref=${tokenHref || "NOT FOUND IN PAYLOAD"} (eventType=${evt.eventType || "unknown"}, namespace=${evt.namespace || "none"})`
    );
    const isPaymentEvent = WEBHOOK_PAID_EVENTS.has(evt.status) || WEBHOOK_FAILED_EVENTS.has(evt.status);
    if (tokenHref && !isPaymentEvent) {
      const recorded = await recordTokenForSubscription(tokenHref, {
        transactionReference: evt.orderId,
        namespace: evt.namespace
      });
      return finish(
        200,
        { received: true, processed: recorded, event: evt.eventType || "tokenCreated", orderId: evt.orderId },
        {
          action: recorded ? "token recorded against a subscription" : "token parked for a subscription that does not exist yet",
          evt,
          tokenFound: true
        }
      );
    }
    if (!tokenHref && isTokenEvent(event)) {
      console.error(
        `[Worldpay Webhook] A token event (${evt.eventType || "unknown type"}) arrived with no readable token href. Renewals depend on this value \u2014 raw body follows so the shape can be matched: ${JSON.stringify(event).slice(0, 4e3)}`
      );
      return finish(
        200,
        { received: true, processed: false, reason: "no token href" },
        { action: "TOKEN EVENT WITH AN UNREADABLE HREF - payload shape needs matching", evt }
      );
    }
    if (!evt.orderId) {
      console.warn(
        `[Worldpay Webhook] Ignoring an event with no transaction reference (type: ${evt.eventType || "unknown"}).`
      );
      return finish(200, { received: true, ignored: true }, { action: "ignored: no transaction reference", evt });
    }
    if (WEBHOOK_PAID_EVENTS.has(evt.status)) {
      await saveVerifiedOrder(evt.orderId, {
        transactionId: String(evt.transactionId || evt.orderId),
        authCode: evt.authCode || void 0,
        cardBrand: evt.cardBrand || void 0,
        // Carries any stored-credential reference Worldpay included in the event.
        gatewayResponse: evt.payload,
        webhookEventId: evt.eventId || void 0,
        // evt.orderId is Worldpay's transactionReference, which is a storefront
        // order id only for a checkout payment. A renewal's reference is a
        // gateway reference, and taking it for an order id is what fabricated
        // the £0 "SUB-ORD-…" order. A webhook updates orders; it never authors.
        allowCreate: false
      });
      if (tokenHref) {
        await recordTokenForSubscription(tokenHref, {
          transactionReference: evt.orderId,
          namespace: evt.namespace
        });
      }
    } else if (WEBHOOK_FAILED_EVENTS.has(evt.status)) {
      pendingCheckoutsMap.delete(evt.orderId);
    } else {
      console.log(
        `[Worldpay Webhook] No action for event "${evt.eventType || evt.status}" on ${evt.orderId}.`
      );
    }
    return finish(
      200,
      { received: true, processed: true, orderId: evt.orderId },
      { action: "payment event processed", evt, tokenFound: Boolean(tokenHref) }
    );
  } catch (error) {
    console.error("[Worldpay Webhook] Processing error:", error);
    return res.status(500).json({ received: true, processed: false, error: error.message });
  }
});
router13.get("/status", async (req, res) => {
  try {
    const orderId = req.query.orderId;
    if (!orderId) return res.status(400).json({ error: "orderId is required" });
    let foundOrder = null;
    try {
      foundOrder = await prisma.order.findUnique({ where: { id: orderId } });
    } catch (_e) {
    }
    if (!foundOrder) {
      try {
        const orders = await fetchResource("orders") || [];
        foundOrder = orders.find((o) => String(o.id) === String(orderId));
      } catch (_e) {
      }
    }
    if (foundOrder && foundOrder.paymentStatus === "Pending") {
      const gatewayResponse = await fetchWorldpayPaymentDetails(orderId);
      const outcome = paymentOutcome(gatewayResponse);
      if (outcome === "authorised") {
        console.log(`[Worldpay Status] Worldpay now confirms ${orderId}; completing the order.`);
        try {
          foundOrder = await saveVerifiedOrder(orderId, {
            transactionId: gatewayResponse?.id || foundOrder.worldpayTxId || orderId,
            authCode: gatewayResponse?.authorizationCode || foundOrder.worldpayAuthCode || "AUTH-OK",
            cardBrand: gatewayResponse?.paymentInstrument?.card?.brand || foundOrder.cardBrand,
            gatewayResponse,
            paymentConfirmed: true
          }) || foundOrder;
        } catch (completionErr) {
          console.error(`[Worldpay Status] Failed to complete ${orderId}:`, completionErr?.message);
        }
      } else if (outcome === "failed") {
        console.warn(`[Worldpay Status] Worldpay reports ${orderId} as not paid; leaving it Pending.`);
      }
    }
    if (!foundOrder || foundOrder.paymentStatus !== "Paid") {
      return res.json({
        orderId,
        paid: false,
        status: foundOrder ? foundOrder.paymentStatus : "Unpaid"
      });
    }
    return res.json({
      orderId: foundOrder.id,
      paid: true,
      status: "Paid",
      transactionId: foundOrder.worldpayTxId || foundOrder.gatewayTxId || null,
      authCode: foundOrder.worldpayAuthCode || foundOrder.gatewayAuthCode || null,
      cardBrand: foundOrder.cardBrand || null,
      updatedAt: foundOrder.updatedAt || null
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to check payment status" });
  }
});
router13.get("/order/:id", async (req, res) => {
  try {
    const orderId = req.params.id;
    let foundOrder = null;
    try {
      foundOrder = await prisma.order.findUnique({ where: { id: orderId } });
    } catch (_e) {
    }
    if (!foundOrder) {
      try {
        const orders = await fetchResource("orders") || [];
        foundOrder = orders.find((o) => String(o.id) === String(orderId));
      } catch (_e) {
      }
    }
    if (!foundOrder) {
      return res.status(404).json({ error: "Order not found" });
    }
    return res.json(foundOrder);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to fetch order" });
  }
});
router13.post("/refund", requireAdmin, async (req, res) => {
  try {
    const { orderId, amount, reason, transactionId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: "orderId is required" });
    }
    let foundOrder = null;
    try {
      foundOrder = await prisma.order.findUnique({ where: { id: orderId } });
    } catch (_e) {
    }
    if (!foundOrder) {
      try {
        const orders = await fetchResource("orders") || [];
        foundOrder = orders.find((o) => String(o.id) === String(orderId));
      } catch (_e) {
      }
    }
    if (!foundOrder) {
      return res.status(404).json({ error: "Order not found" });
    }
    const refundAmount = typeof amount === "number" ? amount : foundOrder.total || 0;
    const { refundWorldpayPayment: refundWorldpayPayment2 } = await Promise.resolve().then(() => (init_worldpayRefund(), worldpayRefund_exports));
    const refundResult = await refundWorldpayPayment2({
      order: foundOrder,
      amount: refundAmount,
      reason: reason || "Customer requested refund",
      transactionId: transactionId || foundOrder.worldpayTxId || foundOrder.gatewayTxId
    });
    const { saveSingleOrder: saveSingleOrder2 } = await Promise.resolve().then(() => (init_orders(), orders_exports));
    const updatedOrder = await saveSingleOrder2({
      ...foundOrder,
      paymentStatus: "Refunded",
      fulfillmentStatus: foundOrder.fulfillmentStatus === "Fulfilled" ? "Fulfilled" : "Cancelled",
      refundAmount,
      refundReason: reason || "Refund issued to payment card",
      refundDetails: {
        refundRef: refundResult.refundRef,
        amount: refundResult.amount,
        reason: reason || "Refund processed via Worldpay Gateway",
        gatewayContacted: refundResult.gatewayContacted,
        gatewayMessage: refundResult.message,
        refundedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
    return res.json({
      success: refundResult.success,
      refundRef: refundResult.refundRef,
      transactionId: refundResult.transactionId,
      amount: refundResult.amount,
      gatewayContacted: refundResult.gatewayContacted,
      message: refundResult.message,
      order: updatedOrder
    });
  } catch (error) {
    console.error("[Worldpay Refund] Internal Error:", error);
    return res.status(500).json({ error: error.message || "Failed to process Worldpay refund" });
  }
});
var worldpay_default = router13;

// backend/routes/subscriptions.ts
init_prisma();
init_subscriptionRow();
init_requireAdmin();
init_planCatalogue();
init_subscriptionPricingService();
init_klaviyoService();
init_serverDb();
init_worldpaySubscription();
init_subscriptionCron();
import { Router as Router12 } from "express";
import crypto7 from "crypto";
var router14 = Router12();
var handleProcessRenewals = async (_req, res) => {
  try {
    const result = await processDueSubscriptions();
    return res.json({
      success: true,
      message: `Processed ${result.processed} subscription(s): ${result.succeeded} succeeded, ${result.failed} failed.`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ...result
    });
  } catch (error) {
    console.error("[Process Renewals Error]", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to process due subscriptions"
    });
  }
};
router14.get("/process-renewals", requireCronOrAdmin, handleProcessRenewals);
router14.post("/process-renewals", requireCronOrAdmin, handleProcessRenewals);
router14.get("/cron", requireCronOrAdmin, handleProcessRenewals);
router14.post("/cron", requireCronOrAdmin, handleProcessRenewals);
function canChargeRecurring(sub) {
  if (!sub) return false;
  const href = sub.worldpayRecurringHref || sub.recurringHref;
  const token = sub.worldpayTokenHref || sub.tokenHref;
  return isUsableTokenHref(token) || isUsableRecurringHref(href);
}
var LIVE_SUB_STATUSES = ["active", "subscribed", "paused", "trialing"];
var DELETED_SUB_STATUS = "deleted";
function isLiveStatus(status) {
  return LIVE_SUB_STATUSES.includes(String(status || "").toLowerCase());
}
function isDeletedStatus(status) {
  return String(status || "").toLowerCase() === DELETED_SUB_STATUS;
}
function orderBelongsToSubscription(order, subscription, allowUnlinked) {
  if (!subscription) return false;
  const subId = String(subscription.id || "");
  if (!subId) return false;
  const orderSubId = String(
    order?.subscriptionId || order?.subscriptionDetails?.subscriptionId || order?.data?.subscriptionId || ""
  );
  if (orderSubId) return orderSubId === subId;
  if (String(subscription.sourceOrderId || "") === String(order?.id || "")) return true;
  return allowUnlinked;
}
function isSubscriptionOrder(order) {
  return Boolean(
    order?.isSubscription || Array.isArray(order?.tags) && order.tags.some((t) => t && t.toLowerCase().includes("subscription")) || Array.isArray(order?.items) && order.items.some((i) => i?.isSubscription || i?.productTitle && i.productTitle.toLowerCase().includes("subscription"))
  );
}
async function loadCustomerSubscriptions(email) {
  const clean2 = String(email || "").toLowerCase().trim();
  if (!clean2) return [];
  const byId = /* @__PURE__ */ new Map();
  try {
    const rows = await prisma.subscription.findMany({ where: { customerEmail: clean2 } });
    for (const row of rows || []) byId.set(String(row.id), row);
  } catch (_e) {
  }
  try {
    const stored = await fetchResource("subscriptions") || [];
    for (const s of stored) {
      if (String(s?.customerEmail || "").toLowerCase().trim() !== clean2) continue;
      const id = String(s.id || "");
      byId.set(id, { ...byId.get(id) || {}, ...s });
    }
  } catch (_e) {
  }
  return Array.from(byId.values());
}
async function loadSubscriptionById(id) {
  const clean2 = String(id || "").trim();
  if (!clean2) return null;
  let prismaRow = null;
  try {
    prismaRow = await prisma.subscription.findUnique({ where: { id: clean2 } });
  } catch (_e) {
  }
  let storedRow = null;
  try {
    const stored = await fetchResource("subscriptions") || [];
    storedRow = stored.find((s) => String(s?.id) === clean2) || null;
  } catch (_e) {
  }
  if (!prismaRow && !storedRow) return null;
  return { ...storedRow || {}, ...prismaRow || {} };
}
async function customerHasOtherLiveSubscription(email, excludeId) {
  const subs = await loadCustomerSubscriptions(email);
  return subs.some((s) => (excludeId ? String(s.id) !== String(excludeId) : true) && isLiveStatus(s.status));
}
function toCustomerSubscription(s, now = /* @__PURE__ */ new Date()) {
  return {
    id: s.id,
    // The order the plan was bought on. The account page shows it so a customer
    // can quote one reference to support for both the plan and its first
    // payment. Records written before checkout recorded it have none, and the
    // account page falls back to the customer's own order history there.
    sourceOrderId: s.sourceOrderId || null,
    planId: s.planId,
    planName: s.planName,
    customerEmail: s.customerEmail,
    customerName: s.customerName,
    amount: s.amount,
    currency: s.currency || "GBP",
    status: s.status,
    billingInterval: s.billingInterval,
    nextBillingDate: s.nextBillingDate,
    isDue: Boolean(s.nextBillingDate && new Date(s.nextBillingDate) <= now),
    cansCount: s.cansCount,
    items: s.items,
    itemPrice: s.itemPrice,
    shippingCost: s.shippingCost,
    deliveryMethod: s.deliveryMethod,
    lastPaymentStatus: s.lastPaymentStatus,
    lastPaymentAt: s.lastPaymentAt,
    cancelledAt: s.cancelledAt,
    cancellationReason: s.cancellationReason,
    reactivatedAt: s.reactivatedAt,
    createdAt: s.createdAt,
    canChargeRecurring: canChargeRecurring(s),
    // Resuming a plan whose mandate was never issued would look successful and
    // then fail silently at the next renewal, so the account page says so up front.
    credentialIssue: canChargeRecurring(s) ? null : "This plan has no stored-card mandate with Worldpay, so it cannot take a recurring payment. Subscribe again to set one up."
  };
}
router14.get("/status", requireAdmin, async (_req, res) => {
  try {
    let subscriptions = [];
    try {
      subscriptions = await prisma.subscription.findMany({
        orderBy: { createdAt: "desc" }
      });
    } catch (_e) {
    }
    if (!subscriptions || subscriptions.length === 0) {
      try {
        subscriptions = await fetchResource("subscriptions") || [];
      } catch (_e) {
      }
    }
    const now = /* @__PURE__ */ new Date();
    const active = subscriptions.filter((s) => s.status === "active");
    const due = active.filter((s) => !s.nextBillingDate || new Date(s.nextBillingDate) <= now);
    return res.json({
      success: true,
      workerStatus: "running",
      interval: "5 minutes",
      totalCount: subscriptions.length,
      activeCount: active.length,
      dueNowCount: due.length,
      timestamp: now.toISOString(),
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        customerName: s.customerName,
        customerEmail: s.customerEmail,
        planName: s.planName,
        amount: s.amount,
        currency: s.currency || "GBP",
        status: s.status,
        billingInterval: s.billingInterval,
        nextBillingDate: s.nextBillingDate,
        isDue: !s.nextBillingDate || new Date(s.nextBillingDate) <= now,
        lastPaymentStatus: s.lastPaymentStatus,
        lastPaymentAt: s.lastPaymentAt,
        worldpayTransactionId: s.worldpayTransactionId,
        // A stored value is not the same as a usable mandate. Earlier builds wrote
        // locally manufactured references that look present but authorise nothing,
        // so reporting mere presence here showed dead subscriptions as healthy.
        hasRecurringToken: canChargeRecurring(s),
        canChargeRecurring: canChargeRecurring(s),
        credentialIssue: canChargeRecurring(s) ? null : "No Worldpay stored-card mandate. This subscription cannot take a recurring payment; the customer must subscribe again so Worldpay issues one."
      }))
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch subscription status"
    });
  }
});
router14.post("/update-schedule", requireCustomer, async (req, res) => {
  try {
    const { subscriptionId, customerEmail, billingInterval, nextBillingDate, chargeImmediately } = req.body;
    if (!subscriptionId && !customerEmail) {
      return res.status(400).json({ success: false, message: "subscriptionId or customerEmail is required" });
    }
    if (subscriptionId) {
      const owner = await loadSubscriptionById(String(subscriptionId));
      if (!owner || !mayActOnCustomer(req, owner.customerEmail)) {
        return res.status(404).json({ success: false, message: "Subscription not found" });
      }
    } else if (!mayActOnCustomer(req, customerEmail)) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }
    const emailClean = customerEmail ? String(customerEmail).toLowerCase().trim() : null;
    let targetNextDate = null;
    if (chargeImmediately) {
      targetNextDate = new Date(Date.now() - 1e3);
    } else if (nextBillingDate) {
      targetNextDate = new Date(nextBillingDate);
    }
    const updateFields = {};
    if (billingInterval) updateFields.billingInterval = normalizeBillingInterval(billingInterval);
    if (targetNextDate) updateFields.nextBillingDate = targetNextDate;
    if (subscriptionId) {
      try {
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: updateFields
        });
      } catch (_e) {
      }
    }
    try {
      const stored = await fetchResource("subscriptions") || [];
      const updatedList = stored.map((s) => {
        const match = subscriptionId && String(s.id) === String(subscriptionId) || emailClean && String(s.customerEmail || "").toLowerCase().trim() === emailClean;
        if (match) {
          return { ...s, ...updateFields };
        }
        return s;
      });
      await saveResource("subscriptions", updatedList);
    } catch (_e) {
    }
    return res.json({
      success: true,
      message: "Subscription schedule updated successfully",
      updatedFields: updateFields
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update schedule"
    });
  }
});
router14.post("/update-plan", requireCustomer, async (req, res) => {
  try {
    const {
      subscriptionId,
      customerEmail,
      planId,
      planName,
      subPlan,
      amount,
      subPrice,
      billingInterval,
      subFrequency,
      subCansCount,
      cansCount,
      items,
      subItems,
      status,
      subStatus,
      nextPayment,
      nextDelivery,
      nextBillingDate
    } = req.body;
    if (!customerEmail && !subscriptionId) {
      return res.status(400).json({ success: false, message: "customerEmail or subscriptionId is required" });
    }
    const emailClean = customerEmail ? String(customerEmail).toLowerCase().trim() : null;
    const given = (v) => v !== void 0 && v !== null && String(v).trim() !== "";
    const ownPlans = emailClean ? (await loadCustomerSubscriptions(emailClean)).filter((s) => !isDeletedStatus(s.status)) : [];
    let targetId = subscriptionId ? String(subscriptionId) : null;
    if (!targetId) {
      if (ownPlans.length !== 1) {
        return res.status(400).json({
          success: false,
          message: ownPlans.length === 0 ? "No subscription found for this customer." : "subscriptionId is required: this customer has more than one plan."
        });
      }
      targetId = String(ownPlans[0].id);
    }
    const itemsIn = Array.isArray(subItems) ? subItems : Array.isArray(items) ? items : void 0;
    const amountIn = given(subPrice) ? Number(subPrice) : given(amount) ? Number(amount) : void 0;
    const cansIn = given(subCansCount) ? Number(subCansCount) : given(cansCount) ? Number(cansCount) : itemsIn ? itemsIn.reduce((sum2, it) => sum2 + (Number(it?.quantity) || 1), 0) : void 0;
    const existing = ownPlans.find((s) => String(s.id) === String(targetId)) || await loadSubscriptionById(String(targetId));
    if (!existing || !mayActOnCustomer(req, existing.customerEmail)) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }
    const patch = {};
    if (given(planName)) patch.planName = String(planName);
    else if (given(subPlan)) patch.planName = String(subPlan);
    if (given(planId)) patch.planId = String(planId);
    else if (given(subPlan)) patch.planId = String(subPlan).toLowerCase().split(" ")[0];
    if (given(subFrequency) || given(billingInterval)) {
      patch.billingInterval = normalizeBillingInterval(subFrequency || billingInterval);
    }
    if (itemsIn) patch.items = itemsIn;
    if (cansIn !== void 0 && Number.isFinite(cansIn)) patch.cansCount = cansIn;
    const targetPlanRef = given(planId) ? String(planId) : given(subPlan) ? String(subPlan) : given(planName) ? String(planName) : "";
    let resolvedPlan = null;
    if (targetPlanRef && existing) {
      resolvedPlan = findPlan(await getPlanCatalogue(), targetPlanRef);
    }
    if (resolvedPlan && existing) {
      const projected = {
        ...existing,
        cansCount: patch.cansCount !== void 0 ? patch.cansCount : existing.cansCount,
        billingInterval: patch.billingInterval || existing.billingInterval
      };
      patch.amount = repriceForPlan(projected, resolvedPlan);
      patch.planName = resolvedPlan.name;
      patch.planId = resolvedPlan.slug;
      Object.assign(patch, clearedPendingFields());
    } else if (amountIn !== void 0 && Number.isFinite(amountIn) && amountIn > 0) {
      patch.amount = amountIn;
    }
    if (given(subStatus) || given(status)) patch.status = String(subStatus || status).toLowerCase();
    if (given(nextBillingDate)) patch.nextBillingDate = new Date(nextBillingDate);
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ success: false, message: "Nothing to update." });
    }
    let updatedPlan = null;
    try {
      const storedSubs = await fetchResource("subscriptions") || [];
      const updatedSubs = storedSubs.map((s) => {
        if (String(s.id) !== targetId) return s;
        if (emailClean && String(s.customerEmail || "").toLowerCase().trim() !== emailClean) return s;
        updatedPlan = {
          ...s,
          ...patch,
          ...patch.nextBillingDate ? { nextBillingDate: patch.nextBillingDate.toISOString() } : {},
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        return updatedPlan;
      });
      if (updatedPlan) await saveResource("subscriptions", updatedSubs);
    } catch (_e) {
    }
    try {
      const existing2 = await prisma.subscription.findUnique({ where: { id: targetId } });
      if (existing2 && (!emailClean || String(existing2.customerEmail || "").toLowerCase().trim() === emailClean)) {
        const row = await prisma.subscription.update({ where: { id: targetId }, data: patch });
        updatedPlan = updatedPlan || row;
      }
    } catch (_e) {
    }
    if (!updatedPlan) {
      return res.status(404).json({ success: false, message: "Subscription plan not found for this customer." });
    }
    if (emailClean) {
      const liveStatuses = ["active", "subscribed", "paused"];
      const planStatus = String(updatedPlan.status || "").toLowerCase();
      const anotherLive = await customerHasOtherLiveSubscription(emailClean, targetId);
      const profileStatus = patch.status === void 0 ? void 0 : liveStatuses.includes(planStatus) ? planStatus === "paused" && !anotherLive ? "Paused" : "Active" : anotherLive ? "Active" : "Cancelled";
      const profilePatch = {
        ...patch.planName !== void 0 ? { subPlan: patch.planName } : {},
        ...patch.amount !== void 0 ? { subPrice: patch.amount } : {},
        ...patch.billingInterval !== void 0 ? { subFrequency: patch.billingInterval } : {},
        ...patch.cansCount !== void 0 ? { subCansCount: patch.cansCount } : {},
        ...profileStatus ? {
          subStatus: profileStatus,
          subscriptionStatus: profileStatus === "Active" ? "Subscribed" : profileStatus === "Paused" ? "Paused" : "Not subscribed"
        } : {},
        ...given(nextPayment) ? { nextPayment } : {},
        ...given(nextDelivery) ? { nextDelivery } : {}
      };
      if (Object.keys(profilePatch).length > 0 || patch.items) {
        try {
          const storedCustomers = await fetchResource("customers") || [];
          let changed = false;
          const updatedCustList = storedCustomers.map((c) => {
            if (String(c.email || "").toLowerCase().trim() !== emailClean) return c;
            changed = true;
            return {
              ...c,
              ...profilePatch,
              ...patch.items ? { subItems: patch.items } : {},
              data: { ...c.data || {}, ...profilePatch, ...patch.items ? { subItems: patch.items } : {} }
            };
          });
          if (changed) await saveResource("customers", updatedCustList);
        } catch (_e) {
        }
        try {
          if (Object.keys(profilePatch).length > 0) {
            await prisma.customer.updateMany({ where: { email: emailClean }, data: profilePatch });
          }
        } catch (_prErr) {
        }
      }
    }
    console.log(
      `[Subscription Plan Update] ${targetId} updated for ${emailClean || "unknown"}: ${Object.keys(patch).join(", ")}`
    );
    return res.json({
      success: true,
      message: "Subscription plan updated.",
      plan: toCustomerSubscription(updatedPlan)
    });
  } catch (error) {
    console.error("[Subscription Plan Update] Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update subscription plan"
    });
  }
});
router14.post(
  "/create",
  async (req, res) => {
    try {
      const {
        customerId,
        customerName,
        customerEmail,
        planId,
        planName,
        amount,
        shippingCost,
        shippingFee,
        shippingAddress,
        deliveryMethod,
        items,
        currency = "GBP",
        billingInterval = "month",
        worldpayResponse,
        sourceOrderId
      } = req.body;
      if (!customerEmail) {
        return res.status(400).json({
          success: false,
          message: "customerEmail is required"
        });
      }
      if (!planId) {
        return res.status(400).json({
          success: false,
          message: "planId is required"
        });
      }
      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid subscription amount is required"
        });
      }
      const recurringHref = extractRecurringAuthorizationHref(worldpayResponse);
      const schemeReference = extractSchemeReference(worldpayResponse);
      const tokenHref = extractTokenHref(worldpayResponse);
      const transactionId = worldpayResponse?.id || worldpayResponse?.transactionReference || null;
      if (!recurringHref && !schemeReference) {
        console.warn(
          `[Subscription Create] No Worldpay stored credential in the supplied gateway response for ${customerEmail}. Renewals for this subscription will fail until a scheme transaction reference is recorded.`
        );
      }
      const normalizedInterval = normalizeBillingInterval(billingInterval);
      const nextBillingDate = calculateNextBillingDate(normalizedInterval, /* @__PURE__ */ new Date());
      const emailClean = String(customerEmail).toLowerCase().trim();
      const subId = `sub_${Date.now()}_${crypto7.randomBytes(3).toString("hex")}`;
      const effectiveShipping = typeof shippingFee === "number" ? shippingFee : typeof shippingCost === "number" ? shippingCost : Number(amount) >= 40 ? 0 : 2.99;
      const subData = {
        id: subId,
        customerId: customerId || null,
        customerEmail: emailClean,
        customerName: customerName || "Valued Customer",
        planId,
        planName: planName || "Nicotine Pouch Subscription Plan",
        amount: Number(amount),
        shippingFee: effectiveShipping,
        shippingCost: effectiveShipping,
        shippingAmount: effectiveShipping,
        shippingAddress: shippingAddress || "United Kingdom",
        deliveryMethod: deliveryMethod || "Royal Mail Tracked 24/48",
        items: Array.isArray(items) ? items : void 0,
        currency,
        status: "active",
        billingInterval: normalizedInterval,
        nextBillingDate,
        worldpayTransactionId: transactionId,
        worldpayTokenHref: tokenHref || null,
        worldpayRecurringHref: recurringHref,
        worldpaySchemeReference: schemeReference,
        lastPaymentStatus: "authorized",
        lastPaymentId: transactionId,
        lastPaymentAt: /* @__PURE__ */ new Date(),
        // The order this plan was bought with. Every lookup that ties a
        // subscription to its order matches on this — including the repair
        // sweep's duplicate guard — so a row without it is invisible to that
        // guard, and the sweep creates another subscription for the same order
        // on every run. That is how one order ended up with five active plans.
        sourceOrderId: sourceOrderId ? String(sourceOrderId) : null
      };
      let subscription = null;
      const written = await upsertSubscriptionRow(subData);
      if (written) {
        subscription = await prisma.subscription.findUnique({ where: { id: subId } }).catch(() => null);
      }
      if (!subscription) {
        console.warn(`[Subscription Create] Neon write unavailable for ${subId}; serving the store copy.`);
        subscription = subData;
      }
      try {
        const existing = await fetchResource("subscriptions") || [];
        existing.unshift(subscription);
        await saveResource("subscriptions", existing.slice(0, 500));
      } catch (_e) {
      }
      try {
        const customers = await fetchResource("customers") || [];
        const foundCust = customers.find((c) => c.email.toLowerCase() === emailClean);
        if (foundCust) {
          foundCust.subscriptionStatus = "Active Subscriber";
          foundCust.subStatus = "active";
          foundCust.subPlan = planName || planId;
          foundCust.subPrice = Number(amount);
          foundCust.nextPayment = nextBillingDate.toISOString().split("T")[0];
          await saveResource("customers", customers);
        }
      } catch (_e) {
      }
      trackSubscriptionStarted(subData, sourceOrderId ? { id: String(sourceOrderId), customerEmail: emailClean, customerName } : void 0).catch((e) => console.warn(`[Klaviyo] Started Subscription failed for ${subId}:`, e?.message || e));
      return res.status(201).json({
        success: true,
        subscription
      });
    } catch (error) {
      console.error("[Subscription Create]", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to create subscription"
      });
    }
  }
);
router14.post(
  "/cancel",
  async (req, res) => {
    try {
      const { subscriptionId, customerEmail, reason } = req.body;
      if (!subscriptionId && !customerEmail) {
        return res.status(400).json({
          success: false,
          message: "subscriptionId or customerEmail is required"
        });
      }
      const emailClean = customerEmail ? String(customerEmail).toLowerCase().trim() : null;
      const cancellationTime = (/* @__PURE__ */ new Date()).toISOString();
      const cancelReason = reason || "Customer cancelled subscription plan via Account portal";
      let subscription = null;
      let prismaCancelled = false;
      let storeCancelled = false;
      if (subscriptionId) {
        try {
          subscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
              status: "cancelled",
              // Written here too, not just to the JSON store: these are real
              // columns, and leaving them null made the typed row look like a
              // plan that had never been cancelled at all.
              cancelledAt: new Date(cancellationTime),
              cancellationReason: cancelReason
            }
          });
          prismaCancelled = true;
        } catch (err) {
          console.error(
            `[Subscription Cancel] Neon write FAILED for ${subscriptionId}: ${err?.message}. The JSON store write below is now the only record of this cancellation.`
          );
        }
      }
      try {
        const stored = await fetchResource("subscriptions") || [];
        let modified = false;
        const updatedList = stored.map((s) => {
          const match = subscriptionId ? String(s.id) === String(subscriptionId) : Boolean(emailClean && String(s.customerEmail || "").toLowerCase().trim() === emailClean);
          if (match) {
            modified = true;
            return {
              ...s,
              status: "cancelled",
              cancelledAt: cancellationTime,
              cancellationReason: cancelReason
            };
          }
          return s;
        });
        if (modified) {
          await saveResource("subscriptions", updatedList);
          storeCancelled = true;
          subscription = updatedList.find(
            (s) => subscriptionId ? String(s.id) === String(subscriptionId) : Boolean(emailClean && String(s.customerEmail || "").toLowerCase().trim() === emailClean)
          ) || subscription;
        }
      } catch (err) {
        console.error(
          `[Subscription Cancel] Store write FAILED for ${subscriptionId || emailClean}: ${err?.message}`
        );
      }
      if (!prismaCancelled && !storeCancelled) {
        console.error(
          `[Subscription Cancel] NOTHING was cancelled for ${subscriptionId || emailClean}. The plan is still live and will be charged again.`
        );
        return res.status(500).json({
          success: false,
          message: "The cancellation could not be saved, so the plan is still active. Please try again \u2014 if it keeps failing, contact support before your next billing date."
        });
      }
      if (!prismaCancelled || !storeCancelled) {
        console.warn(
          `[Subscription Cancel] Partial write for ${subscriptionId || emailClean}: Neon=${prismaCancelled ? "cancelled" : "NOT updated"}, store=${storeCancelled ? "cancelled" : "NOT updated"}. No further charge will be taken, but the two stores disagree.`
        );
      }
      let matchedEmail = emailClean || (subscription?.customerEmail ? String(subscription.customerEmail).toLowerCase().trim() : null);
      const stillSubscribed = matchedEmail ? await customerHasOtherLiveSubscription(matchedEmail, subscriptionId || subscription?.id) : false;
      if (matchedEmail && !stillSubscribed) {
        try {
          const customers = await fetchResource("customers") || [];
          let custModified = false;
          const updatedCustomers = customers.map((c) => {
            if (String(c.email || "").toLowerCase().trim() === matchedEmail) {
              custModified = true;
              return {
                ...c,
                subscriptionStatus: "Cancelled",
                subStatus: "Cancelled",
                isSubscriptionCancelled: true,
                subscriptionCancelledAt: cancellationTime,
                subscriptionCancellationReason: cancelReason
              };
            }
            return c;
          });
          if (custModified) {
            await saveResource("customers", updatedCustomers);
          }
        } catch (custErr) {
          console.warn("[Subscription Cancel] Failed to update customer:", custErr);
        }
      }
      if (matchedEmail) {
        const singlePlanCustomer = (await loadCustomerSubscriptions(matchedEmail)).length <= 1;
        try {
          const orders = await fetchResource("orders") || [];
          let ordersModified = false;
          const updatedOrders = orders.map((o) => {
            const isCustOrder = String(o.customerEmail || "").toLowerCase().trim() === matchedEmail;
            const isSub = isSubscriptionOrder(o);
            const inScope = subscriptionId ? orderBelongsToSubscription(o, subscription || { id: subscriptionId }, singlePlanCustomer) : true;
            if (isCustOrder && isSub && inScope) {
              ordersModified = true;
              const tags = Array.isArray(o.tags) ? [...o.tags] : ["Storefront", "Online Order"];
              if (!tags.includes("Subscription Cancelled")) {
                tags.push("Subscription Cancelled");
              }
              const subDetails = o.subscriptionDetails ? { ...o.subscriptionDetails } : {};
              subDetails.status = "Cancelled";
              subDetails.isCancelled = true;
              subDetails.cancelledAt = cancellationTime;
              subDetails.cancellationReason = cancelReason;
              return {
                ...o,
                tags,
                subscriptionCancelled: true,
                subscriptionCancelledAt: cancellationTime,
                subscriptionCancellationReason: cancelReason,
                subscriptionDetails: subDetails
              };
            }
            return o;
          });
          if (ordersModified) {
            await saveResource("orders", updatedOrders);
            console.log(`[Subscription Cancel] Updated matching orders for customer: ${matchedEmail}`);
          }
        } catch (orderErr) {
          console.warn("[Subscription Cancel] Failed to update orders:", orderErr);
        }
      }
      return res.json({
        success: true,
        message: "Subscription successfully cancelled.",
        accountStillSubscribed: stillSubscribed,
        subscription: subscription || { status: "cancelled", cancelledAt: cancellationTime, cancellationReason: cancelReason }
      });
    } catch (error) {
      console.error("[Subscription Cancel Error]", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to cancel subscription"
      });
    }
  }
);
router14.post(
  "/reactivate",
  async (req, res) => {
    try {
      const { subscriptionId, customerEmail } = req.body;
      if (!subscriptionId && !customerEmail) {
        return res.status(400).json({
          success: false,
          message: "subscriptionId or customerEmail is required"
        });
      }
      const emailClean = customerEmail ? String(customerEmail).toLowerCase().trim() : null;
      const now = /* @__PURE__ */ new Date();
      let subscription = null;
      const resumeBillingDate = (sub) => {
        const raw = sub?.nextBillingDate ? new Date(sub.nextBillingDate) : null;
        if (raw && !isNaN(raw.getTime()) && raw > now) return raw;
        return calculateNextBillingDate(normalizeBillingInterval(sub?.billingInterval), now);
      };
      const resumableFromStore = async () => {
        try {
          const stored = await fetchResource("subscriptions") || [];
          return stored.filter((s) => {
            const matchId = subscriptionId && String(s.id) === String(subscriptionId);
            const matchEmail = emailClean && String(s.customerEmail || "").toLowerCase().trim() === emailClean;
            if (!matchId && !matchEmail) return false;
            return matchId ? true : !isDeletedStatus(s.status);
          });
        } catch (_e) {
          return [];
        }
      };
      if (subscriptionId) {
        try {
          const existing = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
          subscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
              status: "active",
              nextBillingDate: resumeBillingDate(existing || (await resumableFromStore())[0]),
              cancelledAt: null,
              cancellationReason: null
            }
          });
        } catch (_e) {
        }
      } else if (emailClean) {
        try {
          const existing = await prisma.subscription.findMany({
            where: { customerEmail: emailClean, status: { not: DELETED_SUB_STATUS } }
          });
          for (const row of existing || []) {
            await prisma.subscription.update({
              where: { id: row.id },
              data: {
                status: "active",
                nextBillingDate: resumeBillingDate(row),
                cancelledAt: null,
                cancellationReason: null
              }
            });
          }
          subscription = await prisma.subscription.findFirst({
            where: { customerEmail: emailClean, status: { not: DELETED_SUB_STATUS } },
            orderBy: { createdAt: "desc" }
          });
        } catch (_e) {
        }
      }
      try {
        const stored = await fetchResource("subscriptions") || [];
        let modified = false;
        const updatedList = stored.map((s) => {
          const match = subscriptionId ? String(s.id) === String(subscriptionId) : Boolean(emailClean && String(s.customerEmail || "").toLowerCase().trim() === emailClean && !isDeletedStatus(s.status));
          if (match) {
            modified = true;
            const { cancelledAt, cancellationReason, deletedAt, ...rest } = s;
            return {
              ...rest,
              status: "active",
              nextBillingDate: resumeBillingDate(s).toISOString(),
              reactivatedAt: now.toISOString()
            };
          }
          return s;
        });
        if (modified) {
          await saveResource("subscriptions", updatedList);
          subscription = updatedList.find(
            (s) => subscriptionId ? String(s.id) === String(subscriptionId) : Boolean(emailClean && String(s.customerEmail || "").toLowerCase().trim() === emailClean)
          ) || subscription;
        }
      } catch (_e) {
      }
      let matchedEmail = emailClean || (subscription?.customerEmail ? String(subscription.customerEmail).toLowerCase().trim() : null);
      const singlePlanCustomer = matchedEmail ? (await loadCustomerSubscriptions(matchedEmail)).length <= 1 : false;
      if (matchedEmail) {
        try {
          const customers = await fetchResource("customers") || [];
          const updatedCustomers = customers.map((c) => {
            if (String(c.email || "").toLowerCase().trim() === matchedEmail) {
              return {
                ...c,
                subscriptionStatus: "Subscribed",
                subStatus: "Active",
                isSubscriptionCancelled: false
              };
            }
            return c;
          });
          await saveResource("customers", updatedCustomers);
        } catch (_e) {
        }
        try {
          const orders = await fetchResource("orders") || [];
          let ordersModified = false;
          const updatedOrders = orders.map((o) => {
            const isCustOrder = String(o.customerEmail || "").toLowerCase().trim() === matchedEmail;
            const isSub = isSubscriptionOrder(o);
            const inScope = subscriptionId ? orderBelongsToSubscription(o, subscription || { id: subscriptionId }, singlePlanCustomer) : true;
            if (!isCustOrder || !isSub || !inScope) return o;
            ordersModified = true;
            const tags = (Array.isArray(o.tags) ? o.tags : []).filter((tag) => tag.toLowerCase() !== "subscription cancelled");
            const subDetails = o.subscriptionDetails ? { ...o.subscriptionDetails } : {};
            subDetails.status = "Active";
            subDetails.isCancelled = false;
            subDetails.resumedAt = now.toISOString();
            delete subDetails.cancelledAt;
            delete subDetails.cancellationReason;
            return {
              ...o,
              tags,
              subscriptionCancelled: false,
              subscriptionCancelledAt: null,
              subscriptionCancellationReason: null,
              // Recorded so the admin dashboard can say the plan was resumed
              // instead of the cancellation simply vanishing from the order.
              subscriptionResumedAt: now.toISOString(),
              subscriptionDetails: subDetails
            };
          });
          if (ordersModified) {
            await saveResource("orders", updatedOrders);
            console.log(`[Subscription Reactivate] Updated matching orders for customer: ${matchedEmail}`);
          }
        } catch (orderErr) {
          console.warn("[Subscription Reactivate] Failed to update orders:", orderErr);
        }
      }
      const resumedSubscription = subscription || { status: "active" };
      return res.json({
        success: true,
        message: "Subscription plan reactivated successfully.",
        // The account page shows this so the customer can see when the next box
        // is coming, rather than wondering whether resuming charged them today.
        nextBillingDate: resumedSubscription.nextBillingDate || null,
        subscription: resumedSubscription
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to reactivate subscription"
      });
    }
  }
);
router14.post(
  "/delete",
  async (req, res) => {
    try {
      const { subscriptionId, customerEmail } = req.body;
      if (!subscriptionId) {
        return res.status(400).json({ success: false, message: "subscriptionId is required" });
      }
      const emailClean = customerEmail ? String(customerEmail).toLowerCase().trim() : null;
      const deletedAt = (/* @__PURE__ */ new Date()).toISOString();
      let stored = [];
      try {
        stored = await fetchResource("subscriptions") || [];
      } catch (_e) {
      }
      let existing = stored.find((s) => String(s.id) === String(subscriptionId)) || null;
      if (!existing) {
        try {
          existing = await prisma.subscription.findUnique({ where: { id: String(subscriptionId) } });
        } catch (_e) {
        }
      }
      if (!existing) {
        return res.status(404).json({ success: false, message: "Subscription not found." });
      }
      if (emailClean && String(existing.customerEmail || "").toLowerCase().trim() !== emailClean) {
        return res.status(403).json({
          success: false,
          message: "This subscription belongs to a different account."
        });
      }
      if (isLiveStatus(existing.status)) {
        return res.status(409).json({
          success: false,
          message: "This subscription is still active. Cancel it first \u2014 that stops the recurring payment \u2014 and then it can be removed."
        });
      }
      if (isDeletedStatus(existing.status)) {
        return res.json({ success: true, message: "Subscription already removed.", subscriptionId });
      }
      try {
        await prisma.subscription.update({
          where: { id: String(subscriptionId) },
          data: { status: DELETED_SUB_STATUS }
        });
      } catch (_e) {
      }
      try {
        const updatedList = stored.map(
          (s) => String(s.id) === String(subscriptionId) ? { ...s, status: DELETED_SUB_STATUS, deletedAt, previousStatus: s.status } : s
        );
        await saveResource("subscriptions", updatedList);
      } catch (storeErr) {
        console.warn("[Subscription Delete] Failed to update store:", storeErr);
      }
      return res.json({
        success: true,
        message: "Subscription removed from your account.",
        subscriptionId,
        deletedAt
      });
    } catch (error) {
      console.error("[Subscription Delete Error]", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to remove subscription"
      });
    }
  }
);
router14.get(
  "/customer/:email",
  async (req, res) => {
    try {
      const email = String(req.params.email).toLowerCase().trim();
      const now = /* @__PURE__ */ new Date();
      const all = await loadCustomerSubscriptions(email);
      const subscriptions = all.filter((s) => !isDeletedStatus(s.status)).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return res.json({
        success: true,
        subscriptions: subscriptions.map((s) => toCustomerSubscription(s, now)),
        // Ids and removal times, no plan detail. The account page rebuilds a
        // plan card from a subscription order when this endpoint has no record
        // for it, so it needs to tell "never stored" apart from "the customer
        // removed it" — otherwise removing a plan would resurrect it from its
        // own orders. The timestamp matters too: an order placed after the
        // removal is new activity the removal cannot account for, and hiding it
        // would lose a paid order from the customer's view.
        deletedSubscriptions: all.filter((s) => isDeletedStatus(s.status)).map((s) => ({
          id: String(s.id),
          deletedAt: s.deletedAt || s.updatedAt || null,
          // Lets the account page recognise an order that belonged to this
          // plan back when orders did not record which plan billed them.
          planName: s.planName || null
        }))
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch subscriptions"
      });
    }
  }
);
var subscriptions_default = router14;

// backend/routes/structure.ts
import { Router as Router13 } from "express";
import fs3 from "fs";
import path3 from "path";
var router15 = Router13();
var EXCLUDED_DIRS = /* @__PURE__ */ new Set([
  "node_modules",
  ".git",
  ".cache"
]);
function buildTree(dirPath, relativePath = "") {
  let entries = [];
  try {
    entries = fs3.readdirSync(dirPath, { withFileTypes: true });
  } catch (_e) {
    return [];
  }
  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name, void 0, { numeric: true, sensitivity: "base" });
  });
  const nodes = [];
  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const fullPath = path3.join(dirPath, entry.name);
    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: relPath,
        type: "directory",
        children: buildTree(fullPath, relPath)
      });
    } else if (entry.isFile()) {
      let size = 0;
      try {
        size = fs3.statSync(fullPath).size;
      } catch (_e) {
      }
      nodes.push({
        name: entry.name,
        path: relPath,
        type: "file",
        size
      });
    }
  }
  return nodes;
}
function generateAsciiTree(nodes, prefix = "") {
  let result = "";
  nodes.forEach((node, index) => {
    const isLast = index === nodes.length - 1;
    const connector = isLast ? "\u2514\u2500\u2500 " : "\u251C\u2500\u2500 ";
    const childPrefix = isLast ? "    " : "\u2502   ";
    if (node.type === "directory") {
      result += `${prefix}${connector}${node.name}/
`;
      if (node.children && node.children.length > 0) {
        result += generateAsciiTree(node.children, prefix + childPrefix);
      }
    } else {
      result += `${prefix}${connector}${node.name}
`;
    }
  });
  return result;
}
router15.get("/", (req, res) => {
  try {
    const rootDir = process.cwd();
    const tree = buildTree(rootDir);
    const folderName = path3.basename(rootDir);
    const projectName = folderName && folderName !== "/" && folderName !== "." ? folderName : "task";
    const asciiText = `${projectName}/
` + generateAsciiTree(tree);
    res.json({
      success: true,
      projectName,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      tree,
      asciiText
    });
  } catch (err) {
    console.error("[Folder Structure API Error]", err);
    res.status(500).json({
      success: false,
      error: "Failed to scan project folder structure",
      details: err.message
    });
  }
});
var structure_default = router15;

// backend/routes/email.ts
init_emailService();
import { Router as Router14 } from "express";
init_emailTemplates();
init_serverDb();
init_requireAdmin();
var router16 = Router14();
function getSampleTemplateData(type, customData) {
  const sampleItems = [
    { productId: "p1", productTitle: "VELO Freeze Max Strong 17mg Canister", price: 5.99, quantity: 2 },
    { productId: "p2", productTitle: "PABLO Ice Cold Danger Strong 24mg Canister", price: 6.49, quantity: 1 },
    { productId: "p3", productTitle: "KILLA Cold Mint Extra Strong 16mg Canister", price: 5.49, quantity: 3 }
  ];
  const defaultData = {
    customerName: "Scott Kivlin",
    customerEmail: "scottkivlinpouch@gmail.com",
    orderId: "PS89421",
    orderDate: "Aug 1, 2026 at 10:45 AM",
    items: sampleItems,
    subtotal: 34.94,
    deliveryCost: 2.99,
    total: 37.93,
    destination: "42 Baker Street, Marylebone, London, NW1 6XE, United Kingdom",
    deliveryMethod: "Royal Mail Tracked 24/48",
    trackingNumber: "GB892341982UK",
    carrier: "Royal Mail Tracked 24",
    estimatedDelivery: "Tomorrow by 1:00 PM",
    cancellationReason: "Customer requested order change",
    refundAmount: 37.93,
    refundReason: "Customer satisfaction guarantee",
    verificationCode: "749201",
    verificationLink: "https://pouch-supply.com/verify?code=749201",
    resetLink: "https://pouch-supply.com/reset-password?token=sample_reset_token",
    resetToken: "sample_reset_token",
    discountCode: "WELCOME10",
    supportEmail: "scottkivlinpouch@gmail.com",
    siteUrl: "https://pouch-supply.com",
    planName: "Monthly Canister Club",
    previousAmount: 24.99,
    newAmount: 27.99,
    effectiveFrom: "2026-11-01",
    billingInterval: "every 4 weeks"
  };
  return { ...defaultData, ...customData || {} };
}
router16.get("/settings", requireAdmin, async (_req, res) => {
  try {
    const settings = await getEmailSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch email settings" });
  }
});
router16.post("/settings", requireAdmin, async (req, res) => {
  try {
    const updated = await saveEmailSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to save email settings" });
  }
});
router16.post("/verify-connection", requireAdmin, async (req, res) => {
  try {
    const result = await verifyEmailConnection(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Verification failed" });
  }
});
router16.get("/recaptcha-settings", async (_req, res) => {
  try {
    const settings = await getRecaptchaSettings();
    res.json({
      enabled: settings.enabled,
      siteKey: settings.siteKey,
      minScore: settings.minScore,
      hasSecretKey: Boolean(settings.secretKey && settings.secretKey.trim().length > 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch recaptcha settings" });
  }
});
router16.post("/recaptcha-settings", requireAdmin, async (req, res) => {
  try {
    const updated = await saveRecaptchaSettings(req.body);
    res.json({
      success: true,
      settings: {
        enabled: updated.enabled,
        siteKey: updated.siteKey,
        minScore: updated.minScore,
        hasSecretKey: Boolean(updated.secretKey && updated.secretKey.trim().length > 0)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to save recaptcha settings" });
  }
});
router16.get("/logs", requireAdmin, async (_req, res) => {
  try {
    const logs = await getEmailLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch email logs" });
  }
});
router16.post("/logs/clear", requireAdmin, async (req, res) => {
  try {
    const status = typeof req.body?.status === "string" ? req.body.status.trim() : "";
    const beforeRaw = req.body?.before;
    const before = beforeRaw ? Date.parse(String(beforeRaw)) : NaN;
    if (beforeRaw && Number.isNaN(before)) {
      return res.status(400).json({ error: `Invalid 'before' date: ${beforeRaw}` });
    }
    if (!status && !beforeRaw) {
      await saveResource("email_logs", []);
      return res.json({ success: true, removed: "all", remaining: 0, message: "Email logs cleared successfully" });
    }
    const logs = await getEmailLogs();
    const timeOf = (l) => {
      if (l?.timestamp) {
        const t = Date.parse(l.timestamp);
        if (!Number.isNaN(t)) return t;
      }
      const m = String(l?.id || "").match(/_(d{13})_/);
      return m ? Number(m[1]) : 0;
    };
    const kept = logs.filter((l) => {
      const statusMatches = !status || String(l?.status) === status;
      const ageMatches = Number.isNaN(before) || timeOf(l) < before;
      return !(statusMatches && ageMatches);
    });
    await saveResource("email_logs", kept);
    res.json({
      success: true,
      removed: logs.length - kept.length,
      remaining: kept.length,
      message: `Removed ${logs.length - kept.length} log entr${logs.length - kept.length === 1 ? "y" : "ies"}, kept ${kept.length}.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to clear email logs" });
  }
});
router16.post("/preview", requireAdmin, async (req, res) => {
  try {
    const { type, customData } = req.body;
    const templateType = type || "order_confirmation";
    const data = getSampleTemplateData(templateType, customData);
    if (!data.headerLogoImage && !data.logoUrl) {
      try {
        const layout = await fetchLayoutSettings();
        if (layout?.headerLogoImage) {
          data.headerLogoImage = layout.headerLogoImage;
        }
      } catch (e) {
      }
    }
    let html = "";
    switch (templateType) {
      case "order_confirmation":
        html = renderOrderConfirmationTemplate(data);
        break;
      case "order_processing":
        html = renderOrderProcessingTemplate(data);
        break;
      case "order_shipped":
        html = renderOrderShippedTemplate(data);
        break;
      case "out_for_delivery":
        html = renderOutForDeliveryTemplate(data);
        break;
      case "order_delivered":
        html = renderDeliveredTemplate(data);
        break;
      case "subscription_price_change":
        html = renderSubscriptionPriceChangeTemplate(data);
        break;
      case "order_cancelled":
        html = renderOrderCancelledTemplate(data);
        break;
      case "order_refunded":
        html = renderOrderRefundedTemplate(data);
        break;
      case "order_exchanged":
        html = renderOrderExchangedTemplate(data);
        break;
      case "password_reset":
        html = renderPasswordResetTemplate(data);
        break;
      case "email_verification":
        html = renderEmailVerificationTemplate(data);
        break;
      case "welcome_email":
        html = renderWelcomeTemplate(data);
        break;
      case "admin_new_order":
        html = renderAdminNewOrderTemplate(data);
        break;
      default:
        html = renderOrderConfirmationTemplate(data);
    }
    res.send(html);
  } catch (err) {
    res.status(500).send(`<div style="padding:20px; color:red; font-family:sans-serif;">Error rendering preview: ${err.message}</div>`);
  }
});
router16.post("/test", requireAdmin, async (req, res) => {
  try {
    const { recipient, type, customSubject, customData, apiKey, fromEmail } = req.body;
    if (!recipient || typeof recipient !== "string" || !recipient.includes("@")) {
      return res.status(400).json({ error: "Valid recipient email address is required" });
    }
    const templateType = type || "order_confirmation";
    const data = getSampleTemplateData(templateType, customData);
    const result = await sendEmail(templateType, recipient.trim(), data, customSubject, apiKey, fromEmail);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to send test email" });
  }
});
router16.post("/send-trigger", async (req, res) => {
  try {
    const { type, orderData, customerEmail, customerName, trackingNumber, carrier, refundAmount, reason, code } = req.body;
    let result = null;
    switch (type) {
      case "order_confirmation":
        result = await sendOrderConfirmationEmail(orderData || req.body);
        break;
      case "order_processing":
        result = await sendOrderProcessingEmail(orderData || req.body);
        break;
      case "order_shipped":
        result = await sendOrderShippedEmail(orderData || req.body, trackingNumber, carrier);
        break;
      case "out_for_delivery":
        result = await sendOutForDeliveryEmail(orderData || req.body);
        break;
      case "order_delivered":
        result = await sendDeliveredEmail(orderData || req.body);
        break;
      case "order_cancelled":
        result = await sendOrderCancelledEmail(orderData || req.body, reason);
        break;
      case "order_refunded":
        result = await sendOrderRefundedEmail(orderData || req.body, refundAmount, reason);
        break;
      case "order_exchanged":
        result = await sendOrderExchangedEmail(orderData || req.body, req.body.exchangeDetails, reason);
        break;
      case "password_reset":
        result = await sendPasswordResetEmail(customerEmail || req.body.email, customerName);
        break;
      case "email_verification":
        result = await sendEmailVerificationEmail(customerEmail || req.body.email, customerName, code);
        break;
      case "welcome_email":
        result = await sendWelcomeEmail(customerEmail || req.body.email, customerName);
        break;
      case "admin_new_order":
        result = await sendAdminNewOrderNotification(orderData || req.body);
        break;
      default:
        return res.status(400).json({ error: `Unsupported email template trigger '${type}'` });
    }
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to dispatch email trigger" });
  }
});
router16.post("/contact", async (req, res) => {
  try {
    const { name, email, subject, message, phone, recaptchaToken, token } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required fields." });
    }
    const captchaCheck = await verifyRecaptchaToken(recaptchaToken || token, "contact_form_submit");
    if (!captchaCheck.success) {
      console.warn("[ContactForm] reCAPTCHA check failed:", captchaCheck);
      return res.status(403).json({
        error: captchaCheck.error || "reCAPTCHA security validation failed. Automated submission detected."
      });
    }
    const settings = await getEmailSettings();
    const adminEmail = settings.adminNotificationEmail || settings.gmailUser || "scottkivlinpouch@gmail.com";
    const emailSubject = `\u{1F4E9} Contact Form Submission: ${subject || "General Inquiry"} from ${name}`;
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">New Contact Form Message</h2>
        <p style="color: #475569; font-size: 14px;">You received a new message from your website contact page.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <table style="width: 100%; text-align: left; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #334155; width: 120px;">Name:</td>
            <td style="padding: 8px 0; color: #0f172a;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #334155;">Email:</td>
            <td style="padding: 8px 0; color: #0f172a;"><a href="mailto:${email}" style="color: #2563eb;">${email}</a></td>
          </tr>
          ${phone ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #334155;">Phone:</td>
            <td style="padding: 8px 0; color: #0f172a;">${phone}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #334155;">Subject:</td>
            <td style="padding: 8px 0; color: #0f172a;">${subject || "General Inquiry"}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 16px; background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 6px;">
          <h4 style="margin: 0 0 8px 0; color: #1e293b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Message:</h4>
          <p style="margin: 0; color: #334155; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${message}</p>
        </div>
        <p style="margin-top: 24px; font-size: 12px; color: #94a3b8; text-align: center;">Sent via Pouch Supply Co. Storefront Contact Form</p>
      </div>
    `;
    await sendEmail("admin_new_order", adminEmail, {
      customerName: name,
      customerEmail: email,
      orderId: "INQUIRY-" + Date.now().toString().slice(-6)
    }, emailSubject);
    const contactMsgRecord = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      email,
      phone: phone || "",
      subject: subject || "General Inquiry",
      message,
      status: "Unread",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const existingMsgs = await fetchResource("contact_messages") || [];
    existingMsgs.unshift(contactMsgRecord);
    await saveResource("contact_messages", existingMsgs.slice(0, 500));
    res.json({
      success: true,
      message: "Thank you! Your message has been sent successfully. We will get back to you shortly.",
      id: contactMsgRecord.id
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to submit contact message" });
  }
});
var email_default = router16;

// backend/routes/klaviyo.ts
init_klaviyoService();
init_serverDb();
init_requireAdmin();
import { Router as Router15 } from "express";
var router17 = Router15();
router17.get("/lists", requireAdmin, async (req, res) => {
  try {
    const apiKey = req.query.apiKey;
    const lists = await getKlaviyoLists(apiKey);
    res.json({ success: true, lists });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to fetch Klaviyo lists" });
  }
});
router17.get("/settings", requireAdmin, async (_req, res) => {
  try {
    const settings = await getKlaviyoSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch Klaviyo settings" });
  }
});
router17.post("/settings", requireAdmin, async (req, res) => {
  try {
    const updated = await saveKlaviyoSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to save Klaviyo settings" });
  }
});
var handleVerify = async (req, res) => {
  try {
    const apiKey = req.body?.apiKey || req.query?.apiKey;
    const settings = await getKlaviyoSettings();
    let keyToTest = (apiKey || settings.apiKey || process.env.KLAVIYO_API_KEY || "").trim();
    if (keyToTest.toLowerCase().startsWith("klaviyo-api-key ")) {
      keyToTest = keyToTest.substring(16).trim();
    }
    if (!keyToTest) {
      return res.status(400).json({ success: false, error: "No Klaviyo Private API Key provided or saved in settings." });
    }
    const response = await fetch("https://a.klaviyo.com/api/metrics/", {
      method: "GET",
      headers: {
        "Authorization": `Klaviyo-API-Key ${keyToTest}`,
        "accept": "application/json",
        "revision": "2024-02-15"
      }
    });
    if (!response.ok) {
      const errText = await response.text();
      let errorMsg = `HTTP ${response.status}: ${errText}`;
      try {
        const jsonErr = JSON.parse(errText);
        if (jsonErr.errors && Array.isArray(jsonErr.errors)) {
          errorMsg = jsonErr.errors.map((e) => `${e.title || "Error"}: ${e.detail || e.message || JSON.stringify(e)}`).join(" | ");
        }
      } catch (e) {
      }
      return res.status(response.status).json({ success: false, error: errorMsg });
    }
    const data = await response.json();
    const count = Array.isArray(data?.data) ? data.data.length : 0;
    const testEventPayload = {
      data: {
        type: "event",
        attributes: {
          metric: { data: { type: "metric", attributes: { name: "Storefront Verification" } } },
          profile: { data: { type: "profile", attributes: { email: "verification-check@pouch-supply.com" } } },
          properties: { verified: true },
          time: (/* @__PURE__ */ new Date()).toISOString()
        }
      }
    };
    const eventCheckRes = await fetch("https://a.klaviyo.com/api/events/", {
      method: "POST",
      headers: {
        "Authorization": `Klaviyo-API-Key ${keyToTest}`,
        "Content-Type": "application/json",
        "accept": "application/json",
        "revision": "2024-02-15"
      },
      body: JSON.stringify(testEventPayload)
    });
    let hasEventsWrite = eventCheckRes.ok || eventCheckRes.status === 202;
    let eventsWriteWarning = "";
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
      eventsWriteWarning: eventsWriteWarning || void 0,
      message: hasEventsWrite ? `Klaviyo Private API Key verified with Full Access! Account connected with ${count} metrics.` : `API Key connected (${count} metrics), but missing "events:write" scope. Please create a Private Key in Klaviyo with "Full Access" so metrics populate in Analytics.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to verify Klaviyo API key" });
  }
};
router17.get("/verify", requireAdmin, handleVerify);
router17.post("/verify", requireAdmin, handleVerify);
router17.get("/health", requireAdmin, async (_req, res) => {
  try {
    const settings = await getKlaviyoSettings();
    let apiKey = (settings.apiKey || process.env.KLAVIYO_API_KEY || "").trim();
    if (apiKey.toLowerCase().startsWith("klaviyo-api-key ")) apiKey = apiKey.substring(16).trim();
    if (!apiKey) {
      return res.json({
        connected: false,
        enabled: settings.enabled,
        issues: ["No Klaviyo private API key is configured."],
        flows: [],
        listConfigured: false
      });
    }
    const headers = {
      "Authorization": `Klaviyo-API-Key ${apiKey}`,
      "accept": "application/json",
      "revision": "2024-10-15"
    };
    const [flowRes, metricRes] = await Promise.all([
      fetch("https://a.klaviyo.com/api/flows/", { headers }),
      fetch("https://a.klaviyo.com/api/metrics/", { headers })
    ]);
    const issues = [];
    const flowJson = flowRes.ok ? await flowRes.json().catch(() => null) : null;
    const flows = (flowJson && flowJson.data || []).map((f) => ({
      name: f?.attributes?.name || "Untitled flow",
      status: f?.attributes?.status || "unknown"
    }));
    if (!flowRes.ok) {
      issues.push("Could not read flows from Klaviyo (the API key may lack the flows:read scope).");
    } else {
      const drafts = flows.filter((f) => f.status !== "live");
      if (flows.length === 0) {
        issues.push("This Klaviyo account has no flows, so no event can produce an email.");
      } else if (drafts.length > 0) {
        issues.push(
          `${drafts.length} flow(s) are not live and will send nothing: ` + drafts.map((f) => `"${f.name}" (${f.status})`).join(", ") + "."
        );
      }
    }
    const metricJson = metricRes.ok ? await metricRes.json().catch(() => null) : null;
    const metrics = (metricJson && metricJson.data || []).map((m) => ({
      name: m?.attributes?.name || "",
      integration: m?.attributes?.integration && m.attributes.integration.name || "API"
    }));
    const duplicates = Array.from(
      new Set(
        metrics.filter((m) => metrics.filter((o) => o.name === m.name).length > 1).map((m) => m.name)
      )
    );
    if (duplicates.length > 0) {
      issues.push(
        "Duplicate metrics exist from another integration (" + duplicates.join(", ") + "). Check each flow triggers on the API copy, not the old one."
      );
    }
    if (!settings.listId) {
      issues.push(
        "No list is selected, so email marketing consent is never recorded and marketing flows skip these profiles. Order confirmations are unaffected if their flow is marked transactional."
      );
    }
    if (!settings.enabled) issues.push("The Klaviyo integration is switched off in settings.");
    res.json({
      connected: flowRes.ok || metricRes.ok,
      enabled: settings.enabled,
      listConfigured: Boolean(settings.listId),
      flows,
      duplicateMetrics: duplicates,
      issues,
      healthy: issues.length === 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to read Klaviyo health" });
  }
});
router17.get("/logs", requireAdmin, async (_req, res) => {
  try {
    const logs = await getKlaviyoLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch Klaviyo logs" });
  }
});
router17.post("/logs/clear", requireAdmin, async (req, res) => {
  try {
    const status = typeof req.body?.status === "string" ? req.body.status.trim() : "";
    const beforeRaw = req.body?.before;
    const before = beforeRaw ? Date.parse(String(beforeRaw)) : NaN;
    if (beforeRaw && Number.isNaN(before)) {
      return res.status(400).json({ error: `Invalid 'before' date: ${beforeRaw}` });
    }
    if (!status && !beforeRaw) {
      await saveResource("klaviyo_logs", []);
      return res.json({ success: true, removed: "all", remaining: 0, message: "Klaviyo logs cleared successfully" });
    }
    const logs = await getKlaviyoLogs();
    const timeOf = (l) => {
      if (l?.timestamp) {
        const t = Date.parse(l.timestamp);
        if (!Number.isNaN(t)) return t;
      }
      const m = String(l?.id || "").match(/_(d{13})_/);
      return m ? Number(m[1]) : 0;
    };
    const kept = logs.filter((l) => {
      const statusMatches = !status || String(l?.status) === status;
      const ageMatches = Number.isNaN(before) || timeOf(l) < before;
      return !(statusMatches && ageMatches);
    });
    await saveResource("klaviyo_logs", kept);
    res.json({
      success: true,
      removed: logs.length - kept.length,
      remaining: kept.length,
      message: `Removed ${logs.length - kept.length} log entr${logs.length - kept.length === 1 ? "y" : "ies"}, kept ${kept.length}.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to clear klaviyo logs" });
  }
});
router17.post("/track", async (req, res) => {
  try {
    const { eventName, customerEmail, eventProperties, customerProperties, eventType, data } = req.body;
    if (eventType) {
      switch (eventType) {
        case "customer_signup":
          await trackCustomerSignup(data || { email: customerEmail });
          break;
        case "newsletter_signup":
          await trackNewsletterSignup(customerEmail);
          break;
        case "email_verified":
          await trackEmailVerified(customerEmail);
          break;
        case "add_to_cart":
          await trackAddToCart(customerEmail, data?.item, data?.quantity || 1);
          break;
        case "checkout_started":
          await trackCheckoutStarted(customerEmail, data?.items || [], data?.total || 0, {
            checkoutId: data?.checkoutId,
            customerName: data?.customerName,
            recurring: data?.recurring
          });
          break;
        case "purchase":
          await trackPurchaseCompleted(data || { customerEmail, total: eventProperties?.total });
          break;
        case "refunded":
          await trackOrderRefunded(data || { customerEmail, id: eventProperties?.orderId }, data?.refundAmount);
          break;
        case "wishlist":
          await trackWishlistAdded(customerEmail, data?.item);
          break;
        default:
          await trackKlaviyoEvent(eventName || eventType, customerEmail || "guest@pouch-supply.com", eventProperties, customerProperties);
      }
      return res.json({ success: true, tracked: eventType });
    }
    if (!eventName || !customerEmail) {
      return res.status(400).json({ error: "eventName and customerEmail are required" });
    }
    const result = await trackKlaviyoEvent(eventName, customerEmail, eventProperties || {}, customerProperties || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to track Klaviyo event" });
  }
});
var klaviyo_default = router17;

// backend/routes/royalMail.ts
init_royalMailService();
init_royalMail();
init_requireAdmin();
import { Router as Router16 } from "express";
function sendRoyalMailError(res, error, fallbackMessage) {
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
var router18 = Router16();
router18.get("/connection", requireAdmin, async (_req, res) => {
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
      environment: "LIVE"
    });
  } catch (error) {
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
        details: error.details
      });
    }
    return res.status(200).json({
      success: false,
      connected: false,
      message: msg
    });
  }
});
router18.post("/create-order", requireAdmin, async (req, res) => {
  try {
    const orderData = req.body;
    const settings = await getRoyalMailSettings();
    const apiKey = settings.apiKey || process.env.RM_API_KEY || process.env.ROYAL_MAIL_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "RM_API_KEY is not configured."
      });
    }
    if (!orderData.orderReference) {
      return res.status(400).json({
        success: false,
        error: "orderReference is required."
      });
    }
    if (!orderData.recipient) {
      return res.status(400).json({
        success: false,
        error: "recipient information is required."
      });
    }
    if (!orderData.packages?.length) {
      return res.status(400).json({
        success: false,
        error: "At least one package is required."
      });
    }
    if (!orderData.postageDetails?.serviceCode) {
      return res.status(400).json({
        success: false,
        error: "Royal Mail serviceCode is required."
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
      royalMailResponse: result
    });
  } catch (error) {
    console.error("[Royal Mail] Create order error:", error);
    const message = error instanceof Error ? error.message : "Failed to create Royal Mail order.";
    return res.status(500).json({
      success: false,
      error: message
    });
  }
});
router18.get("/orders", requireAdmin, async (req, res) => {
  try {
    const apiKey = await requireApiKey();
    const params = req.query;
    const data = await getOrders(apiKey, params);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to fetch orders" });
  }
});
router18.get("/orders/:reference", requireAdmin, async (req, res) => {
  try {
    const apiKey = await requireApiKey();
    const data = await getOrderByReference(req.params.reference, apiKey);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to fetch order" });
  }
});
router18.delete("/orders/:reference", requireAdmin, async (req, res) => {
  try {
    const apiKey = await requireApiKey();
    const data = await cancelOrder(req.params.reference, apiKey);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to cancel order" });
  }
});
router18.get("/version", requireAdmin, async (_req, res) => {
  try {
    const apiKey = await requireApiKey();
    const data = await getApiVersion(apiKey);
    res.json({ success: true, version: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to fetch API version" });
  }
});
router18.get("/settings", requireAdmin, async (_req, res) => {
  try {
    const settings = await getRoyalMailSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch Royal Mail settings" });
  }
});
router18.post("/settings", requireAdmin, async (req, res) => {
  try {
    const updated = await saveRoyalMailSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to save Royal Mail settings" });
  }
});
router18.post("/create-shipment", requireAdmin, async (req, res) => {
  try {
    const { orderId, serviceCode, packageType, weightGrams } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: "orderId is required" });
    }
    const result = await createRoyalMailShipment(String(orderId), {
      serviceCode,
      packageType,
      weightGrams: weightGrams ? parseInt(weightGrams, 10) : void 0
    });
    res.json(result);
  } catch (err) {
    return sendRoyalMailError(res, err, "Failed to create Royal Mail shipment");
  }
});
router18.post("/validate-address", requireAdmin, async (req, res) => {
  try {
    const result = validateAddress(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Address validation failed" });
  }
});
router18.post("/test-service-code", requireAdmin, async (req, res) => {
  try {
    const codes = Array.isArray(req.body?.serviceCodes) ? req.body.serviceCodes : [req.body?.serviceCode].filter(Boolean);
    if (codes.length === 0) {
      return res.status(400).json({ success: false, message: "Provide serviceCode or serviceCodes." });
    }
    const results = [];
    for (const code of codes.slice(0, 10)) {
      results.push(await testServiceCode(String(code), req.body?.tradingName));
    }
    return res.json({ success: true, results, accepted: results.filter((r) => r.accepted).map((r) => r.serviceCode) });
  } catch (error) {
    return res.status(200).json({ success: false, message: error?.message || "Service code test failed." });
  }
});
router18.post("/rates", requireAdmin, async (req, res) => {
  try {
    const { weightGrams, countryCode } = req.body;
    const rates = getShippingRates(weightGrams || 70, countryCode || "GB");
    res.json({ success: true, rates });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to calculate rates" });
  }
});
router18.get("/label/:orderId/order-pdf", requireAdmin, async (req, res) => {
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
  } catch (err) {
    return sendRoyalMailError(res, err, "Unable to retrieve the Royal Mail label");
  }
});
router18.put("/dispatch-order/:orderId", requireAdmin, async (req, res) => {
  try {
    const result = await dispatchRoyalMailShipment(String(req.params.orderId));
    return res.json(result);
  } catch (err) {
    return sendRoyalMailError(res, err, "Unable to mark the order as despatched");
  }
});
router18.get("/track/:trackingNumber", async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const trackingInfo = await getRoyalMailTracking(trackingNumber);
    res.json(trackingInfo);
  } catch (err) {
    return sendRoyalMailError(res, err, "Tracking lookup failed");
  }
});
router18.post("/sync-status/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await syncRoyalMailOrderStatus(orderId);
    res.json(result);
  } catch (err) {
    return sendRoyalMailError(res, err, "Failed to sync order status");
  }
});
var handleSyncPending = async (req, res) => {
  try {
    const rawLimit = Number(req.query?.limit ?? (req.body || {}).limit);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : void 0;
    const result = await syncPendingRoyalMailTracking({ limit });
    res.json({
      ...result,
      message: `Checked ${result.checked} shipment(s) awaiting tracking; ${result.updated} tracking number(s) collected.`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    return sendRoyalMailError(res, err, "Failed to sync pending Royal Mail tracking");
  }
};
router18.get("/sync-pending", requireCronOrAdmin, handleSyncPending);
router18.post("/sync-pending", requireCronOrAdmin, handleSyncPending);
router18.post("/cancel-shipment", requireAdmin, async (req, res) => {
  try {
    const { orderId, royalMailOrderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, error: "orderId is required" });
    }
    const result = await cancelRoyalMailShipment(String(orderId), royalMailOrderId);
    res.json(result);
  } catch (err) {
    return sendRoyalMailError(res, err, "Failed to cancel shipment");
  }
});
router18.post("/create-return-label", requireAdmin, async (req, res) => {
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
  } catch (err) {
    return sendRoyalMailError(res, err, "Failed to retrieve the returns label");
  }
});
router18.get("/label/:identifier/pdf", requireAdmin, async (req, res) => {
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
  } catch (error) {
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
router18.put("/dispatch", requireAdmin, async (req, res) => {
  try {
    const { orderIdentifier, orderReference } = req.body;
    if (orderIdentifier === void 0 && !orderReference) {
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
    const identifier = orderIdentifier !== void 0 ? Number(orderIdentifier) : String(orderReference);
    const result = await markRoyalMailOrderDispatched(identifier, apiKey);
    return res.json({ success: true, data: result });
  } catch (error) {
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
var royalMail_default = router18;

// backend/routes/contactMessages.ts
var router19 = createCrudRouter("contactMessages");
var contactMessages_default = router19;

// backend/routes/agechecked.ts
init_prisma();
import { Router as Router17 } from "express";
var router20 = Router17();
var DEFAULT_BASE_URL = "https://staging.agechecked.com/api/acapiremote/ac0130";
var DEFAULT_PORTAL_URL = "https://portal.agechecked.com/portal";
var SECRET_FIELD_NAMES = ["merchantSecretKey", "merchantKey", "secretKey", "merchantSecret"];
router20.get("/config", (req, res) => {
  const portalUrl = process.env.NEXT_PUBLIC_AGECHECKED_PORTAL_URL || process.env.AGECHECKED_PORTAL_URL || DEFAULT_PORTAL_URL;
  const publicKey = process.env.NEXT_PUBLIC_AGECHECKED_PUBLIC_KEY || process.env.AGECHECKED_PUBLIC_KEY || "";
  res.json({
    portalUrl,
    publicKey,
    configured: Boolean(process.env.AGECHECKED_SECRET_KEY || publicKey)
  });
});
function isApprovedStatus(status) {
  if (status === null || status === void 0) return false;
  const normalized = String(status).trim().toLowerCase();
  return normalized === "approved" || normalized === "true" || normalized === "6" || normalized === "7" || normalized === "verified" || normalized === "pass" || normalized === "passed" || normalized === "success" || normalized === "completed" || normalized === "complete" || normalized === "valid" || normalized === "validated" || normalized === "ok" || normalized === "pass_18" || normalized === "pass_21" || normalized === "accepted";
}
function normalizeSecretKey(value) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}
function getProviderMessage(responseBody) {
  if (!responseBody) return "AgeChecked AC0130 initialization failed.";
  return responseBody.message || responseBody.error?.message || responseBody.avstatus?.statusText || responseBody.avstatus?.statustext || (typeof responseBody.details === "string" ? responseBody.details : void 0) || "AgeChecked AC0130 initialization failed.";
}
function buildPayloads(secretKey, body) {
  const secretVariants = [secretKey];
  if (secretKey) {
    try {
      const doubleDecoded = decodeURIComponent(secretKey);
      if (doubleDecoded && !secretVariants.includes(doubleDecoded)) {
        secretVariants.push(doubleDecoded);
      }
    } catch {
    }
  }
  return secretVariants.flatMap(
    (secretValue) => SECRET_FIELD_NAMES.map((fieldName) => ({
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
      userfield3: body.userfield3 ?? ""
    }))
  );
}
var verifiedSessions = /* @__PURE__ */ new Map();
var AGE_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1e3;
async function persistAgeVerification(keys, agecheckid, email, metadata) {
  const normalizedAgeCheckId = agecheckid || `AC-${Date.now()}`;
  const normalizedEmail = email ? email.toLowerCase().trim() : void 0;
  const record = { approved: true, agecheckid: normalizedAgeCheckId, email: normalizedEmail, timestamp: Date.now() };
  if (normalizedAgeCheckId) verifiedSessions.set(normalizedAgeCheckId.trim(), record);
  if (normalizedEmail) verifiedSessions.set(normalizedEmail, record);
  for (const k of keys) {
    if (k && typeof k === "string" && k.trim()) {
      verifiedSessions.set(k.trim(), record);
    }
  }
  try {
    const verifiedPayload = {
      approved: true,
      verified: true,
      agecheckid: normalizedAgeCheckId,
      email: normalizedEmail || null,
      keys: keys.filter((k) => Boolean(k && typeof k === "string" && k.trim())),
      verifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
      provider: "AgeChecked",
      ...metadata
    };
    const validKeys = Array.from(new Set([
      normalizedAgeCheckId,
      normalizedEmail,
      ...keys.filter((k) => Boolean(k && typeof k === "string" && k.trim()))
    ].filter(Boolean)));
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
            updatedAt: /* @__PURE__ */ new Date()
          },
          create: {
            resource: "age_verification",
            itemId: key,
            data: verifiedPayload
          }
        });
      } catch (_storeErr) {
      }
    }
    if (normalizedEmail) {
      try {
        const existingCustomer = await prisma.customer.findUnique({
          where: { email: normalizedEmail }
        });
        if (existingCustomer) {
          const currentData = existingCustomer.data && typeof existingCustomer.data === "object" ? existingCustomer.data : {};
          await prisma.customer.update({
            where: { email: normalizedEmail },
            data: {
              data: {
                ...currentData,
                ageVerified: true,
                ageChecked: true,
                ageCheckId: normalizedAgeCheckId,
                ageVerifiedAt: (/* @__PURE__ */ new Date()).toISOString()
              }
            }
          });
        }
      } catch (_custErr) {
      }
    }
  } catch (err) {
    console.error("[AgeChecked] DB persistence error:", err);
  }
}
async function checkAgeVerificationDb(keys) {
  const validKeys = Array.from(new Set(keys.filter((k) => Boolean(k && typeof k === "string" && k.trim()))));
  if (validKeys.length === 0) return null;
  try {
    const records = await prisma.storeResource.findMany({
      where: {
        resource: "age_verification",
        itemId: { in: validKeys }
      }
    });
    if (records.length > 0) {
      const data = records[0].data;
      const verifiedAtMs = data?.verifiedAt ? Date.parse(data.verifiedAt) : NaN;
      const isExpired = Number.isFinite(verifiedAtMs) && Date.now() - verifiedAtMs > AGE_VERIFICATION_TTL_MS;
      if (data && (data.approved === true || data.verified === true) && !isExpired) {
        return { approved: true, agecheckid: data.agecheckid || records[0].itemId };
      }
    }
    const emailKey = validKeys.find((k) => k.includes("@"));
    if (emailKey) {
      const customer = await prisma.customer.findUnique({
        where: { email: emailKey.toLowerCase().trim() }
      });
      if (customer && customer.data && typeof customer.data === "object") {
        const custData = customer.data;
        const verifiedAtMs = custData.ageVerifiedAt ? Date.parse(custData.ageVerifiedAt) : NaN;
        const isExpired = Number.isFinite(verifiedAtMs) && Date.now() - verifiedAtMs > AGE_VERIFICATION_TTL_MS;
        if ((custData.ageVerified === true || custData.ageChecked === true) && !isExpired) {
          return { approved: true, agecheckid: custData.ageCheckId || `AC-${customer.id}` };
        }
      }
    }
  } catch (_dbErr) {
  }
  return null;
}
router20.post("/init", async (req, res) => {
  const secretKey = normalizeSecretKey(process.env.AGECHECKED_SECRET_KEY);
  const baseUrl = (process.env.AGECHECKED_BASE_URL || process.env.VITE_AGECHECKED_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
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
  let lastError = null;
  for (const payload of payloads) {
    try {
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });
      const responseText = await response.text();
      let responseBody = {};
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
        status: response.status || 400
      };
    } catch (error) {
      console.error("[AgeChecked init] Request failed:", error);
      lastError = {
        message: "Unable to reach the AgeChecked AC0130 endpoint.",
        details: error?.message || error,
        status: 502
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
    attemptedFieldNames: SECRET_FIELD_NAMES.join(", ")
  });
});
router20.get("/status", async (req, res) => {
  const reference = String(req.query.reference || "").trim();
  const agecheckid = String(req.query.agecheckid || "").trim();
  const email = String(req.query.email || "").toLowerCase().trim();
  if (!agecheckid && !reference) {
    return res.json({ success: false, approved: false, status: "0", statusText: "Pending" });
  }
  const isCacheEntryExpired = (data) => Date.now() - data.timestamp > AGE_VERIFICATION_TTL_MS;
  if (reference && verifiedSessions.has(reference)) {
    const data = verifiedSessions.get(reference);
    if (isCacheEntryExpired(data)) {
      verifiedSessions.delete(reference);
    } else {
      return res.json({ success: true, approved: data.approved, agecheckid: data.agecheckid, status: "6", statusText: "Approved" });
    }
  }
  if (agecheckid && verifiedSessions.has(agecheckid)) {
    const data = verifiedSessions.get(agecheckid);
    if (isCacheEntryExpired(data)) {
      verifiedSessions.delete(agecheckid);
    } else {
      return res.json({ success: true, approved: data.approved, agecheckid: data.agecheckid, status: "6", statusText: "Approved" });
    }
  }
  if (email && (agecheckid || reference) && verifiedSessions.has(email)) {
    const data = verifiedSessions.get(email);
    if (isCacheEntryExpired(data)) {
      verifiedSessions.delete(email);
    } else {
      return res.json({ success: true, approved: data.approved, agecheckid: data.agecheckid, status: "6", statusText: "Approved" });
    }
  }
  const dbRecord = await checkAgeVerificationDb([reference, agecheckid, email]);
  if (dbRecord && dbRecord.approved) {
    const resolvedId = dbRecord.agecheckid || agecheckid;
    if (!resolvedId) {
      return res.json({ success: false, approved: false, status: "0", statusText: "Pending" });
    }
    await persistAgeVerification([reference, agecheckid, email], resolvedId, email);
    return res.json({ success: true, approved: true, agecheckid: resolvedId, status: "6", statusText: "Approved" });
  }
  const secretKey = normalizeSecretKey(process.env.AGECHECKED_SECRET_KEY);
  if (secretKey && (agecheckid || reference || email)) {
    try {
      const baseUrl = (process.env.AGECHECKED_BASE_URL || DEFAULT_BASE_URL).replace(/\/ac0130\/?$/, "/ac0131");
      const queryVariants = [
        { merchantSecretKey: secretKey, agecheckid: agecheckid || void 0, reference: reference || void 0 },
        { merchantKey: secretKey, agecheckid: agecheckid || void 0, reference: reference || void 0 },
        { secretKey, agecheckid: agecheckid || void 0, reference: reference || void 0 },
        { merchantSecretKey: secretKey, reference: reference || void 0, email: email || void 0 }
      ];
      for (const queryPayload of queryVariants) {
        try {
          const checkRes = await fetch(baseUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(queryPayload)
          });
          if (checkRes.ok) {
            const checkData = await checkRes.json().catch(() => ({}));
            const statusVal = checkData?.avstatus?.status ?? checkData?.status ?? checkData?.code ?? checkData?.result ?? checkData?.data?.status;
            const statusText = checkData?.avstatus?.statustext ?? checkData?.avstatus?.statusText ?? checkData?.statustext ?? checkData?.statusText ?? checkData?.data?.statustext;
            if (isApprovedStatus(statusVal) || isApprovedStatus(statusText) || checkData?.approved === true || checkData?.verified === true) {
              const resolvedId = agecheckid || checkData?.avstatus?.agecheckid || checkData?.agecheckid || checkData?.data?.id || `AC-${Date.now()}`;
              await persistAgeVerification([reference, agecheckid, email], resolvedId, email, checkData);
              return res.json({ success: true, approved: true, agecheckid: resolvedId, status: "6", statusText: "Approved" });
            }
          }
        } catch (_fetchErr) {
        }
      }
    } catch (_err) {
    }
  }
  return res.json({ success: false, approved: false, status: "0", statusText: "Pending" });
});
router20.post("/approve", async (req, res) => {
  const { reference, email, agecheckid, verified, method } = req.body || {};
  if ((verified === true || verified === "true" || verified === 1 || verified === "1") && agecheckid) {
    const resolvedAgeCheckId = String(agecheckid);
    await persistAgeVerification([reference, email, resolvedAgeCheckId], resolvedAgeCheckId, email, { method });
    return res.json({ success: true, approved: true, agecheckid: resolvedAgeCheckId, method });
  }
  return res.status(400).json({ success: false, approved: false, message: "Verification not completed or session ID is missing." });
});
router20.post("/reset", async (req, res) => {
  const { reference, email, agecheckid } = req.body || {};
  const normalizedEmail = email ? String(email).toLowerCase().trim() : void 0;
  const keys = [reference, agecheckid, normalizedEmail].filter(
    (k) => Boolean(k && typeof k === "string" && k.trim())
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
        const currentData = existingCustomer.data && typeof existingCustomer.data === "object" ? existingCustomer.data : {};
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
router20.post("/reset", async (req, res) => {
  const { reference, email, agecheckid } = req.body || {};
  const normalizedEmail = email ? String(email).toLowerCase().trim() : void 0;
  const keys = [reference, agecheckid, normalizedEmail].filter(
    (k) => Boolean(k && typeof k === "string" && k.trim())
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
        const currentData = existingCustomer.data && typeof existingCustomer.data === "object" ? existingCustomer.data : {};
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
router20.get("/demo-portal", (_req, res) => {
  return res.status(410).json({
    success: false,
    message: "The legacy AgeChecked demo portal is no longer available."
  });
});
var handleCallback = async (req, res) => {
  const query = req.query || {};
  const body = req.body || {};
  const status = String(
    query.status || query.statustext || query.code || query.result || query.action || body.status || body.statustext || body.code || body.result || body.action || body.avstatus?.status || body.avstatus?.statustext || body.data?.status || ""
  );
  const statusText = String(
    query.statusText || query.statustext || body.statusText || body.statustext || body.avstatus?.statusText || body.avstatus?.statustext || body.data?.statusText || ""
  );
  const agecheckid = String(
    query.agecheckid || query.ageverifiedid || query.id || query.checkid || query.verificationId || body.agecheckid || body.avstatus?.agecheckid || body.id || body.verificationId || `AC-${Date.now()}`
  );
  const reference = String(
    query.reference || query.ref || query.userfield1 || query.orderRef || query.order_id || body.reference || body.ref || body.userfield1 || body.orderRef || ""
  );
  const email = String(
    query.email || query.userfield2 || body.email || body.userfield2 || ""
  );
  const approved = isApprovedStatus(status) || isApprovedStatus(statusText) || query.approved === "true" || query.agechecked === "approved" || query.verified === "true" || body.approved === true || body.verified === true || statusText.toLowerCase() === "approved" || req.path.includes("pass") || req.path.includes("success") || req.path.includes("complete");
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
      receivedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.removeHeader("X-Frame-Options");
  res.setHeader("Content-Security-Policy", "frame-ancestors * 'self'");
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
          .icon { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto; font-size: 22px; background: ${approved ? "#dcfce7" : "#fef3c7"}; color: ${approved ? "#15803d" : "#b45309"}; }
          h1 { font-size: 16px; margin: 0 0 6px 0; font-weight: 800; letter-spacing: -0.2px; }
          p { font-size: 12.5px; color: #64748b; line-height: 1.5; margin: 0; }
          .ref { font-family: monospace; font-size: 10.5px; color: #94a3b8; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="panel">
          <div class="icon">${approved ? "&#10003;" : "!"}</div>
          <h1>${approved ? "Age verified" : "Verification not completed"}</h1>
          <p>${approved ? "Returning you to checkout&hellip;" : "The 18+ check could not be confirmed. Close this panel and try again."}</p>
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
router20.all("/callback", handleCallback);
router20.all("/callback/", handleCallback);
router20.all("/webhook", handleCallback);
router20.all("/webhook/", handleCallback);
router20.all("/notification", handleCallback);
router20.all("/notification/", handleCallback);
router20.all("/notify", handleCallback);
router20.all("/notify/", handleCallback);
router20.all("/pass", handleCallback);
router20.all("/pass/", handleCallback);
router20.all("/success", handleCallback);
router20.all("/fail", handleCallback);
router20.all("/", handleCallback);
router20.all("", handleCallback);
var agechecked_default = router20;

// backend/routes/auth.ts
init_serverDb();
init_emailService();
init_adminAuth();
import { Router as Router18 } from "express";
var router21 = Router18();
function getRedirectUri(req) {
  const clientOrigin = req.query.origin || req.headers["x-client-origin"];
  const isLocalOrigin = Boolean(
    clientOrigin && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(clientOrigin.replace(/\/+$/, ""))
  );
  if (isLocalOrigin) {
    return `${clientOrigin.replace(/\/+$/, "")}/auth/google/callback`;
  }
  const envUrl = process.env.NEXTAUTH_URL || process.env.APP_URL;
  if (envUrl && !envUrl.includes("localhost") && envUrl !== "MY_APP_URL") {
    return `${envUrl.replace(/\/+$/, "")}/auth/google/callback`;
  }
  if (clientOrigin && (clientOrigin.startsWith("http://") || clientOrigin.startsWith("https://"))) {
    return `${clientOrigin.replace(/\/+$/, "")}/auth/google/callback`;
  }
  const host = req.get("x-forwarded-host") || req.get("host") || "localhost:3000";
  const isCloudHost = host.includes("run.app") || host.includes(".app");
  const proto = isCloudHost || req.get("x-forwarded-proto") === "https" || req.secure ? "https" : req.protocol || "http";
  return `${proto}://${host}/auth/google/callback`;
}
router21.get("/google/url", (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.OAUTH_CLIENT_ID || "";
    const redirectUri = getRedirectUri(req);
    if (!clientId) {
      return res.json({
        configured: false,
        message: "GOOGLE_CLIENT_ID environment variable is not configured.",
        redirectUri
      });
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account"
    });
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return res.json({
      configured: true,
      clientId,
      url,
      redirectUri
    });
  } catch (err) {
    console.error("[Google OAuth] Error generating Auth URL:", err);
    return res.status(500).json({ error: "Failed to generate Google auth URL" });
  }
});
router21.post("/google/verify", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const { accessToken, idToken } = req.body;
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : accessToken || idToken;
    if (!token) {
      return res.status(400).json({ error: "OAuth token missing in request." });
    }
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const googleUser = await userRes.json();
    if (!userRes.ok || !googleUser || !googleUser.email) {
      return res.status(401).json({ error: "Invalid or expired Google OAuth token." });
    }
    const emailTrim = googleUser.email.trim().toLowerCase();
    const customerName = googleUser.name || googleUser.given_name || emailTrim.split("@")[0];
    const picture = googleUser.picture || "";
    const customersList = await fetchResource("customers");
    let found = customersList.find((c) => c.email.toLowerCase() === emailTrim);
    if (found) {
      found.emailVerified = true;
      found.emailVerifiedAt = found.emailVerifiedAt || (/* @__PURE__ */ new Date()).toISOString();
      if (picture && !found.avatarUrl) found.avatarUrl = picture;
      if (googleUser.id) found.googleId = googleUser.id;
    } else {
      found = {
        id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: customerName,
        email: emailTrim,
        subscriptionStatus: "Not subscribed",
        location: "United Kingdom",
        ordersCount: 0,
        amountSpent: 0,
        addresses: ["United Kingdom"],
        wishlist: [],
        emailVerified: true,
        emailVerifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
        avatarUrl: picture,
        googleId: googleUser.id,
        referralCode: `POUCH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        storeCredit: 0
      };
      customersList.unshift(found);
      sendWelcomeEmail(emailTrim, customerName, found.referralCode).catch((e) => console.warn("Welcome email error:", e));
    }
    await saveResource("customers", customersList);
    const { passwordHash, ...safeCustomer } = found;
    return res.json({ success: true, customer: safeCustomer });
  } catch (err) {
    console.error("[Google OAuth Verify Error]", err);
    return res.status(500).json({ error: "Failed to verify Google authentication token." });
  }
});
async function handleGoogleOAuthCallback(req, res) {
  const { code, error } = req.query;
  if (error) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <body style="font-family: system-ui; padding: 20px; text-align: center;">
          <h3 style="color: #e11d48;">Google Sign-In Cancelled or Failed</h3>
          <p>${error}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${error}' }, '*');
              setTimeout(() => window.close(), 2000);
            }
          </script>
        </body>
      </html>
    `);
  }
  if (!code || typeof code !== "string") {
    return res.status(400).send("Authorization code missing.");
  }
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.OAUTH_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.OAUTH_CLIENT_SECRET || "";
    const redirectUri = getRedirectUri(req);
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[Google OAuth Token Error]", tokenData);
      throw new Error(tokenData.error_description || "Failed to obtain access token from Google");
    }
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const googleUser = await userRes.json();
    if (!googleUser || !googleUser.email) {
      throw new Error("Could not fetch user profile from Google");
    }
    const emailTrim = googleUser.email.trim().toLowerCase();
    const customerName = googleUser.name || googleUser.given_name || emailTrim.split("@")[0];
    const picture = googleUser.picture || "";
    const customersList = await fetchResource("customers");
    let found = customersList.find((c) => c.email.toLowerCase() === emailTrim);
    if (found) {
      found.emailVerified = true;
      found.emailVerifiedAt = found.emailVerifiedAt || (/* @__PURE__ */ new Date()).toISOString();
      if (picture && !found.avatarUrl) found.avatarUrl = picture;
      if (googleUser.id) found.googleId = googleUser.id;
      if (!found.referralCode) {
        found.referralCode = `POUCH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      }
    } else {
      found = {
        id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: customerName,
        email: emailTrim,
        subscriptionStatus: "Not subscribed",
        location: "United Kingdom",
        ordersCount: 0,
        amountSpent: 0,
        addresses: ["United Kingdom"],
        wishlist: [],
        emailVerified: true,
        emailVerifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
        avatarUrl: picture,
        googleId: googleUser.id,
        referralCode: `POUCH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        storeCredit: 0
      };
      customersList.unshift(found);
      sendWelcomeEmail(emailTrim, customerName, found.referralCode).catch((e) => console.warn("Welcome email error:", e));
    }
    await saveResource("customers", customersList);
    const { passwordHash, ...safeCustomer } = found;
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Sign-In Successful</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #0f172a; }
            .card { background: white; padding: 32px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); text-align: center; max-width: 360px; border: 1px solid #e2e8f0; }
            .check { width: 48px; h-48px; background: #dcfce7; color: #15803d; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px; }
            h2 { font-size: 18px; margin: 0 0 8px; font-weight: 700; }
            p { font-size: 13px; color: #64748b; margin: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="check">\u2713</div>
            <h2>Signed in as ${customerName}</h2>
            <p>Authentication complete. Returning to Pouch Supply...</p>
          </div>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_SUCCESS',
                  customer: ${JSON.stringify(safeCustomer)}
                }, '*');
                setTimeout(() => window.close(), 600);
              } else {
                window.location.href = '/';
              }
            } catch(e) {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("[Google OAuth Callback Error]", err);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <body style="font-family: system-ui; padding: 20px; text-align: center;">
          <h3 style="color: #e11d48;">Authentication Failed</h3>
          <p>${err.message || "An unexpected error occurred during Google authentication."}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${err.message || "Auth failed"}' }, '*');
            }
          </script>
        </body>
      </html>
    `);
  }
}
router21.get("/session", async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    let session = null;
    try {
      session = verifyCustomerToken(token);
    } catch (err) {
      if (err instanceof AdminAuthNotConfiguredError) {
        console.error("[Auth] Session lookup refused:", err.message);
        return res.status(503).json({ user: null, customer: null, code: "AUTH_NOT_CONFIGURED" });
      }
      throw err;
    }
    if (!session) {
      return res.json({ user: null, customer: null });
    }
    const customersList = await fetchResource("customers");
    const found = customersList.find(
      (c) => String(c?.email || "").toLowerCase() === session.sub
    );
    if (!found) {
      return res.json({ user: null, customer: null });
    }
    const { passwordHash, ...safeCustomer } = found;
    return res.json({
      user: {
        name: safeCustomer.name,
        email: safeCustomer.email,
        image: safeCustomer.avatarUrl
      },
      customer: safeCustomer
    });
  } catch (err) {
    return res.json({ user: null, customer: null });
  }
});
router21.post("/signout", (req, res) => {
  return res.json({ success: true, message: "Signed out successfully" });
});
router21.get("/providers", (req, res) => {
  return res.json({
    google: {
      id: "google",
      name: "Google",
      type: "oauth",
      signinUrl: "/api/auth/google/url",
      callbackUrl: "/auth/google/callback"
    }
  });
});
var auth_default = router21;

// serverApp.ts
init_cloudinary();
init_prisma();
init_requireAdmin();
async function createExpressApp() {
  const app = express();
  app.set("trust proxy", true);
  try {
    await Promise.race([
      Promise.all([fetchLayoutSettings(), fetchDevSettings()]),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Database settings hydration timed out")), 8e3))
    ]);
  } catch (err) {
  }
  app.use((req, res, next) => {
    if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
      return next();
    }
    express.json({
      limit: "1000mb",
      // Worldpay posts its webhooks under versioned vendor media types such as
      // application/vnd.worldpay.webhooks-v1.hal+json, not application/json.
      // express.json() matches only application/json by default, so it skipped
      // those bodies and left req.body as {} — the handler logged 15 receipts
      // with a null eventType and an empty rawBody, which is indistinguishable
      // from Worldpay sending nothing. Any +json structured-syntax suffix is
      // parsed here for that reason.
      type: ["application/json", "application/*+json"],
      verify: (req2, _res, buf) => {
        req2.rawBody = buf;
      }
    })(req, res, next);
  });
  app.use((req, res, next) => {
    if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
      return next();
    }
    express.urlencoded({ limit: "1000mb", extended: true })(req, res, next);
  });
  let uploadsPath = path4.join(process.cwd(), "uploads");
  try {
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      uploadsPath = "/tmp/uploads";
    }
    if (!fs4.existsSync(uploadsPath)) {
      fs4.mkdirSync(uploadsPath, { recursive: true });
    }
  } catch (err) {
    console.warn("[Uploads Setup] Failed to create uploads directory at", uploadsPath, err);
    uploadsPath = "/tmp/uploads";
    try {
      if (!fs4.existsSync(uploadsPath)) {
        fs4.mkdirSync(uploadsPath, { recursive: true });
      }
    } catch (tmpErr) {
      console.error("[Uploads Setup] Fatal: failed to create /tmp/uploads:", tmpErr);
    }
  }
  const serveMediaBuffer = (req, res, buffer, mimeType) => {
    const range = req.headers.range;
    const fileSize = buffer.length;
    if (range && (mimeType.startsWith("video/") || mimeType.startsWith("audio/"))) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      if (start >= fileSize || end >= fileSize) {
        res.status(416).setHeader("Content-Range", `bytes */${fileSize}`);
        return res.end();
      }
      const chunksize = end - start + 1;
      const chunk = buffer.subarray(start, end + 1);
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000"
      });
      return res.end(chunk);
    } else {
      res.writeHead(200, {
        "Content-Type": mimeType,
        "Content-Length": fileSize,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000"
      });
      return res.end(buffer);
    }
  };
  const handleUploadsFileRequest = async (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path4.join(uploadsPath, filename);
      if (fs4.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
      const dotIndex = filename.lastIndexOf(".");
      const id = dotIndex !== -1 ? filename.substring(0, dotIndex) : filename;
      const imgDoc = await getUploadedImage(filename) || await getUploadedImage(id);
      if (imgDoc && imgDoc.base64Data) {
        try {
          fs4.writeFileSync(filePath, Buffer.from(imgDoc.base64Data, "base64"));
          return res.sendFile(filePath);
        } catch (e) {
        }
        const imgBuffer = Buffer.from(imgDoc.base64Data, "base64");
        return serveMediaBuffer(req, res, imgBuffer, imgDoc.mimeType || "image/png");
      }
    } catch (err) {
      console.error("[Uploads] Error reading uploaded file:", err);
    }
    return res.status(404).send("File not found");
  };
  app.get("/uploads/:filename", handleUploadsFileRequest);
  app.get("/api/uploads/:filename", handleUploadsFileRequest);
  app.use("/uploads", express.static(uploadsPath));
  app.use("/api/uploads", express.static(uploadsPath));
  app.post("/api/upload", requireAdmin, async (req, res) => {
    try {
      const { data, filename, cloudName, apiKey, apiSecret, cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret } = req.body;
      if (!data) {
        return res.status(400).json({ error: "Missing data payload for upload." });
      }
      const passedCloudName = cloudName || cloudinaryCloudName;
      const passedApiKey = apiKey || cloudinaryApiKey;
      const passedApiSecret = apiSecret || cloudinaryApiSecret;
      if (passedCloudName) process.env.CLOUDINARY_CLOUD_NAME = String(passedCloudName).trim();
      if (passedApiKey) process.env.CLOUDINARY_API_KEY = String(passedApiKey).trim();
      if (passedApiSecret) process.env.CLOUDINARY_API_SECRET = String(passedApiSecret).trim();
      if (!isCloudinaryConfigured()) {
        try {
          await fetchLayoutSettings();
        } catch (e) {
        }
      }
      let base64String = data;
      let mimeType = "image/png";
      if (typeof data === "string" && data.startsWith("data:")) {
        const matches = data.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64String = matches[2];
        }
      }
      if (typeof base64String === "string" && base64String.includes(";base64,")) {
        base64String = base64String.split(";base64,").pop() || base64String;
      }
      base64String = (base64String || "").trim();
      const displayName = filename || `upload-${Date.now()}`;
      const isVideo = mimeType.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogg|avi|mkv)$/i.test(displayName);
      if (isCloudinaryConfigured()) {
        try {
          const fileBuffer = Buffer.from(base64String, "base64");
          const uploadResult = await uploadToCloudinary(fileBuffer, {
            folder: "storefront_media",
            originalFilename: displayName,
            resourceType: isVideo ? "video" : "auto"
          });
          const id2 = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const displaySize = uploadResult.fileSize > 1024 * 1024 ? `${(uploadResult.fileSize / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(uploadResult.fileSize / 1024)} KB`;
          let newFile = null;
          const entryResourceType = uploadResult.resourceType || (isVideo ? "video" : "image");
          const entryMimeType = mimeType || (isVideo ? "video/mp4" : "image/png");
          try {
            newFile = await prisma.fileEntry.create({
              data: {
                id: id2,
                publicId: uploadResult.publicId,
                url: uploadResult.secureUrl || uploadResult.url,
                secureUrl: uploadResult.secureUrl,
                resourceType: entryResourceType,
                format: uploadResult.format,
                width: uploadResult.width || null,
                height: uploadResult.height || null,
                fileSize: displaySize,
                size: displaySize,
                folder: uploadResult.folder,
                originalFilename: displayName,
                fileName: displayName,
                altText: displayName.split(".")[0] || "Uploaded Asset",
                dateAdded: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
                references: "Direct Upload",
                mimeType: entryMimeType
              }
            });
          } catch (dbErr) {
            newFile = {
              id: id2,
              publicId: uploadResult.publicId,
              url: uploadResult.secureUrl || uploadResult.url,
              secureUrl: uploadResult.secureUrl,
              fileName: displayName,
              altText: displayName.split(".")[0] || "Uploaded Asset",
              dateAdded: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
              mimeType: entryMimeType,
              resourceType: entryResourceType,
              size: displaySize,
              fileSize: displaySize,
              references: "Direct Upload"
            };
          }
          try {
            const currentFiles = await fetchResource("files");
            const currentArr = Array.isArray(currentFiles) ? currentFiles : [];
            const updatedFiles = [newFile, ...currentArr.filter((f) => f && f.url !== newFile.url)];
            await saveResource("files", updatedFiles);
          } catch (sErr) {
          }
          return res.json({
            url: newFile.url,
            secureUrl: newFile.secureUrl,
            publicId: newFile.publicId,
            id: newFile.id,
            fileName: displayName,
            mimeType: entryMimeType,
            resourceType: entryResourceType
          });
        } catch (cErr) {
          console.warn("[API Upload] Cloudinary upload failed, falling back to disk:", cErr?.message || cErr);
        }
      }
      const id = `file-${Date.now()}-${Math.floor(Math.random() * 1e5)}`;
      let extension = "png";
      if (filename && filename.includes(".")) {
        extension = filename.split(".").pop()?.toLowerCase() || "png";
      } else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
        extension = "jpg";
      } else if (mimeType.includes("mp4")) {
        extension = "mp4";
      }
      const filenameOnDisk = `${id}.${extension}`;
      const filePath = path4.join(uploadsPath, filenameOnDisk);
      try {
        fs4.writeFileSync(filePath, Buffer.from(base64String, "base64"));
      } catch (fsErr) {
        console.error("[API Upload] Failed to write file to local disk:", fsErr);
      }
      await saveUploadedImage(id, base64String, mimeType);
      const fileUrl = `/api/uploads/${filenameOnDisk}`;
      const rawBytes = Math.round(base64String.length * 0.75);
      const calculatedSize = rawBytes > 1024 * 1024 ? `${(rawBytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(rawBytes / 1024)} KB`;
      const isVid = mimeType.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogg|avi|mkv)$/i.test(filename || "");
      const diskEntry = {
        id,
        fileName: displayName,
        url: fileUrl,
        altText: displayName.split(".")[0] || "Uploaded Media Asset",
        mimeType: mimeType || (isVid ? "video/mp4" : "image/png"),
        resourceType: isVid ? "video" : "image",
        size: calculatedSize,
        fileSize: calculatedSize,
        references: "Direct Upload",
        dateAdded: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      };
      try {
        await prisma.fileEntry.create({
          data: diskEntry
        });
      } catch (fileRegErr) {
      }
      try {
        const currentFiles = await fetchResource("files");
        const currentArr = Array.isArray(currentFiles) ? currentFiles : [];
        const updatedFiles = [diskEntry, ...currentArr.filter((f) => f && f.url !== diskEntry.url)];
        await saveResource("files", updatedFiles);
      } catch (sErr) {
      }
      res.json({ url: fileUrl, id, fileName: displayName, mimeType: diskEntry.mimeType, resourceType: diskEntry.resourceType });
    } catch (err) {
      console.error("[API Upload] Fail:", err);
      res.status(500).json({ error: err.message || "Failed to process image upload" });
    }
  });
  app.get("/api/images/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const imgDoc = await getUploadedImage(id);
      if (!imgDoc) {
        return res.status(404).send("Media asset not found");
      }
      const imgBuffer = Buffer.from(imgDoc.base64Data, "base64");
      return serveMediaBuffer(req, res, imgBuffer, imgDoc.mimeType || "image/png");
    } catch (err) {
      res.status(500).send("Internal server error serving media");
    }
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.get("/api/status", requireAdmin, async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const status = await getConnectionStatus();
      if (status.status === "connected") {
        res.status(200).json({
          statusCode: 200,
          status: "connected",
          databaseUrlConfigured: true,
          provider: "Neon PostgreSQL",
          host: status.host || "Connected",
          database: status.database || "neondb",
          error: null,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      } else {
        res.status(200).json({
          statusCode: 500,
          status: status.status || "error",
          databaseUrlConfigured: !!process.env.DATABASE_URL,
          provider: "Neon PostgreSQL",
          host: status.host || "N/A",
          database: status.database || "N/A",
          error: status.error || "Database connection test failed.",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    } catch (err) {
      res.status(200).json({
        statusCode: 500,
        status: "error",
        databaseUrlConfigured: !!process.env.DATABASE_URL,
        provider: "Neon PostgreSQL",
        host: "N/A",
        database: "N/A",
        error: err?.message || String(err),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  app.get("/api/db-status", requireAdmin, async (req, res) => {
    try {
      await getDb();
    } catch (e) {
    }
    res.json(await getConnectionStatus());
  });
  app.get("/api/db-details", requireAdmin, async (req, res) => {
    try {
      const details = await getDatabaseDetails();
      res.json(details);
    } catch (err) {
      console.error("[API db-details] Error fetching DB details:", err);
      res.status(500).json({ error: err.message || "Failed to fetch database details" });
    }
  });
  app.post("/api/update-db-uri", requireAdmin, async (req, res) => {
    try {
      const { uri } = req.body;
      if (!uri) {
        return res.status(400).json({ error: "No connection string was provided." });
      }
      const updatedStatus = await updateDatabaseUrl(uri);
      res.json(updatedStatus);
    } catch (err) {
      console.error("[API update-db-uri] Error updating connection string:", err);
      res.status(500).json({ error: err.message || "Failed to update connection string" });
    }
  });
  app.post("/api/backup", requireAdmin, async (req, res) => {
    try {
      const name = req.body?.name || `Manual Backup ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`;
      const snapshot = await createDatabaseBackup(name);
      res.json({ success: true, backup: snapshot });
    } catch (err) {
      res.status(500).json({ error: err?.message || "Failed to create database backup" });
    }
  });
  app.get("/api/backup", requireAdmin, async (req, res) => {
    try {
      const list = await listDatabaseBackups();
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err?.message || "Failed to list database backups" });
    }
  });
  app.post("/api/backup/restore", requireAdmin, async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "Backup ID is required" });
      const success = await restoreDatabaseBackup(id);
      res.json({ success });
    } catch (err) {
      res.status(500).json({ error: err?.message || "Failed to restore database backup" });
    }
  });
  app.get("/api/db-diagnostics", requireAdmin, async (req, res) => {
    try {
      const isConnected = await getDb();
      if (!isConnected) {
        return res.json({ connected: false, error: "Database not connected" });
      }
      const [
        pagesCount,
        productsCount,
        collectionsCount,
        ordersCount,
        customersCount,
        blogsCount,
        discountsCount,
        filesCount,
        resourcesCount
      ] = await Promise.all([
        prisma.customPage.count().catch(() => 0),
        prisma.product.count().catch(() => 0),
        prisma.collection.count().catch(() => 0),
        prisma.order.count().catch(() => 0),
        prisma.customer.count().catch(() => 0),
        prisma.blogPost.count().catch(() => 0),
        prisma.discount.count().catch(() => 0),
        prisma.fileEntry.count().catch(() => 0),
        prisma.storeResource.count().catch(() => 0)
      ]);
      res.json({
        connected: true,
        counts: {
          customPages: pagesCount,
          products: productsCount,
          collections: collectionsCount,
          orders: ordersCount,
          customers: customersCount,
          blogs: blogsCount,
          discounts: discountsCount,
          files: filesCount,
          storeResources: resourcesCount
        }
      });
    } catch (err) {
      res.status(500).json({ connected: false, error: err?.message });
    }
  });
  const handleTestCloudinary = async (req, res) => {
    try {
      let cloudName = req.body?.cloudName || process.env.CLOUDINARY_CLOUD_NAME;
      let apiKey = req.body?.apiKey || process.env.CLOUDINARY_API_KEY;
      let apiSecret = req.body?.apiSecret || process.env.CLOUDINARY_API_SECRET;
      if (!cloudName || !apiKey || !apiSecret) {
        try {
          const layout = await fetchLayoutSettings();
          if (layout) {
            cloudName = cloudName || layout.cloudinaryCloudName;
            apiKey = apiKey || layout.cloudinaryApiKey;
            apiSecret = apiSecret || layout.cloudinaryApiSecret;
          }
        } catch (e) {
        }
      }
      const hasCloudName = Boolean(cloudName && String(cloudName).trim().length > 0);
      const hasApiKey = Boolean(apiKey && String(apiKey).trim().length > 0);
      const hasApiSecret = Boolean(apiSecret && String(apiSecret).trim().length > 0);
      const isConfigured = hasCloudName && hasApiKey && hasApiSecret;
      if (isConfigured) {
        process.env.CLOUDINARY_CLOUD_NAME = cloudName;
        process.env.CLOUDINARY_API_KEY = apiKey;
        process.env.CLOUDINARY_API_SECRET = apiSecret;
      }
      res.json({
        success: isConfigured,
        configured: isConfigured,
        hasCloudName,
        hasApiKey,
        hasApiSecret,
        cloudName: cloudName ? String(cloudName).trim() : null,
        apiKeyMasked: apiKey ? `${String(apiKey).substring(0, 4)}***` : null,
        message: isConfigured ? "Cloudinary credentials are fully valid and configured." : "Cloudinary environment variables missing or incomplete."
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        configured: false,
        error: err?.message || "Error testing Cloudinary configuration"
      });
    }
  };
  app.get("/api/test-cloudinary", requireAdmin, handleTestCloudinary);
  app.post("/api/test-cloudinary", requireAdmin, handleTestCloudinary);
  app.get("/api/layoutsettings", async (req, res) => {
    try {
      const data = await fetchLayoutSettings();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to load layout settings" });
    }
  });
  app.post("/api/layoutsettings", requireAdmin, async (req, res) => {
    try {
      const saved = await saveLayoutSettings(req.body);
      res.json({ status: "success", data: saved });
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to save layout settings" });
    }
  });
  app.get("/api/devsettings", async (req, res) => {
    try {
      const data = await fetchDevSettings();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to load dev settings" });
    }
  });
  app.post("/api/devsettings", requireAdmin, async (req, res) => {
    try {
      const saved = await saveDevSettings(req.body);
      res.json({ status: "success", data: saved });
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to save dev settings" });
    }
  });
  app.post("/api/send-order-confirmation", async (req, res) => {
    console.log("[Order Confirmation Email] Received dispatch for order:", req.body?.id || req.body?.orderId || "New Order");
    try {
      const { sendOrderConfirmationEmail: sendOrderConfirmationEmail2 } = await Promise.resolve().then(() => (init_emailService(), emailService_exports));
      const result = await sendOrderConfirmationEmail2(req.body);
      res.json({
        success: true,
        message: "Order confirmation email sent successfully.",
        result,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      console.error("[Order Confirmation Email] Error sending confirmation:", err);
      res.json({
        success: true,
        message: "Order confirmation queued (simulated/error fallback).",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  app.use("/api/media", requireAdmin, media_default);
  app.use("/api/products", products_default);
  app.use("/api/collections", collections_default);
  app.use("/api/orders", orders_default);
  app.use("/api/recycle-bin", recycleBin_default);
  app.use("/api/analytics", analytics_default);
  app.use("/api/site-status", siteStatus_default);
  app.use("/api/files", files_default);
  app.use("/api/customers", customers_default);
  app.use("/api/discounts", discounts_default);
  app.use("/api/custompages", customPages_default);
  app.use("/api/blogs", blogs_default);
  app.use("/api/worldpay/subscriptions", subscriptions_default);
  app.use("/api/subscriptions", subscriptions_default);
  app.use("/api/worldpay", worldpay_default);
  app.use("/api/folder-structure", requireAdmin, structure_default);
  app.use("/api/email", email_default);
  app.use("/api/klaviyo", klaviyo_default);
  app.use("/api/royalmail", royalMail_default);
  app.use("/api/royal-mail", royalMail_default);
  app.all(["/api/agechecked", "/api/agechecked/", "/api/agechecked/callback", "/api/agechecked/callback/"], (req, res, next) => {
    if (req.path === "/api/agechecked" || req.path === "/api/agechecked/" || req.path === "/api/agechecked/callback" || req.path === "/api/agechecked/callback/") {
      return handleCallback(req, res);
    }
    next();
  });
  app.use("/api/agechecked", agechecked_default);
  app.post("/api/create-order", (req, res, next) => {
    req.url = "/create-order";
    return royalMail_default(req, res, next);
  });
  app.use("/api/contact-messages", contactMessages_default);
  app.use("/api/auth", auth_default);
  app.get(["/auth/google/callback", "/auth/google/callback/"], handleGoogleOAuthCallback);
  app.all("/api/*", (req, res) => {
    res.status(404).json({
      success: false,
      error: "API endpoint not found",
      message: `No route found for ${req.method} ${req.originalUrl}`
    });
  });
  app.use((err, req, res, next) => {
    console.error("[Express Error Handler]", err);
    if (req.originalUrl.startsWith("/api") || req.url.startsWith("/api")) {
      return res.status(err.status || 500).json({
        success: false,
        error: err.message || "Internal Server Error",
        message: err.message || "An unexpected server error occurred"
      });
    }
    next(err);
  });
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom"
    });
    app.use(vite.middlewares);
    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      const lastSegment = url.split("/").pop() || "";
      if (url.startsWith("/api") || lastSegment.includes(".")) {
        return next();
      }
      try {
        const fs5 = await import("fs");
        let html = fs5.readFileSync(path4.resolve(process.cwd(), "index.html"), "utf-8");
        html = await vite.transformIndexHtml(url, html);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path4.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const url = req.originalUrl;
      const lastSegment = url.split("/").pop() || "";
      if (url.startsWith("/api") || lastSegment.includes(".")) {
        return res.status(404).send("API or File Asset Not Found");
      }
      const indexPath = path4.join(distPath, "index.html");
      res.sendFile(indexPath, (err) => {
        if (err) {
          res.status(500).send("Internal Server Error: Missing compiled static resources.");
        }
      });
    });
  }
  try {
    const { startSubscriptionRenewalWorker: startSubscriptionRenewalWorker2 } = await Promise.resolve().then(() => (init_subscriptionCron(), subscriptionCron_exports));
    startSubscriptionRenewalWorker2(5 * 60 * 1e3);
  } catch (workerErr) {
    console.warn("[Subscription Cron] Failed to initialize subscription worker:", workerErr);
  }
  return app;
}

// api-entry.ts
var appPromise = createExpressApp();
async function handler(req, res) {
  const app = await appPromise;
  return app(req, res);
}
export {
  handler as default
};
