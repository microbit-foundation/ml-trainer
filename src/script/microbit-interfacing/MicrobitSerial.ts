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
  stateOnReady,
  stateOnReconnected,
  stateOnReconnectionAttempt,
} from './state-updaters';
import StaticConfiguration from '../../StaticConfiguration';
import { ConnectionType } from '../stores/uiStore';

export class MicrobitSerial implements MicrobitConnection {
  private responseMap = new Map<
    number,
    (value: protocol.MessageResponse | PromiseLike<protocol.MessageResponse>) => void
  >();

  // To avoid concurrent connect attempts
  private isConnecting: boolean = false;

  // TODO: The radio frequency should be randomly generated once per session.
  //       If we want a session to be restored (e.g. from local storage) and
  //       the previously flashed micro:bits to continue working without
  //       reflashing we need to store and retrieve this value somehow.
  // FIXME: Setting this to the hex files default value for now, as we need
  //        to configure the radio frequency for both micro:bits after they
  //        are flashed, not just the radio bridge.
  private sessionRadioFrequency = 42;
  private connectionCheckIntervalId: ReturnType<typeof setInterval> | undefined;
  private lastReceivedMessageTimestamp: number | undefined;

  constructor(private usb: MicrobitUSB) {}

  async connect(...states: DeviceRequestStates[]): Promise<void> {
    logMessage('Serial connect', states);
    if (this.isConnecting) {
      logMessage('Skipping connect attempt when one is already in progress');
      return;
    }
    this.isConnecting = true;
    let unprocessedData = '';
    let previousButtonState = { A: 0, B: 0 };
    let onPeriodicMessageRecieved: (() => void) | undefined;

    const handleError = (e: unknown) => {
      console.error(e);
      void this.disconnectInternal(false, 'bridge');
    };
    const processMessage = (data: string) => {
      const messages = protocol.splitMessages(unprocessedData + data);
      unprocessedData = messages.remainingInput;
      messages.messages.forEach(async msg => {
        this.lastReceivedMessageTimestamp = Date.now();

        // Messages are either periodic sensor data or command/response
        const sensorData = protocol.processPeriodicMessage(msg);
        if (sensorData) {
          stateOnReconnected();
          if (onPeriodicMessageRecieved) {
            onPeriodicMessageRecieved();
            onPeriodicMessageRecieved = undefined;
          }
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

      // Check for connection lost
      if (this.connectionCheckIntervalId === undefined) {
        this.connectionCheckIntervalId = setInterval(async () => {
          if (
            this.lastReceivedMessageTimestamp &&
            Date.now() - this.lastReceivedMessageTimestamp > 1_000
          ) {
            stateOnReconnectionAttempt();
          }
          if (
            this.lastReceivedMessageTimestamp &&
            Date.now() - this.lastReceivedMessageTimestamp >
              StaticConfiguration.connectTimeoutDuration
          ) {
            await this.handleReconnect();
          }
        }, 1000);
      }

      // Set the radio frequency to a value unique to this session
      const radioFreqCommand = protocol.generateCmdRadioFrequency(
        this.sessionRadioFrequency,
      );
      const radioFreqResponse = await this.sendCmdWaitResponse(radioFreqCommand);
      if (radioFreqResponse.value !== this.sessionRadioFrequency) {
        throw new Error(
          `Failed to set radio frequency. Expected ${this.sessionRadioFrequency}, got ${radioFreqResponse.value}`,
        );
      }

      // For now we only support input state.
      if (states.includes(DeviceRequestStates.INPUT)) {
        // Request the micro:bit to start sending the periodic messages
        const startCmd = protocol.generateCmdStart({
          accelerometer: true,
          buttons: true,
        });
        await this.usb.serialWrite(startCmd.message);
        const periodicMessagePromise = new Promise<void>((resolve, reject) => {
          onPeriodicMessageRecieved = resolve;
          setTimeout(() => {
            onPeriodicMessageRecieved = undefined;
            reject(new Error('Failed to receive data from remote micro:bit'));
          }, 500);
        });
        await this.sendCmdWaitResponse(startCmd);
        await periodicMessagePromise;
      }

      stateOnAssigned(DeviceRequestStates.INPUT, this.usb.getModelNumber());
      stateOnReady(DeviceRequestStates.INPUT);
      logMessage('Serial successfully connected');
    } catch (e) {
      logError('Failed to initialise serial protocol', e);
      let reconnectHelp: ConnectionType = 'remote';
      if (typeof e === 'string' && e.includes('Handshake')) {
        reconnectHelp = 'bridge';
      }
      await this.disconnectInternal(false, reconnectHelp);
      throw e;
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect(): Promise<void> {
    return this.disconnectInternal(true, 'bridge');
  }

  private stopConnectionCheck() {
    clearInterval(this.connectionCheckIntervalId);
    this.connectionCheckIntervalId = undefined;
    this.lastReceivedMessageTimestamp = undefined;
  }

  private async disconnectInternal(
    userDisconnect: boolean,
    reconnectHelp: ConnectionType,
  ): Promise<void> {
    this.stopConnectionCheck();
    // We might want to send command to stop streaming here?
    this.responseMap.clear();
    await this.usb.stopSerial();
    stateOnDisconnected(DeviceRequestStates.INPUT, userDisconnect, reconnectHelp);
  }

  async handleReconnect(): Promise<void> {
    if (this.isConnecting) {
      logMessage('Serial disconnect ignored... reconnect already in progress');
      return;
    }
    try {
      this.stopConnectionCheck();
      logMessage('Serial disconnected... automatically trying to reconnect');
      this.responseMap.clear();
      await this.usb.stopSerial();
      await this.usb.softwareReset();
      await this.reconnect();
    } catch (e) {
      logError('Serial connect triggered by disconnect listener failed', e);
    } finally {
      this.isConnecting = false;
    }
  }

  async reconnect(): Promise<void> {
    logMessage('Serial reconnect');
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
): Promise<MicrobitSerial | undefined> => {
  try {
    const serial = new MicrobitSerial(usb);
    await serial.connect(requestState);
    return serial;
  } catch (e) {
    return undefined;
  }
};
