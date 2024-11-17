import Box from "./Box";
import { CanvasWindow } from "./CanvasWindow";
import { render, mouseDownHandler, mouseMoveHandler, mouseUpHandler, mouseWheelHandler, clickHandler } from "./Render";

function getWindows(root: CanvasWindow) : CanvasWindow[] {
    const getWindowsRecursive = (window: CanvasWindow) : CanvasWindow[] => {
        const children = window.getChildrenPrimitive();
        return [window, ...children.flatMap(getWindowsRecursive)];
    };
    return getWindowsRecursive(root);
}

class CanvasRoot {
    root: CanvasWindow;
    canvas: HTMLCanvasElement;
    camera: CanvasWindow;
    windows: CanvasWindow[] = [];

    constructor(root: CanvasWindow, canvas: HTMLCanvasElement, camera: CanvasWindow) {
        this.root = root;
        this.canvas = canvas;
        this.camera = camera;
    }

    private updateWindows() {
        const newWindows = getWindows(this.root);
        const oldWindows = [...this.windows];

        // compare keys, if key is in newWindows but not in oldWindows, add it
        // if key is in oldWindows but not in newWindows, remove it
        // if key is in both, keep the old one
        const newWindowsKeys = newWindows.map(w => w.globalKey);
        const oldWindowsKeys = oldWindows.map(w => w.globalKey);
        const addedWindows = newWindows.filter(w => !oldWindowsKeys.includes(w.globalKey));
        const removedWindows = oldWindows.filter(w => !newWindowsKeys.includes(w.globalKey));
        this.windows = [...oldWindows.filter(w => !removedWindows.includes(w)), ...addedWindows,this.camera];
    }

    updateExternalState(...args: any[]) {
        this.updateWindows();
        this.windows.forEach(w => w.updateExternalState(...args));
    }

    render() {
        this.updateWindows();
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2d context from canvas");
        render(this.camera, this.windows, this.canvas, ctx);
    }

    mouseDownHandler(mousePos: [number, number], e: MouseEvent) {
        this.updateWindows();
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2d context from canvas");
        mouseDownHandler(this.camera, this.windows, this.canvas, mousePos, e);
    }

    mouseMoveHandler(mousePos: [number, number], e: MouseEvent) {
        this.updateWindows();
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2d context from canvas");
        mouseMoveHandler(this.camera, this.windows, this.canvas, mousePos, e);
    }

    mouseUpHandler(mousePos: [number, number], e: MouseEvent) {
        this.updateWindows();
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2d context from canvas");
        mouseUpHandler(this.camera, this.windows, this.canvas, mousePos, e);
    }

    mouseWheelHandler(e: WheelEvent) {
        this.updateWindows();
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2d context from canvas");
        mouseWheelHandler(this.camera, this.windows, this.canvas, e);
    }

    clickHandler(mousePos: [number, number], e: MouseEvent) {
        this.updateWindows();
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2d context from canvas");
        clickHandler(this.camera, this.windows, this.canvas, mousePos, e);
    }
}

export default CanvasRoot;

