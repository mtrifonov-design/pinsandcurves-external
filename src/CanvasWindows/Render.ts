import {CanvasWindow} from "./CanvasWindow";
import Box from "./Box";
import { Vec2, BoundingBox } from "./types";
import { boxesIntersect } from "./Utils";

function render(camera: Box, windows: CanvasWindow[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    // Check which windows intersect with the camera
    // console.log(camera)
    camera = new Box([...camera.o],camera.w,camera.h);
    const cameraBoundingBox = camera.getBoundingBox();
    const intersectingWindows = windows.filter(w => {return boxesIntersect(w.getBoundingBox() as BoundingBox, cameraBoundingBox as BoundingBox)});
    // console.log(intersectingWindows)
    // intersectingWindows.sort((a, b) => a.getLayer() - b.getLayer());

    const layers = Array.from(new Set(intersectingWindows.map(w => w.getLayer()))).sort((a, b) => a - b);
    for (let i = 0; i < layers.length; i++) {
        const layer = intersectingWindows.filter(w => w.getLayer() === layers[i]);
        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = canvas.width;
        layerCanvas.height = canvas.height;
        const layerCtx = layerCanvas.getContext('2d') as CanvasRenderingContext2D;
        for (let w of layer) {
            w.renderPrimitive(layerCtx);
        }
        ctx.drawImage(layerCanvas, 0, 0);
    }
}

function clickHandler(camera: Box, windows: CanvasWindow[], canvas: HTMLCanvasElement, mousePos: [number, number], e: MouseEvent) {
    camera = new Box([...camera.o],camera.w,camera.h);
    const cameraBoundingBox = camera.getBoundingBox();
    const intersectingWindows = windows.filter(w => {return boxesIntersect(w.getBoundingBox() as BoundingBox, cameraBoundingBox as BoundingBox)}).reverse();
    // intersectingWindows.sort((a, b) => b.getLayer() - a.getLayer());
    let running = true;
    const terminateEvent = () => {running = false;}
    for (let w of intersectingWindows) {
        w.onClickPrimitive(mousePos,terminateEvent,e);
        if (!running) break;
    }
}

function mouseDownHandler(camera: Box, windows: CanvasWindow[],canvas: HTMLCanvasElement, mousePos: [number, number], e: MouseEvent) {
    // console.log(windows)
    camera = new Box([...camera.o],camera.w,camera.h);
    const cameraBoundingBox = camera.getBoundingBox();
    const intersectingWindows = windows.filter(w => {return boxesIntersect(w.getBoundingBox() as BoundingBox, cameraBoundingBox as BoundingBox)}).reverse();
    // intersectingWindows.sort((a, b) => b.getLayer() - a.getLayer());
    let running = true;
    // console.log(intersectingWindows)
    const terminateEvent = () => {running = false;}
    for (let w of intersectingWindows) {
        w.onMouseDownPrimitive(mousePos,terminateEvent,e);
        if (!running) break;
    }
}

function mouseMoveHandler(camera: Box, windows: CanvasWindow[],canvas: HTMLCanvasElement, mousePos: [number, number], e: MouseEvent) {
    camera = new Box([...camera.o],camera.w,camera.h);
    const cameraBoundingBox = camera.getBoundingBox();
    const intersectingWindows = windows.filter(w => {return boxesIntersect(w.getBoundingBox() as BoundingBox, cameraBoundingBox as BoundingBox)}).reverse();
    // intersectingWindows.sort((a, b) => b.getLayer() - a.getLayer());
    let running = true;
    const terminateEvent = () => {running = false;}
    for (let w of intersectingWindows) {
        w.onMouseMovePrimitive(mousePos,terminateEvent,e);
        if (!running) break;
    }
}

function mouseUpHandler(camera: Box, windows: CanvasWindow[],canvas: HTMLCanvasElement, mousePos: [number, number], e: MouseEvent) {
    camera = new Box([...camera.o],camera.w,camera.h);
    const cameraBoundingBox = camera.getBoundingBox();
    const intersectingWindows = windows.filter(w => {return boxesIntersect(w.getBoundingBox() as BoundingBox, cameraBoundingBox as BoundingBox)}).reverse();
    // intersectingWindows.sort((a, b) => b.getLayer() - a.getLayer());
    let running = true;
    const terminateEvent = () => {running = false;}
    for (let w of intersectingWindows) {
        w.onMouseUpPrimitive(mousePos,terminateEvent,e);
        if (!running) break;
    }
}

function mouseWheelHandler(camera: Box, windows: CanvasWindow[],canvas: HTMLCanvasElement, e: WheelEvent) {
    camera = new Box([...camera.o],camera.w,camera.h);
    const cameraBoundingBox = camera.getBoundingBox();
    const intersectingWindows = windows.filter(w => {return boxesIntersect(w.getBoundingBox() as BoundingBox, cameraBoundingBox as BoundingBox)}).reverse();
    // intersectingWindows.sort((a, b) => b.getLayer() - a.getLayer());
    let running = true;
    const terminateEvent = () => {running = false;}
    for (let w of intersectingWindows) {
        w.onWheelPrimitive(terminateEvent,e);
        if (!running) break;
    }
}


export { render, clickHandler, mouseDownHandler, mouseMoveHandler, mouseUpHandler, mouseWheelHandler };
