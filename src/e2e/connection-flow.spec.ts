/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ConnectionStatus } from "@microbit/microbit-connection";
import { dialogTitles as dialog } from "./app/connection-dialogs";
import { downloadDialogTitles as downloadDialog } from "./app/download-dialogs";
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
    await connectionDialogs.clickConnectButton();
    await dataSamplesPage.expectConnected();
  });
});

test.describe("bluetooth reconnection", () => {
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
    await connectionDialogs.clickReconnectButton();
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
    await connectionDialogs.clickReconnectButton();
    await connectionDialogs.expectStartOverDialog();
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.bluetooth.connectUsb);
  });
});

test.describe("native bluetooth connection", () => {
  test.beforeEach(async ({ homePage, newPage }) => {
    await homePage.setupContext();
    await homePage.goto(["simulateNative"]);
    await homePage.getStarted();
    await newPage.startNewSession();
  });

  test("happy flow", async ({ dataSamplesPage }) => {
    const connectionDialogs = await dataSamplesPage.connect();
    await connectionDialogs.waitForText(dialog.nativeBluetooth.whatYouNeed);
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(
      dialog.nativeBluetooth.resetToBluetooth
    );
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.nativeBluetooth.copyPattern);
    await connectionDialogs.enterBluetoothPattern();
    await connectionDialogs.clickNext();
    await dataSamplesPage.expectConnected();
  });
});

test.describe("native bluetooth permission errors", () => {
  test.beforeEach(async ({ homePage, newPage }) => {
    await homePage.setupContext();
    await homePage.goto(["simulateNative"]);
    await homePage.getStarted();
    await newPage.startNewSession();
  });

  test.describe("pre-flight checkAvailability errors", () => {
    test("shows bluetooth disabled dialog when bluetooth is off", async ({
      dataSamplesPage,
    }) => {
      const connectionDialogs = await dataSamplesPage.connect();
      await connectionDialogs.setBluetoothAvailability("disabled");
      await connectionDialogs.waitForText(dialog.nativeBluetooth.whatYouNeed);
      await connectionDialogs.clickNext();
      await connectionDialogs.expectBluetoothDisabledDialog();

      // Try again after enabling bluetooth
      await connectionDialogs.setBluetoothAvailability("available");
      await connectionDialogs.clickTryAgainButton();
      await connectionDialogs.waitForText(
        dialog.nativeBluetooth.resetToBluetooth
      );
    });

    test("shows permission denied dialog when permission not granted", async ({
      dataSamplesPage,
    }) => {
      const connectionDialogs = await dataSamplesPage.connect();
      await connectionDialogs.setBluetoothAvailability("permission-denied");
      await connectionDialogs.waitForText(dialog.nativeBluetooth.whatYouNeed);
      await connectionDialogs.clickNext();
      await connectionDialogs.expectBluetoothPermissionDeniedDialog();

      // Try again after granting permission
      await connectionDialogs.setBluetoothAvailability("available");
      await connectionDialogs.clickTryAgainButton();
      await connectionDialogs.waitForText(
        dialog.nativeBluetooth.resetToBluetooth
      );
    });

    test("cancel from bluetooth disabled dialog closes dialogs", async ({
      dataSamplesPage,
    }) => {
      const connectionDialogs = await dataSamplesPage.connect();
      await connectionDialogs.setBluetoothAvailability("disabled");
      await connectionDialogs.waitForText(dialog.nativeBluetooth.whatYouNeed);
      await connectionDialogs.clickNext();
      await connectionDialogs.expectBluetoothDisabledDialog();
      await connectionDialogs.clickCancelButton();
      await connectionDialogs.expectNoDialog();
    });
  });

  test.describe("connect errors with permission-related DeviceError", () => {
    test("shows bluetooth disabled dialog when connect fails with disabled error", async ({
      dataSamplesPage,
    }) => {
      const connectionDialogs = await dataSamplesPage.connect();
      // Availability check passes, but connect will fail
      await connectionDialogs.setBluetoothConnectBehaviors([
        { outcome: "error", code: "disabled" },
        { outcome: "success" },
      ]);
      await connectionDialogs.waitForText(dialog.nativeBluetooth.whatYouNeed);
      await connectionDialogs.clickNext();
      await connectionDialogs.waitForText(
        dialog.nativeBluetooth.resetToBluetooth
      );
      await connectionDialogs.clickNext();
      await connectionDialogs.waitForText(dialog.nativeBluetooth.copyPattern);
      await connectionDialogs.enterBluetoothPattern();
      await connectionDialogs.clickNext();
      // Connect throws DeviceError with code "disabled"
      await connectionDialogs.expectBluetoothDisabledDialog();

      // Try again after enabling bluetooth
      await connectionDialogs.clickTryAgainButton();
      await connectionDialogs.waitForText(
        dialog.nativeBluetooth.resetToBluetooth
      );
    });

    test("shows permission denied dialog when connect fails with permission-denied error", async ({
      dataSamplesPage,
    }) => {
      const connectionDialogs = await dataSamplesPage.connect();
      await connectionDialogs.setBluetoothConnectBehaviors([
        { outcome: "error", code: "permission-denied" },
        { outcome: "success" },
      ]);
      await connectionDialogs.waitForText(dialog.nativeBluetooth.whatYouNeed);
      await connectionDialogs.clickNext();
      await connectionDialogs.waitForText(
        dialog.nativeBluetooth.resetToBluetooth
      );
      await connectionDialogs.clickNext();
      await connectionDialogs.waitForText(dialog.nativeBluetooth.copyPattern);
      await connectionDialogs.enterBluetoothPattern();
      await connectionDialogs.clickNext();
      await connectionDialogs.expectBluetoothPermissionDeniedDialog();

      // Try again after granting permission
      await connectionDialogs.clickTryAgainButton();
      await connectionDialogs.waitForText(
        dialog.nativeBluetooth.resetToBluetooth
      );
    });
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

  // Radio download flow tests - these run after radio connection
  // since the download flow requires having previously connected via radio.
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

test.describe("tab visibility reconnection", () => {
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
    await connectionDialogs.clickReconnectButton();
    await dataSamplesPage.expectConnected();
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
    await connectionDialogs.expectRadioBridgeDisconnectDialog();

    // Simulate USB being plugged back in before user clicks reconnect
    await connectionDialogs.simulateUsbReconnect();
    await connectionDialogs.clickReconnectButton();
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
    await connectionDialogs.clickReconnectButton();
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
    await connectionDialogs.clickReconnectButton();
    await connectionDialogs.expectRadioStartOverDialog();

    // Start over should go back to radio flow (ConnectCable for micro:bit 1)
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(dialog.radio.connect1);
  });
});
