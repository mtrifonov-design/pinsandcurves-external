import { add, subtract } from "mathjs";
import { CanvasWindow, MouseHandlerProps, WheelHandlerProps, RenderProps } from "../../CanvasWindow";
import { Vec2 } from "../../types";
import Box from "../../Box";

const CONSTANTS = {
    PixelsPerFrame: 10,
    OffsetX: 10,
    OffsetY: 10
}

class Camera extends CanvasWindow {

    get displayDimensions() : Vec2{
        const {width,height} = {width: 500, height: 500};
        return [width,height];
    }

    windowDidMount(): void {
        // this.onGlobalWindowChange();
        this.setAsPrimaryCamera();
    }

    get canvasDimensions() : Vec2 {
        return [500,500] as Vec2;
    }
    
    translate(oldCamera: Box, v: Vec2) : Box {
        const [ W, H ] = this.canvasDimensions;
        let o = [...oldCamera.o] as Vec2;
        let w = oldCamera.w;
        let h = oldCamera.h;
        o = add(o, v) as Vec2;
        // check if the bounding box of the camera is inside the canvas
        const bb = [
            o,
            add(o, [w, 0]),
            add(o, [0, h]),
            add(o, [w, h])
        ]

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
        const oBefore = [...o]
        o = add(o, correction) as Vec2;

        // this.setState({...this.state, cameraBox: new Box(o, this.state.cameraBox.w, this.state.cameraBox.h)});
        return new Box(o, w, h);
        // this.checkBounds();
    }

    withinBounds(value : number, lower : number, upper : number, epsilon = 1e-10) {
        return value >= lower - epsilon && value <= upper + epsilon;
    }

    updateDimensions(o: Vec2, w: number, h: number) : void {
        this.setState({...this.state, cameraBox: new Box(o, w, h)});
        this.checkBounds();
    }

    checkBounds() {
        const [ W, H ] = this.canvasDimensions;
        // const epsilon = 1e-10; // Tolerance for floating-point errors
        let o, w, h;
        o = this.state.cameraBox.o;
        w = this.state.cameraBox.w;
        h = this.state.cameraBox.h;

        o[0] = Math.max(Math.min(o[0], W),0);
        o[1] = Math.max(Math.min(o[1], H),0);
        w = Math.max(Math.min(w, W - o[0]),0);
        h = Math.max(Math.min(h, H - o[1]),0);
        this.setState({...this.state, cameraBox: new Box(o, w, h)});
    }

    onGlobalWindowChange(): void {
        // this.translate([0, 0]);
        // this.checkBounds();
    }

    scale(oldCamera: Box, v: Vec2, a: Vec2) : Box {
        const [ W, H ] = this.canvasDimensions;
        if (v[0] <= 0 || v[1] <= 0) throw new Error('Scale factor must be positive');

        let o, w, h;
        o = oldCamera.o;
        w = oldCamera.w;
        h = oldCamera.h;

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
        return this.translate(new Box(o, w, h),difference);
    }

    getCenter(): Vec2 {
        return add(this.o, [this.w / 2, this.h / 2]) as Vec2;
    }

    getBox(): Box {
        // console.log(this.state)
        return this.state.cameraBox;
    }

}

class InteractiveCamera extends Camera {
    windowDidMount(): void {
        super.windowDidMount();
        console.log("InteractiveCamera mounted")
        this.setState({
            isPanning: false,
            lastMousePosition: [0, 0] as Vec2,
            scaleAnchor: [0, 0] as Vec2,
            cameraBox: new Box([0,0],this.displayDimensions[0],this.displayDimensions[1]),
        });
        console.log(this.state)
    }


    onMouseDown(p: MouseHandlerProps, e: MouseEvent): void {
        console.log("INTERACTIVE")
        if (e.button !== 1) return;
        const { terminateEvent, canvasPos } = p;
        this.setState({...this.state, lastMousePosition: canvasPos, isPanning: true });
        terminateEvent();
    }


    onMouseMove(p: MouseHandlerProps, e: MouseEvent): void {
        const { terminateEvent, canvasPos, absolutePos, canvasUnit } = p;
        const [cux,cuy] = canvasUnit;
        let newState = {...this.state};
        newState = ({...newState, scaleAnchor: canvasPos });
        if (this.state.isPanning) {
            terminateEvent();
            const [dx, dy] = subtract(canvasPos, this.state.lastMousePosition) as Vec2;
            const newBox = this.translate(this.state.cameraBox.clone(),[-dx * cux, -dy * cuy]);
            newState = ({...newState, lastMousePosition: canvasPos, cameraBox: newBox });
        }
        this.setState(newState);
    }

    onMouseUp(p: MouseHandlerProps, e: MouseEvent): void {
        this.setState({...this.state, isPanning: false });
    }

    onWheel(p: WheelHandlerProps, e: WheelEvent): void {
        const { terminateEvent, canvasToAbsoluteMeasure } = p;
        const { deltaX, deltaY, ctrlKey, altKey } = e;
        if (ctrlKey) {
            console.log("scrolling")
            let zoomFactor = 1;
            if (deltaX !== 0) {
                zoomFactor = 1 + deltaX * 0.01; // Adjust this factor as needed
            } else {
                zoomFactor = 1 - deltaY * 0.01; // Adjust this factor
            }
            if (altKey) {
                // if (this.h * zoomFactor < 5) return;
                // this.scale([1, Math.max(0.1,zoomFactor)], this.state.scaleAnchor);
            } else {
                if (this.w * zoomFactor < CONSTANTS.PixelsPerFrame * 5) return;
                // console.log("zooming")
                const newBox = this.scale(this.state.cameraBox.clone(),[Math.max(0.1,zoomFactor), 1], this.state.scaleAnchor);
                this.setState({...this.state, cameraBox: newBox});
            }
        } else {
            const [aDeltaX, aDeltaY] = canvasToAbsoluteMeasure([deltaX, deltaY]);
            const newBox = this.translate(this.state.cameraBox.clone(),[-aDeltaX, -aDeltaY]);
            this.setState({...this.state, cameraBox: newBox});
        }
        terminateEvent();
    }

    render(r: RenderProps) {
       // console.log(this.o,this.w,this.h)
    }
}

export default InteractiveCamera;