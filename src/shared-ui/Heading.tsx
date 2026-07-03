/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { styled } from "styled-system/jsx";
import { heading } from "styled-system/recipes";

/**
 * Heading — Chakra's <Heading> equivalent, backed by the `heading` config
 * recipe (so the private preset can add brand variants). Defaults to an <h2>;
 * pass `as` to change the element and `size` to pick the type scale.
 */
export const Heading = styled("h2", heading);
