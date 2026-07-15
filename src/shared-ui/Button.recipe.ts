/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { defineRecipe } from "@pandacss/dev";

// Chakra's transition.property.common, inlined (Panda has no transitionProperty
// token category). Matches Chakra's Button base transition.
const transitionCommon =
  "background-color, border-color, color, fill, stroke, opacity, box-shadow, transform";

/**
 * Button recipe — Chakra's default Button base + sizes, with this app's
 * borderRadius (`button` = 2rem) and variant set ported from
 * `components/button.ts`. Interaction conditions (`_hover`/`_active`/
 * `_disabled`/`_focusVisible`) are widened in the preset to also match
 * react-aria-components' data attributes, so these Chakra-shaped variant
 * objects work unchanged on RAC's <Button>.
 *
 * A config recipe (not a component cva): styles land in the `recipes` layer so
 * call sites can override with plain style props, and presets could extend the
 * variants if brands ever diverge structurally. Today brand divergence is
 * token-driven (see the `languageText` semantic tokens in the preset).
 *
 * Registered in `src/deployment/default/panda-preset.ts`.
 */
export const button = defineRecipe({
  className: "btn",
  jsx: ["Button", "IconButton"],
  base: {
    lineHeight: "1.2",
    borderRadius: "button",
    fontWeight: "semibold",
    transitionProperty: transitionCommon,
    transitionDuration: "normal",
    display: "inline-flex",
    appearance: "none",
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
    position: "relative",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
    outline: "none",
    _focusVisible: {
      focusShadow: "outline",
    },
    _disabled: {
      opacity: 0.4,
      cursor: "not-allowed",
      boxShadow: "none",
    },
    _hover: {
      _disabled: {
        bg: "initial",
      },
    },
  },
  variants: {
    size: {
      lg: { h: "12", minW: "12", fontSize: "lg", px: "6" },
      md: { h: "10", minW: "10", fontSize: "md", px: "4" },
      sm: { h: "8", minW: "8", fontSize: "sm", px: "3" },
      xs: { h: "6", minW: "6", fontSize: "xs", px: "2" },
    },
    variant: {
      // Chakra's unstyled reset + this app's border-radius removal.
      unstyled: {
        bg: "none",
        color: "inherit",
        display: "inline",
        lineHeight: "inherit",
        m: "0",
        p: "0",
        borderRadius: "unset",
      },
      // Chakra's link layout (no padding/height) + this app's colours.
      link: {
        padding: 0,
        height: "auto",
        lineHeight: "normal",
        verticalAlign: "baseline",
        borderWidth: "0",
        color: "brand.600",
        fontWeight: "normal",
        bg: "transparent",
        _hover: {
          textDecoration: "underline",
        },
      },
      secondary: {
        borderWidth: "2px",
        borderColor: "brand.500",
        color: "brand.700",
        bg: "transparent",
        _hover: { borderColor: "brand.600" },
        _active: { bg: "brand.50", borderColor: "brand.700" },
      },
      led: {
        borderWidth: "2px",
        borderRadius: "5px",
        borderColor: "brand2.500",
        color: "brand2.700",
        bg: "transparent",
        _hover: { cursor: "pointer", borderColor: "brand2.500" },
        _active: { bg: "brand2.500", borderColor: "brand2.500" },
      },
      ghost: {
        color: "black",
        bg: "transparent",
        _hover: { bg: "blackAlpha.50" },
        _active: { bg: "blackAlpha.100" },
      },
      // Chakra had no `plain` variant, so `variant="plain"` fell through to
      // base-only styling: a transparent, colour-inheriting button. Used for the
      // action-bar icon-button menu triggers (settings/help), which supply their
      // own colour and shape via instance styles.
      plain: {
        bg: "transparent",
        color: "inherit",
      },
      primary: {
        color: "white",
        bg: "brand.500",
        _hover: { bg: "brand.600", _disabled: { bg: "brand.500" } },
        _active: { bg: "brand.700" },
      },
      recordOutline: {
        borderWidth: "1px",
        borderColor: "red.500",
        color: "red.500",
        bg: "transparent",
        _hover: { bg: "red.50" },
        _active: { borderColor: "red.600", color: "red.600", bg: "red.100" },
      },
      record: {
        color: "white",
        bg: "red.500",
        _hover: { bg: "red.600", _disabled: { bg: "red.500" } },
        _active: { bg: "red.700" },
      },
      warning: {
        borderWidth: "2px",
        borderColor: "danger.500",
        color: "danger.500",
        bg: "transparent",
        _hover: { borderColor: "danger.600" },
        _active: { bg: "danger.50", borderColor: "danger.500" },
      },
      // Chakra's built-in solid + red colorScheme (destructive confirm
      // buttons). Same values as `record` today, but a separate variant so
      // recording UI and destructive actions can diverge - hence danger
      // tokens here, red.* literals there.
      warningSolid: {
        color: "white",
        bg: "danger.500",
        _hover: { bg: "danger.600", _disabled: { bg: "danger.500" } },
        _active: { bg: "danger.700" },
      },
      toolbar: {
        color: "black",
        bg: "white",
        _hover: { bg: "whiteAlpha.900", _disabled: { bg: "white" } },
        _active: { bg: "whiteAlpha.800" },
        _focusVisible: { focusShadow: "outlineDark" },
      },
      language: {
        borderWidth: "2px",
        borderColor: "gray.200",
        color: "languageText",
        _hover: { color: "languageTextHover", bg: "gray.100" },
      },
      "secondary-disabled": {
        borderWidth: "2px",
        borderColor: "brand.500",
        color: "brand.700",
        bg: "transparent",
        opacity: "0.4",
      },
    },
  },
  defaultVariants: {
    variant: "secondary",
    size: "md",
  },
});
