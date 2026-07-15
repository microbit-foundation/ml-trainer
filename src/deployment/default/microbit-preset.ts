/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { definePreset } from "@pandacss/dev";
import { colors } from "../../shared-ui/chakra-tokens";

/**
 * The micro:bit foundation preset: the styling vocabulary the censuses found
 * across all four sibling apps (ml-trainer, python-editor-v3,
 * data-microbit-org, classroom) rather than one app's choices — pill button
 * radius, the `outline*` focus shadows, Helvetica with a `display` marketing
 * font slot, the `language`/`toolbar` button variants, the toast status
 * colours and the status-bar background. Merged after the shared-ui core
 * preset; private brand presets override the ramps and `display` font.
 *
 * OSS placeholder brand values: `brand` aliases Chakra blue and `brand2`
 * Chakra's *unmodified* gray (not the app-overridden `gray` whose 500 is the
 * light brand grey — getting this wrong once made card text near-invisible).
 */
export const microbitPreset = definePreset({
  name: "microbit-foundation",
  theme: {
    extend: {
      tokens: {
        colors: {
          brand: colors.blue,
          brand2: colors.gray,
          // Very light gray stops the family's designs use below Chakra's 50.
          gray: {
            10: { value: "#fcfcfc" },
            25: { value: "#f5f5f5" },
          },
        },
        radii: {
          button: { value: "2rem" },
        },
        shadows: {
          // Chakra's outline shadow widened to 4px, plus dark/light-surface
          // companions. Consumed via the `focusShadow` utility.
          outline: { value: "0 0 0 4px rgba(66, 153, 225, 0.6)" },
          outlineDark: { value: "0 0 0 4px rgba(0, 0, 0, 0.5)" },
          outlineLight: { value: "0 0 0 4px rgba(255, 255, 255, 0.8)" },
        },
        fonts: {
          heading: { value: "Helvetica, Arial, sans-serif" },
          body: { value: "Helvetica, Arial, sans-serif" },
          // Display font for marketing headings. OSS has no brand display
          // face, so it falls back to the body stack; private presets
          // override this (e.g. GT Walsheim). Keeps the `marketing` heading
          // variant token-driven rather than requiring cross-preset recipe
          // merges.
          display: { value: "Helvetica, Arial, sans-serif" },
        },
      },
      semanticTokens: {
        colors: {
          // The `language` button variant is the one place OSS and private
          // brands diverge structurally: OSS uses the grey brand2 ramp, the
          // CreateAI brand its blue brand ramp with no hover-colour change.
          // Driven by semantic tokens so the recipe stays shared and the
          // private preset only overrides these two values.
          languageText: { value: "{colors.brand2.500}" },
          languageTextHover: { value: "{colors.brand2.600}" },
          // Toast status colours: the Chakra-era toast Alert restyle (teal
          // for every status except error) shared across the app family.
          toastInfoBg: { value: "{colors.teal.800}" },
          toastSuccessBg: { value: "{colors.teal.800}" },
          toastWarningBg: { value: "{colors.teal.800}" },
          toastErrorBg: { value: "{colors.danger.600}" },
          // The native app's status-bar area colour, shared by the ActionBar
          // and the full-size dialog's safe-area gradient.
          statusBarBg: { value: "{colors.brand2.500}" },
        },
      },
      // Family-wide button variants, merged into the core `button` recipe
      // (every censused app has language and toolbar-class buttons).
      recipes: {
        button: {
          variants: {
            variant: {
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
            },
          },
        },
      },
    },
  },
});

export default microbitPreset;
