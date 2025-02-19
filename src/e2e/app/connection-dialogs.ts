/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { expect, Locator, type Page } from "@playwright/test";
import { MockWebUSBConnection } from "../../device/mockUsb";
import { MockWebBluetoothConnection } from "../../device/mockBluetooth";
import { ConnectionStatus } from "@microbit/microbit-connection";

export const dialogTitles: {
  bluetooth: Record<string, string>;
  radio: Record<string, string>;
} = {
  bluetooth: {
    whatYouNeed: "What you need to connect using Web Bluetooth",
    connectUsb: "Connect USB cable to micro:bit",
    download: "Download data collection program to micro:bit",
    connectBattery: "Disconnect USB and connect battery pack",
    copyPattern: "Copy pattern",
    connectBluetooth: "Connect to micro:bit using Web Bluetooth",
  },
  radio: {
    whatYouNeed: "What you need to connect using micro:bit radio",
    connect1: "Connect USB cable to micro:bit 1",
    download1: "Download data collection program to micro:bit 1",
    connectBattery: "Disconnect USB and connect battery pack",
    connect2: "Connect USB cable to micro:bit 2",
    download2: "Download radio link program to micro:bit 2",
  },
};

export class ConnectionDialogs {
  public types = dialogTitles;
  private tryAgainButton: Locator;

  constructor(public readonly page: Page) {
    this.tryAgainButton = this.page.getByRole("button", { name: "Try again" });
  }

  async close() {
    await this.page.getByLabel("Close").click();
  }

  async waitForText(name: string) {
    await this.page.getByText(name).waitFor();
  }

  async clickNext() {
    await this.page.getByRole("button", { name: "Next" }).click();
  }

  async switchToRadio() {
    await this.page
      .getByRole("button", { name: "Connect using micro:bit radio" })
      .click();
  }

  async expectConnectWebUsbErrorDialog() {
    await expect(this.page.getByText("Connect using WebUSB")).toBeVisible();
    await expect(this.tryAgainButton).toBeVisible();
  }

  async expectManualTransferProgramDialog() {
    await expect(
      this.page.getByText("Transfer saved hex file to micro:bit")
    ).toBeVisible();
  }

  async expectDidntChooseMicrobitDialog() {
    await expect(
      this.page.getByText(
        "You didn't choose a micro:bit. Do you want to try again?"
      )
    ).toBeVisible();
    await expect(this.tryAgainButton).toBeVisible();
  }

  async mockUsbDeviceNotSelected() {
    await this.page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      const usb = (window as any).mockUsb as MockWebUSBConnection;
      usb.mockDeviceId(undefined);
    });
  }

  async mockBluetoothStatus(status: ConnectionStatus[]) {
    await this.page.evaluate((results: ConnectionStatus[]) => {
      const mockBluetooth =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        (window as any).mockBluetooth as MockWebBluetoothConnection;
      mockBluetooth.mockConnectResults(results);
    }, status);
  }

  async mockBluetoothDeviceNotSelected() {
    await this.mockBluetoothStatus([ConnectionStatus.NO_AUTHORIZED_DEVICE]);
  }

  async enterBluetoothPattern() {
    const numCols = 5;
    for (let i = 0; i < numCols; i++) {
      const n = (i + 1).toString();
      await this.page.getByLabel(`Column ${n} - number of LEDs lit`).fill(n);
    }
  }
}
