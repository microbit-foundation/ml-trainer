import { useDisclosure } from "@chakra-ui/react";
import { useCallback, useReducer, useState } from "react";
import {
  ConnEvent,
  ConnStage,
  ConnectionType,
  connectionDialogReducer,
} from "../connection-flow";
import { getHexFileUrl } from "../device/get-hex-file";
import MicrobitWebUSBConnection from "../device/microbit-usb";
import { useLogging } from "../logging/logging-hooks";
import BrokenFirmwareDialog from "./BrokenFirmwareDialog";
import ConnectBatteryDialog from "./ConnectBatteryDialog";
import ConnectCableDialog from "./ConnectCableDialog";
import DownloadingDialog from "./DownloadingDialog";
import EnterBluetoothPatternDialog from "./EnterBluetoothPatternDialog";
import LoadingDialog from "./LoadingDialog";
import ManualFlashingDialog from "./ManualFlashingDialog";
import SelectMicrobitBluetoothDialog from "./SelectMicrobitBluetoothDialog";
import SelectMicrobitUsbDialog from "./SelectMicrobitUsbDialog";
import TryAgainDialog from "./TryAgainDialog";
import WhatYouWillNeedDialog from "./WhatYouWillNeedDialog";

const ConnectionDialogs = () => {
  // Check compatability
  const logging = useLogging();

  const [isBluetoothSupported, isUsbSupported] = [true, true];
  const [flashProgress, setFlashProgress] = useState<number>(0);
  const [state, dispatch] = useReducer(connectionDialogReducer, {
    stage: ConnStage.Start,
    // TODO: Check compatability first
    type: isBluetoothSupported
      ? ConnectionType.Bluetooth
      : ConnectionType.RadioBridge,
    isUsbSupported,
  });
  const { isOpen, onClose } = useDisclosure({ defaultIsOpen: true });
  const dialogCommonProps = { isOpen, onClose };

  const handleWebUsbError = (err: unknown) => {
    if (state.type === ConnectionType.Bluetooth) {
      return dispatch(ConnEvent.InstructManualFlashing);
    }
    // We might get Error objects as Promise rejection arguments
    if (
      typeof err === "object" &&
      err !== null &&
      !("message" in err) &&
      "promise" in err &&
      "reason" in err
    ) {
      err = err.reason;
    }
    if (
      typeof err !== "object" ||
      err === null ||
      !(typeof err === "object" && "message" in err)
    ) {
      return dispatch(ConnEvent.TryAgainReplugMicrobit);
    }

    const errMessage = err.message as string;

    // This is somewhat fragile but worth it for scenario specific errors.
    // These messages changed to be prefixed in 2023 so we've relaxed the checks.
    if (/No valid interfaces found/.test(errMessage)) {
      // This comes from DAPjs's WebUSB open.
      return dispatch(ConnEvent.BadFirmware);
    } else if (/No device selected/.test(errMessage)) {
      return dispatch(ConnEvent.TryAgainSelectMicrobit);
    } else if (/Unable to claim interface/.test(errMessage)) {
      return dispatch(ConnEvent.TryAgainCloseTabs);
    } else {
      return dispatch(ConnEvent.TryAgainReplugMicrobit);
    }
  };

  const requestUSBConnectionAndFlash = async () => {
    dispatch(ConnEvent.WebUsbChooseMicrobit);
    try {
      const device = new MicrobitWebUSBConnection(logging);
      await device.connect();
      await flashMicrobit(device);
      if (state.type === ConnectionType.RadioBridge) {
        connectMicrobitsSerial();
      }
    } catch (e) {
      logging.error(
        `USB request device failed/cancelled: ${JSON.stringify(e)}`
      );
      handleWebUsbError(e);
    }
  };

  async function flashMicrobit(usb: MicrobitWebUSBConnection): Promise<void> {
    const deviceVersion = usb.getBoardVersion();
    const hexUrl = deviceVersion
      ? getHexFileUrl(deviceVersion, state.type)
      : deviceVersion;

    if (!hexUrl) {
      dispatch(ConnEvent.MicrobitUnsupported);
      return;
    }

    await usb.flashHex(hexUrl, (progress) => {
      if (state.stage !== ConnStage.FlashingInProgress) {
        dispatch(ConnEvent.FlashingInProgress);
      }
      setFlashProgress(progress * 100);
    });

    // TODO:
    // Store radio/bluetooth details. Radio is essential to pass to micro:bit 2.
    // Bluetooth saves the user from entering the pattern.
    // const deviceId = usb.getDeviceId();
    // if (flashStage === "bluetooth") {
    //   $btPatternInput = MBSpecs.Utility.nameToPattern(
    //     MBSpecs.Utility.serialNumberToName(deviceId)
    //   );
    // }
    // if (flashStage === "radio-remote") {
    //   $radioBridgeRemoteDeviceId = deviceId;
    // }

    // Next UI state:
    dispatch(ConnEvent.FlashingComplete);
  }

  const connectMicrobitsSerial = () => {
    dispatch(ConnEvent.ConnectingMicrobits);
    // TODO: Replace with real connecting logic
    setTimeout(() => {
      onClose();
    }, 5000);
  };

  const connectBluetooth = () => {
    dispatch(ConnEvent.ConnectingBluetooth);
    // TODO: Replace with real connecting logic
    const isSuccess = true;
    setTimeout(() => {
      if (isSuccess) {
        onClose();
      } else {
        dispatch(ConnEvent.TryAgainBluetoothConnect);
      }
    }, 5000);
  };

  // TODO: Flag reconnect failed
  const reconnectFailed = false;
  const onSwitchTypeClick = useCallback(() => dispatch(ConnEvent.Switch), []);
  const onBackClick = useCallback(() => dispatch(ConnEvent.Back), []);
  const onNextClick = useCallback(() => dispatch(ConnEvent.Next), []);
  const onSkip = useCallback(() => dispatch(ConnEvent.SkipFlashing), []);
  const onTryAgain = useCallback(() => dispatch(ConnEvent.TryAgain), []);
  const onInstructManualFlashing = useCallback(
    () => dispatch(ConnEvent.InstructManualFlashing),
    []
  );

  switch (state.stage) {
    case ConnStage.Start: {
      return (
        <WhatYouWillNeedDialog
          type={state.type}
          {...dialogCommonProps}
          onLinkClick={
            isBluetoothSupported && isUsbSupported
              ? onSwitchTypeClick
              : undefined
          }
          onNextClick={onNextClick}
          reconnect={reconnectFailed}
        />
      );
    }
    case ConnStage.ConnectCable: {
      const commonProps = { onBackClick, onNextClick, ...dialogCommonProps };
      return (
        <ConnectCableDialog
          {...commonProps}
          type={state.type}
          onSkip={onSkip}
          onSwitch={onSwitchTypeClick}
        />
      );
    }
    case ConnStage.WebUsbFlashingTutorial: {
      return (
        <SelectMicrobitUsbDialog
          {...dialogCommonProps}
          onBackClick={onBackClick}
          onNextClick={requestUSBConnectionAndFlash}
        />
      );
    }
    case ConnStage.ManualFlashingTutorial: {
      return (
        <ManualFlashingDialog
          {...dialogCommonProps}
          onNextClick={onNextClick}
          onBackClick={onBackClick}
        />
      );
    }
    case ConnStage.ConnectBattery: {
      return (
        <ConnectBatteryDialog
          {...dialogCommonProps}
          onBackClick={onBackClick}
          onNextClick={onNextClick}
        />
      );
    }
    case ConnStage.EnterBluetoothPattern: {
      return (
        <EnterBluetoothPatternDialog
          {...dialogCommonProps}
          onBackClick={onBackClick}
          onNextClick={onNextClick}
        />
      );
    }
    case ConnStage.ConnectBluetoothTutorial: {
      return (
        <SelectMicrobitBluetoothDialog
          {...dialogCommonProps}
          onBackClick={onBackClick}
          onNextClick={connectBluetooth}
        />
      );
    }
    case ConnStage.WebUsbChooseMicrobit: {
      // Browser dialog is shown, no custom dialog shown at the same time
      return <></>;
    }
    case ConnStage.FlashingInProgress: {
      const headingIdVariations = {
        [ConnectionType.Bluetooth]: "connectMB.usbDownloading.header",
        [ConnectionType.RadioRemote]: "connectMB.usbDownloadingMB1.header",
        [ConnectionType.RadioBridge]: "connectMB.usbDownloadingMB2.header",
      };
      return (
        <DownloadingDialog
          headingId={headingIdVariations[state.type]}
          isOpen={isOpen}
          progress={flashProgress}
        />
      );
    }
    case ConnStage.ConnectingBluetooth: {
      return (
        <LoadingDialog
          isOpen={isOpen}
          headingId="connectMB.bluetooth.heading"
        />
      );
    }
    case ConnStage.ConnectingMicrobits: {
      return (
        <LoadingDialog isOpen={isOpen} headingId="connectMB.radio.heading" />
      );
    }
    case ConnStage.TryAgainBluetoothConnect:
    case ConnStage.TryAgainReplugMicrobit:
    case ConnStage.TryAgainSelectMicrobit:
    case ConnStage.TryAgainCloseTabs: {
      return (
        <TryAgainDialog
          onClose={onClose}
          isOpen={isOpen}
          onTryAgain={onTryAgain}
          type={state.stage}
        />
      );
    }
    case ConnStage.BadFirmware: {
      return (
        <BrokenFirmwareDialog
          onClose={onClose}
          isOpen={isOpen}
          onSkip={onInstructManualFlashing}
          onTryAgain={onTryAgain}
        />
      );
    }
  }
};

export default ConnectionDialogs;
