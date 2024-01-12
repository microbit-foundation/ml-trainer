/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { GestureData } from './stores/mlStore';

export const getPrediction = (gestures: GestureData[]): GestureData | undefined => {
  const confidentGestures = gestures.filter(g => g.confidence.isConfident);
  if (confidentGestures.length === 0) {
    return undefined;
  }
  return confidentGestures.reduce((prevPredictedGesture, gesture) => {
    return prevPredictedGesture.confidence.currentConfidence <
      gesture.confidence.currentConfidence
      ? gesture
      : prevPredictedGesture;
  });
};
