/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { App as CapacitorApp } from "@capacitor/app";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { isNativePlatform } from "./platform";
import { isWebUrl } from "./utils/url-util";

export const useDeepLinks = (): void => {
  const navigate = useNavigate();
  useEffect(() => {
    if (!isNativePlatform()) {
      return;
    }

    const handle = (url: string) => {
      // Only handle web links here; file/content URLs (e.g. opening a .hex
      // file) are handled by the file open listener in project-hooks.
      if (!isWebUrl(url)) {
        return;
      }
      const parsed = new URL(url);
      navigate(`${parsed.pathname}${parsed.search}${parsed.hash}`);
    };

    // Cold start: the link that launched the app fires appUrlOpen before the
    // listener is attached, so the event is missed. getLaunchUrl() retrieves
    // that launch URL once we're ready, independent of the event timing.
    void CapacitorApp.getLaunchUrl().then((result) => {
      if (result?.url) {
        handle(result.url);
      }
    });

    // Warm start: links received while the app is already running.
    const listener = CapacitorApp.addListener("appUrlOpen", ({ url }) => {
      handle(url);
    });

    return () => {
      void listener.then((l) => l.remove());
    };
  }, [navigate]);
};
