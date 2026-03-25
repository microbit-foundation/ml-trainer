/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { expect, Locator, type Page } from "@playwright/test";
import { ProgressStage } from "@microbit/microbit-connection";
import { MockUSBConnection } from "../../device/mockUsb";
import {
  ConnectBehavior,
  MockBluetoothConnection,
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
    confirmPattern: "Confirm this pattern matches your micro:bit",
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

  async clickTryAnotherWay() {
    await this.page.getByRole("button", { name: "Try another way" }).click();
  }

  async clickUnableToEnterBluetoothMode() {
    await this.page
      .getByRole("button", { name: "Unable to enter Bluetooth mode" })
      .click();
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
      const usb = (window as any).mockUsb as MockUSBConnection;
      usb.mockDeviceId(undefined);
    });
  }

  async enterBluetoothPattern() {
    await this.enterBluetoothPatternValues([1, 2, 3, 4, 5]);
  }

  async enterBluetoothPatternValues(values: number[]) {
    for (let i = 0; i < values.length; i++) {
      await this.page
        .getByLabel(`Column ${i + 1} - number of LEDs lit`)
        .fill(values[i].toString());
    }
  }

  async clickMyPatternIsDifferent() {
    await this.page
      .getByRole("button", { name: "My pattern is different" })
      .click();
  }

  async getBluetoothNameFilter(): Promise<string | undefined> {
    return this.page.evaluate(() => {
      const mockBluetooth =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        (window as any).mockBluetooth as MockBluetoothConnection;
      return mockBluetooth.nameFilter;
    });
  }

  /**
   * Set behaviors for subsequent Bluetooth connect() calls.
   * Each behavior is consumed in order. When empty, defaults to success.
   */
  async setBluetoothConnectBehaviors(behaviors: ConnectBehavior[]) {
    await this.page.evaluate((b: ConnectBehavior[]) => {
      const mockBluetooth =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        (window as any).mockBluetooth as MockBluetoothConnection;
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

  /**
   * Configure mock Bluetooth to pause at a specific progress stage.
   * Call resumeBluetoothProgress() to continue.
   *
   * @param stage - ProgressStage to pause at, or undefined to clear
   * @param progress - Progress value (0-1) or undefined for indeterminate
   */
  async setBluetoothProgressPause(
    stage: ProgressStage | undefined,
    progress: number | undefined
  ) {
    await this.page.evaluate(
      ({ stage, progress }) => {
        const mockBluetooth =
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
          (window as any).mockBluetooth as MockBluetoothConnection;
        mockBluetooth.setProgressPauseAt(stage, progress);
      },
      { stage, progress }
    );
  }

  /**
   * Resume Bluetooth progress after pause.
   */
  async resumeBluetoothProgress() {
    await this.page.evaluate(() => {
      const mockBluetooth =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        (window as any).mockBluetooth as MockBluetoothConnection;
      mockBluetooth.resumeProgress();
    });
  }
}
