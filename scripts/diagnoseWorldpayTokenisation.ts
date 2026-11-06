/**
 * Works out WHY the Hosted Payment Page is not producing a stored card.
 *
 *   npx tsx scripts/diagnoseWorldpayTokenisation.ts
 *   npx tsx scripts/diagnoseWorldpayTokenisation.ts --namespace=shopper@example.com
 *
 * No payment is taken and no order is created. The probes create Hosted Payment
 * Page sessions that nobody visits, which is the same thing the checkout does
 * before a shopper reaches Worldpay; an unvisited page simply expires.
 *
 * What the probes established on entity PO4094415264
 * --------------------------------------------------
 * The original suspicion was that `createToken` might not be part of the
 * payment_pages schema at all, and was being silently discarded. That is WRONG,
 * and the probes below are what disproved it:
 *
 *   - Probe 2 sends an invalid `optIn`. Worldpay rejects it with
 *     fieldHasInvalidValue at $.createToken.optIn, so the field is parsed and
 *     validated.
 *   - Probe 3 sends an invented top-level field. Worldpay rejects it with
 *     fieldIsNotAllowed, so this endpoint does not silently ignore anything.
 *   - Probe 4 sends customerAgreement with no createToken. Worldpay rejects it:
 *     createToken is MANDATORY whenever customerAgreement is present.
 *   - Probe 1, the exact request the checkout sends, is ACCEPTED.
 *
 * So the checkout asks for the card correctly, and Worldpay accepts the ask.
 * The card is therefore either stored-but-never-delivered to us, or not stored
 * despite a valid request. Probe 2 and 3 cannot tell those apart — only the
 * tokens service can, which is what --namespace queries.
 *
 * Keep the probes even though the schema question is settled: they are the
 * regression test for it, and they re-answer it in seconds if Worldpay changes
 * the schema or the account's entitlements underneath us.
 */
import 'dotenv/config';

const BASE = (process.env.WORLDPAY_BASE_URL || 'https://access.worldpay.com').replace(/\/+$/, '');
const ENTITY = process.env.WORLDPAY_ENTITY || process.env.WORLDPAY_ENTITY_ID || '';
const HPP_MEDIA = 'application/vnd.worldpay.payment_pages-v1.hal+json';

function authHeader(): string | null {
  const u = process.env.WORLDPAY_API_USERNAME;
  const p = process.env.WORLDPAY_API_PASSWORD;
  if (!u || !p) return null;
  return 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');
}

const args = process.argv.slice(2);

const auth = authHeader();
if (!auth || !ENTITY) {
  console.error('WORLDPAY_API_USERNAME / WORLDPAY_API_PASSWORD / WORLDPAY_ENTITY must be set.');
  process.exit(1);
}

const NAMESPACE = (args.find(a => a.startsWith('--namespace=')) || '').split('=').slice(1).join('=') || null;

const ref = () => `DIAG-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 6)}`;

function basePage(): Record<string, unknown> {
  return {
    transactionReference: ref(),
    merchant: { entity: ENTITY },
    narrative: { line1: 'Pouch Supply Diag' },
    value: { currency: 'GBP', amount: 100 },
    description: 'Tokenisation diagnostic',
    billingAddressName: 'Diagnostic Probe',
    resultURLs: {
      successURL: 'https://pouch-supply.com/diag/success',
      pendingURL: 'https://pouch-supply.com/diag/pending',
      failureURL: 'https://pouch-supply.com/diag/failure',
      errorURL: 'https://pouch-supply.com/diag/error',
      cancelURL: 'https://pouch-supply.com/diag/cancel',
      expiryURL: 'https://pouch-supply.com/diag/expiry'
    }
  };
}

async function postPage(label: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/payment_pages`, {
    method: 'POST',
    headers: { Authorization: auth!, 'Content-Type': HPP_MEDIA, Accept: HPP_MEDIA },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let parsed: any = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* keep the raw text */
  }
  console.log(`\n--- ${label}`);
  console.log(`    HTTP ${res.status}`);
  if (parsed) {
    const keys = Object.keys(parsed);
    console.log(`    response keys: ${keys.join(', ') || '(none)'}`);
    if (parsed.errorName || parsed.message || parsed.description) {
      console.log(`    error: ${parsed.errorName || ''} ${parsed.description || parsed.message || ''}`.trim());
    }
    if (parsed.validationErrors) {
      console.log(`    validationErrors: ${JSON.stringify(parsed.validationErrors).slice(0, 400)}`);
    }
    // If the response ever echoes the token request back, that is direct proof
    // the field was understood.
    if (parsed.createToken || parsed._links?.['tokens:token']) {
      console.log(`    !! response references a token: ${JSON.stringify(parsed.createToken || parsed._links['tokens:token'])}`);
    }
  } else {
    console.log(`    body: ${text.slice(0, 300)}`);
  }
  return { status: res.status, parsed };
}

async function main() {
  console.log(`Worldpay tokenisation diagnostic`);
  console.log(`  base   : ${BASE}`);
  console.log(`  entity : ${ENTITY}`);

  // ---------------------------------------------------------------- discovery
  console.log('\n=== Which services this account exposes ===');
  try {
    const res = await fetch(`${BASE}/`, { method: 'GET', headers: { Authorization: auth!, Accept: 'application/json' } });
    const data: any = await res.json().catch(() => null);
    console.log(`    HTTP ${res.status}`);
    const links = data?._links || {};
    const names = Object.keys(links);
    if (!names.length) {
      console.log('    no _links returned');
    } else {
      for (const n of names) console.log(`    ${n}  ->  ${links[n]?.href || ''}`);
      const tokenish = names.filter(n => /token/i.test(n));
      console.log(
        tokenish.length
          ? `\n    token-related services: ${tokenish.join(', ')}`
          : '\n    NO token-related service is advertised for these credentials.'
      );
    }
  } catch (err: any) {
    console.log('    discovery failed:', err?.message);
  }

  // ------------------------------------------------------------------- probes
  console.log('\n=== Probes ===');

  const withToken = {
    ...basePage(),
    customerAgreement: { type: 'subscription', storedCardUsage: 'first' },
    createToken: {
      type: 'worldpay',
      namespace: 'diagnostic@pouch-supply.com',
      description: 'Pouch Supply subscription',
      optIn: process.env.WORLDPAY_TOKEN_OPT_IN || 'Silent'
    }
  };
  const p1 = await postPage('Probe 1: exactly what the checkout sends today', withToken);

  const badOptIn = {
    ...basePage(),
    customerAgreement: { type: 'subscription', storedCardUsage: 'first' },
    createToken: {
      type: 'worldpay',
      namespace: 'diagnostic@pouch-supply.com',
      description: 'Pouch Supply subscription',
      optIn: 'ThisIsNotAValidOptInValue'
    }
  };
  const p2 = await postPage('Probe 2: same, but with a deliberately invalid optIn', badOptIn);

  const nonsense = { ...basePage(), thisFieldCertainlyDoesNotExist: { nested: 'value' } };
  const p3 = await postPage('Probe 3 (control): a top-level field that does not exist', nonsense);

  const agreementOnly = {
    ...basePage(),
    customerAgreement: { type: 'subscription', storedCardUsage: 'first' }
  };
  const p4 = await postPage('Probe 4: customerAgreement with no createToken', agreementOnly);

  // ------------------------------------------------------- the tokens service
  //
  // Worked out from the probes above: on this account `createToken` is a real,
  // validated, MANDATORY field. So the checkout request is correct and Worldpay
  // accepts it — yet no token reaches us. The remaining question is whether the
  // token exists at Worldpay and is simply never delivered, or was never made.
  //
  // The tokens service answers that directly, without another order, and if it
  // can be queried it is also a better capture route than the webhook: it is a
  // pull we control rather than a push we can only hope arrives.
  if (NAMESPACE) {
    console.log(`\n=== Does Worldpay hold a token for "${NAMESPACE}"? ===`);

    const tokenAccepts = [
      'application/vnd.worldpay.tokens-v3.hal+json',
      'application/vnd.worldpay.tokens-v2.hal+json',
      'application/json'
    ];

    // The service root first: if it advertises its own operations, that beats
    // guessing at query shapes.
    for (const accept of tokenAccepts) {
      try {
        const res = await fetch(`${BASE}/tokens`, {
          method: 'GET',
          headers: { Authorization: auth!, Accept: accept }
        });
        const text = await res.text();
        console.log(`\n  GET /tokens  (Accept: ${accept})`);
        console.log(`    HTTP ${res.status}`);
        console.log(`    ${text.slice(0, 600)}`);
        if (res.ok) break;
      } catch (err: any) {
        console.log(`    failed: ${err?.message}`);
      }
    }

    // Candidate query shapes. Reported rather than assumed: whichever answers is
    // the one to wire into the recovery sweep.
    const candidates = [
      `${BASE}/tokens?namespace=${encodeURIComponent(NAMESPACE)}`,
      `${BASE}/tokens/namespaces/${encodeURIComponent(NAMESPACE)}`,
      `${BASE}/tokens?entityReference=${encodeURIComponent(ENTITY)}&namespace=${encodeURIComponent(NAMESPACE)}`
    ];

    for (const url of candidates) {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: { Authorization: auth!, Accept: tokenAccepts[0] }
        });
        const text = await res.text();
        console.log(`\n  GET ${url.replace(BASE, '')}`);
        console.log(`    HTTP ${res.status}`);
        console.log(`    ${text.slice(0, 800)}`);
        if (res.ok && /\/tokens\//.test(text)) {
          console.log('    ^^ this shape returns token references — wire this one in.');
        }
      } catch (err: any) {
        console.log(`    failed: ${err?.message}`);
      }
    }
  } else {
    console.log('\n=== Tokens service ===');
    console.log('  Skipped. Re-run with --namespace=<the shopper email used at checkout>');
    console.log('  to ask Worldpay whether it is holding a card for that shopper, e.g.');
    console.log('    npx tsx scripts/diagnoseWorldpayTokenisation.ts --namespace=scott@pouch-supply.com');
  }

  // ------------------------------------------------------------------ verdict
  console.log('\n\n=== Verdict ===');
  const ok = (r: { status: number }) => r.status >= 200 && r.status < 300;

  const schemaValidatesToken = !ok(p2);
  const schemaRejectsUnknown = !ok(p3);

  if (!ok(p1)) {
    console.log('  Probe 1 was REJECTED, so the live checkout request is being refused outright.');
    console.log('  Read the error above — that is the reason tokenisation never happens.');
  } else if (schemaValidatesToken && schemaRejectsUnknown) {
    console.log('  createToken is a REAL, VALIDATED field on this endpoint:');
    console.log('    - Probe 2 rejected an invalid optIn at $.createToken.optIn, so the field is parsed.');
    console.log('    - Probe 3 rejected an invented field, so nothing is silently ignored here.');
    console.log('    - Probe 1, the exact request the checkout sends, was ACCEPTED.');
    console.log('');
    console.log('  So the checkout is asking correctly and Worldpay is accepting the ask. The');
    console.log('  card is not failing to be requested — it is failing to reach us, or failing');
    console.log('  to be stored despite a valid request. Those need different fixes:');
    console.log('');
    console.log('    1. NOT DELIVERED. The token exists at Worldpay but no tokenCreated webhook');
    console.log('       reaches the endpoint. Check GET /api/worldpay/webhook on the deployed');
    console.log('       app: webhooksReceivedTotal 0 means Worldpay is calling nothing at all,');
    console.log('       which is a registration problem in Developer Tools > Webhooks.');
    console.log('       Re-run this script with --namespace=<shopper email> to ask the tokens');
    console.log('       service directly. A token there proves this is the case.');
    console.log('');
    console.log('    2. NOT STORED. optIn "Silent" passes schema validation but still has to be');
    console.log('       enabled on the entity; an account without it may accept the request and');
    console.log('       store nothing. Set WORLDPAY_TOKEN_OPT_IN=ASK and the shopper is asked on');
    console.log('       Worldpay\'s own page instead — a one-variable change, no code edit.');
    console.log('');
    console.log('  Put this to Worldpay support verbatim:');
    console.log(`    "On entity ${ENTITY}, we create a Hosted Payment Page with customerAgreement`);
    console.log('     (subscription/first) and createToken (type worldpay, optIn Silent). The page');
    console.log('     is accepted, the shopper pays, and the payment is recorded as cardOnFile with');
    console.log('     a scheme reference — but no token is created and no tokenCreated event is');
    console.log('     delivered. Is optIn Silent enabled for this entity, and are tokenCreated');
    console.log('     webhooks enabled? If a token IS being stored, how should we retrieve its href');
    console.log('     for subsequent recurring payments?"');
  } else if (schemaValidatesToken) {
    console.log('  createToken is understood and validated, so the field is supported and the');
    console.log('  problem is its contents or an account permission. The rejection above names it.');
  } else {
    console.log('  Probe 2 and Probe 3 were both accepted: this endpoint does not validate fields');
    console.log('  it does not recognise, so createToken may be being discarded silently.');
    console.log('  Ask Worldpay whether payment_pages supports tokenisation on this entity.');
  }

  console.log(`\n  (Probe 4, agreement without a token, returned HTTP ${p4.status}.)`);
  if (!ok(p4)) {
    console.log('   -> createToken is MANDATORY alongside customerAgreement on this account,');
    console.log('      which confirms the checkout could not have taken the agreement without it.');
  }
  console.log('\n  None of these took a payment. The pages created here were never opened and expire unused.');
}

main();
