require('colors');
const util = require('util');
const Koa = require('koa');
const Router = require('koa-router');
const { parse } = require('url');
const next = require('next');
const debug = require('debug');

const logger = { log: debug('http'), error: debug('error') };
const { createProxy } = require('./asuna-utils');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

function bootstrap({ root, opts }) {
  const PROXY_API = opts.configurator.loadConfig('PROXY_API');
  app.prepare().then(() => {
    const server = new Koa();
    const proxy = createProxy();

    // --------------------------------------------------------------
    // setup graphql
    // --------------------------------------------------------------

    let graphqlPath;
    if (opts.enableGraphQL) {
      const applyMiddleware = require('./server/graphql/apollo-koa-server');
      const graphqlMiddleware = applyMiddleware(server, { root, dev });
      graphqlPath = graphqlMiddleware.graphqlPath;
    }

    // --------------------------------------------------------------
    // setup routes
    // --------------------------------------------------------------

    const router = new Router();

    router.all('/s-graphql', async ctx => {
      const { req, res } = ctx;
      await new Promise((resolve, reject) => {
        let target = PROXY_API;
        if (opts.graphql) {
          req.url = opts.graphql.dest ? opts.graphql.dest() : 'graphql';
          target = opts.graphql.target ? opts.graphql.target : PROXY_API;
        }
        proxy.web(req, res, { target }, e => (e ? reject(e) : resolve()));
      });
    });

    router.all('*', async ctx => {
      const { req, res } = ctx;
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      if (opts && opts.proxy) {
        const proxyConfig = opts.proxy.find(config => pathname.startsWith(config.pathname));
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
          return;
        }

        if (proxyConfig) {
          if (proxyConfig.dest) {
            req.url = proxyConfig.dest(req);
          }
          // proxy.web(req, res, { target: proxyConfig.target });
          await new Promise((resolve, reject) => {
            proxy.web(req, res, { target: proxyConfig.target }, e => (e ? reject(e) : resolve()));
          });
        } else {
          await handle(req, res);
        }
      } else {
        logger.log(
          `${new Date().toISOString().dim} ${req.method.bold} ${req.url}`,
          'direct'.magenta,
        );
        await handle(req, res);
      }
      ctx.respond = false;
    });

    server.use(async (ctx, _next) => {
      ctx.res.statusCode = 200;
      await _next();
    });

    server.use(router.routes());

    server.listen(port, err => {
      if (err) throw err;
      if (opts.enableGraphQL) {
        logger.log(`> 🚀 GraphQL Ready at http://localhost:${port}${graphqlPath}`.bgRed.black.bold);
      }
      logger.log(`> 🚀 Ready at http://localhost:${port}`.bgRed.black.bold);
      logger.log(`> NODE_ENV: ${process.env.NODE_ENV}`.bgRed.black.bold);
      logger.log(`> ENV: ${process.env.ENV}`.bgRed.black.bold);
    });
  });
}

module.exports = { bootstrap };
