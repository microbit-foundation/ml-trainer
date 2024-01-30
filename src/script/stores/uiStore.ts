/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { get, writable } from 'svelte/store';
import {
  type CompatibilityStatus,
  checkCompatibility,
} from '../compatibility/CompatibilityChecker';
import { t } from '../../i18n';
import { DeviceRequestStates } from './connectDialogStore';
import CookieManager from '../CookieManager';
import { isInputPatternValid } from './connectionStore';
import { gestures } from './Stores';
import { HexOrigin } from '../microbit-interfacing/MicrobitsAlt';

// TODO: Rename? Split up further?

let text: (key: string, vars?: object) => string;
t.subscribe(t => (text = t));

export const compatibility = writable<CompatibilityStatus>(checkCompatibility());

export const isCompatibilityWarningDialogOpen = writable<boolean>(false);

export enum ModelView {
  TILE,
  STACK,
}

// Store current state to prevent error prone actions
export const state = writable<{
  isRequestingDevice: DeviceRequestStates;
  isFlashingDevice: boolean;
  isTesting: boolean;
  isRecording: boolean;
  isTraining: boolean;
  trainingProgress: number; // where 1 is 100% complete
  isInputConnected: boolean;
  isOutputConnected: boolean;
  hasTrainedBefore: boolean;
  isPredicting: boolean;
  offerReconnect: boolean;
  requestDeviceWasCancelled: boolean;
  reconnectState: DeviceRequestStates;
  isInputReady: boolean;
  isInputAssigned: boolean;
  inputVersion: number;
  inputOrigin: HexOrigin;
  isOutputAssigned: boolean;
  isOutputReady: boolean;
  outputVersion: number;
  outputOrigin: HexOrigin;
  modelView: ModelView;
  isInputOutdated: boolean;
  isOutputOutdated: boolean;
}>({
  isRequestingDevice: DeviceRequestStates.NONE,
  isFlashingDevice: false,
  isTesting: false,
  isRecording: false,
  isTraining: false,
  trainingProgress: 0,
  isInputConnected: false,
  isOutputConnected: false,
  hasTrainedBefore: false,
  isPredicting: false,
  offerReconnect: false,
  requestDeviceWasCancelled: false,
  reconnectState: DeviceRequestStates.NONE,
  isInputReady: false,
  isInputAssigned: false,
  inputVersion: -1,
  inputOrigin: HexOrigin.UNKNOWN,
  isOutputAssigned: false,
  isOutputReady: false,
  outputVersion: -1,
  outputOrigin: HexOrigin.UNKNOWN,
  modelView: ModelView.STACK,
  isInputOutdated: false,
  isOutputOutdated: false,
});

// Message store to propagate allow all components to inform users.
export const message = writable<{ warning: boolean; text: string }>({
  warning: false,
  text: '',
});

// Message store to propagate allow all components to inform users.
export const outputting = writable<{ text: string }>({ text: '' });

// Alert user sets current message to text and hightlights it.
export function alertUser(text: string): void {
  message.set({
    warning: true,
    text: text,
  });
}

// Assess whether an action is allowed. Alert user if not
export function areActionsAllowed(actionAllowed = true, alertIfNotReady = true): boolean {
  const status = assessStateStatus(actionAllowed);

  if (!status.isReady && alertIfNotReady) {
    alertUser(status.msg);
  }

  return status.isReady;
}

// Assess status and return message to alert user.
function assessStateStatus(actionAllowed = true): { isReady: boolean; msg: string } {
  const currentState = get(state);

  if (currentState.isRecording) return { isReady: false, msg: text('alert.isRecording') };
  if (currentState.isTesting) return { isReady: false, msg: text('alert.isTesting') };
  if (currentState.isTraining) return { isReady: false, msg: text('alert.isTraining') };
  if (!currentState.isInputConnected && actionAllowed)
    return { isReady: false, msg: text('alert.isNotConnected') };

  return { isReady: true, msg: '' };
}

export const hasSufficientData = (): boolean => {
  if (!gestures) {
    return false;
  }
  if (gestures.getNumberOfGestures() < 2) {
    return false;
  }
  return !gestures.getGestures().some(gesture => gesture.getRecordings().length < 3);
};

export const buttonPressed = writable<{ buttonA: 0 | 1; buttonB: 0 | 1 }>({
  buttonA: 0,
  buttonB: 0,
});

export enum MicrobitInteractions {
  A,
  B,
  AB,
}

const initialMicrobitInteraction: MicrobitInteractions = MicrobitInteractions.B;

export const microbitInteraction = writable<MicrobitInteractions>(
  initialMicrobitInteraction,
);

/**
 * Workaround for an unrecoverable reconnect failure due to a bug in chrome/chromium
 * Refresh the page is the only known solution
 */
export const onCatastrophicError = () => {
  // Set flag to offer reconnect when page reloads
  if (isInputPatternValid()) {
    CookieManager.setReconnectFlag();
  }
  location.reload();
};
