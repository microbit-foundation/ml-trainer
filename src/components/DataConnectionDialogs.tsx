/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  DataConnectionStep,
  DataConnectionType,
  isDataConnectionDialogOpen,
} from "../data-connection-flow";
import { useStore } from "../store";
import { useDataConnectionActions } from "../data-connection-flow";
import BrokenFirmwareDialog from "./BrokenFirmwareDialog";
import ConnectBatteryDialog from "./ConnectBatteryDialog";
import ConnectCableDialog, {
  getConnectionCableDialogConfig,
} from "./ConnectCableDialog";
import ConnectErrorDialog, {
  ConnectionErrorDeviceType,
} from "./ConnectErrorDialog";
import DownloadProgressDialog, {
  getHeadingId as getDownloadProgressHeadingId,
} from "./DownloadProgressDialog";
import EnterBluetoothPatternDialog from "./EnterBluetoothPatternDialog";
import LoadingDialog from "./LoadingDialog";
import ManualFlashingDialog from "./ManualFlashingDialog";
import ResetToBluetoothModeDialog from "./ResetToBluetoothModeDialog";
import SelectMicrobitBluetoothDialog from "./SelectMicrobitBluetoothDialog";
import SelectMicrobitUsbDialog, {
  getHeadingId as getSelectMicrobitUsbHeadingId,
} from "./SelectMicrobitUsbDialog";
import TryAgainDialog from "./TryAgainDialog";
import UnsupportedMicrobitDialog from "./UnsupportedMicrobitDialog";
import WebUsbBluetoothUnsupportedDialog from "./WebUsbBluetoothUnsupportedDialog";
import WhatYouWillNeedDialog from "./WhatYouWillNeedDialog";
import { bluetoothUniversalHex } from "../device/get-hex-file";

const DataConnectionDialogs = () => {
  const state = useStore((s) => s.dataConnection);
  const actions = useDataConnectionActions();
  const flashProgress = useStore((s) => s.dataConnectionFlashingProgress);
  const onClose = actions.close;

  const isOpen = isDataConnectionDialogOpen(state.step);

  const dialogCommonProps = { isOpen, onClose };

  switch (state.step) {
    case DataConnectionStep.StartOver:
    case DataConnectionStep.Start: {
      return (
        <WhatYouWillNeedDialog
          type={state.type}
          {...dialogCommonProps}
          onLinkClick={
            actions.canSwitchFlowType() ? actions.switchFlowType : undefined
          }
          onNextClick={actions.onNextClick}
          reconnect={state.step === DataConnectionStep.StartOver}
        />
      );
    }
    case DataConnectionStep.NativeBluetoothPreConnectTutorial: {
      return (
        <ResetToBluetoothModeDialog
          {...dialogCommonProps}
          onBackClick={actions.onBackClick}
          onNextClick={actions.onNextClick}
        />
      );
    }
    case DataConnectionStep.ConnectCable: {
      const config = getConnectionCableDialogConfig(
        state.type,
        actions.canSwitchFlowType(),
        state.radioFlowPhase
      );
      return (
        <ConnectCableDialog
          {...dialogCommonProps}
          onBackClick={actions.onBackClick}
          onNextClick={actions.onNextClick}
          config={config}
          onSkip={actions.onSkip}
          onSwitch={actions.switchFlowType}
        />
      );
    }
    case DataConnectionStep.WebUsbFlashingTutorial: {
      return (
        <SelectMicrobitUsbDialog
          headingId={getSelectMicrobitUsbHeadingId(
            state.type,
            state.radioFlowPhase
          )}
          {...dialogCommonProps}
          onBackClick={actions.onBackClick}
          onNextClick={actions.onNextClick}
        />
      );
    }
    // Only bluetooth mode has this fallback, the radio bridge mode requires working WebUSB.
    case DataConnectionStep.ManualFlashingTutorial: {
      return (
        <ManualFlashingDialog
          {...dialogCommonProps}
          hex={bluetoothUniversalHex}
          onNextClick={actions.onNextClick}
          onBackClick={actions.onBackClick}
        />
      );
    }
    case DataConnectionStep.ConnectBattery: {
      return (
        <ConnectBatteryDialog
          {...dialogCommonProps}
          onBackClick={actions.onBackClick}
          onNextClick={actions.onNextClick}
        />
      );
    }
    case DataConnectionStep.BluetoothPattern: {
      return (
        <EnterBluetoothPatternDialog
          {...dialogCommonProps}
          onBackClick={actions.onBackClick}
          onNextClick={actions.onNextClick}
          microbitName={state.bluetoothMicrobitName}
          onChangeMicrobitName={actions.onChangeMicrobitName}
        />
      );
    }
    case DataConnectionStep.WebBluetoothPreConnectTutorial: {
      return (
        <SelectMicrobitBluetoothDialog
          {...dialogCommonProps}
          onBackClick={actions.onBackClick}
          onNextClick={actions.onNextClick}
        />
      );
    }
    case DataConnectionStep.FlashingInProgress: {
      return (
        <DownloadProgressDialog
          headingId={getDownloadProgressHeadingId(
            state.type,
            state.radioFlowPhase
          )}
          isOpen={isOpen}
          stage={flashProgress.stage}
          progress={flashProgress.value}
        />
      );
    }
    case DataConnectionStep.BluetoothConnect: {
      return (
        <LoadingDialog isOpen={isOpen} headingId="connect-bluetooth-heading" />
      );
    }
    case DataConnectionStep.ConnectingMicrobits: {
      return (
        <LoadingDialog isOpen={isOpen} headingId="connect-radio-heading" />
      );
    }
    case DataConnectionStep.TryAgainBluetoothSelectMicrobit:
    case DataConnectionStep.TryAgainReplugMicrobit:
    case DataConnectionStep.TryAgainWebUsbSelectMicrobit:
    case DataConnectionStep.TryAgainCloseTabs: {
      return (
        <TryAgainDialog
          {...dialogCommonProps}
          onTryAgain={actions.onTryAgain}
          type={state.step}
        />
      );
    }
    case DataConnectionStep.BadFirmware: {
      return (
        <BrokenFirmwareDialog
          {...dialogCommonProps}
          onTryAgain={actions.onTryAgain}
        />
      );
    }
    case DataConnectionStep.MicrobitUnsupported: {
      return (
        <UnsupportedMicrobitDialog
          {...dialogCommonProps}
          onStartBluetoothClick={actions.onStartBluetoothFlow}
          isBluetoothSupported={state.isWebBluetoothSupported}
        />
      );
    }
    case DataConnectionStep.WebUsbBluetoothUnsupported: {
      return <WebUsbBluetoothUnsupportedDialog {...dialogCommonProps} />;
    }
    case DataConnectionStep.ConnectFailed:
    case DataConnectionStep.ConnectionLost: {
      const variant =
        state.step === DataConnectionStep.ConnectionLost
          ? "connectionLost"
          : state.hadSuccessfulConnection
          ? "reconnectFailed"
          : "connectFailed";

      const deviceType: ConnectionErrorDeviceType =
        state.type === DataConnectionType.Radio
          ? state.lastDisconnectSource === "bridge"
            ? "bridge"
            : "remote"
          : "bluetooth";

      return (
        <ConnectErrorDialog
          {...dialogCommonProps}
          onRetry={actions.onNextClick}
          variant={variant}
          deviceType={deviceType}
        />
      );
    }
  }
};

export default DataConnectionDialogs;
