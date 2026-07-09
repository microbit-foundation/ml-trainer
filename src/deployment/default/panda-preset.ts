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
// Config recipes are colocated with the shared-ui components they style; this
// preset registers them so Panda merges them at codegen time.
import { button } from "../../shared-ui/Button.recipe";
import { card } from "../../shared-ui/Card.recipe";
import { checkbox } from "../../shared-ui/Checkbox.recipe";
import { drawer } from "../../shared-ui/Drawer.recipe";
import { heading } from "../../shared-ui/Heading.recipe";
import { input } from "../../shared-ui/Input.recipe";
import { menu } from "../../shared-ui/Menu.recipe";
import { slider } from "../../shared-ui/Slider.recipe";
import { switchRecipe } from "../../shared-ui/Switch.recipe";
import { dialog } from "../../shared-ui/Modal.recipe";
import { field } from "../../shared-ui/TextField.recipe";

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
    // Ported from the Emotion keyframes in components/Emoji.tsx; reference as
    // e.g. `animation: "tada 1s ease-in-out"`.
    keyframes: {
      tada: {
        "0%": { transform: "scale(1) rotate(0deg)" },
        "10%, 20%": { transform: "scale(0.95) rotate(-3deg)" },
        "30%, 50%, 70%, 90%": { transform: "scale(1.1) rotate(3deg)" },
        "40%, 60%, 80%": { transform: "scale(1.1) rotate(-3deg)" },
        "100%": { transform: "scale(1) rotate(0deg)" },
      },
      spin3d: {
        "0%": { transform: "rotate3d(0, 1, 0, 0deg)" },
        "100%": { transform: "rotate3d(0, 1, 0, 360deg)" },
      },
      spin: {
        "0%": { transform: "rotate(0deg)" },
        "100%": { transform: "rotate(360deg)" },
      },
      // Loading line placeholder (CodeViewCard).
      skeletonPulse: {
        "0%": { opacity: 1 },
        "100%": { opacity: 0.4 },
      },
      // Highlight for a freshly added recording (ActionDataSamplesCard).
      recordingFlash: {
        "0%, 10%": { backgroundColor: "#4040ff44" },
        "100%": {},
      },
      // LED pixel toggle pop (LedIcon).
      ledTurnOn: {
        "0%": { transform: "scale(1)" },
        "50%": { transform: "scale(1.15)" },
        "100%": { transform: "scale(1)" },
      },
      ledTurnOff: {
        "0%": { transform: "scale(1)" },
        "50%": { transform: "scale(0.8)" },
        "100%": { transform: "scale(1)" },
      },
      // Data samples "move your micro:bit" hint: 4 × (2s wobble + 5s pause)
      // over a 28s duration (moveMicrobitHintTimeoutInSec).
      microbitWobble: {
        "0%": { transform: "rotate(0deg)" },
        "1.79%": { transform: "rotate(22deg)" },
        "3.57%": { transform: "rotate(-18deg)" },
        "5.36%": { transform: "rotate(14deg)" },
        "7.14%": { transform: "rotate(-10deg)" },
        "8.93%": { transform: "rotate(0deg)" },
        "26.79%": { transform: "rotate(0deg)" },
        "28.57%": { transform: "rotate(22deg)" },
        "30.36%": { transform: "rotate(-18deg)" },
        "32.14%": { transform: "rotate(14deg)" },
        "33.93%": { transform: "rotate(-10deg)" },
        "35.71%": { transform: "rotate(0deg)" },
        "53.57%": { transform: "rotate(0deg)" },
        "55.36%": { transform: "rotate(22deg)" },
        "57.14%": { transform: "rotate(-18deg)" },
        "58.93%": { transform: "rotate(14deg)" },
        "60.71%": { transform: "rotate(-10deg)" },
        "62.5%": { transform: "rotate(0deg)" },
        "80.36%": { transform: "rotate(0deg)" },
        "82.14%": { transform: "rotate(22deg)" },
        "83.93%": { transform: "rotate(-18deg)" },
        "85.71%": { transform: "rotate(14deg)" },
        "87.5%": { transform: "rotate(-10deg)" },
        "89.29%": { transform: "rotate(0deg)" },
        "100%": { transform: "rotate(0deg)" },
      },
    },
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
      input,
    },
    slotRecipes: {
      card,
      checkbox,
      dialog,
      drawer,
      field,
      menu,
      slider,
      switchRecipe,
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
      // Short screens (e.g. 1366x768 Chromebooks); reduces card heights and
      // spacing on the homepage. Replaces src/responsive.ts's
      // shortScreenHeightBreakpoint, which Panda's extractor couldn't resolve
      // across files.
      shortHeight: "@media (max-height: 800px)",
    },
  },
});

export default ossPreset;
