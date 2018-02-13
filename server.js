// --------------------------------------------------------------
// Fix css-import in ssr mode
// --------------------------------------------------------------

// New. Needs to be on top of babel-register
require('css-modules-require-hook')({
  generateScopedName: '[name]__[local]___[hash:base64:5]',
});
// eslint-disable-next-line import/no-extraneous-dependencies
require('babel-core/register')({
  presets: ['next/babel'],
});

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const { createServer }       = require('http');
const { createProxyServer }  = require('http-proxy');
const { parse }              = require('url');
const next                   = require('next');
const { createConfigLoader } = require('node-buffs');

const dev          = process.env.NODE_ENV !== 'production';
const app          = next({ dev });
const handle       = app.getRequestHandler();
const proxy        = createProxyServer({});
const configurator = createConfigLoader();

const pathNeedsProxy = pathname =>
  pathname.startsWith('/rest/') ||
  pathname.startsWith('/admin/') ||
  pathname.startsWith('/images/');

app.prepare().then(() => {
  createServer((req, res) => {
    // Be sure to pass `true` as the second argument to `url.parse`.
    // This tells it to parse the query portion of the URL.
    const parsedUrl    = parse(req.url, true);
    const { pathname } = parsedUrl;

    if (pathNeedsProxy(pathname)) {
      // req.url = req.url.slice('/api/'.length);
      /**
       * TODO 考虑其他的登录认证解决方案。
       * 目前后台登录服务在登录成功后会给请求加上相应的 cookie（即返回带有 set-cookie 的响应）。
       * 前端再进行登录时会返回 302 请求跳转到首页。
       * 由于前端是 api 请求，目前无法很好的处理该种情况，暂时清理 auth 模块的 cookie。
       */
      if (req.url.startsWith('/admin/auth')) {
        req.headers.cookie = '';
      }
      proxy.web(req, res, { target: configurator.loadConfig('PROXY_API') }, (e) => {
        console.error('PROXY_API ERROR!', e.stack);
      });
    } else {
      handle(req, res, parsedUrl);
    }
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
    console.log(`> ENV: ${process.env.NODE_ENV}`);
  });
});
