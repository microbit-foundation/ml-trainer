import { DataWindow } from "./store";

export enum Filter {
  MAX = "max",
  MIN = "min",
  MEAN = "mean",
  STD = "std",
  PEAKS = "peaks",
  ACC = "acc",
  ZCR = "zcr",
  RMS = "rms",
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

type FilterStrategy = (data: number[]) => number;

const mean: FilterStrategy = (d) => d.reduce((a, b) => a + b) / d.length;

const stddev: FilterStrategy = (d) =>
  Math.sqrt(d.reduce((a, b) => a + Math.pow(b - mean(d), 2), 0) / d.length);

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
  avgFilter[lag - 1] = mean(lead_in);
  const stdFilter: number[] = [];
  stdFilter[lag - 1] = stddev(lead_in);

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
    avgFilter[i] = mean(y_lag);
    stdFilter[i] = stddev(y_lag);
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

const acc: FilterStrategy = (d) => d.reduce((a, b) => a + Math.abs(b));

const rms: FilterStrategy = (d) =>
  Math.sqrt(d.reduce((a, b) => a + Math.pow(b, 2), 0) / d.length);

// Max acceleration the micro:bit can detect.
// https://microbit-challenges.readthedocs.io/en/latest/tutorials/accelerometer.html#basic-functions
const maxAcceleration = 2.048;

export const getMlFilters = (
  dataWindow: DataWindow
): Record<Filter, { strategy: FilterStrategy; min: number; max: number }> => ({
  [Filter.MAX]: {
    strategy: (d) => Math.max(...d),
    min: -maxAcceleration,
    max: maxAcceleration,
  },
  [Filter.MIN]: {
    strategy: (d) => Math.min(...d),
    min: -maxAcceleration,
    max: maxAcceleration,
  },
  [Filter.MEAN]: {
    strategy: mean,
    min: -maxAcceleration,
    max: maxAcceleration,
  },
  [Filter.STD]: { strategy: stddev, min: 0, max: maxAcceleration },
  [Filter.PEAKS]: { strategy: peaks, min: 0, max: 10 },
  [Filter.ACC]: {
    strategy: acc,
    min: 0,
    max: dataWindow.minSamples * maxAcceleration,
  },
  [Filter.ZCR]: { strategy: zeroCrossingRate, min: 0, max: 1 },
  [Filter.RMS]: {
    strategy: rms,
    min: 0,
    max: rms(Array(dataWindow.minSamples).fill(maxAcceleration) as number[]),
  },
});
