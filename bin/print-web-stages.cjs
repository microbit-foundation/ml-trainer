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
console.log(`matrix=${JSON.stringify({ stage: stages })}`);
