import { createContext, ReactNode, useContext, useState } from "react";
import { DownloadProjectActions } from "./download-project-actions";
import { useConnectActions } from "./connect-actions-hooks";
import { useConnectionStage } from "./connection-stage-hooks";

export enum DownloadProjectStep {
  None = "None",
  Introduction = "Introduction",
  ChooseSameOrAnotherMicrobit = "ChooseSameOrAnotherMicrobit",
  ConnectCable = "ConnectCable",
  WebUsbFlashingTutorial = "WebUsbFlashingTutorial",
  WebUsbChooseMicrobit = "WebUsbChooseMicrobit",
  FlashingInProgress = "FlashingInProgress",
  ManualFlashingTutorial = "ManualFlashingTutorial",
}

export enum MicrobitToFlash {
  // No micro:bit is connected.
  Default = "default",
  // Same as the connected micro:bit.
  Same = "same",
  // Different from the connected micro:bit.
  Different = "different",
}

export interface DownloadProjectStage {
  step: DownloadProjectStep;
  projectHex?: string;
  projectName?: string;
  skipIntro: boolean;
  microbitToFlash: MicrobitToFlash;
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
    microbitToFlash: MicrobitToFlash.Default,
    skipIntro: false,
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
