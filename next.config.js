const webpack              = require('webpack');
const Jarvis               = require('webpack-jarvis');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const withTypescript       = require('@zeit/next-typescript');
const TsconfigPathsPlugin  = require('tsconfig-paths-webpack-plugin');

const jarvis                   = new Jarvis({ port: 1337 });
const bundleAnalyzerPlugin     = new BundleAnalyzerPlugin({ openAnalyzer: false });
const contextReplacementPlugin = new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /zh/);
const tsconfigPathsPlugin      = new TsconfigPathsPlugin();

module.exports = withTypescript({
  webpack: (config, options) => {
    const { dev, isServer, buildId } = options;
    console.log(`> [webpack] [${isServer ? 'Server' : 'Client'}] ...`);

    if (buildId) {
      console.log('> [webpack] building...', buildId);
    }

    config.plugins         = config.plugins || [];
    config.resolve.plugins = config.resolve.plugins || [];

    if (isServer) {
      if (dev) {
        config.plugins.push(jarvis);
        config.plugins.push(bundleAnalyzerPlugin);
      }
    } else {
      if (!dev) {
        // enable source-map in production mode
        // config.devtool = 'source-map';

        // https://github.com/zeit/next.js/issues/1582
        config.plugins = config.plugins.filter(plugin => {
          return plugin.constructor.name !== 'UglifyJsPlugin';
        });
      }

      // Fixes npm packages that depend on `fs` module
      config.node = { fs: 'empty' };
    }

    config.module.rules.push({
      test: /\.css$/, use: [{
        loader : 'postcss-loader',
        options: {
          plugins: function () {
            return [
              require('postcss-import')(),
              require('autoprefixer')()
            ];
          }
        }
      }]
    });

    config.resolve.plugins.push(tsconfigPathsPlugin);

    // https://github.com/moment/moment/issues/2517
    config.plugins.push(contextReplacementPlugin);

    // fix `react-dom/server could not be resolved` issue in next v5.0.0
    // delete config.resolve.alias['react-dom'];

    return config;
  },

  serverRuntimeConfig: {
    isServer: true,
  },

  publicRuntimeConfig: {},
});
