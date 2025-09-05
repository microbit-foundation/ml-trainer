#!/bin/bash

# Check if required arguments were provided
if [ $# -lt 3 ]; then
    echo "Usage: $0 <pxt-microbit-dir> <pxt-microbit-ml-dir> <pxt-microbit-ml-runner-dir> [ml-trainer-dir]"
    echo "  pxt-microbit-dir: Path to the pxt-microbit directory"
    echo "  pxt-microbit-ml-dir: Path to the pxt-microbit-ml source directory"
    echo "  pxt-microbit-ml-runner-dir: Path to the pxt-microbit-ml-runner source directory"
    exit 1
fi

# Get directory arguments
pxt_microbit_dir="$1"
pxt_microbit_ml_dir="$2"
pxt_microbit_ml_runner_dir="$3"

# Store directories in an array for validation
directories=("$pxt_microbit_dir" "$pxt_microbit_ml_dir" "$pxt_microbit_ml_runner_dir")

# Check if all required paths exist
for dir in "${directories[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "Error: Directory '$dir' does not exist"
        exit 1
    fi
done

# Extension names constants.
ml_extension="machine-learning"
ml_extension_runner="machine-learning-runner"
staticpkg_prefix="staticpkg-pxt-microbit"

ml_trainer_dir=$(pwd)
cd "$pxt_microbit_dir"

# Copy ml extension libs.
cd libs
if [ ! -d "$ml_extension" ]; then
    echo "Adding machine-learning lib..."
    cp -r "$pxt_microbit_ml_dir" "./$ml_extension"
    
    # Update dependencies in pxt.json.
    cd "$ml_extension"
    sed 's/"core": "\*",/"core": "file:..\/core",/' pxt.json > temp_file && mv temp_file pxt.json
    sed 's/"machine-learning-runner": "github:microbit-foundation\/pxt-microbit-ml-runner#.*"/"machine-learning-runner": "file:..\/machine-learning-runner"/' pxt.json > temp_file && mv temp_file pxt.json
    cd -
fi
if [ ! -d "$ml_extension_runner" ]; then
    echo "Adding machine-learning-runner lib..."
    cp -r "$pxt_microbit_ml_runner_dir" "./$ml_extension_runner"

    # Update dependencies in pxt.json.
    cd "$ml_extension_runner"
    sed 's/"core": "\*"/"core": "file:..\/core"/' pxt.json > temp_file && mv temp_file pxt.json
    cd -
fi
cd ..

# Update pxtarget.json.
if ! grep -q "libs/$ml_extension" pxtarget.json; then
    # Add machine-learning reference.
    sed 's/"libs\/core",/"libs\/core",\n        "libs\/machine-learning",/' pxtarget.json > temp_file && mv temp_file pxtarget.json
fi
if ! grep -q "libs/$ml_extension_runner" pxtarget.json; then
    # Add machine-learning-runner reference.
    sed 's/"libs\/core",/"libs\/core",\n        "libs\/machine-learning-runner",/' pxtarget.json > temp_file && mv temp_file pxtarget.json
fi

# Update targetconfig.json so that simulator works.
# The new devUrl will need to be configured differently depending on the hostname. WIP this does not work for the app.
sed '/microbit-foundation\/pxt-microbit-ml/,/}/ s|"devUrl": "[^"]*"|"devUrl": "http://localhost:4173/"|' targetconfig.json > temp_file && mv temp_file targetconfig.json
if ! sed -n '/microbit-foundation\/pxt-microbit-ml/,/}/p' targetconfig.json | grep -q '"index":'; then
    sed '/microbit-foundation\/pxt-microbit-ml/,/}/ {
        s/"aspectRatio": \([0-9.]*\)$/"aspectRatio": \1,/
        /"aspectRatio": [0-9.]*,$/a\
                    "index": "sim/index.html"
    }' targetconfig.json > temp_file && mv temp_file targetconfig.json
fi

# Generate staticpkg
pxt staticpkg --route "$staticpkg_prefix"
cd "$ml_trainer_dir"