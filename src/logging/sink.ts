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

export type AnalyticsParams = Record<string, string | number | boolean>;

/**
 * Platform-specific output target for analytics events. The Logger
 * class owns the cross-cutting concerns (Sentry, param building,
 * breadcrumbs); the sink owns whatever's specific to the current
 * platform's analytics SDK and consent semantics.
 */
export interface AnalyticsSink {
  event(name: string, params: AnalyticsParams): void;
  setUserProperty(name: string, value: string): void;
  setConsent(granted: boolean): void;
  navigate(path: string): void;
}

type GtagFn = {
  (command: "event", eventName: string, params: AnalyticsParams): void;
  (
    command: "set",
    target: "user_properties",
    values: Record<string, string>
  ): void;
};

const gtag = () => (window as Window & { gtag?: GtagFn }).gtag;

/**
 * Web sink: emits events through gtag (when shared-assets/common.js
 * has set it up). Consent is owned by the shared-assets cookie modal,
 * so setConsent is a no-op here. GA4 Enhanced Measurement auto-collects
 * page_view, so navigate is also a no-op (emitting would double-count).
 * gtag is hostname-gated to `*.microbit.org` by shared-assets; on
 * domains where the script doesn't load, the no-gtag path is silent.
 */
export class WebSink implements AnalyticsSink {
  event(name: string, params: AnalyticsParams): void {
    gtag()?.("event", name, params);
  }

  setUserProperty(name: string, value: string): void {
    gtag()?.("set", "user_properties", { [name]: value });
  }

  setConsent(_granted: boolean): void {
    // Web's analytics consent is owned by shared-assets'
    // commonConsent / gtag('consent', 'update', ...) flow — see
    // src/compliance/web.tsx.
  }

  navigate(_path: string): void {
    // GA4 Enhanced Measurement auto-collects page_view; emitting here
    // too would double-count.
  }
}

/**
 * Native sink: emits events to Firebase Analytics via the
 * @capacitor-firebase/analytics native bridge. Events, navigate, and
 * setUserProperty are gated at this layer in addition to Firebase's
 * own consent mode so a denied user produces zero SDK calls.
 * setConsent flips the master analytics_collection_enabled flag and
 * mirrors the GDPR consent-mode AnalyticsStorage status. Firebase
 * auto-collection is disabled at startup via the
 * FirebaseDataCollectionDefaultEnabled key in Info.plist (iOS) /
 * AndroidManifest meta-data (Android); setConsent flips it on.
 *
 * `stageEnabled` mirrors the web cookie modal's stage gate: on
 * REVIEW / BETA / local dev all SDK methods become no-ops so
 * developer / preview traffic never reaches the live property. The
 * consent UX (first-run dialog + Settings toggle) is intentionally
 * left visible on gated stages so it stays exercisable.
 */
export class NativeSink implements AnalyticsSink {
  private consentGranted = false;

  constructor(private stageEnabled: boolean) {}

  event(name: string, params: AnalyticsParams): void {
    if (!this.stageEnabled || !this.consentGranted) return;
    void FirebaseAnalytics.logEvent({ name, params }).catch(() => {
      // Silent — analytics must never crash calling code.
    });
  }

  setUserProperty(name: string, value: string): void {
    if (!this.stageEnabled || !this.consentGranted) return;
    void FirebaseAnalytics.setUserProperty({ key: name, value }).catch(() => {
      // Silent.
    });
  }

  setConsent(granted: boolean): void {
    this.consentGranted = granted;
    if (!this.stageEnabled) return;
    void FirebaseAnalytics.setEnabled({ enabled: granted }).catch(() => {
      // Ignore: JS-side gate is authoritative for our own events.
    });
    void FirebaseAnalytics.setConsent({
      type: ConsentType.AnalyticsStorage,
      status: granted ? ConsentStatus.Granted : ConsentStatus.Denied,
    }).catch(() => {
      // Ignore: JS-side gate is authoritative for our own events.
    });
  }

  navigate(path: string): void {
    if (!this.stageEnabled || !this.consentGranted) return;
    // Firebase doesn't auto-collect screen_view inside a Capacitor
    // WebView (its automatic tracking is hooked into the native view
    // hierarchy). screen_name matches the page_path GA4 Enhanced
    // Measurement collects on web, so the unified Pages-and-screens
    // report aligns without a custom dimension.
    void FirebaseAnalytics.logEvent({
      name: "screen_view",
      params: { screen_name: path },
    }).catch(() => {
      // Silent — analytics must never crash calling code.
    });
  }
}
