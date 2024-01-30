/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { DeviceRequestStates } from '../stores/connectDialogStore';
import MicrobitUSB from './MicrobitUSB';
import Microbits from './Microbits';
import { onAccelerometerChange, onButtonChange } from './change-listeners';
import * as protocol from './serialProtocol';
import {
  stateOnAssigned,
  stateOnConnected,
  stateOnDisconnected,
  stateOnFailedToConnect,
  stateOnReady,
} from './state-updaters';

type SerialConnectionResult =
  | {
      result: MicrobitUSB;
      success: true;
    }
  | { success: false };

export const startSerialConnection = async (
  requestState: DeviceRequestStates,
): Promise<SerialConnectionResult> => {
  const usb = Microbits.getLinked();
  try {
    await listenToInputServices(usb);
  } catch (e) {
    stateOnFailedToConnect(requestState);
    return {
      success: false,
    };
  }
  // TODO: Begs the question as to whether these need to be different.
  stateOnAssigned(requestState, usb.getModelNumber());
  stateOnConnected(requestState);
  stateOnReady(requestState);
  return {
    success: true,
    result: usb,
  };
};

const listenToInputServices = async (usb: MicrobitUSB): Promise<void> => {
  let unprocessedData = '';
  let previousButtonState = { A: 0, B: 0 };
  // TODO: The radio frequency should be randomly generated once per session.
  //       If we want a session to be restored (e.g. from local storage) and
  //       the previously flashed micro:bits to continue working without
  //       reflashing we need to store and retrieve this value somehow.
  // FIXME: Setting this to the hex files default value for now, as we need
  //        to configure the radio frequency for both micro:bits after they
  //        are flashed, not just the radio bridge.
  let sessionRadioFrequency = 42;
  const responseMap = new Map<
    number,
    (value: protocol.MessageResponse | PromiseLike<protocol.MessageResponse>) => void
  >();
  const sendCmdWaitResponse = async (
    cmd: protocol.MessageCmd,
  ): Promise<protocol.MessageResponse> => {
    const responsePromise = new Promise<protocol.MessageResponse>((resolve, reject) => {
      responseMap.set(cmd.messageId, resolve);
      setTimeout(() => {
        responseMap.delete(cmd.messageId);
        reject(new Error(`Timeout waiting for response ${cmd.messageId}`));
      }, 1_000);
    });
    await usb.serialWrite(cmd.message);
    return responsePromise;
  };

  const handshake = async (): Promise<void> => {
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
          sendCmdWaitResponse(protocol.generateCmdHandshake())
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
        const responseResolve = responseMap.get(messageResponse.messageId);
        if (responseResolve) {
          responseMap.delete(messageResponse.messageId);
          responseResolve(messageResponse);
        }
      }
    });
  };
  await usb.startSerial(processMessage);
  try {
    await handshake();

    // Set the radio frequency to a value unique to this session
    const radioFreqCommand = protocol.generateCmdRadioFrequency(sessionRadioFrequency);
    const radioFreqResponse = await sendCmdWaitResponse(radioFreqCommand);
    if (radioFreqResponse.value !== sessionRadioFrequency) {
      throw new Error(
        `Failed to set radio frequency. Expected ${sessionRadioFrequency}, got ${radioFreqResponse.value}`,
      );
    }

    // Request the micro:bit to start sending the periodic messages
    const startCmd = protocol.generateCmdStart({
      accelerometer: true,
      buttons: true,
    });
    await usb.serialWrite(startCmd.message);
  } catch (e) {
    usb.stopSerial();
    throw e;
  }
};

export const disconnectSerial = async (
  usb: MicrobitUSB,
  requestState: DeviceRequestStates,
  userDisconnect: boolean,
): Promise<void> => {
  // We might want to sen a command to stop streaming here.
  await usb.stopSerial();
  stateOnDisconnected(requestState, userDisconnect);
};
