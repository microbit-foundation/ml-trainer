#!/bin/bash


ml_extension="machine-learning"
ml_extension_runner="machine-learning-runner"
staticpkg_prefix="staticpkg-pxt-microbit"

cd ../pxt-microbit

# Copy ml extension libs.
cd libs
if [ ! -d "$ml_extension" ]; then
    echo "Adding machine-learning lib..."
    cp -r ../../pxt-microbit-ml "./$ml_extension"
    
    # Update dependencies in pxt.json.
    cd "$ml_extension"
    sed 's/"core": "\*",/"core": "file:..\/core",/' pxt.json > temp_file && mv temp_file pxt.json
    sed 's/"machine-learning-runner": "github:microbit-foundation\/pxt-microbit-ml-runner#.*"/"machine-learning-runner": "file:..\/machine-learning-runner"/' pxt.json > temp_file && mv temp_file pxt.json
    cd -
fi
if [ ! -d "$ml_extension_runner" ]; then
    echo "Adding machine-learning-runner lib..."
    cp -r ../../pxt-microbit-ml-runner "./$ml_extension_runner"

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
cd ../ml-trainer
