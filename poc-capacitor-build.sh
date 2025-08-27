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

# Copy static packaged pxt-microbit into built ml-trainer.
echo "Copying pxt_microbit_build_dir into $output_dir..."
cp -r "$pxt_microbit_build_dir" "$output_dir"

# Generate and add pxt-microbit-ml extension into static package such that the path is the same.
cd "$output_dir/$path_staticpkg_prefix"
ext_urls=(
    "https://makecode.com/api/gh/microbit-foundation/pxt-microbit-ml/v1.0.11/text"
    "https://makecode.com/api/gh/microbit-foundation/pxt-microbit-ml-runner/v0.4.8/text"
)

# Process each URL in one loop
for ext_url in "${ext_urls[@]}"; do
    # Extract the path after the base URL
    url_path=$(echo "$ext_url" | sed 's|https://makecode.com/api/||')
    
    # Generate output directory and filename from URL
    ext_output_dir="./$(dirname "$url_path")"
    filename="$(basename "$url_path").json"
    ext_output_file="$ext_output_dir/$filename"
    
    # Create the output dir if it doesn't exist
    if [ ! -d "$ext_output_dir" ]; then
        echo "Creating directory: $ext_output_dir"
        mkdir -p "$ext_output_dir"
    fi
    
    echo "Fetching data from: $ext_url"
    echo "Saving to: $ext_output_file"
    curl -Ls "$ext_url" -o "$ext_output_file"
done

echo "Done"

# To serve locally to check.
# npm run preview