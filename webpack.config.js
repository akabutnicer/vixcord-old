const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");

module.exports = {
  devServer: {
    historyApiFallback: true,
    contentBase: "./",
    hot: true,
  },

  mode: "development",
  context: path.join(__dirname, "./"),
  entry: "./src/index.js",
  output: {
    path: path.join(__dirname, "build"),
    filename: "bundle.js",
  },
  watchOptions: {
    aggregateTimeout: 600,
  },
  module: {
    rules: [
      {
        test: /\.ts$/i,
        use: ["ts-loader", "babel-loader"],
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.jsx?$/,
        exclude: /(node_modules)/,
        include: path.join(__dirname, "src"),
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "Output Management2",
      template: "src/index.html",
    })
  ],
};
