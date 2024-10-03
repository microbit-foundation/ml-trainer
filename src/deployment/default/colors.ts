/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { theme } from "@chakra-ui/theme";

const gray = {
  10: "#fcfcfc",
  25: "#f5f5f5",
  ...theme.colors.gray,
  // Brand grey
  500: "#e5e5e5",
  // windi css text color
  600: "#6b7280",
};

const colors = {
  ...theme.colors,
  gray,
  brand: theme.colors.blue,
  brand2: theme.colors.gray,
};

export default colors;
