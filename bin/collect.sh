#!/usr/bin/env bash

set +ex

mkdir -p static/libs
rm -f static/libs/*

cp node_modules/antd/dist/antd.css static/libs/antd.css
cp node_modules/draft-js/dist/Draft.css static/libs/draft.css
cp node_modules/braft-editor/dist/braft.css static/libs/braft.css
cp node_modules/video.js/dist/video-js.css static/libs/video-js.css

exit 0
