/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { prepareFeaturesAndLabels } from "../ml";
import { trainModelFromFeatures, TrainingResult } from "../ml-train-core";
import { mlSettings } from "../mlConfig";
import { ActionData } from "../model";
import { DataWindow } from "../project-utils";

/**
 * Train a model from raw action data using the app's configured
 * hyperparameters. Mirrors what the training worker does (feature extraction +
 * trainModelFromFeatures) but runs in-process
 */
export const trainModelForTest = async (
  data: ActionData[],
  dataWindow: DataWindow
): Promise<{
  trainingResult: TrainingResult;
  features: number[][];
  labels: number[][];
}> => {
  const { features, labels } = prepareFeaturesAndLabels(data, dataWindow);
  const trainingResult = await trainModelFromFeatures(features, labels, {
    numEpochs: mlSettings.numEpochs,
    learningRate: mlSettings.learningRate,
  });
  return { trainingResult, features, labels };
};
