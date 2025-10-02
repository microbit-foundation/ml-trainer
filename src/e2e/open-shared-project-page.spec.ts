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

  test("preview and import", async ({ dataSamplesPage, openSharedProjectPage }) => {
    await openSharedProjectPage.goto("_fDpWJaY67cgR");
    await openSharedProjectPage.expectMain().toHaveAttribute("aria-busy", "true");
    // loading header
    await openSharedProjectPage.expectMain().not.toHaveAttribute("aria-busy");

    await openSharedProjectPage.expectTitle().toBeVisible();
    await openSharedProjectPage.expectOpenProjectBtn().toBeEnabled();
    await openSharedProjectPage.expectName().toHaveValue("loop and wave");
    await openSharedProjectPage.expectAction("loop").toBeVisible();
    await openSharedProjectPage.expectAction("wave").toBeVisible();
    await openSharedProjectPage.expectAction("idle").toBeVisible();
    await openSharedProjectPage.expectAction("fist").toBeVisible();
    await openSharedProjectPage.expectMakecodePreview().toBeVisible();

    await openSharedProjectPage.expectErrorMessage().not.toBeVisible();

    // try import
    await openSharedProjectPage.clickOpenProjectBtn();
    // importing the loaded project
    dataSamplesPage.expectUrl();
  });

  test("error", async ({ openSharedProjectPage }) => {
    await openSharedProjectPage.goto("_aBadSh0rt1d");
    await openSharedProjectPage.expectMain().toHaveAttribute("aria-busy", "true");
    // loading...
    await openSharedProjectPage.expectMain().not.toHaveAttribute("aria-busy");

    // we didn't load any project elements
    await openSharedProjectPage.expectTitle().not.toBeVisible();
    await openSharedProjectPage.expectName().not.toBeVisible();
    await openSharedProjectPage.expectOpenProjectBtn().not.toBeVisible();
    await openSharedProjectPage.expectMakecodePreview().not.toBeVisible();

    // we did load an error message
    await openSharedProjectPage.expectErrorMessage().toBeVisible();
  });
});
