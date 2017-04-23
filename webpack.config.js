// webpack.config.js
const webpack = require('webpack'),
      HtmlWebpackPlugin = require("html-webpack-plugin"),
      CopyWebpackPlugin = require('copy-webpack-plugin')


module.exports = {
  entry: {
    popup: `${__dirname}/app/popup.js`,
    background: `${__dirname}/app/background.js`
  },
  output: {
    filename: '[name].js',
    path: `${__dirname}/dist`,
    sourceMapFilename: '[name].map'
  },

  module: {
    rules: [
              {
               test: /\.css$/,
               use: ['css-loader']
           },{
                test: /\.(jpg|png|gif)$/,
                use: 'file-loader'
           }
    ]
  },
  devtool: 'source-map',
  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
    }),
    new HtmlWebpackPlugin({
      template: `${__dirname}/app/popup.html`,
      filename: "popup.html",
      chunks: ["popup"]
    }),
    new CopyWebpackPlugin([
            { from: 'app/img',
              to: "img"},
            { from: 'app/manifest.json',
              to: "manifest.json"}
        ]),
    //new webpack.HotModuleReplacementPlugin()
  ]
}
