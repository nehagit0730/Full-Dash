import React from 'react';

/**
 * Plain-language policy pages for a clothing store.
 *
 * TEMPLATES, NOT LEGAL ADVICE. They describe the store's default operating
 * terms in this build (delivery within India, 7-day returns, Razorpay
 * payments). The store owner must review and adapt them — ideally with a legal
 * adviser — before relying on them, in particular to meet the Consumer
 * Protection (E-Commerce) Rules, 2020 and the Digital Personal Data Protection
 * Act, 2023.
 */

export interface PolicySection {
  heading: string;
  body: React.ReactNode;
}

export default function PolicyPage({
  title,
  intro,
  sections,
  onNavigate
}: {
  title: string;
  intro: string;
  sections: PolicySection[];
  onNavigate: (tab: string) => void;
}) {
  return (
    <div className="store">
      <div className="border-b border-line bg-sand">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-clay">Customer care</p>
          <h1 className="font-display mt-3 text-4xl sm:text-5xl">{title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-stone">{intro}</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="space-y-10">
          {sections.map(s => (
            <section key={s.heading}>
              <h2 className="font-display text-2xl">{s.heading}</h2>
              <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-stone [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink">{s.body}</div>
            </section>
          ))}
        </div>

        <div className="mt-14 border-t border-line pt-8 text-center">
          <p className="text-sm text-stone">Questions? We’re happy to help.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => onNavigate('contact')} className="bg-ink px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-white hover:bg-clay cursor-pointer">
              Contact us
            </button>
            <button type="button" onClick={() => onNavigate('frontend-shop')} className="border border-ink px-6 py-3 text-[11px] uppercase tracking-[0.2em] hover:bg-ink hover:text-white cursor-pointer">
              Continue shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const SUPPORT_EMAIL = 'support@example.com';
