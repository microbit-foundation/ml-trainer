/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { keyframes } from "@emotion/react";

export const litLedColor = "#CD0365";
export const unlitLedColor = "#dbd9dc";

export const ledPatternOptions = {
  default: [
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

export const animation = {
  fadeIn: keyframes({
    "0%": { opacity: 0 },
    "100%": { opacity: 1 },
  }),
  fadeOut: keyframes({
    "0%": { opacity: 1 },
    "100%": { opacity: 0 },
  }),
};

export const pct = (s: number, total: number) => ((s / total) * 100).toFixed(1);
