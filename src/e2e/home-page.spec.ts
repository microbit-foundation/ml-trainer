/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { expect } from "@playwright/test";
import { test } from "./fixtures";

test.describe("home page", () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test("shows new projects section", async ({ homePage }) => {
    homePage.expectOnHomePage();
    await expect(
      homePage.page.getByRole("heading", { name: "New projects" })
    ).toBeVisible();
    await expect(
      homePage.page.getByRole("button", { name: "New project" })
    ).toBeVisible();
    await expect(
      homePage.page.getByRole("button", { name: "Import" })
    ).toBeVisible();
  });

  test("shows project ideas section", async ({ homePage }) => {
    await expect(
      homePage.page.getByRole("heading", { name: "Project ideas" })
    ).toBeVisible();
  });

});
