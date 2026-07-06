/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
/**
 * Stable re-export of the Panda styling primitives and layout patterns, so
 * shared-ui consumers (and a future extracted library) import from one place
 * rather than reaching into the generated `styled-system` directly.
 */
export { css, cva, sva, cx } from "styled-system/css";
export { token } from "styled-system/tokens";
export type { SystemStyleObject } from "styled-system/types";
export type {
  BoxProps,
  FlexProps,
  StackProps,
  HstackProps,
  VstackProps,
  GridProps,
} from "styled-system/jsx";

// Layout patterns — the Panda-native equivalents of Chakra's Box/Flex/Stack/etc.
export {
  Box,
  Flex,
  Stack,
  HStack,
  VStack,
  Grid,
  GridItem,
  Center,
  Wrap,
  styled,
} from "styled-system/jsx";
