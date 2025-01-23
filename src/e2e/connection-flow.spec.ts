/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { test } from "./fixtures";

test.describe("bluetooth connection", () => {
  test.beforeEach(async ({ homePage, newPage }) => {
    await homePage.setupContext();
    await homePage.goto();
    await homePage.getStarted();
    await newPage.startNewSession();
  });

  test("happy flow", async ({ dataSamplesPage }) => {
    const connectionDialogs = await dataSamplesPage.connect();
    await connectionDialogs.bluetoothConnect();
    await dataSamplesPage.expectConnected();
  });

  test("no device selected for flashing", async ({ dataSamplesPage }) => {
    const connectionDialogs = await dataSamplesPage.connect();
    await connectionDialogs.mockUsbDeviceNotSelected();
    await connectionDialogs.bluetoothConnect({
      stopAfterText: connectionDialogs.types.bluetooth.download.text,
    });
    await connectionDialogs.expectManualTransferProgramDialog();
  });

  test("no device selected for connecting", async ({ dataSamplesPage }) => {
    const connectionDialogs = await dataSamplesPage.connect();
    await connectionDialogs.mockBluetoothDeviceNotSelected();
    await connectionDialogs.bluetoothConnect({
      stopAfterText: connectionDialogs.types.bluetooth.connectBluetooth.text,
    });
    await connectionDialogs.expectDidntChooseMicrobitDialog();
  });
});
