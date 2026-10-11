#!/usr/bin/env node

const { stage: refStage } = require("./ci-stage.cjs");

// The build matrix sets STAGE when a ref deploys more than one stage.
const stage = process.env.STAGE || refStage;
process.env.STAGE = stage;
// STAGE must be defined before this is imported
const { hostname, bucketPrefix } = require("../deployment.cjs");
const baseUrl = !bucketPrefix ? "/" : `/${bucketPrefix}/`;
const fullUrl = `https://${hostname}${baseUrl}`;

console.log(`STAGE=${stage}`);
console.log(`VITE_STAGE=${stage}`);
console.log(`BASE_URL=${baseUrl}`);
// This can be used for og:url and similar.
console.log(`VITE_FULL_URL=${fullUrl}`);
