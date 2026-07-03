/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { css, cx } from "styled-system/css";
import { SystemStyleObject } from "styled-system/types";

export interface CloseIconProps {
  css?: SystemStyleObject;
  className?: string;
}

/**
 * CloseIcon — the "✕" glyph used on close buttons (dialogs, toasts). This is
 * Chakra's exact CloseButton path so the visual matches; sized to `1em` and
 * `fill: currentColor` like the other icons. Reused wherever a close control
 * is needed.
 */
export const CloseIcon = ({ css: cssProp, className }: CloseIconProps) => (
  <svg
    viewBox="0 0 24 24"
    focusable="false"
    aria-hidden="true"
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
  >
    <path d="M.439,21.44a1.5,1.5,0,0,0,2.122,2.121L11.823,14.3a.25.25,0,0,1,.354,0l9.262,9.263a1.5,1.5,0,1,0,2.122-2.121L14.3,12.177a.25.25,0,0,1,0-.354l9.263-9.262A1.5,1.5,0,0,0,21.439.44L12.177,9.7a.25.25,0,0,1-.354,0L2.561.44A1.5,1.5,0,0,0,.439,2.561L9.7,11.823a.25.25,0,0,1,0,.354Z" />
  </svg>
);
