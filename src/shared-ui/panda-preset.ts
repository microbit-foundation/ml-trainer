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
import { button } from "./Button.recipe";
import { card } from "./Card.recipe";
import { checkbox } from "./Checkbox.recipe";
import { drawer } from "./Drawer.recipe";
import { heading } from "./Heading.recipe";
import { input } from "./Input.recipe";
import { menu } from "./Menu.recipe";
import { slider } from "./Slider.recipe";
import { switchRecipe } from "./Switch.recipe";
import { dialog } from "./Modal.recipe";
import { field } from "./TextField.recipe";
import { toast } from "./Toast.recipe";

/**
 * The shared-ui core preset: Chakra v2's design language on Panda. The exact
 * Chakra default token scales (chakra-tokens.ts snapshot), the shared-ui
 * component recipes, the react-aria condition widening, the Chakra-reset
 * parity `globalCss`, and the `staticCss` that keeps runtime-prop recipe
 * variants generated.
 *
 * Some recipe styling goes through tokens this preset does not define — the
 * brand token contract a consuming app's preset stack must supply:
 * `brand`/`brand2` ramps, `radii.button`, the `outline*` shadows, the
 * `display` font and the `languageText`/`toast*Bg`/`statusBarBg` semantic
 * tokens. In this repo the micro:bit foundation preset and the app preset
 * (src/deployment/default/) provide them.
 */
export const sharedUiPreset = definePreset({
  name: "shared-ui",
  theme: {
    breakpoints,
    keyframes: {
      // Spinner's revolution (the only keyframe a shared-ui component uses).
      spin: {
        "0%": { transform: "rotate(0deg)" },
        "100%": { transform: "rotate(360deg)" },
      },
    },
    tokens: {
      colors,
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
      radii,
      shadows,
      // Chakra v2's default font stacks (mono is consumed as-is; heading and
      // body are overridden by the foundation preset's Helvetica).
      fonts: {
        heading: {
          value:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
        },
        body: {
          value:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
        },
        mono: {
          value:
            'SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',
        },
      },
    },
    semanticTokens: {
      colors: {
        // Checked/focus states of form controls (Chakra's default blue
        // colorScheme). Checkbox/Switch checked backgrounds, Input focus
        // border, and the Slider/ProgressBar fills (the last two are
        // near-dead defaults - current call sites override them).
        controlCheckedBg: { value: "{colors.blue.500}" },
        controlCheckedHoverBg: { value: "{colors.blue.600}" },
        focusBorder: { value: "{colors.blue.500}" },
        sliderFilledTrack: { value: "{colors.blue.500}" },
        progressFilledTrack: { value: "{colors.blue.500}" },
        // Error/destructive ramp (Chakra red). Destructive button variants,
        // field error states and the error toast; the record* button
        // variants deliberately stay on red.* (recording vocabulary, not
        // danger).
        danger: {
          50: { value: "{colors.red.50}" },
          100: { value: "{colors.red.100}" },
          500: { value: "{colors.red.500}" },
          600: { value: "{colors.red.600}" },
          700: { value: "{colors.red.700}" },
        },
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
      toast,
    },
  },
  // What ChakraProvider used to inject and Panda's preflight doesn't cover:
  // the theme's styles.global (body text/background defaults, global
  // border/placeholder colours) plus the parts of Chakra's CSS reset that
  // Panda's has no equivalent for — kerning/text-rendering (their absence
  // shifts glyphs page-wide), word-wrap and touch-action. Token references
  // resolve against the merged preset stack, so the values track any brand
  // overrides exactly as they did under Chakra's runtime theme.
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
  },
  // shared-ui components forward `variant`/`size`/etc. as runtime props to
  // the recipe functions, so Panda's static analysis can't see which variants
  // are used and would emit no CSS for them. Generate every recipe variant.
  // Lives in the preset (not the consumer's panda.config.ts) so no consumer
  // can silently lose runtime-prop variants.
  staticCss: {
    recipes: {
      button: ["*"],
      heading: ["*"],
      card: ["*"],
      // Dialog size is chosen with responsive objects ({ base, md }) passed
      // as a runtime prop, so generate the breakpoint-prefixed variants too.
      dialog: [{ size: ["*"], responsive: true }, { centered: ["*"] }],
      drawer: ["*"],
      // Toast status is chosen at runtime from the toast content.
      toast: ["*"],
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
      // High-contrast/forced-palette modes (e.g. Windows High Contrast), which
      // strip author backgrounds and box-shadows.
      forcedColors: "@media (forced-colors: active)",
    },
  },
});

export default sharedUiPreset;
