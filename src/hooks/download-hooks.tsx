import {
  MicrobitWebUSBConnection,
  ConnectionStatus as UsbConnectionStatus,
} from "@microbit/microbit-connection";
import { useMemo } from "react";
import {
  ConnectActions,
  ConnectAndFlashResult,
  ConnectionAndFlashOptions,
} from "../connect-actions";
import { useConnectActions } from "../connect-actions-hooks";
import { ConnectionStatus } from "../connect-status-hooks";
import { ConnectionStageActions } from "../connection-stage-actions";
import {
  ConnectionFlowType,
  ConnectionStage,
  useConnectionStage,
} from "../connection-stage-hooks";
import {
  DownloadState,
  DownloadStep,
  HexData,
  MicrobitToFlash,
} from "../model";
import { Settings } from "../settings";
import { useSettings, useStore } from "../store";
import { downloadHex } from "../utils/fs-util";

export class DownloadProjectActions {
  constructor(
    private state: DownloadState,
    private setState: (stage: DownloadState) => void,
    private settings: Settings,
    private setSettings: (settings: Partial<Settings>) => void,
    private connectActions: ConnectActions,
    private connectionStage: ConnectionStage,
    private connectionStageActions: ConnectionStageActions,
    private connectionStatus: ConnectionStatus
  ) {}

  clearMakeCodeUsbDevice = () => {
    this.setState({ ...this.state, usbDevice: undefined });
  };

  start = async (download: HexData) => {
    if (
      this.state.usbDevice &&
      this.state.usbDevice.status === UsbConnectionStatus.CONNECTED
    ) {
      const newState = {
        ...this.state,
        step: DownloadStep.FlashingInProgress,
        project: download,
      };
      this.setState(newState);
      return this.flashMicrobit(newState, {
        temporaryUsbConnection: this.state.usbDevice,
      });
    }
    if (!this.settings.showPreDownloadHelp) {
      const newState = { ...this.state, hex: download };
      return this.onHelpNext(true, newState);
    }
    this.updateStage({
      step: DownloadStep.Help,
      microbitToFlash: MicrobitToFlash.Default,
      hex: download,
    });
  };

  onHelpNext = (isSkipNextTime: boolean, state?: DownloadState) => {
    this.setSettings({ showPreDownloadHelp: !isSkipNextTime });

    // If we've connected to a micro:bit in the session, we make the user
    // choose a device even if the connection has been lost since.
    // This makes reconnect easier if the user has two micro:bits.
    if (this.connectionStatus !== ConnectionStatus.NotConnected) {
      return this.updateStage({
        ...(state ?? {}),
        step: DownloadStep.ChooseSameOrAnotherMicrobit,
        microbitToFlash: MicrobitToFlash.Default,
      });
    }
    this.updateStage({
      ...(state ?? {}),
      step: DownloadStep.ConnectCable,
    });
  };

  onSkipIntro = (skipIntro: boolean) =>
    this.setSettings({ showPreDownloadHelp: !skipIntro });

  onBackToIntro = () => this.setStep(DownloadStep.Help);

  private isBluetoothConnected = () =>
    this.connectionStage.flowType === ConnectionFlowType.ConnectBluetooth;

  onChosenSameMicrobit = async () => {
    const isBluetoothConnected = this.isBluetoothConnected();
    if (this.connectActions.isUsbDeviceConnected() && isBluetoothConnected) {
      const newStage = {
        ...this.state,
        microbitToFlash: MicrobitToFlash.Same,
      };
      // Can flash directly without choosing device.
      return this.connectAndFlashMicrobit(newStage);
    }
    if (!isBluetoothConnected) {
      // Disconnect input micro:bit to not trigger radio connection lost warning.
      await this.connectionStageActions.disconnectInputMicrobit();
    }

    this.updateStage({
      step: isBluetoothConnected
        ? DownloadStep.ConnectCable
        : DownloadStep.UnplugBridgeMicrobit,
      microbitToFlash: MicrobitToFlash.Same,
    });
  };

  onChosenDifferentMicrobit = () => {
    this.updateStage({
      step: DownloadStep.ConnectCable,
      microbitToFlash: MicrobitToFlash.Different,
    });
  };

  connectAndFlashMicrobit = async (stage: DownloadState) => {
    let connectionAndFlashOptions: ConnectionAndFlashOptions | undefined;
    if (
      stage.microbitToFlash === MicrobitToFlash.Same &&
      this.isBluetoothConnected()
    ) {
      // Disconnect input micro:bit to not trigger bluetooth connection lost warning.
      await this.connectionStageActions.disconnectInputMicrobit();
    }
    if (stage.microbitToFlash === MicrobitToFlash.Different) {
      // Use a temporary USB connection to flash the MakeCode program.
      // Disconnect the input micro:bit if the user selects this device from the
      // list by mistake.
      const temporaryUsbConnection = new MicrobitWebUSBConnection();
      const connectedDevice = this.connectActions.getUsbDevice();
      if (connectedDevice) {
        temporaryUsbConnection.setRequestDeviceExclusionFilters([
          { serialNumber: connectedDevice.serialNumber },
        ]);
      }
      connectionAndFlashOptions = {
        temporaryUsbConnection,
        callbackIfDeviceIsSame:
          this.connectionStageActions.disconnectInputMicrobit,
      };
    }
    if (!stage.hex) {
      throw new Error("Project hex/name is not set!");
    }
    this.updateStage({ step: DownloadStep.WebUsbChooseMicrobit });
    await this.flashMicrobit(stage, connectionAndFlashOptions);
  };

  flashMicrobit = async (
    stage: DownloadState,
    connectionAndFlashOptions?: ConnectionAndFlashOptions
  ) => {
    if (!stage.hex) {
      throw new Error("Project hex/name is not set!");
    }
    const { result } = await this.connectActions.requestUSBConnectionAndFlash(
      stage.hex.hex,
      this.flashingProgressCallback,
      connectionAndFlashOptions
    );
    const newStage = {
      usbDevice:
        connectionAndFlashOptions?.temporaryUsbConnection ??
        this.connectActions.getUsbConnection(),
      step:
        result === ConnectAndFlashResult.Success
          ? DownloadStep.None
          : DownloadStep.ManualFlashingTutorial,
      flashProgress: 0,
    };
    this.updateStage(newStage);
    if (newStage.step === DownloadStep.ManualFlashingTutorial) {
      downloadHex(stage.hex);
    }
  };

  private flashingProgressCallback = (progress: number) => {
    this.setState({
      ...this.state,
      step: DownloadStep.FlashingInProgress,
      flashProgress: progress,
    });
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
      case DownloadStep.UnplugBridgeMicrobit:
        return DownloadStep.ConnectBridgeMicrobit;
      case DownloadStep.ConnectCable:
      case DownloadStep.ConnectBridgeMicrobit:
        return DownloadStep.WebUsbFlashingTutorial;
      default:
        throw new Error(`Next step not accounted for: ${this.state.step}`);
    }
  };

  private getPrevStep = (): DownloadStep | undefined => {
    switch (this.state.step) {
      case DownloadStep.ChooseSameOrAnotherMicrobit: {
        return this.settings.showPreDownloadHelp
          ? DownloadStep.Help
          : undefined;
      }
      case DownloadStep.UnplugBridgeMicrobit:
        return DownloadStep.ChooseSameOrAnotherMicrobit;
      case DownloadStep.ConnectBridgeMicrobit:
        return DownloadStep.UnplugBridgeMicrobit;
      case DownloadStep.ConnectCable: {
        if (this.state.microbitToFlash !== MicrobitToFlash.Default) {
          return DownloadStep.ChooseSameOrAnotherMicrobit;
        }
        if (this.settings.showPreDownloadHelp) {
          return DownloadStep.Help;
        }
        return undefined;
      }
      case DownloadStep.ManualFlashingTutorial:
      case DownloadStep.WebUsbFlashingTutorial: {
        return !this.isBluetoothConnected() &&
          this.state.microbitToFlash === MicrobitToFlash.Same
          ? DownloadStep.ConnectBridgeMicrobit
          : DownloadStep.ConnectCable;
      }
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
  const setStage = useStore((s) => s.setDownload);
  const [settings, setSettings] = useSettings();
  const connectActions = useConnectActions();
  const {
    actions: connectionStageActions,
    status: connectionStatus,
    stage: connectionStage,
  } = useConnectionStage();
  return useMemo(
    () =>
      new DownloadProjectActions(
        stage,
        setStage,
        settings,
        setSettings,
        connectActions,
        connectionStage,
        connectionStageActions,
        connectionStatus
      ),
    [
      connectActions,
      connectionStage,
      connectionStageActions,
      connectionStatus,
      setSettings,
      setStage,
      settings,
      stage,
    ]
  );
};
