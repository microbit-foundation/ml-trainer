/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  addBreadcrumb as sentryAddBreadcrumb,
  captureException as sentryCaptureException,
  init as sentryInit,
} from "@sentry/browser";
import { adaptEvent } from "./adapt-event";
import { Event, Logging, Navigation } from "./logging";

type GtagFn = (
  command: "event",
  eventName: string,
  params: Record<string, string | number>
) => void;

/**
 * A Logging backend for the web build: emits events through gtag (when
 * shared-assets/common.js has set it up) and forwards errors plus event
 * breadcrumbs to Sentry. Events are fanned through `adaptEvent` to match
 * the historic UA-shape on GA4. The construction site is responsible for
 * only instantiating this on the web build — gtag is hostname-gated to
 * `*.microbit.org` by shared-assets, and the script does not load in
 * Capacitor builds.
 */
export class GASentryLogging implements Logging {
  private sentryDsn: string | undefined;

  constructor(env: Record<string, string>) {
    const version = env.VITE_VERSION || "unknown";
    const stage = env.VITE_STAGE || "unknown";
    // Disable Sentry for the REVIEW stage even if the env var is set. If
    // we reconsider this then we should at least disable it for localhost
    // to avoid noise from development branch e2e tests.
    this.sentryDsn = stage === "REVIEW" ? undefined : env.VITE_SENTRY_DSN;

    if (this.sentryDsn) {
      try {
        sentryInit({
          dsn: this.sentryDsn,
          release: `createai-v${version}`,
          environment: stage,
          ignoreErrors: [
            // Low consequence and a big chunk of quota.
            "ResizeObserver loop completed with undelivered notifications",

            // User did not select a device.
            /^NotFoundError: User cancelled the requestDevice\(\) chooser.$/,
            /^USB request device failed\/cancelled: {"code":"no-device-selected"}$/,
            /^Flashing failed: {"code":"no-device-selected"}$/,

            // Could not claim device.
            /^USB request device failed\/cancelled: {"code":"clear-connect"}$/,
            /^Failed to execute 'claimInterface' on 'USBDevice': Unable to claim interface.$/,
            /^Flashing failed: {"code":"clear-connect"}$/,

            // Firmware too old (V1).
            /^USB request device failed\/cancelled: {"code":"update-req"}$/,
            /^Flashing failed: {"code":"update-req"}$/,

            // User disconnected micro:bit.
            /^Error processing gatt operations queue - device disconnected$/,
          ],
        });
      } catch (e) {
        console.error(e);
      }
    }
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
    console.error(message, e);
    if (this.sentryDsn) {
      try {
        sentryAddBreadcrumb({
          message,
          type: "error-message",
          level: "error",
        });
        sentryCaptureException(e);
      } catch (err) {
        console.error(err);
      }
    }
  }

  event(event: Event): void {
    try {
      const gtag = (window as Window & { gtag?: GtagFn }).gtag;
      if (gtag) {
        for (const adapted of adaptEvent(event)) {
          const gae: Record<string, string | number> = {
            event_category: "createai",
          };
          if (adapted.message) {
            gae.event_label = adapted.message;
          }
          gae.value = typeof adapted.value === "number" ? adapted.value : 1;
          gtag("event", adapted.type, gae);
        }
      }

      this.breadcrumb("Event", {
        type: event.type,
        message: event.message,
        value: event.value,
        detail: event.detail as unknown,
      });
    } catch (e) {
      console.error(e);
    }
  }

  private breadcrumb(category: string, data: object | string): void {
    if (this.sentryDsn) {
      sentryAddBreadcrumb({
        category,
        message: typeof data === "string" ? data : undefined,
        data: typeof data === "object" ? data : undefined,
        level: "info",
      });
    } else {
      // Avoid double-logging via console + Sentry breadcrumbs when Sentry is on.
      console.log(category, JSON.stringify(data));
    }
  }
}
