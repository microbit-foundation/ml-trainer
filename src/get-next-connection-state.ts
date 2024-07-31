import { MutableRefObject } from "react";
import { StatusListenerType } from "./connect-actions";
import { ConnectionStatus } from "./connect-status-hooks";
import { ConnectionFlowType, ConnectionType } from "./connection-stage-hooks";
import { ConnectionStatus as DeviceConnectionStatus } from "@microbit/microbit-connection";

export interface ConnectionState {
  currConnType: ConnectionType;
  currStatus: ConnectionStatus;
  deviceStatus: DeviceConnectionStatus;
  prevDeviceStatus: DeviceConnectionStatus | null;
  type: StatusListenerType;
  hasAttempedReconnect: boolean;
  setHasAttemptedReconnect: (val: boolean) => void;
  hasRadioConnected: boolean;
  setHasRadioConnected: (val: boolean) => void;
}

export const getNextConnectionState = ({
  currConnType,
  currStatus,
  deviceStatus,
  prevDeviceStatus,
  type,
  hasAttempedReconnect,
  setHasAttemptedReconnect,
  hasRadioConnected,
  setHasRadioConnected,
}: ConnectionState):
  | { status: ConnectionStatus; flowType: ConnectionFlowType }
  | undefined => {
  console.log(type, deviceStatus, hasRadioConnected);
  const flowType =
    type === "usb"
      ? ConnectionFlowType.RadioBridge
      : type === "radioRemote"
      ? ConnectionFlowType.RadioRemote
      : ConnectionFlowType.Bluetooth;

  // We are using usb status to infer the radio bridge device status.
  if (type === "usb") {
    // Ignore USB status updates when radio connection is not established.
    if (currConnType !== "radio") {
      return undefined;
    }
    if (
      !hasAttempedReconnect &&
      deviceStatus === DeviceConnectionStatus.DISCONNECTED &&
      prevDeviceStatus === DeviceConnectionStatus.CONNECTED
    ) {
      setHasAttemptedReconnect(true);
      return { status: ConnectionStatus.ConnectionLost, flowType };
    }
    if (
      !hasAttempedReconnect &&
      deviceStatus === DeviceConnectionStatus.DISCONNECTED
    ) {
      setHasAttemptedReconnect(true);
      return { status: ConnectionStatus.FailedToReconnect, flowType };
    }
    if (
      hasAttempedReconnect &&
      deviceStatus === DeviceConnectionStatus.DISCONNECTED
    ) {
      return { status: ConnectionStatus.FailedToReconnectTwice, flowType };
    }
    return undefined;
  }

  if (
    type === "radioRemote" &&
    deviceStatus === DeviceConnectionStatus.DISCONNECTED
  ) {
    setHasRadioConnected(false);
  }
  if (
    // Disconnection happens for newly started / restarted
    // connection flows when clearing device
    deviceStatus === DeviceConnectionStatus.DISCONNECTED &&
    currStatus === ConnectionStatus.NotConnected
  ) {
    return { status: ConnectionStatus.NotConnected, flowType };
  }
  if (deviceStatus === DeviceConnectionStatus.CONNECTED) {
    setHasAttemptedReconnect(false);
    if (type === "radioRemote") {
      setHasRadioConnected(true);
    }
    return { status: ConnectionStatus.Connected, flowType };
  }
  if (
    currStatus === ConnectionStatus.Connecting &&
    deviceStatus === DeviceConnectionStatus.DISCONNECTED
  ) {
    return { status: ConnectionStatus.FailedToConnect, flowType };
  }
  if (
    // If user does not select a device for bluetooth connection
    type === "bluetooth" &&
    deviceStatus === DeviceConnectionStatus.NO_AUTHORIZED_DEVICE &&
    prevDeviceStatus === DeviceConnectionStatus.NO_AUTHORIZED_DEVICE
  ) {
    return { status: ConnectionStatus.FailedToConnect, flowType };
  }
  if (
    hasAttempedReconnect &&
    deviceStatus === DeviceConnectionStatus.DISCONNECTED &&
    prevDeviceStatus === DeviceConnectionStatus.CONNECTING
  ) {
    return { status: ConnectionStatus.FailedToReconnectTwice, flowType };
  }
  if (
    deviceStatus === DeviceConnectionStatus.DISCONNECTED &&
    prevDeviceStatus === DeviceConnectionStatus.CONNECTING
  ) {
    setHasAttemptedReconnect(true);
    return { status: ConnectionStatus.FailedToReconnect, flowType };
  }
  if (
    deviceStatus === DeviceConnectionStatus.DISCONNECTED &&
    prevDeviceStatus === DeviceConnectionStatus.RECONNECTING
  ) {
    setHasAttemptedReconnect(true);
    return { status: ConnectionStatus.ConnectionLost, flowType };
  }
  if (
    deviceStatus === DeviceConnectionStatus.DISCONNECTED &&
    prevDeviceStatus !== DeviceConnectionStatus.DISCONNECTED
  ) {
    return { status: ConnectionStatus.Disconnected, flowType };
  }
  if (
    deviceStatus === DeviceConnectionStatus.RECONNECTING ||
    deviceStatus === DeviceConnectionStatus.CONNECTING
  ) {
    const newStatus =
      currStatus === ConnectionStatus.NotConnected ||
      currStatus === ConnectionStatus.FailedToConnect
        ? ConnectionStatus.Connecting
        : ConnectionStatus.Reconnecting;
    return { status: newStatus, flowType };
  }
  return undefined;
};
