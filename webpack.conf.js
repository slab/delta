module.exports = {
  entry: {
    delta: "./src/delta.ts",
    op: "./src/op.ts"
  },
  output: {
    filename: "[name].js",
    path: __dirname + "/dist"
  },
  resolve: {
    extensions: [".js", ".ts"]
  },
  module: {
    rules: [{ test: /\.ts$/, use: "ts-loader" }]
  },
  devtool: "source-map",
  mode: "production"
};
