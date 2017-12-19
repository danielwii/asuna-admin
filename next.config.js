module.exports = {
  webpack: (config) => {
    // Fixes npm packages that depend on `fs` module
    config.node = {
      fs: 'empty',
    };

    // config.module.rules.push({
    //   test: /(\.css$)/,
    //   loaders: ['style-loader', 'css-loader', 'postcss-loader'],
    // });

    // config.module.rules.push({
    //   test: /\.(png|woff|woff2|eot|ttf|svg)$/,
    //   loader: 'url-loader?limit=100000',
    // });

    // config.module.rules.push({
    //   test   : /\.(css|scss)/,
    //   loader : 'emit-file-loader',
    //   options: {
    //     name: 'dist/[path][name].[ext]'
    //   }
    // });

    // config.module.rules.push({
    //   test: /\.css$/,
    //   use : ['babel-loader', 'raw-loader', 'postcss-loader'],
    // });

    return config;
  },
};
