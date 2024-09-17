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

  return (
    <>
      <DownloadProjectHelpDialog
        isOpen={stage.step === DownloadProjectStep.Help}
        onClose={actions.close}
        onNext={actions.onHelpNext}
      />
      <DownloadProjectChooseMicrobitDialog
        isOpen={stage.step === DownloadProjectStep.ChooseSameOrAnotherMicrobit}
        onBackClick={actions.getOnBack()}
        onClose={actions.close}
        onDifferentMicrobitClick={actions.onChosenDifferentMicrobit}
        onSameMicrobitClick={actions.onChosenSameMicrobit}
        stage={stage}
      />
      <ConnectCableDialog
        isOpen={stage.step === DownloadProjectStep.ConnectCable}
        onClose={actions.close}
        onBackClick={actions.getOnBack()}
        onNextClick={actions.getOnNext()}
        config={{
          headingId: "connectMB.connectCable.heading",
          subtitleId: "connectMB.connectCable.downloadProject.subtitle",
        }}
      />
      <SelectMicrobitUsbDialog
        isOpen={stage.step === DownloadProjectStep.WebUsbFlashingTutorial}
        onClose={actions.close}
        onBackClick={actions.getOnBack()}
        onNextClick={handleDownloadProject}
      />
      <DownloadingDialog
        isOpen={stage.step === DownloadProjectStep.FlashingInProgress}
        headingId="connectMB.usbDownloading.header"
        progress={stage.flashProgress * 100}
      />
      {stage.project && (
        <ManualFlashingDialog
          isOpen={stage.step === DownloadProjectStep.ManualFlashingTutorial}
          hexFile={{
            type: "data",
            source: stage.project.hex,
            name: stage.project.name + ".hex",
          }}
          onClose={actions.close}
          closeIsPrimaryAction={true}
        />
      )}
    </>
  );
};

export default DownloadProjectDialogs;
