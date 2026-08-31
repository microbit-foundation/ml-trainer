/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import microbit from "@microbit/eslint-config/react";

export default [
  {
    ignores: [
      // Build scripts kept in plain JS.
      "deployment.cjs",
      "bin",
      "bootstrap-template.js",
      // Native app shells and firmware.
      "android",
      "ios",
      "firmware",
      "CMakeFiles",
      "ml4f-output",
      "playwright.config.ts",
    ],
  },
  ...microbit,
  {
    // Debt to be reviewed: React-compiler-era hooks rules with existing
    // violations too involved to fix as part of lint config unification.
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
];
