/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { modalAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(modalAnatomy.keys);

/**
 * Add horizontal margin for breathing room on mobile.
 *
 * Override Chakra's default 100vw/100vh on the overlay and dialog
 * container with 100%. Both elements use position:fixed so 100% is
 * relative to the viewport (the initial containing block) — same
 * result as 100vw but immune to iOS WKWebView returning stale
 * viewport-unit values after the app resumes from background.
 *
 * See https://bugs.webkit.org/show_bug.cgi?id=170595
 */
const baseStyle = definePartsStyle({
  dialog: {
    mx: 2,
  },
  overlay: {
    w: "100%",
    h: "100%",
  },
  dialogContainer: {
    width: "100%",
    height: "100%",
  },
});

/**
 * Add safe area inset handling for full-screen modals on devices with notches/status bars.
 * Uses brand color in status bar area (matching ActionBar) with DARK status bar style (white icons).
 */
const full = definePartsStyle({
  dialog: {
    mx: 0,
    maxHeight: "100%",
    paddingTop: "env(safe-area-inset-top)",
    paddingBottom: "env(safe-area-inset-bottom)",
    paddingLeft: "env(safe-area-inset-left)",
    paddingRight: "env(safe-area-inset-right)",
    background:
      "linear-gradient(to bottom, var(--chakra-colors-brand2-500) env(safe-area-inset-top), white env(safe-area-inset-top))",
  },
  header: {
    flexShrink: 0,
    pl: "calc(var(--window-controls-left, 0px) + var(--chakra-space-6))",
  },
  body: {
    flex: 1,
    overflowY: "auto",
  },
  footer: {
    flexShrink: 0,
  },
  closeButton: {
    top: "calc(env(safe-area-inset-top) + var(--chakra-space-2))",
  },
});

const Modal = defineMultiStyleConfig({
  baseStyle,
  sizes: {
    full,
  },
});

export default Modal;
