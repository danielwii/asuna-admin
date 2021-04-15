/* eslint-disable @typescript-eslint/no-var-requires */
const { createConfigLoader } = require('node-buffs');

const configurator = createConfigLoader({
  requiredVariables: ['API_ENDPOINT'],
});

const API_ENDPOINT = configurator.loadConfig('API_ENDPOINT');

/**
 * proxy[]: { pathname: 请求地址, dest?: (req) => string: 重定向地址, target: 代理域名 }
 * @type {{proxy: *[]}}
 */
module.exports = {
  configurator,
  proxy: [],
  graphql: { dest: () => 'graphql', target: API_ENDPOINT },
};
