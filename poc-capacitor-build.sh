#!/bin/bash
# Create offline build.
npx cross-env OFFLINE=1 npm run build

output_dir="./dist"
pxt_microbit_dir="../pxt-microbit"
staticpkg_prefix="staticpkg-pxt-microbit"
pxt_microbit_build_dir="$pxt_microbit_dir/built/packaged/$staticpkg_prefix"

# Generate pxt-microbit static package if it does not exist.
if [ ! -d "$pxt_microbit_build_dir" ] || [ -z "$(ls -A "$pxt_microbit_build_dir" 2>/dev/null)" ]; then
    echo "Generating pxt-microbit static package with extensions"
    ./ml-pxt-microbit-staticpkg.sh
fi

# Copy static packaged pxt-microbit into built ml-trainer.
echo "Copying pxt_microbit_build_dir into $output_dir..."
cp -r "$pxt_microbit_build_dir" "$output_dir"

# Add ml extension simulator controls
cd ../pxt-microbit-ml/simx
if [ ! -d "built" ]; then
    echo "Building simulator controls..."
    npm run build
fi
cd -
sim_output_path="$output_dir/sim/"
echo "Copying simulator controls into $sim_output_path..."
mkdir -p "$sim_output_path"
cp -r ../pxt-microbit-ml/simx/dist/. "$sim_output_path/."

echo "Done"

# To serve locally to check.
# npm run preview