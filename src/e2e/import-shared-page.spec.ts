/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { test } from "./fixtures";

test.describe("import shared page", () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.setupContext();
  });

  test("preview and import", async ({ dataSamplesPage, importSharedPage }) => {
    await importSharedPage.goto("_fDpWJaY67cgR");
    await importSharedPage.expectMain().toHaveAttribute("aria-busy", "true");
    // loading header
    await importSharedPage.expectMain().not.toHaveAttribute("aria-busy");

    await importSharedPage.expectTitle().toBeVisible();
    await importSharedPage.expectOpenProjectBtn().toBeEnabled();
    await importSharedPage.expectName().toHaveValue("loop and wave");
    await importSharedPage.expectAction("loop").toBeVisible();
    await importSharedPage.expectAction("wave").toBeVisible();
    await importSharedPage.expectAction("idle").toBeVisible();
    await importSharedPage.expectAction("fist").toBeVisible();
    await importSharedPage.expectMakecodePreview().toBeVisible();

    await importSharedPage.expectErrorMessage().not.toBeVisible();

    // try import
    await importSharedPage.clickOpenProjectBtn();
    // importing the loaded project
    dataSamplesPage.expectUrl();
  });

  test("error", async ({ importSharedPage }) => {
    await importSharedPage.goto("_aBadSh0rt1d");
    await importSharedPage.expectMain().toHaveAttribute("aria-busy", "true");
    // loading...
    await importSharedPage.expectMain().not.toHaveAttribute("aria-busy");

    // we didn't load any project elements
    await importSharedPage.expectTitle().not.toBeVisible();
    await importSharedPage.expectName().not.toBeVisible();
    await importSharedPage.expectOpenProjectBtn().not.toBeVisible();
    await importSharedPage.expectMakecodePreview().not.toBeVisible();

    // we did load an error message
    await importSharedPage.expectErrorMessage().toBeVisible();
  });
});
