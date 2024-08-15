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

  const MAX_DISTANCE = 1.1;
  const maxDistanceBetweenAll = height2 - height0;

  // If all notes are too close
  if (maxDistanceBetweenAll < MAX_DISTANCE * 2) {
    // Find middle and place labels around them
    const middle = maxDistanceBetweenAll / 2 + height0;
    labels[0].labelHeight = middle - MAX_DISTANCE;
    labels[1].labelHeight = middle;
    labels[2].labelHeight = middle + MAX_DISTANCE;
    return;
  }

  labels[0].labelHeight = height0;
  labels[1].labelHeight = height1;
  labels[2].labelHeight = height2;

  // If a pair are too close.
  for (let i = 0; i < 2; i++) {
    const diff = labels[i + 1].labelHeight - labels[i].labelHeight;
    if (diff > MAX_DISTANCE) continue;

    // Find middle and place labels around middle
    const middle = diff / 2 + labels[i].labelHeight;
    labels[i + 1].labelHeight = middle + MAX_DISTANCE / 2;
    labels[i].labelHeight = middle - MAX_DISTANCE / 2;

    break; // Only one will be close to the other. Otherwise all were too close
  }
  return labels;
};
