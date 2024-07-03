/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import Bowser from "bowser";
import MicrobitConnection, {
  DeviceRequestStates,
  connectionConstants,
} from "./microbit-connection";
import {
  stateOnAssigned,
  stateOnConnected,
  stateOnDisconnected,
  stateOnReady,
  stateOnReconnectionAttempt,
} from "./state-updaters";
import { btSelectMicrobitDialogOnLoad } from "../stores/connectionStore";
import {
  Button,
  MicrobitVersion,
  microbitCharacteristicsUUID,
  microbitServicesUUID,
} from "./device";
import { Logging } from "../logging/logging";

const browser = Bowser.getParser(window.navigator.userAgent);
const isWindowsOS = browser.getOSName() === "Windows";

/**
 * UART data target. For fixing type compatibility issues.
 */
export type CharacteristicDataTarget = EventTarget & {
  value: DataView;
};

type UARTMessageType = "g" | "s";

type OutputCharacteristics = {
  io: BluetoothRemoteGATTCharacteristic;
  matrix: BluetoothRemoteGATTCharacteristic;
  uart: BluetoothRemoteGATTCharacteristic;
};

export class MicrobitBluetooth implements MicrobitConnection {
  inUseAs: Set<DeviceRequestStates> = new Set();

  private outputCharacteristics: OutputCharacteristics | undefined;

  // Used to avoid automatic reconnection during user triggered connect/disconnect
  // or reconnection itself.
  private duringExplicitConnectDisconnect: number = 0;

  // On ChromeOS and Mac there's no timeout and no clear way to abort
  // device.gatt.connect(), so we accept that sometimes we'll still
  // be trying to connect when we'd rather not be. If it succeeds when
  // we no longer intend to be connected then we disconnect at that
  // point. If we try to connect when a previous connection attempt is
  // still around then we wait for it for our timeout period.
  //
  // On Windows it times out after 7s.
  // https://bugs.chromium.org/p/chromium/issues/detail?id=684073
  private gattConnectPromise: Promise<MicrobitVersion | undefined> | undefined;
  private disconnectPromise: Promise<unknown> | undefined;
  private connecting = false;
  private isReconnect = false;
  private reconnectReadyPromise: Promise<void> | undefined;
  // Whether this is the final reconnection attempt.
  private finalAttempt = false;

  private outputWriteQueue: {
    busy: boolean;
    queue: Array<
      (outputCharacteristics: OutputCharacteristics) => Promise<void>
    >;
  } = {
    busy: false,
    queue: [],
  };

  constructor(
    public readonly name: string,
    public readonly device: BluetoothDevice,
    public readonly logging: Logging
  ) {
    device.addEventListener(
      "gattserverdisconnected",
      this.handleDisconnectEvent
    );
  }

  private logEvent({
    type,
    action,
    states,
  }: {
    type: string;
    action: string;
    states: DeviceRequestStates[];
  }) {
    this.logging.event({ type, message: JSON.stringify({ action, states }) });
  }

  private logError(msg: string, err: unknown) {
    this.logging.error(`${msg}: ${JSON.stringify(err)}`);
  }

  async connect(...states: DeviceRequestStates[]): Promise<void> {
    this.logEvent({
      type: this.isReconnect ? "Reconnect" : "Connect",
      action: "Bluetooth connect start",
      states,
    });
    if (this.duringExplicitConnectDisconnect) {
      this.logging.log(
        "Skipping connect attempt when one is already in progress"
      );
      // Wait for the gattConnectPromise while showing a "connecting" dialog.
      // If the user clicks disconnect while the automatic reconnect is in progress,
      // then clicks reconnect, we need to wait rather than return immediately.
      await this.gattConnectPromise;
      return;
    }
    this.duringExplicitConnectDisconnect++;
    if (this.device.gatt === undefined) {
      throw new Error(
        "BluetoothRemoteGATTServer for micro:bit device is undefined"
      );
    }
    try {
      // A previous connect might have completed in the background as a device was replugged etc.
      await this.disconnectPromise;
      this.gattConnectPromise =
        this.gattConnectPromise ??
        this.device.gatt
          .connect()
          .then(async () => {
            // We always do this even if we might immediately disconnect as disconnecting
            // without using services causes getPrimaryService calls to hang on subsequent
            // reconnect - probably a device-side issue.
            const modelNumber = await this.getModelNumber();
            // This connection could be arbitrarily later when our manual timeout may have passed.
            // Do we still want to be connected?
            if (!this.connecting) {
              this.logging.log(
                "Bluetooth GATT server connect after timeout, triggering disconnect"
              );
              this.disconnectPromise = (async () => {
                await this.disconnectInternal(false, false);
                this.disconnectPromise = undefined;
              })();
            } else {
              this.logging.log(
                "Bluetooth GATT server connected when connecting"
              );
            }
            return modelNumber;
          })
          .catch((e) => {
            if (this.connecting) {
              // Error will be logged by main connect error handling.
              throw e;
            } else {
              this.logError(
                "Bluetooth GATT server connect error after our timeout",
                e
              );
              return undefined;
            }
          })
          .finally(() => {
            this.logging.log("Bluetooth GATT server promise field cleared");
            this.gattConnectPromise = undefined;
          });

      this.connecting = true;
      //   let microbitVersion: MicrobitVersion | undefined;
      try {
        const gattConnectResult = await Promise.race([
          this.gattConnectPromise,
          new Promise<"timeout">((resolve) =>
            setTimeout(
              () => resolve("timeout"),
              connectionConstants.connectTimeoutDuration
            )
          ),
        ]);
        if (gattConnectResult === "timeout") {
          this.logging.log("Bluetooth GATT server connect timeout");
          throw new Error("Bluetooth GATT server connect timeout");
        }
        // microbitVersion = gattConnectResult;
      } finally {
        this.connecting = false;
      }

      this.logging.log(
        `Bluetooth GATT server connected ${this.device.gatt.connected}`
      );

      //   states.forEach(stateOnConnected);
      if (states.includes(DeviceRequestStates.INPUT)) {
        await this.listenToInputServices();
      }
      if (states.includes(DeviceRequestStates.OUTPUT)) {
        await this.listenToOutputServices();
      }
      states.forEach((s) => this.inUseAs.add(s));
      //   states.forEach((s) => stateOnAssigned(s, microbitVersion!));
      //   states.forEach((s) => stateOnReady(s));
      this.logEvent({
        type: this.isReconnect ? "Reconnect" : "Connect",
        action: "Bluetooth connect success",
        states,
      });
    } catch (e) {
      this.logError("Bluetooth connect error", e);
      this.logEvent({
        type: this.isReconnect ? "Reconnect" : "Connect",
        action: "Bluetooth connect failed",
        states,
      });
      await this.disconnectInternal(false);
      throw new Error("Failed to establish a connection!");
    } finally {
      this.finalAttempt = false;
      this.duringExplicitConnectDisconnect--;
    }
  }

  async disconnect(): Promise<void> {
    return this.disconnectInternal(true);
  }

  private async disconnectInternal(
    userTriggered: boolean,
    updateState: boolean = true
  ): Promise<void> {
    this.logging.log(
      `Bluetooth disconnect ${
        userTriggered ? "(user triggered)" : "(programmatic)"
      }`
    );
    this.duringExplicitConnectDisconnect++;
    try {
      if (this.device.gatt?.connected) {
        this.device.gatt?.disconnect();
      }
    } catch (e) {
      this.logError("Bluetooth GATT disconnect error (ignored)", e);
      // We might have already lost the connection.
    } finally {
      this.duringExplicitConnectDisconnect--;
    }
    this.reconnectReadyPromise = new Promise((resolve) =>
      setTimeout(resolve, 3_500)
    );
    // if (updateState) {
    //   this.inUseAs.forEach((value) =>
    //     stateOnDisconnected(
    //       value,
    //       userTriggered || this.finalAttempt
    //         ? false
    //         : this.isReconnect
    //         ? "autoReconnect"
    //         : "connect",
    //       "bluetooth"
    //     )
    //   );
    // }
  }

  async reconnect(finalAttempt: boolean = false): Promise<void> {
    this.finalAttempt = finalAttempt;
    this.logging.log("Bluetooth reconnect");
    this.isReconnect = true;
    const as = Array.from(this.inUseAs);
    if (isWindowsOS) {
      // On Windows, the micro:bit can take around 3 seconds to respond to gatt.disconnect().
      // Attempting to reconnect before the micro:bit has responded results in another
      // gattserverdisconnected event being fired. We then fail to get primaryService on a
      // disconnected GATT server.
      await this.reconnectReadyPromise;
    }
    await this.connect(...as);
  }

  handleDisconnectEvent = async (): Promise<void> => {
    this.outputWriteQueue = { busy: false, queue: [] };

    try {
      if (!this.duringExplicitConnectDisconnect) {
        this.logging.log(
          "Bluetooth GATT disconnected... automatically trying reconnect"
        );
        stateOnReconnectionAttempt();
        await this.reconnect();
      } else {
        this.logging.log(
          "Bluetooth GATT disconnect ignored during explicit disconnect"
        );
      }
    } catch (e) {
      this.logError(
        "Bluetooth connect triggered by disconnect listener failed",
        e
      );
      this.inUseAs.forEach((s) =>
        stateOnDisconnected(s, "autoReconnect", "bluetooth")
      );
    }
  };

  private assertGattServer(): BluetoothRemoteGATTServer {
    if (!this.device.gatt?.connected) {
      throw new Error("Could not listen to services, no microbit connected!");
    }
    return this.device.gatt;
  }

  private async listenToInputServices(): Promise<void> {
    await this.listenToAccelerometer();
    await this.listenToButton("A");
    await this.listenToButton("B");

    await this.listenToUART(DeviceRequestStates.INPUT);
  }

  private async listenToAccelerometer(): Promise<void> {
    const gattServer = this.assertGattServer();
    const accelerometerService = await gattServer.getPrimaryService(
      microbitServicesUUID.accelerometer
    );
    const accelerometerCharacteristic =
      await accelerometerService.getCharacteristic(
        microbitCharacteristicsUUID.accelerometer
      );
    await accelerometerCharacteristic.startNotifications();
    accelerometerCharacteristic.addEventListener(
      "characteristicvaluechanged",
      (event: Event) => {
        const target = event.target as CharacteristicDataTarget;
        const x = target.value.getInt16(0, true);
        const y = target.value.getInt16(2, true);
        const z = target.value.getInt16(4, true);
        onAccelerometerChange(x, y, z);
      }
    );
  }

  private async listenToUART(state: DeviceRequestStates): Promise<void> {
    const gattServer = this.assertGattServer();
    const uartService = await gattServer.getPrimaryService(
      microbitServicesUUID.uart
    );
    const uartTXCharacteristic = await uartService.getCharacteristic(
      microbitCharacteristicsUUID.uartDataTX
    );
    await uartTXCharacteristic.startNotifications();
    uartTXCharacteristic.addEventListener(
      "characteristicvaluechanged",
      (event: Event) => {
        // Convert the data to a string.
        const receivedData: number[] = [];
        const target = event.target as CharacteristicDataTarget;
        for (let i = 0; i < target.value.byteLength; i += 1) {
          receivedData[i] = target.value.getUint8(i);
        }
        const receivedString = String.fromCharCode.apply(null, receivedData);
        onUARTDataReceived(state, receivedString);
      }
    );
  }

  private async listenToOutputServices(): Promise<void> {
    const gattServer = this.assertGattServer();
    if (!gattServer.connected) {
      throw new Error("Could not listen to services, no microbit connected!");
    }
    const ioService = await gattServer.getPrimaryService(
      microbitServicesUUID.io
    );
    const io = await ioService.getCharacteristic(
      microbitCharacteristicsUUID.ioData
    );
    const ledService = await gattServer.getPrimaryService(
      microbitServicesUUID.led
    );
    const matrix = await ledService.getCharacteristic(
      microbitCharacteristicsUUID.ledMatrixState
    );
    const uartService = await gattServer.getPrimaryService(
      microbitServicesUUID.uart
    );
    const uart = await uartService.getCharacteristic(
      microbitCharacteristicsUUID.uartDataRX
    );
    this.outputCharacteristics = {
      io,
      matrix,
      uart,
    };
    await this.listenToUART(DeviceRequestStates.OUTPUT);
  }

  /**
   * Sends a message through UART
   * @param type The type of UART message, i.e 'g' for gesture and 's' for sound
   * @param value The message
   */
  sendToOutputUart = (type: UARTMessageType, value: string): void => {
    this.queueAction((outputCharacteristics) => {
      const view = this.messageToDataView(`${type}_${value}`);
      return outputCharacteristics.uart.writeValue(view);
    });
  };

  private messageToDataView = (message: string, delimiter = "#"): DataView => {
    if (delimiter.length != 1) {
      throw new Error("The delimiter must be 1 character long");
    }
    const fullMessage = `${message}${delimiter}`;
    const view = new DataView(new ArrayBuffer(fullMessage.length));
    for (let i = 0; i < fullMessage.length; i++) {
      view.setUint8(i, fullMessage.charCodeAt(i));
    }
    return view;
  };

  queueAction = (
    action: (outputCharacteristics: OutputCharacteristics) => Promise<void>
  ) => {
    this.outputWriteQueue.queue.push(action);
    this.processActionQueue();
  };

  processActionQueue = () => {
    if (!this.outputCharacteristics) {
      // We've become disconnected before processing all actions.
      this.outputWriteQueue = {
        busy: false,
        queue: [],
      };
      return;
    }
    if (this.outputWriteQueue.busy) {
      return;
    }
    const action = this.outputWriteQueue.queue.shift();
    if (action) {
      this.outputWriteQueue.busy = true;
      action(this.outputCharacteristics)
        .then(() => {
          this.outputWriteQueue.busy = false;
          this.processActionQueue();
        })
        .catch((e) => {
          this.logError("Error processing action queue", e);
          // Do we want to keep going if we hit errors?
          // What did it do previously?
          this.outputWriteQueue.busy = false;
          this.processActionQueue();
        });
    }
  };

  /**
   * Fetches the model number of the micro:bit.
   * @param {BluetoothRemoteGATTServer} gattServer The GATT server to read from.
   * @return {Promise<number>} The model number of the micro:bit. 1 for the original, 2 for the new.
   */
  private async getModelNumber(): Promise<MicrobitVersion> {
    this.assertGattServer();
    try {
      const deviceInfo = await this.assertGattServer().getPrimaryService(
        microbitServicesUUID.deviceInfo
      );
      const modelNumber = await deviceInfo.getCharacteristic(
        microbitCharacteristicsUUID.modelNumber
      );
      // Read the value and convert it to UTF-8 (as specified in the Bluetooth specification).
      const modelNumberValue = await modelNumber.readValue();
      const decodedModelNumber = new TextDecoder().decode(modelNumberValue);
      // The model number either reads "BBC micro:bit" or "BBC micro:bit V2.0". Still unsure if those are the only cases.
      if (decodedModelNumber.toLowerCase() === "BBC micro:bit".toLowerCase()) {
        return 1;
      }
      if (
        decodedModelNumber
          .toLowerCase()
          .includes("BBC micro:bit v2".toLowerCase())
      ) {
        return 2;
      }
      throw new Error(`Unexpected model number ${decodedModelNumber}`);
    } catch (e) {
      this.logError("Could not read model number", e);
      throw new Error("Could not read model number");
    }
  }
}

const deviceIdToConnection: Map<string, MicrobitBluetooth> = new Map();

export const startBluetoothConnection = async (
  name: string,
  requestState: DeviceRequestStates,
  logging: Logging
): Promise<MicrobitBluetooth | undefined> => {
  const device = await requestDevice(name);
  if (!device) {
    return undefined;
  }
  try {
    // Reuse our connection objects for the same device as they
    // track the GATT connect promise that never resolves.
    const bluetooth =
      deviceIdToConnection.get(device.id) ??
      new MicrobitBluetooth(name, device, logging);
    deviceIdToConnection.set(device.id, bluetooth);
    await bluetooth.connect(requestState);
    return bluetooth;
  } catch (e) {
    return undefined;
  }
};

const requestDevice = async (
  name: string
): Promise<BluetoothDevice | undefined> => {
  try {
    // In some situations the Chrome device prompt simply doesn't appear so we time this out after 30 seconds and reload the page
    const result = await Promise.race([
      navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: `BBC micro:bit [${name}]` }],
        optionalServices: Object.values(microbitServicesUUID),
      }),
      new Promise<"timeout">((resolve) =>
        setTimeout(
          () => resolve("timeout"),
          connectionConstants.requestDeviceTimeoutDuration
        )
      ),
    ]);
    if (result === "timeout") {
      btSelectMicrobitDialogOnLoad.set(true);
      window.location.reload();
      return undefined;
    }
    return result;
  } catch (e) {
    this.logError("Bluetooth request device failed/cancelled", e);
    return undefined;
  }
};
