/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { writable } from 'svelte/store';
import { tryLocalStorageGet, tryLocalStorageSet } from '../utils/local-storage';

// Integrates the Micro:bit Educational Foundation common cookie consent dialog/analytics.
// Not suitable for other deployments.

export interface CookieConsent {
  analytics: boolean;
  functional: boolean;
}

const domain = window.location.hostname;
const config = {
  ga:
    import.meta.env.VITE_STAGE === 'PRODUCTION' ||
    import.meta.env.VITE_STAGE === 'STAGING'
      ? {}
      : undefined,
  custom: [
    {
      type: 'local',
      domain,
      category: 'essential',
      name: 'gestureData',
      purpose: 'Stores the training data and other settings for each gesture',
    },
    {
      type: 'local',
      domain,
      category: 'essential',
      name: 'btPatternInput',
      purpose: 'Stores the pairing pattern for the most recent input micro:bit',
    },
    {
      type: 'local',
      domain,
      category: 'essential',
      name: 'btPatternOutput',
      purpose: 'Stores the pairing pattern for the most recent output micro:bit',
    },
    {
      type: 'local',
      domain,
      category: 'essential',
      name: 'MLSettings',
      purpose: 'Stores settings for the machine learning model',
    },
    {
      type: 'local',
      domain,
      category: 'essential',
      name: 'lang',
      purpose: 'Stores your chosen language',
    },
    // Some of the Svelte stores use local storage, this needs investigating
  ],
};

function showConsent(
  { userTriggered }: { userTriggered: boolean } = { userTriggered: false },
) {
  const w = window as any;
  w.commonConsent?.show({ userTriggered, config });
}

export function manageCookies() {
  showConsent({ userTriggered: true });
}

export const consent = writable<CookieConsent | undefined>(undefined);

const seenRedirectDialogKey = 'seenRedirectDialog';
const seenRedirectDialogValue = 'true';

export const setAsSeenRedirectDialog = () => {
  tryLocalStorageSet(seenRedirectDialogKey, seenRedirectDialogValue);
};

export const hasSeenRedirectDialog = () => {
  return tryLocalStorageGet(seenRedirectDialogKey) === seenRedirectDialogValue;
};

const w = window as any;
const updateListener = (event: CustomEvent<CookieConsent>) => {
  consent.set(event.detail);
};
w.addEventListener('consentchange', updateListener);
if (w.commonConsent) {
  showConsent();
} else {
  w.addEventListener('consentinit', showConsent);
}
