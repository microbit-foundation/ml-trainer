/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 *
 * End-to-end tests for web Bluetooth connection flows.
 */
import { ConnectionStatus } from "@microbit/microbit-connection";
import { dialogTitles as dialog } from "./app/connection-dialogs";
import { test } from "./fixtures";

test.describe("web bluetooth connection", () => {
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

  test("fresh connection failure shows connect-failed text", async ({
    dataSamplesPage,
  }) => {
    const connectionDialogs = await dataSamplesPage.connect();
    // First connection attempt fails, second succeeds
    await connectionDialogs.setBluetoothConnectBehaviors([
      { outcome: "failure", status: ConnectionStatus.DISCONNECTED },
      { outcome: "success" },
    ]);
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
    // Fresh connection failure shows "connect failed" (not "reconnect failed")
    // because user has never connected successfully
    await connectionDialogs.expectConnectFailedDialog();
    await connectionDialogs.clickTryAgainButton();
    await dataSamplesPage.expectConnected();
  });
});

test.describe("web bluetooth reconnection", () => {
  test.beforeEach(async ({ homePage, newPage, dataSamplesPage }) => {
    await homePage.setupContext();
    await homePage.goto(["skipTours"]);
    await homePage.getStarted();
    await newPage.startNewSession();

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

  test("connection lost shows error dialog and reconnects", async ({
    dataSamplesPage,
  }) => {
    const connectionDialogs = dataSamplesPage.getConnectionDialogs();

    // Auto-reconnect fails, then user reconnect succeeds
    await connectionDialogs.setBluetoothConnectBehaviors([
      { outcome: "failure", status: ConnectionStatus.DISCONNECTED },
      { outcome: "success" },
    ]);

    await connectionDialogs.simulateBluetoothDisconnect();
    // First failure shows "connection lost" dialog
    await connectionDialogs.expectConnectionLostDialog();
    await connectionDialogs.clickTryAgainButton();
    await dataSamplesPage.expectConnected();
  });

  test("failed reconnection shows start-over dialog", async ({
    dataSamplesPage,
  }) => {
    const connectionDialogs = dataSamplesPage.getConnectionDialogs();

    // Auto-reconnect fails, user reconnect fails, then user restarts flow
    await connectionDialogs.setBluetoothConnectBehaviors([
      { outcome: "failure", status: ConnectionStatus.DISCONNECTED },
      { outcome: "failure", status: ConnectionStatus.DISCONNECTED },
      { outcome: "success" },
    ]);

    await connectionDialogs.simulateBluetoothDisconnect();
    await connectionDialogs.expectConnectionLostDialog();
    await connectionDialogs.clickTryAgainButton();
    await connectionDialogs.expectStartOverDialog();
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.bluetooth.connectUsb);
  });

  test("disconnect while tab hidden reconnects silently", async ({
    dataSamplesPage,
  }) => {
    const connectionDialogs = dataSamplesPage.getConnectionDialogs();

    // Reconnect will succeed on first attempt
    await connectionDialogs.setBluetoothConnectBehaviors([
      { outcome: "success" },
    ]);

    // Hide tab, then disconnect
    await connectionDialogs.simulateTabHidden();
    await connectionDialogs.simulateBluetoothDisconnect();

    // Give time for reconnection to complete - no error dialog should appear
    await dataSamplesPage.page.waitForTimeout(500);
    await connectionDialogs.expectNoConnectionErrorDialog();

    // Still connected after silent reconnection
    await dataSamplesPage.expectConnected();
  });

  test("disconnect while tab hidden shows error when tab becomes visible and reconnect fails", async ({
    dataSamplesPage,
  }) => {
    const connectionDialogs = dataSamplesPage.getConnectionDialogs();

    // Many failures - the reconnect loop will consume these while tab is hidden
    // and after tab becomes visible
    await connectionDialogs.setBluetoothConnectBehaviors([
      { outcome: "failure", status: ConnectionStatus.DISCONNECTED },
      { outcome: "failure", status: ConnectionStatus.DISCONNECTED },
      { outcome: "failure", status: ConnectionStatus.DISCONNECTED },
      { outcome: "failure", status: ConnectionStatus.DISCONNECTED },
      { outcome: "failure", status: ConnectionStatus.DISCONNECTED },
      { outcome: "failure", status: ConnectionStatus.DISCONNECTED },
      { outcome: "failure", status: ConnectionStatus.DISCONNECTED },
      { outcome: "failure", status: ConnectionStatus.DISCONNECTED },
    ]);

    // Hide tab, then disconnect - triggers silent reconnection loop
    await connectionDialogs.simulateTabHidden();
    await connectionDialogs.simulateBluetoothDisconnect();

    // Make tab visible quickly - reconnect failures should now show error
    await connectionDialogs.simulateTabVisible();

    // Wait for connection lost dialog to appear
    await connectionDialogs.expectConnectionLostDialog();

    // Now set success behavior for when user clicks reconnect
    // (replaces the depleted failure queue)
    await connectionDialogs.setBluetoothConnectBehaviors([
      { outcome: "success" },
    ]);
    await connectionDialogs.clickTryAgainButton();
    await dataSamplesPage.expectConnected();
  });
});
