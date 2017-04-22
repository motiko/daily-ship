// webpack.config.js
const webpack = require('webpack'),
      path = require("path"),
      fileSystem = require("fs"),
      HtmlWebpackPlugin = require("html-webpack-plugin"),
      WriteFilePlugin = require("write-file-webpack-plugin"),
      CopyWebpackPlugin = require('copy-webpack-plugin')

let alias = {};

let secretsPath = path.join(__dirname, ("secrets.js"));

if (fileSystem.existsSync(secretsPath)) {
  alias["secrets"] = secretsPath;
}

module.exports = {
  entry: {
    popup: './app/popup.js',
    background: './app/background.js'
  },
  output: {
    filename: '[name].js',
    path: 'dist'
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
  resolve: {
    alias: alias
  },
  devtool: 'cheap-module-eval-source-map',
  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "app", "popup.html"),
      filename: "popup.html",
      chunks: ["popup"]
    }),
    new CopyWebpackPlugin([
            { from: 'app/img',
              to: "img"},
            { from: 'app/manifest.json',
              to: "manifest.json"}
        ])
  ]
}
