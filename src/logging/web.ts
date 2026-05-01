/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Event, Logging, Navigation } from "./logging";
import { initSentry, reportBreadcrumb, reportError } from "./sentry";

type GtagParams = Record<string, string | number | boolean>;

type GtagFn = {
  (command: "event", eventName: string, params: GtagParams): void;
  (
    command: "set",
    target: "user_properties",
    values: Record<string, string>
  ): void;
};

/**
 * A Logging backend for the web build: emits events through gtag (when
 * shared-assets/common.js has set it up) and forwards errors plus event
 * breadcrumbs to Sentry. Events are sent in GA4-native shape (name +
 * flat params), so call-site `detail` fields become event params
 * directly — no UA-era category/label/value fan-out. The construction
 * site is responsible for only instantiating this on the web build —
 * gtag is hostname-gated to `*.microbit.org` by shared-assets, and the
 * script does not load in Capacitor builds.
 */
export class WebLogging implements Logging {
  private sentryDsn: string | undefined;

  constructor(env: Record<string, string>) {
    this.sentryDsn = initSentry(env);
  }

  log(v: unknown): void {
    console.log(v);
  }

  setConsent(_granted: boolean): void {
    // Web build's analytics consent is owned by the shared-assets
    // commonConsent / gtag('consent', 'update', ...) flow — see
    // src/compliance/web.tsx. Nothing to do here.
  }

  navigate(_args: Navigation): void {
    // GA4 Enhanced Measurement automatically collects `page_view` on
    // initial load and on History API changes — emitting through this
    // abstraction would double-count. If we ever need parity with the
    // Firebase backend (e.g. to disambiguate the path normalisation),
    // disable Enhanced Measurement's `page_view` toggle in GA4 Admin
    // and emit a `page_view` here; leave the rest of Enhanced
    // Measurement (scroll, outbound click, etc.) alone.
  }

  error(message: string, e: unknown): void {
    reportError(this.sentryDsn, message, e);
  }

  event(event: Event): void {
    try {
      const gtag = (window as Window & { gtag?: GtagFn }).gtag;
      if (gtag) {
        const params: GtagParams = {};
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
        if (event.message !== undefined) {
          params.message = event.message;
        }
        if (event.value !== undefined) {
          params.value = event.value;
        }
        gtag("event", event.type, params);
      }

      reportBreadcrumb(this.sentryDsn, "Event", {
        type: event.type,
        message: event.message,
        value: event.value,
        detail: event.detail as unknown,
      });
    } catch (e) {
      console.error(e);
    }
  }

  setUserProperty(name: string, value: string): void {
    try {
      const gtag = (window as Window & { gtag?: GtagFn }).gtag;
      if (gtag) {
        gtag("set", "user_properties", { [name]: value });
      }
    } catch (e) {
      console.error(e);
    }
  }
}

const isPrimitive = (v: unknown): v is string | number | boolean =>
  typeof v === "string" || typeof v === "number" || typeof v === "boolean";
