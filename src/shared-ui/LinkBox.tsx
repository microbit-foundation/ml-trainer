/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { styled } from "styled-system/jsx";

/**
 * LinkBox — makes a whole box clickable via a nested LinkOverlay (or any
 * element with an inset `_before` overlay). Other interactive children must
 * be raised with `zIndex: 1`. Replaces Chakra's <LinkBox>.
 */
export const LinkBox = styled("div", {
  base: { position: "relative" },
});

/**
 * LinkOverlay — an anchor whose `::before` stretches over the nearest
 * LinkBox, making the whole box its hit area. For button-driven overlays,
 * apply the same `_before` inset style to a Button instead.
 */
export const LinkOverlay = styled("a", {
  base: {
    position: "static",
    _before: {
      content: '""',
      cursor: "inherit",
      display: "block",
      position: "absolute",
      top: 0,
      left: 0,
      zIndex: 0,
      width: "100%",
      height: "100%",
    },
  },
});
