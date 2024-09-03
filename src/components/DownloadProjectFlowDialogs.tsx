import {
  DownloadProjectStep,
  useDownloadProject,
} from "../download-project-hooks";
import ConnectCableDialog from "./ConnectCableDialog";
import SelectMicrobitUsbDialog from "./SelectMicrobitUsbDialog";
import DownloadingDialog from "./DownloadingDialog";
import ManualFlashingDialog from "./ManualFlashingDialog";
import DownloadProjectChooseMicrobitDialog from "./DownloadProjectChooseMicrobitDialog";
import DownloadProjectIntroDialog from "./DownloadProjectIntroDialog";

const DownloadProjectFlowDialogs = () => {
  const { stage, actions, flashProgress } = useDownloadProject();

  switch (stage.step) {
    case DownloadProjectStep.Introduction: {
      return (
        <DownloadProjectIntroDialog
          onClose={actions.close}
          onNext={actions.next}
        />
      );
    }
    case DownloadProjectStep.ChooseSameOrAnotherMicrobit: {
      return (
        <DownloadProjectChooseMicrobitDialog
          isOpen={true}
          onClose={actions.close}
          onDifferentMicrobitClick={actions.onChosenDifferentMicrobit}
          onSameMicrobitClick={actions.onChosenSameMicrobit}
        />
      );
    }
    case DownloadProjectStep.ConnectCable: {
      return (
        <ConnectCableDialog
          isOpen={true}
          onClose={actions.close}
          onNextClick={actions.next}
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
          onBackClick={actions.back}
          onNextClick={actions.connectAndFlashMicrobit}
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
      return (
        <ManualFlashingDialog
          isOpen={true}
          onClose={actions.close}
          onBackClick={actions.back}
        />
      );
    }
    case DownloadProjectStep.None:
    case DownloadProjectStep.WebUsbChooseMicrobit:
      return <></>;
  }
};

export default DownloadProjectFlowDialogs;
