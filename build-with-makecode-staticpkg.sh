#!/bin/bash
npm run build

# Generate pxt-microbit static package if it does not exist.
dir="../pxt-microbit/built/packaged/staticpkg-pxt-microbit"
if [ ! -d "$dir" ] || [ -z "$(ls -A "$dir" 2>/dev/null)" ]; then
    echo "Generating pxt-microbit static package"
    cd ../pxt-microbit
    pxt staticpkg --route staticpkg-pxt-microbit
    cd -
fi

# Copy static packaged pxt-microbit into built ml-trainer.
echo "Copying $dir into ./dist..."
cp -r "$dir" ./dist
echo "Done"

# To serve locally to check.
# npm run preview