import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { installAdminFetch, installCustomerSessionCapture } from './lib/adminApi.ts';
// From '@vercel/analytics/react', NOT '/next'. The setup instructions Vercel
// shows assume a Next.js app; this is a Vite single-page app, and the /next
// entry point expects Next's router and does not work here.
import { Analytics } from '@vercel/analytics/react';
import './index.css';

// Installed before React mounts so the very first request already carries the
// token — App.tsx starts fetching during its initial effects. Capture wraps the
// header wrapper, so a sign-in response is read on the way back out.
installAdminFetch();
installCustomerSessionCapture();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      {/*
        Vercel Web Analytics page-view collection, for the storefront and the
        admin dashboard alike — both are this one app.

        It sits OUTSIDE ErrorBoundary's content but inside the tree so it is
        mounted once for the life of the page. The script it injects
        (/_vercel/insights/script.js) follows history.pushState itself, which is
        how this app navigates, so no router integration is needed.

        `mode` is set explicitly rather than left to auto-detect: the package
        reads process.env.NODE_ENV, which does not exist in a Vite browser
        bundle, so auto-detection would treat `npm run dev` as production and
        send beacons from localhost. In development it logs to the console
        instead.
      */}
      <Analytics mode={import.meta.env.DEV ? 'development' : 'production'} />
    </ErrorBoundary>
  </StrictMode>,
);

