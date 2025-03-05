import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import commonjs from "@rollup/plugin-commonjs";
import alias from "@rollup/plugin-alias";
import copy from "rollup-plugin-cpy";

const common = {
  external: [
    "log",
    "http-request",
    "crypto",
    "create-response",
    "html-rewriter",
    "cookies",
  ],
  plugins: [alias(), resolve(), commonjs(), json()],
};
export default [
  {
    input: "./src/index.js",
    output: {
      name: "main",
      file: "dist/main.js",
      format: "esm",
      sourcemap: false,
      inlineDynamicImports: true,
    },
    external: common.external,
    plugins: [
      copy({
        files: ["src/bundle.json"],
        dest: "dist",
      }),
      ...common.plugins,
    ],
  }
];
