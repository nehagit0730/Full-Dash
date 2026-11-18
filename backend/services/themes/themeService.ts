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
import { LINK_FORMATS, PAGE_SETTINGS, SCHEMA_BY_FILE, SCHEMA_BY_TYPE, SECTION_SCHEMAS, STYLE_SETTINGS } from './sectionSchema';
import { FONT_OPTIONS } from '../../../src/utils/sectionFonts';

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

/** Section types a theme may use. "Plans" is legacy: kept so old pages import. */
const SECTION_TYPES = new Set([...SECTION_SCHEMAS.map(s => s.type), 'Plans']);

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
//
// Package layout (a ZIP of one folder):
//
//   <theme>/
//     theme.json                     manifest: name, version, author, template order
//     config/header-footer.json      logo, menu and footer design
//     templates/index.json           the homepage: title, settings, section order
//     templates/<handle>.json        every other page
//     sections/<template>/NN-<type>.json   one file per section: { type, settings }
//     schema/…                       reference: every section type's settings, the
//                                    shared style settings, fonts, link formats
//     README.md                      how to build a theme
//
// Import also accepts a single theme.json with an inline "pages" array (the
// first package format) and the Page Builder's page export.

const SAFE_URL = /^(https?:\/\/|\/(?!\/)|#|mailto:|tel:)/i;

const slugify = (s: string) =>
  String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Accepts the display name ("Image banner") or the schema file name ("image-banner"). */
function resolveSectionType(t: unknown): string | null {
  const s = String(t ?? '');
  if (SECTION_TYPES.has(s)) return s;
  return SCHEMA_BY_FILE.get(slugify(s))?.type || null;
}

function validatePages(raw: unknown, warnings: string[]): any[] {
  if (!Array.isArray(raw)) throw new ThemeError('The theme has no pages.');
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

    const seenSectionIds = new Set<string>();
    const sections = (Array.isArray(p.sections) ? p.sections : [])
      .map((s: any, j: number) => {
        if (!s || typeof s !== 'object') return null;
        const type = resolveSectionType(s.type);
        if (!type) {
          warnings.push(`Skipped a "${String(s.type).slice(0, 40)}" section on "${p.title || id}" — that section type does not exist in this store (see schema/sections).`);
          return null;
        }
        let sid = String(s.id || `sec-${slugify(id)}-${j + 1}`).slice(0, 120);
        if (seenSectionIds.has(sid)) sid = `${sid}-${j}`;
        seenSectionIds.add(sid);
        return {
          id: sid,
          type,
          settings: s.settings && typeof s.settings === 'object' && !Array.isArray(s.settings) ? s.settings : {}
        };
      })
      .filter(Boolean);

    return {
      id,
      title: String(p.title || `Page ${i + 1}`).slice(0, 200),
      slug,
      visibility: p.visibility === 'Hidden' ? 'Hidden' : 'Visible',
      updatedAt: now(),
      isHomepage: !!p.isHomepage,
      sections,
      ...(p.settings && typeof p.settings === 'object' && !Array.isArray(p.settings) ? { settings: p.settings } : {})
    };
  });

  // Exactly one homepage.
  const homes = pages.filter(p => p.isHomepage);
  if (homes.length === 0) {
    const guess = pages.find(p => !p.slug || p.slug === 'home' || p.slug === 'homepage' || p.slug === 'index') || pages[0];
    guess.isHomepage = true;
    warnings.push(`No page was marked as the homepage; "${guess.title}" is used.`);
  } else if (homes.length > 1) {
    homes.slice(1).forEach(p => (p.isHomepage = false));
    warnings.push('More than one page was marked as the homepage; the first one is used.');
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

function parseJson(text: string, file: string): any {
  try {
    // Tolerate a UTF-8 BOM, which some Windows editors add.
    return JSON.parse(text.replace(/^﻿/, ''));
  } catch (e: any) {
    throw new ThemeError(`${file} is not valid JSON (${String(e?.message || '').slice(0, 120)}).`);
  }
}

type FileReader = (path: string) => string | null;

/** Builds pages from templates/ + sections/ (the folder package format). */
function pagesFromFolders(names: string[], read: FileReader, manifest: any, warnings: string[]): any[] {
  const templateFiles = names
    .filter(n => /^templates\/[^/]+\.json$/i.test(n))
    .map(n => n.slice('templates/'.length, -'.json'.length));
  if (templateFiles.length === 0) throw new ThemeError('The theme has no templates/*.json files.');

  // Manifest order first, then the homepage, then alphabetical.
  const order: string[] = Array.isArray(manifest?.templates) ? manifest.templates.map(String) : [];
  templateFiles.sort((a, b) => {
    const ia = order.indexOf(a), ib = order.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 1e9 : ia) - (ib === -1 ? 1e9 : ib);
    if (a === 'index') return -1;
    if (b === 'index') return 1;
    return a.localeCompare(b);
  });

  return templateFiles.map(name => {
    const file = `templates/${name}.json`;
    const t = parseJson(read(file) || '{}', file);
    const dir = `sections/${name}/`;
    let sections: any[];

    if (Array.isArray(t.sections)) {
      sections = t.sections; // inline sections are allowed too
    } else {
      const available = names.filter(n => n.startsWith(dir) && n.toLowerCase().endsWith('.json')).map(n => n.slice(dir.length, -'.json'.length));
      const keys: string[] = Array.isArray(t.order) ? t.order.map(String) : available.sort();
      sections = keys
        .map(key => {
          const path = `${dir}${key}.json`;
          const text = read(path);
          if (text == null) {
            warnings.push(`${file} lists "${key}" in its order, but ${path} is missing.`);
            return null;
          }
          const s = parseJson(text, path);
          return { id: s.id || `sec-${slugify(name)}-${slugify(key)}`, type: s.type, settings: s.settings };
        })
        .filter(Boolean) as any[];
      const unused = available.filter(k => !keys.includes(k));
      if (unused.length) warnings.push(`${dir}: ${unused.join(', ')} not listed in ${file} "order", so not used.`);
    }

    return {
      id: t.id || (name === 'index' ? 'page-home' : `page-${slugify(name)}`),
      title: t.title || (name === 'index' ? 'Home page' : name),
      slug: t.handle ?? (name === 'index' ? '' : name),
      visibility: t.visibility,
      isHomepage: t.homepage ?? name === 'index',
      settings: t.settings,
      sections
    };
  });
}

/** Strips a single top-level folder so "my-theme/theme.json" reads as "theme.json". */
function rootedNames(names: string[]): { prefix: string; names: string[] } {
  const files = names.filter(n => !n.endsWith('/') && !/(^|\/)(__MACOSX|\.DS_Store)/.test(n));
  const firsts = new Set(files.map(n => (n.includes('/') ? n.split('/')[0] : '')));
  const prefix = firsts.size === 1 && !firsts.has('') ? `${[...firsts][0]}/` : '';
  return { prefix, names: files.map(n => n.slice(prefix.length)) };
}

function parseLegacyJson(json: any, warnings: string[]) {
  // The Page Builder's own export is a bare array of pages.
  if (Array.isArray(json)) json = { pages: json };
  if (!json || typeof json !== 'object' || !Array.isArray(json.pages)) {
    throw new ThemeError('This JSON file is not a theme. Expected a theme.json with "pages", or a theme ZIP.');
  }
  if (json.format && json.format !== THEME_FORMAT) throw new ThemeError(`Unknown theme format "${String(json.format).slice(0, 40)}".`);
  return {
    name: typeof json.name === 'string' ? json.name : undefined,
    data: { pages: validatePages(json.pages, warnings), layout: validateLayout(json.layout || json.layoutSettings) }
  };
}

export async function importTheme(fileName: string, buf: Buffer, nameOverride?: string) {
  const warnings: string[] = [];
  const lower = fileName.toLowerCase();
  let parsed: { name?: string; data: ThemeData };

  if (lower.endsWith('.json') || buf[0] === 0x7b || buf[0] === 0x5b || (buf[0] === 0xef && buf[3] === 0x7b)) {
    if (buf.length > 20 * 1024 * 1024) throw new ThemeError('The theme file is larger than 20 MB.');
    parsed = parseLegacyJson(parseJson(buf.toString('utf8'), fileName), warnings);
  } else {
    let zip;
    try {
      zip = readZip(buf);
    } catch (e: any) {
      throw new ThemeError(e instanceof ZipError ? e.message : 'The file could not be read as a ZIP.');
    }
    const { prefix, names } = rootedNames(zip.names);
    const read: FileReader = path => {
      try {
        const b = zip.read(prefix + path, 5 * 1024 * 1024);
        return b ? b.toString('utf8') : null;
      } catch (e: any) {
        throw new ThemeError(e instanceof ZipError ? e.message : `${path} could not be read.`);
      }
    };

    if (!names.includes('theme.json')) {
      const looksLikeShopify = names.some(n => /(^|\/)layout\/theme\.liquid$/.test(n) || /\.liquid$/.test(n));
      throw new ThemeError(
        looksLikeShopify
          ? 'This is a Shopify (Liquid) theme. Shopify themes run only on Shopify and cannot be installed here — use a theme exported from this dashboard (see its README.md to build your own).'
          : 'No theme.json found in the ZIP. Upload a theme exported from this dashboard.'
      );
    }
    const manifest = parseJson(read('theme.json')!, 'theme.json');
    if (manifest?.format && manifest.format !== THEME_FORMAT) throw new ThemeError(`Unknown theme format "${String(manifest.format).slice(0, 40)}".`);
    if (Number(manifest?.formatVersion) > THEME_FORMAT_VERSION) {
      warnings.push('This theme was made for a newer version of the store; some settings may be ignored.');
    }

    if (Array.isArray(manifest?.pages)) {
      parsed = parseLegacyJson(manifest, warnings);
    } else {
      const layoutText = read('config/header-footer.json') ?? read('config/settings.json');
      parsed = {
        name: typeof manifest?.name === 'string' ? manifest.name : undefined,
        data: {
          pages: validatePages(pagesFromFolders(names, read, manifest, warnings), warnings),
          layout: validateLayout(layoutText ? parseJson(layoutText, 'config/header-footer.json') : {})
        }
      };
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

const json = (v: any) => JSON.stringify(v, null, 2) + '\n';

function buildReadme(themeName: string, templates: { name: string; title: string; sections: string[] }[]): string {
  const sectionRows = SECTION_SCHEMAS.map(s => `| \`${s.file}\` | ${s.type} | ${s.description} |`).join('\n');
  const linkRows = Object.entries(LINK_FORMATS).map(([k, v]) => `| \`${k}\` | ${v} |`).join('\n');
  const tree = templates
    .map(t => `    templates/${t.name}.json\n${t.sections.map(s => `    sections/${t.name}/${s}.json`).join('\n')}`)
    .join('\n');

  return `# ${themeName}

A theme package for this store. Import it under **Admin → Themes → Import**.

A theme is the store's whole design as data — every page with its sections and
styles, plus the header and footer. It contains no code, no credentials and no
store settings (payments, email, integrations are never touched).

## Folder structure

\`\`\`
theme.json                    Name, version, author and the order of templates
config/header-footer.json     Logo, menu and footer design
templates/<name>.json         One file per page
sections/<name>/NN-<type>.json   One file per section on that page
schema/                       Reference only — ignored on import
README.md                     This file
\`\`\`

This theme contains:

\`\`\`
${tree}
\`\`\`

## theme.json

\`\`\`json
{
  "format": "${THEME_FORMAT}",
  "formatVersion": ${THEME_FORMAT_VERSION},
  "name": "My theme",
  "version": "1.0.0",
  "author": "Your name",
  "description": "Optional",
  "templates": ["index", "about", "contact"]
}
\`\`\`

\`templates\` sets the page order in the dashboard. Templates not listed are
added after it.

## templates/<name>.json — a page

\`\`\`json
{
  "title": "Home page",
  "handle": "",
  "homepage": true,
  "visibility": "Visible",
  "settings": { "headingFont": "playfair", "bodyFont": "inter", "backgroundColor": "#FFFFFF" },
  "order": ["01-image-banner", "02-featured-collection"]
}
\`\`\`

- \`templates/index.json\` is the homepage (\`"homepage": true\`).
- \`handle\` is the page URL: \`/pages/<handle>\`. Defaults to the file name.
- \`order\` lists the section files in \`sections/<name>/\`, top to bottom. Only
  listed sections are used, so you can keep spare ones in the folder. Without
  \`order\`, every file in the folder is used in file-name order.
- \`settings\` are page-wide defaults (see \`schema/page-settings.json\`).
- \`"visibility": "Hidden"\` keeps the page out of the store.

## sections/<name>/NN-<type>.json — a section

\`\`\`json
{
  "type": "image-banner",
  "settings": {
    "title": "New season, new favourites",
    "description": "Discover the latest arrivals.",
    "imageUrl": "https://…/hero.jpg",
    "buttonText": "Shop now",
    "buttonLink": "/shop",
    "fullWidth": true,
    "headingFont": "playfair",
    "titleFontSize": 56,
    "paddingTop": 0,
    "paddingBottom": 0
  }
}
\`\`\`

\`type\` is a section type below (either form works: \`image-banner\` or
\`"Image banner"\`). \`settings\` combine:

1. that type's **content settings** — \`schema/sections/<type>.json\`
   (with a ready-to-copy \`example\`), and
2. the **style settings** every section accepts — \`schema/style-settings.json\`:
   colors, layout and padding, fonts and sizes, buttons, visibility,
   animation and custom CSS.

Unset settings use the store's defaults, so a section only needs what you
want to change.

### Section types

| type | Name | What it is |
|---|---|---|
${sectionRows}

### Links

Any \`…Link\` / \`linkUrl\` setting takes:

| Value | Goes to |
|---|---|
${linkRows}

### Fonts

\`headingFont\` / \`bodyFont\` take a key from \`schema/fonts.json\`
(e.g. \`inter\`, \`playfair\`, \`montserrat\`). Fonts load automatically.

### Images

Use full image URLs (e.g. from Cloudinary or the dashboard's Files page).
Images are not packed into the ZIP.

## Building a new theme

1. Download an existing theme from **Admin → Themes** as a starting point.
2. Edit or add files in \`templates/\` and \`sections/\`; copy section
   \`example\`s from \`schema/sections/\`.
3. Zip the folder (the folder itself or its contents — both work).
4. **Admin → Themes → Import**, then **Preview** before you **Publish**.

Import reports anything it could not use (unknown section types, sections
missing from \`order\`, etc.) without failing the whole theme.
`;
}

export async function exportTheme(id: string): Promise<{ fileName: string; zip: Buffer }> {
  const theme = await getTheme(id);
  const slug = slugify(theme.name) || 'theme';
  const files: { name: string; data: string }[] = [];
  const add = (path: string, data: string) => files.push({ name: `${slug}/${path}`, data });

  // Templates and their sections.
  const usedNames = new Set<string>();
  const templates: { name: string; title: string; sections: string[] }[] = [];
  for (const page of theme.data.pages || []) {
    let name = page.isHomepage ? 'index' : slugify(page.slug || page.title) || 'page';
    if (name === 'index' && !page.isHomepage) name = 'index-page';
    let n = name;
    for (let i = 2; usedNames.has(n); i++) n = `${name}-${i}`;
    usedNames.add(n);

    const sectionNames: string[] = [];
    (page.sections || []).forEach((sec: any, i: number) => {
      const typeFile = SCHEMA_BY_TYPE.get(sec.type)?.file || slugify(sec.type) || 'section';
      const key = `${String(i + 1).padStart(2, '0')}-${typeFile}`;
      sectionNames.push(key);
      add(`sections/${n}/${key}.json`, json({ id: sec.id, type: typeFile, settings: sec.settings || {} }));
    });

    add(`templates/${n}.json`, json({
      id: page.id,
      title: page.title,
      handle: page.isHomepage ? '' : page.slug,
      homepage: !!page.isHomepage,
      visibility: page.visibility || 'Visible',
      ...(page.settings ? { settings: page.settings } : {}),
      order: sectionNames
    }));
    templates.push({ name: n, title: page.title, sections: sectionNames });
  }

  add('theme.json', json({
    format: THEME_FORMAT,
    formatVersion: THEME_FORMAT_VERSION,
    name: theme.name,
    version: '1.0.0',
    author: '',
    description: '',
    exportedAt: now(),
    templates: templates.map(t => t.name)
  }));
  add('config/header-footer.json', json(themeLayout(theme.data.layout)));

  // Reference material for building themes by hand.
  for (const s of SECTION_SCHEMAS) {
    add(`schema/sections/${s.file}.json`, json({
      type: s.file,
      name: s.type,
      description: s.description,
      settings: s.settings,
      ...(s.lists ? { lists: s.lists } : {}),
      note: 'Every section also accepts the style settings in ../style-settings.json.',
      example: { type: s.file, settings: s.example }
    }));
  }
  add('schema/style-settings.json', json({ description: 'Settings every section type accepts, grouped as in the editor.', groups: STYLE_SETTINGS }));
  add('schema/page-settings.json', json({ description: 'Page-wide defaults (templates/<name>.json → "settings").', settings: PAGE_SETTINGS }));
  add('schema/fonts.json', json(FONT_OPTIONS.map(f => ({ key: f.key, name: f.label, category: f.category }))));
  add('schema/links.json', json(LINK_FORMATS));
  add('README.md', buildReadme(theme.name, templates));

  return { fileName: `${slug}.zip`, zip: createZip(files) };
}
