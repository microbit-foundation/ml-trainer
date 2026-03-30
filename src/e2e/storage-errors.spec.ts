/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { expect } from "@playwright/test";
import { test } from "./fixtures";

/**
 * Monkey-patches IDBObjectStore.prototype.put so that the next call
 * throws, then restores the original method.
 */
const injectWriteError = async (
  page: import("@playwright/test").Page,
  errorName: string = "QuotaExceededError"
) => {
  await page.evaluate((errorName) => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () {
      IDBObjectStore.prototype.put = original;
      throw new DOMException(`Simulated ${errorName}`, errorName);
    };
  }, errorName);
};

test.describe("storage write errors", () => {
  test("shows toast on QuotaExceededError and app remains usable", async ({
    homePage,
    dataSamplesPage,
  }) => {
    // Create a project so we have something to interact with.
    await homePage.goto();
    await homePage.newProject();
    await dataSamplesPage.expectOnPage();

    // Inject a one-shot write failure for the next put.
    await injectWriteError(dataSamplesPage.page, "QuotaExceededError");

    // Rename an action to trigger a storage write.
    const actionInput = dataSamplesPage.page.getByRole("textbox", {
      name: "Name of action",
    });
    await actionInput.first().fill("Wave");
    // Blur to commit the rename which triggers the storage write.
    await actionInput.first().blur();

    // Toast should appear with the quota title and description.
    await expect(
      dataSamplesPage.page.getByText("Browser storage full")
    ).toBeVisible();
    await expect(
      dataSamplesPage.page.getByText("Your project edit may not be saved.")
    ).toBeVisible();

    // App should still be usable — no error boundary.
    await expect(
      dataSamplesPage.page.getByText("An unexpected error occurred")
    ).toBeHidden();
    // Verify we can still interact with the page.
    await expect(actionInput.first()).toBeVisible();
  });

  test("shows toast on generic write error", async ({
    homePage,
    dataSamplesPage,
  }) => {
    await homePage.goto();
    await homePage.newProject();
    await dataSamplesPage.expectOnPage();

    await injectWriteError(dataSamplesPage.page, "UnknownError");

    const actionInput = dataSamplesPage.page.getByRole("textbox", {
      name: "Name of action",
    });
    await actionInput.first().fill("Wave");
    await actionInput.first().blur();

    await expect(
      dataSamplesPage.page.getByText(
        "Failed to save your project to browser storage"
      )
    ).toBeVisible();

    await expect(
      dataSamplesPage.page.getByText("An unexpected error occurred")
    ).toBeHidden();
  });
});

test.describe("storage read errors", () => {
  test("shows error boundary on read failure", async ({
    homePage,
    dataSamplesPage,
  }) => {
    // Create a project first so the home page has data to load.
    await homePage.goto();
    await homePage.newProject();
    await dataSamplesPage.welcomeDialog.close();
    await dataSamplesPage.navbar.home();
    await homePage.expectOnHomePage();

    // Register an init script that monkey-patches getAll to fail once.
    // addInitScript runs before any page script on every navigation/reload,
    // so the patch is in place when the route loader fires.
    await homePage.page.addInitScript(() => {
      const original = IDBObjectStore.prototype.getAll;
      IDBObjectStore.prototype.getAll = function () {
        IDBObjectStore.prototype.getAll = original;
        throw new DOMException("Simulated read error", "UnknownError");
      };
    });

    await homePage.page.reload();

    // Error boundary should render.
    await expect(
      homePage.page.getByText("An unexpected error occurred")
    ).toBeVisible();
  });
});
