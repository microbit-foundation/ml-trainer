/*
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 *
 * PostCSS runs because vite.config.ts uses Vite's default CSS transformer
 * rather than lightningcss (which disables PostCSS); lightningcss is kept only
 * as the minifier.
 *
 * Plugins, in order:
 *
 * 1. @pandacss/dev/postcss — generates Panda's CSS into the cascade-layer
 *    declaration in src/layers.css at build time (replaces the old `panda
 *    cssgen` CLI step). `panda codegen` still runs up front for the
 *    styled-system/* helpers.
 *
 * The other two make that output work on Safari <15.4 and are TEMPORARY — drop
 * them, and the safari14.1 floor in vite.config.ts, once support rises past
 * those browsers:
 *
 * 2. expandLogicalShorthands (@microbit/ui/postcss-legacy-safari) — Safari 14.x
 *    silently drops logical *shorthands* whose value contains var()
 *    (`padding-inline: var(--spacing-2)` applies nothing, though a literal value
 *    or `padding-inline-start: var(...)` both work). Panda emits these for its
 *    px/py/mx/my utilities, so the bug removes most spacing. Expands each into
 *    its -start/-end longhands, kept logical so RTL still flips.
 * 3. @csstools/postcss-cascade-layers — Safari <15.4 drops @layer wholesale;
 *    flatten it into :not(#\#) specificity fallbacks.
 */
const {
  expandLogicalShorthands,
} = require("@microbit/ui/postcss-legacy-safari");

module.exports = {
  plugins: [
    require("@pandacss/dev/postcss")(),
    expandLogicalShorthands(),
    require("@csstools/postcss-cascade-layers"),
  ],
};
