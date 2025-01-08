import { defineConfig } from "vite";

// Define configurations for two different servers
const configA = defineConfig({
    root: "./src/CanvasWindows/demo/src",
    server: {
        port: 3000,
    },
    build: {
        outDir: "./src/CanvasWindows/demo/dist",
    },
});

const configB = defineConfig({
    root: "./src/PinsAndCurvesCanvasWindows/demo/src",
    server: {
        port: 4000,
    },
    build: {
        outDir: "./src/PinsAndCurvesCanvasWindows/demo/dist",
    },
});

const configC = defineConfig({
    root: "./src/PinsAndCurvesSVGHost/demo/src",
    server: {
        port: 5000,
    },
    build: {
        outDir: "./src/PinsAndCurvesSVGHost/demo/dist",
    },
});

const p5brush = defineConfig({
    root: "./src/demos/p5brush",
    server: {
        port: 6001,
    },
    build: {
        outDir: "./src/demos/p5brush/dist",
    },
});

const p5slinky = defineConfig({
    root: "./src/demos/p5slinky",
    server: {
        port: 6002,
    },
    build: {
        outDir: "./src/demos/p5slinky/dist",
    },
});

export default defineConfig(({ mode }) => {
    // Use the mode or environment variable to select the configuration
    let selectedConfig;
    switch (mode) {
        case "serverA":
            selectedConfig = configA;
            break;
        case "serverB":
            selectedConfig = configB;
            break;
        case "serverC":
            selectedConfig = configC;
            break;
        case "p5brush":
            selectedConfig = p5brush;
            break;
        case "p5slinky":
            selectedConfig = p5slinky;
            break;
        default:
            selectedConfig = configA;
    }

    return selectedConfig;
});
