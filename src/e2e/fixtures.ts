/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { test as base } from "@playwright/test";
import { HomePage } from "./app/home-page";
import { DataSamplesPage } from "./app/data-samples";
import { TestModelPage } from "./app/test-model";

type MyFixtures = {
  homePage: HomePage;
  dataSamplesPage: DataSamplesPage;
  testModelPage: TestModelPage;
};

export const test = base.extend<MyFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  dataSamplesPage: async ({ page }, use) => {
    await use(new DataSamplesPage(page));
  },
  testModelPage: async ({ page }, use) => {
    await use(new TestModelPage(page));
  },
});
