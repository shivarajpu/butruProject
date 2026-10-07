/**
 * Ambient types for the `@env` module populated by `react-native-dotenv`.
 *
 * These values are injected at build time from the generated `.env.<client>`
 * file. See `clients/clients.json` for the source.
 *
 * TypeScript ambient module exports must be listed explicitly, they cannot use
 * an index signature — so adding a variable means adding it in three places:
 * `clients/clients.json`, `scripts/gen-env.js` and here.
 */

declare module '@env' {
  /** Id of the client this binary was built for, e.g. `butru`, `clienta`. */
  export const CLIENT_ID: string;
  export const APP_DISPLAY_NAME: string;
  export const APP_ANDROID_PACKAGE: string;
  export const APP_IOS_BUNDLE_ID: string;

  /** Backend base URL. One per client — there is no environment axis. */
  export const BASE_URL: string;
  export const EXPO_PUBLIC_API_URL: string;
  export const EXPO_PUBLIC_STORE_ID: string;
  export const EXPO_PUBLIC_STORE_SLUG: string;
  export const EXPO_PUBLIC_STORE_DOMAIN: string;
}
