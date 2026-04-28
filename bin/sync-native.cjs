/**
 * Sync native-side artifacts from the optional theme-package into the
 * iOS / Android project trees. Today: copies Firebase config plists
 * into the locations Capacitor expects. Future passes can extend this
 * to apply theme-supplied bundle IDs, app names, or other native-only
 * brand values when those need to vary per deployment.
 *
 * No-op if the theme-package isn't installed or doesn't ship a
 * `native/` directory — keeps a fresh OSS clone running without
 * private config.
 */
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const themePackageName = "@microbit-foundation/ml-trainer-microbit";

// Resolve the theme-package via the consumer's node_modules directly,
// matching the pattern vite.config.ts already uses. Avoids needing a
// `"./package.json"` entry in the theme-package's `exports` map (which
// is currently strict) just so we can find its root.
const themePackageRoot = path.join(
  projectRoot,
  "node_modules",
  themePackageName
);

const nativeDir = path.join(themePackageRoot, "native");
if (!fs.existsSync(nativeDir)) {
  // Theme-package isn't installed, or doesn't ship native artifacts —
  // either way nothing to do. Keeps a fresh OSS clone running.
  process.exit(0);
}

const targets = [
  {
    from: path.join(nativeDir, "GoogleService-Info.plist"),
    to: path.join(projectRoot, "ios/App/App/GoogleService-Info.plist"),
  },
  {
    from: path.join(nativeDir, "google-services.json"),
    to: path.join(projectRoot, "android/app/google-services.json"),
  },
];

for (const { from, to } of targets) {
  if (!fs.existsSync(from)) continue;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  console.log(
    `[sync-native] ${path.relative(projectRoot, from)} → ${path.relative(
      projectRoot,
      to
    )}`
  );
}
