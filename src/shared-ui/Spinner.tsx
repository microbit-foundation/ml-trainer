/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { CSSProperties } from "react";
import { css, cx } from "styled-system/css";
import { SystemStyleObject } from "styled-system/types";

export interface SpinnerProps {
  /** Chakra Spinner sizes: sm 1rem, md 1.5rem (default). */
  size?: "sm" | "md";
  /**
   * Revolution time (Chakra's `speed`, default 0.45s). Under
   * prefers-reduced-motion the spin is slowed to ~3x this value.
   */
  speed?: string;
  /** Per-instance style overrides, merged after the base. */
  css?: SystemStyleObject;
  className?: string;
  /**
   * Accessible name. Required: Chakra's Spinner announced a visually hidden
   * "Loading..." by default, so a nameless spinner would regress on it.
   */
  "aria-label": string;
}

/**
 * Spinner — Chakra's border-based spinner (currentColor with transparent
 * bottom/left quadrants).
 */
export const Spinner = ({
  size = "md",
  speed,
  css: cssProp,
  className,
  "aria-label": ariaLabel,
}: SpinnerProps) => (
  <span
    role="status"
    aria-label={ariaLabel}
    style={speed ? ({ "--spinner-speed": speed } as CSSProperties) : undefined}
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
          // The duration rides a variable so the reduced-motion slow-down
          // scales with a per-instance `speed` rather than fighting it.
          animation: "spin var(--spinner-speed, 0.45s) linear infinite",
          "@media (prefers-reduced-motion: reduce)": {
            animationDuration: "calc(var(--spinner-speed, 0.45s) * 3.33)",
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
