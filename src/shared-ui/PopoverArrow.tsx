/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { OverlayArrow } from "react-aria-components";
import { css, cx } from "styled-system/css";
import { SystemStyleObject } from "styled-system/types";

// react-aria positions the arrow and stamps the resolved side on the wrapper
// as data-placement, but leaves orienting the glyph to us. The svg is square
// with the triangle in the half nearest the overlay (tip at centre), so
// rotating about the centre keeps it flush against the overlay on every side
// — no translate fix-ups, whose signs depend on rotation direction and are
// easy to get wrong (they detached the tooltip arrow from its box).
const arrowBase = css({
  "& svg": { display: "block" },
  "&[data-placement='bottom'] svg": { transform: "rotate(180deg)" },
  "&[data-placement='right'] svg": { transform: "rotate(90deg)" },
  "&[data-placement='left'] svg": { transform: "rotate(-90deg)" },
});

export interface PopoverArrowProps {
  /**
   * Base width of the visible triangle in px; it protrudes half this into
   * the gap. Defaults to Chakra's tooltip arrow proportions (an 8px square
   * rotated 45°).
   */
  size?: number;
  /** Styles merged after the base, e.g. `{ "& svg": { fill: "white" } }`. */
  css?: SystemStyleObject;
  className?: string;
}

/**
 * PopoverArrow — the notch pointing from a popover or tooltip at its
 * trigger, oriented automatically for react-aria's resolved placement.
 * Render inside a RAC Popover/Tooltip; set the fill via the css prop.
 */
export const PopoverArrow = ({
  size = 11.314,
  css: cssProp,
  className,
}: PopoverArrowProps) => (
  <OverlayArrow
    className={cx(arrowBase, cssProp ? css(cssProp) : undefined, className)}
  >
    <svg width={size} height={size} viewBox="0 0 12 12">
      <path d="M0 0 L6 6 L12 0" />
    </svg>
  </OverlayArrow>
);
