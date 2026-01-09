/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./src/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  /* Run local dev server before starting the tests */
  webServer: {
    ...(process.env.CI
      ? {
          command: `npx vite preview --port 5173 --base ${process.env.BASE_URL}`,
          url: `http://localhost:5173${process.env.BASE_URL}`,
        }
      : {
          command: "npx vite dev",
          url: "http://localhost:5173/",
        }),
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    ignoreHTTPSErrors: true,
  },
});
