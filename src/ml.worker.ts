/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 *
 * Long-lived Web Worker that owns all TensorFlow.js and ml4f usage: training,
 * prediction and model (de)serialization run here so the main bundle doesn't
 * include tfjs. This module must only import tfjs, ml4f and the tfjs-only
 * training core — importing app modules would drag DOM/UI code into the
 * worker bundle.
 */
import { compileModel } from "@microbit/ml4f";
import * as tf from "@tensorflow/tfjs";
import { setWasmPaths } from "@tensorflow/tfjs-backend-wasm";
import wasmSimdPath from "@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm-simd.wasm?url";
import wasmThreadedSimdPath from "@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm-threaded-simd.wasm?url";
import wasmPath from "@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm.wasm?url";
import {
  artifactsToModel,
  modelToArtifacts,
  trainModelFromFeatures,
} from "./ml-train-core";
import type { MlWorkerRequest, MlWorkerResponse } from "./ml-worker-protocol";

const ctx = self as DedicatedWorkerGlobalScope;

const post = (message: MlWorkerResponse) => ctx.postMessage(message);

// In unit tests the worker runs under Node via @vitest/web-worker, where
// the wasm binary can't be fetched (and the shim's workers share one module
// cache, so repeated setWasmPaths calls throw); use the cpu backend there.
const testMode = import.meta.env.MODE === "test";
if (!testMode) {
  setWasmPaths({
    "tfjs-backend-wasm.wasm": wasmPath,
    "tfjs-backend-wasm-simd.wasm": wasmSimdPath,
    "tfjs-backend-wasm-threaded-simd.wasm": wasmThreadedSimdPath,
  });
}

// Kick off backend init once; awaited before the first request.
const backendReady = tf
  .setBackend(testMode ? "cpu" : "wasm")
  .then(() => tf.ready());

/**
 * The only live model. Training and loading replace it; prediction reads it.
 */
let model: tf.LayersModel | undefined;

const replaceModel = (newModel: tf.LayersModel) => {
  // Free WASM memory held by the previous model's weights.
  model?.dispose();
  model = newModel;
};

const handleRequest = async (request: MlWorkerRequest): Promise<void> => {
  await backendReady;
  switch (request.kind) {
    case "train": {
      const result = await trainModelFromFeatures(
        request.features,
        request.labels,
        request.options,
        (value) => post({ kind: "progress", id: request.id, value })
      );
      if (result.error) {
        post({ kind: "error", id: request.id });
        return;
      }
      replaceModel(result.model);
      const artifacts = await modelToArtifacts(result.model);
      const { machineCode } = compileModel(result.model, {});
      post({ kind: "trainComplete", id: request.id, artifacts, machineCode });
      return;
    }
    case "loadModel": {
      replaceModel(await artifactsToModel(request.artifacts));
      const { machineCode } = compileModel(model!, {});
      post({ kind: "loadModelComplete", id: request.id, machineCode });
      return;
    }
    case "predict": {
      if (!model) {
        post({ kind: "error", id: request.id });
        return;
      }
      const confidences = tf.tidy(() => {
        const prediction = model!.predict(
          tf.tensor([request.features])
        ) as tf.Tensor;
        return Array.from(prediction.dataSync());
      });
      post({ kind: "predictComplete", id: request.id, confidences });
      return;
    }
  }
};

// Serialise request handling so a predict arriving while training is in
// progress can't interleave at an await point and race the model swap.
// The client avoids queueing predicts behind training in the first place.
let queue: Promise<void> = Promise.resolve();

ctx.onmessage = (event: MessageEvent<MlWorkerRequest>) => {
  const request = event.data;
  queue = queue
    .then(() => handleRequest(request))
    .catch((e) => {
      console.error("ML worker request failed", e);
      post({ kind: "error", id: request.id });
    });
};
