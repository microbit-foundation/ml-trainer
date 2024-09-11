import { useDisclosure } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import {
  ConnectionFlowStep,
  ConnectionFlowType,
  ConnectionStage,
  useConnectionStage,
} from "../connection-stage-hooks";
import { getHexFileUrl, HexType } from "../device/get-hex-file";
import BrokenFirmwareDialog from "./BrokenFirmwareDialog";
import ConnectBatteryDialog from "./ConnectBatteryDialog";
import ConnectCableDialog, {
  getConnectionCableDialogConfig,
} from "./ConnectCableDialog";
import ConnectErrorDialog from "./ConnectErrorDialog";
import DownloadingDialog, { getHeadingId } from "./DownloadingDialog";
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
  const [flashProgress, setFlashProgress] = useState<number>(0);
  const { isOpen, onClose: onCloseDialog, onOpen } = useDisclosure();
  const [microbitName, setMicrobitName] = useState<string | undefined>(
    stage.bluetoothMicrobitName
  );
  const onClose = useCallback(() => {
    actions.setFlowStep(ConnectionFlowStep.None);
    onCloseDialog();
  }, [actions, onCloseDialog]);

  useEffect(() => {
    if (stage.flowStep !== ConnectionFlowStep.None && !isOpen) {
      onOpen();
    }
    if (stage.flowStep === ConnectionFlowStep.None && isOpen) {
      onClose();
    }
  }, [isOpen, onClose, onOpen, stage]);

  const progressCallback = useCallback(
    (progress: number) => {
      if (stage.flowStep !== ConnectionFlowStep.FlashingInProgress) {
        actions.setFlowStep(ConnectionFlowStep.FlashingInProgress);
      }
      setFlashProgress(progress * 100);
    },
    [actions, stage.flowStep]
  );

  const onChangeMicrobitName = useCallback(
    (name: string) => {
      actions.onChangeMicrobitName(name);
      setMicrobitName(name);
    },
    [actions]
  );

  const onFlashSuccess = useCallback((newStage: ConnectionStage) => {
    // Inferring microbit name saves the user from entering the pattern
    // for bluetooth connection flow
    if (newStage.bluetoothMicrobitName) {
      setMicrobitName(newStage.bluetoothMicrobitName);
    }
  }, []);

  async function connectAndFlash(): Promise<void> {
    await actions.connectAndflashMicrobit(progressCallback, onFlashSuccess);
  }
  const onSkip = useCallback(
    () => actions.setFlowStep(ConnectionFlowStep.ConnectBattery),
    [actions]
  );
  const onInstructManualFlashing = useCallback(
    () => actions.setFlowStep(ConnectionFlowStep.ManualFlashingTutorial),
    [actions]
  );

  const dialogCommonProps = { isOpen, onClose };

  // TODO: Use EditCodeDialog state to prevent standard connection flow
  // dialogs from being displayed over MakeCode, whether or not a MakeCode
  // download is in progress.
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
          onSkip={onSkip}
          onSwitch={actions.switchFlowType}
        />
      );
    }
    case ConnectionFlowStep.WebUsbFlashingTutorial: {
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
          hexFile={{
            type: "url",
            source: getHexFileUrl("universal", HexType.Bluetooth)!,
            name: "machine-learning-tool-program.hex",
          }}
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
          onChangeMicrobitName={onChangeMicrobitName}
        />
      );
    }
    case ConnectionFlowStep.ConnectBluetoothTutorial: {
      return (
        <SelectMicrobitBluetoothDialog
          {...dialogCommonProps}
          onBackClick={actions.onBackClick}
          onNextClick={actions.connectBluetooth}
        />
      );
    }
    case ConnectionFlowStep.WebUsbChooseMicrobit: {
      // Browser dialog is shown, no custom dialog shown at the same time
      return <></>;
    }
    case ConnectionFlowStep.FlashingInProgress: {
      return (
        <DownloadingDialog
          headingId={getHeadingId(stage.flowType)}
          isOpen={isOpen}
          progress={flashProgress}
        />
      );
    }
    case ConnectionFlowStep.ConnectingBluetooth: {
      return (
        <LoadingDialog
          isOpen={isOpen}
          headingId="connectMB.bluetooth.heading"
        />
      );
    }
    case ConnectionFlowStep.ConnectingMicrobits: {
      return (
        <LoadingDialog isOpen={isOpen} headingId="connectMB.radio.heading" />
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
          onSkip={onInstructManualFlashing}
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
