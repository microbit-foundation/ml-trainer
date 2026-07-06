/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 *
 * Main-thread entry point for training. Computes features on the main thread,
 * runs the actual training in a Web Worker so the UI never freezes, then
 * reconstructs the trained model on the main thread where prediction happens.
 */
import { artifactsToModel, prepareFeaturesAndLabels } from "./ml";
import { TrainingResult } from "./ml-train-core";
import { mlSettings } from "./mlConfig";
import { ActionData } from "./model";
import { DataWindow } from "./project-utils";
import type {
  TrainWorkerRequest,
  TrainWorkerResponse,
} from "./train-worker-protocol";

const minTrainingDurationMs = 2000;

export const trainModel = (
  data: ActionData[],
  dataWindow: DataWindow,
  onProgress: (progress: number) => void
): Promise<TrainingResult> => {
  const { features, labels } = prepareFeaturesAndLabels(data, dataWindow);
  const startTime = Date.now();
  return new Promise<TrainingResult>((resolve) => {
    const worker = new Worker(new URL("./train.worker.ts", import.meta.url), {
      type: "module",
    });
    let settled = false;

    const finish = (result: TrainingResult) => {
      if (settled) {
        return;
      }
      settled = true;
      worker.terminate();
      onProgress(1);
      resolve(result);
    };

    const onOutcome = (result: TrainingResult) => {
      const remaining = minTrainingDurationMs - (Date.now() - startTime);
      if (result.error || remaining <= 0) {
        finish(result);
      } else {
        setTimeout(() => finish(result), remaining);
      }
    };

    // Latest real training progress (0–1) reported by the worker.
    let actualProgress = 0;

    // Animate progress bar. Visual only — completion is handled by onOutcome.
    // Show whichever is lower: time-based fill vs real training progress
    // (so if training is slower than min duration, the bar tracks it rather
    // than filling to 100% and pausing while it waits to finish).
    const tick = () => {
      if (settled) {
        return;
      }
      const timingProgress = Math.min(
        (Date.now() - startTime) / minTrainingDurationMs,
        1
      );
      onProgress(Math.min(timingProgress, actualProgress));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    worker.onmessage = ({
      data: message,
    }: MessageEvent<TrainWorkerResponse>) => {
      switch (message.kind) {
        case "progress":
          actualProgress = message.value;
          break;
        case "complete":
          // Reconstruct the model on the main thread, where prediction runs.
          artifactsToModel(message.artifacts)
            .then((model) => onOutcome({ error: false, model }))
            .catch(() => onOutcome({ error: true }));
          break;
        case "error":
          onOutcome({ error: true });
          break;
      }
    };
    worker.onerror = () => onOutcome({ error: true });

    const request: TrainWorkerRequest = {
      features,
      labels,
      options: {
        numEpochs: mlSettings.numEpochs,
        learningRate: mlSettings.learningRate,
      },
    };
    worker.postMessage(request);
  });
};
