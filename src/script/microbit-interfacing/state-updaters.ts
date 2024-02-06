/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { get } from 'svelte/store';
import { ConnectionType, ModelView, state } from '../stores/uiStore';
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
    s.showReconnectHelp = false;
    s.reconnectState = {
      ...s.reconnectState,
      // This is set on disconnect.
      connectionType: 'none',
      reconnectFailed: false,
      reconnecting: false,
    };
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
      s.inputMicrobitVersion = microbitVersion;
      return s;
    });
  } else {
    state.update(s => {
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
  connectionType: ConnectionType,
): void => {
  if (requestState === DeviceRequestStates.INPUT) {
    state.update(s => {
      s.isInputConnected = false;
      s.isInputReady = false;
      s.showReconnectHelp = !userDisconnect;
      s.reconnectState = {
        reconnecting: false,
        reconnectFailed: false,
        connectionType: connectionType,
        inUseAs: s.reconnectState.inUseAs.add(DeviceRequestStates.INPUT),
      };
      s.isInputOutdated = false;
      return s;
    });
  } else {
    state.update(s => {
      s.isOutputConnected = false;
      s.showReconnectHelp = !userDisconnect;
      s.isOutputReady = false;
      s.isOutputOutdated = false;
      s.reconnectState = {
        reconnecting: false,
        reconnectFailed: false,
        connectionType: connectionType,
        inUseAs: s.reconnectState.inUseAs.add(DeviceRequestStates.OUTPUT),
      };
      return s;
    });
  }
};

export const stateOnFailedToConnect = (requestState: DeviceRequestStates) => {
  if (requestState === DeviceRequestStates.INPUT) {
    state.update(s => {
      s.isInputConnected = false;
      s.isInputReady = false;
      s.showReconnectHelp = false;
      s.reconnectState = {
        ...s.reconnectState,
        reconnecting: false,
        reconnectFailed: true,
        inUseAs: new Set(),
      };
      s.isInputOutdated = false;
      return s;
    });
  } else {
    state.update(s => {
      s.isOutputConnected = false;
      s.showReconnectHelp = false;
      s.isOutputReady = false;
      s.reconnectState = {
        ...s.reconnectState,
        reconnecting: false,
        reconnectFailed: true,
        inUseAs: new Set(),
      };
      s.isOutputOutdated = false;
      return s;
    });
  }
};

export const stateOnStopOfferingReconnect = () => {
  state.update(s => {
    s.showReconnectHelp = false;
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

export const stateOnReconnectionAttempt = () => {
  state.update(s => {
    s.showReconnectHelp = false;
    s.reconnectState = {
      ...s.reconnectState,
      reconnecting: true,
    };
    return s;
  });
};
