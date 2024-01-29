/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { DeviceRequestStates } from '../stores/connectDialogStore';
import MicrobitUSB from './MicrobitUSB';
import Microbits from './MicrobitsAlt';
import { onAccelerometerChange, onButtonChange } from './change-listeners';
import * as protocol from './serialProtocol';
import {
  stateOnAssigned,
  stateOnConnected,
  stateOnDisconnected,
  stateOnFailedToConnect,
  stateOnReady,
} from './state-updaters';

const enum SerialProtocolState {
  AwaitingHandshakeResponse,
  Running,
}

export const startSerialConnection = async (requestState: DeviceRequestStates) => {
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
  stateOnReady(requestState);
  stateOnAssigned(requestState);
  stateOnConnected(requestState);
  return {
    success: true,
    device: usb,
  };
};

const listenToInputServices = async (usb: MicrobitUSB): Promise<void> => {
  let serialProtocolState = SerialProtocolState.AwaitingHandshakeResponse;
  let unprocessedInput = '';
  let previousButtonState = { A: 0, B: 0 };
  await usb.startSerial(data => {
    unprocessedInput += data;
    let messages = protocol.splitMessages(unprocessedInput);
    unprocessedInput = messages.remainingInput;
    messages.messages.forEach(async msg => {
      if (serialProtocolState === SerialProtocolState.AwaitingHandshakeResponse) {
        let handshakeResponse = protocol.processHandshake(msg);
        if (handshakeResponse && handshakeResponse.value === protocol.version) {
          serialProtocolState = SerialProtocolState.Running;

          // Request the micro:bit to start sending the periodic messages
          const startCmd = protocol.generateCmdStart({
            accelerometer: true,
            buttons: true,
          });
          await usb.serialWrite(startCmd);
        }
      } else {
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
    serialProtocolState == SerialProtocolState.AwaitingHandshakeResponse &&
    attempts++ < 20
  ) {
    const handshakeCmd = protocol.generateCmdHandshake();
    console.log(`Sending handshake ${handshakeCmd}`);
    await usb.serialWrite(handshakeCmd);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (serialProtocolState === SerialProtocolState.AwaitingHandshakeResponse) {
    throw new Error('Handshake not received');
  }
};

export const disconnectSerial = (
  usb: MicrobitUSB,
  requestState: DeviceRequestStates,
  userDisconnect: boolean,
): void => {
  // Weirdly this disconnects the CortexM...
  usb.disconnect();
  // this.unprocessedInput = '';
  usb.stopSerial().catch(e => {
    // It's hard to make disconnect() async so we've left this as a background error for now.
    console.error(e);
  });
  stateOnDisconnected(requestState, userDisconnect);
};
