import { Box, RenderProps } from "../CanvasWindows";
import { CanvasWindow } from "./Dependencies";

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);


interface ExtendedRenderProps extends RenderProps {
    useContinuousSignal: (signalName: string, range: [number,number], frame?: number) => number;
    useDiscreteSignal: (signalName: string, frame?: number) => string;
}

class Frame extends CanvasWindow {

    layer = 1000;
    getBox() {
        return new Box([0,0], this.parentW, this.parentH);
    }

    render(r: RenderProps): void {
        // console.log('frame render',this.o,this.w,this.h)
        this.strokeOutline(r,'green')
    }

}


class SignalWindow extends CanvasWindow {

    evaluateSignal(signalId: string, frame: number) {
        const [value,errorLog] = this.context.controller.interpolateSignalValueAtTime(signalId, frame);
        if (errorLog.length > 0) {
            console.error(errorLog);
        }
        return value;
    }

    get currentFrame() : number {
        const playheadPosition = this.context.project.timelineData.playheadPosition;
        return playheadPosition ? playheadPosition : 0;
    }

    getChildren() {
        if (this.context.mode === 'edit' || this.context.mode === 'record') {
            return [Frame.Node()]
        } else return [];
    }

    useSignal(signalId : string, signalType : 'continuous' | 'discrete', range: [number,number] | undefined, frame?: number) : string | number {
        const signalIdIdx = this.context.project.orgData.signalIds.findIndex((csignalId : string) => csignalId === signalId);
        if (signalIdIdx === -1) {
            if (signalType === "continuous") {
                this.context.projectTools.createSignal(signalId, signalType, signalId, range);
                this.context.projectTools.addPinContinuous(signalId,generateId(),this.context.project.timelineData.numberOfFrames,range![1],"return easyLinear();",true);
            }
            if (signalType === "discrete") {
                this.context.projectTools.createSignal(signalId, signalType, signalId);
                this.context.projectTools.addPinDiscrete(signalId,generateId(),this.context.project.timelineData.numberOfFrames,"default",true);
            }
        }
        const value = this.evaluateSignal(signalId,frame ? frame : this.currentFrame);
        return value;
    }
    setSignalValue(signalId: string, signalType: 'discrete' | 'continuous', value: number | string, frame: number, commit: boolean) {
        if (signalType === "continuous") {
            this.context.projectTools.addPinContinuous(signalId,generateId(),frame,value,"return easyLinear();",commit);
        }
        if (signalType === "discrete") {
            this.context.projectTools.addPinDiscrete(signalId,generateId(),frame,value,commit);
        }
    }
    setDiscreteSignalValue(signalId: string, value: string, commit: boolean = true, frame?: number  ) {
        const signalIdIdx = this.context.project.orgData.signalIds.findIndex((csignalId : string) => csignalId === signalId);
        if (signalIdIdx === -1) {
            this.context.projectTools.createSignal(signalId, "discrete", signalId);
        }
        frame = frame ? frame : this.currentFrame;
        this.setSignalValue(signalId,'discrete',value,frame,commit);
    }
    setContinuousSignalValue(signalId: string, value: number, commit: boolean = true, range: [number,number], frame?: number ) {
        const signalIdIdx = this.context.project.orgData.signalIds.findIndex((csignalId : string) => csignalId === signalId);
        if (signalIdIdx === -1) {
            this.context.projectTools.createSignal(signalId, "continuous", signalId, range);
        }
        frame = frame ? frame : this.currentFrame;
        this.setSignalValue(signalId,'continuous',value,frame,commit);
    }


    useContinuousSignal(signalId: string, range: [number,number], frame?: number) : number {
        return this.useSignal(signalId,'continuous',range,frame) as number;
    }
    useDiscreteSignal(signalId: string, frame?: number) : string {
        return this.useSignal(signalId,'discrete',undefined,frame) as string;
    }
    render(r: RenderProps): void {
        if (this.context.mode === 'edit' || this.context.mode === 'record') {
            // this.strokeOutline(r,'green')
        }
        const extendedRenderProps = {
            ...r,
            useContinuousSignal: this.useContinuousSignal.bind(this),
            useDiscreteSignal: this.useDiscreteSignal.bind(this),
        }

        this.draw(extendedRenderProps);
    }
    draw(r: ExtendedRenderProps): void {}
}

export type { ExtendedRenderProps };
export default SignalWindow;