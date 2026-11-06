import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Product, Collection, Order, FileEntry, Customer, Discount, CustomPage, CartItem, BlogPost, LayoutSettings, DevSettings
} from './types';
import { 
  INITIAL_PRODUCTS, INITIAL_COLLECTIONS, INITIAL_ORDERS, INITIAL_FILES, INITIAL_CUSTOMERS, INITIAL_DISCOUNTS, DEFAULT_PAGES, INITIAL_BLOGS 
} from './initialData';
import { DEFAULT_DEV_SETTINGS } from './data/initialDevSettings';
import { applyDevSettingsToDOM } from './utils/devModeInjector';
import {
  getAdminToken,
  clearAdminToken,
  getCustomerToken,
  clearCustomerToken,
  hasValidAdminSession,
  adminSessionTimeRemaining,
  clearAdminSession,
  notifyAdminSessionExpired,
  resetAdminSessionExpiryNotice,
  ADMIN_SESSION_EXPIRED_EVENT
} from './lib/adminApi';
import AdminSessionExpiredModal from './components/admin/AdminSessionExpiredModal';
import ComingSoon from './components/ComingSoon';
import Header from './components/Header';
import Footer from './components/Footer';
import FashionHome from './components/storefront/FashionHome';
import ProductsGrid from './components/ProductsGrid';
import BrandList from './components/BrandList';
import CustomerAccount from './components/CustomerAccount';
import CartDrawer from './components/CartDrawer';
import CustomerDrawer from './components/CustomerDrawer';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import PageRenderer from './components/PageRenderer';
import PrivacyPolicy from './components/PrivacyPolicy';
import ShippingPolicy from './components/ShippingPolicy';
import RefundPolicy from './components/RefundPolicy';
import TermsConditions from './components/TermsConditions';
import ProductDetailView from './components/ProductDetailView';
import CollectionDetailView from './components/CollectionDetailView';
import CheckoutView from './components/CheckoutView';
import { FolderStructureView } from './components/FolderStructureView';
import { parseOrderTime } from './utils';
import { 
  Sparkles, ShieldCheck, Truck, RefreshCw, Star, ArrowRight, Package, ShoppingCart, Check, Heart, User, CheckCircle2, Save, AlertTriangle, Search, Undo, Mail, X
} from 'lucide-react';
import OrderWithdrawalModal from './components/OrderWithdrawalModal';

/** Listens for the footer's "Return or cancel an order" link. */
function WithdrawalOpener({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    const handler = () => onOpen();
    window.addEventListener('open-order-withdrawal', handler);
    return () => window.removeEventListener('open-order-withdrawal', handler);
  }, [onOpen]);
  return null;
}
import { cleanMediaUrl } from './utils/mediaUtils';
import { 
  initializeKlaviyo,
  initKlaviyo, 
  identifyCustomer,
  klaviyoIdentify, 
  klaviyoReset, 
  trackEvent,
  klaviyoTrack, 
  trackViewedProduct,
  klaviyoTrackViewedProduct, 
  klaviyoTrackAddedToCart, 
  trackStartedCheckout,
  klaviyoTrackStartedCheckout, 
  trackOrderCompleted,
  klaviyoTrackPlacedOrder 
} from './utils/klaviyo';

const ALLOWED_BRANDS = [
  '77',
  'clew',
  'cuba',
  'maggie',
  'nordic spirit',
  'xqs',
  'zyn',
  'pablo',
  'killa',
  'fumi',
  'velo',
  'white fox',
  'snu'
];

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80';

/**
 * The brand shown on a product. It used to be forced into a fixed list of
 * nicotine-pouch brands (an unknown or empty brand became "77"), which renamed
 * every other product. It is now kept exactly as entered.
 */
export const mapVendorToAllowedBrand = (vendor: string | undefined): string => String(vendor || '').trim();

export default function App() {
  // Helper for safe JSON parsing from LocalStorage
  const safeLoadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return defaultValue;
      const parsed = JSON.parse(saved);
      if (parsed === null || parsed === undefined) return defaultValue;
      return parsed as T;
    } catch (e) {
      console.warn(`[LocalStorage] Failed to parse key "${key}", reverting to default.`, e);
      return defaultValue;
    }
  };

  // Helper to safely write to LocalStorage with quota recovery
  const safeSaveToLocalStorage = (key: string, value: any) => {
    // For large collections like media files, do not overflow localstorage quota since they are persisted in the server database
    if (key === 'ps_files') {
      try {
        const list = Array.isArray(value) ? value : [];
        // Store a lightweight subset of max 25 items for offline fallback if needed
        const lightweight = list.slice(0, 25).map(f => ({
          id: f.id,
          url: f.url,
          fileName: f.fileName,
          size: f.size,
          dateAdded: f.dateAdded
        }));
        localStorage.setItem(key, JSON.stringify(lightweight));
      } catch (_) {
        try { localStorage.removeItem(key); } catch (_) {}
      }
      return;
    }

    try {
      const strVal = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, strVal);
    } catch (e) {
      try {
        // Clear non-critical caches to free space
        localStorage.removeItem('ps_simulated_emails');
        localStorage.removeItem('ps_files');
        const strVal = typeof value === 'string' ? value : JSON.stringify(value);
        if (strVal.length < 500000) {
          localStorage.setItem(key, strVal);
        }
      } catch (_) {
        // Silently ignore browser localstorage quota limits
      }
    }
  };

  // --- Persistent Storage State Initialization ---
  const [productsState, setProductsState] = useState<Product[]>(() => {
    const raw = safeLoadFromLocalStorage<Product[]>('ps_products', INITIAL_PRODUCTS);
    const seen = new Set<string>();
    const deduplicated: Product[] = [];
    for (const p of raw) {
      if (p && p.id && !seen.has(p.id)) {
        seen.add(p.id);
        const variantSeen = new Set<string>();
        const cleanVariants = (p.concreteVariants || []).filter(v => {
          if (v && v.id && !variantSeen.has(v.id)) {
            variantSeen.add(v.id);
            return true;
          }
          return false;
        });
        deduplicated.push({
          ...p,
          vendor: mapVendorToAllowedBrand(p.vendor),
          concreteVariants: cleanVariants
        });
      }
    }
    return deduplicated;
  });

  const products = productsState;
  const setProducts = (value: Product[] | ((prev: Product[]) => Product[])) => {
    setProductsState((prev) => {
      const resolved = typeof value === 'function' ? value(prev) : value;
      const seen = new Set<string>();
      const deduplicated: Product[] = [];
      for (const p of resolved) {
        if (p && p.id && !seen.has(p.id)) {
          seen.add(p.id);
          const variantSeen = new Set<string>();
          const cleanVariants = (p.concreteVariants || []).filter(v => {
            if (v && v.id && !variantSeen.has(v.id)) {
              variantSeen.add(v.id);
              return true;
            }
            return false;
          });
          deduplicated.push({
            ...p,
            vendor: mapVendorToAllowedBrand(p.vendor),
            concreteVariants: cleanVariants
          });
        }
      }
      return deduplicated;
    });
  };

  const [collections, setCollections] = useState<Collection[]>(() => {
    return safeLoadFromLocalStorage<Collection[]>('ps_collections', INITIAL_COLLECTIONS);
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    return safeLoadFromLocalStorage<Order[]>('ps_orders', INITIAL_ORDERS);
  });

  const [files, setFiles] = useState<FileEntry[]>(() => {
    return safeLoadFromLocalStorage<FileEntry[]>('ps_files', INITIAL_FILES);
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    return safeLoadFromLocalStorage<Customer[]>('ps_customers', INITIAL_CUSTOMERS);
  });

  const [discounts, setDiscounts] = useState<Discount[]>(() => {
    return safeLoadFromLocalStorage<Discount[]>('ps_discounts', INITIAL_DISCOUNTS);
  });

  const [blogs, setBlogs] = useState<BlogPost[]>(() => {
    return safeLoadFromLocalStorage<BlogPost[]>('ps_blogs', INITIAL_BLOGS);
  });

  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>(() => {
    return safeLoadFromLocalStorage<LayoutSettings>('ps_layout_settings', {
      headerLogoText: 'Ecommerce Store',
      headerLogoSubtext: 'Womenswear',
      headerLogoImage: '',
      footerLogoText: 'ECOMMERCE STORE',
      footerLogoDescription: 'Contemporary womenswear — dresses, ethnic wear and everyday essentials.',
      footerLogoImage: '',
      klaviyoPublicKey: '',
      cloudinaryCloudName: '',
      cloudinaryApiKey: '',
      cloudinaryApiSecret: '',
      menuItems: [
        { id: '1', label: 'Home', tab: 'frontend-home', type: 'tab' },
        { id: '3', label: 'Shop Now', tab: 'frontend-shop', type: 'tab' },
        { id: '4', label: 'All Brands', tab: 'frontend-brands', type: 'tab' },
        { id: '5', label: 'About', tab: 'about', type: 'tab' },
      ]
    });
  });

  const [devSettings, setDevSettings] = useState<DevSettings>(() => {
    return safeLoadFromLocalStorage<DevSettings>('ps_dev_settings', DEFAULT_DEV_SETTINGS);
  });

  // Dynamically inject custom CSS, JS, head, body, and third-party scripts into DOM
  useEffect(() => {
    applyDevSettingsToDOM(devSettings);
  }, [devSettings]);

  const handleUpdateDevSettings = (newSettings: DevSettings) => {
    setDevSettings(newSettings);
    safeSaveToLocalStorage('ps_dev_settings', newSettings);

    // Persist to the server's dev settings API endpoint
    fetch('/api/devsettings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    }).catch(err => console.error("Failed to sync dev settings to server:", err));
  };

  const handleUpdateLayoutSettings = (newSettings: LayoutSettings | ((prev: LayoutSettings) => LayoutSettings)) => {
    setLayoutSettings(prev => {
      const resolved = typeof newSettings === 'function' ? newSettings(prev) : newSettings;
      safeSaveToLocalStorage('ps_layout_settings', resolved);
      
      // Persist to the server's layout settings API endpoint
      fetch('/api/layoutsettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolved)
      }).catch(err => console.error("Failed to sync layout settings to server:", err));

      return resolved;
    });
  };

  const [selectedBlogSlug, setSelectedBlogSlug] = useState<string | null>(null);
  const [frontendBlogQuery, setFrontendBlogQuery] = useState('');
  const [selectedFrontCategory, setSelectedFrontCategory] = useState('All');

  const [customPages, setCustomPages] = useState<CustomPage[]>(() => {
    const loaded = safeLoadFromLocalStorage<CustomPage[]>('ps_custom_pages', DEFAULT_PAGES);
    const list = Array.isArray(loaded) ? loaded : DEFAULT_PAGES;
    let finalPages = [...list].filter(Boolean);
    // Guaranteed presence check for Homepage in Pages list
    if (!finalPages.some((p: any) => p && p.isHomepage)) {
      const defaultHome = DEFAULT_PAGES.find((p: any) => p.isHomepage);
      if (defaultHome) {
        finalPages = [defaultHome, ...finalPages];
      }
    }
    // Guaranteed presence check for Brands page
    if (!finalPages.some((p: any) => p && p.slug === 'brands')) {
      const defaultBrands = DEFAULT_PAGES.find((p: any) => p.slug === 'brands');
      if (defaultBrands) {
        finalPages = [...finalPages, defaultBrands];
      }
    }
    // Guaranteed presence check for About page
    if (!finalPages.some((p: any) => p && (p.slug === 'about' || p.id === 'about'))) {
      const defaultAbout = DEFAULT_PAGES.find((p: any) => p.slug === 'about' || p.id === 'about');
      if (defaultAbout) {
        finalPages = [...finalPages, defaultAbout];
      }
    }
    // Guaranteed presence check for Contact page
    if (!finalPages.some((p: any) => p && (p.slug === 'contact' || p.id === 'contact'))) {
      const defaultContact = DEFAULT_PAGES.find((p: any) => p.slug === 'contact' || p.id === 'contact');
      if (defaultContact) {
        finalPages = [...finalPages, defaultContact];
      }
    }
    return finalPages;
  });

  // Shopping Cart & User session statuses
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    return safeLoadFromLocalStorage<CartItem[]>('ps_cart', []);
  });

  const [loggedInCustomer, setLoggedInCustomer] = useState<Customer | null>(() => {
    try {
      const saved = localStorage.getItem('ps_logged_in_customer');
      if (!saved || saved === 'undefined') return null;
      const parsed = JSON.parse(saved);
      return parsed && parsed.id ? parsed : null;
    } catch (e) {
      console.warn('[LocalStorage] Failed to read ps_logged_in_customer:', e);
      return null;
    }
  });

  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [isDbOffline, setIsDbOffline] = useState<boolean>(false);
  const lastSyncedHash = useRef<Record<string, string>>({});
  // Per-order copy of what the server last held, keyed by order id. The order
  // sync sends only orders whose current state differs from this.
  const syncedOrderSnapshots = useRef<Map<string, string>>(new Map());

  // Reusable, highly robust sync engine that checks database connectivity headers and avoids redundant syncs
  const syncToApi = async (resource: string, payload: any[]) => {
    try {
      // These endpoints REPLACE a whole resource and are administrators-only.
      //
      // The effects that call this are gated on `isInitialLoadDone`, not on who
      // is looking, so they used to run for every anonymous shopper. That was
      // not merely pointless: when a GET failed, the matching `lastSyncedHash`
      // entry was never seeded, and the next state change posted the visitor's
      // stale localStorage copy over the live catalogue or customer list.
      // Stopping here keeps that impossible rather than merely unauthorised.
      if (!getAdminToken()) {
        return;
      }

      const serialized = JSON.stringify(payload);
      if (lastSyncedHash.current[resource] === serialized) {
        return; // Data has not changed since last load/sync, avoid redundant POST
      }
      lastSyncedHash.current[resource] = serialized;

      const res = await fetch(`/api/${resource}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: serialized
      });
      if (res.ok) {
        const offlineHeader = res.headers.get("X-Database-Offline");
        if (offlineHeader === "true") {
          setIsDbOffline(true);
        } else {
          setIsDbOffline(false);
        }
      }
    } catch (err: any) {
      console.warn(`[Sync Engine] Failed to sync ${resource}:`, err?.message || err);
    }
  };

  const loadedProductsSuccess = useRef(false);
  const loadedCollectionsSuccess = useRef(false);
  const loadedOrdersSuccess = useRef(false);
  const loadedFilesSuccess = useRef(false);
  const loadedCustomersSuccess = useRef(false);
  const loadedDiscountsSuccess = useRef(false);
  const loadedPagesSuccess = useRef(false);
  const loadedBlogsSuccess = useRef(false);

  // Load all central database arrays on mount
  useEffect(() => {
    async function loadDataFromDb() {
      try {
        const safeFetchJson = async (url: string) => {
          const controller = new AbortController();
          const timeoutId = window.setTimeout(() => controller.abort(), 10000);
          try {
            const r = await fetch(url, { signal: controller.signal });
            if (!r.ok) return null;
            const ct = r.headers.get('content-type');
            if (ct && ct.includes('application/json')) {
              return await r.json();
            }
            return null;
          } catch {
            return null;
          } finally {
            window.clearTimeout(timeoutId);
          }
        };

        // Orders and customers are no longer world-readable. An administrator
        // still loads the whole store; a signed-in shopper loads only their own
        // record and their own orders; a signed-out visitor loads neither,
        // because nothing on the storefront needs them.
        const ordersUrl = getAdminToken()
          ? '/api/orders'
          : getCustomerToken()
            ? '/api/orders/mine'
            : null;

        const savedCustomerEmail = loggedInCustomer?.email
          ? String(loggedInCustomer.email).trim().toLowerCase()
          : '';
        const customersUrl = getAdminToken()
          ? '/api/customers'
          : getCustomerToken() && savedCustomerEmail
            ? `/api/customers/by-email?email=${encodeURIComponent(savedCustomerEmail)}`
            : null;

        // Fetch store data
        const [
          prodsRes, collsRes, ordersRes, filesRes,
          custsRes, discsRes, pagesRes, blogsRes, layoutRes, devRes
        ] = await Promise.all([
          safeFetchJson('/api/products'),
          safeFetchJson('/api/collections'),
          ordersUrl ? safeFetchJson(ordersUrl) : Promise.resolve(null),
          safeFetchJson('/api/files'),
          customersUrl ? safeFetchJson(customersUrl) : Promise.resolve(null),
          safeFetchJson('/api/discounts'),
          safeFetchJson('/api/custompages'),
          safeFetchJson('/api/blogs'),
          safeFetchJson('/api/layoutsettings'),
          safeFetchJson('/api/devsettings'),
        ]);

        if (Array.isArray(prodsRes) && prodsRes.length > 0) {
          setProducts(prevLocalProds => {
            const serverMap = new Map(prodsRes.map((p: any) => [p.id, p]));
            const merged = [...prodsRes];
            for (const localProd of prevLocalProds) {
              if (localProd && localProd.id && !serverMap.has(localProd.id)) {
                merged.push(localProd);
              }
            }
            lastSyncedHash.current['products'] = JSON.stringify(merged);
            return merged;
          });
          loadedProductsSuccess.current = true;
        }
        if (Array.isArray(collsRes) && collsRes.length > 0) {
          setCollections(prevLocalColls => {
            const serverMap = new Map(collsRes.map((c: any) => [c.id, c]));
            const merged = [...collsRes];
            for (const localCol of prevLocalColls) {
              if (localCol && localCol.id && !serverMap.has(localCol.id)) {
                merged.push(localCol);
              }
            }
            lastSyncedHash.current['collections'] = JSON.stringify(merged);
            return merged;
          });
          loadedCollectionsSuccess.current = true;
        }
        if (Array.isArray(ordersRes)) {
          setOrders(ordersRes);
          lastSyncedHash.current['orders'] = JSON.stringify(ordersRes);
          // The server's copy of each order is the baseline the order sync
          // compares against, so only orders changed in this tab are sent back.
          syncedOrderSnapshots.current = new Map(
            ordersRes.filter((o: any) => o && o.id).map((o: any) => [String(o.id), JSON.stringify(o)])
          );
          loadedOrdersSuccess.current = true;
        }
        if (Array.isArray(filesRes)) {
          setFiles(prevLocalFiles => {
            const serverUrls = new Set(filesRes.map((f: any) => f.url));
            const merged = [...filesRes];
            for (const localFile of prevLocalFiles) {
              if (localFile && localFile.url && !serverUrls.has(localFile.url)) {
                merged.push(localFile);
              }
            }
            lastSyncedHash.current['files'] = JSON.stringify(merged);
            return merged;
          });
          loadedFilesSuccess.current = true;
        }
        // An admin gets the array; a shopper gets { customer } from by-email and
        // is the only entry their session is allowed to see.
        const custsList: any[] | null = Array.isArray(custsRes)
          ? custsRes
          : (custsRes as any)?.customer
            ? [(custsRes as any).customer]
            : null;

        if (custsList && custsList.length > 0) {
          setCustomers(custsList);
          lastSyncedHash.current['customers'] = JSON.stringify(custsList);
          loadedCustomersSuccess.current = true;

          // Sync currently logged-in customer's details immediately on load
          const savedStr = localStorage.getItem('ps_logged_in_customer');
          if (savedStr && savedStr !== 'undefined') {
            try {
              const savedObj = JSON.parse(savedStr);
              if (savedObj && savedObj.email) {
                const fresh = custsList.find((c: any) => c.id === savedObj.id || (c.email && c.email.toLowerCase() === savedObj.email.toLowerCase()));
                if (fresh) {
                  setLoggedInCustomer(fresh);
                }
              }
            } catch (e) {}
          }
        }
        if (Array.isArray(discsRes) && discsRes.length > 0) {
          setDiscounts(discsRes);
          lastSyncedHash.current['discounts'] = JSON.stringify(discsRes);
          loadedDiscountsSuccess.current = true;
        }
        if (Array.isArray(pagesRes) && pagesRes.length > 0) {
          setCustomPages(prevLocalPages => {
            const localMap = new Map(prevLocalPages.map(p => [p.id, p]));
            
            const mergedPages = pagesRes.map((serverPage: CustomPage) => {
              const localPage = localMap.get(serverPage.id) || prevLocalPages.find(p => p.slug === serverPage.slug);
              
              const serverHasSections = Array.isArray(serverPage.sections) && serverPage.sections.length > 0;
              let finalSections = serverPage.sections || [];
              if (!serverHasSections) {
                const localPage = localMap.get(serverPage.id) || prevLocalPages.find(p => p.slug === serverPage.slug);
                if (localPage && Array.isArray(localPage.sections) && localPage.sections.length > 0) {
                  finalSections = localPage.sections;
                } else {
                  const defaultPage = DEFAULT_PAGES.find(dp => dp.id === serverPage.id || dp.slug === serverPage.slug);
                  if (defaultPage && defaultPage.sections) {
                    finalSections = defaultPage.sections;
                  }
                }
              }
              
              return {
                ...serverPage,
                sections: finalSections
              };
            });

            // Keep local pages created on client that aren't on server yet
            const serverIdSet = new Set(pagesRes.map((p: any) => p && p.id).filter(Boolean));
            const serverSlugsSet = new Set(pagesRes.map((p: any) => p && p.slug).filter(Boolean));
            const serverHasHomepage = pagesRes.some((sp: any) => sp && (sp.isHomepage || sp.slug === '' || sp.slug === 'home' || sp.slug === 'homepage' || sp.id === 'homepage' || sp.id === 'page-home'));

            const missingLocalPages = prevLocalPages.filter(lp => {
              if (!lp || !lp.id) return false;
              const isLocalHome = lp.isHomepage || lp.slug === '' || lp.slug === 'home' || lp.slug === 'homepage' || lp.id === 'homepage' || lp.id === 'page-home';
              if (serverHasHomepage && isLocalHome) return false;
              if (serverIdSet.has(lp.id)) return false;
              if (lp.slug && serverSlugsSet.has(lp.slug)) return false;
              return true;
            });

            let combined = [...mergedPages, ...missingLocalPages];

            // Normalize homepage flags across all pages to prevent duplicate/overwriting homepage entries
            const explicitHomeIdx = combined.findIndex(p => p && p.isHomepage === true);
            let homeMarked = false;

            combined = combined.map((p, idx) => {
              if (!p) return p;
              const isHomeMatch = (explicitHomeIdx !== -1 && idx === explicitHomeIdx) ||
                (explicitHomeIdx === -1 && (p.isHomepage || p.slug === '' || p.slug === 'home' || p.slug === 'homepage' || p.id === 'homepage' || p.id === 'page-home'));

              if (isHomeMatch && !homeMarked) {
                homeMarked = true;
                return { ...p, isHomepage: true };
              } else {
                return { ...p, isHomepage: false };
              }
            });

            if (!combined.some(p => p && p.slug === 'brands')) {
              const defaultBrands = DEFAULT_PAGES.find(p => p.slug === 'brands');
              if (defaultBrands) combined = [...combined, defaultBrands];
            }

            lastSyncedHash.current['custompages'] = JSON.stringify(combined);
            return combined;
          });
          loadedPagesSuccess.current = true;
        }
        if (Array.isArray(blogsRes) && blogsRes.length > 0) {
          setBlogs(blogsRes);
          lastSyncedHash.current['blogs'] = JSON.stringify(blogsRes);
          loadedBlogsSuccess.current = true;
        }
        
        if (layoutRes) {
          const resData = layoutRes.data || layoutRes;
          setLayoutSettings(prev => {
            const merged = {
              ...prev,
              ...resData,
              klaviyoPublicKey: resData.klaviyoPublicKey || prev.klaviyoPublicKey || '',
              cloudinaryCloudName: resData.cloudinaryCloudName || prev.cloudinaryCloudName || '',
              cloudinaryApiKey: resData.cloudinaryApiKey || prev.cloudinaryApiKey || '',
              cloudinaryApiSecret: resData.cloudinaryApiSecret || prev.cloudinaryApiSecret || '',
            };
            safeSaveToLocalStorage('ps_layout_settings', merged);
            if (
              (!resData.klaviyoPublicKey && merged.klaviyoPublicKey) ||
              (!resData.cloudinaryCloudName && merged.cloudinaryCloudName)
            ) {
              fetch('/api/layoutsettings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(merged)
              }).catch(() => {});
            }
            return merged;
          });
        }

        if (devRes) {
          const resDevData = devRes.data || devRes;
          if (resDevData && typeof resDevData === 'object' && resDevData.customCss !== undefined) {
            setDevSettings(prev => {
              const merged = { ...prev, ...resDevData };
              safeSaveToLocalStorage('ps_dev_settings', merged);
              return merged;
            });
          }
        }
      } catch (err) {
        console.error("[State Loader] Failed to connect to backend Database API. Using local backup state.", err);
      } finally {
        setIsInitialLoadDone(true);
      }
    }
    loadDataFromDb();
  }, []);

  // App Routing Navigation
  const [currentTab, setCurrentTab] = useState<string>('frontend-home');

  // Fix pages opening directly at the bottom or middle: scroll to top on every navigation change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentTab]);
  const [activeCollectionId, setActiveCollectionId] = useState<string>('all');
  // Derived from the URL up front. Initialising this to `false` while the
  // address bar already said /admin-dashboard left the state and the URL
  // disagreeing for one render, and the URL-sync effect below then "corrected"
  // the URL to the storefront — so opening /admin-dashboard directly rendered
  // the shop instead of the dashboard.
  const [isAdminActive, setIsAdminActive] = useState<boolean>(() => {
    try {
      const path = window.location.pathname;
      return path === '/admin-dashboard' || path.startsWith('/admin-dashboard/');
    } catch {
      return false;
    }
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    // The signed token is the real credential; this flag only decides which view
    // renders. Without a token the dashboard would render but every admin call
    // would 401, so both must be present to count as signed in.
    //
    // The token's EXPIRY is checked too, not just its presence. A tab left open
    // overnight still holds the string for an eight-hour token that died hours
    // ago; rendering the dashboard from that produced the empty panels and
    // failing saves this now avoids.
    return sessionStorage.getItem('ps_admin_authenticated') === 'true' && hasValidAdminSession();
  });
  /**
   * Set when the admin session ends, which puts the blocking notice on screen.
   *
   * Seeded on first render for the case this was reported from: the tab was
   * signed in yesterday (`ps_admin_authenticated` is still 'true') and the token
   * has since expired. The sign-in screen alone would leave the admin guessing
   * why they were thrown out, so the notice is shown over it and says so.
   */
  const [adminSessionExpired, setAdminSessionExpired] = useState<'expired' | 'rejected' | null>(() => {
    try {
      const wasSignedIn = sessionStorage.getItem('ps_admin_authenticated') === 'true';
      return wasSignedIn && !hasValidAdminSession() ? 'expired' : null;
    } catch {
      return null;
    }
  });
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState<boolean>(false);
  const [customerDrawerTab, setCustomerDrawerTab] = useState<'orders' | 'addresses' | 'wishlist'>('orders');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [emailToast, setEmailToast] = useState<{ to: string; subject: string; refund: number } | null>(null);

  // Gateway checkout persistent states
  const [checkoutDiscount, setCheckoutDiscount] = useState<Discount | null>(null);
  const [checkoutTotal, setCheckoutTotal] = useState<number>(0);
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState<boolean>(false);

  /**
   * The password-protected "coming soon" gate.
   *
   * null while the mode is still being fetched, so the storefront is not shown
   * for a moment and then snatched away — and, just as important, so a slow
   * request cannot black out a shop that is actually live.
   */
  const [siteGate, setSiteGate] = useState<{ mode: 'live' | 'password'; headline: string; message: string } | null>(null);
  const [hasSitePass, setHasSitePass] = useState(false);

  const SITE_PASS_KEY = 'ps_site_pass';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/site-status');
        if (!res.ok) throw new Error('unavailable');
        const data = await res.json();
        if (cancelled) return;

        setSiteGate({
          mode: data?.mode === 'password' ? 'password' : 'live',
          headline: String(data?.headline || ''),
          message: String(data?.message || '')
        });

        if (data?.mode === 'password') {
          // A pass from a previous visit is re-checked with the server rather
          // than trusted: changing the password must turn everyone out.
          const stored = localStorage.getItem(SITE_PASS_KEY);
          if (stored) {
            const check = await fetch('/api/site-status/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pass: stored })
            });
            const ok = (await check.json().catch(() => null))?.ok === true;
            if (!ok) localStorage.removeItem(SITE_PASS_KEY);
            if (!cancelled) setHasSitePass(ok);
          }
        }
      } catch {
        // Unreachable status endpoint means the shop stays open. A site nobody
        // can see is a worse failure than one that is briefly public.
        if (!cancelled) setSiteGate({ mode: 'live', headline: '', message: '' });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const unlockSite = async (password: string): Promise<boolean> => {
    const res = await fetch('/api/site-status/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.ok !== true || !data?.pass) return false;
    try { localStorage.setItem(SITE_PASS_KEY, data.pass); } catch { /* private mode */ }
    setHasSitePass(true);
    return true;
  };

  /**
   * Watches the admin session and says so, out loud, the moment it ends.
   *
   * Three things can end it, and all three land here:
   *   - the token's own expiry passing while the tab sits open (the timer);
   *   - an /api/ call coming back 401/403 (the fetch wrapper raises the event);
   *   - the tab being woken after the laptop was asleep, when no timer fired
   *     (the visibility and focus re-check).
   *
   * Without this the dashboard simply kept rendering against a dead token:
   * panels came up empty, saves failed, and nothing said why.
   */
  useEffect(() => {
    if (!isAdminAuthenticated) return;

    const onExpired = (event: Event) => {
      const reason = (event as CustomEvent)?.detail?.reason;
      setAdminSessionExpired(reason === 'rejected' ? 'rejected' : 'expired');
    };
    window.addEventListener(ADMIN_SESSION_EXPIRED_EVENT, onExpired);

    // Re-checked rather than trusted: a sleeping machine does not run timers, so
    // an admin who opens the lid next morning would otherwise see nothing until
    // they clicked something.
    const recheck = () => {
      if (!hasValidAdminSession()) notifyAdminSessionExpired('expired');
    };
    document.addEventListener('visibilitychange', recheck);
    window.addEventListener('focus', recheck);

    // setTimeout is clamped to ~24.8 days, comfortably beyond the 8-hour token,
    // so a single timer is enough. +1s so it fires just after the expiry.
    const remaining = adminSessionTimeRemaining();
    const timer = window.setTimeout(recheck, remaining + 1000);

    // Covers the case where the session was already dead when this mounted.
    recheck();

    return () => {
      window.removeEventListener(ADMIN_SESSION_EXPIRED_EVENT, onExpired);
      document.removeEventListener('visibilitychange', recheck);
      window.removeEventListener('focus', recheck);
      window.clearTimeout(timer);
    };
  }, [isAdminAuthenticated]);

  /** Ends the admin session locally and returns to the sign-in screen. */
  const signOutExpiredAdmin = () => {
    clearAdminSession();
    resetAdminSessionExpiryNotice();
    setAdminSessionExpired(null);
    setIsAdminAuthenticated(false);
    setIsAdminDirty(false);
  };

  // Unified SPA navigation helper mapping state shifts to matching browser URLs
  const navigateToTab = (rawTab: string, productId?: string, collectionId?: string) => {
    // Subscriptions were removed; saved menus or links that still point there go to the shop.
    const tab = rawTab === 'frontend-subscribe' || /(^|\/)subscribe(\/|$)/.test(rawTab) ? 'frontend-shop' : rawTab;
    let url = '/';
    let targetTab = tab;

    if (tab === 'frontend-home') {
      url = '/';
    } else if (tab === 'frontend-shop') {
      url = '/collections/all';
    } else if (tab === 'frontend-brands') {
      url = '/pages/brands';
    } else if (tab === 'frontend-account') {
      url = '/pages/account';
    } else if (tab === 'frontend-checkout') {
      url = '/pages/checkout';
    } else if (tab === 'blogs') {
      url = '/blogs';
    } else if (tab === 'blog-detail' && productId) {
      url = `/blogs/${productId}`;
    } else if (tab === 'product-detail' && productId) {
      const [cleanProdId, queryStr] = productId.split('?');
      const prod = products.find(p => p.id === cleanProdId || p.slug === cleanProdId);
      url = `/products/${prod?.slug || cleanProdId}${queryStr ? `?${queryStr}` : ''}`;
    } else if (tab === 'collection-detail' && collectionId) {
      const col = collections.find(c => 
        c.id === collectionId || 
        c.slug === collectionId || 
        slugify(c.title) === collectionId ||
        c.id.toLowerCase() === collectionId.toLowerCase() ||
        (c.slug && c.slug.toLowerCase() === collectionId.toLowerCase())
      );
      url = `/collections/${col?.slug || col?.id || collectionId}`;
    } else {
      const cleanSlug = tab.replace(/^\/+/, '').replace(/^pages\//, '');
      url = `/pages/${cleanSlug}`;
      targetTab = cleanSlug;
    }

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
    const currentFullPath = `${currentPath}${currentSearch}`;
    const targetFullPath = `${url}`;

    if (currentFullPath !== targetFullPath) {
      try {
        window.history.pushState({}, '', url);
      } catch (e) {
        console.warn('[History] Failed to pushState (sandboxed iframe constraint):', e);
      }
    }

    setCurrentTab(prev => (prev === targetTab ? prev : targetTab));
    if (targetTab === 'blog-detail' && productId) {
      setSelectedBlogSlug(productId);
    }
    if (productId !== undefined) {
      const [cleanProdId] = productId.split('?');
      setSelectedProductId(cleanProdId);
    }
    if (collectionId !== undefined) {
      setActiveCollectionId(collectionId);
    }
    setIsAdminActive(false);
  };

  // Helper for handling navigation requests from custom page section renderers
  const handlePageRendererNavigate = (target: string, arg?: string) => {
    if (target.includes('subscribe')) {
      // Subscriptions were removed; old links to them land on the shop.
      navigateToTab('frontend-shop');
    } else if (target === 'product-detail' && arg) {
      navigateToTab('product-detail', arg);
    } else if (target === 'collection-detail' && arg) {
      navigateToTab('collection-detail', undefined, arg);
    } else if (target === 'blog-detail' && arg) {
      navigateToTab('blog-detail', arg);
    } else if (target === 'frontend-shop' && arg) {
      navigateToTab('collection-detail', undefined, arg);
    } else if (target.startsWith('/products/') || target.startsWith('product-')) {
      const prodId = target.replace('/products/', '').replace('product-', '');
      navigateToTab('product-detail', prodId);
    } else if (target.startsWith('/collections/') || target.startsWith('collection-')) {
      const colId = target.replace('/collections/', '').replace('collection-', '');
      navigateToTab('collection-detail', undefined, colId);
    } else if (target.startsWith('/blogs/') || target.startsWith('blog-')) {
      const blogSlug = target.replace('/blogs/', '').replace('blog-', '');
      navigateToTab('blog-detail', blogSlug);
    } else if (target.startsWith('/pages/') || target.startsWith('page-')) {
      const slug = target.replace('/pages/', '').replace('page-', '');
      navigateToTab(slug);
    } else {
      navigateToTab(target);
    }
  };

  // Unsaved changes sync dialog states
  const [isAdminDirty, setIsAdminDirty] = useState<boolean>(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState<boolean>(false);
  const [pendingNavAction, setPendingNavAction] = useState<{
    type: 'toggle-admin' | 'change-tab';
    payload?: string;
  } | null>(null);
  const [adminActionTrigger, setAdminActionTrigger] = useState<{
    action: 'save' | 'discard';
    timestamp: number;
  } | null>(null);

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  };
  
  // Checkout Successful Indicator modal
  const [checkoutSuccessful, setCheckoutSuccessful] = useState<{ id: string; amount: number } | null>(null);

  // Synchronize path and load links successfully in iframe/new tab
  useEffect(() => {
    const handleLocationChange = () => {
      let path = '';
      try {
        path = window.location.pathname;
      } catch (e) {
        console.warn('[History] Failed to read location pathname:', e);
      }

      const nextAdminState = path === '/admin-dashboard' || path.startsWith('/admin-dashboard/');
      setIsAdminActive(prev => (prev === nextAdminState ? prev : nextAdminState));
      if (nextAdminState) return;


      if (path === '/' || path === '' || path === '/home' || path === '/home/' || path === '/homepage') {
        setCurrentTab(prev => (prev === 'frontend-home' ? prev : 'frontend-home'));
      } else if (path === '/checkout' || path === '/checkout/') {
        setCurrentTab(prev => (prev === 'frontend-checkout' ? prev : 'frontend-checkout'));
      } else if (path === '/blogs' || path === '/blogs/') {
        setCurrentTab(prev => (prev === 'blogs' ? prev : 'blogs'));
      } else if (path.startsWith('/blogs/')) {
        const slug = path.replace('/blogs/', '');
        setSelectedBlogSlug(prev => (prev === slug ? prev : slug));
        setCurrentTab(prev => (prev === 'blog-detail' ? prev : 'blog-detail'));
      } else if (path.startsWith('/pages/')) {
        const slug = path.replace('/pages/', '').replace(/^\/+/, '');
        if (slug === 'home' || slug === 'homepage' || slug === '') {
          setCurrentTab(prev => (prev === 'frontend-home' ? prev : 'frontend-home'));
        } else if (slug === 'subscribe' || slug.startsWith('subscribe/')) {
          setCurrentTab(prev => (prev === 'frontend-shop' ? prev : 'frontend-shop'));
        } else if (slug === 'brands') {
          setCurrentTab(prev => (prev === 'frontend-brands' ? prev : 'frontend-brands'));
        } else if (slug === 'account' || slug.startsWith('account/')) {
          setCurrentTab(prev => (prev === 'frontend-account' ? prev : 'frontend-account'));
        } else if (slug === 'checkout') {
          setCurrentTab(prev => (prev === 'frontend-checkout' ? prev : 'frontend-checkout'));
        } else {
          setCurrentTab(prev => (prev === slug ? prev : slug));
        }
      } else if (path.startsWith('/collections/')) {
        const colId = path.replace('/collections/', '');
        const matchedCol = collections.find(c => 
          c.id === colId || 
          (c.slug && c.slug === colId) || 
          slugify(c.title) === colId || 
          c.id.toLowerCase() === colId.toLowerCase() ||
          (c.slug && c.slug.toLowerCase() === colId.toLowerCase()) ||
          slugify(c.id) === colId.toLowerCase()
        );
        if (matchedCol) {
          setActiveCollectionId(prev => (prev === matchedCol.id ? prev : matchedCol.id));
          setCurrentTab(prev => (prev === 'collection-detail' ? prev : 'collection-detail'));
        } else {
          setActiveCollectionId(prev => (prev === 'all' ? prev : 'all'));
          setCurrentTab(prev => (prev === 'frontend-shop' ? prev : 'frontend-shop'));
        }
      } else if (path.startsWith('/products/')) {
        const prodId = path.replace('/products/', '');
        setSelectedProductId(prev => (prev === decodeURIComponent(prodId) ? prev : decodeURIComponent(prodId)));
        setCurrentTab(prev => (prev === 'product-detail' ? prev : 'product-detail'));
      }
    };
    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [collections]);

  // Synchronize browser URL when isAdminActive state changes in React UI
  const adminUrlSyncMounted = useRef(false);
  useEffect(() => {
    // On the first run the URL is the source of truth for this state, not the
    // other way round. Writing to history here on mount would overwrite the
    // address the user actually asked for.
    if (!adminUrlSyncMounted.current) {
      adminUrlSyncMounted.current = true;
      return;
    }

    let path = '';
    try {
      path = window.location.pathname;
    } catch (e) {
      console.warn('[History] Failed to read location pathname:', e);
    }

    if (isAdminActive) {
      if (!path.startsWith('/admin-dashboard')) {
        try {
          window.history.pushState({}, '', '/admin-dashboard/analytics');
        } catch (e) {
          console.warn('[History] Failed to pushState (sandboxed iframe constraint):', e);
        }
      }
    } else {
      if (path.startsWith('/admin-dashboard')) {
        // Switch back to matching URL for the currently active tab
        let url = '/';
        if (currentTab === 'frontend-home') {
          url = '/';
        } else if (currentTab === 'frontend-shop') {
          url = '/collections/all';
        } else if (currentTab === 'frontend-brands') {
          url = '/pages/brands';
        } else if (currentTab === 'frontend-account') {
          url = '/pages/account';
        } else if (currentTab === 'blogs') {
          url = '/blogs';
        } else if (currentTab === 'blog-detail' && selectedBlogSlug) {
          url = `/blogs/${selectedBlogSlug}`;
        } else if (currentTab === 'product-detail' && selectedProductId) {
          const prod = products.find(p => p.id === selectedProductId || p.slug === selectedProductId);
          url = `/products/${prod?.slug || selectedProductId}`;
        } else if (currentTab === 'collection-detail' && activeCollectionId) {
          const col = collections.find(c => c.id === activeCollectionId || c.slug === activeCollectionId);
          url = `/collections/${col?.slug || activeCollectionId}`;
        } else {
          url = `/pages/${currentTab}`;
        }
        try {
          window.history.pushState({}, '', url);
        } catch (e) {
          console.warn('[History] Failed to pushState (sandboxed iframe constraint):', e);
        }
      }
    }
  }, [isAdminActive]);

  // Listen for image uploads/URL entries across components and auto-add to files list
  useEffect(() => {
    const handleFileOrImageUploaded = (event: Event) => {
      const customEvent = event as CustomEvent<{ url: string; fileName?: string; mimeType?: string; size?: string }>;
      const { url, fileName, mimeType, size } = customEvent.detail || {};
      if (!url) return;

      setFiles((prevFiles) => {
        const exists = prevFiles.some((f) => f.url === url || f.id === url);
        if (exists) return prevFiles;

        const cleanName = fileName || (url.split('/').pop()?.split('?')[0]) || 'Uploaded Media Asset';
        const fileEntry: FileEntry = {
          id: `file-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          fileName: cleanName,
          altText: cleanName.split('.')[0] || 'Uploaded Media Asset',
          dateAdded: new Date().toISOString().split('T')[0],
          size: size || 'Media Asset',
          references: 'Used in Editor',
          url: url,
          mimeType: mimeType
        };

        return [fileEntry, ...prevFiles];
      });
    };

    window.addEventListener('app-image-uploaded', handleFileOrImageUploaded);
    window.addEventListener('app-file-uploaded', handleFileOrImageUploaded);

    const handleOrderCompleted = async () => {
      try {
        // Same scoping as the mount load: the full list is administrators only.
        const url = getAdminToken() ? '/api/orders' : getCustomerToken() ? '/api/orders/mine' : null;
        if (!url) return;
        const res = await fetch(url);
        if (res.ok) {
          const freshOrders = await res.json();
          if (Array.isArray(freshOrders)) {
            const sorted = [...freshOrders].sort((a, b) => parseOrderTime(b) - parseOrderTime(a));
            // Fresh from the server, so they become the baseline — otherwise the
            // order sync would treat them as local edits and post them back.
            syncedOrderSnapshots.current = new Map(
              sorted.filter((o: any) => o && o.id).map((o: any) => [String(o.id), JSON.stringify(o)])
            );
            setOrders(sorted);
          }
        }
      } catch (err) {
        console.warn('Failed to refresh orders on order-completed event:', err);
      }
    };

    window.addEventListener('order-completed', handleOrderCompleted);

    return () => {
      window.removeEventListener('app-image-uploaded', handleFileOrImageUploaded);
      window.removeEventListener('app-file-uploaded', handleFileOrImageUploaded);
      window.removeEventListener('order-completed', handleOrderCompleted);
    };
  }, []);

  // --- Write to LocalStorage AND Neon PostgreSQL Database on Changes ---
  useEffect(() => {
    safeSaveToLocalStorage('ps_products', products);
    if (isInitialLoadDone) {
      syncToApi('products', products);
    }
  }, [products, isInitialLoadDone]);

  useEffect(() => {
    safeSaveToLocalStorage('ps_collections', collections);
    if (isInitialLoadDone) {
      syncToApi('collections', collections);
    }
  }, [collections, isInitialLoadDone]);

  /**
   * Sends back only the orders this tab actually changed.
   *
   * This used to POST the entire order list from every browser — shoppers
   * included — whenever anything in it changed, and the server saved that list
   * as the new truth. A tab holding an out-of-date or damaged copy therefore
   * overwrote every order in the store, reverting other people's changes and
   * deleting orders it had never seen. Now each order is compared with the
   * server's copy loaded into this tab, and only the ones that differ are sent.
   * Nothing is sent at all until the server's orders have loaded, so a copy
   * restored from localStorage can never be pushed back as if it were current.
   */
  useEffect(() => {
    safeSaveToLocalStorage('ps_orders', orders);
    if (!isInitialLoadDone || !loadedOrdersSuccess.current) return;

    const baseline = syncedOrderSnapshots.current;
    const present = new Set<string>();
    const changed: Order[] = [];
    for (const order of orders) {
      if (!order || !order.id) continue;
      const id = String(order.id);
      present.add(id);
      const serialized = JSON.stringify(order);
      if (baseline.get(id) !== serialized) {
        changed.push(order);
        baseline.set(id, serialized);
      }
    }
    // An order removed here (the admin's delete, which calls DELETE itself)
    // leaves the baseline, so restoring it with Undo counts as a change.
    for (const id of Array.from(baseline.keys())) {
      if (!present.has(id)) baseline.delete(id);
    }

    if (changed.length > 0) {
      lastSyncedHash.current['orders'] = '';
      syncToApi('orders', changed);
    }
  }, [orders, isInitialLoadDone]);

  useEffect(() => {
    safeSaveToLocalStorage('ps_files', files);
    if (isInitialLoadDone) {
      syncToApi('files', files);
    }
  }, [files, isInitialLoadDone]);

  useEffect(() => {
    safeSaveToLocalStorage('ps_customers', customers);
    if (isInitialLoadDone) {
      syncToApi('customers', customers);
    }
  }, [customers, isInitialLoadDone]);

  /**
   * Persists the signed-in shopper's own record.
   *
   * Wishlist entries, saved addresses and post-order stats are written by
   * handlers that only touch React state; they reached the database as a side
   * effect of the store-wide customers sync above. That sync is now
   * administrators-only, so without this a shopper's wishlist would look saved
   * until they reloaded the page.
   *
   * Goes through update-profile, which writes only the account named in the
   * caller's own token.
   */
  const lastCustomerProfileHash = useRef<string>('');
  useEffect(() => {
    if (!isInitialLoadDone || !loggedInCustomer?.email || !getCustomerToken()) return;

    const serialized = JSON.stringify(loggedInCustomer);
    if (lastCustomerProfileHash.current === serialized) return;
    lastCustomerProfileHash.current = serialized;

    fetch('/api/customers/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer: loggedInCustomer })
    }).catch(err => console.warn('[Profile Sync] Could not save your account changes:', err));
  }, [loggedInCustomer, isInitialLoadDone]);

  useEffect(() => {
    safeSaveToLocalStorage('ps_discounts', discounts);
    if (isInitialLoadDone) {
      syncToApi('discounts', discounts);
    }
  }, [discounts, isInitialLoadDone]);

  useEffect(() => {
    safeSaveToLocalStorage('ps_custom_pages', customPages);
    if (isInitialLoadDone) {
      syncToApi('custompages', customPages);
    }
  }, [customPages, isInitialLoadDone]);

  useEffect(() => {
    safeSaveToLocalStorage('ps_blogs', blogs);
    if (isInitialLoadDone) {
      syncToApi('blogs', blogs);
    }
  }, [blogs, isInitialLoadDone]);

  useEffect(() => {
    safeSaveToLocalStorage('ps_cart', cartItems);
  }, [cartItems]);

  useEffect(() => {
    safeSaveToLocalStorage('ps_logged_in_customer', loggedInCustomer);
    if (loggedInCustomer) {
      // Auto-update to new format if missing or old format
      const hasOldFormat = loggedInCustomer.referralCode && !loggedInCustomer.referralCode.startsWith("REF-PS-");
      if (!loggedInCustomer.referralCode || hasOldFormat) {
        const codeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const cleanFirstName = loggedInCustomer.name.trim().split(" ")[0].replace(/[^a-zA-Z]/g, "").toUpperCase() || "USER";
        const newReferralCode = `REF-PS-${cleanFirstName}-${codeSuffix}`;
        
        const updated = {
          ...loggedInCustomer,
          referralCode: newReferralCode
        };
        setLoggedInCustomer(updated);
        return;
      }

      // Keep customer object in the master listing synced as well, adding them if they do not exist
      setCustomers(prev => {
        const exists = prev.some(c => c.id === loggedInCustomer.id || c.email.toLowerCase() === loggedInCustomer.email.toLowerCase());
        if (exists) {
          return prev.map(c => (c.id === loggedInCustomer.id || c.email.toLowerCase() === loggedInCustomer.email.toLowerCase()) ? { ...c, ...loggedInCustomer } : c);
        } else {
          return [...prev, loggedInCustomer];
        }
      });
      // Klaviyo profile integration
      klaviyoIdentify(loggedInCustomer);
    } else {
      klaviyoReset();
    }
  }, [loggedInCustomer]);

  // Keep loggedInCustomer in sync with any updates in the master customers database list (e.g. referral rewards)
  useEffect(() => {
    if (loggedInCustomer && isInitialLoadDone) {
      const fresh = customers.find(c => c.id === loggedInCustomer.id || c.email.toLowerCase() === loggedInCustomer.email.toLowerCase());
      if (fresh) {
        const hasDiff = 
          fresh.storeCredit !== loggedInCustomer.storeCredit ||
          fresh.referralCode !== loggedInCustomer.referralCode ||
          fresh.ordersCount !== loggedInCustomer.ordersCount ||
          fresh.amountSpent !== loggedInCustomer.amountSpent ||
          fresh.subscriptionStatus !== loggedInCustomer.subscriptionStatus ||
          JSON.stringify(fresh.wishlist || []) !== JSON.stringify(loggedInCustomer.wishlist || []);
        if (hasDiff) {
          console.log(`[Sync Engine] Synchronizing loggedInCustomer state with master customers list. Store credit: ₹${fresh.storeCredit}`);
          setLoggedInCustomer(fresh);
        }
      }
    }
  }, [customers, isInitialLoadDone]);

  // Initialize Klaviyo script on mount and when Company ID / Public Key changes
  useEffect(() => {
    if (layoutSettings.klaviyoPublicKey) {
      initKlaviyo(layoutSettings.klaviyoPublicKey);
    } else {
      initializeKlaviyo();
    }
  }, [layoutSettings.klaviyoPublicKey]);

  // Track "Viewed Product" in Klaviyo
  useEffect(() => {
    if (currentTab === 'product-detail' && selectedProductId) {
      const product = productsState.find(p => p.id === selectedProductId);
      if (product) {
        klaviyoTrackViewedProduct(product);
      }
    }
  }, [currentTab, selectedProductId, productsState]);

  // Synchronize customers list with any completed order records automatically
  useEffect(() => {
    if (!isInitialLoadDone) return;

    setCustomers(prevCustomers => {
      let changed = false;
      const updatedCustomers = prevCustomers.map(cust => {
        if (!cust || !cust.email) return cust;
        const emailLower = cust.email.toLowerCase();
        const custOrders = orders.filter(o => o && o.customerEmail && o.customerEmail.toLowerCase() === emailLower);
        const actualOrdersCount = custOrders.length;
        const actualAmountSpent = custOrders.reduce((sum, o) => sum + (o.paymentStatus === 'Failed' ? 0 : o.total), 0);
        
        // Collect any unique non-placeholder destinations from their orders
        const orderAddresses = custOrders
          .map(o => (o.destination || '').trim())
          .filter(dest => dest && dest !== "100 Main Street, New York, NY, 10001");
        
        // Merge with existing addresses
        const existingAddresses = cust.addresses || [];
        const mergedAddresses = Array.from(new Set([...existingAddresses, ...orderAddresses]))
          .filter(addr => addr !== "100 Main Street, New York, NY, 10001");

        const addressesChanged = JSON.stringify(cust.addresses) !== JSON.stringify(mergedAddresses);
        if (
          cust.ordersCount !== actualOrdersCount ||
          Math.abs((cust.amountSpent || 0) - actualAmountSpent) > 0.01 ||
          addressesChanged
        ) {
          changed = true;
          return {
            ...cust,
            ordersCount: actualOrdersCount,
            amountSpent: actualAmountSpent,
            addresses: mergedAddresses
          };
        }
        return cust;
      });

      // Find any emails in orders that do not exist in customers list
      const existingEmails = new Set(prevCustomers.filter(c => c && c.email).map(c => c.email.toLowerCase()));
      const newCustomersToAdd: Customer[] = [];

      orders.forEach(order => {
        if (!order || !order.customerEmail) return;
        const emailLower = order.customerEmail.toLowerCase();
        if (emailLower && !existingEmails.has(emailLower)) {
          // Construct customer object from this order
          const custOrders = orders.filter(o => o && o.customerEmail && o.customerEmail.toLowerCase() === emailLower);
          const actualOrdersCount = custOrders.length;
          const actualAmountSpent = custOrders.reduce((sum, o) => sum + (o.paymentStatus === 'Failed' ? 0 : o.total), 0);
          
          const orderAddresses = custOrders
            .map(o => o.destination.trim())
            .filter(dest => dest && dest !== "100 Main Street, New York, NY, 10001");
          const uniqueAddresses = Array.from(new Set(orderAddresses)) as string[];

          const cleanName = order.customerName || emailLower.split('@')[0];

          newCustomersToAdd.push({
            id: `cust-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: cleanName,
            email: order.customerEmail.toLowerCase().trim(),
            subscriptionStatus: 'Not subscribed',
            location: order.destination || 'United Kingdom',
            ordersCount: actualOrdersCount,
            amountSpent: actualAmountSpent,
            addresses: uniqueAddresses,
            wishlist: []
          });

          // Prevent duplicates if multiple orders for this email are processed in the same loop
          existingEmails.add(emailLower);
          changed = true;
        }
      });

      if (changed) {
        return [...updatedCustomers, ...newCustomersToAdd];
      }
      return prevCustomers;
    });
  }, [orders, isInitialLoadDone]);

  // --- Cart actions handlers ---
  const handleAddToCart = (product: Product, quantity: number) => {
    setCartItems(prev => {
      const idx = prev.findIndex(item => item.productId === product.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].quantity += quantity;
        return copy;
      } else {
        return [...prev, {
          productId: product.id,
          productTitle: product.title,
          price: product.price,
          image: product.image,
          quantity,
          vendor: product.vendor
        }];
      }
    });
    setCartOpen(true);
    // Track in Klaviyo
    klaviyoTrackAddedToCart(product, quantity);
  };

  const handleUpdateCartQty = (productId: string, action: 'inc' | 'dec') => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const newQty = action === 'inc' ? item.quantity + 1 : item.quantity - 1;
          return { ...item, quantity: Math.max(newQty, 1) };
        }
        return item;
      });
    });
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.productId !== productId));
  };

  // --- Wishlist handlers ---
  const handleToggleWishlist = (productId: string) => {
    if (!loggedInCustomer) return;
    let nextWishlist: string[] = [];
    setLoggedInCustomer(prev => {
      if (!prev) return null;
      const copy = { ...prev };
      const list = Array.isArray(copy.wishlist) ? copy.wishlist : [];
      if (list.includes(productId)) {
        nextWishlist = list.filter(id => id !== productId);
      } else {
        nextWishlist = [...list, productId];
      }
      copy.wishlist = nextWishlist;
      return copy;
    });

    setCustomers(prevCusts => prevCusts.map(c => {
      if (c.id === loggedInCustomer.id || c.email.toLowerCase() === loggedInCustomer.email.toLowerCase()) {
        const list = Array.isArray(c.wishlist) ? c.wishlist : [];
        const updatedList = list.includes(productId) ? list.filter(id => id !== productId) : [...list, productId];
        return { ...c, wishlist: updatedList };
      }
      return c;
    }));
  };

  const handleUpdateWishlistAction = (productId: string, action: 'add' | 'remove') => {
    if (!loggedInCustomer) return;
    setLoggedInCustomer(prev => {
      if (!prev) return null;
      const copy = { ...prev };
      const list = Array.isArray(copy.wishlist) ? copy.wishlist : [];
      if (action === 'remove') {
        copy.wishlist = list.filter(id => id !== productId);
      } else if (!list.includes(productId)) {
        copy.wishlist = [...list, productId];
      }
      return copy;
    });

    setCustomers(prevCusts => prevCusts.map(c => {
      if (c.id === loggedInCustomer.id || c.email.toLowerCase() === loggedInCustomer.email.toLowerCase()) {
        const list = Array.isArray(c.wishlist) ? c.wishlist : [];
        let updatedList = list;
        if (action === 'remove') {
          updatedList = list.filter(id => id !== productId);
        } else if (!list.includes(productId)) {
          updatedList = [...list, productId];
        }
        return { ...c, wishlist: updatedList };
      }
      return c;
    }));
  };

  // --- Customer login and details update ---
  const handleCustomerLogin = (customer: Customer) => {
    setLoggedInCustomer(customer);
  };

  const handleCustomerLogout = () => {
    setLoggedInCustomer(null);
    clearCustomerToken();
  };

  const handleUpdateProfile = (updated: Customer) => {
    setLoggedInCustomer(updated);
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
    // Persist to Neon PostgreSQL / server database
    fetch('/api/customers/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer: updated })
    }).catch(err => {
      console.warn('[handleUpdateProfile] Background profile sync warn:', err);
    });
  };

  const handleUpdateOrder = (updated: Order) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
  };

  const handleAddAddress = (address: string) => {
    if (!loggedInCustomer) return;
    setLoggedInCustomer(prev => {
      if (!prev) return null;
      // Filter out any default placeholder addresses if the customer adds a proper one
      const filtered = prev.addresses.filter(addr => addr !== "100 Main Street, New York, NY, 10001");
      return {
        ...prev,
        addresses: [...filtered, address]
      };
    });
  };

  const handleRemoveAddress = (index: number) => {
    if (!loggedInCustomer) return;
    setLoggedInCustomer(prev => {
      if (!prev) return null;
      return {
        ...prev,
        addresses: prev.addresses.filter((_, idx) => idx !== index)
      };
    });
  };

  // --- Checkout sequence logic ---
  const handleTriggerCheckout = (discountApplied: Discount | null, finalTotal: number) => {
    setCheckoutDiscount(discountApplied);
    setCheckoutTotal(finalTotal);
    setCartOpen(false);
    navigateToTab('frontend-checkout');

    // Track Started Checkout in Klaviyo
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountAmount = Math.max(0, subtotal - finalTotal);
    klaviyoTrackStartedCheckout(cartItems, subtotal, discountAmount);
  };

  const handleCompleteCheckout = (paymentDetails: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    address: string;
    total: number;
    discountApplied: Discount | null;
    items: { productId: string; productTitle: string; price: number; quantity: number; image?: string; }[];
    paymentTxId?: string;
    paymentAuthCode?: string;
    cardBrand: string;
    storeCreditApplied?: number;
  }) => {
    // The server has already recorded this order (after verifying the payment
    // with the gateway), sent the confirmation email and spent any store credit.
    // This only reflects the result on screen.
    const newOrder: Order = {
      id: paymentDetails.orderId,
      customerName: paymentDetails.customerName,
      customerEmail: paymentDetails.customerEmail,
      tags: paymentDetails.discountApplied ? ['coupon', paymentDetails.discountApplied.title] : [],
      fulfillmentStatus: 'Unfulfilled',
      paymentStatus: 'Paid',
      gatewayTxId: (paymentDetails as any).gatewayTxId || paymentDetails.paymentTxId || '',
      gatewayAuthCode: (paymentDetails as any).gatewayAuthCode || paymentDetails.paymentAuthCode || '',
      cardBrand: paymentDetails.cardBrand,
      total: paymentDetails.total,
      destination: paymentDetails.address,
      date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      deliveryMethod: 'Standard Delivery',
      items: paymentDetails.items
    };

    setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);

    if (loggedInCustomer) {
      const creditUsed = paymentDetails.storeCreditApplied || 0;
      setLoggedInCustomer({
        ...loggedInCustomer,
        ordersCount: loggedInCustomer.ordersCount + 1,
        amountSpent: loggedInCustomer.amountSpent + paymentDetails.total,
        storeCredit: Math.max(0, (loggedInCustomer.storeCredit || 0) - creditUsed)
      });
    }

    klaviyoTrackPlacedOrder(
      paymentDetails.orderId,
      paymentDetails.items || cartItems,
      paymentDetails.total,
      paymentDetails.discountApplied ? paymentDetails.discountApplied.title : '',
      paymentDetails.customerEmail,
      paymentDetails.customerName,
      paymentDetails.address
    );

    setCartItems([]);
    setCartOpen(false);
  };

  const handleConfirmWithdrawal = (orderId: string, email: string, name: string, selectedItems: string[]) => {
    // The request itself is recorded by the server before this runs (see
    // POST /api/orders/withdrawal); this only brings any copy of the order the
    // app is already holding into line with it.
    //
    // It used to set paymentStatus: 'Refunded' here, in React state alone. That
    // told the customer and the shop the money had been returned when nothing
    // had been saved, nobody had been told and no refund had been made. A
    // withdrawal is a REQUEST; an administrator processes the refund.
    setOrders(prevOrders => {
      return prevOrders.map(o => {
        if (o.id === orderId) {
          const currentTags = Array.isArray(o.tags) ? [...o.tags] : [];
          if (!currentTags.includes('Withdrawal Requested')) {
            currentTags.push('Withdrawal Requested');
          }
          return { ...o, tags: currentTags };
        }
        return o;
      });
    });

    // Confirmation to the customer is sent by the server, to the address on the
    // order. This used to build its own HTML receipt here — branded for another
    // shop entirely ("PerfumeSampler") — and then fire /api/email/send-trigger
    // with type 'order_processing', so the customer got a second, unrelated
    // email about their order being processed. Both are gone; only the on-screen
    // acknowledgement is raised here.
    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder) {
      const withdrawnProducts = (targetOrder.items || []).filter(i => selectedItems.includes(i.productId));
      const totalRefund = withdrawnProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      setEmailToast({
        to: targetOrder.customerEmail,
        subject: `Order Withdrawal Requested - #${orderId}`,
        refund: totalRefund
      });
    }
  };

  /*
    The coming-soon gate.

    Checked before anything of the storefront renders, and deliberately NOT
    applied to /admin-dashboard: the dashboard is where the lock is turned off,
    so gating it would make locking yourself out unrecoverable.

    This hides the shop from visitors; it is not a security boundary. The pages
    and the public API are still served to anyone who asks for them directly.
    Vercel's Deployment Protection is the tool for genuinely sealing a site.
  */
  if (siteGate?.mode === 'password' && !hasSitePass && !isAdminActive) {
    return (
      <ComingSoon
        headline={siteGate.headline}
        message={siteGate.message}
        onUnlock={unlockSite}
      />
    );
  }

  if (!isInitialLoadDone) {
    return (
      <div className="min-h-screen bg-[#f6f6f7] flex flex-col items-center justify-center p-6 select-none" id="app-loading-state">
        <div className="space-y-6 max-w-md w-full text-center flex flex-col items-center animate-fade-in">
          {/* Header Logo */}
          <div className="flex items-center justify-center">
            {layoutSettings?.headerLogoImage ? (
              <img 
                src={cleanMediaUrl(layoutSettings.headerLogoImage)} 
                className="max-h-16 max-w-[220px] object-contain rounded-lg" 
                alt={layoutSettings?.headerLogoText || 'Ecommerce Store'} 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex items-center gap-3 bg-white px-5 py-3.5 rounded-2xl shadow-sm border border-slate-200/80">
                <div className="w-10 h-10 bg-gradient-to-tr from-[#008060] to-[#00a880] rounded-xl flex items-center justify-center shadow-sm">
                  <div className="w-4.5 h-4.5 border-2 border-white rounded-md"></div>
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-extrabold text-[#1a1c1d] tracking-tight text-xl leading-none">
                    {layoutSettings?.headerLogoText || 'Ecommerce Store'}
                  </span>
                  <span className="text-[9px] text-[#707579] font-extrabold uppercase tracking-widest mt-1">
                    {layoutSettings?.headerLogoSubtext || 'Womenswear'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Loading Button Below Logo */}
          <div className="flex items-center gap-2.5 px-6 py-2.5 bg-white border border-slate-200 shadow-2xs rounded-full text-slate-700 text-xs font-black uppercase tracking-wider">
            <span className="w-4 h-4 border-2 border-[#008060] border-t-transparent rounded-full animate-spin shrink-0"></span>
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f6f7] text-slate-800 flex flex-col font-sans">
      
      {isDbOffline && !isAdminActive && (
        <div className="bg-amber-600 text-white px-4 py-2.5 text-center text-[11px] font-bold flex flex-col sm:flex-row items-center justify-center gap-2 relative z-50 shadow-md">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white animate-ping shrink-0" />
            <span>⚠️ Neon PostgreSQL Database Not Configured / Offline:</span>
          </div>
          <span className="opacity-95">To persist changes permanently across sessions, configure your DATABASE_URL in the Admin Portal.</span>
          <button 
            type="button"
            onClick={() => setIsAdminActive(true)}
            className="underline hover:text-slate-100 font-black cursor-pointer text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded border border-white/30 hover:border-white transition-colors shrink-0"
          >
            Open Portal
          </button>
        </div>
      )}

      {/* Universal header layout */}
      {!isAdminActive && (
        <Header
          currentTab={currentTab}
          onTabChange={(tab) => {
            if (isAdminDirty) {
              setPendingNavAction({ type: 'change-tab', payload: tab });
              setShowUnsavedModal(true);
            } else {
              navigateToTab(tab);
            }
          }}
          loggedInCustomer={loggedInCustomer}
          cartItems={cartItems}
          onOpenCart={() => setCartOpen(true)}
          onOpenCustomer={() => {
            setCustomerDrawerTab('orders');
            setCustomerDrawerOpen(true);
          }}
          onOpenWishlist={() => {
            setCustomerDrawerTab('wishlist');
            setCustomerDrawerOpen(true);
          }}
          onOpenAdmin={() => {
            if (isAdminActive && isAdminDirty) {
              setPendingNavAction({ type: 'toggle-admin' });
              setShowUnsavedModal(true);
            } else {
              setIsAdminActive(!isAdminActive);
            }
          }}
          isAdminActive={isAdminActive}
          allProducts={products}
          allCollections={collections}
          onNavigateDetail={navigateToTab}
          layoutSettings={layoutSettings}
        />
      )}

      {/* Primary view content sandbox */}
      <main className="flex-1">
        {isAdminActive ? (
          !isAdminAuthenticated ? (
            <AdminLogin
              onLoginSuccess={() => {
                // A fresh token: re-arm the one-shot expiry notice so the next
                // expiry is announced too, and clear any notice still on screen.
                resetAdminSessionExpiryNotice();
                setAdminSessionExpired(null);
                setIsAdminAuthenticated(true);
                sessionStorage.setItem('ps_admin_authenticated', 'true');
              }}
              onCancel={() => {
                setIsAdminActive(false);
              }}
            />
          ) : (
            /* VIEW 1: ADMIN REPLICA DASHBOARD */
            <AdminDashboard
              products={products}
              onUpdateProducts={setProducts}
              collections={collections}
              onUpdateCollections={setCollections}
              orders={orders}
              onUpdateOrders={setOrders}
              files={files}
              onUpdateFiles={setFiles}
              customers={customers}
              onUpdateCustomers={setCustomers}
              discounts={discounts}
              onUpdateDiscounts={setDiscounts}
              customPages={customPages}
              onUpdateCustomPages={setCustomPages}
              blogs={blogs}
              onUpdateBlogs={setBlogs}
              layoutSettings={layoutSettings}
              onUpdateLayoutSettings={handleUpdateLayoutSettings}
              devSettings={devSettings}
              onUpdateDevSettings={handleUpdateDevSettings}
              onDirtyChange={setIsAdminDirty}
              adminActionTrigger={adminActionTrigger}
              onAdminActionComplete={(actionHandled) => {
                setIsAdminDirty(false);
                setAdminActionTrigger(null);
                setShowUnsavedModal(false);

                if (pendingNavAction) {
                  if (pendingNavAction.type === 'toggle-admin') {
                    setIsAdminActive(!isAdminActive);
                  } else if (pendingNavAction.type === 'change-tab' && pendingNavAction.payload) {
                    const tab = pendingNavAction.payload;
                    navigateToTab(tab);
                  }
                  setPendingNavAction(null);
                }
              }}
              onExitAdmin={() => {
                if (isAdminDirty) {
                  setPendingNavAction({ type: 'toggle-admin' });
                  setShowUnsavedModal(true);
                } else {
                  setIsAdminActive(false);
                }
              }}
              onLogoutAdmin={() => {
                setIsAdminAuthenticated(false);
                sessionStorage.removeItem('ps_admin_authenticated');
                clearAdminToken();
                resetAdminSessionExpiryNotice();
                setAdminSessionExpired(null);
                setIsAdminActive(false);
              }}
            />
          )
        ) : (
          
          /* VIEW 2: FRONTEND VIEW NAVIGATION */
          <>
            {/* FRONTEND VIEW - HOME */}
            {currentTab === 'frontend-home' && (() => {
              // The theme home page is the default. An admin can switch the home
              // page to one built in the Page Builder (Header & Footer settings).
              const useBuilderHome = layoutSettings?.homepageSource === 'page-builder';
              const hp = useBuilderHome
                ? customPages.find(p => p.isHomepage || p.slug === '' || p.slug === 'home' || p.slug === 'homepage' || p.id === 'homepage' || p.id === 'page-home')
                : null;
              if (hp) {
                return (
                  <PageRenderer
                    page={hp}
                    allProducts={products}
                    allCollections={collections}
                    loggedInCustomer={loggedInCustomer}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    allBlogs={blogs}
                    onNavigate={handlePageRendererNavigate}
                  />
                );
              }
              return (
                <FashionHome
                  products={products}
                  collections={collections}
                  customer={loggedInCustomer}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                  navigate={navigateToTab}
                />
              );
            })()}

            {/* FRONTEND VIEW - CUSTOMIZABLE BUILDER SUBPAGES */}
            {customPages.some(p => {
              if (!p || p.isHomepage) return false;
              const cleanTab = currentTab.replace(/^\/pages\//, '').replace(/^pages\//, '').replace(/^page-/, '');
              return p.slug === currentTab || p.id === currentTab || p.slug === cleanTab || p.id === cleanTab;
            }) && (() => {
              const cleanTab = currentTab.replace(/^\/pages\//, '').replace(/^pages\//, '').replace(/^page-/, '');
              const matchedPage = customPages.find(p => p && !p.isHomepage && (p.slug === currentTab || p.id === currentTab || p.slug === cleanTab || p.id === cleanTab));
              if (!matchedPage) return null;
              return (
                <PageRenderer 
                  page={matchedPage} 
                  allProducts={products}
                  allCollections={collections}
                  loggedInCustomer={loggedInCustomer}
                  onAddToCart={handleAddToCart} 
                  onToggleWishlist={handleToggleWishlist}
                  allBlogs={blogs}
                  onNavigate={handlePageRendererNavigate} 
                />
              );
            })()}

            {/* FRONTEND VIEW - PRODUCT DETAIL PAGE */}
            {currentTab === 'product-detail' && (() => {
              const matchedProduct = products.find(p => p.id === selectedProductId || p.slug === selectedProductId || slugify(p.title) === selectedProductId);
              if (!matchedProduct) {
                return (
                  <div className="max-w-6xl mx-auto py-24 px-4 text-center space-y-6">
                    <span className="text-7xl block">🔍</span>
                    <div className="space-y-1.5">
                      <span className="text-[10px] bg-red-100 text-red-700 font-extrabold py-1 px-3 rounded-full uppercase tracking-widest inline-block">
                        Error 404 - Product Not Found
                      </span>
                      <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Product Not Found</h1>
                    </div>
                    <p className="text-slate-500 max-w-sm mx-auto text-xs leading-relaxed">
                      We couldn't find that product. It may have sold out or been removed.
                    </p>
                    <button
                      onClick={() => navigateToTab('frontend-shop')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-8 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-xs"
                    >
                      Back to Catalog
                    </button>
                  </div>
                );
              }
              return (
                <ProductDetailView
                  product={matchedProduct}
                  allProducts={products}
                  loggedInCustomer={loggedInCustomer}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                  onNavigate={(target, arg) => {
                    if (target === 'product-detail' && arg) {
                      navigateToTab('product-detail', arg);
                    } else if (target === 'collection-detail' && arg) {
                      navigateToTab('collection-detail', undefined, arg);
                    } else {
                      navigateToTab(target);
                    }
                  }}
                />
              );
            })()}

            {/* FRONTEND VIEW - COLLECTION DETAIL PAGE */}
            {currentTab === 'collection-detail' && (() => {
              const matchedCollection = collections.find(c => c.id === activeCollectionId || c.slug === activeCollectionId || slugify(c.title) === activeCollectionId);
              if (!matchedCollection) {
                return (
                  <div className="max-w-6xl mx-auto py-24 px-4 text-center space-y-6">
                    <span className="text-7xl block">📦</span>
                    <div className="space-y-1.5">
                      <span className="text-[10px] bg-red-100 text-red-700 font-extrabold py-1 px-3 rounded-full uppercase tracking-widest inline-block">
                        Error 404 - Collection Not Found
                      </span>
                      <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Collection Not Found</h1>
                    </div>
                    <p className="text-slate-500 max-w-sm mx-auto text-xs leading-relaxed">
                      The curated collection category you requested doesn't exist, or has been unregistered from the vendor portfolio.
                    </p>
                    <button
                      onClick={() => navigateToTab('frontend-shop')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-8 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-xs"
                    >
                      Back to Catalog
                    </button>
                  </div>
                );
              }
              return (
                <CollectionDetailView
                  collection={matchedCollection}
                  allProducts={products}
                  loggedInCustomer={loggedInCustomer}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                  onNavigate={(target, arg) => {
                    if (arg) {
                      navigateToTab('product-detail', arg);
                    } else {
                      navigateToTab(target);
                    }
                  }}
                />
              );
            })()}

            {/* FRONTEND VIEW - SHOP/CATALOG */}
            {currentTab === 'frontend-shop' && (
              <ProductsGrid
                products={products}
                collections={collections}
                activeCollectionId={activeCollectionId}
                onActiveCollectionChange={setActiveCollectionId}
                loggedInCustomer={loggedInCustomer}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={handleAddToCart}
                onOpenLoginModal={() => navigateToTab('frontend-account')}
              />
            )}

            {/* FRONTEND VIEW - BRANDS DIRECTORY */}
            {currentTab === 'frontend-brands' && (() => {
              const matchedPage = customPages.find(p => p.slug === 'brands');
              const hasBrandListSection = matchedPage?.sections?.some(s => s.type === 'Brand list' || s.type === 'Brands we offer');
              return (
                <div>
                  {matchedPage && (
                    <PageRenderer 
                      page={matchedPage} 
                      allProducts={products}
                      allCollections={collections}
                      loggedInCustomer={loggedInCustomer}
                      onAddToCart={handleAddToCart} 
                      onToggleWishlist={handleToggleWishlist}
                      allBlogs={blogs}
                      onNavigate={handlePageRendererNavigate}
                    />
                  )}
                  {!hasBrandListSection && (
                    <BrandList
                      collections={collections}
                      onBrandClick={(colId) => {
                        navigateToTab('collection-detail', undefined, colId);
                      }}
                    />
                  )}
                </div>
              );
            })()}

            {/* FRONTEND VIEW - CUSTOMER ACCOUNT */}
            {currentTab === 'frontend-account' && (
              <CustomerAccount
                customers={customers}
                loggedInCustomer={loggedInCustomer}
                onLogin={handleCustomerLogin}
                onLogout={handleCustomerLogout}
                onUpdateWishlist={handleUpdateWishlistAction}
                allProducts={products}
                orders={orders}
                onAddAddress={handleAddAddress}
                onRemoveAddress={handleRemoveAddress}
                onUpdateProfile={handleUpdateProfile}
                onUpdateOrder={handleUpdateOrder}
                discounts={discounts}
                onAddToCart={handleAddToCart}
                onOpenCart={() => setCartOpen(true)}
                onNavigate={navigateToTab}
              />
            )}

            {/* FRONTEND VIEW - SECURE CHECKOUT */}
            {currentTab === 'frontend-checkout' && (
              <CheckoutView
                cartItems={cartItems}
                discountApplied={checkoutDiscount}
                totalAmount={checkoutTotal}
                loggedInCustomer={loggedInCustomer}
                onNavigate={navigateToTab}
                onCompleteCheckout={handleCompleteCheckout}
                activeDiscounts={discounts}
                customers={customers}
                products={products}
                collections={collections}
                onApplyDiscount={setCheckoutDiscount}
              />
            )}

            {/* FRONTEND VIEW - CURATED STORES BLOG/MAGAZINE HUB */}
            {currentTab === 'blogs' && (() => {
              const activeBlogs = blogs.filter(b => b.status === 'Active');
              
              // Filter active articles by query & category
              const filteredFrontBlogs = activeBlogs.filter(blog => {
                const matchesQuery = blog.title.toLowerCase().includes(frontendBlogQuery.toLowerCase()) || 
                                     blog.excerpt.toLowerCase().includes(frontendBlogQuery.toLowerCase()) ||
                                     blog.tags.some(t => t.toLowerCase().includes(frontendBlogQuery.toLowerCase()));
                const matchesCategory = selectedFrontCategory === 'All' || blog.category === selectedFrontCategory;
                return matchesQuery && matchesCategory;
              });

              const featuredBlog = activeBlogs[0]; // Take latest active blog as hero header article

              return (
                <div className="bg-slate-50 min-h-screen">
                  
                  {/* Hero Banner Header */}
                  <div className="bg-slate-900 text-white relative py-8 px-4 overflow-hidden">
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-slate-200 via-slate-900 to-black pointer-events-none" />
                    <div className="max-w-6xl mx-auto space-y-4 relative z-10 text-center sm:text-left">
                      <span className="text-[10px] bg-slate-800 text-slate-300 font-extrabold uppercase tracking-widest py-1.5 px-3 rounded-full border border-slate-700">
                        Editorial & Education
                      </span>
                      <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">The Style Journal</h1>
                      <p className="text-slate-400 max-w-lg text-xs sm:text-sm leading-relaxed">
                        Fascinating breakdowns, organic chemistry, clinical guides, and strategic brand reviews compiled by industry clinicians.
                      </p>
                    </div>
                  </div>

                  {/* Filter Toolbar & Category Chips */}
                  <div className="max-w-6xl mx-auto py-8 px-4">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white border p-4 rounded-2xl shadow-xs">
                      
                      {/* Search Bar */}
                      <div className="relative w-full md:w-80">
                        <input
                          type="text"
                          placeholder="Search articles & themes..."
                          value={frontendBlogQuery}
                          onChange={(e) => setFrontendBlogQuery(e.target.value)}
                          className="w-full text-xs p-2.5 pb-2.5 pl-9 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-500 bg-slate-50"
                        />
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      </div>

                      {/* Categories chips list */}
                      <div className="flex flex-wrap gap-1.5 w-full md:w-auto overflow-x-auto scrollbar-none">
                        {['All', 'Chemistry & Science', 'Buying Guides', 'Tips & Hacks', 'Industry Trends', 'General'].map(cat => (
                          <button
                            key={cat}
                            onClick={() => setSelectedFrontCategory(cat)}
                            className={`text-[10px] font-black uppercase tracking-wider px-3.5 py-2.5 rounded-full border transition cursor-pointer shrink-0 ${
                              selectedFrontCategory === cat 
                                ? 'bg-slate-900 border-slate-900 text-white shadow-xs' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                    </div>

                    {/* Featured Article Hero Panel (if matches 'All' or matches its category, and not searching) */}
                    {featuredBlog && !frontendBlogQuery && selectedFrontCategory === 'All' && (
                      <div className="mt-10 bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-12 hover:shadow-md transition duration-350 group">
                        
                        <div className="lg:col-span-7 h-64 sm:h-96 overflow-hidden relative border-b lg:border-b-0 lg:border-r">
                          <img 
                            src={featuredBlog.image} 
                            alt={featuredBlog.title} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103" 
                          />
                          <span className="absolute top-4 left-4 bg-slate-900 text-white font-extrabold text-[9px] uppercase px-3 py-1 rounded-full shadow-md tracking-wider">
                            Latest Article
                          </span>
                        </div>

                        <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-6 text-left">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                                {featuredBlog.category}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">{featuredBlog.publishedAt}</span>
                            </div>

                            <h2 
                              onClick={() => navigateToTab('blog-detail', featuredBlog.slug)}
                              className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight hover:text-indigo-650 transition cursor-pointer"
                            >
                              {featuredBlog.title}
                            </h2>

                            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{featuredBlog.excerpt}</p>
                            
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {featuredBlog.tags.map((t, idx) => (
                                <span key={idx} className="bg-slate-50 text-[10px] text-slate-500 rounded px-2 py-0.5 border">#{t}</span>
                              ))}
                            </div>
                          </div>

                          <div className="pt-6 border-t flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-xs uppercase shadow-sm">
                                {featuredBlog.author ? featuredBlog.author.charAt(0) : 'A'}
                              </div>
                              <div>
                                <h5 className="text-[11px] font-black text-slate-800">{featuredBlog.author || 'The Style Desk'}</h5>
                                <p className="text-[9px] text-slate-400">{featuredBlog.readTime || '5 min read'}</p>
                              </div>
                            </div>

                            <button 
                              onClick={() => navigateToTab('blog-detail', featuredBlog.slug)}
                              className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-4 rounded-xl cursor-pointer"
                            >
                              Read Full Story
                            </button>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Standard Search Results grid */}
                    <div className="mt-10 space-y-4">
                      {frontendBlogQuery || selectedFrontCategory !== 'All' ? (
                        <h3 className="text-xs text-slate-500 font-bold uppercase tracking-widest text-left">
                          Search found {filteredFrontBlogs.length} articles
                        </h3>
                      ) : (
                        <h3 className="text-xs text-slate-500 font-bold uppercase tracking-widest text-left mt-8 mb-6">
                          Recent Publications
                        </h3>
                      )}

                      {filteredFrontBlogs.length === 0 ? (
                        <div className="bg-white border rounded-2xl py-8 px-4 text-center space-y-4">
                          <span className="text-5xl block">🗒️</span>
                          <h4 className="font-bold text-slate-800 text-sm">No Publications Match Filter Criteria</h4>
                          <p className="text-slate-400 text-xs max-w-sm mx-auto">Try resetting categories or typing a different keyword to browse our research pouch index.</p>
                          <button
                            onClick={() => {
                              setFrontendBlogQuery('');
                              setSelectedFrontCategory('All');
                            }}
                            className="bg-slate-900 text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-xl cursor-pointer"
                          >
                            Reset Filters
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                          {filteredFrontBlogs.map(blog => (
                            <div 
                              key={blog.id} 
                              className="bg-white border border-slate-150 rounded-2xl overflow-hidden hover:shadow-md transition duration-300 flex flex-col group"
                            >
                              <div className="h-48 overflow-hidden relative shrink-0 border-b">
                                <img 
                                  src={blog.image} 
                                  alt={blog.title} 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102" 
                                />
                                <span className="absolute top-3 left-3 bg-white/95 text-slate-800 font-extrabold text-[9px] uppercase px-2.5 py-0.5 rounded shadow-sm border">
                                  {blog.category}
                                </span>
                              </div>

                              <div className="p-5 flex-1 flex flex-col justify-between space-y-5">
                                <div className="space-y-2.5">
                                  <span className="text-[9px] text-slate-400 font-semibold block">{blog.publishedAt}</span>
                                  
                                  <h4 
                                    onClick={() => navigateToTab('blog-detail', blog.slug)}
                                    className="text-sm font-black text-slate-900 group-hover:text-indigo-650 transition cursor-pointer line-clamp-2 leading-snug uppercase tracking-tight"
                                  >
                                    {blog.title}
                                  </h4>

                                  <p className="text-slate-500 text-xs line-clamp-3 leading-relaxed">{blog.excerpt}</p>
                                </div>

                                <div className="pt-4 border-t flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-black text-[9px] uppercase border">
                                      {blog.author ? blog.author.charAt(0) : 'A'}
                                    </div>
                                    <div>
                                      <h5 className="text-[9px] font-bold text-slate-700">{blog.author}</h5>
                                      <p className="text-[8px] text-slate-400 font-medium">{blog.readTime}</p>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => navigateToTab('blog-detail', blog.slug)}
                                    className="text-[10px] font-black text-slate-900 group-hover:text-indigo-650 flex items-center gap-1 transition cursor-pointer"
                                  >
                                    Read Article <ArrowRight className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              );
            })()}

            {/* FRONTEND VIEW - SINGLE EDITORIAL BLOG POST READER */}
            {currentTab === 'blog-detail' && (() => {
              const matchedBlog = blogs.find(b => b.slug === selectedBlogSlug);
              
              if (!matchedBlog) {
                return (
                  <div className="max-w-6xl mx-auto py-24 px-4 text-center space-y-6">
                    <span className="text-7xl block">📝</span>
                    <div className="space-y-1.5">
                      <span className="text-[10px] bg-red-100 text-red-700 font-extrabold py-1 px-3 rounded-full uppercase tracking-widest inline-block">
                        Error 404 - Article Not Found
                      </span>
                      <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Article Not Found</h1>
                    </div>
                    <p className="text-slate-500 max-w-sm mx-auto text-xs leading-relaxed">
                      This specific scientific or buying article does not exist, or has been temporarily unpublished by the store administrators.
                    </p>
                    <button
                      onClick={() => navigateToTab('blogs')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-8 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-xs"
                    >
                      View All Articles
                    </button>
                  </div>
                );
              }

              // Custom quick markdown paragraphs formatter helper
              const renderMarkdown = (text: string) => {
                if (!text) return null;
                return text.split('\n\n').map((paragraph, index) => {
                  const trimmed = paragraph.trim();
                  if (!trimmed) return null;

                  if (trimmed.startsWith('### ')) {
                    return <h3 key={index} className="text-sm sm:text-base font-black text-slate-900 mt-6 mb-3 uppercase tracking-tight">{trimmed.replace('### ', '')}</h3>;
                  }
                  if (trimmed.startsWith('## ')) {
                    return <h2 key={index} className="text-base sm:text-lg font-black text-slate-900 mt-8 mb-4 uppercase tracking-tight border-b-2 pb-2 border-slate-100">{trimmed.replace('## ', '')}</h2>;
                  }
                  if (trimmed.startsWith('# ')) {
                    return <h1 key={index} className="text-lg sm:text-2xl font-black text-slate-900 mt-10 mb-4 uppercase tracking-tight">{trimmed.replace('# ', '')}</h1>;
                  }
                  if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    const listItems = trimmed.split('\n').map(item => item.replace(/^[-*]\s+/, ''));
                    return (
                      <ul key={index} className="list-disc pl-5 my-3 text-slate-650 space-y-1.5">
                        {listItems.map((item, i) => (
                          <li key={i} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }} />
                        ))}
                      </ul>
                    );
                  }
                  
                  let cleanHTML = trimmed
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>');
                    
                  return (
                    <p 
                      key={index}
                      className="mb-4 text-xs sm:text-sm leading-relaxed text-slate-650"
                      dangerouslySetInnerHTML={{ __html: cleanHTML }}
                    />
                  );
                });
              };

              // Fetch 3 recent other articles
              const otherArticles = blogs
                .filter(b => b.status === 'Active' && b.id !== matchedBlog.id)
                .slice(0, 3);

              return (
                <div className="bg-slate-50 min-h-screen py-10 px-4">
                  <div className="max-w-4xl mx-auto">
                    
                    {/* Breadcrumbs */}
                    <button 
                      onClick={() => navigateToTab('blogs')}
                      className="text-slate-500 hover:text-slate-900 text-xs font-bold uppercase tracking-wider mb-8 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      ← Back to Journal Index
                    </button>

                    {/* Main White Reader Box Container */}
                    <article className="bg-white border rounded-3xl overflow-hidden shadow-xs text-left">
                      
                      {/* Image cover photo */}
                      <div className="h-64 sm:h-96 relative w-full">
                        <img 
                          src={matchedBlog.image} 
                          alt={matchedBlog.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none" />
                        <div className="absolute bottom-6 left-6 right-6 text-white text-left">
                          <span className="text-[9px] bg-indigo-650 text-white font-extrabold uppercase py-1 px-2.5 rounded-md border border-indigo-500 mr-3">
                            {matchedBlog.category}
                          </span>
                          <span className="text-xs text-slate-200 font-medium">{matchedBlog.publishedAt}</span>
                        </div>
                      </div>

                      {/* Post Header Meta details */}
                      <div className="p-6 sm:p-10 pb-4 border-b border-slate-100">
                        <h1 className="text-xl sm:text-3xl font-black text-slate-900 leading-tight uppercase tracking-tight">
                          {matchedBlog.title}
                        </h1>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs uppercase border shadow-xs">
                              {matchedBlog.author ? matchedBlog.author.charAt(0) : 'A'}
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-slate-800">{matchedBlog.author || 'Store Owner'}</h4>
                              <p className="text-[9px] text-slate-400">Published Article • {matchedBlog.readTime || '5 min read'}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {matchedBlog.tags.map((t, idx) => (
                              <span key={idx} className="bg-slate-50 text-[9px] text-slate-500 font-bold px-2 py-0.5 rounded border">#{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Excerpt spotlight */}
                      <div className="mx-6 sm:mx-10 mt-6 p-4 rounded-xl border-l-4 border-slate-900 bg-slate-50 text-xs sm:text-sm text-slate-650 font-medium leading-relaxed">
                        {matchedBlog.excerpt}
                      </div>

                      {/* Article Story Box */}
                      <div className="p-6 sm:p-10 pt-4">
                        {renderMarkdown(matchedBlog.content)}
                      </div>

                    </article>

                    {/* Footer Sidebar Relevant articles */}
                    {otherArticles.length > 0 && (
                      <div className="mt-14 space-y-6">
                        <div className="border-b pb-3 flex justify-between items-center text-left">
                          <h3 className="text-xs text-slate-500 font-black uppercase tracking-widest">More From The Journal</h3>
                          <button onClick={() => navigateToTab('blogs')} className="text-[10px] text-slate-800 font-black uppercase hover:underline">View All</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                          {otherArticles.map(blog => (
                            <div 
                              key={blog.id} 
                              onClick={() => navigateToTab('blog-detail', blog.slug)}
                              className="bg-white border rounded-xl overflow-hidden hover:shadow-sm cursor-pointer transition group"
                            >
                              <div className="h-32 overflow-hidden border-b relative">
                                <img src={blog.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102" alt="" referrerPolicy="no-referrer" />
                              </div>
                              <div className="p-4 space-y-2">
                                <span className="text-[9px] text-slate-400 font-bold block">{blog.publishedAt}</span>
                                <h4 className="text-xs font-black text-slate-800 group-hover:text-indigo-650 truncate uppercase tracking-tight">{blog.title}</h4>
                                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{blog.excerpt}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              );
            })()}

            {/* FRONTEND VIEW - PRIVACY POLICY */}
            {currentTab === 'privacy-policy' && (
              <PrivacyPolicy onNavigate={navigateToTab} />
            )}

            {/* FRONTEND VIEW - SHIPPING POLICY */}
            {currentTab === 'shipping-policy' && (
              <ShippingPolicy onNavigate={navigateToTab} />
            )}

            {/* FRONTEND VIEW - REFUND POLICY */}
            {currentTab === 'refund-policy' && (
              <RefundPolicy onNavigate={navigateToTab} />
            )}

            {/* FRONTEND VIEW - TERMS & CONDITIONS */}
            {currentTab === 'terms-conditions' && (
              <TermsConditions onNavigate={navigateToTab} />
            )}

            {/* FRONTEND VIEW - FOLDER STRUCTURE GENERATOR */}
            {(currentTab === 'folder-structure' || currentTab === 'pages/folder-structure' || currentTab === 'structure') && (
              <FolderStructureView />
            )}

            {/* FRONTEND VIEW - 404 NOT FOUND FOR NONEXISTENT PAGES */}
            {!['frontend-home', 'frontend-shop', 'frontend-brands', 'frontend-account', 'product-detail', 'collection-detail', 'blogs', 'blog-detail', 'privacy-policy', 'shipping-policy', 'refund-policy', 'terms-conditions', 'folder-structure', 'pages/folder-structure', 'structure', 'frontend-checkout'].includes(currentTab) && !customPages.some(p => p.slug === currentTab || p.id === currentTab || p.slug === currentTab.replace(/^page-/, '') || p.id === currentTab.replace(/^page-/, '')) && (
              <div className="max-w-6xl mx-auto py-24 px-4 text-center space-y-6">
                <span className="text-7xl block">🔍</span>
                <div className="space-y-1.5">
                  <span className="text-[10px] bg-red-100 text-red-700 font-extrabold py-1 px-3 rounded-full uppercase tracking-widest inline-block">
                    Error 404 - Page Not Found
                  </span>
                  <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">This page does not exist</h1>
                </div>
                <p className="text-slate-500 max-w-sm mx-auto text-xs leading-relaxed">
                  We searched far and wide, but the custom page or theme layout you linked doesn't exist inside our merchant records.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => navigateToTab('frontend-home')}
                    className="bg-slate-900 hover:bg-black text-white font-black py-3 px-6 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-xs"
                  >
                    Go Back Home
                  </button>
                  <button
                    onClick={() => navigateToTab('frontend-shop')}
                    className="bg-white border hover:bg-slate-50 text-slate-700 font-extrabold py-3 px-6 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Shop Now
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Global Shopping Cart slide out drawer panel */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        activeDiscounts={discounts}
        onTriggerCheckout={handleTriggerCheckout}
        products={products}
        collections={collections}
        customers={customers}
        loggedInCustomer={loggedInCustomer}
      />

      {/* Global Customer Dashboard slide out drawer panel */}
      <CustomerDrawer
        isOpen={customerDrawerOpen}
        onClose={() => setCustomerDrawerOpen(false)}
        customers={customers}
        loggedInCustomer={loggedInCustomer}
        onLogin={handleCustomerLogin}
        onLogout={handleCustomerLogout}
        onUpdateWishlist={handleUpdateWishlistAction}
        onAddToCart={handleAddToCart}
        allProducts={products}
        orders={orders}
        onAddAddress={handleAddAddress}
        onRemoveAddress={handleRemoveAddress}
        onOpenCart={() => setCartOpen(true)}
        initialTab={customerDrawerTab}
        onNavigateToPortal={() => {
          setCustomerDrawerOpen(false);
          navigateToTab('frontend-account');
        }}
      />

      {/* Checkout Successful Modal */}
      {checkoutSuccessful && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl relative">
            
            <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold animate-bounce mt-2">
              <Check className="h-8 w-8" />
            </div>

            <h2 className="text-xl font-black text-slate-850">Checkout Successful!</h2>
            <p className="text-xs text-slate-400">Order ID: <span className="font-mono font-bold text-slate-800">{checkoutSuccessful.id}</span></p>
            
            <div className="bg-slate-50 border p-4 rounded-xl text-left space-y-1 text-xs">
              <div className="flex justify-between font-bold text-slate-700">
                <span>Shipping Method</span>
                <span>Tracked courier courier</span>
              </div>
              <div className="flex justify-between font-bold text-slate-705 pt-2 border-t mt-2">
                <span>Charged Amount</span>
                <span className="text-emerald-700">₹{checkoutSuccessful.amount.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400">Your order has been registered in the database. You can track this order in your customer portal or fulfill it via the Admin Portal.</p>

            <button
              onClick={() => {
                setCheckoutSuccessful(null);
                navigateToTab('frontend-account');
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-lg cursor-pointer transition-colors"
            >
              Check My Orders History
            </button>
          </div>
        </div>
      )}

      {/* Unsaved Changes Confirmation Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-xl font-bold animate-pulse mt-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">You have unsaved changes.</h3>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                You modified content, settings, layout or sections inside the current session. Your updates will be lost if you leave without saving.
              </p>
            </div>

            <div className="space-y-2 pt-2 text-xs">
              <button
                onClick={() => {
                  setAdminActionTrigger({ action: 'save', timestamp: Date.now() });
                }}
                className="w-full bg-[#008060] hover:bg-[#006e52] text-white font-black py-2.5 rounded-xl uppercase tracking-widest transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </button>

              <button
                onClick={() => {
                  setAdminActionTrigger({ action: 'discard', timestamp: Date.now() });
                }}
                className="w-full bg-red-50 text-red-700 hover:bg-red-100 font-extrabold py-2.5 rounded-xl uppercase tracking-widest transition cursor-pointer border border-red-150"
              >
                Discard Changes
              </button>

              <button
                onClick={() => {
                  setShowUnsavedModal(false);
                  setPendingNavAction(null);
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold py-2 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Footer layout */}
      {!isAdminActive && !['frontend-checkout'].includes(currentTab) && (
        <Footer onNavigate={navigateToTab} layoutSettings={layoutSettings} />
      )}

      {/* The return/cancel form is opened from the footer's Help links
          (an "open-order-withdrawal" event) rather than a floating button that
          covered page content on mobile. */}
      <WithdrawalOpener onOpen={() => setIsWithdrawalOpen(true)} />

      {/* Order Withdrawal Modal popup */}
      <OrderWithdrawalModal
        isOpen={isWithdrawalOpen}
        onClose={() => setIsWithdrawalOpen(false)}
        orders={orders}
        onConfirmWithdrawal={handleConfirmWithdrawal}
      />

      {/* Shown over the dashboard once the admin session is no longer accepted.
          Rendered last so it sits above every other panel and modal. */}
      {adminSessionExpired && isAdminActive && (
        <AdminSessionExpiredModal
          reason={adminSessionExpired}
          onSignInAgain={signOutExpiredAdmin}
        />
      )}

      {/* Interactive Simulated Email Dispatch Toast */}
      <AnimatePresence>
        {emailToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 text-white border border-slate-700/80 p-4 rounded-2xl shadow-2xl flex gap-3.5 items-start font-sans"
          >
            <div className="p-2.5 bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl shrink-0 mt-0.5 animate-pulse">
              <Mail className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Email Notification Sent</span>
                <button 
                  onClick={() => setEmailToast(null)}
                  className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <h4 className="font-extrabold text-xs text-white mt-1">Order Withdrawal Confirmation</h4>
              <p className="text-[10.5px] text-slate-300 leading-normal mt-1">
                A confirmation email for refund value <strong>₹{emailToast.refund.toFixed(2)}</strong> has been sent to <strong>{emailToast.to}</strong>!
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setEmailToast(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold uppercase text-[8.5px] tracking-wider py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
