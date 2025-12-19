/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  createWebUSBConnection,
  ConnectionStatus as DeviceConnectionStatus,
} from "@microbit/microbit-connection";
import { useMemo } from "react";
import { ConnectActions, ConnectResult } from "../connect-actions";
import { useConnectActions } from "../connect-actions-hooks";
import { ConnectionStatus } from "../connect-status-hooks";
import { ConnectionStageActions } from "../connection-stage-actions";
import {
  ConnectionStage,
  StoredConnectionConfig,
  useConnectionConfigStorage,
  useConnectionStage,
} from "../connection-stage-hooks";
import {
  isNativeBluetoothConnection,
  MicrobitFlashConnection,
} from "../device/connection-utils";
import {
  DownloadState,
  DownloadStep,
  HexData,
  SameOrDifferentChoice,
} from "../model";
import { Settings } from "../settings";
import { useSettings, useStore } from "../store";
import { downloadHex } from "../utils/fs-util";

// TODO: extract this for consistency with connection actions
export class DownloadProjectActions {
  private flashingProgressCallback: (value: number) => void;
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
    flashingProgressCallback: (value: number) => void
  ) {
    this.flashingProgressCallback = (value: number) => {
      if (state.step !== DownloadStep.FlashingInProgress) {
        setState({ ...state, step: DownloadStep.FlashingInProgress });
      }
      flashingProgressCallback(value);
    };
  }

  clearMakeCodeUsbDevice = () => {
    this.setState({ ...this.state, connection: undefined });
  };

  start = async (download: HexData) => {
    if (
      this.state.connection &&
      (this.state.connection.status === DeviceConnectionStatus.CONNECTED ||
        isNativeBluetoothConnection(this.state.connection))
    ) {
      // Reuse connection from last time if still connected or native Bluetooth.
      const newState: DownloadState = {
        ...this.state,
        step: DownloadStep.FlashingInProgress,
        hex: download,
        bluetoothMicrobitName: this.config.bluetoothMicrobitName,
      };
      this.setState(newState);
      await this.flash(this.state, this.state.connection);
    } else if (!this.settings.showPreDownloadHelp) {
      const newState = {
        ...this.state,
        hex: download,
        bluetoothMicrobitName: this.config.bluetoothMicrobitName,
      };
      await this.onHelpNext(true, newState);
    } else {
      this.updateStage({
        step: DownloadStep.Help,
        microbitChoice: SameOrDifferentChoice.Default,
        hex: download,
        bluetoothMicrobitName: this.config.bluetoothMicrobitName,
      });
    }
  };

  onHelpNext = async (isSkipNextTime: boolean, state?: DownloadState) => {
    this.setSettings({ showPreDownloadHelp: !isSkipNextTime });
    const defaultConnection = this.connectActions.getDefaultFlashConnection();

    if (this.connectionStage.connType === "radio") {
      // Disconnect input micro:bit to not trigger radio connection lost warning.
      await this.connectionStageActions.disconnectInputMicrobit();
      this.updateStage({
        ...(state ?? {}),
        step: DownloadStep.UnplugRadioBridgeMicrobit,
      });
    } else if (isNativeBluetoothConnection(defaultConnection)) {
      // Disconnect input micro:bit to not trigger radio connection lost warning.
      await this.connectionStageActions.disconnectInputMicrobit();

      const newState: DownloadState = {
        ...this.state,
        ...state,
        step: DownloadStep.NativeBluetoothPreConnectTutorial,
      };
      this.setState(newState);
    } else if (this.connectionStatus !== ConnectionStatus.NotConnected) {
      // If we've Web Bluetooth connected to a micro:bit in the session,
      // we make the user choose a device even if the connection has been lost since.
      // This makes reconnect easier if the user has two micro:bits.
      this.updateStage({
        ...(state ?? {}),
        step: DownloadStep.ChooseSameOrDifferentMicrobit,
        microbitChoice: SameOrDifferentChoice.Default,
      });
    } else {
      this.updateStage({
        ...(state ?? {}),
        step: DownloadStep.ConnectCable,
      });
    }
  };

  onSkipIntro = (skipIntro: boolean) =>
    this.setSettings({ showPreDownloadHelp: !skipIntro });

  onBackToIntro = () => this.setStep(DownloadStep.Help);

  onChosenSameMicrobit = async () => {
    if (this.connectActions.isUsbDeviceConnected()) {
      const newStage = {
        ...this.state,
        microbitToFlash: SameOrDifferentChoice.Same,
      };
      const usbConnection = this.connectActions.getUsbConnection();
      if (usbConnection.getBoardVersion() === "V1") {
        this.updateStage({
          ...newStage,
          step: DownloadStep.IncompatibleDevice,
        });
        return;
      }
      this.updateStage(newStage);
      // Can flash directly without choosing device.
      return this.connectAndFlash(newStage);
    }
    this.updateStage({
      step: DownloadStep.ConnectCable,
      microbitChoice: SameOrDifferentChoice.Same,
    });
  };

  onChosenDifferentMicrobit = () => {
    this.updateStage({
      step: DownloadStep.ConnectCable,
      microbitChoice: SameOrDifferentChoice.Different,
    });
  };

  onChangeMicrobitName(name: string) {
    this.setState({
      ...this.state,
      bluetoothMicrobitName: name,
    });
  }

  connectAndFlash = async (stage: DownloadState) => {
    if (!stage.hex) {
      throw new Error("Project hex/name is not set!");
    }

    let callbackIfDeviceIsSame: (() => Promise<void>) | undefined;
    if (
      stage.microbitChoice === SameOrDifferentChoice.Same &&
      this.connectionStage.connType === "bluetooth"
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

    // TODO: this needs to be the reset to BT mode step.
    this.updateStage({ step: DownloadStep.WebUsbChooseMicrobit });

    const result = await this.connectActions.connect(connection, {
      callbackIfDeviceIsSame,
    });
    if (
      result === ConnectResult.Success &&
      connection.getBoardVersion() === "V1"
    ) {
      return this.updateStage({
        step: DownloadStep.IncompatibleDevice,
      });
    }

    await this.flash(stage, connection);
  };

  private flash = async (
    stage: DownloadState,
    connection: MicrobitFlashConnection
  ) => {
    if (!stage.hex) {
      throw new Error("Project hex/name is not set!");
    }

    const result = await this.connectActions.flash(
      connection,
      stage.hex.hex,
      this.flashingProgressCallback
    );
    const newStage = {
      connection,
      step:
        result === ConnectResult.Success
          ? DownloadStep.None
          : DownloadStep.ManualFlashingTutorial,
      flashProgress: 0,
    };
    this.updateStage(newStage);
    if (newStage.step === DownloadStep.ManualFlashingTutorial) {
      downloadHex(stage.hex);
    }
  };

  getOnNext = () => {
    const nextStep = this.getNextStep();
    return nextStep ? () => this.setStep(nextStep) : undefined;
  };

  getOnBack = () => {
    const prevStep = this.getPrevStep();
    return prevStep ? () => this.setStep(prevStep) : undefined;
  };

  private getNextStep = (): DownloadStep | undefined => {
    switch (this.state.step) {
      case DownloadStep.UnplugRadioBridgeMicrobit:
        return DownloadStep.ConnectRadioRemoteMicrobit;
      case DownloadStep.NativeBluetoothPreConnectTutorial:
        return DownloadStep.BluetoothPattern;
      case DownloadStep.ConnectCable:
      case DownloadStep.ConnectRadioRemoteMicrobit:
        return DownloadStep.WebUsbFlashingTutorial;
      default:
        throw new Error(`Next step not accounted for: ${this.state.step}`);
    }
  };

  private getPrevStep = (): DownloadStep | undefined => {
    switch (this.state.step) {
      case DownloadStep.UnplugRadioBridgeMicrobit:
      case DownloadStep.ChooseSameOrDifferentMicrobit: {
        return this.settings.showPreDownloadHelp
          ? DownloadStep.Help
          : undefined;
      }
      case DownloadStep.ConnectRadioRemoteMicrobit:
        return DownloadStep.UnplugRadioBridgeMicrobit;
      case DownloadStep.NativeBluetoothPreConnectTutorial: {
        if (this.settings.showPreDownloadHelp) {
          return DownloadStep.Help;
        }
        return undefined;
      }
      case DownloadStep.BluetoothPattern:
        return DownloadStep.NativeBluetoothPreConnectTutorial;
      case DownloadStep.ConnectCable: {
        if (this.state.microbitChoice !== SameOrDifferentChoice.Default) {
          return DownloadStep.ChooseSameOrDifferentMicrobit;
        }
        if (this.settings.showPreDownloadHelp) {
          return DownloadStep.Help;
        }
        return undefined;
      }
      case DownloadStep.ManualFlashingTutorial:
      case DownloadStep.WebUsbFlashingTutorial: {
        return this.connectionStage.connType === "radio"
          ? DownloadStep.ConnectRadioRemoteMicrobit
          : DownloadStep.ConnectCable;
      }
      case DownloadStep.IncompatibleDevice:
        // TODO: dubious.
        return DownloadStep.ChooseSameOrDifferentMicrobit;
      default:
        throw new Error(`Prev step not accounted for: ${this.state.step}`);
    }
  };

  close = () => this.setStep(DownloadStep.None);

  private updateStage = (partialStage: Partial<DownloadState>) => {
    this.setState({ ...this.state, ...partialStage } as DownloadState);
  };

  private setStep = (step: DownloadStep) =>
    this.setState({ ...this.state, step });
}

export const useDownloadActions = (): DownloadProjectActions => {
  const stage = useStore((s) => s.download);
  const setDownloadFlashingProgress = useStore(
    (s) => s.setDownloadFlashingProgress
  );
  const setStage = useStore((s) => s.setDownload);
  const [settings, setSettings] = useSettings();
  const [config] = useConnectionConfigStorage();

  const connectActions = useConnectActions();
  const {
    actions: connectionStageActions,
    status: connectionStatus,
    stage: connectionStage,
  } = useConnectionStage();
  return useMemo(
    () =>
      new DownloadProjectActions(
        config,
        stage,
        setStage,
        settings,
        setSettings,
        connectActions,
        connectionStage,
        connectionStageActions,
        connectionStatus,
        setDownloadFlashingProgress
      ),
    [
      config,
      connectActions,
      connectionStage,
      connectionStageActions,
      connectionStatus,
      setDownloadFlashingProgress,
      setSettings,
      setStage,
      settings,
      stage,
    ]
  );
};
