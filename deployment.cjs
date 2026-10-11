/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
const {
  createDeploymentDetailsFromOptions,
} = require("@microbit-foundation/website-deploy-aws");

// The buckets and their distributions are defined in
// microbit-foundation/microbit-org (apps/createai).
const { s3Config } = createDeploymentDetailsFromOptions({
  production: {
    bucket: "createai-microbit-org-production",
    hostname: "createai.microbit.org",
  },
  staging: {
    bucket: "createai-microbit-org-staging",
    hostname: "stage-createai.microbit.org",
  },
  beta: {
    bucket: "createai-microbit-org-production",
    hostname: "createai.microbit.org",
    prefix: "v/beta",
  },
  review: {
    bucket: "createai-microbit-org-review",
    hostname: "review-createai.microbit.org",
    mode: "branch-prefix",
  },
});

module.exports = {
  deploymentDir: "./dist",
  ...s3Config,
  region: "eu-west-1",
  // The buckets are private (BucketOwnerEnforced), so objects take no ACL.
  acl: null,
  findDistribution: true,
  removeNonexistentObjects: true,
  // Beta is deployed under v/beta/ in production's bucket.
  retainObjectsPatterns: ["v/beta/**"],
  // Pages already open or cached may still ask for the previous build's.
  staleObjectsPatterns: ["assets/**"],
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
