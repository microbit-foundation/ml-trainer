import { useEffect, useMemo, useState } from "react";
import { useBufferedData } from "../buffered-data-hooks";
import { useConnectActions } from "../connect-actions-hooks";
import { ConnectionStatus, useConnectStatus } from "../connect-status-hooks";
import { Gesture, useGestures } from "./use-gestures";
import { useLogging } from "../logging/logging-hooks";
import { Confidences, mlSettings, predict } from "../ml";
import { MlActions } from "../ml-actions";
import { MlStage, useMlStatus } from "./use-ml-status";
import { useProject } from "./use-project";

export const useMlActions = () => {
  const [gestures] = useGestures();
  const [, setStatus] = useMlStatus();
  const { updateProject } = useProject();
  const logger = useLogging();

  const actions = useMemo<MlActions>(
    () => new MlActions(logger, gestures, setStatus, updateProject),
    [gestures, logger, setStatus, updateProject]
  );
  return actions;
};

export const usePrediction = () => {
  const buffer = useBufferedData();
  const logging = useLogging();
  const [status] = useMlStatus();
  const [connectStatus] = useConnectStatus();
  const connection = useConnectActions();
  const [confidences, setConfidences] = useState<Confidences | undefined>();
  const [gestures] = useGestures();

  // Avoid re-renders due to threshold changes which update gestures.
  // We could consider storing them elsewhere, perhaps with the model.
  const classificationIdsRecalculated = gestures.map((d) => d.ID);
  const classificationIdsKey = JSON.stringify(classificationIdsRecalculated);
  const classificationIds: number[] = useMemo(
    () => JSON.parse(classificationIdsKey) as number[],
    [classificationIdsKey]
  );

  useEffect(() => {
    if (
      status.stage !== MlStage.TrainingComplete ||
      connectStatus !== ConnectionStatus.Connected
    ) {
      return;
    }
    const runPrediction = async () => {
      const startTime = Date.now() - mlSettings.duration;
      const input = {
        model: status.model,
        data: buffer.getSamples(startTime),
        classificationIds,
      };
      if (input.data.x.length > mlSettings.minSamples) {
        const predictionResult = await predict(input);
        if (predictionResult.error) {
          logging.error(predictionResult.detail);
        } else {
          setConfidences(predictionResult.confidences);
        }
      }
    };
    const interval = setInterval(
      runPrediction,
      1000 / mlSettings.updatesPrSecond
    );
    return () => {
      setConfidences(undefined);
      clearInterval(interval);
    };
  }, [connection, classificationIds, logging, status, connectStatus, buffer]);

  return confidences;
};

export const getPredictedGesture = (
  gestures: Gesture[],
  confidences: Confidences | undefined
): Gesture | undefined => {
  if (!confidences) {
    return undefined;
  }

  // If more than one meet the threshold pick the highest
  const thresholded = gestures
    .map((gesture) => ({
      gesture,
      thresholdDelta:
        confidences[gesture.ID] -
        (gesture.requiredConfidence ?? mlSettings.defaultRequiredConfidence),
    }))
    .sort((left, right) => {
      const a = left.thresholdDelta;
      const b = right.thresholdDelta;
      return a < b ? -1 : a > b ? 1 : 0;
    });

  const prediction = thresholded[thresholded.length - 1];
  return prediction.thresholdDelta >= 0 ? prediction.gesture : undefined;
};
