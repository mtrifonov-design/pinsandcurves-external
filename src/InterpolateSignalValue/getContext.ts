
import { interpolateSignalValue } from '.';
import { Project } from '../PinsAndCurvesProjectController';
import type { InterpolationFunctionContext, InterpolationFunction, InterpolateSignalError, InterpolateSignalErrorLog, InterpolateSignalReturnType } from './types';

type Vec2 = {x: number,y:number}
const cubic = (P0 : Vec2, P1:Vec2, P2 : Vec2, P3 : Vec2, t: number) => {
    const x0 = P0.x;
    const y0 = P0.y;
  
    const x1 = P1.x;
    const y1 = P1.y;
  
    const x2 = P2.x;
    const y2 = P2.y;
  
    const x3 = P3.x;
    const y3 = P3.y;
  
    const y = (t : number) =>
      Math.pow(1 - t, 3) * y0 +
      3 * Math.pow(1 - t, 2) * t * y1 +
      3 * (1 - t) * Math.pow(t, 2) * y2 +
      Math.pow(t, 3) * y3;
  
    // const x = (t : number) =>
    //   Math.pow(1 - t, 3) * x0 +
    //   3 * Math.pow(1 - t, 2) * t * x1 +
    //   3 * (1 - t) * Math.pow(t, 2) * x2 +
    //   Math.pow(t, 3) * x3;
  
    // const res = [];
  
    // for (let t = 0; t <= 1; t = t + 1 / 60) {
    //   const valX = x(t);
    //   const valY = y(t);
    //   res.push({ x: valX, y: valY });
    // }
    // res.push({ x: 1, y: 0 });
  
    // return res;

    return y(t);
  };

  const hermite = (P0 : Vec2, P1:Vec2, P2 : Vec2, P3 : Vec2, t: number) => {

    const x0 = P0.x;
    const y0 = P0.y;
  
    const x1 = P1.x;
    const y1 = P1.y;
  
    const x2 = P2.x;
    const y2 = P2.y;
  
    const x3 = P3.x;
    const y3 = P3.y;

    const p0 = y0;
    const p1 = y3;
    const m0 = (y1 - y0) / (x1 - x0);
    const m1 = (y3 - y2) / (x3 - x2);

    const ts = (t - x0) / (x3 - x0);

    const h00 = 2 * Math.pow(ts, 3) - 3 * Math.pow(ts, 2) + 1;
    const h10 = Math.pow(ts, 3) - 2 * Math.pow(ts, 2) + ts;
    const h01 = -2 * Math.pow(ts, 3) + 3 * Math.pow(ts, 2);
    const h11 = Math.pow(ts, 3) - Math.pow(ts, 2);

    return h00 * p0 + h10 * m0 * (x3-x0) + h01 * p1 + h11 * m1 * (x3-x0);

  

}


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



const assets : { [key:string] : any } = {};
function saveAsset(assetId: string, asset: any) {
    if (assetId in assets) return;
    assets[assetId] = asset;
    // console.log('saveAsset', assetId, asset);
}

function useAsset(assetId: string) {
    if (assetId in assets) {
        return assets[assetId];
    }
    return null;
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
    defaultValue: number,
    project: Project,
    interpolateSignalValueAtTime: (signalId: string, frame: number) => number,
}

function getContext(p: GetContextProps): InterpolationFunctionContext {

    const { nextPinTime, project, range, defaultValue, pinId, frame, numberOfFrames, framesPerSecond, nextPinValue, previousPinTime, previousPinValue, relativeTime, interpolateSignalValueAtTime } = p;

    const [minValue, maxValue] = range;

    return {
        nextPinTime,
        nextPinValue,
        project,
        previousPinTime,
        defaultValue,
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
        bezier: () => {
            const signalId = project.orgData.signalIdByPinId[p.pinId]
            const signal = project.signalData[signalId]
            if (signal && "bezier" in signal) {
                const nextBezierControlPoints = signal.bezierControlPoints[p.pinId] as [number, number, number, number];
                let [t1,v1] = nextBezierControlPoints;
                t1 = t1 + nextPinTime;
                v1 += nextPinValue;

                let previousPinIdx = signal.pinIds.indexOf(p.pinId) - 1;
                previousPinIdx = previousPinIdx < 0 ? 0 : previousPinIdx;

                const previousPinId = signal.pinIds[previousPinIdx];
                const previousBezierControlPoints = signal.bezierControlPoints[previousPinId] as [number, number, number, number];
                let [_,__,t0,v0] = previousBezierControlPoints;
                t0 = t0 + previousPinTime;
                v0 += previousPinValue;

                const P1 = {x: previousPinTime, y: previousPinValue};
                const P2 = {x: t0, y: v0};
                const P3 = {x: t1, y: v1};
                const P4 = {x: nextPinTime, y: nextPinValue};
                return cubic(P1,P2,P3,P4,relativeTime);
            }
            return defaultValue;
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
        signal: (signalId: string) => interpolateSignalValueAtTime(signalId, frame),
        useAsset,
        saveAsset,
    }


}

export default getContext;