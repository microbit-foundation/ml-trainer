/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { expect, Locator, type Page } from "@playwright/test";
import { ProgressStage } from "@microbit/microbit-connection";
import { MockWebUSBConnection } from "../../device/mockUsb";
import {
  ConnectBehavior,
  MockWebBluetoothConnection,
} from "../../device/mockBluetooth";
import { MockRadioBridgeConnection } from "../../device/mockRadioBridge";

export type RadioDisconnectType = "bridge" | "remote";

export const dialogTitles: {
  bluetooth: Record<string, string>;
  nativeBluetooth: Record<string, string>;
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
  nativeBluetooth: {
    whatYouNeed: "What you need to connect",
    resetToBluetooth: "Reset to Bluetooth mode",
    copyPattern: "Copy pattern",
    connectBluetooth: "Connect to micro:bit using Bluetooth",
    bluetoothDisabled: "Bluetooth is turned off",
    permissionDenied: "Bluetooth permission required",
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

  async clickTryAnotherWay() {
    await this.page.getByRole("button", { name: "Try another way" }).click();
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

  /**
   * Configure Bluetooth mock to simulate "no device selected" on next connect.
   */
  async mockBluetoothDeviceNotSelected() {
    await this.setBluetoothConnectBehaviors([{ outcome: "noDevice" }]);
  }

  /**
   * Set behaviors for subsequent Bluetooth connect() calls.
   * Each behavior is consumed in order. When empty, defaults to success.
   *
   * @example
   * // First connect fails with disconnect, second succeeds
   * await dialogs.setBluetoothConnectBehaviors([
   *   { outcome: 'failure', status: ConnectionStatus.DISCONNECTED },
   *   { outcome: 'success' },
   * ]);
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
   * Simulate the Bluetooth device disconnecting unexpectedly.
   * This triggers the app's reconnection logic.
   */
  async simulateBluetoothDisconnect() {
    await this.page.evaluate(() => {
      const mockBluetooth =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        (window as any).mockBluetooth as MockWebBluetoothConnection;
      mockBluetooth.simulateDisconnect();
    });
  }

  /**
   * Set behaviors for subsequent Radio Bridge connect() calls.
   */
  async setRadioBridgeConnectBehaviors(behaviors: ConnectBehavior[]) {
    await this.page.evaluate((b: ConnectBehavior[]) => {
      const mockRadioBridge =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        (window as any).mockRadioBridge as MockRadioBridgeConnection;
      mockRadioBridge.setConnectBehaviors(b);
    }, behaviors);
  }

  /**
   * Simulate the Radio Bridge remote micro:bit disconnecting unexpectedly.
   * USB remains connected, only the radio link fails.
   */
  async simulateRadioBridgeDisconnect() {
    await this.page.evaluate(() => {
      const mockRadioBridge =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        (window as any).mockRadioBridge as MockRadioBridgeConnection;
      mockRadioBridge.simulateDisconnect();
    });
  }

  /**
   * Simulate the USB (bridge) micro:bit disconnecting unexpectedly.
   * This propagates to the radio bridge and shows different error UI than remote disconnect.
   */
  async simulateUsbDisconnect() {
    await this.page.evaluate(() => {
      const mockUsb =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        (window as any).mockUsb as MockWebUSBConnection;
      mockUsb.simulateDisconnect();
    });
  }

  /**
   * Simulate the USB device being reconnected (e.g., user plugs it back in).
   */
  async simulateUsbReconnect() {
    await this.page.evaluate(() => {
      const mockUsb =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        (window as any).mockUsb as MockWebUSBConnection;
      mockUsb.simulateReconnect();
    });
  }

  /**
   * Simulate a radio connection disconnect with specific type.
   * @param type - 'bridge' simulates USB disconnect, 'remote' simulates radio link failure
   */
  async simulateRadioDisconnect(type: RadioDisconnectType) {
    if (type === "bridge") {
      await this.simulateUsbDisconnect();
    } else {
      await this.simulateRadioBridgeDisconnect();
    }
  }

  async enterBluetoothPattern() {
    const numCols = 5;
    for (let i = 0; i < numCols; i++) {
      const n = (i + 1).toString();
      await this.page.getByLabel(`Column ${n} - number of LEDs lit`).fill(n);
    }
  }

  /**
   * Expect the "connection lost" dialog (first disconnect after being connected).
   */
  async expectConnectionLostDialog() {
    await expect(
      this.page.getByText("Data collection micro:bit connection lost")
    ).toBeVisible({ timeout: 10000 });
  }

  /**
   * Expect the "connect failed" dialog (fresh connection attempt failed).
   * Shows "Failed to connect" and a "Try again" button.
   * Used for WebBluetooth and Radio flows.
   */
  async expectConnectFailedDialog() {
    await expect(
      this.page.getByText("Failed to connect to micro:bit")
    ).toBeVisible({ timeout: 10000 });
    await expect(this.tryAgainButton).toBeVisible();
  }

  /**
   * Expect the native Bluetooth error dialog.
   * Shows "Could not connect to micro:bit" and troubleshooting advice.
   * Used for NativeBluetooth flow ConnectFailed state.
   */
  async expectNativeBluetoothErrorDialog() {
    await expect(
      this.page.getByText("Could not connect to micro:bit")
    ).toBeVisible({ timeout: 10000 });
    await expect(this.tryAgainButton).toBeVisible();
  }

  /**
   * Expect the "reconnect failed" dialog (reconnection attempt failed).
   * Shows "Failed to reconnect" and a "Try again" button.
   */
  async expectReconnectFailedDialog() {
    await expect(
      this.page.getByText("Failed to reconnect to data collection micro:bit")
    ).toBeVisible({ timeout: 10000 });
    await expect(this.tryAgainButton).toBeVisible();
  }

  /**
   * Expect a radio bridge disconnect error dialog showing bridge-specific message.
   * This indicates the USB (bridge) micro:bit was disconnected.
   */
  async expectRadioBridgeDisconnectDialog() {
    await expect(
      this.page.getByText("Radio link micro:bit connection lost")
    ).toBeVisible({ timeout: 10000 });
  }

  /**
   * Expect a radio remote disconnect error dialog showing remote-specific message.
   * This indicates the data collection (remote) micro:bit was disconnected.
   */
  async expectRadioRemoteDisconnectDialog() {
    await expect(
      this.page.getByText("Data collection micro:bit connection lost")
    ).toBeVisible({ timeout: 10000 });
  }

  /**
   * Wait for the connection dialog to close.
   * Useful for waiting after a successful reconnection.
   */
  async waitForDialogToClose() {
    await expect(
      this.page.getByRole("button", { name: "Reconnect" })
    ).toBeHidden({ timeout: 10000 });
  }

  /**
   * Expect the "start over" dialog for bluetooth to be visible.
   * This shows WhatYouWillNeedDialog with reconnect=true.
   */
  async expectStartOverDialog() {
    await expect(
      this.page.getByText("Follow these instructions to restart the connection")
    ).toBeVisible({ timeout: 10000 });
  }

  /**
   * Expect the "start over" dialog for radio to be visible.
   */
  async expectRadioStartOverDialog() {
    await expect(
      this.page.getByText("Failed to reconnect to micro:bits")
    ).toBeVisible({ timeout: 10000 });
  }

  /**
   * Simulate the browser tab becoming hidden (user switched tabs).
   * This uses the fake event approach since Playwright can't truly hide tabs.
   */
  async simulateTabHidden() {
    await this.page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        value: true,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(document, "visibilityState", {
        value: "hidden",
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
  }

  /**
   * Simulate the browser tab becoming visible again (user switched back).
   */
  async simulateTabVisible() {
    await this.page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        value: false,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(document, "visibilityState", {
        value: "visible",
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
  }

  /**
   * Expect no connection error dialog to be visible.
   * Use this to verify reconnection happens silently when tab is hidden.
   */
  async expectNoConnectionErrorDialog() {
    // Check that neither the Cancel nor Reconnect buttons are visible
    await expect(
      this.page.getByRole("button", { name: "Cancel" })
    ).not.toBeVisible();
    await expect(
      this.page.getByRole("button", { name: "Reconnect" })
    ).not.toBeVisible();
  }

  /**
   * Set what checkAvailability() returns on the Bluetooth mock.
   * Used to test permission error scenarios in the native Bluetooth flow.
   */
  async setBluetoothAvailability(
    status: "available" | "disabled" | "permission-denied" | "location-disabled"
  ) {
    await this.page.evaluate((s: string) => {
      const mockBluetooth =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        (window as any).mockBluetooth as MockWebBluetoothConnection;
      mockBluetooth.setAvailabilityStatus(
        s as
          | "available"
          | "disabled"
          | "permission-denied"
          | "location-disabled"
      );
    }, status);
  }

  /**
   * Expect the "Bluetooth is turned off" dialog to be visible.
   */
  async expectBluetoothDisabledDialog() {
    await expect(
      this.page.getByText(dialogTitles.nativeBluetooth.bluetoothDisabled)
    ).toBeVisible({ timeout: 10000 });
    await expect(this.tryAgainButton).toBeVisible();
  }

  /**
   * Expect the "Bluetooth permission required" dialog to be visible.
   */
  async expectBluetoothPermissionDeniedDialog() {
    await expect(
      this.page.getByText(dialogTitles.nativeBluetooth.permissionDenied)
    ).toBeVisible({ timeout: 10000 });
    await expect(this.tryAgainButton).toBeVisible();
  }

  /**
   * Click the "Try again" button in permission error dialogs.
   */
  async clickTryAgainButton() {
    await this.tryAgainButton.click();
  }

  /**
   * Click the "Cancel" button in permission error dialogs.
   */
  async clickCancelButton() {
    await this.page.getByRole("button", { name: "Cancel" }).click();
  }

  /**
   * Expect no dialog to be visible (e.g., after clicking Cancel).
   */
  async expectNoDialog() {
    await expect(this.page.getByRole("dialog")).not.toBeVisible({
      timeout: 10000,
    });
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
          (window as any).mockBluetooth as MockWebBluetoothConnection;
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
        (window as any).mockBluetooth as MockWebBluetoothConnection;
      mockBluetooth.resumeProgress();
    });
  }
}
