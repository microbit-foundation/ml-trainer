/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { expect, type Page } from "@playwright/test";

export class MakeCodeEditor {
  constructor(public readonly page: Page) {}

  expectUrl() {
    const url = `http://localhost:5173${
      process.env.CI ? process.env.BASE_URL : "/"
    }code`;
    expect(this.page.url()).toEqual(url);
  }

  async closeTourDialog() {
    await this.page
      .getByText("Microsoft MakeCode")
      .waitFor({ state: "visible" });
    await this.page.getByRole("button", { name: "Close" }).click();
  }

  async switchToJavaScript() {
    await this.page
      .frameLocator('iframe[title="MakeCode"]')
      .getByRole("option", { name: "Convert code to JavaScript" })
      .click();
  }

  async switchToBlocks() {
    await this.page
      .frameLocator('iframe[title="MakeCode"]')
      .getByRole("option", { name: "Convert code to Blocks" })
      .click();
  }

  async editJavaScript(jsText: string) {
    const textArea = this.page
      .frameLocator('iframe[title="MakeCode"]')
      .getByText("ml.onStart(ml.event.")
      .first();
    await textArea.click();
    await this.page.keyboard.press("ControlOrMeta+A");
    await this.page.keyboard.insertText(jsText);
    await this.page.waitForTimeout(1000);
  }

  async back() {
    await this.page
      .frameLocator('iframe[title="MakeCode"]')
      .getByLabel("Back to application")
      .click();
  }
}
