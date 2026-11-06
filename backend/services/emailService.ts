import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { fetchResource, saveResource, fetchLayoutSettings, fetchStoreSetting, saveStoreSetting } from '../../serverDb';
import {
  EmailTemplateData,
  renderOrderConfirmationTemplate,
  renderOrderProcessingTemplate,
  renderOrderShippedTemplate,
  renderOutForDeliveryTemplate,
  renderDeliveredTemplate,
  renderSubscriptionPriceChangeTemplate,
  renderOrderCancelledTemplate,
  renderOrderRefundedTemplate,
  renderOrderExchangedTemplate,
  renderPasswordResetTemplate,
  renderEmailVerificationTemplate,
  renderWelcomeTemplate,
  renderAdminNewOrderTemplate
} from './emailTemplates';

export type EmailTemplateType =
  | 'order_confirmation'
  | 'order_processing'
  | 'order_shipped'
  | 'out_for_delivery'
  | 'order_delivered'
  | 'order_cancelled'
  | 'order_refunded'
  | 'order_exchanged'
  | 'password_reset'
  | 'email_verification'
  | 'welcome_email'
  | 'admin_new_order'
  | 'subscription_price_change';

export type EmailProvider = 'gmail' | 'smtp' | 'resend' | 'auto';

export interface EmailSettings {
  enabled: boolean;
  provider: EmailProvider;
  
  // Gmail / Google Workspace SMTP Configuration
  gmailUser: string;
  gmailAppPassword?: string;
  
  // Custom SMTP Configuration
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  
  // Resend Configuration
  resendApiKey?: string;
  
  // Sender info & Notifications
  fromName: string;
  fromEmail: string;
  adminNotificationEmail: string;
  
  templates: Record<EmailTemplateType, {
    enabled: boolean;
    subject: string;
  }>;
}

export interface EmailLogEntry {
  id: string;
  type: EmailTemplateType;
  recipient: string;
  subject: string;
  status: 'sent' | 'failed' | 'disabled';
  provider?: string;
  messageId?: string;
  resendId?: string;
  error?: string;
  timestamp: string;
  metadata?: any;
}

export function formatFromHeader(fromName: string, fromEmail: string): string {
  const cleanName = (fromName || 'Pouch Supply Co.').replace(/["'<>]/g, '').trim();
  const cleanEmail = (fromEmail || 'scottkivlinpouch@gmail.com').replace(/[<>]/g, '').trim();
  return `"${cleanName}" <${cleanEmail}>`;
}

export function formatResendFromEmail(rawFrom?: string): string {
  if (!rawFrom || typeof rawFrom !== 'string' || !rawFrom.trim()) {
    return 'Pouch Supply Co. <onboarding@resend.dev>';
  }

  const cleaned = rawFrom.trim().replace(/^["']|["']$/g, '');

  const angleMatch = cleaned.match(/^([^<]+)<([^>]+)>$/);
  if (angleMatch) {
    const name = angleMatch[1].trim().replace(/[<>"]/g, '');
    const email = angleMatch[2].trim().replace(/[<>"]/g, '');
    if (email.includes('@')) {
      return name ? `${name} <${email}>` : email;
    }
  }

  if (cleaned.includes('@') && !cleaned.includes(' ') && !cleaned.includes('<') && !cleaned.includes('>')) {
    return `Pouch Supply Co. <${cleaned}>`;
  }

  const parts = cleaned.split(/\s+/);
  const emailCandidate = parts.find(p => p.includes('@'));
  if (emailCandidate) {
    const email = emailCandidate.replace(/[<>,;"']/g, '').trim();
    const name = parts.filter(p => !p.includes('@')).join(' ').replace(/[<>,;"']/g, '').trim();
    return name ? `${name} <${email}>` : email;
  }

  return 'Pouch Supply Co. <onboarding@resend.dev>';
}

const DEFAULT_SETTINGS: EmailSettings = {
  enabled: true,
  provider: (process.env.EMAIL_PROVIDER as EmailProvider) || (process.env.RESEND_API_KEY ? 'resend' : 'resend'),
  gmailUser: process.env.GMAIL_USER || 'scottkivlinpouch@gmail.com',
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD || '',
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: Number(process.env.SMTP_PORT) || 465,
  smtpSecure: process.env.SMTP_SECURE !== 'false',
  smtpUser: process.env.SMTP_USER || process.env.GMAIL_USER || 'scottkivlinpouch@gmail.com',
  smtpPassword: process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  fromName: 'Pouch Supply Co.',
  fromEmail: process.env.RESEND_FROM_EMAIL || 'orders@pouch-supply.com',
  adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL || process.env.GMAIL_USER || 'scottkivlinpouch@gmail.com',
  templates: {
    order_confirmation: { enabled: true, subject: 'Order Confirmation - Pouch Supply Co.' },
    order_processing: { enabled: true, subject: 'Order Processing - Pouch Supply Co.' },
    order_shipped: { enabled: true, subject: 'Order Dispatched & Tracking Info - Pouch Supply Co.' },
    out_for_delivery: { enabled: true, subject: 'Out for Delivery Today - Pouch Supply Co.' },
    order_delivered: { enabled: true, subject: 'Order Delivered - Pouch Supply Co.' },
    order_cancelled: { enabled: true, subject: 'Order Cancellation Notice - Pouch Supply Co.' },
    order_refunded: { enabled: true, subject: 'Refund Confirmation - Pouch Supply Co.' },
    order_exchanged: { enabled: true, subject: 'Product Exchange Confirmation - Pouch Supply Co.' },
    subscription_price_change: { enabled: true, subject: 'Your subscription price is changing - Pouch Supply Co.' },
    password_reset: { enabled: true, subject: 'Reset Your Password - Pouch Supply Co.' },
    email_verification: { enabled: true, subject: 'Verify Your Email Address - Pouch Supply Co.' },
    welcome_email: { enabled: true, subject: 'Welcome to Pouch Supply Co. - 10% Off Inside!' },
    admin_new_order: { enabled: true, subject: '🚨 [NEW ORDER] Order Received - Pouch Supply Co.' }
  }
};

export async function getEmailSettings(): Promise<EmailSettings> {
  try {
    let stored: any = await fetchStoreSetting('email_settings');
    if (!stored || (typeof stored === 'object' && Object.keys(stored).length === 0)) {
      const legacy = await fetchResource('email_settings');
      if (legacy && Array.isArray(legacy) && legacy.length > 0) {
        stored = legacy[0];
      }
    }

    if (stored && typeof stored === 'object') {
      const item = Array.isArray(stored) ? stored[0] : stored;
      return {
        ...DEFAULT_SETTINGS,
        ...item,
        provider: item.provider || DEFAULT_SETTINGS.provider,
        gmailUser: item.gmailUser || process.env.GMAIL_USER || DEFAULT_SETTINGS.gmailUser,
        gmailAppPassword: item.gmailAppPassword !== undefined ? item.gmailAppPassword : (process.env.GMAIL_APP_PASSWORD || ''),
        smtpHost: item.smtpHost || process.env.SMTP_HOST || DEFAULT_SETTINGS.smtpHost,
        smtpPort: item.smtpPort || Number(process.env.SMTP_PORT) || DEFAULT_SETTINGS.smtpPort,
        smtpSecure: item.smtpSecure !== undefined ? item.smtpSecure : (process.env.SMTP_SECURE !== 'false'),
        smtpUser: item.smtpUser || process.env.SMTP_USER || item.gmailUser || DEFAULT_SETTINGS.smtpUser,
        smtpPassword: item.smtpPassword !== undefined ? item.smtpPassword : (process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || ''),
        resendApiKey: item.resendApiKey !== undefined ? item.resendApiKey : (process.env.RESEND_API_KEY || ''),
        fromName: item.fromName || DEFAULT_SETTINGS.fromName,
        fromEmail: item.fromEmail || item.gmailUser || process.env.RESEND_FROM_EMAIL || DEFAULT_SETTINGS.fromEmail,
        adminNotificationEmail: item.adminNotificationEmail || process.env.ADMIN_NOTIFICATION_EMAIL || DEFAULT_SETTINGS.adminNotificationEmail,
        templates: {
          ...DEFAULT_SETTINGS.templates,
          ...(item.templates || {})
        }
      };
    }
  } catch (err) {}
  return DEFAULT_SETTINGS;
}

export async function saveEmailSettings(settings: Partial<EmailSettings>): Promise<EmailSettings> {
  const current = await getEmailSettings();
  const updated: EmailSettings = {
    ...current,
    ...settings,
    templates: {
      ...current.templates,
      ...(settings.templates || {})
    }
  };

  if (settings.gmailUser) process.env.GMAIL_USER = settings.gmailUser;
  if (settings.gmailAppPassword) process.env.GMAIL_APP_PASSWORD = settings.gmailAppPassword;
  if (settings.resendApiKey) process.env.RESEND_API_KEY = settings.resendApiKey;
  if (settings.adminNotificationEmail) process.env.ADMIN_NOTIFICATION_EMAIL = settings.adminNotificationEmail;

  await saveStoreSetting('email_settings', updated);
  await saveResource('email_settings', [updated]);
  return updated;
}

export async function getEmailLogs(): Promise<EmailLogEntry[]> {
  try {
    const logs = await fetchResource('email_logs');
    if (Array.isArray(logs)) {
      return logs.filter((l: any) => l.status !== 'simulated');
    }
    return [];
  } catch (err) {
    return [];
  }
}

export async function logEmail(entry: Omit<EmailLogEntry, 'id' | 'timestamp'>): Promise<EmailLogEntry> {
  const newLog: EmailLogEntry = {
    ...entry,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString()
  };

  try {
    const currentLogs = await getEmailLogs();
    const updated = [newLog, ...currentLogs].slice(0, 500);
    await saveResource('email_logs', updated);
  } catch (err) {}

  return newLog;
}

// Test/verify connection helper
export async function verifyEmailConnection(config?: Partial<EmailSettings>): Promise<{
  success: boolean;
  provider: string;
  message: string;
  details?: any;
}> {
  const settings = await getEmailSettings();
  const merged = { ...settings, ...(config || {}) };
  const provider = merged.provider || 'gmail';

  if (provider === 'gmail') {
    const user = (merged.gmailUser || '').trim();
    const pass = (merged.gmailAppPassword || '').trim().replace(/\s+/g, '');
    if (!user) {
      return { success: false, provider: 'gmail', message: 'Gmail address is missing.' };
    }
    if (!pass) {
      return {
        success: false,
        provider: 'gmail',
        message: 'Gmail App Password is required. Generate a 16-character App Password from Google Account Security (https://myaccount.google.com/apppasswords).'
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
      });
      await transporter.verify();
      return {
        success: true,
        provider: 'gmail',
        message: `Successfully connected and authenticated with Gmail (${user})!`
      };
    } catch (err: any) {
      return {
        success: false,
        provider: 'gmail',
        message: `Gmail Authentication Failed: ${err.message}. Check your Gmail address and 16-character App Password.`
      };
    }
  }

  if (provider === 'smtp') {
    const host = (merged.smtpHost || 'smtp.gmail.com').trim();
    const port = merged.smtpPort || 465;
    const user = (merged.smtpUser || '').trim();
    const pass = (merged.smtpPassword || '').trim();

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: merged.smtpSecure !== false && port === 465,
        auth: user && pass ? { user, pass } : undefined
      });
      await transporter.verify();
      return {
        success: true,
        provider: 'smtp',
        message: `Successfully connected to SMTP server (${host}:${port})!`
      };
    } catch (err: any) {
      return {
        success: false,
        provider: 'smtp',
        message: `SMTP Connection Failed: ${err.message}`
      };
    }
  }

  if (provider === 'resend') {
    const key = (merged.resendApiKey || process.env.RESEND_API_KEY || '').trim();
    if (!key) {
      return { success: false, provider: 'resend', message: 'Resend API Key is missing. Please enter your Resend API Key (re_...).' };
    }
    try {
      const resend = new Resend(key);
      const test = await resend.apiKeys.list().catch((err: any) => ({ error: err }));
      if (test && !test.error) {
        return { success: true, provider: 'resend', message: 'Resend API key is valid and connected successfully!' };
      }
      if (test && test.error) {
        return { success: false, provider: 'resend', message: `Resend validation failed: ${test.error.message || test.error}` };
      }
      return { success: true, provider: 'resend', message: 'Resend API connection initialized.' };
    } catch (err: any) {
      return { success: false, provider: 'resend', message: `Resend error: ${err.message || String(err)}` };
    }
  }

  return { success: true, provider: 'auto', message: 'Email configuration checked.' };
}

// Master Send Email Function
export async function sendEmail(
  type: EmailTemplateType,
  recipient: string,
  data: EmailTemplateData,
  customSubject?: string,
  apiKeyOverride?: string,
  fromEmailOverride?: string
): Promise<{ success: boolean; log: EmailLogEntry; mode?: 'live' | 'simulated'; message?: string; provider?: string }> {
  const settings = await getEmailSettings();

  // 1. Check global enabled
  if (!settings.enabled) {
    console.log(`[EmailService] Global email sending is disabled. Skipping ${type} to ${recipient}.`);
    const log = await logEmail({
      type,
      recipient,
      subject: customSubject || settings.templates[type]?.subject || type,
      status: 'disabled',
      error: 'Global email system disabled in settings'
    });
    return { success: false, log, message: 'Global email sending is disabled in settings.' };
  }

  // 2. Check template enabled
  const templateConfig = settings.templates[type];
  if (templateConfig && !templateConfig.enabled) {
    console.log(`[EmailService] Template '${type}' is disabled. Skipping sending to ${recipient}.`);
    const log = await logEmail({
      type,
      recipient,
      subject: customSubject || templateConfig.subject || type,
      status: 'disabled',
      error: `Template '${type}' is disabled in settings`
    });
    return { success: false, log, message: `Template '${type}' is currently disabled in settings.` };
  }

  // 3. Determine subject
  const subject = customSubject || templateConfig?.subject || `Notification from Pouch Supply Co.`;

  // 4. Hydrate header logo
  if (!data.headerLogoImage && !data.logoUrl) {
    try {
      const layout = await fetchLayoutSettings();
      if (layout?.headerLogoImage) {
        data.headerLogoImage = layout.headerLogoImage;
      }
    } catch (e) {}
  }

  // 5. Render HTML
  let html = '';
  switch (type) {
    case 'order_confirmation':
      html = renderOrderConfirmationTemplate(data);
      break;
    case 'order_processing':
      html = renderOrderProcessingTemplate(data);
      break;
    case 'order_shipped':
      html = renderOrderShippedTemplate(data);
      break;
    case 'out_for_delivery':
      html = renderOutForDeliveryTemplate(data);
      break;
    case 'order_delivered':
      html = renderDeliveredTemplate(data);
      break;
    case 'subscription_price_change':
      html = renderSubscriptionPriceChangeTemplate(data);
      break;
    case 'order_cancelled':
      html = renderOrderCancelledTemplate(data);
      break;
    case 'order_refunded':
      html = renderOrderRefundedTemplate(data);
      break;
    case 'order_exchanged':
      html = renderOrderExchangedTemplate(data);
      break;
    case 'password_reset':
      html = renderPasswordResetTemplate(data);
      break;
    case 'email_verification':
      html = renderEmailVerificationTemplate(data);
      break;
    case 'welcome_email':
      html = renderWelcomeTemplate(data);
      break;
    case 'admin_new_order':
      html = renderAdminNewOrderTemplate(data);
      break;
    default:
      html = `<p>Notification from Pouch Supply Co.</p>`;
  }

  const effectiveProvider = settings.provider || 'gmail';
  const gmailUser = (settings.gmailUser || process.env.GMAIL_USER || 'scottkivlinpouch@gmail.com').trim();
  const gmailPass = (settings.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || '').trim().replace(/\s+/g, '');
  const resendKey = (apiKeyOverride || settings.resendApiKey || process.env.RESEND_API_KEY || '').trim();
  const fromName = settings.fromName || 'Pouch Supply Co.';
  const senderEmail = fromEmailOverride || settings.fromEmail || gmailUser || 'scottkivlinpouch@gmail.com';
  const fromFormatted = formatFromHeader(fromName, senderEmail);

  // ----------------------------------------------------
  // CHANNEL A: Gmail (Nodemailer Service: 'gmail')
  // ----------------------------------------------------
  if (effectiveProvider === 'gmail' || (effectiveProvider === 'auto' && gmailUser && gmailPass)) {
    if (!gmailPass) {
      const errMsg = 'Gmail App Password is not configured in Email Settings. Add your 16-character Google App Password to enable live Gmail sending.';
      console.warn(`[EmailService Gmail] ${errMsg}`);
      const log = await logEmail({
        type,
        recipient,
        subject,
        status: 'failed',
        provider: 'gmail',
        error: errMsg,
        metadata: { data, html }
      });
      return { success: false, mode: 'live', provider: 'gmail', message: errMsg, log };
    }

    try {
      console.log(`[EmailService] Sending '${type}' to '${recipient}' via Gmail SMTP (${gmailUser})...`);
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass
        }
      });

      const info = await transporter.sendMail({
        from: `"${fromName}" <${gmailUser}>`,
        to: recipient,
        replyTo: gmailUser,
        subject,
        html
      });

      console.log(`[EmailService Gmail] Email successfully sent to ${recipient}! Message ID: ${info.messageId}`);
      const log = await logEmail({
        type,
        recipient,
        subject,
        status: 'sent',
        provider: 'gmail',
        messageId: info.messageId,
        metadata: { data }
      });

      return {
        success: true,
        mode: 'live',
        provider: 'gmail',
        message: `Email successfully sent to ${recipient} via Gmail (${gmailUser})!`,
        log
      };
    } catch (gmailErr: any) {
      const errMsg = gmailErr.message || String(gmailErr);
      console.error(`[EmailService Gmail Error]:`, gmailErr);
      const log = await logEmail({
        type,
        recipient,
        subject,
        status: 'failed',
        provider: 'gmail',
        error: errMsg,
        metadata: { data }
      });
      return { success: false, mode: 'live', provider: 'gmail', message: `Gmail Send Failed: ${errMsg}`, log };
    }
  }

  // ----------------------------------------------------
  // CHANNEL B: Custom SMTP
  // ----------------------------------------------------
  if (effectiveProvider === 'smtp') {
    const smtpHost = settings.smtpHost || 'smtp.gmail.com';
    const smtpPort = settings.smtpPort || 465;
    const smtpUser = settings.smtpUser || gmailUser;
    const smtpPass = (settings.smtpPassword || gmailPass).replace(/\s+/g, '');

    try {
      console.log(`[EmailService] Sending '${type}' to '${recipient}' via custom SMTP (${smtpHost}:${smtpPort})...`);
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: settings.smtpSecure !== false && smtpPort === 465,
        auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined
      });

      const info = await transporter.sendMail({
        from: `"${fromName}" <${smtpUser || senderEmail}>`,
        to: recipient,
        replyTo: smtpUser || senderEmail,
        subject,
        html
      });

      console.log(`[EmailService SMTP] Email successfully sent! Message ID: ${info.messageId}`);
      const log = await logEmail({
        type,
        recipient,
        subject,
        status: 'sent',
        provider: 'smtp',
        messageId: info.messageId,
        metadata: { data }
      });

      return {
        success: true,
        mode: 'live',
        provider: 'smtp',
        message: `Email successfully sent to ${recipient} via SMTP (${smtpHost})!`,
        log
      };
    } catch (smtpErr: any) {
      const errMsg = smtpErr.message || String(smtpErr);
      console.error(`[EmailService SMTP Error]:`, smtpErr);
      const log = await logEmail({
        type,
        recipient,
        subject,
        status: 'failed',
        provider: 'smtp',
        error: errMsg,
        metadata: { data }
      });
      return { success: false, mode: 'live', provider: 'smtp', message: `SMTP Send Failed: ${errMsg}`, log };
    }
  }

  // ----------------------------------------------------
  // CHANNEL C: Resend (Fallback or Explicit Selection)
  // ----------------------------------------------------
  if (effectiveProvider === 'resend' || (effectiveProvider === 'auto' && resendKey)) {
    if (!resendKey) {
      console.warn(`[EmailService] No RESEND_API_KEY configured for recipient ${recipient}.`);
      const log = await logEmail({
        type,
        recipient,
        subject,
        status: 'failed',
        provider: 'resend',
        error: 'Resend API key is not configured. Enter an API key in Email Settings.',
        metadata: { data, html }
      });
      return {
        success: false,
        mode: 'live',
        provider: 'resend',
        message: 'Resend API key is not configured.',
        log
      };
    }

    try {
      const resend = new Resend(resendKey);
      let fromEmail = formatResendFromEmail(fromFormatted);

      console.log(`[EmailService] Sending '${type}' via Resend to '${recipient}' (From: ${fromEmail})...`);

      let resendResponse = await resend.emails.send({
        from: fromEmail,
        to: recipient,
        subject,
        html
      });

      if (resendResponse.error) {
        const errMsg = resendResponse.error.message || String(resendResponse.error);
        if ((errMsg.includes('domain') || errMsg.includes('not verified') || errMsg.includes('from')) && !fromEmail.includes('onboarding@resend.dev')) {
          fromEmail = 'Pouch Supply Co. <onboarding@resend.dev>';
          resendResponse = await resend.emails.send({
            from: fromEmail,
            to: recipient,
            subject,
            html
          });
        }
      }

      if (resendResponse.error) {
        const errMsg = resendResponse.error.message || String(resendResponse.error);
        const log = await logEmail({
          type,
          recipient,
          subject,
          status: 'failed',
          provider: 'resend',
          error: errMsg,
          metadata: { data, html }
        });
        return { success: false, mode: 'live', provider: 'resend', message: `Resend Error: ${errMsg}`, log };
      }

      const resendId = resendResponse.data?.id;
      const log = await logEmail({
        type,
        recipient,
        subject,
        status: 'sent',
        provider: 'resend',
        resendId,
        metadata: { data }
      });

      return {
        success: true,
        mode: 'live',
        provider: 'resend',
        message: `Email successfully sent to ${recipient} via Resend! (ID: ${resendId})`,
        log
      };
    } catch (resendErr: any) {
      const errMsg = resendErr.message || String(resendErr);
      const log = await logEmail({
        type,
        recipient,
        subject,
        status: 'failed',
        provider: 'resend',
        error: errMsg,
        metadata: { data }
      });
      return { success: false, mode: 'live', provider: 'resend', message: `Resend Exception: ${errMsg}`, log };
    }
  }

  // Default fallback if no provider matched
  const errLog = await logEmail({
    type,
    recipient,
    subject,
    status: 'failed',
    error: 'No email transport configured. Please configure Gmail, SMTP, or Resend in Email Settings.'
  });
  return {
    success: false,
    mode: 'live',
    message: 'No email transport configured. Configure Gmail or SMTP in Admin Email Settings.',
    log: errLog
  };
}

// ----------------------------------------------------
// Convenience Helper Functions
// ----------------------------------------------------

export async function sendOrderConfirmationEmail(orderData: any) {
  const recipient = (orderData.customerEmail || 'customer@pouch-supply.com').trim();
  const data: EmailTemplateData = {
    customerName: orderData.customerName || 'Valued Customer',
    customerEmail: recipient,
    orderId: orderData.id || orderData.orderId,
    orderDate: orderData.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    items: orderData.items || [],
    total: typeof orderData.total === 'number' ? orderData.total : parseFloat(orderData.total) || 0,
    destination: orderData.destination || orderData.address || 'United Kingdom',
    deliveryMethod: orderData.deliveryMethod || 'Royal Mail Tracked 24/48',
    // Passed through rather than guessed from the total: a Free Delivery reward
    // waives the charge on an order of any size, and the template's fallback
    // ("under £40 means £2.99") would bill the customer for it in the email.
    subtotal: typeof orderData.subtotal === 'number' ? orderData.subtotal : orderData.data?.subtotal,
    deliveryCost: typeof orderData.shippingCost === 'number'
      ? orderData.shippingCost
      : (typeof orderData.deliveryCost === 'number' ? orderData.deliveryCost : orderData.data?.shippingCost),
    // `discountApplied` is the discount object; it has no `amount` field, so the
    // discount row never rendered. The money off is carried separately.
    discountAmount: typeof orderData.discountAmount === 'number' ? orderData.discountAmount : undefined
  };

  console.log(`[EmailService] Triggering Order Confirmation for Order #${data.orderId} to ${recipient}`);

  // 1. Send confirmation to customer
  const customerResult = await sendEmail('order_confirmation', recipient, data);

  // 2. Trigger admin notification
  const settings = await getEmailSettings();
  const adminEmail = (settings.adminNotificationEmail || settings.gmailUser || 'admin@pouch-supply.com').trim();
  if (adminEmail && adminEmail !== recipient) {
    sendEmail('admin_new_order', adminEmail, data).catch(err => {
      console.warn('[EmailService] Admin order notification warning:', err);
    });
  }

  return customerResult;
}

export async function sendOrderProcessingEmail(orderData: any) {
  const recipient = (orderData.customerEmail || 'customer@pouch-supply.com').trim();
  const data: EmailTemplateData = {
    customerName: orderData.customerName,
    customerEmail: recipient,
    orderId: orderData.id || orderData.orderId,
    items: orderData.items || [],
    total: orderData.total,
    destination: orderData.destination || orderData.address
  };
  return sendEmail('order_processing', recipient, data);
}

export async function sendOrderShippedEmail(orderData: any, trackingNumber?: string, carrier?: string) {
  const recipient = (orderData.customerEmail || 'customer@pouch-supply.com').trim();
  const data: EmailTemplateData = {
    customerName: orderData.customerName,
    customerEmail: recipient,
    orderId: orderData.id || orderData.orderId,
    items: orderData.items || [],
    total: orderData.total,
    destination: orderData.destination || orderData.address,
    // No stand-in tracking number. This used to fall back to a made-up
    // 'RM892341234GB', so an order dispatched on a non-tracked service emailed
    // the customer a number that tracks nothing and a Track Package link that
    // leads nowhere. Left empty, the template omits the tracking block.
    trackingNumber: trackingNumber || orderData.trackingNumber || orderData.trackingId || '',
    carrier: carrier || orderData.carrier || 'Royal Mail'
  };
  return sendEmail('order_shipped', recipient, data);
}

export async function sendOutForDeliveryEmail(orderData: any) {
  const recipient = (orderData.customerEmail || 'customer@pouch-supply.com').trim();
  const data: EmailTemplateData = {
    customerName: orderData.customerName,
    customerEmail: recipient,
    orderId: orderData.id || orderData.orderId,
    items: orderData.items || [],
    trackingNumber: orderData.trackingNumber || orderData.trackingId || ''
  };
  return sendEmail('out_for_delivery', recipient, data);
}

export async function sendDeliveredEmail(orderData: any) {
  const recipient = (orderData.customerEmail || 'customer@pouch-supply.com').trim();
  const data: EmailTemplateData = {
    customerName: orderData.customerName,
    customerEmail: recipient,
    orderId: orderData.id || orderData.orderId,
    items: orderData.items || [],
    destination: orderData.destination || orderData.address
  };
  return sendEmail('order_delivered', recipient, data);
}

/**
 * Tells a subscriber their recurring price is changing, and from when.
 *
 * Sent for decreases as well as increases: a changed charge that arrives
 * unannounced is what generates support tickets and chargebacks, whichever
 * direction it moved in.
 */
export async function sendSubscriptionPriceChangeEmail(change: {
  customerEmail: string;
  customerName?: string;
  planName: string;
  previousAmount: number;
  newAmount: number;
  effectiveFrom: string;
  billingInterval?: string;
}) {
  const recipient = String(change.customerEmail || '').trim();
  if (!recipient) throw new Error('A price-change notice needs a recipient.');

  const data: EmailTemplateData = {
    customerName: change.customerName,
    customerEmail: recipient,
    planName: change.planName,
    previousAmount: change.previousAmount,
    newAmount: change.newAmount,
    effectiveFrom: change.effectiveFrom,
    billingInterval: change.billingInterval
  };
  return sendEmail('subscription_price_change', recipient, data);
}

export async function sendOrderCancelledEmail(orderData: any, reason?: string) {
  const recipient = (orderData.customerEmail || 'customer@pouch-supply.com').trim();
  const data: EmailTemplateData = {
    customerName: orderData.customerName,
    customerEmail: recipient,
    orderId: orderData.id || orderData.orderId,
    cancellationReason: reason
  };
  return sendEmail('order_cancelled', recipient, data);
}

export async function sendOrderRefundedEmail(orderData: any, refundAmount?: number, reason?: string) {
  const recipient = (orderData.customerEmail || 'customer@pouch-supply.com').trim();
  const data: EmailTemplateData = {
    customerName: orderData.customerName,
    customerEmail: recipient,
    orderId: orderData.id || orderData.orderId,
    total: orderData.total,
    refundAmount: refundAmount !== undefined ? refundAmount : orderData.total,
    refundReason: reason
  };
  return sendEmail('order_refunded', recipient, data);
}

export async function sendOrderExchangedEmail(orderData: any, exchangeDetails?: string, reason?: string) {
  const recipient = (orderData.customerEmail || 'customer@pouch-supply.com').trim();
  const data: EmailTemplateData = {
    customerName: orderData.customerName,
    customerEmail: recipient,
    orderId: orderData.id || orderData.orderId,
    items: orderData.items || [],
    total: orderData.total,
    refundReason: exchangeDetails || reason || 'Product exchange initiated'
  };
  return sendEmail('order_exchanged', recipient, data);
}

export async function sendPasswordResetEmail(email: string, name?: string, resetToken?: string, resetLink?: string) {
  const data: EmailTemplateData = {
    customerName: name || 'Customer',
    customerEmail: email,
    resetToken: resetToken || 'token_xyz',
    resetLink: resetLink || '#'
  };
  return sendEmail('password_reset', email, data);
}

export async function sendEmailVerificationEmail(email: string, name?: string, code?: string) {
  const data: EmailTemplateData = {
    customerName: name || 'Customer',
    customerEmail: email,
    verificationCode: code || Math.floor(100000 + Math.random() * 900000).toString()
  };
  return sendEmail('email_verification', email, data);
}

export async function sendWelcomeEmail(email: string, name?: string, discountCode?: string) {
  const data: EmailTemplateData = {
    customerName: name || 'Friend',
    customerEmail: email,
    discountCode: discountCode || 'WELCOME10'
  };
  return sendEmail('welcome_email', email, data);
}

export async function sendLoginNotificationEmail(email: string, name?: string) {
  const data: EmailTemplateData = {
    customerName: name || 'Valued Customer',
    customerEmail: email
  };
  return sendEmail('email_verification', email, data, 'Security Alert: New Account Login - Pouch Supply Co.');
}

export async function sendAdminNewOrderNotification(orderData: any) {
  const settings = await getEmailSettings();
  const adminEmail = (settings.adminNotificationEmail || settings.gmailUser || 'admin@pouch-supply.com').trim();
  const data: EmailTemplateData = {
    customerName: orderData.customerName,
    customerEmail: orderData.customerEmail,
    orderId: orderData.id || orderData.orderId,
    items: orderData.items || [],
    total: orderData.total,
    destination: orderData.destination || orderData.address
  };
  return sendEmail('admin_new_order', adminEmail, data);
}
