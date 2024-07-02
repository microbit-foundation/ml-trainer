import { Reducer } from "react";

export enum ConnectionDialogStage {
  Start,
  ConnectCable,
  WebUsbFlashingTutorial,
  ManualFlashingTutorial,
  ConnectBattery,
  EnterBluetoothPattern,
  ConnectBluetooth,

  // Stages that are not user-controlled
  WebUsbChooseMicrobit,
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

  // WebUsbFlashing events
  WebUsbChooseMicrobit,
  FlashingInProgress,
  FlashingComplete,

  // WebUsbFlashing failure events
  TryAgainReplugMicrobit,
  TryAgainCloseTabs,
  TryAgainSelectMicrobit,
  InstructManualFlashing,
  BadFirmware,
  MicrobitUnsupported,
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
      ConnectionDialogStage.ConnectBluetooth,
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

const getRelativeStageAndType = (
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

const getNextStageState = (state: ConnectionDialogState) => {
  return {
    ...state,
    ...getRelativeStageAndType(state, 1),
  };
};

const getPrevStageState = (state: ConnectionDialogState) => {
  return {
    ...state,
    ...getRelativeStageAndType(state, -1),
  };
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
      return getNextStageState(state);
    }
    case ConnectionEvent.Back: {
      return getPrevStageState(state);
    }
    case ConnectionEvent.FlashingComplete:
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
  }
  return state;
};
