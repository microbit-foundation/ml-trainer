/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ActionData, DataSamplesPageHint } from "./model";

export const hasSufficientDataForTraining = (
  actions: ActionData[]
): boolean => {
  return actions.length >= 2 && actions.every((a) => a.recordings.length >= 3);
};

export const getHint = (
  actions: ActionData[],
  suppressTrainAndAddActionHint: boolean
): DataSamplesPageHint => {
  // We don't let you have zero actions.
  if (actions.length === 0) {
    return null;
  }
  const lastActionIdx = actions.length - 1;
  const lastAction = actions[lastActionIdx];

  // If first unnamed action is an earlier action and has no recordings,
  // use short name action hint (only occupies space within action row).
  const firstUnnamedActionIdx = actions.findIndex(
    (a) => a.name.length === 0 && a.recordings.length === 0
  );
  if (firstUnnamedActionIdx > -1 && firstUnnamedActionIdx !== lastActionIdx) {
    return { type: "name-action-short", actionIdx: firstUnnamedActionIdx };
  }

  // If unnamed last action has recordings, use name action with samples hint.
  if (lastAction.name.length === 0 && lastAction.recordings.length > 0) {
    return {
      type: "name-action-with-samples",
      actionIdx: lastActionIdx,
    };
  }
  // If unnamed last action has no recordings, use name action hint for first
  // two actions, otherwise, use the shorter name action hint for the rest.
  // The short name action hint only occupies space within the action row so
  // that it is more visible in shorter screen sizes.
  if (lastAction.name.length === 0) {
    return {
      type: lastActionIdx < 2 ? "name-action" : "name-action-short",
      actionIdx: lastActionIdx,
    };
  }

  // If you have > 2 actions, you've seen the remaining hints before.
  const sufficientDataForTraining = hasSufficientDataForTraining(actions);
  if (actions.length > 2) {
    if (sufficientDataForTraining && !suppressTrainAndAddActionHint) {
      return { type: "train" };
    }
    return null;
  }
  const firstNoRecordingsActionIdx = actions.findIndex(
    (a) => a.recordings.length === 0
  );
  if (firstNoRecordingsActionIdx > -1) {
    return {
      type: "record-action",
      actionIdx: firstNoRecordingsActionIdx,
    };
  }
  if (lastAction.recordings.length < 3) {
    return { type: "record-more-action" };
  }
  if (lastActionIdx === 0 && !suppressTrainAndAddActionHint) {
    return { type: "add-action" };
  }
  if (sufficientDataForTraining && !suppressTrainAndAddActionHint) {
    return { type: "train" };
  }
  return null;
};
