/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 *
 * Tests for the ML worker through its main-thread client, which is the only
 * way the app uses it. The real ml.worker.ts runs behind @vitest/web-worker's
 * Worker shim; the worker's cpu backend fallback kicks in as the wasm binary
 * cannot be fetched under Node.
 */
import "@vitest/web-worker";
import { prepareFeaturesAndLabels } from "./ml";
import { MlWorkerClient } from "./ml-worker-client";
import { mlSettings } from "./mlConfig";
import { OldActionData } from "./model";
import {
  currentDataWindow,
  migrateLegacyActionDataAndAssignNewIds,
} from "./project-utils";
import actionData from "./test-fixtures/shake-still-circle-data-samples-legacy.json";

const fixUpTestData = (data: Partial<OldActionData>[]): OldActionData[] => {
  data.forEach((action) => (action.icon = "Heart"));
  return data as OldActionData[];
};

const { features, labels } = prepareFeaturesAndLabels(
  migrateLegacyActionDataAndAssignNewIds(fixUpTestData(actionData)),
  currentDataWindow
);

// Few epochs keep the tests fast; we assert behaviour, not model quality.
const trainOptions = { numEpochs: 10, learningRate: mlSettings.learningRate };

let client: MlWorkerClient;
beforeEach(() => {
  client = new MlWorkerClient();
});

test("trains a model, reporting progress and returning artifacts and machine code", async () => {
  const progress: number[] = [];
  const result = await client.train(features, labels, trainOptions, (v) =>
    progress.push(v)
  );
  expect(result).toBeDefined();
  expect(result!.artifacts.modelTopology).toBeDefined();
  expect(result!.artifacts.weightData).toBeDefined();
  expect(result!.machineCode.length).toBeGreaterThan(0);
  expect(progress.length).toBeGreaterThan(0);
  expect(progress[progress.length - 1]).toBe(1);
});

test("train with no data resolves with undefined", async () => {
  const result = await client.train([], [], trainOptions, () => {});
  expect(result).toBeUndefined();
});

test("predicts using the model kept live in the worker after training", async () => {
  await client.train(features, labels, trainOptions, () => {});
  const confidences = await client.predict(features[0]);
  expect(confidences).toHaveLength(labels[0].length);
  confidences!.forEach((c) => {
    expect(c).toBeGreaterThanOrEqual(0);
    expect(c).toBeLessThanOrEqual(1);
  });
});

test("predict returns undefined when no model is loaded", async () => {
  expect(await client.predict(features[0])).toBeUndefined();
});

test("predict during training is dropped rather than queued", async () => {
  const trainPromise = client.train(features, labels, trainOptions, () => {});
  expect(await client.predict(features[0])).toBeUndefined();
  expect(await trainPromise).toBeDefined();
});

test("loadModel restores a trained model for prediction with identical machine code", async () => {
  const trained = await client.train(features, labels, trainOptions, () => {});
  const original = await client.predict(features[0]);

  // Fresh client/worker as after a page reload with artifacts from storage.
  const reloadClient = new MlWorkerClient();
  const loaded = await reloadClient.loadModel(trained!.artifacts);
  expect(loaded).toBeDefined();
  expect(Array.from(loaded!.machineCode)).toEqual(
    Array.from(trained!.machineCode)
  );

  const reloaded = await reloadClient.predict(features[0]);
  expect(reloaded).toHaveLength(labels[0].length);
  reloaded!.forEach((c, i) => expect(c).toBeCloseTo(original![i], 5));
});
