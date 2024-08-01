import { useEffect, useMemo, useState } from "react";
import { useGestureData } from "./gestures-hooks";
import { useLogging } from "./logging/logging-hooks";
import { MlStage, useMlStatus } from "./ml-status-hooks";
import { MlActions } from "./ml-actions";
import { BufferedData } from "./buffered-data";
import { useConnectActions } from "./connect-actions-hooks";
import { AccelerometerDataEvent } from "@microbit/microbit-connection";
import { Confidences, mlSettings, predict } from "./ml";
import { ConnectionStatus, useConnectStatus } from "./connect-status-hooks";

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
  const logging = useLogging();
  const [status] = useMlStatus();
  const connectStatus = useConnectStatus();
  const connection = useConnectActions();
  const [confidences, setConfidences] = useState<Confidences | undefined>();
  const [gestureData] = useGestureData();
  useEffect(() => {
    if (
      status.stage !== MlStage.TrainingComplete ||
      connectStatus !== ConnectionStatus.Connected
    ) {
      return;
    }
    const buffer = new BufferedData(150);
    const listener = (e: AccelerometerDataEvent) => {
      buffer.addSample(e.data, Date.now());
    };
    connection.addAccelerometerListener(listener);
    const runPrediction = async () => {
      const input = {
        model: status.model,
        data: buffer.getSamples(Date.now() - mlSettings.duration),
        classificationIds: gestureData.data.map((d) => d.ID),
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
      clearInterval(interval);
      connection.removeAccelerometerListener(listener);
    };
  }, [
    connection,
    gestureData.data,
    logging,
    confidences,
    status,
    connectStatus,
  ]);

  return confidences;
};
