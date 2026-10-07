/**
 * Per-client config resolver.
 *
 * ── How it works ────────────────────────────────────────────────────────────
 * `clients/clients.json` is the single source of truth. `npm run clients:sync`
 * (or any `npm run android:*` / `ios:*` command) generates exactly ONE file:
 *
 *     src/config/clients/active.ts   ← git-ignored, per-build
 *
 * It contains the overrides for the client currently being built and nothing
 * else. This is deliberate: if every client's config were bundled into every
 * binary, decompiling Client A's APK would leak Client B's store slug and
 * brand. One active client per bundle also means the bundle size does not grow
 * as you onboard more tenants.
 *
 * `BASE_APP_CONFIG` in `src/config/app_config.ts` stays the fallback layer, so
 * the app still runs (with today's Butru defaults) if a client never overrides
 * a key.
 *
 * ── Adding a client ─────────────────────────────────────────────────────────
 * You do not edit any file in this folder. Add a block to `clients/clients.json`
 * and run `npm run clients:sync`.
 */

import APP_CONFIG_BASE from '../app_config';
import type { AppConfig } from '../../theme/types';
import { CLIENT_ID } from '@env';
import ACTIVE_CLIENT_ID, { CLIENT_OVERRIDES } from './active';

/**
 * Recursive merge used to layer a client's overrides onto the base config.
 * Arrays are replaced, never concatenated.
 */
function mergeConfig<T>(base: T, override: unknown): T {
  if (override === undefined || override === null) return base;
  if (Array.isArray(override)) return override as unknown as T;
  if (typeof override !== 'object') return override as T;
  if (typeof base !== 'object' || base === null) return override as T;

  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    out[key] = mergeConfig(out[key], value);
  }
  return out as T;
}

/**
 * The fully-resolved config for the client this binary was built for.
 * Downstream (themeSlice, useAppTheme, apiService, storefront/bridge) reads
 * this and nothing else.
 */
export const APP_CONFIG: AppConfig = mergeConfig(
  APP_CONFIG_BASE,
  CLIENT_OVERRIDES,
);

/** Id of the client this binary was compiled for. */
export const BUILD_CLIENT_ID: string = ACTIVE_CLIENT_ID;

/**
 * Runtime guard against a stale build. If `.env` was generated for one client
 * but `active.ts` for another, the bundle would ship the wrong branding — so we
 * shout about it during development instead of shipping silently.
 */
if (__DEV__ && CLIENT_ID && CLIENT_ID !== ACTIVE_CLIENT_ID) {
  console.warn(
    `[config] MISMATCH — env file is for "${CLIENT_ID}" but active.ts is for ` +
      `"${ACTIVE_CLIENT_ID}". Run: npm run clients:sync -- --client ${CLIENT_ID}`,
  );
}

export default APP_CONFIG;
