/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { t } from '../i18n';
import { get } from 'svelte/store';

export const Filters = {
  MAX: 'max',
  MEAN: 'mean',
  MIN: 'min',
  STD: 'std',
  PEAKS: 'peaks',
  ACC: 'acc',
  ZCR: 'zcr',
  RMS: 'rms',
  GRAD: 'grad',
} as const;

export type FilterType = (typeof Filters)[keyof typeof Filters];

export const Axes = {
  X: 'x',
  Y: 'y',
  Z: 'z',
} as const;

export type AxesType = (typeof Axes)[keyof typeof Axes];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

interface FilterStrategy {
  computeOutput(data: number[]): number;
  getText(): { name: string; description: string };
}

class MeanFilter implements FilterStrategy {
  computeOutput(data: number[]): number {
    return data.reduce((a, b) => a + b) / data.length;
  }
  getText() {
    return {
      name: get(t)('content.filters.mean.title'),
      description: get(t)('content.filters.mean.description'),
    };
  }
}

class SDFilter implements FilterStrategy {
  computeOutput(data: number[]): number {
    const mean = data.reduce((a, b) => a + b) / data.length;
    return Math.sqrt(data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length);
  }
  getText() {
    return {
      name: get(t)('content.filters.std.title'),
      description: get(t)('content.filters.std.description'),
    };
  }
}

class RootMeanSquareFilter implements FilterStrategy {
  computeOutput(data: number[]): number {
    const res = Math.sqrt(data.reduce((a, b) => a + Math.pow(b, 2), 0) / data.length);
    return res;
  }
  getText() {
    return {
      name: get(t)('content.filters.rms.title'),
      description: get(t)('content.filters.rms.description'),
    };
  }
}

class ZeroCrossingRateFilter implements FilterStrategy {
  computeOutput(data: number[]): number {
    let count = 0;
    for (let i = 1; i < data.length; i++) {
      if ((data[i] >= 0 && data[i - 1] < 0) || (data[i] < 0 && data[i - 1] >= 0)) {
        count++;
      }
    }
    return count / (data.length - 1);
  }
  getText() {
    return {
      name: get(t)('content.filters.zcr.title'),
      description: get(t)('content.filters.zcr.description'),
    };
  }
}

class TotalAccFilter implements FilterStrategy {
  computeOutput(data: number[]): number {
    return data.reduce((a, b) => a + Math.abs(b));
  }
  getText() {
    return {
      name: get(t)('content.filters.acc.title'),
      description: get(t)('content.filters.acc.description'),
    };
  }
}

class MaxFilter implements FilterStrategy {
  computeOutput(data: number[]): number {
    return Math.max(...data);
  }
  getText() {
    return {
      name: get(t)('content.filters.max.title'),
      description: get(t)('content.filters.max.description'),
    };
  }
}

class MinFilter implements FilterStrategy {
  computeOutput(data: number[]): number {
    return Math.min(...data);
  }
  getText() {
    return {
      name: get(t)('content.filters.min.title'),
      description: get(t)('content.filters.min.description'),
    };
  }
}

class PeaksFilter implements FilterStrategy {
  computeOutput(data: number[]): number {
    const lag = 5;
    const threshold = 3.5;
    const influence = 0.5;

    let peaksCounter = 0;

    if (data.length < lag + 2) {
      throw new Error('data sample is too short');
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
  }
  getText() {
    return {
      name: get(t)('content.filters.peaks.title'),
      description: get(t)('content.filters.peaks.description'),
    };
  }
}

interface Gradient {
  start: number;
  end: number;
  yDiff: number;
  vector: number;
}

class GradientFilter implements FilterStrategy {
  private getMovingAverage = (data: number[]): number[] => {
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

  private getGradients = (data: number[]): Gradient[] => {
    const smoothedData = this.getMovingAverage(data);
    let start = 0;
    let sampleVector: number | undefined;
    const gradients: Gradient[] = [];
    for (let i = 0; i < smoothedData.length - 1; i++) {
      const sampleDiff = smoothedData[i + 1] - smoothedData[i];
      const currentVector = Math.sign(sampleDiff) * Math.sqrt(2 ** 2 + sampleDiff ** 2);
      if (sampleVector === undefined) {
        sampleVector = currentVector;
      } else {
        if (
          Math.sign(sampleVector) !== Math.sign(currentVector) &&
          Math.sign(currentVector) !== 0
        ) {
          const end = i;
          const yDiff = smoothedData[end] - smoothedData[start];
          const vector = Math.sign(yDiff) * Math.sqrt((end - start) ** 2 + yDiff ** 2);
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

  private getFirstSignificantVector = (data: number[]): number => {
    const gradients = this.getGradients(data);
    const vectors = gradients.map(g => Math.abs(g.vector));
    const vectorMean = mean(vectors);
    const vectorStdDev = stddev(vectors);
    const yDiffs = gradients.map(g => Math.abs(g.yDiff));
    const yDiffMean = yDiffs.reduce((a, b) => a + b, 0) / yDiffs.length;
    const yDiffStdDev = Math.sqrt(
      yDiffs.reduce((a, b) => a + Math.pow(b - yDiffMean, 2), 0) / yDiffs.length,
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

  computeOutput(data: number[]): number {
    return this.getFirstSignificantVector(data);
  }

  getOutputShape() {
    return 1;
  }

  getText() {
    return {
      name: 'Gradient analysis',
      description: 'Experimental',
    };
  }
}

function mean(a: number[]): number {
  return a.reduce((acc, val) => acc + val) / a.length;
}

function stddev(arr: number[]): number {
  const arr_mean = mean(arr);
  const r = function (acc: number, val: number) {
    return acc + (val - arr_mean) * (val - arr_mean);
  };
  return Math.sqrt(arr.reduce(r, 0.0) / arr.length);
}

export function determineFilter(filter: FilterType): FilterStrategy {
  switch (filter) {
    case Filters.MAX:
      return new MaxFilter();
    case Filters.MIN:
      return new MinFilter();
    case Filters.STD:
      return new SDFilter();
    case Filters.PEAKS:
      return new PeaksFilter();
    case Filters.ACC:
      return new TotalAccFilter();
    case Filters.MEAN:
      return new MeanFilter();
    case Filters.ZCR:
      return new ZeroCrossingRateFilter();
    case Filters.RMS:
      return new RootMeanSquareFilter();
    case Filters.GRAD:
      return new GradientFilter();
    default:
      throw new Error('Filter not found');
  }
}

export function getFilterLimits(filter: FilterType): { min: number; max: number } {
  switch (filter) {
    case Filters.MAX:
      return { min: -2.4, max: 2.4 };
    case Filters.MIN:
      return { min: -2.4, max: 2.4 };
    case Filters.STD:
      return { min: 0, max: 2.4 };
    case Filters.PEAKS:
      return { min: 0, max: 10 };
    case Filters.ACC:
      return { min: 0, max: 160 };
    case Filters.MEAN:
      return { min: -2.4, max: 2.4 };
    case Filters.ZCR:
      return { min: 0, max: 1 };
    case Filters.RMS:
      return { min: 0, max: 2 };
    default:
      throw new Error('Filter not found');
  }
}
