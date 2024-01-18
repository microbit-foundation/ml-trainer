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
import * as protocol from './serialProtocol';

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
                let handshakeResponse = protocol.processHandshake(msg);
                if (handshakeResponse && handshakeResponse.value === protocol.version) {
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

    // The first message we get out of the micro:bit serial buffer will likely
    // be incomplete due to the issue described before. The second message
    // should be complete, but we leave an extra retry just in case.
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
        let messages = protocol.splitMessages(this.unprocessedInput);
        this.unprocessedInput = messages.remainingInput;

        messages.messages.forEach(msg => {
          const sensorData = protocol.processPeriodicMessage(msg);
          if (sensorData) {
            // FIXME: Debug log, printing the processed data and time between messages.
            let now = Date.now();
            console.log(now - this.t, sensorData);
            this.t = now;

            inputBehaviour.accelerometerChange(
              sensorData.accelerometerX,
              sensorData.accelerometerY,
              sensorData.accelerometerZ,
            );
            if (sensorData.buttonA !== previousButtonState.A) {
              previousButtonState.A = sensorData.buttonA;
              inputBehaviour.buttonChange(sensorData.buttonA, 'A');
            }
            if (sensorData.buttonB !== previousButtonState.B) {
              previousButtonState.B = sensorData.buttonB;
              inputBehaviour.buttonChange(sensorData.buttonB, 'B');
            }
          }
        });
      }
      // TODO: Is this necessary? Will the DAPJs read() function ever return done=true?
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
  }

  // TODO: If this is only used externally to stop listening to events and it
  //       is always called together with listenToButton() to stop listening
  //       to those events as well, we should have a "disconnectInputServices()"
  //       function instead that sends the C[]STOP[] command message
  public async listenToAccelerometer(
    onAccelerometerChanged: (x: number, y: number, z: number) => void,
  ): Promise<void> {}

  public async listenToButton(
    buttonToListenFor: MBSpecs.Button,
    onButtonChanged: (state: MBSpecs.ButtonState, button: MBSpecs.Button) => void,
  ): Promise<void> {}

  // TODO: If "listenToUART()" is used to retrieve specific data or perform
  //       specific actions on the micro:bit, maybe we should abstract to
  //       that level so that it's unrelated to UART.
  public async listenToUART(onDataReceived: (data: string) => void): Promise<void> {}

  public async setLEDMatrix(matrix: number[][]): Promise<void>;

  public async setLEDMatrix(matrix: boolean[][]): Promise<void>;

  public async setLEDMatrix(matrix: unknown[][]): Promise<void> {}

  public getVersion(): MBSpecs.MBVersion {
    // TODO: This is currently hardcoded, but can be query via the serial protocol
    return 2;
  }
}

export default MicrobitSerial;
