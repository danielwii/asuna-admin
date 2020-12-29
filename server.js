/* eslint-disable @typescript-eslint/no-require-imports */
const { bootstrap } = require('./asuna-default-koa-server');
const configs = require('./config');

bootstrap({ root: __dirname, opts: configs, enableGraphQL: false });
