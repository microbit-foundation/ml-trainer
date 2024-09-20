import { useCallback } from "react";
import ConnectCableDialog from "./ConnectCableDialog";
import DownloadProgressDialog from "./DownloadProgressDialog";
import DownloadChooseMicrobitDialog from "./DownloadChooseMicrobitDialog";
import DownloadHelpDialog from "./DownloadHelpDialog";
import ManualFlashingDialog from "./ManualFlashingDialog";
import SelectMicrobitUsbDialog from "./SelectMicrobitUsbDialog";
import { DownloadStep as DownloadStep } from "../model";
import { useDownloadActions } from "../hooks/download-hooks";
import { useStore } from "../store";

const DownloadDialogs = () => {
  const actions = useDownloadActions();
  const stage = useStore((s) => s.download);
  const handleDownloadProject = useCallback(async () => {
    await actions.connectAndFlashMicrobit(stage);
  }, [actions, stage]);

  switch (stage.step) {
    case DownloadStep.Help:
      return (
        <DownloadHelpDialog
          isOpen
          onClose={actions.close}
          onNext={actions.onHelpNext}
        />
      );
    case DownloadStep.ChooseSameOrAnotherMicrobit:
      return (
        <DownloadChooseMicrobitDialog
          isOpen
          onBackClick={actions.getOnBack()}
          onClose={actions.close}
          onDifferentMicrobitClick={actions.onChosenDifferentMicrobit}
          onSameMicrobitClick={actions.onChosenSameMicrobit}
          stage={stage}
        />
      );
    case DownloadStep.ConnectCable:
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
    case DownloadStep.WebUsbFlashingTutorial:
      return (
        <SelectMicrobitUsbDialog
          isOpen
          onClose={actions.close}
          onBackClick={actions.getOnBack()}
          onNextClick={handleDownloadProject}
        />
      );
    case DownloadStep.FlashingInProgress:
      return (
        <DownloadProgressDialog
          isOpen
          headingId="connectMB.usbDownloading.header"
          progress={stage.flashProgress * 100}
        />
      );
    case DownloadStep.ManualFlashingTutorial:
      if (!stage.hex) {
        throw new Error("Project expected");
      }
      return (
        <ManualFlashingDialog
          isOpen
          hex={stage.hex}
          onClose={actions.close}
          closeIsPrimaryAction={true}
        />
      );
  }
  return <></>;
};

export default DownloadDialogs;
