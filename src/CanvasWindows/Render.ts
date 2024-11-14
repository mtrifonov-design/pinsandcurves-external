import {CanvasWindow} from "./CanvasWindow";
import Box from "./Box";

function windowsIntersect(A: Box, B: Box) {
    const a = A.getBoundingBox();
    const b = B.getBoundingBox();

    const [ax1, ay1, ax2, ay2] = [a[0][0], a[0][1], a[2][0], a[2][1]];
    const [bx1, by1, bx2, by2] = [b[0][0], b[0][1], b[2][0], b[2][1]];

    if (ax1 > bx2 || ax2 < bx1) return false;
    if (ay1 > by2 || ay2 < by1) return false;
    return true;
}

function render(camera: CanvasWindow, windows: CanvasWindow[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    // Check which windows intersect with the camera
    windows.forEach(w => w.connectDisplay(camera,canvas));
    const intersectingWindows = windows.filter(w => windowsIntersect(w, camera));
    intersectingWindows.sort((a, b) => a.getLayer() - b.getLayer());
    for (let w of intersectingWindows) {
        w.renderPrimitive(ctx);
    }
    windows.forEach(w => w.disconnectDisplay());
}

function clickHandler(camera: CanvasWindow, windows: CanvasWindow[], canvas: HTMLCanvasElement, mousePos: [number, number]) {
    windows.forEach(w => w.connectDisplay(camera,canvas));
    const intersectingWindows = windows.filter(w => windowsIntersect(w, camera));
    intersectingWindows.sort((a, b) => b.getLayer() - a.getLayer());
    let running = true;
    const terminateEvent = () => {running = false;}
    for (let w of intersectingWindows) {
        w.onClickPrimitive(mousePos,terminateEvent);
        if (!running) break;
    }
    windows.forEach(w => w.disconnectDisplay());
}

function mouseDownHandler(camera: CanvasWindow, windows: CanvasWindow[],canvas: HTMLCanvasElement, mousePos: [number, number]) {
    windows.forEach(w => w.connectDisplay(camera,canvas));
    const intersectingWindows = windows.filter(w => windowsIntersect(w, camera));
    intersectingWindows.sort((a, b) => b.getLayer() - a.getLayer());
    let running = true;
    const terminateEvent = () => {running = false;}
    for (let w of intersectingWindows) {
        w.onMouseDownPrimitive(mousePos,terminateEvent);
        if (!running) break;
    }
    windows.forEach(w => w.disconnectDisplay());
}

function mouseMoveHandler(camera: CanvasWindow, windows: CanvasWindow[],canvas: HTMLCanvasElement, mousePos: [number, number]) {
    windows.forEach(w => w.connectDisplay(camera,canvas));
    const intersectingWindows = windows.filter(w => windowsIntersect(w, camera));
    intersectingWindows.sort((a, b) => b.getLayer() - a.getLayer());
    let running = true;
    const terminateEvent = () => {running = false;}
    for (let w of intersectingWindows) {
        w.onMouseMovePrimitive(mousePos,terminateEvent);
        if (!running) break;
    }
    windows.forEach(w => w.disconnectDisplay());
}

function mouseUpHandler(camera: CanvasWindow, windows: CanvasWindow[],canvas: HTMLCanvasElement, mousePos: [number, number]) {
    windows.forEach(w => w.connectDisplay(camera,canvas));
    const intersectingWindows = windows.filter(w => windowsIntersect(w, camera));
    intersectingWindows.sort((a, b) => b.getLayer() - a.getLayer());
    let running = true;
    const terminateEvent = () => {running = false;}
    for (let w of intersectingWindows) {
        w.onMouseUpPrimitive(mousePos,terminateEvent);
        if (!running) break;
    }
    windows.forEach(w => w.disconnectDisplay());
}

export { render, clickHandler, mouseDownHandler, mouseMoveHandler, mouseUpHandler, windowsIntersect };
