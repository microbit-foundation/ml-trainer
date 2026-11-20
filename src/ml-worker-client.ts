/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 *
 * Main-thread client for the ML worker. The worker is spawned lazily on
 * first use and lives for the rest of the session, owning the only live
 * TensorFlow.js model. The main thread deals only in structured-cloneable
 * data: model artifacts, feature vectors, confidences and ml4f machine code.
 */
import type * as tf from "@tensorflow/tfjs";
import type { TrainModelOptions } from "./ml-train-core";
import type { MlWorkerRequest, MlWorkerResponse } from "./ml-worker-protocol";

export interface WorkerTrainResult {
  artifacts: tf.io.ModelArtifacts;
  machineCode: Uint8Array;
}

/**
 * Why a model operation failed, for diagnostics:
 * - `timeout`: the worker went silent past the inactivity watchdog.
 * - `workerError`: the worker itself crashed (onerror — script/wasm failure).
 * - `requestError`: the worker ran the request but reported an error (e.g. an
 *   exception during training, or empty training data).
 */
export type WorkerFailureReason = "timeout" | "workerError" | "requestError";

export type WorkerTrainOutcome =
  | { success: true; result: WorkerTrainResult }
  | { success: false; reason: WorkerFailureReason };

/**
 * What a pending request settles to: a real worker response, or a synthetic
 * failure carrying the reason when the worker never delivered one (watchdog
 * timeout or a fatal worker error).
 */
type RequestOutcome =
  | MlWorkerResponse
  | { kind: "failure"; reason: WorkerFailureReason };

const workerInactivityTimeoutMs = 60000;

interface PendingRequest {
  resolve(outcome: RequestOutcome): void;
  onProgress?: (value: number) => void;
  /**
   * Inactivity timeout, if this request is watchdogged. Reset on every
   * message (including progress) and cleared when the request settles.
   */
  timeoutMs?: number;
  timer?: ReturnType<typeof setTimeout>;
}

export class MlWorkerClient {
  private worker: Worker | undefined;
  private nextRequestId = 0;
  private pending = new Map<number, PendingRequest>();
  /**
   * Whether a train/loadModel request is in flight. Prediction requests are
   * dropped rather than queued behind them (the worker is single-threaded,
   * so a queued predict could wait behind seconds of training).
   */
  private modelOpInFlight = false;
  /**
   * Artifacts of the model currently loaded in the worker. Re-sent if the
   * worker has to be respawned after a fatal error.
   */
  private loadedArtifacts: tf.io.ModelArtifacts | undefined;

  /**
   * Spawn the worker ahead of first use so the large worker chunk fetch,
   * tfjs parse and wasm backend init happen in the background rather than
   * after a user interaction (training, or opening a project with a model).
   * Deferred until the browser is idle so the fetch doesn't compete with
   * app startup.
   */
  warmUp(): void {
    const spawn = () => this.ensureWorker();
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(spawn);
    } else {
      // Safari < 18. Rough proxy for post-startup idleness.
      setTimeout(spawn, 1000);
    }
  }

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL("./ml.worker.ts", import.meta.url), {
        type: "module",
      });
      this.worker.onmessage = (event: MessageEvent<MlWorkerResponse>) =>
        this.handleMessage(event.data);
      this.worker.onerror = () => this.handleFatalError("workerError");
      if (this.loadedArtifacts) {
        // Restore the model after a respawn so prediction can resume.
        this.postRequest(
          (id) => ({
            kind: "loadModel",
            id,
            artifacts: this.loadedArtifacts!,
          }),
          this.worker
        ).catch(() => {
          // Handled by the requests that find no model.
        });
      }
    }
    return this.worker;
  }

  private handleMessage(message: MlWorkerResponse) {
    const pending = this.pending.get(message.id);
    if (!pending) {
      return;
    }
    if (message.kind === "progress") {
      // The worker is alive and making progress; restart the watchdog.
      this.resetWatchdog(message.id);
      pending.onProgress?.(message.value);
      return;
    }
    this.cancelWatchdog(message.id);
    this.pending.delete(message.id);
    pending.resolve(message);
  }

  /**
   * Start (or restart) the inactivity watchdog for a request that opted into
   * one. Any message from the worker restarts the countdown; silence past the
   * timeout fails the request via handleFatalError.
   */
  private resetWatchdog(id: number) {
    const pending = this.pending.get(id);
    if (!pending?.timeoutMs) {
      return;
    }
    if (pending.timer !== undefined) {
      clearTimeout(pending.timer);
    }
    pending.timer = setTimeout(
      () => this.handleFatalError("timeout"),
      pending.timeoutMs
    );
  }

  private cancelWatchdog(id: number) {
    const pending = this.pending.get(id);
    if (pending?.timer !== undefined) {
      clearTimeout(pending.timer);
      pending.timer = undefined;
    }
  }

  /**
   * Called when the worker fails fatally: it crashed (onerror — e.g. its
   * script or wasm binary failed to load) or went silent past the watchdog.
   * Fail all pending requests with the reason and discard the worker so the
   * next request respawns it.
   */
  private handleFatalError(reason: WorkerFailureReason) {
    const pending = Array.from(this.pending.values());
    pending.forEach((p) => {
      if (p.timer !== undefined) {
        clearTimeout(p.timer);
      }
    });
    this.pending.clear();
    this.worker?.terminate();
    this.worker = undefined;
    pending.forEach((p) => p.resolve({ kind: "failure", reason }));
  }

  private postRequest(
    createRequest: (id: number) => MlWorkerRequest,
    worker: Worker = this.ensureWorker(),
    onProgress?: (value: number) => void,
    timeoutMs?: number
  ): Promise<RequestOutcome> {
    const id = this.nextRequestId++;
    return new Promise((resolve) => {
      this.pending.set(id, { resolve, onProgress, timeoutMs });
      worker.postMessage(createRequest(id));
      this.resetWatchdog(id);
    });
  }

  /**
   * Train a model. The trained model stays live in the worker for
   * prediction; the returned artifacts and ml4f machine code are for
   * persistence and MakeCode project generation.
   *
   * On failure returns `{ success: false, reason }` so callers can report why
   * (a watchdog timeout, a worker crash, or a training error).
   */
  async train(
    features: number[][],
    labels: number[][],
    options: TrainModelOptions,
    onProgress: (value: number) => void
  ): Promise<WorkerTrainOutcome> {
    this.modelOpInFlight = true;
    try {
      const outcome = await this.postRequest(
        (id) => ({ kind: "train", id, features, labels, options }),
        this.ensureWorker(),
        onProgress,
        workerInactivityTimeoutMs
      );
      if (outcome.kind === "trainComplete") {
        this.loadedArtifacts = outcome.artifacts;
        return {
          success: true,
          result: {
            artifacts: outcome.artifacts,
            machineCode: outcome.machineCode,
          },
        };
      }
      return {
        success: false,
        reason: outcome.kind === "failure" ? outcome.reason : "requestError",
      };
    } finally {
      this.modelOpInFlight = false;
    }
  }

  /**
   * Load a previously trained model into the worker for prediction and
   * compile it with ml4f to obtain the machine code needed for MakeCode
   * project generation.
   *
   * Returns undefined on failure.
   */
  async loadModel(
    artifacts: tf.io.ModelArtifacts
  ): Promise<{ machineCode: Uint8Array } | undefined> {
    this.modelOpInFlight = true;
    try {
      const response = await this.postRequest(
        (id) => ({ kind: "loadModel", id, artifacts }),
        this.ensureWorker(),
        undefined,
        workerInactivityTimeoutMs
      );
      if (response.kind !== "loadModelComplete") {
        return undefined;
      }
      this.loadedArtifacts = artifacts;
      return { machineCode: response.machineCode };
    } finally {
      this.modelOpInFlight = false;
    }
  }

  /**
   * Predict confidences for a single feature vector using the model loaded
   * in the worker. Returns undefined if the request was dropped (a model
   * operation is in flight) or failed; callers skip that tick.
   */
  async predict(features: number[]): Promise<number[] | undefined> {
    if (this.modelOpInFlight) {
      return undefined;
    }
    const response = await this.postRequest((id) => ({
      kind: "predict",
      id,
      features,
    }));
    return response.kind === "predictComplete"
      ? response.confidences
      : undefined;
  }
}

export const mlWorker = new MlWorkerClient();
