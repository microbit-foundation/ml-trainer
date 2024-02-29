import { logError } from './logging';

/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
interface BrowserInfo {
  country?: string;
  region?: string;
}

const isBrowserInfo = (v: unknown): v is BrowserInfo => {
  return typeof v === 'object' && v !== null;
};

/**
 * Best effort attempt to fetch browser info.
 * On error it returns empty browser info.
 */
export const fetchBrowserInfo = async (): Promise<BrowserInfo> => {
  try {
    // Note this API is not available if you're running locally without configuring API_PROXY in .env
    const response = await fetch('/api/v1/browser/info');
    if (!response.ok) {
      return {};
    }
    const json = await response.json();
    if (isBrowserInfo(json)) {
      return json;
    }
  } catch (e) {
    logError('Failed to fetch browser info', e);
  }
  return {};
};
