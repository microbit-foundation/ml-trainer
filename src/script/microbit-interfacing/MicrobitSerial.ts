/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { logError, logMessage } from '../utils/logging';
import MicrobitConnection, { DeviceRequestStates } from './MicrobitConnection';
import MicrobitUSB from './MicrobitUSB';
import { onAccelerometerChange, onButtonChange } from './change-listeners';
import * as protocol from './serialProtocol';
import {
  stateOnAssigned,
  stateOnConnected,
  stateOnDisconnected,
  stateOnFailedToConnect,
  stateOnReady,
} from './state-updaters';

export class MicrobitSerial implements MicrobitConnection {
  private responseMap = new Map<
    number,
    (value: protocol.MessageResponse | PromiseLike<protocol.MessageResponse>) => void
  >();

  constructor(
    private usb: MicrobitUSB,
    private remoteDeviceId: number,
  ) {}

  async connect(...states: DeviceRequestStates[]): Promise<void> {
    logMessage('Serial connect');
    let unprocessedData = '';
    let previousButtonState = { A: 0, B: 0 };

    const handleError = (e: unknown) => {
      logError('Serial error', e);
      void this.disconnectInternal(false);
    };
    const processMessage = (data: string) => {
      const messages = protocol.splitMessages(unprocessedData + data);
      unprocessedData = messages.remainingInput;
      messages.messages.forEach(async msg => {
        // Messages are either periodic sensor data or command/response
        const sensorData = protocol.processPeriodicMessage(msg);
        if (sensorData) {
          onAccelerometerChange(
            sensorData.accelerometerX,
            sensorData.accelerometerY,
            sensorData.accelerometerZ,
          );
          if (sensorData.buttonA !== previousButtonState.A) {
            previousButtonState.A = sensorData.buttonA;
            onButtonChange(sensorData.buttonA, 'A');
          }
          if (sensorData.buttonB !== previousButtonState.B) {
            previousButtonState.B = sensorData.buttonB;
            onButtonChange(sensorData.buttonB, 'B');
          }
        } else {
          const messageResponse = protocol.processResponseMessage(msg);
          if (!messageResponse) {
            return;
          }
          const responseResolve = this.responseMap.get(messageResponse.messageId);
          if (responseResolve) {
            this.responseMap.delete(messageResponse.messageId);
            responseResolve(messageResponse);
          }
        }
      });
    };
    try {
      await this.usb.startSerial(processMessage, handleError);
      await this.handshake();
      stateOnConnected(DeviceRequestStates.INPUT);

      logMessage(`Serial: using remote device id ${this.remoteDeviceId}`);
      const remoteMbIdCommand = protocol.generateCmdRemoteMbId(this.remoteDeviceId);
      const remoteMbIdResponse = await this.sendCmdWaitResponse(remoteMbIdCommand);
      if (
        remoteMbIdResponse.type === protocol.ResponseTypes.Error ||
        remoteMbIdResponse.value !== this.remoteDeviceId
      ) {
        throw new Error(
          `Failed to set remote micro:bit ID. Expected ${this.remoteDeviceId}, got ${remoteMbIdResponse.value}`,
        );
      }

      // For now we only support input state.
      if (states.includes(DeviceRequestStates.INPUT)) {
        // Request the micro:bit to start sending the periodic messages
        const startCmd = protocol.generateCmdStart({
          accelerometer: true,
          buttons: true,
        });
        const startCmdResponse = await this.sendCmdWaitResponse(startCmd);
        if (startCmdResponse.type === protocol.ResponseTypes.Error) {
          throw new Error(
            `Failed to start streaming sensors data. Error response received: ${startCmdResponse.message}`,
          );
        }
      }

      stateOnAssigned(DeviceRequestStates.INPUT, this.usb.getModelNumber());
      stateOnReady(DeviceRequestStates.INPUT);
    } catch (e) {
      logError('Failed to initialise serial protocol', e);
      stateOnFailedToConnect(DeviceRequestStates.INPUT);
      await this.usb.stopSerial();
      throw e;
    }
  }

  async disconnect(): Promise<void> {
    return this.disconnectInternal(true);
  }

  private async disconnectInternal(userDisconnect: boolean): Promise<void> {
    // We might want to send command to stop streaming here?
    this.responseMap.clear();
    await this.usb.stopSerial();
    stateOnDisconnected(DeviceRequestStates.INPUT, userDisconnect);
  }

  async reconnect(): Promise<void> {
    await this.connect(DeviceRequestStates.INPUT);
  }

  private async sendCmdWaitResponse(
    cmd: protocol.MessageCmd,
  ): Promise<protocol.MessageResponse> {
    const responsePromise = new Promise<protocol.MessageResponse>((resolve, reject) => {
      this.responseMap.set(cmd.messageId, resolve);
      setTimeout(() => {
        this.responseMap.delete(cmd.messageId);
        reject(new Error(`Timeout waiting for response ${cmd.messageId}`));
      }, 1_000);
    });
    await this.usb.serialWrite(cmd.message);
    return responsePromise;
  }

  private async handshake(): Promise<void> {
    // There is an issue where we cannot read data out from the micro:bit serial
    // buffer until the buffer has been filled.
    // As a workaround we can spam the micro:bit with handshake messages until
    // enough responses have been queued in the buffer to fill it and the data
    // starts to flow.
    logMessage('Serial handshake');
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
}

export const startSerialConnection = async (
  usb: MicrobitUSB,
  requestState: DeviceRequestStates,
  remoteDeviceId: number,
): Promise<MicrobitSerial | undefined> => {
  try {
    const serial = new MicrobitSerial(usb, remoteDeviceId);
    await serial.connect(requestState);
    return serial;
  } catch (e) {
    return undefined;
  }
};
