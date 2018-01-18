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

app.prepare().then(() => {
  createServer((req, res) => {
    // Be sure to pass `true` as the second argument to `url.parse`.
    // This tells it to parse the query portion of the URL.
    const parsedUrl    = parse(req.url, true);
    const { pathname } = parsedUrl;

    if (pathname.startsWith('/rest/')) {
      // req.url = req.url.slice('/api/'.length);
      // console.log('call', req.url);
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
