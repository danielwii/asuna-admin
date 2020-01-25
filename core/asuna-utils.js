// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/explicit-function-return-type */
const debug = require('debug');
const url = require('url');
const { createProxyServer } = require('http-proxy');

const logger = { log: debug('http'), error: debug('error'), debug: debug('debug') };
const debugNamespaces = [];

function enableDebug(...namespaces) {
  debugNamespaces.push(...namespaces);
  logger.debug('enable debug', debugNamespaces);
  debug.enable(debugNamespaces.join());
}

enableDebug('http', 'error');

function createProxy(api) {
  const parsedUrl = url.parse(api);
  const proxy = createProxyServer({
    changeOrigin: true,
    target:
      parsedUrl.protocol === 'https'
        ? {
            protocol: 'https',
            host: parsedUrl.host,
            port: parsedUrl.port,
          }
        : null,
  });
  proxy.on('error', (error, request, response) => {
    logger.error(`${new Date().toISOString().dim} ${request.method.bold} ${request.url} `, error);
    if (response && !response.headersSent) {
      response.writeHead(500, { 'content-type': 'application/json' });
    }
    if (error.code === 'ECONNREFUSED') {
      response.end(JSON.stringify({ message: 'Sorry, our API server is down. Please come back later.' }));
    } else {
      response.end(JSON.stringify({ error, message: error.message }));
    }
  });

  proxy.on('upgrade', function(req, socket, head) {
    proxy.ws(req, socket, head);
  });
  return proxy;
}

module.exports = { createProxy, enableDebug };
