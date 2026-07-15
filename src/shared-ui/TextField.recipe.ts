/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { defineSlotRecipe } from "@pandacss/dev";

/**
 * Field slot recipe — Chakra's FormControl parts (FormLabel/FormHelperText/
 * FormErrorMessage, light mode). Consumed by the shared-ui TextField, which
 * maps the slots onto react-aria-components' TextField/Label/Text/FieldError;
 * the input itself is styled by the `input` recipe (Input.recipe.ts).
 *
 * Registered in `src/deployment/default/panda-preset.ts`. No variants, so it
 * needs no `staticCss` entry.
 */
export const field = defineSlotRecipe({
  className: "field",
  slots: ["root", "label", "requiredIndicator", "helperText", "errorMessage"],
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
      color: "danger.500",
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
      color: "danger.500",
    },
  },
});
