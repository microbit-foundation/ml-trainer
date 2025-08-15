#!/bin/bash
npm run build

output_dir="./dist"
path_to_pxt_microbit="../pxt-microbit"
path_staticpkg_prefix="staticpkg-pxt-microbit"

# Generate pxt-microbit static package if it does not exist.
pxt_microbit_build_dir="$path_to_pxt_microbit/built/packaged/$path_staticpkg_prefix"
if [ ! -d "$pxt_microbit_build_dir" ] || [ -z "$(ls -A "$pxt_microbit_build_dir" 2>/dev/null)" ]; then
    echo "Generating pxt-microbit static package"
    cd "$path_to_pxt_microbit"
    pxt staticpkg --route "$path_staticpkg_prefix"
    cd -
fi

echo "Done"

# To serve locally to check.
# npm run preview