#!/usr/bin/env node

/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

// Prints STAGE and VITE_STAGE for CI builds.
// Used by app builds that don't need the deployment config from print-web-ci-env.cjs.

const { stage } = require("./ci-stage.cjs");

console.log(`STAGE=${stage}`);
console.log(`VITE_STAGE=${stage}`);
