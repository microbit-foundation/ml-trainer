/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 *
 * Main-thread entry point for training. Computes features on the main
 * thread, then trains in the ML worker so the UI never freezes. The trained
 * model stays live in the worker for prediction; the main thread receives
 * only its serialised artifacts and ml4f machine code.
 */
import { prepareFeaturesAndLabels } from "./ml";
import { mlWorker } from "./ml-worker-client";
import { mlSettings } from "./mlConfig";
import { ActionData, TrainedModel } from "./model";
import { DataWindow } from "./project-utils";

export type TrainModelResult =
  | { error: false; model: TrainedModel }
  | { error: true };

const minTrainingDurationMs = 2000;

export const trainModel = async (
  data: ActionData[],
  dataWindow: DataWindow,
  onProgress: (progress: number) => void
): Promise<TrainModelResult> => {
  const { features, labels } = prepareFeaturesAndLabels(data, dataWindow);
  const startTime = Date.now();
  let settled = false;

  // Latest real training progress (0–1) reported by the worker.
  let actualProgress = 0;

  // Animate progress bar. Visual only — completion is handled below.
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

  const trainResult = await mlWorker.train(
    features,
    labels,
    {
      numEpochs: mlSettings.numEpochs,
      learningRate: mlSettings.learningRate,
    },
    (value) => {
      actualProgress = value;
    }
  );
  const result: TrainModelResult = trainResult
    ? {
        error: false,
        model: {
          artifacts: trainResult.artifacts,
          machineCode: trainResult.machineCode,
        },
      }
    : { error: true };
  const remaining = minTrainingDurationMs - (Date.now() - startTime);
  if (!result.error && remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
  settled = true;
  onProgress(1);
  return result;
};
