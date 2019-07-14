/* eslint-disable import/no-extraneous-dependencies,no-console,no-param-reassign,no-unused-vars */
const webpack = require('webpack');
const Jarvis = require('webpack-jarvis');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const pkg = require('./package.json');

const jarvis = new Jarvis({ port: 1337 });
const bundleAnalyzerPlugin = new BundleAnalyzerPlugin({ openAnalyzer: false });
const contextReplacementPlugin = new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /zh/);
const tsconfigPathsPlugin = new TsconfigPathsPlugin({
  logLevel: 'info',
});

// fix: prevents error when .css files are required by node
if (typeof require !== 'undefined') {
  require.extensions['.css'] = file => {};
}

function withDefaultNextConfigs(nextConfig = {}) {
  return Object.assign({}, nextConfig, {
    webpack(config, options) {
      const { dev, isServer, buildId } = options;
      if (!isServer && buildId) {
        console.log('> [webpack] building...', buildId);
      }

      console.log(`> [webpack] [${isServer ? 'Server' : 'Client'}] ...`);

      config.plugins = config.plugins || [];
      config.resolve.plugins = config.resolve.plugins || [];

      if (isServer) {
        if (dev) {
          console.log('> [webpack] [Server] load jarvis & bundleAnalyzerPlugin...');
          config.plugins.push(jarvis);
          config.plugins.push(bundleAnalyzerPlugin);
        }
      } else {
        if (!dev) {
          // enable source-map in production mode
          // config.devtool = 'source-map';

          // https://github.com/zeit/next.js/issues/1582
          config.plugins = config.plugins.filter(
            plugin => plugin.constructor.name !== 'UglifyJsPlugin',
          );
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
  });
}

module.exports = { withDefaultNextConfigs };
