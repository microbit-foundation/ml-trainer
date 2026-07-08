/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 *
 * Message protocol shared between the ML worker and the main thread.
 * Type-only (no runtime code) so it can be imported from the worker without
 * pulling in any app modules.
 *
 * Requests carry ids because messages interleave: the worker is long-lived
 * and serves training, model loading and prediction over one channel.
 */
import type * as tf from "@tensorflow/tfjs";
import type { TrainModelOptions } from "./ml-train-core";

export type MlWorkerRequest =
  | {
      kind: "train";
      id: number;
      features: number[][];
      labels: number[][];
      options: TrainModelOptions;
    }
  | {
      kind: "loadModel";
      id: number;
      artifacts: tf.io.ModelArtifacts;
    }
  | { kind: "predict"; id: number; features: number[] };

export type MlWorkerResponse =
  | { kind: "progress"; id: number; value: number }
  | {
      kind: "trainComplete";
      id: number;
      artifacts: tf.io.ModelArtifacts;
      machineCode: Uint8Array;
    }
  | {
      kind: "loadModelComplete";
      id: number;
      machineCode: Uint8Array;
    }
  | { kind: "predictComplete"; id: number; confidences: number[] }
  | { kind: "error"; id: number };
