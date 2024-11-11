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
  isBrowserTabVisible,
}: {
  input: Input;
  initialHasAttemptedReconnect: boolean;
  expectedNextConnectionState: NextConnectionState | undefined;
  expectedHasAttemptedReconnect: boolean;
  initialOnFirstConnectAttempt: boolean;
  expectedOnFirstConnectAttempt: boolean;
  isBrowserTabVisible?: boolean;
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
    isBrowserTabVisible: isBrowserTabVisible ?? true,
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
        flowType: ConnectionFlowType.ConnectRadioRemote,
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
        flowType: ConnectionFlowType.ConnectRadioRemote,
      },
    });
  });
  test("radio connected subsequent times", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "radio",
        currStatus: ConnectionStatus.Connecting,
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
        flowType: ConnectionFlowType.ConnectRadioRemote,
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
      expectedNextConnectionState: undefined,
    });
  });
  test("radio disconnected from downloading MakeCodeProgram", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "radio",
        currStatus: ConnectionStatus.NotConnected,
        deviceStatus: DeviceConnectionStatus.DISCONNECTED,
        prevDeviceStatus: DeviceConnectionStatus.CONNECTED,
        type: "usb",
      },
      initialOnFirstConnectAttempt: false,
      expectedOnFirstConnectAttempt: false,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: undefined,
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
        flowType: ConnectionFlowType.ConnectRadioRemote,
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
      expectedNextConnectionState: undefined,
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
        flowType: ConnectionFlowType.ConnectRadioRemote,
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
        flowType: ConnectionFlowType.ConnectRadioBridge,
      },
    });
  });
  test("radio bridge device showing reconnecting automatically because tab is no longer visible", () => {
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
      isBrowserTabVisible: false,
      expectedHasAttemptedReconnect: true,
      expectedNextConnectionState: {
        status: ConnectionStatus.ReconnectingAutomatically,
        flowType: ConnectionFlowType.ConnectRadioBridge,
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
        flowType: ConnectionFlowType.ConnectRadioBridge,
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
        flowType: ConnectionFlowType.ConnectRadioRemote,
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
        flowType: ConnectionFlowType.ConnectRadioRemote,
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
        flowType: ConnectionFlowType.ConnectRadioRemote,
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
        flowType: ConnectionFlowType.ConnectRadioRemote,
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
        flowType: ConnectionFlowType.ConnectBluetooth,
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
        flowType: ConnectionFlowType.ConnectBluetooth,
      },
    });
  });
  test("bluetooth connected subsequent times", () => {
    testGetNextConnectionState({
      input: {
        currConnType: "bluetooth",
        currStatus: ConnectionStatus.Connecting,
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
        flowType: ConnectionFlowType.ConnectBluetooth,
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
      expectedNextConnectionState: undefined,
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
      expectedOnFirstConnectAttempt: true,
      initialHasAttemptedReconnect: false,
      expectedHasAttemptedReconnect: false,
      expectedNextConnectionState: {
        status: ConnectionStatus.FailedToSelectBluetoothDevice,
        flowType: ConnectionFlowType.ConnectBluetooth,
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
        flowType: ConnectionFlowType.ConnectBluetooth,
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
      expectedNextConnectionState: undefined,
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
        flowType: ConnectionFlowType.ConnectBluetooth,
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
        flowType: ConnectionFlowType.ConnectBluetooth,
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
        flowType: ConnectionFlowType.ConnectBluetooth,
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
        flowType: ConnectionFlowType.ConnectBluetooth,
      },
    });
  });
});
