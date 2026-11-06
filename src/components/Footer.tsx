import React, { useState } from 'react';
import { ArrowRight, RefreshCw, ShieldCheck, Truck } from 'lucide-react';
import { LayoutSettings } from '../types';
import { klaviyoTrackNewsletterSubscribe } from '../utils/klaviyo';
import { cleanMediaUrl } from '../utils/mediaUtils';
import { useRecaptcha } from '../hooks/useRecaptcha';
import { storeName } from './storefront/storeKit';

interface FooterProps {
  onNavigate?: (tab: string) => void;
  layoutSettings?: LayoutSettings;
}

export default function Footer({ onNavigate, layoutSettings }: FooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { executeRecaptcha } = useRecaptcha();
  const name = storeName(layoutSettings);
  const description =
    layoutSettings?.footerLogoDescription && !/nicotine|pouch|canister/i.test(layoutSettings.footerLogoDescription)
      ? layoutSettings.footerLogoDescription
      : 'Contemporary womenswear — dresses, ethnic wear and everyday essentials, designed to be worn and loved.';

  const handleSubscribe = async () => {
    setErrorMsg('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Please enter a valid email.');
      return;
    }
    klaviyoTrackNewsletterSubscribe(email);
    setSubscribed(true);
    try {
      const recaptchaToken = await executeRecaptcha('newsletter_subscribe');
      await fetch('/api/email/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), recaptchaToken })
      });
    } catch (err) {
      console.warn('Newsletter subscribe email dispatch warning:', err);
    }
    setEmail('');
  };

  const link = (label: string, tab: string) => (
    <li>
      <button type="button" onClick={() => onNavigate?.(tab)} className="text-sm text-white/70 transition hover:text-white cursor-pointer">
        {label}
      </button>
    </li>
  );

  return (
    <footer className="store mt-auto">
      {/* Service promises */}
      <div className="border-t border-line bg-sand">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            { icon: Truck, title: 'Free delivery', text: 'On orders above ₹1,999 across India' },
            { icon: RefreshCw, title: 'Easy returns', text: '7-day returns on unworn items' },
            { icon: ShieldCheck, title: 'Secure payments', text: 'UPI, cards & netbanking via Razorpay' }
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-4">
              <Icon className="h-6 w-6 shrink-0 text-clay" strokeWidth={1.4} />
              <div>
                <p className="text-sm uppercase tracking-[0.14em]">{title}</p>
                <p className="text-sm text-stone">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-ink text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-14 sm:px-6 md:grid-cols-12 lg:px-8">
          <div className="md:col-span-4">
            {layoutSettings?.footerLogoImage ? (
              <img src={cleanMediaUrl(layoutSettings.footerLogoImage)} alt={name} className="h-10 w-auto object-contain" />
            ) : (
              <p className="font-display text-3xl tracking-[0.06em]">{name}</p>
            )}
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">{description}</p>
          </div>

          <div className="md:col-span-2">
            <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-white/50">Shop</p>
            <ul className="space-y-2.5">
              {link('New In', 'frontend-shop')}
              {link('Shop All', 'frontend-shop')}
              {link('Journal', 'blogs')}
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-white/50">Help</p>
            <ul className="space-y-2.5">
              {link('Contact us', 'contact')}
              {link('Shipping', 'shipping-policy')}
              {link('Returns & refunds', 'refund-policy')}
              <li>
                <button type="button" onClick={() => window.dispatchEvent(new Event('open-order-withdrawal'))} className="text-sm text-white/70 transition hover:text-white cursor-pointer">
                  Return or cancel an order
                </button>
              </li>
              {link('Our story', 'about')}
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-white/50">Newsletter</p>
            <p className="text-sm text-white/70">New arrivals, styling notes and early access to sales.</p>
            {subscribed ? (
              <p className="mt-4 text-sm text-white">Thank you — you’re on the list.</p>
            ) : (
              <form
                className="mt-4 flex border-b border-white/40"
                onSubmit={e => {
                  e.preventDefault();
                  handleSubscribe();
                }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Your email address"
                  aria-label="Email address"
                  className="flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/40"
                />
                <button type="submit" className="px-2 text-white transition hover:text-blush cursor-pointer" aria-label="Subscribe">
                  <ArrowRight className="h-5 w-5" />
                </button>
              </form>
            )}
            {errorMsg && <p className="mt-2 text-xs text-blush">{errorMsg}</p>}
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-white/50 sm:flex-row sm:px-6 lg:px-8">
            <p>© {new Date().getFullYear()} {name}. All rights reserved.</p>
            <div className="flex gap-5">
              <button type="button" onClick={() => onNavigate?.('privacy-policy')} className="hover:text-white cursor-pointer">Privacy</button>
              <button type="button" onClick={() => onNavigate?.('terms-conditions')} className="hover:text-white cursor-pointer">Terms</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
