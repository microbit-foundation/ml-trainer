#!/usr/bin/env node

/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

// Prints the build matrix of web stages for GITHUB_OUTPUT.
// BETA_BRANCH_EXISTS is "true" when the repo has a beta branch.

const { webStages } = require("./ci-stage.cjs");

const stages = webStages(process.env.BETA_BRANCH_EXISTS === "true");
// Playwright runs once per ref. When main also builds beta, it tests beta:
// users see beta, and it's the build under a non-root base path.
const playwright = (stage) =>
  stage !== "PRODUCTION" && (stage === "BETA" || !stages.includes("BETA"));
const include = stages.map((stage) => ({
  stage,
  playwright: playwright(stage),
}));
console.log(`matrix=${JSON.stringify({ include })}`);
