/**
 * clientRegistry — the single loader every codegen script uses.
 *
 * Reads `clients/clients.json` (committed, non-secret) and merges any
 * `clients/secrets.json` (git-ignored, secret) on top of it, so API keys and
 * tokens never live in version control but every script still sees one
 * resolved client record.
 *
 * ── No environment axis ─────────────────────────────────────────────────────
 * A client is one row: one API base URL, one store identity, one icon. There is
 * deliberately no dev/staging/prod selector. An earlier revision had a three-tier
 * `environments` block, which multiplied every client into three build
 * combinations that nobody could all keep correct — the staging URL was
 * invented, not read from anywhere. One URL per client is what the app actually
 * had, so that is what the config models.
 *
 * Plain CommonJS on purpose: this file is required from Node scripts *and*
 * from `metro.config.js`, and must never pull in a transpiler.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const CLIENTS_FILE = path.join(ROOT, 'clients', 'clients.json');
const SECRETS_FILE = path.join(ROOT, 'clients', 'secrets.json');

const isPlainObject = (value) =>
  !!value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.prototype.toString.call(value) === '[object Object]';

/** Deep merge that treats arrays as replace-not-concat. */
function deepMerge(base, override) {
  if (!isPlainObject(base)) return override;
  if (!isPlainObject(override)) return base;

  const out = { ...base };
  for (const key of Object.keys(override)) {
    if (key.startsWith('$')) continue;
    if (isPlainObject(out[key]) && isPlainObject(override[key])) {
      out[key] = deepMerge(out[key], override[key]);
    } else {
      out[key] = override[key];
    }
  }
  return out;
}

function readJson(file, { optional = false } = {}) {
  if (!fs.existsSync(file)) {
    if (optional) return null;
    throw new Error(
      `[clientRegistry] Required file not found: ${path.relative(ROOT, file)}`,
    );
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(
      `[clientRegistry] Invalid JSON in ${path.relative(ROOT, file)}: ${err.message}`,
    );
  }
}

/** Builds the merged registry: clients.json overlaid with secrets.json. */
function loadRegistry() {
  const base = readJson(CLIENTS_FILE);
  const secrets = readJson(SECRETS_FILE, { optional: true });

  if (!isPlainObject(base.clients)) {
    throw new Error('[clientRegistry] clients.json must contain a "clients" object.');
  }

  const merged = { ...base };
  if (secrets && isPlainObject(secrets.clients)) {
    merged.clients = deepMerge(base.clients, secrets.clients);
  }
  if (secrets && secrets.defaultClient) {
    merged.defaultClient = secrets.defaultClient;
  }

  return merged;
}

function listClientIds(registry = loadRegistry()) {
  return Object.keys(registry.clients);
}

/**
 * Resolves one client into a flat, fully-defaulted record.
 * Throws loudly rather than emitting a half-broken build.
 */
function resolveClient(clientId, registry = loadRegistry()) {
  const id = (clientId || registry.defaultClient || '').trim();
  const client = registry.clients[id];

  if (!client) {
    throw new Error(
      `[clientRegistry] Unknown client "${id}". Known clients: ${listClientIds(registry).join(', ')}`,
    );
  }

  const appName = client.displayName;
  const androidAppId = client.android && client.android.applicationId;
  const iosBundleId = client.ios && client.ios.bundleId;

  const problems = [];
  if (!appName) problems.push('displayName');
  if (!androidAppId) problems.push('android.applicationId');
  if (!iosBundleId) problems.push('ios.bundleId');
  if (!client.android || client.android.applicationId !== iosBundleId) {
    // Not fatal, but almost always a copy-paste error worth surfacing.
    problems.push('NOTE: android.applicationId and ios.bundleId differ');
  }

  const baseUrl = (client.api && client.api.baseUrl) || '';
  if (!baseUrl) problems.push('api.baseUrl');

  if (problems.length) {
    throw new Error(
      `[clientRegistry] Client "${id}" is incomplete:\n  - ${problems.join('\n  - ')}`,
    );
  }


  // Gradle/xcodebuild flavour names must be plain lowercase alphanumerics.
  const flavor = id.toLowerCase().replace(/[^a-z0-9]/g, '');

  return {
    id,
    flavor,
    baseUrl,
    displayName: appName,
    description: client.description || '',
    android: {
      applicationId: androidAppId,
      versionCode: (client.android && client.android.versionCode) || 1,
      icon: (client.android && client.android.icon) || null,
    },
    ios: {
      bundleId: iosBundleId,
      teamId: (client.ios && client.ios.teamId) || '',
      icon: (client.ios && client.ios.icon) || null,
    },
    api: {
      baseUrl,
      storeSlug: (client.api && client.api.storeSlug) || '',
      storeDomain: (client.api && client.api.storeDomain) || '',
      storeId: (client.api && client.api.storeId) || '',
    },
    support: {
      phone: (client.support && client.support.phone) || '',
      email: (client.support && client.support.email) || '',
      responseTime: (client.support && client.support.responseTime) || '2-4 HRS',
      companyName: (client.support && client.support.companyName) || appName,
      address: (client.support && client.support.address) || '',
      mapQuery: (client.support && client.support.mapQuery) || '',
      supportEndpoint: (client.support && client.support.supportEndpoint) || '/api/support',
    },
    theme: client.theme || null,
    firebase: client.firebase || { enabled: false },
    raw: client,
  };
}

/**
 * Resolves the client for the current process from the environment.
 * Priority: explicit CLI arg > CLIENT_ID env var > registry default.
 * This is what babel.config.js and the Gradle/Xcode entry points call.
 */
function resolveFromEnv(registry = loadRegistry()) {
  const clientId =
    process.env.CLIENT_ID || process.env.RN_CLIENT_ID || registry.defaultClient;
  return resolveClient(clientId, registry);
}

function rel(absolutePath) {
  return path.relative(ROOT, absolutePath);
}

/**
 * The Metro port a client uses.
 *
 * `babel.config.js` resolves the client's `.env` file ONCE, when a bundler
 * starts, and `react-native-dotenv` inlines EXPO_PUBLIC_STORE_ID / SLUG into the
 * bundle from it. A Metro process is therefore permanently bound to one client's
 * store identity, so two clients sharing a server both get whichever client that
 * server was started with — the second app looks healthy and authenticates
 * against the wrong tenant.
 *
 * Ports are still per-client, but they are now READ FROM CONFIG rather than
 * derived from array position, which is what let them drift silently from what
 * anyone expected. Two things follow from that:
 *
 *   1. A client may pin its own port in clients.json (`"metroPort": 8081`), so
 *      the common case — one client on the standard port — is explicit instead
 *      of an accident of ordering. Adding a client no longer silently renumbers
 *      the others.
 *   2. A registry-level `defaultMetroPort` shifts them together, and
 *      `clients/secrets.json` (git-ignored) can override per-developer without
 *      touching the committed file.
 *
 * Sharing one port between two clients that are meant to run at the SAME time
 * still does not work; `scripts/run.js` refuses it via the port-ownership
 * marker. What sharing the port does buy is that switching clients needs no
 * port bookkeeping: stop one, start the other, both are on 8081.
 *
 * `scripts/run.js` starts the bundler here and `scripts/generators/ios.js`
 * bakes the same number into the target, so the app looks where the server is.
 */
function metroPort(clientId, registry = loadRegistry()) {
  const client = registry.clients[clientId] || {};
  const explicit = Number(client.metroPort);
  if (Number.isInteger(explicit) && explicit >= 1024 && explicit <= 65535) {
    return explicit;
  }

  const fallback = Number(registry.defaultMetroPort);
  if (Number.isInteger(fallback) && fallback >= 1024 && fallback <= 65535) {
    return fallback;
  }

  const ids = Object.keys(registry.clients);
  const index = ids.indexOf(clientId);
  return 8081 + (index === -1 ? 0 : index);
}

module.exports = {
  ROOT,
  CLIENTS_FILE,
  SECRETS_FILE,
  deepMerge,
  loadRegistry,
  listClientIds,
  resolveClient,
  resolveFromEnv,
  metroPort,
  rel,
};
