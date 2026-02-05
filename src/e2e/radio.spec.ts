/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 *
 * End-to-end tests for radio connection flows.
 */
import { ConnectionStatus } from "@microbit/microbit-connection";
import { dialogTitles as dialog } from "./app/connection-dialogs";
import { downloadDialogTitles as downloadDialog } from "./app/download-dialogs";
import { test } from "./fixtures";

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

  test("no device selected for flashing remote", async ({
    dataSamplesPage,
  }) => {
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

  test("no device selected for flashing bridge", async ({
    dataSamplesPage,
  }) => {
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
    // Now mock the USB error for the bridge micro:bit
    await connectionDialogs.mockUsbDeviceNotSelected();
    await connectionDialogs.waitForText(dialog.radio.connect2);
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.radio.download2);
    await connectionDialogs.clickNext();
    await connectionDialogs.expectConnectWebUsbErrorDialog();
  });

  test("download happy flow after radio connection", async ({
    dataSamplesPage,
    testModelPage,
  }) => {
    // Connect via radio first - this sets the flow type
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

    // Skip the connection tour dialog
    await dataSamplesPage.page
      .getByRole("button", { name: "Skip tour" })
      .click();

    // Import data samples and train model
    await dataSamplesPage.importDataSamples("test-data/dataset.json");
    const trainModelDialog = await dataSamplesPage.trainModel();
    await trainModelDialog.train();

    // Skip the "You've trained an ML model" tour dialog
    await testModelPage.page.getByRole("button", { name: "Skip tour" }).click();

    // Test download flow - should use radio flow
    const makecodeEditor = await testModelPage.editInMakeCode();
    await makecodeEditor.closeTourDialog();
    const downloadDialogs = await makecodeEditor.clickDownload();
    await downloadDialogs.waitForText(downloadDialog.radio.help);
    await downloadDialogs.clickNext();
    await downloadDialogs.waitForText(downloadDialog.radio.unplugBridge);
    await downloadDialogs.clickNext();
    await downloadDialogs.waitForText(downloadDialog.radio.connectRemote);
    await downloadDialogs.clickNext();
    await downloadDialogs.waitForText(downloadDialog.radio.selectMicrobit);
    await downloadDialogs.clickNext();
    // With mock device, should complete successfully
    await downloadDialogs.expectDialogClosed();
  });
});

test.describe("radio reconnection", () => {
  test.beforeEach(async ({ homePage, newPage, dataSamplesPage }) => {
    await homePage.setupContext();
    await homePage.goto(["skipTours"]);
    await homePage.getStarted();
    await newPage.startNewSession();

    // Connect via radio
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

  test("bridge disconnect shows bridge-specific error and reconnects", async ({
    dataSamplesPage,
  }) => {
    const connectionDialogs = dataSamplesPage.getConnectionDialogs();

    // User reconnect succeeds (auto-reconnect can't attempt when USB is disconnected)
    await connectionDialogs.setRadioBridgeConnectBehaviors([
      { outcome: "success" },
    ]);

    // Simulate USB (bridge) disconnect
    await connectionDialogs.simulateRadioDisconnect("bridge");
    // Simulate USB (bridge) auto-reconnect attempt fail
    await connectionDialogs.simulateRadioDisconnect("bridge");
    await connectionDialogs.expectRadioBridgeDisconnectDialog();

    // Simulate USB being plugged back in before user clicks reconnect
    await connectionDialogs.simulateUsbReconnect();
    await connectionDialogs.clickTryAgainButton();
    await dataSamplesPage.expectConnected();
  });

  test("remote disconnect shows remote-specific error and reconnects", async ({
    dataSamplesPage,
  }) => {
    const connectionDialogs = dataSamplesPage.getConnectionDialogs();

    // Auto-reconnect fails, then user reconnect succeeds
    await connectionDialogs.setRadioBridgeConnectBehaviors([
      { outcome: "failure", status: ConnectionStatus.DISCONNECTED },
      { outcome: "success" },
    ]);

    // Simulate radio (remote) disconnect
    await connectionDialogs.simulateRadioDisconnect("remote");
    await connectionDialogs.expectRadioRemoteDisconnectDialog();
    await connectionDialogs.clickTryAgainButton();
    await dataSamplesPage.expectConnected();
  });

  test("failed twice shows start-over dialog and restarts radio flow", async ({
    dataSamplesPage,
  }) => {
    const connectionDialogs = dataSamplesPage.getConnectionDialogs();

    // Reconnection attempts fail:
    // 1. Auto-reconnect fails → ConnectionLost (hasFailedOnce stays true)
    // 2. User retry fails → StartOver
    await connectionDialogs.setRadioBridgeConnectBehaviors([
      { outcome: "failure", status: ConnectionStatus.DISCONNECTED },
      { outcome: "failure", status: ConnectionStatus.DISCONNECTED },
    ]);

    // Simulate disconnect - auto-reconnect fails → ConnectionLost
    await connectionDialogs.simulateRadioDisconnect("remote");
    await connectionDialogs.expectRadioRemoteDisconnectDialog();

    // User retry fails → StartOver
    await connectionDialogs.clickTryAgainButton();
    await connectionDialogs.expectRadioStartOverDialog();

    // Start over should go back to radio flow (ConnectCable for micro:bit 1)
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.radio.connect1);
  });
});
