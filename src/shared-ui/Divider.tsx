/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { styled } from "styled-system/jsx";

/**
 * Divider — a horizontal rule matching Chakra's <Divider> (hairline at 60%
 * opacity; set `borderColor` to tint). Horizontal only.
 */
export const Divider = styled("hr", {
  base: {
    border: 0,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderColor: "gray.200",
    opacity: 0.6,
    width: "100%",
    margin: 0,
  },
});
