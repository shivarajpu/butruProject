/**
 * Babel configuration.
 *
 * ── Why the env file is dynamic ──────────────────────────────────────────────
 * `react-native-dotenv` inlines variables at transform time, so whichever file
 * `path` points to gets baked into the bundle. Pointing it at a per-client file
 * is what allows one codebase to ship a different API base URL per client.
 *
 * ── Which client is being built ──────────────────────────────────────────────
 * Resolution order:
 *
 *   1. CLIENT_ENV_FILE — set by `scripts/run.js` and by the generated
 *      `ios/Config/Client.xcconfig`. Useful when something drives Metro or a
 *      bundler directly and wants to pin the client explicitly.
 *
 *   2. clients/active.json — the build record `npm run clients:sync` writes, and
 *      the *same* file `android/app/build.gradle` and `ios/Config/*.xcconfig`
 *      read. This is how Android's bundle task finds its client: it spawns
 *      `node` from inside the Gradle daemon, which does not inherit the client's
 *      environment, so no env var can reach babel there. A file on disk can.
 *
 * Reading the client id back out of `active.json` is why there is no separate
 * `.env.build` alias file: the "which client am I" question has exactly one
 * answer, and it already lives in a committed-path file that every tool in the
 * pipeline reads. One source of truth, not two that can disagree.
 *
 * There is deliberately no hand-written `.env` fallback either. A committed
 * env file that the generator never writes is a stale file that looks
 * authoritative: forget `npm run clients:sync` after switching clients and Babel
 * would quietly bundle the *default* client's API URL into another client's
 * release binary. Nothing errors, the build succeeds, and the wrong backend gets
 * shipped. Failing loudly is the whole point, so the only way to get a valid
 * build is to sync.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const ACTIVE_JSON = path.join(ROOT, 'clients', 'active.json');

/** The client `clients:sync` last generated for, or null. */
function activeClientId() {
  if (!fs.existsSync(ACTIVE_JSON)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(ACTIVE_JSON, 'utf8'));
    return typeof parsed.id === 'string' && parsed.id ? parsed.id : null;
  } catch {
    // A corrupt active.json is a real problem, but the caller re-throws with a
    // far better message than a JSON parse error buried in a babel config.
    return null;
  }
}

function resolveDotenvPath() {
  const client = activeClientId();
  const candidates = [
    process.env.CLIENT_ENV_FILE,
    client ? `.env.${client}` : null,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const absolute = path.resolve(ROOT, candidate);
    if (fs.existsSync(absolute)) return absolute;
  }

  const hint = client
    ? `clients/active.json names "${client}" but .env.${client} does not exist.`
    : 'clients/active.json is missing or unreadable.';

  throw new Error(
    `[babel] No env file found. ${hint}\n` +
      '  Run: npm run clients:sync',
  );
}

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: resolveDotenvPath(),
        allowUndefined: true,
        safe: false,
      },
    ],
  ],
};
