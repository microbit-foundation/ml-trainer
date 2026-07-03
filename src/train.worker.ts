/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 *
 * Web Worker that runs model training off the main thread.
 * This module must only import TensorFlow.js and the tfjs-only training core —
 * importing app modules would drag DOM/UI code into the worker bundle.
 */
import * as tf from "@tensorflow/tfjs";
import { setWasmPaths } from "@tensorflow/tfjs-backend-wasm";
import wasmSimdPath from "@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm-simd.wasm?url";
import wasmThreadedSimdPath from "@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm-threaded-simd.wasm?url";
import wasmPath from "@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm.wasm?url";
import { modelToArtifacts, trainModelFromFeatures } from "./ml-train-core";
import type {
  TrainWorkerRequest,
  TrainWorkerResponse,
} from "./train-worker-protocol";

const ctx = self as DedicatedWorkerGlobalScope;

const post = (message: TrainWorkerResponse) => ctx.postMessage(message);

setWasmPaths({
  "tfjs-backend-wasm.wasm": wasmPath,
  "tfjs-backend-wasm-simd.wasm": wasmSimdPath,
  "tfjs-backend-wasm-threaded-simd.wasm": wasmThreadedSimdPath,
});

// Kick off backend init once; awaited before the first training run.
const backendReady = tf.setBackend("wasm").then(() => tf.ready());

ctx.onmessage = (event: MessageEvent<TrainWorkerRequest>) => {
  const { features, labels, options } = event.data;
  void (async () => {
    try {
      await backendReady;
      const result = await trainModelFromFeatures(
        features,
        labels,
        options,
        (value) => post({ kind: "progress", value })
      );
      if (result.error) {
        post({ kind: "error" });
        return;
      }
      const artifacts = await modelToArtifacts(result.model);
      post({ kind: "complete", artifacts });
      // Free WASM memory; the worker is also terminated by the caller.
      result.model.dispose();
    } catch (e) {
      post({ kind: "error" });
    }
  })();
};
