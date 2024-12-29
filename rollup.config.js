import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import terser from "@rollup/plugin-terser";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import replace from "@rollup/plugin-replace";

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
    input: "src/InterpolateSignalValue/index.ts",
    output: [
      {
        file: packageJson.exports["./InterpolateSignalValue"].require,
        format: "cjs",
        sourcemap: true,
      },
      {
        file: packageJson.exports["./InterpolateSignalValue"].import,
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
    input: "src/InterpolateSignalValue/BatchWorker.ts",
    output: [
      {
        file: packageJson.exports["./InterpolateSignalValue"].worker,
        format: "cjs",
        sourcemap: true,
      },
      {
        file: packageJson.exports["."].interpolateSignalValueWorker,
        format: "cjs",
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
  {
    input: "src/InterpolateSignalValue/index.ts",
    output: [{ 
      file: packageJson.exports["./InterpolateSignalValue"].types,
      format: "es",
      sourcemap: true,
    }],
    plugins: [dts.default()],
  },
  {
    input: "src/PinsAndCurvesHost/index.ts", // Entry point of your library
    output: [
      {
        file: "dist/PinsAndCurvesHost/PinsAndCurvesHost.umd.js", // The bundled file
        format: "umd", // Universal Module Definition (UMD)
        name: "PinsAndCurvesHost", // Name of the global variable in the browser
      },
    ],
    plugins: [resolve(), commonjs(), 
      replace({
        "process.env.NODE_ENV": JSON.stringify("production"), // Replace with "production" or "development"
        preventAssignment: true, // Required to suppress warnings
      }),
      typescript({ tsconfig: "./tsconfig.json" }),
      terser()],
  },
  {
    input: "src/PinsAndCurvesSVGHost/index.ts", // Entry point of your library
    output: [
      {
        file: "dist/PinsAndCurvesSVGHost/PinsAndCurvesSVGHost.umd.js", // The bundled file
        format: "umd", // Universal Module Definition (UMD)
        name: "PinsAndCurvesSVGHost", // Name of the global variable in the browser
      },
    ],
    plugins: [resolve(), commonjs(), 
      replace({
        "process.env.NODE_ENV": JSON.stringify("production"), // Replace with "production" or "development"
        preventAssignment: true, // Required to suppress warnings
      }),
      typescript({ tsconfig: "./tsconfig.json" }),
      terser()],
  },
  {
    input: "src/PinsAndCurvesServer/index.ts", // Entry point of your library
    output: [
      {
        file: "dist/PinsAndCurvesServer/PinsAndCurvesServer.umd.js", // The bundled file
        format: "umd", // Universal Module Definition (UMD)
        name: "PinsAndCurves", // Name of the global variable in the browser
      },
    ],
    plugins: [resolve(), commonjs(), 
      replace({
        "process.env.NODE_ENV": JSON.stringify("production"), // Replace with "production" or "development"
        preventAssignment: true, // Required to suppress warnings
      }),
      typescript({ tsconfig: "./tsconfig.json" }),
      terser()],
  },
];