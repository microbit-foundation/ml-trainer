/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ButtonEvent } from "@microbit/microbit-connection";
import { useEffect } from "react";
import { useConnectionService } from "../connection-service-hooks";

type ButtonListener = (e: ButtonEvent) => void;

/**
 * Subscribes to micro:bit button events. Callbacks only fire when connected.
 */
export const useMicrobitButtonListener = (
  button: "A" | "B",
  listener: ButtonListener
) => {
  const connectionService = useConnectionService();

  useEffect(() => {
    connectionService.addButtonListener(button, listener);
    return () => connectionService.removeButtonListener(button, listener);
  }, [connectionService, button, listener]);
};
