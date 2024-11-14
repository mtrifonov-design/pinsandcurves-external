import { ProjectDataStructure } from '..';
import type { InterpolationFunctionContext,
    InterpolationFunction,
    InterpolateSignalError,
    InterpolateSignalErrorLog,
    InterpolateSignalReturnType

} from './types';

type Project = ProjectDataStructure.PinsAndCurvesProject;
type SignalData = ProjectDataStructure.SignalData;
type Signal = ProjectDataStructure.Signal;
type DiscreteSignal = ProjectDataStructure.DiscreteSignal;
type ContinuousSignal = ProjectDataStructure.ContinuousSignal;


const cachedFunctions : {
    [key: string] : {
        functionString: string,
        cachedFunction: InterpolationFunction
    } | undefined
} = {};



const interpolateContinuousSignalValue = (project: Project, signalId : string, frame : number, iterationCount : number) : InterpolateSignalReturnType => {

    const signalData = project.signalData;
    const signal = signalData[signalId] as ContinuousSignal;
    const [min,max] = signal.range;
    const sortedPinTimes = Object.entries(signal.pinTimes).sort((a,b) => a[1] as number - (b[1] as number));
    const nextPin = sortedPinTimes.find(([pinId, pinTime]) => pinTime as number > frame);
    if (nextPin === undefined) {
        return [min,[]];
    }
    const [nextPinId, nextPinTime] = nextPin as [string,number];
    const nextPinValue = signal.pinValues[nextPinId] as number;
    const nextPinFunctionString = signal.curves[nextPinId] as string;

    let previousPinValue = min;
    let previousPinTime = 0;
    const previousPinIdx = sortedPinTimes.findIndex(([pinId, pinTime]) => pinId === nextPinId);
    if (previousPinIdx > 0) {
        const [previousPinId, previousPinTime_] = sortedPinTimes[previousPinIdx - 1];
        previousPinValue = signal.pinValues[previousPinId] as number;
        previousPinTime = previousPinTime_ as number;
    }

    let interpolationFunction;
    const cachedFunction = cachedFunctions[signalId+nextPinId]
    if (cachedFunction === undefined || cachedFunction.functionString !== nextPinFunctionString) {
        const completeFunctionString = `
            let nextPinTime = context.nextPinTime;
            let nextPinValue = context.nextPinValue;
            let previousPinTime = context.previousPinTime;
            let previousPinValue = context.previousPinValue;
            let linearInterpolation = context.linearInterpolation;
            let easyLinear = context.easyLinear;
            let relativeTime = context.relativeTime;
            let interpolateSignalValue = context.interpolateSignalValue;
            ${nextPinFunctionString}`
        interpolationFunction = new Function("context",completeFunctionString);
        cachedFunctions[signalId+nextPinId] = {
            functionString: nextPinFunctionString,
            cachedFunction: interpolationFunction as InterpolationFunction
        };
    } else {
        interpolationFunction = cachedFunction.cachedFunction;
    }

    const relativeTime = (frame - previousPinTime) / (nextPinTime - previousPinTime);

    let value = min;
    let errorLog = [];
    try {
        value  = interpolationFunction(
            {
                nextPinTime,
                nextPinValue,
                previousPinTime,
                previousPinValue,
                relativeTime,
                linearInterpolation: (a: number, b: number, t: number) => a + (b - a) * t,
                easyLinear: () => previousPinValue + (nextPinValue - previousPinValue) * relativeTime,
                interpolateSignalValueAtTime: (signalId: string, frame: number) => {
                    const [resultVal,resultErrorLog] = interpolateSignalValue(project,signalId,frame,iterationCount)
                    if (typeof resultVal === 'string') {
                        throw new Error("Interpolation function returned string");
                    }
                    errorLog.push(...resultErrorLog);
                    return resultVal;
                }
            }
        );
    } catch (e : any) {
        errorLog.push({
            signalId,
            frame,
            error: e.message,
        })
    }


    if (isNaN(value)) {
        value = min;
        errorLog.push(
            {
                signalId,
                frame,
                error: "Interpolated value is NaN",
            }
        )
    }
    if (value < min) {
        value = min;
        errorLog.push(
            {
                signalId,
                frame,
                error: "Interpolated value below minimum",
            }
        )
    }
    if (value > max) {
        value = max;
        errorLog.push(
            {
                signalId,
                frame,
                error: "Interpolated value above maximum",
            }
        )
    }
    return [value,errorLog];
};

const interpolateDiscreteSignalValue = (project: Project, signalId : string, frame : number, errorMessages : string[] = []) : string => {
    const signalData = project.signalData;
    const signal = signalData[signalId] as DiscreteSignal;
    const sortedPinTimes = Object.entries(signal.pinTimes).sort((a,b) => a[1] as number - (b[1] as number));
    const nextPin = sortedPinTimes.find(([pinId, pinTime]) => pinTime as number > frame);
    if (nextPin === undefined) {
        return "END VALUE";
    }
    const [nextPinId, nextPinTime] = nextPin;
    const value = signal.pinValues[nextPinId] as string;
    return value;
};



const interpolateSignalValue = (project: Project, signalId : string, frame : number, iterationCount: number = 0) : InterpolateSignalReturnType => { 
    iterationCount++;
    if (iterationCount > 1000) {
        throw new Error("Exceeded maximum iteration count");
    }
    
    // check if time is within the range of the project
    const numberOfFrames = project.timelineData.numberOfFrames;
    if (frame < 0 || frame > numberOfFrames) {
        throw new Error("Time out of range");
    }

    const signalData = project.signalData;
    const signalType = (signalData[signalId] as Signal).type;
    if (signalType === 'discrete') {
        return [interpolateDiscreteSignalValue(project,signalId,frame),[]];
    }
    if (signalType === 'continuous') {
        return interpolateContinuousSignalValue(project,signalId,frame,iterationCount);
    }
    throw new Error("Invalid signal type");
};

export default interpolateSignalValue;