/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
export interface Event {
  type: string;
  message?: string;
  value?: number;
  detail?: any;
}

export interface Navigation {
  /**
   * The route path, stripped of query string and fragment.
   */
  path: string;
}

export interface Logging {
  event(event: Event): void;
  /**
   * Returns a reference for the report (the Sentry event id) when one was
   * sent, for showing to the user so support can find the report.
   */
  error(message: string, e: unknown): string | undefined;
  log(e: any): void;
  /**
   * Update the user's analytics consent.
   */
  setConsent(granted: boolean): void;
  /**
   * Notify the analytics backend of a route change. Call from the
   * router's location-change effect, including on initial mount.
   */
  navigate(args: Navigation): void;
  /**
   * Set a GA4 user property — auto-attaches to every subsequent event
   * for the same user. Set early (e.g. on app boot) so events fired
   * after are queryable by it.
   */
  setUserProperty(name: string, value: string): void;
}
