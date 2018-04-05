const webpack              = require('webpack');
const Jarvis               = require('webpack-jarvis');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const jarvis                   = new Jarvis({ port: 1337 });
const bundleAnalyzerPlugin     = new BundleAnalyzerPlugin({ openAnalyzer: false });
const contextReplacementPlugin = new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /zh/);

module.exports = {
  webpack: (config, options) => {
    const { dev, isServer, buildId } = options;
    console.log(`> [webpack] [${isServer ? 'Server' : 'Client'}] ...`, options);

    if (buildId) {
      console.log('> [webpack] building...', buildId);
    }

    config.plugins = config.plugins || [];

    if (isServer) {
      if (dev) {
        config.plugins.push(jarvis);
        config.plugins.push(bundleAnalyzerPlugin);
      }
    } else {
      if (!dev) {
        config.devtool = 'source-map';

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

    // https://github.com/moment/moment/issues/2517
    config.plugins.push(contextReplacementPlugin);

    // fix `react-dom/server could not be resolved` issue in next v5.0.0
    // delete config.resolve.alias['react-dom'];

    return config;
  },

  webpackDevMiddleware: config => {
    console.log('> [webpackDevMiddleware] ...');
    // Perform customizations to webpack dev middleware config

    // Important: return the modified config
    return config;
  },

  serverRuntimeConfig: {
    isServer: true,
  },

  publicRuntimeConfig: {},
};
