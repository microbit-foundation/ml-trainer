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
}

// Support optionally pulling in external branding if the module is installed.
const theme = "@microbit-foundation/ml-trainer-microbit";
const external = `node_modules/${theme}`;
const internal = "src/deployment/default";
const themePackageExternal = fs.existsSync(external);
const themePackageAlias = themePackageExternal
  ? theme
  : path.resolve(__dirname, internal);

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
  const commonEnv = loadEnv(mode, process.cwd(), "");

  const strings: TemplateStrings = themePackageExternal
    ? // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      ((await import(themePackageAlias)).default({}) as TemplateStrings)
    : {
        appNameFull: "ml-trainer",
        ogDescription: undefined,
        metaDescription: undefined,
      };
  return {
    base: process.env.BASE_URL ?? "/",
    plugins: [viteEjsPlugin(strings), react(), svgr()],
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(
        process.env.npm_package_version
      ),
    },
    build: {
      target: "es2017",
      rollupOptions: {
        input: "index.html",
      },
    },
    server: commonEnv.API_PROXY
      ? {
          port: 5173,
          proxy: {
            "/api/v1": {
              target: commonEnv.API_PROXY,
              changeOrigin: true,
            },
          },
        }
      : undefined,
    test: {
      globals: true,
      environment: "jsdom",
      exclude: [...configDefaults.exclude, "**/e2e/**"],
      poolOptions: {
        threads: {
          // threads disabled for now due to https://github.com/vitest-dev/vitest/issues/1982
          singleThread: true,
        },
      },
    },
    resolve: {
      alias: {
        "theme-package": themePackageAlias,
      },
    },
  };
});
