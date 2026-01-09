/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  createWebUSBConnection,
  ConnectionStatus as DeviceConnectionStatus,
  ProgressCallback,
} from "@microbit/microbit-connection";
import { ConnectActions, ConnectResult } from "./connect-actions";
import { ConnectionStatus } from "./connect-status-hooks";
import { ConnectionStageActions } from "./connection-stage-actions";
import {
  ConnectionStage,
  flowTypeToConnectionType,
  StoredConnectionConfig,
} from "./connection-stage-hooks";
import {
  isNativeBluetoothConnection,
  MicrobitConnection,
} from "./device/connection-utils";
import {
  DownloadState,
  DownloadStep,
  HexData,
  SameOrDifferentChoice,
} from "./model";
import { Settings } from "./settings";
import { downloadHex } from "./utils/fs-util";

export class DownloadProjectActions {
  private flashingProgressCallback: ProgressCallback;
  constructor(
    private config: StoredConnectionConfig,
    private state: DownloadState,
    private setState: (stage: DownloadState) => void,
    private settings: Settings,
    private setSettings: (settings: Partial<Settings>) => void,
    private connectActions: ConnectActions,
    private connectionStage: ConnectionStage,
    private connectionStageActions: ConnectionStageActions,
    private connectionStatus: ConnectionStatus,
    setDownloadFlashingProgress: ProgressCallback
  ) {
    this.flashingProgressCallback = setDownloadFlashingProgress;
  }

  /**
   * Navigate to a new step, pushing current step to history.
   * Use this for forward navigation and action-triggered transitions.
   */
  private navigateTo = (
    step: DownloadStep,
    additionalState?: Partial<DownloadState>
  ) => {
    const history =
      this.state.step === DownloadStep.None
        ? [] // Starting fresh, don't push None to history
        : [...this.state.history, this.state.step];
    this.setState({
      ...this.state,
      ...additionalState,
      step,
      history,
    });
  };

  /**
   * Navigate back to previous step by popping from history.
   */
  private navigateBack = () => {
    const history = [...this.state.history];
    const prevStep = history.pop();
    if (prevStep !== undefined) {
      this.setState({
        ...this.state,
        step: prevStep,
        history,
      });
    }
  };

  /**
   * Close the download flow, resetting to initial state.
   */
  close = () => {
    this.setState({
      ...this.state,
      step: DownloadStep.None,
      history: [],
    });
  };

  /**
   * Update state without navigation (e.g., updating microbit name).
   */
  private updateState = (partialState: Partial<DownloadState>) => {
    this.setState({ ...this.state, ...partialState });
  };

  clearMakeCodeUsbDevice = () => {
    this.updateState({ connection: undefined });
  };

  start = async (download: HexData) => {
    if (
      this.state.connection &&
      this.state.connection.status === DeviceConnectionStatus.CONNECTED &&
      !isNativeBluetoothConnection(this.state.connection)
    ) {
      // Reuse connection from last time if still connected.
      // Native Bluetooth cannot use this shortcut as we need to show the user
      // how to reset to Bluetooth mode.
      const newState: DownloadState = {
        ...this.state,
        step: DownloadStep.FlashingInProgress,
        history: [],
        hex: download,
        bluetoothMicrobitName: this.config.bluetoothMicrobitName,
      };
      this.setState(newState);
      await this.flash(newState, newState.connection!);
    } else if (!this.settings.showPreDownloadHelp) {
      const newState: DownloadState = {
        ...this.state,
        step: DownloadStep.None,
        history: [],
        hex: download,
        bluetoothMicrobitName: this.config.bluetoothMicrobitName,
      };
      this.setState(newState);
      await this.onHelpNext(true);
    } else {
      this.setState({
        ...this.state,
        step: DownloadStep.Help,
        history: [],
        microbitChoice: SameOrDifferentChoice.Default,
        hex: download,
        bluetoothMicrobitName: this.config.bluetoothMicrobitName,
      });
    }
  };

  onHelpNext = async (isSkipNextTime: boolean) => {
    this.setSettings({ showPreDownloadHelp: !isSkipNextTime });
    const defaultConnection = this.connectActions.getDefaultFlashConnection();

    if (flowTypeToConnectionType(this.connectionStage.flowType) === "radio") {
      // Disconnect input micro:bit to not trigger radio connection lost warning.
      await this.connectionStageActions.disconnectInputMicrobit();
      this.navigateTo(DownloadStep.UnplugRadioBridgeMicrobit);
    } else if (isNativeBluetoothConnection(defaultConnection)) {
      await this.connectionStageActions.disconnectInputMicrobit();
      this.navigateTo(DownloadStep.NativeBluetoothPreConnectTutorial);
    } else if (this.connectionStatus !== ConnectionStatus.NotConnected) {
      // If we've Web Bluetooth connected to a micro:bit in the session,
      // we make the user choose a device even if the connection has been lost since.
      // This makes reconnect easier if the user has two micro:bits.
      this.navigateTo(DownloadStep.ChooseSameOrDifferentMicrobit, {
        microbitChoice: SameOrDifferentChoice.Default,
      });
    } else {
      this.navigateTo(DownloadStep.ConnectCable);
    }
  };

  onSkipIntro = (skipIntro: boolean) =>
    this.setSettings({ showPreDownloadHelp: !skipIntro });

  onChosenSameMicrobit = async () => {
    if (this.connectActions.isUsbDeviceConnected()) {
      const usbConnection = this.connectActions.getUsbConnection();
      if (usbConnection.getBoardVersion() === "V1") {
        this.navigateTo(DownloadStep.IncompatibleDevice, {
          microbitChoice: SameOrDifferentChoice.Same,
        });
        return;
      }
      // Can flash directly without choosing device.
      return this.connectAndFlash({
        ...this.state,
        microbitChoice: SameOrDifferentChoice.Same,
      });
    }
    this.navigateTo(DownloadStep.ConnectCable, {
      microbitChoice: SameOrDifferentChoice.Same,
    });
  };

  onChosenDifferentMicrobit = () => {
    this.navigateTo(DownloadStep.ConnectCable, {
      microbitChoice: SameOrDifferentChoice.Different,
    });
  };

  onChangeMicrobitName(name: string) {
    this.updateState({ bluetoothMicrobitName: name });
  }

  connectAndFlash = async (stage: DownloadState) => {
    if (!stage.hex) {
      throw new Error("Project hex/name is not set!");
    }

    let callbackIfDeviceIsSame: (() => Promise<void>) | undefined;
    if (
      stage.microbitChoice === SameOrDifferentChoice.Same &&
      flowTypeToConnectionType(this.connectionStage.flowType) === "bluetooth"
    ) {
      // Disconnect input micro:bit to not trigger bluetooth connection lost warning.
      await this.connectionStageActions.disconnectInputMicrobit();
    }
    let connection = this.connectActions.getDefaultFlashConnection();
    if (stage.microbitChoice === SameOrDifferentChoice.Different) {
      // Use a temporary USB connection to flash the MakeCode program.
      // Disconnect the input micro:bit if the user selects this device from the
      // list by mistake. In future we can support native Bluetooth here too.
      connection = createWebUSBConnection();
      const connectedDevice = this.connectActions.getUsbDevice();
      if (connectedDevice) {
        connection.setRequestDeviceExclusionFilters([
          { serialNumber: connectedDevice.serialNumber },
        ]);
      }
      callbackIfDeviceIsSame =
        this.connectionStageActions.disconnectInputMicrobit;
    }

    const result = await this.connectActions.connect(connection, {
      callbackIfDeviceIsSame,
      progress: this.flashingProgressCallback,
    });
    if (result !== ConnectResult.Success) {
      this.handleConnectOrFlashError(connection, stage.hex, result);
      return;
    }

    if (connection.getBoardVersion() === "V1") {
      return this.navigateTo(DownloadStep.IncompatibleDevice);
    }

    await this.flash(stage, connection);
  };

  private flash = async (
    stage: DownloadState,
    connection: MicrobitConnection
  ) => {
    if (!stage.hex) {
      throw new Error("Project hex/name is not set!");
    }

    // Transient step to show progress dialog.
    // Uses updateState (not navigateTo) so it's not added to navigation history.
    this.updateState({ step: DownloadStep.FlashingInProgress });

    const result = await this.connectActions.flash(
      connection,
      stage.hex.hex,
      this.flashingProgressCallback
    );

    if (result === ConnectResult.Success) {
      this.close();
    } else {
      this.handleConnectOrFlashError(connection, stage.hex, result);
    }
  };

  private handleConnectOrFlashError(
    connection: MicrobitConnection,
    hex: HexData,
    _result: ConnectResult
  ) {
    // TODO: This is kinda unhelpful and definitely inappropriate for native bluetooth.
    this.navigateTo(DownloadStep.ManualFlashingTutorial, { connection });
    downloadHex(hex);
  }

  /**
   * Get the next step for simple linear transitions.
   * Complex transitions (Help, ChooseMicrobit) have their own handlers.
   */
  getOnNext = (): (() => void) | undefined => {
    const nextStep = this.getNextStep();
    if (!nextStep) {
      return undefined;
    }
    return () => this.navigateTo(nextStep);
  };

  private getNextStep = (): DownloadStep | undefined => {
    switch (this.state.step) {
      case DownloadStep.UnplugRadioBridgeMicrobit:
        return DownloadStep.ConnectRadioRemoteMicrobit;
      case DownloadStep.ConnectRadioRemoteMicrobit:
      case DownloadStep.ConnectCable:
        return DownloadStep.WebUsbFlashingTutorial;
      case DownloadStep.NativeBluetoothPreConnectTutorial:
        return DownloadStep.BluetoothPattern;
      default:
        return undefined;
    }
  };

  /**
   * Get back action if there's history to go back to.
   */
  getOnBack = (): (() => void) | undefined => {
    if (this.state.history.length === 0) {
      return undefined;
    }
    return () => this.navigateBack();
  };
}
