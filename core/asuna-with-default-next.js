/* eslint-disable import/no-extraneous-dependencies,no-console,no-param-reassign,no-unused-vars */
const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const pkg = require('./package.json');

const contextReplacementPlugin = new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /zh/);
const tsconfigPathsPlugin = new TsconfigPathsPlugin({
  logLevel: 'info',
});

// fix: prevents error when .css files are required by node
if (typeof require !== 'undefined') {
  require.extensions['.css'] = file => {};
}

function withDefaultNextConfigs(nextConfig = {}) {
  return {
    ...nextConfig,
    webpack(config, options) {
      HACK_removeMinimizeOptionFromCssLoaders(config);

      const { dev, isServer, buildId } = options;
      if (!isServer && buildId) {
        console.log('> [webpack] building...', buildId);
      }

      console.log(`> [webpack] [${isServer ? 'Server' : 'Client'}] ...`);

      config.plugins = config.plugins || [];
      config.resolve.plugins = config.resolve.plugins || [];

      if (isServer) {
        if (dev) {
          console.log('> [webpack] [Server] load bundleAnalyzerPlugin...');
          // config.plugins.push(jarvis);
          config.plugins.push(new BundleAnalyzerPlugin({ openAnalyzer: false }));
        }
      } else {
        if (!dev) {
          // enable source-map in production mode
          // config.devtool = 'source-map';

          // https://github.com/zeit/next.js/issues/1582
          config.plugins = config.plugins.filter(plugin => plugin.constructor.name !== 'UglifyJsPlugin');
        }

        // Fixes npm packages that depend on `fs` module
        config.node = { fs: 'empty' };
      }

      config.resolve.plugins.push(tsconfigPathsPlugin);

      // https://github.com/moment/moment/issues/2517
      config.plugins.push(contextReplacementPlugin);

      return config;
    },

    serverRuntimeConfig: { isServer: true },

    publicRuntimeConfig: {
      env: process.env.ENV || 'dev',
      version: pkg.version,
    },
  };
}

/*
 * https://github.com/zeit/next-plugins/issues/541
 * ValidationError: Invalid options object.
 * CSS Loader has been initialised using an options object that does not match the API schema.
 * - options has an unknown property 'minimize'.
 * @param config
 * @constructor
 */
function HACK_removeMinimizeOptionFromCssLoaders(config) {
  console.warn('HACK: Removing `minimize` option from `css-loader` entries in Webpack config');
  config.module.rules.forEach(rule => {
    if (Array.isArray(rule.use)) {
      rule.use.forEach(u => {
        if (u.loader === 'css-loader' && u.options) {
          delete u.options.minimize;
        }
      });
    }
  });
}

module.exports = { withDefaultNextConfigs };
