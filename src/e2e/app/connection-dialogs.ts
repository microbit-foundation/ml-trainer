/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { expect, Locator, type Page } from "@playwright/test";
import { MockWebUSBConnection } from "../../device/mockUsb";
import { MockWebBluetoothConnection } from "../../device/mockBluetooth";
import { ConnectionStatus } from "@microbit/microbit-connection";

interface DialogStep {
  text: string;
  next?: "skip" | "copy-pattern";
}

const dialogTypes: {
  bluetooth: Record<string, DialogStep>;
  radio: Record<string, DialogStep>;
} = {
  bluetooth: {
    whatYouNeed: { text: "What you need to connect using Web Bluetooth" },
    connectUsb: { text: "Connect USB cable to micro:bit" },
    download: { text: "Download data collection program to micro:bit" },
    downloading: {
      text: "Downloading the data collection program",
      next: "skip",
    },
    connectBattery: { text: "Disconnect USB and connect battery pack" },
    copyPattern: { text: "Copy pattern", next: "copy-pattern" },
    connectBluetooth: { text: "Connect to micro:bit using Web Bluetooth" },
    connecting: { text: "Connect using Web Bluetooth", next: "skip" },
  },
  radio: {
    whatYouNeed: { text: "What you need to connect using micro:bit radio" },
    connect1: { text: "Connect USB cable to micro:bit 1" },
    download1: { text: "Download data collection program to micro:bit 1" },
    downloading1: {
      text: "Downloading the data collection program",
      next: "skip",
    },
    connectBattery: { text: "Disconnect USB and connect battery pack" },
    connect2: { text: "Connect USB cable to micro:bit 2" },
    download2: { text: "Download radio link program to micro:bit 2" },
    downloading2: {
      text: "Downloading the radio link program",
      next: "skip",
    },
    connecting: {
      text: "Connecting micro:bits",
      next: "skip",
    },
  },
};

const bluetoothFlow = [
  dialogTypes.bluetooth.whatYouNeed,
  dialogTypes.bluetooth.connectUsb,
  dialogTypes.bluetooth.download,
  dialogTypes.bluetooth.downloading,
  dialogTypes.bluetooth.connectBattery,
  dialogTypes.bluetooth.copyPattern,
  dialogTypes.bluetooth.connectBluetooth,
  dialogTypes.bluetooth.connecting,
];

const radioFlow = [
  dialogTypes.radio.whatYouNeed,
  dialogTypes.radio.connect1,
  dialogTypes.radio.download1,
  dialogTypes.radio.downloading1,
  dialogTypes.radio.connectBattery,
  dialogTypes.radio.connect2,
  dialogTypes.radio.download2,
  dialogTypes.radio.downloading2,
  dialogTypes.radio.connecting,
];

export class ConnectionDialogs {
  public types = dialogTypes;
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

  private async clickNext() {
    await this.page.getByRole("button", { name: "Next" }).click();
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

  async connect(options: {
    stopAfterText?: string;
    type: "radio" | "bluetooth";
  }) {
    if (options.type === "radio") {
      await this.page
        .getByRole("button", { name: "Connect using micro:bit radio" })
        .click();
    }
    const steps = options.type === "bluetooth" ? bluetoothFlow : radioFlow;
    for (const { text, next } of steps) {
      await this.waitForText(text);
      switch (next) {
        case "skip":
          break;
        case "copy-pattern": {
          await this.enterBluetoothPattern();
          await this.clickNext();
          break;
        }
        default:
          await this.clickNext();
      }
      if (options.stopAfterText && options.stopAfterText === text) {
        return;
      }
    }
  }

  async enterBluetoothPattern() {
    await this.page.locator(".css-1jvu5j > .chakra-button").first().click();
    await this.page.locator("div:nth-child(11) > .chakra-button").click();
    await this.page.locator("div:nth-child(17) > .chakra-button").click();
    await this.page.locator("div:nth-child(23) > .chakra-button").click();
    await this.page.locator("div:nth-child(29) > .chakra-button").click();
  }
}
