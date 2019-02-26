require('colors');
const util = require('util');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const { proxy, logger } = require('./asuna-utils');
const configs = require('./config');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

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
