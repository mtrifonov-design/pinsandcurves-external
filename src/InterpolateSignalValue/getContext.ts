
import { interpolateSignalValue } from '.';
import { Project } from '../PinsAndCurvesProjectController';
import type { InterpolationFunctionContext, InterpolationFunction, InterpolateSignalError, InterpolateSignalErrorLog, InterpolateSignalReturnType } from './types';

function linearInterpolation(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function easeInCubic(x: number): number {
    return x * x * x;
}

function easeOutCubic(x: number): number {
    return 1 - Math.pow(1 - x, 3);
}

function easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeOutElastic(x: number): number {
    const c4 = (2 * Math.PI) / 3;

    return x === 0
        ? 0
        : x === 1
            ? 1
            : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

type GetContextProps = {
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
    project: Project,
    interpolateSignalValueAtTime: (signalId: string, frame: number) => number,
}

function getContext(p: GetContextProps): InterpolationFunctionContext {

    const { nextPinTime, project, range, pinId, frame, numberOfFrames, framesPerSecond, nextPinValue, previousPinTime, previousPinValue, relativeTime, interpolateSignalValueAtTime } = p;

    const [minValue, maxValue] = range;

    return {
        nextPinTime,
        nextPinValue,
        project,
        previousPinTime,
        previousPinValue,
        relativeTime,
        frame,
        pinId,
        numberOfFrames,
        framesPerSecond,
        maxValue,
        minValue,
        linearInterpolation,
        easeInCubic,
        easeOutCubic,
        easeInOutCubic,
        easeOutElastic,
        easyLinear: () => {
            return relativeTime * (nextPinValue - previousPinValue) + previousPinValue;
        },
        easyStep: () => {
            return nextPinValue;
        },
        easyEaseIn: () => {
            return previousPinValue + easeInCubic(relativeTime) * (nextPinValue - previousPinValue);
        },
        easyEaseOut: () => {
            return previousPinValue + easeOutCubic(relativeTime) * (nextPinValue - previousPinValue);
        },
        easyEase: () => {
            return previousPinValue + easeInOutCubic(relativeTime) * (nextPinValue - previousPinValue);
        },
        easyEaseOutElastic: () => {
            return previousPinValue + easeOutElastic(relativeTime) * (nextPinValue - previousPinValue);
        },
        interpolateSignalValueAtTime,
    }


}

export default getContext;