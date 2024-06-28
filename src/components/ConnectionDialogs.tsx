import { useDisclosure } from "@chakra-ui/react";
import { useReducer } from "react";
import {
  ConnectionDialogEvent,
  ConnectionDialogStage,
  ConnectionType,
  connectionDialogReducer,
} from "../connection-dialogs";
import { whatYouWillNeedConfig } from "../connection-dialogs-config";
import ConnectCableDialog from "./ConnectCableDialog";
import WhatYouWillNeedDialog from "./WhatYouWillNeedDialog";
import SelectMicrobitUsbDialog from "./SelectMicrobitUsbDialog";
import ConnectBatteryDialog from "./ConnectBatteryDialog";
import EnterBluetoothPatternDialog from "./EnterBluetoothPatternDialog";
import SelectMicrobitBluetoothDialog from "./SelectMicrobitBluetoothDialog";

const ConnectionDialogs = () => {
  // Check compatability
  const [isBluetoothSupported, isUsbSupported] = [true, true];
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

  // TODO: Flag reconnect failed
  const reconnectFailed = false;
  const onSwitchTypeClick = () => dispatch(ConnectionDialogEvent.Switch);
  const onBackClick = () => dispatch(ConnectionDialogEvent.Back);
  const onNextClick = () => dispatch(ConnectionDialogEvent.Next);
  const onSkip = () => dispatch(ConnectionDialogEvent.SkipFlashing);

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
          onNextClick={() => {
            // TODO: Try usb connect
            onNextClick();
          }}
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
    case ConnectionDialogStage.ConnectBluetooth: {
      return (
        <SelectMicrobitBluetoothDialog
          {...dialogCommonProps}
          onBackClick={onBackClick}
          onNextClick={onNextClick}
        />
      );
    }
  }
};

export default ConnectionDialogs;
