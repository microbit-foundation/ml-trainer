/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { defineSlotRecipe } from "@pandacss/dev";

/**
 * Slider slot recipe — Chakra's horizontal md slider (14px thumb, 4px
 * gray.200 track, blue filled track; light mode). Consumed by the shared-ui
 * Slider, which maps the slots onto react-aria-components'
 * Slider/SliderTrack/SliderThumb.
 *
 * The `mark` slot is hidden until the slider has focus (Chakra call sites did
 * this with `_focusWithin` + a class); the reveal lives here so call sites
 * only style the mark's look.
 *
 * Registered in `src/deployment/default/panda-preset.ts`. No variants, so it
 * needs no `staticCss` entry.
 */
export const slider = defineSlotRecipe({
  className: "slider",
  slots: ["root", "track", "filledTrack", "thumb", "mark"],
  base: {
    root: {
      position: "relative",
      display: "block",
      width: "100%",
      touchAction: "none",
      // Half the thumb so it doesn't overflow the ends (Chakra container px).
      px: "calc(14px / 2)",
      "&:focus-within [data-part='mark']": {
        display: "block",
      },
      "&[data-disabled]": {
        opacity: 0.4,
        cursor: "not-allowed",
      },
    },
    track: {
      position: "relative",
      height: "4px",
      overflow: "hidden",
      borderRadius: "sm",
      bg: "gray.200",
      cursor: "pointer",
      "[data-disabled] &": {
        bg: "gray.300",
        cursor: "default",
      },
    },
    filledTrack: {
      position: "absolute",
      top: 0,
      left: 0,
      height: "100%",
      bg: "blue.500",
    },
    thumb: {
      position: "absolute",
      top: "50%",
      width: "14px",
      height: "14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      outline: "none",
      zIndex: 1,
      borderRadius: "full",
      bg: "white",
      boxShadow: "base",
      transitionProperty: "transform",
      transitionDuration: "normal",
      "&[data-dragging]": {
        transform: "translate(-50%, -50%) scale(1.15)",
      },
      transform: "translate(-50%, -50%)",
      "&[data-focus-visible]": {
        focusShadow: "outline",
      },
      "&[data-disabled]": {
        bg: "gray.300",
      },
    },
    mark: {
      display: "none",
      position: "absolute",
      whiteSpace: "nowrap",
    },
  },
});
