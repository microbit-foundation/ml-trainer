/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ReactElement, ReactNode } from "react";
import {
  OverlayArrow,
  Tooltip as RACTooltip,
  TooltipTrigger,
} from "react-aria-components";
import { css } from "styled-system/css";
import { SystemStyleObject } from "styled-system/types";

// Base as an object (not a precomputed class) so a caller's `css` override is
// merged into a single css() call — Panda then dedupes conflicting utilities
// (e.g. px/py) so overrides actually win.
const tooltipBase: SystemStyleObject = {
  bg: "gray.700",
  color: "white",
  px: "2",
  py: "1",
  borderRadius: "md",
  fontSize: "sm",
  fontWeight: "medium",
  boxShadow: "md",
  maxW: "xs",
  zIndex: "tooltip",
};

// RAC positions the arrow but leaves orienting the glyph to us; it stamps the
// resolved side on the wrapper as data-placement. The svg is square with the
// triangle in the half nearest the tooltip (tip at centre), so rotating about
// the centre keeps it abutting the box on every side — no translation needed.
const arrowStyle = css({
  "& svg": { display: "block", fill: "gray.700" },
  "&[data-placement='bottom'] svg": { transform: "rotate(180deg)" },
  "&[data-placement='right'] svg": { transform: "rotate(90deg)" },
  "&[data-placement='left'] svg": { transform: "rotate(-90deg)" },
});

export interface TooltipProps {
  /** Tooltip body. */
  content: ReactNode;
  /** A single focusable trigger element (e.g. a Button). */
  children: ReactElement;
  placement?:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top start"
    | "top end"
    | "bottom start"
    | "bottom end"
    | "left top"
    | "left bottom"
    | "right top"
    | "right bottom";
  hasArrow?: boolean;
  /** Controlled open state (otherwise hover/focus driven). */
  isOpen?: boolean;
  /** Hover open delay in ms (RAC default ~1500; pass 0 for instant). */
  delay?: number;
  css?: SystemStyleObject;
}

/**
 * Tooltip — react-aria-components TooltipTrigger + Tooltip, styled to match
 * Chakra's dark tooltip. The child must be a focusable element so the tooltip
 * is reachable by keyboard (RAC requirement).
 */
export const Tooltip = ({
  content,
  children,
  placement = "top",
  hasArrow,
  isOpen,
  delay = 0,
  css: cssProp,
}: TooltipProps) => (
  <TooltipTrigger isOpen={isOpen} delay={delay} closeDelay={0}>
    {children}
    <RACTooltip
      placement={placement}
      offset={hasArrow ? 8 : 4}
      className={css({ ...tooltipBase, ...cssProp })}
    >
      {hasArrow && (
        <OverlayArrow className={arrowStyle}>
          {/* Chakra's arrow is an 8px square rotated 45°: a ~11.3 x 5.7
              triangle. Drawn in the top half of a square viewBox (see
              arrowStyle). */}
          <svg width={11.314} height={11.314} viewBox="0 0 12 12">
            <path d="M0 0 L6 6 L12 0" />
          </svg>
        </OverlayArrow>
      )}
      {content}
    </RACTooltip>
  </TooltipTrigger>
);
