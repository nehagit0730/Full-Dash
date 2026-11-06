/**
 * Customer-facing reading of an order's fulfilment status.
 *
 * `fulfillmentStatus` carries two values that mean the parcel has left us:
 * 'Shipped', written by the Royal Mail sync once Click & Drop confirms despatch,
 * and 'Fulfilled', set by hand in admin. They are the same fact to a customer,
 * but each screen used to test for one or the other, so an order despatched by
 * the sync still read as "Processing" while one moved by hand read as "In
 * Transit" — two words for one state, on the same page, neither matching what
 * Royal Mail tells the customer.
 *
 * Both now resolve here, and "Dispatched" is the single word for it. "In transit"
 * is deliberately NOT used for a status value: it asserts movement, which we only
 * know from a live Royal Mail scan, and the live tracking card says it there.
 */

export type DispatchStage = 'processing' | 'dispatched' | 'delivered' | 'exception';

const DISPATCHED_STATUSES = ['Shipped', 'Fulfilled'];

/**
 * Statuses that are not a point on the despatch journey at all. They must never
 * be collapsed into "Processing": telling someone their cancelled order is being
 * prepared is worse than any wording this module was written to fix.
 */
const EXCEPTION_STATUSES = ['Cancelled', 'Exchanged'];

export function isException(fulfillmentStatus?: string | null): boolean {
  return EXCEPTION_STATUSES.includes(String(fulfillmentStatus));
}

export function isDelivered(fulfillmentStatus?: string | null): boolean {
  return fulfillmentStatus === 'Delivered';
}

/** True once the parcel is with the carrier — by sync or by hand. */
export function isDispatched(fulfillmentStatus?: string | null): boolean {
  return DISPATCHED_STATUSES.includes(String(fulfillmentStatus));
}

/** Still being packed: on the journey, but not yet with the carrier. */
export function isProcessing(fulfillmentStatus?: string | null): boolean {
  return dispatchStage(fulfillmentStatus) === 'processing';
}

export function dispatchStage(fulfillmentStatus?: string | null): DispatchStage {
  if (isException(fulfillmentStatus)) return 'exception';
  if (isDelivered(fulfillmentStatus)) return 'delivered';
  if (isDispatched(fulfillmentStatus)) return 'dispatched';
  return 'processing';
}

/** The word the customer sees. */
export function dispatchLabel(fulfillmentStatus?: string | null): string {
  switch (dispatchStage(fulfillmentStatus)) {
    case 'delivered':
      return 'Delivered';
    case 'dispatched':
      return 'Dispatched';
    case 'exception':
      // Said in the order's own words — 'Cancelled', 'Exchanged'.
      return String(fulfillmentStatus);
    default:
      return 'Processing';
  }
}
