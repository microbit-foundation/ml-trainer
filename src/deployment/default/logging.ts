/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { Logging } from "../../logging/logging";

export class NullLogging implements Logging {
  event(): void {}
  error(): void {}
  log(e: string): void {
    console.log(e);
  }
}
