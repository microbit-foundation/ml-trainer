/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CookieConsent, useDeployment } from "../deployment";
import { useSettings, useStore } from "../store";
import { MobileConsentDialog } from "./MobileConsentDialog";

const consentVersion = 1;

/**
 * Native (Capacitor) compliance: persists the user's analytics
 * decision in `Settings.analyticsConsent`, prompts on first run via
 * `MobileConsentDialog`, and keeps the active logger's consent state
 * in sync. Settings are the only affordance to revisit the decision —
 * `manageCookies` is intentionally undefined so the (web-shaped)
 * "manage cookies" link is hidden in the navigation drawer on native.
 */
export const createNativeCompliance = () => {
  const consentContext = createContext<CookieConsent | undefined>(undefined);

  const ConsentProvider = ({ children }: { children: ReactNode }) => {
    const [settings, setSettings] = useSettings();
    const settingsLoaded = useStore((s) => s.settingsLoaded);
    const { logging, appNameFull, privacyPolicyLink } = useDeployment();
    const decision = settings.analyticsConsent;

    // Modal opens automatically only after the persisted decision is
    // known to be absent. Without `settingsLoaded` we'd flash the modal
    // for users who already declined while IndexedDB/sqlite read in.
    const [isOpen, setIsOpen] = useState(false);
    useEffect(() => {
      if (settingsLoaded && decision === undefined) {
        setIsOpen(true);
      }
    }, [settingsLoaded, decision]);

    // Mirror the persisted decision into the logger on every change so
    // the FirebaseAnalytics consent-mode flag and the JS-side gate stay
    // aligned. No-op for the ConsoleLogging path used until step 6.
    useEffect(() => {
      if (settingsLoaded) {
        logging.setConsent(decision === "granted");
      }
    }, [settingsLoaded, decision, logging]);

    const choose = useCallback(
      (granted: boolean) => {
        const next: NonNullable<typeof decision> = granted
          ? "granted"
          : "denied";
        setSettings({ analyticsConsent: next });
        setIsOpen(false);
        // Mirror the shared-assets web event contract so anything that
        // listens cross-platform (e.g. an analytics-config endpoint
        // sender added later) sees the same payload shape.
        window.dispatchEvent(
          new CustomEvent<CookieConsent & { version: number }>(
            "consentchange",
            {
              detail: { analytics: granted, functional: true, version: consentVersion },
            }
          )
        );
      },
      [setSettings]
    );

    const value = useMemo<CookieConsent | undefined>(() => {
      if (decision === undefined) {
        return undefined;
      }
      return { analytics: decision === "granted", functional: true };
    }, [decision]);

    return (
      <consentContext.Provider value={value}>
        {children}
        <MobileConsentDialog
          isOpen={isOpen}
          appNameFull={appNameFull}
          privacyPolicyLink={privacyPolicyLink}
          onAllow={() => choose(true)}
          onDecline={() => choose(false)}
        />
      </consentContext.Provider>
    );
  };

  return {
    ConsentProvider,
    consentContext,
    // Settings dialog owns the reversal affordance on native; the
    // "manage cookies" nav-drawer link is hidden when this is undefined.
    manageCookies: undefined,
  };
};
