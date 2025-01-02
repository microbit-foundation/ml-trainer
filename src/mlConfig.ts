/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { DataWindow } from "./store";
import { maxMagnetometer } from "./utils/magnetometer";

export enum Filter {
  MAX = "max",
  MIN = "min",
  MEAN = "mean",
  STD = "std",
  PEAKS = "peaks",
  ACC = "acc",
  ZCR = "zcr",
  RMS = "rms",
  GRADIENT = "gradient",
}

export enum Axes {
  X = "x",
  Y = "y",
  Z = "z",
}

export const mlSettings = {
  updatesPrSecond: 4, // Times algorithm predicts data pr second
  defaultRequiredConfidence: 0.8, // Default threshold
  numEpochs: 160, // Number of epochs for ML
  learningRate: 0.1,
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

type FilterStrategy = (data: number[], dataWindow: DataWindow) => number;

const _mean = (d: number[]) => d.reduce((a, b) => a + b) / d.length;
const mean: FilterStrategy = (d) => _mean(d);

const _stddev = (d: number[]) =>
  Math.sqrt(d.reduce((a, b) => a + Math.pow(b - _mean(d), 2), 0) / d.length);
const stddev: FilterStrategy = (d) => _stddev(d);

const peaks: FilterStrategy = (data) => {
  const lag = 5;
  const threshold = 3.5;
  const influence = 0.5;

  let peaksCounter = 0;

  if (data.length < lag + 2) {
    throw new Error("data sample is too short");
  }

  // init variables
  const signals = Array(data.length).fill(0) as number[];
  const filteredY = data.slice(0);
  const lead_in = data.slice(0, lag);

  const avgFilter: number[] = [];
  avgFilter[lag - 1] = _mean(lead_in);
  const stdFilter: number[] = [];
  stdFilter[lag - 1] = _mean(lead_in);

  for (let i = lag; i < data.length; i++) {
    if (
      Math.abs(data[i] - avgFilter[i - 1]) > 0.1 &&
      Math.abs(data[i] - avgFilter[i - 1]) > threshold * stdFilter[i - 1]
    ) {
      if (data[i] > avgFilter[i - 1]) {
        signals[i] = +1; // positive signal
        if (i - 1 > 0 && signals[i - 1] == 0) {
          peaksCounter++;
        }
      } else {
        signals[i] = -1; // negative signal
      }
      // make influence lower
      filteredY[i] = influence * data[i] + (1 - influence) * filteredY[i - 1];
    } else {
      signals[i] = 0; // no signal
      filteredY[i] = data[i];
    }

    // adjust the filters
    const y_lag = filteredY.slice(i - lag, i);
    avgFilter[i] = _mean(y_lag);
    stdFilter[i] = _stddev(y_lag);
  }
  return peaksCounter;
};

const zeroCrossingRate: FilterStrategy = (data) => {
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    if (
      (data[i] >= 0 && data[i - 1] < 0) ||
      (data[i] < 0 && data[i - 1] >= 0)
    ) {
      count++;
    }
  }
  return count / (data.length - 1);
};

const acc: FilterStrategy = (data: number[], dataWindow: DataWindow) => {
  const totalAcc = data.reduce((a, b) => a + Math.abs(b), 0);
  // Normalize the total acceleration using the number of samples the device
  // is guaranteed to operate on. This should reduce differences in the model
  // predication between the browser and device.
  return (totalAcc / data.length) * dataWindow.deviceSamplesLength;
};

const _rms = (d: number[]) =>
  Math.sqrt(d.reduce((a, b) => a + Math.pow(b, 2), 0) / d.length);
const rms: FilterStrategy = (d) => _rms(d);

interface Gradient {
  start: number;
  end: number;
  yDiff: number;
  vector: number;
}

const getMovingAverage = (data: number[]): number[] => {
  const numSamplesToAverage = 6;
  const smoothed: number[] = [];
  for (let i = 0; i <= data.length - numSamplesToAverage; i++) {
    const x =
      data.slice(i, i + numSamplesToAverage).reduce((a, b) => a + b) /
      numSamplesToAverage;
    smoothed.push(x);
  }
  return smoothed;
};

const getGradients = (data: number[]): Gradient[] => {
  const smoothedData = getMovingAverage(data);
  let start = 0;
  let sampleVector: number | undefined;
  const gradients: Gradient[] = [];
  for (let i = 0; i < smoothedData.length - 1; i++) {
    const sampleDiff = smoothedData[i + 1] - smoothedData[i];
    const currentVector =
      Math.sign(sampleDiff) * Math.sqrt(2 ** 2 + sampleDiff ** 2);
    if (sampleVector === undefined) {
      sampleVector = currentVector;
    } else {
      if (
        Math.sign(sampleVector) !== Math.sign(currentVector) &&
        Math.sign(currentVector) !== 0
      ) {
        const end = i;
        const yDiff = smoothedData[end] - smoothedData[start];
        const vector =
          Math.sign(yDiff) * Math.sqrt((end - start) ** 2 + yDiff ** 2);
        gradients.push({
          start,
          end,
          yDiff,
          vector,
        });
        start = end;
      }
      sampleVector = currentVector;
    }
  }
  return gradients;
};

// Returns first significant gradient as vector.
const gradient: FilterStrategy = (
  data: number[],
  dataWindow: DataWindow
): number => {
  const gradients = getGradients(data);
  const vectors = gradients.map((g) => Math.abs(g.vector));
  const vectorMean = mean(vectors, dataWindow);
  const vectorStdDev = stddev(vectors, dataWindow);
  const yDiffs = gradients.map((g) => Math.abs(g.yDiff));
  const yDiffMean = yDiffs.reduce((a, b) => a + b, 0) / yDiffs.length;
  const yDiffStdDev = Math.sqrt(
    yDiffs.reduce((a, b) => a + Math.pow(b - yDiffMean, 2), 0) / yDiffs.length
  );
  const range = 2; // Data is scaled to -1..1
  for (let i = 0; i < vectors.length; i++) {
    if (
      vectors[i] > vectorMean + vectorStdDev &&
      yDiffs[i] > yDiffMean + yDiffStdDev &&
      yDiffs[i] > range / 10
    ) {
      return gradients[i].vector;
    }
  }
  return 0;
};

// Max acceleration the micro:bit can detect.
// https://microbit-challenges.readthedocs.io/en/latest/tutorials/accelerometer.html#basic-functions
export const maxAcceleration = 2.048;
export const maxAccelerationScaleForGraphs = 2.2;

export const getMlFilters = (
  dataWindow: DataWindow
): Record<Filter, { strategy: FilterStrategy; min: number; max: number }> => ({
  [Filter.MAX]: {
    strategy: (d) => Math.max(...d),
    min: -maxMagnetometer,
    max: maxMagnetometer,
  },
  [Filter.MIN]: {
    strategy: (d) => Math.min(...d),
    min: -maxMagnetometer,
    max: maxMagnetometer,
  },
  [Filter.MEAN]: {
    strategy: mean,
    min: -maxMagnetometer,
    max: maxMagnetometer,
  },
  [Filter.STD]: { strategy: stddev, min: 0, max: maxMagnetometer },
  [Filter.PEAKS]: { strategy: peaks, min: 0, max: 10 },
  [Filter.ACC]: {
    strategy: acc,
    min: 0,
    max: dataWindow.minSamples * maxMagnetometer,
  },
  [Filter.ZCR]: { strategy: zeroCrossingRate, min: 0, max: 1 },
  [Filter.RMS]: {
    strategy: rms,
    min: 0,
    max: _rms(Array(dataWindow.minSamples).fill(maxMagnetometer) as number[]),
  },
  [Filter.GRADIENT]: {
    strategy: gradient,
    min: 0,
    max: dataWindow.minSamples * maxMagnetometer,
  },
});
