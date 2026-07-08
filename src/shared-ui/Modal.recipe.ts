/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { defineSlotRecipe } from "@pandacss/dev";

/**
 * Dialog slot recipe — Chakra's default Modal parts (light mode), plus this
 * app's overrides: a full-viewport overlay (the iOS WKWebView 100% fix) and a
 * `full` size with safe-area insets and the brand status-bar gradient.
 *
 * A config recipe (rather than an atomic `sva`) so the `size` variant accepts
 * responsive values, e.g. `{ base: "full", md: "4xl" }`. Consumed by the
 * shared-ui Modal, which maps the slots onto react-aria-components'
 * ModalOverlay / Modal / Dialog.
 *
 * Registered in `src/deployment/default/panda-preset.ts`.
 */
// Appearance of a normal (non-full) modal box. Restated by every non-full size
// variant so that, when `size` is responsive (e.g. { base: "full", md: "4xl" }),
// the larger breakpoint fully overrides the `full` variant rather than leaking
// its margin:0 / border-radius:0 / full-height / gradient into desktop. Panda
// applies the base-breakpoint variant value unconditionally, so symmetric
// property sets across size values are required.
const dialogBox = {
  my: "16",
  mx: "2",
  borderRadius: "md",
  background: "white",
  minHeight: "auto",
  padding: "0",
};

export const dialog = defineSlotRecipe({
  className: "dialog",
  slots: [
    "overlay",
    "content",
    "inner",
    "header",
    "body",
    "footer",
    "closeTrigger",
  ],
  base: {
    overlay: {
      position: "fixed",
      inset: 0,
      w: "100%",
      h: "100%",
      bg: "blackAlpha.600",
      zIndex: "modal",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      overflow: "auto",
      overscrollBehaviorY: "none",
      // Fade the backdrop in/out. RAC toggles data-entering/data-exiting and
      // waits for the transition before unmounting.
      opacity: 1,
      transition: "opacity 0.2s ease-out",
      "&[data-entering]": { opacity: 0 },
      "&[data-exiting]": { opacity: 0 },
      "@media (prefers-reduced-motion: reduce)": { transition: "none" },
    },
    content: {
      position: "relative",
      color: "inherit",
      boxShadow: "lg",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      outline: "none",
      // Approximate Chakra's fade + scale enter/exit.
      opacity: 1,
      transform: "scale(1)",
      transition: "opacity 0.2s ease-out, transform 0.2s ease-out",
      "&[data-entering]": { opacity: 0, transform: "scale(0.95)" },
      "&[data-exiting]": { opacity: 0, transform: "scale(0.95)" },
      "@media (prefers-reduced-motion: reduce)": { transition: "none" },
    },
    inner: {
      outline: "none",
      display: "flex",
      flexDirection: "column",
      width: "100%",
    },
    header: {
      px: "6",
      py: "4",
      fontSize: "xl",
      fontWeight: "semibold",
      flexShrink: 0,
    },
    body: { px: "6", py: "2", flex: "1" },
    footer: {
      px: "6",
      py: "4",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      flexShrink: 0,
    },
    closeTrigger: { position: "absolute", top: "2", insetEnd: "3" },
  },
  variants: {
    size: {
      xs: { content: { ...dialogBox, maxWidth: "xs" } },
      sm: { content: { ...dialogBox, maxWidth: "sm" } },
      md: { content: { ...dialogBox, maxWidth: "md" } },
      lg: { content: { ...dialogBox, maxWidth: "lg" } },
      xl: { content: { ...dialogBox, maxWidth: "xl" } },
      "2xl": { content: { ...dialogBox, maxWidth: "2xl" } },
      "3xl": { content: { ...dialogBox, maxWidth: "3xl" } },
      "4xl": { content: { ...dialogBox, maxWidth: "4xl" } },
      "5xl": { content: { ...dialogBox, maxWidth: "5xl" } },
      "6xl": { content: { ...dialogBox, maxWidth: "6xl" } },
      full: {
        content: {
          maxWidth: "100vw",
          minHeight: "100dvh",
          my: "0",
          mx: "0",
          borderRadius: "0",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
          // brand colour in the status-bar area, white below (matches ActionBar)
          background:
            "linear-gradient(to bottom, token(colors.brand2.500) env(safe-area-inset-top), white env(safe-area-inset-top))",
        },
        header: {
          pl: "calc(var(--window-controls-left, 0px) + token(spacing.6))",
        },
        body: { flex: "1", overflowY: "auto" },
        closeTrigger: {
          top: "calc(env(safe-area-inset-top) + token(spacing.2))",
        },
      },
    },
  },
  defaultVariants: { size: "md" },
});
