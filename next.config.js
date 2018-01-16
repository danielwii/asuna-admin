const Jarvis = require('webpack-jarvis');

module.exports = {
  webpack: (config) => {
    // Fixes npm packages that depend on `fs` module
    config.node = {
      fs: 'empty',
    };

    config.plugins = config.plugins || [];
    config.plugins.push(new Jarvis({ port: 1337 }));

    return config;
  },
};
