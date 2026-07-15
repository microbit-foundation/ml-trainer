/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { defineRecipe } from "@pandacss/dev";

// Chakra's transition.property.common, inlined (Panda has no transitionProperty
// token category).
const transitionCommon =
  "background-color, border-color, color, fill, stroke, opacity, box-shadow, transform";

/**
 * Input recipe — Chakra's outline Input field at md size (light mode). Used by
 * the shared-ui Input and NativeSelect, and by TextField's input slot.
 *
 * Focus matches both native `:focus-visible` (plain inputs; browsers treat any
 * focus in a text field as focus-visible) and react-aria's `data-focused`
 * (inputs inside RAC TextField). Focus is declared after invalid so a focused
 * invalid field shows the focus ring, as in Chakra.
 *
 * Registered in `src/deployment/default/panda-preset.ts`.
 */
export const input = defineRecipe({
  className: "input",
  base: {
    width: "100%",
    minWidth: 0,
    outline: "none",
    position: "relative",
    appearance: "none",
    font: "inherit",
    transitionProperty: transitionCommon,
    transitionDuration: "normal",
    fontSize: "md",
    px: "4",
    h: "10",
    borderRadius: "md",
    border: "1px solid",
    borderColor: "gray.200",
    bg: "inherit",
    color: "inherit",
    _hover: { borderColor: "gray.300" },
    "&[data-invalid], &:user-invalid": {
      borderColor: "red.500",
      boxShadow: "0 0 0 1px token(colors.red.500)",
    },
    "&:is(:focus-visible, [data-focused])": {
      zIndex: 1,
      borderColor: "blue.500",
      boxShadow: "0 0 0 1px token(colors.blue.500)",
      // Focus indicator for forced-colors modes, which strip the box-shadow
      // and force the border colour (the focusShadow utility's technique; the
      // ring here is the 1px border tint, not an outline* shadow token).
      outline: "2px solid transparent",
      outlineOffset: "2px",
    },
    "&:is(:disabled, [data-disabled])": {
      opacity: 0.4,
      cursor: "not-allowed",
    },
  },
});
