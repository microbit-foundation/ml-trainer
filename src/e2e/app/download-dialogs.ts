/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { expect, Locator, type Page } from "@playwright/test";
import { MockWebUSBConnection } from "../../device/mockUsb";
import {
  ConnectBehavior,
  MockWebBluetoothConnection,
} from "../../device/mockBluetooth";

export const downloadDialogTitles: {
  browserDefault: Record<string, string>;
  nativeBluetooth: Record<string, string>;
  radio: Record<string, string>;
} = {
  browserDefault: {
    help: "Download your machine learning MakeCode project",
    chooseMicrobit: "Which micro:bit do you want to use?",
    connectCable: "Connect USB cable to micro:bit",
    selectMicrobit: "Select micro:bit",
    manualFlashing: "Transfer saved hex file to micro:bit",
  },
  nativeBluetooth: {
    help: "Download your machine learning MakeCode project",
    resetToBluetooth: "Reset to Bluetooth mode",
    copyPattern: "Copy pattern",
    manualFlashing: "Transfer saved hex file to micro:bit",
  },
  radio: {
    help: "Download your machine learning MakeCode project",
    unplugBridge: "Unplug the radio link micro:bit",
    connectRemote: "Connect USB cable to the data collection micro:bit",
    selectMicrobit: "Select micro:bit",
    manualFlashing: "Transfer saved hex file to micro:bit",
  },
};

export class DownloadDialogs {
  public titles = downloadDialogTitles;
  private nextButton: Locator;
  private backButton: Locator;
  private closeButton: Locator;

  constructor(public readonly page: Page) {
    this.nextButton = this.page.getByRole("button", { name: "Next" });
    this.backButton = this.page.getByRole("button", { name: "Back" });
    this.closeButton = this.page.getByLabel("Close");
  }

  async close() {
    await this.closeButton.click();
  }

  async waitForText(text: string) {
    await this.page.getByText(text, { exact: true }).first().waitFor();
  }

  async waitForHeading(text: string) {
    await this.page.getByRole("heading", { name: text }).waitFor();
  }

  async clickNext() {
    await this.nextButton.click();
  }

  async clickBack() {
    await this.backButton.click();
  }

  async clickSameMicrobit() {
    await this.page.getByRole("button", { name: "Same micro:bit" }).click();
  }

  async clickDifferentMicrobit() {
    await this.page
      .getByRole("button", { name: "Different micro:bit" })
      .click();
  }

  async checkDontShowAgain() {
    // Click on the label text instead of the checkbox input due to Chakra UI styling
    await this.page.getByText("Don't show this again").click();
  }

  async expectManualFlashingDialog() {
    await expect(
      this.page.getByText(downloadDialogTitles.browserDefault.manualFlashing)
    ).toBeVisible();
  }

  async expectHelpDialog() {
    await expect(
      this.page.getByText(downloadDialogTitles.browserDefault.help)
    ).toBeVisible();
  }

  async expectChooseMicrobitDialog() {
    await expect(
      this.page.getByText(downloadDialogTitles.browserDefault.chooseMicrobit)
    ).toBeVisible();
  }

  async expectDialogClosed() {
    // Verify no download dialog is visible
    await expect(
      this.page.getByText(downloadDialogTitles.browserDefault.help)
    ).not.toBeVisible();
    await expect(
      this.page.getByText(downloadDialogTitles.browserDefault.chooseMicrobit)
    ).not.toBeVisible();
  }

  async mockUsbDeviceNotSelected() {
    await this.page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      const usb = (window as any).mockUsb as MockWebUSBConnection;
      usb.mockDeviceId(undefined);
    });
  }

  async enterBluetoothPattern() {
    const numCols = 5;
    for (let i = 0; i < numCols; i++) {
      const n = (i + 1).toString();
      await this.page.getByLabel(`Column ${n} - number of LEDs lit`).fill(n);
    }
  }

  /**
   * Set behaviors for subsequent Bluetooth connect() calls.
   * Each behavior is consumed in order. When empty, defaults to success.
   */
  async setBluetoothConnectBehaviors(behaviors: ConnectBehavior[]) {
    await this.page.evaluate((b: ConnectBehavior[]) => {
      const mockBluetooth =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        (window as any).mockBluetooth as MockWebBluetoothConnection;
      mockBluetooth.setConnectBehaviors(b);
    }, behaviors);
  }

  /**
   * Expect the "connect failed" dialog for native bluetooth download flow.
   */
  async expectConnectFailedDialog() {
    await expect(
      this.page.getByText("Could not connect to micro:bit")
    ).toBeVisible({ timeout: 10000 });
  }

  /**
   * Click the "Try again" button in the connect failed dialog.
   */
  async clickTryAgainButton() {
    await this.page.getByRole("button", { name: "Try again" }).click();
  }
}
