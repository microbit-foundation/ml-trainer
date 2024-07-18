/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { Logging } from "../../logging/logging";

export class NullLogging implements Logging {
  event(e: any): void {
    console.log(e);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(e: any): void {
    console.error(e);
  }
  log(e: any): void {
    console.log(e);
  }
}
