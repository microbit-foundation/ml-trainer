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
 *
 * Unlabelled icons are treated as decorative and hidden from assistive tech;
 * a labelled icon gets `role="img"` (a bare svg aria-label is unreliably
 * announced without it).
 */
export const Icon = ({
  as: As,
  css: cssProp,
  className,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
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
    focusable="false"
    aria-label={ariaLabel}
    aria-hidden={ariaHidden ?? (ariaLabel ? undefined : true)}
    role={ariaLabel ? "img" : undefined}
  />
);
