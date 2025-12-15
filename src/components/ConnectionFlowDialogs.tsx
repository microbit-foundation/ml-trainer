/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ProgressStage } from "@microbit/microbit-connection";
import { useCallback, useState } from "react";
import { bluetoothUniversalHex } from "../connection-stage-actions";
import {
  ConnectionFlowStep,
  ConnectionFlowType,
  ConnectionStage,
  useConnectionStage,
} from "../connection-stage-hooks";
import { useLogging } from "../logging/logging-hooks";
import BrokenFirmwareDialog from "./BrokenFirmwareDialog";
import ChooseDeviceOverlay from "./ChooseDeviceOverlay";
import ConnectBatteryDialog from "./ConnectBatteryDialog";
import ConnectCableDialog, {
  getConnectionCableDialogConfig,
} from "./ConnectCableDialog";
import ConnectErrorDialog from "./ConnectErrorDialog";
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

const ConnectionDialogs = () => {
  const { stage, actions } = useConnectionStage();
  const logging = useLogging();
  const [flashProgress, setFlashProgress] = useState<{
    stage: ProgressStage | undefined;
    value: number | undefined;
  }>({ stage: undefined, value: undefined });
  const [microbitName, setMicrobitName] = useState<string | undefined>(
    stage.bluetoothMicrobitName
  );
  const onClose = useCallback(() => {
    actions.setFlowStep(ConnectionFlowStep.None);
  }, [actions]);

  const isOpen = stage.flowStep !== ConnectionFlowStep.None;

  const progressCallback = useCallback(
    (progressStage: ProgressStage, value: number | undefined) => {
      if (stage.flowStep !== ConnectionFlowStep.FlashingInProgress) {
        actions.setFlowStep(ConnectionFlowStep.FlashingInProgress);
      }
      setFlashProgress({ stage: progressStage, value });
    },
    [actions, stage.flowStep]
  );

  const dialogCommonProps = { isOpen, onClose };

  switch (stage.flowStep) {
    case ConnectionFlowStep.ReconnectFailedTwice:
    case ConnectionFlowStep.Start: {
      return (
        <WhatYouWillNeedDialog
          type={stage.flowType}
          {...dialogCommonProps}
          onLinkClick={
            stage.isWebBluetoothSupported && stage.isWebUsbSupported
              ? actions.switchFlowType
              : undefined
          }
          onNextClick={actions.onNextClick}
          reconnect={stage.flowStep === ConnectionFlowStep.ReconnectFailedTwice}
        />
      );
    }
    case ConnectionFlowStep.NativeBluetoothPreConnectTutorial: {
      return (
        <ResetToBluetoothModeDialog
          {...dialogCommonProps}
          onBackClick={actions.onBackClick}
          onNextClick={actions.onNextClick}
        />
      );
    }
    case ConnectionFlowStep.ConnectCable: {
      const config = getConnectionCableDialogConfig(
        stage.flowType,
        stage.isWebBluetoothSupported
      );
      return (
        <ConnectCableDialog
          {...dialogCommonProps}
          onBackClick={actions.onBackClick}
          onNextClick={actions.onNextClick}
          config={config}
          onSkip={() => actions.setFlowStep(ConnectionFlowStep.ConnectBattery)}
          onSwitch={actions.switchFlowType}
        />
      );
    }
    case ConnectionFlowStep.WebUsbFlashingTutorial: {
      const connectAndFlash = async () => {
        const onFlashSuccess = (newStage: ConnectionStage) => {
          // Inferring microbit name saves the user from entering the pattern
          // for bluetooth connection flow
          if (newStage.bluetoothMicrobitName) {
            setMicrobitName(newStage.bluetoothMicrobitName);
          }
        };

        if (stage.flowType === ConnectionFlowType.ConnectRadioBridge) {
          logging.event({
            type: "connect-user",
            message: "radio-bridge",
          });
        }
        await actions.connectAndFlash(progressCallback, onFlashSuccess);
      };
      return (
        <SelectMicrobitUsbDialog
          headingId={getSelectMicrobitUsbHeadingId(stage.flowType)}
          {...dialogCommonProps}
          onBackClick={actions.onBackClick}
          onNextClick={connectAndFlash}
        />
      );
    }
    // Only bluetooth mode has this fallback, the radio bridge mode requires working WebUSB.
    case ConnectionFlowStep.ManualFlashingTutorial: {
      return (
        <ManualFlashingDialog
          {...dialogCommonProps}
          hex={bluetoothUniversalHex}
          onNextClick={actions.onNextClick}
          onBackClick={actions.onBackClick}
        />
      );
    }
    case ConnectionFlowStep.ConnectBattery: {
      return (
        <ConnectBatteryDialog
          {...dialogCommonProps}
          onBackClick={actions.onBackClick}
          onNextClick={actions.onNextClick}
        />
      );
    }
    case ConnectionFlowStep.BluetoothPattern: {
      const handleConnectNativeBluetooth = async () => {
        await actions.connectAndFlash(progressCallback, () => {});
      };
      const onNextClick =
        stage.flowType === ConnectionFlowType.ConnectNativeBluetooth
          ? handleConnectNativeBluetooth
          : actions.onNextClick;
      return (
        <EnterBluetoothPatternDialog
          {...dialogCommonProps}
          onBackClick={actions.onBackClick}
          onNextClick={onNextClick}
          microbitName={microbitName}
          onChangeMicrobitName={(name: string) => {
            actions.onChangeMicrobitName(name);
            setMicrobitName(name);
          }}
        />
      );
    }
    case ConnectionFlowStep.WebBluetoothPreConnectTutorial: {
      const handleConnectBluetooth = () => {
        logging.event({
          type: "connect-user",
          message: "bluetooth",
        });
        void actions.connectBluetooth();
      };
      return (
        <SelectMicrobitBluetoothDialog
          {...dialogCommonProps}
          onBackClick={actions.onBackClick}
          onNextClick={handleConnectBluetooth}
        />
      );
    }
    case ConnectionFlowStep.WebUsbChooseMicrobit: {
      // Browser dialog is shown, no custom dialog shown at the same time
      return <ChooseDeviceOverlay />;
    }
    case ConnectionFlowStep.FlashingInProgress: {
      return (
        <DownloadProgressDialog
          headingId={getDownloadProgressHeadingId(stage.flowType)}
          isOpen={isOpen}
          stage={flashProgress.stage}
          progress={flashProgress.value}
        />
      );
    }
    case ConnectionFlowStep.BluetoothConnect: {
      return (
        <LoadingDialog isOpen={isOpen} headingId="connect-bluetooth-heading" />
      );
    }
    case ConnectionFlowStep.ConnectingMicrobits: {
      return (
        <LoadingDialog isOpen={isOpen} headingId="connect-radio-heading" />
      );
    }
    case ConnectionFlowStep.TryAgainBluetoothSelectMicrobit:
    case ConnectionFlowStep.TryAgainReplugMicrobit:
    case ConnectionFlowStep.TryAgainWebUsbSelectMicrobit:
    case ConnectionFlowStep.TryAgainCloseTabs: {
      return (
        <TryAgainDialog
          {...dialogCommonProps}
          onTryAgain={actions.onTryAgain}
          type={stage.flowStep}
        />
      );
    }
    case ConnectionFlowStep.BadFirmware: {
      return (
        <BrokenFirmwareDialog
          {...dialogCommonProps}
          onTryAgain={actions.onTryAgain}
        />
      );
    }
    case ConnectionFlowStep.MicrobitUnsupported: {
      return (
        <UnsupportedMicrobitDialog
          {...dialogCommonProps}
          onStartBluetoothClick={actions.onStartBluetoothFlow}
          isBluetoothSupported={stage.isWebBluetoothSupported}
        />
      );
    }
    case ConnectionFlowStep.WebUsbBluetoothUnsupported: {
      return <WebUsbBluetoothUnsupportedDialog {...dialogCommonProps} />;
    }
    case ConnectionFlowStep.ConnectFailed:
    case ConnectionFlowStep.ReconnectFailed:
    case ConnectionFlowStep.ConnectionLost: {
      return (
        <ConnectErrorDialog
          {...dialogCommonProps}
          onConnect={actions.reconnect}
          flowType={stage.flowType}
          errorStep={stage.flowStep}
        />
      );
    }
  }
};

export default ConnectionDialogs;
