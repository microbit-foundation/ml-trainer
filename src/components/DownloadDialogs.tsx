import { useCallback } from "react";
import { useDownloadActions } from "../hooks/download-hooks";
import microbitImage from "../images/stylised-microbit-black.svg";
import twoMicrobitsImage from "../images/stylised-two-microbits-black.svg";
import { DownloadStep } from "../model";
import { useStore } from "../store";
import ConnectCableDialog from "./ConnectCableDialog";
import DownloadChooseMicrobitDialog from "./DownloadChooseMicrobitDialog";
import DownloadHelpDialog from "./DownloadHelpDialog";
import DownloadProgressDialog from "./DownloadProgressDialog";
import ManualFlashingDialog from "./ManualFlashingDialog";
import SelectMicrobitUsbDialog from "./SelectMicrobitUsbDialog";
import UnplugMicrobitDialog from "./UnplugMicrobitDialog";

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
    case DownloadStep.ChooseSameOrAnotherMicrobitRadio:
      return (
        <DownloadChooseMicrobitDialog
          isOpen
          onBackClick={actions.getOnBack()}
          onClose={actions.close}
          onDifferentMicrobitClick={actions.onChosenDifferentMicrobit}
          onSameMicrobitClick={actions.onChosenSameMicrobit}
          stage={stage}
          subtitleId="download-project-choose-microbit-radio-subtitle"
          sameMicrobitCard={{
            textId: "download-project-same-microbit-option",
            imgSrc: twoMicrobitsImage,
          }}
          differentMicrobitCard={{
            textId: "download-project-different-microbit-option",
            imgSrc: microbitImage,
          }}
        />
      );
    case DownloadStep.ChooseSameOrAnotherMicrobitBluetooth:
      return (
        <DownloadChooseMicrobitDialog
          isOpen
          onBackClick={actions.getOnBack()}
          onClose={actions.close}
          onDifferentMicrobitClick={actions.onChosenDifferentMicrobit}
          onSameMicrobitClick={actions.onChosenSameMicrobit}
          stage={stage}
          subtitleId="download-project-choose-microbit-bluetooth-subtitle"
          sameMicrobitCard={{
            textId: "download-project-same-microbit-option",
            imgSrc: microbitImage,
          }}
          differentMicrobitCard={{
            textId: "download-project-different-microbit-option",
            imgSrc: twoMicrobitsImage,
          }}
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
    case DownloadStep.ConnectBridgeMicrobit:
      return (
        <ConnectCableDialog
          isOpen
          onClose={actions.close}
          onBackClick={actions.getOnBack()}
          onNextClick={actions.getOnNext()}
          config={{
            headingId: "connect-remote-microbit-title",
            subtitleId: "connect-remote-microbit-description",
          }}
        />
      );
    case DownloadStep.UnplugBridgeMicrobit:
      return (
        <UnplugMicrobitDialog
          isOpen
          onClose={actions.close}
          onBackClick={actions.getOnBack()}
          onNextClick={actions.getOnNext()}
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
