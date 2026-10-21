/**
 * fmt 11.0.2 does not compile with the Clang shipped in Xcode 26/27:
 *
 *   error: call to consteval function
 *   'fmt::basic_format_string<...>::basic_format_string<FMT_COMPILE_STRING, 0>'
 *   is not a constant expression
 *
 * The failure comes from fmt's compile-time format string checker doing
 * pointer arithmetic inside a consteval context, which newer Clang rejects.
 * fmt 11.1.4 contains the upstream fix, so the podspecs that pin fmt are
 * bumped to 11.1.4.
 *
 * Idempotent. No-ops when react-native is not installed.
 */
const fs = require('fs');
const path = require('path');

const OLD_VERSION = '11.0.2';
const NEW_VERSION = '11.1.4';

const podspecDir = path.join(
  __dirname,
  '../node_modules/react-native/third-party-podspecs',
);

const targets = [
  {
    file: path.join(podspecDir, 'fmt.podspec'),
    replacements: [
      [`spec.version = "${OLD_VERSION}"`, `spec.version = "${NEW_VERSION}"`],
      [`:tag => "${OLD_VERSION}"`, `:tag => "${NEW_VERSION}"`],
    ],
  },
  {
    file: path.join(podspecDir, 'RCT-Folly.podspec'),
    replacements: [
      [
        `spec.dependency "fmt", "${OLD_VERSION}"`,
        `spec.dependency "fmt", "${NEW_VERSION}"`,
      ],
    ],
  },
];

for (const {file, replacements} of targets) {
  if (!fs.existsSync(file)) {
    continue;
  }

  let source = fs.readFileSync(file, 'utf8');
  let changed = false;

  for (const [from, to] of replacements) {
    if (source.includes(from)) {
      source = source.split(from).join(to);
      changed = true;
    } else if (!source.includes(to)) {
      console.error(
        `fmt version patch no longer matches ${path.basename(file)}`,
      );
      process.exit(1);
    }
  }

  if (changed) {
    fs.writeFileSync(file, source);
    console.log(
      `patched ${path.basename(file)}: fmt ${OLD_VERSION} -> ${NEW_VERSION}`,
    );
  }
}
