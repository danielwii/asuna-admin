#!/usr/bin/env bash

mkdir -p static/libs
rm -f static/libs/*
cp node_modules/antd/dist/antd.css static/libs/antd.css
