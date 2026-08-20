/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * Keeps the Smart App Banner's `app-argument` pointing at the page the
 * visitor is currently on, so tapping the banner opens that route in the iOS
 * app rather than its home screen. Safari hands the argument to the app as a
 * URL, which `useDeepLinks` routes exactly as it does a universal link.
 *
 * index.html sets the argument inline at parse time, because Safari reads the
 * tag on load and React hasn't mounted by then. This covers the client-side
 * navigations that follow, which the parse-time script can't see.
 *
 * The tag is absent on the apps build and on deployments that supply no
 * `iosAppStoreId`, in which case this does nothing.
 */
export const useSmartAppBanner = (): void => {
  const { pathname, search, hash } = useLocation();
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-itunes-app"]'
    );
    if (!meta) {
      return;
    }
    // The argument has to be absolute. The router runs without a basename, so
    // its pathname is the document's.
    const url = `${window.location.origin}${pathname}${search}${hash}`;
    meta.content = meta.content.replace(
      /app-argument=.*$/,
      () => `app-argument=${url}`
    );
  }, [pathname, search, hash]);
};
