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

function render(camera: Box, windows: CanvasWindow[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    // Check which windows intersect with the camera
    camera = new Box([...camera.o],camera.w,camera.h);
    const intersectingWindows = windows.filter(w => windowsIntersect(w, camera));
    intersectingWindows.sort((a, b) => a.getLayer() - b.getLayer());
    for (let w of intersectingWindows) {
        w.renderPrimitive(ctx);
    }
}

function clickHandler(camera: Box, windows: CanvasWindow[], canvas: HTMLCanvasElement, mousePos: [number, number], e: MouseEvent) {
    camera = new Box([...camera.o],camera.w,camera.h);
    const intersectingWindows = windows.filter(w => windowsIntersect(w, camera));
    intersectingWindows.sort((a, b) => b.getLayer() - a.getLayer());
    let running = true;
    const terminateEvent = () => {running = false;}
    for (let w of intersectingWindows) {
        w.onClickPrimitive(mousePos,terminateEvent,e);
        if (!running) break;
    }
}

function mouseDownHandler(camera: Box, windows: CanvasWindow[],canvas: HTMLCanvasElement, mousePos: [number, number], e: MouseEvent) {
    camera = new Box([...camera.o],camera.w,camera.h);
    const intersectingWindows = windows.filter(w => windowsIntersect(w, camera));
    intersectingWindows.sort((a, b) => b.getLayer() - a.getLayer());
    let running = true;
    const terminateEvent = () => {running = false;}
    for (let w of intersectingWindows) {
        w.onMouseDownPrimitive(mousePos,terminateEvent,e);
        if (!running) break;
    }
}

function mouseMoveHandler(camera: Box, windows: CanvasWindow[],canvas: HTMLCanvasElement, mousePos: [number, number], e: MouseEvent) {
    camera = new Box([...camera.o],camera.w,camera.h);
    const intersectingWindows = windows.filter(w => windowsIntersect(w, camera));
    intersectingWindows.sort((a, b) => b.getLayer() - a.getLayer());
    let running = true;
    const terminateEvent = () => {running = false;}
    for (let w of intersectingWindows) {
        w.onMouseMovePrimitive(mousePos,terminateEvent,e);
        if (!running) break;
    }
}

function mouseUpHandler(camera: Box, windows: CanvasWindow[],canvas: HTMLCanvasElement, mousePos: [number, number], e: MouseEvent) {
    camera = new Box([...camera.o],camera.w,camera.h);
    const intersectingWindows = windows.filter(w => windowsIntersect(w, camera));
    intersectingWindows.sort((a, b) => b.getLayer() - a.getLayer());
    let running = true;
    const terminateEvent = () => {running = false;}
    for (let w of intersectingWindows) {
        w.onMouseUpPrimitive(mousePos,terminateEvent,e);
        if (!running) break;
    }
}

function mouseWheelHandler(camera: Box, windows: CanvasWindow[],canvas: HTMLCanvasElement, e: WheelEvent) {
    camera = new Box([...camera.o],camera.w,camera.h);
    const intersectingWindows = windows.filter(w => windowsIntersect(w, camera));
    intersectingWindows.sort((a, b) => b.getLayer() - a.getLayer());
    let running = true;
    const terminateEvent = () => {running = false;}
    for (let w of intersectingWindows) {
        w.onWheelPrimitive(terminateEvent,e);
        if (!running) break;
    }
}


export { render, clickHandler, mouseDownHandler, mouseMoveHandler, mouseUpHandler, mouseWheelHandler, windowsIntersect };
