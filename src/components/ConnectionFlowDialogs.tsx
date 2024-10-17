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
import ConnectBatteryDialog from "./ConnectBatteryDialog";
import ConnectCableDialog, {
  getConnectionCableDialogConfig,
} from "./ConnectCableDialog";
import ConnectErrorDialog from "./ConnectErrorDialog";
import DownloadProgressDialog, { getHeadingId } from "./DownloadProgressDialog";
import EnterBluetoothPatternDialog from "./EnterBluetoothPatternDialog";
import LoadingDialog from "./LoadingDialog";
import ManualFlashingDialog from "./ManualFlashingDialog";
import SelectMicrobitBluetoothDialog from "./SelectMicrobitBluetoothDialog";
import SelectMicrobitUsbDialog from "./SelectMicrobitUsbDialog";
import TryAgainDialog from "./TryAgainDialog";
import UnsupportedMicrobitDialog from "./UnsupportedMicrobitDialog";
import WebUsbBluetoothUnsupportedDialog from "./WebUsbBluetoothUnsupportedDialog";
import WhatYouWillNeedDialog from "./WhatYouWillNeedDialog";

const ConnectionDialogs = () => {
  const { stage, actions } = useConnectionStage();
  const logging = useLogging();
  const [flashProgress, setFlashProgress] = useState<number>(0);
  const [microbitName, setMicrobitName] = useState<string | undefined>(
    stage.bluetoothMicrobitName
  );
  const onClose = useCallback(() => {
    actions.setFlowStep(ConnectionFlowStep.None);
  }, [actions]);

  const isOpen = stage.flowStep !== ConnectionFlowStep.None;

  const progressCallback = useCallback(
    (progress: number) => {
      if (stage.flowStep !== ConnectionFlowStep.FlashingInProgress) {
        actions.setFlowStep(ConnectionFlowStep.FlashingInProgress);
      }
      setFlashProgress(progress * 100);
    },
    [actions, stage.flowStep]
  );

  const dialogCommonProps = { isOpen, onClose };

  switch (stage.flowStep) {
    case ConnectionFlowStep.ReconnectFailedTwice:
    case ConnectionFlowStep.Start: {
      return (
        <WhatYouWillNeedDialog
          type={
            stage.flowType === ConnectionFlowType.ConnectBluetooth
              ? "bluetooth"
              : "radio"
          }
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

        logging.event({
          type: "connect-user",
          message: "radio-bridge",
        });
        await actions.connectAndflashMicrobit(progressCallback, onFlashSuccess);
      };
      return (
        <SelectMicrobitUsbDialog
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
    case ConnectionFlowStep.EnterBluetoothPattern: {
      return (
        <EnterBluetoothPatternDialog
          {...dialogCommonProps}
          onBackClick={actions.onBackClick}
          onNextClick={actions.onNextClick}
          microbitName={microbitName}
          onChangeMicrobitName={(name: string) => {
            actions.onChangeMicrobitName(name);
            setMicrobitName(name);
          }}
        />
      );
    }
    case ConnectionFlowStep.ConnectBluetoothTutorial: {
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
      return <></>;
    }
    case ConnectionFlowStep.FlashingInProgress: {
      return (
        <DownloadProgressDialog
          headingId={getHeadingId(stage.flowType)}
          isOpen={isOpen}
          progress={flashProgress}
        />
      );
    }
    case ConnectionFlowStep.ConnectingBluetooth: {
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
          onSkip={() =>
            actions.setFlowStep(ConnectionFlowStep.ManualFlashingTutorial)
          }
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
