import { get } from 'svelte/store';
import {
  connectionDialogState,
  ConnectDialogStates,
  startConnectionProcess,
} from '../stores/connectDialogStore';
import { state } from '../stores/uiStore';
import Microbits from '../microbit-interfacing/Microbits';
import { stateOnFailedToConnect } from '../microbit-interfacing/state-updaters';

export const reconnect = async () => {
  state.update(s => {
    s.showReconnectHelp = false;
    s.reconnectState = {
      ...s.reconnectState,
      connecting: true,
    };
    return s;
  });
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
    reconnectState.inUseAs.forEach(s => stateOnFailedToConnect(s));
    startConnectionProcess();
  } finally {
    state.update(s => {
      s.reconnectState = {
        ...s.reconnectState,
        connecting: false,
      };
      return s;
    });
  }
};
