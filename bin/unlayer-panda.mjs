/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
// Strip Panda's CSS cascade layers from the generated stylesheet.
//
// Why: during the Chakra coexistence period, Chakra/Emotion inject *unlayered*
// styles (notably the reset `:where(*){ border-width:0; ... }`). Unlayered CSS
// always beats layered CSS regardless of specificity, so Panda's `@layer`
// recipe/utility rules lose and component borders/padding disappear. Removing
// the `@layer` wrappers makes Panda's single-class selectors (0,1,0) win over
// Chakra's zero-specificity reset. Source order is preserved (base → tokens →
// recipes → utilities), so utilities still override recipes.
//
// Remove this step (and re-enable Panda `preflight` + layers) once Chakra is
// gone. See plan: "Coexistence & kill-switch".
import { readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2] ?? "src/styled-system.css";

const unlayer = (css) => {
  // Drop the `@layer a, b, c;` ordering declarations.
  css = css.replace(/@layer[^{};]*;/g, "");
  // Unwrap `@layer name { ... }` blocks, tracking brace depth so nested rules
  // (e.g. @media inside a layer) keep their own braces.
  const openRe = /@layer[^{};]*\{/y;
  let out = "";
  const stack = [];
  let i = 0;
  while (i < css.length) {
    openRe.lastIndex = i;
    const m = openRe.exec(css);
    if (m && m.index === i) {
      stack.push("layer");
      i = openRe.lastIndex;
      continue;
    }
    const ch = css[i];
    if (ch === "{") {
      stack.push("brace");
      out += ch;
    } else if (ch === "}") {
      // Drop the closing brace of a layer block; keep all others.
      if (stack.pop() !== "layer") {
        out += ch;
      }
    } else {
      out += ch;
    }
    i++;
  }
  return out;
};

const input = readFileSync(file, "utf8");
if (input.includes("@layer")) {
  writeFileSync(file, unlayer(input));
  console.log(`unlayered ${file}`);
}
