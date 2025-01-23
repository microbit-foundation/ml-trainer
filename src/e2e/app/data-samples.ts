/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { expect, Locator, type Page } from "@playwright/test";
import { Navbar } from "./shared";
import { ConnectionDialogs } from "./connection-dialogs";

export class DataSamplesPage {
  public readonly navbar: Navbar;
  private url: string;
  private heading: Locator;
  private connectBtn: Locator;

  constructor(public readonly page: Page) {
    this.url = `http://localhost:5173${
      process.env.CI ? process.env.BASE_URL : "/"
    }data-samples`;
    this.navbar = new Navbar(page);
    this.heading = this.page.getByRole("heading", { name: "Data samples" });
    this.connectBtn = this.page.getByLabel("Connect to micro:bit");
  }

  async goto(flags: string[] = ["open"]) {
    const response = await this.page.goto(this.url);
    await this.page.evaluate(
      (flags) => localStorage.setItem("flags", flags.join(",")),
      flags
    );
    return response;
  }

  expectUrl() {
    expect(this.page.url()).toEqual(this.url);
  }

  async closeDialog() {
    await this.page.getByLabel("Close").click();
  }

  async connect() {
    await this.connectBtn.click();
    const connectionDialogs = new ConnectionDialogs(this.page);
    return connectionDialogs;
  }

  async expectConnected() {
    await expect(this.connectBtn).toBeHidden();
    await expect(
      this.page.getByText("Your data collection micro:bit is connected!")
    ).toBeVisible();
  }

  async expectOnPage() {
    await expect(this.heading).toBeVisible();
    this.expectUrl();
  }

  async expectCorrectInitialState() {
    this.expectUrl();
    await expect(this.heading).toBeVisible({ timeout: 10000 });
  }
}
