import { deviceIdToMicrobitName } from "./bt-pattern-utils";
import {
  ConnectActions,
  ConnectAndFlashFailResult,
  ConnectAndFlashResult,
} from "./connect-actions";
import { ConnectionStatus } from "./connect-status-hooks";
import {
  ConnectionFlowStep,
  ConnectionFlowType,
  ConnectionStage,
  ConnectionType,
} from "./connection-stage-hooks";
import { getHexFileUrl, HexType } from "./device/get-hex-file";
import { HexUrl } from "./model";
import { downloadHex } from "./utils/fs-util";

type FlowStage = Pick<ConnectionStage, "flowStep" | "flowType">;

export const bluetoothUniversalHex: HexUrl = {
  url: getHexFileUrl("universal", HexType.Bluetooth)!,
  name: "machine-learning-tool-program",
};

export class ConnectionStageActions {
  constructor(
    private actions: ConnectActions,
    private stage: ConnectionStage,
    private setStage: (stage: ConnectionStage) => void,
    private setStatus: (status: ConnectionStatus) => void,
    private dataCollectionMicrobitConnected: () => void
  ) {}

  startConnect = () => {
    this.setStatus(ConnectionStatus.NotConnected);
    const { isWebBluetoothSupported, isWebUsbSupported } = this.stage;
    this.setStage({
      ...this.stage,
      hasFailedToReconnectTwice: false,
      flowType: !isWebBluetoothSupported
        ? ConnectionFlowType.ConnectRadioRemote
        : ConnectionFlowType.ConnectBluetooth,
      flowStep:
        !isWebBluetoothSupported && !isWebUsbSupported
          ? ConnectionFlowStep.WebUsbBluetoothUnsupported
          : ConnectionFlowStep.Start,
    });
  };

  disconnectInputMicrobit = async () => {
    await this.actions.disconnect();
    this.actions.removeStatusListener();
    this.setStatus(ConnectionStatus.NotConnected);
  };

  setFlowStep = (step: ConnectionFlowStep) => {
    this.setStage({ ...this.stage, flowStep: step });
  };

  connectAndflashMicrobit = async (
    progressCallback: (progress: number) => void,
    onSuccess: (stage: ConnectionStage) => void
  ) => {
    this.setFlowStep(ConnectionFlowStep.WebUsbChooseMicrobit);
    const hex = this.getHexType();
    const { result, deviceId } =
      await this.actions.requestUSBConnectionAndFlash(hex, progressCallback);
    if (result !== ConnectAndFlashResult.Success) {
      return this.handleConnectAndFlashFail(result);
    }

    await this.onFlashSuccess(deviceId, onSuccess);
  };

  private getHexType = () => {
    return {
      [ConnectionFlowType.ConnectBluetooth]: HexType.Bluetooth,
      [ConnectionFlowType.ConnectRadioBridge]: HexType.RadioBridge,
      [ConnectionFlowType.ConnectRadioRemote]: HexType.RadioRemote,
    }[this.stage.flowType];
  };

  private onFlashSuccess = async (
    deviceId: number,
    onSuccess: (stage: ConnectionStage) => void
  ) => {
    let newStage = this.stage;
    // Store radio/bluetooth details. Radio is essential to pass to micro:bit 2.
    // Bluetooth saves the user from entering the pattern.
    switch (this.stage.flowType) {
      case ConnectionFlowType.ConnectBluetooth: {
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
      case ConnectionFlowType.ConnectRadioBridge: {
        await this.connectMicrobits({
          radioBridgeDeviceId: deviceId,
        });
        return;
      }
      case ConnectionFlowType.ConnectRadioRemote: {
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
    if (this.stage.flowType === ConnectionFlowType.ConnectBluetooth) {
      downloadHex(bluetoothUniversalHex);
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
        return this.setFlowStep(
          ConnectionFlowStep.TryAgainWebUsbSelectMicrobit
        );
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

  connectBluetooth = async (clearDevice: boolean = true) => {
    this.setStage(this.getConnectingStage("bluetooth"));
    await this.actions.connectBluetooth(
      this.stage.bluetoothMicrobitName,
      clearDevice
    );
  };

  connectMicrobits = async (partialStage?: Partial<ConnectionStage>) => {
    const newStage = {
      ...this.getConnectingStage("radio"),
      ...(partialStage || {}),
    };
    this.setStage(newStage);
    if (!newStage.radioRemoteDeviceId) {
      throw new Error("Radio bridge device id not set");
    }
    await this.actions.connectMicrobitsSerial(newStage.radioRemoteDeviceId);
  };

  private getConnectingStage = (connType: ConnectionType) => {
    return {
      ...this.stage,
      connType,
      flowStep:
        connType === "bluetooth"
          ? ConnectionFlowStep.ConnectingBluetooth
          : ConnectionFlowStep.ConnectingMicrobits,
    };
  };

  private handleConnectFail = () => {
    this.setFlowStep(ConnectionFlowStep.ConnectFailed);
  };

  private onConnected = () => {
    this.setFlowStep(ConnectionFlowStep.None);
    this.dataCollectionMicrobitConnected();
  };

  disconnect = async () => {
    this.setStatus(ConnectionStatus.Disconnected);
    await this.actions.disconnect();
  };

  handleConnectionStatus = (
    status: ConnectionStatus,
    flowType: ConnectionFlowType
  ) => {
    switch (status) {
      case ConnectionStatus.Connected: {
        return this.onConnected();
      }
      case ConnectionStatus.FailedToSelectBluetoothDevice: {
        return this.setFlowStep(
          ConnectionFlowStep.TryAgainBluetoothSelectMicrobit
        );
      }
      case ConnectionStatus.FailedToConnect: {
        return this.handleConnectFail();
      }
      case ConnectionStatus.FailedToReconnectTwice: {
        return this.setStage({
          ...this.stage,
          flowType,
          hasFailedToReconnectTwice: true,
          flowStep: ConnectionFlowStep.ReconnectFailedTwice,
        });
      }
      case ConnectionStatus.FailedToReconnect: {
        return this.setFlowStage({
          flowStep: ConnectionFlowStep.ReconnectFailed,
          flowType,
        });
      }
      case ConnectionStatus.ConnectionLost: {
        return this.setFlowStage({
          flowStep: ConnectionFlowStep.ConnectionLost,
          flowType,
        });
      }
      case ConnectionStatus.ReconnectingAutomatically: {
        // Don't show dialogs when reconnecting automatically
        return this.setFlowStep(ConnectionFlowStep.None);
      }
    }
    return;
  };

  reconnect = async () => {
    this.setStatus(ConnectionStatus.ReconnectingExplicitly);
    if (this.stage.connType === "bluetooth") {
      await this.connectBluetooth(false);
    } else {
      await this.connectMicrobits();
    }
  };

  switchFlowType = () => {
    this.setStage({
      ...this.stage,
      flowType:
        this.stage.flowType === ConnectionFlowType.ConnectBluetooth
          ? ConnectionFlowType.ConnectRadioRemote
          : ConnectionFlowType.ConnectBluetooth,
    });
  };

  onStartBluetoothFlow = () => {
    this.setStage({
      ...this.stage,
      flowStep: ConnectionFlowStep.Start,
      flowType: ConnectionFlowType.ConnectBluetooth,
    });
  };

  private getStagesOrder = () => {
    const isRestartAgain = this.stage.hasFailedToReconnectTwice;
    const isManualFlashing =
      !this.stage.isWebUsbSupported ||
      this.stage.flowStep === ConnectionFlowStep.ManualFlashingTutorial;

    if (this.stage.flowType === ConnectionFlowType.ConnectBluetooth) {
      return bluetoothFlow({ isManualFlashing, isRestartAgain });
    }
    return radioFlow({ isRestartAgain });
  };

  private setFlowStage = (flowStage: FlowStage) => {
    this.setStage({ ...this.stage, ...flowStage });
  };

  onNextClick = () => {
    this.setFlowStage(getNextStage(this.stage, 1, this.getStagesOrder()));
  };

  onBackClick = () => {
    this.setFlowStage(getNextStage(this.stage, -1, this.getStagesOrder()));
  };

  onTryAgain = () => {
    this.setFlowStep(
      this.stage.flowStep === ConnectionFlowStep.TryAgainBluetoothSelectMicrobit
        ? ConnectionFlowStep.EnterBluetoothPattern
        : ConnectionFlowStep.ConnectCable
    );
  };
}

const bluetoothFlow = ({
  isManualFlashing,
  isRestartAgain,
}: {
  isManualFlashing: boolean;
  isRestartAgain: boolean;
}) => [
  {
    flowStep: isRestartAgain
      ? ConnectionFlowStep.ReconnectFailedTwice
      : ConnectionFlowStep.Start,
    flowType: ConnectionFlowType.ConnectBluetooth,
  },
  {
    flowStep: ConnectionFlowStep.ConnectCable,
    flowType: ConnectionFlowType.ConnectBluetooth,
  },
  // Only bluetooth mode has this fallback, the radio bridge mode requires working WebUSB.
  {
    flowStep: isManualFlashing
      ? ConnectionFlowStep.ManualFlashingTutorial
      : ConnectionFlowStep.WebUsbFlashingTutorial,
    flowType: ConnectionFlowType.ConnectBluetooth,
  },
  {
    flowStep: ConnectionFlowStep.ConnectBattery,
    flowType: ConnectionFlowType.ConnectBluetooth,
  },
  {
    flowStep: ConnectionFlowStep.EnterBluetoothPattern,
    flowType: ConnectionFlowType.ConnectBluetooth,
  },
  {
    flowStep: ConnectionFlowStep.ConnectBluetoothTutorial,
    flowType: ConnectionFlowType.ConnectBluetooth,
  },
];

const radioFlow = ({ isRestartAgain }: { isRestartAgain: boolean }) => [
  {
    flowStep: isRestartAgain
      ? ConnectionFlowStep.ReconnectFailedTwice
      : ConnectionFlowStep.Start,
    flowType: ConnectionFlowType.ConnectRadioRemote,
  },
  {
    flowStep: ConnectionFlowStep.ConnectCable,
    flowType: ConnectionFlowType.ConnectRadioRemote,
  },
  {
    flowStep: ConnectionFlowStep.WebUsbFlashingTutorial,
    flowType: ConnectionFlowType.ConnectRadioRemote,
  },
  {
    flowStep: ConnectionFlowStep.ConnectBattery,
    flowType: ConnectionFlowType.ConnectRadioRemote,
  },
  {
    flowStep: ConnectionFlowStep.ConnectCable,
    flowType: ConnectionFlowType.ConnectRadioBridge,
  },
  {
    flowStep: ConnectionFlowStep.WebUsbFlashingTutorial,
    flowType: ConnectionFlowType.ConnectRadioBridge,
  },
];

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

const getNextStage = (
  stage: ConnectionStage,
  increment: number,
  stagesOrder: FlowStage[]
): FlowStage => {
  const currIdx = getFlowStageIdx(stage, stagesOrder);
  const newIdx = currIdx + increment;
  if (newIdx === stagesOrder.length || newIdx < 0) {
    throw new Error("Impossible step stage");
  }
  return stagesOrder[newIdx];
};
