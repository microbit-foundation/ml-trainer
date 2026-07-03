/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { styled } from "styled-system/jsx";

/** Unstyled list, matching Chakra's <List>. */
export const List = styled("ul", {
  base: { margin: 0, padding: 0, listStyle: "none" },
});

/** List item, matching Chakra's <ListItem>. */
export const ListItem = styled("li", {
  base: {},
});
