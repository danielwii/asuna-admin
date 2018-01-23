module.exports = {
  node  : {
    fs: "empty"
  },
  module: {
    rules: [
      {
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
      }
    ]
  }
};
