#!/usr/bin/env node
/**
 * run — the one entrypoint for every per-client dev command.
 *
 *   node scripts/run.js <target> [--client <id>] [--release] [extra args]
 *
 * Why this exists: `babel.config.js` resolves the env file once per process, and
 * the native bundlers inherit the environment from whatever spawned them. So
 * the ONLY way to guarantee a build picks up the right client is to set
 * CLIENT_ID / CLIENT_ENV_FILE in the environment of the process that actually
 * bundles. `run` syncs first, exports those, then spawns the target — the same
 * way it will behave on CI and on EAS.
 *
 * ── Why one client at a time on one Metro port ───────────────────────────────
 * Because that env file is resolved ONCE, when the bundler starts, a Metro
 * server is permanently bound to one client's store identity. Two clients
 * sharing one server both get whichever client that server was started with —
 * which is why the wrong storeId used to reach the register/login payload, and
 * why reloading one app reloaded the other.
 *
 * All clients are therefore configured on ONE port (`metroPort`, read from
 * clients/clients.json), and only one of them can be bundled at a time. Each
 * command reclaims that port: if another client's Metro holds it, that server
 * is stopped and a fresh one is started for the requested client. Reusing the
 * old server is never an option — it is the silent cross-tenant failure the
 * original per-client port scheme existed to prevent.
 *
 * Note the one remaining switch: `--release`. That is an Android/iOS *build
 * type*, not an environment — a store build of Client A still talks to Client
 * A's single production API. Debug vs release changes minification and
 * signing, never which backend you hit.
 *
 * Targets:
 *   sync              regenerate per-client artifacts, then stop
 *   metro             start Metro for the selected client
 *   android           build + install on a device/emulator (debuggable)
 *   android-bundle    produce the JS bundle only (release-style)
 *   ios               build + install on the simulator
 *   android-release   assemble the store artifact (AAB/APK) — Phase 10
 *   ios-archive       archive for App Store — Phase 11
 *
 * Anything after `--` is forwarded verbatim to the underlying tool, e.g.
 *   npm run android -- --client clienta -- --device emulator-5554
 */

'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const http = require('http');
const { spawn, spawnSync } = require('child_process');
const { loadRegistry, resolveClient, metroPort, ROOT } = require('./lib/clientRegistry');

const RN = path.join(ROOT, 'node_modules', 'react-native', 'cli.js');

function parseArgs(argv) {
  const out = {
    target: argv[0] && !argv[0].startsWith('-') ? argv[0] : null,
    client: null,
    release: false,
    port: null,
    rest: [],
  };
  for (let i = out.target ? 1 : 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--client' || a === '-c') {
      const value = argv[++i];
      if (!value || value.startsWith('-')) {
        throw new Error(`[run] ${a} needs a client id. Known: ${listIds()}`);
      }
      out.client = value;
    } else if (a === '--release') out.release = true;
    else if (a.startsWith('--client=')) out.client = a.split('=')[1];
    else if (a === '--port' || a === '-p') {
      const value = argv[++i];
      const parsed = Number(value);
      if (!value || value.startsWith('-') || !Number.isInteger(parsed) || parsed < 1024) {
        throw new Error(`[run] --port needs a TCP port number. Got: ${value}`);
      }
      out.port = parsed;
    } else if (a.startsWith('--port=')) {
      const parsed = Number(a.split('=')[1]);
      if (!Number.isInteger(parsed) || parsed < 1024) {
        throw new Error(`[run] --port needs a TCP port number. Got: ${a.split('=')[1]}`);
      }
      out.port = parsed;
    } else if (a.startsWith('--env') || a === '-e') {
      throw new Error(
        '[run] --env has been removed. A client has exactly one API.\n' +
          "  Use: npm run android -- --client <id> [--release]",
      );
    } else if (a.startsWith('-')) {
      // Anything else is left for the passthrough, but a flag that clearly
      // wanted a value and did not get one must not be silently dropped.
      throw new Error(`[run] Unrecognised option "${a}".\n${USAGE}`);
    } else out.rest.push(a);
  }
  return out;
}

/** Client ids, for error messages — a bad id should say what the good ones are. */
function listIds() {
  return Object.keys(loadRegistry().clients).join(', ');
}

/**
 * Drops any passthrough --port so the resolved one always wins.
 *
 * `--port` is now parsed by parseArgs rather than forwarded, so by the time a
 * value reaches the underlying bundler it is the single port chosen above —
 * never a second one that disagrees with it.
 */
function stripPort(args) {
  const out = [];
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--port') {
      i += 1;
      continue;
    }
    if (a.startsWith('--port=')) continue;
    out.push(a);
  }
  return out;
}

/** GETs a path on a Metro dev server. Resolves '' on any failure — callers probe. */
function httpGet(httpPath, port, timeout = 3000) {
  return new Promise(resolve => {
    const req = http.get({ host: '127.0.0.1', port, path: httpPath, timeout }, res => {
      let body = '';
      res.on('data', chunk => {
        body += chunk;
      });
      res.on('end', () => resolve(res.statusCode === 200 ? body : ''));
    });
    req.on('timeout', () => {
      req.destroy();
      resolve('');
    });
    req.on('error', () => resolve(''));
  });
}

/** True when the thing on the port answers like a Metro dev server. */
function metroReady(port, timeout = 1500) {
  return new Promise(async resolve => {
    const body = await httpGet('/status', port, timeout);
    resolve(body.includes('packager-status:running'));
  });
}

/**
 * Where a Metro we started records which client it is bound to.
 *
 * A dev server cannot be asked "who are you?" over HTTP, so without this file
 * there is no way to tell a healthy Butru Metro from a healthy Client A one that
 * happens to occupy the same port. Reusing the wrong one is the silent
 * cross-tenant failure this whole per-client scheme exists to prevent, and it
 * is invisible until a login is rejected for the wrong store.
 */
function metroMarkerPath(port) {
  return path.join(os.tmpdir(), `metro-client-${port}.json`);
}

function writeMetroMarker(port, clientId) {
  try {
    fs.writeFileSync(
      metroMarkerPath(port),
      JSON.stringify({ client: clientId, port, pid: process.pid, at: Date.now() }),
      'utf8',
    );
  } catch {
    // A missing marker only costs us the ownership check; never fail the build.
  }
}

/** The client id recorded for a port, or null when unknown/stale. */
function readMetroMarker(port) {
  try {
    const parsed = JSON.parse(fs.readFileSync(metroMarkerPath(port), 'utf8'));
    return parsed && typeof parsed.client === 'string' ? parsed.client : null;
  } catch {
    return null;
  }
}

function clearMetroMarker(port) {
  try {
    fs.unlinkSync(metroMarkerPath(port));
  } catch {
    // Nothing to clear.
  }
}

/** PIDs listening on a port. [] when lsof is unavailable. */
function pidsOnPort(port) {
  const res = spawnSync('lsof', ['-nP', '-iTCP:' + port, '-sTCP:LISTEN', '-t'], {
    encoding: 'utf8',
  });
  if (res.status !== 0 || !res.stdout) return [];
  return [...new Set(res.stdout.split('\n').map(s => s.trim()).filter(Boolean))];
}

/**
 * Frees a port so this client's own Metro can take it.
 *
 * Both clients are configured on 8081, so they share it *sequentially*: run
 * Butru, stop it, run Client A. Only one bundler can hold a port, and a
 * bundler is permanently bound to the client it was started with — its env
 * file is resolved once at startup and inlined into every module it serves.
 *
 * So switching clients has to mean: stop the old server, start a fresh one.
 * Reusing the old one is the failure this whole scheme exists to prevent — the
 * second app builds happily and authenticates against the first client's
 * tenant, which surfaces only as an unexplained ACCOUNT_NOT_ON_STORE error.
 *
 * Killing is restricted to a server we can attribute to a *different* client,
 * or to one we own but can no longer confirm is healthy.
 */
async function freePortFor(port, clientId) {
  const owner = readMetroMarker(port);
  const ours = owner === clientId;

  // Ours and healthy: leave it alone, the caller reuses it.
  if (ours && (await metroReady(port))) return;

  const listening = pidsOnPort(port);
  if (listening.length === 0) {
    clearMetroMarker(port);
    return; // Nothing there; nothing to reclaim.
  }

  if (!ours) {
    // A port we can't attribute to this client might not be a bundler at all.
    // Only a Metro is safe to displace, so anything else belongs to some other
    // program and should be reported rather than killed.
    if (!(await metroReady(port))) {
      throw new Error(
        `[run] Port ${port} is taken by something that is not a Metro dev server.\n` +
          `  Client "${clientId}" needs ${port}. Stop whatever is using it:\n` +
          `    lsof -ti:${port} | xargs kill -9`,
      );
    }
  }

  console.log(
    `  stopping Metro on ${port} (serving "${owner || 'an unidentified client'}") ` +
      `so "${clientId}" can take it`,
  );

  listening.forEach(pid => {
    spawnSync('kill', [pid], { stdio: 'ignore' });
  });

  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline && pidsOnPort(port).length > 0) {
    await sleep(300);
  }

  const stubborn = pidsOnPort(port);
  if (stubborn.length) {
    stubborn.forEach(pid => {
      spawnSync('kill', ['-9', pid], { stdio: 'ignore' });
    });
    const grace = Date.now() + 5_000;
    while (Date.now() < grace && pidsOnPort(port).length > 0) await sleep(300);
  }

  clearMetroMarker(port);

  if (pidsOnPort(port).length) {
    throw new Error(
      `[run] Could not free port ${port} for "${clientId}".\n` +
        `  Stop it yourself, then re-run:\n` +
        `    lsof -ti:${port} | xargs kill -9`,
    );
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * First non-empty line of tool output.
 *
 * `simctl` in particular stacks a generic header, the real cause and a
 * duplicated trailing line, so pasting its stderr verbatim buries the one line
 * that says what went wrong.
 */
function firstLine(text) {
  return String(text || '')
    .split('\n')
    .map(line => line.trim())
    .find(Boolean) || '';
}

/**
 * Makes sure a Metro for THIS client is listening before a debug build runs.
 *
 * Each client owns a port, so `npm run start` (no --client, i.e. Butru on 8081)
 * leaves a Client A build on 8082 with nothing behind it — the app then fails
 * with "No script URL provided" while the bundler the developer *did* start sits
 * there perfectly healthy on a different port. Requiring `--client` on both
 * commands is a footgun that reliably produces exactly that confusion.
 *
 * So: if this client's port is already serving *for this client*, use it. If a
 * different client's Metro holds it, that one is stopped first — both clients
 * share one port, so switching means rebinding, not reusing. Only the selected
 * client's port is ever touched.
 */
async function ensureMetro(clientEnv, port, label) {
  if (await metroReady(port) && readMetroMarker(port) === label) {
    console.log(`  metro ${port} already serving "${label}" — reusing it`);
    return;
  }

  // Reclaims the port when another client owns it, and throws when something
  // that is not a Metro is squatting on it.
  await freePortFor(port, label);

  console.log(`  metro ${port} not running — starting one for "${label}"`);

  const child = spawn(
    process.execPath,
    [RN, 'start', '--port', String(port)],
    { cwd: ROOT, env: clientEnv, detached: true, stdio: 'ignore' },
  );
  child.unref();
  writeMetroMarker(port, label);

  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    await sleep(500);
    if (await metroReady(port)) {
      console.log(`  metro ${port} ready`);
      return;
    }
  }

  throw new Error(
    `[run] Metro for "${label}" did not come up on port ${port} within 90s.\n` +
      '  Run it yourself to see why: npm run start -- --client ' + label,
  );
}

/** Apps currently attached to a Metro dev server. */
function connectedApps(port, timeout = 2000) {
  return new Promise(resolve => {
    const req = http.get(
      { host: '127.0.0.1', port, path: '/json/list', timeout },
      res => {
        let body = '';
        res.on('data', chunk => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve(Array.isArray(parsed) ? parsed : []);
          } catch {
            resolve([]);
          }
        });
      },
    );
    req.on('timeout', () => {
      req.destroy();
      resolve([]);
    });
    req.on('error', () => resolve([]));
  });
}

/**
 * Asks a Metro dev server to reload everything attached to it.
 *
 * This is the HTTP form of the bundler's `r` keypress: `POST/GET /reload`
 * broadcasts the `reload` message down the `/message` websocket to every app
 * currently connected. It reaches exactly the apps on THAT port — which is the
 * whole point of the per-client ports, and also the reason the keypress is not
 * enough on its own: it can only talk to apps that already attached, so a client
 * whose app is not running reports "warn No apps connected" and reloads nothing.
 */
async function broadcastReload(port) {
  const body = await httpGet('/reload', port, 5000);
  return body.includes('OK');
}

/** Polls until `count` apps are attached to the port, or the deadline passes. */
async function waitForApps(port, count = 1, timeout = 45_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const apps = await connectedApps(port);
    if (apps.length >= count) return apps;
    await sleep(500);
  }
  return connectedApps(port);
}

/** Booted iOS simulators: [{ udid, name }]. [] when Xcode tooling is absent. */
function bootedSimulators() {
  const res = spawnSync('xcrun', ['simctl', 'list', 'devices', 'booted', '-j'], {
    encoding: 'utf8',
  });
  if (res.status !== 0 || !res.stdout) return [];
  try {
    const devices = JSON.parse(res.stdout).devices || {};
    return Object.values(devices)
      .flat()
      .filter(d => d.state === 'Booted')
      .map(d => ({ udid: d.udid, name: d.name }));
  } catch {
    return [];
  }
}

/** Online Android devices/emulators. [] when adb is missing or nothing is up. */
function androidDevices() {
  const res = spawnSync('adb', ['devices'], { encoding: 'utf8' });
  if (res.status !== 0 || !res.stdout) return [];
  return res.stdout
    .split('\n')
    .slice(1)
    .map(line => line.trim().split(/\s+/))
    .filter(parts => parts.length === 2 && parts[1] === 'device')
    .map(parts => parts[0]);
}

/** True when a bundle id is installed on a booted simulator. */
function iosAppInstalled(udid, bundleId) {
  const res = spawnSync(
    'xcrun',
    ['simctl', 'get_app_container', udid, bundleId, 'app'],
    { encoding: 'utf8' },
  );
  return res.status === 0 && !!(res.stdout || '').trim();
}

/** True when an application id is installed on an adb device. */
function androidAppInstalled(serial, applicationId) {
  const res = spawnSync('adb', ['-s', serial, 'shell', 'pm', 'path', applicationId], {
    encoding: 'utf8',
  });
  return res.status === 0 && (res.stdout || '').includes('package:');
}

/**
 * Launches a client's already-installed app on every booted simulator / device.
 *
 * This is the missing half of the reload story. Pressing `r` in Metro only
 * broadcasts to apps that have already attached, so a client whose app was
 * never launched — or was backgrounded and dropped its websocket — answers
 * "warn No apps connected" and silently reloads nothing. Launching by bundle id
 * is safe to repeat: simctl/adb bring the existing process to the front and it
 * re-attaches on its own.
 *
 * Installation is checked BEFORE launching, because that is the failure this
 * command hits most and `simctl launch` reports it in the least actionable way:
 * a three-line FBSOpenApplicationServiceErrorDomain dump that never mentions
 * the word "not installed". Separating `missing` from `failed` lets the caller
 * say "build it first" instead of showing the user a CoreSimulator error code.
 */
function launchClientApps(resolved) {
  const attempted = [];
  const problems = [];
  const missing = [];

  const simulators = bootedSimulators();
  for (const sim of simulators) {
    if (!iosAppInstalled(sim.udid, resolved.ios.bundleId)) {
      missing.push(`ios ${sim.name}`);
      continue;
    }
    const res = spawnSync(
      'xcrun',
      ['simctl', 'launch', sim.udid, resolved.ios.bundleId],
      { encoding: 'utf8' },
    );
    if (res.status === 0) {
      attempted.push(`ios ${sim.name}`);
    } else {
      problems.push(`ios ${sim.name}: ${firstLine(res.stderr) || 'launch failed'}`);
    }
  }

  for (const serial of androidDevices()) {
    if (!androidAppInstalled(serial, resolved.android.applicationId)) {
      missing.push(`android ${serial}`);
      continue;
    }
    const res = spawnSync(
      'adb',
      [
        '-s',
        serial,
        'shell',
        'monkey',
        '-p',
        resolved.android.applicationId,
        '-c',
        'android.intent.category.LAUNCHER',
        '1',
      ],
      { encoding: 'utf8' },
    );
    if (res.status === 0) {
      attempted.push(`android ${serial}`);
    } else {
      problems.push(`android ${serial}: ${firstLine(res.stderr) || 'launch failed'}`);
    }
  }

  return { attempted, problems, missing, sawSimulator: simulators.length > 0 };
}

/**
 * The app identifiers this client may legitimately report over Metro.
 *
 * A debug Android build carries an `applicationIdSuffix ".debug"`, so its
 * package id is `<applicationId>.debug` while the registry records the store
 * id. Comparing a connected app against the iOS bundle id alone therefore
 * mislabels every Android debug app as foreign — the exact false "different
 * client" alarm the ownership check exists to avoid. iOS debug builds keep the
 * plain bundle id.
 */
function clientAppIds(resolved) {
  const ids = [resolved.ios.bundleId, resolved.android.applicationId];
  for (const id of [resolved.ios.bundleId, resolved.android.applicationId]) {
    if (!id) continue;
    ids.push(`${id}.debug`);
  }
  return ids;
}

/** True when a connected app id belongs to this client (debug suffix included). */
function appBelongsToClient(resolved, appId) {
  return clientAppIds(resolved).includes(appId);
}

/**
 * Reloads one client end to end: bundler up, app attached, reload broadcast.
 *
 * Every failure mode of the naive `r` keypress is handled explicitly, because
 * each one looks identical from the terminal ("warn No apps connected") while
 * having a different cause and a different fix.
 */
async function reloadClient(resolved, registry, { header = true, port: portOverride } = {}) {
  const id = resolved.id;
  const port = portOverride || metroPort(id, registry);
  const log = msg => console.log(msg);

  if (header) log(`\n▸ reload  client=${id}  metro=${port}`);

  // Reclaim rather than refuse: if another client's Metro holds this port, it
  // must be stopped or the reload would hit a server serving the wrong tenant.
  await freePortFor(port, id);

  if (!(await metroReady(port))) {
    await ensureMetro({ ...process.env, CLIENT_ID: id, CLIENT_ENV_FILE: `.env.${id}` }, port, id);
  }

  let apps = await connectedApps(port);
  if (apps.length === 0) {
    const launch = launchClientApps(resolved);
    launch.problems.forEach(p => log(`  ! ${p}`));

    if (launch.attempted.length === 0) {
      // "Never installed" is the overwhelmingly common cause and has a
      // completely different fix from "installed but would not launch", so it
      // gets its own message naming the exact bundle id that is missing.
      if (launch.missing.length > 0) {
        throw new Error(
          `[reload] "${id}" is not installed on: ${launch.missing.join(', ')}\n` +
            `  iOS bundle id: ${resolved.ios.bundleId}\n` +
            `  Metro ${port} is running and healthy — there is just no app to reload yet.\n` +
            `  Build and install it once:\n` +
            `    npm run ios     -- --client ${id}\n` +
            `    npm run android -- --client ${id}`,
        );
      }

      throw new Error(
        `[reload] Nothing is attached to ${port} and "${id}" could not be launched.\n` +
          (launch.sawSimulator
            ? ''
            : '  No booted simulator and no adb device found.\n') +
          `  Build and run it first:  npm run ios -- --client ${id}\n` +
          `                              npm run android -- --client ${id}`,
      );
    }
    log(`  nothing attached — launched ${launch.attempted.join(', ')}`);
    log('  waiting for the app to attach…');
    apps = await waitForApps(port, 1);
  }

  if (apps.length === 0) {
    throw new Error(
      `[reload] "${id}" launched but never attached to metro ${port}.\n` +
        `  The app is probably showing a bundle error, or its build has a\n` +
        `  different MetroPort baked in. Check: curl -s localhost:${port}/json/list`,
    );
  }

  const names = apps.map(a => a.appId || a.title || 'unknown app');
  const ok = await broadcastReload(port);
  if (!ok) {
    throw new Error(`[reload] metro ${port} did not accept the reload request.`);
  }

  const wrong = names.filter(n => !appBelongsToClient(resolved, n));
  log(`  reloaded ${names.join(', ')} on metro ${port}`);
  if (wrong.length) {
    // Possible when two clients' apps are both attached; the per-client port is
    // supposed to make this impossible, so surface it rather than ignore it.
    log(`  ! also attached (different client?): ${wrong.join(', ')}`);
  }
  return { id, port, apps: names };
}

/**
 * Explains who is attached, so Metro's own startup line can't be misread.
 *
 * On boot Metro unconditionally tries to reload connected apps and, finding
 * none yet, prints "warn No apps connected". That reads like a failure but is
 * just Metro greeting an empty room — it fires on every single start, even when
 * everything is healthy. With per-client ports it's worse: starting Butru's
 * Metro while a Client A app holds the simulator legitimately has no device,
 * so the warning looks like a broken bundler when the bundler is fine.
 *
 * This prints the unambiguous version: which client this server is, which apps
 * are actually attached, and which port to hit when checking by hand.
 */
async function reportDevices(port, resolved, registry) {
  const apps = await connectedApps(port);
  const lines = [''];
  lines.push(`  ── connected apps on ${port} (client "${resolved.id}") ──`);

  if (apps.length === 0) {
    lines.push('  none yet');
    lines.push(`  Build one:  npm run ios -- --client ${resolved.id}`);
    lines.push(`  Reload one:  npm run reload -- --client ${resolved.id}`);
    lines.push('  (npm run reload launches it first — pressing `r` here cannot)');
    const others = Object.keys(registry.clients).filter(id => id !== resolved.id);
    if (others.length) {
      // All clients are configured on the same port, so only one can be
      // bundled at a time. Say so rather than leaving it to be discovered as
      // an EADDRINUSE or, worse, a wrong-tenant build.
      lines.push('  Note: every client shares this port, so this server serves');
      lines.push(`  only "${resolved.id}". To work on ${others.join(', ')}, build it —`);
      lines.push(`  it takes the port over:  npm run ios -- --client ${others[0]}`);
      lines.push(`  Check a server:  curl -s localhost:${port}/json/list`);
    }
  } else {
    apps.forEach(app => {
      const appId = app.appId || app.title || 'unknown app';
      const device = app.deviceName ? ` on ${app.deviceName}` : '';
      const mine = appBelongsToClient(resolved, appId) ? '' : '   ← different client';
      lines.push(`  ${appId}${device}${mine}`);
    });
  }

  console.log(lines.join('\n'));
}

const USAGE = `
Usage: node scripts/run.js <target> [--client <id>] [--release] [-- passthrough]

Targets: sync, metro, android, android-bundle, ios, reload, reload-all

  reload        reload one client's attached app(s); launches the app first if
                nothing is attached (this is what the bundler's \`r\` key cannot do)
  reload-all    reload every configured client, reporting each independently

Options:
  --client, -c <id>   which client to build/serve (default: the registry default)
  --port, -p <n>      override the client's Metro port for this run
  --release           store build instead of debug

  Each client owns a Metro port, because a bundler inlines one client's API +
  store id when it starts. --port is honoured, but pointing a client at a port
  another client's Metro already owns is refused rather than silently mixed.
`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const registry = loadRegistry();

  if (!args.target) {
    console.log(USAGE);
    console.log('Clients:');
    Object.keys(registry.clients).forEach((id) => {
      const mark = id === registry.defaultClient ? '  (default)' : '';
      console.log(`  ${id.padEnd(12)} ${registry.clients[id].displayName}${mark}`);
    });
    process.exit(0);
  }

  const clientId = args.client || registry.defaultClient;
  const resolved = resolveClient(clientId, registry);

  const buildType = args.release ? 'Release' : 'Debug';
  const variant = `${resolved.flavor}${buildType}`;
  const envFile = `.env.${resolved.id}`;

  // An explicit --port is honoured, because "run this client on 8081" is a
  // legitimate thing to want. It is checked against the running owner below so
  // overriding it can never silently hand one client another client's backend.
  const port = args.port || metroPort(resolved.id, registry);

  // ── 1. Regenerate every per-client artifact before anything reads it. ──────
  const sync = spawnSync(
    process.execPath,
    [
      path.join(ROOT, 'scripts', 'sync-clients.js'),
      '--client',
      resolved.id,
      '--quiet',
    ],
    { cwd: ROOT, stdio: 'inherit' },
  );
  if (sync.status !== 0) process.exit(sync.status || 1);

  // ── 2. Build the environment the bundler will read. ─────────────────────────
  const childEnv = {
    ...process.env,
    CLIENT_ID: resolved.id,
    CLIENT_ENV_FILE: envFile,
  };

  const passthrough = stripPort(
    args.rest.includes('--')
      ? args.rest.slice(args.rest.indexOf('--') + 1)
      : args.rest,
  );

  const exec = (cmd, cmdArgs) => {
    const res = spawnSync(cmd, cmdArgs, {
      cwd: ROOT,
      stdio: 'inherit',
      env: childEnv,
    });
    process.exit(res.status === null ? 1 : res.status);
  };

  console.log(
    `\n▸ ${args.target}  client=${resolved.id}  variant=${variant}  metro=${port}\n`,
  );

  switch (args.target) {
    case 'sync':
      process.exit(0);
      break;

    case 'metro': {
      // A second server on an occupied port cannot succeed — Metro exits with
      // EADDRINUSE, and because it was spawned with inherited stdio the user
      // sees a raw Node stack trace instead of a sentence. Any `npm run ios` /
      // `npm run android` has already auto-started one, so this is the normal
      // path, not an edge case: attach when it is ours, reclaim it when it is
      // another client's, and only then start fresh.
      if ((await metroReady(port)) && readMetroMarker(port) === resolved.id) {
        await reportDevices(port, resolved, registry);
        console.log(
          `\n  metro ${port} is already running for "${resolved.id}" — attached to it.\n` +
            `  (Ctrl-C here stops nothing; stop it with: lsof -ti:${port} | xargs kill)\n` +
            `  Reload attached apps:  npm run reload -- --client ${resolved.id}\n`,
        );
        process.exit(0);
      }

      await freePortFor(port, resolved.id);

      // Supervised rather than a blocking exec: we need to keep running after
      // Metro boots so the device report can be printed.
      const child = spawn(
        process.execPath,
        [RN, 'start', '--port', String(port), ...passthrough],
        { cwd: ROOT, stdio: 'inherit', env: childEnv },
      );
      child.on('exit', code => process.exit(code === null ? 1 : code));

      writeMetroMarker(port, resolved.id);

      const deadline = Date.now() + 90_000;
      while (Date.now() < deadline) {
        await sleep(500);
        if (await metroReady(port)) {
          await reportDevices(port, resolved, registry);
          break;
        }
      }
      break;
    }

    case 'android':
      // The CLI spells this `--mode`, not `--variant` — `--mode butruRelease`
      // resolves to the Gradle task `assembleButruRelease`. Passing `--variant`
      // fails with "unknown option", before Gradle is ever reached.
      if (!args.release) await ensureMetro(childEnv, port, resolved.id);
      exec(process.execPath, [
        RN,
        'run-android',
        '--mode',
        variant,
        '--port',
        String(port),
        ...passthrough,
      ]);
      break;

    case 'android-bundle':
      exec(process.execPath, [
        RN,
        'bundle',
        '--platform',
        'android',
        '--dev',
        String(!args.release),
        '--entry-file',
        'index.js',
        '--bundle-output',
        `android/app/src/main/assets/index.android.bundle`,
        '--assets-dest',
        'android/app/src/main/res',
        ...passthrough,
      ]);
      break;

    case 'ios':
      if (!args.release) await ensureMetro(childEnv, port, resolved.id);
      exec(process.execPath, [
        RN,
        'run-ios',
        '--scheme',
        'butruProject',
        '--port',
        String(port),
        ...(args.release ? ['--mode', 'Release'] : []),
        ...passthrough,
      ]);
      break;

    case 'reload':
      // main() already printed the `▸ target client=… metro=…` banner above.
      await reloadClient(resolved, registry, { header: false, port });
      process.exit(0);
      break;

    case 'reload-all': {
      // Every client now shares one port, so reloading them in sequence would
      // have the second kill the first's Metro and boot a different client's.
      // Group by port and reload each port once, broadcasting only to apps
      // already attached — deliberately WITHOUT reclaiming, since killing a
      // healthy server to reload is worse than skipping a client.
      const byPort = new Map();
      for (const id of Object.keys(registry.clients)) {
        const p = metroPort(id, registry);
        if (!byPort.has(p)) byPort.set(p, []);
        byPort.get(p).push(id);
      }

      const results = [];
      const failed = [];
      for (const [p, ids] of byPort) {
        if (!(await metroReady(p))) {
          failed.push(...ids);
          console.error(`  ✗ nothing running on ${p} — start one: npm run start`);
          continue;
        }

        const apps = await connectedApps(p);
        if (apps.length === 0) {
          failed.push(...ids);
          console.error(`  ✗ nothing attached to ${p} (expected ${ids.join(', ')})`);
          continue;
        }

        if (!(await broadcastReload(p))) {
          failed.push(...ids);
          console.error(`  ✗ metro ${p} did not accept the reload request`);
          continue;
        }

        const names = apps.map(a => a.appId || a.title || 'unknown app');
        results.push({ id: ids.join('+'), port: p, apps: names });
        if (ids.length > 1) {
          console.log(`  note: ${ids.join(', ')} all share port ${p}`);
        }
      }

      console.log('\n  ── reload summary ──');
      if (results.length === 0) {
        console.log('  nothing reloaded');
      } else {
        results.forEach(r => console.log(`  ${r.id.padEnd(12)} ${r.port}  ${r.apps.join(', ')}`));
      }
      process.exit(failed.length === 0 ? 0 : 1);
      break;
    }

    default:
      console.error(`Unknown target "${args.target}".${USAGE}`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`\n✗ ${err.message}\n`);
  process.exit(1);
});
