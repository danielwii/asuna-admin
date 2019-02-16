const R = require('ramda');
const withTypescript = require('@zeit/next-typescript');
const withCss = require('@zeit/next-css');
const { withDefaultNextConfigs } = require('./asuna-with-default-next');

module.exports = R.compose(
  withTypescript,
  withCss,
  withDefaultNextConfigs,
)();
