/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { get, writable } from 'svelte/store';
import { t } from '../../i18n';
import CookieManager from '../CookieManager';
import {
  checkCompatibility,
  type CompatibilityStatus,
} from '../compatibility/CompatibilityChecker';
import MBSpecs from '../microbit-interfacing/MBSpecs';
import { gestures } from './Stores';
import { isInputPatternValid } from './connectionStore';
import { HexOrigin } from '../../StaticConfiguration';
import { DeviceRequestStates } from '../microbit-interfacing/MicrobitConnection';

// TODO: Rename? Split up further?

let text: (key: string, vars?: object) => string;
t.subscribe(t => (text = t));

export const compatibility = writable<CompatibilityStatus>(checkCompatibility());

export const isCompatibilityWarningDialogOpen = writable<boolean>(false);

export enum ModelView {
  TILE,
  STACK,
}

export type ConnectionType = 'none' | 'bluetooth' | 'bridge' | 'remote';

interface ReconnectState {
  connectionType: ConnectionType;
  inUseAs: Set<DeviceRequestStates.INPUT | DeviceRequestStates.OUTPUT>;
  reconnecting: boolean;
  reconnectFailed: boolean;
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
  showReconnectHelp: boolean;
  reconnectState: ReconnectState;
  isInputReady: boolean;
  isInputAssigned: boolean;
  inputHexVersion: number;
  inputMicrobitVersion: MBSpecs.MBVersion | -1;
  inputOrigin: HexOrigin;
  isOutputAssigned: boolean;
  isOutputReady: boolean;
  outputHexVersion: number;
  outputMicrobitVersion: MBSpecs.MBVersion | -1;
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
  showReconnectHelp: false,
  reconnectState: {
    connectionType: 'none',
    inUseAs: new Set(),
    reconnecting: false,
    reconnectFailed: false,
  },
  isInputReady: false,
  isInputAssigned: false,
  inputHexVersion: -1,
  inputMicrobitVersion: -1,
  inputOrigin: HexOrigin.UNKNOWN,
  isOutputAssigned: false,
  isOutputReady: false,
  outputHexVersion: -1,
  outputMicrobitVersion: -1,
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
