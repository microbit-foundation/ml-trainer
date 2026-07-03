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

export const trainModelInWorker = (
  data: ActionData[],
  dataWindow: DataWindow,
  onProgress?: (progress: number) => void
): Promise<TrainingResult> => {
  const { features, labels } = prepareFeaturesAndLabels(data, dataWindow);
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
      resolve(result);
    };

    worker.onmessage = ({ data: message }: MessageEvent<TrainWorkerResponse>) => {
      switch (message.kind) {
        case "progress":
          onProgress?.(message.value);
          break;
        case "complete":
          // Reconstruct the model on the main thread, where prediction runs.
          artifactsToModel(message.artifacts)
            .then((model) => finish({ error: false, model }))
            .catch(() => finish({ error: true }));
          break;
        case "error":
          finish({ error: true });
          break;
      }
    };
    worker.onerror = () => finish({ error: true });

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
