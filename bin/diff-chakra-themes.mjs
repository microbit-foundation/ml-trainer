/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
// Brand-diff audit (RAC-MIGRATION.md "Remaining work" #1).
//
// Diffs the *resolved* OSS and private (CreateAI) Chakra themes — source text
// is quote-style noise — then cross-checks that the Panda preset pair encodes
// the same delta, i.e. (private-chakra − oss-chakra) == (private-panda −
// oss-panda) for every divergent token.
//
// Both theme entry points are bundled with esbuild (packages external) and
// imported from this repo, so both resolve the same hoisted @chakra-ui/react —
// mirroring what vite's theme-package alias does at runtime and keeping
// Chakra-version drift out of the diff. Style-config functions are evaluated
// with the same base theme on both sides so token *references* (brand.600)
// stay as strings and ramp-driven divergence doesn't leak into the output.
//
// Usage: node bin/diff-chakra-themes.mjs [path-to-private-package]
// Delete along with the rest of the Chakra tooling at the kill-switch.
import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const repo = path.resolve(fileURLToPath(import.meta.url), "../..");
const privateRepo = path.resolve(
  repo,
  process.argv[2] ?? "../ml-trainer-microbit"
);
const outDir = path.join(repo, "node_modules/.diff-chakra-themes");
mkdirSync(outDir, { recursive: true });

async function load(entry, name) {
  const outfile = path.join(outDir, `${name}.mjs`);
  await build({
    entryPoints: [entry],
    bundle: true,
    packages: "external",
    format: "esm",
    platform: "node",
    outfile,
    logLevel: "silent",
  });
  return (await import(pathToFileURL(outfile))).default;
}

const ossTheme = await load(
  path.join(repo, "src/deployment/default/theme.ts"),
  "oss-theme"
);
const privTheme = await load(path.join(privateRepo, "src/theme.ts"), "priv-theme");
const ossPreset = await load(
  path.join(repo, "src/deployment/default/panda-preset.ts"),
  "oss-preset"
);
const privPreset = await load(
  path.join(privateRepo, "src/panda-preset.ts"),
  "priv-preset"
);

// Evaluate Chakra style-config functions with the SAME theme on both sides so
// only genuine structural differences surface, not ramp resolution.
const evalCtx = { colorScheme: "gray", colorMode: "light", theme: ossTheme };
const resolve = (v) => {
  if (typeof v !== "function") {
    return v;
  }
  try {
    return v(evalCtx);
  } catch {
    return `[unevaluable function] ${v.toString().slice(0, 60)}`;
  }
};

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

function diff(a, b, prefix, out) {
  a = resolve(a);
  b = resolve(b);
  if (a === b) {
    return;
  }
  if (isObj(a) && isObj(b)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      diff(a[k], b[k], prefix ? `${prefix}.${k}` : k, out);
    }
    return;
  }
  const [ja, jb] = [JSON.stringify(a), JSON.stringify(b)];
  if (ja !== jb) {
    out.push({ path: prefix, oss: ja, priv: jb });
  }
}

const diffs = [];
diff(ossTheme, privTheme, "", diffs);

const tokenDiffs = diffs.filter((d) =>
  /^(colors|fonts|radii|shadows|space|sizes)\./.test(d.path)
);
const componentDiffs = diffs.filter((d) => d.path.startsWith("components."));
const otherDiffs = diffs.filter(
  (d) => !tokenDiffs.includes(d) && !componentDiffs.includes(d)
);

const table = (rows) => {
  const w = Math.max(...rows.map((d) => d.path.length), 4);
  for (const d of rows) {
    console.log(`  ${d.path.padEnd(w)}  ${d.oss ?? "-"}  ->  ${d.priv ?? "-"}`);
  }
};

console.log(`\n== A. Token diffs (${tokenDiffs.length}) ==`);
table(tokenDiffs);
console.log(`\n== B. Component style diffs (${componentDiffs.length}) ==`);
table(componentDiffs);
console.log(`\n== C. Other theme diffs (${otherDiffs.length}) ==`);
table(otherDiffs);

// -- Panda cross-check ------------------------------------------------------
// (private-panda − oss-panda) must equal (private-chakra − oss-chakra).
const pandaTokens = (preset) => ({
  ...preset.theme?.tokens,
  ...preset.theme?.extend?.tokens,
});
const unwrap = (node, segs) => {
  for (const s of segs) {
    node = node?.[s];
  }
  // Token leaves are { value } in Panda presets.
  return isObj(node) && "value" in node ? node.value : node;
};

const ossTok = pandaTokens(ossPreset);
const privTok = pandaTokens(privPreset);

console.log(`\n== D. Panda preset cross-check ==`);
let mismatches = 0;
for (const d of tokenDiffs) {
  const segs = d.path.split(".");
  const ossPanda = unwrap(ossTok, segs);
  // Presets merge, so a token the private preset doesn't set falls back to OSS.
  const privPanda = unwrap(privTok, segs) ?? ossPanda;
  const ok =
    JSON.stringify(ossPanda) === d.oss && JSON.stringify(privPanda) === d.priv;
  if (!ok) {
    mismatches++;
    console.log(
      `  MISMATCH ${d.path}: chakra ${d.oss} -> ${d.priv}; panda ${JSON.stringify(
        ossPanda
      )} -> ${JSON.stringify(privPanda)}`
    );
  }
}
console.log(
  mismatches
    ? `  ${mismatches} mismatches — the Panda presets do NOT encode these deltas`
    : `  all ${tokenDiffs.length} token deltas are reproduced by the Panda preset pair`
);
