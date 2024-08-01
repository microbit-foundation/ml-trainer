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
  expectedNextConnectionState,
  expectedHasAttemptedReconnect,
}: {
  input: Input;
  initialHasAttemptedReconnect: boolean;
  expectedNextConnectionState: NextConnectionState;
  expectedHasAttemptedReconnect: boolean;
}) => {
  let hasAttempedReconnect = initialHasAttemptedReconnect;
  const result = getNextConnectionState({
    ...input,
    hasAttempedReconnect,
    setHasAttemptedReconnect: (val: boolean) => {
      hasAttempedReconnect = val;
    },
  });
  expect(result).toEqual(expectedNextConnectionState);
  expect(hasAttempedReconnect).toEqual(expectedHasAttemptedReconnect);
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
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.FailedToConnect,
        flowType: ConnectionFlowType.RadioRemote,
      },
    });
  });
  test("radio reconnecting", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "radio",
        currStatus: ConnectionStatus.Disconnected,
        deviceStatus: DeviceConnectionStatus.CONNECTING,
        prevDeviceStatus: DeviceConnectionStatus.DISCONNECTED,
        type: "radioRemote",
      },
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.Reconnecting,
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
        currStatus: ConnectionStatus.Disconnected,
        deviceStatus: DeviceConnectionStatus.DISCONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
        type: "usb",
      },
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
      initialHasAttemptedReconnect: true,
      expectedHasAttemptedReconnect: true,
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
        currStatus: ConnectionStatus.Reconnecting,
        deviceStatus: DeviceConnectionStatus.DISCONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.RECONNECTING,
        type: "radioRemote",
      },
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
        currStatus: ConnectionStatus.Reconnecting,
        deviceStatus: DeviceConnectionStatus.DISCONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
        type: "radioRemote",
      },
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
        currStatus: ConnectionStatus.Reconnecting,
        deviceStatus: DeviceConnectionStatus.DISCONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
        type: "radioRemote",
      },
      initialHasAttemptedReconnect: true,
      expectedHasAttemptedReconnect: true,
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
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.Disconnected,
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
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.FailedToConnect,
        flowType: ConnectionFlowType.Bluetooth,
      },
    });
  });
  test("bluetooth reconnecting", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "bluetooth",
        currStatus: ConnectionStatus.Disconnected,
        deviceStatus: DeviceConnectionStatus.CONNECTING,
        prevDeviceStatus: DeviceConnectionStatus.DISCONNECTED,
        type: "bluetooth",
      },
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.Reconnecting,
        flowType: ConnectionFlowType.Bluetooth,
      },
    });
  });
  test("bluetooth connection lost by unplugging device", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "bluetooth",
        currStatus: ConnectionStatus.Connected,
        deviceStatus: DeviceConnectionStatus.DISCONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.RECONNECTING,
        type: "bluetooth",
      },
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
        currStatus: ConnectionStatus.Reconnecting,
        deviceStatus: DeviceConnectionStatus.DISCONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
        type: "bluetooth",
      },
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
        currStatus: ConnectionStatus.Reconnecting,
        deviceStatus: DeviceConnectionStatus.DISCONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
        type: "bluetooth",
      },
      initialHasAttemptedReconnect: true,
      expectedHasAttemptedReconnect: true,
      expectedNextConnectionState: {
        status: ConnectionStatus.FailedToReconnectTwice,
        flowType: ConnectionFlowType.Bluetooth,
      },
    });
  });
});
