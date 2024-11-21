import { add, subtract } from "mathjs";
import { CanvasWindow, MouseHandlerProps, RenderProps, WheelHandlerProps } from "../../CanvasWindow";
import Box from "../../Box";
import { Vec2 } from "../../types";

const CONSTANTS = {
    PixelsPerFrame: 10,
    OffsetX: 10,
    OffsetY: 10
}

class Camera extends CanvasWindow {

    get displayDimensions() : Vec2{
        const {width,height} = { width: 100, height: 100}
        return [width,height];
    }

    windowDidMount(): void {
        this.cameraBox = (new Box([0,0],this.displayDimensions[0],this.displayDimensions[1]));
        this.onGlobalWindowChange();
        this.setAsPrimaryCamera();
    }

    translationVector : Vec2 = [0,0];
    scaleVector : Vec2 = [1,1];
    scaleAnchorVector: Vec2 = [0,0];

    cameraBox = new Box([0,0],0,0);

    windowDidUpdate(): void {
        this.onGlobalWindowChange();
        console.log("UPDATING")
        if (this.context.translate !== this.translationVector) {
            this.translationVector = this.context.translate;
            this.translate(this.context.translate);
        }

        if (this.context.scale !== this.scaleVector) {
            this.scale(this.context.scale, this.context.scaleAnchor);
            this.scaleVector = this.context.scale;
        }
    }

    get canvasDimensions() : Vec2 {
        return [this.canvas.width, this.canvas.height];
    }
    
    translate(v: Vec2) : void {
        console.log("TRANSLATE")
        const [ W, H ] = this.canvasDimensions;
        let o = this.cameraBox.o;
        o = add(o, v) as Vec2;
        // check if the bounding box of the camera is inside the canvas
        const bb = this.getBoundingBox();

        const xMin = Math.min(...bb.map(v => v[0]));
        const xMax = Math.max(...bb.map(v => v[0]));

        const yMin = Math.min(...bb.map(v => v[1]));
        const yMax = Math.max(...bb.map(v => v[1]));

        const correction = [0, 0] as Vec2;
        if (xMin < 0) {
            correction[0] = -xMin;
        } else if (xMax > W) {
            correction[0] = W - xMax;
        }
        if (yMin < 0) {
            correction[1] = -yMin;
        } else if (yMax > H) {
            correction[1] = H - yMax;
        }
        o = add(o, correction) as Vec2;
        this.cameraBox = new Box(o, this.cameraBox.w, this.cameraBox.h);
        console.log("MADE IT TO THE END",this.cameraBox)
    }

    withinBounds(value : number, lower : number, upper : number, epsilon = 1e-10) {
        return value >= lower - epsilon && value <= upper + epsilon;
    }

    updateDimensions(o: Vec2, w: number, h: number) : void {
        this.cameraBox = (new Box(o, w, h));
        this.checkBounds();
    }

    checkBounds() {
        const [ W, H ] = this.canvasDimensions;
        // const epsilon = 1e-10; // Tolerance for floating-point errors
        let o, w, h;
        o = this.cameraBox.o;
        w = this.cameraBox.w;
        h = this.cameraBox.h;

        o[0] = Math.max(Math.min(o[0], W),0);
        o[1] = Math.max(Math.min(o[1], H),0);
        w = Math.max(Math.min(w, W - o[0]),0);
        h = Math.max(Math.min(h, H - o[1]),0);
        this.cameraBox = (new Box(o, w, h));
    }

    onGlobalWindowChange(): void {
        this.translate([0, 0]);
        this.checkBounds();
    }

    scale(v: Vec2, a: Vec2) : void {
        const [ W, H ] = this.canvasDimensions;
        if (v[0] <= 0 || v[1] <= 0) throw new Error('Scale factor must be positive');

        let o, w, h;
        o = this.cameraBox.o;
        w = this.cameraBox.w;
        h = this.cameraBox.h;

        const maxScaleW = W / w;
        const maxScaleH = H / h;
        
        v = [Math.min(v[0], maxScaleW), Math.min(v[1], maxScaleH)];

        const newW = w * v[0];
        const newH = h * v[1];

        const [adx,ady] = [a[0] - o[0], a[1] - o[1]];
        const anchorImage = [o[0] + adx * v[0], o[1] + ady * v[1]];
        const difference = subtract(a,anchorImage) as Vec2;

        w = newW;
        h = newH;
        this.cameraBox = (new Box(o, w, h));
        this.translate(difference);
    }

    getCenter(): Vec2 {
        return add(this.o, [this.w / 2, this.h / 2]) as Vec2;
    }

    getBox(): Box {
        console.log("GETTING BOX",this.cameraBox)
        return this.cameraBox;
    }

}

class InteractiveCamera extends CanvasWindow {

    internalState = {
        isPanning: false,
        lastMousePosition: [0, 0] as Vec2,
        scaleAnchor: [0, 0] as Vec2
    }

    layer = 5

    windowDidMount(props: { [key: string]: any; }): void {
        this.setContext('translate', [0, 0]);
        this.setContext('scale', [1, 1]);
        this.setContext('scaleAnchor', [0, 0]);
    }

    // windowDidUpdate(props: { [key: string]: any; }): void {
    //     console.log("upper",this.context.translate)
    // }

    getChildren() {
        // return [];
        return [Camera.Node()];
    }


    onMouseDown(p: MouseHandlerProps, e: MouseEvent): void {
        console.log("INTERACTIVE")
        if (e.button !== 1) return;
        const { terminateEvent, canvasPos } = p;
        this.internalState = ({ ...this.internalState, lastMousePosition: canvasPos, isPanning: true });
        terminateEvent();
    }


    onMouseMove(p: MouseHandlerProps, e: MouseEvent): void {
        const { terminateEvent, canvasPos, absolutePos, canvasUnit } = p;
        const [cux,cuy] = canvasUnit;
        this.internalState = ({ ...this.internalState, scaleAnchor: canvasPos });
        if (this.internalState.isPanning) {
            terminateEvent();
            const [dx, dy] = subtract(canvasPos, this.internalState.lastMousePosition) as Vec2;
            //console.log(this.lastMousePosition, absolutePos);
            this.setContext('translate', [-dx * cux, -dy * cuy]);
            // this.child.translate([-dx * cux, -dy * cuy]);
            this.internalState = ({ ...this.internalState, lastMousePosition: canvasPos });
        }
    }

    onMouseUp(p: MouseHandlerProps, e: MouseEvent): void {
        this.internalState = ({ ...this.internalState, isPanning: false });
    }

    onWheel(p: WheelHandlerProps, e: WheelEvent): void {
        const { terminateEvent, canvasToAbsoluteMeasure } = p;
        const { deltaX, deltaY, ctrlKey, altKey } = e;
        if (ctrlKey) {
            let zoomFactor = 1;
            if (deltaX !== 0) {
                zoomFactor = 1 + deltaX * 0.01; // Adjust this factor as needed
            } else {
                zoomFactor = 1 - deltaY * 0.01; // Adjust this factor
            }
            if (altKey) {
                if (this.h * zoomFactor < 5) return;
                this.setContext('scale', [1, Math.max(0.1,zoomFactor)]);
                this.setContext('scaleAnchor', this.internalState.scaleAnchor);
                // this.child.scale([1, Math.max(0.1,zoomFactor)], this.state.scaleAnchor);
            } else {
                // if (this.w * zoomFactor < CONSTANTS.PixelsPerFrame * 5) return;
                console.log("setting scale context")
                this.setContext('scale', [Math.max(0.1,zoomFactor), 1]);
                this.setContext('scaleAnchor', this.internalState.scaleAnchor);
                // this.child.scale([Math.max(0.1,zoomFactor), 1], this.state.scaleAnchor);
            }
        } else {
            const [aDeltaX, aDeltaY] = canvasToAbsoluteMeasure([deltaX, deltaY]);
            this.setContext('translate', [-aDeltaX, -aDeltaY]);
            // this.child.translate([-aDeltaX, -aDeltaY]);
        }
        terminateEvent();
    }

    render(r: RenderProps) {
       // console.log(this.o,this.w,this.h)
    }
}

export default InteractiveCamera;