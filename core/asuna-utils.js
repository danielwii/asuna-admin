const debug = require('debug');
const { createProxyServer } = require('http-proxy');

const logger = { log: debug('http'), error: debug('error'), debug: debug('debug') };
const debugNamespaces = [];

function enableDebug(...namespaces) {
  debugNamespaces.push(...namespaces);
  logger.debug('enable debug', debugNamespaces);
  debug.enable(debugNamespaces.join());
}

enableDebug('http', 'error');

function createProxy() {
  const proxy = createProxyServer({});
  proxy.on('error', (error, request, response) => {
    logger.error(`${new Date().toISOString().dim} ${request.method.bold} ${request.url} `, error);
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
  return proxy;
}

module.exports = { createProxy, enableDebug };
