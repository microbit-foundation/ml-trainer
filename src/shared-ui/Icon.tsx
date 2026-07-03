/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { IconType } from "react-icons/lib";
import { css, cx } from "styled-system/css";
import { SystemStyleObject } from "styled-system/types";

export interface IconProps {
  /** The react-icons component to render. */
  as: IconType;
  /** Panda style overrides (size via fontSize/boxSize, colour, etc.). */
  css?: SystemStyleObject;
  className?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean;
}

/**
 * Icon — renders a react-icons glyph inline at `1em`, matching Chakra's <Icon>
 * base styles. `fill: currentColor` means the glyph follows the surrounding
 * text colour (set `css={{ color: ... }}` to override), so it inherits colour
 * like Chakra's icons rather than defaulting to black.
 */
export const Icon = ({
  as: As,
  css: cssProp,
  className,
  ...aria
}: IconProps) => (
  <As
    className={cx(
      css({
        width: "1em",
        height: "1em",
        display: "inline-block",
        lineHeight: "1em",
        flexShrink: 0,
        fill: "currentColor",
        ...cssProp,
      }),
      className
    )}
    {...aria}
  />
);
