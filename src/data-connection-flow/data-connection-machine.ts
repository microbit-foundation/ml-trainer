/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  DataConnectionAction,
  DataConnectionEvent,
  DataConnectionFlowDef,
} from "./data-connection-machine-common";
import { nativeBluetoothFlow } from "./data-connection-machine-native-bluetooth";
import { radioFlow } from "./data-connection-machine-radio";
import { webBluetoothFlow } from "./data-connection-machine-web-bluetooth";
import {
  DataConnectionState,
  DataConnectionStep,
  DataConnectionType,
} from "./data-connection-types";
import { transition } from "../state-machine";

// Re-export types for external consumers
export type {
  DataConnectionAction,
  DataConnectionEvent,
} from "./data-connection-machine-common";

const getFlow = (type: DataConnectionType): DataConnectionFlowDef => {
  switch (type) {
    case DataConnectionType.WebBluetooth:
      return webBluetoothFlow;
    case DataConnectionType.NativeBluetooth:
      return nativeBluetoothFlow;
    case DataConnectionType.Radio:
      return radioFlow;
  }
};

export type DataConnectionTransitionResult = {
  step: DataConnectionStep;
  actions: DataConnectionAction[];
};

export const dataConnectionTransition = (
  state: DataConnectionState,
  event: DataConnectionEvent
): DataConnectionTransitionResult | null => {
  const flow = getFlow(state.type);
  return transition(flow, state.step, event, state);
};
