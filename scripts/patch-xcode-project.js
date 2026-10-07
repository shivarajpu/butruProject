#!/usr/bin/env node
/**
 * patch-xcode-project — points the app target's base configuration at
 * `ios/Config/{Debug,Release}.xcconfig` instead of directly at the Pods one.
 *
 * ── Why this is necessary ───────────────────────────────────────────────────
 * An xcconfig can only reach a target through `baseConfigurationReference`.
 * Right now that slot is taken by CocoaPods, which means there is nowhere for a
 * per-client value to come from. Repointing it at our own file is what creates
 * the injection point — and our file still `#include`s the Pods one, so no pod
 * setting is lost.
 *
 * ── Safety ──────────────────────────────────────────────────────────────────
 * Idempotent: running it twice changes nothing and reports "already wired".
 * It verifies the expected Debug/Release pair is present before touching
 * anything, and refuses to run against an unexpected project shape rather than
 * guessing. `pod install` does not reset this reference.
 *
 * Usage:
 *   node scripts/patch-xcode-project.js          # report only, no writes
 *   node scripts/patch-xcode-project.js --apply
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { ROOT } = require('./lib/clientRegistry');

const PBXPROJ = path.join(ROOT, 'ios', 'butruProject.xcodeproj', 'project.pbxproj');
const APPLY = process.argv.includes('--apply');

// Stable 24-hex-char ids, unique within this file. Checked against the existing
// contents below so a collision can never happen silently.
const IDS = {
  debugXcconfig: 'C11E17C0A0000000000000D3',
  releaseXcconfig: 'C11E17C0A0000000000000R3'.replace('R', 'E'),
};

function ensureUniqueIds(content) {
  for (const id of Object.values(IDS)) {
    if (content.includes(id)) {
      throw new Error(
        `[xcode] id collision: ${id} already exists in project.pbxproj. ` +
          'Change the ids in scripts/patch-xcode-project.js and re-run.',
      );
    }
  }
}

/** Adds a PBXFileReference + PBXGroup entry for each xcconfig. */
function renderFileEntries() {
  const debugRef = `${IDS.debugXcconfig} /* Debug.xcconfig */`;
  const releaseRef = `${IDS.releaseXcconfig} /* Release.xcconfig */`;

  const fileRefs = [
    '\t\t' + debugRef + ' = {isa = PBXFileReference; lastKnownFileType = text.xcconfig; path = Debug.xcconfig; sourceTree = "<group>"; };',
    '\t\t' + releaseRef + ' = {isa = PBXFileReference; lastKnownFileType = text.xcconfig; path = Release.xcconfig; sourceTree = "<group>"; };',
  ].join('\n');

  const configGroup = [
    '\t\tD3C0F1A2B3E4000000000AA01 /* Config */ = {',
    '\t\t\tisa = PBXGroup;',
    '\t\t\tchildren = (',
    '\t\t\t\t' + debugRef + ',',
    '\t\t\t\t' + releaseRef + ',',
    '\t\t\t);',
    '\t\t\tpath = Config;',
    '\t\t\tsourceTree = "<group>";',
    '\t\t};',
  ].join('\n');

  const groupEntry = '\t\t' + 'D3C0F1A2B3E4000000000AA01 /* Config */,';

  return { fileRefs, configGroup, groupEntry };
}

/**
 * Xcode precedence is: target build settings > project build settings > the
 * xcconfig named by `baseConfigurationReference` > defaults.
 *
 * The React Native template hardcodes these three at the *target* level, which
 * silently beats every xcconfig below it. The effect is a build that reads like
 * Client A (`CLIENT_ID`, `CLIENT_ENV_FILE` all correct) but still installs as
 * `com.butruproject` with Butru's icon and label — the worst kind of failure,
 * because nothing errors and the config output looks right.
 *
 * So we delete them and let Config/Clients/<id>.xcconfig be the single source of
 * truth. The values are unchanged for the default client, so nothing moves until
 * a second client is actually selected.
 */
const TARGET_OWNED_SETTINGS = [
  'PRODUCT_BUNDLE_IDENTIFIER',
  'ASSETCATALOG_COMPILER_APPICON_NAME',
  'INFOPLIST_KEY_CFBundleDisplayName',
];

function yieldIdentityToXcconfig(content) {
  let removed = 0;
  let next = content;

  for (const setting of TARGET_OWNED_SETTINGS) {
    // One pass per setting, but restricted to the blocks that actually carry our
    // base configuration, so a project-level setting elsewhere is left alone.
    next = next
      .split(/(?<=baseConfigurationReference = [0-9A-F]{24} \/\* (?:Debug|Release)\.xcconfig \*\/;\n)/)
      .map((chunk, index) => {
        // Re-join-safe: only the first chunk is the header itself.
        if (index === 0) return chunk;
        // Only touch the body of this one configuration block, up to its `name`.
        const blockEnd = chunk.indexOf('\n\t\t\tname = ');
        const head = blockEnd === -1 ? chunk : chunk.slice(0, blockEnd);
        const tail = blockEnd === -1 ? '' : chunk.slice(blockEnd);
        const re = new RegExp(`\n\t{4}${setting} = [^;]*;`, 'g');
        const matches = head.match(re);
        if (!matches) return chunk;
        removed += matches.length;
        return head.replace(re, '') + tail;
      })
      .join('');
  }

  return { content: next, removed };
}

function main() {
  if (!fs.existsSync(PBXPROJ)) {
    throw new Error('[xcode] ios/butruProject.xcodeproj/project.pbxproj not found');
  }

  let content = fs.readFileSync(PBXPROJ, 'utf8');

  const debugOld = /baseConfigurationReference = [0-9A-F]{24} \/\* Pods-butruProject\.debug\.xcconfig \*\/;/;
  const releaseOld = /baseConfigurationReference = [0-9A-F]{24} \/\* Pods-butruProject\.release\.xcconfig \*\/;/;

  const alreadyDebug = content.includes(`baseConfigurationReference = ${IDS.debugXcconfig}`);
  const alreadyRelease = content.includes(`baseConfigurationReference = ${IDS.releaseXcconfig}`);

  if (!(alreadyDebug && alreadyRelease)) {
    if (!debugOld.test(content) || !releaseOld.test(content)) {
      throw new Error(
        '[xcode] Could not find the expected Pods base configuration references.\n' +
          '  Expected both:\n' +
          '    baseConfigurationReference = <id> /* Pods-butruProject.debug.xcconfig */;\n' +
          '    baseConfigurationReference = <id> /* Pods-butruProject.release.xcconfig */;\n' +
          '  If this project has already been migrated differently, wire the target\'s\n' +
          '  base configuration in Xcode by hand: select the butruProject target →\n' +
          '  Build Settings → Config/<Config> → Base Configuration → Config/<Config>.xcconfig',
      );
    }

    ensureUniqueIds(content);

    const { fileRefs, configGroup, groupEntry } = renderFileEntries();

    // 1. File references go in the PBXFileReference section.
    content = content.replace(
      '/* Begin PBXFileReference section */',
      '/* Begin PBXFileReference section */\n' + fileRefs,
    );

    // 2. A PBXGroup for ios/Config, listed alongside the other top-level folders.
    //    It has no `path` of its own beyond `Config`, and its parent group is
    //    name-only, so children resolve to <project>/Config — which is where the
    //    generator writes them.
    content = content.replace(
      '/* End PBXFileReference section */',
      '/* End PBXFileReference section */\n\n/* Begin XCConfigGroup section */\n' +
        configGroup +
        '\n/* End XCConfigGroup section */',
    );

    // 3. Register the group in the project root group so the files show in Xcode.
    //    Anchored on the ios group, which every RN template has.
    const iosGroupAnchor = content.match(
      /([0-9A-F]{24}) \/\* butruProject \*\/ = \{\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = \(\n/,
    );
    if (!iosGroupAnchor) {
      throw new Error(
        '[xcode] Could not locate the root PBXGroup to register ios/Config.\n' +
          '  Add the Config folder to the project in Xcode instead.',
      );
    }
    content = content.replace(
      iosGroupAnchor[0],
      iosGroupAnchor[0].replace(
        'children = (\n',
        'children = (\n' + groupEntry + '\n',
      ),
    );

    // 4. Repoint the two base configurations.
    content = content
      .replace(
        debugOld,
        `baseConfigurationReference = ${IDS.debugXcconfig} /* Debug.xcconfig */;`,
      )
      .replace(
        releaseOld,
        `baseConfigurationReference = ${IDS.releaseXcconfig} /* Release.xcconfig */;`,
      );
  }

  // 5. Always run, even when already wired: this is what stops the target-level
  //    copies of the identity settings from shadowing the xcconfig.
  const { content: cleaned, removed } = yieldIdentityToXcconfig(content);
  content = cleaned;

  if (alreadyDebug && alreadyRelease) {
    if (removed > 0) {
      fs.writeFileSync(PBXPROJ, content, 'utf8');
      console.log(
        `✓ already wired — removed ${removed} target-level setting(s) that were ` +
          'shadowing the xcconfig',
      );
    } else {
      console.log('✓ already wired to Config/{Debug,Release}.xcconfig — nothing to do');
    }
    return;
  }

  console.log('  would repoint:');
  console.log('    Debug   → Config/Debug.xcconfig');
  console.log('    Release → Config/Release.xcconfig');
  console.log(`  would strip ${TARGET_OWNED_SETTINGS.length} shadowing setting(s) from the target`);

  if (!APPLY) {
    console.log('\n  Dry run. Re-run with --apply to write.\n');
    return;
  }

  fs.writeFileSync(PBXPROJ, content, 'utf8');
  console.log('\n✓ ios/butruProject.xcodeproj/project.pbxproj updated');
  console.log('  Run `pod install` once, then open the workspace.\n');
}

try {
  main();
} catch (err) {
  console.error(`\n✗ ${err.message}\n`);
  process.exit(1);
}
