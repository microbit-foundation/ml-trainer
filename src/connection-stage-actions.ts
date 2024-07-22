import { NavigateFunction } from "react-router";
import { deviceIdToMicrobitName } from "./bt-pattern-utils";
import {
  ConnectActions,
  ConnectAndFlashFailResult,
  ConnectAndFlashResult,
  ConnectResult,
} from "./connect-actions";
import {
  ConnectionFlowStep,
  ConnectionFlowType,
  ConnectionStage,
  ConnectionStatus,
} from "./connection-stage-hooks";
import { createStepPageUrl } from "./urls";

type FlowStage = Pick<ConnectionStage, "flowStep" | "flowType">;

export class ConnectionStageActions {
  constructor(
    private actions: ConnectActions,
    private navigate: NavigateFunction,
    private stage: ConnectionStage,
    private setStage: (stage: ConnectionStage) => void
  ) {}

  start = () =>
    this.setStage({
      ...this.stage,
      flowType:
        this.stage.flowType === ConnectionFlowType.RadioBridge
          ? ConnectionFlowType.RadioRemote
          : ConnectionFlowType.Bluetooth,
      flowStep:
        !this.stage.isWebBluetoothSupported && !this.stage.isWebUsbSupported
          ? ConnectionFlowStep.WebUsbBluetoothUnsupported
          : ConnectionFlowStep.Start,
    });

  setFlowStep = (step: ConnectionFlowStep) => {
    this.setStage({ ...this.stage, flowStep: step });
  };

  connectAndflashMicrobit = async (
    progressCallback: (progress: number) => void,
    onSuccess: (stage: ConnectionStage) => void
  ) => {
    this.setFlowStep(ConnectionFlowStep.WebUsbChooseMicrobit);
    const { result, deviceId } =
      await this.actions.requestUSBConnectionAndFlash(
        this.stage.flowType,
        progressCallback
      );
    if (result !== ConnectAndFlashResult.Success) {
      return this.handleConnectAndFlashFail(result);
    }

    this.onFlashSuccess(deviceId, onSuccess);
  };

  private onFlashSuccess = (
    deviceId: number,
    onSuccess: (stage: ConnectionStage) => void
  ) => {
    let newStage = this.stage;
    // Store radio/bluetooth details. Radio is essential to pass to micro:bit 2.
    // Bluetooth saves the user from entering the pattern.
    switch (this.stage.flowType) {
      case ConnectionFlowType.Bluetooth: {
        const microbitName = deviceIdToMicrobitName(deviceId);
        newStage = {
          ...this.stage,
          connType: "bluetooth",
          flowStep: ConnectionFlowStep.ConnectBattery,
          bluetoothDeviceId: deviceId,
          bluetoothMicrobitName: microbitName,
        };
        break;
      }
      case ConnectionFlowType.RadioBridge: {
        newStage = {
          ...this.stage,
          connType: "radio",
          flowStep: ConnectionFlowStep.ConnectingMicrobits,
          radioBridgeDeviceId: deviceId,
          status: this.getConnectingOrReconnectingStatus(),
        };
        break;
      }
      case ConnectionFlowType.RadioRemote: {
        newStage = {
          ...this.stage,
          connType: "radio",
          flowStep: ConnectionFlowStep.ConnectBattery,
          radioRemoteDeviceId: deviceId,
        };
        break;
      }
    }
    onSuccess(newStage);
    this.setStage(newStage);
  };

  private handleConnectAndFlashFail = (result: ConnectAndFlashFailResult) => {
    if (this.stage.flowType === ConnectionFlowType.Bluetooth) {
      return this.setFlowStep(ConnectionFlowStep.ManualFlashingTutorial);
    }

    // TODO: Not sure if this is a good way of error handling because it means
    // there are 2 levels of switch statements to go through to provide UI
    switch (result) {
      case ConnectAndFlashResult.ErrorMicrobitUnsupported:
        return this.setFlowStep(ConnectionFlowStep.MicrobitUnsupported);
      case ConnectAndFlashResult.ErrorBadFirmware:
        return this.setFlowStep(ConnectionFlowStep.BadFirmware);
      case ConnectAndFlashResult.ErrorNoDeviceSelected:
        return this.setFlowStep(ConnectionFlowStep.TryAgainSelectMicrobit);
      case ConnectAndFlashResult.ErrorUnableToClaimInterface:
        return this.setFlowStep(ConnectionFlowStep.TryAgainCloseTabs);
      default:
        return this.setFlowStep(ConnectionFlowStep.TryAgainReplugMicrobit);
    }
  };

  onChangeMicrobitName = (name: string) => {
    if (this.stage.connType !== "bluetooth") {
      throw new Error("Microbit name can only be set for bluetooth flow");
    }
    this.setStage({
      ...this.stage,
      connType: "bluetooth",
      // It is not possible to compute device id from micro:bit name
      // so to remove confusion, device id is removed from state
      bluetoothDeviceId: undefined,
      bluetoothMicrobitName: name,
    });
  };

  connectBluetooth = async () => {
    this.setStage({
      ...this.stage,
      connType: "bluetooth",
      flowStep: ConnectionFlowStep.ConnectingBluetooth,
      status: this.getConnectingOrReconnectingStatus(),
    });
    const result = await this.actions.connectBluetooth(
      this.stage.bluetoothMicrobitName
    );
    this.handleConnectResult(result);
  };

  connectMicrobits = async () => {
    if (this.stage.connType === "radio" && this.stage.radioRemoteDeviceId) {
      const result = await this.actions.connectMicrobitsSerial(
        this.stage.radioRemoteDeviceId
      );
      this.handleConnectResult(result);
    } else {
      this.setFlowStep(ConnectionFlowStep.TryAgainReplugMicrobit);
    }
  };

  private getConnectingOrReconnectingStatus = () => {
    return this.stage.status === ConnectionStatus.None
      ? ConnectionStatus.Connecting
      : ConnectionStatus.Reconnecting;
  };

  private handleConnectResult = (result: ConnectResult) => {
    if (result === ConnectResult.Success) {
      return this.onConnected();
    }
    const reconnectFailStreak = this.setDisconnectedAndRecordFailStreak();
    if (reconnectFailStreak === 0) {
      return this.setFlowStep(
        this.stage.flowType === ConnectionFlowType.Bluetooth
          ? ConnectionFlowStep.TryAgainBluetoothConnect
          : ConnectionFlowStep.TryAgainReplugMicrobit
      );
    }
    if (reconnectFailStreak === 1) {
      return this.setFlowStep(
        result === ConnectResult.ManualConnectFailed
          ? ConnectionFlowStep.ReconnectManualFail
          : ConnectionFlowStep.ReconnectAutoFail
      );
    }
    return this.setFlowStep(ConnectionFlowStep.ReconnectFailedTwice);
  };

  private onConnected = () => {
    this.setStage({
      ...this.stage,
      flowStep: ConnectionFlowStep.None,
      status: ConnectionStatus.Connected,
      reconnectFailStreak: 0,
    });
    this.navigate(createStepPageUrl("add-data"));
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

  switchFlowType = () => {
    this.setStage({
      ...this.stage,
      flowType:
        this.stage.flowType === ConnectionFlowType.Bluetooth
          ? ConnectionFlowType.RadioRemote
          : ConnectionFlowType.Bluetooth,
    });
  };

  onStartBluetoothFlow = () => {
    this.setStage({
      ...this.stage,
      flowStep: ConnectionFlowStep.Start,
      flowType: ConnectionFlowType.Bluetooth,
    });
  };

  onNextClick = () => {
    this.setStage({ ...this.stage, ...getNextStage(this.stage, 1) });
  };

  onBackClick = () => {
    this.setStage({ ...this.stage, ...getNextStage(this.stage, -1) });
  };

  onTryAgain = () => {
    this.setFlowStep(
      this.stage.flowStep === ConnectionFlowStep.TryAgainBluetoothConnect
        ? ConnectionFlowStep.EnterBluetoothPattern
        : ConnectionFlowStep.ConnectCable
    );
  };
}

const getStagesOrder = (state: ConnectionStage): FlowStage[] => {
  const { RadioRemote, RadioBridge, Bluetooth } = ConnectionFlowType;
  if (state.flowType === ConnectionFlowType.Bluetooth) {
    return [
      { flowStep: ConnectionFlowStep.Start, flowType: Bluetooth },
      { flowStep: ConnectionFlowStep.ConnectCable, flowType: Bluetooth },
      // Only bluetooth mode has this fallback, the radio bridge mode requires working WebUSB.
      {
        flowStep:
          !state.isWebUsbSupported ||
          state.flowStep === ConnectionFlowStep.ManualFlashingTutorial
            ? ConnectionFlowStep.ManualFlashingTutorial
            : ConnectionFlowStep.WebUsbFlashingTutorial,
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
