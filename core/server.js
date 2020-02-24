/* eslint-disable @typescript-eslint/no-var-requires */
const { bootstrap } = require('./asuna-default-koa-server');
const configs = require('./config');

bootstrap({ root: __dirname, opts: configs, enableGraphQL: false });
