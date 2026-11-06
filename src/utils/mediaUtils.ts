export const PLACEHOLDER_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400' fill='none'><rect width='400' height='400' fill='%23F1F5F9'/><rect x='1' y='1' width='398' height='398' rx='12' stroke='%23E2E8F0' stroke-width='2'/><path d='M150 220L180 180L210 220L230 195L260 235H140L150 220Z' fill='%23CBD5E1'/><circle cx='230' cy='165' r='14' fill='%23CBD5E1'/></svg>";

export function cleanMediaUrl(url?: string): string {
  if (!url || typeof url !== 'string') return PLACEHOLDER_IMAGE;
  let trimmed = url.trim();
  if (!trimmed) return PLACEHOLDER_IMAGE;
  if (trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('blob:')) return trimmed;

  // Preserve Cloudinary and CDN URLs unconditionally
  if (trimmed.includes('cloudinary.com') || trimmed.includes('res.cloudinary.com')) {
    return trimmed;
  }

  // Preserve external http/https URLs unless explicitly pointing to local upload routes
  if (/^https?:\/\//i.test(trimmed)) {
    if (trimmed.includes('/api/uploads/') || trimmed.includes('/uploads/') || trimmed.includes('/api/images/')) {
      const match = trimmed.match(/(\/(?:api\/)?uploads\/[^\s?#]+)/);
      if (match) return match[1];
    }
    return trimmed;
  }

  if (trimmed.startsWith('uploads/')) return '/' + trimmed;
  if (trimmed.startsWith('api/uploads/')) return '/' + trimmed;
  if (trimmed.startsWith('api/images/')) return '/' + trimmed;

  return trimmed || PLACEHOLDER_IMAGE;
}

export function cleanBase64String(raw: string): string {
  if (!raw) return '';
  if (raw.includes(';base64,')) {
    return raw.split(';base64,').pop() || raw;
  }
  return raw.replace(/^data:[^;]+;base64,/, '').trim();
}

export function getWishlistProductTitle(prod: any, productIdStored?: string): string {
  if (!prod) return '';
  const pidStr = String(productIdStored || '').trim().toLowerCase();
  
  let variantName = '';
  if (prod.concreteVariants && Array.isArray(prod.concreteVariants) && prod.concreteVariants.length > 0) {
    const matchedVar = prod.concreteVariants.find((v: any) => 
      String(v.id).toLowerCase() === pidStr || 
      String(v.name).toLowerCase() === pidStr ||
      (v.strength && String(v.strength).toLowerCase() === pidStr)
    );
    if (matchedVar) {
      variantName = matchedVar.name || matchedVar.strength || '';
    }
  }

  if (!variantName) {
    variantName = prod.variant || prod.variantName || prod.nicotineStrength || prod.strength || '';
  }

  const baseTitle = prod.title || '';
  if (variantName && !baseTitle.toLowerCase().includes(variantName.toLowerCase())) {
    return `${baseTitle} - ${variantName}`;
  }
  return baseTitle;
}



