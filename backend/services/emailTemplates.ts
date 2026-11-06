// Email templates for Pouch Supply Co. with responsive cross-client styling
export interface EmailTemplateData {
  headerLogoImage?: string;
  logoUrl?: string;
  customerName?: string;
  customerEmail?: string;
  orderId?: string;
  orderDate?: string;
  items?: Array<{
    productId?: string;
    productTitle?: string;
    price?: number;
    quantity?: number;
    image?: string;
  }>;
  total?: number;
  subtotal?: number;
  deliveryCost?: number;
  discountAmount?: number;
  destination?: string;
  deliveryMethod?: string;
  paymentStatus?: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  cancellationReason?: string;
  refundAmount?: number;
  refundReason?: string;
  verificationCode?: string;
  verificationLink?: string;
  resetLink?: string;
  resetToken?: string;
  discountCode?: string;
  supportEmail?: string;
  siteUrl?: string;
  /** Subscription price-change notice. */
  planName?: string;
  previousAmount?: number;
  newAmount?: number;
  /** ISO or display date from which newAmount is charged. */
  effectiveFrom?: string;
  billingInterval?: string;
}

const BRAND_NAME = "Pouch Supply Co.";
const BRAND_HEADER_BG = "#e7e7e7";
const BRAND_PRIMARY = "#071d37";
const BRAND_ACCENT = "#008060";
const BRAND_BG = "#f8fafc";
const SUPPORT_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "support@pouch-supply.com";

// The storefront logo is stored however it was uploaded: Cloudinary hands back an
// absolute https URL, the local uploader hands back "/api/uploads/<file>", and the
// browser fallback stores a base64 data URI. Only the first of those survives an
// inbox — a mail client has no base URL to resolve a relative src against, and
// Gmail, Outlook and Yahoo all strip `data:` image sources. So the logo has to be
// made absolute here or every template arrives with a broken image box.
// Deliberately not NEXTAUTH_URL: that is an auth callback host (currently the
// vercel.app deployment URL) and would put a stranger's domain in front of every
// customer. The apex 308-redirects to www, so www is the form that fetches clean.
const EMAIL_ASSET_BASE_URL = (
  process.env.EMAIL_ASSET_BASE_URL ||
  process.env.APP_URL ||
  'https://www.pouch-supply.com'
).trim().replace(/\/+$/, '');

function resolveEmailLogoSrc(raw?: string): string {
  const url = (raw || '').trim();
  if (!url) return '';
  // Better the typeset wordmark below than an empty box the client refused to load.
  if (/^data:/i.test(url)) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${EMAIL_ASSET_BASE_URL}/${url.replace(/^\/+/, '')}`;
}

function renderBaseHeader(title: string, subtitle?: string, data?: EmailTemplateData): string {
  const logoUrl = resolveEmailLogoSrc(data?.headerLogoImage || data?.logoUrl);

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${BRAND_BG}; color: #334155; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 24px; margin-bottom: 24px; border: 1px solid #e2e8f0; }
      .header { background-color: ${BRAND_HEADER_BG}; padding: 24px 20px; text-align: center; color: #071d37; border-bottom: 1px solid #e2e8f0; }
      .title-box { padding: 24px 24px 12px 24px; text-align: center; }
      .heading { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; }
      .subheading { font-size: 14px; color: #64748b; margin: 0; leading: 1.5; }
      .body-content { padding: 0 24px 24px 24px; }
      .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
      .btn { display: inline-block; background-color: ${BRAND_PRIMARY}; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px; margin-top: 12px; margin-bottom: 12px; }
      .footer { background-color: #0f172a; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; }
      .footer a { color: #00e599; text-decoration: none; }
      .item-table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 16px; }
      .item-table th { text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b; border-b: 1px solid #e2e8f0; padding-bottom: 8px; }
      .item-table td { padding: 12px 0; border-b: 1px solid #f1f5f9; font-size: 13px; }
      .total-row { font-weight: 700; font-size: 15px; color: #0f172a; }
      .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
      .badge-success { background-color: #dcfce7; color: #166534; }
      .badge-info { background-color: #e0f2fe; color: #0369a1; }
      .badge-warning { background-color: #fef3c7; color: #92400e; }
      .badge-danger { background-color: #fee2e2; color: #991b1b; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        ${logoUrl ? `
          <img src="${logoUrl}" alt="${BRAND_NAME}" style="max-height: 52px; max-width: 240px; object-fit: contain; margin: 0 auto; display: block;" />
        ` : `
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
            <tr>
              <td style="vertical-align: middle; padding-right: 10px;">
                <div style="width: 38px; height: 38px; background: #008060; border-radius: 10px; text-align: center; line-height: 38px;">
                  <span style="color: #ffffff; font-weight: 900; font-size: 18px; font-family: sans-serif;">P</span>
                </div>
              </td>
              <td style="vertical-align: middle; text-align: left;">
                <div style="font-size: 20px; font-weight: 900; letter-spacing: 1px; color: #071d37; text-transform: uppercase; line-height: 1.1;">POUCH SUPPLY</div>
                <div style="font-size: 10px; font-weight: 700; color: #008060; letter-spacing: 2px; text-transform: uppercase;">PREMIUM CANISTERS</div>
              </td>
            </tr>
          </table>
        `}
      </div>
      <div class="title-box">
        <h1 class="heading">${title}</h1>
        ${subtitle ? `<p class="subheading">${subtitle}</p>` : ''}
      </div>
      <div class="body-content">
  `;
}

function renderBaseFooter(): string {
  return `
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px 0; font-weight: 700; color: #ffffff;">${BRAND_NAME}</p>
        <p style="margin: 0 0 12px 0;">UK-Licensed Laboratory Pouch Compounding Facility</p>
        <p style="margin: 0;">Need support? Email us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
        <p style="margin-top: 16px; font-size: 10px; color: #64748b;">© ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

function renderOrderItemsTable(data: EmailTemplateData): string {
  if (!data.items || data.items.length === 0) {
    return `<p style="font-size: 13px; color: #64748b;">No items detailed.</p>`;
  }

  const itemsHtml = data.items.map(item => {
    const lineTotal = (item.price || 0) * (item.quantity || 1);
    // Loyalty reward lines ship at £0. Showing "£0.00" next to a can reads as a
    // pricing error, so they are labelled as the gift they are.
    const isReward = Boolean((item as any).isRewardItem);
    const detailBits = [`Qty: ${item.quantity || 1}`];
    if ((item as any).variant && (item as any).variant !== 'Standard') detailBits.push(String((item as any).variant));
    if ((item as any).vendor) detailBits.unshift(String((item as any).vendor));
    return `
    <tr>
      <td style="width: 60%; font-weight: 600; color: #1e293b;">
        ${item.productTitle || 'Nicotine Canister Pack'}
        ${isReward ? `<div style="font-size: 10px; color: #166534; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;">Loyalty reward — included free</div>` : ''}
        <div style="font-size: 11px; color: #64748b; font-weight: normal;">${detailBits.join(' · ')}</div>
      </td>
      <td style="width: 40%; text-align: right; font-weight: 700; color: ${isReward ? '#166534' : '#0f172a'};">
        ${isReward || lineTotal === 0 ? 'FREE' : `£${lineTotal.toFixed(2)}`}
      </td>
    </tr>
  `;
  }).join('');

  const total = data.total !== undefined ? data.total : 0;
  // Only guessed when the caller sent no delivery figure; a free-delivery reward
  // makes the order value a poor proxy, so callers should always pass it.
  const delivery = data.deliveryCost !== undefined ? data.deliveryCost : (total >= 40 ? 0 : 2.99);
  const subtotal = data.subtotal !== undefined ? data.subtotal : Math.max(0, total - delivery);

  return `
    <table class="item-table">
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div style="background-color: #f8fafc; border-radius: 8px; padding: 12px 16px; margin-top: 12px;">
      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #64748b;">
        <span>Subtotal</span>
        <span style="font-weight: 600; color: #334155;">£${subtotal.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #64748b;">
        <span>Royal Mail Delivery</span>
        <span style="font-weight: 600; color: #334155;">${delivery === 0 ? 'FREE' : `£${delivery.toFixed(2)}`}</span>
      </div>
      ${data.discountAmount ? `
      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #166534;">
        <span>Discount</span>
        <span style="font-weight: 700;">-£${data.discountAmount.toFixed(2)}</span>
      </div>
      ` : ''}
      <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; color: #0f172a; border-top: 1px solid #e2e8f0; pt: 8px; margin-top: 8px;">
        <span>Total Paid</span>
        <span style="color: ${BRAND_PRIMARY};">£${total.toFixed(2)} GBP</span>
      </div>
    </div>
  `;
}

// 1. Order Confirmation Template
export function renderOrderConfirmationTemplate(data: EmailTemplateData): string {
  const name = data.customerName || 'Valued Customer';
  const orderId = data.orderId || 'PS10001';

  return renderBaseHeader(`Order Confirmation #${orderId}`, `Thank you for your order, ${name}!`, data) + `
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <span style="font-size: 12px; color: #64748b; font-weight: 700;">ORDER REFERENCE</span>
          <div style="font-size: 16px; font-weight: 900; color: #0f172a;">${orderId}</div>
        </div>
        <div>
          <span class="badge badge-success">Payment Confirmed</span>
        </div>
      </div>
      <p style="font-size: 13px; color: #475569; margin: 0;">
        Your nicotine pouch order has been received and sent to our compounding lab for priority dispatch.
      </p>
    </div>

    <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 20px; margin-bottom: 8px;">Order Summary</h3>
    ${renderOrderItemsTable(data)}

    <div class="card" style="margin-top: 20px;">
      <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; color: #475569;">Delivery Address</h4>
      <p style="margin: 0; font-size: 13px; color: #1e293b; font-weight: 600;">
        ${data.destination || 'United Kingdom'}
      </p>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">
        Method: ${data.deliveryMethod || 'Royal Mail Tracked 24/48'}
      </p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${data.siteUrl || '#'}" class="btn">View Order Status</a>
    </div>
  ` + renderBaseFooter();
}

// 2. Order Processing Template
export function renderOrderProcessingTemplate(data: EmailTemplateData): string {
  const name = data.customerName || 'Valued Customer';
  const orderId = data.orderId || 'PS10001';

  return renderBaseHeader(`Order Processing #${orderId}`, `We are packing your canisters, ${name}!`, data) + `
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <span style="font-size: 12px; color: #64748b; font-weight: 700;">ORDER REFERENCE</span>
          <div style="font-size: 16px; font-weight: 900; color: #0f172a;">${orderId}</div>
        </div>
        <div>
          <span class="badge badge-info">Processing</span>
        </div>
      </div>
      <p style="font-size: 13px; color: #475569; margin: 0;">
        Great news! Your canisters are being verified, sealed, and prepared for carrier pickup.
      </p>
    </div>

    ${renderOrderItemsTable(data)}

    <div style="text-align: center; margin-top: 24px;">
      <a href="${data.siteUrl || '#'}" class="btn">Track Order</a>
    </div>
  ` + renderBaseFooter();
}

// 3. Order Shipped Template
export function renderOrderShippedTemplate(data: EmailTemplateData): string {
  const name = data.customerName || 'Valued Customer';
  const orderId = data.orderId || 'PS10001';
  // Only shown when Royal Mail actually issued a number. Non-tracked services
  // (the Online Postage range: 1st/2nd Class and Signed For) never do, and a
  // placeholder here reached the customer as a real tracking number.
  const tracking = data.trackingNumber || '';
  const carrier = data.carrier || 'Royal Mail';

  const trackingBlock = tracking
    ? `
    <div class="card" style="background-color: #f0fdf4; border-color: #bbf7d0;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <span style="font-size: 12px; color: #166534; font-weight: 700;">TRACKING NUMBER</span>
          <div style="font-size: 18px; font-weight: 900; color: #14532d; font-family: monospace;">${tracking}</div>
        </div>
        <div>
          <span class="badge badge-success">Shipped</span>
        </div>
      </div>
      <p style="font-size: 13px; color: #15803d; margin: 0;">
        Carrier: <strong>${carrier}</strong>
      </p>
    </div>`
    : `
    <div class="card" style="background-color: #f0fdf4; border-color: #bbf7d0;">
      <span class="badge badge-success" style="margin-bottom: 8px;">Shipped</span>
      <p style="font-size: 13px; color: #15803d; margin: 0;">
        Sent by <strong>${carrier}</strong>. This service does not include parcel tracking.
      </p>
    </div>`;

  const trackButton = tracking
    ? `
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://www.royalmail.com/track-your-item#/${tracking}" class="btn">Track Package</a>
    </div>`
    : '';

  return renderBaseHeader(`Order Dispatched #${orderId}`, `Your package is on its way, ${name}!`, data) + `
    ${trackingBlock}

    ${renderOrderItemsTable(data)}

    ${trackButton}
  ` + renderBaseFooter();
}

// 4. Out for Delivery Template
export function renderOutForDeliveryTemplate(data: EmailTemplateData): string {
  const name = data.customerName || 'Valued Customer';
  const orderId = data.orderId || 'PS10001';

  return renderBaseHeader(`Out for Delivery #${orderId}`, `Arriving today, ${name}!`, data) + `
    <div class="card" style="background-color: #f0f9ff; border-color: #bae6fd;">
      <span class="badge badge-info" style="margin-bottom: 8px;">Out for Delivery</span>
      <p style="font-size: 14px; color: #0369a1; font-weight: 700; margin: 0 0 6px 0;">
        Your courier has your package on the delivery vehicle today!
      </p>
      ${data.trackingNumber ? `<p style="font-size: 12px; color: #0284c7; margin: 0;">
        Tracking Ref: <strong>${data.trackingNumber}</strong>
      </p>` : ''}
    </div>

    ${renderOrderItemsTable(data)}
  ` + renderBaseFooter();
}

// 5. Delivered Template
export function renderDeliveredTemplate(data: EmailTemplateData): string {
  const name = data.customerName || 'Valued Customer';
  const orderId = data.orderId || 'PS10001';

  return renderBaseHeader(`Order Delivered #${orderId}`, `Enjoy your pouch supply, ${name}!`, data) + `
    <div class="card" style="background-color: #f0fdf4; border-color: #bbf7d0; text-align: center;">
      <span class="badge badge-success" style="margin-bottom: 8px;">Delivered</span>
      <p style="font-size: 15px; color: #166534; font-weight: 800; margin: 0 0 6px 0;">
        Your order has been safely delivered!
      </p>
      <p style="font-size: 12px; color: #15803d; margin: 0;">
        Delivered to address: ${data.destination || 'United Kingdom'}
      </p>
    </div>

    <p style="font-size: 13px; color: #475569; text-align: center;">
      We hope you enjoy your nicotine canisters. Have feedback or need help? Reply to this email!
    </p>

    <div style="text-align: center; margin-top: 20px;">
      <a href="${data.siteUrl || '#'}" class="btn">Shop Again</a>
    </div>
  ` + renderBaseFooter();
}

/**
 * Subscription price change notice.
 *
 * Sent when the price of a plan someone is already subscribed to changes. It has
 * to state the old price, the new price and the date the new one first applies,
 * because that is what makes it a notice rather than a surprise on a statement —
 * and it must read correctly for a decrease as well as an increase.
 */
export function renderSubscriptionPriceChangeTemplate(data: EmailTemplateData): string {
  const name = data.customerName || 'Valued Customer';
  const plan = data.planName || 'your plan';
  const previous = Number(data.previousAmount) || 0;
  const next = Number(data.newAmount) || 0;
  const isIncrease = next > previous;
  const every = data.billingInterval ? ` (${data.billingInterval})` : '';

  const effective = (() => {
    const d = data.effectiveFrom ? new Date(data.effectiveFrom) : null;
    if (!d || isNaN(d.getTime())) return 'your next renewal';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  const headline = isIncrease
    ? `The price of ${plan} is going up`
    : `Good news — ${plan} is getting cheaper`;

  return renderBaseHeader('Your subscription price is changing', headline, data) + `
    <div class="card">
      <p style="font-size: 14px; color: #0f172a; font-weight: 700; margin: 0 0 12px 0;">
        Hi ${name},
      </p>
      <p style="font-size: 13px; color: #475569; margin: 0 0 16px 0;">
        We're letting you know that the price of your subscription is changing.
        You don't need to do anything — your deliveries continue as normal.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0 0 16px 0;">
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: #64748b;">Your plan</td>
          <td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 800; text-align: right;">${plan}${every}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0;">Current price</td>
          <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 700; text-align: right; border-top: 1px solid #e2e8f0; text-decoration: line-through;">£${previous.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 800; border-top: 1px solid #e2e8f0;">New price</td>
          <td style="padding: 8px 0; font-size: 16px; color: ${isIncrease ? '#b91c1c' : '#15803d'}; font-weight: 900; text-align: right; border-top: 1px solid #e2e8f0;">£${next.toFixed(2)}</td>
        </tr>
      </table>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
        <p style="font-size: 13px; color: #0f172a; margin: 0; font-weight: 700;">
          From ${effective}, your next recurring payment will be £${next.toFixed(2)}.
        </p>
        <p style="font-size: 12px; color: #64748b; margin: 6px 0 0 0;">
          Any delivery before that date is charged at your current price of £${previous.toFixed(2)}.
        </p>
      </div>
    </div>

    <p style="font-size: 13px; color: #475569; text-align: center;">
      Happy with the change? There's nothing to do. If you'd rather adjust or cancel your plan,
      you can do that any time from your account before ${effective}.
    </p>

    <div style="text-align: center; margin-top: 20px;">
      <a href="${data.siteUrl || '#'}/pages/account/subscriptions" class="btn">Manage My Subscription</a>
    </div>
  ` + renderBaseFooter();
}

// 6. Cancelled Template
export function renderOrderCancelledTemplate(data: EmailTemplateData): string {
  const name = data.customerName || 'Valued Customer';
  const orderId = data.orderId || 'PS10001';

  return renderBaseHeader(`Order Cancelled #${orderId}`, `Notice regarding your order`, data) + `
    <div class="card" style="background-color: #fef2f2; border-color: #fecaca;">
      <span class="badge badge-danger" style="margin-bottom: 8px;">Cancelled</span>
      <p style="font-size: 13px; color: #991b1b; font-weight: 600; margin: 0 0 4px 0;">
        Your order #${orderId} has been cancelled.
      </p>
      ${data.cancellationReason ? `<p style="font-size: 12px; color: #b91c1c; margin: 0;">Reason: ${data.cancellationReason}</p>` : ''}
    </div>

    <p style="font-size: 13px; color: #475569;">
      If any payment was processed, a full refund has been initiated back to your original payment method.
    </p>
  ` + renderBaseFooter();
}

// 7. Refunded Template
export function renderOrderRefundedTemplate(data: EmailTemplateData): string {
  const name = data.customerName || 'Valued Customer';
  const orderId = data.orderId || 'PS10001';
  const refundAmount = data.refundAmount !== undefined ? data.refundAmount : (data.total || 0);

  return renderBaseHeader(`Refund Processed #${orderId}`, `Refund confirmation for ${name}`, data) + `
    <div class="card" style="background-color: #f0fdf4; border-color: #bbf7d0;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 12px; color: #166534; font-weight: 700;">REFUND AMOUNT</span>
          <div style="font-size: 20px; font-weight: 900; color: #14532d;">£${refundAmount.toFixed(2)} GBP</div>
        </div>
        <div>
          <span class="badge badge-success">Refunded</span>
        </div>
      </div>
      ${data.refundReason ? `<p style="font-size: 12px; color: #15803d; margin-top: 8px;">Reason: ${data.refundReason}</p>` : ''}
    </div>

    <p style="font-size: 13px; color: #475569;">
      The refund has been issued to your payment card. It typically takes 2–5 business days to appear on your bank statement.
    </p>
  ` + renderBaseFooter();
}

// 7b. Exchange Template
export function renderOrderExchangedTemplate(data: EmailTemplateData): string {
  const name = data.customerName || 'Valued Customer';
  const orderId = data.orderId || 'PS10001';

  return renderBaseHeader(`Order Exchange Processed #${orderId}`, `Exchange confirmation for ${name}`, data) + `
    <div class="card" style="background-color: #f0f9ff; border-color: #bae6fd;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 12px; color: #0369a1; font-weight: 700;">EXCHANGE CONFIRMED</span>
          <div style="font-size: 16px; font-weight: 900; color: #0c4a6e;">Order #${orderId} Exchanged</div>
        </div>
        <div>
          <span class="badge badge-info">Exchanged</span>
        </div>
      </div>
      ${data.refundReason ? `<p style="font-size: 12px; color: #0284c7; margin-top: 8px;">Exchange Details: ${data.refundReason}</p>` : ''}
    </div>

    <h3 style="font-size: 13px; text-transform: uppercase; color: #64748b; margin-top: 16px;">Exchanged Items</h3>
    ${renderOrderItemsTable(data)}

    <p style="font-size: 13px; color: #475569; margin-top: 16px;">
      Your exchange request has been processed and your replacement items are being prepared for dispatch with priority courier delivery.
    </p>
  ` + renderBaseFooter();
}

// 8. Password Reset Template
export function renderPasswordResetTemplate(data: EmailTemplateData): string {
  const name = data.customerName || 'Customer';
  const resetLink = data.resetLink || `${data.siteUrl || '#'}`;
  const token = data.resetToken || '';

  return renderBaseHeader(`Reset Your Password`, `Security request for ${name}`, data) + `
    <div class="card" style="text-align: center;">
      <p style="font-size: 13px; color: #334155; margin: 0 0 12px 0;">
        We received a request to reset the password for your account associated with <strong>${data.customerEmail || ''}</strong>.
      </p>

      ${token ? `
      <div style="background-color: #0f172a; color: ${BRAND_ACCENT}; font-size: 22px; font-weight: 900; letter-spacing: 4px; padding: 14px; border-radius: 8px; font-family: monospace; display: inline-block; margin: 12px 0;">
        ${token}
      </div>
      <p style="font-size: 12px; color: #64748b; margin: 0 0 12px 0;">Your Reset Code / Token</p>
      ` : ''}

      <p style="font-size: 12px; color: #64748b; margin: 0;">
        You can also click the button below to reset your password directly on our storefront.
      </p>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${resetLink}" class="btn">Reset Password Now</a>
    </div>

    <p style="font-size: 11px; color: #94a3b8; text-align: center;">
      This link/code will expire in 1 hour for your security.
    </p>
  ` + renderBaseFooter();
}

// 9. Email Verification Template
export function renderEmailVerificationTemplate(data: EmailTemplateData): string {
  const name = data.customerName || 'Customer';
  const code = data.verificationCode || '849201';

  return renderBaseHeader(`Verify Your Email`, `Welcome to ${BRAND_NAME}, ${name}!`, data) + `
    <div class="card" style="text-align: center;">
      <p style="font-size: 13px; color: #475569; margin: 0 0 16px 0;">
        Please verify your email address to complete your account setup and access member-only canister pricing.
      </p>
      
      <div style="background-color: #0f172a; color: ${BRAND_ACCENT}; font-size: 28px; font-weight: 900; letter-spacing: 6px; padding: 16px; border-radius: 8px; font-family: monospace; display: inline-block;">
        ${code}
      </div>

      <p style="font-size: 12px; color: #64748b; margin-top: 16px;">
        Enter this 6-digit verification code on the account verification page.
      </p>
    </div>
  ` + renderBaseFooter();
}

// 10. Welcome Email Template
export function renderWelcomeTemplate(data: EmailTemplateData): string {
  const name = data.customerName || 'Friend';
  const code = data.discountCode || 'WELCOME10';

  return renderBaseHeader(`Welcome to ${BRAND_NAME}!`, `Your laboratory pouch subscription begins here`, data) + `
    <div class="card" style="background-color: #f8fafc; text-align: center; padding: 24px;">
      <p style="font-size: 14px; color: #1e293b; font-weight: 600; margin: 0 0 12px 0;">
        Welcome to the UK's premier nicotine canister compounding standard.
      </p>
      <p style="font-size: 13px; color: #64748b; margin: 0 0 20px 0;">
        As a welcome gift, take <strong>10% OFF</strong> your first order with your personal code:
      </p>

      <div style="border: 2px dashed ${BRAND_PRIMARY}; background-color: #ffffff; padding: 12px; border-radius: 8px; font-size: 20px; font-weight: 900; color: ${BRAND_PRIMARY}; letter-spacing: 2px; font-family: monospace; display: inline-block;">
        ${code}
      </div>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${data.siteUrl || '#'}" class="btn">Explore Canisters</a>
    </div>
  ` + renderBaseFooter();
}

// 11. Admin New Order Notification Template
export function renderAdminNewOrderTemplate(data: EmailTemplateData): string {
  const orderId = data.orderId || 'PS10001';
  const name = data.customerName || 'Customer';
  const total = data.total !== undefined ? data.total : 0;

  return renderBaseHeader(`🚨 New Order #${orderId}`, `Storefront Sale Alert: £${total.toFixed(2)} GBP`, data) + `
    <div class="card" style="background-color: #f0fdf4; border-color: #bbf7d0;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 11px; color: #166534; font-weight: 800; text-transform: uppercase;">CUSTOMER</span>
          <div style="font-size: 15px; font-weight: 800; color: #14532d;">${name}</div>
          <div style="font-size: 12px; color: #15803d;">${data.customerEmail || 'No email'}</div>
        </div>
        <div>
          <span class="badge badge-success">£${total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <h3 style="font-size: 13px; text-transform: uppercase; color: #64748b; margin-top: 16px;">Order Items</h3>
    ${renderOrderItemsTable(data)}

    <div class="card" style="margin-top: 16px;">
      <h4 style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; color: #475569;">Destination Address</h4>
      <p style="margin: 0; font-size: 12px; color: #1e293b; font-weight: 600;">
        ${data.destination || 'United Kingdom'}
      </p>
    </div>
  ` + renderBaseFooter();
}
