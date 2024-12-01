
import { MouseHandlerProps, RenderProps,Box, Vec2, add, subtract } from "./Dependencies";
import SignalWindow from "./SignalWindow";

const side = 25;

class DiscreteVectorHandle extends SignalWindow {

    windowDidMount(props: { [key: string]: any; }): void {
        this.setState([props.x,props.y]);
    }


    getBox() {
        // console.log(this.state)
        const [cwidth, cheight] = [this.context.dimensions.width, this.context.dimensions.height];
        let [x,y] = [0,0];
        try {
            let frame = this.context.project.timelineData.playheadPosition;
            frame = frame > 0 ? frame -1 : 0;
            [x,y] = JSON.parse(this.useDiscreteSignal(`${this.props.id}`,frame));
        } catch {}
        const [cux,cuy] = this.canvasUnit;
        this.getCurrentPreviousNext();
        return new Box([x ,y ],side * cux,side * cuy);
    }



    currentPreviousNext: {current: number[], previous: number[], next: number[]} = {current: [0,0], previous: [0,0], next: [0,0]};
    getCurrentPreviousNext() {
        const id = this.props.id;
        const sortedPinTimes = Object.entries(this.context.project.signalData[id].pinTimes).sort((a,b) => a[1] as number - (b[1] as number));
        const currentPinId = sortedPinTimes.find(([k,v]) => v as number >= this.context.project.timelineData.playheadPosition)?.[0];
        const currentIndex = sortedPinTimes.findIndex(([k,v]) => k === currentPinId);
        let currentValue = [0,0];
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

        this.currentPreviousNext = {
            current: currentValue,
            previous: previousPinValue,
            next: nextPinValue,
        }
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
        this.setDiscreteSignalValue(`${this.props.id}`,JSON.stringify(rp),commit);
        // this.setContinuousSignalValue(`${this.props.id}_x`,rp[0],commit,[-cwidth,cwidth * 2]);
        // this.setContinuousSignalValue(`${this.props.id}_y`,rp[1],commit,[-cheight,cheight * 2]);
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

    drawCrosshairs(r: RenderProps,[x,y]: Vec2, alpha: number = 1) {
        const mode = this.context.mode;
        const [aux,auy] = this.absoluteUnit;
        [x,y] = add([x * aux,y * auy],r.absoluteO);
        const centerPoint = [x + this.w / 2 * aux, y + this.h / 2 * auy];
        const [cx,cy] = centerPoint;
        r.ctx.strokeStyle = mode === 'edit' ? 'green' : this.dragging ? 'red' : 'pink';
        r.ctx.lineWidth = 2;
        r.ctx.beginPath();
        r.ctx.ellipse(centerPoint[0], centerPoint[1], this.w / 2 * aux, this.h / 2* auy, 0, 0, Math.PI * 2);
        r.ctx.stroke();
        r.ctx.beginPath();

        r.ctx.moveTo(cx - this.w / 2 *aux, cy);
        r.ctx.lineTo(cx + this.w / 2 *aux, cy);
        r.ctx.moveTo(cx, cy - this.h / 2*auy);
        r.ctx.lineTo(cx, cy + this.h / 2*auy);
        r.ctx.stroke();
    }

    render(r: RenderProps): void {
        const mode = this.context.mode;
        if (mode === 'edit' || mode === 'record') {
            // const [aox,aoy] = r.absoluteO;
            // const [aux,auy] = this.absoluteUnit;
            // const centerPoint = [aox + this.w / 2 * aux, aoy + this.h / 2 * auy];
            // const [cx,cy] = centerPoint;
            // r.ctx.beginPath();
            // r.ctx.ellipse(centerPoint[0], centerPoint[1], this.w / 2 * aux, this.h / 2* auy, 0, 0, Math.PI * 2);
            // r.ctx.strokeStyle = mode === 'edit' ? 'green' : this.dragging ? 'red' : 'pink';
            // r.ctx.lineWidth = 2;
            // r.ctx.stroke();
            // // add crosshairs
            // r.ctx.beginPath();
            // r.ctx.moveTo(cx - this.w / 2 *aux, cy);
            // r.ctx.lineTo(cx + this.w / 2 *aux, cy);
            // r.ctx.moveTo(cx, cy - this.h / 2 *auy);
            // r.ctx.lineTo(cx, cy + this.h / 2 *auy);
            // r.ctx.stroke();
            this.drawCrosshairs(r,[0,0],1);
            const {previous, current, next} = this.currentPreviousNext;
            const relPrevious = subtract(previous as Vec2,current as Vec2);
            const relNext = subtract(next as Vec2,current as Vec2);
            this.drawCrosshairs(r,relPrevious,0.5);
            this.drawCrosshairs(r,relNext,0.5);



            r.ctx.font = "20px Arial";
            r.ctx.fillStyle = mode === 'edit' ? 'green' : 'pink';

            const [aux,auy] = this.absoluteUnit;
            const [x,y] = r.absoluteO;
            const centerPoint = [x + this.w / 2 * aux, y + this.h / 2 * auy];
            const [cx,cy] = centerPoint;
            r.ctx.fillText(this.props.id, cx , cy - 17);
        }
    }
}

export default DiscreteVectorHandle;