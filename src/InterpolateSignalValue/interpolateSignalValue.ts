import { ProjectDataStructure } from '..';
import type { InterpolationFunctionContext,
    InterpolationFunction,
    InterpolateSignalError,
    InterpolateSignalErrorLog,
    InterpolateSignalReturnType

} from './types';

import getContext from './getContext';
import getTemplates from './getTemplates';

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

const TOLERANCE = 1e-6;

const interpolateContinuousSignalValue = (project: Project, signalId : string, frame : number, iterationCount : number) : InterpolateSignalReturnType => {

    const signalData = project.signalData;
    const signal = signalData[signalId] as ContinuousSignal;
    const [min,max] = signal.range;
    const sortedPinTimes = Object.entries(signal.pinTimes).sort((a,b) => a[1] as number - (b[1] as number));
    const nextPin = sortedPinTimes.find(([pinId, pinTime]) => pinTime as number >= frame);
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
            let relativeTime = context.relativeTime;
            let frame = context.frame;
            let numberOfFrames = context.numberOfFrames;
            let framesPerSecond = context.framesPerSecond;

            let interpolateSignalValue = context.interpolateSignalValue;

            let easyLinear = context.easyLinear;
            let easyEaseIn = context.easyEaseIn;
            let easyEaseOut = context.easyEaseOut;
            let easyStep = context.easyStep;
            let easyEase = context.easyEase;
            let easyEaseOutElastic = context.easyEaseOutElastic;


            ${nextPinFunctionString}`
        interpolationFunction = new Function("context","templates",completeFunctionString);
        // console.log(interpolationFunction.toString())
        cachedFunctions[signalId+nextPinId] = {
            functionString: nextPinFunctionString,
            cachedFunction: interpolationFunction as InterpolationFunction
        };
    } else {
        interpolationFunction = cachedFunction.cachedFunction;
    }

    const timeDelta = nextPinTime !== previousPinTime ? nextPinTime - previousPinTime : 1;
    const relativeTime = (frame - previousPinTime) / timeDelta;

    let value = min;
    let errorLog = [];
    try {
        const context = getContext({
            nextPinTime,
            nextPinValue,
            previousPinTime,
            project,
            previousPinValue,
            relativeTime,
            pinId: nextPinId,
            frame,
            range: [min,max],
            numberOfFrames: project.timelineData.numberOfFrames,
            framesPerSecond: project.timelineData.framesPerSecond,
            interpolateSignalValueAtTime: (signalName: string, frame: number) => {
                const signalId = project.orgData.signalIds.find((signalId) => project.orgData.signalNames[signalId] === signalName);
                if (signalId === undefined) {
                    throw new Error("Signal not found");
                }
                const [resultVal,resultErrorLog] = interpolateSignalValue(project,signalId,frame,iterationCount)
                if (typeof resultVal === 'string') {
                    throw new Error("Interpolation function returned string");
                }
                errorLog.push(...resultErrorLog);
                return resultVal;
            },
        });
        const templates = getTemplates(project);
        // console.log(templates)
        value  = interpolationFunction(context,templates);
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
        if (Math.abs(value - min) > TOLERANCE) {
            errorLog.push(
                {
                    signalId,
                    frame,
                    error: "Interpolated value below minimum",
                }
            )
        }
    }
    if (value > max) {
        const errorValue = value;
        value = max;
        if (Math.abs(errorValue - max) > TOLERANCE) {
            errorLog.push(
                {
                    signalId,
                    frame,
                    error: "Interpolated value above maximum: " + errorValue,
                }
            )
        }
    }
    return [value,errorLog];
};

const interpolateDiscreteSignalValue = (project: Project, signalId : string, frame : number, errorMessages : string[] = []) : string => {
    const signalData = project.signalData;
    const signal = signalData[signalId] as DiscreteSignal;
    const sortedPinTimes = Object.entries(signal.pinTimes).sort((a,b) => a[1] as number - (b[1] as number));
    const nextPin = sortedPinTimes.find(([pinId, pinTime]) => pinTime as number >= frame);
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