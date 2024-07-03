import { Reducer } from "react";

export enum ConnStage {
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

  // Failure stages
  TryAgainReplugMicrobit,
  TryAgainCloseTabs,
  TryAgainSelectMicrobit,
  TryAgainBluetoothConnect,
  BadFirmware,
  MicrobitUnsupported,
}

export enum ConnectionType {
  Bluetooth,
  RadioBridge,
  RadioRemote,
}

export type ConnState = {
  stage: ConnStage;
  type: ConnectionType;
  isUsbSupported: boolean;
};

export enum ConnEvent {
  // User triggered events
  Switch,
  Next,
  Back,
  SkipFlashing,
  TryAgain,

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

type StageAndType = Pick<ConnState, "stage" | "type">;

const getStageAndTypeOrder = (state: ConnState): StageAndType[] => {
  if (state.type === ConnectionType.Bluetooth) {
    // Only bluetooth mode has this fallback, the radio bridge mode requires working WebUSB.
    const flashingTutorialStage =
      !state.isUsbSupported || state.stage === ConnStage.ManualFlashingTutorial
        ? ConnStage.ManualFlashingTutorial
        : ConnStage.WebUsbFlashingTutorial;

    return [
      ConnStage.Start,
      ConnStage.ConnectCable,
      flashingTutorialStage,
      ConnStage.ConnectBattery,
      ConnStage.EnterBluetoothPattern,
      ConnStage.ConnectBluetoothTutorial,
    ].map((stage) => ({ stage, type: state.type }));
  }
  // Radio
  const { RadioRemote, RadioBridge } = ConnectionType;
  return [
    { stage: ConnStage.Start, type: RadioRemote },
    { stage: ConnStage.ConnectCable, type: RadioRemote },
    { stage: ConnStage.WebUsbFlashingTutorial, type: RadioRemote },
    { stage: ConnStage.ConnectBattery, type: RadioRemote },
    { stage: ConnStage.ConnectCable, type: RadioBridge },
    { stage: ConnStage.WebUsbFlashingTutorial, type: RadioBridge },
  ];
};

const getItemIdx = (item: object, arr: object[]) => {
  return arr.map((a) => JSON.stringify(a)).indexOf(JSON.stringify(item));
};

const getNextStageAndType = (state: ConnState, step: number): StageAndType => {
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

export const connectionDialogReducer: Reducer<ConnState, ConnEvent> = (
  state,
  event
) => {
  const isBluetooth = state.type === ConnectionType.Bluetooth;
  if (event === ConnEvent.Switch) {
    return {
      ...state,
      type: isBluetooth ? ConnectionType.RadioRemote : ConnectionType.Bluetooth,
    };
  }
  if (event === ConnEvent.Next) {
    return { ...state, ...getNextStageAndType(state, 1) };
  }
  if (event === ConnEvent.Back) {
    return { ...state, ...getNextStageAndType(state, -1) };
  }
  if (event === ConnEvent.FlashingComplete) {
    if (state.type === ConnectionType.RadioRemote) {
      return { ...state, stage: ConnStage.ConnectBattery };
    }
    return { ...state, stage: ConnStage.ConnectingMicrobits };
  }
  if (event === ConnEvent.TryAgain) {
    if (state.stage === ConnStage.TryAgainBluetoothConnect) {
      return { ...state, stage: ConnStage.ConnectBluetoothTutorial };
    }
    return { ...state, stage: ConnStage.ConnectCable };
  }
  const eventToNewStage: Record<number, ConnStage> = {
    [ConnEvent.SkipFlashing]: ConnStage.ConnectBattery,
    [ConnEvent.FlashingInProgress]: ConnStage.FlashingInProgress,
    [ConnEvent.InstructManualFlashing]: ConnStage.ManualFlashingTutorial,
    [ConnEvent.WebUsbChooseMicrobit]: ConnStage.WebUsbChooseMicrobit,
    [ConnEvent.ConnectingBluetooth]: ConnStage.ConnectingBluetooth,
    [ConnEvent.ConnectingMicrobits]: ConnStage.ConnectingMicrobits,
  };
  if (eventToNewStage[event]) {
    return { ...state, stage: eventToNewStage[event] };
  }
  return state;
};
