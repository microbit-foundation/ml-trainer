/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ButtonHTMLAttributes, forwardRef } from "react";
import { css, cx } from "styled-system/css";
import { SystemStyleObject } from "styled-system/types";
import { CloseIcon } from "./CloseIcon";

export interface CloseButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  /** Chakra CloseButton sizes: sm 24px box, md 32px (default). */
  size?: "sm" | "md";
  "aria-label": string;
  /** Per-instance style overrides, merged after the base. */
  css?: SystemStyleObject;
  className?: string;
}

/**
 * CloseButton — Chakra's standalone X button. A plain button (not react-aria)
 * so call sites can extend the hit area with pseudo-elements, which
 * react-aria's press bounding-rect check would defeat.
 */
export const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(
  function CloseButton({ size = "md", css: cssProp, className, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={cx(
          css({
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            position: "relative",
            cursor: "pointer",
            bg: "transparent",
            border: "none",
            color: "inherit",
            outline: "none",
            borderRadius: "md",
            transitionProperty: "background-color, box-shadow",
            transitionDuration: "normal",
            _hover: { bg: "blackAlpha.100" },
            _active: { bg: "blackAlpha.200" },
            _focusVisible: { boxShadow: "outline" },
          }),
          size === "sm"
            ? css({ width: "6", height: "6", fontSize: "2xs" })
            : css({ width: "8", height: "8", fontSize: "xs" }),
          cssProp ? css(cssProp) : undefined,
          className
        )}
        {...rest}
      >
        <CloseIcon />
      </button>
    );
  }
);
