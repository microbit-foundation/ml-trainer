/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useEffect } from "react";

/**
 * Marker so we only ever clear the attribute we added ourselves.
 */
const marker = "data-hidden-by-modal";

// Use `aria-hidden` rather than `inert`: it removes the background from the
// accessibility tree (enough to contain TalkBack), without blocking focus.
// `inert` blocks focus, which swallows the focus when Chakra returns focus
// to the trigger element when the dialog closes.
const hide = (el: Element) => el.setAttribute("aria-hidden", "true");
const unhide = (el: Element) => el.removeAttribute("aria-hidden");

/**
 * Ensures the app background is removed from the accessibility tree while a
 * modal is open.
 *
 * TalkBack on Android ignores `aria-modal`, so it relies on background
 * content being `aria-hidden`. In practice `#root` is left reachable for our
 * modals, letting TalkBack swipe out of the dialog (via the WebView root)
 * into the page behind it. Modals portal to `<body>` as siblings of `#root`,
 * so hiding `#root` leaves the dialog itself reachable.
 */
export const useModalHideBackground = () => {
  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) {
      return;
    }
    const update = () => {
      const hasModal = Array.from(
        document.querySelectorAll('[aria-modal="true"]')
      ).some((dialog) => !root.contains(dialog));
      if (hasModal && !root.hasAttribute(marker)) {
        hide(root);
        root.setAttribute(marker, "");
      } else if (!hasModal && root.hasAttribute(marker)) {
        unhide(root);
        root.removeAttribute(marker);
      }
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-modal"],
    });
    return () => observer.disconnect();
  }, []);
};
