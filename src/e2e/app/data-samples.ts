/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import path from "path";
import { fileURLToPath } from "url";
import { expect, Locator, type Page } from "@playwright/test";
import { Navbar } from "./shared";
import { ConnectionDialogs } from "./connection-dialogs";
import { TrainModelDialog } from "./train-model-dialog";

const getAbsoluteFilePath = (filePathFromProjectRoot: string) => {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  return path.join(dir.replace("e2e/app", ""), filePathFromProjectRoot);
};

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

  async goto(flags: string[] = []) {
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
    // Either the tour dialog or the Disconnect button indicates connection
    // The tour dialog appears on first connection, Disconnect button otherwise
    // Use .first() to handle case where both are visible
    const tourOrDisconnect = this.page
      .getByText("Your data collection micro:bit is connected!")
      .or(this.page.getByRole("button", { name: "Disconnect" }))
      .first();
    await expect(tourOrDisconnect).toBeVisible({ timeout: 10000 });
  }

  /**
   * Get ConnectionDialogs for use after already connecting.
   * Used for testing reconnection scenarios.
   */
  getConnectionDialogs() {
    return new ConnectionDialogs(this.page);
  }

  async expectOnPage() {
    await expect(this.heading).toBeVisible();
    this.expectUrl();
  }

  async expectCorrectInitialState() {
    this.expectUrl();
    await expect(this.heading).toBeVisible({ timeout: 10000 });
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

  async importDataSamples(filePathFromProjectRoot: string) {
    const filePath = getAbsoluteFilePath(filePathFromProjectRoot);
    // Open the menu
    await this.page.getByLabel("Data actions").click();
    // Click import and handle file chooser
    const fileChooserPromise = this.page.waitForEvent("filechooser");
    await this.page
      .getByRole("menuitem", { name: "Import data samples" })
      .click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
  }
}
