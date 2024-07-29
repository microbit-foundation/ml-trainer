import * as tf from "@tensorflow/tfjs";
import { GestureData, XYZData } from "./gestures-hooks";
import { Filter, mlFilters } from "./mlFilters";
import { SymbolicTensor } from "@tensorflow/tfjs";

export enum Axes {
  X = "x",
  Y = "y",
  Z = "z",
}

export const mlSettings = {
  duration: 1800, // Duration of recording
  numSamples: 80, // number of samples in one recording (when recording samples)
  minSamples: 80, // minimum number of samples for reliable detection (when detecting gestures)
  updatesPrSecond: 4, // Times algorithm predicts data pr second
  numEpochs: 80, // Number of epochs for ML
  learningRate: 0.5,
  includedAxes: [Axes.X, Axes.Y, Axes.Z],
  includedFilters: new Set<Filter>([
    Filter.MAX,
    Filter.MEAN,
    Filter.MIN,
    Filter.STD,
    Filter.PEAKS,
    Filter.ACC,
    Filter.ZCR,
    Filter.RMS,
  ]),
};

interface TrainModelInput {
  data: GestureData[];
  onTrainEnd?: () => void;
  onTraining?: (progress: number) => void;
  onError?: () => void;
}

export const trainModel = async ({
  data,
  onTrainEnd,
  onTraining,
  onError,
}: TrainModelInput): Promise<tf.LayersModel | void> => {
  const { features, labels } = prepareFeaturesAndLabels(data);
  const nn: tf.LayersModel = createModel(data);
  const totalNumEpochs = mlSettings.numEpochs;

  try {
    await nn.fit(tf.tensor(features), tf.tensor(labels), {
      epochs: totalNumEpochs,
      batchSize: 16,
      validationSplit: 0.1,
      callbacks: {
        onTrainEnd,
        onEpochEnd: (epoch: number) => {
          // Epochs indexed at 0
          onTraining && onTraining(epoch / (totalNumEpochs - 1));
        },
      },
    });
  } catch (err) {
    onError && onError();
    console.error("tensorflow training process failed:", err);
  }
  return nn;
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
      features.push(applyFilters(recording.data));

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
    optimizer: tf.train.sgd(0.5),
    metrics: ["accuracy"],
  });

  return model;
};

// Exported for testing
// applyFilters reduces array of x, y and z inputs to a single number array with values.
export const applyFilters = ({ x, y, z }: XYZData): number[] => {
  return Array.from(mlSettings.includedFilters).reduce((acc, filter) => {
    const filterStrategy = mlFilters[filter];
    return [...acc, filterStrategy(x), filterStrategy(y), filterStrategy(z)];
  }, [] as number[]);
};

interface PredictInput {
  model: tf.LayersModel;
  data: XYZData;
  classificationIds: number[];
}

export type Confidences = Record<GestureData["ID"], number>;

// For predicting
export const predict = async ({
  model,
  data,
  classificationIds,
}: PredictInput): Promise<Confidences | void> => {
  const input = applyFilters(data);
  const prediction = model.predict(tf.tensor([input])) as tf.Tensor;
  try {
    const confidences = (await prediction.data()) as Float32Array;
    return classificationIds.reduce(
      (acc, id, idx) => ({ ...acc, [id]: confidences[idx] }),
      {}
    );
  } catch (e) {
    console.error("Prediction error:", e);
  }
};