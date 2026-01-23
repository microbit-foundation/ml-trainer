/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { expect, type Page } from "@playwright/test";
import { DownloadDialogs } from "./download-dialogs";

export class MakeCodeEditor {
  constructor(public readonly page: Page) {}

  private get iframe() {
    return this.page.frameLocator('iframe[title="MakeCode"]');
  }

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
    await this.iframe
      .getByRole("option", { name: "Convert code to JavaScript" })
      .click();
  }

  async switchToBlocks() {
    await this.iframe
      .getByRole("option", { name: "Convert code to Blocks" })
      .click();
  }

  async editJavaScript(jsText: string) {
    const textArea = this.iframe.getByText("ml.onStart(ml.event.").first();
    await textArea.click();
    await this.page.keyboard.press("ControlOrMeta+A");
    await this.page.keyboard.insertText(jsText);
    await this.page.waitForTimeout(1000);
  }

  async back() {
    await this.iframe.getByLabel("Back to application").click();
  }

  async clickDownload() {
    // MakeCode in portrait tablet has a "Download" button with just a more verbose title attribute (no real accessible label)
    await this.iframe
      .getByRole("menuitem", { name: /^Download( your code|$)/ })
      .click();
    return new DownloadDialogs(this.page);
  }
}
