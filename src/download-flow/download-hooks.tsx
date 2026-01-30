/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { BleClient } from "@capacitor-community/bluetooth-le";
import { useCallback, useMemo } from "react";
import { useConnections } from "../connections-hooks";
import { useDataConnectionMachine } from "../data-connection-flow/data-connection-internal-hooks";
import {
  canTransition,
  DownloadDependencies,
  sendEvent,
} from "./download-actions";
import { useLogging } from "../logging/logging-hooks";
import { HexData } from "../model";
import { isAndroid } from "../platform";
import { createFireEvent } from "../state-machine";
import { useSettings, useStore } from "../store";

const fireEvent = createFireEvent(sendEvent, "Download flow error");

/**
 * Create download actions bound to the given dependencies.
 * Actions read fresh state via getState() so they're never stale.
 */
const createDownloadActions = (deps: DownloadDependencies) => ({
  close: () => {
    fireEvent({ type: "close" }, deps);
  },

  start: (download: HexData) => {
    fireEvent({ type: "start", hex: download }, deps);
  },

  onHelpNext: (skipNextTime: boolean) => {
    fireEvent({ type: "next", skipHelpNextTime: skipNextTime }, deps);
  },

  onSkipIntro: (skipIntro: boolean) => {
    deps.setSettings({ showPreDownloadHelp: !skipIntro });
  },

  onChosenSameMicrobit: () => {
    fireEvent({ type: "choseSame" }, deps);
  },

  onChosenDifferentMicrobit: () => {
    fireEvent({ type: "choseDifferent" }, deps);
  },

  onChangeMicrobitName: (name: string) => {
    fireEvent({ type: "setMicrobitName", name }, deps);
  },

  changeBluetoothPattern: () =>
    fireEvent({ type: "changeBluetoothPattern" }, deps),

  troubleshootPairingMethod: () => {
    fireEvent({ type: "troubleshootPairingMethod" }, deps);
  },

  getOnNext: (): (() => void) | undefined => {
    if (!canTransition({ type: "next" }, deps)) {
      return undefined;
    }
    return () => fireEvent({ type: "next" }, deps);
  },

  getOnBack: (): (() => void) | undefined => {
    if (!canTransition({ type: "back" }, deps)) {
      return undefined;
    }
    return () => fireEvent({ type: "back" }, deps);
  },

  onTryAgain: () => {
    fireEvent({ type: "tryAgain" }, deps);
  },
});

/**
 * Additional actions for permission dialogs that don't go through the state machine.
 */
interface PermissionActions {
  /**
   * Opens app settings. Use when permissions have been declined.
   */
  openAppSettings: () => void;
  /**
   * Opens location settings. Only available on Android.
   * Only needed on older Android (< API 31) where location is required for BLE.
   */
  openLocationSettings?: () => void;
}

/**
 * Type for the download actions object.
 */
export type DownloadActions = ReturnType<typeof createDownloadActions> &
  PermissionActions;

export const useDownloadActions = (): DownloadActions => {
  const setDownloadFlashingProgress = useStore(
    (s) => s.setDownloadFlashingProgress
  );
  const dataConnection = useStore((s) => s.dataConnection);
  const [settings, setSettings] = useSettings();
  const connections = useConnections();
  const logging = useLogging();
  const dataConnectionMachine = useDataConnectionMachine();

  const openAppSettings = useCallback(() => {
    BleClient.openAppSettings().catch(() => {});
  }, []);

  const openLocationSettings = useCallback(() => {
    BleClient.openLocationSettings().catch(() => {});
  }, []);

  const android = isAndroid();

  const deps: DownloadDependencies = useMemo(
    () => ({
      settings,
      setSettings,
      connections,
      dataConnection,
      flashingProgressCallback: setDownloadFlashingProgress,
      logging,
      disconnect: async () => {
        // Disconnect and reset - the micro:bit is being reused so reconnect won't work
        await dataConnectionMachine.sendEvent({ type: "disconnect" });
        await dataConnectionMachine.sendEvent({ type: "reset" });
      },
    }),
    [
      settings,
      setSettings,
      connections,
      dataConnection,
      setDownloadFlashingProgress,
      logging,
      dataConnectionMachine,
    ]
  );

  return useMemo(
    () => ({
      ...createDownloadActions(deps),
      openAppSettings,
      openLocationSettings: android ? openLocationSettings : undefined,
    }),
    [deps, openAppSettings, openLocationSettings, android]
  );
};
