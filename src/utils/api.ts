import { CookieConsent } from '../script/stores/complianceStore';
import { tryLocalStorageGet, tryLocalStorageSet } from './local-storage';

const browserInfoKey = 'browserInfo';

interface BrowserInfo {
  country?: string;
  region?: string;
}

const isBrowserInfo = (v: unknown): v is BrowserInfo => {
  return typeof v === 'object' && v !== null;
};

export const fetchCachedBrowserInfo = async (
  consent: CookieConsent | undefined,
): Promise<BrowserInfo> => {
  if (!consent?.functional) {
    // Can't store it, but can still fetch it.
    return fetchBrowserInfo();
  }
  const value = JSON.parse(tryLocalStorageGet(browserInfoKey) || 'null');
  if (isBrowserInfo(value)) {
    return value;
  }
  const result = await fetchBrowserInfo();
  tryLocalStorageSet(browserInfoKey, JSON.stringify(result));
  return result;
};

/**
 * Best effort attempt to fetch browser info.
 * On error it returns empty browser info.
 */
const fetchBrowserInfo = async (): Promise<BrowserInfo> => {
  try {
    // Note this API is not yet available on branch deployments.
    const response = await fetch('/api/v1/browser/info');
    if (!response.ok) {
      return {};
    }
    const json = await response.json();
    if (isBrowserInfo(json)) {
      return json;
    }
  } catch (e) {
    // Fall through. Would be nice to have Sentry integration here.
  }
  return {};
};
