/**
 * `react-native run-ios` opens the simulator UI app
 * before it builds. The CLI hardcoded a single location for that bundle:
 *
 *   <Xcode>.app/Contents/Developer/Applications/Simulator.app
 *
 * That path is not stable. Xcode 26 moved the bundle to
 * <Xcode>.app/Contents/Applications, and Xcode 27 removed Simulator.app
 * entirely in favour of DeviceHub.app. The CLI treated a missing bundle as a
 * fatal error, so `run-ios` aborted before it ever reached the build, even
 * though the simulator can be booted, installed into and launched through
 * `simctl` without the UI app.
 *
 * This patch makes the CLI look the bundle up in every known location and
 * downgrade a missing/broken UI app to a warning.
 *
 * Idempotent. No-ops when the CLI is not installed.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '../node_modules/@react-native-community/cli-platform-apple/build/commands/runCommand/runOnSimulator.js',
);

const HELPER = `/**
 * Brings up the simulator UI.
 *
 * The app bundle location is not stable across Xcode releases:
 *   - Xcode <= 16: <Xcode>.app/Contents/Developer/Applications/Simulator.app
 *   - Xcode 26+:    <Xcode>.app/Contents/Applications/Simulator.app
 *   - Xcode 27:     Simulator.app was replaced by DeviceHub.app
 *
 * The CLI used to hard-fail when the bundle was missing, which blocked
 * \`run-ios\` completely even though the simulator can still be booted and
 * driven headlessly through \`simctl\`. Missing/broken UI is now a warning.
 */
function openSimulatorApp(activeDeveloperDir, udid) {
  const developerDir = _path.resolve(activeDeveloperDir);
  const contentsDir = _path.resolve(developerDir, '..');
  const candidates = [_path.join(developerDir, 'Applications', 'Simulator.app'), _path.join(contentsDir, 'Applications', 'Simulator.app'), _path.join(contentsDir, 'Applications', 'DeviceHub.app')];
  const simulatorApp = candidates.find(candidate => _fs.existsSync(candidate));
  if (!simulatorApp) {
    _cliTools().logger.warn('Could not find the Simulator app for this Xcode install. The simulator will be booted headlessly; use Xcode\\'s Devices window to see it.');
    return;
  }
  try {
    _child_process().default.execFileSync('open', [simulatorApp, '--args', '-CurrentDeviceUDID', udid]);
  } catch (error) {
    _cliTools().logger.warn(\`Could not open \${simulatorApp}: \${error.message}\`);
  }
}
`;

const edits = [
  {
    from: `exports.runOnSimulator = runOnSimulator;
function _child_process() {`,
    to: `exports.runOnSimulator = runOnSimulator;
const _fs = require('fs');
const _path = require('path');
function _child_process() {`,
  },
  {
    from: `  _child_process().default.execFileSync('open', [\`\${activeDeveloperDir}/Applications/Simulator.app\`, '--args', '-CurrentDeviceUDID', simulator.udid]);`,
    to: `  openSimulatorApp(activeDeveloperDir, simulator.udid);`,
  },
  {
    from: `function bootSimulator(selectedSimulator) {`,
    to: `${HELPER}function bootSimulator(selectedSimulator) {`,
    // The helper is only inserted once; the anchor itself is still present
    // after patching, so it cannot be used to detect an applied patch.
    isApplied: source => source.includes('function openSimulatorApp('),
  },
];

if (!fs.existsSync(target)) {
  process.exit(0);
}

let source = fs.readFileSync(target, 'utf8');
let changed = false;

for (const {from, to, isApplied} of edits) {
  if (isApplied && isApplied(source)) {
    continue;
  }
  if (source.includes(from)) {
    source = source.replace(from, to);
    changed = true;
  } else if (!source.includes(to)) {
    console.error(
      'cli-platform-apple simulator patch no longer matches runOnSimulator.js',
    );
    process.exit(1);
  }
}

if (changed) {
  fs.writeFileSync(target, source);
  console.log('patched cli-platform-apple runOnSimulator.js');
}
