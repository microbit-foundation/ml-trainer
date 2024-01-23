const {
  createDeploymentDetailsFromOptions,
} = require('@microbit-foundation/website-deploy-aws-config');
const posixPath = require('path/posix');

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
  deploymentDir: './dist',
  ...s3Config,
  // We deploy to a fixed path for the nextgen version
  // See also the base path configuration in vite.config.ts
  bucketPrefix: posixPath.join(s3Config.bucketPrefix || '', 'thenextgen'),
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
    // There's lots in public/ that we'd ideally use the bundler for to improve caching
    'css/**': {
      CacheControl: 'public, max-age=0, must-revalidate',
    },
    'firmware/**': {
      CacheControl: 'public, max-age=0, must-revalidate',
    },
    'imgs/**': {
      CacheControl: 'public, max-age=0, must-revalidate',
    },
    'sounds/**': {
      CacheControl: 'public, max-age=0, must-revalidate',
    },
    'webfonts/**': {
      CacheControl: 'public, max-age=0, must-revalidate',
    },
  },
};
