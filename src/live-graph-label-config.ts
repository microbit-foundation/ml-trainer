/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { maxAcceleration } from "./mlConfig";

const maxDistance = 1.1;

export interface LabelConfig {
  label: string;
  arrowHeight: number;
  labelHeight: number;
}

export const getLabelHeights = (dataPoint: {
  x: number;
  y: number;
  z: number;
}) => {
  const result: LabelConfig[] = [];
  const keys = Object.keys(dataPoint);
  Object.values(dataPoint).forEach((value, idx) => {
    result.push({
      label: keys[idx],
      arrowHeight: getArrowHeight(value),
      labelHeight: 0,
    });
  });
  return fixOverlappingLabels(result);
};

const scaleDataToArrowHeight = (value: number) => {
  // The proportion of 10 rem assigned to -2.2 to 2.2 that relate to acc values (2.048)
  // is 10 / 4.4 * (2.048 * 2) = ~9.309
  // Remove half the difference of 10 - 9.309  and apply to the range we translate to
  // (-1.5 rem to 8.5 rem). This gives the newMin and newMax values below.
  const newMin = 8.15;
  const newMax = -1.15;
  return (
    ((newMax - newMin) * (value - -maxAcceleration)) /
      (maxAcceleration - -maxAcceleration) +
    newMin
  );
};

const getArrowHeight = (pos: number) => scaleDataToArrowHeight(pos);

const fixOverlappingLabels = (labels: LabelConfig[]): LabelConfig[] => {
  labels.sort((a, b) => a.arrowHeight - b.arrowHeight);

  const height0 = labels[0].arrowHeight;
  const height1 = labels[1].arrowHeight;
  const height2 = labels[2].arrowHeight;

  const currMaxDistanceBetweenAll = height2 - height0;

  // If all the labels are too close, we find the middle and position the labels around it.
  if (currMaxDistanceBetweenAll < maxDistance * 2) {
    const midArrowHeight = currMaxDistanceBetweenAll / 2 + height0;
    labels[0].labelHeight = midArrowHeight - maxDistance;
    labels[1].labelHeight = midArrowHeight;
    labels[2].labelHeight = midArrowHeight + maxDistance;
    return labels;
  }

  labels[0].labelHeight = height0;
  labels[1].labelHeight = height1;
  labels[2].labelHeight = height2;

  // If a pair of labels are too close, we find the middle and position both labels around it.
  for (let i = 0; i < 2; i++) {
    const diff = labels[i + 1].labelHeight - labels[i].labelHeight;
    if (diff > maxDistance) continue;

    const midArrowHeight = diff / 2 + labels[i].labelHeight;
    labels[i + 1].labelHeight = midArrowHeight + maxDistance / 2;
    labels[i].labelHeight = midArrowHeight - maxDistance / 2;

    // Only one of the labels will be close to the other, otherwise all are too close.
    break;
  }
  return labels;
};
