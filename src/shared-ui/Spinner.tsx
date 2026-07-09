/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { css, cx } from "styled-system/css";
import { SystemStyleObject } from "styled-system/types";

export interface SpinnerProps {
  /** Chakra Spinner sizes: sm 1rem, md 1.5rem (default). */
  size?: "sm" | "md";
  /** Per-instance style overrides, merged after the base. */
  css?: SystemStyleObject;
  className?: string;
  "aria-label"?: string;
}

/**
 * Spinner — Chakra's border-based spinner (currentColor with transparent
 * bottom/left quadrants).
 */
export const Spinner = ({
  size = "md",
  css: cssProp,
  className,
  "aria-label": ariaLabel,
}: SpinnerProps) => (
  <span
    aria-label={ariaLabel}
    aria-hidden={ariaLabel ? undefined : true}
    className={cx(
      // Single css() call so caller overrides of base properties (e.g. width)
      // are deduped at merge time rather than racing on stylesheet order.
      css(
        {
          display: "inline-block",
          borderWidth: "2px",
          borderStyle: "solid",
          borderColor: "currentColor",
          borderBottomColor: "transparent",
          borderLeftColor: "transparent",
          borderRadius: "full",
          animation: "spin 0.45s linear infinite",
          "@media (prefers-reduced-motion: reduce)": {
            animationDuration: "1.5s",
          },
          width: size === "sm" ? "1rem" : "1.5rem",
          height: size === "sm" ? "1rem" : "1.5rem",
        },
        cssProp
      ),
      className
    )}
  />
);
