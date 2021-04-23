const R = require('ramda');
// https://github.com/vercel/next.js/blob/master/errors/css-npm.md
const withCss = require('@zeit/next-css');
const { withDefaultNextConfigs } = require('./asuna-with-default-next');
const consola = require('consola');

const logger = consola.withScope('next');

if (process.env.PROXY_API)
  consola.warn(
    'deprecated configs',
    { PROXY_API: process.env.PROXY_API },
    'using API_ENDPOINT/NEXT_PUBLIC_API_ENDPOINT instead.',
  );

logger.info('init next with', {
  NODE_TLS_REJECT_UNAUTHORIZED: process.env.NODE_TLS_REJECT_UNAUTHORIZED,
  API_ENDPOINT: process.env.API_ENDPOINT,
  WS_ENDPOINT: process.env.WS_ENDPOINT,
  NEXT_PUBLIC_API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT,
  NEXT_PUBLIC_WS_ENDPOINT: process.env.NEXT_PUBLIC_WS_ENDPOINT,
});

const configs = R.compose(
  withCss,
  withDefaultNextConfigs,
)({
  reactStrictMode: false,
  poweredByHeader: false,
  productionBrowserSourceMaps: true,
});

logger.success(configs);

module.exports = configs;
