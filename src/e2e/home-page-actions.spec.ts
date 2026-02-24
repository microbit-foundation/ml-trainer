/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { test } from "./fixtures";

test.describe("home page", () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test("start new project", async ({ homePage, dataSamplesPage }) => {
    await homePage.newProject();
    await dataSamplesPage.expectOnPage();
  });

  test("import a saved project (.json file)", async ({
    homePage,
    dataSamplesPage,
  }) => {
    await homePage.importProject("test-data/dataset.json");
    await dataSamplesPage.expectOnPage();
  });
});
