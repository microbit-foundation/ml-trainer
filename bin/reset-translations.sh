#!/usr/bin/env bash
#
# Resets non-English translations (everything in lang/ except ui.en.json and
# ui.en-us.json, which we maintain manually) to the last regular release tag
# (e.g. v1.3.1, ignoring pre-release suffixes like -apps.internal.N).
#
# Use this after editing lang/ui.en.json so iteration on English text doesn't
# leave stale strings in translation bundles. Follow with `npm run i18n:compile`
# to update src/messages/.

set -euo pipefail

cd "$(dirname "$0")/.."

TAG=$(git tag --list 'v*' --sort=-v:refname | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
if [ -z "$TAG" ]; then
  echo "Could not find a regular release tag (vX.Y.Z)." >&2
  exit 1
fi
echo "Resetting non-English translations to $TAG"

find lang -type f -not -name 'ui.en.json' -not -name 'ui.en-us.json' -print0 |
  while IFS= read -r -d '' f; do
    git checkout "$TAG" -- "$f"
  done
