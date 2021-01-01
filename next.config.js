// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-var-requires */
const R = require('ramda');
// https://github.com/vercel/next.js/blob/master/errors/css-npm.md
const withCss = require('@zeit/next-css');
const { withDefaultNextConfigs } = require('./asuna-with-default-next');

module.exports = R.compose(withCss, withDefaultNextConfigs)();
