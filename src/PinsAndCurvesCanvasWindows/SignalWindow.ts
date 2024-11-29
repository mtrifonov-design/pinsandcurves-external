import { RenderProps } from "../CanvasWindows";
import { CanvasWindow } from "./Dependencies";

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

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
        if (this.context.mode === 'edit') {
            this.strokeOutline(r,'green')
        }
        this.draw(r);
    }
    draw(r: RenderProps): void {}
}

export default SignalWindow;