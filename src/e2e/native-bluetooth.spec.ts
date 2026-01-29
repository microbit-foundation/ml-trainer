/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 *
 * End-to-end tests for native Bluetooth connection and download flows.
 * Also captures screenshots to: screenshots/native-bt/
 */
import * as fs from "fs";
import * as path from "path";
import { ProgressStage } from "@microbit/microbit-connection";
import { test } from "./fixtures";

const screenshotDir = "screenshots/native-bt";

// Force serial execution for consistent screenshot output
test.describe.configure({ mode: "serial" });

async function captureDialog(
  page: import("@playwright/test").Page,
  name: string
) {
  const filename = `${name}.png`;
  const filepath = path.join(screenshotDir, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`  Captured: ${filename}`);
}

test.describe("native bluetooth", () => {
  // Set viewport to iPad (standard) portrait for screenshots
  test.use({ viewport: { width: 768, height: 1024 } });

  test.beforeAll(() => {
    // Create screenshot directory for this test run
    if (fs.existsSync(screenshotDir)) {
      fs.rmSync(screenshotDir, { recursive: true });
    }
    fs.mkdirSync(screenshotDir, { recursive: true });
  });

  test("data connection flow", async ({
    homePage,
    newPage,
    dataSamplesPage,
    page,
  }) => {
    await homePage.setupContext();
    await homePage.goto(["simulateNative"]);
    // Use button role selector which works better at tablet viewport
    await page.getByRole("button", { name: "Get started" }).click();
    await newPage.startNewSession();

    const connectionDialogs = await dataSamplesPage.connect();

    // 1. What you need
    await connectionDialogs.waitForText(
      connectionDialogs.types.nativeBluetooth.whatYouNeed
    );
    await captureDialog(page, "connection-01-what-you-need");

    await connectionDialogs.clickNext();

    // 2. Reset to Bluetooth mode (triple-reset method)
    await connectionDialogs.waitForText(
      connectionDialogs.types.nativeBluetooth.resetToBluetooth
    );
    await captureDialog(page, "connection-02a-reset-to-bluetooth");

    // 2b. Try another way (A+B+reset method)
    await connectionDialogs.clickTryAnotherWay();
    await page.waitForTimeout(200);
    await captureDialog(page, "connection-02b-reset-to-bluetooth-alt");

    // 2c. Unable to enter Bluetooth mode (troubleshooting)
    await connectionDialogs.clickUnableToEnterBluetoothMode();
    await page.waitForTimeout(200);
    await captureDialog(page, "connection-02c-unable-to-enter-bluetooth-mode");

    // Switch back to continue the flow
    await connectionDialogs.clickTryAgainButton();
    await connectionDialogs.clickNext();

    // 3. Copy pattern
    await connectionDialogs.waitForText(
      connectionDialogs.types.nativeBluetooth.copyPattern
    );
    await captureDialog(page, "connection-03-copy-pattern");

    // After entering pattern and clicking Next, the flow goes to
    // FlashingInProgress -> BluetoothConnect -> Connected automatically
    await connectionDialogs.enterBluetoothPattern();

    // 4a. Capture "Finding device..." progress
    await connectionDialogs.setBluetoothProgressPause(
      ProgressStage.FindingDevice,
      undefined
    );
    await connectionDialogs.clickNext();
    await page.waitForTimeout(200);
    await captureDialog(page, "connection-04a-progress-finding");
    await connectionDialogs.resumeBluetoothProgress();

    // 4b. Capture "Connecting..." progress (indeterminate)
    await connectionDialogs.setBluetoothProgressPause(
      ProgressStage.Connecting,
      undefined
    );
    await page.waitForTimeout(200);
    await captureDialog(page, "connection-04b-progress-connecting");
    await connectionDialogs.resumeBluetoothProgress();

    // 4c. Capture "Flashing..." progress at 50% (with progress bar)
    await connectionDialogs.setBluetoothProgressPause(
      ProgressStage.PartialFlashing,
      0.5
    );
    await page.waitForTimeout(200);
    await captureDialog(page, "connection-04c-progress-flashing");
    await connectionDialogs.resumeBluetoothProgress();

    // Clear pause and wait for connection to complete
    await connectionDialogs.setBluetoothProgressPause(undefined, undefined);
    await dataSamplesPage.expectConnected();
  });

  test("data connection - bluetooth disabled error", async ({
    homePage,
    newPage,
    dataSamplesPage,
    page,
  }) => {
    await homePage.setupContext();
    await homePage.goto(["simulateNative"]);
    await page.getByRole("button", { name: "Get started" }).click();
    await newPage.startNewSession();

    const connectionDialogs = await dataSamplesPage.connect();

    // Set bluetooth as disabled before proceeding
    await connectionDialogs.setBluetoothAvailability("disabled");

    await connectionDialogs.waitForText(
      connectionDialogs.types.nativeBluetooth.whatYouNeed
    );
    await connectionDialogs.clickNext();

    // Should show bluetooth disabled error
    await connectionDialogs.expectBluetoothDisabledDialog();
    await captureDialog(page, "connection-error-bluetooth-disabled");

    // Verify recovery: enable bluetooth and try again
    await connectionDialogs.setBluetoothAvailability("available");
    await connectionDialogs.clickTryAgainButton();
    await connectionDialogs.waitForText(
      connectionDialogs.types.nativeBluetooth.resetToBluetooth
    );
  });

  test("data connection - permission denied error", async ({
    homePage,
    newPage,
    dataSamplesPage,
    page,
  }) => {
    await homePage.setupContext();
    await homePage.goto(["simulateNative"]);
    await page.getByRole("button", { name: "Get started" }).click();
    await newPage.startNewSession();

    const connectionDialogs = await dataSamplesPage.connect();

    await connectionDialogs.setBluetoothAvailability("permission-denied");

    await connectionDialogs.waitForText(
      connectionDialogs.types.nativeBluetooth.whatYouNeed
    );
    await connectionDialogs.clickNext();

    await connectionDialogs.expectBluetoothPermissionDeniedDialog();
    await captureDialog(page, "connection-error-permission-denied");

    // Verify recovery: grant permission and try again
    await connectionDialogs.setBluetoothAvailability("available");
    await connectionDialogs.clickTryAgainButton();
    await connectionDialogs.waitForText(
      connectionDialogs.types.nativeBluetooth.resetToBluetooth
    );
  });

  test("data connection - cancel from error dialog closes dialogs", async ({
    homePage,
    newPage,
    dataSamplesPage,
    page,
  }) => {
    await homePage.setupContext();
    await homePage.goto(["simulateNative"]);
    await page.getByRole("button", { name: "Get started" }).click();
    await newPage.startNewSession();

    const connectionDialogs = await dataSamplesPage.connect();
    await connectionDialogs.setBluetoothAvailability("disabled");

    await connectionDialogs.waitForText(
      connectionDialogs.types.nativeBluetooth.whatYouNeed
    );
    await connectionDialogs.clickNext();
    await connectionDialogs.expectBluetoothDisabledDialog();

    // Cancel should close all dialogs
    await connectionDialogs.clickCancelButton();
    await connectionDialogs.expectNoDialog();
  });

  test("data connection - DeviceError during connect shows same error dialogs", async ({
    homePage,
    newPage,
    dataSamplesPage,
    page,
  }) => {
    await homePage.setupContext();
    await homePage.goto(["simulateNative"]);
    await page.getByRole("button", { name: "Get started" }).click();
    await newPage.startNewSession();

    const connectionDialogs = await dataSamplesPage.connect();

    // Configure connect() to throw DeviceError with "disabled" code
    // (different from pre-flight availability check, but same dialog)
    await connectionDialogs.setBluetoothConnectBehaviors([
      { outcome: "error", code: "disabled" },
    ]);

    await connectionDialogs.waitForText(
      connectionDialogs.types.nativeBluetooth.whatYouNeed
    );
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(
      connectionDialogs.types.nativeBluetooth.resetToBluetooth
    );
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(
      connectionDialogs.types.nativeBluetooth.copyPattern
    );
    await connectionDialogs.enterBluetoothPattern();
    await connectionDialogs.clickNext();

    // Should show same bluetooth disabled dialog
    await connectionDialogs.expectBluetoothDisabledDialog();
  });

  test("data connection - connection lost", async ({
    homePage,
    newPage,
    dataSamplesPage,
    page,
  }) => {
    await homePage.setupContext();
    await homePage.goto(["simulateNative"]);
    await page.getByRole("button", { name: "Get started" }).click();
    await newPage.startNewSession();

    const connectionDialogs = await dataSamplesPage.connect();

    // Complete the connection flow
    await connectionDialogs.waitForText(
      connectionDialogs.types.nativeBluetooth.whatYouNeed
    );
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(
      connectionDialogs.types.nativeBluetooth.resetToBluetooth
    );
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(
      connectionDialogs.types.nativeBluetooth.copyPattern
    );
    await connectionDialogs.enterBluetoothPattern();
    await connectionDialogs.clickNext();

    // Wait for connection to complete
    await dataSamplesPage.expectConnected();

    // Close the post-connection tour dialog
    await page.getByText("Skip tour").click();
    await page.waitForTimeout(200);

    // Configure mock to fail on reconnect attempt (the auto-reconnect after disconnect)
    await connectionDialogs.setBluetoothConnectBehaviors([
      { outcome: "failure", status: "DISCONNECTED" as never },
    ]);

    // Simulate disconnect - this triggers auto-reconnect which will fail
    await connectionDialogs.simulateBluetoothDisconnect();

    // Wait for connection lost dialog
    await connectionDialogs.expectConnectionLostDialog();
    await captureDialog(page, "connection-error-connection-lost");
  });

  test("data connection - connect failed error", async ({
    homePage,
    newPage,
    dataSamplesPage,
    page,
  }) => {
    await homePage.setupContext();
    await homePage.goto(["simulateNative"]);
    await page.getByRole("button", { name: "Get started" }).click();
    await newPage.startNewSession();

    const connectionDialogs = await dataSamplesPage.connect();

    // Configure to fail on connect
    await connectionDialogs.setBluetoothConnectBehaviors([
      { outcome: "error", code: "reconnect-microbit" },
    ]);

    await connectionDialogs.waitForText(
      connectionDialogs.types.nativeBluetooth.whatYouNeed
    );
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(
      connectionDialogs.types.nativeBluetooth.resetToBluetooth
    );
    await connectionDialogs.clickNext();
    await connectionDialogs.waitForText(
      connectionDialogs.types.nativeBluetooth.copyPattern
    );
    await connectionDialogs.enterBluetoothPattern();
    await connectionDialogs.clickNext();

    // Should show native Bluetooth error dialog
    await connectionDialogs.expectNativeBluetoothErrorDialog();
    await captureDialog(page, "connection-error-connect-failed");

    // Verify recovery: try again goes back to reset tutorial
    await connectionDialogs.clickTryAgainButton();
    await connectionDialogs.waitForText(
      connectionDialogs.types.nativeBluetooth.resetToBluetooth
    );
  });

  test("download flow", async ({
    homePage,
    newPage,
    dataSamplesPage,
    testModelPage,
    page,
  }) => {
    // Setup: train model (no need to connect first for native BT download)
    await homePage.setupContext();
    await homePage.goto(["simulateNative"]);
    await page.getByRole("button", { name: "Get started" }).click();
    await newPage.continueSavedSession("test-data/dataset.json");

    const trainModelDialog = await dataSamplesPage.trainModel();
    await trainModelDialog.train();

    // Start download flow
    const makecodeEditor = await testModelPage.editInMakeCode();
    await makecodeEditor.closeTourDialog();
    const downloadDialogs = await makecodeEditor.clickDownload();

    // 1. Help
    await downloadDialogs.waitForText(
      downloadDialogs.titles.nativeBluetooth.help
    );
    await captureDialog(page, "download-01-help");

    await downloadDialogs.clickNext();

    // 2. Reset to Bluetooth mode (triple-reset method)
    await downloadDialogs.waitForText(
      downloadDialogs.titles.nativeBluetooth.resetToBluetooth
    );
    await captureDialog(page, "download-02a-reset-to-bluetooth");

    // 2b. Try another way (A+B+reset method)
    await downloadDialogs.clickTryAnotherWay();
    await page.waitForTimeout(200);
    await captureDialog(page, "download-02b-reset-to-bluetooth-alt");

        // 2c. Unable to enter Bluetooth mode (troubleshooting)
    await downloadDialogs.clickUnableToEnterBluetoothMode();
    await page.waitForTimeout(200);
    await captureDialog(page, "connection-02c-unable-to-enter-bluetooth-mode");

    // Switch back to continue the flow
    await downloadDialogs.clickTryAgainButton();
    await downloadDialogs.clickNext();

    // 3. Copy pattern
    await downloadDialogs.waitForText(
      downloadDialogs.titles.nativeBluetooth.copyPattern
    );
    await captureDialog(page, "download-03-copy-pattern");

    await downloadDialogs.enterBluetoothPattern();

    // 4a. Capture "Finding device..." progress
    await downloadDialogs.setBluetoothProgressPause(
      ProgressStage.FindingDevice,
      undefined
    );
    await downloadDialogs.clickNext();
    await page.waitForTimeout(200);
    await captureDialog(page, "download-04a-progress-finding");
    await downloadDialogs.resumeBluetoothProgress();

    // 4b. Capture "Connecting..." progress (indeterminate)
    await downloadDialogs.setBluetoothProgressPause(
      ProgressStage.Connecting,
      undefined
    );
    await page.waitForTimeout(200);
    await captureDialog(page, "download-04b-progress-connecting");
    await downloadDialogs.resumeBluetoothProgress();

    // 4c. Capture "Flashing..." progress at 50% (with progress bar)
    await downloadDialogs.setBluetoothProgressPause(
      ProgressStage.PartialFlashing,
      0.5
    );
    await page.waitForTimeout(200);
    await captureDialog(page, "download-04c-progress-flashing");
    await downloadDialogs.resumeBluetoothProgress();

    // Clear pause and wait for completion
    await downloadDialogs.setBluetoothProgressPause(undefined, undefined);
    await downloadDialogs.expectDialogClosed();
  });

  test("download flow - connect failed error", async ({
    homePage,
    newPage,
    dataSamplesPage,
    testModelPage,
    page,
  }) => {
    await homePage.setupContext();
    await homePage.goto(["simulateNative"]);
    await page.getByRole("button", { name: "Get started" }).click();
    await newPage.continueSavedSession("test-data/dataset.json");

    const trainModelDialog = await dataSamplesPage.trainModel();
    await trainModelDialog.train();

    const makecodeEditor = await testModelPage.editInMakeCode();
    await makecodeEditor.closeTourDialog();
    const downloadDialogs = await makecodeEditor.clickDownload();

    // Configure to fail on connect
    await downloadDialogs.setBluetoothConnectBehaviors([
      { outcome: "error", code: "reconnect-microbit" },
    ]);

    await downloadDialogs.waitForText(
      downloadDialogs.titles.nativeBluetooth.help
    );
    await downloadDialogs.clickNext();
    await downloadDialogs.waitForText(
      downloadDialogs.titles.nativeBluetooth.resetToBluetooth
    );
    await downloadDialogs.clickNext();
    await downloadDialogs.waitForText(
      downloadDialogs.titles.nativeBluetooth.copyPattern
    );
    await downloadDialogs.enterBluetoothPattern();
    await downloadDialogs.clickNext();

    // Should show connect failed
    await downloadDialogs.expectConnectFailedDialog();
    await captureDialog(page, "download-error-connect-failed");

    // Verify recovery: try again goes back to reset tutorial
    await downloadDialogs.clickTryAgainButton();
    await downloadDialogs.waitForText(
      downloadDialogs.titles.nativeBluetooth.resetToBluetooth
    );
  });
});
