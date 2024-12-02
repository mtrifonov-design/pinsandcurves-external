import SignalWindow from "../SignalWindow";
import { MouseHandlerProps, RenderProps,Box, Vec2, add, subtract, norm, CanvasWindow } from "../Dependencies";
import { dotProduct, scale } from "../../CanvasWindows";

const side = 25;

function clamp(x: number, min: number, max: number) {
    return Math.min(Math.max(x, min), max);
}

class Crosshair extends SignalWindow {

    getBox() {
        const [cux,cuy] = this.canvasUnit;
        return new Box(this.props.o,side * cux,side * cuy);
    }

    render(r: RenderProps): void {
        const mode = this.context.mode;
        const [aux,auy] = this.absoluteUnit;
        const [aox,aoy] = r.absoluteO;
        const [cx,cy] = [aox + this.w / 2 * aux, aoy + this.h / 2 * auy];
        r.ctx.globalAlpha = this.props.alpha ? this.props.alpha : 1;
        r.ctx.beginPath();
        r.ctx.ellipse(cx,cy, this.w / 2 * aux, this.h / 2* auy, 0, 0, Math.PI * 2);
        if (this.props.color) {
            r.ctx.strokeStyle = this.props.color;
        } else {
            r.ctx.strokeStyle = mode === 'edit' ? 'green' : this.props.dragging ? 'red' : 'pink';
        }
        r.ctx.lineWidth = 2;
        r.ctx.stroke();
        // add crosshairs
        r.ctx.beginPath();
        r.ctx.moveTo(cx - this.w / 2 *aux, cy);
        r.ctx.lineTo(cx + this.w / 2 *aux, cy);
        r.ctx.moveTo(cx, cy - this.h / 2 *auy);
        r.ctx.lineTo(cx, cy + this.h / 2 *auy);
        r.ctx.stroke();
        r.ctx.globalAlpha = 1;

    }
}



class VectorHandleBox extends SignalWindow {

    windowDidMount(props: { [key: string]: any; }): void {
        this.setState({dragging: false});
    }

    getChildren(props?: { [key: string]: any; } | undefined): ((parent: CanvasWindow) => CanvasWindow)[] {
        // return [TestNode.Node({})];
        // return [Crosshair.Node({o: [0,0], alpha: 0.5})];
        return [Crosshair.Node({o: [0,0], dragging: this.state.dragging, anchor: this.props.anchor})];
    }

    getBox(props?: Props) {
        const [cux,cuy] = this.canvasUnit;
        return new Box([(-side/2) * cux,(-side/2)*cuy],side*cux,side*cuy);
    }

    onMouseDown(p: MouseHandlerProps, e: MouseEvent): void {
        if (p.pointInside && this.context.mode === "record") this.setState({dragging: true});
    }

    chooseSetSignalValueFunction(id: string, value: any, commit: boolean) {
        // if (this.props.topProps.type === 'discrete') {
        //     this.setDiscreteSignalValue(id,value as string,commit);
        // } else {
        //     if (!range) throw new Error("Range not defined for continuous signal");
        //     this.setContinuousSignalValue(id,value as number,commit,range);
        // }
        const type = this.props.topProps.type;
        let { angle, magnitude, vector, range,rangeX, rangeY } = value;
        angle = angle ? Number(angle.toFixed(2)) : angle;
        magnitude = magnitude ? Number(magnitude.toFixed(2)) : magnitude;
        vector = vector ? vector.map((v: number) => Number(v.toFixed(2))) : vector;

        switch (this.props.topProps.degreesOfFreedom) {
            case "1-angular":
                {
                    if (type === 'discrete') {
                        this.setDiscreteSignalValue(id,JSON.stringify({angle}),commit);
                    } else {
                        this.setContinuousSignalValue(id,angle,commit,range);
                    }
                }
                break;
            case "1-normal":
                {
                    if (type === 'discrete') {
                        this.setDiscreteSignalValue(id,JSON.stringify({magnitude}),commit);
                    } else {
                        this.setContinuousSignalValue(id,magnitude,commit,range);
                    }
                }
                break;
            case "2-cartesian":
                {
                    if (type === 'discrete') {
                        this.setDiscreteSignalValue(id,JSON.stringify({vector}),commit);
                    } else {
                        this.setContinuousSignalValue(id+"_x",vector[0],commit,rangeX);
                        this.setContinuousSignalValue(id+"_y",vector[1],commit,rangeY);
                    }
                }
                break;
        }

        


    }

    moveHandle(p: MouseHandlerProps,commit: boolean) {
        // console.log("Moving handle",this.globalKey);
        this.context.projectTools.returnToLastCommit();
        let value = {};
        switch (this.props.topProps.degreesOfFreedom) {
            case "1-angular":
                {                
                    const [ox,oy] = this.props.anchor;
                    const [x,y] = p.absolutePos;
                    const dx = x - ox;
                    const dy = y - oy;
                    const angle = Math.atan2(dy,dx);
                    value = { angle, range: [-Math.PI,Math.PI] };
                    // this.chooseSetSignalValueFunction(this.props.topProps.id,angle,commit,[-Math.PI,Math.PI]);
                    break;
                }
            case "1-normal":
                {
                    const dv = subtract(p.absolutePos,this.props.anchor);
                    // now project on the initial direction
                    if (!this.props.topProps.initialDirection) throw new Error("Initial direction not defined for 1-normal handle");
                    const dir = this.props.topProps.initialDirection;
                    const l = norm(dir);
                    const projecP = dotProduct(dv,scale(dir,1/l));
                    const projec = scale(dir,projecP);
                    const range = this.props.topProps.range;
                    if (!range) throw new Error("Range not defined for 1-normal handle");
                    const sign = Math.sign(projecP);
                    const mag = clamp(sign * norm(projec),range[0],range[1]);
                    value = { magnitude: mag, range };
                    // this.chooseSetSignalValueFunction(this.props.topProps.id,mag,commit,range);
                    break;
                }
            case "2-cartesian":
                {
                    let [dx,dy] = subtract(p.absolutePos,this.props.anchor);
                    let rangeX = this.props.topProps.rangeX;
                    let rangeY = this.props.topProps.rangeY;
                    if (!rangeX || !rangeY) {
                        const range = this.props.topProps.range;
                        if (!range) throw new Error("Range not defined for 2-cartesian handle");
                        rangeX = range;
                        rangeY = range;
                    }
                    [dx,dy] = [clamp(dx,rangeX[0],rangeX[1]),clamp(dy,rangeY[0],rangeY[1])];
                    value = { x: dx, y: dy, rangeX, rangeY };
                    // this.chooseSetSignalValueFunction(this.props.topProps.id+"_x",dx,commit,rangeX);
                    // this.chooseSetSignalValueFunction(this.props.topProps.id+"_y",dy,commit,rangeY);
                }
        }
        this.chooseSetSignalValueFunction(this.props.topProps.id,value,commit);
        this.context.projectTools.pushUpdate();

    }
    onMouseMove(p: MouseHandlerProps, e: MouseEvent): void {
        // console.log(this.state.dragging);
        if (this.state.dragging) {
            this.moveHandle(p,false);
        }
    }
    onMouseUp(p: MouseHandlerProps, e: MouseEvent): void {
        if (this.state.dragging) {
            this.moveHandle(p,true);
            this.setState({dragging: false});
        }
    }

    render(r: RenderProps) {
        // this.strokeOutline(r,'blue')
    }
}

class OnionSkin extends SignalWindow {

    getChildren(props?: { [key: string]: any; } | undefined): ((parent: CanvasWindow) => CanvasWindow)[] {
        const [v1,v2] = this.getOnionSkinCrosshairPositions();
        const [cux,cuy] = this.canvasUnit;
        const displacement = [(side/2) * cux,(side/2) * cuy] as Vec2;
        return [
            Crosshair.Node({o: subtract(v1 as Vec2,displacement), alpha: 0.5, color: "#d0e681", anchor: this.props.anchor}),
            Crosshair.Node({o: subtract(v2 as Vec2,displacement), alpha: 0.5, color: "#77d4cd", anchor: this.props.anchor}),
        ];
    }

    getPreviousNextPinValues() {
        const id = this.props.topProps.id;
        const sortedPinTimes = Object.entries(this.context.project.signalData[id].pinTimes).sort((a,b) => a[1] as number - (b[1] as number));
        const currentPinId = sortedPinTimes.find(([k,v]) => v as number >= this.context.project.timelineData.playheadPosition)?.[0];
        const currentIndex = sortedPinTimes.findIndex(([k,v]) => k === currentPinId);
        let currentValue : any;
        try {
            currentValue = JSON.parse(this.useDiscreteSignal(id,this.context.project.timelineData.playheadPosition));
        } catch {};

        const previousPinExists = currentIndex > 0;
        const nextPinExists = currentIndex < sortedPinTimes.length - 1;

        let previousPinValue = currentValue;
        let nextPinValue = currentValue;

        if (previousPinExists) {
            try {
                previousPinValue = JSON.parse(this.context.project.signalData[id].pinValues[sortedPinTimes[currentIndex - 1][0]]);
            } catch {};
        }

        if (nextPinExists) {
            try {
                nextPinValue = JSON.parse(this.context.project.signalData[id].pinValues[sortedPinTimes[currentIndex + 1][0]]);
            } catch {};
        }
        return [previousPinValue,nextPinValue];
    }

    getOnionSkinCrosshairPositions() {
        const [previousPinValue,nextPinValue] = this.getPreviousNextPinValues();
        const {
            magnitude: previousMag,
            angle: previousAngle,
            vector: previousVector,
        } = previousPinValue;
        const {
            magnitude: nextMag,
            angle: nextAngle,
            vector: nextVector,
        } = nextPinValue;

        let previous : Vec2, next : Vec2;
        switch (this.props.topProps.degreesOfFreedom) {
            case "1-angular":
                {
                    if (!this.props.topProps.initialLength) throw new Error("Initial length not defined for 1-angular handle");
                    const l = this.props.initialLength;
                    previous = [l*Math.cos(previousAngle),l*Math.sin(previousAngle)];
                    next = [l*Math.cos(nextAngle),l*Math.sin(nextAngle)];
                    break;
                }
            case "1-normal":
                {
                    if (!this.props.topProps.initialDirection) throw new Error("Initial direction not defined for 1-normal handle");
                    const [dx,dy] = scale(this.props.topProps.initialDirection,1/norm(this.props.topProps.initialDirection));
                    previous = scale([dx,dy],previousMag);
                    next = scale([dx,dy],nextMag);
                    break;
                }
            case "2-cartesian":
                {
                    previous = previousVector;
                    next = nextVector;
                    break;
                }
            default:
                throw new Error("Degrees of freedom not defined for VectorHandle");
        }
        const difference = subtract(this.parentO,this.props.anchor);
        previous = add(previous,difference);
        next = add(next,difference);
        return [previous,next];
    }

    // getBox() {
    //     let x : number;
    //     let y : number;
    //     //console.log(this.props);
    //     switch (this.props.degreesOfFreedom) {
    //         case "1-angular":
    //                 const angle = this.retrieveSignalValue(this.props.id) as number;
    //                 if (!this.props.initialLength) throw new Error("Initial length not defined for 1-angular handle");
    //                 const l = this.props.initialLength;
    //                 [x,y] = [l*Math.cos(angle),l*Math.sin(angle)];
    //                 break;
                
    //         case "1-normal":
    //                 const mag = this.retrieveSignalValue(this.props.id) as number;
    //                 if (!this.props.initialDirection) throw new Error("Initial direction not defined for 1-normal handle");
    //                 const [dx,dy] = scale(this.props.initialDirection,1/norm(this.props.initialDirection));
    //                 [x,y] = [dx * mag,dy * mag];
    //                 break;
                
    //         case "2-cartesian":
    //                 [x,y] = this.retrieveSignalValue(this.props.id) as Vec2;
    //                 break;
    //         default:
    //             throw new Error("Degrees of freedom not defined for VectorHandle");
                
    //     }
    //     return new Box([x,y],0,0);
    // }

}


interface Props {
    id?: string;
    type?: "discrete" | "continuous";
    onionSkin?: boolean;
    degreesOfFreedom?: "1-angular" | "1-normal" | "2-cartesian";
    children?: (parent: SignalWindow) => SignalWindow;
    range?: [number,number];
    rangeX?: [number,number];
    rangeY?: [number,number];
    initialDirection?: Vec2;
    initialLength?: number;
    displayLine?: boolean;
    displayCircle?: boolean;
}


class VectorHandle extends SignalWindow {

    // windowDidMount(props: Props): void {
    //     this.setContext('anchor',this.parentO)
    // }


    getChildren(props?: { [key: string]: any; } | undefined): ((parent: CanvasWindow) => CanvasWindow)[] {
        const children = this.props.children ? [...this.props.children] : [];
        const nprops ={id: this.props.id, topProps: this.props, anchor: this.parentO}
        const vectorHandleBox =VectorHandleBox.Node(nprops)
        children.push(vectorHandleBox);
        if (this.props.onionSkin) children.push(OnionSkin.Node({id: this.props.id, topProps: this.props, anchor: this.parentO}));
        return children;
    }

    retrieveSignalValue(id: string) : number | Vec2 {
        if (this.props.type === 'discrete') {
            const discreteValue = this.useDiscreteSignal(id,this.context.project.timelineData.playheadPosition);
            let obj = {
                angle: 0,
                magnitude: 0,
                vector: [0,0] as Vec2,
            };
            try {
                obj = JSON.parse(discreteValue);
            } catch {}
            switch (this.props.degreesOfFreedom) {
                case "1-angular":
                    return obj.angle;
                case "1-normal":
                    return obj.magnitude;
                case "2-cartesian":
                    return obj.vector;
                default:
                    throw new Error("Degrees of freedom not defined for VectorHandle");
            }
        } else {
            switch (this.props.degreesOfFreedom) {
                case "1-angular":
                    return this.useContinuousSignal(id,[-Math.PI,Math.PI]);
                case "1-normal":
                    return this.useContinuousSignal(id,this.props.range);
                case "2-cartesian":
                    let rangeX = this.props.rangeX;
                    let rangeY = this.props.rangeY;
                    if (!rangeX || !rangeY) {
                        const range = this.props.range;
                        if (!range) throw new Error("Range not defined for 2-cartesian handle");
                        rangeX = range;
                        rangeY = range;
                    }
                    const x = this.useContinuousSignal(id+"_x",rangeX);
                    const y = this.useContinuousSignal(id+"_y",rangeY);
                    return [x,y] as Vec2;
                default:
                    throw new Error("Degrees of freedom not defined for VectorHandle");
            }
        }
    }

    getBox() {
        let x : number;
        let y : number;
        //console.log(this.props);
        switch (this.props.degreesOfFreedom) {
            case "1-angular":
                    const angle = this.retrieveSignalValue(this.props.id) as number;
                    if (!this.props.initialLength) throw new Error("Initial length not defined for 1-angular handle");
                    const l = this.props.initialLength;
                    [x,y] = [l*Math.cos(angle),l*Math.sin(angle)];
                    break;
                
            case "1-normal":
                    const mag = this.retrieveSignalValue(this.props.id) as number;
                    if (!this.props.initialDirection) throw new Error("Initial direction not defined for 1-normal handle");
                    const [dx,dy] = scale(this.props.initialDirection,1/norm(this.props.initialDirection));
                    [x,y] = [dx * mag,dy * mag];
                    break;
                
            case "2-cartesian":
                    [x,y] = this.retrieveSignalValue(this.props.id) as Vec2;
                    break;
            default:
                throw new Error("Degrees of freedom not defined for VectorHandle");
                
        }
        return new Box([x,y],0,0);
    }

    render(r: RenderProps): void {
        const mode = this.context.mode;
        if (mode === 'edit' || mode === 'record') {
            const [aox,aoy] = r.absoluteO;
            const [aux,auy] = this.absoluteUnit;
            const centerPoint = [aox + this.w / 2 * aux, aoy + this.h / 2 * auy] as Vec2;
            const [cx,cy] = centerPoint as Vec2;

            if (this.props.displayLine) {
                r.ctx.beginPath();
                r.ctx.strokeStyle = "green";
                r.ctx.lineWidth = 2;
                r.ctx.setLineDash([3, 1]);
                const [pox,poy] = r.localToCanvas(scale(this.o,-1));
                r.ctx.moveTo(pox,poy);
                r.ctx.lineTo(cx,cy);
                r.ctx.stroke();
            }
            if (this.props.displayCircle) {
                r.ctx.beginPath();
                r.ctx.strokeStyle = "green";
                r.ctx.lineWidth = 2;
                r.ctx.setLineDash([3, 1]);
                const radius = norm(this.o);
                const [pox,poy] = r.localToCanvas(scale(this.o,-1));
                r.ctx.ellipse(pox,poy, radius * aux, radius * auy, 0, 0, Math.PI * 2);
                r.ctx.stroke();
            }

            r.ctx.setLineDash([]);

            r.ctx.font = "20px Arial";
            r.ctx.fillStyle = mode === 'edit' ? 'green' : 'pink';
            r.ctx.fillText(this.props.id, cx , cy - 17);

        }
    }
}

interface CartesianVectorHandleProps {
    id: string;
    rangeX?: [number,number];
    rangeY?: [number,number];
    range?: [number,number];
    children?: (parent: CanvasWindow) => CanvasWindow;
    discrete?: boolean;
    displayLine?: boolean;
    onionSkin?: boolean;
}
class CartesianVectorHandle extends CanvasWindow {

    getChildren(props: CartesianVectorHandleProps): ((parent: CanvasWindow) => CanvasWindow)[] {
        const w = [];
        w.push(VectorHandle.Node({id: props.id,
            type: props.discrete ? "discrete" : "continuous",
            degreesOfFreedom: "2-cartesian",
            rangeX: props.rangeX,
            rangeY: props.rangeY,
            range: props.range,
            children: props.children,
            displayLine: props.displayLine,
            onionSkin: props.onionSkin,
        }));
        return w;
    }
}

interface AngularVectorHandleProps {
    id: string;
    children?: (parent: CanvasWindow) => CanvasWindow;
    discrete?: boolean;
    initialLength: number;
    displayCircle?: boolean;
    onionSkin?: boolean;
}

class AngularVectorHandle extends CanvasWindow {
    getChildren(props: AngularVectorHandleProps): ((parent: CanvasWindow) => CanvasWindow)[] {
        const w = [];
        w.push(VectorHandle.Node({id: props.id,
            type: props.discrete ? "discrete" : "continuous",
            degreesOfFreedom: "1-angular",
            children: props.children,
            initialLength: props.initialLength,
            displayCircle: props.displayCircle,
            onionSkin: props.onionSkin,
        }));
        return w;
    }
}

interface NormalVectorHandleProps {
    id: string;
    initialDirection: Vec2;
    range?: [number,number];
    children?: (parent: CanvasWindow) => CanvasWindow;
    discrete?: boolean;
    displayLine?: boolean;
    onionSkin?: boolean;
}


// const NormalVectorHandle : FunctionCanvasWindow<NormalVectorHandleProps> = (props) => {
//     const prototype = VectorHandle.prototype;
//     const obj = Object.create(prototype);
//     obj.getChildren = function() {
//         const w = [];
//         w.push(VectorHandle.Node({
//             id: props.id,
//             type: props.discrete ? "discrete" : "continuous",
//             degreesOfFreedom: "1-normal",
//             initialDirection: props.initialDirection,
//             range: props.range,
//             children: props.children,
//             displayLine: props.displayLine,
//             onionSkin: props.onionSkin,
//         }));
//         return w;
//     }
//     return obj.Node;
// }

class NormalVectorHandle extends CanvasWindow<NormalVectorHandleProps> {

    getChildren(props :NormalVectorHandleProps): ((parent: CanvasWindow) => CanvasWindow)[] {
        const w = [];
        w.push(VectorHandle.Node({id: props.id,
            type: props.discrete ? "discrete" : "continuous",
            degreesOfFreedom: "1-normal",
            initialDirection: props.initialDirection,
            range: props.range,
            children: props.children,
            displayLine: props.displayLine,
            onionSkin: props.onionSkin,
        }));
        return w;
    }
}

export { CartesianVectorHandle, AngularVectorHandle, NormalVectorHandle };  