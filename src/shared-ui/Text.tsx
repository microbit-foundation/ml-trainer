/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { styled } from "styled-system/jsx";

/**
 * Text — a margin-reset paragraph that accepts Panda style props. Use `as` to
 * render a different element (`span`, `div`, `h2`). Replaces Chakra's <Text>.
 *
 * The margin reset is explicit because Panda's preflight is disabled during the
 * Chakra coexistence period (see panda.config.ts).
 */
export const Text = styled("p", {
  base: { margin: 0 },
});
