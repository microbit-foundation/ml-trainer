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
    // The hex files don't use the bundler. Might be worth revisiting this.
    "firmware/**": {
      CacheControl: "public, max-age=0, must-revalidate",
    },
    // Just the favicon, other images via bundler/assets
    "imgs/**": {
      CacheControl: "public, max-age=0, must-revalidate",
    },
  },
};
