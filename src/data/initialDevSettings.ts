import { DevSettings } from '../types';

/**
 * Developer settings for a fresh store: nothing is injected into the
 * storefront until the merchant adds and enables it. (Anything enabled here
 * runs on every page of the live site.)
 */
export const DEFAULT_DEV_SETTINGS: DevSettings = {
  customCss: `/* Custom CSS — applies to the whole storefront when enabled. */
`,
  customCssEnabled: false,

  customJs: `// Custom JavaScript — runs on every storefront page when enabled.
`,
  customJsEnabled: false,

  customHeadCode: `<!-- Extra tags for <head>, e.g. site verification meta tags -->
`,
  customHeadEnabled: false,

  customBodyCode: `<!-- Extra markup appended to <body> -->
`,
  customBodyEnabled: false,

  snippets: [],

  integrations: {
    googleAnalyticsId: '',
    googleAnalyticsEnabled: false,
    googleTagManagerId: '',
    googleTagManagerEnabled: false,
    metaPixelId: '',
    metaPixelEnabled: false,
    tikTokPixelId: '',
    tikTokPixelEnabled: false,
    microsoftClarityId: '',
    microsoftClarityEnabled: false,
    hotjarSiteId: '',
    hotjarEnabled: false,
    customWebhookUrl: '',
    customWebhookEnabled: false
  },

  updatedAt: new Date().toISOString()
};
