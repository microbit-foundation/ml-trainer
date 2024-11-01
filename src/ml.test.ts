/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import * as tf from "@tensorflow/tfjs";
import { ActionData } from "./model";
import {
  applyFilters,
  prepareFeaturesAndLabels,
  TrainingResult,
  trainModel,
} from "./ml";
import actionDataBadLabels from "./test-fixtures/action-data-bad-labels.json";
import actionData from "./test-fixtures/action-data.json";
import testdataShakeStill from "./test-fixtures/test-data-shake-still.json";
import { currentDataWindow } from "./store";

const fixUpTestData = (data: Partial<ActionData>[]): ActionData[] => {
  data.forEach((action) => (action.icon = "Heart"));
  return data as ActionData[];
};

let trainingResult: TrainingResult;
beforeAll(async () => {
  // No webgl in tests running in node.
  await tf.setBackend("cpu");
  trainingResult = await trainModel(
    fixUpTestData(actionData),
    currentDataWindow
  );
});

const getModelResults = (data: ActionData[]) => {
  const { features, labels } = prepareFeaturesAndLabels(
    data,
    currentDataWindow
  );

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
      getModelResults(fixUpTestData(actionData));
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
      getModelResults(fixUpTestData(actionDataBadLabels));
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
    // The model thinks 1-2 samples of still are circle.
    expect(parseFloat(tensorFlowResultAccuracy)).toBeGreaterThan(0.85);
  });
});

describe("applyFilters", () => {
  test("throws when x/y/z data is empty", () => {
    const xyzData = { x: [], y: [], z: [] };
    try {
      applyFilters(xyzData, currentDataWindow);
      // Fail test if above expression doesn't throw anything.
      expect(true).toBe(false);
    } catch (e) {
      expect((e as Error).message).toEqual("Empty x/y/z data");
    }
  });
  test("throws when data sample is too short", () => {
    const xyzData = { x: [1, 1, 1], y: [1, 1, 1], z: [1, 1, 1] };
    try {
      applyFilters(xyzData, currentDataWindow);
      // Fail test if above expression doesn't throw anything.
      expect(true).toBe(false);
    } catch (e) {
      expect((e as Error).message).toEqual("data sample is too short");
    }
  });
  test("returns filtered results", () => {
    const xyzData = {
      x: new Array(44).fill(1),
      y: new Array(44).fill(1),
      z: new Array(44).fill(1),
    };
    expect(applyFilters(xyzData, currentDataWindow)).toEqual({
      "acc-x": 50,
      "acc-y": 50,
      "acc-z": 50,
      "max-x": 1,
      "max-y": 1,
      "max-z": 1,
      "mean-x": 1,
      "mean-y": 1,
      "mean-z": 1,
      "min-x": 1,
      "min-y": 1,
      "min-z": 1,
      "peaks-x": 0,
      "peaks-y": 0,
      "peaks-z": 0,
      "rms-x": 1,
      "rms-y": 1,
      "rms-z": 1,
      "std-x": 0,
      "std-y": 0,
      "std-z": 0,
      "zcr-x": 0,
      "zcr-y": 0,
      "zcr-z": 0,
    });
  });
  test("returns normalised results", () => {
    const xyzData = {
      x: [0, 0, 0, 0, 0, 0, 0],
      y: [0, 0, 0, 0, 0, 0, 0],
      z: [0, 0, 0, 0, 0, 0, 0],
    };
    expect(
      applyFilters(xyzData, currentDataWindow, { normalize: true })
    ).toEqual({
      "acc-x": 0,
      "acc-y": 0,
      "acc-z": 0,
      "max-x": 0.5,
      "max-y": 0.5,
      "max-z": 0.5,
      "mean-x": 0.5,
      "mean-y": 0.5,
      "mean-z": 0.5,
      "min-x": 0.5,
      "min-y": 0.5,
      "min-z": 0.5,
      "peaks-x": 0,
      "peaks-y": 0,
      "peaks-z": 0,
      "rms-x": 0,
      "rms-y": 0,
      "rms-z": 0,
      "std-x": 0,
      "std-y": 0,
      "std-z": 0,
      "zcr-x": 0,
      "zcr-y": 0,
      "zcr-z": 0,
    });
  });
});
