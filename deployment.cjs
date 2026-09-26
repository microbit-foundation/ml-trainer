/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
const {
  createDeploymentDetailsFromOptions,
} = require("@microbit-foundation/website-deploy-aws");

const { s3Config } = createDeploymentDetailsFromOptions({
  production: {
    bucket: "createai.microbit.org",
    mode: "root",
    allowPrerelease: false,
  },
  staging: {
    bucket: "stage-createai.microbit.org",
  },
  beta: {
    bucket: "review-createai.microbit.org",
    hostname: "createai.microbit.org",
    prefix: "v/beta",
  },
  review: {
    bucket: "review-createai.microbit.org",
    mode: "branch-prefix",
  },
});

module.exports = {
  deploymentDir: "./dist",
  ...s3Config,
  region: "eu-west-1",
  removeNonexistentObjects: true,
  redirects: [],
  params: {
    "**/**.html": {
      CacheControl: "public, max-age=0, must-revalidate",
    },
    "**/assets/**": { CacheControl: "public, max-age=31536000, immutable" },
    // Just the favicon, other images via bundler/assets
    "**/imgs/**": {
      CacheControl: "public, max-age=0, must-revalidate",
    },
    // apple-app-site-association has no extension, so set the type explicitly
    "**/.well-known/**": {
      ContentType: "application/json",
      CacheControl: "public, max-age=0, must-revalidate",
    },
  },
};
