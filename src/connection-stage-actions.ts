import {
  BluetoothConnectResult,
  ConnectActions,
  ConnectAndFlashResult,
} from "./connect-actions";
import {
  ConnEvent,
  ConnectionFlowStep,
  ConnectionFlowType,
  ConnectionStage,
} from "./connection-stage-hooks";

type Stage = Pick<ConnectionStage, "step" | "type">;

export class ConnectionStageActions {
  constructor(
    private actions: ConnectActions,
    private stage: ConnectionStage,
    private setStage: (stage: ConnectionStage) => void
  ) {}

  start = () => {
    this.dispatchEvent(ConnEvent.Start);
  };

  dispatchEvent = (event: ConnEvent) => {
    this.setStage(getUpdatedConnState(this.stage, event));
  };

  connectAndflashMicrobit = async (
    progressCallback: (progress: number) => void
  ) => {
    this.dispatchEvent(ConnEvent.WebUsbChooseMicrobit);
    const result = await this.actions.requestUSBConnectionAndFlash(
      this.stage.type,
      progressCallback
    );
    if (
      this.stage.type === ConnectionFlowType.Bluetooth &&
      result !== ConnectAndFlashResult.Success
    ) {
      return this.dispatchEvent(ConnEvent.InstructManualFlashing);
    }
    switch (result) {
      case ConnectAndFlashResult.ErrorMicrobitUnsupported:
        return this.dispatchEvent(ConnEvent.MicrobitUnsupported);
      case ConnectAndFlashResult.ErrorBadFirmware:
        return this.dispatchEvent(ConnEvent.BadFirmware);
      case ConnectAndFlashResult.ErrorNoDeviceSelected:
        return this.dispatchEvent(ConnEvent.TryAgainSelectMicrobit);
      case ConnectAndFlashResult.ErrorUnableToClaimInterface:
        return this.dispatchEvent(ConnEvent.TryAgainCloseTabs);
      case ConnectAndFlashResult.Failed:
        return this.dispatchEvent(ConnEvent.TryAgainReplugMicrobit);
      case ConnectAndFlashResult.Success:
        this.dispatchEvent(ConnEvent.FlashingComplete);
        break;
    }
    // TODO: not sure if connecting microbits should be triggered here
    if (this.stage.type === ConnectionFlowType.RadioBridge) {
      await this.actions.connectMicrobitsSerial();
    }
  };

  connectBluetooth = async (onSuccess: () => void) => {
    this.dispatchEvent(ConnEvent.ConnectingBluetooth);
    const result = await this.actions.connectBluetooth();
    if (result === BluetoothConnectResult.Success) {
      onSuccess();
    } else {
      this.dispatchEvent(ConnEvent.TryAgainBluetoothConnect);
    }
  };

  disconnect = () => this.actions.disconnect();

  getDeviceId = () => {
    return this.actions.device?.getDeviceId();
  };
}

export const getUpdatedConnState = (
  state: ConnectionStage,
  event: ConnEvent
): ConnectionStage => {
  switch (event) {
    case ConnEvent.Start:
      return {
        ...state,
        step:
          !state.isWebBluetoothSupported && !state.isWebUsbSupported
            ? ConnectionFlowStep.WebUsbBluetoothUnsupported
            : ConnectionFlowStep.Start,
      };
    case ConnEvent.Close:
      return { ...state, step: ConnectionFlowStep.None };
    case ConnEvent.SkipFlashing:
      return { ...state, step: ConnectionFlowStep.ConnectBattery };
    case ConnEvent.FlashingInProgress:
      return { ...state, step: ConnectionFlowStep.FlashingInProgress };
    case ConnEvent.InstructManualFlashing:
      return { ...state, step: ConnectionFlowStep.ManualFlashingTutorial };
    case ConnEvent.WebUsbChooseMicrobit:
      return { ...state, step: ConnectionFlowStep.WebUsbChooseMicrobit };
    case ConnEvent.ConnectingBluetooth:
      return { ...state, step: ConnectionFlowStep.ConnectingBluetooth };
    case ConnEvent.ConnectingMicrobits:
      return { ...state, step: ConnectionFlowStep.ConnectingMicrobits };
    case ConnEvent.Next:
      return { ...state, ...getNextStage(state, 1) };
    case ConnEvent.Back:
      return { ...state, ...getNextStage(state, -1) };
    case ConnEvent.Switch:
      return {
        ...state,
        type:
          state.type === ConnectionFlowType.Bluetooth
            ? ConnectionFlowType.RadioRemote
            : ConnectionFlowType.Bluetooth,
      };
    case ConnEvent.GoToBluetoothStart:
      return {
        ...state,
        step: ConnectionFlowStep.Start,
        type: ConnectionFlowType.Bluetooth,
      };
    case ConnEvent.FlashingComplete:
      return {
        ...state,
        step:
          state.type === ConnectionFlowType.RadioRemote
            ? ConnectionFlowStep.ConnectingMicrobits
            : ConnectionFlowStep.ConnectBattery,
      };
    case ConnEvent.TryAgain:
      return {
        ...state,
        step:
          state.step === ConnectionFlowStep.TryAgainBluetoothConnect
            ? ConnectionFlowStep.ConnectBluetoothTutorial
            : ConnectionFlowStep.ConnectCable,
      };
    default:
      return state;
  }
};

const getStagesOrder = (state: ConnectionStage): Stage[] => {
  const { RadioRemote, RadioBridge, Bluetooth } = ConnectionFlowType;
  if (state.type === ConnectionFlowType.Bluetooth) {
    return [
      { step: ConnectionFlowStep.Start, type: Bluetooth },
      { step: ConnectionFlowStep.ConnectCable, type: Bluetooth },
      // Only bluetooth mode has this fallback, the radio bridge mode requires working WebUSB.
      !state.isWebUsbSupported ||
      state.step === ConnectionFlowStep.ManualFlashingTutorial
        ? { step: ConnectionFlowStep.ManualFlashingTutorial, type: Bluetooth }
        : { step: ConnectionFlowStep.WebUsbFlashingTutorial, type: Bluetooth },
      { step: ConnectionFlowStep.ConnectBattery, type: Bluetooth },
      { step: ConnectionFlowStep.EnterBluetoothPattern, type: Bluetooth },
      { step: ConnectionFlowStep.ConnectBluetoothTutorial, type: Bluetooth },
    ];
  }
  return [
    { step: ConnectionFlowStep.Start, type: RadioRemote },
    { step: ConnectionFlowStep.ConnectCable, type: RadioRemote },
    { step: ConnectionFlowStep.WebUsbFlashingTutorial, type: RadioRemote },
    { step: ConnectionFlowStep.ConnectBattery, type: RadioRemote },
    { step: ConnectionFlowStep.ConnectCable, type: RadioBridge },
    { step: ConnectionFlowStep.WebUsbFlashingTutorial, type: RadioBridge },
  ];
};

const getStageAndTypeIdx = ({ step, type }: Stage, order: Stage[]) => {
  for (let idx = 0; idx < order.length; idx++) {
    const currStage = order[idx];
    if (currStage.step === step && currStage.type === type) {
      return idx;
    }
  }
  throw new Error("Should be able to match stage and type again order");
};

const getNextStage = (stage: ConnectionStage, step: number): Stage => {
  const order = getStagesOrder(stage);
  const curr = { step: stage.step, type: stage.type };
  const currIdx = getStageAndTypeIdx(curr, order);
  const newIdx = currIdx + step;
  // If impossible step stage, stick to current step
  if (newIdx === order.length || newIdx < 0) {
    return curr;
  }
  return order[newIdx];
};
