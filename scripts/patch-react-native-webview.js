/**
 * RN 0.83 codegen rejects union types on WebView event payloads
 * (react-native-webview issue 3954). Collapse navigationType to string.
 * Idempotent. No-ops when the package is not installed.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '../node_modules/react-native-webview/src/RNCWebViewNativeComponent.ts',
);
const from =
  "navigationType: 'click' | 'formsubmit' | 'backforward' | 'reload' | 'formresubmit' | 'other';";
const to = 'navigationType: string;';

if (!fs.existsSync(target)) {
  process.exit(0);
}

const source = fs.readFileSync(target, 'utf8');
if (!source.includes(from)) {
  if (source.includes(to)) {
    process.exit(0);
  }
  console.error(
    'react-native-webview codegen patch no longer matches RNCWebViewNativeComponent.ts',
  );
  process.exit(1);
}

fs.writeFileSync(target, source.split(from).join(to));
