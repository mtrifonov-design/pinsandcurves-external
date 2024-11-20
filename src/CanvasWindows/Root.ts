import Box from "./Box";
import { CanvasWindow } from "./CanvasWindow";
import { render, mouseDownHandler, mouseMoveHandler, mouseUpHandler, mouseWheelHandler, clickHandler } from "./Render";

// function getWindows(root: CanvasWindow) : CanvasWindow[] {
//     const getWindowsRecursive = (window: CanvasWindow) : CanvasWindow[] => {
//         const children = window.getChildrenPrimitive();
//         return [window, ...children.flatMap(getWindowsRecursive)];
//     };
//     return getWindowsRecursive(root);
// }

type KeyArray = string[];

function setParents(windows: CanvasWindow[]) {
    const processedWindows : [CanvasWindow, KeyArray, number][] = windows.map(w => {
        const keyArray = w.globalKey.split('@');
        const depth = keyArray.length;
        return [w, keyArray, depth];
    });
    const windowDict: {
        [key: string]: CanvasWindow | undefined
    } = windows.reduce((acc, w) => {
        acc[w.globalKey] = w;
        return acc;
    }, {} as { [key: string]: CanvasWindow | undefined });

    processedWindows.forEach(([w, keyArray, depth]) => {
        if (depth === 1) {
            w._parent = undefined;
        } else {
            const parentKey = keyArray.slice(0, -1).join('@');
            w._parent = windowDict[parentKey];
        }
    });
}

function setChildren(windows: CanvasWindow[]) {
    const processedWindows : [CanvasWindow, KeyArray, number][] = windows.map(w => {
        const keyArray = w.globalKey.split('@');
        const depth = keyArray.length;
        return [w, keyArray, depth];
    });

    const windowDict: {
        [key: string]: CanvasWindow | undefined
    } = windows.reduce((acc, w) => {
        acc[w.globalKey] = w;
        return acc;
    }, {} as { [key: string]: CanvasWindow | undefined });

    processedWindows.forEach(([w, keyArray, depth]) => {
        if (depth === 1) {
            w.children = [];
        } else {
            const parentKey = keyArray.slice(0, -1).join('@');
            const parent = windowDict[parentKey];
            if (parent) {
                parent.children.push(w);
            }
        }
    });
}

class CanvasRoot {
    root: CanvasWindow;
    canvas: HTMLCanvasElement;
    cameraSnapshot: Box;
    windows: CanvasWindow[] = [];

    constructor(root: CanvasWindow, canvas: HTMLCanvasElement) {
        this.root = root;
        this.canvas = canvas;
        this.cameraSnapshot = new Box([0,0],canvas.width, canvas.height);
    }

    private updateWindowsAndCamera() {
        const existingWindowsMap: { [key: string]: CanvasWindow } = this.windows.reduce((acc, w) => {
            acc[w.globalKey] = w;
            return acc;
        } , {} as { [key: string]: CanvasWindow });

        const getWindowsRecursive = (window: CanvasWindow) : CanvasWindow[] => {
            const children = window.getChildrenPrimitive(existingWindowsMap);
            return [window, ...children.flatMap(getWindowsRecursive)];
        }

        const newWindows = getWindowsRecursive(this.root);

        this.windows = newWindows;

        this.windows.forEach(w => w.connectDisplay(this.cameraSnapshot, this.canvas));
        const camera = this.windows.find(w => w._isPrimaryCamera);
        if (camera) {
            this.cameraSnapshot = new Box([...camera.globalO], camera.w, camera.h);
            this.windows.forEach(w => w.connectDisplay(this.cameraSnapshot, this.canvas));
        }
    }

    updateExternalState(...args: any[]) {
        this.windows.forEach(w => w.updateExternalState(...args));
    }

    render() {
        this.updateWindowsAndCamera();
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2d context from canvas");
        render(this.cameraSnapshot, this.windows, this.canvas, ctx);
    }

    mouseDownHandler(mousePos: [number, number], e: MouseEvent) {
        this.updateWindowsAndCamera();
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2d context from canvas");
        mouseDownHandler(this.cameraSnapshot, this.windows, this.canvas, mousePos, e);
    }

    mouseMoveHandler(mousePos: [number, number], e: MouseEvent) {
        this.updateWindowsAndCamera();
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2d context from canvas");
        mouseMoveHandler(this.cameraSnapshot, this.windows, this.canvas, mousePos, e);
    }

    mouseUpHandler(mousePos: [number, number], e: MouseEvent) {
        this.updateWindowsAndCamera();
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2d context from canvas");
        mouseUpHandler(this.cameraSnapshot, this.windows, this.canvas, mousePos, e);
    }

    mouseWheelHandler(e: WheelEvent) {
        this.updateWindowsAndCamera();
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2d context from canvas");
        mouseWheelHandler(this.cameraSnapshot, this.windows, this.canvas, e);
    }

    clickHandler(mousePos: [number, number], e: MouseEvent) {
        this.updateWindowsAndCamera();
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2d context from canvas");
        clickHandler(this.cameraSnapshot, this.windows, this.canvas, mousePos, e);
    }
}

export default CanvasRoot;

