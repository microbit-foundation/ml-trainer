#!/bin/bash
npm run build

output_dir="./dist"
path_to_pxt_microbit="../pxt-microbit"

# Generate pxt-microbit static package if it does not exist.
dir="$path_to_pxt_microbit/built/packaged/staticpkg-pxt-microbit"
if [ ! -d "$dir" ] || [ -z "$(ls -A "$dir" 2>/dev/null)" ]; then
    echo "Generating pxt-microbit static package"
    cd "$path_to_pxt_microbit"
    pxt staticpkg --route staticpkg-pxt-microbit
    cd -
fi

# Copy static packaged pxt-microbit into built ml-trainer.
echo "Copying $dir into $output_dir..."
cp -r "$dir" "$output_dir"

# Generate and add pxt-microbit-ml extension.
url="https://cdn.makecode.com/api/gh/microbit-foundation/pxt-microbit-ml/v1.0.11/text"
filename="$output_dir/pxt-microbit-ml.json"

echo "Fetching data from: $url"
echo "Saving to: $filename"
curl -Ls "$url" -o "$filename"

echo "Done"

# To serve locally to check.
# npm run preview