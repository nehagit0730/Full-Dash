import { Order, Product } from '../types';
import {
  parseSubscriptionProducts,
  formatSubscriptionItemDisplay,
  isSubscriptionLineItem,
  extractSubscriptionDetails
} from './subscriptionParser';

/**
 * Printable / downloadable invoices for the customer portal.
 *
 * The store has no PDF dependency and no server-side invoice renderer, so the
 * document is built here as a self-contained HTML page: it is handed to the
 * browser's print pipeline ("Save as PDF") for a real PDF, and can also be
 * saved verbatim as an .html file when printing is unavailable.
 */

export interface InvoiceBrand {
  name: string;
  legalName?: string;
  logoUrl?: string;
  email?: string;
  website?: string;
  addressLines?: string[];
  vatNumber?: string;
}

export const DEFAULT_INVOICE_BRAND: InvoiceBrand = {
  name: 'POUCH SUPPLY',
  legalName: 'Pouch Supply UK Ltd.',
  email: 'support@pouchsupply.co.uk',
  website: 'www.pouchsupply.co.uk',
  addressLines: ['United Kingdom']
};

const money = (value: number) => `£${(Number(value) || 0).toFixed(2)}`;

/** Escapes any store/customer supplied text before it enters the invoice markup. */
const esc = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** `INV-CT48884` — a stable, human readable reference derived from the order id. */
export function getInvoiceNumber(order: Order): string {
  return `INV-${String(order.id || '').replace(/[^A-Za-z0-9-]/g, '') || 'ORDER'}`;
}

export function getInvoiceFileName(order: Order): string {
  return `${getInvoiceNumber(order)}.html`;
}

/**
 * Splits the recorded total into lines that always add back up to it.
 *
 * Shipping is not persisted on an order, so whatever the total does not owe to
 * the line items (net of any store credit) is reported as a single adjustment:
 * a discount when it reduces the bill, shipping & handling when it raises it.
 */
export function buildInvoiceTotals(order: Order) {
  const itemsSubtotal = (order.items || []).reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );
  const storeCredit = Number(order.storeCreditApplied) || 0;
  const total = Number(order.total) || 0;
  const adjustment = Number((total - itemsSubtotal + storeCredit).toFixed(2));

  return {
    itemsSubtotal,
    storeCredit,
    total,
    discount: adjustment < 0 ? Math.abs(adjustment) : 0,
    shipping: adjustment > 0 ? adjustment : 0
  };
}

export function buildInvoiceHtml(
  order: Order,
  options: { brand?: InvoiceBrand; products?: Product[] } = {}
): string {
  const brand = { ...DEFAULT_INVOICE_BRAND, ...(options.brand || {}) };
  const catalog = options.products || [];
  const totals = buildInvoiceTotals(order);
  const invoiceNo = getInvoiceNumber(order);
  const tracking = order.trackingNumber || order.trackingId || order.data?.royalMail?.trackingNumber || '';
  // The plan this order was bought as, resolved the same way the admin and the
  // account page resolve it. The raw stored planName can name another tier on
  // orders the old plan sync rewrote, and an invoice must describe the sale.
  const subDetails: any = (order.items || []).some(isSubscriptionLineItem)
    ? extractSubscriptionDetails(order, catalog as any)
    : null;

  const rows = (order.items || [])
    .map(item => {
      const isSub = isSubscriptionLineItem(item);
      const title = isSub
        ? subDetails?.planName || item.productTitle
        : item.productTitle;
      const qty = Number(item.quantity) || 0;
      const unit = Number(item.price) || 0;
      const boxItems = isSub ? parseSubscriptionProducts(order, item, catalog as any) : [];

      const meta: string[] = [];
      if (isSub) {
        const frequency = subDetails?.frequency || (item as any).subscriptionFrequency;
        if (frequency) meta.push(`<span>${esc(frequency)} subscription</span>`);
      }
      if (boxItems.length > 0) {
        meta.push(
          `<span class="box-title">Selected box contents</span><ul class="box">${boxItems
            .map(p => `<li>${esc(formatSubscriptionItemDisplay(p as any))}</li>`)
            .join('')}</ul>`
        );
      }

      return `
        <tr>
          <td>
            <span class="item-name">${esc(title)}</span>
            ${meta.length ? `<div class="item-meta">${meta.join('')}</div>` : ''}
          </td>
          <td class="num">${qty}</td>
          <td class="num">${money(unit)}</td>
          <td class="num strong">${money(unit * qty)}</td>
        </tr>`;
    })
    .join('');

  const totalRows = [
    `<tr><td>Subtotal</td><td class="num">${money(totals.itemsSubtotal)}</td></tr>`,
    totals.discount > 0
      ? `<tr class="neg"><td>Discount${
          // `title` is the discount's code, e.g. CRUSHCLUB15.
          order.discountApplied?.title ? ` (${esc(order.discountApplied.title)})` : ''
        }</td><td class="num">-${money(totals.discount)}</td></tr>`
      : '',
    totals.storeCredit > 0
      ? `<tr class="neg"><td>Store credit applied</td><td class="num">-${money(totals.storeCredit)}</td></tr>`
      : '',
    `<tr><td>Shipping${order.deliveryMethod ? ` (${esc(order.deliveryMethod)})` : ''}</td><td class="num">${
      totals.shipping > 0 ? money(totals.shipping) : 'Free'
    }</td></tr>`,
    `<tr class="grand"><td>Total ${order.paymentStatus === 'Paid' ? 'paid' : 'due'}</td><td class="num">${money(
      totals.total
    )}</td></tr>`
  ]
    .filter(Boolean)
    .join('');

  const brandLines = [
    brand.legalName,
    ...(brand.addressLines || []),
    brand.email,
    brand.website,
    brand.vatNumber ? `VAT ${brand.vatNumber}` : ''
  ]
    .filter(Boolean)
    .map(line => esc(line))
    .join('<br />');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(invoiceNo)} — ${esc(brand.name)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #ffffff;
    color: #071d37;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 12px;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet { max-width: 780px; margin: 0 auto; padding: 28px 24px 40px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px;
          padding-bottom: 18px; border-bottom: 3px solid #071d37; }
  .brand-name { font-size: 20px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
  .brand-sub { color: #64748b; font-size: 11px; margin-top: 2px; }
  .brand-logo { max-height: 46px; margin-bottom: 6px; }
  .doc { text-align: right; }
  .doc h1 { margin: 0; font-size: 22px; letter-spacing: 3px; text-transform: uppercase; }
  .doc .ref { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 700; font-size: 13px; margin-top: 4px; }
  .doc .date { color: #64748b; font-size: 11px; }
  .panels { display: flex; gap: 16px; margin: 22px 0; }
  .panel { flex: 1; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; background: #f8fafc; }
  .panel h2 { margin: 0 0 6px; font-size: 9px; letter-spacing: 1.4px; text-transform: uppercase; color: #94a3b8; }
  .panel .strong { font-weight: 800; }
  table { width: 100%; border-collapse: collapse; }
  .items thead th { text-align: left; font-size: 9px; letter-spacing: 1.2px; text-transform: uppercase;
                    color: #ffffff; background: #071d37; padding: 9px 10px; }
  .items tbody td { padding: 11px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  .items .num { text-align: right; white-space: nowrap; }
  .items .strong { font-weight: 800; }
  .item-name { font-weight: 700; }
  .item-meta { color: #64748b; font-size: 10.5px; margin-top: 4px; }
  .box-title { display: block; font-weight: 700; color: #475569; margin-top: 4px; }
  ul.box { margin: 3px 0 0; padding-left: 16px; }
  ul.box li { margin: 1px 0; }
  .lower { display: flex; justify-content: space-between; gap: 24px; margin-top: 20px; align-items: flex-start; }
  .status { font-size: 11px; }
  .status div { margin-bottom: 4px; }
  .badge { display: inline-block; font-size: 9px; font-weight: 800; text-transform: uppercase;
           letter-spacing: 0.6px; padding: 2px 8px; border-radius: 999px; border: 1px solid #cbd5e1; }
  .totals { min-width: 270px; width: auto; }
  .totals td { padding: 6px 0; }
  .totals td.num { text-align: right; font-weight: 700; }
  .totals .neg td.num { color: #b91c1c; }
  .totals .grand td { border-top: 2px solid #071d37; padding-top: 10px; font-size: 15px; font-weight: 900; }
  .foot { margin-top: 30px; padding-top: 14px; border-top: 1px solid #e2e8f0;
          color: #94a3b8; font-size: 10px; text-align: center; }
  .no-print { text-align: center; margin: 16px 0 0; }
  .no-print button { font: inherit; font-weight: 700; cursor: pointer; padding: 9px 18px;
                     border-radius: 8px; border: 0; background: #071d37; color: #fff; }
  @media print { .no-print { display: none !important; } .sheet { padding: 0; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        ${brand.logoUrl ? `<img class="brand-logo" src="${esc(brand.logoUrl)}" alt="${esc(brand.name)}" />` : ''}
        <div class="brand-name">${esc(brand.name)}</div>
        <div class="brand-sub">${brandLines}</div>
      </div>
      <div class="doc">
        <h1>Invoice</h1>
        <div class="ref">${esc(invoiceNo)}</div>
        <div class="date">Order ${esc(order.id)}</div>
        <div class="date">${esc(order.date)}</div>
      </div>
    </div>

    <div class="panels">
      <div class="panel">
        <h2>Billed to</h2>
        <div class="strong">${esc(order.customerName)}</div>
        <div>${esc(order.customerEmail)}</div>
      </div>
      <div class="panel">
        <h2>Delivery address</h2>
        <div>${esc(order.destination).replace(/,\s*/g, ',<br />')}</div>
      </div>
    </div>

    <table class="items">
      <thead>
        <tr><th>Description</th><th class="num">Qty</th><th class="num">Unit</th><th class="num">Amount</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="lower">
      <div class="status">
        <div><span class="badge">Payment</span> ${esc(order.paymentStatus || 'Pending')}</div>
        <div><span class="badge">Fulfillment</span> ${esc(order.fulfillmentStatus || 'Unfulfilled')}</div>
        ${tracking ? `<div><span class="badge">Tracking</span> ${esc(tracking)}${order.carrier ? ` — ${esc(order.carrier)}` : ''}</div>` : ''}
        ${order.gatewayTxId ? `<div><span class="badge">Transaction</span> ${esc(order.gatewayTxId)}</div>` : ''}
      </div>
      <table class="totals">${totalRows}</table>
    </div>

    <div class="foot">
      Thank you for choosing ${esc(String(brand.legalName || brand.name).replace(/\.$/, ''))}.<br />
      This invoice was generated on ${esc(new Date().toLocaleString('en-GB'))} and is valid without signature.
    </div>

    <div class="no-print">
      <button type="button" onclick="window.print()">Print / Save as PDF</button>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Sends the invoice to the browser's print dialog, where the customer picks
 * "Save as PDF". A hidden iframe is used so no popup blocker is involved; if
 * the iframe route fails, a new tab is opened as a fallback.
 */
export function printInvoice(
  order: Order,
  options: { brand?: InvoiceBrand; products?: Product[] } = {}
): boolean {
  const html = buildInvoiceHtml(order, options);
  try {
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
    document.body.appendChild(frame);

    // The frame is kept in the DOM until after the dialog is dismissed —
    // removing it straight away cancels the print job in Safari and Firefox.
    const cleanup = () => setTimeout(() => frame.remove(), 1500);

    frame.onload = () => {
      const win = frame.contentWindow;
      if (!win) {
        cleanup();
        return;
      }
      win.focus();
      win.onafterprint = cleanup;
      win.print();
      setTimeout(cleanup, 60000);
    };

    frame.srcdoc = html;
    return true;
  } catch {
    const win = window.open('', '_blank');
    if (!win) return false;
    win.document.write(html);
    win.document.close();
    return true;
  }
}

/** Saves the invoice as a self-contained .html file the customer can keep or print later. */
export function downloadInvoiceFile(
  order: Order,
  options: { brand?: InvoiceBrand; products?: Product[] } = {}
): void {
  const blob = new Blob([buildInvoiceHtml(order, options)], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = getInvoiceFileName(order);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
