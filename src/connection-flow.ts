import { Reducer } from "react";

export enum ConnectionDialogStage {
  Start,
  ConnectCable,
  WebUsbFlashingTutorial,
  ManualFlashingTutorial,
  ConnectBattery,
  EnterBluetoothPattern,
  ConnectBluetoothTutorial,

  // Stages that are not user-controlled
  WebUsbChooseMicrobit,
  ConnectingBluetooth,
  ConnectingMicrobits,
  FlashingInProgress,
}

export enum ConnectionType {
  Bluetooth,
  RadioBridge,
  RadioRemote,
}

export type ConnectionDialogState = {
  stage: ConnectionDialogStage;
  type: ConnectionType;
  isUsbSupported: boolean;
};

export enum ConnectionEvent {
  // User triggered events
  Switch,
  Next,
  Back,
  SkipFlashing,

  // Web USB Flashing events
  WebUsbChooseMicrobit,
  FlashingInProgress,
  FlashingComplete,

  // Web USB Flashing failure events
  TryAgainReplugMicrobit,
  TryAgainCloseTabs,
  TryAgainSelectMicrobit,
  InstructManualFlashing,
  BadFirmware,
  MicrobitUnsupported,

  // Bluetooth connection event
  ConnectingBluetooth,

  // Bluetooth connection failure event
  TryAgainBluetoothConnect,

  // Connecting microbits for radio connection
  ConnectingMicrobits,
}

type StageAndType = Pick<ConnectionDialogState, "stage" | "type">;

const getStageAndTypeOrder = (state: ConnectionDialogState): StageAndType[] => {
  if (state.type === ConnectionType.Bluetooth) {
    // Bluetooth
    const flashingTutorialStage =
      !state.isUsbSupported ||
      state.stage === ConnectionDialogStage.ManualFlashingTutorial
        ? ConnectionDialogStage.ManualFlashingTutorial
        : ConnectionDialogStage.WebUsbFlashingTutorial;

    return [
      ConnectionDialogStage.Start,
      ConnectionDialogStage.ConnectCable,
      flashingTutorialStage,
      ConnectionDialogStage.ConnectBattery,
      ConnectionDialogStage.EnterBluetoothPattern,
      ConnectionDialogStage.ConnectBluetoothTutorial,
    ].map((stage) => ({ stage, type: state.type }));
  }
  // Radio
  const { RadioRemote, RadioBridge } = ConnectionType;
  return [
    { stage: ConnectionDialogStage.Start, type: RadioRemote },
    { stage: ConnectionDialogStage.ConnectCable, type: RadioRemote },
    { stage: ConnectionDialogStage.WebUsbFlashingTutorial, type: RadioRemote },
    { stage: ConnectionDialogStage.ConnectBattery, type: RadioRemote },
    { stage: ConnectionDialogStage.ConnectCable, type: RadioBridge },
    { stage: ConnectionDialogStage.WebUsbFlashingTutorial, type: RadioBridge },
  ];
};

const getItemIdx = (item: object, arr: object[]) => {
  return arr.map((a) => JSON.stringify(a)).indexOf(JSON.stringify(item));
};

const getNextStageAndType = (
  state: ConnectionDialogState,
  step: number
): StageAndType => {
  const order = getStageAndTypeOrder(state);
  const curr = { stage: state.stage, type: state.type };
  const currIdx = getItemIdx(curr, order);
  const newIdx = currIdx + step;
  // If impossible step stage, stick to current step
  if (newIdx === order.length || newIdx < 0) {
    return curr;
  }
  return order[newIdx];
};

export const connectionDialogReducer: Reducer<
  ConnectionDialogState,
  ConnectionEvent
> = (state, event) => {
  const isBluetooth = state.type === ConnectionType.Bluetooth;
  switch (event) {
    case ConnectionEvent.Switch: {
      return {
        ...state,
        type: isBluetooth
          ? ConnectionType.RadioRemote
          : ConnectionType.Bluetooth,
      };
    }
    case ConnectionEvent.Next: {
      return { ...state, ...getNextStageAndType(state, 1) };
    }
    case ConnectionEvent.Back: {
      return { ...state, ...getNextStageAndType(state, -1) };
    }
    case ConnectionEvent.FlashingComplete: {
      if (state.type === ConnectionType.RadioRemote) {
        return { ...state, stage: ConnectionDialogStage.ConnectBattery };
      }
      return { ...state, stage: ConnectionDialogStage.ConnectingMicrobits };
    }
    case ConnectionEvent.SkipFlashing: {
      return { ...state, stage: ConnectionDialogStage.ConnectBattery };
    }
    case ConnectionEvent.FlashingInProgress: {
      return { ...state, stage: ConnectionDialogStage.FlashingInProgress };
    }
    case ConnectionEvent.InstructManualFlashing: {
      return { ...state, stage: ConnectionDialogStage.ManualFlashingTutorial };
    }
    case ConnectionEvent.WebUsbChooseMicrobit: {
      return { ...state, stage: ConnectionDialogStage.WebUsbChooseMicrobit };
    }
    case ConnectionEvent.ConnectingBluetooth: {
      return { ...state, stage: ConnectionDialogStage.ConnectingBluetooth };
    }
    case ConnectionEvent.ConnectingMicrobits: {
      return { ...state, stage: ConnectionDialogStage.ConnectingMicrobits };
    }
  }
  return state;
};
