/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  ConsentStatus,
  ConsentType,
  FirebaseAnalytics,
} from "@capacitor-firebase/analytics";
import { Event, Logging, Navigation } from "./logging";

/**
 * A Logging backend that emits events to Firebase Analytics via the
 * @capacitor-firebase/analytics native bridge. Intended for the Capacitor
 * (iOS/Android) builds; on web, use the gtag-based backend instead. The
 * construction site is responsible for only instantiating this on native
 * platforms — the class itself does not guard.
 *
 * Events are gated at this layer in addition to Firebase's own consent
 * mode so that a denied user produces zero SDK calls, not just calls
 * that the SDK internally drops. `setConsent` must be called before any
 * events can be emitted; the default state is denied.
 *
 * Errors and general log output are intentionally not forwarded to
 * Firebase — Firebase Analytics has no custom-error API, and the project
 * uses Sentry for that. A composed Logging implementation (Firebase for
 * events, Sentry for errors) is the expected shape in deployment.
 */
export class FirebaseAnalyticsLogging implements Logging {
  private consentGranted = false;

  constructor() {
    // Firebase's default consent state for analytics_storage is "granted"
    // unless overridden. Explicitly deny at startup so nothing lands in
    // GA4 until the user has agreed; setConsent below flips this on.
    void FirebaseAnalytics.setConsent({
      type: ConsentType.AnalyticsStorage,
      status: ConsentStatus.Denied,
    }).catch(() => {
      // Swallow: if the native bridge is unavailable at construction
      // time, the event gate below still prevents emission.
    });
  }

  /**
   * Update the user's analytics consent. Called by the consent provider
   * on load (with the persisted decision) and on every change.
   *
   * Note: Firebase respects the flag going forward but does not delete
   * events already buffered on disk. The JS-side gate below is what
   * actually guarantees no events are sent post-denial; the SDK call
   * keeps Firebase's own consent-mode state in sync for anything the
   * SDK emits automatically (e.g. session_start).
   */
  setConsent(granted: boolean): void {
    this.consentGranted = granted;
    void FirebaseAnalytics.setConsent({
      type: ConsentType.AnalyticsStorage,
      status: granted ? ConsentStatus.Granted : ConsentStatus.Denied,
    }).catch(() => {
      // Ignore: JS-side gate is authoritative for our own events.
    });
  }

  event(event: Event): void {
    if (!this.consentGranted) {
      return;
    }
    // Firebase rules: event and param names must match
    // /[A-Za-z][A-Za-z0-9_]*/ and be ≤40 chars, param values must be
    // primitives (strings ≤100 chars, numbers, booleans). Source uses
    // snake_case so no rewrite is needed; the dev-mode validator
    // catches drift.
    const params: Record<string, string | number | boolean> = {};
    if (
      event.detail !== undefined &&
      typeof event.detail === "object" &&
      event.detail !== null
    ) {
      for (const [k, v] of Object.entries(
        event.detail as Record<string, unknown>
      )) {
        if (isPrimitive(v)) {
          params[k] = v;
        }
      }
    }
    // Top-level fields set last so they can't be shadowed by detail keys
    // of the same name.
    if (event.message !== undefined) {
      params.message = event.message;
    }
    if (event.value !== undefined) {
      params.value = event.value;
    }

    void FirebaseAnalytics.logEvent({ name: event.type, params }).catch(() => {
      // Silent — analytics must never crash calling code.
    });
  }

  setUserProperty(name: string, value: string): void {
    if (!this.consentGranted) {
      return;
    }
    void FirebaseAnalytics.setUserProperty({ key: name, value }).catch(() => {
      // Silent.
    });
  }

  error(_message: string, _e: unknown): void {
    // Errors are Sentry's job; intentionally a no-op here so a composed
    // logger (Firebase + Sentry) doesn't double-report.
  }

  log(_e: unknown): void {
    // As above — general diagnostic logging is not a Firebase concern.
  }

  navigate({ path }: Navigation): void {
    if (!this.consentGranted) {
      return;
    }
    // Firebase doesn't auto-collect `screen_view` inside a Capacitor
    // WebView (its automatic tracking is hooked into the native view
    // hierarchy). `screen_name` matches the `page_path` GA4 Enhanced
    // Measurement collects on web so the unified Pages-and-screens
    // report aligns without a custom dimension.
    void FirebaseAnalytics.logEvent({
      name: "screen_view",
      params: { screen_name: path },
    }).catch(() => {
      // Silent — analytics must never crash calling code.
    });
  }
}

const isPrimitive = (v: unknown): v is string | number | boolean =>
  typeof v === "string" || typeof v === "number" || typeof v === "boolean";
