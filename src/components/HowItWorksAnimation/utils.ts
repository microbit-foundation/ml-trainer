/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { keyframes } from "@emotion/react";

export const litLedColor = "#CD0365";
export const unlitLedColor = "#dbd9dc";

export type LedPattern = "none" | "smile" | "heart" | "cross";

export const ledPatterns: Record<LedPattern, Array<0 | 1>> = {
  none: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  smile: [
    0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0,
  ],
  heart: [
    0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0,
  ],
  cross: [
    1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1,
  ],
};

export const animations = {
  fadeIn: keyframes({
    from: { opacity: 0 },
    to: { opacity: 1 },
  }),
  fadeOut: keyframes({
    from: { opacity: 1 },
    to: { opacity: 0 },
  }),
};

export const pct = (s: number, total: number) => ((s / total) * 100).toFixed(1);
