/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { definePreset } from "@pandacss/dev";

/**
 * The ml-trainer app preset: this app's own styling decisions, merged after
 * the shared-ui core preset and the micro:bit foundation preset (see
 * panda.config.ts). Holds the app's animation keyframes, its gray tweaks,
 * the `shortHeight` condition and its button vocabulary; private brand
 * presets merge after this and override ramps/fonts only.
 */
export const appPreset = definePreset({
  name: "ml-trainer",
  theme: {
    extend: {
      // Ported from the Emotion keyframes in components/Emoji.tsx; reference
      // as e.g. `animation: "tada 1s ease-in-out"`. (`spin` lives in the
      // shared-ui core preset - Spinner uses it.)
      keyframes: {
        // ── Animation-tree keyframes (HowItWorks/PairingMode/PlugMicrobit
        // etc.). Runtime-parameterised values (colours, offsets) come in via
        // CSS custom properties set as inline styles at the call site;
        // percentages and property sets are fixed.
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
        colors: {
          // gray overrides from the original Chakra theme
          // (components/../colors.ts): replaces 500/600 (the 10/25 stops are
          // foundation-wide, see microbit-preset.ts).
          gray: {
            // Brand grey
            500: { value: "#e5e5e5" },
            // windi css text color
            600: { value: "#6b7280" },
          },
        },
      },
      // This app's button vocabulary, merged into the core `button` recipe.
      recipes: {
        button: {
          variants: {
            variant: {
              led: {
                borderWidth: "2px",
                borderRadius: "5px",
                borderColor: "brand2.500",
                color: "brand2.700",
                bg: "transparent",
                _hover: { cursor: "pointer", borderColor: "brand2.500" },
                _active: { bg: "brand2.500", borderColor: "brand2.500" },
              },
              recordOutline: {
                borderWidth: "1px",
                borderColor: "red.500",
                color: "red.500",
                bg: "transparent",
                _hover: { bg: "red.50" },
                _active: {
                  borderColor: "red.600",
                  color: "red.600",
                  bg: "red.100",
                },
              },
              record: {
                color: "white",
                bg: "red.500",
                _hover: { bg: "red.600", _disabled: { bg: "red.500" } },
                _active: { bg: "red.700" },
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
        },
      },
    },
  },
  conditions: {
    extend: {
      // Short screens (e.g. 1366x768 Chromebooks); reduces card heights and
      // spacing on the homepage. Replaces src/responsive.ts's
      // shortScreenHeightBreakpoint, which Panda's extractor couldn't resolve
      // across files.
      shortHeight: "@media (max-height: 800px)",
    },
  },
});

export default appPreset;
