#!/usr/bin/env bash

set +ex

BIN_PATH="$(yarn bin)"

mkdir -p static/libs
rm -f static/libs/*

cp $BIN_PATH/../antd/dist/antd.css static/libs/antd.css
cp $BIN_PATH/../draft-js/dist/Draft.css static/libs/draft.css
cp $BIN_PATH/../braft-editor/dist/braft.css static/libs/braft.css
cp $BIN_PATH/../vi1deo.js/dist/video-js.css static/libs/video-js.css

exit 0
