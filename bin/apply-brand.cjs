/**
 * Apply the deployment-time brand overlay to the iOS / Android
 * project trees. Today: copy native config files (Firebase plists)
 * from the brand source into their canonical destinations. Future
 * passes can extend this to bundle IDs, app names, and other
 * brand-coupled native values.
 *
 * For each target, the source-of-truth order is:
 *
 *   1. Theme-package's `native/` directory, if installed and present
 *      (private builds — overlays real Firebase config, etc.)
 *   2. Committed stub at `bin/stubs/<file>`, if any
 *      (OSS clones — keeps Xcode's Copy Bundle Resources phase happy
 *      with a file that's harmless because the Info.plist setting
 *      FirebaseDataCollectionDefaultEnabled=false keeps Firebase Core
 *      dormant after configure())
 *
 * Destination paths are gitignored — local modifications never appear
 * in git status.
 */
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const themePackageName = "@microbit-foundation/ml-trainer-microbit";

const themePackageNativeDir = path.join(
  projectRoot,
  "node_modules",
  themePackageName,
  "native"
);
const stubsDir = path.join(__dirname, "stubs");

const targets = [
  {
    name: "GoogleService-Info.plist",
    to: path.join(projectRoot, "ios/App/App/GoogleService-Info.plist"),
  },
  {
    name: "google-services.json",
    to: path.join(projectRoot, "android/app/google-services.json"),
  },
];

for (const { name, to } of targets) {
  const themeSrc = path.join(themePackageNativeDir, name);
  const stubSrc = path.join(stubsDir, name);
  const from = fs.existsSync(themeSrc)
    ? themeSrc
    : fs.existsSync(stubSrc)
      ? stubSrc
      : undefined;
  if (!from) continue;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  console.log(
    `[apply-brand] ${path.relative(projectRoot, from)} → ${path.relative(
      projectRoot,
      to
    )}`
  );
}
