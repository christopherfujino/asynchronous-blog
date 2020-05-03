const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = { // arg is env
  devtool: "inline-source-map",
  entry: "./src/app.js",
  //mode: "development",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    // Generates index.html
    new HtmlWebpackPlugin({
      template: "./src/index.html",
    }),
  ],
  module: {
    rules: [
      //{
      //  test: /\.css$/i,
      //  use: [
      //    "style-loader",
      //    "css-loader",
      //  ],
      //},
      //{
      //  test: /\.js$/i,
      //  exclude: /node_modules/,
      //  use: "babel-loader",
      //},
    ],
  },
  // Teach webpack how to resolve module imports
  // https://webpack.js.org/configuration/resolve/#root
  resolve: {
    extensions: [ ".js" ],
  }
};
