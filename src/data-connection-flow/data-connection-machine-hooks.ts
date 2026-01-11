/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useFireDataConnectionEvent } from "./data-connection-internal-hooks";
import { DataConnectionEvent } from "./data-connection-machine";
import { useStore } from "../store";
import { canTransition } from "./data-connection-actions";
import { useMemo } from "react";

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
  fireDeviceEvent: (event: DataConnectionEvent) => void;
}

/**
 * Hook providing UI actions for the connection flow.
 * These actions fire events into the state machine.
 */
export const useDataConnectionActions = (): DataConnectionActions => {
  const fireEvent = useFireDataConnectionEvent();

  return useMemo((): DataConnectionActions => {
    return {
      connect: () => {
        fireEvent({ type: "connect" });
      },
      close: () => fireEvent({ type: "close" }),
      onNextClick: () => fireEvent({ type: "next" }),
      onBackClick: () => fireEvent({ type: "back" }),
      onTryAgain: () => fireEvent({ type: "tryAgain" }),
      switchFlowType: () => fireEvent({ type: "switchFlowType" }),
      canSwitchFlowType: () =>
        canTransition(
          { type: "switchFlowType" },
          useStore.getState().dataConnection
        ),
      onSkip: () => fireEvent({ type: "skip" }),
      onStartBluetoothFlow: () => fireEvent({ type: "startBluetoothFlow" }),
      onChangeMicrobitName: (name: string) =>
        fireEvent({ type: "setMicrobitName", name }),
      disconnect: () => fireEvent({ type: "disconnect" }),
      fireDeviceEvent: (event: DataConnectionEvent) => fireEvent(event),
    };
  }, [fireEvent]);
};
