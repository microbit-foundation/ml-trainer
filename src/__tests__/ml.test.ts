/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import * as tf from '@tensorflow/tfjs';
import { makeInputs, trainModel } from '../script/ml';
import { gestures } from '../script/stores/Stores';
import gestureData from './fixtures/gesture-data.json';
import gestureDataBadLabels from './fixtures/gesture-data-bad-labels.json';
import testdataShakeStill from './fixtures/test-data-shake-still.json';
import { PersistantGestureData } from '../script/domain/Gestures';

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

const getModelResults = (data: PersistantGestureData[]) => {
  const x: number[][] = [];
  const y: number[][] = [];
  const numActions = data.length;
  data.forEach((action, index) => {
    action.recordings.forEach(recording => {
      x.push(makeInputs(recording.data));
      const label = new Array(numActions);
      label.fill(0, 0, numActions);
      label[index] = 1;
      y.push(label);
    });
  });

  if (!tensorFlowModel) {
    throw Error('No model returned');
  }

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
      getModelResults(gestureData);
    const d = labels[0].length; // dimensions
    for (let i = 0, j = 0; i < tensorflowPredictionResult.length; i += d, j++) {
      const result = tensorflowPredictionResult.slice(i, i + d);
      expect(result.indexOf(Math.max(...result))).toBe(
        labels[j].indexOf(Math.max(...labels[j])),
      );
    }
    expect(tensorFlowResultAccuracy).toBe('1.0000');
  });

  // The action names don't matter, the order of the actions in the data.json file does.
  // Training data is shake, still, circle. This data is still, circle, shake.
  test('returns incorrect results on wrongly labelled training data', async () => {
    const { tensorFlowResultAccuracy, tensorflowPredictionResult, labels } =
      getModelResults(gestureDataBadLabels);
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
    const { tensorFlowResultAccuracy } = getModelResults(testdataShakeStill);
    // The model thinks two samples of still are circle.
    // 14 samples; 1.0 / 14 = 0.0714; 0.0714 * 12 correct inferences = 0.8571
    expect(parseFloat(tensorFlowResultAccuracy)).toBeGreaterThan(0.85);
  });
});
