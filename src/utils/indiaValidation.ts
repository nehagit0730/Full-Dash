/**
 * Delivery address rules for India. Shared by the checkout form and the server,
 * so the browser and the payment endpoint can never disagree about what an
 * acceptable address is. The server is the gate; the form is a convenience.
 */

export const INDIA_COUNTRY_NAME = 'India';
export const INDIA_COUNTRY_CODE = 'IN';

export const INDIA_STATES: readonly string[] = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh',
  'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal'
];

/** 10-digit Indian mobile number (starts 6–9), with any +91 / 0 prefix and spacing removed. Empty if invalid. */
export function normalizeIndianPhone(raw: string | null | undefined): string {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : '';
}

/** 6-digit PIN code (cannot start with 0). Empty if invalid. */
export function normalizePincode(raw: string | null | undefined): string {
  const v = String(raw || '').replace(/\s/g, '');
  return /^[1-9]\d{5}$/.test(v) ? v : '';
}

export function normalizeState(raw: string | null | undefined): string {
  const v = String(raw || '').trim().toLowerCase();
  return INDIA_STATES.find(s => s.toLowerCase() === v) || '';
}

export interface IndiaAddressInput {
  fullName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  /** Older payloads call it postcode. */
  postcode?: string;
  phone?: string;
  country?: string;
}

export interface ValidatedIndiaAddress {
  fullName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  country: string;
}

export function validateIndiaAddress(
  input: IndiaAddressInput | null | undefined
): { valid: boolean; errors: string[]; address?: ValidatedIndiaAddress } {
  const a = input || {};
  const errors: string[] = [];
  const country = String(a.country || INDIA_COUNTRY_NAME).trim();
  if (!/^(india|in)$/i.test(country)) errors.push('We currently deliver within India only.');

  const fullName = String(a.fullName || '').trim();
  const address1 = String(a.address1 || '').trim();
  const city = String(a.city || '').trim();
  const pincode = normalizePincode(a.pincode || a.postcode);
  const state = normalizeState(a.state);
  const phone = normalizeIndianPhone(a.phone);

  if (address1.length < 3) errors.push('Enter your street address.');
  if (city.length < 2) errors.push('Enter your city.');
  if (!state) errors.push('Choose your state or union territory.');
  if (!pincode) errors.push('Enter a valid 6-digit PIN code.');
  if (!phone) errors.push('Enter a valid 10-digit Indian mobile number.');

  if (errors.length) return { valid: false, errors };
  return {
    valid: true,
    errors: [],
    address: {
      fullName,
      address1,
      address2: String(a.address2 || '').trim(),
      city,
      state,
      pincode,
      phone,
      country: INDIA_COUNTRY_NAME
    }
  };
}

export function formatIndiaAddress(a: ValidatedIndiaAddress): string {
  return [a.address1, a.address2, a.city, `${a.state} ${a.pincode}`, a.country].filter(Boolean).join(', ');
}
