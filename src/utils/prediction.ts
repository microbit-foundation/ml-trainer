/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Confidences } from "../ml";
import { mlSettings } from "../mlConfig";
import { ActionDataY, ActionDatumY } from "../model";

export const getDetectedAction = (
  actions: ActionDataY,
  confidences: Confidences | undefined
): ActionDatumY | undefined => {
  if (!confidences) {
    return undefined;
  }

  // If more than one meet the threshold pick the highest
  const thresholded = actions
    .map((action) => ({
      action,
      thresholdDelta:
        confidences[action.get("ID") as number] -
        (action.get("requiredConfidence") as number ?? mlSettings.defaultRequiredConfidence),
    }))
    .sort((left, right) => {
      const a = left.thresholdDelta;
      const b = right.thresholdDelta;
      return a < b ? -1 : a > b ? 1 : 0;
    });

  const prediction = thresholded[thresholded.length - 1];
  return prediction.thresholdDelta >= 0 ? prediction.action : undefined;
};
