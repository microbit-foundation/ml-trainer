/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { Logging } from "../../logging/logging";

export class NullLogging implements Logging {
  event(_event: Event): void {
    console.log(_event);
  }
  error(_e: any): void {
    console.log(_e);
  }
  log(_e: any): void {
    console.log(_e);
  }
}
