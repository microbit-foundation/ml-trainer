import { useEffect, useRef, useState } from "react";
import { useBufferedData } from "../buffered-data-hooks";
import { useConnectActions } from "../connect-actions-hooks";
import { useConnectStatus } from "../connect-status-hooks";
import { useLogging } from "../logging/logging-hooks";
import { Confidences, predict } from "../ml";
import { Action } from "../model";
import { useStore } from "../store";
import { mlSettings } from "../mlConfig";

export interface PredictionResult {
  confidences: Confidences;
  detected: Action | undefined;
}

export const usePrediction = () => {
  const buffer = useBufferedData();
  const logging = useLogging();
  const [connectStatus] = useConnectStatus();
  const connection = useConnectActions();
  const [prediction, setPrediction] = useState<PredictionResult | undefined>();
  const actions = useStore((s) => s.actions);
  const model = useStore((s) => s.model);
  const dataWindow = useStore((s) => s.dataWindow);

  // Use a ref to prevent restarting the effect every time thesholds change.
  // We only use the ref's value during the setInterval callback not render.
  // We can avoid this by storing the thresolds separately in state, even if we unify them when serializing them.
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  useEffect(() => {
    if (!model) {
      return;
    }
    const runPrediction = async () => {
      const startTime = Date.now() - dataWindow.duration;
      const input = {
        model,
        data: buffer.getSamples(startTime),
        classificationIds: actionsRef.current.map((a) => a.ID),
      };
      if (input.data.x.length > dataWindow.minSamples) {
        const result = await predict(input, dataWindow);
        if (result.error) {
          logging.error(result.detail);
        } else {
          const { confidences } = result;
          const detected = getDetectedAction(
            actionsRef.current,
            result.confidences
          );
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
      setPrediction(undefined);
      clearInterval(interval);
    };
  }, [connection, logging, connectStatus, buffer, model, dataWindow]);

  return prediction;
};

export const getDetectedAction = (
  actions: Action[],
  confidences: Confidences | undefined
): Action | undefined => {
  if (!confidences) {
    return undefined;
  }

  // If more than one meet the threshold pick the highest
  const thresholded = actions
    .map((action) => ({
      action,
      thresholdDelta:
        confidences[action.ID] -
        (action.requiredConfidence ?? mlSettings.defaultRequiredConfidence),
    }))
    .sort((left, right) => {
      const a = left.thresholdDelta;
      const b = right.thresholdDelta;
      return a < b ? -1 : a > b ? 1 : 0;
    });

  const prediction = thresholded[thresholded.length - 1];
  return prediction.thresholdDelta >= 0 ? prediction.action : undefined;
};
