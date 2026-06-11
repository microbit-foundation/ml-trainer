/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useBreakpointValue } from "@chakra-ui/react";
import { isNativePlatform } from "./platform";
import { flags } from "./flags";

/**
 * On native platforms, use the tablet breakpoint even when the viewport is
 * wide enough for the desktop (lg) breakpoint. This keeps the action bar
 * compact in landscape orientation where the extra width doesn't warrant
 * desktop-style controls.
 *
 * Returns true when the tablet layout should be used (below lg, or native).
 */
export const useNativeTabletBreakpoint = (): boolean => {
  const isLg = useBreakpointValue({ base: false, lg: true }) ?? false;
  if (isNativePlatform() || flags.nativeScreenshots) {
    return true;
  }
  return !isLg;
};
