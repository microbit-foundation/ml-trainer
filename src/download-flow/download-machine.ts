/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  DataConnectionType,
  dataConnectionTypeToTransport,
} from "../data-connection-flow";
import { isNativePlatform } from "../platform";
import { transition, TransitionResult } from "../state-machine";
import { DownloadStep } from "../model";
import {
  DownloadAction,
  DownloadEvent,
  DownloadFlowContext,
  DownloadFlowDefinition,
} from "./download-machine-common";
import { nativeBluetoothFlow } from "./download-machine-native-bluetooth";
import { radioFlow } from "./download-machine-radio";
import { webusbFlow } from "./download-machine-webusb";

// Re-export types for external consumers
export type {
  DownloadAction,
  DownloadEvent,
  DownloadFlowContext,
} from "./download-machine-common";

export type DownloadFlowType = "webusb" | "nativeBluetooth" | "radio";

export const getDownloadFlowType = (
  dataConnectionType: DataConnectionType
): DownloadFlowType => {
  if (isNativePlatform()) {
    return "nativeBluetooth";
  }
  const connectionType = dataConnectionTypeToTransport(dataConnectionType);
  return connectionType === "radio" ? "radio" : "webusb";
};

const getFlow = (flowType: DownloadFlowType): DownloadFlowDefinition => {
  switch (flowType) {
    case "nativeBluetooth":
      return nativeBluetoothFlow;
    case "radio":
      return radioFlow;
    case "webusb":
      return webusbFlow;
  }
};

export type DownloadTransitionResult = TransitionResult<
  DownloadStep,
  DownloadAction
>;

export const downloadTransition = (
  flowType: DownloadFlowType,
  currentStep: DownloadStep,
  event: DownloadEvent,
  context: DownloadFlowContext
): DownloadTransitionResult | null => {
  return transition(getFlow(flowType), currentStep, event, context);
};
