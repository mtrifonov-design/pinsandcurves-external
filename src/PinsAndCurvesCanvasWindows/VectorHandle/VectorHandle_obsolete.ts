import { add, subtract } from "mathjs";
import { MouseHandlerProps, RenderProps,Box, Vec2 } from "../Dependencies";
import SignalWindow from "../SignalWindow";

const side = 25;

class VectorHandle extends SignalWindow {

    windowDidMount(props: { [key: string]: any; }): void {
        this.setState([props.x,props.y]);
    }


    getBox() {
        // console.log(this.state)
        const [cwidth, cheight] = [this.context.dimensions.width, this.context.dimensions.height];
        const x = this.useContinuousSignal(`${this.props.id}_x`,[-cwidth,cwidth * 2]);
        const y = this.useContinuousSignal(`${this.props.id}_y`,[-cheight,cheight * 2]);
        const [cux,cuy] = this.canvasUnit;
        return new Box([x ,y ],side * cux,side * cuy);
    }

    dragging: boolean = false;
    onMouseDown(p: MouseHandlerProps, e: MouseEvent): void {
        if (p.pointInside && this.context.mode === "record") this.dragging = true;
    }
    moveHandle(p: MouseHandlerProps,commit: boolean) {
        const a = p.absolutePos;
        const [cwidth, cheight] = [this.context.dimensions.width, this.context.dimensions.height];
        const c = [cwidth * 1.5, cheight * 1.5];
        const rp = subtract(a,this.parentO) as Vec2
        this.context.projectTools.returnToLastCommit();
        this.setContinuousSignalValue(`${this.props.id}_x`,rp[0],commit,[-cwidth,cwidth * 2]);
        this.setContinuousSignalValue(`${this.props.id}_y`,rp[1],commit,[-cheight,cheight * 2]);
        this.context.projectTools.pushUpdate();
    }
    onMouseMove(p: MouseHandlerProps, e: MouseEvent): void {
        if (this.dragging) {
            this.moveHandle(p,false);
        }
    }
    onMouseUp(p: MouseHandlerProps, e: MouseEvent): void {
        if (this.dragging) {
            this.moveHandle(p,true);
            this.dragging = false;
        }
    }

    render(r: RenderProps): void {
        const mode = this.context.mode;
        if (mode === 'edit' || mode === 'record') {
            const [aox,aoy] = r.absoluteO;
            const [aux,auy] = this.absoluteUnit;
            const centerPoint = [aox + this.w / 2 * aux, aoy + this.h / 2 * auy];
            const [cx,cy] = centerPoint;
            r.ctx.beginPath();
            r.ctx.ellipse(centerPoint[0], centerPoint[1], this.w / 2 * aux, this.h / 2* auy, 0, 0, Math.PI * 2);
            r.ctx.strokeStyle = mode === 'edit' ? 'green' : this.dragging ? 'red' : 'pink';
            r.ctx.lineWidth = 2;
            r.ctx.stroke();
            // add crosshairs
            r.ctx.beginPath();
            r.ctx.moveTo(cx - this.w / 2 *aux, cy);
            r.ctx.lineTo(cx + this.w / 2 *aux, cy);
            r.ctx.moveTo(cx, cy - this.h / 2 *auy);
            r.ctx.lineTo(cx, cy + this.h / 2 *auy);
            r.ctx.stroke();


            r.ctx.font = "20px Arial";
            r.ctx.fillStyle = mode === 'edit' ? 'green' : 'pink';


            r.ctx.fillText(this.props.id, cx , cy - 17);
        }
    }
}

export default VectorHandle;