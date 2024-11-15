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
  isBrowserTabVisible: boolean;
}

export type NextConnectionState =
  | { status: ConnectionStatus; flowType: ConnectionFlowType }
  | undefined;

export const getNextConnectionState = (
  input: GetNextConnectionStateInput
): NextConnectionState => {
  const {
    currConnType,
    currStatus,
    deviceStatus,
    prevDeviceStatus,
    type,
    hasAttempedReconnect,
    setHasAttemptedReconnect,
    onFirstConnectAttempt,
    setOnFirstConnectAttempt,
    isBrowserTabVisible,
  } = input;

  if (currStatus === ConnectionStatus.Disconnected) {
    // Do not update connection status when user explicitly disconnected connection
    // until user reconnects explicitly
    return undefined;
  }
  const flowType =
    type === "usb"
      ? ConnectionFlowType.ConnectRadioBridge
      : type === "radioRemote"
      ? ConnectionFlowType.ConnectRadioRemote
      : ConnectionFlowType.ConnectBluetooth;

  // Don't update connection status when hiding browser tab if connection
  // status is already set to an error case.
  if (
    !isBrowserTabVisible &&
    (currStatus === ConnectionStatus.FailedToConnect ||
      currStatus === ConnectionStatus.ConnectionLost ||
      currStatus === ConnectionStatus.FailedToReconnect ||
      currStatus === ConnectionStatus.FailedToReconnectTwice)
  ) {
    return undefined;
  }

  const hasStartedOver =
    currStatus === ConnectionStatus.NotConnected ||
    currStatus === ConnectionStatus.FailedToConnect ||
    currStatus === ConnectionStatus.FailedToReconnectTwice;

  if (hasStartedOver) {
    setHasAttemptedReconnect(false);
    setOnFirstConnectAttempt(true);
  }

  // We use usb status to infer the radio bridge device status for handling error.
  if (type === "usb") {
    if (
      // Ignore USB status updates when radio connection is not established,
      // is disconnected, or is reconnecting. The connection gets intentionally
      // disconnected before reconnecting.
      currConnType !== "radio" ||
      onFirstConnectAttempt ||
      deviceStatus !== DeviceConnectionStatus.DISCONNECTED ||
      // Ignore usb status when reconnecting.
      // Serial connection gets intentionally disconnected before reconnect.
      currStatus === ConnectionStatus.ReconnectingAutomatically ||
      currStatus === ConnectionStatus.ReconnectingExplicitly ||
      currStatus === ConnectionStatus.NotConnected
    ) {
      return undefined;
    }
    // Show reconnecting automatically when user hides browser tab and there is a connection error.
    if (!isBrowserTabVisible) {
      return { status: ConnectionStatus.ReconnectingAutomatically, flowType };
    }
    if (
      // If bridge micro:bit causes radio bridge reconnect to fail twice
      hasAttempedReconnect
    ) {
      return {
        status: ConnectionStatus.FailedToReconnectTwice,
        flowType: ConnectionFlowType.ConnectRadioRemote,
      };
    }
    // If bridge micro:bit causes radio bridge reconnect to fail
    setHasAttemptedReconnect(true);
    const status =
      currStatus === ConnectionStatus.Connected
        ? ConnectionStatus.ConnectionLost
        : ConnectionStatus.FailedToReconnect;
    return { status, flowType };
  }

  if (
    // If user starts or restarts connection flow.
    // Disconnection happens for newly started / restarted
    // bluetooth connection flows when clearing device
    deviceStatus === DeviceConnectionStatus.DISCONNECTED &&
    currStatus === ConnectionStatus.NotConnected
  ) {
    return { status: ConnectionStatus.NotConnected, flowType };
  }
  if (
    // If connected.
    deviceStatus === DeviceConnectionStatus.CONNECTED
  ) {
    setOnFirstConnectAttempt(false);
    setHasAttemptedReconnect(false);
    return { status: ConnectionStatus.Connected, flowType };
  }
  if (
    // If user fail to connect.
    onFirstConnectAttempt &&
    currStatus === ConnectionStatus.Connecting &&
    deviceStatus === DeviceConnectionStatus.DISCONNECTED
  ) {
    // We count this as the first connect failure.
    // If we fail a second time, we should prompt the user to start over.
    // Set the fields below appropriately to acheive this.
    setOnFirstConnectAttempt(false);
    setHasAttemptedReconnect(true);
    return { status: ConnectionStatus.FailedToConnect, flowType };
  }
  if (
    // If user does not select a device for bluetooth connection.
    type === "bluetooth" &&
    deviceStatus === DeviceConnectionStatus.NO_AUTHORIZED_DEVICE &&
    prevDeviceStatus === DeviceConnectionStatus.NO_AUTHORIZED_DEVICE
  ) {
    return { status: ConnectionStatus.FailedToSelectBluetoothDevice, flowType };
  }
  if (
    // If fails to reconnect twice.
    !onFirstConnectAttempt &&
    hasAttempedReconnect &&
    deviceStatus === DeviceConnectionStatus.DISCONNECTED
  ) {
    // Reset connection state fields so that the next connection attempt is clean.
    setOnFirstConnectAttempt(true);
    setHasAttemptedReconnect(false);
    return { status: ConnectionStatus.FailedToReconnectTwice, flowType };
  }
  if (
    // If fails to reconnect by user.
    !onFirstConnectAttempt &&
    deviceStatus === DeviceConnectionStatus.DISCONNECTED &&
    (prevDeviceStatus === DeviceConnectionStatus.CONNECTING ||
      prevDeviceStatus === DeviceConnectionStatus.NO_AUTHORIZED_DEVICE)
  ) {
    setHasAttemptedReconnect(true);
    return { status: ConnectionStatus.FailedToReconnect, flowType };
  }
  if (
    // If fails to reconnect automatically.
    deviceStatus === DeviceConnectionStatus.DISCONNECTED &&
    currStatus === ConnectionStatus.ReconnectingAutomatically
  ) {
    setHasAttemptedReconnect(true);
    return { status: ConnectionStatus.ConnectionLost, flowType };
  }
  if (
    // If connecting.
    deviceStatus === DeviceConnectionStatus.CONNECTING &&
    hasStartedOver
  ) {
    return { status: ConnectionStatus.Connecting, flowType };
  }
  if (
    // If reconnecting automatically.
    !onFirstConnectAttempt &&
    deviceStatus === DeviceConnectionStatus.RECONNECTING
  ) {
    return { status: ConnectionStatus.ReconnectingAutomatically, flowType };
  }
  return undefined;
};
