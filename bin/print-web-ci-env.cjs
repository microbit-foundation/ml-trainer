#!/usr/bin/env node

const { stage } = require("./ci-stage.cjs");

process.env.STAGE = stage;
// STAGE must be defined before this is imported
const { bucketName, bucketPrefix } = require("../deployment.cjs");
const baseUrl = !bucketPrefix ? "/" : `/${bucketPrefix}/`;
const fullUrl = `https://${bucketName}${baseUrl}`;

console.log(`STAGE=${stage}`);
console.log(`VITE_STAGE=${stage}`);
console.log(`BASE_URL=${baseUrl}`);
// This can be used for og:url and similar. Not quite right for review domain but we don't really care.
console.log(`VITE_FULL_URL=${fullUrl}`);
