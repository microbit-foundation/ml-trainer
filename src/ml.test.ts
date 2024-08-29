/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import * as tf from "@tensorflow/tfjs";
import { vi } from "vitest";
import { Gesture } from "./hooks/use-gestures";
import { prepareFeaturesAndLabels, TrainingResult, trainModel } from "./ml";
import gestureDataBadLabels from "./test-fixtures/gesture-data-bad-labels.json";
import gestureData from "./test-fixtures/gesture-data.json";
import testdataShakeStill from "./test-fixtures/test-data-shake-still.json";

const fixUpTestData = (data: Partial<Gesture>[]): Gesture[] => {
  data.forEach((action) => (action.icon = "Heart"));
  return data as Gesture[];
};

let trainingResult: TrainingResult;
beforeAll(async () => {
  // No webgl in tests running in node.
  await tf.setBackend("cpu");

  // This creates determinism in the model training step.
  const randomSpy = vi.spyOn(Math, "random");
  randomSpy.mockImplementation(() => 0.5);

  trainingResult = await trainModel({ data: fixUpTestData(gestureData) });
});

const getModelResults = (data: Gesture[]) => {
  const { features, labels } = prepareFeaturesAndLabels(data);

  if (trainingResult.error) {
    throw Error("No model returned");
  }

  const tensorFlowResult = trainingResult.model.evaluate(
    tf.tensor(features),
    tf.tensor(labels)
  );
  const tensorFlowResultAccuracy = (tensorFlowResult as tf.Scalar[])[1]
    .dataSync()[0]
    .toFixed(4);
  const tensorflowPredictionResult = (
    trainingResult.model.predict(tf.tensor(features)) as tf.Tensor
  ).dataSync();
  return {
    tensorFlowResultAccuracy,
    tensorflowPredictionResult,
    labels,
  };
};

describe("Model tests", () => {
  test("returns acceptable results on training data", () => {
    const { tensorFlowResultAccuracy, tensorflowPredictionResult, labels } =
      getModelResults(fixUpTestData(gestureData));
    const d = labels[0].length; // dimensions
    for (let i = 0, j = 0; i < tensorflowPredictionResult.length; i += d, j++) {
      const result = tensorflowPredictionResult.slice(i, i + d);
      expect(result.indexOf(Math.max(...result))).toBe(
        labels[j].indexOf(Math.max(...labels[j]))
      );
    }
    expect(tensorFlowResultAccuracy).toBe("1.0000");
  });

  // The action names don't matter, the order of the actions in the data.json file does.
  // Training data is shake, still, circle. This data is still, circle, shake.
  test("returns incorrect results on wrongly labelled training data", () => {
    const { tensorFlowResultAccuracy, tensorflowPredictionResult, labels } =
      getModelResults(fixUpTestData(gestureDataBadLabels));
    const d = labels[0].length; // dimensions
    for (let i = 0, j = 0; i < tensorflowPredictionResult.length; i += d, j++) {
      const result = tensorflowPredictionResult.slice(i, i + d);
      expect(result.indexOf(Math.max(...result))).not.toBe(
        labels[j].indexOf(Math.max(...labels[j]))
      );
    }
    expect(tensorFlowResultAccuracy).toBe("0.0000");
  });

  test("returns correct results on testing data", () => {
    const { tensorFlowResultAccuracy } = getModelResults(
      fixUpTestData(testdataShakeStill)
    );
    // The model thinks two samples of still are circle.
    // 14 samples; 1.0 / 14 = 0.0714; 0.0714 * 12 correct inferences = 0.8571
    expect(parseFloat(tensorFlowResultAccuracy)).toBeGreaterThan(0.85);
  });
});
