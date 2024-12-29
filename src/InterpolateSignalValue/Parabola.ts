import { Vec2 } from "../CanvasWindows";
import { InterpolationFunctionPreContext } from "./types";
import { Signal } from "../ProjectDataStructure";

function findQuadraticParameters(point1 : Vec2, point2 : Vec2, point3: Vec2) {
    // Extract the points
    const [x1, y1] = point1;
    const [x2, y2] = point2;
    const [x3, y3] = point3;
    // Solve the system of linear equations to find a, b, c
    const denominator = (x1 - x2) * (x1 - x3) * (x2 - x3);

    if (denominator === 0) {
        return { a: 0, b: 0, c: 0 };
    }
  
    const a = (y1 * (x2 - x3) + y2 * (x3 - x1) + y3 * (x1 - x2)) / denominator;
    const b = (y1 * (x3 ** 2 - x2 ** 2) + y2 * (x1 ** 2 - x3 ** 2) + y3 * (x2 ** 2 - x1 ** 2)) / denominator;
    const c = (y1 * (x2 * x3 * (x2 - x3)) + y2 * (x3 * x1 * (x3 - x1)) + y3 * (x1 * x2 * (x1 - x2))) / denominator;
  
    return { a, b, c };
  }

const parabolaStart = (context: InterpolationFunctionPreContext) => {

      const project = context.project;
      const signalId = context.project.orgData.signalIdByPinId[context.pinId];
      const pinIds = (project.signalData[signalId] as Signal).pinIds;
      const idx = pinIds.indexOf(context.pinId);
      if (idx === 0) {
          return context.previousPinValue;
      } 
      if (idx === pinIds.length - 1) {
          return context.nextPinValue;
      }
        const previousPinId = pinIds[idx - 1];
        const nextPinId = pinIds[idx + 1];
        const previousPinTime = (project.signalData[signalId] as Signal).pinTimes[previousPinId];
        const previousPinValue = (project.signalData[signalId] as Signal).pinValues[previousPinId];

        const thisPinTime = context.nextPinTime;
        const thisPinValue = context.nextPinValue;

        const nextPinTime = (project.signalData[signalId] as Signal).pinTimes[nextPinId];
        const nextPinValue = (project.signalData[signalId] as Signal).pinValues[nextPinId];

        const point1 = [previousPinTime, previousPinValue] as Vec2;
        const point2 = [thisPinTime, thisPinValue] as Vec2;
        const point3 = [nextPinTime, nextPinValue] as Vec2;

        const { a, b, c } = findQuadraticParameters(point1, point2, point3);

        const x = context.frame;

        const value = a * x * x + b * x + c;
        if (isNaN(value)) {
            return context.nextPinValue;
        }
        return value;
}

const parabolaEnd = (context: InterpolationFunctionPreContext) => {

      const project = context.project;
      const signalId = context.project.orgData.signalIdByPinId[context.pinId];
      const pinIds = (project.signalData[signalId] as Signal).pinIds;
      const idx = pinIds.indexOf(context.pinId);
      if (idx < 2) {
          return context.previousPinValue;
      } 
        const previousPinId = pinIds[idx - 1];
        const ppreviousPinId = pinIds[idx - 2];
        const previousPinTime = (project.signalData[signalId] as Signal).pinTimes[previousPinId];
        const previousPinValue = (project.signalData[signalId] as Signal).pinValues[previousPinId];

        const thisPinTime = context.nextPinTime;
        const thisPinValue = context.nextPinValue;

        const ppreviousPinTime = (project.signalData[signalId] as Signal).pinTimes[ppreviousPinId];
        const ppreviousPinValue = (project.signalData[signalId] as Signal).pinValues[ppreviousPinId];

        const point1 = [ppreviousPinTime, ppreviousPinValue] as Vec2;
        const point2 = [previousPinTime, previousPinValue] as Vec2;
        const point3 = [thisPinTime, thisPinValue] as Vec2;

        const { a, b, c } = findQuadraticParameters(point1, point2, point3);
        const x = context.frame;

        const value = a * x * x + b * x + c;
        if (isNaN(value)) {
            return context.nextPinValue;
        }
        return value;
}

const parabola = (context: InterpolationFunctionPreContext) => {

    const project = context.project;
    const signalId = context.project.orgData.signalIdByPinId[context.pinId];
    const pinIds = (project.signalData[signalId] as Signal).pinIds;
    const idx = pinIds.indexOf(context.pinId);

    if (idx === 0) {
        return context.range[0];
    }

    const idxMod2 = (idx - 1) % 2;
    if (idxMod2 === 0) {
        return parabolaStart(context);
    } else {
        return parabolaEnd(context);
    }
};

export default parabola;