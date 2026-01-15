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
import { DownloadStep } from "./download-types";
import {
  DownloadAction,
  DownloadEvent,
  DownloadFlowContext,
  DownloadFlowDefinition,
} from "./download-machine-common";
import { nativeBluetoothFlow } from "./download-machine-native-bluetooth";
import { radioFlow } from "./download-machine-radio";
import { browserDefaultFlow } from "./download-machine-browser-default";

// Re-export types for external consumers
export type {
  DownloadAction,
  DownloadEvent,
  DownloadFlowContext,
} from "./download-machine-common";

export type DownloadFlowType = "browser-default" | "nativeBluetooth" | "radio";

export const getDownloadFlowType = (
  dataConnectionType: DataConnectionType
): DownloadFlowType => {
  if (isNativePlatform()) {
    return "nativeBluetooth";
  }
  const connectionType = dataConnectionTypeToTransport(dataConnectionType);
  return connectionType === "radio" ? "radio" : "browser-default";
};

const getFlow = (flowType: DownloadFlowType): DownloadFlowDefinition => {
  switch (flowType) {
    case "nativeBluetooth":
      return nativeBluetoothFlow;
    case "radio":
      return radioFlow;
    case "browser-default":
      return browserDefaultFlow;
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
