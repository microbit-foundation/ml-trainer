/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

// Determines the CI stage from GITHUB_REF.
// Used by print-web-ci-env.cjs and print-apps-ci-env.cjs.

const ref = process.env.GITHUB_REF;
let stage;
if (ref === "refs/heads/beta") {
  stage = "BETA";
} else if (ref === "refs/heads/main") {
  stage = "STAGING";
} else if (ref.startsWith("refs/tags/v")) {
  stage = "PRODUCTION";
} else {
  stage = "REVIEW";
}

module.exports = { stage };
