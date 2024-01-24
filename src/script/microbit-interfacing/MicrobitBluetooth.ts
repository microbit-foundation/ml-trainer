/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { isDevMode } from '../environment';
import TypingUtils from '../TypingUtils';
import InputBehaviour from '../connection-behaviours/InputBehaviour';
import MBSpecs from './MBSpecs';
import { MicrobitConnection } from './MicrobitConnection';

/**
 * UART data target. For fixing type compatibility issues.
 */
type CharacteristicDataTarget = EventTarget & {
  value: DataView;
};

/**
 * The connection to the micro:bit.
 */
export class MicrobitBluetooth implements MicrobitConnection {
  private readonly device: BluetoothDevice;

  private dcListener: OmitThisParameter<(event: Event) => void>;
  private uartListener: (data: string) => void;

  /**
   * Constructs a bluetooth connection object. Should not be called directly.
   * Use MicrobitBluetooth.createConnection instead.
   *
   *    The microbit device to connect to.
   *    Callback to be called when the connection is established.
   * @param {BluetoothRemoteGATTServer} gattServer
   *      The gattServer, that has been attached to this micro:bit.
   * @param {MBSpecs.MBVersion} microbitVersion
   *      The version of micro:bit.
   * @param {boolean => void} onDisconnect
   *      Fired when the micro:bit disconnects.
   * @param onReconnect
   * 		What happens when the microbit reconnects after lost connection (leave undefined to turn off reconnect)
   * @param onReconnectFailed What should happen when the microbit fails to reconnect?
   */
  protected constructor(
    private gattServer: BluetoothRemoteGATTServer,
    private microbitVersion: MBSpecs.MBVersion,
    private onDisconnect: (manual?: boolean) => void,
    private onReconnect: (microbit: MicrobitBluetooth) => void,
    private onReconnectFailed: () => void,
  ) {
    this.dcListener = this.disconnectListener.bind(this);
    this.uartListener = TypingUtils.emptyFunction;
    this.device = gattServer.device;
    this.device.addEventListener('gattserverdisconnected', this.dcListener);
  }

  isSameDevice(other: MicrobitConnection): boolean {
    return other instanceof MicrobitBluetooth && other.device.id === this.device.id;
  }

  public async listenToInputServices(
    inputBehaviour: InputBehaviour,
    inputUartHandler: (data: string) => void,
  ): Promise<void> {
    await this.listenToAccelerometer(
      inputBehaviour.accelerometerChange.bind(inputBehaviour),
    );
    await this.listenToButton('A', inputBehaviour.buttonChange.bind(inputBehaviour));
    await this.listenToButton('B', inputBehaviour.buttonChange.bind(inputBehaviour));
    try {
      await this.listenToUART(data => inputUartHandler(data));
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * @returns {Promise<BluetoothRemoteGATTService>} The UART service of the micro:bit.
   */
  public async getUARTService(): Promise<BluetoothRemoteGATTService> {
    return await this.getService(MBSpecs.Services.UART_SERVICE);
  }

  /**
   * @returns {Promise<BluetoothRemoteGATTService>} The accelerometer service of the micro:bit.
   */
  public async getAccelerometerService(): Promise<BluetoothRemoteGATTService> {
    return await this.getService(MBSpecs.Services.ACCEL_SERVICE);
  }

  /**
   * @returns {Promise<BluetoothRemoteGATTService>} The button service of the micro:bit.
   */
  public async getButtonService(): Promise<BluetoothRemoteGATTService> {
    return await this.getService(MBSpecs.Services.BUTTON_SERVICE);
  }

  /**
   * @returns {Promise<BluetoothRemoteGATTService>} The device information service of the micro:bit.
   */
  public async getDeviceInfoService(): Promise<BluetoothRemoteGATTService> {
    return await this.getService(MBSpecs.Services.DEVICE_INFO_SERVICE);
  }

  /**
   * @returns {Promise<BluetoothRemoteGATTService>} The LED service of the micro:bit.
   */
  public async getLEDService(): Promise<BluetoothRemoteGATTService> {
    return await this.getService(MBSpecs.Services.LED_SERVICE);
  }

  /**
   * @returns {Promise<BluetoothRemoteGATTService>} The IO service of the micro:bit.
   */
  public async getIOService(): Promise<BluetoothRemoteGATTService> {
    return await this.getService(MBSpecs.Services.IO_SERVICE);
  }

  /**
   * Whether the connection is currently established.
   * @return {boolean} True if the connection is established, false otherwise.
   */
  public isConnected(): boolean {
    return this.gattServer.connected;
  }

  /**
   * @returns {MBSpecs.MBVersion} The version of the micro:bit.
   */
  public getVersion(): MBSpecs.MBVersion {
    return this.microbitVersion;
  }

  /**
   * Disconnects from the micro:bit.
   */
  public disconnect(): void {
    if (this.isConnected()) {
      this.device.removeEventListener('gattserverdisconnected', this.dcListener);
      this.gattServer.disconnect();
      this.disconnectEventHandler(true);
    }
  }

  private uartIncomingMessageHandler(data: string): void {
    this.uartListener(data);
  }

  /**
   * Listen to the UART data transmission characteristic.
   *
   * Note: The limit for UART messages are 20 bytes. If messages larger than 20 bytes are
   * received, they will trigger the given 'onDataReceived' multiple times
   *
   * @param {(string) => void} onDataReceived Callback to be called when data is received.
   */
  public async listenToUART(onDataReceived: (data: string) => void): Promise<void> {
    this.uartListener = onDataReceived;
    const uartService: BluetoothRemoteGATTService = await this.getUARTService();
    const uartTXCharacteristic: BluetoothRemoteGATTCharacteristic =
      await uartService.getCharacteristic(MBSpecs.Characteristics.UART_DATA_TX);

    await uartTXCharacteristic.startNotifications();

    uartTXCharacteristic.addEventListener(
      'characteristicvaluechanged',
      (event: Event) => {
        // Convert the data to a string.
        const receivedData: number[] = [];
        const target: CharacteristicDataTarget = event.target as CharacteristicDataTarget;
        for (let i = 0; i < target.value.byteLength; i += 1) {
          receivedData[i] = target.value.getUint8(i);
        }
        const receivedString = String.fromCharCode.apply(null, receivedData);
        this.uartIncomingMessageHandler(receivedString);
      },
    );
  }

  /**
   * @param {MBSpecs.Button} buttonToListenFor
   *      The button to listen to.
   * @param {(MBSpecs.ButtonState, MBSpecs.Button) => void} onButtonChanged
   *      Button change callback.
   */
  public async listenToButton(
    buttonToListenFor: MBSpecs.Button,
    onButtonChanged: (state: MBSpecs.ButtonState, button: MBSpecs.Button) => void,
  ): Promise<void> {
    const buttonService: BluetoothRemoteGATTService = await this.getButtonService();

    // Select the correct characteristic to listen to.
    const UUID =
      buttonToListenFor === 'A'
        ? MBSpecs.Characteristics.BUTTON_A
        : MBSpecs.Characteristics.BUTTON_B;
    const buttonCharacteristic: BluetoothRemoteGATTCharacteristic =
      await buttonService.getCharacteristic(UUID);

    await buttonCharacteristic.startNotifications();

    buttonCharacteristic.addEventListener(
      'characteristicvaluechanged',
      (event: Event) => {
        const target: CharacteristicDataTarget = event.target as CharacteristicDataTarget;
        const stateId = target.value.getUint8(0);
        let state: MBSpecs.ButtonState = MBSpecs.ButtonStates.Released;
        if (stateId === 1) {
          state = MBSpecs.ButtonStates.Pressed;
        }
        if (stateId === 2) {
          state = MBSpecs.ButtonStates.LongPressed;
        }

        onButtonChanged(state, buttonToListenFor);
      },
    );
  }

  /**
   * @param {(number, number, number) => void} onAccelerometerChanged Callback to be executed when the accelerometer changes.
   */
  public async listenToAccelerometer(
    onAccelerometerChanged: (x: number, y: number, z: number) => void,
  ): Promise<void> {
    const accelerometerService: BluetoothRemoteGATTService =
      await this.getAccelerometerService();
    const accelerometerCharacteristic: BluetoothRemoteGATTCharacteristic =
      await accelerometerService.getCharacteristic(MBSpecs.Characteristics.ACCEL_DATA);

    await accelerometerCharacteristic.startNotifications();

    accelerometerCharacteristic.addEventListener(
      'characteristicvaluechanged',
      (event: Event) => {
        const target: CharacteristicDataTarget = event.target as CharacteristicDataTarget;
        const x = target.value.getInt16(0, true);
        const y = target.value.getInt16(2, true);
        const z = target.value.getInt16(4, true);
        onAccelerometerChanged(x, y, z);
      },
    );
  }

  /**
   * Display the 5x5 matrix on the micro:bit.
   *
   * @param {number[][]} matrix The matrix to display.
   */
  public async setLEDMatrix(matrix: number[][]): Promise<void>;

  /**
   * Display the 5x5 matrix on the micro:bit.
   *
   * @param {boolean[][]} matrix The matrix to display.
   */
  public async setLEDMatrix(matrix: boolean[][]): Promise<void>;

  /**
   * Display the 5x5 matrix on the micro:bit.
   *
   * @param matrix The matrix to display.
   */
  public async setLEDMatrix(matrix: unknown[][]): Promise<void> {
    if (matrix.length !== 5 || matrix[0].length !== 5) {
      throw new Error('Matrix must be 5x5');
    }

    // To match overloads we must cast the matrix to a number[][]
    let numMatrix = matrix as number[][];
    if (typeof matrix[0][0] === 'boolean') {
      const boolMatrix = matrix as boolean[][];
      numMatrix = boolMatrix.map(row => row.map(value => (value ? 1 : 0)));
    }
    const ledService: BluetoothRemoteGATTService = await this.getLEDService();
    const ledCharacteristic: BluetoothRemoteGATTCharacteristic =
      await ledService.getCharacteristic(MBSpecs.Characteristics.LED_MATRIX_STATE);

    // Create the dataview that will be sent through the bluetooth characteristic.
    const data = new Uint8Array(5);
    for (let i = 0; i < 5; i += 1) data[i] = MBSpecs.Utility.arrayToOctet(numMatrix[i]);

    const dataView = new DataView(data.buffer);

    await ledCharacteristic.writeValue(dataView);
  }

  /**
   * Reference for the disconnect listener. Makes it easier to remove it again later.
   * @param {Event} _event The disconnect event
   * @private
   */
  private disconnectListener(_event: Event): void {
    if (this.device.gatt) {
      this.device.gatt
        .connect()
        .then(() => {
          this.onReconnect(this);
        })
        .catch(e => {
          isDevMode && console.error(e);
          this.onReconnectFailed();
        });
    } else {
      isDevMode && console.error('No gatt server found!');
    }

    this.disconnectEventHandler(false);
  }

  /**
   * Fires when the micro:bit disconnects.
   */
  private disconnectEventHandler(manual?: boolean): void {
    if (this.device === undefined) return;
    this.onDisconnect(manual);
  }

  /**
   * Opens a requestDevice prompt on the browser, searching for a micro:bit with the given name.
   * @param {string} name
   *      The name of the micro:bit.
   * @param {Error => void} onRequestFailed
   *      Fired if the request failed.
   */
  public static async requestDevice(
    name: string,
    onRequestFailed: (e: Error) => void,
  ): Promise<BluetoothDevice> {
    return new Promise<BluetoothDevice>((resolve, reject) => {
      try {
        navigator.bluetooth
          .requestDevice({
            filters: [{ namePrefix: `BBC micro:bit [${name}]` }],
            optionalServices: [
              MBSpecs.Services.UART_SERVICE,
              MBSpecs.Services.ACCEL_SERVICE,
              MBSpecs.Services.DEVICE_INFO_SERVICE,
              MBSpecs.Services.LED_SERVICE,
              MBSpecs.Services.IO_SERVICE,
              MBSpecs.Services.BUTTON_SERVICE,
            ],
          })
          .then(btDevice => {
            resolve(btDevice);
          })
          .catch(e => {
            isDevMode && console.error(e);
            reject(e);
          });
      } catch (e: unknown) {
        isDevMode && console.error(e);
        onRequestFailed(e as Error);
        reject(e);
      }
    });
  }

  /**
   * Attempts to connect to the micro:bit device.
   *
   * @param {BluetoothDevice} microbitDevice
   *      The microbit device to connect to.
   * @param {BluetoothRemoteGATTServer => void} onConnect
   *      Fired when a successful connection is made.
   * @param onReconnect What should happen when the microbit reconnects
   * @param onReconnectFailed What should happen when the microbit fails to reconnect
   * @param {(boolean) => void} onDisconnect
   *      Fired when the device disconnects.
   * @param {Error => void} onConnectFailed
   *      Called when the connection failed.
   */
  public static async createMicrobitBluetooth(
    microbitDevice: BluetoothDevice,
    onConnect: (microbit: MicrobitBluetooth) => void,
    onDisconnect: (manual?: boolean) => void,
    onConnectFailed: (err: Error) => void,
    onReconnect: (microbit: MicrobitBluetooth) => void,
    onReconnectFailed: () => void,
  ): Promise<MicrobitBluetooth> {
    if (microbitDevice.gatt === undefined) {
      console.warn('Missing gatt server on microbit device:', microbitDevice);
      throw new Error('BluetoothRemoteGATTServer for microbit device is undefined');
    }
    let gattServer: BluetoothRemoteGATTServer;
    let microbitVersion: MBSpecs.MBVersion;
    try {
      gattServer = await microbitDevice.gatt.connect();
      microbitVersion = await MBSpecs.Utility.getModelNumber(gattServer);
    } catch (e: unknown) {
      onConnectFailed(e as Error);
      if (microbitDevice.gatt !== undefined) {
        // In case bluetooth was connected but some other error occurs, disconnect bluetooth to keep consistent state
        microbitDevice.gatt.disconnect();
      }
      return Promise.reject('Failed to establish a connection!');
    }

    // Create the wrapper object.
    const connection = new MicrobitBluetooth(
      gattServer,
      microbitVersion,
      onDisconnect,
      onReconnect,
      onReconnectFailed,
    );

    // fire the connect event and return the connection object
    if (gattServer.connected) {
      onConnect(connection);
    }
    return connection;
  }

  private async getService(serviceUuid: string): Promise<BluetoothRemoteGATTService> {
    try {
      return await this.gattServer.getPrimaryService(serviceUuid);
    } catch (e) {
      console.error(e);
    }
    throw new Error('Failed to get primary service!');
  }
}

export default MicrobitBluetooth;
