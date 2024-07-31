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
  ConnectionState,
  getNextConnectionState,
} from "./get-next-connection-state";
import { ConnectionStatus as DeviceConnectionStatus } from "@microbit/microbit-connection";
import { ConnectionFlowType } from "./connection-stage-hooks";

type Input = Pick<
  ConnectionState,
  "currConnType" | "currStatus" | "deviceStatus" | "prevDeviceStatus" | "type"
>;
const testGetNextConnectionState = ({
  input,
  initialHasAttemptedReconnect,
  initialHasRadioConnected,
}: {
  input: Input;
  initialHasAttemptedReconnect: boolean;
  initialHasRadioConnected: boolean;
}) => {
  let hasAttempedReconnect = initialHasAttemptedReconnect;
  let hasRadioConnected = initialHasRadioConnected;
  const result = getNextConnectionState({
    ...input,
    hasAttempedReconnect,
    setHasAttemptedReconnect: (val: boolean) => {
      hasAttempedReconnect = val;
    },
    hasRadioConnected,
    setHasRadioConnected: (val: boolean) => {
      hasRadioConnected = val;
    },
  });
  return {
    result,
    hasAttempedReconnect,
    hasRadioConnected,
  };
};

describe("getNextConnectionState for radio connection", () => {
  test("radio usb flashing", () => {
    const { result, hasAttempedReconnect, hasRadioConnected } =
      testGetNextConnectionState({
        input: {
          currConnType: "radio",
          currStatus: ConnectionStatus.NotConnected,
          deviceStatus: DeviceConnectionStatus.CONNECTING,
          prevDeviceStatus: DeviceConnectionStatus.NO_AUTHORIZED_DEVICE,
          type: "usb",
        },
        initialHasAttemptedReconnect: false,
        initialHasRadioConnected: false,
      });
    expect(result).toEqual(undefined);
    expect(hasAttempedReconnect).toEqual(false);
    expect(hasRadioConnected).toEqual(false);
  });
  test("radio connecting", () => {
    const { result, hasAttempedReconnect, hasRadioConnected } =
      testGetNextConnectionState({
        input: {
          currConnType: "radio",
          currStatus: ConnectionStatus.NotConnected,
          deviceStatus: DeviceConnectionStatus.CONNECTING,
          prevDeviceStatus: DeviceConnectionStatus.NO_AUTHORIZED_DEVICE,
          type: "radioRemote",
        },
        initialHasAttemptedReconnect: false,
        initialHasRadioConnected: false,
      });
    expect(result).toEqual({
      status: ConnectionStatus.Connecting,
      flowType: ConnectionFlowType.RadioRemote,
    });
    expect(hasAttempedReconnect).toEqual(false);
    expect(hasRadioConnected).toEqual(false);
  });
  test("radio connected for the first time", () => {
    const { result, hasAttempedReconnect, hasRadioConnected } =
      testGetNextConnectionState({
        input: {
          currConnType: "radio",
          currStatus: ConnectionStatus.NotConnected,
          deviceStatus: DeviceConnectionStatus.CONNECTED,
          prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
          type: "radioRemote",
        },
        initialHasAttemptedReconnect: false,
        initialHasRadioConnected: false,
      });
    expect(result).toEqual({
      status: ConnectionStatus.Connected,
      flowType: ConnectionFlowType.RadioRemote,
    });
    expect(hasAttempedReconnect).toEqual(false);
    expect(hasRadioConnected).toEqual(true);
  });
  test("radio connected subsequent times", () => {
    const { result, hasAttempedReconnect, hasRadioConnected } =
      testGetNextConnectionState({
        input: {
          currConnType: "radio",
          currStatus: ConnectionStatus.Disconnected,
          deviceStatus: DeviceConnectionStatus.CONNECTED,
          prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
          type: "radioRemote",
        },
        initialHasAttemptedReconnect: false,
        initialHasRadioConnected: false,
      });
    expect(result).toEqual({
      status: ConnectionStatus.Connected,
      flowType: ConnectionFlowType.RadioRemote,
    });
    expect(hasAttempedReconnect).toEqual(false);
    expect(hasRadioConnected).toEqual(true);
  });
  test("radio connect fail", () => {
    const { result, hasAttempedReconnect, hasRadioConnected } =
      testGetNextConnectionState({
        input: {
          currConnType: "radio",
          currStatus: ConnectionStatus.Connecting,
          deviceStatus: DeviceConnectionStatus.DISCONNECTED,
          prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
          type: "radioRemote",
        },
        initialHasAttemptedReconnect: false,
        initialHasRadioConnected: false,
      });
    expect(result).toEqual({
      status: ConnectionStatus.FailedToConnect,
      flowType: ConnectionFlowType.RadioRemote,
    });
    expect(hasAttempedReconnect).toEqual(false);
    expect(hasRadioConnected).toEqual(false);
  });
  test("radio reconnecting", () => {
    const { result, hasAttempedReconnect, hasRadioConnected } =
      testGetNextConnectionState({
        input: {
          currConnType: "radio",
          currStatus: ConnectionStatus.Disconnected,
          deviceStatus: DeviceConnectionStatus.CONNECTING,
          prevDeviceStatus: DeviceConnectionStatus.DISCONNECTED,
          type: "radioRemote",
        },
        initialHasAttemptedReconnect: false,
        initialHasRadioConnected: false,
      });
    expect(result).toEqual({
      status: ConnectionStatus.Reconnecting,
      flowType: ConnectionFlowType.RadioRemote,
    });
    expect(hasAttempedReconnect).toEqual(false);
    expect(hasRadioConnected).toEqual(false);
  });
  test("radio bridge device connection lost by unplugging device", () => {
    const { result, hasAttempedReconnect, hasRadioConnected } =
      testGetNextConnectionState({
        input: {
          currConnType: "radio",
          currStatus: ConnectionStatus.Connected,
          deviceStatus: DeviceConnectionStatus.DISCONNECTED,
          prevDeviceStatus: DeviceConnectionStatus.CONNECTED,
          type: "usb",
        },
        initialHasAttemptedReconnect: false,
        initialHasRadioConnected: false,
      });
    expect(result).toEqual({
      status: ConnectionStatus.ConnectionLost,
      flowType: ConnectionFlowType.RadioBridge,
    });
    expect(hasAttempedReconnect).toEqual(true);
    expect(hasRadioConnected).toEqual(false);
  });
  test("radio bridge device reconnect fail", () => {
    const { result, hasAttempedReconnect, hasRadioConnected } =
      testGetNextConnectionState({
        input: {
          currConnType: "radio",
          currStatus: ConnectionStatus.Reconnecting,
          deviceStatus: DeviceConnectionStatus.DISCONNECTED,
          prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
          type: "usb",
        },
        initialHasAttemptedReconnect: false,
        initialHasRadioConnected: false,
      });
    expect(result).toEqual({
      status: ConnectionStatus.FailedToReconnect,
      flowType: ConnectionFlowType.RadioBridge,
    });
    expect(hasAttempedReconnect).toEqual(true);
    expect(hasRadioConnected).toEqual(false);
  });
  test("radio bridge device reconnect fail twice from connection loss", () => {
    const { result, hasAttempedReconnect, hasRadioConnected } =
      testGetNextConnectionState({
        input: {
          currConnType: "radio",
          currStatus: ConnectionStatus.Connected,
          deviceStatus: DeviceConnectionStatus.DISCONNECTED,
          prevDeviceStatus: DeviceConnectionStatus.DISCONNECTED,
          type: "usb",
        },
        initialHasAttemptedReconnect: true,
        initialHasRadioConnected: false,
      });
    expect(result).toEqual({
      status: ConnectionStatus.FailedToReconnectTwice,
      flowType: ConnectionFlowType.RadioBridge,
    });
    expect(hasAttempedReconnect).toEqual(true);
    expect(hasRadioConnected).toEqual(false);
  });
  test("radio remote connection lost by unplugging device", () => {
    const { result, hasAttempedReconnect, hasRadioConnected } =
      testGetNextConnectionState({
        input: {
          currConnType: "radio",
          currStatus: ConnectionStatus.Reconnecting,
          deviceStatus: DeviceConnectionStatus.DISCONNECTED,
          prevDeviceStatus: DeviceConnectionStatus.RECONNECTING,
          type: "radioRemote",
        },
        initialHasAttemptedReconnect: false,
        initialHasRadioConnected: false,
      });
    expect(result).toEqual({
      status: ConnectionStatus.ConnectionLost,
      flowType: ConnectionFlowType.RadioRemote,
    });
    expect(hasAttempedReconnect).toEqual(true);
    expect(hasRadioConnected).toEqual(false);
  });
  test("radio remote reconnect fail", () => {
    const { result, hasAttempedReconnect, hasRadioConnected } =
      testGetNextConnectionState({
        input: {
          currConnType: "radio",
          currStatus: ConnectionStatus.Reconnecting,
          deviceStatus: DeviceConnectionStatus.DISCONNECTED,
          prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
          type: "radioRemote",
        },
        initialHasAttemptedReconnect: false,
        initialHasRadioConnected: false,
      });
    expect(result).toEqual({
      status: ConnectionStatus.FailedToReconnect,
      flowType: ConnectionFlowType.RadioRemote,
    });
    expect(hasAttempedReconnect).toEqual(true);
    expect(hasRadioConnected).toEqual(false);
  });
  test("radio remote reconnect fail twice", () => {
    const { result, hasAttempedReconnect, hasRadioConnected } =
      testGetNextConnectionState({
        input: {
          currConnType: "radio",
          currStatus: ConnectionStatus.Reconnecting,
          deviceStatus: DeviceConnectionStatus.DISCONNECTED,
          prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
          type: "radioRemote",
        },
        initialHasAttemptedReconnect: true,
        initialHasRadioConnected: false,
      });
    expect(result).toEqual({
      status: ConnectionStatus.FailedToReconnectTwice,
      flowType: ConnectionFlowType.RadioRemote,
    });
    expect(hasAttempedReconnect).toEqual(true);
    expect(hasRadioConnected).toEqual(false);
  });
});

const bluetoothReconnectFailInput: Input = {
  currConnType: "bluetooth",
  currStatus: ConnectionStatus.Reconnecting,
  deviceStatus: DeviceConnectionStatus.DISCONNECTED,
  prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
  type: "bluetooth",
};

describe("getNextConnectionState for bluetooth connection", () => {
  test("bluetooth connecting", () => {
    const { result, hasAttempedReconnect, hasRadioConnected } =
      testGetNextConnectionState({
        input: {
          currConnType: "bluetooth",
          currStatus: ConnectionStatus.NotConnected,
          deviceStatus: DeviceConnectionStatus.CONNECTING,
          prevDeviceStatus: DeviceConnectionStatus.NO_AUTHORIZED_DEVICE,
          type: "bluetooth",
        },
        initialHasAttemptedReconnect: false,
        initialHasRadioConnected: false,
      });
    expect(result).toEqual({
      status: ConnectionStatus.Connecting,
      flowType: ConnectionFlowType.Bluetooth,
    });
    expect(hasAttempedReconnect).toEqual(false);
    expect(hasRadioConnected).toEqual(false);
  });
  test("bluetooth connected for the first time", () => {
    const { result, hasAttempedReconnect, hasRadioConnected } =
      testGetNextConnectionState({
        input: {
          currConnType: "bluetooth",
          currStatus: ConnectionStatus.NotConnected,
          deviceStatus: DeviceConnectionStatus.CONNECTED,
          prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
          type: "bluetooth",
        },
        initialHasAttemptedReconnect: false,
        initialHasRadioConnected: false,
      });
    expect(result).toEqual({
      status: ConnectionStatus.Connected,
      flowType: ConnectionFlowType.Bluetooth,
    });
    expect(hasAttempedReconnect).toEqual(false);
    expect(hasRadioConnected).toEqual(false);
  });
  test("bluetooth connected subsequent times", () => {
    const { result, hasAttempedReconnect, hasRadioConnected } =
      testGetNextConnectionState({
        input: {
          currConnType: "bluetooth",
          currStatus: ConnectionStatus.Disconnected,
          deviceStatus: DeviceConnectionStatus.CONNECTED,
          prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
          type: "bluetooth",
        },
        initialHasAttemptedReconnect: false,
        initialHasRadioConnected: false,
      });
    expect(result).toEqual({
      status: ConnectionStatus.Connected,
      flowType: ConnectionFlowType.Bluetooth,
    });
    expect(hasAttempedReconnect).toEqual(false);
    expect(hasRadioConnected).toEqual(false);
  });
  test("bluetooth connect fail", () => {
    const { result, hasAttempedReconnect, hasRadioConnected } =
      testGetNextConnectionState({
        input: {
          currConnType: "bluetooth",
          currStatus: ConnectionStatus.Connecting,
          deviceStatus: DeviceConnectionStatus.DISCONNECTED,
          prevDeviceStatus: DeviceConnectionStatus.CONNECTING,
          type: "bluetooth",
        },
        initialHasAttemptedReconnect: false,
        initialHasRadioConnected: false,
      });
    expect(result).toEqual({
      status: ConnectionStatus.FailedToConnect,
      flowType: ConnectionFlowType.Bluetooth,
    });
    expect(hasAttempedReconnect).toEqual(false);
    expect(hasRadioConnected).toEqual(false);
  });
  test("bluetooth reconnecting", () => {
    const { result, hasAttempedReconnect, hasRadioConnected } =
      testGetNextConnectionState({
        input: {
          currConnType: "bluetooth",
          currStatus: ConnectionStatus.Disconnected,
          deviceStatus: DeviceConnectionStatus.CONNECTING,
          prevDeviceStatus: DeviceConnectionStatus.DISCONNECTED,
          type: "bluetooth",
        },
        initialHasAttemptedReconnect: false,
        initialHasRadioConnected: false,
      });
    expect(result).toEqual({
      status: ConnectionStatus.Reconnecting,
      flowType: ConnectionFlowType.Bluetooth,
    });
    expect(hasAttempedReconnect).toEqual(false);
    expect(hasRadioConnected).toEqual(false);
  });
  test("bluetooth connection lost by unplugging device", () => {
    const { result, hasAttempedReconnect, hasRadioConnected } =
      testGetNextConnectionState({
        input: {
          currConnType: "bluetooth",
          currStatus: ConnectionStatus.Connected,
          deviceStatus: DeviceConnectionStatus.DISCONNECTED,
          prevDeviceStatus: DeviceConnectionStatus.RECONNECTING,
          type: "bluetooth",
        },
        initialHasAttemptedReconnect: false,
        initialHasRadioConnected: false,
      });
    expect(result).toEqual({
      status: ConnectionStatus.ConnectionLost,
      flowType: ConnectionFlowType.Bluetooth,
    });
    expect(hasAttempedReconnect).toEqual(true);
    expect(hasRadioConnected).toEqual(false);
  });
  test("bluetooth reconnect fail", () => {
    const { result, hasAttempedReconnect, hasRadioConnected } =
      testGetNextConnectionState({
        input: bluetoothReconnectFailInput,
        initialHasAttemptedReconnect: false,
        initialHasRadioConnected: false,
      });
    expect(result).toEqual({
      status: ConnectionStatus.FailedToReconnect,
      flowType: ConnectionFlowType.Bluetooth,
    });
    expect(hasAttempedReconnect).toEqual(true);
    expect(hasRadioConnected).toEqual(false);
  });
  test("bluetooth reconnect fail twice", () => {
    const { result, hasAttempedReconnect, hasRadioConnected } =
      testGetNextConnectionState({
        input: bluetoothReconnectFailInput,
        initialHasAttemptedReconnect: true,
        initialHasRadioConnected: false,
      });
    expect(result).toEqual({
      status: ConnectionStatus.FailedToReconnectTwice,
      flowType: ConnectionFlowType.Bluetooth,
    });
    expect(hasAttempedReconnect).toEqual(true);
    expect(hasRadioConnected).toEqual(false);
  });
});
