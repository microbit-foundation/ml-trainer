/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { get } from 'svelte/store';
import { DeviceRequestStates } from '../stores/connectDialogStore';
import { ModelView, state } from '../stores/uiStore';
import { Paths, currentPath, navigate } from '../../router/paths';
import MBSpecs from './MBSpecs';
import StaticConfiguration from '../../StaticConfiguration';
import Microbits from './Microbits';

// TODO: We've lost reconnect and logging timeouts
// TODO: We've lost logging in general, but most of it was unhelpful.

export const stateOnBluetoothConnected = (requestState: DeviceRequestStates) => {
  state.update(s => {
    requestState === DeviceRequestStates.INPUT
      ? (s.isInputConnected = true)
      : (s.isOutputConnected = true);
    s.isRequestingDevice = DeviceRequestStates.NONE;
    s.offerReconnect = false;
    return s;
  });
};

export const stateOnIdentifiedAsMakecode = (): void => {
  state.update(s => {
    s.modelView = ModelView.TILE;
    return s;
  });
};

export const stateOnReady = (requestState: DeviceRequestStates) => {
  if (requestState === DeviceRequestStates.INPUT) {
    // clearTimeout(this.reconnectTimeout);
    state.update(s => {
      s.isInputReady = true;
      return s;
    });
    if (get(currentPath) === Paths.HOME) {
      navigate(Paths.DATA);
    }
  } else {
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
    //clearTimeout(this.reconnectTimeout);
  }
};

export const stateOnAssigned = (requestState: DeviceRequestStates) => {
  if (requestState === DeviceRequestStates.INPUT) {
    state.update(s => {
      s.isInputAssigned = true;
      return s;
    });
  } else {
  }
  state.update(s => {
    s.isOutputAssigned = true;
    return s;
  });
  if (get(currentPath) === Paths.HOME) {
    navigate(Paths.DATA);
  }
};

export const stateOnDisconnected = (
  requestState: DeviceRequestStates,
  userDisconnect: boolean,
): void => {
  if (requestState === DeviceRequestStates.INPUT) {
    state.update(s => {
      s.isInputConnected = false;
      // Hang on to the reference
      // s.isInputAssigned = false;
      s.isInputReady = false;
      s.offerReconnect = !userDisconnect;
      s.reconnectState = DeviceRequestStates.INPUT;
      //s.isInputOutdated = false;
      return s;
    });
  } else {
    state.update(s => {
      s.isOutputConnected = false;
      s.offerReconnect = !userDisconnect;
      // Hang on to the reference
      // s.isOutputAssigned = false;
      s.isOutputReady = false;
      s.reconnectState = DeviceRequestStates.NONE;
      //s.isOutputOutdated = false;
      // TODO: Come back to this.
      // if (!bothDisconnected) {
      //   s.reconnectState = DeviceRequestStates.OUTPUT;
      // }
      return s;
    });
  }
};

export const stateOnFailedToConnect = (requestState: DeviceRequestStates) => {
  if (requestState === DeviceRequestStates.INPUT) {
    state.update(s => {
      s.isInputConnected = false;
      s.isInputAssigned = false;
      s.isInputReady = false;
      s.offerReconnect = false;
      s.reconnectState = DeviceRequestStates.INPUT;
      //s.isInputOutdated = false;
      return s;
    });
  } else {
    state.update(s => {
      s.isOutputConnected = false;
      s.offerReconnect = false;
      s.isOutputAssigned = false;
      s.isOutputReady = false;
      s.reconnectState = DeviceRequestStates.NONE;
      //s.isOutputOutdated = false;
      // TODO: Come back to this.
      // if (!bothDisconnected) {
      //   s.reconnectState = DeviceRequestStates.OUTPUT;
      // }
      return s;
    });
  }
};
