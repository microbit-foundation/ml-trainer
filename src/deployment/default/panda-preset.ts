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
      // ── Animation-tree keyframes (HowItWorks/PairingMode/PlugMicrobit etc.).
      // Runtime-parameterised values (colours, offsets) come in via CSS custom
      // properties set as inline styles at the call site; percentages and
      // property sets are fixed.
      fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
      fadeOut: { from: { opacity: 1 }, to: { opacity: 0 } },
      // css-loaders "load7" three-dot loader (LoadingAnimation).
      load7: {
        "0%, 80%, 100%": { boxShadow: "0 2.5em 0 -1.3em" },
        "40%": { boxShadow: "0 2.5em 0 0" },
      },
      arrowMove: {
        "0%": { transform: "translateX(100%)" },
        "100%": { transform: "translateX(-100%)" },
      },
      // Shared by Arrow's stars and MicrobitOnWrist's background icons.
      sparkle: {
        "0%, 100%": { transform: "scale(0.8)", opacity: 0 },
        "50%": { transform: "scale(1)", opacity: 1 },
      },
      codeBlockBase: {
        "0%": { left: "100%", top: "80%", transform: "rotate(-30deg)" },
        "100%": { left: "10%", top: "17%", transform: "rotate(0deg)" },
      },
      codeBlockSm: {
        "0%": { left: "100%", top: "80%", transform: "rotate(-30deg)" },
        "100%": { left: "8%", top: "13%", transform: "rotate(0deg)" },
      },
      wristWave: {
        "0%": { transform: "rotate(12deg)" },
        "25%": { transform: "rotate(-10deg)" },
        "50%": { transform: "rotate(10deg)" },
        "75%": { transform: "rotate(-7deg)" },
        "100%": { transform: "rotate(12deg)" },
      },
      wristBob: {
        "0%": { transform: "translateY(0px)" },
        "25%": { transform: "translateY(-20px)" },
        "50%": { transform: "translateY(0px)" },
        "75%": { transform: "translateY(-20px)" },
        "100%": { transform: "translateY(0px)" },
      },
      trainingProgress: {
        "0%": { width: "10%" },
        "90%": { width: "100%" },
        "100%": { width: "100%" },
      },
      // Gauge segments: colours via --gauge-empty/--gauge-filled/
      // --gauge-filled-dark; one keyframe per segment timing profile.
      gaugeSegment1: {
        "0%": { background: "var(--gauge-empty)" },
        "6.8%": { background: "var(--gauge-filled)" },
        "71.2%": { background: "var(--gauge-filled)" },
        "75%": { background: "var(--gauge-filled-dark)" },
        "100%": { background: "var(--gauge-filled-dark)" },
      },
      gaugeSegment2: {
        "0%": { background: "var(--gauge-empty)" },
        "15.6%": { background: "var(--gauge-empty)" },
        "22.4%": { background: "var(--gauge-filled)" },
        "71.2%": { background: "var(--gauge-filled)" },
        "75%": { background: "var(--gauge-filled-dark)" },
        "100%": { background: "var(--gauge-filled-dark)" },
      },
      gaugeSegment3: {
        "0%": { background: "var(--gauge-empty)" },
        "24.4%": { background: "var(--gauge-empty)" },
        "31.2%": { background: "var(--gauge-filled)" },
        "71.2%": { background: "var(--gauge-filled)" },
        "75%": { background: "var(--gauge-filled-dark)" },
        "100%": { background: "var(--gauge-filled-dark)" },
      },
      gaugeSegment4: {
        "0%": { background: "var(--gauge-empty)" },
        "33.2%": { background: "var(--gauge-empty)" },
        "42.4%": { background: "var(--gauge-filled)" },
        "51.2%": { background: "var(--gauge-empty)" },
        "60%": { background: "var(--gauge-filled)" },
        "71.2%": { background: "var(--gauge-filled)" },
        "75%": { background: "var(--gauge-filled-dark)" },
        "100%": { background: "var(--gauge-filled-dark)" },
      },
      gaugeSegment5: {
        "0%": { background: "var(--gauge-empty)" },
        "75%": { background: "var(--gauge-empty)" },
        "76%": { background: "var(--gauge-filled-dark)" },
        "100%": { background: "var(--gauge-filled-dark)" },
      },
      gaugeSegment6: {
        "0%": { background: "var(--gauge-empty)" },
        "90%": { background: "var(--gauge-empty)" },
        "100%": { background: "var(--gauge-filled-dark)" },
      },
      gaugeSegment7: {
        "0%": { background: "var(--gauge-empty)" },
        "100%": { background: "var(--gauge-empty)" },
      },
      gaugeIconColor: {
        "0%": { color: "var(--gauge-icon-from)" },
        "74%": { color: "var(--gauge-icon-from)" },
        "75%": { color: "var(--gauge-icon-to)" },
        "100%": { color: "var(--gauge-icon-to)" },
      },
      signalEnter: {
        "0%": { opacity: 0, transform: "translate(0, 20px)" },
        "100%": { opacity: 1, transform: "translate(0, 0)" },
      },
      // Travel offset via --signal-travel-offset (a px length).
      signalTravel: {
        "0%": {
          transform: "translateX(calc(var(--signal-travel-offset) * -1))",
        },
        "38.46%": { transform: "translateX(var(--signal-travel-offset))" },
        "76.92%": {
          transform: "translateX(calc(var(--signal-travel-offset) * -1))",
        },
        "100%": { transform: "translateX(0px)" },
      },
      signalSettle: {
        "0%": { opacity: "var(--signal-travel-opacity)" },
        "100%": { opacity: "var(--signal-settled-opacity)" },
      },
      // Scrolls one 177px wave tile; window width via --wave-window.
      waveScroll: {
        from: { transform: "translateX(calc(var(--wave-window) - 177px))" },
        to: { transform: "translateX(0)" },
      },
      plugIn: {
        "0%": { transform: "translate(-52%, -35%)" },
        "25%, 100%": { transform: "translate(-52%, 25%)" },
      },
      plugGlowOn: {
        "0%, 30%": { opacity: 0 },
        "40%, 100%": { opacity: 1 },
      },
      unplug: {
        "0%, 10%": { transform: "translate(-52%, 25%)" },
        "50%, 100%": { transform: "translate(-52%, -35%)" },
      },
      plugGlowOff: {
        "0%, 8%": { opacity: 1 },
        "10%, 100%": { opacity: 0 },
      },
      handMoveIn: {
        "0%": { right: "-50%", top: "25%", opacity: 0 },
        "10%": { opacity: 1 },
        "100%": { right: "-17.5%", top: "5%", opacity: 1 },
      },
      handPressDown: {
        from: { right: "-17.5%", top: "5%" },
        to: { right: "-15%", top: "5%" },
      },
      handPressUp: {
        from: { right: "-15%", top: "5%" },
        to: { right: "-17.5%", top: "5%" },
      },
      textBoxFillUp: {
        "75%": { backgroundSize: "100% 0%" },
        "100%": { backgroundSize: "100% 100%" },
      },
      lineScaleUp: {
        "0%": { transform: "scaleY(0)" },
        "75%": { transform: "scaleY(1.02)" },
        "100%": { transform: "scaleY(1.02)" },
      },
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
  // What ChakraProvider used to inject and Panda's preflight doesn't cover:
  // the theme's styles.global (body text/background defaults, global
  // border/placeholder colours) plus the parts of Chakra's CSS reset that
  // Panda's has no equivalent for — kerning/text-rendering (their absence
  // shifts glyphs page-wide), word-wrap and touch-action. Token references
  // resolve against this preset, so the values track any brand overrides
  // exactly as they did under Chakra's runtime theme.
  globalCss: {
    html: {
      textRendering: "optimizeLegibility",
      touchAction: "manipulation",
    },
    body: {
      position: "relative",
      minHeight: "100%",
      fontFeatureSettings: '"kern"',
      fontFamily: "body",
      color: "gray.800",
      bg: "white",
      transitionProperty: "background-color",
      transitionDuration: "normal",
      lineHeight: "base",
    },
    "*::placeholder": {
      color: "gray.500",
    },
    "*, *::before, *::after": {
      borderColor: "gray.200",
      wordWrap: "break-word",
    },
    // Panda's preflight, unlike Chakra's reset, doesn't set the pointer
    // cursor on buttons. Recipes' disabled states (cursor: not-allowed)
    // override this from the higher recipes layer.
    "button, [role='button']": {
      cursor: "pointer",
    },
    // Panda's preflight balance-wraps headings; Chakra didn't, and balanced
    // multi-line headings break at different points (mobile/translations).
    "h1, h2, h3, h4, h5, h6": {
      textWrap: "wrap",
    },
    // Panda's preflight styles ::selection; Chakra's reset didn't. Restore
    // the browser's native highlight painting.
    "::selection": {
      backgroundColor: "revert",
    },
  },
  utilities: {
    extend: {
      // The app-wide focus indicator, usually inside `_focusVisible`. Values
      // are the outline* shadow token names. The transparent outline is for
      // forced-colors modes, which strip box-shadows but recolour outlines to
      // a visible system colour. (Named to avoid preset-base's outline-based
      // `focusRing` utility, whose values would break this transform.)
      focusShadow: {
        className: "focus-shadow",
        values: ["outline", "outlineDark", "outlineLight"],
        transform: (value: string, { token }) => ({
          outline: "2px solid transparent",
          outlineOffset: "2px",
          boxShadow: token(`shadows.${value}`),
        }),
      },
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
