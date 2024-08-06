#!/usr/bin/env bash

# Temporary until we publish uhex
node ../../../microbit-universal-hex/dist/bundles/microbit-uh-cli.cjs.js split -u microbit-ML-bluetooth-input.hex
mv v1-intel.hex microbit-ML-bluetooth-input-v1.hex
mv v2-intel.hex microbit-ML-bluetooth-input-v2.hex
