/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { Logging } from "../../logging/logging";

// TODO: To revert, temporarily added logging for debugging.
export class NullLogging implements Logging {
  event(e: unknown) {
    console.log(e);
  }
  error(e: unknown) {
    console.log(e);
  }
  log(e: unknown) {
    console.log(e);
  }
}
