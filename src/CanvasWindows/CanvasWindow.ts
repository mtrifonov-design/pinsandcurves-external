import Box from './Box';
import { Vec2 } from './types';
import { add, dotMultiply, subtract } from 'mathjs';

interface HandlerProps {
    canvasDimensions: Vec2;
    absoluteToCanvasMeasure: (v: Vec2) => Vec2;
    canvasToAbsoluteMeasure: (v: Vec2) => Vec2;
    camera: Box;
    canvasUnit : Vec2;
    absoluteUnit: Vec2;
    canvasO: Vec2;
}

interface PostBoxHandlerProps extends HandlerProps {
    localToCanvas: (v: Vec2) => Vec2;
    canvasToLocal: (v: Vec2) => Vec2;
    absoluteO: Vec2;
}

interface RenderProps extends PostBoxHandlerProps {
    ctx: CanvasRenderingContext2D;
}

interface MouseHandlerProps extends PostBoxHandlerProps {
    relativePos: Vec2;
    absolutePos: Vec2;
    canvasPos: Vec2;
    terminateEvent: () => void;
    canvasO: Vec2;
    pointInside: boolean;
}

interface WheelHandlerProps extends PostBoxHandlerProps {
    terminateEvent: () => void;
    canvasO: Vec2;
}

function generateRandomKey() {
    return Math.random().toString(36).substring(7);
}


abstract class CanvasWindow extends Box {

    layer: number = 0;
    _camera: Box | undefined;
    _canvas: HTMLCanvasElement | undefined;
    key: string = generateRandomKey();
    _parent: CanvasWindow | undefined;
    children: CanvasWindow[] = [];
    _isPrimaryCamera: boolean = false;

    setAsPrimaryCamera() {
        this._isPrimaryCamera = true;
    }

    constructor(o?: Vec2, w?: number, h?: number) {
        super(o,w,h); 
    }

    get parentO() {
        if (!this._parent) return [0,0] as Vec2;
        return this._parent.globalO;
    }
    get parentW() {
        if (!this._parent) return 0;
        return this._parent.w;
    }
    get parentH() {
        if (!this._parent) return 0;
        return this._parent.h;
    }

    getChildByKey(key: string) : CanvasWindow | undefined {
        return this.children.find(c => c.key === key);
    }

    getBoundingBox(): Vec2[] {
        return [
            this.globalO,
            add(this.globalO, [this.w, 0]),
            add(this.globalO, [this.w, this.h]),
            add(this.globalO, [0, this.h]),
        ];
    }

    pointInside(v: Vec2) : boolean {
        return super.pointInside(subtract(v, this.parentO));
    }

    get globalO() : Vec2 {
        if (!this._parent) return this.o;
        return add(this._parent.globalO, this.o);
    }

    get globalKey() : string {
        if (!this._parent) return "root";
        return this._parent.globalKey + '@' + this.key;
    }

    destroy() {
        // Work in destruction mechanism
    }

    updateExternalState(...args: any[]) {};

    getChildrenPrimitive(existingWindowsMap: { [key: string] : CanvasWindow | undefined}) : CanvasWindow[] {
        const children = this.getChildren();
        for (let i = 0; i < children.length; i++) {
            const c = children[i];
            c._parent = this;
            const existingWindow = existingWindowsMap[c.globalKey];
            children[i] = existingWindow ? existingWindow as CanvasWindow : c;
        }
        this.children = children;
        return children;
    }

    getChildren() : CanvasWindow[] {
        return [];
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

        const absoluteToCanvasMeasure = (v: Vec2) : Vec2 => {
            return dotMultiply(v, [canvas.width / camera.w, canvas.height / camera.h]);
        }
        const canvasToAbsoluteMeasure = (v: Vec2) : Vec2 => {
            return dotMultiply(v, [camera.w / canvas.width, camera.h / canvas.height]);
        }

        const canvasUnit = [camera.w / canvas.width, camera.h / canvas.height] as Vec2;
        const absoluteUnit = [canvas.width / camera.w, canvas.height / camera.h] as Vec2;
        const canvasO = [camera.o[0], camera.o[1]] as Vec2;

        const canvasDimensions = [canvas.width, canvas.height] as Vec2;
        return {
            canvasDimensions,
            absoluteToCanvasMeasure,
            canvasToAbsoluteMeasure,
            camera,
            canvasUnit,
            canvasO,
            absoluteUnit,
        }
    }

    preparePostBoxHandlerProps() : PostBoxHandlerProps {
        if (!this.displayConnected) throw new Error('Display not connected');
        const camera = this._camera as Box;
        const canvas = this._canvas as HTMLCanvasElement;

        const localToCanvas = (v: Vec2) : Vec2 => {
            const globalO = this.globalO;
            const globalPos = add(globalO, v);
            const cameraPos = subtract(globalPos, camera.o);
            return dotMultiply(cameraPos, [canvas.width / camera.w, canvas.height / camera.h]);
        }
        const canvasToLocal = (v: Vec2) : Vec2 => {
            const globalO = this.globalO;
            const cameraPos = dotMultiply(v, [camera.w / canvas.width, camera.h / canvas.height]);
            const globalPos = add(cameraPos, camera.o);
            return subtract(globalPos, globalO);
        }
        const absoluteO = localToCanvas([0,0]);
        return {
            ...this.prepareHandlerProps(),
            localToCanvas,
            canvasToLocal,
            absoluteO,
        }

    }




    private prepareMouseHandlerProps(pos: Vec2,terminateEvent: () => void) : MouseHandlerProps {
        const h = this.preparePostBoxHandlerProps();
        const canvas = this._canvas as HTMLCanvasElement;
        const camera = this._camera as Box;
        const { absoluteUnit, canvasO } = h;
        const [aux,auy] = absoluteUnit;
        const [cx,cy] = canvasO;
        const absolutePos = [cx + pos[0] * aux, cy + pos[1] * auy] as Vec2;
        const relativePos = subtract(absolutePos, this.globalO);
        const pointInside = this.pointInside(absolutePos);
        return {
            ...h,
            relativePos,
            canvasPos: pos,
            absolutePos,
            pointInside,
            terminateEvent,
        }
    }

    private prepareWheelHandlerProps(terminateEvent: () => void) : WheelHandlerProps {
        const h = this.preparePostBoxHandlerProps();
        return {
            ...h,
            terminateEvent,
        }
    }


    renderPrimitive(ctx: CanvasRenderingContext2D) {
        if (!this.render) return;
        const h = this.preparePostBoxHandlerProps();
        this.render({
            ...h,
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

    strokeOutline(r: RenderProps, color: string) {
        r.ctx.strokeStyle = color;
        const { absoluteO, absoluteUnit} = r;
        const [aox,aoy] = absoluteO;
        const [aux,auy] = absoluteUnit
        r.ctx.strokeRect(aox, aoy, this.w * aux, this.h * auy);
    }
}

export type { HandlerProps, RenderProps, MouseHandlerProps, WheelHandlerProps };
export { CanvasWindow };