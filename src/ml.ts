/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import * as tf from "@tensorflow/tfjs";
import { getMlFilters, mlSettings } from "./mlConfig";
import {
  artifactsToModel,
  modelToArtifacts,
  trainModelFromFeatures,
  type TrainingResult,
} from "./ml-train-core";
import { ActionData, XYZData } from "./model";
import { DataWindow } from "./project-utils";

export { artifactsToModel, modelToArtifacts, type TrainingResult };

export const trainModel = async (
  data: ActionData[],
  dataWindow: DataWindow,
  onProgress?: (progress: number) => void
): Promise<TrainingResult> => {
  const { features, labels } = prepareFeaturesAndLabels(data, dataWindow);
  return trainModelFromFeatures(
    features,
    labels,
    {
      numEpochs: mlSettings.numEpochs,
      learningRate: mlSettings.learningRate,
    },
    onProgress
  );
};

// Exported for testing
export const prepareFeaturesAndLabels = (
  actions: ActionData[],
  dataWindow: DataWindow
): { features: number[][]; labels: number[][] } => {
  const features: number[][] = [];
  const labels: number[][] = [];
  const numActions = actions.length;

  actions.forEach((action, index) => {
    action.recordings.forEach((recording) => {
      // Prepare features
      features.push(Object.values(applyFilters(recording.data, dataWindow)));

      // Prepare labels
      const label: number[] = new Array(numActions) as number[];
      label.fill(0, 0, numActions);
      label[index] = 1;
      labels.push(label);
    });
  });
  return { features, labels };
};

const normalize = (value: number, min: number, max: number) => {
  const newMin = 0;
  const newMax = 1;
  return ((newMax - newMin) * (value - min)) / (max - min) + newMin;
};

// Used for training model and producing fingerprints
// applyFilters reduces array of x, y and z inputs to a single number array with values.
export const applyFilters = (
  { x, y, z }: XYZData,
  dataWindow: DataWindow,
  opts: { normalize?: boolean } = {}
): Record<string, number> => {
  if (x.length === 0 || y.length === 0 || z.length === 0) {
    throw new Error("Empty x/y/z data");
  }
  const filters = getMlFilters(dataWindow);
  return Array.from(mlSettings.includedFilters).reduce((acc, filter) => {
    const { strategy, min, max } = filters[filter];
    const applyFilter = (vs: number[]) =>
      opts.normalize
        ? normalize(strategy(vs, dataWindow), min, max)
        : strategy(vs, dataWindow);
    return {
      ...acc,
      [`${filter}-x`]: applyFilter(x),
      [`${filter}-y`]: applyFilter(y),
      [`${filter}-z`]: applyFilter(z),
    };
  }, {} as Record<string, number>);
};

interface PredictInput {
  model: tf.LayersModel;
  data: XYZData;
  classificationIds: string[];
}

export type Confidences = Record<string, number>;

export type ConfidencesResult =
  | { error: true; detail: unknown }
  | { error: false; confidences: Confidences };

// For predicting
export const predict = (
  { model, data, classificationIds }: PredictInput,
  dataWindow: DataWindow
): ConfidencesResult => {
  const input = Object.values(applyFilters(data, dataWindow));
  const prediction = model.predict(tf.tensor([input])) as tf.Tensor;
  try {
    const confidences = prediction.dataSync() as Float32Array;
    return {
      error: false,
      confidences: classificationIds.reduce(
        (acc, id, idx) => ({ ...acc, [id]: confidences[idx] }),
        {}
      ),
    };
  } catch (e) {
    return { error: true, detail: e };
  }
};
