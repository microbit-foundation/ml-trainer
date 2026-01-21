/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ButtonEvent } from "@microbit/microbit-connection";
import { useEffect } from "react";
import { useDataConnection } from "../connections-hooks";

type ButtonListener = (e: ButtonEvent) => void;

/**
 * Subscribes to micro:bit button events on the active data connection.
 * Callbacks only fire when connected.
 */
export const useMicrobitButtonListener = (
  button: "A" | "B",
  listener: ButtonListener
) => {
  const connection = useDataConnection();

  useEffect(() => {
    const eventType = button === "A" ? "buttonachanged" : "buttonbchanged";

    connection.addEventListener(eventType, listener);
    return () => connection.removeEventListener(eventType, listener);
  }, [connection, button, listener]);
};
