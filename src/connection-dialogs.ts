import { Reducer } from "react";

export enum ConnectionDialogStage {
  Start,
  ConnectCable,
  WebUsbFlashingTutorial,
  ManualFlashingTutorial,
  UsbDownloading, //TODO
  ConnectBattery,
  ConnectingMicrobits,
  EnterBluetoothPattern,
  ConnectBluetooth,
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

export enum ConnectionDialogEvent {
  Switch,
  Next,
  Back,
  SkipFlashing,
  InstructManualFlashing,
}

type StageAndType = Pick<ConnectionDialogState, "stage" | "type">;

const getStageAndTypeOrder = (state: ConnectionDialogState): StageAndType[] => {
  if (state.type === ConnectionType.Bluetooth) {
    // Bluetooth
    const flashingTutorialStage = state.isUsbSupported
      ? ConnectionDialogStage.WebUsbFlashingTutorial
      : ConnectionDialogStage.ManualFlashingTutorial;

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
    { stage: ConnectionDialogStage.ConnectingMicrobits, type: RadioBridge },
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
  ConnectionDialogEvent
> = (state, event) => {
  const isBluetooth = state.type === ConnectionType.Bluetooth;
  if (event === ConnectionDialogEvent.Switch) {
    return {
      ...state,
      type: isBluetooth ? ConnectionType.RadioRemote : ConnectionType.Bluetooth,
    };
  }
  if (event === ConnectionDialogEvent.Next) {
    return getNextStageState(state);
  }
  if (event === ConnectionDialogEvent.Back) {
    return getPrevStageState(state);
  }
  if (event === ConnectionDialogEvent.SkipFlashing) {
    return { ...state, stage: ConnectionDialogStage.ConnectBattery };
  }
  return state;
};
