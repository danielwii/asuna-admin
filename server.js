/* eslint-disable no-console */

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const { createServer } = require('http');
const { createProxyServer } = require('http-proxy');
const { parse } = require('url');
const next = require('next');
const { createConfigLoader } = require('node-buffs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const proxy = createProxyServer({});
const configurator = createConfigLoader({
  requiredVariables: ['PROXY_API'],
});

proxy.on('error', (error, request, response) => {
  console.error('proxy error', error);
  if (!response.headersSent) {
    response.writeHead(500, { 'content-type': 'application/json' });
  }
  if (error.code === 'ECONNREFUSED') {
    response.end(
      JSON.stringify({ message: 'Sorry, our API server is down. Please come back later.' }),
    );
  } else {
    response.end(JSON.stringify({ error, message: error.message }));
  }
});

const pathNeedsProxy = pathname =>
  pathname.startsWith('/socket.io/') ||
  pathname.startsWith('/api/') ||
  pathname.startsWith('/rest/') ||
  pathname.startsWith('/admin/');

app.prepare().then(() => {
  createServer((req, res) => {
    // Be sure to pass `true` as the second argument to `url.parse`.
    // This tells it to parse the query portion of the URL.
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    if (pathNeedsProxy(pathname)) {
      proxy.web(req, res, { target: configurator.loadConfig('PROXY_API') });
    } else {
      handle(req, res, parsedUrl);
    }
  }).listen(3000, err => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
    console.log(`> NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`> ENV: ${process.env.ENV}`);
  });
});
