/**
 * @vitest-environment jsdom
 */

/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { CompileResult } from "compiler";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { compileModel, EvalData, EvalSample } from "ml4f";
import { prepareFeaturesAndLabels, trainModel } from "../ml";
import { ActionData } from "../model";
import { getAutogeneratedTs } from "./generate-custom-scripts";
// Change the file path to use different datasets.
import rawTrainingData from "../test-fixtures/activity-timer-data-log-data-samples.json";
import { currentDataWindow, DataWindow } from "../store";
import path from "path";

// Configure if the recording data is clipped to size of the smallest recording.
const CLIP_TRAINING_DATA = false;

const fixUpTestData = (data: Partial<ActionData>[]): ActionData[] => {
  data.forEach((action) => (action.icon = "Heart"));
  return data as ActionData[];
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

function convertTestDataToC(
  testData: ActionData[],
  filterOutput: number[][],
  ml4fOutput: number[][]
) {
  const xData: number[][] = [];
  const yData: number[][] = [];
  const zData: number[][] = [];
  testData.forEach((recording) => {
    recording.recordings.forEach((r) => {
      xData.push(r.data.x);
      yData.push(r.data.y);
      zData.push(r.data.z);
    });
  });

  // Find the min number of columns in the data for a homogeneous C 2D array.
  const totalColumns = Math.min(
    ...xData.map((row) => row.length),
    ...yData.map((row) => row.length),
    ...zData.map((row) => row.length)
  );
  const totalRecordings = xData.length;

  return [
    "// Autogenerated C header file with data samples, filter output, and model output",
    "#pragma once\n",
    `#define ML_TEST_RECORDINGS           ${totalRecordings}`,
    `#define ML_TEST_RECORDING_SIZE       ${totalColumns}`,
    `#define ML_TEST_FILTER_OUTPUT_SIZE   ${filterOutput[0].length}`,
    `#define ML_TEST_MODEL_OUTPUT_SIZE    ${ml4fOutput[0].length}\n`,
    "const float test_data_x[ML_TEST_RECORDINGS][ML_TEST_RECORDING_SIZE] = {",
    ...xData.map((row) => `    { ${row.slice(0, totalColumns).join(", ")} },`),
    "};\n",
    "const float test_data_y[ML_TEST_RECORDINGS][ML_TEST_RECORDING_SIZE] = {",
    ...yData.map((row) => `    {${row.slice(0, totalColumns).join(", ")} },`),
    "};\n",
    "const float test_data_z[ML_TEST_RECORDINGS][ML_TEST_RECORDING_SIZE] = {",
    ...zData.map((row) => `    { ${row.slice(0, totalColumns).join(", ")} },`),
    "};\n",
    "const float test_filter_output[ML_TEST_RECORDINGS][ML_TEST_FILTER_OUTPUT_SIZE] = {",
    ...filterOutput.map((row) => `    { ${row.join(", ")} },`),
    "};\n",
    "const float test_model_output[ML_TEST_RECORDINGS][ML_TEST_MODEL_OUTPUT_SIZE] = {",
    ...ml4fOutput.map((row) => `    { ${row.join(", ")} },`),
    "};\n",
  ].join("\n");
}

test("spits out files useful for testing", async () => {
  const trainingData: ActionData[] = fixUpTestData(
    rawTrainingData as ActionData[]
  );

  // Calculate average number of samples from all recordings.
  let totalSamples = 0;
  let totalRecordings = 0;
  for (const action of trainingData) {
    for (const recording of action.recordings) {
      // Assume all axes have the same number of samples.
      totalSamples += recording.data.x.length;
      totalRecordings++;
    }
  }
  let averageSamples = Math.round(totalSamples / totalRecordings);

  if (CLIP_TRAINING_DATA) {
    // Figure out the minimum number of samples in the training data.
    let minSamples = trainingData[0].recordings[0].data.x.length;
    for (const action of trainingData) {
      for (const recording of action.recordings) {
        minSamples = Math.min(
          minSamples,
          recording.data.x.length,
          recording.data.y.length,
          recording.data.z.length
        );
      }
    }
    // And clip the data to that length.
    for (const action of trainingData) {
      for (const recording of action.recordings) {
        recording.data.x = recording.data.x.slice(0, minSamples);
        recording.data.y = recording.data.y.slice(0, minSamples);
        recording.data.z = recording.data.z.slice(0, minSamples);
      }
    }
    averageSamples = minSamples;
  }

  // Edit dataWindow to create the correct model header in for the model blob in autogenerated.ts
  // Current settings: samples_period = 20; samples_length = 50;
  // Legacy data window: samples_period = 25; samples_length = 80;
  const dataWindow: DataWindow = {
    ...currentDataWindow,
    deviceSamplesLength: averageSamples,
  };

  const trainingResult = await trainModel(trainingData, dataWindow);
  if (trainingResult.error) {
    return;
  }
  const tensorFlowModel = trainingResult.model;

  // Get filter output or testing data from training data.
  const { features, labels } = prepareFeaturesAndLabels(
    trainingData,
    dataWindow
  );
  const testingData = {
    x: features,
    y: labels,
  };

  const numDimensions = labels[0].length;

  const ml4fCompileResult = compileModel(tensorFlowModel, {});
  const ml4fPredictionResult = ml4fExecute(ml4fCompileResult, testingData);

  const ml4fPredictionResultArry = Array.from(ml4fPredictionResult);

  const ml4fOutput = [];
  for (let i = 0; i < ml4fPredictionResultArry.length; i += numDimensions) {
    if (i + numDimensions > ml4fPredictionResultArry.length) {
      break;
    }
    ml4fOutput.push(ml4fPredictionResultArry.slice(i, i + numDimensions));
  }

  const autogeneratedFile = getAutogeneratedTs(
    trainingData,
    tensorFlowModel,
    dataWindow
  );

  const outputDir = "ml4f-output";
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir);
  }

  // Write output files to ml4f-output dir at root of project.
  writeFileSync(
    path.join(outputDir, "ml4f-output.json"),
    JSON.stringify(ml4fOutput)
  );
  writeFileSync(
    path.join(outputDir, "filter-output.json"),
    JSON.stringify(testingData)
  );
  writeFileSync(path.join(outputDir, "autogenerated.ts"), autogeneratedFile);
  writeFileSync(
    path.join(outputDir, "testdata.h"),
    convertTestDataToC(trainingData, features, ml4fOutput)
  );
});
