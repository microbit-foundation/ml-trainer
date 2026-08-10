/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { expect, type Locator, type Page } from "@playwright/test";
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

  test("partial support tooltip is keyboard reachable and toggles", async ({
    homePage,
  }) => {
    const page = homePage.page;
    // Tooltips portal to the body, so identify this one by its text rather
    // than by position in the dialog.
    const tooltip = page
      .getByRole("tooltip")
      .filter({ hasText: "Language not fully supported" });
    const trigger = partialSupportTriggers(page).first();

    // Tab to the first partially supported language's warning button. The
    // fully supported cards come first and have no tooltip trigger.
    await expect(trigger).toBeAttached();
    for (let i = 0; i < 200 && !(await trigger.evaluate(isFocused)); i++) {
      await page.keyboard.press("Tab");
    }
    expect(await trigger.evaluate(isFocused)).toEqual(true);

    // Focus alone shows it.
    await expect(tooltip).toBeVisible();

    // A keypress that isn't Escape leaves it open.
    await page.keyboard.press("a");
    await expect(tooltip).toBeVisible();

    // Escape dismisses the tooltip, leaving the dialog open.
    await page.keyboard.press("Escape");
    await expect(tooltip).toBeHidden();
    await expect(modalDialog(page)).toBeVisible();

    // Enter toggles it back on, and off again, without choosing the language.
    await page.keyboard.press("Enter");
    await expect(tooltip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(tooltip).toBeHidden();
    await expect(modalDialog(page)).toBeVisible();

    // The mouse can still bring it back on a trigger that keeps focus.
    await trigger.hover();
    await expect(tooltip).toBeVisible();
  });

  test("partial support tooltip stays open while hovered", async ({
    homePage,
  }) => {
    const page = homePage.page;
    const tooltip = page
      .getByRole("tooltip")
      .filter({ hasText: "Language not fully supported" });
    const trigger = partialSupportTriggers(page).first();

    // WCAG 1.4.13: the pointer must be able to move onto the tooltip, e.g. to
    // read it magnified or select the text, without it disappearing.
    await trigger.hover();
    await expect(tooltip).toBeVisible();
    const box = (await tooltip.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height - 4, {
      steps: 10,
    });
    await expect(tooltip).toBeVisible();
    await page.waitForTimeout(300);
    await expect(tooltip).toBeVisible();

    // Leaving the tooltip closes it.
    await page.mouse.move(0, 0);
    await expect(tooltip).toBeHidden();
  });

  test("only one partial support tooltip is open at a time", async ({
    homePage,
  }) => {
    const page = homePage.page;
    const tooltips = page
      .getByRole("tooltip")
      .filter({ hasText: "Language not fully supported" });
    const triggers = partialSupportTriggers(page);
    const first = triggers.first();
    const second = triggers.nth(1);

    // Pointer throughout: react-aria ignores hover until the next pointer press
    // once you've used the keyboard, so a focus-then-hover sequence proves
    // nothing about exclusivity.
    await first.hover();
    await expect(tooltips).toHaveCount(1);
    await expectCentredOn(tooltips.first(), first);

    // Hovering the next warning moves the one tooltip rather than adding a
    // second.
    await second.hover();
    await expect(tooltips).toHaveCount(1);
    await expectCentredOn(tooltips.first(), second);
  });

  test("partial support tooltip opens on hover and click", async ({
    homePage,
  }) => {
    const page = homePage.page;
    const tooltip = page
      .getByRole("tooltip")
      .filter({ hasText: "Language not fully supported" });
    const trigger = partialSupportTriggers(page).first();

    await trigger.hover();
    await expect(tooltip).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(tooltip).toBeHidden();

    // Clicking the warning shows the tooltip (the tap path on touch devices)
    // rather than choosing the language, which would close the dialog.
    await trigger.click();
    await expect(tooltip).toBeVisible();
    await expect(modalDialog(page)).toBeVisible();
  });
});

const isFocused = (el: Element) => el === document.activeElement;

/** Asserts the tooltip is positioned over its own trigger, not another. */
const expectCentredOn = async (tooltip: Locator, trigger: Locator) => {
  const t = (await tooltip.boundingBox())!;
  const g = (await trigger.boundingBox())!;
  expect(Math.abs(t.x + t.width / 2 - (g.x + g.width / 2))).toBeLessThan(24);
};

/**
 * The warning buttons on the partially supported language cards. Their whole
 * tooltip body is their accessible name, which begins with the title.
 */
const partialSupportTriggers = (page: Page) =>
  modalDialog(page).getByRole("button", {
    name: /^Language not fully supported/,
  });
