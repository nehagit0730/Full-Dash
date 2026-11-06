# Ecommerce platform transformation — plan and status

Status key: **Done** = implemented and tested · **Partial** = implemented, not fully testable here · **Planned** = not started · **Needs merchant** = waiting on real credentials or accounts.

## What the codebase actually is

- **Not Next.js.** Vite + React 19 SPA (`src/`), an Express API (`serverApp.ts`, `backend/routes`), Prisma 5 on Neon, deployed to Vercel as one serverless function (`api/index.js`). New server code follows the Express-router pattern, not Next.js Route Handlers.
- A UK-only, GBP, subscription-first nicotine-pouch store: UK postcode/phone validation (`src/utils/ukValidation.ts`), Royal Mail, Worldpay stored-card renewals, and subscription "plans/cans" logic all through checkout.
- Data is stored twice: typed Prisma tables plus `StoreResource` JSON blobs, merged on read (`serverDb.fetchResource`). Every new feature has to respect that.
- Baseline `tsc --noEmit` was clean (0 errors) and is still clean.

## Security defects found during inspection

| # | Defect | Status |
|---|--------|--------|
| 1 | `GET /api/layoutsettings` (public) returned the Cloudinary API secret | **Done**: secrets stripped for non-admins |
| 2 | `POST /api/orders/create` (public) accepted `paymentStatus`, totals and a `createdByAdmin` bypass flag, and upserted by id (could overwrite any order) | **Done**: anonymous callers limited to zero-total orders, no overwrites, no privileged flags |
| 3 | `POST /api/customers/update-profile` let a shopper set their own `storeCredit` (and auth fields) | **Done**: protected fields ignored for non-admins |
| 4 | Store credit was deducted by the browser, so it could be skipped | **Done**: deducted server-side, atomically (`/orders/create` and Worldpay confirmation) |
| 5 | `POST /api/send-order-confirmation` was an open email relay and sent duplicate confirmations | **Done**: no-op (server already sends confirmations) |
| 6 | `POST /api/email/send-trigger` was public | **Done**: admin-only |
| 7 | `POST /api/update-db-uri` rewrote `.env` with an untested URL | **Done**: off by default, needs password re-entry, validates the candidate DB first |
| 8 | **Worldpay charges the `amount` the browser sends**, so a shopper can pay £0.01 for any basket | **Planned (Phase 2)**: needs a server-side pricing engine |
| 9 | Age verification is client-side only; `/api/agechecked/approve` and `/api/agechecked/pass?email=…` mark anyone verified | **Planned (Phase 3)** |
| 10 | `layout_settings.json` in the source tree holds a Cloudinary API secret | **Action for owner**: rotate that key in Cloudinary |
| 11 | Referral rewards and order stats are computed in the browser | **Planned (Phase 2)** |

## Phases

### Phase 1: Centralised settings foundation (**Done**)
- `IntegrationSetting` and `IntegrationAuditLog` models, idempotent migration `prisma/migrations/20261106_integration_settings`, also created at boot.
- `backend/services/integrations/`: `crypto.ts` (AES-256-GCM, `SETTINGS_ENCRYPTION_KEY`, fails closed), `registry.ts` (14 integrations, one schema), `store.ts` (validation, masking, environment fallback, enable gate, audit log), `connectionTests.ts` (real read-only API call per provider).
- `/api/integrations` admin API: list, get, save, test, audit log, Neon candidate validation.
- Admin UI: Payments, Shipping & Delivery, Age Verification, Integrations (`src/components/admin/IntegrationsSettingsTab.tsx`).
- Tests: `npm run verify:integrations` (21 checks against real Postgres) plus HTTP end-to-end checks of every fix above.

### Phase 2: Payments core (**Planned**, blocked on the currency/market decision)
- Server-side quote/pricing engine (products, variants, plans, discounts, shipping, store credit) used by every gateway. Fixes defect #8.
- `PaymentTransaction` table, idempotency keys, a single "payment verified → order" funnel shared with Worldpay.
- Adapters: Razorpay, Cashfree, PhonePe, PayU (create, verify, webhook signature, refund). UPI through the chosen gateway.
- Checkout lists only enabled and configured gateways, with a public config endpoint.

### Phase 3: Age verification enforcement (**Planned**)
- Approvals only from server-to-server AgeChecked checks; remove client-asserted approval.
- Enforce at payment-session creation; enable/disable switch actually loads or unloads the gate.

### Phase 4: Shipping core (**Planned**)
- Shipping adapter interface (rates, serviceability, create, AWB, label, pickup, cancel, track, webhook, RTO, returns) for Shiprocket, Delhivery and iThink; Royal Mail wrapped, not rewritten.
- `Shipment` table with idempotency, automation rules (prepaid and COD), retries, admin order actions.

### Phase 5: Branding and rebrand (**Planned**)
- `store_branding` setting (name, logo, favicon, colours, emails), then replace the 521 hard-coded "Pouch Supply" references, including emails, legal pages and metadata.

### Phase 6: Storefront redesign, page builder, admin navigation redesign (**Planned**)

### Phase 7: Move legacy credentials into the encrypted store (**Planned**)
- Royal Mail, Klaviyo, email and Cloudinary keys are still plaintext JSON in `StoreSetting`; Worldpay and AgeChecked still read environment variables directly.

## Needs merchant credentials before anything can be confirmed live
Razorpay, Cashfree, PhonePe, PayU, Shiprocket, Delhivery, iThink Logistics: sandbox/test keys for each, plus webhook registration in each provider dashboard.
