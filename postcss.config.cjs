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
 * 2. expand-logical-shorthands (below) — Safari 14.x silently drops logical
 *    *shorthands* whose value contains var(): `padding-inline: var(--spacing-2)`
 *    applies nothing, even though a literal value or `padding-inline-start:
 *    var(...)` both work. Panda emits these for its px/py/mx/my utilities, so
 *    the bug removes most spacing. Expand each into its -start/-end longhands,
 *    kept logical so RTL still flips. lightningcss does not downlevel logical
 *    properties, so this must be explicit. (Replace with
 *    @microbit/ui/postcss-legacy-safari once a version shipping it is published.)
 *
 * 3. @csstools/postcss-cascade-layers — Safari <15.4 drops @layer wholesale;
 *    flatten it into :not(#\#) specificity fallbacks.
 */

// Logical shorthands whose value is `<start> <end>` (one value applies to
// both). This app only emits padding-/margin-inline/block; the rest are here
// so the fix is robust across apps that use them. NOT included:
// border-inline/border-block — those are compound (`width style color`) and
// duplicate the whole value to each side rather than splitting, so they would
// need different handling. Add them explicitly if an app ever emits them.
const LOGICAL_SHORTHANDS = {
  "padding-inline": ["padding-inline-start", "padding-inline-end"],
  "padding-block": ["padding-block-start", "padding-block-end"],
  "margin-inline": ["margin-inline-start", "margin-inline-end"],
  "margin-block": ["margin-block-start", "margin-block-end"],
  "inset-inline": ["inset-inline-start", "inset-inline-end"],
  "inset-block": ["inset-block-start", "inset-block-end"],
  "scroll-margin-inline": [
    "scroll-margin-inline-start",
    "scroll-margin-inline-end",
  ],
  "scroll-margin-block": ["scroll-margin-block-start", "scroll-margin-block-end"],
  "scroll-padding-inline": [
    "scroll-padding-inline-start",
    "scroll-padding-inline-end",
  ],
  "scroll-padding-block": [
    "scroll-padding-block-start",
    "scroll-padding-block-end",
  ],
};

// Split a value on top-level whitespace, ignoring spaces inside parens so
// var() fallbacks stay intact. One value applies to both sides; two map to
// start then end (per the CSS shorthand rules).
const splitTopLevel = (value) => {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const ch of value) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (depth === 0 && /\s/.test(ch)) {
      if (current.trim()) parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
};

const expandLogicalShorthands = () => ({
  postcssPlugin: "expand-logical-shorthands",
  Declaration(decl) {
    const longhands = LOGICAL_SHORTHANDS[decl.prop.toLowerCase()];
    if (!longhands) return;
    const parts = splitTopLevel(decl.value);
    if (parts.length === 0) return;
    const [start, end = start] = parts;
    decl.cloneBefore({ prop: longhands[0], value: start });
    decl.cloneBefore({ prop: longhands[1], value: end });
    decl.remove();
  },
});
expandLogicalShorthands.postcss = true;

module.exports = {
  plugins: [
    require("@pandacss/dev/postcss")(),
    expandLogicalShorthands(),
    require("@csstools/postcss-cascade-layers"),
  ],
};
