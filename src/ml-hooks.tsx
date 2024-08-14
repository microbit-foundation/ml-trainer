import { useEffect, useMemo, useState } from "react";
import { useBufferedData } from "./buffered-data-hooks";
import { useConnectActions } from "./connect-actions-hooks";
import { ConnectionStatus, useConnectStatus } from "./connect-status-hooks";
import { Gesture, GestureContextState, useGestureData } from "./gestures-hooks";
import { useLogging } from "./logging/logging-hooks";
import { Confidences, mlSettings, predict } from "./ml";
import { MlActions } from "./ml-actions";
import { MlStage, useMlStatus } from "./ml-status-hooks";

export const useMlActions = () => {
  const [gestures] = useGestureData();
  const [, setStatus] = useMlStatus();
  const logger = useLogging();

  const actions = useMemo<MlActions>(
    () => new MlActions(logger, gestures, setStatus),
    [gestures, logger, setStatus]
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
  const [gestureData] = useGestureData();

  // Avoid re-renders due to threshold changes which update gestureData.
  // We could consider storing them elsewhere, perhaps with the model.
  const classificationIdsRecalculated = gestureData.data.map((d) => d.ID);
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
  gestureData: GestureContextState,
  confidences: Confidences | undefined
): Gesture | undefined => {
  if (!confidences) {
    return undefined;
  }

  // If more than one meet the threshold pick the highest
  const thresholded = gestureData.data
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
