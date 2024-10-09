const {
  createDeploymentDetailsFromOptions,
} = require("@microbit-foundation/website-deploy-aws-config");

const { s3Config } = createDeploymentDetailsFromOptions({
  production: {
    bucket: "createai.microbit.org",
    mode: "root",
    allowPrerelease: false,
  },
  staging: {
    bucket: "stage-createai.microbit.org",
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
  enableS3StaticWebsiteHosting: true,
  errorDocumentKey: "index.html",
  redirects: [],
  params: {
    "**/**.html": {
      CacheControl: "public, max-age=0, must-revalidate",
    },
    "**/assets/**": { CacheControl: "public, max-age=31536000, immutable" },
    // There's lots in public/ that we'd ideally use the bundler for to improve caching
    // TODO: this might no longer be true, or at least be an easy fix
    "css/**": {
      CacheControl: "public, max-age=0, must-revalidate",
    },
    "firmware/**": {
      CacheControl: "public, max-age=0, must-revalidate",
    },
    "imgs/**": {
      CacheControl: "public, max-age=0, must-revalidate",
    },
    "sounds/**": {
      CacheControl: "public, max-age=0, must-revalidate",
    },
    "webfonts/**": {
      CacheControl: "public, max-age=0, must-revalidate",
    },
  },
};
