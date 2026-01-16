/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Capacitor } from "@capacitor/core";
import { flags } from "./flags";

/**
 * Check if running on a native platform (iOS/Android) or simulating native behavior.
 * Use this instead of Capacitor.isNativePlatform() to allow testing native flows in web.
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform() || flags.simulateNative;
};
