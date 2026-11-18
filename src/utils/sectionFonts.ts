/**
 * Fonts offered in the page builder.
 *
 * Each Google font lists only weights that family actually ships: the CSS2 API
 * rejects the whole request if one listed weight is missing, so every family is
 * also loaded with its own <link> to keep one bad entry from breaking the rest.
 */
export interface FontOption {
  key: string;
  label: string;
  stack: string;
  category: 'Sans serif' | 'Serif' | 'Display' | 'Handwriting' | 'System';
  /** Google Fonts css2 `family=` value; absent for system / already-loaded fonts. */
  google?: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { key: 'inter', label: 'Inter', stack: "'Inter', sans-serif", category: 'Sans serif' },
  { key: 'jost', label: 'Jost', stack: "'Jost', sans-serif", category: 'Sans serif' },
  { key: 'assistant', label: 'Assistant', stack: "'Assistant', sans-serif", category: 'Sans serif', google: 'Assistant:wght@300;400;600;700;800' },
  { key: 'poppins', label: 'Poppins', stack: "'Poppins', sans-serif", category: 'Sans serif', google: 'Poppins:wght@300;400;500;600;700;800;900' },
  { key: 'montserrat', label: 'Montserrat', stack: "'Montserrat', sans-serif", category: 'Sans serif', google: 'Montserrat:wght@300;400;500;600;700;800;900' },
  { key: 'dm-sans', label: 'DM Sans', stack: "'DM Sans', sans-serif", category: 'Sans serif', google: 'DM+Sans:wght@400;500;700' },
  { key: 'work-sans', label: 'Work Sans', stack: "'Work Sans', sans-serif", category: 'Sans serif', google: 'Work+Sans:wght@300;400;500;600;700;800' },
  { key: 'nunito-sans', label: 'Nunito Sans', stack: "'Nunito Sans', sans-serif", category: 'Sans serif', google: 'Nunito+Sans:wght@400;600;700;800' },
  { key: 'open-sans', label: 'Open Sans', stack: "'Open Sans', sans-serif", category: 'Sans serif', google: 'Open+Sans:wght@400;600;700;800' },
  { key: 'roboto', label: 'Roboto', stack: "'Roboto', sans-serif", category: 'Sans serif', google: 'Roboto:wght@300;400;500;700;900' },
  { key: 'lato', label: 'Lato', stack: "'Lato', sans-serif", category: 'Sans serif', google: 'Lato:wght@300;400;700;900' },
  { key: 'raleway', label: 'Raleway', stack: "'Raleway', sans-serif", category: 'Sans serif', google: 'Raleway:wght@300;400;500;600;700;800;900' },
  { key: 'manrope', label: 'Manrope', stack: "'Manrope', sans-serif", category: 'Sans serif', google: 'Manrope:wght@400;500;600;700;800' },
  { key: 'outfit', label: 'Outfit', stack: "'Outfit', sans-serif", category: 'Sans serif', google: 'Outfit:wght@300;400;500;600;700;800;900' },
  { key: 'plus-jakarta', label: 'Plus Jakarta Sans', stack: "'Plus Jakarta Sans', sans-serif", category: 'Sans serif', google: 'Plus+Jakarta+Sans:wght@400;500;600;700;800' },
  { key: 'space-grotesk', label: 'Space Grotesk', stack: "'Space Grotesk', sans-serif", category: 'Sans serif', google: 'Space+Grotesk:wght@400;500;700' },
  { key: 'cormorant', label: 'Cormorant Garamond', stack: "'Cormorant Garamond', serif", category: 'Serif' },
  { key: 'playfair', label: 'Playfair Display', stack: "'Playfair Display', serif", category: 'Serif', google: 'Playfair+Display:wght@400;600;700;900' },
  { key: 'lora', label: 'Lora', stack: "'Lora', serif", category: 'Serif', google: 'Lora:wght@400;500;600;700' },
  { key: 'merriweather', label: 'Merriweather', stack: "'Merriweather', serif", category: 'Serif', google: 'Merriweather:wght@300;400;700;900' },
  { key: 'libre-baskerville', label: 'Libre Baskerville', stack: "'Libre Baskerville', serif", category: 'Serif', google: 'Libre+Baskerville:wght@400;700' },
  { key: 'eb-garamond', label: 'EB Garamond', stack: "'EB Garamond', serif", category: 'Serif', google: 'EB+Garamond:wght@400;500;600;700' },
  { key: 'dm-serif', label: 'DM Serif Display', stack: "'DM Serif Display', serif", category: 'Serif', google: 'DM+Serif+Display' },
  { key: 'fraunces', label: 'Fraunces', stack: "'Fraunces', serif", category: 'Serif', google: 'Fraunces:wght@400;600;700;900' },
  { key: 'oswald', label: 'Oswald', stack: "'Oswald', sans-serif", category: 'Display', google: 'Oswald:wght@400;500;600;700' },
  { key: 'bebas', label: 'Bebas Neue', stack: "'Bebas Neue', sans-serif", category: 'Display', google: 'Bebas+Neue' },
  { key: 'anton', label: 'Anton', stack: "'Anton', sans-serif", category: 'Display', google: 'Anton' },
  { key: 'archivo-black', label: 'Archivo Black', stack: "'Archivo Black', sans-serif", category: 'Display', google: 'Archivo+Black' },
  { key: 'caveat', label: 'Caveat', stack: "'Caveat', cursive", category: 'Handwriting', google: 'Caveat:wght@400;700' },
  { key: 'dancing-script', label: 'Dancing Script', stack: "'Dancing Script', cursive", category: 'Handwriting', google: 'Dancing+Script:wght@400;700' },
  { key: 'system', label: 'System UI', stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", category: 'System' },
  { key: 'georgia', label: 'Georgia', stack: "Georgia, 'Times New Roman', serif", category: 'System' },
  { key: 'mono', label: 'Monospace', stack: "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace", category: 'System' }
];

const BY_KEY = new Map(FONT_OPTIONS.map(f => [f.key, f]));

export function getFont(key?: string | null): FontOption | undefined {
  return key ? BY_KEY.get(key) : undefined;
}

export function fontStack(key?: string | null): string | null {
  return getFont(key)?.stack || null;
}

/** One stylesheet URL per Google family in use (system fonts need none). */
export function googleFontHrefs(keys: Array<string | null | undefined>): string[] {
  const out = new Set<string>();
  for (const k of keys) {
    const f = getFont(k);
    if (f?.google) out.add(`https://fonts.googleapis.com/css2?family=${f.google}&display=swap`);
  }
  return Array.from(out);
}
