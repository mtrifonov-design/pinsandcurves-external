type InterpolationFunctionContext = {
    nextPinTime: number,
    nextPinValue: number,
    previousPinTime: number,
    previousPinValue: number,
    relativeTime: number,
    linearInterpolation: (a: number, b: number, t: number) => number,
    easyLinear: () => number,
    interpolateSignalValue: (signalId: string, frame: number) => number,
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