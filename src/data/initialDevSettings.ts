import { DevSettings } from '../types';

export const DEFAULT_DEV_SETTINGS: DevSettings = {
  customCss: `/* =========================================================
   Ecommerce Store Global Custom CSS Overrides
   ========================================================= */

/* Custom scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #f1f5f8;
}
::-webkit-scrollbar-thumb {
  background: #94a3b7;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

/* Custom Highlight utility class */
.ps-custom-glow {
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.25);
  transition: all 0.3s ease;
}

/* Age verification badge pulse */
.ps-age-verified-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background-color: #0f172a;
  color: #f8fafc;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}`,
  customCssEnabled: true,

  customJs: `// =========================================================
// Ecommerce Store Global Custom JavaScript Handler
// =========================================================

(function() {
  console.log('[Dev Mode] Custom global JavaScript initialized successfully.');

  // Custom event listener example for tracking shop interactions
  window.addEventListener('load', function() {
    const ageBadge = document.querySelector('.ps-age-verified-badge');
    if (ageBadge) {
      ageBadge.title = 'Verified 18+ Customer Environment';
    }
  });
})();`,
  customJsEnabled: true,

  customHeadCode: `<!-- Custom Head Meta Tags & Resource Hints -->
<meta name="pouch-supply-environment" content="production-uk-eu">
<meta name="pouch-supply-dev-build" content="v2.8.4">
<link rel="dns-prefetch" href="https://cdn.yourstore.com">`,
  customHeadEnabled: true,

  customBodyCode: `<!-- Custom Body Footer Injection Hook -->
<div id="pouch-supply-body-injected-widget" data-dev-active="true" style="display:none;"></div>`,
  customBodyEnabled: true,

  snippets: [
    {
      id: 'snip-1',
      name: 'Express 24H Shipping Banner',
      key: 'shipping_banner_html',
      description: 'Top notification strip advertising UK 24H tracked delivery',
      code: `<div class="bg-slate-900 text-amber-400 text-[11px] font-extrabold py-1.5 px-4 text-center tracking-wider uppercase flex items-center justify-center gap-2">
  <span>⚡ FREE UK TRACKED 24 SHIPPING ON ORDERS OVER ₹30</span>
  <span class="text-slate-400">• DISPATCHED SAME DAY BEFORE 3PM</span>
</div>`,
      enabled: true,
      createdAt: '2026-07-28'
    },
    {
      id: 'snip-2',
      name: '18+ Age Guarantee Disclaimer',
      key: 'age_disclaimer_modal',
      description: 'Regulatory compliance notice for nicotine pouch sales',
      code: `<div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-600 font-medium leading-relaxed">
  <strong class="text-slate-900 font-bold">18+ Nicotine Notice:</strong> This website contains nicotine-containing white pouch canisters intended strictly for adult consumers (18+).
</div>`,
      enabled: true,
      createdAt: '2026-07-29'
    }
  ],

  integrations: {
    googleAnalyticsId: 'G-POUCH2026',
    googleAnalyticsEnabled: false,
    googleTagManagerId: 'GTM-PS9981',
    googleTagManagerEnabled: false,
    metaPixelId: '109283746501928',
    metaPixelEnabled: false,
    tikTokPixelId: '',
    tikTokPixelEnabled: false,
    microsoftClarityId: 'cl_pouch_2026',
    microsoftClarityEnabled: false,
    hotjarSiteId: '5098231',
    hotjarEnabled: false,
    customWebhookUrl: 'https://api.yourstore.com/webhooks/orders',
    customWebhookEnabled: false
  },

  updatedAt: new Date().toISOString()
};
