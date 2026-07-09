/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { styled } from "styled-system/jsx";

/**
 * InputGroup — relative wrapper for an Input with addon elements. Pad the
 * input (`pl`/`pr`) to make room for the elements. Replaces Chakra's
 * InputGroup.
 */
export const InputGroup = styled("div", {
  base: { position: "relative", width: "100%", display: "flex" },
});

// The element styles are written out twice rather than shared via a spread:
// Panda's extractor only reliably evaluates inline literals.

/** Element overlaying the start of an InputGroup (Chakra InputLeftElement). */
export const InputLeftElement = styled("div", {
  base: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "10",
    height: "10",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
});

/** Element overlaying the end of an InputGroup (Chakra InputRightElement). */
export const InputRightElement = styled("div", {
  base: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "10",
    height: "10",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
});
