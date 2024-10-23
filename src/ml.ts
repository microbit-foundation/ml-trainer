import * as tf from "@tensorflow/tfjs";
import { SymbolicTensor } from "@tensorflow/tfjs";
import { mlFilters, mlSettings } from "./mlConfig";
import { GestureData, XYZData } from "./model";

interface TrainModelInput {
  data: GestureData[];
  onProgress?: (progress: number) => void;
}

export type TrainingResult =
  | { error: false; model: tf.LayersModel }
  | { error: true };

export const trainModel = async ({
  data,
  onProgress,
}: TrainModelInput): Promise<TrainingResult> => {
  const { features, labels } = prepareFeaturesAndLabels(data);
  const model: tf.LayersModel = createModel(data);
  const totalNumEpochs = mlSettings.numEpochs;
  console.log("Features", features);
  console.log("Labels", labels);
  try {
    await model.fit(tf.tensor(features), tf.tensor(labels), {
      epochs: totalNumEpochs,
      batchSize: 16,
      shuffle: true,
      // We don't do anything with the validation data, so might
      // as well train using all of it.
      validationSplit: 0,
      callbacks: {
        onEpochEnd: (epoch: number) => {
          // Epochs indexed at 0
          onProgress && onProgress(epoch / (totalNumEpochs - 1));
        },
      },
    });
  } catch (err) {
    return { error: true };
  }
  return { error: false, model };
};

// Exported for testing
export const prepareFeaturesAndLabels = (
  gestureData: GestureData[]
): { features: number[][]; labels: number[][] } => {
  const features: number[][] = [];
  const labels: number[][] = [];
  const numGestures = gestureData.length;

  gestureData.forEach((gesture, index) => {
    gesture.recordings.forEach((recording) => {
      // Prepare features
      features.push(Object.values(applyFilters(recording.data)));

      // Prepare labels
      const label: number[] = new Array(numGestures) as number[];
      label.fill(0, 0, numGestures);
      label[index] = 1;
      labels.push(label);
    });
  });
  return { features, labels };
};

const createModel = (gestureData: GestureData[]): tf.LayersModel => {
  const numberOfClasses: number = gestureData.length;
  const inputShape = [
    mlSettings.includedFilters.size * mlSettings.includedAxes.length,
  ];

  const input = tf.input({ shape: inputShape });
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
    optimizer: tf.train.sgd(mlSettings.learningRate),
    metrics: ["accuracy"],
  });

  return model;
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
  opts: { normalize?: boolean } = {}
): Record<string, number> => {
  if (x.length === 0 || y.length === 0 || z.length === 0) {
    throw new Error("Empty x/y/z data");
  }
  return Array.from(mlSettings.includedFilters).reduce((acc, filter) => {
    const { strategy, min, max } = mlFilters[filter];
    const applyFilter = (vs: number[]) =>
      opts.normalize ? normalize(strategy(vs), min, max) : strategy(vs);
    const d = {
      ...acc,
      [`${filter}-x`]: applyFilter(x),
      [`${filter}-y`]: applyFilter(y),
      [`${filter}-z`]: applyFilter(z),
    };
    return d;
  }, {} as Record<string, number>);
};

interface PredictInput {
  model: tf.LayersModel;
  data: XYZData;
  classificationIds: number[];
}

export type Confidences = Record<GestureData["ID"], number>;

export type ConfidencesResult =
  | { error: true; detail: unknown }
  | { error: false; confidences: Confidences };

// For predicting
export const predict = async ({
  model,
  data,
  classificationIds,
}: PredictInput): Promise<ConfidencesResult> => {
  const input = Object.values(applyFilters(data));
  const prediction = model.predict(tf.tensor([input])) as tf.Tensor;
  try {
    const confidences = (await prediction.data()) as Float32Array;
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
