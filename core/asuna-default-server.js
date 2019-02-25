require('colors');
const util = require('util');
const debug = require('debug');
const { createServer } = require('http');
const { createProxyServer } = require('http-proxy');
const { parse } = require('url');
const next = require('next');

debug.enable('http,error');
const logger = { log: debug('http'), error: debug('error') };
const configs = require('./config');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;
const app = next({ dev });
const handle = app.getRequestHandler();
const proxy = createProxyServer({});

proxy.on('error', (error, request, response) => {
  logger.error(`${new Date().toISOString().dim} proxy error`, { error });
  if (response && !response.headersSent) {
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

function bootstrap() {
  app.prepare().then(() => {
    createServer((req, res) => {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      if (configs && configs.proxy) {
        const proxyConfig = configs.proxy.find(config => pathname.startsWith(config.pathname));
        logger.log(
          `${new Date().toISOString().dim} ${req.method.bold} ${req.url}`,
          proxyConfig ? util.inspect(proxyConfig, { colors: true }) : 'direct'.cyan,
        );
        if (proxyConfig && proxyConfig.redirectTo) {
          const redirectTo = proxyConfig.redirectTo(req);
          res.writeHead(302, {
            Location: redirectTo,
          });
          res.end();
          // handle(req, res, parsedUrl);
          return;
        }

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
      logger.log(`> Ready on http://localhost:${port}`.bgRed.black.bold);
      logger.log(`> NODE_ENV: ${process.env.NODE_ENV}`.bgRed.black.bold);
      logger.log(`> ENV: ${process.env.ENV}`.bgRed.black.bold);
    });
  });
}

module.exports = { bootstrap };
