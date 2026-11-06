/**
 * Moves any image still referenced from local disk (/uploads/... or
 * /api/uploads/...) up to Cloudinary, then rewrites every reference to it
 * across the database.
 *
 * Local files are not in version control and do not survive a redeploy, so any
 * record still pointing at one has a broken image waiting to happen.
 *
 * Usage:
 *   npx tsx scripts/migrateLocalImagesToCloudinary.ts           # report only
 *   npx tsx scripts/migrateLocalImagesToCloudinary.ts --apply   # upload + rewrite
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';
import { uploadToCloudinary, isCloudinaryConfigured } from '../backend/services/cloudinary';

const APPLY = process.argv.includes('--apply');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

const LOCAL_URL_RX = /(?:\/api)?\/uploads\/([A-Za-z0-9._-]+)/g;

/** Every distinct local image path referenced anywhere in the database. */
async function findLocalReferences(): Promise<Map<string, string[]>> {
  const refs = new Map<string, string[]>(); // filename -> where it was seen

  const note = (filename: string, where: string) => {
    const list = refs.get(filename) || [];
    list.push(where);
    refs.set(filename, list);
  };

  const scan = (value: any, where: string) => {
    if (!value) return;
    const s = typeof value === 'string' ? value : JSON.stringify(value);
    let m: RegExpExecArray | null;
    LOCAL_URL_RX.lastIndex = 0;
    while ((m = LOCAL_URL_RX.exec(s)) !== null) note(m[1], where);
  };

  for (const b of await prisma.blogPost.findMany()) {
    scan(b.image, `blog:${b.id}`);
    scan(b.content, `blog:${b.id}`);
    scan(b.data, `blog:${b.id}`);
  }
  for (const p of await prisma.product.findMany()) {
    scan(p.image, `product:${p.id}`);
    scan(p.media, `product:${p.id}`);
    scan(p.data, `product:${p.id}`);
  }
  for (const c of await prisma.collection.findMany()) {
    scan(c.image, `collection:${c.id}`);
    scan(c.data, `collection:${c.id}`);
  }
  for (const cp of await prisma.customPage.findMany()) {
    scan(cp.sections, `customPage:${cp.id}`);
    scan(cp.data, `customPage:${cp.id}`);
  }
  // Narrow select so this script also runs before the structural migration.
  for (const f of await prisma.fileEntry.findMany({ select: { id: true, url: true } })) {
    scan(f.url, `file:${f.id}`);
  }
  for (const sr of await prisma.storeResource.findMany()) {
    scan(sr.data, `storeResource:${sr.resource}/${sr.itemId}`);
  }
  for (const ss of await prisma.storeSetting.findMany()) {
    scan(ss.data, `storeSetting:${ss.id}`);
  }

  return refs;
}

/** Rewrites old -> new across every table that can hold an image reference. */
async function rewriteEverywhere(mapping: Record<string, string>) {
  const swap = (value: any): any => {
    if (value === null || value === undefined) return value;
    let s = JSON.stringify(value);
    let changed = false;
    for (const [oldUrl, newUrl] of Object.entries(mapping)) {
      // Rewrite both the bare and /api-prefixed forms.
      for (const variant of [`/api${oldUrl}`, oldUrl]) {
        if (s.includes(variant)) {
          s = s.split(variant).join(newUrl);
          changed = true;
        }
      }
    }
    return changed ? JSON.parse(s) : value;
  };

  let count = 0;

  for (const b of await prisma.blogPost.findMany()) {
    const next = { image: swap(b.image), content: swap(b.content), data: swap(b.data) };
    if (next.image !== b.image || next.content !== b.content || JSON.stringify(next.data) !== JSON.stringify(b.data)) {
      await prisma.blogPost.update({ where: { id: b.id }, data: next as any });
      count++;
    }
  }
  for (const p of await prisma.product.findMany()) {
    const next = { image: swap(p.image), media: swap(p.media), data: swap(p.data) };
    if (JSON.stringify(next) !== JSON.stringify({ image: p.image, media: p.media, data: p.data })) {
      await prisma.product.update({ where: { id: p.id }, data: next as any });
      count++;
    }
  }
  for (const c of await prisma.collection.findMany()) {
    const next = { image: swap(c.image), data: swap(c.data) };
    if (JSON.stringify(next) !== JSON.stringify({ image: c.image, data: c.data })) {
      await prisma.collection.update({ where: { id: c.id }, data: next as any });
      count++;
    }
  }
  for (const cp of await prisma.customPage.findMany()) {
    const next = { sections: swap(cp.sections), data: swap(cp.data) };
    if (JSON.stringify(next) !== JSON.stringify({ sections: cp.sections, data: cp.data })) {
      await prisma.customPage.update({ where: { id: cp.id }, data: next as any });
      count++;
    }
  }
  for (const f of await prisma.fileEntry.findMany({ select: { id: true, url: true } })) {
    const nextUrl = swap(f.url);
    if (nextUrl !== f.url) {
      await prisma.fileEntry.update({ where: { id: f.id }, data: { url: nextUrl, secureUrl: nextUrl } });
      count++;
    }
  }
  for (const sr of await prisma.storeResource.findMany()) {
    const next = swap(sr.data);
    if (JSON.stringify(next) !== JSON.stringify(sr.data)) {
      await prisma.storeResource.update({ where: { id: sr.id }, data: { data: next } });
      count++;
    }
  }
  for (const ss of await prisma.storeSetting.findMany()) {
    const next = swap(ss.data);
    if (JSON.stringify(next) !== JSON.stringify(ss.data)) {
      await prisma.storeSetting.update({ where: { id: ss.id }, data: { data: next } });
      count++;
    }
  }

  return count;
}

(async () => {
  if (!isCloudinaryConfigured()) {
    console.error('Cloudinary is not configured (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET).');
    process.exit(1);
  }

  const refs = await findLocalReferences();
  console.log(`Found ${refs.size} distinct local image file(s) referenced in the database:\n`);

  const mapping: Record<string, string> = {};
  const missing: string[] = [];

  for (const [filename, where] of refs) {
    const diskPath = path.join(UPLOADS_DIR, filename);
    const exists = fs.existsSync(diskPath);
    console.log(`  ${filename}`);
    console.log(`     on disk: ${exists ? `yes (${(fs.statSync(diskPath).size / 1024).toFixed(0)} KB)` : 'NO — reference is already broken'}`);
    console.log(`     used by: ${[...new Set(where)].join(', ')}`);

    if (!exists) {
      missing.push(filename);
      continue;
    }

    if (APPLY) {
      const buffer = fs.readFileSync(diskPath);
      const result = await uploadToCloudinary(buffer, {
        folder: 'storefront_media',
        originalFilename: filename,
        resourceType: 'auto'
      });
      mapping[`/uploads/${filename}`] = result.secureUrl;
      console.log(`     uploaded -> ${result.secureUrl}`);

      // Record the asset in the media library so it is managed like the rest.
      await prisma.fileEntry.upsert({
        where: { publicId: result.publicId },
        update: { url: result.secureUrl, secureUrl: result.secureUrl },
        create: {
          id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          publicId: result.publicId,
          url: result.secureUrl,
          secureUrl: result.secureUrl,
          resourceType: result.resourceType,
          format: result.format,
          width: result.width ?? null,
          height: result.height ?? null,
          folder: result.folder,
          originalFilename: filename,
          fileName: filename,
          references: 'Migrated from local disk'
        }
      }).catch(() => {});
    }
  }

  if (missing.length) {
    console.log(`\n${missing.length} referenced file(s) are NOT on disk and cannot be recovered:`);
    missing.forEach(m => console.log(`  ${m}`));
  }

  if (APPLY && Object.keys(mapping).length) {
    const rewritten = await rewriteEverywhere(mapping);
    console.log(`\nRewrote references in ${rewritten} database row(s).`);
  } else if (!APPLY) {
    console.log('\nReport only. Re-run with --apply to upload and rewrite.');
  }

  process.exit(0);
})();
