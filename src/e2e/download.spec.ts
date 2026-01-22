/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { downloadDialogTitles as dialog } from "./app/download-dialogs";
import { test } from "./fixtures";

test.describe("browser default download flow", () => {
  test.beforeEach(async ({ homePage, newPage, dataSamplesPage }) => {
    await homePage.setupContext();
    await homePage.goto();
    await homePage.getStarted();
    await newPage.continueSavedSession("test-data/dataset.json");
    // Open and close connection dialog to set flow type to bluetooth
    // This simulates a user who has attempted to connect before
    const connectionDialogs = await dataSamplesPage.connect();
    await connectionDialogs.close();
    const trainModelDialog = await dataSamplesPage.trainModel();
    await trainModelDialog.train();
  });

  test("happy flow with help", async ({ testModelPage }) => {
    const makecodeEditor = await testModelPage.editInMakeCode();
    await makecodeEditor.closeTourDialog();
    const downloadDialogs = await makecodeEditor.clickDownload();
    await downloadDialogs.waitForText(dialog.browserDefault.help);
    await downloadDialogs.clickNext();
    await downloadDialogs.waitForText(dialog.browserDefault.connectCable);
    await downloadDialogs.clickNext();
    await downloadDialogs.waitForText(dialog.browserDefault.selectMicrobit);
    await downloadDialogs.clickNext();
    // With mock device, should complete successfully
    await downloadDialogs.expectDialogClosed();
  });

  test("help checkbox skips help next time", async ({ testModelPage }) => {
    const makecodeEditor = await testModelPage.editInMakeCode();
    await makecodeEditor.closeTourDialog();

    // First download: check "don't show again" and proceed to next step
    let downloadDialogs = await makecodeEditor.clickDownload();
    await downloadDialogs.waitForText(dialog.browserDefault.help);
    await downloadDialogs.checkDontShowAgain();
    await downloadDialogs.clickNext();
    // Setting is saved when clicking Next, close the connect cable dialog
    await downloadDialogs.waitForText(dialog.browserDefault.connectCable);
    await downloadDialogs.close();

    // Second download: should skip help and go straight to connect cable
    downloadDialogs = await makecodeEditor.clickDownload();
    await downloadDialogs.waitForText(dialog.browserDefault.connectCable);
    await downloadDialogs.close();
  });

  test("falls back to manual download on connect failure", async ({
    testModelPage,
  }) => {
    const makecodeEditor = await testModelPage.editInMakeCode();
    await makecodeEditor.closeTourDialog();
    const downloadDialogs = await makecodeEditor.clickDownload();
    await downloadDialogs.mockUsbDeviceNotSelected();
    await downloadDialogs.waitForText(dialog.browserDefault.help);
    await downloadDialogs.clickNext();
    await downloadDialogs.waitForText(dialog.browserDefault.connectCable);
    await downloadDialogs.clickNext();
    await downloadDialogs.waitForText(dialog.browserDefault.selectMicrobit);
    await downloadDialogs.clickNext();
    await downloadDialogs.expectManualFlashingDialog();
  });
});

test.describe("native bluetooth download flow", () => {
  test.beforeEach(async ({ homePage, newPage, dataSamplesPage }) => {
    await homePage.setupContext();
    await homePage.goto(["simulateNative"]);
    await homePage.getStarted();
    await newPage.continueSavedSession("test-data/dataset.json");
    const trainModelDialog = await dataSamplesPage.trainModel();
    await trainModelDialog.train();
  });

  test("happy flow", async ({ testModelPage }) => {
    const makecodeEditor = await testModelPage.editInMakeCode();
    await makecodeEditor.closeTourDialog();
    const downloadDialogs = await makecodeEditor.clickDownload();
    await downloadDialogs.waitForText(dialog.nativeBluetooth.help);
    await downloadDialogs.clickNext();
    await downloadDialogs.waitForText(dialog.nativeBluetooth.resetToBluetooth);
    await downloadDialogs.clickNext();
    await downloadDialogs.waitForText(dialog.nativeBluetooth.copyPattern);
    await downloadDialogs.enterBluetoothPattern();
    await downloadDialogs.clickNext();
    // With mock device, should complete successfully
    await downloadDialogs.expectDialogClosed();
  });

  test("connect failure shows error and retry goes back to reset tutorial", async ({
    testModelPage,
  }) => {
    const makecodeEditor = await testModelPage.editInMakeCode();
    await makecodeEditor.closeTourDialog();
    const downloadDialogs = await makecodeEditor.clickDownload();
    // First connect fails, second succeeds
    await downloadDialogs.setBluetoothConnectBehaviors([
      { outcome: "error", code: "reconnect-microbit" },
      { outcome: "success" },
    ]);
    await downloadDialogs.waitForText(dialog.nativeBluetooth.help);
    await downloadDialogs.clickNext();
    await downloadDialogs.waitForText(dialog.nativeBluetooth.resetToBluetooth);
    await downloadDialogs.clickNext();
    await downloadDialogs.waitForText(dialog.nativeBluetooth.copyPattern);
    await downloadDialogs.enterBluetoothPattern();
    await downloadDialogs.clickNext();
    // Connect failure shows error dialog
    await downloadDialogs.expectConnectFailedDialog();
    // Retry should go back to reset tutorial
    await downloadDialogs.clickTryAgainButton();
    await downloadDialogs.waitForText(dialog.nativeBluetooth.resetToBluetooth);
  });
});

// Radio download flow tests are in connection-flow.spec.ts
// They run after the radio connection tests since the download flow
// requires having previously connected via radio.
