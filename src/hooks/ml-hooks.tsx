import { useEffect, useRef, useState } from "react";
import { useBufferedData } from "../buffered-data-hooks";
import { useConnectActions } from "../connect-actions-hooks";
import { ConnectionStatus, useConnectStatus } from "../connect-status-hooks";
import { Gesture } from "../model";
import { useLogging } from "../logging/logging-hooks";
import { Confidences, mlSettings, predict } from "../ml";
import { useAppStore } from "../store";
import { MlStage } from "../model";

export interface PredictionResult {
  confidences: Confidences;
  detected: Gesture | undefined;
}

export const usePrediction = () => {
  const buffer = useBufferedData();
  const logging = useLogging();
  const [connectStatus] = useConnectStatus();
  const connection = useConnectActions();
  const [prediction, setPrediction] = useState<PredictionResult | undefined>();
  const gestureData = useAppStore((s) => s.gestures);
  const status = useAppStore((s) => s.mlStatus);

  // Use a ref to prevent restarting the effect every time thesholds change.
  // We only use the ref's value during the setInterval callback not render.
  // We can avoid this by storing the thresolds separately in state, even if we unify them when serializing them.
  const gestureDataRef = useRef(gestureData);
  gestureDataRef.current = gestureData;
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
        classificationIds: gestureDataRef.current.map((g) => g.ID),
      };
      if (input.data.x.length > mlSettings.minSamples) {
        const result = await predict(input);
        if (result.error) {
          logging.error(result.detail);
        } else {
          const { confidences } = result;
          const detected = getDetectedGesture(
            gestureDataRef.current,
            result.confidences
          );
          if (detected) {
            connection.setIcon(detected.icon).catch((e) => logging.error(e));
          } else {
            connection.clearIcon().catch((e) => logging.error(e));
          }
          setPrediction({
            detected,
            confidences,
          });
        }
      }
    };
    const interval = setInterval(
      runPrediction,
      1000 / mlSettings.updatesPrSecond
    );
    return () => {
      connection.resetIcon().catch((e) => logging.error(e));
      setPrediction(undefined);
      clearInterval(interval);
    };
  }, [connection, logging, status, connectStatus, buffer]);

  return prediction;
};

export const getDetectedGesture = (
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
