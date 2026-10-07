/**
 * Env generator — writes the per-client `.env` files that `react-native-dotenv`
 * consumes, and is the reason one codebase can ship many different APIs.
 *
 * Why a generated file instead of the committed `.env`:
 * `babel.config.js` resolves `path` once per Metro/bundle process, so the env
 * file it reads is fixed for the whole build. Generating it right before the
 * build is what lets `--client clienta` swap BASE_URL without touching source.
 *
 * One file per client (`.env.<client>`), not one per client x environment. A
 * client has exactly one API, so a second axis here would only create files
 * nobody edits correctly.
 *
 * Priority for every variable (highest last):
 *   1. clients/clients.json  (committed defaults)
 *   2. clients/secrets.json   (git-ignored secrets, if present)
 *   3. process.env            (CI / EAS secret overrides)
 *
 * Step 3 only accepts keys the client already declares, which stops a stray
 * ambient variable from silently leaking into a shipped bundle.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { ROOT, resolveClient, loadRegistry } = require('./lib/clientRegistry');

const ENV_PREFIX = '.env.';

/** Variables injected into every build so native code + debuggers can read them. */
function injectedMeta(resolved) {
  return {
    CLIENT_ID: resolved.id,
    APP_DISPLAY_NAME: resolved.displayName,
    APP_ANDROID_PACKAGE: resolved.android.applicationId,
    APP_IOS_BUNDLE_ID: resolved.ios.bundleId,
    EXPO_PUBLIC_API_URL: resolved.baseUrl,
    EXPO_PUBLIC_STORE_ID: resolved.api.storeId,
    EXPO_PUBLIC_STORE_SLUG: resolved.api.storeSlug,
    EXPO_PUBLIC_STORE_DOMAIN: resolved.api.storeDomain,
  };
}

function sanitize(value) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\r?\n/g, '\\n').replace(/"/g, '\\"');
}

function renderEnv(resolved) {
  const vars = { BASE_URL: resolved.baseUrl };

  // process.env may override BASE_URL in CI, but nothing else is accepted, so a
  // stray ambient variable cannot leak into a shipped bundle.
  if (process.env.BASE_URL) vars.BASE_URL = process.env.BASE_URL;
  const declared = Object.keys(vars);

  const lines = [
    '# ─────────────────────────────────────────────────────────────────────────',
    `# AUTO-GENERATED for client "${resolved.id}".`,
    '# DO NOT EDIT and DO NOT COMMIT — regenerate with: npm run clients:sync',
    '# ─────────────────────────────────────────────────────────────────────────',
    '',
    '# Build identity (read by src/config/clients/index.ts + native config)',
    ...Object.entries(injectedMeta(resolved)).map(
      ([k, v]) => `${k}="${sanitize(v)}"`,
    ),
    '',
    '# API',
    ...declared.map((key) => `${key}="${sanitize(vars[key])}"`),
    '',
  ];
  return lines.join('\n');
}

/**
 * Writes `.env.<client>` and nothing else.
 *
 * There is deliberately no `.env.build` alias any more. It existed because the
 * bundle step runs `node` from inside the Gradle daemon, which cannot be handed
 * an env var, so a fixed-path copy seemed necessary. It is not: `babel.config.js`
 * reads the client id out of `clients/active.json` — the same build record
 * `build.gradle` and the xcconfigs already read — and opens the right per-client
 * file. One record, one env file per client, nothing that can drift.
 */
function writeEnvFiles(resolved) {
  const file = path.join(ROOT, `${ENV_PREFIX}${resolved.id}`);
  fs.writeFileSync(file, renderEnv(resolved), 'utf8');
  return [file];
}

module.exports = { writeEnvFiles, renderEnv, injectedMeta, ENV_PREFIX };

/* istanbul ignore next -- CLI entry */
if (require.main === module) {
  const registry = loadRegistry();
  const clientArg = process.argv[2];

  const list = Object.keys(registry.clients);
  if (clientArg === '--list' || !clientArg) {
    console.log('Usage: node scripts/gen-env.js <clientId>');
    console.log('\nKnown clients:');
    list.forEach((id) => {
      console.log(`  ${id.padEnd(12)} ${registry.clients[id].displayName}`);
    });
    process.exit(0);
  }

  const resolved = resolveClient(clientArg, registry);
  const files = writeEnvFiles(resolved);
  files.forEach((f) => console.log(`✓ ${path.relative(ROOT, f)}`));
}
