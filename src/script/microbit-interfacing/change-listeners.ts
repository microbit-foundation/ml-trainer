/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { livedata } from '../stores/mlStore';
import { buttonPressed, isFieldDataCollectionMode } from '../stores/uiStore';
import MBSpecs from './MBSpecs';
import { DeviceRequestStates } from './MicrobitConnection';
import {
  stateOnIdentifiedAsMakecode,
  stateOnIdentifiedAsProprietary,
  stateOnVersionIdentified,
} from './state-updaters';

let smoothedAccelX = 0;
let smoothedAccelY = 0;
let smoothedAccelZ = 0;

export const onAccelerometerChange = (x: number, y: number, z: number): void => {
  const accelX = x / 1000.0;
  const accelY = y / 1000.0;
  const accelZ = z / 1000.0;
  smoothedAccelX = accelX * 0.25 + smoothedAccelX * 0.75;
  smoothedAccelY = accelY * 0.25 + smoothedAccelY * 0.75;
  smoothedAccelZ = accelZ * 0.25 + smoothedAccelZ * 0.75;

  const data = {
    accelX,
    accelY,
    accelZ,
    smoothedAccelX,
    smoothedAccelY,
    smoothedAccelZ,
  };

  livedata.set(data); // This is the old livedata store
};

export const onButtonChange = (
  buttonState: MBSpecs.ButtonState,
  button: MBSpecs.Button,
): void => {
  if (buttonState === MBSpecs.ButtonStates.Released) {
    return;
  }
  if (button === 'A') {
    buttonPressed.update(obj => {
      obj.buttonA = 1;
      obj.buttonB = 0;
      return obj;
    });
  } else {
    buttonPressed.update(obj => {
      obj.buttonA = 0;
      obj.buttonB = 1;
      return obj;
    });
  }
};

export const onUARTDataReceived = (
  requestState: DeviceRequestStates,
  data: string,
): void => {
  if (data === 'id_mkcd') {
    stateOnIdentifiedAsMakecode(requestState);
  }
  if (data === 'id_prop') {
    stateOnIdentifiedAsProprietary(requestState);
  }
  if (data.includes('f_')) {
    isFieldDataCollectionMode.update(_ => {
      switch (data) {
        case 'f_start':
          return true;
        case 'f_stopped':
          return false;
        default:
          console.warn('Unrecognised uart message');
          return false;
      }
    });
  }
  if (data.includes('vi_')) {
    const version = parseInt(data.substring(3));
    stateOnVersionIdentified(requestState, version);
    // TODO: Use this to show outdated program dialog?

    // this.inputBuildVersion = version;
    // if (this.isInputOutputTheSame()) {
    //   clearTimeout(this.outputVersionIdentificationTimeout);
    // }
    // clearTimeout(this.inputVersionIdentificationTimeout);
    // connectionBehaviour.onVersionIdentified(version);
    // const isOutdated = StaticConfiguration.isMicrobitOutdated(this.inputOrigin, version);
    // if (isOutdated) {
    //   connectionBehaviour.onIdentifiedAsOutdated();
    // }
  }
};
