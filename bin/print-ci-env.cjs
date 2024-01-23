#!/usr/bin/env node

const ref = process.env.GITHUB_REF;
let stage;
if (ref === 'refs/heads/main') {
  stage = 'STAGING';
} else if (ref.startsWith('refs/tags/v')) {
  stage = 'PRODUCTION';
} else {
  stage = 'REVIEW';
}

process.env.STAGE = stage;
// STAGE must be defined before this is imported
const { bucketName, bucketPrefix } = require('../deployment.cjs');

// Deploy to a /thenextgen/ suffix.
// If we actually deploy anything else to ml.microbit.org we'll need to
// review the deployment process as it likely removes other files
const baseUrl = (!bucketPrefix ? '/' : `/${bucketPrefix}/`) + 'thenextgen/';
const fullUrl = `https://${bucketName}${baseUrl}`;

console.log(`STAGE=${stage}`);
console.log(`VITE_STAGE=${stage}`);
console.log(`BASE_URL=${baseUrl}`);
// This can be used for og:url and similar. Not quite right for review domain but we don't really care.
console.log(`VITE_FULL_URL=${fullUrl}`);
