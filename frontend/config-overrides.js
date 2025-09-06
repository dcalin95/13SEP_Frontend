const webpack = require("webpack");

module.exports = function override(config) {
  config.resolve = {
    ...config.resolve,
    fallback: {
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer"),
      crypto: require.resolve("crypto-browserify"),
      assert: require.resolve("assert"),
      util: require.resolve("util"),
      process: require.resolve("process/browser"),
      http: require.resolve("http-browserify"),
      https: require.resolve("https-browserify"),
      os: require.resolve("os-browserify/browser"),
      path: require.resolve("path-browserify"),
      url: require.resolve("url/"),
      zlib: require.resolve("browserify-zlib"),
      fs: false
    },
  };

  // Add module rules for .mjs files
  config.module.rules.push({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false
    }
  });

  config.plugins = [
    ...(config.plugins || []),
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser"
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env)
    })
  ];

  return config;
};
