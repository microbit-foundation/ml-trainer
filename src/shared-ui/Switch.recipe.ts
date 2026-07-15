/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { defineSlotRecipe } from "@pandacss/dev";

/**
 * Switch slot recipe — Chakra's md switch with the default blue colorScheme
 * (light mode). Track is 1.875rem x 1rem with a 2px inset; the thumb slides by
 * the track/thumb width difference when selected.
 *
 * State styling keys off data attributes stamped by the shared-ui Switch
 * (react-aria provides the state via render props).
 *
 * Registered in `src/deployment/default/panda-preset.ts`. No variants, so it
 * needs no `staticCss` entry.
 */
export const switchRecipe = defineSlotRecipe({
  className: "switch",
  slots: ["root", "track", "thumb", "label"],
  base: {
    root: {
      display: "inline-flex",
      alignItems: "center",
      verticalAlign: "top",
      cursor: "pointer",
      position: "relative",
      "&[data-disabled]": { cursor: "not-allowed" },
    },
    track: {
      display: "inline-flex",
      flexShrink: 0,
      justifyContent: "flex-start",
      boxSizing: "content-box",
      borderRadius: "full",
      p: "0.5",
      width: "1.875rem",
      height: "4",
      transitionProperty: "background-color",
      transitionDuration: "fast",
      bg: "gray.300",
      "&[data-selected]": {
        bg: "controlCheckedBg",
      },
      "&[data-focus-visible]": {
        focusShadow: "outline",
      },
      "&[data-disabled]": { opacity: 0.4 },
      // Forced-colors modes strip author backgrounds, flattening track and
      // thumb to the same colour; a border keeps the track visible and the
      // system SelectedItem pair conveys on/off.
      _forcedColors: {
        borderWidth: "1px",
        borderStyle: "solid",
        "&[data-selected]": { bg: "SelectedItem" },
      },
    },
    thumb: {
      bg: "white",
      transitionProperty: "transform",
      transitionDuration: "normal",
      borderRadius: "inherit",
      width: "4",
      height: "4",
      "&[data-selected]": {
        transform: "translateX(0.875rem)",
      },
      _forcedColors: {
        bg: "ButtonText",
        "&[data-selected]": { bg: "SelectedItemText" },
      },
    },
    label: {
      userSelect: "none",
      marginStart: "2",
      "&[data-disabled]": { opacity: 0.4 },
    },
  },
});
