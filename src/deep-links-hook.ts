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

    const listener = CapacitorApp.addListener("appUrlOpen", ({ url }) => {
      // Only handle web links here; file/content URLs (e.g. opening a .hex
      // file) are handled by the file open listener in project-hooks.
      if (!isWebUrl(url)) {
        return;
      }
      const parsed = new URL(url);
      navigate(`${parsed.pathname}${parsed.search}${parsed.hash}`);
    });

    return () => {
      void listener.then((l) => l.remove());
    };
  }, [navigate]);
};
