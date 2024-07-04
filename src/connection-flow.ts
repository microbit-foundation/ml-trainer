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
  GoToBluetoothStart,

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

export const connectionDialogReducer: Reducer<ConnState, ConnEvent> = (
  state,
  event
) => {
  switch (event) {
    case ConnEvent.Switch: {
      return {
        ...state,
        type:
          state.type === ConnectionType.Bluetooth
            ? ConnectionType.RadioRemote
            : ConnectionType.Bluetooth,
      };
    }
    case ConnEvent.GoToBluetoothStart: {
      return {
        ...state,
        stage: ConnStage.Start,
        type: ConnectionType.Bluetooth,
      };
    }
    case ConnEvent.Next: {
      return { ...state, ...getNextStageAndType(state, 1) };
    }
    case ConnEvent.Back: {
      return { ...state, ...getNextStageAndType(state, -1) };
    }
    case ConnEvent.FlashingComplete: {
      return {
        ...state,
        stage:
          state.type === ConnectionType.RadioRemote
            ? ConnStage.ConnectBattery
            : ConnStage.ConnectingMicrobits,
      };
    }
    case ConnEvent.TryAgain: {
      return {
        ...state,
        stage:
          state.stage === ConnStage.TryAgainBluetoothConnect
            ? ConnStage.ConnectBluetoothTutorial
            : ConnStage.ConnectCable,
      };
    }
  }
  if (eventToNewStage[event]) {
    return { ...state, stage: eventToNewStage[event] };
  }
  return state;
};

const eventToNewStage: Record<number, ConnStage> = {
  [ConnEvent.SkipFlashing]: ConnStage.ConnectBattery,
  [ConnEvent.FlashingInProgress]: ConnStage.FlashingInProgress,
  [ConnEvent.InstructManualFlashing]: ConnStage.ManualFlashingTutorial,
  [ConnEvent.WebUsbChooseMicrobit]: ConnStage.WebUsbChooseMicrobit,
  [ConnEvent.ConnectingBluetooth]: ConnStage.ConnectingBluetooth,
  [ConnEvent.ConnectingMicrobits]: ConnStage.ConnectingMicrobits,
};

const getStageAndTypeOrder = (state: ConnState): StageAndType[] => {
  const { RadioRemote, RadioBridge, Bluetooth } = ConnectionType;
  if (state.type === ConnectionType.Bluetooth) {
    return [
      { stage: ConnStage.Start, type: Bluetooth },
      { stage: ConnStage.ConnectCable, type: Bluetooth },
      // Only bluetooth mode has this fallback, the radio bridge mode requires working WebUSB.
      !state.isUsbSupported || state.stage === ConnStage.ManualFlashingTutorial
        ? { stage: ConnStage.ManualFlashingTutorial, type: Bluetooth }
        : { stage: ConnStage.WebUsbFlashingTutorial, type: Bluetooth },
      { stage: ConnStage.ConnectBattery, type: Bluetooth },
      { stage: ConnStage.EnterBluetoothPattern, type: Bluetooth },
      { stage: ConnStage.ConnectBluetoothTutorial, type: Bluetooth },
    ];
  }
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
