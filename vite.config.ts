/// <reference types="vitest" />
/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import react from "@vitejs/plugin-react";
import ejs from "ejs";
import fs from "node:fs";
import path from "node:path";
import {
  IndexHtmlTransformContext,
  IndexHtmlTransformResult,
  Plugin,
  ServerOptions,
  UserConfig,
  defineConfig,
  loadEnv,
  searchForWorkspaceRoot,
} from "vite";
import svgr from "vite-plugin-svgr";
import { configDefaults } from "vitest/config";

interface TemplateStrings {
  appNameFull: string;
  ogDescription: undefined | string;
  metaDescription: undefined | string;
  buildMode?: string;
}

// Support optionally pulling in external branding if the module is installed.
const theme = "@microbit-foundation/ml-trainer-microbit";
const external = `node_modules/${theme}`;
const internal = "src/deployment/default";
const themePackageExternal = fs.existsSync(external);
const themePackageAlias = themePackageExternal
  ? theme
  : path.resolve(__dirname, internal);

// Auto-derive the runtime Firebase-config gate from the theme-package's
// native/ directory — the source of truth for whether real Firebase
// config is available for this build. Controls whether `createLogging`
// instantiates `NativeLogging` or falls back to `ConsoleLogging`; see
// src/deployment/index.ts. Setting this here means a contributor never
// has to remember to flip the env var manually.
const themePackageNative = path.resolve(__dirname, external, "native");
if (
  process.env.VITE_HAS_FIREBASE_CONFIG === undefined &&
  fs.existsSync(path.join(themePackageNative, "GoogleService-Info.plist")) &&
  fs.existsSync(path.join(themePackageNative, "google-services.json"))
) {
  process.env.VITE_HAS_FIREBASE_CONFIG = "true";
}

const viteEjsPlugin = (data: ejs.Data): Plugin => {
  return {
    name: "ejs",
    transformIndexHtml: {
      order: "pre",
      handler: (
        html: string,
        _ctx: IndexHtmlTransformContext
      ): IndexHtmlTransformResult => ejs.render(html, data),
    },
  };
};

// Browser-support floor (esbuild/lightningcss target syntax) for JS
// (build.target) and CSS (build.cssTarget). Keep in sync with the
// "browserslist" field in package.json.
const BUILD_TARGETS = [
  "chrome90",
  "edge90",
  "firefox88",
  "safari14.1",
  "ios14.5",
];

export default defineConfig(async ({ mode }): Promise<UserConfig> => {
  const strings: TemplateStrings = themePackageExternal
    ? // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      ((await import(themePackageAlias)).default({}) as TemplateStrings)
    : {
        appNameFull: "ml-trainer",
        ogDescription: undefined,
        metaDescription: undefined,
      };

  // Add VITE_BUILD_MODE environment variable to template data
  strings.buildMode = process.env.VITE_BUILD_MODE;

  return {
    base: process.env.BASE_URL ?? "/",
    // The fidelity harness (bin/fidelity.mjs) symlinks node_modules into a
    // baseline worktree, so the default node_modules/.vite dep cache would
    // be shared with (and can be invalidated under) a concurrently running
    // dev server. It sets VITE_CACHE_DIR to keep its servers isolated.
    ...(process.env.VITE_CACHE_DIR
      ? { cacheDir: process.env.VITE_CACHE_DIR }
      : {}),
    plugins: [viteEjsPlugin(strings), react(), svgr()],
    assetsInclude: ["**/*.hex"],
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(
        process.env.npm_package_version
      ),
    },
    build: {
      target: BUILD_TARGETS,
      cssTarget: BUILD_TARGETS,
      cssMinify: "lightningcss",
      rollupOptions: {
        input: "index.html",
      },
    },
    server: createServer(mode),
    test: {
      globals: true,
      environment: "jsdom",
      exclude: [...configDefaults.exclude, "**/e2e/**"],
      setupFiles: ["fake-indexeddb/auto"],
    },
    resolve: {
      alias: {
        "theme-package": themePackageAlias,
        // Also resolves the styled-system/* imports inside @microbit/ui's
        // shipped source onto this app's generated output (Panda's
        // ship-as-source library pattern).
        "styled-system": path.resolve(__dirname, "styled-system"),
      },
      // @microbit/ui may be installed as a symlink to a sibling checkout;
      // its files then resolve bare imports through the sibling's own
      // node_modules, which would load second copies of these (breaking
      // React hooks and react-aria's context sharing).
      dedupe: [
        "react",
        "react-dom",
        "react-aria-components",
        "react-icons",
        "react-intl",
      ],
    },
  };
});

const createServer = (mode: string): ServerOptions => {
  const commonEnv = loadEnv(mode, process.cwd(), "");
  const options = {
    port: 5173,
    fs: {
      // The theme package and @microbit/ui may be installed as symlinks to
      // sibling checkouts, so their files resolve to real paths outside the
      // project root that Vite's default allow list rejects.
      allow: [
        searchForWorkspaceRoot(process.cwd()),
        ...(themePackageExternal ? [fs.realpathSync(external)] : []),
        fs.realpathSync("node_modules/@microbit/ui"),
      ],
    },
    proxy: {
      "/microbit-org-proxy/": {
        target: "https://microbit.org/",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/microbit-org-proxy/, ""),
      },
    },
  };

  if (commonEnv.API_PROXY) {
    options.proxy["/api/v1"] = {
      target: commonEnv.API_PROXY,
      changeOrigin: true,
    };
  }
  return options;
};
