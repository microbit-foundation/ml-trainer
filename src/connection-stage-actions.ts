import { deviceIdToMicrobitName } from "./bt-pattern-utils";
import {
  ConnectActions,
  ConnectAndFlashFailResult,
  ConnectAndFlashResult,
  ConnectResult,
} from "./connect-actions";
import {
  ConnEvent,
  ConnectionFlowStep,
  ConnectionFlowType,
  ConnectionStage,
  ConnectionStatus,
  ConnectionType,
} from "./connection-stage-hooks";

type FlowStage = Pick<ConnectionStage, "flowStep" | "flowType">;

export class ConnectionStageActions {
  constructor(
    private actions: ConnectActions,
    private stage: ConnectionStage,
    private setStage: (stage: ConnectionStage) => void
  ) {}

  start = () => this.dispatchEvent(ConnEvent.Start);

  dispatchEvent = (event: ConnEvent) => {
    this.setStage(getUpdatedConnStage(this.stage, event));
  };

  connectAndflashMicrobit = async (
    progressCallback: (progress: number) => void,
    onSuccess: (stage: ConnectionStage) => void
  ) => {
    this.dispatchEvent(ConnEvent.WebUsbChooseMicrobit);
    const { result, deviceId } =
      await this.actions.requestUSBConnectionAndFlash(
        this.stage.flowType,
        progressCallback
      );
    if (result !== ConnectAndFlashResult.Success) {
      return this.handleConnectAndFlashFail(result);
    }
    // Store radio/bluetooth details. Radio is essential to pass to micro:bit 2.
    // Bluetooth saves the user from entering the pattern.
    const newStage = this.storeDetectedDetails(deviceId);
    onSuccess(newStage);

    if (this.stage.flowType === ConnectionFlowType.RadioBridge) {
      return await this.connectMicrobits();
    }
    return this.dispatchEvent(ConnEvent.ConnectBattery);
  };

  private storeDetectedDetails = (deviceId: number): ConnectionStage => {
    const existingDeviceIds = this.stage.detectedDeviceIds;
    const existingNames = this.stage.microbitNames;
    const name = deviceIdToMicrobitName(deviceId);
    const newStage = {
      ...this.stage,
      // Only store two device ids and names at any given time as only
      // a maximum of two device infos are needed for radio connection
      ...(existingDeviceIds.length === 2
        ? { detectedDeviceIds: [deviceId], microbitNames: [name] }
        : {
            detectedDeviceIds: [...existingDeviceIds, deviceId],
            microbitNames: [...existingNames, name],
          }),
    };
    this.setStage(newStage);
    return newStage;
  };

  private handleConnectAndFlashFail = (result: ConnectAndFlashFailResult) => {
    if (this.stage.flowType === ConnectionFlowType.Bluetooth) {
      return this.dispatchEvent(ConnEvent.InstructManualFlashing);
    }
    // TODO: Not sure if this is a good way of error handling because it means
    // there are 2 levels of switch statements to go through to provide UI
    switch (result) {
      case ConnectAndFlashResult.ErrorMicrobitUnsupported:
        return this.dispatchEvent(ConnEvent.MicrobitUnsupported);
      case ConnectAndFlashResult.ErrorBadFirmware:
        return this.dispatchEvent(ConnEvent.BadFirmware);
      case ConnectAndFlashResult.ErrorNoDeviceSelected:
        return this.dispatchEvent(ConnEvent.TryAgainSelectMicrobit);
      case ConnectAndFlashResult.ErrorUnableToClaimInterface:
        return this.dispatchEvent(ConnEvent.TryAgainCloseTabs);
      default:
        return this.dispatchEvent(ConnEvent.TryAgainReplugMicrobit);
    }
  };

  setMicrobitName = (name: string) => {
    const microbitNames = [...this.stage.microbitNames];
    microbitNames[0] = name;
    this.setStage({ ...this.stage, microbitNames });
  };

  connectBluetooth = async () => {
    this.onConnectingOrReconnecting("bluetooth");
    const result = await this.actions.connectBluetooth(
      this.stage.microbitNames.length > 0
        ? this.stage.microbitNames[0]
        : undefined
    );
    this.handleConnectResult(result);
  };

  connectMicrobits = async () => {
    this.onConnectingOrReconnecting("radio");
    const deviceId = this.stage.detectedDeviceIds;
    if (deviceId.length > 0) {
      const result = await this.actions.connectMicrobitsSerial(deviceId[0]);
      this.handleConnectResult(result);
    } else {
      this.dispatchEvent(ConnEvent.TryAgainReplugMicrobit);
    }
  };

  private onConnectingOrReconnecting = (connType: ConnectionType) => {
    const nextStage = getUpdatedConnStage(
      this.stage,
      connType === "bluetooth"
        ? ConnEvent.ConnectingBluetooth
        : ConnEvent.ConnectingMicrobits
    );
    this.setStage({
      ...nextStage,
      connType,
      status:
        this.stage.status === ConnectionStatus.None
          ? ConnectionStatus.Connecting
          : ConnectionStatus.Reconnecting,
    });
  };

  private handleConnectResult = (result: ConnectResult) => {
    if (result === ConnectResult.Success) {
      this.onConnected();
      return this.dispatchEvent(ConnEvent.Close);
    }
    const reconnectFailStreak = this.setDisconnectedAndRecordFailStreak();
    if (reconnectFailStreak === 0) {
      return this.dispatchEvent(ConnEvent.ConnectFailed);
    }
    if (reconnectFailStreak === 1) {
      return this.dispatchEvent(
        result === ConnectResult.ManualConnectFailed
          ? ConnEvent.ReconnectManualFail
          : ConnEvent.ReconnectAutoFail
      );
    }
    return this.dispatchEvent(ConnEvent.ReconnectFailedTwice);
  };

  private onConnected = () => {
    this.setStage({
      ...this.stage,
      status: ConnectionStatus.Connected,
      reconnectFailStreak: 0,
    });
  };

  private setDisconnectedAndRecordFailStreak = () => {
    const reconnectFailStreak =
      this.stage.status === ConnectionStatus.Reconnecting
        ? this.stage.reconnectFailStreak + 1
        : this.stage.reconnectFailStreak;
    this.setStage({
      ...this.stage,
      reconnectFailStreak,
      status: ConnectionStatus.Disconnected,
    });
    return reconnectFailStreak;
  };

  disconnect = async () => {
    await this.actions.disconnect();
    this.setStage({
      ...this.stage,
      status: ConnectionStatus.Disconnected,
    });
  };

  reconnect = async () => {
    if (this.stage.connType === "bluetooth") {
      await this.connectBluetooth();
    } else {
      await this.connectMicrobits();
    }
  };
}

export const getUpdatedConnStage = (
  state: ConnectionStage,
  event: ConnEvent
): ConnectionStage => {
  switch (event) {
    case ConnEvent.Start:
      return {
        ...state,
        flowType:
          state.flowType === ConnectionFlowType.RadioBridge
            ? ConnectionFlowType.RadioRemote
            : ConnectionFlowType.Bluetooth,
        flowStep:
          !state.isWebBluetoothSupported && !state.isWebUsbSupported
            ? ConnectionFlowStep.WebUsbBluetoothUnsupported
            : ConnectionFlowStep.Start,
      };
    case ConnEvent.Close:
      return { ...state, flowStep: ConnectionFlowStep.None };
    case ConnEvent.ConnectBattery:
    case ConnEvent.SkipFlashing:
      return { ...state, flowStep: ConnectionFlowStep.ConnectBattery };
    case ConnEvent.FlashingInProgress:
      return { ...state, flowStep: ConnectionFlowStep.FlashingInProgress };
    case ConnEvent.InstructManualFlashing:
      return { ...state, flowStep: ConnectionFlowStep.ManualFlashingTutorial };
    case ConnEvent.WebUsbChooseMicrobit:
      return { ...state, flowStep: ConnectionFlowStep.WebUsbChooseMicrobit };
    case ConnEvent.ConnectingBluetooth:
      return { ...state, flowStep: ConnectionFlowStep.ConnectingBluetooth };
    case ConnEvent.ConnectingMicrobits:
      return { ...state, flowStep: ConnectionFlowStep.ConnectingMicrobits };
    case ConnEvent.Next:
      return { ...state, ...getNextStage(state, 1) };
    case ConnEvent.Back:
      return { ...state, ...getNextStage(state, -1) };
    case ConnEvent.Switch:
      return {
        ...state,
        flowType:
          state.flowType === ConnectionFlowType.Bluetooth
            ? ConnectionFlowType.RadioRemote
            : ConnectionFlowType.Bluetooth,
      };
    case ConnEvent.GoToBluetoothStart:
      return {
        ...state,
        flowStep: ConnectionFlowStep.Start,
        flowType: ConnectionFlowType.Bluetooth,
      };
    case ConnEvent.ConnectFailed:
      return {
        ...state,
        flowStep:
          state.flowType === ConnectionFlowType.Bluetooth
            ? ConnectionFlowStep.TryAgainBluetoothConnect
            : ConnectionFlowStep.TryAgainReplugMicrobit,
      };
    case ConnEvent.TryAgainReplugMicrobit:
      return { ...state, flowStep: ConnectionFlowStep.TryAgainReplugMicrobit };
    case ConnEvent.TryAgainCloseTabs:
      return { ...state, flowStep: ConnectionFlowStep.TryAgainCloseTabs };
    case ConnEvent.TryAgainSelectMicrobit:
      return { ...state, flowStep: ConnectionFlowStep.TryAgainSelectMicrobit };
    case ConnEvent.BadFirmware:
      return { ...state, flowStep: ConnectionFlowStep.BadFirmware };
    case ConnEvent.MicrobitUnsupported:
      return { ...state, flowStep: ConnectionFlowStep.MicrobitUnsupported };
    case ConnEvent.TryAgain:
      return {
        ...state,
        flowStep:
          state.flowStep === ConnectionFlowStep.TryAgainBluetoothConnect
            ? ConnectionFlowStep.EnterBluetoothPattern
            : ConnectionFlowStep.ConnectCable,
      };
    case ConnEvent.ReconnectAutoFail:
      return { ...state, flowStep: ConnectionFlowStep.ReconnectAutoFail };
    case ConnEvent.ReconnectManualFail:
      return { ...state, flowStep: ConnectionFlowStep.ReconnectManualFail };
    case ConnEvent.ReconnectFailedTwice:
      return { ...state, flowStep: ConnectionFlowStep.ReconnectFailedTwice };
    default:
      return state;
  }
};

const getStagesOrder = (state: ConnectionStage): FlowStage[] => {
  const { RadioRemote, RadioBridge, Bluetooth } = ConnectionFlowType;
  if (state.flowType === ConnectionFlowType.Bluetooth) {
    return [
      { flowStep: ConnectionFlowStep.Start, flowType: Bluetooth },
      { flowStep: ConnectionFlowStep.ConnectCable, flowType: Bluetooth },
      // Only bluetooth mode has this fallback, the radio bridge mode requires working WebUSB.
      !state.isWebUsbSupported ||
      state.flowStep === ConnectionFlowStep.ManualFlashingTutorial
        ? {
            flowStep: ConnectionFlowStep.ManualFlashingTutorial,
            flowType: Bluetooth,
          }
        : {
            flowStep: ConnectionFlowStep.WebUsbFlashingTutorial,
            flowType: Bluetooth,
          },
      { flowStep: ConnectionFlowStep.ConnectBattery, flowType: Bluetooth },
      {
        flowStep: ConnectionFlowStep.EnterBluetoothPattern,
        flowType: Bluetooth,
      },
      {
        flowStep: ConnectionFlowStep.ConnectBluetoothTutorial,
        flowType: Bluetooth,
      },
    ];
  }
  return [
    { flowStep: ConnectionFlowStep.Start, flowType: RadioRemote },
    { flowStep: ConnectionFlowStep.ConnectCable, flowType: RadioRemote },
    {
      flowStep: ConnectionFlowStep.WebUsbFlashingTutorial,
      flowType: RadioRemote,
    },
    { flowStep: ConnectionFlowStep.ConnectBattery, flowType: RadioRemote },
    { flowStep: ConnectionFlowStep.ConnectCable, flowType: RadioBridge },
    {
      flowStep: ConnectionFlowStep.WebUsbFlashingTutorial,
      flowType: RadioBridge,
    },
  ];
};

const getFlowStageIdx = (
  { flowStep, flowType }: FlowStage,
  order: FlowStage[]
) => {
  for (let idx = 0; idx < order.length; idx++) {
    const currStage = order[idx];
    if (currStage.flowStep === flowStep && currStage.flowType === flowType) {
      return idx;
    }
  }
  throw new Error("Should be able to match stage and type again order");
};

const getNextStage = (stage: ConnectionStage, increment: number): FlowStage => {
  const order = getStagesOrder(stage);
  const currIdx = getFlowStageIdx(stage, order);
  const newIdx = currIdx + increment;
  if (newIdx === order.length || newIdx < 0) {
    throw new Error("Impossible step stage");
  }
  return order[newIdx];
};
