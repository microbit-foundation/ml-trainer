/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { defineSlotRecipe } from "@pandacss/dev";

/**
 * Card slot recipe — Chakra's Card at its default md size (light mode), with
 * the `elevated` (default) and `outline` variants this app uses.
 *
 * Registered in `src/deployment/default/panda-preset.ts`; `variant` is
 * forwarded as a runtime prop so the variants are generated via `staticCss`.
 */
export const card = defineSlotRecipe({
  className: "card",
  slots: ["container", "body"],
  base: {
    container: {
      display: "flex",
      flexDirection: "column",
      position: "relative",
      minWidth: 0,
      wordWrap: "break-word",
      bg: "white",
      borderRadius: "md",
      color: "inherit",
    },
    body: {
      padding: "5",
      flex: "1 1 0%",
    },
  },
  variants: {
    variant: {
      elevated: {
        container: { boxShadow: "base" },
      },
      outline: {
        container: {
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "gray.200",
        },
      },
    },
  },
  defaultVariants: { variant: "elevated" },
});
