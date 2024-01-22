/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { ModelView, buttonPressed, onCatastrophicError, state } from '../stores/uiStore';
import { livedata } from '../stores/mlStore';
import { t } from '../../i18n';
import { get } from 'svelte/store';
import MBSpecs from '../microbit-interfacing/MBSpecs';
import LoggingDecorator from './LoggingDecorator';
import TypingUtils from '../TypingUtils';
import { DeviceRequestStates } from '../stores/connectDialogStore';
import StaticConfiguration from '../../StaticConfiguration';
import { Paths, currentPath, navigate } from '../../router/paths';
import { MicrobitConnection } from '../microbit-interfacing/MicrobitConnection';

let text = get(t);
t.subscribe(t => (text = t));

// Temporary debug for time between messages received.
const zeroStats = () => ({
  totalTime: 0,
  sampleCount: 0,
  bins: {
    '0-10': 0,
    '11-20': 0,
    '21-30': 0,
    '31-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0,
    '101-120': 0,
    '121-140': 0,
    '141-160': 0,
    '>160': 0,
  },
});

let stats = zeroStats();

let interval: any;

const binTimeInterval = (time: number) => {
  if (time <= 10) {
    stats.bins['0-10']++;
  } else if (time <= 20) {
    stats.bins['11-20']++;
  } else if (time <= 30) {
    stats.bins['21-30']++;
  } else if (time <= 40) {
    stats.bins['31-40']++;
  } else if (time <= 60) {
    stats.bins['41-60']++;
  } else if (time <= 80) {
    stats.bins['61-80']++;
  } else if (time <= 100) {
    stats.bins['81-100']++;
  } else if (time <= 120) {
    stats.bins['101-120']++;
  } else if (time <= 140) {
    stats.bins['121-140']++;
  } else if (time <= 160) {
    stats.bins['141-160']++;
  } else {
    stats.bins['>160']++;
  }
};

/**
 * Implementation of the input ConnectionBehaviour
 */
class InputBehaviour extends LoggingDecorator {
  private t = -1;
  private smoothedAccelX = 0;
  private smoothedAccelY = 0;
  private smoothedAccelZ = 0;

  private reconnectTimeout = setTimeout(TypingUtils.emptyFunction, 0);

  onConnectionError(error?: unknown) {
    super.onConnectionError(error);
    state.update(s => {
      s.isInputConnected = false;
      s.isInputAssigned = false;
      return s;
    });
  }

  onIdentifiedAsOutdated(): void {
    super.onIdentifiedAsOutdated();
    state.update(s => {
      s.isInputOutdated = true;
      return s;
    });
  }

  onVersionIdentified(versionNumber: number): void {
    super.onVersionIdentified(versionNumber);
  }

  onIdentifiedAsMakecode(): void {
    super.onIdentifiedAsMakecode();
    state.update(s => {
      s.modelView = ModelView.TILE;
      return s;
    });
  }

  onIdentifiedAsProprietary(): void {
    super.onIdentifiedAsProprietary();
  }

  onGestureRecognized(id: number, gestureName: string): void {
    super.onGestureRecognized(id, gestureName);
  }

  onUartMessageReceived(message: string): void {
    super.onUartMessageReceived(message);
  }

  onReady() {
    super.onReady();
    clearTimeout(this.reconnectTimeout);
    state.update(s => {
      s.isInputReady = true;
      return s;
    });
    if (get(currentPath) === Paths.HOME) {
      navigate(Paths.DATA);
    }
  }

  onAssigned(microbit: MicrobitConnection, name: string) {
    super.onAssigned(microbit, name);
    state.update(s => {
      s.isInputAssigned = true;
      return s;
    });
  }

  onExpelled(manual?: boolean, bothDisconnected?: boolean): void {
    super.onExpelled(manual, bothDisconnected);
    state.update(s => {
      s.isInputConnected = false;
      s.isInputAssigned = false;
      s.isInputReady = false;
      s.offerReconnect = !manual;
      s.reconnectState = DeviceRequestStates.INPUT;
      return s;
    });
    clearTimeout(this.reconnectTimeout);
    clearInterval(interval);
    interval = undefined;
    this.t = -1;
  }

  onCancelledBluetoothRequest(): void {
    super.onCancelledBluetoothRequest();
    state.update(s => {
      s.requestDeviceWasCancelled = true;
      s.isInputConnected = false;
      return s;
    });
  }

  onDisconnected(): void {
    super.onDisconnected();
    state.update(s => {
      s.isInputConnected = false;
      s.offerReconnect = false;
      s.isInputReady = false;
      s.reconnectState = DeviceRequestStates.NONE;
      s.isInputOutdated = false;
      return s;
    });
  }

  onConnected(name: string): void {
    super.onConnected(name);

    state.update(s => {
      s.isInputConnected = true;
      s.isRequestingDevice = DeviceRequestStates.NONE;
      s.offerReconnect = false;
      return s;
    });

    // Works like this: If the MB manages to connect, wait `reconnectTimeoutDuration` milliseconds
    // if MB does not call onReady before that expires, refresh the page
    clearTimeout(this.reconnectTimeout);
    const onTimeout = () => onCatastrophicError();
    this.reconnectTimeout = setTimeout(function () {
      onTimeout();
    }, StaticConfiguration.reconnectTimeoutDuration);
  }

  accelerometerChange(x: number, y: number, z: number): void {
    // FIXME: Debug log, add time between messages received to bins.
    // Logged every 10 seconds.
    if (this.t === -1) {
      this.t = Date.now();
    } else {
      let now = Date.now();
      const changeInterval = now - this.t;
      binTimeInterval(changeInterval);
      stats.sampleCount++;
      stats.totalTime += changeInterval;
      this.t = now;
      if (!interval) {
        interval = setInterval(() => {
          console.log({ ...stats, mean: stats.totalTime / stats.sampleCount });
          stats = zeroStats();
        }, 10_000);
      }
    }

    super.accelerometerChange(x, y, z);

    const accelX = x / 1000.0;
    const accelY = y / 1000.0;
    const accelZ = z / 1000.0;
    this.smoothedAccelX = accelX * 0.25 + this.smoothedAccelX * 0.75;
    this.smoothedAccelY = accelY * 0.25 + this.smoothedAccelY * 0.75;
    this.smoothedAccelZ = accelZ * 0.25 + this.smoothedAccelZ * 0.75;

    const data = {
      accelX,
      accelY,
      accelZ,
      smoothedAccelX: this.smoothedAccelX,
      smoothedAccelY: this.smoothedAccelY,
      smoothedAccelZ: this.smoothedAccelZ,
    };

    livedata.set(data); // This is the old livedata store
  }

  buttonChange(buttonState: MBSpecs.ButtonState, button: MBSpecs.Button): void {
    super.buttonChange(buttonState, button);
    if (buttonState === MBSpecs.ButtonStates.Released) return;
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
  }
}

export default InputBehaviour;
