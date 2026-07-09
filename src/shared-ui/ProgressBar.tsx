/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ProgressBar as RACProgressBar } from "react-aria-components";
import { css } from "styled-system/css";
import { SystemStyleObject } from "styled-system/types";

export interface ProgressBarProps {
  /** 0–100. */
  value: number;
  "aria-label": string;
  /** Track overrides (size, radius, width), merged after the base. */
  css?: SystemStyleObject;
  /** Fill overrides (colour), merged after the base. */
  barCss?: SystemStyleObject;
}

/**
 * ProgressBar — react-aria-components <ProgressBar> styled like Chakra's md
 * Progress (12px gray.100 track). Set the fill colour per call site via
 * `barCss` (Chakra's colorScheme).
 */
export const ProgressBar = ({
  value,
  "aria-label": ariaLabel,
  css: cssProp,
  barCss,
}: ProgressBarProps) => (
  <RACProgressBar
    value={value}
    aria-label={ariaLabel}
    // Single css() calls so caller overrides of base properties (radius, fill
    // colour) are deduped at merge time rather than racing on stylesheet order.
    className={css(
      {
        width: "100%",
        height: 3,
        bg: "gray.100",
        overflow: "hidden",
        borderRadius: "sm",
      },
      cssProp
    )}
  >
    {({ percentage }) => (
      <div
        className={css(
          { height: "100%", bg: "blue.500", transition: "width 0.2s" },
          barCss
        )}
        style={{ width: `${percentage ?? 0}%` }}
      />
    )}
  </RACProgressBar>
);
