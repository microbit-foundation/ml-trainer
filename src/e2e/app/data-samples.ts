/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { expect, Locator, type Page } from "@playwright/test";
import { Navbar } from "./shared";
import { ConnectionDialogs } from "./connection-dialogs";
import { TrainModelDialog } from "./train-model-dialog";

export class DataSamplesPage {
  public readonly navbar: Navbar;
  private url: string;
  private heading: Locator;
  private connectBtn: Locator;
  public welcomeDialog: WelcomeDialog;

  constructor(public readonly page: Page) {
    this.url = `http://localhost:5173${
      process.env.CI ? process.env.BASE_URL : "/"
    }data-samples`;
    this.navbar = new Navbar(page);
    this.heading = this.page.getByRole("heading", { name: "Data samples" });
    this.welcomeDialog = new WelcomeDialog(page);
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

  async expectUrl() {
    return this.page.waitForURL(this.url, { timeout: 3_000 });
  }

  async closeDialog() {
    await this.page.getByLabel("Close").click();
  }

  async connect() {
    await this.welcomeDialog.connect();
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
    await this.welcomeDialog.close();
    await expect(this.heading).toBeVisible();
    await this.expectUrl();
  }

  async expectActions(expectedActions: string[]) {
    const actionInputs = this.page.getByRole("textbox", {
      name: "Name of action",
    });
    await expect(actionInputs).toHaveCount(expectedActions.length, {
      timeout: 10_000,
    });
    let i = 0;
    for (const input of await actionInputs.all()) {
      await expect(input).toHaveValue(expectedActions[i++]);
    }
  }

  async trainModel() {
    await this.page.getByRole("button", { name: "Train model" }).click();
    return new TrainModelDialog(this.page);
  }
}

class WelcomeDialog {
  private heading: Locator;

  constructor(public readonly page: Page) {
    this.page = page;
    this.heading = this.page.getByText("Welcome to micro:bit CreateAI");
  }

  async expectOpen() {
    await expect(this.heading).toBeVisible();
  }

  async close() {
    await this.page.getByRole("button", { name: "Close" }).click();
  }

  async connect() {
    await this.page.getByRole("button", { name: "Connect" }).click();
  }
}
