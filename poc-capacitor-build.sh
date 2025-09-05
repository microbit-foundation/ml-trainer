#!/bin/bash

# Check arguments.
pxt_microbit_dir="$1"
pxt_microbit_ml_ext_dir="$2"
pxt_microbit_ml_runner_ext_dir="$3"

# Check if arguments were provided.
if [ $# -ne 3 ]; then
    echo "Usage: $0 <directory to pxt-microbit repo> <directory to pxt-microbit-ml repo> <directory to pxt-microbit-ml-runner repo>"
    exit 1
fi

# Check if all paths exist.
directories=("$pxt_microbit_dir" "$pxt_microbit_ml_ext_dir" "$pxt_microbit_ml_runner_ext_dir")
for dir in "${directories[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "Error: Directory '$dir' does not exist"
        exit 1
    fi
done

echo "pxt-microbit: $pxt_microbit_dir"
echo "pxt-microbit-ml extension: $pxt_microbit_ml_ext_dir"
echo "pxt-microbit-ml-runner extension: $pxt_microbit_ml_runner_ext_dir"

# Create offline build.
npx cross-env OFFLINE=1 npm run build

pxt_microbit_dir="../pxt-microbit"
output_dir="./dist"
staticpkg_prefix="staticpkg-pxt-microbit"
pxt_microbit_build_dir="$pxt_microbit_dir/built/packaged/$staticpkg_prefix"

# Generate pxt-microbit static package if it does not exist.
if [ ! -d "$pxt_microbit_build_dir" ] || [ -z "$(ls -A "$pxt_microbit_build_dir" 2>/dev/null)" ]; then
    echo "Generating pxt-microbit static package with extensions"
    ./ml-pxt-microbit-staticpkg.sh "$pxt_microbit_dir" "$pxt_microbit_ml_ext_dir" "$pxt_microbit_ml_runner_ext_dir"
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