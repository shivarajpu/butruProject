#!/usr/bin/env node
/**
 * sync-clients-all — regenerate artifacts for EVERY client.
 *
 * Useful for:
 *   • CI validation — catches a typo in client #37 before you try to build it
 *   • warming the build cache so per-client builds are faster
 *   • confirming that adding one client did not break another
 *
 * It writes each combination and then restores the default client, so your
 * working tree is left exactly as the developer expects.
 *
 *   npm run clients:sync:all
 */

'use strict';

const { spawnSync } = require('child_process');
const path = require('path');
const { ROOT, loadRegistry, listClientIds, resolveClient } = require('./lib/clientRegistry');

const SYNC = path.join(ROOT, 'scripts', 'sync-clients.js');

function main() {
  const registry = loadRegistry();
  const clients = listClientIds(registry);

  let failures = 0;
  const failed = [];

  console.log(`\nValidating ${clients.length} clients\n`);

  for (const clientId of clients) {
    try {
      resolveClient(clientId, registry);
      const res = spawnSync(
        process.execPath,
        [SYNC, '--client', clientId, '--quiet'],
        { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' },
      );
      if (res.status !== 0) {
        failures += 1;
        failed.push(clientId);
        console.log(`  ✗ ${clientId.padEnd(12)} ${(res.stderr || '').trim().split('\n').pop()}`);
      } else {
        console.log(`  ✓ ${clientId.padEnd(12)} ${registry.clients[clientId].displayName}`);
      }
    } catch (err) {
      failures += 1;
      failed.push(clientId);
      console.log(`  ✗ ${clientId.padEnd(12)} ${err.message.split('\n').slice(1).join(' ').trim()}`);
    }
  }

  // Leave the tree on the default client.
  spawnSync(process.execPath, [SYNC, '--quiet'], {
    cwd: ROOT,
    stdio: 'ignore',
  });

  console.log('');
  if (failures) {
    console.error(`✗ ${failures} combination(s) failed: ${failed.join(', ')}\n`);
    process.exit(1);
  }
  console.log(`✓ all ${clients.length} clients are valid\n`);
}

main();
