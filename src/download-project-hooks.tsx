import { createContext, ReactNode, useContext, useState } from "react";
import { DownloadProjectActions } from "./download-project-actions";
import { useConnectActions } from "./connect-actions-hooks";
import { useConnectionStage } from "./connection-stage-hooks";

export enum DownloadProjectStep {
  None = "None",
  ChooseSameOrAnotherMicrobit = "ChooseSameOrAnotherMicrobit",
  ConnectCable = "ConnectCable",
  WebUsbFlashingTutorial = "WebUsbFlashingTutorial",
  WebUsbChooseMicrobit = "WebUsbChooseMicrobit",
  FlashingInProgress = "FlashingInProgress",
  ManualFlashingTutorial = "ManualFlashingTutorial",
}

export interface DownloadProjectStage {
  step: DownloadProjectStep;
  projectHex?: string;
  projectName?: string;
}

type DownloadProjectContextValue = [
  DownloadProjectStage,
  (stage: DownloadProjectStage) => void
];

const DownloadProjectContext =
  createContext<DownloadProjectContextValue | null>(null);

export const DownloadProjectContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const downloadProjectContextValue = useState<DownloadProjectStage>({
    step: DownloadProjectStep.None,
  });
  return (
    <DownloadProjectContext.Provider value={downloadProjectContextValue}>
      {children}
    </DownloadProjectContext.Provider>
  );
};

export const useDownloadProject = () => {
  const downloadProjectContextValue = useContext(DownloadProjectContext);
  if (!downloadProjectContextValue) {
    throw new Error("Missing provider");
  }
  const connectActions = useConnectActions();
  const { actions: connectionStageActions, status: connectionStatus } =
    useConnectionStage();
  const [stage, setStage] = downloadProjectContextValue;
  const [flashProgress, setFlashProgress] = useState<number>(0);
  const actions = new DownloadProjectActions(
    stage,
    setStage,
    connectActions,
    connectionStageActions,
    setFlashProgress,
    connectionStatus
  );
  return { stage, actions, flashProgress };
};
