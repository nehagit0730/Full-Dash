/**
 * Structural backfill for the Neon Postgres schema.
 *
 * Populates the typed columns, relation tables and dedicated log tables that
 * previously existed only inside JSON blobs. Safe to re-run: every step is
 * idempotent (upsert / deleteMany-then-create per parent record).
 *
 * Usage:
 *   npx tsx scripts/dbMigrateStructural.ts            # dry run, reports only
 *   npx tsx scripts/dbMigrateStructural.ts --apply    # writes changes
 *
 * Target a Neon branch first:
 *   DATABASE_URL="postgres://...branch..." npx tsx scripts/dbMigrateStructural.ts --apply
 */
import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { normalizeBillingInterval } from '../backend/services/subscriptionCron';

const APPLY = process.argv.includes('--apply');
const tag = APPLY ? '[APPLY]' : '[DRY-RUN]';

const stats: Record<string, number> = {};
const bump = (k: string, n = 1) => { stats[k] = (stats[k] || 0) + n; };

function section(name: string) {
  console.log(`\n───── ${name} ─────`);
}

/** Extracts the Cloudinary public id from a delivery URL. */
export function cloudinaryPublicId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('res.cloudinary.com')) return null;
  // .../upload/(v1234/)?<folder>/<name>.<ext>  -> "<folder>/<name>"
  const m = url.match(/\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
  if (!m || !m[1]) return null;
  return m[1].replace(/\.[a-zA-Z0-9]+$/, '');
}

function num(v: any, fallback = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

async function backfillOrders() {
  section('Orders: typed columns, line items, customer & subscription links');
  const orders = await prisma.order.findMany();
  const customers = await prisma.customer.findMany({ select: { id: true, email: true } });
  const emailToCustomerId = new Map(customers.map(c => [c.email.toLowerCase().trim(), c.id]));

  const subs = await prisma.subscription.findMany({ select: { id: true } });
  const subIds = new Set(subs.map(s => s.id));

  const products = await prisma.product.findMany({ select: { id: true, sku: true, title: true } });
  const productById = new Map(products.map(p => [p.id, p.id]));
  const productBySku = new Map(products.filter(p => p.sku).map(p => [String(p.sku).toLowerCase(), p.id]));
  const productByTitle = new Map(products.map(p => [p.title.toLowerCase().trim(), p.id]));

  for (const o of orders as any[]) {
    const d = (o.data || {}) as any;
    const items: any[] = Array.isArray(o.items) ? o.items : (Array.isArray(d.items) ? d.items : []);

    const shippingCost = num(d.shippingCost ?? d.deliveryCost ?? o.shippingCost, 0);
    const itemsSum = items.reduce((s, it) => s + num(it.price) * num(it.quantity, 1), 0);
    const subtotal = num(d.subtotal, itemsSum || Math.max(0, num(o.total) - shippingCost));
    const discountAmount = num(d.discountAmount ?? o.discountApplied?.amount, 0);

    const subId = d.subscriptionId || o.subscriptionId || null;
    const linkedSubId = subId && subIds.has(String(subId)) ? String(subId) : null;

    const update: any = {
      subtotal,
      shippingCost,
      discountAmount,
      paymentMethod: d.paymentMethod || o.paymentMethod || null,
      currency: o.currency || 'GBP',
      trackingNumber: d.trackingNumber || o.trackingId || null,
      trackingId: o.trackingId || d.trackingNumber || null,
      carrier: o.carrier || d.royalMail?.carrier || d.carrier || null,
      royalMailOrderId: d.royalMail?.royalMailOrderId ? String(d.royalMail.royalMailOrderId) : null,
      isSubscription: Boolean(d.isSubscription ?? o.isSubscription ?? d.subscriptionDetails ?? linkedSubId),
      subscriptionDetails: d.subscriptionDetails ?? o.subscriptionDetails ?? undefined,
      notificationsSent: d.notificationsSent ?? undefined,
      customerId: emailToCustomerId.get(String(o.customerEmail).toLowerCase().trim()) || null,
      subscriptionId: linkedSubId
    };

    if (APPLY) {
      await prisma.order.update({ where: { id: o.id }, data: update });
      // Rebuild this order's line items from scratch so re-runs converge.
      await prisma.orderItem.deleteMany({ where: { orderId: o.id } });
      for (const it of items) {
        const sku = it.sku ? String(it.sku).toLowerCase() : '';
        const title = String(it.productTitle || it.title || '').toLowerCase().trim();
        const productId =
          productById.get(String(it.productId)) ||
          (sku ? productBySku.get(sku) : undefined) ||
          productByTitle.get(title) ||
          null;

        await prisma.orderItem.create({
          data: {
            orderId: o.id,
            productId,
            productTitle: it.productTitle || it.title || 'Item',
            sku: it.sku || null,
            variant: it.variant || null,
            vendor: it.vendor || null,
            image: it.image || null,
            quantity: Math.max(1, Math.round(num(it.quantity, 1))),
            unitPrice: num(it.price),
            lineTotal: num(it.total, num(it.price) * num(it.quantity, 1)),
            isSubscription: Boolean(it.isSubscription),
            subscriptionPlan: it.subscriptionPlan || null,
            subscriptionItems: it.subscriptionItems ?? undefined
          }
        });
        bump('orderItems');
      }
    } else {
      bump('orderItems', items.length);
    }
    bump('ordersUpdated');
    if (update.customerId) bump('ordersLinkedToCustomer');
    if (linkedSubId) bump('ordersLinkedToSubscription');
  }
}

async function backfillCollectionProducts() {
  section('Collections: productIds[] -> CollectionProduct join rows');
  const cols = await prisma.collection.findMany({ select: { id: true, productIds: true } });
  const products = await prisma.product.findMany({ select: { id: true } });
  const validIds = new Set(products.map(p => p.id));

  for (const c of cols) {
    const ids = (c.productIds || []).filter(pid => validIds.has(pid));
    const skipped = (c.productIds || []).length - ids.length;
    if (skipped > 0) bump('danglingProductIdsSkipped', skipped);

    if (APPLY) {
      await prisma.collectionProduct.deleteMany({ where: { collectionId: c.id } });
      for (let i = 0; i < ids.length; i++) {
        await prisma.collectionProduct.create({
          data: { collectionId: c.id, productId: ids[i], position: i }
        });
        bump('collectionProductLinks');
      }
    } else {
      bump('collectionProductLinks', ids.length);
    }
  }
}

async function backfillSubscriptions() {
  section('Subscriptions: restore dropped fields + normalise billing interval');
  const rows = await prisma.storeResource.findMany({ where: { resource: 'subscriptions' } });
  const byId = new Map(rows.map(r => [r.itemId, r.data as any]));
  const subs = await prisma.subscription.findMany();

  for (const s of subs as any[]) {
    const blob = byId.get(s.id) || {};
    const canonical = normalizeBillingInterval(blob.billingInterval || s.billingInterval);
    if (canonical !== s.billingInterval) bump('billingIntervalNormalised');

    const data: any = {
      billingInterval: canonical,
      items: blob.items ?? undefined,
      cansCount: blob.cansCount ?? blob.subCansCount ?? undefined,
      itemPrice: blob.itemPrice !== undefined ? num(blob.itemPrice) : undefined,
      shippingCost: num(blob.shippingCost ?? blob.shippingFee ?? blob.shippingAmount ?? blob.deliveryCost, 0),
      shippingAddress: blob.shippingAddress || blob.destination || null,
      deliveryMethod: blob.deliveryMethod || null,
      sourceOrderId: blob.sourceOrderId || null,
      cancelledAt: blob.cancelledAt ? new Date(blob.cancelledAt) : null,
      cancellationReason: blob.cancellationReason || null,
      lastPaymentError: blob.lastPaymentError || null
    };

    if (APPLY) {
      await prisma.subscription.update({ where: { id: s.id }, data });
    }
    bump('subscriptionsBackfilled');
  }

  // Link subscriptions to customers by email.
  const customers = await prisma.customer.findMany({ select: { id: true, email: true } });
  const emailToId = new Map(customers.map(c => [c.email.toLowerCase().trim(), c.id]));
  for (const s of subs as any[]) {
    const cid = emailToId.get(String(s.customerEmail).toLowerCase().trim());
    if (!cid) continue;
    if (APPLY) await prisma.subscription.update({ where: { id: s.id }, data: { customerId: cid } });
    bump('subscriptionsLinkedToCustomer');
  }
}

async function backfillFiles() {
  section('Files: Cloudinary publicId + owner links');
  const files = await prisma.fileEntry.findMany();
  const products = await prisma.product.findMany({ select: { id: true, image: true, media: true } });
  const blogs = await prisma.blogPost.findMany({ select: { id: true, image: true } });
  const cols = await prisma.collection.findMany({ select: { id: true, image: true } });

  const urlToProduct = new Map<string, string>();
  products.forEach(p => {
    if (p.image) urlToProduct.set(p.image, p.id);
    (p.media || []).forEach(m => urlToProduct.set(m, p.id));
  });
  const urlToBlog = new Map(blogs.filter(b => b.image).map(b => [b.image as string, b.id]));
  const urlToCollection = new Map(cols.filter(c => c.image).map(c => [c.image as string, c.id]));

  const seenPublicIds = new Set<string>();

  for (const f of files as any[]) {
    const pid = cloudinaryPublicId(f.url || f.secureUrl);
    // publicId is unique; skip a duplicate rather than failing the whole run.
    const usablePid = pid && !seenPublicIds.has(pid) ? pid : null;
    if (usablePid) seenPublicIds.add(usablePid);

    const data: any = {
      publicId: usablePid,
      productId: urlToProduct.get(f.url) || null,
      blogPostId: urlToBlog.get(f.url) || null,
      collectionId: urlToCollection.get(f.url) || null
    };

    if (APPLY) {
      await prisma.fileEntry.update({ where: { id: f.id }, data }).catch((e: any) => {
        console.warn(`   file ${f.id}: ${String(e.message).split('\n')[0].slice(0, 100)}`);
      });
    }
    if (usablePid) bump('filesWithPublicId');
    if (data.productId) bump('filesLinkedToProduct');
    if (data.blogPostId) bump('filesLinkedToBlog');
    if (data.collectionId) bump('filesLinkedToCollection');
  }
}

async function migrateBlobOnlyResources() {
  section('Blob-only resources -> dedicated tables');

  const emailLogs = await prisma.storeResource.findMany({ where: { resource: 'email_logs' } });
  for (const r of emailLogs) {
    const d = r.data as any;
    if (APPLY) {
      await prisma.emailLog.upsert({
        where: { id: r.itemId },
        update: {},
        create: {
          id: r.itemId,
          type: d.type || 'unknown',
          recipient: d.recipient || '',
          subject: d.subject || null,
          status: d.status || 'unknown',
          provider: d.provider || null,
          messageId: d.messageId || null,
          resendId: d.resendId || null,
          error: d.error ? String(d.error).slice(0, 1000) : null,
          orderId: d.metadata?.data?.orderId || null,
          metadata: d.metadata ?? undefined,
          timestamp: d.timestamp ? new Date(d.timestamp) : new Date()
        }
      }).catch(() => {});
    }
    bump('emailLogs');
  }

  const klaviyoLogs = await prisma.storeResource.findMany({ where: { resource: 'klaviyo_logs' } });
  for (const r of klaviyoLogs) {
    const d = r.data as any;
    if (APPLY) {
      await prisma.klaviyoLog.upsert({
        where: { id: r.itemId },
        update: {},
        create: {
          id: r.itemId,
          event: d.event || d.metric || 'unknown',
          email: d.email || d.customerEmail || null,
          status: d.status || 'unknown',
          channel: d.channel || null,
          statusCode: typeof d.statusCode === 'number' ? d.statusCode : null,
          error: d.error ? String(d.error).slice(0, 1000) : null,
          properties: d.properties ?? undefined,
          timestamp: d.timestamp ? new Date(d.timestamp) : new Date()
        }
      }).catch(() => {});
    }
    bump('klaviyoLogs');
  }

  const pending = await prisma.storeResource.findMany({ where: { resource: 'pending_checkouts' } });
  for (const r of pending) {
    const d = r.data as any;
    const orderId = String(d.orderId || r.itemId);
    if (APPLY) {
      await prisma.pendingCheckout.upsert({
        where: { orderId },
        update: {},
        create: {
          id: r.itemId,
          orderId,
          customerName: d.customerName || null,
          customerEmail: d.customerEmail || null,
          destination: typeof d.destination === 'string' ? d.destination : JSON.stringify(d.destination ?? null),
          items: d.items ?? undefined,
          total: num(d.total),
          subtotal: num(d.subtotal),
          shippingCost: num(d.shippingCost ?? d.deliveryCost),
          deliveryMethod: d.deliveryMethod || null,
          discountApplied: d.discountApplied ?? undefined,
          storeCreditApplied: num(d.storeCreditApplied),
          data: d,
          createdAt: d.createdAt ? new Date(d.createdAt) : new Date()
        }
      }).catch(() => {});
    }
    bump('pendingCheckouts');
  }

  const ageRows = await prisma.storeResource.findMany({ where: { resource: 'age_verification' } });
  for (const r of ageRows) {
    const d = r.data as any;
    if (APPLY) {
      await prisma.ageVerification.upsert({
        where: { id: r.itemId },
        update: {},
        create: {
          id: r.itemId,
          email: d.email || d.customerEmail || null,
          customerId: d.customerId || null,
          status: d.status || d.result || 'unknown',
          reference: d.reference || d.token || null,
          provider: d.provider || 'AgeChecked',
          verifiedAt: d.verifiedAt ? new Date(d.verifiedAt) : null,
          data: d
        }
      }).catch(() => {});
    }
    bump('ageVerifications');
  }
}

async function migrateLayoutSetting() {
  section('LayoutSetting: StoreSetting JSON -> typed table');
  const s = await prisma.storeSetting.findUnique({ where: { id: 'layout_settings' } });
  if (!s) {
    console.log('   no layout_settings StoreSetting row; nothing to migrate');
    return;
  }
  const d = s.data as any;
  if (APPLY) {
    await prisma.layoutSetting.upsert({
      where: { id: 'layout_settings' },
      update: {
        headerLogoText: d.headerLogoText || null,
        headerLogoSubtext: d.headerLogoSubtext || null,
        headerLogoImage: d.headerLogoImage || null,
        footerLogoText: d.footerLogoText || null,
        footerLogoDescription: d.footerLogoDescription || null,
        footerLogoImage: d.footerLogoImage || null,
        menuItems: d.menuItems ?? undefined,
        data: d
      },
      create: {
        id: 'layout_settings',
        headerLogoText: d.headerLogoText || null,
        headerLogoSubtext: d.headerLogoSubtext || null,
        headerLogoImage: d.headerLogoImage || null,
        footerLogoText: d.footerLogoText || null,
        footerLogoDescription: d.footerLogoDescription || null,
        footerLogoImage: d.footerLogoImage || null,
        menuItems: d.menuItems ?? undefined,
        data: d
      }
    });
  }
  bump('layoutSettings');
}

/**
 * The backfill reads columns and tables that only exist after the schema has
 * been pushed. Check that first so a missing migration reports one clear line
 * instead of a Prisma stack trace halfway through the run.
 */
async function preflight(): Promise<boolean> {
  const checks: Array<[string, () => Promise<any>]> = [
    ['Subscription.lastPaymentError', () => prisma.subscription.findFirst({ select: { lastPaymentError: true } })],
    ['Order.subtotal', () => prisma.order.findFirst({ select: { subtotal: true } })],
    ['OrderItem table', () => prisma.orderItem.count()],
    ['CollectionProduct table', () => prisma.collectionProduct.count()],
    ['EmailLog table', () => prisma.emailLog.count()],
    ['KlaviyoLog table', () => prisma.klaviyoLog.count()],
    ['PendingCheckout table', () => prisma.pendingCheckout.count()],
    ['AgeVerification table', () => prisma.ageVerification.count()]
  ];

  const missing: string[] = [];
  for (const [name, probe] of checks) {
    try {
      await probe();
    } catch {
      missing.push(name);
    }
  }

  if (missing.length) {
    console.error(`\nThe database is missing ${missing.length} schema object(s):`);
    missing.forEach(m => console.error(`  - ${m}`));
    console.error('\nApply the schema first:  npx prisma db push');
    return false;
  }
  return true;
}

(async () => {
  console.log(`${tag} Structural backfill against ${(process.env.DATABASE_URL || '').replace(/:\/\/[^@]*@/, '://***@')}`);

  if (!(await preflight())) process.exit(1);

  await backfillCollectionProducts();
  await backfillSubscriptions();
  await backfillOrders();
  await backfillFiles();
  await migrateBlobOnlyResources();
  await migrateLayoutSetting();

  console.log('\n═════ SUMMARY ═════');
  Object.entries(stats)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([k, v]) => console.log(`${k.padEnd(32)} ${v}`));

  if (!APPLY) {
    console.log('\nDry run only. Re-run with --apply to write these changes.');
  }
  process.exit(0);
})();
