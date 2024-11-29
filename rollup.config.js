import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import terser from "@rollup/plugin-terser";
import peerDepsExternal from "rollup-plugin-peer-deps-external";

const packageJson = require("./package.json");

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: packageJson.exports["."].require,
        format: "cjs",
        sourcemap: true,
      },
      {
        file: packageJson.exports["."].import,
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }),
      terser(),
    ],
    // external: ["react", "react-dom"],
  },
  {
    input: "src/CanvasWindows/index.ts",
    output: [
      {
        file: packageJson.exports["./CanvasWindows"].require,
        format: "cjs",
        sourcemap: true,
      },
      {
        file: packageJson.exports["./CanvasWindows"].import,
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }),
      terser(),
    ],
    // external: ["react", "react-dom"],
  },
  {
    input: "src/index.ts",
    output: [{ 
      file: "dist/types/types.d.ts",
      format: "es",
      sourcemap: true,
    }],
    plugins: [dts.default()],
  },
  {
    input: "src/CanvasWindows/index.ts",
    output: [{ 
      file: packageJson.exports["./CanvasWindows"].types,
      format: "es",
      sourcemap: true,
    }],
    plugins: [dts.default()],
  },
];