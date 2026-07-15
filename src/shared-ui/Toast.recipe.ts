/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { defineSlotRecipe } from "@pandacss/dev";

/**
 * Toast slot recipe — the Chakra-era solid Alert restyled as a toast (white
 * text, teal for every status except error). Status colours come from the
 * `toast*Bg` semantic tokens so brand presets can retune them without
 * touching the recipe.
 *
 * Registered in `src/deployment/default/panda-preset.ts`. The status variant
 * is chosen at runtime from the toast content, so it needs the `staticCss`
 * entry in panda.config.ts.
 */
export const toast = defineSlotRecipe({
  className: "toast",
  slots: ["region", "root", "icon", "title", "description", "closeButton"],
  base: {
    region: {
      position: "fixed",
      top: "4",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "toast",
      display: "flex",
      flexDirection: "column",
      gap: "2",
      pointerEvents: "none",
    },
    root: {
      position: "relative",
      display: "flex",
      alignItems: "flex-start",
      gap: "3",
      p: "4",
      // Leave room for the absolutely-positioned close button plus breathing
      // space so its hover area never overlaps the title text (24px button at
      // 4px inset spans ~4-28px from the right; content stops at 40px for a
      // ~12px gap).
      paddingRight: "10",
      borderRadius: "md",
      boxShadow: "lg",
      color: "white",
      maxW: "sm",
      pointerEvents: "auto",
    },
    icon: {
      fontSize: "1.25rem",
      flexShrink: 0,
    },
    title: {
      fontWeight: "bold",
    },
    description: {
      mt: "1",
    },
    closeButton: {
      // A sized box with the glyph centred (like Chakra's CloseButton size
      // "sm": 24px box, 2xs glyph) gives padding around the X and a hover
      // affordance.
      position: "absolute",
      top: "1",
      insetEnd: "1",
      color: "white",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "6",
      height: "6",
      padding: "0",
      fontSize: "2xs",
      borderRadius: "md",
      cursor: "pointer",
      bg: "transparent",
      border: "none",
      outline: "none",
      transitionProperty: "background-color, box-shadow",
      transitionDuration: "normal",
      // Chakra's CloseButton hover is a subtle dark overlay (blackAlpha) in
      // light mode, not a bright highlight.
      _hover: { bg: "blackAlpha.100" },
      _active: { bg: "blackAlpha.200" },
      _focusVisible: { focusShadow: "outline" },
    },
  },
  variants: {
    status: {
      info: { root: { bg: "toastInfoBg" } },
      success: { root: { bg: "toastSuccessBg" } },
      warning: { root: { bg: "toastWarningBg" } },
      error: { root: { bg: "toastErrorBg" } },
    },
  },
  defaultVariants: { status: "info" },
});
