/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import InputBehaviour from '../connection-behaviours/InputBehaviour';
import MBSpecs from './MBSpecs';
import { MicrobitConnection } from './MicrobitConnection';
import MicrobitUSB from './MicrobitUSB';
import * as protocol from './serialProtocol';

const enum SerialProtocolState {
  AwaitingHandshakeResponse,
  Running,
}

class MicrobitSerial implements MicrobitConnection {
  private serialProtocolState = SerialProtocolState.AwaitingHandshakeResponse;
  private unprocessedInput = '';

  constructor(
    private usb: MicrobitUSB,
    private onDisconnect: (manual?: boolean) => void,
  ) {}

  isSameDevice(other: MicrobitConnection): boolean {
    return (
      other instanceof MicrobitSerial &&
      other.usb.getSerialNumber() === this.usb.getSerialNumber()
    );
  }

  public async listenToInputServices(
    inputBehaviour: InputBehaviour,
    _inputUartHandler: (data: string) => void,
  ): Promise<void> {
    this.serialProtocolState = SerialProtocolState.AwaitingHandshakeResponse;

    let previousButtonState = { A: 0, B: 0 };
    await this.usb.startSerial(data => {
      this.unprocessedInput += data;
      let messages = protocol.splitMessages(this.unprocessedInput);
      this.unprocessedInput = messages.remainingInput;
      messages.messages.forEach(async msg => {
        if (this.serialProtocolState === SerialProtocolState.AwaitingHandshakeResponse) {
          let handshakeResponse = protocol.processHandshake(msg);
          if (handshakeResponse && handshakeResponse.value === protocol.version) {
            this.serialProtocolState = SerialProtocolState.Running;

            // Request the micro:bit to start sending the periodic messages
            const startCmd = protocol.generateCommand(protocol.CommandTypes.Start);
            await this.usb.serialWrite(startCmd.message);
          }
        } else {
          const sensorData = protocol.processPeriodicMessage(msg);
          if (sensorData) {
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
        }
      });
    });

    // There is an issue where we cannot read data out from the micro:bit serial
    // buffer until the buffer has been filled.
    // As a workaround we can spam the micro:bit with handshake messages until
    // enough responses have been queued in the buffer to fill it and the data
    // starts to flow.
    let attempts = 0;
    while (
      this.serialProtocolState == SerialProtocolState.AwaitingHandshakeResponse &&
      attempts++ < 20
    ) {
      const handshakeCmd = protocol.generateCommand(protocol.CommandTypes.Handshake);
      console.log(`Sending handshake ${handshakeCmd.message}`);
      await this.usb.serialWrite(handshakeCmd.message);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (this.serialProtocolState === SerialProtocolState.AwaitingHandshakeResponse) {
      throw new Error('Handshake not received');
    }
  }

  public isConnected(): boolean {
    return this.usb.isSerialConnected();
  }

  public disconnect(): void {
    // Weirdly this disconnects the CortexM...
    this.usb.disconnect();
    this.onDisconnect(true);
    this.unprocessedInput = '';
    this.usb.stopSerial().catch(e => {
      // It's hard to make disconnect() async so we've left this as a background error for now.
      console.error(e);
    });
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
    return this.usb.getModelNumber();
  }
}

export default MicrobitSerial;
