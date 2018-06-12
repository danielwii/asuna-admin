/* eslint-disable no-console */
const { createServer } = require('http');
const { createProxyServer } = require('http-proxy');
const { parse } = require('url');
const next = require('next');

const configs = (() => {
  try {
    // eslint-disable-next-line global-require
    return require('./config');
  } catch (e) {
    return null;
  }
})();

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;
const app = next({ dev });
const handle = app.getRequestHandler();
const proxy = createProxyServer({});

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

app.prepare().then(() => {
  createServer((req, res) => {
    // Be sure to pass `true` as the second argument to `url.parse`.
    // This tells it to parse the query portion of the URL.
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    if (configs && configs.proxy) {
      const proxyConfig = configs.proxy.find(config => pathname.startsWith(config.pathname));
      if (proxyConfig) {
        if (proxyConfig.dest) {
          req.url = proxyConfig.dest(req);
        }
        proxy.web(req, res, { target: proxyConfig.target });
      } else {
        handle(req, res, parsedUrl);
      }
    } else {
      handle(req, res, parsedUrl);
    }
  }).listen(port, err => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
    console.log(`> NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`> ENV: ${process.env.ENV}`);
  });
});
