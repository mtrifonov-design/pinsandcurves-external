import { defineConfig } from "vite";

export default defineConfig({
    root: "./src/CanvasWindows/demo/src",
    server: {
        port: 3000,
    },
    build: {
        outDir: "./src/CanvasWindows/demo/dist",
    },
});
