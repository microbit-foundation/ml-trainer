/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { readFileSync, writeFileSync } from "fs";
import {
  createUniversalHex,
  microbitBoardId,
} from "@microbit/microbit-universal-hex";

const [v1Path, v2Path, outputPath] = process.argv.slice(2);
if (!v1Path || !v2Path || !outputPath) {
  console.error(
    "Usage: node create-universal-hex.mjs <v1.hex> <v2.hex> <output.hex>"
  );
  process.exit(1);
}

const v1Hex = readFileSync(v1Path, "utf-8");
const v2Hex = readFileSync(v2Path, "utf-8");

const universalHex = createUniversalHex([
  { hex: v1Hex, boardId: microbitBoardId.V1 },
  { hex: v2Hex, boardId: microbitBoardId.V2 },
]);

writeFileSync(outputPath, universalHex);
console.log(`Created universal hex: ${outputPath}`);
