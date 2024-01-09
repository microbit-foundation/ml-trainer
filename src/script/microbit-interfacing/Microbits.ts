/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

/**
 * Entrypoint for the Microbit facade pattern
 */
import ConnectionBehaviours from '../connection-behaviours/ConnectionBehaviours';
import { get, writable } from 'svelte/store';
import MBSpecs from './MBSpecs';
import MicrobitBluetooth from './MicrobitBluetooth';
import { outputting } from '../stores/uiStore';
import MicrobitUSB from './MicrobitUSB';
import type ConnectionBehaviour from '../connection-behaviours/ConnectionBehaviour';
import TypingUtils from '../TypingUtils';
import StaticConfiguration from '../../StaticConfiguration';
import { MicrobitConnection } from './MicrobitConnection';
import MicrobitSerial from './MicrobitSerial';

type QueueElement = {
  service: BluetoothRemoteGATTCharacteristic;
  view: DataView;
};

export enum HexOrigin {
  UNKNOWN,
  MAKECODE,
  PROPRIETARY,
}

type UARTMessageType = 'g' | 's';

/**
 * Entry point for microbit interfaces / Facade pattern
 */
class Microbits {
  public static hexFiles: { 1: string; 2: string; universal: string } = {
    1: 'firmware/ml-microbit-cpp-version-combined.hex',
    2: 'firmware/MICROBIT.hex',
    universal: 'firmware/universal-hex.hex',
  };
  private static assignedInputMicrobit: MicrobitConnection | undefined = undefined;
  private static assignedOutputMicrobit: MicrobitBluetooth | undefined = undefined;
  private static inputName: string | undefined = undefined;
  private static outputName: string | undefined = undefined;
  private static inputVersion: MBSpecs.MBVersion | undefined;
  private static outputVersion: MBSpecs.MBVersion | undefined;
  private static linkedMicrobit: MicrobitUSB | undefined = undefined;

  private static outputIO: BluetoothRemoteGATTCharacteristic | undefined;
  private static outputMatrix: BluetoothRemoteGATTCharacteristic | undefined;
  private static outputUart: BluetoothRemoteGATTCharacteristic | undefined;

  private static isInputReconnecting = false;
  private static isOutputReconnecting = false;

  private static outputOrigin = HexOrigin.UNKNOWN;
  private static inputOrigin = HexOrigin.UNKNOWN;

  private static inputBuildVersion: number | undefined = undefined;
  private static outputBuildVersion: number | undefined = undefined;

  private static inputVersionIdentificationTimeout: NodeJS.Timeout | undefined =
    undefined;
  private static outputVersionIdentificationTimeout: NodeJS.Timeout | undefined =
    undefined;

  /**
   * Maps pin to the number of times, it has been asked to turn on.
   * This is done to avoid race conditions, where one gesture tells a pin to turn off, while another tells it to turn on.
   * If map.get(1) > 0, then we should not send messages to turn off the pin.
   */
  private static ioPinMessages: Map<MBSpecs.UsableIOPin, number> = new Map<
    MBSpecs.UsableIOPin,
    number
  >();

  // Set these flags if user disconnects while reconnecting, such that the GATT server can be disconnected when
  // the micro:bit reestablishes a connection.
  private static inputFlaggedForDisconnect = false;
  private static outputFlaggedForDisconnect = false;

  private static bluetoothServiceActionQueue = writable<{
    busy: boolean;
    queue: QueueElement[];
  }>({
    busy: false,
    queue: [],
  });

  /**
   * Whether an input micro:bit is assigned
   */
  public static isInputAssigned(): boolean {
    return this.assignedInputMicrobit !== undefined;
  }

  /**
   * Whether the microbit assigned as input is currently connected
   */
  public static isInputConnected(): boolean {
    if (!this.isInputAssigned()) {
      return false;
    }
    return this.getInput().isConnected();
  }

  /**
   * Whether an output micro:bit is assigned
   */
  public static isOutputAssigned(): boolean {
    return this.assignedOutputMicrobit !== undefined;
  }

  /**
   * Whether the microbit assigned as output is currently connected
   */
  public static isOutputConnected(): boolean {
    if (!this.isOutputAssigned()) {
      return false;
    }
    return this.getOutput().isConnected();
  }

  /**
   * Whether the microbit assigned as output is currently connected
   */
  public static isOutputReady(): boolean {
    if (!this.isOutputConnected()) {
      return false;
    }
    return !(!this.outputMatrix && !this.outputIO && !this.outputUart);
  }

  /**
   * Whether a micro:bit is linked (via USB)
   */
  public static isMicrobitLinked(): boolean {
    return this.linkedMicrobit !== undefined;
  }

  /**
   * The input MicrobitBluetooth object
   */
  public static getInput(): MicrobitConnection {
    if (!this.isInputAssigned() || !this.assignedInputMicrobit) {
      throw new Error('Cannot get input microbit, it is not assigned!');
    }
    return this.assignedInputMicrobit;
  }

  /**
   * The output Microbit object
   */
  public static getOutput(): MicrobitBluetooth {
    if (!this.isOutputAssigned() || !this.assignedOutputMicrobit) {
      throw new Error('Cannot get output microbit, it is not assigned!');
    }
    return this.assignedOutputMicrobit;
  }

  /**
   * Attempts to assign and connect via bluetooth.
   * @param name The expected name of the microbit.
   * @return Returns true if the connection was successful, else false.
   */
  public static async assignBluetoothInput(name: string): Promise<boolean> {
    // This function is long, and ought to be split up to make it easier to understand, but this is the short explanation
    // The goal is to save a MicrobitBluetooth instance to the field this.assignedInputMicrobit.
    // To do this we create a bluetooth connection, `MicrobitBluetooth.createMicrobitBluetooth`
    // This function needs a lot of callbacks to handle behaviours for connection, reconnection, disconnection, etc.
    //    These callbacks are what makes this function so long, as they are dependent on the state of the application
    if (name.length !== 5) {
      throw new Error('Could not connect, the name specified must be of length 5!');
    }
    const connectionBehaviour = ConnectionBehaviours.getInputBehaviour();

    const onInitialInputConnect = (microbit: MicrobitBluetooth) => {
      this.assignedInputMicrobit = microbit;
      this.inputName = name;

      connectionBehaviour.onConnected(name);
      Microbits.listenToInputServices()
        .then(() => {
          connectionBehaviour.onReady();
        })
        .catch(reason => {
          console.log(reason);
        });
    };

    const onInputDisconnect = (manual?: boolean) => {
      this.inputBuildVersion = undefined;
      if (this.isInputOutputTheSame()) {
        ConnectionBehaviours.getOutputBehaviour().onDisconnected();
      }
      if (manual) {
        if (this.isInputAssigned()) {
          ConnectionBehaviours.getInputBehaviour().onExpelled(manual, true);
          ConnectionBehaviours.getOutputBehaviour().onExpelled(manual, true);
          this.clearAssignedOutputReference();
          this.clearAssignedInputReference();
        }
      } else {
        connectionBehaviour.onDisconnected();
        this.isInputReconnecting = true;
      }
      this.clearBluetoothServiceActionQueue();
    };

    const onInputReconnect = (microbit: MicrobitBluetooth) => {
      this.isInputReconnecting = false;
      if (this.inputFlaggedForDisconnect) {
        // User has disconnected during the reconnect process,
        // and the connection was reestablished, disconnect safely
        void this.disconnectInputSafely(microbit);
        this.inputFlaggedForDisconnect = false;
        return;
      }
      this.inputName = name;
      this.assignedInputMicrobit = microbit;
      if (this.isInputOutputTheSame()) {
        ConnectionBehaviours.getOutputBehaviour().onConnected(name);
      }
      connectionBehaviour.onConnected(name);
      Microbits.listenToInputServices()
        .then(() => {
          clearTimeout(this.inputVersionIdentificationTimeout);
          if (this.isInputOutputTheSame()) {
            this.assignedOutputMicrobit = microbit;
            this.inputName = name;
            Microbits.listenToOutputServices()
              .then(() => {
                clearTimeout(this.outputVersionIdentificationTimeout);
                connectionBehaviour.onReady();
                ConnectionBehaviours.getOutputBehaviour().onReady();
              })
              .catch(reason => {
                console.error(reason);
              });
          } else {
            connectionBehaviour.onReady();
          }
        })
        .catch(reason => {
          console.error(reason);
        });
    };

    const onInputReconnectFailed = () => {
      ConnectionBehaviours.getInputBehaviour().onExpelled(false, true);
      ConnectionBehaviours.getOutputBehaviour().onExpelled(false, true);
      this.clearAssignedOutputReference();
    };

    try {
      const request = await MicrobitBluetooth.requestDevice(
        name,
        this.onFailedConnection(connectionBehaviour),
      );
      await MicrobitBluetooth.createMicrobitBluetooth(
        request,
        onInitialInputConnect,
        onInputDisconnect,
        this.onFailedConnection(connectionBehaviour),
        onInputReconnect,
        onInputReconnectFailed,
      );

      connectionBehaviour.onAssigned(this.getInput(), name);
      this.inputName = name;
      this.inputVersion = this.getInput().getVersion();
      return true;
    } catch (e) {
      console.error(e);
      this.onFailedConnection(connectionBehaviour)(e as Error);
    }
    return false;
  }

  /**
   * Attempts to assign and connect via serial.
   * @param name The expected name of the microbit.
   * @return Returns true if the connection was successful, else false.
   */
  public static async assignSerialInput(name: string): Promise<boolean> {
    if (name.length !== 5) {
      throw new Error('Could not connect, the name specified must be of length 5!');
    }

    const onInputDisconnect = (manual?: boolean) => {
      this.inputBuildVersion = undefined;
      if (manual) {
        if (this.isInputAssigned()) {
          ConnectionBehaviours.getInputBehaviour().onExpelled(manual, true);
          ConnectionBehaviours.getOutputBehaviour().onExpelled(manual, true);
          this.clearAssignedOutputReference();
          this.clearAssignedInputReference();
        }
      } else {
        connectionBehaviour.onDisconnected();
        this.isInputReconnecting = true;
      }
    };

    const connectionBehaviour = ConnectionBehaviours.getInputBehaviour();

    const microbitSerial = new MicrobitSerial(Microbits.getLinked(), onInputDisconnect);
    // Debug:
    (this as any).serial = microbitSerial;

    this.assignedInputMicrobit = microbitSerial;
    this.inputName = name;
    connectionBehaviour.onConnected(name);
    microbitSerial
      .listenToInputServices(connectionBehaviour, () => {})
      .then(() => {
        connectionBehaviour.onReady();
      })
      .catch(reason => {
        console.log(reason);
      });

    connectionBehaviour.onAssigned(this.getInput(), name);
    this.inputName = name;
    this.inputVersion = this.getInput().getVersion();
    return true;
  }

  /**
   * For some reason, the function getPrimaryServices bricks if we do not listen to services before disconnecting
   * GATT server. Therefore, this function must be called if we intend to disconnect before listening to services
   * @param microbit The microbit we wish to disconnect from
   * @private
   */
  private static async disconnectInputSafely(
    microbit: MicrobitConnection,
  ): Promise<void> {
    await microbit.listenToAccelerometer(TypingUtils.emptyFunction);
    await microbit.listenToButton('A', TypingUtils.emptyFunction);
    await microbit.listenToButton('B', TypingUtils.emptyFunction);
    microbit.disconnect();
  }

  private static async listenToInputServices(): Promise<void> {
    const connectionBehaviour = ConnectionBehaviours.getInputBehaviour();
    if (!this.isInputConnected()) {
      throw new Error('Could not listen to services, no microbit connected!');
    }
    await this.getInput().listenToAccelerometer(
      connectionBehaviour.accelerometerChange.bind(connectionBehaviour),
    );
    await this.getInput().listenToButton(
      'A',
      connectionBehaviour.buttonChange.bind(connectionBehaviour),
    );
    await this.getInput().listenToButton(
      'B',
      connectionBehaviour.buttonChange.bind(connectionBehaviour),
    );
    try {
      await this.getInput().listenToUART(data => this.inputUartHandler(data));
    } catch (error) {
      console.error(error);
    }
    this.inputVersionIdentificationTimeout = setTimeout(() => {
      connectionBehaviour.onIdentifiedAsOutdated();
    }, StaticConfiguration.versionIdentificationTimeoutDuration);
  }

  private static async listenToOutputServices(): Promise<void> {
    const connectionBehaviour = ConnectionBehaviours.getOutputBehaviour();

    if (!this.isOutputConnected()) {
      throw new Error('Could not listen to services, no microbit connected!');
    }
    this.outputIO = await this.getIOOf(this.getOutput());
    this.outputMatrix = await this.getMatrixOf(this.getOutput());
    const uartService = await this.getOutput().getUARTService();
    this.outputUart = await uartService.getCharacteristic(
      MBSpecs.Characteristics.UART_DATA_RX,
    );
    this.outputVersionIdentificationTimeout = setTimeout(() => {
      connectionBehaviour.onIdentifiedAsOutdated();
    }, StaticConfiguration.versionIdentificationTimeoutDuration);
    try {
      await this.getOutput().listenToUART(data => this.outputUartHandler(data));
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Attempts to assign and connect via bluetooth.
   * @param name The expected name of the microbit.
   * @return Returns true if the connection was successful, else false.
   */
  public static async assignOutput(name: string): Promise<boolean> {
    console.assert(name.length == 5);

    const connectionBehaviour: ConnectionBehaviour =
      ConnectionBehaviours.getOutputBehaviour();

    const onInitialOutputConnect = (microbit: MicrobitBluetooth) => {
      this.assignedOutputMicrobit = microbit;
      connectionBehaviour.onConnected(name);
      this.listenToOutputServices()
        .then(() => {
          connectionBehaviour.onReady();
        })
        .catch(e => {
          console.log(e);
        });
    };

    const onOutputDisconnect = (manual?: boolean) => {
      this.outputBuildVersion = undefined;
      if (manual) {
        if (this.isOutputAssigned()) {
          ConnectionBehaviours.getOutputBehaviour().onExpelled(manual);
          this.clearAssignedOutputReference();
        }
      } else {
        this.isOutputReconnecting = true;
        ConnectionBehaviours.getOutputBehaviour().onDisconnected();
      }
      this.clearBluetoothServiceActionQueue();
    };

    const onOutputReconnect = (microbit: MicrobitBluetooth) => {
      this.isOutputReconnecting = false;
      if (this.outputFlaggedForDisconnect) {
        this.outputFlaggedForDisconnect = false;
        void this.disconnectOutputSafely(microbit);
        return;
      }
      this.assignedOutputMicrobit = microbit;
      connectionBehaviour.onConnected(name);
      this.listenToOutputServices()
        .then(() => {
          connectionBehaviour.onReady();
        })
        .catch(e => {
          console.log(e);
        });
    };

    const onOutputReconnectFailed = () => {
      connectionBehaviour.onExpelled(false, false);
    };

    try {
      const bluetoothDevice = await MicrobitBluetooth.requestDevice(
        name,
        this.onFailedConnection(connectionBehaviour),
      );
      await MicrobitBluetooth.createMicrobitBluetooth(
        bluetoothDevice,
        onInitialOutputConnect,
        onOutputDisconnect,
        this.onFailedConnection(connectionBehaviour),
        onOutputReconnect,
        onOutputReconnectFailed,
      );
      connectionBehaviour.onAssigned(this.getOutput(), name);
      this.outputName = name;
      this.outputVersion = this.getOutput().getVersion();
      return true;
    } catch (e) {
      this.onFailedConnection(connectionBehaviour)(e as Error);
    }
    return false;
  }

  private static inputUartHandler(data: string) {
    const connectionBehaviour = ConnectionBehaviours.getInputBehaviour();
    if (data === 'id_mkcd') {
      this.inputOrigin = HexOrigin.MAKECODE;
      connectionBehaviour.onIdentifiedAsMakecode();
    }
    if (data === 'id_prop') {
      this.inputOrigin = HexOrigin.PROPRIETARY;
      connectionBehaviour.onIdentifiedAsProprietary();
    }
    if (data.includes('vi_')) {
      const version = parseInt(data.substring(3));
      this.inputBuildVersion = version;
      if (this.isInputOutputTheSame()) {
        clearTimeout(this.outputVersionIdentificationTimeout);
      }
      clearTimeout(this.inputVersionIdentificationTimeout);
      connectionBehaviour.onVersionIdentified(version);
      const isOutdated = StaticConfiguration.isMicrobitOutdated(
        this.inputOrigin,
        version,
      );
      if (isOutdated) {
        connectionBehaviour.onIdentifiedAsOutdated();
      }
    }
    connectionBehaviour.onUartMessageReceived(data);
  }

  private static outputUartHandler(data: string) {
    const connectionBehaviour = ConnectionBehaviours.getOutputBehaviour();
    if (data === 'id_mkcd') {
      this.outputOrigin = HexOrigin.MAKECODE;
      connectionBehaviour.onIdentifiedAsMakecode();
    }
    if (data === 'id_prop') {
      this.outputOrigin = HexOrigin.PROPRIETARY;
      connectionBehaviour.onIdentifiedAsProprietary();
    }
    if (data.includes('vi_')) {
      clearTimeout(this.outputVersionIdentificationTimeout);
      const version = parseInt(data.substring(3));
      this.outputBuildVersion = version;
      connectionBehaviour.onVersionIdentified(version);
      const isOutdated = StaticConfiguration.isMicrobitOutdated(
        this.outputOrigin,
        version,
      );
      if (isOutdated) {
        connectionBehaviour.onIdentifiedAsOutdated();
      }
    }
    connectionBehaviour.onUartMessageReceived(data);
  }

  private static onFailedConnection(behaviour: ConnectionBehaviour) {
    return (err: Error) => {
      if (err) {
        if (
          err.message &&
          err.message.includes('User cancelled the requestDevice() chooser')
        ) {
          // User just cancelled
          behaviour.onCancelledBluetoothRequest();
        } else {
          behaviour.onConnectionError(err);
        }
      } else {
        behaviour.onConnectionError('Unknown error');
      }
    };
  }

  /**
   * For some reason, the function getPrimaryServices bricks if we do not listen to services before disconnecting
   * GATT server. Therefore, this function must be called if we intend to disconnect before listening to services
   * @param microbit The microbit we wish to disconnect from
   * @private
   */
  private static async disconnectOutputSafely(
    microbit: MicrobitBluetooth,
  ): Promise<void> {
    await this.getIOOf(microbit);
    await this.getMatrixOf(microbit);
    const uartService = await microbit.getUARTService();
    await uartService.getCharacteristic(MBSpecs.Characteristics.UART_DATA_RX);
    microbit.disconnect();
  }

  /**
   * Returns the reference to the connected output microbit. Throws error if none are connected.
   */
  public static getAssignedOutput(): MicrobitConnection {
    if (!this.assignedOutputMicrobit) {
      throw new Error('No output microbit has been assigned!');
    }
    return this.assignedOutputMicrobit;
  }

  /**
   * Returns the reference to the connected input microbit. Throws error if none are connected.
   */
  public static getAssignedInput(): MicrobitConnection {
    if (!this.assignedInputMicrobit) {
      throw new Error('No input microbit has been assigned!');
    }
    return this.assignedInputMicrobit;
  }

  /**
   * Compares the input/output bluetooth device IDs to determine if they are the same device.
   */
  public static isInputOutputTheSame() {
    if (!this.isOutputAssigned() || !this.isInputAssigned()) {
      return false;
    }
    return false;
    // return this.getInput().getDevice().id == this.getOutput().getDevice().id;
  }

  /**
   * Expels the output and output microbit, disconnecting it without attempting to reconnect.
   * If the function is called while the micro:bit is reconnecting, it will be disconnected as soon as it has connected.
   * @throws {Error} Throws an error if no micro:bit is assigned.
   */
  public static expelInputAndOutput() {
    if (!this.isInputAssigned() && !this.isOutputAssigned()) {
      throw new Error('Could not disconnect microbits, none have been connected yet!');
    }

    if (this.isInputOutputTheSame()) {
      // If they are the same, it suffices to disconnect one of them, doesn't matter which(in or output).
      ConnectionBehaviours.getInputBehaviour().onExpelled(true, true);
      ConnectionBehaviours.getOutputBehaviour().onExpelled(true, true);
      this.disconnectOrFlagInputGATT();
    } else {
      // Input and output are not the same, expel both of them
      if (this.isOutputAssigned()) {
        ConnectionBehaviours.getOutputBehaviour().onExpelled(true, true);
        this.disconnectOrFlagOutputGATT();
      }
      if (this.isInputAssigned()) {
        ConnectionBehaviours.getInputBehaviour().onExpelled(true, true);
        this.disconnectOrFlagInputGATT();
      }
    }
    this.clearAssignedInputReference();
    this.clearAssignedOutputReference();
  }

  /**
   * Expels the output microbit, disconnecting it without attempting to reconnect.
   * If the function is called while the micro:bit is reconnecting, it will be disconnected as soon as it has connected.
   * @throws {Error} Throws an error if no output micro:bit is assigned.
   */
  public static expelOutput() {
    if (!this.isOutputAssigned()) {
      throw new Error('Cannot disconnect, no output micro:bit is connected');
    }
    ConnectionBehaviours.getOutputBehaviour().onExpelled(true);
    if (this.isInputOutputTheSame()) {
      this.clearAssignedOutputReference();
      void this.setGladSmiley(this.getInput());
    } else {
      this.disconnectOrFlagOutputGATT();
      this.clearAssignedOutputReference();
    }
  }

  /**
   * Expels the input microbit, disconnecting it without attempting to reconnect.
   * If the function is called while the micro:bit is reconnecting, it will be disconnected as soon as it has connected.
   * @throws {Error} Throws an error if no input micro:bit is assigned.
   */
  public static expelInput() {
    if (!this.isInputAssigned()) {
      throw new Error('Cannot disconnect, no input micro:bit is connected');
    }
    ConnectionBehaviours.getInputBehaviour().onExpelled(true);
    if (this.isInputOutputTheSame()) {
      this.expelInputAndOutput();
    } else {
      this.disconnectOrFlagInputGATT();
      this.clearAssignedInputReference();
    }
  }

  /**
   * @param { { pin: number; on: boolean }[] } data The pins and their states
   * @throws {Error} Throws an error if no output microbit is assigned, or no outputIO service could be found.
   */
  public static sendToOutputPin(data: { pin: MBSpecs.UsableIOPin; on: boolean }[]) {
    if (!this.isOutputAssigned()) {
      throw new Error('No output microbit is connected, cannot send to pin.');
    }

    if (!this.outputIO) {
      throw new Error(
        'Cannot send to output pin, have not subscribed to the IO service yet!',
      );
    }
    if (!this.ioPinMessages) {
      this.ioPinMessages = new Map<MBSpecs.UsableIOPin, number>();
    }
    for (const msg of data) {
      if (!this.ioPinMessages.has(msg.pin)) {
        this.ioPinMessages.set(msg.pin, 0); // initialise if not already initialised
      }
      const currentPinValue: number = this.ioPinMessages.get(msg.pin)!;
      const deltaValue = msg.on ? 1 : -1;
      this.ioPinMessages.set(msg.pin, Math.max(0, currentPinValue + deltaValue));
    }
    for (const [key, value] of this.ioPinMessages) {
      this.sendIOPinMessage({ pin: key, on: value != 0 });
    }
  }

  private static sendIOPinMessage(data: { pin: MBSpecs.UsableIOPin; on: boolean }) {
    const dataView = new DataView(new ArrayBuffer(2));
    dataView.setInt8(0, data.pin);
    dataView.setInt8(1, data.on ? 1 : 0);
    outputting.set({ text: `Turn pin ${data.pin} ${data.on ? 'on' : 'off'}` });
    if (!this.outputIO) {
      throw new Error(
        'Cannot send to output pin, have not subscribed to the IO service yet!',
      );
    }
    this.addToServiceActionQueue(this.outputIO, dataView);
  }

  public static resetIOPins() {
    this.ioPinMessages = new Map<MBSpecs.UsableIOPin, number>();
    if (!this.isOutputReady()) {
      return;
    }
    StaticConfiguration.supportedPins.forEach(value => {
      this.sendIOPinMessage({ pin: value, on: false });
    });
  }

  public static setOutputMatrix(matrix: boolean[]) {
    if (!this.isOutputAssigned()) {
      throw new Error('No output microbit is connected, cannot set matrix.');
    }
    if (!this.outputMatrix) {
      throw new Error(
        'Cannot send to output matrix, have not subscribed to the matrix service yet!',
      );
    }
    const dataView = new DataView(new ArrayBuffer(5));
    for (let i = 0; i < 5; i++) {
      dataView.setUint8(
        i,
        this.subarray(matrix, i * 5, 5 + i * 5).reduce(
          (byte, bool) => (byte << 1) | (bool ? 1 : 0),
          0,
        ),
      );
    }
    this.addToServiceActionQueue(this.outputMatrix, dataView);
  }

  public static getInputVersion(): MBSpecs.MBVersion {
    if (!this.inputVersion) {
      throw new Error('No version has been set, has the micro:bit been connected?');
    }

    return this.inputVersion;
  }

  public static getOutputVersion(): MBSpecs.MBVersion {
    if (!this.outputVersion) {
      throw new Error('No version has been set, has the micro:bit been connected?');
    }

    return this.outputVersion;
  }

  public static getOutputName(): string {
    if (!this.outputName) {
      throw new Error('No name has been set, has the micro:bit connected?');
    }
    return this.outputName;
  }

  public static getInputName(): string {
    if (!this.inputName) {
      throw new Error('No name has been set, has the micro:bit connected?');
    }
    return this.inputName;
  }

  /**
   * Sends a message through UART
   * @param type The type of UART message, i.e 'g' for gesture and 's' for sound
   * @param value The message
   */
  private static sendToOutputUart(type: UARTMessageType, value: string) {
    if (!this.assignedOutputMicrobit) {
      throw new Error('No output microbit has been set');
    }

    if (!this.outputUart) {
      throw new Error('Cannot send to uart. Have not subscribed to UART service yet!');
    }

    const view = MBSpecs.Utility.messageToDataview(`${type}_${value}`);

    this.addToServiceActionQueue(this.outputUart, view);
  }

  /**
   * @deprecated For older versions of hex files. Will be removed in the future
   */
  private static sendLegacySoundMessage(value: string) {
    if (!this.assignedOutputMicrobit) {
      throw new Error('No output microbit has been set');
    }

    if (!this.outputUart) {
      throw new Error('Cannot send to uart. Have not subscribed to UART service yet!');
    }

    const view = MBSpecs.Utility.messageToDataview(`s${value}`);

    this.addToServiceActionQueue(this.outputUart, view);
  }

  /**
   * Sends a sound type message, using UART
   * @param value The sound ID
   */
  public static sendUARTSoundMessageToOutput(value: string) {
    this.sendToOutputUart('s', value);
    this.sendLegacySoundMessage(value);
  }

  /**
   * Sends a gesture type message, using UART
   * @param value The gesture name
   */
  public static sendUARTGestureMessageToOutput(value: string) {
    if (!this.isOutputReady()) {
      throw new Error('No output microbit is ready to receive UART gesture messages');
    }
    this.sendToOutputUart('g', value);
  }

  /**
   * Attempts to create a connection to a USB-connected microbit
   * @returns Whether a microbit was successfully connected
   */
  public static async linkMicrobit() {
    try {
      this.linkedMicrobit = await MicrobitUSB.requestConnection();
    } catch (e) {
      console.log(e);
      return Promise.reject(e);
    }
  }

  /**
   * Gets the microbit connected through USB.
   * @returns The USB-Connected microbit
   */
  public static getLinked(): MicrobitUSB {
    if (!this.isMicrobitLinked() || !this.linkedMicrobit) {
      throw new Error('No microbit has been linked!');
    }

    return this.linkedMicrobit;
  }

  /**
   * Whether the output microbit is a makecode hex.
   * @returns True if the output microbit is from Makecode.
   */
  public static isOutputMakecode() {
    return this.outputOrigin === HexOrigin.MAKECODE;
  }

  /**
   * Whether the input microbit is a makecode hex,
   * @returns True if the input microbit is from Makecode.
   */
  public static isInputMakecode() {
    return this.inputOrigin === HexOrigin.MAKECODE;
  }

  /**
   * Flashes the appropriate hex file to the micro:bit which is connected via USB
   * @param progressCallback The callback that is fired each time the progress status is updated
   */
  public static flashHexToLinked(progressCallback: (progress: number) => void) {
    if (!this.isMicrobitLinked()) {
      throw new Error('Cannot flash to USB, none are connected!');
    }
    const version = this.getLinked().getModelNumber();
    const hex = this.hexFiles[version]; // Note: For this we CANNOT use the universal hex file (don't know why)
    return this.getLinked().flashHex(hex, progressCallback);
  }

  public static async getLinkedFriendlyName() {
    if (!this.isMicrobitLinked()) {
      throw new Error('Cannot get friendly name from USB, none are connected!');
    }
    return await this.getLinked().getFriendlyName();
  }

  public static getInputOrigin(): HexOrigin {
    return this.inputOrigin;
  }

  public static getOutputOrigin(): HexOrigin {
    return this.outputOrigin;
  }

  /**
   * Disconnects the GATT server, if available. Otherwise, it will be flagged for disconnect when it connects.
   * @private
   */
  private static disconnectOrFlagInputGATT() {
    if (!this.assignedInputMicrobit) {
      throw new Error('No input micro:bit could be found while disconnecting from GATT');
    }
    if (this.isInputReconnecting) {
      this.inputFlaggedForDisconnect = true;
    } else {
      this.assignedInputMicrobit.disconnect();
    }
  }

  /**
   * Disconnects the GATT server, if available. Otherwise, it will be flagged for disconnect when it connects.
   * @private
   */
  private static disconnectOrFlagOutputGATT() {
    if (!this.assignedOutputMicrobit) {
      throw new Error('No output micro:bit could be found while disconnecting from GATT');
    }
    if (this.isOutputReconnecting) {
      this.outputFlaggedForDisconnect = true;
    } else {
      this.assignedOutputMicrobit.disconnect();
    }
  }

  /**
   * Clears any held references to output microbit objects
   * @private
   */
  private static clearAssignedOutputReference() {
    this.assignedOutputMicrobit = undefined;
    this.outputName = undefined;
    this.outputVersion = undefined;
    this.outputIO = undefined;
    this.outputUart = undefined;
    this.outputMatrix = undefined;
  }

  /**
   * Clears any held references to output microbit objects
   * @private
   */
  private static clearAssignedInputReference() {
    this.assignedInputMicrobit = undefined;
    this.inputName = undefined;
    this.inputVersion = undefined;
  }

  private static addToServiceActionQueue(
    service: BluetoothRemoteGATTCharacteristic,
    view: DataView,
  ) {
    this.bluetoothServiceActionQueue.update(update => {
      update.queue.push({ service, view });
      return update;
    });
    this.processServiceActionQueue();
  }

  private static processServiceActionQueue() {
    if (
      get(this.bluetoothServiceActionQueue).busy ||
      get(this.bluetoothServiceActionQueue).queue.length == 0
    )
      return;
    get(this.bluetoothServiceActionQueue).busy = true;
    const { service, view } = get(this.bluetoothServiceActionQueue).queue.shift() ?? {
      service: undefined,
      view: undefined,
    };
    if (service === undefined) {
      throw new Error(
        'Could not process the service queue, an element in the queue was not provided with a service to execute on.',
      );
    }

    service
      .writeValue(view)
      .then(() => {
        get(this.bluetoothServiceActionQueue).busy = false;
        this.processServiceActionQueue();
      })
      .catch(err => {
        // Catches a characteristic not found error, preventing further output.
        // Why does this happens is not clear
        console.error(err);
        if (err) {
          if ((err as DOMException).message.includes('GATT Service no longer exists')) {
            this.listenToOutputServices()
              .then(() => {
                console.log('Attempted to fix missing gatt!');
              })
              .catch(() => {
                console.error(
                  'Failed to fix missing GATT service issue. Uncharted territory',
                );
              });
          }
        }

        get(this.bluetoothServiceActionQueue).busy = false;
        this.processServiceActionQueue();
      });
  }

  private static async getMatrixOf(
    mb: MicrobitBluetooth,
  ): Promise<BluetoothRemoteGATTCharacteristic> {
    if (!mb) {
      throw new Error('Cannot get matrix of undefined microbit');
    }
    const LEDService = await mb.getLEDService();
    return await LEDService.getCharacteristic(MBSpecs.Characteristics.LED_MATRIX_STATE);
  }

  private static async getIOOf(
    mb: MicrobitBluetooth,
  ): Promise<BluetoothRemoteGATTCharacteristic> {
    if (!mb) {
      throw new Error('Cannot get IO of undefined microbit.');
    }
    const IOService = await mb.getIOService();
    return await IOService.getCharacteristic(MBSpecs.Characteristics.IO_DATA);
  }

  private static subarray<T>(arr: T[], start: number, end: number): T[] {
    const newArr: T[] = [];
    for (let i = start; i < end; i++) {
      newArr.push(arr[i]);
    }
    return newArr;
  }

  private static clearBluetoothServiceActionQueue() {
    this.bluetoothServiceActionQueue.set({ busy: false, queue: [] });
  }

  private static async setGladSmiley(mb: MicrobitConnection) {
    try {
      await mb.setLEDMatrix([
        [0, 0, 0, 0, 0],
        [0, 1, 0, 1, 0],
        [0, 0, 0, 0, 0],
        [1, 0, 0, 0, 1],
        [0, 1, 1, 1, 0],
      ]);
    } catch (e) {
      console.log(e);
    }
  }
}

export default Microbits;
