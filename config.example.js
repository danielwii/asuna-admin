/* eslint-disable @typescript-eslint/no-var-requires */
const { createConfigLoader } = require('node-buffs');

const configurator = createConfigLoader({
  requiredVariables: ['PROXY_API'],
});

const PROXY_API = configurator.loadConfig('PROXY_API');

/**
 * proxy[]: { pathname: 请求地址, dest?: (req) => string: 重定向地址, target: 代理域名 }
 * @type {{proxy: *[]}}
 */
module.exports = {
  configurator,
  proxy: [],
  graphql: { dest: () => 'graphql', target: PROXY_API },
};
