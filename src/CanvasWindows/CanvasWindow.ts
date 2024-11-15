import Box from './Box';
import { Vec2 } from './types';
import { add, dotMultiply, subtract } from 'mathjs';

interface HandlerProps {
    canvasDimensions: Vec2;
    localToCanvas: (v: Vec2) => Vec2;
    canvasToLocal: (v: Vec2) => Vec2;
    localToCanvasMeasure: (v: Vec2) => Vec2;
    canvasToLocalMeasure: (v: Vec2) => Vec2;
    camera: Box;
}

interface RenderProps extends HandlerProps {
    ctx: CanvasRenderingContext2D;
}

interface MouseHandlerProps extends HandlerProps {
    pos: Vec2;
    absolutePos: Vec2;
    terminateEvent: () => void;
}

interface WheelHandlerProps extends HandlerProps {
    terminateEvent: () => void;
}

function generateRandomKey() {
    return Math.random().toString(36).substring(7);
}

abstract class CanvasWindow extends Box {

    layer: number = 0;
    _camera: Box | undefined;
    _canvas: HTMLCanvasElement | undefined;
    key: string = generateRandomKey();

    constructor(o?: Vec2, w?: number, h?: number) {
        super(o,w,h); 
    }

    getLayer() {
        return this.layer;
    }

    setLayer(layer: number) {
        this.layer = layer;
    }

    setKey(key: string) {
        this.key = key;
    }

    get displayConnected() {
        return this._camera && this._canvas;
    }

    connectDisplay(camera: Box, canvas: HTMLCanvasElement) {
        this._camera = camera;
        this._canvas = canvas;
    }

    disconnectDisplay() {
        this._camera = undefined;
        this._canvas = undefined;
    }

    prepareHandlerProps() : HandlerProps {
        if (!this.displayConnected) throw new Error('Display not connected');
        const camera = this._camera as Box;
        const canvas = this._canvas as HTMLCanvasElement;

        const localToCanvas = (v: Vec2) : Vec2 => {
            const globalPos = add(this.o, v);
            const cameraPos = subtract(globalPos, camera.o);
            return dotMultiply(cameraPos, [canvas.width / camera.w, canvas.height / camera.h]);
        }
        const canvasToLocal = (v: Vec2) : Vec2 => {
            const cameraPos = dotMultiply(v, [camera.w / canvas.width, camera.h / canvas.height]);
            const globalPos = add(cameraPos, camera.o);
            return subtract(globalPos, this.o);
        }
        const localToCanvasMeasure = (v: Vec2) : Vec2 => {
            return dotMultiply(v, [canvas.width / camera.w, canvas.height / camera.h]);
        }
        const canvasToLocalMeasure = (v: Vec2) : Vec2 => {
            return dotMultiply(v, [camera.w / canvas.width, camera.h / canvas.height]);
        }

        const canvasDimensions = [canvas.width, canvas.height] as Vec2;
        return {
            localToCanvas,
            canvasToLocal,
            canvasDimensions,
            localToCanvasMeasure,
            canvasToLocalMeasure,
            camera,
        }
    }


    private prepareMouseHandlerProps(pos: Vec2,terminateEvent: () => void) : MouseHandlerProps {
        const relativePos = subtract(pos, this.o);
        return {
            ...this.prepareHandlerProps(),
            pos: relativePos,
            absolutePos: pos,
            terminateEvent,
        }
    }

    private prepareWheelHandlerProps(terminateEvent: () => void) : WheelHandlerProps {
        return {
            ...this.prepareHandlerProps(),
            terminateEvent,
        }
    }


    renderPrimitive(ctx: CanvasRenderingContext2D) {
        if (!this.render) return;
        this.render({
            ...this.prepareHandlerProps(),
            ctx,
        });
    }
    render(props: RenderProps) {};
    
    onMouseDownPrimitive(pos: Vec2,terminateEvent: () => void, e: MouseEvent) {
        if (!this.onMouseDown) return;
        this.onMouseDown(this.prepareMouseHandlerProps(pos,terminateEvent),e);
    }
    onMouseDown?(p: MouseHandlerProps, e: MouseEvent) {};


    onMouseMovePrimitive(pos: Vec2,terminateEvent: () => void, e: MouseEvent) {
        if (!this.onMouseMove) return;
        this.onMouseMove(this.prepareMouseHandlerProps(pos,terminateEvent),e);
    }
    onMouseMove(p: MouseHandlerProps, e: MouseEvent) {};
    
    onMouseUpPrimitive(pos: Vec2,terminateEvent: () => void, e: MouseEvent) {
        if (!this.onMouseUp) return;
        this.onMouseUp(this.prepareMouseHandlerProps(pos,terminateEvent),e);
    }
    onMouseUp(p: MouseHandlerProps, e: MouseEvent) {};
    
    onClickPrimitive(pos: Vec2,terminateEvent: () => void, e: MouseEvent) {
        if (!this.onClick) return;
        this.onClick(this.prepareMouseHandlerProps(pos,terminateEvent),e);
    }
    onClick(p: MouseHandlerProps, e: MouseEvent) {};

    onWheelPrimitive(terminateEvent: () => void, e: WheelEvent) {
        if (!this.onWheel) return;
        this.onWheel(this.prepareWheelHandlerProps(terminateEvent),e);
    }
    onWheel(h: WheelHandlerProps, e: WheelEvent) {};
}

export type { HandlerProps, RenderProps, MouseHandlerProps, WheelHandlerProps };
export { CanvasWindow };