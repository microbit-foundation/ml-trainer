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
import * as protocol from './serial-message-processing';

const writeLine = (message: string) => {
  console.log(message);
};

class MicrobitSerial implements MicrobitConnection {
  private decoder = new TextDecoderStream();
  private encoder = new TextEncoderStream();
  private reader = this.decoder.readable.getReader();
  private writer = this.encoder.writable.getWriter();

  private t = 0;

  private connected = false;

  private baudRate = 115200;

  private unprocessedInput = '';

  private periodicDataPromise: Promise<void> | undefined;

  constructor(
    private usb: MicrobitUSB,
    private onDisconnect: (manual?: boolean) => void,
  ) {}

  public async listenToInputServices(
    inputBehaviour: InputBehaviour,
    _inputUartHandler: (data: string) => void,
  ): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }
    if (this.periodicDataPromise) {
      throw new Error('Already listening');
    }
    await this.protocolHandshake();
    this.periodicDataPromise = this.streamPeriodicData(inputBehaviour);
  }

  /**
   * There is an issue where we cannot read data out from the micro:bit serial
   * buffer until the buffer has been filled.
   * As a workaround we can spam the micro:bit with handshake messages until
   * enough responses have been queued in the buffer to fill it and the data
   * starts to flow.
   */
  private async protocolHandshake(): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }

    let handshakeReceived = false;
    const readHandshakeRetry = (retries: number): Promise<string> =>
      new Promise<string>((resolve, reject) => {
        return this.reader
          .read()
          .then(({ value, done }) => {
            if (value) {
              this.unprocessedInput += value;
              let messages = protocol.splitMessages(this.unprocessedInput);
              this.unprocessedInput = messages.remainingInput;

              // TODO: Not currently looking at the responseId, as we only care
              //      about receiving *any* handshake response
              messages.messages.forEach(msg => {
                let handshakeResponseId = protocol.processHandshake(msg);
                if (handshakeResponseId) {
                  handshakeReceived = true;
                }
              });
              if (handshakeReceived) {
                return resolve('Handshake received');
              }
            }
            throw new Error('No handshake received');
          })
          .catch(reason => {
            if (retries > 0) {
              return readHandshakeRetry(retries - 1)
                .then(resolve)
                .catch(reject);
            } else {
              return reject(reason);
            }
          });
      });

    // The first message we get out of the micro:bit serial buffer might be
    // incomplete due to the issue described before. The second message should
    // be complete, but we leave an extra retry just in case.
    readHandshakeRetry(3).then(console.log).catch(console.error);

    let attempts = 0;
    while (!handshakeReceived && attempts++ < 20) {
      const handshakeCmd = protocol.generateCommand(protocol.CommandTypes.Handshake);
      writeLine(`Sending handshake ${handshakeCmd.message}`);
      await this.writer.write(handshakeCmd.message);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!handshakeReceived) {
      throw new Error('Handshake not received');
    }
  }

  private async streamPeriodicData(inputBehaviour: InputBehaviour): Promise<void> {
    // Request the micro:bit to start sending the periodic messages
    const startCmd = protocol.generateCommand(protocol.CommandTypes.Start);
    await this.writer.write(startCmd.message);
    // TODO: Unclear why we need to send this command twice, need to investigate
    await this.writer.write(startCmd.message);

    let previousButtonState = { A: 0, B: 0 };

    while (this.connected) {
      const { value, done } = await this.reader.read();
      if (value) {
        this.unprocessedInput += value;
        const processedInput = protocol.processPeriodicMessage(this.unprocessedInput);
        if (processedInput) {
          this.unprocessedInput = processedInput.remainingInput;
          let now = Date.now();
          console.log(now - this.t, processedInput.state);
          this.t = now;
          inputBehaviour.accelerometerChange(
            processedInput.state.accelerometerX,
            processedInput.state.accelerometerY,
            processedInput.state.accelerometerZ,
          );
          if (processedInput.state.buttonA !== previousButtonState.A) {
            previousButtonState.A = processedInput.state.buttonA;
            inputBehaviour.buttonChange(processedInput.state.buttonA, 'A');
          }
          if (processedInput.state.buttonB !== previousButtonState.B) {
            previousButtonState.B = processedInput.state.buttonB;
            inputBehaviour.buttonChange(processedInput.state.buttonB, 'B');
          }
        }
      }
      if (done) {
        break;
      }
    }
  }

  public listenForDisconnect(callback: (event: Event) => unknown): void {}

  public removeDisconnectListener(callback: (event: Event) => unknown): void {}

  private async connect(): Promise<void> {
    let serialPort = this.usb.serialPort;
    await serialPort.open({ baudRate: this.baudRate });
    writeLine(`Opened with baudRate: ${this.baudRate}`);
    if (serialPort.readable && serialPort.writable) {
      this.connected = true;
      this.encoder.readable.pipeTo(serialPort.writable);
      serialPort.readable.pipeTo(this.decoder.writable);
    } else {
      throw new Error('Serial port not readable or writable');
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public disconnect(): void {
    this.connected = false;
    this.usb.disconnect();
    this.onDisconnect(true);
    this.unprocessedInput = '';

    if (this.periodicDataPromise) {
      // It's hard to make disconnect() async so we've left this as a background error for now.
      this.periodicDataPromise.catch(e => {
        console.error(e);
      });
      this.periodicDataPromise = undefined;
    }

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
    // TODO: This is currently hardcoded, but can be query via the serial protocol
    return 2;
  }
}

export default MicrobitSerial;
