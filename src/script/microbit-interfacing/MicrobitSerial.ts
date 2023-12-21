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
import { processInput } from './serial-message-processing';

const baudRate = 115200;

const writeLine = (message: string) => {
  console.log(message);
};

class MicrobitSerial implements MicrobitConnection {
  private decoder = new TextDecoderStream();
  private encoder = new TextEncoderStream();
  private reader = this.decoder.readable.getReader();
  private writer = this.encoder.writable.getWriter();

  private connected = false;

  private unprocessedInput = '';

  constructor(
    private usb: MicrobitUSB,
    private onDisconnect: (manual?: boolean) => void,
  ) {}

  public async listenToInputServices(
    inputBehaviour: InputBehaviour,
    _inputUartHandler: (data: string) => void,
  ): Promise<void> {
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

        writeLine(`Listening to serial device...`);

        setTimeout(() => {
          // this.writer.write('C[XXXXXXXX]HS[]\n'); // Invalid handshake message which will show error on micro:bit LED screen.
          this.writer.write('C[9C515AAF]HS[]\n');
        }, 500);

        setTimeout(() => {
          this.writer.write('C[9C515AAF]START[A,B,BL]\n');
        }, 1000);

        while (this.connected) {
          const { value, done } = await this.reader.read();
          if (value) {
            this.unprocessedInput += value;
            const processedInput = processInput(this.unprocessedInput);
            if (processedInput) {
              this.unprocessedInput = processedInput.remainingInput;
              console.log(processedInput.state);
              inputBehaviour.accelerometerChange(
                processedInput.state.accelerometerX,
                processedInput.state.accelerometerY,
                processedInput.state.accelerometerZ,
              );
            }
          }
          if (done) {
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

  public listenForDisconnect(callback: (event: Event) => unknown): void {}

  public removeDisconnectListener(callback: (event: Event) => unknown): void {}

  public isConnected(): boolean {
    return true;
  }

  public disconnect(): void {
    this.connected = false;
    this.usb.disconnect();
    this.onDisconnect(true);
    this.unprocessedInput = '';
    navigate(Paths.HOME);
  }

  public async listenToAccelerometer(
    onAccelerometerChanged: (x: number, y: number, z: number) => void,
  ): Promise<void> {}

  public async setLEDMatrix(matrix: number[][]): Promise<void>;

  public async setLEDMatrix(matrix: boolean[][]): Promise<void>;

  public async setLEDMatrix(matrix: unknown[][]): Promise<void> {}

  public async listenToUART(onDataReceived: (data: string) => void): Promise<void> {}

  public async listenToButton(
    buttonToListenFor: MBSpecs.Button,
    onButtonChanged: (state: MBSpecs.ButtonState, button: MBSpecs.Button) => void,
  ): Promise<void> {}

  public getVersion(): MBSpecs.MBVersion {
    return 2;
  }
}

export default MicrobitSerial;
