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
import UnplugRadioLinkMicrobitDialog from "./UnplugRadioLinkMicrobitDialog";
import ConnectRadioDataCollectionMicrobitDialog from "./ConnectRadioDataCollectionMicrobitDialog";
import IncompatibleEditorDevice from "./IncompatibleEditorDevice";
import { useLogging } from "../logging/logging-hooks";
import { getTotalNumSamples } from "../utils/gestures";

const DownloadDialogs = () => {
  const actions = useDownloadActions();
  const stage = useStore((s) => s.download);
  const gestures = useStore((s) => s.gestures);
  const logging = useLogging();
  const handleDownloadProject = useCallback(async () => {
    logging.event({
      type: "hex-download",
      detail: {
        actions: gestures.length,
        samples: getTotalNumSamples(gestures),
      },
    });
    await actions.connectAndFlashMicrobit(stage);
  }, [actions, gestures, logging, stage]);

  switch (stage.step) {
    case DownloadStep.Help:
      return (
        <DownloadHelpDialog
          isOpen
          onClose={actions.close}
          onNext={actions.onHelpNext}
        />
      );
    case DownloadStep.ChooseSameOrDifferentMicrobit:
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
            headingId: "connect-cable-heading",
            subtitleId: "connect-cable-download-project-subtitle",
          }}
        />
      );
    case DownloadStep.ConnectRadioRemoteMicrobit:
      return (
        <ConnectRadioDataCollectionMicrobitDialog
          isOpen
          onClose={actions.close}
          onBackClick={actions.getOnBack()}
          onNextClick={actions.getOnNext()}
        />
      );
    case DownloadStep.UnplugRadioBridgeMicrobit:
      return (
        <UnplugRadioLinkMicrobitDialog
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
          headingId="downloading-header"
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
    case DownloadStep.IncompatibleDevice:
      return (
        <IncompatibleEditorDevice
          isOpen
          onClose={actions.close}
          onBack={actions.getOnBack()}
          stage="flashDevice"
        />
      );
  }
  return <></>;
};

export default DownloadDialogs;
