/* eslint-disable @typescript-eslint/no-var-requires */
const R = require('ramda');
const withCss = require('@zeit/next-css');
const { withDefaultNextConfigs } = require('./asuna-with-default-next');

module.exports = R.compose(withCss, withDefaultNextConfigs)();
