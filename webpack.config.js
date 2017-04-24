// webpack.config.js
const webpack = require('webpack'),
      path = require('path'),
      HtmlWebpackPlugin = require("html-webpack-plugin"),
      CopyWebpackPlugin = require('copy-webpack-plugin'),
      CSSTreeShakePlugin = require('css-tree-shake-plugin')
      ExtractTextPlugin = require('extract-text-webpack-plugin')

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
               use: ['style-loader','css-loader'],
              // //  use: ExtractTextPlugin.extract({
              // //   use: 'css-loader'
              //  })
               },{
                    test: /\.(png|jpg|gif|svg|eot)$/,
                    loader: 'url-loader'
               },
               {
                // Match woff2 in addition to patterns like .woff?v=1.1.1.
                test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url-loader',
                options: {
                  limit: 500,
                  mimetype: 'application/font-woff',
                  name: './fonts/[name].[ext]',
                },
              }
    ],

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
     new CSSTreeShakePlugin({showInfo: true, remove: true}),
     new ExtractTextPlugin('styles.css')
    //new webpack.HotModuleReplacementPlugin()
  ]
}
