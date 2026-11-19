import React, { useState } from 'react';
import { AlertCircle, Check, Clock, Loader2, Mail, MapPin, Phone } from 'lucide-react';
import { useRecaptcha } from '../../hooks/useRecaptcha';
import { Eyebrow, SectionProps, imageOr, seedOf } from './sectionKit';

const field =
  'w-full border-0 border-b border-line bg-transparent px-0 py-3 text-[15px] text-ink placeholder:text-stone/60 focus:border-ink focus:outline-none focus:ring-0 transition-colors';
const label = 'block text-[10px] font-medium uppercase tracking-[0.22em] text-stone';

/**
 * Contact form. Messages go to /api/email/contact (stored in the dashboard and
 * emailed to the store). Contact details are the merchant's own settings —
 * each line only shows when it has been filled in.
 */
export function ContactSection({ sec }: SectionProps) {
  const s: any = sec.settings;
  const { executeRecaptcha } = useRecaptcha();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const details = [
    { icon: Mail, label: 'Email', value: s.contactEmail, href: s.contactEmail ? `mailto:${s.contactEmail}` : undefined },
    { icon: Phone, label: 'Phone', value: s.contactPhone, href: s.contactPhone ? `tel:${String(s.contactPhone).replace(/[^\d+]/g, '')}` : undefined },
    { icon: MapPin, label: 'Studio', value: s.contactAddress },
    { icon: Clock, label: 'Hours', value: s.contactHours }
  ].filter(d => d.value && String(d.value).trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus('error');
      setError('Please add your name, email and a message.');
      return;
    }
    setStatus('submitting');
    setError('');
    try {
      const recaptchaToken = await executeRecaptcha('contact_form_submit');
      const res = await fetch('/api/email/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, recaptchaToken })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setStatus('success');
        setNote(data.message || 'Thank you — we have received your message and will reply within one working day.');
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setStatus('error');
        setError(data.error || 'We could not send your message. Please try again.');
      }
    } catch {
      setStatus('error');
      setError('Network error — please check your connection and try again.');
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="py-16 md:py-24 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
      {/* Image + details */}
      <div className="space-y-10">
        <div className="space-y-5">
          <Eyebrow>{s.badgeText || 'Customer care'}</Eyebrow>
          <h2 className="section-title font-display text-4xl md:text-5xl font-normal leading-[1.05] text-ink">{s.title || 'We would love to hear from you'}</h2>
          <p className="section-desc max-w-md text-[15px] leading-relaxed text-stone">
            {s.description || 'Questions about an order, sizing or a product? Send us a note and our team will get back to you within one working day.'}
          </p>
        </div>
        <div className="relative hidden aspect-[5/4] overflow-hidden bg-sand sm:block">
          <img src={imageOr(s.imageUrl, seedOf(sec.id) + 2, 1100)} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        </div>
        {details.length > 0 && (
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {details.map(({ icon: Icon, label: l, value, href }) => (
              <div key={l} className="flex gap-3">
                <Icon className="accent-icon mt-0.5 h-5 w-5 shrink-0 text-clay" strokeWidth={1.25} />
                <div>
                  <dt className={label}>{l}</dt>
                  <dd className="mt-1 text-[15px] text-ink">
                    {href ? <a href={href} className="hover:text-clay transition-colors">{value}</a> : value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* Form */}
      <div className="card-bg bg-cream p-8 md:p-12 lg:self-start">
        {status === 'success' ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center text-center space-y-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-clay text-clay">
              <Check className="h-7 w-7" strokeWidth={1.5} />
            </span>
            <h3 className="font-display text-3xl text-ink">Message sent</h3>
            <p className="max-w-sm text-[15px] leading-relaxed text-stone">{note}</p>
            <button type="button" onClick={() => setStatus('idle')} className="text-[11px] uppercase tracking-[0.22em] text-ink underline underline-offset-4">
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-7" noValidate>
            <h3 className="font-display text-2xl text-ink">Send a message</h3>
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
              <label className="block"><span className={label}>Name *</span><input className={field} value={form.name} onChange={set('name')} autoComplete="name" /></label>
              <label className="block"><span className={label}>Email *</span><input type="email" className={field} value={form.email} onChange={set('email')} autoComplete="email" /></label>
              <label className="block"><span className={label}>Phone</span><input type="tel" className={field} value={form.phone} onChange={set('phone')} autoComplete="tel" /></label>
              <label className="block"><span className={label}>Subject</span><input className={field} value={form.subject} onChange={set('subject')} placeholder="Order, sizing, returns…" /></label>
            </div>
            <label className="block"><span className={label}>Message *</span><textarea rows={5} className={`${field} resize-none`} value={form.message} onChange={set('message')} /></label>
            {status === 'error' && (
              <p className="flex items-start gap-2 text-[13px] text-clay-dark"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>
            )}
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="section-btn inline-flex w-full items-center justify-center gap-2 bg-ink px-8 py-4 text-[11px] font-medium uppercase tracking-[0.22em] text-white transition-colors hover:bg-clay disabled:opacity-60 sm:w-auto"
            >
              {status === 'submitting' && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === 'submitting' ? 'Sending…' : 'Send message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
