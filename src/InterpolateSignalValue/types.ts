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

    linearInterpolation: (a: number, b: number, t: number) => number,
    easeInCubic: (x: number) => number,
    easeOutCubic: (x: number) => number,
    easeInOutCubic: (x: number) => number,
    easeOutElastic: (x: number) => number


    easyLinear: () => number,
    easyStep: () => number,
    easyEaseIn: () => number,
    easyEaseOut: () => number,
    easyEase: () => number,
    easyEaseOutElastic: () => number,

    interpolateSignalValueAtTime: (signalId: string, frame: number) => number,

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

export type { InterpolationFunctionContext, InterpolationFunction, InterpolateSignalError, InterpolateSignalErrorLog, InterpolateSignalReturnType };