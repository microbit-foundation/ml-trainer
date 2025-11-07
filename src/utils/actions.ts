/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ActionDataY, ActionDatumY, RecordingDataY, } from "../model";

export const getTotalNumSamples = (actions: ActionDataY) =>
  actions.map((a) => (a.get("recordings") as RecordingDataY).length).reduce((acc, curr) => acc + curr, 0);

// Y has no "every"
export const forSomeAction = (actions: ActionDataY, cb: (action: ActionDatumY) => boolean) => {
  for (const action of actions) {
    if (cb(action)) return true;
  }
  return false;
}

export const hasSufficientDataForTraining = (actions: ActionDataY): boolean => {
  return actions.length >= 2 && actions.map(action => (action.get("recordings") as RecordingDataY).length).reduce((p, c) => p && c >= 3, true);
};