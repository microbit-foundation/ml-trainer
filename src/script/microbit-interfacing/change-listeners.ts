/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { get } from 'svelte/store';
import { DataSource, livedata, settings } from '../stores/mlStore';
import { buttonPressed, state } from '../stores/uiStore';
import MBSpecs from './MBSpecs';
import { DeviceRequestStates } from './MicrobitConnection';
import {
  stateOnIdentifiedAsMakecode,
  stateOnIdentifiedAsProprietary,
  stateOnVersionIdentified,
} from './state-updaters';

export const scaleAcc = (value: number) => {
  const newMax = 2;
  const newMin = -2;
  const currentMax = 2000;
  const currentMin = -2000;
  return ((newMax - newMin) * (value - currentMin)) / (currentMax - currentMin) + newMin;
};

let smoothedAccelX = 0;
let smoothedAccelY = 0;
let smoothedAccelZ = 0;

export const onAccelerometerChange = (x: number, y: number, z: number): void => {
  if (get(settings).dataSource !== DataSource.ACCELEROMETER) {
    return;
  }

  const accelX = scaleAcc(x);
  const accelY = scaleAcc(y);
  const accelZ = scaleAcc(z);
  smoothedAccelX = accelX * 0.25 + smoothedAccelX * 0.75;
  smoothedAccelY = accelY * 0.25 + smoothedAccelY * 0.75;
  smoothedAccelZ = accelZ * 0.25 + smoothedAccelZ * 0.75;

  const data = {
    x: accelX,
    y: accelY,
    z: accelZ,
    smoothedX: smoothedAccelX,
    smoothedY: smoothedAccelY,
    smoothedZ: smoothedAccelZ,
  };

  livedata.set(data); // This is the old livedata store
};

export const scaleMag = (value: number) => {
  const newMax = 2;
  const newMin = -2;
  const currentMax = Math.sqrt(2 ** 15);
  const currentMin = Math.sqrt(2 ** 15) * -1;
  return ((newMax - newMin) * (value - currentMin)) / (currentMax - currentMin) + newMin;
};

const signedSqrt = (value: number) => Math.sign(value) * Math.sqrt(Math.abs(value));

let smoothedMagX = 0;
let smoothedMagY = 0;
let smoothedMagZ = 0;

export const onMagnetometerChange = (x: number, y: number, z: number): void => {
  if (get(settings).dataSource !== DataSource.MAGNETOMETER) {
    return;
  }

  const magX = scaleMag(signedSqrt(x));
  const magY = scaleMag(signedSqrt(y));
  const magZ = scaleMag(signedSqrt(z));

  smoothedMagX = magX * 0.25 + smoothedMagX * 0.75;
  smoothedMagY = magY * 0.25 + smoothedMagY * 0.75;
  smoothedMagZ = magZ * 0.25 + smoothedMagZ * 0.75;

  const data = {
    x: magX,
    y: magY,
    z: magZ,
    smoothedX: smoothedMagX,
    smoothedY: smoothedMagY,
    smoothedZ: smoothedMagZ,
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
