/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useLayoutEffect } from "react";

/**
 * Measures env(safe-area-inset-*) values by applying them to a test element.
 */
const measureSafeAreaInsets = () => {
  const testEl = document.createElement("div");
  testEl.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding-top: env(safe-area-inset-top);
    padding-right: env(safe-area-inset-right);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    pointer-events: none;
    visibility: hidden;
  `;
  document.body.appendChild(testEl);

  const style = getComputedStyle(testEl);
  const insets = {
    top: parseInt(style.paddingTop, 10) || 0,
    right: parseInt(style.paddingRight, 10) || 0,
    bottom: parseInt(style.paddingBottom, 10) || 0,
    left: parseInt(style.paddingLeft, 10) || 0,
  };

  document.body.removeChild(testEl);
  return insets;
};

/**
 * Detects safe area insets and sets CSS custom properties for the navigation
 * bar side only (the larger of left/right insets in landscape).
 *
 * Sets on :root:
 * - --safe-area-nav-left: The left inset if it's the nav bar side, else 0px
 * - --safe-area-nav-right: The right inset if it's the nav bar side, else 0px
 *
 * This allows content to flow under the camera cutout (smaller inset) while
 * respecting the navigation bar (larger inset).
 *
 * Current approach: Heuristic based on inset size (nav bar > camera cutout).
 *
 * Future improvement: Use Android's WindowInsets API in MainActivity.java to
 * distinguish between inset sources and pass the info to JS:
 *
 *   WindowInsets insets = view.getRootWindowInsets();
 *   Insets navBar = insets.getInsets(WindowInsetsCompat.Type.navigationBars());
 *   Insets cutout = insets.getInsets(WindowInsetsCompat.Type.displayCutout());
 *   // Inject as CSS variables or expose via a Capacitor plugin
 *
 * This would be more accurate than the size heuristic.
 */
export const useSafeAreaInsets = () => {
  useLayoutEffect(() => {
    const updateInsets = () => {
      const { left, right } = measureSafeAreaInsets();
      const root = document.documentElement;

      // The larger inset is likely the navigation bar
      if (left > right) {
        root.style.setProperty("--safe-area-nav-left", `${left}px`);
        root.style.setProperty("--safe-area-nav-right", "0px");
      } else if (right > left) {
        root.style.setProperty("--safe-area-nav-left", "0px");
        root.style.setProperty("--safe-area-nav-right", `${right}px`);
      } else {
        // Equal (including both 0) - respect both
        root.style.setProperty("--safe-area-nav-left", `${left}px`);
        root.style.setProperty("--safe-area-nav-right", `${right}px`);
      }
    };

    // Update on mount
    updateInsets();

    // Update on resize/orientation change
    window.addEventListener("resize", updateInsets);
    window.addEventListener("orientationchange", updateInsets);

    return () => {
      window.removeEventListener("resize", updateInsets);
      window.removeEventListener("orientationchange", updateInsets);
    };
  }, []);
};
