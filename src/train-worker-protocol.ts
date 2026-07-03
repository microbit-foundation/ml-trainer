/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 *
 * Message protocol shared between the training worker and the main thread.
 * Type-only (no runtime code) so it can be imported from the worker without
 * pulling in any app modules.
 */
import type * as tf from "@tensorflow/tfjs";
import type { TrainModelOptions } from "./ml-train-core";

/**
 * Sent from the main thread to start a training run.
 */
export interface TrainWorkerRequest {
  features: number[][];
  labels: number[][];
  options: TrainModelOptions;
}

/**
 * Sent from the worker back to the main thread.
 */
export type TrainWorkerResponse =
  | { kind: "progress"; value: number }
  | { kind: "complete"; artifacts: tf.io.ModelArtifacts }
  | { kind: "error" };
