/// <reference types="vitest" />
/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import react from "@vitejs/plugin-react";
import browserslist from "browserslist";
import ejs from "ejs";
import { browserslistToTargets } from "lightningcss";
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

// Auto-derive the runtime Firebase-config gate from the presence of
// the native config files that `npm run sync-native` drops in. The
// gate controls whether `createLogging` instantiates `NativeLogging`
// or falls back to `ConsoleLogging` (see src/deployment/index.ts).
// Setting this here means a contributor never has to remember to flip
// the env var manually. Both files must be present — a partial-config
// state would compile but skip Firebase init silently on whichever
// platform was missing.
if (
  process.env.VITE_HAS_FIREBASE_CONFIG === undefined &&
  fs.existsSync(
    path.resolve(__dirname, "ios/App/App/GoogleService-Info.plist")
  ) &&
  fs.existsSync(path.resolve(__dirname, "android/app/google-services.json"))
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
    plugins: [viteEjsPlugin(strings), react(), svgr()],
    assetsInclude: ["**/*.hex"],
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(
        process.env.npm_package_version
      ),
    },
    css: {
      transformer: "lightningcss",
      lightningcss: {
        targets: browserslistToTargets(browserslist()),
      },
    },
    build: {
      target: "es2017",
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
      },
    },
  };
});

const createServer = (mode: string): ServerOptions => {
  const commonEnv = loadEnv(mode, process.cwd(), "");
  const options = {
    port: 5173,
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
