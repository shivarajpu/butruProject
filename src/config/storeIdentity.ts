/**
 * Store identity for auth requests.
 *
 * `login` and `register` are tenant-scoped: the backend rejects the request with
 * `ACCOUNT_NOT_ON_STORE` when `storeId` belongs to a different flavour.
 *
 * ── Where the identity comes from ────────────────────────────────────────────
 * The binary itself knows its client: native build bakes `CLIENT_STORE_ID` /
 * `CLIENT_STORE_SLUG` into Info.plist (iOS) or flavor resources (Android), and
 * exposes them through a native module. We read THAT first, because the bundle
 * value can lie: `.env.<client>` is inlined at bundle time by whichever Metro
 * owns port 8081, and with every flavour sharing that port, another client's
 * Metro can serve a stale bundle (a clienta app running from butru's bundle
 * looks exactly like butru). Baked-in identity never changes no matter which
 * Metro served the JS.
 *
 * The `@env` value is the fallback (release bundles are baked per client, so
 * they agree with native anyway). In development, a disagreement is surfaced
 * loudly instead of silently mis-registering the user against the wrong store.
 *
 * ── Why there is no silent fallback ──────────────────────────────────────────
 * If neither native nor env can produce a store id, falling back to Butru's
 * storeId would register users against the wrong tenant while looking healthy.
 * A silent wrong-tenant default is worse than a loud crash, so a missing id is
 * an explicit error in development.
 */

import { Platform, NativeModules, Settings } from 'react-native';
import { EXPO_PUBLIC_STORE_ID, EXPO_PUBLIC_STORE_SLUG } from '@env';
import APP_CONFIG from './clients';

const NATIVE_KEY = 'ButruClientStoreId';
const NATIVE_SLUG_KEY = 'ButruClientStoreSlug';

/**
 * Store id/slug baked into the binary (not the bundle). iOS exposes it through
 * NSUserDefaults via the Settings module; Android through a tiny native module
 * reading flavor string resources.
 */
const nativeIdentity = (): { storeId?: string; storeSlug?: string } => {
  try {
    if (Platform.OS === 'ios') {
      return {
        storeId: Settings.get(NATIVE_KEY),
        storeSlug: Settings.get(NATIVE_SLUG_KEY),
      };
    }
    if (Platform.OS === 'android') {
      const mod = NativeModules.ButruClientConfig;
      return {
        storeId: mod?.getConstants?.().storeId,
        storeSlug: mod?.getConstants?.().storeSlug,
      };
    }
  } catch {
    // Native layer (or the test harness) does not expose it — fall through to
    // the bundle value.
  }
  return {};
};

const pick = (envValue: string | undefined, fallback: string, name: string): string => {
  const trimmed = (envValue ?? '').trim();
  if (trimmed.length > 0) return trimmed;

  if (__DEV__) {
    throw new Error(
      `[config] ${name} is empty, so this bundle cannot identify its store.\n` +
        '  Expected it to be inlined from .env.<client> at bundle time.\n' +
        '  Fix: npm run clients:sync -- --client <id>, then rebuild with\n' +
        '  npm run ios -- --client <id>. Also stop any Metro started without\n' +
        '  --client; a bundler from another client serves the wrong store id.',
    );
  }

  console.warn(`[config] ${name} missing — falling back to ${fallback}`);
  return fallback;
};

const resolve = (
  envValue: string | undefined,
  nativeValue: string | undefined,
  fallback: string,
  name: string,
): string => {
  const native = (nativeValue ?? '').trim();

  if (native.length > 0) {
    if (__DEV__ && envValue?.trim() && envValue.trim() !== native) {
      console.warn(
        `[config] ${name} — binary is "${native}" but the bundle (Metro) said ` +
          `"${envValue.trim()}". Using the binary's baked-in identity. A Metro ` +
          `from another client is serving this app's bundle.`,
      );
    }
    return native;
  }

  return pick(envValue, fallback, name);
};

const { storeId, storeSlug } = nativeIdentity();

export const STORE_ID: string = resolve(
  EXPO_PUBLIC_STORE_ID,
  storeId,
  APP_CONFIG.api.storeId,
  'EXPO_PUBLIC_STORE_ID',
);

export const STORE_SLUG: string = resolve(
  EXPO_PUBLIC_STORE_SLUG,
  storeSlug,
  APP_CONFIG.api.storeSlug,
  'EXPO_PUBLIC_STORE_SLUG',
);