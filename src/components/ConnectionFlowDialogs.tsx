import { useDisclosure } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { microbitNameToBluetoothPattern } from "../bt-pattern-utils";
import {
  ConnEvent,
  ConnectionFlowStep,
  ConnectionFlowType,
  useConnectionStage,
} from "../connection-stage-hooks";
import BrokenFirmwareDialog from "./BrokenFirmwareDialog";
import ConnectBatteryDialog from "./ConnectBatteryDialog";
import ConnectCableDialog from "./ConnectCableDialog";
import DownloadingDialog from "./DownloadingDialog";
import EnterBluetoothPatternDialog, {
  BluetoothPattern,
} from "./EnterBluetoothPatternDialog";
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
  const dispatch = actions.dispatchEvent;
  const [flashProgress, setFlashProgress] = useState<number>(0);
  const { isOpen, onClose: onCloseDialog, onOpen } = useDisclosure();
  const [bluetoothPattern, setBluetoothPattern] = useState<BluetoothPattern>(
    Array(25).fill(false)
  );

  useEffect(() => {
    if (
      stage.step === ConnectionFlowStep.Start ||
      stage.step === ConnectionFlowStep.WebUsbBluetoothUnsupported
    ) {
      onOpen();
    }
  }, [onOpen, stage]);

  const progressCallback = useCallback(
    (progress: number) => {
      if (stage.step !== ConnectionFlowStep.FlashingInProgress) {
        dispatch(ConnEvent.FlashingInProgress);
      }
      setFlashProgress(progress * 100);
    },
    [dispatch, stage.step]
  );

  async function connectAndFlash(): Promise<void> {
    await actions.connectAndflashMicrobit(progressCallback);

    const deviceId = actions.getDeviceId();
    if (!!deviceId && stage.type === ConnectionFlowType.Bluetooth) {
      // Infer pattern from device id saves the user from entering the pattern
      setBluetoothPattern(microbitNameToBluetoothPattern(""));
    }
  }

  // TODO: Flag reconnect failed
  const reconnectFailed = false;
  const onSwitchTypeClick = useCallback(
    () => dispatch(ConnEvent.Switch),
    [dispatch]
  );
  const onBackClick = useCallback(() => dispatch(ConnEvent.Back), [dispatch]);
  const onNextClick = useCallback(() => dispatch(ConnEvent.Next), [dispatch]);
  const onSkip = useCallback(
    () => dispatch(ConnEvent.SkipFlashing),
    [dispatch]
  );
  const onTryAgain = useCallback(
    () => dispatch(ConnEvent.TryAgain),
    [dispatch]
  );
  const onStartBluetooth = useCallback(
    () => dispatch(ConnEvent.GoToBluetoothStart),
    [dispatch]
  );
  const onInstructManualFlashing = useCallback(
    () => dispatch(ConnEvent.InstructManualFlashing),
    [dispatch]
  );
  const onClose = useCallback(() => {
    dispatch(ConnEvent.Close);
    onCloseDialog();
  }, [dispatch, onCloseDialog]);
  const dialogCommonProps = { isOpen, onClose };

  switch (stage.step) {
    case ConnectionFlowStep.Start: {
      return (
        <WhatYouWillNeedDialog
          type={stage.type}
          {...dialogCommonProps}
          onLinkClick={
            stage.isWebBluetoothSupported && stage.isWebUsbSupported
              ? onSwitchTypeClick
              : undefined
          }
          onNextClick={onNextClick}
          reconnect={reconnectFailed}
        />
      );
    }
    case ConnectionFlowStep.ConnectCable: {
      const commonProps = { onBackClick, onNextClick, ...dialogCommonProps };
      return (
        <ConnectCableDialog
          {...commonProps}
          type={stage.type}
          onSkip={onSkip}
          onSwitch={onSwitchTypeClick}
        />
      );
    }
    case ConnectionFlowStep.WebUsbFlashingTutorial: {
      return (
        <SelectMicrobitUsbDialog
          {...dialogCommonProps}
          onBackClick={onBackClick}
          onNextClick={connectAndFlash}
        />
      );
    }
    case ConnectionFlowStep.ManualFlashingTutorial: {
      return (
        <ManualFlashingDialog
          {...dialogCommonProps}
          onNextClick={onNextClick}
          onBackClick={onBackClick}
        />
      );
    }
    case ConnectionFlowStep.ConnectBattery: {
      return (
        <ConnectBatteryDialog
          {...dialogCommonProps}
          onBackClick={onBackClick}
          onNextClick={onNextClick}
        />
      );
    }
    case ConnectionFlowStep.EnterBluetoothPattern: {
      return (
        <EnterBluetoothPatternDialog
          {...dialogCommonProps}
          onBackClick={onBackClick}
          onNextClick={onNextClick}
          bluetoothPattern={bluetoothPattern}
          setBluetoothPattern={setBluetoothPattern}
        />
      );
    }
    case ConnectionFlowStep.ConnectBluetoothTutorial: {
      return (
        <SelectMicrobitBluetoothDialog
          {...dialogCommonProps}
          onBackClick={onBackClick}
          onNextClick={() => actions.connectBluetooth(onClose)}
        />
      );
    }
    case ConnectionFlowStep.WebUsbChooseMicrobit: {
      // Browser dialog is shown, no custom dialog shown at the same time
      return <></>;
    }
    case ConnectionFlowStep.FlashingInProgress: {
      const headingIdVariations = {
        [ConnectionFlowType.Bluetooth]: "connectMB.usbDownloading.header",
        [ConnectionFlowType.RadioRemote]: "connectMB.usbDownloadingMB1.header",
        [ConnectionFlowType.RadioBridge]: "connectMB.usbDownloadingMB2.header",
      };
      return (
        <DownloadingDialog
          headingId={headingIdVariations[stage.type]}
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
    case ConnectionFlowStep.TryAgainBluetoothConnect:
    case ConnectionFlowStep.TryAgainReplugMicrobit:
    case ConnectionFlowStep.TryAgainSelectMicrobit:
    case ConnectionFlowStep.TryAgainCloseTabs: {
      return (
        <TryAgainDialog
          onClose={onClose}
          isOpen={isOpen}
          onTryAgain={onTryAgain}
          type={stage.step}
        />
      );
    }
    case ConnectionFlowStep.BadFirmware: {
      return (
        <BrokenFirmwareDialog
          onClose={onClose}
          isOpen={isOpen}
          onSkip={onInstructManualFlashing}
          onTryAgain={onTryAgain}
        />
      );
    }
    case ConnectionFlowStep.MicrobitUnsupported: {
      return (
        <UnsupportedMicrobitDialog
          onClose={onClose}
          isOpen={isOpen}
          onStartBluetoothClick={onStartBluetooth}
          isBluetoothSupported={stage.isWebBluetoothSupported}
        />
      );
    }
    case ConnectionFlowStep.WebUsbBluetoothUnsupported: {
      console.log("here");
      return (
        <WebUsbBluetoothUnsupportedDialog isOpen={isOpen} onClose={onClose} />
      );
    }
  }
};

export default ConnectionDialogs;
