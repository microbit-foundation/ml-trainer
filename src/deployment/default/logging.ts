/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { LoggingEvent } from "@microbit/microbit-connection";
import { Logging, Navigation } from "../../logging/logging";

export class ConsoleLogging implements Logging {
  event(event: LoggingEvent): void {
    console.log(event);
  }
  error(message: string, e: unknown): void {
    console.error(message, e);
  }
  log(e: unknown): void {
    console.log(e);
  }
  setConsent(granted: boolean): void {
    console.log("[ConsoleLogging] setConsent:", granted);
  }
  navigate(args: Navigation): void {
    console.log("[ConsoleLogging] navigate:", args);
  }
}
