import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { prisma } from './src/lib/prisma';

dotenv.config();

import { 
  INITIAL_PRODUCTS, INITIAL_COLLECTIONS, INITIAL_ORDERS, INITIAL_FILES, 
  INITIAL_CUSTOMERS, INITIAL_DISCOUNTS, DEFAULT_PAGES, INITIAL_BLOGS 
} from './src/initialData';
import { DEFAULT_DEV_SETTINGS } from './src/data/initialDevSettings';

export interface DbStatus {
  status: 'connected' | 'error' | 'not-configured' | 'pending';
  provider: 'Neon PostgreSQL';
  error?: string;
  host?: string;
  database?: string;
}

// In-Memory state fallback cache
const memoryCache: Record<string, any[]> = {
  products: [...INITIAL_PRODUCTS],
  collections: [...INITIAL_COLLECTIONS],
  orders: [...INITIAL_ORDERS],
  files: [...INITIAL_FILES],
  customers: [...INITIAL_CUSTOMERS],
  discounts: [...INITIAL_DISCOUNTS],
  customPages: [...DEFAULT_PAGES],
  blogs: [...INITIAL_BLOGS],
};

/**
 * The local mirror of the store.
 *
 * Defaults to local_store_data.json beside the running app. LOCAL_STORE_PATH
 * redirects it, which is what lets a test drive the real app against a throwaway
 * store instead of this file — pointing the whole process at a different working
 * directory is the alternative, and on Windows that trips a libuv file-watcher
 * assertion mid-run.
 */
const BACKUP_FILE_PATH = process.env.LOCAL_STORE_PATH
  ? path.resolve(process.env.LOCAL_STORE_PATH)
  : path.join(process.cwd(), 'local_store_data.json');

function loadMemoryCacheFromBackup() {
  try {
    if (fs.existsSync(BACKUP_FILE_PATH)) {
      const raw = fs.readFileSync(BACKUP_FILE_PATH, 'utf8');
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        for (const key of Object.keys(data)) {
          if (Array.isArray(data[key]) && data[key].length > 0) {
            memoryCache[key] = data[key];
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Local Backup] Could not load local_store_data.json backup:', err);
  }
}

function persistMemoryCacheToBackup() {
  try {
    // Never let an empty cache overwrite a populated snapshot. When Neon is
    // unreachable (it auto-suspends on the free tier) the cache starts empty,
    // and writing that out would destroy the local copy of the whole store.
    const populatedKeys = Object.keys(memoryCache).filter(
      k => Array.isArray(memoryCache[k]) && memoryCache[k].length > 0
    );
    if (populatedKeys.length === 0) {
      return;
    }

    const payload = JSON.stringify(memoryCache, null, 2);
    if (fs.existsSync(BACKUP_FILE_PATH)) {
      const existing = fs.readFileSync(BACKUP_FILE_PATH, 'utf8');
      if (existing === payload) {
        return;
      }
    }
    fs.writeFileSync(BACKUP_FILE_PATH, payload, 'utf8');
  } catch (err) {
    console.warn('[Local Backup] Could not write to local_store_data.json backup:', err);
  }
}

// The database is authoritative when it is reachable. The local snapshot is
// seeded regardless so that a suspended or unreachable Neon instance degrades
// to the last known good data instead of an empty store — hydration overwrites
// it as soon as the connection succeeds.
loadMemoryCacheFromBackup();

let isTablesInitialized = false;

export async function ensureNeonTablesExist(): Promise<void> {
  if (isTablesInitialized) return;
  try {
    // 1. Central Key-Value Store Resources & Settings
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

    // 2. Custom Pages & Page Builder
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

    // 3. Products & Collections
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

    // 4. File Entry (Media Manager with Cloudinary synchronization)
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

    // 5. Orders, Customers & Subscriptions
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

    // The CREATE above only runs on a fresh database, so a column added after
    // the table already existed has to be applied separately or every write of
    // it is discarded by Postgres. `worldpayTokenHref` holds the stored-card
    // token Worldpay returns on the tokenCreated webhook — without it no
    // subscription can present a card on its renewal.
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "worldpayTokenHref" TEXT;
    `);

    // 6. Blog Posts, Discounts, Layout & Analytics
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

    // Centralised integration settings — see prisma/migrations/20261106_integration_settings.
    // Run here as well so a deployment that never ran the migration by hand still works.
    try {
      const migrationSql = fs.readFileSync(
        path.join(process.cwd(), 'prisma', 'migrations', '20261106_integration_settings', 'migration.sql'),
        'utf8'
      );
      const statements = migrationSql
        .split(/;\s*$/m)
        .map(s => s.split('\n').filter(l => !l.trim().startsWith('--')).join('\n').trim())
        .filter(Boolean);
      for (const stmt of statements) await prisma.$executeRawUnsafe(stmt);
    } catch (intErr) {
      // The SQL file is not bundled on every platform; fall back to the minimal inline form.
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "IntegrationSetting" (
          "id" TEXT PRIMARY KEY, "enabled" BOOLEAN NOT NULL DEFAULT false, "mode" TEXT NOT NULL DEFAULT 'test',
          "config" JSONB NOT NULL DEFAULT '{}', "secrets" JSONB NOT NULL DEFAULT '{}',
          "status" TEXT NOT NULL DEFAULT 'not_configured', "lastError" TEXT, "lastTestedAt" TIMESTAMP(3),
          "lastTestResult" JSONB, "updatedBy" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "IntegrationAuditLog" (
          "id" TEXT PRIMARY KEY, "integrationId" TEXT NOT NULL, "action" TEXT NOT NULL, "actor" TEXT,
          "changedFields" TEXT[] DEFAULT ARRAY[]::TEXT[], "details" JSONB,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    isTablesInitialized = true;
  } catch (err) {
    console.warn('[Neon Table Setup] Warning: Table initialization check encountered error:', err);
  }
}

/**
 * Hydrates the in-memory cache directly from the Neon PostgreSQL database on server boot.
 * This guarantees the database is the primary source of truth and prevents any stale
 * local files from overwriting newly created or restored pages.
 */
export async function hydrateMemoryCacheFromDatabase(): Promise<void> {
  const isConnected = await getDb();
  if (!isConnected) {
    console.log('[Database Hydration] Database is offline or not configured. Using local backup state.');
    return;
  }

  try {
    await ensureNeonTablesExist();
    console.log('[Database Hydration] Syncing memory cache with Neon PostgreSQL database...');

    const resources = ['customPages', 'products', 'collections', 'orders', 'files', 'customers', 'discounts', 'blogs'];
    for (const resName of resources) {
      const records = await prisma.storeResource.findMany({
        where: { resource: resName },
        orderBy: { createdAt: 'asc' }
      });
      const directList = await fetchFromPrismaModel(resName);

      const mergedMap = new Map<string, any>();
      for (const r of (records || [])) {
        if (r && r.data) {
          const item = r.data as any;
          const key = String(item.id || item.slug || item.orderId || '');
          if (key) mergedMap.set(key, item);
        }
      }
      for (const item of directList) {
        if (!item) continue;
        const key = String(item.id || item.slug || item.orderId || '');
        if (key) {
          if (!mergedMap.has(key)) {
            mergedMap.set(key, item);
          } else {
            const existing = mergedMap.get(key);
            let merged = { ...existing, ...item };
            if (resName === 'customPages' || resName === 'custompages') {
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

    // Persist current synchronized state to local backup JSON
    persistMemoryCacheToBackup();
    console.log('[Database Hydration] Successfully hydrated memory cache from Neon PostgreSQL.');
  } catch (err: any) {
    console.error('[Database Hydration] Error during startup hydration from Neon DB:', err?.message || err);
  }
}

// Automatically trigger startup hydration
ensureNeonTablesExist().then(() => {
  hydrateMemoryCacheFromDatabase().catch(() => {});
}).catch(() => {});

function getHostFromDatabaseUrl(urlStr?: string): { host: string; database: string } {
  if (!urlStr) return { host: 'N/A', database: 'N/A' };
  try {
    const cleaned = urlStr.trim().replace(/^["']|["']$/g, '');
    const parsed = new URL(cleaned);
    return {
      host: parsed.hostname || 'N/A',
      database: parsed.pathname.replace(/^\//, '') || 'N/A'
    };
  } catch (e) {
    return { host: 'N/A', database: 'N/A' };
  }
}

export async function testNeonConnection(): Promise<DbStatus> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return {
      status: 'not-configured',
      provider: 'Neon PostgreSQL',
      error: 'DATABASE_URL environment variable is not configured.'
    };
  }

  const { host, database } = getHostFromDatabaseUrl(dbUrl);

  try {
    await prisma.$queryRaw`SELECT 1`;
    await ensureNeonTablesExist();
    return {
      status: 'connected',
      provider: 'Neon PostgreSQL',
      host,
      database
    };
  } catch (err: any) {
    return {
      status: 'error',
      provider: 'Neon PostgreSQL',
      host,
      database,
      error: err?.message || String(err)
    };
  }
}

export async function getConnectionStatus(): Promise<DbStatus> {
  return await testNeonConnection();
}

export async function getDatabaseDetails(): Promise<any> {
  const dbUrl = process.env.DATABASE_URL;
  const { host, database } = getHostFromDatabaseUrl(dbUrl);

  try {
    if (!dbUrl) {
      return {
        provider: 'Neon PostgreSQL',
        status: 'not-configured',
        host: 'N/A',
        database: 'N/A',
        uriHost: 'N/A',
        dbName: 'N/A',
        collections: [],
        models: [],
        error: 'DATABASE_URL is missing'
      };
    }

    const versionResult: any[] = await prisma.$queryRaw`SELECT version()`;
    const version = versionResult[0]?.version || 'PostgreSQL (Neon)';

    let collectionsList: { name: string; count: number }[] = [];
    try {
      await ensureNeonTablesExist();
      const grouped = await prisma.storeResource.groupBy({
        by: ['resource'],
        _count: { _all: true }
      });
      collectionsList = grouped.map(g => ({
        name: g.resource,
        count: g._count._all
      }));
    } catch (gErr) {
      console.warn('[getDatabaseDetails] Failed grouping resources:', gErr);
    }

    const modelsList = [
      'SystemStatus', 'StoreResource', 'StoreSetting', 'Product', 
      'Collection', 'FileEntry', 'Order', 'CustomPage', 'Customer', 
      'BlogPost', 'Discount', 'LayoutSetting'
    ];

    return {
      provider: 'Neon PostgreSQL',
      status: 'connected',
      host,
      database,
      uriHost: host,
      dbName: database,
      version,
      orm: 'Prisma',
      collections: collectionsList,
      models: modelsList
    };
  } catch (err: any) {
    return {
      provider: 'Neon PostgreSQL',
      status: 'error',
      host,
      database,
      uriHost: host,
      dbName: database,
      collections: [],
      models: [],
      error: err?.message || String(err),
      orm: 'Prisma'
    };
  }
}

export async function updateDatabaseUrl(newUrl: string): Promise<DbStatus> {
  const trimmed = newUrl.trim();
  process.env.DATABASE_URL = trimmed;
  isTablesInitialized = false;

  try {
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const regex = /^DATABASE_URL\s*=\s*.*$/m;
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `DATABASE_URL="${trimmed}"`);
    } else {
      envContent = `${envContent.trim()}\nDATABASE_URL="${trimmed}"\n`;
    }
    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
  } catch (err) {
    console.warn('[Database Config] Failed to persist DATABASE_URL to .env:', err);
  }

  return await testNeonConnection();
}

export async function getDb(): Promise<boolean> {
  const status = await testNeonConnection();
  return status.status === 'connected';
}

/**
 * Resources a whole-list save is never allowed to delete from.
 *
 * saveResource() used to treat the posted array as the complete truth and
 * delete every row whose id was absent from it. That is correct for a
 * catalogue the admin edits as a whole, but catastrophic for transactional
 * records: an admin tab holding an order list loaded ten minutes ago would,
 * on Save, delete every order placed since it loaded - including orders a
 * customer had just paid for. Rows here are only ever created or updated by a
 * list save; removing one goes through deleteSingleItem (DELETE /api/:id).
 */
const LIST_SAVE_NEVER_DELETES = new Set(['orders', 'customers', 'subscriptions', 'pending_checkouts', 'email_logs', 'klaviyo_logs']);

function isDeleteProtected(resource: string): boolean {
  return LIST_SAVE_NEVER_DELETES.has(String(resource || '').toLowerCase());
}

function normalizeResourceName(resource: string): string {
  if (!resource) return resource;
  const lower = resource.toLowerCase();
  if (lower === 'custompages') return 'customPages';
  return resource;
}

async function syncToPrismaModel(resource: string, item: any): Promise<void> {
  if (!item) return;
  const id = String(item.id || item.slug || `item-${Date.now()}-${Math.random()}`);
  const norm = resource.toLowerCase();

  try {
    if (norm === 'products') {
      await prisma.product.upsert({
        where: { id },
        update: {
          title: item.title || 'Untitled Product',
          description: item.description || null,
          price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
          compareAtPrice: typeof item.compareAtPrice === 'number' ? item.compareAtPrice : parseFloat(item.compareAtPrice) || 0,
          inventory: typeof item.inventory === 'number' ? item.inventory : parseInt(item.inventory) || 0,
          sku: item.sku || null,
          category: item.category || null,
          vendor: item.vendor || null,
          status: item.status || 'Active',
          image: item.image || null,
          weight: typeof item.weight === 'number' ? item.weight : parseFloat(item.weight) || 0,
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
          title: item.title || 'Untitled Product',
          description: item.description || null,
          price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
          compareAtPrice: typeof item.compareAtPrice === 'number' ? item.compareAtPrice : parseFloat(item.compareAtPrice) || 0,
          inventory: typeof item.inventory === 'number' ? item.inventory : parseInt(item.inventory) || 0,
          sku: item.sku || null,
          category: item.category || null,
          vendor: item.vendor || null,
          status: item.status || 'Active',
          image: item.image || null,
          weight: typeof item.weight === 'number' ? item.weight : parseFloat(item.weight) || 0,
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
    } else if (norm === 'collections') {
      const colSlug = item.slug || id;
      try {
        await prisma.collection.upsert({
          where: { id },
          update: {
            title: item.title || 'Untitled Collection',
            description: item.description || null,
            type: item.type || 'Manual',
            image: item.image || null,
            productIds: Array.isArray(item.productIds) ? item.productIds : [],
            slug: colSlug,
            seoTitle: item.seoTitle || null,
            seoDescription: item.seoDescription || null,
            data: item
          },
          create: {
            id,
            title: item.title || 'Untitled Collection',
            description: item.description || null,
            type: item.type || 'Manual',
            image: item.image || null,
            productIds: Array.isArray(item.productIds) ? item.productIds : [],
            slug: colSlug,
            seoTitle: item.seoTitle || null,
            seoDescription: item.seoDescription || null,
            data: item
          }
        });
      } catch (colErr: any) {
        if (colErr?.code === 'P2002') {
          await prisma.collection.upsert({
            where: { id },
            update: { slug: `${colSlug}-${id}`, data: item },
            create: { id, title: item.title || 'Untitled Collection', slug: `${colSlug}-${id}`, data: item }
          }).catch(() => {});
        }
      }
    } else if (norm === 'blogs') {
      const blogSlug = item.slug ? String(item.slug).trim() : id;
      const cleanContent = typeof item.content === 'string' ? item.content : (typeof item.body === 'string' ? item.body : (item.content ? String(item.content) : ''));
      const blogData = {
        title: item.title || 'Untitled Blog',
        slug: blogSlug,
        excerpt: item.excerpt || null,
        content: cleanContent,
        image: item.image || null,
        author: item.author || null,
        category: item.category || null,
        status: item.status || 'Active',
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
      } catch (bErr: any) {
        if (bErr?.code === 'P2002') {
          const fallbackSlug = `${blogSlug}-${String(id).slice(-6)}`;
          await prisma.blogPost.upsert({
            where: { id },
            update: { ...blogData, slug: fallbackSlug },
            create: { id, ...blogData, slug: fallbackSlug }
          }).catch((e: any) => console.warn(`[BlogPost Fallback Upsert] warning:`, e?.message));
        } else {
          console.warn(`[BlogPost Sync] warning:`, bErr?.message);
        }
      }
    } else if (norm === 'discounts') {
      await prisma.discount.upsert({
        where: { id },
        update: {
          title: item.title || item.code || 'Discount',
          status: item.status || 'Active',
          method: item.method || 'Code',
          eligibility: item.eligibility || 'All',
          type: item.type || 'Percentage',
          used: typeof item.used === 'number' ? item.used : 0,
          details: item.details || null,
          data: item
        },
        create: {
          id,
          title: item.title || item.code || 'Discount',
          status: item.status || 'Active',
          method: item.method || 'Code',
          eligibility: item.eligibility || 'All',
          type: item.type || 'Percentage',
          used: typeof item.used === 'number' ? item.used : 0,
          details: item.details || null,
          data: item
        }
      });
    } else if (norm === 'customers') {
      const emailVal = (item.email && item.email.trim()) ? item.email.trim().toLowerCase() : `cust-${id}@pouch-supply.com`;
      try {
        await prisma.customer.upsert({
          where: { email: emailVal },
          update: {
            name: item.name || 'Customer',
            subscriptionStatus: item.subscriptionStatus || 'Not subscribed',
            location: item.location || null,
            ordersCount: typeof item.ordersCount === 'number' ? item.ordersCount : 0,
            amountSpent: typeof item.amountSpent === 'number' ? item.amountSpent : 0,
            addresses: Array.isArray(item.addresses) ? item.addresses : [],
            wishlist: Array.isArray(item.wishlist) ? item.wishlist : [],
            referralCode: item.referralCode || null,
            storeCredit: typeof item.storeCredit === 'number' ? item.storeCredit : 0,
            data: item
          },
          create: {
            id,
            name: item.name || 'Customer',
            email: emailVal,
            subscriptionStatus: item.subscriptionStatus || 'Not subscribed',
            location: item.location || null,
            ordersCount: typeof item.ordersCount === 'number' ? item.ordersCount : 0,
            amountSpent: typeof item.amountSpent === 'number' ? item.amountSpent : 0,
            addresses: Array.isArray(item.addresses) ? item.addresses : [],
            wishlist: Array.isArray(item.wishlist) ? item.wishlist : [],
            referralCode: item.referralCode || null,
            storeCredit: typeof item.storeCredit === 'number' ? item.storeCredit : 0,
            data: item
          }
        });
      } catch (cErr: any) {
        if (cErr?.code === 'P2002') {
          const safeEmail = `cust-${id}@pouch-supply.com`;
          await prisma.customer.upsert({
            where: { id },
            update: {
              name: item.name || 'Customer',
              email: safeEmail,
              subscriptionStatus: item.subscriptionStatus || 'Not subscribed',
              location: item.location || null,
              ordersCount: typeof item.ordersCount === 'number' ? item.ordersCount : 0,
              amountSpent: typeof item.amountSpent === 'number' ? item.amountSpent : 0,
              addresses: Array.isArray(item.addresses) ? item.addresses : [],
              wishlist: Array.isArray(item.wishlist) ? item.wishlist : [],
              referralCode: item.referralCode || null,
              storeCredit: typeof item.storeCredit === 'number' ? item.storeCredit : 0,
              data: item
            },
            create: {
              id,
              name: item.name || 'Customer',
              email: safeEmail,
              subscriptionStatus: item.subscriptionStatus || 'Not subscribed',
              location: item.location || null,
              ordersCount: typeof item.ordersCount === 'number' ? item.ordersCount : 0,
              amountSpent: typeof item.amountSpent === 'number' ? item.amountSpent : 0,
              addresses: Array.isArray(item.addresses) ? item.addresses : [],
              wishlist: Array.isArray(item.wishlist) ? item.wishlist : [],
              referralCode: item.referralCode || null,
              storeCredit: typeof item.storeCredit === 'number' ? item.storeCredit : 0,
              data: item
            }
          }).catch(e => console.warn('[Prisma Customer Sync] Fallback error:', e?.message));
        } else {
          console.warn('[Prisma Customer Sync] Warning:', cErr?.message);
        }
      }
    } else if (norm === 'orders') {
      // One shared, schema-checked writer for the Order table - see
      // src/lib/orderRow.ts. This branch used to list the columns by hand and
      // omitted isSubscription, subscriptionDetails, subtotal, shippingCost,
      // trackingNumber and royalMailOrderId, so every order it wrote was a
      // partial row that disagreed with the StoreResource copy.
      const { upsertOrderRow } = await import('./src/lib/orderRow');
      await upsertOrderRow(item);
    } else if (norm === 'custompages' || norm === 'pages') {
      const pageSlug = item.slug || id;
      const pageSections = Array.isArray(item.sections) ? item.sections : [];
      try {
        await prisma.customPage.upsert({
          where: { id },
          update: {
            title: item.title || 'Untitled Page',
            slug: pageSlug,
            visibility: item.visibility || 'Visible',
            isHomepage: Boolean(item.isHomepage),
            sections: pageSections,
            data: { ...item, sections: pageSections }
          },
          create: {
            id,
            title: item.title || 'Untitled Page',
            slug: pageSlug,
            visibility: item.visibility || 'Visible',
            isHomepage: Boolean(item.isHomepage),
            sections: pageSections,
            data: { ...item, sections: pageSections }
          }
        });
      } catch (pErr: any) {
        if (pErr?.code === 'P2002') {
          await prisma.customPage.upsert({
            where: { id },
            update: { slug: `${pageSlug}-${id}`, sections: pageSections, data: { ...item, sections: pageSections } },
            create: { id, title: item.title || 'Untitled Page', slug: `${pageSlug}-${id}`, sections: pageSections, data: { ...item, sections: pageSections } }
          }).catch(() => {});
        }
      }
    } else if (norm === 'analytics' || norm === 'analyticsrecords' || norm === 'analyticsrecord') {
      await prisma.analyticsRecord.upsert({
        where: { id },
        update: {
          metric: item.metric || 'page_view',
          value: typeof item.value === 'number' ? item.value : parseFloat(item.value) || 1,
          period: item.period || null,
          metadata: item.metadata || item,
        },
        create: {
          id,
          metric: item.metric || 'page_view',
          value: typeof item.value === 'number' ? item.value : parseFloat(item.value) || 1,
          period: item.period || null,
          metadata: item.metadata || item,
        }
      });
    } else if (norm === 'files' || norm === 'fileentry' || norm === 'fileentries') {
      if (item.url) {
        const sizeVal = item.size ?? item.fileSize;
        const sizeStr = typeof sizeVal === 'number'
          ? (sizeVal > 1024 * 1024 ? `${(sizeVal / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(sizeVal / 1024)} KB`)
          : (sizeVal ? String(sizeVal) : null);

        const rawPublicId = item.publicId;
        const publicIdStr = (rawPublicId && typeof rawPublicId === 'string' && rawPublicId.trim() !== '')
          ? rawPublicId.trim()
          : null;

        const fileData = {
          fileName: item.fileName || item.originalFilename || 'Media Asset',
          altText: item.altText ? String(item.altText) : 'Media Asset',
          size: sizeStr,
          fileSize: sizeStr,
          references: item.references ? String(item.references) : 'Direct Upload',
          url: String(item.url),
          secureUrl: item.secureUrl ? String(item.secureUrl) : String(item.url),
          mimeType: item.mimeType ? String(item.mimeType) : null,
          publicId: publicIdStr,
          resourceType: item.resourceType ? String(item.resourceType) : 'image',
          format: item.format ? String(item.format) : null,
          folder: item.folder ? String(item.folder) : 'storefront_media',
          width: typeof item.width === 'number' ? item.width : (parseInt(String(item.width), 10) || null),
          height: typeof item.height === 'number' ? item.height : (parseInt(String(item.height), 10) || null),
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
        } catch (upsertErr: any) {
          if (upsertErr?.code === 'P2002') {
            await prisma.fileEntry.upsert({
              where: { id },
              update: { ...fileData, publicId: null },
              create: {
                id,
                ...fileData,
                publicId: null
              }
            }).catch(() => {});
          }
        }
      }
    } else if (norm === 'subscriptions' || norm === 'subscription') {
      // One shared, schema-checked writer - see src/lib/subscriptionRow.ts.
      // The hand-listed columns here dropped items, cansCount, itemPrice,
      // shippingCost, shippingAddress, deliveryMethod and sourceOrderId, so the
      // typed row could not reproduce the box or the shipping charge, and
      // customerId was written unchecked against the Customer foreign key.
      const { upsertSubscriptionRow } = await import('./src/lib/subscriptionRow');
      await upsertSubscriptionRow(item);
    }
  } catch (mErr: any) {
    console.warn(`[Prisma Model Sync] ${norm} sync warning:`, mErr?.message);
  }
}

async function fetchFromPrismaModel(resource: string): Promise<any[]> {
  const norm = resource.toLowerCase();
  try {
    if (norm === 'orders') {
      const dbOrders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
      return dbOrders.map(o => {
        const itemData = (o.data && typeof o.data === 'object' && !Array.isArray(o.data)) ? (o.data as object) : {};
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
          createdAt: o.createdAt ? o.createdAt.toISOString() : undefined
        };
      });
    } else if (norm === 'subscriptions' || norm === 'subscription') {
      const items = await prisma.subscription.findMany({ orderBy: { createdAt: 'desc' } });
      return items.map(s => ({
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
        ...(s.sourceOrderId ? { sourceOrderId: s.sourceOrderId } : {}),
        ...(s.items ? { items: s.items } : {}),
        ...(s.itemPrice !== null && s.itemPrice !== undefined ? { itemPrice: Number(s.itemPrice) } : {}),
        ...(s.shippingCost !== null && s.shippingCost !== undefined ? { shippingCost: Number(s.shippingCost) } : {}),
        ...(s.shippingAddress ? { shippingAddress: s.shippingAddress } : {}),
        ...(s.deliveryMethod ? { deliveryMethod: s.deliveryMethod } : {}),
        ...(s.cansCount !== null && s.cansCount !== undefined ? { cansCount: s.cansCount } : {})
      }));
    } else if (norm === 'products') {
      const items = await prisma.product.findMany();
      return items.map(p => (p.data && typeof p.data === 'object') ? { ...(p.data as object), id: p.id } : p);
    } else if (norm === 'collections') {
      const items = await prisma.collection.findMany();
      return items.map(c => (c.data && typeof c.data === 'object') ? { ...(c.data as object), id: c.id } : c);
    } else if (norm === 'blogs') {
      const items = await prisma.blogPost.findMany();
      return items.map(b => (b.data && typeof b.data === 'object') ? { ...(b.data as object), id: b.id } : b);
    } else if (norm === 'discounts') {
      const items = await prisma.discount.findMany();
      return items.map(d => (d.data && typeof d.data === 'object') ? { ...(d.data as object), id: d.id } : d);
    } else if (norm === 'customers') {
      const items = await prisma.customer.findMany();
      return items.map(c => (c.data && typeof c.data === 'object') ? { ...(c.data as object), id: c.id } : c);
    } else if (norm === 'files' || norm === 'fileentry' || norm === 'fileentries') {
      const items = await prisma.fileEntry.findMany({ orderBy: { createdAt: 'desc' } });
      return items.map(f => (f.data && typeof f.data === 'object') ? { ...(f.data as object), id: f.id, url: f.url } : f);
    } else if (norm === 'custompages' || norm === 'pages') {
      const items = await prisma.customPage.findMany();
      return items.map(cp => {
        let pageObj: any = (cp.data && typeof cp.data === 'object') ? { ...(cp.data as object) } : {};
        pageObj.id = cp.id || pageObj.id;
        pageObj.title = cp.title || pageObj.title;
        pageObj.slug = cp.slug ?? pageObj.slug;
        pageObj.visibility = cp.visibility || pageObj.visibility;
        pageObj.isHomepage = cp.isHomepage !== undefined ? cp.isHomepage : pageObj.isHomepage;

        const colSections = Array.isArray(cp.sections) ? (cp.sections as any[]) : [];
        const dataSections = Array.isArray(pageObj.sections) ? (pageObj.sections as any[]) : [];

        if (colSections.length > 0) {
          pageObj.sections = colSections;
        } else if (dataSections.length > 0) {
          pageObj.sections = dataSections;
        } else {
          pageObj.sections = [];
        }
        return pageObj;
      });
    } else if (norm === 'analytics' || norm === 'analyticsrecords' || norm === 'analyticsrecord') {
      const items = await prisma.analyticsRecord.findMany();
      return items.map(a => (a.metadata && typeof a.metadata === 'object') ? { ...(a.metadata as object), id: a.id } : a);
    }
  } catch (err: any) {
    console.warn(`[fetchFromPrismaModel] ${norm} query warning:`, err?.message);
  }
  return [];
}

export async function fetchResource(resource: string): Promise<any[]> {
  const normResource = normalizeResourceName(resource);
  const isConnected = await getDb();

  if (isConnected) {
    try {
      const records = await prisma.storeResource.findMany({
        where: { resource: normResource },
        orderBy: { createdAt: 'asc' }
      });

      const storeResourceList = (records || []).map(r => r.data as any);
      const directModelList = await fetchFromPrismaModel(normResource);

      // Merge by ID to ensure items in direct Prisma model (e.g. Order table) are included
      const mergedMap = new Map<string, any>();
      for (const item of storeResourceList) {
        if (!item) continue;
        const key = String(item.id || item.slug || item.orderId || '');
        if (key) mergedMap.set(key, item);
      }
      for (const item of directModelList) {
        if (!item) continue;
        const key = String(item.id || item.slug || item.orderId || '');
        if (key) {
          if (!mergedMap.has(key)) {
            mergedMap.set(key, item);
            // Sync missing item back to StoreResource table
            prisma.storeResource.upsert({
              where: { resource_itemId: { resource: normResource, itemId: key } },
              update: { data: item },
              create: { resource: normResource, itemId: key, data: item }
            }).catch(() => {});
          } else {
            // Prefer item with more populated details or keep storeResource
            const existing = mergedMap.get(key);
            let mergedItem = { ...existing, ...item };

            // For customPages, preserve populated sections array from either source
            if (normResource === 'customPages' || normResource === 'custompages' || normResource === 'pages') {
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

            // For blogs, preserve populated cover image
            if (normResource === 'blogs' && !mergedItem.image && existing?.image) {
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

      // A connected but empty database must remain empty; never substitute local data.
      memoryCache[normResource] = [];
      return [];
    } catch (err) {
      console.error(`[Neon DB] Error fetching resource ${normResource}:`, err);
    }
  }

  return memoryCache[normResource] || memoryCache[resource] || [];
}

export async function saveResource(resource: string, list: any[] | any): Promise<any[]> {
  const normResource = normalizeResourceName(resource);
  const normalizedList = Array.isArray(list) ? list : (list ? [list] : []);
  if (!Array.isArray(normalizedList)) return memoryCache[normResource] || [];

  // For customPages, ensure sections are preserved and not accidentally stripped
  if (normResource === 'customPages' || normResource === 'custompages' || normResource === 'pages') {
    const existingPages = memoryCache['customPages'] || [];
    for (let i = 0; i < normalizedList.length; i++) {
      const p = normalizedList[i];
      if (p && (!p.sections || !Array.isArray(p.sections) || p.sections.length === 0)) {
        const existing = existingPages.find((ep: any) => ep && (ep.id === p.id || ep.slug === p.slug));
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
      const validItemIds: string[] = [];
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
          }).catch((e: any) => console.warn(`[StoreResource Sync] ${normResource} ${itemId} warning:`, e?.message));

          // Dual sync to the dedicated Prisma model table. This MUST be awaited.
          // It used to be fire-and-forget, which works on a long-lived server but
          // not on a serverless deploy: the response returns, the container is
          // frozen, and the pending write never reaches Neon. The order landed in
          // StoreResource (awaited) and never in the Order table - which is why
          // the admin list, which merges both, still showed it.
          await syncToPrismaModel(normResource, item).catch((e: any) =>
            console.error(
              `[Model Sync FAILED] ${normResource}/${itemId} — typed table is now stale:`,
              e?.message
            )
          );
        }));
      }

      // Delete items removed from list in StoreResource. Transactional resources
      // are exempt from list-driven deletion - see isDeleteProtected.
      if (validItemIds.length > 0 && !isDeleteProtected(normResource)) {
        await prisma.storeResource.deleteMany({
          where: {
            resource: normResource,
            itemId: {
              notIn: validItemIds
            }
          }
        }).catch((e: any) => console.warn(`[StoreResource deleteMany] ${normResource} warning:`, e?.message));
      }

      // Delete items removed from list in dedicated Prisma tables. Transactional
      // resources are exempt from list-driven deletion - see isDeleteProtected.
      const norm = normResource.toLowerCase();
      if (validItemIds.length > 0 && !isDeleteProtected(normResource)) {
        if (norm === 'products') {
          await prisma.product.deleteMany({ where: { id: { notIn: validItemIds } } }).catch(() => {});
        } else if (norm === 'collections') {
          await prisma.collection.deleteMany({ where: { id: { notIn: validItemIds } } }).catch(() => {});
        } else if (norm === 'customers') {
          await prisma.customer.deleteMany({ where: { id: { notIn: validItemIds } } }).catch(() => {});
        } else if (norm === 'blogs') {
          await prisma.blogPost.deleteMany({ where: { id: { notIn: validItemIds } } }).catch(() => {});
        } else if (norm === 'discounts') {
          await prisma.discount.deleteMany({ where: { id: { notIn: validItemIds } } }).catch(() => {});
        } else if (norm === 'custompages' || norm === 'pages') {
          await prisma.customPage.deleteMany({ where: { id: { notIn: validItemIds } } }).catch(() => {});
        } else if (norm === 'files' || norm === 'fileentry' || norm === 'fileentries') {
          await prisma.fileEntry.deleteMany({ where: { id: { notIn: validItemIds } } }).catch(() => {});
        }
      }
    } catch (err) {
      console.error(`[Neon DB] Error saving resource ${normResource}:`, err);
    }
  }

  return normalizedList;
}

/**
 * Creates a full snapshot backup in Neon PostgreSQL and locally.
 */
export async function createDatabaseBackup(name: string = 'Auto Snapshot'): Promise<any> {
  const isConnected = await getDb();
  const backupData: Record<string, any> = {};
  const resources = ['customPages', 'products', 'collections', 'orders', 'files', 'customers', 'discounts', 'blogs'];

  for (const r of resources) {
    backupData[r] = await fetchResource(r);
  }

  const backupId = `backup_${Date.now()}`;
  const totalCount = Object.values(backupData).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

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
      console.warn('[Neon Backup] Error storing backup in Neon PostgreSQL:', err);
    }
  }

  persistMemoryCacheToBackup();
  return { id: backupId, name, timestamp: new Date().toISOString(), resourceCount: totalCount };
}

/**
 * Lists all database snapshots stored in Neon PostgreSQL.
 */
export async function listDatabaseBackups(): Promise<any[]> {
  const isConnected = await getDb();
  if (isConnected) {
    try {
      await ensureNeonTablesExist();
      const rows: any[] = await prisma.$queryRawUnsafe(`
        SELECT "id", "name", "timestamp", "resourceCount" FROM "NeonBackup" ORDER BY "timestamp" DESC LIMIT 20
      `);
      return rows || [];
    } catch (err) {
      console.warn('[Neon Backup] Error listing backups from Neon PostgreSQL:', err);
    }
  }
  return [];
}

/**
 * Restores the database and memoryCache from a snapshot.
 */
export async function restoreDatabaseBackup(backupId: string): Promise<boolean> {
  const isConnected = await getDb();
  if (!isConnected) return false;

  try {
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT "data" FROM "NeonBackup" WHERE "id" = $1 LIMIT 1
    `, backupId);

    if (rows && rows.length > 0 && rows[0].data) {
      const data = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
      for (const [resKey, items] of Object.entries(data)) {
        if (Array.isArray(items)) {
          await saveResource(resKey, items);
        }
      }
      return true;
    }
  } catch (err) {
    console.error('[Neon Backup] Error restoring backup from Neon PostgreSQL:', err);
  }
  return false;
}

export async function fetchStoreSetting(id: string, defaultVal: any = null): Promise<any> {
  let settingsData: any = null;
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
      } catch (e) {}
    }
  }

  return settingsData || defaultVal;
}

export async function saveStoreSetting(id: string, data: any): Promise<any> {
  const filePath = path.join(process.cwd(), `${id}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {}

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

export async function fetchSingleItem(resource: string, id: string): Promise<any | null> {
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
  return items.find((i: any) => i.id === id || i.slug === id) || null;
}

export async function saveSingleItem(resource: string, item: any): Promise<any> {
  if (!item) return item;
  const normResource = normalizeResourceName(resource);
  const itemId = String(item.id || item.slug || item.orderId || `item-${Date.now()}-${Math.random()}`);

  const items = memoryCache[normResource] || memoryCache[resource] || [];

  if (normResource === 'customPages' || normResource === 'custompages' || normResource === 'pages') {
    if (!item.sections || !Array.isArray(item.sections) || item.sections.length === 0) {
      const existing = items.find((i: any) => i.id === itemId || i.slug === itemId);
      if (existing && Array.isArray(existing.sections) && existing.sections.length > 0) {
        item = { ...item, sections: existing.sections };
      }
    }
  }

  const idx = items.findIndex((i: any) => i.id === itemId || i.slug === itemId);
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
      // Awaited for the same reason as in saveResource: an unawaited write does
      // not survive a serverless invocation ending.
      await syncToPrismaModel(normResource, item).catch((e: any) =>
        console.error(
          `[Model Sync FAILED] ${normResource}/${itemId} — typed table is now stale:`,
          e?.message
        )
      );
    } catch (err) {
      console.error(`[Neon DB] Error saving single item ${normResource}/${itemId}:`, err);
    }
  }

  return item;
}

export async function deleteSingleItem(resource: string, id: string): Promise<boolean> {
  if (!id) return false;
  const normResource = normalizeResourceName(resource);

  if (memoryCache[normResource]) {
    memoryCache[normResource] = memoryCache[normResource].filter((i: any) => String(i.id) !== String(id) && String(i.slug || '') !== String(id));
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
      if (norm === 'orders') {
        await prisma.order.deleteMany({ where: { id } }).catch(() => {});
      } else if (norm === 'products') {
        await prisma.product.deleteMany({ where: { id } }).catch(() => {});
      } else if (norm === 'collections') {
        await prisma.collection.deleteMany({ where: { id } }).catch(() => {});
      } else if (norm === 'customers') {
        await prisma.customer.deleteMany({ where: { id } }).catch(() => {});
      } else if (norm === 'blogs') {
        await prisma.blogPost.deleteMany({ where: { id } }).catch(() => {});
      } else if (norm === 'discounts') {
        await prisma.discount.deleteMany({ where: { id } }).catch(() => {});
      } else if (norm === 'custompages' || norm === 'pages') {
        await prisma.customPage.deleteMany({ where: { id } }).catch(() => {});
      }
    } catch (err) {
      console.error(`[Neon DB] Error deleting single item ${normResource}/${id}:`, err);
    }
  }

  return true;
}

const memoryImages: Record<string, { base64Data: string; mimeType: string }> = {};

export async function saveUploadedImage(id: string, base64Data: string, mimeType: string): Promise<string> {
  memoryImages[id] = { base64Data, mimeType };
  const isConnected = await getDb();
  if (isConnected) {
    try {
      await prisma.storeResource.upsert({
        where: {
          resource_itemId: {
            resource: 'uploaded_images',
            itemId: id
          }
        },
        update: { data: { id, base64Data, mimeType } },
        create: {
          resource: 'uploaded_images',
          itemId: id,
          data: { id, base64Data, mimeType }
        }
      });
    } catch (e) {
      console.warn('[Neon DB] Failed to persist uploaded image:', e);
    }
  }
  return `/uploads/${id}`;
}

export async function getUploadedImage(idOrFilename: string): Promise<{ base64Data: string; mimeType: string } | null> {
  if (memoryImages[idOrFilename]) return memoryImages[idOrFilename];

  const dotIndex = idOrFilename.lastIndexOf('.');
  const idNoExt = dotIndex !== -1 ? idOrFilename.substring(0, dotIndex) : idOrFilename;
  if (memoryImages[idNoExt]) return memoryImages[idNoExt];

  const isConnected = await getDb();
  if (isConnected) {
    try {
      const record = await prisma.storeResource.findFirst({
        where: {
          resource: 'uploaded_images',
          OR: [
            { itemId: idOrFilename },
            { itemId: idNoExt }
          ]
        }
      });
      if (record && record.data) {
        const data = record.data as any;
        const result = { base64Data: data.base64Data, mimeType: data.mimeType };
        memoryImages[idOrFilename] = result;
        memoryImages[idNoExt] = result;
        return result;
      }
    } catch (e) {
      console.warn('[Neon DB] Failed to retrieve uploaded image:', e);
    }
  }
  return null;
}

export async function fetchLayoutSettings(): Promise<any> {
  let settingsData: any = null;
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
      } catch (e) {}
    }
  }

  if (!settingsData) {
    settingsData = {
      id: "layout_settings",
      headerLogoText: 'POUCH SUPPLY',
      headerLogoSubtext: 'Premium Nicotine',
      headerLogoImage: '',
      footerLogoText: 'POUCH SUPPLY',
      footerLogoDescription: 'Leading premium directory for tobacco-free nicotine slim white canisters.',
      footerLogoImage: '',
      menuItems: [
        { id: '1', label: 'Home', tab: 'frontend-home', type: 'tab' },
        { id: '2', label: 'Subscribe', tab: 'frontend-subscribe', type: 'tab' },
        { id: '3', label: 'Shop Now', tab: 'frontend-shop', type: 'tab' },
        { id: '4', label: 'All Brands', tab: 'frontend-brands', type: 'tab' },
        { id: '5', label: 'About', tab: 'about', type: 'tab' }
      ]
    };
  }

  // Hydrate Cloudinary environment variables if stored in layout settings
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

export async function saveLayoutSettings(settings: any): Promise<any> {
  // Sync Cloudinary process.env if provided in settings payload
  if (settings.cloudinaryCloudName !== undefined) {
    process.env.CLOUDINARY_CLOUD_NAME = settings.cloudinaryCloudName || '';
  }
  if (settings.cloudinaryApiKey !== undefined) {
    process.env.CLOUDINARY_API_KEY = settings.cloudinaryApiKey || '';
  }
  if (settings.cloudinaryApiSecret !== undefined) {
    process.env.CLOUDINARY_API_SECRET = settings.cloudinaryApiSecret || '';
  }

  const filePath = path.join(process.cwd(), "layout_settings.json");
  try {
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), "utf-8");
  } catch (e) {}

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

export async function fetchDevSettings(): Promise<any> {
  let settingsData: any = null;
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
      } catch (e) {}
    }
  }

  if (!settingsData) {
    settingsData = DEFAULT_DEV_SETTINGS;
  }

  return settingsData;
}

export async function saveDevSettings(settings: any): Promise<any> {
  const filePath = path.join(process.cwd(), "dev_settings.json");
  try {
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), "utf-8");
  } catch (e) {}

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
