/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { get } from 'svelte/store';
import {
  connectionDialogState,
  ConnectDialogStates,
  startConnectionProcess,
} from '../stores/connectDialogStore';
import { state } from '../stores/uiStore';
import Microbits from '../microbit-interfacing/Microbits';
import {
  stateOnFailedToConnect,
  stateOnReconnectionAttempt,
  stateOnShowReconnectHelp,
} from '../microbit-interfacing/state-updaters';

export const reconnect = async (finalAttempt: boolean = false) => {
  stateOnReconnectionAttempt();
  const { reconnectState } = get(state);
  if (get(state).reconnectState.connectionType === 'bluetooth') {
    connectionDialogState.update(s => {
      s.connectionState = ConnectDialogStates.BLUETOOTH_CONNECTING;
      return s;
    });
  } else {
    connectionDialogState.update(s => {
      s.connectionState = ConnectDialogStates.CONNECTING_MICROBITS;
      return s;
    });
  }
  try {
    for (const inUseAs of reconnectState.inUseAs.values()) {
      await Microbits.reconnect(inUseAs);
    }
    connectionDialogState.update(s => {
      s.connectionState = ConnectDialogStates.NONE;
      return s;
    });
  } catch (e) {
    if (finalAttempt) {
      reconnectState.inUseAs.forEach(s => Microbits.dispose(s));
      reconnectState.inUseAs.forEach(s => stateOnFailedToConnect(s));
      startConnectionProcess();
    } else {
      connectionDialogState.update(s => {
        s.connectionState = ConnectDialogStates.NONE;
        return s;
      });
      stateOnShowReconnectHelp(true);
    }
  } finally {
    state.update(s => {
      s.reconnectState = {
        ...s.reconnectState,
        reconnecting: false,
      };
      return s;
    });
  }
};
