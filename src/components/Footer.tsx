import React, { useState } from 'react';
import { Mail, ShieldCheck, Truck, RefreshCw, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { LayoutSettings } from '../types';
import { klaviyoTrackNewsletterSubscribe } from '../utils/klaviyo';
import { cleanMediaUrl } from '../utils/mediaUtils';
import { useRecaptcha } from '../hooks/useRecaptcha';

interface FooterProps {
  onNavigate?: (tab: string) => void;
  layoutSettings?: LayoutSettings;
}

export default function Footer({ onNavigate, layoutSettings }: FooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { executeRecaptcha } = useRecaptcha();

  const handleSubscribe = async () => {
    setErrorMsg('');
    if (!email || !email.includes('@')) {
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

  return (
    <>
      <footer id="global-footer" className="bg-slate-900 text-white border-t border-slate-800">
      
      {/* Brand value propositions row */}
      <div className="bg-slate-950 border-b border-slate-800/80 py-8 px-6">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-slate-300">
          <div className="flex gap-3 items-center">
            <div className="p-2.5 bg-indigo-950/40 rounded-xl text-indigo-400 border border-indigo-900/40 shrink-0">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-xs uppercase tracking-wide">Next-Day Shipping</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">Reliable local courier dispatching</p>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="p-2.5 bg-indigo-950/40 rounded-xl text-indigo-400 border border-indigo-900/40 shrink-0">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-xs uppercase tracking-wide">Flexible Schedules</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">Easy returns within our return window</p>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="p-2.5 bg-indigo-950/40 rounded-xl text-indigo-400 border border-indigo-900/40 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-xs uppercase tracking-wide">Secured Checkout</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">Bank-grade 256-bit SSL encryptions</p>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="p-2.5 bg-indigo-950/40 rounded-xl text-indigo-400 border border-indigo-900/40 shrink-0">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-xs uppercase tracking-wide">Instant Support</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">Email and chat support desks open</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main categories navigation columns */}
      <div className="max-w-[1440px] mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
        
        {/* Brand identity column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {layoutSettings?.footerLogoImage ? (
              <img 
                src={cleanMediaUrl(layoutSettings.footerLogoImage)} 
                className="max-h-10 max-w-[150px] object-contain rounded" 
                alt="Footer Logo" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <>
                <div className="h-8 w-8 rounded-full bg-indigo-650 text-white flex items-center justify-center font-black tracking-tighter shadow">
                  {(layoutSettings?.footerLogoText || 'P').charAt(0).toUpperCase()}
                </div>
                <span className="font-black tracking-widest text-white uppercase text-xs">
                  {layoutSettings?.footerLogoText || 'POUCH SUPPLY'}
                </span>
              </>
            )}
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            {layoutSettings?.footerLogoDescription || 'Leading premium directory for tobacco-free nicotine slim white canisters. Sourced directly from partners across Sweden, Poland, and Germany.'}
          </p>
          <p className="text-[10px] text-slate-500">
            © 2026 {layoutSettings?.headerLogoText || 'Pouch Supply'} UK. All rights reserved.
          </p>
        </div>

        {/* Info links */}
        <div>
          <h4 className="font-black text-slate-200 uppercase tracking-widest mb-4">Info</h4>
          <ul className="space-y-2.5 text-slate-400 font-medium">
            <li onClick={() => onNavigate?.('strength-guide')} className="hover:text-white transition-colors cursor-pointer">Strength Guide</li>
            <li onClick={() => onNavigate?.('faqs')} className="hover:text-white transition-colors cursor-pointer">Faq's</li>
            <li onClick={() => onNavigate?.('about')} className="hover:text-white transition-colors cursor-pointer">About</li>
            <li onClick={() => onNavigate?.('contact')} className="hover:text-white transition-colors cursor-pointer">Contact</li>
            <li onClick={() => onNavigate?.('blogs')} className="hover:text-white transition-colors cursor-pointer">Journal</li>
          </ul>
        </div>

        {/* Policies */}
        <div>
          <h4 className="font-black text-slate-200 uppercase tracking-widest mb-4">Policies</h4>
          <ul className="space-y-2.5 text-slate-400 font-medium">
            <li onClick={() => onNavigate?.('privacy-policy')} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</li>
            <li onClick={() => onNavigate?.('shipping-policy')} className="hover:text-white transition-colors cursor-pointer">Shipping Policy</li>
            <li onClick={() => onNavigate?.('refund-policy')} className="hover:text-white transition-colors cursor-pointer">Refund Policy</li>
            <li onClick={() => onNavigate?.('terms-conditions')} className="hover:text-white transition-colors cursor-pointer">Terms & Conditions</li>
          </ul>
        </div>

        {/* Email dispatcher */}
        <div className="space-y-4">
          <h4 className="font-black text-slate-200 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Mail className="h-4 w-4 text-indigo-400" /> join the crew
          </h4>
          <p className="text-slate-400 leading-normal text-[11px]">
            Subscribe to receive exclusive weekly offers, nicotine strength updates, and flash sales codes.
          </p>
          {subscribed ? (
            <div className="bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs p-3 rounded-lg text-center font-bold">
              🎉 Joined successfully! Welcome aboard.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2.5">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubscribe();
                  }}
                  placeholder="Your email address"
                  className="bg-slate-800 border border-slate-700/80 p-2 text-xs rounded-lg text-white w-full pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-500 font-medium"
                />
                <button
                  onClick={handleSubscribe}
                  className="bg-indigo-600 hover:bg-indigo-700 font-bold p-2 px-3 rounded-lg text-white cursor-pointer transition-colors text-[10px] uppercase tracking-wider shrink-0"
                >
                  Join
                </button>
              </div>
              {errorMsg && (
                <p className="text-red-400 text-[10px] font-bold leading-none">{errorMsg}</p>
              )}
              <div className="flex items-center gap-1 text-[9px] text-slate-500 font-medium pt-1">
                <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                <span>Protected by Google reCAPTCHA v3</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Disclaimers micro block */}
      <div className="bg-slate-950 border-t border-slate-800 py-6 px-4 text-center text-[10px] text-slate-500 leading-relaxed max-w-[1440px] mx-auto">
        <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">HEALTH & AGE WARNING DISCLOSURE</span>
        <span>Nicotine is highly addictive. Our products are strictly intended only for adult consumers of legal age. These statement summaries have not been evaluated by general medical regulators. Consult certified physicians for nicotine cessation guidelines.</span>
      </div>

    </footer>
    </>
  );
}
