import { useCallback } from "react";
import ConnectCableDialog from "./ConnectCableDialog";
import DownloadingDialog from "./DownloadingDialog";
import DownloadProjectChooseMicrobitDialog from "./DownloadProjectChooseMicrobitDialog";
import DownloadProjectHelpDialog from "./DownloadProjectHelpDialog";
import ManualFlashingDialog from "./ManualFlashingDialog";
import SelectMicrobitUsbDialog from "./SelectMicrobitUsbDialog";
import { DownloadProjectStep } from "../model";
import { useDownloadActions } from "../hooks/download-hooks";
import { useStore } from "../store";

const DownloadProjectDialogs = () => {
  const actions = useDownloadActions();
  const stage = useStore((s) => s.downloadStage);
  const handleDownloadProject = useCallback(async () => {
    await actions.connectAndFlashMicrobit(stage);
  }, [actions, stage]);

  switch (stage.step) {
    case DownloadProjectStep.Help:
      return (
        <DownloadProjectHelpDialog
          isOpen
          onClose={actions.close}
          onNext={actions.onHelpNext}
        />
      );
    case DownloadProjectStep.ChooseSameOrAnotherMicrobit:
      return (
        <DownloadProjectChooseMicrobitDialog
          isOpen
          onBackClick={actions.getOnBack()}
          onClose={actions.close}
          onDifferentMicrobitClick={actions.onChosenDifferentMicrobit}
          onSameMicrobitClick={actions.onChosenSameMicrobit}
          stage={stage}
        />
      );
    case DownloadProjectStep.ConnectCable:
      return (
        <ConnectCableDialog
          isOpen
          onClose={actions.close}
          onBackClick={actions.getOnBack()}
          onNextClick={actions.getOnNext()}
          config={{
            headingId: "connectMB.connectCable.heading",
            subtitleId: "connectMB.connectCable.downloadProject.subtitle",
          }}
        />
      );
    case DownloadProjectStep.WebUsbFlashingTutorial:
      return (
        <SelectMicrobitUsbDialog
          isOpen
          onClose={actions.close}
          onBackClick={actions.getOnBack()}
          onNextClick={handleDownloadProject}
        />
      );
    case DownloadProjectStep.FlashingInProgress:
      return (
        <DownloadingDialog
          isOpen
          headingId="connectMB.usbDownloading.header"
          progress={stage.flashProgress * 100}
        />
      );
    case DownloadProjectStep.ManualFlashingTutorial:
      if (!stage.project) {
        throw new Error("Project expected");
      }
      return (
        <ManualFlashingDialog
          isOpen
          hex={stage.project}
          onClose={actions.close}
          closeIsPrimaryAction={true}
        />
      );
  }
  return <></>;
};

export default DownloadProjectDialogs;
