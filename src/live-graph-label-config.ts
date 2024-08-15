const maxDistance = 1.1;

type Dimension = "x" | "y" | "z";
export interface LabelConfig {
  label: Dimension;
  arrowHeight: number;
  labelHeight: number;
  color: string;
  id: number;
}

export const getUpdatedLabelConfig = (
  labelConfigs: LabelConfig[],
  dataPoint: { x: number; y: number; z: number }
) => {
  const newLabelConfigs = labelConfigs.map((config) => ({
    ...config,
    arrowHeight: getArrowHeight(dataPoint[config.label]),
  }));
  const fixedLabels = fixOverlappingLabels(newLabelConfigs);
  return fixedLabels ?? newLabelConfigs;
};

const getArrowHeight = (pos: number) => (2.1 - pos) * 2.32;

const fixOverlappingLabels = (labels: LabelConfig[]) => {
  labels.sort((a, b) => {
    return a.arrowHeight - b.arrowHeight;
  });

  const height0 = labels[0].arrowHeight;
  const height1 = labels[1].arrowHeight;
  const height2 = labels[2].arrowHeight;

  const maxDistanceBetweenAll = height2 - height0;

  // If all the labels are too close, we find the middle and position the labels around it.
  if (maxDistanceBetweenAll < maxDistance * 2) {
    const middle = maxDistanceBetweenAll / 2 + height0;
    labels[0].labelHeight = middle - maxDistance;
    labels[1].labelHeight = middle;
    labels[2].labelHeight = middle + maxDistance;
    return;
  }

  labels[0].labelHeight = height0;
  labels[1].labelHeight = height1;
  labels[2].labelHeight = height2;

  // If a pair of labels are too close, we find the middle and position both labels around it.
  for (let i = 0; i < 2; i++) {
    const diff = labels[i + 1].labelHeight - labels[i].labelHeight;
    if (diff > maxDistance) continue;

    const middle = diff / 2 + labels[i].labelHeight;
    labels[i + 1].labelHeight = middle + maxDistance / 2;
    labels[i].labelHeight = middle - maxDistance / 2;

    // Only one of the labels will be close to the other, otherwise all are too close.
    break;
  }
  return labels;
};
