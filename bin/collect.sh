#!/usr/bin/env sh

set +ex

mkdir -p static/libs
rm -f static/libs/*

root=$(yarn bin)/../..

cp $root/node_modules/antd/dist/antd.css $root/static/libs/antd.css
cp $root/node_modules/draft-js/dist/Draft.css $root/static/libs/draft.css
cp $root/node_modules/braft-editor/dist/index.css $root/static/libs/index.css
cp $root/node_modules/video.js/dist/video-js.css $root/static/libs/video-js.css

exit 0
