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

/** Bulleted list matching Chakra's <UnorderedList>. */
export const UnorderedList = styled("ul", {
  base: { listStyleType: "disc", marginStart: "1em", padding: 0 },
});

/** Numbered list matching Chakra's <OrderedList>. */
export const OrderedList = styled("ol", {
  base: { listStyleType: "decimal", marginStart: "1em", padding: 0 },
});
