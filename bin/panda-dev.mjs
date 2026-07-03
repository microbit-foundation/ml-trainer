/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
// Dev watcher for Panda during the Chakra coexistence period.
//
// Runs `panda --watch` (regenerating styled-system + src/styled-system.css on
// source changes) and, whenever the generated CSS is rewritten with `@layer`
// wrappers, strips them via bin/unlayer-panda.mjs. The `@layer` guard means our
// own rewrite doesn't retrigger processing. See bin/unlayer-panda.mjs for why.
import { spawn } from "node:child_process";
import { readFileSync, watch } from "node:fs";
import { fileURLToPath } from "node:url";

const cssFile = "src/styled-system.css";

const panda = spawn(
  "panda",
  ["--watch", "--outfile", cssFile],
  { stdio: "inherit", shell: true }
);

const unlayerScript = fileURLToPath(
  new URL("./unlayer-panda.mjs", import.meta.url)
);

// Debounce: Panda may write the file in bursts.
let timer;
const maybeUnlayer = () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    let css;
    try {
      css = readFileSync(cssFile, "utf8");
    } catch {
      return;
    }
    if (css.includes("@layer")) {
      spawn(process.execPath, [unlayerScript, cssFile], { stdio: "inherit" });
    }
  }, 100);
};

try {
  watch(cssFile, maybeUnlayer);
} catch {
  // File may not exist yet on first run; Panda creates it and the watch below
  // (retried once) picks it up.
  setTimeout(() => {
    try {
      watch(cssFile, maybeUnlayer);
    } catch {
      /* ignore */
    }
  }, 2000);
}

const shutdown = () => {
  panda.kill();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
