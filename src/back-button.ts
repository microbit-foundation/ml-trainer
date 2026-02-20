/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

/**
 * Android back button handling.
 *
 * The Android back button fires Capacitor's "backButton" event. The
 * handler inspects app state and either navigates back in the
 * connection/download flow, closes a dialog or menu, exits the app
 * from the home page, or performs normal history navigation.
 *
 * Dialogs and menus are closed directly from app state — no browser
 * history entries are pushed or manipulated for them.
 *
 * On desktop browsers and iOS this is a no-op. Dialogs are dismissed
 * via Escape or the close button; there is no swipe-back gesture.
 *
 * All setup is performed via {@link useNativeBackButton}.
 */

import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { type MutableRefObject, useEffect, useRef } from "react";
import {
  DataConnectionStep,
  isDataConnectionDialogOpen,
} from "./data-connection-flow";
import { canTransition as canDataConnectionTransition } from "./data-connection-flow/data-connection-actions";
import { useDataConnectionMachine } from "./data-connection-flow/data-connection-internal-hooks";
import { useDownloadActions } from "./download-flow/download-hooks";
import { DownloadStep } from "./download-flow/download-types";
import { SaveStep, TrainModelDialogStage } from "./model";
import { type State, isCloseableDialogOpen, useStore } from "./store";
import { createHomePageUrl } from "./urls";

/**
 * Data connection steps where an operation is in progress and
 * back navigation must be completely ignored (swallowed).
 */
const nonCloseableDataConnectionSteps = new Set<DataConnectionStep>([
  DataConnectionStep.FlashingInProgress,
  DataConnectionStep.BluetoothConnect,
  DataConnectionStep.ConnectingMicrobits,
  // WebUSB browser picker is open — not a dialog we control.
  DataConnectionStep.WebUsbChooseMicrobit,
]);

/**
 * Download flow steps where an operation is in progress and
 * back navigation must be completely ignored (swallowed).
 */
const nonCloseableDownloadSteps = new Set<DownloadStep>([
  DownloadStep.FlashingInProgress,
  DownloadStep.BluetoothSearchConnect,
]);

/**
 * Callback registered by a menu component to close itself when the
 * back button is pressed. Only one menu can be open at a time.
 */
let activeMenuClose: (() => void) | null = null;

/**
 * Register a callback that the back button handler will invoke to
 * close the currently open menu. Called by the Menu component wrapper
 * when a menu opens on native platforms.
 */
export const setActiveMenuClose = (cb: (() => void) | null): void => {
  activeMenuClose = cb;
};

// ---------------------------------------------------------------------------
// Single entry point
// ---------------------------------------------------------------------------

interface BackButtonDeps {
  dataConnectionFireEvent: (
    event: { type: "back" } | { type: "close" }
  ) => void;
  getDownloadOnBack: () => (() => void) | undefined;
  downloadClose: () => void;
}

/**
 * Set up the Android back button listener.
 *
 * No-op on non-native platforms.
 */
export const useNativeBackButton = (): void => {
  const { fireEvent: dataConnectionFireEvent } = useDataConnectionMachine();
  const downloadActions = useDownloadActions();
  const depsRef = useRef<BackButtonDeps | null>(null);
  depsRef.current = {
    dataConnectionFireEvent,
    getDownloadOnBack: downloadActions.getOnBack,
    downloadClose: downloadActions.close,
  };
  useEffect(() => setupNativeBackButton(depsRef), []);
};

const setupNativeBackButton = (
  depsRef: MutableRefObject<BackButtonDeps | null>
): (() => void) => {
  if (!Capacitor.isNativePlatform()) {
    return () => {};
  }

  const backButtonListener = CapacitorApp.addListener("backButton", () => {
    handleNativeBackButton(depsRef);
  });

  return () => {
    void backButtonListener.then((l) => l.remove());
  };
};

// ---------------------------------------------------------------------------
// Android back button handler
// ---------------------------------------------------------------------------

/**
 * Handle the Android back button.
 *
 * Priority:
 * 1. Non-closeable dialog (flashing, BLE connect, training, etc.) → swallow
 * 2. Data connection flow dialog with "back" step → go back in flow
 * 3. Data connection flow dialog without "back" → close flow
 * 4. Download flow dialog with "back" → go back in flow
 * 5. Download flow dialog without "back" → close flow
 * 6. Open menu → close menu
 * 7. Open closeable dialog → close dialog
 * 8. Home page → exit app
 * 9. No dialog → history.back() (normal page navigation)
 */
const handleNativeBackButton = (
  depsRef: MutableRefObject<BackButtonDeps | null>
): void => {
  const deps = depsRef.current!;
  const state = useStore.getState();

  // --- Non-closeable states: swallow ---
  if (isNonCloseableState(state)) {
    return;
  }

  // --- Data connection flow ---
  const dcStep = state.dataConnection.step;
  if (isDataConnectionDialogOpen(dcStep)) {
    if (canDataConnectionTransition({ type: "back" }, state.dataConnection)) {
      deps.dataConnectionFireEvent({ type: "back" });
    } else {
      deps.dataConnectionFireEvent({ type: "close" });
    }
    return;
  }

  // --- Download flow ---
  const dlStep = state.download.step;
  if (dlStep !== DownloadStep.None) {
    const onBack = deps.getDownloadOnBack();
    if (onBack) {
      onBack();
    } else {
      deps.downloadClose();
    }
    return;
  }

  // --- Open menu → close it directly ---
  if (activeMenuClose) {
    const close = activeMenuClose;
    activeMenuClose = null;
    close();
    return;
  }

  // --- Closeable dialog → close it directly ---
  if (isCloseableDialogOpen(state)) {
    state.closeDialog();
    return;
  }

  // --- Home page: exit app (Android only) ---
  if (window.location.pathname === createHomePageUrl()) {
    void CapacitorApp.exitApp();
    return;
  }

  // --- Normal page navigation ---
  history.back();
};

/**
 * Check if the current state has a non-closeable operation in progress.
 */
const isNonCloseableState = (state: State): boolean => {
  // Data connection flow
  if (nonCloseableDataConnectionSteps.has(state.dataConnection.step)) {
    return true;
  }

  // Download flow
  if (nonCloseableDownloadSteps.has(state.download.step)) {
    return true;
  }

  // Training in progress
  if (
    state.trainModelDialogStage === TrainModelDialogStage.TrainingInProgress
  ) {
    return true;
  }

  // Save in progress
  if (state.save.step === SaveStep.SaveProgress) {
    return true;
  }

  // Recording in progress
  if (state.isRecordingDialogOpen) {
    return true;
  }

  return false;
};
