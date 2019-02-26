const debug = require('debug');
const { createProxyServer } = require('http-proxy');

debug.enable('http,error');
const logger = { log: debug('http'), error: debug('error') };
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

module.exports = { proxy, logger };
