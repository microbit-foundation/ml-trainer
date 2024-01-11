/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import MicrobitBluetooth from '../microbit-interfacing/MicrobitBluetooth';
import { ModelView, onCatastrophicError, state } from '../stores/uiStore';
import { t } from '../../i18n';
import { get } from 'svelte/store';
import MBSpecs from '../microbit-interfacing/MBSpecs';
import LoggingDecorator from './LoggingDecorator';
import TypingUtils from '../TypingUtils';
import { DeviceRequestStates } from '../stores/connectDialogStore';
import Microbits from '../microbit-interfacing/Microbits';
import StaticConfiguration from '../../StaticConfiguration';
import { Paths, currentPath, navigate } from '../../router/paths';

let text = get(t);
t.subscribe(t => (text = t));

class OutputBehaviour extends LoggingDecorator {
  private reconnectTimeout: NodeJS.Timeout = setTimeout(TypingUtils.emptyFunction, 0);

  onBluetoothConnectionError(error?: unknown) {
    super.onBluetoothConnectionError(error);
    state.update(s => {
      s.isOutputConnected = false;
      s.isOutputAssigned = false;
      return s;
    });
  }

  onIdentifiedAsOutdated(): void {
    super.onIdentifiedAsOutdated();
    state.update(s => {
      s.isOutputOutdated = true;
      return s;
    });
  }

  onVersionIdentified(versionNumber: number): void {
    super.onVersionIdentified(versionNumber);
  }

  onGestureRecognized(id: number, gestureName: string): void {
    super.onGestureRecognized(id, gestureName);
    if (Microbits.isOutputReady()) {
      Microbits.sendUARTGestureMessageToOutput(gestureName);
    }
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
    state.update(s => {
      s.modelView = ModelView.STACK;
      return s;
    });
  }

  onUartMessageReceived(message: string): void {
    super.onUartMessageReceived(message);
  }

  onReady() {
    super.onReady();

    // Reset any output pins currently active.
    const pinResetArguments: { pin: MBSpecs.UsableIOPin; on: boolean }[] = [];
    StaticConfiguration.supportedPins.forEach(pin => {
      const argument = { pin: pin, on: false };
      pinResetArguments.push(argument);
    });
    Microbits.sendToOutputPin(pinResetArguments);

    state.update(s => {
      if (Microbits.isInputOutputTheSame()) {
        s.modelView = Microbits.isOutputMakecode() ? ModelView.TILE : s.modelView;
      }

      s.isOutputReady = true;
      return s;
    });
    clearTimeout(this.reconnectTimeout);
  }

  onAssigned(microbitBluetooth: MicrobitBluetooth, name: string) {
    super.onAssigned(microbitBluetooth, name);
    state.update(s => {
      s.isOutputAssigned = true;
      return s;
    });
    if (get(currentPath) === Paths.HOME) {
      navigate(Paths.DATA);
    }
  }

  onExpelled(manual?: boolean, bothDisconnected?: boolean): void {
    super.onExpelled(manual, bothDisconnected);
    state.update(s => {
      s.isOutputConnected = false;
      s.offerReconnect = !manual;
      s.isOutputAssigned = false;
      s.isOutputReady = false;
      if (!bothDisconnected) {
        s.reconnectState = DeviceRequestStates.OUTPUT;
      }
      return s;
    });
    clearTimeout(this.reconnectTimeout);
  }

  onCancelledBluetoothRequest(): void {
    super.onCancelledBluetoothRequest();
    state.update(s => {
      s.isOutputConnected = false;
      s.requestDeviceWasCancelled = true;
      return s;
    });
  }

  accelerometerChange(x: number, y: number, z: number): void {
    return;
  }

  buttonChange(buttonState: MBSpecs.ButtonState, button: MBSpecs.Button): void {
    return;
  }

  onConnected(name: string): void {
    super.onConnected(name);

    state.update(s => {
      s.isOutputConnected = true;
      s.isRequestingDevice = DeviceRequestStates.NONE;
      s.offerReconnect = false;
      return s;
    });

    // Reset connection reconnectTimeoutTime
    clearTimeout(this.reconnectTimeout);
    const onTimeout = () => onCatastrophicError();
    this.reconnectTimeout = setTimeout(function () {
      onTimeout();
    }, StaticConfiguration.reconnectTimeoutDuration);
  }

  onDisconnected(): void {
    super.onDisconnected();
    // Ensure state is updated
    state.update(s => {
      s.isOutputConnected = false;
      s.isOutputReady = false;
      s.isOutputOutdated = false;
      return s;
    });
  }
}

export default OutputBehaviour;
