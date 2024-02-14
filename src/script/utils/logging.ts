/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import * as Sentry from '@sentry/svelte';
import { appName, isDevMode, stage, version } from '../environment';

export interface Event extends Record<string, any> {
  type: string;
  action: string;
}

const sentryDsn: string | undefined =
  stage !== 'production' ? undefined : import.meta.env.VITE_SENTRY_DSN;

try {
  Sentry.init({
    dsn: sentryDsn,
    release: `machine-learning-tool-v${version}`,
    environment: stage,
    enabled: stage === 'production',
  });
} catch (e) {
  // Ensure failures here don't impact app use.
}

export const logMessage = (message: string, ...optionalParams: any[]) => {
  if (isDevMode) {
    console.log(message, ...optionalParams);
  }
  if (stage === 'production' && sentryDsn) {
    try {
      Sentry.addBreadcrumb({
        category: 'Log message',
        message,
        data: optionalParams,
        level: 'info',
      });
    } catch (e) {
      // Ensure failures here don't impact app use.
    }
  }
};

export const logError = (context: string, error: any) => {
  if (isDevMode) {
    console.error(context);
    console.error(error);
  }
  if (stage === 'production' && sentryDsn) {
    try {
      Sentry.captureException(error, {
        extra: {
          context,
        },
      });
    } catch (e) {
      // Ensure failures here don't impact app use.
    }
  }
};

export const logEvent = (event: Event) => {
  if (isDevMode) {
    console.log(event);
  }
  const gtag = (window as any).gtag;
  if (stage === 'production' && gtag) {
    try {
      const { type, action, ...rest } = event;
      gtag('event', type, {
        app_name: appName,
        action,
        ...rest,
      });
    } catch (e) {
      // Ensure failures here don't impact app use.
    }
  }
  if (stage === 'production' && sentryDsn) {
    try {
      Sentry.addBreadcrumb({
        category: 'Event',
        data: event,
        level: 'info',
      });
    } catch (e) {
      // Ensure failures here don't impact app use.
    }
  }
};
