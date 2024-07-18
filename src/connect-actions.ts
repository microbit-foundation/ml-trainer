import { MicrobitWebUSBConnection } from "@microbit/microbit-connection";
import { ConnectionFlowType } from "./connection-stage-hooks";
import { Connections } from "./connections";
import { ConnectionStatus, ProgramType } from "./connections-hooks";
import { getFlashDataSource } from "./device/get-hex-file";
import { Logging } from "./logging/logging";

export enum ConnectAndFlashResult {
  Success,
  Failed,
  ErrorMicrobitUnsupported,
  ErrorBadFirmware,
  ErrorNoDeviceSelected,
  ErrorUnableToClaimInterface,
}

export enum BluetoothConnectResult {
  Success,
  Failed,
}

export enum RadioConnectResult {
  Success,
  Failed,
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export class ConnectActions {
  public device: MicrobitWebUSBConnection | undefined;
  constructor(private logging: Logging, private connections: Connections) {}

  requestUSBConnectionAndFlash = async (
    hexType: ConnectionFlowType,
    progressCallback: (progress: number) => void
  ): Promise<ConnectAndFlashResult> => {
    try {
      this.device = new MicrobitWebUSBConnection({ logging: this.logging });
      await this.device.connect();
      const result = await this.flashMicrobit(hexType, progressCallback);

      // Save remote micro:bit device id is stored for passing it to bridge micro:bit
      const deviceId = this.device.getDeviceId()?.toString();
      if (
        !!deviceId &&
        result === ConnectAndFlashResult.Success &&
        hexType === ConnectionFlowType.RadioRemote
      ) {
        this.connections.setConnection(ProgramType.Input, {
          status: ConnectionStatus.Disconnected,
          type: "radio",
          remoteDeviceId: deviceId,
        });
      }

      return result;
    } catch (e) {
      this.logging.error(
        `USB request device failed/cancelled: ${JSON.stringify(e)}`
      );
      return this.handleConnectAndFlashError(e);
    }
  };

  private flashMicrobit = async (
    flowType: ConnectionFlowType,
    progress: (progress: number) => void
  ): Promise<ConnectAndFlashResult> => {
    if (!this.device) {
      return ConnectAndFlashResult.Failed;
    }
    const data = getFlashDataSource(flowType);

    if (!data) {
      return ConnectAndFlashResult.ErrorMicrobitUnsupported;
    }
    try {
      await this.device.flash(data, {
        partial: true,
        progress: (v) => progress(v ?? 100),
      });
      return ConnectAndFlashResult.Success;
    } catch (e) {
      this.logging.error(`Flashing failed: ${JSON.stringify(e)}`);
      return ConnectAndFlashResult.Failed;
    }
  };

  private handleConnectAndFlashError = (
    err: unknown
  ): ConnectAndFlashResult => {
    // We might get Error objects as Promise rejection arguments
    if (
      typeof err === "object" &&
      err !== null &&
      !("message" in err) &&
      "promise" in err &&
      "reason" in err
    ) {
      err = err.reason;
    }
    if (
      typeof err !== "object" ||
      err === null ||
      !(typeof err === "object" && "message" in err)
    ) {
      return ConnectAndFlashResult.Failed;
    }

    const errMessage = err.message as string;

    // This is somewhat fragile but worth it for scenario specific errors.
    // These messages changed to be prefixed in 2023 so we've relaxed the checks.
    if (/No valid interfaces found/.test(errMessage)) {
      // This comes from DAPjs's WebUSB open.
      return ConnectAndFlashResult.ErrorBadFirmware;
    } else if (/No device selected/.test(errMessage)) {
      return ConnectAndFlashResult.ErrorNoDeviceSelected;
    } else if (/Unable to claim interface/.test(errMessage)) {
      return ConnectAndFlashResult.ErrorUnableToClaimInterface;
    } else {
      return ConnectAndFlashResult.Failed;
    }
  };

  // TODO: Replace with real connecting logic
  connectMicrobitsSerial = async (): Promise<RadioConnectResult> => {
    const programType = ProgramType.Input;

    // TODO: Use deviceId to assign to connect microbits
    const deviceId = this.connections.getRemoteDeviceId(programType);
    if (!deviceId) {
      throw new Error("Radio bridge device id not set");
    }

    await delay(5000);
    this.connections.setConnection(programType, {
      status: ConnectionStatus.Connected,
      type: "radio",
    });
    return RadioConnectResult.Success;
  };

  // TODO: Replace with real connecting logic
  connectBluetooth = async (): Promise<BluetoothConnectResult> => {
    await delay(5000);
    const isSuccess = true;
    if (isSuccess) {
      this.connections.setConnection(ProgramType.Input, {
        status: ConnectionStatus.Connected,
        type: "bluetooth",
      });
      return BluetoothConnectResult.Success;
    }
    return BluetoothConnectResult.Failed;
  };

  // TODO: Replace with real disconnect logic
  disconnect = () => {
    this.connections.setConnection(ProgramType.Input, {
      status: ConnectionStatus.Disconnected,
    });
  };
}
