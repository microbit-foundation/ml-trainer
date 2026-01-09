/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Capacitor } from "@capacitor/core";
import { BoardVersion, ProgressStage } from "@microbit/microbit-connection";
import { deviceIdToMicrobitName } from "./bt-pattern-utils";
import {
  ConnectActions,
  ConnectAndFlashFailResult,
  ConnectResult,
} from "./connect-actions";
import { ConnectionStatus } from "./connect-status-hooks";
import {
  ConnectionFlowStep,
  ConnectionFlowType,
  ConnectionStage,
  ConnectionType,
  flowTypeToConnectionType,
} from "./connection-stage-hooks";
import {
  isNativeBluetoothConnection,
  isWebUSBConnection,
  MicrobitConnection,
} from "./device/connection-utils";
import { getHexFileUrl, HexType } from "./device/get-hex-file";
import { HexUrl } from "./model";
import { ConnectOptions } from "./store";
import { downloadHex } from "./utils/fs-util";

type FlowStage = Pick<ConnectionStage, "flowStep" | "flowType">;

export const bluetoothUniversalHex: HexUrl = {
  url: getHexFileUrl("universal", HexType.Bluetooth)!,
  name: "data-collection-program",
};

export class ConnectionStageActions {
  constructor(
    private actions: ConnectActions,
    private stage: ConnectionStage,
    private setStage: (stage: ConnectionStage) => void,
    private setStatus: (status: ConnectionStatus) => void,
    private dataCollectionMicrobitStartConnect: (
      options?: ConnectOptions
    ) => void,
    private dataCollectionMicrobitConnected: () => void
  ) {}

  startConnect = (options?: ConnectOptions) => {
    this.dataCollectionMicrobitStartConnect(options);
    this.setStatus(ConnectionStatus.NotConnected);
    const { isWebBluetoothSupported, isWebUsbSupported } = this.stage;
    if (Capacitor.isNativePlatform()) {
      this.setStage({
        ...this.stage,
        hasFailedToReconnectTwice: false,
        flowType: ConnectionFlowType.ConnectNativeBluetooth,
        flowStep: ConnectionFlowStep.Start,
      });
    } else {
      this.setStage({
        ...this.stage,
        hasFailedToReconnectTwice: false,
        flowType:
          !isWebBluetoothSupported ||
          this.stage.flowType !== ConnectionFlowType.ConnectWebBluetooth
            ? ConnectionFlowType.ConnectRadioRemote
            : ConnectionFlowType.ConnectWebBluetooth,
        flowStep:
          !isWebBluetoothSupported &&
          !isWebUsbSupported &&
          !Capacitor.isNativePlatform()
            ? ConnectionFlowStep.WebUsbBluetoothUnsupported
            : ConnectionFlowStep.Start,
      });
    }
  };

  disconnectInputMicrobit = async () => {
    await this.actions.disconnect();
    this.actions.removeStatusListener();
    // Use Disconnected to prevent status listener from picking up events
    // from subsequent connections (e.g., MakeCode download)
    this.setStatus(ConnectionStatus.Disconnected);
  };

  setFlowStep = (step: ConnectionFlowStep) => {
    this.setStage({ ...this.stage, flowStep: step });
  };

  connectAndFlash = async (
    progressCallback: (stage: ProgressStage, value: number | undefined) => void,
    onSuccess: (stage: ConnectionStage) => void
  ) => {
    const connection = this.actions.getDefaultFlashConnection();
    this.setStatus(ConnectionStatus.Preparing);

    if (isNativeBluetoothConnection(connection)) {
      const { bluetoothMicrobitName } = this.stage;
      if (!bluetoothMicrobitName) {
        throw new Error("Name must be set by prior step for bluetooth");
      }
      connection.setNameFilter(bluetoothMicrobitName);
    } else {
      // This is just a backdrop for the browser dialog shown during connect.
      this.setFlowStep(ConnectionFlowStep.WebUsbChooseMicrobit);
    }

    const hex = this.getHexType();
    const result = await this.actions.connect(connection, {
      progress: progressCallback,
    });
    if (result !== ConnectResult.Success) {
      return this.handleConnectAndFlashFail(result);
    }

    const boardVersion = connection.getBoardVersion();
    if (
      boardVersion === "V1" &&
      flowTypeToConnectionType(this.stage.flowType) === "radio"
    ) {
      // TODO: shouldn't this disconnect?
      return this.setFlowStep(ConnectionFlowStep.MicrobitUnsupported);
    }

    const flashResult = await this.actions.flash(
      connection,
      hex,
      progressCallback
    );
    if (flashResult !== ConnectResult.Success) {
      return this.handleConnectAndFlashFail(flashResult);
    }
    await this.onFlashSuccess(connection, onSuccess, boardVersion);
  };

  private getHexType = () => {
    return {
      [ConnectionFlowType.ConnectNativeBluetooth]: HexType.Bluetooth,
      [ConnectionFlowType.ConnectWebBluetooth]: HexType.Bluetooth,
      [ConnectionFlowType.ConnectRadioBridge]: HexType.RadioBridge,
      [ConnectionFlowType.ConnectRadioRemote]: HexType.RadioRemote,
    }[this.stage.flowType];
  };

  private onFlashSuccess = async (
    connection: MicrobitConnection,
    onSuccess: (stage: ConnectionStage) => void,
    boardVersion?: BoardVersion
  ) => {
    const deviceId = isWebUSBConnection(connection)
      ? connection.getDeviceId()
      : undefined;
    // We only need the bluetooth name if it's derived from a USB connection device id.
    const bluetoothMicrobitName = deviceId
      ? deviceIdToMicrobitName(deviceId)
      : undefined;

    // Reset from Preparing so status listener can track subsequent connections.
    this.setStatus(ConnectionStatus.NotConnected);

    switch (this.stage.flowType) {
      case ConnectionFlowType.ConnectNativeBluetooth: {
        // TODO: Tune delay.
        // If we try to reconnect too soon then we'll time out as it'll still be booting.
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await this.connectBluetooth(false);
        break;
      }
      case ConnectionFlowType.ConnectRadioBridge: {
        await this.connectMicrobits({
          radioBridgeDeviceId: deviceId,
        });
        break;
      }
      case ConnectionFlowType.ConnectWebBluetooth: {
        const newStage = {
          ...this.stage,
          flowStep: ConnectionFlowStep.ConnectBattery,
          bluetoothDeviceId: deviceId,
          bluetoothMicrobitName,
        };
        onSuccess(newStage);
        this.setStage(newStage);
        break;
      }
      case ConnectionFlowType.ConnectRadioRemote: {
        const newStage = {
          ...this.stage,
          flowStep: ConnectionFlowStep.ConnectBattery,
          radioRemoteDeviceId: deviceId,
          radioRemoteBoardVersion: boardVersion,
        };
        onSuccess(newStage);
        this.setStage(newStage);
        break;
      }
    }
  };

  private handleConnectAndFlashFail = (result: ConnectAndFlashFailResult) => {
    // TODO: this needs more cases for BT.
    if (result === ConnectResult.ErrorBadFirmware) {
      return this.setFlowStep(ConnectionFlowStep.BadFirmware);
    }
    if (this.stage.flowType === ConnectionFlowType.ConnectWebBluetooth) {
      downloadHex(bluetoothUniversalHex);
      return this.setFlowStep(ConnectionFlowStep.ManualFlashingTutorial);
    }
    switch (result) {
      case ConnectResult.ErrorNoDeviceSelected:
        return this.setFlowStep(
          ConnectionFlowStep.TryAgainWebUsbSelectMicrobit
        );
      case ConnectResult.ErrorUnableToClaimInterface:
        return this.setFlowStep(ConnectionFlowStep.TryAgainCloseTabs);
      default:
        return this.setFlowStep(ConnectionFlowStep.TryAgainReplugMicrobit);
    }
  };

  onChangeMicrobitName = (name: string) => {
    this.setStage({
      ...this.stage,
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
    await this.actions.connectMicrobitsSerial(
      newStage.radioRemoteDeviceId,
      newStage.radioRemoteBoardVersion
    );
  };

  private getConnectingStage = (connType: ConnectionType) => {
    return {
      ...this.stage,
      flowStep:
        connType === "bluetooth"
          ? ConnectionFlowStep.BluetoothConnect
          : ConnectionFlowStep.ConnectingMicrobits,
    };
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
        return this.setStage({
          ...this.stage,
          flowType,
          flowStep: ConnectionFlowStep.ConnectFailed,
        });
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
    if (flowTypeToConnectionType(this.stage.flowType) === "bluetooth") {
      await this.connectBluetooth(false);
    } else {
      await this.connectMicrobits();
    }
  };

  switchFlowType = () => {
    this.setStage({
      ...this.stage,
      flowType:
        this.stage.flowType === ConnectionFlowType.ConnectWebBluetooth
          ? ConnectionFlowType.ConnectRadioRemote
          : ConnectionFlowType.ConnectWebBluetooth,
    });
  };

  onStartBluetoothFlow = () => {
    this.setStage({
      ...this.stage,
      flowStep: ConnectionFlowStep.Start,
      flowType: ConnectionFlowType.ConnectWebBluetooth,
    });
  };

  private getStagesOrder = () => {
    const isRestartAgain = this.stage.hasFailedToReconnectTwice;
    const isManualFlashing =
      !this.stage.isWebUsbSupported ||
      this.stage.flowStep === ConnectionFlowStep.ManualFlashingTutorial;

    if (this.stage.flowType === ConnectionFlowType.ConnectWebBluetooth) {
      return webBluetoothFlow({ isManualFlashing, isRestartAgain });
    }
    if (this.stage.flowType === ConnectionFlowType.ConnectNativeBluetooth) {
      return nativeBluetoothFlow({ isRestartAgain });
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
        ? ConnectionFlowStep.BluetoothPattern
        : ConnectionFlowStep.ConnectCable
    );
  };
}

const webBluetoothFlow = ({
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
    flowType: ConnectionFlowType.ConnectWebBluetooth,
  },
  {
    flowStep: ConnectionFlowStep.ConnectCable,
    flowType: ConnectionFlowType.ConnectWebBluetooth,
  },
  // Only bluetooth mode has this fallback, the radio bridge mode requires working WebUSB.
  {
    flowStep: isManualFlashing
      ? ConnectionFlowStep.ManualFlashingTutorial
      : ConnectionFlowStep.WebUsbFlashingTutorial,
    flowType: ConnectionFlowType.ConnectWebBluetooth,
  },
  {
    flowStep: ConnectionFlowStep.ConnectBattery,
    flowType: ConnectionFlowType.ConnectWebBluetooth,
  },
  {
    flowStep: ConnectionFlowStep.BluetoothPattern,
    flowType: ConnectionFlowType.ConnectWebBluetooth,
  },
  {
    flowStep: ConnectionFlowStep.WebBluetoothPreConnectTutorial,
    flowType: ConnectionFlowType.ConnectWebBluetooth,
  },
];

const nativeBluetoothFlow = ({
  isRestartAgain,
}: {
  isRestartAgain: boolean;
}) => [
  {
    flowStep: isRestartAgain
      ? ConnectionFlowStep.ReconnectFailedTwice
      : ConnectionFlowStep.Start,
    flowType: ConnectionFlowType.ConnectNativeBluetooth,
  },
  {
    flowStep: ConnectionFlowStep.NativeBluetoothPreConnectTutorial,
    flowType: ConnectionFlowType.ConnectNativeBluetooth,
  },
  {
    flowStep: ConnectionFlowStep.BluetoothPattern,
    flowType: ConnectionFlowType.ConnectNativeBluetooth,
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
