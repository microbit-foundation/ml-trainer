import { useCallback } from "react";
import { DownloadProjectActions } from "../download-project-actions";
import {
  DownloadProjectStage,
  DownloadProjectStep,
} from "../download-project-hooks";
import ConnectCableDialog from "./ConnectCableDialog";
import DownloadingDialog from "./DownloadingDialog";
import DownloadProjectChooseMicrobitDialog from "./DownloadProjectChooseMicrobitDialog";
import DownloadProjectIntroDialog from "./DownloadProjectIntroDialog";
import ManualFlashingDialog from "./ManualFlashingDialog";
import SelectMicrobitUsbDialog from "./SelectMicrobitUsbDialog";

interface DownloadProjectFlowDialogsProps {
  stage: DownloadProjectStage;
  actions: DownloadProjectActions;
  flashProgress: number;
}

const DownloadProjectFlowDialogs = ({
  stage,
  actions,
  flashProgress,
}: DownloadProjectFlowDialogsProps) => {
  const handleDownloadProject = useCallback(async () => {
    await actions.connectAndFlashMicrobit(stage);
  }, [actions, stage]);

  switch (stage.step) {
    case DownloadProjectStep.Introduction: {
      return (
        <DownloadProjectIntroDialog
          onClose={actions.close}
          onNext={actions.onIntroNext}
        />
      );
    }
    case DownloadProjectStep.ChooseSameOrAnotherMicrobit: {
      return (
        <DownloadProjectChooseMicrobitDialog
          onBackClick={actions.getOnBack()}
          onClose={actions.close}
          onDifferentMicrobitClick={actions.onChosenDifferentMicrobit}
          onSameMicrobitClick={actions.onChosenSameMicrobit}
          isOpen={true}
          stage={stage}
        />
      );
    }
    case DownloadProjectStep.ConnectCable: {
      return (
        <ConnectCableDialog
          isOpen={true}
          onClose={actions.close}
          onBackClick={actions.getOnBack()}
          onNextClick={actions.getOnNext()}
          config={{
            headingId: "connectMB.connectCable.heading",
            subtitleId: "connectMB.connectCable.downloadProject.subtitle",
          }}
        />
      );
    }
    case DownloadProjectStep.WebUsbFlashingTutorial: {
      return (
        <SelectMicrobitUsbDialog
          isOpen={true}
          onClose={actions.close}
          onBackClick={actions.getOnBack()}
          onNextClick={handleDownloadProject}
        />
      );
    }
    case DownloadProjectStep.FlashingInProgress: {
      return (
        <DownloadingDialog
          headingId="connectMB.usbDownloading.header"
          isOpen={true}
          progress={flashProgress * 100}
        />
      );
    }
    case DownloadProjectStep.ManualFlashingTutorial: {
      if (!stage.projectHex || !stage.projectName) {
        throw new Error("Project hex and name is needed for manual flashing!");
      }
      return (
        <ManualFlashingDialog
          hexFile={{
            type: "data",
            source: stage.projectHex,
            name: stage.projectName + ".hex",
          }}
          isOpen={true}
          onClose={actions.close}
          closeIsPrimaryAction={true}
        />
      );
    }
    case DownloadProjectStep.None:
    case DownloadProjectStep.WebUsbChooseMicrobit:
      return <></>;
  }
};

export default DownloadProjectFlowDialogs;
