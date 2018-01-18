const Jarvis               = require('webpack-jarvis');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  webpack: (config) => {
    // Fixes npm packages that depend on `fs` module
    config.node = { fs: 'empty' };

    config.plugins = config.plugins || [];
    config.plugins.push(new Jarvis({ port: 1337 }));
    config.plugins.push(new BundleAnalyzerPlugin());

    config.module.rules.push({
      test: /\.css$/, use: [{
        loader : 'postcss-loader',
        options: {
          plugins: function () {
            return [
              require('postcss-import')(),
              require("autoprefixer")()
            ]
          }
        }
      }]
    });

    return config;
  },
};
