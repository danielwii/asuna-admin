/* eslint-disable @typescript-eslint/no-require-imports */
const configs = require('./config');
const { bootstrap } = require('./asuna-default-koa-server');

bootstrap({ root: __dirname, opts: configs, enableGraphQL: false });
