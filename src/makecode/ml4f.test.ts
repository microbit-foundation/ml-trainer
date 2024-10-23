/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { CompileResult } from "compiler";
import { compileModel, EvalData, evalModel, EvalSample } from "ml4f";
import { trainModel } from "../ml";
import { GestureData } from "../model";
import trainingData from "../test-fixtures/wand-data-samples.json";
import testingData from "../test-fixtures/wand-test-data.json";
import * as tf from "@tensorflow/tfjs";

const fixUpTestData = (data: Partial<GestureData>[]): GestureData[] => {
  data.forEach((action) => (action.icon = "Heart"));
  return data as GestureData[];
};

function flattenSample(s: EvalSample) {
  const res: number[] = [];
  const rec = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(rec);
    else if (typeof v == "number") res.push(v);
    else throw new Error("invalid input");
  };
  rec(s);
  return res;
}

function ml4fExecute(cres: CompileResult, data: EvalData): Float32Array {
  const result: Float32Array = new Float32Array(
    data.x.length * data.y[0].length
  );
  let offset = 0;
  data.x.forEach((x) => {
    const predProb = cres.execute(flattenSample(x));
    predProb.forEach((value) => {
      result.fill(value, offset, offset + 1);
      offset++;
    });
  });
  return result;
}

// Confirm that the output of the Tensorflow and ml4f converted model
// have the same results and accuracy to a certain level of precision.
// The test data is currently the same as the training data.
test("that the ml4f output is valid", async () => {
  const trainingResult = await trainModel({
    data: fixUpTestData(trainingData as GestureData[]),
  });
  const { x, y } = testingData;
  if (trainingResult.error) {
    return;
  }
  const tensorFlowModel = trainingResult.model;
  const tensorFlowResult = tensorFlowModel.evaluate(tf.tensor(x), tf.tensor(y));
  const tensorFlowResultAccuracy = (tensorFlowResult as tf.Scalar[])[1]
    .dataSync()[0]
    .toFixed(4);
  const tensorflowPredictionResult = (
    tensorFlowModel.predict(tf.tensor(x)) as tf.Tensor
  ).dataSync();

  const ml4fCompileResult = compileModel(tensorFlowModel, {});
  const ml4fPredictionResult = ml4fExecute(ml4fCompileResult, testingData);
  const ml4fEvalResult = evalModel(ml4fCompileResult, testingData);
  // ml4fEvalResult is in the form of:
  // Accuracy: 0.8400
  //   9    0    4
  //   0    6    0
  //   0    0    6
  const ml4fResultAccuracy = ml4fEvalResult.match(/(\d.*)/)?.[1];

  expect(tensorFlowResultAccuracy).toEqual(ml4fResultAccuracy);
  expect(tensorflowPredictionResult.length).toEqual(
    ml4fPredictionResult.length
  );

  console.log(tensorflowPredictionResult);
  console.log(ml4fPredictionResult);

  tensorflowPredictionResult.forEach((value, i) => {
    // The values are different with higher precision.
    expect(value.toFixed(4)).toEqual(ml4fPredictionResult[i].toFixed(4));
  });
});
