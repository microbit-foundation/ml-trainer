/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { dialogTitles as dialog } from "./app/connection-dialogs";
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
    await connectionDialogs.waitForText(dialog.bluetooth.whatYouNeed);
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.bluetooth.connectUsb);
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.bluetooth.download);
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.bluetooth.connectBattery);
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.bluetooth.copyPattern);
    await connectionDialogs.enterBluetoothPattern();
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.bluetooth.connectBluetooth);
    await connectionDialogs.clickNext();
    await dataSamplesPage.expectConnected();
  });

  test("no device selected for flashing", async ({ dataSamplesPage }) => {
    const connectionDialogs = await dataSamplesPage.connect();
    await connectionDialogs.mockUsbDeviceNotSelected();
    await connectionDialogs.waitForText(dialog.bluetooth.whatYouNeed);
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.bluetooth.connectUsb);
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.bluetooth.download);
    await connectionDialogs.clickNext();
    await connectionDialogs.expectManualTransferProgramDialog();
  });

  test("no device selected for connecting", async ({ dataSamplesPage }) => {
    const connectionDialogs = await dataSamplesPage.connect();
    await connectionDialogs.mockBluetoothDeviceNotSelected();
    await connectionDialogs.waitForText(dialog.bluetooth.whatYouNeed);
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.bluetooth.connectUsb);
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.bluetooth.download);
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.bluetooth.connectBattery);
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.bluetooth.copyPattern);
    await connectionDialogs.enterBluetoothPattern();
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.bluetooth.connectBluetooth);
    await connectionDialogs.clickNext();
    await connectionDialogs.expectDidntChooseMicrobitDialog();
  });
});

test.describe("radio connection", () => {
  test.beforeEach(async ({ homePage, newPage }) => {
    await homePage.setupContext();
    await homePage.goto();
    await homePage.getStarted();
    await newPage.startNewSession();
  });

  test("happy flow", async ({ dataSamplesPage }) => {
    const connectionDialogs = await dataSamplesPage.connect();
    await connectionDialogs.switchToRadio();
    await connectionDialogs.waitForText(dialog.radio.whatYouNeed);
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.radio.connect1);
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.radio.download1);
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.radio.connectBattery);
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.radio.connect2);
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.radio.download2);
    await connectionDialogs.clickNext();
    await dataSamplesPage.expectConnected();
  });

  test("no device selected for flashing", async ({ dataSamplesPage }) => {
    const connectionDialogs = await dataSamplesPage.connect();
    await connectionDialogs.mockUsbDeviceNotSelected();
    await connectionDialogs.switchToRadio();
    await connectionDialogs.waitForText(dialog.radio.whatYouNeed);
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.radio.connect1);
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.radio.download1);
    await connectionDialogs.clickNext();
    await connectionDialogs.expectConnectWebUsbErrorDialog();
  });
});
