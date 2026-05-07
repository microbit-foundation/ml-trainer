/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ReactNode, createContext, useEffect, useState } from "react";
import { CookieConsent } from "../deployment";
import { isStageWithAnalytics } from "../logging/stage";

/**
 * Surface of the shared-assets `commonConsent` API
 * (https://shared-assets.microbit.org/common/v2/common.js) that we depend
 * on. Defined here only to give the compliance code a typed handle on
 * `window` — the script itself is the authoritative source of behaviour.
 */
interface CommonConsent {
  show: (opts: { userTriggered?: boolean; config: ConsentConfig }) => void;
  hide: () => void;
}

interface ConsentConfig {
  ga: Record<string, never> | undefined;
  custom: Array<{
    type: string;
    domain: string;
    category: string;
    name: string;
    purpose: string;
  }>;
}

type CommonConsentWindow = Window & {
  commonConsent?: CommonConsent;
};

/**
 * Web compliance backed by the shared-assets `commonConsent` API. Loads
 * the cookie modal, listens for `consentchange`, exposes a
 * `manageCookies` callback that re-opens the modal on user request.
 * Embedded sites (`window.self !== window.top`) assume the parent
 * handles notices so we no-op there.
 */
export const createWebCompliance = (env: Record<string, string>) => {
  const consentContext = createContext<CookieConsent | undefined>(undefined);

  const showConsent = (
    { userTriggered }: { userTriggered: boolean } = { userTriggered: false }
  ) => {
    const domain = window.location.hostname;
    const config: ConsentConfig = {
      ga: isStageWithAnalytics(env.VITE_STAGE) ? {} : undefined,
      custom: [
        {
          type: "local",
          domain,
          category: "essential",
          name: "ml",
          purpose: "Stores the training data and settings for the app",
        },
        {
          type: "local",
          domain,
          category: "essential",
          name: "connectionConfig",
          purpose:
            "Stores the pairing pattern for the most recent used micro:bits",
        },
        {
          type: "indexeddb",
          domain,
          category: "essential",
          name: "tensorflowjs",
          purpose: "Stores the machine learning model",
        },
      ],
    };

    (window as CommonConsentWindow).commonConsent?.show({
      userTriggered,
      config,
    });
  };

  const hideConsent = () => {
    (window as CommonConsentWindow).commonConsent?.hide();
  };

  const manageCookies = () => showConsent({ userTriggered: true });

  const ConsentProvider = ({ children }: { children: ReactNode }) => {
    const [value, setValue] = useState<CookieConsent | undefined>(undefined);
    useEffect(() => {
      // If we're embedded we assume the embedding site is taking
      // responsibility for required notices to avoid nested cookie modals.
      if (inIframe()) {
        return;
      }
      const w = window as CommonConsentWindow;
      const updateListener = (event: Event) => {
        setValue((event as CustomEvent<CookieConsent>).detail);
      };
      const initListener = () => showConsent();
      w.addEventListener("consentchange", updateListener);
      if (w.commonConsent) {
        showConsent();
      } else {
        w.addEventListener("consentinit", initListener);
      }
      return () => {
        w.removeEventListener("consentchange", updateListener);
        w.removeEventListener("consentinit", initListener);
        hideConsent();
      };
    }, []);

    return (
      <consentContext.Provider value={value}>
        {children}
      </consentContext.Provider>
    );
  };

  return { ConsentProvider, consentContext, manageCookies };
};

const inIframe = () => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};
