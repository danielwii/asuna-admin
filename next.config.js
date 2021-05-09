const consola = require('consola');
const { Endpoints } = require('@danielwii/asuna-helper/dist/env');
const { URL } = require('url');
const { inspect } = require('@danielwii/asuna-helper/dist/serializer');
const { existsSync } = require('fs-extra');
const withTM = require('next-transpile-modules');
const { compact, uniq, flow, split, omit, isNaN, isNumber, last } = require('lodash');
const logger = consola.withScope('next');

if (process.env.PROXY_API)
  logger.error(
    'deprecated configs',
    { PROXY_API: process.env.PROXY_API },
    'using API_ENDPOINT/NEXT_PUBLIC_API_ENDPOINT instead.',
  );

process.env.PORT =
  process.env.PORT ||
  (isNumber(parseInt(last(process.argv))) && !isNaN(parseInt(last(process.argv))) ? last(process.argv) : '3000');
const PORT = process.env.PORT;

if (!process.env.INTERNAL_DOMAIN) process.env.INTERNAL_DOMAIN = `http://localhost:${PORT}`;
if (!process.env.DOMAIN) throw new Error('env.DOMAIN is required, for public access');

if (process.env.BUILDING) process.env.INTERNAL_DOMAIN = process.env.DOMAIN;

logger.info('init next with', {
  /**
   * @deprecated used to ignore ssg, using fallback instead
   */
  PORT,
  // --------------------------------------------------------------
  // UPLOADS_FOLLOW 用于 follow /uploads 下的 30x 冲定向，并直接返回结果
  // UPLOADS_FOLLOW_INTERNAL 标记转向地址是是否是内网的 asuna-node-server api
  // --------------------------------------------------------------
  UPLOADS_FOLLOW: process.env.UPLOADS_FOLLOW,
  UPLOADS_FOLLOW_INTERNAL: process.env.UPLOADS_FOLLOW_INTERNAL,
  // 某些页面的静态话需要一个启动的当前服务，在构建是无法访问需要跳过
  SKIP_BUILD: process.env.SKIP_BUILD,
  // 标记构建模式，用于处理一些地址转换，构建时应该始终是 1
  BUILDING: process.env.BUILDING,
  NODE_TLS_REJECT_UNAUTHORIZED: process.env.NODE_TLS_REJECT_UNAUTHORIZED,
  DOMAIN: process.env.DOMAIN,
  // 内网地址，用于 getStaticProps 服务端访问
  INTERNAL_DOMAIN: process.env.INTERNAL_DOMAIN,
  // 1 时通过 /proxy 访问 api；0 时直连 api，此时需要 api 开通 cors
  PROXY_MODE: process.env.PROXY_MODE,
  API_ENDPOINT: process.env.API_ENDPOINT,
  WS_ENDPOINT: process.env.WS_ENDPOINT,
  STATIC_ENDPOINT: process.env.STATIC_ENDPOINT,
  NEXT_PUBLIC_API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT,
  NEXT_PUBLIC_WS_ENDPOINT: process.env.NEXT_PUBLIC_WS_ENDPOINT,
  NEXT_PUBLIC_STATIC_ENDPOINT: process.env.NEXT_PUBLIC_STATIC_ENDPOINT,
  NEXT_PUBLIC_ENABLE_MOBILE_COMPATIBILITY: process.env.NEXT_PUBLIC_ENABLE_MOBILE_COMPATIBILITY,
  HOST_MAPPINGS: process.env.HOST_MAPPINGS,
  // 可供识别的 assets 地址，用于生成缩略图
  EXTRA_DOMAINS: process.env.EXTRA_DOMAINS,
});

const follow = process.env.UPLOADS_FOLLOW;
const customConfigs = existsSync('./configs.js') ? require('./configs') : { headers: [], rewrites: {} };
const endpoints = { api: Endpoints.api, graphql: Endpoints.graphql, ws: Endpoints.ws };
logger.success('Endpoints is', inspect(endpoints));

const configs = flow(
  withTM(['@danielwii/asuna-components']),
)({
  env: { PROXY_MODE: process.env.PROXY_MODE },
  future: { webpack5: true },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = { fs: false, crypto: false, window: false };
    }
    return config;
  },
  reactStrictMode: false,
  poweredByHeader: false,
  productionBrowserSourceMaps: true,
  i18n: existsSync('./next-i18next.config.js') ? require('./next-i18next.config').i18n : undefined,
  images: {
    domains: flow(
      uniq,
      compact,
    )(
      [
        process.env.DOMAIN ? new URL(process.env.DOMAIN).hostname : '',
        process.env.STATIC_ENDPOINT ? new URL(process.env.STATIC_ENDPOINT).hostname : '',
        process.env.NEXT_PUBLIC_STATIC_ENDPOINT ? new URL(process.env.NEXT_PUBLIC_STATIC_ENDPOINT).hostname : '',
        'localhost',
      ].concat(
        process.env.EXTRA_DOMAINS
          ? split(process.env.EXTRA_DOMAINS, ',').map((domain) => new URL(domain).hostname)
          : [],
      ),
    ),
  },
  publicRuntimeConfig: {
    STATIC_ENDPOINT: process.env.STATIC_ENDPOINT,
  },
  async headers() {
    return compact([
      {
        source: '/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=10, s-maxage=10, stale-while-revalidate=10' }],
      },
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
      { source: '/proxy/:path*', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
      {
        // FIXME not working, see https://github.com/vercel/next.js/issues/19914, using proxy solve the cache for next image
        // source: '/_next/image(.*)',
        source: '/:all*(svg|jpg|png|gif)', // for others
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=3600' }],
      },
      ...customConfigs.headers,
    ]);
  },
  async redirects() {
    const staticEndpoint = process.env.STATIC_ENDPOINT || process.env.NEXT_PUBLIC_STATIC_ENDPOINT;
    return compact([
      staticEndpoint && !follow
        ? { source: '/uploads/:slug*', destination: new URL('/:slug*', staticEndpoint).href, permanent: true }
        : undefined,
    ]);
  },
  async rewrites() {
    const apiEndpoint = process.env.API_ENDPOINT || process.env.NEXT_PUBLIC_API_ENDPOINT;
    const staticEndpoint = process.env.STATIC_ENDPOINT || process.env.NEXT_PUBLIC_STATIC_ENDPOINT;
    return {
      beforeFiles: compact([
        staticEndpoint && follow
          ? process.env.UPLOADS_FOLLOW_INTERNAL
            ? { source: '/uploads/:slug*', destination: new URL('/uploads/:slug*', apiEndpoint).href }
            : { source: '/uploads/:slug*', destination: new URL('/:slug*', staticEndpoint).href }
          : undefined,
        apiEndpoint ? { source: '/proxy/rest/:slug*', destination: new URL('/rest/:slug*', apiEndpoint).href } : undefined,
        apiEndpoint ? { source: '/proxy/admin/:slug*', destination: new URL('/admin/:slug*', apiEndpoint).href } : undefined,
        apiEndpoint ? { source: '/proxy/api/:slug*', destination: new URL('/api/:slug*', apiEndpoint).href } : undefined,
        apiEndpoint ? { source: '/proxy/:slug*', destination: new URL('/api/:slug*', apiEndpoint).href } : undefined,
        apiEndpoint ? { source: '/socket.io/:slug*', destination: new URL('/socket.io/:slug*', apiEndpoint).href } : undefined,
        apiEndpoint ? { source: '/graphql/:slug*', destination: new URL('/graphql/:slug*', apiEndpoint).href } : undefined,
        ...(customConfigs.rewrites?.beforeFiles ?? []),
      ]),
    };
  },
});

logger.success(inspect(omit(configs, 'redirects', 'rewrites', 'headers')));
(async () => {
  if (configs.headers) logger.success('headers', inspect(await configs.headers()));
  if (configs.redirects) logger.success('redirects', inspect(await configs.redirects()));
  if (configs.rewrites) logger.success('rewrites', inspect(await configs.rewrites()));
})();

module.exports = configs;
