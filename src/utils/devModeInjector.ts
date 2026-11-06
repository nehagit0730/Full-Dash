import { DevSettings } from '../types';

export function applyDevSettingsToDOM(settings: DevSettings): void {
  if (typeof document === 'undefined') return;

  try {
    // 1. Inject Custom CSS
    let styleEl = document.getElementById('ps-dev-custom-css') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'ps-dev-custom-css';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = settings.customCssEnabled ? (settings.customCss || '') : '';

    // 2. Inject Custom Head Code
    let headContainer = document.getElementById('ps-dev-custom-head-container');
    if (!headContainer) {
      headContainer = document.createElement('div');
      headContainer.id = 'ps-dev-custom-head-container';
      document.head.appendChild(headContainer);
    }
    if (settings.customHeadEnabled && settings.customHeadCode) {
      headContainer.innerHTML = settings.customHeadCode;
    } else {
      headContainer.innerHTML = '';
    }

    // 3. Inject Custom Body Code
    let bodyContainer = document.getElementById('ps-dev-custom-body-container');
    if (!bodyContainer) {
      bodyContainer = document.createElement('div');
      bodyContainer.id = 'ps-dev-custom-body-container';
      document.body.appendChild(bodyContainer);
    }
    if (settings.customBodyEnabled && settings.customBodyCode) {
      bodyContainer.innerHTML = settings.customBodyCode;
    } else {
      bodyContainer.innerHTML = '';
    }

    // 4. Inject Custom JavaScript
    const existingJsScript = document.getElementById('ps-dev-custom-js');
    if (existingJsScript) {
      existingJsScript.remove();
    }

    if (settings.customJsEnabled && settings.customJs && settings.customJs.trim()) {
      const scriptEl = document.createElement('script');
      scriptEl.id = 'ps-dev-custom-js';
      scriptEl.type = 'text/javascript';
      scriptEl.text = `try {
        ${settings.customJs}
      } catch (err) {
        console.error('[Dev Mode JS Error]:', err);
      }`;
      document.body.appendChild(scriptEl);
    }

    // 5. Third-Party Integrations
    // Google Analytics (GA4)
    let gaScript = document.getElementById('ps-dev-ga4-script');
    if (gaScript) gaScript.remove();
    if (settings.integrations?.googleAnalyticsEnabled && settings.integrations?.googleAnalyticsId) {
      const gaId = settings.integrations.googleAnalyticsId.trim();
      const s = document.createElement('script');
      s.id = 'ps-dev-ga4-script';
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(s);

      const sInline = document.createElement('script');
      sInline.id = 'ps-dev-ga4-inline';
      sInline.text = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
      `;
      document.head.appendChild(sInline);
    }

    // Google Tag Manager (GTM)
    let gtmScript = document.getElementById('ps-dev-gtm-script');
    if (gtmScript) gtmScript.remove();
    if (settings.integrations?.googleTagManagerEnabled && settings.integrations?.googleTagManagerId) {
      const gtmId = settings.integrations.googleTagManagerId.trim();
      const s = document.createElement('script');
      s.id = 'ps-dev-gtm-script';
      s.text = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`;
      document.head.appendChild(s);
    }

    // Meta Pixel
    let metaScript = document.getElementById('ps-dev-meta-script');
    if (metaScript) metaScript.remove();
    if (settings.integrations?.metaPixelEnabled && settings.integrations?.metaPixelId) {
      const pixelId = settings.integrations.metaPixelId.trim();
      const s = document.createElement('script');
      s.id = 'ps-dev-meta-script';
      s.text = `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');`;
      document.head.appendChild(s);
    }

    // TikTok Pixel
    let tikTokScript = document.getElementById('ps-dev-tiktok-script');
    if (tikTokScript) tikTokScript.remove();
    if (settings.integrations?.tikTokPixelEnabled && settings.integrations?.tikTokPixelId) {
      const pixelId = settings.integrations.tikTokPixelId.trim();
      const s = document.createElement('script');
      s.id = 'ps-dev-tiktok-script';
      s.text = `!function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie','holdConsent','revokeConsent','grantConsent'];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r='https://analytics.tiktok.com/i18n/pixel/events.js',o=n&&n.partner;ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var a=document.createElement('script');a.type='text/javascript';a.async=!0;a.src=r+'?sdkid='+e+'&lib='+t;var s=document.getElementsByTagName('script')[0];s.parentNode.insertBefore(a,s)};
        ttq.load('${pixelId}');ttq.page();
      }(window, document, 'ttq');`;
      document.head.appendChild(s);
    }

    // Microsoft Clarity
    let clarityScript = document.getElementById('ps-dev-clarity-script');
    if (clarityScript) clarityScript.remove();
    if (settings.integrations?.microsoftClarityEnabled && settings.integrations?.microsoftClarityId) {
      const clarityId = settings.integrations.microsoftClarityId.trim();
      const s = document.createElement('script');
      s.id = 'ps-dev-clarity-script';
      s.text = `(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "${clarityId}");`;
      document.head.appendChild(s);
    }

    // Hotjar
    let hotjarScript = document.getElementById('ps-dev-hotjar-script');
    if (hotjarScript) hotjarScript.remove();
    if (settings.integrations?.hotjarEnabled && settings.integrations?.hotjarSiteId) {
      const hjId = settings.integrations.hotjarSiteId.trim();
      const s = document.createElement('script');
      s.id = 'ps-dev-hotjar-script';
      s.text = `(function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:${hjId},hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`;
      document.head.appendChild(s);
    }

  } catch (err) {
    console.error('[Dev Mode Injector] Error applying settings:', err);
  }
}
