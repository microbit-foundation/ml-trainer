/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useMemo } from "react";
import { useConnectActions } from "../connect-actions-hooks";
import {
  useConnectionConfigStorage,
  useConnectionStage,
} from "../connection-stage-hooks";
import { DownloadProjectActions } from "../download-actions";
import { useSettings, useStore } from "../store";

export const useDownloadActions = (): DownloadProjectActions => {
  const stage = useStore((s) => s.download);
  const setDownloadFlashingProgress = useStore(
    (s) => s.setDownloadFlashingProgress
  );
  const setStage = useStore((s) => s.setDownload);
  const [settings, setSettings] = useSettings();
  const [config] = useConnectionConfigStorage();

  const connectActions = useConnectActions();
  const {
    actions: connectionStageActions,
    status: connectionStatus,
    stage: connectionStage,
  } = useConnectionStage();
  return useMemo(
    () =>
      new DownloadProjectActions(
        config,
        stage,
        setStage,
        settings,
        setSettings,
        connectActions,
        connectionStage,
        connectionStageActions,
        connectionStatus,
        setDownloadFlashingProgress
      ),
    [
      config,
      connectActions,
      connectionStage,
      connectionStageActions,
      connectionStatus,
      setDownloadFlashingProgress,
      setSettings,
      setStage,
      settings,
      stage,
    ]
  );
};
