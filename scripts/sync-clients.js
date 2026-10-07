#!/usr/bin/env node
/**
 * sync-clients — regenerate every per-client artifact from `clients/clients.json`.
 *
 * This is the ONLY command you run when adding or changing a client.
 *
 *   npm run clients:sync                          # the default client
 *   npm run clients:sync -- --client clienta      # a specific client
 *   npm run clients:sync -- -c clienta            # shorthand
 *   npm run clients:sync -- --list                # show every client
 *   npm run clients:sync -- --check               # validate only, write nothing
 *
 * Targets (each one is idempotent — re-running is always safe):
 *   1. .env.<client>                              → api/config per client
 *   2. src/config/clients/active.ts                → brand/theme/tenant overrides
 *   3. android/app/build.gradle                    → productFlavors block   (Phase 3)
 *   4. android/app/src/<flavor>/…                  → strings/colors/icons   (Phase 3)
 *   5. ios/Config/Clients/<client>.xcconfig        → bundle id/name/icon    (Phase 4)
 *   6. ios/Config/Client.xcconfig                  → the active one        (Phase 4)
 *
 * Everything it writes into `android/` and `ios/` sits either in a dedicated
 * source set or in a clearly marked block, so nothing hand-written is clobbered.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {
  ROOT,
  loadRegistry,
  listClientIds,
  resolveClient,
  rel,
} = require('./lib/clientRegistry');
const { writeEnvFiles } = require('./gen-env');

function parseArgs(argv) {
  const args = { client: null, list: false, check: false, quiet: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--list' || a === '-l') args.list = true;
    else if (a === '--check') args.check = true;
    else if (a === '--quiet' || a === '-q') args.quiet = true;
    else if (a === '--client' || a === '-c') args.client = argv[++i];
    else if (a.startsWith('--client=')) args.client = a.split('=')[1];
    else if (a.startsWith('--env') || a === '-e') {
      // Previously accepted a dev/staging/prod axis. There is one environment
      // now, so fail loudly instead of quietly building with 'dev' assumptions.
      throw new Error(
        '[clients] --env has been removed. A client has exactly one API.\n' +
          '  Use: npm run clients:sync -- --client <id>',
      );
    } else if (!a.startsWith('-') && !args.client) args.client = a;
  }
  return args;
}

const log = (args, msg) => {
  if (!args.quiet) console.log(msg);
};

// ── Target 2: src/config/clients/active.ts ───────────────────────────────────

function buildOverrides(resolved) {
  const theme = resolved.theme || {};
  return {
    appName: resolved.displayName,
    api: {
      storeSlug: resolved.api.storeSlug,
      storeDomain: resolved.api.storeDomain,
      storeId: resolved.api.storeId,
    },
    support: {
      phone: resolved.support.phone,
      email: resolved.support.email,
      responseTime: resolved.support.responseTime,
      companyName: resolved.support.companyName,
      address: resolved.support.address,
      mapQuery: resolved.support.mapQuery,
      supportEndpoint: resolved.support.supportEndpoint,
    },
    ...(theme.light || theme.dark
      ? {
          colors: {
            ...(theme.light ? { light: theme.light } : {}),
            ...(theme.dark ? { dark: theme.dark } : {}),
          },
        }
      : {}),
  };
}

function renderActive(resolved) {
  const overrides = buildOverrides(resolved);
  return `/* eslint-disable */
/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AUTO-GENERATED — DO NOT EDIT. Regenerate with:
 *      npm run clients:sync -- --client ${resolved.id}
 *  Source: clients/clients.json → clients.${resolved.id}
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Holds ONLY the client currently being built, so each binary ships exactly one
 * tenant's branding and no one else's. Anything not listed here falls through
 * to \`src/config/app_config.ts\`.
 */

import type { AppConfig } from '../../theme/types';

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export const CLIENT_OVERRIDES: DeepPartial<AppConfig> = ${JSON.stringify(
    overrides,
    null,
    2,
  )};

const ACTIVE_CLIENT_ID = '${resolved.id}';

export default ACTIVE_CLIENT_ID;
`;
}

function writeActive(resolved, { check } = {}) {
  const file = path.join(ROOT, 'src', 'config', 'clients', 'active.ts');
  const next = renderActive(resolved);
  if (check) return file;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next, 'utf8');
  return file;
}

// ── Target 3: clients/active.json ────────────────────────────────────────────

/**
 * The machine-readable build record that BOTH native build systems read.
 *
 * `android/app/build.gradle` parses this to pick cleartext traffic, version
 * suffix and the app-name resource. `ios/Config/Clients/*.xcconfig` is written
 * from the same data. That means neither Gradle nor Xcode needs any -P flags or
 * environment plumbing from CI — they just read one generated file, which keeps
 * JS, Android and iOS from ever disagreeing about which client is building.
 */
function writeActiveJson(resolved, { check } = {}) {
  const file = path.join(ROOT, 'clients', 'active.json');
  const next = `${JSON.stringify(
    {
      id: resolved.id,
      flavor: resolved.flavor,
      baseUrl: resolved.baseUrl,
      displayName: resolved.displayName,
      android: resolved.android,
      ios: resolved.ios,
    },
    null,
    2,
  )}\n`;
  if (!check) fs.writeFileSync(file, next, 'utf8');
  return file;
}

// ── Optional targets wired up in later phases ────────────────────────────────

function writeAndroid(resolved, { check, args }) {
  const gen = require('./generators/android');
  return gen.generate({ resolved, check, log: (m) => log(args, m) });
}

function writeIos(resolved, { check, args }) {
  const gen = require('./generators/ios');
  return gen.generate({ resolved, check, log: (m) => log(args, m) });
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv.slice(2));
  const registry = loadRegistry();

  if (args.list) {
    console.log('\nClients:');
    listClientIds(registry).forEach((id) => {
      const c = registry.clients[id];
      const mark = id === registry.defaultClient ? ' (default)' : '';
      console.log(
        `  ${id.padEnd(12)} ${c.displayName.padEnd(14)} ${c.android.applicationId}${mark}`,
      );
      console.log(
        `  ${' '.repeat(12)} ${''.padEnd(14)} ${c.ios.bundleId} (iOS)`,
      );
    });
    console.log('\nAdd a client: edit clients/clients.json, then npm run clients:sync');
    console.log('');
    return;
  }

  const clientId = args.client || registry.defaultClient;
  const resolved = resolveClient(clientId, registry);

  if (!args.quiet) {
    console.log('');
    console.log(`  ${BANNER_LINE()}`);
    console.log(`  client : ${resolved.id}  (${resolved.displayName})`);
    console.log(`  api    : ${resolved.baseUrl}`);
    console.log(`  android: ${resolved.android.applicationId}`);
    console.log(`  ios    : ${resolved.ios.bundleId}`);
    console.log(`  ${BANNER_LINE()}`);
    console.log('');
  }

  if (args.check) {
    console.log('✓ clients.json is valid — no files written (--check)');
    return;
  }

  const written = [];

  written.push(...writeEnvFiles(resolved));
  log(args, `  env      → ${rel(written[0])}`);

  written.push(writeActive(resolved));
  log(args, `  types    → ${rel(written[written.length - 1])}`);

  written.push(writeActiveJson(resolved));
  log(args, `  native   → ${rel(written[written.length - 1])}`);

  written.push(...writeAndroid(resolved, { check: args.check, args }));
  written.push(...writeIos(resolved, { check: args.check, args }));

  if (args.quiet) return;

  console.log('');
  console.log('  Next:');
  console.log(`    npm run android  -- --client ${resolved.id}`);
  console.log(`    npm run ios      -- --client ${resolved.id}`);
  console.log('');
}

function BANNER_LINE() {
  return '─'.repeat(56);
}

try {
  main();
} catch (err) {
  console.error(`\n✗ ${err.message}\n`);
  process.exit(1);
}
