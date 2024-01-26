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
  AwaitingConfiguration,
  Ready,
  Running,
}

class MicrobitSerial implements MicrobitConnection {
  private serialProtocolState = SerialProtocolState.AwaitingHandshakeResponse;
  // TODO: The radio frequency should be randomly generated once per session.
  //       If we want a session to be restored (e.g. from local storage) and
  //       the previously flashed micro:bits to continue working without
  //       reflashing we need to store and retrieve this value somehow.
  // FIXME: Setting this to the hex files default value for now, as we need
  //        to configure the radio frequency for both micro:bits after they
  //        are flashed, not just the radio bridge.
  private static sessionRadioFrequency = 42;

  constructor(
    private usb: MicrobitUSB,
    private onDisconnect: (manual?: boolean) => void,
  ) {
    if (MicrobitSerial.sessionRadioFrequency === -1) {
      MicrobitSerial.sessionRadioFrequency = protocol.generateRandomRadioFrequency();
    }
  }

  isSameDevice(other: MicrobitConnection): boolean {
    return (
      other instanceof MicrobitSerial &&
      other.usb.getSerialNumber() === this.usb.getSerialNumber()
    );
  }

  private async sendCmdWaitResponse(
    cmd: protocol.MessageCmd,
  ): Promise<protocol.MessageResponse> {
    let unprocessedData = '';
    let responseQueue: protocol.MessageResponse[] = [];
    const onSerialResponses = (data: string): void => {
      let protocolMessages = protocol.splitMessages(unprocessedData + data);
      unprocessedData = protocolMessages.remainingInput;
      protocolMessages.messages.forEach(msg => {
        let response = protocol.processResponseMessage(msg);
        if (response) {
          responseQueue.push(response);
        }
      });
    };
    this.usb.addSerialListener(onSerialResponses);

    console.log(`Sending cmd: ${cmd.message}`);
    await this.usb.serialWrite(cmd.message);

    const timeout = Date.now() + 1000;
    while (Date.now() < timeout) {
      while (responseQueue.length !== 0) {
        let response = responseQueue.pop();
        if (
          response &&
          response.cmdType === cmd.cmdType &&
          response.messageId === cmd.messageId
        ) {
          console.log(`Cmd response received: ${response.message}`);
          this.usb.removeSerialListener(onSerialResponses);
          return response;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    this.usb.removeSerialListener(onSerialResponses);
    throw new Error(`Timeout waiting for response to ${cmd.message}`);
  }

  private async initProtocol(): Promise<void> {
    if (this.serialProtocolState !== SerialProtocolState.AwaitingHandshakeResponse) {
      return;
    }

    let unprocessedData = '';
    const processHandshakeMessage = (data: string) => {
      let messages = protocol.splitMessages(unprocessedData + data);
      unprocessedData = messages.remainingInput;
      messages.messages.forEach(async msg => {
        let messageResponse = protocol.processResponseMessage(msg);
        if (
          messageResponse &&
          messageResponse.cmdType === protocol.CommandTypes.Handshake
        ) {
          if (messageResponse.value !== protocol.version) {
            throw new Error(
              `Handshake failed. Unexpected protocol version ${protocol.version}`,
            );
          }
          this.serialProtocolState = SerialProtocolState.AwaitingConfiguration;
        }
      });
    };
    await this.usb.startSerial(processHandshakeMessage);

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
      const handshakeCmd = protocol.generateCmdHandshake().message;
      console.log(`Sending handshake ${handshakeCmd}`);
      await this.usb.serialWrite(handshakeCmd);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.usb.removeSerialListener(processHandshakeMessage);
    if (this.serialProtocolState === SerialProtocolState.AwaitingHandshakeResponse) {
      throw new Error('Handshake not received');
    }
  }

  public async setup(): Promise<void> {
    await this.initProtocol();

    // Set the radio frequency to a value unique to this session
    const radioFreqCommand = protocol.generateCmdRadioFrequency(
      MicrobitSerial.sessionRadioFrequency,
    );
    const radioFreqResponse = await this.sendCmdWaitResponse(radioFreqCommand);
    if (radioFreqResponse.value !== MicrobitSerial.sessionRadioFrequency) {
      throw new Error(
        `Failed to set radio frequency. Expected ${MicrobitSerial.sessionRadioFrequency}, got ${radioFreqResponse.value}`,
      );
    }

    this.serialProtocolState = SerialProtocolState.Ready;
  }

  public async listenToInputServices(
    inputBehaviour: InputBehaviour,
    _inputUartHandler: (data: string) => void,
  ): Promise<void> {
    if (this.serialProtocolState !== SerialProtocolState.Ready) {
      await this.setup();
    }
    let previousButtonState = { A: 0, B: 0 };

    let unprocessedData = '';
    const onSerialPeriodicMessages = (data: string) => {
      let messages = protocol.splitMessages(unprocessedData + data);
      unprocessedData = messages.remainingInput;
      messages.messages.forEach(async msg => {
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
      });
    };

    this.usb.addSerialListener(onSerialPeriodicMessages);
    // Request the micro:bit to start sending the periodic messages
    const startCmd = protocol.generateCmdStart({
      accelerometer: true,
      buttons: true,
    });
    await this.usb.serialWrite(startCmd.message);
    this.serialProtocolState = SerialProtocolState.Running;
  }

  public isConnected(): boolean {
    return this.usb.isSerialConnected();
  }

  public disconnect(): void {
    // Weirdly this disconnects the CortexM...
    this.usb.disconnect();
    this.onDisconnect(true);
    this.serialProtocolState = SerialProtocolState.AwaitingHandshakeResponse;
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
