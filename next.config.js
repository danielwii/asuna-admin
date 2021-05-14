const { existsSync } = require('fs-extra');
const { createNextConfig } = require('@danielwii/asuna-helper/dist/next/config');
const withTM = require('next-transpile-modules');

module.exports = createNextConfig(
  {},
  existsSync('./configs.js') ? require('./configs') : undefined,
  [withTM(['@danielwii/asuna-components'])],
  { enableAdmin: true },
);
