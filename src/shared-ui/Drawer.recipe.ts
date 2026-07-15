/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { defineSlotRecipe } from "@pandacss/dev";

/**
 * Drawer slot recipe — Chakra's default Drawer parts (light mode) at its
 * default `xs` size (20rem panel). Consumed by the shared-ui Drawer, which maps
 * the slots onto react-aria-components' ModalOverlay / Modal / Dialog.
 *
 * The enter transition approximates Chakra's slide spring (damping 25,
 * stiffness 180) with a decelerating tween; exit matches its 0.15s ease-in-out
 * tween.
 *
 * Registered in the shared-ui core preset (panda-preset.ts); `placement` is
 * forwarded as a runtime prop so the variants are generated via `staticCss`.
 */
export const drawer = defineSlotRecipe({
  className: "drawer",
  slots: ["overlay", "content", "inner", "header", "body"],
  base: {
    overlay: {
      position: "fixed",
      inset: 0,
      w: "100%",
      h: "100%",
      bg: "blackAlpha.600",
      zIndex: "modal",
      opacity: 1,
      transition: "opacity 0.2s ease-out",
      "&[data-entering]": { opacity: 0 },
      "&[data-exiting]": { opacity: 0 },
      _motionReduce: { transition: "none" },
    },
    content: {
      position: "fixed",
      top: 0,
      bottom: 0,
      width: "100%",
      maxWidth: "xs",
      maxH: "100dvh",
      color: "inherit",
      bg: "white",
      boxShadow: "lg",
      display: "flex",
      flexDirection: "column",
      outline: "none",
      zIndex: "modal",
      transform: "translateX(0)",
      transition: "transform 0.3s cubic-bezier(0, 0, 0.2, 1)",
      "&[data-exiting]": {
        transition: "transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
      },
      _motionReduce: { transition: "none" },
    },
    inner: {
      outline: "none",
      display: "flex",
      flexDirection: "column",
      width: "100%",
      height: "100%",
    },
    header: {
      px: "6",
      py: "4",
      fontSize: "xl",
      fontWeight: "semibold",
      flexShrink: 0,
    },
    body: {
      px: "6",
      py: "2",
      flex: "1",
      overflow: "auto",
    },
  },
  variants: {
    placement: {
      left: {
        content: {
          left: 0,
          "&[data-entering]": { transform: "translateX(-100%)" },
          "&[data-exiting]": { transform: "translateX(-100%)" },
        },
      },
      right: {
        content: {
          right: 0,
          "&[data-entering]": { transform: "translateX(100%)" },
          "&[data-exiting]": { transform: "translateX(100%)" },
        },
      },
    },
  },
  defaultVariants: { placement: "left" },
});
