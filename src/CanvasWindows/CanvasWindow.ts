import Box from './Box';
import CanvasRoot from './Root';
import { Vec2 } from './types';
import { add, dotMultiply, subtract } from './Utils';



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
    _root: CanvasRoot | undefined;
    // _cameraSnapshot: Box | undefined;
    // _canvas: HTMLCanvasElement | undefined;
    key: string | undefined;
    _parent: CanvasWindow | undefined;
    children: CanvasWindow[] = [];
    _isPrimaryCamera: boolean = false;
    _needsUpdate: boolean = true;


    get _cameraSnapshot() {
        if (!this._root) throw new Error('Root not connected');
        return this._root?.cameraSnapshot;
    }

    get _canvas() {
        if (!this._root) throw new Error('Root not connected');
        return this._root?.canvas;
    }

    setAsPrimaryCamera() {
        this._isPrimaryCamera = true;
    }

    // state management
    // onExternalStateUpdate(externalState: any) {};
    // externalState: any;
    // setExternalState(externalState:any) {
    //     this._needsUpdate = true;
    //     this.externalState = externalState;
    //     this.onExternalStateUpdate(externalState)
    // };
    state: any;
    setState(s: any) {
        if (this.state === s) throw new Error('Cannot set state to previous state. ');
        if (this.windowDidMountPrimitiveIsRunning) {
            this.state = s;
            return;
        }
        this._needsUpdate = true;
        this._root?.scheduleStateUpdate(this,s);
    }

    // context
    context: { [key: string]: any } = {};
    setContext(key: string, value: any) {
        if (this.windowDidMountPrimitiveIsRunning) {
            this.context[key] = value;
            return;
        }
        this._needsUpdate = true;
        this.context[key] = value;
        this._root?.scheduleContextUpdate(this,key,value);
    }



    // lifecycle methods
    windowDidMountPrimitiveIsRunning = false;
    windowDidMountPrimitive(props: { [key: string] : any}) {
        this.windowDidMountPrimitiveIsRunning = true;
        this.windowDidMount(props);
        this.windowDidMountPrimitiveIsRunning = false;
    }

    windowDidMount(props: { [key: string] : any}) {};
    windowDidUpdate(props: { [key: string] : any}) {};
    cameraDidUpdate() {};
    windowWillUnmount() {};


    // the position is determined either by
    // overrriding the getBox method or by
    // overriding the o,w,h getters
    
    _boxSnapshot: Box | undefined;
    getBoxPrimitive() : Box {
        if (this._boxSnapshot) return this._boxSnapshot;
        else {
            const box = this.getBox();
            this._boxSnapshot = box;
            this._root?.expirePositionsAfterTaskCompletes();
            return box;
        }
    }

    getBox() : Box {
        return new Box([0,0],0,0);
    }

    get o() {
        return this.getBoxPrimitive().o;
    }
    get w() {
        return this.getBoxPrimitive().w;
    }
    get h() {
        return this.getBoxPrimitive().h;
    }

    didMount : boolean = false;
    updateSelf() : void {

        if (this._isPrimaryCamera) {
            this._root?.installCamera(this)
        }

        this._needsUpdate = false;
        if (!this.didMount) {
            this.didMount = true;
            this.windowDidMount({ ... this.props });
        }
        this.updateChildren();
        this.windowDidUpdate({ ... this.props });
    }

    updateChildren() : void {
        this.childIndex = 0;
        const children = this.getChildren(this.props).map(c => c(this));
        const aboutToUnmount = this.children.filter(c => !children.includes(c));
        this.children = children;
        aboutToUnmount.forEach(c => c.windowWillUnmount());
        this.children.forEach(c => c.updateSelf());
    }

    getChildren(props?: { [key: string] : any}) : ((parent: CanvasWindow) => CanvasWindow)[] {
        return [];
    }

    childIndex = 0;
    incChildIndex() {
        this.childIndex++;
    }   


    isCanvasRoot = false;
    static Node(props?: { [key: string]: any }) : (parent: CanvasWindow | CanvasRoot) => CanvasWindow {
        const constructorName = this.name;
        return (parent: CanvasWindow | CanvasRoot) => {
            if (parent.isCanvasRoot) {
                parent = parent as CanvasRoot;
                if (!props) props = {};
                const key = "root";
                let node: CanvasWindow;
                node = new (this as any)() as CanvasWindow;
                node._root = parent;
                node.setKey(key);
                node.props = { ...props };
                node.context = { ...node.context};
                // node.externalState = parent.externalState;
                return node;
            } else {
                const indexAmongstParentChildren = parent.childIndex;
                if (!props) props = {};
                const key = props.key ? props.key : `${constructorName}[${indexAmongstParentChildren}]`;
                const keyExists = parent.children.findIndex(c => c.key === key) !== -1;
                let node: CanvasWindow;
                // let didMount = false;
                if (keyExists) {
                    // didMount = true;
                    node = parent.children.find(c => c.key === key) as CanvasWindow;            
                } else {
                    node = new (this as any)();
                    // node.externalState = parent.externalState;
                    node._parent = parent;
                    node._root = parent._root;
                    node.setKey(key);
                }
                node.props = { ...props };
                node.context = {...node.context, ...parent.context};
                // if (!didMount) node.windowDidMount({ ... props});
                // node.windowDidUpdate({ ... props });
                parent.incChildIndex();
                return node;
            }
        }
    }

    // props
    props: { [key: string]: any } = {};


    constructor() {
        super();
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
        const [ox,oy]= this.globalO;
        return [
            [ox,oy],
            [ox + this.w, oy],
            [ox + this.w, oy + this.h],
            [ox, oy + this.h],
        ]
        // return [
        //     this.globalO,
        //     add(this.globalO, [this.w, 0]),
        //     add(this.globalO, [this.w, this.h]),
        //     add(this.globalO, [0, this.h]),
        // ];
    }

    pointInside(v: Vec2) : boolean {
        return super.pointInside(subtract(v, this.parentO));
    }

    get globalO() : Vec2 {
        if (!this._parent) return this.o;
        const [pgox,pgoy] = this._parent.globalO;
        const [ox,oy] = this.o;
        return [pgox + ox, pgoy + oy] as Vec2;
        // return add(this._parent.globalO, this.o);
    }

    get globalKey() : string {
        if (!this._parent) return "root";
        return this._parent.globalKey + '@' + this.key;
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
        return this._cameraSnapshot && this._canvas;
    }


    get canvasUnit() {
        if (!this.displayConnected) throw new Error('Display not connected');
        return [this._cameraSnapshot.w / this._canvas.width, this._cameraSnapshot.h / this._canvas.height] as Vec2;
    }

    get absoluteUnit() {
        if (!this.displayConnected) throw new Error('Display not connected');
        return [this._canvas.width / this._cameraSnapshot.w, this._canvas.height / this._cameraSnapshot.h] as Vec2;
    }

    get canvasO() {
        if (!this.displayConnected) throw new Error('Display not connected');
        return [this._cameraSnapshot.o[0], this._cameraSnapshot.o[1]] as Vec2;
    }

    absoluteToCanvasMeasure(v: Vec2) : Vec2 {
        // if (!this.displayConnected) throw new Error('Display not connected');
        return dotMultiply(v, [this._canvas.width / this._cameraSnapshot.w, this._canvas.height / this._cameraSnapshot.h]);
    }

    canvasToAbsoluteMeasure(v: Vec2) : Vec2 {
        // if (!this.displayConnected) throw new Error('Display not connected');
        return dotMultiply(v, [this._cameraSnapshot.w / this._canvas.width, this._cameraSnapshot.h / this._canvas.height]); 
    }

    get cameraSnapshot() {
        // if (!this.displayConnected) throw new Error('Display not connected');
        return this._cameraSnapshot;
    }

    get canvas() {
        if (!this.displayConnected) throw new Error('Display not connected');
        return this._canvas;
    }

    prepareHandlerProps() : HandlerProps {
        // if (!this.displayConnected) throw new Error('Display not connected');
        const camera = this.cameraSnapshot;
        const canvas = this.canvas;

        const absoluteToCanvasMeasure = this.absoluteToCanvasMeasure.bind(this);
        const canvasToAbsoluteMeasure = this.canvasToAbsoluteMeasure.bind(this);

        const canvasUnit = this.canvasUnit as Vec2;
        const absoluteUnit = this.absoluteUnit as Vec2;
        const canvasO = this.canvasO as Vec2;

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
        // if (!this.displayConnected) throw new Error('Display not connected');
        const camera = this._cameraSnapshot as Box;
        const canvas = this._canvas as HTMLCanvasElement;
        const localToCanvas = (v: Vec2) : Vec2 => {
            const globalO = this.globalO;
            const [vx,vy] = v;
            const [gox,goy] = globalO;
            const [gpx,gpy] = [gox+vx,goy+vy];
            const [cx,cy] = camera.o
            const [cpx,cpy] = [gpx-cx,gpy-cy];
            return [cpx * (canvas.width / camera.w), cpy * (canvas.height / camera.h)]
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
        const [cux,cuy] = this.canvasUnit;
        const [cx,cy] = this.canvasO;
        const [px,py] = pos;
        const absolutePos = [cx + px * cux, cy + py * cuy] as Vec2;


        // const absolutePos = add(this.canvasO, dotMultiply(this.canvasUnit, pos))

        // console.log(canvasO)
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
        ctx.save();
        this.render({
            ...h,
            ctx,
        });
        ctx.restore();
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