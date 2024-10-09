/// <reference types="vitest" />
/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import react from "@vitejs/plugin-react";
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
import { configDefaults } from "vitest/config";
import svgr from "vite-plugin-svgr";
import ejs from "ejs";

// Support optionally pulling in external branding if the module is installed.
const theme = "@microbit-foundation/ml-trainer-microbit";
const external = `node_modules/${theme}`;
const internal = "src/deployment/default";

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

export default defineConfig(({ mode }): UserConfig => {
  const commonEnv = loadEnv(mode, process.cwd(), "");

  const themePath = fs.existsSync(external)
    ? path.resolve(__dirname, external, "dist", "index.js")
    : path.resolve(__dirname, internal, "index.tsx");
  const file = fs.readFileSync(themePath, { encoding: "utf8" });
  const match = /appNameFull: (?:"|')(.*)(?:"|'),*/.exec(file);
  const appNameFull = match[1];

  return {
    base: process.env.BASE_URL ?? "/",
    plugins: [
      viteEjsPlugin({
        appNameFull,
      }),
      react(),
      svgr(),
    ],
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
        "theme-package": fs.existsSync(external)
          ? theme
          : path.resolve(__dirname, internal),
      },
    },
  };
});
