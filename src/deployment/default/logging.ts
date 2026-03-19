/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { LoggingEvent } from "@microbit/microbit-connection";
import { Logging } from "../../logging/logging";

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
}
