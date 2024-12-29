import { Project } from "../PinsAndCurvesProjectController";


type InterpolationFunctionPreContext = {
    nextPinTime: number
    nextPinValue: number,
    previousPinTime: number,
    previousPinValue: number,
    pinId: string,
    relativeTime: number,
    frame: number,
    numberOfFrames: number,
    framesPerSecond: number,
    range: [number, number],
    defaultValue: number,
    project: Project,
    interpolateSignalValueAtTime: (signalId: string, frame: number) => number,
}

type InterpolationFunctionContext = {
    nextPinTime: number,
    nextPinValue: number,
    previousPinTime: number,
    previousPinValue: number,
    relativeTime: number,
    frame: number,
    numberOfFrames: number,
    framesPerSecond: number,
    maxValue: number,
    minValue: number,
    defaultValue: number,
    pinId: string,
    project: Project,

    linearInterpolation: (a: number, b: number, t: number) => number,
    easeInCubic: (x: number) => number,
    easeOutCubic: (x: number) => number,
    easeInOutCubic: (x: number) => number,
    easeOutElastic: (x: number) => number,


    easyLinear: () => number,
    easyStep: () => number,
    easyEaseIn: () => number,
    easyEaseOut: () => number,
    easyEase: () => number,
    easyEaseOutElastic: () => number,
    bezier: () => number,
    easyInOut: () => number,
    easyParabola: () => number,
    easyThreshold: () => number,
    easyRepeat: () => number,

    interpolateSignalValueAtTime: (signalId: string, frame: number) => number,
    signal: (signalId: string) => number,
    noise: (x: number) => number,

    fitSignal: (signalName: string, startValue?: number, endValue?: number) => void,
    cloneSignal: (signalName: string) => void,
    flip: (value: number) => void,

    useAsset: (assetId: string) => any,
    saveAsset: (assetId: string, asset: any) => void,

};

type InterpolationFunction = (
    context: InterpolationFunctionContext,    
) => number;

type InterpolateSignalError = {
    signalId: string,
    frame: number,
    error: string,
}

type InterpolateSignalErrorLog = InterpolateSignalError[];

type InterpolateSignalReturnType = [string | number, InterpolateSignalErrorLog];

export type { InterpolationFunctionContext, InterpolationFunctionPreContext, InterpolationFunction, InterpolateSignalError, InterpolateSignalErrorLog, InterpolateSignalReturnType };