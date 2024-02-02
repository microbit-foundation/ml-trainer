/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { isDevMode } from '../environment';

export interface Event {
  type: string;
  message?: string;
  value?: number;
  detail?: any;
}

export const logMessage = (v: any, ...optionalParams: any[]) => {
  if (isDevMode) {
    console.log(v, ...optionalParams);
  }
};

export const logError = (context: string, error: any) => {
  if (isDevMode) {
    console.error(context);
    console.error(error);
  }
};

export const logEvent = (event: Event) => {
  logMessage(event);
};
