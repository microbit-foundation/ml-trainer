/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import * as tf from '@tensorflow/tfjs';
import { trainModel } from '../script/ml';
import { gestures } from '../script/stores/Stores';
import gestureData from './fixtures/gesture-data.json';
import rawTrainingData from './fixtures/raw-training-data.json';
import rawTrainingDataBadLabels from './fixtures/raw-training-data-bad-labels.json';
import rawTestingData from './fixtures/raw-testing-data.json';

interface TrainingData {
  x: number[][];
  y: number[][];
}

let tensorFlowModel: tf.LayersModel | void;
beforeAll(async () => {
  // No webgl in tests running in node.
  tf.setBackend('cpu');

  // This creates determinism in the model training step.
  const randomSpy = vi.spyOn(Math, 'random');
  randomSpy.mockImplementation(() => 0.5);

  gestures.importFrom(gestureData);
  tensorFlowModel = await trainModel();
});

const getModelResults = (data: TrainingData) => {
  if (!tensorFlowModel) {
    throw Error('No model returned');
  }
  const { x, y } = data;
  const tensorFlowResult = tensorFlowModel.evaluate(tf.tensor(x), tf.tensor(y));
  const tensorFlowResultAccuracy = (tensorFlowResult as tf.Scalar[])[1]
    .dataSync()[0]
    .toFixed(4);
  const tensorflowPredictionResult = (
    tensorFlowModel.predict(tf.tensor(x)) as tf.Tensor
  ).dataSync();
  return {
    tensorFlowResultAccuracy,
    tensorflowPredictionResult,
    labels: y,
  };
};

describe('Model tests', () => {
  test('returns acceptable results on training data', async () => {
    const { tensorFlowResultAccuracy, tensorflowPredictionResult, labels } =
      getModelResults(rawTrainingData);
    const d = labels[0].length; // dimensions
    for (let i = 0, j = 0; i < tensorflowPredictionResult.length; i += d, j++) {
      const result = tensorflowPredictionResult.slice(i, i + d);
      expect(result.indexOf(Math.max(...result))).toBe(
        labels[j].indexOf(Math.max(...labels[j])),
      );
    }
    expect(tensorFlowResultAccuracy).toBe('1.0000');
  });

  test('returns incorrect results on wrongly labelled training data', async () => {
    const { tensorFlowResultAccuracy, tensorflowPredictionResult, labels } =
      getModelResults(rawTrainingDataBadLabels);
    const d = labels[0].length; // dimensions
    for (let i = 0, j = 0; i < tensorflowPredictionResult.length; i += d, j++) {
      const result = tensorflowPredictionResult.slice(i, i + d);
      expect(result.indexOf(Math.max(...result))).not.toBe(
        labels[j].indexOf(Math.max(...labels[j])),
      );
    }
    expect(tensorFlowResultAccuracy).toBe('0.0000');
  });

  test('returns correct results on testing data', async () => {
    const { tensorFlowResultAccuracy, tensorflowPredictionResult, labels } =
      getModelResults(rawTestingData);
    // The model thinks one recording of 'shake' is 'circle', but is otherwise correct.
    expect(parseFloat(tensorFlowResultAccuracy)).toBeGreaterThan(0.9);
  });
});
