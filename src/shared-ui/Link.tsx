/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { styled } from "styled-system/jsx";

/**
 * Link — anchor styled to match Chakra's <Link> base (no underline until hover,
 * focus ring on keyboard focus). Accepts Panda style props for colour etc.
 */
export const Link = styled("a", {
  base: {
    cursor: "pointer",
    textDecoration: "none",
    outline: "none",
    transitionProperty:
      "background-color, border-color, color, fill, stroke, opacity, box-shadow, transform",
    transitionDuration: "normal",
    _hover: { textDecoration: "underline" },
    _focusVisible: { focusShadow: "outline" },
  },
});
