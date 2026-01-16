/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useDataConnectionMachine } from "./data-connection-internal-hooks";
import { useStore } from "../store";
import { canTransition } from "./data-connection-actions";
import { useCallback, useMemo } from "react";
import { DataConnectionStep } from "./data-connection-types";
import { BleClient } from "@capacitor-community/bluetooth-le";
import { isAndroid } from "../platform";

/**
 * UI actions for the connection flow.
 * These fire events into the state machine.
 */
export interface DataConnectionActions {
  connect: () => void;
  close: () => void;
  onNextClick: () => void;
  onBackClick: () => void;
  onTryAgain: () => void;
  switchFlowType: () => void;
  canSwitchFlowType: () => boolean;
  onSkip: () => void;
  onStartBluetoothFlow: () => void;
  onChangeMicrobitName: (name: string) => void;
  disconnect: () => void;
  /**
   * Opens app settings. Use when permissions have been declined.
   */
  openAppSettings: () => void;
  /**
   * Opens location settings. Only available on Android.
   * Only needed on older Android (< API 31) where location is required for BLE.
   */
  openLocationSettings?: () => void;
  /**
   * Switches between pairing method variants (triple-reset ↔ a-b-reset).
   */
  switchPairingMethod: () => void;
}

/**
 * Hook providing UI actions for the connection flow.
 * These actions fire events into the state machine.
 */
export const useDataConnectionActions = (): DataConnectionActions => {
  const dataConnectionMachine = useDataConnectionMachine();

  const openAppSettings = useCallback(() => {
    BleClient.openAppSettings().catch(() => {});
  }, []);

  const openLocationSettings = useCallback(() => {
    BleClient.openLocationSettings().catch(() => {});
  }, []);

  const android = isAndroid();

  return useMemo((): DataConnectionActions => {
    return {
      connect: () => {
        dataConnectionMachine.fireEvent({ type: "connect" });
      },
      close: () => dataConnectionMachine.fireEvent({ type: "close" }),
      onNextClick: () => dataConnectionMachine.fireEvent({ type: "next" }),
      onBackClick: () => dataConnectionMachine.fireEvent({ type: "back" }),
      onTryAgain: () => dataConnectionMachine.fireEvent({ type: "tryAgain" }),
      switchFlowType: () =>
        dataConnectionMachine.fireEvent({ type: "switchFlowType" }),
      canSwitchFlowType: () =>
        canTransition(
          { type: "switchFlowType" },
          useStore.getState().dataConnection
        ),
      onSkip: () => dataConnectionMachine.fireEvent({ type: "skip" }),
      onStartBluetoothFlow: () =>
        dataConnectionMachine.fireEvent({ type: "startBluetoothFlow" }),
      onChangeMicrobitName: (name: string) =>
        dataConnectionMachine.fireEvent({ type: "setMicrobitName", name }),
      disconnect: () => dataConnectionMachine.fireEvent({ type: "disconnect" }),
      openAppSettings,
      openLocationSettings: android ? openLocationSettings : undefined,
      switchPairingMethod: () =>
        dataConnectionMachine.fireEvent({ type: "switchPairingMethod" }),
    };
  }, [dataConnectionMachine, openAppSettings, openLocationSettings, android]);
};

/**
 * Hook that returns true when a data collection micro:bit is connected.
 */
export const useDataConnected = (): boolean =>
  useStore((s) => s.dataConnection.step === DataConnectionStep.Connected);
