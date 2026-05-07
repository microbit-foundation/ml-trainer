#!/usr/bin/env bash
# (c) 2024, Micro:bit Educational Foundation and contributors
# SPDX-License-Identifier: MIT
#
# Builds micro:bit V1 and V2 data collection firmware for both BLE
# security variants and copies the hex files to src/device/firmware/.
#
# Variants:
#   no-pairing   - SECURITY_MODE_ENCRYPTION_OPEN_LINK (web app)
#   just-works   - SECURITY_MODE_ENCRYPTION_NO_MITM   (native app)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FIRMWARE_DIR="$PROJECT_ROOT/src/device/firmware"
DOCKER_IMAGE="ghcr.io/carlosperate/microbit-toolchain:latest"

V1_HEX="$SCRIPT_DIR/v1/build/bbc-microbit-classic-gcc/source/microbit-app-combined.hex"
V2_HEX="$SCRIPT_DIR/v2/MICROBIT.hex"

build_variant() {
  local variant="$1"
  echo ""
  echo "=== Building variant: $variant ==="

  # Set up config files for this variant
  cp "$SCRIPT_DIR/v1/config-${variant}.json" "$SCRIPT_DIR/v1/config.json"
  cp "$SCRIPT_DIR/v2/codal-${variant}.json" "$SCRIPT_DIR/v2/codal.json"

  # Clean and build V1
  echo "Building V1 ($variant)..."
  rm -rf "$SCRIPT_DIR/v1/build"
  docker run -v "$SCRIPT_DIR/v1:/home" -v "$SCRIPT_DIR/source:/home/source" \
    --rm "$DOCKER_IMAGE" yotta build

  # Clean and build V2
  echo "Building V2 ($variant)..."
  docker run -v "$SCRIPT_DIR:/home" --rm -w /home/v2 \
    "$DOCKER_IMAGE" python3 build.py -c

  # Copy hex files
  echo "Copying hex files..."
  cp "$V1_HEX" "$FIRMWARE_DIR/microbit-data-collection-${variant}-v1.hex"
  cp "$V2_HEX" "$FIRMWARE_DIR/microbit-data-collection-${variant}-v2.hex"

  # Create universal hex
  echo "Creating universal hex..."
  node "$SCRIPT_DIR/create-universal-hex.mjs" \
    "$V1_HEX" "$V2_HEX" \
    "$FIRMWARE_DIR/microbit-data-collection-${variant}-universal.hex"

  # Clean up generated config files
  rm "$SCRIPT_DIR/v1/config.json" "$SCRIPT_DIR/v2/codal.json"
}

build_variant "no-pairing"
build_variant "just-works"

echo ""
echo "Done. Firmware files:"
ls -la "$FIRMWARE_DIR"/microbit-data-collection-*.hex
