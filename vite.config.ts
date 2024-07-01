/// <reference types="vitest" />
/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { UserConfig, defineConfig, loadEnv } from "vite";
import svgr from "vite-plugin-svgr";

// Support optionally pulling in external branding if the module is installed.
const theme = "TODO: theme package";
const external = `node_modules/${theme}`;
const internal = "src/deployment/default";

export default defineConfig(({ mode }): UserConfig => {
  const commonEnv = loadEnv(mode, process.cwd(), "");

  return {
    base: process.env.BASE_URL ?? "/",
    plugins: [react(), svgr()],
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
