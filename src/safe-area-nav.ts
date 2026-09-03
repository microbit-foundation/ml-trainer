/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { PluginListenerHandle, registerPlugin } from "@capacitor/core";
import { SafeAreaNavInsets, SafeAreaNavSource } from "@microbit/ui";

interface SafeAreaNavPlugin {
  getInsets(): Promise<SafeAreaNavInsets>;
  addListener(
    eventName: "insetsChanged",
    listenerFunc: (insets: SafeAreaNavInsets) => void
  ): Promise<PluginListenerHandle>;
}

const SafeAreaNav = registerPlugin<SafeAreaNavPlugin>("SafeAreaNav");

/**
 * Android-only source for shared-ui's `--safe-area-nav-*` variables, fed by
 * MainActivity's window-insets listener via SafeAreaNavPlugin. Real
 * WindowInsets types (navigation bar vs display cutout), replacing
 * shared-ui's size heuristic.
 */
export const safeAreaNavSource: SafeAreaNavSource = (onChange) => {
  let cancelled = false;
  let handle: PluginListenerHandle | undefined;
  // Attach the listener before pulling the initial value, so a change
  // landing in between can't be missed (a repeat is harmless).
  void SafeAreaNav.addListener("insetsChanged", onChange)
    .then((h) => {
      if (cancelled) {
        void h.remove();
      } else {
        handle = h;
      }
      return SafeAreaNav.getInsets();
    })
    .then((insets) => {
      if (!cancelled) {
        onChange(insets);
      }
    });
  return () => {
    cancelled = true;
    void handle?.remove();
  };
};
