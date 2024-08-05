import { StatusListenerType } from "./connect-actions";
import { ConnectionStatus } from "./connect-status-hooks";
import { ConnectionFlowType, ConnectionType } from "./connection-stage-hooks";
import { ConnectionStatus as DeviceConnectionStatus } from "@microbit/microbit-connection";

export interface GetNextConnectionStateInput {
  currConnType: ConnectionType;
  currStatus: ConnectionStatus;
  deviceStatus: DeviceConnectionStatus;
  prevDeviceStatus: DeviceConnectionStatus | null;
  type: StatusListenerType;
  hasAttempedReconnect: boolean;
  setHasAttemptedReconnect: (val: boolean) => void;
  onFirstConnectAttempt: boolean;
  setOnFirstConnectAttempt: (val: boolean) => void;
}

export type NextConnectionState =
  | { status: ConnectionStatus; flowType: ConnectionFlowType }
  | undefined;

export const getNextConnectionState = ({
  currConnType,
  currStatus,
  deviceStatus,
  prevDeviceStatus,
  type,
  hasAttempedReconnect,
  setHasAttemptedReconnect,
  onFirstConnectAttempt,
  setOnFirstConnectAttempt,
}: GetNextConnectionStateInput): NextConnectionState => {
  const flowType =
    type === "usb"
      ? ConnectionFlowType.RadioBridge
      : type === "radioRemote"
      ? ConnectionFlowType.RadioRemote
      : ConnectionFlowType.Bluetooth;

  // We are using usb status to infer the radio bridge device status.
  if (type === "usb") {
    // Ignore USB status updates when radio connection is not established or is disconnected.
    if (
      currConnType !== "radio" ||
      onFirstConnectAttempt ||
      deviceStatus !== DeviceConnectionStatus.DISCONNECTED ||
      currStatus === ConnectionStatus.Disconnected ||
      // Serial connection gets intentionally disconnected before doing
      // reconnect attempt.
      currStatus === ConnectionStatus.ReconnectingAutomatically ||
      currStatus === ConnectionStatus.ReconnectingExplicitly
    ) {
      return undefined;
    }
    if (!hasAttempedReconnect && currStatus === ConnectionStatus.Connected) {
      setHasAttemptedReconnect(true);
      return { status: ConnectionStatus.ConnectionLost, flowType };
    }
    if (!hasAttempedReconnect && currStatus !== ConnectionStatus.Connected) {
      setHasAttemptedReconnect(true);
      return { status: ConnectionStatus.FailedToReconnect, flowType };
    }
    if (hasAttempedReconnect) {
      return {
        status: ConnectionStatus.FailedToReconnectTwice,
        flowType: ConnectionFlowType.RadioRemote,
      };
    }
    return undefined;
  }
  if (
    // Disconnection happens for newly started / restarted
    // bluetooth connection flows when clearing device
    deviceStatus === DeviceConnectionStatus.DISCONNECTED &&
    currStatus === ConnectionStatus.NotConnected
  ) {
    return { status: ConnectionStatus.NotConnected, flowType };
  }
  if (deviceStatus === DeviceConnectionStatus.CONNECTED) {
    setOnFirstConnectAttempt(false);
    setHasAttemptedReconnect(false);
    return { status: ConnectionStatus.Connected, flowType };
  }
  if (
    onFirstConnectAttempt &&
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
    return { status: ConnectionStatus.FailedToSelectBluetoothDevice, flowType };
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
    (prevDeviceStatus === DeviceConnectionStatus.CONNECTING ||
      prevDeviceStatus === DeviceConnectionStatus.NO_AUTHORIZED_DEVICE)
  ) {
    setHasAttemptedReconnect(true);
    return { status: ConnectionStatus.FailedToReconnect, flowType };
  }
  if (
    deviceStatus === DeviceConnectionStatus.DISCONNECTED &&
    currStatus === ConnectionStatus.ReconnectingAutomatically
  ) {
    setHasAttemptedReconnect(true);
    return { status: ConnectionStatus.ConnectionLost, flowType };
  }
  if (deviceStatus === DeviceConnectionStatus.DISCONNECTED) {
    return { status: ConnectionStatus.Disconnected, flowType };
  }
  if (deviceStatus === DeviceConnectionStatus.CONNECTING) {
    const hasStartedOver =
      currStatus === ConnectionStatus.NotConnected ||
      currStatus === ConnectionStatus.FailedToConnect;
    if (hasStartedOver) {
      setOnFirstConnectAttempt(true);
    }
    const newStatus = hasStartedOver
      ? ConnectionStatus.Connecting
      : ConnectionStatus.ReconnectingExplicitly;
    return { status: newStatus, flowType };
  }
  if (deviceStatus === DeviceConnectionStatus.RECONNECTING) {
    return { status: ConnectionStatus.ReconnectingAutomatically, flowType };
  }
  return undefined;
};
