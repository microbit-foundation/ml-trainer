/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { defineSlotRecipe } from "@pandacss/dev";

// Chakra's transition.property.common, inlined (Panda has no transitionProperty
// token category).
const transitionCommon =
  "background-color, border-color, color, fill, stroke, opacity, box-shadow, transform";

/**
 * Field slot recipe — Chakra's FormControl parts (FormLabel/Input outline
 * md/FormHelperText/FormErrorMessage, light mode). Consumed by the shared-ui
 * TextField, which maps the slots onto react-aria-components'
 * TextField/Label/Input/Text/FieldError.
 *
 * Focus styling keys off RAC's `data-focused`: react-aria treats focus in a
 * text input as keyboard-visible, matching Chakra's `_focusVisible` on inputs.
 * Focus is declared after invalid so a focused invalid field shows the focus
 * ring, as in Chakra.
 *
 * Registered in `src/deployment/default/panda-preset.ts`. No variants, so it
 * needs no `staticCss` entry.
 */
export const field = defineSlotRecipe({
  className: "field",
  slots: [
    "root",
    "label",
    "requiredIndicator",
    "input",
    "helperText",
    "errorMessage",
  ],
  base: {
    root: {
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      width: "100%",
    },
    label: {
      display: "block",
      fontSize: "md",
      fontWeight: "medium",
      marginEnd: "3",
      mb: "2",
      "&[data-disabled]": { opacity: 0.4 },
    },
    requiredIndicator: {
      marginStart: "1",
      color: "red.500",
    },
    input: {
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
      "&[data-invalid]": {
        borderColor: "red.500",
        boxShadow: "0 0 0 1px token(colors.red.500)",
      },
      "&[data-focused]": {
        zIndex: 1,
        borderColor: "blue.500",
        boxShadow: "0 0 0 1px token(colors.blue.500)",
      },
      "&[data-disabled]": { opacity: 0.4, cursor: "not-allowed" },
    },
    helperText: {
      mt: "2",
      fontSize: "sm",
      lineHeight: "normal",
      color: "gray.600",
    },
    errorMessage: {
      display: "flex",
      alignItems: "center",
      mt: "2",
      fontSize: "sm",
      lineHeight: "normal",
      color: "red.500",
    },
  },
});
