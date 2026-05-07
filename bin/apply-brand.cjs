/**
 * Apply the deployment-time brand overlay. Each entry copies a file
 * from the active theme package's `native/` directory to a gitignored
 * destination in the apps repo. Each destination is deleted before
 * the copy step so a previous run's branded overlay doesn't linger
 * after the theme package is removed.
 *
 *   - Firebase configs fall back to a committed OSS-neutral stub at
 *     `bin/stubs/<file>` if the theme package isn't installed (keeps
 *     Xcode's Copy Bundle Resources phase happy on OSS clones).
 *
 *   - Brand overlays for iOS xcconfig, Android gradle, and Fastlane
 *     env are copied only when the theme package provides them; on
 *     OSS clones the committed defaults in Brand.xcconfig,
 *     brand.gradle, and the fastlane Appfile/Matchfile env fallbacks
 *     take effect.
 *
 * capacitor.config.ts reads brand.json directly with the same
 * theme→stub fallback for appId/appName.
 *
 * When BRAND_REQUIRE_PRIVATE is set (branded CI), the script errors
 * if the theme package isn't installed, instead of silently producing
 * an OSS build.
 */
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const themePackageNativeDir = path.join(
  projectRoot,
  "node_modules",
  "@microbit-foundation",
  "ml-trainer-microbit",
  "native"
);
const stubsDir = path.join(__dirname, "stubs");

if (
  process.env.BRAND_REQUIRE_PRIVATE &&
  !fs.existsSync(themePackageNativeDir)
) {
  console.error(
    `[apply-brand] BRAND_REQUIRE_PRIVATE is set but the theme package is not installed at ${path.relative(
      projectRoot,
      themePackageNativeDir
    )}. Refusing to fall back to OSS defaults.`
  );
  process.exit(1);
}

const overlays = [
  {
    src: "GoogleService-Info.plist",
    dest: "ios/App/App/GoogleService-Info.plist",
    stub: true,
  },
  {
    src: "google-services.json",
    dest: "android/app/google-services.json",
    stub: true,
  },
  {
    src: "Brand.private.xcconfig",
    dest: "ios/App/App/Brand.private.xcconfig",
  },
  {
    src: "brand.private.gradle",
    dest: "android/app/brand.private.gradle",
  },
  {
    src: "fastlane.env",
    dest: "fastlane/.env",
  },
];

for (const { src, dest, stub } of overlays) {
  const themeSrc = path.join(themePackageNativeDir, src);
  const stubSrc = stub ? path.join(stubsDir, src) : undefined;
  const from = fs.existsSync(themeSrc)
    ? themeSrc
    : stubSrc && fs.existsSync(stubSrc)
    ? stubSrc
    : undefined;
  const to = path.join(projectRoot, dest);
  fs.rmSync(to, { force: true });
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
