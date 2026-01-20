/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useDownloadActions } from "../download-flow/download-hooks";
import { DownloadStep } from "../download-flow/download-types";
import { isAndroid } from "../platform";
import { useSettings, useStore } from "../store";
import PermissionErrorDialog from "./BluetoothPermissionErrorDialog";
import ConnectCableDialog from "./ConnectCableDialog";
import ConnectRadioDataCollectionMicrobitDialog from "./ConnectRadioDataCollectionMicrobitDialog";
import DownloadChooseMicrobitDialog from "./DownloadChooseMicrobitDialog";
import DownloadHelpDialog from "./DownloadHelpDialog";
import DownloadProgressDialog from "./DownloadProgressDialog";
import EnterBluetoothPatternDialog from "./EnterBluetoothPatternDialog";
import IncompatibleEditorDevice from "./IncompatibleEditorDevice";
import ManualFlashingDialog from "./ManualFlashingDialog";
import ResetToBluetoothModeDialog from "./ResetToBluetoothModeDialog";
import SelectMicrobitUsbDialog from "./SelectMicrobitUsbDialog";
import UnplugRadioLinkMicrobitDialog from "./UnplugRadioLinkMicrobitDialog";

const DownloadDialogs = () => {
  const downloadActions = useDownloadActions();
  const stage = useStore((s) => s.download);
  const flashingProgress = useStore((s) => s.downloadFlashingProgress);
  const [settings] = useSettings();

  switch (stage.step) {
    case DownloadStep.Help:
      return (
        <DownloadHelpDialog
          isOpen
          onClose={downloadActions.close}
          onNext={downloadActions.onHelpNext}
        />
      );
    case DownloadStep.ChooseSameOrDifferentMicrobit:
      return (
        <DownloadChooseMicrobitDialog
          isOpen
          onBackClick={downloadActions.getOnBack()}
          onClose={downloadActions.close}
          onDifferentMicrobitClick={downloadActions.onChosenDifferentMicrobit}
          onSameMicrobitClick={downloadActions.onChosenSameMicrobit}
          stage={stage}
        />
      );
    case DownloadStep.NativeBluetoothPreConnectTutorial: {
      return (
        <ResetToBluetoothModeDialog
          isOpen
          onClose={downloadActions.close}
          onBackClick={downloadActions.getOnBack()}
          onNextClick={downloadActions.getOnNext()}
          pairingMethod={stage.pairingMethod}
          onSwitchPairingMethod={downloadActions.switchPairingMethod}
        />
      );
    }
    case DownloadStep.ConnectCable:
      return (
        <ConnectCableDialog
          isOpen
          onClose={downloadActions.close}
          onBackClick={downloadActions.getOnBack()}
          onNextClick={downloadActions.getOnNext()}
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
          onClose={downloadActions.close}
          onBackClick={downloadActions.getOnBack()}
          onNextClick={downloadActions.getOnNext()}
        />
      );
    case DownloadStep.UnplugRadioBridgeMicrobit:
      return (
        <UnplugRadioLinkMicrobitDialog
          isOpen
          onClose={downloadActions.close}
          onBackClick={downloadActions.getOnBack()}
          onNextClick={downloadActions.getOnNext()}
        />
      );
    case DownloadStep.WebUsbFlashingTutorial:
      return (
        <SelectMicrobitUsbDialog
          isOpen
          headingId="connect-popup"
          onClose={downloadActions.close}
          onBackClick={downloadActions.getOnBack()}
          onNextClick={downloadActions.getOnNext()}
        />
      );
    case DownloadStep.BluetoothPattern:
      return (
        <EnterBluetoothPatternDialog
          isOpen
          onClose={downloadActions.close}
          onBackClick={downloadActions.getOnBack()}
          onNextClick={downloadActions.getOnNext()}
          microbitName={settings.bluetoothMicrobitName}
          onChangeMicrobitName={(name: string) => {
            downloadActions.onChangeMicrobitName(name);
          }}
        />
      );
    case DownloadStep.FlashingInProgress:
      return (
        <DownloadProgressDialog
          isOpen
          headingId="downloading-header"
          stage={flashingProgress.stage}
          progress={flashingProgress.value}
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
          onClose={downloadActions.close}
          closeIsPrimaryAction={true}
        />
      );
    case DownloadStep.IncompatibleDevice:
      return (
        <IncompatibleEditorDevice
          isOpen
          onClose={downloadActions.close}
          onBack={downloadActions.getOnBack()}
          stage="flashDevice"
        />
      );
    case DownloadStep.BluetoothDisabled:
      return (
        <PermissionErrorDialog
          headingId="bluetooth-disabled-heading"
          bodyId="bluetooth-disabled-body"
          isOpen
          onClose={downloadActions.close}
          onTryAgain={downloadActions.onTryAgain}
          isCheckingPermissions={stage.isCheckingPermissions}
        />
      );
    case DownloadStep.BluetoothPermissionDenied:
      return (
        <PermissionErrorDialog
          headingId="bluetooth-permission-denied-heading"
          bodyId={
            isAndroid()
              ? "bluetooth-permission-denied-body-android"
              : "bluetooth-permission-denied-body-ios"
          }
          isOpen
          onClose={downloadActions.close}
          onTryAgain={downloadActions.onTryAgain}
          onOpenSettings={downloadActions.openAppSettings}
          isCheckingPermissions={stage.isCheckingPermissions}
        />
      );
    case DownloadStep.LocationDisabled:
      return (
        <PermissionErrorDialog
          headingId="location-disabled-heading"
          bodyId="location-disabled-body"
          isOpen
          onClose={downloadActions.close}
          onTryAgain={downloadActions.onTryAgain}
          onOpenSettings={downloadActions.openLocationSettings}
          isCheckingPermissions={stage.isCheckingPermissions}
        />
      );
  }
  return <></>;
};

export default DownloadDialogs;
