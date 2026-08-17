/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { unknownSemanticTokens } from "@microbit/ui/preset-lint";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { appPreset } from "./panda-preset";

// Panda accepts an unknown `semanticTokens` key silently — the override
// never applies and nothing fails, so a rename in @microbit/ui would leave
// this app on the library's colours with a green typecheck. See the
// CSS-variable contract in @microbit/ui's README.

it("app preset overrides only semantic tokens @microbit/ui defines", () => {
  expect(unknownSemanticTokens(appPreset)).toEqual([]);
});

// The private brand preset is optional — present only when linked
// (`npm run dev:link-theme`) or installed in a brand build, exactly as
// panda.config.ts treats it. Checked here rather than in its own repo so
// that repo stays free of a dependency on this library, and because the
// merge this guards against happens on this side.
const require = createRequire(import.meta.url);
let brandPreset: unknown;
try {
  brandPreset = (
    require("@microbit-foundation/ml-trainer-microbit/panda-preset") as {
      default: unknown;
    }
  ).default;
} catch {
  brandPreset = undefined;
}

describe.skipIf(!brandPreset)("private brand preset", () => {
  it("overrides only semantic tokens @microbit/ui defines", () => {
    expect(unknownSemanticTokens(brandPreset)).toEqual([]);
  });
});
