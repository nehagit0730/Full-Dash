/**
 * UK-only delivery rules, shared by the checkout form and the order endpoints.
 *
 * The store ships domestically only: its Royal Mail contract carries the Online
 * Postage (OLP) services, which are UK services, and age verification is run
 * against a UK provider. An order to any other country cannot be fulfilled, so
 * it is refused at checkout rather than taken and cancelled afterwards.
 *
 * The same module is imported by the browser and by the Express routes on
 * purpose: a check that only exists in the form is not a rule, it is a
 * suggestion — anything posting straight to /api/worldpay/session would sail
 * past it.
 */

/** Country names and codes that mean "United Kingdom". */
const UK_COUNTRY_TOKENS = new Set([
  'gb',
  'uk',
  'gbr',
  'united kingdom',
  'united kingdom of great britain and northern ireland',
  'great britain',
  'britain',
  'england',
  'scotland',
  'wales',
  'northern ireland'
]);

/**
 * Standard UK postcode shape (Royal Mail PAF), with optional inner space.
 * Deliberately anchored: "SW1A 1AA extra" is not a postcode.
 */
const UK_POSTCODE_RE = /^(GIR ?0AA|[A-PR-UWYZ][A-HK-Y]?[0-9][0-9A-HJKPS-UW]? ?[0-9][ABD-HJLNP-UW-Z]{2})$/i;

export function isUkCountry(value?: string): boolean {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return false;
  return UK_COUNTRY_TOKENS.has(raw);
}

/** The ISO code the rest of the system stores for a UK address. */
export const UK_COUNTRY_CODE = 'GB';
export const UK_COUNTRY_NAME = 'United Kingdom';

export function normalizeUkPostcode(value?: string): string {
  const compact = String(value ?? '').toUpperCase().replace(/\s+/g, '');
  if (compact.length < 5) return compact;
  // Royal Mail formats the postcode as outward + space + 3-character inward.
  return `${compact.slice(0, compact.length - 3)} ${compact.slice(-3)}`;
}

export function isValidUkPostcode(value?: string): boolean {
  const raw = String(value ?? '').trim();
  if (!raw) return false;
  return UK_POSTCODE_RE.test(raw.replace(/\s+/g, ' '));
}

/**
 * Reduces a typed UK number to its national form (a leading 0 and 10-11 digits).
 * Returns an empty string when the input cannot be a UK number.
 *
 * Accepts the forms customers actually type: "07700 900123", "+44 7700 900123",
 * "0044 7700 900123", "(01234) 567890".
 */
export function normalizeUkPhone(value?: string): string {
  let digits = String(value ?? '').replace(/[\s().-]/g, '');
  if (!digits) return '';

  if (digits.startsWith('+44')) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith('0044')) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith('44') && digits.length >= 11) digits = `0${digits.slice(2)}`;

  if (!/^0\d+$/.test(digits)) return '';
  // A UK number is 10 or 11 digits including the trunk 0 (01/02/03 landlines,
  // 07 mobiles, 08/09 service numbers).
  if (digits.length < 10 || digits.length > 11) return '';
  return digits;
}

export function isValidUkPhone(value?: string): boolean {
  return normalizeUkPhone(value).length > 0;
}

export interface UkDeliveryCheckInput {
  phone?: string;
  postcode?: string;
  country?: string;
  countryCode?: string;
}

/**
 * One place that decides whether an order may be placed, so the form and the
 * server always agree on the reason it was refused.
 */
export function validateUkDelivery(input: UkDeliveryCheckInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const country = input.country || input.countryCode || '';
  if (!isUkCountry(country)) {
    errors.push(
      'We currently deliver to United Kingdom addresses only. Please use a UK delivery address to place your order.'
    );
  }

  if (!String(input.postcode ?? '').trim()) {
    errors.push('A UK postcode is required.');
  } else if (!isValidUkPostcode(input.postcode)) {
    errors.push('Please enter a valid UK postcode (for example SW1A 1AA).');
  }

  if (!String(input.phone ?? '').trim()) {
    errors.push('A contact phone number is required so we can reach you about your delivery.');
  } else if (!isValidUkPhone(input.phone)) {
    errors.push('Please enter a valid UK phone number (for example 07700 900123).');
  }

  return { valid: errors.length === 0, errors };
}
