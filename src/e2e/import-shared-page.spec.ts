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

  test("load preview", async ({ dataSamplesPage, importSharedPage }) => {
    await importSharedPage.goto("_fDpWJaY67cgR");
    await importSharedPage.expectMain().toHaveAttribute("aria-busy", "true");
    // loading header
    await importSharedPage.expectMain().not.toHaveAttribute("aria-busy");

    // loading body - typically happens so fast that checking it's initially disabled fails
    await importSharedPage.expectOpenProjectBtn().toBeEnabled();

    await importSharedPage.expectName().toHaveValue("loop and wave");
    await importSharedPage.expectAction("loop").toBeVisible();
    await importSharedPage.expectAction("wave").toBeVisible();
    await importSharedPage.expectAction("idle").toBeVisible();
    await importSharedPage.expectAction("fist").toBeVisible();

    await importSharedPage.expectMakecodePreview().toBeVisible();

    await importSharedPage.clickOpenProjectBtn();

    dataSamplesPage.expectUrl();
  });

  test("error", async ({ importSharedPage }) => {
    await importSharedPage.goto("_aBadSh0rt1d");
    await importSharedPage.expectMain().toHaveAttribute("aria-busy", "true");
    // loading...
    await importSharedPage.expectMain().not.toHaveAttribute("aria-busy");

    await importSharedPage.expectName().not.toBeVisible();

    await importSharedPage.expectOpenProjectBtn().not.toBeVisible();
    await importSharedPage.expectMakecodePreview().not.toBeVisible();
  });
});
