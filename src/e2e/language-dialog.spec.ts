/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { modalDialog } from "./app/shared";

test.describe("language dialog", () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
    await homePage.page
      .getByRole("button", { name: "Settings actions menu" })
      .click();
    await homePage.page.getByRole("menuitem", { name: "Language" }).click();
    await expect(modalDialog(homePage.page)).toBeVisible();
  });

  // The tooltip's own behaviour belongs to @microbit/ui's TooltipButton. What
  // this covers is the card: that the warning is reachable at all given the
  // selection button covering it, and that using it doesn't pick the language.
  test("partial support warning is usable from the keyboard", async ({
    homePage,
  }) => {
    const page = homePage.page;
    const dialog = modalDialog(page);
    // Tooltips portal to the body, so identify this one by its text.
    const tooltip = page
      .getByRole("tooltip")
      .filter({ hasText: "Language not fully supported" });
    const trigger = dialog
      .getByRole("button", { name: /^Language not fully supported/ })
      .first();

    // Tab to the first partially supported language's warning. The fully
    // supported cards come first and have no warning.
    await expect(trigger).toBeAttached();
    const isFocused = (el: Element) => el === document.activeElement;
    for (let i = 0; i < 200 && !(await trigger.evaluate(isFocused)); i++) {
      await page.keyboard.press("Tab");
    }
    expect(await trigger.evaluate(isFocused)).toEqual(true);

    // Enter operates the tooltip and never chooses the language. Enter toggles,
    // and whether focus alone opened it first isn't deterministic here —
    // react-aria gates that on the interaction modality — so drive it to open
    // rather than asserting which state focus left it in. That behaviour is unit
    // tested in the library.
    await page.keyboard.press("Enter");
    if (!(await tooltip.isVisible())) {
      await page.keyboard.press("Enter");
    }
    await expect(tooltip).toBeVisible();
    await expect(dialog).toBeVisible();

    // Same for the pointer: the warning sits over the button covering the card,
    // so a click on it must not choose the language either.
    await trigger.click();
    await expect(dialog).toBeVisible();
  });
});
