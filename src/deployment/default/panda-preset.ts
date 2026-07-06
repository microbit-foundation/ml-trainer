/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { definePreset } from "@pandacss/dev";
import {
  blurs,
  borders,
  breakpoints,
  colors,
  durations,
  easings,
  fontSizes,
  fontWeights,
  letterSpacings,
  lineHeights,
  radii,
  shadows,
  sizes,
  spacing,
  zIndex,
} from "./chakra-tokens";
import { button, dialog, heading, menu } from "./panda-recipes";

// gray overrides from the original Chakra theme (components/../colors.ts):
// adds the very-light 10/25 stops and replaces 500/600.
const gray = {
  ...colors.gray,
  10: { value: "#fcfcfc" },
  25: { value: "#f5f5f5" },
  // Brand grey
  500: { value: "#e5e5e5" },
  // windi css text color
  600: { value: "#6b7280" },
};

// brand aliases blue; brand2 aliases Chakra's *unmodified* gray (matching the
// OSS Chakra theme, where `brand2: theme.colors.gray` references the original
// ramp — not the locally overridden `gray` whose 500 is the light brand grey).
// The private preset overrides brand/brand2 with CreateAI colours.
const brandColors = {
  ...colors,
  gray,
  brand: colors.blue,
  brand2: colors.gray,
};

export const ossPreset = definePreset({
  name: "ml-trainer-oss",
  theme: {
    breakpoints,
    tokens: {
      colors: brandColors,
      spacing,
      sizes,
      fontSizes,
      fontWeights,
      lineHeights,
      letterSpacings,
      zIndex,
      blurs,
      borders,
      durations,
      easings,
      radii: {
        ...radii,
        button: { value: "2rem" },
      },
      shadows: {
        ...shadows,
        outline: { value: "0 0 0 4px rgba(66, 153, 225, 0.6)" },
        outlineDark: { value: "0 0 0 4px rgba(0, 0, 0, 0.5)" },
        outlineLight: { value: "0 0 0 4px rgba(255, 255, 255, 0.8)" },
      },
      fonts: {
        heading: { value: "Helvetica, Arial, sans-serif" },
        body: { value: "Helvetica, Arial, sans-serif" },
        // Display font for marketing headings. OSS has no brand display face, so
        // it falls back to the body stack; the private preset overrides this
        // with GT Walsheim. Keeps the `marketing` heading variant token-driven
        // rather than requiring cross-preset recipe merges.
        display: { value: "Helvetica, Arial, sans-serif" },
        mono: {
          value:
            'SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',
        },
      },
    },
    // The `language` button variant is the one place OSS and private brands
    // diverge structurally: OSS uses the grey brand2 ramp, the CreateAI brand
    // uses its blue brand ramp with no hover-colour change. Drive it from
    // semantic tokens so the recipe stays shared and the private preset only
    // overrides these two values.
    semanticTokens: {
      colors: {
        languageText: { value: "{colors.brand2.500}" },
        languageTextHover: { value: "{colors.brand2.600}" },
      },
    },
    recipes: {
      button,
      heading,
    },
    slotRecipes: {
      dialog,
      menu,
    },
  },
  // Widen the interaction conditions so the Chakra-shaped recipe/style objects
  // (`_hover`/`_active`/`_focusVisible`/`_disabled`) also respond to
  // react-aria-components' data attributes, not just native pseudo-classes.
  conditions: {
    extend: {
      hover: "&:is(:hover, [data-hovered])",
      active: "&:is(:active, [data-pressed])",
      focusVisible: "&:is(:focus-visible, [data-focus-visible])",
      disabled:
        "&:is(:disabled, [disabled], [data-disabled], [aria-disabled=true])",
    },
  },
});

export default ossPreset;
