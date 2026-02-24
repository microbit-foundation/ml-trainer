/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { test } from "./fixtures";

test.describe("about page", () => {
  test("get started navigates to home", async ({ homePage }) => {
    await homePage.goto();
    await homePage.page.goto(homePage.page.url() + "about");
    await homePage.page
      .getByRole("button", { name: "Get started" })
      .first()
      .click();
    await homePage.expectOnHomePage();
  });
});
