/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { Paths, navigate } from '../../router/paths';
import InputBehaviour from '../connection-behaviours/InputBehaviour';
import MBSpecs from './MBSpecs';
import { MicrobitConnection } from './MicrobitConnection';
import MicrobitUSB from './MicrobitUSB';
import { processMessage } from './serial-message-processing';

const baudRate = 115200;

const writeLine = (message: string) => {
  console.log(message);
};

let unprocessedInput = '';

class MicrobitSerial implements MicrobitConnection {
  private decoder = new TextDecoderStream();
  private encoder = new TextEncoderStream();
  private reader = this.decoder.readable.getReader();
  private writer = this.encoder.writable.getWriter();

  private connected = false;

  constructor(
    private usb: MicrobitUSB,
    private onDisconnect: (manual?: boolean) => void,
  ) {}

  // public async connect(): Promise<void> {
  //   await this.streamData(this.usb.serialPort, { baudRate });
  // }

  public async listenToInputServices(inputBehaviour: InputBehaviour, _inputUartHandler: (data: string) => void): Promise<void> {
    this.streamData(this.usb.serialPort, { baudRate }, inputBehaviour);
  }

  private async streamData(
    serialPort: SerialPort,
    options: SerialOptions,
    inputBehaviour: InputBehaviour,
  ): Promise<void> {
    try {
      await serialPort.open(options);
      writeLine(`Opened with baudRate: ${options.baudRate}`);

      if (serialPort.readable && serialPort.writable) {
        this.connected = true;
        this.encoder.readable.pipeTo(serialPort.writable);
        serialPort.readable.pipeTo(this.decoder.writable);

        const listenTimeSeconds = 10
        writeLine(`Listening for ${listenTimeSeconds} seconds...`);
        // setTimeout(() => reader.cancel(), listenTimeSeconds * 1000);

        setTimeout(() => {
          // this.writer.write('C[XXXXXXXX]HS[]\n'); // Invalid handshake message which will show error on micro:bit LED screen.
          this.writer.write('C[9C515AAF]HS[]\n');
        }, 1000);

        setTimeout(() => {
          this.writer.write('C[9C515AAF]START[A,B,BL]\n');
        }, 2000);

        setInterval(() => {
          const processedInput = processMessage(unprocessedInput);
          for (const state of processedInput.states) {
            inputBehaviour.accelerometerChange(state.X, state.Y, state.Z);
          }
        }, 50);

        while (this.connected) {
          const { value, done } = await this.reader.read();
          if (value) {
            console.log(value);
            unprocessedInput += value;
          }
          if (done) {
            writeLine('Done');
            this.connected = false;
          }
        }
      }
    } catch (error) {
      console.error('There was an error', error);
    } finally {
      if (this.connected) {
        this.disconnect();
      }
    }
  }

  public listenForDisconnect(callback: (event: Event) => unknown): void {

  }

  public removeDisconnectListener(callback: (event: Event) => unknown): void {

  }

  public isConnected(): boolean {
    return true;
  }

  public disconnect(): void {
    this.connected = false;
    this.usb.disconnect();
    this.onDisconnect(true);
    navigate(Paths.HOME);
  }

  public async listenToAccelerometer(onAccelerometerChanged: (x: number, y: number, z: number) => void): Promise<void> {

  }

  public async setLEDMatrix(matrix: number[][]): Promise<void>;

  public async setLEDMatrix(matrix: boolean[][]): Promise<void>;

  public async setLEDMatrix(matrix: unknown[][]): Promise<void> {

  }

  public async listenToUART(onDataReceived: (data: string) => void): Promise<void> {

  }

  public async listenToButton(buttonToListenFor: MBSpecs.Button, onButtonChanged: (state: MBSpecs.ButtonState, button: MBSpecs.Button) => void): Promise<void> {

  }

  public getVersion(): MBSpecs.MBVersion {
    return 2;
  }
}

export default MicrobitSerial;
