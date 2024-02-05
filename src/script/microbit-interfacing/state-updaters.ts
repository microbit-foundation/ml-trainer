/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { get } from 'svelte/store';
import { ModelView, state } from '../stores/uiStore';
import { Paths, currentPath, navigate } from '../../router/paths';
import MBSpecs from './MBSpecs';
import { HexOrigin } from '../../StaticConfiguration';
import Microbits from './Microbits';
import { DeviceRequestStates } from './MicrobitConnection';

export const stateOnConnected = (requestState: DeviceRequestStates) => {
  state.update(s => {
    requestState === DeviceRequestStates.INPUT
      ? (s.isInputConnected = true)
      : (s.isOutputConnected = true);
    s.isRequestingDevice = DeviceRequestStates.NONE;
    s.offerReconnect = false;
    return s;
  });
};

export const stateOnIdentifiedAsMakecode = (requestState: DeviceRequestStates): void => {
  if (requestState === DeviceRequestStates.INPUT) {
    state.update(s => {
      s.inputOrigin = HexOrigin.MAKECODE;
      s.modelView = ModelView.TILE;
      return s;
    });
  } else {
    state.update(s => {
      s.outputOrigin = HexOrigin.MAKECODE;
      s.modelView = ModelView.TILE;
      return s;
    });
  }
};

export const stateOnIdentifiedAsProprietary = (
  requestState: DeviceRequestStates,
): void => {
  if (requestState === DeviceRequestStates.INPUT) {
    state.update(s => {
      s.inputOrigin = HexOrigin.PROPRIETARY;
      s.modelView = ModelView.STACK;
      return s;
    });
  } else {
    state.update(s => {
      s.outputOrigin = HexOrigin.PROPRIETARY;
      s.modelView = ModelView.STACK;
      return s;
    });
  }
};

export const stateOnReady = (requestState: DeviceRequestStates) => {
  if (requestState === DeviceRequestStates.INPUT) {
    state.update(s => {
      s.isInputReady = true;
      return s;
    });
    if (get(currentPath) === Paths.HOME) {
      navigate(Paths.DATA);
    }
  } else {
    Microbits.getOutputMicrobit()?.resetPins();
    state.update(s => {
      s.isOutputReady = true;
      return s;
    });
  }
};

export const stateOnAssigned = (
  requestState: DeviceRequestStates,
  microbitVersion: MBSpecs.MBVersion,
) => {
  if (requestState === DeviceRequestStates.INPUT) {
    state.update(s => {
      s.isInputAssigned = true;
      s.inputMicrobitVersion = microbitVersion;
      return s;
    });
  } else {
    state.update(s => {
      s.isOutputAssigned = true;
      s.inputMicrobitVersion = microbitVersion;
      return s;
    });
  }
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
      s.isInputReady = false;
      s.offerReconnect = !userDisconnect;
      s.reconnectState = DeviceRequestStates.INPUT;
      s.isInputOutdated = false;
      return s;
    });
  } else {
    state.update(s => {
      s.isOutputConnected = false;
      s.offerReconnect = !userDisconnect;
      s.isOutputReady = false;
      s.isOutputOutdated = false;
      if (s.isInputConnected) {
        s.reconnectState = DeviceRequestStates.OUTPUT;
      }
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
      s.reconnectState = DeviceRequestStates.NONE;
      s.isInputOutdated = false;
      return s;
    });
  } else {
    state.update(s => {
      s.isOutputConnected = false;
      s.offerReconnect = false;
      s.isOutputAssigned = false;
      s.isOutputReady = false;
      s.reconnectState = DeviceRequestStates.NONE;
      s.isOutputOutdated = false;
      return s;
    });
  }
};

export const stateOnStopOfferingReconnect = () => {
  state.update(s => {
    s.offerReconnect = false;
    return s;
  });
};

export const stateOnVersionIdentified = (
  requestState: DeviceRequestStates,
  value: number,
) => {
  if (requestState === DeviceRequestStates.INPUT) {
    state.update(s => {
      s.inputHexVersion = value;
      return s;
    });
  } else {
    state.update(s => {
      s.outputHexVersion = value;
      return s;
    });
  }
};
