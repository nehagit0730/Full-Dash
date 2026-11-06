/**
 * End-to-end verification of the Worldpay subscription token flow.
 *
 *   npx tsx scripts/verifyWorldpayTokenFlow.ts
 *
 * Drives the REAL Express app and the REAL route handlers. Only Worldpay itself
 * is stubbed, at the fetch boundary, so every assertion is about this codebase's
 * behaviour rather than about the stub. It answers the question a live test
 * cannot answer cheaply: if Worldpay behaves in each of the ways it actually
 * behaves, does the card end up stored and does the renewal present it?
 *
 * Safety. The script runs in a throwaway working directory with no
 * DATABASE_URL, so the local JSON store it writes is a temporary one and
 * production Neon is never touched. Mail and analytics credentials are cleared,
 * and the fetch stub throws on any host that is not Worldpay, so a run cannot
 * email a customer or publish an event. The Neon column write is covered
 * separately, in case 6, through the same writer the live path uses.
 *
 * What it cannot cover: Worldpay's own behaviour. Whether this merchant account
 * really issues a token, and really delivers a tokenCreated webhook, can only be
 * established by one real payment on the Hosted Payment Page.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';

const TOKEN_A = 'https://access.worldpay.com/tokens/6a1f9c2d4b8e47f0';
const TOKEN_B = 'https://access.worldpay.com/tokens/b73e5a19cc0d42aa';
const TOKEN_C = 'https://access.worldpay.com/tokens/f10c8d7e2a934bb6';
const TOKEN_D = 'https://access.worldpay.com/tokens/9926000855699364922';
const TOKEN_E = 'https://access.worldpay.com/tokens/1111111111111111111';
const TOKEN_F = 'https://access.worldpay.com/tokens/2222222222222222222';
const TOKEN_G = 'https://access.worldpay.com/tokens/3333333333333333333';
/** Space-padded exactly as the card schemes return it. */
const SCHEME_REF = 'MRLZRGKT60908  ';

type Scenario = {
  /** Worldpay refuses `optIn: "Silent"` because it is not enabled on the account. */
  silentRejected: boolean;
  /** Worldpay refuses stored-card mandates altogether. */
  mandateRejected: boolean;
  /** Token link the payment query publishes, if any. */
  queryToken: string | null;
  /** What GET /tokens?namespace=... returns, keyed by namespace. */
  tokens: Record<string, any[]>;
  /** Scheme reference the payment and the authorization report. */
  schemeReference: string;
  /** A different token handed back on a recurring charge, if any. */
  rotatedToken: string | null;
};

const scenario: Scenario = {
  silentRejected: true,
  mandateRejected: false,
  queryToken: null,
  tokens: {},
  schemeReference: SCHEME_REF,
  rotatedToken: null
};

const calls = {
  paymentPages: [] as any[],
  authorizations: [] as any[],
  queries: [] as string[],
  tokenLookups: [] as string[]
};

let passed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failures.push(label + (detail ? ` — ${detail}` : ''));
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function main() {
  // A throwaway store, named before serverDb is imported: it reads
  // LOCAL_STORE_PATH once, at module load. Without this the run would write its
  // test orders into the repo's own local_store_data.json.
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-token-verify-'));
  process.env.LOCAL_STORE_PATH = path.join(sandbox, 'local_store_data.json');

  process.env.DATABASE_URL = '';
  process.env.WORLDPAY_ENTITY = 'PO1234567';
  process.env.WORLDPAY_API_USERNAME = 'harness-user';
  process.env.WORLDPAY_API_PASSWORD = 'harness-pass';
  process.env.WORLDPAY_BASE_URL = 'https://access.worldpay.com';
  process.env.WORLDPAY_ENVIRONMENT = 'live';
  process.env.WORLDPAY_TOKEN_OPT_IN = 'Silent';
  process.env.NODE_ENV = 'test';
  // The renewal worker is driven through its cron endpoint, which authenticates.
  process.env.CRON_SECRET = 'harness-cron-secret';

  // No outbound side effects from a test run.
  process.env.GMAIL_APP_PASSWORD = '';
  process.env.SMTP_PASS = '';
  process.env.RESEND_API_KEY = '';
  process.env.KLAVIYO_PRIVATE_KEY = '';
  process.env.KLAVIYO_PUBLIC_KEY = '';
  process.env.KLAVIYO_COMPANY_ID = '';

  const realFetch = globalThis.fetch.bind(globalThis);

  const json = (status: number, payload: any) =>
    new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });

  globalThis.fetch = (async (input: any, init?: any) => {
    const url = String(input?.url || input);
    if (url.includes('127.0.0.1') || url.includes('localhost')) return realFetch(input, init);
    const body = init?.body ? JSON.parse(String(init.body)) : null;

    if (url.includes('/payment_pages')) {
      calls.paymentPages.push(body);
      if (scenario.mandateRejected && body?.createToken) {
        return json(400, { errorName: 'bodyDoesNotMatchSchema', message: 'customerAgreement not enabled' });
      }
      if (scenario.silentRejected && body?.createToken?.optIn === 'Silent') {
        return json(400, { errorName: 'bodyDoesNotMatchSchema', message: 'optIn Silent is not enabled for this entity' });
      }
      return json(201, {
        _links: { 'payment_pages:redirect': { href: 'https://payments.worldpay.com/app/hpp/integration/x' } }
      });
    }

    // GET /tokens?namespace=... — the stored cards Worldpay holds for a shopper.
    if (url.includes('/tokens')) {
      calls.tokenLookups.push(url);
      const ns = decodeURIComponent((url.match(/namespace=([^&]+)/) || [])[1] || '');
      return json(200, { _embedded: { tokens: scenario.tokens[ns] || [] } });
    }

    if (url.includes('/paymentQueries/payments')) {
      calls.queries.push(url);
      const payment: any = {
        id: 'pay-harness-0001',
        lastEvent: 'settlementRequestSubmitted',
        transactionType: 'cardOnFile',
        authorizationCode: 'AUTH123',
        scheme: { reference: scenario.schemeReference },
        paymentInstrument: { card: { brand: 'visa' } }
      };
      if (scenario.queryToken) payment._links = { 'tokens:token': { href: scenario.queryToken } };
      return json(200, { _embedded: { payments: [payment] } });
    }

    if (url.includes('/payments/authorizations')) {
      calls.authorizations.push(body);
      const authResponse: any = {
        id: 'auth-harness-0001',
        outcome: 'authorized',
        authorizationCode: 'AUTH999',
        scheme: { reference: scenario.schemeReference }
      };
      // Worldpay can hand back a different token on a charge.
      if (scenario.rotatedToken) {
        authResponse._links = { 'tokens:token': { href: scenario.rotatedToken } };
      }
      return json(201, authResponse);
    }

    // Proves the run reaches nothing but Worldpay.
    throw new Error(`[verify] blocked outbound call: ${url}`);
  }) as any;

  const { createExpressApp } = await import('../serverApp');
  const { fetchResource, saveResource } = await import('../serverDb');
  const { toSubscriptionRow } = await import('../src/lib/subscriptionRow');

  const app = await createExpressApp();
  const server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;

  const post = async (route: string, body: any) => {
    const res = await realFetch(`${base}${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };

  const subscriptionFor = async (orderId: string) => {
    const subs: any[] = (await fetchResource('subscriptions')) || [];
    return subs.find((s: any) => String(s.sourceOrderId) === String(orderId));
  };

  /**
   * Bills a plan the way production does: make it due, then let the renewal
   * worker take it.
   *
   * The harness used to POST /api/subscriptions/charge. That endpoint is gone —
   * it was the one charge path with no duplicate protection, and driving the
   * real worker is what the live schedule actually does anyway.
   */
  const renewNow = async (subscriptionId: string) => {
    const subs: any[] = (await fetchResource('subscriptions')) || [];
    const due = new Date(Date.now() - 60 * 1000).toISOString();
    await saveResource(
      'subscriptions',
      subs.map((s: any) => (String(s.id) === String(subscriptionId) ? { ...s, nextBillingDate: due } : s))
    );

    const res = await realFetch(`${base}/api/subscriptions/cron`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CRON_SECRET}`
      },
      body: '{}'
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };

  const checkoutBody = (orderId: string, email: string) => ({
    orderId,
    amount: 25,
    total: 25,
    customerName: 'Harness Tester',
    customerEmail: email,
    customerPhone: '07581708618',
    destination: '39 Tonks Drive, Telford, TF4 2TQ, United Kingdom',
    shippingAddress: {
      addressLine1: '39 Tonks Drive',
      city: 'Telford',
      postcode: 'TF4 2TQ',
      country: 'United Kingdom',
      countryCode: 'GB',
      phone: '07581708618'
    },
    items: [
      {
        productId: 'sub-pack-harness',
        productTitle: 'LITE Plan - harness',
        price: 22.01,
        quantity: 1,
        isSubscription: true,
        subscriptionPlan: 'LITE Plan',
        subscriptionFrequency: 'month'
      }
    ],
    recurring: true
  });

  /** The Access webhook shape: the token rides under eventDetails, not data. */
  const tokenCreatedEvent = (orderId: string, email: string, token: string) => ({
    eventId: `evt-${Date.now()}`,
    eventTimestamp: new Date().toISOString(),
    eventDetails: {
      type: 'tokenCreated',
      transactionReference: orderId,
      namespace: email,
      tokenPaymentInstrument: { href: token }
    }
  });

  try {
    console.log('\n=== 1. Checkout asks Worldpay to store the card, and keeps asking ===');
    const ORDER_1 = 'PS90001';
    const EMAIL_1 = 'harness.one@pouch-supply.com';
    const session = await post('/api/worldpay/session', checkoutBody(ORDER_1, EMAIL_1));

    check('payment page created despite the Silent rejection', session.status === 200, `status ${session.status}`);
    check('two payment-page attempts were made', calls.paymentPages.length === 2, `saw ${calls.paymentPages.length}`);
    check('attempt 1 asked for a stored card', Boolean(calls.paymentPages[0]?.createToken));
    check('attempt 1 used the configured optIn', calls.paymentPages[0]?.createToken?.optIn === 'Silent');
    check(
      'attempt 2 retried with optIn ASK rather than dropping the token',
      calls.paymentPages[1]?.createToken?.optIn === 'ASK',
      `got ${JSON.stringify(calls.paymentPages[1]?.createToken?.optIn)}`
    );
    check('attempt 2 kept the customer agreement', calls.paymentPages[1]?.customerAgreement?.type === 'subscription');
    check('namespace is the shopper email, so the token can be matched back', calls.paymentPages[1]?.createToken?.namespace === EMAIL_1);

    console.log('\n=== 2. Token arrives on the webhook after the order, and is saved ===');
    scenario.queryToken = null;
    await post('/api/worldpay/verify-payment', { orderId: ORDER_1, status: 'SUCCESS' });

    const beforeWebhook = await subscriptionFor(ORDER_1);
    check('subscription was created by the verified payment', Boolean(beforeWebhook), 'no subscription found');
    check('it starts with no stored card', !beforeWebhook?.worldpayTokenHref);
    check('it captured the scheme reference', String(beforeWebhook?.worldpaySchemeReference || '').trim() === SCHEME_REF.trim());

    const hook = await post('/api/worldpay/webhook', tokenCreatedEvent(ORDER_1, EMAIL_1, TOKEN_A));
    check('webhook accepted the tokenCreated event', hook.status === 200, `status ${hook.status}`);
    check('webhook reported it processed the token', hook.body?.processed === true, JSON.stringify(hook.body));

    const afterWebhook = await subscriptionFor(ORDER_1);
    check('token was saved against the subscription', afterWebhook?.worldpayTokenHref === TOKEN_A, `got ${afterWebhook?.worldpayTokenHref}`);

    console.log('\n=== 3. The renewal presents the stored card ===');
    calls.authorizations.length = 0;
    const charge = await renewNow(afterWebhook?.id);
    check('recurring charge succeeded', charge.body?.succeeded === 1, JSON.stringify(charge.body).slice(0, 200));

    const mit = calls.authorizations[0];
    check('a charge was actually sent to Worldpay', Boolean(mit));
    check('it carried the card as a payment instrument', mit?.instruction?.paymentInstrument?.type === 'card/token', JSON.stringify(mit?.instruction?.paymentInstrument));
    check('the instrument is the token from the webhook', mit?.instruction?.paymentInstrument?.href === TOKEN_A);
    check('it is flagged as a subsequent stored-card use', mit?.instruction?.customerAgreement?.storedCardUsage === 'subsequent');
    check('it carried the scheme reference too', String(mit?.instruction?.customerAgreement?.schemeReference || '').trim() === SCHEME_REF.trim());

    console.log('\n=== 4. Token that arrives BEFORE its order is parked, then claimed ===');
    const ORDER_2 = 'PS90002';
    const EMAIL_2 = 'harness.two@pouch-supply.com';
    const early = await post('/api/worldpay/webhook', tokenCreatedEvent(ORDER_2, EMAIL_2, TOKEN_B));
    check('early webhook was accepted', early.status === 200);

    const parked: any[] = (await fetchResource('worldpayPendingTokens')) || [];
    check('unmatched token was parked rather than dropped', parked.some((t: any) => t?.tokenHref === TOKEN_B), JSON.stringify(parked));

    await post('/api/worldpay/session', checkoutBody(ORDER_2, EMAIL_2));
    await post('/api/worldpay/verify-payment', { orderId: ORDER_2, status: 'SUCCESS' });

    const claimed = await subscriptionFor(ORDER_2);
    check('the parked token was claimed by its subscription', claimed?.worldpayTokenHref === TOKEN_B, `got ${claimed?.worldpayTokenHref}`);

    const parkedAfter: any[] = (await fetchResource('worldpayPendingTokens')) || [];
    check(
      'the claimed token is retired so it cannot be claimed twice',
      parkedAfter.filter((t: any) => t?.tokenHref === TOKEN_B).length === 0,
      JSON.stringify(parkedAfter)
    );

    console.log('\n=== 5. If the webhook never arrives, the sweep recovers the card ===');
    const ORDER_3 = 'PS90003';
    const EMAIL_3 = 'harness.three@pouch-supply.com';
    scenario.queryToken = null;
    await post('/api/worldpay/session', checkoutBody(ORDER_3, EMAIL_3));
    await post('/api/worldpay/verify-payment', { orderId: ORDER_3, status: 'SUCCESS' });

    const stranded = await subscriptionFor(ORDER_3);
    check('subscription exists with no stored card (webhook never came)', Boolean(stranded) && !stranded?.worldpayTokenHref);

    scenario.queryToken = TOKEN_C;
    const sweep = await post('/api/worldpay/recover-tokens', {});
    check('sweep ran', sweep.status === 200, `status ${sweep.status}`);

    const healed = await subscriptionFor(ORDER_3);
    check('sweep recovered the card without any webhook', healed?.worldpayTokenHref === TOKEN_C, `got ${healed?.worldpayTokenHref}`);

    console.log('\n=== 6. The token reaches the typed Neon column ===');
    const row = toSubscriptionRow({
      id: 'sub-row-check',
      customerEmail: EMAIL_1,
      planId: 'sub-pack-harness',
      planName: 'LITE Plan',
      amount: 25,
      status: 'active',
      worldpayTokenHref: TOKEN_A
    });
    check('worldpayTokenHref is written into the Subscription row', row.worldpayTokenHref === TOKEN_A, JSON.stringify(row.worldpayTokenHref));

    console.log('\n=== 7. A plan Worldpay refused to tokenise is marked, not left looking healthy ===');
    const ORDER_4 = 'PS90004';
    const EMAIL_4 = 'harness.four@pouch-supply.com';
    scenario.mandateRejected = true;
    calls.paymentPages.length = 0;
    const downgraded = await post('/api/worldpay/session', checkoutBody(ORDER_4, EMAIL_4));
    check('the sale still completed', downgraded.status === 200, `status ${downgraded.status}`);
    check('the last attempt dropped the token to save the sale', !calls.paymentPages[calls.paymentPages.length - 1]?.createToken);

    scenario.queryToken = null;
    await post('/api/worldpay/verify-payment', { orderId: ORDER_4, status: 'SUCCESS' });
    const flagged = await subscriptionFor(ORDER_4);
    check('the subscription records that it cannot renew', flagged?.tokenisationDowngraded === true, JSON.stringify(flagged?.tokenisationDowngraded));
    scenario.mandateRejected = false;

    console.log('\n=== 8. A card Worldpay does not hold is asked for once, not forever ===');
    const ORDER_5 = 'PS90005';
    const EMAIL_5 = 'harness.five@pouch-supply.com';
    scenario.queryToken = null;
    await post('/api/worldpay/session', checkoutBody(ORDER_5, EMAIL_5));
    await post('/api/worldpay/verify-payment', { orderId: ORDER_5, status: 'SUCCESS' });

    // One empty answer is not proof, so it keeps asking for a few rounds.
    await post('/api/worldpay/recover-tokens', {});
    const afterOne = await subscriptionFor(ORDER_5);
    check('a fruitless lookup is counted, not treated as final', Number(afterOne?.tokenLookupAttempts) === 1, JSON.stringify(afterOne?.tokenLookupAttempts));
    check('it is not written off after one try', !afterOne?.tokenLookupExhaustedAt);

    const queriesAfterOne = calls.queries.length;
    await post('/api/worldpay/recover-tokens', {});
    check('it is asked again on the next sweep', calls.queries.length > queriesAfterOne);

    // A token that only becomes visible later is still caught while the budget lasts.
    scenario.queryToken = TOKEN_C;
    await post('/api/worldpay/recover-tokens', {});
    const lateRecovery = await subscriptionFor(ORDER_5);
    check('a token that appears late is still recovered', lateRecovery?.worldpayTokenHref === TOKEN_C, `got ${lateRecovery?.worldpayTokenHref}`);

    console.log('\n=== 9. A genuinely dead subscription stops being asked about ===');
    const ORDER_6 = 'PS90006';
    const EMAIL_6 = 'harness.six@pouch-supply.com';
    scenario.queryToken = null;
    await post('/api/worldpay/session', checkoutBody(ORDER_6, EMAIL_6));
    await post('/api/worldpay/verify-payment', { orderId: ORDER_6, status: 'SUCCESS' });

    for (let i = 0; i < 5; i++) await post('/api/worldpay/recover-tokens', {});
    const dead = await subscriptionFor(ORDER_6);
    check('it is written off once the attempt budget is spent', Boolean(dead?.tokenLookupExhaustedAt), JSON.stringify(dead?.tokenLookupAttempts));

    const queriesBeforeLast = calls.queries.length;
    await post('/api/worldpay/recover-tokens', {});
    check('and is not asked about again', calls.queries.length === queriesBeforeLast, `${calls.queries.length - queriesBeforeLast} extra quer(ies)`);

    console.log('\n=== 10. Every inbound webhook is recorded, whatever its shape ===');
    const getJson = async (route: string) => {
      const res = await realFetch(`${base}${route}`);
      return { status: res.status, body: await res.json().catch(() => ({})) };
    };

    const before = await getJson('/api/worldpay/webhook');
    const countBefore = Number(before.body?.webhooksReceivedTotal || 0);

    // A shape this code does not understand at all. It must still be visible,
    // because an unrecognised payload is exactly the case that used to vanish.
    const odd = await post('/api/worldpay/webhook', { somethingWorldpayMightSend: { nested: true } });
    check('an unrecognised webhook still gets a 2xx', odd.status === 200, `status ${odd.status}`);

    const after = await getJson('/api/worldpay/webhook');
    check(
      'it was counted as received',
      Number(after.body?.webhooksReceivedTotal || 0) === countBefore + 1,
      `${countBefore} -> ${after.body?.webhooksReceivedTotal}`
    );
    check('its raw body was kept for shape-matching', JSON.stringify(after.body?.lastRawBodies || []).includes('somethingWorldpayMightSend'));
    check('the diagnostic says what was done with it', typeof after.body?.recentEvents?.[0]?.action === 'string', JSON.stringify(after.body?.recentEvents?.[0]));

    // A token event whose href sits somewhere unrecognised must be called out
    // rather than silently treated as "no token was sent".
    await post('/api/worldpay/webhook', {
      eventDetails: { type: 'tokenCreated', transactionReference: 'PS90007', somewhereUnexpected: 'not-a-url' }
    });
    const afterOdd = await getJson('/api/worldpay/webhook');
    const unreadableFlagged = (afterOdd.body?.recentEvents || []).find((e: any) => /UNREADABLE/i.test(String(e?.action || '')));
    check('a token event with an unreadable href is flagged as such', Boolean(unreadableFlagged), JSON.stringify(afterOdd.body?.recentEvents?.[0]));

    check('token events are counted separately', Number(afterOdd.body?.tokenEventsReceived || 0) >= 1, JSON.stringify(afterOdd.body?.tokenEventsReceived));

    console.log('\n=== 11. The tokens service supplies the card when no webhook does ===');
    const ORDER_7 = 'PS90008';
    const EMAIL_7 = 'harness.seven@pouch-supply.com';
    scenario.queryToken = null;
    // Worldpay is holding a card for this shopper, stored under this payment's
    // own agreement.
    scenario.tokens[EMAIL_7] = [
      {
        tokenId: '9926000855699364922',
        namespace: EMAIL_7,
        schemeTransactionReference: SCHEME_REF.trim(),
        tokenExpiryDateTime: '2030-09-08T13:28:09Z',
        tokenPaymentInstrument: { href: TOKEN_D }
      }
    ];

    await post('/api/worldpay/session', checkoutBody(ORDER_7, EMAIL_7));
    await post('/api/worldpay/verify-payment', { orderId: ORDER_7, status: 'SUCCESS' });

    const fromTokensApi = await subscriptionFor(ORDER_7);
    check('the card was retrieved without any webhook at all', fromTokensApi?.worldpayTokenHref === TOKEN_D, `got ${fromTokensApi?.worldpayTokenHref}`);

    console.log('\n=== 12. A card from a DIFFERENT agreement is refused ===');
    const ORDER_8 = 'PS90009';
    const EMAIL_8 = 'harness.eight@pouch-supply.com';
    // Exactly the PS65700 shape: Worldpay holds a card for this shopper, but it
    // was created under an earlier payment's agreement.
    scenario.tokens[EMAIL_8] = [
      {
        tokenId: '1111111111111111111',
        namespace: EMAIL_8,
        schemeTransactionReference: 'MRLZRGKT60908',
        tokenPaymentInstrument: { href: TOKEN_E }
      }
    ];
    scenario.schemeReference = 'MRLDDX5E80915';

    await post('/api/worldpay/session', checkoutBody(ORDER_8, EMAIL_8));
    await post('/api/worldpay/verify-payment', { orderId: ORDER_8, status: 'SUCCESS' });

    const mismatched = await subscriptionFor(ORDER_8);
    check(
      'a card from another agreement is NOT attached',
      !mismatched?.worldpayTokenHref,
      `wrongly attached ${mismatched?.worldpayTokenHref}`
    );
    scenario.schemeReference = SCHEME_REF;

    console.log('\n=== 13. One shopper\'s card is never given to another ===');
    const ORDER_9 = 'PS90010';
    const EMAIL_9 = 'harness.nine@pouch-supply.com';
    // Worldpay answers the query with a card filed under somebody else. This
    // should never happen, and it must never be trusted if it does.
    scenario.tokens[EMAIL_9] = [
      {
        tokenId: '2222222222222222222',
        namespace: 'someone.else@pouch-supply.com',
        schemeTransactionReference: SCHEME_REF.trim(),
        tokenPaymentInstrument: { href: TOKEN_F }
      }
    ];

    await post('/api/worldpay/session', checkoutBody(ORDER_9, EMAIL_9));
    await post('/api/worldpay/verify-payment', { orderId: ORDER_9, status: 'SUCCESS' });

    const foreign = await subscriptionFor(ORDER_9);
    check(
      "another shopper's card is never attached",
      foreign?.worldpayTokenHref !== TOKEN_F,
      `attached a foreign card: ${foreign?.worldpayTokenHref}`
    );

    console.log('\n=== 14. Two cards, no way to tell them apart, nothing assigned ===');
    const ORDER_10 = 'PS90011';
    const EMAIL_10 = 'harness.ten@pouch-supply.com';
    scenario.tokens[EMAIL_10] = [
      { tokenId: 'a', namespace: EMAIL_10, schemeTransactionReference: 'MRLOLD111', tokenPaymentInstrument: { href: TOKEN_E } },
      { tokenId: 'b', namespace: EMAIL_10, schemeTransactionReference: 'MRLOLD222', tokenPaymentInstrument: { href: TOKEN_F } }
    ];
    scenario.schemeReference = 'MRLNEW999';

    await post('/api/worldpay/session', checkoutBody(ORDER_10, EMAIL_10));
    await post('/api/worldpay/verify-payment', { orderId: ORDER_10, status: 'SUCCESS' });

    const ambiguous = await subscriptionFor(ORDER_10);
    check('nothing is assigned when the right card cannot be identified', !ambiguous?.worldpayTokenHref, `got ${ambiguous?.worldpayTokenHref}`);
    scenario.schemeReference = SCHEME_REF;

    console.log('\n=== 15. A rotated token from a renewal is persisted ===');
    // Worldpay may hand back a different token on the charge; the next renewal
    // has to present the current card, not the retired one.
    scenario.tokens[EMAIL_7] = [];
    scenario.rotatedToken = TOKEN_G;
    calls.authorizations.length = 0;
    const rotate = await renewNow(fromTokensApi?.id);
    check('the renewal succeeded', rotate.body?.succeeded === 1, JSON.stringify(rotate.body).slice(0, 160));
    check('it presented the card it had', calls.authorizations[0]?.instruction?.paymentInstrument?.href === TOKEN_D);

    const rotated = await subscriptionFor(ORDER_7);
    check('the rotated token replaced the old one', rotated?.worldpayTokenHref === TOKEN_G, `got ${rotated?.worldpayTokenHref}`);
    scenario.rotatedToken = null;

    console.log('\n=== 16. PS65700: a paid order whose subscription was never created ===');
    const ORDER_11 = 'PS90012';
    const EMAIL_11 = 'harness.eleven@pouch-supply.com';
    scenario.tokens[EMAIL_11] = [];
    scenario.queryToken = null;

    // The checkout happens normally, so the basket IS a subscription.
    await post('/api/worldpay/session', checkoutBody(ORDER_11, EMAIL_11));

    await post('/api/worldpay/verify-payment', { orderId: ORDER_11, status: 'SUCCESS' });

    // Reproduce PS65700 exactly: the order is Paid and carries subscription
    // items, but no subscription row exists. In production this comes from the
    // subscription write failing after the order was saved — which used to be
    // swallowed by an empty catch. Removing the row here reaches the same state
    // deterministically, without having to force an exception.
    const strandedSubs: any[] = (await fetchResource('subscriptions')) || [];
    await saveResource(
      'subscriptions',
      strandedSubs.filter((s: any) => String(s?.sourceOrderId) !== ORDER_11)
    );
    check('the subscription is gone, leaving a paid order alone', !(await subscriptionFor(ORDER_11)));

    const paidOrders: any[] = (await fetchResource('orders')) || [];
    const strandedOrder = paidOrders.find((o: any) => String(o.id) === ORDER_11);
    check('the order exists and is Paid', strandedOrder?.paymentStatus === 'Paid', JSON.stringify(strandedOrder?.paymentStatus));

    // Before the fix this returned early forever and nothing could recover it.
    const repair = await post('/api/worldpay/repair-subscriptions', {});
    check('the repair sweep ran', repair.status === 200, `status ${repair.status}`);

    const rebuilt = await subscriptionFor(ORDER_11);
    check('the missing subscription is created', Boolean(rebuilt), 'still no subscription');
    check('it is active', rebuilt?.status === 'active', JSON.stringify(rebuilt?.status));
    check('it carries the scheme reference from its own payment', String(rebuilt?.worldpaySchemeReference || '').trim() === SCHEME_REF.trim());
    check('it has no card attached, because none could be proven', !rebuilt?.worldpayTokenHref, `wrongly attached ${rebuilt?.worldpayTokenHref}`);

    console.log('\n=== 17. Repair is idempotent and never duplicates a plan ===');
    await post('/api/worldpay/repair-subscriptions', {});
    await post('/api/worldpay/repair-subscriptions', {});
    const allSubs: any[] = (await fetchResource('subscriptions')) || [];
    const forOrder11 = allSubs.filter((s: any) => String(s?.sourceOrderId) === ORDER_11);
    check('exactly one subscription exists for the order', forOrder11.length === 1, `${forOrder11.length} subscriptions`);

    // A plain duplicate callback must still not create a second plan.
    await post('/api/worldpay/verify-payment', { orderId: ORDER_11, status: 'SUCCESS' });
    const afterReplay: any[] = (await fetchResource('subscriptions')) || [];
    check(
      'replaying the payment callback does not create a second plan',
      afterReplay.filter((s: any) => String(s?.sourceOrderId) === ORDER_11).length === 1,
      `${afterReplay.filter((s: any) => String(s?.sourceOrderId) === ORDER_11).length} subscriptions`
    );

    console.log('\n=== 18. A one-off order is never given a subscription ===');
    const ORDER_12 = 'PS90013';
    const EMAIL_12 = 'harness.twelve@pouch-supply.com';
    await post('/api/worldpay/verify-payment', {
      orderId: ORDER_12,
      status: 'SUCCESS',
      customerEmail: EMAIL_12,
      customerName: 'One Off',
      total: 19.99,
      items: [{ productId: 'plain-product', productTitle: 'Just a tin', price: 19.99, quantity: 1 }]
    });
    await post('/api/worldpay/repair-subscriptions', {});
    const oneOff = await subscriptionFor(ORDER_12);
    check('a non-subscription order gets no subscription', !oneOff, `created ${oneOff?.id}`);

    console.log('\n=== 19. PS65700\'s real shape: tagged a subscription, but no line says so ===');
    const ORDER_13 = 'PS90014';
    const EMAIL_13 = 'harness.thirteen@pouch-supply.com';

    // Exactly what the three production orders look like: orders.ts labelled it
    // a subscription (tag + isSubscription + subscriptionDetails) because the
    // vendor says "Subscription Pack", while the line carries no isSubscription
    // flag and no sub-pack id.
    const { saveSingleOrder } = await import('../backend/routes/orders');
    await saveSingleOrder({
      id: ORDER_13,
      customerName: 'Harness Thirteen',
      customerEmail: EMAIL_13,
      paymentStatus: 'Paid',
      total: 25,
      shippingCost: 2.99,
      worldpayTxId: 'pay-harness-0001',
      destination: '39 Tonks Drive, Telford, TF4 2TQ, United Kingdom',
      items: [
        {
          productId: '77-52-mg',
          sku: 'PCH-563404',
          productTitle: '77 5.2 mg — Watermelon ice',
          vendor: 'Subscription Pack',
          price: 22.01,
          quantity: 1
        }
      ]
    });

    const taggedOrder: any[] = (await fetchResource('orders')) || [];
    const t13 = taggedOrder.find((o: any) => String(o.id) === ORDER_13);
    check('the order is labelled a subscription', Boolean(t13?.isSubscription), JSON.stringify(t13?.isSubscription));
    check('and it has no subscription', !(await subscriptionFor(ORDER_13)));

    const repair13 = await post('/api/worldpay/repair-subscriptions', {});
    check('the repair sweep ran', repair13.status === 200);

    const rebuilt13 = await subscriptionFor(ORDER_13);
    check('the subscription is rebuilt from the order', Boolean(rebuilt13), JSON.stringify(repair13.body?.results));
    check('it kept the plan it was sold as', String(rebuilt13?.planName || '').length > 0, JSON.stringify(rebuilt13?.planName));
    check('it still has no card attached', !rebuilt13?.worldpayTokenHref);

    console.log('\n=== 20. A six-pack of tins is NOT a subscription ===');
    const ORDER_14 = 'PS90015';
    const EMAIL_14 = 'harness.fourteen@pouch-supply.com';
    await post('/api/worldpay/verify-payment', {
      orderId: ORDER_14,
      status: 'SUCCESS',
      customerEmail: EMAIL_14,
      customerName: 'Six Pack Buyer',
      total: 24,
      items: [
        {
          productId: 'tins-variety',
          productTitle: 'Variety six pack of tins',
          vendor: 'Pouch Supply',
          price: 24,
          quantity: 1
        }
      ]
    });
    const sixPack = await subscriptionFor(ORDER_14);
    check('a "pack" in the title does not create a billing schedule', !sixPack, `created ${sixPack?.id}`);

    console.log('\n=== 21. A dry run reports and writes nothing ===');
    const ORDER_15 = 'PS90016';
    const EMAIL_15 = 'harness.fifteen@pouch-supply.com';
    await post('/api/worldpay/session', checkoutBody(ORDER_15, EMAIL_15));
    await post('/api/worldpay/verify-payment', { orderId: ORDER_15, status: 'SUCCESS' });
    const beforeDry: any[] = (await fetchResource('subscriptions')) || [];
    await saveResource('subscriptions', beforeDry.filter((s: any) => String(s?.sourceOrderId) !== ORDER_15));

    const dry = await post('/api/worldpay/repair-subscriptions', { dryRun: true, orders: ORDER_15 });
    const dryRow = (dry.body?.results || []).find((r: any) => r.orderId === ORDER_15);
    check('the dry run flags itself', dry.body?.dryRun === true, JSON.stringify(dry.body?.dryRun));
    check('it says a subscription would be created', dryRow?.status === 'would-create', JSON.stringify(dryRow));
    check('and creates nothing', !(await subscriptionFor(ORDER_15)));

    console.log('\n=== 22. Duplicates are reported and left untouched ===');
    const ORDER_16 = 'PS90017';
    const EMAIL_16 = 'harness.sixteen@pouch-supply.com';
    await post('/api/worldpay/session', checkoutBody(ORDER_16, EMAIL_16));
    await post('/api/worldpay/verify-payment', { orderId: ORDER_16, status: 'SUCCESS' });

    // Two billable subscriptions for one order: what repeated repairs against
    // the invisible-write race could have left behind.
    const withOne: any[] = (await fetchResource('subscriptions')) || [];
    const original = withOne.find((s: any) => String(s?.sourceOrderId) === ORDER_16);
    await saveResource('subscriptions', [{ ...original, id: `${original.id}_dupe` }, ...withOne]);

    const dupeRun = await post('/api/worldpay/repair-subscriptions', { orders: ORDER_16 });
    const dupeRow = (dupeRun.body?.results || []).find((r: any) => r.orderId === ORDER_16);
    check('two subscriptions for one order are reported as DUPLICATES', dupeRow?.status === 'DUPLICATES', JSON.stringify(dupeRow?.status));
    check('both are listed so a human can choose', (dupeRow?.billableRows || []).length === 2, JSON.stringify(dupeRow?.billableRows));

    const afterDupe: any[] = (await fetchResource('subscriptions')) || [];
    check(
      'neither is removed and no third is created',
      afterDupe.filter((s: any) => String(s?.sourceOrderId) === ORDER_16).length === 2,
      `${afterDupe.filter((s: any) => String(s?.sourceOrderId) === ORDER_16).length} subscriptions`
    );

    console.log('\n=== 23. An existing subscription is never created twice ===');
    const existingRun = await post('/api/worldpay/repair-subscriptions', { orders: ORDER_7 });
    const existingRow = (existingRun.body?.results || []).find((r: any) => r.orderId === ORDER_7);
    check('an order that already has its plan is reported ok', existingRow?.status === 'ok', JSON.stringify(existingRow));
    const stillOne: any[] = (await fetchResource('subscriptions')) || [];
    check('and still has exactly one', stillOne.filter((s: any) => String(s?.sourceOrderId) === ORDER_7).length === 1);

    console.log('\n=== 24. A new subscription is saved once, not twice ===');
    const ids = stillOne.map((s: any) => String(s?.id));
    check('no subscription id appears twice in the store', new Set(ids).size === ids.length, `${ids.length - new Set(ids).size} repeated id(s)`);

    console.log('\n=== 25. The repair cannot be triggered by a GET ===');
    const getAttempt = await realFetch(`${base}/api/worldpay/repair-subscriptions`);
    const getBody = await getAttempt.text();
    check('a GET does not run the repair', !/Examined \d+ order/.test(getBody), getBody.slice(0, 120));

    // A renewal identifies its payment by a GATEWAY reference, not by an order
    // id. Taking one for the other fabricated a £0 order under the default
    // customer, emailed the customer and the admin, and fired a Klaviyo
    // purchase event, while the real renewal order sat alongside it.
    console.log('\n=== 26. A renewal webhook never fabricates an order ===');
    const RENEWAL_REF = 'SUB-ORD-68520-2790';

    const beforeUnknown: any[] = (await fetchResource('orders')) || [];
    const unknownHook = await post('/api/worldpay/webhook', {
      eventId: 'evt-harness-unknown',
      eventDetails: { classification: 'payment', type: 'authorized', transactionReference: RENEWAL_REF }
    });
    check('a payment event for an unknown reference is accepted', unknownHook.status === 200, `status ${unknownHook.status}`);

    const afterUnknown: any[] = (await fetchResource('orders')) || [];
    check(
      'it creates NO order when nothing matches the reference',
      afterUnknown.length === beforeUnknown.length,
      `orders went ${beforeUnknown.length} -> ${afterUnknown.length}`
    );
    check(
      'and specifically no order is keyed by the gateway reference',
      !afterUnknown.some((o: any) => String(o?.id) === RENEWAL_REF),
      'an order was created with the transaction reference as its id'
    );

    // Now the real renewal order exists, carrying the reference the way the
    // renewal cron writes it: a fresh PS id, the reference in gatewayTxId.
    const RENEWAL_ORDER = 'PS90026';
    await saveResource('orders', [
      ...afterUnknown,
      {
        id: RENEWAL_ORDER,
        customerName: 'Harness Renewal',
        customerEmail: 'harness.renewal@pouch-supply.com',
        total: 5.7,
        paymentStatus: 'Paid',
        fulfillmentStatus: 'Unfulfilled',
        destination: 'United Kingdom',
        deliveryMethod: 'Royal Mail Tracked 24/48',
        date: 'Sep 16, 2026 at 10:36 AM',
        items: [],
        worldpayTxId: RENEWAL_REF,
        gatewayTxId: RENEWAL_REF,
        tags: ['Storefront', 'Subscription Order', 'Worldpay Recurring']
      }
    ]);

    const beforeMatch: any[] = (await fetchResource('orders')) || [];
    const matchHook = await post('/api/worldpay/webhook', {
      eventId: 'evt-harness-renewal',
      eventDetails: { classification: 'payment', type: 'authorized', transactionReference: RENEWAL_REF }
    });
    check('the renewal payment event is accepted', matchHook.status === 200, `status ${matchHook.status}`);

    const afterMatch: any[] = (await fetchResource('orders')) || [];
    check(
      'it matches the existing order by gatewayTxId instead of creating one',
      afterMatch.length === beforeMatch.length,
      `orders went ${beforeMatch.length} -> ${afterMatch.length}`
    );
    check(
      'the real renewal order is untouched and still £5.70',
      afterMatch.find((o: any) => String(o?.id) === RENEWAL_ORDER)?.total === 5.7,
      JSON.stringify(afterMatch.find((o: any) => String(o?.id) === RENEWAL_ORDER)?.total)
    );

    // Worldpay sends several paid-class events per payment (authorized, then
    // sentForSettlement). Each must be inert once the order is recorded Paid.
    const replay = await post('/api/worldpay/webhook', {
      eventId: 'evt-harness-renewal-2',
      eventDetails: { classification: 'payment', type: 'sentForSettlement', transactionReference: RENEWAL_REF }
    });
    check('a second paid event for the same payment is accepted', replay.status === 200);

    const afterRenewalReplay: any[] = (await fetchResource('orders')) || [];
    check(
      'replaying it still creates no order',
      afterRenewalReplay.length === beforeMatch.length,
      `orders went ${beforeMatch.length} -> ${afterRenewalReplay.length}`
    );
    check(
      'no placeholder customer order exists anywhere',
      !afterRenewalReplay.some((o: any) => String(o?.customerEmail || '') === 'customer@pouch-supply.com'),
      'a default-identity order was created'
    );
  } catch (err: any) {
    failures.push(`harness threw: ${err?.stack || err?.message || err}`);
    console.error('\n[verify] threw:', err);
  } finally {
    server.close();
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - ${f}`);
  }
  console.log('='.repeat(70));
  process.exit(failures.length ? 1 : 0);
}

main();
