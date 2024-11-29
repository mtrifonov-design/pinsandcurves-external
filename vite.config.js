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

export default defineConfig(({ mode }) => {
    // Use the mode or environment variable to select the configuration
    const selectedConfig = mode === "serverB" ? configB : configA;
    return selectedConfig;
});
