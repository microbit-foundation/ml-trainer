import { useMemo } from "react";
import { useConnections } from "./connections-hooks";
import { useGestureData } from "./gestures-hooks";
import { useLogging } from "./logging/logging-hooks";
import { useMlStatus } from "./ml-status-hooks";
import { MlActions } from "./ml-actions";

export const useMlActions = () => {
  const [gestures, setGestures] = useGestureData();
  const [status, setStatus] = useMlStatus();
  const logger = useLogging();
  const { isInputConnected } = useConnections();

  const actions = useMemo<MlActions>(
    () =>
      new MlActions(
        logger,
        isInputConnected,
        gestures,
        setGestures,
        status,
        setStatus
      ),
    [gestures, isInputConnected, logger, setGestures, setStatus, status]
  );
  return actions;
};
