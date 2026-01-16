/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useMemo } from "react";
import { useConnectionService } from "../connection-service-hooks";
import { useDataConnectionMachine } from "../data-connection-flow/data-connection-internal-hooks";
import {
  canTransition,
  DownloadDependencies,
  getDownloadState,
  setDownloadState,
  sendEvent,
} from "./download-actions";
import { useLogging } from "../logging/logging-hooks";
import { HexData } from "../model";
import { createFireEvent } from "../state-machine";
import { useSettings, useStore } from "../store";
import { useConnectionConfigStorage } from "../hooks/use-connection-config-storage";

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
    fireEvent(
      {
        type: "start",
        hex: download,
        bluetoothMicrobitName: deps.config.bluetoothMicrobitName,
      },
      deps
    );
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
    setDownloadState({ ...getDownloadState(), bluetoothMicrobitName: name });
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
});

/**
 * Type for the download actions object.
 */
export type DownloadActions = ReturnType<typeof createDownloadActions>;

export const useDownloadActions = (): DownloadActions => {
  const setDownloadFlashingProgress = useStore(
    (s) => s.setDownloadFlashingProgress
  );
  const dataConnection = useStore((s) => s.dataConnection);
  const [settings, setSettings] = useSettings();
  const [config] = useConnectionConfigStorage();
  const connectionService = useConnectionService();
  const logging = useLogging();
  const dataConnectionMachine = useDataConnectionMachine();

  const deps: DownloadDependencies = useMemo(
    () => ({
      config,
      settings,
      setSettings,
      connectionService,
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
      config,
      settings,
      setSettings,
      connectionService,
      dataConnection,
      setDownloadFlashingProgress,
      logging,
      dataConnectionMachine,
    ]
  );

  return useMemo(() => createDownloadActions(deps), [deps]);
};
