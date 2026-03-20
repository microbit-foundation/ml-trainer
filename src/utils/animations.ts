/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { keyframes } from "@emotion/react";

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
