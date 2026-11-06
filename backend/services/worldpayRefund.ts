/**
 * Worldpay refund execution.
 *
 * Extracted from the HTTP route so that internal callers (order cancellation,
 * admin refund actions) can refund directly instead of the server making an
 * HTTP request to itself. The self-call was fragile behind proxies and, because
 * the route also emailed the customer, it produced a second refund email on top
 * of the one the order status transition already sends.
 *
 * This function talks to the gateway ONLY. Persisting the order and notifying
 * the customer is the caller's job, via saveSingleOrder.
 */
export interface WorldpayRefundResult {
  success: boolean;
  refundRef: string;
  transactionId: string;
  amount: number;
  message: string;
  gatewayContacted: boolean;
}

export async function refundWorldpayPayment({
  order,
  amount,
  reason,
  transactionId
}: {
  order: any;
  amount?: number;
  reason?: string;
  transactionId?: string;
}): Promise<WorldpayRefundResult> {
  const username = process.env.WORLDPAY_API_USERNAME || '';
  const password = process.env.WORLDPAY_API_PASSWORD || '';
  const baseUrl = (process.env.WORLDPAY_BASE_URL || 'https://access.worldpay.com').replace(/\/+$/, '');

  const txId = transactionId || order?.worldpayTxId || order?.gatewayTxId || '';
  const refundAmount = typeof amount === 'number' ? amount : Number(order?.total || 0);
  const refundRef = `WP-REFUND-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  if (!username || !password) {
    return {
      success: false,
      refundRef,
      transactionId: txId,
      amount: refundAmount,
      gatewayContacted: false,
      message: 'Worldpay credentials are not configured; the refund was recorded in the store only.'
    };
  }

  if (!txId) {
    return {
      success: false,
      refundRef,
      transactionId: '',
      amount: refundAmount,
      gatewayContacted: false,
      message: 'No Worldpay transaction id on this order; the refund was recorded in the store only.'
    };
  }

  const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

  try {
    const response = await fetch(`${baseUrl}/api/payments/${encodeURIComponent(txId)}/refunds`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        value: {
          currency: order?.currency || 'GBP',
          amount: Math.round(refundAmount * 100)
        },
        reference: refundRef,
        description: reason || 'Customer requested refund'
      })
    });

    const data: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = data?.description || data?.message || `Worldpay API returned status ${response.status}`;
      console.warn('[Worldpay Refund] Gateway rejected the refund:', response.status, errMsg);
      return {
        success: false,
        refundRef,
        transactionId: txId,
        amount: refundAmount,
        gatewayContacted: true,
        message: errMsg
      };
    }

    return {
      success: true,
      refundRef: data?.reference || refundRef,
      transactionId: txId,
      amount: refundAmount,
      gatewayContacted: true,
      message: `Worldpay refund of £${refundAmount.toFixed(2)} accepted by the gateway.`
    };
  } catch (err: any) {
    console.error('[Worldpay Refund] API call failed:', err);
    return {
      success: false,
      refundRef,
      transactionId: txId,
      amount: refundAmount,
      gatewayContacted: false,
      message: err?.message || 'Unable to reach the Worldpay refund endpoint.'
    };
  }
}
