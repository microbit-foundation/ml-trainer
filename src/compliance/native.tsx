/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ReactNode, createContext, useEffect, useMemo, useState } from "react";
import { CookieConsent, useDeployment } from "../deployment";
import { useSettings, useStore } from "../store";
import { NativeConsentDialog } from "./NativeConsentDialog";

/**
 * Native (Capacitor) compliance: persists the user's analytics
 * decision in `Settings.analyticsConsent`, prompts on first run via
 * `NativeConsentDialog`, and keeps the active logger's consent state
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

    useEffect(() => {
      if (settingsLoaded) {
        logging.setConsent(decision === "granted");
      }
    }, [settingsLoaded, decision, logging]);

    const choose = (granted: boolean) => {
      setSettings({ analyticsConsent: granted ? "granted" : "denied" });
      setIsOpen(false);
    };

    const value = useMemo<CookieConsent | undefined>(() => {
      if (decision === undefined) {
        return undefined;
      }
      return { analytics: decision === "granted", functional: true };
    }, [decision]);

    return (
      <consentContext.Provider value={value}>
        {children}
        <NativeConsentDialog
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
