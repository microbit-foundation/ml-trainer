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
   * The route path, stripped of query string and fragment. Sent as
   * `screen_name` on Firebase; matches the `page_path` value GA4
   * Enhanced Measurement collects automatically on web, so the unified
   * "Pages and screens" report aligns without a custom dimension.
   *
   * `screen_class` is deliberately not on the abstraction: it has no
   * web counterpart and adding it just to give app-only reports a
   * second breakdown duplicates information already in `path`.
   */
  path: string;
}

export interface Logging {
  event(event: Event): void;
  error(message: string, e: unknown): void;
  log(e: any): void;
  /**
   * Update the user's analytics consent. Backends that do not own a
   * consent surface should no-op; the Firebase backend wires this to
   * both the JS-side gate and `FirebaseAnalytics.setConsent`. The web
   * (gtag) backend leaves consent to the shared-assets script.
   */
  setConsent(granted: boolean): void;
  /**
   * Notify the analytics backend of a route change. The web (gtag)
   * backend no-ops because GA4 Enhanced Measurement already collects
   * `page_view` on initial load and on History API changes — emitting
   * here too would double-count. The Firebase backend emits a
   * `screen_view`, which Firebase does NOT collect automatically inside
   * a Capacitor WebView (its automatic version tracks native view
   * hierarchy, which the WebView doesn't expose). Call from the
   * router's location-change effect, including on initial mount.
   */
  navigate(args: Navigation): void;
}
