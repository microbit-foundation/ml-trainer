/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { ConnectionStatus } from "./connect-status-hooks";
import {
  GetNextConnectionStateInput,
  NextConnectionState,
  getNextConnectionState,
} from "./get-next-connection-state";
import { ConnectionStatus as DeviceConnectionStatus } from "@microbit/microbit-connection";
import { ConnectionFlowType } from "./connection-stage-hooks";

type Input = Pick<
  GetNextConnectionStateInput,
  "currConnType" | "currStatus" | "deviceStatus" | "prevDeviceStatus" | "type"
>;

const testGetNextConnectionState = ({
  input,
  initialHasAttemptedReconnect,
  initialOnFirstConnectAttempt,
  expectedNextConnectionState,
  expectedHasAttemptedReconnect,
  expectedOnFirstConnectAttempt,
}: {
  input: Input;
  initialHasAttemptedReconnect: boolean;
  expectedNextConnectionState: NextConnectionState;
  expectedHasAttemptedReconnect: boolean;
  initialOnFirstConnectAttempt: boolean;
  expectedOnFirstConnectAttempt: boolean;
}) => {
  let hasAttempedReconnect = initialHasAttemptedReconnect;
  let onFirstConnectAttempt = initialOnFirstConnectAttempt;
  const result = getNextConnectionState({
    ...input,
    hasAttempedReconnect,
    onFirstConnectAttempt,
    setOnFirstConnectAttempt: (val: boolean) => {
      onFirstConnectAttempt = val;
    },
    setHasAttemptedReconnect: (val: boolean) => {
      hasAttempedReconnect = val;
    },
  });
  expect(result).toEqual(expectedNextConnectionState);
  expect(hasAttempedReconnect).toEqual(expectedHasAttemptedReconnect);
  expect(onFirstConnectAttempt).toEqual(expectedOnFirstConnectAttempt);
};

describe("getNextConnectionState for radio connection", () => {
  test("radio usb flashing", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "radio",
        currStatus: ConnectionStatus.NotConnected,
        deviceStatus: DeviceConnectionStatus.CONNECTING,
        prevDeviceStatus: DeviceConnectionStatus.NO_AUTHORIZED_DEVICE,
        type: "usb",
      },
      initialOnFirstConnectAttempt: true,
      expectedOnFirstConnectAttempt: true,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: undefined,
    });
  });
  test("radio connecting", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "radio",
        currStatus: ConnectionStatus.NotConnected,
        deviceStatus: DeviceConnectionStatus.CONNECTING,
        prevDeviceStatus: DeviceConnectionStatus.NO_AUTHORIZED_DEVICE,
        type: "radioRemote",
      },
      initialOnFirstConnectAttempt: false,
      expectedOnFirstConnectAttempt: true,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.Connecting,
        flowType: ConnectionFlowType.RadioRemote,
      },
    });
  });
  test("radio connected for the first time", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "radio",
        currStatus: ConnectionStatus.NotConnected,
        deviceStatus: DeviceConnectionStatus.CONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
        type: "radioRemote",
      },
      initialOnFirstConnectAttempt: true,
      expectedOnFirstConnectAttempt: false,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.Connected,
        flowType: ConnectionFlowType.RadioRemote,
      },
    });
  });
  test("radio connected subsequent times", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "radio",
        currStatus: ConnectionStatus.Disconnected,
        deviceStatus: DeviceConnectionStatus.CONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
        type: "radioRemote",
      },
      initialOnFirstConnectAttempt: false,
      expectedOnFirstConnectAttempt: false,
      initialHasAttemptedReconnect: true,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.Connected,
        flowType: ConnectionFlowType.RadioRemote,
      },
    });
  });
  test("radio disconnect", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "radio",
        currStatus: ConnectionStatus.Disconnected,
        deviceStatus: DeviceConnectionStatus.DISCONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.CONNECTED,
        type: "radioRemote",
      },
      initialOnFirstConnectAttempt: false,
      expectedOnFirstConnectAttempt: false,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.Disconnected,
        flowType: ConnectionFlowType.RadioRemote,
      },
    });
  });
  test("radio connect fail", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "radio",
        currStatus: ConnectionStatus.Connecting,
        deviceStatus: DeviceConnectionStatus.DISCONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
        type: "radioRemote",
      },
      initialOnFirstConnectAttempt: true,
      expectedOnFirstConnectAttempt: true,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.FailedToConnect,
        flowType: ConnectionFlowType.RadioRemote,
      },
    });
  });
  test("radio reconnecting explicitly", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "radio",
        currStatus: ConnectionStatus.Disconnected,
        deviceStatus: DeviceConnectionStatus.CONNECTING,
        prevDeviceStatus: DeviceConnectionStatus.DISCONNECTED,
        type: "radioRemote",
      },
      initialOnFirstConnectAttempt: false,
      expectedOnFirstConnectAttempt: false,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.ReconnectingExplicitly,
        flowType: ConnectionFlowType.RadioRemote,
      },
    });
  });
  test("radio reconnecting automatically", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "radio",
        currStatus: ConnectionStatus.Connected,
        deviceStatus: DeviceConnectionStatus.RECONNECTING,
        prevDeviceStatus: DeviceConnectionStatus.CONNECTED,
        type: "radioRemote",
      },
      initialOnFirstConnectAttempt: false,
      expectedOnFirstConnectAttempt: false,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.ReconnectingAutomatically,
        flowType: ConnectionFlowType.RadioRemote,
      },
    });
  });
  test("radio bridge device connection lost by unplugging device", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "radio",
        currStatus: ConnectionStatus.Connected,
        deviceStatus: DeviceConnectionStatus.DISCONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.NO_AUTHORIZED_DEVICE,
        type: "usb",
      },
      initialOnFirstConnectAttempt: false,
      expectedOnFirstConnectAttempt: false,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: true,
      expectedNextConnectionState: {
        status: ConnectionStatus.ConnectionLost,
        flowType: ConnectionFlowType.RadioBridge,
      },
    });
  });
  test("radio bridge device reconnect fail", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "radio",
        currStatus: ConnectionStatus.Connecting,
        deviceStatus: DeviceConnectionStatus.DISCONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
        type: "usb",
      },
      initialOnFirstConnectAttempt: false,
      expectedOnFirstConnectAttempt: false,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: true,
      expectedNextConnectionState: {
        status: ConnectionStatus.FailedToReconnect,
        flowType: ConnectionFlowType.RadioBridge,
      },
    });
  });
  test("radio bridge device reconnect fail twice from connection loss", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "radio",
        currStatus: ConnectionStatus.Connected,
        deviceStatus: DeviceConnectionStatus.DISCONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.DISCONNECTED,
        type: "usb",
      },
      initialOnFirstConnectAttempt: false,
      expectedOnFirstConnectAttempt: false,
      initialHasAttemptedReconnect: true,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.FailedToReconnectTwice,
        flowType: ConnectionFlowType.RadioRemote,
      },
    });
  });
  test("radio remote connection lost by unplugging device", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "radio",
        currStatus: ConnectionStatus.ReconnectingAutomatically,
        deviceStatus: DeviceConnectionStatus.DISCONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.RECONNECTING,
        type: "radioRemote",
      },
      initialOnFirstConnectAttempt: false,
      expectedOnFirstConnectAttempt: false,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: true,
      expectedNextConnectionState: {
        status: ConnectionStatus.ConnectionLost,
        flowType: ConnectionFlowType.RadioRemote,
      },
    });
  });
  test("radio remote reconnect fail", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "radio",
        currStatus: ConnectionStatus.ReconnectingExplicitly,
        deviceStatus: DeviceConnectionStatus.DISCONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
        type: "radioRemote",
      },
      initialOnFirstConnectAttempt: false,
      expectedOnFirstConnectAttempt: false,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: true,
      expectedNextConnectionState: {
        status: ConnectionStatus.FailedToReconnect,
        flowType: ConnectionFlowType.RadioRemote,
      },
    });
  });
  test("radio remote reconnect fail twice", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "radio",
        currStatus: ConnectionStatus.ReconnectingExplicitly,
        deviceStatus: DeviceConnectionStatus.DISCONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
        type: "radioRemote",
      },
      initialOnFirstConnectAttempt: false,
      expectedOnFirstConnectAttempt: false,
      initialHasAttemptedReconnect: true,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.FailedToReconnectTwice,
        flowType: ConnectionFlowType.RadioRemote,
      },
    });
  });
});

describe("getNextConnectionState for bluetooth connection", () => {
  test("bluetooth connecting", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "bluetooth",
        currStatus: ConnectionStatus.NotConnected,
        deviceStatus: DeviceConnectionStatus.CONNECTING,
        prevDeviceStatus: DeviceConnectionStatus.NO_AUTHORIZED_DEVICE,
        type: "bluetooth",
      },
      initialOnFirstConnectAttempt: false,
      expectedOnFirstConnectAttempt: true,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.Connecting,
        flowType: ConnectionFlowType.Bluetooth,
      },
    });
  });
  test("bluetooth connected for the first time", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "bluetooth",
        currStatus: ConnectionStatus.NotConnected,
        deviceStatus: DeviceConnectionStatus.CONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
        type: "bluetooth",
      },
      initialOnFirstConnectAttempt: true,
      expectedOnFirstConnectAttempt: false,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.Connected,
        flowType: ConnectionFlowType.Bluetooth,
      },
    });
  });
  test("bluetooth connected subsequent times", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "bluetooth",
        currStatus: ConnectionStatus.Disconnected,
        deviceStatus: DeviceConnectionStatus.CONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
        type: "bluetooth",
      },
      initialOnFirstConnectAttempt: false,
      expectedOnFirstConnectAttempt: false,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.Connected,
        flowType: ConnectionFlowType.Bluetooth,
      },
    });
  });
  test("bluetooth disconnect", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "bluetooth",
        currStatus: ConnectionStatus.Disconnected,
        deviceStatus: DeviceConnectionStatus.DISCONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.CONNECTED,
        type: "bluetooth",
      },
      initialOnFirstConnectAttempt: false,
      expectedOnFirstConnectAttempt: false,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.Disconnected,
        flowType: ConnectionFlowType.Bluetooth,
      },
    });
  });
  test("bluetooth did not select device", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "bluetooth",
        currStatus: ConnectionStatus.NotConnected,
        deviceStatus: DeviceConnectionStatus.NO_AUTHORIZED_DEVICE,
        prevDeviceStatus: DeviceConnectionStatus.NO_AUTHORIZED_DEVICE,
        type: "bluetooth",
      },
      initialOnFirstConnectAttempt: false,
      expectedOnFirstConnectAttempt: false,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.FailedToSelectBluetoothDevice,
        flowType: ConnectionFlowType.Bluetooth,
      },
    });
  });
  test("bluetooth connect fail", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "bluetooth",
        currStatus: ConnectionStatus.Connecting,
        deviceStatus: DeviceConnectionStatus.DISCONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
        type: "bluetooth",
      },
      initialOnFirstConnectAttempt: true,
      expectedOnFirstConnectAttempt: true,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.FailedToConnect,
        flowType: ConnectionFlowType.Bluetooth,
      },
    });
  });
  test("bluetooth reconnecting explicitly", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "bluetooth",
        currStatus: ConnectionStatus.Disconnected,
        deviceStatus: DeviceConnectionStatus.CONNECTING,
        prevDeviceStatus: DeviceConnectionStatus.DISCONNECTED,
        type: "bluetooth",
      },
      initialOnFirstConnectAttempt: false,
      expectedOnFirstConnectAttempt: false,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.ReconnectingExplicitly,
        flowType: ConnectionFlowType.Bluetooth,
      },
    });
  });
  test("bluetooth reconnecting automatically", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "bluetooth",
        currStatus: ConnectionStatus.Connected,
        deviceStatus: DeviceConnectionStatus.RECONNECTING,
        prevDeviceStatus: DeviceConnectionStatus.CONNECTED,
        type: "bluetooth",
      },
      initialOnFirstConnectAttempt: false,
      expectedOnFirstConnectAttempt: false,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.ReconnectingAutomatically,
        flowType: ConnectionFlowType.Bluetooth,
      },
    });
  });
  test("bluetooth connection lost by unplugging device", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "bluetooth",
        currStatus: ConnectionStatus.ReconnectingAutomatically,
        deviceStatus: DeviceConnectionStatus.DISCONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.RECONNECTING,
        type: "bluetooth",
      },
      initialOnFirstConnectAttempt: false,
      expectedOnFirstConnectAttempt: false,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: true,
      expectedNextConnectionState: {
        status: ConnectionStatus.ConnectionLost,
        flowType: ConnectionFlowType.Bluetooth,
      },
    });
  });
  test("bluetooth reconnect fail", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "bluetooth",
        currStatus: ConnectionStatus.ReconnectingExplicitly,
        deviceStatus: DeviceConnectionStatus.DISCONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
        type: "bluetooth",
      },
      initialOnFirstConnectAttempt: false,
      expectedOnFirstConnectAttempt: false,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: true,
      expectedNextConnectionState: {
        status: ConnectionStatus.FailedToReconnect,
        flowType: ConnectionFlowType.Bluetooth,
      },
    });
  });
  test("bluetooth reconnect fail twice", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "bluetooth",
        currStatus: ConnectionStatus.ReconnectingExplicitly,
        deviceStatus: DeviceConnectionStatus.DISCONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
        type: "bluetooth",
      },
      initialOnFirstConnectAttempt: false,
      expectedOnFirstConnectAttempt: false,
      initialHasAttemptedReconnect: true,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.FailedToReconnectTwice,
        flowType: ConnectionFlowType.Bluetooth,
      },
    });
  });
});
