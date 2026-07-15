/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { defineSlotRecipe } from "@pandacss/dev";

/**
 * Checkbox slot recipe — Chakra's md checkbox with the default blue
 * colorScheme (light mode). The control's `borderColor: inherit` picks up a
 * `borderColor` set on the root, matching Chakra's convention for tinting the
 * box from the call site.
 *
 * State styling keys off data attributes stamped on the control by the
 * shared-ui Checkbox (react-aria provides the state via render props).
 *
 * Registered in the shared-ui core preset (panda-preset.ts). No variants, so it
 * needs no `staticCss` entry.
 */
export const checkbox = defineSlotRecipe({
  className: "checkbox",
  slots: ["root", "control", "icon", "label"],
  base: {
    root: {
      display: "inline-flex",
      alignItems: "center",
      verticalAlign: "top",
      cursor: "pointer",
      position: "relative",
      "&[data-disabled]": { cursor: "not-allowed" },
    },
    control: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      width: "4",
      height: "4",
      transitionProperty: "box-shadow",
      transitionDuration: "normal",
      border: "2px solid",
      borderRadius: "sm",
      borderColor: "inherit",
      color: "white",
      bg: "white",
      "&[data-selected]": {
        bg: "controlCheckedBg",
        borderColor: "controlCheckedBg",
        color: "white",
        _hover: {
          bg: "controlCheckedHoverBg",
          borderColor: "controlCheckedHoverBg",
        },
      },
      "&[data-focus-visible]": {
        focusShadow: "outline",
      },
    },
    icon: {
      width: "0.75rem",
      height: "0.75rem",
      transitionProperty: "transform",
      transitionDuration: "normal",
    },
    label: {
      userSelect: "none",
      marginStart: "2",
      "&[data-disabled]": { opacity: 0.4 },
    },
  },
});
