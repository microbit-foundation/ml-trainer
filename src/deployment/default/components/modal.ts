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
 */
const baseStyle = definePartsStyle({
  dialog: {
    mx: 2,
  },
});

/**
 * Add safe area inset handling for full-screen modals on devices with notches/status bars.
 * Uses a gradient to maintain the brand color in the status bar area (matching ActionBar).
 */
const full = definePartsStyle({
  dialog: {
    mx: 0,
    paddingTop: "env(safe-area-inset-top)",
    paddingBottom: "env(safe-area-inset-bottom)",
    paddingLeft: "env(safe-area-inset-left)",
    paddingRight: "env(safe-area-inset-right)",
    background:
      "linear-gradient(to bottom, var(--chakra-colors-brand2-600) env(safe-area-inset-top), white env(safe-area-inset-top))",
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
