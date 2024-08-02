import { useEffect, useMemo, useRef, useState } from "react";
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
  const buffer = useBufferedData();
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
    const runPrediction = async () => {
      const startTime = Date.now() - mlSettings.duration;
      const input = {
        model: status.model,
        data: buffer.getSamples(startTime),
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
      setConfidences(undefined);
      clearInterval(interval);
    };
  }, [connection, gestureData.data, logging, status, connectStatus, buffer]);

  return confidences;
};

export const useBufferedData = (): BufferedData => {
  const connectStatus = useConnectStatus();
  const connection = useConnectActions();
  const bufferRef = useRef<BufferedData>();
  const getBuffer = () => {
    if (bufferRef.current) {
      return bufferRef.current;
    }
    bufferRef.current = new BufferedData(mlSettings.numSamples * 2);
    return bufferRef.current;
  };
  useEffect(() => {
    if (connectStatus !== ConnectionStatus.Connected) {
      return;
    }
    const listener = (e: AccelerometerDataEvent) => {
      getBuffer().addSample(e.data, Date.now());
    };
    connection.addAccelerometerListener(listener);
    return () => {
      connection.removeAccelerometerListener(listener);
      getBuffer().clear();
    };
  }, [connection, connectStatus]);
  return getBuffer();
};
