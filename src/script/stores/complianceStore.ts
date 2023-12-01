/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { writable } from 'svelte/store';

// Integrates the Micro:bit Educational Foundation common cookie consent dialog/analytics.
// Not suitable for other deployments.

export interface CookieConsent {
  analytics: boolean;
  functional: boolean;
}

const config = {
  ga:
    process.env.VITE_STAGE === 'PRODUCTION' || process.env.VITE_STAGE === 'STAGING'
      ? {}
      : undefined,
  custom: [
    {
      type: 'cookie',
      category: 'essential',
      name: 'something',
      domain: 'ml-tool.microbit.org',
      purpose: 'Something helpful here',
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
