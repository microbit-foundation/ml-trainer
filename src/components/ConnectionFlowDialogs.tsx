import { useDisclosure } from "@chakra-ui/react";
import { useReducer, useState } from "react";
import {
  ConnectionDialogStage,
  ConnectionType,
  connectionDialogReducer,
  ConnectionEvent,
} from "../connection-flow";
import { whatYouWillNeedConfig } from "../what-you-will-need-dialog-configs";
import ConnectCableDialog from "./ConnectCableDialog";
import WhatYouWillNeedDialog from "./WhatYouWillNeedDialog";
import SelectMicrobitUsbDialog from "./SelectMicrobitUsbDialog";
import ConnectBatteryDialog from "./ConnectBatteryDialog";
import EnterBluetoothPatternDialog from "./EnterBluetoothPatternDialog";
import SelectMicrobitBluetoothDialog from "./SelectMicrobitBluetoothDialog";
import { useLogging } from "../logging/logging-hooks";
import MicrobitWebUSBConnection from "../device/microbit-usb";
import { getHexFileUrl } from "../device/get-hex-file";
import DownloadingDialog from "./DownloadingDialog";
import LoadingDialog from "./LoadingDialog";

const ConnectionDialogs = () => {
  // Check compatability
  const logging = useLogging();

  const [isBluetoothSupported, isUsbSupported] = [true, true];
  const [flashProgress, setFlashProgress] = useState<number>(0);
  const [state, dispatch] = useReducer(connectionDialogReducer, {
    stage: ConnectionDialogStage.Start,
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
      return dispatch(ConnectionEvent.InstructManualFlashing);
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
      return dispatch(ConnectionEvent.TryAgainReplugMicrobit);
    }

    const errMessage = err.message as string;

    // This is somewhat fragile but worth it for scenario specific errors.
    // These messages changed to be prefixed in 2023 so we've relaxed the checks.
    if (/No valid interfaces found/.test(errMessage)) {
      // This comes from DAPjs's WebUSB open.
      return dispatch(ConnectionEvent.BadFirmware);
    } else if (/No device selected/.test(errMessage)) {
      return dispatch(ConnectionEvent.TryAgainSelectMicrobit);
    } else if (/Unable to claim interface/.test(errMessage)) {
      return dispatch(ConnectionEvent.TryAgainCloseTabs);
    } else {
      return dispatch(ConnectionEvent.TryAgainReplugMicrobit);
    }
  };

  const requestUSBConnectionAndFlash = async () => {
    dispatch(ConnectionEvent.WebUsbChooseMicrobit);
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
      dispatch(ConnectionEvent.MicrobitUnsupported);
      return;
    }

    await usb.flashHex(hexUrl, (progress) => {
      if (state.stage !== ConnectionDialogStage.FlashingInProgress) {
        dispatch(ConnectionEvent.FlashingInProgress);
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
    dispatch(ConnectionEvent.FlashingComplete);
  }

  const connectMicrobitsSerial = () => {
    dispatch(ConnectionEvent.ConnectingMicrobits);
    // TODO: Replace with real connecting logic
    setTimeout(() => {
      onClose();
    }, 5000);
  };

  const connectBluetooth = () => {
    dispatch(ConnectionEvent.ConnectingBluetooth);
    // TODO: Replace with real connecting logic
    const isSuccess = true;
    setTimeout(() => {
      if (isSuccess) {
        onClose();
      } else {
        dispatch(ConnectionEvent.TryAgainBluetoothConnect);
      }
    }, 5000);
  };

  // TODO: Flag reconnect failed
  const reconnectFailed = false;
  const onSwitchTypeClick = () => dispatch(ConnectionEvent.Switch);
  const onBackClick = () => dispatch(ConnectionEvent.Back);
  const onNextClick = () => dispatch(ConnectionEvent.Next);
  const onSkip = () => dispatch(ConnectionEvent.SkipFlashing);

  switch (state.stage) {
    case ConnectionDialogStage.Start: {
      const config = whatYouWillNeedConfig[state.type];
      return (
        <WhatYouWillNeedDialog
          {...config}
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
    case ConnectionDialogStage.ConnectCable: {
      const commonProps = { onBackClick, onNextClick, ...dialogCommonProps };
      if (state.type === ConnectionType.Bluetooth)
        return (
          <ConnectCableDialog
            {...commonProps}
            headingId="connectMB.connectCable.heading"
            subtitleId="connectMB.connectCable.subtitle"
            linkTextId="connectMB.connectCable.skip"
            onLinkClick={onSkip}
          />
        );
      if (state.type === ConnectionType.RadioRemote)
        return (
          <ConnectCableDialog
            {...commonProps}
            headingId="connectMB.connectCableMB1.heading"
            subtitleId="connectMB.connectCableMB1.subtitle"
          />
        );
      if (state.type === ConnectionType.RadioBridge)
        return (
          <ConnectCableDialog
            {...commonProps}
            headingId="connectMB.connectCableMB2.heading"
            subtitleId="connectMB.connectCableMB2.subtitle"
            linkTextId="connectMB.radioStart.switchBluetooth"
            onLinkClick={onSwitchTypeClick}
          />
        );
      break;
    }
    case ConnectionDialogStage.WebUsbFlashingTutorial: {
      return (
        <SelectMicrobitUsbDialog
          {...dialogCommonProps}
          onBackClick={onBackClick}
          onNextClick={requestUSBConnectionAndFlash}
        />
      );
    }
    case ConnectionDialogStage.ConnectBattery: {
      return (
        <ConnectBatteryDialog
          {...dialogCommonProps}
          onBackClick={onBackClick}
          onNextClick={onNextClick}
        />
      );
    }
    case ConnectionDialogStage.EnterBluetoothPattern: {
      return (
        <EnterBluetoothPatternDialog
          {...dialogCommonProps}
          onBackClick={onBackClick}
          onNextClick={onNextClick}
        />
      );
    }
    case ConnectionDialogStage.ConnectBluetoothTutorial: {
      return (
        <SelectMicrobitBluetoothDialog
          {...dialogCommonProps}
          onBackClick={onBackClick}
          onNextClick={connectBluetooth}
        />
      );
    }
    case ConnectionDialogStage.WebUsbChooseMicrobit: {
      // Browser dialog is shown, no custom dialog shown at the same time
      return <></>;
    }
    case ConnectionDialogStage.FlashingInProgress: {
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
    case ConnectionDialogStage.ConnectingBluetooth: {
      return (
        <LoadingDialog
          isOpen={isOpen}
          headingId="connectMB.bluetooth.heading"
        />
      );
    }
    case ConnectionDialogStage.ConnectingMicrobits: {
      return (
        <LoadingDialog isOpen={isOpen} headingId="connectMB.radio.heading" />
      );
    }
  }
};

export default ConnectionDialogs;
