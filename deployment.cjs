const {
  createDeploymentDetailsFromOptions,
} = require('@microbit-foundation/website-deploy-aws-config');

const { s3Config } = createDeploymentDetailsFromOptions({
  production: {
    bucket: 'ml.microbit.org',
    mode: 'root',
    allowPrerelease: false,
  },
  staging: {
    bucket: 'stage-ml.microbit.org',
  },
  review: {
    bucket: 'review-ml.microbit.org',
    mode: 'branch-prefix',
  },
});

module.exports = {
  ...s3Config,
  region: 'eu-west-1',
  removeNonexistentObjects: true,
  enableS3StaticWebsiteHosting: true,
  errorDocumentKey: 'index.html',
  redirects: [],
  params: {
    '**/**.html': {
      CacheControl: 'public, max-age=0, must-revalidate',
    },
    '**/assets/**': { CacheControl: 'public, max-age=31536000, immutable' },
  },
};
