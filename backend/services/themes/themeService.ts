import {
  deleteSingleItem,
  fetchLayoutSettings,
  fetchResource,
  saveLayoutSettings,
  saveResource,
  saveSingleItem
} from '../../../serverDb';
import { DEFAULT_PAGES } from '../../../src/initialData';
import { createZip, readZip, ZipError } from './zip';

/**
 * Themes.
 *
 * A theme is the store's whole design as data: every Page Builder page (with
 * its sections, styles and fonts) plus the header/footer settings. The store
 * itself is a compiled React app, so a theme is never code — which is also
 * what makes importing a stranger's theme file safe.
 *
 * Exactly one theme is "live". The live theme's content is whatever the store
 * currently shows (pages + layout settings), so it is always read fresh from
 * there rather than from its stored copy. Publishing another theme first
 * snapshots the live state into the outgoing theme, so switching back and
 * forth never loses work.
 */

export const THEME_FORMAT = 'fulldash-theme';
export const THEME_FORMAT_VERSION = 1;
const RESOURCE = 'themes';

export type ThemeRole = 'live' | 'draft';

export interface ThemeData {
  pages: any[];
  layout: Record<string, any>;
}

export interface ThemeRecord {
  id: string;
  name: string;
  role: ThemeRole;
  source: 'current' | 'imported' | 'duplicate' | 'default';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  /** The theme that was live before this one was published (for "revert"). */
  previousThemeId?: string | null;
  data: ThemeData;
}

export class ThemeError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const SECTION_TYPES = new Set([
  'Image banner', 'Video banner', 'Image with text', 'Text column with image', 'Rich text', 'Marquee text',
  'Marquee images', 'Logo list', 'Collection list', 'Featured collection', 'Images gallery', 'FAQs', 'Slideshow',
  'Blog post', 'Brand list', 'Icon with text', 'Brands we offer', 'How it works', 'Trust badges', 'Plans',
  'Clearance Sale', 'Contact Form'
]);

/**
 * Layout keys that are store configuration or credentials, not design. They
 * never go into a theme, and publishing a theme never changes them.
 */
const PRIVATE_LAYOUT_KEY = /^(klaviyo|cloudinary)|secret|api_?key|token|password|private/i;

function themeLayout(layout: Record<string, any> | null | undefined): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(layout || {})) {
    if (k === 'id' || PRIVATE_LAYOUT_KEY.test(k)) continue;
    out[k] = v;
  }
  return out;
}

function privateLayout(layout: Record<string, any> | null | undefined): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(layout || {})) {
    if (k === 'id' || PRIVATE_LAYOUT_KEY.test(k)) out[k] = v;
  }
  return out;
}

const now = () => new Date().toISOString();
const newId = () => `theme-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

async function liveState(): Promise<ThemeData> {
  const [pages, layout] = await Promise.all([fetchResource('customPages'), fetchLayoutSettings()]);
  return { pages: JSON.parse(JSON.stringify(pages || [])), layout: themeLayout(layout) };
}

async function allThemes(): Promise<ThemeRecord[]> {
  const list = (await fetchResource(RESOURCE)) as ThemeRecord[];
  return (list || []).filter(t => t && t.id && t.data);
}

/** Guarantees exactly one live theme, creating "Current theme" on first use. */
async function ensureLive(themes: ThemeRecord[]): Promise<ThemeRecord[]> {
  const lives = themes.filter(t => t.role === 'live');
  if (lives.length === 1) return themes;
  if (lives.length > 1) {
    // Repair: keep the most recently published one live.
    lives.sort((a, b) => Date.parse(b.publishedAt || b.updatedAt) - Date.parse(a.publishedAt || a.updatedAt));
    for (const extra of lives.slice(1)) {
      extra.role = 'draft';
      await saveSingleItem(RESOURCE, extra);
    }
    return themes;
  }
  const t = now();
  const live: ThemeRecord = {
    id: newId(),
    name: 'Current theme',
    role: 'live',
    source: 'current',
    createdAt: t,
    updatedAt: t,
    publishedAt: t,
    data: await liveState()
  };
  await saveSingleItem(RESOURCE, live);
  return [live, ...themes];
}

function summary(t: ThemeRecord) {
  const pages = t.data?.pages || [];
  const home = pages.find((p: any) => p?.isHomepage) || pages[0] || null;
  return {
    id: t.id,
    name: t.name,
    role: t.role,
    source: t.source,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    publishedAt: t.publishedAt || null,
    previousThemeId: t.previousThemeId || null,
    pageCount: pages.length,
    sectionCount: pages.reduce((n: number, p: any) => n + (Array.isArray(p?.sections) ? p.sections.length : 0), 0),
    // Enough to draw a thumbnail without shipping every theme's full content.
    thumbnail: home
      ? { page: { ...home, sections: (home.sections || []).filter((s: any) => !s?.settings?.hidden).slice(0, 3) }, layout: t.data.layout }
      : null
  };
}

export async function listThemes() {
  const themes = await ensureLive(await allThemes());
  const live = themes.find(t => t.role === 'live')!;
  live.data = await liveState();
  return themes
    .sort((a, b) => (a.role === 'live' ? -1 : b.role === 'live' ? 1 : Date.parse(b.updatedAt) - Date.parse(a.updatedAt)))
    .map(summary);
}

export async function getTheme(id: string): Promise<ThemeRecord> {
  const themes = await ensureLive(await allThemes());
  const t = themes.find(x => x.id === id);
  if (!t) throw new ThemeError('Theme not found.', 404);
  if (t.role === 'live') t.data = await liveState();
  return t;
}

function defaultThemeData(): ThemeData {
  return {
    pages: JSON.parse(JSON.stringify(DEFAULT_PAGES)),
    layout: {
      headerLogoText: 'ECOMMERCE STORE',
      headerLogoSubtext: '',
      headerLogoImage: '',
      footerLogoText: 'ECOMMERCE STORE',
      footerLogoDescription: '',
      footerLogoImage: '',
      menuItems: [
        { id: '1', label: 'Home', tab: 'frontend-home', type: 'tab' },
        { id: '3', label: 'Shop Now', tab: 'frontend-shop', type: 'tab' },
        { id: '5', label: 'About', tab: 'about', type: 'tab' }
      ],
      homepageSource: 'page-builder'
    }
  };
}

function cleanName(name: unknown, fallback: string): string {
  const s = String(name ?? '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 80);
  return s || fallback;
}

export async function createTheme(input: { name?: string; from?: string }) {
  let data: ThemeData;
  let source: ThemeRecord['source'];
  let fallbackName: string;
  if (!input.from || input.from === 'default') {
    data = defaultThemeData();
    source = 'default';
    fallbackName = 'Default theme';
  } else {
    const base = await getTheme(input.from);
    data = JSON.parse(JSON.stringify(base.data));
    source = 'duplicate';
    fallbackName = `Copy of ${base.name}`;
  }
  const t = now();
  const theme: ThemeRecord = {
    id: newId(),
    name: cleanName(input.name, fallbackName),
    role: 'draft',
    source,
    createdAt: t,
    updatedAt: t,
    data
  };
  await saveSingleItem(RESOURCE, theme);
  return summary(theme);
}

export async function renameTheme(id: string, name: string) {
  const theme = await getTheme(id);
  const stored = (await allThemes()).find(t => t.id === id)!;
  stored.name = cleanName(name, theme.name);
  stored.updatedAt = now();
  await saveSingleItem(RESOURCE, stored);
  return summary({ ...stored, data: theme.data });
}

export async function deleteTheme(id: string) {
  const theme = await getTheme(id);
  if (theme.role === 'live') throw new ThemeError('The live theme cannot be deleted. Publish another theme first.');
  await deleteSingleItem(RESOURCE, id);
}

/**
 * Makes a theme live. The outgoing live theme is saved with the store's current
 * pages and layout first, so nothing edited on the live site is lost.
 */
export async function publishTheme(id: string) {
  const themes = await ensureLive(await allThemes());
  const target = themes.find(t => t.id === id);
  if (!target) throw new ThemeError('Theme not found.', 404);
  const current = themes.find(t => t.role === 'live')!;
  if (target.id === current.id) throw new ThemeError('This theme is already live.');

  // 1. Snapshot what is live right now into the outgoing theme.
  current.data = await liveState();
  current.updatedAt = now();
  await saveSingleItem(RESOURCE, current);

  // 2. Apply the target's design. Store configuration/credentials held in the
  //    layout settings are kept as they are.
  const pages = JSON.parse(JSON.stringify(target.data.pages || []));
  await saveResource('customPages', pages);
  const existingLayout = await fetchLayoutSettings();
  const layout = { ...themeLayout(target.data.layout), ...privateLayout(existingLayout), id: 'layout_settings' };
  await saveLayoutSettings(layout);

  // 3. Flip roles.
  const t = now();
  current.role = 'draft';
  target.role = 'live';
  target.publishedAt = t;
  target.updatedAt = t;
  target.previousThemeId = current.id;
  await saveSingleItem(RESOURCE, current);
  await saveSingleItem(RESOURCE, target);

  return { theme: summary(target), pages, layoutSettings: layout };
}

// ───────────────────────────── Import / export ─────────────────────────────

const SAFE_URL = /^(https?:\/\/|\/(?!\/)|#|mailto:|tel:)/i;

function validatePages(raw: unknown, warnings: string[]): any[] {
  if (!Array.isArray(raw)) throw new ThemeError('The theme has no "pages" list.');
  if (raw.length === 0) throw new ThemeError('The theme contains no pages.');
  if (raw.length > 200) throw new ThemeError('The theme has more pages than allowed (200).');

  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const pages = raw.map((p: any, i: number) => {
    if (!p || typeof p !== 'object') throw new ThemeError(`Page ${i + 1} is not valid.`);
    let id = String(p.id || `page-${i + 1}`).slice(0, 120);
    if (seenIds.has(id)) id = `${id}-${i}`;
    seenIds.add(id);
    let slug = String(p.slug ?? '').toLowerCase().replace(/[^a-z0-9-/]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
    if (slug && seenSlugs.has(slug)) slug = `${slug}-${i}`;
    if (slug) seenSlugs.add(slug);

    const sections = (Array.isArray(p.sections) ? p.sections : [])
      .filter((s: any) => {
        if (!s || typeof s !== 'object') return false;
        if (!SECTION_TYPES.has(s.type)) {
          warnings.push(`Skipped a "${String(s.type).slice(0, 40)}" section on "${p.title || id}" — that section type does not exist in this store.`);
          return false;
        }
        return true;
      })
      .map((s: any, j: number) => ({
        id: String(s.id || `sec-${i}-${j}`).slice(0, 120),
        type: s.type,
        settings: s.settings && typeof s.settings === 'object' && !Array.isArray(s.settings) ? s.settings : {}
      }));

    return {
      id,
      title: String(p.title || `Page ${i + 1}`).slice(0, 200),
      slug,
      visibility: p.visibility === 'Hidden' ? 'Hidden' : 'Visible',
      updatedAt: now(),
      isHomepage: !!p.isHomepage,
      sections,
      ...(p.settings && typeof p.settings === 'object' ? { settings: p.settings } : {})
    };
  });

  // Exactly one homepage.
  const homes = pages.filter(p => p.isHomepage);
  if (homes.length === 0) {
    const guess = pages.find(p => !p.slug || p.slug === 'home' || p.slug === 'homepage') || pages[0];
    guess.isHomepage = true;
    warnings.push(`No page was marked as the homepage; "${guess.title}" is used.`);
  } else if (homes.length > 1) {
    homes.slice(1).forEach(p => (p.isHomepage = false));
  }
  return pages;
}

function validateLayout(raw: unknown): Record<string, any> {
  const layout = themeLayout(raw && typeof raw === 'object' ? (raw as any) : {});
  if (Array.isArray(layout.menuItems)) {
    layout.menuItems = layout.menuItems
      .filter((m: any) => m && typeof m === 'object')
      .slice(0, 50)
      .map((m: any) => {
        const item = { ...m };
        if (item.url && !SAFE_URL.test(String(item.url))) delete item.url;
        return item;
      });
  }
  return layout;
}

function parseThemeJson(text: string, warnings: string[]) {
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ThemeError('theme.json is not valid JSON.');
  }
  // Also accept the Page Builder's own export (a bare array of pages).
  if (Array.isArray(json)) json = { pages: json };
  if (!json || typeof json !== 'object') throw new ThemeError('theme.json is not a theme.');
  if (json.format && json.format !== THEME_FORMAT) throw new ThemeError(`Unknown theme format "${String(json.format).slice(0, 40)}".`);
  if (Number(json.formatVersion) > THEME_FORMAT_VERSION) {
    warnings.push('This theme was exported by a newer version of the store; some settings may be ignored.');
  }
  return {
    name: typeof json.name === 'string' ? json.name : undefined,
    data: { pages: validatePages(json.pages, warnings), layout: validateLayout(json.layout || json.layoutSettings) }
  };
}

export async function importTheme(fileName: string, buf: Buffer, nameOverride?: string) {
  const warnings: string[] = [];
  const lower = fileName.toLowerCase();
  let parsed: { name?: string; data: ThemeData };

  if (lower.endsWith('.json') || buf[0] === 0x7b || buf[0] === 0x5b) {
    if (buf.length > 20 * 1024 * 1024) throw new ThemeError('The theme file is larger than 20 MB.');
    parsed = parseThemeJson(buf.toString('utf8'), warnings);
  } else {
    let zip;
    try {
      zip = readZip(buf);
    } catch (e: any) {
      throw new ThemeError(e instanceof ZipError ? e.message : 'The file could not be read as a ZIP.');
    }
    // Packages zipped from a folder have every path under one top directory.
    const entry =
      zip.names.find(n => n === 'theme.json') ||
      zip.names.find(n => /^[^/]+\/theme\.json$/.test(n));
    if (!entry) {
      const looksLikeShopify = zip.names.some(n => /(^|\/)layout\/theme\.liquid$/.test(n) || /\.liquid$/.test(n));
      throw new ThemeError(
        looksLikeShopify
          ? 'This is a Shopify (Liquid) theme. Shopify themes run only on Shopify and cannot be installed here — use a theme exported from this dashboard.'
          : 'No theme.json found in the ZIP. Upload a theme exported from this dashboard.'
      );
    }
    try {
      parsed = parseThemeJson(zip.read(entry, 20 * 1024 * 1024)!.toString('utf8'), warnings);
    } catch (e: any) {
      if (e instanceof ThemeError) throw e;
      throw new ThemeError(e instanceof ZipError ? e.message : 'theme.json could not be read.');
    }
  }

  const baseName = fileName.replace(/\.(zip|json)$/i, '').replace(/[-_]+/g, ' ').trim();
  const t = now();
  const theme: ThemeRecord = {
    id: newId(),
    name: cleanName(nameOverride || parsed.name || baseName, 'Imported theme'),
    role: 'draft',
    source: 'imported',
    createdAt: t,
    updatedAt: t,
    data: parsed.data
  };
  await saveSingleItem(RESOURCE, theme);
  return { theme: summary(theme), warnings };
}

export async function exportTheme(id: string): Promise<{ fileName: string; zip: Buffer }> {
  const theme = await getTheme(id);
  const manifest = {
    format: THEME_FORMAT,
    formatVersion: THEME_FORMAT_VERSION,
    name: theme.name,
    exportedAt: now(),
    pages: theme.data.pages,
    layout: themeLayout(theme.data.layout)
  };
  const readme =
    `${theme.name}\n\n` +
    `Theme package for this store's dashboard (Online Store → Themes → Import).\n` +
    `theme.json holds every Page Builder page with its sections and styles, plus the\n` +
    `header & footer settings. Images are referenced by URL and are not included.\n` +
    `No credentials or store settings are contained in this file.\n`;
  const slug = theme.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'theme';
  return {
    fileName: `${slug}.zip`,
    zip: createZip([
      { name: 'theme.json', data: JSON.stringify(manifest, null, 2) },
      { name: 'README.txt', data: readme }
    ])
  };
}
