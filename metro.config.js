const os = require('os');
const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { FileStore } = require('metro-cache');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * ── Why the cache is per-client ─────────────────────────────────────────────
 * Metro caches each module's transformed output on disk, and the cache key is
 * derived from the file contents plus the babel transformer — NOT from the env
 * file. `babel.config.js` bakes `EXPO_PUBLIC_STORE_ID` and friends into the
 * bundle at transform time, so two clients transforming the same source file
 * produce different output from an identical cache key.
 *
 * Left alone, Client A's bundler can be served Butru's cached transform of the
 * exact module that reads the store id — a silent cross-tenant leak that looks
 * like "the env file is being ignored". Pointing each client at its own cache
 * directory removes the possibility instead of relying on someone remembering
 * `--reset-cache`.
 *
 * The directory is keyed by CLIENT_ID, which `scripts/run.js` exports to the
 * bundler. Unknown id falls back to `default` rather than sharing a directory.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const clientId = process.env.CLIENT_ID || 'default';

const config = {
  cacheStores: () => [
    new FileStore({
      root: path.join(os.tmpdir(), `metro-cache-${clientId}`),
    }),
  ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);