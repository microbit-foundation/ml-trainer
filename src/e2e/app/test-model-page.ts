/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { expect, type Page } from "@playwright/test";
import { Navbar } from "./shared";
import { MakeCodeEditor } from "./makecode-editor";

export class TestModelPage {
  public readonly navbar: Navbar;

  constructor(public readonly page: Page) {
    this.navbar = new Navbar(page);
  }

  expectUrl() {
    const url = `http://localhost:5173${
      process.env.CI ? process.env.BASE_URL : "/"
    }testing-model`;
    expect(this.page.url()).toEqual(url);
  }

  async expectOnPage() {
    await expect(
      this.page.getByRole("heading", { name: "Testing model" })
    ).toBeVisible();
    this.expectUrl();
  }

  async expectDefaultCodeView(actionNames: string[] = ["active", "inactive"]) {
    for (const name of actionNames) {
      await expect(
        this.page
          .getByLabel(`MakeCode block: on ML ${name.toLowerCase()}`)
          .getByRole("img")
      ).toBeVisible();
    }
  }

  async expectMLBlockVisible(actionNames: string[] = ["active", "inactive"]) {
    for (const name of actionNames) {
      const [char1, ...restChars] = name;
      const camelCasedName =
        char1.toUpperCase() + restChars.join("").toLowerCase();
      await this.page
        .getByAltText(
          `ml.onStart(ml.event.${camelCasedName}, function() { basic.showIcon(IconNames.House) })`
        )
        .click();
    }
  }

  async editInMakeCode() {
    await this.page
      .getByRole("button", { name: "Edit in MakeCode", exact: true })
      .click();
    return new MakeCodeEditor(this.page);
  }
}
