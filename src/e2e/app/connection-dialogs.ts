/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { type Page } from "@playwright/test";

export class ConnectionDialogs {
  constructor(public readonly page: Page) {}

  async close() {
    await this.page.getByLabel("Close").click();
  }

  async waitForText(name: string) {
    await this.page.getByText(name).waitFor();
  }

  private async clickNext() {
    await this.page.getByRole("button", { name: "Next" }).click();
  }

  async bluetoothConnect() {
    await this.waitForText("What you need to connect using Web Bluetooth");
    await this.clickNext();
    await this.waitForText("Connect USB cable to micro:bit");
    await this.clickNext();
    await this.waitForText("Download data collection program to micro:bit");
    await this.clickNext();
    await this.waitForText("Downloading the data collection program");
    await this.waitForText("Disconnect USB and connect battery pack");
    await this.clickNext();
    await this.waitForText("Copy pattern");
    await this.enterBluetoothPattern();
    await this.clickNext();
    await this.waitForText("Connect to micro:bit using Web Bluetooth");
    await this.clickNext();
    await this.waitForText("Connect using Web Bluetooth");
  }

  async enterBluetoothPattern() {
    await this.page.locator(".css-1jvu5j > .chakra-button").first().click();
    await this.page.locator("div:nth-child(11) > .chakra-button").click();
    await this.page.locator("div:nth-child(17) > .chakra-button").click();
    await this.page.locator("div:nth-child(23) > .chakra-button").click();
    await this.page.locator("div:nth-child(29) > .chakra-button").click();
  }
}
