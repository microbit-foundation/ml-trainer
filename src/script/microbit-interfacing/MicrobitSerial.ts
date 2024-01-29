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

class MicrobitSerial implements MicrobitConnection {
  // TODO: The radio frequency should be randomly generated once per session.
  //       If we want a session to be restored (e.g. from local storage) and
  //       the previously flashed micro:bits to continue working without
  //       reflashing we need to store and retrieve this value somehow.
  // FIXME: Setting this to the hex files default value for now, as we need
  //        to configure the radio frequency for both micro:bits after they
  //        are flashed, not just the radio bridge.
  private static sessionRadioFrequency = 42;
  private responseMap = new Map<
    number,
    (value: protocol.MessageResponse | PromiseLike<protocol.MessageResponse>) => void
  >();

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
    const responsePromise = new Promise<protocol.MessageResponse>((resolve, reject) => {
      this.responseMap.set(cmd.messageId, resolve);
      setTimeout(() => {
        this.responseMap.delete(cmd.messageId);
        reject(new Error('...'));
      }, 1_000);
    });
    await this.usb.serialWrite(cmd.message);
    return responsePromise;
  }

  public async listenToInputServices(
    inputBehaviour: InputBehaviour,
    _inputUartHandler: (data: string) => void,
  ): Promise<void> {
    let unprocessedData = '';
    let previousButtonState = { A: 0, B: 0 };

    const processMessage = (data: string) => {
      const messages = protocol.splitMessages(unprocessedData + data);
      unprocessedData = messages.remainingInput;
      messages.messages.forEach(async msg => {
        // Messages are either periodic sensor data or command/response
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

        const messageResponse = protocol.processResponseMessage(msg);
        if (!messageResponse) {
          return;
        }
        const responseResolve = this.responseMap.get(messageResponse.messageId);
        if (responseResolve) {
          this.responseMap.delete(messageResponse.messageId);
          responseResolve(messageResponse);
        }
      });
    };
    await this.usb.startSerial(processMessage);
    try {
      await this.handshake();

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

      // Request the micro:bit to start sending the periodic messages
      const startCmd = protocol.generateCmdStart({
        accelerometer: true,
        buttons: true,
      });
      await this.usb.serialWrite(startCmd.message);
    } catch (e) {
      this.usb.stopSerial();
      throw e;
    }
  }

  private async handshake(): Promise<void> {
    // There is an issue where we cannot read data out from the micro:bit serial
    // buffer until the buffer has been filled.
    // As a workaround we can spam the micro:bit with handshake messages until
    // enough responses have been queued in the buffer to fill it and the data
    // starts to flow.
    const handshakeResult = await new Promise<protocol.MessageResponse>(
      async (resolve, reject) => {
        const attempts = 20;
        let attemptCounter = 0;
        let failureCounter = 0;
        let resolved = false;
        while (attemptCounter < 20 && !resolved) {
          attemptCounter++;
          this.sendCmdWaitResponse(protocol.generateCmdHandshake())
            .then(value => {
              if (!resolved) {
                resolved = true;
                resolve(value);
              }
            })
            .catch(() => {
              // We expect some to time out, likely well after the handshake is completed.
              if (!resolved) {
                if (++failureCounter === attempts) {
                  reject(new Error('Handshake not completed'));
                }
              }
            });
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      },
    );
    if (handshakeResult.value !== protocol.version) {
      throw new Error(
        `Handshake failed. Unexpected protocol version ${protocol.version}`,
      );
    }
  }

  public isConnected(): boolean {
    return this.usb.isSerialConnected();
  }

  public disconnect(): void {
    // Weirdly this disconnects the CortexM...
    this.usb.disconnect();
    this.onDisconnect(true);
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
