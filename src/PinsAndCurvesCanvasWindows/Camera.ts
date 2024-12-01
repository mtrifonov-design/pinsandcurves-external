import { add, subtract } from "mathjs";
import { CanvasWindow, Vec2, Box, MouseHandlerProps, WheelHandlerProps, RenderProps } from "./Dependencies";

class Camera extends CanvasWindow {

    get displayDimensions() : Vec2{
        const width = this._root?.canvas.width || 0;
        const height = this._root?.canvas.height || 0;
        return [width,height];
    }

    windowDidMount(): void {
        // this.onGlobalWindowChange();
        this.setAsPrimaryCamera();
    }

    get canvasDimensions() : Vec2 {
        // const [w,h] = [this.context.dimensions.width * 3, this.context.dimensions.height * 3];
        // const [cw,ch] = this.displayDimensions;
        // return [Math.max(w,cw),Math.max(h,ch)];
        return this.context.workingCanvasDimensions;
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

        const maxScale = Math.min(maxScaleW, maxScaleH);
        
        v = [Math.min(v[0],maxScale), Math.min(v[1],maxScale)];

        const newW = w * v[0];
        const newH = h * v[1];

        const [adx,ady] = [a[0] - o[0], a[1] - o[1]];

        const [cux,cuy] = this.canvasUnit;
        const [adcx,adcy] = [adx * cux, ady * cuy];
        const [aix,aiy] = [adx * v[0], ady * v[1]];
        const [aicx,aicy] = [aix * cux, aiy * cuy];
        const [dcx,dcy] = [adcx - aicx, adcy - aicy];
        const [aux,auy] = this.absoluteUnit;
        const difference = [dcx * aux, dcy * auy] as Vec2;

        const anchorImage = [o[0] + adx * v[0], o[1] + ady * v[1]];
        const _difference = subtract(a,anchorImage) as Vec2;
        console.log(adx,ady)

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
        // // console.log("InteractiveCamera mounted")
        const [dx,dy] = this.displayDimensions;
        const [cx,cy] = this.canvasDimensions;
        const proposedBox = new Box([cx / 2 - dx / 2, cy / 2 - dy / 2],dx,dy);
        console.log(proposedBox)
        const box = this.translate(proposedBox, [0,0]);
        this.setState({
            isPanning: false,
            lastMousePosition: [0, 0] as Vec2,
            cameraBox: box,
        });

        this.props.subscribeToCanvasResize(() => {
            const existingO = this.state.cameraBox.clone().o;
            const w= this.state.cameraBox.w;
            const h = this.state.cameraBox.h;
            const [dx,dy] = this.displayDimensions;
            const ratio = dx/dy;
            // we would like to preserve this ratio
            const newW = h * ratio;
            this.setState({
                cameraBox: new Box(existingO,newW,h),
            });
        })
        // // console.log(this.state)
    }

    windowDidUpdate(props: { [key: string]: any; }): void {
        // // console.log(this.state)
    }

    layer = -100;

    onMouseDown(p: MouseHandlerProps, e: MouseEvent): void {
        // console.log("DOWN")
        if (e.button !== 1) return;
        const { terminateEvent, canvasPos } = p;
        this.setState({...this.state, lastMousePosition: canvasPos, isPanning: true });
        terminateEvent();
    }

    scaleAnchor : Vec2 = [0,0];
    onMouseMove(p: MouseHandlerProps, e: MouseEvent): void {
        const { terminateEvent, canvasPos, absolutePos, canvasUnit } = p;
        const [cux,cuy] = canvasUnit;
        let newState = { ...this.state };
        this.scaleAnchor = absolutePos;
        // // console.log(this.state.isPanning)
        if (this.state.isPanning) {
            // console.log("PANNING")
            terminateEvent();
            const [dx, dy] = subtract(canvasPos, this.state.lastMousePosition) as Vec2;
            const newBox = this.translate(this.state.cameraBox.clone(),[-dx * cux, -dy * cuy]);
            newState = ({...newState, lastMousePosition: canvasPos, cameraBox: newBox });
            this.setState(newState);
        }

    }

    onMouseUp(p: MouseHandlerProps, e: MouseEvent): void {
        // console.log("UP")
        this.setState({...this.state, isPanning: false });
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
                // if (this.h * zoomFactor < 5) return;
                // this.scale([1, Math.max(0.1,zoomFactor)], this.state.scaleAnchor);
            } else {
                if (this.w * zoomFactor < 50) return;
                // // // console.log("zooming")
                const newBox = this.scale(this.state.cameraBox.clone(),[Math.max(0.1,zoomFactor), Math.max(0.1,zoomFactor)], this.scaleAnchor);
                this.setState({...this.state, cameraBox: newBox});
            }
        } else {
            const [aDeltaX, aDeltaY] = canvasToAbsoluteMeasure([deltaX, deltaY]);
            const newBox = this.translate(this.state.cameraBox.clone(),[aDeltaX, aDeltaY]);
            // console.log(aDeltaX,aDeltaY)
            this.setState({...this.state, cameraBox: newBox});
        }
        terminateEvent();
    }

    render(r: RenderProps) {
        // r.ctx.beginPath();
        // r.ctx.fillStyle = '#242526';
        // r.ctx.fillRect(0,0,r.canvasDimensions[0],r.canvasDimensions[1]);
        // console.log(this.state.cameraBox)
    }
}

export default InteractiveCamera;