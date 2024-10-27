import externalFunctions from "../ProduceNextProjectDataState/InterpolationFunctionExternalFunctions";
import type { PinWindow } from './Types';

const getAccessibleExternalScope = (pinWindow : PinWindow, time: number) => {
    const accesibleExternalScope = {
        functions: externalFunctions,
        variables:{
            absoluteTime: time,
            relativeTime:(time-pinWindow.previousPinTime) / (pinWindow.currentPinTime - pinWindow.previousPinTime),
            previousPinValue: pinWindow.previousPinValue,
            previousPinTime: pinWindow.previousPinTime,
            currentPinValue: pinWindow.currentPinValue,
            currentPinTime: pinWindow.currentPinTime,
            PI: Math.PI,
        },
    }
    return accesibleExternalScope;
};

export default getAccessibleExternalScope;
