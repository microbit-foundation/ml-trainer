/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 *
 * Pure TensorFlow.js training core. This module deliberately imports *only*
 * TensorFlow.js (no app modules) so it can be bundled into a Web Worker without
 * dragging in UI/DOM code. It knows nothing about the app's data model — it
 * operates on already-computed feature/label matrices.
 */
import * as tf from "@tensorflow/tfjs";
import { SymbolicTensor } from "@tensorflow/tfjs";

export type TrainingResult =
  | { error: false; model: tf.LayersModel }
  | { error: true };

export interface TrainModelOptions {
  /**
   * Number of training epochs.
   */
  numEpochs: number;
  /**
   * SGD learning rate.
   */
  learningRate: number;
  /**
   * Training batch size.
   */
  batchSize?: number;
}

const createModel = (
  inputSize: number,
  numberOfClasses: number,
  learningRate: number
): tf.LayersModel => {
  const input = tf.input({ shape: [inputSize] });
  const normalizer = tf.layers.batchNormalization().apply(input);
  const dense = tf.layers
    .dense({ units: 16, activation: "relu" })
    .apply(normalizer);
  const softmax = tf.layers
    .dense({ units: numberOfClasses, activation: "softmax" })
    .apply(dense) as SymbolicTensor;
  const model = tf.model({ inputs: input, outputs: softmax });

  model.compile({
    loss: "categoricalCrossentropy",
    optimizer: tf.train.sgd(learningRate),
    metrics: ["accuracy"],
  });

  return model;
};

/**
 * Train a model from pre-computed feature/label matrices. Uses whichever
 * TensorFlow.js backend is active on the calling thread.
 */
export const trainModelFromFeatures = async (
  features: number[][],
  labels: number[][],
  { numEpochs, learningRate, batchSize = 16 }: TrainModelOptions,
  onProgress?: (progress: number) => void
): Promise<TrainingResult> => {
  if (features.length === 0 || labels.length === 0) {
    return { error: true };
  }
  const model = createModel(features[0].length, labels[0].length, learningRate);

  try {
    await model.fit(tf.tensor(features), tf.tensor(labels), {
      epochs: numEpochs,
      batchSize,
      shuffle: true,
      // We don't do anything with the validation data, so might
      // as well train using all of it.
      validationSplit: 0,
      callbacks: {
        onEpochEnd: (epoch: number) => {
          // Epochs indexed at 0
          onProgress && onProgress(epoch / (numEpochs - 1));
        },
      },
    });
  } catch (err) {
    return { error: true };
  }
  return { error: false, model };
};

/**
 * Serialise a trained model to in-memory artifacts that can be structured-cloned
 * across a worker boundary. Pairs with {@link artifactsToModel}.
 */
export const modelToArtifacts = async (
  model: tf.LayersModel
): Promise<tf.io.ModelArtifacts> => {
  let captured: tf.io.ModelArtifacts | undefined;
  await model.save(
    tf.io.withSaveHandler((artifacts) => {
      captured = artifacts;
      return Promise.resolve({
        modelArtifactsInfo: {
          dateSaved: new Date(),
          modelTopologyType: "JSON",
        },
      });
    })
  );
  if (!captured) {
    throw new Error("Failed to capture model artifacts");
  }
  return captured;
};

/**
 * Reconstruct a model from in-memory artifacts produced by
 * {@link modelToArtifacts}. Runs on whichever backend is active on the calling
 * thread; the weights are backend-agnostic.
 */
export const artifactsToModel = (
  artifacts: tf.io.ModelArtifacts
): Promise<tf.LayersModel> => tf.loadLayersModel(tf.io.fromMemory(artifacts));
